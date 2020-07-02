import * as Editor from "@math-blocks/editor";

import {State} from "../state";
import {prevIndex, nextIndex, hasChildren, getChildWithIndex} from "../util";
import {SUB, SUP, NUMERATOR, RADICAND} from "../constants";

type ID = {
    id: number;
};

export const moveLeft = (
    currentNode: Editor.Row<Editor.Glyph, ID>,
    draft: State,
    selecting?: boolean,
): Editor.Cursor => {
    const {cursor, math} = draft;

    const {children} = currentNode;
    if (cursor.prev !== -Infinity) {
        const {prev} = cursor;
        const prevNode = getChildWithIndex(currentNode.children, prev);
        if (prevNode && prevNode.type === "root" && !selecting) {
            const radicand = prevNode.children[0];
            return {
                path: [...cursor.path, prev, RADICAND],
                prev:
                    radicand.children.length > 0
                        ? radicand.children.length - 1
                        : -Infinity,
                next: Infinity,
            };
        } else if (prevNode && prevNode.type === "frac" && !selecting) {
            // enter fraction (denominator)
            const denominator = prevNode.children[1];
            return {
                path: [...cursor.path, prev, 1],
                prev:
                    denominator.children.length > 0
                        ? denominator.children.length - 1
                        : -Infinity,
                next: Infinity,
            };
        } else if (prevNode && prevNode.type === "subsup" && !selecting) {
            // enter sup/sub
            const [sub, sup] = prevNode.children;
            if (sup) {
                return {
                    path: [...cursor.path, prev, SUP],
                    prev:
                        sup.children.length > 0
                            ? sup.children.length - 1
                            : -Infinity,
                    next: Infinity,
                };
            } else if (sub) {
                return {
                    path: [...cursor.path, prev, SUB],
                    prev:
                        sub.children.length > 0
                            ? sub.children.length - 1
                            : -Infinity,
                    next: Infinity,
                };
            } else {
                throw new Error("subsup node must have at least a sub or sup");
            }
        } else {
            // move to the left
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
        }
    } else if (cursor.path.length >= 1) {
        const parent = Editor.nodeAtPath(
            math,
            cursor.path.slice(0, cursor.path.length - 1),
        );

        if (parent.type === "root" && cursor.path.length >= 2) {
            const grandparent = Editor.nodeAtPath(
                math,
                cursor.path.slice(0, cursor.path.length - 2),
            );
            const parentIndex = cursor.path[cursor.path.length - 2];
            if (hasChildren(grandparent)) {
                return {
                    path: cursor.path.slice(0, -2),
                    prev: prevIndex(grandparent.children, parentIndex),
                    next: parentIndex,
                };
            }
            // TODO: handle moving into the index if one exists
        } else if (parent.type === "subsup" && cursor.path.length >= 2) {
            const grandparent = Editor.nodeAtPath(
                math,
                cursor.path.slice(0, cursor.path.length - 2),
            );
            const parentIndex = cursor.path[cursor.path.length - 2];
            const [sub, sup] = parent.children;

            if (currentNode === sup && hasChildren(grandparent)) {
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
                    return {
                        path: cursor.path.slice(0, -2),
                        prev: grandparent.children.indexOf(parent) - 1,
                        next: grandparent.children.indexOf(parent),
                    };
                }
            } else if (currentNode === sub && hasChildren(grandparent)) {
                return {
                    path: cursor.path.slice(0, -2),
                    prev: prevIndex(grandparent.children, parentIndex),
                    next: parentIndex,
                };
            }
        } else if (parent.type === "frac" && cursor.path.length >= 2) {
            const grandparent = Editor.nodeAtPath(
                math,
                cursor.path.slice(0, cursor.path.length - 2),
            );
            const parentIndex = cursor.path[cursor.path.length - 2];
            const [numerator, denominator] = parent.children;

            if (currentNode === denominator) {
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
                return {
                    path: cursor.path.slice(0, -2),
                    prev: prevIndex(grandparent.children, parentIndex),
                    next: parentIndex,
                };
            }
        }
    }
    return cursor;
};
