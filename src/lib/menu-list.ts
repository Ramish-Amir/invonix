import { LayoutGrid, LucideIcon, FileText, FolderOpen } from "lucide-react";

/**
 * A complete example:
 * {
      groupLabel: "Projects",
      menus: [
        {
          href: "",
          label: "All Projects",
          active: pathname.includes("/projects"),
          icon: FileText,
          submenus: [],
          submenus: [
            {
              href: "/projects",
              label: "All Projects",
              active: pathname === "/projects",
            },
            {
              href: "/projects/new",
              label: "New Project",
              active: pathname === "/projects/new",
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
      groupLabel: "Projects",
      menus: [
        {
          href: "/projects",
          label: "All Projects",
          active: pathname === "/projects/",
          icon: FolderOpen,
          submenus: [],
        },
      ],
    },
  ];
}
