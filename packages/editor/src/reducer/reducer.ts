import {getId, UnreachableCaseError} from "@math-blocks/core";

import {backspace} from "./backspace";
import {insertChar} from "./insert-char";
import {moveLeft} from "./move-left";
import {moveRight} from "./move-right";
import {parens} from "./parens";
import {root} from "./root";
import {frac} from "./frac";
import {subsup} from "./subsup";
import {color} from "./color";
import {cancel} from "./cancel";
import {positionCursor} from "./position-cursor";
import {matrix} from "./matrix";
import {moveVertically} from "./move-vertically";

import {zrow} from "./util";
import type {Zipper, State} from "./types";
import type {Action} from "./action-types";

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

export const reducer = (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case "ArrowLeft":
            return moveLeft(state);
        case "ArrowRight":
            return moveRight(state);
        case "ArrowUp":
            return moveVertically(state, action);
        case "ArrowDown":
            return moveVertically(state, action);
        case "Backspace":
            return backspace(state);
        case "Subscript":
            return subsup(state, 0);
        case "Superscript":
            return subsup(state, 1);
        case "Parens":
            return parens(state, action.char);
        case "Fraction":
            return frac(state);
        // TODO: use "Sqrt" and "NthRoot" to differentiate the two possibilities
        case "Root":
            return root(state, false);
        case "Color":
            return color(state, action.color);
        // Split this into cancel and uncancel
        case "Cancel":
            return cancel(state, getId());
        case "Uncancel":
            return cancel(state, undefined);
        // We don't handle any other actions yet so ignore them and return the
        // current startZipper.
        case "InsertChar":
            return insertChar(state, action.char);
        case "StartSelecting":
            return state.selecting
                ? state
                : {
                      ...state,
                      selecting: true,
                  };
        case "StopSelecting":
            return state.selecting
                ? {
                      ...state,
                      selecting: false,
                  }
                : state;
        case "PositionCursor":
            return positionCursor(state, action.cursor);
        case "InsertMatrix":
        case "AddRow":
        case "AddColumn":
        case "DeleteRow":
        case "DeleteColumn":
            return matrix(state, action);
        case "Update":
            return {
                startZipper: action.value,
                endZipper: action.value,
                zipper: action.value,
                selecting: false,
            };
        default:
            throw new UnreachableCaseError(action);
    }
};
