/**
 * Blog search, filter, and sort functionality.
 * Handles:
 * - Keyword search (title + description)
 * - Tag filtering (click filter buttons or inline tags)
 * - Date sorting (newest/oldest)
 * - Direct linking to posts via URL hash (#post-1000)
 * - Copy link button
 */
(() => {
  const container = document.querySelector('[data-blog-container]');
  if (!container) return;

  const searchInput = document.querySelector('.blog-search');
  const sortSelect = document.querySelector('.blog-sort');
  const filterTags = document.querySelectorAll('.blog-filter-tag');
  const noResults = document.querySelector('.blog-no-results');
  const posts = [...container.querySelectorAll('.blog-post')];

  if (posts.length === 0) return;

  /**
   * Switch to the blog tab (if using tabbed navigation).
   */
  const switchToBlogTab = () => {
    // Try desktop tabs first
    const blogTab = document.querySelector('.tabs button[data-tab="blog"]');
    if (blogTab instanceof HTMLButtonElement) {
      blogTab.click();
      return;
    }
    // Try mobile tabs
    const mobileBlogTab = document.querySelector('.mobile-tabs button[data-tab="blog"]');
    if (mobileBlogTab instanceof HTMLButtonElement) {
      mobileBlogTab.click();
    }
  };

  /**
   * Open a post by its ID and scroll to it.
   */
  const openPostById = (postId) => {
    const post = document.getElementById(postId);
    if (post) {
      // First, switch to the blog tab
      switchToBlogTab();
      
      // Open the post
      post.open = true;
      
      // Small delay to ensure the section is visible and rendered before scrolling
      setTimeout(() => {
        post.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  };

  /**
   * Handle URL hash on page load.
   */
  const handleHash = () => {
    const hash = window.location.hash.slice(1); // Remove the #
    if (hash && hash.startsWith('post-')) {
      openPostById(hash);
    }
  };

  // Check hash on load
  handleHash();

  // Listen for hash changes (e.g., back/forward navigation)
  window.addEventListener('hashchange', handleHash);

  let activeTag = '';
  let searchQuery = '';
  let sortOrder = 'newest';

  /**
   * Filter and sort posts based on current state.
   */
  const updateView = () => {
    const query = searchQuery.toLowerCase().trim();
    let visibleCount = 0;

    // Sort posts
    const sorted = [...posts].sort((a, b) => {
      const dateA = parseInt(a.dataset.date || '0', 10);
      const dateB = parseInt(b.dataset.date || '0', 10);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // Re-append in sorted order
    sorted.forEach((post) => container.appendChild(post));

    // Filter posts
    sorted.forEach((post) => {
      const title = post.dataset.title || '';
      const description = post.dataset.description || '';
      const tags = post.dataset.tags || '';

      const matchesSearch = !query || title.includes(query) || description.includes(query);
      const matchesTag = !activeTag || tags.split(',').includes(activeTag.toLowerCase());

      if (matchesSearch && matchesTag) {
        post.hidden = false;
        visibleCount++;
      } else {
        post.hidden = true;
        post.removeAttribute('open');
      }
    });

    // Show/hide no results message
    if (noResults) {
      noResults.hidden = visibleCount > 0;
    }
  };

  // Search input handler (debounced)
  let searchTimeout = null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchQuery = e.target.value;
        updateView();
      }, 150);
    });

    // Clear search on Escape
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        searchQuery = '';
        updateView();
      }
    });
  }

  // Sort select handler
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      sortOrder = e.target.value;
      updateView();
    });
  }

  // Filter tag buttons
  const setActiveTag = (tag) => {
    activeTag = tag;
    filterTags.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tag === tag);
    });
    updateView();
  };

  filterTags.forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveTag(btn.dataset.tag || '');
    });
  });

  // Inline tag clicks (within posts)
  container.addEventListener('click', (e) => {
    const tagBtn = e.target.closest('[data-tag-click]');
    if (!tagBtn) return;

    e.preventDefault();
    e.stopPropagation();

    const tag = tagBtn.dataset.tagClick;
    setActiveTag(tag.toLowerCase());
  });

  /**
   * Show a "Copied!" tooltip under the button.
   */
  const showCopiedTooltip = (btn) => {
    // Remove any existing tooltip
    const existing = btn.querySelector('.blog-copied-tooltip');
    if (existing) existing.remove();

    // Create tooltip
    const tooltip = document.createElement('span');
    tooltip.className = 'blog-copied-tooltip';
    tooltip.textContent = 'Copied!';
    btn.appendChild(tooltip);

    // Fade out and remove after delay
    setTimeout(() => {
      tooltip.classList.add('fade-out');
      setTimeout(() => tooltip.remove(), 150);
    }, 1500);
  };

  // Copy link button clicks
  container.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('[data-copy-link]');
    if (!copyBtn) return;

    e.preventDefault();
    e.stopPropagation();

    const postId = copyBtn.dataset.copyLink;
    const url = `${window.location.origin}${window.location.pathname}#post-${postId}`;

    navigator.clipboard.writeText(url).then(() => {
      // Show feedback
      copyBtn.classList.add('copied');
      showCopiedTooltip(copyBtn);
      
      setTimeout(() => {
        copyBtn.classList.remove('copied');
      }, 2000);
    }).catch(() => {
      // Fallback: just update the URL hash
      window.location.hash = `post-${postId}`;
    });
  });
})();

