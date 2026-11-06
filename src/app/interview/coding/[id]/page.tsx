"use client";

import { useState, useEffect, useRef, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { saveFinalSubmission, submitPendingCode } from "@/lib/pending-submission";
import Navbar from "@/components/layout/Navbar";
import PaywallModal from "@/components/PaywallModal";
import { useAuth } from "@/components/providers/AuthProvider";
import Editor from "@monaco-editor/react";
import type { DailyCall } from "@daily-co/daily-js";

interface CodingProblem {
  title: string;
  difficulty: string;
  topics: string[];
  description: string;
  examples: { input: string; output: string; explanation: string }[];
  constraints: string[];
  starter_code: Record<string, string>;
  hints: string[];
}

export default function CodingSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const callRef = useRef<DailyCall | null>(null);

  // Session state
  const [status, setStatus] = useState<"connecting" | "waiting" | "active" | "ending" | "ended">("connecting");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Problem & code state
  const [problem, setProblem] = useState<CodingProblem | null>(null);
  const [codingLanguage, setCodingLanguage] = useState("python");
  const languageRef = useRef("python");
  const [code, setCode] = useState("");
  const codeRef = useRef("");
  const lastSyncedCode = useRef("");
  const lastBackedUpCode = useRef("");
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const endingRef = useRef(false);
  const finalizingRef = useRef(false);
  const [submissionError, setSubmissionError] = useState("");

  // UI state
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showProblem, setShowProblem] = useState(true);
  const [mobileTab, setMobileTab] = useState<"code" | "problem">("problem");
  const [showEndWarning, setShowEndWarning] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Fetch coding problem
  useEffect(() => {
    async function fetchProblem() {
      try {
        const res = await apiFetch(`/api/interview/${id}/coding-plan`);
        if (res.ok) {
          const data = await res.json();
          setProblem(data.problem);
          // Rejoining an active interview restores the saved draft.
          const lang = data.context?.coding_language || "python";
          setCodingLanguage(lang);
          languageRef.current = lang;
          const starter = data.problem?.starter_code?.[lang] || "";
          const initialCode = typeof data.saved_code === "string" ? data.saved_code : starter;
          setCode(initialCode);
          codeRef.current = initialCode;
          if (typeof data.saved_code === "string") lastBackedUpCode.current = data.saved_code;
        }
      } catch {}
    }
    if (authUser && !authLoading) fetchProblem();
  }, [id, authUser, authLoading]);

  const finalizeSession = useCallback(async (stopBot: boolean) => {
    if (!authUser || finalizingRef.current) return;
    finalizingRef.current = true;
    endingRef.current = true;
    setStatus("ending");
    setSubmissionError("");
    if (timerRef.current) clearInterval(timerRef.current);
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    if (backupTimerRef.current) clearInterval(backupTimerRef.current);

    // Save before sending: the report page can finish this handoff after a
    // disconnect or reload, using only the signed-in user's pending payload.
    let savedLocally = false;
    try {
      saveFinalSubmission(window.localStorage, authUser.uid, id, {
        code: codeRef.current,
        language: languageRef.current,
      });
      savedLocally = true;
    } catch {}

    try {
      if (savedLocally) {
        await submitPendingCode(apiFetch, window.localStorage, authUser.uid, id, AbortSignal.timeout(15000));
      } else {
        const res = await apiFetch(`/api/interview/${id}/code-sync`, {
          method: "POST",
          body: JSON.stringify({ code: codeRef.current, language: languageRef.current, is_final: true }),
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) throw new Error("Final code submission failed");
      }
    } catch {
      if (!savedLocally) {
        setSubmissionError("Your final code could not be saved. Keep this page open, reconnect, and try submitting again.");
        setStatus("ended");
        finalizingRef.current = false;
        return;
      }
      // The report page displays the failure and retries the saved submission.
    }
    if (stopBot) {
      try {
        const res = await apiFetch(`/api/interview/${id}/end`, { method: "POST", signal: AbortSignal.timeout(15000) });
        if (!res.ok) console.warn("Interview stop request failed; leaving the room will also stop the voice agent.");
      } catch {
        // Leaving the room triggers the agent's completion callback as well.
      }
    }
    if (callRef.current) {
      try {
        await callRef.current.leave();
        callRef.current.destroy();
      } catch {}
      callRef.current = null;
    }
    setStatus("ended");
    router.replace(`/interview/report/${id}`);
  }, [authUser, id, router]);

  // Initialize Daily.co connection
  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.replace("/login");
      return;
    }
    let cancelled = false;

    async function initSession() {
      setStatus("connecting");
      setError("");

      try {
        const res = await apiFetch(`/api/interview/${id}/start`, { method: "POST" });
        if (cancelled) return;

        if (!res.ok) {
          const data = await res.json();
          if (data.detail === "Interview already completed") {
            router.replace(`/dashboard`);
            return;
          }
          if (res.status === 403) {
            setShowPaywall(true);
            return;
          }
          setError(data.detail || "Failed to start coding session");
          return;
        }

        const { room_url, token } = await res.json();
        const Daily = (await import("@daily-co/daily-js")).default;
        if (cancelled) return;

        const call = Daily.createCallObject({
          audioSource: true,
          videoSource: false,
          subscribeToTracksAutomatically: true,
        });
        callRef.current = call;

        call.on("joined-meeting", () => {
          if (cancelled) return;
          setStatus("waiting");
          timerRef.current = setInterval(() => {
            setElapsed((prev) => prev + 1);
          }, 1000);
        });

        call.on("participant-joined", (event) => {
          if (event?.participant?.user_name === "AI Interviewer") {
            setStatus("active");
          }
        });

        call.on("track-started", (event) => {
          if (event?.participant?.local) return;
          if (event?.track?.kind === "audio") {
            const audio = new Audio();
            audio.srcObject = new MediaStream([event.track]);
            audio.autoplay = true;
            audio.play().catch((err) => console.error("Audio play error:", err));
          }
        });

        call.on("participant-left", async (event) => {
          if (!cancelled && event?.participant?.user_name === "AI Interviewer") {
            await finalizeSession(false);
          }
        });

        call.on("error", () => {
          setError("Connection error. Please try again.");
        });

        // Listen for transcript messages
        call.on("app-message", (event) => {
          const data = event?.data;
          if (!data) return;
          if (data.type === "transcript") {
            setTranscript((prev) => [...prev, { role: data.role, text: data.text }]);
          }
        });

        await call.join({ url: room_url, token });
      } catch {
        if (!cancelled) {
          setError("Failed to connect. Make sure your microphone is available.");
        }
      }
    }

    initSession();

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      if (backupTimerRef.current) clearInterval(backupTimerRef.current);
      if (callRef.current) {
        try {
          callRef.current.leave();
          callRef.current.destroy();
        } catch {}
      }
    };
  }, [id, authUser, authLoading, router, finalizeSession]);

  // Code sync to voice agent via Daily.co app-message (debounced 3s)
  const syncCodeToAgent = useCallback((newCode: string) => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      if (!endingRef.current && callRef.current && newCode !== lastSyncedCode.current) {
        callRef.current.sendAppMessage({
          type: "code_sync",
          code: newCode,
          language: languageRef.current,
        }, "*");
        lastSyncedCode.current = newCode;
      }
    }, 3000);
  }, []);

  // Periodic backup to backend (every 30s)
  useEffect(() => {
    backupTimerRef.current = setInterval(() => {
      const currentCode = codeRef.current;
      if (!endingRef.current && currentCode !== lastBackedUpCode.current) {
        apiFetch(`/api/interview/${id}/code-sync`, {
          method: "POST",
          body: JSON.stringify({ code: currentCode, language: languageRef.current, is_final: false }),
        }).then((res) => {
          if (res.ok) lastBackedUpCode.current = currentCode;
        }).catch(() => {});
      }
    }, 30000);
    return () => {
      if (backupTimerRef.current) clearInterval(backupTimerRef.current);
    };
  }, [id]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  function handleCodeChange(value: string | undefined) {
    if (endingRef.current) return;
    const newCode = value || "";
    setCode(newCode);
    codeRef.current = newCode;
    syncCodeToAgent(newCode);
  }

  async function handleEndSession() {
    setShowEndWarning(false);
    await finalizeSession(true);
  }

  function toggleMute() {
    if (callRef.current) {
      callRef.current.setLocalAudio(isMuted);
      setIsMuted(!isMuted);
    }
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  const monacoLanguageMap: Record<string, string> = {
    python: "python",
    javascript: "javascript",
    java: "java",
    cpp: "cpp",
    go: "go",
  };

  const difficultyColor = problem?.difficulty === "easy"
    ? "bg-green-100 text-green-700 border-green-200"
    : problem?.difficulty === "medium"
      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
      : "bg-red-100 text-red-700 border-red-200";

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <Navbar />
      {submissionError && (
        <div role="alert" className="flex items-center justify-between gap-3 bg-amber-50 px-5 py-3 text-sm text-amber-900">
          <p>{submissionError}</p>
          <button onClick={handleEndSession} className="shrink-0 rounded border border-amber-500 px-3 py-1 font-medium">Submit again</button>
        </div>
      )}

      {error ? (
        <main className="flex-1 flex items-center justify-center px-5">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-3 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-red-100">
              <svg className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-[15px] sm:text-xl font-bold text-gray-900">Connection Failed</h2>
            <p className="mt-1.5 text-[11px] sm:text-sm text-gray-500">{error}</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button onClick={() => router.push("/dashboard")} className="rounded-md border border-gray-300 px-3.5 py-1.5 text-[11px] sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Dashboard</button>
              <button onClick={() => window.location.reload()} className="rounded-md bg-blue-600 px-3.5 py-1.5 text-[11px] sm:text-sm font-medium text-white hover:bg-blue-500 transition">Retry</button>
            </div>
          </div>
        </main>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden relative">
          {/* Full-screen overlay while waiting for agent */}
          {(status === "connecting" || status === "waiting") && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm">
              <div className="text-center max-w-sm px-6">
                {/* Animated avatar */}
                <div className="mx-auto mb-6 relative">
                  <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                    <svg className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  {/* Pulsing ring */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 border-blue-400 animate-ping opacity-20" />
                  </div>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {status === "connecting" ? "Setting up your session..." : "Katie is joining..."}
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  {status === "connecting"
                    ? "Connecting to the interview room"
                    : "Your interviewer will be with you in a moment"}
                </p>

                {/* Loading dots */}
                <div className="mt-5 flex items-center justify-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>

                <p className="mt-6 text-xs text-gray-400">
                  Make sure your microphone is enabled
                </p>
              </div>
            </div>
          )}

          {/* Top Status Bar */}
          <div className="border-b border-gray-200 bg-white px-3 py-1.5 sm:px-6 sm:py-2.5 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className={`h-2 w-2 shrink-0 rounded-full ${status === "active" ? "bg-green-500 animate-pulse" : status === "waiting" ? "bg-yellow-500 animate-pulse" : "bg-gray-300"}`} />
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-sm font-semibold text-gray-900 truncate">
                    {problem ? problem.title : "Coding Round"}
                  </p>
                  <p className="text-[9px] sm:text-xs text-gray-500 capitalize">{codingLanguage} {problem ? `· ${problem.difficulty}` : ""}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <div className="text-center">
                  <p className="text-[11px] sm:text-sm font-bold text-gray-900 font-mono">{formatTime(elapsed)}</p>
                </div>
                <div className="text-center hidden md:block">
                  <p className={`text-[11px] sm:text-sm font-medium ${status === "active" ? "text-green-600" : "text-gray-500"}`}>
                    {status === "connecting" ? "Connecting..." : status === "waiting" ? "Waiting for AI..." : status === "active" ? "Live" : status === "ending" ? "Ending..." : "Ended"}
                  </p>
                </div>
                <select
                  value={codingLanguage}
                  disabled={status === "ending" || status === "ended"}
                  onChange={(e) => {
                    const newLang = e.target.value;
                    setCodingLanguage(newLang);
                    languageRef.current = newLang;
                    if (problem?.starter_code?.[newLang] && code === (problem?.starter_code?.[codingLanguage] || "")) {
                      setCode(problem.starter_code[newLang]);
                      codeRef.current = problem.starter_code[newLang];
                    }
                  }}
                  className="rounded-md border border-gray-300 px-2 py-1 text-[10px] sm:text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="go">Go</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mobile Tab Switcher */}
          <div className="md:hidden border-b border-gray-200 bg-white shrink-0">
            <div className="flex">
              <button
                onClick={() => setMobileTab("problem")}
                className={`flex-1 py-2 text-xs font-medium text-center transition ${mobileTab === "problem" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-gray-500"}`}
              >
                Problem
              </button>
              <button
                onClick={() => setMobileTab("code")}
                className={`flex-1 py-2 text-xs font-medium text-center transition ${mobileTab === "code" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-gray-500"}`}
              >
                Code Editor
              </button>
            </div>
          </div>

          {/* Main Content: Problem + Editor */}
          <div className="flex flex-1 overflow-hidden">
            {/* Mobile: Problem Panel (full width, shown by tab) */}
            <div className={`md:hidden ${mobileTab === "problem" ? "flex-1 overflow-y-auto bg-white" : "hidden"}`}>
              {problem && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-gray-900">{problem.title}</h2>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${difficultyColor}`}>
                      {problem.difficulty}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {problem.topics.map((topic) => (
                      <span key={topic} className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">{topic}</span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-700 leading-relaxed mb-4 whitespace-pre-line">{problem.description}</div>
                  <div className="space-y-2.5 mb-4">
                    {problem.examples.map((example, i) => (
                      <div key={i} className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                        <p className="text-[10px] font-semibold text-gray-500 mb-1.5">Example {i + 1}</p>
                        <div className="space-y-1 text-[11px] font-mono">
                          <p><span className="text-gray-500">Input: </span><span className="text-gray-900">{example.input}</span></p>
                          <p><span className="text-gray-500">Output: </span><span className="text-gray-900">{example.output}</span></p>
                          {example.explanation && <p className="text-[10px] text-gray-500 font-sans mt-1">{example.explanation}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mb-4">
                    <p className="text-[10px] font-semibold text-gray-500 mb-1.5">Constraints</p>
                    <ul className="space-y-0.5">
                      {problem.constraints.map((c, i) => (
                        <li key={i} className="text-[11px] text-gray-600 font-mono flex gap-1.5"><span className="text-gray-400">-</span>{c}</li>
                      ))}
                    </ul>
                  </div>
                  <button onClick={() => setMobileTab("code")} className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-medium text-white hover:bg-blue-500 transition">
                    Start Coding
                  </button>
                </div>
              )}
            </div>

            {/* Mobile: Code Editor (full width, shown by tab) */}
            <div className={`md:hidden ${mobileTab === "code" ? "flex-1 flex flex-col min-w-0" : "hidden"}`}>
              <Editor
                height="100%"
                language={monacoLanguageMap[codingLanguage] || "python"}
                value={code}
                onChange={handleCodeChange}
                theme="vs-dark"
                options={{
                  readOnly: status === "ending" || status === "ended",
                  fontSize: 13,
                  minimap: { enabled: false },
                  lineNumbers: "on",
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  tabSize: 4,
                  padding: { top: 8 },
                }}
              />
            </div>

            {/* Desktop: Side-by-side layout */}
            <div className="hidden md:flex flex-1 overflow-hidden">
              {/* Problem Panel (left) */}
              <div className={`${showProblem ? "w-[380px]" : "w-0"} shrink-0 border-r border-gray-200 bg-white overflow-y-auto transition-all duration-300`}>
                {showProblem && problem && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-bold text-gray-900">{problem.title}</h2>
                      <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full border ${difficultyColor}`}>
                        {problem.difficulty}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {problem.topics.map((topic) => (
                        <span key={topic} className="text-[11px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">{topic}</span>
                      ))}
                    </div>
                    <div className="text-[13px] text-gray-700 leading-relaxed mb-4 whitespace-pre-line">{problem.description}</div>
                    <div className="space-y-3 mb-4">
                      {problem.examples.map((example, i) => (
                        <div key={i} className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                          <p className="text-xs font-semibold text-gray-500 mb-1">Example {i + 1}</p>
                          <div className="space-y-1 text-[12px] font-mono">
                            <p><span className="text-gray-500">Input: </span><span className="text-gray-900">{example.input}</span></p>
                            <p><span className="text-gray-500">Output: </span><span className="text-gray-900">{example.output}</span></p>
                            {example.explanation && <p className="text-[11px] text-gray-500 font-sans mt-1">{example.explanation}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">Constraints</p>
                      <ul className="space-y-0.5">
                        {problem.constraints.map((c, i) => (
                          <li key={i} className="text-[12px] text-gray-600 font-mono flex gap-1.5"><span className="text-gray-400">-</span>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle Problem Panel Button */}
              <button
                onClick={() => setShowProblem(!showProblem)}
                className="shrink-0 w-6 flex items-center justify-center border-r border-gray-200 bg-gray-50 hover:bg-gray-100 transition text-gray-400"
              >
                <svg className={`h-4 w-4 transition-transform ${showProblem ? "" : "rotate-180"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>

              {/* Code Editor (right) */}
              <div className="flex-1 flex flex-col min-w-0">
                <Editor
                  height="100%"
                  language={monacoLanguageMap[codingLanguage] || "python"}
                  value={code}
                  onChange={handleCodeChange}
                  theme="vs-dark"
                  options={{
                    readOnly: status === "ending" || status === "ended",
                    fontSize: 14,
                    minimap: { enabled: false },
                    lineNumbers: "on",
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    tabSize: 4,
                    padding: { top: 12 },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bottom Bar: Voice + Controls */}
          <div className="border-t border-gray-200 bg-white px-3 py-2 sm:px-6 sm:py-3 shrink-0">
            <div className="flex items-center justify-between gap-2">
              {/* Left: AI Speaking Indicator */}
              <div className="flex items-center gap-2 min-w-0">
                <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${status === "active" ? "bg-blue-100" : "bg-gray-100"}`}>
                  <svg className={`h-4 w-4 ${status === "active" ? "text-blue-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div className="min-w-0 hidden md:block">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {status === "active" ? "Katie is here" : status === "waiting" ? "Katie is joining..." : status === "connecting" ? "Connecting..." : "Session ended"}
                  </p>
                  <p className="text-xs text-gray-400">AI Coding Interviewer</p>
                  {status === "active" && (
                    <p className="text-[10px] text-blue-500 font-medium animate-pulse">Say &quot;I&apos;m done&quot; when you finish coding</p>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-medium transition ${
                    showTranscript ? "border-blue-300 bg-blue-50 text-blue-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                  <span className="hidden md:inline">Transcript</span>
                  {transcript.length > 0 && <span>({transcript.length})</span>}
                </button>

                <button
                  onClick={toggleMute}
                  className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-medium transition ${
                    isMuted ? "border-red-300 bg-red-50 text-red-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {isMuted ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                  )}
                  <span className="hidden md:inline">{isMuted ? "Unmute" : "Mute"}</span>
                </button>

                <button
                  onClick={() => setShowEndWarning(true)}
                  disabled={status === "ending" || status === "ended"}
                  className="flex items-center gap-1 rounded-lg bg-red-600 px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50 transition"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
                  </svg>
                  <span className="hidden md:inline">End Session</span>
                  <span className="md:hidden">End</span>
                </button>
              </div>
            </div>

            {/* Transcript Panel (slide up) */}
            {showTranscript && (
              <div className="mt-2 sm:mt-3 border-t border-gray-100 pt-2 sm:pt-3 max-h-[150px] sm:max-h-[200px] overflow-y-auto">
                {transcript.length > 0 ? (
                  <div className="space-y-1.5 sm:space-y-2">
                    {transcript.map((entry, i) => (
                      <div key={i} className="flex gap-2">
                        <span className={`text-[10px] sm:text-xs font-bold shrink-0 w-6 ${entry.role === "user" ? "text-gray-500" : "text-blue-600"}`}>
                          {entry.role === "user" ? "You" : "AI"}
                        </span>
                        <p className="text-[10px] sm:text-xs text-gray-700">{entry.text}</p>
                      </div>
                    ))}
                    <div ref={transcriptEndRef} />
                  </div>
                ) : (
                  <p className="text-[10px] sm:text-xs text-gray-400 text-center py-3">No transcript yet. Start speaking to the AI interviewer.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* End Warning Modal */}
      {showEndWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg sm:rounded-xl bg-white p-4 sm:p-6 shadow-xl">
            <div className="flex items-center gap-2.5 mb-2 sm:mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-[14px] sm:text-base font-semibold text-gray-900">End Coding Session?</h3>
            </div>
            <p className="text-[11px] sm:text-sm text-gray-500 mb-4">
              Your current code will be saved and submitted for evaluation. The AI will generate a detailed report on your solution.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowEndWarning(false)} className="rounded-md border border-gray-300 px-3 py-1.5 text-[11px] sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                Keep Coding
              </button>
              <button onClick={handleEndSession} className="rounded-md bg-red-600 px-3 py-1.5 text-[11px] sm:text-sm font-medium text-white hover:bg-red-500 transition">
                End & Get Report
              </button>
            </div>
          </div>
        </div>
      )}
      <PaywallModal open={showPaywall} onClose={() => { setShowPaywall(false); router.push("/dashboard"); }} />
    </div>
  );
}
