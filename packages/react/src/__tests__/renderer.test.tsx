import fs from "fs";
import path from "path";
import React from "react";
import ReactDOMServer from "react-dom/server";

import {typeset, Layout} from "@math-blocks/typesetter";
import * as Editor from "@math-blocks/editor";
import fontMetrics from "@math-blocks/metrics";

import {MathRenderer} from "@math-blocks/react";

const fontSize = 60;
const context = {
    fontMetrics: fontMetrics,
    baseFontSize: fontSize,
    multiplier: 1.0,
    cramped: false,
};

describe("renderer", () => {
    test("equation", () => {
        const linearEquation = typeset(
            Editor.Util.row("2x+5=10"),
            context,
        ) as Layout.Box;

        const output = ReactDOMServer.renderToStaticMarkup(
            <MathRenderer box={linearEquation} />,
        );

        fs.writeFileSync(
            path.join(__dirname, "__fixtures__", "equation.svg"),
            '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + output,
            "utf-8",
        );
    });
});
