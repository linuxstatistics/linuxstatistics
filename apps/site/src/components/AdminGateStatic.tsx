import { useEffect } from "react";
import { useMe } from "../api";
import { Island } from "./Island";
import { AdminGate } from "./AdminGate";

/**
 * For admin pages whose content is built into the HTML (public data only):
 * shows the sign-in note to non-admins and hides the content below it.
 */
function Inner() {
  const { data: me, isLoading } = useMe();
  useEffect(() => {
    const el = document.getElementById("adm-visuals");
    if (el) el.hidden = isLoading || me?.role !== "admin";
  }, [me, isLoading]);
  return <AdminGate>{null}</AdminGate>;
}

export function AdminGateStatic() {
  return (
    <Island>
      <Inner />
    </Island>
  );
}
