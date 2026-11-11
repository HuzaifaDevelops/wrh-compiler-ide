import { api } from "./api";
import {
  AiStatus,
  GenerateCodeRequest,
  GenerateCodeResponse,
  FixCodeRequest,
  FixCodeResponse,
  ChatRequest,
  ChatResponse,
} from "@/types/ai";

export const AI_STORAGE_KEYS = {
  API_KEY: "wrh_gemini_api_key",
  MODEL: "wrh_gemini_model",
};

export function getStoredApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(AI_STORAGE_KEYS.API_KEY) || "";
}

export function setStoredApiKey(key: string): void {
  if (typeof window === "undefined") return;
  if (!key.trim()) {
    localStorage.removeItem(AI_STORAGE_KEYS.API_KEY);
  } else {
    localStorage.setItem(AI_STORAGE_KEYS.API_KEY, key.trim());
  }
}

export function getStoredModel(): string {
  if (typeof window === "undefined") return "gemini-3-flash-preview";
  return localStorage.getItem(AI_STORAGE_KEYS.MODEL) || "gemini-3-flash-preview";
}

export function setStoredModel(model: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AI_STORAGE_KEYS.MODEL, model);
}

export async function fetchAiStatus(): Promise<AiStatus> {
  const apiKey = getStoredApiKey();
  const headers = apiKey ? { "X-Gemini-Api-Key": apiKey } : {};
  const res = await api.get<AiStatus>("/api/ai/status/", { headers });
  return res.data;
}

export async function generateWrhCode(
  prompt: string,
  contextCode?: string,
  model?: string
): Promise<GenerateCodeResponse> {
  const apiKey = getStoredApiKey();
  const selectedModel = model || getStoredModel();
  const headers = apiKey ? { "X-Gemini-Api-Key": apiKey } : {};

  const res = await api.post<GenerateCodeResponse>(
    "/api/ai/generate/",
    {
      prompt,
      context_code: contextCode || "",
      model: selectedModel,
      api_key: apiKey,
    },
    { headers }
  );
  return res.data;
}

export async function fixWrhCode(
  sourceCode: string,
  errors: any[],
  model?: string
): Promise<FixCodeResponse> {
  const apiKey = getStoredApiKey();
  const selectedModel = model || getStoredModel();
  const headers = apiKey ? { "X-Gemini-Api-Key": apiKey } : {};

  const res = await api.post<FixCodeResponse>(
    "/api/ai/fix/",
    {
      source_code: sourceCode,
      errors,
      model: selectedModel,
      api_key: apiKey,
    },
    { headers }
  );
  return res.data;
}

export async function sendWrhChat(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  currentCode?: string,
  model?: string
): Promise<ChatResponse> {
  const apiKey = getStoredApiKey();
  const selectedModel = model || getStoredModel();
  const headers = apiKey ? { "X-Gemini-Api-Key": apiKey } : {};

  const res = await api.post<ChatResponse>(
    "/api/ai/chat/",
    {
      messages,
      current_code: currentCode || "",
      model: selectedModel,
      api_key: apiKey,
    },
    { headers }
  );
  return res.data;
}
