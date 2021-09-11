import {getId} from "@math-blocks/core";

import {
    traverseNode,
    traverseZipper,
    applyColorMapToEditorNode,
} from "../transforms";
import * as builders from "../builders";
import * as types from "../types";
import type {Zipper} from "../../reducer/types";

describe("transformNode", () => {
    describe("returns the same node if the callback is a passthrough", () => {
        test("simple row", () => {
            const node = builders.row([
                builders.char("x"),
                builders.char("+"),
                builders.char("y"),
            ]);

            const result = traverseNode(
                node,
                {
                    exit: (node) => node,
                },
                [],
            );

            expect(result).toBe(node);
        });

        test("fraction", () => {
            const node = builders.frac(
                [builders.char("x")],
                [builders.char("y")],
            );

            const result = traverseNode(
                node,
                {
                    exit: (node) => node,
                },
                [],
            );

            expect(result).toBe(node);
        });
    });

    describe("setting the color on every node only changes .style.color", () => {
        const setColor = <T extends types.CharNode>(
            node: T,
            color: string,
        ): T => {
            return {
                ...node,
                style: {
                    ...node.style,
                    color: "blue",
                },
            };
        };

        test("simple row", () => {
            const node = builders.row([
                builders.char("x"),
                builders.char("+"),
                builders.char("y"),
            ]);

            const result = traverseNode(
                node,
                {
                    exit: (node) => setColor(node, "blue"),
                },
                [],
            );

            expect(result).not.toBe(node);
            // @ts-expect-error: ignore readonly
            node.style.color = "blue";
            // @ts-expect-error: ignore readonly
            node.children[0].style.color = "blue";
            // @ts-expect-error: ignore readonly
            node.children[1].style.color = "blue";
            // @ts-expect-error: ignore readonly
            node.children[2].style.color = "blue";
            expect(result).toEqual(node);
        });

        test("fraction", () => {
            const node = builders.frac(
                [builders.char("x")],
                [builders.char("y")],
            );

            const result = traverseNode(
                node,
                {
                    exit: (node) => setColor(node, "blue"),
                },
                [],
            );

            expect(result).not.toBe(node);
            // @ts-expect-error: ignore readonly
            node.style.color = "blue";
            // @ts-expect-error: ignore readonly
            node.children[0].style.color = "blue";
            // @ts-expect-error: ignore readonly
            node.children[1].style.color = "blue";
            // @ts-expect-error: ignore readonly
            node.children[0].children[0].style.color = "blue";
            // @ts-expect-error: ignore readonly
            node.children[1].children[0].style.color = "blue";
            expect(result).toEqual(node);
        });
    });
});

describe("transformZipper", () => {
    describe("returns the same node if the callback is a passthrough", () => {
        test("simple row", () => {
            const zipper: Zipper = {
                breadcrumbs: [],
                row: {
                    id: getId(),
                    type: "zrow",
                    left: [builders.char("x")],
                    selection: [builders.char("+")],
                    right: [builders.char("y")],
                    style: {},
                },
            };

            const result = traverseZipper(
                zipper,
                {
                    exit: (node) => node,
                },
                [],
            );

            // TODO: don't create new objects unless something's changed
            expect(result).toEqual(zipper);
        });

        test("fraction", () => {
            const zipper: Zipper = {
                breadcrumbs: [
                    {
                        focus: {
                            type: "zfrac",
                            id: getId(),
                            left: [],
                            right: [builders.row([builders.char("y")])],
                            style: {},
                        },
                        row: {
                            type: "bcrow",
                            id: getId(),
                            left: [builders.char("1"), builders.char("+")],
                            right: [],
                            style: {},
                        },
                    },
                ],
                row: {
                    type: "zrow",
                    id: getId(),
                    left: [],
                    selection: [],
                    right: [builders.char("x")],
                    style: {},
                },
            };

            const result = traverseZipper(
                zipper,
                {
                    exit: (node) => node,
                },
                [],
            );

            // TODO: don't create new objects unless something's changed
            expect(result).toEqual(zipper);
        });
    });

    describe("setting the color on every node only changes .style.color", () => {
        test("fraction", () => {
            const zipper: Zipper = {
                breadcrumbs: [
                    {
                        focus: {
                            type: "zfrac",
                            id: getId(),
                            left: [],
                            right: [builders.row([builders.char("y")])],
                            style: {},
                        },
                        row: {
                            type: "bcrow",
                            id: getId(),
                            left: [builders.char("1"), builders.char("+")],
                            right: [],
                            style: {},
                        },
                    },
                ],
                row: {
                    type: "zrow",
                    id: getId(),
                    left: [],
                    selection: [],
                    right: [builders.char("x")],
                    style: {},
                },
            };

            const fracId = zipper.breadcrumbs[0].focus.id;
            let inSelection = false;

            const result = traverseZipper(
                zipper,
                {
                    enter: (node) => {
                        if (node.type !== "char" && node.id === fracId) {
                            inSelection = true;
                        }
                    },
                    exit: (node) => {
                        if (node.type !== "char" && node.id === fracId) {
                            inSelection = false;
                        }
                        if (inSelection || node.id === fracId) {
                            return {
                                ...node,
                                style: {
                                    ...node.style,
                                    color: "blue",
                                },
                            };
                        }
                    },
                },
                [],
            );

            expect(result).not.toEqual(zipper);
            // @ts-expect-error: ignore readonly
            zipper.breadcrumbs[0].focus.style.color = "blue";
            // @ts-expect-error: we know that focus.right[0] is defined
            zipper.breadcrumbs[0].focus.right[0].style.color = "blue";
            // @ts-expect-error: we know that focus.right[0] is defined
            zipper.breadcrumbs[0].focus.right[0].children[0].style.color =
                "blue";
            // @ts-expect-error: ignore readonly
            zipper.breadcrumbs[0].row.style.color = "blue";
            // @ts-expect-error: ignore readonly
            zipper.breadcrumbs[0].row.left[0].style.color = "blue";
            // @ts-expect-error: ignore readonly
            zipper.breadcrumbs[0].row.left[1].style.color = "blue";
            // @ts-expect-error: ignore readonly
            zipper.row.right[0].style.color = "blue";
            // @ts-expect-error: ignore readonly
            zipper.row.style.color = "blue";
            expect(result).toEqual(zipper);
        });
    });
});

describe("applyColorMapToEditorNode", () => {
    test("simple row", () => {
        const node = builders.row([
            builders.char("x"),
            builders.char("+"),
            builders.char("y"),
        ]);

        const colorMap = new Map();
        colorMap.set(node.children[2].id, "blue");

        const result = applyColorMapToEditorNode(node, colorMap);

        expect(result).not.toBe(node);
        // @ts-expect-error: ignore readonly
        node.children[2].style.color = "blue";
        expect(result).toEqual(node);
    });

    test("fraction", () => {
        const node = builders.frac([builders.char("x")], [builders.char("y")]);

        const colorMap = new Map();
        colorMap.set(node.children[1].children[0].id, "blue");

        const result = applyColorMapToEditorNode(node, colorMap);

        expect(result).not.toBe(node);
        // @ts-expect-error: ignore readonly
        node.children[1].children[0].style.color = "blue";
        expect(result).toEqual(node);
    });
});
