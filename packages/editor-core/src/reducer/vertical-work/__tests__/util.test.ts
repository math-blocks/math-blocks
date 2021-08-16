import {toEqualEditorNodes} from "../../test-util";
import {
    tableToVerticalWork,
    verticalWorkToTable,
    verticalWorkToZipper,
    zipperToVerticalWork,
} from "../util";
import {
    textRepsToTable,
    textRepsToZipper,
    toEqualZipper,
    toEqualZTable,
} from "../test-util";
import {CharTable} from "packages/editor-core/src/char/types";
import {Zipper} from "../../types";

// NOTE: toEqualZTable is used by toEqualZipper
expect.extend({toEqualEditorNodes, toEqualZipper, toEqualZTable});

describe("Table - VerticalWork", () => {
    test("round trip", () => {
        const table: CharTable = textRepsToTable(
            " |2x|+     |5| ",
            " |  |\u2212|5| ",
        );

        const work = tableToVerticalWork(table);
        if (!work) {
            throw new Error("Couldn't create VerticalWork from CharTable");
        }
        const result = verticalWorkToTable(work);

        expect(result.children).toEqualEditorNodes(table.children);
        expect([result]).toEqualEditorNodes([table]);
    });
});

describe("Zipper - ZVerticalWork", () => {
    test("round trip", () => {
        const zipper: Zipper = textRepsToZipper(
            " |2x|+     |5 | ",
            " |  |\u2212|5@| ",
        );

        const work = zipperToVerticalWork(zipper);
        if (!work) {
            throw new Error("Couldn't create VerticalWork from CharTable");
        }
        const result = verticalWorkToZipper(work);

        expect(result).toEqualZipper(zipper);
    });
});
