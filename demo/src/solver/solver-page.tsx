import * as React from "react";

import * as Editor from "@math-blocks/editor";
import {parse} from "@math-blocks/editor-parser";
import fontMetrics from "@math-blocks/metrics";
import {MathEditor, MathRenderer} from "@math-blocks/react";
import {builders} from "@math-blocks/semantic";
import {simplify, solve, Step} from "@math-blocks/solver";
import {typeset} from "@math-blocks/typesetter";

import Substeps from "./substeps";

const question: Editor.Row = Editor.Util.row("2x+5=10");

// TODO:
// - show error messages in the UI
// - provide a UI disclosing sub-steps
// - use the colorMap option to highlight related nodes between steps
//   e.g. 2(x + y) -> 2x + 2y the 2s would be the same color, etc.
// - update MathRenderer to do the typesetting

const SolverPage: React.FunctionComponent = () => {
    const [input, setInput] = React.useState(question);
    const [solution, setSolution] = React.useState<Editor.Node | null>(null);
    const [step, setStep] = React.useState<Step | null>(null);

    const handleSimplify = (): void => {
        console.log("SIMPLIFY");
        const ast = parse(input);
        const result = simplify(ast, []);
        if (result) {
            console.log(result);
            const solution = Editor.print(result.after);
            console.log(solution);
            setSolution(solution);
            setStep(result);
        } else {
            console.log("no solution found");
        }
    };

    const handleSolve = (): void => {
        console.log("SOLVE");
        const ast = parse(input);
        if (ast.type === "eq") {
            const result = solve(ast, builders.identifier("x"));
            if (result) {
                console.log(result);
                const solution = Editor.print(result.after);
                console.log(solution);
                setSolution(solution);
                setStep(result);
            } else {
                console.log("no solution found");
            }
        } else {
            console.warn("can't solve something that isn't an equation");
        }
    };

    const fontSize = 64;
    const context = {
        fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
        // colorMap: props.colorMap,
    };

    const maybeRenderSolution = (): React.ReactNode => {
        if (solution != null) {
            const box = typeset(solution, context);
            return (
                <MathRenderer box={box} cursor={undefined} cancelRegions={[]} />
            );
        }
        return null;
    };

    const showSolution = solution != null;

    return (
        <div style={styles.container}>
            <div>
                <div style={styles.label}>Question:</div>
                <button onClick={handleSimplify}>Simplify</button>
                <button onClick={handleSolve}>Solve</button>
            </div>
            <div>
                <MathEditor
                    readonly={false}
                    rows={[input]}
                    stepChecker={true}
                    focus={true}
                    onChange={(value: Editor.Row) => setInput(value)}
                />
            </div>
            <div style={styles.gap}></div>
            <div style={styles.gap}></div>
            {showSolution && <div style={styles.label}>Steps:</div>}
            {showSolution && step && (
                <Substeps start={step.before} step={step} />
            )}
            {showSolution && <div style={styles.label}>Answer:</div>}
            {showSolution && maybeRenderSolution()}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: {
        display: "grid",
        gridTemplateColumns: "200px auto",
    },
    label: {
        paddingTop: 16,
        fontSize: 32,
        fontFamily: "sans-serif",
    },
    gap: {
        height: 32,
    },
};

export default SolverPage;
