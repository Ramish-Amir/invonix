import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "../ui/card";

// Define the validation schema using zod
const roleSchema = z.object({
  name: z.string().min(2, {
    message: "Role name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  permissions: z.record(z.boolean()),
});

export type RoleFormData = z.infer<typeof roleSchema>;

const permissionsList = [
  {
    id: "sales_customer",
    label: "Sales and Customer",
    subPermissions: [
      "Payment Received",
      "Payment Received Write",
      "Invoice Update",
      "Sales Order Update",
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    subPermissions: [
      "Product Write",
      "Price Tier",
      "Price Tier Write",
      "Adjustment",
      "Adjustment Write",
    ],
  },
  {
    id: "purchases_vendor",
    label: "Purchases and Vendor",
    subPermissions: ["Vendor", "Vendor Write", "Purchase", "Purchase Write"],
  },
  {
    id: "miscellaneous",
    label: "Miscellaneous",
    subPermissions: [
      "Expense",
      "Expense Write",
      "Pos",
      "Pos Write",
      "Delivery",
      "Delivery Write",
      "Chart Of Accounts",
      "Chart Of Accounts Write",
      "User Management",
      "User Management Write",
      "User Public Access Invitation",
    ],
  },
  {
    id: "reports",
    label: "Reports",
    subPermissions: [
      "Profit and Loss",
      "Payment",
      "Payment Payout",
      "Balance Sheet",
      "Sales By Item",
      "Sales By Customer",
      "Tobacco",
      "Purchase By Item",
      "Purchase By Vendor",
      "Inventory Summary",
      "Inventory Detail",
      "Customer Open Balance",
      "Customer Transactions",
      "Vendor Transactions",
      "Customer Aging",
      "Vendor Aging",
      "Pos Shifts",
    ],
  },
];

interface AddRoleFormProps {
  onFormUpdate: (data: RoleFormData) => void;
}

export function AddRoleForm({ onFormUpdate }: AddRoleFormProps) {
  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: {},
    },
  });

  const [permissionsState, setPermissionsState] = useState(
    permissionsList.reduce((acc, permission) => {
      acc[permission.id] = false;
      permission.subPermissions.forEach((subPermission) => {
        acc[subPermission] = false;
      });
      return acc;
    }, {} as Record<string, boolean>)
  );

  const handleMainPermissionChange = (id: string) => {
    const isChecked = !permissionsState[id];
    setPermissionsState((prevState) => {
      const updatedState = { ...prevState, [id]: isChecked };
      const permissionGroup = permissionsList.find(
        (perm) => perm.id === id
      )?.subPermissions;

      if (permissionGroup) {
        permissionGroup.forEach((subPerm) => {
          updatedState[subPerm] = isChecked;
        });
      }

      return updatedState;
    });
  };

  const handleSubPermissionChange = (subPermission: string) => {
    setPermissionsState((prevState) => ({
      ...prevState,
      [subPermission]: !prevState[subPermission],
    }));
  };

  // Extract the form data
  const formData = form.watch();

  useEffect(() => {
    onFormUpdate({
      ...formData,
      permissions: permissionsState,
    });
  }, [formData.name, formData.description, permissionsState]);

  return (
    <Card className="mt-4">
      <CardHeader />
      <CardContent>
        <Form {...form}>
          <form className="space-y-8">
            <div className="flex flex-wrap gap-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="min-w-[200px] flex-1">
                    <FormLabel>Role Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Role Name" {...field} />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.name?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="min-w-[200px] flex-1">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Role Description" {...field} />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.description?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>

            {/* Permissions */}
            <div>
              <FormLabel>Permissions</FormLabel>
              <div className="flex flex-wrap gap-x-4">
                {permissionsList.map((permission) => (
                  <div
                    key={permission.id}
                    className="mb-2 border-border border-2 p-2 max-w-max rounded-md"
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={permissionsState[permission.id]}
                        onChange={() =>
                          handleMainPermissionChange(permission.id)
                        }
                      />
                      <span className="ml-2">{permission.label}</span>
                    </div>
                    <div className="ml-6">
                      {permission.subPermissions.map((subPerm) => (
                        <div key={subPerm} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={permissionsState[subPerm]}
                            onChange={() => handleSubPermissionChange(subPerm)}
                          />
                          <span className="ml-2">{subPerm}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
