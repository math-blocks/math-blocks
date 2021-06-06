import {getId} from "@math-blocks/core";

import {backspace} from "./backspace";
import {insertChar} from "./insert-char";
import {moveLeft} from "./move-left";
import {moveRight} from "./move-right";
import {parens} from "./parens";
import {root} from "./root";
import {slash} from "./slash";
import {subsup} from "./subsup";
import {zrow} from "./util";
import type {Zipper, State} from "./types";

const initialState: Zipper = {
    row: zrow(getId(), [], []),
    breadcrumbs: [],
};

type Action = {type: string};

export const zipperReducer = (
    startZipper: Zipper = initialState,
    action: Action,
    endZipper: Zipper | null = null,
): Zipper => {
    switch (action.type) {
        case "ArrowLeft": {
            const state: State = {
                startZipper,
                endZipper,
                selecting: false,
            };
            const newState = moveLeft(state);
            return newState.endZipper || newState.startZipper;
        }
        case "ArrowRight": {
            const state: State = {
                startZipper,
                endZipper,
                selecting: false,
            };
            const newState = moveRight(state);
            return newState.endZipper || newState.startZipper;
        }
        case "Backspace": {
            const state: State = {
                startZipper,
                endZipper,
                selecting: false,
            };
            const newState = backspace(state);
            return newState.endZipper || newState.startZipper;
        }
        case "_": {
            const state: State = {
                startZipper,
                endZipper,
                selecting: false,
            };
            const newState = subsup(state, 0);
            return newState.endZipper || newState.startZipper;
        }
        case "^": {
            const state: State = {
                startZipper,
                endZipper,
                selecting: false,
            };
            const newState = subsup(state, 1);
            return newState.endZipper || newState.startZipper;
        }
        case "(":
        case ")":
        case "[":
        case "]":
        case "{":
        case "}": {
            const state: State = {
                startZipper,
                endZipper,
                selecting: false,
            };
            const newState = parens(state, action.type);
            return newState.endZipper || newState.startZipper;
        }
        case "/": {
            const state: State = {
                startZipper,
                endZipper,
                selecting: false,
            };
            const newState = slash(state);
            return newState.endZipper || newState.startZipper;
        }
        // TODO: use "Sqrt" and "NthRoot" to differentiate the two possibilities
        case "\u221A": {
            const state: State = {
                startZipper,
                endZipper,
                selecting: false,
            };
            const newState = root(state, false);
            return newState.endZipper || newState.startZipper;
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
                const state: State = {
                    startZipper,
                    endZipper,
                    selecting: false,
                };
                const newState = insertChar(state, char);
                return newState.endZipper || newState.startZipper;
            }
            return startZipper;
        }
    }
};
