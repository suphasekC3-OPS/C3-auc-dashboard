/**
 * ตัวกรอง กอง/กฟฟ. (#filterOffice) แบบ Dropdown ไม่มีช่องค้นหา
 * ใช้สีอักษร/พื้นเดิมของรายการ (ทอง #FFB81C บนม่วง #2D0A45) และแถบเลื่อนสีเดียวกับตัวกรองสถานะ SAP
 * คง <select id="filterOffice"> ไว้ซ่อนเพื่อให้ตรรกะเดิมใน app.js ทำงานต่อได้
 */
(function () {
  'use strict';

  function init() {
    const sel = document.getElementById('filterOffice');
    if (!sel || document.getElementById('filterOfficeBtn')) return;

    sel.style.display = 'none';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'filterOfficeBtn';
    btn.className = 'form-select top-filter-select office-dd-btn';
    btn.innerHTML = '<span class="office-dd-btn-text"></span>';
    sel.parentNode.insertBefore(btn, sel.nextSibling);
    const textEl = btn.firstChild;

    const panel = document.createElement('div');
    panel.className = 'office-dd-panel';
    panel.style.display = 'none';
    document.body.appendChild(panel);
    panel.addEventListener('click', e => e.stopPropagation());

    function sync() {
      const o = sel.options[sel.selectedIndex];
      const t = o ? o.textContent : '';
      if (textEl.textContent !== t) textEl.textContent = t;
      btn.title = t;
    }

    function render() {
      panel.innerHTML = '';
      for (let i = 0; i < sel.options.length; i++) {
        const o = sel.options[i];
        const div = document.createElement('div');
        div.className = 'office-dd-item' + (o.value === sel.value ? ' is-selected' : '');
        div.textContent = o.textContent;
        div.onclick = function () {
          sel.value = o.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          close();
          sync();
        };
        panel.appendChild(div);
      }
    }

    function close() { panel.style.display = 'none'; }

    function open() {
      const r = btn.getBoundingClientRect();
      render();
      panel.style.left = Math.max(4, Math.min(r.left, window.innerWidth - 260)) + 'px';
      panel.style.top = (r.bottom + 6) + 'px';
      panel.style.minWidth = Math.max(r.width, 220) + 'px';
      panel.style.display = 'block';
      const s = panel.querySelector('.is-selected');
      if (s && s.scrollIntoView) s.scrollIntoView({ block: 'nearest' });
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (panel.style.display === 'block') close(); else open();
    });
    document.addEventListener('click', close);
    window.addEventListener('resize', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

    new MutationObserver(sync).observe(sel, { childList: true });
    sel.addEventListener('change', sync);
    setInterval(sync, 500); // รองรับการตั้งค่า sel.value จากโค้ดอื่น (เช่น ยางลบ / คืนค่าทั้งหมด)
    sync();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

