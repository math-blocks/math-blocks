import {builders, util} from "@math-blocks/semantic";

import {Transform} from "../types";

export const addNegToSub: Transform = (node) => {
    if (!util.isNumeric(node)) {
        return;
    }
    const terms = util.getTerms(node);
    let changed = false;
    const newTerms = terms.map((term, index) => {
        if (index > 0 && term.type === "neg" && !term.subtraction) {
            changed = true;
            return builders.neg(term.arg, true);
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
        after: builders.add(newTerms),
        substeps: [],
    };
};
