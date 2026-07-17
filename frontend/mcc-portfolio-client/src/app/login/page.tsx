"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Lock, ShieldAlert, KeyRound, CheckCircle2, Eye, EyeOff } from "lucide-react";
import api from "@/services/api";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }, []);
  
  // Login States
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  // Change Password States (For First Login Requirement)
  const [tempToken, setTempToken] = useState("");
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changeError, setChangeError] = useState("");
  const [changeSuccess, setChangeSuccess] = useState("");
  const [tempResponseData, setTempResponseData] = useState<any>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      
      const response = await api.post("/Auth/login", {
        username,
        password,
      });

      // If it is a temporary password, show the change password panel instead of redirecting
      if (response.data.isTemporaryPassword) {
        setTempToken(response.data.token);
        setTempResponseData(response.data);
        setShowChangePasswordModal(true);
        setLoading(false);
        return;
      }

      // Normal Login Success Flow
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data));
      router.push("/dashboard");
    } catch (err: any) {
      let errorMsg = "Invalid username or password";
      if (err.response?.data) {
        if (typeof err.response.data === "string") {
          errorMsg = err.response.data;
        } else if (err.response.data.errors) {
          errorMsg = Object.values(err.response.data.errors).flat().join(", ");
        } else if (err.response.data.message) {
          errorMsg = err.response.data.message;
        }
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError("");
    setChangeSuccess("");

    if (!newPassword || newPassword.length < 6) {
      setChangeError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangeError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      
      // Post to the change-password API using the temporary token
      await api.post("/Auth/change-password", {
        newPassword,
      }, {
        headers: {
          Authorization: `Bearer ${tempToken}`
        }
      });

      setChangeSuccess("Password changed successfully! Redirecting you to the dashboard...");
      
      // Store credentials and login fully
      setTimeout(() => {
        localStorage.setItem("token", tempToken);
        localStorage.setItem("user", JSON.stringify({
          ...tempResponseData,
          isTemporaryPassword: false
        }));
        router.push("/dashboard");
      }, 1500);

    } catch (err: any) {
      setChangeError(err.response?.data || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex bg-[#fcfaf6] text-[#2c2c2c] font-sans">
      
      {/* LEFT PANEL: CAMPUS IMAGERY SHOWCASE (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-7/12 relative bg-[#18233c] text-white p-12 flex-col justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/mcc-facade.jpg" 
            alt="MCC Campus Gate" 
            className="w-full h-full object-cover opacity-35 filter brightness-75 contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#18233c] via-[#18233c]/60 to-transparent" />
        </div>

        {/* MCC Info: main content */}
        <div className="relative z-10 max-w-lg">
          <h2 style={{ fontFamily: "'Times New Roman', Georgia, serif", color: "#ffffff", fontSize: "2rem", fontWeight: 800, lineHeight: 1.25, marginBottom: "16px" }}>
            Showcase your academic &amp; professional milestone.
          </h2>
          <p style={{ fontFamily: "'Times New Roman', Georgia, serif", color: "#ffffff", fontSize: "1rem", lineHeight: 1.7, opacity: 0.9 }}>
            Create verified portfolios, publish publications, coordinate live demo links, and get AI-powered career feedback customized for MCC students.
          </p>
        </div>

        <div className="absolute bottom-12 left-12 z-10 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
          Established 1837 · Chennai, India
        </div>
      </div>

      {/* RIGHT PANEL: LOGIN FORM SECTION */}
      <div className="w-full lg:w-5/12 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#781c1c] transition duration-200">
            <ArrowLeft size={14} /> Back to Home
          </Link>

          <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-10 shadow-lg">
            
            <div className="text-center mb-8">
              <h1 className="font-serif text-3xl font-extrabold text-[#18233c] mb-1">
                Student Log In
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Enter your student credentials to access your account
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
              
              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-655 block mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    placeholder="Enter your generated username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#781c1c] text-slate-800 placeholder-slate-400 text-xs px-11 py-3.5 rounded-xl outline-none focus:ring-1 focus:ring-[#781c1c]/10 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-655 block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-slate-400" size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter password"
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

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
                  <ShieldAlert size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#781c1c] hover:bg-[#5f1515] text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer hover:shadow-lg active:scale-98"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

            </form>


          </div>

          <div className="space-y-3 text-center">
            <div className="text-xs text-slate-500">
              Don't have an account? <Link href="/register" className="text-[#781c1c] font-bold hover:underline">Register here</Link>
            </div>
            <div className="text-[11px] text-slate-400">
              Are you an Admin? <Link href="/admin/login" className="text-[#18233c] font-bold hover:underline">Admin Login</Link>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL: CHANGE TEMPORARY PASSWORD (First Login Process) */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 bg-[#18233c]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl text-left space-y-6">
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <KeyRound size={24} />
              </div>
              <h3 className="text-xl font-serif font-extrabold text-[#18233c]">
                Change Temporary Password
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                As a secure credential validation measure, you must update your system-generated temporary password before accessing the dashboard.
              </p>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              
              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-655 block mb-1.5">
                  New Secure Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#781c1c] text-slate-805 text-xs px-4 py-3 rounded-xl outline-none transition"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-655 block mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#781c1c] text-slate-805 text-xs px-4 py-3 rounded-xl outline-none transition"
                />
              </div>

              {changeError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
                  <ShieldAlert size={14} className="shrink-0" />
                  <span>{changeError}</span>
                </div>
              )}

              {changeSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{changeSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#781c1c] hover:bg-[#5f1515] text-white font-bold text-xs uppercase tracking-wider transition duration-205 cursor-pointer shadow hover:shadow-md"
              >
                {loading ? "Updating..." : "Update Password & Proceed"}
              </button>

            </form>

          </div>
        </div>
      )}


    </div>
  );
}