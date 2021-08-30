import {getId} from "@math-blocks/core";
import * as Semantic from "@math-blocks/semantic";

import {serializer} from "../serializer";

const {NodeType} = Semantic;

expect.addSnapshotSerializer(serializer);

describe("serializer", () => {
    test("number", () => {
        const ast = Semantic.builders.number("12");
        expect(ast).toMatchInlineSnapshot(`12`);
    });

    test("identifier", () => {
        const ast = Semantic.builders.identifier("a");
        expect(ast).toMatchInlineSnapshot(`a`);
    });

    test("identifier with subscript", () => {
        const ast: Semantic.types.NumericNode = {
            id: getId(),
            type: NodeType.Identifier,
            name: "a",
            subscript: {
                id: getId(),
                type: NodeType.Identifier,
                name: "n",
            },
        };
        expect(ast).toMatchInlineSnapshot(`(ident a n)`);
    });

    test("neg", () => {
        const ast = Semantic.builders.number("-12");
        expect(ast).toMatchInlineSnapshot(`(neg 12)`);
    });

    test("neg (subtraction)", () => {
        const ast = Semantic.builders.add([
            Semantic.builders.identifier("x"),
            Semantic.builders.neg(Semantic.builders.number("5"), true),
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
            arg: Semantic.builders.identifier("A"),
        };
        expect(ast).toMatchInlineSnapshot(`(not A)`);
    });

    test("mul (explicit)", () => {
        const ast = Semantic.builders.mul([
            Semantic.builders.number("2"),
            Semantic.builders.identifier("x"),
        ]);
        expect(ast).toMatchInlineSnapshot(`(mul.exp 2 x)`);
    });

    test("mul (implicit)", () => {
        const ast = Semantic.builders.mul(
            [Semantic.builders.number("2"), Semantic.builders.identifier("x")],
            true,
        );
        expect(ast).toMatchInlineSnapshot(`(mul.imp 2 x)`);
    });

    test("add", () => {
        const ast = Semantic.builders.add([
            Semantic.builders.identifier("x"),
            Semantic.builders.number("5"),
        ]);
        expect(ast).toMatchInlineSnapshot(`(add x 5)`);
    });

    test("root", () => {
        const ast = Semantic.builders.sqrt(Semantic.builders.identifier("x"));
        expect(ast).toMatchInlineSnapshot(`(root :radicand x :index 2)`);
    });

    test("pow", () => {
        const ast = Semantic.builders.pow(
            Semantic.builders.identifier("x"),
            Semantic.builders.number("2"),
        );
        expect(ast).toMatchInlineSnapshot(`(pow :base x :exp 2)`);
    });

    test("pow (with grandchildren)", () => {
        const ast = Semantic.builders.pow(
            Semantic.builders.add([
                Semantic.builders.identifier("x"),
                Semantic.builders.number("1"),
            ]),
            Semantic.builders.number("2"),
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
            const ast: Semantic.types.Node = {
                id: 0,
                type: NodeType.Log,
                base: Semantic.builders.number("2"),
                arg: Semantic.builders.identifier("x"),
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
