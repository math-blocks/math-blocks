// @flow
import parser from "../text-parser.js";
import {lex} from "../text-lexer.js";

describe("TextParser", () => {
    it("parse addition", () => {
        const tokens = lex("1 + 2");
        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "args": Array [
                Object {
                  "type": "number",
                  "value": "1",
                },
                Object {
                  "type": "number",
                  "value": "2",
                },
              ],
              "type": "add",
            }
        `);
    });

    it("parse n-ary addition", () => {
        const tokens = lex("1 + 2 + a");
        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "args": Array [
                Object {
                  "type": "number",
                  "value": "1",
                },
                Object {
                  "type": "number",
                  "value": "2",
                },
                Object {
                  "name": "a",
                  "type": "identifier",
                },
              ],
              "type": "add",
            }
        `);
    });

    it("parses minus", () => {
        const tokens = lex("a - b");
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
                  ],
                  "subtraction": true,
                  "type": "neg",
                },
              ],
              "type": "add",
            }
        `);
    });

    it("parses simple order of operations", () => {
        const tokens = lex("1 + 2 * 3 - 4");
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
                        Object {
                          "type": "number",
                          "value": "3",
                        },
                      ],
                      "implicit": true,
                      "type": "mul",
                    },
                  ],
                  "type": "add",
                },
                Object {
                  "args": Array [
                    Object {
                      "type": "number",
                      "value": "4",
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

    it("parses unary minus", () => {
        const tokens = lex("-a");
        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "args": Array [
                Object {
                  "name": "a",
                  "type": "identifier",
                },
              ],
              "subtraction": true,
              "type": "neg",
            }
        `);
    });

    it("parses multiple unary minuses", () => {
        const tokens = lex("--a");
        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "args": Array [
                Object {
                  "args": Array [
                    Object {
                      "name": "a",
                      "type": "identifier",
                    },
                  ],
                  "subtraction": true,
                  "type": "neg",
                },
              ],
              "subtraction": true,
              "type": "neg",
            }
        `);
    });

    it("parses unary and binary minus", () => {
        const tokens = lex("a - -b");
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
                      "args": Array [
                        Object {
                          "name": "b",
                          "type": "identifier",
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

    it("parses implicit multiplication", () => {
        const tokens = lex("ab");
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
              ],
              "implicit": true,
              "type": "mul",
            }
        `);
    });

    it("parses n-ary implicit multiplication", () => {
        const tokens = lex("abc");
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

    it.skip("parses implicit multiplication by parens", () => {
        const tokens = lex("(a + b)(x + y)");
        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "name": "a",
              "type": "identifier",
            }
        `);
    });

    it("parses division", () => {
        const tokens = lex("x / y");
        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "args": Array [
                Object {
                  "name": "x",
                  "type": "identifier",
                },
                Object {
                  "name": "y",
                  "type": "identifier",
                },
              ],
              "type": "div",
            }
        `);
    });

    it("parses nested division", () => {
        const tokens = lex("x / y / z");
        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "args": Array [
                Object {
                  "args": Array [
                    Object {
                      "name": "x",
                      "type": "identifier",
                    },
                    Object {
                      "name": "y",
                      "type": "identifier",
                    },
                  ],
                  "type": "div",
                },
                Object {
                  "name": "z",
                  "type": "identifier",
                },
              ],
              "type": "div",
            }
        `);
    });

    it("parses exponents", () => {
        const tokens = lex("x^2");
        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
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

    it("parses nested exponents", () => {
        const tokens = lex("2^3^4");
        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "args": Array [
                Object {
                  "type": "number",
                  "value": "2",
                },
                Object {
                  "args": Array [
                    Object {
                      "type": "number",
                      "value": "3",
                    },
                    Object {
                      "type": "number",
                      "value": "4",
                    },
                  ],
                  "type": "exp",
                },
              ],
              "type": "exp",
            }
        `);
    });

    it("parses equations", () => {
        const tokens = lex("y = x + 1");
        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "args": Array [
                Object {
                  "name": "y",
                  "type": "identifier",
                },
                Object {
                  "args": Array [
                    Object {
                      "name": "x",
                      "type": "identifier",
                    },
                    Object {
                      "type": "number",
                      "value": "1",
                    },
                  ],
                  "type": "add",
                },
              ],
              "type": "eq",
            }
        `);
    });

    it("parses equations", () => {
        const tokens = lex("x = y = z");
        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "args": Array [
                Object {
                  "name": "x",
                  "type": "identifier",
                },
                Object {
                  "name": "y",
                  "type": "identifier",
                },
                Object {
                  "name": "z",
                  "type": "identifier",
                },
              ],
              "type": "eq",
            }
        `);
    });
});
