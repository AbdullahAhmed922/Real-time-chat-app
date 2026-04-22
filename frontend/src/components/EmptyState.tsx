import { MessageCircle, Sparkles } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center h-full">
      <div className="text-center animate-fade-in">
        <div className="relative inline-block mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 flex items-center justify-center border border-violet-500/10 animate-float">
            <MessageCircle className="w-12 h-12 text-violet-400/40" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-500/10 animate-pulse-glow">
            <Sparkles className="w-4 h-4 text-violet-400/60" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-white/70 mb-2">
          Welcome to BuzzChat
        </h2>
        <p className="text-sm text-white/30 max-w-xs mx-auto leading-relaxed">
          Select a chat from the sidebar or start a new conversation to begin
          messaging.
        </p>
        <div className="mt-6 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 text-white/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400/50" />
            <span className="text-xs">Real-time</span>
          </div>
          <div className="flex items-center gap-2 text-white/20">
            <div className="w-2 h-2 rounded-full bg-violet-400/50" />
            <span className="text-xs">Private</span>
          </div>
          <div className="flex items-center gap-2 text-white/20">
            <div className="w-2 h-2 rounded-full bg-blue-400/50" />
            <span className="text-xs">Groups</span>
          </div>
        </div>
      </div>
    </div>
  );
}
