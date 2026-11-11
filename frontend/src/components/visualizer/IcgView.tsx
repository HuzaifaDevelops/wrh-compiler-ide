"use client";

import React, { useState } from "react";
import {
  Binary,
  Code,
  Table,
  Copy,
  Check,
  Cpu,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ICGResult } from "@/types/compiler";

interface IcgViewProps {
  icg?: ICGResult;
}

type IcgSubTab = "tac" | "quadruples" | "triples";

export function IcgView({ icg }: IcgViewProps) {
  const [subTab, setSubTab] = useState<IcgSubTab>("tac");
  const [copied, setCopied] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  if (!icg || (!icg.tac && icg.quadruples.length === 0)) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center text-slate-500">
        <Binary className="mb-3 h-10 w-10 text-slate-600" />
        <h4 className="text-sm font-semibold text-slate-300">
          No Intermediate Code Available
        </h4>
        <p className="mt-1 max-w-sm text-xs text-slate-500">
          Intermediate code is generated after successful syntactic and semantic validation. Fix any compiler diagnostics to view TAC, Quadruples, and Triples.
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    if (icg.tac) {
      navigator.clipboard.writeText(icg.tac);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Compute stats
  const tempCount = (icg.tac.match(/\bt\d+\b/g) || []).length;
  const labelCount = (icg.tac.match(/\bL\d+:/g) || []).length;
  const totalInstructions = icg.tac_lines?.length || 0;

  const filteredQuads = icg.quadruples.filter((q) => {
    if (!filterQuery) return true;
    const qStr = `${q.index} ${q.op} ${q.arg1} ${q.arg2} ${q.result}`.toLowerCase();
    return qStr.includes(filterQuery.toLowerCase());
  });

  const filteredTriples = icg.triples.filter((t) => {
    if (!filterQuery) return true;
    const tStr = `${t.index} ${t.op} ${t.arg1} ${t.arg2}`.toLowerCase();
    return tStr.includes(filterQuery.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Overview Header & Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold font-mono text-white">
              {totalInstructions}
            </div>
            <div className="text-[11px] text-slate-400">TAC Instructions</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-950/80 text-purple-400 border border-purple-800/60">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold font-mono text-white">
              {tempCount}
            </div>
            <div className="text-[11px] text-slate-400">Temporary Registers</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/60">
            <Binary className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold font-mono text-white">
              {icg.quadruples.length}
            </div>
            <div className="text-[11px] text-slate-400">Quadruple Entries</div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-sm">
        {/* Navigation Sub-Tabs & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950/80 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSubTab("tac")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                subTab === "tac"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Code className="h-3.5 w-3.5" />
              <span>Three-Address Code (TAC)</span>
            </button>

            <button
              onClick={() => setSubTab("quadruples")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                subTab === "quadruples"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              <span>Quadruples Table</span>
              <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-400">
                {icg.quadruples.length}
              </span>
            </button>

            <button
              onClick={() => setSubTab("triples")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                subTab === "triples"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              <span>Triples Table</span>
              <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-400">
                {icg.triples.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {subTab === "tac" ? (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/90 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-slate-600 hover:bg-slate-700 hover:text-white transition-colors"
                title="Copy TAC instructions"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                    <span>Copy TAC</span>
                  </>
                )}
              </button>
            ) : (
              <input
                type="text"
                placeholder="Search..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="h-7 w-36 rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            )}
          </div>
        </div>

        {/* Sub-Tab 1: Three-Address Code (TAC) */}
        {subTab === "tac" && (
          <div className="p-4">
            <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-indigo-400" />
                Three-Address Code linearizes statements using temporaries (
                <span className="font-mono text-purple-300 font-bold">t1, t2...</span>) and jump labels (
                <span className="font-mono text-amber-300 font-bold">L1, L2...</span>).
              </span>
              <span className="font-mono text-slate-500">
                {icg.tac_lines?.length || 0} lines
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-800/80 bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-300 max-h-[460px]">
              {icg.tac_lines && icg.tac_lines.length > 0 ? (
                icg.tac_lines.map((line, idx) => {
                  const isLabel = line.trim().endsWith(":");
                  const isJump = line.includes("goto") || line.includes("ifFalse");
                  const isCall = line.includes("call") || line.includes("param");

                  return (
                    <div
                      key={idx}
                      className={`flex items-baseline py-0.5 hover:bg-slate-900/60 transition-colors ${
                        isLabel ? "text-amber-300 font-bold mt-1" : ""
                      }`}
                    >
                      <span className="w-10 shrink-0 select-none text-right pr-4 text-[11px] text-slate-600 font-mono">
                        {idx + 1}
                      </span>
                      <span
                        className={`flex-1 font-mono ${
                          isLabel
                            ? "text-amber-400 font-bold"
                            : isJump
                            ? "text-rose-300"
                            : isCall
                            ? "text-emerald-300"
                            : "text-slate-200"
                        }`}
                      >
                        {line}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-slate-500 italic">No TAC instructions generated.</div>
              )}
            </div>
          </div>
        )}

        {/* Sub-Tab 2: Quadruples Table */}
        {subTab === "quadruples" && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Info className="h-3.5 w-3.5 text-indigo-400" />
              <span>
                Quadruples explicitly record four fields:{" "}
                <span className="font-semibold text-slate-300">
                  (Operator, Argument 1, Argument 2, Result)
                </span>
                .
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 max-h-[460px]">
              <table className="w-full border-collapse text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3">Operator</th>
                    <th className="py-2.5 px-3">Argument 1</th>
                    <th className="py-2.5 px-3">Argument 2</th>
                    <th className="py-2.5 px-3">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredQuads.length > 0 ? (
                    filteredQuads.map((q) => (
                      <tr
                        key={q.index}
                        className="hover:bg-slate-900/50 transition-colors"
                      >
                        <td className="py-2 px-3 text-center text-slate-500">
                          {q.index}
                        </td>
                        <td className="py-2 px-3">
                          <span className="inline-block rounded bg-indigo-950/80 border border-indigo-800/60 px-1.5 py-0.5 text-indigo-300 font-bold">
                            {q.op}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300">
                          {q.arg1 !== "-" ? q.arg1 : <span className="text-slate-600">-</span>}
                        </td>
                        <td className="py-2 px-3 text-slate-300">
                          {q.arg2 !== "-" ? q.arg2 : <span className="text-slate-600">-</span>}
                        </td>
                        <td className="py-2 px-3">
                          {q.result !== "-" ? (
                            <span className="text-emerald-400 font-bold">
                              {q.result}
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 italic">
                        No quadruples matched.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sub-Tab 3: Triples Table */}
        {subTab === "triples" && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Info className="h-3.5 w-3.5 text-indigo-400" />
              <span>
                Triples avoid explicit result registers by referencing previous computation rows using pointers{" "}
                <span className="font-semibold text-purple-300">(index)</span>.
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 max-h-[460px]">
              <table className="w-full border-collapse text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3">Operator</th>
                    <th className="py-2.5 px-3">Argument 1</th>
                    <th className="py-2.5 px-3">Argument 2</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTriples.length > 0 ? (
                    filteredTriples.map((t) => {
                      const isArg1Ref = t.arg1 && t.arg1.startsWith("(") && t.arg1.endsWith(")");
                      const isArg2Ref = t.arg2 && t.arg2.startsWith("(") && t.arg2.endsWith(")");

                      return (
                        <tr
                          key={t.index}
                          className="hover:bg-slate-900/50 transition-colors"
                        >
                          <td className="py-2 px-3 text-center text-slate-500 font-bold">
                            ({t.index})
                          </td>
                          <td className="py-2 px-3">
                            <span className="inline-block rounded bg-indigo-950/80 border border-indigo-800/60 px-1.5 py-0.5 text-indigo-300 font-bold">
                              {t.op}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            {isArg1Ref ? (
                              <span className="inline-block rounded bg-purple-950/80 border border-purple-800/60 px-1.5 py-0.5 text-purple-300 font-bold">
                                {t.arg1}
                              </span>
                            ) : t.arg1 !== "-" ? (
                              <span className="text-slate-300">{t.arg1}</span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {isArg2Ref ? (
                              <span className="inline-block rounded bg-purple-950/80 border border-purple-800/60 px-1.5 py-0.5 text-purple-300 font-bold">
                                {t.arg2}
                              </span>
                            ) : t.arg2 !== "-" ? (
                              <span className="text-slate-300">{t.arg2}</span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500 italic">
                        No triples matched.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
