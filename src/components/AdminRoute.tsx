import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Wraps the admin route. Redirects to /auth if not logged in,
 * to / if logged in but not an admin.
 */
const AdminRoute = () => {
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<"loading" | "admin" | "not-admin" | "unauth">("loading");

  useEffect(() => {
    const verify = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setStatus("unauth"); setChecking(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", session.user.id)
        .single();

      setStatus(profile?.is_admin ? "admin" : "not-admin");
      setChecking(false);
    };
    verify();
  }, []);

  if (checking) return null;
  if (status === "unauth") return <Navigate to="/auth" replace />;
  if (status === "not-admin") return <Navigate to="/" replace />;
  return <Outlet />;
};

export default AdminRoute;
