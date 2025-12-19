import { createContext, useContext, useMemo, useState } from "react";
import type { Socket } from "socket.io-client";

type ChatbotCtx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  socket: Socket | null;
  setSocket: (s: Socket | null) => void;
};

const Ctx = createContext<ChatbotCtx | null>(null);

export function ChatbotProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      toggle: () => setOpen((v) => !v),
      socket,
      setSocket,
    }),
    [open, socket]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useChatbot() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useChatbot must be used within ChatbotProvider");
  return ctx;
}
