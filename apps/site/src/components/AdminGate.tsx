import type { ReactNode } from "react";
import { CardsSkeleton } from "./Skeleton";
import { useMe } from "../api";

/** Shows its children only to admins; everyone else gets a sign-in or not-admin note. The API enforces the role either way. */
export function AdminGate({ children }: { children: ReactNode }) {
  const { data: me, isLoading } = useMe();
  if (isLoading) return <CardsSkeleton label="Checking your account" />;
  if (!me) return <p className="adm-gate">Sign in with an admin account to see this page.</p>;
  if (me.role !== "admin") return <p className="adm-gate">Your account isn't an admin. Ask the site owner to add it to ADMIN_USERS.</p>;
  return <>{children}</>;
}
