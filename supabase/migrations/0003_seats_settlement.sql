-- Tossy 0003: seat order (owner-managed) and closing payments (approve -> PayPal.Me -> confirm).

alter table members add column seat int not null default 0;
update members m set seat = s.rn - 1
from (select id, row_number() over (partition by room_id order by joined_at) rn from members) s
where s.id = m.id;

create or replace function join_room(p_code text, p_nickname text, p_avatar jsonb)
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
  insert into members (room_id, user_id, nickname, avatar, seat)
  values (v_room.id, auth.uid(), trim(p_nickname), coalesce(p_avatar, '{}'),
          (select coalesce(max(seat) + 1, 0) from members where room_id = v_room.id))
  on conflict (room_id, user_id) do update set nickname = excluded.nickname, avatar = excluded.avatar
  returning id into v_member;
  return v_member;
end $$;

-- Owner sets the clockwise seat order: p_order lists every member exactly once.
create function set_seats(p_room uuid, p_order uuid[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform 1 from rooms r
    join members m on m.room_id = r.id and m.user_id = auth.uid() and m.is_owner
    where r.id = p_room and r.status in ('lobby', 'playing') for update of r;
  if not found then raise exception 'not allowed or wrong state'; end if;
  if (select count(*) from members where room_id = p_room) <> coalesce(array_length(p_order, 1), 0)
     or exists (select 1 from members where room_id = p_room and id <> all (p_order))
     or (select count(distinct x) from unnest(p_order) x) <> array_length(p_order, 1) then
    raise exception 'order must list every member once';
  end if;
  update members m set seat = o.ord - 1
  from unnest(p_order) with ordinality as o(id, ord)
  where m.id = o.id and m.room_id = p_room;
end $$;

create table settlement_payments (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  from_member uuid not null references members(id),
  to_member uuid not null references members(id),
  cents int not null check (cents > 0),
  approved_at timestamptz,
  received_at timestamptz,
  check (from_member <> to_member)
);
create index settlement_room_idx on settlement_payments(room_id);
alter table settlement_payments enable row level security;
create policy settlement_read on settlement_payments for select using (is_member(room_id));

-- Closing publishes the payments; the server only checks they zero every balance.
drop function close_room(uuid);
create function close_room(p_room uuid, p_payments jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform owner_transition(p_room, 'playing', 'closing');
  insert into settlement_payments (room_id, from_member, to_member, cents)
  select p_room, (x->>'from')::uuid, (x->>'to')::uuid, (x->>'cents')::int
  from jsonb_array_elements(coalesce(p_payments, '[]'::jsonb)) x;
  if exists (
    select 1 from settlement_payments sp where sp.room_id = p_room and (
      not exists (select 1 from members where id = sp.from_member and room_id = p_room) or
      not exists (select 1 from members where id = sp.to_member and room_id = p_room))
  ) then raise exception 'payment outside room'; end if;
  if exists (
    select 1 from balances b where b.room_id = p_room and b.cents
      + coalesce((select sum(cents) from settlement_payments where from_member = b.member_id), 0)
      - coalesce((select sum(cents) from settlement_payments where to_member = b.member_id), 0) <> 0
  ) then raise exception 'payments do not settle the balances'; end if;
end $$;

-- The payer approves (this is what unlocks the PayPal.Me link in the app).
create function approve_payment(p_payment uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update settlement_payments sp set approved_at = coalesce(sp.approved_at, now())
  from members m, rooms r
  where sp.id = p_payment and m.id = sp.from_member and m.user_id = auth.uid()
    and r.id = sp.room_id and r.status = 'closing';
  if not found then raise exception 'not allowed'; end if;
end $$;

-- The receiver confirms; when every payment is received the room is completed.
create function confirm_received(p_payment uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_room uuid;
begin
  update settlement_payments sp set received_at = coalesce(sp.received_at, now())
  from members m
  where sp.id = p_payment and sp.approved_at is not null
    and m.id = sp.to_member and m.user_id = auth.uid()
  returning sp.room_id into v_room;
  if v_room is null then raise exception 'not allowed or not approved'; end if;
  if not exists (select 1 from settlement_payments where room_id = v_room and received_at is null) then
    update rooms set status = 'completed' where id = v_room;
  end if;
end $$;

do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function set_seats, close_room, approve_payment, confirm_received from anon;
  end if;
  revoke all on function set_seats, close_room, approve_payment, confirm_received from public;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant execute on function set_seats, close_room, approve_payment, confirm_received to authenticated;
  end if;
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table settlement_payments;
  end if;
end $$;
