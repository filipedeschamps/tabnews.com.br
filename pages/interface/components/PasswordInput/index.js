import { useState } from 'react';
import { FormControl, IconButton, TextInput, Tooltip } from '@primer/react';
import { EyeClosedIcon, EyeIcon } from '@primer/octicons-react';

export function PasswordInput(props) {
  const { inputRef, id, name, label, errorObject, setErrorObject } = props;

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [capsLockWarningMessage, setCapsLockWarningMessage] = useState(false);

  function handlePasswordVisible(event) {
    event.preventDefault();
    setIsPasswordVisible(!isPasswordVisible);
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
        trailingAction={
          <Tooltip
            sx={{ color: 'fg.subtle', marginRight: '10px' }}
            aria-label={isPasswordVisible ? 'Ocultar a senha' : 'Visualizar a senha'}
            direction="nw"
            noDelay={true}>
            <IconButton
              onClick={handlePasswordVisible}
              icon={isPasswordVisible ? EyeClosedIcon : EyeIcon}
              sx={{ padding: '0', border: 'none', color: 'fg.subtle' }}
            />
          </Tooltip>
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