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
    <nav className="border-b border-gray-200 bg-white px-4 py-2.5 sm:px-8 sm:py-3 lg:px-10">
      <div className="mx-auto flex w-full max-w-[1560px] items-center justify-between">
        <Link href="/dashboard" className="text-[15px] sm:text-lg font-bold text-gray-900">
          RoundReady
        </Link>

        {user && (
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden sm:inline text-sm text-gray-600">
              {user.displayName || user.email?.split("@")[0] || "User"}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-md border border-gray-300 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
