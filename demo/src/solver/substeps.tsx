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

const Substeps: React.FunctionComponent<Props> = ({ prefix, start, step }) => {
  const marginBottom = 8;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {step.substeps.map((substep, index) => {
        const before = substep.before;
        const beforeRow = Editor.print(substep.before);
        const afterRow = Editor.print(substep.after);

        const num = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;

        return (
          <React.Fragment key={index + 1}>
            <div style={{ paddingBottom: 4, fontFamily: 'sans-serif' }}>
              {num}: {printStep(substep)}
            </div>
            <MathRenderer
              row={beforeRow}
              style={{ marginBottom: marginBottom }}
              fontSize={24}
            />
            {substep.substeps.length > 1 && (
              <div style={{ paddingLeft: 64 }}>
                <Substeps prefix={num} start={before} step={substep} />
              </div>
            )}
            {
              <MathRenderer
                row={afterRow}
                style={{ marginBottom: marginBottom }}
                fontSize={24}
              />
            }
          </React.Fragment>
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
          fontSize={18}
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
