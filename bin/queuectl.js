import { Command } from "commander";
import chalk from "chalk";
import {
  addJob,
  getJobsByState,
  countByState,
  getDLQJobs,
  retryDLQJob,
} from "../src/jobmanager.js";
import { startWorkers, stopWorkers } from "../src/workerService.js";
import { getConfig, setConfig } from "../src/config.js";

const program = new Command();

program
  .name("queuectl")
  .description("CLI tool for managing background jobs with SQLite + DLQ")
  .version("1.0.0");

 
program
  .command("enqueue <jobJson>")
  .description("Add a new job to the queue")
  .action((jobJson) => {
    console.log("👉 Raw input:", jobJson);  
    try {
      const job = JSON.parse(jobJson);
      addJob(job);
      console.log(chalk.green(` Enqueued job ${job.id}`));
    } catch (err) {
      console.error(chalk.red(" Invalid JSON format. Please wrap properly in quotes."));
      console.error("Error:", err.message);
    }
  });


 
program
  .command("worker:start")
  .option("--count <n>", "Number of workers", "1")
  .description("Start one or more workers")
  .action((opts) => {
    startWorkers(parseInt(opts.count));
  });

 
program
  .command("worker:stop")
  .description("Stop running workers gracefully")
  .action(() => {
    stopWorkers();
  });

 
program
  .command("status")
  .description("Show summary of all job states")
  .action(() => {
    const rows = countByState();
    if (rows.length === 0) console.log(chalk.yellow("No jobs found yet."));
    else console.table(rows);
  });

 
program
  .command("list")
  .option("--state <state>", "Filter by state (pending, processing, completed)", "pending")
  .description("List jobs by state")
  .action((opts) => {
    const jobs = getJobsByState(opts.state);
    if (!jobs || jobs.length === 0)
      console.log(chalk.yellow(`No jobs found for state "${opts.state}".`));
    else console.table(jobs);
  });

 
program
  .command("dlq:list")
  .description("List jobs in the Dead Letter Queue (separate DLQ table)")
  .action(() => {
    const jobs = getDLQJobs();
    if (!jobs || jobs.length === 0)
      console.log(chalk.yellow("No jobs found in the Dead Letter Queue."));
    else console.table(jobs);
  });
 

program
  .command("dlq:retry <id>")
  .description("Retry a job from the Dead Letter Queue")
  .action((id) => {
    const ok = retryDLQJob(id);
    if (ok)
      console.log(chalk.green(` Job ${id} moved back to pending queue.`));
    else
      console.log(chalk.red(` Job ${id} not found in the DLQ.`));
  });

 
program
  .command("config:set <key> <value>")
  .description("Set configuration value (e.g., max_retries, backoff_base)")
  .action((key, value) => {
    setConfig(key, isNaN(value) ? value : Number(value));
    console.log(chalk.green(` Updated config: ${key} = ${value}`));
  });

 
program
  .command("config:get")
  .description("Show current configuration")
  .action(() => {
    console.table(getConfig());
  });

program.parseAsync();
