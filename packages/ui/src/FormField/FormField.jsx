'use client';
import { AlertFillIcon, EyeClosedIcon, EyeIcon } from '@primer/octicons-react';
import { Button, Checkbox, FormControl, Select, TextInput } from '@primer/react';
import { Tooltip } from '@primer/react/next';
import { clsx } from 'clsx';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

import classes from './FormField.module.css';

const defaultProps = {
  block: true,
  size: 'large',
};

const textInputProps = {
  ...defaultProps,
  autoCorrect: 'off',
  autoCapitalize: 'off',
  spellCheck: false,
  className: classes.Input,
};

export const FormField = forwardRef(
  (
    {
      caption,
      checked,
      className,
      error,
      hidden,
      inputMode,
      isValid,
      label,
      name,
      options,
      required,
      suggestion,
      type,
      ...props
    },
    externalRef,
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [capsLockWarningMessage, setCapsLockWarningMessage] = useState(null);
    const ref = useRef();

    useImperativeHandle(externalRef, () => ref.current);

    if (hidden) return null;

    const inputProps = {
      validationStatus: error ? 'error' : isValid ? 'success' : null,
      inputMode,
      ref,
      ...props,
    };

    if (type === 'password') {
      function focusAfterEnd() {
        setTimeout(() => {
          const input = ref.current;
          const len = input.value.length;
          input.focus();
          input.setSelectionRange(len, len);
        });
      }

      function detectCapsLock(event) {
        if (inputMode !== 'numeric' && event.getModifierState('CapsLock')) {
          setCapsLockWarningMessage('Caps Lock está ativado.');
        } else {
          setCapsLockWarningMessage(null);
        }
      }

      function handlePasswordVisible(event) {
        event.preventDefault();
        setIsPasswordVisible(!isPasswordVisible);
        focusAfterEnd();
        detectCapsLock(event);
      }

      inputProps.type = isPasswordVisible ? 'text' : 'password';

      inputProps.trailingVisual = inputProps.trailingVisual || (
        <TextInput.Action
          aria-label={isPasswordVisible ? `Ocultar ${label}` : `Visualizar ${label}`}
          tooltipDirection="nw"
          onClick={handlePasswordVisible}
          icon={isPasswordVisible ? EyeClosedIcon : EyeIcon}
        />
      );

      inputProps.onKeyUp = (e) => {
        detectCapsLock(e);
        if (props.onKeyUp) props.onKeyUp(e);
      };

      inputProps.onKeyDown = (e) => {
        detectCapsLock(e);
        if (props.onKeyDown) props.onKeyDown(e);
      };

      inputProps.onBlur = (e) => {
        setCapsLockWarningMessage(null);
        if (props.onBlur) props.onBlur(e);
      };

      inputProps.className = clsx(classes.Input, classes.InputPassword);
    }

    const isCheckbox = typeof checked === 'boolean';

    return (
      <FormControl id={name} required={required} className={clsx(classes.Control, className)}>
        <FormControl.Label>{label}</FormControl.Label>
        {caption && <FormControl.Caption>{caption}</FormControl.Caption>}
        {error && !suggestion?.value && !options && !isCheckbox && (
          <FormControl.Validation variant="error">{error}</FormControl.Validation>
        )}
        <Suggestion suggestion={suggestion} />
        <WarningMessage message={capsLockWarningMessage} />

        {!options && !isCheckbox && <TextInput type={type} {...textInputProps} {...inputProps} />}

        {options && (
          <Select {...defaultProps} className={classes.Select} {...inputProps}>
            {options.map((option) => (
              <Select.Option key={option.value} {...option}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        )}

        {isCheckbox && <Checkbox checked={checked} {...inputProps} />}

        <style jsx="true" global="true">{`
          ::-ms-reveal {
            display: none;
          }
        `}</style>
      </FormControl>
    );
  },
);

FormField.displayName = 'FormField';

export function Suggestion({ suggestion }) {
  if (!suggestion?.value) return null;

  return (
    <span className={classes.Suggestion}>
      <AlertFillIcon size={12} />
      <span>{suggestion.label ?? 'Você quis dizer'}</span>

      <TooltippedButton
        tooltip={suggestion.tooltip || 'Aceitar sugestão'}
        onClick={suggestion.onClick}
        colorClass={classes.TooltippedButtonSuccess}>
        <span>{suggestion.pre}</span>
        <span className={classes.SuggestionUnderline}>{suggestion.mid}</span>
        <span>{suggestion.post}</span>
      </TooltippedButton>

      <span>{suggestion.labelEnd ?? '?'}</span>

      {suggestion.ignoreClick && (
        <TooltippedButton
          tooltip={suggestion.ignoreTooltip || 'Ignorar sugestão'}
          onClick={suggestion.ignoreClick}
          colorClass={classes.TooltippedButtonAccent}
          className={classes.TooltippedButtonGrow}>
          {suggestion.ignoreLabel || 'Ignorar'}
        </TooltippedButton>
      )}
    </span>
  );
}

function TooltippedButton({ children, className, colorClass, direction = 'nw', tooltip, ...props }) {
  return (
    <Tooltip text={tooltip} direction={direction}>
      <Button
        variant="invisible"
        size="small"
        labelWrap={true}
        className={clsx(classes.TooltippedButton, colorClass, className)}
        {...props}>
        {children}
      </Button>
    </Tooltip>
  );
}

function WarningMessage({ message }) {
  if (!message) return null;

  return (
    <span className={classes.Warning}>
      <AlertFillIcon size={12} /> {message}
    </span>
  );
}
