import * as React from 'react';

import styles from './keypad.module.css';

type CharButton = {
  readonly type: 'InsertChar';
  readonly char: string;
  readonly name: string;
};

export type EditingEvent =
  | {
      readonly type: 'InsertMatrix';
      readonly delimiters: 'brackets' | 'parens';
    }
  | {
      readonly type: 'AddColumn';
      readonly side: 'left' | 'right';
    }
  | {
      readonly type: 'AddRow';
      readonly side: 'above' | 'below';
    }
  | {
      readonly type: 'DeleteColumn';
    }
  | {
      readonly type: 'DeleteRow';
    };

const buttons: readonly CharButton[] = [
  { type: 'InsertChar', name: 'pm', char: '\u00B1' },
  { type: 'InsertChar', name: 'infinity', char: '\u221E' },
  { type: 'InsertChar', name: 'sqrt', char: '\u221A' },
  { type: 'InsertChar', name: 'neq', char: '\u2260' },
  { type: 'InsertChar', name: 'le', char: '<' },
  { type: 'InsertChar', name: 'lte', char: '\u2264' },
  { type: 'InsertChar', name: 'ge', char: '>' },
  { type: 'InsertChar', name: 'gte', char: '\u2265' },
  { type: 'InsertChar', name: 'theta', char: '\u03B8' },
  { type: 'InsertChar', name: 'pi', char: '\u03C0' },
  { type: 'InsertChar', name: 'prod', char: '\u220F' },
  { type: 'InsertChar', name: 'sum', char: '\u2211' },
  { type: 'InsertChar', name: 'Delta', char: '\u0394' },
  { type: 'InsertChar', name: 'int', char: '\u222B' },
  { type: 'InsertChar', name: 'prime', char: '\u2032' },
  { type: 'InsertChar', name: 'partial', char: '\u2202' },
];

type EmptyProps = Record<string, never>;

const MathKeypad: React.FunctionComponent<EmptyProps> = () => {
  const handleClick = (button: CharButton): void => {
    if (document.activeElement) {
      const event = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: button.char,
      });
      document.activeElement.dispatchEvent(event);
    }
  };

  const handleMatrixClick = (detail: EditingEvent): void => {
    if (document.activeElement) {
      const event = new CustomEvent('editing', {
        detail: detail,
        bubbles: true,
        cancelable: true,
      });
      document.activeElement.dispatchEvent(event);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
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
          onClick={() =>
            handleMatrixClick({
              type: 'InsertMatrix',
              delimiters: 'brackets',
            })
          }
        >
          + bmatrix
        </div>
        <div
          className={styles.item2}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            handleMatrixClick({
              type: 'InsertMatrix',
              delimiters: 'parens',
            })
          }
        >
          + pmatrix
        </div>
        <div
          className={styles.item2}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleMatrixClick({ type: 'AddRow', side: 'above' })}
        >
          + row above
        </div>
        <div
          className={styles.item2}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleMatrixClick({ type: 'AddColumn', side: 'left' })}
        >
          + col left
        </div>
        <div
          className={styles.item2}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleMatrixClick({ type: 'AddRow', side: 'below' })}
        >
          + row below
        </div>
        <div
          className={styles.item2}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            handleMatrixClick({ type: 'AddColumn', side: 'right' })
          }
        >
          + col right
        </div>
        <div
          className={styles.item2}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleMatrixClick({ type: 'DeleteRow' })}
        >
          - row
        </div>
        <div
          className={styles.item2}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleMatrixClick({ type: 'DeleteColumn' })}
        >
          - col
        </div>
      </div>
    </div>
  );
};

export default MathKeypad;
