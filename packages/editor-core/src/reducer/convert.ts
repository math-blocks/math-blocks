import type {Breadcrumb, Zipper, Focus} from "./types";
import type {Row, Node} from "../types";

import {
    focusToNode,
    zrowToRow,
    zrow,
    zfrac,
    zlimits,
    zsubsup,
    zroot,
    zdelimited,
} from "./util";
import {Dir} from "./enums";

export const zipperToRow = (zipper: Zipper): Row => {
    if (zipper.breadcrumbs.length === 0) {
        return zrowToRow(zipper.row);
    }

    const crumb = zipper.breadcrumbs[zipper.breadcrumbs.length - 1];
    const restCrumbs = zipper.breadcrumbs.slice(0, -1);

    const selection: readonly Node[] = crumb.row.selection?.nodes ?? [];
    const focusedNode = focusToNode(crumb.focus, zrowToRow(zipper.row));

    const newRight =
        crumb.row.selection?.dir === Dir.Right
            ? [...crumb.row.left, focusedNode, ...selection, ...crumb.row.right]
            : [
                  ...crumb.row.left,
                  ...selection,
                  focusedNode,
                  ...crumb.row.right,
              ];

    const row = zrow(crumb.row.id, [], newRight);

    return zipperToRow({
        row,
        breadcrumbs: restCrumbs,
    });
};

type Side = "left" | "right";
type Intersection =
    | {type: "content"; id: number; side: Side}
    | {type: "padding"; flag: "start" | "end"};

export const rowToZipper = (
    row: Row,
    intersections: Intersection[],
): Zipper | void => {
    if (intersections.length === 0) {
        return;
    }

    let int: Intersection;
    let rest: Intersection[];

    [int, ...rest] = intersections;

    if (int.type === "padding") {
        return int.flag === "start"
            ? {
                  row: zrow(row.id, [], row.children),
                  breadcrumbs: [],
              }
            : {
                  row: zrow(row.id, row.children, []),
                  breadcrumbs: [],
              };
    }

    let rowIndex = row.children.findIndex(
        (child) => int.type === "content" && int.id === child.id,
    );
    if (rowIndex === -1) {
        // debugger;
        return;
    }

    if (rest.length === 0) {
        if (int.side === "right") {
            rowIndex++;
        }

        const zipper: Zipper = {
            row: zrow(
                row.id,
                row.children.slice(0, rowIndex),
                row.children.slice(rowIndex),
            ),
            breadcrumbs: [],
        };

        return zipper;
    }

    [int, ...rest] = rest;
    const child = row.children[rowIndex];

    let focusIndex = -1;
    switch (child.type) {
        case "frac":
        case "limits":
        case "subsup":
        case "root":
        case "delimited": {
            focusIndex = child.children.findIndex(
                (child) => int.type === "content" && int.id === child?.id,
            );
            break;
        }
    }

    if (focusIndex === -1) {
        // debugger;
        return;
    }

    // TODO: replace Dir.Left, Dir.Right, Dir.None with an simple integer index

    let focus: Focus;
    let focusRow: Row;
    switch (child.type) {
        case "frac": {
            focus = zfrac(child, focusIndex === 0 ? Dir.Left : Dir.Right);
            focusRow = child.children[focusIndex];
            break;
        }
        case "limits": {
            focus = zlimits(child, focusIndex === 0 ? Dir.Left : Dir.Right);
            // @ts-expect-error: this should never happen since focusIndex !== -1
            focusRow = child.children[focusIndex];
            break;
        }
        case "subsup": {
            focus = zsubsup(child, focusIndex === 0 ? Dir.Left : Dir.Right);
            // @ts-expect-error: this should never happen since focusIndex !== -1
            focusRow = child.children[focusIndex];
            break;
        }
        case "root": {
            focus = zroot(child, focusIndex === 0 ? Dir.Left : Dir.Right);
            // @ts-expect-error: this should never happen since focusIndex !== -1
            focusRow = child.children[focusIndex];
            break;
        }
        case "delimited": {
            focus = zdelimited(child); // sets dir = Dir.None
            focusRow = child.children[focusIndex];
            break;
        }
        default: {
            throw new Error("focus not assigned");
        }
    }

    const crumb: Breadcrumb = {
        row: zrow(
            row.id,
            row.children.slice(0, rowIndex), // focus replaces the missing child
            row.children.slice(rowIndex + 1),
        ),
        focus: focus,
    };

    const innerZipper: Zipper | void = rowToZipper(focusRow, rest);
    if (!innerZipper) {
        // debugger;
        return;
    }

    const zipper: Zipper = {
        ...innerZipper,
        breadcrumbs: [crumb, ...innerZipper.breadcrumbs],
    };

    return zipper;
};
