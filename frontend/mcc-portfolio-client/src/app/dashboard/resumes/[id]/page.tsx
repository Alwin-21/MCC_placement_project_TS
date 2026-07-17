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
  Maximize2,
  Download
} from "lucide-react";
import api from "@/services/api";
import { useTheme } from "@/hooks/useTheme";
import { parseImageAdjustments } from "@/utils/image";

export default function ResumeEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const [themeMode] = useTheme();

  // Core loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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
        if (parsed.personalInfo) {
          parsed.personalInfo.behance = parsed.personalInfo.behance || "";
          parsed.personalInfo.instagram = parsed.personalInfo.instagram || "";
        }
        // Ensure all 5 items exist in mediaHandles
        if (parsed.mediaHandles) {
          if (!parsed.mediaHandles.items) {
            parsed.mediaHandles.items = [];
          }
          const platforms = ["LinkedIn", "GitHub", "Behance", "Instagram", "Portfolio"];
          platforms.forEach((platform) => {
            const exists = parsed.mediaHandles.items.some((item: any) => item.platform === platform);
            if (!exists) {
              let url = "";
              if (platform === "LinkedIn") url = parsed.personalInfo.linkedin || "";
              else if (platform === "GitHub") url = parsed.personalInfo.github || "";
              else if (platform === "Portfolio") url = parsed.personalInfo.portfolio || "";
              else if (platform === "Behance") url = parsed.personalInfo.behance || "";
              else if (platform === "Instagram") url = parsed.personalInfo.instagram || "";
              
              parsed.mediaHandles.items.push({
                platform,
                url,
                visible: !!url
              });
            }
          });
        }
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
        behance: prof.behanceUrl || "",
        instagram: prof.instagramUrl || "",
        profileImageUrl: prof.profileImageUrl || "",
        showPhoto: true
      },
      summary: {
        visible: true,
        content: prof.bio || "Write a professional summary detailing your academic track record and career objectives..."
      },
      experience: {
        visible: true,
        items: portfolio.experiences.map((exp: any) => {
          const formatResumeYear = (val: string) => {
            if (!val) return "";
            if (/^\d{4}$/.test(val)) return val;
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
              return d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
            }
            return val;
          };
          return {
            id: exp.id,
            company: exp.company,
            role: exp.title,
            duration: `${formatResumeYear(exp.startDate)} - ${exp.isCurrent ? "Present" : formatResumeYear(exp.endDate)}`,
            responsibilities: exp.description || "",
            technologies: exp.category || "", // Using Category field as placeholder for technologies
            visible: true
          };
        })
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
          date: cert.issueDate ? new Date(cert.issueDate).getFullYear().toString() : "",
          visible: true
        }))
      },
      achievements: {
        visible: true,
        items: portfolio.achievements.map((ach: any) => ({
          id: ach.id,
          title: ach.title,
          date: ach.achievementDate ? new Date(ach.achievementDate).getFullYear().toString() : "",
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
          { platform: "LinkedIn", url: prof.linkedInUrl || "", visible: !!prof.linkedInUrl },
          { platform: "GitHub", url: prof.gitHubUrl || "", visible: !!prof.gitHubUrl },
          { platform: "Behance", url: prof.behanceUrl || "", visible: !!prof.behanceUrl },
          { platform: "Instagram", url: prof.instagramUrl || "", visible: !!prof.instagramUrl },
          { platform: "Portfolio", url: prof.blogUrl || "", visible: !!prof.blogUrl }
        ]
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
    const updatedPInfo = {
      ...resumeData.personalInfo,
      [field]: val
    };

    let updatedMediaHandles = { ...resumeData.mediaHandles };
    if (updatedMediaHandles.items) {
      updatedMediaHandles.items = updatedMediaHandles.items.map((item: any) => {
        if (
          (field === "linkedin" && item.platform === "LinkedIn") ||
          (field === "github" && item.platform === "GitHub") ||
          (field === "portfolio" && item.platform === "Portfolio") ||
          (field === "behance" && item.platform === "Behance") ||
          (field === "instagram" && item.platform === "Instagram")
        ) {
          return { ...item, url: val };
        }
        return item;
      });
    }

    setResumeData({
      ...resumeData,
      personalInfo: updatedPInfo,
      mediaHandles: updatedMediaHandles
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

  // ─── Pixel-perfect PDF download using html2canvas + jsPDF ───────────────
  // Renders the exact same DOM element shown in preview into a canvas,
  // then packs it into an A4 PDF — preview === download, always.
  const handleDownloadPDF = async () => {
    const el = document.getElementById("resume-preview-container");
    if (!el) return;
    try {
      setDownloading(true);

      // Ensure all web fonts are fully loaded before rendering the canvas
      if (typeof document !== "undefined" && document.fonts) {
        await document.fonts.ready;
      }

      // Dynamically import to avoid SSR issues
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(el, {
        scale: 2,           // 2x for crisp quality
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        width: 794,
        height: 1123,
        logging: false,
        onclone: (clonedDoc) => {
          // Sync active fonts to the cloned document context to prevent character squishing/overlapping fallback metrics
          if (typeof document !== "undefined" && document.fonts && clonedDoc.fonts) {
            document.fonts.forEach((font) => {
              clonedDoc.fonts.add(font);
            });
          }
        }
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.97);
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [794, 1123] });
      pdf.addImage(imgData, "JPEG", 0, 0, 794, 1123);
      const safeName = (resumeTitle || "resume").replace(/[^a-z0-9_\-]/gi, "_");
      pdf.save(`${safeName}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Could not generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  // Keep legacy handlePrint as alias for backward compatibility
  const handlePrint = handleDownloadPDF;

  const renderResumeDocument = (isModal = false) => {
    const pInfo = resumeData.personalInfo;
    return (
      <div
        id={isModal ? "resume-preview-container-modal" : "resume-preview-container"}
        style={{ width: "794px", minHeight: "1123px", backgroundColor: "#fff", fontFamily: "'Inter','Helvetica Neue',Arial,sans-serif", display: "flex", flexDirection: "column" }}
      >
        {/* ══════════════════════════════════════════════════
            TEMPLATE 1: PROFESSIONAL  (split column)
        ══════════════════════════════════════════════════ */}
        {selectedTheme === "Professional" && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>

            {/* Header banner */}
            <div style={{ backgroundColor: accentColor, padding: "22px 28px 18px 28px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexShrink: 0 }}>
              <div style={{ paddingLeft: pInfo.showPhoto && pInfo.profileImageUrl ? "110px" : "0" }}>
                <div style={{ fontSize: "22px", fontWeight: 900, letterSpacing: "2px", textTransform: "uppercase", color: "#fff", lineHeight: 1.1 }}>
                  {pInfo.fullName || "Your Name"}
                </div>
                <div style={{ fontSize: "9.5px", fontFamily: "monospace", letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginTop: "6px" }}>
                  {pInfo.title || "Professional Title"}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px", fontSize: "9px", color: "rgba(255,255,255,0.65)", fontFamily: "monospace" }}>
                {pInfo.email && <span>{pInfo.email}</span>}
                {pInfo.phone && <span>{pInfo.phone}</span>}
                {pInfo.address && <span>{pInfo.address}</span>}
              </div>
            </div>

            {/* Body */}
            <div style={{ display: "flex", flex: 1 }}>

              {/* ── Sidebar ── */}
              <div style={{ width: "210px", backgroundColor: "#f1f5f9", flexShrink: 0, display: "flex", flexDirection: "column" }}>

                {/* Photo */}
                {pInfo.showPhoto && pInfo.profileImageUrl && (() => {
                  const img = parseImageAdjustments(pInfo.profileImageUrl);
                  return (
                    <div style={{ display: "flex", justifyContent: "center", padding: "18px 0 12px", background: accentColor + "18" }}>
                      <div style={{ width: "90px", height: "90px", borderRadius: "50%", overflow: "hidden", border: `3px solid ${accentColor}`, boxShadow: "0 3px 12px rgba(0,0,0,0.18)", background: "#fff" }}>
                        <img src={img.src} style={{ ...img.style, width: "100%", height: "100%" }} alt={pInfo.fullName} />
                      </div>
                    </div>
                  );
                })()}

                <div style={{ padding: "18px 14px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Skills */}
                  {resumeData.skills?.visible && resumeData.skills?.items?.some((i: any) => i.visible) && (
                    <div>
                      <div style={{ fontSize: "8.5px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", color: accentColor, borderBottom: `2px solid ${accentColor}`, paddingBottom: "3px", marginBottom: "7px" }}>Skills</div>
                      {resumeData.skills.items.filter((i: any) => i.visible).map((s: any) => (
                        <div key={s.id} style={{ fontSize: "9.5px", color: "#374151", fontWeight: 600, marginBottom: "3px" }}>
                          {s.name} <span style={{ fontSize: "8px", color: "#9ca3af", fontWeight: 400 }}>({s.level})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Languages */}
                  {resumeData.languages?.visible && resumeData.languages?.items?.some((l: any) => l.visible) && (
                    <div>
                      <div style={{ fontSize: "8.5px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", color: accentColor, borderBottom: `2px solid ${accentColor}`, paddingBottom: "3px", marginBottom: "7px" }}>Languages</div>
                      {resumeData.languages.items.filter((l: any) => l.visible).map((l: any) => (
                        <div key={l.name} style={{ fontSize: "9.5px", color: "#374151", fontWeight: 600, marginBottom: "3px" }}>
                          {l.name} <span style={{ fontSize: "8px", color: "#9ca3af", fontWeight: 400 }}>({l.level})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Socials */}
                  {resumeData.mediaHandles?.visible && resumeData.mediaHandles?.items?.some((h: any) => h.visible && h.url) && (
                    <div>
                      <div style={{ fontSize: "8.5px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", color: accentColor, borderBottom: `2px solid ${accentColor}`, paddingBottom: "3px", marginBottom: "7px" }}>Socials</div>
                      {resumeData.mediaHandles.items.filter((h: any) => h.visible && h.url).map((h: any) => (
                        <div key={h.platform} style={{ fontSize: "8.5px", color: "#374151", wordBreak: "break-all", marginBottom: "4px" }}>
                          <span style={{ fontWeight: 700, color: accentColor }}>{h.platform}:</span> {h.url}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Main content ── */}
              <div style={{ flex: 1, padding: "22px 26px", display: "flex", flexDirection: "column", gap: "18px", background: "#fff" }}>
                {sectionOrder.map((section) => {
                  const secData = resumeData[section];
                  if (!secData || !secData.visible) return null;
                  if (["skills", "languages", "mediaHandles"].includes(section)) return null;
                  const hasContent = section === "summary" ? !!secData.content : secData.items?.some((i: any) => i.visible);
                  if (!hasContent) return null;

                  return (
                    <div key={section} className="print-avoid-break">
                      {/* Heading row */}
                      <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "7px" }}>
                        <div style={{ width: "3px", height: "13px", backgroundColor: accentColor, borderRadius: "2px", flexShrink: 0 }} />
                        <div style={{ fontSize: "9.5px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", color: "#1e293b" }}>{headings[section]}</div>
                        <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }} />
                      </div>

                      {section === "summary" && (
                        <p style={{ fontSize: "10px", color: "#475569", lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0 }}>{secData.content}</p>
                      )}
                      {section === "experience" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                          {secData.items.filter((i: any) => i.visible).map((item: any) => (
                            <div key={item.id}>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#1e293b" }}>{item.role}</span>
                                <span style={{ fontSize: "8.5px", fontFamily: "monospace", color: "#94a3b8" }}>{item.duration}</span>
                              </div>
                              <div style={{ fontSize: "9.5px", color: accentColor, fontWeight: 600, marginTop: "1px" }}>{item.company}</div>
                              <p style={{ fontSize: "9.5px", color: "#475569", lineHeight: 1.65, marginTop: "3px", whiteSpace: "pre-wrap" }}>{item.responsibilities}</p>
                              {item.technologies && <div style={{ fontSize: "8.5px", fontFamily: "monospace", color: "#94a3b8", marginTop: "2px" }}>Stack: {item.technologies}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                      {section === "education" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                          {secData.items.filter((i: any) => i.visible).map((item: any) => (
                            <div key={item.id} style={{ display: "flex", justifyContent: "space-between" }}>
                              <div>
                                <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#1e293b" }}>{item.degree}</div>
                                <div style={{ fontSize: "9.5px", color: "#64748b" }}>{item.institution}</div>
                                {item.grade && <div style={{ fontSize: "8.5px", fontFamily: "monospace", color: accentColor, fontWeight: 700 }}>CGPA: {item.grade}</div>}
                              </div>
                              <span style={{ fontSize: "8.5px", fontFamily: "monospace", color: "#94a3b8", whiteSpace: "nowrap" }}>{item.duration}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {section === "projects" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                          {secData.items.filter((i: any) => i.visible).map((item: any) => (
                            <div key={item.id}>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#1e293b" }}>{item.name}</span>
                                <div style={{ display: "flex", gap: "8px" }}>
                                  {item.github && <span style={{ fontSize: "8.5px", color: accentColor }}>GitHub</span>}
                                  {item.live && <span style={{ fontSize: "8.5px", color: accentColor }}>Demo</span>}
                                </div>
                              </div>
                              <p style={{ fontSize: "9.5px", color: "#475569", lineHeight: 1.6, marginTop: "2px" }}>{item.description}</p>
                              {item.technologies && <div style={{ fontSize: "8.5px", fontFamily: "monospace", color: "#94a3b8", marginTop: "2px" }}>{item.technologies}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                      {section === "certifications" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {secData.items.filter((i: any) => i.visible).map((cert: any) => (
                            <div key={cert.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px" }}>
                              <span><strong style={{ color: "#1e293b" }}>{cert.name}</strong> <span style={{ color: "#64748b" }}>— {cert.issuer}</span></span>
                              <span style={{ fontSize: "8.5px", fontFamily: "monospace", color: "#94a3b8" }}>{cert.date}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {section === "achievements" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                          {secData.items.filter((i: any) => i.visible).map((ach: any) => (
                            <div key={ach.id} style={{ fontSize: "9.5px", color: "#475569" }}>
                              <strong style={{ color: "#1e293b" }}>{ach.title}</strong>{ach.date && ` (${ach.date})`}
                              {ach.description && <div style={{ fontSize: "8.5px", color: "#94a3b8", marginTop: "1px" }}>{ach.description}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                      {section === "testScores" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
                          {secData.items.filter((i: any) => i.visible).map((item: any) => (
                            <div key={item.id} style={{ padding: "7px 9px", borderRadius: "7px", border: `1px solid ${accentColor}20`, background: `${accentColor}07` }}>
                              <div style={{ fontSize: "9.5px", fontWeight: 700, color: "#1e293b" }}>{item.title}</div>
                              <div style={{ fontSize: "11px", fontFamily: "monospace", fontWeight: 800, color: accentColor, marginTop: "1px" }}>{item.score}</div>
                              {item.institution && <div style={{ fontSize: "8.5px", color: "#94a3b8" }}>{item.institution}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                      {section === "patents" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {secData.items.filter((i: any) => i.visible).map((pat: any) => (
                            <div key={pat.id} style={{ fontSize: "9.5px", color: "#475569" }}>
                              <strong style={{ color: "#1e293b" }}>{pat.title}</strong> — Patent No: {pat.number}
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

        {/* ═══════════════════════════════════════════════════════════
            TEMPLATE 2: CLASSIC ATS (Ultra Clean, 1-Column, Highly Readable)
        ══════════════════════════════════════════════════════════════ */}
        {selectedTheme === "Classic ATS" && (
          <div style={{ padding: "40px 48px", display: "flex", flexDirection: "column", gap: "14px", flex: 1, textAlign: "left" }}>
            
            {/* Header info */}
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "4px" }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: "22px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#000", margin: 0 }}>
                {pInfo.fullName || "Your Name"}
              </h2>
              <div style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#334155" }}>
                {pInfo.title}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 12px", fontSize: "9.5px", color: "#475569" }}>
                {pInfo.email && <span>{pInfo.email}</span>}
                {pInfo.phone && <span>{pInfo.phone}</span>}
                {pInfo.address && <span>{pInfo.address}</span>}
              </div>
              {resumeData.mediaHandles?.visible && resumeData.mediaHandles?.items?.some((h: any) => h.visible && h.url) && (
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "5px 10px", fontSize: "9px", fontFamily: "monospace", color: "#64748b" }}>
                  {resumeData.mediaHandles.items.filter((h: any) => h.visible && h.url).map((h: any) => (
                    <span key={h.platform}>{h.platform}: {h.url}</span>
                  ))}
                </div>
              )}
            </div>

            {sectionOrder.map((section) => {
              const secData = resumeData[section];
              if (!secData || !secData.visible) return null;
              if (section === "mediaHandles") return null;

              const hasContent = section === "summary" ? !!secData.content : secData.items?.some((i: any) => i.visible);
              if (!hasContent) return null;

              return (
                <div key={section} className="print-avoid-break" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {/* ATS standard border-bottom heading */}
                  <h3 style={{ fontSize: "10.5px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1.2px", borderBottom: "1.5px solid #0f172a", paddingBottom: "2px", color: "#0f172a", margin: "5px 0 2px 0", textAlign: "left" }}>
                    {headings[section]}
                  </h3>

                  {section === "summary" && (
                    <p style={{ fontSize: "10px", color: "#334155", lineHeight: 1.55, margin: 0, textAlign: "justify" }}>
                      {secData.content}
                    </p>
                  )}

                  {section === "experience" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {secData.items.filter((i: any) => i.visible).map((item: any) => (
                        <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "10.5px", color: "#000" }}>
                            <span>{item.role}</span>
                            <span style={{ fontSize: "9px", fontWeight: "normal", fontFamily: "monospace", color: "#475569" }}>{item.duration}</span>
                          </div>
                          <div style={{ fontSize: "9.5px", fontWeight: "650", color: "#475569", fontStyle: "italic" }}>
                            {item.company}
                          </div>
                          <p style={{ fontSize: "9.5px", color: "#334155", lineHeight: 1.45, margin: "2px 0 0 0", whiteSpace: "pre-wrap" }}>
                            {item.responsibilities}
                          </p>
                          {item.technologies && (
                            <div style={{ fontSize: "8.5px", fontFamily: "monospace", color: "#64748b", marginTop: "2px" }}>
                              Key Stack: {item.technologies}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {section === "education" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {secData.items.filter((i: any) => i.visible).map((item: any) => (
                        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: "10px" }}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: "bold", color: "#000" }}>{item.degree}</span>
                            <span style={{ color: "#475569" }}>{item.institution}</span>
                            {item.grade && <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#0f172a", fontWeight: "bold", marginTop: "1px" }}>GPA / Grade: {item.grade}</span>}
                          </div>
                          <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#475569" }}>{item.duration}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {section === "projects" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {secData.items.filter((i: any) => i.visible).map((item: any) => (
                        <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "10px", color: "#000" }}>
                            <span>{item.name}</span>
                            <span style={{ fontSize: "8.5px", fontWeight: "normal", fontFamily: "monospace", color: "#64748b" }}>{item.github || item.live}</span>
                          </div>
                          <p style={{ fontSize: "9.5px", color: "#334155", lineHeight: 1.45, margin: 0 }}>
                            {item.description}
                          </p>
                          {item.technologies && (
                            <div style={{ fontSize: "8.5px", fontFamily: "monospace", color: "#64748b", marginTop: "1px" }}>
                              Technologies: {item.technologies}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {section === "skills" && (
                    <div style={{ fontSize: "9.5px", color: "#334155", lineHeight: 1.5 }}>
                      {secData.items.filter((i: any) => i.visible).map((s: any) => (
                        <span key={s.id} style={{ marginRight: "10px", display: "inline-block" }}>
                          <strong>{s.name}</strong> <span style={{ color: "#64748b", fontSize: "8px" }}>({s.level})</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {section === "testScores" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                      {secData.items.filter((i: any) => i.visible).map((item: any) => (
                        <div key={item.id} style={{ padding: "5px 7px", border: "1px solid #cbd5e1", borderRadius: "4px" }}>
                          <div style={{ fontSize: "9px", fontWeight: "bold", color: "#000" }}>{item.title}</div>
                          <div style={{ fontSize: "10px", fontFamily: "monospace", fontWeight: "bold", color: "#0f172a", marginTop: "1px" }}>{item.score}</div>
                          {item.institution && <div style={{ fontSize: "8px", color: "#64748b" }}>{item.institution}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {section === "certifications" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      {secData.items.filter((i: any) => i.visible).map((cert: any) => (
                        <div key={cert.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px", color: "#334155" }}>
                          <span><strong>{cert.name}</strong> <span style={{ color: "#64748b" }}>— {cert.issuer}</span></span>
                          <span style={{ fontSize: "8.5px", fontFamily: "monospace", color: "#64748b" }}>{cert.date}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {section === "achievements" && (
                    <ul style={{ listStyleType: "disc", paddingLeft: "15px", margin: 0, fontSize: "9.5px", color: "#334155" }}>
                      {secData.items.filter((i: any) => i.visible).map((ach: any) => (
                        <li key={ach.id} style={{ marginBottom: "2px" }}>
                          <strong>{ach.title}</strong> {ach.date && `(${ach.date})`} {ach.description && `— ${ach.description}`}
                        </li>
                      ))}
                    </ul>
                  )}

                  {section === "patents" && (
                    <ul style={{ listStyleType: "square", paddingLeft: "15px", margin: 0, fontSize: "9.5px", color: "#334155" }}>
                      {secData.items.filter((i: any) => i.visible).map((pat: any) => (
                        <li key={pat.id} style={{ marginBottom: "2px" }}>
                          <strong>{pat.title}</strong> — Patent No: {pat.number}
                        </li>
                      ))}
                    </ul>
                  )}

                  {section === "languages" && (
                    <div style={{ fontSize: "9.5px", color: "#334155" }}>
                      {secData.items.filter((i: any) => i.visible).map((l: any, idx: number, arr: any[]) => (
                        <span key={l.name}>
                          {l.name} ({l.level}){idx < arr.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TEMPLATE 3: CREATIVE (Glassmorphism Header, Premium Tag Cloud)
        ══════════════════════════════════════════════════════════════ */}
        {selectedTheme === "Creative" && (
          <div style={{ padding: "26px", display: "flex", flexDirection: "column", gap: "16px", flex: 1, textAlign: "left" }}>
            
            {/* Elegant Colorful Header Banner */}
            <div
              style={{
                background: `linear-gradient(135deg, ${accentColor}, #0f172a)`,
                borderRadius: "14px",
                padding: "20px",
                color: "#fff",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                boxShadow: "0 6px 20px -4px rgba(0,0,0,0.1)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <div>
                  <h2 style={{ fontSize: "22px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1.5px", color: "#fff", margin: 0 }}>
                    {pInfo.fullName || "Your Name"}
                  </h2>
                  <p style={{ fontSize: "10px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "2px", color: "rgba(255,255,255,0.8)", marginTop: "4px", margin: 0 }}>
                    {pInfo.title || "Creative Professional"}
                  </p>
                </div>

                {pInfo.showPhoto && pInfo.profileImageUrl && (() => {
                  const img = parseImageAdjustments(pInfo.profileImageUrl);
                  return (
                    <div style={{ width: "70px", height: "70px", borderRadius: "10px", overflow: "hidden", border: "2px solid rgba(255,255,255,0.25)", boxShadow: "0 4px 10px rgba(0,0,0,0.2)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <img src={img.src} style={{ ...img.style, width: "100%", height: "100%" }} alt={pInfo.fullName} />
                    </div>
                  );
                })()}
              </div>

              <div style={{ height: "1px", background: "rgba(255,255,255,0.15)" }} />

              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 12px", fontSize: "9.5px", color: "rgba(255,255,255,0.85)" }}>
                {pInfo.email && <span style={{ background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: "5px" }}>✉ {pInfo.email}</span>}
                {pInfo.phone && <span style={{ background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: "5px" }}>📞 {pInfo.phone}</span>}
                {pInfo.address && <span style={{ background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: "5px" }}>📍 {pInfo.address}</span>}
              </div>

              {resumeData.mediaHandles?.visible && resumeData.mediaHandles?.items?.some((h: any) => h.visible && h.url) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 10px", fontSize: "8.5px" }}>
                  {resumeData.mediaHandles.items.filter((h: any) => h.visible && h.url).map((h: any) => (
                    <span key={h.platform} style={{ color: "rgba(255,255,255,0.9)", background: "rgba(255,255,255,0.12)", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>
                      {h.platform}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Content Sections */}
            {sectionOrder.map((section) => {
              const secData = resumeData[section];
              if (!secData || !secData.visible) return null;
              if (section === "mediaHandles") return null;

              const hasContent = section === "summary" ? !!secData.content : secData.items?.some((i: any) => i.visible);
              if (!hasContent) return null;

              return (
                <div key={section} className="print-avoid-break" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  
                  {/* Heading Accent styling */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "3.5px", height: "13px", backgroundColor: accentColor, borderRadius: "2px" }} />
                    <h3 style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1.2px", color: accentColor, margin: 0 }}>
                      {headings[section]}
                    </h3>
                    <div style={{ flex: 1, height: "1px", backgroundColor: `${accentColor}15` }} />
                  </div>

                  {section === "summary" && (
                    <p style={{ fontSize: "9.5px", color: "#475569", lineHeight: 1.6, margin: 0, paddingLeft: "10px" }}>
                      {secData.content}
                    </p>
                  )}

                  {section === "experience" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      {secData.items.filter((i: any) => i.visible).map((item: any) => (
                        <div key={item.id} style={{ padding: "8px 10px", border: "1px solid #f1f5f9", backgroundColor: "#f8fafc", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "1px", boxShadow: "0 1px 2px rgba(0,0,0,0.01)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <span style={{ fontSize: "9.5px", fontWeight: "bold", color: "#0f172a" }}>{item.role}</span>
                            <span style={{ fontSize: "8px", fontFamily: "monospace", color: "#94a3b8" }}>{item.duration}</span>
                          </div>
                          <span style={{ fontSize: "9px", fontWeight: "700", color: accentColor }}>{item.company}</span>
                          <p style={{ fontSize: "9px", color: "#475569", lineHeight: 1.4, margin: "3px 0 0 0", whiteSpace: "pre-wrap" }}>
                            {item.responsibilities}
                          </p>
                          {item.technologies && (
                            <div style={{ fontSize: "8px", fontFamily: "monospace", color: "#94a3b8", marginTop: "3px" }}>
                              {item.technologies}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {section === "education" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {secData.items.filter((i: any) => i.visible).map((item: any) => (
                        <div key={item.id} style={{ padding: "8px 10px", border: "1px solid #f1f5f9", backgroundColor: "#f8fafc", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <strong style={{ fontSize: "9.5px", color: "#0f172a", display: "block" }}>{item.degree}</strong>
                            <span style={{ fontSize: "9px", color: "#64748b" }}>{item.institution}</span>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "8px", fontFamily: "monospace", color: "#94a3b8", display: "block" }}>{item.duration}</span>
                            {item.grade && <span style={{ fontSize: "9px", fontWeight: "bold", color: accentColor }}>GPA: {item.grade}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {section === "projects" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      {secData.items.filter((i: any) => i.visible).map((item: any) => (
                        <div key={item.id} style={{ padding: "8px 10px", border: "1px solid #f1f5f9", backgroundColor: "#f8fafc", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "1px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong style={{ fontSize: "9.5px", color: "#0f172a" }}>{item.name}</strong>
                            <div style={{ display: "flex", gap: "5px" }}>
                              {item.github && <span style={{ fontSize: "8px", color: accentColor }}>Repo</span>}
                              {item.live && <span style={{ fontSize: "8px", color: accentColor }}>Live</span>}
                            </div>
                          </div>
                          <p style={{ fontSize: "9px", color: "#475569", lineHeight: 1.35, margin: "2px 0 0 0" }}>
                            {item.description}
                          </p>
                          {item.technologies && (
                            <div style={{ fontSize: "8px", fontFamily: "monospace", color: "#64748b", marginTop: "3px" }}>
                              {item.technologies}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {section === "skills" && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", paddingLeft: "10px" }}>
                      {secData.items.filter((i: any) => i.visible).map((skill: any) => {
                        const isHigh = skill.level === "Expert" || skill.level === "Advanced";
                        return (
                          <span
                            key={skill.id}
                            style={{
                              fontSize: "8.5px",
                              fontWeight: "bold",
                              padding: "3px 7px",
                              borderRadius: "6px",
                              backgroundColor: isHigh ? `${accentColor}15` : "#f1f5f9",
                              color: isHigh ? accentColor : "#475569",
                              border: `1px solid ${isHigh ? `${accentColor}25` : "#e2e8f0"}`
                            }}
                          >
                            {skill.name} <span style={{ fontWeight: "normal", fontSize: "7px", opacity: 0.65 }}>· {skill.level}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {section === "testScores" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                      {secData.items.filter((i: any) => i.visible).map((item: any) => (
                        <div key={item.id} style={{ padding: "6px 8px", border: "1px solid #f1f5f9", backgroundColor: "#f8fafc", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <strong style={{ fontSize: "9px", color: "#0f172a", display: "block" }}>{item.title}</strong>
                            {item.institution && <span style={{ fontSize: "8px", color: "#94a3b8" }}>{item.institution}</span>}
                          </div>
                          <span style={{ fontSize: "9.5px", fontWeight: "bold", color: "#fff", backgroundColor: accentColor, padding: "2px 6px", borderRadius: "4px", fontFamily: "monospace" }}>{item.score}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {section === "certifications" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                      {secData.items.filter((i: any) => i.visible).map((cert: any) => (
                        <div key={cert.id} style={{ padding: "6px 8px", border: "1px solid #f1f5f9", backgroundColor: "#f8fafc", borderRadius: "8px", fontSize: "9px" }}>
                          <strong style={{ color: "#0f172a", display: "block" }}>{cert.name}</strong>
                          <span style={{ color: "#64748b" }}>{cert.issuer} {cert.date && `· ${cert.date}`}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {section === "achievements" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px", paddingLeft: "10px" }}>
                      {secData.items.filter((i: any) => i.visible).map((ach: any) => (
                        <div key={ach.id} style={{ fontSize: "9px", color: "#475569", borderLeft: `2px solid ${accentColor}40`, paddingLeft: "6px" }}>
                          <strong style={{ color: "#0f172a" }}>{ach.title}</strong> {ach.date && `(${ach.date})`}
                          {ach.description && <div style={{ fontSize: "8px", color: "#64748b", marginTop: "1px" }}>{ach.description}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {section === "languages" && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", paddingLeft: "10px" }}>
                      {secData.items.filter((i: any) => i.visible).map((l: any) => (
                        <span key={l.name} style={{ fontSize: "9px", padding: "2px 6px", backgroundColor: "#f1f5f9", borderRadius: "5px", color: "#475569" }}>
                          {l.name} <span style={{ fontSize: "7px", opacity: 0.65 }}>({l.level})</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {section === "patents" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px", paddingLeft: "10px" }}>
                      {secData.items.filter((i: any) => i.visible).map((pat: any) => (
                        <div key={pat.id} style={{ fontSize: "9px", color: "#475569" }}>
                          📜 <strong>{pat.title}</strong> (No: {pat.number})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TEMPLATE 3: CREATIVE (Glassmorphism Header, Premium Tag Cloud)
        ══════════════════════════════════════════════════════════════ */}
        {selectedTheme === 'Creative' && (
          <div style={{ padding: '26px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, textAlign: 'left' }}>
            
            {/* Elegant Colorful Header Banner */}
            <div
              style={{
                background: `linear-gradient(135deg, ${accentColor}, #0f172a)`,
                borderRadius: '14px',
                padding: '20px',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: '0 6px 20px -4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#fff', margin: 0 }}>
                    {pInfo.fullName || 'Your Name'}
                  </h2>
                  <p style={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.8)', marginTop: '4px', margin: 0 }}>
                    {pInfo.title || 'Creative Professional'}
                  </p>
                </div>

                {pInfo.showPhoto && pInfo.profileImageUrl && (() => {
                  const img = parseImageAdjustments(pInfo.profileImageUrl);
                  return (
                    <div style={{ width: '70px', height: '70px', borderRadius: '10px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.25)', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={img.src} style={{ ...img.style, width: '100%', height: '100%' }} alt={pInfo.fullName} />
                    </div>
                  );
                })()}
              </div>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.15)' }} />

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 12px', fontSize: '9.5px', color: 'rgba(255,255,255,0.85)' }}>
                {pInfo.email && <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '5px' }}>✉ {pInfo.email}</span>}
                {pInfo.phone && <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '5px' }}>📞 {pInfo.phone}</span>}
                {pInfo.address && <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '5px' }}>📍 {pInfo.address}</span>}
              </div>

              {resumeData.mediaHandles?.visible && resumeData.mediaHandles?.items?.some((h: any) => h.visible && h.url) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 10px', fontSize: '8.5px' }}>
                  {resumeData.mediaHandles.items.filter((h: any) => h.visible && h.url).map((h: any) => (
                    <span key={h.platform} style={{ color: 'rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.12)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                      {h.platform}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Content Sections */}
            {sectionOrder.map((section) => {
              const secData = resumeData[section];
              if (!secData || !secData.visible) return null;
              if (section === 'mediaHandles') return null;

              const hasContent = section === 'summary' ? !!secData.content : secData.items?.some((i: any) => i.visible);
              if (!hasContent) return null;

              return (
                <div key={section} className="print-avoid-break" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  
                  {/* Heading Accent styling */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '3.5px', height: '13px', backgroundColor: accentColor, borderRadius: '2px' }} />
                    <h3 style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.2px', color: accentColor, margin: 0 }}>
                      {headings[section]}
                    </h3>
                    <div style={{ flex: 1, height: '1px', backgroundColor: `${accentColor}15` }} />
                  </div>

                  {section === 'summary' && (
                    <p style={{ fontSize: '9.5px', color: '#475569', lineHeight: 1.6, margin: 0, paddingLeft: '10px' }}>
                      {secData.content}
                    </p>
                  )}

                  {section === 'experience' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {secData.items.filter((i: any) => i.visible).map((item: any) => (
                        <div key={item.id} style={{ padding: '8px 10px', border: '1px solid #f1f5f9', backgroundColor: '#f8fafc', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1px', boxShadow: '0 1px 2px rgba(0,0,0,0.01)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '9.5px', fontWeight: 'bold', color: '#0f172a' }}>{item.role}</span>
                            <span style={{ fontSize: '8px', fontFamily: 'monospace', color: '#94a3b8' }}>{item.duration}</span>
                          </div>
                          <span style={{ fontSize: '9px', fontWeight: '700', color: accentColor }}>{item.company}</span>
                          <p style={{ fontSize: '9px', color: '#475569', lineHeight: 1.4, margin: '3px 0 0 0', whiteSpace: 'pre-wrap' }}>
                            {item.responsibilities}
                          </p>
                          {item.technologies && (
                            <div style={{ fontSize: '8px', fontFamily: 'monospace', color: '#94a3b8', marginTop: '3px' }}>
                              {item.technologies}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {section === 'education' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {secData.items.filter((i: any) => i.visible).map((item: any) => (
                        <div key={item.id} style={{ padding: '8px 10px', border: '1px solid #f1f5f9', backgroundColor: '#f8fafc', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ fontSize: '9.5px', color: '#0f172a', display: 'block' }}>{item.degree}</strong>
                            <span style={{ fontSize: '9px', color: '#64748b' }}>{item.institution}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '8px', fontFamily: 'monospace', color: '#94a3b8', display: 'block' }}>{item.duration}</span>
                            {item.grade && <span style={{ fontSize: '9px', fontWeight: 'bold', color: accentColor }}>GPA: {item.grade}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {section === 'projects' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {secData.items.filter((i: any) => i.visible).map((item: any) => (
                        <div key={item.id} style={{ padding: '8px 10px', border: '1px solid #f1f5f9', backgroundColor: '#f8fafc', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '9.5px', color: '#0f172a' }}>{item.name}</strong>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              {item.github && <span style={{ fontSize: '8px', color: accentColor }}>Repo</span>}
                              {item.live && <span style={{ fontSize: '8px', color: accentColor }}>Live</span>}
                            </div>
                          </div>
                          <p style={{ fontSize: '9px', color: '#475569', lineHeight: 1.35, margin: '2px 0 0 0' }}>
                            {item.description}
                          </p>
                          {item.technologies && (
                            <div style={{ fontSize: '8px', fontFamily: 'monospace', color: '#64748b', marginTop: '3px' }}>
                              {item.technologies}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {section === 'skills' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', paddingLeft: '10px' }}>
                      {secData.items.filter((i: any) => i.visible).map((skill: any) => {
                        const isHigh = skill.level === 'Expert' || skill.level === 'Advanced';
                        return (
                          <span
                            key={skill.id}
                            style={{
                              fontSize: '8.5px',
                              fontWeight: 'bold',
                              padding: '3px 7px',
                              borderRadius: '6px',
                              backgroundColor: isHigh ? `${accentColor}15` : '#f1f5f9',
                              color: isHigh ? accentColor : '#475569',
                              border: `1px solid ${isHigh ? `${accentColor}25` : '#e2e8f0'}`
                            }}
                          >
                            {skill.name} <span style={{ fontWeight: 'normal', fontSize: '7px', opacity: 0.65 }}>· {skill.level}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {section === 'testScores' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {secData.items.filter((i: any) => i.visible).map((item: any) => (
                        <div key={item.id} style={{ padding: '6px 8px', border: '1px solid #f1f5f9', backgroundColor: '#f8fafc', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ fontSize: '9px', color: '#0f172a', display: 'block' }}>{item.title}</strong>
                            {item.institution && <span style={{ fontSize: '8px', color: '#94a3b8' }}>{item.institution}</span>}
                          </div>
                          <span style={{ fontSize: '9.5px', fontWeight: 'bold', color: '#fff', backgroundColor: accentColor, padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>{item.score}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {section === 'certifications' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {secData.items.filter((i: any) => i.visible).map((cert: any) => (
                        <div key={cert.id} style={{ padding: '6px 8px', border: '1px solid #f1f5f9', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '9px' }}>
                          <strong style={{ color: '#0f172a', display: 'block' }}>{cert.name}</strong>
                          <span style={{ color: '#64748b' }}>{cert.issuer} {cert.date && `· ${cert.date}`}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {section === 'achievements' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingLeft: '10px' }}>
                      {secData.items.filter((i: any) => i.visible).map((ach: any) => (
                        <div key={ach.id} style={{ fontSize: '9px', color: '#475569', borderLeft: `2px solid ${accentColor}40`, paddingLeft: '6px' }}>
                          <strong style={{ color: '#0f172a' }}>{ach.title}</strong> {ach.date && `(${ach.date})`}
                          {ach.description && <div style={{ fontSize: '8px', color: '#64748b', marginTop: '1px' }}>{ach.description}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {section === 'languages' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', paddingLeft: '10px' }}>
                      {secData.items.filter((i: any) => i.visible).map((l: any) => (
                        <span key={l.name} style={{ fontSize: '9px', padding: '2px 6px', backgroundColor: '#f1f5f9', borderRadius: '5px', color: '#475569' }}>
                          {l.name} <span style={{ fontSize: '7px', opacity: 0.65 }}>({l.level})</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {section === 'patents' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingLeft: '10px' }}>
                      {secData.items.filter((i: any) => i.visible).map((pat: any) => (
                        <div key={pat.id} style={{ fontSize: '9px', color: '#475569' }}>
                          📜 <strong>{pat.title}</strong> (No: {pat.number})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
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
              onClick={() => setShowPreviewModal(true)}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-sky-400 cursor-pointer"
              title="Fullscreen Preview"
            >
              <Eye size={14} />
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-indigo-400 cursor-pointer disabled:opacity-50"
              title={downloading ? "Generating PDF..." : "Download PDF"}
            >
              {downloading ? <span className="text-[9px] font-mono">...</span> : <Download size={14} />}
            </button>
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

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Portfolio Url</label>
                  <input
                    type="text"
                    value={pInfo.portfolio || ""}
                    onChange={(e) => updatePersonalInfo("portfolio", e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#781c1c]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Behance Url</label>
                  <input
                    type="text"
                    value={pInfo.behance || ""}
                    onChange={(e) => updatePersonalInfo("behance", e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#781c1c]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Instagram Url</label>
                  <input
                    type="text"
                    value={pInfo.instagram || ""}
                    onChange={(e) => updatePersonalInfo("instagram", e.target.value)}
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

              {/* Social Media Handles */}
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-900 p-2.5 rounded-xl border border-slate-700">
                  <label className="text-xs cursor-pointer select-none flex items-center gap-2 font-bold text-white">
                    <input
                      type="checkbox"
                      checked={resumeData.mediaHandles?.visible || false}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        mediaHandles: { ...resumeData.mediaHandles, visible: e.target.checked }
                      })}
                      className="w-4 h-4 rounded text-[#781c1c]"
                    />
                    Show Socials / Media Handles
                  </label>
                </div>
                {(resumeData.mediaHandles?.visible || false) && (
                  <div className="space-y-1">
                    {resumeData.mediaHandles?.items?.map((item: any, idx: number) => (
                      <div key={item.platform} className="bg-slate-900 border border-slate-700 p-2 rounded-xl flex items-center justify-between text-xs">
                        <span className="text-white text-xs">{item.platform} ({item.url ? "Set" : "Not set"})</span>
                        <button
                          onClick={() => {
                            const list = [...resumeData.mediaHandles.items];
                            list[idx].visible = !list[idx].visible;
                            setResumeData({ ...resumeData, mediaHandles: { ...resumeData.mediaHandles, items: list } });
                          }}
                          className={`p-1 hover:bg-slate-855 rounded ${item.visible ? "text-emerald-400" : "text-slate-500"}`}
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
            style={{
              width: `${794 * zoomLevel}px`,
              height: `${1123 * zoomLevel}px`,
              overflow: "hidden",
              position: "relative"
            }}
            className="transition-all duration-200 shadow-2xl"
          >
            <div
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: "top left",
                width: "794px",
                height: "1123px",
                position: "absolute",
                left: 0,
                top: 0
              }}
            >
              {renderResumeDocument(false)}
            </div>
          </div>
        </div>
      </div>
      {showPreviewModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono">Fullscreen Resume Preview</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Download size={12} /> {downloading ? "Generating..." : "Download PDF"}
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
            {/* Modal Body (Scrollable preview area) */}
            <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center bg-slate-950">
              <div
                style={{
                  width: `${794 * zoomLevel}px`,
                  height: `${1123 * zoomLevel}px`,
                  overflow: "hidden",
                  position: "relative"
                }}
                className="transition-all duration-200 shadow-2xl"
              >
                <div
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: "top left",
                    width: "794px",
                    height: "1123px",
                    position: "absolute",
                    left: 0,
                    top: 0
                  }}
                >
                  {renderResumeDocument(true)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
