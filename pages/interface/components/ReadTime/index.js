import { Text } from '@/TabNewsUI';
import { useMemo } from 'react';

export default function ReadTime({ text, ...props }) {
  const readTimeInMinutes = useMemo(() => {
    const wpm = 260;
    const wordsQuantity = text.split(' ').length;
    return Math.ceil(wordsQuantity / wpm);
  }, [text]);

  return (
    <Text sx={{ fontSize: 0, color: 'fg.muted', py: '1px', height: '22px' }} {...props}>
      {`${readTimeInMinutes} ${readTimeInMinutes === 1 ? 'minuto' : 'minutos'} de leitura`}
    </Text>
  );
}
