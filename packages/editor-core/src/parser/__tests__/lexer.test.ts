import {row, char, frac, subsup, limits} from "../../char/builders";
import * as util from "../../char/util";

import * as Lexer from "../lexer";
import {serializer} from "../../token/serializer";

expect.addSnapshotSerializer(serializer);

describe("Lexer", () => {
    describe("lex", () => {
        it("should coalesce integers", () => {
            const glyphTree = row([char("1"), char("2"), char("3")]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Number@[]:0:3 123))
                `);
        });

        it("should coalesce reals", () => {
            const glyphTree = row([char("1"), char("."), char("3")]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Number@[]:0:3 1.3))
                `);
        });

        it("should lex `1 + a`", () => {
            const glyphTree = row([char("1"), char("+"), char("a")]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Number@[]:0:1 1) 
                  Plus@[]:1:2 
                  (Identifier@[]:2:3 a))
                `);
        });

        it("should lex `1 \u00B7 a`", () => {
            const glyphTree = row([char("1"), char("\u00B7"), char("a")]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Number@[]:0:1 1) 
                  Times@[]:1:2 
                  (Identifier@[]:2:3 a))
                `);
        });

        it("should lex `1 * a`", () => {
            const glyphTree = row([char("1"), char("*"), char("a")]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Number@[]:0:1 1) 
                  Times@[]:1:2 
                  (Identifier@[]:2:3 a))
                `);
        });

        it("should lex `1 + 1/x`", () => {
            const glyphTree = row([
                char("1"),
                char("+"),
                frac([char("1")], [char("x")]),
            ]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Number@[]:0:1 1) 
                  Plus@[]:1:2 
                  (frac@[]:2:3 (row 
                    (Number@[2,0]:0:1 1)) (row 
                    (Identifier@[2,1]:0:1 x))))
            `);
        });

        it("should lex `e^x`", () => {
            const glyphTree = row([char("e"), subsup(undefined, [char("x")])]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Identifier@[]:0:1 e) 
                  (subsup@[]:1:2 ^ (row 
                    (Identifier@[1,1]:0:1 x))))
            `);
        });

        it("should lex `a_n`", () => {
            const glyphTree = row([char("a"), subsup([char("n")], undefined)]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Identifier@[]:0:1 a) 
                  (subsup@[]:1:2 (row 
                    (Identifier@[1,0]:0:1 n)) _))
            `);
        });

        it("should lex `a_n^2`", () => {
            const glyphTree = row([char("a"), util.subsup("n", "2")]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Identifier@[]:0:1 a) 
                  (subsup@[]:1:2 (row 
                    (Identifier@[1,0]:0:1 n)) (row 
                    (Number@[1,1]:0:1 2))))
            `);
        });

        it("should lex parens", () => {
            const glyphTree = util.row("(1 + 2)");
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  LeftParens@[]:0:1 
                  (Number@[]:1:2 1) 
                  Plus@[]:3:4 
                  (Number@[]:5:6 2) 
                  RightParens@[]:6:7)
                `);
        });

        it("should lex a square root", () => {
            const glyphTree = row([util.sqrt("123")]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (root@[]:0:1 (row 
                    (Number@[0,0]:0:3 123)) _))
            `);
        });

        it("should lex a nth root", () => {
            const glyphTree = row([util.root("123", "n")]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (root@[]:0:1 (row 
                    (Identifier@[0,0]:0:1 n)) (row 
                    (Number@[0,1]:0:3 123))))
            `);
        });

        it("should lex multi character identifiers", () => {
            const glyphTree = row([char("s"), char("i"), char("n")]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Identifier@[]:0:3 sin))
            `);
        });

        it("should lex a minus sign", () => {
            const glyphTree = row([char("1"), char("\u2212"), char("2")]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Number@[]:0:1 1) 
                  Minus@[]:1:2 
                  (Number@[]:2:3 2))
            `);
        });

        it("should lex an equal sign", () => {
            const glyphTree = row([char("1"), char("="), char("2")]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Number@[]:0:1 1) 
                  Equal@[]:1:2 
                  (Number@[]:2:3 2))
            `);
        });

        it("should lex an ellipsis", () => {
            const glyphTree = util.row("1+...+n");
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (Number@[]:0:1 1) 
                  Plus@[]:1:2 
                  Ellipsis@[]:2:5 
                  Plus@[]:5:6 
                  (Identifier@[]:6:7 n))
                `);
        });

        it("should lex summation with limits", () => {
            const glyphTree = row([
                limits(
                    char("\u03a3"),
                    [char("i"), char("="), char("0")],
                    [char("\u221e")],
                ),
            ]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (limits{SummationOperator@[]:0:1}@[]:0:1 (row 
                    (Identifier@[0,0]:0:1 i) 
                    Equal@[0,0]:1:2 
                    (Number@[0,0]:2:3 0)) (row )))
                `);
        });

        it("should lex products with limits", () => {
            const glyphTree = row([
                limits(
                    char("\u03a0"),
                    [char("i"), char("="), char("0")],
                    [char("\u221e")],
                ),
            ]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (limits{ProductOperator@[]:0:1}@[]:0:1 (row 
                    (Identifier@[0,0]:0:1 i) 
                    Equal@[0,0]:1:2 
                    (Number@[0,0]:2:3 0)) (row )))
                `);
        });

        it("should lex lim", () => {
            // TODO: we should have the editor convert "-", ">" into a unicode
            // arrow.
            const glyphTree = row([
                limits(util.row("lim"), [
                    char("i"),
                    char("-"),
                    char(">"),
                    char("0"),
                ]),
            ]);
            const tokenTree = Lexer.lexRow(glyphTree);

            expect(tokenTree).toMatchInlineSnapshot(`
                (row 
                  (limits{Lim@[]:0:1}@[]:0:1 (row 
                    (Identifier@[0,0]:0:1 i) 
                    (Number@[0,0]:3:4 0)) _))
                `);
        });

        // TODO: revisit how we handle empty cells within vertical layouts
        it.skip("should throw on empty row", () => {
            const glyphTree = row([]);
            expect(() => {
                Lexer.lexRow(glyphTree);
            }).toThrowErrorMatchingInlineSnapshot(`"rows cannot be empty"`);
        });
    });
});
