import * as types from "../../ast/types";
import {isAtom} from "../../ast/util";

import * as util from "../util";
import {cursorLeft} from "../move-left";
import {
    zipperToVerticalWork,
    verticalWorkToZTable,
    adjustEmptyColumns,
} from "./utils";

import type {Breadcrumb, Zipper, State} from "../types";

// TODO: rename this and move into utils
const removeEmptyColumns = (zipper: Zipper): Zipper => {
    const work = zipperToVerticalWork(zipper);
    if (!work) {
        return zipper;
    }
    const adjustedWork = adjustEmptyColumns(work);
    return verticalWorkToZTable(adjustedWork);
};

const isPlusMinus = (cell: types.Row | null): cell is types.Row =>
    cell?.children.length === 1 &&
    isAtom(cell.children[0], ["+", "\u2212", "="]);

export const backspace = (state: State): State => {
    const zipper = state.zipper;

    const {breadcrumbs} = zipper;
    if (breadcrumbs.length === 0) {
        return state;
    }

    const crumb = breadcrumbs[breadcrumbs.length - 1];
    const {focus} = crumb;

    const prevCell = focus.left[focus.left.length - 1];
    // If the previous cell is a single plus/minus character, delete it
    // and move into that cell.
    if (isPlusMinus(prevCell)) {
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
        let newZipper: Zipper = {
            ...zipper,
            breadcrumbs: [...breadcrumbs.slice(0, -1), newCrumb],
        };
        newZipper = cursorLeft(newZipper);
        newZipper = removeEmptyColumns(newZipper);
        // Move left into the now empty cell.
        return util.zipperToState(newZipper);
    }

    // TODO: figure out what we want to do for deleting at the start of
    // a non-empty cell.
    if (zipper.row.left.length === 0 && zipper.row.right.length === 0) {
        const newZipper = removeEmptyColumns(cursorLeft(zipper));
        return util.zipperToState(newZipper);
    }

    return state;
};
