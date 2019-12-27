import * as React from "react";
import {css, StyleSheet} from "aphrodite";

type Button = {
    readonly char: string;
    readonly name: string;
};

const buttons: readonly Button[] = [
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
    {name: "PI", char: "\u03A0"},
    {name: "Sigma", char: "\u03A3"},
    {name: "Delta", char: "\u0394"},
    {name: "int", char: "\u222B"},
    {name: "prime", char: "\u2032"},
    {name: "partial", char: "\u2202"},
];

const MathKeypad: React.SFC<{}> = () => {
    const handleClick = (button: Button): void => {
        console.log(`'${button.char}' was pressed`);
        const event = new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            key: button.char,
        });
        if (document.activeElement) {
            document.activeElement.dispatchEvent(event);
        }
    };

    return (
        <div className={css(styles.container)}>
            {buttons.map(button => (
                <div
                    className={css(styles.item)}
                    key={button.name}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleClick(button)}
                >
                    {button.char}
                </div>
            ))}
        </div>
    );
};

const styles = StyleSheet.create({
    container: {
        display: "grid",
        gridTemplateColumns: "auto auto auto auto",
        gridAutoRows: 60,
        fontFamily: "comic sans ms",
        fontSize: 28,
        gridColumnGap: 1,
        gridRowGap: 1,
        backgroundColor: "white",
        border: "solid 1px white",
        width: 240,
    },
    item: {
        textAlign: "center",
        verticalAlign: "middle",
        backgroundColor: "#222",
        lineHeight: "60px",
        cursor: "pointer",
        userSelect: "none",
        ":hover": {
            backgroundColor: "#444",
        },
    },
});

export default MathKeypad;
