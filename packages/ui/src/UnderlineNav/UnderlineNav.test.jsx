import { render, waitFor } from '@testing-library/react';

import { UnderlineNav } from './UnderlineNav';

const originalResizeObserver = global.ResizeObserver;

beforeEach(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  global.ResizeObserver = originalResizeObserver;
});

describe('UnderlineNav', () => {
  it('localizes the overflow button ("More" to "Mais") and removes the " items" suffix', async () => {
    const { container } = render(
      <UnderlineNav aria-label="Conteúdos recentes">
        <UnderlineNav.Item href="/a">A</UnderlineNav.Item>
        <UnderlineNav.Item href="/b">B</UnderlineNav.Item>
      </UnderlineNav>,
    );

    const nav = container.querySelector('nav');

    const item = document.createElement('li');
    item.innerHTML =
      '<button aria-expanded="false"><span>More<span hidden>&nbsp;Conteúdos recentes items</span></span></button>';
    nav.querySelector('ul').appendChild(item);

    await waitFor(() => {
      const button = nav.querySelector('button[aria-expanded]');
      expect(button).toHaveTextContent('Mais');
      expect(button.textContent).not.toContain('More');
      expect(button.textContent).not.toContain('items');
    });
  });

  it('keeps the "Menu" label when every item overflows (it is already valid Portuguese)', async () => {
    const { container } = render(
      <UnderlineNav aria-label="Conteúdos recentes">
        <UnderlineNav.Item href="/a">A</UnderlineNav.Item>
        <UnderlineNav.Item href="/b">B</UnderlineNav.Item>
      </UnderlineNav>,
    );

    const nav = container.querySelector('nav');

    const item = document.createElement('li');
    item.innerHTML =
      '<button aria-expanded="false"><span><span hidden>Conteúdos recentes&nbsp;</span>Menu</span></button>';
    nav.querySelector('ul').appendChild(item);

    await waitFor(() => {
      const button = nav.querySelector('button[aria-expanded]');
      expect(button).toHaveTextContent('Menu');
      expect(button.textContent).not.toContain('More');
      expect(button.textContent).not.toContain('items');
    });
  });

  it('re-strips the " items" suffix when the label text changes in place (e.g. aria-label update)', async () => {
    const { container } = render(
      <UnderlineNav aria-label="Conteúdos de alice">
        <UnderlineNav.Item href="/a">A</UnderlineNav.Item>
        <UnderlineNav.Item href="/b">B</UnderlineNav.Item>
      </UnderlineNav>,
    );

    const nav = container.querySelector('nav');

    const item = document.createElement('li');
    item.innerHTML =
      '<button aria-expanded="false"><span>More<span hidden>&nbsp;Conteúdos de alice items</span></span></button>';
    nav.querySelector('ul').appendChild(item);

    await waitFor(() => {
      const button = nav.querySelector('button[aria-expanded]');
      expect(button.textContent).not.toContain('items');
    });

    const suffix = nav.querySelector('button[aria-expanded] span[hidden]').firstChild;
    suffix.nodeValue = ' Conteúdos de bob items';

    await waitFor(() => {
      const button = nav.querySelector('button[aria-expanded]');
      expect(button).toHaveTextContent('bob');
      expect(button.textContent).not.toContain('items');
    });
  });
});
