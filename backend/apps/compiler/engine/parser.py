"""
Recursive Descent Parser for WRH-Lang.
Parses token sequences into an Abstract Syntax Tree (AST) rooted at ProgramNode.
Enforces language grammar and raises ParseError with line/column coordinates.
"""

from typing import Any, List, Union

from .tokens import Token, ParseError
from .ast_nodes import (
    ProgramNode,
    DeclNode,
    AssignNode,
    IfNode,
    WhileNode,
    PrintNode,
    BinOpNode,
    NumNode,
    StrNode,
    BoolNode,
    IdNode,
)


class Parser:
    """
    Recursive descent parser for WRH-Lang grammar.
    Supports both Token objects and tuple/list tokens.
    """

    def __init__(self, tokens: List[Union[Token, tuple]]):
        self.toks = tokens
        self.pos = 0

    def current_token(self) -> Token:
        """Returns the current token as a Token object."""
        if self.pos >= len(self.toks):
            last_line = self.toks[-1][2] if self.toks else 1
            return Token("EOF", "end of file", last_line, 1)

        tok = self.toks[self.pos]
        if isinstance(tok, Token):
            return tok

        # Tuple or list fallback
        col = tok[3] if len(tok) > 3 else 1
        return Token(tok[0], tok[1], tok[2], col)

    def peek(self) -> str:
        """Look at the current token's type without advancing."""
        return self.current_token().type

    def consume(self) -> Token:
        """Consume and return current token."""
        tok = self.current_token()
        self.pos += 1
        return tok

    def match(self, kind: str) -> Token:
        """
        Consume the current token if it matches expected kind.
        Otherwise raises ParseError.
        """
        tok = self.current_token()
        if tok.type != kind:
            raise ParseError(
                f"Syntax Error at line {tok.line}: expected '{kind}' but found '{tok.lexeme}'",
                line=tok.line,
                column=tok.column,
            )
        self.pos += 1
        return tok

    def program(self) -> ProgramNode:
        """program -> stmt_list EOF"""
        body = self.stmt_list()
        self.match("EOF")
        return ProgramNode(body)

    def stmt_list(self) -> List[Any]:
        """stmt_list -> stmt stmt_list | epsilon"""
        stmts: List[Any] = []
        while self.peek() not in ("EOF", "}"):
            stmts.append(self.stmt())
        return stmts

    def stmt(self) -> Any:
        """stmt -> decl | assign | if_stmt | while_stmt | print_stmt"""
        tok = self.current_token()
        kind = tok.type

        # decl -> type ID (':=' expr)? ';'
        if kind in ("INT", "BOOL", "STRING"):
            type_tok = self.consume()
            name_tok = self.match("ID")
            init = None
            if self.peek() == ":=":
                self.match(":=")
                init = self.expr()
            self.match(";")
            return DeclNode(type_tok.lexeme, name_tok.lexeme, init, type_tok.line)

        # assign -> ID ':=' expr ';'
        if kind == "ID":
            name_tok = self.consume()
            self.match(":=")
            value = self.expr()
            self.match(";")
            return AssignNode(name_tok.lexeme, value, name_tok.line)

        # if_stmt -> when '(' expr ')' block (otherwise block)?
        if kind == "IF":
            if_tok = self.consume()
            self.match("(")
            cond = self.expr()
            self.match(")")
            then_block = self.block()
            else_block = None
            if self.peek() == "ELSE":
                self.consume()
                else_block = self.block()
            return IfNode(cond, then_block, else_block, if_tok.line)

        # while_stmt -> until '(' expr ')' block
        if kind == "WHILE":
            while_tok = self.consume()
            self.match("(")
            cond = self.expr()
            self.match(")")
            body = self.block()
            return WhileNode(cond, body, while_tok.line)

        # print_stmt -> flex '(' expr ')' ';'
        if kind == "PRINT":
            print_tok = self.consume()
            self.match("(")
            value = self.expr()
            self.match(")")
            self.match(";")
            return PrintNode(value, print_tok.line)

        raise ParseError(
            f"Syntax Error at line {tok.line}: a statement cannot start with '{tok.lexeme}'",
            line=tok.line,
            column=tok.column,
        )

    def block(self) -> List[Any]:
        """block -> '{' stmt_list '}'"""
        self.match("{")
        body = self.stmt_list()
        self.match("}")
        return body

    def expr(self) -> Any:
        """expr -> arith (relop arith)?"""
        left = self.arith()
        if self.peek() in (">>", "<<", "?=", "~"):
            op_tok = self.consume()
            right = self.arith()
            left = BinOpNode(op_tok.lexeme, left, right, op_tok.line)
        return left

    def arith(self) -> Any:
        """arith -> term (('+++' | '---') term)*"""
        left = self.term()
        while self.peek() in ("+++", "---"):
            op_tok = self.consume()
            right = self.term()
            left = BinOpNode(op_tok.lexeme, left, right, op_tok.line)
        return left

    def term(self) -> Any:
        """term -> factor (('**' | '//') factor)*"""
        left = self.factor()
        while self.peek() in ("**", "//"):
            op_tok = self.consume()
            right = self.factor()
            left = BinOpNode(op_tok.lexeme, left, right, op_tok.line)
        return left

    def factor(self) -> Any:
        """factor -> NUM | STR | TRUE | FALSE | ID | '(' expr ')'"""
        tok = self.current_token()
        kind = tok.type

        if kind == "NUM":
            self.consume()
            return NumNode(tok.lexeme, tok.line)
        if kind == "STR":
            self.consume()
            return StrNode(tok.lexeme, tok.line)
        if kind in ("TRUE", "FALSE"):
            self.consume()
            return BoolNode(tok.lexeme, tok.line)
        if kind == "ID":
            self.consume()
            return IdNode(tok.lexeme, tok.line)
        if kind == "(":
            self.consume()
            inner = self.expr()
            self.match(")")
            return inner

        raise ParseError(
            f"Syntax Error at line {tok.line}: expected an expression but found '{tok.lexeme}'",
            line=tok.line,
            column=tok.column,
        )


def parse(tokens: List[Union[Token, tuple]]) -> ProgramNode:
    """Convenience function to parse a token list into a ProgramNode AST."""
    parser = Parser(tokens)
    return parser.program()
