// src/components/chat/ChatMessage.tsx
import { cn } from "@/lib/utils";
import { Bot, User, Check, Copy } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";

export interface ChatMessageProps {
  role: "user" | "ai";
  content: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs transition-colors hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
    >
      {copied ? (
        <>
          <Check size={12} className="text-success" />
          <span className="text-success">Copied!</span>
        </>
      ) : (
        <>
          <Copy size={12} />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  const components = {
    p({ children }: any) {
      return <p className="mb-2 last:mb-0">{children}</p>;
    },
    a({ href, children, ...props }: any) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "underline font-medium break-all transition-colors",
            isUser
              ? "text-off-white hover:text-off-white/80"
              : "text-blueprint hover:text-blueprint/80",
          )}
          {...props}
        >
          {children}
        </a>
      );
    },
    h1({ children }: any) {
      return <h1 className="text-lg font-bold mt-3 mb-1.5 first:mt-0">{children}</h1>;
    },
    h2({ children }: any) {
      return <h2 className="text-base font-semibold mt-2.5 mb-1 first:mt-0">{children}</h2>;
    },
    h3({ children }: any) {
      return <h3 className="text-sm font-semibold mt-2.5 mb-1 first:mt-0">{children}</h3>;
    },
    ul({ children }: any) {
      return <ul className="list-disc pl-5 mb-2.5 space-y-1">{children}</ul>;
    },
    ol({ children }: any) {
      return <ol className="list-decimal pl-5 mb-2.5 space-y-1">{children}</ol>;
    },
    li({ children }: any) {
      return <li className="text-[15px] leading-relaxed">{children}</li>;
    },
    blockquote({ children }: any) {
      return (
        <blockquote
          className={cn(
            "border-l-4 pl-3 italic my-2 py-0.5",
            isUser ? "border-white/30 text-off-white/80" : "border-blueprint-muted text-muted",
          )}
        >
          {children}
        </blockquote>
      );
    },
    code({ className, children, ...props }: any) {
      const codeString = String(children).replace(/\n$/, "");
      const match = /language-(\w+)/.exec(className || "");
      const isBlock = className?.includes("language-") || codeString.includes("\n");

      if (isBlock) {
        const language = match ? match[1] : "";
        return (
          <div
            className={cn(
              "my-3 overflow-hidden rounded-xl text-sm border shadow-sm",
              isUser
                ? "bg-black/30 border-white/10 text-off-white"
                : "bg-neutral-900 border-neutral-800 text-neutral-200",
            )}
          >
            <div
              className={cn(
                "flex items-center justify-between px-4 py-1.5 text-xs border-b font-sans",
                isUser
                  ? "bg-black/20 border-white/10 text-off-white/60"
                  : "bg-neutral-800 border-neutral-700 text-neutral-400",
              )}
            >
              <span className="font-medium lowercase">{language || "code"}</span>
              <CopyButton text={codeString} />
            </div>
            <pre className="overflow-x-auto p-4 font-mono leading-relaxed select-text">
              <code>{children}</code>
            </pre>
          </div>
        );
      }

      return (
        <code
          className={cn(
            "rounded px-1.5 py-0.5 font-mono text-[13px] break-all",
            isUser
              ? "bg-black/20 text-off-white font-medium"
              : "bg-charcoal-04 text-charcoal-83 border border-border-passive",
          )}
          {...props}
        >
          {children}
        </code>
      );
    },
  };

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
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed",
          isUser
            ? "bg-blueprint text-off-white rounded-br-md"
            : "bg-cream border border-border-passive text-charcoal rounded-bl-md",
        )}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
