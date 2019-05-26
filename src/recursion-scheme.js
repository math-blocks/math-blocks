"use strict";
exports.__esModule = true;
var util_1 = require("./util");
var fmap = function (fn, expr) {
    switch (expr.kind) {
        case "number":
            return expr;
        case "add":
            return {
                kind: "add",
                args: expr.args.map(fn)
            };
        case "mul":
            return {
                kind: "mul",
                args: expr.args.map(fn)
            };
        default:
            throw new util_1.UnreachableCaseError(expr);
    }
};
var exprCata = function (fmap, transform, expr) {
    return transform(fmap(function (x) { return exprCata(fmap, transform, x); }, expr));
};
var add = function (a, b) { return a + b; };
var mul = function (a, b) { return a * b; };
var zero = 0;
var one = 1;
var sum = function (nums) { return nums.reduce(add, zero); };
var prod = function (nums) { return nums.reduce(mul, one); };
var evaluateTransform = function (expr) {
    switch (expr.kind) {
        case "number":
            return parseFloat(expr.value);
        case "add":
            return sum(expr.args);
        case "mul":
            return prod(expr.args);
        default:
            throw new util_1.UnreachableCaseError(expr);
    }
};
var evaluate = function (ast) { return exprCata(fmap, evaluateTransform, ast); };
var printTransform = function (expr) {
    switch (expr.kind) {
        case "number":
            return expr.value;
        case "add":
            return "(" + expr.args.join(" + ") + ")";
        case "mul":
            return "(" + expr.args.join(" * ") + ")";
        default:
            throw new util_1.UnreachableCaseError(expr);
    }
};
var print = function (ast) { return exprCata(fmap, printTransform, ast); };
var expr = {
    kind: "add",
    args: [
        {
            kind: "mul",
            args: [
                { kind: "number", value: "2" },
                { kind: "number", value: "3" },
            ]
        },
        { kind: "number", value: "1" },
    ]
};
console.log(print(expr) + " = " + evaluate(expr));
