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

// TODO: have a separate function that checks recursively
// TODO: provide a rational
const assert_valid = (node: Semantic.Expression) => {
    switch (node.type) {
        case "mul":
        case "add": {
            if (node.args.length < 2) {
                throw new Error(
                    `${node} is not valid because it has less than two args`,
                );
            }
        }
    }
};

// TODO: make Reasons more structural in the future
// type Reason = {
//     type: "commuative" | "associative" | "distributive",
//     nodes: Semantic.Expression[],
// };
type Reason = string;

// TODO: instead of defining this in code, we could have a JSON file that
// defines the properties of different operations, e.g.
// We can also use this file to generaate semantic.js
// TODO: figure out how to link to different properties as data, e.g.
// symmetric property (of equality), reflexive property (of equality), etc.
// Maybe that doesn't make sense becuase the properties are so closely tied
// to the operators.
/**
 * add: {
 *   can_commute: true,
 *   arg_count: [2, Math.infinity],
 *   identity_element: ZERO,
 *   inverse: neg,
 *   ...
 * }
 * neg: {
 *   arg_count: 1,
 *   ...
 * }
 */
const can_commute = (a: Semantic.Expression): boolean %checks =>
    a.type === "add" || a.type === "mul" || a.type === "eq";

const has_args = (a: Semantic.Expression): boolean %checks =>
    a.type === "add" ||
    a.type === "mul" ||
    a.type === "eq" ||
    a.type === "neq" ||
    a.type === "lt" ||
    a.type === "lte" ||
    a.type === "gt" ||
    a.type === "gte";

// TODO: write a function to determine if an equation is true or not
// e.g. 2 = 5 -> false, 5 = 5 -> true

const ZERO = {
    type: "number",
    value: "0",
};

const ONE = {
    type: "number",
    value: "1",
};

const add = (args: Semantic.Expression[]): Semantic.Add => ({
    type: "add",
    args,
});

const mul = (implicit: boolean) => (
    args: Semantic.Expression[],
): Semantic.Mul => ({
    type: "mul",
    implicit,
    args,
});

const rec_compare = (
    a: Semantic.Expression,
    b: Semantic.Expression,
    reasons: Reason[],
): boolean => {
    assert_valid(a);
    assert_valid(b);

    // The nice thing about these checks is that they go both ways, so it's
    // completely reasonable for someone to start with `a` and then go to
    // `a + 0` and then `a + (b - b)` and so on... as well as the reverse
    // We should be able to do something to verify this by auto reversing tests
    // or something like that.
    // The reversability sometimes must be defined, e.g. in the case of a + 0 = a
    if (a.type !== b.type) {
        // TODO: figure out how to de-dupe this and multiplication which also
        // has an identity
        if (a.type === "add") {
            const nonZeroArgs = a.args.filter(arg => !compare(arg, ZERO, []));
            if (nonZeroArgs.length === 1) {
                const areEqual = compare(nonZeroArgs[0], b, reasons);
                if (areEqual) {
                    reasons.push("addition with identity");
                }
                return areEqual;
            }
        }
        if (b.type === "add") {
            const nonZeroArgs = b.args.filter(arg => !compare(arg, ZERO, []));
            if (nonZeroArgs.length === 1) {
                const areEqual = compare(nonZeroArgs[0], a, reasons);
                if (areEqual) {
                    reasons.push("addition with identity");
                }
                return areEqual;
            }
        }
        if (a.type === "mul") {
            const nonOneArgs = a.args.filter(arg => !compare(arg, ONE, []));
            if (nonOneArgs.length === 1) {
                const areEqual = compare(nonOneArgs[0], b, reasons);
                if (areEqual) {
                    reasons.push("multiplication with identity");
                }
                return areEqual;
            }
        }
        if (b.type === "mul") {
            const nonOneArgs = b.args.filter(arg => !compare(arg, ONE, []));
            if (nonOneArgs.length === 1) {
                const areEqual = compare(nonOneArgs[0], a, reasons);
                if (areEqual) {
                    reasons.push("multiplication with identity");
                }
                return areEqual;
            }
        }
        return false;
    }

    // we've now assumed that both types are the same
    if (has_args(a) && has_args(b)) {
        if (a.args.length !== b.args.length) {
            // Addition by zero with more than one non-zero arg.
            // TODO: figure out how to de-dupe this and multiplication which also
            // has an identity
            if (a.type === "add" && b.type === "add") {
                const hasZeroA = a.args.some(arg => compare(arg, ZERO, []));
                const nonZeroArgsA = a.args.filter(
                    arg => !compare(arg, ZERO, []),
                );
                const hasZeroB = b.args.some(arg => compare(arg, ZERO, []));
                const nonZeroArgsB = b.args.filter(
                    arg => !compare(arg, ZERO, []),
                );
                if (hasZeroA || hasZeroB) {
                    const areEqual = compare(
                        add(nonZeroArgsA),
                        add(nonZeroArgsB),
                        reasons,
                    );
                    if (areEqual) {
                        reasons.push("addition with identity");
                    }
                    return areEqual;
                }
            }

            // Multiplication by one with more than one non-one arg.
            // TODO: figure out how to de-dupe this and multiplication which also
            // has an identity
            if (a.type === "mul" && b.type === "mul") {
                const hasOneA = a.args.some(arg => compare(arg, ONE, []));
                const nonOneArgsA = a.args.filter(
                    arg => !compare(arg, ONE, []),
                );
                const hasOneB = b.args.some(arg => compare(arg, ONE, []));
                const nonOneArgsB = b.args.filter(
                    arg => !compare(arg, ONE, []),
                );
                if (hasOneA || hasOneB) {
                    const areEqual = compare(
                        mul(a.implicit)(nonOneArgsA),
                        mul(b.implicit)(nonOneArgsB),
                        reasons,
                    );
                    if (areEqual) {
                        reasons.push("multiplication with identity");
                    }
                    return areEqual;
                }
            }

            return false;
        }

        const areEqual = a.args.every(ai => {
            return b.args.some(bi => {
                return compare(ai, bi, []);
            });
        });

        // If the expressions aren't equal
        if (!areEqual) {
            return false;
        }

        // We allow any reordering of args, but we may want to restrict to
        // pair-wise reorderings in the future.
        // Not everything that has args can commute, for instance 3 > 1 is not
        // the same as 1 > 3 (the first is true, the latter is not)
        if (can_commute(a) && can_commute(b)) {
            const pairs = zip(a.args, b.args);
            const commutative = pairs.some(pair => !compare(...pair, reasons));

            // The rationale for equality is different
            if (commutative) {
                if (a.type === "eq") {
                    reasons.push("symmetric property");
                } else {
                    reasons.push("commutative property");
                }
            }
        }

        return true;
    } else if (a.type === "number" && b.type === "number") {
        return a.value === b.value;
    } else if (a.type === "identifier" && b.type === "identifier") {
        return a.name === b.name;
    } else {
        return false;
    }
};

export const compare = rec_compare;
