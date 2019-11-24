// @flow
import parser from "../math-parser.js";
import * as Parser from "../parser.js";
import * as Lexer from "../lexer.js";
import * as Editor from "../editor.js";

import type {Token} from "../math-parser.js";

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
                  "args": Array [
                    Object {
                      "type": "number",
                      "value": "2",
                    },
                  ],
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
                      "args": Array [
                        Object {
                          "type": "number",
                          "value": "2",
                        },
                      ],
                      "subtraction": true,
                      "type": "neg",
                    },
                  ],
                  "type": "add",
                },
                Object {
                  "args": Array [
                    Object {
                      "type": "number",
                      "value": "3",
                    },
                  ],
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
                  "args": Array [
                    Object {
                      "args": Array [
                        Object {
                          "type": "number",
                          "value": "2",
                        },
                      ],
                      "subtraction": true,
                      "type": "neg",
                    },
                  ],
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
                  "args": Array [
                    Object {
                      "type": "number",
                      "value": "2",
                    },
                  ],
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
            Editor.frac([Lexer.number("1")], [Lexer.identifier("x")]),
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
                  "args": Array [
                    Object {
                      "type": "number",
                      "value": "1",
                    },
                    Object {
                      "name": "x",
                      "type": "identifier",
                    },
                  ],
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
            Editor.subsup(undefined, [Lexer.number("2")]),
        ];

        const parseTree = parser.parse(tokens);

        expect(parseTree).toMatchInlineSnapshot(`
            Object {
              "args": Array [
                Object {
                  "name": "x",
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

    it("should handle nested exponents", () => {
        const tokens: Array<Token> = [
            Lexer.identifier("x"),
            Editor.subsup(undefined, [
                Lexer.number("y"),
                Editor.subsup(undefined, [Lexer.number("2")]),
            ]),
        ];

        const parseTree = parser.parse(tokens);

        expect(parseTree).toMatchInlineSnapshot(`
            Object {
              "args": Array [
                Object {
                  "name": "x",
                  "type": "identifier",
                },
                Object {
                  "args": Array [
                    Object {
                      "type": "number",
                      "value": "y",
                    },
                    Object {
                      "type": "number",
                      "value": "2",
                    },
                  ],
                  "type": "exp",
                },
              ],
              "type": "exp",
            }
        `);
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
            Lexer.number("a"),
            Lexer.plus(),
            Editor.parens([Lexer.number("b"), Lexer.plus(), Lexer.number("c")]),
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
                      "value": "c",
                    },
                  ],
                  "type": "add",
                },
              ],
              "type": "add",
            }
        `);
    });

    it("should handle implicit multiplication with parens", () => {
        const tokens = [
            Lexer.number("a"),
            Editor.parens([Lexer.number("b"), Lexer.plus(), Lexer.number("c")]),
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
                      "value": "c",
                    },
                  ],
                  "type": "add",
                },
              ],
              "implicit": true,
              "type": "mul",
            }
        `);
    });

    it("should handle implicit multiplication with multiple parens", () => {
        const tokens = [
            Lexer.number("a"),
            Editor.parens([Lexer.number("b"), Lexer.plus(), Lexer.number("c")]),
            Editor.parens([Lexer.number("d"), Lexer.plus(), Lexer.number("e")]),
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
                      "value": "c",
                    },
                  ],
                  "type": "add",
                },
                Object {
                  "args": Array [
                    Object {
                      "type": "number",
                      "value": "d",
                    },
                    Object {
                      "type": "number",
                      "value": "e",
                    },
                  ],
                  "type": "add",
                },
              ],
              "implicit": true,
              "type": "mul",
            }
        `);
    });

    it("should handle implicit multiplication with parens at the start", () => {
        const tokens = [
            Editor.parens([Lexer.number("b"), Lexer.plus(), Lexer.number("c")]),
            Editor.parens([Lexer.number("d"), Lexer.plus(), Lexer.number("e")]),
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
                      "value": "c",
                    },
                  ],
                  "type": "add",
                },
                Object {
                  "args": Array [
                    Object {
                      "type": "number",
                      "value": "d",
                    },
                    Object {
                      "type": "number",
                      "value": "e",
                    },
                  ],
                  "type": "add",
                },
              ],
              "implicit": true,
              "type": "mul",
            }
        `);
    });

    it("should handle implicit multiplication with roots", () => {
        const tokens = [
            Lexer.number("a"),
            Editor.root([Lexer.number("b")], [Lexer.number("2")]),
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
});
