import * as Editor from "@math-blocks/editor";

// The next/prev properties represent node ids instead of indices.
// This simplifies the rendering of the cursor/selection.  This is
// because layouts have more nodes than what appears in the editor
// AST.
type LayoutCursor = {
    parent: number;
    prev: number | null;
    next: number | null;
    selection: boolean;
};

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
        if (next != null && cursor.next != null && cursor.next > next) {
            next = cursor.next;
        } else if (cursor.next == null) {
            next = cursor.next;
        }

        // Use the cursor's prev if it comes before prev.
        if (prev != null && cursor.prev != null && cursor.prev < prev) {
            prev = cursor.prev;
        } else if (cursor.prev == null) {
            prev = cursor.prev;
        }

        // Set selection to true if there's a node between the prev and
        // next.
        let selection = false;
        if (next != null && prev != null && next - prev > 1) {
            selection = true;
        } else if (next != null && prev == null && next > 0) {
            selection = true;
        } else if (next == null && prev != null && prev < parentNode.children.length - 1) {
            selection = true;
        } else if (next == null && prev == null && parentNode.children.length > 0) {
            selection = true;
        }

        result = {
            parent: parentNode.id,
            prev,
            next,
            selection,
        };
    }

    if (result.next != null) {
        result.next = Editor.nodeAtPath(math, [...cursor.path, result.next])?.id ?? null;
    }

    if (result.prev != null) {
        result.prev = Editor.nodeAtPath(math, [...cursor.path, result.prev])?.id ?? null;
    }

    return result;
};
