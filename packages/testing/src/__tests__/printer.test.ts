import {print} from "../printer";
import {parse} from "../text-parser";

describe("printer", () => {
    describe("add/sub", () => {
        test("1 - x", () => {
            const ast = parse("1 - x");

            const result = print(ast);

            expect(result).toEqual("1 - x");
        });

        test("1 + -x", () => {
            const ast = parse("1 + -x");

            const result = print(ast);

            expect(result).toEqual("1 + -x");
        });

        test("1 + --x", () => {
            const ast = parse("1 + --x");

            const result = print(ast);

            expect(result).toEqual("1 + --x");
        });

        test("1 - -x", () => {
            const ast = parse("1 - -x");

            const result = print(ast);

            expect(result).toEqual("1 - -x");
        });

        test("1 - --x", () => {
            const ast = parse("1 - --x");

            const result = print(ast);

            expect(result).toEqual("1 - --x");
        });

        test("1 - -2", () => {
            const ast = parse("1 - -2");

            const result = print(ast);

            expect(result).toEqual("1 - -2");
        });

        test("1 - (x + y)", () => {
            const ast = parse("1 - (x + y)");

            const result = print(ast);

            expect(result).toEqual("1 - (x + y)");
        });

        test("1 + -(x + y)", () => {
            const ast = parse("1 + -(x + y)");

            const result = print(ast);

            expect(result).toEqual("1 + -(x + y)");
        });

        test("1 - -(x + y)", () => {
            const ast = parse("1 - -(x + y)");

            const result = print(ast);

            expect(result).toEqual("1 - -(x + y)");
        });

        test("1 + (x + y)", () => {
            const ast = parse("1 + (x + y)");

            const result = print(ast);

            expect(result).toEqual("1 + (x + y)");
        });
    });

    describe("mul", () => {
        test("abc", () => {
            const ast = parse("abc");

            const result = print(ast);

            expect(result).toEqual("abc");
        });

        test("2xy", () => {
            const ast = parse("2xy");

            const result = print(ast);

            expect(result).toEqual("2xy");
        });

        test("(x)(2)(y)", () => {
            const ast = parse("(x)(2)(y)");

            const result = print(ast);

            expect(result).toEqual("(x)(2)(y)");
        });

        // This and the next test both have the same result intentionally.  It
        // is common for the result to be interpreted in both ways.  It doesn't
        // make sense to produce multiple parse trees for this form.  Instead
        // we interpret either in the same way when printing in order to provide
        // users with a representation they're familiar with.
        // (neg (mul 2 x y)) -> -2xy
        test("-2xy", () => {
            const ast = parse("-2xy");

            const result = print(ast);

            expect(result).toEqual("-2xy");
        });

        // TODO: figure out how to store (-2)(x)(y) when that's what someone has
        // actually typed in.
        // STOPSHIP: have an option we can pass to the print to produce the same
        // output as the input and use it in the matcher so that we aren't
        // confused when writing/debugging tests.
        // (mul (neg 2) x y) -> -2xy
        test("(-2)(x)(y)", () => {
            const ast = parse("(-2)(x)(y)");

            const result = print(ast);

            expect(result).toEqual("-2xy");
        });

        test("(-2)(x)(y), oneToOne = true", () => {
            const ast = parse("(-2)(x)(y)");

            const result = print(ast, true);

            expect(result).toEqual("(-2)(x)(y)");
        });

        test("(-1)(a + b) w/ oneToOne true", () => {
            const ast = parse("(-1)(a + b)");

            const result = print(ast, true);

            expect(result).toEqual("(-1)(a + b)");
        });

        test("(-1)(a + b) w/ oneToOne false", () => {
            const ast = parse("(-1)(a + b)");

            const result = print(ast);

            expect(result).toEqual("-1(a + b)");
        });

        test("(x)(-2)(y)", () => {
            const ast = parse("(x)(-2)(y)");

            const result = print(ast);

            expect(result).toEqual("(x)(-2)(y)");
        });

        test("(1 / 2)(x)", () => {
            const ast = parse("(1 / 2)(x)");

            const result = print(ast);

            expect(result).toEqual("(1 / 2)(x)");
        });

        test("(2)(x / y)", () => {
            const ast = parse("(2)(x / y)");

            const result = print(ast);

            expect(result).toEqual("(2)(x / y)");
        });

        test("(x + y)(a + b)", () => {
            const ast = parse("(x + y)(a + b)");

            const result = print(ast);

            expect(result).toEqual("(x + y)(a + b)");
        });

        test("(a * b)(c * d)", () => {
            const ast = parse("(a * b)(c * d)");

            const result = print(ast);

            expect(result).toEqual("(a * b)(c * d)");
        });

        test("(a * b) * (c * d)", () => {
            const ast = parse("(a * b) * (c * d)");

            const result = print(ast);

            expect(result).toEqual("(a * b) * (c * d)");
        });

        test("ab * cd", () => {
            const ast = parse("ab * cd");

            const result = print(ast);

            expect(result).toEqual("ab * cd");
        });

        test("1 * 2 * 3", () => {
            const ast = parse("1 * 2 * 3");

            const result = print(ast);

            expect(result).toEqual("1 * 2 * 3");
        });

        test("a(b(c + d))", () => {
            const ast = parse("a(b(c + d))");

            const result = print(ast);

            expect(result).toEqual("a(b(c + d))");
        });
    });

    describe("div", () => {
        test("ab / cd", () => {
            const ast = parse("ab / cd");

            const result = print(ast);

            expect(result).toEqual("ab / cd");
        });

        test("a / b * c / d", () => {
            const ast = parse("a / b * c / d");

            const result = print(ast);

            expect(result).toEqual("a / b * c / d");
        });

        // Don't bother with this case since "a / b / c / d" is confusing to being with
        // test("a / b / c / d", () => {
        //     const ast = parse("a / b / c / d");

        //     const result = print(ast);

        //     expect(result).toEqual("a / b / c / d");
        // });

        test("(a / b) / (c / d)", () => {
            const ast = parse("(a / b) / (c / d)");

            const result = print(ast);

            expect(result).toEqual("(a / b) / (c / d)");
        });

        test("(x + y) / (a + b)", () => {
            const ast = parse("(x + y) / (a + b)");

            const result = print(ast);

            expect(result).toEqual("(x + y) / (a + b)");
        });

        test("-a / b", () => {
            const ast = parse("-(a / b)");

            const result = print(ast);

            expect(result).toEqual("-(a / b)");
        });
    });

    describe("neg", () => {
        test("-a", () => {
            const ast = parse("-a");

            const result = print(ast);

            expect(result).toEqual("-a");
        });

        test("a + -b", () => {
            const ast = parse("a + -b");

            const result = print(ast);

            expect(result).toEqual("a + -b");
        });

        test("--a", () => {
            const ast = parse("--a");

            const result = print(ast);

            expect(result).toEqual("--a");
        });

        test("a + --b", () => {
            const ast = parse("a + --b");

            const result = print(ast);

            expect(result).toEqual("a + --b");
        });

        test("----a", () => {
            const ast = parse("----a");

            const result = print(ast);

            expect(result).toEqual("----a");
        });
    });

    describe("pow", () => {
        test("x^2", () => {
            const ast = parse("x^2");

            const result = print(ast);

            expect(result).toEqual("x^2");
        });

        test("1^n", () => {
            const ast = parse("1^n");

            const result = print(ast);

            expect(result).toEqual("1^n");
        });

        test("x^(-2)", () => {
            const ast = parse("x^(-2)");

            const result = print(ast);

            expect(result).toEqual("x^(-2)");
        });

        test("-x^2", () => {
            const ast = parse("-x^2");

            const result = print(ast);

            expect(result).toEqual("-x^2");
        });

        test("(-x)^2", () => {
            const ast = parse("(-x)^2");

            const result = print(ast);

            expect(result).toEqual("(-x)^2");
        });

        test("(-x)^(-2)", () => {
            const ast = parse("(-x)^(-2)");

            const result = print(ast);

            expect(result).toEqual("(-x)^(-2)");
        });

        test("(x + 1)^2", () => {
            const ast = parse("(x + 1)^2");

            const result = print(ast);

            expect(result).toEqual("(x + 1)^2");
        });
    });

    describe("eq", () => {
        test("x = y = z", () => {
            const ast = parse("x = y = z");

            const result = print(ast);

            expect(result).toEqual("x = y = z");
        });

        test("x + y = z - 5", () => {
            const ast = parse("x + y = z - 5");

            const result = print(ast);

            expect(result).toEqual("x + y = z - 5");
        });
    });

    describe("parens", () => {
        test("(x)", () => {
            const ast = parse("(x)");

            const result = print(ast);

            expect(result).toEqual("(x)");
        });
    });
});
