import { useEffect, useState } from 'react';
import { FormControl, TextInput } from '@primer/react';
import { EyeClosedIcon, EyeIcon } from '@primer/octicons-react';

export default function PasswordInput({ inputRef, id, name, label, errorObject, setErrorObject, ...props }) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [capsLockWarningMessage, setCapsLockWarningMessage] = useState(false);

  useEffect(() => {
    // change tooltip direction of TextInput.Action
    const tooltip = inputRef.current.parentElement.getElementsByClassName('tooltipped-n')[0];
    tooltip?.classList.add('tooltipped-nw');
    tooltip?.classList.remove('tooltipped-n');
  }, [inputRef]);

  function focusAfterEnd(ref) {
    setTimeout(() => {
      let len = ref.current.value.length;
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
        trailingAction={
          <TextInput.Action
            aria-label={isPasswordVisible ? 'Ocultar a senha' : 'Visualizar a senha'}
            onClick={handlePasswordVisible}
            icon={isPasswordVisible ? EyeClosedIcon : EyeIcon}
            sx={{ color: 'fg.subtle' }}
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
        {...props}
      />
      {capsLockWarningMessage && (
        <FormControl.Validation variant="warning">{capsLockWarningMessage}</FormControl.Validation>
      )}
      {['empty', 'password', 'password_confirm'].includes(errorObject?.key) && (
        <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
      )}
    </FormControl>
  );
}
