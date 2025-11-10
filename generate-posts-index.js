// Generate posts.json from markdown files in posts/ directory
const fs = require('fs');
const path = require('path');

const postsDir = './posts';
const categories = ['cs-fundamentals', 'papers'];

function extractFrontMatter(content) {
  const lines = content.split('\n');
  const title = lines.find(l => l.startsWith('# '))?.replace('# ', '').trim() || 'Untitled';
  const excerpt = lines.find(l => l.length > 20 && !l.startsWith('#'))?.trim().slice(0, 150) || '';
  return { title, excerpt };
}

function scanPosts() {
  const posts = [];

  categories.forEach(category => {
    const categoryPath = path.join(postsDir, category);
    if (!fs.existsSync(categoryPath)) return;

    const files = fs.readdirSync(categoryPath)
      .filter(f => f.endsWith('.md'))
      .sort().reverse(); // newest first

    files.forEach(file => {
      const filePath = path.join(categoryPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const { title, excerpt } = extractFrontMatter(content);

      // Extract date from filename (YYYY-MM-DD-title.md)
      const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : '2025-01-01';

      const htmlFile = file.replace('.md', '.html');

      posts.push({
        title,
        date,
        category,
        url: `posts/${category}/${htmlFile}`,
        excerpt
      });
    });
  });

  // Sort by date descending
  posts.sort((a, b) => b.date.localeCompare(a.date));

  return { posts };
}

// Generate posts.json
const data = scanPosts();
fs.writeFileSync('./posts.json', JSON.stringify(data, null, 2));
console.log(`Generated posts.json with ${data.posts.length} posts`);
