"use client";

import { authAtom } from "@/atoms/authAtom";
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { useAtom } from "jotai";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function PrivateRoute({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [auth] = useAtom(authAtom);

  useEffect(() => {
    if (!auth) {
      return redirect("/auth/login");
    }
  }, []);

  return (
    <AdminPanelLayout>
      <ContentLayout>{children}</ContentLayout>
    </AdminPanelLayout>
  );
}
