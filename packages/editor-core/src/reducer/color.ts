import * as transforms from "../ast/transforms";
import {selectionZipperFromZippers} from "./convert";

import type {State} from "./types";

export const color = (state: State, color: string): State => {
    const {zipper, startZipper, endZipper} = state;
    const {selection} = zipper.row;

    let inSelection = false;

    if (selection.length > 0) {
        const selectedNodeIds = selection.map((node) => node.id);
        const callback: transforms.ZipperCallback = {
            enter: (node) => {
                if (node.type !== "char" && selectedNodeIds.includes(node.id)) {
                    inSelection = true;
                }
            },
            exit: (node) => {
                if (node.type !== "char" && selectedNodeIds.includes(node.id)) {
                    inSelection = false;
                }
                if (inSelection || selectedNodeIds.includes(node.id)) {
                    return {
                        ...node,
                        style: {
                            ...node.style,
                            color: color,
                        },
                    };
                }
            },
        };

        // We transform both the start and end zipper in order for
        // things to work with Case 3 in selectionZipperFromZippers.
        const newStartZipper = transforms.traverseZipper(
            startZipper,
            callback,
            [],
        );
        const newEndZipper = transforms.traverseZipper(endZipper, callback, []);
        const newSelectionZippper = selectionZipperFromZippers(
            newStartZipper,
            newEndZipper,
        );

        if (newSelectionZippper) {
            return {
                startZipper: newStartZipper,
                endZipper: newEndZipper,
                zipper: newSelectionZippper,
                selecting: true,
            };
        }
    }

    return state;
};
