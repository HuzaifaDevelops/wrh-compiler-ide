"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Play,
  BookOpen,
  RefreshCw,
  LogOut,
  LogIn,
  FileCode,
  Layout,
  User as UserIcon,
  Sparkles,
  Save,
  Download,
  Copy,
  Check,
  FolderCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STARTER_SNIPPETS } from "@/lib/snippets";
import { CompileResponse } from "@/types/compiler";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { wrhLanguageConfig, wrhMonarchTokensProvider } from "@/lib/wrh-monarch";
import { AuthModal } from "@/components/auth/AuthModal";
import { DocsDrawer } from "@/components/docs/DocsDrawer";
import { VisualizerPanel } from "@/components/visualizer/VisualizerPanel";
import { SnippetsModal } from "@/components/workspace/SnippetsModal";
import { AiAssistantModal } from "@/components/ai/AiAssistantModal";

// Dynamically import Monaco Editor to avoid SSR hydration issues
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function WorkspacePage() {
  const { user, isAuthenticated, logout } = useAuth();

  // Editor and Source State
  const [sourceCode, setSourceCode] = useState<string>(STARTER_SNIPPETS[0].code);
  const [selectedSnippet, setSelectedSnippet] = useState<string>(STARTER_SNIPPETS[0].id);

  // Compilation State
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compileResult, setCompileResult] = useState<CompileResponse | null>(null);

  // Layout mode: 'stacked' (Engine below Editor) or 'side' (Side-by-side)
  const [layoutMode, setLayoutMode] = useState<"stacked" | "side">("side");

  // Resizable Splitter State
  const [splitPercent, setSplitPercent] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let percent: number;
      if (layoutMode === "stacked") {
        percent = ((e.clientY - rect.top) / rect.height) * 100;
      } else {
        percent = ((e.clientX - rect.left) / rect.width) * 100;
      }
      setSplitPercent(Math.min(Math.max(percent, 15), 85));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = layoutMode === "stacked" ? "row-resize" : "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, layoutMode]);

  // Modals & Drawers
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isSnippetsOpen, setIsSnippetsOpen] = useState<boolean>(false);
  const [isAiOpen, setIsAiOpen] = useState<boolean>(false);
  const [aiInitialTab, setAiInitialTab] = useState<"fix" | "generate" | "chat">("generate");
  const [authInitialTab, setAuthInitialTab] = useState<"login" | "register">("login");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const handleOpenAi = (tab: "fix" | "generate" | "chat" = "generate") => {
    setAiInitialTab(tab);
    setIsAiOpen(true);
  };

  const handleApplyAiCode = (code: string) => {
    setSourceCode(code);
    clearEditorMarkers();
    setCompileResult(null);
  };

  // Monaco Editor References
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const triggerCompileRef = useRef<() => void>();

  // Helper to clear error markers from Monaco editor
  const clearEditorMarkers = useCallback(() => {
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelMarkers(model, "wrh", []);
      }
    }
  }, []);

  // Update Monaco error markers whenever compileResult changes
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    if (compileResult && !compileResult.success && compileResult.errors?.length > 0) {
      const markers = compileResult.errors.map((err) => {
        const line = Math.max(1, err.line || 1);
        const col = Math.max(1, err.column || 1);
        return {
          startLineNumber: line,
          startColumn: col,
          endLineNumber: line,
          endColumn: col + 4,
          message: err.message,
          severity: monacoRef.current.MarkerSeverity.Error,
        };
      });
      monacoRef.current.editor.setModelMarkers(model, "wrh", markers);
    } else {
      monacoRef.current.editor.setModelMarkers(model, "wrh", []);
    }
  }, [compileResult]);

  // Jump to specific line and column in Monaco editor
  const handleJumpToLine = useCallback((line: number, column?: number) => {
    if (editorRef.current) {
      const targetLine = Math.max(1, line || 1);
      const targetCol = Math.max(1, column || 1);

      editorRef.current.revealLineInCenter(targetLine);
      editorRef.current.setPosition({
        lineNumber: targetLine,
        column: targetCol,
      });
      editorRef.current.focus();
    }
  }, []);

  // Configure custom WRH monarch tokens and language settings before mount
  const handleEditorWillMount = (monaco: any) => {
    if (!monaco.languages.getLanguages().some((lang: any) => lang.id === "wrh")) {
      monaco.languages.register({ id: "wrh" });
      monaco.languages.setLanguageConfiguration("wrh", wrhLanguageConfig);
      monaco.languages.setMonarchTokensProvider("wrh", wrhMonarchTokensProvider);
    }
  };

  // Compile Execution Trigger
  const triggerCompile = async () => {
    setIsCompiling(true);
    // Always fetch live code directly from editor instance to avoid stale closures
    const currentCode = editorRef.current ? editorRef.current.getValue() : sourceCode;
    try {
      const res = await api.post<CompileResponse>("/api/compile/", {
        source_code: currentCode,
      });
      setCompileResult(res.data);
    } catch (error: any) {
      console.error("Compilation request error:", error);
      // Construct fallback error representation if network fails
      setCompileResult({
        success: false,
        status: "error",
        stage_reached: 0,
        stage_failed: "lexical",
        tokens: [],
        ast: [],
        ast_ascii: "",
        symbol_table: {},
        errors: [
          {
            stage: "lexical",
            line: 1,
            column: 1,
            message:
              error.response?.data?.error ||
              error.message ||
              "Network error: Unable to connect to compiler API",
          },
        ],
        execution_time_ms: 0,
      });
    } finally {
      setIsCompiling(false);
    }
  };

  triggerCompileRef.current = triggerCompile;

  // Capture mounted editor instance and register shortcut
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Add Ctrl+Enter or Cmd+Enter shortcut to compile using latest ref
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      triggerCompileRef.current?.();
    });
  };

  // Handle snippet selection dropdown
  const handleSnippetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedSnippet(id);
    const snippet = STARTER_SNIPPETS.find((s) => s.id === id);
    if (snippet) {
      setSourceCode(snippet.code);
      clearEditorMarkers();
      setCompileResult(null);
    }
  };

  // Handle loading snippet from Docs drawer
  const handleLoadSnippetFromDocs = (code: string) => {
    setSourceCode(code);
    clearEditorMarkers();
    setCompileResult(null);
    setIsDocsOpen(false);
  };

  // Handle loading user saved snippet from Cloud Workspace
  const handleLoadUserSnippet = (code: string, title: string) => {
    setSourceCode(code);
    clearEditorMarkers();
    setCompileResult(null);
  };

  // Download editor code as .wrh file
  const handleDownloadCode = () => {
    const code = editorRef.current ? editorRef.current.getValue() : sourceCode;
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "program.wrh";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy editor code to clipboard
  const handleCopyCode = () => {
    const code = editorRef.current ? editorRef.current.getValue() : sourceCode;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Source code changes clear previous error markers
  const handleCodeChange = (val?: string) => {
    const newCode = val || "";
    setSourceCode(newCode);
    if (compileResult && !compileResult.success) {
      clearEditorMarkers();
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 backdrop-blur-md z-20">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 font-extrabold text-white shadow-lg shadow-indigo-600/30">
            WRH
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wide text-white">
                WRH Compiler IDE
              </h1>
              <Badge variant="default" className="text-[10px] py-0 px-1.5 font-mono">
                v1.0
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive 3-Stage Compiler Construction Platform
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Docs / Language Reference Drawer Trigger */}
          <Button
            onClick={() => setIsDocsOpen(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 border-slate-700 bg-slate-800/80 text-xs text-slate-200 hover:bg-slate-700 hover:text-white"
          >
            <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Language Guide</span>
          </Button>

          {/* Cloud Workspace Snippets Trigger */}
          <Button
            onClick={() => setIsSnippetsOpen(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 border-slate-700 bg-slate-800/80 text-xs text-slate-200 hover:bg-slate-700 hover:text-white"
          >
            <FolderCode className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">My Snippets</span>
          </Button>

          {/* Starter Snippets Selector */}
          <select
            value={selectedSnippet}
            onChange={handleSnippetChange}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 outline-none transition hover:border-slate-600 focus:border-indigo-500 font-medium"
          >
            {STARTER_SNIPPETS.map((snip) => (
              <option key={snip.id} value={snip.id}>
                {snip.title}
              </option>
            ))}
          </select>

          {/* Segmented Layout Mode Selector */}
          <div className="flex items-center rounded-lg border border-slate-700 bg-slate-800/90 p-0.5">
            <button
              type="button"
              onClick={() => setLayoutMode("stacked")}
              title="View Engine below the Code Editor"
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                layoutMode === "stacked"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layout className="h-3.5 w-3.5 rotate-90" />
              <span>Engine Below</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode("side")}
              title="View Editor and Engine Side-by-Side"
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                layoutMode === "side"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layout className="h-3.5 w-3.5" />
              <span>Side Split</span>
            </button>
          </div>

          {/* AI Assistant Trigger */}
          <Button
            onClick={() => handleOpenAi(compileResult && !compileResult.success ? "fix" : "generate")}
            size="sm"
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 font-semibold text-white shadow-lg shadow-purple-950/40 transition-all px-3"
            title="Open Gemini AI Assistant to Code or Fix Errors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AI Assistant</span>
          </Button>

          {/* Compile Execution Trigger */}
          <Button
            onClick={triggerCompile}
            disabled={isCompiling}
            size="sm"
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all px-4"
          >
            {isCompiling ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-white" />
            )}
            <span>{isCompiling ? "Compiling..." : "Compile"}</span>
          </Button>

          <div className="h-5 w-px bg-slate-800" />

          {/* User Session Bar */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-indigo-700/50 bg-indigo-950/60 px-2.5 py-1 text-xs">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white uppercase">
                  {user.username.charAt(0)}
                </span>
                <span className="text-indigo-200 font-medium">{user.username}</span>
              </div>

              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 border-slate-700 bg-slate-800/60 text-xs text-slate-300 hover:bg-red-950/80 hover:border-red-800 hover:text-red-300"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => {
                setAuthInitialTab("login");
                setIsAuthOpen(true);
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 border-indigo-700/80 bg-indigo-950/50 text-xs font-medium text-indigo-300 hover:bg-indigo-900/60 hover:text-white"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Button>
          )}
        </div>
      </header>

      {/* Main Workspace Body */}
      <main
        ref={containerRef}
        className={`flex flex-1 overflow-hidden ${
          layoutMode === "stacked" ? "flex-col" : "flex-row"
        }`}
      >
        {/* Editor Section */}
        <section
          style={
            layoutMode === "stacked"
              ? { height: `${splitPercent}%` }
              : { width: `${splitPercent}%` }
          }
          className={`flex flex-col bg-slate-950 overflow-hidden ${
            layoutMode === "stacked"
              ? "border-b border-slate-800/50"
              : "h-full border-r border-slate-800/50"
          }`}
        >
          {/* Editor Header Bar */}
          <div className="flex h-9 shrink-0 items-center justify-between border-b border-slate-800/80 bg-slate-900/50 px-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <FileCode className="h-3.5 w-3.5 text-indigo-400" />
              <span>editor.wrh</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden lg:inline text-[11px] text-slate-500">
                Press <kbd className="rounded bg-slate-800 px-1 py-0.5 text-[10px]">Ctrl+Enter</kbd> to compile
              </span>

              {/* AI Assistant Quick Trigger */}
              <button
                onClick={() => handleOpenAi(compileResult && !compileResult.success ? "fix" : "generate")}
                title="Code or Fix with Gemini AI"
                className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-purple-300 hover:text-white bg-purple-950/60 border border-purple-800/60 hover:bg-purple-900/80 transition-colors"
              >
                <Sparkles className="h-3 w-3 text-purple-400" />
                <span>AI</span>
              </button>

              {/* Copy Code Button */}
              <button
                onClick={handleCopyCode}
                title="Copy editor code"
                className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {copiedCode ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {/* Export / Download .wrh File */}
              <button
                onClick={handleDownloadCode}
                title="Download program.wrh"
                className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Download className="h-3 w-3" />
                <span>Export</span>
              </button>

              <Badge variant="secondary" className="font-mono text-[10px]">
                WRH Syntax
              </Badge>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language="wrh"
              theme="vs-dark"
              value={sourceCode}
              onChange={handleCodeChange}
              beforeMount={handleEditorWillMount}
              onMount={handleEditorDidMount}
              options={{
                fontSize: 13,
                fontFamily: "Fira Code, Menlo, Monaco, Consolas, monospace",
                lineNumbers: "on",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 8 },
                tabSize: 4,
                glyphMargin: true,
              }}
            />
          </div>
        </section>

        {/* Draggable Divider Handle */}
        <div
          onMouseDown={() => setIsDragging(true)}
          title={
            layoutMode === "stacked"
              ? "Drag up/down to resize Editor and Engine"
              : "Drag left/right to resize Editor and Engine"
          }
          className={`group relative flex shrink-0 items-center justify-center bg-slate-900 select-none transition-colors z-10 ${
            layoutMode === "stacked"
              ? "h-2 w-full cursor-row-resize hover:bg-indigo-600/60 active:bg-indigo-600 border-y border-slate-800/60"
              : "w-2 h-full cursor-col-resize hover:bg-indigo-600/60 active:bg-indigo-600 border-x border-slate-800/60"
          } ${isDragging ? "bg-indigo-600" : ""}`}
        >
          <div
            className={`rounded-full bg-slate-600 transition-colors group-hover:bg-white ${
              layoutMode === "stacked" ? "h-1 w-8" : "w-1 h-8"
            } ${isDragging ? "bg-white" : ""}`}
          />
        </div>

        {/* Engine Visualizer Section */}
        <section
          style={
            layoutMode === "stacked"
              ? { height: `${100 - splitPercent}%` }
              : { width: `${100 - splitPercent}%` }
          }
          className={`flex flex-col bg-slate-950 overflow-hidden ${
            layoutMode === "stacked" ? "flex-1" : "h-full"
          }`}
        >
          <VisualizerPanel
            compileResult={compileResult}
            isCompiling={isCompiling}
            onJumpToLine={handleJumpToLine}
            onFixWithAi={() => handleOpenAi("fix")}
          />
        </section>
      </main>

      {/* Docs Reference Drawer */}
      <DocsDrawer
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
        onSelectSnippet={handleLoadSnippetFromDocs}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialTab={authInitialTab}
      />

      {/* Cloud Workspace Snippets Modal */}
      <SnippetsModal
        isOpen={isSnippetsOpen}
        onClose={() => setIsSnippetsOpen(false)}
        currentCode={sourceCode}
        onLoadSnippet={handleLoadUserSnippet}
        onOpenAuth={() => {
          setAuthInitialTab("login");
          setIsAuthOpen(true);
        }}
      />

      {/* Gemini AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        currentCode={editorRef.current ? editorRef.current.getValue() : sourceCode}
        errors={compileResult?.errors || []}
        onApplyCode={handleApplyAiCode}
        initialTab={aiInitialTab}
      />
    </div>
  );
}
