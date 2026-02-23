import { BaseAgent } from './base-agent.js';

const UNSUB_PATTERNS = [
  /unsubscribe/i,
  /opt[\s-]?out/i,
  /manage\s+preferences/i,
  /email\s+preferences/i,
  /stop\s+receiving/i
];

export class UnsubscribeFinderAgent extends BaseAgent {
  constructor() {
    super('UnsubscribeFinderAgent');
  }

  async execute(emails) {
    this.log(`scanning ${emails.length} emails for unsub methods`);
    const out = await Promise.all(emails.map(e => this._find(e)));

    const byHeader = out.filter(e => e.unsubscribeMethod === 'header').length;
    const byLink = out.filter(e => e.unsubscribeMethod === 'link').length;
    const none = out.filter(e => e.unsubscribeMethod === 'none').length;
    this.log(`found: ${byHeader} header, ${byLink} link, ${none} none`);

    return out;
  }

  async _find(email) {
    if (email.classification !== 'newsletter') {
      return { ...email, unsubscribeMethod: 'none', unsubscribeLocation: null, unsubscribeConfidence: 0 };
    }

    // RFC 2369 header — best case
    const hdr = email.headers['list-unsubscribe'];
    if (hdr) {
      return {
        ...email,
        unsubscribeMethod: 'header',
        unsubscribeLocation: hdr,
        unsubscribeConfidence: 1.0,
        unsubscribeReason: 'List-Unsubscribe header (RFC 2369)'
      };
    }

    // try to find an unsub link in the body
    const links = (email.body.match(/https?:\/\/[^\s<>"]+/gi) || []);
    const unsubLink = links.find(l => UNSUB_PATTERNS.some(p => p.test(l)));

    if (unsubLink) {
      return {
        ...email,
        unsubscribeMethod: 'link',
        unsubscribeLocation: unsubLink,
        unsubscribeConfidence: 0.85,
        unsubscribeReason: 'Unsub link found in body'
      };
    }

    // text mentions unsubscribe but no clear link
    const hasText = UNSUB_PATTERNS.some(p => p.test(email.body));
    if (hasText) {
      return {
        ...email,
        unsubscribeMethod: 'unclear',
        unsubscribeLocation: null,
        unsubscribeConfidence: 0.4,
        unsubscribeReason: 'Mentions unsubscribe but no usable link',
        needsVerification: true
      };
    }

    return {
      ...email,
      unsubscribeMethod: 'none',
      unsubscribeLocation: null,
      unsubscribeConfidence: 0,
      unsubscribeReason: 'No unsubscribe method found'
    };
  }
}
