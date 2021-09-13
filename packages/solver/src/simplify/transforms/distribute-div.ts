import * as Semantic from "@math-blocks/semantic";

import type {Transform} from "../types";
import type {Step} from "../../types";

const {NodeType} = Semantic;

// (a + b) / c -> a/c + b/c
export const distributeDiv: Transform = (node, path): Step | undefined => {
    if (node.type !== NodeType.Div) {
        return undefined;
    }

    const [numerator, denominator] = node.args;

    if (numerator.type !== NodeType.Add) {
        return undefined;
    }

    const after = Semantic.builders.add(
        numerator.args.map((term, index) => {
            // TODO: clone denominator
            if (
                term.type === NodeType.Neg &&
                denominator.type === NodeType.Neg
            ) {
                // TODO: add a substep going from -a / -b -> a / b
                // We don't need the whole proof for each of these substeps, but
                // we should be able to link to a proof if a student needs more
                // info.  How do we should contextual help without moving to a
                // different page?
                return Semantic.builders.div(term.arg, denominator.arg);
            } else if (term.type === NodeType.Neg) {
                // TODO: add substeps for converting subtraction to adding the
                // negative and back again.
                return Semantic.builders.neg(
                    Semantic.builders.div(term.arg, denominator),
                    term.subtraction,
                );
            } else if (denominator.type === NodeType.Neg) {
                // TODO: add substeps for converting subtraction to adding the
                // negative and back again.
                return Semantic.builders.neg(
                    Semantic.builders.div(term, denominator.arg),
                    index > 0,
                );
            } else {
                return Semantic.builders.div(term, denominator);
            }
        }),
    );

    return {
        message: "distribute division",
        before: node,
        after,
        substeps: [],
    };
};
