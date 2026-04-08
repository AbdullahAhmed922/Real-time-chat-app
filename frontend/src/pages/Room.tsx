import { useEffect, useState } from "react";
import type { AxiosError } from "axios";
import api from "../lib/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import {
  MessageCircle,
  Plus,
  LogOut,
  Hash,
  ArrowRight,
  Loader2,
  Users,
  Sparkles,
} from "lucide-react";

type RoomItem = {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
};

export default function Room() {
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [newRoom, setNewRoom] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { username, logout } = useAuth();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get<RoomItem[]>("/rooms");
        setRooms(res.data);
      } catch (err) {
        const message =
          (err as AxiosError<{ message?: string }>).response?.data?.message ||
          "Failed to fetch rooms";
        toast.error(message);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);

  const handleCreateRoom = async () => {
    if (!newRoom.trim()) {
      toast.error("Room name is required");
      return;
    }
    setCreating(true);
    try {
      const res = await api.post<RoomItem>("/rooms", {
        name: newRoom.trim(),
        description: newDescription.trim(),
      });
      setRooms((prev) => [...prev, res.data]);
      setNewRoom("");
      setNewDescription("");
      setShowCreate(false);
      toast.success(`Room "${res.data.name}" created!`);
    } catch (err) {
      const message =
        (err as AxiosError<{ message?: string }>).response?.data?.message ||
        "Failed to create room";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Signed out successfully");
  };

  return (
    <div className="bg-gradient-main min-h-screen">
   
      {/* Header */}
      <header className="glass sticky top-0 z-50 animate-slide-down">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white/90">BuzzChat</h1>
              <p className="text-xs text-white/40">
                Hey, <span className="text-violet-400">{username}</span> 👋
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-300"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Title bar */}
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <div>
            <h2 className="text-2xl font-bold text-white/90 flex items-center gap-2">
              <Users className="w-6 h-6 text-violet-400" />
              Chat Rooms
            </h2>
            <p className="text-sm text-white/40 mt-1">
              {rooms.length} room{rooms.length !== 1 ? "s" : ""} available
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/25 group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            New Room
          </button>
        </div>

        {/* Create Room Panel */}
        {showCreate && (
          <div className="glass-strong rounded-2xl p-6 mb-8 animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <h3 className="text-base font-semibold text-white/90">Create a new room</h3>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Room name"
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-violet-500/50 input-glow transition-all duration-300"
                onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-violet-500/50 input-glow transition-all duration-300"
                onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRoom}
                  disabled={creating}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Create
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Room List */}
        {loadingRooms ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin mb-4" />
            <p className="text-sm text-white/40">Loading rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Hash className="w-10 h-10 text-white/15" />
            </div>
            <p className="text-base text-white/40 mb-1">No rooms yet</p>
            <p className="text-sm text-white/25">Create one to get started!</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {rooms.map((room, i) => (
              <button
                key={room._id ?? room.id ?? room.name}
                onClick={() =>
                  navigate(`/chat/${encodeURIComponent(room.name)}`)
                }
                className={`glass-card rounded-xl p-5 text-left group animate-slide-up w-full`}
                style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-500/10 group-hover:border-violet-500/30 transition-colors">
                      <Hash className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white/90 group-hover:text-white transition-colors">
                        {room.name}
                      </h3>
                      {room.description && (
                        <p className="text-sm text-white/35 mt-0.5">{room.description}</p>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-violet-400 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}