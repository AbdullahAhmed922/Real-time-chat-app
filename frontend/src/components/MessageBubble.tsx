import { useState } from "react";
import type { Message } from "../hooks/useChat";
import MessageActions from "./MessageActions";

type MessageBubbleProps = {
  message: Message;
  isOwn: boolean;
  formatTime: (dateStr?: string) => string;
  onEdit: (messageId: string, newContent: string) => void;
  onDelete: (messageId: string, deleteFor: "me" | "everyone") => void;
  index: number;
};

export default function MessageBubble({
  message,
  isOwn,
  formatTime,
  onEdit,
  onDelete,
  index,
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);

  const handleEdit = () => {
    setEditContent(message.content);
    setIsEditing(true);
    setShowActions(false);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && message._id) {
      onEdit(message._id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  const handleDelete = (deleteFor: "me" | "everyone") => {
    if (message._id) {
      onDelete(message._id, deleteFor);
    }
    setShowActions(false);
  };

  if (message.isDeleted) {
    return (
      <div
        className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-message-pop`}
        style={{ animationDelay: `${Math.min(index * 0.02, 0.3)}s` }}
      >
        <div className="max-w-[75%] md:max-w-[60%]">
          <div className="px-4 py-2.5 rounded-2xl bg-white/3 border border-white/5">
            <p className="text-sm text-white/25 italic">
              🚫 This message was deleted
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-message-pop group/msg`}
      style={{ animationDelay: `${Math.min(index * 0.02, 0.3)}s` }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`max-w-[75%] md:max-w-[60%] ${isOwn ? "order-1" : ""}`}>
        {/* Username */}
        {!isOwn && (
          <p className="text-xs text-violet-400/70 mb-1 ml-3 font-medium">
            {message.username}
          </p>
        )}

        {/* Bubble */}
        <div className="relative">
          {isEditing ? (
            <div className="px-4 py-3 rounded-2xl bg-white/8 border border-violet-500/30">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") handleCancelEdit();
                }}
                className="w-full bg-transparent text-sm text-white focus:outline-none edit-input"
                autoFocus
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleSaveEdit}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Save
                </button>
                <span className="text-white/15">·</span>
                <button
                  onClick={handleCancelEdit}
                  className="text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                  Cancel
                </button>
                <span className="text-[10px] text-white/20 ml-auto">
                  Esc to cancel
                </span>
              </div>
            </div>
          ) : (
            <div
              className={`px-4 py-2.5 text-sm leading-relaxed ${
                isOwn
                  ? "msg-own rounded-2xl rounded-br-md"
                  : "msg-other rounded-2xl rounded-bl-md"
              }`}
            >
              {message.content}
              {message.isEdited && (
                <span className="text-[10px] text-white/30 ml-2">(edited)</span>
              )}
            </div>
          )}

          {/* Message actions */}
          {showActions && !isEditing && (
            <div className={`message-actions ${isOwn ? "right-0" : "left-0"}`}>
              <MessageActions
                isOwn={isOwn}
                onEdit={handleEdit}
                onDeleteForMe={() => handleDelete("me")}
                onDeleteForEveryone={() => handleDelete("everyone")}
                onCopy={() => navigator.clipboard.writeText(message.content)}
              />
            </div>
          )}
        </div>

        {/* Time */}
        {!isEditing && (
          <p
            className={`text-[10px] text-white/25 mt-1 ${
              isOwn ? "text-right mr-3" : "ml-3"
            }`}
          >
            {formatTime(message.createdAt)}
          </p>
        )}
      </div>
    </div>
  );
}
