import {selectionZipperFromZippers} from "./convert";

import type {State, Zipper} from "./types";

export const positionCursor = (state: State, cursorZipper: Zipper): State => {
    const {startZipper} = state;
    if (state.selecting) {
        const selectionZipper = selectionZipperFromZippers(
            startZipper,
            cursorZipper,
        );
        if (selectionZipper) {
            return {
                ...state,
                endZipper: cursorZipper,
                zipper: selectionZipper,
            };
        }
    } else {
        return {
            ...state,
            startZipper: cursorZipper,
            endZipper: cursorZipper,
            zipper: cursorZipper,
        };
    }

    return state;
};
