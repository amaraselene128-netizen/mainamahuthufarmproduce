import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { db } from "@/lib/db";

export type Profile = {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  country_code: string | null;
  avatar_url: string | null;
  bio: string | null;
  skills: string[];
  social_links: Record<string, string>;
  account_mode: "worker" | "hiring";
  two_factor_enabled: boolean;
  suspended: boolean;
  banned: boolean;
};

type AuthState = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const [{ data: p }, { data: roles }] = await Promise.all([
      db.from("profiles").select("*").eq("id", uid).maybeSingle(),
      db.from("user_roles").select("role").eq("user_id", uid),
    ]);
    const prof = (p as unknown as Profile) ?? null;
    const adminRole = Boolean(roles?.some((r: { role: string }) => r.role === "admin"));
    // Hard block suspended/banned accounts. Admins are never auto-logged out.
    if (prof && !adminRole && (prof.banned || prof.suspended)) {
      await db.auth.signOut();
      setProfile(null);
      setIsAdmin(false);
      if (!window.location.pathname.startsWith("/appeal")) {
        window.location.href = `/appeal?reason=${prof.banned ? "banned" : "suspended"}`;
      }
      return;
    }
    setProfile(prof);
    setIsAdmin(adminRole);
  };

  useEffect(() => {
    const { data: sub } = db.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => loadProfile(s.user.id), 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    });
    db.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) loadProfile(data.session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id);
  };

  const signOut = async () => {
    await db.auth.signOut();
    window.location.href = "/";
  };

  return (
    <Ctx.Provider value={{ user: session?.user ?? null, session, profile, isAdmin, loading, refreshProfile, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}