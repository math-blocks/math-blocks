import * as Editor from '@math-blocks/editor';

import { reducer, ProblemStatus, StepStatus } from '../reducer';

import type { State, Step } from '../reducer';

describe('reducer', () => {
  const charRow: Editor.types.CharRow = Editor.util.row('2x+5=10');
  const zipper = Editor.rowToZipper(charRow, []);
  if (!zipper) {
    throw new Error("Couldn't create zipper");
  }

  it('should duplicate the last step', () => {
    const step: Step = {
      status: StepStatus.Correct,
      value: zipper,
      hint: 'none',
    };

    const state: State = {
      steps: [step],
      status: ProblemStatus.Incomplete,
    };

    const result = reducer(state, { type: 'duplicate' });

    expect(result).toEqual({
      steps: [
        step,
        {
          ...step,
          status: StepStatus.Duplicate,
        },
      ],
      status: ProblemStatus.Incomplete,
    });
  });

  it('should mark the last step as correct', () => {
    const step: Step = {
      status: StepStatus.Incorrect,
      value: zipper,
      mistakes: [],
    };

    const state: State = {
      steps: [step],
      status: ProblemStatus.Incomplete,
    };

    const result = reducer(state, { type: 'right', hint: 'none' });

    expect(result).toEqual({
      steps: [
        {
          value: step.value,
          status: StepStatus.Correct,
          hint: 'none',
        },
      ],
      status: ProblemStatus.Incomplete,
    });
  });

  it('should mark the last step as incorrect', () => {
    const step: Step = {
      status: StepStatus.Incorrect,
      value: zipper,
      mistakes: [],
    };

    const state: State = {
      steps: [step],
      status: ProblemStatus.Incomplete,
    };

    const result = reducer(state, { type: 'wrong', mistakes: [] });

    expect(result).toEqual({
      steps: [
        {
          value: step.value,
          status: StepStatus.Incorrect,
          mistakes: [],
        },
      ],
      status: ProblemStatus.Incomplete,
    });
  });

  it('should update the value of the last step', () => {
    const step: Step = {
      status: StepStatus.Incorrect,
      value: zipper,
      mistakes: [],
    };

    const state: State = {
      steps: [step],
      status: ProblemStatus.Incomplete,
    };

    const newCharRow: Editor.types.CharRow = Editor.util.row('2x=5');
    const newZipper = Editor.rowToZipper(newCharRow, []);
    if (!newZipper) {
      throw new Error("Couldn't create zipper");
    }

    const result = reducer(state, { type: 'update', value: newZipper });

    expect(result).toEqual({
      steps: [
        {
          ...step,
          value: newZipper,
        },
      ],
      status: ProblemStatus.Incomplete,
    });
  });

  it('should create a new step', () => {
    const step: Step = {
      status: StepStatus.Incorrect,
      value: zipper,
      mistakes: [],
    };

    const state: State = {
      steps: [step],
      status: ProblemStatus.Incomplete,
    };

    const nextCharRow: Editor.types.CharRow = Editor.util.row('2x=5');
    const nextZipper = Editor.rowToZipper(nextCharRow, []);
    if (!nextZipper) {
      throw new Error("Couldn't create zipper");
    }

    const result = reducer(state, { type: 'new_step', value: nextZipper });

    expect(result).toEqual({
      steps: [
        step,
        {
          value: nextZipper,
          status: StepStatus.Pending,
        },
      ],
      status: ProblemStatus.Incomplete,
    });
  });

  it('should complete the problem', () => {
    const step: Step = {
      status: StepStatus.Incorrect,
      value: zipper,
      mistakes: [],
    };

    const state: State = {
      steps: [step],
      status: ProblemStatus.Incomplete,
    };

    const result = reducer(state, { type: 'complete' });

    expect(result).toEqual({
      steps: state.steps,
      status: ProblemStatus.Complete,
    });
  });

  it('should replace all steps', () => {
    const step: Step = {
      status: StepStatus.Incorrect,
      value: zipper,
      mistakes: [],
    };

    const state: State = {
      steps: [step],
      status: ProblemStatus.Incomplete,
    };

    const newCharRow: Editor.types.CharRow = Editor.util.row('2x=5');
    const newZipper = Editor.rowToZipper(newCharRow, []);
    if (!newZipper) {
      throw new Error("Couldn't create zipper");
    }
    const newStep: Step = {
      status: StepStatus.Incorrect,
      value: newZipper,
      mistakes: [],
    };

    const result = reducer(state, { type: 'set', steps: [newStep] });

    expect(result).toEqual({
      steps: [newStep],
      status: ProblemStatus.Incomplete,
    });
  });
});
