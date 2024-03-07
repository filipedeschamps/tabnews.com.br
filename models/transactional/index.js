import { render } from '@react-email/render';

import { ActivationEmailHtml, ActivationEmailText } from './emails/activation';
import { ConfirmationEmailHtml, ConfirmationEmailText } from './emails/confirmation';
import { NotificationEmailHtml, NotificationEmailText } from './emails/notification';
import { RecoveryEmailHtml, RecoveryEmailText } from './emails/recovery';

export const ActivationEmail = (props) => ({
  html: render(ActivationEmailHtml(props)),
  text: ActivationEmailText(props),
});

export const ConfirmationEmail = (props) => ({
  html: render(ConfirmationEmailHtml(props)),
  text: ConfirmationEmailText(props),
});

export const NotificationEmail = (props) => ({
  html: render(NotificationEmailHtml(props)),
  text: NotificationEmailText(props),
});

export const RecoveryEmail = (props) => ({
  html: render(RecoveryEmailHtml(props)),
  text: RecoveryEmailText(props),
});
