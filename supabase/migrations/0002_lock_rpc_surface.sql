-- Tossy 0002: tighten RPC grants (applied on the hosted project as part of 0001).
-- Supabase grants EXECUTE to anon by default; only signed-in (anonymous auth) users may call RPCs.
alter function forbid_update() set search_path = public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function create_room, join_room, set_paypal_me, start_game, close_room,
      transfer_coins, room_preview, owner_transition, is_member from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on function owner_transition from authenticated;
  end if;
end $$;
