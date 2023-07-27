import { Box, Button, Heading, Text } from '@/TabNewsUI';
import { PlusIcon } from '@/TabNewsUI/icons';

export default function EmptyState(props) {
  const { title, description, action, icon: Icon, isLoading } = props;
  if (isLoading) return null;
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
