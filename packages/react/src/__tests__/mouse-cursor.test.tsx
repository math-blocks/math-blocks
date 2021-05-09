import fs from "fs";
import path from "path";
// @ts-expect-error: Blob is only available in node 15.7.0 onward
import {Blob} from "buffer";

import * as Typesetter from "@math-blocks/typesetter";
import * as Editor from "@math-blocks/editor-core";
import * as Semantic from "@math-blocks/semantic";
import {getFontData, parse} from "@math-blocks/opentype";

import type {FontData} from "@math-blocks/opentype";

const {row, glyph /*, frac, limits, root, subsup */} = Editor.builders;

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

describe("moving cursor with mouse", () => {
    describe("simple row", () => {
        test("middle of row", async () => {
            const fontData = await stixFontLoader();
            const math = row([
                glyph("2"),
                glyph("x"),
                glyph("+"),
                glyph("5"),
                glyph("="),
                glyph("1"),
                glyph("0"),
            ]);
            const fontSize = 64;
            const context: Typesetter.Context = {
                fontData: fontData,
                baseFontSize: fontSize,
                mathStyle: Typesetter.MathStyle.Display,
                renderMode: Typesetter.RenderMode.Static,
                cramped: false,
            };
            const scene = Typesetter.typeset(math, context);
            const point = {x: 131, y: 22};
            const intersections = Typesetter.SceneGraph.findIntersections(
                point,
                scene.hitboxes,
                {
                    x: scene.hitboxes.x,
                    y: scene.hitboxes.y,
                },
            );

            const zipper = Editor.rowToZipper(math, intersections);

            if (!zipper) {
                throw new Error("zipper is undefined");
            }

            expect(zipper.row.left).toEqualEditorNodes([
                glyph("2"),
                glyph("x"),
                glyph("+"),
            ]);

            expect(zipper.row.right).toEqualEditorNodes([
                glyph("5"),
                glyph("="),
                glyph("1"),
                glyph("0"),
            ]);
        });

        test("end of row", async () => {
            const fontData = await stixFontLoader();
            const math = row([
                glyph("2"),
                glyph("x"),
                glyph("+"),
                glyph("5"),
                glyph("="),
                glyph("1"),
                glyph("0"),
            ]);
            const fontSize = 64;
            const context: Typesetter.Context = {
                fontData: fontData,
                baseFontSize: fontSize,
                mathStyle: Typesetter.MathStyle.Display,
                renderMode: Typesetter.RenderMode.Static,
                cramped: false,
            };
            const scene = Typesetter.typeset(math, context);
            const point = {x: 311, y: 22};
            const intersections = Typesetter.SceneGraph.findIntersections(
                point,
                scene.hitboxes,
                {
                    x: scene.hitboxes.x,
                    y: scene.hitboxes.y,
                },
            );

            const zipper = Editor.rowToZipper(math, intersections);

            if (!zipper) {
                throw new Error("zipper is undefined");
            }

            expect(zipper.row.left).toEqualEditorNodes([
                glyph("2"),
                glyph("x"),
                glyph("+"),
                glyph("5"),
                glyph("="),
                glyph("1"),
                glyph("0"),
            ]);

            expect(zipper.row.right).toEqualEditorNodes([]);
        });
    });

    describe("fraction", () => {
        test.skip("numerator left");
        test.skip("numerator right");
        test.skip("numerator middle");

        test.skip("denominator left");
        test.skip("denominator right");
        test.skip("denominator middle");
    });

    describe("subsup", () => {
        test.skip("superscript left");
        test.skip("superscript right");

        test.skip("subscript left");
        test.skip("subscript right");
    });

    describe("root", () => {
        test.skip("index");
        test.skip("radicand");
    });

    describe("delimited", () => {
        test.skip("simple");
    });
});
