import { getLogger } from '@tabnews/infra';

export default getLogger({
  nestedKey: 'payload',
  redact: {
    paths: [
      'password',
      'email',
      'totp_token',
      'totp_url',
      'context.user.password',
      'context.user.email',
      'context.user.description',
      'context.user.totp_secret',
      'context.session.token',
    ],
    remove: true,
  },
});
