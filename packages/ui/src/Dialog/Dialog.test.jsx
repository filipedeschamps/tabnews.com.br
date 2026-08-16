import { render, screen } from '@testing-library/react';

import { Dialog } from '.';
import { ThemeProvider } from '../ThemeProvider';

describe('ui', () => {
  describe('Dialog', () => {
    it('translates the tooltip of the close button', () => {
      render(
        <ThemeProvider colorMode="dark">
          <Dialog title="Título" onClose={() => {}}>
            Conteúdo
          </Dialog>
        </ThemeProvider>,
      );

      expect(screen.queryByText('Close')).toBeNull();
      expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
    });
  });
});
