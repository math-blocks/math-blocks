import {getId} from "@math-blocks/core";

// param types:
// AT: Atom Type
// EP: Extra Properties
export type Row<AT, EP> = {
    type: "row";
    children: Node<AT, EP>[];
} & EP;

// TODO: collapse SubSup, Frac, and Root since they're very similar
export type SubSup<AT, EP> = {
    type: "subsup";
    children: [Row<AT, EP> | null, Row<AT, EP> | null]; // sub, sup
} & EP;

export type Limits<AT, EP> = {
    type: "limits";
    inner: Node<AT, EP>;
    children: [Row<AT, EP>, Row<AT, EP> | null];
} & EP;

export type Frac<AT, EP> = {
    type: "frac";
    children: [Row<AT, EP>, Row<AT, EP>]; // numerator, denominator
} & EP;

export type Root<AT, EP> = {
    type: "root";
    children: [Row<AT, EP>, Row<AT, EP> | null]; // radicand, index
} & EP;

export type Atom<AT, EP> = {
    type: "atom";
    value: AT;
} & EP;

export type Node<AT, EP = {}> =
    | Row<AT, EP>
    | SubSup<AT, EP>
    | Limits<AT, EP>
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

export function limits<T>(
    inner: Node<T, {id: number}>,
    lower: Node<T, {id: number}>[],
    upper?: Node<T, {id: number}>[],
): Limits<T, {id: number}> {
    return {
        id: getId(),
        type: "limits",
        inner,
        children: [row(lower), upper ? row(upper) : null],
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
        case "limits": {
            const [lower, upper] = root.children;
            return {
                type: "limits",
                inner: stripIDs(root.inner),
                children: [
                    {
                        type: "row",
                        children: lower.children.map(stripIDs),
                    },
                    upper
                        ? {
                              type: "row",
                              children: upper.children.map(stripIDs),
                          }
                        : upper,
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

export type Cursor = {
    path: number[];
    // these are indices of the node inside the parent
    prev: number;
    next: number;
};
