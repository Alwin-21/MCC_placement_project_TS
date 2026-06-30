"use client";

import { useEffect, useState } from "react";
import {
  User,
  Briefcase,
  Award,
  Code,
  LogOut,
  Plus,
  GitBranch,
  ExternalLink,
  Trophy,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Trash2,
  Bell,
  Sun,
  Moon,
  FileText,
  Heart,
  Palette,
  Eye,
  Edit,
  Globe,
  Mail,
  Phone,
  BookOpen,
  Link,
  ChevronRight
} from "lucide-react";
import api from "@/services/api";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Theme states
  const [themeMode, setThemeMode] = useState<"light" | "dark">("dark");
  const [selectedTheme, setSelectedTheme] = useState("Academic");
  const [availableThemes, setAvailableThemes] = useState<any[]>([]);

  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // File uploading loader
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // AI Advisor states
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [generatedSop, setGeneratedSop] = useState("");
  const [generatingSop, setGeneratingSop] = useState(false);
  const [sopTone, setSopTone] = useState("Academic");
  const [targetCareer, setTargetCareer] = useState("");

  // ==========================================
  // SECTION 1: HEADER SECTION FIELDS
  // ==========================================
  const [fullName, setFullName] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [course, setCourse] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");

  // ==========================================
  // SECTION 2: ABOUT SECTION FIELDS
  // ==========================================
  const [bio, setBio] = useState("");
  const [personalStory, setPersonalStory] = useState("");
  const [sop, setSop] = useState("");

  // ==========================================
  // SECTION 3: EXPERIENCE FIELDS
  // ==========================================
  const [experiences, setExperiences] = useState<any[]>([]);
  const [expTitle, setExpTitle] = useState("");
  const [expCompany, setExpCompany] = useState("");
  const [expLocation, setExpLocation] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expStartDate, setExpStartDate] = useState("");
  const [expEndDate, setExpEndDate] = useState("");
  const [expIsCurrent, setExpIsCurrent] = useState(false);
  const [expCategory, setExpCategory] = useState("Full-time jobs");
  const [editingExpId, setEditingExpId] = useState<number | null>(null);

  // ==========================================
  // SECTION 4: ACADEMIC DETAILS FIELDS
  // ==========================================
  const [academicRecords, setAcademicRecords] = useState<any[]>([]);
  const [academicInstitution, setAcademicInstitution] = useState("");
  const [academicDegree, setAcademicDegree] = useState("");
  const [academicField, setAcademicField] = useState("");
  const [academicGrade, setAcademicGrade] = useState("");
  const [academicStartYear, setAcademicStartYear] = useState<number | string>("");
  const [academicEndYear, setAcademicEndYear] = useState<number | string>("");
  const [academicAttachment, setAcademicAttachment] = useState("");
  const [editingAcademicId, setEditingAcademicId] = useState<number | null>(null);
  const [cgpa, setCgpa] = useState<number | string>("");

  // ==========================================
  // SECTION 5: ACHIEVEMENTS FIELDS
  // ==========================================
  const [achievements, setAchievements] = useState<any[]>([]);
  const [achievementTitle, setAchievementTitle] = useState("");
  const [achievementDescription, setAchievementDescription] = useState("");
  const [achievementUrl, setAchievementUrl] = useState("");
  const [achievementDate, setAchievementDate] = useState("");
  const [achievementCategory, setAchievementCategory] = useState("Scholarships");
  const [editingAchId, setEditingAchId] = useState<number | null>(null);

  // ==========================================
  // SECTION 6: PROJECTS & RESEARCH FIELDS
  // ==========================================
  const [projects, setProjects] = useState<any[]>([]);
  const [researchPapers, setResearchPapers] = useState<any[]>([]);
  const [projTitle, setProjTitle] = useState("");
  const [projDescription, setProjDescription] = useState("");
  const [projTechnologies, setProjTechnologies] = useState("");
  const [projUrl, setProjUrl] = useState("");
  const [projDate, setProjDate] = useState("");
  const [projCategory, setProjCategory] = useState("Academic projects");
  const [editingProjId, setEditingProjId] = useState<number | null>(null);

  // ==========================================
  // SECTION 7: SKILLS FIELDS
  // ==========================================
  const [skills, setSkills] = useState<any[]>([]);
  const [skillName, setSkillName] = useState("");
  const [skillLevel, setSkillLevel] = useState("Intermediate");
  const [skillCategory, setSkillCategory] = useState("Technical skills");
  const [editingSkillId, setEditingSkillId] = useState<number | null>(null);

  // ==========================================
  // SECTION 8: LICENSES & CERTIFICATIONS
  // ==========================================
  const [certifications, setCertifications] = useState<any[]>([]);
  const [certificationTitle, setCertificationTitle] = useState("");
  const [issuer, setIssuer] = useState("");
  const [certificateUrl, setCertificateUrl] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [certCategory, setCertCategory] = useState("Licenses");
  const [editingCertId, setEditingCertId] = useState<number | null>(null);

  // ==========================================
  // SECTION 9, 10, 11: LANGUAGES, TEST SCORES, PATENTS
  // ==========================================
  const [languages, setLanguages] = useState("");
  const [testScores, setTestScores] = useState("");
  const [patents, setPatents] = useState("");

  // ==========================================
  // SECTION 12: OTHER MEDIA HANDLES
  // ==========================================
  const [instagramUrl, setInstagramUrl] = useState("");
  const [blogUrl, setBlogUrl] = useState("");
  const [otherHandles, setOtherHandles] = useState("");

  // ==========================================
  // SECTION 13: RESUME
  // ==========================================
  const [resumes, setResumes] = useState<any[]>([]);
  const [resumeTitle, setResumeTitle] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [editingResumeId, setEditingResumeId] = useState<number | null>(null);

  // Default themes if backend does not load them
  const defaultThemes = [
    { themeId: "Academic", displayName: "Academic", description: "Elegant serif typography, formal navy & gold" },
    { themeId: "Corporate", displayName: "Corporate", description: "Sleek professional grids, slate gray details" },
    { themeId: "Startup", displayName: "Startup", description: "Vibrant high-contrast, pink/purple details" },
    { themeId: "Creative", displayName: "Creative", description: "Artistic pastels, glassmorphic backdrops" },
    { themeId: "AIFuturistic", displayName: "AI Futuristic", description: "Cyber neon glows, tech-monospaced fonts" },
    { themeId: "LinkedIn", displayName: "LinkedIn Pro", description: "LinkedIn-style professional profile layout, blue & white" },
  ];

  // Load user token info
  const getUserIdFromToken = (t: string | null): string | null => {
    if (!t) return null;
    try {
      const base64Url = t.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const payload = JSON.parse(jsonPayload);
      return payload.nameid || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || null;
    } catch (e) {
      console.error("Failed to decode token", e);
      return null;
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser) {
      const currentUser = JSON.parse(storedUser);
      if (!currentUser.id && storedToken) {
        const idFromToken = getUserIdFromToken(storedToken);
        if (idFromToken) {
          currentUser.id = idFromToken;
          localStorage.setItem("user", JSON.stringify(currentUser));
        }
      }
      setUser(currentUser);
      setEmail(currentUser.email || "");
      setFullName(currentUser.fullName || "");
    }

    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("studentThemeMode") as "light" | "dark";
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
    }

    loadAllData();
  }, []);

  const loadAllData = () => {
    fetchProfile();
    fetchSkills();
    fetchCertifications();
    fetchResumes();
    fetchAchievements();
    fetchProjects();
    fetchResearchPapers();
    fetchAcademicRecords();
    fetchExperiences();
    fetchNotifications();
    fetchThemesList();
    fetchAiAnalysis();
  };

  // ==========================================
  // API HELPERS & HANDLERS
  // ==========================================
  const toggleThemeMode = () => {
    const nextTheme = themeMode === "dark" ? "light" : "dark";
    setThemeMode(nextTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("studentThemeMode", nextTheme);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/Notifications/student");
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const markNotificationAsRead = async (id: number) => {
    try {
      await api.post(`/Notifications/student/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchThemesList = async () => {
    try {
      const res = await api.get("/Profiles/themes");
      if (res.data && res.data.length > 0) {
        setAvailableThemes(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch themes", err);
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const authToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await api.post("/Upload", formData, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    return res.data.url;
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void,
    fieldName: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(fieldName);
    try {
      const url = await uploadFile(file);
      setter(url);
    } catch (error: any) {
      console.error(error);
      alert(`Failed to upload ${fieldName}: ${error?.response?.data || error?.message}`);
    } finally {
      setUploadingField(null);
    }
  };

  // ==========================================
  // PROFILE / ABOUT / MISC API
  // ==========================================
  const fetchProfile = async () => {
    try {
      const res = await api.get("/Profiles");
      if (res.data) {
        setBio(res.data.bio || "");
        setLinkedInUrl(res.data.linkedInUrl || "");
        setProfileImageUrl(res.data.profileImageUrl || "");
        setSelectedTheme(res.data.selectedTheme || "Academic");
        setTargetCareer(res.data.targetCareer || "");
        setCgpa(res.data.cgpa || "");
        setPersonalStory(res.data.personalStory || "");
        setSop(res.data.sop || "");
        setCourse(res.data.course || "");
        setYearOfStudy(res.data.yearOfStudy || "");
        setCurrentLocation(res.data.currentLocation || "");
        setPhone(res.data.phone || "");
        setLanguages(res.data.languages || "");
        setTestScores(res.data.testScores || "");
        setPatents(res.data.patents || "");
        setInstagramUrl(res.data.instagramUrl || "");
        setBlogUrl(res.data.blogUrl || "");
        setOtherHandles(res.data.otherHandles || "");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveProfile = async () => {
    try {
      await api.post("/Profiles", {
        fullName,
        bio,
        linkedInUrl,
        profileImageUrl,
        selectedTheme,
        targetCareer,
        cgpa: Number(cgpa) || 0.0,
        personalStory,
        sop,
        course,
        yearOfStudy,
        currentLocation,
        phone,
        languages,
        testScores,
        patents,
        instagramUrl,
        blogUrl,
        otherHandles
      });

      // Update local storage user name representation
      if (user) {
        const updated = { ...user, fullName };
        localStorage.setItem("user", JSON.stringify(updated));
        setUser(updated);
      }

      alert("Header & Profile Settings Saved Successfully!");
      loadAllData();
    } catch (err: any) {
      console.error(err);
      alert(`Failed to save settings: ${err?.response?.data || err?.message}`);
    }
  };

  // ==========================================
  // EXPERIENCE API (CRUD)
  // ==========================================
  const fetchExperiences = async () => {
    try {
      const res = await api.get("/Experiences");
      setExperiences(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addExperience = async () => {
    try {
      const payload = {
        title: expTitle,
        company: expCompany,
        location: expLocation,
        description: expDesc,
        startDate: expStartDate,
        endDate: expIsCurrent ? "" : expEndDate,
        isCurrent: expIsCurrent,
        category: expCategory
      };

      if (editingExpId) {
        await api.put(`/Experiences/${editingExpId}`, payload);
        alert("Experience updated successfully!");
      } else {
        await api.post("/Experiences", payload);
        alert("Experience added successfully!");
      }
      cancelEditExperience();
      fetchExperiences();
      fetchAiAnalysis();
    } catch (err: any) {
      alert(`Failed to save experience: ${err?.response?.data || err?.message}`);
    }
  };

  const startEditExperience = (item: any) => {
    setEditingExpId(item.id);
    setExpTitle(item.title);
    setExpCompany(item.company);
    setExpLocation(item.location);
    setExpDesc(item.description);
    setExpStartDate(item.startDate);
    setExpEndDate(item.endDate);
    setExpIsCurrent(item.isCurrent);
    setExpCategory(item.category || "Full-time jobs");
  };

  const cancelEditExperience = () => {
    setEditingExpId(null);
    setExpTitle("");
    setExpCompany("");
    setExpLocation("");
    setExpDesc("");
    setExpStartDate("");
    setExpEndDate("");
    setExpIsCurrent(false);
  };

  const deleteExperience = async (id: number) => {
    if (!confirm("Are you sure you want to delete this experience record?")) return;
    try {
      await api.delete(`/Experiences/${id}`);
      fetchExperiences();
      fetchAiAnalysis();
    } catch (err: any) {
      alert(`Failed to delete experience: ${err?.response?.data || err?.message}`);
    }
  };

  // ==========================================
  // ACADEMIC DETAILS API (CRUD)
  // ==========================================
  const fetchAcademicRecords = async () => {
    try {
      const res = await api.get("/AcademicRecords");
      setAcademicRecords(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addAcademicRecord = async () => {
    try {
      const payload = {
        institution: academicInstitution,
        degree: academicDegree,
        fieldOfStudy: academicField,
        grade: academicGrade,
        startYear: Number(academicStartYear) || 0,
        endYear: Number(academicEndYear) || 0,
        attachmentUrl: academicAttachment
      };

      if (editingAcademicId) {
        await api.put(`/AcademicRecords/${editingAcademicId}`, payload);
        alert("Academic Record Updated!");
      } else {
        await api.post("/AcademicRecords", payload);
        alert("Academic Record Added!");
      }
      cancelEditAcademicRecord();
      fetchAcademicRecords();
      fetchAiAnalysis();
    } catch (err: any) {
      alert(`Failed to save Academic Record: ${err?.response?.data || err?.message}`);
    }
  };

  const startEditAcademicRecord = (item: any) => {
    setEditingAcademicId(item.id);
    setAcademicInstitution(item.institution);
    setAcademicDegree(item.degree);
    setAcademicField(item.fieldOfStudy);
    setAcademicGrade(item.grade);
    setAcademicStartYear(item.startYear);
    setAcademicEndYear(item.endYear);
    setAcademicAttachment(item.attachmentUrl || "");
  };

  const cancelEditAcademicRecord = () => {
    setEditingAcademicId(null);
    setAcademicInstitution("");
    setAcademicDegree("");
    setAcademicField("");
    setAcademicGrade("");
    setAcademicStartYear("");
    setAcademicEndYear("");
    setAcademicAttachment("");
  };

  const deleteAcademicRecord = async (id: number) => {
    if (!confirm("Delete this Academic Record?")) return;
    try {
      await api.delete(`/AcademicRecords/${id}`);
      fetchAcademicRecords();
      fetchAiAnalysis();
    } catch (err: any) {
      alert(`Failed to delete: ${err?.response?.data || err?.message}`);
    }
  };

  // ==========================================
  // ACHIEVEMENTS API (CRUD)
  // ==========================================
  const fetchAchievements = async () => {
    try {
      const res = await api.get("/Achievements");
      setAchievements(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addAchievement = async () => {
    try {
      const payload = {
        title: achievementTitle,
        description: achievementDescription,
        achievementUrl,
        achievementDate,
        category: achievementCategory
      };

      if (editingAchId) {
        await api.put(`/Achievements/${editingAchId}`, payload);
        alert("Achievement Updated!");
      } else {
        await api.post("/Achievements", payload);
        alert("Achievement Added!");
      }
      cancelEditAchievement();
      fetchAchievements();
      fetchAiAnalysis();
    } catch (err: any) {
      alert(`Failed to save Achievement: ${err?.response?.data || err?.message}`);
    }
  };

  const startEditAchievement = (item: any) => {
    setEditingAchId(item.id);
    setAchievementTitle(item.title);
    setAchievementDescription(item.description);
    setAchievementUrl(item.achievementUrl);
    setAchievementDate(item.achievementDate ? item.achievementDate.split("T")[0] : "");
    setAchievementCategory(item.category || "Scholarships");
  };

  const cancelEditAchievement = () => {
    setEditingAchId(null);
    setAchievementTitle("");
    setAchievementDescription("");
    setAchievementUrl("");
    setAchievementDate("");
  };

  const deleteAchievement = async (id: number) => {
    if (!confirm("Delete this Achievement?")) return;
    try {
      await api.delete(`/Achievements/${id}`);
      fetchAchievements();
      fetchAiAnalysis();
    } catch (err: any) {
      alert(`Failed to delete achievement: ${err?.response?.data || err?.message}`);
    }
  };

  // ==========================================
  // PROJECTS & RESEARCH API (CRUD - Unified)
  // ==========================================
  const fetchProjects = async () => {
    try {
      const res = await api.get("/Projects");
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchResearchPapers = async () => {
    try {
      const res = await api.get("/ResearchPapers");
      setResearchPapers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addProjectOrResearch = async () => {
    try {
      const isResearch = projCategory === "Publications" || projCategory === "Conference presentations";
      
      if (isResearch) {
        const payload = {
          title: projTitle,
          abstract: projDescription,
          conference: projTechnologies, // Maps to technology / conference details
          paperUrl: projUrl,
          publishedDate: projDate,
          category: projCategory
        };
        if (editingProjId) {
          await api.put(`/ResearchPapers/${editingProjId}`, payload);
          alert("Research Paper/Publication Updated!");
        } else {
          await api.post("/ResearchPapers", payload);
          alert("Research Paper/Publication Added!");
        }
      } else {
        const payload = {
          title: projTitle,
          description: projDescription,
          technologies: projTechnologies,
          githubUrl: projUrl,
          liveUrl: projUrl,
          category: projCategory,
          demoVideoUrl: "",
          imageUrl: ""
        };
        if (editingProjId) {
          await api.put(`/Projects/${editingProjId}`, payload);
          alert("Project Updated!");
        } else {
          await api.post("/Projects", payload);
          alert("Project Added!");
        }
      }
      cancelEditProj();
      fetchProjects();
      fetchResearchPapers();
      fetchAiAnalysis();
    } catch (err: any) {
      alert(`Failed to save Project/Research: ${err?.response?.data || err?.message}`);
    }
  };

  const startEditProj = (item: any, cat: string) => {
    setEditingProjId(item.id);
    setProjCategory(cat);
    setProjTitle(item.title);
    if (cat === "Publications" || cat === "Conference presentations") {
      setProjDescription(item.abstract || "");
      setProjTechnologies(item.conference || "");
      setProjUrl(item.paperUrl || "");
      setProjDate(item.publishedDate ? item.publishedDate.split("T")[0] : "");
    } else {
      setProjDescription(item.description || "");
      setProjTechnologies(item.technologies || "");
      setProjUrl(item.githubUrl || item.liveUrl || "");
      setProjDate("");
    }
  };

  const cancelEditProj = () => {
    setEditingProjId(null);
    setProjTitle("");
    setProjDescription("");
    setProjTechnologies("");
    setProjUrl("");
    setProjDate("");
  };

  const deleteProjectRecord = async (id: number) => {
    if (!confirm("Delete this project?")) return;
    try {
      await api.delete(`/Projects/${id}`);
      fetchProjects();
      fetchAiAnalysis();
    } catch (err: any) {
      alert(`Failed to delete: ${err?.response?.data || err?.message}`);
    }
  };

  const deleteResearchRecord = async (id: number) => {
    if (!confirm("Delete this publication/research record?")) return;
    try {
      await api.delete(`/ResearchPapers/${id}`);
      fetchResearchPapers();
      fetchAiAnalysis();
    } catch (err: any) {
      alert(`Failed to delete: ${err?.response?.data || err?.message}`);
    }
  };

  // ==========================================
  // SKILLS API (CRUD)
  // ==========================================
  const fetchSkills = async () => {
    try {
      const res = await api.get("/Skills");
      setSkills(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addSkill = async () => {
    try {
      const payload = {
        name: skillName,
        level: skillLevel,
        category: skillCategory
      };

      if (editingSkillId) {
        await api.put(`/Skills/${editingSkillId}`, payload);
        alert("Skill Updated!");
      } else {
        await api.post("/Skills", payload);
        alert("Skill Added!");
      }
      cancelEditSkill();
      fetchSkills();
      fetchAiAnalysis();
    } catch (err: any) {
      alert(`Failed to save Skill: ${err?.response?.data || err?.message}`);
    }
  };

  const startEditSkill = (item: any) => {
    setEditingSkillId(item.id);
    setSkillName(item.name);
    setSkillLevel(item.level);
    setSkillCategory(item.category || "Technical skills");
  };

  const cancelEditSkill = () => {
    setEditingSkillId(null);
    setSkillName("");
    setSkillLevel("Intermediate");
  };

  const deleteSkill = async (id: number) => {
    if (!confirm("Delete this skill?")) return;
    try {
      await api.delete(`/Skills/${id}`);
      fetchSkills();
      fetchAiAnalysis();
    } catch (err: any) {
      alert(`Failed to delete skill: ${err?.response?.data || err?.message}`);
    }
  };

  // ==========================================
  // CERTIFICATIONS API (CRUD)
  // ==========================================
  const fetchCertifications = async () => {
    try {
      const res = await api.get("/Certifications");
      setCertifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addCertification = async () => {
    try {
      const payload = {
        title: certificationTitle,
        issuer,
        certificateUrl,
        issueDate,
        category: certCategory
      };

      if (editingCertId) {
        await api.put(`/Certifications/${editingCertId}`, payload);
        alert("Certification Updated!");
      } else {
        await api.post("/Certifications", payload);
        alert("Certification Added!");
      }
      cancelEditCertification();
      fetchCertifications();
      fetchAiAnalysis();
    } catch (err: any) {
      alert(`Failed to save: ${err?.response?.data || err?.message}`);
    }
  };

  const startEditCertification = (item: any) => {
    setEditingCertId(item.id);
    setCertificationTitle(item.title);
    setIssuer(item.issuer);
    setCertificateUrl(item.certificateUrl);
    setIssueDate(item.issueDate ? item.issueDate.split("T")[0] : "");
    setCertCategory(item.category || "Licenses");
  };

  const cancelEditCertification = () => {
    setEditingCertId(null);
    setCertificationTitle("");
    setIssuer("");
    setCertificateUrl("");
    setIssueDate("");
  };

  const deleteCertification = async (id: number) => {
    if (!confirm("Delete this certification?")) return;
    try {
      await api.delete(`/Certifications/${id}`);
      fetchCertifications();
      fetchAiAnalysis();
    } catch (err: any) {
      alert(`Failed to delete certification: ${err?.response?.data || err?.message}`);
    }
  };

  // ==========================================
  // RESUME API (CRUD)
  // ==========================================
  const fetchResumes = async () => {
    try {
      const res = await api.get("/Resumes");
      setResumes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addResume = async () => {
    try {
      const payload = {
        resumeTitle,
        resumeUrl
      };

      if (editingResumeId) {
        await api.put(`/Resumes/${editingResumeId}`, payload);
        alert("Resume Updated!");
      } else {
        await api.post("/Resumes", payload);
        alert("Resume Saved!");
      }
      cancelEditResume();
      fetchResumes();
    } catch (err: any) {
      alert(`Failed to save resume: ${err?.response?.data || err?.message}`);
    }
  };

  const startEditResume = (item: any) => {
    setEditingResumeId(item.id);
    setResumeTitle(item.resumeTitle);
    setResumeUrl(item.resumeUrl);
  };

  const cancelEditResume = () => {
    setEditingResumeId(null);
    setResumeTitle("");
    setResumeUrl("");
  };

  const deleteResume = async (id: number) => {
    if (!confirm("Delete this resume?")) return;
    try {
      await api.delete(`/Resumes/${id}`);
      fetchResumes();
    } catch (err: any) {
      alert(`Failed to delete: ${err?.response?.data || err?.message}`);
    }
  };

  // ==========================================
  // AI ADVISOR GENERATOR
  // ==========================================
  const handleGenerateSop = async () => {
    try {
      setGeneratingSop(true);
      const response = await api.post("/AI/generate-sop", {
        targetPath: targetCareer,
        tone: sopTone,
      });
      setGeneratedSop(response.data.sop);
    } catch (error: any) {
      alert(`Failed to generate SOP: ${error?.response?.data || error?.message}`);
    } finally {
      setGeneratingSop(false);
    }
  };

  const fetchAiAnalysis = async () => {
    try {
      setLoadingAi(true);
      const response = await api.get("/AI/career-analysis");
      setAiAnalysis(response.data);
    } catch (error) {
      console.error("Failed to fetch AI analysis", error);
    } finally {
      setLoadingAi(false);
    }
  };

  const downloadReadinessReport = () => {
    if (!aiAnalysis) {
      alert("AI Analysis is not loaded yet.");
      return;
    }
    const content = `MADRAS CHRISTIAN COLLEGE - PORTFOLIO READINESS REPORT
-----------------------------------------------------------
Student Name: ${fullName || "MCC Student"}
Course/Department: ${course || ""}
CGPA: ${cgpa || "N/A"}
Target Career Path: ${targetCareer || "N/A"}

PROFILE COMPLETENESS
-----------------------------------------------------------
Completeness Score: ${aiAnalysis.profileCompleteness}%

SKILL GAP ANALYSIS
-----------------------------------------------------------
Target Career Requirements Match: ${aiAnalysis.skillMatchPercentage}%
Matched Skills: ${aiAnalysis.matchedSkills?.join(", ") || "None"}
Missing Skills: ${aiAnalysis.missingSkills?.join(", ") || "None"}

RECOMMENDED UNIVERSITIES & PLACEMENTS
-----------------------------------------------------------
Universities: ${aiAnalysis.universities?.map((u: any) => `\n- ${u.name} (${u.program})`).join("") || "None"}
Placements: ${aiAnalysis.internships?.map((it: any) => `\n- ${it.company} (${it.role})`).join("") || "None"}
Report Generated: ${new Date().toLocaleDateString()}
`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${fullName.replace(/\s+/g, "_")}_MCC_Report.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Nav sidebar scroll helpers
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth"
    });
  };

  // Theme Styling Helper
  const getPreviewThemeStyles = () => {
    switch (selectedTheme) {
      case "Corporate":
        return {
          card: "bg-white border border-slate-200 p-6 rounded-xl text-slate-800 font-sans shadow-sm",
          badge: "inline-block px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded border border-slate-200",
          title: "text-slate-900 font-black uppercase text-sm tracking-wider pb-1 border-b border-slate-200",
          accentText: "text-blue-500 font-semibold text-xs",
          borderAccent: "border-l-3 border-blue-500"
        };
      case "Startup":
        return {
          card: "bg-white border border-neutral-100 p-6 rounded-2xl text-neutral-800 font-sans shadow-md",
          badge: "inline-block px-2.5 py-0.5 bg-violet-50 text-violet-700 text-[10px] font-bold rounded-full border border-violet-100",
          title: "text-neutral-900 font-black uppercase text-sm tracking-wider pb-1 border-b-2 border-neutral-150",
          accentText: "text-[#781c1c] font-bold text-xs",
          borderAccent: "border-l-3 border-violet-500"
        };
      case "Creative":
        return {
          card: "bg-indigo-950 border border-indigo-900 p-6 rounded-2xl text-indigo-100 font-sans shadow-lg",
          badge: "inline-block px-2 py-0.5 bg-teal-50/10 text-teal-300 text-[10px] font-semibold rounded border border-teal-500/25",
          title: "text-teal-300 font-black uppercase text-sm tracking-wider pb-1 border-b border-indigo-800",
          accentText: "text-teal-400 font-semibold text-xs",
          borderAccent: "border-l-3 border-teal-450"
        };
      case "AIFuturistic":
        return {
          card: "bg-[#0d0d12] border border-[#00ffcc]/25 p-6 rounded-xl text-gray-300 font-mono shadow-[0_0_15px_rgba(0,255,204,0.05)]",
          badge: "inline-block px-2 py-0.5 bg-[#0d0d12] text-[#00ffcc] text-[10px] font-bold rounded border border-[#00ffcc]/20",
          title: "text-[#00ffcc] font-bold uppercase text-sm tracking-widest pb-1 border-b border-[#00ffcc]/15",
          accentText: "text-cyan-400 font-bold text-xs",
          borderAccent: "border-l-3 border-[#00ffcc]"
        };
      case "LinkedIn":
        return {
          card: "bg-white border border-slate-200 p-6 rounded-xl text-slate-800 font-sans shadow-sm",
          badge: "inline-block px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-full border border-slate-200",
          title: "text-slate-900 font-bold text-sm pb-1 border-b border-slate-200",
          accentText: "text-[#0a66c2] font-semibold text-xs",
          borderAccent: "border-l-4 border-[#0a66c2]"
        };
      default:
        return {
          card: "bg-white border border-amber-900/10 p-6 rounded-xl text-[#2c2c2c] font-serif shadow-sm",
          badge: "inline-block px-2.5 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-semibold rounded border border-amber-250",
          title: "text-[#18233c] font-black uppercase text-sm tracking-wider pb-1 border-b-2 border-amber-100",
          accentText: "text-amber-600 font-semibold text-xs",
          borderAccent: "border-l-3 border-amber-600"
        };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${
      themeMode === "dark" ? "bg-[#0d0d12] text-white" : "bg-[#fcfaf6] text-[#0f172a]"
    }`}>
      
      {/* SIDEBAR NAVIGATION */}
      <div className={`w-72 border-r backdrop-blur-xl sticky top-0 h-screen flex flex-col transition-colors duration-300 shrink-0 ${
        themeMode === "dark" ? "bg-[#09090d] border-white/5 text-white" : "bg-[#18233c] border-[#781c1c]/10 text-white shadow-xl"
      }`}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#781c1c] flex items-center justify-center shrink-0 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f7f5f0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="12" cy="5" r="3" />
                <line x1="12" y1="8" x2="12" y2="22" />
                <line x1="6" y1="12" x2="18" y2="12" />
                <path d="M5 12a7 7 0 0 0 14 0" />
              </svg>
            </div>
            <div>
              <span className="font-serif font-black text-xs tracking-tight text-white block leading-none">
                MADRAS CHRISTIAN
              </span>
              <span className="font-serif font-black text-xs tracking-tight text-white block mt-0.5 leading-none">
                COLLEGE
              </span>
              <span className="text-[7px] uppercase font-mono tracking-widest text-[#d4af37] block font-extrabold mt-1 leading-none">
                Autonomous
              </span>
            </div>
          </div>
          <button
            onClick={toggleThemeMode}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition shrink-0"
          >
            {themeMode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* 13 SECTIONS LINKS */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin">
          <button onClick={() => scrollTo("header-section")} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"}`}>
            <User size={16} className="text-[#781c1c]" /> Header Section
          </button>
          <button onClick={() => scrollTo("about-section")} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"}`}>
            <FileText size={16} className="text-[#781c1c]" /> About Section
          </button>
          <button onClick={() => scrollTo("experience-section")} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"}`}>
            <Briefcase size={16} className="text-[#781c1c]" /> Experience
          </button>
          <button onClick={() => scrollTo("academic-section")} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"}`}>
            <Award size={16} className="text-[#781c1c]" /> Academic Details
          </button>
          <button onClick={() => scrollTo("achievements-section")} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"}`}>
            <Trophy size={16} className="text-[#781c1c]" /> Achievements
          </button>
          <button onClick={() => scrollTo("projects-research-section")} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"}`}>
            <GitBranch size={16} className="text-[#781c1c]" /> Projects & Research
          </button>
          <button onClick={() => scrollTo("skills-section")} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"}`}>
            <Code size={16} className="text-[#781c1c]" /> Skills
          </button>
          <button onClick={() => scrollTo("licenses-certifications-section")} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"}`}>
            <Award size={16} className="text-[#781c1c]" /> Certifications
          </button>
          <button onClick={() => scrollTo("languages-section")} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"}`}>
            <Globe size={16} className="text-[#781c1c]" /> Languages known
          </button>
          <button onClick={() => scrollTo("test-scores-section")} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"}`}>
            <Award size={16} className="text-[#781c1c]" /> Test Scores
          </button>
          <button onClick={() => scrollTo("patents-section")} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"}`}>
            <FileText size={16} className="text-[#781c1c]" /> Patents
          </button>
          <button onClick={() => scrollTo("media-handles-section")} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"}`}>
            <Link size={16} className="text-[#781c1c]" /> Media Handles
          </button>
          <button onClick={() => scrollTo("resume-section")} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"}`}>
            <FileText size={16} className="text-[#781c1c]" /> Resume
          </button>

          <div className="pt-4 border-t border-white/5 space-y-1">
            <button onClick={() => scrollTo("ai-advisor-section")} className="w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl bg-[#781c1c]/10 hover:bg-[#781c1c]/20 text-[#781c1c] text-sm font-semibold text-left">
              <Sparkles size={16} /> AI Career Advisor
            </button>
            <button onClick={() => {
              if (user?.fullName) {
                const slug = user.fullName.replace(/\s+/g, "").toLowerCase();
                window.open(`/student/${slug}`, "_blank");
              } else {
                alert("Please save your Header details first.");
              }
            }} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"}`}>
              <Eye size={16} className="text-emerald-400" /> View Public Portfolio
            </button>
            <button onClick={() => window.location.href = "/search"} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"}`}>
              <Globe size={16} className="text-gray-400" /> Search Students
            </button>
            <button onClick={() => window.location.href = "/leaderboard"} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"}`}>
              <Trophy size={16} className="text-gray-400" /> Leaderboard
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-xl text-sm font-semibold transition"
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 overflow-y-auto px-10 py-8 space-y-10">
        
        {/* BANNER SHOWCASE */}
        <div className="relative rounded-3xl overflow-hidden h-44 bg-[#18233c] text-white flex items-end p-8 border border-amber-600/20 shadow-md mb-4">
          <div className="absolute inset-0 z-0">
            <img 
              src="/mcc-facade.jpg" 
              alt="MCC Quadrangle" 
              className="w-full h-full object-cover opacity-35 filter brightness-90 contrast-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#18233c] via-[#18233c]/40 to-transparent" />
          </div>
          <div className="relative z-10 space-y-1 w-full text-left">
            <span className="text-[9px] uppercase font-mono font-black tracking-widest text-amber-400 bg-[#781c1c] px-3 py-1 rounded-full border border-amber-500/20 inline-block">
              {user?.stream || "General"} Stream · {user?.department || "Unassigned"}
            </span>
            <h1 className="font-serif text-2xl md:text-3xl font-black text-white mt-2">
              Welcome back, {fullName || user?.fullName || "Student Scholar"}
            </h1>
            <p className="text-xs text-slate-300">
              Manage your academic records, certifications, and portfolio pages.
            </p>
          </div>
        </div>
        
        {/* HEADER BAR */}
        <div className="flex justify-between items-center pb-6 border-b border-white/10">
          <div>
            <span className="text-[10px] uppercase font-mono font-black tracking-widest text-[#781c1c] block mb-1">Student Placement Directory</span>
            <h2 className="font-serif text-3xl font-extrabold tracking-tight text-[#18233c]">Student Dashboard</h2>
            <p className={`text-xs mt-1 ${themeMode === "dark" ? "text-gray-400" : "text-slate-500"}`}>
              Configure and showcase your portfolio variables according to MCC standards.
            </p>
          </div>

          {/* Alert Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition relative"
            >
              <Bell size={18} />
              {notifications.some(n => !n.isRead) && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#781c1c] rounded-full" />
              )}
            </button>
            {showNotifications && (
              <div className={`absolute right-0 mt-3 w-80 rounded-2xl border p-4 shadow-2xl z-50 transition-all duration-300 ${
                themeMode === "dark" ? "bg-[#0b0b0f] border-white/15 text-white" : "bg-white border-slate-200 text-slate-800"
              }`}>
                <h4 className="font-bold text-xs border-b pb-2 mb-2 flex items-center justify-between border-white/5">
                  <span>Campus Alerts & Announcements</span>
                  <button onClick={() => setShowNotifications(false)} className="text-[10px] opacity-60 hover:opacity-100">Close</button>
                </h4>
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.isRead && markNotificationAsRead(n.id)}
                        className={`p-3 rounded-xl border transition text-left cursor-pointer ${
                          n.isRead ? "bg-white/[0.02] border-white/5 opacity-60" : "bg-[#781c1c]/10 border-[#781c1c]/20 hover:bg-[#781c1c]/15"
                        }`}
                      >
                        <span className="font-semibold text-xs block leading-tight">{n.title}</span>
                        <p className="text-[10px] opacity-70 mt-1 leading-relaxed">{n.message}</p>
                        <span className="text-[8px] opacity-40 block mt-2 font-mono">{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 opacity-60 text-xs">No notifications.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ==========================================
            SECTION 1: HEADER SETTINGS
            ========================================== */}
        <div id="header-section" className={`border rounded-3xl p-8 transition duration-300 ${
          themeMode === "dark" ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <h3 className="font-serif text-2xl font-black mb-4 flex items-center gap-2 text-[#18233c] border-b border-[#781c1c]/10 pb-3">
            <User size={22} /> Section 1: Header Section Details
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Profile Photo upload */}
            <div className={`border rounded-2xl p-5 flex flex-col justify-center gap-2 transition ${
              themeMode === "dark" ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200"
            }`}>
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5">Profile Photo (JPG / PNG)</label>
              <div className="flex items-center gap-4 mt-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, setProfileImageUrl, "Profile Image")}
                  className="hidden"
                  id="profile-image-upload"
                />
                <label
                  htmlFor="profile-image-upload"
                  className="bg-[#781c1c] hover:bg-[#5f1515] px-5 py-2.5 rounded-xl cursor-pointer text-xs font-bold transition text-white"
                >
                  {uploadingField === "Profile Image" ? "Uploading..." : "Upload Photo"}
                </label>
                {profileImageUrl && (
                  <div className="flex items-center gap-3">
                    <img src={profileImageUrl} className="w-10 h-10 object-cover rounded-full border border-[#781c1c]" alt="Preview" />
                    <span className="text-green-400 text-xs font-bold flex items-center gap-1"><CheckCircle size={14} /> Uploaded</span>
                  </div>
                )}
              </div>
            </div>

            {/* Inputs */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5">Full Name</label>
              <input
                type="text"
                placeholder="Student Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                  themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                }`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5">Course & Year</label>
              <input
                type="text"
                placeholder="e.g. B.Sc. Computer Science - III Year"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                  themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                }`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5">Current Location</label>
              <input
                type="text"
                placeholder="e.g. Chennai, Tamil Nadu, India"
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                  themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                }`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5">Contact Email</label>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                disabled
                className="border rounded-xl px-4 py-3 text-sm outline-none bg-neutral-900 border-white/5 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5">Contact Phone</label>
              <input
                type="text"
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                  themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                }`}
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5">LinkedIn Profile URL</label>
              <input
                type="text"
                placeholder="https://linkedin.com/in/username"
                value={linkedInUrl}
                onChange={(e) => setLinkedInUrl(e.target.value)}
                className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                  themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                }`}
              />
            </div>
          </div>

          {/* DYNAMIC THEME ENGINE IN HEADER */}
          <div className="mt-8 pt-8 border-t border-dashed border-white/10">
            <h4 className="text-sm font-bold text-[#781c1c] mb-4 flex items-center gap-2">
              <Sparkles size={16} /> Select Portfolio Theme Style
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {(availableThemes.length > 0 ? availableThemes : defaultThemes).map((t: any) => {
                const themeId = t.themeId || t.id;
                const displayName = t.displayName || t.name;
                return (
                  <button
                    key={themeId}
                    type="button"
                    onClick={() => setSelectedTheme(themeId)}
                    className={`p-4 rounded-xl border text-left transition flex flex-col justify-between h-28 ${
                      selectedTheme === themeId
                        ? "border-[#781c1c] bg-[#781c1c]/10 shadow-lg shadow-[#781c1c]/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs block">{displayName}</span>
                      <span className="text-[10px] opacity-60 mt-1 block leading-tight truncate">{t.description}</span>
                    </div>
                    {selectedTheme === themeId && (
                      <span className="text-[#781c1c] text-[10px] font-semibold flex items-center gap-1">
                        <CheckCircle size={10} /> Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={saveProfile}
              className="bg-gradient-to-r from-[#781c1c] to-[#18233c] hover:opacity-90 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition"
            >
              Save Header Settings
            </button>
          </div>
        </div>

        {/* ==========================================
            SECTION 2: ABOUT SECTION
            ========================================== */}
        <div id="about-section" className={`border rounded-3xl p-8 transition duration-300 ${
          themeMode === "dark" ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <h3 className="font-serif text-2xl font-black mb-4 flex items-center gap-2 text-[#18233c] border-b border-[#781c1c]/10 pb-3">
            <FileText size={22} /> Section 2: About Section
          </h3>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5">Short bio / Professional Summary</label>
              <textarea
                placeholder="A compelling, short biography to pitch yourself to employers and academies..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none min-h-[100px] transition ${
                  themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                }`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5">Personal Journey Story (Optional)</label>
              <textarea
                placeholder="Share your personal background or story of how you entered this field..."
                value={personalStory}
                onChange={(e) => setPersonalStory(e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none min-h-[80px] transition ${
                  themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                }`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5">Statement of Purpose (SOP) / Career Intentions (Optional)</label>
              <textarea
                placeholder="Write your long-term career aspirations and objectives..."
                value={sop}
                onChange={(e) => setSop(e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none min-h-[80px] transition ${
                  themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                }`}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={saveProfile}
              className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-6 py-2.5 rounded-xl font-bold transition"
            >
              Save About Section
            </button>
          </div>
        </div>

        {/* ==========================================
            SECTION 3: EXPERIENCE
            ========================================== */}
        <div id="experience-section" className={`border rounded-3xl p-8 transition duration-300 ${
          themeMode === "dark" ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <h3 className="font-serif text-2xl font-black mb-4 flex items-center gap-2 text-[#18233c] border-b border-[#781c1c]/10 pb-3">
            <Briefcase size={22} /> Section 3: Experience
          </h3>

          {/* Form */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              placeholder="Job Title / Role (e.g. Frontend Intern)"
              value={expTitle}
              onChange={(e) => setExpTitle(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />

            <input
              type="text"
              placeholder="Company / Organization"
              value={expCompany}
              onChange={(e) => setExpCompany(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />

            <input
              type="text"
              placeholder="Location (e.g. Remote / Chennai)"
              value={expLocation}
              onChange={(e) => setExpLocation(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />

            <select
              value={expCategory}
              onChange={(e) => setExpCategory(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-[#0b0b0f] border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            >
              <option value="Full-time jobs">Full-time jobs</option>
              <option value="Internships">Internships</option>
              <option value="Part-time jobs">Part-time jobs</option>
              <option value="Volunteering">Volunteering</option>
              <option value="Administrative positions">Administrative positions</option>
              <option value="Others">Others</option>
            </select>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs opacity-60">Start Date</label>
              <input
                type="text"
                placeholder="e.g. June 2025"
                value={expStartDate}
                onChange={(e) => setExpStartDate(e.target.value)}
                className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                  themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs opacity-60">End Date</label>
              <input
                type="text"
                placeholder="e.g. Present / August 2025"
                value={expEndDate}
                disabled={expIsCurrent}
                onChange={(e) => setExpEndDate(e.target.value)}
                className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                  expIsCurrent
                    ? "bg-neutral-900 border-white/5 text-gray-500 cursor-not-allowed"
                    : themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                }`}
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-2 py-2">
              <input
                type="checkbox"
                id="expIsCurrent"
                checked={expIsCurrent}
                onChange={(e) => setExpIsCurrent(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 accent-[#781c1c]"
              />
              <label htmlFor="expIsCurrent" className="text-sm cursor-pointer select-none">I currently work here</label>
            </div>

            <textarea
              placeholder="Description of duties, key projects and achievements..."
              value={expDesc}
              onChange={(e) => setExpDesc(e.target.value)}
              className={`md:col-span-2 border rounded-xl px-4 py-3 text-sm outline-none min-h-[100px] transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />
          </div>

          <div className="flex gap-2 justify-end">
            {editingExpId && (
              <button
                onClick={cancelEditExperience}
                className="px-6 py-2.5 border border-red-500/20 hover:bg-red-500/5 text-red-400 rounded-xl font-bold transition text-xs"
              >
                Cancel
              </button>
            )}
            <button
              onClick={addExperience}
              className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-6 py-2.5 rounded-xl font-bold transition text-xs"
            >
              {editingExpId ? "Update Experience" : "Add Experience"}
            </button>
          </div>

          {/* Grid list */}
          <div className="grid md:grid-cols-2 gap-4 mt-8">
            {experiences.map((exp) => (
              <div key={exp.id} className={`border rounded-2xl p-5 relative group transition ${
                themeMode === "dark" ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full font-mono bg-[#781c1c]/10 text-[#781c1c] border border-[#781c1c]/20 text-[9px] font-bold uppercase mb-2">
                      {exp.category}
                    </span>
                    <h4 className="font-bold text-base leading-tight">{exp.title}</h4>
                    <p className="text-xs opacity-75 mt-1">{exp.company} · {exp.location}</p>
                    <p className="text-[10px] opacity-50 mt-1 font-semibold">{exp.startDate} - {exp.isCurrent ? "Present" : exp.endDate}</p>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                    <button onClick={() => startEditExperience(exp)} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10"><Edit size={14} /></button>
                    <button onClick={() => deleteExperience(exp.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-xs opacity-60 mt-3 whitespace-pre-line leading-relaxed">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ==========================================
            SECTION 4: ACADEMIC DETAILS
            ========================================== */}
        <div id="academic-section" className={`border rounded-3xl p-8 transition duration-300 ${
          themeMode === "dark" ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <h3 className="font-serif text-2xl font-black mb-4 flex items-center gap-2 text-[#18233c] border-b border-[#781c1c]/10 pb-3">
            <Award size={22} /> Section 4: Academic Details
          </h3>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              placeholder="Degree (e.g. Bachelor of Science)"
              value={academicDegree}
              onChange={(e) => setAcademicDegree(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />

            <input
              type="text"
              placeholder="Department / Field (e.g. Computer Science)"
              value={academicField}
              onChange={(e) => setAcademicField(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />

            <input
              type="text"
              placeholder="College / University Name"
              value={academicInstitution}
              onChange={(e) => setAcademicInstitution(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />

            <input
              type="text"
              placeholder="Grade / CGPA (e.g. 9.45 / 94%)"
              value={academicGrade}
              onChange={(e) => setAcademicGrade(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />

            <input
              type="number"
              placeholder="Start Year"
              value={academicStartYear}
              onChange={(e) => setAcademicStartYear(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />

            <input
              type="number"
              placeholder="End Year (or Expected)"
              value={academicEndYear}
              onChange={(e) => setAcademicEndYear(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />

            <div className={`border rounded-2xl px-5 py-3 flex flex-col justify-center gap-2 md:col-span-2 transition ${
              themeMode === "dark" ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200"
            }`}>
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5">Transcript / Marksheet Proof (PDF / Image)</label>
              <div className="flex items-center gap-4 mt-1">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => handleFileUpload(e, setAcademicAttachment, "Academic Proof")}
                  className="hidden"
                  id="academic-file-input"
                />
                {!academicAttachment ? (
                  <label
                    htmlFor="academic-file-input"
                    className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-5 py-2 rounded-lg cursor-pointer text-xs font-bold transition"
                  >
                    {uploadingField === "Academic Proof" ? "Uploading..." : "Upload Proof Document"}
                  </label>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs text-[#781c1c] font-bold bg-[#781c1c]/10 px-3 py-1.5 rounded-xl border border-[#781c1c]/20">
                      <FileText size={14} /> Document Attached
                    </span>
                    <button onClick={() => setAcademicAttachment("")} className="text-xs text-red-400 font-semibold underline">Remove</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end mb-6">
            {editingAcademicId && (
              <button onClick={cancelEditAcademicRecord} className="px-6 py-2.5 border border-red-500/20 text-red-400 rounded-xl font-bold transition text-xs">Cancel</button>
            )}
            <button onClick={addAcademicRecord} className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-6 py-2.5 rounded-xl font-bold transition text-xs">
              {editingAcademicId ? "Update Record" : "Add Record"}
            </button>
          </div>

          {/* List */}
          <div className="space-y-4">
            {academicRecords.map((rec) => (
              <div key={rec.id} className={`border rounded-2xl p-5 relative group transition ${
                themeMode === "dark" ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-bold text-base">{rec.degree} in {rec.fieldOfStudy}</h4>
                    <p className="text-xs opacity-75 mt-1">{rec.institution}</p>
                    <p className="text-[10px] opacity-50 mt-1 font-semibold">Duration: {rec.startYear} - {rec.endYear} · Grade: {rec.grade || "N/A"}</p>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                    <button onClick={() => startEditAcademicRecord(rec)} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10"><Edit size={14} /></button>
                    <button onClick={() => deleteAcademicRecord(rec.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>
                  </div>
                </div>
                {rec.attachmentUrl && (
                  <a href={rec.attachmentUrl} target="_blank" className="inline-flex items-center gap-1 text-[10px] text-[#781c1c] hover:underline font-bold mt-3">
                    <ExternalLink size={10} /> View Proof Document
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ==========================================
            SECTION 5: ACHIEVEMENTS
            ========================================== */}
        <div id="achievements-section" className={`border rounded-3xl p-8 transition duration-300 ${
          themeMode === "dark" ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <h3 className="font-serif text-2xl font-black mb-4 flex items-center gap-2 text-[#18233c] border-b border-[#781c1c]/10 pb-3">
            <Trophy size={22} /> Section 5: Achievements
          </h3>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              placeholder="Achievement / Award Title"
              value={achievementTitle}
              onChange={(e) => setAchievementTitle(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />

            <select
              value={achievementCategory}
              onChange={(e) => setAchievementCategory(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-[#0b0b0f] border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            >
              <option value="Scholarships">Scholarships</option>
              <option value="Ranks">Ranks</option>
              <option value="Awards">Awards</option>
              <option value="Others">Others</option>
            </select>

            <input
              type="date"
              value={achievementDate}
              onChange={(e) => setAchievementDate(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />

            <div className={`border rounded-2xl px-5 py-3 flex flex-col justify-center gap-2 transition ${
              themeMode === "dark" ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200"
            }`}>
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5">Certificate / Proof File (PDF / Image)</label>
              <div className="flex items-center gap-4 mt-1">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => handleFileUpload(e, setAchievementUrl, "Achievement")}
                  className="hidden"
                  id="achievement-upload"
                />
                {!achievementUrl ? (
                  <label
                    htmlFor="achievement-upload"
                    className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-5 py-2 rounded-lg cursor-pointer text-xs font-bold transition"
                  >
                    {uploadingField === "Achievement" ? "Uploading..." : "Upload Certificate"}
                  </label>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs text-[#781c1c] font-bold bg-[#781c1c]/10 px-3 py-1.5 rounded-xl border border-[#781c1c]/20">
                      <FileText size={14} /> Uploaded
                    </span>
                    <button onClick={() => setAchievementUrl("")} className="text-xs text-red-400 font-semibold underline">Remove</button>
                  </div>
                )}
              </div>
            </div>

            <textarea
              placeholder="Description of the award, ranking, or scholarship conditions..."
              value={achievementDescription}
              onChange={(e) => setAchievementDescription(e.target.value)}
              className={`md:col-span-2 border rounded-xl px-4 py-3 text-sm outline-none min-h-[100px] transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />
          </div>

          <div className="flex gap-2 justify-end mb-6">
            {editingAchId && (
              <button onClick={cancelEditAchievement} className="px-6 py-2.5 border border-red-500/20 text-red-400 rounded-xl font-bold transition text-xs">Cancel</button>
            )}
            <button onClick={addAchievement} className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-6 py-2.5 rounded-xl font-bold transition text-xs">
              {editingAchId ? "Update Achievement" : "Add Achievement"}
            </button>
          </div>

          {/* List */}
          <div className="grid md:grid-cols-2 gap-4">
            {achievements.map((ach) => (
              <div key={ach.id} className={`border rounded-2xl p-5 relative group transition ${
                themeMode === "dark" ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full font-mono bg-[#781c1c]/10 text-[#781c1c] border border-[#781c1c]/20 text-[9px] font-bold uppercase mb-2">
                      {ach.category}
                    </span>
                    <h4 className="font-bold text-base leading-tight">{ach.title}</h4>
                    <p className="text-[10px] opacity-50 mt-1 font-semibold">{ach.achievementDate ? new Date(ach.achievementDate).toLocaleDateString() : ""}</p>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                    <button onClick={() => startEditAchievement(ach)} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10"><Edit size={14} /></button>
                    <button onClick={() => deleteAchievement(ach.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-xs opacity-60 mt-3 whitespace-pre-line leading-relaxed">{ach.description}</p>
                {ach.achievementUrl && (
                  <a href={ach.achievementUrl} target="_blank" className="inline-flex items-center gap-1 text-[10px] text-[#781c1c] hover:underline font-bold mt-3">
                    <ExternalLink size={10} /> View Certificate Proof
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ==========================================
            SECTION 6: PROJECTS & RESEARCH
            ========================================== */}
        <div id="projects-research-section" className={`border rounded-3xl p-8 transition duration-300 ${
          themeMode === "dark" ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <h3 className="font-serif text-2xl font-black mb-4 flex items-center gap-2 text-[#18233c] border-b border-[#781c1c]/10 pb-3">
            <GitBranch size={22} /> Section 6: Projects & Research
          </h3>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              placeholder="Title of Project / Publication"
              value={projTitle}
              onChange={(e) => setProjTitle(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />

            <select
              value={projCategory}
              onChange={(e) => setProjCategory(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-[#0b0b0f] border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            >
              <option value="Academic projects">Academic projects</option>
              <option value="Internships or industry collaborations projects">Internships or industry collaborations projects</option>
              <option value="Publications">Publications</option>
              <option value="Conference presentations">Conference presentations</option>
              <option value="Others">Others</option>
            </select>

            <input
              type="text"
              placeholder="Technologies used / Conference details"
              value={projTechnologies}
              onChange={(e) => setProjTechnologies(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />

            <input
              type="text"
              placeholder="Github / Paper / Live URL"
              value={projUrl}
              onChange={(e) => setProjUrl(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />

            {(projCategory === "Publications" || projCategory === "Conference presentations") && (
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs opacity-60">Published/Presented Date</label>
                <input
                  type="date"
                  value={projDate}
                  onChange={(e) => setProjDate(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                />
              </div>
            )}

            <textarea
              placeholder="Abstract / Detailed Description of project features, research methodology and outcomes..."
              value={projDescription}
              onChange={(e) => setProjDescription(e.target.value)}
              className={`md:col-span-2 border rounded-xl px-4 py-3 text-sm outline-none min-h-[120px] transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />
          </div>

          <div className="flex gap-2 justify-end mb-6">
            {editingProjId && (
              <button onClick={cancelEditProj} className="px-6 py-2.5 border border-red-500/20 text-red-400 rounded-xl font-bold transition text-xs">Cancel</button>
            )}
            <button onClick={addProjectOrResearch} className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-6 py-2.5 rounded-xl font-bold transition text-xs">
              {editingProjId ? "Update Entry" : "Add Entry"}
            </button>
          </div>

          {/* List */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Render Projects */}
            {projects.map((proj) => (
              <div key={`p-${proj.id}`} className={`border rounded-2xl p-5 relative group transition ${
                themeMode === "dark" ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full font-mono bg-[#781c1c]/10 text-[#781c1c] border border-[#781c1c]/20 text-[9px] font-bold uppercase mb-2">
                      {proj.category || "Projects"}
                    </span>
                    <h4 className="font-bold text-base leading-tight">{proj.title}</h4>
                    <p className="text-[10px] opacity-50 mt-1 font-semibold">Tech: {proj.technologies}</p>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                    <button onClick={() => startEditProj(proj, proj.category || "Academic projects")} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10"><Edit size={14} /></button>
                    <button onClick={() => deleteProjectRecord(proj.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-xs opacity-60 mt-3 whitespace-pre-line leading-relaxed">{proj.description}</p>
                {(proj.githubUrl || proj.liveUrl) && (
                  <a href={proj.githubUrl || proj.liveUrl} target="_blank" className="inline-flex items-center gap-1 text-[10px] text-[#781c1c] hover:underline font-bold mt-3">
                    <ExternalLink size={10} /> View Project Link
                  </a>
                )}
              </div>
            ))}

            {/* Render Research Papers */}
            {researchPapers.map((paper) => (
              <div key={`r-${paper.id}`} className={`border rounded-2xl p-5 relative group transition ${
                themeMode === "dark" ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full font-mono bg-[#781c1c]/10 text-[#781c1c] border border-[#781c1c]/20 text-[9px] font-bold uppercase mb-2">
                      {paper.category || "Publications"}
                    </span>
                    <h4 className="font-bold text-base leading-tight">{paper.title}</h4>
                    <p className="text-[10px] opacity-50 mt-1 font-semibold">{paper.conference} · {paper.publishedDate ? new Date(paper.publishedDate).toLocaleDateString() : ""}</p>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                    <button onClick={() => startEditProj(paper, paper.category || "Publications")} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10"><Edit size={14} /></button>
                    <button onClick={() => deleteResearchRecord(paper.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-xs opacity-60 mt-3 whitespace-pre-line leading-relaxed">{paper.abstract}</p>
                {paper.paperUrl && (
                  <a href={paper.paperUrl} target="_blank" className="inline-flex items-center gap-1 text-[10px] text-[#781c1c] hover:underline font-bold mt-3">
                    <ExternalLink size={10} /> View Research Publication
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ==========================================
            SECTION 7: SKILLS
            ========================================== */}
        <div id="skills-section" className={`border rounded-3xl p-8 transition duration-300 ${
          themeMode === "dark" ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <h3 className="font-serif text-2xl font-black mb-4 flex items-center gap-2 text-[#18233c] border-b border-[#781c1c]/10 pb-3">
            <Code size={22} /> Section 7: Skills
          </h3>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <input
              type="text"
              placeholder="Skill Name (e.g. React.js / Public Speaking)"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />

            <select
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-[#0b0b0f] border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            >
              <option value="Beginner">Beginner (Level ~35%)</option>
              <option value="Intermediate">Intermediate (Level ~65%)</option>
              <option value="Advanced">Advanced (Level ~85%)</option>
              <option value="Expert">Expert (Level ~95%)</option>
            </select>

            <select
              value={skillCategory}
              onChange={(e) => setSkillCategory(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-[#0b0b0f] border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            >
              <option value="Subject-specific skills">Subject-specific skills</option>
              <option value="Soft skills">Soft skills</option>
              <option value="Technical skills">Technical skills</option>
            </select>
          </div>

          <div className="flex gap-2 justify-end mb-6">
            {editingSkillId && (
              <button onClick={cancelEditSkill} className="px-6 py-2.5 border border-red-500/20 text-red-400 rounded-xl font-bold transition text-xs">Cancel</button>
            )}
            <button onClick={addSkill} className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-6 py-2.5 rounded-xl font-bold transition text-xs">
              {editingSkillId ? "Update Skill" : "Add Skill"}
            </button>
          </div>

          {/* List */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((skill) => (
              <div key={skill.id} className={`border rounded-2xl p-5 relative group transition ${
                themeMode === "dark" ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full font-mono bg-[#781c1c]/10 text-[#781c1c] border border-[#781c1c]/20 text-[8px] font-bold uppercase mb-2">
                      {skill.category || "Skills"}
                    </span>
                    <h4 className="font-bold text-sm">{skill.name}</h4>
                    <p className="text-[10px] opacity-60 mt-1">{skill.level}</p>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                    <button onClick={() => startEditSkill(skill)} className="p-1 rounded-lg text-blue-400 hover:bg-blue-500/10"><Edit size={12} /></button>
                    <button onClick={() => deleteSkill(skill.id)} className="p-1 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ==========================================
            SECTION 8: LICENSES & CERTIFICATIONS
            ========================================== */}
        <div id="licenses-certifications-section" className={`border rounded-3xl p-8 transition duration-300 ${
          themeMode === "dark" ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <h3 className="font-serif text-2xl font-black mb-4 flex items-center gap-2 text-[#18233c] border-b border-[#781c1c]/10 pb-3">
            <Award size={22} /> Section 8: Licenses & Certifications
          </h3>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              placeholder="Certification Title / Course Title"
              value={certificationTitle}
              onChange={(e) => setCertificationTitle(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />

            <input
              type="text"
              placeholder="Issuer (e.g. AWS / Coursera / Google)"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />

            <select
              value={certCategory}
              onChange={(e) => setCertCategory(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-[#0b0b0f] border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            >
              <option value="Licenses">Licenses</option>
              <option value="Online courses">Online courses</option>
              <option value="Workshops">Workshops</option>
              <option value="Conference">Conference</option>
              <option value="Others">Others</option>
            </select>

            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />

            <div className={`border rounded-2xl px-5 py-3 flex flex-col justify-center gap-2 md:col-span-2 transition ${
              themeMode === "dark" ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200"
            }`}>
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5">Certificate PDF / Image Proof</label>
              <div className="flex items-center gap-4 mt-1">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => handleFileUpload(e, setCertificateUrl, "Certificate")}
                  className="hidden"
                  id="certificate-file-upload"
                />
                {!certificateUrl ? (
                  <label
                    htmlFor="certificate-file-upload"
                    className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-5 py-2 rounded-lg cursor-pointer text-xs font-bold transition"
                  >
                    {uploadingField === "Certificate" ? "Uploading..." : "Upload Certificate"}
                  </label>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs text-[#781c1c] font-bold bg-[#781c1c]/10 px-3 py-1.5 rounded-xl border border-[#781c1c]/20">
                      <FileText size={14} /> Certificate Loaded
                    </span>
                    <button onClick={() => setCertificateUrl("")} className="text-xs text-red-400 font-semibold underline">Remove</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end mb-6">
            {editingCertId && (
              <button onClick={cancelEditCertification} className="px-6 py-2.5 border border-red-500/20 text-red-400 rounded-xl font-bold transition text-xs">Cancel</button>
            )}
            <button onClick={addCertification} className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-6 py-2.5 rounded-xl font-bold transition text-xs">
              {editingCertId ? "Update Certificate" : "Add Certificate"}
            </button>
          </div>

          {/* List */}
          <div className="grid md:grid-cols-2 gap-4">
            {certifications.map((cert) => (
              <div key={cert.id} className={`border rounded-2xl p-5 relative group transition ${
                themeMode === "dark" ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full font-mono bg-[#781c1c]/10 text-[#781c1c] border border-[#781c1c]/20 text-[9px] font-bold uppercase mb-2">
                      {cert.category || "Certifications"}
                    </span>
                    <h4 className="font-bold text-base leading-tight">{cert.title}</h4>
                    <p className="text-xs opacity-75 mt-1">{cert.issuer}</p>
                    <p className="text-[10px] opacity-50 mt-1 font-semibold">{cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : ""}</p>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                    <button onClick={() => startEditCertification(cert)} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10"><Edit size={14} /></button>
                    <button onClick={() => deleteCertification(cert.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>
                  </div>
                </div>
                {cert.certificateUrl && (
                  <a href={cert.certificateUrl} target="_blank" className="inline-flex items-center gap-1 text-[10px] text-[#781c1c] hover:underline font-bold mt-3">
                    <ExternalLink size={10} /> View Certificate Document
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ==========================================
            SECTION 9: LANGUAGES KNOWN
            ========================================== */}
        <div id="languages-section" className={`border rounded-3xl p-8 transition duration-300 ${
          themeMode === "dark" ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <h3 className="font-serif text-2xl font-black mb-4 flex items-center gap-2 text-[#18233c] border-b border-[#781c1c]/10 pb-3">
            <Globe size={22} /> Section 9: Languages known
          </h3>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5">List the languages you know (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. English (Fluent), Tamil (Native), Hindi (Intermediate)"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={saveProfile}
              className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-6 py-2.5 rounded-xl font-bold transition"
            >
              Save Languages
            </button>
          </div>
        </div>

        {/* ==========================================
            SECTION 10: TEST SCORES
            ========================================== */}
        <div id="test-scores-section" className={`border rounded-3xl p-8 transition duration-300 ${
          themeMode === "dark" ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <h3 className="font-serif text-2xl font-black mb-4 flex items-center gap-2 text-[#18233c] border-b border-[#781c1c]/10 pb-3">
            <Award size={22} /> Section 10: Test Scores
          </h3>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5">Enter standardized test scores (IELTS, GRE, GATE, TOEFL, etc.)</label>
            <textarea
              placeholder="e.g. IELTS Academic: 8.0 Band, GRE: 325 (Quant: 168, Verbal: 157, AWA: 4.5)"
              value={testScores}
              onChange={(e) => setTestScores(e.target.value)}
              className={`w-full border rounded-xl px-4 py-3 text-sm outline-none min-h-[80px] transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={saveProfile}
              className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-6 py-2.5 rounded-xl font-bold transition"
            >
              Save Test Scores
            </button>
          </div>
        </div>

        {/* ==========================================
            SECTION 11: PATENTS
            ========================================== */}
        <div id="patents-section" className={`border rounded-3xl p-8 transition duration-300 ${
          themeMode === "dark" ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <h3 className="font-serif text-2xl font-black mb-4 flex items-center gap-2 text-[#18233c] border-b border-[#781c1c]/10 pb-3">
            <FileText size={22} /> Section 11: Patents
          </h3>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5">List any patents filed, published, or granted</label>
            <textarea
              placeholder="e.g. Patent Title: Smart Agricultural Watering System, App No: 20264102931A (Published 2026, Indian Patent Office)"
              value={patents}
              onChange={(e) => setPatents(e.target.value)}
              className={`w-full border rounded-xl px-4 py-3 text-sm outline-none min-h-[80px] transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={saveProfile}
              className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-6 py-2.5 rounded-xl font-bold transition"
            >
              Save Patents
            </button>
          </div>
        </div>

        {/* ==========================================
            SECTION 12: OTHER MEDIA HANDLES
            ========================================== */}
        <div id="media-handles-section" className={`border rounded-3xl p-8 transition duration-300 ${
          themeMode === "dark" ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <h3 className="font-serif text-2xl font-black mb-4 flex items-center gap-2 text-[#18233c] border-b border-[#781c1c]/10 pb-3">
            <Link size={22} /> Section 12: Other Media handles
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5">Instagram Handle / URL</label>
              <input
                type="text"
                placeholder="https://instagram.com/username"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                  themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                }`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5">Blog Website URL</label>
              <input
                type="text"
                placeholder="https://medium.com/@username or personal blog"
                value={blogUrl}
                onChange={(e) => setBlogUrl(e.target.value)}
                className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                  themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                }`}
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5">Other handles / URLs (e.g. Behance, YouTube, GitHub, Twitter)</label>
              <input
                type="text"
                placeholder="YouTube: channel_url, Twitter: twitter_url, etc."
                value={otherHandles}
                onChange={(e) => setOtherHandles(e.target.value)}
                className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                  themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                }`}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={saveProfile}
              className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-6 py-2.5 rounded-xl font-bold transition"
            >
              Save Media Handles
            </button>
          </div>
        </div>

        {/* ==========================================
            SECTION 13: RESUME
            ========================================== */}
        <div id="resume-section" className={`border rounded-3xl p-8 transition duration-300 ${
          themeMode === "dark" ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <h3 className="font-serif text-2xl font-black mb-4 flex items-center gap-2 text-[#18233c] border-b border-[#781c1c]/10 pb-3">
            <FileText size={22} /> Section 13: Resume
          </h3>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              placeholder="Resume Title (e.g. Software Engineer Resume 2026)"
              value={resumeTitle}
              onChange={(e) => setResumeTitle(e.target.value)}
              className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />

            <div className={`border rounded-2xl px-5 py-3 flex flex-col justify-center gap-2 transition ${
              themeMode === "dark" ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200"
            }`}>
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5">Upload Resume (PDF only)</label>
              <div className="flex items-center gap-4 mt-1">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload(e, setResumeUrl, "Resume File")}
                  className="hidden"
                  id="resume-file-upload-input"
                />
                {!resumeUrl ? (
                  <label
                    htmlFor="resume-file-upload-input"
                    className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-5 py-2 rounded-lg cursor-pointer text-xs font-bold transition"
                  >
                    {uploadingField === "Resume File" ? "Uploading..." : "Upload PDF"}
                  </label>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs text-[#781c1c] font-bold bg-[#781c1c]/10 px-3 py-1.5 rounded-xl border border-[#781c1c]/20">
                      <FileText size={14} /> Resume PDF Attached
                    </span>
                    <button onClick={() => setResumeUrl("")} className="text-xs text-red-400 font-semibold underline">Remove</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end mb-6">
            {editingResumeId && (
              <button onClick={cancelEditResume} className="px-6 py-2.5 border border-red-500/20 text-red-400 rounded-xl font-bold transition text-xs">Cancel</button>
            )}
            <button onClick={addResume} className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-6 py-2.5 rounded-xl font-bold transition text-xs">
              {editingResumeId ? "Update Resume" : "Save Resume"}
            </button>
          </div>

          {/* List */}
          <div className="space-y-3">
            {resumes.map((res) => (
              <div key={res.id} className={`border rounded-2xl p-4 flex justify-between items-center transition ${
                themeMode === "dark" ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex items-center gap-3">
                  <FileText className="text-[#781c1c] animate-pulse" size={20} />
                  <div>
                    <h5 className="font-bold text-sm">{res.resumeTitle}</h5>
                    <a href={res.resumeUrl} target="_blank" className="text-[10px] text-[#781c1c] hover:underline flex items-center gap-0.5 mt-0.5">
                      <ExternalLink size={10} /> View / Download Document
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => startEditResume(res)} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10"><Edit size={14} /></button>
                  <button onClick={() => deleteResume(res.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ==========================================
            AI ADVISOR SECTION
            ========================================== */}
        <div id="ai-advisor-section" className={`border rounded-3xl p-8 transition duration-300 ${
          themeMode === "dark" ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-[#781c1c] to-[#18233c]">
            <Sparkles size={22} className="text-[#781c1c]" /> AI Career Advisor
          </h3>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Generate SOP */}
            <div className={`border rounded-2xl p-6 transition ${
              themeMode === "dark" ? "bg-white/[0.01] border-white/5" : "bg-slate-50 border-slate-200"
            }`}>
              <h4 className="font-bold text-sm mb-4">Generate SOP (AI Generator)</h4>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Target career field (e.g. ML Engineer)"
                  value={targetCareer}
                  onChange={(e) => setTargetCareer(e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                />

                <select
                  value={sopTone}
                  onChange={(e) => setSopTone(e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition ${
                    themeMode === "dark" ? "bg-[#0b0b0f] border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                >
                  <option value="Academic">Academic Tone</option>
                  <option value="Professional">Professional Tone</option>
                  <option value="Startup / Creative">Startup / Creative Tone</option>
                </select>

                <button
                  onClick={handleGenerateSop}
                  disabled={generatingSop || !targetCareer}
                  className="w-full bg-[#781c1c] hover:bg-[#5f1515] text-white py-3 rounded-xl font-bold text-xs transition"
                >
                  {generatingSop ? "Generating Statement of Purpose..." : "Generate SOP via Gemini AI"}
                </button>

                {generatedSop && (
                  <div className="mt-4">
                    <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Result Statement of Purpose:</label>
                    <textarea
                      readOnly
                      value={generatedSop}
                      className="w-full border rounded-xl p-3 text-xs bg-[#0d0d12]/40 border-white/10 text-gray-300 min-h-[150px] font-mono mt-2"
                    />
                    <button
                      onClick={() => {
                        setSop(generatedSop);
                        alert("SOP copied to your profile! Save to commit changes.");
                      }}
                      className="mt-2 text-xs text-[#781c1c] hover:underline font-bold"
                    >
                      Use this SOP in my profile
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* AI Portfolio Readiness */}
            <div className={`border rounded-2xl p-6 transition ${
              themeMode === "dark" ? "bg-white/[0.01] border-white/5" : "bg-slate-50 border-slate-200"
            }`}>
              <h4 className="font-bold text-sm mb-4">AI Readiness & Skill Gap Analysis</h4>
              {loadingAi ? (
                <div className="text-xs text-gray-400 animate-pulse">Analyzing portfolio variables...</div>
              ) : aiAnalysis ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-60">Profile Completeness:</span>
                    <span className="text-sm font-bold text-[#781c1c]">{aiAnalysis.profileCompleteness}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-60">Skill Match:</span>
                    <span className="text-sm font-bold text-emerald-400">{aiAnalysis.skillMatchPercentage}%</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    <strong>Missing Skills:</strong> {aiAnalysis.missingSkills?.join(", ") || "None"}
                  </div>
                  <button
                    onClick={downloadReadinessReport}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs transition mt-4"
                  >
                    Download Detailed PDF/Text Report
                  </button>
                </div>
              ) : (
                <div className="text-xs text-gray-400">Save some profile properties and achievements to get an AI career fit feedback analysis report.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}