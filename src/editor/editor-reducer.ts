import produce from "immer";

import * as Editor from "./editor";
import {getId} from "../unique-id";

export type State = {
    math: Editor.Row<Editor.Glyph>;
    cursor: Editor.Cursor;
};

const {row, glyph, frac} = Editor;

const SUB = 0;
const SUP = 1;
const NUMERATOR = 0;
const DENOMINATOR = 1;
const RADICAND = 0;

const initialState: State = {
    math: row([
        glyph("1"),
        glyph("+"),
        frac([glyph("1")], [glyph("2"), glyph("y")]),
        glyph("\u2212"),
        glyph("x"),
    ]),
    cursor: {
        path: [],
        prev: null,
        next: 0,
    },
};

type Identifiable = {readonly id: number};

type HasChildren = Editor.Row<Editor.Glyph> | Editor.Parens<Editor.Glyph>;

const hasChildren = (node: Editor.Node<Editor.Glyph>): node is HasChildren => {
    return node.type === "row" || node.type === "parens";
};

const getChildWithIndex = <T extends Identifiable>(
    children: ReadonlyArray<T>,
    childIndex: number,
): T | null => {
    return children[childIndex] || null;
};

const firstIndex = <T extends Identifiable>(
    items: ReadonlyArray<T>,
): number | null => {
    return items.length > 0 ? 0 : null;
};

const lastIndex = <T extends Identifiable>(
    items: ReadonlyArray<T>,
): number | null => {
    return items.length > 0 ? items.length - 1 : null;
};

const nextIndex = (
    children: Editor.Node<Editor.Glyph>[],
    childIndex: number,
): number | null => {
    return childIndex < children.length - 1 ? childIndex + 1 : null;
};

const prevIndex = (
    children: Editor.Node<Editor.Glyph>[],
    childIndex: number,
): number | null => {
    return childIndex > 0 ? childIndex - 1 : null;
};

const removeChildWithIndex = <T extends Identifiable>(
    children: T[],
    index: number,
): T[] => {
    return index === -1
        ? children
        : [...children.slice(0, index), ...children.slice(index + 1)];
};

const insertBeforeChildWithIndex = <T extends Identifiable>(
    children: T[],
    index: number | null,
    newChild: T,
): T[] => {
    if (index == null) {
        return [...children, newChild];
    }
    return index === -1
        ? children
        : [...children.slice(0, index), newChild, ...children.slice(index)];
};

const moveLeft = (
    currentNode: Editor.HasChildren<Editor.Glyph>,
    draft: State,
): Editor.Cursor => {
    const {cursor, math} = draft;

    const {children} = currentNode;
    if (cursor.prev != null) {
        const {prev} = cursor;
        const prevNode = getChildWithIndex(currentNode.children, prev);
        if (prevNode && prevNode.type === "root") {
            const radicand = prevNode.children[0];
            return {
                path: [...cursor.path, prev, RADICAND],
                prev: lastIndex(radicand.children),
                next: null,
            };
        } else if (prevNode && prevNode.type === "frac") {
            // enter fraction (denominator)
            const denominator = prevNode.children[1];
            return {
                path: [...cursor.path, prev, 1],
                prev: lastIndex(denominator.children),
                next: null,
            };
        } else if (prevNode && prevNode.type === "subsup") {
            // enter sup/sub
            const [sub, sup] = prevNode.children;
            if (sup) {
                return {
                    path: [...cursor.path, prev, SUP],
                    prev: lastIndex(sup.children),
                    next: null,
                };
            } else if (sub) {
                return {
                    path: [...cursor.path, prev, SUB],
                    prev: lastIndex(sub.children),
                    next: null,
                };
            } else {
                throw new Error("subsup node must have at least a sub or sup");
            }
        } else if (prevNode && prevNode.type === "parens") {
            return {
                path: [...cursor.path, prev],
                prev: lastIndex(prevNode.children),
                next: null,
            };
        } else {
            // move to the left
            return {
                path: cursor.path,
                prev: prevIndex(children, prev),
                next: cursor.prev,
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
                        prev: lastIndex(sub.children),
                        next: null,
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
                    prev: lastIndex(numerator.children),
                    next: null,
                };
            } else if (currentNode === numerator && hasChildren(grandparent)) {
                // exit fraction to the left
                return {
                    path: cursor.path.slice(0, -2),
                    prev: prevIndex(grandparent.children, parentIndex),
                    next: parentIndex,
                };
            }
        } else if (currentNode.type === "parens") {
            const parentIndex = cursor.path[cursor.path.length - 1];
            if (hasChildren(parent)) {
                // exit parens to the left
                return {
                    path: cursor.path.slice(0, -1),
                    prev: prevIndex(parent.children, parentIndex),
                    next: parentIndex,
                };
            }
        }
    }
    return cursor;
};

const moveRight = (currentNode: HasChildren, draft: State): Editor.Cursor => {
    const {cursor, math} = draft;
    const {children} = currentNode;
    if (cursor.next != null) {
        const {next} = cursor;
        const nextNode = getChildWithIndex(currentNode.children, next);
        if (nextNode && nextNode.type === "root") {
            const radicand = nextNode.children[0];
            // TODO: handle navigating into the index
            return {
                path: [...cursor.path, next, RADICAND],
                prev: null,
                next: firstIndex(radicand.children),
            };
        } else if (nextNode && nextNode.type === "frac") {
            // enter fraction (numerator)
            const numerator = nextNode.children[0];
            return {
                path: [...cursor.path, next, NUMERATOR],
                prev: null,
                next: firstIndex(numerator.children),
            };
        } else if (nextNode && nextNode.type === "subsup") {
            // enter sup/sub
            const [sub, sup] = nextNode.children;
            if (sub) {
                return {
                    path: [...cursor.path, next, SUB],
                    prev: null,
                    next: firstIndex(sub.children),
                };
            } else if (sup) {
                return {
                    path: [...cursor.path, next, SUP],
                    prev: null,
                    next: firstIndex(sup.children),
                };
            } else {
                throw new Error("subsup node must have at least a sub or sup");
            }
        } else if (nextNode && nextNode.type === "parens") {
            return {
                path: [...cursor.path, next],
                prev: null,
                next: firstIndex(nextNode.children),
            };
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
                    prev: parentIndex,
                    next: nextIndex(grandparent.children, parentIndex),
                };
            }
            // TODO: handle moving out of the index if one exists
        } else if (parent.type === "subsup" && cursor.path.length >= 2) {
            const grandparent = Editor.nodeAtPath(
                math,
                cursor.path.slice(0, cursor.path.length - 2),
            );
            const parentIndex = cursor.path[cursor.path.length - 2];
            const [sub, sup] = parent.children;

            if (currentNode === sub && hasChildren(grandparent)) {
                if (sup) {
                    return {
                        path: [...cursor.path.slice(0, -1), SUP],
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
                math,
                cursor.path.slice(0, cursor.path.length - 2),
            );
            const parentIndex = cursor.path[cursor.path.length - 2];
            const [numerator, denominator] = parent.children;

            if (currentNode === numerator) {
                // move from numerator to denominator
                return {
                    path: [...cursor.path.slice(0, -1), DENOMINATOR],
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
        } else if (currentNode.type === "parens") {
            const parentIndex = cursor.path[cursor.path.length - 1];
            if (hasChildren(parent)) {
                // exit parens to the left
                return {
                    path: cursor.path.slice(0, -1),
                    next: nextIndex(parent.children, parentIndex),
                    prev: parentIndex,
                };
            }
        }
    }
    return cursor;
};

const backspace = (currentNode: HasChildren, draft: State): void => {
    const {cursor, math} = draft;

    if (cursor.prev != null) {
        const {children} = currentNode;
        const removeIndex = cursor.prev;
        const prevNode = children[removeIndex];
        if (
            prevNode.type === "subsup" ||
            prevNode.type === "frac" ||
            prevNode.type === "parens" ||
            prevNode.type === "root"
        ) {
            draft.cursor = moveLeft(currentNode, draft);
            return;
        }
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
    }

    if (cursor.path.length > 0) {
        const parent = Editor.nodeAtPath(
            math,
            cursor.path.slice(0, cursor.path.length - 1),
        );
        if (currentNode.type === "parens") {
            if (!hasChildren(parent)) {
                return;
            }

            const index = cursor.path[cursor.path.length - 1];

            const newChildren = [
                ...parent.children.slice(0, index),
                ...currentNode.children,
                ...parent.children.slice(index + 1),
            ];

            const newCursor = {
                path: cursor.path.slice(0, -1),
                prev: prevIndex(newChildren, index),
                next: index,
            };

            parent.children = newChildren;
            draft.cursor = newCursor;
            return;
        }
    }

    if (cursor.path.length > 1) {
        const parent = Editor.nodeAtPath(
            math,
            cursor.path.slice(0, cursor.path.length - 1),
        );
        const grandparent = Editor.nodeAtPath(
            math,
            cursor.path.slice(0, cursor.path.length - 2),
        );

        if (!hasChildren(grandparent)) {
            return;
        }

        let parentIndex = cursor.path[cursor.path.length - 2];

        if (parent.type === "subsup") {
            const index = grandparent.children.findIndex(
                child => child.id === parent.id,
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
            const newCursor = {
                path: cursor.path.slice(0, -2), // move up two levels
                prev: prevIndex(newChildren, parentIndex),
                next: parentIndex,
            };

            // update children
            grandparent.children = newChildren;

            draft.cursor = newCursor;
            return;
        } else if (parent.type === "frac") {
            const index = grandparent.children.findIndex(
                child => child.id === parent.id,
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
            const newCursor = {
                path: cursor.path.slice(0, -2), // move up two levels
                prev: prevIndex(newChildren, parentIndex),
                next: parentIndex,
            };

            // update children
            grandparent.children = newChildren;

            draft.cursor = newCursor;
            return;
        } else if (parent.type === "root") {
            const index = grandparent.children.findIndex(
                child => child.id === parent.id,
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
            const newCursor = {
                path: cursor.path.slice(0, -2), // move up two levels
                prev: prevIndex(newChildren, parentIndex),
                next: parentIndex,
            };

            // update children
            grandparent.children = newChildren;

            draft.cursor = newCursor;
            return;
        }
    }
};

const slash = (currentNode: HasChildren, draft: State): void => {
    const {cursor} = draft;
    const {next} = cursor;

    const splitChars = [
        "+",
        "\u2212",
        "\u00B7",
        "=",
        "<",
        ">",
        "\u2264",
        "\u2265",
    ];

    const endIndex = next == null ? currentNode.children.length : next;
    let startIndex = endIndex - 1;
    while (startIndex > 0) {
        const prevChild = currentNode.children[startIndex - 1];
        if (
            prevChild.type === "atom" &&
            splitChars.includes(prevChild.value.char)
        ) {
            break;
        }
        startIndex--;
    }

    const headChildren = currentNode.children.slice(0, startIndex);
    const numeratorChildren = currentNode.children.slice(startIndex, endIndex);
    const tailChildren = currentNode.children.slice(endIndex);

    const newNode: Editor.Node<Editor.Glyph> = {
        id: getId(),
        type: "frac",
        children: [
            {
                id: getId(),
                type: "row",
                children: numeratorChildren,
            },
            {
                id: getId(),
                type: "row",
                children: [],
            },
        ],
    };

    currentNode.children = [...headChildren, newNode, ...tailChildren];

    const index = currentNode.children.indexOf(newNode);
    draft.cursor = {
        path: [...cursor.path, index, DENOMINATOR],
        next: null,
        prev: null,
    };
};

const caret = (currentNode: HasChildren, draft: State): void => {
    const {cursor} = draft;
    const {next} = cursor;

    const nextNode =
        cursor.next != null ? currentNode.children[cursor.next] : null;

    if (cursor.next != null && nextNode && nextNode.type === "subsup") {
        const sub = nextNode.children[0];
        const sup = nextNode.children[1] || {
            id: getId(),
            type: "row",
            children: [],
        };
        nextNode.children = [sub, sup];
        draft.cursor = {
            path: [...cursor.path, cursor.next, 1],
            prev: null,
            next: sup.children.length > 0 ? 0 : null,
        };
        return;
    }
    const sup: Editor.Row<Editor.Glyph> = {
        id: getId(),
        type: "row",
        children: [],
    };
    const newNode: Editor.SubSup<Editor.Glyph> = {
        id: getId(),
        type: "subsup",
        children: [null, sup],
    };

    currentNode.children = insertBeforeChildWithIndex(
        currentNode.children,
        next,
        newNode,
    );

    draft.cursor = {
        path: [
            ...cursor.path,
            cursor.next == null ? currentNode.children.length - 1 : cursor.next,
            1,
        ],
        next: null,
        prev: null,
    };
};

const underscore = (currentNode: HasChildren, draft: State): void => {
    const {cursor} = draft;
    const {next} = cursor;

    const nextNode =
        cursor.next != null ? currentNode.children[cursor.next] : null;

    if (cursor.next != null && nextNode && nextNode.type === "subsup") {
        const sub = nextNode.children[0] || {
            id: getId(),
            type: "row",
            children: [],
        };
        const sup = nextNode.children[1];
        nextNode.children = [sub, sup];
        draft.cursor = {
            path: [...cursor.path, cursor.next, 0],
            prev: null,
            next: firstIndex(sub.children),
        };
        return;
    }
    const sub: Editor.Row<Editor.Glyph> = {
        id: getId(),
        type: "row",
        children: [],
    };
    const newNode: Editor.SubSup<Editor.Glyph> = {
        id: getId(),
        type: "subsup",
        children: [sub, null],
    };

    currentNode.children = insertBeforeChildWithIndex(
        currentNode.children,
        next,
        newNode,
    );

    draft.cursor = {
        path: [
            ...cursor.path,
            cursor.next == null ? currentNode.children.length - 1 : cursor.next,
            0,
        ],
        next: null,
        prev: null,
    };
};

const root = (currentNode: HasChildren, draft: State): void => {
    const {cursor} = draft;
    const {next} = cursor;

    const radicand: Editor.Row<Editor.Glyph> = {
        id: getId(),
        type: "row",
        children: [],
    };
    const newNode: Editor.Root<Editor.Glyph> = {
        id: getId(),
        type: "root",
        children: [radicand, null /* index */],
    };

    currentNode.children = insertBeforeChildWithIndex(
        currentNode.children,
        next,
        newNode,
    );

    const index = currentNode.children.indexOf(newNode);
    draft.cursor = {
        path: [...cursor.path, index],
        next: null,
        prev: null,
    };
};

// TODO: handle inserting parens at the end of a row
const leftParens = (currentNode: HasChildren, draft: State): void => {
    const {cursor} = draft;
    const {next} = cursor;

    const openingParen: Editor.Atom<Editor.Glyph> = {
        id: getId(),
        type: "atom",
        value: {
            kind: "glyph",
            char: "(",
        },
    };
    const closingParen: Editor.Atom<Editor.Glyph> = {
        id: getId(),
        type: "atom",
        value: {
            kind: "glyph",
            char: ")",
            pending: true,
        },
    };
    draft.cursor.next = cursor.next != null ? cursor.next + 1 : null;
    draft.cursor.prev = cursor.prev != null ? cursor.prev + 1 : 0;

    for (let i = draft.cursor.prev; i >= 0; i--) {
        const child = currentNode.children[i];
        // handle a pending open paren to the left
        if (
            child.type === "atom" &&
            child.value.char === "(" &&
            child.value.pending
        ) {
            const newChildren = removeChildWithIndex(currentNode.children, i);
            currentNode.children = insertBeforeChildWithIndex(
                newChildren,
                Math.max(0, draft.cursor.prev - 1),
                openingParen,
            );

            // Move the cursor to the left one again.
            draft.cursor.next =
                cursor.next != null
                    ? cursor.next - 1
                    : currentNode.children.length - 1;
            draft.cursor.prev = cursor.prev != null ? cursor.prev - 1 : null;
            return;
        }
    }

    for (
        let i = Math.max(0, draft.cursor.prev - 1);
        i < currentNode.children.length;
        i++
    ) {
        const child = currentNode.children[i];
        // handle a closing paren to the right
        if (child.type === "atom" && child.value.char === ")") {
            const newChildren = insertBeforeChildWithIndex(
                currentNode.children,
                draft.cursor.prev,
                openingParen,
            );
            currentNode.children = insertBeforeChildWithIndex(
                newChildren,
                i + 1,
                closingParen,
            );
            return;
        }
    }

    // no closing paren to the right
    currentNode.children = [
        ...insertBeforeChildWithIndex(currentNode.children, next, openingParen),
        closingParen,
    ];
};

const rightParens = (currentNode: HasChildren, draft: State): void => {
    const {cursor} = draft;
    const {next} = cursor;

    const openingParen: Editor.Atom<Editor.Glyph> = {
        id: getId(),
        type: "atom",
        value: {
            kind: "glyph",
            char: "(",
            pending: true,
        },
    };
    const closingParen: Editor.Atom<Editor.Glyph> = {
        id: getId(),
        type: "atom",
        value: {
            kind: "glyph",
            char: ")",
        },
    };
    draft.cursor.next = cursor.next != null ? cursor.next + 1 : null;
    draft.cursor.prev = cursor.prev != null ? cursor.prev + 1 : 0;

    // There are three scenarios we have to handle
    // 1: there is no paren to the left
    // 2: there is a paren to the left
    // 3: there is a pending paren to the right

    console.log(`draft.cursor.prev = ${draft.cursor.prev}`);
    for (
        let i = Math.max(0, draft.cursor.prev - 1);
        i < currentNode.children.length;
        i++
    ) {
        console.log(`i = ${i}`);
        const child = currentNode.children[i];
        // handle a pending closing paren to the right
        if (
            child.type === "atom" &&
            child.value.char === ")" &&
            child.value.pending
        ) {
            const newChildren = removeChildWithIndex(currentNode.children, i);
            currentNode.children = insertBeforeChildWithIndex(
                newChildren,
                Math.min(newChildren.length, draft.cursor.prev),
                closingParen,
            );
            if (draft.cursor.prev > currentNode.children.length - 1) {
                draft.cursor.prev = currentNode.children.length - 1;
                draft.cursor.next = null;
            }
            return;
        }
    }

    // for (let i = draft.cursor.prev; i >= 0; i--) {
    //     const child = currentNode.children[i];
    //     // handle a opening paren to the left
    //     if (child.type === "atom" && child.value.char === "(") {
    //         const newChildren = insertBeforeChildWithIndex(
    //             currentNode.children,
    //             draft.cursor.prev,
    //             closingParen,
    //         );
    //         currentNode.children = insertBeforeChildWithIndex(
    //             newChildren,
    //             i + 1,
    //             openingParen,
    //         );
    //         return;
    //     }
    // }

    // no closing paren to the right
    currentNode.children = [
        openingParen,
        ...insertBeforeChildWithIndex(currentNode.children, next, closingParen),
    ];

    // Advance the cursor by one again.
    draft.cursor.next = cursor.next != null ? cursor.next + 1 : null;
    draft.cursor.prev = cursor.prev != null ? cursor.prev + 1 : 0;
};

type Action = {type: string};

// TODO: check if cursor is valid before process action
// TODO: insert both left/right parens when the user presses '('
const reducer = (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        const {cursor, math} = draft;
        const currentNode = Editor.nodeAtPath(math, cursor.path);

        if (!hasChildren(currentNode)) {
            throw new Error(
                "currentNode can't be a glyph, fraction, sup, or sub",
            );
        }

        let newNode: Editor.Node<Editor.Glyph>;
        const {next} = cursor;

        switch (action.type) {
            case "ArrowLeft": {
                draft.cursor = moveLeft(currentNode, draft);
                return;
            }
            case "ArrowRight": {
                draft.cursor = moveRight(currentNode, draft);
                return;
            }
            case "Backspace": {
                backspace(currentNode, draft);
                return;
            }
            case "/": {
                slash(currentNode, draft);
                return;
            }
            case "^": {
                caret(currentNode, draft);
                return;
            }
            case "_": {
                underscore(currentNode, draft);
                return;
            }
            case "\u221A": {
                root(currentNode, draft);
                return;
            }
            case "(": {
                leftParens(currentNode, draft);
                return;
            }
            case ")": {
                rightParens(currentNode, draft);
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
                draft.cursor.next =
                    cursor.next != null ? cursor.next + 1 : null;
                draft.cursor.prev = cursor.prev != null ? cursor.prev + 1 : 0;
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

        currentNode.children = insertBeforeChildWithIndex(
            currentNode.children,
            next,
            newNode,
        );
    });
};

export default reducer;
