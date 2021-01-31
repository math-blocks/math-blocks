import * as types from "../../types";
import * as builders from "../../builders";

import {moveLeft} from "../move-left";
import {moveRight} from "../move-right";
import {Zipper} from "../types";

export const row = (str: string): types.Row =>
    builders.row(
        str.split("").map((glyph) => {
            if (glyph === "-") {
                return builders.glyph("\u2212");
            }
            return builders.glyph(glyph);
        }),
    );

export const frac = (num: string, den: string): types.Frac =>
    builders.frac(
        num.split("").map((glyph) => builders.glyph(glyph)),
        den.split("").map((glyph) => builders.glyph(glyph)),
    );

export const sqrt = (radicand: string): types.Root =>
    builders.root(
        null,
        radicand.split("").map((glyph) => builders.glyph(glyph)),
    );

export const root = (index: string | null, radicand: string): types.Root =>
    builders.root(
        index ? index.split("").map((glyph) => builders.glyph(glyph)) : null,
        radicand.split("").map((glyph) => builders.glyph(glyph)),
    );

export const sup = (sup: string): types.SubSup =>
    builders.subsup(
        undefined,
        sup.split("").map((glyph) => builders.glyph(glyph)),
    );

export const sub = (sub: string): types.SubSup =>
    builders.subsup(
        sub.split("").map((glyph) => builders.glyph(glyph)),
        undefined,
    );

export const subsup = (sub: string | null, sup: string | null): types.SubSup =>
    builders.subsup(
        sub ? sub.split("").map((glyph) => builders.glyph(glyph)) : undefined,
        sup ? sup.split("").map((glyph) => builders.glyph(glyph)) : undefined,
    );

describe("moveRight", () => {
    describe("row", () => {
        test("it moves right within the current row", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
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
                    right: [f, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: f.id,
                type: "zfrac",
                left: undefined,
                right: f.children[1],
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
                    right: [f, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(moveRight(moveRight(zipper)));

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: f.id,
                type: "zfrac",
                left: f.children[0],
                right: undefined,
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
                    right: [ss, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                left: undefined,
                right: ss.children[1],
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
                    right: [ss, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(moveRight(moveRight(zipper)));

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                left: ss.children[0],
                right: undefined,
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
                    right: [ss, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                left: undefined,
                right: null,
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
                    right: [ss, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(moveRight(moveRight(zipper)));

            expect(result.path).toHaveLength(0);
            expect(result.row.left).toHaveLength(2);
            expect(result.row.right).toHaveLength(1);
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
                    right: [ss, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                left: null,
                right: undefined,
            });
            expect(result.row.left).toHaveLength(0);
            expect(result.row.right).toHaveLength(1);
            expect(result.row.right[0]).toEqual(ss.children[1]?.children[0]);
        });

        test("moves out of the sub", () => {
            const ss = subsup(null, "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a")],
                    right: [ss, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(moveRight(moveRight(zipper)));

            expect(result.path).toHaveLength(0);
            expect(result.row.left).toHaveLength(2);
            expect(result.row.right).toHaveLength(1);
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
                    right: [r, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: r.id,
                type: "zroot",
                left: undefined,
                right: r.children[1],
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
                    right: [r, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(moveRight(moveRight(zipper)));

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: r.id,
                type: "zroot",
                left: r.children[0],
                right: undefined,
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
                    right: [r, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: r.id,
                type: "zroot",
                left: null,
                right: undefined,
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
                    right: [r, builders.glyph("d")],
                },
                path: [],
            };

            const result = moveRight(moveRight(moveRight(zipper)));

            expect(result.path).toHaveLength(0);
            expect(result.row.left).toHaveLength(2);
            expect(result.row.right).toHaveLength(1);
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
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: f.id,
                type: "zfrac",
                left: f.children[0],
                right: undefined,
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
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(moveLeft(moveLeft(zipper)));

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: f.id,
                type: "zfrac",
                left: undefined,
                right: f.children[1],
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
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                left: ss.children[0],
                right: undefined,
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
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(moveLeft(moveLeft(zipper)));

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                left: undefined,
                right: ss.children[1],
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
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                left: null,
                right: undefined,
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
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(moveLeft(moveLeft(zipper)));

            expect(result.path).toHaveLength(0);
            expect(result.row.right).toHaveLength(2);
            expect(result.row.left).toHaveLength(1);
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
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                left: undefined,
                right: null,
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
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(moveLeft(moveLeft(zipper)));

            expect(result.path).toHaveLength(0);
            expect(result.row.right).toHaveLength(2);
            expect(result.row.left).toHaveLength(1);
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
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: r.id,
                type: "zroot",
                left: r.children[0],
                right: undefined,
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
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(moveLeft(moveLeft(zipper)));

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: r.id,
                type: "zroot",
                left: undefined,
                right: r.children[1],
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
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(zipper);

            expect(result.path).toHaveLength(1);
            expect(result.path[0].focus).toEqual({
                id: r.id,
                type: "zroot",
                left: null,
                right: undefined,
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
                    right: [builders.glyph("d")],
                },
                path: [],
            };

            const result = moveLeft(moveLeft(moveLeft(zipper)));

            expect(result.path).toHaveLength(0);
            expect(result.row.right).toHaveLength(2);
            expect(result.row.left).toHaveLength(1);
        });
    });
});
