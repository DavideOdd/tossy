"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { RoomScreen } from "@/components/room/RoomScreen";
import { useMounted } from "@/hooks/useMounted";

function Inner() {
  const c = useSearchParams().get("c") ?? "";
  return <RoomScreen rawCode={c} />;
}

/** Static-export friendly: the room code travels in the query string (/room/?c=ABC234). */
export default function RoomPage() {
  const mounted = useMounted();
  return <Suspense>{mounted ? <Inner /> : null}</Suspense>;
}
