import * as Semantic from "@math-blocks/semantic";

import type {Result, Check} from "../types";

import {correctResult} from "./util";

const {NodeType} = Semantic;

const replaceItem = <T>(
    items: readonly T[] | TwoOrMore<T>,
    newItem: T,
    index: number,
): readonly T[] => {
    return [...items.slice(0, index), newItem, ...items.slice(index + 1)];
};

export const checkDistribution: Check = (prev, next, context) => {
    // We need to handle distribution on itself or within a parent 'add' node.
    // We currently check that `next` is also an 'add' node.  Most checks do
    // not look at the `next` node.  In this case we make an exception to avoid
    // infinite loops.  We might be able to lift this restriction in the future
    // by setting `.source` on new nodes created by this check.
    if (
        (prev.type === NodeType.Add || prev.type === NodeType.Mul) &&
        next.type === NodeType.Add
    ) {
        const results: Result[] = [];

        const terms = Semantic.util.getTerms(prev);

        // Find all 'mul' nodes and then try generating a newPrev node from
        // each of them.
        for (let i = 0; i < terms.length; i++) {
            const mul = terms[i];

            const potentialResults: Result[] = [];
            const potentialNewPrevs = [];

            if (mul.type === NodeType.Mul) {
                for (let j = 0; j < mul.args.length; j++) {
                    const factor = mul.args[j];
                    if (factor.type !== NodeType.Add) {
                        continue;
                    }

                    const newPrev = Semantic.builders.add([
                        ...terms.slice(0, i),
                        // If we find a term where at least one of its factors
                        // is a sum, e.g. (x)(a + b)(y) then we'll replace the
                        // term by multiplying each of the other factors by each
                        // term in the sum.  In this case the result would be
                        // xay + xby.
                        ...factor.args.map((arg) =>
                            Semantic.builders.mul(
                                replaceItem(mul.args, arg, j),
                                mul.implicit,
                            ),
                        ),
                        ...terms.slice(i + 1),
                    ]);

                    const result = context.checker.checkStep(
                        newPrev,
                        next,
                        context,
                    );

                    if (result) {
                        potentialResults.push(result);
                        potentialNewPrevs.push(newPrev);
                    }
                }
            }

            // For each of the potential results for this term, pick the
            // shortest one.
            if (potentialResults.length > 0) {
                let result = potentialResults[0];
                let newPrev = potentialNewPrevs[0];
                if (potentialResults.length === 2) {
                    if (
                        potentialResults[1].steps.length < result.steps.length
                    ) {
                        result = potentialResults[1];
                        newPrev = potentialNewPrevs[1];
                    }
                }

                results.push(
                    correctResult(
                        prev,
                        newPrev,
                        context.reversed,
                        [],
                        result.steps,
                        "distribution",
                        "factoring",
                    ),
                );
            }
        }

        // If there are multiple results, pick the one with the shortest number
        // of steps.
        if (results.length > 0) {
            let shortestResult = results[0];
            for (const result of results.slice(1)) {
                if (result.steps.length < shortestResult.steps.length) {
                    shortestResult = result;
                }
            }
            return shortestResult;
        }
    }
};

checkDistribution.symmetric = true;
