# Scripts for Content Management

## check-duplicate.js

Prevents duplicate content in tech-knowledge-log.

### Features
- Exact ArXiv ID matching for papers
- Keyword similarity (Jaccard Index)
- Title similarity detection
- Configurable thresholds (75% for blocking)

### Usage in n8n

**Node Setup:**
1. Add "Execute Command" or "Function" node
2. Load this script before post creation

**Example n8n Function Node:**
```javascript
const DuplicateChecker = require('./scripts/check-duplicate.js');
const checker = new DuplicateChecker();

const newContent = {
  type: $json.type, // 'fundamental' or 'paper'
  title: $json.title,
  keywords: $json.keywords,
  arxiv_id: $json.arxiv_id || null
};

const result = checker.checkDuplicate(newContent);

if (result.isDuplicate) {
  throw new Error(`Duplicate detected: ${result.reason}`);
}

return { json: { ...newContent, duplicateCheck: result } };
```

**Workflow Integration:**
```
[Trigger] → [Content Generator] → [Duplicate Check] → [IF: isDuplicate]
                                                          ↓
                                                      [Yes: Alert to Slack]
                                                      [No: Create Post → Push to GitHub]
```

### Thresholds
- **Block threshold**: 0.75 (75% similarity)
- **Warning threshold**: 0.60 (60% similarity)
- **Keyword weight**: 60%
- **Title weight**: 40%

### Updating Index
After successful post creation, update the index:
```javascript
checker.addContent({
  type: 'fundamental',
  id: '20251109-001',
  date: '2025-11-09',
  title: 'Attention Mechanism',
  topic: 'Deep Learning',
  keywords: ['attention', 'transformer'],
  file_path: 'posts/fundamentals/2025-11-09-attention-mechanism.md',
  hash: 'abc123...'
});
```
