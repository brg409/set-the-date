import { Search, Users, Heart, MoreHorizontal, type LucideIcon } from "lucide-react";

export interface TabDef {
  href: string;
  label: string;
  icon: LucideIcon;
  /** True when `pathname` belongs to this tab. */
  isActive: (pathname: string) => boolean;
}

export const TABS: TabDef[] = [
  {
    href: "/",
    label: "Find",
    icon: Search,
    isActive: (p) => p === "/" || p.startsWith("/results") || p.startsWith("/place"),
  },
  {
    href: "/friends",
    label: "Friends",
    icon: Users,
    isActive: (p) => p.startsWith("/friends"),
  },
  {
    href: "/my-places",
    label: "My Places",
    icon: Heart,
    isActive: (p) => p.startsWith("/my-places"),
  },
  {
    href: "/more",
    label: "More",
    icon: MoreHorizontal,
    isActive: (p) => p.startsWith("/more"),
  },
];
