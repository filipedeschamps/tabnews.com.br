import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { useConfirm } from '.';
import { translateDialogCloseTooltip } from '../Dialog/closeTooltip';

vi.mock('../Dialog/closeTooltip', () => ({ translateDialogCloseTooltip: vi.fn() }));

const closeTooltip = await vi.importActual('../Dialog/closeTooltip');

beforeEach(() => {
  translateDialogCloseTooltip.mockImplementation(closeTooltip.translateDialogCloseTooltip);
});

function ConfirmButton({ onResult = () => {}, ...options }) {
  const confirm = useConfirm();

  async function handleClick() {
    onResult(await confirm(options));
  }

  return <button onClick={handleClick}>Apagar</button>;
}

async function openDialog(props) {
  const user = userEvent.setup();
  render(<ConfirmButton title="Tem certeza?" {...props} />);
  await user.click(screen.getByRole('button', { name: 'Apagar' }));
  await screen.findByRole('alertdialog');

  return user;
}

// MutationObserver callbacks run in a microtask, so a macrotask is enough to see them all.
function waitForMutations() {
  return new Promise((resolve) => setTimeout(resolve));
}

describe('ui', () => {
  describe('useConfirm', () => {
    it('translates the buttons and the tooltip of the close button', async () => {
      const user = await openDialog();

      expect(screen.getByRole('button', { name: 'Sim' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
      expect(await screen.findByRole('button', { name: 'Fechar' })).toBeInTheDocument();
      expect(screen.queryByText('Close')).toBeNull();

      await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    });

    it('keeps the button contents provided by the caller', async () => {
      const user = await openDialog({ confirmButtonContent: 'Apagar mesmo', cancelButtonContent: 'Voltar' });

      expect(screen.getByRole('button', { name: 'Apagar mesmo' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Sim' })).toBeNull();

      await user.click(screen.getByRole('button', { name: 'Voltar' }));
    });

    it('resolves with the gesture of the user', async () => {
      const onResult = vi.fn();
      const user = await openDialog({ onResult });

      await user.click(screen.getByRole('button', { name: 'Sim' }));

      expect(onResult).toHaveBeenCalledWith(true);
    });

    // The observer disconnects itself as soon as it translates, so the `finally` only matters when
    // the tooltip never shows up — otherwise it would keep watching the whole document forever.
    it('stops observing the document when the tooltip never renders', async () => {
      translateDialogCloseTooltip.mockReturnValue(false);
      const user = await openDialog();

      await user.click(screen.getByRole('button', { name: 'Cancelar' }));
      translateDialogCloseTooltip.mockClear();
      document.body.append(document.createElement('div'));
      await waitForMutations();

      expect(translateDialogCloseTooltip).not.toHaveBeenCalled();
    });
  });
});
