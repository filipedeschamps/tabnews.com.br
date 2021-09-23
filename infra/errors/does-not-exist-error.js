import AppError from "./app-error";

export default class DoesNotExistError extends AppError {
  constructor({ message, action, type }) {
    super({ code: 404, message, action, type })
  }
}
