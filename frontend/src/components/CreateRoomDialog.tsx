import { useState } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { Sparkles, ArrowRight, Loader2, X } from "lucide-react";
import type { AxiosError } from "axios";

type CreateRoomDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoomCreated: (room: { _id?: string; name: string; description?: string }) => void;
};

export default function CreateRoomDialog({
  open,
  onOpenChange,
  onRoomCreated,
}: CreateRoomDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Room name is required");
      return;
    }
    setCreating(true);
    try {
      const res = await api.post("/rooms", {
        name: name.trim(),
        description: description.trim(),
      });
      onRoomCreated(res.data);
      setName("");
      setDescription("");
      onOpenChange(false);
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
            <Sparkles className="w-5 h-5 text-violet-400" />
            <h2 className="text-base font-semibold text-white/90">
              Create New Room
            </h2>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-3">
          <input
            type="text"
            placeholder="Room name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-violet-500/50 input-glow transition-all duration-300"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-violet-500/50 input-glow transition-all duration-300"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
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
    </div>
  );
}
