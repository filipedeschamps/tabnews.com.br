import { getDomain, isExternalLink, isTrustedDomain, truncate } from '@tabnews/helpers';
import { clsx } from 'clsx';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { Link, SkeletonLoader, Tooltip } from '@/TabNewsUI';
import { LinkExternalIcon } from '@/TabNewsUI/icons';

import classes from './index.module.css';

export default function AdBanner({ ad: newAd, isLoading, className, ...props }) {
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
    <aside {...props} className={clsx(classes.Wrapper, className)}>
      <div>
        <Link className={classes.Link} href={link} rel={isTrustedDomain(link) ? undefined : 'nofollow'}>
          <span className={classes.Title}>
            {title} {domain}
          </span>
          {isAdToExternalLink && <LinkExternalIcon verticalAlign="middle" />}
        </Link>
      </div>

      <span className={classes.Sponsor}>
        Contribuindo com{' '}
        <Tooltip text={`Autor: ${ad.owner_username}`} direction="nw" position="absolute">
          <Link className={classes.SponsorLink} href={`/${ad.owner_username}`}>
            {ad.owner_username}
          </Link>
        </Tooltip>
      </span>
    </aside>
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
