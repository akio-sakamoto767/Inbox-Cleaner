export class BaseAgent {
  constructor(name) {
    this.name = name;
  }

  log(msg, data = null) {
    const ts = new Date().toISOString();
    console.log(`[${ts}] [${this.name}] ${msg}`, data || '');
  }

  async execute(input) {
    throw new Error(`${this.name}.execute() not implemented`);
  }

  // avg of weighted scores, clamped 0-1
  calcConfidence(factors) {
    let totalW = 0, sum = 0;
    for (let i = 0; i < factors.length; i++) {
      const w = factors[i].weight || 1;
      totalW += w;
      sum += factors[i].score * w;
    }
    const raw = sum / totalW;
    return raw > 1 ? 1 : raw < 0 ? 0 : raw;
  }
}
