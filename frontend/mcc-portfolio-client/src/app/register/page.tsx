"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Mail, Key, ShieldAlert, BookOpen, Eye, EyeOff } from "lucide-react";
import api from "@/services/api";

export default function RegisterPage() {
  const router = useRouter();

  const aidedDepartments = [
    "English", "Tamil", "Languages", "History", "Political Science", "Public Administration",
    "Economics", "Philosophy", "Commerce", "Social Work", "Mathematics", "Statistics",
    "Physics", "Chemistry", "Botany", "Zoology"
  ];

  const sfsDepartments = [
    "English", "Tamil", "Languages", "Journalism", "Social Work", "Commerce",
    "Business Administration", "Communication", "Geography", "Tourism Studies",
    "Mathematics", "Physics", "Chemistry", "Microbiology", "Computer Application (BCA)",
    "Computer Science (B.Sc)", "Computer Science (MCA)", "Visual Communication",
    "Physical Education, Health Education and Sports", "Psychology", "Data Science", "Physical Education"
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

    if (!fullName || !email || !registerNumber || !stream || !department || !course || !username || !password) {
      setError("All fields are compulsory.");
      return;
    }

    // Validate that the local part of the email matches the register number
    const localPart = email.split("@")[0];
    if (localPart !== registerNumber) {
      setError(`Email mismatch: the part before '@' ("${localPart}") must exactly match your register number ("${registerNumber}").`);
      return;
    }

    if (!email.toLowerCase().endsWith("@mcc.edu.in")) {
      setError("Registration is restricted to Madras Christian College email addresses ending with '@mcc.edu.in'.");
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
        course
      });

      // Automatically log the student in on successful registration
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data));
        router.push("/dashboard");
      } else {
        setError("Registration succeeded but credentials login token was not generated.");
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
    <div className="min-h-screen flex bg-[#fcfaf6] text-[#2c2c2c] font-sans">
      
      {/* LEFT PANEL: CAMPUS ARCHWAY SHOWCASE (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-[#18233c] text-white p-12 flex-col justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/mcc-entrance-gate.jpg" 
            alt="MCC Entrance Gate" 
            className="w-full h-full object-cover opacity-35 filter brightness-75 contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#18233c] via-[#18233c]/60 to-transparent" />
        </div>

        {/* MCC Info: main content */}
        <div className="relative z-10 max-w-sm">
          <h2 style={{ fontFamily: "'Times New Roman', Georgia, serif", color: "#ffffff", fontSize: "2rem", fontWeight: 800, lineHeight: 1.25, marginBottom: "16px" }}>
            Join the Verified Student Registry.
          </h2>
          <p style={{ fontFamily: "'Times New Roman', Georgia, serif", color: "#ffffff", fontSize: "1rem", lineHeight: 1.7, opacity: 0.9 }}>
            Create an official student resume profile. Showcase academic records, projects, research papers, languages, patents, test scores, and handles directly to verifying administrators.
          </p>
        </div>

        <div className="absolute bottom-12 left-12 z-10 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
          Established 1837 · Chennai, India
        </div>
      </div>

      {/* RIGHT PANEL: REGISTER FORM SECTION */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-xl space-y-6">
          
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#781c1c] transition duration-200">
            <ArrowLeft size={14} /> Back to Home
          </Link>

          <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-10 shadow-lg">
            
            <div className="text-center mb-8">
              <h1 className="font-serif text-3xl font-extrabold text-[#18233c] mb-1">
                Student Registration
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Submit details to create your student placement account
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              
              <div className="grid md:grid-cols-2 gap-4">
                
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-655 block mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      required
                      placeholder="Enter full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#781c1c] text-slate-800 placeholder-slate-400 text-xs px-11 py-3.5 rounded-xl outline-none focus:ring-1 focus:ring-[#781c1c]/10 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-655 block mb-1.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 text-slate-400" size={16} />
                    <input
                      type="email"
                      required
                      placeholder="e.g. 2501722037011@mcc.edu.in"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        checkEmailRegMatch(e.target.value, registerNumber);
                      }}
                      className={`w-full bg-slate-50 border text-slate-800 placeholder-slate-400 text-xs px-11 py-3.5 rounded-xl outline-none focus:ring-1 transition ${
                        emailRegMismatch
                          ? "border-amber-400 focus:border-amber-500 focus:ring-amber-100"
                          : "border-slate-200 focus:border-[#781c1c] focus:ring-[#781c1c]/10"
                      }`}
                    />
                  </div>
                  {emailRegMismatch && (
                    <p className="text-[10px] text-amber-600 font-semibold mt-1.5 flex items-center gap-1">
                      ⚠️ The part before '@' must match your register number exactly.
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-655 block mb-1.5">
                    Register Number *
                  </label>
                  <div className="relative">
                    <Key className="absolute left-4 top-3.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2501722037011"
                      value={registerNumber}
                      onChange={(e) => {
                        setRegisterNumber(e.target.value);
                        checkEmailRegMatch(email, e.target.value);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#781c1c] text-slate-800 placeholder-slate-400 text-xs px-11 py-3.5 rounded-xl outline-none focus:ring-1 focus:ring-[#781c1c]/10 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-655 block mb-1.5">
                    Stream *
                  </label>
                  <select
                    required
                    value={stream}
                    onChange={(e) => handleStreamChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#781c1c] text-slate-800 text-xs px-4 py-3.5 rounded-xl outline-none transition cursor-pointer"
                  >
                    <option value="">Select Stream</option>
                    <option value="Aided">Aided</option>
                    <option value="SFS">SFS</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-655 block mb-1.5">
                    Department *
                  </label>
                  <select
                    required
                    disabled={!stream}
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#781c1c] text-slate-800 text-xs px-4 py-3.5 rounded-xl outline-none transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <option value="">Select Department</option>
                    {stream === "Aided" && aidedDepartments.map((dept, idx) => (
                      <option key={idx} value={dept}>{dept}</option>
                    ))}
                    {stream === "SFS" && sfsDepartments.map((dept, idx) => (
                      <option key={idx} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-655 block mb-1.5">
                    Course *
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-4 top-3.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. B.Sc. Computer Science, MCA, English"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#781c1c] text-slate-800 placeholder-slate-400 text-xs px-11 py-3.5 rounded-xl outline-none focus:ring-1 focus:ring-[#781c1c]/10 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-655 block mb-1.5">
                    Choose Username *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      required
                      placeholder="Create unique username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#781c1c] text-slate-800 placeholder-slate-400 text-xs px-11 py-3.5 rounded-xl outline-none focus:ring-1 focus:ring-[#781c1c]/10 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-655 block mb-1.5">
                    Create Password *
                  </label>
                  <div className="relative">
                    <Key className="absolute left-4 top-3.5 text-slate-400" size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter secure password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#781c1c] text-slate-800 placeholder-slate-400 text-xs px-11 py-3.5 rounded-xl outline-none focus:ring-1 focus:ring-[#781c1c]/10 transition pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
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
                {loading ? "Registering account..." : "Submit Registration"}
              </button>

            </form>

          </div>

          <div className="text-center text-xs text-slate-500">
            Already have an account? <Link href="/login" className="text-[#781c1c] font-bold hover:underline">Log in here</Link>
          </div>

        </div>
      </div>

    </div>
  );
}