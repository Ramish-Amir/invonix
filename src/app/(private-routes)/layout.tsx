"use client";

import { authAtom, authLoadingAtom } from "@/atoms/authAtom";
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { useAtomValue } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PageSpinner from "@/components/general/page-spinner";

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

  // While loading, render spinner
  if (loading) {
    return <PageSpinner />;
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
