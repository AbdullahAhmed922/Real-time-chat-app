import { useState, useEffect } from "react";
import api from "../lib/api";
import { Search, Hash, Loader2, X, Users, LogIn } from "lucide-react";
import { toast } from "sonner";

type Room = {
  _id: string;
  name: string;
  description?: string;
  createdBy?: string;
  members?: string[];
};

type DiscoverRoomsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: string;
  /** Names of rooms the user is already a member of */
  myRoomNames: string[];
  onRoomJoined: (room: {
    _id?: string;
    name: string;
    description?: string;
    createdBy?: string;
    members?: string[];
  }) => void;
};

export default function DiscoverRoomsDialog({
  open,
  onOpenChange,
  myRoomNames,
  onRoomJoined,
}: DiscoverRoomsDialogProps) {
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const fetchRooms = async () => {
      setLoading(true);
      try {
        const res = await api.get<Room[]>("/rooms");
        setAllRooms(res.data);
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [open]);

  const myRoomSet = new Set(myRoomNames);

  // Filter to show only rooms the user is NOT a member of
  const discoverableRooms = allRooms.filter((r) => {
    if (myRoomSet.has(r.name)) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
  });

  const handleJoin = async (room: Room) => {
    setJoiningRoom(room.name);
    try {
      const res = await api.post(`/rooms/${encodeURIComponent(room.name)}/join`);
      onRoomJoined({
        _id: res.data._id || room._id,
        name: res.data.name || room.name,
        description: res.data.description || room.description,
        createdBy: res.data.createdBy || room.createdBy,
        members: res.data.members || room.members,
      });
      toast.success(`Joined room "${room.name}"!`);
      onOpenChange(false);
      setSearchQuery("");
    } catch {
      toast.error("Failed to join room");
    } finally {
      setJoiningRoom(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative w-full max-w-md mx-4 rounded-2xl bg-[#1a1030]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40 animate-slide-up">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-400" />
            <h2 className="text-base font-semibold text-white/90">
              Discover Rooms
            </h2>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/40 input-glow transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* Room List */}
        <div className="max-h-72 overflow-y-auto px-3 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
            </div>
          ) : discoverableRooms.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                <Hash className="w-6 h-6 text-white/15" />
              </div>
              <p className="text-sm text-white/30">
                {searchQuery
                  ? "No rooms match your search"
                  : "No rooms available to join"}
              </p>
              <p className="text-xs text-white/20 mt-1">
                You're already in all rooms!
              </p>
            </div>
          ) : (
            discoverableRooms.map((room) => (
              <div
                key={room._id || room.name}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <Hash className="w-4 h-4 text-violet-400/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/85 truncate">
                    {room.name}
                  </p>
                  <div className="flex items-center gap-2">
                    {room.description && (
                      <p className="text-xs text-white/30 truncate">
                        {room.description}
                      </p>
                    )}
                    <span className="text-[10px] text-white/20 flex-shrink-0">
                      {room.members?.length || 0} members
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleJoin(room)}
                  disabled={joiningRoom === room.name}
                  className="px-3.5 py-1.5 rounded-lg bg-violet-500/15 border border-violet-500/25 text-violet-400 text-xs font-medium hover:bg-violet-500/25 hover:border-violet-500/40 transition-all disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
                >
                  {joiningRoom === room.name ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-3 h-3" />
                      Join
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
