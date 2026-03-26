const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, '..', 'dist');
const origin = 'https://nhtestates.co.uk';

const blogPosts = [
  {
    slug: 'top-10-best-luxury-hotels-in-the-uk',
    title: 'Top 10 Best Luxury Hotels in the UK',
    author: 'NH&T Estates',
    date: '2026-03-06',
    image: '/homepage2.webp',
    description:
      'From The Ritz and The Savoy to Gleneagles and The Connaught, explore ten best luxury UK hotels known for heritage, elegance, and exceptional service.',
  },
  {
    slug: 'best-places-to-visit-in-cardiff',
    title: 'Visit Cardiff: Best Places to Visit in Cardiff',
    author: 'NH&T Estates',
    date: '2026-03-05',
    image: '/cardiff.webp',
    description:
      "A local-friendly guide to Cardiff's castles, markets, parks, waterfronts, and culture.",
  },
  {
    slug: 'uk-travel-itch-best-trips',
    title: 'The UK Travel Itch: Why the Best Trips Often Feel Like Coming Home',
    author: 'Fatima Lotia',
    date: '2026-02-10',
    image: '/homepage3.webp',
    description: 'A reflective take on UK staycations and slow travel in the UK.',
  },
];

const routes = ['/', '/spa', '/cinema', '/parking', '/blog', ...blogPosts.map(p => `/blog/${p.slug}`)];

function readIndexHtml() {
  const indexPath = path.join(DIST, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('Built index.html not found. Run `npm run build` first.');
    process.exit(1);
  }
  return fs.readFileSync(indexPath, 'utf8');
}

function writeRouteHtml(route, content) {
  if (route === '/') {
    fs.writeFileSync(path.join(DIST, 'index.html'), content, 'utf8');
    return;
  }
  const outDir = path.join(DIST, route.replace(/^\//, ''));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), content, 'utf8');
}

function makeLandingSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'NH&T Estates - Luxury Airbnbs & Property Management',
    description:
      'Experience unparalleled luxury with NH&T Estates. Premium coastal properties with world-class spa and cinema amenities.',
    url: `${origin}/`,
    publisher: {
      '@type': 'Organization',
      name: 'NH&T Estates',
      logo: { '@type': 'ImageObject', url: `${origin}/logo.png` },
    },
    mainEntity: { '@type': 'Organization', name: 'NH&T Estates', url: `${origin}/` },
  };
}

function makeSpaSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Spa & Wellness | NH&T Estates',
    description:
      'Indulge in bespoke spa experiences with private suites, expert therapists, and curated wellness rituals.',
    url: `${origin}/spa`,
    provider: { '@type': 'Organization', name: 'NH&T Estates', url: origin, logo: { '@type': 'ImageObject', url: `${origin}/logo.png` } },
    mainEntity: { '@type': 'Service', name: 'Spa & Wellness', serviceType: 'Private Spa Booking', areaServed: 'Cardiff, UK' },
  };
}

function makeCinemaSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Private Cinema | NH&T Estates',
    description: 'Enjoy private cinema bookings with premium seating, immersive sound, and concierge-ready amenities.',
    url: `${origin}/cinema`,
    provider: { '@type': 'Organization', name: 'NH&T Estates', url: origin, logo: { '@type': 'ImageObject', url: `${origin}/logo.png` } },
    mainEntity: { '@type': 'Service', name: 'Private Cinema', serviceType: 'Private Cinema Booking', areaServed: 'Cardiff, UK' },
  };
}

function makeParkingSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Parking & Transport | NH&T Estates',
    description: 'Seamless arrivals with valet, secure parking, and transport coordination for every stay.',
    url: `${origin}/parking`,
    provider: { '@type': 'Organization', name: 'NH&T Estates', url: origin, logo: { '@type': 'ImageObject', url: `${origin}/logo.png` } },
    mainEntity: { '@type': 'Service', name: 'Parking Permit', serviceType: 'Parking Permit Service', areaServed: 'Cardiff, UK' },
  };
}

function makeBlogSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'NH&T Estates Journal',
    description: 'Stories and insights on luxury coastal living, wellness, and curated experiences.',
    url: `${origin}/blog`,
    publisher: { '@type': 'Organization', name: 'NH&T Estates', url: origin, logo: { '@type': 'ImageObject', url: `${origin}/logo.png` } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${origin}/blog` },
  };
}

function makeBlogPostingSchema(post) {
  const imageFull = post.image && post.image.startsWith('/') ? `${origin}${post.image}` : post.image;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${origin}/blog/${post.slug}` },
    headline: post.title,
    description: post.description,
    image: imageFull,
    author: { '@type': 'Person', name: post.author },
    publisher: { '@type': 'Organization', name: 'NH&T Estates', logo: { '@type': 'ImageObject', url: `${origin}/logo.png` } },
    datePublished: post.date,
  };
}

function inject(content, canonicalHref, schemaObj) {
  // replace canonical link if exists, otherwise insert before </head>
  const canonicalTag = `<link rel="canonical" href="${canonicalHref}" />`;
  if (/\<link rel=\"canonical\"/i.test(content)) {
    content = content.replace(/<link rel=\"canonical\" href=\"[^\"]*\" \/>/i, canonicalTag);
  } else {
    content = content.replace(/<\/head>/i, `  ${canonicalTag}\n</head>`);
  }

  const ld = `<script type="application/ld+json">${JSON.stringify(schemaObj)}</script>`;
  if (/\<script type=\"application\/ld\+json\">[\s\S]*?<\/script>/i.test(content)) {
    content = content.replace(/<script type=\"application\/ld\+json\">[\s\S]*?<\/script>/i, ld);
  } else {
    content = content.replace(/<\/head>/i, `  ${ld}\n</head>`);
  }

  return content;
}

function run() {
  const baseHtml = readIndexHtml();

  routes.forEach((route) => {
    let out = baseHtml;
    let canonical = `${origin}${route === '/' ? '/' : route}`;
    let schema = makeLandingSchema();

    if (route === '/') {
      schema = makeLandingSchema();
    } else if (route === '/spa') {
      schema = makeSpaSchema();
    } else if (route === '/cinema') {
      schema = makeCinemaSchema();
    } else if (route === '/parking') {
      schema = makeParkingSchema();
    } else if (route === '/blog') {
      schema = makeBlogSchema();
    } else if (route.startsWith('/blog/')) {
      const slug = route.replace('/blog/', '');
      const post = blogPosts.find((p) => p.slug === slug);
      if (post) {
        schema = makeBlogPostingSchema(post);
      }
    }

    out = inject(out, canonical, schema);
    writeRouteHtml(route, out);
    console.log('Prerendered', route);
  });
}

run();
