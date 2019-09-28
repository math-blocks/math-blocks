// @flow
import parser from "../new-math-parser.js";
import * as Parser from "../parser.js";
import * as Lexer from "../lexer.js";

import type {Token} from "../new-math-parser.js";

describe("NewMathParser", () => {
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

    it.only("should parse expressions containing unary minus", () => {
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
});
