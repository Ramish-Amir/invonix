// components/AuthSync.tsx
"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useSetAtom } from "jotai";
import { auth } from "@/lib/firebase";
import { authAtom, authLoadingAtom } from "@/atoms/authAtom";

export default function AuthSync({ children }: { children: React.ReactNode }) {
  const setUser = useSetAtom(authAtom);
  const setLoading = useSetAtom(authLoadingAtom);

  useEffect(() => {
    // Subscribe to auth changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      // Regardless of user or null, we've now settled the initial state
      setLoading(false);
    });
    return unsubscribe;
  }, [setUser, setLoading]);

  return <>{children}</>;
}
