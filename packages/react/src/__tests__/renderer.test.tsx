import fs from "fs";
import path from "path";
import React from "react";
import ReactDOMServer from "react-dom/server";

import {typeset, Layout} from "@math-blocks/typesetter";
import * as Editor from "@math-blocks/editor";
import fontMetrics from "@math-blocks/metrics";

import {MathRenderer} from "@math-blocks/react";

const {glyph, row, frac, root, limits, subsup} = Editor;

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

        // TODO: format the output
        const output = ReactDOMServer.renderToStaticMarkup(element);
        const svgText =
            '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + output;

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
    test("equation", () => {
        const linearEquation = typeset(
            Editor.Util.row("2x+5=10"),
            context,
        ) as Layout.Box;

        expect(<MathRenderer box={linearEquation} />).toMatchSVGSnapshot();
    });

    describe("fractions", () => {
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

            expect(
                <MathRenderer box={quadraticEquation} />,
            ).toMatchSVGSnapshot();
        });
    });

    describe("subsup", () => {
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

        test("subscripts", () => {
            const recurrenceRelation = typeset(
                row([
                    glyph("a"),
                    Editor.Util.sup("n"),
                    glyph("="),
                    glyph("a"),
                    subsup([glyph("n"), glyph("\u2212"), glyph("1")]),
                    glyph("+"),
                    glyph("a"),
                    subsup([glyph("n"), glyph("\u2212"), glyph("2")]),
                ]),
                context,
            ) as Layout.Box;

            expect(
                <MathRenderer box={recurrenceRelation} />,
            ).toMatchSVGSnapshot();
        });
    });

    describe("limits", () => {
        test("lim", () => {
            const lim = typeset(
                row([
                    limits(row([glyph("l"), glyph("i"), glyph("m")]), [
                        glyph("x"),
                        glyph("—"),
                        glyph(">"),
                        glyph("0"),
                    ]),
                    glyph("x"),
                ]),
                context,
            ) as Layout.Box;

            expect(<MathRenderer box={lim} />).toMatchSVGSnapshot();
        });

        test("sum", () => {
            const sum = typeset(
                row([
                    limits(
                        glyph("\u03a3"),
                        [glyph("i"), glyph("="), glyph("0")],
                        [glyph("\u221e")],
                    ),
                    frac([glyph("1")], [glyph("2"), Editor.Util.sup("i")]),
                ]),
                context,
            ) as Layout.Box;

            expect(<MathRenderer box={sum} />).toMatchSVGSnapshot();
        });
    });

    // TODO: fix this after refactoring how we show work
    describe.skip("showing work", () => {
        test("subtracting from both sides", () => {
            const equationWithWork = typeset(
                Editor.Util.row("(2x-1)+5=10"),
                context,
                // {
                //     lhs: Editor.Util.row("-5"),
                //     rhs: Editor.Util.row("-5"),
                // },
            ) as Layout.Box;

            expect(
                <MathRenderer box={equationWithWork} />,
            ).toMatchSVGSnapshot();
        });
    });
});
