"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, signOut } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";

function PlanBadge({ plan, isSuperAdmin }: { plan: string; isSuperAdmin: boolean }) {
  if (isSuperAdmin) {
    return (
      <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    );
  }
  if (plan === "pro") {
    return (
      <svg className="h-4 w-4 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 17l3.5-9L9 13l3-11 3 11 3.5-5L22 17H2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 17h20v3H2z" />
      </svg>
    );
  }
  if (plan === "starter") {
    return (
      <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 17l3.5-9L9 13l3-11 3 11 3.5-5L22 17H2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 17h20v3H2z" />
      </svg>
    );
  }
  return null;
}

export default function Navbar() {
  const router = useRouter();
  const { user, planInfo } = useAuth();

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
            {/* Credits indicator — clickable, links to pricing */}
            {planInfo && !planInfo.is_super_admin && (
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 hover:bg-gray-200 transition"
              >
                <svg className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                {planInfo.credits_remaining} credits
              </Link>
            )}
            {planInfo?.is_super_admin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-600">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                Unlimited
              </span>
            )}

            {/* Username + plan badge */}
            <span className="hidden sm:inline-flex items-center gap-1 text-sm text-gray-600">
              {user.displayName || user.email?.split("@")[0] || "User"}
              {planInfo && (
                <PlanBadge plan={planInfo.plan} isSuperAdmin={planInfo.is_super_admin} />
              )}
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
