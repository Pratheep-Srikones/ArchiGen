import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type ChatMessage = {
  role: "user" | "ai";
  content: string;
};

type ChatSession = {
  session_id: string;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
};

type ChatState = {
  chats: Record<string, ChatSession>;
  openProjectId: string | null;

  // Actions
  setSessionId: (projectId: string, sessionId: string) => void;
  addMessage: (projectId: string, role: "user" | "ai", content: string) => void;
  setLoading: (projectId: string, loading: boolean) => void;
  setError: (projectId: string, error: string | null) => void;
  clearSession: (projectId: string) => void;
  openChat: (projectId: string) => void;
  closeChat: () => void;
};

const getInitialSession = (): ChatSession => ({
  session_id: "",
  messages: [],
  loading: false,
  error: null,
});

const getSession = (state: ChatState, projectId: string): ChatSession =>
  state.chats[projectId] ?? getInitialSession();

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      chats: {},
      openProjectId: null,

      setSessionId: (projectId, sessionId) =>
        set((state) => ({
          chats: {
            ...state.chats,
            [projectId]: { ...getSession(state, projectId), session_id: sessionId },
          },
        })),

      addMessage: (projectId, role, content) =>
        set((state) => {
          const session = getSession(state, projectId);
          return {
            chats: {
              ...state.chats,
              [projectId]: {
                ...session,
                messages: [...session.messages, { role, content }],
              },
            },
          };
        }),

      setLoading: (projectId, loading) =>
        set((state) => ({
          chats: {
            ...state.chats,
            [projectId]: { ...getSession(state, projectId), loading },
          },
        })),

      setError: (projectId, error) =>
        set((state) => ({
          chats: {
            ...state.chats,
            [projectId]: { ...getSession(state, projectId), error },
          },
        })),

      clearSession: (projectId) =>
        set((state) => {
          const { [projectId]: _removed, ...rest } = state.chats;
          return { chats: rest };
        }),

      openChat: (projectId) => set({ openProjectId: projectId }),
      closeChat: () => set({ openProjectId: null }),
    }),
    {
      name: "archigen-chat",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
