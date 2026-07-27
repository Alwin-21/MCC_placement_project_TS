"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/services/api";
import { 
  Plus, Edit2, Trash2, FileText, CheckCircle, XCircle, 
  Upload, Download, Eye, Play, Square, AlertTriangle, ArrowLeft, RefreshCw, BookOpen
} from "lucide-react";

interface AssessmentsManagerProps {
  themeMode: string;
  isSuperAdmin: boolean;
}

export default function AssessmentsManager({ themeMode, isSuperAdmin }: AssessmentsManagerProps) {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "form" | "questions" | "attempts" | "malpractice">("list");
  
  // Selected Objects
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [malpractices, setMalpractices] = useState<any[]>([]);

  // Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [duration, setDuration] = useState("30");
  const [totalMarks, setTotalMarks] = useState("100");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);

  // Questions Import States
  const [questions, setQuestions] = useState<any[]>([]);
  const [xlsxLoaded, setXlsxLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals / Details view
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedAttemptWarnings, setSelectedAttemptWarnings] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    loadDepartments();
    loadSheetJS();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Assessments");
      setAssessments(res.data);
      
      const reportsRes = await api.get("/Assessments/attempts/reports");
      setMalpractices(reportsRes.data.malpractice || []);
    } catch (err) {
      console.error("Failed to load assessments", err);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await api.get("/Admin/institution");
      if (res.data && res.data.departments) {
        const list = res.data.departments.split(";").map((d: string) => d.trim()).filter(Boolean);
        setDepartments(list);
      }
    } catch (err) {
      console.error("Failed to load departments", err);
    }
  };

  const loadSheetJS = () => {
    if ((window as any).XLSX) {
      setXlsxLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    script.async = true;
    script.onload = () => setXlsxLoaded(true);
    document.body.appendChild(script);
  };

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate || selectedDepts.length === 0) {
      alert("Please fill in all required fields and select at least one department.");
      return;
    }

    const payload = {
      title,
      description,
      instructions,
      duration: parseInt(duration) || 30,
      totalMarks: parseInt(totalMarks) || 100,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      departments: selectedDepts.join(";")
    };

    try {
      if (selectedAssessment?.id) {
        await api.put(`/Assessments/${selectedAssessment.id}`, payload);
      } else {
        await api.post("/Assessments", payload);
      }
      setView("list");
      setSelectedAssessment(null);
      loadData();
    } catch (err) {
      console.error("Failed to save assessment", err);
      alert("Error saving assessment.");
    }
  };

  const handleDeleteAssessment = async (id: number) => {
    if (!confirm("Are you sure you want to delete this assessment? All student attempts, questions, and warning logs will be permanently deleted.")) return;
    try {
      await api.delete(`/Assessments/${id}`);
      loadData();
    } catch (err) {
      console.error("Failed to delete assessment", err);
    }
  };

  const handleTogglePublish = async (a: any) => {
    try {
      if (a.isPublished) {
        await api.post(`/Assessments/${a.id}/unpublish`);
      } else {
        await api.post(`/Assessments/${a.id}/publish`);
      }
      loadData();
    } catch (err) {
      console.error("Failed to toggle publish status", err);
    }
  };

  const handleCloseAssessment = async (id: number) => {
    if (!confirm("Close this assessment? Students will no longer be able to start new attempts.")) return;
    try {
      await api.post(`/Assessments/${id}/close`);
      loadData();
    } catch (err) {
      console.error("Failed to close assessment", err);
    }
  };

  const handleOpenForm = (a: any = null) => {
    setSelectedAssessment(a);
    if (a) {
      setTitle(a.title);
      setDescription(a.description);
      setInstructions(a.instructions);
      setDuration(a.duration.toString());
      setTotalMarks(a.totalMarks.toString());
      // format for datetime-local input (YYYY-MM-DDTHH:MM)
      const start = new Date(a.startDate);
      const end = new Date(a.endDate);
      start.setMinutes(start.getMinutes() - start.getTimezoneOffset());
      end.setMinutes(end.getMinutes() - end.getTimezoneOffset());
      setStartDate(start.toISOString().slice(0, 16));
      setEndDate(end.toISOString().slice(0, 16));
      setSelectedDepts(a.departments.split(";").map((d: string) => d.trim()).filter(Boolean));
    } else {
      setTitle("");
      setDescription("");
      setInstructions("");
      setDuration("30");
      setTotalMarks("100");
      setStartDate("");
      setEndDate("");
      setSelectedDepts([]);
    }
    setView("form");
  };

  const handleOpenQuestions = async (a: any) => {
    setSelectedAssessment(a);
    setView("questions");
    try {
      const res = await api.get(`/Assessments/${a.id}/questions`);
      setQuestions(res.data || []);
    } catch (err) {
      console.error("Failed to fetch questions", err);
    }
  };

  const handleOpenAttempts = async (a: any) => {
    setSelectedAssessment(a);
    setView("attempts");
    try {
      const res = await api.get("/Assessments/attempts/reports");
      const list = res.data.attempts.filter((att: any) => att.assessmentTitle === a.title);
      setAttempts(list);
    } catch (err) {
      console.error("Failed to fetch attempts reports", err);
    }
  };

  // CSV/Excel Import Logic
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isCsv = file.name.endsWith(".csv");

    if (isCsv) {
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        parseCSVText(text);
      };
      reader.readAsText(file);
    } else {
      if (!xlsxLoaded) {
        alert("Excel parser library is still loading, please try again in a moment.");
        return;
      }
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = (window as any).XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = (window as any).XLSX.utils.sheet_to_json(sheet, { header: 1 });
        parseXLSXRows(json);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const parseCSVText = (text: string) => {
    const lines = text.split(/\r?\n/);
    const parsedRows = [];
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Basic CSV splitter that handles optional quotes
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
      const cleaned = matches.map(m => m.replace(/^"|"$/g, "").trim());
      
      if (cleaned.length >= 7) {
        parsedRows.push({
          questionText: cleaned[0] || "",
          optionA: cleaned[1] || "",
          optionB: cleaned[2] || "",
          optionC: cleaned[3] || "",
          optionD: cleaned[4] || "",
          correctAnswer: (cleaned[5] || "").toUpperCase(),
          marks: parseInt(cleaned[6]) || 1
        });
      }
    }
    setQuestions([...questions, ...parsedRows]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const parseXLSXRows = (rows: any[]) => {
    const parsedRows = [];
    // Start from index 1 to skip headers
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 7) continue;
      parsedRows.push({
        questionText: row[0]?.toString() || "",
        optionA: row[1]?.toString() || "",
        optionB: row[2]?.toString() || "",
        optionC: row[3]?.toString() || "",
        optionD: row[4]?.toString() || "",
        correctAnswer: row[5]?.toString()?.toUpperCase() || "",
        marks: parseInt(row[6]) || 1
      });
    }
    setQuestions([...questions, ...parsedRows]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpdateQuestionCell = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleDeleteQuestion = (index: number) => {
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  const validateQuestions = () => {
    for (const q of questions) {
      if (!q.questionText.trim()) return false;
      if (!q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim()) return false;
      if (!["A", "B", "C", "D"].includes(q.correctAnswer.trim())) return false;
      if (isNaN(parseInt(q.marks)) || parseInt(q.marks) <= 0) return false;
    }
    return true;
  };

  const handleSaveQuestions = async () => {
    if (!validateQuestions()) {
      alert("Validation failed! Please check that all cells are filled, Correct Answer is A, B, C, or D, and Marks is a positive number.");
      return;
    }

    try {
      await api.post(`/Assessments/${selectedAssessment.id}/questions`, questions);
      alert("Questions saved successfully!");
      setView("list");
      loadData();
    } catch (err) {
      console.error("Failed to save questions", err);
      alert("Error saving questions list.");
    }
  };

  const handleExportQuestions = () => {
    if (questions.length === 0) {
      alert("No questions to export.");
      return;
    }
    const headers = ["QuestionText", "OptionA", "OptionB", "OptionC", "OptionD", "CorrectAnswer", "Marks"];
    const rows = questions.map(q => [
      `"${q.questionText.replace(/"/g, '""')}"`,
      `"${q.optionA.replace(/"/g, '""')}"`,
      `"${q.optionB.replace(/"/g, '""')}"`,
      `"${q.optionC.replace(/"/g, '""')}"`,
      `"${q.optionD.replace(/"/g, '""')}"`,
      `"${q.correctAnswer}"`,
      q.marks
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedAssessment.title.replace(/\s+/g, "_")}_questions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleDeptSelection = (dept: string) => {
    if (selectedDepts.includes(dept)) {
      setSelectedDepts(selectedDepts.filter(d => d !== dept));
    } else {
      setSelectedDepts([...selectedDepts, dept]);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center pb-4 border-b border-[#781c1c]/10 dark:border-white/10">
        <div>
          <h2 className="text-xl font-serif font-black text-[#18233c] dark:text-white uppercase flex items-center gap-2">
            <BookOpen size={20} className="text-[#781c1c]" /> Assessments Control Panel
          </h2>
          <p className="text-xs text-slate-400 mt-1">Configure exams, questions bank, and proctoring warnings reports.</p>
        </div>

        {view === "list" ? (
          <div className="flex gap-2">
            <button
              onClick={() => setView("malpractice")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition hover:scale-105 active:scale-95 cursor-pointer ${
                themeMode === "dark" 
                  ? "bg-red-500/10 border-red-500/20 text-red-300 hover:bg-red-500/20" 
                  : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
              }`}
            >
              <AlertTriangle size={14} /> Malpractice Records ({malpractices.length})
            </button>
            <button
              onClick={() => handleOpenForm()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#781c1c] text-white hover:bg-[#5f1515] transition hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus size={14} /> Create Assessment
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setView("list"); setSelectedAssessment(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition hover:scale-105 active:scale-95 cursor-pointer ${
              themeMode === "dark" ? "bg-white/5 border-white/10 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-700"
            }`}
          >
            <ArrowLeft size={14} /> Back to List
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw size={24} className="animate-spin text-[#781c1c] mx-auto mb-3" />
          <span className="text-xs text-slate-400">Fetching assessment files...</span>
        </div>
      ) : (
        <>
          {/* ======================================= */}
          {/* VIEW: ASSESSMENTS LIST */}
          {/* ======================================= */}
          {view === "list" && (
            <div className={`border rounded-2xl overflow-hidden ${
              themeMode === "dark" ? "bg-white/[0.02] border-white/10" : "bg-white border-slate-200"
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-[10px] font-mono uppercase tracking-wider ${
                      themeMode === "dark" ? "border-white/10 text-slate-400 bg-white/[0.01]" : "border-slate-200 text-slate-500 bg-slate-50"
                    }`}>
                      <th className="p-4 font-bold">Details</th>
                      <th className="p-4 font-bold">Departments</th>
                      <th className="p-4 font-bold">Duration & Marks</th>
                      <th className="p-4 font-bold">Active Dates</th>
                      <th className="p-4 font-bold">Status</th>
                      <th className="p-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-xs">
                    {assessments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          No assessments created yet. Click "Create Assessment" to get started.
                        </td>
                      </tr>
                    ) : (
                      assessments.map(a => {
                        const isExpired = new Date() > new Date(a.endDate);
                        return (
                          <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-slate-900 dark:text-white text-sm">{a.title}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">{a.description || "No description"}</div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {a.departments.split(";").map((d: string) => (
                                  <span key={d} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-250 dark:border-white/10 text-[10px] text-slate-600 dark:text-slate-300">
                                    {d}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-4 font-mono">
                              <div>{a.duration} mins</div>
                              <div className="text-slate-400 text-[10px] mt-0.5">Total Marks: {a.totalMarks}</div>
                            </td>
                            <td className="p-4">
                              <div className="text-[10px] font-mono">
                                <div>Start: {new Date(a.startDate).toLocaleString()}</div>
                                <div className="text-slate-400 mt-0.5">End: {new Date(a.endDate).toLocaleString()}</div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {a.isClosed ? (
                                  <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-mono font-bold uppercase">Closed</span>
                                ) : isExpired ? (
                                  <span className="px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[9px] font-mono font-bold uppercase">Expired</span>
                                ) : a.isPublished ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono font-bold uppercase">Published</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-mono font-bold uppercase">Draft</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex gap-1.5 justify-end items-center">
                                <button
                                  onClick={() => handleOpenQuestions(a)}
                                  className={`p-1.5 rounded-lg border transition hover:scale-105 active:scale-95 cursor-pointer ${
                                    themeMode === "dark" ? "bg-white/5 border-white/10 text-slate-350 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-700 hover:text-[#18233c]"
                                  }`}
                                  title="Questions Bank"
                                >
                                  <FileText size={13} />
                                </button>
                                <button
                                  onClick={() => handleOpenAttempts(a)}
                                  className={`p-1.5 rounded-lg border transition hover:scale-105 active:scale-95 cursor-pointer ${
                                    themeMode === "dark" ? "bg-white/5 border-white/10 text-slate-350 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-700 hover:text-[#18233c]"
                                  }`}
                                  title="Student Attempts & Results"
                                >
                                  <Eye size={13} />
                                </button>
                                <button
                                  onClick={() => handleTogglePublish(a)}
                                  className={`p-1.5 rounded-lg border transition hover:scale-105 active:scale-95 cursor-pointer ${
                                    a.isPublished 
                                      ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/25"
                                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25"
                                  }`}
                                  title={a.isPublished ? "Unpublish Test" : "Publish Test"}
                                >
                                  {a.isPublished ? <Square size={13} /> : <Play size={13} />}
                                </button>
                                {!a.isClosed && !isExpired && (
                                  <button
                                    onClick={() => handleCloseAssessment(a.id)}
                                    className={`p-1.5 rounded-lg border transition hover:scale-105 active:scale-95 bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/25 cursor-pointer`}
                                    title="Close Test"
                                  >
                                    <XCircle size={13} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleOpenForm(a)}
                                  className={`p-1.5 rounded-lg border transition hover:scale-105 active:scale-95 cursor-pointer ${
                                    themeMode === "dark" ? "bg-white/5 border-white/10 text-slate-350 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-700 hover:text-[#18233c]"
                                  }`}
                                  title="Edit Fields"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteAssessment(a.id)}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition hover:scale-105 active:scale-95 cursor-pointer"
                                  title="Delete Permanent"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================= */}
          {/* VIEW: CREATE/EDIT FORM */}
          {/* ======================================= */}
          {view === "form" && (
            <div className={`p-6 border rounded-2xl ${
              themeMode === "dark" ? "bg-white/[0.02] border-white/10" : "bg-white border-slate-200"
            }`}>
              <form onSubmit={handleSaveAssessment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">Assessment Title *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={`w-full p-3 rounded-xl border text-xs focus:ring-1 focus:ring-[#781c1c] outline-none transition ${
                        themeMode === "dark" ? "bg-[#181824] border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                      placeholder="e.g. Mathematics Mid-Term Exam"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">Duration (Minutes) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className={`w-full p-3 rounded-xl border text-xs focus:ring-1 focus:ring-[#781c1c] outline-none transition ${
                        themeMode === "dark" ? "bg-[#181824] border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                      placeholder="e.g. 60"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-xs focus:ring-1 focus:ring-[#781c1c] outline-none transition ${
                      themeMode === "dark" ? "bg-[#181824] border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                    placeholder="Short summary of topics covered..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">Instructions / Malpractice Guidelines</label>
                  <textarea
                    rows={3}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-xs focus:ring-1 focus:ring-[#781c1c] outline-none transition ${
                      themeMode === "dark" ? "bg-[#181824] border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                    placeholder="Provide specific guidelines. Active webcam monitoring details, warning levels, etc."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">Total Marks</label>
                    <input
                      type="number"
                      required
                      value={totalMarks}
                      onChange={(e) => setTotalMarks(e.target.value)}
                      className={`w-full p-3 rounded-xl border text-xs focus:ring-1 focus:ring-[#781c1c] outline-none transition ${
                        themeMode === "dark" ? "bg-[#181824] border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={`w-full p-3 rounded-xl border text-xs focus:ring-1 focus:ring-[#781c1c] outline-none transition ${
                        themeMode === "dark" ? "bg-[#181824] border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">End Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={`w-full p-3 rounded-xl border text-xs focus:ring-1 focus:ring-[#781c1c] outline-none transition ${
                        themeMode === "dark" ? "bg-[#181824] border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block">Assigned Departments *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {departments.map(dept => {
                      const isSelected = selectedDepts.includes(dept);
                      return (
                        <button
                          type="button"
                          key={dept}
                          onClick={() => toggleDeptSelection(dept)}
                          className={`p-3 rounded-xl border text-xs font-semibold text-center transition cursor-pointer active:scale-95 ${
                            isSelected
                              ? "bg-[#781c1c]/10 border-[#781c1c] text-[#781c1c] dark:bg-white/10 dark:border-white dark:text-white"
                              : themeMode === "dark"
                                ? "bg-[#181824] border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                          }`}
                        >
                          {dept}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-250 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => { setView("list"); setSelectedAssessment(null); }}
                    className={`px-5 py-2.5 rounded-xl text-xs font-semibold border transition active:scale-95 cursor-pointer ${
                      themeMode === "dark" ? "bg-white/5 border-white/10 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-700"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#781c1c] text-white hover:bg-[#5f1515] transition active:scale-95 cursor-pointer"
                  >
                    {selectedAssessment ? "Save Changes" : "Create Assessment"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================= */}
          {/* VIEW: QUESTIONS BANK */}
          {/* ======================================= */}
          {view === "questions" && (
            <div className="space-y-4">
              <div className={`p-4 border rounded-2xl flex flex-wrap gap-4 items-center justify-between ${
                themeMode === "dark" ? "bg-white/[0.02] border-white/10" : "bg-white border-slate-200"
              }`}>
                <div>
                  <h3 className="font-bold text-sm">Exam Questions List: {selectedAssessment?.title}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Manage, validate and upload question rows.</p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv,.xlsx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition hover:scale-105 active:scale-95 cursor-pointer ${
                      themeMode === "dark" ? "bg-white/5 border-white/10 text-slate-350 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    <Upload size={13} /> Import Excel / CSV
                  </button>
                  <button
                    onClick={handleExportQuestions}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition hover:scale-105 active:scale-95 cursor-pointer ${
                      themeMode === "dark" ? "bg-white/5 border-white/10 text-slate-350 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    <Download size={13} /> Export CSV
                  </button>
                  <button
                    onClick={() => setQuestions([...questions, { questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A", marks: 1 }])}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-[#781c1c] text-white hover:bg-[#5f1515] transition hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Plus size={13} /> Add Blank Question
                  </button>
                </div>
              </div>

              {/* QUESTIONS TABLE PREVIEW */}
              <div className={`border rounded-2xl overflow-hidden ${
                themeMode === "dark" ? "bg-white/[0.02] border-white/10" : "bg-white border-slate-200"
              }`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className={`border-b text-[10px] font-mono uppercase tracking-wider ${
                        themeMode === "dark" ? "border-white/10 text-slate-400 bg-white/[0.01]" : "border-slate-200 text-slate-500 bg-slate-50"
                      }`}>
                        <th className="p-3 w-8 text-center">#</th>
                        <th className="p-3 w-96">Question Text</th>
                        <th className="p-3">Options (A, B, C, D)</th>
                        <th className="p-3 w-28">Correct Choice</th>
                        <th className="p-3 w-20">Marks</th>
                        <th className="p-3 w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-xs">
                      {questions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            No questions in bank. Add a blank question or import an Excel/CSV spreadsheet.
                          </td>
                        </tr>
                      ) : (
                        questions.map((q, idx) => {
                          const isQEmpty = !q.questionText.trim();
                          const isOptsEmpty = !q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim();
                          const isAnsInvalid = !["A", "B", "C", "D"].includes(q.correctAnswer.trim().toUpperCase());
                          const isMarksInvalid = isNaN(parseInt(q.marks)) || parseInt(q.marks) <= 0;
                          
                          const hasError = isQEmpty || isOptsEmpty || isAnsInvalid || isMarksInvalid;
                          
                          return (
                            <tr key={idx} className={`${hasError ? "bg-red-500/5" : ""}`}>
                              <td className="p-3 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                              
                              <td className="p-3">
                                <textarea
                                  rows={2}
                                  value={q.questionText}
                                  onChange={(e) => handleUpdateQuestionCell(idx, "questionText", e.target.value)}
                                  className={`w-full p-2 rounded-lg border text-xs focus:ring-1 focus:ring-[#781c1c] outline-none resize-y ${
                                    isQEmpty ? "border-red-400" : "border-slate-200 dark:border-white/10"
                                  } ${themeMode === "dark" ? "bg-slate-900 text-white" : "bg-white text-slate-800"}`}
                                  placeholder="Type question here..."
                                />
                              </td>
                              
                              <td className="p-3 space-y-1">
                                <div className="grid grid-cols-2 gap-1.5">
                                  <input
                                    type="text"
                                    value={q.optionA}
                                    onChange={(e) => handleUpdateQuestionCell(idx, "optionA", e.target.value)}
                                    placeholder="Option A"
                                    className={`p-1.5 rounded-lg border text-[11px] outline-none ${
                                      !q.optionA.trim() ? "border-red-400" : "border-slate-200 dark:border-white/10"
                                    } ${themeMode === "dark" ? "bg-slate-900 text-white" : "bg-white text-slate-800"}`}
                                  />
                                  <input
                                    type="text"
                                    value={q.optionB}
                                    onChange={(e) => handleUpdateQuestionCell(idx, "optionB", e.target.value)}
                                    placeholder="Option B"
                                    className={`p-1.5 rounded-lg border text-[11px] outline-none ${
                                      !q.optionB.trim() ? "border-red-400" : "border-slate-200 dark:border-white/10"
                                    } ${themeMode === "dark" ? "bg-slate-900 text-white" : "bg-white text-slate-800"}`}
                                  />
                                  <input
                                    type="text"
                                    value={q.optionC}
                                    onChange={(e) => handleUpdateQuestionCell(idx, "optionC", e.target.value)}
                                    placeholder="Option C"
                                    className={`p-1.5 rounded-lg border text-[11px] outline-none ${
                                      !q.optionC.trim() ? "border-red-400" : "border-slate-200 dark:border-white/10"
                                    } ${themeMode === "dark" ? "bg-slate-900 text-white" : "bg-white text-slate-800"}`}
                                  />
                                  <input
                                    type="text"
                                    value={q.optionD}
                                    onChange={(e) => handleUpdateQuestionCell(idx, "optionD", e.target.value)}
                                    placeholder="Option D"
                                    className={`p-1.5 rounded-lg border text-[11px] outline-none ${
                                      !q.optionD.trim() ? "border-red-400" : "border-slate-200 dark:border-white/10"
                                    } ${themeMode === "dark" ? "bg-slate-900 text-white" : "bg-white text-slate-800"}`}
                                  />
                                </div>
                              </td>

                              <td className="p-3">
                                <select
                                  value={q.correctAnswer}
                                  onChange={(e) => handleUpdateQuestionCell(idx, "correctAnswer", e.target.value)}
                                  className={`w-full p-2 rounded-lg border text-xs outline-none ${
                                    isAnsInvalid ? "border-red-400" : "border-slate-200 dark:border-white/10"
                                  } ${themeMode === "dark" ? "bg-slate-900 text-white" : "bg-white text-slate-800"}`}
                                >
                                  <option value="A">Option A</option>
                                  <option value="B">Option B</option>
                                  <option value="C">Option C</option>
                                  <option value="D">Option D</option>
                                </select>
                              </td>

                              <td className="p-3">
                                <input
                                  type="number"
                                  min="1"
                                  value={q.marks}
                                  onChange={(e) => handleUpdateQuestionCell(idx, "marks", e.target.value)}
                                  className={`w-full p-2 rounded-lg border text-xs outline-none ${
                                    isMarksInvalid ? "border-red-400" : "border-slate-200 dark:border-white/10"
                                  } ${themeMode === "dark" ? "bg-slate-900 text-white" : "bg-white text-slate-800"}`}
                                />
                              </td>

                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleDeleteQuestion(idx)}
                                  className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 cursor-pointer transition active:scale-95"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setView("list")}
                  className={`px-5 py-2.5 rounded-xl text-xs font-semibold border transition active:scale-95 cursor-pointer ${
                    themeMode === "dark" ? "bg-white/5 border-white/10 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-700"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveQuestions}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#781c1c] text-white hover:bg-[#5f1515] transition active:scale-95 cursor-pointer"
                >
                  Save Question Bank
                </button>
              </div>
            </div>
          )}

          {/* ======================================= */}
          {/* VIEW: ATTEMPTS LIST & RESULTS */}
          {/* ======================================= */}
          {view === "attempts" && (
            <div className="space-y-4">
              <div className={`p-4 border rounded-2xl flex items-center justify-between ${
                themeMode === "dark" ? "bg-white/[0.02] border-white/10" : "bg-white border-slate-200"
              }`}>
                <div>
                  <h3 className="font-bold text-sm">Attempts & Results: {selectedAssessment?.title}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">View scores, test duration details, proctoring warning reports.</p>
                </div>
              </div>

              <div className={`border rounded-2xl overflow-hidden ${
                themeMode === "dark" ? "bg-white/[0.02] border-white/10" : "bg-white border-slate-200"
              }`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b text-[10px] font-mono uppercase tracking-wider ${
                        themeMode === "dark" ? "border-white/10 text-slate-400 bg-white/[0.01]" : "border-slate-200 text-slate-500 bg-slate-50"
                      }`}>
                        <th className="p-4 font-bold">Student</th>
                        <th className="p-4 font-bold">Register Number</th>
                        <th className="p-4 font-bold">Score (obtained / total)</th>
                        <th className="p-4 font-bold">Percentage</th>
                        <th className="p-4 font-bold">Proctoring Flags</th>
                        <th className="p-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-xs">
                      {attempts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            No student attempts found for this assessment.
                          </td>
                        </tr>
                      ) : (
                        attempts.map(att => (
                          <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01]">
                            <td className="p-4">
                              <div className="font-bold text-slate-900 dark:text-white">{att.studentName}</div>
                              <div className="text-[10px] text-slate-400">{att.department}</div>
                            </td>
                            <td className="p-4 font-mono">{att.registerNumber}</td>
                            <td className="p-4 font-mono font-bold">
                              {att.status === "MALPRACTICE_TERMINATED" ? (
                                <span className="text-red-400 flex items-center gap-1"><XCircle size={12} /> Malpractice Flag</span>
                              ) : att.score !== null ? (
                                `${att.score} / ${att.assessmentTotalMarks}`
                              ) : (
                                "In Progress"
                              )}
                            </td>
                            <td className="p-4 font-mono">
                              {att.percentage !== null ? `${att.percentage}%` : "--"}
                            </td>
                            <td className="p-4">
                              {att.warningsCount > 0 ? (
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold flex items-center gap-1.5 w-fit ${
                                  att.warningsCount >= 4
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                }`}>
                                  <AlertTriangle size={10} /> {att.warningsCount} Warnings
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono">None</span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              {att.warningsCount > 0 && (
                                <button
                                  onClick={() => {
                                    setSelectedAttemptWarnings(att.warnings || []);
                                    setShowWarningModal(true);
                                  }}
                                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition active:scale-95 cursor-pointer ${
                                    themeMode === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-slate-100 border-slate-200 text-slate-800"
                                  }`}
                                >
                                  View Proctoring Log
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================= */}
          {/* VIEW: MALPRACTICE RECORDS */}
          {/* ======================================= */}
          {view === "malpractice" && (
            <div className="space-y-4">
              <div className={`p-4 border rounded-2xl ${
                themeMode === "dark" ? "bg-white/[0.02] border-white/10" : "bg-white border-slate-200"
              }`}>
                <h3 className="font-serif font-black text-sm text-red-500 uppercase flex items-center gap-2">
                  <AlertTriangle size={16} /> Verified Malpractice Reports
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Logs of assessments closed automatically due to reaching 4 warnings.</p>
              </div>

              <div className={`border rounded-2xl overflow-hidden ${
                themeMode === "dark" ? "bg-white/[0.02] border-white/10" : "bg-white border-slate-200"
              }`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b text-[10px] font-mono uppercase tracking-wider ${
                        themeMode === "dark" ? "border-white/10 text-slate-400 bg-white/[0.01]" : "border-slate-200 text-slate-500 bg-slate-50"
                      }`}>
                        <th className="p-4 font-bold">Student Details</th>
                        <th className="p-4 font-bold">Assessment</th>
                        <th className="p-4 font-bold">Timestamp</th>
                        <th className="p-4 font-bold">Malpractice Action Logs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-xs">
                      {malpractices.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400">
                            Zero malpractice incidents logged.
                          </td>
                        </tr>
                      ) : (
                        malpractices.map(m => (
                          <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01]">
                            <td className="p-4">
                              <div className="font-bold text-slate-900 dark:text-white">{m.studentName}</div>
                              <div className="text-[10px] text-slate-400">Reg: {m.registerNumber} | {m.department}</div>
                            </td>
                            <td className="p-4 font-bold">{m.assessmentTitle}</td>
                            <td className="p-4 font-mono">{new Date(m.timestamp).toLocaleString()}</td>
                            <td className="p-4 text-slate-500 dark:text-slate-400 max-w-sm truncate" title={m.details}>
                              {m.details}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ======================================= */}
      {/* MODAL: PROCTORING LOG WARNING DETAILS */}
      {/* ======================================= */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-6 flex flex-col max-h-[80vh] overflow-hidden ${
            themeMode === "dark" ? "bg-[#121218] border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
          }`}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-250 dark:border-white/5 shrink-0">
              <h3 className="font-serif font-black text-sm uppercase flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-500" /> Proctoring Warning Log
              </h3>
              <button onClick={() => setShowWarningModal(false)} className="text-slate-400 hover:text-white cursor-pointer p-1">
                Close
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4 space-y-3.5 scrollbar-thin">
              {selectedAttemptWarnings.map((w, idx) => (
                <div key={w.id || idx} className={`p-4 rounded-xl border flex flex-col gap-1.5 ${
                  themeMode === "dark" ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="font-bold text-red-400 uppercase">Warning {w.warningNumber} of 4</span>
                    <span className="text-slate-400">{new Date(w.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-xs font-bold mt-1 text-slate-900 dark:text-white">Flag type: {w.warningType}</div>
                  <div className="text-[10px] font-mono text-slate-400 break-all leading-relaxed bg-black/10 dark:bg-black/30 p-2.5 rounded-lg mt-1">
                    {w.eventInfo}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
