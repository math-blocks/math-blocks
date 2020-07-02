import * as Editor from "@math-blocks/editor";

type LayoutCursor = {
    parent: number;
    // index of previous editor node within parent, if there is no previous
    // node then this will be -Infinity
    prev: number;
    // index of next editor node within parent, if there is no next node
    // then this will be Infinity
    next: number;
    selection: boolean;
};

// TODO: dedupe with editor/utils.ts
export const layoutCursorFromState = (state: Editor.State): LayoutCursor => {
    const {math, cursor, selectionStart} = state;
    const parentNode = Editor.nodeAtPath(math, cursor.path);

    let result = {
        parent: parentNode.id,
        prev: cursor.prev,
        next: cursor.next,
        selection: false,
    };

    if (selectionStart) {
        if (parentNode.type !== "row") {
            throw new Error("selection container isn't a row");
        }

        // Set prev/next to the node at the same level as the cursor
        // that contains the selectionStart or use the selectionStart
        // if it's at the same level as the cursor.
        let next =
            selectionStart.path.length > cursor.path.length
                ? selectionStart.path[cursor.path.length] + 1
                : selectionStart.next;
        let prev =
            selectionStart.path.length > cursor.path.length
                ? selectionStart.path[cursor.path.length] - 1
                : selectionStart.prev;

        // Use the cursor's next if it comes after next.
        if (
            next !== Infinity &&
            cursor.next !== Infinity &&
            cursor.next > next
        ) {
            next = cursor.next;
        } else if (cursor.next === Infinity) {
            next = cursor.next;
        }

        // Use the cursor's prev if it comes before prev.
        if (
            prev !== -Infinity &&
            cursor.prev !== -Infinity &&
            cursor.prev < prev
        ) {
            prev = cursor.prev;
        } else if (cursor.prev === -Infinity) {
            prev = cursor.prev;
        }

        // Set selection to true if there's a node between the prev and
        // next.
        let selection = false;
        if (next !== Infinity && prev !== -Infinity && next - prev > 1) {
            selection = true;
        } else if (next !== Infinity && prev === -Infinity && next > 0) {
            selection = true;
        } else if (
            next === Infinity &&
            prev !== -Infinity &&
            prev < parentNode.children.length - 1
        ) {
            selection = true;
        } else if (
            next === Infinity &&
            prev === -Infinity &&
            parentNode.children.length > 0
        ) {
            selection = true;
        }

        result = {
            parent: parentNode.id,
            prev,
            next,
            selection,
        };
    }

    return result;
};
