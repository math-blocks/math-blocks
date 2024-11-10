import path from 'path';

export default {
  stories: [
    '../packages/react/src/stories/*.stories.mdx',
    '../packages/react/src/stories/*.stories.@(ts|tsx)',
  ],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials'],
  presets: [path.resolve(__dirname, './aliases-preset.js')],
};
