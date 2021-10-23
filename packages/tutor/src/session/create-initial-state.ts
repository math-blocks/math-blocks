import { clone } from '@math-blocks/core';
import * as Editor from '@math-blocks/editor';

import { StepStatus, ProblemStatus } from './reducer';
import type { State } from './reducer';

export const createInitialState = (question: Editor.types.CharRow): State => {
  const zipper = Editor.rowToZipper(question, []);

  if (!zipper) {
    throw new Error("Can't create a zipper from the given question");
  }

  // TODO: include the goal as part of the ProblemState
  const initialState: State = {
    steps: [
      {
        status: StepStatus.Correct,
        value: zipper,
        hint: 'none',
      },
      {
        status: StepStatus.Duplicate,
        value: clone(zipper),
      },
    ],
    status: ProblemStatus.Incomplete,
  };

  return initialState;
};
