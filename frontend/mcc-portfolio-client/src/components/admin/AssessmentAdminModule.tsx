"use client";

import { useState, useEffect } from "react";
import {
  ClipboardList, Plus, Trash2, Edit3, Eye, FileSpreadsheet, Download, Upload,
  CheckCircle2, XCircle, AlertTriangle, ShieldAlert, Clock, Calendar, Users,
  BookOpen, ChevronRight, FileText, Lock, Play, Pause, AlertOctagon, Check, RefreshCw
} from "lucide-react";
import api from "@/services/api";

const DEPARTMENTS = [
  "Computer Science",
  "Mathematics",
  "Tamil",
  "English",
  "Commerce",
  "Physics",
  "Chemistry",
  "Economics",
  "History",
  "Aided",
  "Self-Financed",
  "All"
];

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

export default function AssessmentAdminModule() {
  const [activeTab, setActiveTab] = useState<"assessments" | "attempts" | "reports">("assessments");
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  // Assessment Form Modal
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

  // Question Manager Modal
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

  // Excel / CSV Import & Validation Preview
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importReplace, setImportReplace] = useState(false);

  // Attempts & Malpractice Modal
  const [selectedAssessmentForAttempts, setSelectedAssessmentForAttempts] = useState<Assessment | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  // Warning & Malpractice Log Inspector
  const [showMalpracticeModal, setShowMalpracticeModal] = useState(false);
  const [selectedAttemptMalpractice, setSelectedAttemptMalpractice] = useState<any | null>(null);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Assessments");
      setAssessments(res.data);
    } catch (err) {
      console.error("Failed to load assessments:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Assessment CRUD ──
  const openCreateModal = () => {
    setEditingAssessment(null);
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
    setShowAssessmentModal(true);
  };

  const openEditModal = (item: Assessment) => {
    setEditingAssessment(item);
    const depts = item.departments ? item.departments.split(";") : ["All"];
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
      if (editingAssessment) {
        await api.put(`/Assessments/${editingAssessment.id}`, payload);
      } else {
        await api.post("/Assessments", payload);
      }
      setShowAssessmentModal(false);
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

  const handleCloseAssessment = async (id: number) => {
    try {
      await api.post(`/Assessments/${id}/close`);
      fetchAssessments();
    } catch (err) {
      alert("Failed to close assessment.");
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

  // ── Questions Manager ──
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

  // ── Excel/CSV Import & Validation Preview ──
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const lines = content.split(/\r\n|\n/).filter((l) => l.trim() !== "");
      if (lines.length < 2) return alert("File appears empty or missing headers.");

      const rows: any[] = [];
      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        // Parse CSV values taking care of quotes
        const line = lines[i];
        const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
        const clean = (cols || []).map((c) => c.replace(/^"|"$/g, "").trim());

        const qText = clean[0] || "";
        const optA = clean[1] || "";
        const optB = clean[2] || "";
        const optC = clean[3] || "";
        const optD = clean[4] || "";
        const correct = (clean[5] || "A").toUpperCase();
        const marksVal = parseInt(clean[6] || "5");

        const isValid =
          Boolean(qText) &&
          Boolean(optA) &&
          Boolean(optB) &&
          Boolean(optC) &&
          Boolean(optD) &&
          ["A", "B", "C", "D"].includes(correct) &&
          !isNaN(marksVal) &&
          marksVal > 0;

        rows.push({
          rowNum: i,
          questionText: qText,
          optionA: optA,
          optionB: optB,
          optionC: optC,
          optionD: optD,
          correctOption: correct,
          marks: isNaN(marksVal) ? 5 : marksVal,
          isValid,
        });
      }

      setImportRows(rows);
      setShowImportModal(true);
    };
    reader.readAsText(file);
  };

  const updateImportRow = (index: number, field: string, value: any) => {
    setImportRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // Re-validate
      const r = updated[index];
      r.isValid =
        Boolean(r.questionText?.trim()) &&
        Boolean(r.optionA?.trim()) &&
        Boolean(r.optionB?.trim()) &&
        Boolean(r.optionC?.trim()) &&
        Boolean(r.optionD?.trim()) &&
        ["A", "B", "C", "D"].includes((r.correctOption || "").toUpperCase()) &&
        !isNaN(parseInt(r.marks)) &&
        parseInt(r.marks) > 0;
      return updated;
    });
  };

  const handleCommitImport = async () => {
    if (!currentAssessment) return;
    const validQuestions = importRows
      .filter((r) => r.isValid)
      .map((r) => ({
        questionText: r.questionText,
        optionA: r.optionA,
        optionB: r.optionB,
        optionC: r.optionC,
        optionD: r.optionD,
        correctOption: r.correctOption.toUpperCase(),
        marks: parseInt(r.marks),
      }));

    if (validQuestions.length === 0) return alert("No valid questions to import.");

    try {
      await api.post(`/Assessments/${currentAssessment.id}/questions`, {
        questions: validQuestions,
        replace: importReplace,
      });
      setShowImportModal(false);
      openQuestionsModal(currentAssessment);
      fetchAssessments();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Import failed.");
    }
  };

  const handleExportCSV = (assessmentId: number) => {
    window.open(`/api/Assessments/${assessmentId}/questions/export`, "_blank");
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" /> Assessment & Online Proctoring Control
          </div>
          <h2 className="text-2xl font-bold">Department Assessment Module</h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage department-wise assessments, Excel question imports, student results, and anti-malpractice monitoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Assessment
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-700/60 text-sm font-medium">
        <button
          onClick={() => setActiveTab("assessments")}
          className={`pb-3 px-4 flex items-center gap-2 font-semibold border-b-2 transition ${
            activeTab === "assessments" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <ClipboardList className="w-4 h-4" /> All Assessments ({assessments.length})
        </button>
        {selectedAssessmentForAttempts && (
          <button
            onClick={() => setActiveTab("attempts")}
            className={`pb-3 px-4 flex items-center gap-2 font-semibold border-b-2 transition ${
              activeTab === "attempts" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" /> Attempts: {selectedAssessmentForAttempts.title}
          </button>
        )}
      </div>

      {/* TAB 1: ALL ASSESSMENTS LIST */}
      {activeTab === "assessments" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" /> Loading assessments...
            </div>
          ) : assessments.length === 0 ? (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-700 rounded-2xl p-8">
              <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-200">No Assessments Created Yet</h3>
              <p className="text-slate-400 text-sm mt-1 mb-4">Create department-wise MCQ assessments to start testing students.</p>
              <button
                onClick={openCreateModal}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl text-sm"
              >
                Create First Assessment
              </button>
            </div>
          ) : (
            assessments.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        item.status === "Published"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : item.status === "Closed"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {item.durationMinutes} mins
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white line-clamp-1">{item.title}</h3>
                  <p className="text-slate-400 text-sm mt-1 line-clamp-2">{item.description || "No description provided."}</p>

                  {/* Target Departments */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {item.departments.split(";").map((d) => (
                      <span key={d} className="text-xs bg-slate-800 text-indigo-300 font-medium px-2 py-0.5 rounded-md border border-slate-700">
                        {d}
                      </span>
                    ))}
                  </div>

                  {/* Info Row */}
                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                    <div>
                      <span className="text-slate-500">Questions:</span>{" "}
                      <strong className="text-slate-200">{item.questionCount}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Total Marks:</span>{" "}
                      <strong className="text-slate-200">{item.totalMarks}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Attempts:</span>{" "}
                      <strong className="text-slate-200">{item.attemptCount}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Proctoring:</span>{" "}
                      <strong className="text-emerald-400">Enabled (4 Warnings)</strong>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openQuestionsModal(item)}
                      title="Manage Questions & Import Excel"
                      className="bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Questions ({item.questionCount})
                    </button>

                    <button
                      onClick={() => viewAttempts(item)}
                      title="View Student Results & Malpractice"
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <Users className="w-3.5 h-3.5" /> Results ({item.attemptCount})
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePublish(item.id)}
                      title={item.status === "Published" ? "Unpublish Assessment" : "Publish Assessment"}
                      className={`p-1.5 rounded-lg border text-xs font-semibold ${
                        item.status === "Published"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                      }`}
                    >
                      {item.status === "Published" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => openEditModal(item)}
                      title="Edit Assessment"
                      className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteAssessment(item.id)}
                      title="Delete Assessment"
                      className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg border border-rose-500/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: ATTEMPTS & MALPRACTICE INSPECTION */}
      {activeTab === "attempts" && selectedAssessmentForAttempts && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-xl font-bold text-white">{selectedAssessmentForAttempts.title} — Student Attempts</h3>
              <p className="text-slate-400 text-sm">Target Departments: {selectedAssessmentForAttempts.departments}</p>
            </div>
            <button
              onClick={() => setActiveTab("assessments")}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 self-start"
            >
              ← Back to Assessments
            </button>
          </div>

          {loadingAttempts ? (
            <div className="py-12 text-center text-slate-400">Loading attempt records...</div>
          ) : attempts.length === 0 ? (
            <div className="py-8 text-center text-slate-400">No students have attempted this assessment yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-xs border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Register No / Email</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Percentage</th>
                    <th className="py-3 px-4">Proctoring Warnings</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {attempts.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-850/40">
                      <td className="py-3 px-4 font-semibold text-white">{att.studentName}</td>
                      <td className="py-3 px-4 text-xs text-slate-400">{att.registerNumber}<br/>{att.email}</td>
                      <td className="py-3 px-4 text-xs">{att.department}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            att.isMalpractice || att.status === "Terminated"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : att.status === "Submitted" || att.status === "AutoSubmitted"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {att.isMalpractice ? "Terminated (Malpractice)" : att.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold">{att.marksObtained} / {att.totalMarks}</td>
                      <td className="py-3 px-4 font-bold text-indigo-300">{att.percentage}%</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-md font-semibold ${
                          att.warningCount >= 4 ? "bg-rose-500/20 text-rose-300" : att.warningCount > 0 ? "bg-amber-500/20 text-amber-300" : "bg-slate-800 text-slate-400"
                        }`}>
                          {att.warningCount} / 4 Warnings
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedAttemptMalpractice(att);
                            setShowMalpracticeModal(true);
                          }}
                          className="bg-indigo-950 hover:bg-indigo-900 text-indigo-300 text-xs px-2.5 py-1 rounded-lg border border-indigo-800"
                        >
                          View Proctor Logs
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

      {/* CREATE / EDIT ASSESSMENT MODAL */}
      {showAssessmentModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white">
                {editingAssessment ? "Edit Assessment" : "Create New Assessment"}
              </h3>
              <button onClick={() => setShowAssessmentModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveAssessment} className="space-y-4 text-sm text-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Assessment Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Mathematics Mid-Term MCQ Assessment 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description for students..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Assessment Instructions</label>
                <textarea
                  rows={3}
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Rules, camera proctoring notice, negative marks logic..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Total Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Department Multi-Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Target Departments *</label>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                  {DEPARTMENTS.map((dept) => {
                    const isSelected = formData.selectedDepts.includes(dept);
                    return (
                      <button
                        type="button"
                        key={dept}
                        onClick={() => toggleDept(dept)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-500 shadow"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {dept} {isSelected && "✓"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssessmentModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  {editingAssessment ? "Update Assessment" : "Save & Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUESTION MANAGER & EXCEL IMPORT MODAL */}
      {showQuestionModal && currentAssessment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-6 my-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white">Questions Manager — {currentAssessment.title}</h3>
                <p className="text-xs text-slate-400">Add questions manually or import in bulk using Excel / CSV files.</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 shadow">
                  <Upload className="w-3.5 h-3.5" /> Import CSV/Excel
                  <input type="file" accept=".csv, .xlsx, .txt" onChange={handleFileUpload} className="hidden" />
                </label>
                <button
                  onClick={() => handleExportCSV(currentAssessment.id)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
                <button onClick={() => setShowQuestionModal(false)} className="text-slate-400 hover:text-white text-lg px-2">✕</button>
              </div>
            </div>

            {/* Manual Question Entry Form */}
            <form onSubmit={handleSaveQuestion} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                {editingQIndex !== null ? `Edit Question #${editingQIndex + 1}` : "Add New Question"}
              </h4>
              <textarea
                rows={2}
                required
                value={qFormData.questionText}
                onChange={(e) => setQFormData({ ...qFormData, questionText: e.target.value })}
                placeholder="Enter question text..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <input
                  type="text"
                  required
                  placeholder="Option A *"
                  value={qFormData.optionA}
                  onChange={(e) => setQFormData({ ...qFormData, optionA: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                />
                <input
                  type="text"
                  required
                  placeholder="Option B *"
                  value={qFormData.optionB}
                  onChange={(e) => setQFormData({ ...qFormData, optionB: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                />
                <input
                  type="text"
                  required
                  placeholder="Option C *"
                  value={qFormData.optionC}
                  onChange={(e) => setQFormData({ ...qFormData, optionC: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                />
                <input
                  type="text"
                  required
                  placeholder="Option D *"
                  value={qFormData.optionD}
                  onChange={(e) => setQFormData({ ...qFormData, optionD: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 mr-2">Correct Option:</span>
                    <select
                      value={qFormData.correctOption}
                      onChange={(e) => setQFormData({ ...qFormData, correctOption: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white"
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-slate-400 mr-2">Marks:</span>
                    <input
                      type="number"
                      min={1}
                      value={qFormData.marks}
                      onChange={(e) => setQFormData({ ...qFormData, marks: Number(e.target.value) })}
                      className="w-16 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {editingQIndex !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQIndex(null);
                        setQFormData({ questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", marks: 5 });
                      }}
                      className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow"
                  >
                    {editingQIndex !== null ? "Update Question" : "+ Add Question"}
                  </button>
                </div>
              </div>
            </form>

            {/* Questions Table */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-200">Current Question Set ({questions.length})</h4>
              {loadingQuestions ? (
                <div className="py-6 text-center text-slate-400">Loading questions...</div>
              ) : questions.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-xl">
                  No questions added yet. Use manual entry above or upload CSV/Excel.
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {questions.map((q, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-start justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="font-semibold text-white">
                          Q{idx + 1}. {q.questionText} <span className="text-indigo-400 font-normal">({q.marks} Marks)</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 text-slate-400">
                          <span className={q.correctOption === "A" ? "text-emerald-400 font-semibold" : ""}>A: {q.optionA}</span>
                          <span className={q.correctOption === "B" ? "text-emerald-400 font-semibold" : ""}>B: {q.optionB}</span>
                          <span className={q.correctOption === "C" ? "text-emerald-400 font-semibold" : ""}>C: {q.optionC}</span>
                          <span className={q.correctOption === "D" ? "text-emerald-400 font-semibold" : ""}>D: {q.optionD}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingQIndex(idx);
                            setQFormData({ ...q });
                          }}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteQuestion(idx)} className="p-1 text-rose-400 hover:text-rose-300">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EXCEL PREVIEW & VALIDATION MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Excel / CSV Question Import & Validation Preview
                </h3>
                <p className="text-xs text-slate-400">Review, validate, and edit questions before saving to assessment database.</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Validation Summary */}
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center gap-4">
                <span className="text-slate-300 font-medium">Total Rows: {importRows.length}</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Valid: {importRows.filter((r) => r.isValid).length}
                </span>
                <span className="text-rose-400 font-semibold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Invalid / Incomplete: {importRows.filter((r) => !r.isValid).length}
                </span>
              </div>
              <label className="flex items-center gap-2 text-slate-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={importReplace}
                  onChange={(e) => setImportReplace(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600"
                />
                Replace existing questions
              </label>
            </div>

            {/* Editable Preview Table */}
            <div className="max-h-80 overflow-y-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Question Text</th>
                    <th className="py-2.5 px-3">Opt A</th>
                    <th className="py-2.5 px-3">Opt B</th>
                    <th className="py-2.5 px-3">Opt C</th>
                    <th className="py-2.5 px-3">Opt D</th>
                    <th className="py-2.5 px-3">Correct</th>
                    <th className="py-2.5 px-3">Marks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {importRows.map((row, idx) => (
                    <tr key={idx} className={row.isValid ? "hover:bg-slate-850/40" : "bg-rose-950/20 hover:bg-rose-950/30"}>
                      <td className="py-2 px-3 font-semibold text-slate-400">{row.rowNum}</td>
                      <td className="py-2 px-3">
                        {row.isValid ? (
                          <span className="text-emerald-400 font-semibold">Valid</span>
                        ) : (
                          <span className="text-rose-400 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Fix Data
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={row.questionText}
                          onChange={(e) => updateImportRow(idx, "questionText", e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 px-2 py-1 rounded text-white"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={row.optionA}
                          onChange={(e) => updateImportRow(idx, "optionA", e.target.value)}
                          className="w-32 bg-slate-950 border border-slate-800 px-2 py-1 rounded text-white"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={row.optionB}
                          onChange={(e) => updateImportRow(idx, "optionB", e.target.value)}
                          className="w-32 bg-slate-950 border border-slate-800 px-2 py-1 rounded text-white"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={row.optionC}
                          onChange={(e) => updateImportRow(idx, "optionC", e.target.value)}
                          className="w-32 bg-slate-950 border border-slate-800 px-2 py-1 rounded text-white"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={row.optionD}
                          onChange={(e) => updateImportRow(idx, "optionD", e.target.value)}
                          className="w-32 bg-slate-950 border border-slate-800 px-2 py-1 rounded text-white"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={row.correctOption}
                          onChange={(e) => updateImportRow(idx, "correctOption", e.target.value)}
                          className="bg-slate-950 border border-slate-800 px-2 py-1 rounded text-white font-bold"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">Option C (C)</option>
                          <option value="D">Option D (D)</option>
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={row.marks}
                          onChange={(e) => updateImportRow(idx, "marks", e.target.value)}
                          className="w-14 bg-slate-950 border border-slate-800 px-2 py-1 rounded text-white"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-400">Only rows marked as Valid will be committed to the database.</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCommitImport}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20"
                >
                  Commit Valid Questions ({importRows.filter((r) => r.isValid).length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROCTORING & MALPRACTICE INSPECTION MODAL */}
      {showMalpracticeModal && selectedAttemptMalpractice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-500" /> Proctoring & Warning Inspector
                </h3>
                <p className="text-xs text-slate-400">
                  Student: <strong className="text-white">{selectedAttemptMalpractice.studentName}</strong> ({selectedAttemptMalpractice.registerNumber})
                </p>
              </div>
              <button onClick={() => setShowMalpracticeModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Status Summary Banner */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                selectedAttemptMalpractice.isMalpractice
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  : "bg-slate-950 border-slate-800 text-slate-300"
              }`}
            >
              <div>
                <div className="font-bold text-sm">
                  Attempt Status: {selectedAttemptMalpractice.isMalpractice ? "TERMINATED FOR MALPRACTICE" : selectedAttemptMalpractice.status}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Warnings Triggered: <strong>{selectedAttemptMalpractice.warningCount || 0} / 4</strong>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-900 border border-slate-700">
                Score: {selectedAttemptMalpractice.marksObtained} / {selectedAttemptMalpractice.totalMarks} ({selectedAttemptMalpractice.percentage}%)
              </span>
            </div>

            {/* Warnings Log Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Detailed Violation Audit Trail</h4>
              {selectedAttemptMalpractice.warningLogs?.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  No proctoring violations recorded for this attempt.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedAttemptMalpractice.warningLogs?.map((log: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-start justify-between text-xs gap-3">
                      <div>
                        <div className="font-semibold text-rose-400 flex items-center gap-1.5">
                          <AlertOctagon className="w-3.5 h-3.5" /> Warning #{log.warningNum} — {log.warningType}
                        </div>
                        <p className="text-slate-300 mt-1">{log.details || "Suspicious proctoring activity detected."}</p>
                      </div>
                      <span className="text-slate-500 whitespace-nowrap text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowMalpracticeModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
