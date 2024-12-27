import type { Path, Command } from '@math-blocks/opentype';

const lerp = (a: number, b: number, amount: number): number => {
  return amount * b + (1 - amount) * a;
};

export const lerpPath = (path1: Path, path2: Path, amount: number): Path => {
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
