// Run: node test/contact.test.js   (no dependencies, no network: fetch is stubbed)
const assert = require('assert');
process.env.RESEND_API_KEY = 'test_key';
const handler = require('../api/contact.js');

function run(req) {
  return new Promise((resolve) => {
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(b) { this.body = b; resolve(this); return this; } };
    handler(req, res);
  });
}
const good = { name: 'Asha Rao', phone: '+91 98765 43210', message: 'Hi Shalinee, I would like to talk about a product role.', website: '' };
let sent = null;
global.fetch = async (url, opts) => { sent = { url, opts }; return { ok: true, text: async () => '' }; };

(async () => {
  let r = await run({ method: 'GET', headers: {} });
  assert.strictEqual(r.code, 405);

  r = await run({ method: 'POST', headers: { 'x-forwarded-for': '1.1.1.1' }, body: { ...good, name: 'A' } });
  assert.strictEqual(r.code, 400);

  r = await run({ method: 'POST', headers: { 'x-forwarded-for': '1.1.1.2' }, body: { ...good, phone: 'abc' } });
  assert.strictEqual(r.code, 400);

  sent = null;
  r = await run({ method: 'POST', headers: { 'x-forwarded-for': '1.1.1.3' }, body: { ...good, website: 'http://spam' } });
  assert.strictEqual(r.code, 200); assert.strictEqual(sent, null, 'honeypot must not send an email');

  r = await run({ method: 'POST', headers: { 'x-forwarded-for': '1.1.1.4' }, body: { ...good, message: 'x <script>alert(1)</script> hello there' } });
  assert.strictEqual(r.code, 200); assert.strictEqual(r.body.ok, true);
  const payload = JSON.parse(sent.opts.body);
  assert.deepStrictEqual(payload.to, ['shalineekt@gmail.com']);
  assert.ok(sent.opts.headers.Authorization === 'Bearer test_key');
  assert.ok(!payload.html.includes('<script>'), 'HTML must be escaped');

  global.fetch = async () => ({ ok: false, status: 500, text: async () => 'boom' });
  r = await run({ method: 'POST', headers: { 'x-forwarded-for': '1.1.1.5' }, body: good });
  assert.strictEqual(r.code, 502);

  for (let i = 0; i < 6; i++) r = await run({ method: 'POST', headers: { 'x-forwarded-for': '9.9.9.9' }, body: good });
  assert.strictEqual(r.code, 429);
  console.log('All contact-form tests passed');
})().catch((e) => { console.error(e); process.exit(1); });
