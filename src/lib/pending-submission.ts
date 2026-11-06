export interface FinalSubmission {
  code: string;
  language: string;
}

type SubmissionStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type Fetcher = (path: string, options?: RequestInit) => Promise<Response>;

export class SubmissionError extends Error {
  constructor(message: string, public readonly retryable: boolean, public readonly status?: number) {
    super(message);
    this.name = "SubmissionError";
  }
}

function submissionKey(userId: string, interviewId: string) {
  return `roundready:final-code:${encodeURIComponent(userId)}:${encodeURIComponent(interviewId)}`;
}

export function saveFinalSubmission(storage: SubmissionStorage, userId: string, interviewId: string, submission: FinalSubmission) {
  storage.setItem(submissionKey(userId, interviewId), JSON.stringify(submission));
}

export function readFinalSubmission(storage: SubmissionStorage, userId: string, interviewId: string): FinalSubmission | null {
  const raw = storage.getItem(submissionKey(userId, interviewId));
  if (!raw) return null;
  let saved: unknown;
  try {
    saved = JSON.parse(raw);
  } catch {
    throw new SubmissionError("The saved code submission could not be read. Please contact support before discarding your saved code.", false);
  }
  if (!saved || typeof saved !== "object" || !("code" in saved) || typeof saved.code !== "string" ||
    !("language" in saved) || typeof saved.language !== "string") {
    throw new SubmissionError("The saved code submission could not be read. Please return to your coding session.", false);
  }
  return { code: saved.code, language: saved.language };
}

/** Called only after the user explicitly chooses the code already on the server. */
export function discardFinalSubmission(storage: SubmissionStorage, userId: string, interviewId: string, expected: FinalSubmission): boolean {
  const current = readFinalSubmission(storage, userId, interviewId);
  if (!current) return true;
  // Another tab may have saved new code since the conflict was shown.
  if (current.code !== expected.code || current.language !== expected.language) return false;
  storage.removeItem(submissionKey(userId, interviewId));
  return true;
}

/** Keep the payload until the server acknowledges it, including a lost response. */
export async function submitPendingCode(
  fetcher: Fetcher,
  storage: SubmissionStorage,
  userId: string,
  interviewId: string,
  signal?: AbortSignal,
): Promise<boolean> {
  const submission = readFinalSubmission(storage, userId, interviewId);
  if (!submission) return false;
  const response = await fetcher(`/api/interview/${interviewId}/code-sync`, {
    method: "POST",
    body: JSON.stringify({ ...submission, is_final: true }),
    signal,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = typeof body.detail === "string" ? body.detail : "Your final code could not be submitted.";
    throw new SubmissionError(message, response.status >= 500 || [408, 429].includes(response.status), response.status);
  }
  // Do not remove a newer submission written by another tab while sending.
  const current = readFinalSubmission(storage, userId, interviewId);
  if (current?.code === submission.code && current?.language === submission.language) {
    storage.removeItem(submissionKey(userId, interviewId));
  }
  return true;
}
