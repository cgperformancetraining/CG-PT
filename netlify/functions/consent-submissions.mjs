// Admin API for form submissions: photo consent forms and website enquiries.
// Pick which with ?form=consent (default) or ?form=enquiry
// Runs on Netlify automatically — no npm or build step needed.
//
// Needs two environment variables, set in the Netlify dashboard
// (Site configuration → Environment variables):
//   ADMIN_PASSWORD     – the password you type on /admin.html
//   NETLIFY_API_TOKEN  – a Netlify personal access token (User settings → Applications)

import { createHash, timingSafeEqual } from 'node:crypto';

const FORMS = { consent: 'photo-consent', enquiry: 'enquiry' };
const API = 'https://api.netlify.com/api/v1';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const sha = (s) => createHash('sha256').update(String(s)).digest();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function passwordOk(req) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const given = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  return timingSafeEqual(sha(given), sha(expected));
}

async function netlify(path, token, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  if (!res.ok) throw new Error(`Netlify API ${res.status} on ${path}`);
  return res.status === 204 ? null : res.json();
}

async function findForm(token, formName) {
  const siteId = process.env.SITE_ID;
  const forms = await netlify(siteId ? `/sites/${siteId}/forms` : '/forms', token);
  return forms.find((f) => f.name === formName && (!siteId || f.site_id === siteId));
}

async function allSubmissions(formId, token) {
  const all = [];
  for (let page = 1; page <= 50; page++) {
    const batch = await netlify(`/forms/${formId}/submissions?per_page=100&page=${page}`, token);
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

export default async (req) => {
  if (!passwordOk(req)) {
    await sleep(800); // slow down password guessing
    return json({ error: 'Incorrect password' }, 401);
  }

  const token = process.env.NETLIFY_API_TOKEN;
  if (!token) return json({ error: 'NETLIFY_API_TOKEN is not set in Netlify environment variables.' }, 500);

  const which = new URL(req.url).searchParams.get('form') || 'consent';
  const formName = FORMS[which];
  if (!formName) return json({ error: 'Unknown form' }, 400);

  try {
    const form = await findForm(token, formName);
    if (!form) return json({ submissions: [], note: 'Nothing has been submitted yet.' });

    if (req.method === 'DELETE') {
      const id = new URL(req.url).searchParams.get('id');
      if (!id || !/^[a-f0-9]+$/i.test(id)) return json({ error: 'Missing submission id' }, 400);
      // Make sure the id belongs to this form before deleting
      const subs = await allSubmissions(form.id, token);
      if (!subs.some((s) => s.id === id)) return json({ error: 'Submission not found' }, 400);
      await netlify(`/submissions/${id}`, token, { method: 'DELETE' });
      return json({ deleted: id });
    }

    if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

    const all = await allSubmissions(form.id, token);
    const submissions = all.map((s) => {
      const { ip, user_agent, referrer, 'bot-field': _b, 'form-name': _f, ...fields } = s.data || {};
      return { id: s.id, number: s.number, created_at: s.created_at, ...fields };
    });
    return json({ submissions });
  } catch (err) {
    return json({ error: err.message }, 502);
  }
};

export const config = { path: '/api/consent-submissions' };
