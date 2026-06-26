// src/components/chat/ChatDrawer.tsx
import { useChatStore } from "@/store/useChatStore";
import { ChatPanel } from "./ChatPanel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export interface ChatDrawerProps {
  projectId: string;
}

export function ChatDrawer({ projectId }: ChatDrawerProps) {
  const openProjectId = useChatStore((state) => state.openProjectId);
  const closeChat = useChatStore((state) => state.closeChat);
  const isOpen = openProjectId === projectId;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeChat()}>
      <SheetContent side="right" className="w-full max-w-md bg-cream p-0 sm:max-w-md gap-0">
        <SheetHeader className="border-b border-border-passive px-5 py-4">
          <SheetTitle className="text-card-title text-charcoal">
            Ask AI about this architecture
          </SheetTitle>
          <SheetDescription className="text-caption text-muted">
            Ask questions about this architecture.
          </SheetDescription>
        </SheetHeader>
        <div className="h-[calc(100%-73px)]">
          <ChatPanel projectId={projectId} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
