import type {Focus, Zipper} from "../reducer/types";
import * as types from "./types";

type ColorMap = Map<number, string>;

export const transformZipper = (
    zipper: Zipper,
    callback: <T extends Focus | types.Node>(node: T) => T,
): Zipper => {
    const breadcrumbs = zipper.breadcrumbs.map((crumb) => {
        const {row, focus} = crumb;

        return {
            focus: callback(focus),
            // TODO: remove 'style' from ZRow, BreadcrumbRow, and Row types
            row: {
                ...row,
                left: row.left.map(callback),
                selection: row.left.map(callback),
                right: row.left.map(callback),
            },
        };
    });

    // TODO: remove 'style' from ZRow, BreadcrumbRow, and Row types
    const row = {
        ...zipper.row,
        left: zipper.row.left.map(callback),
        selection: zipper.row.selection.map(callback),
        right: zipper.row.right.map(callback),
    };

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

export const transformNode = (
    node: types.Node,
    callback: <T extends types.Node>(node: T) => T,
): types.Node => {
    if (node.type === "atom") {
        return callback(node);
    }

    // The top-level node is a row
    if (node.type === "row") {
        return callback({
            ...node,
            children: node.children.map(
                // TypeScript can't handle this kind of polymorphism
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (node: any) => transformNode(node, callback),
            ),
        });
    }

    const newChildren = node.children.map(
        // TypeScript can't handle this kind of polymorphism
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (row: any) => {
            const result = row && {
                ...row,
                children: row.children.map(
                    // TypeScript can't handle this kind of polymorphism
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (node: any) => transformNode(node, callback),
                ),
            };
            return result && callback(result);
        },
    );

    return callback({
        ...node,
        // @ts-expect-error: TypeScript can't handle this kind of polymorphism
        children: newChildren,
    });
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
