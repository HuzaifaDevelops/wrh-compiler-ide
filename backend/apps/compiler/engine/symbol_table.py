"""
Symbol Table data structure for WRH-Lang.
Represents a flat symbol table mapping identifier names to type and declaration line.
"""

from typing import Any, Dict, Optional


class SymbolTable(dict):
    """
    Flat symbol table storing identifier declarations.
    Mapping format: {name: {"type": type_str, "line": line_number}}
    Subclasses dict for full compatibility with DRF serialization and dictionary lookups.
    """

    def insert(self, name: str, var_type: str, line: int) -> None:
        """Insert or update a variable entry in the symbol table."""
        self[name] = {"type": var_type, "line": line}

    def lookup(self, name: str) -> Optional[Dict[str, Any]]:
        """Look up variable information by name. Returns dict or None."""
        return self.get(name)

    def to_dict(self) -> Dict[str, Dict[str, Any]]:
        """Return a clean dictionary representation."""
        return dict(self)
