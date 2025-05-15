"use client";

import { DataTable } from "@/components/admin-panel/data-table";
import { userColumns } from "./columns";
import { Action } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function UsersPage() {
  const router = useRouter();
  const users = [
    {
      id: "3u1reuv4",
      email: "Abe45@gmail.com",
      fullName: "Abe Smith",
      role: "Admin",
      status: "active",
    },
    {
      id: "9z4jpox7",
      email: "beth32@yahoo.com",
      fullName: "Beth Johnson",
      role: "User",
      status: "pending",
    },
    {
      id: "5mtg2pw3",
      email: "charlie21@outlook.com",
      fullName: "Charlie Davis",
      role: "Moderator",
      status: "inactive",
    },
    {
      id: "7ydxqun9",
      email: "daniel89@gmail.com",
      fullName: "Daniel Lee",
      role: "Admin",
      status: "declined",
    },
    {
      id: "4cvu6r8n",
      email: "emily52@icloud.com",
      fullName: "Emily Thompson",
      role: "User",
      status: "pending",
    },
    {
      id: "6flbe3wx",
      email: "frank42@gmail.com",
      fullName: "Frank Wilson",
      role: "Moderator",
      status: "active",
    },
    {
      id: "2hbws91p",
      email: "grace58@yahoo.com",
      fullName: "Grace Martin",
      role: "User",
      status: "inactive",
    },
    {
      id: "8nvx7pkw",
      email: "henry74@outlook.com",
      fullName: "Henry Clark",
      role: "Admin",
      status: "active",
    },
    {
      id: "1qpm6tgd",
      email: "isabella67@gmail.com",
      fullName: "Isabella White",
      role: "User",
      status: "inactive",
    },
    {
      id: "0wqx8rcl",
      email: "jackson99@yahoo.com",
      fullName: "Jackson Hall",
      role: "Moderator",
      status: "pending",
    },
  ];

  const handleDeleteUser = async (id: string) => {
    console.log("Delete user... ", id);
  };

  const handleEditUser = async (id: string) => {
    console.log("Edit user... ", id);
  };

  const actions: Action[] = [
    {
      label: "Edit",
      onClick: (id) => handleEditUser(id),
    },
    {
      label: "Delete",
      onClick: (id) => handleDeleteUser(id),
    },
  ];

  return (
    <>
      {/* <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Users</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb> */}
      <div className="flex flex-row justify-between align-middle">
        <h4 className="text-2xl font-semibold tracking-tight">Users</h4>
        <Button onClick={() => router.push("/user-management/users/add")}>
          <Plus size={18} className="mr-2" />
          Add User
        </Button>
      </div>

      <DataTable columns={userColumns} data={users} actions={actions} />
    </>
  );
}
