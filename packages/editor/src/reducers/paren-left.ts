import * as Editor from "@math-blocks/editor";

import {State} from "../row-reducer";
import {
    HasChildren,
    Paren,
    insertBeforeChildWithIndex,
    isGlyph,
    removeChildWithIndex,
    selectionParens,
} from "../util";

export const parenLeft = (currentNode: HasChildren, draft: State): void => {
    const {cursor, selectionStart} = draft;

    if (selectionStart) {
        selectionParens(currentNode, selectionStart, draft, Paren.Left);
        return;
    }

    const {next} = cursor;

    const openingParen = Editor.glyph("(");
    const closingParen = Editor.glyph(")", true);

    draft.cursor.next = cursor.next !== Infinity ? cursor.next + 1 : Infinity;
    draft.cursor.prev = cursor.prev !== -Infinity ? cursor.prev + 1 : 0;

    for (let i = Math.max(0, draft.cursor.prev - 1); i >= 0; i--) {
        const child = currentNode.children[i];
        // handle a pending open paren to the left
        if (isGlyph(child, "(")) {
            // if we run into a non-pending left paren then we need
            // to break and insert a new paren pair
            if (!child.value.pending) {
                break;
            }
            const newChildren = removeChildWithIndex(currentNode.children, i);
            currentNode.children = insertBeforeChildWithIndex(
                newChildren,
                Math.max(0, draft.cursor.prev - 1),
                openingParen,
            );

            const prev = Math.max(0, draft.cursor.prev - 1);
            draft.cursor.prev = prev;
            draft.cursor.next = prev + 1;
            return;
        }
    }

    // The counter keeps track of how many un-matched parens there are
    // If the value is negative then there are that many more '(' than
    // ')'.  If it's positive there are more ')'.  If the count is 0
    // then the count is equal.
    let count = 0;

    for (
        let i = Math.max(0, draft.cursor.prev);
        i < currentNode.children.length;
        i++
    ) {
        const child = currentNode.children[i];
        // handle a closing paren to the right
        if (isGlyph(child, ")") && count >= 0) {
            const newChildren = insertBeforeChildWithIndex(
                currentNode.children,
                draft.cursor.prev,
                openingParen,
            );
            currentNode.children = insertBeforeChildWithIndex(
                newChildren,
                i + 1,
                closingParen,
            );
            return;
        }
        if (isGlyph(child, "(")) {
            count--;
        } else if (isGlyph(child, ")")) {
            count++;
        }
    }

    if (draft.cursor.next === Infinity) {
        draft.cursor.next = draft.cursor.prev + 1;
    }

    // no closing paren to the right
    currentNode.children = [
        ...insertBeforeChildWithIndex(currentNode.children, next, openingParen),
        closingParen,
    ];
};
