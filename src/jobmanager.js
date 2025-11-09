import db from "./db.js";
import { now } from "./utils.js";

 
export const addJob = (job) => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO jobs 
    (id, command, state, attempts, max_retries, created_at, updated_at)
    VALUES (@id, @command, 'pending', 0, COALESCE(@max_retries, 3),  @created_at, @updated_at)
  `);
  stmt.run({
    id: job.id,
    command: job.command,
    max_retries: job.max_retries ?? null,   
    created_at: now(),
    updated_at: now(),
  });
};

 
export const getPendingJob = () => {
  const stmt = db.prepare(`
    UPDATE jobs
    SET state = 'processing', updated_at = datetime('now')
    WHERE id = (
      SELECT id FROM jobs
      WHERE state = 'pending'
      ORDER BY created_at
      LIMIT 1
    )
    RETURNING *;
  `);

  const job = stmt.get();
  return job;
};

 
export const updateJobState = (id, state) =>
  db
    .prepare(`UPDATE jobs SET state=?, updated_at=? WHERE id=?`)
    .run(state, now(), id);

 
export const incrementAttempts = (id) =>
  db
    .prepare(`UPDATE jobs SET attempts = attempts + 1, updated_at=? WHERE id=?`)
    .run(now(), id);

 
export const getJobsByState = (state) =>
  db.prepare(`SELECT * FROM jobs WHERE state=?`).all(state);

 
export const moveToDLQ = (id, reason = "Max retries exceeded") => {
  const job = db.prepare(`SELECT * FROM jobs WHERE id=?`).get(id);
  if (!job) return;

 
  db.prepare(`
    INSERT OR REPLACE INTO dlq (id, command, attempts, max_retries, reason, created_at, failed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    job.id,
    job.command,
    job.attempts,
    job.max_retries,
    reason,
    job.created_at,
    now()
  );

 
  db.prepare(`DELETE FROM jobs WHERE id=?`).run(id);
};

 
export const countByState = () => {
  const jobCounts = db
    .prepare(`SELECT state, COUNT(*) as count FROM jobs GROUP BY state`)
    .all();
  
  const dlqCount = db
    .prepare(`SELECT COUNT(*) as count FROM dlq`)
    .get();

  return [
    ...jobCounts,
    { state: "dead (DLQ)", count: dlqCount.count }
  ];
};


 
export const getDLQJobs = () =>
  db.prepare(`SELECT * FROM dlq ORDER BY failed_at DESC`).all();

export const retryDLQJob = (id) => {
  const job = db.prepare(`SELECT * FROM dlq WHERE id=?`).get(id);
  if (!job) return false;

  addJob({
    id: job.id,
    command: job.command,
    max_retries: job.max_retries,
  });

  db.prepare(`DELETE FROM dlq WHERE id=?`).run(id);
  return true;
};
