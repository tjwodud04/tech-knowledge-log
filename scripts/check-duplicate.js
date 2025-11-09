/**
 * Content Duplicate Checker
 * Prevents duplicate topics/papers in tech-knowledge-log
 *
 * Usage in n8n:
 * - Run before creating new post
 * - Returns similarity score and duplicate status
 */

const fs = require('fs');
const crypto = require('crypto');

class DuplicateChecker {
  constructor(indexPath = './content-index.json') {
    this.indexPath = indexPath;
    this.index = this.loadIndex();
  }

  loadIndex() {
    try {
      return JSON.parse(fs.readFileSync(this.indexPath, 'utf8'));
    } catch (error) {
      console.error('Failed to load index:', error.message);
      return { fundamentals: [], papers: [], tags: { topics: [], keywords: [] } };
    }
  }

  saveIndex() {
    this.index.metadata.last_updated = new Date().toISOString().split('T')[0];
    fs.writeFileSync(this.indexPath, JSON.stringify(this.index, null, 2));
  }

  /**
   * Generate content hash for exact duplicate detection
   */
  generateHash(content) {
    return crypto.createHash('sha256').update(content.toLowerCase()).digest('hex');
  }

  /**
   * Calculate keyword similarity (Jaccard Index)
   */
  calculateKeywordSimilarity(keywords1, keywords2) {
    const set1 = new Set(keywords1.map(k => k.toLowerCase()));
    const set2 = new Set(keywords2.map(k => k.toLowerCase()));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Calculate title similarity (basic word overlap)
   */
  calculateTitleSimilarity(title1, title2) {
    const words1 = new Set(title1.toLowerCase().split(/\s+/));
    const words2 = new Set(title2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Check if new content is duplicate
   * @param {Object} newContent - { type, title, keywords, arxiv_id }
   * @returns {Object} - { isDuplicate, reason, similarPosts, maxSimilarity }
   */
  checkDuplicate(newContent) {
    const { type, title, keywords, arxiv_id } = newContent;
    const collection = type === 'fundamental' ? this.index.fundamentals : this.index.papers;

    // Check exact ArXiv ID match for papers
    if (type === 'paper' && arxiv_id) {
      const exactMatch = collection.find(post => post.arxiv_id === arxiv_id);
      if (exactMatch) {
        return {
          isDuplicate: true,
          reason: 'Exact ArXiv ID match',
          similarPosts: [exactMatch],
          maxSimilarity: 1.0
        };
      }
    }

    // Check similarity
    const similarPosts = [];
    let maxSimilarity = 0;

    for (const post of collection) {
      const keywordSim = this.calculateKeywordSimilarity(keywords, post.keywords);
      const titleSim = this.calculateTitleSimilarity(title, post.title);

      // Weighted similarity: 60% keywords, 40% title
      const similarity = keywordSim * 0.6 + titleSim * 0.4;

      if (similarity > 0.6) { // Threshold for similarity
        similarPosts.push({
          ...post,
          similarity: similarity.toFixed(2)
        });
        maxSimilarity = Math.max(maxSimilarity, similarity);
      }
    }

    return {
      isDuplicate: maxSimilarity > 0.75, // High threshold for blocking
      reason: maxSimilarity > 0.75 ? 'High content similarity' : 'OK',
      similarPosts: similarPosts.sort((a, b) => b.similarity - a.similarity),
      maxSimilarity: maxSimilarity.toFixed(2)
    };
  }

  /**
   * Add new content to index
   */
  addContent(content) {
    const { type, id, date, title, keywords, file_path, hash } = content;
    const collection = type === 'fundamental' ? 'fundamentals' : 'papers';

    this.index[collection].push(content);

    // Update tags
    keywords.forEach(kw => {
      if (!this.index.tags.keywords.includes(kw)) {
        this.index.tags.keywords.push(kw);
      }
    });

    this.index.metadata.total_posts += 1;
    this.saveIndex();
  }
}

// Example usage for n8n
if (require.main === module) {
  const checker = new DuplicateChecker();

  // Example: Check new fundamental post
  const newPost = {
    type: 'fundamental',
    title: 'Attention Mechanism Explained',
    keywords: ['attention', 'transformer', 'neural networks'],
    arxiv_id: null
  };

  const result = checker.checkDuplicate(newPost);
  console.log(JSON.stringify(result, null, 2));
}

module.exports = DuplicateChecker;
