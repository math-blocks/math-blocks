import {backspace} from "./backspace";
import {insertChar} from "./insert-char";
import {moveLeft} from "./move-left";
import {moveRight} from "./move-right";
import {parens} from "./parens";
import {root} from "./root";
import {subsup} from "./subsup";

import {Zipper} from "./types";

export type State = Zipper;

const initialState: State = {
    row: {
        type: "zrow",
        id: 0,
        left: [],
        right: [],
    },
    path: [],
};

type Action = {type: string; shift?: boolean};

// TODO: check if cursor is valid before process action
// Even better, replace the cursor with a zip-tree
export const zipperReducer = (
    state: State = initialState,
    action: Action,
): State => {
    switch (action.type) {
        case "ArrowLeft": {
            return moveLeft(state);
        }
        case "ArrowRight": {
            return moveRight(state);
        }
        case "Backspace": {
            return backspace(state);
        }
        case "_": {
            return subsup(state, "left");
        }
        case "^": {
            return subsup(state, "right");
        }
        case "(": {
            return parens(state, "left");
        }
        case ")": {
            return parens(state, "right");
        }
        // TODO: use "Sqrt" and "NthRoot" to differentiate the two possibilities
        case "\u221A": {
            return root(state, false);
        }
        // We don't handle any other actions yet so ignore them and return the
        // current state.
        default: {
            if (action.type.length === 1 && action.type.charCodeAt(0) >= 32) {
                let char = action.type;
                if (char === "*") {
                    char = "\u00B7";
                } else if (char === "-") {
                    char = "\u2212";
                }
                return insertChar(state, char);
            }
            return state;
        }
    }
};
