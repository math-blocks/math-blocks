import * as builders from "../builders";

import {Zipper} from "./types";
import {splitArrayAt} from "./array-util";

export const insertChar = (zipper: Zipper, char: string): Zipper => {
    const {left, selection} = zipper.row;
    const newNode = builders.glyph(char);

    if (selection) {
        const index = zipper.breadcrumbs.findIndex(
            (crumb) => crumb.row.selection !== null,
        );

        if (index === -1) {
            return {
                ...zipper,
                row: {
                    ...zipper.row,
                    selection: null,
                    left: [...left, newNode],
                },
            };
        }

        const [restCrumbs, topCrumbs] = splitArrayAt(zipper.breadcrumbs, index);

        return {
            ...zipper,
            row: {
                ...topCrumbs[0].row,
                selection: null,
                left: [...topCrumbs[0].row.left, newNode],
            },
            breadcrumbs: restCrumbs,
        };
    }

    return {
        ...zipper,
        row: {
            ...zipper.row,
            left: [...left, newNode],
        },
    };
};
