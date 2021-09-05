import {getId} from "@math-blocks/core";

import {isOperator} from "../char/util";
import {NodeType} from "../shared-types";

import {zrow} from "./util";
import type {Zipper, Focus, State} from "./types";

export const frac = (state: State): State => {
    const zipper = state.zipper;
    const {left, selection} = zipper.row;

    if (selection.length > 0) {
        const focus: Focus = {
            type: "zfrac",
            id: getId(),
            left: [
                {
                    id: getId(),
                    type: NodeType.Row,
                    children: selection,
                    style: {},
                },
            ],
            right: [],
            style: {},
        };

        const newZipper: Zipper = {
            ...zipper,
            row: zrow(getId(), [], []),
            breadcrumbs: [
                ...zipper.breadcrumbs,
                {
                    row: {
                        type: "bcrow",
                        id: zipper.row.id,
                        left: zipper.row.left,
                        right: zipper.row.right,
                        style: zipper.row.style,
                    },
                    focus,
                },
            ],
        };

        return {
            startZipper: newZipper,
            endZipper: newZipper,
            zipper: newZipper,
            selecting: false,
        };
    }

    let index = left.length - 1;
    let parenCount = 0;
    while (index >= 0) {
        const child = left[index];
        if (child.type === "char" && child.value === ")") {
            parenCount++;
        }
        if (child.type === "char" && child.value === "(") {
            parenCount--;
        }
        if (parenCount < 0) {
            break;
        }

        if (child.type === "char" && parenCount === 0 && isOperator(child)) {
            break;
        }

        if (child.type === "limits") {
            break;
        }

        index--;
    }

    const focus: Focus = {
        type: "zfrac",
        id: getId(),
        left: [
            {
                id: getId(),
                type: NodeType.Row,
                children: left.slice(index + 1),
                style: {},
            },
        ],
        right: [],
        style: {},
    };

    const newZipper: Zipper = {
        ...zipper,
        row: zrow(getId(), [], []),
        breadcrumbs: [
            ...zipper.breadcrumbs,
            {
                row: {
                    type: "bcrow",
                    id: zipper.row.id,
                    left: left.slice(0, index + 1),
                    right: zipper.row.right,
                    style: zipper.row.style,
                },
                focus,
            },
        ],
    };

    return {
        startZipper: newZipper,
        endZipper: newZipper,
        zipper: newZipper,
        selecting: false,
    };
};
