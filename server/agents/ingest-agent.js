import { BaseAgent } from './base-agent.js';

export class IngestAgent extends BaseAgent {
  constructor() {
    super('IngestAgent');
  }

  async execute(emails) {
    this.log(`ingesting ${emails.length} emails`);

    const out = emails.map((em, i) => ({
      id: em.id || `email-${i}`,
      from: this._parseAddr(em.from),
      to: this._parseAddr(em.to),
      subject: em.subject || '(No Subject)',
      body: em.body || '',
      headers: em.headers || {},
      date: em.date || new Date().toISOString(),
      raw: em
    }));

    this.log(`normalized ${out.length} emails`);
    return out;
  }

  // "Name <addr>" or just "addr"
  _parseAddr(field) {
    if (!field) return { address: '', name: '' };

    if (typeof field === 'string') {
      const m = field.match(/^(.+?)\s*<(.+?)>$/);
      if (m) return { name: m[1].trim(), address: m[2].trim().toLowerCase() };
      return { name: '', address: field.trim().toLowerCase() };
    }

    return {
      name: field.name || '',
      address: (field.address || field.email || '').toLowerCase()
    };
  }
}
