"""
Lexer (Scanner) for WRH-Lang.
Tokenizes source code into Token instances with exact line and column tracking,
distinguishes integer division '//' from comments, and raises LexicalError on invalid characters.
"""

import re
from typing import List

from .tokens import (
    KEYWORDS,
    TOKEN_PATTERN,
    Token,
    LexicalError,
)


def tokenize(input_string: str) -> List[Token]:
    """
    Tokenizes WRH source code into a sequence of Token objects.
    Tracks exact line and column coordinates for every token.
    Appends an EOF token at the end.
    Raises LexicalError on unknown characters.
    """
    tokens: List[Token] = []
    line = 1
    line_start_pos = 0

    for m in re.finditer(TOKEN_PATTERN, input_string):
        kind = m.lastgroup
        text = m.group()
        start = m.start()
        col = start - line_start_pos + 1

        if kind == "NL":
            line += 1
            line_start_pos = m.end()
        elif kind == "SKIP":
            continue
        elif kind == "BAD":
            raise LexicalError(
                f"Lexical Error at line {line}: unknown character '{text}'",
                line=line,
                column=col,
            )
        elif kind == "ID" and text in KEYWORDS:
            tokens.append(Token(KEYWORDS[text], text, line, col))
        elif kind == "OP":
            tokens.append(Token(text, text, line, col))
        else:
            tokens.append(Token(kind, text, line, col))

    eof_col = len(input_string) - line_start_pos + 1
    tokens.append(Token("EOF", "end of file", line, eof_col))
    return tokens
