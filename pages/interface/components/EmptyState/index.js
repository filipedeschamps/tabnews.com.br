import { Text, Heading, Box, Button } from '@primer/react';
import { PlusIcon } from '@primer/octicons-react';

export default function EmptyState(props) {
  const { title, description, action, icon: Icon } = props;

  return (
    <Box margin="auto" display="flex" justifyContent="center" alignItems="center" flexDirection="column" p={4}>
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
