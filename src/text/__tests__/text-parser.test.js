// @flow
import {parse} from "../text-parser.js";
import serializer from "../ast-serializer.js";

expect.addSnapshotSerializer(serializer);

describe("TextParser", () => {
    it("parse addition", () => {
        const ast = parse("1 + 2");

        expect(ast).toMatchInlineSnapshot(`(add 1 2)`);
    });

    it("parse n-ary addition", () => {
        const ast = parse("1 + 2 + a");

        expect(ast).toMatchInlineSnapshot(`(add 1 2 a)`);
    });

    it("parses minus", () => {
        const ast = parse("a - b");

        expect(ast).toMatchInlineSnapshot(`
            (add
              a
              (neg.sub b))
        `);
    });

    it("parses minus in longer expression", () => {
        const ast = parse("a + b - c + d");

        expect(ast).toMatchInlineSnapshot(`
            (add
              a
              b
              (neg.sub c)
              d)
        `);
    });

    it("parses simple order of operations", () => {
        const ast = parse("1 + 2 * 3 - 4");

        expect(ast).toMatchInlineSnapshot(`
            (add
              1
              (mul.exp 2 3)
              (neg.sub 4))
        `);
    });

    it("parses unary minus", () => {
        const ast = parse("-a");

        expect(ast).toMatchInlineSnapshot(`(neg a)`);
    });

    it("parses unary minus with addition", () => {
        const ast = parse("a + -a");

        expect(ast).toMatchInlineSnapshot(`
            (add
              a
              (neg a))
        `);
    });

    it("parses multiple unary minuses", () => {
        const ast = parse("--a");

        expect(ast).toMatchInlineSnapshot(`
            (neg
              (neg a))
        `);
    });

    it("parses unary and binary minus", () => {
        const ast = parse("a - -b");

        expect(ast).toMatchInlineSnapshot(`
            (add
              a
              (neg.sub
                (neg b)))
        `);
    });

    it("parses implicit multiplication", () => {
        const ast = parse("ab");

        expect(ast).toMatchInlineSnapshot(`(mul.imp a b)`);
    });

    it("parses n-ary implicit multiplication", () => {
        const ast = parse("abc");

        expect(ast).toMatchInlineSnapshot(`(mul.imp a b c)`);
    });

    it("parses explicit multiplication", () => {
        const ast = parse("1 * 2 * 3");

        expect(ast).toMatchInlineSnapshot(`(mul.exp 1 2 3)`);
    });

    it("parses explicit and implicit multiplication separately", () => {
        const ast = parse("ab * cd");

        expect(ast).toMatchInlineSnapshot(`
            (mul.exp
              (mul.imp a b)
              (mul.imp c d))
        `);
    });

    it("parses division with higher precedence than explicit multiplication", () => {
        const ast = parse("a/b * c/d");

        expect(ast).toMatchInlineSnapshot(`
            (mul.exp
              (div a b)
              (div c d))
        `);
    });

    it("parses division with lower precedence than implicit multiplication", () => {
        const ast = parse("ab/cd * uv/xy");

        expect(ast).toMatchInlineSnapshot(`
            (mul.exp
              (div
                (mul.imp a b)
                (mul.imp c d))
              (div
                (mul.imp u v)
                (mul.imp x y)))
        `);
    });

    it("parses parenthesis", () => {
        const ast = parse("(x + y)");

        expect(ast).toMatchInlineSnapshot(`(add x y)`);
    });

    it("throws if lparen is missing", () => {
        expect(() => {
            parse("x + y)");
        }).toThrowErrorMatchingInlineSnapshot(`"unmatched right paren"`);
    });

    it("throws if rparen is missing", () => {
        expect(() => {
            parse("(x + y");
        }).toThrowErrorMatchingInlineSnapshot(`"unmatched left paren"`);
    });

    it("parses parenthesis", () => {
        const ast = parse("a(x + y)");

        expect(ast).toMatchInlineSnapshot(`
            (mul.exp
              a
              (add x y))
        `);
    });

    it("parses adding parenthesis", () => {
        const ast = parse("(a + b) + (x + y)");

        expect(ast).toMatchInlineSnapshot(`
            (add
              (add a b)
              (add x y))
        `);
    });

    it("parses implicit multiplication by parens", () => {
        const ast = parse("(a + b)(x + y)");

        expect(ast).toMatchInlineSnapshot(`
            (mul.exp
              (add a b)
              (add x y))
        `);
    });

    it("parses n-ary implicit multiplication by parens", () => {
        const ast = parse("(a)(b)(c)");

        expect(ast).toMatchInlineSnapshot(`(mul.exp a b c)`);
    });

    it("parses division", () => {
        const ast = parse("x / y");

        expect(ast).toMatchInlineSnapshot(`(div x y)`);
    });

    it("parses nested division", () => {
        const ast = parse("x / y / z");

        expect(ast).toMatchInlineSnapshot(`
            (div
              (div x y)
              z)
        `);
    });

    it("parses exponents", () => {
        const ast = parse("x^2");

        expect(ast).toMatchInlineSnapshot(`(exp x 2)`);
    });

    it("parses nested exponents", () => {
        const ast = parse("2^3^4");

        expect(ast).toMatchInlineSnapshot(`
            (exp
              2
              (exp 3 4))
        `);
    });

    it("parses equations", () => {
        const ast = parse("y = x + 1");

        expect(ast).toMatchInlineSnapshot(`
            (eq
              y
              (add x 1))
        `);
    });

    it("parses equations", () => {
        const ast = parse("x = y = z");

        expect(ast).toMatchInlineSnapshot(`(eq x y z)`);
    });
});
