import { Box, Button, FormControl, TextInput } from '@primer/react';

export function EmailInput(props) {
  const { inputRef, passwordRef, id, name, label, errorObject, setErrorObject } = props;

  function clearErrors() {
    setErrorObject(undefined);
  }

  return (
    <FormControl id={id}>
      <FormControl.Label>{label}</FormControl.Label>
      <TextInput
        ref={inputRef}
        onChange={clearErrors}
        name={name}
        size="large"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        block={true}
        aria-label="Seu email"
      />
      {errorObject?.key === 'email' && (
        <FormControl.Validation variant="error">{errorObject.message}</FormControl.Validation>
      )}
      {errorObject?.key === 'email' && errorObject?.type === 'typo' && (
        <FormControl.Validation variant="error">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box>Você quis dizer:</Box>
            <Box>
              <Button
                variant="invisible"
                size="small"
                sx={{ p: 1 }}
                onClick={(event) => {
                  event.preventDefault();
                  clearErrors();
                  inputRef.current.value = errorObject.suggestion;
                  passwordRef.current.focus();
                }}>
                {errorObject.suggestion.split('@')[0]}@<u>{errorObject.suggestion.split('@')[1]}</u>
              </Button>
            </Box>
          </Box>
        </FormControl.Validation>
      )}
    </FormControl>
  );
}
