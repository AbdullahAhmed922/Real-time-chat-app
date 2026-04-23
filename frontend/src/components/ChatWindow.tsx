import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../hooks/useChat";
import { socket } from "../lib/socket";
import api from "../lib/api";
import MessageBubble from "./MessageBubble";
import RoomInfoModal from "./RoomInfoModal";
import { toast } from "sonner";
import {
  Send,
  Hash,
  User,
  Loader2,
  UserPlus,
  UserMinus,
  Trash2,
  Pencil,
  Check,
  X,
  MoreVertical,
  Info,
  LogOut,
} from "lucide-react";

export default function ChatWindow() {
  const { roomName, username: dmUser } = useParams<{
    roomName?: string;
    username?: string;
  }>();
  const navigate = useNavigate();
  const { username } = useAuth();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Header action states
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<false | "permanent" | "dm">(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [roomCreator, setRoomCreator] = useState<string | null>(null);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const mode = dmUser ? "dm" : "group";
  const room = roomName ? decodeURIComponent(roomName) : undefined;
  const recipient = dmUser ? decodeURIComponent(dmUser) : undefined;

  const {
    entries,
    connected,
    onlineUsers,
    sendMessage,
    editMessage,
    deleteMessage,
  } = useChat({
    mode,
    room,
    username: username || "",
    recipient,
  });

  // Fetch room creator info
  useEffect(() => {
    if (mode === "group" && room) {
      api
        .get(`/rooms/${encodeURIComponent(room)}/info`)
        .then((res) => {
          if (!res.data.error) {
            setRoomCreator(res.data.createdBy || null);
          }
        })
        .catch(() => setRoomCreator(null));
    }
  }, [mode, room]);

  // Listen for room deletion / conversation deletion to navigate away
  useEffect(() => {
    const handleRoomDeleted = (data: { roomName: string }) => {
      if (mode === "group" && room === data.roomName) {
        toast.info(`Room "${data.roomName}" has been deleted`);
        navigate("/chat");
      }
    };
    const handleConversationDeleted = (data: {
      otherUser: string;
      deletedBy: string;
    }) => {
      if (mode === "dm" && recipient === data.otherUser) {
        toast.info(`Conversation has been deleted`);
        navigate("/chat");
      }
    };
    const handleRoomRenamed = (data: {
      oldName: string;
      newName: string;
    }) => {
      if (mode === "group" && room === data.oldName) {
        navigate(`/chat/room/${encodeURIComponent(data.newName)}`, {
          replace: true,
        });
      }
    };

    socket.on("room_deleted", handleRoomDeleted);
    socket.on("conversation_deleted", handleConversationDeleted);
    socket.on("room_renamed", handleRoomRenamed);

    return () => {
      socket.off("room_deleted", handleRoomDeleted);
      socket.off("conversation_deleted", handleConversationDeleted);
      socket.off("room_renamed", handleRoomRenamed);
    };
  }, [mode, room, recipient, navigate]);

  // Close header menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        headerMenuRef.current &&
        !headerMenuRef.current.contains(e.target as Node)
      ) {
        setShowHeaderMenu(false);
      }
    };
    if (showHeaderMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showHeaderMenu]);

  // Focus rename input
  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [entries]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
    inputRef.current?.focus();
  };

  const isRecipientOnline =
    mode === "dm" && recipient && onlineUsers.includes(recipient);
  const isCreator = mode === "group" && roomCreator === username;

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleDeletePermanently = () => {
    setShowHeaderMenu(false);
    setConfirmDelete("permanent");
  };

  const handleDeleteConversation = () => {
    setShowHeaderMenu(false);
    setConfirmDelete("dm");
  };

  const handleLeaveRoom = async () => {
    setShowHeaderMenu(false);
    if (!room || !username) return;
    try {
      await api.post(`/rooms/${encodeURIComponent(room)}/leave`);
      // Notify sidebar to remove the room
      window.dispatchEvent(new CustomEvent('room-left', { detail: { roomName: room } }));
      toast.success(`Left room "${room}"`);
      navigate("/chat");
    } catch {
      toast.error("Failed to leave room");
    }
  };

  const handleStartRename = () => {
    setShowHeaderMenu(false);
    setIsRenaming(true);
    setRenameValue(room || "");
  };

  const handleOpenRoomInfo = () => {
    setShowHeaderMenu(false);
    setShowRoomInfo(true);
  };

  const submitRename = () => {
    if (!renameValue.trim() || !room || !username) return;
    if (renameValue.trim() === room) {
      setIsRenaming(false);
      return;
    }
    socket.emit("rename_room", {
      roomName: room,
      newName: renameValue.trim(),
      username,
    });
    toast.success(`Room renamed to "${renameValue.trim()}"`);
    setIsRenaming(false);
  };

  const confirmDeleteAction = () => {
    if (!username) return;

    if (confirmDelete === "permanent" && mode === "group" && room) {
      socket.emit("delete_room", { roomName: room, username });
      toast.success(`Room "${room}" permanently deleted`);
      navigate("/chat");
    } else if (confirmDelete === "dm" && mode === "dm" && recipient) {
      socket.emit("delete_conversation", { username, otherUser: recipient });
      toast.success(`Conversation deleted`);
      navigate("/chat");
    }

    setConfirmDelete(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="glass flex-shrink-0 animate-slide-down">
        <div className="px-5 py-3 flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-500/15">
              {mode === "dm" ? (
                <User className="w-5 h-5 text-violet-400" />
              ) : (
                <Hash className="w-5 h-5 text-violet-400" />
              )}
            </div>
            {isRecipientOnline && <div className="online-dot" />}
          </div>
          <div className="flex-1 min-w-0">
            {isRenaming ? (
              <div className="flex items-center gap-2">
                <input
                  ref={renameInputRef}
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitRename();
                    if (e.key === "Escape") setIsRenaming(false);
                  }}
                  className="px-3 py-1 rounded-lg bg-white/10 border border-violet-500/40 text-sm text-white focus:outline-none focus:border-violet-500/70 transition-all max-w-[200px]"
                />
                <button
                  onClick={submitRename}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-400 hover:bg-white/5 transition-all"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsRenaming(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-base font-semibold text-white/90">
                  {mode === "dm" ? recipient : `#${room}`}
                </h1>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      connected ? "bg-emerald-400" : "bg-red-400"
                    }`}
                  />
                  <span className="text-xs text-white/40">
                    {mode === "dm"
                      ? isRecipientOnline
                        ? "Online"
                        : "Offline"
                      : connected
                      ? "Connected"
                      : "Reconnecting..."}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Header action menu */}
          {!isRenaming && (
            <div className="relative" ref={headerMenuRef}>
              <button
                onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showHeaderMenu && (
                <div className="absolute right-0 top-full mt-2 bg-[#1a1225]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 py-1.5 min-w-[200px] z-50 animate-fade-in">
                  {mode === "group" && (
                    <>
                      {/* Room Info */}
                      <button
                        onClick={handleOpenRoomInfo}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <Info className="w-4 h-4 text-blue-400" />
                        Room Info
                      </button>
                      {/* Rename */}
                      <button
                        onClick={handleStartRename}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <Pencil className="w-4 h-4 text-violet-400" />
                        Rename Room
                      </button>
                      {/* Divider */}
                      <div className="my-1 h-px bg-white/5" />
                      {/* Leave Room */}
                      <button
                        onClick={handleLeaveRoom}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-orange-400/80 hover:text-orange-400 hover:bg-orange-500/5 transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        Leave Room
                      </button>
                      {/* Delete Permanently (creator only) */}
                      {isCreator && (
                        <button
                          onClick={handleDeletePermanently}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/5 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Permanently
                        </button>
                      )}
                    </>
                  )}
                  {mode === "dm" && (
                    <button
                      onClick={handleDeleteConversation}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/5 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Conversation
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-3">
          {entries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                {mode === "dm" ? (
                  <User className="w-8 h-8 text-white/15" />
                ) : (
                  <Hash className="w-8 h-8 text-white/15" />
                )}
              </div>
              <p className="text-base text-white/40 mb-1">
                {mode === "dm"
                  ? `Start chatting with ${recipient}`
                  : `Welcome to #${room}`}
              </p>
              <p className="text-sm text-white/25">
                Send the first message!
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

            return (
              <MessageBubble
                key={entry.data._id || `msg-${i}`}
                message={entry.data}
                isOwn={entry.data.username === username}
                formatTime={formatTime}
                onEdit={editMessage}
                onDelete={deleteMessage}
                index={i}
              />
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="glass flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              className="flex-1 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-violet-500/50 input-glow transition-all duration-300"
              placeholder={
                mode === "dm"
                  ? `Message ${recipient}...`
                  : `Message #${room}...`
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              autoFocus
            />
            <button
              onClick={handleSend}
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

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center animate-fade-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmDelete(false)}
          />
          <div className="relative bg-[#1a1225]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-6 max-w-sm w-full mx-4 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white/90">
                  {confirmDelete === "permanent"
                    ? "Delete Room Permanently"
                    : "Delete Conversation"}
                </h3>
                <p className="text-xs text-white/40">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-sm text-white/60 mb-6">
              {confirmDelete === "permanent" ? (
                <>
                  Are you sure you want to permanently delete{" "}
                  <span className="text-white/90 font-medium">#{room}</span>?
                  All messages and the room will be removed for everyone.
                </>
              ) : (
                <>
                  Are you sure you want to delete your conversation with{" "}
                  <span className="text-white/90 font-medium">
                    {recipient}
                  </span>
                  ? All messages will be permanently deleted.
                </>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAction}
                className="px-5 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Info Modal */}
      {mode === "group" && room && (
        <RoomInfoModal
          open={showRoomInfo}
          onClose={() => setShowRoomInfo(false)}
          roomName={room}
        />
      )}
    </div>
  );
}
