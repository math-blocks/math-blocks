import {parse} from "../text-parser";
import {serializer} from "@math-blocks/semantic";

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

        expect(ast).toMatchInlineSnapshot(`(neg (neg a))`);
    });

    it("parses unary and binary minus", () => {
        const ast = parse("a - -b");

        expect(ast).toMatchInlineSnapshot(`
            (add
              a
              (neg.sub (neg b)))
        `);
    });

    it("parses implicit multiplication", () => {
        const ast = parse("ab");

        expect(ast).toMatchInlineSnapshot(`(mul.imp a b)`);
    });

    it("negation is higher precedence than implicit multplication", () => {
        const ast = parse("-ab");

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (neg a)
              b)
        `);
    });

    it("negation is higher precedence than explicit multplication", () => {
        const ast = parse("-a * b");

        expect(ast).toMatchInlineSnapshot(`
            (mul.exp
              (neg a)
              b)
        `);
    });

    it("negation can be on individual factors when wrapped in parens", () => {
        const ast = parse("(-a)(b)");

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
              (neg a)
              b)
        `);
    });

    it("implicit multiplication is higher precedence than addition", () => {
        const ast = parse("ab + cd");

        expect(ast).toMatchInlineSnapshot(`
            (add
              (mul.imp a b)
              (mul.imp c d))
        `);
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

    it("throws if we run into an unexpected EOL", () => {
        expect(() => {
            parse("x +");
        }).toThrowErrorMatchingInlineSnapshot(`"Unexpected 'eol' token"`);
    });

    it("implicit multiplication w/ parenthesis", () => {
        const ast = parse("a(x + y)");

        expect(ast).toMatchInlineSnapshot(`
            (mul.imp
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
            (mul.imp
              (add a b)
              (add x y))
        `);
    });

    it("parses n-ary implicit multiplication by parens", () => {
        const ast = parse("(a)(b)(c)");

        expect(ast).toMatchInlineSnapshot(`(mul.imp a b c)`);
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

        expect(ast).toMatchInlineSnapshot(`(pow :base x :exp 2)`);
    });

    it("parses nested exponents", () => {
        const ast = parse("2^3^4");

        expect(ast).toMatchInlineSnapshot(`
            (pow
              :base 2
              :exp (pow :base 3 :exp 4))
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

    it("parses n-ary equations", () => {
        const ast = parse("x = y = z");

        expect(ast).toMatchInlineSnapshot(`(eq x y z)`);
    });

    it("parses (5)2 as (mul 5 2)", () => {
        const ast = parse("(5)2");

        expect(ast).toMatchInlineSnapshot(`(mul.imp 5 2)`);
    });
});