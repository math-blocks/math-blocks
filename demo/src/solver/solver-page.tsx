import * as React from 'react';
import type { Blob } from 'buffer';

import * as Editor from '@math-blocks/editor';
import * as Semantic from '@math-blocks/semantic';
import * as Solver from '@math-blocks/solver';
import * as Typesetter from '@math-blocks/typesetter';
import { MathEditor, MathRenderer, FontDataContext } from '@math-blocks/react';
import { getFontData, parse } from '@math-blocks/opentype';
import type { Font } from '@math-blocks/opentype';

import stix2 from '../../../assets/STIX2Math.otf';

import Substeps from './substeps';

const question: Editor.types.CharRow = Editor.util.row('2x+5=10');
const questionZipper: Editor.Zipper = {
  breadcrumbs: [],
  row: {
    id: question.id,
    type: 'zrow',
    left: [],
    selection: [],
    right: question.children,
    style: {},
  },
};

const safeParse = (input: Editor.Zipper): Semantic.types.Node | null => {
  try {
    return Editor.parse(Editor.zipperToRow(input));
  } catch {
    return null;
  }
};

// TODO:
// - show error messages in the UI
// - provide a UI disclosing sub-steps
// - use the colorMap option to highlight related nodes between steps
//   e.g. 2(x + y) -> 2x + 2y the 2s would be the same color, etc.
// - update MathRenderer to do the typesetting

const SolverPage: React.FunctionComponent = () => {
  const [input, setInput] = React.useState<Editor.Zipper>(questionZipper);
  const [answer, setAnswer] = React.useState<Editor.types.CharRow | null>(null);
  const [step, setStep] = React.useState<Solver.Step | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const ast = safeParse(input);
  console.log('ast = ', ast);

  const handleSimplify = React.useCallback((): void => {
    if (!ast) {
      setError("Couldn't parse input");
      return;
    }
    if (!Semantic.util.isNumeric(ast)) {
      setError('ast is not a NumericNode');
      return;
    }
    const problem: Solver.Problem = {
      type: 'SimplifyExpression',
      expression: ast,
    };
    const result = Solver.solveProblem(problem);
    if (result) {
      console.log(result);
      setAnswer(Editor.print(result.answer));
      setStep(result.steps[0]);
      setError(null);
    } else {
      setError('no solution found');
    }
  }, [ast]);

  const handleSolve = React.useCallback((): void => {
    if (!ast) {
      setError("Couldn't parse input");
      return;
    }
    if (Semantic.util.isNumericRelation(ast)) {
      const problem: Solver.Problem = {
        type: 'SolveEquation',
        equation: ast,
        variable: Semantic.builders.identifier('x'),
      };
      const result = Solver.solveProblem(problem);
      if (result) {
        console.log(result);
        setAnswer(Editor.print(result.answer));
        setStep(result.steps[0]);
        setError(null);
      } else {
        setError('no solution found');
      }
    } else {
      setError("can't solve something that isn't an equation");
    }
  }, [ast]);

  const [font, setFont] = React.useState<Font | null>(null);

  React.useEffect(() => {
    const loadFont = async (): Promise<void> => {
      const res = await fetch(stix2);
      const blob = await res.blob();
      const font = await parse(blob as Blob);
      console.log(font);
      setFont(font);
    };

    loadFont();
  }, []);

  if (!font) {
    return null;
  }

  const fontSize = 64;
  const context: Typesetter.Context = {
    fontData: getFontData(font, 'STIX2'),
    baseFontSize: fontSize,
    mathStyle: Typesetter.MathStyle.Display,
    renderMode: Typesetter.RenderMode.Static,
    cramped: false,
    // colorMap: props.colorMap,
  };

  const maybeRenderSolution = (): React.ReactNode => {
    if (answer != null) {
      return <MathRenderer row={answer} />;
    }
    return null;
  };

  const showSolution = answer != null && !error;

  const canSimplify = ast && Semantic.util.isNumeric(ast);
  const canSolve = ast && Semantic.util.isNumericRelation(ast);

  return (
    <FontDataContext.Provider value={context.fontData}>
      <div style={styles.container}>
        <div>
          <div style={styles.label}>Question:</div>
          {canSimplify && <button onClick={handleSimplify}>Simplify</button>}
          {canSolve && <button onClick={handleSolve}>Solve</button>}
        </div>
        <div>
          <MathEditor
            readonly={false}
            zipper={input}
            onChange={(value: Editor.Zipper) => setInput(value)}
          />
        </div>
        <div style={styles.gap}></div>
        <div style={styles.gap}></div>
        {error && <h1>Error</h1>}
        {error && <h1>{error}</h1>}
        {showSolution && <div style={styles.label}>Steps:</div>}
        {showSolution && step && <Substeps start={step.before} step={step} />}
        {showSolution && <div style={styles.label}>Answer:</div>}
        {showSolution && maybeRenderSolution()}
      </div>
    </FontDataContext.Provider>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'grid',
    gridTemplateColumns: '200px auto',
  },
  label: {
    paddingTop: 16,
    fontSize: 32,
    fontFamily: 'sans-serif',
  },
  gap: {
    height: 32,
  },
};

export default SolverPage;
