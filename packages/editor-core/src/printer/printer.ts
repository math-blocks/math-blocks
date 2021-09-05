/**
 * Converts a Semantic AST to an Editor AST.
 */
import * as Semantic from "@math-blocks/semantic";

import * as types from "../char/types";
import * as builders from "../char/builders";
import {Column, VerticalWork} from "../reducer/vertical-work/types";
import {
    isCellPlusMinus,
    isCellEmpty,
    verticalWorkToTable,
} from "../reducer/vertical-work/util";
import {zip} from "../parser/util";
import {NodeType} from "../shared-types";

// TODO: when parsing editor nodes provide some way to link to the IDs of
// the original nodes, even if they don't appear in the semantic tree as
// is the case with most operators

const getChildren = (
    expr: Semantic.types.Node,
    oneToOne: boolean,
): types.CharNode[] => {
    const children: types.CharNode[] = [];

    const node = _print(expr, oneToOne);
    if (node.type === "row") {
        children.push(...node.children);
    } else {
        children.push(node);
    }

    return children;
};

const _cellToCharRow = (
    cell: Semantic.types.Node | null,
    oneToOne: boolean,
): types.CharRow => {
    const charNode: types.CharNode = cell
        ? _print(cell, oneToOne)
        : builders.row([]);

    return charNode.type === "row" ? charNode : builders.row([charNode]);
};

const _vertAddToColumns = (
    oneToOne: boolean,
    originalTerms: readonly (Semantic.types.NumericNode | null)[],
    actionTerms: readonly (Semantic.types.NumericNode | null)[],
    resultTerms?: readonly (Semantic.types.NumericNode | null)[],
): Column[] => {
    const columns: Column[] = [];

    const firstOriginalTermIndex = originalTerms.findIndex(
        (cell) => cell != null,
    );
    const firstActionTermIndex = actionTerms.findIndex((cell) => cell != null);
    const firstResultTermIndex =
        resultTerms?.findIndex((cell) => cell != null) ?? -1;

    const getOperator = (node: Semantic.types.NumericNode): types.CharAtom => {
        return node.type === Semantic.NodeType.Neg && node.subtraction
            ? builders.char("\u2212")
            : builders.char("+");
    };
    const getValue = (
        node: Semantic.types.NumericNode | null,
    ): types.CharRow => {
        return node?.type === Semantic.NodeType.Neg && node.subtraction
            ? _cellToCharRow(node.arg, oneToOne)
            : _cellToCharRow(node, oneToOne);
    };

    const createColumn = (
        originalTermCell: types.CharRow,
        actionTermCell: types.CharRow,
        resultTermCell?: types.CharRow,
    ): Column => {
        return typeof resultTermCell === "object"
            ? [originalTermCell, actionTermCell, resultTermCell]
            : [originalTermCell, actionTermCell];
    };

    for (let i = 0; i < originalTerms.length; i++) {
        const originalTerm = originalTerms[i];
        const actionTerm = actionTerms[i];
        const resultTerm = resultTerms?.[i];

        if (
            // Operators can appear before the first action term
            actionTerm ||
            // But can only after the first terms in original and result rows
            (originalTerm && i > firstOriginalTermIndex) ||
            (resultTerm && i > firstResultTermIndex)
        ) {
            columns.push(
                createColumn(
                    builders.row(
                        originalTerm && i > firstOriginalTermIndex
                            ? [getOperator(originalTerm)]
                            : [],
                    ),
                    builders.row(actionTerm ? [getOperator(actionTerm)] : []),
                    typeof resultTerm === "object"
                        ? builders.row(
                              resultTerm && i > 0
                                  ? [getOperator(resultTerm)]
                                  : [],
                          )
                        : undefined,
                ),
            );
        }

        columns.push(
            createColumn(
                getValue(originalTerm),
                getValue(actionTerm),
                typeof resultTerm === "object"
                    ? getValue(resultTerm)
                    : undefined,
            ),
        );

        if (
            i == firstActionTermIndex &&
            actionTerm &&
            firstActionTermIndex < firstOriginalTermIndex
        ) {
            // Let's post-process the table instead
            columns.push(
                createColumn(
                    builders.row([]),
                    builders.row([builders.char("+")]),
                    typeof resultTerm === "object"
                        ? builders.row([])
                        : undefined,
                ),
            );
        }
    }

    const hasOperatorOrEmptyCells = (col: Column): boolean => {
        return col.every((cell) => isCellEmpty(cell) || isCellPlusMinus(cell));
    };

    // Post-process columns to enforce additional constraints that are difficult
    // to enforce during the initial pass.
    const processedColumns: Column[] = [];
    let i = 0;
    while (i < columns.length) {
        const currentCol = columns[i];
        // See if we can remove the leading operator from the actions row.
        if (i === 0 && isCellPlusMinus(currentCol[1])) {
            const nextCol = columns[i + 1];
            // If the first action in the actions row is adding/subtracting from
            // the first term in the 'original' row then we allow the leading
            // operator to remain.
            if (isCellEmpty(nextCol[0])) {
                i += 1;
                continue;
            }
        }
        if (hasOperatorOrEmptyCells(currentCol)) {
            const nextCol = columns[i + 1];
            if (hasOperatorOrEmptyCells(nextCol)) {
                const mergedCol = zip(currentCol, nextCol).map(
                    ([currentCell, nextCell]) => {
                        // Prefer the operator from the next cell if there is one.
                        return isCellPlusMinus(nextCell)
                            ? nextCell
                            : currentCell;
                    },
                );
                processedColumns.push(mergedCol);
                i += 2;
                continue;
            }
        }
        processedColumns.push(currentCol);
        i += 1;
    }

    return processedColumns;
};

// TODO: write more tests for this
const _print = (
    expr: Semantic.types.Node,
    oneToOne: boolean,
): types.CharNode => {
    switch (expr.type) {
        case Semantic.NodeType.Identifier: {
            // TODO: handle multi-character identifiers, e.g. sin, cos, etc.
            // TODO: handle subscripts

            return builders.char(expr.name);
        }
        case Semantic.NodeType.Number: {
            // How do we avoid creating a bunch of ids that we immediately
            // throw away because this number is part of a larger expression
            // and thus contained within a larger row?
            return builders.row(
                expr.value.split("").map((char) => builders.char(char)),
            );
        }
        case Semantic.NodeType.Add: {
            const children: types.CharNode[] = [];

            for (let i = 0; i < expr.args.length; i++) {
                const arg = expr.args[i];
                if (i > 0) {
                    if (arg.type === Semantic.NodeType.Neg && arg.subtraction) {
                        children.push(builders.char("\u2212"));
                    } else {
                        children.push(builders.char("+"));
                    }
                } else {
                    if (arg.type === Semantic.NodeType.Neg && arg.subtraction) {
                        console.warn(
                            "leading subtraction term should be simple negation",
                        );
                        children.push(builders.char("\u2212"));
                    }
                }

                // number is returned as a row so if we do this check, every
                // number will be encapsulated in parens.
                const node = _print(arg, oneToOne);
                if (node.type === "row") {
                    const inner =
                        arg.type === Semantic.NodeType.Neg && arg.subtraction
                            ? // strip off the leading "-"
                              node.children.slice(1)
                            : node.children;

                    if (arg.type === Semantic.NodeType.Add) {
                        children.push(
                            builders.delimited(
                                inner,
                                builders.char("("),
                                builders.char(")"),
                            ),
                        );
                    } else {
                        children.push(...inner);
                    }
                } else {
                    children.push(node);
                }
            }

            return builders.row(children);
        }
        case Semantic.NodeType.Mul: {
            const children: types.CharNode[] = [];

            const wrapAll = expr.args.some((arg, index) => {
                if (arg.type === Semantic.NodeType.Number && index > 0) {
                    return true;
                }
                if (
                    arg.type === Semantic.NodeType.Neg &&
                    (index > 0 || oneToOne)
                ) {
                    return true;
                }
                if (
                    arg.type === Semantic.NodeType.Div &&
                    expr.implicit &&
                    index > 0
                ) {
                    return true;
                }
                if (arg.type === Semantic.NodeType.Mul && expr.implicit) {
                    return true;
                }
                return false;
            });

            for (const arg of expr.args) {
                // TODO: we probably also want to wrap things like (a * b)(x * y)
                const wrap =
                    (wrapAll && expr.implicit) ||
                    arg.type === Semantic.NodeType.Add;

                if (wrap) {
                    children.push(
                        builders.delimited(
                            getChildren(arg, oneToOne),
                            builders.char("("),
                            builders.char(")"),
                        ),
                    );
                } else {
                    children.push(...getChildren(arg, oneToOne));
                }

                if (!expr.implicit) {
                    children.push(builders.char("\u00B7"));
                }
            }

            if (!expr.implicit) {
                children.pop(); // remove extra "*"
            }

            return builders.row(children);
        }
        case Semantic.NodeType.Neg: {
            if (
                expr.arg.type === Semantic.NodeType.Number ||
                expr.arg.type === Semantic.NodeType.Identifier ||
                expr.arg.type === Semantic.NodeType.Div ||
                (expr.arg.type === Semantic.NodeType.Neg &&
                    !expr.arg.subtraction) ||
                (expr.arg.type === Semantic.NodeType.Mul &&
                    expr.arg.implicit) ||
                expr.arg.type === Semantic.NodeType.Power // pow has a higher precedence
            ) {
                return builders.row([
                    builders.char("\u2212"),
                    ...getChildren(expr.arg, oneToOne),
                ]);
            } else {
                return builders.row([
                    builders.char("\u2212"),
                    builders.delimited(
                        getChildren(expr.arg, oneToOne),
                        builders.char("("),
                        builders.char(")"),
                    ),
                ]);
            }
        }
        case Semantic.NodeType.Div: {
            const numerator = _print(expr.args[0], oneToOne);
            const denominator = _print(expr.args[1], oneToOne);
            return builders.frac(
                numerator.type === "row" ? numerator.children : [numerator],
                denominator.type === "row"
                    ? denominator.children
                    : [denominator],
            );
        }
        case Semantic.NodeType.Equals: {
            const children: types.CharNode[] = [];

            for (const arg of expr.args) {
                children.push(...getChildren(arg, oneToOne));
                children.push(builders.char("="));
            }

            children.pop(); // remove extra "="

            return builders.row(children);
        }
        case Semantic.NodeType.Power: {
            const {base, exp} = expr;

            if (
                base.type === Semantic.NodeType.Identifier ||
                base.type === Semantic.NodeType.Number
            ) {
                return builders.row([
                    ...getChildren(base, oneToOne),
                    builders.subsup(undefined, getChildren(exp, oneToOne)),
                ]);
            } else {
                return builders.row([
                    builders.delimited(
                        getChildren(base, oneToOne),
                        builders.char("("),
                        builders.char(")"),
                    ),
                    builders.subsup(undefined, getChildren(exp, oneToOne)),
                ]);
            }
        }
        case Semantic.NodeType.Parens: {
            const children: types.CharNode[] = [
                builders.delimited(
                    getChildren(expr.arg, oneToOne),
                    builders.char("("),
                    builders.char(")"),
                ),
            ];

            return builders.row(children);
        }
        case Semantic.NodeType.VerticalAdditionToRelation: {
            const columns: Column[] = [];

            // TODO: insert operators
            // - operators between terms
            // - operators in front of actions
            // - operators after an initial action if the action is alone in the first column

            columns.push(
                ..._vertAddToColumns(
                    oneToOne,
                    expr.originalRelation.left,
                    expr.actions.left,
                    expr.resultingRelation?.left,
                ),
            );

            if (expr.resultingRelation) {
                columns.push([
                    builders.row([builders.char("=")]),
                    builders.row([]),
                    builders.row([builders.char("=")]),
                ]);
            } else {
                columns.push([
                    builders.row([builders.char("=")]),
                    builders.row([]),
                ]);
            }

            columns.push(
                ..._vertAddToColumns(
                    oneToOne,
                    expr.originalRelation.right,
                    expr.actions.right,
                    expr.resultingRelation?.right,
                ),
            );

            // TODO: assert that expr.before.length === expr.actions.length === expr.after.length

            const work: VerticalWork = {
                type: NodeType.Table,
                subtype: "algebra",
                id: expr.id,
                style: {},
                columns,
                colCount: columns.length,
                rowCount: expr.resultingRelation ? 3 : 2,
            };

            return verticalWorkToTable(work);
        }
        default: {
            throw new Error(`print doesn't handle ${expr.type} nodes yet`);
        }
    }
};

export const print = (
    expr: Semantic.types.Node,
    oneToOne = false,
): types.CharRow => {
    const node = _print(expr, oneToOne);
    if (node.type === "row") {
        return node;
    }
    return builders.row([node]);
};
