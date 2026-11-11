"use client";

import React, { useState } from "react";
import { Terminal, Copy, Check, AlertCircle, Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OutputConsoleViewProps {
  output?: string;
  outputLines?: string[];
  runtimeError?: string | null;
  executionTimeMs?: number;
}

export function OutputConsoleView({
  output = "",
  outputLines = [],
  runtimeError = null,
  executionTimeMs = 0,
}: OutputConsoleViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasLines = outputLines && outputLines.length > 0;

  return (
    <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-950 shadow-sm overflow-hidden min-h-[320px]">
      {/* Console Top Bar */}
      <div className="flex h-10 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200">
            Program Output Terminal
          </span>
          <Badge
            variant={runtimeError ? "danger" : hasLines ? "success" : "secondary"}
            className="text-[10px] font-mono py-0 px-2"
          >
            {runtimeError
              ? "Runtime Error"
              : hasLines
              ? `Executed (${executionTimeMs}ms)`
              : "No prints"}
          </Badge>
        </div>

        {hasLines && (
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 border-slate-700 bg-slate-800/80 px-2.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span>Copy Output</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Terminal Body */}
      <div className="flex-1 p-4 font-mono text-xs overflow-y-auto bg-slate-950">
        {runtimeError && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-800/80 bg-red-950/40 p-3 text-red-200">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-400">Runtime Exception</p>
              <p className="text-xs text-red-300 mt-0.5">{runtimeError}</p>
            </div>
          </div>
        )}

        {hasLines ? (
          <div className="space-y-1">
            {outputLines.map((line, idx) => (
              <div key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-600 select-none text-[11px] w-6 text-right">
                  {idx + 1}
                </span>
                <span className="text-emerald-500 font-bold select-none">&gt;</span>
                <span className="text-emerald-300 whitespace-pre-wrap">{line}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-slate-900 mt-4 text-[11px] text-slate-500 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Program execution finished successfully.</span>
            </div>
          </div>
        ) : (
          <div className="flex h-48 flex-col items-center justify-center text-center text-slate-500">
            <Info className="h-8 w-8 text-slate-600 mb-2" />
            <p className="font-medium text-slate-400">No console output generated</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Your WRH program compiled and ran, but did not call any{" "}
              <code className="text-indigo-400">flex(...)</code> print statements.
            </p>
            <div className="mt-3 rounded-md bg-slate-900 border border-slate-800 px-3 py-1.5 text-slate-400 text-[11px]">
              Try adding: <code className="text-emerald-400">flex(&quot;Hello World&quot;);</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
