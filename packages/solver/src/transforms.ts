import * as Semantic from "@math-blocks/semantic";

import {deepEquals, evalNode} from "./util";
import {Step} from "./types";

type Transform = (
    node: Semantic.Types.NumericNode,
) => Semantic.Types.NumericNode | undefined;

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
            ? Semantic.getFactors(arg.arg)
            : Semantic.getFactors(arg);

        const numericFactors = factors.filter(Semantic.isNumber);
        const nonNumericFactors = factors.filter((f) => !Semantic.isNumber(f));

        if (numericFactors.length > 0) {
            // If there's a single number factor then it's the coefficient
            if (numericFactors.length === 1) {
                coeff = numericFactors[0];
                if (coeff.type === "add" || coeff.type === "mul") {
                    const originalCoeff = coeff;
                    coeff = Semantic.number(evalNode(coeff).toString());
                    beforeSteps.push({
                        message: "evaluate coefficient",
                        nodes: [originalCoeff, coeff],
                    });
                }
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
            coeff = Semantic.number("1");
            varPart = arg;
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
            if (newCoeff.value === "1") {
                newTerms.push(
                    Semantic.mulFactors(Semantic.getFactors(k), implicit),
                );
            } else {
                newTerms.push(
                    Semantic.mulFactors(
                        [newCoeff, ...Semantic.getFactors(k)],
                        implicit,
                    ),
                );
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
    return Semantic.addTerms([...newTerms, ...numbers]);
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
            if (node.args.length === 2 && node.args[1].type === "add") {
                const add = node.args[1];
                const terms = add.args.map((term) => {
                    let newTerm: Semantic.Types.NumericNode = Semantic.mul(
                        [node.args[0], ...Semantic.getFactors(term)],
                        node.implicit,
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
