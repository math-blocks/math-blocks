import * as Semantic from "@math-blocks/semantic";

import {Step} from "./types";

export const applyStep = (
    node: Semantic.types.Node,
    step: Step,
): Semantic.types.Node => {
    // Cloning is important since `Semantic.util.traverse` mutates `current`.
    const clone = JSON.parse(JSON.stringify(node));

    const path: Semantic.types.Node[] = [];

    return Semantic.util.traverse(clone, {
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
                return newNode;
            }
            if (newNode.type === "add" && node.type === "add") {
                const index = node.args.findIndex(
                    (arg: Semantic.types.NumericNode) => arg.id === oldNode.id,
                );
                if (index !== -1) {
                    return Semantic.builders.add([
                        ...node.args.slice(0, index),
                        ...newNode.args,
                        ...node.args.slice(index + 1),
                    ]);
                }
            }
        },
    });
};

export const applySteps = (
    node: Semantic.types.Node,
    steps: readonly Step[],
): Semantic.types.Node => {
    let result = node;
    for (const step of steps) {
        result = applyStep(result, step);
    }
    return result;
};
