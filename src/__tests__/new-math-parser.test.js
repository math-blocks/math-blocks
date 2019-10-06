// @flow
import parser from "../new-math-parser.js";
import * as Parser from "../parser.js";
import * as Lexer from "../lexer.js";
import * as Editor from "../editor.js";

import type {Token} from "../new-math-parser.js";

describe("NewMathParser", () => {
    it("should handle equations", () => {
        const tokens = [
            Lexer.number("2"),
            Lexer.identifier("x"),
            Lexer.eq(),
            Lexer.number("10"),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "args": Array [
                Object {
                  "args": Array [
                    Object {
                      "type": "number",
                      "value": "2",
                    },
                    Object {
                      "name": "x",
                      "type": "identifier",
                    },
                  ],
                  "implicit": true,
                  "type": "mul",
                },
                Object {
                  "type": "number",
                  "value": "10",
                },
              ],
              "type": "eq",
            }
        `);
    });

    it("should parse binary expressions containing subtraction", () => {
        const tokens = [Lexer.number("1"), Lexer.minus(), Lexer.number("2")];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "args": Array [
                Object {
                  "type": "number",
                  "value": "1",
                },
                Object {
                  "arg": Object {
                    "type": "number",
                    "value": "2",
                  },
                  "subtraction": true,
                  "type": "neg",
                },
              ],
              "type": "add",
            }
        `);
    });

    it("should parse n-ary expressions containing subtraction", () => {
        const tokens = [
            Lexer.number("1"),
            Lexer.minus(),
            Lexer.number("2"),
            Lexer.minus(),
            Lexer.number("3"),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "args": Array [
                Object {
                  "args": Array [
                    Object {
                      "type": "number",
                      "value": "1",
                    },
                    Object {
                      "arg": Object {
                        "type": "number",
                        "value": "2",
                      },
                      "subtraction": true,
                      "type": "neg",
                    },
                  ],
                  "type": "add",
                },
                Object {
                  "arg": Object {
                    "type": "number",
                    "value": "3",
                  },
                  "subtraction": true,
                  "type": "neg",
                },
              ],
              "type": "add",
            }
        `);
    });

    it("should handle subtracting negative numbers", () => {
        const tokens = [
            Lexer.number("1"),
            Lexer.minus(),
            Lexer.minus(),
            Lexer.number("2"),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "args": Array [
                Object {
                  "type": "number",
                  "value": "1",
                },
                Object {
                  "arg": Object {
                    "arg": Object {
                      "type": "number",
                      "value": "2",
                    },
                    "subtraction": true,
                    "type": "neg",
                  },
                  "subtraction": true,
                  "type": "neg",
                },
              ],
              "type": "add",
            }
        `);
    });

    it("should parse expressions containing unary minus", () => {
        const tokens = [
            Lexer.number("1"),
            Lexer.plus(),
            Lexer.minus(),
            Lexer.number("2"),
            Lexer.plus(),
            Lexer.number("3"),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "args": Array [
                Object {
                  "type": "number",
                  "value": "1",
                },
                Object {
                  "arg": Object {
                    "type": "number",
                    "value": "2",
                  },
                  "subtraction": true,
                  "type": "neg",
                },
                Object {
                  "type": "number",
                  "value": "3",
                },
              ],
              "type": "add",
            }
        `);
    });

    it("should parse implicit multiplication", () => {
        const tokens: Array<Token> = [
            Lexer.identifier("a"),
            Lexer.identifier("b"),
            Lexer.identifier("c"),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "args": Array [
                Object {
                  "name": "a",
                  "type": "identifier",
                },
                Object {
                  "name": "b",
                  "type": "identifier",
                },
                Object {
                  "name": "c",
                  "type": "identifier",
                },
              ],
              "implicit": true,
              "type": "mul",
            }
        `);
    });

    it("should handle fractions", () => {
        const tokens: Array<Token> = [
            Lexer.number("1"),
            Lexer.plus(),
            Editor.frac(
                Editor.row([Lexer.number("1")]),
                Editor.row([Lexer.identifier("x")]),
            ),
        ];

        const parseTree = parser.parse(tokens);

        expect(parseTree).toMatchInlineSnapshot(`
            Object {
              "args": Array [
                Object {
                  "type": "number",
                  "value": "1",
                },
                Object {
                  "dividend": Object {
                    "type": "number",
                    "value": "1",
                  },
                  "divisor": Object {
                    "name": "x",
                    "type": "identifier",
                  },
                  "type": "div",
                },
              ],
              "type": "add",
            }
        `);
    });

    it("should handle exponents", () => {
        const tokens: Array<Token> = [
            Lexer.identifier("x"),
            Editor.subsup(undefined, Editor.row([Lexer.number("2")])),
        ];

        const parseTree = parser.parse(tokens);

        expect(parseTree).toMatchInlineSnapshot(`
            Object {
              "base": Object {
                "name": "x",
                "type": "identifier",
              },
              "exp": Object {
                "type": "number",
                "value": "2",
              },
              "type": "exp",
            }
        `);
    });

    it("should handle nested exponents", () => {
        const tokens: Array<Token> = [
            Lexer.identifier("x"),
            Editor.subsup(
                undefined,
                Editor.row([
                    Lexer.number("y"),
                    Editor.subsup(undefined, Editor.row([Lexer.number("2")])),
                ]),
            ),
        ];

        const parseTree = parser.parse(tokens);

        expect(parseTree).toMatchInlineSnapshot(`
            Object {
              "base": Object {
                "name": "x",
                "type": "identifier",
              },
              "exp": Object {
                "base": Object {
                  "type": "number",
                  "value": "y",
                },
                "exp": Object {
                  "type": "number",
                  "value": "2",
                },
                "type": "exp",
              },
              "type": "exp",
            }
        `);
    });

    it("should handle subscripts on identifiers", () => {
        const tokens: Array<Token> = [
            Lexer.identifier("a"),
            Editor.subsup(
                Editor.row([
                    Lexer.identifier("n"),
                    Lexer.plus(),
                    Lexer.number("1"),
                ]),
                undefined,
            ),
        ];

        const parseTree = parser.parse(tokens);

        expect(parseTree).toMatchInlineSnapshot(`
            Object {
              "name": "a",
              "subscript": Object {
                "args": Array [
                  Object {
                    "name": "n",
                    "type": "identifier",
                  },
                  Object {
                    "type": "number",
                    "value": "1",
                  },
                ],
                "type": "add",
              },
              "type": "identifier",
            }
        `);
    });

    it("should handle subscripts and superscripts identifiers", () => {
        const tokens: Array<Token> = [
            Lexer.identifier("a"),
            Editor.subsup(
                Editor.row([
                    Lexer.identifier("n"),
                    Lexer.plus(),
                    Lexer.number("1"),
                ]),
                Editor.row([Lexer.number("2")]),
            ),
        ];

        const parseTree = parser.parse(tokens);

        expect(parseTree).toMatchInlineSnapshot(`
            Object {
              "base": Object {
                "name": "a",
                "subscript": Object {
                  "args": Array [
                    Object {
                      "name": "n",
                      "type": "identifier",
                    },
                    Object {
                      "type": "number",
                      "value": "1",
                    },
                  ],
                  "type": "add",
                },
                "type": "identifier",
              },
              "exp": Object {
                "type": "number",
                "value": "2",
              },
              "type": "exp",
            }
        `);
    });

    it("should throw when a subscript is being used on a number", () => {
        const tokens: Array<Token> = [
            Lexer.number("2"),
            Editor.subsup(Editor.row([Lexer.number("0")]), undefined),
        ];

        expect(() => parser.parse(tokens)).toThrowErrorMatchingInlineSnapshot(
            `"subscripts aren't allowed on number nodes"`,
        );
    });
});
