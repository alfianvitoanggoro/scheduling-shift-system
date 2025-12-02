import { Calendar, ClipboardList, Home, Settings, Users } from "lucide-react";

export type NavigationItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAdmin?: boolean;
};

export type NavigationSection = {
  title: string;
  items: NavigationItem[];
};

export const NAVIGATION: NavigationSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: Home },
      { href: "/shifts", label: "Shifts", icon: Calendar },
      {
        href: "/employees",
        label: "Employees",
        icon: Users,
        requiresAdmin: true,
      },
      {
        href: "/requests",
        label: "Approvals",
        icon: ClipboardList,
        requiresAdmin: true,
      },
      { href: "/unavailability", label: "Unavailability", icon: ClipboardList },
    ],
  },
  {
    title: "Settings",
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];
