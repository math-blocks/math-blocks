/**
 * Extracts math constants from .ttx file.
 *
 * To generate a .ttx file run the following command:
 * ttx -t MATH -s STIX2Math.otf
 */
const fs = require("fs");
const {parseString} = require("xml2js");

const data = fs.readFileSync("STIX2Math.M_A_T_H_.ttx", "utf-8");

const unwrapValue = (arg) => {
    if (Array.isArray(arg)) {
        return unwrapValue(arg[0]);
    } else if (typeof arg === "object") {
        if (arg.hasOwnProperty("value")) {
            return arg.value;
        } else if (arg.hasOwnProperty("Value")) {
            return unwrapValue(arg.Value);
        } else if (arg.hasOwnProperty("$")) {
            return unwrapValue(arg.$);
        }
    }
};

parseString(data, (err, data) => {
    const constants = data.ttFont.MATH[0].MathConstants[0];
    const result = {};

    for (const [key, value] of Object.entries(constants)) {
        const name = key[0].toLowerCase() + key.slice(1);
        result[name] = parseInt(unwrapValue(value));
    }

    fs.writeFileSync(
        "STIX2Math.json",
        JSON.stringify({constants: result}, null, 2),
    );
});
