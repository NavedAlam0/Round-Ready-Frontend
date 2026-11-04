"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";
import PaywallModal from "@/components/PaywallModal";
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
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
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
  const [interimUserText, setInterimUserText] = useState("");
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Real-time interview metadata from bot
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentSection, setCurrentSection] = useState("");
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [sectionsProgress, setSectionsProgress] = useState<{ name: string; completed: number; total: number }[]>([]);

  // End interview warning
  const [showEndWarning, setShowEndWarning] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

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
          if (data.detail === "Interview already completed") {
            router.replace(`/dashboard`);
            return;
          }
          if (res.status === 403) {
            setShowPaywall(true);
            return;
          }
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
            remoteAudioRef.current?.pause();
            const audio = new Audio();
            audio.srcObject = new MediaStream([event.track]);
            audio.autoplay = true;
            audio.setAttribute("playsinline", "");
            audio.volume = 1;
            remoteAudioRef.current = audio;

            const playAudio = () =>
              audio.play().then(() => {
                console.info("Daily remote audio playback started");
              }).catch((err: any) => {
                console.error("Daily remote audio playback blocked:", err);
              });

            playAudio();
            window.addEventListener("click", playAudio, { once: true });
            window.addEventListener("keydown", playAudio, { once: true });
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
            router.replace(`/interview/report/${id}`);
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
            if (data.role === "user") setInterimUserText("");
            setTranscript((prev) => [
              ...prev,
              { role: data.role, text: data.text },
            ]);
          } else if (data.type === "transcript_interim" && data.role === "user") {
            setInterimUserText(data.text);
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
      remoteAudioRef.current?.pause();
      remoteAudioRef.current = null;
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
  }, [transcript, interimUserText]);

  function handleEndClick() {
    // Count substantive user responses (5+ words, matching backend logic)
    const substantiveResponses = transcript.filter(
      (t) => t.role === "user" && t.text.trim().split(/\s+/).length >= 5
    ).length;

    if (substantiveResponses < 3) {
      setShowEndWarning(true);
      return;
    }

    handleEndInterview();
  }

  async function handleEndInterview() {
    setShowEndWarning(false);
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
    router.replace(`/interview/report/${id}`);
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

  // Connection quality based on status
  const connectionQuality = status === "active" || status === "waiting" ? "Excellent" : "Connecting";
  const audioQuality = status === "active" ? "Good" : status === "waiting" ? "Waiting" : "—";

  // Get the latest AI message for the question card
  const latestAiMessage = [...transcript].reverse().find((t) => t.role !== "user");

  // Current category name
  const currentCatName = currentSection || (plan && plan.categories.length > 0 ? plan.categories[0].name : "");
  const displayedTranscript = interimUserText
    ? [...transcript, { role: "user", text: interimUserText }]
    : transcript;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <Navbar />

      {error ? (
        <main className="flex-1 flex items-center justify-center px-5 sm:px-6">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-3 sm:mb-5 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-red-100">
              <svg className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-[15px] sm:text-xl font-bold text-gray-900">Connection Failed</h2>
            <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-sm text-gray-500">{error}</p>
            <div className="mt-4 sm:mt-6 flex items-center justify-center gap-2 sm:gap-3">
              <button onClick={() => router.push(`/interview/plan/${id}`)} className="rounded-md sm:rounded-lg border border-gray-300 px-3.5 py-1.5 sm:px-5 sm:py-2.5 text-[11px] sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Back to Plan</button>
              <button onClick={() => window.location.reload()} className="rounded-md sm:rounded-lg bg-blue-600 px-3.5 py-1.5 sm:px-5 sm:py-2.5 text-[11px] sm:text-sm font-medium text-white hover:bg-blue-500 transition">Retry</button>
            </div>
          </div>
        </main>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Status Bar */}
            <div className="border-b border-gray-200 bg-white px-4 sm:px-6 py-2 sm:py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full ${status === "active" ? "bg-green-500 animate-pulse" : status === "waiting" ? "bg-yellow-500 animate-pulse" : "bg-gray-300"}`} />
                  <div>
                    <p className="text-[11px] sm:text-sm font-semibold text-gray-900">Interview Session</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      {context?.role_type || "Software Engineer"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-6">
                  <div className="text-center">
                    <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase tracking-wide">Elapsed Time</p>
                    <div className="flex items-center gap-1">
                      <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-[11px] sm:text-sm font-bold text-gray-900 font-mono">{formatTime(elapsed)}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase tracking-wide">Connection</p>
                    <div className="flex items-center gap-1">
                      <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0" />
                      </svg>
                      <p className={`text-[11px] sm:text-sm font-medium ${connectionQuality === "Excellent" ? "text-green-600" : "text-gray-500"}`}>{connectionQuality}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase tracking-wide">Audio</p>
                    <div className="flex items-center gap-1">
                      <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                      </svg>
                      <p className={`text-[11px] sm:text-sm font-medium ${audioQuality === "Good" ? "text-green-600" : "text-gray-500"}`}>{audioQuality}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Content */}
            <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-10 py-2 sm:py-4">
              <div className="max-w-3xl mx-auto w-full flex flex-col flex-1 min-h-0">
                {/* AI Avatar Orb */}
                <div className="flex flex-col items-center mb-2 sm:mb-4 shrink-0">
                  <div className="relative mb-2 sm:mb-4" style={{ width: 100, height: 100 }}>
                    {status === "active" && (
                      <div className="absolute inset-[-10px] rounded-full animate-pulse" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)" }} />
                    )}
                    <svg className="absolute inset-0 animate-[spin_20s_linear_infinite]" width="100" height="100" viewBox="0 0 140 140" fill="none">
                      <circle cx="70" cy="70" r="66" stroke="#c7d2e8" strokeWidth="0.8" strokeDasharray="4 3" />
                      <circle cx="70" cy="4" r="3" fill="#6b8abf" />
                      <circle cx="136" cy="70" r="3.5" fill="#7c9fd4" />
                      <circle cx="24" cy="124" r="2.5" fill="#94b3de" />
                    </svg>
                    <div className="absolute inset-[14px] sm:inset-[18px] rounded-full border border-blue-200/40" />
                    <div className="absolute inset-[22px] sm:inset-[30px] rounded-full shadow-[0_0_30px_rgba(59,130,246,0.15)] flex items-center justify-center" style={{ background: "radial-gradient(circle, #ffffff 0%, #eff6ff 50%, #dbeafe 100%)" }}>
                      {status === "active" || status === "waiting" ? (
                        <svg className="w-7 h-5 sm:w-10 sm:h-8" viewBox="0 0 40 32" fill="none">
                          {(() => {
                            const bars = [3,5,7,5,10,13,7,15,20,24,28,30,28,24,20,15,10,13,7,5,8,4,5,3];
                            return bars.map((h, i) => (
                              <rect key={i} x={1 + i * 1.65} y={16 - h / 2} width="1.1" height={h} rx="0.5" fill="#2563eb" className={status === "active" ? "animate-pulse" : ""} style={status === "active" ? { animationDelay: `${i * 0.05}s`, animationDuration: `${0.8 + Math.random() * 0.4}s` } : undefined} />
                            ));
                          })()}
                        </svg>
                      ) : (
                        <div className="h-5 w-5 sm:h-6 sm:w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      )}
                    </div>
                  </div>

                  {/* AI Interviewer + Listening badge */}
                  <div className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-white border border-gray-200 px-3 py-1 sm:px-4 sm:py-1.5 mb-1.5 sm:mb-3">
                    <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    <span className="text-[11px] sm:text-[13px] font-medium text-blue-600">AI Interviewer</span>
                    {status === "active" && (
                      <>
                        <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-green-500" />
                        <span className="text-[11px] sm:text-[13px] text-gray-600">Listening</span>
                      </>
                    )}
                    {status === "waiting" && (
                      <span className="text-[11px] sm:text-[13px] text-gray-400">Connecting...</span>
                    )}
                  </div>

                  <h2 className="text-[14px] sm:text-lg font-semibold text-gray-900">AI Interviewer</h2>
                  <p className="text-[11px] sm:text-[13px] text-gray-500">
                    {status === "connecting" && "Connecting to interview room..."}
                    {status === "waiting" && "Waiting for AI Interviewer to join..."}
                    {status === "active" && "Listening and ready for your response"}
                    {status === "ending" && "Ending interview..."}
                    {status === "ended" && "Interview ended"}
                  </p>
                </div>

                {/* Waveform visualization bar */}
                {(status === "active" || status === "waiting") && (
                  <div className="flex items-center justify-center gap-[1.5px] sm:gap-[2px] h-4 sm:h-6 mb-2 sm:mb-4 shrink-0">
                    {Array.from({ length: 60 }).map((_, i) => {
                      const center = 30;
                      const dist = Math.abs(i - center);
                      const maxH = Math.max(3, 18 - dist * 0.5);
                      const h = status === "active" ? Math.random() * maxH + 2 : 2;
                      return (
                        <div
                          key={i}
                          className={`w-[2px] rounded-full ${status === "active" ? "bg-blue-400" : "bg-gray-300"}`}
                          style={{ height: `${h}px`, transition: "height 0.2s" }}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Transcript Area — fills remaining space, only this scrolls */}
                {(status === "active" || status === "waiting") && (
                  <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col flex-1 min-h-0">
                    {/* Tabs */}
                    <div className="border-b border-gray-100 px-3 sm:px-5 shrink-0">
                      <div className="flex gap-4 sm:gap-5">
                        <button
                          onClick={() => setTranscriptTab("transcript")}
                          className={`py-2 sm:py-2.5 text-[11px] sm:text-[13px] font-medium border-b-2 transition ${
                            transcriptTab === "transcript"
                              ? "border-blue-600 text-blue-600"
                              : "border-transparent text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          Live Transcript
                        </button>
                        <button
                          onClick={() => setTranscriptTab("response")}
                          className={`py-2 sm:py-2.5 text-[11px] sm:text-[13px] font-medium border-b-2 transition ${
                            transcriptTab === "response"
                              ? "border-blue-600 text-blue-600"
                              : "border-transparent text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          My Response
                        </button>
                      </div>
                    </div>

                    <div className="p-3 sm:p-5 flex-1 overflow-y-auto">
                      {transcriptTab === "transcript" ? (
                        <>
                          {displayedTranscript.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-4 sm:py-6">
                              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                                <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[11px] sm:text-sm text-gray-500">Listening...</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3 sm:space-y-4">
                              {displayedTranscript.map((entry, idx) => (
                                <div key={idx} className="flex items-start gap-2 sm:gap-3">
                                  {entry.role !== "user" ? (
                                    <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                      <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                      </svg>
                                    </div>
                                  ) : (
                                    <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                                      <span className="text-[10px] sm:text-xs font-bold">N</span>
                                    </div>
                                  )}
                                  <div className={`flex-1 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 ${
                                    entry.role === "user"
                                      ? "bg-gray-50 text-gray-900"
                                      : "bg-blue-50 text-gray-900"
                                  }`}>
                                    <p className="text-[11px] sm:text-[13px] leading-relaxed">{entry.text}</p>
                                  </div>
                                  <span className="text-[9px] sm:text-[11px] text-gray-400 shrink-0 mt-1.5 sm:mt-2">{formatTime(elapsed)}</span>
                                </div>
                              ))}
                              <div ref={transcriptEndRef} />
                            </div>
                          )}

                        </>
                      ) : (
                        <div className="space-y-3">
                          {displayedTranscript.filter((t) => t.role === "user").length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-4 sm:py-6 text-center">
                              <p className="text-[11px] sm:text-[13px] text-gray-400">Your answer will appear here as you speak...</p>
                            </div>
                          ) : (
                            displayedTranscript.filter((t) => t.role === "user").map((entry, idx) => (
                              <div key={idx} className="rounded-lg bg-gray-50 px-3 py-2 sm:px-4 sm:py-2.5">
                                <p className="text-[11px] sm:text-[13px] text-gray-900 leading-relaxed">{entry.text}</p>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Control Bar — Only Mute + End Interview */}
            {(status === "active" || status === "waiting" || status === "ending") && (
              <div className="border-t border-gray-200 bg-white px-4 sm:px-6 py-2 sm:py-3 shrink-0">
                <div className="flex items-center justify-center gap-3 sm:gap-4 max-w-3xl mx-auto">
                  <button
                    onClick={toggleMute}
                    className={`flex items-center gap-1.5 sm:gap-2 rounded-full border px-4 py-2 sm:px-6 sm:py-3 text-[11px] sm:text-sm font-medium transition ${
                      isMuted
                        ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                    {isMuted ? "Unmute" : "Mute"}
                  </button>

                  <button
                    onClick={handleEndClick}
                    disabled={status === "ending"}
                    className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-red-600 px-4 py-2 sm:px-6 sm:py-3 text-[11px] sm:text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition"
                  >
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    End Interview
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* End Interview Warning Modal */}
      {showEndWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl max-w-md w-full mx-4 p-4 sm:p-6">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-[14px] sm:text-lg font-semibold text-gray-900">End interview early?</h3>
            </div>
            <p className="text-[11px] sm:text-sm text-gray-600 mb-4 sm:mb-6">
              You haven&apos;t answered enough questions yet. If you end the interview now, <span className="font-medium text-gray-900">you will not receive a feedback report</span>. We recommend answering at least 3 questions before ending.
            </p>
            <div className="flex items-center gap-2 sm:gap-3 justify-end">
              <button
                onClick={() => setShowEndWarning(false)}
                className="rounded-md sm:rounded-lg border border-gray-300 px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Continue Interview
              </button>
              <button
                onClick={handleEndInterview}
                className="rounded-md sm:rounded-lg bg-red-600 px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-sm font-medium text-white hover:bg-red-500 transition"
              >
                End Anyway
              </button>
            </div>
          </div>
        </div>
      )}
      <PaywallModal open={showPaywall} onClose={() => { setShowPaywall(false); router.push("/dashboard"); }} />
    </div>
  );
}
