import {toEqualEditorNodes} from "../test-util";

// import {parens} from "../parens";

expect.extend({toEqualEditorNodes});

describe("parens", () => {
    describe("selection", () => {
        test.todo("'(' wraps selection in non-pending parens");
        test.todo("')' wraps selection in non-pending parens");
    });

    describe("no selection", () => {
        // TODO: write tests
    });
});
