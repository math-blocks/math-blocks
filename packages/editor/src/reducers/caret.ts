import * as Editor from "@math-blocks/editor";
import {getId} from "@math-blocks/core";

import {State} from "../above-reducer";
import {HasChildren, selectionSplit, insertBeforeChildWithIndex} from "../util";
import {SUP} from "../constants";

type ID = {
    id: number;
};

export const caret = (currentNode: HasChildren, draft: State): void => {
    const {cursor, selectionStart} = draft;

    if (selectionStart) {
        const {head, body, tail} = selectionSplit(
            currentNode,
            cursor,
            selectionStart,
        );

        currentNode.children = [
            ...head,
            Editor.subsup(undefined, body),
            ...tail,
        ];
        draft.cursor = {
            path: [...cursor.path, head.length, SUP],
            prev: body.length > 0 ? body.length - 1 : -Infinity,
            next: Infinity,
        };
        draft.selectionStart = undefined;

        return;
    }

    const {next} = cursor;

    const nextNode =
        cursor.next !== Infinity ? currentNode.children[cursor.next] : null;

    if (cursor.next !== Infinity && nextNode && nextNode.type === "subsup") {
        const sub = nextNode.children[0];
        const sup = nextNode.children[1] || {
            id: getId(),
            type: "row",
            children: [],
        };
        nextNode.children = [sub, sup];
        draft.cursor = {
            path: [...cursor.path, cursor.next, 1],
            prev: -Infinity,
            next: sup.children.length > 0 ? 0 : Infinity,
        };
        return;
    }
    const sup: Editor.Row<Editor.Glyph, ID> = {
        id: getId(),
        type: "row",
        children: [],
    };
    const newNode: Editor.SubSup<Editor.Glyph, ID> = {
        id: getId(),
        type: "subsup",
        children: [null, sup],
    };

    currentNode.children = insertBeforeChildWithIndex(
        currentNode.children,
        next,
        newNode,
    );

    draft.cursor = {
        path: [
            ...cursor.path,
            cursor.next === Infinity
                ? currentNode.children.length - 1
                : cursor.next,
            1,
        ],
        prev: -Infinity,
        next: Infinity,
    };
};
