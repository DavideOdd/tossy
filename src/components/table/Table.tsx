"use client";
import { useRef, useState } from "react";
import { TableView, type Entry } from "./TableView";
import { DEMO_PLAYERS, ME } from "./players";

/** Offline demo: everything in memory, no rooms. Real rooms use TableView via RoomScreen. */
export function Table() {
  const [ledger, setLedger] = useState<Entry[]>([]);
  const [status, setStatus] = useState<"playing" | "closing">("playing");
  const seq = useRef(0);
  return (
    <TableView
      roomName="Cena della Vigilia"
      code="DEMO"
      players={DEMO_PLAYERS}
      meId={ME}
      ledger={ledger}
      status={status}
      canClose
      onThrow={(to, cents) => setLedger((l) => [...l, { id: String(++seq.current), from: ME, to, cents }])}
      onClose={() => setStatus("closing")}
    />
  );
}
