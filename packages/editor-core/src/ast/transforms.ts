import type {
    Focus,
    Zipper,
    Breadcrumb,
    BreadcrumbRow,
    ZRow,
} from "../reducer/types";
import * as types from "./types";

export const transformNodes = (
    nodes: readonly types.Node[],
    callback: {
        enter?: <U extends types.Node>(node: U) => void;
        exit: <U extends types.Node>(node: U) => U;
    },
): readonly types.Node[] => nodes.map((node) => transformNode(node, callback));

export type ZipperCallback = {
    enter?: <T extends Focus | types.Node | ZRow | BreadcrumbRow>(
        node: T,
    ) => void;
    exit: <T extends Focus | types.Node | ZRow | BreadcrumbRow>(node: T) => T;
};

/**
 * Preform depth first traversal of a zipper.  Breadcrumbs are processed first
 * to last recursively followed by the row.  The nodes in each row are processed
 * left to right.
 */
export const transformZipper = (
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
            left: transformNodes(row.left, callback),
            selection: transformNodes(row.selection, callback),
            right: transformNodes(row.right, callback),
        };
        newRow = callback.exit(newRow);

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
    const rowLeft = transformNodes(row.left, callback);

    // start processing the focus
    callback.enter?.(focus);
    const focusLeft = focus.left.map((row) => {
        return row && transformRow(row, callback);
    });

    // recurse
    const newZipper = transformZipper(
        {
            ...zipper,
            breadcrumbs: restCrumbs,
        },
        callback,
    );

    // finish processing the focus
    const focusRight = focus.right.map((row) => {
        return row && transformRow(row, callback);
    });
    let newFocus: Focus = {
        ...focus,
        // @ts-expect-error: TypeScript can't map a union of tuples
        left: focusLeft,
        // @ts-expect-error: TypeScript can't map a union of tuples
        right: focusRight,
    };
    newFocus = callback.exit(newFocus);

    // finish processing the row
    const rowRight = transformNodes(row.right, callback);
    let newRow: BreadcrumbRow = {
        ...row,
        left: rowLeft,
        right: rowRight,
    };
    newRow = callback.exit(newRow);

    const newCrumb: Breadcrumb = {
        focus: newFocus,
        row: newRow,
    };

    return {
        ...newZipper,
        breadcrumbs: [newCrumb, ...newZipper.breadcrumbs],
    };
};

const transformRow = (
    row: types.Row,
    callback: {
        enter?: <U extends types.Node>(node: U) => void;
        exit: <U extends types.Node>(node: U) => U;
    },
): types.Row => {
    callback.enter?.(row);

    const newChildren = transformNodes(row.children, callback);
    const changed = newChildren.some(
        (child, index: number) => child !== row.children[index],
    );

    return changed
        ? callback.exit({
              ...row,
              children: newChildren,
          })
        : callback.exit(row);
};

export const transformNode = <T extends types.Node>(
    node: T,
    callback: {
        enter?: <U extends types.Node>(node: U) => void;
        exit: <U extends types.Node>(node: U) => U;
    },
): T => {
    if (node.type === "atom") {
        callback.enter?.(node);
        return callback.exit(node);
    }

    // The top-level node is a row
    if (node.type === "row") {
        const result = transformRow(node, callback);
        // @ts-expect-error: TypeScript doesn't realize that T is equivalent to types.Row here
        return result;
    }

    callback.enter?.(node);
    const newChildren = node.children.map((row) => {
        return row && transformRow(row, callback);
    });

    const changed = newChildren.some(
        (child, index) => child !== node.children[index],
    );

    return changed
        ? callback.exit({
              ...node,
              children: newChildren,
          })
        : callback.exit(node);
};

type ColorMap = Map<number, string>;

export const applyColorMapToEditorNode = (
    node: types.Node,
    colorMap: ColorMap,
): types.Node => {
    return transformNode(node, {
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
