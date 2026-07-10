/*
Backfill missing `domain` and `slug` fields for blogs in Firestore.

Usage:
1) Install deps: `npm install firebase-admin`
2) Provide credentials via one of:
   - Set `GOOGLE_APPLICATION_CREDENTIALS` env var pointing to a service account JSON file, OR
   - Set `SERVICE_ACCOUNT_JSON` env var containing the JSON text (not recommended for large values).
3) Run: `node scripts/backfill-domains.js`

This script is idempotent and uses `merge: true` to avoid overwriting existing fields.
*/

const admin = require('firebase-admin');
const fs = require('fs');

const ROOT = process.env.ROOT_PUBLIC_DOMAIN || 'gameoffortunes.com';

function initAdmin() {
  // Prefer Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS).
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
    return;
  }

  // Alternatively, accept raw JSON via SERVICE_ACCOUNT_JSON
  if (process.env.SERVICE_ACCOUNT_JSON) {
    const json = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
    admin.initializeApp({ credential: admin.credential.cert(json) });
    return;
  }

  console.error('No credentials found. Set GOOGLE_APPLICATION_CREDENTIALS or SERVICE_ACCOUNT_JSON.');
  process.exit(1);
}

async function run() {
  initAdmin();
  const db = admin.firestore();
  console.log('Backfilling blogs collection with root domain:', ROOT);

  const snap = await db.collection('blogs').get();
  if (snap.empty) {
    console.log('No blog documents found.');
    return;
  }

  let updated = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const needsDomain = !data.domain;
    const needsSlug = !data.slug;
    if (!needsDomain && !needsSlug) continue;

    const slug = (data.slug && String(data.slug).trim()) || doc.id;
    const domain = `${slug}.${ROOT}`;

    console.log(`Updating ${doc.id}: slug -> ${slug}, domain -> ${domain}`);
    await doc.ref.set({ slug, domain }, { merge: true });
    updated += 1;
  }

  console.log(`Done. Updated ${updated} blog(s).`);
}

run().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
