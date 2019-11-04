// @flow
import {getId} from "./unique-id";

export type Row<T, ID = number> = {
    id: ID,
    type: "row",
    children: NodeWithID<T, ID>[],
};

export type SubSup<T, ID = number> = {
    id: ID,
    type: "subsup",
    children: [?Row<T, ID>, ?Row<T, ID>],
};

export type Frac<T, ID = number> = {
    id: ID,
    type: "frac",
    children: [Row<T, ID>, Row<T, ID>], // numerator, denominator
};

// TODO: allow different types of parens
export type Parens<T, ID = number> = {
    id: ID,
    type: "parens",
    children: NodeWithID<T, ID>[],
};

export type Atom<T, ID = number> = {
    id: ID,
    type: "atom",
    value: T,
};

export type NodeWithID<T, ID> =
    | Row<T, ID>
    | SubSup<T, ID>
    | Frac<T, ID>
    | Parens<T, ID>
    | Atom<T, ID>;

export type Node<T> =
    | Row<T, number>
    | SubSup<T, number>
    | Frac<T, number>
    | Parens<T, number>
    | Atom<T, number>;

export type HasChildren<T> = Row<T> | Parens<T>;

export function row<T>(children: Node<T>[]): Row<T, number> {
    return {
        id: getId(),
        type: "row",
        children,
    };
}

export function subsup<T>(sub?: Node<T>[], sup?: Node<T>[]): SubSup<T, number> {
    return {
        id: getId(),
        type: "subsup",
        children: [sub ? row(sub) : null, sup ? row(sup) : null],
    };
}

export function frac<T>(
    numerator: Node<T>[],
    denominator: Node<T>[],
): Frac<T, number> {
    return {
        id: getId(),
        type: "frac",
        children: [row(numerator), row(denominator)],
    };
}

export function parens<T>(children: Node<T>[]): Parens<T, number> {
    return {
        id: getId(),
        type: "parens",
        children,
    };
}

export function atom<T>(value: T): Atom<T, number> {
    return {
        id: getId(),
        type: "atom",
        value,
    };
}

export type Glyph = {
    kind: "glyph",
    char: string,
};

export const glyph = (char: string): Atom<Glyph, number> =>
    atom({kind: "glyph", char});

export function findNode<T>(root: Node<T>, id: number): Node<T> | void {
    // base case
    if (root.id === id) {
        return root;
    }

    switch (root.type) {
        case "subsup":
            return root.children
                .filter(Boolean)
                .map(node => findNode(node, id))
                .find(Boolean);
        case "frac":
        case "parens":
        case "row":
            return root.children.map(node => findNode(node, id)).find(Boolean);
        default:
            // remaining nodes are leaf nodes
            return undefined;
    }
}

export function getPath<T>(root: Node<T>, id: number): Array<number> | void {
    if (root.id === id) {
        return [];
    }

    switch (root.type) {
        case "subsup": {
            for (const child of root.children) {
                if (!child) {
                    continue;
                }
                const path = getPath(child, id);
                if (path) {
                    return [root.id, ...path];
                }
            }
            return undefined;
        }
        case "frac":
        case "parens":
        case "row": {
            for (const child of root.children) {
                const path = getPath(child, id);
                if (path) {
                    return [root.id, ...path];
                }
            }
            return undefined;
        }
    }
}

export function stripIDs<T>(root: Node<T>): NodeWithID<T, void> {
    switch (root.type) {
        case "frac": {
            return {
                type: "frac",
                children: [
                    {
                        type: "row",
                        children: root.children[0].children.map<
                            NodeWithID<T, void>,
                        >(stripIDs),
                        id: undefined,
                    },
                    {
                        type: "row",
                        children: root.children[1].children.map<
                            NodeWithID<T, void>,
                        >(stripIDs),
                        id: undefined,
                    },
                ],
                id: undefined,
            };
        }
        case "subsup": {
            const [sub, sup] = root.children;
            return {
                type: "subsup",
                children: [
                    sub
                        ? {
                              type: "row",
                              children: sub.children.map<NodeWithID<T, void>>(
                                  stripIDs,
                              ),
                              id: undefined,
                          }
                        : null,
                    sup
                        ? {
                              type: "row",
                              children: sup.children.map<NodeWithID<T, void>>(
                                  stripIDs,
                              ),
                              id: undefined,
                          }
                        : sup,
                ],
                id: undefined,
            };
        }
        case "row": {
            const result: Row<T, void> = {
                type: "row",
                children: root.children.map<NodeWithID<T, void>>(stripIDs),
                id: undefined,
            };
            return result;
        }
        case "parens": {
            const result: Parens<T, void> = {
                type: "parens",
                children: root.children.map<NodeWithID<T, void>>(stripIDs),
                id: undefined,
            };
            return result;
        }
        case "atom": {
            const result: Atom<T, void> = {
                type: "atom",
                value: root.value,
                id: undefined,
            };
            return result;
        }
        default:
            throw new Error("foo");
        // (root: empty);
    }
}

export function findNode_<T>(root: Node<T>, id: number): Node<T> {
    const result = findNode(root, id);
    if (!result) {
        throw new Error(`node with id ${id} could not be found`);
    }
    return result;
}

export type Cursor = {
    path: $ReadOnlyArray<number>,
    // these are indices of the node inside the parent
    prev: ?number,
    next: ?number,
};
