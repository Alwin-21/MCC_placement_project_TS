"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link, Link2Off, Undo, Redo, Palette, Highlighter, Smile
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const FONT_FAMILIES = [
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Inter", value: "var(--font-sans), Inter, sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" }
];

const FONT_SIZES = [
  { label: "12px", value: "1" },
  { label: "14px", value: "2" },
  { label: "16px (Normal)", value: "3" },
  { label: "18px", value: "4" },
  { label: "20px", value: "5" },
  { label: "24px", value: "6" },
  { label: "32px", value: "7" }
];

const TEXT_COLORS = [
  { name: "Default", value: "inherit" },
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Yellow", value: "#f59e0b" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Dark Slate", value: "#1e293b" },
  { name: "White", value: "#ffffff" }
];

const HIGHLIGHT_COLORS = [
  { name: "None", value: "transparent" },
  { name: "Yellow", value: "#fef08a" },
  { name: "Red", value: "#fecaca" },
  { name: "Blue", value: "#bfdbfe" },
  { name: "Green", value: "#a7f3d0" },
  { name: "Purple", value: "#e9d5ff" }
];

const EMOJIS = ["😊", "👍", "👎", "❤️", "👏", "🎉", "💡", "⚠️", "🔒", "🕒", "📝", "🎯"];

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastHtmlRef = useRef<string>(value);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showHighlightDropdown, setShowHighlightDropdown] = useState(false);
  const [showEmojiDropdown, setShowEmojiDropdown] = useState(false);

  // Focus and setup styleWithCSS on mount
  useEffect(() => {
    try {
      document.execCommand("styleWithCSS", false, "true");
    } catch (e) {
      console.warn("styleWithCSS not supported/active");
    }
  }, []);

  // Sync value from parent if it differs from editor innerHTML (avoids cursor jump)
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      // Set to placeholder if value is empty and editor not focused
      editorRef.current.innerHTML = value || "";
      lastHtmlRef.current = value || "";
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      // If it's just a blank line browser sometimes inputs <br>
      const cleanHtml = html === "<br>" ? "" : html;
      lastHtmlRef.current = cleanHtml;
      onChange(cleanHtml);
    }
  };

  const execCommand = (command: string, arg: string = "") => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, arg);
    handleInput();
  };

  const addLink = () => {
    const url = prompt("Enter the URL:");
    if (url) {
      // Basic validation
      const href = url.startsWith("http") ? url : `https://${url}`;
      execCommand("createLink", href);
    }
  };

  const insertEmoji = (emoji: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const node = document.createTextNode(emoji);
      range.insertNode(node);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      handleInput();
    } else {
      execCommand("insertHTML", emoji);
    }
    setShowEmojiDropdown(false);
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[#0b0c10] shadow-sm flex flex-col w-full text-xs">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 dark:bg-[#12131a] border-b border-slate-200 dark:border-slate-850 select-none">
        
        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => execCommand("undo")}
          title="Undo"
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-all"
        >
          <Undo size={14} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("redo")}
          title="Redo"
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-all"
        >
          <Redo size={14} />
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Text Style */}
        <button
          type="button"
          onClick={() => execCommand("bold")}
          title="Bold"
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-all font-bold"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("italic")}
          title="Italic"
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-all italic"
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("underline")}
          title="Underline"
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-all underline"
        >
          <Underline size={14} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("strikeThrough")}
          title="Strikethrough"
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-all line-through"
        >
          <Strikethrough size={14} />
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Font Size */}
        <select
          title="Font Size"
          onChange={(e) => execCommand("fontSize", e.target.value)}
          defaultValue="3"
          className="bg-transparent dark:bg-transparent border border-slate-200 dark:border-slate-800 rounded px-1 py-0.5 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer font-sans"
        >
          {FONT_SIZES.map((fs) => (
            <option key={fs.value} value={fs.value} className="bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white">
              {fs.label}
            </option>
          ))}
        </select>

        {/* Font Family */}
        <select
          title="Font Family"
          onChange={(e) => execCommand("fontName", e.target.value)}
          defaultValue="var(--font-sans), Inter, sans-serif"
          className="bg-transparent dark:bg-transparent border border-slate-200 dark:border-slate-800 rounded px-1 py-0.5 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer max-w-[90px] font-sans"
        >
          {FONT_FAMILIES.map((ff) => (
            <option key={ff.value} value={ff.value} className="bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white">
              {ff.label}
            </option>
          ))}
        </select>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => execCommand("justifyLeft")}
          title="Align Left"
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-all"
        >
          <AlignLeft size={14} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("justifyCenter")}
          title="Align Center"
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-all"
        >
          <AlignCenter size={14} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("justifyRight")}
          title="Align Right"
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-all"
        >
          <AlignRight size={14} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("justifyFull")}
          title="Justify"
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-all"
        >
          <AlignJustify size={14} />
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => execCommand("insertUnorderedList")}
          title="Bullet List"
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-all"
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("insertOrderedList")}
          title="Numbered List"
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-all"
        >
          <ListOrdered size={14} />
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Links */}
        <button
          type="button"
          onClick={addLink}
          title="Add Link"
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-all"
        >
          <Link size={14} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("unlink")}
          title="Remove Link"
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-all"
        >
          <Link2Off size={14} />
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Colors (Text Color) */}
        <div className="relative font-sans">
          <button
            type="button"
            onClick={() => {
              setShowColorDropdown(!showColorDropdown);
              setShowHighlightDropdown(false);
              setShowEmojiDropdown(false);
            }}
            title="Text Color"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-all flex items-center gap-0.5"
          >
            <Palette size={14} />
          </button>
          {showColorDropdown && (
            <div className="absolute left-0 mt-1 z-20 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-850 rounded-xl p-2 grid grid-cols-4 gap-1.5 shadow-xl w-32">
              {TEXT_COLORS.map((tc) => (
                <button
                  key={tc.name}
                  type="button"
                  title={tc.name}
                  onClick={() => {
                    execCommand("foreColor", tc.value);
                    setShowColorDropdown(false);
                  }}
                  className="w-6 h-6 rounded border border-slate-200 dark:border-slate-800 cursor-pointer transition hover:scale-110 active:scale-95"
                  style={{
                    backgroundColor: tc.value === "inherit" ? "#94a3b8" : tc.value,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Highlight Color */}
        <div className="relative font-sans">
          <button
            type="button"
            onClick={() => {
              setShowHighlightDropdown(!showHighlightDropdown);
              setShowColorDropdown(false);
              setShowEmojiDropdown(false);
            }}
            title="Highlight Color"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-all flex items-center gap-0.5"
          >
            <Highlighter size={14} />
          </button>
          {showHighlightDropdown && (
            <div className="absolute left-0 mt-1 z-20 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-850 rounded-xl p-2 grid grid-cols-3 gap-1.5 shadow-xl w-28">
              {HIGHLIGHT_COLORS.map((hc) => (
                <button
                  key={hc.name}
                  type="button"
                  title={hc.name}
                  onClick={() => {
                    execCommand("backColor", hc.value);
                    setShowHighlightDropdown(false);
                  }}
                  className="h-6 w-full rounded border border-slate-200 dark:border-slate-800 cursor-pointer text-[9px] font-bold text-center transition hover:scale-105 active:scale-95 text-slate-700"
                  style={{
                    backgroundColor: hc.value === "transparent" ? "#94a3b8" : hc.value,
                  }}
                >
                  {hc.name === "None" ? "X" : ""}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Emoji Selector */}
        <div className="relative font-sans">
          <button
            type="button"
            onClick={() => {
              setShowEmojiDropdown(!showEmojiDropdown);
              setShowColorDropdown(false);
              setShowHighlightDropdown(false);
            }}
            title="Insert Emoji"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-all flex items-center gap-0.5"
          >
            <Smile size={14} />
          </button>
          {showEmojiDropdown && (
            <div className="absolute left-0 mt-1 z-20 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-850 rounded-xl p-2 grid grid-cols-4 gap-1.5 shadow-xl w-32">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="w-6 h-6 flex items-center justify-center text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Editor Body */}
      <div className="relative flex-1 min-h-[140px] text-xs">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          className="w-full h-full min-h-[140px] max-h-[300px] overflow-y-auto px-4 py-3 bg-white dark:bg-[#0b0c10] text-slate-900 dark:text-slate-100 focus:outline-none leading-relaxed prose prose-slate dark:prose-invert prose-xs select-text font-serif"
          style={{
            minHeight: "140px",
          }}
        />
        {!value && placeholder && (
          <div className="absolute top-3 left-4 text-slate-400 dark:text-slate-500 pointer-events-none select-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* Editor CSS styling for basic rich text list rendering */}
      <style jsx global>{`
        .prose-xs ul {
          list-style-type: disc !important;
          padding-left: 1.25rem !important;
          margin-top: 0.25rem !important;
          margin-bottom: 0.25rem !important;
        }
        .prose-xs ol {
          list-style-type: decimal !important;
          padding-left: 1.25rem !important;
          margin-top: 0.25rem !important;
          margin-bottom: 0.25rem !important;
        }
        .prose-xs li {
          margin-top: 0.125rem !important;
          margin-bottom: 0.125rem !important;
        }
        .prose-xs a {
          color: #3b82f6 !important;
          text-decoration: underline !important;
        }
      `}</style>
    </div>
  );
}
