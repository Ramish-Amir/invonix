"use client";

import { useAtom } from "jotai";
import { authAtom, authLoadingAtom } from "@/atoms/authAtom";
import type { User } from "firebase/auth";

export function useAuth() {
  const [user] = useAtom(authAtom);
  const [loading] = useAtom(authLoadingAtom);

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
}
