import {backspace} from "../backspace";
import {moveLeft} from "../move-left";
import {moveRight} from "../move-right";
import {
    row,
    frac,
    subsup,
    root,
    delimited,
    toEqualEditorNodes,
    zrow,
} from "../test-util";
import * as builders from "../../char/builders";
import * as types from "../../char/types";

import type {Zipper, State} from "../types";
import {getId} from "@math-blocks/core";

expect.extend({toEqualEditorNodes});

const limits = (
    inner: types.CharNode,
    lower: types.CharRow,
    upper: types.CharRow | null,
): types.CharLimits => {
    return {
        id: 0,
        type: "limits",
        children: [lower, upper],
        inner: inner,
        style: {},
    };
};

describe("backspace", () => {
    test("it deletes characters at the end", () => {
        const zipper: Zipper = {
            row: zrow(row("1+2").children, []),
            breadcrumbs: [],
        };
        const state: State = {
            startZipper: zipper,
            endZipper: zipper,
            zipper: zipper,
            selecting: false,
        };

        const {startZipper: result} = backspace(state);

        expect(result.row.left).toEqualEditorNodes(row("1+").children);
        expect(result.row.right).toEqualEditorNodes(row("").children);
    });

    test("it deletes characters in the middle", () => {
        const zipper: Zipper = {
            row: zrow(row("1+").children, row("2").children),
            breadcrumbs: [],
        };
        const state: State = {
            startZipper: zipper,
            endZipper: zipper,
            zipper: zipper,
            selecting: false,
        };

        const {startZipper: result} = backspace(state);

        expect(result.row.left).toEqualEditorNodes(row("1").children);
        expect(result.row.right).toEqualEditorNodes(row("2").children);
    });

    test("it deletes a fraction in the middle", () => {
        const zipper: Zipper = {
            row: {
                id: getId(),
                type: "zrow",
                left: [builders.char("1")],
                selection: [],
                right: [
                    builders.frac([builders.char("a")], [builders.char("b")]),
                    builders.char("2"),
                ],
                style: {},
            },
            breadcrumbs: [],
        };
        let state: State = {
            startZipper: zipper,
            endZipper: zipper,
            zipper: zipper,
            selecting: true,
        };
        state = moveRight(state);

        const {zipper: result} = backspace(state);
        expect(result.row.left).toEqualEditorNodes(row("1").children);
        expect(result.row.right).toEqualEditorNodes(row("2").children);
    });

    test("it does nothing at the start", () => {
        const zipper: Zipper = {
            row: zrow([], row("1+2").children),
            breadcrumbs: [],
        };
        const state: State = {
            startZipper: zipper,
            endZipper: zipper,
            zipper: zipper,
            selecting: false,
        };

        const {startZipper: result} = backspace(state);

        expect(result.row.left).toEqualEditorNodes(row("").children);
        expect(result.row.right).toEqualEditorNodes(row("1+2").children);
    });

    describe("fractions", () => {
        test("deleting from the start of the numerator", () => {
            const zipper: Zipper = {
                row: zrow([], row("2").children), // numerator
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "bcrow",
                            left: row("1+").children,
                            right: [],
                            style: {},
                        },
                        focus: {
                            id: 0,
                            type: "zfrac",
                            left: [],
                            right: [row("3")],
                            style: {},
                        },
                    },
                ],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = backspace(state);

            expect(result.row.left).toEqualEditorNodes(row("1+").children);
            expect(result.row.right).toEqualEditorNodes(row("23").children);
        });

        test("deleting from the start of the denominator", () => {
            const zipper: Zipper = {
                row: zrow([], row("3").children), // denominator
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "bcrow",
                            left: row("1+").children,
                            right: [],
                            style: {},
                        },
                        focus: {
                            id: 0,
                            type: "zfrac",
                            left: [row("2")],
                            right: [],
                            style: {},
                        },
                    },
                ],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = backspace(state);

            expect(result.row.left).toEqualEditorNodes(row("1+2").children);
            expect(result.row.right).toEqualEditorNodes(row("3").children);
        });

        test("deleting from the right of the fraction moves into the denonominator", () => {
            const f = frac("b", "c");
            const zipper: Zipper = {
                row: zrow([builders.char("a"), f], [builders.char("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = backspace(state);

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
    });

    describe("subsup", () => {
        test("deleting from the start of the subscript w/o a superscript", () => {
            const zipper: Zipper = {
                row: zrow([], row("n").children), // subscript
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "bcrow",
                            left: row("x").children,
                            right: [],
                            style: {},
                        },
                        focus: {
                            id: 0,
                            type: "zsubsup",
                            left: [], // the subscript is focused
                            right: [null], // no superscript
                            style: {},
                        },
                    },
                ],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = backspace(state);

            expect(result.row.left).toEqualEditorNodes(row("x").children);
            expect(result.row.right).toEqualEditorNodes(row("n").children);
        });

        test("deleting from the start of the subscript with a superscript", () => {
            const zipper: Zipper = {
                row: zrow([], row("n").children), // sbuscript
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "bcrow",
                            left: row("x").children,
                            right: [],
                            style: {},
                        },
                        focus: {
                            id: 0,
                            type: "zsubsup",
                            left: [], // the subscript is focused
                            right: [row("2")], // superscript
                            style: {},
                        },
                    },
                ],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = backspace(state);

            expect(result.row.left).toEqualEditorNodes(row("x").children);
            expect(result.row.right).toEqualEditorNodes(row("n2").children);
        });

        test("deleting from the start of the superscript w/o a subscript", () => {
            const zipper: Zipper = {
                row: zrow([], row("2").children), // superscript
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "bcrow",
                            left: row("x").children,
                            right: [],
                            style: {},
                        },
                        focus: {
                            id: 0,
                            type: "zsubsup",
                            left: [null], // no subscript
                            right: [], // the superscript is focused
                            style: {},
                        },
                    },
                ],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = backspace(state);

            expect(result.row.left).toEqualEditorNodes(row("x").children);
            expect(result.row.right).toEqualEditorNodes(row("2").children);
        });

        test("deleting from the start of the superscript with a subscript", () => {
            const zipper: Zipper = {
                row: zrow([], row("2").children), // superscript
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "bcrow",
                            left: row("x").children,
                            right: [],
                            style: {},
                        },
                        focus: {
                            id: 0,
                            type: "zsubsup",
                            left: [row("n")], // subscript
                            right: [], // the superscript is focused
                            style: {},
                        },
                    },
                ],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = backspace(state);

            expect(result.row.left).toEqualEditorNodes(
                builders.row([
                    builders.char("x"),
                    builders.subsup([builders.char("n")], undefined),
                ]).children,
            );
            expect(result.row.right).toEqualEditorNodes(row("2").children);
        });

        test("deleting from the right of a subscript", () => {
            const ss = subsup("b", null);
            const zipper: Zipper = {
                row: zrow([builders.char("a"), ss], [builders.char("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = backspace(state);

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

        test("deleting from the right of a superscript", () => {
            const ss = subsup(null, "c");
            const zipper: Zipper = {
                row: zrow([builders.char("a"), ss], [builders.char("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = backspace(state);

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
    });

    describe("roots", () => {
        test("deleting from the start of a radicand w/o an index", () => {
            const zipper: Zipper = {
                row: zrow([], row("27").children), // index
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "bcrow",
                            left: row("1+").children,
                            right: [],
                            style: {},
                        },
                        focus: {
                            id: 0,
                            type: "zroot",
                            left: [null], // no index
                            right: [], // the radicand is focused
                            style: {},
                        },
                    },
                ],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = backspace(state);

            expect(result.row.left).toEqualEditorNodes(row("1+").children);
            expect(result.row.right).toEqualEditorNodes(row("27").children);
        });

        test("deleting from the start of a radicand with an index", () => {
            const zipper: Zipper = {
                row: zrow([], row("27").children), // index
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "bcrow",
                            left: row("1+").children,
                            right: [],
                            style: {},
                        },
                        focus: {
                            id: 0,
                            type: "zroot",
                            left: [row("3")], // index
                            right: [], // the radicand is focused
                            style: {},
                        },
                    },
                ],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = backspace(state);

            expect(result.row.left).toEqualEditorNodes(row("1+3").children);
            expect(result.row.right).toEqualEditorNodes(row("27").children);
        });

        test("deleting from the start of an index", () => {
            const zipper: Zipper = {
                row: zrow([], row("3").children),
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "bcrow",
                            left: row("1+").children,
                            right: [],
                            style: {},
                        },
                        focus: {
                            id: 0,
                            type: "zroot",
                            left: [], // the index is focused
                            right: [row("27")], // radicand
                            style: {},
                        },
                    },
                ],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = backspace(state);

            expect(result.row.left).toEqualEditorNodes(row("1+").children);
            expect(result.row.right).toEqualEditorNodes(row("327").children);
        });

        test("deleting from the right of a root w/o an index", () => {
            const r = root(null, "c");
            const zipper: Zipper = {
                row: zrow([builders.char("a"), r], [builders.char("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = backspace(state);

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

        test("deleting from the right of a root with an index", () => {
            const r = root("b", "c");
            const zipper: Zipper = {
                row: zrow([builders.char("a"), r], [builders.char("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = backspace(state);

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
    });

    describe("limits", () => {
        test("deleting from the start of the lower bound w/o an upper bound", () => {
            const zipper: Zipper = {
                row: zrow([], row("x->0").children), // lower bound
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "bcrow",
                            left: [],
                            right: row("x").children,
                            style: {},
                        },
                        focus: {
                            id: 0,
                            type: "zlimits",
                            left: [], // the lower bound is focused
                            right: [null], // no upper bound
                            inner: row("lim"),
                            style: {},
                        },
                    },
                ],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = backspace(state);

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("x->0x").children);
        });

        test("deleting from the start of the bound limit with an upper bound", () => {
            const zipper: Zipper = {
                row: zrow([], row("i=0").children), // lower bound
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "bcrow",
                            left: [],
                            right: row("i").children,
                            style: {},
                        },
                        focus: {
                            id: 0,
                            type: "zlimits",
                            left: [], // the lower bound is focused
                            right: [row("n")], // upper bound
                            inner: row("sum"),
                            style: {},
                        },
                    },
                ],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = backspace(state);

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("i=0ni").children);
        });

        test("deleting from the start of the upper bound", () => {
            const zipper: Zipper = {
                row: zrow([], row("n").children), // upper bound
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "bcrow",
                            left: [],
                            right: row("i").children,
                            style: {},
                        },
                        focus: {
                            id: 0,
                            type: "zlimits",
                            left: [row("i=0")], // lower bound
                            right: [], // the upper bound is focused
                            inner: row("sum"),
                            style: {},
                        },
                    },
                ],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = backspace(state);

            expect(result.row.left).toEqualEditorNodes(row("i=0").children);
            expect(result.row.right).toEqualEditorNodes(row("ni").children);
        });

        test("deleting from the right of a limits node w/o an upper bound", () => {
            const lower: types.CharRow = row("b");
            const inner: types.CharAtom = builders.char("l");
            const lim: types.CharLimits = limits(inner, lower, null);
            const zipper: Zipper = {
                row: zrow([builders.char("a"), lim], [builders.char("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = backspace(state);

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

        test("deleting from the right of a limits node with an upper bound", () => {
            const lower: types.CharRow = row("b");
            const upper: types.CharRow = row("c");
            const inner: types.CharAtom = builders.char("l");
            const sum: types.CharLimits = limits(inner, lower, upper);
            const zipper: Zipper = {
                row: zrow([builders.char("a"), sum], [builders.char("d")]),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = backspace(state);

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
    });

    describe("parens", () => {
        describe("no pending parens", () => {
            test("deleting the right paren should change it to pending", () => {
                const zipper: Zipper = {
                    row: zrow([delimited("2x+5")], []),
                    breadcrumbs: [],
                };
                const state: State = {
                    startZipper: zipper,
                    endZipper: zipper,
                    zipper: zipper,
                    selecting: false,
                };

                const {startZipper: result} = backspace(state);

                expect(result.row.left).toEqualEditorNodes(
                    row("2x+5").children,
                );
                expect(result.row.right).toEqualEditorNodes([]);
                expect(result.breadcrumbs[0].focus.type).toEqual("zdelimited");
                expect(
                    // @ts-expect-error: not bothering to refine this type
                    result.breadcrumbs[0].focus.leftDelim.pending,
                ).toBeFalsy();
                expect(
                    // @ts-expect-error: not bothering to refine this type
                    result.breadcrumbs[0].focus.rightDelim.pending,
                ).toBeTruthy();
            });

            test("deleting the left paren should remove the parens", () => {
                const zipper: Zipper = {
                    row: zrow([], [delimited("2x+5")]),
                    breadcrumbs: [],
                };
                const state: State = {
                    startZipper: zipper,
                    endZipper: zipper,
                    zipper: zipper,
                    selecting: false,
                };

                const {startZipper: result} = backspace(moveRight(state));

                expect(result.row.left).toEqualEditorNodes([]);
                expect(result.row.right).toEqualEditorNodes(
                    row("2x+5").children,
                );
            });
        });

        describe("no pending parens inside existing parens", () => {
            test("deleting the right paren should change it to pending", () => {
                const zipper: Zipper = {
                    row: zrow(
                        [
                            builders.delimited(
                                [
                                    builders.char("2"),
                                    builders.delimited(
                                        row("x+5").children,
                                        builders.char("("),
                                        builders.char(")"),
                                    ),
                                    builders.char("="),
                                    builders.char("1"),
                                    builders.char("0"),
                                ],
                                builders.char("("),
                                builders.char(")"),
                            ),
                        ],
                        [],
                    ),
                    breadcrumbs: [],
                };
                const state: State = {
                    startZipper: zipper,
                    endZipper: zipper,
                    zipper: zipper,
                    selecting: false,
                };

                const {startZipper: result} = backspace(
                    moveLeft(moveLeft(moveLeft(moveLeft(state)))),
                );

                expect(result.row.left).toEqualEditorNodes(row("x+5").children);
                expect(
                    // @ts-expect-error: not bothering to refine this type
                    result.breadcrumbs[1].focus.leftDelim.pending,
                ).toBeFalsy();
                expect(
                    // @ts-expect-error: not bothering to refine this type
                    result.breadcrumbs[1].focus.rightDelim.pending,
                ).toBeTruthy();
            });

            test("deleting the left paren should remove the parens", () => {
                const zipper: Zipper = {
                    row: zrow(
                        [],
                        [
                            builders.delimited(
                                [
                                    builders.char("2"),
                                    builders.delimited(
                                        row("x+5").children,
                                        builders.char("("),
                                        builders.char(")"),
                                    ),
                                    builders.char("="),
                                    builders.char("1"),
                                    builders.char("0"),
                                ],
                                builders.char("("),
                                builders.char(")"),
                            ),
                        ],
                    ),
                    breadcrumbs: [],
                };
                const state: State = {
                    startZipper: zipper,
                    endZipper: zipper,
                    zipper: zipper,
                    selecting: false,
                };

                const {startZipper: result} = backspace(
                    moveRight(moveRight(moveRight(state))),
                );

                expect(result.row.left).toEqualEditorNodes(row("2").children);
                expect(result.row.right).toEqualEditorNodes(
                    row("x+5=10").children,
                );
                expect(result.breadcrumbs).toHaveLength(1);
                expect(result.breadcrumbs[0].focus.type).toEqual("zdelimited");
                expect(
                    // @ts-expect-error: not bothering to refine this type
                    result.breadcrumbs[0].focus.leftDelim.pending,
                ).toBeFalsy();
                expect(
                    // @ts-expect-error: not bothering to refine this type
                    result.breadcrumbs[0].focus.rightDelim.pending,
                ).toBeFalsy();
            });
        });

        describe("pending parens", () => {
            test("deleting the right non-pending paren should delete both parens", () => {
                const zipper: Zipper = {
                    row: zrow(
                        [
                            builders.delimited(
                                row("2x+5").children,
                                builders.char("(", true),
                                builders.char(")"),
                            ),
                        ],
                        [],
                    ),
                    breadcrumbs: [],
                };
                const state: State = {
                    startZipper: zipper,
                    endZipper: zipper,
                    zipper: zipper,
                    selecting: false,
                };

                const {startZipper: result} = backspace(state);

                expect(result.row.left).toEqualEditorNodes(
                    row("2x+5").children,
                );
                expect(result.row.right).toEqualEditorNodes([]);
            });
            test("deleting the left non-pending paren should delete both parens", () => {
                const zipper: Zipper = {
                    row: zrow(
                        [],
                        [
                            builders.delimited(
                                row("2x+5").children,
                                builders.char("(", true),
                                builders.char(")"),
                            ),
                        ],
                    ),
                    breadcrumbs: [],
                };
                const state: State = {
                    startZipper: zipper,
                    endZipper: zipper,
                    zipper: zipper,
                    selecting: false,
                };

                const {startZipper: result} = backspace(moveRight(state));

                expect(result.row.left).toEqualEditorNodes([]);
                expect(result.row.right).toEqualEditorNodes(
                    row("2x+5").children,
                );
            });
        });
    });

    describe("with selection", () => {
        test("it should deleting it", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: row("2x").children,
                    selection: row("+5").children,
                    right: row("=10").children,
                    style: {},
                },
                breadcrumbs: [],
            };
            const state: State = {
                // TODO: update startZipper and endZipper to be realistic
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = backspace(state);

            expect(result.row.left).toEqualEditorNodes(row("2x").children);
            expect(result.row.right).toEqualEditorNodes(row("=10").children);
        });
    });
});
