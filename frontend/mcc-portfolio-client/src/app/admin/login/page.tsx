"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Sun, Moon } from "lucide-react";
import api from "@/services/api";
import { useTheme } from "@/hooks/useTheme";

export default function AdminLoginPage() {
  const router = useRouter();
  const [themeMode, toggleThemeMode] = useTheme();
  const isDark = themeMode === "dark";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please enter both admin email and password.");
      return;
    }
    try {
      setLoading(true);
      const response = await api.post("/Auth/admin-login", {
        email,
        password,
      });

      localStorage.setItem("admin", JSON.stringify(response.data.user));
      localStorage.setItem("adminToken", response.data.token);
      router.push("/admin");
    } catch (error: any) {
      alert(error?.response?.data?.message || "Invalid Admin Credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans transition-colors duration-200 ${isDark ? "bg-[#0d0d12] text-[#f3f4f6]" : "bg-[#fcfaf6] text-[#2c2c2c]"}`}>

      {/* DARK MODE TOGGLE */}
      <button
        onClick={toggleThemeMode}
        aria-label="Toggle dark mode"
        className={`fixed top-4 right-4 z-50 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md ${
          isDark ? "bg-white/10 hover:bg-white/20 text-yellow-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
        }`}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* Decorative Branding Elements */}
      <div className="absolute top-0 left-0 w-full h-3.5 bg-[#781c1c] border-b border-amber-600/30" />

      <div className="w-full max-w-md space-y-6">
        
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#781c1c] mb-2 transition duration-200">
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className={`border rounded-3xl p-10 shadow-lg transition-colors duration-200 ${isDark ? "bg-[#121218] border-white/10" : "bg-white border-slate-200"}`}>
          
          <div className="text-center mb-8">
            <h1 className={`font-serif text-3xl font-extrabold mb-1 ${isDark ? "text-white" : "text-[#18233c]"}`}>
              Admin Portal
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Log in to manage placement records & student directories
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">
            
            <div>
              <label className={`text-[10px] uppercase font-mono tracking-wider font-bold block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-400" size={16} />
                <input
                  type="email"
                  required
                  placeholder="admin@mcc.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className={`w-full border text-xs px-11 py-3.5 rounded-xl outline-none focus:ring-1 transition ${
                    isDark
                      ? "bg-white/5 border-white/10 text-white placeholder-slate-500 focus:border-[#781c1c] focus:ring-[#781c1c]/20"
                      : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-[#781c1c] focus:ring-[#781c1c]/10"
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`text-[10px] uppercase font-mono tracking-wider font-bold block mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Secure Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-400" size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter administrator password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className={`w-full border text-xs pl-11 pr-12 py-3.5 rounded-xl outline-none focus:ring-1 transition ${
                    isDark
                      ? "bg-white/5 border-white/10 text-white placeholder-slate-500 focus:border-[#781c1c] focus:ring-[#781c1c]/20"
                      : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-[#781c1c] focus:ring-[#781c1c]/10"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-300 focus:outline-none transition cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#18233c] hover:bg-slate-900 border border-amber-600/30 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition duration-200 shadow shadow-black/10 active:scale-98 cursor-pointer"
            >
              {loading ? "Authenticating Admin..." : "Secure Log In"}
            </button>

          </form>

          <p className="text-center text-slate-400 mt-8 text-[10px] uppercase font-mono font-semibold tracking-wider">
            Madras Christian College · Official Access
          </p>

        </div>

      </div>

    </div>
  );
}