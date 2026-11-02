"use client";

import React, { useState } from "react";
import {
  X,
  BookOpen,
  Code2,
  FileCode2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DocsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSnippet: (code: string) => void;
}

interface ExampleCodeBlockProps {
  title: string;
  code: string;
  description?: string;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "danger" | "secondary";
  onLoad: (code: string) => void;
}

function ExampleCodeBlock({
  title,
  code,
  description,
  badge,
  badgeVariant = "default",
  onLoad,
}: ExampleCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 px-3.5 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-200">{title}</span>
          {badge && (
            <Badge variant={badgeVariant} className="text-[10px] py-0 px-2">
              {badge}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            title="Copy code to clipboard"
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
          <Button
            size="sm"
            onClick={() => onLoad(code)}
            className="h-6 px-2 text-[11px] bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1"
          >
            <span>Load in Editor</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {description && (
        <p className="px-3.5 pt-2 text-[11px] text-slate-400 leading-relaxed">
          {description}
        </p>
      )}
      <pre className="p-3.5 text-[11px] font-mono text-indigo-300 overflow-x-auto leading-relaxed bg-slate-950/40">
        {code.trim()}
      </pre>
    </div>
  );
}

export function DocsDrawer({ isOpen, onClose, onSelectSnippet }: DocsDrawerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "operators" | "rules" | "examples">("overview");

  if (!isOpen) return null;

  const handleLoadSnippet = (code: string) => {
    onSelectSnippet(code);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      {/* Click backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside
          className="relative w-screen max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-slate-200"
          aria-label="Language Reference Drawer"
        >
          {/* Drawer Header */}
          <div className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/70 px-6 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-md">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-wide">
                  WRH Language Reference Guide
                </h2>
                <p className="text-[11px] text-slate-400">
                  Course Labs 01, 02 &amp; 03 &bull; Grammar &amp; Semantic Specification
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              aria-label="Close reference drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/90 px-6 pt-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "overview"
                  ? "border-indigo-500 text-indigo-400 font-semibold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Data Types &amp; Flow
            </button>
            <button
              onClick={() => setActiveTab("operators")}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "operators"
                  ? "border-indigo-500 text-indigo-400 font-semibold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Operators &amp; Precedence
            </button>
            <button
              onClick={() => setActiveTab("rules")}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "rules"
                  ? "border-indigo-500 text-indigo-400 font-semibold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              The 6 Semantic Rules
            </button>
            <button
              onClick={() => setActiveTab("examples")}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "examples"
                  ? "border-indigo-500 text-indigo-400 font-semibold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Full Examples
            </button>
          </div>

          {/* Drawer Body Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            {/* TAB 1: OVERVIEW & DATA TYPES & CONTROL FLOW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Introduction Callout */}
                <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/30 p-4">
                  <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs mb-1">
                    <Sparkles className="h-4 w-4" />
                    <span>Language Philosophy</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    WRH is a statically typed imperative programming language designed for compiler construction laboratories.
                    Every variable must be declared with its type before use, statements end with a semicolon (<code>;</code>),
                    and code blocks are enclosed in curly braces (<code>&#123; &#125;</code>).
                  </p>
                </div>

                {/* Section: Data Types */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    1. Primitive Data Types
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-emerald-400 font-bold text-sm">digit</code>
                        <span className="text-[10px] text-slate-500">Integers</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-2">
                        Signed numeric integer values (e.g., <code>0</code>, <code>42</code>, <code>-15</code>).
                      </p>
                      <pre className="text-[10px] font-mono text-slate-300 bg-slate-900/80 p-1.5 rounded">
                        digit count := 10;
                      </pre>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-emerald-400 font-bold text-sm">verify</code>
                        <span className="text-[10px] text-slate-500">Booleans</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-2">
                        Boolean truth values: literals <code className="text-emerald-300">yes</code> and <code className="text-rose-300">no</code>.
                      </p>
                      <pre className="text-[10px] font-mono text-slate-300 bg-slate-900/80 p-1.5 rounded">
                        verify isValid := yes;
                      </pre>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-emerald-400 font-bold text-sm">textbody</code>
                        <span className="text-[10px] text-slate-500">Strings</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-2">
                        String literal sequences enclosed in double quotation marks.
                      </p>
                      <pre className="text-[10px] font-mono text-slate-300 bg-slate-900/80 p-1.5 rounded">
                        textbody msg := &quot;WRH&quot;;
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Section: Control Flow & Statements */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    2. Control Flow &amp; Statements
                  </h3>

                  <div className="space-y-3">
                    <ExampleCodeBlock
                      title="Conditional Statement (when ... otherwise)"
                      badge="Syntax"
                      code={`verify condition := yes;
when (condition ?= yes) {
    flex("Condition is verified!");
} otherwise {
    flex("Condition is not met.");
}`}
                      description="Evaluates a boolean condition. The 'otherwise' branch is optional. Condition must evaluate to verify type."
                      onLoad={handleLoadSnippet}
                    />

                    <ExampleCodeBlock
                      title="Loop Statement (until)"
                      badge="Loop"
                      code={`digit counter := 0;
until (counter ?= 5) {
    counter := counter +++ 1;
    flex(counter);
}`}
                      description="Executes the block until the condition becomes true. Evaluates condition on each cycle."
                      onLoad={handleLoadSnippet}
                    />

                    <ExampleCodeBlock
                      title="Print / Output (flex)"
                      badge="I/O"
                      code={`digit total := 100;
textbody label := "Grand Total:";
flex(label);
flex(total);`}
                      description="Prints an expression to output. Supports digit, verify, or textbody expressions."
                      onLoad={handleLoadSnippet}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: OPERATORS & PRECEDENCE */}
            {activeTab === "operators" && (
              <div className="space-y-6">
                {/* Important Notice Callout */}
                <div className="rounded-xl border border-amber-800/80 bg-amber-950/40 p-3.5 text-amber-200">
                  <div className="flex items-center gap-2 font-semibold text-xs mb-1 text-amber-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Special WRH Lexer Rule: &quot;//&quot; is Division, NOT a comment!</span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    In WRH, <code>{"//"}</code> is the <strong>integer division operator</strong> (Stage 1 Lexer maps <code>{"//"}</code> to <code>DIV</code> token).
                    Comments in WRH start with <code>#</code>, running to the end of the line.
                  </p>
                </div>

                {/* Custom Operators Table */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Defined Custom Operators
                  </h3>
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                          <th className="py-2.5 px-3">Symbol</th>
                          <th className="py-2.5 px-3">Operation</th>
                          <th className="py-2.5 px-3">Operand Types</th>
                          <th className="py-2.5 px-3">Result Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                        <tr>
                          <td className="py-2 px-3 text-amber-300 font-bold">:=</td>
                          <td className="py-2 px-3 font-sans text-slate-300">Assignment</td>
                          <td className="py-2 px-3 text-slate-400">Variable := Expr</td>
                          <td className="py-2 px-3 text-emerald-400">Matches LHS</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-indigo-300 font-bold">+++</td>
                          <td className="py-2 px-3 font-sans text-slate-300">Addition</td>
                          <td className="py-2 px-3 text-slate-400">digit, digit</td>
                          <td className="py-2 px-3 text-emerald-400">digit</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-indigo-300 font-bold">---</td>
                          <td className="py-2 px-3 font-sans text-slate-300">Subtraction</td>
                          <td className="py-2 px-3 text-slate-400">digit, digit</td>
                          <td className="py-2 px-3 text-emerald-400">digit</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-indigo-300 font-bold">{"//"}</td>
                          <td className="py-2 px-3 font-sans text-slate-300">Integer Division</td>
                          <td className="py-2 px-3 text-slate-400">digit, digit</td>
                          <td className="py-2 px-3 text-emerald-400">digit</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-indigo-300 font-bold">**</td>
                          <td className="py-2 px-3 font-sans text-slate-300">Power / Exponentiation</td>
                          <td className="py-2 px-3 text-slate-400">digit, digit</td>
                          <td className="py-2 px-3 text-emerald-400">digit</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-cyan-300 font-bold">?=</td>
                          <td className="py-2 px-3 font-sans text-slate-300">Equality Test</td>
                          <td className="py-2 px-3 text-slate-400">T, T (Identical)</td>
                          <td className="py-2 px-3 text-emerald-400">verify</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-cyan-300 font-bold">~</td>
                          <td className="py-2 px-3 font-sans text-slate-300">Inequality Test</td>
                          <td className="py-2 px-3 text-slate-400">T, T (Identical)</td>
                          <td className="py-2 px-3 text-emerald-400">verify</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-cyan-300 font-bold">&gt;&gt;</td>
                          <td className="py-2 px-3 font-sans text-slate-300">Greater Than</td>
                          <td className="py-2 px-3 text-slate-400">digit, digit</td>
                          <td className="py-2 px-3 text-emerald-400">verify</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-cyan-300 font-bold">&lt;&lt;</td>
                          <td className="py-2 px-3 font-sans text-slate-300">Less Than</td>
                          <td className="py-2 px-3 text-slate-400">digit, digit</td>
                          <td className="py-2 px-3 text-emerald-400">verify</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Precedence Hierarchy */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Operator Precedence Table (Highest to Lowest)
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl border border-indigo-800/80 bg-indigo-950/40 p-3">
                      <div>
                        <span className="font-semibold text-xs text-white">Tier 1: Multiplicative &amp; Exponential</span>
                        <div className="font-mono text-xs text-indigo-300 mt-0.5">
                          <code>**</code> (Power), <code>{"//"}</code> (Integer Division)
                        </div>
                      </div>
                      <Badge variant="default" className="text-[10px]">
                        Highest Precedence
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
                      <div>
                        <span className="font-semibold text-xs text-white">Tier 2: Additive &amp; Subtractive</span>
                        <div className="font-mono text-xs text-indigo-300 mt-0.5">
                          <code>+++</code> (Addition), <code>---</code> (Subtraction)
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        Medium Precedence
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
                      <div>
                        <span className="font-semibold text-xs text-white">Tier 3: Relational &amp; Equality Comparisons</span>
                        <div className="font-mono text-xs text-indigo-300 mt-0.5">
                          <code>&gt;&gt;</code>, <code>&lt;&lt;</code>, <code>?=</code>, <code>~</code>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        Lowest Precedence
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: THE 6 SEMANTIC RULES */}
            {activeTab === "rules" && (
              <div className="space-y-5">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs text-slate-400">
                  <p>
                    Stage 3 (Semantic Analyzer) verifies all 6 core static semantic constraints.
                    Click &quot;Load in Editor&quot; on any rule below to test the compiler&apos;s live diagnostic reporting.
                  </p>
                </div>

                {/* Rule 1 */}
                <ExampleCodeBlock
                  title="Rule 1: Duplicate Declaration"
                  badge="Rule 1 Violation"
                  badgeVariant="danger"
                  code={`digit x := 10;
digit x := 20;
flex(x);`}
                  description="A variable identifier cannot be declared more than once in the symbol table."
                  onLoad={handleLoadSnippet}
                />

                {/* Rule 2 */}
                <ExampleCodeBlock
                  title="Rule 2: Undeclared Variable"
                  badge="Rule 2 Violation"
                  badgeVariant="danger"
                  code={`digit a := 10;
b := 20;
flex(b);`}
                  description="All identifiers used in assignments or expressions must be formally declared beforehand."
                  onLoad={handleLoadSnippet}
                />

                {/* Rule 3 */}
                <ExampleCodeBlock
                  title="Rule 3: Assignment Type Mismatch"
                  badge="Rule 3 Violation"
                  badgeVariant="danger"
                  code={`digit count := 5;
count := "string value";
flex(count);`}
                  description="The evaluated type of the right-hand side expression must match the variable's declared type."
                  onLoad={handleLoadSnippet}
                />

                {/* Rule 4 */}
                <ExampleCodeBlock
                  title="Rule 4: Arithmetic & Ordering Operator Type Check"
                  badge="Rule 4 Violation"
                  badgeVariant="danger"
                  code={`digit a := 10;
textbody text := "compiler";
digit result := a +++ text;
flex(result);`}
                  description="Operands for arithmetic (+++, ---, //, **) and ordering (>>, <<) must evaluate to digit."
                  onLoad={handleLoadSnippet}
                />

                {/* Rule 5 */}
                <ExampleCodeBlock
                  title="Rule 5: Equality Operator Type Check"
                  badge="Rule 5 Violation"
                  badgeVariant="danger"
                  code={`digit a := 10;
textbody b := "10";
verify match := a ?= b;
flex(match);`}
                  description="Operands for equality comparison (?=, ~) must be of the identical data type."
                  onLoad={handleLoadSnippet}
                />

                {/* Rule 6 */}
                <ExampleCodeBlock
                  title="Rule 6: Condition Expression Type Check"
                  badge="Rule 6 Violation"
                  badgeVariant="danger"
                  code={`digit counter := 1;
when (counter) {
    flex("Counter is positive");
}`}
                  description="Condition expressions in when (...) and until (...) statements must evaluate to verify type."
                  onLoad={handleLoadSnippet}
                />
              </div>
            )}

            {/* TAB 4: FULL EXAMPLES */}
            {activeTab === "examples" && (
              <div className="space-y-4">
                <ExampleCodeBlock
                  title="1. Standard Course Valid Program (valid.txt)"
                  badge="Complete Valid Program"
                  badgeVariant="success"
                  code={`digit a := 10;
verify flag := yes;
textbody msg := "Compiler running";

when (flag ?= yes) {
    flex(a);
    flex(msg);
} otherwise {
    flex("Flag is false");
}

digit i := 0;
until (i ?= 3) {
    i := i +++ 1;
    flex(i);
}`}
                  description="Fully compliant WRH program passing all 3 stages: tokenized by Lexer, parsed into AST, and verified by Semantic Analyzer."
                  onLoad={handleLoadSnippet}
                />

                <ExampleCodeBlock
                  title="2. Custom Arithmetic & Power Operations"
                  badge="Arithmetic"
                  badgeVariant="default"
                  code={`digit x := 12;
digit y := 4;
digit sum := x +++ y;
digit diff := x --- y;
digit quotient := x // y;
digit power := 2 ** 5;

flex(sum);
flex(diff);
flex(quotient);
flex(power);`}
                  description="Tests custom operator symbols +++, ---, // (integer division), and ** (power)."
                  onLoad={handleLoadSnippet}
                />

                <ExampleCodeBlock
                  title="3. Comparison & Relational Flow"
                  badge="Branching"
                  badgeVariant="default"
                  code={`digit a := 25;
digit b := 10;
verify is_greater := a >> b;
verify is_same := a ?= b;

when (is_greater ?= yes) {
    flex("a is strictly greater than b");
} otherwise {
    flex("a is not greater than b");
}`}
                  description="Demonstrates equality (?=) and relational shift (>>) operators in conditionals."
                  onLoad={handleLoadSnippet}
                />
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="flex h-14 items-center justify-between border-t border-slate-800 bg-slate-950/70 px-6">
            <span className="text-[11px] text-slate-500 font-mono">
              WRH Compiler Spec v1.0
            </span>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="border-slate-700 bg-slate-800/80 text-xs text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Close Reference
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
