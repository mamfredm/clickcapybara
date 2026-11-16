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
            // After a tap, bring the chosen panel into view when the list is stacked above it (phones) and it sits mostly below the fold
            if (fromUser) {
                var panel = panels.filter(function (p) { return p.dataset.panel === key; })[0];
                var stacked = panel && panel.getBoundingClientRect().top >= tabs[tabs.length - 1].getBoundingClientRect().bottom - 1;
                if (stacked && panel.getBoundingClientRect().top > window.innerHeight * 0.55) {
                    var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                    panel.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
                }
            }
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
        // The video file is only fetched after the page has loaded, so it does not compete with text and fonts on phones.
        var calmVideo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var startVideo = function () {
            if (!video.getAttribute('src') && video.dataset.src) { video.preload = 'auto'; video.src = video.dataset.src; }
            if (calmVideo) { video.controls = true; return; }
            var p = video.play(); if (p && p.catch) p.catch(function () {});
        };
        if (document.readyState === 'complete') setTimeout(startVideo, 300); else window.addEventListener('load', function () { setTimeout(startVideo, 300); });
        if (soundBtn) {
            soundBtn.addEventListener('click', function () {
                video.muted = !video.muted;
                if (!video.muted) { if (!video.getAttribute('src')) startVideo(); video.currentTime = 0; var pp = video.play(); if (pp && pp.catch) pp.catch(function () {}); }
                soundBtn.setAttribute('aria-pressed', video.muted ? 'false' : 'true');
                var en = document.documentElement.lang === 'en';
                soundBtn.textContent = video.muted ? (en ? 'Sound on' : 'Ton an') : (en ? 'Sound off' : 'Ton aus');
            });
        }
    }
    // ── Contribution-margin calculator (Google Ads cost page) ──
    var dbc = $('#db-calc');
    if (dbc) {
        var EN2 = document.documentElement.lang === 'en';
        var loc = EN2 ? 'en-GB' : 'de-DE';
        var money = function (n) {
            var d = Math.abs(n) < 100 ? 2 : 0;
            var s = Math.abs(n).toLocaleString(loc, { minimumFractionDigits: d, maximumFractionDigits: d });
            return (n < 0 ? '−' : '') + (EN2 ? '€' + s : s + ' €');
        };
        var num = function (n, d) { return n.toLocaleString(loc, { minimumFractionDigits: d, maximumFractionDigits: d }); };
        var val = function (id) { var v = parseFloat(String($('#' + id).value).replace(',', '.')); return isFinite(v) && v > 0 ? v : 0; };
        var EXAMPLES = { shop: { price: 120, 'var': 70, cr: 2, close: 30, cpc: 0.7, budget: 1000 }, lead: { price: 1500, 'var': 600, cr: 4, close: 30, cpc: 2.5, budget: 1000 } };
        var FEES = [{ max: 1000, name: EN2 ? 'Package S' : 'Paket S', fee: 395, from: false }, { max: 2000, name: EN2 ? 'Package M' : 'Paket M', fee: 790, from: false }, { max: Infinity, name: EN2 ? 'Package L' : 'Paket L', fee: 950, from: true }];
        var TXT = EN2 ? {
            noMargin: 'Your contribution margin is zero or negative. Advertising will not fix that.',
            noData: 'Enter a conversion rate and a click price to see the result.',
            good: function (d) { return 'Your click price is ' + d + ' below the maximum. That works out.'; },
            even: 'Your click price is right at the maximum. You break even.',
            bad: function (d) { return 'Your click price is ' + d + ' above the maximum. Each order costs more than it brings in.'; },
            feeBad: 'The ads pay for themselves, but not for the management fee at this budget.',
            fee: function (n, from) { return 'Management, ' + n + (from ? ' (from)' : ''); },
            summary: function (o) { return 'From the calculator (' + o.mode + '): order value ' + o.price + ', variable costs ' + o.vc + ', conversion rate ' + o.cr + ' %' + o.close + ', click price ' + o.cpc + ', monthly budget ' + o.budget + '. Max. click price ' + o.maxCpc + ', break-even ROAS ' + o.roas + '.'; },
            modes: { shop: 'shop', lead: 'service' }, close: function (v) { return ', close rate ' + v + ' %'; }
        } : {
            noMargin: 'Dein Deckungsbeitrag ist null oder negativ. Daran ändert Werbung nichts.',
            noData: 'Trag Conversion-Rate und Klickpreis ein, um das Ergebnis zu sehen.',
            good: function (d) { return 'Dein Klickpreis liegt ' + d + ' unter dem Maximum. Das rechnet sich.'; },
            even: 'Dein Klickpreis liegt genau am Maximum. Du kommst bei null heraus.',
            bad: function (d) { return 'Dein Klickpreis liegt ' + d + ' über dem Maximum. Jeder Auftrag kostet mehr, als er einbringt.'; },
            feeBad: 'Die Anzeigen tragen sich, die Betreuung bei diesem Budget aber noch nicht.',
            fee: function (n, from) { return 'Betreuung, ' + n + (from ? ' (ab)' : ''); },
            summary: function (o) { return 'Aus dem Rechner (' + o.mode + '): Auftragswert ' + o.price + ', variable Kosten ' + o.vc + ', Conversion-Rate ' + o.cr + ' %' + o.close + ', Klickpreis ' + o.cpc + ', Budget im Monat ' + o.budget + '. Max. Klickpreis ' + o.maxCpc + ', Break-even-ROAS ' + o.roas + '.'; },
            modes: { shop: 'Shop', lead: 'Dienstleistung' }, close: function (v) { return ', Abschlussquote ' + v + ' %'; }
        };
        var mode = 'shop', touched = false, last = null;
        var put = function (k, v) { $$('[data-db="' + k + '"]', dbc).forEach(function (n) { n.textContent = v; }); };
        var fill = function (m) { var e = EXAMPLES[m]; $('#db-price').value = e.price; $('#db-var').value = e['var']; $('#db-cr').value = e.cr; $('#db-close').value = e.close; $('#db-cpc').value = e.cpc; $('#db-budget').value = e.budget; };
        function calcDb() {
            var price = val('db-price'), vc = val('db-var'), cr = val('db-cr') / 100, close = mode === 'lead' ? val('db-close') / 100 : 1;
            var cpc = val('db-cpc'), budget = val('db-budget'), withFee = $('#db-fee').checked;
            var db = price - vc, rate = cr * close, maxCpc = db * rate;
            var tier = FEES.filter(function (f) { return budget <= f.max; })[0], fee = withFee ? tier.fee : 0;
            var clicks = cpc > 0 ? budget / cpc : 0, orders = clicks * rate;
            var revenue = orders * price, dbTotal = orders * db, profit = dbTotal - budget - fee;
            var ok = db > 0 && rate > 0 && cpc > 0;
            put('db', money(db));
            put('maxCpa', db > 0 ? money(db) : '—');
            put('maxCpc', db > 0 && rate > 0 ? money(maxCpc) : '—');
            var roas = db > 0 ? num(price / db * 100, 0) + ' %' : '—';
            put('roas', roas);
            put('clicks', ok ? num(Math.round(clicks), 0) : '—');
            put('orders', ok ? num(orders, 1) : '—');
            put('cpa', ok && orders > 0 ? money(budget / orders) : '—');
            put('revenue', ok ? money(revenue) : '—');
            put('dbTotal', ok ? money(dbTotal) : '—');
            put('adCost', '−' + money(budget).replace('−', ''));
            $('[data-db-feerow]', dbc).hidden = !withFee;
            put('feeLabel', TXT.fee(tier.name, tier.from)); put('feeCost', '−' + money(fee));
            put('profit', ok ? money(profit) : '—');
            var v = $('[data-db="verdict"]', dbc), pr = $('[data-db="profit"]', dbc), cls = 'db-verdict';
            pr.className = 'db-rv' + (ok ? (profit >= 0 ? ' db-ok' : ' db-err') : '');
            if (db <= 0) { v.textContent = TXT.noMargin; cls += ' db-err'; }
            else if (!ok) { v.textContent = TXT.noData; }
            else if (Math.abs(cpc - maxCpc) < 0.005) { v.textContent = TXT.even; cls += ' db-warn'; }
            else if (cpc < maxCpc) { if (withFee && profit < 0) { v.textContent = TXT.feeBad; cls += ' db-warn'; } else { v.textContent = TXT.good(money(maxCpc - cpc)); cls += ' db-ok'; } }
            else { v.textContent = TXT.bad(money(cpc - maxCpc)); cls += ' db-err'; }
            v.className = cls;
            last = { mode: TXT.modes[mode], price: money(price), vc: money(vc), cr: num(cr * 100, 1), close: mode === 'lead' ? TXT.close(num(close * 100, 0)) : '', cpc: money(cpc), budget: money(budget), maxCpc: db > 0 && rate > 0 ? money(maxCpc) : '—', roas: roas };
        }
        $$('input', dbc).forEach(function (i) { i.addEventListener('input', function () { if (i.type === 'number') touched = true; calcDb(); }); });
        $$('[data-db-mode]', dbc).forEach(function (b) {
            b.addEventListener('click', function () {
                mode = b.dataset.dbMode;
                $$('[data-db-mode]', dbc).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
                $$('[data-db-only]', dbc).forEach(function (n) { n.hidden = n.dataset.dbOnly !== mode; });
                var crLabel = $('#db-cr').closest('.db-field');
                if (crLabel) $('.db-label', crLabel).textContent = mode === 'lead' ? (EN2 ? 'Enquiries per 100 clicks' : 'Anfragen je 100 Klicks') : (EN2 ? 'Conversion rate' : 'Conversion-Rate');
                if (!touched) fill(mode);
                calcDb();
            });
        });
        // "Ask with these numbers": copy the figures into the contact form, unless the visitor already wrote something
        var dbCta = $('#db-cta');
        if (dbCta) dbCta.addEventListener('click', function () {
            var ta = $('#contact-form [name="challenge"]');
            if (ta && last && (!ta.value.trim() || ta.dataset.fromCalc)) { ta.value = TXT.summary(last); ta.dataset.fromCalc = '1'; }
        });
        calcDb();
    }
    // ── Small comparison calculators (Local Hero Kit, automation) ──
    $$('[data-mini-calc]').forEach(function (box) {
        var en = document.documentElement.lang === 'en', loc = en ? 'en-GB' : 'de-DE';
        var eur = function (n) { var s = Math.round(Math.abs(n)).toLocaleString(loc); return (n < 0 ? '−' : '') + (en ? '€' + s : s + ' €'); };
        var put = function (k, v) { $$('[data-mc="' + k + '"]', box).forEach(function (n) { n.textContent = v; }); };
        var verdict = function (text, cls) { var v = $('[data-mc="verdict"]', box); v.textContent = text; v.className = 'db-verdict ' + cls; };
        var run;
        if (box.dataset.miniCalc === 'lhk') {
            var KIT = 1150, RUN = 2;
            run = function () {
                var m = parseFloat($('#lhk-monthly').value), y = parseInt($('#lhk-years').value, 10), months = y * 12;
                var hrs = parseFloat($('#lhk-hours').value), rate = parseFloat($('#lhk-rate').value), time = hrs * rate;
                var yrs = y + (en ? (y === 1 ? ' year' : ' years') : (y === 1 ? ' Jahr' : ' Jahre'));
                $('#lhk-monthly-out').textContent = eur(m);
                $('#lhk-years-out').textContent = yrs;
                $('#lhk-hours-out').textContent = hrs + (en ? (hrs === 1 ? ' hour' : ' hours') : (hrs === 1 ? ' Stunde' : ' Stunden'));
                $('#lhk-rate-out').textContent = eur(rate);
                var abo = m * months, kit = KIT + RUN * months, diff = abo + time - kit;
                // first month in which subscription plus own time has cost more than the kit
                var even = time >= KIT ? 1 : (m > RUN ? Math.floor((KIT - time) / (m - RUN)) + 1 : null);
                put('abo', eur(abo)); put('time', eur(time)); put('kit', eur(kit)); put('diff', eur(Math.abs(diff)));
                put('even', even === 1 ? (en ? 'the first month' : 'dem ersten Monat') : (even ? (en ? 'month ' + even : 'Monat ' + even) : '—'));
                if (diff > 0) verdict(en ? 'After ' + yrs + ' the kit has saved you ' + eur(diff) + '.' : 'Nach ' + y + (y === 1 ? ' Jahr' : ' Jahren') + ' hast du mit dem Kit ' + eur(diff) + ' gespart.', 'db-ok');
                else verdict(en ? 'After ' + yrs + ' the site builder is still ' + eur(-diff) + ' cheaper.' + (even ? ' That turns from month ' + even + '.' : '') : 'Nach ' + y + (y === 1 ? ' Jahr' : ' Jahren') + ' ist der Baukasten noch ' + eur(-diff) + ' günstiger.' + (even ? ' Ab Monat ' + even + ' dreht sich das.' : ''), 'db-warn');
            };
        } else {
            var PRICE = 490;
            run = function () {
                var h = parseFloat($('#auto-hours').value), r = parseFloat($('#auto-rate').value);
                $('#auto-hours-out').textContent = h.toLocaleString(loc) + (en ? (h === 1 ? ' hour' : ' hours') : (h === 1 ? ' Stunde' : ' Stunden'));
                $('#auto-rate-out').textContent = eur(r);
                var hoursYear = h * 52, manual = hoursYear * r, weeks = Math.ceil(PRICE / (h * r));
                var wk = weeks + (en ? (weeks === 1 ? ' week' : ' weeks') : (weeks === 1 ? ' Woche' : ' Wochen'));
                put('hours', hoursYear.toLocaleString(loc)); put('manual', eur(manual));
                put('price', (en ? 'from ' : 'ab ') + eur(PRICE)); put('weeks', wk);
                if (weeks <= 26) verdict(en ? 'This task costs you ' + eur(manual) + ' a year. A workflow pays for itself after about ' + wk + '.' : 'Diese Aufgabe kostet dich ' + eur(manual) + ' im Jahr. Ein Ablauf hat sich nach rund ' + (weeks === 1 ? '1 Woche' : weeks + ' Wochen') + ' bezahlt.', 'db-ok');
                else verdict(en ? 'This task costs you ' + eur(manual) + ' a year. A workflow takes ' + wk + ' to pay for itself. Automating it is probably not worth it.' : 'Diese Aufgabe kostet dich ' + eur(manual) + ' im Jahr. Ein Ablauf braucht ' + weeks + ' Wochen, bis er sich bezahlt hat. Automatisieren lohnt sich hier eher nicht.', 'db-warn');
            };
        }
        $$('input', box).forEach(function (i) { i.addEventListener('input', run); });
        run();
    });
})();
