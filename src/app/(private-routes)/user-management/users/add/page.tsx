"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AddUserPage() {
  const router = useRouter();

  const handleSaveUser = async () => {
    console.log("Save user... ");
  };

  return (
    <>
      <div className="flex flex-row justify-between align-middle">
        <h4 className="text-2xl font-semibold tracking-tight">New User</h4>
        <div className="flex justify-end gap-2 align-middle">
          <Button
            onClick={() => router.push("/user-management/users")}
            variant={"outline"}
          >
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>
          <Button onClick={handleSaveUser} variant={"default"}>
            <Save size={18} className="mr-2" />
            Save
          </Button>
        </div>
      </div>
    </>
  );
}
