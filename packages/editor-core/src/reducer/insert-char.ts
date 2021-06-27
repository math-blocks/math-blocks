import * as builders from "../ast/builders";
import * as types from "../ast/types";

import * as util from "./util";
import {moveRight} from "./move-right";

import type {Zipper, State} from "./types";

// TODO: place cursor in lower limits
const LIMIT_CHARS = [
    "\u03a3", // \sum
    "\u03a0", // \prod
    "\u222B", // \int
    // TODO: handle \lim (need to make sure we exclude the upper limit)
];

const isAtom = (node: types.Node, charOrChars: string | string[]): boolean => {
    if (node.type === "atom") {
        return Array.isArray(charOrChars)
            ? charOrChars.includes(node.value.char)
            : charOrChars === node.value.char;
    }
    return false;
};

const isCellPlusMinus = (cell: types.Row | null): boolean =>
    cell?.children.length === 1 && isAtom(cell.children[0], ["+", "\u2212"]);

const isCellRelationOperator = (cell: types.Row | null): boolean =>
    cell?.children.length === 1 && isAtom(cell.children[0], ["=", ">", "<"]);

export const insertChar = (state: State, char: string): State => {
    const zipper = state.zipper;
    const {left, selection} = zipper.row;
    let newNode;
    if (LIMIT_CHARS.includes(char)) {
        newNode = builders.limits(builders.glyph(char), [], []);
    } else {
        newNode = builders.glyph(char);
    }

    if (selection.length > 0) {
        // When inserting limits, we move the current selection to the right
        // of the new node.
        const newLeft = LIMIT_CHARS.includes(char)
            ? [...left, newNode, ...selection]
            : [...left, newNode];

        const newZipper: Zipper = {
            ...zipper,
            row: {
                ...zipper.row,
                selection: [],
                left: newLeft,
            },
        };
        return {
            startZipper: newZipper,
            endZipper: newZipper,
            zipper: newZipper,
            selecting: false,
        };
    }

    const {breadcrumbs, row: oldRow} = zipper;
    if (breadcrumbs.length > 0) {
        const {focus} = breadcrumbs[breadcrumbs.length - 1];

        if (focus.type === "ztable" && focus.subtype === "algebra") {
            const currentIndex = focus.left.length;
            const col = currentIndex % focus.colCount;
            const row = Math.floor(currentIndex / focus.colCount);

            if (row > 0) {
                const cells: (types.Row | null)[] = [
                    ...focus.left,
                    util.zrowToRow(oldRow),
                    ...focus.right,
                ];

                const topRowCell = cells[col];

                // If the top-row cell in the same column as the cursor contains
                // a plus/minus operator:
                // - if the char being inserted is also a plus/minus operator,
                //   insert it and move right
                // - otherwise, move right first and then insert the char
                if (isCellPlusMinus(topRowCell)) {
                    if (["+", "\u2212"].includes(char)) {
                        const newZipper: Zipper = {
                            ...zipper,
                            row: {
                                ...zipper.row,
                                left: [...left, newNode],
                            },
                        };
                        return moveRight(util.zipperToState(newZipper));
                    } else {
                        const newState = moveRight({
                            ...state,
                            selecting: false,
                        });
                        const zipper = newState.zipper;
                        const {left} = zipper.row;
                        const newZipper: Zipper = {
                            ...zipper,
                            row: {
                                ...zipper.row,
                                left: [...left, newNode],
                            },
                        };
                        return util.zipperToState(newZipper);
                    }
                }
                // If the top-row cell in the same column as the cursor contains
                // a relation operator:
                // - if the char being inserted is also a relation operator,
                //   insert it and move right
                // - otherwise, move right first and then insert the char
                else if (isCellRelationOperator(topRowCell)) {
                    if (["=", ">", "<"].includes(char)) {
                        const newZipper: Zipper = {
                            ...zipper,
                            row: {
                                ...zipper.row,
                                left: [...left, newNode],
                            },
                        };
                        return moveRight(util.zipperToState(newZipper));
                    } else {
                        const newState = moveRight({
                            ...state,
                            selecting: false,
                        });
                        const zipper = newState.zipper;
                        const {left} = zipper.row;
                        const newZipper: Zipper = {
                            ...zipper,
                            row: {
                                ...zipper.row,
                                left: [...left, newNode],
                            },
                        };
                        return util.zipperToState(newZipper);
                    }
                }
            }
        }
    }

    const newZipper: Zipper = {
        ...zipper,
        row: {
            ...zipper.row,
            left: [...left, newNode],
        },
    };

    return util.zipperToState(newZipper);
};
