"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { CheckCircle2, Circle, CircleDot, ChevronDown, Sparkles, ChevronRight, Check } from "lucide-react";

export interface SectionBreakdownItem {
  id: string;
  label: string;
  totalRequired: number;
  filledRequired: number;
  status: "complete" | "partial" | "empty";
  isOptionalSection?: boolean;
}

export interface PortfolioCompletionIndicatorProps {
  // Required form state values
  fullName?: string;
  profileImageUrl?: string;
  course?: string;
  yearOfStudy?: string;
  phone?: string;
  bio?: string;
  experiencesCount?: number;
  academicRecordsCount?: number;
  achievementsCount?: number;
  projectsCount?: number;
  researchPapersCount?: number;
  skillsCount?: number;
  certificationsCount?: number;
  languagesCount?: number;
  hasLanguagesText?: boolean;
  resumesCount?: number;
  // Optional sections
  testScoresText?: string;
  patentsText?: string;
  linkedInUrl?: string;
  instagramUrl?: string;
  blogUrl?: string;
  otherHandles?: string;
  hasMediaHandles?: boolean;
  // Actions
  onNavigate?: (sectionId: string) => void;
  themeMode?: "light" | "dark";
}

export default function PortfolioCompletionIndicator({
  fullName = "",
  profileImageUrl = "",
  course = "",
  yearOfStudy = "",
  phone = "",
  bio = "",
  experiencesCount = 0,
  academicRecordsCount = 0,
  achievementsCount = 0,
  projectsCount = 0,
  researchPapersCount = 0,
  skillsCount = 0,
  certificationsCount = 0,
  languagesCount = 0,
  hasLanguagesText = false,
  resumesCount = 0,
  testScoresText = "",
  patentsText = "",
  linkedInUrl = "",
  instagramUrl = "",
  blogUrl = "",
  otherHandles = "",
  hasMediaHandles = false,
  onNavigate,
  themeMode = "light",
}: PortfolioCompletionIndicatorProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Compute completion breakdown across sections
  const { sections, totalRequiredFields, filledRequiredFields, percentage, statusBand, ringColor } = useMemo(() => {
    // 1. Header Section (5 required fields: Name, Photo, Course, Year of Study, Phone)
    const headerFields = [
      Boolean(fullName && fullName.trim()),
      Boolean(profileImageUrl && profileImageUrl.trim()),
      Boolean(course && course.trim()),
      Boolean(yearOfStudy && yearOfStudy.trim()),
      Boolean(phone && phone.trim()),
    ];
    const headerFilled = headerFields.filter(Boolean).length;
    const headerTotal = headerFields.length; // 5

    // 2. About Section (1 required: Bio/Professional Summary)
    const aboutFilled = Boolean(bio && bio.trim()) ? 1 : 0;
    const aboutTotal = 1;

    // 3. Experience (1 required: at least 1 record)
    const expFilled = experiencesCount > 0 ? 1 : 0;
    const expTotal = 1;

    // 4. Academic Details (1 required: at least 1 marksheet/record)
    const academicFilled = academicRecordsCount > 0 ? 1 : 0;
    const academicTotal = 1;

    // 5. Achievements (1 required: at least 1 achievement)
    const achFilled = achievementsCount > 0 ? 1 : 0;
    const achTotal = 1;

    // 6. Projects & Research (1 required: project or paper)
    const projFilled = (projectsCount > 0 || researchPapersCount > 0) ? 1 : 0;
    const projTotal = 1;

    // 7. Skills (1 required: at least 1 skill)
    const skillsFilled = skillsCount > 0 ? 1 : 0;
    const skillsTotal = 1;

    // 8. Certifications (1 required: at least 1 cert)
    const certsFilled = certificationsCount > 0 ? 1 : 0;
    const certsTotal = 1;

    // 9. Languages known (1 required: at least 1 language)
    const langFilled = (languagesCount > 0 || hasLanguagesText) ? 1 : 0;
    const langTotal = 1;

    // 10. Resume (1 required: at least 1 resume uploaded)
    const resumeFilled = resumesCount > 0 ? 1 : 0;
    const resumeTotal = 1;

    // 11. Media Handles (Compulsory: 1 required, at least LinkedIn ID or professional handle)
    const hasLinkedIn = Boolean(linkedInUrl && linkedInUrl.trim());
    const hasOtherMedia = Boolean(instagramUrl && instagramUrl.trim()) || Boolean(blogUrl && blogUrl.trim()) || Boolean(otherHandles && otherHandles.trim()) || Boolean(hasMediaHandles);
    const mediaHandlesFilled = (hasLinkedIn || hasOtherMedia) ? 1 : 0;
    const mediaHandlesTotal = 1;

    // 12. Optional sections: Test Scores, Patents
    const testScoresFilled = Boolean(testScoresText && testScoresText.trim());
    const patentsFilled = Boolean(patentsText && patentsText.trim());

    const items: SectionBreakdownItem[] = [
      {
        id: "header-section",
        label: "Header Section",
        totalRequired: headerTotal,
        filledRequired: headerFilled,
        status: headerFilled === headerTotal ? "complete" : headerFilled > 0 ? "partial" : "empty",
      },
      {
        id: "about-section",
        label: "About Section",
        totalRequired: aboutTotal,
        filledRequired: aboutFilled,
        status: aboutFilled === aboutTotal ? "complete" : "empty",
      },
      {
        id: "experience-section",
        label: "Experience",
        totalRequired: expTotal,
        filledRequired: expFilled,
        status: expFilled === expTotal ? "complete" : "empty",
      },
      {
        id: "academic-section",
        label: "Academic Details",
        totalRequired: academicTotal,
        filledRequired: academicFilled,
        status: academicFilled === academicTotal ? "complete" : "empty",
      },
      {
        id: "achievements-section",
        label: "Achievements",
        totalRequired: achTotal,
        filledRequired: achFilled,
        status: achFilled === achTotal ? "complete" : "empty",
      },
      {
        id: "projects-research-section",
        label: "Projects & Research",
        totalRequired: projTotal,
        filledRequired: projFilled,
        status: projFilled === projTotal ? "complete" : "empty",
      },
      {
        id: "skills-section",
        label: "Skills",
        totalRequired: skillsTotal,
        filledRequired: skillsFilled,
        status: skillsFilled === skillsTotal ? "complete" : "empty",
      },
      {
        id: "licenses-certifications-section",
        label: "Certifications",
        totalRequired: certsTotal,
        filledRequired: certsFilled,
        status: certsFilled === certsTotal ? "complete" : "empty",
      },
      {
        id: "languages-section",
        label: "Languages known",
        totalRequired: langTotal,
        filledRequired: langFilled,
        status: langFilled === langTotal ? "complete" : "empty",
      },
      {
        id: "media-handles-section",
        label: "Media Handles (LinkedIn)",
        totalRequired: mediaHandlesTotal,
        filledRequired: mediaHandlesFilled,
        status: mediaHandlesFilled === mediaHandlesTotal ? "complete" : "empty",
      },
      {
        id: "resume-section",
        label: "Resume Document",
        totalRequired: resumeTotal,
        filledRequired: resumeFilled,
        status: resumeFilled === resumeTotal ? "complete" : "empty",
      },
      {
        id: "test-scores-section",
        label: "Test Scores",
        totalRequired: 0,
        filledRequired: testScoresFilled ? 1 : 0,
        status: testScoresFilled ? "complete" : "empty",
        isOptionalSection: true,
      },
      {
        id: "patents-section",
        label: "Patents",
        totalRequired: 0,
        filledRequired: patentsFilled ? 1 : 0,
        status: patentsFilled ? "complete" : "empty",
        isOptionalSection: true,
      },
    ];

    const totalReq = items
      .filter((i) => !i.isOptionalSection)
      .reduce((acc, curr) => acc + curr.totalRequired, 0);

    const filledReq = items
      .filter((i) => !i.isOptionalSection)
      .reduce((acc, curr) => acc + curr.filledRequired, 0);

    const pct = totalReq > 0 ? Math.min(100, Math.max(0, Math.round((filledReq / totalReq) * 100))) : 0;

    let statusText = "Action Needed";
    if (pct === 100) statusText = "Ready for Placement ✓";
    else if (pct >= 75) statusText = "Nearly Complete";
    else if (pct >= 50) statusText = "Good Progress";
    else if (pct >= 25) statusText = "Getting Started";

    // Ring Color based on percentage: <40% rose/red, 40-70% amber, >70% emerald
    let color = "#ef4444"; // red/pink <40%
    if (pct >= 70) {
      color = "#10b981"; // emerald >70%
    } else if (pct >= 40) {
      color = "#f59e0b"; // amber 40-70%
    }

    return {
      sections: items,
      totalRequiredFields: totalReq,
      filledRequiredFields: filledReq,
      percentage: pct,
      statusBand: statusText,
      ringColor: color,
    };
  }, [
    fullName,
    profileImageUrl,
    course,
    yearOfStudy,
    phone,
    bio,
    experiencesCount,
    academicRecordsCount,
    achievementsCount,
    projectsCount,
    researchPapersCount,
    skillsCount,
    certificationsCount,
    languagesCount,
    hasLanguagesText,
    resumesCount,
    testScoresText,
    patentsText,
    hasMediaHandles,
  ]);

  const remainingRequired = Math.max(0, totalRequiredFields - filledRequiredFields);

  // SVG Radial Ring Math (viewBox 0 0 60 60, center cx=30, cy=30, radius=24)
  const radius = 24;
  const circumference = 2 * Math.PI * radius; // ~150.8
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setPopoverOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setPopoverOpen(false);
    }, 350);
  };

  const handleTriggerClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setPopoverOpen((prev) => !prev);
  };

  const handleSectionClick = (sectionId: string) => {
    if (onNavigate) {
      onNavigate(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
    setPopoverOpen(false);
  };

  const completedSectionsCount = sections.filter((s) => s.status === "complete").length;
  const isDark = themeMode === "dark";

  return (
    <div
      ref={containerRef}
      className="relative z-50 inline-block text-left"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* TRIGGER CARD (MOTIVATING COMPLETION WIDGET IN DARK ZONE) */}
      <button
        type="button"
        onClick={handleTriggerClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setPopoverOpen((prev) => !prev);
          } else if (e.key === "Escape") {
            setPopoverOpen(false);
          }
        }}
        aria-haspopup="dialog"
        aria-expanded={popoverOpen}
        aria-label={`Portfolio completion is ${percentage}%. ${statusBand}. ${remainingRequired} required fields remaining. Click to view checklist.`}
        className="group relative flex items-center gap-3.5 sm:gap-4 p-2.5 sm:p-3 sm:pr-4 rounded-2xl sm:rounded-3xl bg-[#090e1c]/90 hover:bg-[#0c1426]/95 border border-white/15 hover:border-amber-400/40 backdrop-blur-xl transition-all duration-300 cursor-pointer shadow-[0_10px_25px_-5px_rgba(0,0,0,0.6)] hover:shadow-[0_14px_32px_-5px_rgba(0,0,0,0.8)] hover:-translate-y-0.5 active:scale-[0.99] text-left focus:outline-none focus:ring-2 focus:ring-amber-400/50"
      >
        {/* Ambient Ring Glow Behind SVG */}
        <div
          className="absolute left-3 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full blur-xl opacity-25 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none"
          style={{ backgroundColor: ringColor }}
        />

        {/* Radial Progress Ring with Dual-stop Gradients */}
        <div className="relative w-13 h-13 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 60 60">
            <defs>
              <linearGradient id="ringGradientRose" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fb7185" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>
              <linearGradient id="ringGradientAmber" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <linearGradient id="ringGradientEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>

            {/* Dark Track */}
            <circle
              cx="30"
              cy="30"
              r={radius}
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="4.5"
              fill="transparent"
            />
            {/* Animated Value Arc */}
            <circle
              cx="30"
              cy="30"
              r={radius}
              stroke={`url(#${percentage >= 70 ? "ringGradientEmerald" : percentage >= 40 ? "ringGradientAmber" : "ringGradientRose"})`}
              strokeWidth="4.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease",
              }}
            />
          </svg>

          {/* Center text / icon inside Ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {percentage === 100 ? (
              <Check size={20} className="text-emerald-400 stroke-[3] drop-shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
            ) : (
              <span className="font-serif font-black text-[13px] sm:text-[14px] text-white tracking-tight leading-none">
                {percentage}<span className="text-[10px] font-sans font-bold text-white/70">%</span>
              </span>
            )}
          </div>
        </div>

        {/* Content Details Block */}
        <div className="flex flex-col text-left justify-center min-w-0 pr-0.5">
          {/* Status Row with Pulsing Dot */}
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2 shrink-0">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: ringColor }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ backgroundColor: ringColor }}
              />
            </span>
            <span
              className="text-[9.5px] sm:text-[10px] font-mono font-black tracking-wider uppercase truncate"
              style={{ color: ringColor }}
            >
              {statusBand}
            </span>
            <ChevronDown
              size={12}
              className={`text-white/50 transition-transform duration-200 ml-auto shrink-0 ${
                popoverOpen ? "rotate-180 text-white" : "group-hover:text-white"
              }`}
            />
          </div>

          {/* Motivational Headline */}
          <div className="mt-0.5">
            <span className="text-[11.5px] sm:text-[12.5px] font-bold text-white leading-tight block tracking-tight truncate">
              {percentage === 100 ? (
                <span className="text-emerald-300 flex items-center gap-1">
                  100% Ready <Sparkles size={11} className="inline text-amber-300" />
                </span>
              ) : remainingRequired <= 3 ? (
                <span className="text-amber-200">
                  Only {remainingRequired} {remainingRequired === 1 ? "field" : "fields"} to hit 100%!
                </span>
              ) : (
                <span>Portfolio Progress</span>
              )}
            </span>
          </div>

          {/* Micro Progress Bar - Visual Urge to Fill to 100% */}
          <div className="mt-1.5 w-36 sm:w-44 bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${percentage}%`,
                background: percentage >= 70 
                  ? "linear-gradient(90deg, #10b981, #34d399)"
                  : percentage >= 40
                  ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                  : "linear-gradient(90deg, #ef4444, #f43f5e)",
              }}
            />
          </div>

          {/* Subtext info & action hint */}
          <div className="flex items-center justify-between gap-2 mt-1 text-[9px] font-mono text-white/60">
            <span>
              {filledRequiredFields}/{totalRequiredFields} required
            </span>
            <span className="text-white/45 group-hover:text-amber-300 transition-colors flex items-center gap-0.5 shrink-0 font-sans">
              <span>{popoverOpen ? "Hide" : "Checklist"}</span>
              <ChevronRight size={10} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </button>

      {/* EXPANDABLE SECTION BREAKDOWN POPOVER */}
      {popoverOpen && (
        <div
          role="dialog"
          aria-label="Portfolio Completion Checklist"
          onClick={(e) => e.stopPropagation()}
          className={`mcc-completion-popover absolute right-0 top-full mt-2.5 w-[calc(100vw-32px)] sm:w-96 max-w-sm rounded-2xl border p-4 z-50 animate-fadeIn backdrop-blur-xl transition-colors duration-200 ${
            isDark
              ? "bg-[#0b1220]/95 border-white/15 text-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)]"
              : "bg-[#F0E8D7] border-[#E0D4BD] text-[#2B2620] shadow-[0_20px_45px_-10px_rgba(43,38,32,0.22)]"
          }`}
        >
          {/* Invisible hover bridge to prevent mouseleave when moving from button to popover */}
          <div className="absolute -top-3 left-0 right-0 h-3 pointer-events-auto" />

          {/* Popover Header */}
          <div className={`pb-3 border-b flex items-start justify-between gap-2 ${
            isDark ? "border-white/10" : "border-[#E0D4BD]"
          }`}>
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles size={15} className={isDark ? "text-amber-400 shrink-0" : "text-[#781c1c] shrink-0"} />
                <h4 className={`font-serif font-black text-sm tracking-tight ${
                  isDark ? "text-white" : "text-[#2B2620]"
                }`}>
                  Portfolio Completion
                </h4>
              </div>
              <p className={`text-[11px] mt-0.5 leading-snug font-normal ${
                isDark ? "text-slate-300" : "text-[#635A4D]"
              }`}>
                {percentage === 100
                  ? "Outstanding! Your portfolio is 100% complete and placement-ready."
                  : `Complete the remaining ${remainingRequired} required ${remainingRequired === 1 ? "field" : "fields"} to hit 100% and maximize recruiter discovery.`}
              </p>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                isDark
                  ? ""
                  : percentage >= 70
                  ? "bg-emerald-100/90 text-emerald-900 border-emerald-300"
                  : percentage >= 40
                  ? "bg-amber-100/90 text-amber-900 border-amber-300"
                  : "bg-rose-100/90 text-rose-900 border-rose-300"
              }`}
              style={
                isDark
                  ? {
                      borderColor: `${ringColor}50`,
                      backgroundColor: `${ringColor}20`,
                      color: ringColor,
                    }
                  : undefined
              }
            >
              {percentage}%
            </span>
          </div>

          {/* Mini Linear Progress Bar */}
          <div className="my-3">
            <div className={`flex items-center justify-between text-[10px] font-mono mb-1 ${
              isDark ? "text-slate-400" : "text-[#635A4D] font-medium"
            }`}>
              <span>{completedSectionsCount} of {sections.length} sections filled</span>
              <span>{filledRequiredFields} / {totalRequiredFields} req. fields</span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${
              isDark ? "bg-white/10" : "bg-[#E6DCBF] border border-[#D5C7A5]"
            }`}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: ringColor,
                }}
              />
            </div>
          </div>

          {/* Section Checklist (Scrollable) */}
          <div className="popover-scrollbar max-h-60 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
            {sections.map((section) => {
              const isComplete = section.status === "complete";
              const isPartial = section.status === "partial";

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleSectionClick(section.id)}
                  title={`Jump to ${section.label}`}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition text-left cursor-pointer group ${
                    isDark
                      ? "hover:bg-white/10 active:bg-white/15"
                      : "bg-[#FAF6EE] hover:bg-[#FFFFFF] active:bg-[#F4ECE0] border border-[#E0D4BD] hover:border-[#D5C7A5] shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Status Marker */}
                    {isComplete ? (
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    ) : isPartial ? (
                      <CircleDot size={15} className="text-amber-600 shrink-0" />
                    ) : (
                      <Circle size={15} className={isDark ? "text-slate-500 shrink-0" : "text-[#918676] shrink-0"} />
                    )}

                    <div className="min-w-0">
                      <span className={`text-xs font-semibold truncate block ${
                        isDark ? "text-slate-200 group-hover:text-white" : "text-[#2B2620] group-hover:text-[#781c1c] transition-colors"
                      }`}>
                        {section.label}
                      </span>
                      {section.isOptionalSection && (
                        <span className={`text-[9.5px] font-mono block ${isDark ? "text-slate-400" : "text-[#918676]"}`}>
                          Optional section
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {isComplete ? (
                      <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isDark ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-emerald-800 bg-emerald-100/90 border border-emerald-300"
                      }`}>
                        Done
                      </span>
                    ) : isPartial ? (
                      <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isDark ? "text-amber-400 bg-amber-500/10 border border-amber-500/20" : "text-amber-900 bg-amber-100/90 border border-amber-300"
                      }`}>
                        {section.filledRequired}/{section.totalRequired}
                      </span>
                    ) : section.isOptionalSection ? (
                      <span className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded ${
                        isDark ? "text-slate-400 bg-white/5" : "text-[#635A4D] bg-[#E6DCBF]/70 border border-[#D5C7A5]"
                      }`}>
                        Optional
                      </span>
                    ) : (
                      <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isDark ? "text-rose-400 bg-rose-500/10 border border-rose-500/20" : "text-rose-900 bg-rose-100/90 border border-rose-300"
                      }`}>
                        Required
                      </span>
                    )}
                    <ChevronRight size={12} className={`transition-transform group-hover:translate-x-0.5 ${
                      isDark ? "text-slate-500 group-hover:text-white" : "text-[#918676] group-hover:text-[#781c1c]"
                    }`} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Popover Footer */}
          <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[10px] ${
            isDark ? "border-white/10 text-slate-400" : "border-[#E0D4BD] text-[#635A4D]"
          }`}>
            <span>💡 Click any section to jump directly to it</span>
            <button
              type="button"
              onClick={() => setPopoverOpen(false)}
              className={`font-semibold cursor-pointer px-2.5 py-1 rounded-lg transition-colors ${
                isDark ? "text-white/70 hover:text-white hover:bg-white/10" : "text-[#781c1c] hover:bg-[#E6DCBF] border border-[#E0D4BD]"
              }`}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
