import { useState } from "react";
// import type { AxiosError } from "axios";
import { isAxiosError } from "axios";
import api from "../lib/api";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { MessageCircle, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      login(res.data.token, res.data.username);
      toast.success(`Welcome back, ${res.data.username}!`);
      navigate("/rooms");
    } catch (err: unknown) {
    const message =
      (isAxiosError(err) && err.response?.data?.message) || "Invalid credentials. Please try again.";
    toast.error(message);
  } finally {
    setLoading(false);
  }
}


  return (
    <div className="bg-gradient-main flex items-center justify-center min-h-screen p-4">

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 mb-4 shadow-lg shadow-violet-500/25 animate-float">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
            BuzzChat
          </h1>
          <p className="text-sm text-white/40 mt-1">Connect. Chat. Collaborate.</p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl p-8 animate-pulse-glow">
          <h2 className="text-xl font-semibold text-white/90 mb-1">Welcome back</h2>
          <p className="text-sm text-white/40 mb-6">Sign in to continue to your chats</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-violet-500/50 input-glow transition-all duration-300"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-violet-500/50 input-glow transition-all duration-300"
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm hover:from-violet-500 hover:to-indigo-500 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30">New here?</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Register link */}
          <Link
            to="/register"
            className="block w-full py-3 rounded-xl border border-white/10 text-center text-sm text-white/60 hover:text-white hover:border-violet-500/30 hover:bg-white/5 transition-all duration-300"
          >
            Create an account
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/20 mt-6">
          Secured with end-to-end encryption
        </p>
      </div>
    </div>
  );
}

// import { useState, useEffect, useRef } from "react";
// import { isAxiosError } from "axios";
// import api from "../lib/api";
// import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import { toast } from "sonner";
// import { MessageCircle, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

// export default function Login() {
//   const [form, setForm] = useState({ email: "", password: "" });
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();
//   const { login } = useAuth();

// const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//   e.preventDefault();
//   if (!form.email || !form.password) {
//     toast.error("Please fill in all fields");
//     return;
//   }
//   setLoading(true);
//   try {
//     const res = await api.post("/auth/login", form);
//     login(res.data.token, res.data.username);
//     toast.success(`Welcome Back, ${res.data.username}!`);
//     navigate("/rooms");
//   } catch (err: unknown) {
//     const message =
//       (isAxiosError(err) && err.response?.data?.message) || "Invalid credentials. Please try again.";
//     toast.error(message);
//   } finally {
//     setLoading(false);
//   }
// }
// };

//  return (
//     <div className="bg-gradient-main flex items-center justify-center min-h-screen p-4">
//       {/* Floating orbs */}
//       <div className="fixed top-1/4 left-1/4 w-64 h-64 rounded-full bg-violet-600/10 blur-3xl animate-float pointer-events-none" />
//       <div className="fixed bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-600/8 blur-3xl animate-float pointer-events-none" style={{ animationDelay: "1.5s" }} />

//       <div className="w-full max-w-md animate-slide-up">
//         {/* Logo */}
//         <div className="text-center mb-8 animate-fade-in">
//           <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 mb-4 shadow-lg shadow-violet-500/25 animate-float">
//             <MessageCircle className="w-8 h-8 text-white" />
//           </div>
//           <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
//             BuzzChat
//           </h1>
//           <p className="text-sm text-white/40 mt-1">Connect. Chat. Collaborate.</p>
//         </div>

//         {/* Card */}
//         <div className="glass-strong rounded-2xl p-8 animate-pulse-glow">
//           <h2 className="text-xl font-semibold text-white/90 mb-1">Welcome back</h2>
//           <p className="text-sm text-white/40 mb-6">Sign in to continue to your chats</p>

//           <form onSubmit={handleSubmit} className="space-y-4">
//             {/* Email */}
//             <div className="relative">
//               <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
//               <input
//                 type="email"
//                 placeholder="Email address"
//                 value={form.email}
//                 onChange={(e) => setForm({ ...form, email: e.target.value })}
//                 className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-violet-500/50 input-glow transition-all duration-300"
//                 required
//               />
//             </div>

//             {/* Password */}
//             <div className="relative">
//               <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
//               <input
//                 type="password"
//                 placeholder="Password"
//                 value={form.password}
//                 onChange={(e) => setForm({ ...form, password: e.target.value })}
//                 className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-violet-500/50 input-glow transition-all duration-300"
//                 required
//               />
//             </div>

//             {/* Submit */}
//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm hover:from-violet-500 hover:to-indigo-500 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
//             >
//               {loading ? (
//                 <Loader2 className="w-4 h-4 animate-spin" />
//               ) : (
//                 <>
//                   Sign In
//                   <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
//                 </>
//               )}
//             </button>
//           </form>

//           {/* Divider */}
//           <div className="flex items-center gap-3 my-6">
//             <div className="flex-1 h-px bg-white/10" />
//             <span className="text-xs text-white/30">New here?</span>
//             <div className="flex-1 h-px bg-white/10" />
//           </div>

//           {/* Register link */}
//           <Link
//             to="/register"
//             className="block w-full py-3 rounded-xl border border-white/10 text-center text-sm text-white/60 hover:text-white hover:border-violet-500/30 hover:bg-white/5 transition-all duration-300"
//           >
//             Create an account
//           </Link>
//         </div>

//         {/* Footer */}
//         <p className="text-center text-xs text-white/20 mt-6">
//           Secured with end-to-end encryption
//         </p>
//       </div>
//     </div>
//   );
