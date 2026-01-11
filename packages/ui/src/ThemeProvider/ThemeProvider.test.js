import * as primerReact from '@primer/react';
import { render } from '@testing-library/react';

import { GlobalStyle, ThemeProvider } from '.';

vi.hoisted(() => vi.resetModules());

describe('ui', () => {
  describe('ThemeProvider', () => {
    afterAll(() => {
      vi.restoreAllMocks();
    });

    it('applies dark color scheme and background color', () => {
      vi.spyOn(primerReact, 'useTheme').mockReturnValue({
        resolvedColorScheme: 'dark',
        theme: {
          colors: {
            canvas: {
              default: '#654321',
            },
          },
        },
      });

      const { container } = render(
        <ThemeProvider colorMode="night">
          <div data-testid="child">Night Content</div>
        </ThemeProvider>,
      );

      const child = container.querySelector(`[data-testid="child"]`);
      const styleTag = container.querySelector('style');

      expect(child.innerHTML).toBe('Night Content');
      expect(child.parentElement.dataset.colorMode).toBe('dark');

      expect(styleTag).not.toBeNull();
      expect(styleTag.getAttribute('jsx')).toBe('true');
      expect(styleTag.getAttribute('global')).toBe('true');
      expect(styleTag.innerHTML).toContain('color-scheme: dark');
      expect(styleTag.innerHTML).toContain('background: #654321');
    });

    it('applies light color scheme and background color', () => {
      vi.spyOn(primerReact, 'useTheme').mockReturnValue({
        resolvedColorScheme: 'light',
        theme: {
          colors: {
            canvas: {
              default: '#FEDCBA',
            },
          },
        },
      });

      const { container } = render(
        <ThemeProvider>
          <div data-testid="child">Day Content</div>
        </ThemeProvider>,
      );

      const child = container.querySelector(`[data-testid="child"]`);
      const styleTag = container.querySelector('style');

      expect(child.innerHTML).toBe('Day Content');
      expect(child.parentElement.dataset.colorMode).toBe('light');

      expect(styleTag).not.toBeNull();
      expect(styleTag.getAttribute('global')).toBe('true');
      expect(styleTag.getAttribute('jsx')).toBe('true');
      expect(styleTag.innerHTML).toContain('color-scheme: light');
      expect(styleTag.innerHTML).toContain('background: #FEDCBA');
    });
  });

  describe('GlobalStyle', () => {
    it('renders the correct global style', () => {
      vi.spyOn(primerReact, 'useTheme').mockReturnValue({
        resolvedColorScheme: 'dark',
        theme: {
          colors: {
            canvas: {
              default: '#789',
            },
          },
        },
      });

      const { container } = render(<GlobalStyle />);
      const styleTag = container.querySelector('style');

      expect(styleTag).not.toBeNull();
      expect(styleTag.getAttribute('jsx')).toBe('true');
      expect(styleTag.getAttribute('global')).toBe('true');
      expect(styleTag.innerHTML).toBe(`
      html:root {
        color-scheme: dark;
      }
      body {
        background: #789;
      }
    `);
    });
  });
});
