// build.js — renders the bilingual static site.
//   node build.js
// Reads templates/ + src/translations.js + src/overrides.json
// Writes German pages to dist root and English pages to dist/en/,
// plus sitemap.xml. Copy of static folders (css/js/vendor/assets)
// is done here too, so dist/ is the complete deployable site.
//
// Redesign ("Bühne"): pages marked v2 use _templates/_partials/*.html, css/site.css and js/site.js.
// They are German-only for now: their English counterparts in /en/ are NOT rebuilt (the last
// build of the old design stays online) until the English templates exist. The old templates
// live in _templates/_legacy/ for that work.
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const translations = require('./_src/translations.js');
const overrides = require('./_src/overrides.json');
const enV2 = require('./_src/en-v2.json'); // English texts for the redesigned (v2) pages
const missingEn = new Map();

// Legal data (Impressum + Datenschutz) lives in _src/legal.json.
// Templates use {{legal.name}} etc.; empty values show as [[name]] and trigger a warning.
const legal = fs.existsSync(path.join(__dirname, '_src', 'legal.json'))
  ? require('./_src/legal.json') : {};
const missingLegal = new Set();

const BASE = 'https://www.click-capybara.com';
const DIST = __dirname; // build in place — GitHub Pages serves the repo root
const OG_IMAGE = BASE + '/assets/og-image.png';

// ─── Page config ────────────────────────────────────────────────────────────
const PAGES = [
  {
    tpl: 'index.html', slug: '', formSource: 'Homepage', v2: true,
    seo: {
      de: {
        title: 'Freelancer für Google Ads, Websites & Automatisierung | Click-Capybara',
        desc: 'Online sichtbar werden bei Google, auf Maps und in der KI-Suche. Google Ads, Websites und Automatisierung von Max, 8+ Jahre Erfahrung. Kostenlose zweite Meinung.',
      },
      en: {
        title: 'Freelancer for Google Ads, Websites & Automation | Click-Capybara',
        desc: 'Get found on Google, on Maps and in AI search. Google Ads, websites and automation from Max, 8+ years of experience. Free second opinion.',
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
        ? 'Google Ads, Websites und Automatisierung. Freelancer statt Agentur.'
        : 'Google Ads, websites, and local visibility for small businesses. Freelancer, not agency.',
    }),
  },
  {
    tpl: 'google-ads.html', slug: 'google-ads.html', formSource: 'Google Ads', v2: true,
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
    tpl: 'local-hero-kit.html', slug: 'local-hero-kit.html', formSource: 'Local Hero Kit', v2: true,
    seo: {
      de: {
        title: 'Website erstellen lassen Düsseldorf | Local Hero Kit — Click-Capybara',
        desc: 'Website, Google-Unternehmensprofil und Sichtbarkeit in der KI-Suche. Einmal gebaut, kein Abo. Ein Ansprechpartner vom ersten Gespräch bis zur fertigen Seite.',
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
    tpl: 'automatisierung.html', slug: 'automatisierung.html', formSource: 'Automatisierung', v2: true,
    seo: {
      de: {
        title: 'Marketing-Automatisierung mit n8n, Shopify & lokaler KI | Click-Capybara',
        desc: 'Wiederkehrende Aufgaben, die von selbst laufen: n8n-Workflows, Shopify-Integrationen und lokale KI. Ein Ablauf ab 490 €, alles Größere nach Aufwand.',
      },
      en: {
        title: 'Marketing Automation with n8n, Shopify & Local AI | Click-Capybara',
        desc: 'Recurring tasks that run on their own: n8n workflows, Shopify integrations and local AI. One workflow from €490, anything bigger by the hour.',
      },
    },
    jsonld: (lang) => ({
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: lang === 'de' ? 'Marketing-Automatisierung' : 'Marketing automation',
      provider: { '@type': 'ProfessionalService', name: 'Click-Capybara', url: BASE + '/' },
      areaServed: ['DE', 'EU'],
      availableLanguage: ['de', 'en'],
    }),
  },
  {
    tpl: 'preise.html', slug: 'preise.html', formSource: 'Preise', v2: true,
    seo: {
      de: {
        title: 'Preise für Google Ads, Websites & Automatisierung | Click-Capybara',
        desc: 'Alle Preise auf einen Blick: Google-Ads-Betreuung ab 395 € im Monat, Local Hero Kit 1.150 € einmalig, Automatisierung ab 490 €. Angebotspreise bis 01.03.2027.',
      },
      en: {
        title: 'Pricing for Google Ads, Websites & Automation | Click-Capybara',
        desc: 'Clear prices: Google Ads management from €395 a month, Local Hero Kit €1,150 one-off, one automation workflow from €490. Offer prices until 1 March 2027.',
      },
    },
    jsonld: null,
  },
  {
    tpl: 'fallbeispiel-onlineshop.html', slug: 'fallbeispiel-onlineshop.html', formSource: 'Fallbeispiel Onlineshop', v2: true,
    seo: {
      de: {
        title: 'Fallbeispiel Google Ads: Onlineshop, 12 Monate, alle Zahlen | Click-Capybara',
        desc: 'Ein Onlineshop nach der Übernahme: 198 statt 55 Bestellungen, ROAS von 450 % auf 810 % bei doppeltem Budget. Mit einem FAQ, das ROAS, Conversion und Deckungsbeitrag einfach erklärt.',
      },
      en: {
        title: 'Google Ads Case Study: Online Shop, 12 Months, All the Numbers | Click-Capybara',
        desc: 'An online shop after the takeover: 198 orders instead of 55, ROAS up from 450% to 810% at double the budget. With an FAQ that explains ROAS, conversions and contribution margin in plain words.',
      },
    },
    jsonld: (lang) => ({
      '@context': 'https://schema.org', '@type': 'Article',
      headline: lang === 'de' ? 'Fallbeispiel Google Ads: Onlineshop, zwölf Monate, alle Zahlen' : 'Google Ads case study: online shop, twelve months, all the numbers',
      datePublished: '2026-11-16', dateModified: '2026-11-16', inLanguage: lang,
      author: { '@type': 'Person', name: 'Max Müller', url: 'https://www.click-capybara.com/' },
      publisher: { '@type': 'Organization', name: 'Click-Capybara', url: 'https://www.click-capybara.com/' },
    }),
  },
  {
    tpl: 'google-ads-kosten.html', slug: 'google-ads-kosten.html', formSource: 'Google Ads Kosten', v2: true,
    seo: {
      de: {
        title: 'Google Ads Kosten berechnen: Was darf ein Klick kosten? | Click-Capybara',
        desc: 'Was kostet Google Ads? Deckungsbeitragsrechner: maximaler Klickpreis, Break-even-ROAS und was bei deinem Budget übrig bleibt. Kostenlos, ohne Anmeldung.',
      },
      en: {
        title: 'Google Ads Cost Calculator: What Can a Click Cost? | Click-Capybara',
        desc: 'How much does Google Ads cost? Contribution-margin calculator: maximum click price, break-even ROAS and what is left at your budget. Free, no sign-up.',
      },
    },
    jsonld: null, // FAQ schema is generated from the page's own questions
  },
  {
    tpl: 'tools.html', slug: 'tools.html', formSource: 'Tools & Scripts', v2: true,
    seo: {
      de: {
        title: 'Kostenlose Google Ads Tools: Rechner, Script und Fallbeispiel | Click-Capybara',
        desc: 'Erst rechnen, dann reden: Deckungsbeitragsrechner, Betreuungsrechner, ein kostenloses Google Ads Script mit KI und ein Fallbeispiel mit echten Zahlen. Ohne Anmeldung.',
      },
      en: {
        title: 'Free Google Ads Tools: Calculators, Script and Case Study | Click-Capybara',
        desc: 'Do the maths first, then talk: contribution-margin calculator, management calculator, a free AI-powered Google Ads script and a case study with real numbers. No sign-up.',
      },
    },
    jsonld: null,
  },
  {
    tpl: 'free-script.html', slug: 'free-script.html', formSource: 'AI Max NegativeIQ', v2: true,
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
    tpl: 'privacy.html', slug: 'privacy.html', formSource: null, noindexAlt: false, v2: true,
    seo: {
      de: { title: 'Datenschutzerklärung — Click-Capybara', desc: 'Datenschutzerklärung von Click-Capybara.' },
      en: { title: 'Privacy Policy — Click-Capybara', desc: 'Privacy Policy for Click-Capybara.' },
    },
    jsonld: null,
  },
  {
    tpl: 'impressum.html', slug: 'impressum.html', formSource: null, v2: true,
    seo: {
      de: { title: 'Impressum — Click-Capybara', desc: 'Impressum und Anbieterkennzeichnung von Click-Capybara.' },
      en: { title: 'Legal Notice (Impressum) — Click-Capybara', desc: 'Legal notice and provider information for Click-Capybara.' },
    },
    jsonld: null,
  },
  {
    tpl: 'nonogrid.html', slug: 'nonogrid.html', formSource: null, standalone: true,
    seo: {
      de: { title: 'Nonogrid — Nonogramm-Rätsel kostenlos spielen | Click-Capybara', desc: 'Kostenlose Nonogramm-Rätsel (Picross) im Browser: über 50 Rätsel, tägliche Challenge, eigener Rätsel-Editor. Ohne Anmeldung, ohne Tracking.' },
      en: { title: 'Nonogrid — Free Nonogram Puzzles | Click-Capybara', desc: 'Free nonogram (picross) puzzles in your browser: 50+ puzzles, daily challenge, built-in puzzle editor. No sign-up, no tracking.' },
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

// {{> name key="value"}} pulls in _templates/_partials/name.html; %%key%% inside the partial is replaced.
// The contact partial also takes service="…" to preselect the matching option.
function expandPartials(html) {
  return html.replace(/\{\{>\s*([\w-]+)((?:\s+\w+="[^"]*")*)\s*\}\}/g, (m, name, attrs) => {
    let out = fs.readFileSync(path.join(__dirname, '_templates', '_partials', name + '.html'), 'utf8');
    const params = {};
    (attrs.match(/\w+="[^"]*"/g) || []).forEach((a) => { const i = a.indexOf('='); params[a.slice(0, i)] = a.slice(i + 2, -1); });
    out = out.replace(/%%(\w+)%%/g, (mm, k) => (params[k] !== undefined ? params[k] : ''));
    if (params.service) out = out.replace('<option>' + params.service + '</option>', '<option selected>' + params.service + '</option>');
    return out;
  });
}

const outNameOf = (page) => (page.tpl === 'index.html' ? 'index.html' : page.slug);
const enFileExists = (page) => !!page.seo.en; // every page with English SEO texts gets an /en/ version

// English for redesigned pages: every text node and a few attributes are looked up in _src/en-v2.json.
// Blocks that are already English (data-lang="en") are skipped. Missing entries are reported after the build.
function translateV2($, page) {
  const dict = enV2.text, keep = new Set(enV2.keep);
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  const lookup = (raw) => {
    const s = norm(raw);
    if (s && dict[s] !== undefined) return dict[s];
    if (/^(\+ )?[\d.]+ €$/.test(s)) return s.replace(/([\d.]+) €/, (m, n) => '€' + n.replace(/\./g, ','));
    if (!s || !/[A-Za-zÄÖÜäöüß]/.test(s) || keep.has(s) || /^\{\{legal\.\w+\}\}$/.test(s)) return null;
    if (dict[s] !== undefined) return dict[s];
    if (!missingEn.has(s)) missingEn.set(s, page.tpl);
    return null;
  };
  (function walk(node) {
    $(node).contents().each((_, c) => {
      if (c.type === 'text') {
        const en = lookup(c.data);
        if (en !== null) c.data = c.data.match(/^\s*/)[0] + en + c.data.match(/\s*$/)[0];
      } else if (c.type === 'tag' && !['script', 'style', 'noscript'].includes(c.name)) {
        if (c.attribs['data-notr'] !== undefined) { delete c.attribs['data-notr']; return; }
        for (const a of ['placeholder', 'aria-label', 'alt', 'title']) {
          if (c.attribs[a]) { const en = lookup(c.attribs[a]); if (en !== null) c.attribs[a] = en; }
        }
        walk(c);
      }
    });
  })($('body')[0]);
  $('script').each((_, s) => {
    let txt = $(s).html() || '';
    let changed = false;
    for (const [de, en] of Object.entries(enV2.script)) if (txt.includes(de)) { txt = txt.split(de).join(en); changed = true; }
    if (changed) $(s).html(txt);
  });
}

function render(page, lang) {
  const html = expandPartials(fs.readFileSync(path.join(__dirname, '_templates', page.tpl), 'utf8'));
  const $ = cheerio.load(html, { decodeEntities: false });
  const dict = mergedDict(page, lang);
  const seo = page.seo[lang];

  // 0. language blocks (legal pages): keep only <… data-lang="xx"> matching this build
  $('[data-lang]').each((_, el) => {
    const node = $(el);
    if (node.attr('data-lang') === lang) { node.removeAttr('data-lang'); if (page.v2 && lang === 'en') node.attr('data-notr', ''); }
    else node.remove();
  });
  // 0b. optional blocks: <… data-if="key"> only if legal.key is set
  $('[data-if]').each((_, el) => {
    const node = $(el);
    if (legal[node.attr('data-if')]) node.removeAttr('data-if');
    else node.remove();
  });
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

  // 1b. redesigned pages: English texts
  if (page.v2 && lang === 'en') translateV2($, page);
  if (page.v2) $('[data-notr]').removeAttr('data-notr');
  // Start page: the start animation uses the mono font, so load it early there (other pages only preload the headline font)
  if (page.tpl === 'index.html') $('link[rel="preload"][href="/vendor/fonts/space-grotesk-latin.woff"]').after('\n    <link rel="preload" as="font" type="font/woff" href="/vendor/fonts/jetbrains-mono-latin.woff" crossorigin>');
  // English hero video and poster
  if (lang === 'en') $('#hero-video').attr('data-src', '/assets/hero-en.mp4').attr('poster', '/assets/hero-poster-en.jpg');

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
    ...(enFileExists(page) ? [`<link rel="alternate" hreflang="en" href="${urlFor(page.slug, 'en')}">`] : []),
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

  // 3b. FAQ schema from the questions on the page (already in the page's language)
  const faqs = $('details.db-faq').map((_, d) => ({
    '@type': 'Question',
    name: $(d).find('summary').text().trim(),
    acceptedAnswer: { '@type': 'Answer', text: $(d).find('p').text().trim() },
  })).get();
  if (faqs.length) $('head').append(`\n    <script type="application/ld+json">\n    ${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs })}\n    </script>\n`);

  // 4. language toggle links + active state
  const deUrl = urlFor(page.slug, 'de');
  const enUrl = enFileExists(page) ? urlFor(page.slug, 'en') : BASE + '/en/';
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
      const m = href && href.match(/^\/((?:fallbeispiel-onlineshop|google-ads-kosten|google-ads|local-hero-kit|automatisierung|preise|tools|free-script|privacy|impressum|nonogrid)\.html)?(#.*)?$/);
      if (m) el.attr('href', '/en/' + (m[1] || '') + (m[2] || ''));
    });
  }

  // 6. contact form source tag
  if (page.formSource) $('#contact-form').attr('data-source', page.formSource + (lang === 'en' ? ' (EN)' : ' (DE)'));

  // Standalone pages (e.g. the game) carry no site chrome: no consent manager,
  // no GTM, no site CSS/JS, no webfonts – they are fully self-contained.
  if (page.standalone) return fillLegal($.html());

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
  // 7b. redesigned pages: inline site.css, mark the current nav entry, fix the contact link on pages without a form
  if (page.v2) {
    const siteCss = fs.readFileSync(path.join(DIST, 'css', 'site.css'), 'utf8');
    $('link[href="/css/site.css"]').replaceWith(`<style>${siteCss}</style>`);
    $('#site-nav a.nl').each((_, a) => {
      if ($(a).attr('href') === (lang === 'en' ? '/en/' : '/') + page.slug) $(a).attr('aria-current', 'page');
    });
    if (!$('#contact').length) $('a[href="#contact"]').attr('href', (lang === 'en' ? '/en/' : '/') + '#contact');
  }

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
  if (!page.v2) {
    const interCss = fs.readFileSync(path.join(DIST, 'vendor', 'inter', 'inter.css'), 'utf8');
    $('head').prepend(`
    <link rel="preload" as="font" type="font/woff2" href="/vendor/inter/inter-latin.woff2" crossorigin>
    <style>${interCss}</style>`);
  }

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

  // 13. accessible name for the icon-only mobile menu button
  const menuBtn = $('#mobile-menu-button');
  if (menuBtn.length) {
    menuBtn.attr('aria-label', lang === 'de' ? 'Menü öffnen' : 'Open menu');
    menuBtn.attr('aria-expanded', 'false');
    menuBtn.find('i').attr('aria-hidden', 'true');
  }

  // 14. defer main.js (render-blocking)
  $('script[src="/js/main.js"]').attr('defer', '');

  // 15. fill {{legal.xxx}} tokens
  return fillLegal($.html());
}

function fillLegal(out) {
  return out.replace(/\{\{legal\.(\w+)\}\}/g, (m, key) => {
    const v = legal[key];
    if (v) return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    missingLegal.add(key);
    return '[[' + key + ']]';
  });
}


// ─── build ──────────────────────────────────────────────────────────────────
fs.mkdirSync(path.join(DIST, 'en'), { recursive: true });

for (const page of PAGES) {
  const outName = outNameOf(page);
  fs.writeFileSync(path.join(DIST, outName), render(page, 'de'));
  fs.writeFileSync(path.join(DIST, 'en', outName), render(page, 'en'));
  console.log(`built /${outName} + /en/${outName}`);
}

// sitemap with hreflang annotations
const today = new Date().toISOString().slice(0, 10);
const urls = [];
for (const page of PAGES) {
  const hasEn = enFileExists(page);
  for (const lang of hasEn ? ['de', 'en'] : ['de']) {
    urls.push(`  <url>
    <loc>${urlFor(page.slug, lang)}</loc>
    <lastmod>${today}</lastmod>
    <xhtml:link rel="alternate" hreflang="de" href="${urlFor(page.slug, 'de')}"/>${hasEn ? `
    <xhtml:link rel="alternate" hreflang="en" href="${urlFor(page.slug, 'en')}"/>` : ''}
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
if (missingEn.size) {
  console.warn('\n⚠  ' + missingEn.size + ' German text(s) have no English version in _src/en-v2.json and stay German on /en/:');
  for (const [s, tpl] of missingEn) console.warn('   [' + tpl + '] ' + s);
}
if (missingLegal.size) {
  console.warn('\n⚠  _src/legal.json is missing: ' + [...missingLegal].join(', ') +
    '\n   These show as [[…]] on /impressum.html and /privacy.html — do NOT publish like this.');
}
