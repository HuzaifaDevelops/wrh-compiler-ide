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

export interface Quadruple {
  index: number;
  op: string;
  arg1: string;
  arg2: string;
  result: string;
}

export interface Triple {
  index: number;
  op: string;
  arg1: string;
  arg2: string;
}

export interface ICGResult {
  tac: string;
  tac_lines: string[];
  quadruples: Quadruple[];
  triples: Triple[];
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
  icg?: ICGResult;
  output?: string;
  output_lines?: string[];
  runtime_error?: string | null;
}
