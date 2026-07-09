"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Mail, Key, ShieldAlert, CheckCircle2 } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);
  const [generatedUsername, setGeneratedUsername] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");

  const handleStreamChange = (val: string) => {
    setStream(val);
    setDepartment("");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !registerNumber) {
      setError("All fields are required.");
      return;
    }

    if (!email.toLowerCase().endsWith("@mcc.edu.in")) {
      setError("Registration is restricted to Madras Christian College email addresses ending with '@mcc.edu.in'.");
      return;
    }

    if (!stream) {
      setError("Stream is required.");
      return;
    }

    if (!department) {
      setError("Department is required.");
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
      });

      setGeneratedUsername(res.data.username || "");
      setGeneratedPassword(res.data.temporaryPassword || "");
      setRegistered(true);
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
      <div className="hidden lg:flex lg:w-5/12 relative bg-[#18233c] text-white p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/mcc-entrance-gate.jpg" 
            alt="MCC Entrance Gate" 
            className="w-full h-full object-cover opacity-35 filter brightness-75 contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#18233c] via-[#18233c]/60 to-transparent" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden shrink-0 p-0.5 border border-white/20">
            <img src="/mcc-crest.png" className="w-full h-full object-contain" alt="MCC Crest" />
          </div>
          <div>
            <span className="font-serif font-black text-sm tracking-wider block uppercase">Madras Christian College</span>
            <span className="text-[8px] uppercase tracking-widest text-amber-400 block font-bold">Autonomous placement directory</span>
          </div>
        </div>

        <div className="relative z-10 max-w-sm mb-8">
          <h2 className="font-serif text-3xl font-extrabold text-white leading-tight mb-4">
            Join the Verified Registry
          </h2>
          <p className="text-xs text-slate-355 leading-relaxed">
            Create an official student resume profile. Showcase academic records, projects, research papers, languages, patents, test scores, and handles directly to verifying administrators.
          </p>
        </div>

        <div className="relative z-10 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
          Established 1837 · Chennai, India
        </div>
      </div>

      {/* RIGHT PANEL: REGISTER FORM SECTION OR SUCCESS VIEW */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-xl space-y-6">
          
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#781c1c] transition duration-200">
            <ArrowLeft size={14} /> Back to Home
          </Link>

          <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-10 shadow-lg">
            
            {!registered ? (
              <>
                <div className="text-center mb-8">
                  <h1 className="font-serif text-3xl font-extrabold text-[#18233c] mb-1">
                    Student Registration
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    Submit details to generate your unique login credentials
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    
                    <div>
                      <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-655 block mb-1.5">
                        Full Name
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
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-slate-400" size={16} />
                        <input
                          type="email"
                          required
                          placeholder="Enter college email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#781c1c] text-slate-800 placeholder-slate-400 text-xs px-11 py-3.5 rounded-xl outline-none focus:ring-1 focus:ring-[#781c1c]/10 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-655 block mb-1.5">
                        Register Number
                      </label>
                      <div className="relative">
                        <Key className="absolute left-4 top-3.5 text-slate-400" size={16} />
                        <input
                          type="text"
                          required
                          placeholder="e.g. 2111711019011"
                          value={registerNumber}
                          onChange={(e) => setRegisterNumber(e.target.value)}
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

                <p className="text-center text-slate-400 mt-6 text-[10px] uppercase font-mono font-semibold tracking-wider">
                  Credentials will be generated directly on the screen
                </p>
              </>
            ) : (
              <div className="text-center py-6 space-y-6">
                <div className="flex justify-center">
                  <CheckCircle2 size={56} className="text-emerald-500" />
                </div>
                
                <h1 className="font-serif text-3xl font-extrabold text-[#18233c]">
                  Registration Successful!
                </h1>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-xs text-slate-655 leading-relaxed text-left space-y-4">
                  <p className="text-slate-700 text-center font-semibold">
                    An automated unique username and secure temporary password have been successfully generated for your student account:
                  </p>
                  
                  <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 font-mono">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Username</span>
                      <span className="text-slate-800 font-extrabold text-xs select-all">{generatedUsername}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Temporary Password</span>
                      <span className="text-slate-800 font-extrabold text-xs select-all">{generatedPassword}</span>
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-amber-600 font-bold text-center border-t border-slate-100/60 pt-3">
                    ⚠️ IMPORTANT: Please write down or copy these credentials now. You will be required to set a new permanent password on your first login.
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-block w-full py-3.5 rounded-xl bg-[#781c1c] hover:bg-[#5f1515] text-white text-xs font-bold uppercase tracking-wider transition duration-200 shadow text-center cursor-pointer"
                  >
                    Proceed to Login
                  </Link>
                </div>
              </div>
            )}

          </div>

          {!registered && (
            <div className="text-center text-xs text-slate-500">
              Already have an account? <Link href="/login" className="text-[#781c1c] font-bold hover:underline">Log in here</Link>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}