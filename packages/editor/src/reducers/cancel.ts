import {State} from "../above-reducer";
import {layoutCursorFromState} from "../util";

export const cancel = (draft: State): void => {
    const {cursor} = draft;
    if (cursor && draft.selectionStart) {
        if (!draft.cancelRegions) {
            draft.cancelRegions = [];
        }
        draft.cancelRegions.push(layoutCursorFromState(draft));

        // Copied from the "ArrowRight" case below
        const {selectionStart} = draft;
        const next =
            selectionStart.path.length > cursor.path.length
                ? selectionStart.path[cursor.path.length] + 1
                : selectionStart.next;
        const prev =
            selectionStart.path.length > cursor.path.length
                ? selectionStart.path[cursor.path.length]
                : selectionStart.prev;

        if (
            next === Infinity ||
            (cursor.next !== Infinity && next > cursor.next)
        ) {
            draft.cursor = {
                ...draft.cursor,
                prev,
                next,
            };
        }
        draft.selectionStart = undefined;
    }
};
