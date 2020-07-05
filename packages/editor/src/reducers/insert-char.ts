import * as Editor from "@math-blocks/editor";

import {State} from "../state";
import {
    HasChildren,
    insertBeforeChildWithIndex,
    isGlyph,
    selectionSplit,
} from "../util";

export const insertChar = (
    currentNode: HasChildren,
    draft: State,
    char: string,
): void => {
    let newNode;
    if (char === "\u03a3" || char === "\u03a0") {
        newNode = Editor.limits(Editor.glyph(char), [], []);
    } else {
        newNode = Editor.glyph(char);
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

        draft.cursor.next =
            cursor.next !== Infinity ? cursor.next + 1 : Infinity;
        draft.cursor.prev = cursor.prev !== -Infinity ? cursor.prev + 1 : 0;

        currentNode.children = insertBeforeChildWithIndex(
            currentNode.children,
            next,
            newNode,
        );
    }
};
