// SEO texts and structured data for the redesigned pages.
// Titles: aim for 50–60 characters. Descriptions: aim for 110–130 characters, so they show in full on phones.
const BASE = 'https://www.click-capybara.com';
const ORG = BASE + '/#org';
const PERSON = BASE + '/#max';
const VALID = '2027-03-01'; // offer prices end here; regular prices are named on the pages

const SEO = {
  'index.html': {
    de: { title: 'Mehr Kunden über Google Ads & Website | Click-Capybara', desc: 'Was kostet Google Ads, und rechnet es sich? Rechne es kostenlos nach. Google Ads, Websites und Automatisierung aus Düsseldorf.' },
    en: { title: 'More Customers via Google Ads & Website | Click-Capybara', desc: 'How much does Google Ads cost, and does it pay off? Check it for free. Google Ads, websites and automation from Düsseldorf.' },
  },
  'google-ads.html': {
    de: { title: 'Google Ads Freelancer Düsseldorf: Betreuung ab 395 €', desc: 'Mehr Kunden über Google Ads: Betreuung ab 395 € im Monat, monatlich kündbar, 8+ Jahre Erfahrung. Kostenlose Einschätzung.' },
    en: { title: 'Google Ads Freelancer Düsseldorf: Management from €395', desc: 'More customers through Google Ads: management from €395 a month, cancel monthly, 8+ years of experience. Free assessment.' },
  },
  'google-ads-kosten.html': {
    de: { title: 'Was kostet Google Ads? Rechner für deinen Klickpreis', desc: 'Was kostet Google Ads wirklich? Rechne aus, welcher Klickpreis sich lohnt und was bei deinem Budget übrig bleibt. Kostenlos.' },
    en: { title: 'How Much Does Google Ads Cost? Click Price Calculator', desc: 'What does Google Ads really cost? Work out which click price pays off and what is left at your budget. Free.' },
  },
  'local-hero-kit.html': {
    de: { title: 'Website erstellen lassen: sichtbar bei Google & KI-Suche', desc: 'Website mit Google-Unternehmensprofil für Betriebe in Düsseldorf. Kleine Seiten in einer Woche online, ohne Abo. 1.150 € einmalig.' },
    en: { title: 'Get a Website Built: Visible on Google & in AI Search', desc: 'Website with Google Business Profile for local businesses. Small sites online within a week, no subscription. €1,150 one-off.' },
  },
  'automatisierung.html': {
    de: { title: 'Marketing automatisieren mit n8n, Shopify & KI: ab 490 €', desc: 'Anfragen, Leads und Bewertungen, die von selbst laufen. Mit n8n, Shopify und KI, lokal oder Cloud. Ein Ablauf ab 490 €.' },
    en: { title: 'Automate Marketing with n8n, Shopify & AI: from €490', desc: 'Enquiries, leads and reviews that run on their own. With n8n, Shopify and AI, local or cloud. One workflow from €490.' },
  },
  'preise.html': {
    de: { title: 'Preise: Google Ads Betreuung, Website & Automatisierung', desc: 'Google Ads ab 395 € im Monat, Website 1.150 € einmalig, Automatisierung ab 490 €. Alle Preise offen, ohne Anfrage.' },
    en: { title: 'Pricing: Google Ads Management, Websites & Automation', desc: 'Google Ads from €395 a month, website €1,150 one-off, automation from €490. All prices public, no request needed.' },
  },
  'fallbeispiel-onlineshop.html': {
    de: { title: 'Google Ads Fallbeispiel: 3,5× Umsatz für einen Onlineshop', desc: '198 statt 55 Bestellungen bei doppeltem Budget: alle Zahlen eines Onlineshops, mit ROAS und Conversion einfach erklärt.' },
    en: { title: 'Google Ads Case Study: 3.5× Revenue for an Online Shop', desc: '198 orders instead of 55 at double the budget: all the numbers of an online shop, with ROAS and conversions explained simply.' },
  },
  'tools.html': {
    de: { title: 'Kostenlose Google Ads Tools: Rechner & KI-Script', desc: 'Kostenrechner, Betreuungsrechner und ein KI-Script gegen verschwendetes Budget. Kostenlos, ohne Anmeldung.' },
    en: { title: 'Free Google Ads Tools: Calculators & AI Script', desc: 'Cost calculator, management calculator and an AI script against wasted budget. Free, no sign-up.' },
  },
  'free-script.html': {
    de: { title: 'Negative Keywords per KI: kostenloses Google Ads Script', desc: 'Ordnet deine Suchbegriffe per KI ein, schützt, was konvertiert, und schlägt Negative Keywords vor. Open Source.' },
    en: { title: 'Find Negative Keywords with AI: Free Google Ads Script', desc: 'Classifies your search terms with AI, protects what converts and suggests negative keywords. Open source.' },
  },
};

// Breadcrumb trail below the home page: [name, slug] pairs per language
const CRUMBS = {
  'google-ads.html': { de: [['Google Ads', 'google-ads.html']], en: [['Google Ads', 'google-ads.html']] },
  'google-ads-kosten.html': { de: [['Google Ads', 'google-ads.html'], ['Google Ads Kosten', 'google-ads-kosten.html']], en: [['Google Ads', 'google-ads.html'], ['Google Ads cost', 'google-ads-kosten.html']] },
  'fallbeispiel-onlineshop.html': { de: [['Google Ads', 'google-ads.html'], ['Fallbeispiel Onlineshop', 'fallbeispiel-onlineshop.html']], en: [['Google Ads', 'google-ads.html'], ['Case study: online shop', 'fallbeispiel-onlineshop.html']] },
  'local-hero-kit.html': { de: [['Local Hero Kit', 'local-hero-kit.html']], en: [['Local Hero Kit', 'local-hero-kit.html']] },
  'automatisierung.html': { de: [['Automatisierung', 'automatisierung.html']], en: [['Automation', 'automatisierung.html']] },
  'preise.html': { de: [['Preise', 'preise.html']], en: [['Pricing', 'preise.html']] },
  'tools.html': { de: [['Tools & Scripts', 'tools.html']], en: [['Tools & Scripts', 'tools.html']] },
  'free-script.html': { de: [['Tools & Scripts', 'tools.html'], ['AI Max NegativeIQ', 'free-script.html']], en: [['Tools & Scripts', 'tools.html'], ['AI Max NegativeIQ', 'free-script.html']] },
  'privacy.html': { de: [['Datenschutz', 'privacy.html']], en: [['Privacy', 'privacy.html']] },
  'impressum.html': { de: [['Impressum', 'impressum.html']], en: [['Legal notice', 'impressum.html']] },
};

const de = (lang, a, b) => (lang === 'de' ? a : b);
const price = (p, opts = {}) => ({
  '@type': opts.monthly ? 'UnitPriceSpecification' : 'PriceSpecification',
  ...(opts.from ? { minPrice: p } : { price: p }),
  priceCurrency: 'EUR',
  valueAddedTaxIncluded: false,
  ...(opts.monthly ? { unitCode: 'MON', unitText: 'Monat' } : {}),
});
const offer = (name, p, url, opts = {}) => ({
  '@type': 'Offer', name, url, priceCurrency: 'EUR', priceValidUntil: VALID,
  ...(opts.from ? {} : { price: String(p) }),
  priceSpecification: price(p, opts),
  seller: { '@id': ORG },
});

function offers(lang, urlFor) {
  const ga = urlFor('google-ads.html', lang), lhk = urlFor('local-hero-kit.html', lang), au = urlFor('automatisierung.html', lang);
  return {
    ga: [
      offer(de(lang, 'Google Ads Betreuung, Paket S (5 Stunden)', 'Google Ads management, Package S (5 hours)'), 395, ga, { monthly: true }),
      offer(de(lang, 'Google Ads Betreuung, Paket M (10 Stunden)', 'Google Ads management, Package M (10 hours)'), 790, ga, { monthly: true }),
      offer(de(lang, 'Google Ads Betreuung, Paket L (ab 12 Stunden)', 'Google Ads management, Package L (from 12 hours)'), 950, ga, { monthly: true, from: true }),
    ],
    lhk: [offer('Local Hero Kit', 1150, lhk)],
    au: [offer(de(lang, 'Ein Automatisierungs-Ablauf, fertig übergeben', 'One automation workflow, handed over ready to use'), 490, au, { from: true })],
  };
}

function schemas(page, lang, urlFor) {
  const out = [];
  const s = SEO[page.tpl] && SEO[page.tpl][lang];
  const url = urlFor(page.slug, lang);
  const o = offers(lang, urlFor);
  const service = (name, serviceType, list) => ({
    '@context': 'https://schema.org', '@type': 'Service', name, serviceType, description: s.desc, url,
    provider: { '@id': ORG }, areaServed: { '@type': 'Country', name: 'DE' }, availableLanguage: ['de', 'en'],
    offers: list,
  });
  switch (page.tpl) {
    case 'index.html':
      out.push({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'ProfessionalService', '@id': ORG, name: 'Click-Capybara', url: BASE + '/',
            logo: BASE + '/assets/clickcapybara_outline_bold.svg', image: BASE + '/assets/og-image.png',
            email: 'hello@click-capybara.com',
            description: de(lang, 'Google Ads, Websites und Automatisierung für kleine Unternehmen. Freelancer statt Agentur, mit offenen Preisen.', 'Google Ads, websites and automation for small businesses. A freelancer, not an agency, with public prices.'),
            address: { '@type': 'PostalAddress', streetAddress: 'Tußmannstr. 25', postalCode: '40477', addressLocality: 'Düsseldorf', addressCountry: 'DE' },
            areaServed: { '@type': 'Country', name: 'DE' }, knowsLanguage: ['de', 'en'],
            founder: { '@id': PERSON },
            knowsAbout: ['Google Ads', 'Performance Max', 'Google Ads Scripts', de(lang, 'Website-Erstellung', 'Web design'), de(lang, 'Google-Unternehmensprofil', 'Google Business Profile'), de(lang, 'Marketing-Automatisierung', 'Marketing automation'), 'n8n', 'Shopify'],
            hasOfferCatalog: { '@type': 'OfferCatalog', name: de(lang, 'Leistungen', 'Services'), itemListElement: [...o.ga, ...o.lhk, ...o.au] },
          },
          {
            '@type': 'Person', '@id': PERSON, name: 'Max Müller', givenName: 'Max', familyName: 'Müller',
            jobTitle: de(lang, 'Freelancer für Google Ads, Websites und Automatisierung', 'Freelancer for Google Ads, websites and automation'),
            worksFor: { '@id': ORG }, url: BASE + '/',
            sameAs: ['https://www.linkedin.com/in/click-capybara/'],
          },
          { '@type': 'WebSite', '@id': BASE + '/#website', url: BASE + '/', name: 'Click-Capybara', inLanguage: lang, publisher: { '@id': ORG } },
        ],
      });
      break;
    case 'google-ads.html': out.push(service(de(lang, 'Google Ads Betreuung', 'Google Ads management'), de(lang, 'Google Ads Kampagnenmanagement', 'Google Ads campaign management'), o.ga)); break;
    case 'local-hero-kit.html': out.push(service('Local Hero Kit', de(lang, 'Website-Erstellung mit Google-Unternehmensprofil', 'Website with Google Business Profile'), o.lhk)); break;
    case 'automatisierung.html': out.push(service(de(lang, 'Marketing-Automatisierung', 'Marketing automation'), de(lang, 'Marketing-Automatisierung mit n8n, Shopify und KI', 'Marketing automation with n8n, Shopify and AI'), o.au)); break;
    case 'preise.html':
      out.push({ '@context': 'https://schema.org', '@type': 'OfferCatalog', name: de(lang, 'Preise von Click-Capybara', 'Click-Capybara pricing'), url, itemListElement: [...o.ga, ...o.lhk, ...o.au] });
      break;
    case 'fallbeispiel-onlineshop.html':
      out.push({
        '@context': 'https://schema.org', '@type': 'Article',
        headline: de(lang, 'Google Ads Fallbeispiel: 3,5× Umsatz für einen Onlineshop', 'Google Ads case study: 3.5× revenue for an online shop'),
        description: s.desc, url, datePublished: '2026-11-16', dateModified: '2026-11-19', inLanguage: lang,
        image: BASE + '/assets/og-image.png',
        author: { '@type': 'Person', '@id': PERSON, name: 'Max Müller', url: BASE + '/' },
        publisher: { '@id': ORG },
      });
      break;
    case 'tools.html':
      out.push({
        '@context': 'https://schema.org', '@type': 'CollectionPage', name: s.title, description: s.desc, url, inLanguage: lang,
        hasPart: [
          ['google-ads-kosten.html', de(lang, 'Google Ads Kostenrechner', 'Google Ads cost calculator')],
          ['free-script.html', 'AI Max NegativeIQ'],
          ['fallbeispiel-onlineshop.html', de(lang, 'Fallbeispiel Onlineshop', 'Case study: online shop')],
          ['nonogrid.html', 'Nonogrid'],
        ].map(([slug, name]) => ({ '@type': 'WebPage', name, url: urlFor(slug, lang) })),
      });
      break;
    default:
  }
  const trail = CRUMBS[page.tpl] && CRUMBS[page.tpl][lang];
  if (trail) {
    const items = [[de(lang, 'Startseite', 'Home'), '']].concat(trail);
    out.push({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: items.map(([name, slug], i) => ({ '@type': 'ListItem', position: i + 1, name, item: urlFor(slug, lang) })),
    });
  }
  return out;
}

module.exports = { SEO, schemas, PERSON, ORG };
