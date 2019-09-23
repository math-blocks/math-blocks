// @flow
import parser from "../new-math-parser.js";
import * as Parser from "../parser.js";

import type {TokenType} from "../new-math-parser.js";

const number = (value: string) => ({type: "number", value});
const identifier = (value: string) => ({type: "identifier", value});
const plus = () => ({type: "plus", value: "+"});
const minus = () => ({type: "minus", value: "-"});

describe("NewMathParser", () => {
    it("should do something", () => {
        const tokens: Array<Parser.Token<TokenType>> = [
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
                  "args": Array [
                    Object {
                      "type": "number",
                      "value": "2",
                    },
                  ],
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
        const tokens: Array<Parser.Token<TokenType>> = [
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
              "type": "mul",
            }
        `);
    });
});
