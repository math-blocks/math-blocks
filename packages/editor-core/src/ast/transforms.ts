import type {
    Focus,
    Zipper,
    Breadcrumb,
    BreadcrumbRow,
    ZRow,
} from "../reducer/types";
import * as types from "./types";

type ColorMap = Map<number, string>;

// TODO: instead of a single callback, we should have an object with
// 'enter' and 'exit' properties

export const transformNodes = (
    nodes: readonly types.Node[],
    callback: <U extends types.Node>(node: U) => U,
): readonly types.Node[] => nodes.map((node) => transformNode(node, callback));

export const transformZipper = (
    zipper: Zipper,
    callback: <T extends Focus | types.Node | ZRow | BreadcrumbRow>(
        node: T,
    ) => T,
): Zipper => {
    // TODO: check that things have actually changed before returning a new object

    const breadcrumbs = zipper.breadcrumbs.map((crumb) => {
        const {row, focus} = crumb;

        const newFocus: Focus = {
            ...focus,
            // @ts-expect-error: TypeScript can't map a union of tuples
            left: focus.left.map(
                (node) => node && transformNode(node, callback),
            ),
            // @ts-expect-error: TypeScript can't map a union of tuples
            right: focus.right.map(
                (node) => node && transformNode(node, callback),
            ),
        };

        const newRow: BreadcrumbRow = {
            ...row,
            left: transformNodes(row.left, callback),
            right: transformNodes(row.right, callback),
        };

        const newCrumb: Breadcrumb = {
            focus: callback(newFocus),
            row: callback(newRow),
        };

        return newCrumb;
    });

    const row = callback({
        ...zipper.row,
        left: transformNodes(zipper.row.left, callback),
        selection: transformNodes(zipper.row.selection, callback),
        right: transformNodes(zipper.row.right, callback),
    });

    return {row, breadcrumbs};
};

export const applyColorMapToZipper = (
    zipper: Zipper,
    colorMap: ColorMap,
): Zipper => {
    return transformZipper(zipper, (focusOrNode) => {
        const color = colorMap.get(focusOrNode.id);
        return color
            ? {
                  ...focusOrNode,
                  style: {
                      ...focusOrNode.style,
                      color,
                  },
              }
            : focusOrNode;
    });
};

const transformRow = (
    row: types.Row,
    callback: <T extends types.Node>(node: T) => T,
): types.Row => {
    const newChildren = transformNodes(row.children, callback);
    const changed = newChildren.some(
        (child, index: number) => child !== row.children[index],
    );

    return changed
        ? callback({
              ...row,
              children: newChildren,
          })
        : callback(row);
};

export const transformNode = <T extends types.Node>(
    node: T,
    callback: <U extends types.Node>(node: U) => U,
): T => {
    if (node.type === "atom") {
        return callback(node);
    }

    // The top-level node is a row
    if (node.type === "row") {
        const result = transformRow(node, callback);
        // @ts-expect-error: TypeScript doesn't realize that T is equivalent to types.Row here
        return result;
    }

    const newChildren = node.children.map((row) => {
        return row && transformRow(row, callback);
    });

    const changed = newChildren.some(
        (child, index) => child !== node.children[index],
    );

    return changed
        ? callback({
              ...node,
              children: newChildren,
          })
        : callback(node);
};

export const applyColorMapToEditorNode = (
    node: types.Node,
    colorMap: ColorMap,
): types.Node => {
    return transformNode(node, (node) => {
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
    });
};
