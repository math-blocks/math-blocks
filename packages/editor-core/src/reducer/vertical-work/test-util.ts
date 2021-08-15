import assert from "assert";
import {getId} from "@math-blocks/core";

import {row} from "../test-util";
import * as util from "../util";

import type {ZTable, Zipper, BreadcrumbRow} from "../types";

export const toEqualZTable = (
    expected: ZTable,
    actual: ZTable,
): {readonly message: () => string; readonly pass: boolean} => {
    if (expected.colCount !== actual.colCount) {
        return {
            message: () =>
                `Expected ZTable to have ${expected.colCount} columns but had ${actual.colCount} instead.`,
            pass: false,
        };
    }

    if (expected.rowCount !== actual.rowCount) {
        return {
            message: () =>
                `Expected ZTable to have ${expected.rowCount} rows but had ${actual.rowCount} instead.`,
            pass: false,
        };
    }

    const expectedCursorCol = expected.left.length % expected.colCount;
    const actualCursorCol = actual.left.length % actual.colCount;

    if (expectedCursorCol !== actualCursorCol) {
        return {
            message: () =>
                `Expected cursor to be in column ${expectedCursorCol} but was in column ${actualCursorCol}.`,
            pass: false,
        };
    }

    const expectedCursorRow = Math.floor(
        expected.left.length / expected.colCount,
    );
    const actualCursorRow = Math.floor(
        expected.left.length / expected.colCount,
    );

    if (expectedCursorRow !== actualCursorRow) {
        return {
            message: () =>
                `Expected cursor to be in row ${expectedCursorRow} but was in row ${actualCursorRow}.`,
            pass: false,
        };
    }

    for (let i = 0; i < expected.left.length; i++) {
        const actualLeft = actual.left[i];
        const expectedLeft = expected.left[i];
        if (actualLeft && expectedLeft) {
            expect(actualLeft.children).toEqualEditorNodes(
                expectedLeft.children,
            );
        }
    }

    for (let i = 0; i < expected.right.length; i++) {
        const actualRight = actual.right[i];
        const expectedRight = expected.right[i];
        if (actualRight && expectedRight) {
            expect(actualRight.children).toEqualEditorNodes(
                expectedRight.children,
            );
        }
    }

    return {
        message: () => "Everything passed",
        pass: true,
    };
};

export const toEqualZipper = (
    expected: Zipper,
    actual: Zipper,
): {readonly message: () => string; readonly pass: boolean} => {
    const actualCrumb = actual.breadcrumbs[actual.breadcrumbs.length - 1];
    const expectedCrumb = expected.breadcrumbs[expected.breadcrumbs.length - 1];

    if (
        actualCrumb.focus.type === "ztable" &&
        expectedCrumb.focus.type === "ztable"
    ) {
        expect(actualCrumb.focus).toEqualZTable(expectedCrumb.focus);
        expect(actual.row.left).toEqualEditorNodes(expected.row.left);
        expect(actual.row.right).toEqualEditorNodes(expected.row.right);
    }

    return {
        message: () => "Everything passed",
        pass: true,
    };
};

export const textRepsToZipper = (...textReps: readonly string[]): Zipper => {
    const lines = textReps.map((line) =>
        line.split("|").map((cell) => cell.trim()),
    );

    assert.equal(lines[0].length, lines[1].length);

    const cells: string[] = [];
    for (const line of lines) {
        cells.push(...line);
    }
    const cursorIndex = cells.findIndex((cell) => cell.includes("@"));

    assert.notEqual(cursorIndex, -1);

    const focus: ZTable = {
        id: getId(),
        type: "ztable",
        subtype: "algebra",
        rowCount: lines.length,
        colCount: lines[0].length,
        left: cells.slice(0, cursorIndex).map(row),
        right: cells.slice(cursorIndex + 1).map(row),
        style: {},
    };

    const bcRow: BreadcrumbRow = {
        id: getId(),
        type: "bcrow",
        left: [],
        right: [],
        style: {},
    };

    const cursorCell = cells[cursorIndex];
    const [left, right] = cursorCell.split("@");

    const zipper: Zipper = {
        row: util.zrow(getId(), row(left).children, row(right).children),
        breadcrumbs: [
            {
                row: bcRow,
                focus: focus,
            },
        ],
    };

    return zipper;
};
