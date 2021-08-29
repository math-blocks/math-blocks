import {getId} from "@math-blocks/core";
import * as Parser from "@math-blocks/parser-factory";

import * as types from "../token/types";
import {range, zip} from "./util";

// TODO: dedupe with reducer/vertical-work/types.ts by making it generic
export type Column = readonly types.TokenRow[];

// TODO: dedupe with reducer/vertical-work/types.ts by making it generic
export type VerticalWork = {
    readonly columns: readonly Column[];
    readonly colCount: number;
    readonly rowCount: number;

    readonly delimiters?: types.TokenTable["delimiters"];
    readonly rowStyles?: types.TokenTable["rowStyles"];
    readonly colStyles?: types.TokenTable["colStyles"];
};

const algebraTableToVerticalWork = (table: types.TokenTable): VerticalWork => {
    const columns: Column[] = [...range(0, table.colCount)].map((i) => {
        const column = [...range(0, table.rowCount)].map((j) => {
            const index = j * table.colCount + i;
            const cell = table.children[index] as types.TokenRow;
            return cell;
        });
        return column;
    });

    return {
        columns: columns,
        colCount: table.colCount,
        rowCount: table.rowCount,
        delimiters: table.delimiters,
        rowStyles: table.rowStyles,
        colStyles: table.colStyles,
    };
};

const isRelOp = (cell: types.TokenRow): boolean => {
    return (
        cell.children.length === 1 &&
        cell.children[0].type === "token" &&
        ["eq", "lt", "gt"].includes(cell.children[0].name)
    );
};

const isPlusMinusOp = (cell: types.TokenRow): boolean => {
    return (
        cell.children.length === 1 &&
        cell.children[0].type === "token" &&
        ["plus", "minus"].includes(cell.children[0].name)
    );
};

const isEmpty = (cell: types.TokenRow): boolean => {
    return cell.children.length === 0;
};

const isValue = (cell: types.TokenRow): boolean => {
    return !isEmpty(cell) && !isRelOp(cell) && !isPlusMinusOp(cell);
};

const isCellEmpty = (cell: types.TokenRow): boolean => {
    return cell.children.length === 0;
};

const mergeColumns = (first: Column, second: Column): Column => {
    // TODO:
    // edge case: number followed by "plus" operator in the first two columns

    return zip(first, second).map(([a, b]): types.TokenRow => {
        // TODO: update SourceLocation to include both a startPath and endPath
        // This assumes that a and b are cells in a table
        const loc = {
            // TODO: remove the last part of a.loc.path since this loc
            // is for the cells within the table and not the content within
            // the cells themselves.
            path: a.loc.path,
            start: 0,
            end: 2,
        };

        return {
            type: "row",
            children: [...a.children, ...b.children],
            loc: loc,
        };
    });
};

export const coalesceColumns = (
    columns: readonly Column[],
): readonly Column[] => {
    const nonEmptyColumns = columns.filter((col) => !col.every(isCellEmpty));

    // TODO:
    // edge case: number followed by "plus" operator in the first two columns

    const result: Column[] = [];

    let i = 0;
    while (i < nonEmptyColumns.length) {
        const firstCol = nonEmptyColumns[i++];
        if (firstCol.some(isPlusMinusOp)) {
            const secondCol = nonEmptyColumns[i++];
            result.push(mergeColumns(firstCol, secondCol));
        } else {
            if (
                i === 1 &&
                isValue(firstCol[1]) && // 'actions' row
                nonEmptyColumns[i] &&
                isPlusMinusOp(nonEmptyColumns[i][1])
            ) {
                i++;
            }
            result.push(firstCol);
        }
    }

    return result;
};

type Parser = {
    readonly parse: (arg0: readonly types.TokenNode[]) => Parser.types.Node;
};

// TODO: unit test this
export const parseVerticalWork = (
    table: types.TokenTable,
    parser: Parser,
): Parser.types.VertWork => {
    const work = algebraTableToVerticalWork(table);

    const {columns, rowCount} = work;

    const parse = (
        tokens: readonly types.TokenNode[],
    ): Parser.types.Node | null => {
        return tokens.length > 0 ? parser.parse(tokens) : null;
    };

    const indexOfEquals = columns.findIndex((col) => {
        const cell = col[0];
        return isRelOp(cell);
    });

    // The top row should always contain a relationship operator.
    if (indexOfEquals === -1) {
        throw new Error("No relationship operator in vertical work");
    }

    const leftColumns = coalesceColumns(columns.slice(0, indexOfEquals));
    const rightColumns = coalesceColumns(columns.slice(indexOfEquals + 1));

    const before = {
        left: leftColumns.map((col) => parse(col[0].children)),
        right: rightColumns.map((col) => parse(col[0].children)),
    };

    const actions = {
        left: leftColumns.map((col) => parse(col[1].children)),
        right: rightColumns.map((col) => parse(col[1].children)),
    };

    // TODO: handle the case where the columns only have two rows
    const after =
        rowCount === 3
            ? {
                  left: leftColumns.map((col) => parse(col[2].children)),
                  right: rightColumns.map((col) => parse(col[2].children)),
              }
            : undefined;

    return {
        type: "vert-work",
        id: getId(),
        loc: table.loc,
        before,
        actions,
        after,
    };
};
