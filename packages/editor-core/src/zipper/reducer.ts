import {moveLeft} from "./move-left";
import {moveRight} from "./move-right";
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
        // We don't handle any other actions yet so ignore them and return the
        // current state.
        default: {
            return state;
        }
    }
};
