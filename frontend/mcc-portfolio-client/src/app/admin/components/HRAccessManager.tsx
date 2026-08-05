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
} from "lucide-react";
import api from "@/services/api";

interface CompanyUser {
  Id: number;
  FullName: string;
  Email: string;
  Designation: string;
  Phone: string;
  IsActive: boolean;
}

interface CompanyItem {
  Id: number;
  Name: string;
  Email: string;
  Status: string;
  AllowedDepartments: string;
  CreatedAt: string;
  Users: CompanyUser[];
}

export default function HRAccessManager() {
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
      const { companies: fetchedCompanies, allDepartments: fetchedDepts } = res.data;
      setCompanies(fetchedCompanies || []);
      setAllDepartments(fetchedDepts || []);

      if (fetchedCompanies && fetchedCompanies.length > 0 && selectedCompanyId === null) {
        const first = fetchedCompanies[0];
        setSelectedCompanyId(first.Id);
        parseAllowedDepartments(first.AllowedDepartments);
      }
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
    setSelectedCompanyId(companyId);
    const comp = companies.find((c) => c.Id === companyId);
    if (comp) {
      parseAllowedDepartments(comp.AllowedDepartments);
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

      // Update local state
      setCompanies((prev) =>
        prev.map((c) =>
          c.Id === selectedCompanyId
            ? { ...c, AllowedDepartments: res.data.allowedDepartments }
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

  const filteredCompanies = companies.filter(
    (c) =>
      c.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.Email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.Users.some((u) => u.FullName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedCompany = companies.find((c) => c.Id === selectedCompanyId);
  const isAllDeptsSelected = selectedDepts.length === 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              HR Data Access & Department Permissions
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Select an HR Company to grant or restrict access to specific student departments.
            </p>
          </div>
        </div>

        <button
          onClick={fetchHRAccessData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 transition cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Data
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 ${
            statusMessage.type === "success"
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
              : "bg-red-950/40 border-red-800 text-red-300"
          }`}
        >
          {statusMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANEL: HR Company Selector List */}
        <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 size={16} className="text-red-400" />
              Registered HRs ({filteredCompanies.length})
            </h3>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search company or HR representative..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white pl-10 pr-4 py-2.5 outline-none focus:border-red-500 transition"
            />
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <div className="text-center py-8 text-xs text-slate-500 font-medium">
                Loading HR directory...
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 font-medium">
                No HR companies found.
              </div>
            ) : (
              filteredCompanies.map((comp) => {
                const isSelected = comp.Id === selectedCompanyId;
                const hasRestrictions = Boolean(comp.AllowedDepartments && comp.AllowedDepartments.trim().length > 0);
                const hrRep = comp.Users[0]?.FullName || "HR Admin";

                return (
                  <button
                    key={comp.Id}
                    onClick={() => handleSelectCompany(comp.Id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-red-500/10 border-red-500/40 text-white shadow-lg"
                        : "bg-slate-950/40 hover:bg-slate-800/40 border-slate-800/80 text-slate-300"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-xs text-white flex items-center gap-2">
                        {comp.Name}
                        {hasRestrictions ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            Restricted
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            All Access
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <Users size={12} /> {hrRep} ({comp.Email})
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Department Access Control Matrix */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6">
          {selectedCompany ? (
            <>
              <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-base font-black text-white">
                    Access Permissions for {selectedCompany.Name}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Configure which student departments this HR can search & view.
                  </p>
                </div>

                <button
                  onClick={handleSavePermissions}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#781c1c] hover:bg-[#5f1515] text-white text-xs font-extrabold uppercase tracking-wider transition-all duration-200 shadow-lg shadow-red-950/40 cursor-pointer disabled:opacity-50"
                >
                  <Save size={15} /> {saving ? "Saving..." : "Save Permissions"}
                </button>
              </div>

              {/* Access Mode Summary Toggle */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isAllDeptsSelected ? (
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Unlock size={20} />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Lock size={20} />
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-extrabold text-white">
                      {isAllDeptsSelected
                        ? "Full Access Mode (All Departments)"
                        : `Restricted Access (${selectedDepts.length} Department${selectedDepts.length > 1 ? "s" : ""})`}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium">
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
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                  }`}
                >
                  Grant All
                </button>
              </div>

              {/* Department Checkboxes */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
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
                            ? "bg-red-500/10 border-red-500/40 text-white"
                            : "bg-slate-950/40 hover:bg-slate-800/40 border-slate-800 text-slate-400"
                        }`}
                      >
                        <span className="text-xs font-bold">{dept}</span>
                        {isChecked ? (
                          <CheckSquare size={18} className="text-red-400 shrink-0" />
                        ) : (
                          <Square size={18} className="text-slate-600 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-slate-500 text-xs font-medium">
              Select an HR company from the left panel to configure data access.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
