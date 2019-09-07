// @flow
import {getId} from "./unique-id";

export type Row<T> = {|
    id: number,
    type: "row",
    children: Node<T>[],
|};

export type SubSup<T> = {|
    id: number,
    type: "subsup",
    sub?: Row<T>,
    sup?: Row<T>,
|};

export type Frac<T> = {|
    id: number,
    type: "frac",
    numerator: Row<T>,
    denominator: Row<T>,
|};

// TODO: allow different types of parens
export type Parens<T> = {|
    id: number,
    type: "parens",
    children: Node<T>[],
|};

export type Atom<T> = {|
    id: number,
    type: "atom",
    value: T,
|};

export type Node<T> = Row<T> | SubSup<T> | Frac<T> | Parens<T> | Atom<T>;

export type HasChildren<T> = Row<T> | Parens<T>;

export function row<T>(children: Node<T>[]): Row<T> {
    return {
        id: getId(),
        type: "row",
        children,
    };
}

export function subsup<T>(sub?: Row<T>, sup?: Row<T>): SubSup<T> {
    return {
        id: getId(),
        type: "subsup",
        sub,
        sup,
    };
}

export function frac<T>(numerator: Row<T>, denominator: Row<T>): Frac<T> {
    return {
        id: getId(),
        type: "frac",
        numerator,
        denominator,
    };
}

export function parens<T>(children: Node<T>[]): Parens<T> {
    return {
        id: getId(),
        type: "parens",
        children,
    };
}

export type Glyph = {|
    kind: "glyph",
    char: string,
|};

export const glyph = (char: string): Atom<Glyph> => ({
    id: getId(),
    type: "atom",
    value: {kind: "glyph", char},
});

export function findNode<T>(root: Node<T>, id: number): Node<T> | void {
    // base case
    if (root.id === id) {
        return root;
    }

    switch (root.type) {
        case "frac":
            return [root.denominator, root.numerator]
                .map(node => findNode(node, id))
                .find(Boolean);
        case "subsup":
            return [root.sub, root.sup]
                .filter(Boolean)
                .map(node => findNode(node, id))
                .find(Boolean);
        case "row":
            return root.children.map(node => findNode(node, id)).find(Boolean);
        default:
            // remaining nodes are leaf nodes
            return undefined;
    }
}

export function findNode_<T>(root: Node<T>, id: number): Node<T> {
    const result = findNode(root, id);
    if (!result) {
        throw new Error(`node with id ${id} could not be found`);
    }
    return result;
}

export type Cursor = {|
    path: $ReadOnlyArray<number>,
    // these are indices of the node inside the parent
    prev: ?number,
    next: ?number,
|};
