const path = require("path");
const fs = require("fs");

const {compile} = require("json-schema-to-typescript");
const schema = require("../packages/schema/index.js");

compile(schema, "Expression", {style: {tabWidth: 4}}).then((ts) => {
    fs.writeFileSync(
        path.join(__dirname, "..", "packages", "semantic", "src", "types.ts"),
        ts,
        {encoding: "utf-8"},
    );
});
