import { render } from '@testing-library/react';
import { cookies } from 'next/headers';

import { PrimerRoot } from './PrimerRoot';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('../AutoThemeProvider/AutoThemeProvider.jsx', () => ({
  AutoThemeProvider: ({ children, defaultColorMode, preventSSRMismatch }) => (
    <div
      data-testid="auto-theme-provider"
      data-default-color-mode={defaultColorMode}
      data-prevent-ssr-mismatch={preventSSRMismatch}>
      {children}
    </div>
  ),
}));

vi.mock('../SCRegistry/SCRegistry.jsx', () => ({
  StyledComponentsRegistry: ({ children }) => <div data-testid="styled-components-registry">{children}</div>,
}));

describe('ui', () => {
  describe('PrimerRoot', () => {
    const mockCookieStore = {
      get: vi.fn().mockResolvedValue(null),
    };

    const defaultProps = {
      children: <div data-testid="test-children">Test children</div>,
    };

    beforeEach(() => {
      vi.clearAllMocks();
      cookies.mockReturnValue(mockCookieStore);
    });

    it('renders core HTML structure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { container, getByTestId } = await renderServerComponent(PrimerRoot, {
        ...defaultProps,
        lang: 'en',
      });

      consoleErrorSpy.mockRestore();

      const html = container.querySelector('html');
      const body = container.querySelector('body');
      const children = getByTestId('test-children');

      expect(html).toBeInTheDocument();
      expect(html).toHaveAttribute('lang', 'en');
      expect(html).toContainElement(body);
      expect(body).toContainElement(children);
    });

    it('renders with proper component hierarchy', async () => {
      const { getByTestId } = await renderServerComponent(PrimerRoot, defaultProps);

      const styledComponentsRegistry = getByTestId('styled-components-registry');
      const autoThemeProvider = getByTestId('auto-theme-provider');
      const children = getByTestId('test-children');

      expect(styledComponentsRegistry).toContainElement(autoThemeProvider);
      expect(autoThemeProvider).toContainElement(children);
    });

    it('renders with default light theme when no color mode is provided', async () => {
      const { container, getByTestId } = await renderServerComponent(PrimerRoot, defaultProps);

      const autoThemeProvider = getByTestId('auto-theme-provider');

      expect(container.querySelector('html')).toHaveAttribute('data-color-mode', 'light');
      expect(autoThemeProvider).toHaveAttribute('data-default-color-mode', 'light');
    });

    it('uses dark theme when colorMode prop is "dark"', async () => {
      mockCookieStore.get.mockResolvedValueOnce({ value: 'light' });

      const { container } = await renderServerComponent(PrimerRoot, {
        ...defaultProps,
        colorMode: 'dark',
        defaultColorMode: 'light',
      });

      expect(container.querySelector('html')).toHaveAttribute('data-color-mode', 'dark');
    });

    it('uses cookie value for color mode when available', async () => {
      mockCookieStore.get.mockResolvedValueOnce({ value: 'dark' });

      const { container } = await renderServerComponent(PrimerRoot, {
        ...defaultProps,
        defaultColorMode: 'light',
      });

      expect(container.querySelector('html')).toHaveAttribute('data-color-mode', 'dark');
    });

    it('uses defaultColorMode when no cookie or colorMode prop is provided', async () => {
      const { container } = await renderServerComponent(PrimerRoot, {
        ...defaultProps,
        defaultColorMode: 'dark',
      });

      expect(container.querySelector('html')).toHaveAttribute('data-color-mode', 'dark');
    });

    it('passes preventSSRMismatch prop to AutoThemeProvider', async () => {
      const { getByTestId } = await renderServerComponent(PrimerRoot, {
        ...defaultProps,
        preventSSRMismatch: true,
      });

      const autoThemeProvider = getByTestId('auto-theme-provider');
      expect(autoThemeProvider).toHaveAttribute('data-prevent-ssr-mismatch', 'true');
    });

    it('passes additional props to the HTML element', async () => {
      const { container } = await renderServerComponent(PrimerRoot, {
        ...defaultProps,
        htmlProps: {
          'data-custom-attribute': 'customValue',
        },
      });

      const html = container.querySelector('html');
      expect(html).toHaveAttribute('data-custom-attribute', 'customValue');
    });

    it('renders headChildren in the head', async () => {
      const { container } = await renderServerComponent(PrimerRoot, {
        ...defaultProps,
        headChildren: <meta name="description" content="Test description" />,
      });

      const head = container.querySelector('head');
      const meta = head.querySelector('meta[name="description"]');

      expect(meta).toBeInTheDocument();
      expect(meta).toHaveAttribute('content', 'Test description');
    });
  });
});

/**
 * Renders an asynchronous Next.js server component for testing
 * @param asyncComponent Promise that resolves to a React element or async function that returns JSX
 * @param props Object of props to pass to the component
 * @returns Promise that resolves to the testing-library render result
 */
async function renderServerComponent(asyncComponent, props) {
  const componentPromise = typeof asyncComponent === 'function' ? asyncComponent(props) : asyncComponent;
  const resolvedComponent = await componentPromise;
  return render(resolvedComponent);
}
