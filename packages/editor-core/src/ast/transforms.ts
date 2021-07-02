import type {
    Focus,
    Zipper,
    Breadcrumb,
    BreadcrumbRow,
    ZRow,
} from "../reducer/types";
import * as types from "./types";

export const traverseNodes = (
    nodes: readonly types.Node[],
    callback: {
        enter?: <U extends types.Node>(node: U, path: number[]) => void;
        exit: <U extends types.Node>(node: U, path: number[]) => U | void;
    },
    path: number[],
    offset: number,
): readonly types.Node[] =>
    nodes.map((node, index) =>
        traverseNode(node, callback, [...path, offset + index]),
    );

export type ZipperCallback = {
    enter?: <T extends Focus | types.Node | ZRow | BreadcrumbRow>(
        node: T,
        path: number[],
    ) => void;
    exit: <T extends Focus | types.Node | ZRow | BreadcrumbRow>(
        node: T,
        path: number[],
    ) => T | void;
};

/**
 * Preform depth first traversal of a zipper.  Breadcrumbs are processed first
 * to last recursively followed by the row.  The nodes in each row are processed
 * left to right.
 */
export const traverseZipper = (
    zipper: Zipper,
    callback: ZipperCallback,
    path: number[],
): Zipper => {
    const {breadcrumbs} = zipper;

    if (breadcrumbs.length === 0) {
        // Base case
        const {row} = zipper;

        callback.enter?.(row, path);
        // TODO: we want the numbers in the path to correspond to SourceLocations
        // which don't know about selection
        let newRow = {
            ...row,
            left: traverseNodes(row.left, callback, path, 0),
            selection: traverseNodes(
                row.selection,
                callback,
                path,
                row.left.length,
            ),
            right: traverseNodes(
                row.right,
                callback,
                path,
                row.left.length + row.right.length,
            ),
        };
        newRow = callback.exit(newRow, path) || newRow;

        return {
            row: newRow,
            breadcrumbs: breadcrumbs,
        };
    }

    // Recursive case
    const [crumb, ...restCrumbs] = breadcrumbs;

    const {row, focus} = crumb;

    // start processing the row
    callback.enter?.(row, path);
    const rowLeft = traverseNodes(row.left, callback, path, 0);

    // start processing the focus
    const rowGapIndex = row.left.length;
    callback.enter?.(focus, [...path, rowGapIndex]);
    const focusLeft = focus.left.map((row, index) => {
        return row && traverseRow(row, callback, [...path, rowGapIndex, index]);
    });

    // recurse
    const focusGapIndex = focus.left.length;
    const newZipper = traverseZipper(
        {
            ...zipper,
            breadcrumbs: restCrumbs,
        },
        callback,
        [...path, rowGapIndex, focusGapIndex],
    );

    // finish processing the focus
    const focusRight = focus.right.map((row, index) => {
        return (
            row &&
            traverseRow(row, callback, [
                ...path,
                rowGapIndex,
                focusGapIndex + index,
            ])
        );
    });
    let newFocus: Focus = {
        ...focus,
        left: focusLeft,
        right: focusRight,
    };
    newFocus = callback.exit(newFocus, [...path, rowGapIndex]) || newFocus;

    // finish processing the row
    const rowRight = traverseNodes(row.right, callback, path, rowGapIndex + 1);
    let newRow: BreadcrumbRow = {
        ...row,
        left: rowLeft,
        right: rowRight,
    };
    newRow = callback.exit(newRow, path) || newRow;

    const newCrumb: Breadcrumb = {
        focus: newFocus,
        row: newRow,
    };

    return {
        ...newZipper,
        breadcrumbs: [newCrumb, ...newZipper.breadcrumbs],
    };
};

const traverseRow = (
    row: types.Row,
    callback: {
        enter?: <U extends types.Node>(node: U, path: number[]) => void;
        exit: <U extends types.Node>(node: U, path: number[]) => U | void;
    },
    path: number[],
): types.Row => {
    callback.enter?.(row, path);

    const newChildren = traverseNodes(row.children, callback, path, 0);
    const changed = newChildren.some(
        (child, index: number) => child !== row.children[index],
    );

    if (changed) {
        const newRow = {
            ...row,
            children: newChildren,
        };
        return callback.exit(newRow, path) || newRow;
    }

    return callback.exit(row, path) || row;
};

export const traverseNode = <T extends types.Node>(
    node: T,
    callback: {
        enter?: <U extends types.Node>(node: U, path: number[]) => void;
        exit: <U extends types.Node>(node: U, path: number[]) => U | void;
    },
    path: number[],
): T => {
    if (node.type === "atom") {
        callback.enter?.(node, path);
        return callback.exit(node, path) || node;
    }

    // The top-level node is a row
    if (node.type === "row") {
        const result = traverseRow(node, callback, path);
        // @ts-expect-error: TypeScript doesn't realize that T is equivalent to types.Row here
        return result;
    }

    callback.enter?.(node, path);
    const newChildren = node.children.map((row, index) => {
        return row && traverseRow(row, callback, [...path, index]);
    });

    const changed = newChildren.some(
        (child, index) => child !== node.children[index],
    );

    if (changed) {
        const newNode = {
            ...node,
            children: newChildren,
        };
        return callback.exit(newNode, path) || newNode;
    }

    return callback.exit(node, path) || node;
};

type ColorMap = Map<number, string>;

export const applyColorMapToEditorNode = (
    node: types.Node,
    colorMap: ColorMap,
): types.Node => {
    return traverseNode(
        node,
        {
            exit: (node, path) => {
                const color = colorMap.get(node.id);
                return color
                    ? {
                          ...node,
                          style: {
                              ...node.style,
                              color,
                          },
                      }
                    : node;
            },
        },
        [],
    );
};
