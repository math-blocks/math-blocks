import {Node, HasChildren} from "./editor-ast";
import {getId} from "./unique-id";

export type EditorCursor = {
  path: Node[],
  // these are indices of the node inside the parent
  prev: number | null,
  next: number | null,
};

const hasChildren = (node: Node): node is HasChildren => {
  return node.type !== "frac" && node.type !== "glyph";
}

const getChildWithId = <T extends {id: number}>(children: T[], childId: number): T | undefined => {
  return children.find(child => child.id === childId);
}

const firstId = <T extends {id: number}>(items: T[]) => items.length > 0 ? items[0].id : null;
const lastId = <T extends {id: number}>(items: T[]) => items.length > 0 ? items[items.length - 1].id : null;

const removeIndex = <T>(array: T[], index: number): T[] => {
  return [
    ...array.slice(0, index),
    ...array.slice(index + 1),
  ];
}

const removeChildWithId = <T extends {id: number}>(children: T[], id: number): T[] => {
  const index = children.findIndex(child => child.id === id);
  return index === -1
    ? children
    : [
      ...children.slice(0, index),
      ...children.slice(index + 1),
    ];
}

const insertBeforeChildWithId = <T extends {id: number}>(children: T[], id: number, newChild: T): T[] => {
  const index = children.findIndex(child => child.id === id);
  return index === -1
    ? children
    : [
      ...children.slice(0, index),
      newChild,
      ...children.slice(index),
    ];
}

const nextId = (children: Node[], childId: number) => {
  const index = children.findIndex(child => child.id === childId);
  if (index === -1) {
    return null;
  }
  return index < children.length - 1 ? children[index + 1].id : null;
}

const prevId = (children: Node[], childId: number) => {
  const index = children.findIndex(child => child.id === childId);
  if (index === -1) {
    return null;
  }
  return index > 0 ? children[index - 1].id : null;
}

const moveLeft = (currentNode: HasChildren, cursor: EditorCursor) => {
  const {children} = currentNode;
  if (cursor.prev != null) {
    const prevNode = getChildWithId(currentNode.children, cursor.prev);
    if (prevNode && prevNode.type === "frac") {
      // enter fraction (denominator)
      cursor.path.push(prevNode);
      cursor.path.push(prevNode.denominator);
      cursor.next = null;
      cursor.prev = lastId(prevNode.denominator.children);
    } else if (prevNode && (prevNode.type === "sub" || prevNode.type === "sup")) {
      // enter sup/sub
      cursor.path.push(prevNode);
      cursor.next = null;
      cursor.prev = lastId(prevNode.children);
    } else {
      // move to the left
      cursor.next = cursor.prev;
      cursor.prev = prevId(children, cursor.prev);
    }
  } else if (cursor.path.length > 1) {
    const parent = cursor.path[cursor.path.length - 2];

    if ((currentNode.type === "sub" || currentNode.type === "sup") && hasChildren(parent)) {
      cursor.path = cursor.path.slice(0, -1);
      cursor.next = currentNode.id;
      cursor.prev = prevId(parent.children, cursor.next);
    } else if (parent.type === "frac" && cursor.path.length > 2) {
      const grandparent = cursor.path[cursor.path.length - 3];

      if (currentNode === parent.denominator) {
        // move from denominator to numerator
        cursor.path = [...cursor.path.slice(0, -1), parent.numerator];
        cursor.next = null;
        cursor.prev = lastId(parent.numerator.children);
      } else if (currentNode === parent.numerator && hasChildren(grandparent)) {
        // exit fraction to the left
        cursor.path = cursor.path.slice(0, -2);
        cursor.next = parent.id;
        cursor.prev = prevId(grandparent.children, cursor.next);
      }
    }
  }
}

const moveRight = (currentNode: HasChildren, cursor: EditorCursor) => {
  const {children} = currentNode;
  if (cursor.next != null) {
    const nextNode = getChildWithId(currentNode.children, cursor.next);
    if (nextNode && nextNode.type === "frac") {
      // enter fraction (numerator)
      cursor.path.push(nextNode);
      cursor.path.push(nextNode.numerator);
      cursor.prev = null;
      cursor.next = firstId(nextNode.numerator.children);
    } else if (nextNode && (nextNode.type === "sub" || nextNode.type === "sup")) {
      // enter sup/sub
      cursor.path.push(nextNode);
      cursor.prev = null;
      cursor.next = firstId(nextNode.children);
    } else {
      // move to the right
      cursor.prev = cursor.next;
      cursor.next = nextId(children, cursor.next);
    }
  } else if (cursor.path.length > 1) {
    const parent = cursor.path[cursor.path.length - 2];

    if ((currentNode.type === "sub" || currentNode.type === "sup") && hasChildren(parent)) {
      cursor.path = cursor.path.slice(0, -1);
      cursor.prev = currentNode.id;
      cursor.next = nextId(parent.children, cursor.prev);
    } else if (parent.type === "frac" && cursor.path.length > 2) {
      const grandparent = cursor.path[cursor.path.length - 3];

      if (currentNode === parent.numerator) {
        // move from numerator to denominator
        cursor.path.pop();
        cursor.path.push(parent.denominator);
        cursor.prev = null;
        cursor.next = firstId(parent.denominator.children);
      } else if (currentNode === parent.denominator && hasChildren(grandparent)) {
        // exit fraction to the right
        cursor.path = cursor.path.slice(0, -2);
        cursor.prev = parent.id;
        cursor.next = nextId(grandparent.children, cursor.prev);
      }
    }
  }
}

export const createEditor = (root: Node, cursor: EditorCursor, callback: (cursor: EditorCursor) => void) => {
  callback(cursor);

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
          const removeId = cursor.prev;
          cursor.prev = prevId(currentNode.children, cursor.prev);
          currentNode.children = removeChildWithId(currentNode.children, removeId);
        } else if (cursor.path.length > 1) {
          const parent = cursor.path[cursor.path.length - 2];
          if (parent.type === "row") {
            if (currentNode.type === "sup" || currentNode.type === "sub") {
              if (currentNode.children.length === 0) {
                cursor.path = cursor.path.slice(0, -1);
                const currentIndex = parent.children.indexOf(currentNode);
                parent.children = removeIndex(parent.children, currentIndex);
                cursor.next = currentIndex < parent.children.length
                  ? currentIndex
                  : null;
                cursor.prev = currentIndex > 0 ? currentIndex - 1 : null;
              }
            }
          }
        }
      }
    }

    callback(cursor);
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
    } else if (char.charCodeAt(0) >= 32) {
      newNode = {
        id: getId(),
        type: "glyph",
        char,
      };
    } else {
      return;
    }

    if (cursor.next == null) {
      currentNode.children.push(newNode);
      cursor.prev = newNode.id;
    } else {
      currentNode.children = insertBeforeChildWithId(currentNode.children, cursor.next, newNode);
      cursor.prev = newNode.id;
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

    callback(cursor);
  });
}
