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
  Download,
  Sun,
  Moon
} from "lucide-react";
import api from "@/services/api";
import { useTheme } from "@/hooks/useTheme";
import { parseImageAdjustments } from "@/utils/image";

export default function ResumeEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const [themeMode, toggleThemeMode] = useTheme();
  const isDark = themeMode === "dark";

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
        const calculatedZoom = (window.innerWidth - 24) / 794;
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

  // Font size level ("Small", "Medium", "Large", "XL")
  const [fontSizeLevel, setFontSizeLevel] = useState<string>("Medium");

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
        // Clean up legacy testScores so academic marksheets don't duplicate under Test Scores section
        if (parsed.testScores?.items) {
          parsed.testScores.items = parsed.testScores.items.filter((item: any) => {
            const title = (item.title || item.degree || "").toLowerCase();
            const isAcademic = title.includes("marksheet") || title.includes("10th") || title.includes("12th") || title.includes("b.sc") || title.includes("bachelor") || title.includes("course");
            return !isAcademic;
          });
        }

        // Auto-sync education section with full portfolio academic records (UG, Course, 12th, 10th)
        if (parsed.education) {
          if (!parsed.education.items) parsed.education.items = [];
          portfolio.academicRecords.forEach((rec: any) => {
            const exists = parsed.education.items.some((item: any) => item.id === rec.id || item.degree === rec.degree);
            if (!exists) {
              parsed.education.items.push({
                id: rec.id,
                degree: rec.degree,
                institution: rec.institution,
                duration: `${rec.startYear} - ${rec.endYear}`,
                grade: rec.grade,
                visible: true
              });
            }
          });
        }

        setResumeData(parsed);
        if (parsed.headings) setHeadings(parsed.headings);
        if (parsed.sectionOrder) setSectionOrder(parsed.sectionOrder);
        if (parsed.fontSizeLevel) setFontSizeLevel(parsed.fontSizeLevel);
      } else {
        // First-time initialization from portfolio
        const initialized = initializeResumeFromPortfolio(portfolio);
        setResumeData(initialized);
      }

      // Check missing required marksheets
      checkRequiredMarksheets(portfolio.academicRecords);
    } catch (err) {
      console.error("Failed loading resume:", err);
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

    const testScoresItems = prof?.testScores ? [
      {
        id: "profile-test-scores",
        typeId: "standardized",
        title: "Standardized Test Scores",
        score: prof.testScores,
        institution: "Official Entrance & Proficiency Examinations",
        duration: "",
        visible: true,
        highlighted: true
      }
    ] : [];

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
            technologies: exp.category || "",
            visible: true
          };
        })
      },
      education: {
        visible: true,
        items: portfolio.academicRecords.map((rec: any) => ({
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
          sectionOrder,
          fontSizeLevel
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
  // Captures exact .resume-page-sheet A4 elements into PDF — preview === download, always.
  const handleDownloadPDF = async () => {
    let el = document.getElementById("resume-preview-container");
    if (!el) {
      el = document.getElementById("resume-preview-container-modal");
    }
    if (!el) return;
    
    const originalZoom = zoomLevel;
    try {
      setDownloading(true);

      // Temporarily set zoom level to 1 to avoid layout scaling artifacts
      setZoomLevel(1);
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (typeof document !== "undefined" && document.fonts) {
        await document.fonts.ready;
      }

      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      let pageSheets = Array.from(el.querySelectorAll(".resume-page-sheet"));
      if (pageSheets.length === 0) {
        pageSheets = [el];
      }

      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [794, 1123] });

      for (let i = 0; i < pageSheets.length; i++) {
        if (i > 0) {
          pdf.addPage([794, 1123], "portrait");
        }

        const sheetEl = pageSheets[i] as HTMLElement;
        const pageCanvas = await html2canvas(sheetEl, {
          scale: 2,           // 2x for crisp print quality
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          logging: false,
          onclone: (clonedDoc) => {
            const style = clonedDoc.createElement("style");
            style.innerHTML = `
              * {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: optimizeLegibility;
                letter-spacing: normal !important;
              }
            `;
            clonedDoc.head.appendChild(style);
          }
        });

        const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.95);
        pdf.addImage(pageImgData, "JPEG", 0, 0, 794, 1123, undefined, "FAST");
      }

      const safeName = (resumeTitle || "resume").replace(/[^a-z0-9_\-]/gi, "_");
      pdf.save(`${safeName}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Could not generate PDF. Please try again.");
    } finally {
      setZoomLevel(originalZoom);
      setDownloading(false);
    }
  };

  const renderResumeDocument = (isModal = false) => {
    const pInfo = resumeData.personalInfo;

    // Font Scaling configuration based on user selected fontSizeLevel
    const getFontConfig = () => {
      switch (fontSizeLevel) {
        case "Small":
          return {
            bodyFont: "9.5px",
            smallFont: "8.5px",
            headingFont: "11.5px",
            titleFont: "23px",
            lineHeight: 1.45,
            gap: "6px",
            cardPadding: "8px 12px",
            sectionGap: "10px"
          };
        case "Large":
          return {
            bodyFont: "11.5px",
            smallFont: "10px",
            headingFont: "13.5px",
            titleFont: "28px",
            lineHeight: 1.65,
            gap: "10px",
            cardPadding: "12px 16px",
            sectionGap: "18px"
          };
        case "XL":
          return {
            bodyFont: "12.5px",
            smallFont: "11px",
            headingFont: "14.5px",
            titleFont: "30px",
            lineHeight: 1.7,
            gap: "12px",
            cardPadding: "14px 18px",
            sectionGap: "20px"
          };
        case "Medium":
        default:
          return {
            bodyFont: "10.5px",
            smallFont: "9.5px",
            headingFont: "12.5px",
            titleFont: "26px",
            lineHeight: 1.55,
            gap: "8px",
            cardPadding: "10px 14px",
            sectionGap: "14px"
          };
      }
    };

    const fontCfg = getFontConfig();

    // Helper to dynamically partition active sections into Page 1 and Page 2 in user's sectionOrder
    const getPartitionedSections = (filterSidebar: boolean = false) => {
      const activeSections = sectionOrder.filter((secKey) => {
        const secData = resumeData[secKey];
        if (!secData || !secData.visible) return false;
        if (secKey === "mediaHandles") return false;
        if (filterSidebar && ["skills", "languages"].includes(secKey)) return false;
        const hasContent = secKey === "summary" ? !!secData.content : secData.items?.some((i: any) => i.visible);
        return hasContent;
      });

      const p1Sections: string[] = [];
      const p2Sections: string[] = [];
      let accumHeight = 0;
      // Tightened budget to account for header banner height in Creative template
      const p1Budget = fontSizeLevel === "Small" ? 620 : fontSizeLevel === "Large" ? 560 : fontSizeLevel === "XL" ? 520 : 590;
      const MIN_SPACE_REMAINING = 80;

      activeSections.forEach((secKey) => {
        const secData = resumeData[secKey];
        const items = secData.items?.filter((i: any) => i.visible) || [];
        let secHeight = 50 + items.length * 50;

        if (secKey === "summary") secHeight = 65;
        if (secKey === "experience") secHeight = 38 + items.length * 90;
        if (secKey === "education") secHeight = 38 + items.length * 60;
        if (secKey === "projects") secHeight = 38 + items.length * 75;
        // Compact sections - each item is just one text line
        if (secKey === "skills") secHeight = 32 + Math.ceil(items.length / 3) * 22;
        if (secKey === "certifications") secHeight = 32 + items.length * 32;
        if (secKey === "achievements") secHeight = 32 + items.length * 30;
        if (secKey === "languages") secHeight = 32 + Math.ceil(items.length / 4) * 22;
        if (secKey === "testScores") secHeight = 32 + items.length * 45;
        if (secKey === "patents") secHeight = 32 + items.length * 28;

        if (fontSizeLevel === "Large") secHeight *= 1.15;
        if (fontSizeLevel === "XL") secHeight *= 1.30;
        if (fontSizeLevel === "Small") secHeight *= 0.88;

        const remaining = p1Budget - accumHeight;
        // Push entire section to p2 if it won't fit with comfortable margin
        if ((remaining >= secHeight + MIN_SPACE_REMAINING) || p1Sections.length === 0) {
          p1Sections.push(secKey);
          accumHeight += secHeight;
        } else {
          p2Sections.push(secKey);
        }
      });

      return { p1Sections, p2Sections };
    };

    // Advanced item-level partitioning specifically for Professional and Classic ATS to maximize Page 1 space utilization
    const getAdvancedPartitioning = (filterSidebar: boolean, templateType: "Professional" | "Classic ATS") => {
      const isProf = templateType === "Professional";
      const activeSections = sectionOrder.filter((secKey) => {
        const secData = resumeData[secKey];
        if (!secData || !secData.visible) return false;
        if (secKey === "mediaHandles") return false;
        if (filterSidebar && ["skills", "languages"].includes(secKey)) return false;
        const hasContent = secKey === "summary" ? !!secData.content : secData.items?.some((i: any) => i.visible);
        return hasContent;
      });

      const p1Map: { [key: string]: any[] } = {};
      const p2Map: { [key: string]: any[] } = {};
      const p1Sections: string[] = [];
      const p2Sections: string[] = [];

      let accumHeight = 0;
      // Conservative budgets: page content area minus generous bottom margin.
      // Professional: header banner ~110px + sidebar layout → main column ~950px usable → budget 760
      // Classic ATS: header ~70px + padding 80px → ~973px usable → budget 820
      // We subtract an extra ~120px safety margin so sections are never clipped.
      const p1Budget = isProf
        ? (fontSizeLevel === "Small" ? 780 : fontSizeLevel === "Large" ? 720 : fontSizeLevel === "XL" ? 680 : 760)
        : (fontSizeLevel === "Small" ? 800 : fontSizeLevel === "Large" ? 740 : fontSizeLevel === "XL" ? 700 : 780);
      // Minimum space that must remain after placing a section. If remaining < this, stop adding to page 1.
      const MIN_SPACE_REMAINING = 70;

      activeSections.forEach((secKey) => {
        const secData = resumeData[secKey];
        if (secKey === "summary") {
          const summaryHeight = fontSizeLevel === "Small" ? 55 : fontSizeLevel === "Large" ? 85 : fontSizeLevel === "XL" ? 95 : 70;
          const remaining = p1Budget - accumHeight;
          if ((remaining >= summaryHeight + MIN_SPACE_REMAINING) || p1Sections.length === 0) {
            p1Sections.push(secKey);
            p1Map[secKey] = [secData.content];
            accumHeight += summaryHeight;
          } else {
            p2Sections.push(secKey);
            p2Map[secKey] = [secData.content];
          }
          return;
        }

        const items = secData.items?.filter((i: any) => i.visible) || [];
        if (items.length === 0) return;

        const headerHeight = 34;
        const secP1Items: any[] = [];
        const secP2Items: any[] = [];

        items.forEach((item: any) => {
          let itemHeight = 55;
          if (secKey === "experience") itemHeight = fontSizeLevel === "Small" ? 75 : fontSizeLevel === "Large" ? 105 : fontSizeLevel === "XL" ? 115 : 90;
          if (secKey === "education") itemHeight = fontSizeLevel === "Small" ? 45 : fontSizeLevel === "Large" ? 65 : fontSizeLevel === "XL" ? 75 : 55;
          if (secKey === "projects") itemHeight = fontSizeLevel === "Small" ? 65 : fontSizeLevel === "Large" ? 90 : fontSizeLevel === "XL" ? 100 : 75;
          // Compact sections — each item is a short single-line row
          if (secKey === "skills") itemHeight = fontSizeLevel === "Small" ? 18 : fontSizeLevel === "Large" ? 24 : fontSizeLevel === "XL" ? 26 : 21;
          if (secKey === "certifications") itemHeight = fontSizeLevel === "Small" ? 28 : fontSizeLevel === "Large" ? 38 : fontSizeLevel === "XL" ? 42 : 33;
          if (secKey === "achievements") itemHeight = fontSizeLevel === "Small" ? 26 : fontSizeLevel === "Large" ? 36 : fontSizeLevel === "XL" ? 40 : 30;
          if (secKey === "languages") itemHeight = fontSizeLevel === "Small" ? 18 : fontSizeLevel === "Large" ? 24 : fontSizeLevel === "XL" ? 26 : 21;
          if (secKey === "testScores") itemHeight = fontSizeLevel === "Small" ? 40 : fontSizeLevel === "Large" ? 55 : fontSizeLevel === "XL" ? 62 : 48;
          if (secKey === "patents") itemHeight = fontSizeLevel === "Small" ? 22 : fontSizeLevel === "Large" ? 32 : fontSizeLevel === "XL" ? 36 : 27;

          const needed = (secP1Items.length === 0 ? headerHeight : 0) + itemHeight;
          // Only place on page 1 if there's enough space PLUS the minimum remaining margin
          const remaining = p1Budget - accumHeight;
          if (remaining >= needed + MIN_SPACE_REMAINING) {
            secP1Items.push(item);
            accumHeight += needed;
          } else {
            secP2Items.push(item);
          }
        });

        // Guard: don't strand a section heading with very few items at the bottom of page 1.
        // If fewer than 2 items fit on page 1 AND there are still items spilling to page 2,
        // move the entire section to page 2 to keep heading + content together.
        const minItemsOnPage1 = ["experience", "projects"].includes(secKey) ? 1 : 2;
        if (secP1Items.length > 0 && secP1Items.length < minItemsOnPage1 && secP2Items.length > 0) {
          // Undo the p1 accumulation and push all to p2
          const p1AccumToUndo = headerHeight + secP1Items.reduce((_: number, item: any) => {
            let h = 55;
            if (secKey === "experience") h = fontSizeLevel === "Small" ? 75 : fontSizeLevel === "Large" ? 105 : fontSizeLevel === "XL" ? 115 : 90;
            if (secKey === "education") h = fontSizeLevel === "Small" ? 45 : fontSizeLevel === "Large" ? 65 : fontSizeLevel === "XL" ? 75 : 55;
            if (secKey === "projects") h = fontSizeLevel === "Small" ? 65 : fontSizeLevel === "Large" ? 90 : fontSizeLevel === "XL" ? 100 : 75;
            if (secKey === "skills") h = fontSizeLevel === "Small" ? 18 : fontSizeLevel === "Large" ? 24 : fontSizeLevel === "XL" ? 26 : 21;
            if (secKey === "certifications") h = fontSizeLevel === "Small" ? 28 : fontSizeLevel === "Large" ? 38 : fontSizeLevel === "XL" ? 42 : 33;
            if (secKey === "achievements") h = fontSizeLevel === "Small" ? 26 : fontSizeLevel === "Large" ? 36 : fontSizeLevel === "XL" ? 40 : 30;
            if (secKey === "languages") h = fontSizeLevel === "Small" ? 18 : fontSizeLevel === "Large" ? 24 : fontSizeLevel === "XL" ? 26 : 21;
            if (secKey === "testScores") h = fontSizeLevel === "Small" ? 40 : fontSizeLevel === "Large" ? 55 : fontSizeLevel === "XL" ? 62 : 48;
            if (secKey === "patents") h = fontSizeLevel === "Small" ? 22 : fontSizeLevel === "Large" ? 32 : fontSizeLevel === "XL" ? 36 : 27;
            return _ + h;
          }, 0);
          accumHeight -= p1AccumToUndo;
          secP2Items.unshift(...secP1Items);
          secP1Items.length = 0;
        }

        if (secP1Items.length > 0) {
          p1Sections.push(secKey);
          p1Map[secKey] = secP1Items;
        }
        if (secP2Items.length > 0) {
          p2Sections.push(secKey);
          p2Map[secKey] = secP2Items;
        }
      });

      return { p1Sections, p2Sections, p1Map, p2Map };
    };

    // ─── TEMPLATE 1: PROFESSIONAL (Split 2-Column Banner & Sidebar) ───
    if (selectedTheme === "Professional") {
      const { p1Sections, p2Sections, p1Map, p2Map } = getAdvancedPartitioning(true, "Professional");

      const renderProfessionalMain = (sectionsToRender: string[], itemMap: { [key: string]: any[] }, isPage2: boolean = false) => {
        return sectionsToRender.map((section) => {
          const secData = resumeData[section];
          if (!secData || !secData.visible) return null;
          if (["skills", "languages", "mediaHandles"].includes(section)) return null;

          const itemsToRender = section === "summary" ? secData.content : (itemMap[section] || []);
          if (!itemsToRender || (Array.isArray(itemsToRender) && itemsToRender.length === 0)) return null;

          const isContinued = isPage2 && p1Sections.includes(section);
          const headingTitle = isContinued ? `${headings[section] || section} (Continued)` : (headings[section] || section);

          return (
            <div key={section + (isPage2 ? "_p2" : "_p1")} className="print-avoid-break" style={{ marginBottom: fontCfg.sectionGap }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: fontCfg.gap }}>
                <div style={{ width: "4px", height: "15px", backgroundColor: accentColor, borderRadius: "2px", flexShrink: 0 }} />
                <div style={{ fontSize: fontCfg.headingFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", color: "#0f172a" }}>
                  {headingTitle}
                </div>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }} />
              </div>

              {section === "summary" && (
                <p style={{ fontSize: fontCfg.bodyFont, color: "#1e293b", lineHeight: fontCfg.lineHeight, whiteSpace: "pre-wrap", margin: 0, textAlign: "justify" }}>{secData.content}</p>
              )}

              {section === "experience" && (
                <div style={{ display: "flex", flexDirection: "column", gap: fontCfg.gap }}>
                  {(itemsToRender as any[]).map((item: any) => (
                    <div key={item.id} className="resume-module-card print-avoid-break" style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontSize: `calc(${fontCfg.bodyFont} + 1.5px)`, fontWeight: 700, color: "#0f172a" }}>{item.role}</span>
                        <span style={{ fontSize: fontCfg.smallFont, fontFamily: "monospace", color: "#475569" }}>{item.duration}</span>
                      </div>
                      <div style={{ fontSize: fontCfg.bodyFont, color: accentColor, fontWeight: 650, marginTop: "1px" }}>{item.company}</div>
                      <p style={{ fontSize: fontCfg.bodyFont, color: "#334155", lineHeight: fontCfg.lineHeight, marginTop: "4px", whiteSpace: "pre-wrap" }}>{item.responsibilities}</p>
                      {item.technologies && <div style={{ fontSize: fontCfg.smallFont, fontFamily: "monospace", color: "#475569", marginTop: "3px" }}>Stack: {item.technologies}</div>}
                    </div>
                  ))}
                </div>
              )}

              {section === "education" && (
                <div style={{ display: "flex", flexDirection: "column", gap: fontCfg.gap }}>
                  {(itemsToRender as any[]).map((item: any) => (
                    <div key={item.id} className="resume-module-card print-avoid-break" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: fontCfg.bodyFont, breakInside: "avoid", pageBreakInside: "avoid" }}>
                      <div>
                        <div style={{ fontSize: `calc(${fontCfg.bodyFont} + 1.5px)`, fontWeight: 700, color: "#0f172a" }}>{item.degree}</div>
                        <div style={{ fontSize: fontCfg.bodyFont, color: "#475569", marginTop: "1px" }}>{item.institution}</div>
                        {item.grade && <div style={{ fontSize: fontCfg.smallFont, fontFamily: "monospace", color: accentColor, fontWeight: 700, marginTop: "2px" }}>CGPA / Grade: {item.grade}</div>}
                      </div>
                      <span style={{ fontSize: fontCfg.smallFont, fontFamily: "monospace", color: "#475569", whiteSpace: "nowrap" }}>{item.duration}</span>
                    </div>
                  ))}
                </div>
              )}

              {section === "projects" && (
                <div style={{ display: "flex", flexDirection: "column", gap: fontCfg.gap }}>
                  {(itemsToRender as any[]).map((item: any) => (
                    <div key={item.id} className="resume-module-card print-avoid-break" style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: `calc(${fontCfg.bodyFont} + 1.5px)`, fontWeight: 700, color: "#0f172a" }}>{item.name}</span>
                        <div style={{ display: "flex", gap: "10px" }}>
                          {item.github && <span style={{ fontSize: fontCfg.smallFont, fontWeight: 600, color: accentColor }}>GitHub</span>}
                          {item.live && <span style={{ fontSize: fontCfg.smallFont, fontWeight: 600, color: accentColor }}>Demo</span>}
                        </div>
                      </div>
                      <p style={{ fontSize: fontCfg.bodyFont, color: "#334155", lineHeight: fontCfg.lineHeight, marginTop: "3px" }}>{item.description}</p>
                      {item.technologies && <div style={{ fontSize: fontCfg.smallFont, fontFamily: "monospace", color: "#475569", marginTop: "3px" }}>Technologies: {item.technologies}</div>}
                    </div>
                  ))}
                </div>
              )}

              {section === "certifications" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  {(itemsToRender as any[]).map((cert: any) => (
                    <div key={cert.id} className="resume-module-card print-avoid-break" style={{ display: "flex", justifyContent: "space-between", fontSize: fontCfg.bodyFont, breakInside: "avoid", pageBreakInside: "avoid" }}>
                      <span><strong style={{ color: "#0f172a" }}>{cert.name}</strong> <span style={{ color: "#475569" }}>— {cert.issuer}</span></span>
                      <span style={{ fontSize: fontCfg.smallFont, fontFamily: "monospace", color: "#475569" }}>{cert.date}</span>
                    </div>
                  ))}
                </div>
              )}

              {section === "achievements" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {(itemsToRender as any[]).map((ach: any) => (
                    <div key={ach.id} style={{ fontSize: fontCfg.bodyFont, color: "#0f172a" }}>
                      <strong style={{ color: "#0f172a" }}>{ach.title}</strong>{ach.date && ` (${ach.date})`}
                      {ach.description && <div style={{ fontSize: fontCfg.smallFont, color: "#475569", marginTop: "2px" }}>{ach.description}</div>}
                    </div>
                  ))}
                </div>
              )}

              {section === "testScores" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {(itemsToRender as any[]).map((item: any) => (
                    <div key={item.id} style={{ padding: fontCfg.cardPadding, borderRadius: "8px", border: `1px solid ${accentColor}30`, background: `${accentColor}08` }}>
                      <div style={{ fontSize: fontCfg.bodyFont, fontWeight: 700, color: "#0f172a" }}>{item.title}</div>
                      <div style={{ fontSize: `calc(${fontCfg.bodyFont} + 1px)`, fontFamily: "monospace", fontWeight: 800, color: accentColor, marginTop: "2px" }}>{item.score}</div>
                      {item.institution && <div style={{ fontSize: fontCfg.smallFont, color: "#475569", marginTop: "1px" }}>{item.institution}</div>}
                    </div>
                  ))}
                </div>
              )}

              {section === "patents" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  {(itemsToRender as any[]).map((pat: any) => (
                    <div key={pat.id} style={{ fontSize: fontCfg.bodyFont, color: "#0f172a" }}>
                      <strong style={{ color: "#0f172a" }}>{pat.title}</strong> — Patent No: {pat.number}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        });
      };

      const renderProfessionalSidebar = () => (
        <div style={{ width: "220px", backgroundColor: "#f8fafc", borderRight: "1px solid #e2e8f0", flexShrink: 0, display: "flex", flexDirection: "column" }}>
          {pInfo.showPhoto && pInfo.profileImageUrl && (() => {
            const img = parseImageAdjustments(pInfo.profileImageUrl);
            return (
              <div style={{ display: "flex", justifyContent: "center", padding: "20px 0 14px", background: `${accentColor}15` }}>
                <div style={{ width: "95px", height: "95px", borderRadius: "50%", overflow: "hidden", border: `3px solid ${accentColor}`, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", background: "#fff" }}>
                  <img src={img.src} style={{ ...img.style, width: "100%", height: "100%" }} alt={pInfo.fullName} />
                </div>
              </div>
            );
          })()}

          <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: "18px" }}>
            {resumeData.skills?.visible && resumeData.skills?.items?.some((i: any) => i.visible) && (
              <div>
                <div style={{ fontSize: fontCfg.smallFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", color: accentColor, borderBottom: `2px solid ${accentColor}`, paddingBottom: "4px", marginBottom: "8px" }}>
                  {headings["skills"] || "Skills"}
                </div>
                {resumeData.skills.items.filter((i: any) => i.visible).map((s: any) => (
                  <div key={s.id} style={{ fontSize: fontCfg.bodyFont, color: "#0f172a", fontWeight: 700, marginBottom: "4px" }}>
                    {s.name} <span style={{ fontSize: fontCfg.smallFont, color: "#64748b", fontWeight: 500 }}>({s.level})</span>
                  </div>
                ))}
              </div>
            )}

            {resumeData.languages?.visible && resumeData.languages?.items?.some((l: any) => l.visible) && (
              <div>
                <div style={{ fontSize: fontCfg.smallFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", color: accentColor, borderBottom: `2px solid ${accentColor}`, paddingBottom: "4px", marginBottom: "8px" }}>
                  {headings["languages"] || "Languages"}
                </div>
                {resumeData.languages.items.filter((l: any) => l.visible).map((l: any) => (
                  <div key={l.name} style={{ fontSize: fontCfg.bodyFont, color: "#0f172a", fontWeight: 700, marginBottom: "4px" }}>
                    {l.name} <span style={{ fontSize: fontCfg.smallFont, color: "#64748b", fontWeight: 500 }}>({l.level})</span>
                  </div>
                ))}
              </div>
            )}

            {resumeData.mediaHandles?.visible && resumeData.mediaHandles?.items?.some((h: any) => h.visible && h.url) && (
              <div>
                <div style={{ fontSize: fontCfg.smallFont, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", color: accentColor, borderBottom: `2px solid ${accentColor}`, paddingBottom: "4px", marginBottom: "8px" }}>Socials</div>
                {resumeData.mediaHandles.items.filter((h: any) => h.visible && h.url).map((h: any) => (
                  <div key={h.platform} style={{ fontSize: fontCfg.smallFont, color: "#0f172a", wordBreak: "break-all", marginBottom: "5px" }}>
                    <span style={{ fontWeight: 700, color: accentColor }}>{h.platform}:</span> {h.url}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );

      return (
        <div id={isModal ? "resume-preview-container-modal" : "resume-preview-container"} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "32px", width: "794px" }}>
          {/* Page 1 */}
          <div className="resume-page-sheet resume-document-light" style={{ width: "794px", height: "1123px", backgroundColor: "#fff", boxShadow: "0 14px 40px rgba(0,0,0,0.35)", borderRadius: "4px", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: "'Inter',sans-serif" }}>
            <div style={{ backgroundColor: accentColor, padding: "24px 32px 20px 32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: fontCfg.titleFont, fontWeight: 900, letterSpacing: "1.5px", textTransform: "uppercase", color: "#ffffff", lineHeight: 1.1 }}>{pInfo.fullName || "Your Name"}</div>
                <div style={{ fontSize: fontCfg.bodyFont, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.92)", marginTop: "6px" }}>{pInfo.title || "Professional Title"}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px", fontSize: fontCfg.bodyFont, color: "rgba(255,255,255,0.95)" }}>
                {pInfo.email && <span>{pInfo.email}</span>}
                {pInfo.phone && <span>{pInfo.phone}</span>}
                {pInfo.address && <span>{pInfo.address}</span>}
              </div>
            </div>

            <div style={{ display: "flex", flex: 1 }}>
              {renderProfessionalSidebar()}
              <div style={{ flex: 1, padding: "24px 28px", display: "flex", flexDirection: "column", gap: fontCfg.sectionGap, background: "#fff" }}>
                {renderProfessionalMain(p1Sections, p1Map, false)}
              </div>
            </div>
          </div>

          {/* Visual Divider */}
          {p2Sections.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", width: "794px", userSelect: "none" }}>
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, #475569, transparent)" }} />
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "2px", background: "#0f172a", padding: "5px 16px", borderRadius: "9999px", border: "1px solid #334155" }}>📄 PAGE BREAK · END OF PAGE 1</span>
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, #475569, transparent)" }} />
            </div>
          )}

          {/* Page 2 */}
          {p2Sections.length > 0 && (
            <div className="resume-page-sheet resume-document-light" style={{ width: "794px", height: "1123px", backgroundColor: "#fff", boxShadow: "0 14px 40px rgba(0,0,0,0.35)", borderRadius: "4px", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: "'Inter',sans-serif" }}>
              <div style={{ display: "flex", flex: 1, paddingTop: "24px" }}>
                <div style={{ width: "220px", backgroundColor: "#f8fafc", borderRight: "1px solid #e2e8f0", flexShrink: 0 }} />
                <div style={{ flex: 1, padding: "0 28px 24px 28px", display: "flex", flexDirection: "column", gap: fontCfg.sectionGap, background: "#fff" }}>
                  {renderProfessionalMain(p2Sections, p2Map, true)}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // ─── TEMPLATE 2: CLASSIC ATS (Ultra Clean Monochrome 1-Column) ───
    if (selectedTheme === "Classic ATS") {
      const { p1Sections, p2Sections, p1Map, p2Map } = getAdvancedPartitioning(false, "Classic ATS");

      const renderAtsContent = (sectionsToRender: string[], itemMap: { [key: string]: any[] }, isPage2: boolean = false) => {
        return sectionsToRender.map((section) => {
          const secData = resumeData[section];
          if (!secData || !secData.visible) return null;
          if (section === "mediaHandles") return null;

          const itemsToRender = section === "summary" ? secData.content : (itemMap[section] || []);
          if (!itemsToRender || (Array.isArray(itemsToRender) && itemsToRender.length === 0)) return null;

          const isContinued = isPage2 && p1Sections.includes(section);
          const headingTitle = isContinued ? `${headings[section] || section} (Continued)` : (headings[section] || section);

          return (
            <div key={section + (isPage2 ? "_p2" : "_p1")} className="print-avoid-break" style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: fontCfg.sectionGap }}>
              <h3 style={{ fontSize: fontCfg.headingFont, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1.5px", borderBottom: "1.5px solid #000000", paddingBottom: "3px", color: "#000000", margin: "6px 0 3px 0", textAlign: "left", fontFamily: "Georgia, serif" }}>
                {headingTitle}
              </h3>

              {section === "summary" && (
                <p style={{ fontSize: fontCfg.bodyFont, color: "#000000", lineHeight: fontCfg.lineHeight, margin: 0, textAlign: "justify" }}>{secData.content}</p>
              )}

              {section === "experience" && (
                <div style={{ display: "flex", flexDirection: "column", gap: fontCfg.gap }}>
                  {(itemsToRender as any[]).map((item: any) => (
                    <div key={item.id} className="resume-module-card print-avoid-break" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: `calc(${fontCfg.bodyFont} + 1px)`, color: "#000000" }}>
                        <span>{item.role}</span>
                        <span style={{ fontSize: fontCfg.smallFont, fontWeight: "normal", fontFamily: "monospace", color: "#222222" }}>{item.duration}</span>
                      </div>
                      <div style={{ fontSize: fontCfg.bodyFont, fontWeight: "600", color: "#000000", fontStyle: "italic" }}>{item.company}</div>
                      <p style={{ fontSize: fontCfg.bodyFont, color: "#000000", lineHeight: fontCfg.lineHeight, margin: "2px 0 0 0", whiteSpace: "pre-wrap" }}>{item.responsibilities}</p>
                      {item.technologies && <div style={{ fontSize: fontCfg.smallFont, fontFamily: "monospace", color: "#222222", marginTop: "2px" }}>Key Stack: {item.technologies}</div>}
                    </div>
                  ))}
                </div>
              )}

              {section === "education" && (
                <div style={{ display: "flex", flexDirection: "column", gap: fontCfg.gap }}>
                  {(itemsToRender as any[]).map((item: any) => (
                    <div key={item.id} className="resume-module-card print-avoid-break" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: fontCfg.bodyFont }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: `calc(${fontCfg.bodyFont} + 1.5px)`, fontWeight: "bold", color: "#000000" }}>{item.degree}</span>
                        <span style={{ color: "#000000" }}>{item.institution}</span>
                        {item.grade && <span style={{ fontSize: fontCfg.smallFont, fontFamily: "monospace", color: "#000000", fontWeight: "bold", marginTop: "2px" }}>GPA / Grade: {item.grade}</span>}
                      </div>
                      <span style={{ fontSize: fontCfg.smallFont, fontFamily: "monospace", color: "#222222" }}>{item.duration}</span>
                    </div>
                  ))}
                </div>
              )}

              {section === "projects" && (
                <div style={{ display: "flex", flexDirection: "column", gap: fontCfg.gap }}>
                  {(itemsToRender as any[]).map((item: any) => (
                    <div key={item.id} className="resume-module-card print-avoid-break" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: `calc(${fontCfg.bodyFont} + 1px)`, color: "#000000" }}>
                        <span>{item.name}</span>
                        <span style={{ fontSize: fontCfg.smallFont, fontWeight: "normal", fontFamily: "monospace", color: "#222222" }}>{item.github || item.live}</span>
                      </div>
                      <p style={{ fontSize: fontCfg.bodyFont, color: "#000000", lineHeight: fontCfg.lineHeight, margin: 0 }}>{item.description}</p>
                      {item.technologies && <div style={{ fontSize: fontCfg.smallFont, fontFamily: "monospace", color: "#222222", marginTop: "2px" }}>Technologies: {item.technologies}</div>}
                    </div>
                  ))}
                </div>
              )}

              {section === "skills" && (
                <div style={{ fontSize: fontCfg.bodyFont, color: "#000000", lineHeight: fontCfg.lineHeight }}>
                  {(itemsToRender as any[]).map((s: any) => (
                    <span key={s.id} style={{ marginRight: "12px", display: "inline-block" }}>
                      <strong>{s.name}</strong> <span style={{ color: "#333333", fontSize: fontCfg.smallFont }}>({s.level})</span>
                    </span>
                  ))}
                </div>
              )}

              {section === "testScores" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {(itemsToRender as any[]).map((item: any) => (
                    <div key={item.id} style={{ padding: "6px 10px", border: "1px solid #000000", borderRadius: "4px" }}>
                      <div style={{ fontSize: fontCfg.bodyFont, fontWeight: "bold", color: "#000000" }}>{item.title}</div>
                      <div style={{ fontSize: `calc(${fontCfg.bodyFont} + 1px)`, fontFamily: "monospace", fontWeight: "bold", color: "#000000", marginTop: "1px" }}>{item.score}</div>
                      {item.institution && <div style={{ fontSize: fontCfg.smallFont, color: "#222222" }}>{item.institution}</div>}
                    </div>
                  ))}
                </div>
              )}

              {section === "certifications" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {(itemsToRender as any[]).map((cert: any) => (
                    <div key={cert.id} style={{ display: "flex", justifyContent: "space-between", fontSize: fontCfg.bodyFont, color: "#000000" }}>
                      <span><strong>{cert.name}</strong> <span style={{ color: "#333333" }}>— {cert.issuer}</span></span>
                      <span style={{ fontSize: fontCfg.smallFont, fontFamily: "monospace", color: "#333333" }}>{cert.date}</span>
                    </div>
                  ))}
                </div>
              )}

              {section === "achievements" && (
                <ul style={{ listStyleType: "disc", paddingLeft: "18px", margin: 0, fontSize: fontCfg.bodyFont, color: "#000000" }}>
                  {(itemsToRender as any[]).map((ach: any) => (
                    <li key={ach.id} style={{ marginBottom: "3px" }}>
                      <strong>{ach.title}</strong> {ach.date && `(${ach.date})`} {ach.description && `— ${ach.description}`}
                    </li>
                  ))}
                </ul>
              )}

              {section === "patents" && (
                <ul style={{ listStyleType: "square", paddingLeft: "18px", margin: 0, fontSize: fontCfg.bodyFont, color: "#000000" }}>
                  {(itemsToRender as any[]).map((pat: any) => (
                    <li key={pat.id} style={{ marginBottom: "3px" }}>
                      <strong>{pat.title}</strong> — Patent No: {pat.number}
                    </li>
                  ))}
                </ul>
              )}

              {section === "languages" && (
                <div style={{ fontSize: fontCfg.bodyFont, color: "#000000" }}>
                  {(itemsToRender as any[]).map((l: any, idx: number, arr: any[]) => (
                    <span key={l.name}>
                      {l.name} ({l.level}){idx < arr.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        });
      };

      return (
        <div id={isModal ? "resume-preview-container-modal" : "resume-preview-container"} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "32px", width: "794px" }}>
          {/* Page 1 */}
          <div className="resume-page-sheet resume-document-light" style={{ width: "794px", height: "1123px", backgroundColor: "#fff", boxShadow: "0 14px 40px rgba(0,0,0,0.35)", borderRadius: "4px", padding: "40px 52px", display: "flex", flexDirection: "column", gap: fontCfg.sectionGap, boxSizing: "border-box", fontFamily: "Georgia, serif", textAlign: "left" }}>
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "5px" }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: fontCfg.titleFont, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#000000", margin: 0 }}>
                {pInfo.fullName || "Your Name"}
              </h2>
              <div style={{ fontSize: fontCfg.bodyFont, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1.5px", color: "#000000" }}>
                {pInfo.title}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 14px", fontSize: fontCfg.bodyFont, color: "#111111" }}>
                {pInfo.email && <span>{pInfo.email}</span>}
                {pInfo.phone && <span>• {pInfo.phone}</span>}
                {pInfo.address && <span>• {pInfo.address}</span>}
              </div>
              {resumeData.mediaHandles?.visible && resumeData.mediaHandles?.items?.some((h: any) => h.visible && h.url) && (
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 12px", fontSize: fontCfg.smallFont, fontFamily: "monospace", color: "#222222" }}>
                  {resumeData.mediaHandles.items.filter((h: any) => h.visible && h.url).map((h: any) => (
                    <span key={h.platform}>{h.platform}: {h.url}</span>
                  ))}
                </div>
              )}
            </div>
            {renderAtsContent(p1Sections, p1Map, false)}
          </div>

          {/* Visual Divider */}
          {p2Sections.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", width: "794px", userSelect: "none" }}>
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, #475569, transparent)" }} />
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "2px", background: "#0f172a", padding: "5px 16px", borderRadius: "9999px", border: "1px solid #334155" }}>📄 PAGE BREAK · END OF PAGE 1</span>
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, #475569, transparent)" }} />
            </div>
          )}

          {/* Page 2 */}
          {p2Sections.length > 0 && (
            <div className="resume-page-sheet resume-document-light" style={{ width: "794px", height: "1123px", backgroundColor: "#fff", boxShadow: "0 14px 40px rgba(0,0,0,0.35)", borderRadius: "4px", padding: "40px 52px", display: "flex", flexDirection: "column", gap: fontCfg.sectionGap, boxSizing: "border-box", fontFamily: "Georgia, serif", textAlign: "left" }}>
              {renderAtsContent(p2Sections, p2Map, true)}
            </div>
          )}
        </div>
      );
    }

    // ─── TEMPLATE 3: CREATIVE (Executive Modern Header, Card Layout) ───
    const { p1Sections, p2Sections } = getPartitionedSections(false);

    const renderCreativeContent = (sectionsToRender: string[]) => {
      return sectionsToRender.map((section) => {
        const secData = resumeData[section];
        if (!secData || !secData.visible) return null;
        if (section === "mediaHandles") return null;

        const hasContent = section === "summary" ? !!secData.content : secData.items?.some((i: any) => i.visible);
        if (!hasContent) return null;

        const itemsToRender = secData.items?.filter((i: any) => i.visible) || [];
        const headingTitle = headings[section] || section;

        return (
          <div key={section} className="print-avoid-break" style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: fontCfg.sectionGap }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "4px", height: "15px", backgroundColor: accentColor, borderRadius: "2px" }} />
              <h3 style={{ fontSize: fontCfg.headingFont, fontWeight: 900, textTransform: "uppercase", letterSpacing: "1.5px", color: accentColor, margin: 0 }}>
                {headingTitle}
              </h3>
              <div style={{ flex: 1, height: "1px", backgroundColor: `${accentColor}20` }} />
            </div>

            {section === "summary" && (
              <p style={{ fontSize: fontCfg.bodyFont, color: "#0f172a", lineHeight: fontCfg.lineHeight, margin: 0, paddingLeft: "12px" }}>{secData.content}</p>
            )}

            {section === "experience" && (
              <div style={{ display: "flex", flexDirection: "column", gap: fontCfg.gap }}>
                {itemsToRender.map((item: any) => (
                  <div key={item.id} className="resume-module-card print-avoid-break" style={{ padding: fontCfg.cardPadding, border: "1px solid #e2e8f0", borderLeft: `4px solid ${accentColor}`, backgroundColor: "#f8fafc", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: `calc(${fontCfg.bodyFont} + 1px)`, fontWeight: "bold", color: "#0f172a" }}>{item.role}</span>
                      <span style={{ fontSize: fontCfg.smallFont, fontFamily: "monospace", color: "#475569" }}>{item.duration}</span>
                    </div>
                    <span style={{ fontSize: fontCfg.bodyFont, fontWeight: "700", color: accentColor }}>{item.company}</span>
                    <p style={{ fontSize: fontCfg.bodyFont, color: "#334155", lineHeight: fontCfg.lineHeight, margin: "4px 0 0 0", whiteSpace: "pre-wrap" }}>{item.responsibilities}</p>
                    {item.technologies && <div style={{ fontSize: fontCfg.smallFont, fontFamily: "monospace", color: "#475569", marginTop: "4px" }}>Stack: {item.technologies}</div>}
                  </div>
                ))}
              </div>
            )}

            {section === "education" && (
              <div style={{ display: "flex", flexDirection: "column", gap: fontCfg.gap }}>
                {itemsToRender.map((item: any) => (
                  <div key={item.id} className="resume-module-card print-avoid-break" style={{ padding: fontCfg.cardPadding, border: "1px solid #e2e8f0", borderLeft: `4px solid ${accentColor}`, backgroundColor: "#f8fafc", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ fontSize: `calc(${fontCfg.bodyFont} + 1.5px)`, color: "#0f172a", display: "block" }}>{item.degree}</strong>
                      <span style={{ fontSize: fontCfg.bodyFont, color: "#475569" }}>{item.institution}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: fontCfg.smallFont, fontFamily: "monospace", color: "#475569", display: "block" }}>{item.duration}</span>
                      {item.grade && <span style={{ fontSize: fontCfg.bodyFont, fontWeight: "bold", color: accentColor }}>CGPA / Grade: {item.grade}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {section === "projects" && (
              <div style={{ display: "flex", flexDirection: "column", gap: fontCfg.gap }}>
                {itemsToRender.map((item: any) => (
                  <div key={item.id} className="resume-module-card print-avoid-break" style={{ padding: fontCfg.cardPadding, border: "1px solid #e2e8f0", borderLeft: `4px solid ${accentColor}`, backgroundColor: "#f8fafc", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: `calc(${fontCfg.bodyFont} + 1px)`, color: "#0f172a" }}>{item.name}</strong>
                      <div style={{ display: "flex", gap: "10px" }}>
                        {item.github && <span style={{ fontSize: fontCfg.smallFont, fontWeight: 600, color: accentColor }}>Repo</span>}
                        {item.live && <span style={{ fontSize: fontCfg.smallFont, fontWeight: 600, color: accentColor }}>Live</span>}
                      </div>
                    </div>
                    <p style={{ fontSize: fontCfg.bodyFont, color: "#334155", lineHeight: fontCfg.lineHeight, margin: "3px 0 0 0" }}>{item.description}</p>
                    {item.technologies && <div style={{ fontSize: fontCfg.smallFont, fontFamily: "monospace", color: "#475569", marginTop: "4px" }}>Tech: {item.technologies}</div>}
                  </div>
                ))}
              </div>
            )}

            {section === "skills" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", paddingLeft: "10px" }}>
                {itemsToRender.map((skill: any) => {
                  const isHigh = skill.level === "Expert" || skill.level === "Advanced";
                  return (
                    <span key={skill.id} style={{ fontSize: fontCfg.smallFont, fontWeight: "bold", padding: "4px 9px", borderRadius: "6px", backgroundColor: isHigh ? `${accentColor}18` : "#f1f5f9", color: isHigh ? accentColor : "#334155", border: `1px solid ${isHigh ? `${accentColor}30` : "#e2e8f0"}` }}>
                      {skill.name} <span style={{ fontSize: "8px", opacity: 0.75 }}>({skill.level})</span>
                    </span>
                  );
                })}
              </div>
            )}

            {section === "certifications" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {itemsToRender.map((cert: any) => (
                  <div key={cert.id} style={{ padding: fontCfg.cardPadding, border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ fontSize: fontCfg.bodyFont, color: "#0f172a", display: "block" }}>{cert.name}</strong>
                      <span style={{ fontSize: fontCfg.smallFont, color: "#475569" }}>{cert.issuer}</span>
                    </div>
                    <span style={{ fontSize: fontCfg.smallFont, fontFamily: "monospace", color: "#475569" }}>{cert.date}</span>
                  </div>
                ))}
              </div>
            )}

            {section === "achievements" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "10px" }}>
                {itemsToRender.map((ach: any) => (
                  <div key={ach.id} style={{ fontSize: fontCfg.bodyFont, color: "#0f172a", borderLeft: `2px solid ${accentColor}40`, paddingLeft: "6px" }}>
                    <strong style={{ color: "#0f172a" }}>{ach.title}</strong> {ach.date && `(${ach.date})`}
                    {ach.description && <div style={{ fontSize: fontCfg.smallFont, color: "#334155", marginTop: "1px" }}>{ach.description}</div>}
                  </div>
                ))}
              </div>
            )}

            {section === "testScores" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {itemsToRender.map((item: any) => (
                  <div key={item.id} style={{ padding: fontCfg.cardPadding, borderRadius: "8px", border: `1px solid ${accentColor}30`, background: `${accentColor}08` }}>
                    <div style={{ fontSize: fontCfg.bodyFont, fontWeight: 700, color: "#0f172a" }}>{item.title}</div>
                    <div style={{ fontSize: `calc(${fontCfg.bodyFont} + 1px)`, fontFamily: "monospace", fontWeight: 800, color: accentColor, marginTop: "2px" }}>{item.score}</div>
                    {item.institution && <div style={{ fontSize: fontCfg.smallFont, color: "#475569", marginTop: "1px" }}>{item.institution}</div>}
                  </div>
                ))}
              </div>
            )}

            {section === "patents" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", paddingLeft: "10px" }}>
                {itemsToRender.map((pat: any) => (
                  <div key={pat.id} style={{ fontSize: fontCfg.bodyFont, color: "#0f172a" }}>
                    📜 <strong>{pat.title}</strong> (No: {pat.number})
                  </div>
                ))}
              </div>
            )}

            {section === "languages" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", paddingLeft: "10px" }}>
                {itemsToRender.map((l: any) => (
                  <span key={l.name} style={{ fontSize: fontCfg.smallFont, padding: "3px 8px", backgroundColor: "#f1f5f9", borderRadius: "5px", color: "#334155", fontWeight: 600 }}>
                    {l.name} <span style={{ fontSize: "8px", opacity: 0.75 }}>({l.level})</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      });
    };

    return (
      <div id={isModal ? "resume-preview-container-modal" : "resume-preview-container"} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "32px", width: "794px" }}>
        {/* Page 1 */}
        <div className="resume-page-sheet resume-document-light" style={{ width: "794px", height: "1123px", backgroundColor: "#fff", boxShadow: "0 14px 40px rgba(0,0,0,0.35)", borderRadius: "4px", padding: "30px", display: "flex", flexDirection: "column", gap: fontCfg.sectionGap, boxSizing: "border-box", fontFamily: "'Inter',sans-serif", textAlign: "left" }}>
          {/* Header Banner */}
          <div style={{ background: `linear-gradient(135deg, ${accentColor}, #0f172a)`, borderRadius: "14px", padding: "24px", color: "#ffffff", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "0 6px 20px -4px rgba(0,0,0,0.12)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <div>
                <h2 style={{ fontSize: fontCfg.titleFont, fontWeight: 900, textTransform: "uppercase", letterSpacing: "1.5px", color: "#ffffff", margin: 0 }}>
                  {pInfo.fullName || "Your Name"}
                </h2>
                <p style={{ fontSize: fontCfg.bodyFont, fontFamily: "Inter, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "rgba(255,255,255,0.92)", marginTop: "6px", margin: 0 }}>
                  {pInfo.title || "Creative Professional"}
                </p>
              </div>

              {pInfo.showPhoto && pInfo.profileImageUrl && (() => {
                const img = parseImageAdjustments(pInfo.profileImageUrl);
                return (
                  <div style={{ width: "75px", height: "75px", borderRadius: "12px", overflow: "hidden", border: "2px solid rgba(255,255,255,0.3)", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={img.src} style={{ ...img.style, width: "100%", height: "100%" }} alt={pInfo.fullName} />
                  </div>
                );
              })()}
            </div>

            <div style={{ height: "1px", background: "rgba(255,255,255,0.2)" }} />

            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", fontSize: fontCfg.bodyFont, color: "rgba(255,255,255,0.95)" }}>
              {pInfo.email && <span style={{ background: "rgba(255,255,255,0.1)", padding: "3px 8px", borderRadius: "6px" }}>✉ {pInfo.email}</span>}
              {pInfo.phone && <span style={{ background: "rgba(255,255,255,0.1)", padding: "3px 8px", borderRadius: "6px" }}>📞 {pInfo.phone}</span>}
              {pInfo.address && <span style={{ background: "rgba(255,255,255,0.1)", padding: "3px 8px", borderRadius: "6px" }}>📍 {pInfo.address}</span>}
            </div>

            {resumeData.mediaHandles?.visible && resumeData.mediaHandles?.items?.some((h: any) => h.visible && h.url) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", fontSize: fontCfg.smallFont }}>
                {resumeData.mediaHandles.items.filter((h: any) => h.visible && h.url).map((h: any) => (
                  <span key={h.platform} style={{ color: "#ffffff", background: "rgba(255,255,255,0.15)", padding: "3px 8px", borderRadius: "6px", fontWeight: "bold" }}>
                    {h.platform}: {h.url}
                  </span>
                ))}
              </div>
            )}
          </div>
          {renderCreativeContent(p1Sections)}
        </div>

        {/* Visual Divider */}
        {p2Sections.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", width: "794px", userSelect: "none" }}>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, #475569, transparent)" }} />
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "2px", background: "#0f172a", padding: "5px 16px", borderRadius: "9999px", border: "1px solid #334155" }}>📄 PAGE BREAK · END OF PAGE 1</span>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, #475569, transparent)" }} />
          </div>
        )}

        {/* Page 2 */}
        {p2Sections.length > 0 && (
          <div className="resume-page-sheet resume-document-light" style={{ width: "794px", height: "1123px", backgroundColor: "#fff", boxShadow: "0 14px 40px rgba(0,0,0,0.35)", borderRadius: "4px", padding: "30px", display: "flex", flexDirection: "column", gap: fontCfg.sectionGap, boxSizing: "border-box", fontFamily: "'Inter',sans-serif", textAlign: "left" }}>
            {renderCreativeContent(p2Sections)}
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
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#09090d] text-white relative">
      <style dangerouslySetInnerHTML={{ __html: `
        /* Editor sidebar legibility & high contrast overrides */
        .resume-editor-sidebar label {
          color: #f8fafc !important; /* High-contrast Slate 50 for labels */
          opacity: 1 !important;
          font-weight: 650 !important;
        }
        .resume-editor-sidebar .text-slate-400 {
          color: #cbd5e1 !important; /* Bright Slate 300 for section captions/sub-labels */
        }
        .resume-editor-sidebar .opacity-60 {
          opacity: 0.90 !important; /* Increase opacity on list item sub-labels */
        }
        .resume-editor-sidebar select {
          color: #ffffff !important;
          background-color: #0f172a !important;
        }
        .resume-editor-sidebar input, .resume-editor-sidebar textarea {
          border-color: #475569 !important; /* Slate 600 borders for visible bounds */
        }
        .resume-editor-sidebar input:focus, .resume-editor-sidebar textarea:focus {
          border-color: #781c1c !important;
        }
        
        /* Preview top bar / Zoom legibility & high contrast overrides */
        .preview-top-bar {
          color: #ffffff !important;
        }
        .preview-top-bar .text-slate-400 {
          color: #cbd5e1 !important; /* Bright zoom text & controls */
        }
        .preview-top-bar strong {
          color: #ffffff !important;
        }

        /* Ensure Resume Document is ALWAYS rendered in light mode regardless of global theme mode */
        #resume-preview-container,
        #resume-preview-container-modal,
        .resume-document-light,
        html.dark #resume-preview-container,
        html.dark #resume-preview-container-modal,
        html.dark .resume-document-light {
          background-color: #ffffff !important;
          color: #0f172a !important;
          position: relative !important;
          background-image: linear-gradient(to bottom, transparent 1121px, #cbd5e1 1121px, #94a3b8 1123px, #cbd5e1 1125px, transparent 1125px) !important;
          background-size: 100% 1123px !important;
        }

        .resume-module-card, .print-avoid-break {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          -webkit-column-break-inside: avoid !important;
        }

        #resume-preview-container h1,
        #resume-preview-container h2,
        #resume-preview-container h3,
        #resume-preview-container h4,
        #resume-preview-container h5,
        #resume-preview-container h6,
        #resume-preview-container-modal h1,
        #resume-preview-container-modal h2,
        #resume-preview-container-modal h3,
        #resume-preview-container-modal h4,
        #resume-preview-container-modal h5,
        #resume-preview-container-modal h6,
        .resume-document-light h1,
        .resume-document-light h2,
        .resume-document-light h3,
        .resume-document-light h4,
        .resume-document-light h5,
        .resume-document-light h6,
        html.dark #resume-preview-container h1,
        html.dark #resume-preview-container h2,
        html.dark #resume-preview-container h3,
        html.dark #resume-preview-container h4,
        html.dark #resume-preview-container h5,
        html.dark #resume-preview-container h6,
        html.dark #resume-preview-container-modal h1,
        html.dark #resume-preview-container-modal h2,
        html.dark #resume-preview-container-modal h3,
        html.dark #resume-preview-container-modal h4,
        html.dark #resume-preview-container-modal h5,
        html.dark #resume-preview-container-modal h6,
        html.dark .resume-document-light h1,
        html.dark .resume-document-light h2,
        html.dark .resume-document-light h3,
        html.dark .resume-document-light h4,
        html.dark .resume-document-light h5,
        html.dark .resume-document-light h6 {
          color: inherit !important;
        }

        #resume-preview-container p,
        #resume-preview-container span,
        #resume-preview-container div,
        #resume-preview-container li,
        #resume-preview-container a,
        #resume-preview-container-modal p,
        #resume-preview-container-modal span,
        #resume-preview-container-modal div,
        #resume-preview-container-modal li,
        #resume-preview-container-modal a,
        .resume-document-light p,
        .resume-document-light span,
        .resume-document-light div,
        .resume-document-light li,
        .resume-document-light a,
        html.dark #resume-preview-container p,
        html.dark #resume-preview-container span,
        html.dark #resume-preview-container div,
        html.dark #resume-preview-container li,
        html.dark #resume-preview-container a,
        html.dark #resume-preview-container-modal p,
        html.dark #resume-preview-container-modal span,
        html.dark #resume-preview-container-modal div,
        html.dark #resume-preview-container-modal li,
        html.dark #resume-preview-container-modal a,
        html.dark .resume-document-light p,
        html.dark .resume-document-light span,
        html.dark .resume-document-light div,
        html.dark .resume-document-light li,
        html.dark .resume-document-light a {
          color: inherit;
        }
      `}} />
      
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
      <div className={`resume-editor-sidebar w-full md:w-[460px] lg:w-[480px] md:shrink-0 flex flex-col h-full transition-colors duration-300 ${
        isDark
          ? "bg-[#0b0f18] text-white shadow-[2px_0_24px_0_rgba(0,0,0,0.55)]"
          : "bg-slate-50 text-slate-900 shadow-[2px_0_16px_0_rgba(15,23,42,0.08)]"
      } ${mobileTab === "edit" ? "flex" : "hidden md:flex"}`}>
        
        {/* Editor Top Bar */}
        <div className={`px-3 pt-3 pb-2 flex items-center gap-2 shrink-0 ${
          isDark ? "bg-[#080c15]" : "bg-white"
        }`}>
          {/* Back button */}
          <button
            onClick={() => router.push("/dashboard/resumes")}
            className={`p-2 rounded-xl transition cursor-pointer shrink-0 ${
              isDark
                ? "bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
            }`}
            title="Back to Resumes"
          >
            <ArrowLeft size={15} />
          </button>

          {/* Resume name input */}
          <input
            type="text"
            value={resumeTitle}
            onChange={(e) => setResumeTitle(e.target.value)}
            className={`flex-1 min-w-0 rounded-xl px-3 py-1.5 text-[11px] outline-none font-black border-0 ring-1 focus:ring-2 focus:ring-[#781c1c]/70 transition-all ${
              isDark
                ? "bg-slate-800/60 ring-slate-700/60 text-white placeholder-slate-500"
                : "bg-slate-100 ring-slate-200 text-slate-900 placeholder-slate-400"
            }`}
            placeholder="Resume Name"
          />

          {/* Action buttons pill group */}
          <div className={`flex items-center rounded-xl overflow-hidden shrink-0 ${
            isDark ? "bg-slate-800/70 ring-1 ring-slate-700/60" : "bg-slate-100 ring-1 ring-slate-200"
          }`}>
            <button
              onClick={toggleThemeMode}
              className={`p-2 transition cursor-pointer ${
                isDark ? "text-amber-300 hover:bg-slate-700" : "text-slate-500 hover:bg-slate-200"
              }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun size={13} /> : <Moon size={13} />}
            </button>
            <button
              onClick={handleSyncFromPortfolio}
              className={`p-2 transition cursor-pointer ${
                isDark ? "text-emerald-300 hover:bg-slate-700" : "text-emerald-600 hover:bg-slate-200"
              }`}
              title="Sync latest from Portfolio"
            >
              <RefreshCw size={13} />
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className={`p-2 transition cursor-pointer disabled:opacity-40 ${
                isDark ? "text-indigo-300 hover:bg-slate-700" : "text-indigo-600 hover:bg-slate-200"
              }`}
              title={downloading ? "Generating PDF..." : "Download PDF"}
            >
              {downloading ? <span className="text-[9px] font-mono font-bold px-1">...</span> : <Download size={13} />}
            </button>
          </div>

          {/* Save button — standalone accent */}
          <button
            onClick={handleSaveResume}
            disabled={saving}
            className="p-2 rounded-xl bg-[#781c1c] hover:bg-[#5f1515] active:scale-95 transition-all text-white cursor-pointer disabled:opacity-50 shadow-lg shadow-red-900/30 shrink-0"
            title="Save Resume Draft"
          >
            <Save size={13} />
          </button>
        </div>

        {/* Tab Headers — Pill Chips */}
        <div className={`px-3 pt-2 pb-2.5 shrink-0 ${
          isDark ? "bg-[#080c15]" : "bg-white"
        }`}>
          <div className={`flex gap-1 overflow-x-auto scrollbar-none whitespace-nowrap pb-0.5`}>
            {["theme", "profile", "summary", "experience", "education", "projects", "skills", "others"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-black cursor-pointer transition-all shrink-0 ${
                  activeTab === tab
                    ? "bg-[#781c1c] text-white shadow-md shadow-red-900/30"
                    : isDark
                      ? "bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80"
                      : "bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        {/* Thin divider under tabs */}
        <div className={`h-px mx-3 mb-1 shrink-0 rounded-full ${
          isDark ? "bg-slate-800" : "bg-slate-200"
        }`} />

        {/* Tab Body Contents */}
        <div className="flex-1 overflow-y-auto px-3 pt-2 pb-6 space-y-4 scrollbar-thin">
          
          {/* Warning banner for missing marksheets */}
          {missingSheets.length > 0 && (
            <div className={`rounded-2xl p-3.5 flex gap-3 text-xs leading-relaxed ${
              isDark
                ? "bg-amber-500/10 border border-amber-500/25 text-amber-300"
                : "bg-amber-50 border border-amber-200 text-amber-800"
            }`}>
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-0.5 font-black text-[11px]">Portfolio Completion Alert</strong>
                <span className="font-semibold leading-relaxed">Missing marksheets: <span className="font-black">{missingSheets.join(", ")}</span>. Add under Academic portfolio.</span>
              </div>
            </div>
          )}

          {/* TAB 1: THEME & COLOR */}
          {activeTab === "theme" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className={`text-[9.5px] font-mono uppercase tracking-widest block font-black ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}>Resume Template</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "Professional", name: "Professional", desc: "Two-Column" },
                    { id: "Classic ATS", name: "Classic ATS", desc: "B&W ATS" },
                    { id: "Creative", name: "Creative", desc: "Vibrant" }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTheme(t.id)}
                      className={`rounded-2xl p-3 text-left transition-all cursor-pointer ${
                        selectedTheme === t.id
                          ? isDark
                            ? "bg-[#781c1c]/25 ring-1 ring-[#781c1c] text-white"
                            : "bg-[#781c1c]/8 ring-1 ring-[#781c1c] text-[#781c1c]"
                          : isDark
                            ? "bg-slate-800/60 text-slate-300 hover:bg-slate-700/70 hover:text-white"
                            : "bg-white text-slate-600 hover:bg-slate-50 ring-1 ring-slate-200 hover:ring-slate-300"
                      }`}
                    >
                      <strong className="block text-[11px] font-black">{t.name}</strong>
                      <span className={`text-[9px] mt-0.5 block font-semibold ${
                        isDark ? "text-slate-400" : "text-slate-400"
                      }`}>{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              {selectedTheme !== "Classic ATS" && (
                <div className="space-y-2">
                  <label className={`text-[9.5px] font-mono uppercase tracking-widest block font-black ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}>Accent Color</label>
                  <div className={`flex gap-3 items-center p-3 rounded-2xl ${
                    isDark ? "bg-slate-800/60" : "bg-white ring-1 ring-slate-200"
                  }`}>
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-9 h-9 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                    />
                    <div>
                      <span className={`text-xs font-mono font-black block ${
                        isDark ? "text-white" : "text-slate-800"
                      }`}>{accentColor}</span>
                      <span className={`text-[10px] ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}>Sidebar titles, lines & tags</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Font Size Option Picker */}
              <div className="space-y-2">
                <label className={`text-[9.5px] font-mono uppercase tracking-widest block font-black ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}>Font Size</label>
                <div className={`grid grid-cols-4 gap-1.5 p-1.5 rounded-2xl ${
                  isDark ? "bg-slate-800/40" : "bg-slate-100"
                }`}>
                  {[
                    { id: "Small", label: "Sm", detail: "10px" },
                    { id: "Medium", label: "Md", detail: "11px" },
                    { id: "Large", label: "Lg", detail: "12px" },
                    { id: "XL", label: "XL", detail: "13px" }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFontSizeLevel(f.id)}
                      className={`py-2 rounded-xl text-center transition-all cursor-pointer ${
                        fontSizeLevel === f.id
                          ? "bg-[#781c1c] text-white shadow-md shadow-red-900/30"
                          : isDark
                            ? "text-slate-400 hover:text-white hover:bg-slate-700/70"
                            : "text-slate-500 hover:text-slate-800 hover:bg-white"
                      }`}
                    >
                      <div className="text-[11px] font-black">{f.label}</div>
                      <div className={`text-[8.5px] font-semibold ${
                        fontSizeLevel === f.id ? "text-red-200" : isDark ? "text-slate-500" : "text-slate-400"
                      }`}>{f.detail}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sections Reordering */}
              <div className="space-y-2">
                <label className={`text-[9.5px] font-mono uppercase tracking-widest block font-black ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}>Section Order & Headings</label>
                <div className={`space-y-1.5 p-2 rounded-2xl ${
                  isDark ? "bg-slate-800/40" : "bg-slate-100/80"
                }`}>
                  {sectionOrder.map((section, idx) => (
                    <div key={section} className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs ${
                      isDark
                        ? "bg-slate-800/80 text-white hover:bg-slate-700/80 transition-colors"
                        : "bg-white text-slate-900 shadow-sm hover:shadow-md transition-shadow"
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono opacity-80 font-black">#{idx + 1}</span>
                        <input
                          type="text"
                          value={headings[section]}
                          onChange={(e) => setHeadings({ ...headings, [section]: e.target.value })}
                          className={`bg-transparent border-none outline-none font-black text-xs w-36 focus:underline ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        />
                      </div>
                      
                      <div className="flex gap-1 items-center">
                        <button
                          onClick={() => moveSection(idx, "up")}
                          disabled={idx === 0}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 dark:text-slate-200 disabled:opacity-20 cursor-pointer"
                          title="Move Up"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => moveSection(idx, "down")}
                          disabled={idx === sectionOrder.length - 1}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 dark:text-slate-200 disabled:opacity-20 cursor-pointer"
                          title="Move Down"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          onClick={() => removeSection(section)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-950 text-red-600 dark:text-red-400 rounded-lg cursor-pointer"
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
                      <div className={`pt-2 mt-1 border-t ${
                        isDark ? "border-slate-700/50" : "border-slate-200"
                      }`}>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              addSection(e.target.value);
                              e.target.value = "";
                            }
                          }}
                          className={`w-full rounded-xl px-3 py-1.5 text-[11px] font-bold outline-none focus:ring-1 focus:ring-[#781c1c] cursor-pointer border-0 ${
                            isDark ? "bg-slate-800/80 text-slate-200" : "bg-white text-slate-700 ring-1 ring-slate-200"
                          }`}
                          defaultValue=""
                        >
                          <option value="" disabled>＋ Add removed section...</option>
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
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className={`text-[9.5px] font-mono uppercase tracking-widest font-black ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}>Full Name</label>
                  <input
                    type="text"
                    value={pInfo.fullName}
                    onChange={(e) => updatePersonalInfo("fullName", e.target.value)}
                    className={`rounded-xl px-3 py-2 text-[11px] outline-none focus:ring-2 focus:ring-[#781c1c]/50 font-bold border-0 ring-1 transition-all ${
                      isDark ? "bg-slate-800/60 ring-slate-700/60 text-white placeholder-slate-500" : "bg-white ring-slate-200 text-slate-900"
                    }`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={`text-[9.5px] font-mono uppercase tracking-widest font-black ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}>Job Title</label>
                  <input
                    type="text"
                    value={pInfo.title}
                    onChange={(e) => updatePersonalInfo("title", e.target.value)}
                    className={`rounded-xl px-3 py-2 text-[11px] outline-none focus:ring-2 focus:ring-[#781c1c]/50 font-bold border-0 ring-1 transition-all ${
                      isDark ? "bg-slate-800/60 ring-slate-700/60 text-white placeholder-slate-500" : "bg-white ring-slate-200 text-slate-900"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className={`text-[9.5px] font-mono uppercase tracking-widest font-black ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}>Email</label>
                  <input
                    type="email"
                    value={pInfo.email}
                    onChange={(e) => updatePersonalInfo("email", e.target.value)}
                    className={`rounded-xl px-3 py-2 text-[11px] outline-none focus:ring-2 focus:ring-[#781c1c]/50 font-bold border-0 ring-1 transition-all ${
                      isDark ? "bg-slate-800/60 ring-slate-700/60 text-white placeholder-slate-500" : "bg-white ring-slate-200 text-slate-900"
                    }`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={`text-[9.5px] font-mono uppercase tracking-widest font-black ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}>Phone</label>
                  <input
                    type="text"
                    value={pInfo.phone}
                    onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                    className={`rounded-xl px-3 py-2 text-[11px] outline-none focus:ring-2 focus:ring-[#781c1c]/50 font-bold border-0 ring-1 transition-all ${
                      isDark ? "bg-slate-800/60 ring-slate-700/60 text-white placeholder-slate-500" : "bg-white ring-slate-200 text-slate-900"
                    }`}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className={`text-[9.5px] font-mono uppercase tracking-widest font-black ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}>Location</label>
                <input
                  type="text"
                  value={pInfo.address}
                  onChange={(e) => updatePersonalInfo("address", e.target.value)}
                  className={`rounded-xl px-3 py-2 text-[11px] outline-none focus:ring-2 focus:ring-[#781c1c]/50 font-bold border-0 ring-1 transition-all ${
                    isDark ? "bg-slate-800/60 ring-slate-700/60 text-white placeholder-slate-500" : "bg-white ring-slate-200 text-slate-900"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className={`text-[9.5px] font-mono uppercase tracking-widest font-black ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}>LinkedIn</label>
                  <input
                    type="text"
                    value={pInfo.linkedin}
                    onChange={(e) => updatePersonalInfo("linkedin", e.target.value)}
                    className={`rounded-xl px-3 py-2 text-[11px] outline-none focus:ring-2 focus:ring-[#781c1c]/50 font-bold border-0 ring-1 transition-all ${
                      isDark ? "bg-slate-800/60 ring-slate-700/60 text-white placeholder-slate-500" : "bg-white ring-slate-200 text-slate-900"
                    }`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={`text-[9.5px] font-mono uppercase tracking-widest font-black ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}>GitHub</label>
                  <input
                    type="text"
                    value={pInfo.github}
                    onChange={(e) => updatePersonalInfo("github", e.target.value)}
                    className={`rounded-xl px-3 py-2 text-[11px] outline-none focus:ring-2 focus:ring-[#781c1c]/50 font-bold border-0 ring-1 transition-all ${
                      isDark ? "bg-slate-800/60 ring-slate-700/60 text-white placeholder-slate-500" : "bg-white ring-slate-200 text-slate-900"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className={`text-[9.5px] font-mono uppercase tracking-widest font-black ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}>Portfolio</label>
                  <input
                    type="text"
                    value={pInfo.portfolio || ""}
                    onChange={(e) => updatePersonalInfo("portfolio", e.target.value)}
                    className={`rounded-xl px-2.5 py-2 text-[10px] outline-none focus:ring-2 focus:ring-[#781c1c]/50 font-bold border-0 ring-1 transition-all ${
                      isDark ? "bg-slate-800/60 ring-slate-700/60 text-white placeholder-slate-500" : "bg-white ring-slate-200 text-slate-900"
                    }`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={`text-[9.5px] font-mono uppercase tracking-widest font-black ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}>Behance</label>
                  <input
                    type="text"
                    value={pInfo.behance || ""}
                    onChange={(e) => updatePersonalInfo("behance", e.target.value)}
                    className={`rounded-xl px-2.5 py-2 text-[10px] outline-none focus:ring-2 focus:ring-[#781c1c]/50 font-bold border-0 ring-1 transition-all ${
                      isDark ? "bg-slate-800/60 ring-slate-700/60 text-white placeholder-slate-500" : "bg-white ring-slate-200 text-slate-900"
                    }`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={`text-[9.5px] font-mono uppercase tracking-widest font-black ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}>Instagram</label>
                  <input
                    type="text"
                    value={pInfo.instagram || ""}
                    onChange={(e) => updatePersonalInfo("instagram", e.target.value)}
                    className={`rounded-xl px-2.5 py-2 text-[10px] outline-none focus:ring-2 focus:ring-[#781c1c]/50 font-bold border-0 ring-1 transition-all ${
                      isDark ? "bg-slate-800/60 ring-slate-700/60 text-white placeholder-slate-500" : "bg-white ring-slate-200 text-slate-900"
                    }`}
                  />
                </div>
              </div>

              {selectedTheme !== "Classic ATS" && (
                <div className={`flex items-center gap-3 p-3 rounded-2xl ${
                  isDark ? "bg-slate-800/50" : "bg-white ring-1 ring-slate-200"
                }`}>
                  <input
                    type="checkbox"
                    checked={pInfo.showPhoto}
                    onChange={(e) => updatePersonalInfo("showPhoto", e.target.checked)}
                    id="show-photo-checkbox"
                    className="w-4 h-4 cursor-pointer rounded accent-[#781c1c]"
                  />
                  <label htmlFor="show-photo-checkbox" className={`text-[11px] cursor-pointer select-none font-bold ${
                    isDark ? "text-slate-200" : "text-slate-700"
                  }`}>
                    Show Profile Photo in Resume
                  </label>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROFESSIONAL SUMMARY */}
          {activeTab === "summary" && (
            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-3 rounded-2xl ${
                isDark ? "bg-slate-800/50" : "bg-white ring-1 ring-slate-200"
              }`}>
                <input
                  type="checkbox"
                  checked={resumeData.summary.visible}
                  id="summary-visible"
                  onChange={(e) => setResumeData({
                    ...resumeData,
                    summary: { ...resumeData.summary, visible: e.target.checked }
                  })}
                  className="w-4 h-4 rounded accent-[#781c1c] cursor-pointer"
                />
                <label htmlFor="summary-visible" className={`text-[11px] cursor-pointer select-none font-bold ${
                  isDark ? "text-slate-200" : "text-slate-700"
                }`}>Show Professional Summary</label>
              </div>

              {resumeData.summary.visible && (
                <div className="flex flex-col gap-1.5">
                  <label className={`text-[9.5px] font-mono uppercase tracking-widest font-black ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}>Summary Text</label>
                  <textarea
                    value={resumeData.summary.content}
                    onChange={(e) => updateSummary(e.target.value)}
                    className={`w-full min-h-[160px] rounded-2xl p-3.5 text-[11px] outline-none focus:ring-2 focus:ring-[#781c1c]/50 font-medium leading-relaxed border-0 ring-1 transition-all resize-none ${
                      isDark ? "bg-slate-800/60 ring-slate-700/60 text-white placeholder-slate-500" : "bg-white ring-slate-200 text-slate-900"
                    }`}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EXPERIENCE */}
          {activeTab === "experience" && (
            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-3 rounded-2xl ${
                isDark ? "bg-slate-800/50" : "bg-white ring-1 ring-slate-200"
              }`}>
                <input
                  type="checkbox"
                  checked={resumeData.experience.visible}
                  id="exp-visible"
                  onChange={(e) => setResumeData({
                    ...resumeData,
                    experience: { ...resumeData.experience, visible: e.target.checked }
                  })}
                  className="w-4 h-4 rounded accent-[#781c1c] cursor-pointer"
                />
                <label htmlFor="exp-visible" className={`text-[11px] cursor-pointer select-none font-bold ${
                  isDark ? "text-slate-200" : "text-slate-700"
                }`}>Show Experience Section</label>
              </div>

              {resumeData.experience.visible && (
                <div className="space-y-1.5">
                  <label className={`text-[9.5px] font-mono uppercase tracking-widest font-black ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}>Entries</label>
                  {resumeData.experience.items.map((item: any, idx: number) => (
                    <div key={item.id} className={`rounded-2xl px-3 py-2.5 flex items-center justify-between ${
                      isDark
                        ? "bg-slate-800/70 hover:bg-slate-700/70 transition-colors"
                        : "bg-white ring-1 ring-slate-200 hover:ring-slate-300 transition-all"
                    }`}>
                      <div className="min-w-0 flex-1 mr-2">
                        <strong className={`block font-black text-[11px] truncate ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}>{item.role}</strong>
                        <span className={`block text-[10px] mt-0.5 font-semibold truncate ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}>{item.company} · {item.duration}</span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => toggleItemVisibility("experience", idx)}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                            item.visible
                              ? isDark ? "text-emerald-400 hover:bg-slate-700" : "text-emerald-600 hover:bg-slate-100"
                              : "text-slate-400 hover:text-slate-600"
                          }`}
                          title={item.visible ? "Hide" : "Show"}
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => moveItem("experience", idx, "up")}
                          disabled={idx === 0}
                          className={`p-1 rounded transition-colors disabled:opacity-20 cursor-pointer ${
                            isDark ? "text-slate-400 hover:bg-slate-700 hover:text-white" : "text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          <ChevronUp size={13} />
                        </button>
                        <button
                          onClick={() => moveItem("experience", idx, "down")}
                          disabled={idx === resumeData.experience.items.length - 1}
                          className={`p-1 rounded transition-colors disabled:opacity-20 cursor-pointer ${
                            isDark ? "text-slate-400 hover:bg-slate-700 hover:text-white" : "text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          <ChevronDown size={13} />
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
            <div className="space-y-3">
              {/* Education section */}
              <div className={`flex items-center gap-3 p-3 rounded-2xl ${
                isDark ? "bg-slate-800/50" : "bg-white ring-1 ring-slate-200"
              }`}>
                <input
                  type="checkbox"
                  checked={resumeData.education.visible}
                  id="edu-visible"
                  onChange={(e) => setResumeData({
                    ...resumeData,
                    education: { ...resumeData.education, visible: e.target.checked }
                  })}
                  className="w-4 h-4 rounded accent-[#781c1c] cursor-pointer"
                />
                <label htmlFor="edu-visible" className={`text-[11px] cursor-pointer select-none font-bold ${
                  isDark ? "text-slate-200" : "text-slate-700"
                }`}>Show Education Section</label>
              </div>

              {resumeData.education.visible && (
                <div className="space-y-1.5">
                  <label className={`text-[9.5px] font-mono uppercase tracking-widest font-black ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}>Entries</label>
                  {resumeData.education.items.map((item: any, idx: number) => (
                    <div key={item.id} className={`rounded-2xl px-3 py-2.5 flex items-center justify-between ${
                      isDark
                        ? "bg-slate-800/70 hover:bg-slate-700/70 transition-colors"
                        : "bg-white ring-1 ring-slate-200 hover:ring-slate-300 transition-all"
                    }`}>
                      <div className="min-w-0 flex-1 mr-2">
                        <strong className={`block font-black text-[11px] truncate ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}>{item.degree}</strong>
                        <span className={`block text-[10px] mt-0.5 font-semibold truncate ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}>{item.institution}</span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => toggleItemVisibility("education", idx)}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                            item.visible
                              ? isDark ? "text-emerald-400 hover:bg-slate-700" : "text-emerald-600 hover:bg-slate-100"
                              : "text-slate-400"
                          }`}
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => moveItem("education", idx, "up")}
                          disabled={idx === 0}
                          className={`p-1 rounded transition-colors disabled:opacity-20 cursor-pointer ${
                            isDark ? "text-slate-400 hover:bg-slate-700 hover:text-white" : "text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          <ChevronUp size={13} />
                        </button>
                        <button
                          onClick={() => moveItem("education", idx, "down")}
                          disabled={idx === resumeData.education.items.length - 1}
                          className={`p-1 rounded transition-colors disabled:opacity-20 cursor-pointer ${
                            isDark ? "text-slate-400 hover:bg-slate-700 hover:text-white" : "text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          <ChevronDown size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Test Scores & Marksheets section */}
              <div className={`pt-3 border-t space-y-3 ${isDark ? "border-slate-700/50" : "border-slate-200"}`}>
                <div className={`flex items-center gap-3 p-3 rounded-2xl ${
                  isDark ? "bg-slate-800/50" : "bg-white ring-1 ring-slate-200"
                }`}>
                  <input
                    type="checkbox"
                    checked={resumeData.testScores.visible}
                    id="scores-visible"
                    onChange={(e) => setResumeData({
                      ...resumeData,
                      testScores: { ...resumeData.testScores, visible: e.target.checked }
                    })}
                    className="w-4 h-4 rounded accent-[#781c1c] cursor-pointer"
                  />
                  <label htmlFor="scores-visible" className={`text-[11px] cursor-pointer select-none font-bold ${
                    isDark ? "text-slate-200" : "text-slate-700"
                  }`}>Show Test Scores Section</label>
                </div>

                {resumeData.testScores.visible && (
                  <div className="space-y-2">
                    <label className={`text-[10px] font-mono uppercase tracking-wider block font-black mb-1 ${isDark ? "text-slate-100" : "text-slate-800"}`}>Standardized Scores & Marksheets</label>
                    {resumeData.testScores.items.map((item: any, idx: number) => (
                      <div key={item.id} className={`border p-3 rounded-2xl flex items-center justify-between text-xs ${
                        isDark ? "bg-slate-850 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}>
                        <div className="flex-1 mr-3">
                          <strong className="block leading-tight font-black">{item.title}</strong>
                          <span className={`block text-[11px] mt-0.5 font-extrabold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{item.score} {item.institution ? `· ${item.institution}` : ""}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => toggleItemHighlight(idx)}
                            className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold cursor-pointer transition ${
                              item.highlighted ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-300"
                            }`}
                            title="Highlight score"
                          >
                            Highlight
                          </button>
                          <button
                            onClick={() => toggleItemVisibility("testScores", idx)}
                            className={`p-1 rounded cursor-pointer ${
                              item.visible ? (isDark ? "text-emerald-400" : "text-emerald-600") : "text-slate-400"
                            }`}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => moveItem("testScores", idx, "up")}
                            disabled={idx === 0}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 dark:text-slate-200 disabled:opacity-20"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            onClick={() => moveItem("testScores", idx, "down")}
                            disabled={idx === resumeData.testScores.items.length - 1}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 dark:text-slate-200 disabled:opacity-20"
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
            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-3 rounded-2xl ${
                isDark ? "bg-slate-800/50" : "bg-white ring-1 ring-slate-200"
              }`}>
                <input
                  type="checkbox"
                  checked={resumeData.projects.visible}
                  id="proj-visible"
                  onChange={(e) => setResumeData({
                    ...resumeData,
                    projects: { ...resumeData.projects, visible: e.target.checked }
                  })}
                  className="w-4 h-4 rounded accent-[#781c1c] cursor-pointer"
                />
                <label htmlFor="proj-visible" className={`text-[11px] cursor-pointer select-none font-bold ${
                  isDark ? "text-slate-200" : "text-slate-700"
                }`}>Show Projects & Publications</label>
              </div>

              {resumeData.projects.visible && (
                <div className="space-y-1.5">
                  <label className={`text-[9.5px] font-mono uppercase tracking-widest font-black ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}>Entries</label>
                  {resumeData.projects.items.map((item: any, idx: number) => (
                    <div key={item.id} className={`rounded-2xl px-3 py-2.5 flex items-center justify-between ${
                      isDark
                        ? "bg-slate-800/70 hover:bg-slate-700/70 transition-colors"
                        : "bg-white ring-1 ring-slate-200 hover:ring-slate-300 transition-all"
                    }`}>
                      <div className="min-w-0 flex-1 mr-2">
                        <strong className={`block font-black text-[11px] truncate ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}>{item.name}</strong>
                        <span className={`block text-[10px] mt-0.5 font-semibold truncate ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}>{item.technologies}</span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => toggleItemVisibility("projects", idx)}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                            item.visible
                              ? isDark ? "text-emerald-400 hover:bg-slate-700" : "text-emerald-600 hover:bg-slate-100"
                              : "text-slate-400"
                          }`}
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => moveItem("projects", idx, "up")}
                          disabled={idx === 0}
                          className={`p-1 rounded transition-colors disabled:opacity-20 cursor-pointer ${
                            isDark ? "text-slate-400 hover:bg-slate-700 hover:text-white" : "text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          <ChevronUp size={13} />
                        </button>
                        <button
                          onClick={() => moveItem("projects", idx, "down")}
                          disabled={idx === resumeData.projects.items.length - 1}
                          className={`p-1 rounded transition-colors disabled:opacity-20 cursor-pointer ${
                            isDark ? "text-slate-400 hover:bg-slate-700 hover:text-white" : "text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          <ChevronDown size={13} />
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
            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-3 rounded-2xl ${
                isDark ? "bg-slate-800/50" : "bg-white ring-1 ring-slate-200"
              }`}>
                <input
                  type="checkbox"
                  checked={resumeData.skills.visible}
                  id="skills-visible"
                  onChange={(e) => setResumeData({
                    ...resumeData,
                    skills: { ...resumeData.skills, visible: e.target.checked }
                  })}
                  className="w-4 h-4 rounded accent-[#781c1c] cursor-pointer"
                />
                <label htmlFor="skills-visible" className={`text-[11px] cursor-pointer select-none font-bold ${
                  isDark ? "text-slate-200" : "text-slate-700"
                }`}>Show Skills Section</label>
              </div>

              {resumeData.skills.visible && (
                <div className="space-y-1.5">
                  <label className={`text-[9.5px] font-mono uppercase tracking-widest font-black ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}>Skills</label>
                  {resumeData.skills.items.map((item: any, idx: number) => (
                    <div key={item.id} className={`rounded-2xl px-3 py-2.5 flex items-center justify-between ${
                      isDark
                        ? "bg-slate-800/70 hover:bg-slate-700/70 transition-colors"
                        : "bg-white ring-1 ring-slate-200 hover:ring-slate-300 transition-all"
                    }`}>
                      <div className="min-w-0 flex-1">
                        <span className={`text-[9px] font-mono uppercase tracking-widest font-black block ${
                          isDark ? "text-slate-500" : "text-slate-400"
                        }`}>{item.category}</span>
                        <strong className={`text-[11px] font-black ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}>{item.name}</strong>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className={`text-[9.5px] font-bold rounded-full px-2 py-0.5 ${
                          isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
                        }`}>{item.level}</span>
                        <button
                          onClick={() => toggleItemVisibility("skills", idx)}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                            item.visible
                              ? isDark ? "text-emerald-400 hover:bg-slate-700" : "text-emerald-600 hover:bg-slate-100"
                              : "text-slate-400"
                          }`}
                        >
                          <Eye size={13} />
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
            <div className="space-y-4">

              {/* Licenses */}
              <div className="space-y-2">
                <div className={`flex items-center gap-3 p-3 rounded-2xl ${
                  isDark ? "bg-slate-800/50" : "bg-white ring-1 ring-slate-200"
                }`}>
                  <input
                    type="checkbox"
                    checked={resumeData.certifications.visible}
                    id="certs-visible"
                    onChange={(e) => setResumeData({
                      ...resumeData,
                      certifications: { ...resumeData.certifications, visible: e.target.checked }
                    })}
                    className="w-4 h-4 rounded accent-[#781c1c] cursor-pointer"
                  />
                  <label htmlFor="certs-visible" className={`text-[11px] cursor-pointer select-none font-bold ${
                    isDark ? "text-slate-200" : "text-slate-700"
                  }`}>Show Licenses & Certifications</label>
                </div>
                {resumeData.certifications.visible && (
                  <div className="space-y-1">
                    {resumeData.certifications.items.map((item: any, idx: number) => (
                      <div key={item.id} className={`rounded-xl px-3 py-2 flex items-center justify-between ${
                        isDark ? "bg-slate-800/70" : "bg-white ring-1 ring-slate-200"
                      }`}>
                        <span className={`text-[11px] truncate max-w-[200px] font-semibold ${
                          isDark ? "text-slate-200" : "text-slate-800"
                        }`}>{item.name}</span>
                        <button
                          onClick={() => toggleItemVisibility("certifications", idx)}
                          className={`p-1 rounded cursor-pointer transition-colors ${
                            item.visible ? (isDark ? "text-emerald-400" : "text-emerald-600") : "text-slate-400"
                          }`}
                        >
                          <Eye size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Achievements */}
              <div className="space-y-2">
                <div className={`flex items-center gap-3 p-3 rounded-2xl ${
                  isDark ? "bg-slate-800/50" : "bg-white ring-1 ring-slate-200"
                }`}>
                  <input
                    type="checkbox"
                    checked={resumeData.achievements.visible}
                    id="ach-visible"
                    onChange={(e) => setResumeData({
                      ...resumeData,
                      achievements: { ...resumeData.achievements, visible: e.target.checked }
                    })}
                    className="w-4 h-4 rounded accent-[#781c1c] cursor-pointer"
                  />
                  <label htmlFor="ach-visible" className={`text-[11px] cursor-pointer select-none font-bold ${
                    isDark ? "text-slate-200" : "text-slate-700"
                  }`}>Show Achievements</label>
                </div>
                {resumeData.achievements.visible && (
                  <div className="space-y-1">
                    {resumeData.achievements.items.map((item: any, idx: number) => (
                      <div key={item.id} className={`rounded-xl px-3 py-2 flex items-center justify-between ${
                        isDark ? "bg-slate-800/70" : "bg-white ring-1 ring-slate-200"
                      }`}>
                        <span className={`text-[11px] truncate max-w-[200px] font-semibold ${
                          isDark ? "text-slate-200" : "text-slate-800"
                        }`}>{item.title}</span>
                        <button
                          onClick={() => toggleItemVisibility("achievements", idx)}
                          className={`p-1 rounded cursor-pointer transition-colors ${
                            item.visible ? (isDark ? "text-emerald-400" : "text-emerald-600") : "text-slate-400"
                          }`}
                        >
                          <Eye size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Languages */}
              <div className="space-y-2">
                <div className={`flex items-center gap-3 p-3 rounded-2xl ${
                  isDark ? "bg-slate-800/50" : "bg-white ring-1 ring-slate-200"
                }`}>
                  <input
                    type="checkbox"
                    checked={resumeData.languages.visible}
                    id="lang-visible"
                    onChange={(e) => setResumeData({
                      ...resumeData,
                      languages: { ...resumeData.languages, visible: e.target.checked }
                    })}
                    className="w-4 h-4 rounded accent-[#781c1c] cursor-pointer"
                  />
                  <label htmlFor="lang-visible" className={`text-[11px] cursor-pointer select-none font-bold ${
                    isDark ? "text-slate-200" : "text-slate-700"
                  }`}>Show Languages</label>
                </div>
                {resumeData.languages.visible && (
                  <div className="space-y-1">
                    {resumeData.languages.items.map((item: any, idx: number) => (
                      <div key={item.name} className={`rounded-xl px-3 py-2 flex items-center justify-between ${
                        isDark ? "bg-slate-800/70" : "bg-white ring-1 ring-slate-200"
                      }`}>
                        <span className={`text-[11px] font-semibold ${
                          isDark ? "text-slate-200" : "text-slate-800"
                        }`}>{item.name} <span className={`text-[9.5px] ${
                          isDark ? "text-slate-500" : "text-slate-400"
                        }`}>({item.level})</span></span>
                        <button
                          onClick={() => {
                            const list = [...resumeData.languages.items];
                            list[idx].visible = !list[idx].visible;
                            setResumeData({ ...resumeData, languages: { ...resumeData.languages, items: list } });
                          }}
                          className={`p-1 rounded cursor-pointer transition-colors ${
                            item.visible ? (isDark ? "text-emerald-400" : "text-emerald-600") : "text-slate-400"
                          }`}
                        >
                          <Eye size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Patents */}
              <div className="space-y-2">
                <div className={`flex items-center gap-3 p-3 rounded-2xl ${
                  isDark ? "bg-slate-800/50" : "bg-white ring-1 ring-slate-200"
                }`}>
                  <input
                    type="checkbox"
                    checked={resumeData.patents.visible}
                    id="pat-visible"
                    onChange={(e) => setResumeData({
                      ...resumeData,
                      patents: { ...resumeData.patents, visible: e.target.checked }
                    })}
                    className="w-4 h-4 rounded accent-[#781c1c] cursor-pointer"
                  />
                  <label htmlFor="pat-visible" className={`text-[11px] cursor-pointer select-none font-bold ${
                    isDark ? "text-slate-200" : "text-slate-700"
                  }`}>Show Patents</label>
                </div>
                {resumeData.patents.visible && (
                  <div className="space-y-1">
                    {resumeData.patents.items.map((item: any, idx: number) => (
                      <div key={item.id} className={`rounded-xl px-3 py-2 flex items-center justify-between ${
                        isDark ? "bg-slate-800/70" : "bg-white ring-1 ring-slate-200"
                      }`}>
                        <span className={`text-[11px] truncate max-w-[200px] font-semibold ${
                          isDark ? "text-slate-200" : "text-slate-800"
                        }`}>{item.title}</span>
                        <button
                          onClick={() => toggleItemVisibility("patents", idx)}
                          className={`p-1 rounded cursor-pointer transition-colors ${
                            item.visible ? (isDark ? "text-emerald-400" : "text-emerald-600") : "text-slate-400"
                          }`}
                        >
                          <Eye size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Social Media Handles */}
              <div className="space-y-2">
                <div className={`flex items-center gap-3 p-3 rounded-2xl ${
                  isDark ? "bg-slate-800/50" : "bg-white ring-1 ring-slate-200"
                }`}>
                  <input
                    type="checkbox"
                    checked={resumeData.mediaHandles?.visible || false}
                    id="social-visible"
                    onChange={(e) => setResumeData({
                      ...resumeData,
                      mediaHandles: { ...resumeData.mediaHandles, visible: e.target.checked }
                    })}
                    className="w-4 h-4 rounded accent-[#781c1c] cursor-pointer"
                  />
                  <label htmlFor="social-visible" className={`text-[11px] cursor-pointer select-none font-bold ${
                    isDark ? "text-slate-200" : "text-slate-700"
                  }`}>Show Socials / Media Handles
                  </label>
                </div>
                {(resumeData.mediaHandles?.visible || false) && (
                  <div className="space-y-1">
                    {resumeData.mediaHandles?.items?.map((item: any, idx: number) => (
                      <div key={item.platform} className={`rounded-xl px-3 py-2 flex items-center justify-between ${
                        isDark ? "bg-slate-800/70" : "bg-white ring-1 ring-slate-200"
                      }`}>
                        <span className={`text-[11px] font-semibold ${
                          isDark ? "text-slate-200" : "text-slate-800"
                        }`}>{item.platform} <span className={`text-[9.5px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>({item.url ? "Set" : "Not set"})</span></span>
                        <button
                          onClick={() => {
                            const list = [...resumeData.mediaHandles.items];
                            list[idx].visible = !list[idx].visible;
                            setResumeData({ ...resumeData, mediaHandles: { ...resumeData.mediaHandles, items: list } });
                          }}
                          className={`p-1 rounded cursor-pointer transition-colors ${item.visible ? (isDark ? "text-emerald-400" : "text-emerald-600") : "text-slate-400"}`}
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
        <div className="preview-top-bar p-3 sm:p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex justify-between items-center shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-slate-400 text-xs">
            <span>Theme: <strong>{selectedTheme}</strong></span>
          </div>

          <div className="flex items-center justify-between w-full sm:w-auto gap-2">
            {/* Quick Zoom Preset Buttons */}
            <div className={`hidden sm:flex items-center gap-1 p-1 rounded-xl border text-[10px] font-black ${
              isDark ? "bg-slate-900 border-slate-700" : "bg-slate-100 border-slate-300"
            }`}>
              <button
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setZoomLevel(Math.max(0.25, Math.min(1.0, (window.innerWidth - 24) / 794)));
                  } else {
                    setZoomLevel(0.9);
                  }
                }}
                className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                  zoomLevel < 0.75 ? "bg-[#781c1c] text-white font-black" : (isDark ? "text-slate-200 hover:text-white font-bold" : "text-slate-700 hover:text-slate-900")
                }`}
              >
                Auto Fit
              </button>
              <button
                onClick={() => setZoomLevel(0.75)}
                className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                  Math.abs(zoomLevel - 0.75) < 0.05 ? "bg-[#781c1c] text-white font-black" : (isDark ? "text-slate-200 hover:text-white font-bold" : "text-slate-700 hover:text-slate-900")
                }`}
              >
                75%
              </button>
              <button
                onClick={() => setZoomLevel(1.0)}
                className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                  Math.abs(zoomLevel - 1.0) < 0.05 ? "bg-[#781c1c] text-white font-black" : (isDark ? "text-slate-200 hover:text-white font-bold" : "text-slate-700 hover:text-slate-900")
                }`}
              >
                100%
              </button>
            </div>

            {/* Stepper Zoom Box */}
            <div className={`flex items-center gap-1 border rounded-xl px-2 py-1 ${
              isDark ? "bg-slate-900 border-slate-700 text-slate-100 font-bold" : "bg-white border-slate-300 text-slate-700 shadow-2xs"
            }`}>
              <button
                onClick={() => setZoomLevel(Math.max(0.25, zoomLevel - 0.08))}
                className="p-1 hover:text-red-400 transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[10px] font-mono select-none px-1.5 font-black">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel(Math.min(1.5, zoomLevel + 0.08))}
                className="p-1 hover:text-red-400 transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setZoomLevel(Math.max(0.25, Math.min(1.0, (window.innerWidth - 24) / 794)));
                  } else {
                    setZoomLevel(0.9);
                  }
                }}
                className={`p-1 border-l pl-1.5 ml-0.5 transition cursor-pointer ${
                  isDark ? "border-slate-700 hover:text-white" : "border-slate-300 hover:text-slate-900"
                }`}
                title="Reset Zoom / Auto Fit Screen"
              >
                <Maximize2 size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* ── LIVE PREVIEW AREA CONTAINER (PERFECT ABSOLUTE ACCURATE SCALING & CENTERING) ── */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-8 flex flex-col items-center justify-start scrollbar-thin ${
          isDark ? "bg-[#06090e]" : "bg-slate-200/90"
        }`}>
          
          {/* Sizing Box: Holds the exact calculated scaled footprint in flexbox layout */}
          <div
            style={{
              width: `${794 * zoomLevel}px`,
              minHeight: `${1123 * zoomLevel}px`,
              position: "relative",
              margin: "0 auto",
              paddingBottom: "60px"
            }}
            className="transition-all duration-200 shrink-0"
          >
            {/* Scaled Sheet Container: Absolutely positioned at top-left, scaled smoothly from top-left */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                transform: `scale(${zoomLevel})`,
                transformOrigin: "top left",
                width: "794px",
                minHeight: "1123px",
                willChange: "transform"
              }}
            >
              {renderResumeDocument()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
