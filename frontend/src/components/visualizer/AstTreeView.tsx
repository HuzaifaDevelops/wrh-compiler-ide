"use client";

import React, { useState } from "react";
import { Copy, Check, FileCode, Braces, AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AstTreeViewProps {
  astAscii: string;
  astJson: any;
}

export function AstTreeView({ astAscii, astJson }: AstTreeViewProps) {
  const [viewMode, setViewMode] = useState<"ascii" | "json">("ascii");
  const [copied, setCopied] = useState(false);

  const formattedJson = React.useMemo(() => {
    try {
      return JSON.stringify(astJson, null, 2);
    } catch {
      return "{}";
    }
  }, [astJson]);

  const handleCopy = () => {
    const textToCopy = viewMode === "ascii" ? astAscii : formattedJson;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-3">
      {/* View Mode Toolbar */}
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-2.5">
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => setViewMode("ascii")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                viewMode === "ascii"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <AlignLeft className="h-3.5 w-3.5" />
              <span>ASCII Tree View</span>
            </button>
            <button
              onClick={() => setViewMode("json")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                viewMode === "json"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Braces className="h-3.5 w-3.5" />
              <span>Structured JSON</span>
            </button>
          </div>
          <Badge variant="secondary" className="font-mono text-[11px] hidden sm:inline-flex">
            {viewMode === "ascii" ? "Hierarchical Indentation" : "AST Schema"}
          </Badge>
        </div>

        <Button
          onClick={handleCopy}
          size="sm"
          variant="outline"
          className="border-slate-700 bg-slate-800/80 text-xs text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-1.5"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied AST</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy AST</span>
            </>
          )}
        </Button>
      </div>

      {/* Code / Tree Container */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 overflow-hidden shadow-inner">
        {viewMode === "ascii" ? (
          <pre className="overflow-auto max-h-[500px] font-mono text-xs text-indigo-300 leading-relaxed whitespace-pre">
            {astAscii || (
              <span className="text-slate-500 italic">
                (Abstract Syntax Tree was not generated due to compilation errors)
              </span>
            )}
          </pre>
        ) : (
          <pre className="overflow-auto max-h-[500px] font-mono text-xs text-emerald-400/90 leading-relaxed whitespace-pre">
            {formattedJson && formattedJson !== "{}" ? (
              formattedJson
            ) : (
              <span className="text-slate-500 italic">
                (Structured AST JSON not available)
              </span>
            )}
          </pre>
        )}
      </div>
    </div>
  );
}
