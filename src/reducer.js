// @flow
import produce from "immer";

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
        path: [root.id],
        prev: root.children[1].id,
        next: root.children[2].id,
    },
};

type Identifiable = $ReadOnly<{id: number, ...}>;

const hasChildren = (node: Editor.Node<Editor.Glyph>): %checks => {
    return node.type === "row" || node.type === "parens";
};

const getChildWithId = <T: Identifiable>(
    children: $ReadOnlyArray<T>,
    childId: number,
): T | void => {
    return children.find(child => child.id === childId);
};

const firstId = <T: Identifiable>(items: $ReadOnlyArray<T>) => {
    return items.length > 0 ? items[0].id : null;
};

const lastId = <T: Identifiable>(items: $ReadOnlyArray<T>) => {
    return items.length > 0 ? items[items.length - 1].id : null;
};

const nextId = (children: Editor.Node<Editor.Glyph>[], childId: number) => {
    const index = children.findIndex(child => child.id === childId);
    if (index === -1) {
        return null;
    }
    return index < children.length - 1 ? children[index + 1].id : null;
};

const prevId = (children: Editor.Node<Editor.Glyph>[], childId: number) => {
    const index = children.findIndex(child => child.id === childId);
    if (index === -1) {
        return null;
    }
    return index > 0 ? children[index - 1].id : null;
};

const removeIndex = <T>(array: T[], index: number): T[] => {
    return [...array.slice(0, index), ...array.slice(index + 1)];
};

const removeChildWithId = <T: Identifiable>(children: T[], id: number): T[] => {
    const index = children.findIndex(child => child.id === id);
    return index === -1
        ? children
        : [...children.slice(0, index), ...children.slice(index + 1)];
};

const insertBeforeChildWithId = <T: Identifiable>(
    children: T[],
    id: number,
    newChild: T,
): T[] => {
    const index = children.findIndex(child => child.id === id);
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
        const prevNode = getChildWithId(currentNode.children, cursor.prev);
        if (prevNode && prevNode.type === "frac") {
            // enter fraction (denominator)
            const denominator = prevNode.children[1];
            return {
                path: [...cursor.path, prevNode.id, denominator.id],
                next: null,
                prev: lastId(denominator.children),
            };
        } else if (prevNode && prevNode.type === "subsup") {
            // enter sup/sub
            if (prevNode.sup) {
                return {
                    path: [...cursor.path, prevNode.id, prevNode.sup.id],
                    next: null,
                    prev: lastId(prevNode.sup.children),
                };
            } else if (prevNode.sub) {
                return {
                    path: [...cursor.path, prevNode.id, prevNode.sub.id],
                    next: null,
                    prev: lastId(prevNode.sub.children),
                };
            } else {
                throw new Error("subsup node must have at least a sub or sup");
            }
        } else {
            // move to the left
            return {
                path: cursor.path,
                next: cursor.prev,
                prev: prevId(children, prev),
            };
        }
    } else if (cursor.path.length > 1) {
        const parent = Editor.findNode_(
            root,
            cursor.path[cursor.path.length - 2],
        );

        if (parent.type === "subsup" && cursor.path.length > 2) {
            const grandparent = Editor.findNode_(
                root,
                cursor.path[cursor.path.length - 3],
            );
            const {sub, sup} = parent;
            if (currentNode === sup && hasChildren(grandparent)) {
                if (sub) {
                    return {
                        path: [...cursor.path.slice(0, -1), sub.id],
                        next: null,
                        prev: lastId(sub.children),
                    };
                } else {
                    return {
                        path: cursor.path.slice(0, -2),
                        next: parent.id,
                        prev: prevId(grandparent.children, parent.id),
                    };
                }
            } else if (currentNode === sub && hasChildren(grandparent)) {
                return {
                    path: cursor.path.slice(0, -2),
                    next: parent.id,
                    prev: prevId(grandparent.children, parent.id),
                };
            }
        } else if (parent.type === "frac" && cursor.path.length > 2) {
            const grandparent = Editor.findNode_(
                root,
                cursor.path[cursor.path.length - 3],
            );

            const [numerator, denominator] = parent.children;

            if (currentNode === denominator) {
                // move from denominator to numerator
                return {
                    path: [...cursor.path.slice(0, -1), numerator.id],
                    next: null,
                    prev: lastId(numerator.children),
                };
            } else if (currentNode === numerator && hasChildren(grandparent)) {
                // exit fraction to the left
                return {
                    path: cursor.path.slice(0, -2),
                    next: parent.id,
                    prev: prevId(grandparent.children, parent.id),
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
        const nextNode = getChildWithId(currentNode.children, cursor.next);
        if (nextNode && nextNode.type === "frac") {
            // enter fraction (numerator)
            const numerator = nextNode.children[0];
            return {
                path: [...cursor.path, nextNode.id, numerator.id],
                prev: null,
                next: firstId(numerator.children),
            };
        } else if (nextNode && nextNode.type === "subsup") {
            // enter sup/sub
            if (nextNode.sub) {
                return {
                    path: [...cursor.path, nextNode.id, nextNode.sub.id],
                    prev: null,
                    next: firstId(nextNode.sub.children),
                };
            } else if (nextNode.sup) {
                return {
                    path: [...cursor.path, nextNode.id, nextNode.sup.id],
                    prev: null,
                    next: firstId(nextNode.sup.children),
                };
            } else {
                throw new Error("subsup node must have at least a sub or sup");
            }
        } else {
            // move to the right
            return {
                path: cursor.path,
                prev: cursor.next,
                next: nextId(children, next),
            };
        }
    } else if (cursor.path.length > 1) {
        const parent = Editor.findNode_(
            root,
            cursor.path[cursor.path.length - 2],
        );

        if (parent.type === "subsup" && cursor.path.length > 2) {
            const grandparent = Editor.findNode_(
                root,
                cursor.path[cursor.path.length - 3],
            );

            if (currentNode === parent.sub && hasChildren(grandparent)) {
                if (parent.sup) {
                    const {sup} = parent;
                    return {
                        path: [...cursor.path.slice(0, -1), sup.id],
                        prev: null,
                        next: firstId(sup.children),
                    };
                } else {
                    return {
                        path: cursor.path.slice(0, -2),
                        prev: parent.id,
                        next: nextId(grandparent.children, parent.id),
                    };
                }
            } else if (currentNode === parent.sup && hasChildren(grandparent)) {
                return {
                    path: cursor.path.slice(0, -2),
                    prev: parent.id,
                    next: nextId(grandparent.children, parent.id),
                };
            }
        } else if (parent.type === "frac" && cursor.path.length > 2) {
            const grandparent = Editor.findNode_(
                root,
                cursor.path[cursor.path.length - 3],
            );

            const [numerator, denominator] = parent.children;

            if (currentNode === numerator) {
                // move from numerator to denominator
                return {
                    path: [...cursor.path.slice(0, -1), denominator.id],
                    prev: null,
                    next: firstId(denominator.children),
                };
            } else if (
                currentNode === denominator &&
                hasChildren(grandparent)
            ) {
                // exit fraction to the right
                return {
                    path: cursor.path.slice(0, -2),
                    prev: parent.id,
                    next: nextId(grandparent.children, parent.id),
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
        const removeId = cursor.prev;
        const newCursor = {
            ...cursor,
            prev: prevId(currentNode.children, cursor.prev),
        };
        currentNode.children = removeChildWithId(children, removeId);
        draft.cursor = newCursor;
        return;
    } else if (cursor.path.length > 1) {
        const parent = Editor.findNode_(
            root,
            cursor.path[cursor.path.length - 2],
        );
        const grandparent = Editor.findNode_(
            root,
            cursor.path[cursor.path.length - 3],
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
                    : nextId(grandparent.children, parent.id);
            const prev = next
                ? prevId(newChildren, next)
                : firstId(grandparent.children);
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
        const {cursor} = draft;
        const currentNode = Editor.findNode_(
            draft.math,
            cursor.path[cursor.path.length - 1],
        );

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
                draft.cursor.prev = newNode.id;
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
                    if (!nextNode.sup) {
                        nextNode.sup = {
                            id: getId(),
                            type: "row",
                            children: [],
                        };
                    }
                    draft.cursor = {
                        path: [...cursor.path, nextNode.id, nextNode.sup.id],
                        prev: null,
                        next: firstId(nextNode.sup.children),
                    };
                    return;
                }
                newNode = {
                    id: getId(),
                    type: "subsup",
                    sup: {
                        id: getId(),
                        type: "row",
                        children: [],
                    },
                    sub: undefined,
                };
                break;
            }
            case "_": {
                if (nextNode && nextNode.type === "subsup") {
                    if (!nextNode.sub) {
                        nextNode.sub = {
                            id: getId(),
                            type: "row",
                            children: [],
                        };
                    }
                    draft.cursor = {
                        path: [...cursor.path, nextNode.id, nextNode.sub.id],
                        prev: null,
                        next: firstId(nextNode.sub.children),
                    };
                    return;
                }
                newNode = {
                    id: getId(),
                    type: "subsup",
                    sub: {
                        id: getId(),
                        type: "row",
                        children: [],
                    },
                    sup: undefined,
                };
                break;
            }
            default: {
                if (
                    action.type.length === 1 &&
                    action.type.charCodeAt(0) >= 32
                ) {
                    newNode = glyph(action.type);
                    draft.cursor.prev = newNode.id;
                    break;
                }
                return;
            }
        }

        if (next == null) {
            currentNode.children.push(newNode);
        } else {
            currentNode.children = insertBeforeChildWithId(
                currentNode.children,
                next,
                newNode,
            );
        }

        if (newNode.type === "frac") {
            const numerator = newNode.children[0];
            draft.cursor = {
                path: [...cursor.path, newNode.id, numerator.id],
                next: null,
                prev: null,
            };
        } else if (newNode.type === "subsup") {
            if (newNode.sup) {
                draft.cursor = {
                    path: [...cursor.path, newNode.id, newNode.sup.id],
                    next: null,
                    prev: null,
                };
            } else if (newNode.sub) {
                draft.cursor = {
                    path: [...cursor.path, newNode.id, newNode.sub.id],
                    next: null,
                    prev: null,
                };
            }
        }
    });
};

export default reducer;
