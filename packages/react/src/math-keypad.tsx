import * as React from "react";

import styles from "./keypad.module.css";

type Button = {
    char: string;
    name: string;
};

const buttons: Button[] = [
    {name: "pm", char: "\u00B1"},
    {name: "infinity", char: "\u221E"},
    {name: "sqrt", char: "\u221A"},
    {name: "neq", char: "\u2260"},
    {name: "le", char: "<"},
    {name: "lte", char: "\u2264"},
    {name: "ge", char: ">"},
    {name: "gte", char: "\u2265"},
    {name: "theta", char: "\u03B8"},
    {name: "pi", char: "\u03C0"},
    {name: "Pi", char: "\u03A0"},
    {name: "Sigma", char: "\u03A3"},
    {name: "Delta", char: "\u0394"},
    {name: "int", char: "\u222B"},
    {name: "prime", char: "\u2032"},
    {name: "partial", char: "\u2202"},
];

type EmptyProps = Record<string, never>;

const MathKeypad: React.FunctionComponent<EmptyProps> = () => {
    const handleClick = (button: Button): void => {
        if (document.activeElement) {
            const event = new KeyboardEvent("keydown", {
                bubbles: true,
                cancelable: true,
                key: button.char,
            });
            document.activeElement.dispatchEvent(event);
        }
    };

    return (
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
    );
};

export default MathKeypad;
