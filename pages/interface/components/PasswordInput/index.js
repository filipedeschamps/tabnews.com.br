import { useState } from 'react';

import { FormControl, TextInput } from '@/TabNewsUI';
import { AlertFillIcon, EyeClosedIcon, EyeIcon } from '@/TabNewsUI/icons';

export default function PasswordInput({ inputRef, id, name, label, errorObject, setErrorObject, ...props }) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [capsLockWarningMessage, setCapsLockWarningMessage] = useState(false);

  function focusAfterEnd(ref) {
    setTimeout(() => {
      const len = ref.current.value.length;
      ref.current.focus();
      ref.current.setSelectionRange(len, len);
    }, 5);
  }

  function handlePasswordVisible(event) {
    event.preventDefault();
    setIsPasswordVisible(!isPasswordVisible);
    focusAfterEnd(inputRef);
    detectCapsLock(event);
  }

  function detectCapsLock(event) {
    if (event.getModifierState('CapsLock')) {
      setCapsLockWarningMessage('Atenção: Caps Lock está ativado.');
    } else {
      setCapsLockWarningMessage(false);
    }
  }

  function clearErrors() {
    setErrorObject(undefined);
  }

  return (
    <FormControl id={id}>
      <FormControl.Label>{label}</FormControl.Label>
      <TextInput
        trailingVisual={
          <TextInput.Action
            aria-label={isPasswordVisible ? 'Ocultar a senha' : 'Visualizar a senha'}
            tooltipDirection="nw"
            onClick={handlePasswordVisible}
            icon={isPasswordVisible ? EyeClosedIcon : EyeIcon}
          />
        }
        contrast
        sx={{ pl: 2, '&:focus-within': { backgroundColor: 'canvas.default' } }}
        ref={inputRef}
        onChange={clearErrors}
        onKeyDown={detectCapsLock}
        onKeyUp={detectCapsLock}
        name={name}
        type={isPasswordVisible ? 'text' : 'password'}
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        size="large"
        block={true}
        aria-label={label}
        {...props}
      />
      {capsLockWarningMessage && (
        <FormControl.Caption sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <AlertFillIcon size={12} />
          {capsLockWarningMessage}
        </FormControl.Caption>
      )}
      {['empty', 'password', 'password_confirm'].includes(errorObject?.key) && (
        <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
      )}
      <style global jsx>{`
        ::-ms-reveal {
          display: none;
        }
      `}</style>
    </FormControl>
  );
}
