import type { AvatarCfg } from "@/components/avatar/Avatar";

export type Player = { id: string; name: string; cfg: AvatarCfg; paypalMe?: string | null };

export const ME = "me";

export const DEMO_PLAYERS: Player[] = [
  { id: ME, name: "Tu", cfg: { skin: "#f1c7a0", bg: "#115240", scarf: "#b3202a", hat: "santa" } },
  { id: "rosa", name: "Nonna Rosa", cfg: { skin: "#f6d3b3", bg: "#7e141c", scarf: "#f2d98b", hat: "wool" } },
  { id: "gigi", name: "Zio Gigi", cfg: { skin: "#d9a67c", bg: "#1b6b55", scarf: "#fbf5e6", hat: "antlers" } },
  { id: "marta", name: "Marta", cfg: { skin: "#f1c7a0", bg: "#9c7424", scarf: "#1b6b55", hat: "elf" } },
  { id: "luca", name: "Luca", cfg: { skin: "#a8764f", bg: "#0b3b2c", scarf: "#d4a640", hat: "santa" } },
  { id: "pino", name: "Cugino Pino", cfg: { skin: "#f6d3b3", bg: "#b3202a", scarf: "#115240", hat: "wool" } },
];

/** Seat position (percent) on an upper arc for the i-th of m other players. */
export function seatPos(i: number, m: number) {
  const from = 198;
  const to = -18;
  const deg = m === 1 ? 90 : from + ((to - from) * i) / (m - 1);
  const r = (deg * Math.PI) / 180;
  return { left: 50 + 38 * Math.cos(r), top: 68 - 44 * Math.sin(r) };
}
