// @flow
import parser from "../new-math-parser.js";
import * as Parser from "../parser.js";

import type {Token} from "../new-math-parser.js";

const number = (value: string) => ({type: "number", value});
const identifier = (value: string) => ({type: "identifier", value});
const plus = () => ({type: "plus", value: "+"});
const minus = () => ({type: "minus", value: "-"});

describe("NewMathParser", () => {
    it("should parse binary expressions containing subtraction", () => {
        const tokens = [number("1"), minus(), number("2")];

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
            number("1"),
            minus(),
            number("2"),
            minus(),
            number("3"),
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
        const tokens = [number("1"), minus(), minus(), number("2")];

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
            number("1"),
            plus(),
            minus(),
            number("2"),
            plus(),
            number("3"),
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
            identifier("a"),
            identifier("b"),
            identifier("c"),
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
