import * as Lexer from "../editor-lexer";
import * as Editor from "../editor";
import * as Util from "../util";

import serializer from "../lexer-serializer";

expect.addSnapshotSerializer(serializer);

const {row, glyph, frac, subsup} = Editor;

describe("Lexer", () => {
    describe("lex", () => {
        it("should coalesce integers", () => {
            const glyphTree = row([glyph("1"), glyph("2"), glyph("3")]);
            const tokenTree = Lexer.lex(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`(row (num 123))`);
        });

        it("should coalesce reals", () => {
            const glyphTree = row([glyph("1"), glyph("."), glyph("3")]);
            const tokenTree = Lexer.lex(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`(row (num 1.3))`);
        });

        it("should parse `1 + a`", () => {
            const glyphTree = row([glyph("1"), glyph("+"), glyph("a")]);
            const tokenTree = Lexer.lex(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(
                `(row (num 1) plus (ident a))`,
            );
        });

        it("should parse `1 + 1/x`", () => {
            const glyphTree = row([
                glyph("1"),
                glyph("+"),
                frac([glyph("1")], [glyph("x")]),
            ]);
            const tokenTree = Lexer.lex(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(
                `(row (num 1) plus (frac (row (num 1)) (row (ident x))))`,
            );
        });

        it("should parse `e^x`", () => {
            const glyphTree = row([
                glyph("e"),
                subsup(undefined, [glyph("x")]),
            ]);
            const tokenTree = Lexer.lex(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(
                `(row (ident e) (frac _ (row (ident x))))`,
            );
        });

        it("should parse `a_n`", () => {
            const glyphTree = row([
                glyph("a"),
                subsup([glyph("n")], undefined),
            ]);
            const tokenTree = Lexer.lex(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(
                `(row (ident a) (frac (row (ident n)) _))`,
            );
        });

        it("should parse `a_n^2`", () => {
            const glyphTree = row([glyph("a"), Util.subsup("n", "2")]);
            const tokenTree = Lexer.lex(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(
                `(row (ident a) (frac (row (ident n)) (row (num 2))))`,
            );
        });

        it("should parse parens", () => {
            const glyphTree = Util.row("(1 + 2)");
            const tokenTree = Lexer.lex(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(
                `(row lparens (num 1) plus (num 2) rparens)`,
            );
        });

        it("should parse a square root", () => {
            const glyphTree = row([Util.sqrt("123")]);
            const tokenTree = Lexer.lex(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(
                `(row (frac (row (num 123)) _))`,
            );
        });

        it("should parse a nth root", () => {
            const glyphTree = row([Util.root("123", "n")]);
            const tokenTree = Lexer.lex(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(
                `(row (frac (row (num 123)) (row (ident n))))`,
            );
        });

        it("should parse multi character identifiers", () => {
            const glyphTree = row([glyph("s"), glyph("i"), glyph("n")]);
            const tokenTree = Lexer.lex(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`(row (ident sin))`);
        });

        it("should parse a minus sign", () => {
            const glyphTree = row([glyph("1"), glyph("\u2212"), glyph("2")]);
            const tokenTree = Lexer.lex(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(
                `(row (num 1) minus (num 2))`,
            );
        });

        it("should parse an equal sign", () => {
            const glyphTree = row([glyph("1"), glyph("="), glyph("2")]);
            const tokenTree = Lexer.lex(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`(row (num 1) eq (num 2))`);
        });

        it("should parse an ellipsis", () => {
            const glyphTree = Util.row("1+...+n");
            const tokenTree = Lexer.lex(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(
                `(row (num 1) plus ellipsis plus (ident n))`,
            );
        });
    });
});
