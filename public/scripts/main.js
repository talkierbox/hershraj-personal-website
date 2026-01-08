(() => {
  // Change this list to control section/tab order.
  const order = ['research', 'blog', 'industry', 'projects', 'education', 'teaching', 'coursework', 'personal'];

  const tabBar = document.querySelector('.tabs');
  const content = document.querySelector('.content');
  if (!tabBar || !content) return;

  const sections = Object.fromEntries(
    [...document.querySelectorAll('.section')].map((s) => [s.id, s]),
  );

  // Build tabs + arrange sections in the chosen order
  let firstActiveId = null;

  order.forEach((id) => {
    const sec = sections[id];
    if (!sec) return;

    // Move section node into correct position
    content.appendChild(sec);

    // Create desktop tab
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = sec.dataset.title || sec.querySelector('h2')?.textContent || id;
    btn.dataset.tab = id;
    tabBar.appendChild(btn);

    if (!firstActiveId) {
      firstActiveId = id;
    }
  });

  // Check URL hash to determine which tab to activate
  const getTabFromHash = () => {
    const hash = window.location.hash.slice(1); // Remove the #
    if (!hash) return firstActiveId;
    
    // Direct section match (e.g., #blog)
    if (sections[hash]) return hash;
    
    // Check for post-id format (e.g., #post-1000) - activate blog tab
    if (hash.startsWith('post-')) return 'blog';
    
    return firstActiveId;
  };

  const initialTab = getTabFromHash();
  
  // Set initial active states
  [...tabBar.children].forEach((btn) => {
    if (btn.dataset.tab === initialTab) btn.classList.add('active');
  });
  Object.values(sections).forEach((sec) => {
    if (sec.id === initialTab) sec.classList.add('active');
  });

  const setActive = (id) => {
    [...tabBar.children].forEach((b) => b.classList.toggle('active', b.dataset.tab === id));
    Object.values(sections).forEach((sec) => sec.classList.toggle('active', sec.id === id));

    const mobileTabs = document.querySelector('.mobile-tabs');
    if (mobileTabs) {
      [...mobileTabs.children].forEach((b) => b.classList.toggle('active', b.dataset.tab === id));
    }
  };

  // Desktop tab click handler
  tabBar.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLButtonElement)) return;
    setActive(target.dataset.tab);
  });

  // Handle hash changes (e.g., back/forward navigation)
  window.addEventListener('hashchange', () => {
    const tab = getTabFromHash();
    if (tab) setActive(tab);
  });

  // Auto-number citations in order of appearance.
  // Reuse the same number when both text content and URL match an earlier citation.
  const citations = [...document.querySelectorAll('.citation')];
  const citationNumbers = new Map();
  let nextCiteNumber = 1;

  citations.forEach((cite) => {
    const originalText = (cite.textContent || '').trim();
    const href = cite.getAttribute('href') || '';
    const key = `${originalText}||${href}`;

    if (citationNumbers.has(key)) {
      cite.textContent = `[${citationNumbers.get(key)}]`;
    } else {
      citationNumbers.set(key, nextCiteNumber);
      cite.textContent = `[${nextCiteNumber}]`;
      nextCiteNumber += 1;
    }
  });

  // Mobile: Bio collapse toggle + mobile tab bar
  const bioCollapse = document.querySelector('.bio-collapse');
  const mobileTabs = document.querySelector('.mobile-tabs');
  const sidebar = document.querySelector('.sidebar');
  const contentArea = document.querySelector('.content');

  if (bioCollapse && mobileTabs && sidebar) {
    // Create mobile tab buttons (mirrors desktop)
    order.forEach((id) => {
      const sec = sections[id];
      if (!sec) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = sec.dataset.title || sec.querySelector('h2')?.textContent || id;
      btn.dataset.tab = id;
      if (id === initialTab) btn.classList.add('active');
      mobileTabs.appendChild(btn);
    });

    // If navigating to page with a hash, auto-collapse sidebar on mobile to show content
    if (window.location.hash && window.matchMedia('(max-width: 850px)').matches) {
      sidebar.classList.add('collapsed');
      mobileTabs.classList.add('active');
      if (contentArea) contentArea.classList.add('visible');
    }

    // Handle mobile tab clicks
    mobileTabs.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof HTMLButtonElement)) return;
      setActive(target.dataset.tab);
    });

    // Handle bio collapse/expand
    bioCollapse.addEventListener('click', () => {
      const isCollapsed = sidebar.classList.toggle('collapsed');
      mobileTabs.classList.toggle('active', isCollapsed);
      if (contentArea) contentArea.classList.toggle('visible', isCollapsed);
    });
  }

  // Tooltips: render in a portal so they aren't clipped by scroll containers.
  const TOOLTIP_SELECTOR = '.tooltip[data-tooltip], a.citation[data-tooltip]';

  const isToastLayout = () => window.matchMedia('(max-width: 850px)').matches;
  const isTouchLike = () =>
    window.matchMedia('(hover: none)').matches || window.matchMedia('(pointer: coarse)').matches;

  const tooltipPortal = document.createElement('div');
  tooltipPortal.className = 'tooltip-portal';
  tooltipPortal.setAttribute('role', 'tooltip');
  tooltipPortal.style.display = 'none';
  document.body.appendChild(tooltipPortal);

  /** @type {Element | null} */
  let activeTooltipTarget = null;
  /** @type {Element | null} */
  let tooltipPinnedTo = null;
  /** @type {number | null} */
  let hideTimeoutId = null;

  const clearHideTimeout = () => {
    if (hideTimeoutId !== null) {
      window.clearTimeout(hideTimeoutId);
      hideTimeoutId = null;
    }
  };

  const hideTooltip = () => {
    activeTooltipTarget = null;
    tooltipPinnedTo = null;
    clearHideTimeout();

    tooltipPortal.classList.remove('is-visible');

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const delayMs = prefersReducedMotion ? 0 : 160;

    hideTimeoutId = window.setTimeout(() => {
      // If a tooltip became active again, don't hide the portal.
      if (activeTooltipTarget) return;

      tooltipPortal.style.display = 'none';
      tooltipPortal.textContent = '';
      tooltipPortal.removeAttribute('data-placement');
      tooltipPortal.style.removeProperty('--arrow-x');
      tooltipPortal.style.removeProperty('left');
      tooltipPortal.style.removeProperty('top');
      tooltipPortal.style.removeProperty('right');
      tooltipPortal.style.removeProperty('bottom');
    }, delayMs);
  };

  /** @param {Element} el */
  const positionTooltip = (el) => {
    if (isToastLayout()) {
      tooltipPortal.dataset.placement = 'toast';
      tooltipPortal.style.left = '1rem';
      tooltipPortal.style.right = '1rem';
      tooltipPortal.style.bottom = '1.5rem';
      tooltipPortal.style.top = 'auto';
      tooltipPortal.style.removeProperty('--arrow-x');
      return;
    }

    // Clear toast positioning
    tooltipPortal.style.removeProperty('right');
    tooltipPortal.style.removeProperty('bottom');

    const rect = el.getBoundingClientRect();
    const viewportPadding = 8;
    const gap = 10;

    // Measure tooltip size
    const w = tooltipPortal.offsetWidth;
    const h = tooltipPortal.offsetHeight;

    const anchorX = rect.left + rect.width / 2;

    // Prefer above; fallback below if needed
    let placement = 'top';
    let top = rect.top - gap - h;
    if (top < viewportPadding) {
      placement = 'bottom';
      top = rect.bottom + gap;
    }

    let left = anchorX - w / 2;
    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - viewportPadding - w));

    tooltipPortal.dataset.placement = placement;
    tooltipPortal.style.left = `${Math.round(left)}px`;
    tooltipPortal.style.top = `${Math.round(top)}px`;

    // Position arrow toward the hovered element (even if the bubble is clamped)
    const arrowX = anchorX - left;
    tooltipPortal.style.setProperty('--arrow-x', `${Math.round(arrowX)}px`);
  };

  /** @param {Element} el */
  const showTooltipFor = (el) => {
    const text = el.getAttribute('data-tooltip');
    if (!text) return;

    clearHideTimeout();
    activeTooltipTarget = el;
    tooltipPortal.textContent = text;
    tooltipPortal.style.display = 'block';
    tooltipPortal.classList.remove('is-visible');
    tooltipPortal.style.visibility = 'hidden';
    positionTooltip(el);

    // Trigger a small animation (CSS transition / toast keyframes)
    requestAnimationFrame(() => {
      if (activeTooltipTarget !== el) return;
      tooltipPortal.style.visibility = 'visible';
      tooltipPortal.classList.add('is-visible');
    });
  };

  document.addEventListener('pointerover', (e) => {
    if (isTouchLike()) return;
    const t = e.target;
    if (!(t instanceof Element)) return;
    const el = t.closest(TOOLTIP_SELECTOR);
    if (!el) return;
    showTooltipFor(el);
  });

  document.addEventListener('pointerout', (e) => {
    if (isTouchLike()) return;
    if (!activeTooltipTarget) return;
    const t = e.target;
    if (!(t instanceof Element)) return;

    const leaving = t.closest(TOOLTIP_SELECTOR);
    if (leaving !== activeTooltipTarget) return;

    const related = e.relatedTarget;
    if (related instanceof Node && activeTooltipTarget.contains(related)) return;

    hideTooltip();
  });

  document.addEventListener('focusin', (e) => {
    if (isTouchLike()) return;
    const t = e.target;
    if (!(t instanceof Element)) return;
    const el = t.closest(TOOLTIP_SELECTOR);
    if (!el) return;
    showTooltipFor(el);
  });

  document.addEventListener('focusout', (e) => {
    if (isTouchLike()) return;
    if (!activeTooltipTarget) return;
    const t = e.target;
    if (!(t instanceof Element)) return;
    const leaving = t.closest(TOOLTIP_SELECTOR);
    if (leaving !== activeTooltipTarget) return;
    hideTooltip();
  });

  // Touch devices: tap to show toast tooltips.
  // - For citation links, first tap shows tooltip, second tap opens link.
  document.addEventListener(
    'click',
    (e) => {
      if (!isTouchLike()) return;

      const t = e.target;
      if (!(t instanceof Element)) return;

      const el = t.closest(TOOLTIP_SELECTOR);

      // Tap outside closes any open tooltip
      if (!el) {
        if (activeTooltipTarget || tooltipPinnedTo) hideTooltip();
        return;
      }

      // Second tap on same element closes tooltip (and allows link to open)
      if (tooltipPinnedTo === el) {
        tooltipPinnedTo = null;
        hideTooltip();
        return;
      }

      tooltipPinnedTo = el;
      showTooltipFor(el);

      // Prevent immediate navigation on first tap for citations so the tooltip is readable.
      if (el instanceof HTMLAnchorElement && el.matches('a.citation')) {
        e.preventDefault();
      }
    },
    true,
  );

  // Reposition on scroll/resize while a tooltip is open.
  window.addEventListener(
    'scroll',
    () => {
      if (activeTooltipTarget) positionTooltip(activeTooltipTarget);
    },
    true,
  );

  window.addEventListener('resize', () => {
    if (activeTooltipTarget) positionTooltip(activeTooltipTarget);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideTooltip();
  });

  // Personal photo slideshow (configured via `public/scripts/personal-slideshow-registry.js`)
  const personalSlideshowRoot = document.querySelector('[data-personal-slideshow]');
  const personalSlidesRaw = window.PERSONAL_SLIDESHOW;

  if (personalSlideshowRoot) {
    if (Array.isArray(personalSlidesRaw) && personalSlidesRaw.length > 0) {
      initPersonalSlideshow(personalSlideshowRoot, personalSlidesRaw);
    } else {
      const placeholder = personalSlideshowRoot.querySelector('.personal-slideshow-placeholder');
      if (placeholder) placeholder.textContent = 'Add photos in /public/scripts/personal-slideshow-registry.js';
    }
  }

  /**
   * @param {Element} root
   * @param {any[]} slidesRaw
   */
  function initPersonalSlideshow(root, slidesRaw) {
    const imgs = [...root.querySelectorAll('.personal-slideshow-image')].filter(
      (el) => el instanceof HTMLImageElement,
    );
    const imgA = imgs[0];
    const imgB = imgs[1];
    const placeholder = root.querySelector('.personal-slideshow-placeholder');
    const caption = root.querySelector('.personal-slideshow-caption');
    const counter = root.querySelector('.personal-slideshow-counter');
    const prevBtn = root.querySelector('.personal-slideshow-prev');
    const nextBtn = root.querySelector('.personal-slideshow-next');

    if (!(imgA instanceof HTMLImageElement)) return;
    if (!(imgB instanceof HTMLImageElement)) return;
    if (!(caption instanceof HTMLElement)) return;
    if (!(counter instanceof HTMLElement)) return;

    // Ensure both layers start hidden.
    imgA.classList.remove('is-active');
    imgB.classList.remove('is-active');
    imgA.setAttribute('aria-hidden', 'true');
    imgB.setAttribute('aria-hidden', 'true');

    const toSdrSrc = (src) => {
      // Prefer SDR copies (generated into /public/photos-sdr/).
      if (typeof src === 'string' && src.startsWith('/photos/')) {
        return src.replace('/photos/', '/photos-sdr/');
      }
      return src;
    };

    const slides = slidesRaw
      .filter((s) => s && typeof s.src === 'string')
      .map((s) => ({
        src: toSdrSrc(String(s.src)),
        caption: typeof s.caption === 'string' ? s.caption : '',
        alt: typeof s.alt === 'string' ? s.alt : typeof s.caption === 'string' ? s.caption : 'Photo',
        fit: s.fit === 'cover' ? 'cover' : 'contain',
        position: typeof s.position === 'string' ? s.position : 'center',
      }));

    if (slides.length === 0) return;

    let index = 0;
    const mod = (n, m) => ((n % m) + m) % m;

    // Preload images up-front for smoother transitions.
    slides.forEach((s) => {
      const p = new Image();
      p.src = s.src;
    });

    let activeImg = imgA;
    let inactiveImg = imgB;
    let transitionToken = 0;

    // Disable transitions for the very first paint (we'll remove this after first load).
    root.setAttribute('data-anim', 'off');

    const applySlideToImage = (imgEl, slide) => {
      imgEl.style.objectFit = slide.fit;
      imgEl.style.objectPosition = slide.position;
      imgEl.alt = slide.alt || 'Photo';
      imgEl.src = slide.src;
    };

    const updateMeta = (slide) => {
      caption.textContent = slide.caption || '';
      counter.textContent = `${index + 1} / ${slides.length}`;
    };

    const setSlide = (i, { animate = true } = {}) => {
      index = mod(i, slides.length);
      const s = slides[index];

      transitionToken += 1;
      const token = transitionToken;

      if (placeholder && root.getAttribute('data-ready') !== 'true') {
        placeholder.textContent = 'Loading…';
      }

      // If we're already showing this src, just update the caption/counter.
      const currentSrc = activeImg.currentSrc || activeImg.src || '';
      if (currentSrc && currentSrc.includes(s.src)) {
        updateMeta(s);
        return;
      }

      inactiveImg.onload = async () => {
        if (transitionToken !== token) return;

        // Try to decode before swapping for less jank.
        try {
          if (typeof inactiveImg.decode === 'function') {
            await inactiveImg.decode();
          }
        } catch {
          // ignore
        }

        if (transitionToken !== token) return;

        root.setAttribute('data-ready', 'true');

        // Crossfade (CSS handles the transition)
        inactiveImg.classList.add('is-active');
        inactiveImg.removeAttribute('aria-hidden');
        activeImg.classList.remove('is-active');
        activeImg.setAttribute('aria-hidden', 'true');

        // Swap references
        const tmp = activeImg;
        activeImg = inactiveImg;
        inactiveImg = tmp;

        // First load done — allow transitions after this.
        root.removeAttribute('data-anim');

        updateMeta(s);
      };

      inactiveImg.onerror = () => {
        if (transitionToken !== token) return;
        root.setAttribute('data-ready', 'true');
        root.removeAttribute('data-anim');
        caption.textContent = 'Could not load photo.';
      };

      // Keep the current image visible until the new one is ready.
      inactiveImg.classList.remove('is-active');
      inactiveImg.setAttribute('aria-hidden', 'true');

      applySlideToImage(inactiveImg, s);
    };

    if (prevBtn instanceof HTMLButtonElement) {
      prevBtn.addEventListener('click', () => setSlide(index - 1));
    }

    if (nextBtn instanceof HTMLButtonElement) {
      nextBtn.addEventListener('click', () => setSlide(index + 1));
    }

    // Keyboard support (when the figure is focused)
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSlide(index - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSlide(index + 1);
      }
    });

    // Swipe support (mobile)
    let pointerId = null;
    let startX = 0;
    let startY = 0;

    root.addEventListener('pointerdown', (e) => {
      if (!(e instanceof PointerEvent)) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
    });

    root.addEventListener('pointerup', (e) => {
      if (!(e instanceof PointerEvent)) return;
      if (pointerId !== e.pointerId) return;
      pointerId = null;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (Math.abs(dx) < 40) return;
      if (Math.abs(dx) < Math.abs(dy) * 1.2) return;

      if (dx < 0) setSlide(index + 1);
      else setSlide(index - 1);
    });

    root.addEventListener('pointercancel', () => {
      pointerId = null;
    });

    // Initialize
    setSlide(0, { animate: false });
  }
})();

