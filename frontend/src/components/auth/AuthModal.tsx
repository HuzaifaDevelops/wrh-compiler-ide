"use client";

import React, { useState, useEffect } from "react";
import { X, LogIn, UserPlus, Lock, Mail, User as UserIcon, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { User, AuthTokens } from "@/types/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "login" | "register";
}

export function AuthModal({
  isOpen,
  onClose,
  initialTab = "login",
}: AuthModalProps) {
  const { login } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(initialTab);

  // Form states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync tab with initialTab when opened
  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialTab]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleTabSwitch = (newTab: "login" | "register") => {
    setTab(newTab);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await api.post("/api/auth/login/", {
        username: username.trim(),
        password,
      });

      const data = response.data;
      const tokens: AuthTokens = data.tokens || {
        access: data.access,
        refresh: data.refresh,
      };

      let userData: User = data.user;
      if (!userData) {
        // Fetch user profile if not directly provided in response
        const profileRes = await api.get<User>("/api/auth/profile/", {
          headers: { Authorization: `Bearer ${tokens.access}` },
        });
        userData = profileRes.data;
      }

      login(tokens, userData);
      setSuccessMessage("Signed in successfully!");
      setTimeout(() => {
        resetForm();
        onClose();
      }, 500);
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.response?.data) {
        const d = err.response.data;
        if (typeof d === "string") {
          setErrorMessage(d);
        } else if (d.detail) {
          setErrorMessage(d.detail);
        } else if (d.non_field_errors && Array.isArray(d.non_field_errors)) {
          setErrorMessage(d.non_field_errors.join(", "));
        } else {
          // Format field-level validation errors
          const errorStrings = Object.entries(d).map(
            ([field, errors]) =>
              `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`
          );
          setErrorMessage(errorStrings.join(" | ") || "Invalid credentials.");
        }
      } else {
        setErrorMessage("Network error: Unable to reach the authentication server.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await api.post("/api/auth/register/", {
        username: username.trim(),
        email: email.trim(),
        password,
      });

      const data = response.data;
      const tokens: AuthTokens = data.tokens || {
        access: data.access,
        refresh: data.refresh,
      };
      const userData: User = data.user;

      login(tokens, userData);
      setSuccessMessage("Account created successfully!");
      setTimeout(() => {
        resetForm();
        onClose();
      }, 600);
    } catch (err: any) {
      console.error("Registration error:", err);
      if (err.response?.data) {
        const d = err.response.data;
        if (typeof d === "string") {
          setErrorMessage(d);
        } else if (d.detail) {
          setErrorMessage(d.detail);
        } else {
          const errorStrings = Object.entries(d).map(
            ([field, errors]) =>
              `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`
          );
          setErrorMessage(errorStrings.join(" | ") || "Registration failed.");
        }
      } else {
        setErrorMessage("Network error: Unable to connect to server.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-700/80 bg-slate-900 p-6 shadow-2xl text-slate-100 transition-all scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label="Close authentication modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-lg shadow-indigo-600/30">
            {tab === "login" ? (
              <LogIn className="h-6 w-6 text-white" />
            ) : (
              <UserPlus className="h-6 w-6 text-white" />
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            {tab === "login" ? "Sign In to WRH IDE" : "Create WRH Account"}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {tab === "login"
              ? "Access your compiler workspace and saved programs"
              : "Register a compiler developer profile (PostgreSQL backed)"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mb-5 flex rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => handleTabSwitch("login")}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              tab === "login"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch("register")}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              tab === "register"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Status Messages */}
        {errorMessage && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-800/80 bg-red-950/60 p-3 text-xs text-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-xl border border-emerald-800 bg-emerald-950/60 p-3 text-center text-xs font-medium text-emerald-300">
            {successMessage}
          </div>
        )}

        {/* Forms */}
        {tab === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block mb-1.5 font-medium text-slate-300">
                Username
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. dev_user"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-9 pr-3 py-2 text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5 font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-9 pr-3 py-2 text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block mb-1.5 font-medium text-slate-300">
                Username
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-9 pr-3 py-2 text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5 font-medium text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-9 pr-3 py-2 text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5 font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-9 pr-3 py-2 text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register Account</span>
              )}
            </Button>
          </form>
        )}

        {/* Footer help */}
        <div className="mt-5 border-t border-slate-800/80 pt-3 text-center text-[11px] text-slate-500">
          WRH Compiler Workspace &bull; PostgreSQL Auth Security
        </div>
      </div>
    </div>
  );
}
