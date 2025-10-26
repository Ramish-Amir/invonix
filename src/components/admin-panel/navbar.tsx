import { ModeToggle } from "@/components/general/mode-toggle";
import { UserNav } from "@/components/admin-panel/user-nav";
import { SheetMenu } from "@/components/admin-panel/sheet-menu";
import { useAtomValue } from "jotai";
import { userCompanyAtom } from "@/atoms/companyAtom";

interface NavbarProps {
  title?: string;
}

export function Navbar({ title }: NavbarProps) {
  const userCompany = useAtomValue(userCompanyAtom);

  return (
    <header className="sticky top-0 z-10 w-full bg-background/95 border-b dark:border-0 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:shadow-secondary">
      <div className="mx-4 sm:mx-8 flex h-14 items-center">
        <div className="flex items-center space-x-4 lg:space-x-0">
          <SheetMenu />
          {userCompany?.name && (
            <h1 className="font-bold">{userCompany.name}</h1>
          )}
        </div>
        <div className="flex flex-1 items-center space-x-2 justify-end">
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
