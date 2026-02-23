export class PreviewView {
  constructor(app) {
    this.app = app;
    this.selected = new Set();
  }

  render() {
    const { plan } = this.app;

    return `
      <div class="container">
        <div class="card">
          <h2 class="section-title">Analysis Preview</h2>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${plan.totalEmails}</div>
              <div class="stat-label">Total</div>
            </div>
            <div class="stat-card success">
              <div class="stat-value">${plan.stats.confirmed}</div>
              <div class="stat-label">Confirmed</div>
            </div>
            <div class="stat-card warning">
              <div class="stat-value">${plan.stats.verificationNeeded}</div>
              <div class="stat-label">Needs Review</div>
            </div>
            <div class="stat-card neutral">
              <div class="stat-value">${plan.stats.skip}</div>
              <div class="stat-label">Skipped</div>
            </div>
          </div>

          ${this._donut(plan)}
          ${this._tables(plan.actions)}

          <div class="actions">
            <button class="btn btn-ghost" id="backBtn">← Back</button>
            <button class="btn btn-success btn-lg" id="executeBtn">
              Confirm &amp; Run
            </button>
          </div>
        </div>
      </div>
    `;
  }

  _donut(plan) {
    const total = plan.totalEmails || 1;
    const c = plan.stats.confirmed, v = plan.stats.verificationNeeded, s = plan.stats.skip;
    const r = 54, circ = 2 * Math.PI * r;
    const s1 = (c / total) * circ, s2 = (v / total) * circ, s3 = (s / total) * circ;

    return `
      <div class="donut-container">
        <div class="donut-chart">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="12"/>
            <circle cx="70" cy="70" r="${r}" fill="none" stroke="#34d399" stroke-width="12"
              stroke-dasharray="${s1} ${circ - s1}" stroke-dashoffset="0" stroke-linecap="round"/>
            <circle cx="70" cy="70" r="${r}" fill="none" stroke="#fbbf24" stroke-width="12"
              stroke-dasharray="${s2} ${circ - s2}" stroke-dashoffset="${-s1}" stroke-linecap="round"/>
            <circle cx="70" cy="70" r="${r}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="12"
              stroke-dasharray="${s3} ${circ - s3}" stroke-dashoffset="${-(s1 + s2)}" stroke-linecap="round"/>
          </svg>
          <div class="donut-center">
            <div class="donut-center-value">${total}</div>
            <div class="donut-center-label">Emails</div>
          </div>
        </div>
        <div class="donut-legend">
          <div class="legend-item"><span class="legend-dot" style="background:#34d399"></span> Confirmed (${c})</div>
          <div class="legend-item"><span class="legend-dot" style="background:#fbbf24"></span> Needs Review (${v})</div>
          <div class="legend-item"><span class="legend-dot" style="background:rgba(255,255,255,0.25)"></span> Skipped (${s})</div>
        </div>
      </div>`;
  }

  _tables(actions) {
    const confirmed = actions.filter(a => a.status === 'confirmed');
    const verify = actions.filter(a => a.status === 'verification_needed');
    const skip = actions.filter(a => a.status === 'skip');
    let html = '';

    if (confirmed.length) {
      html += `
        <h3 class="section-title" style="margin-top:2rem;">Confirmed Actions</h3>
        <div class="table-container"><table>
          <thead><tr><th>From</th><th>Subject</th><th>Action</th><th>Confidence</th><th>Reason</th></tr></thead>
          <tbody>${confirmed.map(a => this._row(a, 'confirmed')).join('')}</tbody>
        </table></div>`;
    }

    if (verify.length) {
      html += `
        <h3 class="section-title" style="margin-top:2rem;">Needs Verification</h3>
        <div class="alert alert-warning">
          <span class="alert-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </span>
          <span>Medium confidence — check the ones you want to include.</span>
        </div>
        <div class="table-container"><table>
          <thead><tr>
            <th style="width:44px"><label class="checkbox"><input type="checkbox" id="selectAllVerify"></label></th>
            <th>From</th><th>Subject</th><th>Action</th><th>Confidence</th><th>Reason</th>
          </tr></thead>
          <tbody>${verify.map(a => this._verifyRow(a)).join('')}</tbody>
        </table></div>`;
    }

    if (skip.length) {
      html += `
        <h3 class="section-title" style="margin-top:2rem;">Skipped</h3>
        <div class="table-container"><table>
          <thead><tr><th>From</th><th>Subject</th><th>Reason</th></tr></thead>
          <tbody>${skip.slice(0, 8).map(a => `
            <tr>
              <td>${this._esc(a.email.from)}</td>
              <td>${this._esc(a.email.subject)}</td>
              <td style="font-size:0.85rem;color:var(--text-muted)">${this._esc(a.reason)}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>
        ${skip.length > 8 ? `<p style="text-align:center;color:var(--text-muted);margin-top:0.75rem;font-size:0.85rem">…and ${skip.length - 8} more</p>` : ''}`;
    }

    return html;
  }

  _row(a, type) {
    return `<tr>
      <td>${this._esc(a.email.from)}</td>
      <td>${this._esc(a.email.subject)}</td>
      <td><span class="badge badge-${type}">${a.action}</span></td>
      <td>${this._confBar(a.confidence)}</td>
      <td style="font-size:0.85rem;color:var(--text-muted)">${this._esc(a.reason)}</td>
    </tr>`;
  }

  _verifyRow(a) {
    return `<tr>
      <td><label class="checkbox"><input type="checkbox" class="action-cb" data-email-id="${a.emailId}"></label></td>
      <td>${this._esc(a.email.from)}</td>
      <td>${this._esc(a.email.subject)}</td>
      <td><span class="badge badge-verification">${a.action}</span></td>
      <td>${this._confBar(a.confidence)}</td>
      <td style="font-size:0.85rem;color:var(--text-muted)">${this._esc(a.reason)}</td>
    </tr>`;
  }

  _confBar(val) {
    const pct = (val * 100).toFixed(0);
    const cls = val >= 0.7 ? 'high' : val >= 0.4 ? 'medium' : 'low';
    return `<div style="min-width:90px">
      <div class="confidence-bar"><div class="confidence-fill confidence-${cls}" style="width:${pct}%"></div></div>
      <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px">${pct}%</div>
    </div>`;
  }

  _esc(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  afterRender() {
    document.getElementById('backBtn').addEventListener('click', () => this.app.navigate('upload'));
    document.getElementById('executeBtn').addEventListener('click', () => this._execute());

    const selectAll = document.getElementById('selectAllVerify');
    const boxes = document.querySelectorAll('.action-cb');

    if (selectAll) {
      selectAll.addEventListener('change', (e) => {
        boxes.forEach(cb => {
          cb.checked = e.target.checked;
          e.target.checked ? this.selected.add(cb.dataset.emailId) : this.selected.delete(cb.dataset.emailId);
        });
      });
    }

    boxes.forEach(cb => {
      cb.addEventListener('change', () => {
        cb.checked ? this.selected.add(cb.dataset.emailId) : this.selected.delete(cb.dataset.emailId);
      });
    });
  }

  async _execute() {
    const btn = document.getElementById('executeBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Starting…';

    try {
      const verifiedActions = this.app.plan.actions.map(action => {
        if (action.status === 'confirmed') return action;
        if (action.status === 'verification_needed' && this.selected.has(action.emailId))
          return { ...action, status: 'user_approved' };
        return action;
      });

      this.app.navigate('execution', { jobId: this.app.jobId, verifiedActions });
    } catch (e) {
      alert('Something went wrong: ' + e.message);
      btn.disabled = false;
      btn.textContent = 'Confirm & Run';
    }
  }
}
