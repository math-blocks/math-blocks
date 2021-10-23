import { hot } from 'react-hot-loader/root';
import * as React from 'react';

import { MathKeypad, MathEditor } from '@math-blocks/react';
import * as Editor from '@math-blocks/editor';
import * as Semantic from '@math-blocks/semantic';
import * as Solver from '@math-blocks/solver';
import {
  createInitialState,
  reducer,
  ProblemStatus,
  StepStatus,
} from '@math-blocks/tutor';

import { HStack, VStack } from '../layout';

import Step from './step';

const { useState } = React;

const question: Editor.types.CharRow = Editor.util.row('2x+5=10');
const initialState = createInitialState(question);

const problem: Solver.Problem = {
  type: 'SolveEquation',
  equation: Editor.parse(question) as Semantic.types.Eq,
  variable: Semantic.builders.identifier('x'),
};

// TODO: Create two modes: immediate and delayed
// - Immediate feedback will show whether the current step is
//   incorrect when the user submits it and will force the user to
//   correct the issue before proceeding.
// - Delayed feedback will conceal the correctness of each step
//   until the user submits their answer.
const Tutor: React.FunctionComponent = () => {
  const [mode, setMode] = useState<'edit' | 'solve'>('solve');
  const [state, dispatch] = React.useReducer(reducer, initialState);

  const isComplete = state.status === ProblemStatus.Complete;
  const pairs = getPairs(state.steps);

  const zipper: Editor.Zipper = state.steps[0].value;

  return (
    <HStack style={{ margin: 'auto' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: 300,
          marginRight: 32,
        }}
      >
        {mode === 'solve' && (
          <button
            style={{ height: 48, fontSize: 24 }}
            onClick={() => {
              setMode('edit');
              dispatch({
                type: 'set',
                steps: [state.steps[0]],
              });
            }}
          >
            Edit Question
          </button>
        )}
        {mode === 'edit' && (
          <button
            style={{ height: 48, fontSize: 24 }}
            onClick={() => {
              setMode('solve');
              // get the ball rolling
              dispatch({ type: 'duplicate' });
            }}
          >
            Solve Question
          </button>
        )}
        <MathKeypad />
        <div style={{ position: 'fixed', bottom: 0, left: 0, margin: 4 }}>
          <div>
            Icons made by{' '}
            <a
              href="https://www.flaticon.com/authors/pixel-perfect"
              title="Pixel perfect"
            >
              Pixel perfect
            </a>{' '}
            from{' '}
            <a href="https://www.flaticon.com/" title="Flaticon">
              www.flaticon.com
            </a>
          </div>
        </div>
      </div>
      <VStack style={{ flexGrow: 1, height: '100vh', overflowY: 'scroll' }}>
        <HStack>
          <MathEditor
            key={`question`}
            readonly={false}
            zipper={zipper}
            // focus={mode === "edit"}
            style={{ marginTop: 8, flexGrow: 1 }}
            onChange={(zipper: Editor.Zipper) => {
              dispatch({
                type: 'set',
                steps: [
                  {
                    status: StepStatus.Correct,
                    value: zipper,
                    hint: 'none',
                  },
                ],
              });
            }}
          />
          <div style={{ width: 200, marginLeft: 8 }} />
        </HStack>
        {pairs.map(([prevStep, step], index) => {
          const isLast = index === pairs.length - 1;

          return (
            <Step
              key={`step-${index}`}
              // focus={isLast && mode === "solve"}
              dispatch={dispatch}
              readonly={!isLast || isComplete}
              problem={problem}
              prevValue={prevStep.value}
              step={step}
            />
          );
        })}
        {isComplete && <h1 style={{ fontFamily: 'sans-serif' }}>Good work!</h1>}
      </VStack>
    </HStack>
  );
};

export default hot(Tutor);

function getPairs<T>(array: readonly T[]): readonly [T, T][] {
  if (array.length < 2) {
    return [];
  }

  const result: [T, T][] = [];
  for (let i = 0; i < array.length - 1; i++) {
    result.push([array[i], array[i + 1]]);
  }

  return result;
}
