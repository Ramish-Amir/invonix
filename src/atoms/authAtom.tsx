// store/auth.ts
import { atom } from "jotai";
import type { User } from "firebase/auth";

// Holds the current Firebase user or null
export const authAtom = atom<User | null>(null);

// Tracks whether Firebase has settled its initial state
export const authLoadingAtom = atom(true);
