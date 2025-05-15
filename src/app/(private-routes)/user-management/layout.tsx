"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersPage from "./users/page";
import RolesPage from "./roles/page";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type UserMangamentTabValues = "users" | "roles";
type UserManagementTabsType = {
  label: string;
  value: UserMangamentTabValues;
};

const userManagementTabs: UserManagementTabsType[] = [
  { label: "Users", value: "users" },
  { label: "Roles", value: "roles" },
];

export default function UserManagementLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [tableValue, setTabValue] = useState<UserMangamentTabValues>("users");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const currentPath: string | null = pathname?.split("/")?.[2];
    if (currentPath === "users" || currentPath === "roles") {
      setTabValue(currentPath);
    }
  }, [pathname]);

  const handleTabChange = (newTab: UserMangamentTabValues) => {
    setTabValue(newTab);
    router.push(`/user-management/${newTab}`);
  };
  return (
    <>
      <h3 className="text-2xl font-semibold mb-4 tracking-tight">
        User Management
      </h3>
      <Tabs className="mb-4" value={tableValue}>
        <TabsList className="border-[1px]">
          {userManagementTabs?.map((tab) => (
            <TabsTrigger
              key={tab?.value}
              onClick={() => handleTabChange(tab?.value)}
              value={tab?.value}
            >
              {tab?.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {children}
    </>
  );
}
