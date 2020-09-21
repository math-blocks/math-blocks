import * as Editor from "@math-blocks/editor";

import {State} from "../above-reducer";
import {
    prevIndex,
    hasChildren,
    nodeAtPath,
    pathForNode,
    isPrefixArray,
    hasGrandchildren,
    isGlyph,
} from "../util";
import {SUB, SUP, NUMERATOR, RADICAND, DENOMINATOR} from "../constants";

type ID = {
    id: number;
};

const enterFromRight = (
    cursor: Editor.Cursor,
    row: Editor.Row<Editor.Glyph, ID>,
    index: number,
): Editor.Cursor => {
    return {
        path: [...cursor.path, cursor.prev, index],
        prev: row.children.length > 0 ? row.children.length - 1 : -Infinity,
        next: Infinity,
    };
};

const exitToLeft = (
    cursor: Editor.Cursor,
    grandparentRow: Editor.Row<Editor.Glyph, ID>,
): Editor.Cursor => {
    const index = cursor.path[cursor.path.length - 2];

    return {
        path: cursor.path.slice(0, -2),
        prev: prevIndex(grandparentRow.children, index),
        next: index,
    };
};

// move to the previous parent's sibling
const moveToPrevPibling = (
    cursor: Editor.Cursor,
    row: Editor.Row<Editor.Glyph, ID>,
    index: number,
): Editor.Cursor => {
    return {
        path: [...cursor.path.slice(0, -1), index],
        prev: row.children.length > 0 ? row.children.length - 1 : -Infinity,
        next: Infinity,
    };
};

export const moveLeft = (
    currentNode: Editor.Row<Editor.Glyph, ID>,
    draft: State,
    selecting?: boolean,
): Editor.Cursor => {
    const {cursor, selectionStart, math} = draft;
    const {children} = currentNode;

    if (cursor.prev !== -Infinity) {
        // It's safe to use cursor.prev directly as a key here
        // since we've already checked to make sure it isn't Infinity.
        let prevNode = currentNode.children[cursor.prev];
        const nextNode = currentNode.children[cursor.next];

        // Skip over column separator if the column to the left is non-empty
        // and we're not in an empty column ourselves.
        if (
            isGlyph(prevNode, "\u0008") &&
            cursor.prev !== 0 &&
            nextNode &&
            !isGlyph(nextNode, "\u0008")
        ) {
            const prevPrevNode = currentNode.children[cursor.prev - 1];
            if (!isGlyph(prevPrevNode, "\u0008")) {
                prevNode = prevPrevNode;
                // move to the left by one
                const newPrev = prevIndex(children, cursor.prev);
                cursor.next = cursor.prev;
                cursor.prev = newPrev;
            }
        }

        if (prevNode && hasGrandchildren(prevNode)) {
            // check if draft.selectionStart is within prevNode
            const path = pathForNode(math, prevNode);
            if (
                path &&
                selectionStart &&
                isPrefixArray(path, selectionStart.path)
            ) {
                const index = selectionStart.path[path.length];
                const node = prevNode.children[index];
                if (node) {
                    return enterFromRight(cursor, node, index);
                }
            }
        }

        if (prevNode && prevNode.type === "root" && !selecting) {
            const radicand = prevNode.children[0];
            return enterFromRight(cursor, radicand, RADICAND);
        } else if (prevNode && prevNode.type === "frac" && !selecting) {
            // enter fraction (denominator)
            const denominator = prevNode.children[1];
            return enterFromRight(cursor, denominator, DENOMINATOR);
        } else if (prevNode && prevNode.type === "subsup" && !selecting) {
            // enter sup/sub
            const [sub, sup] = prevNode.children;
            if (sup) {
                return enterFromRight(cursor, sup, SUP);
            } else if (sub) {
                return enterFromRight(cursor, sub, SUB);
            } else {
                throw new Error("subsup node must have at least a sub or sup");
            }
        } else if (prevNode && prevNode.type === "limits" && !selecting) {
            // enter lower/upper limits
            const [lower, upper] = prevNode.children;
            if (upper) {
                return enterFromRight(cursor, upper, SUP);
            } else if (lower) {
                return enterFromRight(cursor, lower, SUB);
            } else {
                throw new Error("subsup node must have at least a sub or sup");
            }
        }

        // If all else fails, move to the left
        const newPrev = prevIndex(children, cursor.prev);

        return {
            path: cursor.path,
            prev: newPrev,
            next: cursor.prev,
        };
    } else if (cursor.path.length >= 2) {
        const parent = nodeAtPath(
            math,
            cursor.path.slice(0, cursor.path.length - 1),
        );
        const grandparent = nodeAtPath(
            math,
            cursor.path.slice(0, cursor.path.length - 2),
        );

        // This check should never fail since the cursor's path has at
        // least two entries in it, but TypeScript doesn't understand
        // this so we need to manually check to refine `grandparent`
        // to a row.
        if (!hasChildren(grandparent)) {
            return cursor;
        }

        if (parent.type === "root") {
            return exitToLeft(cursor, grandparent);
            // TODO: handle moving into the index if one exists
        } else if (parent.type === "subsup") {
            const [sub, sup] = parent.children;

            if (selecting) {
                return exitToLeft(cursor, grandparent);
            } else if (currentNode === sup) {
                if (sub) {
                    return moveToPrevPibling(cursor, sub, SUB);
                } else {
                    return exitToLeft(cursor, grandparent);
                }
            } else if (currentNode === sub) {
                return exitToLeft(cursor, grandparent);
            }
        } else if (parent.type === "limits") {
            const [lower, upper] = parent.children;

            if (selecting) {
                return exitToLeft(cursor, grandparent);
            } else if (currentNode === upper) {
                return moveToPrevPibling(cursor, lower, SUB);
            } else if (currentNode === lower) {
                return exitToLeft(cursor, grandparent);
            }
        } else if (parent.type === "frac") {
            const [numerator, denominator] = parent.children;

            if (selecting) {
                return exitToLeft(cursor, grandparent);
            } else if (currentNode === denominator) {
                // move from denominator to numerator
                return moveToPrevPibling(cursor, numerator, NUMERATOR);
            } else if (currentNode === numerator) {
                return exitToLeft(cursor, grandparent);
            }
        }
    }
    return cursor;
};
