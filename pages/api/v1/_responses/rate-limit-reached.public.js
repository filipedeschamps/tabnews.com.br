import { TooManyRequestsError } from 'errors/index.js';

export default function handler(request, response) {
  const error = new TooManyRequestsError({});
  response.status(error.statusCode).json(error);
}
