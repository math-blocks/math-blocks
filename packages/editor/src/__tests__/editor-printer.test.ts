import * as Semantic from "@math-blocks/semantic";

import {stripIDs} from "../editor-ast";
import * as Util from "../util";

import print from "../editor-printer";

describe("print", () => {
    test("123", () => {
        const ast = Semantic.number("123");

        const node = print(ast);

        expect(stripIDs(node)).toEqual(stripIDs(Util.row("123")));
    });

    test("1", () => {
        const ast = Semantic.number("1");

        const node = print(ast);

        expect(stripIDs(node)).toEqual(stripIDs(Util.row("1")));
    });

    test("1+2+3", () => {
        const ast = Semantic.add([
            Semantic.number("1"),
            Semantic.number("2"),
            Semantic.number("3"),
        ]);

        const node = print(ast);

        expect(stripIDs(node)).toEqual(stripIDs(Util.row("1+2+3")));
    });

    test("a*b*c", () => {
        const ast = Semantic.mul(
            [
                Semantic.identifier("a"),
                Semantic.identifier("b"),
                Semantic.identifier("c"),
            ],
            false,
        );

        const node = print(ast);

        expect(stripIDs(node)).toEqual(stripIDs(Util.row("a*b*c")));
    });

    test("abc", () => {
        const ast = Semantic.mul(
            [
                Semantic.identifier("a"),
                Semantic.identifier("b"),
                Semantic.identifier("c"),
            ],
            true,
        );

        const node = print(ast);

        expect(stripIDs(node)).toEqual(stripIDs(Util.row("abc")));
    });

    test("abc+123", () => {
        const ast = Semantic.add([
            Semantic.mul(
                [
                    Semantic.identifier("a"),
                    Semantic.identifier("b"),
                    Semantic.identifier("c"),
                ],
                true,
            ),
            Semantic.number("123"),
        ]);

        const node = print(ast);

        expect(stripIDs(node)).toEqual(stripIDs(Util.row("abc+123")));
    });

    test("a(x+y)", () => {
        const ast = Semantic.mul(
            [
                Semantic.identifier("a"),
                Semantic.add([
                    Semantic.identifier("x"),
                    Semantic.identifier("y"),
                ]),
            ],
            true,
        );

        const node = print(ast);

        expect(stripIDs(node)).toEqual(stripIDs(Util.row("a(x+y)")));
    });

    test("(1)(2)(3)", () => {
        const ast = Semantic.mul(
            [Semantic.number("1"), Semantic.number("2"), Semantic.number("3")],
            true,
        );

        const node = print(ast);

        expect(stripIDs(node)).toEqual(stripIDs(Util.row("(1)(2)(3)")));
    });

    test("-1.2", () => {
        const ast = Semantic.number("-1.2");

        const node = print(ast);

        expect(stripIDs(node)).toEqual(stripIDs(Util.row("-1.2")));
    });

    test("x-y", () => {
        const ast = Semantic.add([
            Semantic.identifier("x"),
            Semantic.neg(
                Semantic.identifier("y"),
                true, // subtraction
            ),
        ]);

        const node = print(ast);

        expect(stripIDs(node)).toEqual(stripIDs(Util.row("x-y")));
    });

    test("a+(b+c)", () => {
        const ast = Semantic.add([
            Semantic.identifier("a"),
            Semantic.add([Semantic.identifier("b"), Semantic.identifier("c")]),
        ]);

        const node = print(ast);

        expect(stripIDs(node)).toEqual(stripIDs(Util.row("a+(b+c)")));
    });

    test("a-(b+c)", () => {
        const ast = Semantic.add([
            Semantic.identifier("a"),
            Semantic.neg(
                Semantic.add([
                    Semantic.identifier("b"),
                    Semantic.identifier("c"),
                ]),
                true, // subtraction
            ),
        ]);

        const node = print(ast);

        expect(stripIDs(node)).toEqual(stripIDs(Util.row("a-(b+c)")));
    });

    test("a/b", () => {
        const ast = Semantic.div(
            Semantic.identifier("a"),
            Semantic.identifier("b"),
        );

        const node = print(ast);

        expect(stripIDs(node)).toEqual(stripIDs(Util.frac("a", "b")));
    });

    test("(a+b)/(x+y)", () => {
        const ast = Semantic.div(
            Semantic.add([Semantic.identifier("a"), Semantic.identifier("b")]),
            Semantic.add([Semantic.identifier("x"), Semantic.identifier("y")]),
        );

        const node = print(ast);

        expect(stripIDs(node)).toEqual(stripIDs(Util.frac("a+b", "x+y")));
    });
});
