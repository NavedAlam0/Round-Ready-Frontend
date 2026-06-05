"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, signOut } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";

export default function Navbar() {
  const router = useRouter();
  const { user } = useAuth();

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  return (
    <nav className="border-b border-gray-200 bg-white px-6 sm:px-10 lg:px-16 py-3">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-lg font-bold text-gray-900">
          RoundReady
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.displayName || user.email?.split("@")[0] || "User"}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
