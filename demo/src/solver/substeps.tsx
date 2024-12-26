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

const Substep = ({
  num,
  substep,
  start,
  current,
}: {
  readonly num: string;
  readonly substep: Solver.Step;
  readonly start: Semantic.types.Node;
  readonly current: Semantic.types.Node;
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const canExpand = substep.substeps.length > 1;
  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (canExpand) {
        setExpanded((prev) => !prev);
      }
    },
    [canExpand],
  );

  return (
    <div
      style={{
        marginBottom: expanded ? 0 : 12,
        cursor: canExpand ? 'pointer' : 'default',
      }}
      onClick={handleClick}
    >
      <div
        style={{
          paddingBottom: 4,
          fontFamily: 'sans-serif',
        }}
      >
        {num}: {printStep(substep)}{' '}
        {canExpand && `(${substep.substeps.length} substeps)`}
      </div>
      {(substep.section || expanded) && (
        <div style={{ marginBottom: 6, paddingLeft: expanded ? 12 : 0 }}>
          <MathRenderer
            row={Editor.print(substep.before)}
            fontSize={24}
            mathStyle={MathStyle.Text}
          />
        </div>
      )}
      {expanded && (
        <div style={{ paddingLeft: 12 }}>
          <Substeps
            prefix={num}
            start={substep.section ? substep.before : start}
            step={substep}
          />
        </div>
      )}
      {!expanded && (
        <MathRenderer
          row={Editor.print(substep.section ? substep.after : current)}
          fontSize={24}
          mathStyle={MathStyle.Text}
        />
      )}
    </div>
  );
};

// TODO: split this into separate components.
const Substeps = ({ prefix, start, step }: Props) => {
  let current = start;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {step.substeps.map((substep, index) => {
        const start = current;
        current = Solver.applyStep(current, substep);

        return (
          <Substep
            key={index + 1}
            num={prefix ? `${prefix}.${index + 1}` : `${index + 1}`}
            substep={substep}
            start={start}
            current={current}
          />
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
          mathStyle={MathStyle.Text}
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
    case 'substitute': {
      const original = (
        <MathRenderer
          row={Editor.print(step.original)}
          fontSize={20}
          mathStyle={MathStyle.Text}
        />
      );
      const substitution = (
        <MathRenderer
          row={Editor.print(step.substitution)}
          fontSize={20}
          mathStyle={MathStyle.Text}
        />
      );
      return (
        <span>
          Substitute {substitution} for {original}
        </span>
      );
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
