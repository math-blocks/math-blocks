import parser from "../editor-parser";
import {parse} from "../../text/text-parser";
import * as Lexer from "../editor-lexer";
import * as Editor from "../editor";

import {Token} from "../editor-parser";

describe("NewMathParser", () => {
    it("should handle equations", () => {
        const tokens = [
            Lexer.number("2"),
            Lexer.identifier("x"),
            Lexer.eq(),
            Lexer.number("10"),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toEqual(parse("2x = 10"));
    });

    it("should parse binary expressions containing subtraction", () => {
        const tokens = [Lexer.number("1"), Lexer.minus(), Lexer.number("2")];

        const ast = parser.parse(tokens);

        expect(ast).toEqual(parse("1 - 2"));
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

        expect(ast).toEqual(parse("1 - 2 - 3"));
    });

    it("should handle subtracting negative numbers", () => {
        const tokens = [
            Lexer.number("1"),
            Lexer.minus(),
            Lexer.minus(),
            Lexer.number("2"),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toEqual(parse("1 - -2"));
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

        expect(ast).toEqual(parse("1 + -2 + 3"));
    });

    it("should parse implicit multiplication", () => {
        const tokens: Array<Token> = [
            Lexer.identifier("a"),
            Lexer.identifier("b"),
            Lexer.identifier("c"),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toEqual(parse("abc"));
    });

    it("should handle fractions", () => {
        const tokens: Array<Token> = [
            Lexer.number("1"),
            Lexer.plus(),
            Editor.frac([Lexer.number("1")], [Lexer.identifier("x")]),
        ];

        const parseTree = parser.parse(tokens);

        expect(parseTree).toEqual(parse("1 + 1/x"));
    });

    it("should handle exponents", () => {
        const tokens: Array<Token> = [
            Lexer.identifier("x"),
            Editor.subsup(undefined, [Lexer.number("2")]),
        ];

        const parseTree = parser.parse(tokens);

        expect(parseTree).toEqual(parse("x^2"));
    });

    it("should handle nested exponents", () => {
        const tokens: Array<Token> = [
            Lexer.identifier("x"),
            Editor.subsup(undefined, [
                Lexer.identifier("y"),
                Editor.subsup(undefined, [Lexer.number("2")]),
            ]),
        ];

        const parseTree = parser.parse(tokens);

        expect(parseTree).toEqual(parse("x^y^2"));
    });

    it("should handle subscripts on identifiers", () => {
        const tokens: Array<Token> = [
            Lexer.identifier("a"),
            Editor.subsup(
                [Lexer.identifier("n"), Lexer.plus(), Lexer.number("1")],
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
                [Lexer.identifier("n"), Lexer.plus(), Lexer.number("1")],
                [Lexer.number("2")],
            ),
        ];

        const parseTree = parser.parse(tokens);

        expect(parseTree).toMatchInlineSnapshot(`
            Object {
              "args": Array [
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
                },
                Object {
                  "type": "number",
                  "value": "2",
                },
              ],
              "type": "exp",
            }
        `);
    });

    it("should throw when a subscript is being used on a number", () => {
        const tokens: Array<Token> = [
            Lexer.number("2"),
            Editor.subsup([Lexer.number("0")], undefined),
        ];

        expect(() => parser.parse(tokens)).toThrowErrorMatchingInlineSnapshot(
            `"subscripts are only allowed on identifiers"`,
        );
    });

    it("should handle an ellispis", () => {
        const tokens = [
            Lexer.number("1"),
            Lexer.plus(),
            Lexer.ellipsis(),
            Lexer.plus(),
            Lexer.identifier("n"),
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
                  "type": "ellipsis",
                },
                Object {
                  "name": "n",
                  "type": "identifier",
                },
              ],
              "type": "add",
            }
        `);
    });

    it("should handle adding with parens", () => {
        const tokens = [
            Lexer.identifier("a"),
            Lexer.plus(),
            Editor.parens([
                Lexer.identifier("b"),
                Lexer.plus(),
                Lexer.identifier("c"),
            ]),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toEqual(parse("a + (b + c)"));
    });

    it("should handle implicit multiplication with parens", () => {
        const tokens = [
            Lexer.identifier("a"),
            Editor.parens([
                Lexer.identifier("b"),
                Lexer.plus(),
                Lexer.identifier("c"),
            ]),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toEqual(parse("a(b + c)"));
    });

    it("should handle implicit multiplication with multiple parens", () => {
        const tokens = [
            Lexer.identifier("a"),
            Editor.parens([
                Lexer.identifier("b"),
                Lexer.plus(),
                Lexer.identifier("c"),
            ]),
            Editor.parens([
                Lexer.identifier("d"),
                Lexer.plus(),
                Lexer.identifier("e"),
            ]),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toEqual(parse("a(b + c)(d + e)"));
    });

    it("should handle implicit multiplication with parens at the start", () => {
        const tokens = [
            Editor.parens([
                Lexer.identifier("b"),
                Lexer.plus(),
                Lexer.identifier("c"),
            ]),
            Editor.parens([
                Lexer.identifier("d"),
                Lexer.plus(),
                Lexer.identifier("e"),
            ]),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toEqual(parse("(b + c)(d + e)"));
    });

    it("should handle implicit multiplication with roots", () => {
        const tokens = [
            Lexer.identifier("a"),
            Editor.root([Lexer.identifier("b")], [Lexer.number("2")]),
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
                  "args": Array [
                    Object {
                      "name": "b",
                      "type": "identifier",
                    },
                    Object {
                      "type": "number",
                      "value": "2",
                    },
                  ],
                  "type": "root",
                },
              ],
              "implicit": true,
              "type": "mul",
            }
        `);
    });

    it("should handle implicit multiplication with multiple roots", () => {
        const tokens = [
            Lexer.number("a"),
            Editor.root([Lexer.number("b")], [Lexer.number("2")]),
            Editor.root([Lexer.number("c")], [Lexer.number("3")]),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "args": Array [
                Object {
                  "type": "number",
                  "value": "a",
                },
                Object {
                  "args": Array [
                    Object {
                      "type": "number",
                      "value": "b",
                    },
                    Object {
                      "type": "number",
                      "value": "2",
                    },
                  ],
                  "type": "root",
                },
                Object {
                  "args": Array [
                    Object {
                      "type": "number",
                      "value": "c",
                    },
                    Object {
                      "type": "number",
                      "value": "3",
                    },
                  ],
                  "type": "root",
                },
              ],
              "implicit": true,
              "type": "mul",
            }
        `);
    });

    it("should handle implicit multiplication starting with a root", () => {
        const tokens = [
            Editor.root([Lexer.number("b")], [Lexer.number("2")]),
            Editor.root([Lexer.number("c")], [Lexer.number("3")]),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "args": Array [
                Object {
                  "args": Array [
                    Object {
                      "type": "number",
                      "value": "b",
                    },
                    Object {
                      "type": "number",
                      "value": "2",
                    },
                  ],
                  "type": "root",
                },
                Object {
                  "args": Array [
                    Object {
                      "type": "number",
                      "value": "c",
                    },
                    Object {
                      "type": "number",
                      "value": "3",
                    },
                  ],
                  "type": "root",
                },
              ],
              "implicit": true,
              "type": "mul",
            }
        `);
    });

    it("should handle (√2)a", () => {
        const tokens = [
            Editor.root([Lexer.number("2")], [Lexer.number("2")]),
            Lexer.identifier("a"),
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
                      "type": "number",
                      "value": "2",
                    },
                  ],
                  "type": "root",
                },
                Object {
                  "name": "a",
                  "type": "identifier",
                },
              ],
              "implicit": true,
              "type": "mul",
            }
        `);
    });

    it("should handle 5√2", () => {
        const tokens = [
            Lexer.number("5"),
            Editor.root([Lexer.number("2")], [Lexer.number("2")]),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "args": Array [
                Object {
                  "type": "number",
                  "value": "5",
                },
                Object {
                  "args": Array [
                    Object {
                      "type": "number",
                      "value": "2",
                    },
                    Object {
                      "type": "number",
                      "value": "2",
                    },
                  ],
                  "type": "root",
                },
              ],
              "implicit": true,
              "type": "mul",
            }
        `);
    });

    it("should handle √2√3", () => {
        const tokens = [
            Editor.root([Lexer.number("2")], [Lexer.number("2")]),
            Editor.root([Lexer.number("2")], [Lexer.number("2")]),
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
                      "type": "number",
                      "value": "2",
                    },
                  ],
                  "type": "root",
                },
                Object {
                  "args": Array [
                    Object {
                      "type": "number",
                      "value": "2",
                    },
                    Object {
                      "type": "number",
                      "value": "2",
                    },
                  ],
                  "type": "root",
                },
              ],
              "implicit": true,
              "type": "mul",
            }
        `);
    });
});
