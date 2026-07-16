"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import api from "@/services/api";

export default function AdminLoginPage() {
  const router = useRouter();
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
    <div className="min-h-screen bg-[#fcfaf6] text-[#2c2c2c] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Decorative Branding Elements */}
      <div className="absolute top-0 left-0 w-full h-3.5 bg-[#781c1c] border-b border-amber-600/30" />

      <div className="w-full max-w-md space-y-6">
        
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#781c1c] mb-2 transition duration-200">
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-lg">
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-md overflow-hidden shrink-0 p-1">
              <img src="/mcc-crest.png" className="w-full h-full object-contain" alt="MCC Crest" />
            </div>
            
            <h1 className="font-serif text-3xl font-extrabold text-[#18233c] mb-1">
              Admin Portal
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Log in to manage placement records & student directories
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">
            
            <div>
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-650 block mb-1.5">
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
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#781c1c] text-slate-800 placeholder-slate-400 text-xs px-11 py-3.5 rounded-xl outline-none focus:ring-1 focus:ring-[#781c1c]/10 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-655 block mb-1.5">
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
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#781c1c] text-slate-800 placeholder-slate-400 text-xs pl-11 pr-12 py-3.5 rounded-xl outline-none focus:ring-1 focus:ring-[#781c1c]/10 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-650 focus:outline-none transition cursor-pointer"
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