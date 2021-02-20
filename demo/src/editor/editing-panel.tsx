import * as React from "react";

import styles from "./editing-panel.module.css";

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

const Button: React.FunctionComponent<{children: string; keyName: string}> = (
    props,
) => (
    <div
        className={styles.button}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => triggerKeydown(props.keyName)}
    >
        {props.children}
    </div>
);

const EditingPanel: React.FunctionComponent = () => {
    return (
        <div className={styles.container}>
            <Button keyName="Cancel">Cancel</Button>
            <Button keyName="AddRow">Add Row</Button>
            <Button keyName="AddRowWithRule">Add Row With Rule</Button>
            <Button keyName="RemoveRow">Remove Row</Button>
        </div>
    );
};

export default EditingPanel;
