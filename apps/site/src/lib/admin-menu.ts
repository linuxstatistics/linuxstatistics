/** Admin side menu. Add an entry when its page ships, never before. */
export const ADMIN_MENU = [
  { href: "/admin/", label: "Dashboard" },
  { href: "/admin/suggestions/", label: "Suggestions" },
  { href: "/admin/quiz/", label: "Quiz" },
  { href: "/admin/email/", label: "Email" },
  { href: "/admin/sources/", label: "Data health" },
  { href: "/admin/rank/", label: "Rank" },
  { href: "/admin/affiliates/", label: "Affiliates" },
] as const;
