// Tech Knowledge Log - Interactive Features
// Smooth, modern interactions for the blog

(function() {
  'use strict';

  // Intersection Observer for fade-in animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        fadeInObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all fade-in elements
  document.addEventListener('DOMContentLoaded', () => {
    const fadeElements = document.querySelectorAll('.fade-in, .fade-in-up');
    fadeElements.forEach(el => fadeInObserver.observe(el));

    initializeSearch();
    initializeSmoothScroll();
    initializeHeaderScroll();
  });

  // Archive search functionality
  function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const archiveList = document.getElementById('archiveList');
    const noResults = document.getElementById('noResults');
    const archiveItems = archiveList ? archiveList.querySelectorAll('.archive-item') : [];

    searchInput.addEventListener('input', debounce(function(e) {
      const searchTerm = e.target.value.toLowerCase().trim();
      let visibleCount = 0;

      archiveItems.forEach(item => {
        const title = item.dataset.title || '';
        const date = item.dataset.date || '';
        const matchesSearch = title.includes(searchTerm) || date.includes(searchTerm);

        if (matchesSearch) {
          item.style.display = '';
          visibleCount++;
          // Highlight matching text
          highlightText(item, searchTerm);
        } else {
          item.style.display = 'none';
        }
      });

      // Show/hide no results message
      if (noResults) {
        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
      }
    }, 300));
  }

  // Highlight search matches
  function highlightText(element, searchTerm) {
    if (!searchTerm) {
      // Remove existing highlights
      const highlighted = element.querySelectorAll('.highlight');
      highlighted.forEach(span => {
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

  // Smooth scroll for anchor links
  function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  // Header scroll effect
  function initializeHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    let lastScroll = 0;
    const scrollThreshold = 100;

    window.addEventListener('scroll', throttle(() => {
      const currentScroll = window.pageYOffset;

      if (currentScroll > scrollThreshold) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }

      lastScroll = currentScroll;
    }, 100));
  }

  // Utility: Debounce function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Utility: Throttle function
  function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Utility: Escape regex special characters
  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Add loading state removal
  window.addEventListener('load', () => {
    document.body.classList.add('loaded');
  });

})();
