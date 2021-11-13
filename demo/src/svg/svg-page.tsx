import * as React from 'react';

type Props = { readonly shift: number };

const CharBlock: React.FC<Props> = ({ shift }) => {
  return (
    <svg
      style={{
        width: '1em',
        height: '1em',
        background: 'salmon',
        verticalAlign: `${shift}em`,
      }}
    >
      <g fill="white" style={{ transform: 'translate(0, 1em)' }}>
        <text>f</text>
      </g>
    </svg>
  );
};

const SvgPage: React.FC = () => {
  return (
    <div>
      <h1>Hello, world (SVG)</h1>
      <div style={{ fontSize: 72 }}>
        <CharBlock shift={0} />
      </div>

      <div style={{ fontSize: 60 }}>
        <CharBlock shift={0} />
      </div>

      <div style={{ fontSize: 48 }}>
        Hello,
        <CharBlock shift={0.0} />
        <CharBlock shift={0.005} />
        <CharBlock shift={0.01} />
        <CharBlock shift={0.015} />
        <CharBlock shift={0.02} />
        <svg
          style={{
            width: '1em',
            height: '1em',
            background: 'pink',
            verticalAlign: '1px',
          }}
        >
          <g fill="white" style={{ transform: 'translate(0, 1em)' }}>
            <text>f</text>
          </g>
        </svg>
        <CharBlock shift={0.02} />
        <CharBlock shift={0.03} />
        <CharBlock shift={0.04} />
        <CharBlock shift={0.05} />
        world!
      </div>
    </div>
  );
};

export default SvgPage;
