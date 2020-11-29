import * as Types from "./types";

export const traverse = (
    node: Types.Node,
    enter: (node: Types.Node) => void,
    exit?: (node: Types.Node) => void,
): void => {
    enter(node);
    for (const value of Object.values(node)) {
        if (Array.isArray(value)) {
            // All arrays in the tree except for Location.path contain nodes.
            // Since we never pass a Location as an arg to traverse we should
            // be okey without doing additional checks.
            value.forEach((child) => traverse(child, enter, exit));
        } else if (
            typeof value === "object" &&
            value != null &&
            value.hasOwnProperty("type")
        ) {
            traverse(value as Types.Node, enter, exit);
        }
    }
    if (exit) {
        exit(node);
    }
};
