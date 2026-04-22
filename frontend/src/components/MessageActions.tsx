import { Pencil, Trash2, Copy, MoreVertical } from "lucide-react";
import { useState, useRef, useEffect } from "react";

type MessageActionsProps = {
  isOwn: boolean;
  onEdit: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  onCopy: () => void;
};

export default function MessageActions({
  isOwn,
  onEdit,
  onDeleteForMe,
  onDeleteForEveryone,
  onCopy,
}: MessageActionsProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-7 h-7 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/15 transition-all"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          className={`absolute z-50 ${
            isOwn ? "right-0" : "left-0"
          } bottom-full mb-1 w-48 py-1 rounded-xl bg-[#1a1030]/95 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/30 animate-fade-in`}
        >
          {isOwn && (
            <button
              onClick={() => { onEdit(); setOpen(false); }}
              className="w-full px-3 py-2 flex items-center gap-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5 text-violet-400" />
              Edit message
            </button>
          )}
          <button
            onClick={() => { onCopy(); setOpen(false); }}
            className="w-full px-3 py-2 flex items-center gap-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-blue-400" />
            Copy text
          </button>
          <div className="h-px bg-white/5 my-1" />
          <button
            onClick={() => { onDeleteForMe(); setOpen(false); }}
            className="w-full px-3 py-2 flex items-center gap-3 text-sm text-red-400/70 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete for me
          </button>
          {isOwn && (
            <button
              onClick={() => { onDeleteForEveryone(); setOpen(false); }}
              className="w-full px-3 py-2 flex items-center gap-3 text-sm text-red-400/70 hover:text-red-400 hover:bg-white/5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete for everyone
            </button>
          )}
        </div>
      )}
    </div>
  );
}
