import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Wraps protected routes. Redirects unauthenticated users to /auth.
 * Shows a blank screen while the session is being resolved (avoids flash).
 */
const PrivateRoute = () => {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthenticated(!!session);
      setChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session);
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (checking) return null;
  return authenticated ? <Outlet /> : <Navigate to="/auth" replace />;
};

export default PrivateRoute;
