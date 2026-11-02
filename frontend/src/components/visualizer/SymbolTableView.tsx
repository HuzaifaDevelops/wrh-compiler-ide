"use client";

import React from "react";
import { Table as TableIcon, Hash, Tag, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SymbolTableEntry } from "@/types/compiler";

interface SymbolTableViewProps {
  symbolTable: Record<string, SymbolTableEntry>;
}

export function SymbolTableView({ symbolTable }: SymbolTableViewProps) {
  const entries = Object.entries(symbolTable || {});

  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case "digit":
        return "bg-sky-950/70 text-sky-300 border-sky-800/60";
      case "verify":
        return "bg-emerald-950/70 text-emerald-300 border-emerald-800/60";
      case "textbody":
        return "bg-amber-950/70 text-amber-300 border-amber-800/60";
      default:
        return "bg-slate-800/80 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <div className="flex items-center gap-2">
          <TableIcon className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-200">
            Stage 3: Symbol Table Registry
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            (Static scope analysis &amp; declaration registry)
          </span>
        </div>
        <Badge variant="secondary" className="font-mono text-xs">
          {entries.length} {entries.length === 1 ? "symbol" : "symbols"}
        </Badge>
      </div>

      {/* Table container */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-950/90 backdrop-blur border-b border-slate-800 z-10">
              <tr className="text-slate-400">
                <th className="py-2.5 px-4 font-semibold">Identifier Name</th>
                <th className="py-2.5 px-4 font-semibold">Declared Data Type</th>
                <th className="py-2.5 px-4 font-semibold">Declaration Line</th>
                <th className="py-2.5 px-4 font-semibold">Scope Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono">
              {entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-10 text-center font-sans text-xs text-slate-500"
                  >
                    No symbols recorded. Declare variables (e.g.,{" "}
                    <code className="text-indigo-400">digit a := 10;</code>) to populate the symbol table.
                  </td>
                </tr>
              ) : (
                entries.map(([name, item], index) => (
                  <tr
                    key={name}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-4 font-bold text-emerald-400">
                      {name}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${getTypeBadge(
                          item.type
                        )}`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">
                      Line {item.line}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-sans text-[11px]">
                      Global (Program)
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
