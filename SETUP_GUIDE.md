# Tech Knowledge Log - Setup Guide

## Step 1: GitHub Repository Setup

### 1.1 Create Repository on GitHub
1. Go to https://github.com/new
2. Settings:
   - **Repository name**: `tech-knowledge-log`
   - **Description**: `Daily AI/CS insights in bite-sized, 1-minute reads`
   - **Visibility**: Public (required for GitHub Pages)
   - **DO NOT initialize** with README, .gitignore, or license
3. Click "Create repository"

### 1.2 Initialize Local Git and Push

Run these commands in `d:\automation_trial`:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Tech Knowledge Log setup

- Jekyll site configuration
- Content index system with duplicate prevention
- n8n workflow guide with 2025 best practices
- 50+ curated topics database for fundamentals
- Example posts (fundamentals and papers)"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/tech-knowledge-log.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

**Expected output:**
```
Enumerating objects: XX, done.
Counting objects: 100% (XX/XX), done.
Delta compression using up to X threads
Compressing objects: 100% (XX/XX), done.
Writing objects: 100% (XX/XX), X.XX KiB | X.XX MiB/s, done.
Total XX (delta X), reused 0 (delta 0)
To https://github.com/YOUR_USERNAME/tech-knowledge-log.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

## Step 2: Enable GitHub Pages

### 2.1 Configure Pages
1. Go to repository Settings
2. Left sidebar → **Pages**
3. Under "Build and deployment":
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/ (root)`
4. Click **Save**

### 2.2 Wait for Build (2-5 minutes)
- GitHub will automatically build your Jekyll site
- Check build status: Actions tab → Pages build and deployment

### 2.3 Verify Site
- Your site will be live at: `https://YOUR_USERNAME.github.io/tech-knowledge-log`
- Click the "Visit site" button in Pages settings

**Expected result:**
- Homepage displays with "Tech Knowledge Log" title
- Shows latest posts section (currently example posts)
- Archive page accessible

## Step 3: Post-Setup Verification

### 3.1 Check Local Structure
```bash
# Verify all files are committed
git status
# Should show: "nothing to commit, working tree clean"

# View commit history
git log --oneline
```

### 3.2 Verify GitHub Pages Build
Go to Actions tab and check for:
- ✅ **pages build and deployment** workflow succeeded
- If failed, check error logs

### 3.3 Test Content Index
```bash
# Test duplicate checker
node scripts/check-duplicate.js
```

## Step 4: Prepare for n8n Integration

### 4.1 Generate GitHub Personal Access Token
1. GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Settings:
   - **Note**: `tech-knowledge-log-n8n`
   - **Expiration**: 90 days (or custom)
   - **Scopes**:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (Update GitHub Action workflows)
4. Click "Generate token"
5. **IMPORTANT**: Copy token immediately (you won't see it again)
6. Store in password manager or n8n credentials

### 4.2 Set Up Slack Webhook
1. Go to https://api.slack.com/apps
2. Create New App → From scratch
3. Name: "Tech Knowledge Log Bot"
4. Select your workspace
5. Features → Incoming Webhooks → Activate
6. Add New Webhook to Workspace → Select channel
7. Copy webhook URL (starts with `https://hooks.slack.com/services/...`)
8. Store securely

### 4.3 Get API Keys
- **Anthropic (Claude)**: https://console.anthropic.com/settings/keys
- **OpenAI (Optional)**: https://platform.openai.com/api-keys

## Step 5: Update Configuration Files

### 5.1 Update _config.yml
Edit `_config.yml` with your GitHub username:

```yaml
url: "https://YOUR_USERNAME.github.io"
baseurl: "/tech-knowledge-log"
```

### 5.2 Commit and Push
```bash
git add _config.yml
git commit -m "Update site URL configuration"
git push
```

## Troubleshooting

### Issue: Git push asks for credentials repeatedly
**Solution**: Set up credential helper
```bash
# For Windows
git config --global credential.helper wincred

# For Mac/Linux
git config --global credential.helper cache
```

### Issue: GitHub Pages build fails
**Common causes:**
1. Check Jekyll syntax in `_config.yml`
2. Verify no invalid frontmatter in posts
3. Check Actions tab for detailed error logs

**Quick fix:**
```bash
# Test Jekyll build locally (requires Ruby)
bundle install
bundle exec jekyll serve
# Visit http://localhost:4000/tech-knowledge-log
```

### Issue: 403 error when pushing
**Solution**: Check GitHub token or SSH key permissions
```bash
# Use personal access token
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/tech-knowledge-log.git

# Or use SSH
git remote set-url origin git@github.com:YOUR_USERNAME/tech-knowledge-log.git
```

## Next Steps

After completing setup:

1. ✅ Repository created and pushed
2. ✅ GitHub Pages enabled and built
3. ✅ API keys obtained
4. → Proceed to [N8N_WORKFLOW_GUIDE.md](./N8N_WORKFLOW_GUIDE.md) for automation setup

## Quick Reference

### Common Git Commands
```bash
# Check status
git status

# Pull latest changes
git pull origin main

# Add and commit
git add .
git commit -m "Your message"

# Push to GitHub
git push origin main

# View remote URL
git remote -v
```

### Local Testing
```bash
# Test duplicate checker
node scripts/check-duplicate.js

# Check topics database
node -e "console.log(JSON.parse(require('fs').readFileSync('./scripts/topics-database.json')).metadata)"
```
