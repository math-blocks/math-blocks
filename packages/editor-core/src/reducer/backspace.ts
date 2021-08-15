import * as util from "./util";
import {moveLeft} from "./move-left";
import {verticalWork} from "./vertical-work/reducer";

import type {Breadcrumb, Zipper, State} from "./types";

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

    const {breadcrumbs} = zipper;
    const crumb = breadcrumbs[breadcrumbs.length - 1];
    if (crumb) {
        const {focus} = crumb;
        if (focus.type === "ztable" && focus.subtype === "algebra") {
            const newState = verticalWork(state, {type: "Backspace"});
            if (newState !== state) {
                return newState;
            }
        }
    }

    if (zipper.row.left.length > 0) {
        const {left, right} = zipper.row;
        const prev = left[left.length - 1];

        if (prev.type === "delimited") {
            if (prev.leftDelim.pending) {
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
                            pending: true,
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
        } else if (prev.type !== "char") {
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

    if (breadcrumbs.length === 0) {
        return {
            startZipper: zipper,
            endZipper: zipper,
            zipper: zipper,
            selecting: false,
        };
    }

    const {focus, row} = crumb;

    if (focus.type === "ztable" && focus.subtype !== "algebra") {
        return moveLeft(util.zipperToState(zipper));
    }

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
