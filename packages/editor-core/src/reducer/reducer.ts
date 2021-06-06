import {getId} from "@math-blocks/core";

import {backspace} from "./backspace";
import {insertChar} from "./insert-char";
import {moveLeft} from "./move-left";
import {moveRight} from "./move-right";
import {parens} from "./parens";
import {root} from "./root";
import {slash} from "./slash";
import {subsup} from "./subsup";
import {color} from "./color";
import {cancel} from "./cancel";

import {zrow} from "./util";
import type {Zipper, State} from "./types";

const initialZipper: Zipper = {
    row: zrow(getId(), [], []),
    breadcrumbs: [],
};

const initialState: State = {
    startZipper: initialZipper,
    endZipper: initialZipper,
    zipper: initialZipper,
    selecting: false,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Action = {type: string; detail?: any};

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
            return subsup(state, 0);
        }
        case "^": {
            return subsup(state, 1);
        }
        case "(":
        case ")":
        case "[":
        case "]":
        case "{":
        case "}": {
            return parens(state, action.type);
        }
        case "/": {
            return slash(state);
        }
        // TODO: use "Sqrt" and "NthRoot" to differentiate the two possibilities
        case "\u221A": {
            return root(state, false);
        }
        case "Color": {
            return color(state, action.detail);
        }
        case "Cancel": {
            return cancel(state, action.detail);
        }
        // We don't handle any other actions yet so ignore them and return the
        // current startZipper.
        default: {
            // We ignore all control characters as well the space character.
            if (action.type.length === 1 && action.type.charCodeAt(0) > 32) {
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
