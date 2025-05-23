"use client";

import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/admin-panel/sidebar";
import { useAtom } from "jotai";
import { sidebarAtom } from "@/atoms/sidebarAtom";
import { useEffect, useState } from "react";

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen] = useAtom(sidebarAtom);
  // const [isClient, setIsClient] = useState(false);

  // useEffect(() => {
  //   setIsClient(true);
  // }, []);

  // if (!isClient) return null;

  return (
    <>
      <Sidebar />
      <main
        className={cn(
          "min-h-[calc(100vh_-_56px)] bg-gray-100 dark:bg-neutral-900 transition-[margin-left] ease-in-out duration-300",
          isOpen === false ? "lg:ml-[90px]" : "lg:ml-72"
        )}
      >
        {children}
      </main>
    </>
  );
}
