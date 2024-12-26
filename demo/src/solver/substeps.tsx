import * as React from 'react';

import * as Editor from '@math-blocks/editor';
import * as Semantic from '@math-blocks/semantic';
import * as Solver from '@math-blocks/solver';
import { MathRenderer } from '@math-blocks/react';
import { MathStyle } from '@math-blocks/typesetter';

type Props = {
  // Prefix to start numbering from, e.g. 1.2.3
  readonly prefix?: string;

  // The starting expression to render the substeps from `step` with.
  readonly start: Semantic.types.Node;

  readonly step: Solver.Step;
};

// TODO: split this into separate components.
const Substeps: React.FunctionComponent<Props> = ({ prefix, start, step }) => {
  let current = start;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {step.substeps.map((substep, index) => {
        const before = substep.before;
        const num = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
        current = Solver.applyStep(current, substep);

        return (
          <div key={index + 1} style={{ marginBottom: 8 }}>
            <div style={{ paddingBottom: 4, fontFamily: 'sans-serif' }}>
              {num}: {printStep(substep)}
            </div>
            {substep.substeps.length > 1 && (
              <div style={{ paddingLeft: 64 }}>
                <Substeps prefix={num} start={before} step={substep} />
              </div>
            )}
            {<MathRenderer row={Editor.print(current)} fontSize={24} />}
          </div>
        );
      })}
    </div>
  );
};

export default Substeps;

const printStep = (step: Solver.Step): React.ReactNode => {
  switch (step.message) {
    case 'do the same operation to both sides': {
      const { operation, value } = step;
      const renderedValue = (
        <MathRenderer
          row={Editor.print(value)}
          fontSize={20}
          mathStyle={MathStyle.Display}
        />
      );
      switch (operation) {
        case 'add': {
          return <span>Add {renderedValue} from both sides</span>;
        }
        case 'sub': {
          return <span>Subtract {renderedValue} from both sides</span>;
        }
        case 'mul': {
          return <span>Multiply both sides by {renderedValue}</span>;
        }
        case 'div': {
          return <span>Divide both sides by {renderedValue}</span>;
        }
      }
      break;
    }
    case 'move matching variable terms to one side': {
      const { side } = step;
      return <span>Move matching variable terms to the {side} side</span>;
    }
    default:
      if (step.substeps.length === 1) {
        if (step.message === 'simplify the left hand side') {
          return <span>{step.substeps[0].message} on the left hand side</span>;
        }
        if (step.message === 'simplify the right hand side') {
          return <span>{step.substeps[0].message} on the right hand side</span>;
        }
        return <span>{step.message}</span>;
      } else {
        return <span>{step.message}</span>;
      }
  }
};
