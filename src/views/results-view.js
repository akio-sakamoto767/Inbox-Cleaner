export class ResultsView {
  constructor(app) {
    this.app = app;
  }

  render() {
    const { results } = this.app;
    const total = results.total || 1;
    const rate = ((results.successful.length / total) * 100).toFixed(1);

    return `
      <div class="container">
        <div class="card">
          <h2 class="section-title">Results</h2>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${results.total}</div>
              <div class="stat-label">Executed</div>
            </div>
            <div class="stat-card success">
              <div class="stat-value">${results.successful.length}</div>
              <div class="stat-label">Succeeded</div>
            </div>
            <div class="stat-card danger">
              <div class="stat-value">${results.failed.length}</div>
              <div class="stat-label">Failed</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${rate}%</div>
              <div class="stat-label">Success Rate</div>
            </div>
          </div>

          ${this._donut(results)}
          ${results.successful.length ? this._successTable(results.successful) : ''}
          ${results.failed.length ? this._failTable(results.failed) : ''}

          <h3 class="section-title" style="margin-top:2rem;">Reports</h3>
          <div class="download-grid">
            <div class="download-card" id="dlMd" tabindex="0" role="button" aria-label="Download Markdown report">
              <div class="download-card-title">Markdown</div>
              <div class="download-card-desc">Human-readable summary</div>
            </div>
            <div class="download-card" id="dlJson" tabindex="0" role="button" aria-label="Download JSON report">
              <div class="download-card-title">JSON</div>
              <div class="download-card-desc">Structured data export</div>
            </div>
          </div>

          <div class="actions">
            <button class="btn btn-primary btn-lg" id="startOverBtn">← Start Over</button>
          </div>
        </div>
      </div>
    `;
  }

  _donut(results) {
    const total = results.total || 1;
    const s = results.successful.length, f = results.failed.length;
    const r = 54, circ = 2 * Math.PI * r;
    const seg1 = (s / total) * circ, seg2 = (f / total) * circ;

    return `
      <div class="donut-container">
        <div class="donut-chart">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="12"/>
            <circle cx="70" cy="70" r="${r}" fill="none" stroke="#34d399" stroke-width="12"
              stroke-dasharray="${seg1} ${circ - seg1}" stroke-dashoffset="0" stroke-linecap="round"/>
            <circle cx="70" cy="70" r="${r}" fill="none" stroke="#f87171" stroke-width="12"
              stroke-dasharray="${seg2} ${circ - seg2}" stroke-dashoffset="${-seg1}" stroke-linecap="round"/>
          </svg>
          <div class="donut-center">
            <div class="donut-center-value">${((s / total) * 100).toFixed(0)}%</div>
            <div class="donut-center-label">Success</div>
          </div>
        </div>
        <div class="donut-legend">
          <div class="legend-item"><span class="legend-dot" style="background:#34d399"></span> Succeeded (${s})</div>
          <div class="legend-item"><span class="legend-dot" style="background:#f87171"></span> Failed (${f})</div>
        </div>
      </div>`;
  }

  _successTable(items) {
    return `
      <h3 class="section-title" style="margin-top:2rem;">Successful</h3>
      <div class="table-container"><table>
        <thead><tr><th>From</th><th>Subject</th><th>Action</th><th>Status</th></tr></thead>
        <tbody>
          ${items.slice(0, 10).map(i => `
            <tr>
              <td>${this._esc(i.email.from)}</td>
              <td>${this._esc(i.email.subject)}</td>
              <td>${i.action}</td>
              <td><span class="badge badge-success">OK</span></td>
            </tr>`).join('')}
        </tbody>
      </table></div>
      ${items.length > 10 ? `<p style="text-align:center;color:var(--text-muted);margin-top:0.75rem;font-size:0.85rem">…and ${items.length - 10} more</p>` : ''}`;
  }

  _failTable(items) {
    return `
      <h3 class="section-title" style="margin-top:2rem;">Failed</h3>
      <div class="alert alert-warning">
        <span class="alert-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </span>
        <span>${items.length} action(s) failed.</span>
      </div>
      <div class="table-container"><table>
        <thead><tr><th>From</th><th>Subject</th><th>Action</th><th>Error</th></tr></thead>
        <tbody>
          ${items.map(i => `
            <tr>
              <td>${this._esc(i.email.from)}</td>
              <td>${this._esc(i.email.subject)}</td>
              <td>${i.action}</td>
              <td><span class="badge badge-error">${this._esc(i.error)}</span></td>
            </tr>`).join('')}
        </tbody>
      </table></div>`;
  }

  _esc(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  afterRender() {
    document.getElementById('startOverBtn').addEventListener('click', () => this.app.navigate('upload'));
    document.getElementById('dlMd').addEventListener('click', () => {
      window.open(`/api/jobs/${this.app.jobId}/report?format=markdown`, '_blank');
    });
    document.getElementById('dlJson').addEventListener('click', () => {
      window.open(`/api/jobs/${this.app.jobId}/report?format=json`, '_blank');
    });
  }
}
