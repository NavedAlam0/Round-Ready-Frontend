import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

// Use the project's installed TypeScript compiler; no browser or Firebase
// configuration is loaded by these protocol/storage tests.
async function loadModule(relativePath) {
  const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}

const { readReportEvents, reconnectDelay } = await loadModule("../src/lib/report-events.ts");
const { discardFinalSubmission, saveFinalSubmission, readFinalSubmission, submitPendingCode, SubmissionError } = await loadModule("../src/lib/pending-submission.ts");

function responseFromText(source, chunkSize = 1) {
  const bytes = new TextEncoder().encode(source);
  return new Response(new ReadableStream({
    start(controller) {
      for (let i = 0; i < bytes.length; i += chunkSize) controller.enqueue(bytes.slice(i, i + chunkSize));
      controller.close();
    },
  }), { headers: { "content-type": "text/event-stream; charset=utf-8" } });
}

function storage() {
  const entries = new Map();
  return {
    entries,
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    removeItem: (key) => entries.delete(key),
  };
}

test("SSE handles split UTF-8, CRLF, comments and multiline data", async () => {
  const response = responseFromText(': keepalive\r\n\r\nevent: report_status\r\ndata: {"status":"generating",\r\ndata: "message":"Reviewing café example"}\r\n\r\nevent: ignored\ndata: {}\n\nevent: report_status\ndata: {"status":"ready"}\n\n');
  const updates = [];
  let activity = 0;
  await readReportEvents(response, (value) => { updates.push(value); return false; }, () => { activity++; });
  assert.deepEqual(updates, [
    { status: "generating", message: "Reviewing café example" }, { status: "ready" },
  ]);
  assert.ok(activity > 2);
});

test("terminal callback closes the stream and ignores later events", async () => {
  let cancelled = false;
  const response = new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('event: report_status\ndata: {"status":"ready"}\n\nevent: report_status\ndata: {"status":"failed"}\n\n'));
    },
    cancel() { cancelled = true; },
  }), { headers: { "content-type": "text/event-stream" } });
  const updates = [];
  await readReportEvents(response, async (value) => { updates.push(value.status); return true; });
  assert.deepEqual(updates, ["ready"]);
  assert.equal(cancelled, true);
});

test("partial frames at disconnect are not treated as a complete notification", async () => {
  const updates = [];
  await readReportEvents(responseFromText('event: report_status\ndata: {"status":"ready"}'), (value) => { updates.push(value); return false; });
  assert.deepEqual(updates, []);
});

test("malformed notifications and non-stream responses fail visibly", async () => {
  await assert.rejects(readReportEvents(responseFromText('event: report_status\ndata: {invalid}\n\n'), () => false));
  await assert.rejects(readReportEvents(responseFromText('event: report_status\ndata: {"status":"unexpected"}\n\n'), () => false));
  await assert.rejects(readReportEvents(new Response("offline"), () => false));
});

test("reconnect delays increase and are capped", () => {
  assert.deepEqual(Array.from({ length: 8 }, (_, index) => reconnectDelay(index)), [1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000]);
});

test("a disconnected final submission remains saved and succeeds on retry", async () => {
  const saved = storage();
  const payload = { code: "return value", language: "python" };
  saveFinalSubmission(saved, "owner", "interview", payload);
  await assert.rejects(submitPendingCode(async () => { throw new TypeError("Network unavailable"); }, saved, "owner", "interview"));
  assert.deepEqual(readFinalSubmission(saved, "owner", "interview"), payload);
  let requests = 0;
  await submitPendingCode(async (path, options) => {
    requests++;
    assert.equal(path, "/api/interview/interview/code-sync");
    assert.deepEqual(JSON.parse(options.body), { ...payload, is_final: true });
    return new Response('{"status":"ok"}', { status: 200 });
  }, saved, "owner", "interview");
  assert.equal(requests, 1);
  assert.equal(readFinalSubmission(saved, "owner", "interview"), null);
});

test("saved code is scoped to both user and interview", async () => {
  const saved = storage();
  saveFinalSubmission(saved, "owner", "first", { code: "one", language: "java" });
  saveFinalSubmission(saved, "other", "first", { code: "two", language: "python" });
  assert.equal(readFinalSubmission(saved, "owner", "second"), null);
  await submitPendingCode(async () => new Response("{}"), saved, "owner", "first");
  assert.deepEqual(readFinalSubmission(saved, "other", "first"), { code: "two", language: "python" });
});

test("non-OK responses keep code saved and distinguish permanent and temporary failures", async () => {
  const saved = storage();
  saveFinalSubmission(saved, "owner", "interview", { code: "saved", language: "go" });
  for (const [status, retryable] of [[409, false], [503, true], [429, true]]) {
    await assert.rejects(submitPendingCode(async () => new Response('{"detail":"Try later"}', { status }), saved, "owner", "interview"), (error) => {
      assert.ok(error instanceof SubmissionError);
      assert.equal(error.retryable, retryable);
      assert.equal(error.status, status);
      return true;
    });
    assert.equal(readFinalSubmission(saved, "owner", "interview").code, "saved");
  }
});

test("acknowledging an older submission cannot delete a newer local save", async () => {
  const saved = storage();
  saveFinalSubmission(saved, "owner", "interview", { code: "old", language: "python" });
  await submitPendingCode(async () => {
    saveFinalSubmission(saved, "owner", "interview", { code: "new", language: "python" });
    return new Response("{}");
  }, saved, "owner", "interview");
  assert.equal(readFinalSubmission(saved, "owner", "interview").code, "new");
});

test("missing submissions make no network requests", async () => {
  assert.equal(await submitPendingCode(async () => { throw new Error("Unexpected request"); }, storage(), "owner", "interview"), false);
});

test("corrupt local payloads are retained and reported rather than submitted", () => {
  const saved = storage();
  saveFinalSubmission(saved, "owner", "interview", { code: "safe", language: "python" });
  const key = [...saved.entries.keys()][0];
  for (const value of ["not-json", '{"code":12,"language":"python"}']) {
    saved.setItem(key, value);
    assert.throws(() => readFinalSubmission(saved, "owner", "interview"), (error) => error instanceof SubmissionError && !error.retryable);
    assert.equal(saved.getItem(key), value);
  }
});

test("explicit conflict resolution discards only the selected user's interview payload", () => {
  const saved = storage();
  const payload = { code: "pending", language: "python" };
  saveFinalSubmission(saved, "owner", "interview", payload);
  saveFinalSubmission(saved, "owner", "another", payload);
  saveFinalSubmission(saved, "other", "interview", payload);
  assert.equal(discardFinalSubmission(saved, "owner", "interview", payload), true);
  assert.equal(readFinalSubmission(saved, "owner", "interview"), null);
  assert.deepEqual(readFinalSubmission(saved, "owner", "another"), payload);
  assert.deepEqual(readFinalSubmission(saved, "other", "interview"), payload);
});

test("conflict resolution cannot discard code changed in another tab", () => {
  const saved = storage();
  const previous = { code: "pending", language: "python" };
  const newer = { code: "new pending", language: "python" };
  saveFinalSubmission(saved, "owner", "interview", newer);
  assert.equal(discardFinalSubmission(saved, "owner", "interview", previous), false);
  assert.deepEqual(readFinalSubmission(saved, "owner", "interview"), newer);
});
