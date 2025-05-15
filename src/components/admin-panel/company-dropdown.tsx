"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAtom } from "jotai";
import { companyIdAtom } from "@/atoms/companyAtom";

const companies = [
  {
    value: "companyId1",
    label: "Costco",
  },
  {
    value: "companyId2",
    label: "Walmart",
  },
  {
    value: "companyId3",
    label: "No Frills",
  },
  {
    value: "companyId4",
    label: "Frescho",
  },
];

export function CompanyDropdown() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = useAtom(companyIdAtom);

  React.useEffect(() => {
    if (!value) {
      setValue(companies?.[0]?.value);
    }
  }, []);

  // Store the search query
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter the companies based on the search query and the label
  const filteredCompanies = companies.filter((company) =>
    company.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? companies.find((company) => company.value === value)?.label
            : "Select company..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput
            placeholder="Search company..."
            value={searchQuery}
            onValueChange={(query) => setSearchQuery(query)}
          />
          <CommandList>
            {filteredCompanies.length === 0 ? (
              <CommandEmpty>No companies found.</CommandEmpty>
            ) : (
              <CommandGroup heading="Your companies">
                {filteredCompanies.map((company) => (
                  <CommandItem
                    className={
                      value === company?.value ? "opacity-100" : "opacity-50"
                    }
                    key={company.value}
                    value={company.label}
                    onSelect={() => {
                      setValue(company.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === company.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {company.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
        <Command>
          <CommandList>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem className="cursor-pointer">
                <Plus className="mr-2 h-4 w-4" /> Add new
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
