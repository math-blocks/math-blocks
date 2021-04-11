import {getId} from "@math-blocks/core";

import {backspace} from "./backspace";
import {insertChar} from "./insert-char";
import {moveLeft} from "./move-left";
import {moveRight} from "./move-right";
import {parens} from "./parens";
import {root} from "./root";
import {slash} from "./slash";
import {subsup} from "./subsup";
import {Dir} from "./enums";
import {zrow} from "./util";
import type {Zipper} from "./types";

export type State = Zipper;

const initialState: State = {
    row: zrow(getId(), [], []),
    breadcrumbs: [],
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
            return moveLeft(state, !!action.shift);
        }
        case "ArrowRight": {
            return moveRight(state, !!action.shift);
        }
        case "Backspace": {
            return backspace(state);
        }
        case "_": {
            return subsup(state, Dir.Left);
        }
        case "^": {
            return subsup(state, Dir.Right);
        }
        case "(": {
            return parens(state, Dir.Left);
        }
        case ")": {
            return parens(state, Dir.Right);
        }
        case "/": {
            return slash(state);
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
