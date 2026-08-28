import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Moon,
  Search,
  Send,
  Shield,
  Sparkles,
  Star,
  Tags,
  User,
} from "lucide-react";

export type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

export type NavigationGroup = {
  id: string;
  label: string;
  items: NavigationItem[];
};

type NavigationOptions = {
  isAdmin: boolean;
  isProfessional: boolean;
  messageHref?: string;
  messageBadge?: number;
  adminBadge?: number;
};

export function getExploreNavigation(): NavigationGroup[] {
  return [
    {
      id: "explore",
      label: "Explore",
      items: [
        { href: "/professionals", label: "Find Professionals", icon: Search },
        { href: "/categories", label: "Categories", icon: Tags },
        { href: "/jummah", label: "Jumu'ah Finder", icon: Moon },
        { href: "/events", label: "Community Events", icon: CalendarDays },
        { href: "/offers", label: "Community Offers", icon: Megaphone },
        { href: "/request", label: "Service Request", icon: ClipboardList },
        { href: "/advertise", label: "Advertise with Us", icon: Sparkles },
      ],
    },
  ];
}

export function getAccountNavigation({
  isAdmin,
  isProfessional,
  messageHref = "/dashboard/messages",
  messageBadge = 0,
  adminBadge = 0,
}: NavigationOptions): NavigationGroup[] {
  const groups: NavigationGroup[] = [
    {
      id: "account",
      label: "My Account",
      items: [
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/dashboard/profile", label: "My Profile", icon: User },
        { href: "/dashboard/requests", label: "My Requests", icon: FileText },
        { href: messageHref, label: "Messages", icon: MessageCircle, badge: messageBadge },
      ],
    },
  ];

  if (isProfessional) {
    groups.push({
      id: "professional",
      label: "Professional Tools",
      items: [
        { href: "/dashboard/professional", label: "Professional Profile", icon: BriefcaseBusiness },
        { href: "/dashboard/leads", label: "Incoming Requests", icon: Send },
        { href: "/dashboard/promote", label: "Sponsored Listing", icon: Sparkles },
        { href: "/dashboard/featured", label: "Featured Business", icon: Star },
        { href: "/dashboard/offers", label: "Community Offers", icon: Tags },
      ],
    });
  }

  if (isAdmin) {
    groups.push({
      id: "admin",
      label: "Administration",
      items: [
        { href: "/admin", label: "Admin Panel", icon: Shield, badge: adminBadge },
      ],
    });
  }

  return groups;
}
