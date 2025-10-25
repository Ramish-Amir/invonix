"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isAdminUser } from "@/lib/admin-config";
import PageSpinner from "@/components/general/page-spinner";

export default function AdminRoutesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdminUser(user?.uid || null)) {
      router.replace("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <PageSpinner />;
  }

  if (!isAdminUser(user?.uid || null)) {
    return null;
  }

  return <>{children}</>;
}
