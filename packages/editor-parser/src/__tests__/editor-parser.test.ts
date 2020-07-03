import * as Editor from "@math-blocks/editor";

import parser from "../editor-parser";
import * as Lexer from "../editor-lexer";
import * as LexUtil from "../test-util";

type LexNode = Editor.Node<Lexer.Token, {loc: Lexer.Location}>;

const {location} = Lexer;

import {serializer} from "@math-blocks/semantic";

expect.addSnapshotSerializer(serializer);

describe("NewMathParser", () => {
    it("should handle equations", () => {
        const tokens = [
            Lexer.number("2", location([], 0, 1)),
            Lexer.identifier("x", location([], 1, 2)),
            Lexer.eq(location([], 2, 3)),
            Lexer.number("10", location([], 3, 5)),
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
            Lexer.identifier("x", location([], 0, 1)),
            Lexer.eq(location([], 1, 2)),
            Lexer.identifier("y", location([], 2, 3)),
            Lexer.eq(location([], 3, 4)),
            Lexer.identifier("z", location([], 4, 5)),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`(eq x y z)`);
    });

    it("should parse binary expressions containing subtraction", () => {
        const tokens = [
            Lexer.number("1", location([], 0, 1)),
            Lexer.minus(location([], 1, 2)),
            Lexer.number("2", location([], 2, 3)),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (add
              1
              (neg.sub 2))
        `);
    });

    it("should parse n-ary expressions containing subtraction", () => {
        const tokens = [
            Lexer.number("1", location([], 0, 1)),
            Lexer.minus(location([], 1, 2)),
            Lexer.number("2", location([], 2, 3)),
            Lexer.minus(location([], 3, 4)),
            Lexer.number("3", location([], 4, 5)),
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
            Lexer.number("1", location([], 0, 1)),
            Lexer.minus(location([], 1, 2)),
            Lexer.minus(location([], 2, 3)),
            Lexer.number("2", location([], 3, 4)),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (add
              1
              (neg.sub (neg 2)))
        `);
    });

    it("should parse expressions containing unary minus", () => {
        const tokens = [
            Lexer.number("1", location([], 0, 1)),
            Lexer.plus(location([], 1, 2)),
            Lexer.minus(location([], 2, 3)),
            Lexer.number("2", location([], 3, 4)),
            Lexer.plus(location([], 4, 5)),
            Lexer.number("3", location([], 5, 6)),
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
        const tokens = [
            Lexer.number("1", location([], 0, 1)),
            Lexer.times(location([], 1, 2)),
            Lexer.number("2", location([], 2, 3)),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`(mul.exp 1 2)`);
    });

    it("should parse n-ary explicit multiplication", () => {
        const tokens = [
            Lexer.number("1", location([], 0, 1)),
            Lexer.times(location([], 1, 2)),
            Lexer.number("2", location([], 2, 3)),
            Lexer.times(location([], 3, 4)),
            Lexer.number("3", location([], 4, 5)),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`(mul.exp 1 2 3)`);
    });

    it("should parse implicit multiplication", () => {
        const tokens: Array<LexNode> = [
            Lexer.identifier("a", location([], 0, 1)),
            Lexer.identifier("b", location([], 1, 2)),
            Lexer.identifier("c", location([], 2, 3)),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`(mul.imp a b c)`);
    });

    it("should handle fractions", () => {
        const tokens: Array<LexNode> = [
            Lexer.number("1", location([], 0, 1)),
            Lexer.plus(location([], 1, 2)),
            LexUtil.frac(
                [Lexer.number("1", location([2, 0], 0, 1))],
                [Lexer.identifier("x", location([2, 1], 0, 1))],
                location([], 2, 3),
            ),
        ];

        const parseTree = parser.parse(tokens);

        expect(parseTree).toMatchInlineSnapshot(`
            (add
              1
              (div 1 x))
        `);
    });

    it("should handle exponents", () => {
        const tokens: Array<LexNode> = [
            Lexer.identifier("x", location([], 0, 1)),
            LexUtil.subsup(
                undefined,
                [Lexer.number("2", location([1, 1], 0, 1))],
                location([], 1, 2),
            ),
        ];

        const parseTree = parser.parse(tokens);

        expect(parseTree).toMatchInlineSnapshot(`(exp :base x :exp 2)`);
    });

    it("should handle nested exponents", () => {
        const tokens: Array<LexNode> = [
            Lexer.identifier("x", location([], 0, 1)),
            LexUtil.subsup(
                undefined,
                [
                    Lexer.identifier("y", location([1, 1], 0, 1)),
                    LexUtil.subsup(
                        undefined,
                        [Lexer.number("2", location([1, 1, 1, 1], 0, 1))],
                        location([1, 1], 1, 2),
                    ),
                ],
                location([], 1, 2),
            ),
        ];

        const parseTree = parser.parse(tokens);

        expect(parseTree).toMatchInlineSnapshot(`
            (exp
              :base x
              :exp (exp :base y :exp 2))
        `);
    });

    it("should handle subscripts on identifiers", () => {
        const tokens: Array<LexNode> = [
            Lexer.identifier("a", location([], 0, 1)),
            LexUtil.subsup(
                [
                    Lexer.identifier("n", location([1, 0], 0, 1)),
                    Lexer.plus(location([1, 0], 1, 2)),
                    Lexer.number("1", location([1, 0], 2, 3)),
                ],
                undefined,
                location([], 1, 2),
            ),
        ];

        const parseTree = parser.parse(tokens);

        expect(parseTree).toMatchInlineSnapshot(`(ident a (add n 1))`);
    });

    it("should handle subscripts and superscripts identifiers", () => {
        const tokens: Array<LexNode> = [
            Lexer.identifier("a", location([], 0, 1)),
            LexUtil.subsup(
                [
                    Lexer.identifier("n", location([1, 0], 0, 1)),
                    Lexer.plus(location([1, 0], 1, 2)),
                    Lexer.number("1", location([1, 0], 2, 3)),
                ],
                [Lexer.number("2", location([1, 1], 1, 2))],
                location([], 1, 2),
            ),
        ];

        const parseTree = parser.parse(tokens);

        expect(parseTree).toMatchInlineSnapshot(
            `(exp :base (ident a (add n 1)) :exp 2)`,
        );
    });

    it("should throw when a subscript is being used on a number", () => {
        const tokens: Array<LexNode> = [
            Lexer.number("2", location([], 0, 1)),
            LexUtil.subsup(
                [Lexer.number("0", location([1, 0], 0, 1))],
                undefined,
                location([], 1, 2),
            ),
        ];

        expect(() => parser.parse(tokens)).toThrowErrorMatchingInlineSnapshot(
            `"subscripts are only allowed on identifiers"`,
        );
    });

    it("should throw when an atom is expected", () => {
        const tokens: Array<LexNode> = [
            Lexer.number("2", location([], 0, 1)),
            Lexer.minus(location([], 1, 2)),
        ];

        expect(() => parser.parse(tokens)).toThrowErrorMatchingInlineSnapshot(
            `"Unexpected 'eol' atom"`,
        );
    });

    it("should throw on a trailing '+'", () => {
        const tokens: Array<LexNode> = [
            Lexer.number("2", location([], 0, 1)),
            Lexer.plus(location([], 1, 2)),
            Lexer.number("2", location([], 2, 3)),
            Lexer.plus(location([], 3, 4)),
        ];

        expect(() => parser.parse(tokens)).toThrowErrorMatchingInlineSnapshot(
            `"Unexpected 'eol' atom"`,
        );
    });

    it("should handle an ellispis", () => {
        const tokens = [
            Lexer.number("1", location([], 0, 1)),
            Lexer.plus(location([], 1, 2)),
            Lexer.ellipsis(location([], 2, 5)),
            Lexer.plus(location([], 5, 6)),
            Lexer.identifier("n", location([], 6, 7)),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (add
              1
              ...
              n)
        `);
    });

    it("should handle adding with parens", () => {
        const tokens = [
            Lexer.identifier("a", location([], 0, 1)),
            Lexer.plus(location([], 1, 2)),
            Lexer.lparens(location([], 2, 3)),
            Lexer.identifier("b", location([], 3, 4)),
            Lexer.plus(location([], 4, 5)),
            Lexer.identifier("c", location([], 5, 6)),
            Lexer.rparens(location([], 6, 7)),
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
            Lexer.identifier("a", location([], 0, 1)),
            Lexer.lparens(location([], 1, 2)),
            Lexer.identifier("b", location([], 2, 3)),
            Lexer.plus(location([], 3, 4)),
            Lexer.identifier("c", location([], 4, 5)),
            Lexer.rparens(location([], 5, 6)),
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
            Lexer.identifier("a", location([], 0, 1)),
            Lexer.lparens(location([], 1, 2)),
            Lexer.identifier("b", location([], 2, 3)),
            Lexer.plus(location([], 3, 4)),
            Lexer.identifier("c", location([], 4, 5)),
            Lexer.rparens(location([], 5, 6)),
            Lexer.lparens(location([], 6, 7)),
            Lexer.identifier("d", location([], 7, 8)),
            Lexer.plus(location([], 8, 9)),
            Lexer.identifier("e", location([], 9, 10)),
            Lexer.rparens(location([], 10, 11)),
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
            Lexer.lparens(location([], 0, 1)),
            Lexer.identifier("b", location([], 1, 2)),
            Lexer.plus(location([], 2, 3)),
            Lexer.identifier("c", location([], 3, 4)),
            Lexer.rparens(location([], 4, 5)),
            Lexer.lparens(location([], 5, 6)),
            Lexer.identifier("d", location([], 6, 7)),
            Lexer.plus(location([], 7, 8)),
            Lexer.identifier("e", location([], 8, 9)),
            Lexer.rparens(location([], 9, 10)),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (add b c)
              (add d e))
        `);
    });

    it("should handle implicit multiplication by a number at the end", () => {
        const tokens = [
            Lexer.lparens(location([], 0, 1)),
            Lexer.identifier("b", location([], 1, 2)),
            Lexer.rparens(location([], 2, 3)),
            Lexer.number("2", location([], 3, 4)),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`(mul.imp b 2)`);
    });

    it("should handle implicit multiplication by a frac at the end", () => {
        const tokens = [
            Lexer.lparens(location([], 0, 1)),
            Lexer.identifier("a", location([], 1, 2)),
            Lexer.plus(location([], 2, 3)),
            Lexer.identifier("b", location([], 3, 4)),
            Lexer.rparens(location([], 4, 5)),
            LexUtil.frac(
                [Lexer.number("1", location([5, 0], 0, 1))],
                [Lexer.number("2", location([5, 1], 0, 1))],
                location([], 5, 6),
            ),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (add a b)
              (div 1 2))
        `);
    });

    it("should handle implicit multiplication by a frac at the start", () => {
        const tokens = [
            LexUtil.frac(
                [Lexer.number("1", location([0, 0], 0, 1))],
                [Lexer.number("2", location([0, 1], 0, 1))],
                location([], 0, 1),
            ),
            Lexer.identifier("b", location([], 1, 2)),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (div 1 2)
              b)
        `);
    });

    it("should error on two fractions in a row without an operator", () => {
        const tokens = [
            LexUtil.frac(
                [Lexer.number("1", location([0, 0], 0, 1))],
                [Lexer.number("2", location([0, 1], 0, 1))],
                location([], 0, 1),
            ),
            LexUtil.frac(
                [Lexer.number("1", location([1, 0], 0, 1))],
                [Lexer.number("2", location([1, 1], 0, 1))],
                location([], 1, 2),
            ),
        ];

        expect(() => parser.parse(tokens)).toThrowError(
            "An operator is required between fractions",
        );
    });

    it("should handle implicit multiplication with roots", () => {
        const tokens = [
            Lexer.identifier("a", location([], 0, 1)),
            LexUtil.root(
                [Lexer.identifier("b", location([1, 0], 0, 1))],
                [Lexer.number("2", location([1, 1], 0, 1))],
                location([], 1, 2),
            ),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              a
              (root :radicand b :index 2))
        `);
    });

    it("should handle implicit multiplication with multiple roots", () => {
        const tokens = [
            Lexer.identifier("a", location([], 0, 1)),
            LexUtil.root(
                [Lexer.identifier("b", location([1, 0], 0, 1))],
                [Lexer.identifier("2", location([1, 1], 0, 1))],
                location([], 1, 2),
            ),
            LexUtil.root(
                [Lexer.identifier("c", location([2, 0], 0, 1))],
                [Lexer.identifier("3", location([2, 1], 0, 1))],
                location([], 2, 3),
            ),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              a
              (root :radicand b :index 2)
              (root :radicand c :index 3))
        `);
    });

    it("should handle implicit multiplication starting with a root", () => {
        const tokens = [
            LexUtil.root(
                [Lexer.identifier("b", location([0, 0], 0, 1))],
                [Lexer.identifier("2", location([0, 1], 0, 1))],
                location([], 0, 1),
            ),
            LexUtil.root(
                [Lexer.identifier("c", location([1, 0], 0, 1))],
                [Lexer.identifier("3", location([1, 1], 0, 1))],
                location([], 1, 2),
            ),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (root :radicand b :index 2)
              (root :radicand c :index 3))
        `);
    });

    it("should handle (√2)a", () => {
        const tokens = [
            LexUtil.root(
                [Lexer.number("2", location([0, 0], 0, 1))],
                [Lexer.number("2", location([0, 1], 0, 1))],
                location([], 0, 1),
            ),
            Lexer.identifier("a", location([], 1, 2)),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (root :radicand 2 :index 2)
              a)
        `);
    });

    it("should handle 5√2", () => {
        const tokens = [
            Lexer.number("5", location([], 0, 1)),
            LexUtil.root(
                [Lexer.number("2", location([1, 0], 0, 1))],
                [Lexer.number("2", location([1, 1], 0, 1))],
                location([], 1, 2),
            ),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              5
              (root :radicand 2 :index 2))
        `);
    });

    it("should handle √2 5", () => {
        const tokens = [
            LexUtil.root(
                [Lexer.number("2", location([0, 0], 0, 1))],
                [Lexer.number("2", location([0, 1], 0, 1))],
                location([], 0, 1),
            ),
            Lexer.number("5", location([], 1, 2)),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (root :radicand 2 :index 2)
              5)
        `);
    });

    it("should handle √2√3", () => {
        const tokens = [
            LexUtil.root(
                [Lexer.number("2", location([0, 0], 0, 1))],
                [Lexer.number("2", location([0, 1], 0, 1))],
                location([], 0, 1),
            ),
            LexUtil.root(
                [Lexer.number("3", location([1, 0], 0, 1))],
                [Lexer.number("2", location([1, 1], 0, 1))],
                location([], 1, 2),
            ),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (root :radicand 2 :index 2)
              (root :radicand 3 :index 2))
        `);
    });

    it("should handle √2 a", () => {
        const tokens = [
            LexUtil.root(
                [Lexer.number("2", location([0, 0], 0, 1))],
                [Lexer.number("2", location([0, 1], 0, 1))],
                location([], 0, 1),
            ),
            Lexer.identifier("a", location([], 1, 2)),
        ];

        const ast = parser.parse(tokens);

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (root :radicand 2 :index 2)
              a)
        `);
    });
});