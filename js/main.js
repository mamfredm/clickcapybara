// Shared site behavior: mobile nav, scroll fade-in, language helpers.
(function () {
  'use strict';

  // ── Mobile menu ─────────────────────────────────────────────
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
  }

  // ── Scroll fade-in ──────────────────────────────────────────
  const fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    fadeEls.forEach((el) => observer.observe(el));
  }

  // ── Language helpers ────────────────────────────────────────
  // Each page declares its counterpart via <link rel="alternate" hreflang>.
  const pageLang = (document.documentElement.lang || 'en').slice(0, 2);
  const otherLang = pageLang === 'de' ? 'en' : 'de';
  const altLink = document.querySelector('link[rel="alternate"][hreflang="' + otherLang + '"]');
  const altUrl = altLink ? altLink.getAttribute('href') : null;

  // Backward compatibility: printed cards / NFC tags may use ?lang=…
  const urlLang = new URLSearchParams(window.location.search).get('lang');
  if (altUrl && (urlLang === 'de' || urlLang === 'en') && urlLang !== pageLang) {
    window.location.replace(altUrl);
    return;
  }

  // Gentle hint (no auto-redirect) for visitors whose browser language
  // doesn't match the page language. Shown once, dismissible.
  const browserLang = (navigator.language || '').toLowerCase();
  const mismatch =
    (pageLang === 'de' && browserLang && !browserLang.startsWith('de')) ||
    (pageLang === 'en' && browserLang.startsWith('de'));

  if (altUrl && mismatch && !localStorage.getItem('langHintDismissed')) {
    const label = pageLang === 'de'
      ? { text: 'This page is also available in English.', cta: 'View in English', close: 'Dismiss' }
      : { text: 'Diese Seite gibt es auch auf Deutsch.', cta: 'Auf Deutsch ansehen', close: 'Schließen' };

    const bar = document.createElement('div');
    bar.setAttribute('role', 'status');
    bar.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);' +
      'z-index:9999;background:#1a1a1a;color:#f4f1e8;padding:12px 18px;border-radius:14px;' +
      'display:flex;align-items:center;gap:14px;font-size:14px;box-shadow:0 8px 30px rgba(0,0,0,.25);' +
      'max-width:calc(100vw - 32px);';
    bar.innerHTML =
      '<span>' + label.text + '</span>' +
      '<a href="' + altUrl + '" style="color:#fcba02;font-weight:700;white-space:nowrap;">' + label.cta + ' →</a>' +
      '<button type="button" aria-label="' + label.close + '" style="background:none;border:none;' +
      'color:#f4f1e8;opacity:.6;cursor:pointer;font-size:16px;line-height:1;">✕</button>';
    bar.querySelector('button').addEventListener('click', () => {
      localStorage.setItem('langHintDismissed', '1');
      bar.remove();
    });
    document.body.appendChild(bar);
  }
})();
