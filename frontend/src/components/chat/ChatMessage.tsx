// src/components/chat/ChatMessage.tsx
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface ChatMessageProps {
  role: "user" | "ai";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";
  return (
    <div className={cn("flex w-full gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            "rounded-full text-[14px]",
            isUser ? "bg-blueprint text-off-white" : "bg-charcoal-04 text-charcoal",
          )}
        >
          {isUser ? <User size={16} strokeWidth={1.5} /> : <Bot size={16} strokeWidth={1.5} />}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-blueprint text-off-white rounded-br-md"
            : "bg-cream border border-border-passive text-charcoal rounded-bl-md",
        )}
      >
        {content}
      </div>
    </div>
  );
}
