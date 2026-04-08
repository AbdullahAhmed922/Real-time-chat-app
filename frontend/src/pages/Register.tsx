import { useState } from "react";
import type { AxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { toast } from "sonner";
import { MessageCircle, Mail, Lock, User, ArrowRight, Loader2, Check } from "lucide-react";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const passwordStrength = (() => {
    const p = form.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Excellent"][passwordStrength];
  const strengthColor = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-400"][passwordStrength];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      toast.success("Account created! Please sign in.");
      navigate("/login");
    } catch (err) {
      const message =
        (err as AxiosError<{ message?: string }>).response?.data?.message ||
        "Registration failed. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-main flex items-center justify-center min-h-screen p-4">
      
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-500/25 animate-float">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-300 bg-clip-text text-transparent">
            Join BuzzChat
          </h1>
          <p className="text-sm text-white/40 mt-1">Create your account in seconds</p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl p-8 animate-pulse-glow">
          <h2 className="text-xl font-semibold text-white/90 mb-1">Create account</h2>
          <p className="text-sm text-white/40 mb-6">Fill in your details to get started</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-violet-500/50 input-glow transition-all duration-300"
                required
              />
            </div>

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
            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="password"
                  placeholder="Password (min 6 characters)"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-violet-500/50 input-glow transition-all duration-300"
                  required
                />
              </div>
              {/* Strength indicator */}
              {form.password && (
                <div className="mt-2 animate-fade-in">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= passwordStrength ? strengthColor : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-white/40">{strengthLabel}</p>
                </div>
              )}
            </div>

            {/* Requirements */}
            <div className="space-y-1">
              {[
                { met: form.password.length >= 6, label: "At least 6 characters" },
                { met: /[A-Z]/.test(form.password), label: "One uppercase letter" },
                { met: /[0-9]/.test(form.password), label: "One number" },
              ].map((req) => (
                <div key={req.label} className="flex items-center gap-2">
                  <Check className={`w-3 h-3 transition-colors ${req.met ? "text-emerald-400" : "text-white/15"}`} />
                  <span className={`text-xs transition-colors ${req.met ? "text-emerald-400/80" : "text-white/25"}`}>{req.label}</span>
                </div>
              ))}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30">Already a member?</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Login link */}
          <Link
            to="/login"
            className="block w-full py-3 rounded-xl border border-white/10 text-center text-sm text-white/60 hover:text-white hover:border-violet-500/30 hover:bg-white/5 transition-all duration-300"
          >
            Sign in instead
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/20 mt-6">
          By creating an account you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}


// import { useState } from "react";
// import { isAxiosError } from "axios";
// import { Link, useNavigate } from "react-router-dom";
// import api from "../lib/api";
// import { toast } from "sonner";
// import { MessageCircle, Mail, Lock, User, ArrowRight, Loader2, Check } from "lucide-react";
 
// export default function Register() {
//   const [form, setForm] = useState({
//     username: "",
//     email: "",
//     password: "",
//   });
//   const [loading, setLoading] = useState(false
//   const navigate = useNavigate();

//   const passwordStrength = (() => {
//     const p = form.password;
//     if (!p) return 0;
//     let score = 0;
//     if (p.length >= 6) score++;
//     if (p.length >= 8) score++;
//     if (/[A-Z]/.test(p)) score++;
//     if (/[0-9]/.test(p)) score++;
//     if (/[^A-Za-z0-9]/.test(p)) score++;
//     return score;
//   })();

//   const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Excellent"][passwordStrength];
//   const strengthColor = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-400"][passwordStrength]; 


  
// }