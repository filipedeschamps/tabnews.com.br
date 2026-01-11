'use client';
import { AlertFillIcon, EyeClosedIcon, EyeIcon } from '@primer/octicons-react';
import { Button, Checkbox, FormControl, Select, Text, TextInput } from '@primer/react';
import { Tooltip } from '@primer/react/next';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

const defaultProps = {
  block: true,
  contrast: true,
  size: 'large',
};

const textInputProps = {
  ...defaultProps,
  autoCorrect: 'off',
  autoCapitalize: 'off',
  spellCheck: false,
  sx: {
    px: 2,
    '&:focus-within': {
      backgroundColor: 'canvas.default',
    },
    '> input': {
      px: 1,
    },
  },
};

export const FormField = forwardRef(
  (
    {
      caption,
      checked,
      error,
      hidden,
      inputMode,
      isValid,
      label,
      name,
      options,
      required,
      suggestion,
      sx,
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

      inputProps.sx = { ...textInputProps.sx, pr: 0 };
    }

    const isCheckbox = typeof checked === 'boolean';

    return (
      <FormControl id={name} required={required} sx={{ minHeight: '86px', ...sx }}>
        <FormControl.Label>{label}</FormControl.Label>
        {caption && <FormControl.Caption>{caption}</FormControl.Caption>}
        {error && !suggestion?.value && !options && !isCheckbox && (
          <FormControl.Validation variant="error">{error}</FormControl.Validation>
        )}
        <Suggestion suggestion={suggestion} />
        <WarningMessage message={capsLockWarningMessage} />

        {!options && !isCheckbox && <TextInput type={type} {...textInputProps} {...inputProps} />}

        {options && (
          <Select {...defaultProps} sx={{ py: 0 }} {...inputProps}>
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
    <Text
      sx={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        wordBreak: 'break-word',
        fontSize: '12px',
        lineHeight: '14px',
        fontWeight: 'bold',
        columnGap: 1,
        mt: 0,
        alignItems: 'center',
        color: 'attention.fg',
      }}>
      <AlertFillIcon size={12} />
      <span>{suggestion.label ?? 'Você quis dizer'}</span>

      <TooltippedButton
        tooltip={suggestion.tooltip || 'Aceitar sugestão'}
        onClick={suggestion.onClick}
        color="success.fg">
        <span>{suggestion.pre}</span>
        <Text sx={{ textDecoration: 'underline' }}>{suggestion.mid}</Text>
        <span>{suggestion.post}</span>
      </TooltippedButton>

      <span>{suggestion.labelEnd ?? '?'}</span>

      {suggestion.ignoreClick && (
        <TooltippedButton
          tooltip={suggestion.ignoreTooltip || 'Ignorar sugestão'}
          onClick={suggestion.ignoreClick}
          color="accent.fg"
          sx={{ flex: 1 }}>
          {suggestion.ignoreLabel || 'Ignorar'}
        </TooltippedButton>
      )}
    </Text>
  );
}

function TooltippedButton({ children, color, direction = 'nw', sx, tooltip, ...props }) {
  return (
    <Tooltip text={tooltip} direction={direction}>
      <Button
        variant="invisible"
        size="small"
        labelWrap={true}
        sx={{
          color,
          my: '-4px',
          px: 0,
          textAlign: 'start',
          '> *': { justifyContent: 'end' },
          ':hover': {
            bg: 'transparent',
          },
          ...sx,
        }}
        {...props}>
        {children}
      </Button>
    </Tooltip>
  );
}

function WarningMessage({ message }) {
  if (!message) return null;

  return (
    <Text
      sx={{
        wordBreak: 'break-word',
        fontSize: '12px',
        lineHeight: '14px',
        fontWeight: 'bold',
        color: 'attention.fg',
      }}>
      <AlertFillIcon size={12} /> {message}
    </Text>
  );
}
