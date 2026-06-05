"use client";

import { auth } from "./firebase";

export async function getToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export function getUser(): { id: string; email: string; full_name: string } | null {
  const user = auth.currentUser;
  if (!user) return null;
  return {
    id: user.uid,
    email: user.email || "",
    full_name: user.displayName || user.email?.split("@")[0] || "",
  };
}

export function isAuthenticated(): boolean {
  return !!auth.currentUser;
}

export function clearAuth() {
  // Firebase sign out is handled separately
}
