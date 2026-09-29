"use server";

import { revalidatePath } from "next/cache";

import {
  DEFAULT_AI_PROVIDER,
  DEFAULT_RESOURCE_TYPE,
  MAX_AI_DESCRIPTION_LENGTH,
  MAX_AI_TITLE_LENGTH,
  MAX_AI_URL_LENGTH,
  MAX_RESOURCE_CREATOR_LENGTH,
  MAX_RESOURCE_DESCRIPTION_LENGTH,
  MAX_RESOURCE_NOTES_LENGTH,
  MAX_RESOURCE_TITLE_LENGTH,
  MAX_RESOURCE_URL_LENGTH,
  isAiProvider,
  isResourceType,
} from "@/lib/constants";
import {
  deleteAiConversation,
  deleteResource,
  getProblem,
  insertAiConversation,
  insertResource,
  updateResource,
} from "@/lib/db";
import { normalizeExternalUrl } from "@/lib/resource-utils";
import type {
  AiConversationField,
  AiConversationFormState,
  AiConversationInput,
  ResourceField,
  ResourceFormState,
  ResourceInput,
} from "@/types";

/**
 * AI-conversation and external-resource mutations.
 *
 * Same shape as the problem/note/solution actions: every export of a
 * `"use server"` file must be async, so the form-facing actions take the
 * `useActionState` shape `(prevState, formData)` and return a serializable
 * state object. The `problemId` travels in a hidden field and is re-validated
 * against D1 before anything is written; edits and deletes carry both ids so a
 * hand-crafted call cannot touch another problem's rows.
 *
 * The product rule this file protects, in two parts:
 *  1. an AI row is a *link* to a conversation, never a copy of it, and
 *  2. a resource is a *link* to someone else's explanation, next to your own
 *     reason for keeping it ("Why I saved it").
 *
 * Every stored link goes through {@link normalizeExternalUrl}, so only absolute
 * `http(s)` URLs are persisted — `javascript:` and friends never reach D1.
 */

/** Only the problem page renders conversation/resource data. */
function revalidateResourcePaths(problemId: string) {
  revalidatePath(`/problems/${problemId}`);
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Trim, enforce a cap, and turn "" into the column's NULL. */
function capped(value: string, max: number): { value: string; tooLong: boolean } {
  if (value.length > max) return { value: value.slice(0, max), tooLong: true };
  return { value, tooLong: false };
}

// ---- AI conversations --------------------------------------------

function aiErrorState(
  message: string,
  fieldErrors: Partial<Record<AiConversationField, string>> = {}
): AiConversationFormState {
  return { status: "error", message, fieldErrors };
}

/** Validate raw `FormData` into an {@link AiConversationInput}. */
function parseAiConversationInput(formData: FormData): {
  input: AiConversationInput | null;
  fieldErrors: Partial<Record<AiConversationField, string>>;
} {
  const fieldErrors: Partial<Record<AiConversationField, string>> = {};

  const problemId = text(formData, "problemId");
  if (!problemId) {
    return {
      input: null,
      fieldErrors: { url: "Missing problem id — reopen the problem and try again." },
    };
  }

  const provider = text(formData, "provider");
  if (!isAiProvider(provider)) {
    fieldErrors.provider = "Pick ChatGPT, AI Studio, Claude, or Other.";
  }

  const title = capped(text(formData, "title"), MAX_AI_TITLE_LENGTH);
  if (!title.value) {
    fieldErrors.title = "Name the conversation so you recognise it later.";
  } else if (title.tooLong) {
    fieldErrors.title = `Keep the title under ${MAX_AI_TITLE_LENGTH} characters.`;
  }

  const rawUrl = text(formData, "url");
  const url = normalizeExternalUrl(rawUrl);
  if (rawUrl.length > MAX_AI_URL_LENGTH) {
    fieldErrors.url = `Keep the link under ${MAX_AI_URL_LENGTH} characters.`;
  } else if (!url) {
    fieldErrors.url = "Paste the conversation link — it must start with http:// or https://.";
  }

  const description = capped(text(formData, "description"), MAX_AI_DESCRIPTION_LENGTH);
  if (description.tooLong) {
    fieldErrors.description = `Keep the note under ${MAX_AI_DESCRIPTION_LENGTH} characters.`;
  }

  if (Object.keys(fieldErrors).length) {
    return { input: null, fieldErrors };
  }

  return {
    fieldErrors,
    input: {
      problemId,
      provider: isAiProvider(provider) ? provider : DEFAULT_AI_PROVIDER,
      title: title.value,
      url: url ?? rawUrl,
      description: description.value || null,
    },
  };
}

/** Save an AI conversation link from the problem page's AI section. */
export async function createAiConversation(
  _prevState: AiConversationFormState,
  formData: FormData
): Promise<AiConversationFormState> {
  const { input, fieldErrors } = parseAiConversationInput(formData);
  if (!input) {
    return aiErrorState("Fix the highlighted fields and try again.", fieldErrors);
  }

  const problem = await getProblem(input.problemId);
  if (!problem) {
    return aiErrorState("That problem no longer exists.");
  }

  const conversationId = await insertAiConversation(input);

  revalidateResourcePaths(input.problemId);

  return { status: "success", conversationId };
}

/** Remove one conversation link from the AI section. */
export async function deleteAiConversationAction(
  problemId: string,
  conversationId: string
): Promise<{ ok: boolean; error?: string }> {
  const problem = problemId?.trim();
  const id = conversationId?.trim();
  if (!problem || !id) {
    return { ok: false, error: "Missing problem or conversation id." };
  }

  const deleted = await deleteAiConversation(id, problem);
  if (!deleted) {
    return { ok: false, error: "That conversation no longer exists." };
  }

  revalidateResourcePaths(problem);

  return { ok: true };
}

// ---- external resources ------------------------------------------

function resourceErrorState(
  message: string,
  fieldErrors: Partial<Record<ResourceField, string>> = {}
): ResourceFormState {
  return { status: "error", message, fieldErrors };
}

/** Validate raw `FormData` into a {@link ResourceInput}. */
function parseResourceInput(formData: FormData): {
  input: ResourceInput | null;
  fieldErrors: Partial<Record<ResourceField, string>>;
} {
  const fieldErrors: Partial<Record<ResourceField, string>> = {};

  const problemId = text(formData, "problemId");
  if (!problemId) {
    return {
      input: null,
      fieldErrors: { url: "Missing problem id — reopen the problem and try again." },
    };
  }

  const type = text(formData, "type");
  if (!isResourceType(type)) {
    fieldErrors.type = "Pick a YouTube video, an article, or another link.";
  }

  const title = capped(text(formData, "title"), MAX_RESOURCE_TITLE_LENGTH);
  if (!title.value) {
    fieldErrors.title = "Name the resource so you recognise it later.";
  } else if (title.tooLong) {
    fieldErrors.title = `Keep the title under ${MAX_RESOURCE_TITLE_LENGTH} characters.`;
  }

  const rawUrl = text(formData, "url");
  const url = normalizeExternalUrl(rawUrl);
  if (rawUrl.length > MAX_RESOURCE_URL_LENGTH) {
    fieldErrors.url = `Keep the link under ${MAX_RESOURCE_URL_LENGTH} characters.`;
  } else if (!url) {
    fieldErrors.url = "Paste the link — it must start with http:// or https://.";
  }

  const creator = capped(text(formData, "creator"), MAX_RESOURCE_CREATOR_LENGTH);
  if (creator.tooLong) {
    fieldErrors.creator = `Keep the creator under ${MAX_RESOURCE_CREATOR_LENGTH} characters.`;
  }

  const description = capped(
    text(formData, "description"),
    MAX_RESOURCE_DESCRIPTION_LENGTH
  );
  if (description.tooLong) {
    fieldErrors.description = `Keep the description under ${MAX_RESOURCE_DESCRIPTION_LENGTH} characters.`;
  }

  const notes = capped(text(formData, "notes"), MAX_RESOURCE_NOTES_LENGTH);
  if (notes.tooLong) {
    fieldErrors.notes = `Keep your note under ${MAX_RESOURCE_NOTES_LENGTH} characters.`;
  }

  if (Object.keys(fieldErrors).length) {
    return { input: null, fieldErrors };
  }

  return {
    fieldErrors,
    input: {
      problemId,
      type: isResourceType(type) ? type : DEFAULT_RESOURCE_TYPE,
      title: title.value,
      url: url ?? rawUrl,
      creator: creator.value || null,
      description: description.value || null,
      notes: notes.value || null,
    },
  };
}

/** Attach a resource from the problem page's RESOURCES section. */
export async function createResource(
  _prevState: ResourceFormState,
  formData: FormData
): Promise<ResourceFormState> {
  const { input, fieldErrors } = parseResourceInput(formData);
  if (!input) {
    return resourceErrorState("Fix the highlighted fields and try again.", fieldErrors);
  }

  const problem = await getProblem(input.problemId);
  if (!problem) {
    return resourceErrorState("That problem no longer exists.");
  }

  const resourceId = await insertResource(input);

  revalidateResourcePaths(input.problemId);

  return { status: "success", resourceId };
}

/** Edit an existing resource from the same form. */
export async function updateResourceAction(
  _prevState: ResourceFormState,
  formData: FormData
): Promise<ResourceFormState> {
  const resourceId = text(formData, "resourceId");
  if (!resourceId) {
    return resourceErrorState("Missing resource id — reopen the problem and try again.");
  }

  const { input, fieldErrors } = parseResourceInput(formData);
  if (!input) {
    return resourceErrorState("Fix the highlighted fields and try again.", fieldErrors);
  }

  const updated = await updateResource(resourceId, input.problemId, input);
  if (!updated) {
    return resourceErrorState("That resource no longer exists.");
  }

  revalidateResourcePaths(input.problemId);

  return { status: "success", resourceId };
}

/** Delete one resource from the RESOURCES section. */
export async function deleteResourceAction(
  problemId: string,
  resourceId: string
): Promise<{ ok: boolean; error?: string }> {
  const problem = problemId?.trim();
  const id = resourceId?.trim();
  if (!problem || !id) {
    return { ok: false, error: "Missing problem or resource id." };
  }

  const deleted = await deleteResource(id, problem);
  if (!deleted) {
    return { ok: false, error: "That resource no longer exists." };
  }

  revalidateResourcePaths(problem);

  return { ok: true };
}
