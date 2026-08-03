"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Minimize2, Maximize2, Calculator as CalcIcon } from "lucide-react";

interface CalculatorProps {
  onClose: () => void;
  allowedMode: "Basic" | "Scientific";
  isDark?: boolean;
}

export default function Calculator({ onClose, allowedMode, isDark = true }: CalculatorProps) {
  const [minimized, setMinimized] = useState(false);
  const [mode, setMode] = useState<"Basic" | "Scientific">("Basic");
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [pos, setPos] = useState({ x: 120, y: 150 });
  const [dragging, setDragging] = useState(false);
  
  const dragStart = useRef({ x: 0, y: 0 });
  const calcRef = useRef<HTMLDivElement>(null);

  // Set mode based on what is allowed by exam configuration
  useEffect(() => {
    if (allowedMode === "Scientific") {
      setMode("Scientific");
    } else {
      setMode("Basic");
    }
  }, [allowedMode]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag when clicking the header and not buttons
    if ((e.target as HTMLElement).closest("button")) return;
    setDragging(true);
    dragStart.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    // Constrain position within window boundaries
    const newX = Math.max(10, Math.min(window.innerWidth - 300, e.clientX - dragStart.current.x));
    const newY = Math.max(10, Math.min(window.innerHeight - 150, e.clientY - dragStart.current.y));
    setPos({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  const handleButtonClick = (value: string) => {
    if (value === "C") {
      setInput("");
      setResult("");
    } else if (value === "del") {
      setInput((prev) => prev.slice(0, -1));
    } else if (value === "=") {
      calculate();
    } else {
      setInput((prev) => prev + value);
    }
  };

  const calculate = () => {
    if (!input) return;
    try {
      // Clean and map math functions safely
      let expr = input
        .replace(/sin\(/g, "Math.sin(")
        .replace(/cos\(/g, "Math.cos(")
        .replace(/tan\(/g, "Math.tan(")
        .replace(/log\(/g, "Math.log10(")
        .replace(/ln\(/g, "Math.log(")
        .replace(/sqrt\(/g, "Math.sqrt(")
        .replace(/\^/g, "**")
        .replace(/π/g, "Math.PI")
        .replace(/e/g, "Math.E");

      // Verify safe characters: digits, basic operators, Math calls, parentheses, and spaces
      if (!/^[0-9+\-*/().\sMath\.sin|Math\.cos|Math\.tan|Math\.log10|Math\.log|Math\.sqrt|Math\.PI|Math\.E|**]+$/.test(expr)) {
        setResult("Invalid Input");
        return;
      }

      // Safe evaluation using Function context
      const evaluated = new Function(`return (${expr})`)();
      if (typeof evaluated === "number" && !isNaN(evaluated)) {
        if (!isFinite(evaluated)) {
          setResult("Limit Error");
        } else {
          setResult(Number(evaluated.toFixed(8)).toString());
        }
      } else {
        setResult("Error");
      }
    } catch (e) {
      setResult("Syntax Error");
    }
  };

  const basicButtons = [
    ["7", "8", "9", "/"],
    ["4", "5", "6", "*"],
    ["1", "2", "3", "-"],
    ["C", "0", ".", "+"],
    ["del", "(", ")", "="]
  ];

  const scientificButtons = [
    ["sin(", "cos(", "tan(", "^"],
    ["log(", "ln(", "sqrt(", "π"],
    ["7", "8", "9", "/"],
    ["4", "5", "6", "*"],
    ["1", "2", "3", "-"],
    ["C", "0", ".", "+"],
    ["del", "e", "(", ")", "="]
  ];

  const buttons = mode === "Scientific" ? scientificButtons : basicButtons;

  const bgStyle = isDark ? "bg-[#11121a] border-white/10 text-white" : "bg-white border-slate-200 text-slate-800";
  const headerBg = isDark ? "bg-[#1b1c28] border-white/5" : "bg-slate-100 border-slate-200";

  return (
    <div
      ref={calcRef}
      style={{ top: `${pos.y}px`, left: `${pos.x}px` }}
      className={`fixed z-50 w-72 rounded-2xl border shadow-2xl overflow-hidden flex flex-col transition-all duration-150 select-none ${bgStyle}`}
    >
      {/* HEADERBAR */}
      <div
        onMouseDown={handleMouseDown}
        className={`px-3 py-2 border-b flex items-center justify-between cursor-move text-xs font-mono font-bold ${headerBg}`}
      >
        <div className="flex items-center gap-1.5 text-slate-400">
          <CalcIcon size={13} className="text-[#781c1c] dark:text-amber-400" />
          <span>{mode} Calculator</span>
        </div>
        <div className="flex items-center gap-1.5">
          {allowedMode === "Scientific" && (
            <button
              onClick={() => setMode((m) => (m === "Basic" ? "Scientific" : "Basic"))}
              className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase transition cursor-pointer border ${
                mode === "Scientific" 
                  ? "bg-[#781c1c] border-[#781c1c] text-white" 
                  : "border-slate-400/40 text-slate-400 hover:text-white"
              }`}
            >
              Sci
            </button>
          )}
          <button
            onClick={() => setMinimized(!minimized)}
            className="text-slate-400 hover:text-amber-500 transition cursor-pointer p-0.5"
            title={minimized ? "Restore" : "Minimize"}
          >
            {minimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 transition cursor-pointer p-0.5"
            title="Close"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* CALCULATOR BODY */}
      {!minimized && (
        <div className="p-3.5 space-y-3 flex-1 flex flex-col bg-opacity-30">
          {/* DISPLAY SCREEN */}
          <div className={`p-2.5 rounded-xl border font-mono text-right flex flex-col justify-between min-h-[64px] ${
            isDark ? "bg-black/40 border-white/5" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="text-[10px] text-slate-400 overflow-x-auto whitespace-nowrap scrollbar-none">
              {input || "0"}
            </div>
            <div className="text-sm font-bold truncate text-[#781c1c] dark:text-amber-400">
              {result ? `= ${result}` : ""}
            </div>
          </div>

          {/* BUTTON GRID */}
          <div className="grid gap-1.5">
            {buttons.map((row, rIdx) => (
              <div key={rIdx} className="flex gap-1.5">
                {row.map((btn) => {
                  let btnColor = isDark 
                    ? "bg-white/[0.03] border-white/5 hover:bg-white/[0.08]" 
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100";
                  
                  if (btn === "=") {
                    btnColor = "bg-[#781c1c] text-white hover:bg-[#5f1515] border-[#781c1c]";
                  } else if (btn === "C" || btn === "del") {
                    btnColor = isDark
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                      : "bg-rose-50 text-rose-600 border-rose-150 hover:bg-rose-100";
                  } else if (["+", "-", "*", "/", "^", "sin(", "cos(", "tan(", "log(", "ln(", "sqrt("].includes(btn)) {
                    btnColor = isDark
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                      : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100";
                  }

                  return (
                    <button
                      key={btn}
                      onClick={() => handleButtonClick(btn)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-bold font-mono transition cursor-pointer text-center active:scale-95 ${btnColor}`}
                    >
                      {btn}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
