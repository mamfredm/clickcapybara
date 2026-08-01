// Shared contact form handler (source page comes from data-source on the form)
// ── Contact form → Google Sheets + GA4 ──────────────────────
    const LEADS_URL = 'https://script.google.com/macros/s/AKfycbzRDSEtJSwNLDQnVPTfOcN08K2_BF9wRNQZ5OO4GEcPduuABNkl5GOLKqmB3UjUUDCX/exec';

    function submitToSheet(formEl, sourcePage) {
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

            formEl.style.opacity = '0';
            formEl.style.pointerEvents = 'none';
            const success = document.getElementById('form-success');
            if (success) { success.style.opacity = '1'; success.style.pointerEvents = 'all'; }
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
