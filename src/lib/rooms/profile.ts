import type { AvatarCfg } from "@/components/avatar/Avatar";
import type { Profile } from "./types";

export const HATS: AvatarCfg["hat"][] = ["santa", "elf", "wool", "antlers"];
export const SKINS = ["#f6d3b3", "#f1c7a0", "#d9a67c", "#a8764f", "#7a4e2f"];
export const BGS = ["#115240", "#7e141c", "#1b6b55", "#9c7424", "#0b3b2c", "#b3202a"];
export const SCARFS = ["#b3202a", "#f2d98b", "#fbf5e6", "#1b6b55", "#d4a640", "#115240"];

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const KEY = "tossy:profile";

export const randomAvatar = (): AvatarCfg => ({ hat: pick(HATS), skin: pick(SKINS), bg: pick(BGS), scarf: pick(SCARFS) });

/** Last used profile (nickname + avatar) or a random one. Browser only. */
export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Profile;
  } catch {}
  return { nickname: "", avatar: randomAvatar() };
}

export function saveProfile(p: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}
