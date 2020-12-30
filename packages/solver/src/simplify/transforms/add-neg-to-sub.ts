import * as Semantic from "@math-blocks/semantic";

import {Transform} from "../types";

export const addNegToSub: Transform = (node) => {
    if (!Semantic.isNumeric(node)) {
        return;
    }
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
    return {
        message: "adding the inverse is the same as subtraction",
        before: node,
        after: Semantic.addTerms(newTerms),
        substeps: [],
    };
};
