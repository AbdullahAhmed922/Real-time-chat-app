import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../hooks/useSidebar";
import { socket } from "../lib/socket";
import api from "../lib/api";
import CreateRoomDialog from "./CreateRoomDialog";
import NewChatDialog from "./NewChatDialog";
import RoomInfoModal from "./RoomInfoModal";
import DiscoverRoomsDialog from "./DiscoverRoomsDialog";
import { toast } from "sonner";
import {
  MessageCircle,
  Plus,
  LogOut,
  Hash,
  Search,
  User,
  Loader2,
  MessageSquarePlus,
  Compass,
  X,
  MoreVertical,
  Trash2,
  Pencil,
  Check,
  Info,
  LogOut as LeaveIcon,
} from "lucide-react";

type ContextMenuState = {
  x: number;
  y: number;
  type: "room" | "dm";
  name: string;
  createdBy?: string;
} | null;

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { username, logout } = useAuth();
  const {
    rooms,
    allRooms,
    conversations,
    loading,
    searchQuery,
    setSearchQuery,
    addRoom,
    addConversation,
    removeRoom,
    renameRoomLocal,
    removeConversation,
  } = useSidebar(username);

  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showDiscoverRooms, setShowDiscoverRooms] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "room" | "dm";
    name: string;
    permanent?: boolean;
    leave?: boolean;
  } | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [showRoomInfo, setShowRoomInfo] = useState<string | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Track online users
  useEffect(() => {
    const handleOnlineUsers = (users: string[]) => setOnlineUsers(users);
    const handleUserOnline = (data: { username: string }) => {
      setOnlineUsers((prev) =>
        prev.includes(data.username) ? prev : [...prev, data.username]
      );
    };
    const handleUserOffline = (data: { username: string }) => {
      setOnlineUsers((prev) => prev.filter((u) => u !== data.username));
    };

    socket.on("online_users", handleOnlineUsers);
    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);

    return () => {
      socket.off("online_users", handleOnlineUsers);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
    };
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        setContextMenu(null);
      }
    };
    if (contextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [contextMenu]);

  // Focus rename input when renaming
  useEffect(() => {
    if (renaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renaming]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleRoomClick = (roomName: string) => {
    navigate(`/chat/room/${encodeURIComponent(roomName)}`);
    onClose?.();
  };

  const handleDMClick = (otherUser: string) => {
    navigate(`/chat/dm/${encodeURIComponent(otherUser)}`);
    onClose?.();
  };

  const isActiveRoom = (roomName: string) =>
    location.pathname === `/chat/room/${encodeURIComponent(roomName)}`;

  const isActiveDM = (otherUser: string) =>
    location.pathname === `/chat/dm/${encodeURIComponent(otherUser)}`;

  const formatTime = (dateStr?: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Context menu handlers
  const handleContextMenu = (
    e: React.MouseEvent,
    type: "room" | "dm",
    name: string,
    createdBy?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type, name, createdBy });
  };

  const handleThreeDotsClick = (
    e: React.MouseEvent,
    type: "room" | "dm",
    name: string,
    createdBy?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({
      x: rect.right,
      y: rect.bottom,
      type,
      name,
      createdBy,
    });
  };

  // Leave room (delete for me)
  const handleLeaveRoom = (roomName: string) => {
    setContextMenu(null);
    setConfirmDelete({ type: "room", name: roomName, leave: true });
  };

  // Delete room permanently (creator only)
  const handleDeleteRoomPermanently = (roomName: string) => {
    setContextMenu(null);
    setConfirmDelete({ type: "room", name: roomName, permanent: true });
  };

  const handleDeleteConversation = (otherUser: string) => {
    setContextMenu(null);
    setConfirmDelete({ type: "dm", name: otherUser });
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete || !username) return;

    if (confirmDelete.type === "room" && confirmDelete.leave) {
      // Leave room
      try {
        await api.post(`/rooms/${encodeURIComponent(confirmDelete.name)}/leave`);
        removeRoom(confirmDelete.name);
        toast.success(`Left room "${confirmDelete.name}"`);
        if (isActiveRoom(confirmDelete.name)) {
          navigate("/chat");
        }
      } catch {
        toast.error("Failed to leave room");
      }
    } else if (confirmDelete.type === "room" && confirmDelete.permanent) {
      // Permanent delete (creator only)
      socket.emit("delete_room", {
        roomName: confirmDelete.name,
        username,
      });
      removeRoom(confirmDelete.name);
      toast.success(`Room "${confirmDelete.name}" permanently deleted`);
      if (isActiveRoom(confirmDelete.name)) {
        navigate("/chat");
      }
    } else if (confirmDelete.type === "dm") {
      socket.emit("delete_conversation", {
        username,
        otherUser: confirmDelete.name,
      });
      removeConversation(confirmDelete.name);
      toast.success(`Conversation with "${confirmDelete.name}" deleted`);
      if (isActiveDM(confirmDelete.name)) {
        navigate("/chat");
      }
    }

    setConfirmDelete(null);
  };

  const startRename = (roomName: string) => {
    setContextMenu(null);
    setRenaming(roomName);
    setRenameValue(roomName);
  };

  const submitRename = () => {
    if (!renaming || !renameValue.trim() || !username) return;
    if (renameValue.trim() === renaming) {
      setRenaming(null);
      return;
    }

    socket.emit("rename_room", {
      roomName: renaming,
      newName: renameValue.trim(),
      username,
    });

    renameRoomLocal(renaming, renameValue.trim());
    toast.success(`Room renamed to "${renameValue.trim()}"`);

    if (isActiveRoom(renaming)) {
      navigate(`/chat/room/${encodeURIComponent(renameValue.trim())}`);
    }

    setRenaming(null);
  };

  const openRoomInfo = (roomName: string) => {
    setContextMenu(null);
    setShowRoomInfo(roomName);
  };

  const isCreator = (createdBy?: string) => createdBy === username;

  return (
    <div className="sidebar h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white/90">BuzzChat</h1>
            <p className="text-xs text-white/40">
              <span className="text-violet-400">{username}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowNewChat(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-violet-400 hover:bg-white/5 transition-all"
            title="New chat"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowCreateRoom(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-violet-400 hover:bg-white/5 transition-all"
            title="Create room"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowDiscoverRooms(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-violet-400 hover:bg-white/5 transition-all"
            title="Discover rooms"
          >
            <Compass className="w-5 h-5" />
          </button>
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-white/5 transition-all"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/40 input-glow transition-all"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Rooms Section */}
            {rooms.length > 0 && (
              <div className="mb-2">
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/25">
                  Rooms
                </p>
                {rooms.map((room) => (
                  <div
                    key={room._id || room.name}
                    className="relative group"
                    onContextMenu={(e) =>
                      handleContextMenu(e, "room", room.name, room.createdBy)
                    }
                  >
                    {renaming === room.name ? (
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-500/20 border border-violet-500/30 flex-shrink-0">
                          <Hash className="w-4 h-4 text-violet-400" />
                        </div>
                        <input
                          ref={renameInputRef}
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") submitRename();
                            if (e.key === "Escape") setRenaming(null);
                          }}
                          onBlur={submitRename}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-white/10 border border-violet-500/40 text-sm text-white focus:outline-none focus:border-violet-500/70 transition-all"
                        />
                        <button
                          onClick={submitRename}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-400 hover:bg-white/5 transition-all"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className={`sidebar-item w-full flex items-center ${
                        isActiveRoom(room.name) ? "sidebar-item-active" : ""
                      }`}>
                        <button
                          onClick={() => handleRoomClick(room.name)}
                          className="flex-1 flex items-center gap-3 text-left min-w-0"
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors flex-shrink-0 ${
                              isActiveRoom(room.name)
                                ? "bg-violet-500/20 border-violet-500/30"
                                : "bg-white/5 border-white/8"
                            }`}
                          >
                            <Hash
                              className={`w-4 h-4 ${
                                isActiveRoom(room.name)
                                  ? "text-violet-400"
                                  : "text-white/30"
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-white/85 truncate">
                                {room.name}
                              </p>
                              {room.members && room.members.length > 0 && (
                                <span className="text-[10px] text-white/25 ml-2 flex-shrink-0">
                                  {room.members.length} 👤
                                </span>
                              )}
                            </div>
                            {room.description && (
                              <p className="text-xs text-white/30 truncate mt-0.5">
                                {room.description}
                              </p>
                            )}
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleThreeDotsClick(
                              e,
                              "room",
                              room.name,
                              room.createdBy
                            );
                          }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/0 group-hover:text-white/30 hover:!text-white/60 hover:!bg-white/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0 cursor-pointer ml-1"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* DMs Section */}
            {conversations.length > 0 && (
              <div>
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/25">
                  Direct Messages
                </p>
                {conversations.map((conv) => (
                  <div
                    key={conv._id || conv.otherUser}
                    className="relative group"
                    onContextMenu={(e) =>
                      handleContextMenu(e, "dm", conv.otherUser)
                    }
                  >
                    <button
                      onClick={() => handleDMClick(conv.otherUser)}
                      className={`sidebar-item w-full text-left ${
                        isActiveDM(conv.otherUser) ? "sidebar-item-active" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                              isActiveDM(conv.otherUser)
                                ? "bg-violet-500/20 border-violet-500/30"
                                : "bg-white/5 border-white/8"
                            }`}
                          >
                            <User
                              className={`w-4 h-4 ${
                                isActiveDM(conv.otherUser)
                                  ? "text-violet-400"
                                  : "text-white/30"
                              }`}
                            />
                          </div>
                          {onlineUsers.includes(conv.otherUser) && (
                            <div className="online-dot" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-white/85 truncate">
                              {conv.otherUser}
                            </p>
                            <span className="text-[10px] text-white/25 ml-2 flex-shrink-0">
                              {formatTime(conv.lastMessageAt)}
                            </span>
                          </div>
                          {conv.lastMessage && (
                            <p className="text-xs text-white/30 truncate mt-0.5">
                              {conv.lastMessage}
                            </p>
                          )}
                        </div>
                        <div
                          onClick={(e) =>
                            handleThreeDotsClick(e, "dm", conv.otherUser)
                          }
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/0 group-hover:text-white/30 hover:!text-white/60 hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0 cursor-pointer"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {rooms.length === 0 && conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                  <MessageCircle className="w-7 h-7 text-white/15" />
                </div>
                <p className="text-sm text-white/35 mb-1">No chats yet</p>
                <p className="text-xs text-white/20">
                  Create a room or start a DM
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-[100] animate-fade-in"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 200),
            top: Math.min(contextMenu.y, window.innerHeight - 200),
          }}
        >
          <div className="bg-[#1a1225]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 py-1.5 min-w-[180px] overflow-hidden">
            {contextMenu.type === "room" && (
              <>
                {/* Room Info */}
                <button
                  onClick={() => openRoomInfo(contextMenu.name)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all"
                >
                  <Info className="w-4 h-4 text-blue-400" />
                  Room Info
                </button>
                {/* Rename */}
                <button
                  onClick={() => startRename(contextMenu.name)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all"
                >
                  <Pencil className="w-4 h-4 text-violet-400" />
                  Rename
                </button>
                {/* Divider */}
                <div className="my-1 h-px bg-white/5" />
                {/* Leave Room (delete for me) */}
                <button
                  onClick={() => handleLeaveRoom(contextMenu.name)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-orange-400/80 hover:text-orange-400 hover:bg-orange-500/5 transition-all"
                >
                  <LeaveIcon className="w-4 h-4" />
                  Leave Room
                </button>
                {/* Delete Permanently (creator only) */}
                {isCreator(contextMenu.createdBy) && (
                  <button
                    onClick={() =>
                      handleDeleteRoomPermanently(contextMenu.name)
                    }
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/5 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Permanently
                  </button>
                )}
              </>
            )}
            {contextMenu.type === "dm" && (
              <button
                onClick={() => handleDeleteConversation(contextMenu.name)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/5 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Delete Conversation
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center animate-fade-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmDelete(null)}
          />
          <div className="relative bg-[#1a1225]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-6 max-w-sm w-full mx-4 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white/90">
                  {confirmDelete.leave
                    ? "Leave Room"
                    : confirmDelete.type === "room"
                    ? "Delete Room Permanently"
                    : "Delete Conversation"}
                </h3>
                <p className="text-xs text-white/40">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-sm text-white/60 mb-6">
              {confirmDelete.leave ? (
                <>
                  Are you sure you want to leave{" "}
                  <span className="text-white/90 font-medium">
                    #{confirmDelete.name}
                  </span>
                  ? You can rejoin later from the Discover Rooms menu.
                </>
              ) : confirmDelete.type === "room" ? (
                <>
                  Are you sure you want to permanently delete{" "}
                  <span className="text-white/90 font-medium">
                    #{confirmDelete.name}
                  </span>
                  ? All messages and the room itself will be removed for
                  everyone.
                </>
              ) : (
                <>
                  Are you sure you want to delete your conversation with{" "}
                  <span className="text-white/90 font-medium">
                    {confirmDelete.name}
                  </span>
                  ? All messages will be permanently deleted.
                </>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAction}
                className="px-5 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-all"
              >
                {confirmDelete.leave ? "Leave" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Info Modal */}
      <RoomInfoModal
        open={!!showRoomInfo}
        onClose={() => setShowRoomInfo(null)}
        roomName={showRoomInfo || ""}
      />

      {/* Dialogs */}
      <CreateRoomDialog
        open={showCreateRoom}
        onOpenChange={setShowCreateRoom}
        onRoomCreated={(room) => {
          addRoom({ ...room, type: "room" });
          handleRoomClick(room.name);
        }}
      />
      <NewChatDialog
        open={showNewChat}
        onOpenChange={setShowNewChat}
        currentUser={username || ""}
        onUserSelected={(otherUser) => {
          addConversation(otherUser);
          handleDMClick(otherUser);
        }}
      />
      <DiscoverRoomsDialog
        open={showDiscoverRooms}
        onOpenChange={setShowDiscoverRooms}
        currentUser={username || ""}
        myRoomNames={allRooms.map((r) => r.name)}
        onRoomJoined={(room) => {
          addRoom({ ...room, type: "room" });
          handleRoomClick(room.name);
        }}
      />
    </div>
  );
}
