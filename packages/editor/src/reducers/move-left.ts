import * as Editor from "@math-blocks/editor";

import {State} from "../state";
import {
    prevIndex,
    nextIndex,
    hasChildren,
    getChildWithIndex,
    nodeAtPath,
    pathForNode,
    isPrefixArray,
    hasGrandchildren,
} from "../util";
import {SUB, SUP, NUMERATOR, RADICAND, DENOMINATOR} from "../constants";

type ID = {
    id: number;
};

const moveInto = (
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

const moveOut = (
    cursor: Editor.Cursor,
    grandparentRow: Editor.Row<Editor.Glyph, ID>,
    index: number,
): Editor.Cursor => {
    return {
        path: cursor.path.slice(0, -2),
        prev: prevIndex(grandparentRow.children, index),
        next: index,
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
        const {prev} = cursor;
        const prevNode = getChildWithIndex(currentNode.children, prev);

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
                    return moveInto(cursor, node, index);
                }
            }
        }

        if (prevNode && prevNode.type === "root" && !selecting) {
            const radicand = prevNode.children[0];
            return moveInto(cursor, radicand, RADICAND);
        } else if (prevNode && prevNode.type === "frac" && !selecting) {
            // enter fraction (denominator)
            const denominator = prevNode.children[1];
            return moveInto(cursor, denominator, DENOMINATOR);
        } else if (prevNode && prevNode.type === "subsup" && !selecting) {
            // enter sup/sub
            const [sub, sup] = prevNode.children;
            if (sup) {
                return moveInto(cursor, sup, SUP);
            } else if (sub) {
                return moveInto(cursor, sub, SUB);
            } else {
                throw new Error("subsup node must have at least a sub or sup");
            }
        }

        // If all else fails, move to the left
        const newPrev = prevIndex(children, prev);
        const newNext =
            newPrev === -Infinity
                ? children.length > 0
                    ? 0
                    : Infinity
                : nextIndex(children, newPrev);
        return {
            path: cursor.path,
            prev: newPrev,
            next: newNext,
        };
    } else if (cursor.path.length >= 1) {
        const parent = nodeAtPath(
            math,
            cursor.path.slice(0, cursor.path.length - 1),
        );

        if (parent.type === "root" && cursor.path.length >= 2) {
            const grandparent = nodeAtPath(
                math,
                cursor.path.slice(0, cursor.path.length - 2),
            );
            const parentIndex = cursor.path[cursor.path.length - 2];
            if (hasChildren(grandparent)) {
                return moveOut(cursor, grandparent, parentIndex);
            }
            // TODO: handle moving into the index if one exists
        } else if (parent.type === "subsup" && cursor.path.length >= 2) {
            const grandparent = nodeAtPath(
                math,
                cursor.path.slice(0, cursor.path.length - 2),
            );
            const parentIndex = cursor.path[cursor.path.length - 2];
            const [sub, sup] = parent.children;

            if (selecting && hasChildren(grandparent)) {
                // exit subsup to the left
                return moveOut(cursor, grandparent, parentIndex);
            } else if (currentNode === sup && hasChildren(grandparent)) {
                if (sub) {
                    return {
                        path: [...cursor.path.slice(0, -1), SUB],
                        prev:
                            sub.children.length > 0
                                ? sub.children.length - 1
                                : -Infinity,
                        next: Infinity,
                    };
                } else {
                    return moveOut(cursor, grandparent, parentIndex);
                }
            } else if (currentNode === sub && hasChildren(grandparent)) {
                return moveOut(cursor, grandparent, parentIndex);
            }
        } else if (parent.type === "frac" && cursor.path.length >= 2) {
            const grandparent = nodeAtPath(
                math,
                cursor.path.slice(0, cursor.path.length - 2),
            );
            const parentIndex = cursor.path[cursor.path.length - 2];
            const [numerator, denominator] = parent.children;

            if (selecting && hasChildren(grandparent)) {
                // exit fraction to the left
                return moveOut(cursor, grandparent, parentIndex);
            } else if (currentNode === denominator) {
                // move from denominator to numerator
                return {
                    path: [...cursor.path.slice(0, -1), NUMERATOR],
                    prev:
                        numerator.children.length > 0
                            ? numerator.children.length - 1
                            : -Infinity,
                    next: Infinity,
                };
            } else if (currentNode === numerator && hasChildren(grandparent)) {
                // exit fraction to the left
                return moveOut(cursor, grandparent, parentIndex);
            }
        }
    }
    return cursor;
};
