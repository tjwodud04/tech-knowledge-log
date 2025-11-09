# Tech Knowledge Log

Curated AI/CS knowledge in bite-sized, 1-minute reads.

## Schedule
- **Mon/Wed/Fri**: AI & CS fundamentals
- **Tue/Thu/Sat**: Trending papers (Dialog Systems > Speech > NLP)

## GitHub Sync Instructions

### Initial Setup
```bash
# 1. Initialize git repository
git init

# 2. Add remote (replace with your GitHub repo URL)
git remote add origin https://github.com/YOUR_USERNAME/tech-knowledge-log.git

# 3. Initial commit
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

### Enable GitHub Pages
1. Go to repository Settings > Pages
2. Source: Deploy from branch `main` / folder `/ (root)`
3. Your site will be live at: `https://YOUR_USERNAME.github.io/tech-knowledge-log`

### Daily Sync (automated via n8n)
```bash
git pull origin main
git add posts/
git commit -m "Add new post: [TITLE]"
git push origin main
```

## Archive
All posts are tracked in [content-index.json](./content-index.json) to ensure uniqueness.

---

Last updated: 2025-11-09
