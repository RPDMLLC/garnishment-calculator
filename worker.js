/**
 * Cloudflare Worker — handles the one dynamic route on the site:
 * POST /api/subscribe  ->  adds the email to Kit (ConvertKit) and redirects to /guide
 *
 * Secrets/config (set in Cloudflare dashboard, never in code):
 *   KIT_API_SECRET  (secret)  — Kit account API secret
 *   KIT_TAG_ID      (var)     — Kit tag to subscribe emails to
 * All other requests fall through to the static assets automatically.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/subscribe' && request.method === 'POST') {
      let email = '';
      try {
        const form = await request.formData();
        email = String(form.get('email_address') || form.get('email') || '').trim().toLowerCase();
      } catch (err) { /* malformed body -> fall through to redirect */ }

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

    return new Response('Not found', { status: 404 });
  },
};
