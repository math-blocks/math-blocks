import * as Editor from "./editor-ast";

import rowReducer, {State as RowState} from "./row-reducer";
import * as Util from "./util";

const {row, glyph, frac} = Editor;

export type State = {
    rows: RowState[];
    rowIndex: number;
};

const initialState: State = {
    rows: [
        {
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
        },
    ],
    rowIndex: 0,
};

type Action = {type: string; shift?: boolean};

const reducer = (state: State = initialState, action: Action): State => {
    if (state.rowIndex < 0 || state.rowIndex > state.rows.length - 1) {
        // TODO: throw
        return state;
    }

    switch (action.type) {
        case "ArrowUp": {
            return {
                ...state,
                rowIndex: Math.max(0, state.rowIndex - 1),
            };
        }
        case "ArrowDown": {
            return {
                ...state,
                rowIndex: Math.min(state.rows.length - 1, state.rowIndex + 1),
            };
        }
        case "AddRow": {
            return {
                ...state,
                rows: [
                    ...state.rows,
                    // TODO: create an empty row with the correct number of columns
                    {
                        math: Util.row(
                            "\u0008\u0008\u0008\u0008\u0008\u0008\u0008\u0008",
                        ),
                        cursor: {
                            path: [],
                            prev: -Infinity,
                            next: 0,
                        },
                        selectionStart: undefined,
                        cancelRegions: undefined,
                    },
                ],
                rowIndex: state.rows.length,
            };
        }
        case "AddRowWithRule": {
            return {
                ...state,
                rows: [
                    ...state.rows,
                    // TODO: create an empty row with the correct number of columns
                    {
                        math: Util.row(
                            "\u0008\u0008\u0008\u0008\u0008\u0008\u0008\u0008",
                        ),
                        hrule: true,
                        cursor: {
                            path: [],
                            prev: -Infinity,
                            next: 0,
                        },
                        selectionStart: undefined,
                        cancelRegions: undefined,
                    },
                ],
                rowIndex: state.rows.length,
            };
        }
        case "RemoveRow": {
            // TODO: disable the "Remove row" button if there's one row left
            if (state.rows.length === 1) {
                return state;
            }
            return {
                ...state,
                rows: state.rows.slice(0, -1),
                rowIndex: Math.min(state.rowIndex, state.rows.length - 2),
            };
        }
        default: {
            // TODO: use immer for this
            return {
                ...state,
                rows: [
                    ...state.rows.slice(0, state.rowIndex),
                    rowReducer(state.rows[state.rowIndex], action),
                    ...state.rows.slice(state.rowIndex + 1),
                ],
            };
        }
    }
};

export default reducer;
