import * as Semantic from "@math-blocks/semantic";

import {deepEquals, evalNode, intersection, difference} from "./util";
import {Step} from "./types";

type Transform = (
    node: Semantic.Types.NumericNode,
) => Semantic.Types.NumericNode | undefined;

// TODO: dedupe with Semantic.getFactors
export const getFactors = (
    node: Semantic.Types.NumericNode,
): OneOrMore<Semantic.Types.NumericNode> => {
    if (node.type === "neg") {
        return [Semantic.number("-1"), ...getFactors(node.arg)];
    } else {
        return node.type === "mul" ? node.args : [node];
    }
};

// TODO: dedupe with polynomial-checks.ts in grader
export const collectLikeTerms = (
    node: Semantic.Types.NumericNode,
): Semantic.Types.NumericNode | undefined => {
    if (node.type !== "add") {
        return;
    }

    // Map from variable part to an array of coefficients.
    const map = new Map<
        Semantic.Types.NumericNode,
        {
            coeff: Semantic.Types.NumericNode;
            term: Semantic.Types.NumericNode;
        }[]
    >();

    const newTerms: Semantic.Types.NumericNode[] = [];
    const numberTerms: Semantic.Types.NumericNode[] = [];

    const beforeSteps: Step[] = [];

    for (const arg of node.args) {
        if (Semantic.isNumber(arg)) {
            numberTerms.push(arg);
            continue;
        }

        let coeff: Semantic.Types.NumericNode;
        let varPart: Semantic.Types.NumericNode;

        const factors = Semantic.isSubtraction(arg)
            ? getFactors(arg.arg)
            : getFactors(arg);

        // TODO: maybe restrict ourselves to nodes of type "number" or "neg"?
        const numericFactors = factors.filter(Semantic.isNumber);
        const nonNumericFactors = factors.filter((f) => !Semantic.isNumber(f));

        if (numericFactors.length > 0) {
            // If there's a single number factor then it's the coefficient
            if (numericFactors.length === 1) {
                // We don't have to worry about evaluating this since it should
                // be pre-evaluated by evalMul or one of the other transforms
                coeff = numericFactors[0];
            } else {
                // If there a multiple factors that are numbers, multiply them
                // together and evaluate them.
                const mul = Semantic.mulFactors(numericFactors);
                coeff = Semantic.number(evalNode(mul).toString());
                beforeSteps.push({
                    message: "evaluate multiplication",
                    nodes: [mul, coeff],
                });
            }
            varPart = Semantic.mulFactors(nonNumericFactors, true);
        } else {
            if (arg.type === "neg") {
                coeff = Semantic.neg(Semantic.number("1"));
                varPart = arg.arg;
            } else {
                coeff = Semantic.number("1");
                varPart = arg;
            }
        }

        if (Semantic.isSubtraction(arg)) {
            coeff = Semantic.neg(coeff, true);
        }

        let key: Semantic.Types.NumericNode | undefined;
        for (const k of map.keys()) {
            // TODO: add an option to ignore mul.implicit
            if (deepEquals(k, varPart)) {
                key = k;
            }
        }
        if (!key) {
            map.set(varPart, [{coeff, term: arg}]);
        } else {
            map.get(key)?.push({coeff, term: arg});
        }
    }

    for (const [k, v] of map.entries()) {
        if (v.length > 1) {
            // Collect common terms
            // TODO: make this evaluation be a sub-step
            const newCoeff = Semantic.number(
                evalNode(
                    Semantic.addTerms(v.map(({coeff}) => coeff)),
                ).toString(),
            );
            const implicit = true;
            if (newCoeff.type === "neg") {
                if (
                    newCoeff.arg.type === "number" &&
                    newCoeff.arg.value === "1"
                ) {
                    newTerms.push(
                        Semantic.neg(
                            Semantic.mulFactors(getFactors(k), implicit),
                        ),
                    );
                } else {
                    newTerms.push(
                        Semantic.mulFactors(
                            [newCoeff, ...getFactors(k)],
                            implicit,
                        ),
                    );
                }
            } else {
                if (newCoeff.value === "1") {
                    newTerms.push(Semantic.mulFactors(getFactors(k), implicit));
                } else {
                    newTerms.push(
                        Semantic.mulFactors(
                            [newCoeff, ...getFactors(k)],
                            implicit,
                        ),
                    );
                }
            }
        } else {
            // Pass through unique terms
            newTerms.push(v[0].term);
        }
    }

    const numbers =
        numberTerms.length > 0
            ? [
                  Semantic.number(
                      evalNode(Semantic.addTerms(numberTerms)).toString(),
                  ),
              ]
            : [];

    // If no terms have be collected together then return early.
    if (
        newTerms.length === 0 ||
        newTerms.length + numbers.length === node.args.length
    ) {
        return undefined;
    }

    // Place numbers at the end which is a comment convention.
    return Semantic.addTerms([
        ...newTerms.map((term, index) => {
            if (
                index > 0 &&
                term.type === "mul" &&
                term.args[0].type === "neg"
            ) {
                // Convert the additive inverse to subtraction if it's not the first
                // term.
                // TODO: make this a substep
                term.args[0] = term.args[0].arg;
                return Semantic.neg(term);
            } else {
                return term;
            }
        }),
        ...numbers,
    ]);
};

export const dropParens: Transform = (node) => {
    const terms = Semantic.getTerms(node);
    let changed = false;
    const newTerms = terms.flatMap((term) => {
        if (term.type === "add") {
            changed = true;
            return term.args;
        } else {
            return [term];
        }
    });
    if (!changed) {
        return;
    }
    return Semantic.addTerms(newTerms);
};

export const distribute = (
    node: Semantic.Types.NumericNode,
): Semantic.Types.NumericNode | undefined => {
    const nodes = Semantic.getTerms(node);
    let changed = false;
    const newNodes = nodes.flatMap((node) => {
        if (node.type === "mul") {
            if (node.args.length === 2) {
                if (node.args[1].type === "add") {
                    const add = node.args[1];
                    const terms = add.args.map((term) => {
                        let newTerm = Semantic.mulFactors(
                            [node.args[0], ...Semantic.getFactors(term)],
                            node.implicit,
                        );
                        if (Semantic.isNumber(newTerm)) {
                            // TODO: report this as a substep
                            newTerm = Semantic.number(
                                evalNode(newTerm).toString(),
                            );
                        }
                        return newTerm;
                    }) as TwoOrMore<Semantic.Types.NumericNode>;
                    changed = true;
                    return terms;
                } else if (node.args[0].type === "add") {
                    const add = node.args[0];
                    const terms = add.args.map((term) => {
                        let newTerm = Semantic.mulFactors(
                            [...Semantic.getFactors(term), node.args[1]],
                            node.implicit,
                        );
                        if (Semantic.isNumber(newTerm)) {
                            // TODO: report this as a substep
                            newTerm = Semantic.number(
                                evalNode(newTerm).toString(),
                            );
                        }
                        return newTerm;
                    }) as TwoOrMore<Semantic.Types.NumericNode>;
                    changed = true;
                    return terms;
                }
            }
        } else if (node.type === "neg" && node.arg.type === "add") {
            const add = node.arg;
            const terms = add.args.map((term) => {
                let newTerm: Semantic.Types.NumericNode = Semantic.mul(
                    [Semantic.number("-1"), ...Semantic.getFactors(term)],
                    true,
                );
                if (Semantic.isNumber(newTerm)) {
                    // TODO: report this as a substep
                    newTerm = Semantic.number(evalNode(newTerm).toString());
                }
                return newTerm;
            }) as TwoOrMore<Semantic.Types.NumericNode>;
            changed = true;
            return terms;
        }

        return [node];
    });
    if (!changed) {
        return undefined;
    }
    return Semantic.addTerms(newNodes);
};

export const addNegToSub: Transform = (node) => {
    const terms = Semantic.getTerms(node);
    let changed = false;
    const newTerms = terms.map((term, index) => {
        if (index > 0 && term.type === "neg" && !term.subtraction) {
            changed = true;
            return Semantic.neg(term.arg, true);
        } else {
            return term;
        }
    });
    if (!changed) {
        return undefined;
    }
    return Semantic.addTerms(newTerms);
};

// This function will evaluate the multiple any factors that are numbers in node
// but won't touch any non-number terms, e.g.
// (2)(x)(3)(y) -> 6xy
// TODO: figure out why using our local version of getFactors breaks things.
export const evalMul: Transform = (node) => {
    const factors = Semantic.getFactors(node);

    const numericFactors = factors.filter(Semantic.isNumber);
    const nonNumericFactors = factors.filter((f) => !Semantic.isNumber(f));

    if (numericFactors.length > 1) {
        const mul = Semantic.mulFactors(numericFactors);
        const coeff = Semantic.number(evalNode(mul).toString());

        return Semantic.mulFactors([coeff, ...nonNumericFactors], true);
    }

    return undefined;
};

export const evalAdd: Transform = (node) => {
    const terms = Semantic.getTerms(node);

    const numericTerms = terms.filter(Semantic.isNumber);
    const nonNumericTerms = terms.filter((f) => !Semantic.isNumber(f));

    if (numericTerms.length > 1) {
        const sum = Semantic.number(
            evalNode(Semantic.addTerms(numericTerms)).toString(),
        );

        return Semantic.mulFactors([...nonNumericTerms, sum], true);
    }

    return undefined;
};

export const evalDiv: Transform = (node) => {
    if (node.type !== "div") {
        return;
    }

    if (!Semantic.isNumber(node)) {
        return;
    }

    const result = evalNode(node);
    if (result.d === 1) {
        if (result.s === 1) {
            return Semantic.number(result.n.toString());
        } else {
            return Semantic.neg(Semantic.number(result.n.toString()));
        }
    } else {
        if (result.s === 1) {
            return Semantic.div(
                Semantic.number(result.n.toString()),
                Semantic.number(result.d.toString()),
            );
        } else {
            return Semantic.neg(
                Semantic.div(
                    Semantic.number(result.n.toString()),
                    Semantic.number(result.d.toString()),
                ),
            );
        }
    }
};

export const simplifyFraction: Transform = (node) => {
    if (node.type !== "div") {
        return undefined;
    }

    const numFactors = Semantic.getFactors(node.args[0]);
    const denFactors = Semantic.getFactors(node.args[1]);

    const commonFactors = intersection(numFactors, denFactors);

    const num = Semantic.mulFactors(difference(numFactors, commonFactors));
    const den = Semantic.mulFactors(difference(denFactors, commonFactors));

    if (deepEquals(den, Semantic.number("1"))) {
        return num;
    } else if (
        deepEquals(den, Semantic.neg(Semantic.number("1"))) &&
        Semantic.isNegative(num)
    ) {
        return num.arg;
    } else {
        return Semantic.div(num, den);
    }
};

export const mulToPower: Transform = (node) => {
    const factors = Semantic.getFactors(node);

    if (factors.length < 2) {
        return undefined;
    }

    // map from factor to factor count
    const map = new Map<Semantic.Types.NumericNode, number>();

    for (const factor of factors) {
        let key: Semantic.Types.NumericNode | undefined;
        for (const k of map.keys()) {
            // TODO: add an option to ignore mul.implicit
            if (deepEquals(k, factor)) {
                key = k;
            }
        }
        if (!key) {
            map.set(factor, 1);
        } else {
            const val = map.get(key) as number;
            map.set(key, val + 1);
        }
    }

    if ([...map.values()].every((exp) => exp === 1)) {
        return undefined;
    }

    const newFactors: Semantic.Types.NumericNode[] = [];
    for (const [key, val] of map.entries()) {
        if (val === 1) {
            newFactors.push(key);
        } else {
            // Clone the key to prevent issues when modifying the AST
            const base = JSON.parse(JSON.stringify(key));
            newFactors.push(Semantic.pow(base, Semantic.number(String(val))));
        }
    }

    // TODO: mimic the implicitness of the incoming node.
    return Semantic.mulFactors(newFactors, true);
};
