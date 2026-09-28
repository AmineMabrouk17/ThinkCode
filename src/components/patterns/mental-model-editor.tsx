"use client";

import { useActionState, useState } from "react";

import { MAX_MENTAL_MODEL_LENGTH } from "@/lib/constants";
import { updatePatternMentalModelAction } from "@/app/patterns/actions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { MentalModelFormState } from "@/types";

const INITIAL_STATE: MentalModelFormState = { status: "idle" };

/**
 * The mental model of a pattern, editable inline on its knowledge page.
 * Collapsed it shows the text (or a prompt when empty); expanded it becomes a
 * small form that saves through the `updatePatternMentalModelAction` server
 * action and lets the revalidated page replace what is on screen.
 */
export function MentalModelEditor({
  patternId,
  slug,
  initialValue,
}: {
  patternId: string;
  slug: string;
  initialValue: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    updatePatternMentalModelAction,
    INITIAL_STATE
  );
  const [handled, setHandled] = useState<MentalModelFormState | null>(null);

  // Leave the editor once the save lands; the revalidated props then render
  // the new value in the read-only view. Adjusting state during render is the
  // documented alternative to an effect here, and every action result is a new
  // object, so a second save closes the editor again.
  if (state !== handled) {
    setHandled(state);
    if (state.status === "success") setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            aria-label="Edit mental model"
          >
            <span aria-hidden>✏️</span> Edit
          </Button>
        </div>
        {initialValue ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
            {initialValue}
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-muted">
            No mental model yet. The sentence you want to remember when you spot
            this pattern goes here.
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="patternId" value={patternId} />
      <input type="hidden" name="slug" value={slug} />
      <label htmlFor="mental-model" className="sr-only">
        Mental model
      </label>
      <Textarea
        id="mental-model"
        name="mentalModel"
        rows={4}
        maxLength={MAX_MENTAL_MODEL_LENGTH}
        defaultValue={initialValue ?? ""}
        autoFocus
        placeholder="Store information so future elements can be checked quickly."
      />
      {state.status === "error" && state.message ? (
        <p role="alert" className="text-xs text-rose-400">
          {state.message}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {pending ? <Spinner label="Saving…" /> : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => setEditing(false)}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          Save
        </Button>
      </div>
    </form>
  );
}
