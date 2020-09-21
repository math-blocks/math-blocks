import * as Editor from "@math-blocks/editor";

import {State} from "../above-reducer";
import {
    HasChildren,
    insertBeforeChildWithIndex,
    isGlyph,
    nextIndex,
    prevIndex,
    removeChildWithIndex,
    selectionSplit,
    hasChildren,
    nodeAtPath,
} from "../util";
import {moveLeft} from "./move-left";

export const backspace = (currentNode: HasChildren, draft: State): void => {
    const {cursor, math, selectionStart} = draft;

    if (selectionStart) {
        const {head, tail} = selectionSplit(
            currentNode,
            cursor,
            selectionStart,
        );

        currentNode.children = [...head, ...tail];
        draft.cursor = {
            path: cursor.path,
            prev: head.length === 0 ? -Infinity : head.length - 1,
            next: tail.length === 0 ? Infinity : head.length,
        };
        draft.selectionStart = undefined;
        return;
    }

    if (cursor.prev !== -Infinity) {
        const {children} = currentNode;
        const removeIndex = cursor.prev;
        const prevNode = children[removeIndex];
        if (
            prevNode.type === "subsup" ||
            prevNode.type === "frac" ||
            prevNode.type === "root"
        ) {
            draft.cursor = moveLeft(currentNode, draft);
            return;
        }
        if (isGlyph(prevNode, ")")) {
            // TODO: remove the ")" and insert a new pending ')' at the
            // end of the row or before the first mismatched ')'

            blk0: if (draft.cursor.prev) {
                const newChildren = removeChildWithIndex(children, removeIndex);
                for (
                    let i = Math.max(0, draft.cursor.prev);
                    i < newChildren.length;
                    i++
                ) {
                    // handle a closing paren to the right
                    if (isGlyph(newChildren[i], ")")) {
                        currentNode.children = insertBeforeChildWithIndex(
                            newChildren,
                            i,
                            Editor.glyph(")", true),
                        );
                        // Skip inserting a ')' at the end of the current row
                        // since we've already inserted a ')' earlier.
                        break blk0;
                    }
                }
                currentNode.children = [
                    ...newChildren,
                    Editor.glyph(")", true),
                ];
            }
            draft.cursor = moveLeft(currentNode, draft);
            return;
        }
        if (isGlyph(prevNode, "(")) {
            // The counter keeps track of how many un-matched parens there are
            // If the value is negative then there are that many more '(' than
            // ')'.  If it's positive there are more ')'.  If the count is 0
            // then the count is equal.
            let count = 0;
            currentNode.children = removeChildWithIndex(children, removeIndex);
            for (let i = removeIndex; i < currentNode.children.length; i++) {
                const child = currentNode.children[i];
                if (isGlyph(child, ")") && count >= 0) {
                    currentNode.children = removeChildWithIndex(
                        currentNode.children,
                        i,
                    );
                    // We only need to delete the first matching paren
                    break;
                }
                if (isGlyph(child, "(")) {
                    count--;
                } else if (isGlyph(child, ")")) {
                    count++;
                }
            }
            draft.cursor = moveLeft(currentNode, draft);
            return;
        }
        const newChildren = isGlyph(prevNode, "\u0008")
            ? children
            : removeChildWithIndex(children, removeIndex);
        const newPrev = prevIndex(newChildren, cursor.prev);
        const newNext = nextIndex(newChildren, newPrev);
        const newCursor = {
            ...cursor,
            prev: newPrev,
            next: newNext,
        };
        currentNode.children = newChildren;
        draft.cursor = newCursor;
        return;
    }

    if (cursor.path.length > 1) {
        const parent = nodeAtPath(
            math,
            cursor.path.slice(0, cursor.path.length - 1),
        );
        const grandparent = nodeAtPath(
            math,
            cursor.path.slice(0, cursor.path.length - 2),
        );

        if (!hasChildren(grandparent)) {
            return;
        }

        let parentIndex = cursor.path[cursor.path.length - 2];

        if (parent.type === "subsup") {
            const index = grandparent.children.findIndex(
                (child) => child.id === parent.id,
            );

            let newChildren = grandparent.children;
            if (index !== -1) {
                if (parent.children[0] && parent.children[1]) {
                    if (cursor.path[cursor.path.length - 1] === 0) {
                        newChildren = [
                            ...grandparent.children.slice(0, index), // place contents of sub before subsup
                            ...currentNode.children,
                            ...grandparent.children.slice(index),
                        ];
                        parent.children[0] = null;
                    } else {
                        newChildren = [
                            ...grandparent.children.slice(0, index + 1), // place contents of sup after the subsup
                            ...currentNode.children,
                            ...grandparent.children.slice(index + 1),
                        ];
                        parent.children[1] = null;
                        // position the cursor after the subsup
                        parentIndex++;
                    }
                } else {
                    // replace currentNode with currentNode's children
                    newChildren = [
                        ...grandparent.children.slice(0, index),
                        ...currentNode.children,
                        ...grandparent.children.slice(index + 1),
                    ];
                }
            }

            // update cursor
            const newPrev = prevIndex(newChildren, parentIndex);
            const newNext = nextIndex(newChildren, newPrev);
            const newCursor = {
                path: cursor.path.slice(0, -2), // move up two levels
                prev: newPrev,
                next: newNext,
            };

            // update children
            grandparent.children = newChildren;

            draft.cursor = newCursor;
            return;
        } else if (parent.type === "frac") {
            const index = grandparent.children.findIndex(
                (child) => child.id === parent.id,
            );

            let newChildren = grandparent.children;
            if (index !== -1) {
                if (parent.children[0] && parent.children[1]) {
                    newChildren = [
                        ...grandparent.children.slice(0, index),
                        ...parent.children[0].children,
                        ...parent.children[1].children,
                        ...grandparent.children.slice(index + 1),
                    ];
                    if (cursor.path[cursor.path.length - 1] === 1) {
                        parentIndex += parent.children[0].children.length;
                    }
                } else {
                    throw new Error("invalid fraction");
                }
            }

            // update cursor
            const newPrev = prevIndex(newChildren, parentIndex);
            const newNext = nextIndex(newChildren, newPrev);
            const newCursor = {
                path: cursor.path.slice(0, -2), // move up two levels
                prev: newPrev,
                next: newNext,
            };

            // update children
            grandparent.children = newChildren;

            draft.cursor = newCursor;
            return;
        } else if (parent.type === "root") {
            const index = grandparent.children.findIndex(
                (child) => child.id === parent.id,
            );

            let newChildren = grandparent.children;
            if (index !== -1) {
                if (parent.children[0] && !parent.children[1]) {
                    newChildren = [
                        ...grandparent.children.slice(0, index),
                        ...parent.children[0].children,
                        ...grandparent.children.slice(index + 1),
                    ];
                } else {
                    // TODO: handle indexes
                    throw new Error("we can't handle roots with indexes yet");
                }
            }

            // update cursor
            const newPrev = prevIndex(newChildren, parentIndex);
            const newNext = nextIndex(newChildren, newPrev);
            const newCursor = {
                path: cursor.path.slice(0, -2), // move up two levels
                prev: newPrev,
                next: newNext,
            };

            // update children
            grandparent.children = newChildren;

            draft.cursor = newCursor;
            return;
        }
    }
};
