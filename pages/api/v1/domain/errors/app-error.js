export default function AppError({ message, action, type, errors }) {
  return {
    message,
    action,
    type,
    errors
  }
}
