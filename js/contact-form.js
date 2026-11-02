// Shared contact form handler (source page comes from data-source on the form)
// ── Contact form → Google Sheets + GA4 ──────────────────────
    const LEADS_URL = 'https://script.google.com/macros/s/AKfycbzRDSEtJSwNLDQnVPTfOcN08K2_BF9wRNQZ5OO4GEcPduuABNkl5GOLKqmB3UjUUDCX/exec';

    const formLoadedAt = Date.now();

    function showSuccess(formEl) {
        formEl.style.opacity = '0';
        formEl.style.pointerEvents = 'none';
        const success = document.getElementById('form-success');
        if (success) { success.style.opacity = '1'; success.style.pointerEvents = 'all'; }
    }

    // Spam protection: filled honeypot or an impossibly fast submit = bot.
    // Bots get the normal success screen, but nothing is sent and no GA4 lead is counted.
    function looksLikeBot(formEl) {
        const trap = formEl.querySelector('[name="contact_url"]');
        if (trap && trap.value.trim() !== '') return true;
        return Date.now() - formLoadedAt < 1500;
    }

    // ── "Slice" loader: replaces the submit button while the request is running ──
    const LOADER_CSS = '.cc-loader{position:relative;display:block;width:calc(100% - 4px);height:56px;margin:0 4px 4px 0;border:2px solid #111827;border-radius:12px;background:#fcba02;box-shadow:4px 4px 0 #111827;overflow:hidden;isolation:isolate}'
        + '.cc-loader .t,.cc-loader .cut{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;letter-spacing:.22em;text-indent:.22em;text-transform:uppercase;white-space:nowrap;color:#111827;animation:1.8s cubic-bezier(.65,0,.35,1) infinite}'
        + '.cc-loader .top{animation-name:cc-top}.cc-loader .bot{animation-name:cc-bot}.cc-loader .cut{background:#111827;animation-name:cc-cut}'
        + '@keyframes cc-top{0%,10%{clip-path:polygon(0 0,100% 0,100% 50%,0 50%);transform:none}38%{clip-path:polygon(0 0,100% 0,100% 30%,0 70%);transform:translateX(-7%) skewX(-10deg)}62%{clip-path:polygon(0 0,100% 0,100% 70%,0 30%);transform:translateX(7%) skewX(10deg)}90%,100%{clip-path:polygon(0 0,100% 0,100% 50%,0 50%);transform:none}}'
        + '@keyframes cc-bot{0%,10%{clip-path:polygon(0 50%,100% 50%,100% 100%,0 100%);transform:none}38%{clip-path:polygon(0 70%,100% 30%,100% 100%,0 100%);transform:translateX(7%) skewX(-10deg)}62%{clip-path:polygon(0 30%,100% 70%,100% 100%,0 100%);transform:translateX(-7%) skewX(10deg)}90%,100%{clip-path:polygon(0 50%,100% 50%,100% 100%,0 100%);transform:none}}'
        + '@keyframes cc-cut{0%,10%{clip-path:polygon(0 50%,100% 50%,100% 50%,0 50%)}38%{clip-path:polygon(0 69%,100% 29%,100% 32%,0 72%)}62%{clip-path:polygon(0 29%,100% 69%,100% 72%,0 32%)}90%,100%{clip-path:polygon(0 50%,100% 50%,100% 50%,0 50%)}}'
        + '.cc-loader .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}'
        + '@media (prefers-reduced-motion:reduce){.cc-loader .t,.cc-loader .cut{animation:none}.cc-loader .top{clip-path:none}.cc-loader .bot,.cc-loader .cut{display:none}}'
        + '.cc-form-error{margin:12px 0 0;font-size:14px;line-height:1.5;color:#b91c1c}.cc-form-error a{color:inherit;text-decoration:underline}';
    const MIN_LOADER_MS = 900;   // long enough to show one full "slice" so it never just flashes

    function showLoader(btn, lang) {
        if (!document.getElementById('cc-loader-css')) {
            const st = document.createElement('style');
            st.id = 'cc-loader-css';
            st.textContent = LOADER_CSS;
            document.head.appendChild(st);
        }
        const word = lang === 'de' ? 'Sende…' : 'Sending…';
        const el = document.createElement('div');
        el.className = 'cc-loader';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.innerHTML = '<span class="sr">' + (lang === 'de' ? 'Wird gesendet …' : 'Sending …') + '</span>'
            + '<span class="t top" aria-hidden="true">' + word + '</span>'
            + '<span class="t bot" aria-hidden="true">' + word + '</span>'
            + '<span class="cut" aria-hidden="true"></span>';
        btn.style.display = 'none';
        btn.insertAdjacentElement('afterend', el);
        return el;
    }

    function showError(formEl, btn, loader, lang) {
        if (loader) loader.remove();
        if (btn) { btn.style.display = ''; btn.disabled = false; }
        let msg = formEl.querySelector('.cc-form-error');
        if (!msg) {
            msg = document.createElement('p');
            msg.className = 'cc-form-error';
            msg.setAttribute('role', 'alert');
            (btn || formEl).insertAdjacentElement(btn ? 'afterend' : 'beforeend', msg);
        }
        msg.innerHTML = lang === 'de'
            ? 'Das hat leider nicht geklappt. Bitte versuch es noch einmal oder schreib direkt an <a href="mailto:hello@click-capybara.com">hello@click-capybara.com</a>.'
            : 'That didn\'t go through. Please try again or email <a href="mailto:hello@click-capybara.com">hello@click-capybara.com</a> directly.';
    }

    function submitToSheet(formEl, sourcePage) {
        if (looksLikeBot(formEl)) { showSuccess(formEl); return; }
        const lang = document.documentElement.lang || 'en';
        const data = {
            name:      formEl.querySelector('[name="name"]')?.value      || '',
            email:     formEl.querySelector('[name="email"]')?.value     || '',
            website:   formEl.querySelector('[name="website"]')?.value   || '',
            challenge: formEl.querySelector('[name="challenge"]')?.value || '',
            service:   formEl.querySelector('[name="service"]')?.value   || '',
            source:    sourcePage,
            lang:      lang
        };

        const btn = formEl.querySelector('button[type="submit"]');
        const prevErr = formEl.querySelector('.cc-form-error');
        if (prevErr) prevErr.remove();
        if (btn) btn.disabled = true;
        const loader = btn ? showLoader(btn, lang) : null;
        const started = Date.now();
        const minWait = () => new Promise(r => setTimeout(r, Math.max(0, MIN_LOADER_MS - (Date.now() - started))));

        fetch(LEADS_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(data)
        })
        .then(minWait)
        .then(() => {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event: 'generate_lead',
                form_location: sourcePage,
                service_selected: data.service
            });

            showSuccess(formEl);
        })
        .catch(() => showError(formEl, btn, loader, lang));
    }

    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            submitToSheet(form, form.dataset.source || document.title);
        });
    }
