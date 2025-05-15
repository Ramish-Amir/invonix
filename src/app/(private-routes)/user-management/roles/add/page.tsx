"use client";

import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Button } from "@/components/ui/button";
import {
  AddRoleForm,
  RoleFormData,
} from "@/components/user-management/add-role-form";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddRolePage() {
  const [roleForm, setRoleForm] = useState<RoleFormData>();
  const router = useRouter();
  const handleSaveRole = async () => {
    console.log("Save role... ");
  };

  return (
    <>
      <div className="flex flex-row justify-between align-middle">
        <h4 className="text-2xl font-semibold tracking-tight">New Role</h4>
        <div className="flex justify-end gap-2 align-middle">
          <Button
            onClick={() => router.push("/user-management/roles")}
            variant={"outline"}
          >
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>
          <Button onClick={handleSaveRole} variant={"default"}>
            <Save size={18} className="mr-2" />
            Save
          </Button>
        </div>
      </div>
      <AddRoleForm onFormUpdate={(data: RoleFormData) => setRoleForm(data)} />
    </>
  );
}
