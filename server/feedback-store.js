import pg from 'pg';

export const SUBMISSIONS_PER_HOUR = 5;
const PAGE_SIZE = 30;

export function createFeedbackStore(pool) {
  return {
    async submit({ id, category, message, contact, windowStart, clientKey }) {
      const client = await pool.connect();
      let releaseError;
      try {
        await client.query('BEGIN');
        // Serializa as tentativas com o mesmo identificador, inclusive entre instâncias.
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [id]);
        const existing = await client.query(
          'SELECT category, message, contact FROM feedback WHERE id = $1', [id]
        );
        const previous = existing.rows[0];
        if (previous) {
          await client.query('COMMIT');
          return previous.category === category && previous.message === message && previous.contact === contact
            ? 'duplicate' : 'conflict';
        }

        await client.query('DELETE FROM feedback_rate_limits WHERE window_start < $1', [windowStart]);
        const quota = await client.query(
          `INSERT INTO feedback_rate_limits (window_start, client_key, submissions) VALUES ($1, $2, 1)
           ON CONFLICT (window_start, client_key) DO UPDATE
           SET submissions = feedback_rate_limits.submissions + 1
           WHERE feedback_rate_limits.submissions < $3
           RETURNING submissions`, [windowStart, clientKey, SUBMISSIONS_PER_HOUR]
        );
        if (!quota.rowCount) {
          await client.query('COMMIT');
          return 'limited';
        }

        await client.query(
          'INSERT INTO feedback (id, category, message, contact) VALUES ($1, $2, $3, $4)',
          [id, category, message, contact]
        );
        await client.query('COMMIT');
        return 'saved';
      } catch (error) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          releaseError = rollbackError;
        }
        throw error;
      } finally {
        client.release(releaseError);
      }
    },

    async list({ category, status, page }) {
      const { rows } = await pool.query(
        `SELECT id, category, message, contact, status, created_at AS "createdAt"
         FROM feedback
         WHERE ($1::text IS NULL OR category = $1) AND ($2::text IS NULL OR status = $2)
         ORDER BY created_at DESC, id DESC
         LIMIT $3 OFFSET $4`, [category, status, PAGE_SIZE + 1, (page - 1) * PAGE_SIZE]
      );
      return { items: rows.slice(0, PAGE_SIZE), hasNext: rows.length > PAGE_SIZE };
    },

    async updateStatus(id, status) {
      const { rowCount } = await pool.query('UPDATE feedback SET status = $2 WHERE id = $1', [id, status]);
      return rowCount > 0;
    }
  };
}

let store;
export function getFeedbackStore() {
  if (!process.env.DATABASE_URL) return null;
  if (!store) {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      connectionTimeoutMillis: 8000,
      idleTimeoutMillis: 5000,
      query_timeout: 8000,
      allowExitOnIdle: true
    });
    pool.on('error', () => console.error('Conexão ociosa de feedback encerrada.'));
    store = createFeedbackStore(pool);
  }
  return store;
}
