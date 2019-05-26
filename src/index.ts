import {Expression} from "./ast";
import print from "./print";
import typeset from "./render";
import {hpackNat, makeFract} from "./layout";

import fontMetrics from "../metrics/comic-sans.json";

console.log(fontMetrics);

const ast: Expression = {
  kind: "add",
  args: [
    {
      kind: "number",
      value: "3.141592",
    },
    {
      kind: "identifier",
      name: "x",
    }
  ]
};

const math = print(ast);
console.log(math);

const canvas = document.createElement("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

const fontSize = 64;
const kernSize = fontSize / 4;

const numerator = hpackNat([
  {
    id: 2,
    type: "Glyph",
    char: "5",
    size: fontSize,
    metrics: fontMetrics,
  },
]);

const denominator = hpackNat([
  {
    id: 2,
    type: "Glyph",
    char: "x",
    size: fontSize,
    metrics: fontMetrics,
  },
]);

const layout = hpackNat([
  {
    id: 0,
    type: "Glyph",
    char: "x",
    size: fontSize,
    metrics: fontMetrics,
  },
  {
    id: -1,
    type: "Kern",
    size: kernSize,
  },
  {
    id: 1,
    type: "Glyph",
    char: "+",
    size: fontSize,
    metrics: fontMetrics,
  },
  {
    id: -1,
    type: "Kern",
    size: kernSize,
  },
  makeFract(
    5,
    Math.max(numerator.width, denominator.width),
    numerator,
    denominator,
  ),
  {
    id: -1,
    type: "Kern",
    size: kernSize,
  },
  {
    id: 3,
    type: "Glyph",
    char: "=",
    size: fontSize,
    metrics: fontMetrics,
  },
  {
    id: -1,
    type: "Kern",
    size: kernSize,
  },
  {
    id: 4,
    type: "Glyph",
    char: "1",
    size: fontSize,
    metrics: fontMetrics,
  },
  {
    id: 5,
    type: "Glyph",
    char: "0",
    size: fontSize,
    metrics: fontMetrics,
  }
])

console.log(layout);

if (ctx) {
  ctx.translate(50, 150);
  typeset(layout, ctx);
}
