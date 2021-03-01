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

    const selection: Node[] = crumb.row.selection?.nodes ?? [];
    const focusedNode = focusToNode(crumb.focus, zrowToRow(zipper.row));
    if (crumb.row.selection?.dir === Dir.Left) {
        selection.push(focusedNode);
    } else if (crumb.row.selection?.dir === Dir.Right) {
        selection.unshift(focusedNode);
    } else {
        selection.push(focusedNode);
    }

    const row: ZRow = {
        id: crumb.row.id,
        type: "zrow",
        left: [], // We don't care where the cursor is since this ZRow is temporary
        selection: null,
        right: [...crumb.row.left, ...selection, ...crumb.row.right],
    };

    return zipperToRow({
        row,
        breadcrumbs: restCrumbs,
    });
};
