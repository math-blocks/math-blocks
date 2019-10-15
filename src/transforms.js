// @flow
import * as Semantic from "./semantic.js";

// A node is different if its children are different or if its type is different
// How to do a parallel traversal

// 1 = #/#

const zip = <A, B>(a: A[], b: B[]): [A, B][] => {
    const result = [];
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        result.push([a[i], b[i]]);
    }
    return result;
};

// There could be something like: (1 + 2) + (a + b) -> (2 + 1) + (b + a)
// How do we keep track of multiple changes to an expression tree
// What about something like: (1 + 2) + (a + b) -> (b + a) + (2 + 1) ?

// What if whenever we spot a difference, we check in our library of possible
// rules and if we match one of our rules then compare actually return true

export const compare = (
    a: Semantic.Expression,
    b: Semantic.Expression,
): boolean => {
    if (a.type === "add" && b.type === "add") {
        if (a.args.length !== b.args.length) {
            return false;
        }
        // instead of checking if at least some of the args are different, we want
        // check if they're the same but in a different order
        // const result = zip(a.args, b.args).some(pair =>
        //     compare(...pair, nodes),
        // );
        // nodes.push([a, b]);
        // return result;

        // If the length is greater than 2 then we need to do pairwise comparison, e.g.
        // (0, 1), (1, 2), ..., (n - 1, n)
        if (a.args.length === 2 && b.args.length === 2) {
            if (
                compare(a.args[0], b.args[0]) &&
                compare(a.args[1], b.args[1])
            ) {
                return true;
            } else if (
                compare(b.args[0], a.args[1]) &&
                compare(b.args[1], a.args[0])
            ) {
                // reason: commutative rule
                // evidence: [a, b];
                return true;
            }
            return false;
        } else {
            throw new Error("we don't handle more than two args");
        }
    } else if (a.type === "number" && b.type === "number") {
        return a.value === b.value;
    } else if (a.type === "identifier" && b.type === "identifier") {
        return a.name === b.name;
    } else {
        return false;
    }
};

const isCommutative = (before, after) => {
    // recursively check if there are any differences
    // once a difference is located, determine if the difference matches the transform we're looking for
};

// ... + a + b + ... -> ... + b + a + ...
