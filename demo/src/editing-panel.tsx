import * as React from "react";
import {css, StyleSheet} from "aphrodite";

type EmptyProps = Record<string, never>;

const triggerKeydown = (key: string): void => {
    if (document.activeElement) {
        const event = new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            key: key,
        });
        document.activeElement.dispatchEvent(event);
    }
};

const Button: React.SFC<{children: string; keyName: string}> = (props) => (
    <div
        className={css(styles.button)}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => triggerKeydown(props.keyName)}
    >
        {props.children}
    </div>
);

const EditingPanel: React.FunctionComponent<EmptyProps> = () => {
    return (
        <div className={css(styles.container)}>
            <Button keyName="Cancel">Cancel</Button>
            <Button keyName="AddRow">Add Row</Button>
            <Button keyName="AddRowWithRule">Add Row With Rule</Button>
            <Button keyName="RemoveRow">Remove Row</Button>
        </div>
    );
};

const styles = StyleSheet.create({
    container: {
        display: "flex",
        flexDirection: "column",
    },
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
        fontFamily: "sans-serif",
        fontSize: "20pt",
    },
});

export default EditingPanel;
