import * as Editor from "../editor-ast";
import * as Util from "../util";
import {
    nextIndex,
    hasChildren,
    nodeAtPath,
    isPrefixArray,
    pathForNode,
    hasGrandchildren,
    isGlyph,
} from "../util";
import {State} from "../row-reducer";
import {SUB, SUP, NUMERATOR, DENOMINATOR, RADICAND} from "../constants";

const enterFromLeft = (
    cursor: Editor.Cursor,
    row: Editor.Row,
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
    grandparentRow: Editor.Row,
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
    row: Editor.Row,
    index: number,
): Editor.Cursor => {
    return {
        path: [...cursor.path.slice(0, -1), index],
        prev: -Infinity,
        next: row.children.length > 0 ? 0 : Infinity,
    };
};

export const moveRight = (
    currentNode: Editor.Row,
    draft: State,
    selecting?: boolean,
): Editor.Cursor => {
    const {cursor, selectionStart, math} = draft;
    const {children} = currentNode;

    if (cursor.next !== Infinity) {
        const cols = Util.rowToColumns(currentNode);
        const {colIndex, cursor: cursorInCol} = Util.cursorInColumns(
            cols,
            cursor,
        );
        const nextCol = cols[colIndex + 1];
        const nextNextCol = cols[colIndex + 2];

        if (
            cursorInCol.next === Infinity &&
            nextCol.nodes.length === 1 &&
            Util.matchesGlyphs(nextCol.nodes[0], ["+", "\u2212"]) &&
            nextNextCol
        ) {
            return Util.columnCursorToCursor(
                {
                    colIndex: colIndex + 2,
                    cursor: {
                        path: [],
                        prev: -Infinity,
                        next: nextNextCol.nodes.length > 0 ? 0 : Infinity,
                    },
                },
                cols,
            );
        }

        // It's safe to use cursor.next directly as a key here
        // since we've already checked to make sure it isn't Infinity.
        let nextNode = currentNode.children[cursor.next];
        const prevNode = currentNode.children[cursor.prev];

        // Skip over column separator if the column to the right is non-empty
        // and we're not in an empty column ourselves.
        if (
            isGlyph(nextNode, "\u0008") &&
            cursor.next !== currentNode.children.length - 1 &&
            prevNode &&
            !isGlyph(prevNode, "\u0008")
        ) {
            const nextNextNode = currentNode.children[cursor.next + 1];
            if (!isGlyph(nextNextNode, "\u0008")) {
                nextNode = nextNextNode;
                // move to the right by one
                const newNext = nextIndex(children, cursor.next);
                cursor.prev = cursor.next;
                cursor.next = newNext;
            }
        }

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
        } else if (nextNode && nextNode.type === "limits" && !selecting) {
            // enter lower/upper limits
            const [lower, upper] = nextNode.children;
            // lower should always exist
            if (lower) {
                return enterFromLeft(cursor, lower, SUB);
            } else if (upper) {
                return enterFromLeft(cursor, upper, SUP);
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
        } else if (parent.type === "limits") {
            const [lower, upper] = parent.children;

            if (selecting) {
                return exitToRight(cursor, grandparent);
            } else if (currentNode === lower) {
                if (upper) {
                    return moveToNextPibling(cursor, upper, SUP);
                } else {
                    return exitToRight(cursor, grandparent);
                }
            } else if (currentNode === upper) {
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
