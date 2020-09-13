import * as Editor from "./editor-ast";

import aboveReducer, {State as AboveState} from "./above-reducer";

const {row, glyph, frac} = Editor;

type BelowState = {
    math: Editor.Row<Editor.Glyph, {id: number}>;
    cursor: Editor.Cursor;
};

export type State = {
    above: AboveState;
    below?: BelowState;
    mode: "above" | "below";
};

const initialState: State = {
    above: {
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
    mode: "above",
};

type Action = {type: string; shift?: boolean};

// TODO: export reducers separately so they can be tested independently of one another
const belowReducer = (state: BelowState, action: Action): BelowState => {
    switch (action.type) {
        case "ArrowLeft": {
            console.log("below: ArrowLeft");
            return state;
        }
        case "ArrowRight": {
            console.log("below: ArrowRight");
            return state;
        }
        default:
            return state;
    }
};

const reducer = (state: State = initialState, action: Action): State => {
    // TODO: if state.above or state.below are not defined used grab the initial
    // state from their respective reducer.

    // handle mode swwitching
    switch (action.type) {
        case "above": {
            return {
                ...state,
                mode: "above",
            };
        }
        case "below": {
            return {
                ...state,
                mode: "below",
            };
        }
    }

    switch (state.mode) {
        case "above": {
            return {
                ...state,
                above: aboveReducer(state.above, action),
            };
        }
        case "below": {
            if (state.below) {
                return {
                    ...state,
                    below: belowReducer(state.below, action),
                };
            }
        }
    }
    return state;
};

export default reducer;
