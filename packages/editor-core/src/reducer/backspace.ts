import {zdelimited, zrow} from "./util";
import {moveLeft} from "./move-left";

import type {Breadcrumb, Zipper, State} from "./types";

export const backspace = (state: State): State => {
    // TODO: change this to const {zipper} = state.zipper; once we've added it
    const zipper = state.startZipper;
    const {selection} = zipper.row;

    if (selection.length > 0) {
        const newZipper = {
            ...zipper,
            row: {
                ...zipper.row,
                selection: [],
            },
        };

        return {
            startZipper: newZipper,
            endZipper: null,
            zipper: newZipper,
            selecting: false,
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

                return {
                    startZipper: newZipper,
                    endZipper: null,
                    zipper: newZipper,
                    selecting: false,
                };
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

                return {
                    startZipper: newZipper,
                    endZipper: null,
                    zipper: newZipper,
                    selecting: false,
                };
            }
        } else if (prev.type !== "atom") {
            return moveLeft({
                startZipper: zipper,
                endZipper: null,
                zipper: zipper,
                selecting: false,
            });
        }

        const newZipper = {
            ...zipper,
            row: {
                ...zipper.row,
                left: zipper.row.left.slice(0, -1),
            },
        };

        return {
            startZipper: newZipper,
            endZipper: null,
            zipper: newZipper,
            selecting: false,
        };
    }

    const {breadcrumbs} = zipper;

    if (breadcrumbs.length === 0) {
        return {
            startZipper: zipper,
            endZipper: null,
            zipper: zipper,
            selecting: false,
        };
    }

    const parent = breadcrumbs[breadcrumbs.length - 1];
    const {focus, row} = parent;

    // Special deleting from the start of a superscript when there's both a
    // superscript and subscript.
    // - before: a_n^|2
    // - after: a_n|2
    if (focus.type === "zsubsup" && focus.left[0]) {
        const newZipper: Zipper = {
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

        return {
            startZipper: newZipper,
            endZipper: null,
            zipper: newZipper,
            selecting: false,
        };
    }

    const leftChildren = focus.left[0] ? focus.left[0].children : [];
    const rightChildren = focus.right[0] ? focus.right[0].children : [];

    const newZipper: Zipper = {
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

    return {
        startZipper: newZipper,
        endZipper: null,
        zipper: newZipper,
        selecting: false,
    };
};
