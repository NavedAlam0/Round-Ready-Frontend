"use client";

import { useRouter } from "next/navigation";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PaywallModal({ open, onClose }: PaywallModalProps) {
  const router = useRouter();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
        </div>

        <h3 className="text-center text-lg font-semibold text-gray-900">
          No Credits Remaining
        </h3>
        <p className="mt-2 text-center text-sm text-gray-500">
          You&apos;ve used all your interview credits. Upgrade your plan or buy a top-up to continue practicing.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={() => {
              onClose();
              router.push("/pricing");
            }}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            View Plans & Top-ups
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
