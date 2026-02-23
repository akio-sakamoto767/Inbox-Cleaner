# Setup Guide

## Prerequisites

Before you begin, ensure you have:
- Node.js 18 or higher installed
- npm (comes with Node.js)

Check your versions:
```bash
node --version
npm --version
```

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install:
- express (backend server)
- cors (API cross-origin support)
- uuid (unique ID generation)
- zod (schema validation)
- vite (frontend build tool)
- nodemon (auto-restart server)
- concurrently (run multiple commands)

### 2. Start the Application

```bash
npm run dev
```

This command starts both:
- Backend server on http://localhost:3000
- Frontend dev server on http://localhost:5173

### 3. Open in Browser

Navigate to: http://localhost:5173

## Usage Flow

1. **Upload Page**
   - Click "Load Sample (3 emails)" for quick demo
   - Or click "Load Extended (10 emails)" for comprehensive demo
   - Or drag & drop your own JSON file

2. **Preview Page**
   - Review AI-generated action plan
   - Check confidence scores
   - Manually approve "Verification Needed" items
   - Click "Verify and Run Simulation"

3. **Execution Page**
   - Watch real-time progress
   - View execution logs
   - Wait for completion

4. **Results Page**
   - See success/failure statistics
   - Download Markdown report
   - Download JSON report
   - Start over with new dataset

## Troubleshooting

### Port Already in Use

If port 3000 or 5173 is already in use:

**Option 1**: Stop the process using that port
**Option 2**: Change the port in the config files

For backend (server/index.js):
```javascript
const PORT = 3001; // Change from 3000
```

For frontend (vite.config.js):
```javascript
server: {
  port: 5174, // Change from 5173
}
```

### Module Not Found

If you see "Cannot find module" errors:
```bash
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors

Make sure both servers are running. The frontend proxies API requests to the backend.

## Project Structure

```
inbox-cleaner-agent/
├── server/              # Backend (Express)
│   ├── agents/          # Agent implementations
│   ├── orchestrator.js  # Workflow coordinator
│   └── index.js         # API server
├── src/                 # Frontend (Vanilla JS)
│   ├── views/           # UI components
│   ├── app.js           # Main app
│   ├── api.js           # API client
│   └── style.css        # Styles
├── data/                # Sample datasets
├── jobs/                # Job state storage
└── index.html           # Entry point
```

## Development

### Run Backend Only
```bash
npm run server
```

### Run Frontend Only
```bash
npm run client
```

### Build for Production
```bash
npm run build
npm run preview
```

## Next Steps

- Try different sample datasets
- Modify confidence thresholds in `server/agents/planner-agent.js`
- Customize classification rules in `server/agents/classify-agent.js`
- Add your own email patterns
- Integrate with Gmail API (future enhancement)

## Support

For issues or questions, check:
- README.md for architecture details
- Code comments in agent files
- Console logs for debugging
