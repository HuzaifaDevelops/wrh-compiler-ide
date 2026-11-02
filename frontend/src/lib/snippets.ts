export interface CodeSnippet {
  id: string;
  title: string;
  description: string;
  code: string;
}

export const STARTER_SNIPPETS: CodeSnippet[] = [
  {
    id: "valid_demo",
    title: "1. Valid Sample (Labs)",
    description: "Standard course valid code sample testing variables, conditionals, loops, and flex output.",
    code: `digit a := 10;
verify flag := yes;
textbody msg := "Compiler running";

when flag ?= yes {
    flex(a);
    flex(msg);
} otherwise {
    flex("Flag is false");
}

digit i := 0;
until i ?= 3 {
    i := i +++ 1;
    flex(i);
}
`
  },
  {
    id: "arithmetic_ops",
    title: "2. Custom Operators",
    description: "Demonstration of WRH custom operators (+++, ---, //, **).",
    code: `digit x := 20;
digit y := 5;
digit sum := x +++ y;
digit diff := x --- y;
digit div := x // y;
digit exp := 2 ** 3;
flex(sum);
flex(diff);
flex(div);
flex(exp);
`
  },
  {
    id: "relational_logic",
    title: "3. Conditionals & Comparison",
    description: "Testing equality (?=), relational shifts (>> for <, << for >), and negation (~).",
    code: `digit a := 15;
digit b := 25;
verify is_less := a >> b;
verify is_equal := a ?= b;
when is_less ?= yes {
    flex("a is less than b");
}
`
  },
  {
    id: "syntax_error_demo",
    title: "4. Syntax Error Demo",
    description: "Missing semicolon error to demonstrate parser error diagnostics.",
    code: `digit a := 10
flex(a);
`
  },
  {
    id: "semantic_error_demo",
    title: "5. Semantic Error Demo",
    description: "Undeclared variable and type mismatch diagnostics.",
    code: `digit a := 10;
a := "text string";
flex(undeclared_var);
`
  }
];
