import * as builders from "../../builders";
import * as types from "../../types";

import {State} from "../row-reducer";
import {
    HasChildren,
    insertBeforeChildWithIndex,
    isGlyph,
    selectionSplit,
} from "../util";

const advanceCursor = (cursor: types.Cursor): void => {
    cursor.next = cursor.next !== Infinity ? cursor.next + 1 : Infinity;
    cursor.prev = cursor.prev !== -Infinity ? cursor.prev + 1 : 0;
};

export const insertChar = (
    currentNode: HasChildren,
    draft: State,
    char: string,
): void => {
    let newNode;
    if (char === "\u03a3" || char === "\u03a0") {
        newNode = builders.limits(builders.glyph(char), [], []);
    } else {
        newNode = builders.glyph(char);
    }
    const {cursor, selectionStart} = draft;

    if (selectionStart) {
        const {head, tail} = selectionSplit(
            currentNode,
            cursor,
            selectionStart,
        );

        currentNode.children = [...head, newNode, ...tail];
        const index = head.length;
        draft.cursor = {
            path: [...cursor.path],
            prev: index,
            next:
                index < currentNode.children.length - 1 ? index + 1 : Infinity,
        };
        draft.selectionStart = undefined;
    } else {
        const {prev, next} = cursor;

        // If there's a pending ')' before the insertion point, complete it
        if (prev !== -Infinity) {
            const prevNode = currentNode.children[prev];
            if (isGlyph(prevNode, ")")) {
                prevNode.value.pending = undefined;
            }
        }
        // If there's a pending '(' after the insertion point, complete it
        if (next !== Infinity) {
            const nextNode = currentNode.children[next];
            if (isGlyph(nextNode, "(")) {
                nextNode.value.pending = undefined;
            }
        }

        const nextNode = currentNode.children[next];

        currentNode.children = insertBeforeChildWithIndex(
            currentNode.children,
            next,
            newNode,
        );

        advanceCursor(draft.cursor);

        const operators = ["+", "\u2212", "="];

        // If there's a column separtor next and we're not in the first row
        // and we're inserting an operator then advance the cursor to the next
        // column.  This helps implement the rule that says that bin ops should
        // be the only character in their column.
        if (
            operators.includes(char) &&
            prev !== -Infinity &&
            nextNode &&
            isGlyph(nextNode, "\u0008")
        ) {
            advanceCursor(draft.cursor);
        }
    }
};
