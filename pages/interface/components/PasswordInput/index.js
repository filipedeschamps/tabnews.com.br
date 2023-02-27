import { useState } from 'react';
import { FormControl, TextInput } from '@primer/react';
import { EyeClosedIcon, EyeIcon } from '@primer/octicons-react';

export function PasswordInput(props) {
  const { inputRef, id, name, label, errorObject, setErrorObject } = props;

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [capsLockWarningMessage, setCapsLockWarningMessage] = useState(false);

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
        trailingAction={
          <TextInput.Action
            onClick={() => {
              setIsPasswordVisible(!isPasswordVisible);
            }}
            icon={isPasswordVisible ? EyeClosedIcon : EyeIcon}
            aria-label={isPasswordVisible ? 'Ocultar a senha' : 'Visualizar a senha'}
            sx={{ color: 'fg.subtle', padding: '0', marginRight: '5px' }}
          />
        }
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
      />
      {capsLockWarningMessage && (
        <FormControl.Validation variant="warning">{capsLockWarningMessage}</FormControl.Validation>
      )}
      {errorObject?.key === 'empty' && (
        <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
      )}
      {errorObject?.key === 'password' && (
        <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
      )}
      {errorObject?.key === 'password_confirm' && (
        <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
      )}
    </FormControl>
  );
}
