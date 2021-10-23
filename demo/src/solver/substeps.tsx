import * as React from 'react';

import * as Editor from '@math-blocks/editor';
import * as Semantic from '@math-blocks/semantic';
import * as Solver from '@math-blocks/solver';
import { MathRenderer } from '@math-blocks/react';

type Props = {
  // Prefix to start numbering from, e.g. 1.2.3
  readonly prefix?: string;

  // The starting expression to render the substeps from `step` with.
  readonly start: Semantic.types.Node;

  readonly step: Solver.Step;
};

const Substeps: React.FunctionComponent<Props> = ({ prefix, start, step }) => {
  let current = start;

  const beforeRow = Editor.print(step.before);
  console.log(beforeRow);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <MathRenderer row={beforeRow} style={{ marginBottom: 32 }} />
      {step.substeps.map((substep, index) => {
        const before = current;

        const after = Solver.applyStep(before, substep);
        const afterRow = Editor.print(substep.after);
        console.log(afterRow);

        current = after;

        const num = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;

        return (
          <React.Fragment key={index + 1}>
            <div>
              {num}: {substep.message}
            </div>
            {/* TODO: special case substeps.length === 1 */}
            {substep.substeps.length > 0 && (
              <div style={{ paddingLeft: 64 }}>
                <Substeps prefix={num} start={before} step={substep} />
              </div>
            )}
            {<MathRenderer row={afterRow} style={{ marginBottom: 32 }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Substeps;
