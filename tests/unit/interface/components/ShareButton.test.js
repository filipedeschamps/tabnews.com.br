import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import ShareButton from 'pages/interface/components/ShareButton.js';

beforeAll(() => {
  global.navigator.clipboard = {
    writeText: vi.fn(() => Promise.resolve()),
  };
});

afterEach(() => {
  vi.resetAllMocks();
});

describe('ShareButton', () => {
  it('copia o título e a URL para a área de transferência ao clicar', async () => {
    render(<ShareButton title="Título Teste" slug="usuario/teste" />);

    const botao = screen.getByRole('button', { name: /compartilhar/i });
    fireEvent.click(botao);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Título Teste\nhttp://localhost/usuario/teste');
    });
  });

  it('mostra a mensagem "Copiado!" após o clique', async () => {
    render(<ShareButton title="Título" slug="usuario/teste" />);
    const botao = screen.getByRole('button', { name: /compartilhar/i });

    fireEvent.click(botao);

    const mensagem = await screen.findByText(/copiado!/i);
    expect(mensagem).toBeInTheDocument();
  });

  it('remove a mensagem "Copiado!" após 2 segundos', async () => {
    render(<ShareButton title="Título" slug="usuario/teste" />);
    const botao = screen.getByRole('button', { name: /compartilhar/i });

    fireEvent.click(botao);

    // Verifica que a mensagem apareceu
    expect(await screen.findByText(/copiado!/i)).toBeInTheDocument();

    // Espera 2.5 segundos reais (sem usar fakeTimers)
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Verifica que sumiu
    expect(screen.queryByText(/copiado!/i)).not.toBeInTheDocument();
  });
});
