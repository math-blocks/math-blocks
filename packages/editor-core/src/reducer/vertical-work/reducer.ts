import {insertChar} from "./insert-char";
import {moveUp, moveDown} from "./move-vertically";

import type {State} from "../types";
import type {Action} from "../action-types";

export const verticalWork = (state: State, action: Action): State => {
    switch (action.type) {
        case "ArrowUp":
            return moveUp(state);
        case "ArrowDown":
            return moveDown(state);
        case "InsertChar":
            return insertChar(state, action.char);
        default:
            return state;
    }
};
