import { useState, useEffect } from "react";
import api from "../lib/api";
import { Search, User, Loader2, X } from "lucide-react";

type NewChatDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: string;
  onUserSelected: (username: string) => void;
};

type UserItem = {
  _id: string;
  username: string;
  email: string;
};

export default function NewChatDialog({
  open,
  onOpenChange,
  currentUser,
  onUserSelected,
}: NewChatDialogProps) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const url = searchQuery
          ? `/users/search?q=${encodeURIComponent(searchQuery)}`
          : "/users";
        const res = await api.get<UserItem[]>(url);
        setUsers(res.data.filter((u) => u.username !== currentUser));
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [open, searchQuery, currentUser]);

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
          <h2 className="text-base font-semibold text-white/90">New Chat</h2>
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
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/40 input-glow transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* User List */}
        <div className="max-h-72 overflow-y-auto px-3 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-white/30">No users found</p>
            </div>
          ) : (
            users.map((user) => (
              <button
                key={user._id}
                onClick={() => {
                  onUserSelected(user.username);
                  onOpenChange(false);
                  setSearchQuery("");
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center">
                  <User className="w-4 h-4 text-violet-400/60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/85">
                    {user.username}
                  </p>
                  <p className="text-xs text-white/30">{user.email}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
