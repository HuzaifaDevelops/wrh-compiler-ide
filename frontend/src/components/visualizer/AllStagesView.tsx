"use client";

import React from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Code2,
  Layers,
  Table,
  Terminal,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Binary,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CompileResponse } from "@/types/compiler";

interface AllStagesViewProps {
  result: CompileResponse;
  onNavigateTab: (tab: "tokens" | "ast" | "symbols" | "icg" | "output") => void;
}

export function AllStagesView({ result, onNavigateTab }: AllStagesViewProps) {
  const isLexerSuccess = result.stage_reached >= 1 && result.stage_failed !== "lexical";
  const isParserSuccess = result.stage_reached >= 2 && result.stage_failed !== "syntax";
  const isSemanticSuccess = result.stage_reached >= 3 && result.stage_failed !== "semantic";
  const isIcgSuccess = isSemanticSuccess && (result.icg?.tac_lines?.length || 0) > 0;
  const isExecutionSuccess = isSemanticSuccess && !result.runtime_error;

  return (
    <div className="space-y-6">
      {/* Top Stepper Pipeline */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Compiler Pipeline Execution Flow
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5 text-indigo-400" />
            <span>Total Latency:</span>
            <span className="font-mono font-semibold text-white">
              {result.execution_time_ms ?? 0} ms
            </span>
          </div>
        </div>

        {/* Pipeline Stepper Nodes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Stage 1: Lexer */}
          <div
            className={`relative flex items-center gap-3 rounded-xl border p-3 transition-colors ${
              isLexerSuccess
                ? "border-emerald-800/80 bg-emerald-950/20"
                : result.stage_failed === "lexical"
                ? "border-red-800/80 bg-red-950/30"
                : "border-slate-800 bg-slate-950/40"
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                isLexerSuccess
                  ? "bg-emerald-900/60 text-emerald-400 border border-emerald-700/50"
                  : result.stage_failed === "lexical"
                  ? "bg-red-900/60 text-red-400 border border-red-700/50"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              <Code2 className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">1. Lexer</span>
                {isLexerSuccess ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : result.stage_failed === "lexical" ? (
                  <XCircle className="h-4 w-4 text-red-400" />
                ) : (
                  <span className="text-[10px] text-slate-500">Pending</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {result.tokens?.length ?? 0} tokens scanned
              </p>
            </div>
          </div>

          {/* Stage 2: Parser */}
          <div
            className={`relative flex items-center gap-3 rounded-xl border p-3 transition-colors ${
              isParserSuccess
                ? "border-emerald-800/80 bg-emerald-950/20"
                : result.stage_failed === "syntax"
                ? "border-red-800/80 bg-red-950/30"
                : "border-slate-800 bg-slate-950/40 opacity-70"
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                isParserSuccess
                  ? "bg-emerald-900/60 text-emerald-400 border border-emerald-700/50"
                  : result.stage_failed === "syntax"
                  ? "bg-red-900/60 text-red-400 border border-red-700/50"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">2. Parser</span>
                {isParserSuccess ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : result.stage_failed === "syntax" ? (
                  <XCircle className="h-4 w-4 text-red-400" />
                ) : (
                  <span className="text-[10px] text-slate-500">Skipped</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {isParserSuccess
                  ? "AST constructed"
                  : result.stage_failed === "syntax"
                  ? "Syntax error"
                  : "Not reached"}
              </p>
            </div>
          </div>

          {/* Stage 3: Semantic Analyzer */}
          <div
            className={`relative flex items-center gap-3 rounded-xl border p-3 transition-colors ${
              isSemanticSuccess
                ? "border-emerald-800/80 bg-emerald-950/20"
                : result.stage_failed === "semantic"
                ? "border-red-800/80 bg-red-950/30"
                : "border-slate-800 bg-slate-950/40 opacity-70"
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                isSemanticSuccess
                  ? "bg-emerald-900/60 text-emerald-400 border border-emerald-700/50"
                  : result.stage_failed === "semantic"
                  ? "bg-red-900/60 text-red-400 border border-red-700/50"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              <Table className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">3. Semantic</span>
                {isSemanticSuccess ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : result.stage_failed === "semantic" ? (
                  <XCircle className="h-4 w-4 text-red-400" />
                ) : (
                  <span className="text-[10px] text-slate-500">Skipped</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {Object.keys(result.symbol_table || {}).length} symbols validated
              </p>
            </div>
          </div>

          {/* Stage 4: Intermediate Code Generation (ICG) */}
          <div
            className={`relative flex items-center gap-3 rounded-xl border p-3 transition-colors ${
              isIcgSuccess
                ? "border-emerald-800/80 bg-emerald-950/20"
                : "border-slate-800 bg-slate-950/40 opacity-70"
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                isIcgSuccess
                  ? "bg-indigo-900/60 text-indigo-400 border border-indigo-700/50"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              <Binary className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">4. ICG</span>
                {isIcgSuccess ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <span className="text-[10px] text-slate-500">Skipped</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {result.icg?.tac_lines?.length ?? 0} TAC instructions
              </p>
            </div>
          </div>

          {/* Stage 5: Execution / Output */}
          <div
            className={`relative flex items-center gap-3 rounded-xl border p-3 transition-colors ${
              isExecutionSuccess
                ? "border-emerald-800/80 bg-emerald-950/20"
                : result.runtime_error
                ? "border-red-800/80 bg-red-950/30"
                : "border-slate-800 bg-slate-950/40 opacity-70"
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                isExecutionSuccess
                  ? "bg-emerald-900/60 text-emerald-400 border border-emerald-700/50"
                  : result.runtime_error
                  ? "bg-red-900/60 text-red-400 border border-red-700/50"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              <Terminal className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">5. Output</span>
                {isExecutionSuccess ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : result.runtime_error ? (
                  <XCircle className="h-4 w-4 text-red-400" />
                ) : (
                  <span className="text-[10px] text-slate-500">Skipped</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {result.output_lines?.length ?? 0} lines printed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Overview Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Stage 1 Card: Lexer Tokens Preview */}
        <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200">Stage 1: Tokens</span>
            </div>
            <Badge variant="secondary" className="text-[10px] font-mono">
              {result.tokens?.length ?? 0}
            </Badge>
          </div>
          <div className="flex-1 p-3 overflow-y-auto max-h-64">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="pb-1">Type</th>
                  <th className="pb-1">Lexeme</th>
                  <th className="pb-1">Line</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {(result.tokens || []).slice(0, 8).map((tok, i) => (
                  <tr key={i}>
                    <td className="py-1 text-indigo-400 font-mono">{tok.type}</td>
                    <td className="py-1 text-slate-300 font-mono">{tok.lexeme}</td>
                    <td className="py-1 text-slate-500">{tok.line}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(result.tokens || []).length > 8 && (
              <p className="mt-2 text-center text-[10px] text-slate-500">
                + {(result.tokens || []).length - 8} more tokens
              </p>
            )}
          </div>
          <button
            onClick={() => onNavigateTab("tokens")}
            className="flex items-center justify-center gap-1 border-t border-slate-800 bg-slate-950/40 py-2 text-xs font-medium text-indigo-400 hover:bg-slate-900 hover:text-indigo-300 transition-colors"
          >
            <span>View Full Token Stream</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Stage 2 Card: AST Tree Preview */}
        <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200">Stage 2: AST Tree</span>
            </div>
            <Badge variant="secondary" className="text-[10px] font-mono">
              ASCII
            </Badge>
          </div>
          <div className="flex-1 p-3 overflow-y-auto max-h-64">
            <pre className="text-[11px] font-mono text-indigo-300 whitespace-pre leading-relaxed">
              {result.ast_ascii || (
                <span className="text-slate-500 italic">
                  AST not available (syntax parsing did not complete)
                </span>
              )}
            </pre>
          </div>
          <button
            onClick={() => onNavigateTab("ast")}
            className="flex items-center justify-center gap-1 border-t border-slate-800 bg-slate-950/40 py-2 text-xs font-medium text-indigo-400 hover:bg-slate-900 hover:text-indigo-300 transition-colors"
          >
            <span>Inspect Full AST &amp; JSON</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Stage 3 Card: Symbol Table Preview */}
        <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <Table className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200">Stage 3: Symbols</span>
            </div>
            <Badge variant="secondary" className="text-[10px] font-mono">
              {Object.keys(result.symbol_table || {}).length}
            </Badge>
          </div>
          <div className="flex-1 p-3 overflow-y-auto max-h-64">
            {Object.keys(result.symbol_table || {}).length === 0 ? (
              <div className="flex h-32 items-center justify-center text-xs text-slate-500">
                No symbols declared
              </div>
            ) : (
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500">
                    <th className="pb-1">Variable</th>
                    <th className="pb-1">Type</th>
                    <th className="pb-1">Line</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {Object.entries(result.symbol_table || {}).map(([name, entry], i) => (
                    <tr key={i}>
                      <td className="py-1 font-semibold text-emerald-400 font-mono">
                        {name}
                      </td>
                      <td className="py-1 text-slate-300 font-mono">{entry.type}</td>
                      <td className="py-1 text-slate-500">{entry.line}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <button
            onClick={() => onNavigateTab("symbols")}
            className="flex items-center justify-center gap-1 border-t border-slate-800 bg-slate-950/40 py-2 text-xs font-medium text-indigo-400 hover:bg-slate-900 hover:text-indigo-300 transition-colors"
          >
            <span>View Full Symbol Table</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Stage 4 Card: Intermediate Code Generation (ICG) */}
        <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <Binary className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200">Stage 4: ICG</span>
            </div>
            <Badge variant="secondary" className="text-[10px] font-mono">
              {result.icg?.tac_lines?.length ?? 0}
            </Badge>
          </div>
          <div className="flex-1 p-3 overflow-y-auto max-h-64 font-mono text-[11px] bg-slate-950">
            {result.icg?.tac_lines && result.icg.tac_lines.length > 0 ? (
              <div className="space-y-1">
                {result.icg.tac_lines.slice(0, 8).map((line, i) => (
                  <div key={i} className="truncate text-slate-300 hover:text-white">
                    <span className="text-slate-600 mr-2 select-none">{i + 1}</span>
                    <span className={line.endsWith(":") ? "text-amber-400 font-bold" : ""}>
                      {line}
                    </span>
                  </div>
                ))}
                {result.icg.tac_lines.length > 8 && (
                  <p className="mt-2 text-center text-[10px] text-slate-500">
                    + {result.icg.tac_lines.length - 8} more instructions
                  </p>
                )}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-xs text-slate-500 text-center">
                No ICG generated yet.
              </div>
            )}
          </div>
          <button
            onClick={() => onNavigateTab("icg")}
            className="flex items-center justify-center gap-1 border-t border-slate-800 bg-slate-950/40 py-2 text-xs font-medium text-indigo-400 hover:bg-slate-900 hover:text-indigo-300 transition-colors"
          >
            <span>View TAC &amp; Quads</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Stage 5 Card: Program Output Preview */}
        <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">Stage 5: Output</span>
            </div>
            <Badge
              variant={result.runtime_error ? "danger" : result.output_lines?.length ? "success" : "secondary"}
              className="text-[10px] font-mono"
            >
              {result.output_lines?.length ? `${result.output_lines.length} lines` : "Idle"}
            </Badge>
          </div>
          <div className="flex-1 p-3 overflow-y-auto max-h-64 font-mono text-[11px] bg-slate-950">
            {result.runtime_error ? (
              <p className="text-red-400 font-semibold">{result.runtime_error}</p>
            ) : result.output_lines && result.output_lines.length > 0 ? (
              <div className="space-y-1">
                {result.output_lines.map((line, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold select-none">&gt;</span>
                    <span className="text-emerald-300">{line}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-xs text-slate-500 text-center">
                No printed output.
                <br />
                Use flex(...) to print.
              </div>
            )}
          </div>
          <button
            onClick={() => onNavigateTab("output")}
            className="flex items-center justify-center gap-1 border-t border-slate-800 bg-slate-950/40 py-2 text-xs font-medium text-emerald-400 hover:bg-slate-900 hover:text-emerald-300 transition-colors"
          >
            <span>Open Output Console</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
