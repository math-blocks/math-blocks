import {builders, types, util} from "@math-blocks/semantic";

import {Step, Transform} from "../types";
import {mul} from "../util";

export const getFactors = (
    node: types.NumericNode,
): OneOrMore<types.NumericNode> => {
    if (node.type === "neg") {
        return [builders.number("-1"), ...getFactors(node.arg)];
    } else {
        return node.type === "mul" ? node.args : [node];
    }
};

// TODO: dedupe with polynomial-checks.ts in grader
export const collectLikeTerms: Transform = (node) => {
    if (node.type !== "add") {
        return;
    }

    // Map from variable part to an array of coefficients.
    const map = new Map<
        types.NumericNode,
        {
            coeff: types.NumericNode;
            term: types.NumericNode;
        }[]
    >();

    const newTerms: types.NumericNode[] = [];
    const numberTerms: types.NumericNode[] = [];

    const beforeSteps: Step[] = [];

    for (const arg of node.args) {
        if (util.isNumber(arg)) {
            numberTerms.push(arg);
            continue;
        }

        let coeff: types.NumericNode;
        let varPart: types.NumericNode;

        let factors: readonly types.NumericNode[];

        // TODO: move this logic into `getFactors`.
        if (arg.type === "div" && util.isNumber(arg.args[1])) {
            const [num, den] = arg.args;
            factors = [
                ...getFactors(num),
                builders.div(builders.number("1"), den),
            ];
        } else if (util.isSubtraction(arg)) {
            if (arg.arg.type === "div" && util.isNumber(arg.arg.args[1])) {
                const [num, den] = arg.arg.args;
                factors = [
                    ...getFactors(num),
                    builders.div(builders.number("1"), den),
                ];
            } else {
                factors = getFactors(arg.arg);
            }
        } else {
            factors = getFactors(arg);
        }

        // TODO: maybe restrict ourselves to nodes of type "number" or "neg"?
        const numericFactors = factors.filter(util.isNumber);
        const nonNumericFactors = factors.filter((f) => !util.isNumber(f));

        if (numericFactors.length > 0) {
            // If there's a single number factor then it's the coefficient
            if (numericFactors.length === 1) {
                // We don't have to worry about evaluating this since it should
                // be pre-evaluated by evalMul or one of the other transforms
                coeff = numericFactors[0];
            } else {
                // If there a multiple factors that are numbers, multiply them
                // together and evaluate them.
                const mul = builders.mul(numericFactors);
                coeff = builders.number(util.evalNode(mul).toString());
                beforeSteps.push({
                    message: "evaluate multiplication",
                    before: mul,
                    after: coeff,
                    substeps: [],
                });
            }
            varPart = builders.mul(nonNumericFactors, true);
        } else {
            if (arg.type === "neg") {
                coeff = builders.neg(builders.number("1"));
                varPart = arg.arg;
            } else {
                coeff = builders.number("1");
                varPart = arg;
            }
        }

        if (util.isSubtraction(arg)) {
            coeff = builders.neg(coeff, true);
        }

        let key: types.NumericNode | undefined;
        for (const k of map.keys()) {
            // TODO: add an option to ignore mul.implicit
            if (util.deepEquals(k, varPart)) {
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
            const sum = builders.add(v.map(({coeff}) => coeff));
            const evaledSum = util.evalNode(sum);

            let newCoeff =
                evaledSum.d === 1
                    ? builders.number(evaledSum.n.toString())
                    : builders.div(
                          builders.number(evaledSum.n.toString()),
                          builders.number(evaledSum.d.toString()),
                      );

            if (evaledSum.s === -1) {
                newCoeff = builders.neg(newCoeff);
            }

            newTerms.push(mul(newCoeff, k));
        } else {
            // Pass through unique terms
            newTerms.push(v[0].term);
        }
    }

    const numbers =
        numberTerms.length > 0
            ? [
                  builders.number(
                      // TODO: handle adding fractions better, since the result
                      // may itself be a fraction
                      util.evalNode(builders.add(numberTerms)).toString(),
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
    const after = builders.add(
        [...newTerms, ...numbers].map((term, index) => {
            if (term.type === "mul" && term.args[0].type === "neg") {
                // TODO: make this a substep
                // TODO: give this a new id
                const newTerm = {
                    ...term,
                    args: ([
                        term.args[0].arg,
                        ...term.args.slice(1),
                    ] as unknown) as TwoOrMore<types.NumericNode>,
                };
                return builders.neg(newTerm, index > 0);
            } else if (term.type === "neg") {
                // TODO: make this a substep if subtraction is changing
                return builders.neg(term.arg, index > 0);
            } else {
                return term;
            }
        }),
    );
    return {
        message: "collect like terms",
        before: node,
        after,
        substeps: [],
    };
};
