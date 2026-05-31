import { useMemo } from 'react';

import { Text } from '@/TabNewsUI';

import classes from './index.module.css';

export default function ReadTime({ text, ...props }) {
  const readTimeInMinutes = useMemo(() => {
    const wpm = 260;
    const wordsQuantity = text.split(/[^A-Za-z]+/).length;
    return `${Math.ceil(wordsQuantity / wpm)} min de leitura`;
  }, [text]);

  return (
    <Text className={classes.Text} {...props}>
      {readTimeInMinutes}
    </Text>
  );
}
