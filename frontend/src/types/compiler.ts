export interface Token {
  type: string;
  lexeme: string;
  line: number;
  column?: number;
}

export interface CompilerError {
  stage: "lexical" | "syntax" | "semantic";
  line: number;
  column?: number;
  message: string;
  rule?: string;
}

export interface SymbolTableEntry {
  type: string;
  line: number;
}

export interface CompileRequest {
  source_code: string;
}

export interface CompileResponse {
  success: boolean;
  status: "compiled" | "error";
  stage_reached: number;
  stage_failed: "lexical" | "syntax" | "semantic" | null;
  tokens: Token[];
  ast: any[];
  ast_ascii: string;
  symbol_table: Record<string, SymbolTableEntry>;
  errors: CompilerError[];
  execution_time_ms: number;
}
