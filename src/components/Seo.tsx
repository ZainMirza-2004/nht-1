import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const DEFAULT_SITE_URL = 'https://nhtestates.co.uk';
const DEFAULT_KEYWORDS = [
  'NH&T Estates',
  'luxury stays',
  'serviced apartments',
  'Cardiff',
  'London',
  'property management',
];

interface SeoProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  includeQuery?: boolean;
  noIndex?: boolean;
  keywords?: string | string[];
  schema?: Record<string, any>;
}

const getOrigin = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return DEFAULT_SITE_URL;
};

const normalizeKeywords = (keywords?: string | string[]) => {
  const base = DEFAULT_KEYWORDS;
  if (!keywords) {
    return base;
  }

  const extra = Array.isArray(keywords)
    ? keywords
    : keywords
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean);

  const seen = new Set<string>();
  const merged = [...base, ...extra].filter((keyword) => {
    const key = keyword.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  return merged;
};

export default function Seo({
  title,
  description,
  canonicalPath,
  includeQuery = false,
  noIndex = false,
  keywords,
  schema,
}: SeoProps) {
  const location = useLocation();
  const origin = getOrigin();
  const pathname = canonicalPath ?? location.pathname;
  const search = includeQuery ? location.search : '';
  const canonicalUrl = new URL(`${pathname}${search}`, origin).toString();
  const keywordList = normalizeKeywords(keywords);
  const keywordContent = keywordList.join(', ');

  return (
    <Helmet>
      <title>{title}</title>
      {description ? <meta name="description" content={description} /> : null}
      <meta name="keywords" content={keywordContent} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex ? <meta name="robots" content="noindex, nofollow" /> : null}
      {schema ? (
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      ) : null}
    </Helmet>
  );
}
