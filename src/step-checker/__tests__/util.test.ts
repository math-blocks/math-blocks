import * as Util from "../../semantic/util";

import {primeDecomp, findNodeById, replaceNodeWithId} from "../util";

import serializer from "../../semantic/semantic-serializer";
expect.addSnapshotSerializer(serializer);

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
});

describe("findNodeById", () => {
    test("finds the root node", () => {
        const root = Util.number("1");

        const node = findNodeById(root, root.id);

        expect(node).toBe(root);
    });

    test("finds a node in an array", () => {
        const one = Util.number("1");
        const two = Util.number("2");
        const root = Util.add([one, two]);

        const node = findNodeById(root, two.id);

        expect(node).toBe(two);
    });

    test("finds a node in named property", () => {
        const x = Util.number("x");
        const two = Util.number("2");
        const root = Util.exp(x, two);

        const node = findNodeById(root, two.id);

        expect(node).toMatchInlineSnapshot;
    });

    test("doesn't find a node", () => {
        const root = Util.number("1");

        const node = findNodeById(root, -1);

        expect(node).toBe(undefined);
    });
});

describe("replaceNode", () => {
    test("replaces a node in an array", () => {
        const one = Util.number("1");
        const two = Util.number("2");
        const root = Util.add([one, two]);
        const three = Util.number("3");

        replaceNodeWithId(root, two.id, three);

        expect(root).toMatchInlineSnapshot(`(add 1 3)`);
    });

    test("finds a node in named property", () => {
        const x = Util.number("x");
        const two = Util.number("2");
        const root = Util.exp(x, two);
        const three = Util.number("3");

        replaceNodeWithId(root, two.id, three);

        expect(root).toMatchInlineSnapshot(`(exp :base x :exp 3)`);
    });
});
