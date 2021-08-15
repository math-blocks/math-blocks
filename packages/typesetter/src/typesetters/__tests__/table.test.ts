import fs from "fs";
import path from "path";
// @ts-expect-error: Blob is only available in node 15.7.0 onward
import {Blob} from "buffer";
import * as Core from "@math-blocks/core";
import * as Editor from "@math-blocks/editor-core";
import {getFontData, parse} from "@math-blocks/opentype";
import type {FontData} from "@math-blocks/opentype";

import {MathStyle, RenderMode} from "../../enums";
import {typeset} from "../../typeset";

let stixFontData: FontData | null = null;

// TODO: dedupe with renderer.test.tsx
const stixFontLoader = async (): Promise<FontData> => {
    if (stixFontData) {
        return stixFontData;
    }

    const fontPath = path.join(
        __dirname,
        "../../../../../assets/STIX2Math.otf",
    );
    const buffer = fs.readFileSync(fontPath);
    const blob = new Blob([buffer]);

    const font = await parse(blob);
    stixFontData = getFontData(font, "STIX2");

    return stixFontData;
};

describe("typesetTable", () => {
    test("navigating across the bottom row should not change the content layout", async () => {
        const {char: glyph} = Editor.builders;
        const node: Editor.types.Table = Editor.builders.algebra(
            [
                // first row
                [],
                [glyph("2"), glyph("x")],
                [],
                [glyph("+")],
                [glyph("5")],
                [],
                [glyph("=")],
                [],
                [glyph("1"), glyph("0")],
                [],

                // second row
                [],
                [],
                [],
                [glyph("\u2212")],
                [glyph("5")],
                [],
                [],
                [glyph("\u2212")],
                [glyph("5")],
                [],

                // third row
                [],
                [glyph("2"), glyph("x")],
                [],
                [glyph("+")],
                [glyph("0")],
                [],
                [glyph("=")],
                [],
                [glyph("5")],
                [],
            ],
            10,
            3,
        );

        const bcRow: Editor.BreadcrumbRow = {
            id: Core.getId(),
            type: "bcrow",
            left: [],
            right: [],
            style: {},
        };

        const zipper: Editor.Zipper = {
            row: Editor.zrow(Core.getId(), [], [glyph("2"), glyph("x")]),
            breadcrumbs: [
                {
                    row: bcRow,
                    focus: Editor.nodeToFocus(node, 21),
                },
            ],
        };

        const moveRight = (
            state: Editor.State,
            count: number,
        ): Editor.State => {
            let newState = state;
            for (let i = 0; i < count; i++) {
                newState = Editor.reducer(newState, {type: "ArrowRight"});
            }
            return newState;
        };

        const fontData = await stixFontLoader();
        const fontSize = 60;
        const context = {
            fontData: fontData,
            baseFontSize: fontSize,
            mathStyle: MathStyle.Display,
            renderMode: RenderMode.Dynamic,
            cramped: false,
        };
        const options = {showCursor: true};

        // TODO: figure out why the content layer returned by typsetZipper
        // differs when the cursor position is updated.
        const originalScene = typeset(
            Editor.zipperToRow(zipper),
            context,
            options,
        );

        // We start with 1 here because originalScene is 0
        for (let i = 1; i < 8; i++) {
            const state = moveRight(Editor.stateFromZipper(zipper), i);

            const updatedScene = typeset(
                Editor.zipperToRow(state.zipper),
                context,
                options,
            );

            expect(updatedScene).toEqual(originalScene);
        }
    });
});
