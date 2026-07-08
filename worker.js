/**
 * Cloudflare Worker — handles the one dynamic route on the site:
 * POST /api/subscribe  ->  adds the email to Kit (ConvertKit) and redirects to /guide
 *
 * Secrets/config (set in Cloudflare dashboard, never in code):
 *   KIT_API_SECRET  (secret)  — Kit account API secret
 *   KIT_TAG_ID      (var)     — Kit tag to subscribe emails to
 * All other requests fall through to the static assets automatically.
 */
import { EmailMessage } from "cloudflare:email";

function mimeEncode(subject, fromAddr, toAddr, replyTo, body) {
  const boundary = 'gc' + Date.now();
  return [
    `From: GarnishmentCalc Contact Form <${fromAddr}>`,
    `To: <${toAddr}>`,
    `Reply-To: <${replyTo}>`,
    `Subject: ${subject.replace(/[\r\n]/g, ' ').slice(0, 150)}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    body,
  ].join('\r\n');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/subscribe' && request.method === 'POST') {
      let email = '';
      let honeypotted = false;
      try {
        const form = await request.formData();
        honeypotted = String(form.get('company_website') || '').trim() !== '';
        email = String(form.get('email_address') || form.get('email') || '').trim().toLowerCase();
      } catch (err) { /* malformed body -> fall through to redirect */ }
      if (honeypotted) return new Response(null, { status: 303, headers: { Location: `${url.origin}/guide` } });

      if (email && email.includes('@') && env.KIT_API_SECRET && env.KIT_TAG_ID) {
        try {
          await fetch(`https://api.convertkit.com/v3/tags/${env.KIT_TAG_ID}/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_secret: env.KIT_API_SECRET, email }),
          });
        } catch (err) { /* Kit unreachable -> still show the guide */ }
      }
      // Always send the visitor to the guide page (matches previous site behavior)
      return new Response(null, { status: 303, headers: { Location: `${url.origin}/guide` } });
    }

    if (url.pathname === '/api/contact' && request.method === 'POST') {
      let ok = false;
      try {
        const form = await request.formData();
        // Honeypot: real users never see this field; bots fill it. Pretend success, send nothing.
        if (String(form.get('company_website') || '').trim() !== '') {
          return new Response('<!doctype html><p>Message sent.</p>', { status: 200, headers: { 'Content-Type': 'text/html' } });
        }
        const name = String(form.get('name') || '').slice(0, 120);
        const email = String(form.get('email') || '').slice(0, 200);
        const subject = String(form.get('subject') || 'Contact form message').slice(0, 150);
        const message = String(form.get('message') || '').slice(0, 5000);
        if (name && email.includes('@') && message && env.CONTACT_EMAIL) {
          const body = `New message from the GarnishmentCalculator.com contact form\r\n\r\nName: ${name}\r\nEmail: ${email}\r\n\r\n${message}`;
          const raw = mimeEncode(`[GC Contact] ${subject}`, 'contact@garnishmentcalculator.com', env.CONTACT_DESTINATION, email, body);
          await env.CONTACT_EMAIL.send(new EmailMessage('contact@garnishmentcalculator.com', env.CONTACT_DESTINATION, raw));
          ok = true;
        }
      } catch (err) { /* fall through to the response below */ }
      const back = ok
        ? '<h1 style="font-family:system-ui;color:#0f766e">Message sent</h1><p style="font-family:system-ui">Thanks — your message is on its way. We usually reply within 1–2 business days.</p>'
        : '<h1 style="font-family:system-ui;color:#b45309">Something went wrong</h1><p style="font-family:system-ui">Your message could not be sent. Please email us directly at contact@garnishmentcalculator.com.</p>';
      return new Response(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Contact — Garnishment Calculator</title></head><body style="max-width:600px;margin:60px auto;padding:0 20px">${back}<p style="font-family:system-ui"><a href="/" style="color:#1d4ed8">&larr; Back to Garnishment Calculator</a></p></body></html>`,
        { status: ok ? 200 : 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    return new Response('Not found', { status: 404 });
  },
};
