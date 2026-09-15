import { format, formatDistanceStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTimes } from 'next-swr';
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

// `clockOffset` is how far the device clock is ahead of the server clock. Measuring from the
// server's "now" keeps a wrong device clock from skewing the distance or showing a future date.
function formatDistanceFromServerNow(date, clockOffset) {
  return formatDistanceStrict(new Date(date), Date.now() - clockOffset, {
    locale: ptBR,
  });
}

export default function PastTime({ date, formatText, ...props }) {
  const [tooltipLabel, setTooltipLabel] = useState(formatTooltipLabel(date, true));
  const { offset, firstLoad } = useTimes();
  const clockOffset = firstLoad ? 0 : offset;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTooltipLabel(formatTooltipLabel(date));
  }, [date]);

  function getText(date) {
    try {
      const formattedDate = formatDistanceFromServerNow(date, clockOffset);

      return formatText ? formatText(formattedDate) : `${formattedDate} atrás`;
    } catch (e) {
      return '';
    }
  }

  return (
    <Tooltip text={tooltipLabel} suppressHydrationWarning {...props}>
      <time dateTime={date} style={{ whiteSpace: 'nowrap' }} suppressHydrationWarning>
        {getText(date)}
      </time>
    </Tooltip>
  );
}
