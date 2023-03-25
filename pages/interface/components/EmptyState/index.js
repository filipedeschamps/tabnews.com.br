import { Box, Button, Heading, Text } from '@/TabNewsUI';
import { PlusIcon } from '@primer/octicons-react';

export default function EmptyState(props) {
  const { title, description, action, icon: Icon, isLoading } = props;

  return (
    <Box
      margin="auto"
      display="flex"
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      p={4}
      style={{ visibility: isLoading ? 'hidden' : 'visible' }}>
      {Icon && <Icon size={40} style={{ marginBottom: '1rem' }} />}
      <Heading sx={{ fontSize: 3 }}>{title}</Heading>
      {description && <Text>{description}</Text>}
      {action && (
        <Button style={{ marginTop: '1rem' }} leadingIcon={PlusIcon} onClick={action.onClick}>
          {action.text}
        </Button>
      )}
    </Box>
  );
}
