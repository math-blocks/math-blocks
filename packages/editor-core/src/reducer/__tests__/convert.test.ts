import * as builders from "../../builders";

import {zipperToRow} from "../convert";
import {SelectionDir} from "../enums";
import {row, toEqualEditorNodes} from "../test-util";

import type {Zipper} from "../types";

expect.extend({toEqualEditorNodes});

describe("zipperToRow", () => {
    describe("no breadcrumbs", () => {
        test("empty zipper", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: [],
                },
                breadcrumbs: [],
            };

            const row = zipperToRow(zipper);

            expect(row.children).toEqualEditorNodes([]);
        });

        test("zipper with no breadcrumbs and no selection", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: row("1+").children,
                    selection: null,
                    right: row("2").children,
                },
                breadcrumbs: [],
            };

            const result = zipperToRow(zipper);

            expect(result.children).toEqualEditorNodes(row("1+2").children);
        });

        test("zipper with selection but no breadcrumbs", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: row("1").children,
                    selection: {
                        dir: SelectionDir.Right,
                        nodes: row("+").children,
                    },
                    right: row("2").children,
                },
                breadcrumbs: [],
            };

            const result = zipperToRow(zipper);

            expect(result.children).toEqualEditorNodes(row("1+2").children);
        });
    });

    describe("with breadcrumbs", () => {
        test("no selection", () => {
            const zipper: Zipper = {
                // numerator
                row: {
                    id: 1,
                    type: "zrow",
                    left: row("2").children,
                    selection: null,
                    right: [],
                },
                breadcrumbs: [
                    {
                        // root row
                        row: {
                            id: 0,
                            type: "zrow",
                            left: row("1+").children,
                            selection: null,
                            right: row("+4").children,
                        },
                        // denominator
                        focus: {
                            id: 2,
                            type: "zfrac",
                            dir: 0,
                            other: row("3"),
                        },
                    },
                ],
            };

            const result = zipperToRow(zipper);

            expect(result.children).toEqualEditorNodes(
                builders.row([
                    builders.glyph("1"),
                    builders.glyph("+"),
                    builders.frac(row("2").children, row("3").children),
                    builders.glyph("+"),
                    builders.glyph("4"),
                ]).children,
            );
        });

        test("with left selection", () => {
            const zipper: Zipper = {
                // numerator
                row: {
                    id: 1,
                    type: "zrow",
                    left: row("2").children,
                    selection: null,
                    right: [],
                },
                breadcrumbs: [
                    {
                        // root row
                        row: {
                            id: 0,
                            type: "zrow",
                            left: row("1+").children,
                            selection: {
                                dir: SelectionDir.Left,
                                nodes: row("5+").children,
                            },
                            right: row("+4").children,
                        },
                        // denominator
                        focus: {
                            id: 2,
                            type: "zfrac",
                            dir: 0,
                            other: row("3"),
                        },
                    },
                ],
            };

            const result = zipperToRow(zipper);

            expect(result.children).toEqualEditorNodes(
                builders.row([
                    builders.glyph("1"),
                    builders.glyph("+"),
                    builders.glyph("5"),
                    builders.glyph("+"),
                    builders.frac(row("2").children, row("3").children),
                    builders.glyph("+"),
                    builders.glyph("4"),
                ]).children,
            );
        });

        test("with right selection", () => {
            const zipper: Zipper = {
                // numerator
                row: {
                    id: 1,
                    type: "zrow",
                    left: row("2").children,
                    selection: null,
                    right: [],
                },
                breadcrumbs: [
                    {
                        // root row
                        row: {
                            id: 0,
                            type: "zrow",
                            left: row("1+").children,
                            selection: {
                                dir: SelectionDir.Right,
                                nodes: row("+5").children,
                            },
                            right: row("+4").children,
                        },
                        // denominator
                        focus: {
                            id: 2,
                            type: "zfrac",
                            dir: 0,
                            other: row("3"),
                        },
                    },
                ],
            };

            const result = zipperToRow(zipper);

            expect(result.children).toEqualEditorNodes(
                builders.row([
                    builders.glyph("1"),
                    builders.glyph("+"),
                    builders.frac(row("2").children, row("3").children),
                    builders.glyph("+"),
                    builders.glyph("5"),
                    builders.glyph("+"),
                    builders.glyph("4"),
                ]).children,
            );
        });
    });
});
