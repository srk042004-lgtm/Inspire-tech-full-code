// app.js - Shared sidebar + backdrop + search initialization
// Idempotent: it will not re-initialize if already run on the page.
(function () {
  if (document.documentElement.dataset.sidebarInit === 'true') return;
  document.documentElement.dataset.sidebarInit = 'true';

  // Utility helpers
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  // Ensure we have a sidebar element. If an <aside> exists but lacks id, give it one.
  var sidebar = qs('#sidebar');
  if (!sidebar) {
    sidebar = qs('aside');
    if (sidebar && !sidebar.id) sidebar.id = 'sidebar';
  }

  // Ensure a toggle button exists in the navbar; create one if missing.
  var toggle = qs('#sidebarToggle');
  if (!toggle) {
    var navContainer = qs('nav .container') || qs('nav');
    if (navContainer) {
      toggle = document.createElement('button');
      toggle.id = 'sidebarToggle';
      toggle.className = 'btn btn-outline-light d-none me-2';
      toggle.setAttribute('aria-label', 'Toggle sidebar');
      toggle.setAttribute('aria-controls', 'sidebar');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerText = '☰';
      // Insert toggle as first child of the .container inside nav so placement matches other pages
      navContainer.insertBefore(toggle, navContainer.firstChild);
    }
  }

  // Ensure backdrop exists (insert after nav)
  var backdrop = qs('#sidebarBackdrop');
  if (!backdrop) {
    var navEl = qs('nav');
    backdrop = document.createElement('div');
    backdrop.id = 'sidebarBackdrop';
    backdrop.className = 'sidebar-backdrop';
    if (navEl && navEl.parentNode) navEl.parentNode.insertBefore(backdrop, navEl.nextSibling);
    else document.body.appendChild(backdrop);
  }

  function openSidebar() {
    if (!sidebar) return;
    // Save previously focused element so we can restore focus on close
    try { prevFocus = document.activeElement; } catch (e) { prevFocus = null; }

  sidebar.classList.add('open');
  try { sidebar.setAttribute('aria-hidden', 'false'); } catch (e) {}
    document.body.classList.add('sidebar-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');

    // Focus management: focus first focusable element inside sidebar
    var focusables = getFocusableElements();
    if (focusables.length) {
      focusables[0].focus();
    } else {
      // ensure sidebar itself is focusable
      sidebar.setAttribute('tabindex', '-1');
      sidebar.focus();
      // mark that we added tabindex so we can remove it on close
      sidebar.dataset.tempTabindex = 'true';
    }
  }

  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('open');
    document.body.classList.remove('sidebar-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');

  try { sidebar.setAttribute('aria-hidden', 'true'); } catch (e) {}

    // Restore focus to previously focused element
    try {
      if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus();
    } catch (err) {
      // ignore
    }

    // Cleanup temporary tabindex if we added one
    if (sidebar && sidebar.dataset.tempTabindex === 'true') {
      sidebar.removeAttribute('tabindex');
      delete sidebar.dataset.tempTabindex;
    }
  }

  if (toggle) {
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!sidebar) return;
      if (sidebar.classList.contains('open')) closeSidebar();
      else openSidebar();
    });
  }

  if (backdrop) backdrop.addEventListener('click', closeSidebar);

  // Focus trap and Escape handling while sidebar open
  var prevFocus = null;
  function getFocusableElements() {
    if (!sidebar) return [];
    var selectors = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]';
    var nodes = Array.from(sidebar.querySelectorAll(selectors));
    // filter visible
    return nodes.filter(function (el) {
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length;
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') return closeSidebar();

    if (e.key === 'Tab') {
      if (!sidebar || !sidebar.classList.contains('open')) return;
      var focusables = getFocusableElements();
      if (!focusables.length) {
        // no focusable inside, keep focus on sidebar
        e.preventDefault();
        return;
      }
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === first || document.activeElement === sidebar) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  });

  window.addEventListener('resize', function () {
    try {
      if (window.innerWidth > 580) {
        if (sidebar) sidebar.classList.remove('open');
        document.body.classList.remove('sidebar-open');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      }
    } catch (err) {
      // ignore
    }
  });

  // Search filter initialization
  try {
    var searchInput = qs('#searchInput');
    if (searchInput && searchInput.dataset.searchInit !== 'true') {
      searchInput.dataset.searchInit = 'true';
      var listItems = qsa('.course-list .list-group-item');
      searchInput.addEventListener('keyup', function () {
        var filter = (searchInput.value || '').toLowerCase();
        listItems.forEach(function (item) {
          var text = (item.textContent || '').toLowerCase();
          item.classList.toggle('hidden', !text.includes(filter));
        });
      });
    }
  } catch (err) {
    // ignore
  }

})();
