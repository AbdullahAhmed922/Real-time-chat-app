import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../lib/socket";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  Send,
  Hash,
  Loader2,
  UserPlus,
  UserMinus,
} from "lucide-react";

type Message = {
  _id?: string;
  username: string;
  room: string;
  content: string;
  createdAt?: string;
};

type SystemEvent = {
  type: "joined" | "left";
  username: string;
  message: string;
};

type ChatEntry =
  | { kind: "message"; data: Message }
  | { kind: "system"; data: SystemEvent };

export default function Chat() {
  const { roomName } = useParams<{ roomName: string }>();
  const room = decodeURIComponent(roomName || "");
  const navigate = useNavigate();
  const { username } = useAuth();
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [entries]);

  // Socket connection & room join/leave
  useEffect(() => {
    if (!room || !username) return;

    // Connect socket if not connected
    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => {
      setConnected(true);
      socket.emit("join_room", { room, username });
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    // If already connected, join immediately
    if (socket.connected) {
      setConnected(true);
      socket.emit("join_room", { room, username });
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // Chat history
    socket.on("chat_history", (history: Message[]) => {
      setEntries(history.map((msg) => ({ kind: "message", data: msg })));
    });

    // New message
    socket.on("new_message", (msg: Message) => {
      setEntries((prev) => [...prev, { kind: "message", data: msg }]);
    });

    // User joined
    socket.on(
      "user_joined",
      (data: { username: string; message: string }) => {
        setEntries((prev) => [
          ...prev,
          { kind: "system", data: { type: "joined", ...data } },
        ]);
      }
    );

    // User left
    socket.on("user_left", (data: { username: string; message: string }) => {
      setEntries((prev) => [
        ...prev,
        { kind: "system", data: { type: "left", ...data } },
      ]);
    });

    return () => {
      socket.emit("leave_room", { room, username });
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("chat_history");
      socket.off("new_message");
      socket.off("user_joined");
      socket.off("user_left");
    };
  }, [room, username]);

  const sendMessage = () => {
    if (!input.trim() || !room || !username) return;
    socket.emit("send_message", {
      room,
      username,
      content: input.trim(),
    });
    setInput("");
    inputRef.current?.focus();
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleBack = () => {
    navigate("/rooms");
  };

  return (
    <div className="bg-gradient-main flex flex-col h-screen">
      {/* Header */}
      <header className="glass sticky top-0 z-50 animate-slide-down">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-500/15">
              <Hash className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white/90">{room}</h1>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connected ? "bg-emerald-400" : "bg-red-400"
                  }`}
                />
                <span className="text-xs text-white/40">
                  {connected ? "Connected" : "Reconnecting..."}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-3">
          {entries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <Hash className="w-8 h-8 text-white/15" />
              </div>
              <p className="text-base text-white/40 mb-1">
                Welcome to #{room}
              </p>
              <p className="text-sm text-white/25">
                Start the conversation!
              </p>
            </div>
          )}

          {entries.map((entry, i) => {
            if (entry.kind === "system") {
              const isJoined = entry.data.type === "joined";
              return (
                <div
                  key={`sys-${i}`}
                  className="flex items-center justify-center gap-2 py-2 animate-fade-in"
                >
                  {isJoined ? (
                    <UserPlus className="w-3 h-3 text-emerald-400/60" />
                  ) : (
                    <UserMinus className="w-3 h-3 text-orange-400/60" />
                  )}
                  <span className="text-xs text-white/30">
                    {entry.data.message}
                  </span>
                </div>
              );
            }

            const msg = entry.data;
            const isOwn = msg.username === username;

            return (
              <div
                key={msg._id || `msg-${i}`}
                className={`flex ${
                  isOwn ? "justify-end" : "justify-start"
                } animate-message-pop`}
                style={{ animationDelay: `${Math.min(i * 0.02, 0.3)}s` }}
              >
                <div
                  className={`max-w-[75%] md:max-w-[60%] ${
                    isOwn ? "order-1" : ""
                  }`}
                >
                  {/* Username */}
                  {!isOwn && (
                    <p className="text-xs text-violet-400/70 mb-1 ml-3 font-medium">
                      {msg.username}
                    </p>
                  )}

                  {/* Bubble */}
                  <div
                    className={`px-4 py-2.5 text-sm leading-relaxed ${
                      isOwn
                        ? "msg-own rounded-2xl rounded-br-md"
                        : "msg-other rounded-2xl rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Time */}
                  <p
                    className={`text-[10px] text-white/25 mt-1 ${
                      isOwn ? "text-right mr-3" : "ml-3"
                    }`}
                  >
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="glass sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              className="flex-1 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-violet-500/50 input-glow transition-all duration-300"
              placeholder={`Message #${room}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              autoFocus
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="w-11 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center text-white hover:from-violet-500 hover:to-indigo-500 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/25 disabled:opacity-30 disabled:cursor-not-allowed group"
            >
              {!connected ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


