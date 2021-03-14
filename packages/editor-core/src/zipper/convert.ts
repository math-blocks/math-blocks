import type {Zipper, ZRow} from "./types";
import type {Row, Node} from "../types";

import {focusToNode, zrowToRow} from "./util";
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

    const row: ZRow = {
        id: crumb.row.id,
        type: "zrow",
        left: [], // We don't care where the cursor is since this ZRow is temporary
        selection: null,
        right: newRight,
    };

    return zipperToRow({
        row,
        breadcrumbs: restCrumbs,
    });
};
