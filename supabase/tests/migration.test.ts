import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const C = "00000000-0000-0000-0000-00000000000c";
const tx = (n: number) => `10000000-0000-0000-0000-${String(n).padStart(12, "0")}`;

let db: PGlite;
const as = (u: string) => db.query(`select set_config('request.jwt.claim.sub', '${u}', false)`);
const fails = async (p: Promise<unknown>, msg: RegExp) => {
  await expect(p).rejects.toThrow(msg);
};

let room: string;
let code: string;
let mA: string;
let mB: string;
let mC: string;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create schema auth;
    create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;`);
  for (const f of ["0001_rooms_ledger", "0002_lock_rpc_surface", "0003_seats_settlement"]) {
    await db.exec(readFileSync(`supabase/migrations/${f}.sql`, "utf8"));
  }

  await as(A);
  const r = await db.query<{ code: string; member_id: string }>(`select * from create_room('Vigilia','Anna','{"hat":"santa"}')`);
  code = r.rows[0].code;
  mA = r.rows[0].member_id;
  room = (await db.query<{ id: string }>(`select id from rooms where code='${code}'`)).rows[0].id;
  await as(B);
  mB = (await db.query<{ join_room: string }>(`select join_room('${code.toLowerCase()}','Bruno','{}')`)).rows[0].join_room;
  await as(C);
  mC = (await db.query<{ join_room: string }>(`select join_room('${code}','Carla','{}')`)).rows[0].join_room;
});

describe("rooms", () => {
  it("generates a valid 6-char code and an owner", async () => {
    expect(code).toMatch(/^[A-HJKMNP-Z2-9]{6}$/);
    const o = await db.query(`select is_owner from members where id='${mA}'`);
    expect((o.rows[0] as { is_owner: boolean }).is_owner).toBe(true);
  });

  it("joining twice keeps one member", async () => {
    await as(B);
    const again = await db.query<{ join_room: string }>(`select join_room('${code}','Bruno2','{}')`);
    expect(again.rows[0].join_room).toBe(mB);
  });

  it("blocks transfers until the game starts, and non-owners cannot start", async () => {
    await as(B);
    await fails(db.query(`select transfer_coins('${room}','${mC}',50,'${tx(1)}')`), /not playing/);
    await fails(db.query(`select start_game('${room}')`), /not allowed/);
    await as(A);
    await db.query(`select start_game('${room}')`);
  });
});

describe("seats", () => {
  const seats = async () =>
    (await db.query<{ id: string }>(`select id from members where room_id='${room}' order by seat`)).rows.map((r) => r.id);

  it("assigns seats in join order", async () => {
    expect(await seats()).toEqual([mA, mB, mC]);
  });

  it("only the owner reorders, and the order must list every member once", async () => {
    await as(B);
    await fails(db.query(`select set_seats('${room}', array['${mC}','${mB}','${mA}']::uuid[])`), /not allowed/);
    await as(A);
    await fails(db.query(`select set_seats('${room}', array['${mC}','${mB}']::uuid[])`), /every member/);
    await fails(db.query(`select set_seats('${room}', array['${mC}','${mC}','${mA}']::uuid[])`), /every member/);
    await db.query(`select set_seats('${room}', array['${mC}','${mA}','${mB}']::uuid[])`);
    expect(await seats()).toEqual([mC, mA, mB]);
  });
});

describe("ledger", () => {
  it("transfers, is idempotent on client_tx_id, and balances sum to zero", async () => {
    await as(B);
    await db.query(`select transfer_coins('${room}','${mC}',50,'${tx(2)}')`);
    await db.query(`select transfer_coins('${room}','${mC}',50,'${tx(2)}')`); // retry
    await db.query(`select transfer_coins('${room}','${mA}',200,'${tx(3)}')`);
    const n = await db.query<{ n: number }>(`select count(*)::int n from transfers where room_id='${room}'`);
    expect(n.rows[0].n).toBe(2);
    const bal = await db.query<{ member_id: string; cents: number }>(`select member_id, cents::int from balances where room_id='${room}'`);
    const by = Object.fromEntries(bal.rows.map((r) => [r.member_id, r.cents]));
    expect(by[mB]).toBe(-250);
    expect(by[mC]).toBe(50);
    expect(by[mA]).toBe(200);
    expect(Object.values(by).reduce((a, b) => a + b, 0)).toBe(0);
  });

  it("rejects non-euro denominations, self payments and outsiders", async () => {
    await as(B);
    await fails(db.query(`select transfer_coins('${room}','${mC}',3,'${tx(4)}')`), /check/);
    await fails(db.query(`select transfer_coins('${room}','${mB}',5,'${tx(5)}')`), /check|different/);
    await as("00000000-0000-0000-0000-0000000000ff");
    await fails(db.query(`select transfer_coins('${room}','${mC}',5,'${tx(6)}')`), /not a member/);
  });

  it("is append-only", async () => {
    await fails(db.query(`update transfers set cents = 1`), /append-only/);
  });

  it("closing freezes the ledger and only the owner can close", async () => {
    await as(B);
    const ok = JSON.stringify([{ from: mB, to: mA, cents: 200 }, { from: mB, to: mC, cents: 50 }]);
    await fails(db.query(`select close_room('${room}', '${ok}'::jsonb)`), /not allowed/);
    await as(A);
    const wrong = JSON.stringify([{ from: mB, to: mA, cents: 100 }]);
    await fails(db.query(`select close_room('${room}', '${wrong}'::jsonb)`), /do not settle/);
    await db.query(`select close_room('${room}', '${ok}'::jsonb)`);
    await as(B);
    await fails(db.query(`select transfer_coins('${room}','${mC}',5,'${tx(7)}')`), /not playing/);
    await fails(db.query(`select join_room('${code}','Zed','{}')`), /closed/);
  });

  it("preview exposes only name, status and count", async () => {
    const p = await db.query<{ name: string; member_count: number }>(`select * from room_preview('${code}')`);
    expect(p.rows[0].name).toBe("Vigilia");
    expect(p.rows[0].member_count).toBe(3);
  });
});

describe("settlement", () => {
  const pays = async () => (await db.query<{ id: string; to_member: string }>(`select id, to_member from settlement_payments where room_id='${room}' order by cents desc`)).rows;

  it("only the payer approves, only the receiver confirms after approval", async () => {
    const [toA, toC] = await pays();
    await as(A);
    await fails(db.query(`select approve_payment('${toA.id}')`), /not allowed/);
    await as(B);
    await fails(db.query(`select confirm_received('${toA.id}')`), /not allowed/);
    await db.query(`select approve_payment('${toA.id}')`);
    await db.query(`select approve_payment('${toC.id}')`);
    await as(A);
    await db.query(`select confirm_received('${toA.id}')`);
    expect((await db.query<{ status: string }>(`select status from rooms where id='${room}'`)).rows[0].status).toBe("closing");
    await as(C);
    await db.query(`select confirm_received('${toC.id}')`);
    expect((await db.query<{ status: string }>(`select status from rooms where id='${room}'`)).rows[0].status).toBe("completed");
  });
});
