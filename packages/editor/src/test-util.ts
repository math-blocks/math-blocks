import {types, util} from "@math-blocks/semantic";

export const toEqualMath = (
    received: types.Node,
    actual: types.Node,
): {message: () => string; pass: boolean} => {
    const message = "Semantic trees did not match";
    if (util.deepEquals(received, actual)) {
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
