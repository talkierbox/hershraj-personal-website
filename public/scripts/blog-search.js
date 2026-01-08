/**
 * Blog search, filter, and sort functionality.
 * Handles:
 * - Keyword search (title + description)
 * - Tag filtering (click filter buttons or inline tags)
 * - Date sorting (newest/oldest)
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
})();

