export interface ReportStatus {
  status: "queued" | "generating" | "retrying" | "ready" | "failed" | "incomplete" | "awaiting_transcript" | "awaiting_submission" | "not_started";
  stage?: string | null;
  attempt_count?: number;
  message?: string;
  error_code?: string | null;
}

const statuses = new Set([
  "queued", "generating", "retrying", "ready", "failed", "incomplete",
  "awaiting_transcript", "awaiting_submission", "not_started",
]);

/** Consume an authenticated fetch stream, including frames split across chunks. */
export async function readReportEvents(
  response: Response,
  onStatus: (status: ReportStatus) => Promise<boolean> | boolean,
  onActivity: () => void = () => {},
): Promise<void> {
  if (!response.body || !response.headers.get("content-type")?.includes("text/event-stream")) {
    throw new Error("The report notification stream is unavailable.");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let event = "";
  let data: string[] = [];

  async function lineReceived(line: string): Promise<boolean> {
    if (!line) {
      if (event === "report_status" && data.length) {
        const parsed: unknown = JSON.parse(data.join("\n"));
        if (!parsed || typeof parsed !== "object" || !("status" in parsed) || !statuses.has(String(parsed.status))) {
          throw new Error("The report notification was invalid.");
        }
        if (await onStatus(parsed as ReportStatus)) return true;
      }
      event = "";
      data = [];
    } else if (line.startsWith("event:")) {
      event = line.slice(6).trimStart();
    } else if (line.startsWith("data:")) {
      data.push(line.slice(5).replace(/^ /, ""));
    }
    return false;
  }

  try {
    while (true) {
      const { value, done } = await reader.read();
      onActivity();
      buffer += decoder.decode(value, { stream: !done });
      if (buffer.length > 65536 || data.join("\n").length > 65536) {
        throw new Error("The report notification was too large.");
      }
      let newline;
      while ((newline = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newline).replace(/\r$/, "");
        buffer = buffer.slice(newline + 1);
        if (await lineReceived(line)) return;
      }
      if (done) return;
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export function reconnectDelay(attempt: number): number {
  return Math.min(1000 * 2 ** Math.min(attempt, 5), 30000);
}
