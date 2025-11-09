# n8n Workflow Guide for Tech Knowledge Log

## Overview

Automate content generation, duplicate checking, and GitHub publishing for tech-knowledge-log.

## Workflow Architecture (2025 Latest Pattern)

### Key Features
- **Batch collection**: Fetch 3 candidates per run
- **Retry logic**: Test each candidate sequentially until pass
- **Fallback**: Return to collection if all 3 fail
- **AI-powered**: Claude/GPT-4 for summarization
- **Error handling**: Circuit breaker with exponential backoff

```
┌─────────────┐
│  Schedule   │ (Cron: Mon/Wed/Fri 09:00, Tue/Thu/Sat 09:00)
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Day Switch     │ (Mon/Wed/Fri vs Tue/Thu/Sat)
└────┬──────┬─────┘
     │      │
     ▼      ▼
  [Fund]  [Paper]
     │      │
     └──────┴──────►┌──────────────────────┐
                    │ Content Scraper      │ (Fetch 3 candidates)
                    │ - ArXiv API          │
                    │ - Papers with Code   │
                    │ - HuggingFace Daily  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Set Variables        │
                    │ - candidates: [1,2,3]│
                    │ - retry_count: 0     │
                    │ - max_retries: 3     │
                    └──────────┬───────────┘
                               │
        ┌──────────────────────┴──────────────────────┐
        │                 RETRY LOOP                   │
        │                                              │
        ▼                                              │
  ┌──────────────────┐                                │
  │ Loop Over Items  │ (Process candidate #1, #2, #3)│
  └────────┬─────────┘                                │
           │                                           │
           ▼                                           │
  ┌──────────────────┐                                │
  │  AI Summarizer   │ (Claude 3.5 Sonnet)            │
  │  [Error: Continue]│                                │
  └────────┬─────────┘                                │
           │                                           │
           ▼                                           │
  ┌──────────────────┐                                │
  │ Duplicate Check  │ (check-duplicate.js)           │
  │  [Error: Continue]│                                │
  └────────┬─────────┘                                │
           │                                           │
           ▼                                           │
  ┌────────────────────┐                              │
  │ IF: Duplicate?     │                              │
  └────┬──────────┬────┘                              │
       │          │                                    │
  [Yes]│          │[No] ───────────► SUCCESS          │
       │          │                                    │
       ▼          ▼                                    │
  ┌─────────┐  ┌──────────────┐                       │
  │ Next    │  │ Create Post  │                       │
  │ Candi   │  │ (Markdown)   │                       │
  │ date    │  └──────┬───────┘                       │
  └────┬────┘         │                               │
       │              ▼                                │
       │       ┌──────────────┐                       │
       │       │ Update Index │                       │
       │       └──────┬───────┘                       │
       │              │                                │
       │   ┌──────────┼──────────┐                    │
       │   ▼          ▼          ▼                    │
       │ ┌────────┐┌────────┐┌────────┐              │
       │ │Git Add ││Git Push││ Slack  │              │
       │ └────────┘└────────┘└────────┘              │
       │                                               │
       └───────────────┐                              │
                       │                               │
                       ▼                               │
            ┌──────────────────┐                      │
            │ IF: All Failed?  │                      │
            └────┬────────┬────┘                      │
                 │        │                            │
           [Yes] │        │ [No: Has more candidates] │
                 │        └────────────────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Slack Alert     │ "All 3 candidates failed"
        │ Return to Start │ (Re-fetch new content)
        └─────────────────┘
```

## Required n8n Nodes

### 1. Schedule Trigger
```json
{
  "cron": "0 9 * * 1,3,5",
  "timezone": "Asia/Seoul"
}
```

### 2. Switch Node (Day of Week)
```javascript
// Output 1: Fundamentals (Mon/Wed/Fri)
// Output 2: Papers (Tue/Thu/Sat)
const day = new Date().getDay();
return [1, 3, 5].includes(day) ? [{ json: { type: 'fundamental' } }] : [];
```

### 3. HTTP Request - Content Scraper (Fetch 3 Candidates)

**For Papers (Tue/Thu/Sat):**
```javascript
// ArXiv API - Return 3 latest papers
URL: http://export.arxiv.org/api/query
Method: GET
Query:
  search_query: cat:cs.CL+OR+cat:cs.AI+OR+cat:cs.SD
  sortBy: lastUpdatedDate
  max_results: 3

// Parse and extract
items = $json.feed.entry.slice(0, 3).map((paper, idx) => ({
  candidate_id: idx + 1,
  type: 'paper',
  title: paper.title[0],
  arxiv_id: paper.id[0].split('/abs/')[1],
  abstract: paper.summary[0],
  category: paper.category[0].$.term.includes('CL') ? 'dialog' :
            paper.category[0].$.term.includes('SD') ? 'speech' : 'nlp',
  keywords: []
}));
```

**For Fundamentals (Mon/Wed/Fri):**
```javascript
// Curated topic rotation from predefined list
const topics = [
  { title: "Binary Search Trees", topic: "Data Structures", keywords: ["BST", "tree", "search"] },
  { title: "Gradient Descent", topic: "ML Basics", keywords: ["optimization", "gradient", "learning"] },
  { title: "Attention Mechanism", topic: "Deep Learning", keywords: ["attention", "transformer", "NLP"] },
  // ... 50+ topics in rotation
];

// Get next 3 unused topics
const used = require('./content-index.json').fundamentals.map(p => p.title);
const candidates = topics.filter(t => !used.includes(t.title)).slice(0, 3);

return candidates.map((topic, idx) => ({
  candidate_id: idx + 1,
  type: 'fundamental',
  ...topic
}));
```

### 4. Set Node - Initialize Loop Variables
```javascript
{
  "candidates": $json, // Array of 3 items
  "retry_count": 0,
  "max_retries": 3,
  "current_index": 0,
  "success": false
}
```

### 5. Loop Over Items Node
```
Input: {{ $json.candidates }}
Options:
  - "Continue on Error" ✓
  - "Batch Size": 1 (process one at a time)
```

### 6. AI Summarizer (OpenAI/Anthropic)
**Settings:** Error Output: Continue

```javascript
// Claude 3.5 Sonnet (Latest 2025 model)
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 600,
  "temperature": 0.7,
  "messages": [{
    "role": "user",
    "content": `Create a 1-minute read blog post:

    ${$json.type === 'paper' ? `
    Paper: {{$json.title}}
    ArXiv: {{$json.arxiv_id}}
    Abstract: {{$json.abstract}}

    Format:
    ## Paper Summary
    [2-3 sentence overview]

    ## Key Finding
    [Main result in plain language]

    ## Method
    [How they did it - 2 sentences]

    ## Impact
    [Why it matters]
    ` : `
    Topic: {{$json.title}}
    Category: {{$json.topic}}

    Explain this CS/AI concept in 30-60 seconds:
    - What it is (1 sentence)
    - Key concept (example or analogy)
    - Why it matters (practical impact)
    - One-liner summary
    `}

    Max 250 words. Use markdown. Be concise and engaging.`
  }]
}
```

### 7. Function Node - Duplicate Check
**Settings:** Error Output: Continue

```javascript
const DuplicateChecker = require('./scripts/check-duplicate.js');
const checker = new DuplicateChecker('./content-index.json');

// Extract keywords from AI summary
const keywords = $json.ai_summary.match(/\*\*([^*]+)\*\*/g)?.map(k =>
  k.replace(/\*\*/g, '').toLowerCase()
).slice(0, 5) || [];

const result = checker.checkDuplicate({
  type: $json.type,
  title: $json.title,
  keywords: [...keywords, ...$json.keywords],
  arxiv_id: $json.arxiv_id || null
});

if (result.isDuplicate) {
  // Throw error to trigger "Continue" path
  throw new Error(JSON.stringify({
    reason: 'DUPLICATE',
    similarity: result.maxSimilarity,
    similar_to: result.similarPosts[0]?.title
  }));
}

// Pass through if unique
return {
  json: {
    ...$json,
    ai_content: $json.ai_summary,
    keywords: keywords,
    duplicate_check: result
  }
};
```

### 8. IF Node - Check Duplicate Status
```javascript
// Condition 1: Success path (no error from duplicate check)
{{ $json.duplicate_check !== undefined }}

// Condition 2: Error path (duplicate detected)
// Will come from error output of duplicate check node
```

### 9. Function Node - Increment Counter & Loop Back
**Connected to:** Duplicate detected path

```javascript
// Track failed attempt
const currentIndex = $node["Set Variables"].json.current_index + 1;
const maxRetries = $node["Set Variables"].json.max_retries;

if (currentIndex < maxRetries) {
  // Try next candidate
  return {
    json: {
      ...items[currentIndex],
      current_index: currentIndex,
      previous_failure: $json.error
    }
  };
} else {
  // All 3 failed - trigger fallback
  throw new Error(JSON.stringify({
    reason: 'ALL_CANDIDATES_FAILED',
    failures: [/* array of all 3 failures */]
  }));
}
```

### 10. Function Node - Generate Post
```javascript
const fs = require('fs');
const date = new Date().toISOString().split('T')[0];
const slug = $json.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const filename = `posts/${$json.type}s/${date}-${slug}.md`;

const frontmatter = `---
layout: post
type: ${$json.type}
title: "${$json.title}"
date: ${date}
${$json.type === 'paper' ? `category: "${$json.category}"\narxiv_id: "${$json.arxiv_id}"` : `topic: "${$json.topic}"`}
keywords: ${JSON.stringify($json.keywords)}
reading_time: "1 min"
---

${$json.ai_content}
`;

fs.writeFileSync(filename, frontmatter);
return { json: { filename, content: frontmatter } };
```

### 11. Function Node - Update Index
```javascript
const fs = require('fs');
const crypto = require('crypto');
const indexPath = './content-index.json';
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

const hash = crypto.createHash('sha256').update($json.ai_content).digest('hex');
const id = `${$json.date.replace(/-/g, '')}-${String(index.metadata.total_posts + 1).padStart(3, '0')}`;

const entry = {
  id,
  date: $json.date,
  title: $json.title,
  keywords: $json.keywords,
  file_path: $json.filename,
  hash
};

if ($json.type === 'paper') {
  entry.arxiv_id = $json.arxiv_id;
  entry.category = $json.category;
  index.papers.push(entry);
} else {
  entry.topic = $json.topic;
  index.fundamentals.push(entry);
}

// Update global tags
$json.keywords.forEach(kw => {
  if (!index.tags.keywords.includes(kw)) {
    index.tags.keywords.push(kw);
  }
});

index.metadata.total_posts += 1;
index.metadata.last_updated = $json.date;

fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
return { json: $json };
```

### 12. Execute Command - Git Commit & Push
```bash
cd /path/to/tech-knowledge-log && \
git pull origin main && \
git add posts/ content-index.json && \
git commit -m "Add: {{$json.title}}" && \
git push origin main
```

### 13. Slack Webhook - Success Notification
```json
{
  "text": "✅ New post published: *{{$json.title}}*",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "📝 New Tech Knowledge Log Post"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Title:*\n{{$json.title}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Type:*\n{{$json.type === 'paper' ? '📄 Paper' : '💡 Fundamental'}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Category:*\n{{$json.category || $json.topic}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Keywords:*\n{{$json.keywords.join(', ')}}"
        }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "{{$json.ai_content.substring(0, 200)}}..."
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Read Full Post"
          },
          "url": "https://YOUR_USERNAME.github.io/tech-knowledge-log/{{$json.date.replace(/-/g, '/')}}/{{$json.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}}"
        }
      ]
    }
  ]
}
```

### 14. Slack Webhook - Failure Alert (All Candidates Failed)
**Triggered by:** Error output of retry loop

```json
{
  "text": "⚠️ All 3 candidates failed duplicate check",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "⚠️ Content Generation Failed"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*All 3 candidates were duplicates or failed validation*\n\nThe workflow will retry with fresh content in the next run."
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Failed Candidates:*"
        },
        {
          "type": "mrkdwn",
          "text": "1. {{$json.failures[0].title}} ({{$json.failures[0].similarity}}% similar)\n2. {{$json.failures[1].title}} ({{$json.failures[1].similarity}}% similar)\n3. {{$json.failures[2].title}} ({{$json.failures[2].similarity}}% similar)"
        }
      ]
    }
  ]
}
```

## Environment Variables

```env
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
GITHUB_TOKEN=your_token
SLACK_WEBHOOK_URL=your_webhook
REPO_PATH=/path/to/tech-knowledge-log
```

## Content Sources (2025 Recommendations)

### Fundamentals (Mon/Wed/Fri)
Create a curated list of 50+ topics and rotate through unused ones:
- **Algorithms**: Binary Search, Sorting, Dynamic Programming
- **Data Structures**: Trees, Graphs, Hash Tables, Heaps
- **ML Basics**: Gradient Descent, Backpropagation, Regularization
- **NLP Fundamentals**: Tokenization, Embeddings, Attention
- **CS Concepts**: Time Complexity, Recursion, Caching
- **System Design**: Load Balancing, Sharding, CAP Theorem

**Implementation:** Store in `scripts/topics-database.json` and track usage via content-index

### Papers (Tue/Thu/Sat)
1. **ArXiv API** (`cs.CL`, `cs.AI`, `cs.SD`) - Most reliable
2. **HuggingFace Daily Papers** (https://huggingface.co/papers) - Curated trending
3. **Papers with Code** (https://paperswithcode.com/latest) - With code implementations
4. **ACL Anthology** (https://aclanthology.org/) - Conference papers

**Priority Order:**
- **Dialog Systems** (cs.CL, cs.AI with keywords: dialog, conversation, chatbot)
- **Speech/Audio** (cs.SD, eess.AS)
- **General NLP** (cs.CL)

## 2025 Best Practices & Optimizations

### 1. Error Handling with Circuit Breaker
Implement exponential backoff for API failures:
```javascript
// In AI Summarizer node settings
Retry on Fail: true
Max Tries: 3
Wait Between Tries: 5000ms (exponential)
```

### 2. Parallel Processing (New in n8n 2024+)
Process multiple candidates simultaneously when possible:
```javascript
// Use SplitInBatches for concurrent checks
Node: Split In Batches
  Batch Size: 3
  Options: "Run Once for All Items" ✓
```

### 3. Caching Strategy
Cache ArXiv responses to reduce API calls:
```javascript
// Use Redis node for 1-hour cache
Node: Redis
  Operation: Get
  Key: arxiv_cache_{{TODAY}}
  TTL: 3600
```

### 4. AI Cost Optimization
- Use **Claude Haiku** for keyword extraction (cheaper)
- Use **Claude Sonnet** for full summarization (quality)
- Implement token counting before API calls

### 5. Security (CRITICAL)
```javascript
// Use n8n Credentials Manager for all sensitive data
// NEVER hardcode API keys in workflows
Credentials:
  - Anthropic API (Claude)
  - OpenAI API (GPT)
  - GitHub Personal Access Token
  - Slack Webhook URL
```

### 6. Monitoring & Alerting
Set up Error Workflow (n8n 2025 feature):
```
Workflow Settings > Error Workflow: "Tech-Log-Error-Handler"

Error Handler:
1. Error Trigger
2. Parse Error Details
3. Send Detailed Slack Alert
4. Log to File
5. (Optional) Retry with backoff
```

## Testing Locally

```bash
# Test duplicate checker
node scripts/check-duplicate.js

# Test n8n workflow (if using n8n CLI)
n8n execute --id=WORKFLOW_ID
```

## Monitoring

- **Slack alerts** for duplicates/errors
- **GitHub Actions** (optional) for build status
- **content-index.json** for audit trail

---

## Implementation Roadmap

### Phase 1: Setup (Day 1-2)
- [ ] Deploy n8n instance (Docker/Cloud)
- [ ] Create GitHub repository `tech-knowledge-log`
- [ ] Enable GitHub Pages
- [ ] Set up Slack workspace and webhook
- [ ] Configure n8n credentials (Claude, GitHub, Slack)

### Phase 2: Build Core Workflow (Day 3-5)
- [ ] Create content scraper nodes (ArXiv + topics list)
- [ ] Implement AI summarization (Claude/GPT)
- [ ] Add duplicate checker integration
- [ ] Build retry loop with 3-candidate system
- [ ] Set up Git automation

### Phase 3: Testing (Day 6-7)
- [ ] Manual trigger test (5+ runs)
- [ ] Test all 3 retry scenarios
- [ ] Validate duplicate detection
- [ ] Check Slack notifications
- [ ] Verify GitHub Pages updates

### Phase 4: Production (Week 2+)
- [ ] Enable schedule triggers
- [ ] Monitor first week (daily checks)
- [ ] Fine-tune similarity thresholds
- [ ] Optimize AI prompts
- [ ] Add content analytics

## Troubleshooting

### Common Issues

**1. All 3 Candidates Fail Duplicate Check**
- **Cause:** Limited content sources or high similarity threshold
- **Fix:** Lower threshold to 0.70 or add more diverse sources

**2. AI Summarization Timeout**
- **Cause:** Long abstracts or API rate limits
- **Fix:** Add timeout handling (30s) and retry logic

**3. Git Push Conflicts**
- **Cause:** Multiple workflow executions or manual edits
- **Fix:** Use `git pull --rebase` before push

**4. Slack Webhook 404**
- **Cause:** Expired or revoked webhook URL
- **Fix:** Regenerate webhook in Slack settings

## Cost Estimates (Monthly)

**API Costs:**
- Claude API: ~$5-10 (90 posts/month @ $0.10/post)
- GitHub: Free (public repo)
- n8n: Free (self-hosted) or $20 (cloud basic)
- Slack: Free

**Total:** ~$5-30/month depending on setup

## Advanced Features (Future)

1. **Multi-language Support** - Translate posts to Korean
2. **Email Digest** - Weekly summary via SendGrid
3. **Twitter Auto-post** - Share via Twitter API
4. **Analytics Dashboard** - Track views, engagement
5. **AI-powered Topic Suggestions** - Learn from popular posts
