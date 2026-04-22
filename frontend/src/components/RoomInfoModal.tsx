import { useEffect, useState } from "react";
import api from "../lib/api";
import { socket } from "../lib/socket";
import {
  X,
  Hash,
  Crown,
  Users,
  User,
  Loader2,
} from "lucide-react";

type RoomInfo = {
  name: string;
  description: string;
  createdBy: string;
  members: string[];
  memberCount: number;
};

type RoomInfoModalProps = {
  open: boolean;
  onClose: () => void;
  roomName: string;
};

export default function RoomInfoModal({
  open,
  onClose,
  roomName,
}: RoomInfoModalProps) {
  const [info, setInfo] = useState<RoomInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!open || !roomName) return;

    setLoading(true);
    api
      .get(`/rooms/${encodeURIComponent(roomName)}/info`)
      .then((res) => {
        if (!res.data.error) {
          setInfo(res.data);
        }
      })
      .catch((err) => console.error("Failed to fetch room info:", err))
      .finally(() => setLoading(false));
  }, [open, roomName]);

  // Track online users
  useEffect(() => {
    if (!open) return;

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
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center animate-fade-in">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-[#1a1225]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-md mx-4 animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-500/20">
                <Hash className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white/90">
                  {loading ? "Loading..." : info?.name || roomName}
                </h2>
                {info?.description && (
                  <p className="text-xs text-white/40 mt-0.5">
                    {info.description}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          </div>
        ) : info ? (
          <>
            {/* Creator */}
            <div className="px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider font-medium">
                    Created by
                  </p>
                  <p className="text-sm font-medium text-white/85">
                    {info.createdBy || "Unknown"}
                  </p>
                </div>
              </div>
            </div>

            {/* Members */}
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-white/30" />
                <p className="text-xs text-white/40 uppercase tracking-wider font-medium">
                  Members
                </p>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 text-[10px] font-semibold">
                  {info.memberCount}
                </span>
              </div>
              <div className="max-h-52 overflow-y-auto space-y-1">
                {info.members.map((member) => (
                  <div
                    key={member}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/3 transition-colors"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-white/40" />
                      </div>
                      {onlineUsers.includes(member) && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#1a1225]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 truncate">
                        {member}
                      </p>
                    </div>
                    {member === info.createdBy && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-medium border border-amber-500/20">
                        Creator
                      </span>
                    )}
                    {onlineUsers.includes(member) && (
                      <span className="text-[10px] text-emerald-400">
                        Online
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-white/40">Room not found</p>
          </div>
        )}
      </div>
    </div>
  );
}
