// @flow
import * as Lexer from "../lexer";
import * as Editor from "../editor";

const {row, glyph} = Editor;

function isRow(node: Editor.Node<Lexer.Token>): %checks {
    return node.type === "row";
}

function isNumber(node: Editor.Node<Lexer.Token>): %checks {
    return node.type === "number";
}

describe("Lexer", () => {
    describe("lex", () => {
        it("should coalesce integers", () => {
            const glyphTree = row([glyph("1"), glyph("2"), glyph("3")]);
            const tokenTree = Lexer.lex(glyphTree);

            if (!isRow(tokenTree)) {
                throw new Error("not a row");
            }

            expect(tokenTree.children).toHaveLength(1);

            const number = tokenTree.children[0];

            if (!isNumber(number)) {
                throw new Error("not a number");
            }

            expect(number.value).toBe("123");
        });

        it("should coalesce reals", () => {
            const glyphTree = row([glyph("1"), glyph("."), glyph("3")]);
            const tokenTree = Lexer.lex(glyphTree);

            if (!isRow(tokenTree)) {
                throw new Error("not a row");
            }

            expect(tokenTree.children).toHaveLength(1);

            const number = tokenTree.children[0];

            if (!isNumber(number)) {
                throw new Error("not a number");
            }

            expect(number.value).toBe("1.3");
        });

        it("should throw with more than one decimal", () => {
            expect(() => {
                const glyphTree = row([glyph("1"), glyph("."), glyph(".")]);
                const tokenTree = Lexer.lex(glyphTree);
            }).toThrowError();
        });
    });
});
