import {builders, types, util} from "@math-blocks/semantic";

import {Step} from "./types";

export const applyStep = (node: types.Node, step: Step): types.Node => {
    // Cloning is important since `util.traverse` mutates `current`.
    const clone = JSON.parse(JSON.stringify(node));

    const path: types.Node[] = [];

    return util.traverse(clone, {
        enter: (node) => {
            path.push(node);
        },
        exit: (node) => {
            path.pop();
            const parent = path[path.length - 1];
            const oldNode = step.before;
            const newNode = step.after;

            if (
                newNode.type === "add" &&
                node.type !== "add" &&
                parent?.type === "add"
            ) {
                // let the parent handle the application
                return;
            }
            if (node.id === oldNode.id) {
                return step.after;
            }
            if (newNode.type === "add" && node.type === "add") {
                const index = node.args.findIndex(
                    (arg) => arg.id === oldNode.id,
                );
                if (index !== -1) {
                    return builders.add([
                        ...node.args.slice(0, index),
                        ...newNode.args,
                        ...node.args.slice(index + 1),
                    ]);
                }
            }
        },
    });
};
