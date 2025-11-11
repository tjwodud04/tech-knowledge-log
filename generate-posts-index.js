// Generate posts.json from markdown and HTML files in posts/ directory
const fs = require('fs');
const path = require('path');

const postsDir = './posts';

function extractFrontMatter(content) {
  const lines = content.split('\n');
  const title = lines.find(l => l.startsWith('# '))?.replace('# ', '').trim() || 'Untitled';
  const excerpt = lines.find(l => l.length > 20 && !l.startsWith('#'))?.trim().slice(0, 150) || '';
  return { title, excerpt };
}

function extractFromHTML(content) {
  const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : 'Untitled';

  const metaMatch = content.match(/<meta\s+name="description"\s+content="([^"]+)"/);
  const excerpt = metaMatch ? metaMatch[1].slice(0, 150) : '';

  return { title, excerpt };
}

function scanDirectory(dir, category, posts) {
  if (!fs.existsSync(dir)) return;

  const items = fs.readdirSync(dir, { withFileTypes: true });

  items.forEach(item => {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      // Recursively scan subdirectories
      scanDirectory(fullPath, category, posts);
    } else if (item.name.endsWith('.md')) {
      // Markdown file
      const content = fs.readFileSync(fullPath, 'utf-8');
      const { title, excerpt } = extractFrontMatter(content);

      const dateMatch = item.name.match(/^(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : '2025-01-01';

      const relPath = path.relative(postsDir, fullPath);
      const htmlPath = relPath.replace('.md', '.html');

      posts.push({
        title,
        date,
        category,
        url: `posts/${htmlPath.replace(/\\/g, '/')}`,
        excerpt
      });
    } else if (item.name.endsWith('.html')) {
      // HTML file (check if corresponding .md doesn't exist)
      const mdPath = fullPath.replace('.html', '.md');
      if (!fs.existsSync(mdPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const { title, excerpt } = extractFromHTML(content);

        const dateMatch = item.name.match(/^(\d{4}-\d{2}-\d{2})/);
        const date = dateMatch ? dateMatch[1] : '2025-11-10';

        const relPath = path.relative(postsDir, fullPath);

        posts.push({
          title,
          date,
          category,
          url: `posts/${relPath.replace(/\\/g, '/')}`,
          excerpt
        });
      }
    }
  });
}

function scanPosts() {
  const posts = [];

  // Scan cs-fundamentals
  scanDirectory(path.join(postsDir, 'cs-fundamentals'), 'cs-fundamentals', posts);

  // Scan papers
  scanDirectory(path.join(postsDir, 'papers'), 'papers', posts);

  // Sort by date descending
  posts.sort((a, b) => b.date.localeCompare(a.date));

  return { posts };
}

// Generate posts.json
const data = scanPosts();
fs.writeFileSync('./posts.json', JSON.stringify(data, null, 2));
console.log(`Generated posts.json with ${data.posts.length} posts`);
