import * as Editor from "@math-blocks/editor";
import type {Mistake} from "@math-blocks/grader";

export const highlightMistakes = (
    zipper: Editor.Zipper,
    mistakes: readonly Mistake[],
    color: string,
): Editor.Zipper => {
    console.log("highlightMistakes");
    for (const mistake of mistakes) {
        let insideMistake = false;
        console.log(mistake);

        zipper = Editor.transforms.traverseZipper(
            zipper,
            {
                enter(node, path) {
                    if (path.length === 0) {
                        return;
                    }

                    for (const nextNode of mistake.nextNodes) {
                        const loc = nextNode.loc;
                        if (!loc) {
                            continue;
                        }
                        for (let i = loc.start; i < loc.end; i++) {
                            const nextNodePath = [...loc.path, i];
                            if (arrayEq(nextNodePath, path)) {
                                console.log("entering mistake");
                                insideMistake = true;
                                break;
                            }
                        }
                    }
                },
                exit(node, path) {
                    const highlight = insideMistake;

                    for (const nextNode of mistake.nextNodes) {
                        const loc = nextNode.loc;
                        if (!loc) {
                            continue;
                        }
                        for (let i = loc.start; i < loc.end; i++) {
                            const nextNodePath = [...loc.path, i];
                            if (arrayEq(nextNodePath, path)) {
                                console.log("leaving mistake");
                                insideMistake = false;
                                break;
                            }
                        }
                    }

                    if (highlight) {
                        return {
                            ...node,
                            style: {
                                ...node.style,
                                color: color,
                            },
                        };
                    }
                },
            },
            [],
        );
    }
    return zipper;
};

// TODO: move to tutor package
export const removeAllColor = (zipper: Editor.Zipper): Editor.Zipper => {
    return Editor.transforms.traverseZipper(
        zipper,
        {
            exit(node) {
                if (node.style.color) {
                    const {color, ...restStyle} = node.style;
                    return {
                        ...node,
                        style: restStyle,
                    };
                }
            },
        },
        [],
    );
};

function arrayEq<T>(a: readonly T[], b: readonly T[]): boolean {
    return a.length === b.length && a.every((e, i) => e === b[i]);
}
