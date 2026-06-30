"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import api from "@/services/api";

export default function LoginPage() {

  const router = useRouter();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [showSocialModal, setShowSocialModal] = useState(false);
  const [socialProvider, setSocialProvider] = useState("");
  const [socialEmail, setSocialEmail] = useState("");
  const [socialName, setSocialName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {

    e.preventDefault();

    try {

      setLoading(true);

      setError("");

      const response = await api.post("/Auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);

      localStorage.setItem("user", JSON.stringify(response.data));

      router.push("/dashboard");

    } catch {

      setError("Invalid email or password");

    } finally {

      setLoading(false);

    }
  };

  const handleExternalSignIn = (provider: string) => {
    setSocialProvider(provider);
    if (provider === "Google") {
      setSocialEmail("alwin.rosh@gmail.com");
      setSocialName("Alwin Rosh");
    } else {
      setSocialEmail("alwinrosh_git@mcc.edu");
      setSocialName("Alwin Rosh GitHub");
    }
    setShowSocialModal(true);
  };

  const submitExternalLogin = async () => {
    if (!socialEmail || !socialName) {
      alert("Please enter both email and name.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const response = await api.post("/Auth/external-login", {
        email: socialEmail,
        fullName: socialName,
        provider: socialProvider,
        externalId: "ext_" + Math.random().toString(36).substring(2, 9),
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data));
      router.push("/dashboard");
    } catch {
      setError("External login simulation failed");
    } finally {
      setLoading(false);
      setShowSocialModal(false);
    }
  };

  return (

    <div className="min-h-screen flex items-center justify-center bg-[#050507] text-[#f3f4f6] relative overflow-hidden">

      {/* Background Glow */}

      <div className="absolute w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl top-[-100px] left-[-100px] pointer-events-none" />

      <div className="absolute w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl bottom-[-100px] right-[-100px] pointer-events-none" />

      {/* Login Card */}

      <div className="relative z-10 w-full max-w-md p-8">

        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white mb-6 transition duration-200">
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl rounded-3xl p-10">

          <div className="text-center mb-8">

            <h1 className="text-5xl font-bold text-white mb-3">
              MCC Portfolio
            </h1>

            <p className="text-gray-300 text-lg">
              Student Portfolio Platform
            </p>

          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            <div>

              <label className="text-gray-200 text-sm mb-2 block">
                Email
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 px-5 py-4 rounded-2xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500 transition"
              />

            </div>

            <div>

              <label className="text-gray-200 text-sm mb-2 block">
                Password
              </label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 px-5 py-4 rounded-2xl outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500 transition"
              />

            </div>

            {error && (
              <p className="text-red-400 text-sm">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-lg hover:scale-[1.02] transition-all duration-300 shadow-lg cursor-pointer"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>

          {/* Social Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="px-3 text-xs text-gray-500 uppercase tracking-widest font-mono">Or Continue With</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleExternalSignIn("Google")}
              type="button"
              className="py-3.5 px-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              Google
            </button>
            <button
              onClick={() => handleExternalSignIn("GitHub")}
              type="button"
              className="py-3.5 px-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              GitHub
            </button>
          </div>

          <p className="text-center text-gray-400 mt-8 text-sm">
            Build your professional student identity
          </p>

        </div>

      </div>

      {/* Simulated Social OAuth Dialog */}
      {showSocialModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#0a0a0f] border border-purple-500/20 rounded-3xl p-8 shadow-2xl text-left">
            <div className="absolute top-[-40px] left-[-40px] w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              🔒 Simulated {socialProvider} Authentication
            </h3>
            <p className="text-gray-400 text-xs mb-6">
              This simulated social OAuth registers you and issues a standard JWT token locally.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={socialName}
                  onChange={(e) => setSocialName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Social Email Address</label>
                <input
                  type="email"
                  value={socialEmail}
                  onChange={(e) => setSocialEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setShowSocialModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold text-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={submitExternalLogin}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold transition hover:scale-[1.02]"
                >
                  Confirm & Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}