-- Tossy 0001: rooms, members, append-only ledger, RLS, RPC.
-- Money is integer euro cents; "coins" are real euro denominations.

create type room_status as enum ('lobby', 'playing', 'closing', 'completed');

create table rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  name text not null check (char_length(name) between 1 and 60),
  status room_status not null default 'lobby',
  currency text not null default 'EUR' check (currency = 'EUR'),
  created_at timestamptz not null default now()
);

create table members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null,
  nickname text not null check (char_length(nickname) between 1 and 24),
  avatar jsonb not null default '{}'::jsonb,
  paypal_me text check (paypal_me ~ '^[A-Za-z0-9]{1,20}$'),
  is_owner boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);
create index members_user_idx on members(user_id);

create table transfers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  from_member uuid not null references members(id),
  to_member uuid not null references members(id),
  cents int not null check (cents in (1, 2, 5, 10, 20, 50, 100, 200)),
  client_tx_id uuid not null,
  created_at timestamptz not null default now(),
  check (from_member <> to_member),
  unique (room_id, client_tx_id)
);
create index transfers_room_idx on transfers(room_id, created_at);

-- Ledger is append-only.
create function forbid_update() returns trigger language plpgsql as $$
begin raise exception 'ledger is append-only'; end $$;
create trigger transfers_no_update before update on transfers
  for each row execute function forbid_update();

create view balances with (security_invoker = true) as
select m.room_id, m.id as member_id,
  coalesce((select sum(t.cents) from transfers t where t.to_member = m.id), 0)
  - coalesce((select sum(t.cents) from transfers t where t.from_member = m.id), 0) as cents
from members m;

-- Helpers
create function is_member(p_room uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where room_id = p_room and user_id = auth.uid())
$$;

-- RLS: members read their room; every write goes through RPC.
alter table rooms enable row level security;
alter table members enable row level security;
alter table transfers enable row level security;
create policy rooms_read on rooms for select using (is_member(id));
create policy members_read on members for select using (is_member(room_id));
create policy transfers_read on transfers for select using (is_member(room_id));

-- Preview for people holding an invite (no membership yet).
create function room_preview(p_code text)
returns table (name text, status room_status, member_count int)
language sql stable security definer set search_path = public as $$
  select r.name, r.status, (select count(*)::int from members m where m.room_id = r.id)
  from rooms r where r.code = upper(p_code)
$$;

create function create_room(p_name text, p_nickname text, p_avatar jsonb)
returns table (code text, member_id uuid)
language plpgsql security definer set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text; v_room uuid; v_member uuid; i int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from rooms where rooms.code = v_code);
  end loop;
  insert into rooms (code, name) values (v_code, trim(p_name)) returning id into v_room;
  insert into members (room_id, user_id, nickname, avatar, is_owner)
  values (v_room, auth.uid(), trim(p_nickname), coalesce(p_avatar, '{}'), true)
  returning id into v_member;
  return query select v_code, v_member;
end $$;

create function join_room(p_code text, p_nickname text, p_avatar jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_room rooms; v_member uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into v_room from rooms where code = upper(p_code) for update;
  if not found then raise exception 'room not found'; end if;
  if v_room.status not in ('lobby', 'playing') then raise exception 'room is closed'; end if;
  if not exists (select 1 from members where room_id = v_room.id and user_id = auth.uid())
     and (select count(*) from members where room_id = v_room.id) >= 20 then
    raise exception 'room is full';
  end if;
  insert into members (room_id, user_id, nickname, avatar)
  values (v_room.id, auth.uid(), trim(p_nickname), coalesce(p_avatar, '{}'))
  on conflict (room_id, user_id) do update set nickname = excluded.nickname, avatar = excluded.avatar
  returning id into v_member;
  return v_member;
end $$;

create function set_paypal_me(p_room uuid, p_handle text) returns void
language sql security definer set search_path = public as $$
  update members set paypal_me = nullif(trim(p_handle), '')
  where room_id = p_room and user_id = auth.uid()
$$;

create function owner_transition(p_room uuid, p_from room_status, p_to room_status) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform 1 from rooms r
    join members m on m.room_id = r.id and m.user_id = auth.uid() and m.is_owner
    where r.id = p_room and r.status = p_from for update of r;
  if not found then raise exception 'not allowed or wrong state'; end if;
  if p_to = 'playing' and (select count(*) from members where room_id = p_room) < 2 then
    raise exception 'need at least 2 players';
  end if;
  update rooms set status = p_to where id = p_room;
end $$;

create function start_game(p_room uuid) returns void language sql security definer set search_path = public as $$
  select owner_transition(p_room, 'lobby', 'playing') $$;
create function close_room(p_room uuid) returns void language sql security definer set search_path = public as $$
  select owner_transition(p_room, 'playing', 'closing') $$;

create function transfer_coins(p_room uuid, p_to uuid, p_cents int, p_tx uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_me uuid; v_id uuid;
begin
  perform 1 from rooms where id = p_room and status = 'playing' for share;
  if not found then raise exception 'room is not playing'; end if;
  select id into v_me from members where room_id = p_room and user_id = auth.uid();
  if v_me is null then raise exception 'not a member'; end if;
  if not exists (select 1 from members where id = p_to and room_id = p_room) then
    raise exception 'recipient not in room';
  end if;
  insert into transfers (room_id, from_member, to_member, cents, client_tx_id)
  values (p_room, v_me, p_to, p_cents, p_tx)
  on conflict (room_id, client_tx_id) do nothing
  returning id into v_id;
  if v_id is null then
    select id into v_id from transfers where room_id = p_room and client_tx_id = p_tx and from_member = v_me;
  end if;
  return v_id;
end $$;

-- Lock down RPC surface: signed-in users only.
revoke all on function create_room, join_room, set_paypal_me, start_game, close_room, transfer_coins, room_preview from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant execute on function create_room, join_room, set_paypal_me, start_game, close_room, transfer_coins, room_preview to authenticated;
    grant select on balances to authenticated;
  end if;
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table rooms, members, transfers;
  end if;
end $$;
