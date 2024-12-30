import * as React from 'react';
import type { Blob } from 'buffer';

import * as Editor from '@math-blocks/editor';
import * as Semantic from '@math-blocks/semantic';
import * as Solver from '@math-blocks/solver';
import * as Typesetter from '@math-blocks/typesetter';
import * as Tex from '@math-blocks/tex';
import { MathEditor, MathRenderer, FontDataContext } from '@math-blocks/react';
import { getFontData, parse } from '@math-blocks/opentype';
import type { Font } from '@math-blocks/opentype';
import { macros } from '@math-blocks/tex';

import stix2 from '../../../assets/STIX2Math.otf';

import Substeps from './substeps';

const operators = Object.keys(macros).filter((key) => key === macros[key]);

// const initialInput = Tex.parse('x^2 + 5x + 6 = 0');
// const initialInput = Tex.parse('2x + 3y \u2212 7 = x \u2212 y + 1');
const initialInput = Tex.parse('3x \u2212 y = 6, x + 2y = \u22121');

const safeParse = (input: Editor.types.CharRow): Semantic.types.Node | null => {
  try {
    return Editor.parse(input);
  } catch {
    return null;
  }
};

// TODO:
// - provide a UI disclosing sub-steps
// - use the colorMap option to highlight related nodes between steps
//   e.g. 2(x + y) -> 2x + 2y the 2s would be the same color, etc.

const SolverPage: React.FunctionComponent = () => {
  const [input, setInput] = React.useState(initialInput);
  const [answer, setAnswer] = React.useState<Editor.types.CharRow | null>(null);
  const [step, setStep] = React.useState<Solver.Step | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [action, setAction] = React.useState<Solver.Problem['type']>(
    'SolveSystemOfEquations',
  );

  const ast = React.useMemo(() => safeParse(input), [input]);

  console.log(ast);

  const handleGo = React.useCallback(() => {
    if (!ast) {
      setError("Couldn't parse input");
      return;
    }
    switch (action) {
      case 'Factor': {
        if (ast.type !== 'Add') {
          setError('ast is not an Add node');
          return;
        }
        const problem: Solver.Problem = {
          type: 'Factor',
          expression: ast,
        };
        const result = Solver.solveProblem(problem);
        if (result) {
          console.log(result);
          setAnswer(Editor.print(result.answer));
          setStep(result.steps[0]);
          setError(null);
        } else {
          setError('Expression could not be factored');
        }
        break;
      }
      case 'SimplifyExpression': {
        if (!Semantic.util.isNumeric(ast)) {
          setError('ast is not a NumericNode');
          return;
        }
        const problem: Solver.Problem = {
          type: 'SimplifyExpression',
          expression: ast,
        };
        const result = Solver.solveProblem(problem);
        if (!result) {
          setError('no solution found');
          return;
        }
        setAnswer(Editor.print(result.answer));
        setStep(result.steps[0]);
        setError(null);
        break;
      }
      case 'SolveLinearRelation': {
        if (!Semantic.util.isNumericRelation(ast)) {
          setError("can't solve something that isn't an relation");
          return;
        }
        const problem: Solver.Problem = {
          type: 'SolveLinearRelation',
          relation: ast,
          variable: Semantic.builders.identifier('x'),
        };
        const result = Solver.solveProblem(problem);
        if (!result) {
          setError('no solution found');
          return;
        }
        setAnswer(Editor.print(result.answer));
        setStep(result.steps[0]);
        setError(null);
        break;
      }
      case 'SolveQuadraticEquation': {
        if (ast.type !== 'Equals') {
          setError("can't solve something that isn't an equation");
          return;
        }
        const problem: Solver.Problem = {
          type: 'SolveQuadraticEquation',
          relation: ast,
          variable: Semantic.builders.identifier('x'),
        };
        const result = Solver.solveProblem(problem);
        if (!result) {
          setError('no solution found');
          return;
        }
        setAnswer(Editor.print(result.answer));
        setStep(result.steps[0]);
        setError(null);
        break;
      }
      case 'SolveSystemOfEquations': {
        if (ast.type !== 'Sequence') {
          setError("can't solve something that isn't a sequence");
          return;
        }
        const problem: Solver.Problem = {
          type: 'SolveSystemOfEquations',
          equations: ast,
        };
        const result = Solver.solveProblem(problem);
        if (!result) {
          setError('no solution found');
          return;
        }
        setAnswer(Editor.print(result.answer));
        setStep(result.steps[0]);
        setError(null);
        break;
      }
    }
  }, [action, ast]);

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

  const fontSize = 24;
  const context: Typesetter.Context = {
    fontData: getFontData(font, 'STIX2'),
    baseFontSize: fontSize,
    mathStyle: Typesetter.MathStyle.Display,
    renderMode: Typesetter.RenderMode.Static,
    cramped: false,
    operators: operators,
    // colorMap: props.colorMap,
  };

  const maybeRenderSolution = (): React.ReactNode => {
    if (answer != null) {
      return <MathRenderer row={answer} fontSize={24} />;
    }
    return null;
  };

  const showSolution = answer != null && !error;

  return (
    <FontDataContext.Provider value={context.fontData}>
      <div style={styles.outer}>
        <div style={styles.inner}>
          <h1 style={{ fontFamily: 'sans-serif' }}>Math Blocks: Solver</h1>
          <div>
            <MathEditor
              readonly={false}
              row={initialInput}
              onChange={(state) => setInput(state.row)}
              style={{ minWidth: '100%' }}
              fontSize={24}
            />
          </div>
          <div style={{ marginTop: 8 }}>
            <select
              style={{ marginRight: 8 }}
              value={action}
              onChange={(event) =>
                setAction(event.target.value as Solver.Problem['type'])
              }
            >
              <option value="Factor">Factor</option>
              <option value="SimplifyExpression">Simplify Expression</option>
              <option value="SolveLinearRelation">Solve Linear Relation</option>
              <option value="SolveQuadraticEquation">
                Solve Quadratic Equation
              </option>
              <option value="SolveSystemOfEquations">
                Solve System of Equations
              </option>
            </select>
            <button onClick={handleGo}>Go</button>
          </div>
          <div style={styles.gap}></div>
          {error && <h1>Error</h1>}
          {error && <h1>{error}</h1>}
          {showSolution && <div style={styles.label}>Steps:</div>}
          {showSolution && step && <Substeps start={step.before} step={step} />}
          {showSolution && <div style={styles.label}>Answer:</div>}
          {showSolution && maybeRenderSolution()}
        </div>
      </div>
    </FontDataContext.Provider>
  );
};

const styles: Record<string, React.CSSProperties> = {
  outer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  inner: {
    width: 800,
  },
  label: {
    paddingTop: 16,
    paddingBottom: 12,
    fontSize: 32,
    fontFamily: 'sans-serif',
  },
  gap: {
    height: 32,
  },
};

export default SolverPage;
