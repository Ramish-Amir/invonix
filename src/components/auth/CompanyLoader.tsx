"use client";

import { useEffect } from "react";
import { useAtom } from "jotai";
import { useAtomValue } from "jotai";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { authAtom } from "@/atoms/authAtom";
import { userCompanyAtom, CompanyInfo } from "@/atoms/companyAtom";

export default function CompanyLoader() {
  const user = useAtomValue(authAtom);
  const [, setUserCompany] = useAtom(userCompanyAtom);

  useEffect(() => {
    const loadUserCompany = async () => {
      if (!user) {
        setUserCompany(null);
        return;
      }

      try {
        // Get user profile from adminUsers collection
        const userDoc = await getDoc(doc(db, "adminUsers", user.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Get company name if companyId exists
          if (userData.companyId) {
            const companyDoc = await getDoc(
              doc(db, "companies", userData.companyId)
            );
            if (companyDoc.exists()) {
              const companyData = companyDoc.data();
              const companyInfo: CompanyInfo = {
                id: userData.companyId,
                name: companyData.name,
              };
              setUserCompany(companyInfo);
            }
          }
        }
      } catch (error) {
        console.error("Error loading user company:", error);
        setUserCompany(null);
      }
    };

    loadUserCompany();
  }, [user, setUserCompany]);

  return null; // This component doesn't render anything
}
