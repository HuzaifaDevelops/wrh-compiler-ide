export interface AiStatus {
  configured: boolean;
  source: "environment" | "client" | "none";
  masked_key?: string | null;
  default_model: string;
  supported_models: string[];
}

export interface GenerateCodeRequest {
  prompt: string;
  context_code?: string;
  model?: string;
  api_key?: string;
}

export interface GenerateCodeResponse {
  success: boolean;
  code: string;
  explanation: string;
  model_used: string;
  raw_response?: string;
}

export interface FixCodeRequest {
  source_code: string;
  errors: any[];
  model?: string;
  api_key?: string;
}

export interface FixCodeResponse {
  success: boolean;
  explanation: string;
  violated_rule: string;
  error_line?: number;
  fixed_code: string;
  changes_summary: string[];
  model_used: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  code_snippet?: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  current_code?: string;
  model?: string;
  api_key?: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  code_snippet?: string;
  model_used: string;
}
