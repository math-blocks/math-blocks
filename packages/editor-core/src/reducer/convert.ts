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
import type {ZRow} from "./types";

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

const getLeftSelectionRight = (
    row1: ZRow,
    row2: ZRow,
    children: Node[],
): {
    left: Node[];
    selection: {
        dir: SelectionDir; // TODO: remove this
        nodes: Node[];
    };
    right: Node[];
} => {
    const firstIndex = Math.min(row1.left.length, row2.left.length);
    const lastIndex =
        children.length - Math.min(row1.right.length, row2.right.length);

    return {
        left: children.slice(0, firstIndex),
        selection: {
            dir: SelectionDir.Left, // TODO: remove this
            nodes: children.slice(firstIndex, lastIndex),
        },
        right: children.slice(lastIndex),
    };
};

// This call can return undefined if the args passed to it have a different
// base structure, e.g. 2x| + 5 = 10, and 3y - 8| = 15.
export const selectionZipperFromZippers = (
    startZipper: Zipper,
    endZipper: Zipper,
): Zipper | void => {
    // Case 1: Common row
    if (startZipper.row.id == endZipper.row.id) {
        // TODO: do some validation on the rows to check that they contain the
        // same number of children.

        // assert row.selection is empty for both startZipper and endZipper

        const children = [...startZipper.row.left, ...startZipper.row.right];

        const firstIndex = Math.min(
            startZipper.row.left.length,
            endZipper.row.left.length,
        );
        const lastIndex =
            children.length -
            Math.min(startZipper.row.right.length, endZipper.row.right.length);

        return {
            ...startZipper,
            row: {
                ...startZipper.row,
                left: children.slice(0, firstIndex),
                selection: {
                    dir: SelectionDir.Left, // TODO: get rid of this
                    nodes: children.slice(firstIndex, lastIndex),
                },
                right: children.slice(lastIndex),
            },
        };
    }

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

    // Case 2: Common breadcrumb
    if (index !== -1) {
        const crumb = startZipper.breadcrumbs[index];

        // Rezip shorterZipper until breadcrumbs reaches desired length.
        let zipper = startZipper;
        while (zipper.breadcrumbs.length > index) {
            const crumbs = zipper.breadcrumbs;

            const lastCrumb = crumbs[crumbs.length - 1];
            const restCrumbs = crumbs.slice(0, -1);

            const node = focusToNode(lastCrumb.focus, zrowToRow(zipper.row));
            zipper = {
                row: {
                    ...lastCrumb.row,
                    // We need to know which side the shortestZipper is on to
                    // order to know whether to includ 'node' in '.left' or '.right'.
                    left: [...lastCrumb.row.left, node],
                },
                breadcrumbs: restCrumbs,
            };
        }

        // even though the IDs of the crumb's rows are the same, the index
        // of their focuses are different
        const startCrumb = startZipper.breadcrumbs[index];
        const endCrumb = endZipper.breadcrumbs[index];

        // If the focus IDs are the same then the selection is contained within
        // one of the zipper's row.
        if (
            startCrumb.focus.left.length === endCrumb.focus.left.length &&
            startCrumb.focus.right.length === endCrumb.focus.right.length &&
            startCrumb.focus.id === endCrumb.focus.id
        ) {
            if (startZipper.breadcrumbs.length === index + 1) {
                const row = startZipper.row;
                const otherRow = endZipper.breadcrumbs[index + 1].row;
                const children = [...row.left, ...row.right];

                return {
                    ...zipper,
                    breadcrumbs: [...zipper.breadcrumbs, crumb],
                    row: {
                        ...row,
                        ...getLeftSelectionRight(row, otherRow, children),
                    },
                };
            }
            if (endZipper.breadcrumbs.length === index + 1) {
                const row = endZipper.row;
                const otherRow = startZipper.breadcrumbs[index + 1].row;
                const children = [...row.left, ...row.right];

                return {
                    ...zipper,
                    breadcrumbs: [...zipper.breadcrumbs, crumb],
                    row: {
                        ...row,
                        ...getLeftSelectionRight(row, otherRow, children),
                    },
                };
            }

            throw new Error("unhandled case");
        }

        const children = [...zipper.row.left, ...zipper.row.right];

        return {
            ...zipper,
            row: {
                ...zipper.row,
                ...getLeftSelectionRight(
                    startCrumb.row,
                    endCrumb.row,
                    children,
                ),
            },
        };
    }

    // Case 3: No common breadcrumb/row
    const shortestZipper =
        startZipper.breadcrumbs.length === length ? startZipper : endZipper;

    if (shortestZipper.breadcrumbs.length === index + 1) {
        const otherCrumb =
            shortestZipper === startZipper
                ? endZipper.breadcrumbs[index + 1]
                : startZipper.breadcrumbs[index + 1];

        const children = [
            ...shortestZipper.row.left,
            ...shortestZipper.row.right,
        ];

        return {
            ...shortestZipper,
            row: {
                ...shortestZipper.row,
                ...getLeftSelectionRight(
                    shortestZipper.row,
                    otherCrumb.row,
                    children,
                ),
            },
        };
    }

    return undefined;
};
