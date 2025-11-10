============================================================
## queuectl — Background Job Queue CLI (Node.js + SQLite) ##
============================================================

A CLI-based background job queue system built using Node.js, Commander.js, and SQLite.  
Supports multiple workers, retries with exponential backoff, and a Dead Letter Queue (DLQ).  
Jobs persist across restarts, and duplicate processing is prevented using atomic SQL updates.

------------------------------------------------------------
# 1️. SETUP INSTRUCTIONS
------------------------------------------------------------

# Clone and install
git clone https://github.com/arunmishra136/QueueCTL.git
cd queuectl
npm install

# (Optional) Link globally
npm link
# Now you can run commands directly with:
queuectl --help
# or use:
node bin/queuectl.js <command>

------------------------------------------------------------
# 2️. USAGE EXAMPLES
------------------------------------------------------------

# Enqueue jobs
queuectl enqueue "{\"id\":\"job1\",\"command\":\"echo Hello\"}"
queuectl enqueue "{\"id\":\"job2\",\"command\":\"timeout /T 2\"}"

# Start and stop workers
queuectl worker:start --count 3
queuectl worker:stop

# Check job status
queuectl status

# List jobs
queuectl list --state pending
queuectl list --state completed

# Dead Letter Queue (DLQ)
queuectl dlq:list
queuectl dlq:retry job3

# Configuration
queuectl config:get
queuectl config:set max_retries 5

------------------------------------------------------------
# 3️. ARCHITECTURE OVERVIEW
------------------------------------------------------------

• Jobs are stored in a local SQLite database with fields:
  id, command, state, attempts, max_retries, created_at, updated_at.

• Job lifecycle:
  pending → processing → completed / failed → dead (DLQ).

• Workers:
  - Execute shell commands using Node’s child_process.exec.
  - Update job state atomically (no duplicates).
  - Retry failed jobs with exponential backoff: delay = base ^ attempts.
  - Move jobs to DLQ after retries exhausted.

• DLQ:
  - Stores permanently failed jobs.
  - Retry them manually via CLI.

• Persistence:
  - SQLite ensures all jobs persist across restarts.
  - Atomic SQL updates prevent race conditions.

------------------------------------------------------------
# 4️. ASSUMPTIONS & TRADE-OFFS
------------------------------------------------------------

| Area             | Decision / Simplification |
|------------------|---------------------------|
| Database         | SQLite for simplicity and durability |
| Job Locking      | Atomic SQL (UPDATE ... RETURNING) |
| Retry Strategy   | Exponential backoff (base ^ attempts) |
| DLQ Storage      | Separate table for clarity |
| Command Handling | Executes system shell commands |
| OS Limitation    | Uses Windows-safe commands like `timeout /T` |
| Skipped Feature  | Scheduled jobs (`run_at`) — optional bonus |

------------------------------------------------------------
# 5️. TESTING INSTRUCTIONS
------------------------------------------------------------

# Start fresh
rm -f jobs.db

# Add jobs
queuectl enqueue "{\"id\":\"jobA\",\"command\":\"echo Hi\"}"
queuectl enqueue "{\"id\":\"jobB\",\"command\":\"timeout /T 2\"}"
queuectl enqueue "{\"id\":\"jobC\",\"command\":\"badcmd\"}"

# Start workers
queuectl worker:start --count 3

# Expected output:
#  Starting 3 worker(s)...
# Worker 1 picked job: jobA
#  Job jobA completed
# Worker 2 picked job: jobB
#  Job jobB completed
#  Job jobC failed (3 attempts)
#  Job jobC moved to DLQ

# Check results
queuectl status
queuectl dlq:list

# Verify DLQ retry
queuectl dlq:retry jobC
queuectl list --state pending

------------------------------------------------------------
# FUTURE ENHANCEMENTS
------------------------------------------------------------
- Scheduled / delayed jobs (run_at)
- Job timeout cancellation
- Output logging
- Job priority levels
- Simple web dashboard

