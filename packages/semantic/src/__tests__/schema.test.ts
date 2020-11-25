import Ajv from "ajv";

import {parsingSchema, validationSchema} from "../schema.js";

describe("parsing schema", () => {
    const ajv = new Ajv({allErrors: true, verbose: true}); // options can be passed, e.g. {allErrors: true}
    const validate = ajv.compile(parsingSchema);

    it("should pass numbers", () => {
        const data = {
            id: 5,
            type: "number",
            value: "123",
        };

        expect(validate(data)).toBe(true);
    });

    it("should pass identifiers", () => {
        const data = {
            id: 5,
            type: "identifier",
            name: "123",
        };

        expect(validate(data)).toBe(true);
    });

    it("should fail when there are missing properties", () => {
        const data = {
            id: 5,
            type: "number",
        };

        expect(validate(data)).toBe(false);
    });

    it("should fail when there aren't enought args for 'add'", () => {
        const data = {
            id: 5,
            type: "add",
            args: [
                {
                    id: 6,
                    type: "number",
                    value: "123",
                },
            ],
        };

        expect(validate(data)).toBe(false);
    });

    it("should fail if there are more than two args for 'div'", () => {
        const data = {
            id: 5,
            type: "div",
            args: [
                {
                    id: 6,
                    type: "identifier",
                    value: "x",
                },
                {
                    id: 6,
                    type: "identifier",
                    value: "y",
                },
                {
                    id: 6,
                    type: "identifier",
                    value: "z",
                },
            ],
        };

        expect(validate(data)).toBe(false);
    });

    it("should allow args of 'add' to be any expression type", () => {
        const data = {
            id: 5,
            type: "add",
            args: [
                {
                    id: 6,
                    type: "empty", // SetExpression 'empty set'
                },
                {
                    id: 7,
                    type: "true", // LogicalExpression 'true'
                },
                {
                    id: 8,
                    type: "number", // NumericExpression
                    value: "123",
                },
            ],
        };

        expect(validate(data)).toBe(true);
    });
});

describe("validation schema", () => {
    const ajv = new Ajv({allErrors: true, verbose: true}); // options can be passed, e.g. {allErrors: true}
    const validate = ajv.compile(validationSchema);

    it("should pass numbers", () => {
        const data = {
            id: 5,
            type: "number",
            value: "123",
        };

        expect(validate(data)).toBe(true);
    });

    it("should pass identifiers", () => {
        const data = {
            id: 5,
            type: "identifier",
            name: "123",
        };

        expect(validate(data)).toBe(true);
    });

    it("should fail when there are missing properties", () => {
        const data = {
            id: 5,
            type: "number",
        };

        expect(validate(data)).toBe(false);
    });

    it("should fail when there aren't enought args for 'add'", () => {
        const data = {
            id: 5,
            type: "add",
            args: [
                {
                    id: 6,
                    type: "number",
                    value: "123",
                },
            ],
        };

        expect(validate(data)).toBe(false);
    });

    it("should fail if there are more than two args for 'div'", () => {
        const data = {
            id: 5,
            type: "div",
            args: [
                {
                    id: 6,
                    type: "identifier",
                    value: "x",
                },
                {
                    id: 6,
                    type: "identifier",
                    value: "y",
                },
                {
                    id: 6,
                    type: "identifier",
                    value: "z",
                },
            ],
        };

        expect(validate(data)).toBe(false);
    });

    it("should allow not all args of 'add' to be SetExpressions or LogicalExpressions", () => {
        const data = {
            id: 5,
            type: "add",
            args: [
                {
                    id: 6,
                    type: "empty", // SetExpression 'empty set'
                },
                {
                    id: 7,
                    type: "true", // LogicalExpression 'true'
                },
            ],
        };

        expect(validate(data)).toBe(false);
    });
});
