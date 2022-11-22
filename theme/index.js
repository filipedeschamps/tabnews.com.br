import { theme } from '@primer/react';
import deepmerge from 'deepmerge';
import defaultTheme from './default.json';

const customTheme = deepmerge(theme, {
  ...defaultTheme,
});

export { customTheme };
