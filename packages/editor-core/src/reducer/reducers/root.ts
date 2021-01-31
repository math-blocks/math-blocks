import {getId} from "@math-blocks/core";

import * as builders from "../../builders";
import * as types from "../../types";

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

        currentNode.children = [...head, builders.root(null, body), ...tail];
        draft.cursor = {
            path: [...cursor.path, head.length, RADICAND],
            prev: body.length > 0 ? body.length - 1 : -Infinity,
            next: Infinity,
        };
        draft.selectionStart = undefined;

        return;
    }

    const {next} = cursor;

    const radicand: types.Row = {
        id: getId(),
        type: "row",
        children: [],
    };
    const newNode: types.Root = {
        id: getId(),
        type: "root",
        children: [null /* index */, radicand],
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
