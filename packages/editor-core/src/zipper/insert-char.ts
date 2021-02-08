import * as builders from "../builders";

import {Zipper} from "./types";

export const insertChar = (zipper: Zipper, char: string): Zipper => {
    const newNode = builders.glyph(char);

    return {
        ...zipper,
        row: {
            ...zipper.row,
            left: [...zipper.row.left, newNode],
        },
    };
};
