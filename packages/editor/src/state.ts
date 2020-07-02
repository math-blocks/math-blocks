import * as Editor from "./editor-ast";

import {LayoutCursor} from "./util";

type ID = {
    id: number;
};

export type State = {
    math: Editor.Row<Editor.Glyph, ID>;
    cursor: Editor.Cursor;
    selectionStart?: Editor.Cursor;
    cancelRegions?: LayoutCursor[];
};
