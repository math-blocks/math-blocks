import * as Editor from "@math-blocks/editor";

import {State} from "../above-reducer";
import {HasChildren, selectionSplit} from "../util";
import {NUMERATOR, DENOMINATOR} from "../constants";

export const slash = (currentNode: HasChildren, draft: State): void => {
    const {cursor, selectionStart} = draft;

    if (selectionStart) {
        const {head, body, tail} = selectionSplit(
            currentNode,
            cursor,
            selectionStart,
        );

        currentNode.children = [...head, Editor.frac(body, []), ...tail];
        draft.cursor = {
            path: [...cursor.path, head.length, DENOMINATOR],
            prev: -Infinity,
            next: Infinity,
        };
        draft.selectionStart = undefined;

        return;
    }

    const {prev, next} = cursor;

    if (prev === -Infinity) {
        currentNode.children = [Editor.frac([], []), ...currentNode.children];
        draft.cursor = {
            path: [...cursor.path, 0, NUMERATOR],
            prev: -Infinity,
            next: Infinity,
        };
        return;
    }

    const splitChars = [
        "+",
        "\u2212",
        "\u00B7",
        "=",
        "<",
        ">",
        "\u2264",
        "\u2265",
    ];

    const endIndex = next === Infinity ? currentNode.children.length : next;
    let startIndex = endIndex;
    let parenCount = 0;

    while (startIndex > 0) {
        const prevChild = currentNode.children[startIndex - 1];
        if (prevChild.type === "atom" && prevChild.value.char === ")") {
            parenCount++;
        }

        if (prevChild.type === "atom" && prevChild.value.char === "(") {
            parenCount--;
        }

        if (parenCount < 0) {
            throw new Error("mismatched parentheses");
        }

        if (
            prevChild.type === "atom" &&
            parenCount === 0 &&
            splitChars.includes(prevChild.value.char)
        ) {
            break;
        }

        if (prevChild.type === "limits") {
            break;
        }

        startIndex--;
    }

    if (parenCount !== 0) {
        throw new Error("mismatched parentheses");
    }

    const head = currentNode.children.slice(0, startIndex);
    const body = currentNode.children.slice(startIndex, endIndex);
    const tail = currentNode.children.slice(endIndex);

    currentNode.children = [...head, Editor.frac(body, []), ...tail];
    draft.cursor = {
        path: [
            ...cursor.path,
            head.length,
            body.length === 0 ? NUMERATOR : DENOMINATOR,
        ],
        prev: -Infinity,
        next: Infinity,
    };
};
