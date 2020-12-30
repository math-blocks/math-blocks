import * as Semantic from "@math-blocks/semantic";

import {Step, Transform} from "../types";
import {mul} from "../util";

// a - (b + c) -> a + -1(b + c)
const distSub = (
    node: Semantic.Types.Neg,
    substeps: Step[],
): Semantic.Types.NumericNode[] | undefined => {
    const add = node.arg;
    const mulNegOne = Semantic.mul([Semantic.number("-1"), add], true);
    substeps.push({
        message: "negation is the same as multipyling by one",
        before: node,
        after: mulNegOne,
        substeps: [],
    });
    return distMul(mulNegOne, substeps);
};

// a - b -> a + -b
const subToNeg = (
    before: Semantic.Types.NumericNode,
    substeps: Step[],
): Semantic.Types.NumericNode => {
    if (Semantic.isSubtraction(before)) {
        const after = Semantic.neg(before.arg, false);
        substeps.push({
            message: "subtraction is the same as adding the negative",
            before,
            after,
            substeps: [],
        });
        return after;
    }
    return before;
};

// a + -b -> a - b
const negToSub = (
    before: Semantic.Types.NumericNode,
    index: number,
    substeps: Step[],
): Semantic.Types.NumericNode => {
    if (before.type === "neg" && !before.subtraction && index > 0) {
        const after = Semantic.neg(before.arg, true);
        substeps.push({
            message: "adding the negative is the same as subtraction",
            before,
            after,
            substeps: [],
        });
        return after;
    }
    return before;
};

// a(b + c) -> ab + bc
const distMul = (
    node: Semantic.Types.Mul,
    substeps: Step[],
): Semantic.Types.NumericNode[] | undefined => {
    // TODO: handle distribution of more than two polynomials
    if (node.args.length === 2) {
        if (node.args[1].type === "add") {
            const add = node.args[1];
            const terms = add.args.map((term) => subToNeg(term, substeps));
            return terms.map((term) => {
                const newTerm = mul(node.args[0], term, substeps);
                return newTerm;
            });
        } else if (node.args[0].type === "add") {
            const add = node.args[0];
            const terms = add.args.map((term) => subToNeg(term, substeps));
            return terms.map((term) => {
                const newTerm = mul(term, node.args[1], substeps);
                return newTerm;
            });
        }
    }
    return undefined;
};

/**
 * If node is of the form a(b + c + ...) perform distribution on the node to
 * produce ab + ac + ....  If the node is a child of an 'add' node, the parent
 * should perform the distribution so that the new terms are part of that node.
 *
 * This function handles cases involving negatives and subtraction, creating
 * appropriate substeps along the way.
 *
 * If the node can be transform a Step object is returned, otherwise we return
 * undefined.
 *
 * @param node The node to transform.
 * @param path An array of nodes that were traversed to get to `node`.
 * @return {Step | undefined}
 */
export const distribute: Transform = (node, path): Step | undefined => {
    if (!Semantic.isNumeric(node)) {
        return;
    }

    const parent = path[path.length - 1];
    if (node.type === "mul" && parent && parent.type === "add") {
        // The parent handles the distribution in this cases to ensure that
        // 1 + 2(x + 1) -> 1 + 2x + 2 instead of 1 + (2x + 2).  Drop parens
        // would eliminate the parentheses but it's not normally how a human
        // would show their work.
        return undefined;
    }
    if (node.type === "neg" && parent && parent.type === "add") {
        // The parent handles the distribution in this cases to ensure that
        // 1 + 2(x + 1) -> 1 + 2x + 2 instead of 1 + (2x + 2).  Drop parens
        // would eliminate the parentheses but it's not normally how a human
        // would show their work.
        return undefined;
    }

    const substeps: Step[] = [];
    const nodes = Semantic.getTerms(node);
    let changed = false;
    const newNodes = nodes.flatMap((node, outerIndex) => {
        // Only distribute one term at a time.
        if (changed) {
            return [node];
        }

        let newTerms: Semantic.Types.NumericNode[] | undefined;
        if (node.type === "neg") {
            newTerms = distSub(node, substeps);
        } else if (node.type === "mul") {
            newTerms = distMul(node, substeps);
        }

        if (newTerms) {
            newTerms = newTerms.map((term, innerIndex) =>
                negToSub(term, outerIndex + innerIndex, substeps),
            );
            changed = true;
            return newTerms;
        }

        return [node];
    });

    if (!changed) {
        return undefined;
    }

    const after = Semantic.addTerms(newNodes);

    return {
        message: "distribute",
        before: node,
        after,
        substeps,
    };
};
