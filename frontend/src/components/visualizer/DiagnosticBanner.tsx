"use client";

import React from "react";
import { AlertTriangle, Crosshair, ArrowRightCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompilerError } from "@/types/compiler";

interface DiagnosticBannerProps {
  errors: CompilerError[];
  stageFailed: "lexical" | "syntax" | "semantic" | null;
  onJumpToLine?: (line: number, column?: number) => void;
}

export function DiagnosticBanner({
  errors,
  stageFailed,
  onJumpToLine,
}: DiagnosticBannerProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="mb-4 rounded-xl border border-red-800/80 bg-red-950/70 p-4 text-red-200 shadow-lg shadow-red-950/30">
      <div className="mb-3 flex items-center justify-between border-b border-red-800/60 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-900/80 text-red-300">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-300">
              Compilation Halted &bull; {stageFailed ? `${stageFailed.toUpperCase()} ERROR` : "ERROR"}
            </h3>
            <p className="text-[11px] text-red-400">
              {errors.length} diagnostic {errors.length === 1 ? "issue" : "issues"} detected during compilation pipeline.
            </p>
          </div>
        </div>
        <Badge variant="danger" className="text-[10px] uppercase font-mono">
          Stage Failed
        </Badge>
      </div>

      <div className="space-y-2">
        {errors.map((err, idx) => (
          <div
            key={idx}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-red-900/60 bg-red-950/90 px-3 py-2 text-xs transition-colors hover:border-red-700"
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-900 text-[10px] font-bold text-red-200">
                {idx + 1}
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-red-200">
                    Line {err.line}{err.column !== undefined ? `, Col ${err.column}` : ""}
                  </span>
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wide bg-red-900/60 text-red-300 border-red-800">
                    {err.stage}
                  </Badge>
                  {err.rule && (
                    <span className="rounded bg-red-900/40 px-1.5 py-0.5 text-[10px] font-mono text-red-300 border border-red-800/50">
                      Rule: {err.rule}
                    </span>
                  )}
                </div>
                <p className="mt-1 font-mono text-[11px] text-red-300/90 leading-relaxed">
                  {err.message}
                </p>
              </div>
            </div>

            {onJumpToLine && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onJumpToLine(err.line, err.column)}
                className="shrink-0 h-7 border-red-800/80 bg-red-900/50 text-red-200 hover:bg-red-800 hover:text-white text-[11px] flex items-center gap-1.5"
                title={`Jump to line ${err.line}`}
              >
                <Crosshair className="h-3.5 w-3.5 text-red-300" />
                <span>Jump to Line</span>
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
