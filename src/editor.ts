import {Node, HasChildren} from "./editor-ast";
import {getId} from "./unique-id";

export type EditorCursor = {
  path: Node[],
  // these are indices of the node inside the parent
  prev: number | null,
  next: number | null,
};

const firstIndex = (items: any[]) => items.length > 0 ? 0 : null;
const lastIndex = (items: any[]) => items.length > 0 ? items.length - 1 : null;

const hasChildren = (node: Node): node is HasChildren => {
  return node.type !== "frac" && node.type !== "glyph";
}

const moveLeft = (currentNode: HasChildren, cursor: EditorCursor) => {
  if (cursor.prev != null) {
    const prevNode = currentNode.children[cursor.prev];
    if (prevNode && prevNode.type === "frac") {
      // enter fraction (denominator)
      cursor.path.push(prevNode);
      cursor.path.push(prevNode.denominator);
      cursor.next = null;
      cursor.prev = lastIndex(prevNode.denominator.children);
    } else if (prevNode && (prevNode.type === "sub" || prevNode.type === "sup")) {
      // enter sup/sub
      cursor.path.push(prevNode);
      cursor.next = null;
      cursor.prev = lastIndex(prevNode.children);
    } else {
      // move to the left
      cursor.next = cursor.prev;
      cursor.prev = cursor.prev > 0 ? cursor.prev - 1 : null;
    }
  } else if (cursor.path.length > 1) {
    const parent = cursor.path[cursor.path.length - 2];

    if ((currentNode.type === "sub" || currentNode.type === "sup") && hasChildren(parent)) {
      cursor.path = cursor.path.slice(0, -1);
      cursor.next = parent.children.indexOf(currentNode);
      cursor.prev = cursor.next > 0 ? cursor.next - 1 : null; 
    } else if (parent.type === "frac" && cursor.path.length > 2) {
      const grandparent = cursor.path[cursor.path.length - 3];

      if (currentNode === parent.denominator) {
        // move from denominator to numerator
        cursor.path = [...cursor.path.slice(0, -1), parent.numerator];
        cursor.next = null;
        cursor.prev = lastIndex(parent.numerator.children);
      } else if (currentNode === parent.numerator && hasChildren(grandparent)) {
        // exit fraction to the left
        cursor.path = cursor.path.slice(0, -2);
        cursor.next = grandparent.children.indexOf(parent);
        cursor.prev = cursor.next > 0 ? cursor.next - 1 : null;
      }
    }
  }
}

const moveRight = (currentNode: HasChildren, cursor: EditorCursor) => {
  if (cursor.next != null) {
    const nextNode = currentNode.children[cursor.next];
    if (nextNode && nextNode.type === "frac") {
      // enter fraction (numerator)
      cursor.path.push(nextNode);
      cursor.path.push(nextNode.numerator);
      cursor.prev = null;
      cursor.next = firstIndex(nextNode.numerator.children);
    } else if (nextNode && (nextNode.type === "sub" || nextNode.type === "sup")) {
      // enter sup/sub
      cursor.path.push(nextNode);
      cursor.prev = null;
      cursor.next = firstIndex(nextNode.children);
    } else {
      // move to the right
      cursor.prev = cursor.next;
      cursor.next = cursor.next < currentNode.children.length - 1
        ? cursor.next + 1 
        : null;
    }
  } else if (cursor.path.length > 1) {
    const parent = cursor.path[cursor.path.length - 2];

    if ((currentNode.type === "sub" || currentNode.type === "sup") && hasChildren(parent)) {
      cursor.path = cursor.path.slice(0, -1);
      cursor.prev = parent.children.indexOf(currentNode);
      cursor.next = cursor.prev < parent.children.length - 1 ? cursor.prev + 1 : null; 
    } else if (parent.type === "frac" && cursor.path.length > 2) {
      const grandparent = cursor.path[cursor.path.length - 3];

      if (currentNode === parent.numerator) {
        // move from numerator to denominator
        cursor.path.pop();
        cursor.path.push(parent.denominator);
        cursor.prev = null;
        cursor.next = firstIndex(parent.denominator.children);
      } else if (currentNode === parent.denominator && hasChildren(grandparent)) {
        // exit fraction to the right
        cursor.path = cursor.path.slice(0, -2);
        cursor.prev = grandparent.children.indexOf(parent);
        cursor.next = cursor.prev < grandparent.children.length - 1
          ? cursor.prev + 1
          : null;
      }
    }
  }
}

export const createEditor = (root: Node, cursor: EditorCursor, callback: () => void) => {
  callback();

  document.body.addEventListener("keydown", (e) => {  
    const currentNode = cursor.path[cursor.path.length - 1];
    if (!hasChildren(currentNode)) {
      throw new Error("currentNode can't be a glyph or fraction");
    }
  
    switch (e.keyCode) {
      case 37: {
        moveLeft(currentNode, cursor);
        break;
      }
      case 39: {
        moveRight(currentNode, cursor);
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
    } else if (char === "^") {
      newNode = {
        id: getId(),
        type: "sup",
        children: [],
      };
    } else if (char === "_") {
      newNode = {
        id: getId(),
        type: "sub",
        children: [],
      };
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
    } else if (newNode.type === "sup" || newNode.type === "sub") {
      cursor.path.push(newNode);
      cursor.next = null;
      cursor.prev = null;
    }

    callback();
  });
}
