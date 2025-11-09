# Tech Knowledge Log - Documentation

## Setup

### 1. Create GitHub Repo
```bash
# On GitHub: Create new repository 'tech-knowledge-log' (Public)

# Local setup
git init
git remote add origin https://github.com/YOUR_USERNAME/tech-knowledge-log.git
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

### 2. Enable GitHub Pages
- Settings → Pages → Source: main / (root) → Save
- Site: `https://YOUR_USERNAME.github.io/tech-knowledge-log`

### 3. Configure n8n
```
# Import workflow
1. n8n → Workflows → Import from File
2. Upload: tech-knowledge-log-workflow.json

# Set credentials
- OpenAI API: https://platform.openai.com/api-keys
- GitHub Token: Settings → Developer settings → Tokens (repo, workflow)
- Slack Bot Token: https://api.slack.com/apps

# Update placeholders
- REPLACE_ME_GH_OWNER → your GitHub username
- REPLACE_ME_REPO → tech-knowledge-log
- REPLACE_ME_SLACK_CHANNEL → #your-channel
- REPLACE_ME_*_CRED_ID → select your credentials
```

### 4. Test & Activate
- Click "Execute Workflow" → Check green checks
- Toggle "Active" ON
- Monitor: Executions tab

---

## File Structure

```
tech-knowledge-log/
├── bites/               # 30s mini notes (Mon/Wed/Fri)
├── papers/              # Paper digests (Tue/Thu/Sat)
├── content-index.json   # Duplicate tracking
├── _config.yml          # Jekyll config
├── index.md             # Homepage
├── archive.md           # All posts
└── tech-knowledge-log-workflow.json  # n8n workflow
```

---

## Content Schedule

**Bites (Mon/Wed/Fri 09:30)**
- 30-60s reads on CS/AI/Language/Speech fundamentals
- Topics from `bites/_pool.md` or fallback list
- GPT-4 generated, 120-150 words

**Papers (Tue/Thu/Sat 09:45)**
- 4-sentence ultra-compressed paper summaries
- Sources: arXiv + ACL Anthology + HuggingFace Daily
- Priority: Dialogue > Speech > Language
- Duplicate check via Jaccard similarity (threshold: 0.8)

---

## Customization

### Change Topics Pool
Edit `bites/_pool.md`:
```markdown
- Tokenization vs. Embeddings
- What is VAD?
- Greedy vs Beam Search
```

### Adjust Priority Keywords
Edit `Rank & Pick One` node:
```javascript
const key = [
  {k:/dialogue|conversation/i, w:3},  // highest priority
  {k:/speech|asr|tts/i, w:2},
  {k:/language|nlp|llm/i, w:1}
];
```

### Change Schedule
Edit Cron nodes:
```javascript
// Bites: Mon/Wed/Fri 09:30
{ hour: 9, minute: 30, weekday: "monday" }

// Papers: Tue/Thu/Sat 09:45
{ hour: 9, minute: 45, weekday: "tuesday" }
```

---

## Troubleshooting

**Duplicate false positives**
- Lower threshold in `Duplicate Check` node: `s>=0.8` → `s>=0.9`

**No papers found**
- Check arXiv/ACL/HF are accessible
- Try broader categories: `cat:cs.CL+OR+cat:cs.AI`

**Slack not notifying**
- Verify Bot Token has `chat:write` scope
- Check channel name matches exactly

**GitHub commit failed**
- Token needs `repo` scope
- Branch must be `main` (or update workflow)

---

## Cost Estimate

- **OpenAI**: ~$3-5/month (GPT-4, 90 requests)
- **n8n Cloud**: $20/month (or free self-hosted)
- **GitHub**: Free
- **Slack**: Free

**Total**: $23-25/month (Cloud) or $3-5/month (Self-hosted)
