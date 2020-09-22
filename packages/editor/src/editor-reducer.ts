import * as Editor from "./editor-ast";

import rowReducer, {State as RowState} from "./above-reducer";

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

    if (action.type === "ArrowUp") {
        return {
            ...state,
            rowIndex: Math.max(0, state.rowIndex - 1),
        };
    } else if (action.type === "ArrowDown") {
        return {
            ...state,
            rowIndex: Math.min(state.rows.length - 1, state.rowIndex + 1),
        };
    }

    // TODO: use immer for this
    return {
        ...state,
        rows: [
            ...state.rows.slice(0, state.rowIndex),
            rowReducer(state.rows[state.rowIndex], action),
            ...state.rows.slice(state.rowIndex + 1),
        ],
    };
};

export default reducer;
