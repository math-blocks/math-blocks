import { MistakeId } from './enums';

export const MISTAKE_PRIORITIES: Record<MistakeId, number> = {
  // equation mistakes have the highest priority because they're the most
  // specific.
  [MistakeId.EQN_ADD_DIFF]: 10,
  [MistakeId.EQN_MUL_DIFF]: 10,

  [MistakeId.EXPR_ADD_NON_IDENTITY]: 5,
  [MistakeId.EXPR_MUL_NON_IDENTITY]: 5,

  // eval/decomposition mistakes have the lowest priority since other mistakes
  // are more specific.
  [MistakeId.EVAL_ADD]: 1,
  [MistakeId.EVAL_MUL]: 1,
  [MistakeId.DECOMP_ADD]: 1,
  [MistakeId.DECOMP_MUL]: 1,
};
