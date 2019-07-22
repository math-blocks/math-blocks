import * as React from "react";
import { css, StyleSheet } from "aphrodite";

const buttons = [
  { name: "pm", char: "\u00B1" },
  { name: "infinity", char: "\u221E" },
  { name: "sqrt", char: "\u221A" },
  { name: "neq", char: "\u2260" },

  { name: "le", char: "<" },
  { name: "lte", char: "\u2264" },
  { name: "ge", char: ">" },
  { name: "gte", char: "\u2265" },

  { name: "theta", char: "\u03B8" },
  { name: "pi", char: "\u03C0" },
  { name: "PI", char: "\u03A0" },
  { name: "Sigma", char: "\u03A3" },

  { name: "Delta", char: "\u0394" },
  { name: "int", char: "\u222B" },
  { name: "prime", char: "\u2032" },
  { name: "Sigma", char: "\u2202" }
];

class MathKeypad extends React.Component<{}> {
  render() {
return (
      <div className={css(styles.container)}>
        {buttons.map((button, index) => (
          <div
            className={css(styles.item)}
            key={button.name}
            onClick={() => console.log(`'${button.char}' was pressed`)}
          >
            {button.char}
          </div>
        ))}
      </div>
    );
  }
}

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
    width: 240
  },
  item: {
    textAlign: "center",
    verticalAlign: "middle",
    backgroundColor: "#222",
    lineHeight: "60px",
    cursor: "pointer",
    userSelect: "none",
    ":hover": {
      backgroundColor: "#444"
    }
  }
});

export default MathKeypad;
