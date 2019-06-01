import {renderBox} from "./render";
import {Node} from "./editor-ast";
import {createEditor, Cursor} from "./editor";
import typeset from "./typeset";
import {getId} from "./unique-id";

import fontMetrics from "../metrics/comic-sans.json";

const canvas = document.createElement("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

const root: Node = {
  id: getId(),
  type: "row",
  children: [{
    id: getId(),
    type: "glyph",
    char: "1",
  }, {
    id: getId(),
    type: "glyph",
    char: "+",
  }, {
    id: getId(),
    type: "glyph",
    char: "x",
  }],
};

const cursor: Cursor = {
  path: [root],
  prev: null,
  next: 0,
};

if (ctx) {
  createEditor(root, cursor, () => {
    const fontSize = 64;
    const box = typeset(fontMetrics)(fontSize)(root);

    console.log("edit tree: ", root);
    console.log("layout tree: ", box);
    console.log(cursor);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(50, 150);
    if (box.type === "Box") {
      renderBox(box, cursor, ctx);
    }
    ctx.restore();
  });
}
