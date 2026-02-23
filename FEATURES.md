# Feature Documentation

## Core Features

### 1. Multi-Agent Architecture

The system uses six specialized agents, each with a single responsibility:

#### IngestAgent
- Normalizes email data from various formats
- Validates required fields
- Standardizes email addresses and headers
- Handles missing or malformed data gracefully

#### ClassifyAgent
- Distinguishes newsletters from personal emails
- Uses rule-based classification first:
  - Newsletter domain patterns (newsletter.com, mail., news., etc.)
  - Keyword detection (unsubscribe, newsletter, promotional, etc.)
  - List-Unsubscribe header presence
  - Subject line patterns
- Calculates confidence score (0-1)
- Marks ambiguous cases for verification
- Tracks resolution method (rules vs LLM)

#### UnsubscribeFinderAgent
- Multi-strategy unsubscribe detection:
  1. List-Unsubscribe header (RFC standard) - highest confidence
  2. Body link extraction with pattern matching
  3. Text-only unsubscribe mentions
- Returns method, location, and confidence
- Flags unclear cases for manual review

#### PlannerAgent
- Applies confidence thresholds:
  - ≥ 0.7: Confirmed (auto-proceed)
  - 0.4-0.7: Verification needed
  - < 0.4: Skip
- Generates actionable plan with reasons
- Aggregates statistics
- Respects user overrides

#### ExecutionAgent
- Batch processing (configurable batch size)
- Simulates API calls with realistic delays
- Per-item error handling (failures don't cascade)
- Real-time progress tracking
- Configurable success rate for testing

#### ReportAgent
- Dual-format output:
  - Markdown: Human-readable summary
  - JSON: Machine-readable data
- Comprehensive metrics:
  - Resolution methods (rules vs LLM)
  - Success/failure rates
  - Verification requirements
  - Error details

### 2. Confidence-Based Decision Making

The system uses a sophisticated confidence scoring mechanism:

**Classification Confidence Factors:**
- Domain match (weight: 2)
- Keyword count (weight: 3)
- List-Unsubscribe header (weight: 4)
- Subject patterns (weight: 1)

**Unsubscribe Confidence:**
- Header found: 1.0 (100%)
- Link found: 0.85 (85%)
- Text only: 0.4 (40%)
- Not found: 0.0 (0%)

**Overall Confidence:**
- Minimum of classification and unsubscribe confidence
- Determines action status (confirmed/verification/skip)

### 3. Two-Mode Operation

#### Preview Mode
- Analyzes all emails
- Generates action plan
- Shows confidence scores
- Identifies verification needs
- No actions executed
- User can review and modify

#### Execution Mode
- Processes confirmed actions
- Includes user-approved items
- Batch execution with progress
- Real-time logging
- Error isolation
- Completion notification

### 4. Graceful Error Handling

**Design Principles:**
- Errors don't halt execution
- Per-item error tracking
- Detailed error messages
- Retry logic (future)
- Comprehensive error reporting

**Error Types Handled:**
- Network timeouts
- Invalid unsubscribe links
- Rate limiting
- Server errors
- Malformed responses

### 5. Extensible Architecture

**Plugin System (Future):**
- Email connectors (Gmail, Outlook, IMAP)
- LLM providers (OpenAI, Anthropic, local)
- Vector databases (Pinecone, Weaviate)
- Custom classification rules
- Webhook integrations

**Current Abstractions:**
- BaseAgent class for all agents
- Orchestrator for workflow management
- API layer for frontend/backend separation
- Job state persistence

## UI Features

### Upload View
- Drag-and-drop file upload
- File validation
- Multiple sample datasets
- Email count preview
- Clean, modern design

### Preview View
- Comprehensive statistics dashboard
- Color-coded confidence bars
- Tabbed action categories
- Interactive verification checkboxes
- Select all functionality
- Detailed reason display

### Execution View
- Real-time progress bar
- Live log streaming
- Batch progress tracking
- Color-coded log entries
- Completion notification
- Auto-navigation to results

### Results View
- Success rate visualization
- Detailed action tables
- Error breakdown
- Report download buttons
- Start over functionality
- Responsive design

## Technical Highlights

### Performance
- Batch processing for scalability
- Async/await throughout
- Efficient state management
- Minimal re-renders
- Optimized API calls

### Security
- Input validation
- XSS prevention
- CORS configuration
- Error sanitization
- No sensitive data exposure

### Maintainability
- Modular architecture
- Clear separation of concerns
- Comprehensive logging
- Self-documenting code
- Consistent patterns

### Testing Ready
- Isolated agent logic
- Mock-friendly design
- Deterministic rules
- Configurable thresholds
- Sample datasets included

## Metrics & Analytics

### Resolution Metrics
- Rules-resolved count
- LLM-resolved count (future)
- Verification required count
- Skip count

### Execution Metrics
- Total actions
- Success count
- Failure count
- Success rate percentage
- Average confidence score

### Performance Metrics
- Processing time per email
- Batch execution time
- API response times
- Error rate

## Future Enhancements

### Phase 2: Real Integration
- Gmail API connector
- OAuth authentication
- Real unsubscribe execution
- Email archiving
- Label management

### Phase 3: AI Enhancement
- LLM integration for ambiguous cases
- Semantic similarity search
- Learning from user feedback
- Confidence calibration
- Custom rule generation

### Phase 4: Advanced Features
- Bulk operations dashboard
- Historical analytics
- Scheduled cleanups
- Email preview with HTML
- Mobile app
- Browser extension

### Phase 5: Enterprise
- Multi-user support
- Team dashboards
- Audit logs
- Compliance reporting
- API access
- Webhook integrations
