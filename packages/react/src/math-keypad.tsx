import * as React from "react";

import styles from "./keypad.module.css";

type CharButton = {
    type: "InsertChar";
    char: string;
    name: string;
};

export type EditingEvent =
    | {
          type: "InsertMatrix";
      }
    | {
          type: "AddColumn";
          side: "left" | "right";
      }
    | {
          type: "AddRow";
          side: "above" | "below";
      }
    | {
          type: "DeleteColumn";
      }
    | {
          type: "DeleteRow";
      };

const buttons: readonly CharButton[] = [
    {type: "InsertChar", name: "pm", char: "\u00B1"},
    {type: "InsertChar", name: "infinity", char: "\u221E"},
    {type: "InsertChar", name: "sqrt", char: "\u221A"},
    {type: "InsertChar", name: "neq", char: "\u2260"},
    {type: "InsertChar", name: "le", char: "<"},
    {type: "InsertChar", name: "lte", char: "\u2264"},
    {type: "InsertChar", name: "ge", char: ">"},
    {type: "InsertChar", name: "gte", char: "\u2265"},
    {type: "InsertChar", name: "theta", char: "\u03B8"},
    {type: "InsertChar", name: "pi", char: "\u03C0"},
    {type: "InsertChar", name: "Pi", char: "\u03A0"},
    {type: "InsertChar", name: "Sigma", char: "\u03A3"},
    {type: "InsertChar", name: "Delta", char: "\u0394"},
    {type: "InsertChar", name: "int", char: "\u222B"},
    {type: "InsertChar", name: "prime", char: "\u2032"},
    {type: "InsertChar", name: "partial", char: "\u2202"},
];

type EmptyProps = Record<string, never>;

const MathKeypad: React.FunctionComponent<EmptyProps> = () => {
    const handleClick = (button: CharButton): void => {
        if (document.activeElement) {
            const event = new KeyboardEvent("keydown", {
                bubbles: true,
                cancelable: true,
                key: button.char,
            });
            document.activeElement.dispatchEvent(event);
        }
    };

    const handleMatrixClick = (detail: EditingEvent): void => {
        if (document.activeElement) {
            const event = new CustomEvent("editing", {
                detail: detail,
                bubbles: true,
                cancelable: true,
            });
            document.activeElement.dispatchEvent(event);
        }
    };

    return (
        <div style={{display: "flex", flexDirection: "row"}}>
            <div className={styles.container}>
                {buttons.map((button) => (
                    <div
                        className={styles.item}
                        key={button.name}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleClick(button)}
                    >
                        {button.char}
                    </div>
                ))}
            </div>
            <div className={styles.container2}>
                <div
                    className={styles.item2}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleMatrixClick({type: "InsertMatrix"})}
                >
                    + matrix
                </div>
                <div></div>
                <div></div>
                <div
                    className={styles.item2}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() =>
                        handleMatrixClick({type: "AddRow", side: "above"})
                    }
                >
                    + row above
                </div>
                <div
                    className={styles.item2}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() =>
                        handleMatrixClick({type: "AddRow", side: "below"})
                    }
                >
                    + row below
                </div>
                <div
                    className={styles.item2}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleMatrixClick({type: "DeleteRow"})}
                >
                    - row
                </div>
                <div
                    className={styles.item2}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() =>
                        handleMatrixClick({type: "AddColumn", side: "left"})
                    }
                >
                    + column left
                </div>
                <div
                    className={styles.item2}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() =>
                        handleMatrixClick({type: "AddColumn", side: "right"})
                    }
                >
                    + column right
                </div>
                <div
                    className={styles.item2}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleMatrixClick({type: "DeleteColumn"})}
                >
                    - column
                </div>
            </div>
        </div>
    );
};

export default MathKeypad;
