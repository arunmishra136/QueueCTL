
# Queuectl — Background Job Queue CLI (Node.js + SQLite)

A **CLI-based background job queue system** built using **Node.js**, **Commander.js**, and **SQLite**.  
It supports **multiple workers**, **automatic retries with exponential backoff**, and a **Dead Letter Queue (DLQ)**.  
Jobs persist across restarts, and duplicate processing is prevented using **atomic SQL updates**.

---
# Demo Video Link : https://drive.google.com/file/d/1Lb9hxImAEc_AcjkonmKrEZ-IKN2WhLij/view?usp=sharing

#  1. Setup Instructions

###  Clone and install
```bash
git clone https://github.com/arunmishra136/QueueCTL.git
cd queuectl
npm install
```

###  (Optional) Link globally
```bash
npm link
```

Now you can run commands directly using:
```bash
queuectl --help
```
or
```bash
node bin/queuectl.js <command>
```

---

#  2. Usage Examples

###  Enqueue Jobs
```bash
queuectl enqueue "{\"id\":\"job1\",\"command\":\"echo Hello\"}"
queuectl enqueue "{\"id\":\"job2\",\"command\":\"timeout /T 2\"}"
```

###  Start / Stop Workers
```bash
queuectl worker:start --count 3
queuectl worker:stop
```

###  Check Job Status
```bash
queuectl status
```

###  List Jobs
```bash
queuectl list --state pending
queuectl list --state completed
```

###  Dead Letter Queue (DLQ)
```bash
queuectl dlq:list
queuectl dlq:retry job3
```

###  Configuration
```bash
queuectl config:get
queuectl config:set max_retries 5
```

---

#  3. Architecture Overview

###  Core Concepts
- Jobs are stored in **SQLite** with fields:  
  `id`, `command`, `state`, `attempts`, `max_retries`, `created_at`, `updated_at`.

###  Job Lifecycle
`pending → processing → completed / failed → dead (DLQ)`

###  Worker Behavior
- Executes shell commands using Node’s `child_process.exec`.
- Updates job state atomically (no duplicates).
- Retries failed jobs with **exponential backoff** (`delay = base ^ attempts`).
- Moves jobs to DLQ after all retries fail.

###  Dead Letter Queue
- Stores permanently failed jobs.
- Can be retried manually via CLI.

###  Persistence
- SQLite ensures jobs **persist across restarts**.
- Atomic SQL prevents **race conditions** or duplicate job execution.

---

#  4. Assumptions & Trade-offs

| Area | Decision / Simplification |
|------|----------------------------|
| Database | SQLite for simplicity and persistence |
| Job Locking | Atomic SQL (`UPDATE ... RETURNING`) |
| Retry Strategy | Exponential backoff (`base ^ attempts`) |
| DLQ Storage | Separate table for clarity |
| Command Handling | System shell commands via Node |
| OS Compatibility | Windows-safe commands (`timeout /T`) |

---

#  5. Testing Instructions

###  Start Fresh
```bash
rm -f jobs.db
```

###  Add Jobs
```bash
queuectl enqueue "{\"id\":\"jobA\",\"command\":\"echo Hi\"}"
queuectl enqueue "{\"id\":\"jobB\",\"command\":\"timeout /T 2\"}"
queuectl enqueue "{\"id\":\"jobC\",\"command\":\"badcmd\"}"
```

###  Start Workers
```bash
queuectl worker:start --count 3
```

####  Expected Output:
```
 Starting 3 worker(s)...
Worker 1 picked job: jobA
✅ Job jobA completed
Worker 2 picked job: jobB
✅ Job jobB completed
 Job jobC failed (3 attempts)
 Job jobC moved to DLQ
```

###  Check Results
```bash
queuectl status
queuectl dlq:list
```

###  Retry DLQ Job
```bash
queuectl dlq:retry jobC
queuectl list --state pending
```

---

#  Future Enhancements

-  Scheduled / delayed jobs (`run_at`)
-  Job timeout & cancellation
-  Output logging
-  Priority-based queues
-  Web dashboard or REST API

---
