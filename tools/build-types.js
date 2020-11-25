const path = require("path");
const fs = require("fs");

const {compile} = require("json-schema-to-typescript");
const {parsingSchema, validationSchema} = require("../packages/semantic/src/schema.js");

compile(parsingSchema, "Expression", {style: {tabWidth: 4}}).then((ts) => {
    fs.writeFileSync(
        path.join(__dirname, "..", "packages", "semantic", "src", "parsing-types.ts"),
        ts,
        {encoding: "utf-8"},
    );
});

compile(validationSchema, "Expression", {style: {tabWidth: 4}}).then((ts) => {
    fs.writeFileSync(
        path.join(__dirname, "..", "packages", "semantic", "src", "validation-types.ts"),
        ts,
        {encoding: "utf-8"},
    );
});
