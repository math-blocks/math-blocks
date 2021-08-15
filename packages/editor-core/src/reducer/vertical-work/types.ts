import * as types from "../../ast/types";
import type {ZTable, Breadcrumb} from "../types";

export type Column = readonly types.Row[];

export type VerticalWork = {
    readonly columns: readonly Column[];
    readonly colCount: number;
    readonly rowCount: number;
    // The id of the cell in which the cursor resides.
    // We use an id for the cursor so that we can move it to the appropriate
    // cell after adding/removing columns.
    readonly cursorId: number;
    // Location of the cursor within a cell.
    readonly cursorIndex: number;
    readonly crumb: Breadcrumb;
    readonly rowStyles?: ZTable["rowStyles"];
};
