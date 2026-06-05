"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/components/providers/AuthProvider";

interface InterviewItem {
  id: string;
  status: string;
  role_type: string | null;
  level: string | null;
  employment_type: string | null;
  company_name: string | null;
  overall_score: number | null;
  created_at: string;
}

function statusLabel(status: string) {
  switch (status) {
    case "setup":
      return { text: "Setup", color: "bg-gray-100 text-gray-600" };
    case "planned":
      return { text: "Ready", color: "bg-blue-100 text-blue-700" };
    case "in_progress":
      return { text: "In Progress", color: "bg-yellow-100 text-yellow-700" };
    case "completed":
      return { text: "Completed", color: "bg-orange-100 text-orange-700" };
    case "evaluated":
      return { text: "Evaluated", color: "bg-green-100 text-green-700" };
    default:
      return { text: status, color: "bg-gray-100 text-gray-600" };
  }
}

function scoreColor(score: number) {
  if (score >= 8) return "text-green-600";
  if (score >= 6) return "text-yellow-600";
  return "text-red-600";
}

function scoreBg(score: number) {
  if (score >= 8) return "bg-green-50 border-green-200";
  if (score >= 6) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

function interviewLink(iv: InterviewItem) {
  if (iv.status === "evaluated") return `/interview/report/${iv.id}`;
  if (iv.status === "completed") return `/interview/report/${iv.id}`;
  if (iv.status === "in_progress") return `/interview/session/${iv.id}`;
  if (iv.status === "planned") return `/interview/plan/${iv.id}`;
  return `/interview/setup`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.replace("/login");
      return;
    }
    fetchInterviews();
  }, [authUser, authLoading, router]);

  async function fetchInterviews() {
    try {
      const res = await apiFetch("/api/interviews");
      if (res.ok) {
        const data = await res.json();
        setInterviews(data.interviews || []);
      }
    } catch (e) {
      console.error("Failed to fetch interviews:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this interview?")) return;
    setDeleting(id);
    try {
      const res = await apiFetch(`/api/interview/${id}`, { method: "DELETE" });
      if (res.ok) {
        setInterviews((prev) => prev.filter((iv) => iv.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete interview:", e);
    } finally {
      setDeleting(null);
    }
  }

  if (authLoading || !authUser) {
    return null;
  }

  const user = {
    full_name: authUser.displayName || authUser.email?.split("@")[0] || "User",
  };

  // Compute stats
  const totalInterviews = interviews.length;
  const scoredInterviews = interviews.filter((iv) => iv.overall_score !== null);
  const avgScore =
    scoredInterviews.length > 0
      ? (
          scoredInterviews.reduce((sum, iv) => sum + (iv.overall_score || 0), 0) /
          scoredInterviews.length
        ).toFixed(1)
      : null;
  const bestScore =
    scoredInterviews.length > 0
      ? Math.max(...scoredInterviews.map((iv) => iv.overall_score || 0))
      : null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 w-full px-6 sm:px-10 lg:px-16 py-8">
        {/* Welcome Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {user?.full_name}
              </h1>
              <p className="mt-1 text-blue-100">
                Ready to practice? Start a new session or review your past
                interviews.
              </p>
            </div>
            <Link
              href="/interview/setup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow hover:bg-blue-50 transition shrink-0"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              New Interview
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm font-medium text-gray-500">
              Total Interviews
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {totalInterviews}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm font-medium text-gray-500">Average Score</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {avgScore ? (
                <>
                  {avgScore}
                  <span className="text-lg text-gray-400">/10</span>
                </>
              ) : (
                <span className="text-gray-300">--</span>
              )}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm font-medium text-gray-500">Best Score</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {bestScore !== null ? (
                <>
                  {bestScore}
                  <span className="text-lg text-gray-400">/10</span>
                </>
              ) : (
                <span className="text-gray-300">--</span>
              )}
            </p>
          </div>
        </div>

        {/* Interview History */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">
            Interview History
          </h2>

          {loading ? (
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl bg-gray-200"
                />
              ))}
            </div>
          ) : interviews.length === 0 ? (
            <div className="mt-4 rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <svg
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-semibold text-gray-900">
                No interviews yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Start your first practice interview and get detailed feedback.
              </p>
              <Link
                href="/interview/setup"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition"
              >
                Start Your First Interview
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {interviews.map((iv) => {
                const status = statusLabel(iv.status);
                return (
                  <div
                    key={iv.id}
                    className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 sm:p-5 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <Link
                      href={interviewLink(iv)}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base font-semibold text-gray-900 truncate">
                          {iv.company_name || "Practice Interview"}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}
                        >
                          {status.text}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-sm text-gray-500">
                        {iv.role_type && (
                          <>
                            <span>{iv.role_type}</span>
                            <span className="text-gray-300">|</span>
                          </>
                        )}
                        {iv.level && (
                          <>
                            <span className="capitalize">{iv.level}</span>
                            <span className="text-gray-300">|</span>
                          </>
                        )}
                        <span>
                          {new Date(iv.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </Link>

                    <div className="ml-4 flex items-center gap-4">
                      {iv.overall_score !== null && (
                        <div
                          className={`flex items-baseline gap-0.5 rounded-lg border px-3 py-1.5 ${scoreBg(iv.overall_score)}`}
                        >
                          <span
                            className={`text-xl font-bold ${scoreColor(iv.overall_score)}`}
                          >
                            {iv.overall_score}
                          </span>
                          <span className="text-xs text-gray-400">/10</span>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDelete(iv.id);
                        }}
                        disabled={deleting === iv.id}
                        className="rounded-lg p-2 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                        title="Delete interview"
                      >
                        {deleting === iv.id ? (
                          <svg
                            className="h-5 w-5 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
