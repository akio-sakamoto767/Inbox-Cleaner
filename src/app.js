import { UploadView } from './views/upload-view.js';
import { PreviewView } from './views/preview-view.js';
import { ExecutionView } from './views/execution-view.js';
import { ResultsView } from './views/results-view.js';

const STEPS = [
  { key: 'upload', label: 'Upload' },
  { key: 'preview', label: 'Preview' },
  { key: 'execution', label: 'Execute' },
  { key: 'results', label: 'Results' }
];

export class App {
  constructor() {
    this.currentView = 'upload';
    this.jobId = null;
    this.plan = null;
    this.results = null;
    this.visitedSteps = new Set(['upload']);

    this.views = {
      upload: new UploadView(this),
      preview: new PreviewView(this),
      execution: new ExecutionView(this),
      results: new ResultsView(this)
    };
  }

  mount(container) {
    this.container = container;
    this.render();
  }

  navigate(view, data = {}) {
    this.currentView = view;
    this.visitedSteps.add(view);
    Object.assign(this, data);
    this.render();
  }

  render() {
    const idx = STEPS.findIndex(s => s.key === this.currentView);

    const header = `
      <div class="header">
        <h1>Inbox Cleaner</h1>
        <p>Multi-agent email management pipeline</p>
      </div>
      <div class="stepper">
        ${STEPS.map((step, i) => {
          const done = i < idx;
          const active = i === idx;
          const cls = done ? 'done' : active ? 'active' : '';
          const line = i < STEPS.length - 1
            ? `<div class="step-line ${done ? 'done' : ''}"></div>`
            : '';
          return `
            <div class="step ${cls}">
              <span class="step-number">${done ? '✓' : i + 1}</span>
              ${step.label}
            </div>
            ${line}`;
        }).join('')}
      </div>
    `;

    const view = this.views[this.currentView];
    this.container.innerHTML = header + view.render();
    view.afterRender();
  }
}
