import type {State} from "../types";

export const parens = (
    state: State,
    char: "(" | ")" | "[" | "]" | "{" | "}" | "|",
): State => {
    return state;
};
