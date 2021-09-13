import * as Semantic from "@math-blocks/semantic";
import * as Testing from "@math-blocks/testing";

import {primeDecomp, findNodeById, replaceNodeWithId} from "../checks/util";

expect.addSnapshotSerializer(Testing.serializer);

describe("primeDecomp", () => {
    it("should return an empty array for decimal numbers", () => {
        expect(primeDecomp(17.8)).toEqual([]);
    });

    it("30 -> [2, 3, 5]", () => {
        expect(primeDecomp(30)).toEqual([2, 3, 5]);
    });

    it("10 -> [2, 5]", () => {
        expect(primeDecomp(10)).toEqual([2, 5]);
    });

    it("20 -> [2, 2, 5]", () => {
        expect(primeDecomp(20)).toEqual([2, 2, 5]);
    });

    it("36 -> [2, 2, 3, 3]", () => {
        expect(primeDecomp(36)).toEqual([2, 2, 3, 3]);
    });

    it("1 -> [1]", () => {
        expect(primeDecomp(1)).toEqual([1]);
    });
});

describe("findNodeById", () => {
    test("finds the root node", () => {
        const root = Semantic.builders.number("1");

        const node = findNodeById(root, root.id);

        expect(node).toBe(root);
    });

    test("finds a node in an array", () => {
        const one = Semantic.builders.number("1");
        const two = Semantic.builders.number("2");
        const root = Semantic.builders.add([one, two]);

        const node = findNodeById(root, two.id);

        expect(node).toBe(two);
    });

    test("finds a node in named property", () => {
        const x = Semantic.builders.number("x");
        const two = Semantic.builders.number("2");
        const root = Semantic.builders.pow(x, two);

        const node = findNodeById(root, two.id);

        expect(node).toMatchInlineSnapshot;
    });

    test("doesn't find a node", () => {
        const root = Semantic.builders.number("1");

        const node = findNodeById(root, -1);

        expect(node).toBe(undefined);
    });
});

describe("replaceNode", () => {
    test("replaces a node in an array", () => {
        const one = Semantic.builders.number("1");
        const two = Semantic.builders.number("2");
        const root = Semantic.builders.add([one, two]);
        const three = Semantic.builders.number("3");

        replaceNodeWithId(root, two.id, three);

        expect(root).toMatchInlineSnapshot(`(Add 1 3)`);
    });

    test("finds a node in named property", () => {
        const x = Semantic.builders.number("x");
        const two = Semantic.builders.number("2");
        const root = Semantic.builders.pow(x, two);
        const three = Semantic.builders.number("3");

        replaceNodeWithId(root, two.id, three);

        expect(root).toMatchInlineSnapshot(`(Power :base x :exp 3)`);
    });
});

describe("util.deepEquals", () => {
    test("ignores ids", () => {
        expect(
            Semantic.util.deepEquals(
                Semantic.builders.number("1"),
                Semantic.builders.number("1"),
            ),
        ).toBe(true);
    });

    test("returns false if the trees are different", () => {
        expect(
            Semantic.util.deepEquals(
                Semantic.builders.number("1"),
                Semantic.builders.number("2"),
            ),
        ).toBe(false);
    });

    test("returns false if implicit mul property doesn't match", () => {
        expect(
            Semantic.util.deepEquals(
                Semantic.builders.mul(
                    [
                        Semantic.builders.number("1"),
                        Semantic.builders.number("2"),
                    ],
                    true,
                ),
                Semantic.builders.mul(
                    [
                        Semantic.builders.number("1"),
                        Semantic.builders.number("2"),
                    ],
                    false,
                ),
            ),
        ).toBe(false);
    });

    test("returns false if subtraction neg property doesn't match", () => {
        expect(
            Semantic.util.deepEquals(
                Semantic.builders.neg(Semantic.builders.number("1"), true),
                Semantic.builders.neg(Semantic.builders.number("1"), false),
            ),
        ).toBe(false);
    });
});

describe("Semantic.util.difference", () => {
    it("should return an empty array if both have the same values", () => {
        const left = [
            Semantic.builders.number("1"),
            Semantic.builders.number("2"),
        ];
        const right = [
            Semantic.builders.number("1"),
            Semantic.builders.number("2"),
        ];
        const result = Semantic.util.difference(left, right);

        expect(result).toEqual([]);
    });

    it("should return the Semantic.util.difference for unique values", () => {
        const left = [
            Semantic.builders.number("1"),
            Semantic.builders.number("2"),
        ];
        const right = [Semantic.builders.number("2")];
        const result = Semantic.util.difference(left, right);

        expect(result).toEqual([left[0]]);
    });

    it("should return the original left array if there are no matches", () => {
        const left = [
            Semantic.builders.number("1"),
            Semantic.builders.number("2"),
        ];
        const right = [Semantic.builders.number("3")];
        const result = Semantic.util.difference(left, right);

        expect(result).toEqual(left);
    });

    it("should return the handle duplicates", () => {
        const left = [
            Semantic.builders.number("1"),
            Semantic.builders.number("1"),
        ];
        const right = [Semantic.builders.number("1")];
        const result = Semantic.util.difference(left, right);

        expect(result).toEqual([left[1]]);
    });
});
