"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Action } from "@/lib/utils";

interface TableActionsDropdownProps {
  actions: Action[];
  row: any;
}

export default function TableActionsDropdown({
  actions,
  row,
}: TableActionsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <DotsHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        {actions?.map((action: Action) => (
          <DropdownMenuItem
            key={action.label}
            onClick={() => action.onClick(row.id)}
          >
            {action?.label}
          </DropdownMenuItem>
        ))}
        {/* <DropdownMenuItem
        //   onClick={() => navigator.clipboard.writeText(payment.id)}
        >
          Copy payment ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>View customer</DropdownMenuItem>
        <DropdownMenuItem>View payment details</DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
