import {toEqualEditorNodes, row} from "../test-util";
import {parens} from "../parens";
import {Dir} from "../enums";
import * as builders from "../../builders";

import type {Zipper} from "../types";

expect.extend({toEqualEditorNodes});

describe("parens", () => {
    describe("selection", () => {
        test("'(' wraps selection in non-pending parens", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: row("2").children,
                    selection: {
                        dir: Dir.Left,
                        nodes: row("x+5").children,
                    },
                    right: row("=10").children,
                },
                breadcrumbs: [],
            };

            const result = parens(zipper, Dir.Left);

            expect(result.row.left).toEqualEditorNodes(row("2(").children);
            expect(result.row.right).toEqualEditorNodes(
                row("x+5)=10").children,
            );
        });

        test("')' wraps selection in non-pending parens", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: row("2").children,
                    selection: {
                        dir: Dir.Right,
                        nodes: row("x+5").children,
                    },
                    right: row("=10").children,
                },
                breadcrumbs: [],
            };

            const result = parens(zipper, Dir.Right);

            expect(result.row.left).toEqualEditorNodes(row("2(x+5)").children);
            expect(result.row.right).toEqualEditorNodes(row("=10").children);
        });
    });

    describe("no selection", () => {
        test("empty row, '('", () => {
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

            const result = parens(zipper, Dir.Left);

            expect(result.row.left).toEqualEditorNodes(row("(").children);
            expect(result.row.right).toEqualEditorNodes([
                builders.glyph(")", true),
            ]);
        });

        test("empty row, ')'", () => {
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

            const result = parens(zipper, Dir.Right);

            expect(result.row.left).toEqualEditorNodes([
                builders.glyph("(", true),
                builders.glyph(")"),
            ]);
        });

        test("non-empty row, '(' at start", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("2x+5").children,
                },
                breadcrumbs: [],
            };

            const result = parens(zipper, Dir.Left);

            expect(result.row.left).toEqualEditorNodes(row("(").children);
            expect(result.row.right).toEqualEditorNodes([
                ...row("2x+5").children,
                builders.glyph(")", true),
            ]);
        });

        test("non-empty row, ')' at end", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: row("2x+5").children,
                    selection: null,
                    right: [],
                },
                breadcrumbs: [],
            };

            const result = parens(zipper, Dir.Right);

            expect(result.row.left).toEqualEditorNodes([
                builders.glyph("(", true),
                ...row("2x+5").children,
                builders.glyph(")"),
            ]);
            expect(result.row.right).toEqualEditorNodes([]);
        });

        test("inside existing parens, '(' at start", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: row("(").children,
                    selection: null,
                    right: row("2x+5)").children,
                },
                breadcrumbs: [],
            };

            const result = parens(zipper, Dir.Left);

            expect(result.row.left).toEqualEditorNodes(row("((").children);
            expect(result.row.right).toEqualEditorNodes([
                ...row("2x+5").children,
                builders.glyph(")", true),
                builders.glyph(")"),
            ]);
        });

        test("inside existing parens, ')' at end", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: row("(2x+5").children,
                    selection: null,
                    right: row(")").children,
                },
                breadcrumbs: [],
            };

            const result = parens(zipper, Dir.Right);

            expect(result.row.left).toEqualEditorNodes([
                builders.glyph("("),
                builders.glyph("(", true),
                ...row("2x+5)").children,
            ]);
            expect(result.row.right).toEqualEditorNodes([builders.glyph(")")]);
        });

        test("outside existing parens, '(' at start", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("2(x+5)=10").children,
                },
                breadcrumbs: [],
            };

            const result = parens(zipper, Dir.Left);

            expect(result.row.left).toEqualEditorNodes(row("(").children);
            expect(result.row.right).toEqualEditorNodes([
                ...row("2(x+5)=10").children,
                builders.glyph(")", true),
            ]);
        });

        test("outside existing parens, ')' at end", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: row("2(x+5)=10").children,
                    selection: null,
                    right: [],
                },
                breadcrumbs: [],
            };

            const result = parens(zipper, Dir.Right);

            expect(result.row.left).toEqualEditorNodes([
                builders.glyph("(", true),
                ...row("2(x+5)=10").children,
                builders.glyph(")"),
            ]);
            expect(result.row.right).toEqualEditorNodes([]);
        });

        test("add matching paren, ')'", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: row("(2x").children,
                    selection: null,
                    right: [
                        builders.glyph("+"),
                        builders.glyph("5"),
                        builders.glyph(")", true),
                    ],
                },
                breadcrumbs: [],
            };

            const result = parens(zipper, Dir.Right);

            expect(result.row.left).toEqualEditorNodes(row("(2x)").children);
            expect(result.row.right).toEqualEditorNodes(row("+5").children);
        });

        test("add matching paren, '('", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("(", true), builders.glyph("2")],
                    selection: null,
                    right: row("x+5)").children,
                },
                breadcrumbs: [],
            };

            const result = parens(zipper, Dir.Left);

            expect(result.row.left).toEqualEditorNodes(row("2(").children);
            expect(result.row.right).toEqualEditorNodes(row("x+5)").children);
        });
    });
});
