import {builders, util} from "@math-blocks/semantic";

import {Transform} from "../types";

export const dropParens: Transform = (node) => {
    if (!util.isNumeric(node)) {
        return;
    }
    const terms = util.getTerms(node);
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
    return {
        message: "drop parentheses",
        before: node,
        after: builders.add(newTerms),
        substeps: [],
    };
};
