"use client";
import { useSyncExternalStore } from "react";

const noop = () => () => {};
/** false during SSR/static export and first hydration, true afterwards (avoids hydration mismatches). */
export const useMounted = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
