import {
  ActivationEmail,
  ConfirmationEmail,
  FirewallEmail,
  NotificationEmail,
  RecoveryEmail,
} from 'models/transactional';

describe('Transactional model', () => {
  describe('Email layouts', () => {
    it('Activation', () => {
      const username = 'User Test';
      const activationLink = 'https://tabnews.com.br/cadastro/ativar/TOKEN_ID';

      const { html, text } = ActivationEmail({ username, activationLink });

      expect(html).toMatchSnapshot();
      expect(text).toMatchSnapshot();
    });

    it('Confirmation', () => {
      const username = 'User Test';
      const confirmationLink = 'https://tabnews.com.br/perfil/confirmar-email/TOKEN_ID';

      const { html, text } = ConfirmationEmail({ username, confirmationLink });

      expect(html).toMatchSnapshot();
      expect(text).toMatchSnapshot();
    });

    it('Firewall', () => {
      const { html, text } = FirewallEmail({
        username: 'User',
        sideEffectLine:
          'Identificamos a criação de muitas publicações em um curto período, então a sua publicação "Título da publicação" foi removida.',
        eventId: 'c7854f84-f7b4-468c-9805-a96d7ac4853a',
      });

      expect(html).toMatchSnapshot();
      expect(text).toMatchSnapshot();
    });

    it('Notification', () => {
      const username = 'User Test';
      const bodyReplyLine = '"User2" respondeu à sua publicação "Título publicação".';
      const contentLink = 'https://tabnews.com.br/user2/titulo-publicacao';

      const { html, text } = NotificationEmail({ username, bodyReplyLine, contentLink });

      expect(html).toMatchSnapshot();
      expect(text).toMatchSnapshot();
    });

    it('Recovery', () => {
      const username = 'User Test';
      const recoveryLink = 'https://tabnews.com.br/perfil/confirmar-email/TOKEN_ID';

      const { html, text } = RecoveryEmail({ username, recoveryLink });

      expect(html).toMatchSnapshot();
      expect(text).toMatchSnapshot();
    });
  });
});
