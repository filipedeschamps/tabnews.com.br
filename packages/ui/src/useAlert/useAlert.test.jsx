import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { useAlert } from '.';

function AlertButton({ onDismiss = () => {}, ...options }) {
  const alert = useAlert();

  async function handleClick() {
    await alert(options);
    onDismiss();
  }

  return <button onClick={handleClick}>Enviar</button>;
}

async function openDialog(props) {
  const user = userEvent.setup();
  render(<AlertButton title="Algo deu errado" content="Tente novamente." {...props} />);
  await user.click(screen.getByRole('button', { name: 'Enviar' }));
  await screen.findByRole('alertdialog');

  return user;
}

describe('ui', () => {
  describe('useAlert', () => {
    it('shows the title, the content and a single button besides the close one', async () => {
      const user = await openDialog();

      const dialog = screen.getByRole('alertdialog', { name: 'Algo deu errado' });

      expect(screen.getByText('Tente novamente.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'OK' })).toHaveFocus();
      expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
      expect(screen.queryByText('Close')).toBeNull();
      expect(within(dialog).getAllByRole('button')).toHaveLength(2);

      await user.click(screen.getByRole('button', { name: 'OK' }));
    });

    it('keeps the button content provided by the caller', async () => {
      const user = await openDialog({ buttonContent: 'Entendi' });

      expect(screen.getByRole('button', { name: 'Entendi' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'OK' })).toBeNull();

      await user.click(screen.getByRole('button', { name: 'Entendi' }));
    });

    it.each(['OK', 'Fechar'])('resolves and removes the dialog when "%s" is clicked', async (button) => {
      const onDismiss = vi.fn();
      const user = await openDialog({ onDismiss });

      await user.click(screen.getByRole('button', { name: button }));

      await waitFor(() => expect(onDismiss).toHaveBeenCalledOnce());
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });

    it('resolves when dismissed with Escape', async () => {
      const onDismiss = vi.fn();
      const user = await openDialog({ onDismiss });

      await user.keyboard('{Escape}');

      await waitFor(() => expect(onDismiss).toHaveBeenCalledOnce());
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });
  });
});
