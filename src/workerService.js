import { exec } from "child_process";
import { promisify } from "util";
import { exponentialBackoff, sleep } from "./utils.js";
import {
  getPendingJob,
  updateJobState,
  incrementAttempts,
  moveToDLQ,
} from "./jobmanager.js";

const execAsync = promisify(exec);
let shouldStop = false;

export const stopWorkers = () => {
  console.log(" Stopping workers gracefully...");
  shouldStop = true;
};

export const startWorkers = async (count = 1, base = 2) => {
  console.log(` Starting ${count} worker(s)...`);

  const runWorker = async (id) => {
    while (!shouldStop) {
      const job = getPendingJob();
      if (!job) {
        await sleep(1000);
        continue;
      }

      console.log(`Worker ${id} picked job: ${job.id}`);
      updateJobState(job.id, "processing");

      try {
        await execAsync(job.command);
        console.log(` Job ${job.id} completed`);
        updateJobState(job.id, "completed");
      } catch (err) {
        console.log(` Job ${job.id} failed (attempt ${job.attempts + 1})`);
        incrementAttempts(job.id);

        if (job.attempts + 1 >= job.max_retries) {
          console.log(` Job ${job.id} moved to DLQ`);
          moveToDLQ(job.id, err.message || "Execution failed");
        } else {
          const delay = exponentialBackoff(base, job.attempts + 1);
          console.log(` Retrying in ${delay / 1000}s`);
          await sleep(delay);
          updateJobState(job.id, "pending");
        }
      }
    }
    console.log(` Worker ${id} stopped gracefully.`);
  };

  for (let i = 1; i <= count; i++) runWorker(i);
};
