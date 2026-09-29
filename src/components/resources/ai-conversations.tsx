"use client";

import { useState } from "react";

import { AiConversationCard } from "@/components/resources/ai-conversation-card";
import { AiConversationForm } from "@/components/resources/ai-conversation-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import type { AiConversation } from "@/types";

/**
 * The AI section of a problem page: where the useful discussions live.
 *
 * It sits right below THINK on purpose. The product rule is that ThinkCode
 * never replaces ChatGPT or AI Studio — it remembers where the good
 * conversation was, so you can go back to it with one click and the thinking
 * that came before it stays untouched.
 */
export function AiConversations({
  problemId,
  conversations,
}: {
  problemId: string;
  conversations: AiConversation[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          ThinkCode stores the link, not the conversation — your thinking stays
          yours.
        </p>
        <Button onClick={() => setAdding(true)}>＋ Add AI conversation</Button>
      </div>

      {conversations.length ? (
        <ul className="flex flex-col gap-3">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <AiConversationCard
                problemId={problemId}
                conversation={conversation}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          emoji="💬"
          title="No AI conversations saved yet"
          description="No AI conversations saved yet — keep the link, not a wall of pasted text."
          className="py-8"
        />
      )}

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="New AI conversation link"
      >
        <AiConversationForm problemId={problemId} onSuccess={() => setAdding(false)} />
      </Modal>
    </div>
  );
}
