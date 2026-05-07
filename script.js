/* ============================================================
   DESKTOP OS - Portfolio Script
   Window management · Context menu · Dark/light mode · Dyslexic font
   ============================================================ */

const Desktop = (() => {

  /* ─── State ─── */
  let activeFolder = null;
  let zCounter = 200;
  const openWindows = new Set();

  /* ─── Helpers ─── */
  const $ = id => document.getElementById(id);
  const html = document.documentElement;

  /* ─── Clock ─── */
  function startClock() {
    const el = $('menu-clock');
    if (!el) return;
    const tick = () => {
      const now = new Date();
      el.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    tick();
    setInterval(tick, 30000);
  }

  /* ─── Dark / Light mode ─── */
  function initMode() {
    const btn = $('mode-toggle');
    const icon = $('mode-icon');
    const stored = localStorage.getItem('sc-theme') || 'dark';
    applyTheme(stored, btn, icon);

    btn.addEventListener('click', () => {
      const current = html.dataset.theme;
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next, btn, icon);
      localStorage.setItem('sc-theme', next);
    });
  }

  function applyTheme(theme, btn, icon) {
    html.dataset.theme = theme;
    const isDark = theme === 'dark';
    btn.setAttribute('aria-pressed', String(!isDark));
    btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    if (icon) icon.textContent = isDark ? '☀' : '🌙';
  }

  /* ─── Dyslexic font ─── */
  function initDyslexic() {
    const btn = $('dyslexic-toggle');
    const stored = localStorage.getItem('sc-dyslexic') === 'true';
    applyDyslexic(stored, btn);

    btn.addEventListener('click', () => {
      const next = html.dataset.dyslexic !== 'true';
      applyDyslexic(next, btn);
      localStorage.setItem('sc-dyslexic', String(next));
    });
  }

  function applyDyslexic(on, btn) {
    html.dataset.dyslexic = String(on);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Disable dyslexic-friendly font' : 'Enable dyslexic-friendly font (Atkinson Hyperlegible)');
  }

  /* ─── Window management ─── */
  function open(folderId, options = {}) {
    if (options.theme)    applyTheme(options.theme, $('mode-toggle'), $('mode-icon'));
    if (options.dyslexic) applyDyslexic(true, $('dyslexic-toggle'));

    const win = $('window-' + folderId);
    if (!win) return;

    win.removeAttribute('hidden');
    openWindows.add(folderId);
    bringToFront(win);
    document.body.classList.add('text-selectable');

    /* Animate open - force reflow so animation replays each time */
    win.classList.remove('win-opening');
    void win.offsetWidth;
    win.classList.add('win-opening');
    win.addEventListener('animationend', () => win.classList.remove('win-opening'), { once: true });

    /* Focus the window title for screen readers */
    const title = win.querySelector('.window-title');
    if (title) { title.setAttribute('tabindex', '-1'); title.focus(); }

    announce(`${folderId.replace(/-/g, ' ')} folder opened`);
  }

  function close(folderId) {
    /* data-close attributes include the "window-" prefix - strip it */
    const id = folderId.replace(/^window-/, '');
    const win = $('window-' + id);
    if (!win) return;
    win.setAttribute('hidden', '');
    openWindows.delete(id);
    if (openWindows.size === 0) document.body.classList.remove('text-selectable');

    const btn = document.querySelector(`.folder-btn[data-folder="${id}"]`);
    if (btn) btn.focus();
  }

  /* Center welcome window in the usable area, leaving room for the folder column */
  function centerWindow(win) {
    if (!win) return;
    if (window.innerWidth <= 768) return; /* mobile uses flow layout */
    const desktopH   = window.innerHeight - 36;
    const folderGap  = 150; /* approximate width of right-side folder column */
    const usableW    = window.innerWidth - folderGap;
    const w = win.offsetWidth  || 680;
    const h = win.offsetHeight || 480;
    win.style.left = Math.max(8, (usableW - w) / 2) + 'px';
    win.style.top  = Math.max(8, (desktopH - h) / 2) + 'px';
  }

  function bringToFront(win) {
    document.querySelectorAll('.window').forEach(w => w.classList.remove('window-active'));
    win.style.zIndex = ++zCounter;
    win.classList.add('window-active');
  }

  /* ─── Screen-reader live region ─── */
  let announcer;
  function announce(msg) {
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;';
      document.body.appendChild(announcer);
    }
    announcer.textContent = '';
    requestAnimationFrame(() => { announcer.textContent = msg; });
  }

  /* ─── Draggable windows ─── */
  function makeDraggable(titlebar) {
    const winId = titlebar.dataset.drag;
    const win = $( winId );
    if (!win) return;

    let startX, startY, startLeft, startTop, dragging = false;

    titlebar.addEventListener('mousedown', e => {
      if (e.target.closest('.wctrl')) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = win.getBoundingClientRect();
      startLeft = rect.left;
      startTop  = rect.top - 36; /* offset for menu bar */
      bringToFront(win);
      e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      win.style.left = Math.max(0, startLeft + dx) + 'px';
      win.style.top  = Math.max(0, startTop  + dy) + 'px';
    });

    document.addEventListener('mouseup', () => { dragging = false; });

    /* Touch drag */
    titlebar.addEventListener('touchstart', e => {
      if (e.target.closest('.wctrl')) return;
      const t = e.touches[0];
      dragging = true;
      startX = t.clientX; startY = t.clientY;
      const rect = win.getBoundingClientRect();
      startLeft = rect.left; startTop = rect.top - 36;
    }, { passive: true });

    document.addEventListener('touchmove', e => {
      if (!dragging) return;
      const t = e.touches[0];
      win.style.left = Math.max(0, startLeft + t.clientX - startX) + 'px';
      win.style.top  = Math.max(0, startTop  + t.clientY - startY) + 'px';
    }, { passive: true });

    document.addEventListener('touchend', () => { dragging = false; });
  }

  /* ─── Context menu ─── */
  const ctxMenu = $('context-menu');

  function showContext(e, folderId) {
    e.preventDefault();
    activeFolder = folderId;

    const label = ctxMenu.querySelector('#context-folder-name');
    if (label) label.textContent = folderId.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());

    /* Position */
    const x = Math.min(e.clientX, window.innerWidth  - 240);
    const y = Math.min(e.clientY, window.innerHeight - 220);
    ctxMenu.style.left = x + 'px';
    ctxMenu.style.top  = y + 'px';
    ctxMenu.removeAttribute('hidden');

    /* Focus first item */
    const first = ctxMenu.querySelector('.context-item');
    if (first) first.focus();
  }

  function hideContext() {
    ctxMenu.setAttribute('hidden', '');
    activeFolder = null;
  }

  function handleContextAction(action) {
    if (!activeFolder) return;
    const folder = activeFolder;
    hideContext();

    if (action === 'open-general') {
      applyDyslexic(false, $('dyslexic-toggle'));
      open(folder);
    } else if (action === 'open-dyslexic') {
      applyDyslexic(true, $('dyslexic-toggle'));
      open(folder);
    } else if (action === 'open-same') {
      open(folder);
    } else if (action === 'open-new-tab') {
      /* Research links to dedicated page; others use param */
      if (folder === 'research') {
        window.open('hci-portfolio.html', '_blank', 'noopener');
      } else {
        window.open(`index.html?open=${folder}`, '_blank', 'noopener');
      }
    } else if (action === 'open-dark') {
      open(folder, { theme: 'dark' });
    }
  }

  /* Context menu keyboard navigation */
  function initContextKeyboard() {
    ctxMenu.addEventListener('keydown', e => {
      const items = [...ctxMenu.querySelectorAll('.context-item')];
      const idx = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(idx + 1) % items.length]?.focus(); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); items[(idx - 1 + items.length) % items.length]?.focus(); }
      if (e.key === 'Escape')    { hideContext(); const btn = document.querySelector(`.folder-btn[data-folder="${activeFolder}"]`); btn?.focus(); }
      if (e.key === 'Tab')       { hideContext(); }
    });
  }

  /* ─── Check URL param ─── */
  function checkURLParam() {
    const params = new URLSearchParams(window.location.search);
    const openId = params.get('open');
    if (openId) open(openId);
  }

  /* ─── Init ─── */
  function init() {
    startClock();
    initMode();
    initDyslexic();
    initContextKeyboard();
    checkURLParam();

    /* Folder buttons - click opens, hover/right-click/tap shows context menu */
    let hoverTimer = null;

    document.querySelectorAll('.folder-btn').forEach(btn => {
      const folder = btn.dataset.folder;

      /* Click = open directly */
      btn.addEventListener('click', () => open(folder));

      /* Right-click = context menu immediately */
      btn.addEventListener('contextmenu', e => showContext(e, folder));

      /* Hover = context menu after 500 ms */
      btn.addEventListener('mouseenter', () => {
        hoverTimer = setTimeout(() => {
          const rect = btn.getBoundingClientRect();
          showContext({
            clientX: rect.left,
            clientY: rect.bottom + 6,
            preventDefault: () => {}
          }, folder);
        }, 500);
      });
      btn.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      });

      /* Touch (mobile) = context menu on tap (no hover available) */
      btn.addEventListener('touchend', e => {
        e.preventDefault(); /* prevent ghost click firing open() */
        const t = e.changedTouches[0];
        showContext({
          clientX: t.clientX,
          clientY: t.clientY,
          preventDefault: () => {}
        }, folder);
      }, { passive: false });

      /* Keyboard context menu key */
      btn.addEventListener('keydown', e => {
        if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
          e.preventDefault();
          const rect = btn.getBoundingClientRect();
          showContext({ clientX: rect.left, clientY: rect.bottom + 6, preventDefault: () => {} }, folder);
        }
      });
    });

    /* Close buttons - data-close has full id like "window-case-studies" */
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => close(btn.dataset.close));
    });

    /* Escape closes top window */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (!ctxMenu.hasAttribute('hidden')) { hideContext(); return; }
        /* Close most recently opened window */
        const active = document.querySelector('.window-active:not([hidden])');
        if (active) {
          const id = active.id.replace('window-', '');
          close(id);
        }
      }
    });

    /* Click anywhere else closes context menu */
    document.addEventListener('click', e => {
      if (!ctxMenu.hasAttribute('hidden') && !ctxMenu.contains(e.target)) hideContext();
    });

    /* Bring clicked window to front */
    document.querySelectorAll('.window').forEach(win => {
      win.addEventListener('mousedown', () => bringToFront(win));
    });

    /* Make all titlebars draggable */
    document.querySelectorAll('[data-drag]').forEach(makeDraggable);

    /* Context menu item clicks */
    ctxMenu.querySelectorAll('.context-item').forEach(item => {
      item.addEventListener('click', () => handleContextAction(item.dataset.action));
    });

    /* Open and center the welcome window */
    open('welcome');
    /* Wait one frame for the window to render before measuring */
    requestAnimationFrame(() => centerWindow($('window-welcome')));
  }

  /* Public API */
  return { init, open, close };
})();

document.addEventListener('DOMContentLoaded', () => Desktop.init());
