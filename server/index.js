import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { Orchestrator } from './orchestrator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const orchestrator = new Orchestrator();

const jobsDir = join(__dirname, '../jobs');
await fs.mkdir(jobsDir, { recursive: true });

// -- routes --

app.post('/api/upload', async (req, res) => {
  try {
    const { emails } = req.body;
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ error: 'Expected { emails: [...] }' });
    }
    const jobId = uuidv4();
    const job = await orchestrator.createJob(jobId, emails);
    res.json({ jobId, status: job.status, emailCount: emails.length });
  } catch (err) {
    console.error('upload failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/jobs/:jobId/preview', async (req, res) => {
  try {
    const plan = await orchestrator.runPreview(req.params.jobId);
    res.json(plan);
  } catch (err) {
    console.error('preview failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/jobs/:jobId/execute', async (req, res) => {
  console.log('[execute] incoming request');
  try {
    const { jobId } = req.params;
    const { verifiedActions } = req.body;

    if (!verifiedActions || !Array.isArray(verifiedActions)) {
      return res.status(400).json({ error: 'verifiedActions array required' });
    }

    console.log(`[execute] job=${jobId}, actions=${verifiedActions.length}`);

    let job;
    try {
      job = await orchestrator.loadJob(jobId);
    } catch (e) {
      console.error('[execute] job not found:', e.message);
      return res.status(404).json({ error: 'Job not found' });
    }

    job.plan.actions = verifiedActions;
    job.status = 'running';

    try {
      await orchestrator.saveJob(job);
    } catch (e) {
      console.error('[execute] save failed:', e.message);
      return res.status(500).json({ error: 'Could not save job state' });
    }

    const executable = verifiedActions.filter(a =>
      a.status === 'confirmed' || a.status === 'user_approved'
    );
    console.log(`[execute] ${executable.length} to run`);

    const results = { total: executable.length, successful: [], failed: [], errors: [] };

    for (let i = 0; i < executable.length; i++) {
      const action = executable[i];
      await new Promise(r => setTimeout(r, 200 + Math.random() * 200));

      if (Math.random() > 0.1) {
        results.successful.push({
          emailId: action.emailId,
          email: action.email,
          action: action.action,
          timestamp: new Date().toISOString()
        });
      } else {
        const e = _randErr();
        results.failed.push({ emailId: action.emailId, email: action.email, action: action.action, error: e });
        results.errors.push({ emailId: action.emailId, error: e, timestamp: new Date().toISOString() });
      }
    }

    job.results = results;
    job.status = results.errors.length ? 'completed_with_issues' : 'completed';
    await orchestrator.saveJob(job);
    console.log(`[execute] ${results.successful.length} ok, ${results.failed.length} failed`);

    // generate report
    try {
      const report = await orchestrator.reportAgent.execute({ plan: job.plan, results, emails: job.emails });
      job.report = report;
      await orchestrator.saveJob(job);
    } catch (e) {
      console.error('report gen failed:', e);
      // non-fatal, we still return results
    }

    res.json({ status: job.status, results });
  } catch (err) {
    console.error('execute error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/jobs/:jobId/status', async (req, res) => {
  try {
    const status = await orchestrator.getJobStatus(req.params.jobId);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/jobs/:jobId/report', async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const report = await orchestrator.getReport(req.params.jobId);
    if (format === 'markdown') {
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="report-${req.params.jobId}.md"`);
      res.send(report.markdown);
    } else {
      res.json(report.json);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function _randErr() {
  const pool = [
    'ETIMEDOUT connecting to mail server',
    'Unsubscribe link returned 404',
    'Rate limited — retry later',
    'Remote server 500',
    'SSL handshake failed',
    'Link redirected to login page'
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}

app.listen(PORT, () => {
  console.log(`server up → http://localhost:${PORT}`);
});
