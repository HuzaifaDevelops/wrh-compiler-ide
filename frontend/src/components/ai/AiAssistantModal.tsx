"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Wrench,
  Code2,
  MessageSquare,
  Settings,
  X,
  Check,
  Copy,
  ArrowRight,
  AlertTriangle,
  Send,
  ExternalLink,
  Bot,
  User,
  Zap,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompilerError } from "@/types/compiler";
import {
  AiStatus,
  FixCodeResponse,
  GenerateCodeResponse,
  ChatMessage,
} from "@/types/ai";
import {
  fetchAiStatus,
  generateWrhCode,
  fixWrhCode,
  sendWrhChat,
  getStoredApiKey,
  setStoredApiKey,
  getStoredModel,
  setStoredModel,
} from "@/lib/aiApi";

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCode: string;
  errors?: CompilerError[];
  onApplyCode: (code: string) => void;
  initialTab?: "fix" | "generate" | "chat";
}

type TabKey = "fix" | "generate" | "chat" | "settings";

const PROMPT_PRESETS = [
  {
    title: "Factorial Loop",
    prompt: "Write a program in WRH that calculates the factorial of 5 using an until loop and prints the result.",
  },
  {
    title: "Even/Odd Checker",
    prompt: "Create a WRH program that tests if digit n := 7 is even or odd using // and ***, then prints the result with flex.",
  },
  {
    title: "Custom Operators Demo",
    prompt: "Demonstrate all 9 custom WRH operators (:=, +++, ---, **, //, ?=, ~, >>, <<) with clear flex prints.",
  },
  {
    title: "Nested Branches",
    prompt: "Write a grading program with when and otherwise that tests a score and prints 'Passed' or 'Failed'.",
  },
];

export function AiAssistantModal({
  isOpen,
  onClose,
  currentCode,
  errors = [],
  onApplyCode,
  initialTab = "generate",
}: AiAssistantModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-3-flash-preview");
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);

  // Fix state
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<FixCodeResponse | null>(null);
  const [fixError, setFixError] = useState<string | null>(null);

  // Generate state
  const [genPrompt, setGenPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genResult, setGenResult] = useState<GenerateCodeResponse | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your WRH Compiler AI Assistant powered by Gemini. Ask me anything about WRH-Lang syntax, custom operators, or compiler theory!",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Clipboard
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const storedKey = getStoredApiKey();
      setApiKeyInput(storedKey);
      const storedModel = getStoredModel();
      setSelectedModel(storedModel);

      // Determine initial tab: if errors exist, default to fix, else initialTab
      if (errors.length > 0) {
        setActiveTab("fix");
      } else {
        setActiveTab(initialTab);
      }

      // Check status
      fetchAiStatus()
        .then((res) => setAiStatus(res))
        .catch(() => setAiStatus(null));
    }
  }, [isOpen, initialTab, errors.length]);

  useEffect(() => {
    if (activeTab === "chat" && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, activeTab]);

  if (!isOpen) return null;

  const handleSaveApiKey = () => {
    setStoredApiKey(apiKeyInput);
    setStoredModel(selectedModel);
    fetchAiStatus()
      .then((res) => setAiStatus(res))
      .catch(() => setAiStatus(null));
  };

  const handleRunFix = async () => {
    setIsFixing(true);
    setFixError(null);
    try {
      const res = await fixWrhCode(currentCode, errors, selectedModel);
      setFixResult(res);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to communicate with Gemini API. Check your API key.";
      setFixError(msg);
      if (err.response?.status === 401) {
        setActiveTab("settings");
      }
    } finally {
      setIsFixing(false);
    }
  };

  const handleRunGenerate = async (promptToRun?: string) => {
    const prompt = promptToRun || genPrompt;
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGenError(null);
    try {
      const res = await generateWrhCode(prompt, currentCode, selectedModel);
      setGenResult(res);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to generate code with Gemini. Check your API key.";
      setGenError(msg);
      if (err.response?.status === 401) {
        setActiveTab("settings");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatting) return;
    const userMsg: ChatMessage = { role: "user", content: chatInput.trim() };
    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);
    setChatInput("");
    setIsChatting(true);

    try {
      const res = await sendWrhChat(
        updated.map((m) => ({ role: m.role, content: m.content })),
        currentCode,
        selectedModel
      );
      setChatMessages([
        ...updated,
        {
          role: "assistant",
          content: res.response,
          code_snippet: res.code_snippet,
        },
      ]);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to get response from Gemini.";
      setChatMessages([
        ...updated,
        {
          role: "assistant",
          content: `⚠️ Error: ${msg}`,
        },
      ]);
      if (err.response?.status === 401) {
        setActiveTab("settings");
      }
    } finally {
      setIsChatting(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isConfigured = aiStatus?.configured || Boolean(apiKeyInput.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 shadow-md shadow-indigo-900/30">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white tracking-wide">
                  Gemini AI Assistant
                </h3>
                <Badge
                  variant={isConfigured ? "success" : "warning"}
                  className="text-[10px] font-mono uppercase"
                >
                  {isConfigured ? "Ready" : "API Key Needed"}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400">
                AI Coding &amp; Error Diagnostic Engine for WRH-Language
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-950/80 p-1 border border-slate-800">
            <button
              onClick={() => setActiveTab("fix")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "fix"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Wrench className="h-3.5 w-3.5" />
              <span>Fix Errors</span>
              {errors.length > 0 && (
                <span className="rounded-full bg-red-950 border border-red-700 text-red-300 px-1.5 py-0.2 text-[10px] font-bold">
                  {errors.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("generate")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "generate"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Code with AI</span>
            </button>

            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "chat"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Copilot Chat</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "settings"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
              title="API Key Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: FIX ERRORS */}
          {activeTab === "fix" && (
            <div className="space-y-5">
              {/* Context Alert */}
              {errors.length > 0 ? (
                <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2 text-xs font-bold text-red-300 uppercase tracking-wide">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      Compiler Diagnostic Detected ({errors.length}{" "}
                      {errors.length === 1 ? "error" : "errors"})
                    </span>
                    <Badge variant="danger" className="text-[10px] font-mono">
                      {errors[0].stage}
                    </Badge>
                  </div>
                  <div className="space-y-1 font-mono text-xs text-red-200/90">
                    {errors.map((err, i) => (
                      <div key={i} className="flex items-baseline gap-2">
                        <span className="text-red-400 font-bold">
                          Line {err.line}:
                        </span>
                        <span>{err.message}</span>
                        {err.rule && (
                          <span className="text-slate-500 text-[10px]">
                            ({err.rule})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4 text-xs text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>
                      No active compiler errors. You can still ask Gemini to review and optimize your WRH code!
                    </span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Gemini analyzes the AST &amp; compiler rules to provide root-cause explanation and fully corrected code.
                </p>
                <Button
                  onClick={handleRunFix}
                  disabled={isFixing}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs px-4 py-2 flex items-center gap-2 shadow-lg shadow-indigo-900/30"
                >
                  {isFixing ? (
                    <>
                      <Zap className="h-4 w-4 animate-spin" />
                      <span>Diagnosing with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Diagnose &amp; Fix with AI</span>
                    </>
                  )}
                </Button>
              </div>

              {fixError && (
                <div className="rounded-xl border border-red-800 bg-red-950/60 p-3 text-xs text-red-300">
                  {fixError}
                </div>
              )}

              {/* Fix Result Card */}
              {fixResult && (
                <div className="space-y-4 rounded-xl border border-indigo-900/60 bg-indigo-950/20 p-5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Diagnosis &amp; Solution
                      </span>
                    </div>
                    {fixResult.violated_rule && (
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        Rule: {fixResult.violated_rule}
                      </Badge>
                    )}
                  </div>

                  {/* Explanation */}
                  <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 text-xs text-slate-200 leading-relaxed">
                    <p className="font-semibold text-indigo-300 mb-1">
                      What went wrong:
                    </p>
                    <p>{fixResult.explanation}</p>
                    {fixResult.changes_summary &&
                      fixResult.changes_summary.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-800">
                          <span className="text-[11px] font-bold text-slate-400">
                            Key Fixes:
                          </span>
                          <ul className="mt-1 list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                            {fixResult.changes_summary.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>

                  {/* Fixed Code Preview */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-300 font-mono">
                        Corrected WRH Code:
                      </span>
                      <button
                        onClick={() => handleCopy(fixResult.fixed_code)}
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                      >
                        {copied ? (
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
                    </div>

                    <pre className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-300 overflow-x-auto max-h-64 leading-relaxed">
                      {fixResult.fixed_code}
                    </pre>
                  </div>

                  {/* Apply Fix Button */}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      onClick={() => {
                        onApplyCode(fixResult.fixed_code);
                        onClose();
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-2 flex items-center gap-2 shadow-lg shadow-emerald-950/50"
                    >
                      <Check className="h-4 w-4" />
                      <span>Apply Fix to Editor</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CODE GENERATION */}
          {activeTab === "generate" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Describe what program you want to build in WRH-Lang:
                </label>
                <textarea
                  rows={3}
                  value={genPrompt}
                  onChange={(e) => setGenPrompt(e.target.value)}
                  placeholder="e.g. Write a program that calculates factorial of 5 using until loop and prints the result..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Inspiration Chips */}
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  Quick Prompts:
                </span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {PROMPT_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setGenPrompt(preset.prompt);
                        handleRunGenerate(preset.prompt);
                      }}
                      className="rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-indigo-500 hover:text-white transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="h-3 w-3 text-indigo-400" />
                      <span>{preset.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => handleRunGenerate()}
                  disabled={isGenerating || !genPrompt.trim()}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs px-5 py-2 flex items-center gap-2 shadow-lg shadow-indigo-900/30"
                >
                  {isGenerating ? (
                    <>
                      <Zap className="h-4 w-4 animate-spin" />
                      <span>Generating Code...</span>
                    </>
                  ) : (
                    <>
                      <Code2 className="h-4 w-4" />
                      <span>Generate WRH Code</span>
                    </>
                  )}
                </Button>
              </div>

              {genError && (
                <div className="rounded-xl border border-red-800 bg-red-950/60 p-3 text-xs text-red-300">
                  {genError}
                </div>
              )}

              {/* Generated Result */}
              {genResult && (
                <div className="space-y-4 rounded-xl border border-indigo-900/60 bg-indigo-950/20 p-5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Generated WRH Program
                    </span>
                    <button
                      onClick={() => handleCopy(genResult.code)}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-indigo-200 overflow-x-auto max-h-64 leading-relaxed">
                    {genResult.code}
                  </pre>

                  {genResult.explanation && (
                    <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 text-xs text-slate-300 leading-relaxed">
                      <p className="font-semibold text-indigo-400 mb-1">
                        How it works:
                      </p>
                      <p className="whitespace-pre-line">
                        {genResult.explanation}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      onClick={() => {
                        onApplyCode(genResult.code);
                        onClose();
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2 flex items-center gap-2 shadow-lg shadow-indigo-950/50"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span>Insert into Editor</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CHAT */}
          {activeTab === "chat" && (
            <div className="flex h-full flex-col space-y-4">
              <div
                ref={chatScrollRef}
                className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-4 max-h-[420px]"
              >
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 text-xs ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-300">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-xl p-3 leading-relaxed ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-900 border border-slate-800 text-slate-200"
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>
                      {msg.code_snippet && (
                        <div className="mt-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] uppercase font-mono text-slate-400">
                              WRH Snippet
                            </span>
                            <button
                              onClick={() => onApplyCode(msg.code_snippet!)}
                              className="text-[10px] text-indigo-400 hover:underline"
                            >
                              Insert in Editor
                            </button>
                          </div>
                          <pre className="rounded-lg border border-slate-800 bg-slate-950 p-2 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                            {msg.code_snippet}
                          </pre>
                        </div>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask a question about WRH-Lang syntax or compiler rules..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Button
                  onClick={handleSendChat}
                  disabled={isChatting || !chatInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send</span>
                </Button>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === "settings" && (
            <div className="max-w-xl mx-auto space-y-6 py-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Settings className="h-4 w-4 text-indigo-400" />
                  <span>Google Gemini API Configuration</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The AI Assistant uses official Google Gemini models to generate and fix WRH code. If you haven&apos;t set a backend environment variable, enter your key below.
                </p>

                {/* API Key Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Gemini API Key
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="AIzaSy..."
                      className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowKey(!showKey)}
                      className="h-8 text-xs text-slate-300 border-slate-800"
                    >
                      {showKey ? "Hide" : "Show"}
                    </Button>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Stored securely in your browser&apos;s localStorage.
                  </p>
                </div>

                {/* Model Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Gemini Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  >
                    {aiStatus?.supported_models && aiStatus.supported_models.length > 0 ? (
                      aiStatus.supported_models.map((m) => (
                        <option key={m} value={m}>
                          {m} {m.includes("3-flash") ? "(Recommended - Fast)" : ""}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="gemini-3-flash-preview">
                          gemini-3-flash-preview (Recommended - Fast)
                        </option>
                        <option value="gemini-3.5-flash">
                          gemini-3.5-flash
                        </option>
                        <option value="gemini-2.0-flash">
                          gemini-2.0-flash
                        </option>
                        <option value="gemini-flash-latest">
                          gemini-flash-latest
                        </option>
                      </>
                    )}
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <a
                    href="https://aistudio.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>Get a free key from Google AI Studio</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  <Button
                    onClick={handleSaveApiKey}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-1.5"
                  >
                    Save Settings
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
