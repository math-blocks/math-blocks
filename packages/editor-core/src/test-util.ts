import * as Semantic from "@math-blocks/semantic";

export const toEqualMath = (
    received: Semantic.types.Node,
    actual: Semantic.types.Node,
): {message: () => string; pass: boolean} => {
    const message = "Semantic trees did not match";
    if (Semantic.util.deepEquals(received, actual)) {
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