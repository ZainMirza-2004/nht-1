import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const DEFAULT_SITE_URL = 'https://nhtestates.co.uk';

interface SeoProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  includeQuery?: boolean;
  noIndex?: boolean;
}

const getOrigin = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return DEFAULT_SITE_URL;
};

export default function Seo({
  title,
  description,
  canonicalPath,
  includeQuery = false,
  noIndex = false,
}: SeoProps) {
  const location = useLocation();
  const origin = getOrigin();
  const pathname = canonicalPath ?? location.pathname;
  const search = includeQuery ? location.search : '';
  const canonicalUrl = new URL(`${pathname}${search}`, origin).toString();

  return (
    <Helmet>
      <title>{title}</title>
      {description ? <meta name="description" content={description} /> : null}
      <link rel="canonical" href={canonicalUrl} />
      {noIndex ? <meta name="robots" content="noindex, nofollow" /> : null}
    </Helmet>
  );
}
