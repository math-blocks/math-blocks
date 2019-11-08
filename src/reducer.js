// @flow
import produce from "immer";
import {original} from "immer";

import * as Editor from "./editor";
import {getId} from "./unique-id";

export type State = {
    math: Editor.Row<Editor.Glyph>,
    cursor: Editor.Cursor,
};

const {row, glyph, frac} = Editor;

const root: Editor.Row<Editor.Glyph> = row([
    glyph("1"),
    glyph("+"),
    frac([glyph("1")], [glyph("2"), glyph("y")]),
    glyph("\u2212"),
    glyph("x"),
]);

const initialState: State = {
    math: root,
    cursor: {
        path: [],
        prev: null,
        next: 0,
    },
};

type Identifiable = $ReadOnly<{id: number, ...}>;

const hasChildren = (node: Editor.Node<Editor.Glyph>): %checks => {
    return node.type === "row" || node.type === "parens";
};

const getChildWithIndex = <T: Identifiable>(
    children: $ReadOnlyArray<T>,
    childIndex: number,
): ?T => {
    return children[childIndex] || null;
};

const firstIndex = <T: Identifiable>(items: $ReadOnlyArray<T>) => {
    return items.length > 0 ? 0 : null;
};

const lastIndex = <T: Identifiable>(items: $ReadOnlyArray<T>) => {
    return items.length > 0 ? items.length - 1 : null;
};

const nextIndex = (
    children: Editor.Node<Editor.Glyph>[],
    childIndex: number,
) => {
    return childIndex < children.length - 1 ? childIndex + 1 : null;
};

const prevIndex = (
    children: Editor.Node<Editor.Glyph>[],
    childIndex: number,
) => {
    return childIndex > 0 ? childIndex - 1 : null;
};

const removeIndex = <T>(array: T[], index: number): T[] => {
    return [...array.slice(0, index), ...array.slice(index + 1)];
};

const removeChildWithIndex = <T: Identifiable>(
    children: T[],
    index: number,
): T[] => {
    return index === -1
        ? children
        : [...children.slice(0, index), ...children.slice(index + 1)];
};

const insertBeforeChildWithIndex = <T: Identifiable>(
    children: T[],
    index: number,
    newChild: T,
): T[] => {
    return index === -1
        ? children
        : [...children.slice(0, index), newChild, ...children.slice(index)];
};

const moveLeft = (
    root: Editor.Node<Editor.Glyph>,
    currentNode: Editor.HasChildren<Editor.Glyph>,
    cursor: Editor.Cursor,
): Editor.Cursor => {
    const {children} = currentNode;
    if (cursor.prev != null) {
        const {prev} = cursor;
        const prevNode = getChildWithIndex(currentNode.children, prev);
        if (prevNode && prevNode.type === "frac") {
            // enter fraction (denominator)
            const denominator = prevNode.children[1];
            return {
                path: [...cursor.path, prev, 1],
                next: null,
                prev: lastIndex(denominator.children),
            };
        } else if (prevNode && prevNode.type === "subsup") {
            // enter sup/sub
            const [sub, sup] = prevNode.children;
            if (sup) {
                return {
                    path: [...cursor.path, prev, 1 /* sup */],
                    next: null,
                    prev: lastIndex(sup.children),
                };
            } else if (sub) {
                return {
                    path: [...cursor.path, prev, 0 /* sub */],
                    next: null,
                    prev: lastIndex(sub.children),
                };
            } else {
                throw new Error("subsup node must have at least a sub or sup");
            }
        } else {
            // move to the left
            return {
                path: cursor.path,
                next: cursor.prev,
                prev: prevIndex(children, prev),
            };
        }
    } else if (cursor.path.length >= 1) {
        const parent = Editor.nodeAtPath(
            root,
            cursor.path.slice(0, cursor.path.length - 1),
        );

        if (parent.type === "subsup" && cursor.path.length >= 2) {
            const grandparent = Editor.nodeAtPath(
                root,
                cursor.path.slice(0, cursor.path.length - 2),
            );
            const parentIndex = cursor.path[cursor.path.length - 2];
            const [sub, sup] = parent.children;

            if (currentNode === sup && hasChildren(grandparent)) {
                if (sub) {
                    return {
                        path: [...cursor.path.slice(0, -1), 0 /* sub */],
                        next: null,
                        prev: lastIndex(sub.children),
                    };
                } else {
                    return {
                        path: cursor.path.slice(0, -2),
                        next: grandparent.children.indexOf(parent),
                        prev: grandparent.children.indexOf(parent) - 1,
                    };
                }
            } else if (currentNode === sub && hasChildren(grandparent)) {
                return {
                    path: cursor.path.slice(0, -2),
                    next: parentIndex,
                    prev: prevIndex(grandparent.children, parentIndex),
                };
            }
        } else if (parent.type === "frac" && cursor.path.length >= 2) {
            const grandparent = Editor.nodeAtPath(
                root,
                cursor.path.slice(0, cursor.path.length - 2),
            );
            const parentIndex = cursor.path[cursor.path.length - 2];
            const [numerator, denominator] = parent.children;

            if (currentNode === denominator) {
                // move from denominator to numerator
                return {
                    path: [...cursor.path.slice(0, -1), 0 /* numerator */],
                    next: null,
                    prev: lastIndex(numerator.children),
                };
            } else if (currentNode === numerator && hasChildren(grandparent)) {
                // exit fraction to the left
                return {
                    path: cursor.path.slice(0, -2),
                    next: parentIndex,
                    prev: prevIndex(grandparent.children, parentIndex),
                };
            }
        }
    }
    return cursor;
};

const moveRight = (
    root: Editor.Node<Editor.Glyph>,
    currentNode: Editor.HasChildren<Editor.Glyph>,
    cursor: Editor.Cursor,
): Editor.Cursor => {
    const {children} = currentNode;
    if (cursor.next != null) {
        const {next} = cursor;
        const nextNode = getChildWithIndex(currentNode.children, next);
        if (nextNode && nextNode.type === "frac") {
            // enter fraction (numerator)
            const numerator = nextNode.children[0];
            return {
                path: [...cursor.path, next, 0 /* numerator */],
                prev: null,
                next: firstIndex(numerator.children),
            };
        } else if (nextNode && nextNode.type === "subsup") {
            // enter sup/sub
            const [sub, sup] = nextNode.children;
            if (sub) {
                return {
                    path: [...cursor.path, next, 0 /* sub */],
                    prev: null,
                    next: firstIndex(sub.children),
                };
            } else if (sup) {
                return {
                    path: [...cursor.path, next, 1 /* sup */],
                    prev: null,
                    next: firstIndex(sup.children),
                };
            } else {
                throw new Error("subsup node must have at least a sub or sup");
            }
        } else {
            // move to the right
            return {
                path: cursor.path,
                prev: cursor.next,
                next: nextIndex(children, next),
            };
        }
    } else if (cursor.path.length >= 1) {
        const parent = Editor.nodeAtPath(
            root,
            cursor.path.slice(0, cursor.path.length - 1),
        );
        if (parent.type === "subsup" && cursor.path.length >= 2) {
            const grandparent = Editor.nodeAtPath(
                root,
                cursor.path.slice(0, cursor.path.length - 2),
            );
            const parentIndex = cursor.path[cursor.path.length - 2];
            const [sub, sup] = parent.children;

            if (currentNode === sub && hasChildren(grandparent)) {
                if (sup) {
                    return {
                        path: [...cursor.path.slice(0, -1), 1 /* sup */],
                        prev: null,
                        next: firstIndex(sup.children),
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
            const grandparent = Editor.nodeAtPath(
                root,
                cursor.path.slice(0, cursor.path.length - 2),
            );
            const parentIndex = cursor.path[cursor.path.length - 2];
            const [numerator, denominator] = parent.children;

            if (currentNode === numerator) {
                // move from numerator to denominator
                return {
                    path: [...cursor.path.slice(0, -1), 1 /* denominator */],
                    prev: null,
                    next: firstIndex(denominator.children),
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

const backspace = (currentNode: Editor.Node<Editor.Glyph>, draft: State) => {
    if (!hasChildren(currentNode)) {
        throw new Error("currentNode can't be a glyph, fraction, sup, or sub");
    }
    const {cursor} = draft;

    if (cursor.prev != null) {
        const {children} = currentNode;
        const removeIndex = cursor.prev;
        const newCursor = {
            ...cursor,
            prev: prevIndex(currentNode.children, cursor.prev),
            next:
                cursor.next != null
                    ? prevIndex(currentNode.children, cursor.next)
                    : null,
        };
        currentNode.children = removeChildWithIndex(children, removeIndex);
        draft.cursor = newCursor;
        return;
    } else if (cursor.path.length > 1) {
        const parent = Editor.nodeAtPath(
            root,
            cursor.path.slice(0, cursor.path.length - 1),
        );
        const grandparent = Editor.nodeAtPath(
            root,
            cursor.path.slice(0, cursor.path.length - 2),
        );

        if (parent.type === "subsup") {
            if (!hasChildren(grandparent)) {
                return;
            }

            const index = grandparent.children.findIndex(
                child => child.id === parent.id,
            );
            const newChildren =
                index === -1
                    ? grandparent.children
                    : // replace currentNode with currentNode's children
                      [
                          ...grandparent.children.slice(0, index),
                          ...currentNode.children,
                          ...grandparent.children.slice(index + 1),
                      ];

            // update cursor
            const next =
                currentNode.children.length > 0
                    ? currentNode.children[0].id
                    : nextIndex(grandparent.children, parent.id);
            const prev = next
                ? prevIndex(newChildren, next)
                : firstIndex(grandparent.children);
            const newCursor = {
                path: cursor.path.slice(0, -2), // move up two levels
                prev,
                next,
            };

            // update children
            grandparent.children = newChildren;

            draft.cursor = newCursor;
            return;
        }
    }
};

export type Action = {type: string};
export type Dispatch = Action => void;

const reducer = (state: State = initialState, action: Action) => {
    return produce(state, draft => {
        const {cursor, math} = draft;
        const currentNode = Editor.nodeAtPath(draft.math, cursor.path);

        if (!hasChildren(currentNode)) {
            throw new Error(
                "currentNode can't be a glyph, fraction, sup, or sub",
            );
        }

        const nextNode =
            cursor.next && hasChildren(currentNode)
                ? currentNode.children.find(child => child.id === cursor.next)
                : null;

        let newNode: Editor.Node<Editor.Glyph>;
        const {next} = cursor;

        switch (action.type) {
            case "ArrowLeft": {
                draft.cursor = moveLeft(draft.math, currentNode, cursor);
                return;
            }
            case "ArrowRight": {
                draft.cursor = moveRight(draft.math, currentNode, cursor);
                return;
            }
            case "Backspace": {
                backspace(currentNode, draft);
                return;
            }
            case "-": {
                newNode = {
                    id: getId(),
                    type: "atom",
                    value: {
                        kind: "glyph",
                        char: "\u2212",
                    },
                };
                draft.cursor.prev = newNode.id;
                break;
            }
            case "*": {
                newNode = {
                    id: getId(),
                    type: "atom",
                    value: {
                        kind: "glyph",
                        char: "\u00B7",
                    },
                };
                draft.cursor.next =
                    cursor.next != null ? cursor.next + 1 : null;
                draft.cursor.prev = cursor.prev != null ? cursor.prev + 1 : 0;
                break;
            }
            case "/": {
                newNode = {
                    id: getId(),
                    type: "frac",
                    children: [
                        {
                            id: getId(),
                            type: "row",
                            children: [],
                        },
                        {
                            id: getId(),
                            type: "row",
                            children: [],
                        },
                    ],
                };
                break;
            }
            case "^": {
                if (nextNode && nextNode.type === "subsup") {
                    const sub = nextNode.children[0];
                    const sup = nextNode.children[1] || {
                        id: getId(),
                        type: "row",
                        children: [],
                    };
                    nextNode.children = [sub, sup];
                    draft.cursor = {
                        path: [...cursor.path, cursor.next + 1, 1],
                        prev: null,
                        next: sup.children.length > 0 ? 0 : null,
                    };
                    return;
                }
                const sup = {
                    id: getId(),
                    type: "row",
                    children: [],
                };
                newNode = {
                    id: getId(),
                    type: "subsup",
                    children: [null, sup],
                };
                break;
            }
            case "_": {
                if (nextNode && nextNode.type === "subsup") {
                    const sub = nextNode.children[0] || {
                        id: getId(),
                        type: "row",
                        children: [],
                    };
                    const sup = nextNode.children[1];
                    nextNode.children = [sub, sup];
                    draft.cursor = {
                        path: [...cursor.path, nextNode.id, sub.id],
                        prev: null,
                        next: firstIndex(sub.children),
                    };
                    return;
                }
                const sub = {
                    id: getId(),
                    type: "row",
                    children: [],
                };
                newNode = {
                    id: getId(),
                    type: "subsup",
                    children: [sub, null],
                };
                break;
            }
            default: {
                if (
                    action.type.length === 1 &&
                    action.type.charCodeAt(0) >= 32
                ) {
                    newNode = glyph(action.type);
                    draft.cursor.next =
                        cursor.next != null ? cursor.next + 1 : null;
                    draft.cursor.prev =
                        cursor.prev != null ? cursor.prev + 1 : 0;
                    break;
                }
                return;
            }
        }

        if (next == null) {
            currentNode.children.push(newNode);
        } else {
            currentNode.children = insertBeforeChildWithIndex(
                currentNode.children,
                next,
                newNode,
            );
        }

        if (newNode.type === "frac") {
            const numerator = newNode.children[0];
            const index = currentNode.children.indexOf(newNode);
            draft.cursor = {
                path: [...cursor.path, index, 0 /* numerator */],
                next: null,
                prev: null,
            };
        } else if (newNode.type === "subsup") {
            const [sub, sup] = newNode.children;
            if (sup) {
                draft.cursor = {
                    path: [
                        ...cursor.path,
                        cursor.next == null
                            ? currentNode.children.length - 1
                            : cursor.next,
                        1,
                    ],
                    next: null,
                    prev: null,
                };
            } else if (sub) {
                draft.cursor = {
                    path: [
                        ...cursor.path,
                        cursor.next == null
                            ? currentNode.children.length - 1
                            : cursor.next,
                        0,
                    ],
                    next: null,
                    prev: null,
                };
            }
        }
    });
};

export default reducer;
