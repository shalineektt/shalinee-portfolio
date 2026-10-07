// Vercel serverless function: POST /api/contact
// Receives { name, phone, message, website } from the portfolio form and emails it
// to CONTACT_TO (default: shalineekt@gmail.com) through Resend.
//
// Environment variables (set in Vercel > Project > Settings > Environment Variables):
//   RESEND_API_KEY  required  API key from resend.com
//   CONTACT_TO      optional  where messages go (default shalineekt@gmail.com)
//   CONTACT_FROM    optional  sender shown in your inbox (default onboarding@resend.dev)

const TO = process.env.CONTACT_TO || 'shalineekt@gmail.com';
const FROM = process.env.CONTACT_FROM || 'Portfolio <onboarding@resend.dev>';

// Best-effort limit per server instance: 5 messages per IP per hour.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function validate(body) {
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const message = String(body.message || '').trim();
  if (name.length < 2 || name.length > 80) return { error: 'Please enter your name.' };
  if (!/^[0-9+()\-\s]{7,20}$/.test(phone) || phone.replace(/\D/g, '').length < 7)
    return { error: 'Please enter a valid phone number.' };
  if (message.length < 10 || message.length > 2000)
    return { error: 'Please write a short message (10 to 2000 characters).' };
  return { name, phone, message };
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Honeypot: real visitors never fill this hidden field. Pretend success to bots.
  if (body.website) return res.status(200).json({ ok: true });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return res.status(429).json({ ok: false, error: 'Too many messages. Please try again later.' });

  const v = validate(body);
  if (v.error) return res.status(400).json({ ok: false, error: v.error });

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return res.status(500).json({ ok: false, error: 'Email is not configured yet.' });
  }

  const text = `New message from your portfolio\n\nName: ${v.name}\nPhone: ${v.phone}\n\n${v.message}\n`;
  const html =
    `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#111">` +
    `<p><strong>New message from your portfolio</strong></p>` +
    `<p><strong>Name:</strong> ${esc(v.name)}<br><strong>Phone:</strong> ${esc(v.phone)}</p>` +
    `<p style="white-space:pre-wrap">${esc(v.message)}</p></div>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [TO], subject: `Portfolio message from ${v.name}`, text, html }),
    });
    if (!r.ok) {
      console.error('Resend error', r.status, await r.text());
      return res.status(502).json({ ok: false, error: 'Could not send your message. Please try again.' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Send failed', e);
    return res.status(502).json({ ok: false, error: 'Could not send your message. Please try again.' });
  }
};

module.exports.validate = validate;
