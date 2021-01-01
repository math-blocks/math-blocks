import {builders, util} from "../index";

describe("util", () => {
    describe("isNumber", () => {
        test("positive numbers are numbers", () => {
            const ast = builders.number("2");
            expect(util.isNumber(ast)).toBeTruthy();
        });

        test("negative numbers are numbers", () => {
            const ast = builders.neg(builders.number("2"));
            expect(util.isNumber(ast)).toBeTruthy();
        });

        test("fractions containing only positive numbers are numbers", () => {
            const ast = builders.div(
                builders.number("2"),
                builders.number("3"),
            );
            expect(util.isNumber(ast)).toBeTruthy();
        });

        test("fractions containing negative numbers are numbers", () => {
            const ast = builders.div(
                builders.neg(builders.number("2")),
                builders.number("3"),
            );
            expect(util.isNumber(ast)).toBeTruthy();
        });

        test("negative fractions are numbers", () => {
            const ast = builders.neg(
                builders.div(builders.number("2"), builders.number("3")),
            );
            expect(util.isNumber(ast)).toBeTruthy();
        });

        test("roots containing numbers are numbers", () => {
            const ast = builders.root(
                builders.number("2"),
                builders.number("2"),
            );
            expect(util.isNumber(ast)).toBeTruthy();
        });

        test("multiplying two numbers is a number", () => {
            const ast = builders.mulFactors([
                builders.number("2"),
                builders.number("2"),
            ]);
            expect(util.isNumber(ast)).toBeTruthy();
        });

        test("adding two numbers is a number", () => {
            const ast = builders.addTerms([
                builders.number("2"),
                builders.number("3"),
            ]);
            expect(util.isNumber(ast)).toBeTruthy();
        });

        test("subtracting two numbers is a number", () => {
            const ast = builders.addTerms([
                builders.number("2"),
                builders.neg(builders.number("3"), true),
            ]);
            expect(util.isNumber(ast)).toBeTruthy();
        });

        test("powers with a base and an exponent that are numbers are numbers", () => {
            const ast = builders.pow(
                builders.number("2"),
                builders.number("3"),
            );
            expect(util.isNumber(ast)).toBeTruthy();
        });

        test("a square root of a number is a number", () => {
            const ast = builders.root(builders.number("3"));
            expect(util.isNumber(ast)).toBeTruthy();
        });

        test("an identifier is not a number", () => {
            const ast = builders.identifier("a");
            expect(util.isNumber(ast)).toBeFalsy();
        });

        test("a negative identifier is not a number", () => {
            const ast = builders.neg(builders.identifier("a"));
            expect(util.isNumber(ast)).toBeFalsy();
        });

        test("a fraction containing an identifier is not a number", () => {
            const ast = builders.div(
                builders.identifier("a"),
                builders.number("2"),
            );
            expect(util.isNumber(ast)).toBeFalsy();
        });

        test("a square root of an identifier is not a number", () => {
            const ast = builders.root(builders.identifier("x"));
            expect(util.isNumber(ast)).toBeFalsy();
        });

        test("a root with an identifier as the radicand is not a number", () => {
            const ast = builders.root(
                builders.identifier("a"),
                builders.number("2"),
            );
            expect(util.isNumber(ast)).toBeFalsy();
        });

        test("a root with an identifier as the index is not a number", () => {
            const ast = builders.root(
                builders.number("3"),
                builders.identifier("n"),
            );
            expect(util.isNumber(ast)).toBeFalsy();
        });

        test("a power with an identifier as a base is not number", () => {
            const ast = builders.pow(
                builders.identifier("a"),
                builders.number("3"),
            );
            expect(util.isNumber(ast)).toBeFalsy();
        });

        test("a power with an identifier as an exponent is not number", () => {
            const ast = builders.pow(
                builders.number("2"),
                builders.identifier("x"),
            );
            expect(util.isNumber(ast)).toBeFalsy();
        });
    });
});
