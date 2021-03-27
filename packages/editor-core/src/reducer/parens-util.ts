import * as types from "../types";

export const isPending = (
    node: types.Node | undefined,
    char: string,
): boolean => {
    return Boolean(
        node?.type === "atom" && node.value.char === char && node.value.pending,
    );
};

const isGlyph: (char: string) => (node: types.Node) => boolean = (char) => (
    node,
) => node.type === "atom" && node.value.char == char;

// TODO: handle other delimiters, e.g. []
export const indexOfLastUnmatchedOpener = (
    array: readonly types.Node[],
): number => {
    let count = 0;
    for (let i = array.length - 1; i >= 0; i--) {
        if (isGlyph("(")(array[i])) {
            if (count === 0) {
                return i;
            }
            count--;
        }
        if (isGlyph(")")(array[i])) {
            count++;
        }
    }
    return -1;
};

// TODO: handle other delimiters, e.g. []
export const indexOfFirstUnmatchedCloser = (
    array: readonly types.Node[],
): number => {
    let count = 0;
    for (let i = 0; i < array.length; i++) {
        if (isGlyph(")")(array[i])) {
            if (count === 0) {
                return i;
            }
            count--;
        }
        if (isGlyph("(")(array[i])) {
            count++;
        }
    }
    return -1;
};
