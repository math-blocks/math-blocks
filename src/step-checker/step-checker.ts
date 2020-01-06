import BigNumber from "bignumber.js";
import produce from "immer";

import * as Semantic from "../semantic/semantic";
import * as Util from "../semantic/util";

import {zip} from "./util";

import FractionChecker from "./fraction-checker";
import EquationChecker from "./equation-checker";
import IntegerChecker from "./integer-checker";

// TODO: have a separate function that checks recursively
// TODO: provide a rational
const assertValid = (node: Semantic.Expression): void => {
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

const parseNode = (node: Semantic.Expression): BigNumber => {
    if (node.type === "number") {
        return new BigNumber(node.value);
    } else if (node.type === "neg") {
        return parseNode(node.arg).times(new BigNumber(-1));
    } else if (node.type === "div") {
        return parseNode(node.args[0]).div(parseNode(node.args[1]));
    } else {
        throw new Error(`cannot parse a number from ${node.type} node`);
    }
};

export type Reason = {
    message: string;
    nodes: Semantic.Expression[];
};

export type Result = {
    equivalent: boolean;
    reasons: Reason[];
};

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
    | Semantic.Div;

export const hasArgs = (a: Semantic.Expression): a is HasArgs =>
    a.type === "add" ||
    a.type === "mul" ||
    a.type === "eq" ||
    a.type === "neq" ||
    a.type === "lt" ||
    a.type === "lte" ||
    a.type === "gt" ||
    a.type === "gte" ||
    a.type === "div";

const isNode = (val: any): val is Semantic.Expression => {
    return Object.prototype.hasOwnProperty.call(val, "type");
};

const findNodeById = (
    root: Semantic.Expression,
    id: number,
): Semantic.Expression | void => {
    for (const val of Object.values(root)) {
        if (isNode(val)) {
            if (val.id === id) {
                return val;
            } else {
                const result = findNodeById(val, id);
                if (result) {
                    return result;
                }
            }
        } else if (Array.isArray(val)) {
            for (const child of val) {
                if (isNode(child)) {
                    if (child.id === id) {
                        return child;
                    } else {
                        const result = findNodeById(child, id);
                        if (result) {
                            return result;
                        }
                    }
                }
            }
        }
    }
};

const replaceNodeWithId = (
    root: Semantic.Expression,
    id: number,
    replacement: Semantic.Expression,
): Semantic.Expression | void => {
    for (const val of Object.values(root)) {
        if (isNode(val)) {
            if (val.id === id) {
                return val;
            } else {
                const result = replaceNodeWithId(val, id, replacement);
                if (result) {
                    return result;
                }
            }
        } else if (Array.isArray(val)) {
            for (const [index, child] of val.entries()) {
                if (isNode(child)) {
                    if (child.id === id) {
                        val[index] = replacement;
                        return child;
                    } else {
                        const result = replaceNodeWithId(
                            child,
                            id,
                            replacement,
                        );
                        if (result) {
                            if (result == child) {
                                val[index] = replacement;
                            }
                            return result;
                        }
                    }
                }
            }
        }
    }
};

const applySubReasons = (
    root: Semantic.Expression,
    subreasons: Reason[],
): Semantic.Expression => {
    const nextState = produce(root, draft => {
        for (const reason of subreasons) {
            // Not all reaons come with nodes yet.
            if (reason.nodes.length === 2) {
                replaceNodeWithId(draft, reason.nodes[0].id, reason.nodes[1]);
            }
        }
    });
    return nextState;
};

const deepEquals = (a: any, b: any): boolean => {
    if (Array.isArray(a) && Array.isArray(b)) {
        return (
            a.length === b.length &&
            a.every((val, index) => deepEquals(val, b[index]))
        );
    } else if (
        typeof a === "object" &&
        a != null &&
        typeof b === "object" &&
        b != null
    ) {
        const aKeys = Object.keys(a).filter(key => key !== "id");
        const bKeys = Object.keys(b).filter(key => key !== "id");
        if (aKeys.length !== bKeys.length) {
            return false;
        }
        return aKeys.every(
            key =>
                Object.prototype.hasOwnProperty.call(b, key) &&
                deepEquals(a[key], b[key]),
        );
    } else {
        return a === b;
    }
};

// TODO: write a function to determine if an equation is true or not
// e.g. 2 = 5 -> false, 5 = 5 -> true

// We'll want to eventually be able to describe hierarchical relations
// between steps in addition sequential relations.
// We still want each step to be responsible for deciding how to combine
// the result of checkStep with the new reason.

export interface IStepChecker {
    checkStep(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        // We pass an array of reasons since cycles may include multiple steps
        reasons: Reason[],
    ): Result;
    exactMatch(prev: Semantic.Expression, next: Semantic.Expression): Result;
    intersection(
        as: Semantic.Expression[],
        bs: Semantic.Expression[],
        reasons: Reason[],
    ): Semantic.Expression[];
    difference(
        as: Semantic.Expression[],
        bs: Semantic.Expression[],
        reasons: Reason[],
    ): Semantic.Expression[];
    // TODO: change this to return a Result
    equality(
        as: Semantic.Expression[],
        bs: Semantic.Expression[],
        reasons: Reason[],
    ): boolean;
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
    checkArgs<T extends HasArgs>(prev: T, next: T, reasons: Reason[]): Result {
        const _reasons: Reason[] = [];
        if (prev.args.length !== next.args.length) {
            return {
                equivalent: false,
                reasons: [],
            };
        }
        const equivalent = prev.args.every(prevArg =>
            next.args.some(nextArg => {
                const result = this.checkStep(prevArg, nextArg, reasons);
                if (result.equivalent) {
                    _reasons.push(...result.reasons);
                }
                return result.equivalent;
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
    intersection(
        as: Semantic.Expression[],
        bs: Semantic.Expression[],
        reasons: Reason[],
    ): Semantic.Expression[] {
        const result: Semantic.Expression[] = [];
        for (const a of as) {
            const index = bs.findIndex(
                b => this.checkStep(a, b, reasons).equivalent,
            );
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
    difference(
        as: Semantic.Expression[],
        bs: Semantic.Expression[],
        reasons: Reason[],
    ): Semantic.Expression[] {
        const result: Semantic.Expression[] = [];
        for (const a of as) {
            const index = bs.findIndex(
                b => this.checkStep(a, b, reasons).equivalent,
            );
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
    equality(
        as: Semantic.Expression[],
        bs: Semantic.Expression[],
        reasons: Reason[],
    ): boolean {
        return as.every(a =>
            bs.some(b => this.checkStep(a, b, reasons).equivalent),
        );
    }

    addZero(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reasons: Reason[],
    ): Result {
        if (prev.type !== "add") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        return this.checkIdentity(
            prev,
            next,
            Util.addTerms,
            Util.number("0"), // TODO: provide a way to have different levels of messages, e.g.
            // "adding zero doesn't change an expression"
            "addition with identity",
            reasons,
        );
    }

    mulOne(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reasons: Reason[],
    ): Result {
        if (prev.type !== "mul") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        return this.checkIdentity(
            prev,
            next,
            Util.mulFactors,
            Util.number("1"), // TODO: provide a way to have different levels of messages, e.g.
            // "multiplying by one doesn't change an expression"
            "multiplication with identity",
            reasons,
        );
    }

    checkIdentity<T extends Semantic.Add | Semantic.Mul>(
        prev: T,
        next: Semantic.Expression,
        op: (arg0: Semantic.Expression[]) => Semantic.Expression,
        identity: Semantic.Num, // conditional types would come in handy here
        reason: string,
        reasons: Reason[],
    ): Result {
        const identityReasons: Reason[] = [];
        const nonIdentityArgs = prev.args.filter(arg => {
            const result = this.checkStep(arg, identity, reasons);
            if (result.equivalent) {
                identityReasons.push(...result.reasons);
            }
            return !result.equivalent;
        });

        // If we haven't removed any identities then this check has failed
        if (nonIdentityArgs.length === prev.args.length) {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        const newPrev = op(nonIdentityArgs);
        const result = this.checkStep(newPrev, next, reasons);
        if (result.equivalent) {
            return {
                equivalent: true,
                reasons: [
                    ...identityReasons,
                    {
                        message: reason,
                        nodes: [],
                    },
                    ...result.reasons,
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
            for (const [x, y] of [
                [left, right],
                [right, left],
            ]) {
                if (y.type === "add" && y.args.length === addNode.args.length) {
                    // TODO: use exactMatch instead here... or we'll have track all
                    // of the reasons that are generated
                    // TODO: apply the subReasons to previous node to get the node
                    // before next.
                    const subReasons: Reason[] = [];
                    const equivalent = addNode.args.every((arg, index) => {
                        // Each term is in the correct order based on whether
                        // we're distributing/factoring from left to right or
                        // the reverse
                        const term =
                            x === left
                                ? Util.mulFactors([x, y.args[index]])
                                : Util.mulFactors([y.args[index], x]);

                        // We reset the "reasons" parameter here because we checking
                        // different nodes so we won't run into a cycle here.
                        const substep = this.checkStep(arg, term, []);

                        subReasons.push(...substep.reasons);
                        return substep.equivalent;
                    });

                    if (equivalent) {
                        const nodes: Semantic.Expression[] =
                            reason === "distribution"
                                ? [mulNode, addNode]
                                : [addNode, mulNode];

                        // TODO: include the original nodes[0] in the result somehow
                        if (subReasons.length > 0) {
                            nodes[0] = applySubReasons(nodes[0], subReasons);
                        }

                        return {
                            equivalent: true,
                            reasons:
                                reason === "distribution"
                                    ? [
                                          {
                                              message: reason,
                                              nodes,
                                          },
                                          ...subReasons,
                                      ]
                                    : [
                                          ...subReasons,
                                          {
                                              message: reason,
                                              nodes,
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

    mulByZero(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reasons: Reason[],
    ): Result {
        if (prev.type !== "mul") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        // TODO: ensure that reasons from these calls to checkStep
        // are captured.
        const hasZero = prev.args.some(
            arg => this.checkStep(arg, Util.number("0"), reasons).equivalent,
        );
        const result = this.checkStep(next, Util.number("0"), reasons);
        if (hasZero && result.equivalent) {
            return {
                equivalent: true,
                reasons: [
                    ...result.reasons,
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
        reasons: Reason[],
    ): Result {
        if (
            prev.type === "add" &&
            next.type === "add" &&
            prev.args.length === next.args.length
        ) {
            const pairs = zip(prev.args, next.args);
            // TODO: get commutative reasons
            const commutative = pairs.some(
                ([first, second]) =>
                    !this.checkStep(first, second, reasons).equivalent,
            );
            const result = this.checkArgs(prev, next, reasons);
            if (commutative && result.equivalent) {
                return {
                    equivalent: true,
                    reasons: [
                        {
                            message: "commutative property",
                            nodes: [],
                        },
                        ...result.reasons,
                    ],
                };
            }
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }

    evaluateMul(
        a: Semantic.Expression,
        b: Semantic.Expression,
        reasons: Reason[],
    ): Result {
        if (a.type !== "mul" && b.type !== "mul") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        const aFactors = Util.getFactors(a);
        const bFactors = Util.getFactors(b);

        const aNumTerms = aFactors.filter(term => term.type === "number");
        const bNumTerms = bFactors.filter(term => term.type === "number");

        const commonTerms = this.intersection(aNumTerms, bNumTerms, reasons);
        const aUniqFactors = this.difference(aNumTerms, commonTerms, reasons);
        const bUniqFactors = this.difference(bNumTerms, commonTerms, reasons);

        if (aUniqFactors.length > 0 && bUniqFactors.length > 0) {
            const aValue = aUniqFactors.reduce(
                (prod, arg) => prod.times(parseNode(arg)),
                new BigNumber(1),
            );
            const bValue = bUniqFactors.reduce(
                (prod, arg) => prod.times(parseNode(arg)),
                new BigNumber(1),
            );
            if (aValue.isEqualTo(bValue)) {
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

    evaluateAdd(
        a: Semantic.Expression,
        b: Semantic.Expression,
        reasons: Reason[],
    ): Result {
        if (a.type !== "add" && b.type !== "add") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        const aTerms = Util.getTerms(a);
        const bTerms = Util.getTerms(b);

        const aNumTerms = aTerms.filter(term => {
            try {
                parseNode(term);
                return true;
            } catch (e) {
                return false;
            }
        });
        const bNumTerms = bTerms.filter(term => {
            try {
                parseNode(term);
                return true;
            } catch (e) {
                return false;
            }
        });

        const commonTerms = this.intersection(aNumTerms, bNumTerms, reasons);
        const aUniqTerms = this.difference(aNumTerms, commonTerms, reasons);
        const bUniqTerms = this.difference(bNumTerms, commonTerms, reasons);

        if (aUniqTerms.length > 0 && bUniqTerms.length > 0) {
            const aValue = aUniqTerms.reduce(
                (sum, arg) => sum.plus(parseNode(arg)),
                new BigNumber(0),
            );
            const bValue = bUniqTerms.reduce(
                (sum, arg) => sum.plus(parseNode(arg)),
                new BigNumber(0),
            );
            if (aValue.isEqualTo(bValue)) {
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
        reasons: Reason[],
    ): Result {
        if (
            prev.type === "mul" &&
            next.type === "mul" &&
            prev.args.length === next.args.length
        ) {
            const pairs = zip(prev.args, next.args);
            // TODO: get commutative reasons
            const commutative = pairs.some(
                ([first, second]) =>
                    !this.checkStep(first, second, reasons).equivalent,
            );
            const result = this.checkArgs(prev, next, reasons);
            if (commutative && result.equivalent) {
                return {
                    equivalent: true,
                    reasons: [
                        {
                            message: "commutative property",
                            nodes: [],
                        },
                        ...result.reasons,
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
        reasons: Reason[],
    ): Result {
        if (
            prev.type === "eq" &&
            next.type === "eq" &&
            prev.args.length === next.args.length
        ) {
            const pairs = zip(prev.args, next.args);
            // TODO: get commutative reasons
            const commutative = pairs.some(
                ([first, second]) =>
                    !this.checkStep(first, second, reasons).equivalent,
            );
            const result = this.checkArgs(prev, next, reasons);
            if (commutative && result.equivalent) {
                return {
                    equivalent: true,
                    reasons: [
                        {
                            message: "symmetric property",
                            nodes: [],
                        },
                        ...result.reasons,
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
        return {
            equivalent: deepEquals(prev, next),
            reasons: [],
        };
    }

    // TODO: check adding by inverse
    // TODO: dividing a fraction: a/b / c -> a / bc
    // TODO: add an identity check for all operations
    // TODO: check removal of parens, i.e. associative property
    // TODO: memoize checkStep to avoid re-doing the same work
    checkStep(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reasons: Reason[],
    ): Result {
        assertValid(prev);
        assertValid(next);

        let result: Result;

        result = this.exactMatch(prev, next);
        if (result.equivalent) {
            return result;
        }

        result = this.equationChecker.checkStep(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.evaluateMul(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.evaluateAdd(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.symmetricProperty(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.commuteAddition(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.commuteMultiplication(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.addZero(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.addZero(next, prev, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.integerChecker.checkStep(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.mulOne(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.mulOne(next, prev, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.fractionChecker.checkStep(prev, next, reasons);
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
        result = this.mulByZero(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        // 0 -> a * 0
        result = this.mulByZero(next, prev, reasons);
        if (result.equivalent) {
            return result;
        }

        // General check if the args are equivalent for things with args
        // than are an array and not a tuple.
        if (prev.type === next.type && hasArgs(prev) && hasArgs(next)) {
            return this.checkArgs(prev, next, reasons);
        } else if (prev.type === "neg" && next.type === "neg") {
            const result = this.checkStep(prev.arg, next.arg, reasons);
            return {
                equivalent:
                    prev.subtraction === next.subtraction && result.equivalent,
                reasons:
                    prev.subtraction === next.subtraction && result.equivalent
                        ? result.reasons
                        : [],
            };
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
