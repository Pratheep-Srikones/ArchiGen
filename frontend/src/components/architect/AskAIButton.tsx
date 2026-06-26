import { useState } from "react";
import { createChat } from "@/services/ai";
import { useChatStore } from "@/store/useChatStore";
import { ArchButton } from "./Button";
import type { ArchitectureOutput } from "@/lib/mock-data";
import { Bot, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface AskAIButtonProps {
  projectId: string;
  architecture: ArchitectureOutput;
}

export function AskAIButton({ projectId, architecture }: AskAIButtonProps) {
  const [creating, setCreating] = useState(false);
  const session = useChatStore((state) => state.chats[projectId]);
  const sessionId = session?.session_id ?? "";
  const openChat = useChatStore((state) => state.openChat);
  const setSessionId = useChatStore((state) => state.setSessionId);
  const setError = useChatStore((state) => state.setError);

  const handleClick = async () => {
    openChat(projectId);

    if (sessionId) return;

    setCreating(true);
    setError(projectId, null);

    try {
      const newSessionId = await createChat({ architecture });
      if (!newSessionId) {
        throw new Error("No session ID returned from server.");
      }
      setSessionId(projectId, newSessionId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start chat session.";
      setError(projectId, message);
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <ArchButton variant="primary" size="sm" onClick={handleClick} disabled={creating}>
      {creating ? (
        <>
          <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
          Starting…
        </>
      ) : (
        <>
          <Bot size={14} strokeWidth={1.5} />
          Ask AI
        </>
      )}
    </ArchButton>
  );
}
