import { Text } from '@/TabNewsUI';

function getReadTime(text, wpm = 260) {
  const wordsQuantity = text.split(' ').length;
  return Math.ceil(wordsQuantity / wpm);
}

export default function ReadTime({ text, ...props }) {
  return (
    <Text sx={{ fontSize: 0, color: 'fg.muted', py: '1px', height: '22px' }} {...props}>
      {`${getReadTime(text)} ${getReadTime(text) === 1 ? 'minuto' : 'minutos'} de leitura`}
    </Text>
  );
}
