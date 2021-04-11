import {Dir} from "./enums";
import {rezipSelection, zdelimited, zrow} from "./util";
import {moveLeft} from "./move-left";

import type {Breadcrumb, Zipper} from "./types";

export const backspace = (zipper: Zipper): Zipper => {
    zipper = rezipSelection(zipper);
    const {selection} = zipper.row;

    if (selection) {
        return {
            ...zipper,
            row: {
                ...zipper.row,
                selection: null,
            },
        };
    }

    if (zipper.row.left.length > 0) {
        const {left, right} = zipper.row;
        const prev = left[left.length - 1];

        if (prev.type === "delimited") {
            const crumb: Breadcrumb = {
                row: zrow(zipper.row.id, left.slice(0, -1), []),
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
        } else if (prev.type !== "atom") {
            return moveLeft(zipper);
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

    const children = focus.other ? focus.other.children : [];

    if (focus.dir === Dir.Left) {
        return {
            breadcrumbs: breadcrumbs.slice(0, -1),
            row: {
                ...row,
                right: [...zipper.row.right, ...children, ...row.right],
            },
        };
    } else {
        if (focus.type === "zsubsup" && focus.other) {
            return {
                breadcrumbs: breadcrumbs.slice(0, -1),
                row: {
                    ...row,
                    left: [
                        ...row.left,
                        {
                            id: focus.id,
                            type: "subsup",
                            children: [focus.other, null],
                        },
                    ],
                    right: [...zipper.row.right, ...row.right],
                },
            };
        }

        return {
            breadcrumbs: breadcrumbs.slice(0, -1),
            row: {
                ...row,
                left: [...row.left, ...children],
                right: [...zipper.row.right, ...row.right],
            },
        };
    }
};
