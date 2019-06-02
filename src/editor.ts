import {Node} from "./editor-ast";
import {getId} from "./unique-id";

export type EditorCursor = {
  path: Node[],
  // these are indices of the node inside the parent
  prev: number | null,
  next: number | null,
};

const firstIndex = (items: any[]) => items.length > 0 ? 0 : null;
const lastIndex = (items: any[]) => items.length > 0 ? items.length - 1 : null;

export const createEditor = (root: Node, cursor: EditorCursor, callback: () => void) => {
  callback();

  document.body.addEventListener("keydown", (e) => {  
    const currentNode = cursor.path[cursor.path.length - 1];
    if (currentNode.type === "glyph") {
      throw new Error("current node can't be a glyph");
    }
    if (currentNode.type === "frac") {
      throw new Error("current node can't be a fraction... yet");
    }
  
    switch (e.keyCode) {
      // left arrow
      case 37: {
        // TODO: handle navigating into fractions
        if (cursor.prev != null) {
          const prevNode = currentNode.children[cursor.prev];
          if (prevNode && prevNode.type === "frac") {
            cursor.path.push(prevNode);
            cursor.path.push(prevNode.denominator);
            cursor.next = null;
            cursor.prev = lastIndex(prevNode.denominator.children);
          } else {
            cursor.next = cursor.prev;
            if (cursor.prev > 0) {
              cursor.prev--;
            } else {
              cursor.prev = null;
            }
          }
        } else {
          if (cursor.path.length > 1) {
            const parent = cursor.path[cursor.path.length - 2];
            if (parent.type === "frac") {
              if (currentNode === parent.denominator) {
                cursor.path.pop();
                cursor.path.push(parent.numerator);
                cursor.next = null;
                cursor.prev = lastIndex(parent.numerator.children);
                console.log(cursor);
              } else if (currentNode === parent.numerator) {
                const grandparent = cursor.path[cursor.path.length - 3];
                cursor.path.pop();
                cursor.path.pop();
                if (grandparent.type === "frac" || grandparent.type === "glyph") {
                  throw new Error("grandparent has no children array");
                }
                cursor.next = grandparent.children.indexOf(parent);
                cursor.prev = cursor.next > 0 ? cursor.next - 1 : null;
              }
            }
          }
        }
        break;
      }
      // right arrow
      case 39: {
        // TODO: handle navigating into fractions
        if (cursor.next != null) {
          const nextNode = currentNode.children[cursor.next];
          if (nextNode && nextNode.type === "frac") {
            cursor.path.push(nextNode);
            cursor.path.push(nextNode.numerator);
            cursor.prev = null;
            cursor.next = firstIndex(nextNode.numerator.children);
          } else {
            cursor.prev = cursor.next;
            if (cursor.next < currentNode.children.length - 1) {
              cursor.next++;
            } else {
              cursor.next = null;
            }
          }
        } else {
          if (cursor.path.length > 1) {
            const parent = cursor.path[cursor.path.length - 2];
            if (parent.type === "frac") {
              if (currentNode === parent.numerator) {
                cursor.path.pop();
                cursor.path.push(parent.denominator);
                cursor.prev = null;
                cursor.next = firstIndex(parent.denominator.children);
              } else if (currentNode === parent.denominator) {
                const grandparent = cursor.path[cursor.path.length - 3];
                cursor.path.pop();
                cursor.path.pop();
                if (grandparent.type === "frac" || grandparent.type === "glyph") {
                  throw new Error("grandparent has no children array");
                }
                cursor.prev = grandparent.children.indexOf(parent);
                cursor.next = cursor.prev < grandparent.children.length - 1
                  ? cursor.prev + 1
                  : null;
              }
            }
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
    
    let newNode: Node;
    if (char === "/") {
      newNode = {
        id: getId(),
        type: "frac",
        numerator: {
          id: getId(),
          type: "row",
          children: [],
        },
        denominator: {
          id: getId(),
          type: "row",
          children: [],
        },
      }
    } else {
      newNode = {
        id: getId(),
        type: "glyph",
        char,
      };
    }


    if (cursor.next == null) {
      currentNode.children.push(newNode);
      cursor.prev = currentNode.children.length - 1;
    } else {
      currentNode.children = [
        ...currentNode.children.slice(0, cursor.next),
        newNode,
        ...currentNode.children.slice(cursor.next),
      ];
      cursor.next++;
      cursor.prev = cursor.next - 1;
    }

    if (newNode.type === "frac") {
      cursor.path.push(newNode);
      cursor.path.push(newNode.numerator);
      cursor.next = null;
      cursor.prev = null;
    }

    callback();
  });
}
