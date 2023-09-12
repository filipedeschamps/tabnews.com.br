import { format, formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';

import { Tooltip } from '@/TabNewsUI';

function formatPublishedSince(date) {
  try {
    const publishedSince = formatDistanceToNowStrict(new Date(date), {
      locale: ptBR,
    });

    return `${publishedSince} atrás`;
  } catch (e) {
    return '';
  }
}

function formatTooltipLabel(date, gmt = false) {
  const displayFormat = gmt ? "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm z" : "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm";

  try {
    return format(new Date(date), displayFormat, { locale: ptBR });
  } catch (e) {
    return '';
  }
}

export default function PublishedSince({ date, ...props }) {
  const [tooltipLabel, setTooltipLabel] = useState(formatTooltipLabel(date, true));

  useEffect(() => {
    setTooltipLabel(formatTooltipLabel(date));
  }, [date]);

  return (
    <Tooltip sx={{ position: 'absolute' }} aria-label={tooltipLabel} suppressHydrationWarning {...props}>
      <span style={{ whiteSpace: 'nowrap' }} suppressHydrationWarning>
        {formatPublishedSince(date)}
      </span>
    </Tooltip>
  );
}
