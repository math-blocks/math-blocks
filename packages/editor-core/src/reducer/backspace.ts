import * as types from "../ast/types";
import {isAtom} from "../ast/util";

import * as util from "./util";
import {moveLeft} from "./move-left";

import type {Breadcrumb, Zipper, State} from "./types";

const isCellPlusMinus = (cell: types.Row | null): cell is types.Row =>
    cell?.children.length === 1 &&
    isAtom(cell.children[0], ["+", "\u2212", "="]);

export const backspace = (state: State): State => {
    const zipper = state.zipper;
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
            endZipper: newZipper,
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
                    endZipper: newZipper,
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
                        ...util.zdelimited(prev),
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
                    row: util.zrow(
                        prev.children[0].id,
                        prev.children[0].children,
                        right,
                    ),
                };

                return {
                    startZipper: newZipper,
                    endZipper: newZipper,
                    zipper: newZipper,
                    selecting: false,
                };
            }
        } else if (prev.type !== "atom") {
            return moveLeft({
                startZipper: zipper,
                endZipper: zipper,
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
            endZipper: newZipper,
            zipper: newZipper,
            selecting: false,
        };
    }

    const {breadcrumbs} = zipper;

    if (breadcrumbs.length === 0) {
        return {
            startZipper: zipper,
            endZipper: zipper,
            zipper: zipper,
            selecting: false,
        };
    }

    const crumb = breadcrumbs[breadcrumbs.length - 1];
    const {focus, row} = crumb;

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
            endZipper: newZipper,
            zipper: newZipper,
            selecting: false,
        };
    }

    if (focus.type === "ztable") {
        if (focus.subtype === "algebra") {
            const prevCell = focus.left[focus.left.length - 1];
            // If the previous cell is a single plus/minus character, delete it
            // and move into that cell.
            if (isCellPlusMinus(prevCell)) {
                // Erase the contents of the previous cell
                const newPrevCell = {
                    ...prevCell,
                    children: [],
                };
                const newCrumb: Breadcrumb = {
                    ...crumb,
                    focus: {
                        ...focus,
                        left: [...focus.left.slice(0, -1), newPrevCell],
                    },
                };
                const newZipper: Zipper = {
                    ...zipper,
                    breadcrumbs: [...breadcrumbs.slice(0, -1), newCrumb],
                };
                // Move left into the now empty cell.
                return moveLeft(util.zipperToState(newZipper));
            }
        }

        return moveLeft(util.zipperToState(zipper));
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
        endZipper: newZipper,
        zipper: newZipper,
        selecting: false,
    };
};
