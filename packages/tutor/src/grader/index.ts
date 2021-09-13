import StepChecker from "./step-checker";

export {checkStep} from "./step-checker";
export {MistakeId} from "./enums";
// TODO: move this over to semantic
export {replaceNodeWithId} from "./checks/util";

import {Context as _Context, Mistake as _Mistake} from "./types";

export type Context = _Context;
export type Mistake = _Mistake;

export default StepChecker;
