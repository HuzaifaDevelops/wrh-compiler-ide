"use client";

import React, { useState } from "react";
import {
  Cpu,
  Layers,
  Code2,
  Table,
  CheckCircle,
  AlertTriangle,
  FileQuestion,
  Terminal,
  Binary,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CompileResponse } from "@/types/compiler";
import { DiagnosticBanner } from "./DiagnosticBanner";
import { AllStagesView } from "./AllStagesView";
import { TokenStreamView } from "./TokenStreamView";
import { AstTreeView } from "./AstTreeView";
import { SymbolTableView } from "./SymbolTableView";
import { IcgView } from "./IcgView";
import { OutputConsoleView } from "./OutputConsoleView";

interface VisualizerPanelProps {
  compileResult: CompileResponse | null;
  isCompiling: boolean;
  onJumpToLine?: (line: number, column?: number) => void;
  onFixWithAi?: () => void;
}

export type VisualizerTab = "all" | "tokens" | "ast" | "symbols" | "icg" | "output";

export function VisualizerPanel({
  compileResult,
  isCompiling,
  onJumpToLine,
  onFixWithAi,
}: VisualizerPanelProps) {
  const [activeTab, setActiveTab] = useState<VisualizerTab>("all");

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100">
      {/* Engine Tab Header */}
      <div className="flex h-11 items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4">
        {/* Left: Brand & Tabs */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-xs text-white">
            <Cpu className="h-4 w-4 text-indigo-400" />
            <span className="tracking-wide uppercase text-[11px] text-slate-400">
              Compiler Engine
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Tab Selector Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("all")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                activeTab === "all"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              All Stages
            </button>

            <button
              onClick={() => setActiveTab("tokens")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                activeTab === "tokens"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>1. Lexer</span>
              {compileResult?.tokens && (
                <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-400">
                  {compileResult.tokens.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("ast")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                activeTab === "ast"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>2. Parser</span>
              {compileResult?.ast && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("symbols")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                activeTab === "symbols"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              <span>3. Semantic</span>
              {compileResult?.symbol_table && (
                <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-400">
                  {Object.keys(compileResult.symbol_table).length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("icg")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                activeTab === "icg"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Binary className="h-3.5 w-3.5" />
              <span>4. ICG</span>
              {compileResult?.icg?.tac_lines && compileResult.icg.tac_lines.length > 0 && (
                <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-400">
                  {compileResult.icg.tac_lines.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("output")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                activeTab === "output"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Terminal className="h-3.5 w-3.5 text-emerald-400" />
              <span>5. Output</span>
              {compileResult?.output_lines && compileResult.output_lines.length > 0 && (
                <span className="rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300 px-1.5 py-0.2 text-[10px] font-bold">
                  {compileResult.output_lines.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Right: Status Pill */}
        <div>
          {isCompiling ? (
            <Badge variant="warning" className="text-[11px] animate-pulse">
              Compiling...
            </Badge>
          ) : compileResult ? (
            <Badge
              variant={compileResult.success ? "success" : "danger"}
              className="text-[11px] font-mono"
            >
              {compileResult.success ? (
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Success &bull; {compileResult.execution_time_ms}ms</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span className="uppercase">
                    {compileResult.stage_failed || "compile"} error
                  </span>
                </span>
              )}
            </Badge>
          ) : (
            <span className="text-[11px] text-slate-500 font-mono">
              Ready to compile
            </span>
          )}
        </div>
      </div>

      {/* Engine Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {!compileResult ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center text-slate-500">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-600">
              <Terminal className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-300">
              Compiler Engine Ready
            </h4>
            <p className="mt-1 max-w-md text-xs text-slate-500 leading-relaxed">
              Click &quot;Compile&quot; in the navbar or press Ctrl+Enter to run your WRH code through the multi-stage compiler: Lexer (Stage 1), Parser (Stage 2), and Semantic Analyzer (Stage 3).
            </p>
          </div>
        ) : (
          <div>
            {/* Diagnostic Banner if there are errors */}
            <DiagnosticBanner
              errors={compileResult.errors}
              stageFailed={compileResult.stage_failed}
              onJumpToLine={onJumpToLine}
              onFixWithAi={onFixWithAi}
            />

            {/* Stage Tab Views */}
            {activeTab === "all" && (
              <AllStagesView
                result={compileResult}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === "tokens" && (
              <TokenStreamView tokens={compileResult.tokens || []} />
            )}

            {activeTab === "ast" && (
              <AstTreeView
                astAscii={compileResult.ast_ascii || ""}
                astJson={compileResult.ast || {}}
              />
            )}

            {activeTab === "symbols" && (
              <SymbolTableView
                symbolTable={compileResult.symbol_table || {}}
              />
            )}

            {activeTab === "icg" && (
              <IcgView icg={compileResult.icg} />
            )}

            {activeTab === "output" && (
              <OutputConsoleView
                output={compileResult.output || ""}
                outputLines={compileResult.output_lines || []}
                runtimeError={compileResult.runtime_error}
                executionTimeMs={compileResult.execution_time_ms}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
