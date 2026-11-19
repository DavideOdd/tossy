"use client";
import { useEffect, useState } from "react";
import { getRepo } from "@/lib/rooms";
import type { Snapshot } from "@/lib/rooms/types";

/** Live room state. `loaded` is false until the first snapshot; `snap === null` after that means "not found". */
export function useRoom(code: string) {
  const [state, setState] = useState<{ loaded: boolean; snap: Snapshot | null }>({ loaded: false, snap: null });
  useEffect(() => {
    if (!code) return;
    return getRepo().subscribe(code, (snap) => setState({ loaded: true, snap }));
  }, [code]);
  return state;
}
