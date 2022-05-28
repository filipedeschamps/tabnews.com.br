import { formatDistanceToNowStrict } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function PublishedSince({ date }) {
  return <span suppressHydrationWarning={true}>{formatPublishedSince(date)}</span>;

  function formatPublishedSince(date) {
    const publishedSince = formatDistanceToNowStrict(new Date(date), {
      addSuffix: false,
      includeSeconds: true,
      locale: pt,
    });

    return `${publishedSince} atrás`;
  }
}
