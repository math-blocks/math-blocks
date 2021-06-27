import fs from "fs";
import path from "path";
import React from "react";
import ReactDOMServer from "react-dom/server";
import format from "xml-formatter";
// @ts-expect-error: Blob is only available in node 15.7.0 onward
import {Blob} from "buffer";
import type {Story, StoryContext} from "@storybook/react";

import * as Core from "@math-blocks/core";
import * as Typesetter from "@math-blocks/typesetter";
import * as Editor from "@math-blocks/editor-core";
import {getFontData, parse} from "@math-blocks/opentype";
import type {FontData} from "@math-blocks/opentype";

import MathRenderer from "../math-renderer";
import * as stories from "../stories/2-math-renderer.stories";

const {glyph, row, subsup} = Editor.builders;

let stixFontData: FontData | null = null;
let lmFontData: FontData | null = null;

// We can't use the same loader since the storybook one relies on webpack's
// file-loader which we don't have access to here.
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

const lmFontLoader = async (): Promise<FontData> => {
    if (lmFontData) {
        return lmFontData;
    }

    const fontPath = path.join(
        __dirname,
        "../../../../assets/latinmodern-math.otf",
    );
    const buffer = fs.readFileSync(fontPath);
    const blob = new Blob([buffer]);

    const font = await parse(blob);
    lmFontData = getFontData(font, "LM-Math");

    return lmFontData;
};

const storyToComponent = async function <T>(
    story: Story<T>,
    loaders = [stixFontLoader],
): Promise<React.FC> {
    const loaded = {};

    if (loaders) {
        for (const value of await Promise.all(
            loaders.map((loader) => loader()),
        )) {
            Object.assign(loaded, value);
        }
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

    describe("latin modern", () => {
        test("equation", async () => {
            const Equation = await storyToComponent(stories.Equation, [
                lmFontLoader,
            ]);
            expect(<Equation />).toMatchSVGSnapshot();
        });

        test("tall delimiters, root, and fraction", async () => {
            const TallDelimiters = await storyToComponent(
                stories.TallDelimiters,
                [lmFontLoader],
            );
            expect(<TallDelimiters />).toMatchSVGSnapshot();
        });
    });

    describe("radicals", () => {
        describe.each`
            fontname          | fontloader
            ${"stix"}         | ${stixFontLoader}
            ${"latin modern"} | ${lmFontLoader}
        `("$fontname", ({fontloader}) => {
            test("with degree (dynamic)", async () => {
                const RadicalWithDegreeDynamic = await storyToComponent(
                    stories.RadicalWithDegreeDynamic,
                    [fontloader],
                );
                expect(<RadicalWithDegreeDynamic />).toMatchSVGSnapshot();
            });

            test("with large degree (dynamic)", async () => {
                const RadicalWithLargeDegreeDynamic = await storyToComponent(
                    stories.RadicalWithLargeDegreeDynamic,
                    [fontloader],
                );
                expect(<RadicalWithLargeDegreeDynamic />).toMatchSVGSnapshot();
            });
        });
    });

    describe("subscript and superscripts", () => {
        describe.each`
            fontname          | fontloader
            ${"stix"}         | ${stixFontLoader}
            ${"latin modern"} | ${lmFontLoader}
        `("$fontname", ({fontloader}) => {
            test("stress test (dynamic)", async () => {
                const SubscriptSuperscriptStressTest = await storyToComponent(
                    stories.SubscriptSuperscriptStressTest,
                    [fontloader],
                );
                expect(<SubscriptSuperscriptStressTest />).toMatchSVGSnapshot();
            });

            test("on tall delimiters (dynamic)", async () => {
                const ScriptsOnTallDelimiters = await storyToComponent(
                    stories.ScriptsOnTallDelimiters,
                    [fontloader],
                );
                expect(<ScriptsOnTallDelimiters />).toMatchSVGSnapshot();
            });
        });

        describe("cursor with tall delimiters", () => {
            let state: Editor.State;
            let context: Typesetter.Context;
            let options: Typesetter.Options;
            beforeEach(async () => {
                const fontData = await stixFontLoader();
                const editNode = Editor.builders.row([
                    Editor.builders.delimited(
                        [
                            Editor.builders.frac(
                                [glyph("y"), glyph("\u2212"), glyph("1")],
                                [glyph("x")],
                            ),
                        ],
                        glyph("("),
                        glyph(")"),
                    ),
                    subsup([glyph("n")], [glyph("2")]),
                ]);

                const fontSize = 60;
                context = {
                    fontData: fontData,
                    baseFontSize: fontSize,
                    mathStyle: Typesetter.MathStyle.Display,
                    renderMode: Typesetter.RenderMode.Dynamic,
                    cramped: false,
                };
                const zipper: Editor.Zipper = {
                    row: {
                        type: "zrow",
                        id: editNode.id,
                        left: editNode.children,
                        selection: [],
                        right: [],
                        style: {},
                    },
                    breadcrumbs: [],
                };
                state = {
                    startZipper: zipper,
                    endZipper: zipper,
                    zipper: zipper,
                    selecting: false,
                };
                // TODO: update typesetZipper to default showCursor to true
                options = {
                    showCursor: true,
                };
            });

            test("1 cursor at the end", () => {
                expect(
                    <MathRenderer
                        scene={Typesetter.typesetZipper(
                            state.zipper,
                            context,
                            options,
                        )}
                    />,
                ).toMatchSVGSnapshot();
            });

            test("2 cursor in superscript", () => {
                const moveLeft = () => {
                    state = Editor.reducer(state, {type: "ArrowLeft"});
                };
                moveLeft();

                expect(
                    <MathRenderer
                        scene={Typesetter.typesetZipper(
                            state.zipper,
                            context,
                            options,
                        )}
                    />,
                ).toMatchSVGSnapshot();
            });

            test("3 cursor in subscript", () => {
                const moveLeft = () => {
                    state = Editor.reducer(state, {type: "ArrowLeft"});
                };
                moveLeft();
                moveLeft();
                moveLeft();

                expect(
                    <MathRenderer
                        scene={Typesetter.typesetZipper(
                            state.zipper,
                            context,
                            options,
                        )}
                    />,
                ).toMatchSVGSnapshot();
            });

            test("4 cursor inside delimited", () => {
                const moveLeft = () => {
                    state = Editor.reducer(state, {type: "ArrowLeft"});
                };
                moveLeft();
                moveLeft();
                moveLeft();
                moveLeft();
                moveLeft();

                expect(
                    <MathRenderer
                        scene={Typesetter.typesetZipper(
                            state.zipper,
                            context,
                            options,
                        )}
                    />,
                ).toMatchSVGSnapshot();
            });
        });

        describe("selection with tall delimiters", () => {
            let state: Editor.State;
            let context: Typesetter.Context;
            let options: Typesetter.Options;
            beforeEach(async () => {
                const fontData = await stixFontLoader();
                const editNode = Editor.builders.row([
                    Editor.builders.delimited(
                        [
                            Editor.builders.frac(
                                [glyph("y"), glyph("\u2212"), glyph("1")],
                                [glyph("x")],
                            ),
                        ],
                        glyph("("),
                        glyph(")"),
                    ),
                    subsup([glyph("n")], [glyph("2")]),
                ]);

                const fontSize = 60;
                context = {
                    fontData: fontData,
                    baseFontSize: fontSize,
                    mathStyle: Typesetter.MathStyle.Display,
                    renderMode: Typesetter.RenderMode.Dynamic,
                    cramped: false,
                };
                const startZipper: Editor.Zipper = {
                    row: {
                        type: "zrow",
                        id: editNode.id,
                        left: editNode.children,
                        selection: [],
                        right: [],
                        style: {},
                    },
                    breadcrumbs: [],
                };
                // TODO: update typesetZipper to default showCursor to true
                options = {
                    showCursor: true,
                };
                state = {
                    startZipper: startZipper,
                    endZipper: startZipper,
                    zipper: startZipper,
                    selecting: false,
                };

                const moveLeft = () => {
                    state = Editor.reducer(state, {
                        type: "ArrowLeft",
                    });
                };
                moveLeft(); // into subscript
                moveLeft();
                moveLeft(); // into superscript
                moveLeft();
                moveLeft(); // outside delimited
                moveLeft(); // inside delimited
                moveLeft(); // into denominator
                moveLeft();
            });

            test("1 selection in denominator", () => {
                state = {...state, selecting: true};
                const selectRight = () => {
                    state = Editor.reducer(state, {type: "ArrowRight"});
                };
                selectRight();

                expect(
                    <MathRenderer
                        scene={Typesetter.typesetZipper(
                            state.zipper,
                            context,
                            options,
                        )}
                    />,
                ).toMatchSVGSnapshot();
            });

            test("2 fraction selected", () => {
                state = {...state, selecting: true};
                const selectRight = () => {
                    state = Editor.reducer(state, {type: "ArrowRight"});
                };
                selectRight();
                selectRight();

                expect(
                    <MathRenderer
                        scene={Typesetter.typesetZipper(
                            state.zipper,
                            context,
                            options,
                        )}
                    />,
                ).toMatchSVGSnapshot();
            });

            test("3 delimited selected", () => {
                state = {...state, selecting: true};
                const selectRight = () => {
                    state = Editor.reducer(state, {type: "ArrowRight"});
                };
                selectRight();
                selectRight();
                selectRight();

                expect(
                    <MathRenderer
                        scene={Typesetter.typesetZipper(
                            state.zipper,
                            context,
                            options,
                        )}
                    />,
                ).toMatchSVGSnapshot();
            });

            test("4 subsup selected", () => {
                state = {...state, selecting: true};
                const selectRight = () => {
                    state = Editor.reducer(state, {type: "ArrowRight"});
                };
                selectRight();
                selectRight();
                selectRight();
                selectRight();

                expect(
                    <MathRenderer
                        scene={Typesetter.typesetZipper(
                            state.zipper,
                            context,
                            options,
                        )}
                    />,
                ).toMatchSVGSnapshot();
            });
        });
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

        test("subscripts", async () => {
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
                    selection: [],
                    right: node.children,
                    style: {},
                },
            };

            const fontData = await stixFontLoader();
            const fontSize = 60;
            const context: Typesetter.Context = {
                fontData: fontData,
                baseFontSize: fontSize,
                mathStyle: Typesetter.MathStyle.Display,
                renderMode: Typesetter.RenderMode.Static,
                cramped: false,
            };

            const scene = Typesetter.typesetZipper(zipper, context);

            expect(
                <MathRenderer scene={scene} style={{background: "white"}} />,
            ).toMatchSVGSnapshot();
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

    describe("tall delimiters", () => {
        test("no cursor, no selection", async () => {
            const TallDelimiters = await storyToComponent(
                stories.TallDelimiters,
            );
            expect(<TallDelimiters />).toMatchSVGSnapshot();
        });

        test("with cursor", async () => {
            const TallDelimitersWithCursor = await storyToComponent(
                stories.TallDelimitersWithCursor,
            );
            expect(<TallDelimitersWithCursor />).toMatchSVGSnapshot();
        });

        test("with selection", async () => {
            const TallDelimitersWithSelection = await storyToComponent(
                stories.TallDelimitersWithSelection,
            );
            expect(<TallDelimitersWithSelection />).toMatchSVGSnapshot();
        });
    });

    describe("cursor", () => {
        test("cursor in the middle", async () => {
            const Cursor = await storyToComponent(stories.Cursor);
            expect(<Cursor />).toMatchSVGSnapshot();
        });

        test("cursor in front of operator", async () => {
            const zipper: Editor.Zipper = {
                breadcrumbs: [],
                row: {
                    id: Core.getId(),
                    type: "zrow",
                    left: [glyph("2")],
                    selection: [],
                    right: [glyph("+"), glyph("a")],
                    style: {},
                },
            };

            const fontData = await stixFontLoader();
            const fontSize = 60;
            const context = {
                fontData: fontData,
                baseFontSize: fontSize,
                mathStyle: Typesetter.MathStyle.Display,
                renderMode: Typesetter.RenderMode.Dynamic,
                cramped: false,
            };
            const options = {showCursor: true};

            expect(
                <MathRenderer
                    scene={Typesetter.typesetZipper(zipper, context, options)}
                />,
            ).toMatchSVGSnapshot();
        });
    });

    describe("selection", () => {
        test("selection in the middle", async () => {
            const Selection = await storyToComponent(stories.Selection);
            expect(<Selection />).toMatchSVGSnapshot();
        });
    });

    describe("cancelling", () => {
        test("multiple selections side-by-side, frac, radicand", async () => {
            const Cancelling = await storyToComponent(stories.Cancelling);
            expect(<Cancelling />).toMatchSVGSnapshot();
        });
    });

    describe("tables", () => {
        test("3x3 bracket matrix", async () => {
            const Matrix = await storyToComponent(stories.Matrix);
            expect(<Matrix />).toMatchSVGSnapshot();
        });

        test("showing work vertically", async () => {
            const VerticalWork = await storyToComponent(stories.VerticalWork);
            expect(<VerticalWork />).toMatchSVGSnapshot();
        });
    });

    describe("showing work vertically", () => {
        const {glyph} = Editor.builders;
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
                [],
                [],
                [],
                [],
                [],
                [],
                [],
            ],
            10,
            2,
        );

        const bcRow: Editor.BreadcrumbRow = {
            id: Core.getId(),
            type: "bcrow",
            left: [],
            right: [],
            style: {},
        };

        const zipper: Editor.Zipper = {
            row: Editor.zrow(Core.getId(), [], []),
            breadcrumbs: [
                {
                    row: bcRow,
                    focus: Editor.nodeToFocus(node, 10),
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

        test.each`
            column
            ${0}
            ${1}
            ${2}
            ${3}
            ${4}
            ${5}
            ${6}
            ${7}
            ${8}
            ${9}
        `("row 2, column $column", async ({column}) => {
            const fontData = await stixFontLoader();
            const fontSize = 60;
            const context = {
                fontData: fontData,
                baseFontSize: fontSize,
                mathStyle: Typesetter.MathStyle.Display,
                renderMode: Typesetter.RenderMode.Dynamic,
                cramped: false,
            };
            const options = {showCursor: true};

            const state = moveRight(Editor.stateFromZipper(zipper), column);
            const scene = Typesetter.typesetZipper(
                state.zipper,
                context,
                options,
            );
            expect(<MathRenderer scene={scene} />).toMatchSVGSnapshot();
        });

        test("don't pad an empty cell in the bottom row if there is an non-empty cell above", async () => {
            const {glyph} = Editor.builders;
            const node: Editor.types.Table = Editor.builders.algebra(
                [
                    // first row
                    [glyph("x")],
                    [],
                    [glyph("=")],
                    [],
                    [glyph("y")],

                    // second row
                    [],
                    [glyph("+"), glyph("1")],
                    [],
                    [],
                    [],

                    // third row
                    [],
                    [],
                    [],
                    [],
                    [],
                ],
                5,
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
                row: Editor.zrow(Core.getId(), [], []),
                breadcrumbs: [
                    {
                        row: bcRow,
                        // third row, second column
                        focus: Editor.nodeToFocus(node, 11),
                    },
                ],
            };

            const fontData = await stixFontLoader();
            const fontSize = 60;
            const context = {
                fontData: fontData,
                baseFontSize: fontSize,
                mathStyle: Typesetter.MathStyle.Display,
                renderMode: Typesetter.RenderMode.Dynamic,
                cramped: false,
            };
            const options = {showCursor: true};

            const scene = Typesetter.typesetZipper(zipper, context, options);
            expect(<MathRenderer scene={scene} />).toMatchSVGSnapshot();
        });

        test("don't pad an empty cell in the middle row if there is non-empty cells in below it", async () => {
            const {glyph} = Editor.builders;
            const node: Editor.types.Table = Editor.builders.algebra(
                [
                    // first row
                    [glyph("x")],
                    [],
                    [glyph("=")],
                    [],
                    [glyph("y")],

                    // second row
                    [],
                    [],
                    [],
                    [],
                    [],

                    // third row
                    [],
                    [glyph("+"), glyph("1")],
                    [],
                    [],
                    [],
                ],
                5,
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
                row: Editor.zrow(Core.getId(), [], []),
                breadcrumbs: [
                    {
                        row: bcRow,
                        // second row, second column
                        focus: Editor.nodeToFocus(node, 6),
                    },
                ],
            };

            const fontData = await stixFontLoader();
            const fontSize = 60;
            const context = {
                fontData: fontData,
                baseFontSize: fontSize,
                mathStyle: Typesetter.MathStyle.Display,
                renderMode: Typesetter.RenderMode.Dynamic,
                cramped: false,
            };
            const options = {showCursor: true};

            const scene = Typesetter.typesetZipper(zipper, context, options);
            expect(<MathRenderer scene={scene} />).toMatchSVGSnapshot();
        });
    });
});
