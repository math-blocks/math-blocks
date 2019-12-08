// @flow
import {parse} from "../text-parser.js";

describe("TextParser", () => {
    it("parse addition", () => {
        const ast = parse("1 + 2");

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
        const ast = parse("1 + 2 + a");

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
        const ast = parse("a - b");

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

    it("parses minus in longer expression", () => {
        const ast = parse("a + b - c + d");

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
                  "args": Array [
                    Object {
                      "name": "c",
                      "type": "identifier",
                    },
                  ],
                  "subtraction": true,
                  "type": "neg",
                },
                Object {
                  "args": Array [
                    Object {
                      "name": "d",
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
        const ast = parse("1 + 2 * 3 - 4");

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
                    Object {
                      "type": "number",
                      "value": "3",
                    },
                  ],
                  "implicit": false,
                  "type": "mul",
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
        const ast = parse("-a");

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "args": Array [
                Object {
                  "name": "a",
                  "type": "identifier",
                },
              ],
              "subtraction": false,
              "type": "neg",
            }
        `);
    });

    it("parses unary minus with addition", () => {
        const ast = parse("a + -a");

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
                      "name": "a",
                      "type": "identifier",
                    },
                  ],
                  "subtraction": false,
                  "type": "neg",
                },
              ],
              "type": "add",
            }
        `);
    });

    it("parses multiple unary minuses", () => {
        const ast = parse("--a");

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
                  "subtraction": false,
                  "type": "neg",
                },
              ],
              "subtraction": false,
              "type": "neg",
            }
        `);
    });

    it("parses unary and binary minus", () => {
        const ast = parse("a - -b");

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
                      "subtraction": false,
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
        const ast = parse("ab");

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
        const ast = parse("abc");

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

    it("parses explicit multiplication", () => {
        const ast = parse("1 * 2 * 3");

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
                  "type": "number",
                  "value": "3",
                },
              ],
              "implicit": false,
              "type": "mul",
            }
        `);
    });

    it("parses explicit and implicit multiplication separately", () => {
        const ast = parse("ab * cd");

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "args": Array [
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
                },
                Object {
                  "args": Array [
                    Object {
                      "name": "c",
                      "type": "identifier",
                    },
                    Object {
                      "name": "d",
                      "type": "identifier",
                    },
                  ],
                  "implicit": true,
                  "type": "mul",
                },
              ],
              "implicit": false,
              "type": "mul",
            }
        `);
    });

    it("parses division with higher precedence than explicit multiplication", () => {
        const ast = parse("a/b * c/d");

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "args": Array [
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
                  "type": "div",
                },
                Object {
                  "args": Array [
                    Object {
                      "name": "c",
                      "type": "identifier",
                    },
                    Object {
                      "name": "d",
                      "type": "identifier",
                    },
                  ],
                  "type": "div",
                },
              ],
              "implicit": false,
              "type": "mul",
            }
        `);
    });

    it("parses division with lower precedence than implicit multiplication", () => {
        const ast = parse("ab/cd * uv/xy");

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "args": Array [
                Object {
                  "args": Array [
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
                    },
                    Object {
                      "args": Array [
                        Object {
                          "name": "c",
                          "type": "identifier",
                        },
                        Object {
                          "name": "d",
                          "type": "identifier",
                        },
                      ],
                      "implicit": true,
                      "type": "mul",
                    },
                  ],
                  "type": "div",
                },
                Object {
                  "args": Array [
                    Object {
                      "args": Array [
                        Object {
                          "name": "u",
                          "type": "identifier",
                        },
                        Object {
                          "name": "v",
                          "type": "identifier",
                        },
                      ],
                      "implicit": true,
                      "type": "mul",
                    },
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
                      "implicit": true,
                      "type": "mul",
                    },
                  ],
                  "type": "div",
                },
              ],
              "implicit": false,
              "type": "mul",
            }
        `);
    });

    it("parses parenthesis", () => {
        const ast = parse("(x + y)");

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
              "type": "add",
            }
        `);
    });

    it("throws if lparen is missing", () => {
        expect(() => {
            parse("x + y)");
        }).toThrowErrorMatchingInlineSnapshot(`"unmatched right paren"`);
    });

    it("throws if rparen is missing", () => {
        expect(() => {
            parse("(x + y");
        }).toThrowErrorMatchingInlineSnapshot(`"unmatched left paren"`);
    });

    it("parses parenthesis", () => {
        const ast = parse("a(x + y)");

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
                      "name": "x",
                      "type": "identifier",
                    },
                    Object {
                      "name": "y",
                      "type": "identifier",
                    },
                  ],
                  "type": "add",
                },
              ],
              "implicit": false,
              "type": "mul",
            }
        `);
    });

    it("parses adding parenthesis", () => {
        const ast = parse("(a + b) + (x + y)");

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "args": Array [
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
                  "type": "add",
                },
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
                  "type": "add",
                },
              ],
              "type": "add",
            }
        `);
    });

    it("parses implicit multiplication by parens", () => {
        const ast = parse("(a + b)(x + y)");

        expect(ast).toMatchInlineSnapshot(`
            Object {
              "args": Array [
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
                  "type": "add",
                },
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
                  "type": "add",
                },
              ],
              "implicit": false,
              "type": "mul",
            }
        `);
    });

    it("parses n-ary implicit multiplication by parens", () => {
        const ast = parse("(a)(b)(c)");

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
              "implicit": false,
              "type": "mul",
            }
        `);
    });

    it("parses division", () => {
        const ast = parse("x / y");

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
        const ast = parse("x / y / z");

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
        const ast = parse("x^2");

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
        const ast = parse("2^3^4");

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
        const ast = parse("y = x + 1");

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
        const ast = parse("x = y = z");

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
