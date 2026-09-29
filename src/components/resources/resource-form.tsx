"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createResource, updateResourceAction } from "@/app/problems/resource-actions";
import {
  DEFAULT_RESOURCE_TYPE,
  MAX_RESOURCE_CREATOR_LENGTH,
  MAX_RESOURCE_DESCRIPTION_LENGTH,
  MAX_RESOURCE_NOTES_LENGTH,
  MAX_RESOURCE_TITLE_LENGTH,
  MAX_RESOURCE_URL_LENGTH,
  RESOURCE_LABELS,
  RESOURCE_TYPES,
  RESOURCE_TYPE_EMOJI,
} from "@/lib/constants";
import { isYoutubeUrl, youtubeId } from "@/lib/resource-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { Resource, ResourceFormState, ResourceType } from "@/types";

const INITIAL_STATE: ResourceFormState = { status: "idle" };

/** One line telling you what the saved card will do with the pasted link. */
function linkHint(type: ResourceType, videoId: string | null): string {
  if (videoId) {
    return "YouTube video detected — the card gets a thumbnail and an inline player.";
  }
  if (type === "youtube") {
    return "No YouTube video id in this link — it will be saved without a thumbnail.";
  }
  return "Saved as a link to somebody else's explanation.";
}

export type ResourceFormProps = {
  problemId: string;
  mode: "create" | "edit";
  /** Existing resource when `mode === "edit"`. */
  resource?: Resource;
  onSuccess?: (resourceId: string) => void;
};

/**
 * Create/edit form for one external resource: what it is, where it lives, who
 * made it, what it covers, and — the part that is actually yours — why you
 * saved it.
 *
 * The type follows the link: paste a YouTube URL and the card is treated as a
 * video (so the thumbnail and the inline player work) until you override it.
 */
export function ResourceForm({
  problemId,
  mode,
  resource,
  onSuccess,
}: ResourceFormProps) {
  const router = useRouter();
  const fieldId = useId();
  const action = mode === "create" ? createResource : updateResourceAction;
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  const [url, setUrl] = useState(resource?.url ?? "");
  const [type, setType] = useState<ResourceType>(
    resource?.type ?? DEFAULT_RESOURCE_TYPE
  );
  const [typePicked, setTypePicked] = useState(Boolean(resource));

  // Keep the latest callback in a ref so the submit effect does not have to
  // depend on a prop that changes identity on every render.
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  // Close the surrounding modal once the save lands; the revalidated props
  // then render the saved card.
  useEffect(() => {
    if (state.status !== "success" || !state.resourceId) return;
    router.refresh();
    onSuccessRef.current?.(state.resourceId);
  }, [router, state]);

  const fieldErrors = state.fieldErrors ?? {};
  const guessedType: ResourceType = isYoutubeUrl(url) ? "youtube" : type;
  const selectedType = typePicked ? type : guessedType;
  const videoId = selectedType === "youtube" ? youtubeId(url) : null;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="problemId" value={problemId} />
      {mode === "edit" && resource ? (
        <input type="hidden" name="resourceId" value={resource.id} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${fieldId}-type`}
            className="text-xs font-medium text-muted"
          >
            Type
          </label>
          <Select
            id={`${fieldId}-type`}
            name="type"
            value={selectedType}
            onChange={(event) => {
              setType(event.target.value as ResourceType);
              setTypePicked(true);
            }}
            aria-invalid={fieldErrors.type ? true : undefined}
          >
            {RESOURCE_TYPES.map((value) => (
              <option key={value} value={value}>
                {RESOURCE_TYPE_EMOJI[value]} {RESOURCE_LABELS[value]}
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
          <label
            htmlFor={`${fieldId}-url`}
            className="text-xs font-medium text-muted"
          >
            Link <span className="text-accent">*</span>
          </label>
          <Input
            id={`${fieldId}-url`}
            name="url"
            type="url"
            inputMode="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            maxLength={MAX_RESOURCE_URL_LENGTH}
            placeholder="https://www.youtube.com/watch?v=…"
            aria-invalid={fieldErrors.url ? true : undefined}
          />
          {fieldErrors.url ? (
            <p role="alert" className="text-xs text-rose-400">
              {fieldErrors.url}
            </p>
          ) : null}
          {!fieldErrors.url && url ? (
            <p className="text-xs text-muted/80">
              {linkHint(selectedType, videoId)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${fieldId}-title`}
            className="text-xs font-medium text-muted"
          >
            Title <span className="text-accent">*</span>
          </label>
          <Input
            id={`${fieldId}-title`}
            name="title"
            defaultValue={resource?.title ?? ""}
            maxLength={MAX_RESOURCE_TITLE_LENGTH}
            placeholder="Two Sum Explained"
            aria-invalid={fieldErrors.title ? true : undefined}
          />
          {fieldErrors.title ? (
            <p role="alert" className="text-xs text-rose-400">
              {fieldErrors.title}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${fieldId}-creator`}
            className="text-xs font-medium text-muted"
          >
            Creator
          </label>
          <Input
            id={`${fieldId}-creator`}
            name="creator"
            defaultValue={resource?.creator ?? ""}
            maxLength={MAX_RESOURCE_CREATOR_LENGTH}
            placeholder="NeetCode"
            aria-invalid={fieldErrors.creator ? true : undefined}
          />
          {fieldErrors.creator ? (
            <p role="alert" className="text-xs text-rose-400">
              {fieldErrors.creator}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${fieldId}-description`}
          className="text-xs font-medium text-muted"
        >
          Description
        </label>
        <Textarea
          id={`${fieldId}-description`}
          name="description"
          defaultValue={resource?.description ?? ""}
          maxLength={MAX_RESOURCE_DESCRIPTION_LENGTH}
          rows={3}
          placeholder="What this explanation covers, in one or two lines."
          aria-invalid={fieldErrors.description ? true : undefined}
        />
        {fieldErrors.description ? (
          <p role="alert" className="text-xs text-rose-400">
            {fieldErrors.description}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${fieldId}-notes`}
          className="text-xs font-medium text-muted"
        >
          Why I saved it
        </label>
        <Textarea
          id={`${fieldId}-notes`}
          name="notes"
          defaultValue={resource?.notes ?? ""}
          maxLength={MAX_RESOURCE_NOTES_LENGTH}
          rows={3}
          placeholder="Great visualization of the seen-values map."
          aria-invalid={fieldErrors.notes ? true : undefined}
        />
        {fieldErrors.notes ? (
          <p role="alert" className="text-xs text-rose-400">
            {fieldErrors.notes}
          </p>
        ) : null}
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
          {mode === "create" ? "＋ Save resource" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
