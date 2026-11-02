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
        if (btn) { btn.disabled = true; btn.textContent = '...'; }

        fetch(LEADS_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(data)
        })
        .then(() => {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event: 'generate_lead',
                form_location: sourcePage,
                service_selected: data.service
            });

            showSuccess(formEl);
        })
        .catch(() => {
            if (btn) { btn.disabled = false; btn.textContent = lang === 'de' ? 'Nachricht senden - kostenlos' : "Send - it's free"; }
            alert(lang === 'de' ? 'Fehler — bitte schreib direkt an hello@click-capybara.com' : 'Something went wrong — please email hello@click-capybara.com');
        });
    }

    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            submitToSheet(form, form.dataset.source || document.title);
        });
    }
