/**
 * Tech Knowledge Log — front-end behaviour for the static GitHub Pages site.
 *
 * Organised into cohesive units: configuration, utilities, the data layer,
 * rendering, and interactive features (scroll-in animations, archive search,
 * smooth scrolling, header shadow). Everything is wired up on DOMContentLoaded.
 */
(function () {
  'use strict';

  /* ------------------------------ Configuration ----------------------------- */

  const SITE_BASE = '/tech-knowledge-log';
  const POSTS_INDEX_URL = `${SITE_BASE}/posts.json`;

  const LATEST_POSTS_LIMIT = 6; // posts shown on the home page
  const SEARCH_DEBOUNCE_MS = 300;
  const SCROLL_THROTTLE_MS = 100;
  const HEADER_SCROLL_THRESHOLD = 100; // px scrolled before the header gains a shadow

  const FADE_SELECTOR = '.fade-in, .fade-in-up';
  const FADE_OBSERVER_OPTIONS = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };

  /* -------------------------------- Utilities ------------------------------- */

  /** Delay `fn` until `wait` ms have passed without another call. */
  function debounce(fn, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /** Run `fn` at most once per `limit` ms. */
  function throttle(fn, limit) {
    let inThrottle = false;
    return function (...args) {
      if (inThrottle) return;
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    };
  }

  /** Escape a string for safe insertion as HTML text. */
  function escapeHtml(value) {
    const replacements = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return (value || '').replace(/[&<>"']/g, (char) => replacements[char]);
  }

  /** Escape a string for literal use inside a RegExp. */
  function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /* ------------------------------- Data layer ------------------------------- */

  /**
   * Fetch the generated posts index.
   * @returns {Promise<{ all: object[] }>} All posts, or an empty list on failure.
   */
  async function loadPostsIndex() {
    try {
      const response = await fetch(POSTS_INDEX_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch posts.json');
      const data = await response.json();
      return { all: data.posts || [] };
    } catch (error) {
      console.error(error);
      return { all: [] };
    }
  }

  /* -------------------------------- Rendering ------------------------------- */

  /** Render the newest posts as cards on the home page. */
  function renderLatestPosts(list, posts, limit = LATEST_POSTS_LIMIT) {
    if (!list) return;
    list.innerHTML = posts.slice(0, limit).map((post, index) => (
      `<li class="fade-in-up" style="animation-delay: ${index * 0.1}s;">
       <article class="post-item">
         <a class="post-link" href="${post.url}">${escapeHtml(post.title)}</a>
         <div class="post-meta">
           <time datetime="${post.date}">${post.date}</time>
           ${post.category ? ` · ${post.category}` : ''}
         </div>
         ${post.excerpt ? `<p class="post-excerpt">${escapeHtml(post.excerpt)}</p>` : ''}
       </article>
     </li>`
    )).join('');
  }

  /** Render the full post list on the archive page and update the counter. */
  function renderArchive(list, counter, posts) {
    if (!list) return;
    list.innerHTML = posts.map((post) => (
      `<li class="archive-item fade-in" data-title="${escapeHtml(post.title).toLowerCase()}" data-date="${post.date}">
       <strong class="archive-date">${post.date}</strong>
       <a href="${post.url}" class="archive-link">${escapeHtml(post.title)}</a>
     </li>`
    )).join('');
    if (counter) counter.textContent = `All ${posts.length} posts`;
  }

  /* --------------------------- Feature: animations -------------------------- */

  const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        fadeInObserver.unobserve(entry.target);
      }
    });
  }, FADE_OBSERVER_OPTIONS);

  /** Observe existing fade-in elements so they reveal on scroll. */
  function initFadeAnimations() {
    document.querySelectorAll(FADE_SELECTOR).forEach((el) => fadeInObserver.observe(el));
  }

  /* ----------------------------- Feature: search ---------------------------- */

  /** Wire up live filtering of the archive list. */
  function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const archiveList = document.getElementById('archiveList');
    const noResults = document.getElementById('noResults');
    const archiveItems = archiveList ? archiveList.querySelectorAll('.archive-item') : [];

    searchInput.addEventListener('input', debounce((event) => {
      const searchTerm = event.target.value.toLowerCase().trim();
      let visibleCount = 0;

      archiveItems.forEach((item) => {
        const title = item.dataset.title || '';
        const date = item.dataset.date || '';
        const matchesSearch = title.includes(searchTerm) || date.includes(searchTerm);

        if (matchesSearch) {
          item.style.display = '';
          visibleCount++;
          highlightText(item, searchTerm);
        } else {
          item.style.display = 'none';
        }
      });

      if (noResults) {
        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
      }
    }, SEARCH_DEBOUNCE_MS));
  }

  /** Wrap matches of `searchTerm` within an archive item in `.highlight`. */
  function highlightText(element, searchTerm) {
    if (!searchTerm) {
      element.querySelectorAll('.highlight').forEach((span) => {
        span.outerHTML = span.innerHTML;
      });
      return;
    }

    const link = element.querySelector('.archive-link');
    if (!link) return;

    const text = link.textContent;
    const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
    const highlightedText = text.replace(regex, '<span class="highlight">$1</span>');

    if (highlightedText !== text) {
      link.innerHTML = highlightedText;
    }
  }

  /* ------------------------- Feature: smooth scroll ------------------------- */

  /** Smoothly scroll to in-page anchor targets. */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function (event) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (target) {
          event.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ------------------------- Feature: header shadow ------------------------- */

  /** Toggle a shadow on the header once the page is scrolled. */
  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    window.addEventListener('scroll', throttle(() => {
      header.classList.toggle('scrolled', window.pageYOffset > HEADER_SCROLL_THRESHOLD);
    }, SCROLL_THROTTLE_MS));
  }

  /* ---------------------------------- Init ---------------------------------- */

  document.addEventListener('DOMContentLoaded', async () => {
    // Interactive features are initialised before data loads, matching the
    // original boot order (search binds against the not-yet-populated archive).
    initFadeAnimations();
    initSearch();
    initSmoothScroll();
    initHeaderScroll();

    const { all } = await loadPostsIndex();
    renderLatestPosts(document.getElementById('postList'), all);
    renderArchive(
      document.getElementById('archiveList'),
      document.getElementById('archiveCount'),
      all,
    );
  });

  // Reveal `.post-item` cards once all assets have loaded.
  window.addEventListener('load', () => document.body.classList.add('loaded'));
})();
