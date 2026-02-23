import { API } from '../api.js';

export class ExecutionView {
  constructor(app) {
    this.app = app;
    this._timer = null;
  }

  render() {
    return `
      <div class="container">
        <div class="card">
          <h2 class="section-title">Running Simulation</h2>

          <div class="alert alert-info" id="runningAlert">
            <span class="alert-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </span>
            <span>Processing each action — this may take a moment.</span>
          </div>

          <div id="progressSection" style="margin: 1.5rem 0;">
            <div style="display:flex;justify-content:space-between;margin-bottom:0.4rem;">
              <span style="font-weight:600;font-size:0.9rem;color:var(--text-secondary)">Progress</span>
              <span id="progressText" style="font-weight:600;font-size:0.9rem;color:var(--accent)">Working…</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" id="progressFill" style="width:0%"></div>
            </div>
          </div>

          <div class="log-container" id="logContainer">
            <div class="log-entry">▸ Starting execution…</div>
          </div>

          <div id="completionSection" style="display:none;">
            <div class="alert alert-success" id="completionAlert">
              <span id="completionMsg">Done.</span>
            </div>
            <div class="actions">
              <button class="btn btn-primary btn-lg" id="viewResultsBtn">
                View Results →
              </button>
            </div>
          </div>

          <div id="errorSection" style="display:none;">
            <div class="alert alert-warning">
              <span class="alert-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </span>
              <span id="errorMsg">Something went wrong.</span>
            </div>
            <div class="actions">
              <button class="btn btn-ghost" id="backBtn">← Back</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  afterRender() {
    this._run();
  }

  async _run() {
    const actions = this.app.verifiedActions;
    const jobId = this.app.jobId;

    if (!actions || !jobId) {
      this._showErr('Missing job data — go back and try again.');
      return;
    }

    const executable = actions.filter(a =>
      a.status === 'confirmed' || a.status === 'user_approved'
    );
    const total = executable.length;
    this._log(`${total} actions queued`);

    // fake progress while waiting for the sync response
    let pct = 0;
    this._timer = setInterval(() => {
      if (pct < 90) {
        pct += (90 - pct) * 0.05;
        document.getElementById('progressFill').style.width = pct + '%';
        document.getElementById('progressText').textContent = `Working… ${Math.round(pct)}%`;
      }
    }, 300);

    let logIdx = 0;
    const logTimer = setInterval(() => {
      if (logIdx < executable.length) {
        this._log(`Processing: ${executable[logIdx].email?.subject || 'email ' + (logIdx + 1)}`);
        logIdx++;
      }
    }, 800);

    try {
      const resp = await API.startExecution(jobId, actions);

      clearInterval(this._timer);
      clearInterval(logTimer);

      const results = resp.results;

      document.getElementById('progressFill').style.width = '100%';
      document.getElementById('progressText').textContent = `${total} / ${total} — Done`;

      this._log('─'.repeat(36));
      for (const s of results.successful) {
        this._log(`✓ ${s.action}: ${s.email?.subject || '?'}`, false, 'success');
      }
      for (const f of results.failed) {
        this._log(`✗ ${f.action}: ${f.email?.subject || '?'} — ${f.error}`, true);
      }
      this._log('─'.repeat(36));
      this._log(`Finished: ${results.successful.length} ok, ${results.failed.length} failed`, false, 'success');

      document.getElementById('runningAlert').style.display = 'none';
      document.getElementById('completionSection').style.display = 'block';
      document.getElementById('completionMsg').textContent =
        `${results.successful.length} succeeded, ${results.failed.length} failed`;

      document.getElementById('viewResultsBtn').addEventListener('click', () => {
        this.app.navigate('results', { jobId, results });
      });

    } catch (err) {
      clearInterval(this._timer);
      clearInterval(logTimer);
      console.error('execution failed:', err);
      this._log(`Error: ${err.message}`, true);
      this._showErr(`Failed: ${err.message}`);
    }
  }

  _showErr(msg) {
    document.getElementById('runningAlert').style.display = 'none';
    document.getElementById('errorSection').style.display = 'block';
    document.getElementById('errorMsg').textContent = msg;
    document.getElementById('backBtn')?.addEventListener('click', () => {
      this.app.navigate('preview', { jobId: this.app.jobId, plan: this.app.plan });
    });
  }

  _log(msg, isErr = false, type = '') {
    const el = document.getElementById('logContainer');
    if (!el) return;
    const div = document.createElement('div');
    div.className = 'log-entry' + (isErr ? ' error' : '') + (type === 'success' ? ' success' : '');
    div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  }
}
