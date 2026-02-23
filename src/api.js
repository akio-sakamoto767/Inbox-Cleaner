const BASE = '/api';

export class API {
  static async uploadEmails(emails) {
    const res = await fetch(`${BASE}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails })
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  }

  static async runPreview(jobId) {
    const res = await fetch(`${BASE}/jobs/${jobId}/preview`, { method: 'POST' });
    if (!res.ok) throw new Error('Preview request failed');
    return res.json();
  }

  static async startExecution(jobId, verifiedActions) {
    const res = await fetch(`${BASE}/jobs/${jobId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verifiedActions })
    });
    // parse manually so we can surface server error messages
    const raw = await res.text();
    let data;
    try { data = JSON.parse(raw); } catch { data = { error: raw }; }
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  static async getJobStatus(jobId) {
    const res = await fetch(`${BASE}/jobs/${jobId}/status`);
    if (!res.ok) throw new Error('Status check failed');
    return res.json();
  }

  static async getReport(jobId, fmt = 'json') {
    const res = await fetch(`${BASE}/jobs/${jobId}/report?format=${fmt}`);
    if (!res.ok) throw new Error('Could not fetch report');
    return fmt === 'markdown' ? res.text() : res.json();
  }
}
