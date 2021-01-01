import {types} from "@math-blocks/semantic";

export type Step = {
    message: string;
    before: types.Node;
    after: types.Node;
    substeps: Step[];
};
