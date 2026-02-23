import { BaseAgent } from './base-agent.js';

const THRESH_OK = 0.7;
const THRESH_MAYBE = 0.4;

export class PlannerAgent extends BaseAgent {
  constructor() {
    super('PlannerAgent');
  }

  async execute(emails) {
    this.log(`planning actions for ${emails.length} emails`);

    const actions = emails.map(em => this._plan(em));

    const confirmed = actions.filter(a => a.status === 'confirmed').length;
    const verify = actions.filter(a => a.status === 'verification_needed').length;
    const skip = actions.filter(a => a.status === 'skip').length;

    this.log(`plan: ${confirmed} confirmed, ${verify} verify, ${skip} skip`);

    return {
      totalEmails: emails.length,
      actions,
      stats: { confirmed, verificationNeeded: verify, skip },
      createdAt: new Date().toISOString()
    };
  }

  _plan(email) {
    if (email.classification === 'personal') {
      return {
        emailId: email.id,
        email: { from: email.from.address, subject: email.subject },
        action: 'skip',
        status: 'skip',
        reason: 'Personal email',
        confidence: email.classificationConfidence
      };
    }

    const conf = Math.min(email.classificationConfidence, email.unsubscribeConfidence);

    let status;
    if (conf >= THRESH_OK) status = 'confirmed';
    else if (conf >= THRESH_MAYBE) status = 'verification_needed';
    else status = 'skip';

    // override: if flagged for verification upstream, respect that
    if (email.needsVerification) status = 'verification_needed';

    return {
      emailId: email.id,
      email: { from: email.from.address, subject: email.subject, date: email.date },
      action: email.unsubscribeMethod !== 'none' ? 'unsubscribe' : 'archive',
      status,
      reason: this._buildReason(conf, email.unsubscribeMethod),
      confidence: conf,
      unsubscribeMethod: email.unsubscribeMethod,
      unsubscribeLocation: email.unsubscribeLocation,
      classificationReason: email.classificationReason,
      unsubscribeReason: email.unsubscribeReason
    };
  }

  _buildReason(conf, method) {
    const parts = [];

    if (conf >= THRESH_OK) parts.push('High confidence');
    else if (conf >= THRESH_MAYBE) parts.push('Medium confidence — needs review');
    else parts.push('Low confidence — skipping');

    if (method === 'header') parts.push('standard unsub header');
    else if (method === 'link') parts.push('unsub link in body');
    else if (method === 'unclear') parts.push('unsub method unclear');
    else parts.push('no unsub method');

    return parts.join('; ');
  }
}
