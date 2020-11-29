import * as Semantic from "@math-blocks/semantic";

const isObject = (val: unknown): val is Record<string, unknown> => {
    return typeof val === "object" && val != null;
};

const deepEquals = (a: unknown, b: unknown): boolean => {
    if (Array.isArray(a) && Array.isArray(b)) {
        return (
            a.length === b.length &&
            a.every((val, index) => deepEquals(val, b[index]))
        );
    } else if (isObject(a) && isObject(b)) {
        const aKeys = Object.keys(a).filter(
            (key) => key !== "id" && key !== "loc",
        );
        const bKeys = Object.keys(b).filter(
            (key) => key !== "id" && key !== "loc",
        );
        if (aKeys.length !== bKeys.length) {
            return false;
        }
        return aKeys.every(
            (key) =>
                Object.prototype.hasOwnProperty.call(b, key) &&
                deepEquals(a[key], b[key]),
        );
    } else {
        return a === b;
    }
};

export const toEqualMath = (
    received: Semantic.Types.Node,
    actual: Semantic.Types.Node,
): {message: () => string; pass: boolean} => {
    const message = "Semantic trees did not match";
    if (deepEquals(received, actual)) {
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
