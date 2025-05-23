import {
  SquarePen,
  LayoutGrid,
  LucideIcon,
  FileText,
  FileCog,
} from "lucide-react";

/**
 * A complete example:
 * {
      groupLabel: "Invoices",
      menus: [
        {
          href: "",
          label: "All Invoices",
          active: pathname.includes("/posts"),
          icon: FileText,
          submenus: [],
          submenus: [
            {
              href: "/posts",
              label: "All Posts",
              active: pathname === "/posts",
            },
            {
              href: "/posts/new",
              label: "New Post",
              active: pathname === "/posts/new",
            },
          ],
        },
        {
          href: "/categories",
          label: "Categories",
          active: pathname.includes("/categories"),
          icon: Bookmark,
          submenus: [],
        },
        {
          href: "/tags",
          label: "Tags",
          active: pathname.includes("/tags"),
          icon: Tag,
          submenus: [],
        },
      ],
    },
 */

type Submenu = {
  href: string;
  label: string;
  active: boolean;
};

type Menu = {
  href: string;
  label: string;
  active: boolean;
  icon: LucideIcon;
  submenus: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(pathname: string): Group[] {
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/",
          label: "Dashboard",
          active: pathname === "/",
          icon: LayoutGrid,
          submenus: [],
        },
      ],
    },
    {
      groupLabel: "Invoices",
      menus: [
        {
          href: "/invoices",
          label: "All Invoices",
          active: pathname === "/invoices",
          icon: FileText,
          submenus: [],
        },
        {
          href: "/create-invoice",
          label: "New Invoice",
          active: pathname === "/create-invoice",
          icon: SquarePen,
          submenus: [],
        },
        {
          href: "/invoice-settings",
          label: "Invoice Settings",
          active: pathname === "/invoice-settings",
          icon: FileCog,
          submenus: [],
        },
      ],
    },
  ];
}
