import * as Editor from "@math-blocks/editor";

import * as Lexer from "../editor-lexer";
import {serializer} from "../test-util";

expect.addSnapshotSerializer(serializer);

const {row, glyph, frac, subsup} = Editor;

describe("Lexer", () => {
    describe("lex", () => {
        it("should coalesce integers", () => {
            const glyphTree = row([glyph("1"), glyph("2"), glyph("3")]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (num@[]:0:3 123))
            `);
        });

        it("should coalesce reals", () => {
            const glyphTree = row([glyph("1"), glyph("."), glyph("3")]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (num@[]:0:3 1.3))
            `);
        });

        it("should parse `1 + a`", () => {
            const glyphTree = row([glyph("1"), glyph("+"), glyph("a")]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (num@[]:0:1 1) 
                  plus@[]:1:2 
                  (ident@[]:2:3 a))
            `);
        });

        it("should parse `1 + 1/x`", () => {
            const glyphTree = row([
                glyph("1"),
                glyph("+"),
                frac([glyph("1")], [glyph("x")]),
            ]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (num@[]:0:1 1) 
                  plus@[]:1:2 
                  (frac@[]:2:3 atom (row 
                    (num@[2,0]:0:1 1)) (row 
                    (ident@[2,1]:0:1 x))))
            `);
        });

        it("should parse `e^x`", () => {
            const glyphTree = row([
                glyph("e"),
                subsup(undefined, [glyph("x")]),
            ]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (ident@[]:0:1 e) 
                  (subsup@[]:1:2 atom _ (row 
                    (ident@[1,1]:0:1 x))))
            `);
        });

        it("should parse `a_n`", () => {
            const glyphTree = row([
                glyph("a"),
                subsup([glyph("n")], undefined),
            ]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (ident@[]:0:1 a) 
                  (subsup@[]:1:2 atom (row 
                    (ident@[1,0]:0:1 n)) _))
            `);
        });

        it("should parse `a_n^2`", () => {
            const glyphTree = row([glyph("a"), Editor.Util.subsup("n", "2")]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (ident@[]:0:1 a) 
                  (subsup@[]:1:2 atom (row 
                    (ident@[1,0]:0:1 n)) (row 
                    (num@[1,1]:0:1 2))))
            `);
        });

        it("should parse parens", () => {
            const glyphTree = Editor.Util.row("(1 + 2)");
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  lparens@[]:0:1 
                  (num@[]:1:2 1) 
                  plus@[]:3:4 
                  (num@[]:5:6 2) 
                  rparens@[]:6:7)
            `);
        });

        it("should parse a square root", () => {
            const glyphTree = row([Editor.Util.sqrt("123")]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (root@[]:0:1 atom (row 
                    (num@[0,0]:0:3 123)) _))
            `);
        });

        it("should parse a nth root", () => {
            const glyphTree = row([Editor.Util.root("123", "n")]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (root@[]:0:1 atom (row 
                    (num@[0,0]:0:3 123)) (row 
                    (ident@[0,1]:0:1 n))))
            `);
        });

        it("should parse multi character identifiers", () => {
            const glyphTree = row([glyph("s"), glyph("i"), glyph("n")]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (ident@[]:0:3 sin))
            `);
        });

        it("should parse a minus sign", () => {
            const glyphTree = row([glyph("1"), glyph("\u2212"), glyph("2")]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (num@[]:0:1 1) 
                  minus@[]:1:2 
                  (num@[]:2:3 2))
            `);
        });

        it("should parse an equal sign", () => {
            const glyphTree = row([glyph("1"), glyph("="), glyph("2")]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (num@[]:0:1 1) 
                  eq@[]:1:2 
                  (num@[]:2:3 2))
            `);
        });

        it("should parse an ellipsis", () => {
            const glyphTree = Editor.Util.row("1+...+n");
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (num@[]:0:1 1) 
                  plus@[]:1:2 
                  ellipsis@[]:2:5 
                  plus@[]:5:6 
                  (ident@[]:6:7 n))
            `);
        });
    });
});
