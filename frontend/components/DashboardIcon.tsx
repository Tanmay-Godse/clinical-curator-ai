export type DashboardIconName =
  | "activity"
  | "analytics"
  | "book"
  | "dashboard"
  | "logout"
  | "play"
  | "review"
  | "spark"
  | "streak"
  | "target"
  | "tree"
  | "trophy";

export function DashboardIcon({
  className,
  name,
}: {
  className?: string;
  name: DashboardIconName;
}) {
  const commonProps = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...commonProps}>
          <rect height="7" rx="2" width="8" x="3" y="3" />
          <rect height="11" rx="2" width="8" x="13" y="3" />
          <rect height="11" rx="2" width="8" x="3" y="11" />
          <rect height="7" rx="2" width="8" x="13" y="15" />
        </svg>
      );
    case "tree":
      return (
        <svg {...commonProps}>
          <path d="M12 4v5" />
          <path d="M12 9H6v5" />
          <path d="M12 9h6v5" />
          <rect height="4" rx="1.4" width="5" x="9.5" y="2" />
          <rect height="4" rx="1.4" width="5" x="3.5" y="14" />
          <rect height="4" rx="1.4" width="5" x="15.5" y="14" />
        </svg>
      );
    case "trophy":
      return (
        <svg {...commonProps}>
          <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" />
          <path d="M6 5H4a2 2 0 0 0 2 4" />
          <path d="M18 5h2a2 2 0 0 1-2 4" />
          <path d="M12 11v4" />
          <path d="M9 19h6" />
          <path d="M10 15h4v4h-4z" />
        </svg>
      );
    case "analytics":
      return (
        <svg {...commonProps}>
          <path d="M4 20V10" />
          <path d="M10 20V4" />
          <path d="M16 20v-7" />
          <path d="M22 20v-4" />
        </svg>
      );
    case "play":
      return (
        <svg {...commonProps}>
          <path d="M8 6.5v11l9-5.5-9-5.5Z" />
          <path d="M4 19h16" />
        </svg>
      );
    case "review":
      return (
        <svg {...commonProps}>
          <path d="M6 4h9l3 3v13H6z" />
          <path d="M15 4v4h4" />
          <path d="M9 12h6" />
          <path d="M9 16h4" />
        </svg>
      );
    case "activity":
      return (
        <svg {...commonProps}>
          <path d="M3 12h4l2-5 4 10 2-5h6" />
        </svg>
      );
    case "target":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "book":
      return (
        <svg {...commonProps}>
          <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21Z" />
          <path d="M5 5.5V21" />
        </svg>
      );
    case "spark":
      return (
        <svg {...commonProps}>
          <path d="m12 3 1.8 4.8L18.5 9l-4.7 1.3L12 15l-1.8-4.7L5.5 9l4.7-1.2L12 3Z" />
        </svg>
      );
    case "streak":
      return (
        <svg {...commonProps}>
          <path d="M13 3c.7 3-1.2 4.3-2.6 5.7C8.6 10.5 8 11.9 8 13.8A4 4 0 0 0 12 18a4 4 0 0 0 4-4.2c0-2.2-1-3.7-3-5.8-.8-.9-1.2-2.6 0-5Z" />
        </svg>
      );
    case "logout":
      return (
        <svg {...commonProps}>
          <path d="M15 4h4v16h-4" />
          <path d="M10 12h9" />
          <path d="m13 8 4 4-4 4" />
          <path d="M5 4h5" />
          <path d="M5 20h5" />
        </svg>
      );
    default:
      return null;
  }
}
