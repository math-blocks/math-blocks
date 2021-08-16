import {toEqualEditorNodes} from "../../test-util";
import {adjustColumns} from "../adjust-columns";
import {toEqualZTable, toEqualZipper, textRepsToZipper} from "../test-util";
import {zipperToVerticalWork, verticalWorkToZipper} from "../util";

import type {Zipper, ZTable} from "../../types";
import {ZVerticalWork} from "../types";

declare global {
    /* eslint-disable */
    namespace jest {
        interface Matchers<R, T> {
            toEqualZTable(actual: ZTable): R;
            toEqualZipper(actual: Zipper): R;
        }
    }
    /* eslint-enable */
}

expect.extend({toEqualZTable});
expect.extend({toEqualZipper});
expect.extend({toEqualEditorNodes});

const textRepsToVerticalWork = (
    ...textReps: readonly string[]
): ZVerticalWork => {
    const zipper = textRepsToZipper(...textReps);
    const work = zipperToVerticalWork(zipper);
    if (!work) {
        throw new Error("Couldn't convert Zipper to VerticalWork.");
    }
    return work;
};

describe("adjustColumns", () => {
    it("should return the original object if no changes were made", () => {
        const original = textRepsToVerticalWork(" |2x| |+|5| ", " |2x| |@| | ");

        const result = adjustColumns(original);

        expect(result).toBe(original);
    });

    it("should remove empty columns not adjancent to non-empty columns", () => {
        const original = textRepsToVerticalWork(
            " |2x| | |+|5| ",
            " |2x| | |@| | ",
        );

        const result = verticalWorkToZipper(adjustColumns(original));

        const expected = textRepsToZipper(" |2x| |+|5| ", " |2x| |@| | ");

        expect(result).toEqualZipper(expected);
    });

    it("should remove empty columns not adjancent to non-empty columns 2", () => {
        const original = textRepsToVerticalWork(
            " |2x| | | |+|5| ",
            " |2x| | | |@| | ",
        );

        const result = verticalWorkToZipper(adjustColumns(original));

        const expected = textRepsToZipper(" |2x| |+|5| ", " |2x| |@| | ");

        expect(result).toEqualZipper(expected);
    });

    it("should add an empty column to the left of a column with an operator", () => {
        const original = textRepsToVerticalWork(" |2x|+|5| ", " |2x|@| | ");

        const result = verticalWorkToZipper(adjustColumns(original));

        const expected = textRepsToZipper(" |2x| |+|5| ", " |2x| |@| | ");

        expect(result).toEqualZipper(expected);
    });

    it("should add empty columns at the beginning and end", () => {
        const original = textRepsToVerticalWork("2x| |+|5", "2x| |@| ");

        const result = verticalWorkToZipper(adjustColumns(original));

        const expected = textRepsToZipper(" |2x| |+|5| ", " |2x| |@| | ");

        expect(result).toEqualZipper(expected);
    });

    it("should remove empty columns within a row if the other row is empty", () => {
        const original = textRepsToVerticalWork(
            " |2x| |+@|5| ",
            " |  | |  | | ",
        );

        const result = verticalWorkToZipper(adjustColumns(original));

        const expected = textRepsToZipper(" |2x|+@|5| ", " |  |  | | ");

        expect(result).toEqualZipper(expected);
    });

    it("should move the cursor to the left if it was in a column is removed", () => {
        const original = textRepsToVerticalWork(" |2x|@|+|5| ", " |  | | | | ");

        const result = verticalWorkToZipper(adjustColumns(original));

        const expected = textRepsToZipper(" |2x@|+|5| ", " |   | | | ");

        expect(result).toEqualZipper(expected);
    });

    it("should move the cursor to the right if the first column was removed while it was in it", () => {
        const original = textRepsToVerticalWork("@| |2x| ", " | |2x| ");

        const result = verticalWorkToZipper(adjustColumns(original));

        const expected = textRepsToZipper("@|2x| ", " |2x| ");

        expect(result).toEqualZipper(expected);
    });

    describe("cursor in third row", () => {
        it("should move the cursor to the left if it was in a column is removed", () => {
            const original = textRepsToVerticalWork(
                " |2x| |+|5| ",
                " |  | | | | ",
                " |2x|@| | | ",
            );

            const result = verticalWorkToZipper(adjustColumns(original));

            const expected = textRepsToZipper("2x |+|5", "   | | ", "2x@| | ");

            expect(result).toEqualZipper(expected);
        });

        it("should move the cursor to the right if there are no non-empty columns to the left", () => {
            const original = textRepsToVerticalWork(
                " |2x| |+|5| ",
                " |  | | | | ",
                "@|2x| | | | ",
            );

            const result = verticalWorkToZipper(adjustColumns(original));

            const expected = textRepsToZipper(" 2x|+|5", "   | | ", "@2x| | ");

            expect(result).toEqualZipper(expected);
        });
    });

    it("should add empty columns around equals operators", () => {
        const original = textRepsToVerticalWork("2x|=|5", "2x|@| ");

        // TODO: create a matcher that encapsulates this
        const result = verticalWorkToZipper(adjustColumns(original));

        const expected = textRepsToZipper(" |2x| |=| |5| ", " |2x| |@| | | ");

        expect(result).toEqualZipper(expected);
    });
});
