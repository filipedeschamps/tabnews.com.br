export const password = {
  value: '',
  label: 'Senha',
  placeholder: 'Digite sua senha',
  type: 'password',
  autoComplete: 'current-password',
  validateOnBlurAndSubmit: validatePassword,
};

export const passwordConfirmable = {
  value: '',
  label: 'Senha',
  placeholder: 'Crie uma senha',
  type: 'password',
  autoComplete: 'new-password',
  validateOnBlurAndSubmit: validatePassword,
  onValidChange: confirmPassword('passwordConfirmation'),
};

export const passwordConfirmation = {
  value: '',
  label: 'Confirmação de senha',
  placeholder: 'Confirme sua senha',
  type: 'password',
  autoComplete: 'new-password',
  validateOnBlurAndSubmit: validatePassword,
  onValidChange: confirmPassword('passwordConfirmable'),
};

function validatePassword(password) {
  return password.length < 8 || password.length > 72 ? 'Senha deve ter de 8 a 72 caracteres.' : null;
}

export function confirmPassword(confirmationField) {
  return ({ updateFields, value }) => {
    const validateOnBlurAndSubmit = createConfirmation(value);

    updateFields({
      [confirmationField]: { validateOnBlurAndSubmit, error: null },
    });
  };
}

export function createConfirmation(expectedValue) {
  return (inputValue) => {
    const validationError = validatePassword(inputValue);
    return validationError || (inputValue === expectedValue ? null : 'Senhas não conferem.');
  };
}
