import * as Editor from "@math-blocks/editor";
import {getId} from "@math-blocks/core";

import {State} from "../row-reducer";
import {HasChildren, selectionSplit, insertBeforeChildWithIndex} from "../util";
import {SUB} from "../constants";

export const underscore = (currentNode: HasChildren, draft: State): void => {
    const {cursor, selectionStart} = draft;

    if (selectionStart) {
        const {head, body, tail} = selectionSplit(
            currentNode,
            cursor,
            selectionStart,
        );

        currentNode.children = [
            ...head,
            Editor.subsup(body, undefined),
            ...tail,
        ];
        draft.cursor = {
            path: [...cursor.path, head.length, SUB],
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
        const sub = nextNode.children[0] || {
            id: getId(),
            type: "row",
            children: [],
        };
        const sup = nextNode.children[1];
        nextNode.children = [sub, sup];
        draft.cursor = {
            path: [...cursor.path, cursor.next, 0],
            prev: -Infinity,
            next: sub.children.length > 0 ? 0 : Infinity,
        };
        return;
    }
    const sub: Editor.Row = {
        id: getId(),
        type: "row",
        children: [],
    };
    const newNode: Editor.SubSup = {
        id: getId(),
        type: "subsup",
        children: [sub, null],
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
            0,
        ],
        prev: -Infinity,
        next: Infinity,
    };
};
