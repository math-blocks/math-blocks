import {zdelimited, zrow} from "./util";
import {moveLeft} from "./move-left";

import type {Breadcrumb, Zipper} from "./types";

export const backspace = (zipper: Zipper): Zipper => {
    const {selection} = zipper.row;

    if (selection.length > 0) {
        return {
            ...zipper,
            row: {
                ...zipper.row,
                selection: [],
            },
        };
    }

    if (zipper.row.left.length > 0) {
        const {left, right} = zipper.row;
        const prev = left[left.length - 1];

        if (prev.type === "delimited") {
            if (prev.leftDelim.value.pending) {
                const newZipper: Zipper = {
                    ...zipper,
                    row: {
                        ...zipper.row,
                        left: [
                            ...left.slice(0, -1),
                            ...prev.children[0].children,
                        ],
                    },
                };

                return newZipper;
            } else {
                const crumb: Breadcrumb = {
                    row: {
                        type: "bcrow",
                        id: zipper.row.id,
                        left: left.slice(0, -1),
                        right: [],
                        style: zipper.row.style,
                    },
                    focus: {
                        ...zdelimited(prev),
                        rightDelim: {
                            ...prev.rightDelim,
                            value: {
                                ...prev.rightDelim.value,
                                pending: true,
                            },
                        },
                    },
                };

                const newZipper: Zipper = {
                    ...zipper,
                    breadcrumbs: [...zipper.breadcrumbs, crumb],
                    row: zrow(
                        prev.children[0].id,
                        prev.children[0].children,
                        right,
                    ),
                };

                return newZipper;
            }
        } else if (prev.type !== "atom") {
            const state = moveLeft({
                startZipper: zipper,
                endZipper: null,
                selecting: false,
            });
            return state.startZipper;
        }

        return {
            ...zipper,
            row: {
                ...zipper.row,
                left: zipper.row.left.slice(0, -1),
            },
        };
    }

    const {breadcrumbs} = zipper;

    if (breadcrumbs.length === 0) {
        return zipper;
    }

    const parent = breadcrumbs[breadcrumbs.length - 1];
    const {focus, row} = parent;

    // Special deleting from the start of a superscript when there's both a
    // superscript and subscript.
    // - before: a_n^|2
    // - after: a_n|2
    if (focus.type === "zsubsup" && focus.left[0]) {
        return {
            breadcrumbs: breadcrumbs.slice(0, -1),
            row: {
                type: "zrow",
                id: row.id,
                left: [
                    ...row.left,
                    {
                        id: focus.id,
                        type: "subsup",
                        children: [focus.left[0], null],
                        style: focus.style,
                    },
                ],
                selection: [],
                right: [...zipper.row.right, ...row.right],
                style: row.style,
            },
        };
    }

    const leftChildren = focus.left[0] ? focus.left[0].children : [];
    const rightChildren = focus.right[0] ? focus.right[0].children : [];

    return {
        breadcrumbs: breadcrumbs.slice(0, -1),
        row: {
            type: "zrow",
            id: row.id,
            left: [...row.left, ...leftChildren],
            selection: [],
            right: [...zipper.row.right, ...rightChildren, ...row.right],
            style: row.style,
        },
    };
};
