"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function HomePage({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname(); // Get the current pathname

  useEffect(() => {
    // Redirect to /dashboard if the current path is /
    if (pathname === "/") {
      router.push("/dashboard");
    }
  }, [pathname, router]);

  return <>{children}</>;
}
