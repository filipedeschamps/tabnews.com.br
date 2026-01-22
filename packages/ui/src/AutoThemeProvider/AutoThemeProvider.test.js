import { useTheme } from '@primer/react';
import { render } from '@testing-library/react';

import { AutoThemeProvider, NoFlashGlobalStyle } from '.';
import { ColorModeCookieSync } from './AutoThemeProvider';

const COLOR_MODE_COOKIE = 'cm';

vi.mock('@primer/react', () => ({
  useTheme: vi.fn().mockImplementation(() => ({ resolvedColorMode: 'light' })),
}));

describe('ui', () => {
  beforeEach(() => {
    document.cookie = `${COLOR_MODE_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });

  describe('AutoThemeProvider', () => {
    vi.mock('../ThemeProvider', () => ({
      ThemeProvider: ({ children, colorMode, ...props }) => (
        <div data-testid="ThemeProvider" data-test-colormode={colorMode} {...props}>
          {children}
        </div>
      ),
    }));

    afterEach(() => localStorage.clear());

    it('renders children correctly', () => {
      const { getByTestId } = render(
        <AutoThemeProvider>
          <div data-testid="child">Child Content</div>
        </AutoThemeProvider>,
      );

      expect(getByTestId('child').innerHTML).toBe('Child Content');
    });

    it('sets initial color mode', () => {
      const { container } = render(<AutoThemeProvider />);
      const colorMode = container.querySelector('[data-testid="ThemeProvider"]').getAttribute('data-test-colormode');

      expect(colorMode).toBe('light');
    });

    it('sets initial color mode to "dark" via "defaultColorMode"', () => {
      const { container } = render(<AutoThemeProvider defaultColorMode="dark" />);
      const colorMode = container.querySelector('[data-testid="ThemeProvider"]').getAttribute('data-test-colormode');

      expect(colorMode).toBe('dark');
    });

    it('uses cached color mode from localStorage if available', () => {
      localStorage.setItem('colorMode', 'dark');
      const { container } = render(<AutoThemeProvider defaultColorMode="light" />);
      const colorMode = container.querySelector('[data-testid="ThemeProvider"]').getAttribute('data-test-colormode');

      expect(colorMode).toBe('dark');
    });

    it('removes data-no-flash attribute after setting color mode', () => {
      vi.useFakeTimers();
      document.documentElement.setAttribute('data-no-flash', 'true');
      render(<AutoThemeProvider defaultColorMode="light" />);

      vi.runAllTimers();
      vi.useRealTimers();

      expect(document.documentElement.getAttribute('data-no-flash')).toBeNull();
    });

    it('applies NoFlashGlobalStyle correctly', () => {
      const { container } = render(<AutoThemeProvider defaultColorMode="light" />);
      const styleTag = container.querySelector('style');

      expect(styleTag).not.toBeNull();
      expect(styleTag.textContent).toContain("html[data-no-flash='true'] { visibility: hidden; }");
    });

    it('does not apply NoFlashGlobalStyle when noFlash is false', () => {
      const { container } = render(<AutoThemeProvider noFlash={false} />);
      const styleTag = container.querySelector('style');

      expect(styleTag).toBeNull();
    });

    it('applies ColorModeCookieSync correctly', () => {
      render(<AutoThemeProvider defaultColorMode="light" />);

      expect(document.cookie).toContain(`${COLOR_MODE_COOKIE}=light`);
    });
  });

  describe('NoFlashGlobalStyle', () => {
    it('renders the correct global style', () => {
      const { container } = render(<NoFlashGlobalStyle />);
      const styleTag = container.querySelector('style');

      expect(styleTag).not.toBeNull();
      expect(styleTag.innerHTML).toBe("html[data-no-flash='true'] { visibility: hidden; }");
    });
  });

  describe('ColorModeCookieSync', () => {
    it('sets the color mode cookie with the resolved color mode', () => {
      render(<ColorModeCookieSync />);

      expect(document.cookie).toContain(`${COLOR_MODE_COOKIE}=light`);
    });

    it('updates the color mode cookie when the resolved color mode changes', () => {
      const { rerender } = render(<ColorModeCookieSync />);
      useTheme.mockReturnValueOnce({ resolvedColorMode: 'dark' });

      rerender(<ColorModeCookieSync />);

      expect(document.cookie).toContain(`${COLOR_MODE_COOKIE}=dark`);
    });
  });
});
