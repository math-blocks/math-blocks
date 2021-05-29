import * as React from "react";

type EmptyProps = Record<string, never>;

const FormattingPalette: React.FC<EmptyProps> = (props) => {
    return (
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
            onMouseDown={(e) => {
                e.preventDefault();
            }}
        />
    );
};

export default FormattingPalette;
