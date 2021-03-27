import {backspace} from "../backspace";
import {row, frac, subsup, root, toEqualEditorNodes} from "../test-util";
import {Dir} from "../enums";
import * as builders from "../../builders";
import * as types from "../../types";

import type {Zipper} from "../types";

expect.extend({toEqualEditorNodes});

describe("backspace", () => {
    test("it deletes characters at the end", () => {
        const zipper: Zipper = {
            row: {
                id: 0,
                type: "zrow",
                left: row("1+2").children,
                selection: null,
                right: [],
            },
            breadcrumbs: [],
        };

        const result = backspace(zipper);

        expect(result.row.left).toEqualEditorNodes(row("1+").children);
        expect(result.row.right).toEqualEditorNodes(row("").children);
    });

    test("it deletes characters in the middle", () => {
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

        const result = backspace(zipper);

        expect(result.row.left).toEqualEditorNodes(row("1").children);
        expect(result.row.right).toEqualEditorNodes(row("2").children);
    });

    test("it does nothing at the start", () => {
        const zipper: Zipper = {
            row: {
                id: 0,
                type: "zrow",
                left: [],
                selection: null,
                right: row("1+2").children,
            },
            breadcrumbs: [],
        };

        const result = backspace(zipper);

        expect(result.row.left).toEqualEditorNodes(row("").children);
        expect(result.row.right).toEqualEditorNodes(row("1+2").children);
    });

    describe("fractions", () => {
        test("deleting from the start of the numerator", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("2").children, // numerator
                },
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "zrow",
                            left: row("1+").children,
                            selection: null,
                            right: [],
                        },
                        focus: {
                            id: 0,
                            type: "zfrac",
                            dir: Dir.Left, // the numerator is focused
                            other: row("3"), // denominator
                        },
                    },
                ],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(row("1+").children);
            expect(result.row.right).toEqualEditorNodes(row("23").children);
        });

        test("deleting from the start of the denominator", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("3").children, // denominator
                },
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "zrow",
                            left: row("1+").children,
                            selection: null,
                            right: [],
                        },
                        focus: {
                            id: 0,
                            type: "zfrac",
                            dir: Dir.Right, // the denominator is focused
                            other: row("2"), // numerator
                        },
                    },
                ],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(row("1+2").children);
            expect(result.row.right).toEqualEditorNodes(row("3").children);
        });

        test("deleting from the right of the fraction moves into the denonominator", () => {
            const f = frac("b", "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), f],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                breadcrumbs: [],
            };

            const result = backspace(zipper);

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: f.id,
                type: "zfrac",
                dir: Dir.Right,
                other: f.children[0],
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(f.children[1].children[0]);
        });
    });

    describe("subsup", () => {
        test("deleting from the start of the subscript w/o a superscript", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("n").children, // subscript
                },
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "zrow",
                            left: row("x").children,
                            selection: null,
                            right: [],
                        },
                        focus: {
                            id: 0,
                            type: "zsubsup",
                            dir: Dir.Left, // the subscript is focused
                            other: null, // no superscript
                        },
                    },
                ],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(row("x").children);
            expect(result.row.right).toEqualEditorNodes(row("n").children);
        });

        test("deleting from the start of the subscript with a superscript", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("n").children, // sbuscript
                },
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "zrow",
                            left: row("x").children,
                            selection: null,
                            right: [],
                        },
                        focus: {
                            id: 0,
                            type: "zsubsup",
                            dir: Dir.Left, // the subscript is focused
                            other: row("2"), // superscript
                        },
                    },
                ],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(row("x").children);
            expect(result.row.right).toEqualEditorNodes(row("n2").children);
        });

        test("deleting from the start of the superscript w/o a subscript", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("2").children, // superscript
                },
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "zrow",
                            left: row("x").children,
                            selection: null,
                            right: [],
                        },
                        focus: {
                            id: 0,
                            type: "zsubsup",
                            dir: Dir.Right, // the superscript is focused
                            other: null, // no subscript
                        },
                    },
                ],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(row("x").children);
            expect(result.row.right).toEqualEditorNodes(row("2").children);
        });

        test("deleting from the start of the superscript with a subscript", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("2").children, // superscript
                },
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "zrow",
                            left: row("x").children,
                            selection: null,
                            right: [],
                        },
                        focus: {
                            id: 0,
                            type: "zsubsup",
                            dir: Dir.Right, // the superscript is focused
                            other: row("n"), // subscript
                        },
                    },
                ],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(
                builders.row([
                    builders.glyph("x"),
                    builders.subsup([builders.glyph("n")], undefined),
                ]).children,
            );
            expect(result.row.right).toEqualEditorNodes(row("2").children);
        });

        test("deleting from the right of a subscript", () => {
            const ss = subsup("b", null);
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), ss],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                breadcrumbs: [],
            };

            const result = backspace(zipper);

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                dir: Dir.Left,
                other: null,
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(ss.children[0]?.children[0]);
        });

        test("deleting from the right of a superscript", () => {
            const ss = subsup(null, "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), ss],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                breadcrumbs: [],
            };

            const result = backspace(zipper);

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: ss.id,
                type: "zsubsup",
                dir: Dir.Right,
                other: null,
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(ss.children[1]?.children[0]);
        });
    });

    describe("roots", () => {
        test("deleting from the start of a radicand w/o an index", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("27").children, // index
                },
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "zrow",
                            left: row("1+").children,
                            selection: null,
                            right: [],
                        },
                        focus: {
                            id: 0,
                            type: "zroot",
                            dir: Dir.Right, // the radicand is focused
                            other: null, // no index
                        },
                    },
                ],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(row("1+").children);
            expect(result.row.right).toEqualEditorNodes(row("27").children);
        });

        test("deleting from the start of a radicand with an index", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("27").children, // index
                },
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "zrow",
                            left: row("1+").children,
                            selection: null,
                            right: [],
                        },
                        focus: {
                            id: 0,
                            type: "zroot",
                            dir: Dir.Right, // the radicand is focused
                            other: row("3"), // index
                        },
                    },
                ],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(row("1+3").children);
            expect(result.row.right).toEqualEditorNodes(row("27").children);
        });

        test("deleting from the start of an index", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("3").children,
                },
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "zrow",
                            left: row("1+").children,
                            selection: null,
                            right: [],
                        },
                        focus: {
                            id: 0,
                            type: "zroot",
                            dir: Dir.Left, // the index is focused
                            other: row("27"), // radicand
                        },
                    },
                ],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(row("1+").children);
            expect(result.row.right).toEqualEditorNodes(row("327").children);
        });

        test("deleting from the right of a root w/o an index", () => {
            const r = root(null, "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), r],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                breadcrumbs: [],
            };

            const result = backspace(zipper);

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: r.id,
                type: "zroot",
                dir: Dir.Right,
                other: null,
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(r.children[1]?.children[0]);
        });

        test("deleting from the right of a root with an index", () => {
            const r = root("b", "c");
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("a"), r],
                    selection: null,
                    right: [builders.glyph("d")],
                },
                breadcrumbs: [],
            };

            const result = backspace(zipper);

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: r.id,
                type: "zroot",
                dir: Dir.Right,
                other: r.children[0],
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(r.children[1]?.children[0]);
        });
    });

    describe("limits", () => {
        test("deleting from the start of the lower bound w/o an upper bound", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("x->0").children, // lower bound
                },
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "zrow",
                            left: [],
                            selection: null,
                            right: row("x").children,
                        },
                        focus: {
                            id: 0,
                            type: "zlimits",
                            dir: Dir.Left, // the lower bound is focused
                            other: null, // no upper bound
                            inner: row("lim"),
                        },
                    },
                ],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("x->0x").children);
        });

        test("deleting from the start of the bound limit with an upper bound", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("i=0").children, // lower bound
                },
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "zrow",
                            left: [],
                            selection: null,
                            right: row("i").children,
                        },
                        focus: {
                            id: 0,
                            type: "zlimits",
                            dir: Dir.Left, // the lower bound is focused
                            other: row("n"), // upper bound
                            inner: row("sum"),
                        },
                    },
                ],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("i=0ni").children);
        });

        test("deleting from the start of the upper bound", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("n").children, // upper bound
                },
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "zrow",
                            left: [],
                            selection: null,
                            right: row("i").children,
                        },
                        focus: {
                            id: 0,
                            type: "zlimits",
                            dir: Dir.Right, // the upper bound is focused
                            other: row("i=0"), // lower bound
                            inner: row("sum"),
                        },
                    },
                ],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(row("i=0").children);
            expect(result.row.right).toEqualEditorNodes(row("ni").children);
        });

        test("deleting from the right of a limits node w/o an upper bound", () => {
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
                breadcrumbs: [],
            };

            const result = backspace(zipper);

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: lim.id,
                type: "zlimits",
                dir: Dir.Left,
                other: null,
                inner: inner,
            });
            expect(result.row.left).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.row.left[0]).toEqual(lower.children[0]);
        });

        test("deleting from the right of a limits node with an upper bound", () => {
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
                breadcrumbs: [],
            };

            const result = backspace(zipper);

            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toEqual({
                id: sum.id,
                type: "zlimits",
                dir: Dir.Right,
                other: lower,
                inner: inner,
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
                    row: {
                        id: 0,
                        type: "zrow",
                        left: row("(2x+5)").children,
                        selection: null,
                        right: [],
                    },
                    breadcrumbs: [],
                };

                const result = backspace(zipper);

                expect(result.row.left).toEqualEditorNodes(
                    row("(2x+5").children,
                );
                expect(result.row.right).toEqualEditorNodes([
                    builders.glyph(")", true),
                ]);
            });

            test("deleting the left paren should change it to pending", () => {
                const zipper: Zipper = {
                    row: {
                        id: 0,
                        type: "zrow",
                        left: [builders.glyph("(")],
                        selection: null,
                        right: row("2x+5)").children,
                    },
                    breadcrumbs: [],
                };

                const result = backspace(zipper);

                expect(result.row.left).toEqualEditorNodes([
                    builders.glyph("(", true),
                ]);
                expect(result.row.right).toEqualEditorNodes(
                    row("2x+5)").children,
                );
            });
        });

        describe("no pending parens inside existing parens", () => {
            test("deleting the right paren should change it to pending", () => {
                const zipper: Zipper = {
                    row: {
                        id: 0,
                        type: "zrow",
                        left: row("(2(x+5)").children,
                        selection: null,
                        right: row("=10)").children,
                    },
                    breadcrumbs: [],
                };

                const result = backspace(zipper);

                expect(result.row.left).toEqualEditorNodes(
                    row("(2(x+5").children,
                );
                expect(result.row.right).toEqualEditorNodes([
                    ...row("=10").children,
                    builders.glyph(")", true),
                    builders.glyph(")"),
                ]);
            });

            test("deleting the left paren should change it to pending", () => {
                const zipper: Zipper = {
                    row: {
                        id: 0,
                        type: "zrow",
                        left: row("(2(").children,
                        selection: null,
                        right: row("x+5)=10)").children,
                    },
                    breadcrumbs: [],
                };

                const result = backspace(zipper);

                expect(result.row.left).toEqualEditorNodes([
                    builders.glyph("("),
                    builders.glyph("(", true),
                    builders.glyph("2"),
                ]);
                expect(result.row.right).toEqualEditorNodes([
                    ...row("x+5)=10)").children,
                ]);
            });
        });

        describe("pending parens", () => {
            test("deleting the right non-pending paren should delete both parens", () => {
                const zipper: Zipper = {
                    row: {
                        id: 0,
                        type: "zrow",
                        left: [
                            builders.glyph("(", true),
                            ...row("2x+5)").children,
                        ],
                        selection: null,
                        right: [],
                    },
                    breadcrumbs: [],
                };

                const result = backspace(zipper);

                expect(result.row.left).toEqualEditorNodes(
                    row("2x+5").children,
                );
                expect(result.row.right).toEqualEditorNodes([]);
            });
            test("deleting the left non-pending paren should delete both parens", () => {
                const zipper: Zipper = {
                    row: {
                        id: 0,
                        type: "zrow",
                        left: row("(").children,

                        selection: null,
                        right: [
                            ...row("2x+5").children,
                            builders.glyph(")", true),
                        ],
                    },
                    breadcrumbs: [],
                };

                const result = backspace(zipper);

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
                    selection: {
                        dir: Dir.Left,
                        nodes: row("+5").children,
                    },
                    right: row("=10").children,
                },
                breadcrumbs: [],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(row("2x").children);
            expect(result.row.right).toEqualEditorNodes(row("=10").children);
        });
    });
});
