"use client";

import { authAtom } from "@/atoms/authAtom";
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { useAtom } from "jotai";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth as fbAuth } from "@/lib/firebase";

export default function PrivateRoute({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [auth] = useAtom(authAtom);

  useEffect(() => {
    onAuthStateChanged(fbAuth, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        const uid = user.uid;
        // ...
        console.log("uid", uid);
      } else {
        // User is signed out
        // ...
        console.log("user is logged out");
      }
    });
  }, []);

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
