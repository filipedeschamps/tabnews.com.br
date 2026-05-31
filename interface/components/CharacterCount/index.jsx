import { Text } from '@tabnews/ui';
import clsx from 'clsx';

import classes from './index.module.css';

export default function CharacterCount({ maxLength, value }) {
  const exceeded = value.length > maxLength;

  return (
    <Text className={clsx(classes.Text, exceeded && classes.Exceeded)}>
      {value.length}/{maxLength}
    </Text>
  );
}
