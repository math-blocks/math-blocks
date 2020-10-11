import {produce} from "immer";

import * as Editor from "./editor-ast";
import {hasChildren, nodeAtPath} from "./util";
import * as Reducers from "./reducers";

import {LayoutCursor} from "./util";

export type State = {
    math: Editor.Row<Editor.Glyph, {id: number}>;
    hrule?: boolean;
    cursor: Editor.Cursor;
    selectionStart?: Editor.Cursor;
    cancelRegions?: LayoutCursor[];
};

const {row, glyph, frac} = Editor;

const initialState: State = {
    math: row([
        glyph("1"),
        glyph("+"),
        frac([glyph("1")], [glyph("2"), glyph("y")]),
        glyph("\u2212"),
        glyph("x"),
    ]),
    cursor: {
        path: [],
        prev: -Infinity,
        next: 0,
    },
    selectionStart: undefined,
    cancelRegions: undefined,
};

type Action = {type: string; shift?: boolean};

// TODO: check if cursor is valid before process action
// Even better, replace the cursor with a zip-tree
const aboveReducer = (state: State = initialState, action: Action): State => {
    const newState = produce(state, (draft) => {
        const {cursor, math} = draft;
        const currentNode = nodeAtPath(math, cursor.path);

        if (!hasChildren(currentNode)) {
            throw new Error(
                "currentNode can't be a glyph, fraction, sup, or sub",
            );
        }

        switch (action.type) {
            case "Cancel": {
                // updates the cursor position as well
                Reducers.cancel(draft);
                return;
            }
            case "ArrowLeft": {
                if (!action.shift && draft.selectionStart) {
                    const {selectionStart} = draft;
                    const next =
                        selectionStart.path.length > cursor.path.length
                            ? selectionStart.path[cursor.path.length]
                            : selectionStart.next;
                    const prev =
                        selectionStart.path.length > cursor.path.length
                            ? selectionStart.path[cursor.path.length] - 1
                            : selectionStart.prev;
                    if (
                        prev === -Infinity ||
                        (cursor.prev && prev < cursor.prev)
                    ) {
                        draft.cursor = {
                            ...draft.cursor,
                            prev,
                            next,
                        };
                    }
                    draft.selectionStart = undefined;
                } else {
                    if (action.shift && !draft.selectionStart) {
                        draft.selectionStart = {...draft.cursor};
                    }
                    draft.cursor = Reducers.moveLeft(
                        currentNode,
                        draft,
                        action.shift,
                    );
                }
                return;
            }
            case "ArrowRight": {
                if (!action.shift && draft.selectionStart) {
                    const {selectionStart} = draft;
                    const next =
                        selectionStart.path.length > cursor.path.length
                            ? selectionStart.path[cursor.path.length] + 1
                            : selectionStart.next;
                    const prev =
                        selectionStart.path.length > cursor.path.length
                            ? selectionStart.path[cursor.path.length]
                            : selectionStart.prev;
                    if (
                        next === Infinity ||
                        (cursor.next !== Infinity && next > cursor.next)
                    ) {
                        draft.cursor = {
                            ...draft.cursor,
                            prev,
                            next,
                        };
                    }
                    draft.selectionStart = undefined;
                } else {
                    if (action.shift && !draft.selectionStart) {
                        draft.selectionStart = {...draft.cursor};
                    }
                    draft.cursor = Reducers.moveRight(
                        currentNode,
                        draft,
                        action.shift,
                    );
                }
                return;
            }
            case "Backspace": {
                Reducers.backspace(currentNode, draft);
                return;
            }
            case "/": {
                Reducers.slash(currentNode, draft);
                return;
            }
            case "^": {
                Reducers.caret(currentNode, draft);
                return;
            }
            case "_": {
                Reducers.underscore(currentNode, draft);
                return;
            }
            case "\u221A": {
                Reducers.root(currentNode, draft);
                return;
            }
            case "(": {
                Reducers.parenLeft(currentNode, draft);
                return;
            }
            case ")": {
                Reducers.parenRight(currentNode, draft);
                return;
            }
            default: {
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

export default aboveReducer;
