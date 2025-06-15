import { getDomain, isExternalLink, isTrustedDomain, truncate } from '@tabnews/helpers';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { Box, Link, SkeletonLoader, Text, Tooltip } from '@/TabNewsUI';
import { LinkExternalIcon } from '@/TabNewsUI/icons';

export default function AdBanner({ ad: newAd, isLoading, ...props }) {
  const [ad, setAd] = useState(newAd);
  const router = useRouter();

  useEffect(() => {
    if (newAd && !ad) {
      setAd(newAd);
    }
  }, [router.asPath, newAd, ad]);

  if (isLoading || (newAd && !ad)) {
    return <AdBannerLoading />;
  }

  if (!ad) {
    return null;
  }

  const link = ad.source_url || `/${ad.owner_username}/${ad.slug}`;
  const isAdToExternalLink = isExternalLink(link);
  const domain = isAdToExternalLink ? `(${getDomain(link)})` : '';
  const title = truncate(ad.title, 70);

  return (
    <Box {...props} as="aside" sx={{ display: 'grid', ...props.sx }}>
      <Box>
        <Link
          sx={{
            overflow: 'auto',
            fontWeight: 'semibold',
            wordWrap: 'break-word',
            ':link': {
              color: 'success.fg',
            },
            ':visited': {
              color: 'success.fg',
            },
          }}
          href={link}
          rel={isTrustedDomain(link) ? undefined : 'nofollow'}>
          <Text sx={{ wordBreak: 'break-word', marginRight: 1 }}>
            {title} {domain}
          </Text>
          {isAdToExternalLink && <LinkExternalIcon verticalAlign="middle" />}
        </Link>
      </Box>

      <Text sx={{ whiteSpace: 'nowrap', overflow: 'hidden', fontSize: 0, color: 'neutral.emphasis' }}>
        Contribuindo com{' '}
        <Tooltip text={`Autor: ${ad.owner_username}`} direction="nw" sx={{ position: 'absolute', display: 'grid' }}>
          <Link
            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', color: 'neutral.emphasis', mr: 2 }}
            href={`/${ad.owner_username}`}>
            {ad.owner_username}
          </Link>
        </Tooltip>
      </Text>
    </Box>
  );
}

function AdBannerLoading() {
  const spaceBetweenRows = 8;
  const titleHeight = 16;
  const titleY = 2;

  return (
    <SkeletonLoader
      title="Carregando publicação patrocinada..."
      style={{ height: '2.3rem', width: '100%' }}
      uniqueKey="ad-loading">
      <rect x="28" y={titleY} rx="5" ry="5" width="600" height={titleHeight} />
      <rect x="28" y={titleY + spaceBetweenRows + titleHeight} rx="5" ry="5" width="180" height="12" />
    </SkeletonLoader>
  );
}
