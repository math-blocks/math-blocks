import serializer from "../serializer";
import * as Util from "../util";
import * as Types from "../types";

expect.addSnapshotSerializer(serializer);

describe("serializer", () => {
    test("number", () => {
        const ast = Util.number("12");
        expect(ast).toMatchInlineSnapshot(`12`);
    });

    test("identifier", () => {
        const ast = Util.identifier("a");
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
        const ast = Util.number("-12");
        expect(ast).toMatchInlineSnapshot(`(neg 12)`);
    });

    test("neg (subtraction)", () => {
        const ast = Util.addTerms([
            Util.identifier("x"),
            Util.neg(Util.number("5"), true),
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
            arg: Util.identifier("A"),
        };
        expect(ast).toMatchInlineSnapshot(`(not A)`);
    });

    test("mul (explicit)", () => {
        const ast = Util.mulFactors([Util.number("2"), Util.identifier("x")]);
        expect(ast).toMatchInlineSnapshot(`(mul.exp 2 x)`);
    });

    test("mul (implicit)", () => {
        const ast = Util.mulFactors(
            [Util.number("2"), Util.identifier("x")],
            true,
        );
        expect(ast).toMatchInlineSnapshot(`(mul.imp 2 x)`);
    });

    test("add", () => {
        const ast = Util.addTerms([Util.identifier("x"), Util.number("5")]);
        expect(ast).toMatchInlineSnapshot(`(add x 5)`);
    });

    test("root", () => {
        const ast = Util.root(Util.identifier("x"));
        expect(ast).toMatchInlineSnapshot(`(root :radicand x :index 2)`);
    });

    test("pow", () => {
        const ast = Util.pow(Util.identifier("x"), Util.number("2"));
        expect(ast).toMatchInlineSnapshot(`(pow :base x :exp 2)`);
    });

    test("pow (with grandchildren)", () => {
        const ast = Util.pow(
            Util.add([Util.identifier("x"), Util.number("1")]),
            Util.number("2"),
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
            const ast: Types.Node = {
                id: 0,
                type: "log",
                base: Util.number("2"),
                arg: Util.identifier("x"),
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
