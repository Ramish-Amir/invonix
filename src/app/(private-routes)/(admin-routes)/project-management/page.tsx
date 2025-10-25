"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProjectManagement from "@/components/user-management/project-management";
import PageSpinner from "@/components/general/page-spinner";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function ProjectManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);

  useEffect(() => {
    const companyIdParam = searchParams.get("companyId");
    if (companyIdParam) {
      setCompanyId(companyIdParam);
      loadCompanyInfo(companyIdParam);
    } else {
      router.replace("/company-management");
    }
  }, [searchParams, router]);

  const loadCompanyInfo = async (id: string) => {
    try {
      setIsLoadingCompany(true);
      const companyDoc = await getDoc(doc(db, "companies", id));
      if (companyDoc.exists()) {
        setCompanyName(companyDoc.data().name);
      }
    } catch (error) {
      console.error("Error loading company info:", error);
    } finally {
      setIsLoadingCompany(false);
    }
  };

  if (isLoadingCompany) {
    return <PageSpinner />;
  }

  if (!companyId) {
    return null;
  }

  return <ProjectManagement companyId={companyId} companyName={companyName} />;
}
