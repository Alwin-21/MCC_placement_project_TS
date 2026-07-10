"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Eye,
  Settings,
  Sparkles,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
  Briefcase,
  Award,
  Trophy,
  GitBranch,
  Code,
  Globe,
  Link as LinkIcon,
  ZoomIn,
  ZoomOut,
  Maximize2
} from "lucide-react";
import api from "@/services/api";
import { useTheme } from "@/hooks/useTheme";

export default function ResumeEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const [themeMode] = useTheme();

  // Core loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        const calculatedZoom = (window.innerWidth - 32) / 800;
        setZoomLevel(Math.max(0.35, Math.min(1.0, calculatedZoom)));
      } else {
        setZoomLevel(0.9);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Resume metadata
  const [resumeTitle, setResumeTitle] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("Professional");
  const [accentColor, setAccentColor] = useState("#18233c");

  // Portfolio raw data state
  const [portfolioData, setPortfolioData] = useState<any>(null);

  // Resume builder active state (serialized JSON)
  const [resumeData, setResumeData] = useState<any>(null);

  // Editor UI states
  const [activeTab, setActiveTab] = useState("theme");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [headings, setHeadings] = useState<any>({
    summary: "Professional Summary",
    experience: "Experience",
    education: "Academic Details",
    projects: "Projects & Research",
    skills: "Skills",
    certifications: "Licenses & Certifications",
    achievements: "Achievements",
    languages: "Languages",
    testScores: "Test Scores",
    patents: "Patents",
    mediaHandles: "Other Media Handles"
  });

  const [sectionOrder, setSectionOrder] = useState<string[]>([
    "summary",
    "experience",
    "education",
    "projects",
    "skills",
    "certifications",
    "achievements",
    "languages",
    "testScores",
    "patents",
    "mediaHandles"
  ]);

  // Alert lists
  const [missingSheets, setMissingSheets] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      loadResumeAndPortfolio();
    }
  }, [id]);

  const loadResumeAndPortfolio = async () => {
    try {
      setLoading(true);
      // Fetch user resume details
      const resumeRes = await api.get(`/SavedResumes/${id}`);
      const resume = resumeRes.data;
      setResumeTitle(resume.resumeTitle);
      setSelectedTheme(resume.selectedTheme);
      setAccentColor(resume.accentColor);

      // Fetch student portfolio raw details
      const portfolio = await fetchFullPortfolioData();
      setPortfolioData(portfolio);

      // Parse or initialize resume JSON data
      if (resume.resumeDataJson && resume.resumeDataJson !== "{}" && resume.resumeDataJson.trim() !== "") {
        const parsed = JSON.parse(resume.resumeDataJson);
        setResumeData(parsed);
        if (parsed.headings) setHeadings(parsed.headings);
        if (parsed.sectionOrder) setSectionOrder(parsed.sectionOrder);
      } else {
        // First-time initialization from portfolio
        const initialized = initializeResumeFromPortfolio(portfolio);
        setResumeData(initialized);
      }

      // Check missing required marksheets
      checkRequiredMarksheets(portfolio.academicRecords);
    } catch (err) {
      console.error(err);
      alert("Failed to load resume details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFullPortfolioData = async () => {
    const [profile, experiences, academicRecords, achievements, projects, skills, certifications] = await Promise.all([
      api.get("/Profiles"),
      api.get("/Experiences"),
      api.get("/AcademicRecords"),
      api.get("/Achievements"),
      api.get("/Projects"),
      api.get("/Skills"),
      api.get("/Certifications")
    ]);

    return {
      profile: profile.data,
      experiences: experiences.data,
      academicRecords: academicRecords.data,
      achievements: achievements.data,
      projects: projects.data,
      skills: skills.data,
      certifications: certifications.data
    };
  };

  const checkRequiredMarksheets = (records: any[]) => {
    const degrees = records.map((r: any) => r.degree.toLowerCase());
    const required = ["10th", "11th", "12th", "ug"];
    const missing: string[] = [];

    required.forEach((req) => {
      const found = degrees.some((deg) => deg.includes(req) || (req === "ug" && (deg.includes("bachelor") || deg.includes("undergrad"))));
      if (!found) {
        missing.push(req === "ug" ? "UG Marksheet" : `${req} Marksheet`);
      }
    });

    setMissingSheets(missing);
  };

  const parseLanguages = (langStr: string) => {
    if (!langStr) return [];
    return langStr.split(",").map((item: string) => {
      const trimmed = item.trim();
      const match = trimmed.match(/^([^(]+)\s*\(([^)]+)\)$/);
      if (match) {
        return { name: match[1].trim(), level: match[2].trim(), visible: true };
      }
      return { name: trimmed, level: "Fluent", visible: true };
    });
  };

  const initializeResumeFromPortfolio = (portfolio: any) => {
    const prof = portfolio.profile;
    const userObj = prof?.user || {};

    // Standardize marksheets from Academic Records
    const testScoresItems = portfolio.academicRecords.map((rec: any) => {
      const deg = rec.degree.toLowerCase();
      let typeId = "other";
      if (deg.includes("10th")) typeId = "10th";
      else if (deg.includes("11th")) typeId = "11th";
      else if (deg.includes("12th")) typeId = "12th";
      else if (deg.includes("ug") || deg.includes("bachelor")) typeId = "ug";
      else if (deg.includes("pg") || deg.includes("master")) typeId = "pg";

      return {
        id: rec.id.toString(),
        typeId,
        title: `${rec.degree} Marksheet`,
        score: rec.grade,
        institution: rec.institution,
        duration: `${rec.startYear} - ${rec.endYear}`,
        visible: true,
        highlighted: true
      };
    });

    // Add standardized text test scores if available in Profile
    if (prof.testScores) {
      testScoresItems.push({
        id: "profile-test-scores",
        typeId: "standardized",
        title: "Standardized Test Scores",
        score: prof.testScores,
        institution: "",
        duration: "",
        visible: true,
        highlighted: false
      });
    }

    return {
      personalInfo: {
        fullName: userObj.fullName || "",
        title: prof.targetCareer || prof.currentJobTitle || "",
        email: userObj.email || "",
        phone: prof.phone || "",
        address: prof.currentLocation || "",
        linkedin: prof.linkedInUrl || "",
        github: prof.gitHubUrl || "",
        portfolio: prof.blogUrl || "",
        profileImageUrl: prof.profileImageUrl || "",
        showPhoto: true
      },
      summary: {
        visible: true,
        content: prof.bio || "Write a professional summary detailing your academic track record and career objectives..."
      },
      experience: {
        visible: true,
        items: portfolio.experiences.map((exp: any) => ({
          id: exp.id,
          company: exp.company,
          role: exp.title,
          duration: `${exp.startDate ? new Date(exp.startDate).toLocaleDateString("en-US", { year: "numeric", month: "short" }) : ""} - ${exp.isCurrent ? "Present" : exp.endDate ? new Date(exp.endDate).toLocaleDateString("en-US", { year: "numeric", month: "short" }) : ""}`,
          responsibilities: exp.description || "",
          technologies: exp.category || "", // Using Category field as placeholder for technologies
          visible: true
        }))
      },
      education: {
        visible: true,
        items: portfolio.academicRecords
          .filter((rec: any) => {
            const d = rec.degree.toLowerCase();
            // Filter out secondary school marksheets from standard education grid to put under Test Scores instead
            return !d.includes("10th") && !d.includes("11th") && !d.includes("12th");
          })
          .map((rec: any) => ({
            id: rec.id,
            degree: rec.degree,
            institution: rec.institution,
            duration: `${rec.startYear} - ${rec.endYear}`,
            grade: rec.grade,
            visible: true
          }))
      },
      projects: {
        visible: true,
        items: portfolio.projects.map((proj: any) => ({
          id: proj.id,
          name: proj.title,
          description: proj.description,
          technologies: proj.technologies || "",
          github: proj.githubUrl || "",
          live: proj.liveUrl || "",
          visible: true
        }))
      },
      skills: {
        visible: true,
        items: portfolio.skills.map((skill: any) => ({
          id: skill.id,
          name: skill.name,
          level: skill.level || "Intermediate",
          category: skill.category || "Technical skills",
          visible: true
        }))
      },
      certifications: {
        visible: true,
        items: portfolio.certifications.map((cert: any) => ({
          id: cert.id,
          name: cert.title,
          issuer: cert.issuer,
          date: cert.issueDate ? new Date(cert.issueDate).toLocaleDateString("en-US", { year: "numeric", month: "short" }) : "",
          visible: true
        }))
      },
      achievements: {
        visible: true,
        items: portfolio.achievements.map((ach: any) => ({
          id: ach.id,
          title: ach.title,
          date: ach.achievementDate ? new Date(ach.achievementDate).toLocaleDateString("en-US", { year: "numeric", month: "short" }) : "",
          description: ach.description || "",
          visible: true
        }))
      },
      languages: {
        visible: true,
        items: parseLanguages(prof.languages)
      },
      testScores: {
        visible: true,
        items: testScoresItems
      },
      patents: {
        visible: true,
        items: prof.patents ? prof.patents.split("\n").filter((p: string) => p.trim() !== "").map((pat: string, idx: number) => ({
          id: idx,
          title: pat.split(";")[0]?.trim() || pat,
          number: pat.split(";")[1]?.trim() || "N/A",
          status: "Issued",
          date: "",
          description: "",
          visible: true
        })) : []
      },
      mediaHandles: {
        visible: true,
        items: [
          { platform: "LinkedIn", url: prof.linkedInUrl, visible: !!prof.linkedInUrl },
          { platform: "GitHub", url: prof.gitHubUrl, visible: !!prof.gitHubUrl },
          { platform: "Behance", url: prof.behanceUrl, visible: !!prof.behanceUrl },
          { platform: "Instagram", url: prof.instagramUrl, visible: !!prof.instagramUrl },
          { platform: "Portfolio", url: prof.blogUrl, visible: !!prof.blogUrl }
        ].filter(item => item.url)
      }
    };
  };

  const handleSaveResume = async () => {
    try {
      setSaving(true);
      const payload = {
        resumeTitle,
        selectedTheme,
        accentColor,
        resumeDataJson: JSON.stringify({
          ...resumeData,
          headings,
          sectionOrder
        })
      };

      await api.put(`/SavedResumes/${id}`, payload);
      alert("Resume saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save resume.");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncFromPortfolio = () => {
    if (!portfolioData) return;
    if (confirm("Are you sure you want to refresh data from your portfolio? This will sync latest changes but keep your custom styling selections.")) {
      const refreshed = initializeResumeFromPortfolio(portfolioData);
      setResumeData({
        ...refreshed,
        personalInfo: {
          ...refreshed.personalInfo,
          showPhoto: resumeData.personalInfo.showPhoto
        }
      });
      alert("Synchronized with portfolio data! Review and save to commit changes.");
    }
  };

  // Move sections helper
  const moveSection = (index: number, direction: "up" | "down") => {
    const newOrder = [...sectionOrder];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;

    // Swap
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;
    setSectionOrder(newOrder);
  };

  // Remove section helper
  const removeSection = (section: string) => {
    setSectionOrder(sectionOrder.filter((s) => s !== section));
  };

  // Add section helper
  const addSection = (section: string) => {
    if (!sectionOrder.includes(section)) {
      setSectionOrder([...sectionOrder, section]);
    }
  };

  // Reorder individual items helper
  const moveItem = (section: string, index: number, direction: "up" | "down") => {
    const items = [...resumeData[section].items];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIdx];
    items[targetIdx] = temp;

    setResumeData({
      ...resumeData,
      [section]: {
        ...resumeData[section],
        items
      }
    });
  };

  // Toggle item visibility
  const toggleItemVisibility = (section: string, index: number) => {
    const items = [...resumeData[section].items];
    items[index].visible = !items[index].visible;
    setResumeData({
      ...resumeData,
      [section]: {
        ...resumeData[section],
        items
      }
    });
  };

  // Toggle item highlight (specific for Test Scores)
  const toggleItemHighlight = (index: number) => {
    const items = [...resumeData.testScores.items];
    items[index].highlighted = !items[index].highlighted;
    setResumeData({
      ...resumeData,
      testScores: {
        ...resumeData.testScores,
        items
      }
    });
  };

  // Edit fields dynamically
  const updatePersonalInfo = (field: string, val: any) => {
    setResumeData({
      ...resumeData,
      personalInfo: {
        ...resumeData.personalInfo,
        [field]: val
      }
    });
  };

  const updateSummary = (val: string) => {
    setResumeData({
      ...resumeData,
      summary: {
        ...resumeData.summary,
        content: val
      }
    });
  };

  // Print function matching preview exactly
  const handlePrint = () => {
    const printContent = document.getElementById("resume-preview-container");
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to export your resume PDF.");
      return;
    }

    // Capture styling tags to inject in print window
    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map((el) => el.outerHTML)
      .join("\n");

    printWindow.document.write(`
      <html>
        <head>
          <base href="${window.location.origin}" />
          <title>${resumeTitle}</title>
          ${styles}
          <style>
            body {
              background: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            @page {
              size: A4;
              margin: 1.2cm 1.5cm;
            }
            .resume-preview-wrapper {
              box-shadow: none !important;
              border: none !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            /* Avoid breaking elements midway */
            .print-avoid-break {
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <div class="resume-preview-wrapper">
            ${printContent.innerHTML}
          </div>
          <script>
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading || !resumeData) {
    return (
      <div className={`flex flex-col items-center justify-center h-screen gap-4 ${themeMode === "dark" ? "bg-[#09090d] text-white" : "bg-slate-50 text-slate-900"}`}>
        <div className="w-12 h-12 border-4 border-[#781c1c] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm opacity-70">Loading Resume Builder Workspace...</p>
      </div>
    );
  }

  const pInfo = resumeData.personalInfo;

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden ${themeMode === "dark" ? "bg-[#09090d] text-white" : "bg-slate-900 text-slate-100"} relative`}>
      
      {/* Mobile Top View Switcher (Fixed floating toggle bar) */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex bg-slate-900/90 border border-slate-800 p-1.5 rounded-full shadow-2xl backdrop-blur-md">
        <button
          onClick={() => setMobileTab("edit")}
          className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
            mobileTab === "edit" ? "bg-[#781c1c] text-white shadow-md animate-pulse-slow" : "text-slate-400 hover:text-white"
          }`}
        >
          Edit Details
        </button>
        <button
          onClick={() => setMobileTab("preview")}
          className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
            mobileTab === "preview" ? "bg-[#781c1c] text-white shadow-md animate-pulse-slow" : "text-slate-400 hover:text-white"
          }`}
        >
          Live Preview
        </button>
      </div>

      {/* LEFT COLUMN: EDITOR CONTROL PANEL */}
      <div className={`w-full md:w-[480px] md:shrink-0 flex flex-col border-r border-slate-700 bg-slate-800 h-full ${mobileTab === "edit" ? "flex" : "hidden md:flex"}`}>
        
        {/* Editor Top Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-700 flex items-center justify-between shrink-0 gap-1.5 sm:gap-2">
          <button
            onClick={() => router.push("/dashboard/resumes")}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-700 transition text-slate-300 hover:text-white cursor-pointer shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} />
          </button>

          <input
            type="text"
            value={resumeTitle}
            onChange={(e) => setResumeTitle(e.target.value)}
            className="flex-1 min-w-[60px] sm:min-w-[80px] bg-slate-900 border border-slate-700 rounded-xl px-2 sm:px-3 py-1.5 text-xs text-white outline-none focus:border-[#781c1c] font-bold"
            placeholder="Resume Name"
          />

          <div className="flex gap-1 sm:gap-1.5 shrink-0">
            <button
              onClick={handleSyncFromPortfolio}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-700 transition text-emerald-400 cursor-pointer"
              title="Sync latest from Portfolio"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={handleSaveResume}
              disabled={saving}
              className="p-1.5 sm:p-2 rounded-lg bg-[#781c1c] hover:bg-[#5f1515] transition text-white cursor-pointer disabled:opacity-50"
              title="Save Resume Draft"
            >
              <Save size={14} />
            </button>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-700 text-[10px] uppercase font-mono tracking-wider font-bold shrink-0 overflow-x-auto bg-slate-800 scrollbar-none whitespace-nowrap">
          {["theme", "profile", "summary", "experience", "education", "projects", "skills", "others"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-center border-b-2 cursor-pointer transition shrink-0 ${
                activeTab === tab ? "border-[#781c1c] text-[#781c1c]" : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Body Contents */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
          
          {/* Warning banner for missing marksheets */}
          {missingSheets.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-1">Portfolio Completion Alert:</strong>
                Missing mandatory marksheets: <span className="font-semibold text-white">{missingSheets.join(", ")}</span>. Add these under your Academic portfolio section to include them.
              </div>
            </div>
          )}

          {/* TAB 1: THEME & COLOR */}
          {activeTab === "theme" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Choose Resume Template</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "Professional", name: "Professional", desc: "Two-Column Blue" },
                    { id: "Classic ATS", name: "Classic ATS", desc: "B&W Optimized" },
                    { id: "Creative", name: "Creative", desc: "Vibrant Banner" }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTheme(t.id)}
                      className={`border rounded-xl p-3 text-left transition ${
                        selectedTheme === t.id
                          ? "border-[#781c1c] bg-[#781c1c]/10 text-white"
                          : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      <strong className="block text-xs text-white">{t.name}</strong>
                      <span className="text-[9px] opacity-75 mt-1 block leading-tight">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              {selectedTheme !== "Classic ATS" && (
                <div className="space-y-3">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Accent Brand Color</label>
                  <div className="flex gap-2.5 items-center bg-slate-900 p-3 rounded-xl border border-slate-700">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-10 h-10 border border-slate-700 rounded-lg cursor-pointer bg-transparent"
                    />
                    <div>
                      <span className="text-xs font-mono font-bold block">{accentColor}</span>
                      <span className="text-[9px] opacity-60">Pick color for sidebar titles, lines, and tags.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sections Reordering */}
              <div className="space-y-3">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Section Order & Rename Headings</label>
                <div className="space-y-2 bg-slate-900 p-3 rounded-2xl border border-slate-700">
                  {sectionOrder.map((section, idx) => (
                    <div key={section} className="flex items-center justify-between bg-slate-800 rounded-xl p-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono opacity-40">#{idx + 1}</span>
                        <input
                          type="text"
                          value={headings[section]}
                          onChange={(e) => setHeadings({ ...headings, [section]: e.target.value })}
                          className="bg-transparent border-none outline-none font-bold text-white text-xs w-36 focus:underline"
                        />
                      </div>
                      
                      <div className="flex gap-1 items-center">
                        <button
                          onClick={() => moveSection(idx, "up")}
                          disabled={idx === 0}
                          className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-20 cursor-pointer"
                          title="Move Up"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => moveSection(idx, "down")}
                          disabled={idx === sectionOrder.length - 1}
                          className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-20 cursor-pointer"
                          title="Move Down"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          onClick={() => removeSection(section)}
                          className="p-1 hover:bg-red-950 hover:text-red-400 rounded text-red-500 cursor-pointer"
                          title="Remove Section"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add back hidden sections */}
                  {(() => {
                    const allPossible = [
                      "summary",
                      "experience",
                      "education",
                      "projects",
                      "skills",
                      "certifications",
                      "achievements",
                      "languages",
                      "testScores",
                      "patents",
                      "mediaHandles"
                    ];
                    const hidden = allPossible.filter(s => !sectionOrder.includes(s));
                    if (hidden.length === 0) return null;

                    return (
                      <div className="pt-2 border-t border-slate-800 mt-2">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              addSection(e.target.value);
                              e.target.value = ""; // Reset selection
                            }
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-300 outline-none focus:border-[#781c1c] cursor-pointer"
                          defaultValue=""
                        >
                          <option value="" disabled>＋ Add back removed section...</option>
                          {hidden.map(sec => (
                            <option key={sec} value={sec}>
                              {headings[sec] || sec.charAt(0).toUpperCase() + sec.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE DETAILS */}
          {activeTab === "profile" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Full Name</label>
                  <input
                    type="text"
                    value={pInfo.fullName}
                    onChange={(e) => updatePersonalInfo("fullName", e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#781c1c]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Job Title / Headline</label>
                  <input
                    type="text"
                    value={pInfo.title}
                    onChange={(e) => updatePersonalInfo("title", e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#781c1c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Email Address</label>
                  <input
                    type="email"
                    value={pInfo.email}
                    onChange={(e) => updatePersonalInfo("email", e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#781c1c]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Phone Number</label>
                  <input
                    type="text"
                    value={pInfo.phone}
                    onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#781c1c]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Location / Address</label>
                <input
                  type="text"
                  value={pInfo.address}
                  onChange={(e) => updatePersonalInfo("address", e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#781c1c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">LinkedIn Url</label>
                  <input
                    type="text"
                    value={pInfo.linkedin}
                    onChange={(e) => updatePersonalInfo("linkedin", e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#781c1c]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">GitHub Url</label>
                  <input
                    type="text"
                    value={pInfo.github}
                    onChange={(e) => updatePersonalInfo("github", e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#781c1c]"
                  />
                </div>
              </div>

              {selectedTheme !== "Classic ATS" && (
                <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 p-3 rounded-xl">
                  <input
                    type="checkbox"
                    checked={pInfo.showPhoto}
                    onChange={(e) => updatePersonalInfo("showPhoto", e.target.checked)}
                    id="show-photo-checkbox"
                    className="w-4 h-4 cursor-pointer rounded border-slate-700 text-[#781c1c] focus:ring-0 focus:ring-offset-0"
                  />
                  <label htmlFor="show-photo-checkbox" className="text-xs cursor-pointer select-none">
                    Show Profile Photo in Sidebar/Header
                  </label>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROFESSIONAL SUMMARY */}
          {activeTab === "summary" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-700">
                <label className="text-xs cursor-pointer select-none flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={resumeData.summary.visible}
                    onChange={(e) => setResumeData({
                      ...resumeData,
                      summary: { ...resumeData.summary, visible: e.target.checked }
                    })}
                    className="w-4 h-4 rounded text-[#781c1c]"
                  />
                  Show Professional Summary Section
                </label>
              </div>

              {resumeData.summary.visible && (
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Summary Context</label>
                  <textarea
                    value={resumeData.summary.content}
                    onChange={(e) => updateSummary(e.target.value)}
                    className="w-full min-h-[180px] bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-[#781c1c]"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EXPERIENCE */}
          {activeTab === "experience" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-700">
                <label className="text-xs cursor-pointer select-none flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={resumeData.experience.visible}
                    onChange={(e) => setResumeData({
                      ...resumeData,
                      experience: { ...resumeData.experience, visible: e.target.checked }
                    })}
                    className="w-4 h-4 rounded text-[#781c1c]"
                  />
                  Show Experience Section
                </label>
              </div>

              {resumeData.experience.visible && (
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">Experience Entries</label>
                  {resumeData.experience.items.map((item: any, idx: number) => (
                    <div key={item.id} className="bg-slate-900 border border-slate-700 p-3 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <strong className="block text-white">{item.role}</strong>
                        <span className="opacity-60 block text-[10px] mt-0.5">{item.company} · {item.duration}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleItemVisibility("experience", idx)}
                          className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                            item.visible ? "text-emerald-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-800"
                          }`}
                          title={item.visible ? "Hide Entry" : "Show Entry"}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => moveItem("experience", idx, "up")}
                          disabled={idx === 0}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 disabled:opacity-20 cursor-pointer"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => moveItem("experience", idx, "down")}
                          disabled={idx === resumeData.experience.items.length - 1}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 disabled:opacity-20 cursor-pointer"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: EDUCATION & TEST SCORES */}
          {activeTab === "education" && (
            <div className="space-y-4">
              {/* Education section */}
              <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-700">
                <label className="text-xs cursor-pointer select-none flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={resumeData.education.visible}
                    onChange={(e) => setResumeData({
                      ...resumeData,
                      education: { ...resumeData.education, visible: e.target.checked }
                    })}
                    className="w-4 h-4 rounded text-[#781c1c]"
                  />
                  Show Education Section
                </label>
              </div>

              {resumeData.education.visible && (
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">Education Entries</label>
                  {resumeData.education.items.map((item: any, idx: number) => (
                    <div key={item.id} className="bg-slate-900 border border-slate-700 p-3 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <strong className="block text-white">{item.degree}</strong>
                        <span className="opacity-60 block text-[10px] mt-0.5">{item.institution}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleItemVisibility("education", idx)}
                          className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                            item.visible ? "text-emerald-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-800"
                          }`}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => moveItem("education", idx, "up")}
                          disabled={idx === 0}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 disabled:opacity-20"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => moveItem("education", idx, "down")}
                          disabled={idx === resumeData.education.items.length - 1}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 disabled:opacity-20"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Test Scores & Marksheets section */}
              <div className="pt-4 border-t border-slate-700 space-y-4">
                <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-700">
                  <label className="text-xs cursor-pointer select-none flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={resumeData.testScores.visible}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        testScores: { ...resumeData.testScores, visible: e.target.checked }
                      })}
                      className="w-4 h-4 rounded text-[#781c1c]"
                    />
                    Show Test Scores Section
                  </label>
                </div>

                {resumeData.testScores.visible && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">Standardized Scores & Marksheets</label>
                    {resumeData.testScores.items.map((item: any, idx: number) => (
                      <div key={item.id} className="bg-slate-900 border border-slate-700 p-3 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex-1 mr-3">
                          <strong className="block text-white leading-tight">{item.title}</strong>
                          <span className="opacity-60 block text-[10px] mt-0.5">{item.score} {item.institution ? `· ${item.institution}` : ""}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => toggleItemHighlight(idx)}
                            className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold cursor-pointer transition ${
                              item.highlighted ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-slate-800 text-slate-400 hover:text-white"
                            }`}
                            title="Highlight score"
                          >
                            Highlight
                          </button>
                          <button
                            onClick={() => toggleItemVisibility("testScores", idx)}
                            className={`p-1 hover:bg-slate-800 rounded cursor-pointer ${
                              item.visible ? "text-emerald-400" : "text-slate-500"
                            }`}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => moveItem("testScores", idx, "up")}
                            disabled={idx === 0}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 disabled:opacity-20"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            onClick={() => moveItem("testScores", idx, "down")}
                            disabled={idx === resumeData.testScores.items.length - 1}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 disabled:opacity-20"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: PROJECTS & RESEARCH */}
          {activeTab === "projects" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-700">
                <label className="text-xs cursor-pointer select-none flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={resumeData.projects.visible}
                    onChange={(e) => setResumeData({
                      ...resumeData,
                      projects: { ...resumeData.projects, visible: e.target.checked }
                    })}
                    className="w-4 h-4 rounded text-[#781c1c]"
                  />
                  Show Projects & Publications Section
                </label>
              </div>

              {resumeData.projects.visible && (
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">Project Entries</label>
                  {resumeData.projects.items.map((item: any, idx: number) => (
                    <div key={item.id} className="bg-slate-900 border border-slate-700 p-3 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <strong className="block text-white">{item.name}</strong>
                        <span className="opacity-60 block text-[10px] mt-0.5">{item.technologies}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleItemVisibility("projects", idx)}
                          className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                            item.visible ? "text-emerald-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-800"
                          }`}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => moveItem("projects", idx, "up")}
                          disabled={idx === 0}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 disabled:opacity-20"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => moveItem("projects", idx, "down")}
                          disabled={idx === resumeData.projects.items.length - 1}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 disabled:opacity-20"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: SKILLS */}
          {activeTab === "skills" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-700">
                <label className="text-xs cursor-pointer select-none flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={resumeData.skills.visible}
                    onChange={(e) => setResumeData({
                      ...resumeData,
                      skills: { ...resumeData.skills, visible: e.target.checked }
                    })}
                    className="w-4 h-4 rounded text-[#781c1c]"
                  />
                  Show Skills Section
                </label>
              </div>

              {resumeData.skills.visible && (
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">Skills List</label>
                  {resumeData.skills.items.map((item: any, idx: number) => (
                    <div key={item.id} className="bg-slate-900 border border-slate-700 p-2 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[8px] font-mono opacity-50 uppercase tracking-wider font-bold block">{item.category}</span>
                        <strong className="text-white text-xs">{item.name}</strong>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] opacity-70 border border-slate-700 rounded px-1.5 py-0.5 bg-slate-800 mr-2">{item.level}</span>
                        <button
                          onClick={() => toggleItemVisibility("skills", idx)}
                          className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                            item.visible ? "text-emerald-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-800"
                          }`}
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: CERTIFICATES & OTHERS */}
          {activeTab === "others" && (
            <div className="space-y-6">
              
              {/* Licenses */}
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-900 p-2.5 rounded-xl border border-slate-700">
                  <label className="text-xs cursor-pointer select-none flex items-center gap-2 font-bold text-white">
                    <input
                      type="checkbox"
                      checked={resumeData.certifications.visible}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        certifications: { ...resumeData.certifications, visible: e.target.checked }
                      })}
                      className="w-4 h-4 rounded text-[#781c1c]"
                    />
                    Show Licenses & Certifications
                  </label>
                </div>
                {resumeData.certifications.visible && (
                  <div className="space-y-1">
                    {resumeData.certifications.items.map((item: any, idx: number) => (
                      <div key={item.id} className="bg-slate-900 border border-slate-700 p-2 rounded-xl flex items-center justify-between text-xs">
                        <span className="text-white text-xs truncate max-w-[200px]">{item.name}</span>
                        <button
                          onClick={() => toggleItemVisibility("certifications", idx)}
                          className={`p-1 hover:bg-slate-850 rounded ${item.visible ? "text-emerald-400" : "text-slate-500"}`}
                        >
                          <Eye size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Achievements */}
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-900 p-2.5 rounded-xl border border-slate-700">
                  <label className="text-xs cursor-pointer select-none flex items-center gap-2 font-bold text-white">
                    <input
                      type="checkbox"
                      checked={resumeData.achievements.visible}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        achievements: { ...resumeData.achievements, visible: e.target.checked }
                      })}
                      className="w-4 h-4 rounded text-[#781c1c]"
                    />
                    Show Achievements
                  </label>
                </div>
                {resumeData.achievements.visible && (
                  <div className="space-y-1">
                    {resumeData.achievements.items.map((item: any, idx: number) => (
                      <div key={item.id} className="bg-slate-900 border border-slate-700 p-2 rounded-xl flex items-center justify-between text-xs">
                        <span className="text-white text-xs truncate max-w-[200px]">{item.title}</span>
                        <button
                          onClick={() => toggleItemVisibility("achievements", idx)}
                          className={`p-1 hover:bg-slate-850 rounded ${item.visible ? "text-emerald-400" : "text-slate-500"}`}
                        >
                          <Eye size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Languages */}
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-900 p-2.5 rounded-xl border border-slate-700">
                  <label className="text-xs cursor-pointer select-none flex items-center gap-2 font-bold text-white">
                    <input
                      type="checkbox"
                      checked={resumeData.languages.visible}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        languages: { ...resumeData.languages, visible: e.target.checked }
                      })}
                      className="w-4 h-4 rounded text-[#781c1c]"
                    />
                    Show Languages
                  </label>
                </div>
                {resumeData.languages.visible && (
                  <div className="space-y-1">
                    {resumeData.languages.items.map((item: any, idx: number) => (
                      <div key={item.name} className="bg-slate-900 border border-slate-700 p-2 rounded-xl flex items-center justify-between text-xs">
                        <span className="text-white text-xs">{item.name} ({item.level})</span>
                        <button
                          onClick={() => {
                            const list = [...resumeData.languages.items];
                            list[idx].visible = !list[idx].visible;
                            setResumeData({ ...resumeData, languages: { ...resumeData.languages, items: list } });
                          }}
                          className={`p-1 hover:bg-slate-850 rounded ${item.visible ? "text-emerald-400" : "text-slate-500"}`}
                        >
                          <Eye size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Patents */}
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-900 p-2.5 rounded-xl border border-slate-700">
                  <label className="text-xs cursor-pointer select-none flex items-center gap-2 font-bold text-white">
                    <input
                      type="checkbox"
                      checked={resumeData.patents.visible}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        patents: { ...resumeData.patents, visible: e.target.checked }
                      })}
                      className="w-4 h-4 rounded text-[#781c1c]"
                    />
                    Show Patents
                  </label>
                </div>
                {resumeData.patents.visible && (
                  <div className="space-y-1">
                    {resumeData.patents.items.map((item: any, idx: number) => (
                      <div key={item.id} className="bg-slate-900 border border-slate-700 p-2 rounded-xl flex items-center justify-between text-xs">
                        <span className="text-white text-xs truncate max-w-[200px]">{item.title}</span>
                        <button
                          onClick={() => toggleItemVisibility("patents", idx)}
                          className={`p-1 hover:bg-slate-850 rounded ${item.visible ? "text-emerald-400" : "text-slate-500"}`}
                        >
                          <Eye size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* RIGHT COLUMN: HIGHER FIDELITY RESUME PREVIEW PANEL */}
      <div className={`flex-1 flex flex-col min-w-0 bg-slate-950 h-full ${mobileTab === "preview" ? "flex" : "hidden md:flex"}`}>
        
        {/* Preview Panel Top Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex justify-between items-center shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-slate-400 text-xs">
            <span>Theme: <strong>{selectedTheme}</strong></span>
          </div>

          <div className="flex items-center justify-between w-full sm:w-auto gap-2">
            <div className="flex items-center gap-1 bg-slate-850 border border-slate-800 rounded-xl px-2 py-1 text-slate-400">
              <button
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                className="p-1 hover:text-white transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[10px] font-mono select-none px-2 font-bold">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel(Math.min(1.5, zoomLevel + 0.1))}
                className="p-1 hover:text-white transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1 hover:text-white border-l border-slate-800 pl-1.5 ml-1 transition cursor-pointer"
                title="Reset Zoom"
              >
                <Maximize2 size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview Area Container */}
        <div className="flex-1 overflow-auto p-8 flex justify-center bg-slate-950">
          
          {/* Zoom Wrapper */}
          <div
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top center" }}
            className="transition-transform duration-200"
          >
            
            {/* Standard A4 Styled Document (827px x 1169px) */}
            <div
              id="resume-preview-container"
              className={`w-[794px] min-h-[1123px] bg-white text-slate-800 shadow-2xl rounded-sm font-sans flex flex-col justify-between ${
                selectedTheme === "Professional" ? "p-0" : "p-12"
              }`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {/* RENDER SELECTED THEMES */}
              {selectedTheme === "Professional" && (
                <div className="flex flex-col h-full flex-1 text-left">
                  
                  {/* Top Header Banner (Richard Sanchez style) */}
                  <div
                    className="p-8 text-white relative flex flex-col justify-end shrink-0"
                    style={{ backgroundColor: accentColor, height: "140px" }}
                  >
                    <div className={pInfo.showPhoto && pInfo.profileImageUrl ? "pl-40" : ""}>
                      <h2 className="font-sans font-black text-2xl tracking-wide uppercase leading-none text-white">
                        {pInfo.fullName || "Your Name"}
                      </h2>
                      <p className="text-[10px] uppercase font-mono tracking-wider font-bold opacity-85 mt-2">
                        {pInfo.title || "Headline Title"}
                      </p>
                    </div>
                  </div>

                  {/* Split body area */}
                  <div className="flex flex-1 min-h-0">
                    
                    {/* Left column sidebar (light gray tinted background) */}
                    <div className="w-[240px] bg-slate-100 p-6 flex flex-col gap-6 shrink-0 relative">
                      
                      {/* Overlapping profile photo */}
                      {pInfo.showPhoto && pInfo.profileImageUrl && (
                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-md -mt-24 overflow-hidden mx-auto mb-2 shrink-0 bg-white">
                          <img src={pInfo.profileImageUrl} alt={pInfo.fullName} className="w-full h-full object-cover" />
                        </div>
                      )}

                      {/* Contact Details */}
                      <div className="space-y-3">
                        <h4 className="font-sans text-[10px] uppercase tracking-wider font-bold border-b-2 pb-1 text-slate-800" style={{ borderColor: accentColor }}>
                          Contact
                        </h4>
                        <div className="space-y-2 text-[10px] text-slate-600 font-semibold">
                          {pInfo.phone && <div className="flex items-center gap-1.5"><span>Phone:</span> {pInfo.phone}</div>}
                          {pInfo.email && <div className="flex items-center gap-1.5 break-all"><span>Email:</span> {pInfo.email}</div>}
                          {pInfo.address && <div className="flex items-center gap-1.5"><span>Address:</span> {pInfo.address}</div>}
                          {pInfo.portfolio && (
                            <div className="flex items-center gap-1.5 truncate">
                              <span>Web:</span>
                              <a href={pInfo.portfolio} target="_blank" rel="noreferrer" className="underline">{pInfo.portfolio}</a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Skills list (Simple comma or item bullets) */}
                      {resumeData.skills.visible && resumeData.skills.items.some((i: any) => i.visible) && (
                        <div className="space-y-3">
                          <h4 className="font-sans text-[10px] uppercase tracking-wider font-bold border-b-2 pb-1 text-slate-800" style={{ borderColor: accentColor }}>
                            Skills
                          </h4>
                          <ul className="space-y-1.5 text-[10px] text-slate-600 font-semibold list-disc pl-4">
                            {resumeData.skills.items.filter((i: any) => i.visible).map((skill: any) => (
                              <li key={skill.id}>
                                {skill.name} <span className="font-normal opacity-70">({skill.level})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Languages */}
                      {resumeData.languages.visible && resumeData.languages.items.some((l: any) => l.visible) && (
                        <div className="space-y-3">
                          <h4 className="font-sans text-[10px] uppercase tracking-wider font-bold border-b-2 pb-1 text-slate-800" style={{ borderColor: accentColor }}>
                            Languages
                          </h4>
                          <ul className="space-y-1.5 text-[10px] text-slate-600 font-semibold list-disc pl-4">
                            {resumeData.languages.items.filter((l: any) => l.visible).map((l: any) => (
                              <li key={l.name}>
                                {l.name} <span className="font-normal opacity-70">({l.level})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Other Social handles */}
                      {resumeData.mediaHandles.visible && resumeData.mediaHandles.items.some((h: any) => h.visible) && (
                        <div className="space-y-3">
                          <h4 className="font-sans text-[10px] uppercase tracking-wider font-bold border-b-2 pb-1 text-slate-800" style={{ borderColor: accentColor }}>
                            Socials
                          </h4>
                          <div className="space-y-1.5 text-[10px] text-slate-600">
                            {resumeData.mediaHandles.items.filter((h: any) => h.visible).map((h: any) => (
                              <div key={h.platform} className="truncate flex items-center gap-1">
                                <strong className="font-semibold">{h.platform}:</strong>
                                <a href={h.url} target="_blank" rel="noreferrer" className="underline opacity-80">{h.url}</a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right column details (White background with vertical timeline) */}
                    <div className="flex-1 p-8 pl-10 relative space-y-6 bg-white">
                      
                      {/* Timeline line */}
                      <div className="absolute left-[26px] top-8 bottom-8 w-[1.5px] bg-slate-200" />

                      {sectionOrder.map((section) => {
                        const secData = resumeData[section];
                        if (!secData || !secData.visible) return null;

                        // Check section content visibility
                        let hasVisibleItems = false;
                        if (section === "summary" && secData.content) hasVisibleItems = true;
                        else if (secData.items && secData.items.some((i: any) => i.visible)) hasVisibleItems = true;

                        if (!hasVisibleItems) return null;

                        return (
                          <div key={section} className="relative pl-7 space-y-3 print-avoid-break">
                            
                            {/* Circular Icon Timeline Node */}
                            <div
                              className="absolute left-[-25px] top-[-1px] w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center z-20"
                              style={{ borderColor: accentColor, color: accentColor }}
                            >
                              {section === "summary" && <User size={10} strokeWidth={2.5} />}
                              {section === "experience" && <Briefcase size={10} strokeWidth={2.5} />}
                              {section === "education" && <Award size={10} strokeWidth={2.5} />}
                              {section === "projects" && <GitBranch size={10} strokeWidth={2.5} />}
                              {section === "skills" && <Code size={10} strokeWidth={2.5} />}
                              {section === "testScores" && <Award size={10} strokeWidth={2.5} />}
                              {section === "certifications" && <Award size={10} strokeWidth={2.5} />}
                              {section === "achievements" && <Trophy size={10} strokeWidth={2.5} />}
                              {section === "languages" && <Globe size={10} strokeWidth={2.5} />}
                              {section === "patents" && <FileText size={10} strokeWidth={2.5} />}
                            </div>

                            {/* Section Title */}
                            <h3 className="font-sans font-black text-xs uppercase tracking-wider text-slate-800 leading-none">
                              {headings[section]}
                            </h3>

                            {/* Section content */}
                            {section === "summary" && (
                              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{secData.content}</p>
                            )}

                            {section === "experience" && (
                              <div className="space-y-3">
                                {secData.items.filter((i: any) => i.visible).map((item: any) => (
                                  <div key={item.id} className="relative space-y-1">
                                    {/* Bullet point on line */}
                                    <div className="absolute left-[-21px] top-1.5 w-2 h-2 rounded-full border-2 border-white bg-slate-400 z-10" />
                                    
                                    <div className="flex justify-between font-semibold text-xs text-slate-800 leading-snug">
                                      <span>{item.role}</span>
                                      <span className="text-slate-500 font-mono text-[9px]">{item.duration}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-semibold">{item.company}</div>
                                    <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">{item.responsibilities}</p>
                                    {item.technologies && (
                                      <div className="text-[9px] font-mono text-slate-500">
                                        <strong>Technologies:</strong> {item.technologies}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {section === "education" && (
                              <div className="space-y-3">
                                {secData.items.filter((i: any) => i.visible).map((item: any) => (
                                  <div key={item.id} className="relative space-y-0.5">
                                    {/* Bullet point on line */}
                                    <div className="absolute left-[-21px] top-1.5 w-2 h-2 rounded-full border-2 border-white bg-slate-400 z-10" />

                                    <div className="flex justify-between font-semibold text-xs text-slate-800">
                                      <span>{item.degree}</span>
                                      <span className="text-slate-500 font-mono text-[9px]">{item.duration}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-semibold">{item.institution}</div>
                                    {item.grade && <div className="text-[10px] font-mono text-slate-600 font-bold">Grade / CGPA: {item.grade}</div>}
                                  </div>
                                ))}
                              </div>
                            )}

                            {section === "projects" && (
                              <div className="space-y-3">
                                {secData.items.filter((i: any) => i.visible).map((item: any) => (
                                  <div key={item.id} className="relative space-y-1">
                                    {/* Bullet point on line */}
                                    <div className="absolute left-[-21px] top-1.5 w-2 h-2 rounded-full border-2 border-white bg-slate-400 z-10" />

                                    <div className="flex justify-between font-semibold text-xs text-slate-800">
                                      <span>{item.name}</span>
                                      <div className="flex gap-2">
                                        {item.github && <a href={item.github} className="text-slate-500 underline text-[9px]">GitHub</a>}
                                        {item.live && <a href={item.live} className="text-slate-500 underline text-[9px]">Demo</a>}
                                      </div>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                                    {item.technologies && (
                                      <div className="text-[9px] font-mono text-slate-500">
                                        <strong>Technologies Used:</strong> {item.technologies}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {section === "testScores" && (
                              <div className="grid grid-cols-2 gap-3">
                                {secData.items.filter((i: any) => i.visible).map((item: any) => (
                                  <div
                                    key={item.id}
                                    className={`p-2 rounded border text-xs relative ${
                                      item.highlighted
                                        ? "bg-[#781c1c]/5 border-[#781c1c]/20"
                                        : "bg-slate-50 border-slate-150"
                                    }`}
                                  >
                                    <strong className="block text-slate-800">{item.title}</strong>
                                    <span className="block font-mono font-bold text-[#781c1c] text-[10px] mt-0.5">{item.score}</span>
                                    {item.institution && <span className="block text-[9px] text-slate-500 mt-0.5">{item.institution}</span>}
                                  </div>
                                ))}
                              </div>
                            )}

                            {section === "certifications" && (
                              <div className="space-y-1">
                                {secData.items.filter((i: any) => i.visible).map((cert: any) => (
                                  <div key={cert.id} className="relative flex justify-between text-xs text-slate-700">
                                    {/* Bullet point on line */}
                                    <div className="absolute left-[-21px] top-1.5 w-2 h-2 rounded-full border-2 border-white bg-slate-400 z-10" />
                                    <span><strong>{cert.name}</strong> <span className="text-slate-500">by {cert.issuer}</span></span>
                                    <span className="text-slate-400 font-mono text-[9px]">{cert.date}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {section === "achievements" && (
                              <div className="space-y-1.5 text-xs text-slate-600">
                                {secData.items.filter((i: any) => i.visible).map((ach: any) => (
                                  <div key={ach.id} className="relative pl-1">
                                    {/* Bullet point on line */}
                                    <div className="absolute left-[-21px] top-1.5 w-2 h-2 rounded-full border-2 border-white bg-slate-400 z-10" />
                                    <strong>{ach.title}</strong> {ach.date && `(${ach.date})`}
                                    {ach.description && <p className="text-[10px] pl-3 text-slate-500 mt-0.5">{ach.description}</p>}
                                  </div>
                                ))}
                              </div>
                            )}

                            {section === "patents" && (
                              <div className="space-y-1.5 text-xs text-slate-650">
                                {secData.items.filter((i: any) => i.visible).map((pat: any) => (
                                  <div key={pat.id} className="relative pl-1">
                                    {/* Bullet point on line */}
                                    <div className="absolute left-[-21px] top-1.5 w-2 h-2 rounded-full border-2 border-white bg-slate-400 z-10" />
                                    <strong>{pat.title}</strong> (No: {pat.number})
                                  </div>
                                ))}
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* RENDER THEME 2: CLASSIC ATS (ONE COLUMN SIMPLIFIED) */}
              {selectedTheme === "Classic ATS" && (
                <div className="space-y-6 h-full flex-1">
                  
                  {/* Name and titles */}
                  <div className="text-center space-y-1.5 border-b pb-4 border-black">
                    <h2 className="font-bold text-2xl uppercase tracking-tight text-black leading-none">
                      {pInfo.fullName || "Your Name"}
                    </h2>
                    <p className="text-xs font-semibold text-slate-700">{pInfo.title}</p>
                    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-slate-600">
                      {pInfo.email && <span>Email: {pInfo.email}</span>}
                      {pInfo.phone && <span>Phone: {pInfo.phone}</span>}
                      {pInfo.address && <span>Address: {pInfo.address}</span>}
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-3 text-[10px] text-slate-500 font-mono">
                      {pInfo.linkedin && <span>LinkedIn: {pInfo.linkedin}</span>}
                      {pInfo.github && <span>GitHub: {pInfo.github}</span>}
                      {pInfo.portfolio && <span>Portfolio: {pInfo.portfolio}</span>}
                    </div>
                  </div>

                  {sectionOrder.map((section) => {
                    const secData = resumeData[section];
                    if (!secData || !secData.visible) return null;

                    if (section === "summary" && secData.content) {
                      return (
                        <div key={section} className="space-y-1 print-avoid-break">
                          <h3 className="font-bold text-xs uppercase tracking-wider border-b border-black pb-0.5 text-black">
                            {headings.summary}
                          </h3>
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{secData.content}</p>
                        </div>
                      );
                    }

                    if (section === "experience" && secData.items.some((i: any) => i.visible)) {
                      return (
                        <div key={section} className="space-y-2 print-avoid-break">
                          <h3 className="font-bold text-xs uppercase tracking-wider border-b border-black pb-0.5 text-black">
                            {headings.experience}
                          </h3>
                          <div className="space-y-3">
                            {secData.items.filter((i: any) => i.visible).map((item: any) => (
                              <div key={item.id} className="space-y-0.5">
                                <div className="flex justify-between font-bold text-xs text-black">
                                  <span>{item.role} — {item.company}</span>
                                  <span>{item.duration}</span>
                                </div>
                                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{item.responsibilities}</p>
                                {item.technologies && (
                                  <div className="text-[9px] font-mono text-slate-500 mt-0.5">
                                    Technologies: {item.technologies}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (section === "education" && secData.items.some((i: any) => i.visible)) {
                      return (
                        <div key={section} className="space-y-2 print-avoid-break">
                          <h3 className="font-bold text-xs uppercase tracking-wider border-b border-black pb-0.5 text-black">
                            {headings.education}
                          </h3>
                          <div className="space-y-2">
                            {secData.items.filter((i: any) => i.visible).map((item: any) => (
                              <div key={item.id} className="flex justify-between text-xs">
                                <div>
                                  <strong className="text-black">{item.degree}</strong> · {item.institution}
                                  {item.grade && <span className="text-slate-600 block text-[10px]">Result: {item.grade}</span>}
                                </div>
                                <span className="font-medium text-slate-600">{item.duration}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (section === "projects" && secData.items.some((i: any) => i.visible)) {
                      return (
                        <div key={section} className="space-y-2 print-avoid-break">
                          <h3 className="font-bold text-xs uppercase tracking-wider border-b border-black pb-0.5 text-black">
                            {headings.projects}
                          </h3>
                          <div className="space-y-2">
                            {secData.items.filter((i: any) => i.visible).map((item: any) => (
                              <div key={item.id} className="space-y-0.5">
                                <div className="flex justify-between text-xs text-black font-bold">
                                  <span>{item.name}</span>
                                  <span className="font-normal text-slate-500 text-[10px]">{item.github || item.live}</span>
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed">{item.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (section === "skills" && secData.items.some((i: any) => i.visible)) {
                      const grouped = secData.items.filter((i: any) => i.visible).map((s: any) => s.name).join(", ");
                      return (
                        <div key={section} className="space-y-1 print-avoid-break">
                          <h3 className="font-bold text-xs uppercase tracking-wider border-b border-black pb-0.5 text-black">
                            {headings.skills}
                          </h3>
                          <p className="text-xs text-slate-700">{grouped}</p>
                        </div>
                      );
                    }

                    if (section === "testScores" && secData.items.some((i: any) => i.visible)) {
                      return (
                        <div key={section} className="space-y-2 print-avoid-break">
                          <h3 className="font-bold text-xs uppercase tracking-wider border-b border-black pb-0.5 text-black">
                            {headings.testScores}
                          </h3>
                          <div className="space-y-1.5 text-xs text-slate-700">
                            {secData.items.filter((i: any) => i.visible).map((item: any) => (
                              <div key={item.id} className="flex justify-between">
                                <span>{item.title} {item.institution ? `(${item.institution})` : ""}</span>
                                <strong className="text-black font-mono">{item.score}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (section === "certifications" && secData.items.some((i: any) => i.visible)) {
                      return (
                        <div key={section} className="space-y-1 print-avoid-break">
                          <h3 className="font-bold text-xs uppercase tracking-wider border-b border-black pb-0.5 text-black">
                            {headings.certifications}
                          </h3>
                          <div className="space-y-1 text-xs text-slate-700">
                            {secData.items.filter((i: any) => i.visible).map((cert: any) => (
                              <div key={cert.id} className="flex justify-between">
                                <span>{cert.name} — {cert.issuer}</span>
                                <span className="text-slate-500">{cert.date}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (section === "achievements" && secData.items.some((i: any) => i.visible)) {
                      return (
                        <div key={section} className="space-y-1 print-avoid-break">
                          <h3 className="font-bold text-xs uppercase tracking-wider border-b border-black pb-0.5 text-black">
                            {headings.achievements}
                          </h3>
                          <ul className="list-disc pl-4 text-xs text-slate-700 space-y-0.5">
                            {secData.items.filter((i: any) => i.visible).map((ach: any) => (
                              <li key={ach.id}>
                                <strong>{ach.title}</strong> {ach.date && `(${ach.date})`} {ach.description && `— ${ach.description}`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    }

                    if (section === "patents" && secData.items.some((i: any) => i.visible)) {
                      return (
                        <div key={section} className="space-y-1 print-avoid-break">
                          <h3 className="font-bold text-xs uppercase tracking-wider border-b border-black pb-0.5 text-black">
                            {headings.patents}
                          </h3>
                          <ul className="list-disc pl-4 text-xs text-slate-700 space-y-0.5">
                            {secData.items.filter((i: any) => i.visible).map((pat: any) => (
                              <li key={pat.id}>
                                <strong>{pat.title}</strong> (Patent No: {pat.number})
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    }

                    if (section === "languages" && secData.items.some((i: any) => i.visible)) {
                      const langs = secData.items.filter((i: any) => i.visible).map((l: any) => `${l.name} (${l.level})`).join(", ");
                      return (
                        <div key={section} className="space-y-1 print-avoid-break">
                          <h3 className="font-bold text-xs uppercase tracking-wider border-b border-black pb-0.5 text-black">
                            {headings.languages}
                          </h3>
                          <p className="text-xs text-slate-700">{langs}</p>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              )}

              {/* RENDER THEME 3: CREATIVE (MODERN ACCENT BANNER) */}
              {selectedTheme === "Creative" && (
                <div className="space-y-6 h-full flex-1 text-left">
                  
                  {/* Colorful Top Banner Header */}
                  <div
                    className="p-8 rounded-2xl text-white flex justify-between items-center animate-fade-in"
                    style={{ background: `linear-gradient(135deg, ${accentColor}, #18233c)` }}
                  >
                    <div>
                      <h2 className="font-sans font-black text-2xl tracking-tight leading-tight uppercase text-white">
                        {pInfo.fullName || "Your Name"}
                      </h2>
                      <p className="text-xs font-mono uppercase tracking-wider opacity-85 mt-1 block">
                        {pInfo.title}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-75 mt-4">
                        {pInfo.email && <span>✉ {pInfo.email}</span>}
                        {pInfo.phone && <span>📞 {pInfo.phone}</span>}
                        {pInfo.address && <span>📍 {pInfo.address}</span>}
                      </div>
                    </div>

                    {pInfo.showPhoto && pInfo.profileImageUrl && (
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/20 shadow-md shrink-0 bg-white">
                        <img src={pInfo.profileImageUrl} alt={pInfo.fullName} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {sectionOrder.map((section) => {
                    const secData = resumeData[section];
                    if (!secData || !secData.visible) return null;

                    if (section === "summary" && secData.content) {
                      return (
                        <div key={section} className="space-y-2 print-avoid-break">
                          <h3 className="font-serif font-black text-sm uppercase tracking-wider border-b pb-1" style={{ color: accentColor, borderColor: `${accentColor}25` }}>
                            {headings.summary}
                          </h3>
                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{secData.content}</p>
                        </div>
                      );
                    }

                    if (section === "experience" && secData.items.some((i: any) => i.visible)) {
                      return (
                        <div key={section} className="space-y-3 print-avoid-break">
                          <h3 className="font-serif font-black text-sm uppercase tracking-wider border-b pb-1" style={{ color: accentColor, borderColor: `${accentColor}25` }}>
                            {headings.experience}
                          </h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            {secData.items.filter((i: any) => i.visible).map((item: any) => (
                              <div key={item.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                                <div className="flex justify-between font-bold text-xs text-slate-800">
                                  <span>{item.role}</span>
                                  <span className="font-normal text-[10px] text-slate-400">{item.duration}</span>
                                </div>
                                <span className="text-[10px] text-[#781c1c] block">{item.company}</span>
                                <p className="text-[11px] text-slate-500 leading-normal line-clamp-3">{item.responsibilities}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (section === "education" && secData.items.some((i: any) => i.visible)) {
                      return (
                        <div key={section} className="space-y-3 print-avoid-break">
                          <h3 className="font-serif font-black text-sm uppercase tracking-wider border-b pb-1" style={{ color: accentColor, borderColor: `${accentColor}25` }}>
                            {headings.education}
                          </h3>
                          <div className="space-y-2">
                            {secData.items.filter((i: any) => i.visible).map((item: any) => (
                              <div key={item.id} className="flex justify-between text-xs bg-slate-50 border border-slate-100 p-3 rounded-xl">
                                <div>
                                  <strong className="text-slate-800">{item.degree}</strong>
                                  <span className="block text-[10px] text-slate-400">{item.institution}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 block">{item.duration}</span>
                                  {item.grade && <span className="font-bold text-[#781c1c] text-[10px]">{item.grade}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (section === "projects" && secData.items.some((i: any) => i.visible)) {
                      return (
                        <div key={section} className="space-y-3 print-avoid-break">
                          <h3 className="font-serif font-black text-sm uppercase tracking-wider border-b pb-1" style={{ color: accentColor, borderColor: `${accentColor}25` }}>
                            {headings.projects}
                          </h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            {secData.items.filter((i: any) => i.visible).map((item: any) => (
                              <div key={item.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                                <div className="flex justify-between font-bold text-xs text-slate-800">
                                  <span>{item.name}</span>
                                  <div className="flex gap-2">
                                    {item.github && <a href={item.github} className="text-[#781c1c] underline text-[9px]">GitHub</a>}
                                    {item.live && <a href={item.live} className="text-[#781c1c] underline text-[9px]">Live</a>}
                                  </div>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-normal line-clamp-3">{item.description}</p>
                                {item.technologies && (
                                  <div className="text-[9px] font-mono text-slate-400">
                                    {item.technologies}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (section === "skills" && secData.items.some((i: any) => i.visible)) {
                      return (
                        <div key={section} className="space-y-3 print-avoid-break">
                          <h3 className="font-serif font-black text-sm uppercase tracking-wider border-b pb-1" style={{ color: accentColor, borderColor: `${accentColor}25` }}>
                            {headings.skills}
                          </h3>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            {secData.items.filter((i: any) => i.visible).map((skill: any) => (
                              <div key={skill.id} className="space-y-1">
                                <div className="flex justify-between text-[11px]">
                                  <span className="font-medium text-slate-700">{skill.name}</span>
                                  <span className="text-[9px] font-mono text-slate-400">{skill.level}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      backgroundColor: accentColor,
                                      width: skill.level === "Expert" ? "95%" : skill.level === "Advanced" ? "85%" : skill.level === "Intermediate" ? "65%" : "35%"
                                    }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (section === "testScores" && secData.items.some((i: any) => i.visible)) {
                      return (
                        <div key={section} className="space-y-3 print-avoid-break">
                          <h3 className="font-serif font-black text-sm uppercase tracking-wider border-b pb-1" style={{ color: accentColor, borderColor: `${accentColor}25` }}>
                            {headings.testScores}
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            {secData.items.filter((i: any) => i.visible).map((item: any) => (
                              <div
                                key={item.id}
                                className={`p-2.5 rounded-xl border text-xs flex justify-between items-center relative ${
                                  item.highlighted
                                    ? "bg-[#781c1c]/5 border-[#781c1c]/20"
                                    : "bg-slate-50 border-slate-150"
                                }`}
                              >
                                <div>
                                  <strong className="block text-slate-800">{item.title}</strong>
                                  {item.institution && <span className="text-[9px] text-slate-400">{item.institution}</span>}
                                </div>
                                <span className="font-mono font-bold text-white px-2.5 py-1 rounded bg-[#781c1c] text-[10px]">{item.score}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (section === "certifications" && secData.items.some((i: any) => i.visible)) {
                      return (
                        <div key={section} className="space-y-3 print-avoid-break">
                          <h3 className="font-serif font-black text-sm uppercase tracking-wider border-b pb-1" style={{ color: accentColor, borderColor: `${accentColor}25` }}>
                            {headings.certifications}
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            {secData.items.filter((i: any) => i.visible).map((cert: any) => (
                              <div key={cert.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                                <strong className="block text-slate-800">{cert.name}</strong>
                                <span className="text-[10px] text-slate-500 block mt-0.5">{cert.issuer} {cert.date && `· ${cert.date}`}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (section === "achievements" && secData.items.some((i: any) => i.visible)) {
                      return (
                        <div key={section} className="space-y-3 print-avoid-break">
                          <h3 className="font-serif font-black text-sm uppercase tracking-wider border-b pb-1" style={{ color: accentColor, borderColor: `${accentColor}25` }}>
                            {headings.achievements}
                          </h3>
                          <div className="space-y-2">
                            {secData.items.filter((i: any) => i.visible).map((ach: any) => (
                              <div key={ach.id} className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs text-slate-600">
                                🏆 <strong>{ach.title}</strong> {ach.date && `(${ach.date})`}
                                {ach.description && <p className="text-[10px] text-slate-500 mt-1">{ach.description}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (section === "languages" && secData.items.some((i: any) => i.visible)) {
                      return (
                        <div key={section} className="space-y-3 print-avoid-break">
                          <h3 className="font-serif font-black text-sm uppercase tracking-wider border-b pb-1" style={{ color: accentColor, borderColor: `${accentColor}25` }}>
                            {headings.languages}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {secData.items.filter((i: any) => i.visible).map((l: any) => (
                              <span key={l.name} className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold text-slate-700">
                                {l.name} <span className="text-[9px] font-normal text-slate-400">({l.level})</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (section === "patents" && secData.items.some((i: any) => i.visible)) {
                      return (
                        <div key={section} className="space-y-3 print-avoid-break">
                          <h3 className="font-serif font-black text-sm uppercase tracking-wider border-b pb-1" style={{ color: accentColor, borderColor: `${accentColor}25` }}>
                            {headings.patents}
                          </h3>
                          <div className="space-y-2">
                            {secData.items.filter((i: any) => i.visible).map((pat: any) => (
                              <div key={pat.id} className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs text-slate-600">
                                📜 <strong>{pat.title}</strong> (No: {pat.number})
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
