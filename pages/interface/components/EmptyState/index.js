import { Box, Button, Heading, Text } from '@/TabNewsUI';
import { PlusIcon } from '@/TabNewsUI/icons';

export default function EmptyState(props) {
  const { title, description, action, icon: Icon, isLoading } = props;
  if (isLoading) return null;
  return (
    <Box
      sx={{
        margin: 'auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        p: 4,
      }}>
      {Icon && <Icon size={40} sx={{ marginBottom: '1rem' }} />}
      <Heading sx={{ fontSize: 3 }}>{title}</Heading>
      {description && <Text>{description}</Text>}
      {action && (
        <Button sx={{ marginTop: '1rem' }} leadingVisual={PlusIcon} onClick={action.onClick}>
          {action.text}
        </Button>
      )}
    </Box>
  );
}
