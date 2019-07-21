import {Node, HasChildren} from "./editor-ast";
import {getId} from "./unique-id";

export type EditorCursor = {
  path: Node[],
  // these are indices of the node inside the parent
  prev: number | null,
  next: number | null,
};

const hasChildren = (node: Node): node is HasChildren => {
  return node.type === "row" || node.type === "parens";
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
    } else if (prevNode && prevNode.type === "subsup") {
      // enter sup/sub
      cursor.path.push(prevNode);
      cursor.next = null;
      if (prevNode.sup) {
        cursor.path.push(prevNode.sup);
        cursor.prev = lastId(prevNode.sup.children);
      } else if (prevNode.sub) {
        cursor.path.push(prevNode.sub);
        cursor.prev = lastId(prevNode.sub.children);
      }
    } else {
      // move to the left
      cursor.next = cursor.prev;
      cursor.prev = prevId(children, cursor.prev);
    }
  } else if (cursor.path.length > 1) {
    const parent = cursor.path[cursor.path.length - 2];

    if (parent.type === "subsup" && cursor.path.length > 2) {
      const grandparent = cursor.path[cursor.path.length - 3];

      if (currentNode === parent.sup && hasChildren(grandparent)) {
        if (parent.sub) {
          cursor.path.pop();
          cursor.path.push(parent.sub);
          cursor.next = null;
          cursor.prev = lastId(parent.sub.children);
        } else {
          cursor.path = cursor.path.slice(0, -2);
          cursor.next = parent.id;
          cursor.prev = prevId(grandparent.children, cursor.next);
        }
      } else if (currentNode === parent.sub && hasChildren(grandparent)) {
        cursor.path = cursor.path.slice(0, -2);
        cursor.next = parent.id;
        cursor.prev = prevId(grandparent.children, cursor.next);
      }
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
    } else if (nextNode && (nextNode.type === "subsup")) {
      // enter sup/sub
      cursor.path.push(nextNode);
      cursor.prev = null;
      if (nextNode.sub) {
        cursor.path.push(nextNode.sub);
        cursor.next = firstId(nextNode.sub.children);
      } else if (nextNode.sup) {
        cursor.path.push(nextNode.sup);
        cursor.next = firstId(nextNode.sup.children);
      }
    } else {
      // move to the right
      cursor.prev = cursor.next;
      cursor.next = nextId(children, cursor.next);
    }
  } else if (cursor.path.length > 1) {
    const parent = cursor.path[cursor.path.length - 2];

    if ((parent.type === "subsup") && cursor.path.length > 2) {
      const grandparent = cursor.path[cursor.path.length - 3];

      if (currentNode === parent.sub && hasChildren(grandparent)) {
        if (parent.sup) {
          cursor.path.pop();
          cursor.path.push(parent.sup);
          cursor.prev = null;
          cursor.next = firstId(parent.sup.children);
        } else {
          cursor.path = cursor.path.slice(0, -2);
          cursor.prev = parent.id;
          cursor.next = nextId(grandparent.children, cursor.prev);
        }
      } else if (currentNode === parent.sup && hasChildren(grandparent)) {
        cursor.path = cursor.path.slice(0, -2);
        cursor.prev = parent.id;
        cursor.next = nextId(grandparent.children, cursor.prev);
      }
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
      throw new Error("currentNode can't be a glyph, fraction, sup, or sub");
    }
    // TODO: handle deleting from within a sup/sub
  
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
          const grandparent = cursor.path[cursor.path.length - 3];

          if (parent.type === "subsup") {
            if (!hasChildren(grandparent)) {
              return;
            }

            const index = grandparent.children.findIndex(child => child.id === parent.id);
            const newChildren = index === -1
              ? grandparent.children
              // replace currentNode with currentNode's children
              : [
                ...grandparent.children.slice(0, index),
                ...currentNode.children,
                ...grandparent.children.slice(index + 1),
              ];

            // update cursor
            if (currentNode.children.length > 0) {
              cursor.next = currentNode.children[0].id;
            } else {
              cursor.next = nextId(grandparent.children, parent.id);
            }
            if (cursor.next) {
              cursor.prev = prevId(newChildren, cursor.next);
            } else {
              cursor.prev = firstId(grandparent.children);
            }
            cursor.path = cursor.path.slice(0, -2); // move up two levels

            // update children
            grandparent.children = newChildren;
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
    if (currentNode.type === "subsup") {
      throw new Error("current node can't be a subsup... yet");
    }

    const nextNode = cursor.next && hasChildren(currentNode)
      ? currentNode.children.find(child => child.id === cursor.next)
      : null;

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
      if (nextNode && nextNode.type === "subsup") {
        if (!nextNode.sup) {
          nextNode.sup = {
            id: getId(),
            type: "row",
            children: [],
          };
        }
        cursor.path.push(nextNode);
        cursor.path.push(nextNode.sup);
        cursor.prev = null;
        cursor.next = firstId(nextNode.sup.children);
        callback(cursor);
        return;
      } else {
        newNode = {
          id: getId(),
          type: "subsup",
          sup: {
            id: getId(),
            type: "row",
            children: [],
          },
        };
      }
    } else if (char === "_") {
      if (nextNode && nextNode.type === "subsup") {
        if (!nextNode.sub) {
          nextNode.sub = {
            id: getId(),
            type: "row",
            children: [],
          };
        }
        cursor.path.push(nextNode);
        cursor.path.push(nextNode.sub);
        cursor.prev = null;
        cursor.next = firstId(nextNode.sub.children);
        callback(cursor);
        return;
      } else {
        newNode = {
          id: getId(),
          type: "subsup",
          sub: {
            id: getId(),
            type: "row",
            children: [],
          },
        };
      }
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
    } else if (newNode.type === "subsup") {
      cursor.path.push(newNode);
      if (newNode.sup) {
        cursor.path.push(newNode.sup);
      } else if (newNode.sub) {
        cursor.path.push(newNode.sub);
      }
      cursor.next = null;
      cursor.prev = null;
    }

    callback(cursor);
  });
}
