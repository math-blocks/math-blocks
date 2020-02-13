import {getId} from "@math-blocks/core";

// param types:
// AT: Atom Type
// EP: Extra Properties
export type Row<AT, EP> = EP & {
    type: "row";
    children: Node<AT, EP>[];
};

// TODO: collapse SubSup, Frac, and Root since they're very similar
export type SubSup<AT, EP> = EP & {
    type: "subsup";
    children: [Row<AT, EP> | null, Row<AT, EP> | null]; // sub, sup
};

export type Frac<AT, EP> = EP & {
    type: "frac";
    children: [Row<AT, EP>, Row<AT, EP>]; // numerator, denominator
};

export type Root<AT, EP> = EP & {
    type: "root";
    children: [Row<AT, EP>, Row<AT, EP> | null]; // radicand, index
};

export type Atom<AT, EP> = EP & {
    type: "atom";
    value: AT;
};

export type Node<AT, EP = {}> =
    | Row<AT, EP>
    | SubSup<AT, EP>
    | Frac<AT, EP>
    | Root<AT, EP>
    | Atom<AT, EP>;

// The editor nodes need IDs so we can position the cursor relative to
// layout nodes which get their ID from the editor nodes.

export type HasChildren<T, U> = Row<T, U>;

export function row<T>(
    children: Node<T, {id: number}>[],
): Row<T, {id: number}> {
    return {
        id: getId(),
        type: "row",
        children,
    };
}

export function subsup<T>(
    sub?: Node<T, {id: number}>[],
    sup?: Node<T, {id: number}>[],
): SubSup<T, {id: number}> {
    return {
        id: getId(),
        type: "subsup",
        children: [sub ? row(sub) : null, sup ? row(sup) : null],
    };
}

export function frac<T>(
    numerator: Node<T, {id: number}>[],
    denominator: Node<T, {id: number}>[],
): Frac<T, {id: number}> {
    return {
        id: getId(),
        type: "frac",
        children: [row(numerator), row(denominator)],
    };
}

// It would be nice if we could provide defaults to parameterized functions
// We'd need type-classes for that but thye don't exist in JavaScript.
export function root<T>(
    arg: Node<T, {id: number}>[],
    index: Node<T, {id: number}>[] | null,
): Root<T, {id: number}> {
    return {
        id: getId(),
        type: "root",
        children: [row(arg), index ? row(index) : null],
    };
}

export function atom<T>(value: T): Atom<T, {id: number}> {
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

export const glyph = (
    char: string,
    pending?: boolean,
): Atom<Glyph, {id: number}> => atom({kind: "glyph", char, pending});

export function stripIDs<T>(root: Node<T, {id: number}>): Node<T> {
    switch (root.type) {
        case "frac": {
            return {
                type: "frac",
                children: [
                    {
                        type: "row",
                        children: root.children[0].children.map<Node<T>>(
                            stripIDs,
                        ),
                    },
                    {
                        type: "row",
                        children: root.children[1].children.map<Node<T>>(
                            stripIDs,
                        ),
                    },
                ],
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
                              children: sub.children.map(stripIDs),
                          }
                        : null,
                    sup
                        ? {
                              type: "row",
                              children: sup.children.map(stripIDs),
                          }
                        : sup,
                ],
            };
        }
        case "row": {
            return {
                type: "row" as const,
                children: root.children.map(stripIDs),
            };
        }
        case "atom": {
            return {
                type: "atom" as const,
                value: root.value,
            };
        }
        case "root": {
            return {
                type: "root" as const,
                children: [
                    {
                        type: "row",
                        children: root.children[0].children.map(stripIDs),
                    },
                    root.children[1]
                        ? {
                              type: "row",
                              children: root.children[1].children.map(stripIDs),
                          }
                        : null,
                ],
            };
        }
        default:
            throw new Error("foo");

        // (root: empty);
    }
}

export function nodeAtPath<T, U>(
    root: Node<T, U>,
    path: ReadonlyArray<number>,
): Node<T, U> {
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
