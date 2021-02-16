import * as types from "../../types";
import * as builders from "../../builders";

import {moveLeft} from "../move-left";
import {moveRight} from "../move-right";
import {Zipper} from "../types";
import {row, frac, root, subsup} from "../test-util";

describe("moveRight", () => {
    describe("row", () => {
        test("it moves right within the current row", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("1+2").children,
                },
                path: [],
            };

            const result = moveRight(zipper);

            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(2);
        });

        test("doesn't move right if we're at the end of the topmost row", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: row("1+2").children,
                    selection: null,
                    right: [],
                },
                path: [],
            };

            const result = moveRight(zipper);

            expect(result.row.left).toEqual(zipper.row.left);
            expect(result.row.right).toHaveLength(0);
        });
    });

    describe("frac", () => {
        test("moves into the numerator of a frac", () => {
            const f = frac("b", "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a")],
                    selection: null,
                    right: [f, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: f.id,
                type: "zfrac",
                dir: "left",
                other: f.children[1],
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(f.children[0].children[0]);
        });

        test("moves from the numerator to the denominator", () => {
            const f = frac("b", "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a")],
                    selection: null,
                    right: [f, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(moveRight(moveRight(zipper)));

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: f.id,
                type: "zfrac",
                dir: "right",
                other: f.children[0],
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(f.children[1].children[0]);
        });

        test("moves out of the denominator", () => {
            const f = frac("b", "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a")],
                    selection: null,
                    right: [f, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(
                moveRight(moveRight(moveRight(moveRight(zipper)))),
            );

            expect(result.path).toHaveLength(0);
            expect(result.row.left).toHaveLength(2);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.left[1]).toEqual(f); // fraction should be unchanged
        });
    });

    describe("subsup", () => {
        test("moves into the subscript of a subsup", () => {
            const ss = subsup("b", "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a")],
                    selection: null,
                    right: [ss, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                dir: "left",
                other: ss.children[1],
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(ss.children[0]?.children[0]);
        });

        test("moves from the subscript to the superscript", () => {
            const ss = subsup("b", "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a")],
                    selection: null,
                    right: [ss, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(moveRight(moveRight(zipper)));

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                dir: "right",
                other: ss.children[0],
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(ss.children[1]?.children[0]);
        });

        test("moves out of the superscript", () => {
            const ss = subsup("b", "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a")],
                    selection: null,
                    right: [ss, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(
                moveRight(moveRight(moveRight(moveRight(zipper)))),
            );

            expect(result.path).toHaveLength(0);
            expect(result.row.left).toHaveLength(2);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.left[1]).toEqual(ss); // subsup should be unchanged
        });
    });

    describe("sub", () => {
        test("moves into the subscript of a sub", () => {
            const ss = subsup("b", null);
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a")],
                    selection: null,
                    right: [ss, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                dir: "left",
                other: null,
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(ss.children[0]?.children[0]);
        });

        test("moves out of the sub", () => {
            const ss = subsup("b", null);
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a")],
                    selection: null,
                    right: [ss, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(moveRight(moveRight(zipper)));

            expect(result.path).toHaveLength(0);
            expect(result.row.left).toHaveLength(2);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.left[1]).toEqual(ss); // sub should be unchanged
        });
    });

    describe("sup", () => {
        test("moves into the superscript of a sup", () => {
            const ss = subsup(null, "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a")],
                    selection: null,
                    right: [ss, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                dir: "right",
                other: null,
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(ss.children[1]?.children[0]);
        });

        test("moves out of the sup", () => {
            const ss = subsup(null, "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a")],
                    selection: null,
                    right: [ss, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(moveRight(moveRight(zipper)));

            expect(result.path).toHaveLength(0);
            expect(result.row.left).toHaveLength(2);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.left[1]).toEqual(ss); // sup should be unchanged
        });
    });

    describe("nroot", () => {
        test("moves into the index of an nth root", () => {
            const r = root("b", "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a")],
                    selection: null,
                    right: [r, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: r.id,
                type: "zroot",
                dir: "left",
                other: r.children[1],
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(r.children[0]?.children[0]);
        });

        test("moves from the index to the radicand", () => {
            const r = root("b", "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a")],
                    selection: null,
                    right: [r, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(moveRight(moveRight(zipper)));

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: r.id,
                type: "zroot",
                dir: "right",
                other: r.children[0],
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(r.children[1]?.children[0]);
        });

        test("moves out of the radicand", () => {
            const r = subsup("b", "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a")],
                    selection: null,
                    right: [r, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(
                moveRight(moveRight(moveRight(moveRight(zipper)))),
            );

            expect(result.path).toHaveLength(0);
            expect(result.row.left).toHaveLength(2);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.left[1]).toEqual(r); // root should be unchanged
        });
    });

    describe("sqrt", () => {
        test("moves into the radicand of a root", () => {
            const r = root(null, "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a")],
                    selection: null,
                    right: [r, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: r.id,
                type: "zroot",
                dir: "right",
                other: null,
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(r.children[1]?.children[0]);
        });

        test("moves out of the root", () => {
            const r = root(null, "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a")],
                    selection: null,
                    right: [r, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(moveRight(moveRight(zipper)));

            expect(result.path).toHaveLength(0);
            expect(result.row.left).toHaveLength(2);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.left[1]).toEqual(r); // root should be unchanged
        });
    });

    describe("lim", () => {
        test("moves into lower", () => {
            const lower: types.Row = row("b");
            const inner: types.Atom = {
                id: 0,
                type: "atom",
                value: {
                    kind: "glyph",
                    char: "l",
                },
            };
            const lim: types.Limits = {
                id: 0,
                type: "limits",
                children: [lower, null],
                inner: inner,
            };
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a")],
                    selection: null,
                    right: [lim, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: lim.id,
                type: "zlimits",
                dir: "left",
                other: null,
                inner: inner,
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(lim.children[0]?.children[0]);
        });

        test("exits the lim", () => {
            const lower: types.Row = row("b");
            const inner: types.Atom = {
                id: 0,
                type: "atom",
                value: {
                    kind: "glyph",
                    char: "l",
                },
            };
            const lim: types.Limits = {
                id: 0,
                type: "limits",
                children: [lower, null],
                inner: inner,
            };
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a")],
                    selection: null,
                    right: [lim, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(moveRight(moveRight(zipper)));

            expect(result.path).toHaveLength(0);
            expect(result.row.left).toHaveLength(2);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.left[1]).toEqual(lim); // lim should be unchanged
        });
    });

    describe("sum", () => {
        test("moves into lower", () => {
            const lower: types.Row = row("b");
            const upper: types.Row = row("c");
            const inner: types.Atom = {
                id: 0,
                type: "atom",
                value: {
                    kind: "glyph",
                    char: "l",
                },
            };
            const sum: types.Limits = {
                id: 0,
                type: "limits",
                children: [lower, upper],
                inner: inner,
            };
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a")],
                    selection: null,
                    right: [sum, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: sum.id,
                type: "zlimits",
                dir: "left",
                other: upper,
                inner: inner,
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(sum.children[0]?.children[0]);
        });

        test("moves from lower into upper", () => {
            const lower: types.Row = row("b");
            const upper: types.Row = row("c");
            const inner: types.Atom = {
                id: 0,
                type: "atom",
                value: {
                    kind: "glyph",
                    char: "l",
                },
            };
            const sum: types.Limits = {
                id: 0,
                type: "limits",
                children: [lower, upper],
                inner: inner,
            };
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a")],
                    selection: null,
                    right: [sum, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(moveRight(moveRight(zipper)));

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: sum.id,
                type: "zlimits",
                dir: "right",
                other: lower,
                inner: inner,
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(sum.children[1]?.children[0]);
        });

        test("exits the sum", () => {
            const lower: types.Row = row("b");
            const upper: types.Row = row("c");
            const inner: types.Atom = {
                id: 0,
                type: "atom",
                value: {
                    kind: "glyph",
                    char: "l",
                },
            };
            const sum: types.Limits = {
                id: 0,
                type: "limits",
                children: [lower, upper],
                inner: inner,
            };
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a")],
                    selection: null,
                    right: [sum, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(
                moveRight(moveRight(moveRight(moveRight(zipper)))),
            );

            expect(result.path).toHaveLength(0);
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
                row: {
                    id: 0,
                    type: "zrow",
                    left: row("1+2").children,
                    selection: null,
                    right: [],
                },
                path: [],
            };

            const result = moveLeft(zipper);

            expect(result.row.left).toHaveLength(2);
            expect(result.row.right).toHaveLength(1);
        });

        test("doesn't move right if we're at the end of the topmost row", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("1+2").children,
                },
                path: [],
            };

            const result = moveLeft(zipper);

            expect(result.row.right).toEqual(zipper.row.right);
            expect(result.row.left).toHaveLength(0);
        });
    });

    describe("frac", () => {
        test("moves into the denominator of a frac", () => {
            const f = frac("b", "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), f],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: f.id,
                type: "zfrac",
                dir: "right",
                other: f.children[0],
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(f.children[1].children[0]);
        });

        test("moves from the denominator to the numerator", () => {
            const f = frac("b", "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), f],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(moveLeft(moveLeft(zipper)));

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: f.id,
                type: "zfrac",
                dir: "left",
                other: f.children[1],
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(f.children[0].children[0]);
        });

        test("moves out of the numberator", () => {
            const f = frac("b", "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), f],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(
                moveLeft(moveLeft(moveLeft(moveLeft(zipper)))),
            );

            expect(result.path).toHaveLength(0);
            expect(result.row.right).toHaveLength(2);
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right[0]).toEqual(f); // frac should be unchanged
        });
    });

    describe("subsup", () => {
        test("moves into the superscript of a subsup", () => {
            const ss = subsup("b", "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), ss],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                dir: "right",
                other: ss.children[0],
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(ss.children[1]?.children[0]);
        });

        test("moves from the superscript to the subscript", () => {
            const ss = subsup("b", "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), ss],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(moveLeft(moveLeft(zipper)));

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                dir: "left",
                other: ss.children[1],
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(ss.children[0]?.children[0]);
        });

        test("moves out of the subscript", () => {
            const ss = subsup("b", "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), ss],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(
                moveLeft(moveLeft(moveLeft(moveLeft(zipper)))),
            );

            expect(result.path).toHaveLength(0);
            expect(result.row.right).toHaveLength(2);
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right[0]).toEqual(ss); // subsup should be unchanged
        });
    });

    describe("sup", () => {
        test("moves into the superscript of a sup", () => {
            const ss = subsup(null, "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), ss],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                dir: "right",
                other: null,
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(ss.children[1]?.children[0]);
        });

        test("exits the sup to the left", () => {
            const ss = subsup(null, "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), ss],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(moveLeft(moveLeft(zipper)));

            expect(result.path).toHaveLength(0);
            expect(result.row.right).toHaveLength(2);
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right[0]).toEqual(ss); // sup should be unchanged
        });
    });

    describe("sub", () => {
        test("moves into the superscript of a sub", () => {
            const ss = subsup("b", null);
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), ss],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                dir: "left",
                other: null,
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(ss.children[0]?.children[0]);
        });

        test("exits the sub to the left", () => {
            const ss = subsup("b", null);
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), ss],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(moveLeft(moveLeft(zipper)));

            expect(result.path).toHaveLength(0);
            expect(result.row.right).toHaveLength(2);
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right[0]).toEqual(ss); // sub should be unchanged
        });
    });

    describe("nroot", () => {
        test("moves into the radicand of an nth root", () => {
            const r = root("b", "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), r],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: r.id,
                type: "zroot",
                dir: "right",
                other: r.children[0],
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(r.children[1]?.children[0]);
        });

        test("moves from the radicand to the index", () => {
            const r = root("b", "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), r],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(moveLeft(moveLeft(zipper)));

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: r.id,
                type: "zroot",
                dir: "left",
                other: r.children[1],
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(r.children[0]?.children[0]);
        });

        test("moves out of the index", () => {
            const r = root("b", "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), r],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(
                moveLeft(moveLeft(moveLeft(moveLeft(zipper)))),
            );

            expect(result.path).toHaveLength(0);
            expect(result.row.right).toHaveLength(2);
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right[0]).toEqual(r); // root should be unchanged
        });
    });

    describe("sqrt", () => {
        test("moves into the radicand of a root", () => {
            const r = root(null, "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), r],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: r.id,
                type: "zroot",
                dir: "right",
                other: null,
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(r.children[1]?.children[0]);
        });

        test("exits the sup to the left", () => {
            const r = root(null, "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), r],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(moveLeft(moveLeft(zipper)));

            expect(result.path).toHaveLength(0);
            expect(result.row.right).toHaveLength(2);
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right[0]).toEqual(r); // root should be unchanged
        });
    });

    describe("lim", () => {
        test("moves into lower", () => {
            const lower: types.Row = row("b");
            const inner: types.Atom = {
                id: 0,
                type: "atom",
                value: {
                    kind: "glyph",
                    char: "l",
                },
            };
            const lim: types.Limits = {
                id: 0,
                type: "limits",
                children: [lower, null],
                inner: inner,
            };
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), lim],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: lim.id,
                type: "zlimits",
                dir: "left",
                other: null,
                inner: inner,
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(lower.children[0]);
        });

        test("exits the lim", () => {
            const lower: types.Row = row("b");
            const inner: types.Atom = {
                id: 0,
                type: "atom",
                value: {
                    kind: "glyph",
                    char: "l",
                },
            };
            const lim: types.Limits = {
                id: 0,
                type: "limits",
                children: [lower, null],
                inner: inner,
            };
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), lim],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(moveLeft(moveLeft(zipper)));

            expect(result.path).toHaveLength(0);
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(2);
            expect(result.row.right[0]).toEqual(lim); // lim should be unchanged
        });
    });

    describe("sum", () => {
        test("moves into upper", () => {
            const lower: types.Row = row("b");
            const upper: types.Row = row("c");
            const inner: types.Atom = {
                id: 0,
                type: "atom",
                value: {
                    kind: "glyph",
                    char: "l",
                },
            };
            const sum: types.Limits = {
                id: 0,
                type: "limits",
                children: [lower, upper],
                inner: inner,
            };
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), sum],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: sum.id,
                type: "zlimits",
                dir: "right",
                other: lower,
                inner: inner,
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(upper.children[0]);
        });

        test("moves from uper into lower", () => {
            const lower: types.Row = row("b");
            const upper: types.Row = row("c");
            const inner: types.Atom = {
                id: 0,
                type: "atom",
                value: {
                    kind: "glyph",
                    char: "l",
                },
            };
            const sum: types.Limits = {
                id: 0,
                type: "limits",
                children: [lower, upper],
                inner: inner,
            };
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), sum],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(moveLeft(moveLeft(zipper)));

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: sum.id,
                type: "zlimits",
                dir: "left",
                other: upper,
                inner: inner,
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(lower.children[0]);
        });

        test("exits the sum", () => {
            const lower: types.Row = row("b");
            const upper: types.Row = row("c");
            const inner: types.Atom = {
                id: 0,
                type: "atom",
                value: {
                    kind: "glyph",
                    char: "l",
                },
            };
            const sum: types.Limits = {
                id: 0,
                type: "limits",
                children: [lower, upper],
                inner: inner,
            };
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), sum],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(
                moveLeft(moveLeft(moveLeft(moveLeft(zipper)))),
            );

            expect(result.path).toHaveLength(0);
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(2);
            expect(result.row.right[0]).toEqual(sum); // sum should be unchanged
        });
    });
});
