import { getLogger } from '@tabnews/infra';

export default getLogger({
  nestedKey: 'payload',
  redact: {
    paths: [
      'password',
      'email',
      'context.user.password',
      'context.user.email',
      'context.user.description',
      'context.session.token',
    ],
    remove: true,
  },
});
