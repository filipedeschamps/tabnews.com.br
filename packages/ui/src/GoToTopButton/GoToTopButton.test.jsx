import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';

import { GoToTopButton } from './GoToTopButton';

const IntersectionObserver = global.IntersectionObserver;
let lastObserver = null;

const MockIntersectionObserver = vi.fn((callback) => {
  lastObserver = {
    callback,
    observe: vi.fn(),
    disconnect: vi.fn(),
  };
  return lastObserver;
});

global.IntersectionObserver = MockIntersectionObserver;

afterEach(() => {
  lastObserver = null;
  MockIntersectionObserver.mockClear();
});

afterAll(() => {
  global.IntersectionObserver = IntersectionObserver;
});

describe('ui', () => {
  describe('GoToTopButton', () => {
    it('does not render the button without interaction', () => {
      render(
        <>
          <header></header>
          <GoToTopButton target="header" />
        </>,
      );
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('renders the button when the target is a CSS selector and is not in view', () => {
      render(
        <>
          <header data-testid="target"></header>
          <GoToTopButton target="header" />
        </>,
      );
      expect(screen.queryByRole('button')).toBeNull();

      expect(lastObserver.observe).toHaveBeenCalledTimes(1);
      expect(lastObserver.observe).toHaveBeenCalledWith(screen.getByTestId('target'));

      act(() => lastObserver.callback([{ isIntersecting: false }]));
      expect(screen.getByRole('button')).toBeVisible();
    });

    it('renders the button when the target is an HTMLElement and is not in view', () => {
      const { container } = render(<div data-testid="html-element-target"></div>);

      const targetElement = screen.getByTestId('html-element-target');

      render(<GoToTopButton target={targetElement} />, { container: container });

      expect(lastObserver.observe).toHaveBeenCalledTimes(1);
      expect(lastObserver.observe).toHaveBeenCalledWith(targetElement);

      act(() => lastObserver.callback([{ isIntersecting: false }]));
      expect(screen.getByRole('button')).toBeVisible();
    });

    it('hides the button when the target is back in view', () => {
      render(
        <>
          <div id="top"></div>
          <GoToTopButton target="#top" />
        </>,
      );

      act(() => lastObserver.callback([{ isIntersecting: false }]));
      expect(screen.queryByRole('button')).not.toBeNull();

      act(() => lastObserver.callback([{ isIntersecting: true }]));
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('calls window.scrollTo when the button is clicked', async () => {
      const scrollToMock = vi.fn();
      const originalScrollTo = window.scrollTo;
      window.scrollTo = scrollToMock;
      const user = userEvent.setup();

      render(
        <>
          <section></section>
          <GoToTopButton target="section" />
        </>,
      );

      act(() => lastObserver.callback([{ isIntersecting: false }]));
      await user.click(screen.getByRole('button'));

      window.scrollTo = originalScrollTo;

      expect(scrollToMock).toHaveBeenCalledTimes(1);
      expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    it('logs a warning if the target element is not found', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementationOnce(() => {});

      render(<GoToTopButton target="#non-existent-element" />);

      expect(consoleSpy).toHaveBeenCalledWith('GoToTopButton: Target element not found.');
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('disconnects the observer on cleanup', () => {
      const { unmount } = render(
        <>
          <header></header>
          <GoToTopButton target="header" />
        </>,
      );

      expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
      expect(lastObserver.observe).toHaveBeenCalledTimes(1);

      unmount();

      expect(lastObserver.disconnect).toHaveBeenCalledTimes(1);
    });
  });
});
