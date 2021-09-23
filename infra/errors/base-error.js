export default class BaseError {
  constructor({ code, message, action, type, errors }) {
    this.code = code;
    this.message = message;
    this.action = action;
    this.type = type;
    this.errors = errors;
  }

  traceId(traceId) {
    this.traceId = traceId;
  }
}
