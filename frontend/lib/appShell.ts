import type { AppFrameNavItem } from "@/components/AppFrame";

export const DEFAULT_TRAINING_HREF = "/train/simple-interrupted-suture";

type SharedAppSection =
  | "admin"
  | "dashboard"
  | "knowledge"
  | "library"
  | "review"
  | "trainer";

type BuildSharedAppItemsOptions = {
  active?: SharedAppSection;
  reviewHref?: string;
  userRole?: "admin" | "student" | null;
};

export function buildSharedSidebarItems({
  active,
  reviewHref = DEFAULT_TRAINING_HREF,
  userRole,
}: BuildSharedAppItemsOptions): AppFrameNavItem[] {
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
  reviewHref = DEFAULT_TRAINING_HREF,
  userRole,
}: Omit<BuildSharedAppItemsOptions, "active">) {
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
