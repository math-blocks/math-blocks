import {transformNode, applyColorMapToEditorNode} from "../transforms";
import * as builders from "../builders";
import * as types from "../types";

describe("transformNode", () => {
    describe("returns the same node if the callback is a passthrough", () => {
        test("simple row", () => {
            const node = builders.row([
                builders.glyph("x"),
                builders.glyph("+"),
                builders.glyph("y"),
            ]);

            const result = transformNode(node, (node) => node);

            expect(result).toBe(node);
        });

        test("fraction", () => {
            const node = builders.frac(
                [builders.glyph("x")],
                [builders.glyph("y")],
            );

            const result = transformNode(node, (node) => node);

            expect(result).toBe(node);
        });
    });

    describe("setting the color on every node only changes .style.color", () => {
        const setColor = <T extends types.Node>(node: T, color: string): T => {
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
                builders.glyph("x"),
                builders.glyph("+"),
                builders.glyph("y"),
            ]);

            const result = transformNode(node, (node) =>
                setColor(node, "blue"),
            );

            expect(result).not.toBe(node);
            node.style.color = "blue";
            node.children[0].style.color = "blue";
            node.children[1].style.color = "blue";
            node.children[2].style.color = "blue";
            expect(result).toEqual(node);
        });

        test("fraction", () => {
            const node = builders.frac(
                [builders.glyph("x")],
                [builders.glyph("y")],
            );

            const result = transformNode(node, (node) =>
                setColor(node, "blue"),
            );

            expect(result).not.toBe(node);
            node.style.color = "blue";
            node.children[0].style.color = "blue";
            node.children[1].style.color = "blue";
            node.children[0].children[0].style.color = "blue";
            node.children[1].children[0].style.color = "blue";
            expect(result).toEqual(node);
        });
    });
});

describe("applyColorMapToEditorNode", () => {
    test("simple row", () => {
        const node = builders.row([
            builders.glyph("x"),
            builders.glyph("+"),
            builders.glyph("y"),
        ]);

        const colorMap = new Map();
        colorMap.set(node.children[2].id, "blue");

        const result = applyColorMapToEditorNode(node, colorMap);

        expect(result).not.toBe(node);
        node.children[2].style.color = "blue";
        expect(result).toEqual(node);
    });

    test("fraction", () => {
        const node = builders.frac(
            [builders.glyph("x")],
            [builders.glyph("y")],
        );

        const colorMap = new Map();
        colorMap.set(node.children[1].children[0].id, "blue");

        const result = applyColorMapToEditorNode(node, colorMap);

        expect(result).not.toBe(node);
        node.children[1].children[0].style.color = "blue";
        expect(result).toEqual(node);
    });
});
