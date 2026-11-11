"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FolderCode,
  Save,
  Trash2,
  Code2,
  Calendar,
  X,
  Plus,
  RefreshCw,
  LogIn,
  Check,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export interface UserSnippet {
  id: number;
  title: string;
  code: string;
  created_at: string;
  updated_at: string;
}

interface SnippetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCode: string;
  onLoadSnippet: (code: string, title: string) => void;
  onOpenAuth: () => void;
}

export function SnippetsModal({
  isOpen,
  onClose,
  currentCode,
  onLoadSnippet,
  onOpenAuth,
}: SnippetsModalProps) {
  const { isAuthenticated, user } = useAuth();
  const [snippets, setSnippets] = useState<UserSnippet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchSnippets = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await api.get<UserSnippet[]>("/api/workspace/snippets/");
      setSnippets(res.data);
    } catch (err: any) {
      console.error("Failed to load snippets:", err);
      setErrorMsg("Failed to load snippets from server.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchSnippets();
    }
  }, [isOpen, isAuthenticated, fetchSnippets]);

  const handleSaveCurrent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) return;
    setIsSaving(true);
    setErrorMsg("");

    try {
      const res = await api.post<UserSnippet>("/api/workspace/snippets/", {
        title: saveTitle.trim(),
        code: currentCode,
      });
      setSnippets([res.data, ...snippets]);
      setSaveTitle("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      console.error("Failed to save snippet:", err);
      setErrorMsg("Failed to save snippet. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this snippet?")) return;
    try {
      await api.delete(`/api/workspace/snippets/${id}/`);
      setSnippets(snippets.filter((s) => s.id !== id));
    } catch (err: any) {
      console.error("Failed to delete snippet:", err);
      alert("Failed to delete snippet.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative flex flex-col max-h-[85vh] w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">
              <FolderCode className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Cloud Code Workspace</h2>
              <p className="text-[11px] text-slate-400">Save and manage your WRH programs</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!isAuthenticated ? (
            /* Unauthenticated Prompt */
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-950/80 border border-indigo-700/50 text-indigo-400">
                <LogIn className="h-7 w-7" />
              </div>
              <div className="max-w-md">
                <h3 className="text-base font-bold text-white">Sign in to save your code</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Log in or create a free account to persist your WRH programs directly to your cloud
                  database and access them from any browser.
                </p>
              </div>
              <Button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold px-5"
              >
                Sign In / Register
              </Button>
            </div>
          ) : (
            <>
              {/* Save Current Code Form */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Save className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Save Current Editor Code</span>
                </h3>

                <form onSubmit={handleSaveCurrent} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    placeholder="e.g. While Loop Factorial Program"
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors"
                  />
                  <Button
                    type="submit"
                    disabled={isSaving || !saveTitle.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold gap-1.5 px-4"
                  >
                    {isSaving ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : saveSuccess ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    <span>{saveSuccess ? "Saved!" : "Save Snippet"}</span>
                  </Button>
                </form>

                {errorMsg && (
                  <p className="mt-2 text-xs text-red-400">{errorMsg}</p>
                )}
              </div>

              {/* Saved Snippets List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Saved Programs ({snippets.length})
                  </h3>
                  <Button
                    onClick={fetchSnippets}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-slate-400 hover:text-white"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>

                {isLoading && snippets.length === 0 ? (
                  <div className="flex justify-center py-8 text-xs text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin text-indigo-400" />
                  </div>
                ) : snippets.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-slate-500 text-xs">
                    You have not saved any programs yet. Name and save your code above!
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {snippets.map((snip) => (
                      <div
                        key={snip.id}
                        className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5 hover:border-slate-700 transition-all"
                      >
                        <div className="min-w-0 flex-1 pr-4">
                          <h4 className="text-xs font-bold text-white truncate">
                            {snip.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(snip.updated_at).toLocaleDateString()}
                            </span>
                            <span>&bull;</span>
                            <span>{snip.code.split("\n").length} lines</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => {
                              onLoadSnippet(snip.code, snip.title);
                              onClose();
                            }}
                            size="sm"
                            className="h-7 bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-medium px-3"
                          >
                            Load
                          </Button>
                          <Button
                            onClick={() => handleDelete(snip.id)}
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-500 hover:text-red-400 hover:bg-red-950/40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex h-12 items-center justify-between border-t border-slate-800 bg-slate-950 px-6 text-xs text-slate-400">
          <span>Logged in as: <strong className="text-indigo-400">{user?.username || "Guest"}</strong></span>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
