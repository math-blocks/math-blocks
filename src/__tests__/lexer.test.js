// @flow
import * as Lexer from "../lexer";
import * as Editor from "../editor";

const {row, glyph, frac} = Editor;
const {identifier, number, plus, minus, eq} = Lexer;

function isRow(node: Editor.Node<Lexer.Token>): %checks {
    return node.type === "row";
}

function isAtom(node: Editor.Node<Lexer.Token>): %checks {
    return node.type === "atom";
}

function isFrac(node: Editor.Node<Lexer.Token>): %checks {
    return node.type === "frac";
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

            if (!isAtom(number)) {
                throw new Error("not an atom");
            }

            expect(number.value).toHaveProperty("value", "123");
        });

        it("should coalesce reals", () => {
            const glyphTree = row([glyph("1"), glyph("."), glyph("3")]);
            const tokenTree = Lexer.lex(glyphTree);

            if (!isRow(tokenTree)) {
                throw new Error("not a row");
            }

            expect(tokenTree.children).toHaveLength(1);

            const number = tokenTree.children[0];

            if (!isAtom(number)) {
                throw new Error("not an atom");
            }

            expect(number.value).toHaveProperty("value", "1.3");
        });

        it("should parse `1 + a`", () => {
            const glyphTree = row([glyph("1"), glyph("+"), glyph("a")]);
            const tokenTree = Lexer.lex(glyphTree);

            if (!isRow(tokenTree)) {
                throw new Error("not a row");
            }

            expect(tokenTree.children).toHaveLength(3);

            const [number, plus, identifier] = tokenTree.children;

            if (!isAtom(number)) {
                throw new Error("`number` is not an atom");
            }

            expect(number.value).toHaveProperty("value", "1");

            if (!isAtom(plus)) {
                throw new Error("`plus` is not an atom");
            }

            expect(plus.value).toHaveProperty("kind", "plus");

            if (!isAtom(identifier)) {
                throw new Error("`identifier` is not an atom");
            }

            expect(identifier.value).toHaveProperty("name", "a");
        });

        it("should parse `1 + 1/x`", () => {
            // TODO: create builder functions for token versions of
            // the tree and then compare the trees, minus the ids
            const glyphTree = row([
                glyph("1"),
                glyph("+"),
                frac(row([glyph("1")]), row([glyph("x")])),
            ]);
            const tokenTree = Lexer.lex(glyphTree);

            const expectedTokenTree = row([
                number("1"),
                plus(),
                frac(row([number("1")]), row([identifier("x")])),
            ]);

            if (!isRow(tokenTree)) {
                throw new Error("not a row");
            }

            if (!isAtom(tokenTree.children[0])) {
                throw new Error("not an atom");
            }

            if (!isAtom(tokenTree.children[1])) {
                throw new Error("not an atom");
            }

            if (!isFrac(tokenTree.children[2])) {
                throw new Error("not a frac");
            }
        });

        it("should parse multi character identifiers", () => {
            const glyphTree = row([glyph("s"), glyph("i"), glyph("n")]);

            const tokenTree = Lexer.lex(glyphTree);

            if (!isRow(tokenTree)) {
                throw new Error("not a row");
            }

            expect(tokenTree.children).toHaveLength(1);

            if (!isAtom(tokenTree.children[0])) {
                throw new Error("`identifier` is not an atom");
            }

            expect(tokenTree.children[0].value).toHaveProperty("name", "sin");
        });
    });
});
