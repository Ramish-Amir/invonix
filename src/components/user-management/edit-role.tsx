import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { AddRoleForm, RoleFormData } from "./add-role-form";
import { ScrollArea } from "../ui/scroll-area";

interface EditRoleProps {
  roleId: string;
  resetRoleId: () => void;
}
export function EditRole({ roleId, resetRoleId }: EditRoleProps) {
  const [role, setRole] = useState();
  const [roleForm, setRoleForm] = useState<RoleFormData>();

  return (
    <Sheet
      open={!!roleId}
      onOpenChange={(value) => {
        if (!value) resetRoleId();
      }}
    >
      <SheetContent className="overflow-auto lg:min-w-[600px]">
        <SheetHeader>
          <SheetTitle>Role</SheetTitle>
          <SheetDescription>Role Details</SheetDescription>
        </SheetHeader>
        <AddRoleForm onFormUpdate={(data: RoleFormData) => setRoleForm(data)} />
      </SheetContent>
    </Sheet>
  );
}
