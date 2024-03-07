import { format, formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';

import { Tooltip } from '@/TabNewsUI';

function formatTooltipLabel(date, gmt = false) {
  const displayFormat = gmt ? "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm z" : "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm";

  try {
    return format(new Date(date), displayFormat, { locale: ptBR });
  } catch (e) {
    return '';
  }
}

export default function PastTime({ date, formatText, ...props }) {
  const [tooltipLabel, setTooltipLabel] = useState(formatTooltipLabel(date, true));

  useEffect(() => {
    setTooltipLabel(formatTooltipLabel(date));
  }, [date]);

  function getText(date) {
    try {
      const formattedDate = formatDistanceToNowStrict(new Date(date), {
        locale: ptBR,
      });

      return formatText ? formatText(formattedDate) : `${formattedDate} atrás`;
    } catch (e) {
      return '';
    }
  }

  return (
    <Tooltip aria-label={tooltipLabel} suppressHydrationWarning {...props}>
      <time dateTime={date} style={{ whiteSpace: 'nowrap' }} suppressHydrationWarning>
        {getText(date)}
      </time>
    </Tooltip>
  );
}
