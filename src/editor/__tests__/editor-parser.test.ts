import parser from "../editor-parser";
import * as Lexer from "../editor-lexer";
import * as Editor from "../editor";

import {Token} from "../editor-parser";

import serializer from "../../semantic/semantic-serializer";

expect.addSnapshotSerializer(serializer);

describe("NewMathParser", () => {
    it("should handle equations", () => {
        const tokens = [
            Lexer.number("2"),
            Lexer.identifier("x"),
            Lexer.eq(),
            Lexer.number("10"),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (eq
              (mul.imp 2 x)
              10)
        `);
    });

    it("should handle n-ary equality", () => {
        const tokens = [
            Lexer.identifier("x"),
            Lexer.eq(),
            Lexer.identifier("y"),
            Lexer.eq(),
            Lexer.identifier("z"),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`(eq x y z)`);
    });

    it("should parse binary expressions containing subtraction", () => {
        const tokens = [Lexer.number("1"), Lexer.minus(), Lexer.number("2")];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (add
              1
              (neg.sub 2))
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
            (add
              1
              (neg.sub 2)
              (neg.sub 3))
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
            (add
              1
              (neg.sub
                (neg 2)))
        `);
    });

    it("should parse expressions containing unary minus", () => {
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
            (add
              1
              (neg 2)
              3)
        `);
    });

    it("should parse nexplicit multiplication", () => {
        const tokens = [Lexer.number("1"), Lexer.times(), Lexer.number("2")];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`(mul.exp 1 2)`);
    });

    it("should parse n-ary explicit multiplication", () => {
        const tokens = [
            Lexer.number("1"),
            Lexer.times(),
            Lexer.number("2"),
            Lexer.times(),
            Lexer.number("3"),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`(mul.exp 1 2 3)`);
    });

    it("should parse implicit multiplication", () => {
        const tokens: Array<Token> = [
            Lexer.identifier("a"),
            Lexer.identifier("b"),
            Lexer.identifier("c"),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`(mul.imp a b c)`);
    });

    it("should handle fractions", () => {
        const tokens: Array<Token> = [
            Lexer.number("1"),
            Lexer.plus(),
            Editor.frac([Lexer.number("1")], [Lexer.identifier("x")]),
        ];

        const parseTree = parser.parse(tokens);

        expect(parseTree).toMatchInlineSnapshot(`
            (add
              1
              (div 1 x))
        `);
    });

    it("should handle exponents", () => {
        const tokens: Array<Token> = [
            Lexer.identifier("x"),
            Editor.subsup(undefined, [Lexer.number("2")]),
        ];

        const parseTree = parser.parse(tokens);

        expect(parseTree).toMatchInlineSnapshot(`(exp x 2)`);
    });

    it("should handle nested exponents", () => {
        const tokens: Array<Token> = [
            Lexer.identifier("x"),
            Editor.subsup(undefined, [
                Lexer.identifier("y"),
                Editor.subsup(undefined, [Lexer.number("2")]),
            ]),
        ];

        const parseTree = parser.parse(tokens);

        expect(parseTree).toMatchInlineSnapshot(`
            (exp
              x
              (exp y 2))
        `);
    });

    it("should handle subscripts on identifiers", () => {
        const tokens: Array<Token> = [
            Lexer.identifier("a"),
            Editor.subsup(
                [Lexer.identifier("n"), Lexer.plus(), Lexer.number("1")],
                undefined,
            ),
        ];

        const parseTree = parser.parse(tokens);

        expect(parseTree).toMatchInlineSnapshot(`(ident a (add n 1))`);
    });

    it("should handle subscripts and superscripts identifiers", () => {
        const tokens: Array<Token> = [
            Lexer.identifier("a"),
            Editor.subsup(
                [Lexer.identifier("n"), Lexer.plus(), Lexer.number("1")],
                [Lexer.number("2")],
            ),
        ];

        const parseTree = parser.parse(tokens);

        expect(parseTree).toMatchInlineSnapshot(`(exp (ident a (add n 1)) 2)`);
    });

    it("should throw when a subscript is being used on a number", () => {
        const tokens: Array<Token> = [
            Lexer.number("2"),
            Editor.subsup([Lexer.number("0")], undefined),
        ];

        expect(() => parser.parse(tokens)).toThrowErrorMatchingInlineSnapshot(
            `"subscripts are only allowed on identifiers"`,
        );
    });

    it("should throw when an atom is expected", () => {
        const tokens: Array<Token> = [Lexer.number("2"), Lexer.minus()];

        expect(() => parser.parse(tokens)).toThrowErrorMatchingInlineSnapshot(
            `"Unexpected 'eol' atom"`,
        );
    });

    it("should throw on a trailing '+'", () => {
        const tokens: Array<Token> = [
            Lexer.number("2"),
            Lexer.plus(),
            Lexer.number("2"),
            Lexer.plus(),
        ];

        expect(() => parser.parse(tokens)).toThrowErrorMatchingInlineSnapshot(
            `"Unexpected 'eol' atom"`,
        );
    });

    it("should handle an ellispis", () => {
        const tokens = [
            Lexer.number("1"),
            Lexer.plus(),
            Lexer.ellipsis(),
            Lexer.plus(),
            Lexer.identifier("n"),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`(add 1 ... n)`);
    });

    it("should handle adding with parens", () => {
        const tokens = [
            Lexer.identifier("a"),
            Lexer.plus(),
            Editor.parens([
                Lexer.identifier("b"),
                Lexer.plus(),
                Lexer.identifier("c"),
            ]),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (add
              a
              (add b c))
        `);
    });

    it("should handle implicit multiplication with parens", () => {
        const tokens = [
            Lexer.identifier("a"),
            Editor.parens([
                Lexer.identifier("b"),
                Lexer.plus(),
                Lexer.identifier("c"),
            ]),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              a
              (add b c))
        `);
    });

    it("should handle implicit multiplication with multiple parens", () => {
        const tokens = [
            Lexer.identifier("a"),
            Editor.parens([
                Lexer.identifier("b"),
                Lexer.plus(),
                Lexer.identifier("c"),
            ]),
            Editor.parens([
                Lexer.identifier("d"),
                Lexer.plus(),
                Lexer.identifier("e"),
            ]),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              a
              (add b c)
              (add d e))
        `);
    });

    it("should handle implicit multiplication with parens at the start", () => {
        const tokens = [
            Editor.parens([
                Lexer.identifier("b"),
                Lexer.plus(),
                Lexer.identifier("c"),
            ]),
            Editor.parens([
                Lexer.identifier("d"),
                Lexer.plus(),
                Lexer.identifier("e"),
            ]),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (add b c)
              (add d e))
        `);
    });

    it("should handle implicit multiplication with roots", () => {
        const tokens = [
            Lexer.identifier("a"),
            Editor.root([Lexer.identifier("b")], [Lexer.number("2")]),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              a
              (root b 2))
        `);
    });

    it("should handle implicit multiplication with multiple roots", () => {
        const tokens = [
            Lexer.number("a"),
            Editor.root([Lexer.number("b")], [Lexer.number("2")]),
            Editor.root([Lexer.number("c")], [Lexer.number("3")]),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              a
              (root b 2)
              (root c 3))
        `);
    });

    it("should handle implicit multiplication starting with a root", () => {
        const tokens = [
            Editor.root([Lexer.number("b")], [Lexer.number("2")]),
            Editor.root([Lexer.number("c")], [Lexer.number("3")]),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (root b 2)
              (root c 3))
        `);
    });

    it("should handle (√2)a", () => {
        const tokens = [
            Editor.root([Lexer.number("2")], [Lexer.number("2")]),
            Lexer.identifier("a"),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (root 2 2)
              a)
        `);
    });

    it("should handle 5√2", () => {
        const tokens = [
            Lexer.number("5"),
            Editor.root([Lexer.number("2")], [Lexer.number("2")]),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              5
              (root 2 2))
        `);
    });

    it("should handle √2√3", () => {
        const tokens = [
            Editor.root([Lexer.number("2")], [Lexer.number("2")]),
            Editor.root([Lexer.number("2")], [Lexer.number("2")]),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (root 2 2)
              (root 2 2))
        `);
    });
});
