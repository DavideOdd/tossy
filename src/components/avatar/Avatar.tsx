export type AvatarCfg = {
  skin: string;
  bg: string;
  scarf: string;
  hat: "santa" | "elf" | "wool" | "antlers";
};

const CREAM = "#fbf5e6";

function Hat({ hat }: { hat: AvatarCfg["hat"] }) {
  switch (hat) {
    case "santa":
      return (
        <>
          <path d="M30 38 Q33 12 56 12 Q67 14 75 29 L70 38 Z" fill="#b3202a" />
          <rect x="27" y="34" width="46" height="9" rx="4.5" fill={CREAM} />
          <circle cx="76" cy="29" r="5.5" fill={CREAM} />
        </>
      );
    case "elf":
      return (
        <>
          <path d="M30 38 L52 3 L72 38 Z" fill="#1b6b55" />
          <rect x="27" y="34" width="46" height="8" rx="4" fill="#d4a640" />
          <circle cx="52" cy="4" r="4.5" fill="#f2d98b" />
        </>
      );
    case "wool":
      return (
        <>
          <path d="M30 38 Q30 13 50 13 Q70 13 70 38 Z" fill="#7e141c" />
          <rect x="28" y="33" width="44" height="9" rx="4" fill={CREAM} />
          <circle cx="50" cy="12" r="5.5" fill={CREAM} />
        </>
      );
    case "antlers":
      return (
        <g stroke="#6b4423" strokeWidth="3.2" strokeLinecap="round" fill="none">
          <path d="M36 36 L29 19 M29 19 L22 15 M31 25 L37 19" />
          <path d="M64 36 L71 19 M71 19 L78 15 M69 25 L63 19" />
        </g>
      );
  }
}

export function Avatar({ cfg, size = 64 }: { cfg: AvatarCfg; size?: number }) {
  return (
    <div
      className="overflow-hidden rounded-full ring-2 ring-gold-500/80"
      style={{ width: size, height: size, boxShadow: "0 6px 14px rgba(0,0,0,.45)" }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
        <rect width="100" height="100" fill={cfg.bg} />
        <path d="M12 100 Q14 76 50 74 Q86 76 88 100 Z" fill={cfg.scarf} />
        <circle cx="50" cy="53" r="21" fill={cfg.skin} />
        <circle cx="43" cy="52" r="2.2" fill="#1c130e" />
        <circle cx="57" cy="52" r="2.2" fill="#1c130e" />
        <path d="M43 61 Q50 67 57 61" stroke="#1c130e" strokeWidth="2" strokeLinecap="round" fill="none" />
        <circle cx="38" cy="58" r="3.5" fill="#e8795f" opacity=".35" />
        <circle cx="62" cy="58" r="3.5" fill="#e8795f" opacity=".35" />
        {cfg.hat === "antlers" && <circle cx="50" cy="57" r="3" fill="#b3202a" />}
        <Hat hat={cfg.hat} />
      </svg>
    </div>
  );
}
