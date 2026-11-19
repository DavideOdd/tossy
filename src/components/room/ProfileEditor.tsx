"use client";
import { Avatar, type AvatarCfg } from "@/components/avatar/Avatar";
import { BGS, HATS, SCARFS, SKINS, randomAvatar } from "@/lib/rooms/profile";
import type { Profile } from "@/lib/rooms/types";

const HAT_LABEL: Record<AvatarCfg["hat"], string> = { santa: "Babbo", elf: "Elfo", wool: "Lana", antlers: "Renna" };

function Swatches({ label, values, current, onPick }: { label: string; values: string[]; current: string; onPick: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={label}>
      <span className="w-14 text-xs text-cream-50/60">{label}</span>
      {values.map((v) => (
        <button
          key={v}
          role="radio"
          aria-checked={current === v}
          aria-label={`${label} ${v}`}
          onClick={() => onPick(v)}
          className="grid h-11 w-9 place-items-center"
        >
          <span className={`h-7 w-7 rounded-full transition ${current === v ? "ring-2 ring-gold-300 ring-offset-2 ring-offset-walnut-900" : "ring-1 ring-white/20"}`} style={{ background: v }} />
        </button>
      ))}
    </div>
  );
}

export function ProfileEditor({ value, onChange }: { value: Profile; onChange: (p: Profile) => void }) {
  const set = (patch: Partial<AvatarCfg>) => onChange({ ...value, avatar: { ...value.avatar, ...patch } });
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <Avatar cfg={value.avatar} size={84} />
        <label className="flex-1">
          <span className="text-xs uppercase tracking-widest text-cream-50/60">Il tuo nome</span>
          <input
            value={value.nickname}
            maxLength={24}
            onChange={(e) => onChange({ ...value, nickname: e.target.value })}
            placeholder="Es. Zia Franca"
            autoComplete="nickname"
            className="mt-1 h-12 w-full rounded-xl border border-gold-500/40 bg-felt-900/70 px-3 text-lg font-semibold outline-none placeholder:text-cream-50/30 focus:border-gold-300"
          />
        </label>
      </div>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Cappello">
        <span className="w-14 text-xs text-cream-50/60">Cappello</span>
        {HATS.map((h) => (
          <button
            key={h}
            role="radio"
            aria-checked={value.avatar.hat === h}
            onClick={() => set({ hat: h })}
            className={`min-h-11 rounded-full px-3 text-sm font-semibold ring-1 ${value.avatar.hat === h ? "bg-gold-500 text-walnut-900 ring-gold-300" : "bg-felt-900/70 ring-gold-500/30"}`}
          >
            {HAT_LABEL[h]}
          </button>
        ))}
      </div>
      <Swatches label="Pelle" values={SKINS} current={value.avatar.skin} onPick={(skin) => set({ skin })} />
      <Swatches label="Sfondo" values={BGS} current={value.avatar.bg} onPick={(bg) => set({ bg })} />
      <Swatches label="Sciarpa" values={SCARFS} current={value.avatar.scarf} onPick={(scarf) => set({ scarf })} />
      <button onClick={() => onChange({ ...value, avatar: randomAvatar() })} className="min-h-11 text-sm font-semibold text-gold-300 underline-offset-4 hover:underline">
        🎲 A caso
      </button>
    </div>
  );
}
