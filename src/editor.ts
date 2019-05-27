import {Node, Glyph} from "./editor-ast";

export type Cursor = {
  path: Node[],
  prev: number | null,
  next: number | null,
};

export const createEditor = (root: Node, cursor: Cursor, callback: () => void) => {
  document.body.addEventListener("keydown", (e) => {  
    const currentNode = cursor.path[cursor.path.length - 1];
    if (currentNode.type === "glyph") {
      throw new Error("current node can't be a glyph");
    }
    if (currentNode.type === "frac") {
      throw new Error("current node can't be a fraction... yet");
    }

    console.log(e.keyCode);
  
    switch (e.keyCode) {
      // left arrow
      case 37: {
        if (cursor.prev != null) {
          cursor.next = cursor.prev;
          if (cursor.prev > 0) {
            cursor.prev--;
          } else {
            cursor.prev = null;
          }
        }
        break;
      }
      // right arrow
      case 39: {
        if (cursor.next != null) {
          cursor.prev = cursor.next;
          if (cursor.next < currentNode.children.length - 1) {
            cursor.next++;
          } else {
            cursor.next = null;
          }
        }
        break;
      }
      // backspace
      case 8: {
        if (cursor.prev != null) {
          currentNode.children = [
            ...currentNode.children.slice(0, cursor.prev),
            ...currentNode.children.slice(cursor.prev + 1),
          ];
          cursor.prev = cursor.prev === 0 ? null : cursor.prev - 1;
          cursor.next = cursor.next === null ? null : cursor.next - 1;
        }
      }
    }

    callback();
  });

  document.body.addEventListener("keypress", (e) => {  
    const currentNode = cursor.path[cursor.path.length - 1];
    if (currentNode.type === "glyph") {
      throw new Error("current node can't be a glyph");
    }
    if (currentNode.type === "frac") {
      throw new Error("current node can't be a fraction... yet");
    }

    const char = String.fromCharCode(e.keyCode);
    
    const glyph: Glyph = {
      type: "glyph",
      char,
    };

    if (cursor.next == null) {
      currentNode.children.push(glyph);
      cursor.prev = currentNode.children.length - 1;
    } else {
      currentNode.children = [
        ...currentNode.children.slice(0, cursor.next),
        glyph,
        ...currentNode.children.slice(cursor.next),
      ];
      cursor.next++;
      cursor.prev = cursor.next - 1;
    }

    callback();
  });
}
