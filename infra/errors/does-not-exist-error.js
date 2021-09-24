import BaseError from './base-error';

export default class DoesNotExistError extends BaseError {
  constructor({ message, action, type }) {
    super({ code: 404, message, action, type });
  }
}
