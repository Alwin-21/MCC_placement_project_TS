"use client";

import { useState, useEffect } from "react";
import {
  ClipboardList, Plus, Trash2, Edit3, Eye, FileSpreadsheet, Download, Upload,
  CheckCircle2, XCircle, AlertTriangle, ShieldAlert, Clock, Calendar, Users,
  BookOpen, ChevronRight, FileText, Lock, Play, Pause, AlertOctagon, Check, RefreshCw,
  Search, Filter, HelpCircle, FileCheck, Layers, X, Sun, Moon
} from "lucide-react";
import api from "@/services/api";
import { useTheme } from "@/hooks/useTheme";
import RichTextEditor from "./RichTextEditor";

const AIDED_DEPARTMENTS = [
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
  "Physical Education"
];

const SFS_DEPARTMENTS = [
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
  "Data Science"
];

const ALL_DEPARTMENTS = Array.from(new Set([...AIDED_DEPARTMENTS, ...SFS_DEPARTMENTS])).sort();

interface Question {
  id?: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  marks: number;
  orderIndex?: number;
}

interface Assessment {
  id: number;
  title: string;
  description: string;
  instructions: string;
  durationMinutes: number;
  totalMarks: number;
  startDate: string;
  endDate: string;
  status: string;
  departments: string;
  createdAt: string;
  questionCount: number;
  attemptCount: number;
}

interface AssessmentAdminModuleProps {
  themeMode?: "light" | "dark";
  toggleThemeMode?: () => void;
}

export default function AssessmentAdminModule({ themeMode: propThemeMode, toggleThemeMode: propToggleThemeMode }: AssessmentAdminModuleProps) {
  const [hookThemeMode, hookToggleThemeMode] = useTheme();
  const themeMode = propThemeMode || hookThemeMode;
  const toggleThemeMode = propToggleThemeMode || hookToggleThemeMode;
  const [activeTab, setActiveTab] = useState<"assessments" | "attempts">("assessments");
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [streamFilter, setStreamFilter] = useState("All");
  const [formStreamTab, setFormStreamTab] = useState<"Aided" | "SFS">("Aided");

  // Assessment Form Modal State
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    durationMinutes: 60,
    totalMarks: 100,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    selectedDepts: ["Computer Science"] as string[],
  });

  // Questions Attached directly inside Create/Edit Modal
  const [modalAttachedQuestions, setModalAttachedQuestions] = useState<Question[]>([]);
  const [attachedFileName, setAttachedFileName] = useState<string>("");

  // Standalone Question Manager Modal
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [qFormData, setQFormData] = useState<Question>({
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctOption: "A",
    marks: 5,
  });
  const [editingQIndex, setEditingQIndex] = useState<number | null>(null);

  // Attempts & Malpractice Inspection Modal
  const [selectedAssessmentForAttempts, setSelectedAssessmentForAttempts] = useState<Assessment | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  // Warning & Malpractice Log Inspector
  const [showMalpracticeModal, setShowMalpracticeModal] = useState(false);
  const [selectedAttemptMalpractice, setSelectedAttemptMalpractice] = useState<any | null>(null);
  
  // Custom states for AI Proctoring & Calculator Enhancements
  const [selectedEvidenceImage, setSelectedEvidenceImage] = useState<string | null>(null);
  const [securitySettings, setSecuritySettings] = useState({
    calculatorEnabled: true,
    calculatorMode: "Basic" as "Basic" | "Scientific",
    faceMissingTimeout: 5,
    pauseTimerOnFaceMissing: false,
    objectDetectionEnabled: true
  });

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Assessments");
      setAssessments(res.data || []);
    } catch (err) {
      console.error("Failed to load assessments:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── CSV Sample Download Helper ──
  const downloadSampleCSV = () => {
    const csvHeader = "QuestionText,OptionA,OptionB,OptionC,OptionD,CorrectOption,Marks\n";
    const sample1 = "\"What is the time complexity of binary search?\",\"O(n)\",\"O(log n)\",\"O(n^2)\",\"O(1)\",\"B\",5\n";
    const sample2 = "\"Which data structure operates on LIFO?\",\"Queue\",\"Array\",\"Stack\",\"Tree\",\"C\",5\n";
    const sample3 = "\"What does SQL stand for?\",\"Simple Query Language\",\"Structured Query Language\",\"System Query Logic\",\"Sequential Query List\",\"B\",5\n";
    
    const blob = new Blob([csvHeader + sample1 + sample2 + sample3], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "mcc_assessment_questions_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── CSV File Parser inside Create/Edit Modal ──
  const handleModalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const lines = content.split(/\r\n|\n/).filter((l) => l.trim() !== "");
      if (lines.length < 2) {
        alert("File appears empty or missing header row.");
        return;
      }

      const parsed: Question[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
        const clean = (cols || []).map((c) => c.replace(/^"|"$/g, "").trim());

        const qText = clean[0] || "";
        const optA = clean[1] || "";
        const optB = clean[2] || "";
        const optC = clean[3] || "";
        const optD = clean[4] || "";
        const correct = (clean[5] || "A").toUpperCase();
        const marksVal = parseInt(clean[6] || "5") || 5;

        if (qText && optA && optB && optC && optD && ["A", "B", "C", "D"].includes(correct)) {
          parsed.push({
            questionText: qText,
            optionA: optA,
            optionB: optB,
            optionC: optC,
            optionD: optD,
            correctOption: correct,
            marks: marksVal,
          });
        }
      }

      if (parsed.length === 0) {
        alert("No valid questions found. Ensure CSV matches sample template.");
        return;
      }

      setModalAttachedQuestions(parsed);
      setAttachedFileName(`${file.name} (${parsed.length} questions ready)`);
    };
    reader.readAsText(file);
  };

  // ── Assessment CRUD ──
  const openCreateModal = () => {
    setEditingAssessment(null);
    setModalAttachedQuestions([]);
    setAttachedFileName("");
    setFormData({
      title: "",
      description: "",
      instructions: "Read all questions carefully. Do not switch tabs or move away from screen during the exam.",
      durationMinutes: 60,
      totalMarks: 100,
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      selectedDepts: ["Computer Science"],
    });
    setSecuritySettings({
      calculatorEnabled: true,
      calculatorMode: "Basic",
      faceMissingTimeout: 5,
      pauseTimerOnFaceMissing: false,
      objectDetectionEnabled: true
    });
    setShowAssessmentModal(true);
  };

  const openEditModal = async (item: Assessment) => {
    setEditingAssessment(item);
    setModalAttachedQuestions([]);
    setAttachedFileName("");
    const depts = item.departments ? item.departments.split(/[,;]/).map(d => d.trim()).filter(Boolean) : ["All"];
    setFormData({
      title: item.title,
      description: item.description,
      instructions: item.instructions,
      durationMinutes: item.durationMinutes,
      totalMarks: item.totalMarks,
      startDate: new Date(item.startDate).toISOString().slice(0, 16),
      endDate: new Date(item.endDate).toISOString().slice(0, 16),
      selectedDepts: depts,
    });
    
    // Load configurations from localStorage
    const saved = localStorage.getItem(`assessment-settings-${item.id}`);
    if (saved) {
      try {
        setSecuritySettings(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      setSecuritySettings({
        calculatorEnabled: true,
        calculatorMode: "Basic",
        faceMissingTimeout: 5,
        pauseTimerOnFaceMissing: false,
        objectDetectionEnabled: true
      });
    }
    setShowAssessmentModal(true);
  };

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert("Assessment Title is required.");

    const payload = {
      title: formData.title,
      description: formData.description,
      instructions: formData.instructions,
      durationMinutes: Number(formData.durationMinutes),
      totalMarks: Number(formData.totalMarks),
      startDate: formData.startDate,
      endDate: formData.endDate,
      departments: formData.selectedDepts,
    };

    try {
      let savedId = editingAssessment?.id;
      if (editingAssessment) {
        await api.put(`/Assessments/${editingAssessment.id}`, payload);
      } else {
        const res = await api.post("/Assessments", payload);
        savedId = res.data.id;
      }
      
      if (savedId) {
        localStorage.setItem(`assessment-settings-${savedId}`, JSON.stringify(securitySettings));
      }

      // Automatically upload questions if file was attached
      if (savedId && modalAttachedQuestions.length > 0) {
        await api.post(`/Assessments/${savedId}/questions`, {
          questions: modalAttachedQuestions,
          replace: true,
        });
      }

      setShowAssessmentModal(false);
      setModalAttachedQuestions([]);
      setAttachedFileName("");
      fetchAssessments();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Error saving assessment.");
    }
  };

  const handleDeleteAssessment = async (id: number) => {
    if (!confirm("Are you sure you want to delete this assessment? All student attempts and questions will be permanently removed.")) return;
    try {
      await api.delete(`/Assessments/${id}`);
      fetchAssessments();
    } catch (err) {
      alert("Failed to delete assessment.");
    }
  };

  const handleTogglePublish = async (id: number) => {
    try {
      await api.post(`/Assessments/${id}/publish`);
      fetchAssessments();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const toggleDept = (dept: string) => {
    setFormData((prev) => {
      let updated = [...prev.selectedDepts];
      if (dept === "All") {
        return { ...prev, selectedDepts: ["All"] };
      }
      updated = updated.filter((d) => d !== "All");
      if (updated.includes(dept)) {
        updated = updated.filter((d) => d !== dept);
      } else {
        updated.push(dept);
      }
      return { ...prev, selectedDepts: updated.length === 0 ? ["All"] : updated };
    });
  };

  const selectAllDepartmentsInStream = (stream: "Aided" | "SFS") => {
    const list = stream === "Aided" ? AIDED_DEPARTMENTS : SFS_DEPARTMENTS;
    setFormData((prev) => {
      const allSelected = list.every((d) => prev.selectedDepts.includes(d));
      let updated = prev.selectedDepts.filter((d) => d !== "All");
      if (allSelected) {
        updated = updated.filter((d) => !list.includes(d));
      } else {
        list.forEach((d) => {
          if (!updated.includes(d)) updated.push(d);
        });
      }
      return { ...prev, selectedDepts: updated.length === 0 ? ["All"] : updated };
    });
  };

  const generateDefaultInstructions = () => {
    const standardHTML = `
      <h3>Standard Exam Instructions & Guidelines</h3>
      <ul>
        <li><strong>Webcam Proctoring:</strong> The exam is webcam-proctored. Ensure your camera remains enabled throughout the duration.</li>
        <li><strong>No Tab Switching:</strong> Navigating away from the exam tab or window will trigger a security alert. Multiple alerts may result in automatic submission.</li>
        <li><strong>Face Detection:</strong> Ensure your face is clearly visible, well-lit, and centered in the webcam view. Do not look away from the screen for prolonged periods.</li>
        <li><strong>Authorized Material:</strong> A scientific calculator is integrated into the exam interface. No external calculators, mobile phones, or smart devices are permitted.</li>
        <li><strong>Submission:</strong> Do not close the browser tab until you have submitted your responses. The exam will auto-submit when the timer expires.</li>
      </ul>
    `;
    setFormData((prev) => ({
      ...prev,
      instructions: prev.instructions ? prev.instructions + "<br/>" + standardHTML : standardHTML
    }));
  };

  // ── Standalone Questions Manager ──
  const openQuestionsModal = async (assessment: Assessment) => {
    setCurrentAssessment(assessment);
    setShowQuestionModal(true);
    setLoadingQuestions(true);
    try {
      const res = await api.get(`/Assessments/${assessment.id}/questions`);
      setQuestions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAssessment) return;
    if (!qFormData.questionText.trim()) return alert("Question text is required.");
    if (!qFormData.optionA.trim() || !qFormData.optionB.trim() || !qFormData.optionC.trim() || !qFormData.optionD.trim()) {
      return alert("All four options (A, B, C, D) are required.");
    }

    let updatedList = [...questions];
    if (editingQIndex !== null) {
      updatedList[editingQIndex] = { ...qFormData };
    } else {
      updatedList.push({ ...qFormData });
    }

    try {
      await api.post(`/Assessments/${currentAssessment.id}/questions`, {
        questions: updatedList,
        replace: true,
      });
      setQuestions(updatedList);
      setEditingQIndex(null);
      setQFormData({
        questionText: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctOption: "A",
        marks: 5,
      });
      fetchAssessments();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to save questions.");
    }
  };

  const handleDeleteQuestion = async (index: number) => {
    if (!currentAssessment) return;
    const updatedList = questions.filter((_, idx) => idx !== index);
    try {
      await api.post(`/Assessments/${currentAssessment.id}/questions`, {
        questions: updatedList,
        replace: true,
      });
      setQuestions(updatedList);
      fetchAssessments();
    } catch (err) {
      alert("Failed to delete question.");
    }
  };

  // ── Attempts & Malpractice Reports ──
  const viewAttempts = async (assessment: Assessment) => {
    setSelectedAssessmentForAttempts(assessment);
    setActiveTab("attempts");
    setLoadingAttempts(true);
    try {
      const res = await api.get(`/Assessments/${assessment.id}/attempts`);
      setAttempts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAttempts(false);
    }
  };

  // Filter Logic
  const filteredAssessments = assessments.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStream =
      streamFilter === "All" ||
      a.departments.split(/[,;]/).some((d) => {
        const deptTrim = d.trim();
        return streamFilter === "Aided"
          ? AIDED_DEPARTMENTS.includes(deptTrim)
          : SFS_DEPARTMENTS.includes(deptTrim);
      }) ||
      a.departments.includes("All");
    const matchesDept = deptFilter === "All" || a.departments.includes(deptFilter) || a.departments.includes("All");
    return matchesSearch && matchesStream && matchesDept;
  });

  const totalAttemptsCount = assessments.reduce((acc, curr) => acc + (curr.attemptCount || 0), 0);
  const activeCount = assessments.filter((a) => a.status === "Published").length;

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Module Title & Primary Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold font-serif text-slate-900 dark:text-white truncate">Department Assessment Module</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 hidden sm:block">Manage department MCQ exams, question banks, and proctoring attempts.</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={toggleThemeMode}
            title="Toggle Light/Dark Mode"
            className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl transition-all duration-300 cursor-pointer border shadow-sm flex items-center justify-center ${
              themeMode === "dark"
                ? "bg-white/10 hover:bg-white/20 text-amber-300 border-white/15"
                : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            {themeMode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-1.5 bg-[#781c1c] hover:bg-[#5f1515] text-white font-bold px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl shadow-md transition duration-200 cursor-pointer active:scale-95 text-xs uppercase font-mono tracking-wider whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden xs:inline">Create</span> Assessment
          </button>
        </div>
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
        <div className="bg-white dark:bg-[#0f1117] border border-slate-200/80 dark:border-white/10 rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{assessments.length}</div>
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono truncate">Total Assessments</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f1117] border border-slate-200/80 dark:border-white/10 rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Play className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-bold text-[#781c1c] dark:text-emerald-400">{activeCount}</div>
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono truncate">Active / Published</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f1117] border border-slate-200/80 dark:border-white/10 rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{totalAttemptsCount}</div>
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono truncate">Student Attempts</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f1117] border border-slate-200/80 dark:border-white/10 rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">CSV/Excel</div>
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono truncate">Bulk Import</div>
          </div>
        </div>
      </div>

      {/* Sub Tabs Bar */}
      <div className="flex border-b border-slate-200 dark:border-white/10 text-sm font-medium w-full overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("assessments")}
          className={`pb-3 px-3 sm:px-5 flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider border-b-2 transition whitespace-nowrap shrink-0 ${
            activeTab === "assessments"
              ? "border-[#781c1c] text-[#781c1c] dark:text-amber-400 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> All Assessments ({assessments.length})
        </button>
        {selectedAssessmentForAttempts && (
          <button
            onClick={() => setActiveTab("attempts")}
            className={`pb-3 px-3 sm:px-5 flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider border-b-2 transition whitespace-nowrap shrink-0 ${
              activeTab === "attempts"
                ? "border-[#781c1c] text-[#781c1c] dark:text-amber-400 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Attempts:</span> {selectedAssessmentForAttempts.title.slice(0, 20)}{selectedAssessmentForAttempts.title.length > 20 ? "..." : ""}
          </button>
        )}
      </div>

      {/* TAB 1: ALL ASSESSMENTS LIST */}
      {activeTab === "assessments" && (
        <div className="space-y-4 w-full">
          {/* Search & Department Filter Bar */}
          <div className="bg-white dark:bg-[#0f1117] border border-slate-200/80 dark:border-white/10 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs w-full">
            <div className="relative w-full sm:w-80 md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#781c1c]"
              />
            </div>

            <div className="flex items-center gap-2 justify-between sm:justify-end flex-wrap">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-mono text-slate-500">Filters:</span>
              </div>
              <select
                value={streamFilter}
                onChange={(e) => {
                  setStreamFilter(e.target.value);
                  setDeptFilter("All");
                }}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#781c1c]"
              >
                <option value="All">All Streams</option>
                <option value="Aided">Aided</option>
                <option value="SFS">SFS</option>
              </select>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#781c1c]"
              >
                {(streamFilter === "All"
                  ? ["All", ...ALL_DEPARTMENTS]
                  : streamFilter === "Aided"
                  ? ["All", ...AIDED_DEPARTMENTS]
                  : ["All", ...SFS_DEPARTMENTS]
                ).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {loading ? (
              <div className="col-span-full py-16 text-center text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-[#781c1c]" /> Loading assessments...
              </div>
            ) : filteredAssessments.length === 0 ? (
              <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 bg-white dark:bg-[#0f1117]">
                <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-200">No Assessments Found</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 mb-4">Create your first department assessment or import questions via CSV.</p>
                <button
                  onClick={openCreateModal}
                  className="bg-[#781c1c] hover:bg-[#5f1515] text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase font-mono shadow-md"
                >
                  Create Assessment
                </button>
              </div>
            ) : (
              filteredAssessments.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#0f1117] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 hover:border-[#781c1c]/40 transition duration-300 flex flex-col justify-between shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          item.status === "Published"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : item.status === "Closed"
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {item.durationMinutes} mins
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">{item.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">{item.description || "No description provided."}</p>

                    {/* Target Departments */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {item.departments.split(/[,;]/).map((d) => (
                        <span key={d} className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-[#781c1c] dark:text-amber-300 font-bold px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          {d}
                        </span>
                      ))}
                    </div>

                    {/* Stats Box */}
                    <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/80 p-3 rounded-2xl border border-slate-200/60 dark:border-white/5">
                      <div>
                        <span className="text-slate-400">Questions:</span>{" "}
                        <strong className="text-slate-900 dark:text-slate-200">{item.questionCount}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Marks:</span>{" "}
                        <strong className="text-slate-900 dark:text-slate-200">{item.totalMarks}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Attempts:</span>{" "}
                        <strong className="text-slate-900 dark:text-slate-200">{item.attemptCount}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Proctoring:</span>{" "}
                        <strong className="text-emerald-600 dark:text-emerald-400">Active</strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openQuestionsModal(item)}
                        title="Manage Questions & Import Excel"
                        className="bg-[#781c1c]/10 hover:bg-[#781c1c]/20 text-[#781c1c] dark:text-amber-300 border border-[#781c1c]/20 text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" /> Qs ({item.questionCount})
                      </button>

                      <button
                        onClick={() => viewAttempts(item)}
                        title="View Student Results & Malpractice"
                        className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition"
                      >
                        <Users className="w-3.5 h-3.5" /> Results ({item.attemptCount})
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePublish(item.id)}
                        title={item.status === "Published" ? "Unpublish Assessment" : "Publish Assessment"}
                        className={`p-2 rounded-xl border text-xs font-bold transition ${
                          item.status === "Published"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                        }`}
                      >
                        {item.status === "Published" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => openEditModal(item)}
                        title="Edit Assessment"
                        className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-slate-700 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteAssessment(item.id)}
                        title="Delete Assessment"
                        className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-xl border border-rose-500/30 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ATTEMPTS & MALPRACTICE INSPECTION */}
      {activeTab === "attempts" && selectedAssessmentForAttempts && (
        <div className="bg-white dark:bg-[#0f1117] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-serif">{selectedAssessmentForAttempts.title} — Student Attempts</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-mono mt-0.5">Target Departments: {selectedAssessmentForAttempts.departments}</p>
            </div>
            <button
              onClick={() => setActiveTab("assessments")}
              className="text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 self-start transition"
            >
              ← Back to Assessments
            </button>
          </div>

          {loadingAttempts ? (
            <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-[#781c1c]" /> Loading attempt records...
            </div>
          ) : attempts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-mono">No students have attempted this assessment yet.</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Register No / Email</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Score</th>
                    <th className="py-3.5 px-4">Percentage</th>
                    <th className="py-3.5 px-4">Proctoring Warnings</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                  {attempts.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{att.studentName}</td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-500">{att.registerNumber}<br/>{att.email}</td>
                      <td className="py-3.5 px-4">{att.department}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            att.isMalpractice || att.status === "Terminated"
                              ? "bg-rose-500/20 text-rose-500 border border-rose-500/30"
                              : att.status === "Submitted" || att.status === "AutoSubmitted"
                              ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                          }`}
                        >
                          {att.isMalpractice ? "Terminated (Malpractice)" : att.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold">{att.marksObtained} / {att.totalMarks}</td>
                      <td className="py-3.5 px-4 font-bold text-[#781c1c] dark:text-amber-400">{att.percentage}%</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold ${
                          att.warningCount >= 4 ? "bg-rose-500/20 text-rose-500" : att.warningCount > 0 ? "bg-amber-500/20 text-amber-500" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}>
                          {att.warningCount} / 4 Warnings
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedAttemptMalpractice(att);
                            setShowMalpracticeModal(true);
                          }}
                          className="bg-[#781c1c]/10 hover:bg-[#781c1c]/20 text-[#781c1c] dark:text-amber-300 text-xs px-3 py-1.5 rounded-xl border border-[#781c1c]/20 font-bold transition"
                        >
                          Proctor Logs
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showAssessmentModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 py-8 overflow-y-auto">
          <div className="bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-3xl p-6 md:p-8 shadow-2xl space-y-6 my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
                  {editingAssessment ? "Edit Assessment" : "Create New Assessment"}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Configure test parameters and optionally upload questions via CSV / Excel.</p>
              </div>
              <button onClick={() => setShowAssessmentModal(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition">✕</button>
            </div>

            <form onSubmit={handleSaveAssessment} className="space-y-5 text-xs text-slate-700 dark:text-slate-200">
              <div>
                <label className="block font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">Assessment Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Computer Science Data Structures MCQ Exam 2026"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#781c1c]"
                />
              </div>

              <div>
                <label className="block font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description for students..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#781c1c]"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5 flex-wrap gap-2">
                  <label className="block font-mono font-bold text-slate-500 uppercase tracking-wider text-xs">Assessment Instructions</label>
                  <button
                    type="button"
                    onClick={generateDefaultInstructions}
                    className="px-2.5 py-1 bg-[#781c1c]/10 dark:bg-[#f43f5e]/15 border border-[#781c1c]/20 dark:border-[#f43f5e]/25 text-[#781c1c] dark:text-rose-350 hover:bg-[#781c1c]/20 dark:hover:bg-[#f43f5e]/25 rounded-lg text-[9px] font-extrabold font-mono uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <span>✨</span> Generate Standard Instructions
                  </button>
                </div>
                <RichTextEditor
                  value={formData.instructions}
                  onChange={(val) => setFormData({ ...formData, instructions: val })}
                  placeholder="Rules, camera proctoring notice, bullet points..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#781c1c]"
                  />
                </div>
                <div>
                  <label className="block font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">Total Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#781c1c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#781c1c]"
                  />
                </div>
                <div>
                  <label className="block font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#781c1c]"
                  />
                </div>
              </div>

              {/* Department Multi-Select with Stream separation */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block font-mono font-bold text-slate-500 uppercase tracking-wider text-xs">Target Departments *</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormStreamTab("Aided")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition ${
                        formStreamTab === "Aided"
                          ? "bg-slate-200 dark:bg-white/10 text-[#781c1c] dark:text-[#f43f5e]"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      Aided
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStreamTab("SFS")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition ${
                        formStreamTab === "SFS"
                          ? "bg-slate-200 dark:bg-white/10 text-[#781c1c] dark:text-[#f43f5e]"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      SFS
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Selected: {formData.selectedDepts.filter(d => d !== "All").length} depts
                  </span>
                  <button
                    type="button"
                    onClick={() => selectAllDepartmentsInStream(formStreamTab)}
                    className="text-[10px] text-[#781c1c] dark:text-[#f43f5e] font-mono hover:underline"
                  >
                    {(formStreamTab === "Aided" ? AIDED_DEPARTMENTS : SFS_DEPARTMENTS).every(d => formData.selectedDepts.includes(d))
                      ? "Deselect All Stream"
                      : "Select All Stream"}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  {(formStreamTab === "Aided" ? AIDED_DEPARTMENTS : SFS_DEPARTMENTS).map((dept) => {
                    const isSelected = formData.selectedDepts.includes(dept);
                    return (
                      <button
                        type="button"
                        key={dept}
                        onClick={() => toggleDept(dept)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition ${
                          isSelected
                            ? "bg-[#781c1c] text-white border-[#781c1c] shadow-xs"
                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {dept} {isSelected && "✓"}
                      </button>
                    );
                  })}
                </div>
              </div>



              {/* DIRECT CSV / EXCEL UPLOAD SECTION */}
              <div className="p-5 bg-[#781c1c]/5 dark:bg-[#781c1c]/10 border border-[#781c1c]/20 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-[#781c1c] dark:text-amber-300 font-bold font-mono text-xs uppercase tracking-wider">
                    <FileSpreadsheet className="w-4 h-4 text-[#781c1c]" /> Attach Questions File (CSV / Excel Format)
                  </div>
                  <button
                    type="button"
                    onClick={downloadSampleCSV}
                    className="text-[11px] font-bold text-[#781c1c] dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" /> Download Sample CSV Template
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-950 border border-dashed border-[#781c1c]/40 hover:border-[#781c1c] text-slate-700 dark:text-slate-200 font-bold px-4 py-3 rounded-xl cursor-pointer transition text-xs">
                    <Upload className="w-4 h-4 text-[#781c1c]" />
                    {attachedFileName ? attachedFileName : "Upload Question File (.csv)"}
                    <input
                      type="file"
                      accept=".csv, .txt, .xlsx"
                      onChange={handleModalFileUpload}
                      className="hidden"
                    />
                  </label>

                  {modalAttachedQuestions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setModalAttachedQuestions([]);
                        setAttachedFileName("");
                      }}
                      className="text-xs text-rose-500 font-bold hover:underline shrink-0"
                    >
                      Clear File
                    </button>
                  )}
                </div>

                {modalAttachedQuestions.length > 0 && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Successfully parsed <strong>{modalAttachedQuestions.length} questions</strong> from file. They will be saved automatically upon clicking Save.</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssessmentModal(false)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#781c1c] hover:bg-[#5f1515] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#781c1c]/30 uppercase font-mono tracking-wider transition"
                >
                  {editingAssessment ? "Update Assessment" : "Save & Create Assessment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STANDALONE QUESTION MANAGER MODAL */}
      {showQuestionModal && currentAssessment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 py-6 sm:py-8 overflow-y-auto">
          <div className="bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-3xl w-full max-w-4xl p-4 sm:p-6 md:p-8 shadow-2xl space-y-5 sm:space-y-6 my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
                  Question Bank — {currentAssessment.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Add individual MCQ questions or upload bulk CSV file.</p>
              </div>
              <button onClick={() => setShowQuestionModal(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition">✕</button>
            </div>

            {/* Question Form */}
            <form onSubmit={handleSaveQuestion} className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs text-slate-700 dark:text-slate-200">
              <div className="font-bold text-[#781c1c] dark:text-amber-400 uppercase font-mono text-xs">
                {editingQIndex !== null ? `Edit Question #${editingQIndex + 1}` : "Add Single MCQ Question"}
              </div>

              <div>
                <label className="block font-mono text-slate-400 mb-1">Question Text *</label>
                <textarea
                  rows={2}
                  required
                  value={qFormData.questionText}
                  onChange={(e) => setQFormData({ ...qFormData, questionText: e.target.value })}
                  placeholder="Enter the question statement..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#781c1c]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Option A *</label>
                  <input
                    type="text"
                    required
                    value={qFormData.optionA}
                    onChange={(e) => setQFormData({ ...qFormData, optionA: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#781c1c]"
                  />
                </div>
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Option B *</label>
                  <input
                    type="text"
                    required
                    value={qFormData.optionB}
                    onChange={(e) => setQFormData({ ...qFormData, optionB: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#781c1c]"
                  />
                </div>
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Option C *</label>
                  <input
                    type="text"
                    required
                    value={qFormData.optionC}
                    onChange={(e) => setQFormData({ ...qFormData, optionC: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#781c1c]"
                  />
                </div>
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Option D *</label>
                  <input
                    type="text"
                    required
                    value={qFormData.optionD}
                    onChange={(e) => setQFormData({ ...qFormData, optionD: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#781c1c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Correct Answer *</label>
                  <select
                    value={qFormData.correctOption}
                    onChange={(e) => setQFormData({ ...qFormData, correctOption: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#781c1c]"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={qFormData.marks}
                    onChange={(e) => setQFormData({ ...qFormData, marks: Number(e.target.value) })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#781c1c]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {editingQIndex !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingQIndex(null);
                      setQFormData({ questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", marks: 5 });
                    }}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#781c1c] text-white rounded-xl font-bold shadow-md uppercase font-mono"
                >
                  {editingQIndex !== null ? "Update Question" : "Add Question"}
                </button>
              </div>
            </form>

            {/* Questions List */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
              <h4 className="font-bold text-xs font-mono uppercase text-slate-400">Existing Questions ({questions.length})</h4>
              {loadingQuestions ? (
                <div className="text-center py-6 text-slate-400 text-xs">Loading questions...</div>
              ) : questions.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">No questions added yet. Use form above or upload CSV.</div>
              ) : (
                questions.map((q, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-start gap-4">
                    <div className="space-y-1.5 text-xs">
                      <div className="font-bold text-slate-900 dark:text-white">
                        <span className="text-[#781c1c] font-mono mr-1">Q{idx + 1}.</span> {q.questionText}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-mono">
                        <div className={q.correctOption === "A" ? "font-bold text-emerald-500" : ""}>A: {q.optionA}</div>
                        <div className={q.correctOption === "B" ? "font-bold text-emerald-500" : ""}>B: {q.optionB}</div>
                        <div className={q.correctOption === "C" ? "font-bold text-emerald-500" : ""}>C: {q.optionC}</div>
                        <div className={q.correctOption === "D" ? "font-bold text-emerald-500" : ""}>D: {q.optionD}</div>
                      </div>
                      <div className="text-[10px] text-amber-500 font-mono">Correct Option: {q.correctOption} | Marks: {q.marks}</div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingQIndex(idx);
                          setQFormData(q);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(idx)}
                        className="p-1.5 text-rose-500 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SCREENSHOT EVIDENCE LIGHTBOX OVERLAY */}
      {selectedEvidenceImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full flex flex-col items-center gap-4">
            <button
              onClick={() => setSelectedEvidenceImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 text-xl font-bold bg-white/10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
            <img
              src={selectedEvidenceImage}
              alt="Malpractice Full Resolution Screenshot"
              className="rounded-2xl border border-white/20 shadow-2xl max-h-[80vh] object-contain w-full"
            />
            <span className="text-xs font-mono text-slate-400">Captured Proctoring Screen Evidence</span>
          </div>
        </div>
      )}

      {/* MALPRACTICE INSPECTION MODAL */}
      {showMalpracticeModal && selectedAttemptMalpractice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 py-6 sm:py-8 overflow-y-auto">
          <div className="bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-3xl w-full max-w-xl p-4 sm:p-6 md:p-8 shadow-2xl space-y-5 my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">Proctoring Log Inspector</h3>
                <p className="text-slate-400 text-xs font-mono">{selectedAttemptMalpractice.studentName} ({selectedAttemptMalpractice.registerNumber})</p>
              </div>
              <button onClick={() => setShowMalpracticeModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Warnings Triggered:</span>
                  <span className="font-bold text-rose-500">{selectedAttemptMalpractice.warningCount} / 4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Attempt Status:</span>
                  <span className="font-bold uppercase text-slate-900 dark:text-white">{selectedAttemptMalpractice.status}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold uppercase text-slate-400 text-[10px]">Warning Trace Details</h4>
                {selectedAttemptMalpractice.warnings && selectedAttemptMalpractice.warnings.length === 0 ? (
                  <div className="py-4 text-center text-slate-400">Clean attempt — No anti-malpractice warnings recorded.</div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {(selectedAttemptMalpractice.warnings || []).map((w: any) => {
                      let text = w.details;
                      let screenshot = "";
                      let duration = "";
                      try {
                        if (w.details && w.details.startsWith("{")) {
                          const parsed = JSON.parse(w.details);
                          text = parsed.text;
                          screenshot = parsed.screenshot;
                          duration = parsed.duration;
                        }
                      } catch (e) {
                        console.error("Failed to parse warning details JSON:", e);
                      }

                      return (
                        <div key={w.id} className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl space-y-2 text-rose-400">
                          <div className="flex justify-between items-start">
                            <span className="font-black text-xs">Warning #{w.warningNum} ({w.warningType})</span>
                            <span className="text-[9px] text-slate-450 font-bold">{new Date(w.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-slate-200 text-xs font-sans">{text}</p>
                          {duration && (
                            <div className="text-[10px] font-mono text-slate-400 font-bold">
                              ⏱️ Duration: <span className="text-amber-400">{duration}</span>
                            </div>
                          )}
                          {screenshot && (
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase tracking-wider text-slate-450 block">Screenshot Evidence:</span>
                              <img
                                src={screenshot}
                                alt="Malpractice Evidence"
                                onClick={() => setSelectedEvidenceImage(screenshot)}
                                className="w-32 h-24 rounded-lg object-cover border border-rose-500/30 hover:border-rose-500 transition cursor-pointer"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowMalpracticeModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
