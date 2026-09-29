import {
  deleteThinkingSessionAction,
  saveThinkingSession,
} from "@/app/problems/actions";
import { listThinkingSessions } from "@/lib/db";
import type { ThinkingSessionFormState } from "@/types";

export const dynamic = "force-dynamic";

/** TEMPORARY probe: drives the real server actions with hand-built FormData. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const problemId = url.searchParams.get("problemId") ?? "p1";
  const mode = url.searchParams.get("mode") ?? "roundtrip";

  const before = (await listThinkingSessions(problemId)).map((s) => s.id);

  if (mode === "invalid-short") {
    const form = new FormData();
    form.set("problemId", problemId);
    form.set("durationSeconds", "5");
    form.set("thoughts", "too short");
    form.set("startedAt", new Date().toISOString());
    form.set("endedAt", new Date().toISOString());
    const state = await saveThinkingSession({ status: "idle" }, form);
    return Response.json({ before, state });
  }

  if (mode === "invalid-problem") {
    const form = new FormData();
    form.set("problemId", "does-not-exist");
    form.set("durationSeconds", "900");
    const state: ThinkingSessionFormState = await saveThinkingSession(
      { status: "idle" },
      form
    );
    return Response.json({ before, state });
  }

  const startedAt = new Date(Date.now() - 900_000).toISOString();
  const endedAt = new Date().toISOString();

  const form = new FormData();
  form.set("problemId", problemId);
  form.set("durationSeconds", "900");
  form.set("thoughts", "I tried sorting first.");
  form.set("startedAt", startedAt);
  form.set("endedAt", endedAt);

  const saveState = await saveThinkingSession({ status: "idle" }, form);
  const afterInsert = await listThinkingSessions(problemId);

  const deleteResult = await deleteThinkingSessionAction(
    problemId,
    saveState.sessionId ?? ""
  );
  const afterDelete = await listThinkingSessions(problemId);

  return Response.json({
    before: before.length,
    saveState,
    inserted: afterInsert[0],
    countAfterInsert: afterInsert.length,
    deleteResult,
    countAfterDelete: afterDelete.length,
  });
}
