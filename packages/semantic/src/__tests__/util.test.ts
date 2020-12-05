import * as S from "../index";

describe("util", () => {
    describe("isNumber", () => {
        test("positive numbers are numbers", () => {
            const ast = S.number("2");
            expect(S.isNumber(ast)).toBeTruthy();
        });

        test("negative numbers are numbers", () => {
            const ast = S.neg(S.number("2"));
            expect(S.isNumber(ast)).toBeTruthy();
        });

        test("fractions containing only positive numbers are numbers", () => {
            const ast = S.div(S.number("2"), S.number("3"));
            expect(S.isNumber(ast)).toBeTruthy();
        });

        test("fractions containing negative numbers are numbers", () => {
            const ast = S.div(S.neg(S.number("2")), S.number("3"));
            expect(S.isNumber(ast)).toBeTruthy();
        });

        test("negative fractions are numbers", () => {
            const ast = S.neg(S.div(S.number("2"), S.number("3")));
            expect(S.isNumber(ast)).toBeTruthy();
        });

        test("roots containing numbers are numbers", () => {
            const ast = S.root(S.number("2"), S.number("2"));
            expect(S.isNumber(ast)).toBeTruthy();
        });

        test("multiplying two numbers is a number", () => {
            const ast = S.mul([S.number("2"), S.number("2")]);
            expect(S.isNumber(ast)).toBeTruthy();
        });

        test("adding two numbers is a number", () => {
            const ast = S.add([S.number("2"), S.number("3")]);
            expect(S.isNumber(ast)).toBeTruthy();
        });

        test("subtracting two numbers is a number", () => {
            const ast = S.add([S.number("2"), S.neg(S.number("3"), true)]);
            expect(S.isNumber(ast)).toBeTruthy();
        });

        test("powers with a base and an exponent that are numbers are numbers", () => {
            const ast = S.pow(S.number("2"), S.number("3"));
            expect(S.isNumber(ast)).toBeTruthy();
        });

        test("a square root of a number is a number", () => {
            const ast = S.root(S.number("3"));
            expect(S.isNumber(ast)).toBeTruthy();
        });

        test("an identifier is not a number", () => {
            const ast = S.identifier("a");
            expect(S.isNumber(ast)).toBeFalsy();
        });

        test("a negative identifier is not a number", () => {
            const ast = S.neg(S.identifier("a"));
            expect(S.isNumber(ast)).toBeFalsy();
        });

        test("a fraction containing an identifier is not a number", () => {
            const ast = S.div(S.identifier("a"), S.number("2"));
            expect(S.isNumber(ast)).toBeFalsy();
        });

        test("a square root of an identifier is not a number", () => {
            const ast = S.root(S.identifier("x"));
            expect(S.isNumber(ast)).toBeFalsy();
        });

        test("a root with an identifier as the radicand is not a number", () => {
            const ast = S.root(S.identifier("a"), S.number("2"));
            expect(S.isNumber(ast)).toBeFalsy();
        });

        test("a root with an identifier as the index is not a number", () => {
            const ast = S.root(S.number("3"), S.identifier("n"));
            expect(S.isNumber(ast)).toBeFalsy();
        });

        test("a power with an identifier as a base is not number", () => {
            const ast = S.pow(S.identifier("a"), S.number("3"));
            expect(S.isNumber(ast)).toBeFalsy();
        });

        test("a power with an identifier as an exponent is not number", () => {
            const ast = S.pow(S.number("2"), S.identifier("x"));
            expect(S.isNumber(ast)).toBeFalsy();
        });
    });
});
