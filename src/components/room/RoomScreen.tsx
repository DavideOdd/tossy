"use client";
import Link from "next/link";
import { useState } from "react";
import { Lobby } from "@/components/room/Lobby";
import { ProfileEditor } from "@/components/room/ProfileEditor";
import { LocalNotice, Shell, primaryBtn } from "@/components/room/Shell";
import { TableView } from "@/components/table/TableView";
import type { Player } from "@/components/table/players";
import { useRoom } from "@/hooks/useRoom";
import { getRepo } from "@/lib/rooms";
import { normalizeCode } from "@/lib/rooms/code";
import { loadProfile, saveProfile } from "@/lib/rooms/profile";
import type { Profile, Snapshot } from "@/lib/rooms/types";

function JoinGate({ code }: { code: string }) {
  const repo = getRepo();
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Shell title={`Stanza ${code}`} back="/">
      <div className="space-y-6">
        <p className="text-cream-50/80">Scegli nome e avatar per sederti al tavolo.</p>
        <ProfileEditor value={profile} onChange={setProfile} />
        {repo.kind === "local" && <LocalNotice />}
        {err && <p className="text-sm font-semibold text-[#ff9a94]">{err}</p>}
        <button
          className={primaryBtn}
          disabled={!profile.nickname.trim() || busy}
          onClick={async () => {
            setBusy(true);
            try {
              saveProfile(profile);
              await repo.joinRoom(code, profile);
            } catch (e) {
              setErr(e instanceof Error && /closed/.test(e.message) ? "La partita è già chiusa." : e instanceof Error ? e.message : "Errore");
              setBusy(false);
            }
          }}
        >
          Siediti al tavolo
        </button>
      </div>
    </Shell>
  );
}

function Playing({ snap }: { snap: Snapshot }) {
  const repo = getRepo();
  const players: Player[] = snap.members.map((m) => ({ id: m.id, name: m.nickname, cfg: m.avatar }));
  const me = snap.members.find((m) => m.id === snap.meId)!;
  return (
    <TableView
      roomName={snap.name}
      code={snap.code}
      players={players}
      meId={snap.meId!}
      ledger={snap.transfers}
      status={snap.status}
      canClose={me.isOwner}
      onThrow={(to, cents) => repo.transfer(snap.code, to, cents, crypto.randomUUID())}
      onClose={() => repo.closeRoom(snap.code)}
    />
  );
}

export function RoomScreen({ rawCode }: { rawCode: string }) {
  const code = normalizeCode(rawCode);
  const { loaded, snap } = useRoom(code);

  if (code.length !== 6) return <Shell title="Codice non valido" back="/join"><p className="text-cream-50/70">Il codice deve avere 6 caratteri.</p></Shell>;
  if (!loaded) return <Shell title="Un attimo…"><p className="text-cream-50/60">Apro la stanza.</p></Shell>;
  if (!snap) {
    const local = getRepo().kind === "local";
    return (
      <Shell title="Stanza non trovata" back="/">
        <p className="mb-4 text-cream-50/80">Controlla il codice <b className="text-gold-300">{code}</b>.</p>
        {local && <LocalNotice />}
        <Link href="/join" className={`${primaryBtn} mt-6 block text-center`}>Riprova con un altro codice</Link>
      </Shell>
    );
  }
  if (!snap.meId) return <JoinGate code={code} />;
  return snap.status === "lobby" ? <Lobby snap={snap} /> : <Playing snap={snap} />;
}
