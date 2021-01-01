import serializer from "../serializer";
import * as builders from "../builders";
import * as types from "../types";

expect.addSnapshotSerializer(serializer);

describe("serializer", () => {
    test("number", () => {
        const ast = builders.number("12");
        expect(ast).toMatchInlineSnapshot(`12`);
    });

    test("identifier", () => {
        const ast = builders.identifier("a");
        expect(ast).toMatchInlineSnapshot(`a`);
    });

    test("identifier with subscript", () => {
        const ast = {
            type: "identifier",
            name: "a",
            subscript: {
                type: "identifier",
                name: "n",
            },
        };
        expect(ast).toMatchInlineSnapshot(`(ident a n)`);
    });

    test("neg", () => {
        const ast = builders.number("-12");
        expect(ast).toMatchInlineSnapshot(`(neg 12)`);
    });

    test("neg (subtraction)", () => {
        const ast = builders.addTerms([
            builders.identifier("x"),
            builders.neg(builders.number("5"), true),
        ]);
        expect(ast).toMatchInlineSnapshot(`
            (add
              x
              (neg.sub 5))
        `);
    });

    test("not", () => {
        const ast = {
            type: "not",
            arg: builders.identifier("A"),
        };
        expect(ast).toMatchInlineSnapshot(`(not A)`);
    });

    test("mul (explicit)", () => {
        const ast = builders.mulFactors([
            builders.number("2"),
            builders.identifier("x"),
        ]);
        expect(ast).toMatchInlineSnapshot(`(mul.exp 2 x)`);
    });

    test("mul (implicit)", () => {
        const ast = builders.mulFactors(
            [builders.number("2"), builders.identifier("x")],
            true,
        );
        expect(ast).toMatchInlineSnapshot(`(mul.imp 2 x)`);
    });

    test("add", () => {
        const ast = builders.addTerms([
            builders.identifier("x"),
            builders.number("5"),
        ]);
        expect(ast).toMatchInlineSnapshot(`(add x 5)`);
    });

    test("root", () => {
        const ast = builders.root(builders.identifier("x"));
        expect(ast).toMatchInlineSnapshot(`(root :radicand x :index 2)`);
    });

    test("pow", () => {
        const ast = builders.pow(
            builders.identifier("x"),
            builders.number("2"),
        );
        expect(ast).toMatchInlineSnapshot(`(pow :base x :exp 2)`);
    });

    test("pow (with grandchildren)", () => {
        const ast = builders.pow(
            builders.add([builders.identifier("x"), builders.number("1")]),
            builders.number("2"),
        );
        expect(ast).toMatchInlineSnapshot(`
            (pow
              :base (add x 1)
              :exp 2)
        `);
    });

    test("infinity", () => {
        const ast = {type: "infinity"};
        expect(ast).toMatchInlineSnapshot(`\u221e`);
    });

    test("unhandled node", () => {
        expect(() => {
            const ast: types.Node = {
                id: 0,
                type: "log",
                base: builders.number("2"),
                arg: builders.identifier("x"),
            };
            serializer.print(
                ast,
                () => "",
                () => "",
            );
        }).toThrowErrorMatchingInlineSnapshot(
            `"we don't handle serializing 'log' nodes yet"`,
        );
    });
});
