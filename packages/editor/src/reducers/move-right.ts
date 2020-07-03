import * as Editor from "@math-blocks/editor";

import {State} from "../state";
import {
    nextIndex,
    hasChildren,
    getChildWithIndex,
    nodeAtPath,
    isPrefixArray,
    pathForNode,
    hasGrandchildren,
} from "../util";
import {SUB, SUP, NUMERATOR, DENOMINATOR, RADICAND} from "../constants";

type ID = {
    id: number;
};

export const moveRight = (
    currentNode: Editor.Row<Editor.Glyph, ID>,
    draft: State,
    selecting?: boolean,
): Editor.Cursor => {
    const {cursor, selectionStart, math} = draft;
    const {children} = currentNode;

    if (cursor.next !== Infinity) {
        const {next} = cursor;
        const nextNode = getChildWithIndex(currentNode.children, next);

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
                    return {
                        path: [...cursor.path, next, index],
                        prev: -Infinity,
                        next: node.children.length > 0 ? 0 : Infinity,
                    };
                }
            }
        }

        if (nextNode && nextNode.type === "root" && !selecting) {
            const radicand = nextNode.children[0];
            // TODO: handle navigating into the index
            return {
                path: [...cursor.path, next, RADICAND],
                prev: -Infinity,
                next: radicand.children.length > 0 ? 0 : Infinity,
            };
        } else if (nextNode && nextNode.type === "frac" && !selecting) {
            // enter fraction (numerator)
            const numerator = nextNode.children[0];
            return {
                path: [...cursor.path, next, NUMERATOR],
                prev: -Infinity,
                next: numerator.children.length > 0 ? 0 : Infinity,
            };
        } else if (nextNode && nextNode.type === "subsup" && !selecting) {
            // enter sup/sub
            const [sub, sup] = nextNode.children;
            if (sub) {
                return {
                    path: [...cursor.path, next, SUB],
                    prev: -Infinity,
                    next: sub.children.length > 0 ? 0 : Infinity,
                };
            } else if (sup) {
                return {
                    path: [...cursor.path, next, SUP],
                    prev: -Infinity,
                    next: sup.children.length > 0 ? 0 : Infinity,
                };
            } else {
                throw new Error("subsup node must have at least a sub or sup");
            }
        }

        // If all else fails, move to the right
        return {
            path: cursor.path,
            prev: cursor.next,
            next: nextIndex(children, next),
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
                return {
                    path: cursor.path.slice(0, -2),
                    prev: parentIndex,
                    next: nextIndex(grandparent.children, parentIndex),
                };
            }
            // TODO: handle moving out of the index if one exists
        } else if (parent.type === "subsup" && cursor.path.length >= 2) {
            const grandparent = nodeAtPath(
                math,
                cursor.path.slice(0, cursor.path.length - 2),
            );
            const parentIndex = cursor.path[cursor.path.length - 2];
            const [sub, sup] = parent.children;

            if (selecting && hasChildren(grandparent)) {
                // exit subsup to the right
                return {
                    path: cursor.path.slice(0, -2),
                    prev: parentIndex,
                    next: nextIndex(grandparent.children, parentIndex),
                };
            } else if (currentNode === sub && hasChildren(grandparent)) {
                if (sup) {
                    return {
                        path: [...cursor.path.slice(0, -1), SUP],
                        prev: -Infinity,
                        next: sup.children.length > 0 ? 0 : Infinity,
                    };
                } else {
                    return {
                        path: cursor.path.slice(0, -2),
                        prev: parentIndex,
                        next: nextIndex(grandparent.children, parentIndex),
                    };
                }
            } else if (currentNode === sup && hasChildren(grandparent)) {
                return {
                    path: cursor.path.slice(0, -2),
                    prev: parentIndex,
                    next: nextIndex(grandparent.children, parentIndex),
                };
            }
        } else if (parent.type === "frac" && cursor.path.length >= 2) {
            const grandparent = nodeAtPath(
                math,
                cursor.path.slice(0, cursor.path.length - 2),
            );
            const parentIndex = cursor.path[cursor.path.length - 2];
            const [numerator, denominator] = parent.children;

            if (selecting && hasChildren(grandparent)) {
                // exit fraction to the right
                return {
                    path: cursor.path.slice(0, -2),
                    prev: parentIndex,
                    next: nextIndex(grandparent.children, parentIndex),
                };
            } else if (currentNode === numerator) {
                // move from numerator to denominator
                return {
                    path: [...cursor.path.slice(0, -1), DENOMINATOR],
                    prev: -Infinity,
                    next: denominator.children.length > 0 ? 0 : Infinity,
                };
            } else if (
                currentNode === denominator &&
                hasChildren(grandparent)
            ) {
                // exit fraction to the right
                return {
                    path: cursor.path.slice(0, -2),
                    prev: parentIndex,
                    next: nextIndex(grandparent.children, parentIndex),
                };
            }
        }
    }
    return cursor;
};
