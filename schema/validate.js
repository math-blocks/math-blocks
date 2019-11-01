const Ajv = require("ajv");
const schema = require("./schema.json");

const ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
const validate = ajv.compile(schema);

const valid2 = ajv.validateSchema(schema);

const Identifier = {
    name: "Identifier",
};

const Add = {
    name: "Add",
    args: "NumericExpression",
    out: "NumericExpression",
    arity: "n",
};

const Div = {
    name: "Div",
    args: "NumericExpression",
    out: "NumericExpression",
    arity: "n",
};

const data = {
    type: "Add",
    args: [
        {
            type: "Number",
            value: "1.23",
        },
        {
            type: "Identifier",
            name: "sin",
        },
    ],
};

const sin = {
    type: "identifier",
    value: "sin",
};

const valid = validate(data);

if (!valid) console.log(validate.errors);
