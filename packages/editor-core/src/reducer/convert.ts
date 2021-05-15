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
import {SelectionDir} from "./enums";

export const zipperToRow = (zipper: Zipper): Row => {
    if (zipper.breadcrumbs.length === 0) {
        return zrowToRow(zipper.row);
    }

    const crumb = zipper.breadcrumbs[zipper.breadcrumbs.length - 1];
    const restCrumbs = zipper.breadcrumbs.slice(0, -1);

    const selection: readonly Node[] = crumb.row.selection?.nodes ?? [];
    const focusedNode = focusToNode(crumb.focus, zrowToRow(zipper.row));

    const newRight =
        crumb.row.selection?.dir === SelectionDir.Right
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
        return;
    }

    let focus: Focus;
    let focusRow: Row;
    switch (child.type) {
        case "frac": {
            if (focusIndex !== 0 && focusIndex !== 1) {
                throw new Error(`Invalid focusIndex: ${focusIndex} for "frac"`);
            }
            focus = zfrac(child, focusIndex);
            focusRow = child.children[focusIndex];
            break;
        }
        case "limits": {
            if (focusIndex !== 0 && focusIndex !== 1) {
                throw new Error(
                    `Invalid focusIndex: ${focusIndex} for "limits"`,
                );
            }
            focus = zlimits(child, focusIndex);
            // @ts-expect-error: this should never happen since focusIndex !== -1
            focusRow = child.children[focusIndex];
            break;
        }
        case "subsup": {
            if (focusIndex !== 0 && focusIndex !== 1) {
                throw new Error(
                    `Invalid focusIndex: ${focusIndex} for "subsup"`,
                );
            }
            focus = zsubsup(child, focusIndex);
            // @ts-expect-error: this should never happen since focusIndex !== -1
            focusRow = child.children[focusIndex];
            break;
        }
        case "root": {
            if (focusIndex !== 0 && focusIndex !== 1) {
                throw new Error(`Invalid focusIndex: ${focusIndex} for "root"`);
            }
            focus = zroot(child, focusIndex);
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

// This call can return undefined if the args passed to it have a different
// base structure, e.g. 2x| + 5 = 10, and 3y - 8| = 15.
export const selectionZipperFromZippers = (
    startZipper: Zipper,
    endZipper: Zipper,
): Zipper | void => {
    // Plan:
    // - start with simple situation where both cursors are in the same row
    // - handle more complex situations where cursors are in different rows
    //   - find last common row, do the same thing as the simple situation
    if (startZipper.row.id == endZipper.row.id) {
        // TODO: do some validation on the rows to check that they contain the
        // same number of children.

        // assert row.selection is empty for both startZipper and endZipper

        const left =
            startZipper.row.left.length < endZipper.row.left.length
                ? startZipper.row.left
                : endZipper.row.left;

        const right =
            startZipper.row.right.length < endZipper.row.right.length
                ? startZipper.row.right
                : endZipper.row.right;

        const children = [...startZipper.row.left, ...startZipper.row.right];

        const selection = children.slice(
            left.length,
            children.length - right.length,
        );

        return {
            ...startZipper,
            row: {
                ...startZipper.row,
                left: left,
                right: right,
                selection: {
                    dir: SelectionDir.Left, // TODO: get rid of this
                    nodes: selection,
                },
            },
        };
    } else {
        // find the last breadcrumb with a common row id
        const length = Math.min(
            startZipper.breadcrumbs.length,
            endZipper.breadcrumbs.length,
        );

        let index = -1;
        for (let i = 0; i < length; i++) {
            if (
                startZipper.breadcrumbs[i].row.id ===
                endZipper.breadcrumbs[i].row.id
            ) {
                index = i;
            }
        }

        const shortestZipper =
            startZipper.breadcrumbs.length === length ? startZipper : endZipper;

        // TODO: rezip the shortestZipper above the current index
        console.log(`index = ${index}`);

        if (shortestZipper.breadcrumbs.length === index + 1) {
            // no rezipping is required
            const otherCrumb =
                shortestZipper === startZipper
                    ? endZipper.breadcrumbs[index + 1]
                    : startZipper.breadcrumbs[index + 1];

            const children = [
                ...shortestZipper.row.left,
                ...shortestZipper.row.right,
            ];

            const firstIndex = Math.min(
                shortestZipper.row.left.length,
                otherCrumb.row.left.length,
            );

            const lastIndex =
                children.length -
                Math.min(
                    shortestZipper.row.right.length,
                    otherCrumb.row.right.length,
                );

            return {
                ...shortestZipper,
                row: {
                    ...shortestZipper.row,
                    left: children.slice(0, firstIndex),
                    selection: {
                        dir: SelectionDir.Left, // TODO: remove this
                        nodes: children.slice(firstIndex, lastIndex),
                    },
                    right: children.slice(lastIndex),
                },
            };
        }
    }

    return undefined;
};
