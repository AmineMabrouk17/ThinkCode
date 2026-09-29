"use server";

import { revalidatePath } from "next/cache";

import {
  DEFAULT_NOTE_TYPE,
  MAX_NOTE_CONTENT_LENGTH,
  MAX_NOTE_TITLE_LENGTH,
  UNTITLED_NOTE_TITLE,
  isNoteType,
} from "@/lib/constants";
import {
  deleteNote,
  getProblem,
  insertNote,
  updateNote,
} from "@/lib/db";
import { firstLineOf } from "@/lib/note-utils";
import type { NoteField, NoteFormState, NoteInput } from "@/types";

/**
 * Knowledge-note mutations.
 *
 * Same shape as the problem/pattern actions: every export of a `"use server"`
 * file must be async, so the form-facing actions take the `useActionState`
 * shape `(prevState, formData)` and return a serializable {@link NoteFormState}.
 * The `problemId` travels in a hidden field and is re-validated against D1
 * before anything is written; deletes carry both ids so a hand-crafted call
 * cannot touch a note from another problem. After each mutation the affected
 * routes are revalidated, which ships a fresh RSC payload in the same response.
 */

/** The routes that render note data: the problem page, the knowledge base, the dashboard. */
function revalidateNotePaths(problemId: string) {
  revalidatePath(`/problems/${problemId}`);
  revalidatePath("/knowledge");
  revalidatePath("/");
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function errorState(
  message: string,
  fieldErrors: Partial<Record<NoteField, string>> = {}
): NoteFormState {
  return { status: "error", message, fieldErrors };
}

/**
 * Validate raw `FormData` into a {@link NoteInput}. The body is required (an
 * empty note teaches nothing); the title is optional and falls back to the
 * first meaningful line of the markdown, so "just start typing" always works.
 */
function parseNoteInput(
  formData: FormData
): { input: NoteInput | null; fieldErrors: Partial<Record<NoteField, string>> } {
  const fieldErrors: Partial<Record<NoteField, string>> = {};

  const problemId = text(formData, "problemId");
  if (!problemId) {
    return {
      input: null,
      fieldErrors: { content: "Missing problem id — reopen the problem and try again." },
    };
  }

  const type = text(formData, "type");
  if (!isNoteType(type)) {
    fieldErrors.type = "Pick a mental model, a key lesson, a mistake, or a general note.";
  }

  const content = text(formData, "content");
  if (!content) {
    fieldErrors.content = "Write the explanation you want to keep.";
  } else if (content.length > MAX_NOTE_CONTENT_LENGTH) {
    fieldErrors.content = `Keep the note under ${MAX_NOTE_CONTENT_LENGTH} characters.`;
  }

  const title = text(formData, "title").slice(0, MAX_NOTE_TITLE_LENGTH);
  if (title.length > MAX_NOTE_TITLE_LENGTH) {
    fieldErrors.title = `Keep the title under ${MAX_NOTE_TITLE_LENGTH} characters.`;
  }

  if (Object.keys(fieldErrors).length) {
    return { input: null, fieldErrors };
  }

  return {
    fieldErrors,
    input: {
      problemId,
      type: isNoteType(type) ? type : DEFAULT_NOTE_TYPE,
      title: title || firstLineOf(content).slice(0, MAX_NOTE_TITLE_LENGTH) || UNTITLED_NOTE_TITLE,
      content,
    },
  };
}

/** Create a note from the problem page's KNOWLEDGE section. */
export async function createNote(
  _prevState: NoteFormState,
  formData: FormData
): Promise<NoteFormState> {
  const { input, fieldErrors } = parseNoteInput(formData);
  if (!input) {
    return errorState("Fix the highlighted fields and try again.", fieldErrors);
  }

  const problem = await getProblem(input.problemId);
  if (!problem) {
    return errorState("That problem no longer exists.");
  }

  const noteId = await insertNote(input);

  revalidateNotePaths(input.problemId);

  return { status: "success", noteId };
}

/** Edit an existing note from the same form. */
export async function updateNoteAction(
  _prevState: NoteFormState,
  formData: FormData
): Promise<NoteFormState> {
  const noteId = text(formData, "noteId");
  if (!noteId) {
    return errorState("Missing note id — reopen the problem and try again.");
  }

  const { input, fieldErrors } = parseNoteInput(formData);
  if (!input) {
    return errorState("Fix the highlighted fields and try again.", fieldErrors);
  }

  const updated = await updateNote(noteId, input.problemId, input);
  if (!updated) {
    return errorState("That note no longer exists.");
  }

  revalidateNotePaths(input.problemId);

  return { status: "success", noteId };
}

/** Delete one note from the KNOWLEDGE section. */
export async function deleteNoteAction(
  problemId: string,
  noteId: string
): Promise<{ ok: boolean; error?: string }> {
  const problem = problemId?.trim();
  const id = noteId?.trim();
  if (!problem || !id) {
    return { ok: false, error: "Missing problem or note id." };
  }

  const deleted = await deleteNote(id, problem);
  if (!deleted) {
    return { ok: false, error: "That note no longer exists." };
  }

  revalidateNotePaths(problem);

  return { ok: true };
}
