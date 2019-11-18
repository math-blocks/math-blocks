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
const assertValid = (node: Semantic.Expression) => {
    switch (node.type) {
        case "mul":
        case "add": {
            if (node.args.length < 2) {
                throw new Error(
                    `${JSON.stringify(
                        node,
                    )} is not valid because it has less than two args`,
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

type HasArgs =
    | Semantic.Add
    | Semantic.Mul
    | Semantic.Eq
    | Semantic.Neq
    | Semantic.Lt
    | Semantic.Lte
    | Semantic.Gt
    | Semantic.Gte;

const hasArgs = (a: Semantic.Expression): boolean %checks =>
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

const implicitMul = mul(true);
const explicitMul = mul(false);

type Result = {|
    equivalent: boolean,
    reasons: Reason[],
|};

const hasIdentity = <T: Semantic.Add | Semantic.Mul>(node: T) =>
    node.args.some(arg => checkStep(arg, ops[node.type].identity).equivalent);

const filterIdentity = <T: Semantic.Add | Semantic.Mul>(node: T) => {
    const {identity, op} = ops[node.type];
    return op(node.args.filter(arg => !checkStep(arg, identity).equivalent));
};

const isSubtraction = (node: Semantic.Expression): boolean %checks =>
    node.type === "neg" && node.subtraction;

// Checks either additive or multiplicative identity.
const check_identity = <T: Semantic.Add | Semantic.Mul>(a: T, b: T): Result => {
    const hasIdentityA = hasIdentity(a);
    const hasIdentityB = hasIdentity(b);
    const nonIdentityArgsA = filterIdentity(a);
    const nonIdentityArgsB = filterIdentity(b);
    if (hasIdentityA || hasIdentityB) {
        const areEqual = checkStep(nonIdentityArgsA, nonIdentityArgsB);
        if (areEqual) {
            const {reason} = ops[a.type];
            return {
                equivalent: true,
                reasons: [reason],
            };
        }
    }
    return {
        equivalent: false,
        reasons: [],
    };
};

const ops: {
    add: {
        identity: Semantic.Number,
        op: (Semantic.Expression[]) => Semantic.Expression,
        reason: string,
    },
    mul: {
        identity: Semantic.Number,
        op: (Semantic.Expression[]) => Semantic.Expression,
        reason: string,
    },
} = {
    add: {
        identity: ZERO,
        op: add,
        // TODO: have a variety of different ways of stating this
        // e.g., "addition with zero"
        reason: "addition with identity",
    },
    mul: {
        identity: ONE,
        op: implicitMul,
        // TODO: have a variety of different ways of stating this
        // e.g., "multiplication by one"
        reason: "multiplication with identity",
    },
};

/**
 * checkArgs will return true if each node has the same args even if the
 * order doesn't match.
 */
const checkArgs = <T: HasArgs>(a: T, b: T): Result => {
    const _reasons = [];
    const equivalent = a.args.every(ai =>
        b.args.some(bi => {
            const {equivalent, reasons} = checkStep(ai, bi);
            if (equivalent) {
                _reasons.push(...reasons);
            }
            return equivalent;
        }),
    );
    return {
        equivalent,
        reasons: _reasons,
    };
};

const checkEquationStep = (a: Semantic.Eq, b: Semantic.Eq): Result => {
    const [lhsA, rhsA] = a.args;
    const [lhsB, rhsB] = b.args;
    if (lhsB.type === rhsB.type) {
        if (lhsB.type === "add" && rhsB.type === "add") {
            const lhsRemainingValues =
                lhsA.type === "add"
                    ? lhsB.args.filter(
                          argB =>
                              !lhsA.args.some(
                                  argA => checkStep(argA, argB).equivalent,
                              ),
                      )
                    : lhsB.args.filter(arg => !checkStep(lhsA, arg).equivalent);

            const rhsRemainingValues =
                rhsA.type === "add"
                    ? rhsB.args.filter(
                          argB =>
                              !rhsA.args.some(
                                  argA => checkStep(argA, argB).equivalent,
                              ),
                      )
                    : rhsB.args.filter(arg => !checkStep(rhsA, arg).equivalent);

            if (
                lhsRemainingValues.length === 1 &&
                rhsRemainingValues.length === 1
            ) {
                const {equivalent, reasons} = checkStep(
                    lhsRemainingValues[0],
                    rhsRemainingValues[0],
                );

                // TODO: do we want to enforce that the thing being added is exactly
                // the same or do we want to allow equivalent expressions?
                if (equivalent && reasons.length === 0) {
                    if (
                        isSubtraction(lhsRemainingValues[0]) &&
                        isSubtraction(rhsRemainingValues[0])
                    ) {
                        return {
                            equivalent: true,
                            reasons: [
                                "subtracting the same value from both sides",
                            ],
                        };
                    }
                    return {
                        equivalent: true,
                        reasons: ["adding the same value to both sides"],
                    };
                }
            }
        }
        if (lhsB.type === "mul" && rhsB.type === "mul") {
            const lhsRemainingValues =
                lhsA.type === "mul"
                    ? lhsB.args.filter(
                          argB =>
                              !lhsA.args.some(
                                  argA => checkStep(argA, argB).equivalent,
                              ),
                      )
                    : lhsB.args.filter(arg => !checkStep(lhsA, arg).equivalent);

            const rhsRemainingValues =
                rhsA.type === "mul"
                    ? rhsB.args.filter(
                          argB =>
                              !rhsA.args.some(
                                  argA => checkStep(argA, argB).equivalent,
                              ),
                      )
                    : rhsB.args.filter(arg => !checkStep(rhsA, arg).equivalent);

            if (
                lhsRemainingValues.length === 1 &&
                rhsRemainingValues.length === 1
            ) {
                const {equivalent, reasons} = checkStep(
                    lhsRemainingValues[0],
                    rhsRemainingValues[0],
                );

                // TODO: do we want to enforce that the thing being added is exactly
                // the same or do we want to allow equivalent expressions?
                if (equivalent && reasons.length === 0) {
                    return {
                        equivalent: true,
                        reasons: ["multiplying both sides by the same value"],
                    };
                }
            }
        }
    }
    return {
        equivalent: false,
        reasons: [],
    };
};

const checkStep = (a: Semantic.Expression, b: Semantic.Expression): Result => {
    assertValid(a);
    assertValid(b);

    // The nice thing about these checks is that they go both ways, so it's
    // completely reasonable for someone to start with `a` and then go to
    // `a + 0` and then `a + (b - b)` and so on... as well as the reverse
    // We should be able to do something to verify this by auto reversing tests
    // or something like that.
    // The reversability sometimes must be defined, e.g. in the case of a + 0 = a
    if (a.type !== b.type) {
        // TODO: figure out how to de-dupe this and multiplication which also
        // has an identity
        for (const type: "add" | "mul" of ["add", "mul"]) {
            for (const [prev, next] of [[a, b], [b, a]]) {
                if (prev.type === type) {
                    const {identity, reason} = ops[type];
                    const nonIdentityArgs = prev.args.filter(
                        arg => !checkStep(arg, identity).equivalent,
                    );
                    if (nonIdentityArgs.length === 1) {
                        const {equivalent, reasons} = checkStep(
                            nonIdentityArgs[0],
                            next,
                        );
                        return {
                            equivalent,
                            reasons: equivalent
                                ? [...reasons, reason]
                                : reasons,
                        };
                    }
                }
            }
        }
        for (const [prev, next] of [[a, b], [b, a]]) {
            if (prev.type === "mul") {
                // TODO: ensure that reasons from these calls to checkStep
                // are captured.
                const hasZero = prev.args.some(
                    arg => checkStep(arg, ZERO).equivalent,
                );
                const {equivalent, reasons} = checkStep(next, ZERO);
                if (hasZero && equivalent) {
                    return {
                        equivalent: true,
                        reasons: [...reasons, "multiplication by zero"],
                    };
                }
            }
        }
        return {
            equivalent: false,
            reasons: [],
        };
    }

    // we've now assumed that both types are the same
    if (hasArgs(a) && hasArgs(b)) {
        if (a.args.length !== b.args.length) {
            if (a.type === "add" && b.type === "add") {
                return check_identity(a, b);
            }
            if (a.type === "mul" && b.type === "mul") {
                return check_identity(a, b);
            }

            return {
                equivalent: false,
                reasons: [],
            };
        }

        if (a.type === "eq" && b.type === "eq") {
            // We can't just return the result here because chekcEquationStep doesn't
            // check for swapping sides.
            const result = checkEquationStep(a, b);
            if (result.equivalent) {
                return result;
            }
        }
        const {reasons, equivalent} = checkArgs(a, b);

        // If the expressions aren't equal
        if (!equivalent) {
            return {equivalent: false, reasons: []};
        }

        // We allow any reordering of args, but we may want to restrict to
        // pair-wise reorderings in the future.
        // Not everything that has args can commute, for instance 3 > 1 is not
        // the same as 1 > 3 (the first is true, the latter is not)
        if (can_commute(a) && can_commute(b)) {
            const pairs = zip(a.args, b.args);
            const commutative = pairs.some(
                pair => !checkStep(...pair).equivalent,
            );

            // The rationale for equality is different
            if (commutative) {
                const reason =
                    a.type === "eq"
                        ? "symmetric property"
                        : "commutative property";
                return {
                    equivalent,
                    reasons: [...reasons, reason],
                };
            }
        }

        return {
            equivalent,
            reasons,
        };
    } else if (a.type === "number" && b.type === "number") {
        return {
            equivalent: a.value === b.value,
            reasons: [],
        };
    } else if (a.type === "identifier" && b.type === "identifier") {
        return {
            equivalent: a.name === b.name,
            reasons: [],
        };
    } else if (a.type === "neg" && b.type === "neg") {
        return checkStep(a.args[0], b.args[0]);
    } else {
        return {
            equivalent: false,
            reasons: [],
        };
    }
};

export {checkStep};
