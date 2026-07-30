import { render } from '@testing-library/react';

import { KatexLoader } from './KatexLoader';

describe('ui', () => {
  describe('KatexLoader', () => {
    it('preloads the stylesheet', () => {
      render(<KatexLoader />);

      const link = document.getElementById('katex-css');

      expect(link).not.toBeNull();
      expect(link.getAttribute('rel')).toBe('preload');
      expect(link.getAttribute('as')).toBe('style');
      expect(link.getAttribute('href')).toContain('katex');
      expect(link.getAttribute('crossorigin')).toBe('anonymous');
      expect(link.getAttribute('integrity')).toContain('sha384-');
    });

    it('promotes the preload to a stylesheet on load, even after the link is moved', () => {
      const { container } = render(<KatexLoader />);

      const link = document.getElementById('katex-css');
      const script = container.querySelector('script') || document.head.querySelector('script');

      document.head.insertBefore(link, document.head.firstChild);

      new Function(script.innerHTML)();
      link.dispatchEvent(new Event('load'));

      expect(link.getAttribute('rel')).toBe('stylesheet');
      expect(link.onload).toBeNull();
    });
  });
});
