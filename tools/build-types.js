const process = require("process");
const path = require("path");
const fs = require("fs");
const {compile} = require("json-schema-to-typescript");

if (!fs.existsSync(path.join(__dirname, "../out/schema/src/index.js"))) {
    console.error(
        "out/schema/src/index.js doesn't exist.  Run 'yarn ts-build' first.",
    );
    process.exit(1);
}

const {parsingSchema, semanticSchema} = require("../out/schema/src/index.js");

compile(parsingSchema, "Node", {style: {tabWidth: 4}}).then((ts) => {
    fs.writeFileSync(
        path.join(__dirname, "..", "packages", "parser", "src", "types.ts"),
        ts,
        {encoding: "utf-8"},
    );
});

compile(semanticSchema, "Node", {style: {tabWidth: 4}}).then((ts) => {
    fs.writeFileSync(
        path.join(__dirname, "..", "packages", "semantic", "src", "types.ts"),
        ts,
        {encoding: "utf-8"},
    );
});
