import * as Semantic from "@math-blocks/semantic";

import {Transform} from "../types";

const {NodeType} = Semantic;

export const dropParens: Transform = (node) => {
    if (!Semantic.util.isNumeric(node)) {
        return;
    }
    const terms = Semantic.util.getTerms(node);
    let changed = false;
    const newTerms = terms.flatMap((term) => {
        if (term.type === NodeType.Add) {
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
        after: Semantic.builders.add(newTerms),
        substeps: [],
    };
};
