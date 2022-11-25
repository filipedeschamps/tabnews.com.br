import { useState } from 'react';
import { TextInput } from '@primer/react';
import { EyeIcon, EyeClosedIcon } from '@primer/octicons-react';

export default function PasswordInput(props) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  function handleChangePasswordVisibility() {
    setIsPasswordVisible((prevState) => !prevState);
  }

  return (
    <TextInput
      {...props}
      type={isPasswordVisible ? 'text' : 'password'}
      name="password"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      size="small"
      block={true}
      trailingAction={
        <TextInput.Action
          onClick={handleChangePasswordVisibility}
          icon={isPasswordVisible ? EyeIcon : EyeClosedIcon}
          aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
          sx={{ color: 'fg.subtle' }}
        />
      }
    />
  );
}
