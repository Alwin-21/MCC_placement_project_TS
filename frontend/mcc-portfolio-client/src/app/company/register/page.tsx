"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building,
  ArrowRight,
  Upload,
  CheckCircle2,
  FileText,
  User,
  Phone,
  ShieldCheck,
  Building2,
  MapPin,
  HelpCircle,
} from "lucide-react";
import api from "@/services/api";
import { useTheme } from "@/hooks/useTheme";

export default function CompanyRegisterPage() {
  const router = useRouter();
  const [themeMode] = useTheme();
  const isDark = themeMode === "dark";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form Fields
  const [form, setForm] = useState({
    companyName: "",
    companyEmail: "",
    officialHrEmail: "",
    hrName: "",
    hrDesignation: "",
    hrPassword: "",
    confirmPassword: "",
    phone: "",
    alternatePhone: "",
    companyLogo: "",
    coverImage: "",
    website: "",
    linkedIn: "",
    industry: "Information Technology",
    companyType: "Private Limited",
    companySize: "50-200",
    foundedYear: new Date().getFullYear().toString(),
    headOffice: "",
    branchLocations: "",
    workMode: "OnSite",
    description: "",
    mission: "",
    vision: "",
    workCulture: "",
    benefits: "",
    awards: "",
    achievements: "",
    recruitmentProcess: "",
    internshipAvailable: false,
    placementAvailable: false,
    gstDocUrl: "",
    regDocUrl: "",
    authDocUrl: "",
    termsAccepted: false,
    privacyAccepted: false,
  });

  // Math Captcha State
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [num1] = useState(Math.floor(Math.random() * 9) + 1);
  const [num2] = useState(Math.floor(Math.random() * 9) + 1);

  // Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, uploadType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading((prev) => ({ ...prev, [fieldName]: true }));
      setError("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", uploadType);

      const res = await api.post("/Company/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setForm((prev) => ({ ...prev, [fieldName]: res.data.url }));
    } catch (err: any) {
      const msg = err.response?.data || "Upload failed. Please check file type and size.";
      setError(msg);
    } finally {
      setUploading((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

  const validateStep = (currentStep: number) => {
    setError("");
    if (currentStep === 1) {
      if (!form.companyName || !form.companyEmail || !form.officialHrEmail || !form.hrName || !form.hrPassword) {
        setError("Please fill in all required basic details.");
        return false;
      }
      if (form.hrPassword.length < 6) {
        setError("HR password must be at least 6 characters.");
        return false;
      }
      if (form.hrPassword !== form.confirmPassword) {
        setError("Passwords do not match.");
        return false;
      }
    } else if (currentStep === 2) {
      if (!form.description) {
        setError("Please provide a description of your company.");
        return false;
      }
    } else if (currentStep === 3) {
      if (!form.headOffice) {
        setError("Please specify the Head Office location.");
        return false;
      }
    } else if (currentStep === 4) {
      if (!form.gstDocUrl || !form.regDocUrl || !form.authDocUrl) {
        setError("Please upload all three requested verification documents.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setError("");
    setStep((s) => s - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.termsAccepted || !form.privacyAccepted) {
      setError("Please accept the Placement Terms and Privacy Policy.");
      return;
    }

    if (parseInt(captchaAnswer, 10) !== num1 + num2) {
      setError("Incorrect captcha answer. Please try again.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/Company/Auth/register", form);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data || "Registration failed. Please check your data.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
        className={`min-h-screen flex items-center justify-center p-6 ${
          isDark ? "bg-[#090d16] text-slate-100" : "bg-[#faf9f6] text-slate-900"
        }`}
      >
        <div className="w-full max-w-lg glass-card rounded-3xl p-10 border border-slate-200/80 dark:border-white/10 text-center space-y-6 shadow-2xl bg-white/40 dark:bg-white/[0.02] backdrop-blur-xl">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-3xl font-black">Registration Submitted!</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Thank you for registering <strong className="text-slate-800 dark:text-white">{form.companyName}</strong>. 
            Your documents and profile are now pending administrator verification review.
          </p>
          <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl text-xs text-left text-slate-500 dark:text-slate-400 space-y-1 border border-slate-200/50 dark:border-white/5">
            <div>• Verification process takes 1-2 business days.</div>
            <div>• An official status notification will be sent to <strong>{form.officialHrEmail}</strong>.</div>
            <div>• Only approved companies are authorized to login and post placement opportunities.</div>
          </div>
          <Link
            href="/company/login"
            className="inline-block w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg cursor-pointer"
          >
            Return to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
      className={`min-h-screen flex flex-col items-center justify-center py-12 px-4 transition-colors duration-300 ${
        isDark ? "bg-[#090d16] text-slate-100" : "bg-[#faf9f6] text-slate-900"
      }`}
    >
      <div className="w-full max-w-2xl space-y-6">
        <Link
          href="/company/login"
          className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-blue-500 transition duration-200"
        >
          <ArrowLeft size={16} /> Cancel and Back to Login
        </Link>

        {/* Multi-step progress bar */}
        <div className="flex justify-between items-center px-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-initial">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  step >= s
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/35"
                    : "bg-slate-200 dark:bg-white/5 text-slate-400"
                }`}
              >
                {s}
              </div>
              {s < 5 && (
                <div
                  className={`h-[3px] flex-1 mx-2 rounded-full transition-all ${
                    step > s ? "bg-blue-600" : "bg-slate-200 dark:bg-white/5"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="glass-card rounded-3xl p-8 md:p-10 shadow-2xl border border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] backdrop-blur-xl space-y-6">
          {/* Form Headers */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black tracking-tight">Company Registration</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {step === 1 && "Step 1: Account Details & General Info"}
              {step === 2 && "Step 2: About Company & Placement Profile"}
              {step === 3 && "Step 3: Head Office & Branch Locations"}
              {step === 4 && "Step 4: Upload Verification Documents"}
              {step === 5 && "Step 5: Consent, Math Captcha & Verification"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            {/* STEP 1: BASIC INFO */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Google India"
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      className="w-full border text-xs px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                      Company Contact Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. info@company.com"
                      value={form.companyEmail}
                      onChange={(e) => setForm({ ...form, companyEmail: e.target.value })}
                      className="w-full border text-xs px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                      Primary HR Contact Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter HR full name"
                      value={form.hrName}
                      onChange={(e) => setForm({ ...form, hrName: e.target.value })}
                      className="w-full border text-xs px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                      Primary HR Designation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Talent Acquisition Lead"
                      value={form.hrDesignation}
                      onChange={(e) => setForm({ ...form, hrDesignation: e.target.value })}
                      className="w-full border text-xs px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                    Official HR Login Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. alwin.r@company.com (For Portal login)"
                    value={form.officialHrEmail}
                    onChange={(e) => setForm({ ...form, officialHrEmail: e.target.value })}
                    className="w-full border text-xs px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                      Account Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={form.hrPassword}
                      onChange={(e) => setForm({ ...form, hrPassword: e.target.value })}
                      className="w-full border text-xs px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Re-type password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      className="w-full border text-xs px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 9876543210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full border text-xs px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                      Alternate Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="Optional contact number"
                      value={form.alternatePhone}
                      onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })}
                      className="w-full border text-xs px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                      Website URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://company.com"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      className="w-full border text-xs px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                      LinkedIn Page URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/company/handle"
                      value={form.linkedIn}
                      onChange={(e) => setForm({ ...form, linkedIn: e.target.value })}
                      className="w-full border text-xs px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                      Industry
                    </label>
                    <select
                      value={form.industry}
                      onChange={(e) => setForm({ ...form, industry: e.target.value })}
                      className="w-full border text-xs px-4 py-3.5 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500"
                    >
                      <option value="Information Technology">Information Technology</option>
                      <option value="Finance & Banking">Finance & Banking</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Education">Education</option>
                      <option value="Marketing & Ad">Marketing & Ad</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                      Company Type
                    </label>
                    <select
                      value={form.companyType}
                      onChange={(e) => setForm({ ...form, companyType: e.target.value })}
                      className="w-full border text-xs px-4 py-3.5 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500"
                    >
                      <option value="MNC">MNC</option>
                      <option value="Private Limited">Private Limited</option>
                      <option value="Public Sector">Public Sector</option>
                      <option value="Startup">Startup</option>
                      <option value="NGO">NGO</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                      Founded Year
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2010"
                      value={form.foundedYear}
                      onChange={(e) => setForm({ ...form, foundedYear: e.target.value })}
                      className="w-full border text-xs px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PROFILE & DESCRIPTION */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                    Company Size
                  </label>
                  <select
                    value={form.companySize}
                    onChange={(e) => setForm({ ...form, companySize: e.target.value })}
                    className="w-full border text-xs px-4 py-3.5 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500"
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                    Company Description *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Briefly tell us about your organization..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full border text-xs px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                      Company Mission
                    </label>
                    <textarea
                      rows={2}
                      placeholder="What is your organization's mission statement?"
                      value={form.mission}
                      onChange={(e) => setForm({ ...form, mission: e.target.value })}
                      className="w-full border text-xs px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                      Company Vision
                    </label>
                    <textarea
                      rows={2}
                      placeholder="What is your organization's vision statement?"
                      value={form.vision}
                      onChange={(e) => setForm({ ...form, vision: e.target.value })}
                      className="w-full border text-xs px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                    Recruitment Process
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe your assessment steps (e.g. Aptitude Test -> Technical Interview -> HR Round)..."
                    value={form.recruitmentProcess}
                    onChange={(e) => setForm({ ...form, recruitmentProcess: e.target.value })}
                    className="w-full border text-xs px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                      Work Culture & Benefits
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Work-life balance, health insurance, learning resources..."
                      value={form.workCulture}
                      onChange={(e) => setForm({ ...form, workCulture: e.target.value })}
                      className="w-full border text-xs px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                      Awards & Achievements
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Great Place to Work 2025, Top Tech Innovator..."
                      value={form.awards}
                      onChange={(e) => setForm({ ...form, awards: e.target.value })}
                      className="w-full border text-xs px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 py-2 border-t border-slate-200/50 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="intern"
                      checked={form.internshipAvailable}
                      onChange={(e) => setForm({ ...form, internshipAvailable: e.target.checked })}
                      className="rounded border-slate-300 dark:border-white/10 accent-blue-600 cursor-pointer w-4 h-4"
                    />
                    <label htmlFor="intern" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      Internship placement opportunities available
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="placement"
                      checked={form.placementAvailable}
                      onChange={(e) => setForm({ ...form, placementAvailable: e.target.checked })}
                      className="rounded border-slate-300 dark:border-white/10 accent-blue-600 cursor-pointer w-4 h-4"
                    />
                    <label htmlFor="placement" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      Full-time job placements available
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: WORK LOCATION & MODE */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                    Head Office Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3 text-slate-400" size={16} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bangalore, Karnataka, India"
                      value={form.headOffice}
                      onChange={(e) => setForm({ ...form, headOffice: e.target.value })}
                      className="w-full border text-xs pl-10 pr-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                    Branch Locations
                  </label>
                  <div className="relative">
                    <Building className="absolute left-4 top-3.5 text-slate-400" size={16} />
                    <textarea
                      rows={2}
                      placeholder="e.g. Chennai, Mumbai, Hyderabad (comma separated)"
                      value={form.branchLocations}
                      onChange={(e) => setForm({ ...form, branchLocations: e.target.value })}
                      className="w-full border text-xs pl-10 pr-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider font-extrabold block mb-1.5 text-slate-700 dark:text-slate-300">
                    Work Mode
                  </label>
                  <select
                    value={form.workMode}
                    onChange={(e) => setForm({ ...form, workMode: e.target.value })}
                    className="w-full border text-xs px-4 py-3.5 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500"
                  >
                    <option value="OnSite">On Site</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 4: UPLOADS */}
            {step === 4 && (
              <div className="space-y-6">
                {/* Images */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-dashed rounded-2xl border-slate-200 dark:border-white/10 text-center">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-2">Company Logo (under 2MB)</label>
                    <div className="flex flex-col items-center gap-2">
                      {form.companyLogo ? (
                        <img src={form.companyLogo} className="w-16 h-16 object-contain rounded-xl border border-slate-200 p-1" />
                      ) : (
                        <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center text-slate-400">
                          <Building2 size={24} />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        id="logoUpload"
                        onChange={(e) => handleFileUpload(e, "companyLogo", "logo")}
                        className="hidden"
                      />
                      <label
                        htmlFor="logoUpload"
                        className="cursor-pointer px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 dark:text-blue-300 text-xs font-bold rounded-xl transition"
                      >
                        {uploading.companyLogo ? "Uploading..." : "Select Logo"}
                      </label>
                    </div>
                  </div>

                  <div className="p-4 border border-dashed rounded-2xl border-slate-200 dark:border-white/10 text-center">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-2">Cover Banner Image (under 5MB)</label>
                    <div className="flex flex-col items-center gap-2">
                      {form.coverImage ? (
                        <img src={form.coverImage} className="w-28 h-16 object-cover rounded-xl border border-slate-200 p-0.5" />
                      ) : (
                        <div className="w-28 h-16 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                          Banner Image
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        id="coverUpload"
                        onChange={(e) => handleFileUpload(e, "coverImage", "cover")}
                        className="hidden"
                      />
                      <label
                        htmlFor="coverUpload"
                        className="cursor-pointer px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 dark:text-blue-300 text-xs font-bold rounded-xl transition"
                      >
                        {uploading.coverImage ? "Uploading..." : "Select Cover"}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Documents uploads */}
                <div className="space-y-4 border-t border-slate-200/50 dark:border-white/5 pt-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Official Documents Verification</span>

                  {/* GST File */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/40 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <FileText className="text-blue-500" size={24} />
                      <div className="text-left">
                        <span className="text-xs font-bold block">GST Registration Document *</span>
                        <span className="text-[10px] text-slate-400 block">PDF or Image copy</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {form.gstDocUrl ? (
                        <span className="text-emerald-500 text-xs font-bold">Uploaded ✓</span>
                      ) : (
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          id="gstUpload"
                          onChange={(e) => handleFileUpload(e, "gstDocUrl", "document")}
                          className="hidden"
                        />
                      )}
                      {!form.gstDocUrl && (
                        <label
                          htmlFor="gstUpload"
                          className="cursor-pointer px-3.5 py-2 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-300 transition"
                        >
                          {uploading.gstDocUrl ? "Uploading..." : "Upload GST"}
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Registration Certificate */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/40 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <FileText className="text-blue-500" size={24} />
                      <div className="text-left">
                        <span className="text-xs font-bold block">Incorporation Certificate *</span>
                        <span className="text-[10px] text-slate-400 block">PDF or Image copy</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {form.regDocUrl ? (
                        <span className="text-emerald-500 text-xs font-bold">Uploaded ✓</span>
                      ) : (
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          id="regUpload"
                          onChange={(e) => handleFileUpload(e, "regDocUrl", "document")}
                          className="hidden"
                        />
                      )}
                      {!form.regDocUrl && (
                        <label
                          htmlFor="regUpload"
                          className="cursor-pointer px-3.5 py-2 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-300 transition"
                        >
                          {uploading.regDocUrl ? "Uploading..." : "Upload Certificate"}
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Hiring Auth */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/40 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <FileText className="text-blue-500" size={24} />
                      <div className="text-left">
                        <span className="text-xs font-bold block">Hiring Authorization Letter *</span>
                        <span className="text-[10px] text-slate-400 block">PDF or Image copy</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {form.authDocUrl ? (
                        <span className="text-emerald-500 text-xs font-bold">Uploaded ✓</span>
                      ) : (
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          id="authUpload"
                          onChange={(e) => handleFileUpload(e, "authDocUrl", "document")}
                          className="hidden"
                        />
                      )}
                      {!form.authDocUrl && (
                        <label
                          htmlFor="authUpload"
                          className="cursor-pointer px-3.5 py-2 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-300 transition"
                        >
                          {uploading.authDocUrl ? "Uploading..." : "Upload Authorization"}
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: TERMS & MATH CAPTCHA */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/40 dark:border-white/10 text-left">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={form.termsAccepted}
                      onChange={(e) => setForm({ ...form, termsAccepted: e.target.checked })}
                      className="rounded border-slate-300 dark:border-white/10 accent-blue-600 cursor-pointer w-4 h-4 mt-0.5"
                    />
                    <label htmlFor="terms" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer leading-relaxed">
                      I accept the **MCC Placement Campus Guidelines and Terms**. I confirm that our company will follow code-of-conduct guidelines.
                    </label>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="privacy"
                      checked={form.privacyAccepted}
                      onChange={(e) => setForm({ ...form, privacyAccepted: e.target.checked })}
                      className="rounded border-slate-300 dark:border-white/10 accent-blue-600 cursor-pointer w-4 h-4 mt-0.5"
                    />
                    <label htmlFor="privacy" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer leading-relaxed">
                      I agree to the **Placement Platform Privacy Policy** regarding data handling and verification checks.
                    </label>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-200/40 dark:border-blue-800/30 text-left space-y-3">
                  <span className="text-[10px] font-extrabold uppercase text-blue-500 tracking-wider flex items-center gap-1">
                    <ShieldCheck size={14} /> Security Verification
                  </span>
                  <div>
                    <label className="text-xs font-bold block mb-1">
                      Anti-Bot Math Captcha: What is {num1} + {num2}? *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="Enter answer"
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      className="w-full md:w-48 border text-xs px-4 py-3 rounded-xl outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500 font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs p-3.5 rounded-xl flex items-center gap-2.5 text-left">
                <FileText size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-between items-center pt-2">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-800 dark:text-white font-extrabold text-xs uppercase rounded-xl transition cursor-pointer"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase rounded-xl transition cursor-pointer flex items-center gap-2 shadow-md shadow-blue-500/20"
                >
                  Continue <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {loading ? "Submitting Application..." : "Submit Application"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
