import { BaseAgent } from './base-agent.js';

const NEWSLETTER_DOMAINS = ['newsletter.com', 'mail.', 'news.', 'marketing.', 'promo.'];
const NEWSLETTER_KW = ['unsubscribe', 'newsletter', 'promotional', 'marketing', 'opt-out', 'manage preferences'];

export class ClassifyAgent extends BaseAgent {
  constructor() {
    super('ClassifyAgent');
  }

  async execute(emails) {
    this.log(`classifying ${emails.length} emails`);
    const results = await Promise.all(emails.map(e => this._classify(e)));

    const nl = results.filter(e => e.classification === 'newsletter').length;
    const prs = results.filter(e => e.classification === 'personal').length;
    const verify = results.filter(e => e.needsVerification).length;
    this.log(`done — ${nl} newsletter, ${prs} personal, ${verify} need review`);

    return results;
  }

  async _classify(email) {
    const factors = [];

    // domain check
    const domain = email.from.address.split('@')[1] || '';
    const domainHit = NEWSLETTER_DOMAINS.some(d => domain.includes(d));
    factors.push({ score: domainHit ? 1 : 0, weight: 2 });

    // keyword scan
    const bodyLc = email.body.toLowerCase();
    const kwHits = NEWSLETTER_KW.filter(kw => bodyLc.includes(kw)).length;
    factors.push({ score: Math.min(1, kwHits / 3), weight: 3 });

    // list-unsubscribe header is a strong signal
    const hasHeader = !!email.headers['list-unsubscribe'];
    factors.push({ score: hasHeader ? 1 : 0, weight: 4 });

    const subLc = email.subject.toLowerCase();
    const subjectHit = ['newsletter', 'weekly', 'digest', 'update'].some(k => subLc.includes(k));
    factors.push({ score: subjectHit ? 1 : 0, weight: 1 });

    const conf = this.calcConfidence(factors);
    const isNl = conf > 0.5;
    const needsVerification = conf > 0.3 && conf < 0.7;

    return {
      ...email,
      classification: isNl ? 'newsletter' : 'personal',
      classificationConfidence: conf,
      classificationReason: this._reason(hasHeader, kwHits, domainHit),
      needsVerification,
      resolvedBy: 'rules'
    };
  }

  _reason(hasHeader, kwCount, domainHit) {
    const r = [];
    if (hasHeader) r.push('List-Unsubscribe header present');
    if (kwCount > 0) r.push(`${kwCount} newsletter keyword${kwCount > 1 ? 's' : ''}`);
    if (domainHit) r.push('known newsletter domain');
    return r.length ? r.join('; ') : 'No clear indicators';
  }
}
