import * as React from "react";

type EmptyProps = Record<string, never>;

// TODO: determine the color based on the current selection
// TODO:
const FormattingPalette: React.FC<EmptyProps> = (props) => {
    return (
        <div>
            <input
                type="color"
                onChange={(e) => {
                    const color = e.target.value;

                    if (document.activeElement) {
                        const event = new CustomEvent("formatting", {
                            detail: {
                                type: "color",
                                value: color,
                            },
                            bubbles: true,
                            cancelable: true,
                        });
                        document.activeElement.dispatchEvent(event);
                    }
                }}
                onMouseDown={(e) => e.preventDefault()}
            />
            <button
                onClick={() => {
                    if (document.activeElement) {
                        const event = new CustomEvent("formatting", {
                            detail: {
                                type: "cancel",
                            },
                            bubbles: true,
                            cancelable: true,
                        });
                        document.activeElement.dispatchEvent(event);
                    }
                }}
                onMouseDown={(e) => e.preventDefault()}
            >
                Cancel
            </button>
        </div>
    );
};

export default FormattingPalette;
