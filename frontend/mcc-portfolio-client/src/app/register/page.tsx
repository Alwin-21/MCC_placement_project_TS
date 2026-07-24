"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Key,
  ShieldAlert,
  BookOpen,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Sparkles,
  CheckCircle,
  Award
} from "lucide-react";
import api from "@/services/api";
import { useTheme } from "@/hooks/useTheme";

export default function RegisterPage() {
  const router = useRouter();
  const [themeMode, toggleThemeMode] = useTheme();
  const isDark = themeMode === "dark";
  const videoRef = useRef<HTMLVideoElement>(null);

  const [videoReady, setVideoReady] = useState(false);

  const handleCanPlay = () => {
    if (videoRef.current) {
      if (videoRef.current.currentTime < 6) {
        videoRef.current.currentTime = 6;
      }
      setVideoReady(true);
    }
  };

  // Video handlers to skip the first 6 seconds
  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime < 6) {
      videoRef.current.currentTime = 6;
    }
  };

  const aidedDepartments = [
    "English",
    "Tamil",
    "Languages",
    "History",
    "Political Science",
    "Public Administration",
    "Economics",
    "Philosophy",
    "Commerce",
    "Social Work",
    "Mathematics",
    "Statistics",
    "Physics",
    "Chemistry",
    "Botany",
    "Zoology",
  ];

  const sfsDepartments = [
    "English",
    "Tamil",
    "Languages",
    "Journalism",
    "Social Work",
    "Commerce",
    "Business Administration",
    "Communication",
    "Geography",
    "Tourism Studies",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Microbiology",
    "Computer Application (BCA)",
    "Computer Science (B.Sc)",
    "Computer Science (MCA)",
    "Visual Communication",
    "Physical Education, Health Education and Sports",
    "Psychology",
    "Data Science",
    "Physical Education",
  ];

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [stream, setStream] = useState("");
  const [department, setDepartment] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [course, setCourse] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailRegMismatch, setEmailRegMismatch] = useState(false);

  // Helper: check that the local part of the email matches the register number
  const checkEmailRegMatch = (emailVal: string, regVal: string) => {
    if (!emailVal || !regVal) return;
    const localPart = emailVal.split("@")[0];
    setEmailRegMismatch(localPart !== regVal);
  };

  const handleStreamChange = (val: string) => {
    setStream(val);
    setDepartment("");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !fullName ||
      !email ||
      !registerNumber ||
      !stream ||
      !department ||
      !course ||
      !username ||
      !password
    ) {
      setError("All fields are compulsory.");
      return;
    }

    // Validate that the local part of the email matches the register number
    const localPart = email.split("@")[0];
    if (localPart !== registerNumber) {
      setError(
        `Email mismatch: the part before '@' ("${localPart}") must exactly match your register number ("${registerNumber}").`
      );
      return;
    }

    if (!email.toLowerCase().endsWith("@mcc.edu.in")) {
      setError(
        "Registration is restricted to Madras Christian College email addresses ending with '@mcc.edu.in'."
      );
      return;
    }

    // Double check that department belongs to stream
    const validDepts = stream === "Aided" ? aidedDepartments : sfsDepartments;
    if (!validDepts.includes(department)) {
      setError("The selected department does not match the chosen stream.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await api.post("/Auth/register", {
        fullName,
        email,
        stream,
        department,
        registerNumber,
        username,
        password,
        course,
      });

      // Automatically log the student in on successful registration
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data));
        router.push("/dashboard");
      } else {
        setError(
          "Registration succeeded but credentials login token was not generated."
        );
      }
    } catch (err: any) {
      let errorMsg = "Registration failed";
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

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
      className={`min-h-screen flex transition-colors duration-300 ${
        isDark ? "bg-[#090d16] text-slate-100" : "bg-[#faf9f6] text-slate-900"
      }`}
    >
      {/* FLOATING DARK/LIGHT MODE TOGGLE */}
      <button
        onClick={toggleThemeMode}
        aria-label="Toggle dark mode"
        className={`fixed top-5 right-5 z-50 p-3 rounded-full transition-all duration-300 cursor-pointer shadow-lg backdrop-blur-md border ${
          isDark
            ? "bg-white/10 hover:bg-white/20 text-amber-300 border-white/15"
            : "bg-white/90 hover:bg-slate-100 text-slate-700 border-slate-200"
        }`}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* ── LEFT PANEL: DRONE VIDEO SHOWCASE (DESKTOP) ───────────────────── */}
      <div className="hidden lg:flex lg:w-5/12 relative text-white p-14 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[#090d16]">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            src="/DJI_0007.mp4"
            className="w-full h-full object-cover filter brightness-105 contrast-105"
          />
          {/* Minimal overlay to keep video fully visible */}
          <div className="absolute inset-0 bg-black/15" />
        </div>

        {/* Top Brand Logo */}
        <div className="relative z-10">
          <img
            src={isDark ? "/mcc-logo-dark.png" : "/mcc-logo.png"}
            alt="MCC Crest"
            className="h-16 sm:h-18 md:h-22 lg:h-24 w-auto object-contain shrink-0"
          />
        </div>

        {/* Hero Overlay Copy */}
        <div className="relative z-10 max-w-sm space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs font-extrabold text-amber-300 shadow-md">
            <Sparkles size={14} className="animate-pulse" />
            <span>Join Verified Student Registry</span>
          </div>

          <h2 className="text-4xl font-black text-white leading-tight tracking-tight drop-shadow-md">
            Build your academic portfolio & ATS resume.
          </h2>

          <p className="text-sm text-slate-200 leading-relaxed font-medium drop-shadow-sm">
            Create an official student account to publish verified academic records, research, GitHub repositories, and certifications.
          </p>

          <div className="pt-2 flex items-center gap-6 text-xs text-slate-200 font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-400" />
              <span>Institutional Access</span>
            </div>
            <div className="flex items-center gap-2">
              <Award size={16} className="text-amber-400" />
              <span>Placement Ready</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 text-[11px] font-mono text-slate-300 tracking-wider font-extrabold">
          EST. 1837 · CHENNAI, INDIA
        </div>
      </div>

      {/* ── RIGHT PANEL: REGISTER FORM SECTION ──────────────────────────── */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 md:p-12 overflow-y-auto relative">
        <div className="w-full max-w-2xl space-y-6">
          {/* Back Home Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-[#781c1c] dark:hover:text-red-400 transition duration-200"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>

          {/* Prominent Logo on Mobile Viewports */}
          <div className="lg:hidden flex items-center gap-3.5 pb-2">
            <img
              src={isDark ? "/mcc-logo-dark.png" : "/mcc-logo.png"}
              alt="MCC Crest"
              className="h-14 w-auto object-contain shrink-0 transition-transform duration-300 group-hover:scale-105"
            />
            <div>
              <span
                className="text-lg font-black uppercase tracking-wider block"
                style={{ color: isDark ? "#ffffff" : "#781c1c" }}
              >
                Portfolios
              </span>
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Madras Christian College
              </span>
            </div>
          </div>

          {/* Registration Form Card Container */}
          <div className="glass-card rounded-3xl p-8 md:p-10 shadow-2xl space-y-6 border border-slate-200/80 dark:border-white/10">
            <div className="text-center space-y-2">
              <h1
                className="text-3xl font-black tracking-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
              >
                Student Registration
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Submit details to create your verified student account
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-3.5 text-slate-400"
                      size={18}
                    />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alwin Rosh G"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full border text-sm pl-11 pr-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-[#781c1c] dark:focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                    MCC Email Address *
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-3.5 text-slate-400"
                      size={18}
                    />
                    <input
                      type="email"
                      required
                      placeholder="e.g. 25017220370xx@mcc.edu.in"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        checkEmailRegMatch(e.target.value, registerNumber);
                      }}
                      className={`w-full border text-sm pl-11 pr-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 ${
                        emailRegMismatch
                          ? "border-amber-500 focus:border-amber-600"
                          : "border-slate-200 dark:border-white/10 focus:border-[#781c1c] dark:focus:border-red-500"
                      } text-slate-900 dark:text-white`}
                    />
                  </div>
                  {emailRegMismatch && (
                    <p className="text-[10px] text-amber-500 font-semibold mt-1 flex items-center gap-1">
                      ⚠️ Local part before '@' must match register number.
                    </p>
                  )}
                </div>

                {/* Register Number */}
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                    Register Number *
                  </label>
                  <div className="relative">
                    <Key
                      className="absolute left-4 top-3.5 text-slate-400"
                      size={18}
                    />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 25017220370xx"
                      value={registerNumber}
                      onChange={(e) => {
                        setRegisterNumber(e.target.value);
                        checkEmailRegMatch(email, e.target.value);
                      }}
                      className="w-full border text-sm pl-11 pr-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-[#781c1c] dark:focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Stream */}
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                    Stream *
                  </label>
                  <select
                    required
                    value={stream}
                    onChange={(e) => handleStreamChange(e.target.value)}
                    className="w-full border text-sm px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-[#0f172a] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="">Select Stream</option>
                    <option value="Aided">Aided</option>
                    <option value="SFS">SFS</option>
                  </select>
                </div>

                {/* Department */}
                <div className="md:col-span-2">
                  <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                    Department *
                  </label>
                  <select
                    required
                    disabled={!stream}
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full border text-sm px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-[#0f172a] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Department</option>
                    {stream === "Aided" &&
                      aidedDepartments.map((dept, idx) => (
                        <option key={idx} value={dept}>
                          {dept}
                        </option>
                      ))}
                    {stream === "SFS" &&
                      sfsDepartments.map((dept, idx) => (
                        <option key={idx} value={dept}>
                          {dept}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Course */}
                <div className="md:col-span-2">
                  <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                    Course Degree *
                  </label>
                  <div className="relative">
                    <BookOpen
                      className="absolute left-4 top-3.5 text-slate-400"
                      size={18}
                    />
                    <input
                      type="text"
                      required
                      placeholder="e.g. B.Sc. Computer Science"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="w-full border text-sm pl-11 pr-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-[#781c1c] dark:focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                    Username *
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-3.5 text-slate-400"
                      size={18}
                    />
                    <input
                      type="text"
                      required
                      placeholder="Choose username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full border text-sm pl-11 pr-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-[#781c1c] dark:focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                    Password *
                  </label>
                  <div className="relative">
                    <Key
                      className="absolute left-4 top-3.5 text-slate-400"
                      size={18}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border text-sm pl-11 pr-12 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-[#781c1c] dark:focus:border-red-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs p-3.5 rounded-xl flex items-center gap-2.5">
                  <ShieldAlert size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-[#781c1c] hover:bg-[#5f1515] text-white font-extrabold text-xs uppercase tracking-wider transition-all duration-200 shadow-xl shadow-red-900/20 hover:shadow-red-900/40 cursor-pointer active:scale-98 disabled:opacity-50 mt-2"
              >
                {loading ? "Creating Account..." : "Submit Registration"}
              </button>
            </form>
          </div>

          <div className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#781c1c] dark:text-red-400 font-extrabold hover:underline"
            >
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}