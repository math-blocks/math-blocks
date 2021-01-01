import {builders} from "@math-blocks/semantic";

import * as Editor from "../editor-ast";
import * as Util from "../util";

import print from "../editor-printer";
import {toEqualMath} from "../test-util";

expect.extend({toEqualMath});

declare global {
    /* eslint-disable */
    namespace jest {
        interface Matchers<R, T> {
            toEqualMath(actual: Editor.Node): R;
        }
    }
    /* eslint-enable */
}

describe("print", () => {
    test("123", () => {
        const ast = builders.number("123");

        const node = print(ast);

        expect(node).toEqualMath(Util.row("123"));
    });

    test("1", () => {
        const ast = builders.number("1");

        const node = print(ast);

        expect(node).toEqualMath(Util.row("1"));
    });

    test("1+2+3", () => {
        const ast = builders.add([
            builders.number("1"),
            builders.number("2"),
            builders.number("3"),
        ]);

        const node = print(ast);

        expect(node).toEqualMath(Util.row("1+2+3"));
    });

    test("12+34", () => {
        const ast = builders.add([
            builders.number("12"),
            builders.number("34"),
        ]);

        const node = print(ast);

        expect(node).toEqualMath(Util.row("12+34"));
    });

    test("a*b*c", () => {
        const ast = builders.mul(
            [
                builders.identifier("a"),
                builders.identifier("b"),
                builders.identifier("c"),
            ],
            false,
        );

        const node = print(ast);

        expect(node).toEqualMath(Util.row("a*b*c"));
    });

    test("abc", () => {
        const ast = builders.mul(
            [
                builders.identifier("a"),
                builders.identifier("b"),
                builders.identifier("c"),
            ],
            true,
        );

        const node = print(ast);

        expect(node).toEqualMath(Util.row("abc"));
    });

    test("abc+123", () => {
        const ast = builders.add([
            builders.mul(
                [
                    builders.identifier("a"),
                    builders.identifier("b"),
                    builders.identifier("c"),
                ],
                true,
            ),
            builders.number("123"),
        ]);

        const node = print(ast);

        expect(node).toEqualMath(Util.row("abc+123"));
    });

    test("a(x+y)", () => {
        const ast = builders.mul(
            [
                builders.identifier("a"),
                builders.add([
                    builders.identifier("x"),
                    builders.identifier("y"),
                ]),
            ],
            true,
        );

        const node = print(ast);

        expect(node).toEqualMath(Util.row("a(x+y)"));
    });

    test("(1)(2)(3)", () => {
        const ast = builders.mul(
            [builders.number("1"), builders.number("2"), builders.number("3")],
            true,
        );

        const node = print(ast);

        expect(node).toEqualMath(Util.row("(1)(2)(3)"));
    });

    test("(-a)(-b)", () => {
        const ast = builders.mul(
            [
                builders.neg(builders.identifier("a")),
                builders.neg(builders.identifier("b")),
            ],
            true,
        );

        const node = print(ast);

        expect(node).toEqualMath(Util.row("(-a)(-b)"));
    });

    test("(a/b)(c/d)", () => {
        const ast = builders.mul(
            [
                builders.div(
                    builders.identifier("a"),
                    builders.identifier("b"),
                ),
                builders.div(
                    builders.identifier("c"),
                    builders.identifier("d"),
                ),
            ],
            true,
        );

        const node = print(ast);

        expect(node).toEqualMath(
            Editor.row([
                Editor.glyph("("),
                Util.frac("a", "b"),
                Editor.glyph(")"),
                Editor.glyph("("),
                Util.frac("c", "d"),
                Editor.glyph(")"),
            ]),
        );
    });

    test("-1.2", () => {
        const ast = builders.number("-1.2");

        const node = print(ast);

        expect(node).toEqualMath(Util.row("-1.2"));
    });

    test("x-y", () => {
        const ast = builders.add([
            builders.identifier("x"),
            builders.neg(
                builders.identifier("y"),
                true, // subtraction
            ),
        ]);

        const node = print(ast);

        expect(node).toEqualMath(Util.row("x-y"));
    });

    test("a+(b+c)", () => {
        const ast = builders.add([
            builders.identifier("a"),
            builders.add([builders.identifier("b"), builders.identifier("c")]),
        ]);

        const node = print(ast);

        expect(node).toEqualMath(Util.row("a+(b+c)"));
    });

    test("a-(b+c)", () => {
        const ast = builders.add([
            builders.identifier("a"),
            builders.neg(
                builders.add([
                    builders.identifier("b"),
                    builders.identifier("c"),
                ]),
                true, // subtraction
            ),
        ]);

        const node = print(ast);

        expect(node).toEqualMath(Util.row("a-(b+c)"));
    });

    test("a/b", () => {
        const ast = builders.div(
            builders.identifier("a"),
            builders.identifier("b"),
        );

        const node = print(ast);

        expect(node).toEqualMath(Editor.row([Util.frac("a", "b")]));
    });

    test("(a+b)/(x+y)", () => {
        const ast = builders.div(
            builders.add([builders.identifier("a"), builders.identifier("b")]),
            builders.add([builders.identifier("x"), builders.identifier("y")]),
        );

        const node = print(ast);

        expect(node).toEqualMath(Editor.row([Util.frac("a+b", "x+y")]));
    });

    test("a + -a", () => {
        const ast = builders.add([
            builders.identifier("a"),
            builders.neg(builders.identifier("a"), false),
        ]);

        const node = print(ast);

        expect(node).toEqualMath(Util.row("a+-a"));
    });

    test("a + --b", () => {
        const ast = builders.add([
            builders.identifier("a"),
            builders.neg(builders.neg(builders.identifier("b"), false), false),
        ]);

        const node = print(ast);

        expect(node).toEqualMath(Util.row("a+--b"));
    });

    test("-1(a + b)", () => {
        const ast = builders.mul(
            [
                builders.neg(builders.number("1")),
                builders.add([
                    builders.identifier("a"),
                    builders.identifier("b"),
                ]),
            ],
            true,
        );

        const node = print(ast);

        expect(node).toEqualMath(Util.row("-1(a+b)"));
    });

    test("leading subtraction", () => {
        const ast = {
            type: "add",
            id: 0,
            args: [
                {
                    type: "neg",
                    id: 1,
                    subtraction: true,
                    arg: {type: "identifier", name: "a", id: 2},
                },
                {type: "identifier", name: "b", id: 3},
            ],
        } as const;

        expect(print(ast)).toEqualMath(Util.row("-a+b"));
    });

    test("(a)(b)(1)", () => {
        const ast = builders.mul(
            [
                builders.identifier("a"),
                builders.identifier("b"),
                builders.number("1"),
            ],
            true,
        );

        const node = print(ast);

        expect(node).toEqualMath(Util.row("(a)(b)(1)"));
    });

    test("a*b*1", () => {
        const ast = builders.mul(
            [
                builders.identifier("a"),
                builders.identifier("b"),
                builders.number("1"),
            ],
            false,
        );

        const node = print(ast);

        expect(node).toEqualMath(Util.row("a*b*1"));
    });

    test("y = x + 1", () => {
        const ast = builders.eq([
            builders.identifier("y"),
            builders.add([builders.identifier("x"), builders.number("1")]),
        ]);

        const node = print(ast);

        expect(node).toEqualMath(Util.row("y=x+1"));
    });

    test("x^2", () => {
        const ast = builders.pow(
            builders.identifier("x"),
            builders.number("2"),
        );

        const node = print(ast);

        expect(node).toEqualMath(
            Editor.row([Editor.glyph("x"), Util.sup("2")]),
        );
    });

    test("1^n", () => {
        const ast = builders.pow(
            builders.number("1"),
            builders.identifier("n"),
        );

        const node = print(ast);

        expect(node).toEqualMath(
            Editor.row([Editor.glyph("1"), Util.sup("n")]),
        );
    });

    test("e^(x+y)", () => {
        const ast = builders.pow(
            builders.identifier("e"),
            builders.add([builders.identifier("x"), builders.identifier("y")]),
        );

        const node = print(ast);

        expect(node).toEqualMath(
            Editor.row([Editor.glyph("e"), Util.sup("x+y")]),
        );
    });

    test("(x+1)^2", () => {
        const ast = builders.pow(
            builders.add([builders.identifier("x"), builders.number("1")]),
            builders.number("2"),
        );

        const node = print(ast);

        expect(node).toEqualMath(
            Editor.row([
                Editor.glyph("("),
                Editor.glyph("x"),
                Editor.glyph("+"),
                Editor.glyph("1"),
                Editor.glyph(")"),
                Util.sup("2"),
            ]),
        );
    });

    test("(x)", () => {
        const ast = builders.parens(builders.identifier("x"));

        const node = print(ast);

        expect(node).toEqualMath(Util.row("(x)"));
    });
});
