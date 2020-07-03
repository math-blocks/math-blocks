import * as Editor from "@math-blocks/editor";

import {State} from "../state";
import {
    nextIndex,
    prevIndex,
    hasChildren,
    nodeAtPath,
    isPrefixArray,
    pathForNode,
    hasGrandchildren,
} from "../util";
import {SUB, SUP, NUMERATOR, DENOMINATOR, RADICAND} from "../constants";

type ID = {
    id: number;
};

const enterFromLeft = (
    cursor: Editor.Cursor,
    row: Editor.Row<Editor.Glyph, ID>,
    index: number,
): Editor.Cursor => {
    return {
        path: [...cursor.path, cursor.next, index],
        prev: -Infinity,
        next: row.children.length > 0 ? 0 : Infinity,
    };
};

const exitToRight = (
    cursor: Editor.Cursor,
    grandparentRow: Editor.Row<Editor.Glyph, ID>,
): Editor.Cursor => {
    const index = cursor.path[cursor.path.length - 2];

    return {
        path: cursor.path.slice(0, -2),
        prev: index,
        next: nextIndex(grandparentRow.children, index),
    };
};

// move to next parent's sibling
const moveToNextPibling = (
    cursor: Editor.Cursor,
    row: Editor.Row<Editor.Glyph, ID>,
    index: number,
): Editor.Cursor => {
    return {
        path: [...cursor.path.slice(0, -1), index],
        prev: -Infinity,
        next: row.children.length > 0 ? 0 : Infinity,
    };
};

export const moveRight = (
    currentNode: Editor.Row<Editor.Glyph, ID>,
    draft: State,
    selecting?: boolean,
): Editor.Cursor => {
    const {cursor, selectionStart, math} = draft;
    const {children} = currentNode;

    if (cursor.next !== Infinity) {
        // It's safe to use cursor.next directly as a key here
        // since we've already checked to make sure it isn't Infinity.
        const nextNode = currentNode.children[cursor.next];

        if (nextNode && hasGrandchildren(nextNode)) {
            // check if draft.selectionStart is within nextNode
            const path = pathForNode(math, nextNode);
            if (
                path &&
                selectionStart &&
                isPrefixArray(path, selectionStart.path)
            ) {
                const index = selectionStart.path[path.length];
                const node = nextNode.children[index];
                if (node) {
                    return enterFromLeft(cursor, node, index);
                }
            }
        }

        if (nextNode && nextNode.type === "root" && !selecting) {
            const radicand = nextNode.children[0];
            // TODO: handle navigating into the index
            return enterFromLeft(cursor, radicand, RADICAND);
        } else if (nextNode && nextNode.type === "frac" && !selecting) {
            // enter fraction (numerator)
            const numerator = nextNode.children[0];
            return enterFromLeft(cursor, numerator, NUMERATOR);
        } else if (nextNode && nextNode.type === "subsup" && !selecting) {
            // enter sup/sub
            const [sub, sup] = nextNode.children;
            if (sub) {
                return enterFromLeft(cursor, sub, SUB);
            } else if (sup) {
                return enterFromLeft(cursor, sup, SUP);
            } else {
                throw new Error("subsup node must have at least a sub or sup");
            }
        }

        // If all else fails, move to the right
        const newNext = nextIndex(children, cursor.next);

        return {
            path: cursor.path,
            prev: cursor.next,
            next: newNext,
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
            return exitToRight(cursor, grandparent);
            // TODO: handle moving out of the index if one exists
        } else if (parent.type === "subsup") {
            const [sub, sup] = parent.children;

            if (selecting) {
                return exitToRight(cursor, grandparent);
            } else if (currentNode === sub) {
                if (sup) {
                    return moveToNextPibling(cursor, sup, SUP);
                } else {
                    return exitToRight(cursor, grandparent);
                }
            } else if (currentNode === sup) {
                return exitToRight(cursor, grandparent);
            }
        } else if (parent.type === "frac") {
            const [numerator, denominator] = parent.children;

            if (selecting) {
                return exitToRight(cursor, grandparent);
            } else if (currentNode === numerator) {
                // move from numerator to denominator
                return moveToNextPibling(cursor, denominator, DENOMINATOR);
            } else if (currentNode === denominator) {
                return exitToRight(cursor, grandparent);
            }
        }
    }
    return cursor;
};
