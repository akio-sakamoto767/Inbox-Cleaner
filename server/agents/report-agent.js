// ReportAgent doesn't extend BaseAgent — it's stateless and
// doesn't need the confidence helpers or logging prefix.
// Might refactor later if we add more report formats.

export class ReportAgent {
  constructor() {
    this.name = 'ReportAgent';
  }

  async execute(data) {
    console.log('[report] generating...');
    const { plan, results, emails } = data;
    return {
      markdown: this._md(plan, results),
      json: this._json(plan, results)
    };
  }

  _md(plan, results) {
    const lines = [
      '# Inbox Cleaner Report',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Summary',
      '',
      `- Emails Analyzed: ${plan.totalEmails}`,
      `- Confirmed: ${plan.stats.confirmed}`,
      `- Needs Verification: ${plan.stats.verificationNeeded}`,
      `- Skipped: ${plan.stats.skip}`,
      ''
    ];

    if (results) {
      const errRate = results.total > 0
        ? ((results.failed.length / results.total) * 100).toFixed(1)
        : '0.0';
      lines.push(
        '## Execution',
        '',
        `- Succeeded: ${results.successful.length}`,
        `- Failed: ${results.failed.length}`,
        `- Error rate: ${errRate}%`,
        ''
      );
    }

    // resolution breakdown
    const byRules = plan.actions.filter(a => a.status === 'confirmed').length;
    lines.push(
      '## Resolution',
      '',
      `- By rules: ${byRules}`,
      `- Needs verification: ${plan.stats.verificationNeeded}`,
      ''
    );

    if (results?.successful.length) {
      lines.push('## Successful', '');
      const show = results.successful.slice(0, 10);
      for (const s of show) {
        lines.push(`- **${s.email.subject}** (${s.email.from}) — ${s.action}`);
      }
      if (results.successful.length > 10) {
        lines.push(`- _...and ${results.successful.length - 10} more_`);
      }
      lines.push('');
    }

    if (results?.errors.length) {
      lines.push('## Errors', '');
      for (const err of results.errors) {
        const a = plan.actions.find(x => x.emailId === err.emailId);
        lines.push(`- ${a?.email.subject || err.emailId}: ${err.error}`);
      }
      lines.push('');
    }

    const toVerify = plan.actions.filter(a => a.status === 'verification_needed');
    if (toVerify.length) {
      lines.push('## Needs Verification', '');
      for (const item of toVerify) {
        lines.push(`- **${item.email.subject}** (${item.email.from}) — ${(item.confidence * 100).toFixed(0)}% conf — ${item.reason}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  _json(plan, results) {
    return {
      generatedAt: new Date().toISOString(),
      summary: {
        totalEmails: plan.totalEmails,
        confirmed: plan.stats.confirmed,
        verificationNeeded: plan.stats.verificationNeeded,
        skipped: plan.stats.skip,
        executed: results?.total || 0,
        successful: results?.successful.length || 0,
        failed: results?.failed.length || 0
      },
      metrics: {
        resolvedByRules: plan.actions.filter(a => a.status === 'confirmed').length,
        verificationRequired: plan.stats.verificationNeeded,
        errorRate: results && results.total ? (results.failed.length / results.total) : 0
      },
      actions: plan.actions,
      results: results || null
    };
  }
}
