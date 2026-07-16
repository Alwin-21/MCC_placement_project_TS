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
  ChevronRight,
  Menu,
  X,
  Copy,
  Sliders
} from "lucide-react";
import api from "@/services/api";
import { useTheme } from "@/hooks/useTheme";
import { parseImageAdjustments } from "@/utils/image";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Theme states
  const [themeMode, toggleThemeMode] = useTheme();
  const [selectedTheme, setSelectedTheme] = useState("Academic");
  const [availableThemes, setAvailableThemes] = useState<any[]>([]);

  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  // File uploading loader
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // AI Advisor states
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [generatedSop, setGeneratedSop] = useState("");
  const [generatingSop, setGeneratingSop] = useState(false);
  const [sopTone, setSopTone] = useState("Academic");
  const [targetCareer, setTargetCareer] = useState("");
  const [successBanner, setSuccessBanner] = useState<{ section: string; message: string } | null>(null);

  const showSuccessBanner = (section: string, message: string) => {
    setSuccessBanner({ section, message });
    setTimeout(() => {
      setSuccessBanner(null);
    }, 3500);
  };

  // Photo adjustments & preview states
  const [showPhotoAdjustModal, setShowPhotoAdjustModal] = useState(false);
  const [showPhotoPreviewModal, setShowPhotoPreviewModal] = useState(false);
  const [adjustScale, setAdjustScale] = useState(1);
  const [adjustRotate, setAdjustRotate] = useState(0);
  const [adjustPosX, setAdjustPosX] = useState(50);
  const [adjustPosY, setAdjustPosY] = useState(50);
  const [adjustFit, setAdjustFit] = useState("cover");

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
  const [academicDegreeType, setAcademicDegreeType] = useState("");
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
  const [languageList, setLanguageList] = useState<{ name: string; level: string }[]>([]);
  const [newLanguageName, setNewLanguageName] = useState("");
  const [newLanguageLevel, setNewLanguageLevel] = useState("Fluent");
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

  // Copy Link State
  const [copiedIdLink, setCopiedIdLink] = useState(false);
  const [copiedSlugLink, setCopiedSlugLink] = useState(false);

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
      // Theme is now handled by the shared useTheme hook (mcc-theme key)
    }

    loadAllData();
  }, []);

  const fetchUserMe = async () => {
    try {
      const res = await api.get("/Users/me");
      if (res.data) {
        setUser(res.data);
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          localStorage.setItem("user", JSON.stringify({ ...parsed, ...res.data }));
        }
      }
    } catch (err) {
      console.error("Failed to load user me", err);
    }
  };

  const loadAllData = () => {
    fetchUserMe();
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
  // toggleThemeMode is now provided by useTheme hook — no local implementation needed

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
        
        const langStr = res.data.languages || "";
        setLanguages(langStr);
        if (langStr) {
          const parsed = langStr.split(",").map((item: string) => {
            const trimmed = item.trim();
            const match = trimmed.match(/^([^(]+)\s*\(([^)]+)\)$/);
            if (match) {
              return { name: match[1].trim(), level: match[2].trim() };
            }
            return { name: trimmed, level: "Fluent" };
          });
          setLanguageList(parsed);
        } else {
          setLanguageList([]);
        }

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

  const openPhotoAdjustModal = () => {
    if (!profileImageUrl) return;
    try {
      const paramsIndex = profileImageUrl.indexOf("?");
      if (paramsIndex !== -1) {
        const searchParams = new URLSearchParams(profileImageUrl.substring(paramsIndex + 1));
        setAdjustScale(parseFloat(searchParams.get("scale") || "1"));
        setAdjustRotate(parseInt(searchParams.get("rotate") || "0", 10));
        setAdjustPosX(parseInt(searchParams.get("x") || "50", 10));
        setAdjustPosY(parseInt(searchParams.get("y") || "50", 10));
        setAdjustFit(searchParams.get("fit") || "cover");
      } else {
        setAdjustScale(1);
        setAdjustRotate(0);
        setAdjustPosX(50);
        setAdjustPosY(50);
        setAdjustFit("cover");
      }
    } catch (e) {
      console.error("Failed to parse image adjustments", e);
    }
    setShowPhotoAdjustModal(true);
  };

  const applyPhotoAdjustments = () => {
    const cleanUrl = profileImageUrl.split("?")[0];
    const updatedUrl = `${cleanUrl}?scale=${adjustScale}&rotate=${adjustRotate}&x=${adjustPosX}&y=${adjustPosY}&fit=${adjustFit}`;
    setProfileImageUrl(updatedUrl);
    setShowPhotoAdjustModal(false);
  };

  const saveHeaderSettings = async () => {
    if (!fullName.trim()) {
      alert("Full Name is a required field.");
      return;
    }
    if (!course.trim()) {
      alert("Course is a required field.");
      return;
    }
    if (!phone.trim()) {
      alert("Phone Number is a required field.");
      return;
    }
    try {
      await api.post("/Profiles", {
        fullName,
        profileImageUrl,
        course,
        yearOfStudy,
        currentLocation,
        phone,
        linkedInUrl
      });

      if (user) {
        const updated = { ...user, fullName };
        localStorage.setItem("user", JSON.stringify(updated));
        setUser(updated);
      }

      showSuccessBanner("header", "Header & Profile Settings Saved Successfully!");
      loadAllData();
    } catch (err: any) {
      console.error(err);
      alert(`Failed to save header settings: ${err?.response?.data || err?.message}`);
    }
  };

  const saveAboutSettings = async () => {
    try {
      await api.post("/Profiles", {
        bio,
        personalStory,
        sop
      });

      showSuccessBanner("about", "About Section Details Saved Successfully!");
      loadAllData();
    } catch (err: any) {
      console.error(err);
      alert(`Failed to save about details: ${err?.response?.data || err?.message}`);
    }
  };

  const saveLanguagesSettings = async () => {
    try {
      await api.post("/Profiles", {
        languages
      });

      showSuccessBanner("languages", "Languages Saved Successfully!");
      loadAllData();
    } catch (err: any) {
      console.error(err);
      alert(`Failed to save languages: ${err?.response?.data || err?.message}`);
    }
  };

  const saveTestScoresSettings = async () => {
    try {
      await api.post("/Profiles", {
        testScores
      });

      showSuccessBanner("testScores", "Test Scores Saved Successfully!");
      loadAllData();
    } catch (err: any) {
      console.error(err);
      alert(`Failed to save test scores: ${err?.response?.data || err?.message}`);
    }
  };

  const savePatentsSettings = async () => {
    try {
      await api.post("/Profiles", {
        patents
      });

      showSuccessBanner("patents", "Patents Saved Successfully!");
      loadAllData();
    } catch (err: any) {
      console.error(err);
      alert(`Failed to save patents: ${err?.response?.data || err?.message}`);
    }
  };

  const saveMediaHandlesSettings = async () => {
    try {
      await api.post("/Profiles", {
        instagramUrl,
        blogUrl,
        otherHandles
      });

      showSuccessBanner("mediaHandles", "Media Handles Saved Successfully!");
      loadAllData();
    } catch (err: any) {
      console.error(err);
      alert(`Failed to save media handles: ${err?.response?.data || err?.message}`);
    }
  };

  const addLanguage = () => {
    if (!newLanguageName.trim()) {
      alert("Please enter a language name.");
      return;
    }
    if (languageList.some(l => l.name.toLowerCase() === newLanguageName.trim().toLowerCase())) {
      alert("This language is already added.");
      return;
    }
    const updatedList = [...languageList, { name: newLanguageName.trim(), level: newLanguageLevel }];
    setLanguageList(updatedList);
    const serialized = updatedList.map(item => `${item.name} (${item.level})`).join(", ");
    setLanguages(serialized);
    setNewLanguageName("");
    setNewLanguageLevel("Fluent");
  };

  const removeLanguage = (indexToRemove: number) => {
    const updatedList = languageList.filter((_, idx) => idx !== indexToRemove);
    setLanguageList(updatedList);
    const serialized = updatedList.map(item => `${item.name} (${item.level})`).join(", ");
    setLanguages(serialized);
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
    if (!expTitle.trim()) {
      alert("Job Title / Role is a required field.");
      return;
    }
    if (!expCompany.trim()) {
      alert("Company / Organization is a required field.");
      return;
    }
    if (!expStartDate) {
      alert("Start Year is a required field.");
      return;
    }
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
        showSuccessBanner("experience", "Experience entry updated successfully!");
      } else {
        await api.post("/Experiences", payload);
        showSuccessBanner("experience", "Experience entry added successfully!");
      }
      cancelEditExperience();
      fetchExperiences();
      fetchAiAnalysis();
    } catch (err: any) {
      alert(`Failed to save experience: ${err?.response?.data || err?.message}`);
    }
  };

  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
    return "";
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    if (/^\d{4}$/.test(dateStr)) return dateStr;
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return dateStr;
  };

  const extractYearFromDate = (dateStr: string) => {
    if (!dateStr) return "";
    if (/^\d{4}$/.test(dateStr)) return dateStr;
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.getFullYear().toString();
    }
    return dateStr;
  };

  const startEditExperience = (item: any) => {
    setEditingExpId(item.id);
    setExpTitle(item.title);
    setExpCompany(item.company);
    setExpLocation(item.location);
    setExpDesc(item.description);
    setExpStartDate(extractYearFromDate(item.startDate));
    setExpEndDate(extractYearFromDate(item.endDate));
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
    if (!academicDegree.trim()) {
      alert("Degree is a required field.");
      return;
    }
    if (!academicInstitution.trim()) {
      alert("College / University Name is a required field.");
      return;
    }
    if (!academicGrade.trim()) {
      alert("Grade / CGPA is a required field.");
      return;
    }
    if (!academicStartYear) {
      alert("Start Year is a required field.");
      return;
    }
    if (!academicEndYear) {
      alert("End Year is a required field.");
      return;
    }
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
        showSuccessBanner("academic", "Academic Record updated successfully!");
      } else {
        await api.post("/AcademicRecords", payload);
        showSuccessBanner("academic", "Academic Record added successfully!");
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
    if (["10th Marksheet", "11th Marksheet", "12th Marksheet", "UG Marksheet", "PG Marksheet"].includes(item.degree)) {
      setAcademicDegreeType(item.degree);
    } else {
      setAcademicDegreeType("Other");
    }
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
    setAcademicDegreeType("");
    setAcademicField("");
    setAcademicGrade("");
    setAcademicStartYear("");
    setAcademicEndYear("");
    setAcademicAttachment("");
  };

  const deleteAcademicRecord = async (id: number) => {
    if (!confirm("Are you sure you want to delete this Academic Record?")) return;
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
    if (!achievementTitle.trim()) {
      alert("Achievement Title is a required field.");
      return;
    }
    if (!achievementDate) {
      alert("Achievement Year is a required field.");
      return;
    }
    const yearNum = parseInt(achievementDate, 10);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      alert("Please enter a valid 4-digit Achievement Year (e.g., 2025).");
      return;
    }
    try {
      const payload = {
        title: achievementTitle,
        description: achievementDescription,
        achievementUrl,
        achievementDate: achievementDate.length === 4 ? `${achievementDate}-01-01` : achievementDate,
        category: achievementCategory
      };

      if (editingAchId) {
        await api.put(`/Achievements/${editingAchId}`, payload);
        showSuccessBanner("achievement", "Achievement details updated successfully!");
      } else {
        await api.post("/Achievements", payload);
        showSuccessBanner("achievement", "Achievement details added successfully!");
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
    setAchievementDate(item.achievementDate ? new Date(item.achievementDate).getFullYear().toString() : "");
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
    if (!confirm("Are you sure you want to delete this Achievement?")) return;
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
    if (!projTitle.trim()) {
      alert("Project / Publication Title is a required field.");
      return;
    }
    const isResearch = projCategory === "Publications" || projCategory === "Conference presentations";
    if (isResearch && !projDate) {
      alert("Published/Presented Date is a required field for publications.");
      return;
    }
    if (!isResearch && !projTechnologies.trim()) {
      alert("Technologies used is a required field for projects.");
      return;
    }
    if (!projDescription.trim()) {
      alert(isResearch ? "Abstract is a required field." : "Description is a required field.");
      return;
    }
    try {
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
          showSuccessBanner("project", "Research paper details updated successfully!");
        } else {
          await api.post("/ResearchPapers", payload);
          showSuccessBanner("project", "Research paper details added successfully!");
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
          showSuccessBanner("project", "Project details updated successfully!");
        } else {
          await api.post("/Projects", payload);
          showSuccessBanner("project", "Project details added successfully!");
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
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await api.delete(`/Projects/${id}`);
      fetchProjects();
      fetchAiAnalysis();
    } catch (err: any) {
      alert(`Failed to delete: ${err?.response?.data || err?.message}`);
    }
  };

  const deleteResearchRecord = async (id: number) => {
    if (!confirm("Are you sure you want to delete this publication/research record?")) return;
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
    if (!skillName.trim()) {
      alert("Skill Name is a required field.");
      return;
    }
    try {
      const payload = {
        name: skillName,
        level: skillLevel,
        category: skillCategory
      };

      if (editingSkillId) {
        await api.put(`/Skills/${editingSkillId}`, payload);
        showSuccessBanner("skill", "Skill updated successfully!");
      } else {
        await api.post("/Skills", payload);
        showSuccessBanner("skill", "Skill added successfully!");
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
    if (!confirm("Are you sure you want to delete this skill?")) return;
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
    if (!certificationTitle.trim()) {
      alert("Certification Title is a required field.");
      return;
    }
    if (!issuer.trim()) {
      alert("Issuer is a required field.");
      return;
    }
    if (!issueDate) {
      alert("Issue Year is a required field.");
      return;
    }
    const yearNum = parseInt(issueDate, 10);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      alert("Please enter a valid 4-digit Issue Year (e.g., 2025).");
      return;
    }
    try {
      const payload = {
        title: certificationTitle,
        issuer,
        certificateUrl,
        issueDate: issueDate.length === 4 ? `${issueDate}-01-01` : issueDate,
        category: certCategory
      };

      if (editingCertId) {
        await api.put(`/Certifications/${editingCertId}`, payload);
        showSuccessBanner("certification", "Certification details updated successfully!");
      } else {
        await api.post("/Certifications", payload);
        showSuccessBanner("certification", "Certification details added successfully!");
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
    setIssueDate(item.issueDate ? new Date(item.issueDate).getFullYear().toString() : "");
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
    if (!confirm("Are you sure you want to delete this certification?")) return;
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
    if (!resumeTitle.trim()) {
      alert("Resume Display Name is a required field.");
      return;
    }
    if (!resumeUrl.trim()) {
      alert("Resume File / Link URL is a required field.");
      return;
    }
    try {
      const payload = {
        resumeTitle,
        resumeUrl
      };

      if (editingResumeId) {
        await api.put(`/Resumes/${editingResumeId}`, payload);
        showSuccessBanner("resume", "Resume document updated successfully!");
      } else {
        await api.post("/Resumes", payload);
        showSuccessBanner("resume", "Resume document saved successfully!");
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
    if (!confirm("Are you sure you want to delete this resume?")) return;
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
    // Disabled AI Adviser Section
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
    <div className={`h-screen h-[100dvh] overflow-hidden flex transition-colors duration-300 ${
      themeMode === "dark" ? "bg-[#0d0d12] text-white" : "bg-[#fcfaf6] text-[#0f172a]"
    }`}>
      
      {/* SIDEBAR NAVIGATION */}
      <div className={`w-72 border-r backdrop-blur-xl sticky top-0 h-screen flex-col transition-colors duration-300 shrink-0 hidden md:flex ${
        themeMode === "dark" ? "bg-[#09090d] border-white/5 text-white" : "bg-[#18233c] border-[#781c1c]/10 text-white shadow-xl"
      }`}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-white/20 shadow-md overflow-hidden p-0.5">
              <img src="/mcc-crest.png" className="w-full h-full object-contain" alt="MCC Crest" />
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
            <button
              onClick={() => window.location.href = "/dashboard/resumes"}
              className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${
                themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"
              } cursor-pointer`}
            >
              <Sparkles size={16} className="text-emerald-400" /> Resume Builder
            </button>

            {/* Portfolio Link in Sidebar */}
            <div className={`mx-2 my-2.5 p-3 rounded-xl border text-left ${
              themeMode === "dark" ? "bg-white/[0.03] border-white/10 text-slate-200" : "bg-white/10 border-white/10 text-slate-100"
            }`}>
              <span className="text-[9px] uppercase font-mono tracking-widest text-[#d4af37] font-bold block mb-1">
                Portfolio Link
              </span>
              <div className="text-[10px] font-mono break-all truncate opacity-85 mb-2">
                {typeof window !== "undefined" && user?.fullName
                  ? `${window.location.origin}/student/${user.registerNumber || user.fullName.replace(/\s+/g, "").toLowerCase()}`
                  : "http://localhost:3001/student/username"}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (typeof window !== "undefined" && user?.fullName) {
                      const slug = user.registerNumber || user.fullName.replace(/\s+/g, "").toLowerCase();
                      const link = `${window.location.origin}/student/${slug}`;
                      navigator.clipboard.writeText(link);
                      setCopiedSlugLink(true);
                      setTimeout(() => setCopiedSlugLink(false), 2000);
                    } else {
                      alert("Please save your Header details with your Full Name first.");
                    }
                  }}
                  className="bg-white/10 hover:bg-white/20 text-[9px] font-bold py-1 px-2 rounded-lg transition active:scale-95 flex items-center gap-1 cursor-pointer"
                >
                  {copiedSlugLink ? <CheckCircle size={10} className="text-emerald-400" /> : <Copy size={10} />}
                  {copiedSlugLink ? "Copied" : "Copy Link"}
                </button>
                <a
                  href={user?.fullName ? `/student/${user.registerNumber || user.fullName.replace(/\s+/g, "").toLowerCase()}` : "#"}
                  target="_blank"
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-350 text-[9px] font-bold py-1 px-2 rounded-lg transition flex items-center gap-1"
                >
                  <ExternalLink size={10} /> View
                </a>
              </div>
            </div>
            <button onClick={() => {
              if (user?.fullName) {
                const slug = user.registerNumber || user.fullName.replace(/\s+/g, "").toLowerCase();
                window.open(`/student/${slug}`, "_blank");
              } else {
                alert("Please save your Header details first.");
              }
            }} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"}`}>
              <Eye size={16} className="text-emerald-400" /> View Public Portfolio
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER SIDEBAR OVERLAY */}
      {showMobileNav && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-xs select-none">
          <div className={`w-72 flex flex-col p-5 animate-slideIn h-screen border-r ${
            themeMode === "dark" ? "bg-[#09090d] border-white/5 text-white" : "bg-[#18233c] border-[#781c1c]/10 text-white shadow-xl"
          }`}>
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-white/20 shadow-sm overflow-hidden shrink-0 p-0.5">
                  <img src="/mcc-crest.png" className="w-full h-full object-contain" alt="MCC Crest" />
                </div>
                <div>
                  <span className="font-serif font-black text-[10px] tracking-tight text-white block leading-none">
                    MADRAS CHRISTIAN
                  </span>
                  <span className="font-serif font-black text-[10px] tracking-tight text-white block mt-0.5 leading-none">
                    COLLEGE
                  </span>
                </div>
              </div>
              <button onClick={() => setShowMobileNav(false)} className="text-slate-400 hover:text-white cursor-pointer p-1">
                <X size={18} />
              </button>
            </div>
            
            <nav className="flex-1 py-4 space-y-1 overflow-y-auto scrollbar-thin">
              <button onClick={() => { scrollTo("header-section"); setShowMobileNav(false); }} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"} cursor-pointer`}>
                <User size={16} className="text-[#781c1c]" /> Header Section
              </button>
              <button onClick={() => { scrollTo("about-section"); setShowMobileNav(false); }} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"} cursor-pointer`}>
                <FileText size={16} className="text-[#781c1c]" /> About Section
              </button>
              <button onClick={() => { scrollTo("experience-section"); setShowMobileNav(false); }} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"} cursor-pointer`}>
                <Briefcase size={16} className="text-[#781c1c]" /> Experience
              </button>
              <button onClick={() => { scrollTo("academic-section"); setShowMobileNav(false); }} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"} cursor-pointer`}>
                <Award size={16} className="text-[#781c1c]" /> Academic Details
              </button>
              <button onClick={() => { scrollTo("achievements-section"); setShowMobileNav(false); }} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"} cursor-pointer`}>
                <Trophy size={16} className="text-[#781c1c]" /> Achievements
              </button>
              <button onClick={() => { scrollTo("projects-research-section"); setShowMobileNav(false); }} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"} cursor-pointer`}>
                <GitBranch size={16} className="text-[#781c1c]" /> Projects & Research
              </button>
              <button onClick={() => { scrollTo("skills-section"); setShowMobileNav(false); }} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"} cursor-pointer`}>
                <Code size={16} className="text-[#781c1c]" /> Skills
              </button>
              <button onClick={() => { scrollTo("licenses-certifications-section"); setShowMobileNav(false); }} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"} cursor-pointer`}>
                <Award size={16} className="text-[#781c1c]" /> Certifications
              </button>
              <button onClick={() => { scrollTo("languages-section"); setShowMobileNav(false); }} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"} cursor-pointer`}>
                <Globe size={16} className="text-[#781c1c]" /> Languages known
              </button>
              <button onClick={() => { scrollTo("test-scores-section"); setShowMobileNav(false); }} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"} cursor-pointer`}>
                <Award size={16} className="text-[#781c1c]" /> Test Scores
              </button>
              <button onClick={() => { scrollTo("patents-section"); setShowMobileNav(false); }} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"} cursor-pointer`}>
                <FileText size={16} className="text-[#781c1c]" /> Patents
              </button>
              <button onClick={() => { scrollTo("media-handles-section"); setShowMobileNav(false); }} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"} cursor-pointer`}>
                <Link size={16} className="text-[#781c1c]" /> Media Handles
              </button>
              <button onClick={() => { scrollTo("resume-section"); setShowMobileNav(false); }} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"} cursor-pointer`}>
                <FileText size={16} className="text-[#781c1c]" /> Resume
              </button>
              
              <div className="pt-4 border-t border-white/5 space-y-1">
                <button
                  onClick={() => { window.location.href = "/dashboard/resumes"; setShowMobileNav(false); }}
                  className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${
                    themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"
                  } cursor-pointer`}
                >
                  <Sparkles size={16} className="text-emerald-400" /> Resume Builder
                </button>

                {/* Portfolio Link in Sidebar */}
                <div className={`mx-2 my-2.5 p-3 rounded-xl border text-left ${
                  themeMode === "dark" ? "bg-white/[0.03] border-white/10 text-slate-200" : "bg-white/10 border-white/10 text-slate-100"
                }`}>
                  <span className="text-[9px] uppercase font-mono tracking-widest text-[#d4af37] font-bold block mb-1">
                    Portfolio Link
                  </span>
                  <div className="text-[10px] font-mono break-all truncate opacity-85 mb-2">
                    {typeof window !== "undefined" && user?.fullName
                      ? `${window.location.origin}/student/${user.registerNumber || user.fullName.replace(/\s+/g, "").toLowerCase()}`
                      : "http://localhost:3001/student/username"}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (typeof window !== "undefined" && user?.fullName) {
                          const slug = user.registerNumber || user.fullName.replace(/\s+/g, "").toLowerCase();
                          const link = `${window.location.origin}/student/${slug}`;
                          navigator.clipboard.writeText(link);
                          setCopiedSlugLink(true);
                          setTimeout(() => setCopiedSlugLink(false), 2000);
                        } else {
                          alert("Please save your Header details with your Full Name first.");
                        }
                      }}
                      className="bg-white/10 hover:bg-white/20 text-[9px] font-bold py-1 px-2 rounded-lg transition active:scale-95 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSlugLink ? <CheckCircle size={10} className="text-emerald-400" /> : <Copy size={10} />}
                      {copiedSlugLink ? "Copied" : "Copy Link"}
                    </button>
                    <a
                      href={user?.fullName ? `/student/${user.registerNumber || user.fullName.replace(/\s+/g, "").toLowerCase()}` : "#"}
                      target="_blank"
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-350 text-[9px] font-bold py-1 px-2 rounded-lg transition flex items-center gap-1"
                    >
                      <ExternalLink size={10} /> View
                    </a>
                  </div>
                </div>
                <button onClick={() => {
                  if (user?.fullName) {
                    const slug = user.registerNumber || user.fullName.replace(/\s+/g, "").toLowerCase();
                    window.open(`/student/${slug}`, "_blank");
                    setShowMobileNav(false);
                  } else {
                    alert("Please save your Header details first.");
                  }
                }} className={`w-full flex items-center gap-3 transition px-4 py-2.5 rounded-xl text-sm font-medium text-left ${themeMode === "dark" ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-white/10 text-slate-200 hover:text-white"} cursor-pointer`}>
                  <Eye size={16} className="text-emerald-400" /> View Public Portfolio
                </button>
              </div>
            </nav>
            <div className="pt-4 border-t border-white/10">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-left hover:bg-red-500/10 text-red-400 cursor-pointer">
                <LogOut size={16} /> Log Out
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setShowMobileNav(false)} />
        </div>
      )}

      {/* RIGHT CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* MOBILE TOP HEADER BAR */}
        <div className="sticky top-0 z-[49] md:hidden flex items-center justify-between p-4 bg-white/90 dark:bg-[#09090d]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/5 select-none shadow-md shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobileNav(true)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <span className="font-serif font-black text-[#18233c] dark:text-white tracking-tight text-xs uppercase">
              Dashboard Menu
            </span>
          </div>
        </div>

        {/* MAIN CONTAINER */}
        <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-8 space-y-10">

        {/* BANNER SHOWCASE */}
        <div className="relative rounded-3xl overflow-hidden h-36 md:h-44 bg-[#18233c] text-white flex items-end p-6 md:p-8 border border-amber-600/20 shadow-md mb-4">
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
            <h1 className="font-serif text-xl md:text-3xl font-black text-white mt-2 leading-tight">
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
                {profileImageUrl && (() => {
                  const imgDetails = parseImageAdjustments(profileImageUrl);
                  return (
                    <div className="flex items-center gap-3 flex-wrap">
                      <div 
                        className="w-10 h-10 rounded-full border border-[#781c1c] overflow-hidden flex items-center justify-center cursor-pointer"
                        onClick={() => setShowPhotoPreviewModal(true)}
                        title="Click to view full preview"
                      >
                        <img 
                          src={imgDetails.src} 
                          style={imgDetails.style} 
                          className="w-full h-full" 
                          alt="Preview" 
                        />
                      </div>
                      <button
                        type="button"
                        onClick={openPhotoAdjustModal}
                        className="p-2 bg-slate-800 dark:bg-white/5 hover:bg-slate-700 dark:hover:bg-white/10 rounded-xl text-white text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition border border-white/5"
                        title="Adjust Photo position / zoom / rotation"
                      >
                        <Sliders size={12} /> Adjust
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileImageUrl("")}
                        className="p-2 bg-red-950/40 border border-red-500/20 hover:bg-red-950/70 rounded-xl text-red-400 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition"
                        title="Delete profile image"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>            {/* Inputs */}
            {successBanner?.section === "header" && (
              <div className="md:col-span-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl mb-4 font-bold flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-600" />
                {successBanner.message}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5 flex flex-col">
                Full Name *
                <span className="block text-[9px] text-slate-400 font-normal normal-case mt-0.5">Enter your full student name</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Adithya Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                  themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                }`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5 flex flex-col">
                Course
                <span className="block text-[9px] text-slate-400 font-normal normal-case mt-0.5">Collected at registration</span>
              </label>
              <input
                type="text"
                disabled
                value={course}
                className="border rounded-xl px-4 py-3 text-sm outline-none bg-slate-100 border-slate-200 text-slate-455 cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5 flex flex-col">
                Year of Study *
                <span className="block text-[9px] text-slate-400 font-normal normal-case mt-0.5">Select current year</span>
              </label>
              <select
                required
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                className={`border rounded-xl px-4 py-3 text-sm outline-none transition cursor-pointer ${
                  themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                }`}
              >
                <option value="">Select Year</option>
                <option value="I Year">I Year</option>
                <option value="II Year">II Year</option>
                <option value="III Year">III Year</option>
                <option value="IV Year">IV Year</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5 flex flex-col">
                Current Location
                <span className="block text-[9px] text-slate-400 font-normal normal-case mt-0.5">City & State</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Chennai, Tamil Nadu"
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                  themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                }`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5 flex flex-col">
                Contact Email
                <span className="block text-[9px] text-slate-400 font-normal normal-case mt-0.5">Read-only institutional email</span>
              </label>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                disabled
                className="border rounded-xl px-4 py-3 text-sm outline-none bg-slate-100 border-slate-200 text-slate-455 cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5 flex flex-col">
                Contact Phone *
                <span className="block text-[9px] text-slate-400 font-normal normal-case mt-0.5">10-digit mobile number</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                  themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                }`}
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5 flex flex-col">
                LinkedIn Profile URL
                <span className="block text-[9px] text-slate-400 font-normal normal-case mt-0.5">Optional professional profile link</span>
              </label>
              <input
                type="text"
                placeholder="e.g. https://linkedin.com/in/adithyakumar"
                value={linkedInUrl}
                onChange={(e) => setLinkedInUrl(e.target.value)}
                className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                  themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                }`}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={saveHeaderSettings}
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

          {successBanner?.section === "about" && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl mb-4 font-bold flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-600" />
              {successBanner.message}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5 flex flex-col">
                Short bio / Professional Summary
                <span className="block text-[9px] text-slate-400 font-normal normal-case mt-0.5">
                  Describe yourself to recruiters in 2-3 sentences (e.g. "A passionate Computer Science student specialing in Web Development...")
                </span>
              </label>
              <textarea
                placeholder="Enter a brief professional summary..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none min-h-[80px] transition ${
                  themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                }`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5 flex flex-col">
                Personal Journey Story (Optional)
                <span className="block text-[9px] text-slate-400 font-normal normal-case mt-0.5">
                  Share your background (e.g. "My passion for programming started in high school when I wrote my first script...")
                </span>
              </label>
              <textarea
                placeholder="Share your personal tech background story..."
                value={personalStory}
                onChange={(e) => setPersonalStory(e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none min-h-[80px] transition ${
                  themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                }`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5 flex flex-col">
                Statement of Purpose (SOP) / Career Intentions (Optional)
                <span className="block text-[9px] text-slate-400 font-normal normal-case mt-0.5">
                  State your career intentions (e.g. "Aiming to work as a Software Developer in a progressive product firm...")
                </span>
              </label>
              <textarea
                placeholder="State your career placement intentions..."
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
              onClick={saveAboutSettings}
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

          {/* Form in separate card container */}
          <div className={`p-6 rounded-2xl border mb-6 transition duration-300 ${
            themeMode === "dark" ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200"
          }`}>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
              {editingExpId ? "✏️ Edit Experience Entry" : "➕ Add New Experience"}
            </h4>

            {successBanner?.section === "experience" && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl mb-4 font-bold flex items-center gap-2 animate-pulse-slow">
                <CheckCircle size={14} className="text-emerald-600" />
                {successBanner.message}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Job Title / Role *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Software Developer Intern"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Company / Organization *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata Consultancy Services"
                  value={expCompany}
                  onChange={(e) => setExpCompany(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Job Location</label>
                <input
                  type="text"
                  placeholder="e.g. Chennai or Remote"
                  value={expLocation}
                  onChange={(e) => setExpLocation(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Experience Type</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition cursor-pointer ${
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
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs opacity-60 font-bold">Start Year *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 2023"
                  value={expStartDate}
                  onChange={(e) => setExpStartDate(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs opacity-60 font-bold">End Year</label>
                <input
                  type="number"
                  placeholder="e.g. 2026"
                  value={expEndDate}
                  disabled={expIsCurrent}
                  onChange={(e) => setExpEndDate(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                    expIsCurrent
                      ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
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
                  className="w-4 h-4 rounded text-[#781c1c] accent-[#781c1c] cursor-pointer"
                />
                <label htmlFor="expIsCurrent" className="text-sm cursor-pointer select-none">I currently work here</label>
              </div>

              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Responsibilities & Achievements</label>
                <textarea
                  placeholder="Describe your duties, key projects, and achievements..."
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none min-h-[100px] transition ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              {editingExpId && (
                <button
                  onClick={cancelEditExperience}
                  className="px-6 py-2.5 border border-red-500/20 hover:bg-red-500/5 text-red-400 rounded-xl font-bold transition text-xs cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={addExperience}
                className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-6 py-2.5 rounded-xl font-bold transition text-xs cursor-pointer shadow-sm"
              >
                {editingExpId ? "Update Experience" : "Add Experience"}
              </button>
            </div>
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
                    <p className="text-[10px] opacity-50 mt-1 font-semibold">{formatDisplayDate(exp.startDate)} - {exp.isCurrent ? "Present" : formatDisplayDate(exp.endDate)}</p>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
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

          {/* Form in separate card container */}
          <div className={`p-6 rounded-2xl border mb-6 transition duration-300 ${
            themeMode === "dark" ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200"
          }`}>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
              {editingAcademicId ? "✏️ Edit Academic Record Details" : "➕ Add New Academic Record"}
            </h4>

            {successBanner?.section === "academic" && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl mb-4 font-bold flex items-center gap-2 animate-pulse-slow">
                <CheckCircle size={14} className="text-emerald-600" />
                {successBanner.message}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Qualification / Marksheet Type *</label>
                <select
                  value={academicDegreeType}
                  onChange={(e) => {
                    setAcademicDegreeType(e.target.value);
                    if (e.target.value !== "Other") {
                      setAcademicDegree(e.target.value);
                    } else {
                      setAcademicDegree("");
                    }
                  }}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition cursor-pointer ${
                    themeMode === "dark" ? "bg-[#0b0b0f] border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                >
                  <option value="">Select Qualification / Marksheet Type *</option>
                  <option value="10th Marksheet">10th Marksheet (Required)</option>
                  <option value="11th Marksheet">11th Marksheet (Required)</option>
                  <option value="12th Marksheet">12th Marksheet (Required)</option>
                  <option value="UG Marksheet">UG Marksheet (Required)</option>
                  <option value="PG Marksheet">PG Marksheet (Optional)</option>
                  <option value="Other">Other (Custom Title)</option>
                </select>
              </div>

              {academicDegreeType === "Other" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Custom Degree Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B.Sc. Computer Science"
                    value={academicDegree}
                    onChange={(e) => setAcademicDegree(e.target.value)}
                    className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                      themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                    }`}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Department / Major Field</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science or Chemistry"
                  value={academicField}
                  onChange={(e) => setAcademicField(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">College / School Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Madras Christian College"
                  value={academicInstitution}
                  onChange={(e) => setAcademicInstitution(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">
                  {academicDegreeType === "10th Marksheet" || academicDegreeType === "12th Marksheet"
                    ? "Percentage *"
                    : academicDegreeType === "UG Marksheet" || academicDegreeType === "PG Marksheet"
                    ? "Final CGPA *"
                    : "Final CGPA or Percentage *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    academicDegreeType === "10th Marksheet" || academicDegreeType === "12th Marksheet"
                      ? "e.g. 95%"
                      : academicDegreeType === "UG Marksheet" || academicDegreeType === "PG Marksheet"
                      ? "e.g. 8.5"
                      : academicDegreeType === "11th Marksheet"
                      ? "e.g. 85% or All Pass"
                      : "e.g. 8.5 CGPA or 85%"
                  }
                  value={academicGrade}
                  onChange={(e) => setAcademicGrade(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                />
                {academicDegreeType === "11th Marksheet" && (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      id="all-pass"
                      checked={academicGrade === "All Pass"}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAcademicGrade("All Pass");
                        } else {
                          setAcademicGrade("");
                        }
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-[#781c1c] focus:ring-[#781c1c] cursor-pointer"
                    />
                    <label htmlFor="all-pass" className="text-[11px] text-slate-500 font-bold select-none cursor-pointer">
                      All Pass (COVID batch / special exemption)
                    </label>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Start Year *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 2023"
                  value={academicStartYear}
                  onChange={(e) => setAcademicStartYear(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">End Year / Expected *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 2026"
                  value={academicEndYear}
                  onChange={(e) => setAcademicEndYear(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                />
              </div>

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

            <div className="flex gap-2 justify-end">
              {editingAcademicId && (
                <button onClick={cancelEditAcademicRecord} className="px-6 py-2.5 border border-red-500/20 text-red-400 rounded-xl font-bold transition text-xs cursor-pointer">Cancel</button>
              )}
              <button onClick={addAcademicRecord} className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-6 py-2.5 rounded-xl font-bold transition text-xs cursor-pointer shadow-sm">
                {editingAcademicId ? "Update Record" : "Add Record"}
              </button>
            </div>
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
                  
                  <div className="flex items-center gap-1 shrink-0">
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

          {/* Form in separate card container */}
          <div className={`p-6 rounded-2xl border mb-6 transition duration-300 ${
            themeMode === "dark" ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200"
          }`}>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
              {editingAchId ? "✏️ Edit Achievement Details" : "➕ Add New Achievement"}
            </h4>

            {successBanner?.section === "achievement" && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl mb-4 font-bold flex items-center gap-2 animate-pulse-slow">
                <CheckCircle size={14} className="text-emerald-600" />
                {successBanner.message}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Achievement / Award Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. First Place in National Hackathon"
                  value={achievementTitle}
                  onChange={(e) => setAchievementTitle(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Category</label>
                <select
                  value={achievementCategory}
                  onChange={(e) => setAchievementCategory(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition cursor-pointer ${
                    themeMode === "dark" ? "bg-[#0b0b0f] border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                >
                  <option value="Scholarships">Scholarships</option>
                  <option value="Ranks">Ranks</option>
                  <option value="Awards">Awards</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs opacity-60 font-bold">Achievement Year *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 2025"
                  value={achievementDate}
                  onChange={(e) => setAchievementDate(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                />
              </div>

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
                      <button onClick={() => setAchievementUrl("")} className="text-xs text-red-400 font-semibold underline text-rose-500 cursor-pointer">Remove</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">
                  Award Description & Conditions
                  <span className="block text-[9px] text-slate-400 font-normal normal-case mt-0.5">e.g. Awarded first place out of 150 participant teams in a 24-hour national code challenge</span>
                </label>
                <textarea
                  placeholder="Provide a brief description of the award, ranking, or scholarship conditions..."
                  value={achievementDescription}
                  onChange={(e) => setAchievementDescription(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none min-h-[100px] transition ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              {editingAchId && (
                <button onClick={cancelEditAchievement} className="px-6 py-2.5 border border-red-500/20 text-red-400 rounded-xl font-bold transition text-xs cursor-pointer">Cancel</button>
              )}
              <button onClick={addAchievement} className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-6 py-2.5 rounded-xl font-bold transition text-xs cursor-pointer shadow-sm">
                {editingAchId ? "Update Achievement" : "Add Achievement"}
              </button>
            </div>
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
                    <p className="text-[10px] opacity-50 mt-1 font-semibold">Year: {ach.achievementDate ? new Date(ach.achievementDate).getFullYear() : ""}</p>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
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

          {/* Form in separate card container */}
          <div className={`p-6 rounded-2xl border mb-6 transition duration-300 ${
            themeMode === "dark" ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200"
          }`}>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
              {editingProjId ? "✏️ Edit Project/Research Details" : "➕ Add New Project/Research"}
            </h4>

            {successBanner?.section === "project" && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl mb-4 font-bold flex items-center gap-2 animate-pulse-slow">
                <CheckCircle size={14} className="text-emerald-600" />
                {successBanner.message}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Title of Project / Publication *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart E-Commerce Web App"
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Category</label>
                <select
                  value={projCategory}
                  onChange={(e) => setProjCategory(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition cursor-pointer ${
                    themeMode === "dark" ? "bg-[#0b0b0f] border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                >
                  <option value="Academic projects">Academic projects</option>
                  <option value="Internships or industry collaborations projects">Internships or industry collaborations projects</option>
                  <option value="Publications">Publications</option>
                  <option value="Conference presentations">Conference presentations</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Technologies used / Conference details *</label>
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, PostgreSQL"
                  value={projTechnologies}
                  onChange={(e) => setProjTechnologies(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Github / Paper / Live URL</label>
                <input
                  type="text"
                  placeholder="e.g. https://github.com/username/project"
                  value={projUrl}
                  onChange={(e) => setProjUrl(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                />
              </div>

              {(projCategory === "Publications" || projCategory === "Conference presentations") && (
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs opacity-60 font-bold">Published/Presented Date *</label>
                  <input
                    type="date"
                    required
                    value={projDate}
                    onChange={(e) => setProjDate(e.target.value)}
                    className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                      themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                    }`}
                  />
                </div>
              )}

              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">
                  Project Description / Publication Abstract *
                  <span className="block text-[9px] text-slate-400 font-normal normal-case mt-0.5">e.g. Built a complete web app with features like shopping cart, user auth, and payment gateway</span>
                </label>
                <textarea
                  required
                  placeholder="Briefly describe the project features, research methodology and outcomes..."
                  value={projDescription}
                  onChange={(e) => setProjDescription(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none min-h-[120px] transition ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              {editingProjId && (
                <button onClick={cancelEditProj} className="px-6 py-2.5 border border-red-500/20 text-red-400 rounded-xl font-bold transition text-xs cursor-pointer">Cancel</button>
              )}
              <button onClick={addProjectOrResearch} className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-6 py-2.5 rounded-xl font-bold transition text-xs cursor-pointer shadow-sm">
                {editingProjId ? "Update Entry" : "Add Entry"}
              </button>
            </div>
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
                  
                  <div className="flex items-center gap-1 shrink-0">
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
                  
                  <div className="flex items-center gap-1 shrink-0">
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

          {/* Form in separate card container */}
          <div className={`p-6 rounded-2xl border mb-6 transition duration-300 ${
            themeMode === "dark" ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200"
          }`}>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
              {editingSkillId ? "✏️ Edit Skill Details" : "➕ Add New Skill"}
            </h4>

            {successBanner?.section === "skill" && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl mb-4 font-bold flex items-center gap-2 animate-pulse-slow">
                <CheckCircle size={14} className="text-emerald-600" />
                {successBanner.message}
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Skill Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JavaScript, Python"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Proficiency Level</label>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition cursor-pointer ${
                    themeMode === "dark" ? "bg-[#0b0b0f] border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                >
                  <option value="Beginner">Beginner (Level ~35%)</option>
                  <option value="Intermediate">Intermediate (Level ~65%)</option>
                  <option value="Advanced">Advanced (Level ~85%)</option>
                  <option value="Expert">Expert (Level ~95%)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Skill Category</label>
                <select
                  value={skillCategory}
                  onChange={(e) => setSkillCategory(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition cursor-pointer ${
                    themeMode === "dark" ? "bg-[#0b0b0f] border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                >
                  <option value="Subject-specific skills">Subject-specific skills</option>
                  <option value="Soft skills">Soft skills</option>
                  <option value="Technical skills">Technical skills</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              {editingSkillId && (
                <button onClick={cancelEditSkill} className="px-6 py-2.5 border border-red-500/20 text-red-400 rounded-xl font-bold transition text-xs cursor-pointer">Cancel</button>
              )}
              <button onClick={addSkill} className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-6 py-2.5 rounded-xl font-bold transition text-xs cursor-pointer shadow-sm">
                {editingSkillId ? "Update Skill" : "Add Skill"}
              </button>
            </div>
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
                  
                  <div className="flex items-center gap-1 shrink-0">
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

          {/* Form in separate card container */}
          <div className={`p-6 rounded-2xl border mb-6 transition duration-300 ${
            themeMode === "dark" ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200"
          }`}>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
              {editingCertId ? "✏️ Edit Certification Details" : "➕ Add New Certification"}
            </h4>

            {successBanner?.section === "certification" && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl mb-4 font-bold flex items-center gap-2 animate-pulse-slow">
                <CheckCircle size={14} className="text-emerald-600" />
                {successBanner.message}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Certification / Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Cloud Practitioner"
                  value={certificationTitle}
                  onChange={(e) => setCertificationTitle(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Issuer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amazon Web Services"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Category</label>
                <select
                  value={certCategory}
                  onChange={(e) => setCertCategory(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition cursor-pointer ${
                    themeMode === "dark" ? "bg-[#0b0b0f] border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                >
                  <option value="Licenses">Licenses</option>
                  <option value="Online courses">Online courses</option>
                  <option value="Workshops">Workshops</option>
                  <option value="Conference">Conference</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs opacity-60 font-bold">Issue Year *</label>
                <input
                  type="number"
                  placeholder="e.g. 2025"
                  required
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                />
              </div>

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

            <div className="flex gap-2 justify-end">
              {editingCertId && (
                <button onClick={cancelEditCertification} className="px-6 py-2.5 border border-red-500/20 text-red-400 rounded-xl font-bold transition text-xs cursor-pointer">Cancel</button>
              )}
              <button onClick={addCertification} className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-6 py-2.5 rounded-xl font-bold transition text-xs cursor-pointer shadow-sm">
                {editingCertId ? "Update Certificate" : "Add Certificate"}
              </button>
            </div>
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
                    <p className="text-[10px] opacity-50 mt-1 font-semibold">Year: {cert.issueDate ? new Date(cert.issueDate).getFullYear() : ""}</p>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
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

          {successBanner?.section === "languages" && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl mb-4 font-bold flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-600" />
              {successBanner.message}
            </div>
          )}

          {/* Current Languages List */}
          <div className="mb-6">
            <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-2 block">
              Your Languages
            </label>
            {languageList.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {languageList.map((lang, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      themeMode === "dark"
                        ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                        : "bg-[#781c1c]/5 border-[#781c1c]/15 text-[#18233c] hover:bg-[#781c1c]/10"
                    }`}
                  >
                    <span>{lang.name}</span>
                    <span className="opacity-60 font-normal">({lang.level})</span>
                    <button
                      type="button"
                      onClick={() => removeLanguage(index)}
                      className="ml-1 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Remove language"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-xs italic">No languages added yet. Add languages below.</p>
            )}
          </div>

          {/* Add Language Form */}
          <div className={`p-5 rounded-2xl border ${
            themeMode === "dark" ? "bg-white/[0.02] border-white/5" : "bg-slate-50/50 border-slate-155"
          }`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 ${
              themeMode === "dark" ? "text-gray-300" : "text-slate-700"
            }`}>
              Add a Language
            </h4>
            
            <div className="grid sm:grid-cols-3 gap-4 items-end">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Language Name</label>
                <input
                  type="text"
                  placeholder="e.g. English, French, Hindi"
                  value={newLanguageName}
                  onChange={(e) => setNewLanguageName(e.target.value)}
                  className={`border rounded-xl px-4 py-2.5 text-xs outline-none transition focus:border-[#781c1c] ${
                    themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Proficiency Level</label>
                <select
                  value={newLanguageLevel}
                  onChange={(e) => setNewLanguageLevel(e.target.value)}
                  className={`border rounded-xl px-4 py-2.5 text-xs outline-none transition focus:border-[#781c1c] ${
                    themeMode === "dark" ? "bg-[#121217] border-white/5 text-white" : "bg-white border-slate-200"
                  }`}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Fluent">Fluent</option>
                  <option value="Native / Bilingual">Native / Bilingual</option>
                </select>
              </div>

              <button
                type="button"
                onClick={addLanguage}
                className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 h-[38px] shadow-sm shadow-[#781c1c]/10"
              >
                <Plus size={14} /> Add Language
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={saveLanguagesSettings}
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

          {successBanner?.section === "testScores" && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl mb-4 font-bold flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-600" />
              {successBanner.message}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5 flex flex-col">
              Enter standardized test scores (IELTS, GRE, GATE, TOEFL, etc.)
              <span className="block text-[9px] text-slate-400 font-normal normal-case mt-0.5">
                Include tests and metrics (e.g. "IELTS Academic: 8.0 Band, GRE: 325 (Quant: 168, Verbal: 157, AWA: 4.5)")
              </span>
            </label>
            <textarea
              placeholder="Enter standardized test scores details..."
              value={testScores}
              onChange={(e) => setTestScores(e.target.value)}
              className={`w-full border rounded-xl px-4 py-3 text-sm outline-none min-h-[80px] transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={saveTestScoresSettings}
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

          {successBanner?.section === "patents" && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl mb-4 font-bold flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-600" />
              {successBanner.message}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5 flex flex-col">
              List any patents filed, published, or granted
              <span className="block text-[9px] text-slate-400 font-normal normal-case mt-0.5">
                Include titles, registration/patent numbers, status, and dates (e.g. "Smart Agricultural Watering System, App No: 20264102931A")
              </span>
            </label>
            <textarea
              placeholder="List any patents details..."
              value={patents}
              onChange={(e) => setPatents(e.target.value)}
              className={`w-full border rounded-xl px-4 py-3 text-sm outline-none min-h-[80px] transition ${
                themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
              }`}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={savePatentsSettings}
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

          {successBanner?.section === "mediaHandles" && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl mb-4 font-bold flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-600" />
              {successBanner.message}
            </div>
          )}

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
              onClick={saveMediaHandlesSettings}
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

          {/* Form in separate card container */}
          <div className={`p-6 rounded-2xl border mb-6 transition duration-300 ${
            themeMode === "dark" ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200"
          }`}>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
              {editingResumeId ? "✏️ Edit Resume Details" : "➕ Add New Resume Document"}
            </h4>

            {successBanner?.section === "resume" && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl mb-4 font-bold flex items-center gap-2 animate-pulse-slow">
                <CheckCircle size={14} className="text-emerald-600" />
                {successBanner.message}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Resume Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adithya Kumar Resume 2026"
                  value={resumeTitle}
                  onChange={(e) => setResumeTitle(e.target.value)}
                  className={`border rounded-xl px-4 py-3 text-sm outline-none transition ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                  }`}
                />
              </div>

              <div className={`border rounded-2xl px-5 py-3 flex flex-col justify-center gap-2 transition ${
                themeMode === "dark" ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200"
              }`}>
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5">Upload Resume Document (PDF only) *</label>
                <div className="flex items-center gap-4 mt-1">
                  <input
                    type="file"
                    accept=".pdf"
                    required={!resumeUrl}
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
                      <button onClick={() => setResumeUrl("")} className="text-xs text-red-400 font-semibold underline text-rose-500 cursor-pointer">Remove</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              {editingResumeId && (
                <button onClick={cancelEditResume} className="px-6 py-2.5 border border-red-500/20 text-red-400 rounded-xl font-bold transition text-xs cursor-pointer">Cancel</button>
              )}
              <button onClick={addResume} className="bg-[#781c1c] hover:bg-[#5f1515] text-white px-6 py-2.5 rounded-xl font-bold transition text-xs cursor-pointer shadow-sm">
                {editingResumeId ? "Update Resume" : "Save Resume"}
              </button>
            </div>
          </div>

          {/* List */}
          <div className="space-y-3">
            {resumes.map((res) => (
              <div key={res.id} className={`border rounded-2xl p-4 flex flex-col transition ${
                themeMode === "dark" ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-3">
                    <FileText className="text-[#781c1c] animate-pulse" size={20} />
                    <div>
                      <h5 className="font-bold text-sm">{res.resumeTitle}</h5>
                      <div className="flex items-center gap-3 mt-0.5">
                        <a href={res.resumeUrl} target="_blank" className="text-[10px] text-[#781c1c] hover:underline flex items-center gap-0.5">
                          <ExternalLink size={10} /> View / Download Document
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => startEditResume(res)} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10"><Edit size={14} /></button>
                    <button onClick={() => deleteResume(res.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>



        {/* Photo Adjustment Modal */}
        {showPhotoAdjustModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl transition-all border ${
              themeMode === "dark" ? "bg-[#0f172a] border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
            }`}>
              <div className="flex justify-between items-center mb-6 border-b pb-3 border-slate-200/10">
                <h4 className="font-serif text-xl font-bold flex items-center gap-2">
                  <Sliders size={20} className="text-[#781c1c]" /> Adjust Profile Photo
                </h4>
                <button 
                  onClick={() => setShowPhotoAdjustModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-200/20 text-slate-455 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Preview Circle */}
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 rounded-full border-2 border-[#781c1c] overflow-hidden flex items-center justify-center bg-slate-800">
                  <img
                    src={profileImageUrl.split("?")[0]}
                    style={{
                      transform: `scale(${adjustScale}) rotate(${adjustRotate}deg)`,
                      objectPosition: `${adjustPosX}% ${adjustPosY}%`,
                      objectFit: adjustFit as any
                    }}
                    className="w-full h-full"
                    alt="Adjust Preview"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {/* Scale / Zoom */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-455">Zoom / Scale</span>
                    <span>{adjustScale.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={adjustScale}
                    onChange={(e) => setAdjustScale(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#781c1c]"
                  />
                </div>

                {/* Rotation */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-455">Rotate</span>
                    <span>{adjustRotate}°</span>
                  </div>
                  <div className="flex gap-2">
                    {[0, 90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => setAdjustRotate(deg)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                          adjustRotate === deg
                            ? "bg-[#781c1c] text-white border-[#781c1c]"
                            : "bg-transparent border-slate-200/20 text-slate-455 hover:bg-slate-200/10"
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>

                {/* X Position */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-455">Horizontal Align</span>
                    <span>{adjustPosX}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={adjustPosX}
                    onChange={(e) => setAdjustPosX(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#781c1c]"
                  />
                </div>

                {/* Y Position */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-455">Vertical Align</span>
                    <span>{adjustPosY}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={adjustPosY}
                    onChange={(e) => setAdjustPosY(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#781c1c]"
                  />
                </div>

                {/* Fit Option */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-455">Fit Type</span>
                  <div className="flex gap-2">
                    {["cover", "contain"].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setAdjustFit(f)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer capitalize ${
                          adjustFit === f
                            ? "bg-[#781c1c] text-white border-[#781c1c]"
                            : "bg-transparent border-slate-200/20 text-slate-455 hover:bg-slate-200/10"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowPhotoAdjustModal(false)}
                  className="flex-1 py-2.5 border border-slate-200/20 rounded-xl text-slate-455 font-bold text-sm cursor-pointer hover:bg-slate-200/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyPhotoAdjustments}
                  className="flex-1 py-2.5 bg-[#781c1c] hover:bg-[#5f1515] text-white font-bold text-sm rounded-xl cursor-pointer shadow-lg transition"
                >
                  Apply Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Photo Preview Modal */}
        {showPhotoPreviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-lg rounded-3xl overflow-hidden bg-slate-900 border border-white/10 p-6 flex flex-col items-center">
              <button
                onClick={() => setShowPhotoPreviewModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
                title="Close preview"
              >
                <X size={18} />
              </button>
              <h4 className="text-white font-serif text-lg font-bold mb-4 font-bold">Photo Preview</h4>
              <div className="w-80 h-80 rounded-full border-4 border-[#781c1c] overflow-hidden flex items-center justify-center bg-slate-950 shadow-2xl">
                {(() => {
                  const imgDetails = parseImageAdjustments(profileImageUrl);
                  return (
                    <img
                      src={imgDetails.src}
                      style={imgDetails.style}
                      className="w-full h-full animate-scaleUp"
                      alt="Large Preview"
                    />
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        </div>
      </div>
    </div>
  );
}