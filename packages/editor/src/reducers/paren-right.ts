import * as Editor from "../editor-ast";
import {State} from "../row-reducer";
import {
    HasChildren,
    Paren,
    insertBeforeChildWithIndex,
    isGlyph,
    removeChildWithIndex,
    selectionParens,
} from "../util";

export const parenRight = (currentNode: HasChildren, draft: State): void => {
    const {cursor, selectionStart} = draft;

    if (selectionStart) {
        selectionParens(currentNode, selectionStart, draft, Paren.Right);
        return;
    }

    const {next} = cursor;

    const openingParen = Editor.glyph("(", true);
    const closingParen = Editor.glyph(")");

    draft.cursor.next = cursor.next !== Infinity ? cursor.next + 1 : Infinity;
    draft.cursor.prev = cursor.prev !== -Infinity ? cursor.prev + 1 : 0;

    for (
        let i = Math.max(0, draft.cursor.prev - 1);
        i < currentNode.children.length;
        i++
    ) {
        const child = currentNode.children[i];
        // handle a pending closing paren to the right
        if (isGlyph(child, ")")) {
            // if we run into a non-pending left paren then we need
            // to break and insert a new paren pair
            if (!child.value.pending) {
                break;
            }
            const newChildren = removeChildWithIndex(currentNode.children, i);
            currentNode.children = insertBeforeChildWithIndex(
                newChildren,
                Math.min(newChildren.length, draft.cursor.prev),
                closingParen,
            );
            if (draft.cursor.prev >= currentNode.children.length - 1) {
                draft.cursor.prev = currentNode.children.length - 1;
                draft.cursor.next = Infinity;
            }
            return;
        }
    }

    // The counter keeps track of how many un-matched parens there are
    // If the value is negative then there are that many more ')' than
    // '('.  If it's positive there are more '('.  If the count is 0
    // then the count is equal.
    let count = 0;

    for (let i = Math.max(0, draft.cursor.prev - 1); i >= 0; i--) {
        const child = currentNode.children[i];
        // handle a opening paren to the left
        if (isGlyph(child, "(") && count >= 0) {
            const newChildren = insertBeforeChildWithIndex(
                currentNode.children,
                draft.cursor.prev,
                closingParen,
            );
            currentNode.children = insertBeforeChildWithIndex(
                newChildren,
                i + 1,
                openingParen,
            );

            // move the cursor one to right again
            draft.cursor.next =
                cursor.next !== Infinity ? cursor.next + 1 : Infinity;
            draft.cursor.prev = cursor.prev !== -Infinity ? cursor.prev + 1 : 0;
            return;
        }

        if (isGlyph(child, ")")) {
            count--;
        } else if (isGlyph(child, "(")) {
            count++;
        }
    }

    // no closing paren to the right
    currentNode.children = [
        openingParen,
        ...insertBeforeChildWithIndex(currentNode.children, next, closingParen),
    ];

    // Advance the cursor by one again.
    draft.cursor.next = cursor.next !== Infinity ? cursor.next + 1 : Infinity;
    draft.cursor.prev = cursor.prev !== -Infinity ? cursor.prev + 1 : 0;
};
