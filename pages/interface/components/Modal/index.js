import { Box, Dialog, Button, Text } from '@primer/react';

export default function Modal({ title, isOpen, onClose, description, customButtons }) {
  const modalButtons = [customButtons ?? <Button sx={{ mr: 1 }} onClick={onClose}>Fechar</Button>].flat(Infinity);

  return (
    <Dialog isOpen={isOpen} onDismiss={onClose} aria-labelledby="header-id">
      <Dialog.Header id="header-id" pr={5}>
        {title}
      </Dialog.Header>
      <Box p={3}>
        <Text fontFamily="sans-serif">{description}</Text>
        <Box display="flex" mt={3} justifyContent="flex-end">
          {modalButtons}
        </Box>
      </Box>
    </Dialog>
  );
}
