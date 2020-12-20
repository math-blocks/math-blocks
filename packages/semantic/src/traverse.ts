import * as Types from "./types";

/**
 * Traverse the nodes in a semantic tree.
 *
 * Traverse supports in place mutation of nodes within the tree.  If an `exit`
 * callback is provided that returns a value, the return value will replace
 * the node that was passed to it.
 */
export const traverse = (
    node: Types.Node,
    callbacks: {
        enter?: (node: Types.Node) => void;
        exit?: (node: Types.Node) => Types.Node | void;
    },
): Types.Node => {
    if (callbacks.enter) {
        callbacks.enter(node);
    }
    for (const [key, value] of Object.entries(node)) {
        if (Array.isArray(value)) {
            // All arrays in the tree except for Location.path contain nodes.
            // Since we never pass a Location as an arg to traverse we should
            // be okey without doing additional checks.
            node[key] = value.map((child) => traverse(child, callbacks));
        } else if (
            typeof value === "object" &&
            value != null &&
            value.hasOwnProperty("type")
        ) {
            node[key] = traverse(value as Types.Node, callbacks);
        }
    }
    if (callbacks.exit) {
        const result = callbacks.exit(node);
        if (result) {
            return result;
        }
    }
    return node;
};
