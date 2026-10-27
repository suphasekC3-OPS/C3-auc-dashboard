/**
 * PEA AUC Dashboard - Presentation Pointer Module
 * ระบบพอยน์เตอร์เรืองแสงสำหรับนำเสนอ (Laser, Spotlight, Cyan Halo, Neon Green, Gold Arrow)
 * แทนที่เมาส์เดิมเพื่อดึงดูดสายตาในการบรรยายและนำเสนอผลงาน
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'AUC_PRESENTATION_POINTER_MODE_V1';
  let activeMode = 'normal';
  let lastActiveMode = 'laser';
  let pointerDotEl = null;
  let spotlightOverlayEl = null;

  let mouseX = -200;
  let mouseY = -200;
  let isTicking = false;

  const MODES = {
    'normal': { name: 'ปกติ', icon: '🖱️', hasCustomCursor: false },
    'red-solid': { name: 'จุดแดงทึบ', icon: '🔴', hasCustomCursor: true },
    'laser': { name: 'เลเซอร์แดงนีออน', icon: '💥', hasCustomCursor: true },
    'spotlight': { name: 'สปอตไลท์', icon: '🔦', hasCustomCursor: false },
    'halo': { name: 'วงแหวนฟ้า', icon: '🔵', hasCustomCursor: false },
    'green-dot': { name: 'เลเซอร์เขียว', icon: '🟢', hasCustomCursor: true },
    'gold-arrow': { name: 'ลูกศรทอง', icon: '🌟', hasCustomCursor: true }
  };

  /**
   * Initialize Presentation Pointer Elements
   */
  function initPointerDOM() {
    // 1. Create Pointer Dot Element
    if (!document.getElementById('presenterPointerDot')) {
      pointerDotEl = document.createElement('div');
      pointerDotEl.id = 'presenterPointerDot';
      pointerDotEl.className = 'presenter-pointer-dot';
      pointerDotEl.innerHTML = `
        <div class="pointer-solid-red"></div>
        <div class="pointer-laser-core"></div>
        <div class="pointer-halo-disc"></div>
        <div class="pointer-arrow-svg">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="url(#presenterGoldGrad)" stroke="#FFFFFF" stroke-width="1.2">
            <defs>
              <linearGradient id="presenterGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FFFDF0"/>
                <stop offset="35%" stop-color="#FFD700"/>
                <stop offset="70%" stop-color="#F59E0B"/>
                <stop offset="100%" stop-color="#B45309"/>
              </linearGradient>
            </defs>
            <path d="M4 2l16 11-7 2-3 7L4 2z"/>
          </svg>
        </div>
      `;
      document.body.appendChild(pointerDotEl);
    } else {
      pointerDotEl = document.getElementById('presenterPointerDot');
    }

    // 2. Create Spotlight Overlay
    if (!document.getElementById('presenterSpotlightOverlay')) {
      spotlightOverlayEl = document.createElement('div');
      spotlightOverlayEl.id = 'presenterSpotlightOverlay';
      spotlightOverlayEl.className = 'presenter-spotlight-overlay';
      document.body.appendChild(spotlightOverlayEl);
    } else {
      spotlightOverlayEl = document.getElementById('presenterSpotlightOverlay');
    }

    // 3. Create Floating Indicator when presenting
    if (!document.getElementById('presenterActiveFloatingBar')) {
      const floatBar = document.createElement('div');
      floatBar.id = 'presenterActiveFloatingBar';
      floatBar.className = 'presenter-floating-bar';
      floatBar.style.display = 'none';
      floatBar.innerHTML = `
        <div class="float-bar-inner">
          <span class="float-bar-icon" id="floatBarIcon">🎯</span>
          <span class="float-bar-text" id="floatBarText">โหมดนำเสนอ</span>
          <button type="button" class="btn-float-quick-toggle" onclick="window.togglePresentationPointer()" title="สลับโหมด / คืนเมาส์ปกติ (P)">
            ปิด (Esc)
          </button>
        </div>
      `;
      document.body.appendChild(floatBar);
    }

    // Mouse movement listener
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    // Load saved mode or default normal
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && MODES[saved]) {
      lastActiveMode = saved !== 'normal' ? saved : 'laser';
    }
  }

  /**
   * On Mouse Move (Throttled via requestAnimationFrame)
   */
  function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!isTicking) {
      isTicking = true;
      requestAnimationFrame(updatePositions);
    }
  }

  function updatePositions() {
    if (activeMode !== 'normal') {
      if (pointerDotEl) {
        pointerDotEl.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }
      if (spotlightOverlayEl && activeMode === 'spotlight') {
        spotlightOverlayEl.style.setProperty('--spot-x', `${mouseX}px`);
        spotlightOverlayEl.style.setProperty('--spot-y', `${mouseY}px`);
      }
    }
    isTicking = false;
  }

  /**
   * On Mouse Down: Create Presenter Click Ripple Effect
   */
  function onMouseDown(e) {
    if (activeMode === 'normal') return;

    // Do not interfere with pointer events
    const ripple = document.createElement('div');
    ripple.className = `presenter-click-ripple ripple-${activeMode}`;
    ripple.style.left = `${e.clientX}px`;
    ripple.style.top = `${e.clientY}px`;
    document.body.appendChild(ripple);

    setTimeout(() => {
      if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
    }, 550);
  }

  /**
   * Set Pointer Mode
   */
  function setPointerMode(mode, save = true) {
    if (!MODES[mode]) mode = 'normal';

    activeMode = mode;
    if (mode !== 'normal') {
      lastActiveMode = mode;
    }
    if (save) {
      try {
        localStorage.setItem(STORAGE_KEY, mode);
      } catch (err) {}
    }

    // Remove all previous body mode classes
    document.body.classList.remove(
      'pointer-mode-red-solid',
      'pointer-mode-laser',
      'pointer-mode-spotlight',
      'pointer-mode-halo',
      'pointer-mode-green',
      'pointer-mode-gold'
    );

    const btnPill = document.getElementById('pointerStatusPill');
    const btnIcon = document.getElementById('pointerBtnIcon');
    const floatBar = document.getElementById('presenterActiveFloatingBar');
    const floatBarIcon = document.getElementById('floatBarIcon');
    const floatBarText = document.getElementById('floatBarText');
    const widgetBtn = document.getElementById('btnTogglePointerMenu');

    if (btnPill) btnPill.textContent = MODES[mode].name;
    if (btnIcon) btnIcon.textContent = MODES[mode].icon;

    // Update active check in menu
    document.querySelectorAll('.pointer-option-item').forEach(btn => {
      const bMode = btn.getAttribute('data-mode');
      if (bMode === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (mode === 'normal') {
      if (pointerDotEl) pointerDotEl.style.display = 'none';
      if (spotlightOverlayEl) spotlightOverlayEl.style.display = 'none';
      if (floatBar) floatBar.style.display = 'none';
      if (widgetBtn) widgetBtn.classList.remove('has-active-pointer');
    } else {
      if (pointerDotEl) {
        pointerDotEl.style.display = 'block';
        pointerDotEl.className = `presenter-pointer-dot mode-${mode}`;
        pointerDotEl.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }

      if (spotlightOverlayEl) {
        if (mode === 'spotlight') {
          spotlightOverlayEl.style.display = 'block';
          spotlightOverlayEl.style.setProperty('--spot-x', `${mouseX}px`);
          spotlightOverlayEl.style.setProperty('--spot-y', `${mouseY}px`);
        } else {
          spotlightOverlayEl.style.display = 'none';
        }
      }

      if (widgetBtn) widgetBtn.classList.add('has-active-pointer');

      // Add corresponding body class
      if (mode === 'red-solid') document.body.classList.add('pointer-mode-red-solid');
      else if (mode === 'laser') document.body.classList.add('pointer-mode-laser');
      else if (mode === 'spotlight') document.body.classList.add('pointer-mode-spotlight');
      else if (mode === 'halo') document.body.classList.add('pointer-mode-halo');
      else if (mode === 'green-dot') document.body.classList.add('pointer-mode-green');
      else if (mode === 'gold-arrow') document.body.classList.add('pointer-mode-gold');

      // Show floating bar
      if (floatBar) {
        floatBar.style.display = 'flex';
        if (floatBarIcon) floatBarIcon.textContent = MODES[mode].icon;
        if (floatBarText) floatBarText.textContent = `พอยน์เตอร์: ${MODES[mode].name}`;
      }

      if (window.showToast) {
        window.showToast(`เปิดใช้งาน: ${MODES[mode].name} (กด P หรือ Esc เพื่อปิด)`, 'info');
      }
    }
  }

  /**
   * Toggle Pointer (Between lastActiveMode and normal)
   */
  function togglePresentationPointer() {
    if (activeMode === 'normal') {
      setPointerMode(lastActiveMode || 'laser');
    } else {
      setPointerMode('normal');
    }
  }

  /**
   * Keyboard shortcuts
   */
  function onKeyDown(e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
      return;
    }

    if (e.key === 'p' || e.key === 'P') {
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        togglePresentationPointer();
      }
    } else if (e.key === 'Escape') {
      if (activeMode !== 'normal') {
        setPointerMode('normal');
      }
      closePointerMenu();
    }
  }

  /**
   * Open/Close Dropdown Menu
   */
  function togglePointerMenu() {
    const menu = document.getElementById('presenterPointerMenu');
    if (!menu) return;

    if (menu.classList.contains('show')) {
      closePointerMenu();
    } else {
      openPointerMenu();
    }
  }

  function openPointerMenu() {
    const menu = document.getElementById('presenterPointerMenu');
    const btn = document.getElementById('btnTogglePointerMenu');
    const widget = document.getElementById('presenterPointerWidget');
    if (!menu) return;

    menu.classList.add('show');
    if (btn) btn.classList.add('menu-open');
    if (widget) widget.classList.add('menu-active');

    // Close when clicking outside
    setTimeout(() => {
      document.addEventListener('click', onDocClick);
    }, 50);
  }

  function closePointerMenu() {
    const menu = document.getElementById('presenterPointerMenu');
    const btn = document.getElementById('btnTogglePointerMenu');
    const widget = document.getElementById('presenterPointerWidget');
    if (menu) menu.classList.remove('show');
    if (btn) btn.classList.remove('menu-open');
    if (widget) widget.classList.remove('menu-active');
    document.removeEventListener('click', onDocClick);
  }

  function onDocClick(e) {
    const widget = document.getElementById('presenterPointerWidget');
    if (widget && !widget.contains(e.target)) {
      closePointerMenu();
    }
  }

  /**
   * Setup Listeners
   */
  function setupPointerListeners() {
    const toggleBtn = document.getElementById('btnTogglePointerMenu');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePointerMenu();
      });
    }

    const closeBtn = document.getElementById('btnClosePointerMenu');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closePointerMenu();
      });
    }

    // Option items click
    document.querySelectorAll('.pointer-option-item').forEach(item => {
      item.addEventListener('click', () => {
        const mode = item.getAttribute('data-mode');
        setPointerMode(mode);
        closePointerMenu();
      });
    });
  }

  // Initialize
  function init() {
    initPointerDOM();
    setupPointerListeners();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose global APIs
  window.setPresentationPointerMode = setPointerMode;
  window.togglePresentationPointer = togglePresentationPointer;
  window.openPresentationPointerMenu = openPointerMenu;
  window.closePresentationPointerMenu = closePointerMenu;

})();
