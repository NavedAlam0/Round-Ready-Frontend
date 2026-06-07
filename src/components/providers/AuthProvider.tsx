"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { auth, onAuthStateChanged, type User } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";

export interface PlanInfo {
  plan: string;
  credits_remaining: number;
  is_super_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  planInfo: PlanInfo | null;
  refreshPlan: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  planInfo: null,
  refreshPlan: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const pathname = usePathname();

  const fetchPlan = useCallback(async () => {
    try {
      const res = await apiFetch("/api/payment/plan");
      if (res.ok) {
        const data = await res.json();
        setPlanInfo(data);
      }
    } catch {
      // silently fail
    }
  }, []);

  // Fetch user on auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        fetchPlan();
      } else {
        setPlanInfo(null);
      }
    });
    return unsubscribe;
  }, [fetchPlan]);

  // Re-fetch plan on every page navigation so credits are always fresh
  useEffect(() => {
    if (user) {
      fetchPlan();
    }
  }, [pathname, user, fetchPlan]);

  return (
    <AuthContext.Provider value={{ user, loading, planInfo, refreshPlan: fetchPlan }}>
      {children}
    </AuthContext.Provider>
  );
}
