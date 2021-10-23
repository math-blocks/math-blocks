import * as Editor from '@math-blocks/editor';
import { ProblemStatus, StepStatus } from '../..';

import { createInitialState } from '../create-initial-state';

describe('createInitialState', () => {
  test('it should work', () => {
    const question: Editor.types.CharRow = Editor.util.row('2x+5=10');

    const state = createInitialState(question);

    expect(state.steps).toHaveLength(2);
    expect(state.steps[0].value).toEqual(state.steps[1].value);
    expect(state.steps[0].status).toEqual(StepStatus.Correct);
    expect(state.steps[1].status).toEqual(StepStatus.Duplicate);
    expect(state.status).toEqual(ProblemStatus.Incomplete);
  });
});
