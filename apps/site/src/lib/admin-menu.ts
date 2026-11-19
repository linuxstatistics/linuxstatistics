/** Admin side menu, grouped. Add an entry when its page ships, never before. */
export const ADMIN_GROUPS = [
  { label: "Overview", items: [{ href: "/admin/", label: "Dashboard" }] },
  {
    label: "Review",
    items: [
      { href: "/admin/suggestions/", label: "Suggestions" },
      { href: "/admin/ratings/", label: "Ratings" },
      { href: "/admin/gaps/", label: "Gaps" },
      { href: "/admin/visuals/", label: "Visuals" },
    ],
  },
  {
    label: "Data",
    items: [
      { href: "/admin/sources/", label: "Data health" },
      { href: "/admin/rank/", label: "Rank" },
    ],
  },
  {
    label: "Audience",
    items: [
      { href: "/admin/quiz/", label: "Quiz" },
      { href: "/admin/email/", label: "Email" },
      { href: "/admin/affiliates/", label: "Affiliates" },
    ],
  },
] as const;

export interface AdminLink { href: string; label: string }
export const ADMIN_MENU: AdminLink[] = ADMIN_GROUPS.flatMap((g): readonly AdminLink[] => g.items);
