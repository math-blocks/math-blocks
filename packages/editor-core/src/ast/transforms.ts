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
        enter?: <U extends types.Node>(node: U) => void;
        exit: <U extends types.Node>(node: U) => U | void;
    },
): readonly types.Node[] => nodes.map((node) => traverseNode(node, callback));

export type ZipperCallback = {
    enter?: <T extends Focus | types.Node | ZRow | BreadcrumbRow>(
        node: T,
    ) => void;
    exit: <T extends Focus | types.Node | ZRow | BreadcrumbRow>(
        node: T,
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
): Zipper => {
    const {breadcrumbs} = zipper;

    if (breadcrumbs.length === 0) {
        // Base case
        const {row} = zipper;

        callback.enter?.(row);
        let newRow = {
            ...row,
            left: traverseNodes(row.left, callback),
            selection: traverseNodes(row.selection, callback),
            right: traverseNodes(row.right, callback),
        };
        newRow = callback.exit(newRow) || newRow;

        return {
            row: newRow,
            breadcrumbs: breadcrumbs,
        };
    }

    // Recursive case
    const [crumb, ...restCrumbs] = breadcrumbs;

    const {row, focus} = crumb;

    // start processing the row
    callback.enter?.(row);
    const rowLeft = traverseNodes(row.left, callback);

    // start processing the focus
    callback.enter?.(focus);
    const focusLeft = focus.left.map((row) => {
        return row && traverseRow(row, callback);
    });

    // recurse
    const newZipper = traverseZipper(
        {
            ...zipper,
            breadcrumbs: restCrumbs,
        },
        callback,
    );

    // finish processing the focus
    const focusRight = focus.right.map((row) => {
        return row && traverseRow(row, callback);
    });
    let newFocus: Focus = {
        ...focus,
        left: focusLeft,
        right: focusRight,
    };
    newFocus = callback.exit(newFocus) || newFocus;

    // finish processing the row
    const rowRight = traverseNodes(row.right, callback);
    let newRow: BreadcrumbRow = {
        ...row,
        left: rowLeft,
        right: rowRight,
    };
    newRow = callback.exit(newRow) || newRow;

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
        enter?: <U extends types.Node>(node: U) => void;
        exit: <U extends types.Node>(node: U) => U | void;
    },
): types.Row => {
    callback.enter?.(row);

    const newChildren = traverseNodes(row.children, callback);
    const changed = newChildren.some(
        (child, index: number) => child !== row.children[index],
    );

    if (changed) {
        const newRow = {
            ...row,
            children: newChildren,
        };
        return callback.exit(newRow) || newRow;
    }

    return callback.exit(row) || row;
};

export const traverseNode = <T extends types.Node>(
    node: T,
    callback: {
        enter?: <U extends types.Node>(node: U) => void;
        exit: <U extends types.Node>(node: U) => U | void;
    },
): T => {
    if (node.type === "atom") {
        callback.enter?.(node);
        return callback.exit(node) || node;
    }

    // The top-level node is a row
    if (node.type === "row") {
        const result = traverseRow(node, callback);
        // @ts-expect-error: TypeScript doesn't realize that T is equivalent to types.Row here
        return result;
    }

    callback.enter?.(node);
    const newChildren = node.children.map((row) => {
        return row && traverseRow(row, callback);
    });

    const changed = newChildren.some(
        (child, index) => child !== node.children[index],
    );

    if (changed) {
        const newNode = {
            ...node,
            children: newChildren,
        };
        return callback.exit(newNode) || newNode;
    }

    return callback.exit(node) || node;
};

type ColorMap = Map<number, string>;

export const applyColorMapToEditorNode = (
    node: types.Node,
    colorMap: ColorMap,
): types.Node => {
    return traverseNode(node, {
        exit: (node) => {
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
    });
};
