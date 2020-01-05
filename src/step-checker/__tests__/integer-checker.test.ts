import {parse} from "../../text/text-parser";

import StepChecker, {Result} from "../step-checker";

import serializer from "../../semantic/semantic-serializer";

expect.addSnapshotSerializer(serializer);

const checker = new StepChecker();

const checkStep = (prev: string, next: string): Result => {
    return checker.checkStep(parse(prev), parse(next), []);
};

describe("IntegerChecker", () => {
    it("a + -a -> 0", () => {
        const result = checkStep("a + -a", "0");

        expect(result.equivalent).toBe(true);
        expect(result.reasons[0].nodes[0]).toMatchInlineSnapshot(`
            (add
              a
              (neg a))
        `);
        expect(result.reasons[0].nodes[1]).toMatchInlineSnapshot(`0`);
        expect(result.reasons[0].message).toEqual("adding inverse");
    });

    it("0 -> a + -a", () => {
        const result = checkStep("0", "a + -a");

        expect(result.equivalent).toBe(true);

        expect(result.reasons[0].nodes[0]).toMatchInlineSnapshot(`0`);
        expect(result.reasons[0].nodes[1]).toMatchInlineSnapshot(`
            (add
              a
              (neg a))
        `);
        expect(result.reasons[0].message).toEqual("adding inverse");
    });

    it("a + b + -a + c -> b + c", () => {
        const result = checkStep("a + b + -a + c", "b + c");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "adding inverse",
        ]);
    });

    it("a - b -> a + -b", () => {
        const result = checkStep("a - b", "a + -b");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "subtracting is the same as adding the inverse",
        ]);
    });

    it("a + -b -> a - b", () => {
        const result = checkStep("a + -b", "a - b");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "subtracting is the same as adding the inverse",
        ]);
    });

    it("a + b - c -> a + b + -c", () => {
        const result = checkStep("a + b - c", "a + b + -c");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "subtracting is the same as adding the inverse",
        ]);
    });

    it("a - b - c -> a + -b + -c", () => {
        const result = checkStep("a - b - c", "a + -b + -c");

        expect(result.equivalent).toBe(true);
        expect(result.reasons[0].nodes[0]).toMatchInlineSnapshot(`
            (add
              a
              (neg.sub b)
              (neg.sub c))
        `);
        expect(result.reasons[0].nodes[1]).toMatchInlineSnapshot(`
            (add
              a
              (neg b)
              (neg.sub c))
        `);
        expect(result.reasons[0].message).toEqual(
            "subtracting is the same as adding the inverse",
        );

        expect(result.reasons[1].nodes[0]).toMatchInlineSnapshot(`
            (add
              a
              (neg b)
              (neg.sub c))
        `);
        expect(result.reasons[1].nodes[1]).toMatchInlineSnapshot(`
            (add
              a
              (neg b)
              (neg c))
        `);
        expect(result.reasons[1].message).toEqual(
            "subtracting is the same as adding the inverse",
        );
    });

    it("a - b - c -> a - b + -c", () => {
        const result = checkStep("a - b - c", "a - b + -c");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "subtracting is the same as adding the inverse",
        ]);
    });

    it("a - -b -> a + --b -> a + b", () => {
        const result = checkStep("a - -b", "a + b");

        expect(result.equivalent).toBe(true);

        expect(result.reasons[0].nodes[0]).toMatchInlineSnapshot(`
            (add
              a
              (neg.sub (neg b)))
        `);
        expect(result.reasons[0].nodes[1]).toMatchInlineSnapshot(`
            (add
              a
              (neg (neg b)))
        `);
        expect(result.reasons[0].message).toEqual(
            "subtracting is the same as adding the inverse",
        );

        // TODO: figure out how to for hreplace the --b in a + --b with b to
        // get the full expression for each step.  Having the individual
        // parts is great too ighlighting purposes.
        // If we give each of the nodes an ID then we should be able to
        // sequentially swap out each node from the AST in the sequence
        // of substeps.
        expect(result.reasons[1].nodes[0]).toMatchInlineSnapshot(
            `(neg (neg b))`,
        );
        expect(result.reasons[1].nodes[1]).toMatchInlineSnapshot(`b`);
        expect(result.reasons[1].message).toEqual(
            "negative of a negative is positive",
        );

        expect(result.reasons).toHaveLength(2);
    });

    it("a + b -> a + --b -> a - -b", () => {
        const result = checkStep("a + b", "a - -b");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "negative of a negative is positive",
            "subtracting is the same as adding the inverse",
        ]);

        expect(result.reasons[0].nodes[0]).toMatchInlineSnapshot(`b`);
        expect(result.reasons[0].nodes[1]).toMatchInlineSnapshot(
            `(neg (neg b))`,
        );
        expect(result.reasons[1].nodes[0]).toMatchInlineSnapshot(`
            (add
              a
              (neg (neg b)))
        `);
        expect(result.reasons[1].nodes[1]).toMatchInlineSnapshot(`
            (add
              a
              (neg.sub (neg b)))
        `);
    });

    it("a - a -> 0", () => {
        const result = checkStep("a - a", "0");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "adding inverse",
        ]);
    });

    it("--a -> a", () => {
        const result = checkStep("--a", "a");

        expect(result.equivalent).toBe(true);
        expect(result.reasons[0].message).toEqual(
            "negative of a negative is positive",
        );
    });

    it("a -> --a", () => {
        const result = checkStep("a", "--a");

        expect(result.equivalent).toBe(true);
        expect(result.reasons[0].nodes[0]).toMatchInlineSnapshot(`a`);
        expect(result.reasons[0].nodes[1]).toMatchInlineSnapshot(
            `(neg (neg a))`,
        );
        expect(result.reasons[0].message).toEqual(
            "negative of a negative is positive",
        );

        expect(result.reasons).toHaveLength(1);
    });

    it("----a -> --a", () => {
        const result = checkStep("----a", "--a");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "negative of a negative is positive",
        ]);
    });

    it("--a -> ----a", () => {
        const result = checkStep("--a", "----a");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "negative of a negative is positive",
        ]);
        expect(result.reasons[0].nodes[0]).toMatchInlineSnapshot(
            `(neg (neg a))`,
        );
        expect(result.reasons[0].nodes[1]).toMatchInlineSnapshot(
            `(neg (neg (neg (neg a))))`,
        );

        expect(result.reasons).toHaveLength(1);
    });

    it("----a -> a", () => {
        const result = checkStep("----a", "a");

        expect(result.equivalent).toBe(true);
        expect(result.reasons[0].nodes[0]).toMatchInlineSnapshot(
            `(neg (neg (neg (neg a))))`,
        );
        expect(result.reasons[0].nodes[1]).toMatchInlineSnapshot(
            `(neg (neg a))`,
        );
        expect(result.reasons[1].nodes[0]).toMatchInlineSnapshot(
            `(neg (neg a))`,
        );
        expect(result.reasons[1].nodes[1]).toMatchInlineSnapshot(`a`);

        expect(result.reasons[0].message).toEqual(
            "negative of a negative is positive",
        );
        expect(result.reasons[1].message).toEqual(
            "negative of a negative is positive",
        );

        expect(result.reasons).toHaveLength(2);
    });

    it("a -> ----a", () => {
        const result = checkStep("a", "----a");

        expect(result.equivalent).toBe(true);

        expect(result.reasons[0].nodes[0]).toMatchInlineSnapshot(`a`);
        expect(result.reasons[0].nodes[1]).toMatchInlineSnapshot(
            `(neg (neg a))`,
        );
        expect(result.reasons[0].message).toEqual(
            "negative of a negative is positive",
        );

        expect(result.reasons[1].nodes[0]).toMatchInlineSnapshot(
            `(neg (neg a))`,
        );
        expect(result.reasons[1].nodes[1]).toMatchInlineSnapshot(
            `(neg (neg (neg (neg a))))`,
        );
        expect(result.reasons[1].message).toEqual(
            "negative of a negative is positive",
        );

        expect(result.reasons).toHaveLength(2);
    });

    it("-a -> -1 * a", () => {
        const result = checkStep("-a", "-1 * a");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "negation is the same as multipling by negative one",
        ]);
    });

    it("-1*a -> -a", () => {
        const result = checkStep("-1 * a", "-a");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "negation is the same as multipling by negative one",
        ]);
    });

    it("(-a)(-b) -> ab", () => {
        const result = checkStep("(-a)(-b)", "ab");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplying two negatives is a positive",
        ]);
    });

    it("ab -> (-a)(-b)", () => {
        const result = checkStep("ab", "(-a)(-b)");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplying two negatives is a positive",
        ]);
    });

    // TODO: there is a missing substep
    it("-(a + b) -> -1(a + b) -> -1a + -1b -> -a + -b", () => {
        const result = checkStep("-(a + b)", "-a + -b");

        expect(result.equivalent).toBe(true);

        expect(result.reasons[0].nodes[0]).toMatchInlineSnapshot(
            `(neg (add a b))`,
        );
        expect(result.reasons[0].nodes[1]).toMatchInlineSnapshot(`
            (mul.exp
              (neg 1)
              (add a b))
        `);
        expect(result.reasons[0].message).toEqual(
            "negation is the same as multipling by negative one",
        );

        expect(result.reasons[1].nodes[0]).toMatchInlineSnapshot(`
            (mul.exp
              (neg 1)
              (add a b))
        `);
        expect(result.reasons[1].nodes[1]).toMatchInlineSnapshot(`
            (add
              (neg a)
              (neg b))
        `);
        expect(result.reasons[1].message).toEqual("distribution");

        expect(result.reasons).toHaveLength(2);
    });

    // TODO: there is a missing substep
    it("-a + -b -> -1 * (a + b) -> -(a + b)", () => {
        const result = checkStep("-a + -b", "-(a + b)");

        expect(result.equivalent).toBe(true);

        expect(result.reasons[0].nodes[0]).toMatchInlineSnapshot(`
            (add
              (neg a)
              (neg b))
        `);
        expect(result.reasons[0].nodes[1]).toMatchInlineSnapshot(`
            (mul.exp
              (neg 1)
              (add a b))
        `);
        expect(result.reasons[0].message).toEqual("factoring");

        expect(result.reasons[1].nodes[0]).toMatchInlineSnapshot(`
            (mul.exp
              (neg 1)
              (add a b))
        `);
        expect(result.reasons[1].nodes[1]).toMatchInlineSnapshot(
            `(neg (add a b))`,
        );
        expect(result.reasons[1].message).toEqual(
            "negation is the same as multipling by negative one",
        );

        expect(result.reasons).toHaveLength(2);
    });
});
