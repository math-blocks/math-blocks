// @flow
import {parse} from "../parser.js";
import * as Editor from "../editor.js";
import * as Lexer from "../lexer.js";

describe("Parser", () => {
    describe("parse", () => {
        it("should parse binary addition", () => {
            const lexTree: Editor.Node<Lexer.Token> = Editor.row([
                Lexer.number("1"),
                Lexer.symbol("+"),
                Lexer.number("2"),
            ]);

            const parseTree = parse(lexTree);

            expect(parseTree.kind).toEqual("add");

            if (parseTree.kind !== "add") {
                throw new Error("not an add");
            }

            expect(parseTree.args[0]).toEqual({kind: "number", value: "1"});
            expect(parseTree.args[1]).toEqual({kind: "number", value: "2"});
        });

        it("should parse ternary addition", () => {
            const lexTree: Editor.Node<Lexer.Token> = Editor.row([
                Lexer.number("1"),
                Lexer.symbol("+"),
                Lexer.number("2"),
                Lexer.symbol("+"),
                Lexer.number("3"),
            ]);

            const parseTree = parse(lexTree);

            expect(parseTree).toMatchInlineSnapshot(`
                Object {
                  "args": Array [
                    Object {
                      "kind": "number",
                      "value": "1",
                    },
                    Object {
                      "kind": "number",
                      "value": "2",
                    },
                    Object {
                      "kind": "number",
                      "value": "3",
                    },
                  ],
                  "kind": "add",
                }
            `);
        });

        it("should parse subtraction as adding the additive inverse", () => {
            const lexTree: Editor.Node<Lexer.Token> = Editor.row([
                Lexer.number("1"),
                Lexer.symbol("\u2212"),
                Lexer.number("2"),
            ]);

            const parseTree = parse(lexTree);

            expect(parseTree).toMatchInlineSnapshot(`
                Object {
                  "args": Array [
                    Object {
                      "kind": "number",
                      "value": "1",
                    },
                    Object {
                      "arg": Object {
                        "kind": "number",
                        "value": "2",
                      },
                      "kind": "neg",
                      "subtraction": true,
                    },
                  ],
                  "kind": "add",
                }
            `);
        });

        it("should parse subtraction before the end of a long expression", () => {
            const lexTree: Editor.Node<Lexer.Token> = Editor.row([
                Lexer.number("1"),
                Lexer.symbol("\u2212"),
                Lexer.number("2"),
                Lexer.symbol("+"),
                Lexer.number("3"),
            ]);

            const parseTree = parse(lexTree);

            expect(parseTree).toMatchInlineSnapshot(`
                Object {
                  "args": Array [
                    Object {
                      "kind": "number",
                      "value": "1",
                    },
                    Object {
                      "arg": Object {
                        "kind": "number",
                        "value": "2",
                      },
                      "kind": "neg",
                      "subtraction": true,
                    },
                    Object {
                      "kind": "number",
                      "value": "3",
                    },
                  ],
                  "kind": "add",
                }
            `);
        });
    });
});
