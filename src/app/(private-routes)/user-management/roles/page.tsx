"use client";

import { DataTable } from "@/components/admin-panel/data-table";
import { roleColumns } from "./columns";
import { Action } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { EditRole } from "@/components/user-management/edit-role";
import { useEffect, useState } from "react";

const roles = [
  {
    id: "1a2bc3d4",
    name: "Admin",
    description: "All permissions",
  },
  {
    id: "2e3fg4h5",
    name: "User",
    description: "Basic access permissions",
  },
  {
    id: "3i4jk5l6",
    name: "Moderator",
    description: "Can moderate content and users",
  },
  {
    id: "4m5no6p7",
    name: "Editor",
    description: "Can edit content",
  },
  {
    id: "5q6rs7t8",
    name: "Viewer",
    description: "Read-only access",
  },
  {
    id: "6u7vw8x9",
    name: "Support",
    description: "Can provide support to users",
  },
  {
    id: "7y8za9b1",
    name: "Manager",
    description: "Manage teams and assign roles",
  },
  {
    id: "8c1de2f3",
    name: "Developer",
    description: "Can access and modify the system",
  },
  {
    id: "9g4hi5j6",
    name: "Analyst",
    description: "Can view reports and analytics",
  },
  {
    id: "0k7lm8n9",
    name: "Guest",
    description: "Limited access to public data",
  },
];

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const router = useRouter();

  // useEffect(() => {
  //   if (selectedRole !== null) {
  //     setOpenEditSheet(true);
  //   }
  // }, [selectedRole]);

  const handleDeleteRole = async (id: string) => {
    console.log("Delete user... ", id);
  };

  const handleEditRole = async (id: string) => {
    console.log("Edit user... ", id);
  };

  const actions: Action[] = [
    {
      label: "Edit",
      onClick: (id) => setSelectedRole(id),
    },
    {
      label: "Delete",
      onClick: (id) => handleDeleteRole(id),
    },
  ];

  return (
    <>
      <div className="flex flex-row justify-between align-middle">
        <h4 className="text-2xl font-semibold tracking-tight">Roles</h4>
        <Button onClick={() => router.push("/user-management/roles/add")}>
          <Plus size={18} className="mr-2" />
          Add Role
        </Button>
      </div>
      <DataTable
        columns={roleColumns}
        data={roles}
        actions={actions}
        onItemClick={(id) => setSelectedRole(id)}
      />
        <EditRole
          roleId={selectedRole || ""}
          resetRoleId={() => setSelectedRole(null)}
        />
    </>
  );
}
