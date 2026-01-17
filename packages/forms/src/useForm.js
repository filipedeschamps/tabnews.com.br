'use client';
import { identity, noop, returnNull } from '@tabnews/helpers';
import { useConfig } from '@tabnews/hooks';
import { useCallback } from 'react';

const defaultProcessors = {
  format: identity,
  prepare: identity,
  onValidChange: noop,
  validateOnBlurAndSubmit: returnNull,
  validateOnChange: returnNull,
};

export function useForm(
  initialConfig,
  { onBlur = noop, onChange = noop, onStateChange = noop, submitDisabled = true, submitHidden = false } = {},
) {
  const {
    processors,
    split,
    state,
    updateProcessors,
    updateState: updateFormValues,
  } = useConfig(initialConfig, defaultProcessors);

  const updateState = useCallback(
    (newState) => {
      updateFormValues(newState);
      onStateChange(newState);
    },
    [onStateChange, updateFormValues],
  );

  const updateFields = useCallback(
    (newConfig) => {
      const { processors, state } = split(newConfig);
      updateState(state);
      updateProcessors(processors);
    },
    [split, updateProcessors, updateState],
  );

  const handleSubmit = useCallback(
    (onSubmit) => (e) => {
      e.preventDefault();
      const preparedFields = {};
      const errors = {};
      let hasErrors = false;

      for (const [fieldName, processor] of Object.entries(processors)) {
        const { validateOnBlurAndSubmit, prepare } = processor;
        const fieldState = state[fieldName];

        if (!submitDisabled && fieldState.disabled === true) {
          continue;
        }

        if (!submitHidden && fieldState.hidden === true) {
          continue;
        }

        const preparedValue = fieldState.checked !== undefined ? fieldState.checked : prepare(fieldState.value);
        preparedFields[fieldName] = preparedValue;

        const error = validateOnBlurAndSubmit(preparedValue);
        if (error) {
          errors[fieldName] = { error };
          hasErrors = true;
        }
      }

      if (hasErrors) {
        updateState(errors);
      } else {
        onSubmit(preparedFields);
      }
    },
    [processors, state, submitDisabled, submitHidden, updateState],
  );

  const getFieldProps = useCallback(
    (name) => {
      if (!processors[name]) {
        if (process.env.NODE_ENV !== 'production') {
          throw new Error(`Field "${name}" not found in config.`);
        } else {
          return { hidden: true };
        }
      }

      const fieldState = state[name];
      const { format, prepare, onValidChange, validateOnBlurAndSubmit, validateOnChange } = processors[name];
      let onBlurError = null;

      return {
        name,
        ...fieldState,
        onChange: (e) => {
          const updatedState = { isValid: false };
          const value = format(e.target.value);
          const checked = e.target.checked;

          if (e.target.type === 'checkbox') {
            updatedState.checked = checked;
          } else {
            updatedState.value = value;
            updatedState.error = onBlurError || validateOnChange(value);
          }

          updateState({
            [name]: updatedState,
          });

          if (!updatedState.error) {
            onValidChange({ checked, state, updateFields, updateProcessors, updateState, value });
          }

          onChange(e, {
            name,
            ...updatedState,
            state,
            updateFields,
            updateProcessors,
            updateState,
          });
        },
        onBlur: (e) => {
          const preparedValue = prepare(e.target.value);
          onBlurError = validateOnBlurAndSubmit(preparedValue);
          if (onBlurError) {
            updateState({ [name]: { error: onBlurError } });
          }
          onBlur(e, { error: onBlurError, name, preparedValue, state, updateFields, updateProcessors, updateState });
        },
      };
    },
    [onBlur, onChange, processors, state, updateFields, updateProcessors, updateState],
  );

  return {
    getFieldProps,
    handleSubmit,
    state,
    updateFields,
    updateProcessors,
    updateState,
  };
}
