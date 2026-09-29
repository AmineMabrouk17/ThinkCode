"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createNote, updateNoteAction } from "@/app/knowledge/notes-actions";
import {
  DEFAULT_NOTE_TYPE,
  MAX_NOTE_TITLE_LENGTH,
  NOTE_TYPE_LABELS,
  NOTE_TYPES,
} from "@/lib/constants";
import { MarkdownEditor } from "@/components/knowledge/markdown-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { Note, NoteFormState } from "@/types";

const INITIAL_STATE: NoteFormState = { status: "idle" };

export type NoteFormProps = {
  problemId: string;
  mode: "create" | "edit";
  /** Existing note when `mode === "edit"`. */
  note?: Note;
  /** Called after a successful submit (used to close the surrounding modal). */
  onSuccess?: (noteId: string) => void;
};

/**
 * Create/edit form for one knowledge note. The body is a {@link MarkdownEditor}
 * (write/preview + a small formatting toolbar), the type is a select, and the
 * title is optional — the server falls back to the first line of the note.
 */
export function NoteForm({ problemId, mode, note, onSuccess }: NoteFormProps) {
  const router = useRouter();
  const fieldId = useId();
  const action = mode === "create" ? createNote : updateNoteAction;
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  const [content, setContent] = useState(note?.content ?? "");

  // Keep the latest callback in a ref so the submit effect does not have to
  // depend on a prop that changes identity on every render.
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  // Close the surrounding modal once the save lands; the revalidated props
  // then render the saved note. `useActionState` hands back a new object per
  // result, so this runs once per submit.
  useEffect(() => {
    if (state.status !== "success" || !state.noteId) return;
    router.refresh();
    onSuccessRef.current?.(state.noteId);
  }, [router, state]);

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="problemId" value={problemId} />
      {mode === "edit" && note ? (
        <input type="hidden" name="noteId" value={note.id} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${fieldId}-type`} className="text-xs font-medium text-muted">
            Type
          </label>
          <Select
            id={`${fieldId}-type`}
            name="type"
            defaultValue={note?.type ?? DEFAULT_NOTE_TYPE}
            aria-invalid={fieldErrors.type ? true : undefined}
          >
            {NOTE_TYPES.map((type) => (
              <option key={type} value={type}>
                {NOTE_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
          {fieldErrors.type ? (
            <p role="alert" className="text-xs text-rose-400">
              {fieldErrors.type}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${fieldId}-title`} className="text-xs font-medium text-muted">
            Title
          </label>
          <Input
            id={`${fieldId}-title`}
            name="title"
            defaultValue={note?.title ?? ""}
            maxLength={MAX_NOTE_TITLE_LENGTH}
            placeholder="Optional — the first line is used otherwise"
            aria-invalid={fieldErrors.title ? true : undefined}
          />
          {fieldErrors.title ? (
            <p role="alert" className="text-xs text-rose-400">
              {fieldErrors.title}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">
          Note <span className="text-accent">*</span>
        </span>
        <MarkdownEditor
          id={`${fieldId}-content`}
          value={content}
          onChange={setContent}
          error={fieldErrors.content}
        />
      </div>

      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        {pending ? <Spinner label="Saving…" /> : null}
        <Button type="submit" disabled={pending}>
          {mode === "create" ? "＋ Save note" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
