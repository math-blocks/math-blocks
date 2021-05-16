import fs from "fs";
import path from "path";
// @ts-expect-error: Blob is only available in node 15.7.0 onward
import {Blob} from "buffer";

import * as Typesetter from "@math-blocks/typesetter";
import * as Editor from "@math-blocks/editor-core";
import * as Semantic from "@math-blocks/semantic";
import {getFontData, parse} from "@math-blocks/opentype";

import type {FontData} from "@math-blocks/opentype";

const {row, glyph} = Editor.builders;

let stixFontData: FontData | null = null;

const toEqualEditorNodes = (
    received: readonly Editor.types.Node[],
    actual: readonly Editor.types.Node[],
): {message: () => string; pass: boolean} => {
    const message = "Editor nodes didn't match";
    if (Semantic.util.deepEquals(received, actual)) {
        return {
            message: () => message,
            pass: true,
        };
    }
    return {
        message: () => message,
        pass: false,
    };
};

expect.extend({toEqualEditorNodes});

const stixFontLoader = async (): Promise<FontData> => {
    if (stixFontData) {
        return stixFontData;
    }

    const fontPath = path.join(__dirname, "../../../../assets/STIX2Math.otf");
    const buffer = fs.readFileSync(fontPath);
    const blob = new Blob([buffer]);

    const font = await parse(blob);
    stixFontData = getFontData(font, "STIX2");

    return stixFontData;
};

type Point = {x: number; y: number};

const getSelectionZipper = async (
    math: Editor.types.Row,
    p1: Point,
    p2: Point,
): Promise<Editor.Zipper> => {
    const fontData = await stixFontLoader();
    const fontSize = 64;
    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Dynamic, // match how the editor renders
        cramped: false,
    };
    const scene = Typesetter.typeset(math, context);

    const startZipper = Editor.rowToZipper(
        math,
        Typesetter.SceneGraph.findIntersections(p1, scene.hitboxes),
    );

    const endZipper = Editor.rowToZipper(
        math,
        Typesetter.SceneGraph.findIntersections(p2, scene.hitboxes),
    );

    if (!startZipper) {
        throw new Error("startZipper is undefined");
    }

    if (!endZipper) {
        throw new Error("endZipper is undefined");
    }

    const zipper = Editor.selectionZipperFromZippers(startZipper, endZipper);

    if (!zipper) {
        throw new Error("zipper is undefined");
    }

    return zipper;
};

describe("moving cursor with mouse", () => {
    describe("simple row", () => {
        let math: Editor.types.Row;

        beforeEach(async () => {
            math = row([
                glyph("2"),
                glyph("x"),
                glyph("+"),
                glyph("5"),
                glyph("="),
                glyph("1"),
                glyph("0"),
            ]);
        });

        test("from left to right", async () => {
            const zipper = await getSelectionZipper(
                math,
                {x: 67, y: 30},
                {x: 257, y: 30},
            );

            expect(zipper.row.left).toEqualEditorNodes([
                glyph("2"),
                glyph("x"),
            ]);

            expect(zipper.row.selection?.nodes).toEqualEditorNodes([
                glyph("+"),
                glyph("5"),
                glyph("="),
            ]);

            expect(zipper.row.right).toEqualEditorNodes([
                glyph("1"),
                glyph("0"),
            ]);
        });

        test("from right to left", async () => {
            const zipper = await getSelectionZipper(
                math,
                {x: 257, y: 30},
                {x: 67, y: 30},
            );

            expect(zipper.row.left).toEqualEditorNodes([
                glyph("2"),
                glyph("x"),
            ]);

            expect(zipper.row.selection?.nodes).toEqualEditorNodes([
                glyph("+"),
                glyph("5"),
                glyph("="),
            ]);

            expect(zipper.row.right).toEqualEditorNodes([
                glyph("1"),
                glyph("0"),
            ]);
        });

        test("at the same location", async () => {
            const zipper = await getSelectionZipper(
                math,
                {x: 67, y: 30},
                {x: 67, y: 30},
            );

            expect(zipper.row.left).toEqualEditorNodes([
                glyph("2"),
                glyph("x"),
            ]);

            expect(zipper.row.selection).toBeNull();

            expect(zipper.row.right).toEqualEditorNodes([
                glyph("+"),
                glyph("5"),
                glyph("="),
                glyph("1"),
                glyph("0"),
            ]);
        });
    });

    describe("adding fractions", () => {
        let math: Editor.types.Row;

        beforeEach(() => {
            math = Editor.builders.row([
                Editor.builders.glyph("2"),
                Editor.builders.glyph("+"),
                Editor.builders.frac(
                    [
                        Editor.builders.frac(
                            [Editor.builders.glyph("a")],
                            [Editor.builders.glyph("b")],
                        ),
                        Editor.builders.glyph("+"),
                        Editor.builders.frac(
                            [Editor.builders.glyph("c")],
                            [Editor.builders.glyph("d")],
                        ),
                    ],
                    [Editor.builders.glyph("1")],
                ),
                Editor.builders.glyph("+"),
                Editor.builders.frac(
                    [
                        Editor.builders.frac(
                            [Editor.builders.glyph("x")],
                            [Editor.builders.glyph("y")],
                        ),
                        Editor.builders.glyph("+"),
                        Editor.builders.glyph("1"),
                    ],
                    [Editor.builders.glyph("1")],
                ),
                Editor.builders.glyph("\u2212"),
                Editor.builders.glyph("y"),
            ]);
        });

        test("two-levels deep, common node in root row", async () => {
            const zipper = await getSelectionZipper(
                math,
                {x: 150, y: 24},
                {x: 380, y: 24},
            );

            expect(zipper.row.left).toEqualEditorNodes([
                math.children[0],
                math.children[1],
            ]);

            expect(zipper.row.selection?.nodes).toEqualEditorNodes([
                math.children[2],
                math.children[3],
                math.children[4],
            ]);

            expect(zipper.row.right).toEqualEditorNodes([
                math.children[5],
                math.children[6],
            ]);
        });

        test("two-levels deep, common node in fraction numerator", async () => {
            const zipper = await getSelectionZipper(
                math,
                {x: 142, y: 24},
                {x: 244, y: 24},
            );

            expect(zipper.breadcrumbs).toHaveLength(1);
            expect(zipper.breadcrumbs[0].row.left).toEqualEditorNodes([
                math.children[0],
                math.children[1],
            ]);
            expect(zipper.breadcrumbs[0].row.right).toEqualEditorNodes([
                math.children[3],
                math.children[4],
                math.children[5],
                math.children[6],
            ]);

            // @ts-expect-error: we know math.chilren[2] is a "frac" node
            const numerator = math.children[2].children[0];

            expect(zipper.row.left).toEqualEditorNodes([]);

            // All nodes in the numerator are selected
            expect(zipper.row.selection?.nodes).toEqualEditorNodes(
                numerator.children,
            );

            expect(zipper.row.right).toEqualEditorNodes([]);
        });

        test("two-levels deep and one-level deep in fraction numerator", async () => {
            const zipper = await getSelectionZipper(
                math,
                {x: 145, y: 24},
                {x: 216, y: 54},
            );

            expect(zipper.breadcrumbs).toHaveLength(1);
            expect(zipper.breadcrumbs[0].row.left).toEqualEditorNodes([
                math.children[0],
                math.children[1],
            ]);
            expect(zipper.breadcrumbs[0].row.right).toEqualEditorNodes([
                math.children[3],
                math.children[4],
                math.children[5],
                math.children[6],
            ]);

            // @ts-expect-error: we know math.chilren[2] is a "frac" node
            const numerator = math.children[2].children[0];

            expect(zipper.row.left).toEqualEditorNodes([]);

            // All nodes in the numerator are selected
            expect(zipper.row.selection?.nodes).toEqualEditorNodes([
                numerator.children[0],
                numerator.children[1],
            ]);

            expect(zipper.row.right).toEqualEditorNodes([
                numerator.children[2],
            ]);
        });

        test("one-level deep and two-levels deep in fraction numerator", async () => {
            const zipper = await getSelectionZipper(
                math,
                {x: 216, y: 54},
                {x: 145, y: 24},
            );

            expect(zipper.breadcrumbs).toHaveLength(1);
            expect(zipper.breadcrumbs[0].row.left).toEqualEditorNodes([
                math.children[0],
                math.children[1],
            ]);
            expect(zipper.breadcrumbs[0].row.right).toEqualEditorNodes([
                math.children[3],
                math.children[4],
                math.children[5],
                math.children[6],
            ]);

            // @ts-expect-error: we know math.chilren[2] is a "frac" node
            const numerator = math.children[2].children[0];

            expect(zipper.row.left).toEqualEditorNodes([]);

            // All nodes in the numerator are selected
            expect(zipper.row.selection?.nodes).toEqualEditorNodes([
                numerator.children[0],
                numerator.children[1],
            ]);

            expect(zipper.row.right).toEqualEditorNodes([
                numerator.children[2],
            ]);
        });

        test("two-levels deep and at the root level", async () => {
            const zipper = await getSelectionZipper(
                math,
                {x: 145, y: 24},
                {x: 34, y: 112},
            );

            expect(zipper.row.left).toEqualEditorNodes([math.children[0]]);

            expect(zipper.row.selection?.nodes).toEqualEditorNodes([
                math.children[1],
                math.children[2],
            ]);

            expect(zipper.row.right).toEqualEditorNodes([
                math.children[3],
                math.children[4],
                math.children[5],
                math.children[6],
            ]);
        });

        test("at the root level and two-levels deep", async () => {
            const zipper = await getSelectionZipper(
                math,
                {x: 34, y: 112},
                {x: 145, y: 24},
            );

            expect(zipper.row.left).toEqualEditorNodes([math.children[0]]);

            expect(zipper.row.selection?.nodes).toEqualEditorNodes([
                math.children[1],
                math.children[2],
            ]);

            expect(zipper.row.right).toEqualEditorNodes([
                math.children[3],
                math.children[4],
                math.children[5],
                math.children[6],
            ]);
        });
    });
});
