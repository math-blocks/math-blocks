import * as React from 'react';

type EmptyProps = Record<string, never>;

type FormattingEvent =
  | {
      readonly type: 'color';
      readonly value: string;
    }
  | {
      readonly type: 'cancel';
    }
  | {
      readonly type: 'uncancel';
    };

// TODO: determine the color based on the current selection
const FormattingPalette: React.FC<EmptyProps> = (props) => {
  return (
    <div>
      <input
        type="color"
        onChange={(e) => {
          const color = e.target.value;

          if (document.activeElement) {
            const event = new CustomEvent<FormattingEvent>('formatting', {
              detail: {
                type: 'color',
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
            const event = new CustomEvent<FormattingEvent>('formatting', {
              detail: {
                type: 'cancel',
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
      <button
        onClick={() => {
          if (document.activeElement) {
            const event = new CustomEvent<FormattingEvent>('formatting', {
              detail: {
                type: 'uncancel',
              },
              bubbles: true,
              cancelable: true,
            });
            document.activeElement.dispatchEvent(event);
          }
        }}
        onMouseDown={(e) => e.preventDefault()}
      >
        Uncancel
      </button>
    </div>
  );
};

export default FormattingPalette;
