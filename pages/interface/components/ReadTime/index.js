import { useMemo } from 'react';

import { Text } from '@/TabNewsUI';

export default function ReadTime({ text, ...props }) {
  const readTimeInMinutes = useMemo(() => {
    const wpm = 260;
    const wordsQuantity = text.split(/[^A-Za-z]+/).length;
    return `${Math.ceil(wordsQuantity / wpm)} min de leitura`;
  }, [text]);

  return (
    <Text sx={{ fontSize: 0, color: 'fg.muted', py: '1px', height: '22px' }} {...props}>
      {readTimeInMinutes}
    </Text>
  );
}
