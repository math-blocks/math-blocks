// @flow
import {parse} from "../math-parser.js";
import * as Editor from "../editor.js";
import * as Lexer from "../lexer.js";

describe("Parser", () => {
    describe("parse", () => {
        it("should parse binary addition", () => {
            const lexTree: Editor.Node<Lexer.Token> = Editor.row([
                Lexer.number("1"),
                Lexer.plus(),
                Lexer.number("2"),
            ]);

            const parseTree = parse(lexTree);

            expect(parseTree.type).toEqual("add");

            if (parseTree.type !== "add") {
                throw new Error("not an add");
            }

            expect(parseTree.args[0]).toEqual({type: "number", value: "1"});
            expect(parseTree.args[1]).toEqual({type: "number", value: "2"});
        });

        it("should parse ternary addition", () => {
            const lexTree: Editor.Node<Lexer.Token> = Editor.row([
                Lexer.number("1"),
                Lexer.plus(),
                Lexer.number("2"),
                Lexer.plus(),
                Lexer.number("3"),
            ]);

            const parseTree = parse(lexTree);

            expect(parseTree).toMatchInlineSnapshot(`
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
                  "type": "add",
                }
            `);
        });

        it("should parse subtraction as adding the additive inverse", () => {
            const lexTree: Editor.Node<Lexer.Token> = Editor.row([
                Lexer.number("1"),
                Lexer.minus(),
                Lexer.number("2"),
            ]);

            const parseTree = parse(lexTree);

            expect(parseTree).toMatchInlineSnapshot(`
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

        it("should parse subtraction before the end of a long expression", () => {
            const lexTree: Editor.Node<Lexer.Token> = Editor.row([
                Lexer.number("1"),
                Lexer.minus(),
                Lexer.number("2"),
                Lexer.plus(),
                Lexer.number("3"),
            ]);

            const parseTree = parse(lexTree);

            expect(parseTree).toMatchInlineSnapshot(`
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
    });
});
