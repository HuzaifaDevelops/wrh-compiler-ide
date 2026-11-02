"use client";

import React from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Code2,
  Layers,
  Table,
  ArrowRight,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CompileResponse } from "@/types/compiler";

interface AllStagesViewProps {
  result: CompileResponse;
  onNavigateTab: (tab: "tokens" | "ast" | "symbols") => void;
}

export function AllStagesView({ result, onNavigateTab }: AllStagesViewProps) {
  const isLexerSuccess = result.stage_reached >= 1 && result.stage_failed !== "lexical";
  const isParserSuccess = result.stage_reached >= 2 && result.stage_failed !== "syntax";
  const isSemanticSuccess = result.stage_reached >= 3 && result.stage_failed !== "semantic";

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
        </div>
      </div>

      {/* Tri-Pane Overview Cards */}
      <div className="grid gap-4 lg:grid-cols-3">
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
      </div>
    </div>
  );
}
