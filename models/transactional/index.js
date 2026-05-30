import { render } from 'react-email';

import { ActivationEmailHtml, ActivationEmailText } from './emails/activation';
import { ConfirmationEmailHtml, ConfirmationEmailText } from './emails/confirmation';
import { FirewallEmailHtml, FirewallEmailText } from './emails/firewall';
import { NotificationEmailHtml, NotificationEmailText } from './emails/notification';
import { RecoveryEmailHtml, RecoveryEmailText } from './emails/recovery';

export const ActivationEmail = async (props) => ({
  html: await render(ActivationEmailHtml(props)),
  text: ActivationEmailText(props),
});

export const ConfirmationEmail = async (props) => ({
  html: await render(ConfirmationEmailHtml(props)),
  text: ConfirmationEmailText(props),
});

export const FirewallEmail = async (props) => ({
  html: await render(FirewallEmailHtml(props)),
  text: FirewallEmailText(props),
});

export const NotificationEmail = async (props) => ({
  html: await render(NotificationEmailHtml(props)),
  text: NotificationEmailText(props),
});

export const RecoveryEmail = async (props) => ({
  html: await render(RecoveryEmailHtml(props)),
  text: RecoveryEmailText(props),
});
