import * as Types from "./types";

export const traverse = (
    node: Types.Expression,
    cb: (node: Types.Expression) => void,
): void => {
    cb(node);
    for (const value of Object.values(node)) {
        if (Array.isArray(value)) {
            // All arrays in the tree except for Location.path contain nodes.
            // Since we never pass a Location as an arg to traverse we should
            // be okey without doing additional checks.
            value.forEach((child) => traverse(child, cb));
        } else if (
            typeof value === "object" &&
            value != null &&
            value.hasOwnProperty("type")
        ) {
            // @ts-ignore
            traverse(value, cb);
        }
    }
};
