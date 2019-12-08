// @flow
import * as Arithmetic from "./arithmetic.js";
import * as Semantic from "../semantic.js";

import {zip} from "./util.js";

import FractionChecker from "./fraction-checker.js";
import EquationChecker from "./equation-checker.js";
import IntegerChecker from "./integer-checker.js";

import type {Expression, Add, Mul} from "../semantic.js";

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

type Reason = {
    message: string,
    nodes: Semantic.Expression[],
};

export type Result = {|
    equivalent: boolean,
    reasons: Reason[],
|};

// TODO: fix flowtype/define-flow-type, HasArgs is used below
// eslint-disable-next-line no-unused-vars
type HasArgs =
    | Semantic.Add
    | Semantic.Mul
    | Semantic.Eq
    | Semantic.Neq
    | Semantic.Lt
    | Semantic.Lte
    | Semantic.Gt
    | Semantic.Gte
    | Semantic.Div
    | Semantic.Neg;

const hasArgs = (a: Semantic.Expression): boolean %checks =>
    a.type === "add" ||
    a.type === "mul" ||
    a.type === "eq" ||
    a.type === "neq" ||
    a.type === "lt" ||
    a.type === "lte" ||
    a.type === "gt" ||
    a.type === "gte" ||
    a.type === "div" ||
    a.type === "neg";

// TODO: write a function to determine if an equation is true or not
// e.g. 2 = 5 -> false, 5 = 5 -> true

export interface IStepChecker {
    checkStep(prev: Semantic.Expression, next: Semantic.Expression): Result;
    intersection(
        as: Semantic.Expression[],
        bs: Semantic.Expression[],
    ): Semantic.Expression[];
    difference(
        as: Semantic.Expression[],
        bs: Semantic.Expression[],
    ): Semantic.Expression[];
    // TODO: change this to return a Result
    equality(as: Semantic.Expression[], bs: Semantic.Expression[]): boolean;
}

class StepChecker implements IStepChecker {
    fractionChecker: FractionChecker;
    equationChecker: EquationChecker;
    integerChecker: IntegerChecker;

    constructor() {
        this.fractionChecker = new FractionChecker(this);
        this.equationChecker = new EquationChecker(this);
        this.integerChecker = new IntegerChecker(this);
    }

    /**
     * checkArgs will return true if each node has the same args even if the
     * order doesn't match.
     */
    checkArgs<T: HasArgs>(prev: T, next: T): Result {
        const _reasons = [];
        const equivalent = prev.args.every(prevArg =>
            next.args.some(nextArg => {
                const {equivalent, reasons} = this.checkStep(prevArg, nextArg);
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
    }

    /**
     * Returns all of the elements that appear in both as and bs.
     */
    intersection(as: Semantic.Expression[], bs: Semantic.Expression[]) {
        const result = [];
        for (const a of as) {
            const index = bs.findIndex(b => this.checkStep(a, b).equivalent);
            if (index !== -1) {
                result.push(a);
                bs = [...bs.slice(0, index), ...bs.slice(index + 1)];
            }
        }
        return result;
    }

    /**
     * Returns all of the elements that appear in as but not in bs.
     */
    difference(as: Semantic.Expression[], bs: Semantic.Expression[]) {
        const result = [];
        for (const a of as) {
            const index = bs.findIndex(b => this.checkStep(a, b).equivalent);
            if (index !== -1) {
                bs = [...bs.slice(0, index), ...bs.slice(index + 1)];
            } else {
                result.push(a);
            }
        }
        return result;
    }

    /**
     * Returns true if all every element in as is equivalent to an element in bs
     * and vice versa.
     */
    equality(as: Semantic.Expression[], bs: Semantic.Expression[]): boolean {
        return as.every(a => bs.some(b => this.checkStep(a, b).equivalent));
    }

    addZero(prev: Semantic.Expression, next: Semantic.Expression): Result {
        if (prev.type !== "add") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        return this.checkIdentity(
            prev,
            next,
            Arithmetic.add,
            Arithmetic.ZERO,
            // TODO: provide a way to have different levels of messages, e.g.
            // "adding zero doesn't change an expression"
            "addition with identity",
        );
    }

    mulOne(prev: Semantic.Expression, next: Semantic.Expression): Result {
        if (prev.type !== "mul") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        return this.checkIdentity(
            prev,
            next,
            Arithmetic.mul,
            Arithmetic.ONE,
            // TODO: provide a way to have different levels of messages, e.g.
            // "multiplying by one doesn't change an expression"
            "multiplication with identity",
        );
    }

    checkIdentity<T: Semantic.Add | Semantic.Mul>(
        prev: T,
        next: Semantic.Expression,
        op: (Semantic.Expression[]) => Semantic.Expression,
        identity: Semantic.Number, // conditional types would come in handy here
        reason: string,
    ): Result {
        const identityReasons = [];
        const nonIdentityArgs = prev.args.filter(arg => {
            const {equivalent, reasons} = this.checkStep(arg, identity);
            if (equivalent) {
                identityReasons.push(...reasons);
            }
            return !equivalent;
        });

        // If we haven't removed any identities then this check has failed
        if (nonIdentityArgs.length === prev.args.length) {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        const newPrev = op(nonIdentityArgs);
        const {equivalent, reasons} = this.checkStep(newPrev, next);
        if (equivalent) {
            return {
                equivalent: true,
                reasons: [
                    ...identityReasons,
                    {
                        message: reason,
                        nodes: [],
                    },
                    ...reasons,
                ],
            };
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }

    checkDistribution(
        prev: Semantic.Expression,
        next: Semantic.Expression,
    ): Result {
        if (prev.type !== "mul" || next.type !== "add") {
            return {
                equivalent: false,
                reasons: [],
            };
        }
        return this.distributionFactoring(next, prev, "distribution");
    }

    checkFactoring(
        prev: Semantic.Expression,
        next: Semantic.Expression,
    ): Result {
        if (prev.type !== "add" || next.type !== "mul") {
            return {
                equivalent: false,
                reasons: [],
            };
        }
        return this.distributionFactoring(prev, next, "factoring");
    }

    distributionFactoring(
        addNode: Semantic.Add,
        mulNode: Semantic.Mul,
        reason: "distribution" | "factoring",
    ): Result {
        // TODO: handle distribution across n-ary multiplication later
        if (mulNode.args.length === 2) {
            const [left, right] = mulNode.args;
            for (const [x, y] of [[left, right], [right, left]]) {
                if (y.type === "add" && y.args.length === addNode.args.length) {
                    // TODO: use exactMatch instead here... or we'll have track all
                    // of the reasons that are generated
                    const equivalent = addNode.args.every((arg, index) => {
                        return this.checkStep(
                            arg,
                            Arithmetic.mul([x, y.args[index]]),
                        ).equivalent;
                    });

                    if (equivalent) {
                        // TODO: include sub-reasons from checkStep
                        return {
                            equivalent: true,
                            reasons: [
                                {
                                    message: reason,
                                    nodes:
                                        reason === "distribution"
                                            ? [mulNode, addNode]
                                            : [addNode, mulNode],
                                },
                            ],
                        };
                    }
                }
            }
        }
        return {
            equivalent: false,
            reasons: [],
        };
    }

    mulByZero(prev: Semantic.Expression, next: Semantic.Expression): Result {
        if (prev.type !== "mul") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        // TODO: ensure that reasons from these calls to checkStep
        // are captured.
        const hasZero = prev.args.some(
            arg => this.checkStep(arg, Arithmetic.ZERO).equivalent,
        );
        const {equivalent, reasons} = this.checkStep(next, Arithmetic.ZERO);
        if (hasZero && equivalent) {
            return {
                equivalent: true,
                reasons: [
                    ...reasons,
                    {
                        message: "multiplication by zero",
                        nodes: [],
                    },
                ],
            };
        }
        return {
            equivalent: false,
            reasons: [],
        };
    }

    commuteAddition(
        prev: Semantic.Expression,
        next: Semantic.Expression,
    ): Result {
        if (
            prev.type === "add" &&
            next.type === "add" &&
            prev.args.length === next.args.length
        ) {
            const pairs = zip(prev.args, next.args);
            // TODO: get commutative reasons
            const commutative = pairs.some(
                pair => !this.checkStep(...pair).equivalent,
            );
            const {reasons, equivalent} = this.checkArgs(prev, next);
            if (commutative && equivalent) {
                return {
                    equivalent,
                    reasons: [
                        {
                            message: "commutative property",
                            nodes: [],
                        },
                        ...reasons,
                    ],
                };
            }
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }

    evaluateMul(a: Semantic.Expression, b: Semantic.Expression): Result {
        if (a.type !== "mul" && b.type !== "mul") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        const aFactors = Arithmetic.getFactors(a);
        const bFactors = Arithmetic.getFactors(b);

        const aNumTerms = aFactors.filter(term => term.type === "number");
        const bNumTerms = bFactors.filter(term => term.type === "number");

        const commonTerms = this.intersection(aNumTerms, bNumTerms);
        const aUniqFactors = this.difference(aNumTerms, commonTerms);
        const bUniqFactors = this.difference(bNumTerms, commonTerms);

        if (aUniqFactors.length > 0 && bUniqFactors.length > 0) {
            const aValue = aUniqFactors.reduce<number>(
                // $FlowFixMe
                (prod, arg) => prod * parseFloat(arg.value),
                1,
            );
            const bValue = bUniqFactors.reduce<number>(
                // $FlowFixMe
                (prod, arg) => prod * parseFloat(arg.value),
                1,
            );
            if (aValue === bValue) {
                return {
                    equivalent: true,
                    reasons: [
                        {
                            message: "evaluation of multiplication",
                            nodes: [],
                        },
                    ],
                };
            }
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }

    evaluateAdd(a: Semantic.Expression, b: Semantic.Expression): Result {
        if (a.type !== "add" && b.type !== "add") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        const aTerms = Arithmetic.getTerms(a);
        const bTerms = Arithmetic.getTerms(b);

        const aNumTerms = aTerms.filter(term => term.type === "number");
        const bNumTerms = bTerms.filter(term => term.type === "number");

        const commonTerms = this.intersection(aNumTerms, bNumTerms);
        const aUniqTerms = this.difference(aNumTerms, commonTerms);
        const bUniqTerms = this.difference(bNumTerms, commonTerms);

        if (aUniqTerms.length > 0 && bUniqTerms.length > 0) {
            const aValue = aUniqTerms.reduce<number>(
                // $FlowFixMe
                (sum, arg) => sum + parseFloat(arg.value),
                0,
            );
            const bValue = bUniqTerms.reduce<number>(
                // $FlowFixMe
                (sum, arg) => sum + parseFloat(arg.value),
                0,
            );
            if (aValue === bValue) {
                return {
                    equivalent: true,
                    reasons: [
                        {
                            message: "evaluation of addition",
                            nodes: [],
                        },
                    ],
                };
            }
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }

    commuteMultiplication(
        prev: Semantic.Expression,
        next: Semantic.Expression,
    ): Result {
        if (
            prev.type === "mul" &&
            next.type === "mul" &&
            prev.args.length === next.args.length
        ) {
            const pairs = zip(prev.args, next.args);
            // TODO: get commutative reasons
            const commutative = pairs.some(
                pair => !this.checkStep(...pair).equivalent,
            );
            const {reasons, equivalent} = this.checkArgs(prev, next);
            if (commutative && equivalent) {
                return {
                    equivalent,
                    reasons: [
                        {
                            message: "commutative property",
                            nodes: [],
                        },
                        ...reasons,
                    ],
                };
            }
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }

    symmetricProperty(
        prev: Semantic.Expression,
        next: Semantic.Expression,
    ): Result {
        if (
            prev.type === "eq" &&
            next.type === "eq" &&
            prev.args.length === next.args.length
        ) {
            const pairs = zip(prev.args, next.args);
            // TODO: get commutative reasons
            const commutative = pairs.some(
                pair => !this.checkStep(...pair).equivalent,
            );
            const {reasons, equivalent} = this.checkArgs(prev, next);
            if (commutative && equivalent) {
                return {
                    equivalent,
                    reasons: [
                        {
                            message: "symmetric property",
                            nodes: [],
                        },
                        ...reasons,
                    ],
                };
            }
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }

    exactMatch(prev: Semantic.Expression, next: Semantic.Expression): Result {
        if (prev.type !== next.type) {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        if (prev.type === "neg" && next.type === "neg") {
            if (prev.subtraction !== next.subtraction) {
                return {
                    equivalent: false,
                    reasons: [],
                };
            }
            return this.exactMatch(prev.args[0], next.args[0]);
        } else if (hasArgs(prev) && hasArgs(next)) {
            if (prev.args.length !== next.args.length) {
                return {
                    equivalent: false,
                    reasons: [],
                };
            }
            if (prev.type === "mul" && next.type === "mul") {
                // TODO: decide if we actually want to be this precise
                if (prev.implicit !== next.implicit) {
                    return {
                        equivalent: false,
                        reasons: [],
                    };
                }
            }
            // $FlowFixMe: flow doesn't like passing tuples to functions expecting arrays
            const allMatch = zip(prev.args, next.args).every(
                ([aArg, bArg]) => this.exactMatch(aArg, bArg).equivalent,
            );
            if (allMatch) {
                return {
                    equivalent: true,
                    reasons: [],
                };
            }
        } else if (prev.type === "number" && next.type === "number") {
            if (prev.value === next.value) {
                return {
                    equivalent: true,
                    reasons: [],
                };
            }
        } else if (prev.type === "identifier" && next.type === "identifier") {
            if (prev.name === next.name) {
                return {
                    equivalent: true,
                    reasons: [],
                };
            }
        }
        return {
            equivalent: false,
            reasons: [],
        };
    }

    // TODO: check adding by inverse
    // TODO: dividing a fraction: a/b / c -> a / bc
    // TODO: add an identity check for all operations
    // TODO: check removal of parens, i.e. associative property
    // TODO: memoize checkStep to avoid re-doing the same work
    checkStep(prev: Semantic.Expression, next: Semantic.Expression): Result {
        assertValid(prev);
        assertValid(next);

        let result: Result;

        result = this.exactMatch(prev, next);
        if (result.equivalent) {
            return result;
        }

        result = this.equationChecker.checkStep(prev, next);
        if (result.equivalent) {
            return result;
        }

        result = this.evaluateMul(prev, next);
        if (result.equivalent) {
            return result;
        }

        result = this.evaluateAdd(prev, next);
        if (result.equivalent) {
            return result;
        }

        result = this.symmetricProperty(prev, next);
        if (result.equivalent) {
            return result;
        }

        result = this.commuteAddition(prev, next);
        if (result.equivalent) {
            return result;
        }

        result = this.commuteMultiplication(prev, next);
        if (result.equivalent) {
            return result;
        }

        result = this.addZero(prev, next);
        if (result.equivalent) {
            return result;
        }

        result = this.addZero(next, prev);
        if (result.equivalent) {
            return result;
        }

        result = this.integerChecker.checkStep(prev, next);
        if (result.equivalent) {
            return result;
        }

        result = this.mulOne(prev, next);
        if (result.equivalent) {
            return result;
        }

        result = this.mulOne(next, prev);
        if (result.equivalent) {
            return result;
        }

        result = this.fractionChecker.checkStep(prev, next);
        if (result.equivalent) {
            return result;
        }

        result = this.checkDistribution(prev, next);
        if (result.equivalent) {
            return result;
        }

        result = this.checkFactoring(prev, next);
        if (result.equivalent) {
            return result;
        }

        // a * 0 -> 0
        result = this.mulByZero(prev, next);
        if (result.equivalent) {
            return result;
        }

        // 0 -> a * 0
        result = this.mulByZero(next, prev);
        if (result.equivalent) {
            return result;
        }

        // General check if the args are equivalent for things with args
        // than are an array and not a tuple.
        if (prev.type === next.type && hasArgs(prev) && hasArgs(next)) {
            return this.checkArgs(prev, next);
        }

        if (prev.type === "number" && next.type === "number") {
            return {
                equivalent: prev.value === next.value,
                reasons: [],
            };
        } else if (prev.type === "identifier" && next.type === "identifier") {
            return {
                equivalent: prev.name === next.name,
                reasons: [],
            };
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }
}

export default StepChecker;
