import { browserLocalRepo } from "./local-repo";
import { SupabaseRepo } from "./supabase-repo";
import type { RoomRepo } from "./types";

let repo: RoomRepo | null = null;

/** Supabase when NEXT_PUBLIC_SUPABASE_URL/ANON_KEY are set, otherwise the local (same-browser) repo. Client only. */
export function getRepo(): RoomRepo {
  if (!repo) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    repo = url && key ? new SupabaseRepo(url, key) : browserLocalRepo();
  }
  return repo;
}

export const roomUrl = (code: string) =>
  `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/room/?c=${code}`;
