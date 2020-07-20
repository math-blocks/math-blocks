import fs from "fs";
import path from "path";
import React from "react";
import ReactDOMServer from "react-dom/server";

import {typeset, Layout} from "@math-blocks/typesetter";
import * as Editor from "@math-blocks/editor";
import fontMetrics from "@math-blocks/metrics";

import {MathRenderer} from "@math-blocks/react";

const {glyph, row, frac, root, limits} = Editor;

const fontSize = 60;
const context = {
    fontMetrics: fontMetrics,
    baseFontSize: fontSize,
    multiplier: 1.0,
    cramped: false,
};

declare global {
    /* eslint-disable */
    namespace jest {
        interface Matchers<R, T> {
            toMatchSVGSnapshot(): R;
        }
    }
}

// Based on code from https://github.com/jest-community/jest-snapshots-svg/blob/master/src/index.ts
expect.extend({
    toMatchSVGSnapshot(element: React.ReactElement) {
        // getState isn't in the d.ts for Jest, this is ok though.
        const state = (expect as any).getState();
        const currentTest = state.testPath as string;
        const currentTestName = state.currentTestName as string;

        const testFile = currentTestName
            .replace(/\s+/g, "-")
            .replace(/\//g, "-")
            .toLowerCase();

        //  Figure out the paths
        const snapshotsDir = path.join(currentTest, "..", "__snapshots__");
        const expectedSnapshot = path.join(
            snapshotsDir,
            path.basename(currentTest) + "-" + testFile + ".svg",
        );

        // Make our folder if it's needed
        if (!fs.existsSync(snapshotsDir)) {
            fs.mkdirSync(snapshotsDir);
        }

        // We will need to do something smarter in the future, these snapshots need to be 1 file per test
        // whereas jest-snapshots can be multi-test per file.

        const output = ReactDOMServer.renderToStaticMarkup(element);
        const svgText =
            '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + output;

        // TODO: Determine if Jest is in `-u`?
        // can be done via the private API
        // state.snapshotState._updateSnapshot === "all"

        // Are we in write mode?
        if (!fs.existsSync(expectedSnapshot)) {
            fs.writeFileSync(expectedSnapshot, svgText);
            return {
                message: () => "Created a new Snapshot for you",
                pass: false,
            };
        } else {
            const contents = fs.readFileSync(expectedSnapshot, "utf8");
            if (contents !== svgText) {
                fs.writeFileSync(expectedSnapshot, svgText);
                return {
                    message: () =>
                        `SVG Snapshot failed: we have updated it for you`,
                    pass: false,
                };
            } else {
                return {message: () => "All good", pass: true};
            }
        }
    },
} as any);

describe("renderer", () => {
    test("equation", () => {
        const linearEquation = typeset(
            Editor.Util.row("2x+5=10"),
            context,
        ) as Layout.Box;

        expect(<MathRenderer box={linearEquation} />).toMatchSVGSnapshot();
    });

    test("pythagoras", () => {
        const pythagoras = typeset(
            row([
                glyph("a"),
                Editor.Util.sup("2"),
                glyph("+"),
                glyph("b"),
                Editor.Util.sup("2"),
                glyph("="),
                glyph("c"),
                Editor.Util.sup("2"),
            ]),
            context,
        ) as Layout.Box;

        expect(<MathRenderer box={pythagoras} />).toMatchSVGSnapshot();
    });

    test("quadratic", () => {
        const quadraticEquation = typeset(
            row([
                glyph("x"),
                glyph("="),
                frac(
                    [
                        glyph("\u2212"),
                        glyph("b"),
                        glyph("\u00B1"),
                        root(
                            [
                                glyph("b"),
                                Editor.Util.sup("2"),
                                glyph("\u2212"),
                                glyph("4"),
                                glyph("a"),
                                glyph("c"),
                            ],
                            [],
                        ),
                    ],
                    [glyph("2"), glyph("a")],
                ),
            ]),
            context,
        ) as Layout.Box;

        expect(<MathRenderer box={quadraticEquation} />).toMatchSVGSnapshot();
    });
});
