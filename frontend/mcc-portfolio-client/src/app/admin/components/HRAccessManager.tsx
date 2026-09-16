"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  ShieldCheck,
  CheckSquare,
  Square,
  Save,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  Unlock,
  Building,
} from "lucide-react";
import api from "@/services/api";
import { useTheme } from "@/hooks/useTheme";

interface CompanyUser {
  id: number;
  fullName: string;
  email: string;
  designation: string;
  phone: string;
  isActive: boolean;
}

interface CompanyItem {
  id: number;
  name: string;
  email: string;
  status: string;
  allowedDepartments: string;
  createdAt: string;
  users: CompanyUser[];
}

export default function HRAccessManager() {
  const [themeMode] = useTheme();
  const isDark = themeMode === "dark";

  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [allDepartments, setAllDepartments] = useState<string[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchHRAccessData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/Admin/hr-access");
      const rawCompanies = res.data?.companies || [];
      const fetchedDepts = res.data?.allDepartments || [];

      // Normalize companies so both camelCase and PascalCase are handled seamlessly
      const normalizedCompanies: CompanyItem[] = rawCompanies.map((c: any) => ({
        id: Number(c.id ?? c.Id),
        name: String(c.name ?? c.Name ?? "Unnamed Company"),
        email: String(c.email ?? c.Email ?? ""),
        status: String(c.status ?? c.Status ?? ""),
        allowedDepartments: String(c.allowedDepartments ?? c.AllowedDepartments ?? ""),
        createdAt: String(c.createdAt ?? c.CreatedAt ?? ""),
        users: (c.users ?? c.Users ?? []).map((u: any) => ({
          id: Number(u.id ?? u.Id),
          fullName: String(u.fullName ?? u.FullName ?? "HR Admin"),
          email: String(u.email ?? u.Email ?? ""),
          designation: String(u.designation ?? u.Designation ?? "HR Representative"),
          phone: String(u.phone ?? u.Phone ?? ""),
          isActive: Boolean(u.isActive ?? u.IsActive ?? true),
        })),
      }));

      setCompanies(normalizedCompanies);
      setAllDepartments(fetchedDepts);

      // Keep existing selection if it still exists; don't force select if unselected
      setSelectedCompanyId((prev) => {
        if (prev === null) return null;
        const exists = normalizedCompanies.find((c) => c.id === prev);
        if (exists) {
          parseAllowedDepartments(exists.allowedDepartments);
          return prev;
        }
        return null;
      });
    } catch (err: any) {
      console.error("Failed to load HR access permissions:", err);
      setStatusMessage({ type: "error", text: "Failed to load HR companies list." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRAccessData();
  }, []);

  const parseAllowedDepartments = (deptString: string) => {
    if (!deptString || deptString.trim() === "") {
      setSelectedDepts([]); // Empty array = "All Departments Allowed"
    } else {
      setSelectedDepts(
        deptString
          .split(";")
          .map((d) => d.trim())
          .filter(Boolean)
      );
    }
  };

  const handleSelectCompany = (companyId: number) => {
    // If clicking the currently selected HR company again, unselect it
    if (selectedCompanyId === companyId) {
      setSelectedCompanyId(null);
      setSelectedDepts([]);
      return;
    }

    setSelectedCompanyId(companyId);
    const comp = companies.find((c) => c.id === companyId);
    if (comp) {
      parseAllowedDepartments(comp.allowedDepartments);
    }
  };

  const toggleDepartment = (dept: string) => {
    setSelectedDepts((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const selectAllDepartments = () => {
    setSelectedDepts([]); // Empty array denotes unrestricted access to all departments
  };

  const handleSavePermissions = async () => {
    if (!selectedCompanyId) return;

    try {
      setSaving(true);
      setStatusMessage(null);

      const res = await api.put("/Admin/hr-access", {
        companyId: selectedCompanyId,
        allowedDepartments: selectedDepts,
      });

      const updatedDeptStr =
        res.data?.allowedDepartments ??
        (selectedDepts.length > 0 ? selectedDepts.join(";") : "");

      // Update local state
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === selectedCompanyId
            ? { ...c, allowedDepartments: updatedDeptStr }
            : c
        )
      );

      setStatusMessage({
        type: "success",
        text: "HR department permissions saved successfully!",
      });
    } catch (err: any) {
      console.error("Failed to save HR permissions:", err);
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update HR department permissions.",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = c.name.toLowerCase().includes(q);
    const emailMatch = c.email.toLowerCase().includes(q);
    const userMatch = c.users.some(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
    return nameMatch || emailMatch || userMatch;
  });

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const isAllDeptsSelected = selectedDepts.length === 0;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Banner */}
      <div
        className={`border rounded-3xl p-6 transition-all duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          isDark
            ? "bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-lg"
            : "bg-white border-slate-200 shadow-sm"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className={`text-xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              HR Data Access & Department Permissions
            </h2>
            <p className={`text-xs font-medium mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Select an HR Company to grant or restrict access to specific student departments.
            </p>
          </div>
        </div>

        <button
          onClick={fetchHRAccessData}
          disabled={loading}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer disabled:opacity-50 ${
            isDark
              ? "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
              : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
          }`}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Data
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 ${
            statusMessage.type === "success"
              ? isDark
                ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
              : isDark
              ? "bg-red-950/40 border-red-800 text-red-300"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {statusMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANEL: HR Company Selector List */}
        <div
          className={`lg:col-span-5 border rounded-3xl p-5 space-y-4 transition-all duration-200 ${
            isDark
              ? "bg-slate-900/40 border-slate-800"
              : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <h3
              className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              <Building2 size={16} className="text-red-500" />
              Registered HRs ({filteredCompanies.length})
            </h3>
            {selectedCompanyId !== null && (
              <button
                onClick={() => {
                  setSelectedCompanyId(null);
                  setSelectedDepts([]);
                }}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition ${
                  isDark
                    ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                    : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600"
                }`}
              >
                Clear Selection
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search company or HR representative..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border outline-none transition ${
                isDark
                  ? "bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-500 focus:border-red-500"
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:bg-white"
              }`}
            />
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {loading ? (
              <div className="text-center py-10 text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin" /> Loading HR directory...
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 font-medium">
                No HR companies found.
              </div>
            ) : (
              filteredCompanies.map((comp) => {
                const isSelected = comp.id === selectedCompanyId;
                const hasRestrictions = Boolean(
                  comp.allowedDepartments && comp.allowedDepartments.trim().length > 0
                );
                const hrRep =
                  comp.users[0]?.fullName || comp.users[0]?.email || "HR Admin";

                return (
                  <button
                    key={comp.id}
                    onClick={() => handleSelectCompany(comp.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-150 cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? isDark
                          ? "bg-red-500/15 border-red-500/50 text-white shadow-lg shadow-red-950/20"
                          : "bg-red-50 border-red-300 text-slate-900 shadow-sm ring-1 ring-red-300"
                        : isDark
                        ? "bg-slate-950/40 hover:bg-slate-800/40 border-slate-800/80 text-slate-300"
                        : "bg-slate-50/80 hover:bg-slate-100 border-slate-200/90 text-slate-700"
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-black text-xs truncate ${
                          isSelected
                            ? isDark ? "text-white" : "text-red-950"
                            : isDark ? "text-white" : "text-slate-900"
                        }`}>
                          {comp.name}
                        </span>

                        {comp.status && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide border ${
                              comp.status === "Verified" || comp.status === "Approved"
                                ? isDark
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : isDark
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {comp.status}
                          </span>
                        )}

                        {hasRestrictions ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              isDark
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                : "bg-amber-50 border-amber-200 text-amber-700"
                            }`}
                          >
                            Restricted
                          </span>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              isDark
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : "bg-emerald-50 border-emerald-200 text-emerald-700"
                            }`}
                          >
                            All Access
                          </span>
                        )}
                      </div>

                      <div className={`text-[11px] flex items-center gap-1.5 truncate ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}>
                        <Users size={12} className="shrink-0" />
                        <span className="truncate">{hrRep} ({comp.email})</span>
                      </div>
                    </div>

                    <div className="shrink-0 pl-2">
                      {isSelected ? (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                          isDark
                            ? "bg-red-500/20 border-red-500/40 text-red-300"
                            : "bg-red-100 border-red-200 text-red-700"
                        }`}>
                          Selected
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition">
                          Select
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Department Access Control Matrix */}
        <div
          className={`lg:col-span-7 border rounded-3xl p-6 space-y-6 transition-all duration-200 ${
            isDark
              ? "bg-slate-900/40 border-slate-800"
              : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          {selectedCompany ? (
            <>
              <div className={`border-b pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                isDark ? "border-slate-800" : "border-slate-200"
              }`}>
                <div>
                  <h3 className={`text-base font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                    Access Permissions for {selectedCompany.name}
                  </h3>
                  <p className={`text-xs font-medium mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Configure which student departments this HR can search & view.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelectCompany(selectedCompany.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      isDark
                        ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                        : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600"
                    }`}
                  >
                    Unselect
                  </button>

                  <button
                    onClick={handleSavePermissions}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#781c1c] hover:bg-[#5f1515] text-white text-xs font-extrabold uppercase tracking-wider transition-all duration-200 shadow-md shadow-red-950/20 cursor-pointer disabled:opacity-50"
                  >
                    <Save size={15} /> {saving ? "Saving..." : "Save Permissions"}
                  </button>
                </div>
              </div>

              {/* Access Mode Summary Toggle */}
              <div
                className={`border rounded-2xl p-4 flex items-center justify-between transition-all duration-200 ${
                  isDark
                    ? "bg-slate-950/60 border-slate-800"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  {isAllDeptsSelected ? (
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                      <Unlock size={20} />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                      <Lock size={20} />
                    </div>
                  )}
                  <div>
                    <h4 className={`text-xs font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>
                      {isAllDeptsSelected
                        ? "Full Access Mode (All Departments)"
                        : `Restricted Access (${selectedDepts.length} Department${selectedDepts.length > 1 ? "s" : ""})`}
                    </h4>
                    <p className={`text-[11px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {isAllDeptsSelected
                        ? "HR can view student profiles across all college departments."
                        : `HR is restricted to: ${selectedDepts.join(", ")}`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={selectAllDepartments}
                  className={`text-xs font-extrabold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                    isAllDeptsSelected
                      ? isDark
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "bg-emerald-100 border-emerald-300 text-emerald-800"
                      : isDark
                      ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm"
                  }`}
                >
                  Grant All
                </button>
              </div>

              {/* Department Checkboxes */}
              <div className="space-y-3">
                <label className={`text-xs font-black uppercase tracking-wider block ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}>
                  Select Allowed Student Departments:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allDepartments.map((dept) => {
                    const isChecked = selectedDepts.includes(dept);

                    return (
                      <div
                        key={dept}
                        onClick={() => toggleDepartment(dept)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          isChecked
                            ? isDark
                              ? "bg-red-500/10 border-red-500/40 text-white"
                              : "bg-red-50 border-red-300 text-red-950 font-bold shadow-sm"
                            : isDark
                            ? "bg-slate-950/40 hover:bg-slate-800/40 border-slate-800 text-slate-400"
                            : "bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700"
                        }`}
                      >
                        <span className="text-xs">{dept}</span>
                        {isChecked ? (
                          <CheckSquare size={18} className="text-red-500 shrink-0" />
                        ) : (
                          <Square size={18} className={`shrink-0 ${isDark ? "text-slate-600" : "text-slate-400"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div
              className={`text-center py-20 rounded-3xl border border-dashed flex flex-col items-center justify-center gap-3 transition-all duration-200 ${
                isDark
                  ? "border-slate-800 text-slate-500 bg-slate-900/20"
                  : "border-slate-300 text-slate-400 bg-slate-50/50"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  isDark
                    ? "bg-slate-800/60 text-slate-400"
                    : "bg-white text-slate-400 border border-slate-200 shadow-sm"
                }`}
              >
                <Building size={26} />
              </div>
              <div className="space-y-1 text-center max-w-sm">
                <p className={`text-sm font-black ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  No HR Company Selected
                </p>
                <p className="text-xs text-slate-400 font-medium">
                  Click on an HR company from the directory on the left to configure their department permissions. Clicking it again will unselect it.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
