import { BaseAgent } from './base-agent.js';
import { setLive } from '../live-store.js';

export class ExecutionAgent extends BaseAgent {
  constructor() {
    super('ExecutionAgent');
  }

  async execute(jobId, actions) {
    const runnable = actions.filter(a =>
      a.status === 'confirmed' || a.status === 'user_approved'
    );
    console.log(`[exec] ${runnable.length}/${actions.length} actions to run`);

    const results = {
      total: runnable.length,
      successful: [],
      failed: [],
      errors: [],
      progress: { current: 0, total: runnable.length }
    };

    setLive(jobId, { status: 'running', results: structuredClone(results) });

    if (!runnable.length) {
      console.log('[exec] nothing to do');
      return results;
    }

    for (const action of runnable) {
      try {
        await this._wait(1000 + Math.random() * 1000);

        // ~90% success rate in simulation
        if (Math.random() > 0.1) {
          results.successful.push({
            emailId: action.emailId,
            email: action.email,
            action: action.action,
            timestamp: new Date().toISOString()
          });
          console.log(`  ok: ${action.email?.subject}`);
        } else {
          const err = this._simError();
          results.failed.push({ emailId: action.emailId, email: action.email, action: action.action, error: err });
          results.errors.push({ emailId: action.emailId, error: err, timestamp: new Date().toISOString() });
          console.log(`  fail: ${action.email?.subject} — ${err}`);
        }
      } catch (e) {
        results.failed.push({ emailId: action.emailId, email: action.email, action: action.action, error: e.message });
        results.errors.push({ emailId: action.emailId, error: e.message, timestamp: new Date().toISOString() });
      }

      results.progress.current++;
      setLive(jobId, { status: 'running', results: structuredClone(results) });
    }

    console.log(`[exec] done — ${results.successful.length} ok, ${results.failed.length} failed`);
    return results;
  }

  _wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  _simError() {
    // these are loosely based on real unsub failure modes
    const pool = [
      'ETIMEDOUT connecting to mail server',
      'Unsubscribe link returned 404',
      'Rate limited — try again later',
      'Unexpected 500 from remote',
      'SSL handshake failed',
      'Link redirected to login page'
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }
}
