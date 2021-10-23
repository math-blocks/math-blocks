import * as React from 'react';

import './handwriting-element';

// TODO:
// - have a separate mode for selecting one or more strokes
// - handle mouse events that happen outside the canvas
// - provide a way to map selected strokes to a character
// - provide a way to save the data

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      readonly 'x-handwriting': any;
    }
  }
}

const HandwritingPage: React.FunctionComponent = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'start',
      }}
    >
      <x-handwriting style={{ border: 'solid 1px black' }}></x-handwriting>
    </div>
  );
};

export default HandwritingPage;
