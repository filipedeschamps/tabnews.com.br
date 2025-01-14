import { Text } from '@tabnews/ui';

export default function CharacterCount({ maxLength, value }) {
  return (
    <Text
      sx={{
        ml: 'auto',
        fontSize: 0,
        pl: 1,
        color: value.length > maxLength ? 'danger.fg' : undefined,
        fontWeight: value.length > maxLength ? 'bold' : undefined,
      }}>
      {value.length}/{maxLength}
    </Text>
  );
}
