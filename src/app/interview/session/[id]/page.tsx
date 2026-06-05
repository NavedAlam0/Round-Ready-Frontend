"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/components/providers/AuthProvider";

interface Category {
  name: string;
  questions: { text: string; difficulty: number; skill_tested: string }[];
}

interface Plan {
  categories: Category[];
}

interface InterviewContext {
  role_type: string | null;
  company_name: string | null;
}

export default function InterviewSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const callRef = useRef<any>(null);
  const [status, setStatus] = useState<
    "connecting" | "waiting" | "active" | "ending" | "ended"
  >("connecting");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Plan & context
  const [plan, setPlan] = useState<Plan | null>(null);
  const [context, setContext] = useState<InterviewContext | null>(null);
  const [transcriptTab, setTranscriptTab] = useState<"transcript" | "response">("transcript");
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Real-time interview metadata from bot
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentSection, setCurrentSection] = useState("");
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [sectionsProgress, setSectionsProgress] = useState<{ name: string; completed: number; total: number }[]>([]);

  // Fetch plan for sidebar
  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await apiFetch(`/api/interview/${id}/plan`);
        if (res.ok) {
          const data = await res.json();
          setPlan(data.plan);
          if (data.context) setContext(data.context);
        }
      } catch {}
    }
    fetchPlan();
  }, [id]);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.replace("/login");
      return;
    }
    let cancelled = false;

    async function initInterview() {
      setStatus("connecting");
      setError("");

      try {
        const res = await apiFetch(`/api/interview/${id}/start`, {
          method: "POST",
        });
        if (cancelled) return;

        if (!res.ok) {
          const data = await res.json();
          setError(data.detail || "Failed to start interview");
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

        call.on("participant-joined", (event: any) => {
          if (event?.participant?.user_name === "AI Interviewer") {
            setStatus("active");
          }
        });

        call.on("track-started", (event: any) => {
          if (event?.participant?.local) return;
          if (event?.track?.kind === "audio") {
            const audio = new Audio();
            audio.srcObject = new MediaStream([event.track]);
            audio.autoplay = true;
            audio.play().catch((err: any) =>
              console.error("Audio play error:", err)
            );
          }
        });

        call.on("participant-left", (event: any) => {
          if (event?.participant?.user_name === "AI Interviewer") {
            setStatus("ended");
            if (timerRef.current) clearInterval(timerRef.current);
            try {
              call.leave();
              call.destroy();
              callRef.current = null;
            } catch {}
            router.push(`/interview/report/${id}`);
          }
        });

        call.on("error", (event: any) => {
          console.error("Daily error:", event);
          setError("Connection error. Please try again.");
        });

        // Listen for app-message events for transcript + interview metadata
        call.on("app-message", (event: any) => {
          const data = event?.data;
          if (!data) return;

          if (data.type === "transcript") {
            setTranscript((prev) => [
              ...prev,
              { role: data.role, text: data.text },
            ]);
          } else if (data.type === "interview_metadata") {
            setCurrentQuestion(data.question_number || 0);
            setCurrentSection(data.current_section || "");
            setCurrentSectionIndex(data.current_section_index || 0);
            if (data.sections) setSectionsProgress(data.sections);
          }
        });

        await call.join({ url: room_url, token });
      } catch (err) {
        if (!cancelled) {
          console.error("Start interview error:", err);
          setError("Failed to connect. Make sure your microphone is available.");
        }
      }
    }

    initInterview();

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      if (callRef.current) {
        try {
          callRef.current.leave();
          callRef.current.destroy();
        } catch {}
      }
    };
  }, [id, authUser, authLoading]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  async function handleEndInterview() {
    setStatus("ending");
    try {
      await apiFetch(`/api/interview/${id}/end`, { method: "POST" });
    } catch {}
    if (callRef.current) {
      try {
        await callRef.current.leave();
        callRef.current.destroy();
        callRef.current = null;
      } catch {}
    }
    if (timerRef.current) clearInterval(timerRef.current);
    router.push(`/interview/report/${id}`);
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

  const totalQuestions = plan
    ? plan.categories.reduce((sum, cat) => sum + cat.questions.length, 0)
    : 0;

  const difficultyLabel = (d: number) => {
    const labels = ["", "Easy", "Medium", "Moderate", "Hard", "Expert"];
    return labels[d] || "Medium";
  };

  const difficultyColor = (d: number) => {
    if (d <= 2) return "bg-green-100 text-green-700";
    if (d <= 3) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  // Connection quality based on elapsed (simulated)
  const connectionQuality = status === "active" || status === "waiting" ? "Excellent" : "Connecting";
  const audioQuality = status === "active" ? "Good" : status === "waiting" ? "Waiting" : "—";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      {error ? (
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Connection Failed</h2>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button onClick={() => router.push(`/interview/plan/${id}`)} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Back to Plan</button>
              <button onClick={() => window.location.reload()} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition">Retry</button>
            </div>
          </div>
        </main>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Status Bar */}
            <div className="border-b border-gray-200 bg-white px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${status === "active" ? "bg-green-500 animate-pulse" : status === "waiting" ? "bg-yellow-500 animate-pulse" : "bg-gray-300"}`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Interview Session</p>
                    <p className="text-xs text-gray-500">
                      {context?.role_type || "Software Engineer"}{context?.company_name ? ` · ${context.company_name}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Question counter */}
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Question</p>
                    <p className="text-sm font-bold text-gray-900">{currentQuestion > 0 ? currentQuestion : "—"} of {totalQuestions}</p>
                  </div>

                  {/* Elapsed Time */}
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Elapsed Time</p>
                    <div className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-bold text-gray-900 font-mono">{formatTime(elapsed)}</p>
                    </div>
                  </div>

                  {/* Connection */}
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Connection</p>
                    <div className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0" />
                      </svg>
                      <p className={`text-sm font-medium ${connectionQuality === "Excellent" ? "text-green-600" : "text-gray-500"}`}>{connectionQuality}</p>
                    </div>
                  </div>

                  {/* Audio */}
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Audio</p>
                    <div className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                      </svg>
                      <p className={`text-sm font-medium ${audioQuality === "Good" ? "text-green-600" : "text-gray-500"}`}>{audioQuality}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Content */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-6">
              <div className="max-w-3xl mx-auto">
                {/* AI Interviewer Badge + View Plan */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 rounded-full bg-white border border-gray-200 px-4 py-2">
                    <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">AI Interviewer</span>
                  </div>
                  <button
                    onClick={() => router.push(`/interview/plan/${id}`)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    View Plan
                  </button>
                </div>

                {/* AI Avatar */}
                <div className="flex flex-col items-center mb-8">
                  <div className="relative">
                    <div className={`h-28 w-28 rounded-full flex items-center justify-center ${status === "active" ? "bg-gradient-to-br from-blue-500 to-indigo-600" : "bg-gray-200"}`}>
                      {status === "active" ? (
                        <svg className="h-14 w-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                        </svg>
                      ) : (
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                      )}
                    </div>
                    {status === "active" && (
                      <>
                        <div className="absolute inset-0 rounded-full border-4 border-blue-400/30 animate-ping" style={{ animationDuration: "2s" }} />
                        <div className="absolute inset-[-8px] rounded-full border-2 border-blue-300/20 animate-pulse" />
                      </>
                    )}
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-gray-900">AI Interviewer</h2>
                  <p className="text-sm text-gray-500">
                    {status === "connecting" && "Connecting to interview room..."}
                    {status === "waiting" && "Waiting for AI Interviewer to join..."}
                    {status === "active" && "Listening and ready to ask your next question"}
                    {status === "ending" && "Ending interview..."}
                    {status === "ended" && "Interview ended"}
                  </p>
                </div>

                {/* Current Question Card (shown when active) */}
                {status === "active" && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
                    <p className="text-base text-gray-900 leading-relaxed">
                      Speak clearly and take your time. The AI interviewer will ask questions based on your resume and the interview plan.
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-0.5 text-xs font-medium text-blue-700">
                        Interview
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ~5 min response
                      </span>
                    </div>
                  </div>
                )}

                {/* Transcript Area */}
                {(status === "active" || status === "waiting") && (
                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                    {/* Tabs */}
                    <div className="border-b border-gray-100 px-6">
                      <div className="flex gap-6">
                        <button
                          onClick={() => setTranscriptTab("transcript")}
                          className={`py-3 text-sm font-medium border-b-2 transition ${
                            transcriptTab === "transcript"
                              ? "border-blue-600 text-blue-600"
                              : "border-transparent text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          Live Transcript
                        </button>
                        <button
                          onClick={() => setTranscriptTab("response")}
                          className={`py-3 text-sm font-medium border-b-2 transition ${
                            transcriptTab === "response"
                              ? "border-blue-600 text-blue-600"
                              : "border-transparent text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          My Response
                        </button>
                      </div>
                    </div>

                    <div className="p-6 min-h-[160px] max-h-[300px] overflow-y-auto">
                      {transcriptTab === "transcript" ? (
                        <>
                          {transcript.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm text-gray-500">Listening...</span>
                              </div>
                              {/* Audio waveform visualization */}
                              <div className="flex items-center gap-0.5 h-8">
                                {Array.from({ length: 40 }).map((_, i) => (
                                  <div
                                    key={i}
                                    className="w-1 bg-blue-400 rounded-full animate-pulse"
                                    style={{
                                      height: `${Math.random() * 24 + 4}px`,
                                      animationDelay: `${i * 0.05}s`,
                                      animationDuration: `${0.5 + Math.random() * 0.5}s`,
                                    }}
                                  />
                                ))}
                              </div>
                              <p className="mt-4 text-xs text-gray-400">
                                Speak clearly and take your time. The AI interviewer will ask follow-up questions.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {transcript.map((entry, idx) => (
                                <div key={idx} className={`flex gap-3 ${entry.role === "user" ? "justify-end" : ""}`}>
                                  {entry.role !== "user" && (
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                      </svg>
                                    </div>
                                  )}
                                  <div className={`rounded-lg px-4 py-2 max-w-[80%] ${
                                    entry.role === "user"
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-100 text-gray-900"
                                  }`}>
                                    <p className="text-sm">{entry.text}</p>
                                  </div>
                                </div>
                              ))}
                              <div ref={transcriptEndRef} />
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <p className="text-sm text-gray-400">Your responses will appear here as you speak.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Control Bar */}
            {(status === "active" || status === "waiting" || status === "ending") && (
              <div className="border-t border-gray-200 bg-white px-6 py-4">
                <div className="flex items-center justify-center gap-3 max-w-3xl mx-auto">
                  <button
                    onClick={toggleMute}
                    className={`flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-medium transition ${
                      isMuted
                        ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {isMuted ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                      </svg>
                    )}
                    {isMuted ? "Unmute" : "Mute"}
                  </button>

                  <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                    </svg>
                    Pause
                  </button>

                  <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                    </svg>
                    Repeat Question
                  </button>

                  <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" />
                    </svg>
                    Skip Question
                  </button>

                  <button
                    onClick={handleEndInterview}
                    disabled={status === "ending"}
                    className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    End Interview
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-[340px] shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Interview Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-gray-900">Interview Progress</h3>
                  <span className="text-xs text-gray-400">{currentQuestion > 0 ? currentQuestion : "—"} of {totalQuestions} questions</span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden mb-1">
                  <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${totalQuestions > 0 ? (currentQuestion / totalQuestions) * 100 : 0}%` }} />
                </div>
                <p className="text-xs text-green-600 font-medium text-right">{totalQuestions > 0 ? Math.round((currentQuestion / totalQuestions) * 100) : 0}% Complete</p>
              </div>

              {/* Current Section */}
              {plan && plan.categories.length > 0 && (
                <div className="border-t border-gray-100 pt-5">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Current Section</h3>
                  <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-100 p-3">
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900 truncate">{currentSection || plan.categories[0].name}</span>
                    </div>
                    <span className="rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-medium">
                      {currentSectionIndex + 1} / {plan.categories.length}
                    </span>
                  </div>
                </div>
              )}

              {/* Sections List */}
              {plan && (
                <div className="border-t border-gray-100 pt-5">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sections</h3>
                  <div className="space-y-1">
                    {plan.categories.map((cat, idx) => {
                      const sp = sectionsProgress[idx];
                      const completed = sp?.completed || 0;
                      const total = sp?.total || cat.questions.length;
                      const isActive = idx === currentSectionIndex;
                      const isDone = completed >= total && completed > 0;

                      return (
                        <div key={idx} className={`flex items-center gap-3 rounded-lg px-2 py-2 transition ${isActive ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                          <div className={`w-1 h-8 rounded-full ${isDone ? "bg-green-500" : isActive ? "bg-blue-500" : "bg-gray-200"}`} />
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isDone ? "bg-green-100 text-green-600" : isActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
                            {isDone ? (
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            ) : (
                              <span className="text-xs font-bold">{idx + 1}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${isActive ? "text-blue-900 font-medium" : "text-gray-900"}`}>
                              {cat.name}
                            </p>
                          </div>
                          <span className={`text-xs shrink-0 ${isActive ? "text-blue-600 font-medium" : "text-gray-400"}`}>{completed} / {total}</span>
                          <div className={`h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                            isDone ? "border-green-500 bg-green-500" : isActive ? "border-blue-500" : "border-gray-200"
                          }`}>
                            {isDone && (
                              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Speaking Tips */}
              <div className="border-t border-gray-100 pt-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Speaking Tips</h3>
                <div className="space-y-2.5">
                  {[
                    { icon: "sparkle", text: "Speak clearly and at a moderate pace" },
                    { icon: "list", text: "Structure your answers using examples" },
                    { icon: "chart", text: "Quantify impact when possible" },
                    { icon: "bulb", text: "It\u2019s okay to think before answering" },
                  ].map((tip) => (
                    <div key={tip.text} className="flex items-center gap-2.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-600 flex-1">{tip.text}</span>
                      <svg className="h-4 w-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audio Confidence & Answer Quality */}
              <div className="border-t border-gray-100 pt-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center gap-1 mb-2">
                      <p className="text-xs font-semibold text-gray-900">Audio Confidence</p>
                      <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                      </svg>
                    </div>
                    <div className="flex gap-0.5 mb-1.5">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className={`h-3 w-2 rounded-sm ${i < 7 ? "bg-green-500" : "bg-gray-200"}`} />
                      ))}
                    </div>
                    <p className="text-xs font-medium text-green-600">Good</p>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center gap-1 mb-2">
                      <p className="text-xs font-semibold text-gray-900">Answer Quality</p>
                      <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                      </svg>
                    </div>
                    <div className="flex gap-0.5 mb-1.5">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className={`h-3 w-2 rounded-sm ${i < 6 ? "bg-blue-500" : "bg-gray-200"}`} />
                      ))}
                    </div>
                    <p className="text-xs font-medium text-blue-600">On Track</p>
                  </div>
                </div>
              </div>

              {/* Info Note */}
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                <div className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  <p className="text-xs text-blue-600 leading-relaxed">
                    The AI interviewer will ask follow-up questions based on your responses.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
