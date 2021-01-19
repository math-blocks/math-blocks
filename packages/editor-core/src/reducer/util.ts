import * as builders from "../builders";
import * as types from "../types";

import {State} from "./row-reducer";

export const isEqual = (a: types.Node, b: types.Node): boolean => {
    if (a.type !== b.type) {
        return false;
    } else if (a.type === "atom" && b.type === "atom") {
        return a.value.char === b.value.char;
    } else if (a.type === "frac" && b.type === "frac") {
        const [aNum, aDen] = a.children;
        const [bNum, bDen] = b.children;
        return isEqual(aNum, bNum) && isEqual(aDen, bDen);
    } else if (a.type === "root" && b.type === "root") {
        const [aRad, aIndex] = a.children;
        const [bRad, bIndex] = b.children;
        if (isEqual(aRad, bRad)) {
            return aIndex != null && bIndex != null
                ? isEqual(aIndex, bIndex)
                : aIndex === bIndex;
        } else {
            return false;
        }
    } else if (a.type === "subsup" && b.type === "subsup") {
        const [aSub, aSup] = a.children;
        const [bSub, bSup] = b.children;

        if (aSub == null || bSub == null) {
            if (aSub != bSub) {
                return false;
            }
        }
        if (aSup == null || bSup == null) {
            if (aSup != bSup) {
                return false;
            }
        }
        if (aSub != null && bSub != null) {
            if (!isEqual(aSub, bSub)) {
                return false;
            }
        }
        if (aSup != null && bSup != null) {
            if (!isEqual(aSup, bSup)) {
                return false;
            }
        }

        return true;
    } else if (a.type === "row" && b.type === "row") {
        if (a.children.length !== b.children.length) {
            return false;
        }
        return a.children.every((aChild, index) =>
            isEqual(aChild, b.children[index]),
        );
    } else {
        return false;
    }
};

export type ID = {
    id: number;
};

export const row = (str: string): types.Row =>
    builders.row(
        str.split("").map((glyph) => {
            if (glyph === "-") {
                return builders.glyph("\u2212");
            }
            return builders.glyph(glyph);
        }),
    );

export const frac = (num: string, den: string): types.Frac =>
    builders.frac(
        num.split("").map((glyph) => builders.glyph(glyph)),
        den.split("").map((glyph) => builders.glyph(glyph)),
    );

export const sqrt = (radicand: string): types.Root =>
    builders.root(
        radicand.split("").map((glyph) => builders.glyph(glyph)),
        null,
    );

export const root = (radicand: string, index: string): types.Root =>
    builders.root(
        radicand.split("").map((glyph) => builders.glyph(glyph)),
        index.split("").map((glyph) => builders.glyph(glyph)),
    );

export const sup = (sup: string): types.SubSup =>
    builders.subsup(
        undefined,
        sup.split("").map((glyph) => builders.glyph(glyph)),
    );

export const sub = (sub: string): types.SubSup =>
    builders.subsup(
        sub.split("").map((glyph) => builders.glyph(glyph)),
        undefined,
    );

export const subsup = (sub: string, sup: string): types.SubSup =>
    builders.subsup(
        sub.split("").map((glyph) => builders.glyph(glyph)),
        sup.split("").map((glyph) => builders.glyph(glyph)),
    );

export type LayoutCursor = {
    parent: number;
    prev: number;
    next: number;
    selection: boolean;
};

// Maybe we should return undefined if there isn't a node at the given path.
export function nodeAtPath(
    root: types.Node,
    path: readonly number[],
): types.Node {
    if (path.length === 0) {
        return root;
    } else {
        switch (root.type) {
            case "atom":
                throw new Error("invalid path");
            case "subsup": {
                const [head, ...tail] = path;
                if (head > 1) {
                    throw new Error("invalid path");
                }
                const headChild = root.children[head];
                if (!headChild) {
                    throw new Error("invalid path");
                }
                return nodeAtPath(headChild, tail);
            }
            case "limits": {
                const [head, ...tail] = path;
                if (head > 1) {
                    throw new Error("invalid path");
                }
                const headChild = root.children[head];
                if (!headChild) {
                    throw new Error("invalid path");
                }
                return nodeAtPath(headChild, tail);
            }
            case "root": {
                const [head, ...tail] = path;
                if (head > 1) {
                    throw new Error("invalid path");
                }
                const headChild = root.children[head];
                if (!headChild) {
                    throw new Error("invalid path");
                }
                return nodeAtPath(headChild, tail);
            }
            default: {
                const [head, ...tail] = path;
                return nodeAtPath(root.children[head], tail);
            }
        }
    }
}

export function pathForNode(
    root: types.Node,
    node: types.Node,
    path: readonly number[] = [],
): readonly number[] | null {
    if (node === root) {
        return path;
    } else {
        switch (root.type) {
            case "atom":
                return null;
            default: {
                for (let i = 0; i < root.children.length; i++) {
                    const child = root.children[i];
                    if (child) {
                        const result = pathForNode(child, node, [...path, i]);
                        if (result) {
                            return result;
                        }
                    }
                }
                return null;
            }
        }
    }
}

export const isPrefixArray = <T>(
    prefix: readonly T[],
    array: readonly T[],
): boolean => {
    if (prefix.length > array.length) {
        return false;
    }
    return prefix.every((value, index) => value === array[index]);
};

// TODO: dedupe with react/utils.ts
export const layoutCursorFromState = (state: State): LayoutCursor => {
    const {math, cursor, selectionStart} = state;
    const parentNode = nodeAtPath(math, cursor.path);

    let result = {
        parent: parentNode.id,
        prev: cursor.prev,
        next: cursor.next,
        selection: false,
    };

    if (selectionStart) {
        if (parentNode.type !== "row") {
            throw new Error("selection container isn't a row");
        }

        // Set prev/next to the node at the same level as the cursor
        // that contains the selectionStart or use the selectionStart
        // if it's at the same level as the cursor.
        let next =
            selectionStart.path.length > cursor.path.length
                ? selectionStart.path[cursor.path.length] + 1
                : selectionStart.next;
        let prev =
            selectionStart.path.length > cursor.path.length
                ? selectionStart.path[cursor.path.length] - 1
                : selectionStart.prev;

        // Use the cursor's next if it comes after next.
        if (
            next !== Infinity &&
            cursor.next !== Infinity &&
            cursor.next > next
        ) {
            next = cursor.next;
        } else if (cursor.next === Infinity) {
            next = cursor.next;
        }

        // Use the cursor's prev if it comes before prev.
        if (
            prev !== -Infinity &&
            cursor.prev !== -Infinity &&
            cursor.prev < prev
        ) {
            prev = cursor.prev;
        } else if (cursor.prev === -Infinity) {
            prev = cursor.prev;
        }

        // Set selection to true if there's a node between the prev and
        // next.
        let selection = false;
        if (next !== Infinity && prev !== -Infinity && next - prev > 1) {
            selection = true;
        } else if (next !== Infinity && prev === -Infinity && next > 0) {
            selection = true;
        } else if (
            next === Infinity &&
            prev !== -Infinity &&
            prev < parentNode.children.length - 1
        ) {
            selection = true;
        } else if (
            next === Infinity &&
            prev === -Infinity &&
            parentNode.children.length > 0
        ) {
            selection = true;
        }

        result = {
            parent: parentNode.id,
            prev,
            next,
            selection,
        };
    }

    return result;
};

export type Identifiable = {readonly id: number};

export type HasChildren = types.Row;

export const hasChildren = (node: types.Node): node is HasChildren => {
    return node.type === "row";
};

export type HasGrandchildren =
    | types.Frac
    | types.Root
    | types.SubSup
    | types.Limits;

export const hasGrandchildren = (
    node: types.Node,
): node is HasGrandchildren => {
    return (
        node.type === "frac" ||
        node.type === "root" ||
        node.type === "subsup" ||
        node.type === "limits"
    );
};

export const isGlyph = (node: types.Node, char: string): node is types.Atom =>
    node.type === "atom" && node.value.char == char;

export const matchesGlyphs = (
    node: types.Node,
    chars: string[],
): node is types.Atom =>
    node.type === "atom" && chars.includes(node.value.char);

export const nextIndex = (
    children: types.Node[],
    childIndex: number,
): number => {
    if (childIndex === -Infinity) {
        if (children.length === 0) {
            return Infinity;
        }
        return 0;
    }
    return childIndex < children.length - 1 ? childIndex + 1 : Infinity;
};

export const prevIndex = (
    children: types.Node[],
    childIndex: number,
): number => {
    if (childIndex === Infinity) {
        if (children.length === 0) {
            return -Infinity;
        }
        return children.length - 1;
    }
    return childIndex > 0 ? childIndex - 1 : -Infinity;
};

export const removeChildWithIndex = <T extends Identifiable>(
    children: T[],
    index: number,
): T[] => {
    return index === -1
        ? children
        : [...children.slice(0, index), ...children.slice(index + 1)];
};

export const insertBeforeChildWithIndex = <T extends Identifiable>(
    children: T[],
    index: number,
    newChild: T,
): T[] => {
    if (index === Infinity) {
        return [...children, newChild];
    }
    return index === -1
        ? children
        : [...children.slice(0, index), newChild, ...children.slice(index)];
};

export const getSelectionBounds = (
    cursor: types.Cursor,
    selectionStart: types.Cursor,
): {prev: number; next: number} => {
    const next =
        selectionStart.path.length > cursor.path.length
            ? selectionStart.path[cursor.path.length] + 1
            : selectionStart.next;
    const prev =
        selectionStart.path.length > cursor.path.length
            ? selectionStart.path[cursor.path.length] - 1
            : selectionStart.prev;
    if (
        next !== Infinity &&
        cursor.prev !== -Infinity &&
        next <= cursor.prev + 1
    ) {
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

export const selectionSplit = (
    currentNode: HasChildren,
    cursor: types.Cursor,
    selectionStart: types.Cursor,
): {
    head: types.Node[];
    body: types.Node[];
    tail: types.Node[];
} => {
    const {prev, next} = getSelectionBounds(cursor, selectionStart);

    const startIndex = prev !== -Infinity ? prev + 1 : 0;
    const endIndex = next === Infinity ? currentNode.children.length : next;

    const head = currentNode.children.slice(0, startIndex);
    const body = currentNode.children.slice(startIndex, endIndex);
    const tail = currentNode.children.slice(endIndex);

    return {
        head,
        body,
        tail,
    };
};

export enum Paren {
    Left,
    Right,
}

export const selectionParens = (
    currentNode: HasChildren,
    selectionStart: types.Cursor,
    draft: State,
    paren: Paren,
): void => {
    const {cursor} = draft;

    const {head, body, tail} = selectionSplit(
        currentNode,
        cursor,
        selectionStart,
    );

    currentNode.children = [
        ...head,
        builders.glyph("("),
        ...body,
        builders.glyph(")"),
        ...tail,
    ];

    let newNext: number =
        paren == Paren.Left ? head.length + 1 : head.length + body.length + 2;

    // We only need to do this check for newNext since the cursor
    // will appear after the parens.  If the parens are at the end
    // of the row then newNext should be null.
    if (newNext > currentNode.children.length - 1) {
        newNext = Infinity;
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

type Column = {
    nodes: types.Node[];
};

// invariants:
// - always return at least one column
// - return n+1 columns where n is the number of colsep chars in the row
export const rowToColumns = (row: types.Row): Column[] => {
    const result: Column[] = [];

    let column: types.Node[] = [];
    let i = 0;

    while (i < row.children.length) {
        const child = row.children[i];

        const charIsSep =
            child.type === "atom" && child.value.char === "\u0008";

        if (charIsSep) {
            result.push({nodes: column});
            column = [];
        } else {
            column.push(child);
        }

        i++;
    }

    if (column.length === 0) {
        result.push({nodes: column});
    } else {
        result.push({nodes: column});
    }

    return result;
};

export const columnsToRow = (cols: Column[]): types.Row => {
    if (cols.length === 0) {
        throw new Error("expected at least one column");
    }

    const children: types.Node[] = [];
    for (let i = 0; i < cols.length; i++) {
        if (i > 0) {
            children.push(builders.glyph("\u0008"));
        }
        children.push(...cols[i].nodes);
    }

    return {
        id: -1, // TODO: How to we copy the row ids from the old row to the new row?
        type: "row",
        children,
    };
};

// TODO: extend to this to selections
export const cursorInColumns = (
    cols: Column[],
    cursor: types.Cursor,
): {colIndex: number; cursor: types.Cursor} => {
    if (cursor.prev === -Infinity) {
        return {
            colIndex: 0,
            cursor: {
                path: [],
                prev: -Infinity,
                next: cols[0].nodes.length > 0 ? 0 : Infinity,
            },
        };
    }

    if (cursor.next === Infinity) {
        const nodes = cols[cols.length - 1].nodes;
        return {
            colIndex: cols.length - 1,
            cursor: {
                path: [],
                prev: nodes.length > 0 ? nodes.length - 1 : -Infinity,
                next: Infinity,
            },
        };
    }

    let start = 0;
    for (let i = 0; i < cols.length; i++) {
        if (cursor.next < start + cols[i].nodes.length + 1) {
            const nodes = cols[i].nodes;
            return {
                colIndex: i,
                cursor: {
                    path: cursor.path,
                    prev:
                        cursor.prev - start < 0
                            ? -Infinity
                            : cursor.prev - start,
                    next:
                        cursor.next - start < nodes.length
                            ? cursor.next - start
                            : Infinity,
                },
            };
        }

        start += cols[i].nodes.length + 1;
    }

    throw new Error("Invalid cursor for columns");
};

type ColumnCursor = {
    colIndex: number;
    cursor: types.Cursor;
};

export const columnCursorToCursor = (
    colCursor: ColumnCursor,
    cols: Column[],
): types.Cursor => {
    // TODO: implement this for reals
    let start = 0;
    const {cursor, colIndex} = colCursor;
    const row = columnsToRow(cols);

    for (let i = 0; i < cols.length; i++) {
        if (colIndex === i) {
            const prev =
                cursor.prev === -Infinity ? start - 1 : start + cursor.prev;
            const next =
                cursor.next === Infinity
                    ? start + cols[i].nodes.length
                    : start + cursor.next;
            return {
                path: [],
                prev: prev < 0 ? -Infinity : prev,
                next: next > row.children.length - 1 ? Infinity : next,
            };
        }
        start = start + cols[i].nodes.length + 1;
    }

    throw new Error("invalid args");
};