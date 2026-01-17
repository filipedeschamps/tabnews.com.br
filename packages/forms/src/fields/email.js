import { isValidEmail, suggestEmail } from '@tabnews/helpers';

export const email = {
  value: '',
  label: 'Seu Email',
  placeholder: 'Digite seu email',
  type: 'email',
  autoComplete: 'email',
  format,
  prepare: format,
  onValidChange: confirmEmail('email'),
  validateOnBlurAndSubmit: createIgnorableValidator(),
};

export const emailConfirmable = {
  ...email,
  onValidChange: confirmEmail('emailConfirmable', 'emailConfirmation'),
  validateOnBlurAndSubmit: validateEmail,
};

export const emailConfirmation = {
  ...email,
  label: 'Confirme seu Email',
  placeholder: 'Digite novamente seu email',
  onValidChange: confirmEmail('emailConfirmation', 'emailConfirmable'),
  validateOnBlurAndSubmit: validateEmail,
};

export function format(email) {
  return email.trim().toLowerCase();
}

export function validateEmail(email) {
  return !isValidEmail(email)
    ? 'Email inválido.'
    : email.length > 64
      ? 'Email deve ter no máximo 64 caracteres.'
      : null;
}

export function createIgnorableValidator(ignoredSuggestion) {
  return (inputValue) => {
    const error = validateEmail(inputValue);

    if (error) {
      return error;
    }

    const suggestion = suggestEmail(inputValue);

    if (!suggestion || suggestion === ignoredSuggestion) {
      return null;
    }

    return 'Verifique a sugestão.';
  };
}

export function confirmEmail(field, confirmationField) {
  return ({ state, updateFields, value }) => {
    const suggestion = createSuggestionObject(state, value, updateFields, field, confirmationField);
    const updatedFields = {
      [field]: { suggestion },
    };

    if (confirmationField) {
      const validateOnBlurAndSubmit = createConfirmation(value);
      updatedFields[confirmationField] = { validateOnBlurAndSubmit, error: null };
    }

    updateFields(updatedFields);
  };
}

export function createSuggestionObject(state, value, updateFields, field, confirmationField) {
  if (field === 'emailConfirmation') return null;

  const suggestion = suggestEmail(value);
  if (!suggestion) return null;

  if (suggestion === state[field].suggestion?.ignored) {
    return {
      ignored: suggestion,
      value: null,
    };
  }

  const [username, domain] = suggestion.split('@');

  const updatedFieldsOnClick = {
    [field]: {
      value: suggestion,
      suggestion: null,
      error: null,
    },
  };

  if (confirmationField) {
    updatedFieldsOnClick[confirmationField] = {
      error: null,
      validateOnBlurAndSubmit: createConfirmation(suggestion),
    };
  }

  const updatedFieldsOnIgnore = {
    [field]: {
      suggestion: {
        ignored: suggestion,
        value: null,
      },
      error: null,
      validateOnBlurAndSubmit: createIgnorableValidator(suggestion),
    },
  };

  return {
    value: suggestion,
    pre: `${username}@`,
    mid: domain,
    onClick: () => updateFields(updatedFieldsOnClick),
    ignoreClick: () => updateFields(updatedFieldsOnIgnore),
  };
}

export function createConfirmation(expectedValue) {
  if (!expectedValue) return validateEmail;

  return (inputValue) => {
    const validationError = validateEmail(inputValue);
    return validationError || (inputValue === expectedValue ? null : 'Emails não conferem.');
  };
}
