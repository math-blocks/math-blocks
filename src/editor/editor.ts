import {getId} from "../unique-id";

export type Row<T, ID = number> = {
    id: ID;
    type: "row";
    children: NodeWithID<T, ID>[];
};

export type SubSup<T, ID = number> = {
    id: ID;
    type: "subsup";
    children: [Row<T, ID> | null, Row<T, ID> | null]; // sub, sup
};

export type Frac<T, ID = number> = {
    id: ID;
    type: "frac";
    children: [Row<T, ID>, Row<T, ID>]; // numerator, denominator
};

// TODO: allow different types of parens
export type Parens<T, ID = number> = {
    id: ID;
    type: "parens";
    children: NodeWithID<T, ID>[];
};

export type Root<T, ID = number> = {
    id: ID;
    type: "root";
    children: [Row<T, ID>, Row<T, ID> | null]; // radicand, index
};

export type Atom<T, ID = number> = {
    id: ID;
    type: "atom";
    value: T;
};

export type NodeWithID<T, ID> =
    | Row<T, ID>
    | SubSup<T, ID>
    | Frac<T, ID>
    | Parens<T, ID>
    | Root<T, ID>
    | Atom<T, ID>;

export type Node<T> =
    | Row<T, number>
    | SubSup<T, number>
    | Frac<T, number>
    | Parens<T, number>
    | Root<T, number>
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

// It would be nice if we could provide defaults to parameterized functions
// We'd need type-classes for that but thye don't exist in JavaScript.
export function root<T>(
    arg: Node<T>[],
    index: Node<T>[] | null,
): Root<T, number> {
    return {
        id: getId(),
        type: "root",
        children: [row(arg), index ? row(index) : null],
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
    kind: "glyph";
    char: string;
    pending?: boolean;
};

export const glyph = (char: string): Atom<Glyph, number> =>
    atom({kind: "glyph", char});

export function stripIDs<T>(root: Node<T>): NodeWithID<T, void> {
    switch (root.type) {
        case "frac": {
            return {
                type: "frac",
                children: [
                    {
                        type: "row",
                        children: root.children[0].children.map<
                            NodeWithID<T, void>
                        >(stripIDs),
                        id: undefined,
                    },
                    {
                        type: "row",
                        children: root.children[1].children.map<
                            NodeWithID<T, void>
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
        case "root": {
            const result: Root<T, void> = {
                type: "root",
                children: [
                    {
                        type: "row",
                        children: root.children[0].children.map<
                            NodeWithID<T, void>
                        >(stripIDs),
                        id: undefined,
                    },
                    root.children[1]
                        ? {
                              type: "row",
                              children: root.children[1].children.map<
                                  NodeWithID<T, void>
                              >(stripIDs),
                              id: undefined,
                          }
                        : null,
                ],
                id: undefined,
            };
            return result;
        }
        default:
            throw new Error("foo");

        // (root: empty);
    }
}

export function nodeAtPath<T>(
    root: Node<T>,
    path: ReadonlyArray<number>,
): Node<T> {
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

export type Cursor = {
    path: number[];
    // these are indices of the node inside the parent
    prev: number | null;
    next: number | null;
};
