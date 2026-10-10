"use client";

import { useCallback, useSyncExternalStore } from "react";
import { readStorage, subscribeStorage, writeStorage } from "@/lib/storage";

/** A localStorage-backed string that stays in sync across components and tabs. */
export function useStoredString(key: string): [string | null, (v: string | null) => void] {
  const value = useSyncExternalStore(
    subscribeStorage,
    () => readStorage(key),
    () => null,
  );
  const set = useCallback((v: string | null) => writeStorage(key, v), [key]);
  return [value, set];
}
