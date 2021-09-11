import {SourceLocation} from "./types";

export const locFromRange = (
    start?: SourceLocation,
    end?: SourceLocation,
): SourceLocation | undefined => {
    if (start && end) {
        // TODO: assert start.path === end.path
        return {
            path: start.path,
            start: start.start,
            end: end.end,
        };
    }
    return undefined;
};
