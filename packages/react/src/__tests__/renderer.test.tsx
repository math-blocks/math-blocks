import fs from "fs";
import path from "path";
import React from "react";
import ReactDOMServer from "react-dom/server";
import format from "xml-formatter";

import * as Core from "@math-blocks/core";
import {typesetZipper} from "@math-blocks/typesetter";
import * as Editor from "@math-blocks/editor-core";
import {comicSans} from "@math-blocks/metrics";

import MathRenderer from "../math-renderer";
import {
    ColorizedFraction,
    Equation,
    Limit,
    Pythagoras,
    QuadraticEquation,
    Summation,
    Cursor,
    Selection,
} from "../stories/2-math-renderer.stories";

const {glyph, row, subsup} = Editor.builders;

const fontSize = 60;
const fontData = {
    fontMetrics: comicSans,
    fontFamily: "comic sans ms",
};
const context = {
    fontData: fontData,
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

        // TODO: format the output
        const output = ReactDOMServer.renderToStaticMarkup(element);
        const svgText = format(
            '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + output,
        );

        // TODO: Determine if Jest is in `-u`?
        // can be done via the private API
        // state.snapshotState._updateSnapshot === "all"
        const mode = state.snapshotState._updateSnapshot;

        // Are we in write mode?
        if (!fs.existsSync(expectedSnapshot)) {
            fs.writeFileSync(expectedSnapshot, svgText);
            return {
                message: () => "Created a new Snapshot",
                pass: true,
            };
        } else {
            const contents = fs.readFileSync(expectedSnapshot, "utf8");
            if (contents !== svgText) {
                if (mode === "all") {
                    fs.writeFileSync(expectedSnapshot, svgText);
                    return {
                        message: () => `Updated snapshot`,
                        pass: true,
                    };
                }

                // TODO: include the diff in the message
                return {
                    message: () => `SVG Snapshot failed`,
                    pass: false,
                };
            } else {
                return {message: () => "All good", pass: true};
            }
        }
    },
} as any);

describe("renderer", () => {
    beforeEach(() => {
        // Mock getId() so that we can have stable ids between tests.
        let i = 0;
        jest.spyOn(Core, "getId").mockImplementation(() => {
            return i++;
        });
    });

    test("equation", () => {
        expect(<Equation />).toMatchSVGSnapshot();
    });

    describe("fractions", () => {
        test("colorized", () => {
            expect(<ColorizedFraction />).toMatchSVGSnapshot();
        });

        test("quadratic", () => {
            expect(<QuadraticEquation />).toMatchSVGSnapshot();
        });
    });

    describe("subsup", () => {
        test("pythagoras", () => {
            expect(<Pythagoras />).toMatchSVGSnapshot();
        });

        test("subscripts", () => {
            const node = row([
                glyph("a"),
                Editor.util.sup("n"),
                glyph("="),
                glyph("a"),
                subsup([glyph("n"), glyph("\u2212"), glyph("1")]),
                glyph("+"),
                glyph("a"),
                subsup([glyph("n"), glyph("\u2212"), glyph("2")]),
            ]);

            const zipper: Editor.Zipper = {
                breadcrumbs: [],
                row: {
                    id: node.id,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: node.children,
                },
            };

            const scene = typesetZipper(zipper, context);

            expect(<MathRenderer scene={scene} />).toMatchSVGSnapshot();
        });
    });

    describe("limits", () => {
        test("lim", () => {
            expect(<Limit />).toMatchSVGSnapshot();
        });

        test("sum", () => {
            expect(<Summation />).toMatchSVGSnapshot();
        });
    });

    describe("cursor", () => {
        test("cursor in the middle", () => {
            expect(<Cursor />).toMatchSVGSnapshot();
        });
    });

    describe("selection", () => {
        test("selection in the middle", () => {
            expect(<Selection />).toMatchSVGSnapshot();
        });
    });
});
