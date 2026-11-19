"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LocalNotice, Shell, primaryBtn } from "@/components/room/Shell";
import { ProfileEditor } from "@/components/room/ProfileEditor";
import { useMounted } from "@/hooks/useMounted";
import { getRepo } from "@/lib/rooms";
import { loadProfile, saveProfile } from "@/lib/rooms/profile";
import type { Profile } from "@/lib/rooms/types";

function Form() {
  const router = useRouter();
  const [name, setName] = useState("Tombola di Natale");
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const repo = getRepo();
  const ok = name.trim().length > 0 && profile.nickname.trim().length > 0;

  return (
    <div className="space-y-6">
      <label className="block">
        <span className="text-xs text-cream-50/60">Nome della partita</span>
        <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className="mt-1 h-12 w-full rounded-xl border border-white/10 bg-white/[.05] px-3 text-lg font-semibold outline-none focus:border-gold-300" />
      </label>
      <ProfileEditor value={profile} onChange={setProfile} />
      {repo.kind === "local" && <LocalNotice />}
      {err && <p className="text-sm font-semibold text-[#ff9a94]">{err}</p>}
      <button
        disabled={!ok || busy}
        className={primaryBtn}
        onClick={async () => {
          setBusy(true);
          try {
            saveProfile(profile);
            const code = await repo.createRoom(name, profile);
            router.push(`/room/?c=${code}`);
          } catch (e) {
            setErr(e instanceof Error ? e.message : "Errore");
            setBusy(false);
          }
        }}
      >
        Crea la stanza
      </button>
    </div>
  );
}

export default function NewRoomPage() {
  const mounted = useMounted();
  return <Shell title="Nuova stanza" back="/">{mounted ? <Form /> : null}</Shell>;
}
