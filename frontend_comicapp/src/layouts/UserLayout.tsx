import React, { useContext, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { io, type Socket } from "socket.io-client";

import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import ChatbotWidget from "@/components/Header/ChatbotWidget";
import { AuthContext } from "@/context/AuthContext";

export default function UserLayout() {
  const location = useLocation();
  const { isLoggedIn } = useContext(AuthContext);

  // Ẩn header/footer khi đọc chapter
  const hideLayout = /^\/truyen-tranh\/[^/]+\/chapter\/\d+(\.\d+)?$/.test(
    location.pathname
  );

  // ===== CHATBOT STATE =====
  const [showChatbot, setShowChatbot] = useState(false);
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // ===== SOCKET DÙNG CHUNG (notification + chatbot) =====
  useEffect(() => {
    if (!isLoggedIn) {
      setShowChatbot(false);
      setSocketInstance(null);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    if (socketRef.current?.connected) return;

    const token = localStorage.getItem("token");
    const s = io(`${import.meta.env.VITE_SOCKET_URL}`, {
      autoConnect: false,
      transports: ["websocket"],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    s.connect();
    socketRef.current = s;
    setSocketInstance(s);

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocketInstance(null);
    };
  }, [isLoggedIn]);

  return (
    <div className="min-h-screen flex flex-col">
      {!hideLayout && (
        <Header onToggleChatbot={() => setShowChatbot((v) => !v)} />
      )}

      <main className={hideLayout ? "" : "flex-1 container px-4 py-6"}>
        <Outlet />
      </main>

      {!hideLayout && <Footer />}

      {/* ✅ CHATBOT NẰM NGOÀI HEADER – fixed bottom-right */}
      <ChatbotWidget
        open={showChatbot}
        onOpenChange={setShowChatbot}
        socket={socketInstance}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}
