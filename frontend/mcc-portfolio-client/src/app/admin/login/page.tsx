"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import api from "@/services/api";

export default function AdminLoginPage() {

  const router = useRouter();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {

    try {

      setLoading(true);

      const response = await api.post("/Auth/admin-login", {
        email,
        password,
      });

      localStorage.setItem(
        "admin",
        JSON.stringify(response.data.user)
      );

      localStorage.setItem(
        "adminToken",
        response.data.token
      );

      router.push("/admin");

    } catch (error: any) {

      alert(
        error?.response?.data?.message ||
        "Invalid Admin Credentials"
      );

    } finally {

      setLoading(false);

    }
  };

  return (

    <div className="min-h-screen bg-[#050507] text-[#f3f4f6] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl top-[-100px] left-[-100px] pointer-events-none" />

      <div className="w-full max-w-md">
        
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white mb-6 transition duration-200">
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-xl">

        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Admin Login
        </h1>

        <div className="space-y-5">

          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none"
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 transition rounded-2xl py-4 text-white font-semibold"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </div>

      </div>

      </div>

    </div>
  );
}