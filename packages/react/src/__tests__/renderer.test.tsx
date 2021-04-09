import fs from "fs";
import path from "path";
import React from "react";
import ReactDOMServer from "react-dom/server";
import format from "xml-formatter";
import type {Story, StoryContext} from "@storybook/react";

import * as Core from "@math-blocks/core";
import * as Typesetter from "@math-blocks/typesetter";
import * as Editor from "@math-blocks/editor-core";

import {comicSans} from "../../../../demo/src/comic-sans";
import MathRenderer from "../math-renderer";
import * as stories from "../stories/2-math-renderer.stories";
import storyMeta from "../stories/2-math-renderer.stories";

const {glyph, row, subsup} = Editor.builders;

const fontSize = 60;
const fontData = {
    fontMetrics: comicSans,
    fontFamily: "comic sans ms",
};
const context: Typesetter.Context = {
    fontData: fontData,
    baseFontSize: fontSize,
    mathStyle: Typesetter.MathStyle.Display,
    renderMode: Typesetter.RenderMode.Static,
    cramped: false,
};

const storyToComponent = async function <T>(
    story: Story<T>,
): Promise<React.FC> {
    const loaded = {};

    for (const value of await Promise.all(
        storyMeta.loaders.map((loader) => loader()),
    )) {
        Object.assign(loaded, value);
    }

    return () => {
        const context: StoryContext = {
            id: "",
            kind: "",
            name: "",
            parameters: {},
            args: {},
            argTypes: {},
            globals: {},
            loaded: loaded,
        };
        // @ts-expect-error: story expects T instead of Partial<T> | undefined
        return story(story.args, context);
    };
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

    test("equation", async () => {
        const Equation = await storyToComponent(stories.Equation);
        expect(<Equation />).toMatchSVGSnapshot();
    });

    describe("fractions", () => {
        test("colorized", async () => {
            const ColorizedFraction = await storyToComponent(
                stories.ColorizedFraction,
            );
            expect(<ColorizedFraction />).toMatchSVGSnapshot();
        });

        test("quadratic", async () => {
            const QuadraticEquation = await storyToComponent(
                stories.QuadraticEquation,
            );
            expect(<QuadraticEquation />).toMatchSVGSnapshot();
        });
    });

    describe("subsup", () => {
        test("pythagoras", async () => {
            const Pythagoras = await storyToComponent(stories.Pythagoras);
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

            const scene = Typesetter.typesetZipper(zipper, context);

            expect(<MathRenderer scene={scene} />).toMatchSVGSnapshot();
        });
    });

    describe("limits", () => {
        test("lim", async () => {
            const Limit = await storyToComponent(stories.Limit);
            expect(<Limit />).toMatchSVGSnapshot();
        });

        test("sum", async () => {
            const Summation = await storyToComponent(stories.Summation);
            expect(<Summation />).toMatchSVGSnapshot();
        });
    });

    describe("cursor", () => {
        test("cursor in the middle", async () => {
            const Cursor = await storyToComponent(stories.Cursor);
            expect(<Cursor />).toMatchSVGSnapshot();
        });
    });

    describe("selection", () => {
        test("selection in the middle", async () => {
            const Selection = await storyToComponent(stories.Selection);
            expect(<Selection />).toMatchSVGSnapshot();
        });
    });
});
