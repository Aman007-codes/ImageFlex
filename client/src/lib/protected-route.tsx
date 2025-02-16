import { useEffect, useState } from "react";
import { Redirect, Route } from "wouter";
import { supabase } from "./supabase";
import { Loader2 } from "lucide-react";
import { Session } from "@supabase/supabase-js";

export function ProtectedRoute({
  component: Component,
  path,
}: {
  component: () => JSX.Element;
  path: string;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Redirect to="/auth" />;
  }

  return <Route path={path} component={Component} />;
}