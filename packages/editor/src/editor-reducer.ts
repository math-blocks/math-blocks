import produce from "immer";

import * as Editor from "./editor";
import {getId} from "@math-blocks/base";

export type State = {
    math: Editor.Row<Editor.Glyph>;
    cursor: Editor.Cursor;
    selectionStart?: Editor.Cursor;
};

const {row, glyph, frac, subsup} = Editor;

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
    selectionStart: undefined,
};

type Identifiable = {readonly id: number};

type HasChildren = Editor.Row<Editor.Glyph>;

const hasChildren = (node: Editor.Node<Editor.Glyph>): node is HasChildren => {
    return node.type === "row";
};

const isGlyph = (
    node: Editor.Node<Editor.Glyph>,
    char: string,
): node is Editor.Atom<Editor.Glyph> =>
    node.type === "atom" && node.value.char == char;

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

const getSelectionBounds = (
    cursor: Editor.Cursor,
    selectionStart: Editor.Cursor,
): {prev: number | null; next: number | null} => {
    const next =
        selectionStart.path.length > cursor.path.length
            ? selectionStart.path[cursor.path.length] + 1
            : selectionStart.next;
    const prev =
        selectionStart.path.length > cursor.path.length
            ? selectionStart.path[cursor.path.length] - 1
            : selectionStart.prev;
    if (next != null && cursor.prev != null && next <= cursor.prev + 1) {
        return {
            prev: prev,
            next: cursor.next,
        };
    } else {
        return {
            prev: cursor.prev,
            next: next,
        };
    }
};

const selectionSplit = (
    currentNode: HasChildren,
    cursor: Editor.Cursor,
    selectionStart: Editor.Cursor,
): {
    head: Editor.Node<Editor.Glyph>[];
    body: Editor.Node<Editor.Glyph>[];
    tail: Editor.Node<Editor.Glyph>[];
} => {
    const {prev, next} = getSelectionBounds(cursor, selectionStart);

    const startIndex = prev != null ? prev + 1 : 0;
    const endIndex = next == null ? currentNode.children.length : next;

    const head = currentNode.children.slice(0, startIndex);
    const body = currentNode.children.slice(startIndex, endIndex);
    const tail = currentNode.children.slice(endIndex);

    return {
        head,
        body,
        tail,
    };
};

const moveLeft = (
    currentNode: Editor.HasChildren<Editor.Glyph>,
    draft: State,
    selecting?: boolean,
): Editor.Cursor => {
    const {cursor, math} = draft;

    const {children} = currentNode;
    if (cursor.prev != null) {
        const {prev} = cursor;
        const prevNode = getChildWithIndex(currentNode.children, prev);
        if (prevNode && prevNode.type === "root" && !selecting) {
            const radicand = prevNode.children[0];
            return {
                path: [...cursor.path, prev, RADICAND],
                prev: lastIndex(radicand.children),
                next: null,
            };
        } else if (prevNode && prevNode.type === "frac" && !selecting) {
            // enter fraction (denominator)
            const denominator = prevNode.children[1];
            return {
                path: [...cursor.path, prev, 1],
                prev: lastIndex(denominator.children),
                next: null,
            };
        } else if (prevNode && prevNode.type === "subsup" && !selecting) {
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
        }
    }
    return cursor;
};

const moveRight = (
    currentNode: HasChildren,
    draft: State,
    selecting?: boolean,
): Editor.Cursor => {
    const {cursor, math} = draft;
    const {children} = currentNode;
    if (cursor.next != null) {
        const {next} = cursor;
        const nextNode = getChildWithIndex(currentNode.children, next);
        if (nextNode && nextNode.type === "root" && !selecting) {
            const radicand = nextNode.children[0];
            // TODO: handle navigating into the index
            return {
                path: [...cursor.path, next, RADICAND],
                prev: null,
                next: firstIndex(radicand.children),
            };
        } else if (nextNode && nextNode.type === "frac" && !selecting) {
            // enter fraction (numerator)
            const numerator = nextNode.children[0];
            return {
                path: [...cursor.path, next, NUMERATOR],
                prev: null,
                next: firstIndex(numerator.children),
            };
        } else if (nextNode && nextNode.type === "subsup" && !selecting) {
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
        }
    }
    return cursor;
};

const selectionBackspace = (currentNode: HasChildren, draft: State): void => {
    const {cursor, selectionStart} = draft;
    if (!selectionStart) {
        return;
    }

    const {head, tail} = selectionSplit(currentNode, cursor, selectionStart);

    currentNode.children = [...head, ...tail];
    draft.cursor = {
        path: cursor.path,
        prev: head.length == 0 ? null : head.length - 1,
        next: tail.length == 0 ? null : head.length,
    };
    draft.selectionStart = undefined;
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
                            glyph(")", true),
                        );
                        // Skip inserting a ')' at the end of the current row
                        // since we've already inserted a ')' earlier.
                        break blk0;
                    }
                }
                currentNode.children = [...newChildren, glyph(")", true)];
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

const selectionSlash = (currentNode: HasChildren, draft: State): void => {
    const {cursor, selectionStart} = draft;
    if (!selectionStart) {
        return;
    }

    const {head, body, tail} = selectionSplit(
        currentNode,
        cursor,
        selectionStart,
    );

    currentNode.children = [...head, frac(body, []), ...tail];
    draft.cursor = {
        path: [...cursor.path, head.length, DENOMINATOR],
        next: null,
        prev: null,
    };
    draft.selectionStart = undefined;
};

const slash = (currentNode: HasChildren, draft: State): void => {
    const {cursor} = draft;
    const {prev, next} = cursor;

    if (prev === null) {
        currentNode.children = [frac([], []), ...currentNode.children];
        draft.cursor = {
            path: [...cursor.path, 0, NUMERATOR],
            next: null,
            prev: null,
        };
        return;
    }

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
    let startIndex = endIndex;
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

    const head = currentNode.children.slice(0, startIndex);
    const body = currentNode.children.slice(startIndex, endIndex);
    const tail = currentNode.children.slice(endIndex);

    currentNode.children = [...head, frac(body, []), ...tail];
    draft.cursor = {
        path: [
            ...cursor.path,
            head.length,
            body.length === 0 ? NUMERATOR : DENOMINATOR,
        ],
        next: null,
        prev: null,
    };
};

const selectionCaret = (currentNode: HasChildren, draft: State): void => {
    const {cursor, selectionStart} = draft;
    if (!selectionStart) {
        return;
    }

    const {head, body, tail} = selectionSplit(
        currentNode,
        cursor,
        selectionStart,
    );

    currentNode.children = [...head, subsup(undefined, body), ...tail];
    draft.cursor = {
        path: [...cursor.path, head.length, SUP],
        next: null,
        prev: body.length > 0 ? body.length - 1 : null,
    };
    draft.selectionStart = undefined;
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

const selectionUnderscore = (currentNode: HasChildren, draft: State): void => {
    const {cursor, selectionStart} = draft;
    if (!selectionStart) {
        return;
    }

    const {head, body, tail} = selectionSplit(
        currentNode,
        cursor,
        selectionStart,
    );

    currentNode.children = [...head, subsup(body, undefined), ...tail];
    draft.cursor = {
        path: [...cursor.path, head.length, SUB],
        next: null,
        prev: body.length > 0 ? body.length - 1 : null,
    };
    draft.selectionStart = undefined;
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

const selectionRoot = (currentNode: HasChildren, draft: State): void => {
    const {cursor, selectionStart} = draft;
    if (!selectionStart) {
        return;
    }

    const {head, body, tail} = selectionSplit(
        currentNode,
        cursor,
        selectionStart,
    );

    currentNode.children = [...head, Editor.root(body, null), ...tail];
    draft.cursor = {
        path: [...cursor.path, head.length, RADICAND],
        next: null,
        prev: body.length > 0 ? body.length - 1 : null,
    };
    draft.selectionStart = undefined;
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
        path: [...cursor.path, index, RADICAND],
        next: null,
        prev: null,
    };
};

const insertChar = (
    currentNode: HasChildren,
    draft: State,
    char: string,
): void => {
    const newNode = glyph(char);
    const {cursor, selectionStart} = draft;

    if (selectionStart) {
        const {head, tail} = selectionSplit(
            currentNode,
            cursor,
            selectionStart,
        );

        currentNode.children = [...head, newNode, ...tail];
        const index = head.length;
        draft.cursor = {
            path: [...cursor.path],
            next: index < currentNode.children.length - 1 ? index + 1 : null,
            prev: index,
        };
        draft.selectionStart = undefined;
    } else {
        const {prev, next} = cursor;

        // If there's a pending ')' before the insertion point, complete it
        if (prev != null) {
            const prevNode = currentNode.children[prev];
            if (isGlyph(prevNode, ")")) {
                prevNode.value.pending = undefined;
            }
        }
        // If there's a pending '(' after the insertion point, complete it
        if (next != null) {
            const nextNode = currentNode.children[next];
            if (isGlyph(nextNode, "(")) {
                nextNode.value.pending = undefined;
            }
        }

        draft.cursor.next = cursor.next != null ? cursor.next + 1 : null;
        draft.cursor.prev = cursor.prev != null ? cursor.prev + 1 : 0;

        currentNode.children = insertBeforeChildWithIndex(
            currentNode.children,
            next,
            newNode,
        );
    }
};

enum Paren {
    Left,
    Right,
}

const selectionParens = (
    currentNode: HasChildren,
    draft: State,
    paren: Paren,
): void => {
    const {cursor, selectionStart} = draft;
    if (!selectionStart) {
        return;
    }

    const {head, body, tail} = selectionSplit(
        currentNode,
        cursor,
        selectionStart,
    );

    currentNode.children = [...head, glyph("("), ...body, glyph(")"), ...tail];

    let newNext: number | null =
        paren == Paren.Left ? head.length + 1 : head.length + body.length + 2;

    // We only need to do this check for newNext since the cursor
    // will appear after the parens.  If the parens are at the end
    // of the row then newNext should be null.
    if (newNext > currentNode.children.length - 1) {
        newNext = null;
    }

    const newPrev =
        paren == Paren.Left ? head.length : head.length + body.length + 1;

    draft.cursor = {
        path: cursor.path,
        next: newNext,
        prev: newPrev,
    };
    draft.selectionStart = undefined;
};

const leftParens = (currentNode: HasChildren, draft: State): void => {
    const {cursor} = draft;
    const {next} = cursor;

    const openingParen = glyph("(");
    const closingParen = glyph(")", true);

    draft.cursor.next = cursor.next != null ? cursor.next + 1 : null;
    draft.cursor.prev = cursor.prev != null ? cursor.prev + 1 : 0;

    for (let i = Math.max(0, draft.cursor.prev - 1); i >= 0; i--) {
        const child = currentNode.children[i];
        // handle a pending open paren to the left
        if (isGlyph(child, "(")) {
            // if we run into a non-pending left paren then we need
            // to break and insert a new paren pair
            if (!child.value.pending) {
                break;
            }
            const newChildren = removeChildWithIndex(currentNode.children, i);
            currentNode.children = insertBeforeChildWithIndex(
                newChildren,
                Math.max(0, draft.cursor.prev - 1),
                openingParen,
            );

            const prev = Math.max(0, draft.cursor.prev - 1);
            draft.cursor.prev = prev;
            draft.cursor.next = prev + 1;
            return;
        }
    }

    // The counter keeps track of how many un-matched parens there are
    // If the value is negative then there are that many more '(' than
    // ')'.  If it's positive there are more ')'.  If the count is 0
    // then the count is equal.
    let count = 0;

    for (
        let i = Math.max(0, draft.cursor.prev);
        i < currentNode.children.length;
        i++
    ) {
        const child = currentNode.children[i];
        // handle a closing paren to the right
        if (isGlyph(child, ")") && count >= 0) {
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
        if (isGlyph(child, "(")) {
            count--;
        } else if (isGlyph(child, ")")) {
            count++;
        }
    }

    if (draft.cursor.next == null) {
        draft.cursor.next = draft.cursor.prev + 1;
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

    const openingParen = glyph("(", true);
    const closingParen = glyph(")");

    draft.cursor.next = cursor.next != null ? cursor.next + 1 : null;
    draft.cursor.prev = cursor.prev != null ? cursor.prev + 1 : 0;

    for (
        let i = Math.max(0, draft.cursor.prev - 1);
        i < currentNode.children.length;
        i++
    ) {
        const child = currentNode.children[i];
        // handle a pending closing paren to the right
        if (isGlyph(child, ")")) {
            // if we run into a non-pending left paren then we need
            // to break and insert a new paren pair
            if (!child.value.pending) {
                break;
            }
            const newChildren = removeChildWithIndex(currentNode.children, i);
            currentNode.children = insertBeforeChildWithIndex(
                newChildren,
                Math.min(newChildren.length, draft.cursor.prev),
                closingParen,
            );
            if (draft.cursor.prev >= currentNode.children.length - 1) {
                draft.cursor.prev = currentNode.children.length - 1;
                draft.cursor.next = null;
            }
            return;
        }
    }

    // The counter keeps track of how many un-matched parens there are
    // If the value is negative then there are that many more ')' than
    // '('.  If it's positive there are more '('.  If the count is 0
    // then the count is equal.
    let count = 0;

    for (let i = Math.max(0, draft.cursor.prev - 1); i >= 0; i--) {
        const child = currentNode.children[i];
        // handle a opening paren to the left
        if (isGlyph(child, "(") && count >= 0) {
            const newChildren = insertBeforeChildWithIndex(
                currentNode.children,
                draft.cursor.prev,
                closingParen,
            );
            currentNode.children = insertBeforeChildWithIndex(
                newChildren,
                i + 1,
                openingParen,
            );

            // move the cursor one to right again
            draft.cursor.next = cursor.next != null ? cursor.next + 1 : null;
            draft.cursor.prev = cursor.prev != null ? cursor.prev + 1 : 0;
            return;
        }

        if (isGlyph(child, ")")) {
            count--;
        } else if (isGlyph(child, "(")) {
            count++;
        }
    }

    // no closing paren to the right
    currentNode.children = [
        openingParen,
        ...insertBeforeChildWithIndex(currentNode.children, next, closingParen),
    ];

    // Advance the cursor by one again.
    draft.cursor.next = cursor.next != null ? cursor.next + 1 : null;
    draft.cursor.prev = cursor.prev != null ? cursor.prev + 1 : 0;
};

type Action = {type: string; shift?: boolean};

// TODO: check if cursor is valid before process action
const reducer = (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        const {cursor, math} = draft;
        const currentNode = Editor.nodeAtPath(math, cursor.path);

        if (!hasChildren(currentNode)) {
            throw new Error(
                "currentNode can't be a glyph, fraction, sup, or sub",
            );
        }

        switch (action.type) {
            case "ArrowLeft": {
                if (!action.shift && draft.selectionStart) {
                    const {selectionStart} = draft;
                    const next =
                        selectionStart.path.length > cursor.path.length
                            ? selectionStart.path[cursor.path.length]
                            : selectionStart.next;
                    const prev =
                        selectionStart.path.length > cursor.path.length
                            ? selectionStart.path[cursor.path.length] - 1
                            : selectionStart.prev;
                    if (prev == null || (cursor.prev && prev < cursor.prev)) {
                        draft.cursor = {
                            ...draft.cursor,
                            prev,
                            next,
                        };
                    }
                    draft.selectionStart = undefined;
                } else {
                    if (action.shift && !draft.selectionStart) {
                        draft.selectionStart = {...draft.cursor};
                    }
                    draft.cursor = moveLeft(currentNode, draft, action.shift);
                }
                return;
            }
            case "ArrowRight": {
                if (!action.shift && draft.selectionStart) {
                    const {selectionStart} = draft;
                    const next =
                        selectionStart.path.length > cursor.path.length
                            ? selectionStart.path[cursor.path.length] + 1
                            : selectionStart.next;
                    const prev =
                        selectionStart.path.length > cursor.path.length
                            ? selectionStart.path[cursor.path.length]
                            : selectionStart.prev;
                    if (next == null || (cursor.next && next > cursor.next)) {
                        draft.cursor = {
                            ...draft.cursor,
                            prev,
                            next,
                        };
                    }
                    draft.selectionStart = undefined;
                } else {
                    if (action.shift && !draft.selectionStart) {
                        draft.selectionStart = {...draft.cursor};
                    }
                    draft.cursor = moveRight(currentNode, draft, action.shift);
                }
                return;
            }
            case "Backspace": {
                if (draft.selectionStart) {
                    selectionBackspace(currentNode, draft);
                } else {
                    backspace(currentNode, draft);
                }
                return;
            }
            case "/": {
                if (draft.selectionStart) {
                    selectionSlash(currentNode, draft);
                } else {
                    slash(currentNode, draft);
                }
                return;
            }
            case "^": {
                if (draft.selectionStart) {
                    selectionCaret(currentNode, draft);
                } else {
                    caret(currentNode, draft);
                }
                return;
            }
            case "_": {
                if (draft.selectionStart) {
                    selectionUnderscore(currentNode, draft);
                } else {
                    underscore(currentNode, draft);
                }
                return;
            }
            case "\u221A": {
                if (draft.selectionStart) {
                    selectionRoot(currentNode, draft);
                } else {
                    root(currentNode, draft);
                }
                return;
            }
            case "(": {
                if (draft.selectionStart) {
                    selectionParens(currentNode, draft, Paren.Left);
                } else {
                    leftParens(currentNode, draft);
                }
                return;
            }
            case ")": {
                if (draft.selectionStart) {
                    selectionParens(currentNode, draft, Paren.Right);
                } else {
                    rightParens(currentNode, draft);
                }
                return;
            }
            default: {
                if (
                    action.type.length === 1 &&
                    action.type.charCodeAt(0) >= 32
                ) {
                    let char = action.type;
                    if (char === "*") {
                        char = "\u00B7";
                    } else if (char === "-") {
                        char = "\u2212";
                    }
                    insertChar(currentNode, draft, char);
                    break;
                }
                return;
            }
        }
    });
};

export default reducer;
