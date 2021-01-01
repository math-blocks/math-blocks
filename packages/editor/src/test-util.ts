import * as Semantic from "@math-blocks/semantic";
import {types} from "@math-blocks/semantic";

export const toEqualMath = (
    received: types.Node,
    actual: types.Node,
): {message: () => string; pass: boolean} => {
    const message = "Semantic trees did not match";
    if (Semantic.deepEquals(received, actual)) {
        return {
            message: () => message,
            pass: true,
        };
    }
    return {
        message: () => message,
        pass: false,
    };
};
