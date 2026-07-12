/**
 * Build script for the Tech Knowledge Log static site.
 *
 * Scans the `posts/` tree, extracts a title/date/excerpt from each post, and
 * writes `posts.json` — the index consumed by the front end (`script.js`) and
 * auto-committed by the `generate-posts.yml` GitHub Actions workflow.
 *
 * Run from the repository root:  `node generate-posts-index.js`
 *
 * The output shape is a workflow contract and must stay stable:
 *   { "posts": [ { title, date, category, url, excerpt }, ... ] }
 */

import { access, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

// --- Configuration ---------------------------------------------------------

/** Repository root — this script lives at the project root. */
const ROOT_DIR = import.meta.dirname;

/** Directory scanned for post files. */
const POSTS_DIR = join(ROOT_DIR, 'posts');

/** Generated index file (relative to the project root). */
const OUTPUT_FILE = join(ROOT_DIR, 'posts.json');

/** Category sub-directories to scan, in tie-break priority order. */
const CATEGORIES = ['cs-fundamentals', 'papers'];

/** Maximum excerpt length, in characters. */
const EXCERPT_MAX_LENGTH = 150;

/** Minimum length for a Markdown line to qualify as the excerpt. */
const MIN_EXCERPT_LINE_LENGTH = 20;

/** Fallback dates used when a filename has no leading `YYYY-MM-DD`. */
const DEFAULT_DATE = { markdown: '2025-01-01', html: '2025-11-10' };

/** Leading `YYYY-MM-DD` date embedded in a post's filename. */
const FILENAME_DATE_PATTERN = /^(\d{4}-\d{2}-\d{2})/;

/** First `<h1>` element in an HTML post (used for the title). */
const HTML_TITLE_PATTERN = /<h1[^>]*>(.*?)<\/h1>/;

/** `<meta name="description">` content in an HTML post (used for the excerpt). */
const HTML_DESCRIPTION_PATTERN = /<meta\s+name="description"\s+content="([^"]+)"/;

/** Fallback title when none can be extracted. */
const DEFAULT_TITLE = 'Untitled';

// --- Metadata parsing ------------------------------------------------------

/**
 * Extract a title and excerpt from Markdown source.
 * Title comes from the first `# ` heading; excerpt from the first substantial
 * non-heading line.
 * @param {string} content Raw Markdown file contents.
 * @returns {{ title: string, excerpt: string }}
 */
function parseMarkdown(content) {
  const lines = content.split('\n');
  const title = lines.find((line) => line.startsWith('# '))?.replace('# ', '').trim() || DEFAULT_TITLE;
  const excerpt = lines
    .find((line) => line.length > MIN_EXCERPT_LINE_LENGTH && !line.startsWith('#'))
    ?.trim()
    .slice(0, EXCERPT_MAX_LENGTH) || '';
  return { title, excerpt };
}

/**
 * Extract a title and excerpt from an HTML post.
 * Title comes from the first `<h1>`; excerpt from the `<meta name="description">`.
 * @param {string} content Raw HTML file contents.
 * @returns {{ title: string, excerpt: string }}
 */
function parseHtml(content) {
  const titleMatch = content.match(HTML_TITLE_PATTERN);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : DEFAULT_TITLE;

  const descriptionMatch = content.match(HTML_DESCRIPTION_PATTERN);
  const excerpt = descriptionMatch ? descriptionMatch[1].slice(0, EXCERPT_MAX_LENGTH) : '';

  return { title, excerpt };
}

// --- Helpers ---------------------------------------------------------------

/**
 * Read the leading date from a post filename, falling back when absent.
 * @param {string} fileName
 * @param {string} fallback
 * @returns {string} A `YYYY-MM-DD` date string.
 */
function extractDate(fileName, fallback) {
  const match = fileName.match(FILENAME_DATE_PATTERN);
  return match ? match[1] : fallback;
}

/**
 * Convert a path relative to {@link POSTS_DIR} into a web URL, using forward
 * slashes on every platform.
 * @param {string} relativePath
 * @returns {string}
 */
function toPostUrl(relativePath) {
  return `posts/${relativePath.replace(/\\/g, '/')}`;
}

/**
 * Whether a file exists on disk.
 * @param {string} filePath
 * @returns {Promise<boolean>}
 */
async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

// --- Post builders ---------------------------------------------------------

/**
 * Build a post entry from a Markdown file.
 * @param {string} fullPath Absolute path to the `.md` file.
 * @param {string} fileName Basename of the file.
 * @param {string} category Owning category.
 * @returns {Promise<object>} A post index entry.
 */
async function buildMarkdownPost(fullPath, fileName, category) {
  const content = await readFile(fullPath, 'utf-8');
  const { title, excerpt } = parseMarkdown(content);
  const date = extractDate(fileName, DEFAULT_DATE.markdown);
  const relativeHtmlPath = relative(POSTS_DIR, fullPath).replace('.md', '.html');

  return { title, date, category, url: toPostUrl(relativeHtmlPath), excerpt };
}

/**
 * Build a post entry from an HTML file. Skipped when a sibling `.md` exists,
 * so the Markdown source stays the single source of truth.
 * @param {string} fullPath Absolute path to the `.html` file.
 * @param {string} fileName Basename of the file.
 * @param {string} category Owning category.
 * @returns {Promise<object|null>} A post index entry, or `null` if skipped.
 */
async function buildHtmlPost(fullPath, fileName, category) {
  const markdownPath = fullPath.replace('.html', '.md');
  if (await fileExists(markdownPath)) return null;

  const content = await readFile(fullPath, 'utf-8');
  const { title, excerpt } = parseHtml(content);
  const date = extractDate(fileName, DEFAULT_DATE.html);
  const relativePath = relative(POSTS_DIR, fullPath);

  return { title, date, category, url: toPostUrl(relativePath), excerpt };
}

// --- Scanning --------------------------------------------------------------

/**
 * Recursively scan a directory, collecting post entries in traversal order
 * (depth-first, following the filesystem's directory ordering).
 * @param {string} dir Directory to scan.
 * @param {string} category Category these posts belong to.
 * @returns {Promise<object[]>} Post entries found under `dir`.
 */
async function scanDirectory(dir, category) {
  const posts = [];

  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return posts; // Missing directory: nothing to collect.
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      posts.push(...(await scanDirectory(fullPath, category)));
    } else if (entry.name.endsWith('.md')) {
      posts.push(await buildMarkdownPost(fullPath, entry.name, category));
    } else if (entry.name.endsWith('.html')) {
      const post = await buildHtmlPost(fullPath, entry.name, category);
      if (post) posts.push(post);
    }
  }

  return posts;
}

/**
 * Scan every configured category and return the sorted index.
 * Posts are ordered newest-first; ties keep scan order (stable sort).
 * @returns {Promise<{ posts: object[] }>}
 */
async function buildIndex() {
  const posts = [];
  for (const category of CATEGORIES) {
    posts.push(...(await scanDirectory(join(POSTS_DIR, category), category)));
  }

  posts.sort((a, b) => b.date.localeCompare(a.date));

  return { posts };
}

// --- Entry point -----------------------------------------------------------

/** Build the index and write it to {@link OUTPUT_FILE}. */
async function main() {
  const data = await buildIndex();
  await writeFile(OUTPUT_FILE, JSON.stringify(data, null, 2));
  console.log(`Generated posts.json with ${data.posts.length} posts`);
}

await main();
