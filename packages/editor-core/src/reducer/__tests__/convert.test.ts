import * as builders from "../../builders";

import {zipperToRow} from "../convert";
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
                    selection: [],
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
                    selection: [],
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
                    selection: row("+").children,
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
                    selection: [],
                    right: [],
                },
                breadcrumbs: [
                    {
                        // root row
                        row: {
                            id: 0,
                            type: "bcrow",
                            left: row("1+").children,
                            right: row("+4").children,
                        },
                        // denominator
                        focus: {
                            id: 2,
                            type: "zfrac",
                            left: [],
                            right: [row("3")],
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
    });
});
