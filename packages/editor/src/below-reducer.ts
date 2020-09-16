import {produce} from "immer";

import {hasChildren, nodeAtPath} from "./util";

import * as Editor from "./editor-ast";
import * as Reducers from "./reducers";

export type State = {
    math: Editor.Row<Editor.Glyph, {id: number}>;
    cursor: Editor.Cursor;
};

type Action = {type: string; shift?: boolean};

// TODO: export reducers separately so they can be tested independently of one another
const belowReducer = (state: State, action: Action): State => {
    const newState = produce(state, (draft) => {
        const {cursor, math} = draft;
        const currentNode = nodeAtPath(math, cursor.path);

        if (!hasChildren(currentNode)) {
            throw new Error(
                "currentNode can't be a glyph, fraction, sup, or sub",
            );
        }

        switch (action.type) {
            case "ArrowLeft": {
                draft.cursor = Reducers.moveLeft(
                    currentNode,
                    draft,
                    action.shift,
                );
                return;
            }
            case "ArrowRight": {
                draft.cursor = Reducers.moveRight(
                    currentNode,
                    draft,
                    action.shift,
                );
                return;
            }
            case "Backspace": {
                Reducers.backspace(currentNode, draft);
                return;
            }
            default: {
                // TODO: check if we're between two "\u0008" and that inserting
                // a character would result in one (or both) of those "\u0008"s
                // no longer being adjacent to another "\u0008"
                if (
                    action.type.length === 1 &&
                    action.type.charCodeAt(0) >= 32
                ) {
                    let char = action.type;
                    if (char === "*") {
                        char = "\u00B7";
                    } else if (char === "-") {
                        char = "\u2212";
                    }
                    Reducers.insertChar(currentNode, draft, char);
                    break;
                }
                return;
            }
        }
    });

    return newState;
};

export default belowReducer;
