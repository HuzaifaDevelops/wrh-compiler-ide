"use client";

import React, { useState, useMemo } from "react";
import { Search, Hash, ArrowUpDown, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Token } from "@/types/compiler";

interface TokenStreamViewProps {
  tokens: Token[];
}

export function TokenStreamView({ tokens }: TokenStreamViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");

  // Token classification helper for styling
  const getTokenColor = (type: string) => {
    switch (type) {
      case "INT":
      case "BOOL":
      case "STRING":
      case "WHEN":
      case "OTHERWISE":
      case "UNTIL":
      case "PRINT":
      case "TRUE":
      case "FALSE":
        return "bg-violet-950/70 text-violet-300 border-violet-800/60";
      case "ID":
        return "bg-emerald-950/70 text-emerald-300 border-emerald-800/60";
      case "NUM":
        return "bg-sky-950/70 text-sky-300 border-sky-800/60";
      case "STR":
        return "bg-amber-950/70 text-amber-300 border-amber-800/60";
      case ":=":
      case "+++":
      case "---":
      case "//":
      case "**":
      case "?=":
      case "~":
      case ">>":
      case "<<":
        return "bg-rose-950/70 text-rose-300 border-rose-800/60";
      default:
        return "bg-slate-800/80 text-slate-300 border-slate-700";
    }
  };

  // Distinct token types for filter pills
  const distinctTypes = useMemo(() => {
    const set = new Set<string>();
    tokens.forEach((t) => set.add(t.type));
    return Array.from(set).sort();
  }, [tokens]);

  const filteredTokens = useMemo(() => {
    return tokens.filter((token) => {
      const matchesSearch =
        token.lexeme.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        selectedFilter === "ALL" || token.type === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [tokens, searchTerm, selectedFilter]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search token type or lexeme..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
          />
        </div>

        {/* Quick Filter Select */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono"
          >
            <option value="ALL">All Types ({tokens.length})</option>
            {distinctTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <Badge variant="secondary" className="font-mono text-xs">
            {filteredTokens.length} / {tokens.length}
          </Badge>
        </div>
      </div>

      {/* Tokens Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-950/90 backdrop-blur border-b border-slate-800 z-10">
              <tr className="text-slate-400">
                <th className="py-2.5 px-4 font-semibold">Index</th>
                <th className="py-2.5 px-4 font-semibold">Token Type</th>
                <th className="py-2.5 px-4 font-semibold">Exact Lexeme</th>
                <th className="py-2.5 px-4 font-semibold">Line</th>
                <th className="py-2.5 px-4 font-semibold">Column</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono">
              {filteredTokens.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-xs font-sans text-slate-500"
                  >
                    No tokens match the filter query &quot;{searchTerm}&quot;
                  </td>
                </tr>
              ) : (
                filteredTokens.map((token, index) => (
                  <tr
                    key={index}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2 px-4 text-slate-600 text-[11px]">
                      #{index + 1}
                    </td>
                    <td className="py-2 px-4">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${getTokenColor(
                          token.type
                        )}`}
                      >
                        {token.type}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-slate-200 font-semibold">
                      {token.lexeme === "\n" ? (
                        <span className="text-slate-500 italic">\n</span>
                      ) : (
                        token.lexeme
                      )}
                    </td>
                    <td className="py-2 px-4 text-slate-400">
                      Line {token.line}
                    </td>
                    <td className="py-2 px-4 text-slate-500">
                      {token.column !== undefined ? `Col ${token.column}` : "-"}
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
