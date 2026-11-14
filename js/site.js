// Click-Capybara – behaviour for the redesigned pages (navigation, intro, tabs, price calculator, experience timer, hero video).
(function () {
    'use strict';
    var $ = function (sel, root) { return (root || document).querySelector(sel); };
    var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

    // ── Mobile navigation ───────────────────────────────────────
    var navBtn = $('#nav-toggle'), nav = $('#site-nav');
    if (navBtn && nav) {
        navBtn.addEventListener('click', function () {
            var open = nav.classList.toggle('open');
            navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        nav.addEventListener('click', function (e) {
            if (e.target.closest('a')) { nav.classList.remove('open'); navBtn.setAttribute('aria-expanded', 'false'); }
        });
    }

    // ── Intro (home): runs once per visit via the inline script; a click on the logo replays it ──
    var stage = $('#cc-c'), logo = $('.site-logo');
    if (stage && logo) {
        logo.addEventListener('click', function (e) {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            e.preventDefault();
            window.scrollTo(0, 0);
            stage.classList.remove('play');
            void stage.offsetWidth;
            stage.classList.add('play');
        });
    }

    // ── Tabs: buttons [data-tab] switch panels [data-panel] inside a [data-tabs] section ──
    $$('[data-tabs]').forEach(function (group) {
        var tabs = $$('[data-tab]', group), panels = $$('[data-panel]', group);
        function select(key, fromUser) {
            if (!tabs.some(function (t) { return t.dataset.tab === key; })) return;
            tabs.forEach(function (t) { t.setAttribute('aria-pressed', t.dataset.tab === key ? 'true' : 'false'); });
            panels.forEach(function (p) { p.hidden = p.dataset.panel !== key; });
            if (fromUser && group.hasAttribute('data-tabs-hash') && history.replaceState) history.replaceState(null, '', '#' + key);
        }
        tabs.forEach(function (t) { t.addEventListener('click', function () { select(t.dataset.tab, true); }); });
        if (group.hasAttribute('data-tabs-hash')) {
            var fromHash = function () { var k = location.hash.slice(1); if (k) select(k, false); };
            fromHash();
            window.addEventListener('hashchange', fromHash);
        }
    });

    // ── Experience timer (Google Ads page): counts up from 21.05.2018 ──
    var tEls = {};
    $$('[data-timer]').forEach(function (el) { tEls[el.dataset.timer] = el; });
    if (tEls.y) {
        var START = new Date(2018, 4, 21);
        var p2 = function (n) { return String(n).padStart(2, '0'); };
        var tick = function () {
            var now = new Date();
            var yrs = now.getFullYear() - START.getFullYear();
            var anniv = new Date(START.getFullYear() + yrs, START.getMonth(), START.getDate());
            if (anniv > now) { yrs -= 1; anniv = new Date(START.getFullYear() + yrs, START.getMonth(), START.getDate()); }
            var ms = now - anniv, days = Math.floor(ms / 86400000), rest = ms - days * 86400000;
            tEls.y.textContent = yrs;
            tEls.d.textContent = days;
            tEls.h.textContent = p2(Math.floor(rest / 3600000));
            tEls.m.textContent = p2(Math.floor(rest / 60000) % 60);
            tEls.s.textContent = p2(Math.floor(rest / 1000) % 60);
        };
        tick();
        setInterval(tick, 1000);
    }

    // ── Price calculator (Google Ads page) ───────────────────────
    // Prices: offer until 01.03.2027 (79 €/h), regular afterwards (99 €/h). Change them here and in preise.html.
    var calc = $('#ads-calc');
    if (calc) {
        var EN = document.documentElement.lang === 'en';
        var AB = EN ? 'from ' : 'ab ';
        var TIERS = {
            S: { name: EN ? 'Package S' : 'Paket S', hours: EN ? '5 hours' : '5 Stunden', fee: 395, regular: 500, ab: '' },
            M: { name: EN ? 'Package M' : 'Paket M', hours: EN ? '10 hours' : '10 Stunden', fee: 790, regular: 990, ab: '' },
            L: { name: EN ? 'Package L' : 'Paket L', hours: EN ? 'from 12 hours' : 'ab 12 Stunden', fee: 950, regular: 1190, ab: AB }
        };
        var NOTES = EN
            ? ['From €2,000 in ad budget Package L applies. We agree the exact scope together.',
               'Between €1,000 and €2,000 in ad budget Package M applies.',
               'Up to €1,000 in ad budget you choose between S and M yourself.']
            : ['Ab 2.000 € Werbebudget gilt Paket L. Den genauen Umfang legen wir gemeinsam fest.',
               'Zwischen 1.000 und 2.000 € Werbebudget gilt Paket M.',
               'Bis 1.000 € Werbebudget wählst du selbst zwischen S und M.'];
        var AUDIT = 390;
        var range = $('#ads-budget', calc), auditBox = $('#ads-audit', calc), pkBtns = $$('[data-pk]', calc);
        var choice = 'S';
        var eur = function (n) { return EN ? '€' + n.toLocaleString('en-GB') : n.toLocaleString('de-DE') + ' €'; };
        var set = function (name, text) { $$('[data-calc="' + name + '"]', calc).forEach(function (el) { el.textContent = text; }); };
        var render = function () {
            var budget = Number(range.value), audit = auditBox.checked;
            var big = budget > 2000, mid = !big && budget > 1000;
            var key = big ? 'L' : (mid ? 'M' : choice);
            var t = TIERS[key], auditCost = audit ? AUDIT : 0;
            pkBtns.forEach(function (b) {
                var k = b.dataset.pk;
                b.disabled = big ? k !== 'L' : (k === 'L' || (mid && k === 'S'));
                b.setAttribute('aria-pressed', k === key ? 'true' : 'false');
            });
            set('pkNote', NOTES[big ? 0 : (mid ? 1 : 2)]);
            set('budgetFmt', eur(budget));
            set('tierFmt', t.name + ', ' + t.hours);
            set('feeFmt', t.ab + eur(t.fee));
            set('auditFmt', audit ? AB + eur(AUDIT) : eur(0));
            set('firstFmt', (t.ab || audit ? AB : '') + eur(t.fee + budget + auditCost));
            set('nextFmt', t.ab + eur(t.fee + budget));
            set('regularFmt', t.ab + eur(t.regular));
        };
        range.addEventListener('input', render);
        auditBox.addEventListener('change', render);
        pkBtns.forEach(function (b) { b.addEventListener('click', function () { if (b.dataset.pk !== 'L') choice = b.dataset.pk; render(); }); });
        render();
    }

    // ── Hero video: starts muted; the button switches sound on and off ──
    var video = $('#hero-video'), soundBtn = $('#video-sound');
    if (video) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { video.removeAttribute('autoplay'); video.pause(); video.controls = true; }
        if (soundBtn) {
            soundBtn.addEventListener('click', function () {
                video.muted = !video.muted;
                if (!video.muted) { video.currentTime = 0; video.play(); }
                soundBtn.setAttribute('aria-pressed', video.muted ? 'false' : 'true');
                var en = document.documentElement.lang === 'en';
                soundBtn.textContent = video.muted ? (en ? 'Sound on' : 'Ton an') : (en ? 'Sound off' : 'Ton aus');
            });
        }
    }
})();
