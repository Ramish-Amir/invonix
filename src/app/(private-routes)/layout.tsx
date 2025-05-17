"use client";

import { authAtom, authLoadingAtom } from "@/atoms/authAtom";
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { useAtom, useAtomValue } from "jotai";
import { redirect, useRouter } from "next/navigation";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth as fbAuth } from "@/lib/firebase";

export default function PrivateRoute({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = useAtomValue(authAtom);
  const loading = useAtomValue(authLoadingAtom);
  const router = useRouter();

  useEffect(() => {
    // Only redirect when we've finished loading and found no user
    if (!loading && user === null) {
      router.replace("/auth/login");
    }
  }, [loading, user, router]);

  // While loading, render nothing (or a spinner)
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  // If not loading and user is null, we've already redirected
  if (user === null) {
    return null;
  }

  return (
    <AdminPanelLayout>
      <ContentLayout>{children}</ContentLayout>
    </AdminPanelLayout>
  );
}
