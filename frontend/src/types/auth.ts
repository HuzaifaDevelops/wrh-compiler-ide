export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  access?: string;
  refresh?: string;
}

export interface Snippet {
  id: number;
  title: string;
  code: string;
  created_at: string;
  updated_at: string;
}
