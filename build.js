// build.js — renders the bilingual static site.
//   node build.js
// Reads templates/ + src/translations.js + src/overrides.json
// Writes German pages to dist root and English pages to dist/en/,
// plus sitemap.xml. Copy of static folders (css/js/vendor/assets)
// is done here too, so dist/ is the complete deployable site.
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const translations = require('./_src/translations.js');
const overrides = require('./_src/overrides.json');

const BASE = 'https://www.click-capybara.com';
const DIST = __dirname; // build in place — GitHub Pages serves the repo root
const OG_IMAGE = BASE + '/assets/og-image.png';

// ─── Page config ────────────────────────────────────────────────────────────
const PAGES = [
  {
    tpl: 'index.html', slug: '', formSource: 'Homepage',
    seo: {
      de: {
        title: 'Max | Digital Marketing Freelancer Düsseldorf — Click-Capybara',
        desc: 'Freiberuflicher Digital-Marketing-Spezialist mit 8+ Jahren Erfahrung: Google Ads, Websites und lokale Sichtbarkeit. Direkter Draht statt Agentur-Overhead.',
      },
      en: {
        title: 'Max | Digital Marketing Specialist — Click-Capybara',
        desc: 'Freelance digital marketing specialist with 8+ years experience: Google Ads, websites, and local visibility. Direct access, no agency overhead.',
      },
    },
    jsonld: (lang) => ({
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: 'Click-Capybara',
      url: BASE + '/',
      email: 'hello@click-capybara.com',
      founder: { '@type': 'Person', name: 'Max', jobTitle: 'Digital Marketing Specialist' },
      address: { '@type': 'PostalAddress', addressLocality: 'Düsseldorf', addressCountry: 'DE' },
      areaServed: ['DE', 'EU'],
      knowsLanguage: ['de', 'en'],
      description: lang === 'de'
        ? 'Google Ads, Websites und lokale Sichtbarkeit für kleine Unternehmen. Freelancer statt Agentur.'
        : 'Google Ads, websites, and local visibility for small businesses. Freelancer, not agency.',
    }),
  },
  {
    tpl: 'google-ads.html', slug: 'google-ads.html', formSource: 'Google Ads',
    seo: {
      de: {
       title: 'Google Ads Freelancer Düsseldorf | Ex-Google SEA-Experte — Click-Capybara',
      desc: 'Google Ads Freelancer aus Düsseldorf, 8+ Jahre Erfahrung, davon 2 bei Google. Kampagnenmanagement, Scripts & Automatisierung, Strategie-Audits. Direkter Kontakt, kein Agentur-Aufschlag.',
      },
      en: {
       title: 'Google Ads Freelancer Düsseldorf | Ex-Google SEA Specialist — Click-Capybara',
       desc: 'Freelance Google Ads specialist based in Düsseldorf, 8+ years experience including 2 years at Google. Campaign management, scripts & automation, and strategy audits.',
      },
    },

    jsonld: (lang) => ({
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: lang === 'de' ? 'Google Ads Kampagnenmanagement' : 'Google Ads Campaign Management',
      provider: { '@type': 'ProfessionalService', name: 'Click-Capybara', url: BASE + '/' },
      areaServed: ['DE', 'EU'],
      availableLanguage: ['de', 'en'],
    }),
  },
  {
    tpl: 'local-hero-kit.html', slug: 'local-hero-kit.html', formSource: 'Local Hero Kit',
    seo: {
      de: {
        title: 'Local Hero Kit — Website & Google-Profil für lokale Unternehmen',
        desc: 'Neue Website, gepflegtes Google Unternehmensprofil und Sichtbarkeit in der KI-Suche. Von einer Person gebaut, fair bepreist. Für Cafés, Studios und lokale Läden.',
      },
      en: {
        title: 'Local Hero Kit — Website & Google Profile for Local Businesses',
        desc: 'A clean website, a working Google Business Profile, and visibility in AI search. Built by one person, without agency overhead. For cafés, studios, and local shops.',
      },
    },
    jsonld: (lang) => ({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Local Hero Kit',
      serviceType: lang === 'de'
        ? 'Website-Erstellung und Google Unternehmensprofil für lokale Unternehmen'
        : 'Website creation and Google Business Profile setup for local businesses',
      provider: { '@type': 'ProfessionalService', name: 'Click-Capybara', url: BASE + '/', address: { '@type': 'PostalAddress', addressLocality: 'Düsseldorf', addressCountry: 'DE' } },
      areaServed: 'DE',
      availableLanguage: ['de', 'en'],
    }),
  },
  {
    tpl: 'free-script.html', slug: 'free-script.html', formSource: null,
    seo: {
      de: {
        title: 'AI Max NegativeIQ — kostenloses Google Ads Script mit KI',
        desc: 'Kostenloses KI-Tool für Google Ads: klassifiziert Suchbegriffe, schützt konvertierende Keywords und schlägt Negatives automatisch vor. Vom Spezialisten gebaut.',
      },
      en: {
        title: 'AI Max NegativeIQ — Free AI-Powered Google Ads Script',
        desc: 'Free AI-powered Google Ads tool. Classifies search terms, protects converting keywords, pushes negatives automatically. Built by a specialist.',
      },
    },
    jsonld: null, // page ships its own SoftwareApplication schema
  },
  {
    tpl: 'privacy.html', slug: 'privacy.html', formSource: null, noindexAlt: false,
    seo: {
      de: { title: 'Datenschutzerklärung — Click-Capybara', desc: 'Datenschutzerklärung von Click-Capybara.' },
      en: { title: 'Privacy Policy — Click-Capybara', desc: 'Privacy Policy for Click-Capybara.' },
    },
    jsonld: null,
  },
];

// ─── helpers ────────────────────────────────────────────────────────────────
const urlFor = (slug, lang) => BASE + (lang === 'de' ? '/' : '/en/') + slug;

function mergedDict(page, lang) {
  const base = translations[lang] || {};
  const ov = (overrides[page.tpl] && overrides[page.tpl][lang]) || {};
  return { ...base, ...ov };
}

function render(page, lang) {
  const html = fs.readFileSync(path.join(__dirname, '_templates', page.tpl), 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false });
  const dict = mergedDict(page, lang);
  const seo = page.seo[lang];
  const selfUrl = urlFor(page.slug, lang);
  const otherUrl = urlFor(page.slug, lang === 'de' ? 'en' : 'de');

  // 1. bake translations into the markup
  $('[data-key]').each((_, el) => {
    const node = $(el);
    const key = node.attr('data-key');
    if (dict[key] !== undefined) {
      if (el.tagName === 'meta') node.attr('content', dict[key]);
      else if (el.tagName === 'title') node.text(''); // set below from seo config
      else node.html(dict[key]);
    }
    node.removeAttr('data-key');
  });

  // 2. html lang + head SEO
  $('html').attr('lang', lang);
  $('title').first().text(seo.title);
  let metaDesc = $('meta[name="description"]').first();
  if (!metaDesc.length) {
    $('title').first().after('\n    <meta name="description" content="">');
    metaDesc = $('meta[name="description"]').first();
  }
  metaDesc.attr('content', seo.desc);
  $('link[rel="canonical"]').remove();
  $('link[rel="alternate"][hreflang]').remove();
  $('meta[property^="og:"], meta[name^="twitter:"]').remove();

  const headExtra = [
    `<link rel="canonical" href="${selfUrl}">`,
    `<link rel="alternate" hreflang="de" href="${urlFor(page.slug, 'de')}">`,
    `<link rel="alternate" hreflang="en" href="${urlFor(page.slug, 'en')}">`,
    `<link rel="alternate" hreflang="x-default" href="${urlFor(page.slug, 'de')}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Click-Capybara">`,
    `<meta property="og:locale" content="${lang === 'de' ? 'de_DE' : 'en_US'}">`,
    `<meta property="og:title" content="${seo.title}">`,
    `<meta property="og:description" content="${seo.desc}">`,
    `<meta property="og:url" content="${selfUrl}">`,
    `<meta property="og:image" content="${OG_IMAGE}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${seo.title}">`,
    `<meta name="twitter:description" content="${seo.desc}">`,
    `<meta name="twitter:image" content="${OG_IMAGE}">`,
  ].map((l) => '    ' + l).join('\n');
  metaDesc.after('\n' + headExtra);

  // 3. structured data (replace only generic Person schema on index; keep page-own schemas)
  if (page.jsonld) {
    $('script[type="application/ld+json"]').each((_, s) => {
      const txt = $(s).html() || '';
      if (txt.includes('"Person"') && txt.includes('"jobTitle"')) $(s).remove();
    });
    $('head').append(`\n    <script type="application/ld+json">\n    ${JSON.stringify(page.jsonld(lang))}\n    </script>\n`);
  }

  // 4. language toggle links + active state
  const deUrl = urlFor(page.slug, 'de');
  const enUrl = urlFor(page.slug, 'en');
  for (const [id, l] of [['lang-en', 'en'], ['lang-de', 'de'], ['mobile-lang-en', 'en'], ['mobile-lang-de', 'de']]) {
    const el = $('#' + id);
    if (!el.length) continue;
    el.attr('href', l === 'de' ? deUrl : enUrl);
    el.attr('hreflang', l);
    const cls = (el.attr('class') || '')
      .split(/\s+/)
      .filter((c) => !['font-bold', 'font-medium', 'text-ink-900', 'text-gray-900', 'text-gray-400'].includes(c));
    if (l === lang) cls.push('font-bold', 'text-ink-900');
    else cls.push('font-medium', 'text-gray-400');
    el.attr('class', cls.join(' ').trim());
  }

  // 5. English output: internal links point into /en/
  if (lang === 'en') {
    $('a[href]').each((_, a) => {
      const el = $(a);
      const href = el.attr('href');
      const m = href && href.match(/^\/((?:google-ads|local-hero-kit|free-script|privacy)\.html)?(#.*)?$/);
      if (m) el.attr('href', '/en/' + (m[1] || '') + (m[2] || ''));
    });
  }

  // 6. contact form source tag
  if (page.formSource) $('#contact-form').attr('data-source', page.formSource + (lang === 'en' ? ' (EN)' : ' (DE)'));

  // 7. defer Silktide consent manager (render-blocking fix)
  const silktideCss = $('#silktide-consent-manager-css');
  if (silktideCss.length) {
    const href = silktideCss.attr('href');
    silktideCss.attr('media', 'print').attr('onload', "this.media='all'");
    silktideCss.after(`\n    <noscript><link rel="stylesheet" href="${href}"></noscript>`);
  }
  $('script[src*="silktide-consent-manager.js"]').attr('defer', '');

  // config-Snippet erst ausführen, wenn die Library geladen ist
  $('script').each((_, el) => {
    const node = $(el);
    const txt = node.html() || '';
    if (txt.includes('silktideCookieBannerManager.updateCookieBannerConfig')) {
      node.html(`window.addEventListener('load', function () {\n${txt}\n});`);
    }
  });
  // 8. inline critical CSS (eliminates render-blocking request)
  const cssContent = fs.readFileSync(path.join(DIST, 'css', 'styles.css'), 'utf8');
  $('link[href="/css/styles.css"]').replaceWith(`<style>${cssContent}</style>`);
  
  // 9. lazy-load contact form JS once #contact is near viewport
  const cfScript = $('script[src="/js/contact-form.js"]');
  if (cfScript.length) {
    cfScript.remove();
    $('body').append(`
    <script>
    (function () {
      var target = document.querySelector('#contact');
      if (!target) return;
      var loaded = false;
      function loadForm() {
        if (loaded) return;
        loaded = true;
        var s = document.createElement('script');
        s.src = '/js/contact-form.js';
        document.body.appendChild(s);
      }
      new IntersectionObserver(function (entries, obs) {
        if (entries[0].isIntersecting) { loadForm(); obs.disconnect(); }
      }, { rootMargin: '400px' }).observe(target);
    })();
    </script>`);
  }

  // 10. point at self-hosted Phosphor font instead of unpkg
  $('link[href*="unpkg.com/@phosphor-icons"]').each((_, el) => {
    $(el).attr('href', '/vendor/phosphor/style.css').removeAttr('crossorigin');
  });
  $('noscript link[href*="unpkg.com/@phosphor-icons"]').attr('href', '/vendor/phosphor/style.css');
  
  // 11. self-hosted Inter: preload font, inline the tiny stylesheet
  $('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]').each((_, el) => {
    const parent = $(el).parent();
    if (parent.is('noscript')) parent.remove();
    else $(el).remove();
  });
  const interCss = fs.readFileSync(path.join(DIST, 'vendor', 'inter', 'inter.css'), 'utf8');
  $('head').prepend(`
    <link rel="preload" as="font" type="font/woff2" href="/vendor/inter/inter-latin.woff2" crossorigin>
    <style>${interCss}</style>`);

  // 12. associate every form label with its control (accessible names)
  $('#contact-form div').each((i, div) => {
    const wrap = $(div);
    const label = wrap.children('label').first();
    const field = wrap.children('input, select, textarea').first();
    if (!label.length || !field.length) return;
    let id = field.attr('id');
    if (!id) {
      id = 'cf-' + (field.attr('name') || i);
      field.attr('id', id);
    }
    label.attr('for', id);
  });
  return $.html();
}


// ─── build ──────────────────────────────────────────────────────────────────
fs.mkdirSync(path.join(DIST, 'en'), { recursive: true });

for (const page of PAGES) {
  const outName = page.tpl === 'index.html' ? 'index.html' : page.slug;
  fs.writeFileSync(path.join(DIST, outName), render(page, 'de'));
  fs.writeFileSync(path.join(DIST, 'en', outName), render(page, 'en'));
  console.log(`built /${outName} + /en/${outName}`);
}

// sitemap with hreflang annotations
const today = new Date().toISOString().slice(0, 10);
const urls = [];
for (const page of PAGES) {
  for (const lang of ['de', 'en']) {
    urls.push(`  <url>
    <loc>${urlFor(page.slug, lang)}</loc>
    <lastmod>${today}</lastmod>
    <xhtml:link rel="alternate" hreflang="de" href="${urlFor(page.slug, 'de')}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${urlFor(page.slug, 'en')}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor(page.slug, 'de')}"/>
  </url>`);
  }
}
fs.writeFileSync(path.join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>\n`);

console.log('sitemap.xml written — build complete');
