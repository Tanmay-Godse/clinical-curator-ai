import type { AppFrameNavItem } from "@/components/AppFrame";

export const DEFAULT_TRAINING_HREF = "/train/simple-interrupted-suture";

type SharedAppSection =
  | "admin"
  | "dashboard"
  | "developer"
  | "knowledge"
  | "library"
  | "review"
  | "trainer";

type BuildSharedAppItemsOptions = {
  active?: SharedAppSection;
  isDeveloper?: boolean;
  reviewHref?: string;
  userRole?: "admin" | "student" | null;
};

export function buildSharedSidebarItems({
  active,
  isDeveloper = false,
  reviewHref = DEFAULT_TRAINING_HREF,
  userRole,
}: BuildSharedAppItemsOptions): AppFrameNavItem[] {
  if (isDeveloper) {
    return [
      {
        href: "/developer/approvals",
        icon: "review",
        label: "Approvals",
        active: active === "developer",
      },
      {
        href: "/admin/reviews",
        icon: "analytics",
        label: "Admin Queue",
        active: active === "admin",
      },
    ];
  }

  const items: Array<AppFrameNavItem & { key: SharedAppSection | "trainer" }> = [
    {
      href: "/dashboard",
      icon: "dashboard",
      label: "Dashboard",
      key: "dashboard",
    },
    {
      href: DEFAULT_TRAINING_HREF,
      icon: "play",
      label: "Live Session",
      key: "trainer",
    },
    {
      href: reviewHref,
      icon: "review",
      label: "Review",
      key: "review",
    },
    {
      href: "/knowledge",
      icon: "spark",
      label: "Knowledge Lab",
      key: "knowledge",
    },
    {
      href: "/library",
      icon: "book",
      label: "Library",
      key: "library",
    },
  ];

  if (userRole === "admin") {
    items.push({
      href: "/admin/reviews",
      icon: "analytics",
      label: "Admin",
      key: "admin",
    });
  }
  return items.map(({ key, ...item }) => ({
    ...item,
    active: key === active,
  }));
}

export function buildSharedTopItems({
  isDeveloper = false,
  reviewHref = DEFAULT_TRAINING_HREF,
  userRole,
}: Omit<BuildSharedAppItemsOptions, "active">) {
  if (isDeveloper) {
    return [
      { href: "/developer/approvals", label: "Approvals" },
      { href: "/admin/reviews", label: "Admin" },
    ];
  }

  const items = [
    { href: "/dashboard", label: "Dashboard" },
    { href: DEFAULT_TRAINING_HREF, label: "Live Session" },
    { href: "/library", label: "Library" },
  ];

  if (reviewHref) {
    items.push({ href: reviewHref, label: "Review" });
  }

  if (userRole === "admin") {
    items.push({ href: "/admin/reviews", label: "Admin" });
  }
  return items;
}
