import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { IngestAgent } from './agents/ingest-agent.js';
import { ClassifyAgent } from './agents/classify-agent.js';
import { UnsubscribeFinderAgent } from './agents/unsubscribe-finder-agent.js';
import { PlannerAgent } from './agents/planner-agent.js';
import { ExecutionAgent } from './agents/execution-agent.js';
import { ReportAgent } from './agents/report-agent.js';
import { getLive, setLive, deleteLive } from './live-store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class Orchestrator {
  constructor() {
    this.ingestAgent = new IngestAgent();
    this.classifyAgent = new ClassifyAgent();
    this.unsubscribeFinderAgent = new UnsubscribeFinderAgent();
    this.plannerAgent = new PlannerAgent();
    this.executionAgent = new ExecutionAgent();
    this.reportAgent = new ReportAgent();
    this.jobsDir = join(__dirname, '../jobs');
  }

  async createJob(jobId, emails) {
    const job = {
      id: jobId,
      status: 'created',
      createdAt: new Date().toISOString(),
      emails,
      plan: null,
      results: null,
      report: null
    };
    await this.saveJob(job);
    return job;
  }

  async runPreview(jobId) {
    const job = await this.loadJob(jobId);
    job.status = 'analyzing';
    await this.saveJob(job);

    // pipeline: ingest → classify → find unsub → plan
    const normalized = await this.ingestAgent.execute(job.emails);
    const classified = await this.classifyAgent.execute(normalized);
    const withUnsub = await this.unsubscribeFinderAgent.execute(classified);
    const plan = await this.plannerAgent.execute(withUnsub);

    job.plan = plan;
    job.status = 'pending_confirmation';
    await this.saveJob(job);
    return plan;
  }

  async executeJob(jobId, verifiedActions) {
    console.log(`[orch] executing job ${jobId}`);
    const job = await this.loadJob(jobId);
    job.status = 'running';
    await this.saveJob(job);

    try {
      const results = await this.executionAgent.execute(
        jobId,
        verifiedActions || job.plan.actions
      );

      const finalStatus = results.errors.length > 0
        ? 'completed_with_issues'
        : 'completed';

      job.results = results;
      job.status = finalStatus;
      await this.saveJob(job);
      setLive(jobId, { status: finalStatus, results });

      const report = await this.reportAgent.execute({
        plan: job.plan,
        results,
        emails: job.emails
      });
      job.report = report;
      await this.saveJob(job);

      console.log(`[orch] job ${jobId} → ${finalStatus}`);
      return results;
    } catch (err) {
      console.error(`[orch] job ${jobId} error:`, err);
      job.status = 'completed_with_issues';
      job.results = {
        total: 0, successful: [], failed: [],
        errors: [{ error: err.message }],
        progress: { current: 0, total: 0 }
      };
      await this.saveJob(job);
      setLive(jobId, { status: 'completed_with_issues', results: job.results });
    }
  }

  async getJobStatus(jobId) {
    const live = getLive(jobId);
    const job = await this.loadJob(jobId);

    const base = {
      id: job.id,
      createdAt: job.createdAt,
      emailCount: job.emails?.length || 0,
      plan: job.plan
    };

    if (live) {
      return { ...base, status: live.status, results: live.results, progress: live.results?.progress || null };
    }
    return { ...base, status: job.status, results: job.results, progress: job.results?.progress || null };
  }

  async getReport(jobId) {
    const job = await this.loadJob(jobId);
    if (!job.report) throw new Error('Report not generated yet');
    return job.report;
  }

  async saveJob(job) {
    await fs.writeFile(join(this.jobsDir, `${job.id}.json`), JSON.stringify(job, null, 2));
  }

  async loadJob(jobId) {
    const raw = await fs.readFile(join(this.jobsDir, `${jobId}.json`), 'utf-8');
    return JSON.parse(raw);
  }
}
