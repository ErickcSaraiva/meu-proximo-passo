import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import pg from 'pg';
import { createFeedbackStore, SUBMISSIONS_PER_HOUR } from '../server/feedback-store.js';

const connectionString = process.env.FEEDBACK_TEST_DATABASE_URL;
const migration = new URL('../db/001_feedback.sql', import.meta.url);

test('PostgreSQL persiste, ordena, filtra e limita submissões concorrentes', {
  skip: !connectionString && 'Defina FEEDBACK_TEST_DATABASE_URL para um banco de testes.'
}, async () => {
  const schema = `feedback_test_${randomUUID().replaceAll('-', '')}`;
  const client = new pg.Client({ connectionString, connectionTimeoutMillis: 8000 });
  await client.connect();
  let pool;
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    pool = new pg.Pool({ connectionString, options: `-c search_path=${schema}`, connectionTimeoutMillis: 8000 });
    const ddl = await readFile(migration, 'utf8');
    await pool.query(ddl);
    await pool.query(ddl);
    const store = createFeedbackStore(pool);
    const id = randomUUID();
    const windowStart = '2026-11-24T10:00:00Z';
    const submission = {
      id, category: 'problema', message: '<strong>Exemplo de texto</strong>',
      contact: 'visitante@example.org', windowStart, clientKey: 'cliente-a'
    };

    const duplicates = await Promise.all([store.submit(submission), store.submit(submission)]);
    assert.deepEqual(duplicates.sort(), ['duplicate', 'saved']);
    assert.equal(await store.submit({ ...submission, message: 'Mensagem diferente' }), 'conflict');
    const list = (category = null, status = null, page = 1) => store.list({ category, status, page });
    const initial = (await list()).items[0];
    assert.equal(initial.id, id);
    assert.equal(initial.status, 'nova');
    assert.equal(initial.message, submission.message);
    assert.equal(initial.contact, submission.contact);
    assert.ok(initial.createdAt instanceof Date);
    await pool.query("UPDATE feedback SET created_at = now() - interval '1 hour' WHERE id = $1", [id]);

    const attempts = await Promise.all(Array.from({ length: 8 }, () =>
      store.submit({ ...submission, id: randomUUID(), category: 'outro', contact: null })
    ));
    assert.equal(attempts.filter(result => result === 'saved').length, SUBMISSIONS_PER_HOUR - 1);
    assert.equal(attempts.filter(result => result === 'limited').length, 9 - SUBMISSIONS_PER_HOUR);
    assert.equal(await store.submit(submission), 'duplicate');
    assert.equal((await list()).items.at(-1).id, id);
    assert.equal((await list('outro', 'nova')).items.length, SUBMISSIONS_PER_HOUR - 1);
    assert.equal(await store.updateStatus(id, 'em_analise'), true);
    assert.deepEqual((await list('problema', 'nova')).items, []);
    assert.equal((await list('problema', 'em_analise')).items[0].id, id);
    assert.equal(await store.updateStatus(id, 'concluida'), true);
    assert.equal((await list('problema', 'concluida')).items.length, 1);
    assert.equal(await store.updateStatus(randomUUID(), 'concluida'), false);

    assert.equal(await store.submit({ ...submission, id: randomUUID(), windowStart: '2026-11-24T11:00:00Z' }), 'saved');
    const counters = await pool.query('SELECT window_start FROM feedback_rate_limits');
    assert.equal(counters.rowCount, 1);
    assert.equal(counters.rows[0].window_start.toISOString(), '2026-11-24T11:00:00.000Z');

    await pool.query(`INSERT INTO feedback (id, category, message)
      SELECT gen_random_uuid(), 'outro', 'Mensagem de paginação' FROM generate_series(1, 31)`);
    const first = await list();
    const second = await list(null, null, 2);
    assert.equal(first.items.length, 30);
    assert.equal(first.hasNext, true);
    assert.equal(second.hasNext, false);
    assert.equal(second.items.length, 7);
    assert.equal(new Set([...first.items, ...second.items].map(item => item.id)).size, 37);
  } finally {
    await pool?.end();
    try {
      await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    } finally {
      await client.end();
    }
  }
});
