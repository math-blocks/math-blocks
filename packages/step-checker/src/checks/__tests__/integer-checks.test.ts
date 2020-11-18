import {serializer} from "@math-blocks/semantic";
import {parse} from "@math-blocks/text-parser";
import {parse as _parse} from "@math-blocks/editor-parser";
import * as Editor from "@math-blocks/editor";
import * as Semantic from "@math-blocks/semantic";

import {checkStep} from "../test-util";
import {deepEquals} from "../util";

expect.addSnapshotSerializer(serializer);

type ID = {
    id: number;
};

const myParse = (text: string): Semantic.Expression => {
    const node = Editor.print(parse(text)) as Editor.Row<Editor.Glyph, ID>;
    return _parse(node);
};

expect.extend({
    toParseLike(received, expected) {
        if (deepEquals(received, myParse(expected))) {
            return {
                message: () => `expected steps not to match`,
                pass: true,
            };
        }
        return {
            message: () => `expected steps not to match`,
            pass: false,
        };
    },
});

describe("Integer checks", () => {
    it("a + -a -> 0", () => {
        const result = checkStep("a + -a", "0");

        expect(result).toBeTruthy();
        expect(result.steps[0].nodes[0]).toParseLike("a + -a");
        expect(result.steps[0].nodes[0]).toMatchInlineSnapshot(`
            (add
              a
              (neg a))
        `);
        expect(result.steps[0].nodes[1]).toMatchInlineSnapshot(`0`);
        expect(result.steps[0].message).toEqual("adding inverse");
    });

    it("1 + a + -a -> 1", () => {
        const result = checkStep("1 + a + -a", "1");

        expect(result.steps.map((step) => step.message)).toEqual([
            "adding inverse",
            "addition with identity",
        ]);

        expect(result.steps[0].nodes[0]).toParseLike("1 + a + -a");
        expect(result.steps[0].nodes[1]).toParseLike("1 + 0");

        expect(result.steps[1].nodes[0]).toParseLike("1 + 0");
        expect(result.steps[1].nodes[1]).toParseLike("1");
    });

    it("a + 1 + -a -> 1", () => {
        const result = checkStep("a + 1 + -a", "1");

        expect(result.steps.map((step) => step.message)).toEqual([
            "adding inverse",
            "addition with identity",
        ]);

        expect(result.steps[0].nodes[0]).toParseLike("a + 1 + -a");
        expect(result.steps[0].nodes[1]).toParseLike("0 + 1");

        expect(result.steps[1].nodes[0]).toParseLike("0 + 1");
        expect(result.steps[1].nodes[1]).toParseLike("1");
    });

    it("a + 1 + b + -a + -b -> 1", () => {
        const result = checkStep("a + 1 + b + -a + -b", "1");

        expect(result.steps.map((step) => step.message)).toEqual([
            "adding inverse",
            "addition with identity",
        ]);

        expect(result.steps[0].nodes[0]).toParseLike("a + 1 + b + -a + -b");
        expect(result.steps[0].nodes[1]).toParseLike("0 + 1 + 0");

        expect(result.steps[1].nodes[0]).toParseLike("0 + 1 + 0");
        expect(result.steps[1].nodes[1]).toParseLike("1");
    });

    it("0 -> a + -a", () => {
        const result = checkStep("0", "a + -a");

        expect(result).toBeTruthy();

        expect(result.steps[0].nodes[0]).toMatchInlineSnapshot(`0`);
        expect(result.steps[0].nodes[1]).toMatchInlineSnapshot(`
            (add
              a
              (neg a))
        `);
        expect(result.steps[0].message).toEqual("adding inverse");
    });

    it("a + b + -a + c -> b + c", () => {
        const result = checkStep("a + b + -a + c", "b + c");

        expect(result).toBeTruthy();
        expect(result.steps.map((reason) => reason.message)).toEqual([
            "adding inverse",
            "addition with identity",
        ]);
    });

    it("a - b -> a + -b", () => {
        const result = checkStep("a - b", "a + -b");

        expect(result).toBeTruthy();
        expect(result.steps.map((reason) => reason.message)).toEqual([
            "subtracting is the same as adding the inverse",
        ]);

        expect(result.steps[0].nodes[0]).toParseLike("a - b");
        expect(result.steps[0].nodes[1]).toParseLike("a + -b");
    });

    it("a - bc -> a + -bc", () => {
        const result = checkStep("a - bc", "a + -bc");

        expect(result).toBeTruthy();
        expect(result.steps.map((reason) => reason.message)).toEqual([
            "subtracting is the same as adding the inverse",
            "move negation inside multiplication",
        ]);

        expect(result.steps[0].nodes[1]).toMatchInlineSnapshot(`
            (add
              a
              (neg (mul.imp b c)))
        `);
    });

    it("a + -b -> a - b", () => {
        const result = checkStep("a + -b", "a - b");

        expect(result).toBeTruthy();
        expect(result.steps.map((reason) => reason.message)).toEqual([
            "subtracting is the same as adding the inverse",
        ]);
    });

    it("a + b - c -> a + b + -c", () => {
        const result = checkStep("a + b - c", "a + b + -c");

        expect(result).toBeTruthy();
        expect(result.steps.map((reason) => reason.message)).toEqual([
            "subtracting is the same as adding the inverse",
        ]);
    });

    it("a - b - c -> a + -b + -c", () => {
        const result = checkStep("a - b - c", "a + -b + -c");

        expect(result).toBeTruthy();
        expect(result.steps[0].nodes[0]).toMatchInlineSnapshot(`
            (add
              a
              (neg.sub b)
              (neg.sub c))
        `);
        expect(result.steps[0].nodes[1]).toMatchInlineSnapshot(`
            (add
              a
              (neg b)
              (neg.sub c))
        `);
        expect(result.steps[0].message).toEqual(
            "subtracting is the same as adding the inverse",
        );

        expect(result.steps[1].nodes[0]).toMatchInlineSnapshot(`
            (add
              a
              (neg b)
              (neg.sub c))
        `);
        expect(result.steps[1].nodes[1]).toMatchInlineSnapshot(`
            (add
              a
              (neg b)
              (neg c))
        `);
        expect(result.steps[1].message).toEqual(
            "subtracting is the same as adding the inverse",
        );
    });

    it("a - b - c -> a - b + -c", () => {
        const result = checkStep("a - b - c", "a - b + -c");

        expect(result).toBeTruthy();

        expect(result.steps[0].nodes[0]).toMatchInlineSnapshot(`
            (add
              a
              (neg.sub b)
              (neg.sub c))
        `);

        expect(result.steps[0].nodes[1]).toMatchInlineSnapshot(`
            (add
              a
              (neg.sub b)
              (neg c))
        `);

        expect(result.steps.map((reason) => reason.message)).toEqual([
            "subtracting is the same as adding the inverse",
        ]);
    });

    it("a - -b -> a + --b -> a + b", () => {
        const result = checkStep("a - -b", "a + b");

        expect(result).toBeTruthy();

        expect(result.steps[0].nodes[0]).toMatchInlineSnapshot(`
            (add
              a
              (neg.sub (neg b)))
        `);
        expect(result.steps[0].nodes[1]).toMatchInlineSnapshot(`
            (add
              a
              (neg (neg b)))
        `);
        expect(result.steps[0].message).toEqual(
            "subtracting is the same as adding the inverse",
        );

        // TODO: figure out how to for hreplace the --b in a + --b with b to
        // get the full expression for each step.  Having the individual
        // parts is great too ighlighting purposes.
        // If we give each of the nodes an ID then we should be able to
        // sequentially swap out each node from the AST in the sequence
        // of substeps.
        expect(result.steps[1].nodes[0]).toMatchInlineSnapshot(`(neg (neg b))`);
        expect(result.steps[1].nodes[1]).toMatchInlineSnapshot(`b`);
        expect(result.steps[1].message).toEqual(
            "negative of a negative is positive",
        );

        expect(result.steps).toHaveLength(2);
    });

    it("a + b -> a + --b -> a - -b", () => {
        const result = checkStep("a + b", "a - -b");

        expect(result).toBeTruthy();
        expect(result.steps.map((reason) => reason.message)).toEqual([
            "negative of a negative is positive",
            "subtracting is the same as adding the inverse",
        ]);

        expect(result.steps[0].nodes[0]).toMatchInlineSnapshot(`b`);
        expect(result.steps[0].nodes[1]).toMatchInlineSnapshot(`(neg (neg b))`);
        expect(result.steps[1].nodes[0]).toMatchInlineSnapshot(`
            (add
              a
              (neg (neg b)))
        `);
        expect(result.steps[1].nodes[1]).toMatchInlineSnapshot(`
            (add
              a
              (neg.sub (neg b)))
        `);
    });

    it("a - a -> 0", () => {
        const result = checkStep("a - a", "0");

        expect(result).toBeTruthy();
        expect(result.steps.map((reason) => reason.message)).toEqual([
            "subtracting is the same as adding the inverse",
            "adding inverse",
        ]);
    });

    it("--a -> a", () => {
        const result = checkStep("--a", "a");

        expect(result).toBeTruthy();
        expect(result.steps[0].message).toEqual(
            "negative of a negative is positive",
        );
    });

    it("a -> --a", () => {
        const result = checkStep("a", "--a");

        expect(result).toBeTruthy();
        expect(result.steps[0].nodes[0]).toMatchInlineSnapshot(`a`);
        expect(result.steps[0].nodes[1]).toMatchInlineSnapshot(`(neg (neg a))`);
        expect(result.steps[0].message).toEqual(
            "negative of a negative is positive",
        );

        expect(result.steps).toHaveLength(1);
    });

    it("----a -> --a", () => {
        const result = checkStep("----a", "--a");

        expect(result).toBeTruthy();
        expect(result.steps.map((reason) => reason.message)).toEqual([
            "negative of a negative is positive",
        ]);
    });

    it("--a -> ----a", () => {
        const result = checkStep("--a", "----a");

        expect(result).toBeTruthy();
        expect(result.steps.map((reason) => reason.message)).toEqual([
            "negative of a negative is positive",
        ]);
        // NOTE: This is only showing the innert most `a` since we run checks
        // on args first before fraction and integer checks
        expect(result.steps[0].nodes[0]).toMatchInlineSnapshot(`a`);
        expect(result.steps[0].nodes[1]).toMatchInlineSnapshot(`(neg (neg a))`);

        expect(result.steps).toHaveLength(1);
    });

    it("----a -> a", () => {
        const result = checkStep("----a", "a");

        expect(result).toBeTruthy();
        expect(result.steps[0].nodes[0]).toMatchInlineSnapshot(
            `(neg (neg (neg (neg a))))`,
        );
        expect(result.steps[0].nodes[1]).toMatchInlineSnapshot(`(neg (neg a))`);
        expect(result.steps[1].nodes[0]).toMatchInlineSnapshot(`(neg (neg a))`);
        expect(result.steps[1].nodes[1]).toMatchInlineSnapshot(`a`);

        expect(result.steps[0].message).toEqual(
            "negative of a negative is positive",
        );
        expect(result.steps[1].message).toEqual(
            "negative of a negative is positive",
        );

        expect(result.steps).toHaveLength(2);
    });

    it("a -> ----a", () => {
        const result = checkStep("a", "----a");

        expect(result).toBeTruthy();

        expect(result.steps[0].nodes[0]).toMatchInlineSnapshot(`a`);
        expect(result.steps[0].nodes[1]).toMatchInlineSnapshot(`(neg (neg a))`);
        expect(result.steps[0].message).toEqual(
            "negative of a negative is positive",
        );

        expect(result.steps[1].nodes[0]).toMatchInlineSnapshot(`(neg (neg a))`);
        expect(result.steps[1].nodes[1]).toMatchInlineSnapshot(
            `(neg (neg (neg (neg a))))`,
        );
        expect(result.steps[1].message).toEqual(
            "negative of a negative is positive",
        );

        expect(result.steps).toHaveLength(2);
    });

    it("-a -> -1 * a", () => {
        const result = checkStep("-a", "-1 * a");

        expect(result).toBeTruthy();
        expect(result.steps.map((reason) => reason.message)).toEqual([
            "negation is the same as multipling by negative one",
        ]);
    });

    it("1 + -xy -> 1 - xy", () => {
        const result = checkStep("1 + -xy", "1 - xy");

        expect(result).toBeTruthy();
        expect(result.steps.map((reason) => reason.message)).toEqual([
            "move negation out of multiplication",
            "subtracting is the same as adding the inverse",
        ]);

        expect(result.steps[0].nodes[0]).toParseLike("-xy");
        expect(result.steps[0].nodes[1]).toParseLike("-(xy)");

        expect(result.steps[1].nodes[0]).toParseLike("1 + -(xy)");
        expect(result.steps[1].nodes[1]).toParseLike("1 - xy");
    });

    it("(x)(y)(-z) -> -xyz", () => {
        const result = checkStep("(x)(y)(-z)", "-xyz");

        expect(result).toBeTruthy();
        expect(result.steps.map((reason) => reason.message)).toEqual([
            "move negative to first factor",
        ]);
    });

    it("(x)(-y)(-z) -> xyz", () => {
        const result = checkStep("(x)(-y)(-z)", "xyz");

        expect(result).toBeTruthy();
    });

    it("xyz -> (x)(-y)(-z)", () => {
        const result = checkStep("xyz", "(x)(-y)(-z)");

        expect(result).toBeTruthy();
        expect(result.steps.map((reason) => reason.message)).toEqual([
            "a positive is the same as multiplying two negatives",
        ]);
    });

    it("1 + (x)(-y) -> 1 - xy", () => {
        const result = checkStep("1 + (x)(-y)", "1 - xy");

        expect(result).toBeTruthy();
        expect(result.steps.map((reason) => reason.message)).toEqual([
            "move negative to first factor",
            "move negation out of multiplication",
            "subtracting is the same as adding the inverse",
        ]);
    });

    it("-1*a -> -a", () => {
        const result = checkStep("-1 * a", "-a");

        expect(result).toBeTruthy();
        expect(result.steps.map((reason) => reason.message)).toEqual([
            "negation is the same as multipling by negative one",
        ]);
    });

    it("(-a)(-b) -> ab", () => {
        const result = checkStep("(-a)(-b)", "ab");

        expect(result).toBeTruthy();
        expect(result.steps.map((reason) => reason.message)).toEqual([
            "multiplying two negatives is a positive",
        ]);
    });

    it("ab -> (-a)(-b)", () => {
        const result = checkStep("ab", "(-a)(-b)");

        expect(result).toBeTruthy();
        expect(result.steps.map((reason) => reason.message)).toEqual([
            "a positive is the same as multiplying two negatives",
        ]);
    });

    it("-(a + b) -> -1(a + b) -> -1a + -1b -> -a + -b", () => {
        const result = checkStep("-(a + b)", "-a + -b");

        expect(result).toBeTruthy();
        expect(result.steps.map((step) => step.message)).toEqual([
            "negation is the same as multipling by negative one",
            "distribution",
            "negation is the same as multipling by negative one",
            // "negation is the same as multipling by negative one",
        ]);

        expect(result.steps[0].nodes[0]).toParseLike("-(a + b)");
        expect(result.steps[0].nodes[1]).toParseLike("-1(a + b)");

        expect(result.steps[1].nodes[0]).toParseLike("-1(a + b)");
        expect(result.steps[1].nodes[1]).toParseLike("-1a + -1b");

        expect(result.steps[2].nodes[0]).toMatchInlineSnapshot(`
            (add
              (mul.imp
                (neg 1)
                a)
              (mul.imp
                (neg 1)
                b))
        `);
        expect(result.steps[2].nodes[1]).toMatchInlineSnapshot(`
            (add
              (neg a)
              (neg b))
        `);

        // expect(result.steps[3].nodes[0]).toParseLike("-1b");
        // expect(result.steps[3].nodes[1]).toParseLike("-b");
    });

    it("-a + -b -> -(a + b)", () => {
        const result = checkStep("-a + -b", "-(a + b)");

        expect(result).toBeTruthy();

        expect(result.steps.map((step) => step.message)).toEqual([
            "negation is the same as multipling by negative one",
            "factoring",
            "negation is the same as multipling by negative one",
        ]);

        expect(result.steps[0].nodes[0]).toParseLike("-a + -b");
        expect(result.steps[0].nodes[1]).toParseLike("-1a + -1b");

        expect(result.steps[1].nodes[0]).toParseLike("-1a + -1b");
        expect(result.steps[1].nodes[1]).toParseLike("-1(a + b)");

        expect(result.steps[2].nodes[0]).toParseLike("-1(a + b)");
        expect(result.steps[2].nodes[1]).toParseLike("-(a + b)");
    });
});
