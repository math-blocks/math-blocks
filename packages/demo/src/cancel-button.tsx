import * as React from "react";
import {css, StyleSheet} from "aphrodite";

const CancelButton: React.SFC<{}> = () => {
    return (
        <div
            className={css(styles.button)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
                if (document.activeElement) {
                    const event = new KeyboardEvent("keydown", {
                        bubbles: true,
                        cancelable: true,
                        key: "CANCEL",
                        code: "CANCEL",
                    });
                    document.activeElement.dispatchEvent(event);
                }
            }}
        >
            Cancel
        </div>
    );
};

const styles = StyleSheet.create({
    button: {
        textAlign: "center",
        verticalAlign: "middle",
        backgroundColor: "#CCC",
        lineHeight: "60px",
        cursor: "pointer",
        userSelect: "none",
        ":hover": {
            backgroundColor: "#AAA",
        },
    },
});

export default CancelButton;
