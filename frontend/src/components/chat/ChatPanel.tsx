// src/components/chat/ChatPanel.tsx
import { useRef, useEffect, useLayoutEffect, useState } from "react";
import { useChatStore } from "@/store/useChatStore";
import { sendMessage } from "@/services/ai";
import { ChatMessage } from "./ChatMessage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface ChatPanelProps {
  projectId: string;
}

const MAX_TEXTAREA_HEIGHT_PX = 160;

export function ChatPanel({ projectId }: ChatPanelProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");

  const session = useChatStore((state) => state.chats[projectId]);
  const messages = session?.messages ?? [];
  const loading = session?.loading ?? false;
  const error = session?.error ?? null;
  const sessionId = session?.session_id ?? "";

  const addMessage = useChatStore((state) => state.addMessage);
  const setLoading = useChatStore((state) => state.setLoading);
  const setError = useChatStore((state) => state.setError);

  const messagesLength = messages.length;
  useEffect(() => {
    anchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messagesLength, loading]);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT_PX)}px`;
  }, [input]);

  const handleSend = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;
    if (!sessionId) {
      toast.error("Chat session is missing. Please reopen the chat.");
      return;
    }

    setInput("");
    addMessage(projectId, "user", text);
    setLoading(projectId, true);
    setError(projectId, null);

    try {
      const response = await sendMessage({
        session_id: sessionId,
        user_question: text,
      });
      addMessage(projectId, "ai", response ?? "No response received.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get a response.";
      setError(projectId, message);
      toast.error(message);
    } finally {
      setLoading(projectId, false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRetry = async () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMessage) return;
    if (!sessionId) {
      toast.error("Chat session is missing. Please reopen the chat.");
      return;
    }

    setError(projectId, null);
    setLoading(projectId, true);

    try {
      const response = await sendMessage({
        session_id: sessionId,
        user_question: lastUserMessage.content,
      });
      addMessage(projectId, "ai", response ?? "No response received.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get a response.";
      setError(projectId, message);
      toast.error(message);
    } finally {
      setLoading(projectId, false);
    }
  };

  const canSend = input.trim().length > 0 && !loading && sessionId.length > 0;

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted">
            <p className="text-[16px]">Ask anything about this architecture.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {messages.map((message, index) => (
              <ChatMessage key={index} role={message.role} content={message.content} />
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-muted text-caption">
                <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                AI is thinking…
              </div>
            )}
            <div ref={anchorRef} />
          </div>
        )}
      </ScrollArea>

      {error && (
        <div className="mx-5 mb-2 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">
          <AlertCircle size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button
            onClick={handleRetry}
            className="font-medium underline underline-offset-2 hover:opacity-80"
          >
            Retry
          </button>
        </div>
      )}

      <div className="border-t border-border-passive p-4">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this architecture…"
            rows={1}
            className={cn(
              "min-h-[44px] resize-none rounded-xl border-border-passive bg-cream px-4 py-2.5 text-[15px]",
              "focus-visible:ring-blueprint",
            )}
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={!canSend}
            className="h-11 w-11 min-h-[44px] shrink-0 rounded-xl bg-blueprint hover:bg-blueprint/90"
          >
            {loading ? (
              <Loader2 size={18} strokeWidth={1.5} className="animate-spin" />
            ) : (
              <Send size={18} strokeWidth={1.5} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
