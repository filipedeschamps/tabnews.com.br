import { formatDistanceToNowStrict, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip } from '@primer/react';

function formatPublishedSince(date) {
  const publishedSince = formatDistanceToNowStrict(new Date(date), {
    locale: ptBR,
  });

  return `${publishedSince} atrás`;
}

function formatTooltipLabel(date) {
  return format(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
}

export default function PublishedSince({ date }) {
  return (
    <Tooltip sx={{ position: 'absolute', ml: 1 }} aria-label={formatTooltipLabel(date)}>
      <span suppressHydrationWarning>{formatPublishedSince(date)}</span>
    </Tooltip>
  );
}
