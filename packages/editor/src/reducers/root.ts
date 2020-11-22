import * as Editor from "@math-blocks/editor";
import {getId} from "@math-blocks/core";

import {State} from "../row-reducer";
import {HasChildren, selectionSplit, insertBeforeChildWithIndex} from "../util";
import {RADICAND} from "../constants";

export const root = (currentNode: HasChildren, draft: State): void => {
    const {cursor, selectionStart} = draft;

    if (selectionStart) {
        const {head, body, tail} = selectionSplit(
            currentNode,
            cursor,
            selectionStart,
        );

        currentNode.children = [...head, Editor.root(body, null), ...tail];
        draft.cursor = {
            path: [...cursor.path, head.length, RADICAND],
            prev: body.length > 0 ? body.length - 1 : -Infinity,
            next: Infinity,
        };
        draft.selectionStart = undefined;

        return;
    }

    const {next} = cursor;

    const radicand: Editor.Row = {
        id: getId(),
        type: "row",
        children: [],
    };
    const newNode: Editor.Root = {
        id: getId(),
        type: "root",
        children: [radicand, null /* index */],
    };

    currentNode.children = insertBeforeChildWithIndex(
        currentNode.children,
        next,
        newNode,
    );

    const index = currentNode.children.indexOf(newNode);
    draft.cursor = {
        path: [...cursor.path, index, RADICAND],
        prev: -Infinity,
        next: Infinity,
    };
};
