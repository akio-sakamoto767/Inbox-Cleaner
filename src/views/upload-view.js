import { API } from '../api.js';

export class UploadView {
  constructor(app) {
    this.app = app;
    this.emails = null;
  }

  render() {
    return `
      <div class="container">
        <div class="card">
          <h2 class="section-title">Upload Dataset</h2>
          <p style="color: var(--text-muted); margin-bottom: 1.5rem; font-size: 0.9rem;">
            Drop a JSON file with your emails, or pick one of the sample sets below.
          </p>

          <div class="upload-zone" id="uploadZone">
            <span class="upload-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent)">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </span>
            <h3>Drop your email dataset here</h3>
            <p>JSON files only &middot; click to browse</p>
            <input type="file" id="fileInput" class="file-input" accept=".json">
          </div>

          <div class="divider">or use sample data</div>

          <div class="sample-btns">
            <button class="btn btn-secondary" id="loadSampleBtn">
              Quick Demo (3 emails)
            </button>
            <button class="btn btn-secondary" id="loadExtendedBtn">
              Extended Demo (10 emails)
            </button>
          </div>

          <div id="previewSection" style="display: none; margin-top: 2rem;">
            <div class="alert alert-success">
              <span class="alert-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--green)"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <span><strong id="emailCount">0</strong> emails loaded</span>
            </div>

            <div id="emailPreviewGrid" class="email-preview-grid"></div>

            <div class="actions">
              <button class="btn btn-primary btn-lg" id="analyzeBtn">
                Run Preview
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  afterRender() {
    const zone = document.getElementById('uploadZone');
    const input = document.getElementById('fileInput');

    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) this.handleFile(e.dataTransfer.files[0]);
    });

    input.addEventListener('change', (e) => {
      if (e.target.files[0]) this.handleFile(e.target.files[0]);
    });

    document.getElementById('loadSampleBtn')
      .addEventListener('click', () => this.loadSample('sample-emails.json'));
    document.getElementById('loadExtendedBtn')
      .addEventListener('click', () => this.loadSample('extended-sample-emails.json'));
    document.getElementById('analyzeBtn')
      ?.addEventListener('click', () => this.analyze());
  }

  async handleFile(file) {
    try {
      const text = await file.text();
      this.emails = JSON.parse(text);
      this.showPreview();
    } catch (e) {
      alert('Could not read file: ' + e.message);
    }
  }

  async loadSample(filename) {
    try {
      const res = await fetch(`/data/${filename}`);
      this.emails = await res.json();
      this.showPreview();
    } catch (e) {
      alert('Failed to load sample: ' + e.message);
    }
  }

  showPreview() {
    document.getElementById('previewSection').style.display = 'block';
    document.getElementById('emailCount').textContent = this.emails.length;

    const grid = document.getElementById('emailPreviewGrid');
    grid.innerHTML = this.emails.map(e => {
      const from = typeof e.from === 'string' ? e.from : (e.from?.name || e.from?.address || '');
      return `
        <div class="email-card">
          <div class="email-card-from">${this._esc(from)}</div>
          <div class="email-card-subject">${this._esc(e.subject || '(No Subject)')}</div>
        </div>`;
    }).join('');
  }

  async analyze() {
    const btn = document.getElementById('analyzeBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Analyzing…';

    try {
      const upload = await API.uploadEmails(this.emails);
      const plan = await API.runPreview(upload.jobId);
      this.app.navigate('preview', { jobId: upload.jobId, plan });
    } catch (e) {
      alert('Analysis failed: ' + e.message);
      btn.disabled = false;
      btn.textContent = 'Run Preview';
    }
  }

  _esc(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }
}
