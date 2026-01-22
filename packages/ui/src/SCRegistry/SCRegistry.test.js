import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';

import { StyledComponentsRegistry } from './SCRegistry';

const hoisted = vi.hoisted(() => ({
  useServerInsertedHTML: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useServerInsertedHTML: hoisted.useServerInsertedHTML,
}));

describe('ui', () => {
  describe('StyledComponentsRegistry', () => {
    describe('on the client', () => {
      it('should render children correctly', () => {
        const { container } = render(
          <StyledComponentsRegistry>
            <div>Test Child</div>
          </StyledComponentsRegistry>,
        );
        expect(container.textContent).toBe('Test Child');
      });
    });

    describe('on the server', () => {
      beforeAll(() => {
        vi.stubGlobal('window', undefined);
      });

      beforeEach(() => {
        hoisted.useServerInsertedHTML.mockClear();
      });

      afterAll(vi.unstubAllGlobals);

      it('should render children correctly', () => {
        const html = renderToString(
          <StyledComponentsRegistry>
            <div>Test Child</div>
          </StyledComponentsRegistry>,
        );

        expect(html).toContain('Test Child');
      });

      it('should call useServerInsertedHTML', () => {
        renderToString(
          <StyledComponentsRegistry>
            <div>Test Child</div>
          </StyledComponentsRegistry>,
        );

        expect(hoisted.useServerInsertedHTML).toHaveBeenCalled();
      });
    });
  });
});
