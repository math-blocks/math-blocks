import {builders} from "@math-blocks/semantic";

import {Transform} from "../types";
import {simplify} from "../../simplify/simplify";

export const simplifyBothSides: Transform = (before, ident) => {
    const left = simplify(before.args[0], []);
    const right = simplify(before.args[1], []);

    if (left && right) {
        const after = builders.eq([left.after, right.after]);
        return {
            message: "simplify both sides",
            before,
            after,
            substeps: [
                {
                    ...left,
                    message: "simplify the left hand side",
                },
                {
                    ...right,
                    message: "simplify the right hand side",
                },
            ],
        };
    }
    if (left) {
        const after = builders.eq([left.after, before.args[1]]);
        return {
            message: "simplify the left hand side",
            before,
            after,
            substeps: left.substeps,
        };
    }
    if (right) {
        const after = builders.eq([before.args[0], right.after]);
        return {
            message: "simplify the right hand side",
            before,
            after,
            substeps: right.substeps,
        };
    }

    return undefined;
};
