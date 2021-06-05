import * as types from "../../ast/types";
import * as builders from "../../ast/builders";

import {moveLeft} from "../move-left";
import {moveRight} from "../move-right";
import {row, frac, root, subsup, zrow} from "../test-util";
import type {Zipper, State} from "../types";

const limits = (
    inner: types.Node,
    lower: types.Row,
    upper: types.Row | null,
): types.Limits => {
    return {
        id: 0,
        type: "limits",
        children: [lower, upper],
        inner: inner,
        style: {},
    };
};

describe("moveRight", () => {
    describe("row", () => {
        test("it moves right within the current row", () => {
            const zipper: Zipper = {
                row: zrow([], row("1+2").children),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveRight(state);

            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(2);
        });

        test("doesn't move right if we're at the end of the topmost row", () => {
            const zipper: Zipper = {
                row: zrow(row("1+2").children, []),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveRight(state);

            expect(result.row.left).toEqual(zipper.row.left);
            expect(result.row.right).toHaveLength(0);
        });
    });

    describe("frac", () => {
        test("moves into the numerator of a frac", () => {
            const f = frac("b", "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a")], [f, builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveRight(state);

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: f.id,
                type: "zfrac",
                left: [],
                right: [f.children[1]],
                style: {},
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(f.children[0].children[0]);
        });

        test("moves from the numerator to the denominator", () => {
            const f = frac("b", "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a")], [f, builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveRight(
                moveRight(moveRight(state)),
            );

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: f.id,
                type: "zfrac",
                left: [f.children[0]],
                right: [],
                style: {},
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(f.children[1].children[0]);
        });

        test("moves out of the denominator", () => {
            const f = frac("b", "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a")], [f, builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveRight(
                moveRight(moveRight(moveRight(moveRight(state)))),
            );

            expect(result.breadcrumbs).toHaveLength(0);
            expect(result.row.left).toHaveLength(2);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.left[1]).toEqual(f); // fraction should be unchanged
        });
    });

    describe("subsup", () => {
        test("moves into the subscript of a subsup", () => {
            const ss = subsup("b", "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a")], [ss, builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };
            const {startZipper: result} = moveRight(state);

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                left: [],
                right: [ss.children[1]],
                style: {},
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(ss.children[0]?.children[0]);
        });

        test("moves from the subscript to the superscript", () => {
            const ss = subsup("b", "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a")], [ss, builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveRight(
                moveRight(moveRight(state)),
            );

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                left: [ss.children[0]],
                right: [],
                style: {},
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(ss.children[1]?.children[0]);
        });

        test("moves out of the superscript", () => {
            const ss = subsup("b", "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a")], [ss, builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveRight(
                moveRight(moveRight(moveRight(moveRight(state)))),
            );

            expect(result.breadcrumbs).toHaveLength(0);
            expect(result.row.left).toHaveLength(2);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.left[1]).toEqual(ss); // subsup should be unchanged
        });
    });

    describe("sub", () => {
        test("moves into the subscript of a sub", () => {
            const ss = subsup("b", null);
            const zipper: Zipper = {
                row: zrow([builders.glyph("a")], [ss, builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveRight(state);

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                left: [],
                right: [null],
                style: {},
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(ss.children[0]?.children[0]);
        });

        test("moves out of the sub", () => {
            const ss = subsup("b", null);
            const zipper: Zipper = {
                row: zrow([builders.glyph("a")], [ss, builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveRight(
                moveRight(moveRight(state)),
            );

            expect(result.breadcrumbs).toHaveLength(0);
            expect(result.row.left).toHaveLength(2);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.left[1]).toEqual(ss); // sub should be unchanged
        });
    });

    describe("sup", () => {
        test("moves into the superscript of a sup", () => {
            const ss = subsup(null, "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a")], [ss, builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveRight(state);

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                left: [null],
                right: [],
                style: {},
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(ss.children[1]?.children[0]);
        });

        test("moves out of the sup", () => {
            const ss = subsup(null, "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a")], [ss, builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveRight(
                moveRight(moveRight(state)),
            );

            expect(result.breadcrumbs).toHaveLength(0);
            expect(result.row.left).toHaveLength(2);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.left[1]).toEqual(ss); // sup should be unchanged
        });
    });

    describe("nroot", () => {
        test("moves into the index of an nth root", () => {
            const r = root("b", "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a")], [r, builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveRight(state);

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: r.id,
                type: "zroot",
                left: [],
                right: [r.children[1]],
                style: {},
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(r.children[0]?.children[0]);
        });

        test("moves from the index to the radicand", () => {
            const r = root("b", "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a")], [r, builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveRight(
                moveRight(moveRight(state)),
            );

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: r.id,
                type: "zroot",
                left: [r.children[0]],
                right: [],
                style: {},
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(r.children[1]?.children[0]);
        });

        test("moves out of the radicand", () => {
            const r = subsup("b", "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a")], [r, builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveRight(
                moveRight(moveRight(moveRight(moveRight(state)))),
            );

            expect(result.breadcrumbs).toHaveLength(0);
            expect(result.row.left).toHaveLength(2);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.left[1]).toEqual(r); // root should be unchanged
        });
    });

    describe("sqrt", () => {
        test("moves into the radicand of a root", () => {
            const r = root(null, "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a")], [r, builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveRight(state);

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: r.id,
                type: "zroot",
                left: [null],
                right: [],
                style: {},
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(r.children[1]?.children[0]);
        });

        test("moves out of the root", () => {
            const r = root(null, "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a")], [r, builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveRight(
                moveRight(moveRight(state)),
            );

            expect(result.breadcrumbs).toHaveLength(0);
            expect(result.row.left).toHaveLength(2);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.left[1]).toEqual(r); // root should be unchanged
        });
    });

    describe("lim", () => {
        test("moves into lower", () => {
            const lower: types.Row = row("b");
            const inner: types.Atom = builders.glyph("l");
            const lim: types.Limits = limits(inner, lower, null);
            const zipper: Zipper = {
                row: zrow([builders.glyph("a")], [lim, builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveRight(state);

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: lim.id,
                type: "zlimits",
                left: [],
                right: [null],
                inner: inner,
                style: {},
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(lim.children[0]?.children[0]);
        });

        test("exits the lim", () => {
            const lower: types.Row = row("b");
            const inner: types.Atom = builders.glyph("l");
            const lim: types.Limits = limits(inner, lower, null);
            const zipper: Zipper = {
                row: zrow([builders.glyph("a")], [lim, builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveRight(
                moveRight(moveRight(state)),
            );

            expect(result.breadcrumbs).toHaveLength(0);
            expect(result.row.left).toHaveLength(2);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.left[1]).toEqual(lim); // lim should be unchanged
        });
    });

    describe("sum", () => {
        test("moves into lower", () => {
            const lower: types.Row = row("b");
            const upper: types.Row = row("c");
            const inner: types.Atom = builders.glyph("l");
            const sum: types.Limits = limits(inner, lower, upper);
            const zipper: Zipper = {
                row: zrow([builders.glyph("a")], [sum, builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveRight(state);

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: sum.id,
                type: "zlimits",
                left: [],
                right: [upper],
                inner: inner,
                style: {},
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(sum.children[0]?.children[0]);
        });

        test("moves from lower into upper", () => {
            const lower: types.Row = row("b");
            const upper: types.Row = row("c");
            const inner: types.Atom = builders.glyph("l");
            const sum: types.Limits = limits(inner, lower, upper);
            const zipper: Zipper = {
                row: zrow([builders.glyph("a")], [sum, builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveRight(
                moveRight(moveRight(state)),
            );

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: sum.id,
                type: "zlimits",
                left: [lower],
                right: [],
                inner: inner,
                style: {},
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(sum.children[1]?.children[0]);
        });

        test("exits the sum", () => {
            const lower: types.Row = row("b");
            const upper: types.Row = row("c");
            const inner: types.Atom = builders.glyph("l");
            const sum: types.Limits = limits(inner, lower, upper);
            const zipper: Zipper = {
                row: zrow([builders.glyph("a")], [sum, builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveRight(
                moveRight(moveRight(moveRight(moveRight(state)))),
            );

            expect(result.breadcrumbs).toHaveLength(0);
            expect(result.row.left).toHaveLength(2);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.left[1]).toEqual(sum); // sum should be unchanged
        });
    });
});

describe("moveLeft", () => {
    describe("row", () => {
        test("it moves right within the current row", () => {
            const zipper: Zipper = {
                row: zrow(row("1+2").children, []),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveLeft(state);

            expect(result.row.left).toHaveLength(2);
            expect(result.row.right).toHaveLength(1);
        });

        test("doesn't move right if we're at the end of the topmost row", () => {
            const zipper: Zipper = {
                row: zrow([], row("1+2").children),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveLeft(state);

            expect(result.row.right).toEqual(zipper.row.right);
            expect(result.row.left).toHaveLength(0);
        });
    });

    describe("frac", () => {
        test("moves into the denominator of a frac", () => {
            const f = frac("b", "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a"), f], [builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveLeft(state);

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: f.id,
                type: "zfrac",
                left: [f.children[0]],
                right: [],
                style: {},
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(f.children[1].children[0]);
        });

        test("moves from the denominator to the numerator", () => {
            const f = frac("b", "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a"), f], [builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveLeft(moveLeft(moveLeft(state)));

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: f.id,
                type: "zfrac",
                left: [],
                right: [f.children[1]],
                style: {},
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(f.children[0].children[0]);
        });

        test("moves out of the numberator", () => {
            const f = frac("b", "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a"), f], [builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveLeft(
                moveLeft(moveLeft(moveLeft(moveLeft(state)))),
            );

            expect(result.breadcrumbs).toHaveLength(0);
            expect(result.row.right).toHaveLength(2);
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right[0]).toEqual(f); // frac should be unchanged
        });
    });

    describe("subsup", () => {
        test("moves into the superscript of a subsup", () => {
            const ss = subsup("b", "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a"), ss], [builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveLeft(state);

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                left: [ss.children[0]],
                right: [],
                style: {},
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(ss.children[1]?.children[0]);
        });

        test("moves from the superscript to the subscript", () => {
            const ss = subsup("b", "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a"), ss], [builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveLeft(moveLeft(moveLeft(state)));

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                left: [],
                right: [ss.children[1]],
                style: {},
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(ss.children[0]?.children[0]);
        });

        test("moves out of the subscript", () => {
            const ss = subsup("b", "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a"), ss], [builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveLeft(
                moveLeft(moveLeft(moveLeft(moveLeft(state)))),
            );

            expect(result.breadcrumbs).toHaveLength(0);
            expect(result.row.right).toHaveLength(2);
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right[0]).toEqual(ss); // subsup should be unchanged
        });
    });

    describe("sup", () => {
        test("moves into the superscript of a sup", () => {
            const ss = subsup(null, "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a"), ss], [builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveLeft(state);

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                left: [null],
                right: [],
                style: {},
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(ss.children[1]?.children[0]);
        });

        test("exits the sup to the left", () => {
            const ss = subsup(null, "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a"), ss], [builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveLeft(moveLeft(moveLeft(state)));

            expect(result.breadcrumbs).toHaveLength(0);
            expect(result.row.right).toHaveLength(2);
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right[0]).toEqual(ss); // sup should be unchanged
        });
    });

    describe("sub", () => {
        test("moves into the superscript of a sub", () => {
            const ss = subsup("b", null);
            const zipper: Zipper = {
                row: zrow([builders.glyph("a"), ss], [builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveLeft(state);

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                left: [],
                right: [null],
                style: {},
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(ss.children[0]?.children[0]);
        });

        test("exits the sub to the left", () => {
            const ss = subsup("b", null);
            const zipper: Zipper = {
                row: zrow([builders.glyph("a"), ss], [builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveLeft(moveLeft(moveLeft(state)));

            expect(result.breadcrumbs).toHaveLength(0);
            expect(result.row.right).toHaveLength(2);
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right[0]).toEqual(ss); // sub should be unchanged
        });
    });

    describe("nroot", () => {
        test("moves into the radicand of an nth root", () => {
            const r = root("b", "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a"), r], [builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveLeft(state);

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: r.id,
                type: "zroot",
                left: [r.children[0]],
                right: [],
                style: {},
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(r.children[1]?.children[0]);
        });

        test("moves from the radicand to the index", () => {
            const r = root("b", "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a"), r], [builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveLeft(moveLeft(moveLeft(state)));

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: r.id,
                type: "zroot",
                left: [],
                right: [r.children[1]],
                style: {},
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(r.children[0]?.children[0]);
        });

        test("moves out of the index", () => {
            const r = root("b", "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a"), r], [builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveLeft(
                moveLeft(moveLeft(moveLeft(moveLeft(state)))),
            );

            expect(result.breadcrumbs).toHaveLength(0);
            expect(result.row.right).toHaveLength(2);
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right[0]).toEqual(r); // root should be unchanged
        });
    });

    describe("sqrt", () => {
        test("moves into the radicand of a root", () => {
            const r = root(null, "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a"), r], [builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveLeft(state);

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: r.id,
                type: "zroot",
                left: [null],
                right: [],
                style: {},
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(r.children[1]?.children[0]);
        });

        test("exits the sup to the left", () => {
            const r = root(null, "c");
            const zipper: Zipper = {
                row: zrow([builders.glyph("a"), r], [builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveLeft(moveLeft(moveLeft(state)));

            expect(result.breadcrumbs).toHaveLength(0);
            expect(result.row.right).toHaveLength(2);
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right[0]).toEqual(r); // root should be unchanged
        });
    });

    describe("lim", () => {
        test("moves into lower", () => {
            const lower: types.Row = row("b");
            const inner: types.Atom = builders.glyph("l");
            const lim: types.Limits = limits(inner, lower, null);
            const zipper: Zipper = {
                row: zrow([builders.glyph("a"), lim], [builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveLeft(state);

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: lim.id,
                type: "zlimits",
                left: [],
                right: [null],
                inner: inner,
                style: {},
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(lower.children[0]);
        });

        test("exits the lim", () => {
            const lower: types.Row = row("b");
            const inner: types.Atom = builders.glyph("l");
            const lim: types.Limits = limits(inner, lower, null);
            const zipper: Zipper = {
                row: zrow([builders.glyph("a"), lim], [builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveLeft(moveLeft(moveLeft(state)));

            expect(result.breadcrumbs).toHaveLength(0);
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(2);
            expect(result.row.right[0]).toEqual(lim); // lim should be unchanged
        });
    });

    describe("sum", () => {
        test("moves into upper", () => {
            const lower: types.Row = row("b");
            const upper: types.Row = row("c");
            const inner: types.Atom = builders.glyph("l");
            const sum: types.Limits = limits(inner, lower, upper);
            const zipper: Zipper = {
                row: zrow([builders.glyph("a"), sum], [builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveLeft(state);

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: sum.id,
                type: "zlimits",
                left: [lower],
                right: [],
                inner: inner,
                style: {},
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(upper.children[0]);
        });

        test("moves from uper into lower", () => {
            const lower: types.Row = row("b");
            const upper: types.Row = row("c");
            const inner: types.Atom = builders.glyph("l");
            const sum: types.Limits = limits(inner, lower, upper);
            const zipper: Zipper = {
                row: zrow([builders.glyph("a"), sum], [builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveLeft(moveLeft(moveLeft(state)));

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: sum.id,
                type: "zlimits",
                left: [],
                right: [upper],
                inner: inner,
                style: {},
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(lower.children[0]);
        });

        test("exits the sum", () => {
            const lower: types.Row = row("b");
            const upper: types.Row = row("c");
            const inner: types.Atom = builders.glyph("l");
            const sum: types.Limits = limits(inner, lower, upper);
            const zipper: Zipper = {
                row: zrow([builders.glyph("a"), sum], [builders.glyph("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            };

            const {startZipper: result} = moveLeft(
                moveLeft(moveLeft(moveLeft(moveLeft(state)))),
            );

            expect(result.breadcrumbs).toHaveLength(0);
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(2);
            expect(result.row.right[0]).toEqual(sum); // sum should be unchanged
        });
    });
});
