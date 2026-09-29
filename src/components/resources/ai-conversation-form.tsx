"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createAiConversation } from "@/app/problems/resource-actions";
import {
  AI_PROVIDER_EMOJI,
  AI_PROVIDERS,
  DEFAULT_AI_PROVIDER,
  MAX_AI_DESCRIPTION_LENGTH,
  MAX_AI_TITLE_LENGTH,
  MAX_AI_URL_LENGTH,
} from "@/lib/constants";
import { providerFromUrl } from "@/lib/resource-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { AiConversationFormState, AiProvider } from "@/types";

const INITIAL_STATE: AiConversationFormState = { status: "idle" };

export type AiConversationFormProps = {
  problemId: string;
  /** Called after a successful submit (used to close the surrounding modal). */
  onSuccess?: (conversationId: string) => void;
};

/**
 * Form for one saved AI conversation: a provider, a title, the link itself, and
 * your own one-liner for why it was worth keeping.
 *
 * The provider is guessed from the link as you type or paste it
 * (`chatgpt.com/…` -> ChatGPT) until you pick one by hand — the guess never
 * fights a deliberate choice. The conversation text itself is deliberately
 * absent: ThinkCode stores the pointer, the tool keeps the discussion.
 */
export function AiConversationForm({ problemId, onSuccess }: AiConversationFormProps) {
  const router = useRouter();
  const fieldId = useId();
  const [state, formAction, pending] = useActionState(
    createAiConversation,
    INITIAL_STATE
  );

  const [url, setUrl] = useState("");
  const [provider, setProvider] = useState<AiProvider>(DEFAULT_AI_PROVIDER);
  const [providerPicked, setProviderPicked] = useState(false);

  // Keep the latest callback in a ref so the submit effect does not have to
  // depend on a prop that changes identity on every render.
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  // Close the surrounding modal once the save lands; the revalidated props
  // then render the saved card.
  useEffect(() => {
    if (state.status !== "success" || !state.conversationId) return;
    router.refresh();
    onSuccessRef.current?.(state.conversationId);
  }, [router, state]);

  const fieldErrors = state.fieldErrors ?? {};
  const guessed = providerFromUrl(url);
  const selectedProvider = !providerPicked && guessed ? guessed : provider;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="problemId" value={problemId} />

      <p className="rounded-lg border border-border bg-surface-2/40 px-3 py-2 text-xs leading-relaxed text-muted">
        Store the link, not the conversation — your thinking stays yours.
      </p>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${fieldId}-provider`}
            className="text-xs font-medium text-muted"
          >
            Provider
          </label>
          <Select
            id={`${fieldId}-provider`}
            name="provider"
            value={selectedProvider}
            onChange={(event) => {
              setProvider(event.target.value as AiProvider);
              setProviderPicked(true);
            }}
            aria-invalid={fieldErrors.provider ? true : undefined}
          >
            {AI_PROVIDERS.map((value) => (
              <option key={value} value={value}>
                {AI_PROVIDER_EMOJI[value]} {value}
              </option>
            ))}
          </Select>
          {fieldErrors.provider ? (
            <p role="alert" className="text-xs text-rose-400">
              {fieldErrors.provider}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${fieldId}-url`}
            className="text-xs font-medium text-muted"
          >
            Conversation link <span className="text-accent">*</span>
          </label>
          <Input
            id={`${fieldId}-url`}
            name="url"
            type="url"
            inputMode="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            maxLength={MAX_AI_URL_LENGTH}
            placeholder="https://chatgpt.com/c/…"
            aria-invalid={fieldErrors.url ? true : undefined}
          />
          {fieldErrors.url ? (
            <p role="alert" className="text-xs text-rose-400">
              {fieldErrors.url}
            </p>
          ) : null}
        </div>
      </div>

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
          maxLength={MAX_AI_TITLE_LENGTH}
          placeholder="Why does the hashmap approach work?"
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
          htmlFor={`${fieldId}-description`}
          className="text-xs font-medium text-muted"
        >
          Why I saved this
        </label>
        <Textarea
          id={`${fieldId}-description`}
          name="description"
          maxLength={MAX_AI_DESCRIPTION_LENGTH}
          rows={3}
          placeholder="The complement explanation finally clicked here."
          aria-invalid={fieldErrors.description ? true : undefined}
        />
        {fieldErrors.description ? (
          <p role="alert" className="text-xs text-rose-400">
            {fieldErrors.description}
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
          ＋ Save link
        </Button>
      </div>
    </form>
  );
}
