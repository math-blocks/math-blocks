import {builders, types, util} from "@math-blocks/semantic";

import {Check, Correction} from "../types";
import {MistakeId} from "../enums";

import {correctResult} from "./util";

// TODO: when evaluating 5 - 5 or 5 + -5 then we may want to include substeps,
// e.g. "adding inverse" and "addition with identity"
export const evalAdd: Check = (prev, next, context) => {
    if (!util.isNumeric(prev) || !util.isNumeric(next)) {
        return;
    }

    // If neither are sums then we can stop early
    if (prev.type !== "add" && next.type !== "add") {
        return;
    }

    const prevTerms = util.getTerms(prev);
    const nextTerms = util.getTerms(next);

    const {checker} = context;

    const prevNonNumTerms: types.NumericNode[] = [];
    const prevNumTerms: types.NumericNode[] = [];
    for (const term of prevTerms) {
        if (util.isNumber(term)) {
            try {
                util.evalNode(term, checker.options);
            } catch (e) {
                return;
            }
            prevNumTerms.push(term);
        } else {
            prevNonNumTerms.push(term);
        }
    }

    const nextNumTerms: types.NumericNode[] = [];
    for (const term of nextTerms) {
        if (util.isNumber(term)) {
            try {
                // TODO: update parseNode to handle all of the cases when
                // Semantic.isNumber return true.
                util.evalNode(term, checker.options);
            } catch (e) {
                return;
            }
            nextNumTerms.push(term);
        }
    }

    // Find any exact matches between the numeric terms in prev and next and
    // remove them.
    const commonTerms = util.intersection(prevNumTerms, nextNumTerms);
    const uniquePrevNumTerms = util.difference(prevNumTerms, commonTerms);
    const uniqueNextNumTerms = util.difference(nextNumTerms, commonTerms);

    // We don't recognize things like 5 + 3 -> 6 + 2 as a valid step, maybe we should
    if (uniqueNextNumTerms.length >= uniquePrevNumTerms.length) {
        return;
    }

    const uniquePrevSum = util.evalNode(
        builders.addTerms(uniquePrevNumTerms),
        checker.options,
    );

    // Prevents infinite recursion
    if (uniquePrevSum.equals(0)) {
        return;
    }

    const uniqueNextSum = util.evalNode(
        builders.addTerms(uniqueNextNumTerms),
        checker.options,
    );

    // Prevents reporting unhelpful mistakes.  Numeric terms adding to zero is
    // usually a sign of the addition of inverses, e.g. 5 + -5.  We prefer that
    // check so we return early here.
    if (uniqueNextSum.equals(0)) {
        return;
    }

    if (!uniquePrevSum.equals(uniqueNextSum)) {
        if (context.mistakes) {
            // Corrections only make sense for EVAL_ADD since with decomposition
            // there are multiple correct decompositions.  Also, we currently
            // only handle the situation there's only one number in 'next'.
            // TODO: make this less restrictive by removing common number from
            // prev and next.
            const corrections: Correction[] = [];
            if (!context.reversed && uniqueNextNumTerms.length === 1) {
                corrections.push({
                    id: uniqueNextNumTerms[0].id,
                    replacement: builders.number(uniquePrevSum.toString()),
                });
            }
            context.mistakes.push({
                id: context.reversed
                    ? MistakeId.DECOMP_ADD
                    : MistakeId.EVAL_ADD,
                prevNodes: context.reversed
                    ? uniqueNextNumTerms
                    : uniquePrevNumTerms,
                nextNodes: context.reversed
                    ? uniquePrevNumTerms
                    : uniqueNextNumTerms,
                corrections: corrections,
            });
        }

        return;
    }

    // TODO: check if uniqueNextNumTerms and uniqueNextNumTerms sum to zero
    const newPrev = builders.addTerms([...prevNonNumTerms, ...nextNumTerms]);

    const result = checker.checkStep(newPrev, next, context);

    if (result) {
        return correctResult(
            prev,
            newPrev,
            context.reversed,
            [],
            result.steps,
            "evaluation of addition",
            "decompose sum",
        );
    }
};
evalAdd.symmetric = true;

// TODO: when evaluating 5 * 1/5 or 5 / 5 then we may want to include substeps,
// e.g. "multiplying inverse" and "multiplication with identity"
export const evalMul: Check = (prev, next, context) => {
    if (!util.isNumeric(prev) || !util.isNumeric(next)) {
        return;
    }

    // If neither are products then we can stop early
    if (prev.type !== "mul" && next.type !== "mul") {
        return;
    }

    const prevFactors = util.getFactors(prev);
    const nextFactors = util.getFactors(next);

    const {checker} = context;

    const prevNonNumFactors: types.NumericNode[] = [];
    const prevNumFactors: types.NumericNode[] = [];
    for (const factor of prevFactors) {
        if (util.isNumber(factor)) {
            try {
                util.evalNode(factor, checker.options);
            } catch (e) {
                return;
            }
            prevNumFactors.push(factor);
        } else {
            prevNonNumFactors.push(factor);
        }
    }

    const nextNumFactors: types.NumericNode[] = [];
    for (const factor of nextFactors) {
        if (util.isNumber(factor)) {
            try {
                // TODO: update parseNode to handle all of the cases when
                // Semantic.isNumber return true.
                util.evalNode(factor, checker.options);
            } catch (e) {
                return;
            }
            nextNumFactors.push(factor);
        }
    }

    // Find any exact matches between the numeric terms in prev and next and
    // remove them.
    const commonFactors = util.intersection(prevNumFactors, nextNumFactors);
    const uniquePrevNumFactors = util.difference(prevNumFactors, commonFactors);
    const uniqueNextNumFactors = util.difference(nextNumFactors, commonFactors);

    // We don't recognize things like 5 * 3 -> 6 * 2 as a valid step, maybe we should
    if (uniqueNextNumFactors.length >= uniquePrevNumFactors.length) {
        return;
    }

    const uniquePrevProduct = util.evalNode(
        builders.mulFactors(uniquePrevNumFactors),
        checker.options,
    );

    // Prevents infinite recursion
    if (uniquePrevProduct.equals(1)) {
        return;
    }

    const uniqueNextProduct = util.evalNode(
        builders.mulFactors(uniqueNextNumFactors),
        checker.options,
    );

    // Prevents reporting unhelpful mistakes.  Numeric terms multiplying to one
    // is usually a sign of multiplying of inverses, e.g. 5 * 1/5.  We prefer
    // that check so we return early here.
    if (uniqueNextProduct.equals(1)) {
        return;
    }

    if (!uniquePrevProduct.equals(uniqueNextProduct)) {
        if (context.mistakes) {
            // Corrections only make sense for EVAL_MUL since with decomposition
            // there are multiple correct decompositions.  Also, we currently
            // only handle the situation there's only one number in 'next'.
            // TODO: make this less restrictive by removing common number from
            // prev and next.
            const corrections: Correction[] = [];
            if (!context.reversed && uniqueNextNumFactors.length === 1) {
                corrections.push({
                    id: uniqueNextNumFactors[0].id,
                    replacement: builders.number(uniquePrevProduct.toString()),
                });
            }
            context.mistakes.push({
                // TODO: add an optional 'correction' field to Mistake type
                // The corrections should be mappings between incorrect nodes
                // and their corrections.
                // NOTE: corrections only make sense for EVAL_MUL since in the
                // decomposition case there are multiple correct decompositions.
                id: context.reversed
                    ? MistakeId.DECOMP_MUL
                    : MistakeId.EVAL_MUL,
                prevNodes: context.reversed
                    ? uniqueNextNumFactors
                    : uniquePrevNumFactors,
                nextNodes: context.reversed
                    ? uniquePrevNumFactors
                    : uniqueNextNumFactors,
                corrections: corrections,
            });
        }

        return;
    }

    const newPrev = builders.mulFactors([
        ...nextNumFactors,
        ...prevNonNumFactors, // it's customary to put variable factors last
    ]);

    const result = checker.checkStep(newPrev, next, context);

    if (result) {
        return correctResult(
            prev,
            newPrev,
            context.reversed,
            [],
            result.steps,
            "evaluation of multiplication",
            "decompose product",
        );
    }
};
evalMul.symmetric = true;
