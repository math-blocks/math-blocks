import * as React from 'react';
import { GlyphMetrics, parse } from '@math-blocks/opentype';
import type { Mutable } from 'utility-types';
import type { Blob } from 'buffer';

import type { Font, Glyph, Path, Command } from '@math-blocks/opentype';

import stix2 from '../../../assets/STIX2Math.otf';

const getPath = (glyph: Glyph): string => {
  let result = '';

  // The glyph's path is in font units.
  const path = glyph.path;

  for (const cmd of path) {
    if (cmd.type === 'M') {
      result += `M ${cmd.x},${cmd.y} `;
    } else if (cmd.type === 'L') {
      result += `L ${cmd.x},${cmd.y} `;
    } else if (cmd.type === 'C') {
      result += `C ${cmd.x1},${cmd.y1} ${cmd.x2},${cmd.y2} ${cmd.x},${cmd.y}`;
    } else if (cmd.type === 'Q') {
      result += `Q ${cmd.x1},${cmd.y1} ${cmd.x},${cmd.y}`;
    } else {
      result += 'Z';
    }
  }

  return result;
};

const lerp = (a: number, b: number, amount: number): number => {
  return amount * b + (1 - amount) * a;
};

const lerpPath = (path1: Path, path2: Path, amount: number): Path => {
  const commands: Command[] = [];

  for (let i = 0; i < path1.length; i++) {
    const cmd1 = path1[i];
    const cmd2 = path2[i];

    if (cmd1.type === 'M' && cmd2.type === 'M') {
      commands.push({
        type: 'M',
        x: lerp(cmd1.x, cmd2.x, amount),
        y: lerp(cmd1.y, cmd2.y, amount),
      });
    } else if (cmd1.type === 'L' && cmd2.type === 'L') {
      commands.push({
        type: 'L',
        x: lerp(cmd1.x, cmd2.x, amount),
        y: lerp(cmd1.y, cmd2.y, amount),
      });
    } else if (cmd1.type === 'C' && cmd2.type === 'C') {
      commands.push({
        type: 'C',
        x: lerp(cmd1.x, cmd2.x, amount),
        y: lerp(cmd1.y, cmd2.y, amount),
        x1: lerp(cmd1.x1, cmd2.x1, amount),
        y1: lerp(cmd1.y1, cmd2.y1, amount),
        x2: lerp(cmd1.x2, cmd2.x2, amount),
        y2: lerp(cmd1.y2, cmd2.y2, amount),
      });
    } else if (cmd1.type === 'Q' && cmd2.type === 'Q') {
      commands.push({
        type: 'Q',
        x: lerp(cmd1.x, cmd2.x, amount),
        y: lerp(cmd1.y, cmd2.y, amount),
        x1: lerp(cmd1.x1, cmd2.x1, amount),
        y1: lerp(cmd1.y1, cmd2.y1, amount),
      });
    } else if (cmd1.type === 'Z' && cmd2.type === 'Z') {
      commands.push({
        type: 'Z',
      });
    } else {
      throw new Error('Command type mismatch');
    }
  }

  return commands;
};

const pathToString = (path: Path): string => {
  let result = '';

  for (const cmd of path) {
    if (cmd.type === 'M') {
      result += `M ${cmd.x},${cmd.y} `;
    } else if (cmd.type === 'L') {
      result += `L ${cmd.x},${cmd.y} `;
    } else if (cmd.type === 'C') {
      result += `C ${cmd.x1},${cmd.y1} ${cmd.x2},${cmd.y2} ${cmd.x},${cmd.y}`;
    } else if (cmd.type === 'Q') {
      result += `Q ${cmd.x1},${cmd.y1} ${cmd.x},${cmd.y}`;
    } else {
      result += 'Z';
    }
  }

  return result;
};

const OpenTypeDemo: React.FC = () => {
  const [font, setFont] = React.useState<Font | null>(null);

  React.useEffect(() => {
    const loadFont = async (): Promise<void> => {
      const res = await fetch(stix2);
      const blob = await res.blob();
      const font = await parse(blob as Blob);
      console.log(font);
      setFont(font);
    };

    loadFont();
  }, []);

  if (font) {
    const children = [];

    const glyphs = {
      LEFT_PAREN: {
        start: 1301,
        count: 11, // there's 12 but we're counting from 0
      },
      LEFT_BRACE: {
        start: 1349,
        count: 10, // there's actually 11 when counting from 0
      },
    };

    const count = glyphs.LEFT_BRACE.count;
    const start = glyphs.LEFT_BRACE.start;
    const end = start + count;

    const fontSize = 72;
    const scale = fontSize / font.head.unitsPerEm;

    for (let i = 0; i <= count; i++) {
      const d = getPath(font.getGlyph(start + i));
      children.push(
        <path
          key={start + i}
          d={d}
          transform={`translate(${i * 50}, 0) scale(${scale}, -${scale})`}
        />,
      );
    }

    const lerpChildren = [];

    const d1 = font.getGlyph(start);
    const d12 = font.getGlyph(end);

    for (let i = 0; i <= count + 5; i++) {
      const path = lerpPath(d1.path, d12.path, i / count);
      lerpChildren.push(
        <path
          key={start + i}
          d={pathToString(path)}
          transform={`translate(${i * 50}, 0) scale(${scale}, -${scale})`}
        />,
      );
    }

    const surdChildren = [];

    const surd = font.getGlyph(1657);
    const surd4 = font.getGlyph(1660);

    // overshoot by twice
    for (let i = 0; i <= 12 + 12; i++) {
      const path = lerpPath(surd.path, surd4.path, i / 12);
      surdChildren.push(
        <path
          key={start + i}
          d={pathToString(path)}
          transform={`translate(${i * 25}, 0) scale(${scale}, -${scale})`}
        />,
      );
    }

    const intPath = lerpPath(
      font.getGlyph(1701).path,
      font.getGlyph(1702).path,
      0.5,
    );

    const gid = 3354;
    const glyph = font.getGlyph(gid);

    let parenPath = '';
    for (const cmd of glyph.path) {
      if (cmd.type === 'M') {
        parenPath += `M ${cmd.x},${cmd.y} `;
      } else if (cmd.type === 'L') {
        parenPath += `L ${cmd.x},${cmd.y} `;
      } else if (cmd.type === 'C') {
        parenPath += `C ${cmd.x1},${cmd.y1} ${cmd.x2},${cmd.y2} ${cmd.x},${cmd.y}`;
      } else if (cmd.type === 'Q') {
        parenPath += `Q ${cmd.x1},${cmd.y1} ${cmd.x},${cmd.y}`;
      } else {
        parenPath += 'Z';
      }
    }

    const metrics = font.getGlyphMetrics(gid) as Mutable<GlyphMetrics>;
    metrics.bearingX *= scale;
    metrics.bearingY *= scale;
    metrics.width *= scale;
    metrics.height *= scale;
    metrics.advance *= scale;

    return (
      <svg viewBox="0 0 1024 800" width={1024} height={800}>
        <g fill="currentcolor">
          <path
            transform={`translate(100, 150) scale(${scale}, -${scale})`}
            d={pathToString(intPath)}
          />
          <path
            transform={`translate(150, 150) scale(${scale}, -${scale})`}
            d={getPath(font.getGlyph(3354))}
          />
          <path
            transform={`translate(200, 150) scale(${scale}, -${scale})`}
            d={getPath(font.getGlyph(3329))}
          />
          <path
            transform={`translate(250, 150)  scale(${scale}, -${scale})`}
            d={getPath(font.getGlyph(1679))}
          />
          <g fill="blue" transform="translate(15, 512)">
            {children}
          </g>
          <g fill="red" transform="translate(30, 512)">
            {lerpChildren}
          </g>
          <g transform="translate(15, 400)">{surdChildren}</g>
          <path
            transform={`translate(25, 800) scale(${scale}, -${scale})`}
            d={getPath(font.getGlyph(1661))}
          />
          <path
            transform={`translate(25, 600) scale(${scale}, -${scale})`}
            d={getPath(font.getGlyph(1662))}
          />
          <path
            transform={`translate(25, 650) scale(${scale}, -${scale})`}
            d={getPath(font.getGlyph(1664))}
          />
          {/* uni221A.var is a variant for sqrt without overbar */}
          <path
            transform={`translate(100, 800) scale(${scale}, -${scale})`}
            d={getPath(font.getGlyph(1663))}
          />
          <rect
            x={150 + metrics.bearingX}
            // bearingY is the distance up from the origin, but SVG
            // has the y-axis pointing down whereas fonts have the
            // y-axis pointing up.
            y={200 - metrics.bearingY}
            width={metrics.width}
            height={metrics.height}
            fill="transparent"
            stroke="orange"
          />
          <path
            transform={`translate(150, 200) scale(${scale}, ${-scale})`}
            d={parenPath}
          />
          <ellipse cx={150} cy={200} rx={3} ry={3} fill="blue" />
        </g>
      </svg>
    );
  }

  return <h1>Loading font...</h1>;
};

export default OpenTypeDemo;
