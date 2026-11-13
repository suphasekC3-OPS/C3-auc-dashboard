/**
 * PEA AUC Dashboard - Materials Pending Withdrawal Module (เมนู "รายการพัสดุ")
 * เชื่อมข้อมูล 3 แหล่งแบบ Relational Join:
 *   1) ไฟล์ 03 WBSงานคงเหลือเดือนล่าสุด.xlsx (คอลัมน์ WBS เป็นตัวอ้างอิงหลักและตัวกรองเกณฑ์วัด/พื้นที่/กฟฟ.)
 *   2) ไฟล์ 07 พัสดุค้างเบิก CN52N.xlsx (เชื่อมผ่านคอลัมน์ "องค์ประกอบ WBS" • ดึงเฉพาะ Mvt.type = 281 เท่านั้น)
 *   3) ไฟล์ 04 WBS ZBUDR064 %พัสดุและค่าแรงและสถานะsap.xlsx (เชื่อมผ่านคอลัมน์ "ข้อกำหนดโครงการ /WBS")
 */
(function () {
  'use strict';

  const STORAGE_VIS_KEY = 'AUC_MAT07_VISIBLE_COLS_V1';
  const STORAGE_ORD_KEY = 'AUC_MAT07_COL_ORDER_V1';

  const MAT_COL_GROUPS = [
    { id: '03', label: 'ไฟล์ 03 WBS งานคงเหลือ (ตัวอ้างอิงหลัก)', icon: '📋', tagText: '03 WBS', tagClass: 'col-tag-03' },
    { id: '04', label: 'ไฟล์ 04 ZBUDR064 (ข้อมูลงบประมาณและโครงการ)', icon: '⚡', tagText: '04 ZBUDR', tagClass: 'col-tag-04' },
    { id: '07', label: 'ไฟล์ 07 พัสดุค้างเบิก (CN52N)', icon: '📦', tagText: '07 พัสดุ', tagClass: 'col-tag-07' },
    { id: 'custom', label: 'CUSTOM (ค่าที่ระบบคำนวณและแปลงค่า)', icon: '✨', tagText: 'CUSTOM', tagClass: 'col-tag-custom' }
  ];

  // แมปชื่อคลังพัสดุจากรหัสโรงงาน (Plant)
  const MAT_WAREHOUSE_MAP = {
    'I010': 'คลังพัสดุนครชัยศรี',
    '1010': 'คลังพัสดุนครชัยศรี',
    'I020': 'คลังสุพรรณบุรี',
    '1020': 'คลังสุพรรณบุรี',
    'I030': 'คลังกาญจนบุรี',
    '1030': 'คลังกาญจนบุรี',
    'I040': 'คลังสมุทรสาคร',
    '1040': 'คลังสมุทรสาคร',
    'I050': 'คลังสามพราน',
    '1050': 'คลังสามพราน',
    'I070': 'คลังท่ามะกา',
    '1070': 'คลังท่ามะกา',
    'I000': 'คลังส่วนกลาง (I000)',
    '1000': 'คลังส่วนกลาง (1000)'
  };

  function getWarehouseFromPlant(plant) {
    if (!plant) return '-';
    const p = String(plant).trim().toUpperCase();
    return MAT_WAREHOUSE_MAP[p] || (p !== '-' ? `คลัง ${p}` : '-');
  }

  // คอลัมน์ทั้งหมด 50 คอลัมน์ จากไฟล์ 03 / 04 / 07 / CUSTOM
  const MAT_COL_DEFS = [
    // --- ไฟล์ 03 WBS (9 คอลัมน์) ---
    { id: 'rowNo', label: 'ที่', width: '44px', minWidth: '40px', align: 'center', sortKey: 'id', defaultVisible: true, group: '03', source: '03' },
    { id: 'wbs', label: 'WBS (เลขที่งาน)', minWidth: '175px', align: 'left', sortKey: 'wbs', defaultVisible: true, group: '03', source: '03' },
    { id: 'criteria', label: 'ประเภทเกณฑ์วัด', minWidth: '160px', align: 'left', sortKey: 'criteria', defaultVisible: false, group: '03', source: '03' },
    { id: 'province', label: 'พื้นที่', minWidth: '95px', align: 'left', sortKey: 'province', defaultVisible: false, group: '03', source: '03' },
    { id: 'office', label: 'กอง / กฟฟ.', minWidth: '128px', align: 'left', sortKey: 'office', defaultVisible: true, group: '03', source: '03' },
    { id: 'budget', label: 'งบ', width: '68px', align: 'center', sortKey: 'budget', defaultVisible: false, group: '03', source: '03' },
    { id: 'engineer', label: 'ช่างคุมงาน', minWidth: '150px', align: 'left', sortKey: 'engineer', defaultVisible: false, group: '03', source: '03' },
    { id: 'department', label: 'สังกัด', minWidth: '135px', align: 'left', sortKey: 'department', defaultVisible: false, group: '03', source: '03' },
    { id: 'type', label: 'ประเภท', width: '78px', align: 'center', sortKey: 'type', defaultVisible: false, group: '03', source: '03' },

    // --- ไฟล์ 04 ZBUDR064 (25 คอลัมน์) ---
    { id: 'description', label: 'คำอธิบายภาษาไทย (ชื่องาน)', minWidth: '180px', align: 'left', sortKey: 'description', defaultVisible: true, group: '04', source: '04' },
    { id: 'statusSap', label: 'สถานะ SAP', minWidth: '108px', align: 'center', sortKey: 'statusSap', defaultVisible: true, group: 'custom', source: 'custom' },
    { id: 'status', label: 'Status (สถานะ SAP เต็ม)', minWidth: '165px', align: 'left', sortKey: 'status', defaultVisible: false, group: '04', source: '04' },
    { id: 'level', label: 'Lv', width: '52px', align: 'center', sortKey: 'level', defaultVisible: false, isNumeric: true, group: '04', source: '04' },
    { id: 'pctMatWithdraw', label: '% เบิกพัสดุ', minWidth: '88px', align: 'right', sortKey: 'pctMatWithdraw', defaultVisible: true, isPercent: true, isNumeric: true, group: 'custom', source: 'custom' },
    { id: 'pctExpenseWithdraw', label: '% เบิก คชจ.', minWidth: '88px', align: 'right', sortKey: 'pctExpenseWithdraw', defaultVisible: false, isPercent: true, isNumeric: true, group: 'custom', source: 'custom' },
    { id: 'budgetOrigin', label: 'งบประมาณต้นแบบ', minWidth: '120px', align: 'right', sortKey: 'budgetOrigin', defaultVisible: false, isMoney: true, isNumeric: true, group: '04', source: '04' },
    { id: 'budgetCurrent', label: 'งบประมาณปัจจุบัน', minWidth: '120px', align: 'right', sortKey: 'budgetCurrent', defaultVisible: false, isMoney: true, isNumeric: true, group: '04', source: '04' },
    { id: 'budgetAlloc', label: 'ที่จัดสรร', minWidth: '105px', align: 'right', sortKey: 'budgetAlloc', defaultVisible: false, isMoney: true, isNumeric: true, group: '04', source: '04' },
    { id: 'budgetDist', label: 'ที่กระจายได้', minWidth: '105px', align: 'right', sortKey: 'budgetDist', defaultVisible: false, isMoney: true, isNumeric: true, group: '04', source: '04' },
    { id: 'prPo', label: 'PR/PO', minWidth: '95px', align: 'right', sortKey: 'prPo', defaultVisible: false, isMoney: true, isNumeric: true, group: '04', source: '04' },
    { id: 'actMat121', label: 'Act.ค่าวัสดุ 121*', minWidth: '115px', align: 'right', sortKey: 'actMat121', defaultVisible: false, isMoney: true, isNumeric: true, group: '04', source: '04' },
    { id: 'actMatCheck', label: 'Act.ค่าวัสดุ(เช็คงบ)', minWidth: '120px', align: 'right', sortKey: 'actMatCheck', defaultVisible: false, isMoney: true, isNumeric: true, group: '04', source: '04' },
    { id: 'actMatPost', label: 'Act.ค่าวัสดุ(Post ย้อน 2016)', minWidth: '130px', align: 'right', sortKey: 'actMatPost', defaultVisible: false, isMoney: true, isNumeric: true, group: '04', source: '04' },
    { id: 'actMatNoCheck', label: 'Act.ค่าวัสดุ(ไม่เช็คงบ)', minWidth: '125px', align: 'right', sortKey: 'actMatNoCheck', defaultVisible: false, isMoney: true, isNumeric: true, group: '04', source: '04' },
    { id: 'actMatSite', label: 'Act.ค่าวัสดุเข้างาน (53051080)', minWidth: '135px', align: 'right', sortKey: 'actMatSite', defaultVisible: false, isMoney: true, isNumeric: true, group: '04', source: '04' },
    { id: 'actLabor', label: 'Act.ค่าจ้างเหมา', minWidth: '115px', align: 'right', sortKey: 'actLabor', defaultVisible: false, isMoney: true, isNumeric: true, group: '04', source: '04' },
    { id: 'actCoord', label: 'Act.ค่าประสานงาน', minWidth: '115px', align: 'right', sortKey: 'actCoord', defaultVisible: false, isMoney: true, isNumeric: true, group: '04', source: '04' },
    { id: 'actOtherSite', label: 'Act.คชจ.หน้างานอื่นๆ', minWidth: '120px', align: 'right', sortKey: 'actOtherSite', defaultVisible: false, isMoney: true, isNumeric: true, group: '04', source: '04' },
    { id: 'actTotalCtrl', label: 'รวม Act.ทั้งหมดที่ควบคุม งปม.', minWidth: '140px', align: 'right', sortKey: 'actTotalCtrl', defaultVisible: false, isMoney: true, isNumeric: true, group: '04', source: '04' },
    { id: 'budgetRemain', label: 'งบประมาณคงเหลือ', minWidth: '120px', align: 'right', sortKey: 'budgetRemain', defaultVisible: false, isMoney: true, isNumeric: true, group: '04', source: '04' },
    { id: 'planMat', label: 'Plan ค่าวัสดุ', minWidth: '115px', align: 'right', sortKey: 'planMat', defaultVisible: false, isMoney: true, isNumeric: true, group: '04', source: '04' },
    { id: 'planMatSite', label: 'Plan ค่าวัสดุเข้างาน (53051080)', minWidth: '135px', align: 'right', sortKey: 'planMatSite', defaultVisible: false, isMoney: true, isNumeric: true, group: '04', source: '04' },
    { id: 'planSite', label: 'Plan คชจ.หน้างาน', minWidth: '115px', align: 'right', sortKey: 'planSite', defaultVisible: false, isMoney: true, isNumeric: true, group: '04', source: '04' },
    { id: 'apprSite', label: 'อนุมัติ คชจ.หน้างาน', minWidth: '120px', align: 'right', sortKey: 'apprSite', defaultVisible: false, isMoney: true, isNumeric: true, group: '04', source: '04' },

    // --- ไฟล์ 07 พัสดุค้างเบิก CN52N (15 คอลัมน์: 14 คอลัมน์ต้นฉบับ + 1 คอลัมน์ผลต่างค้างเบิก) ---
    { id: 'matCode', label: 'วัสดุ (รหัสพัสดุ)', minWidth: '125px', align: 'left', sortKey: 'matCode', defaultVisible: true, group: '07', source: '07' },
    { id: 'matDesc', label: 'ข้อความวัสดุ', minWidth: '210px', align: 'left', sortKey: 'matDesc', defaultVisible: true, group: '07', source: '07' },
    { id: 'wbs07', label: 'องค์ประกอบ WBS (ไฟล์ 07)', minWidth: '175px', align: 'left', sortKey: 'wbs07', defaultVisible: false, group: '07', source: '07' },
    { id: 'network', label: 'โครงข่าย', minWidth: '105px', align: 'center', sortKey: 'network', defaultVisible: false, group: '07', source: '07' },
    { id: 'plant', label: 'โรงงาน', width: '74px', align: 'center', sortKey: 'plant', defaultVisible: true, group: '07', source: '07' },
    { id: 'warehouse', label: 'คลังพัสดุ', minWidth: '145px', align: 'left', sortKey: 'warehouse', defaultVisible: true, group: 'custom', source: 'custom' },
    { id: 'sloc', label: 'จุดขนส/คลง', width: '88px', align: 'center', sortKey: 'sloc', defaultVisible: false, group: '07', source: '07' },
    { id: 'mvtType', label: 'Mvt.type', width: '82px', align: 'center', sortKey: 'mvtType', defaultVisible: true, group: '07', source: '07' },
    { id: 'reservation', label: 'การสำรอง', minWidth: '105px', align: 'center', sortKey: 'reservation', defaultVisible: false, group: '07', source: '07' },
    { id: 'matStatus', label: 'สถานะ (พัสดุ CN52N)', width: '92px', align: 'center', sortKey: 'matStatus', defaultVisible: false, group: '07', source: '07' },
    { id: 'unit', label: 'UnE', width: '64px', align: 'center', sortKey: 'unit', defaultVisible: true, group: '07', source: '07' },
    { id: 'reqQty', label: 'ปริมาณที่ต้องการ', minWidth: '112px', align: 'right', sortKey: 'reqQty', defaultVisible: true, isQty: true, isNumeric: true, group: '07', source: '07' },
    { id: 'wdrQty', label: 'ปริมาณการเบิกจ่าย', minWidth: '115px', align: 'right', sortKey: 'wdrQty', defaultVisible: true, isQty: true, isNumeric: true, group: '07', source: '07' },
    { id: 'remainQty', label: 'ปริมาณค้างเบิก', minWidth: '112px', align: 'right', sortKey: 'remainQty', defaultVisible: true, isQty: true, isNumeric: true, group: 'custom', source: 'custom' },
    { id: 'reqDate', label: 'วันต้องการ', minWidth: '98px', align: 'center', sortKey: 'reqDateSort', defaultVisible: false, group: '07', source: '07' },
    { id: 'priceLocal', label: 'ราคา/สกุลเงินในปท.', minWidth: '132px', align: 'right', sortKey: 'priceLocal', defaultVisible: true, isMoney: true, isNumeric: true, group: '07', source: '07' }
  ];

  const MAT_COL_MAP = {};
  MAT_COL_DEFS.forEach(c => { MAT_COL_MAP[c.id] = c; });

  const matState = {
    hydrated: false,
    allRows: [],
    meta: null,
    totalBase03Wbs: 0,
    matched03WbsCount: 0,
    page: 1,
    pageSize: 25,
    sortCol: 'remainQty',
    sortAsc: false,
    localSearch: '',
    filterWbs: '',
    filterMatDesc: '',
    filterSapStatus: 'ALL',
    filterPlant: '',
    chartSelDesc: '',
    chartBudgetFilter: 'ALL', // 'ALL' | 'IP' | 'C' (เลือกแสดงตามงบ I,P หรือ C หรือ ทั้ง 2 งบ)
    chartSelBudget: 'ALL',    // 'ALL' | 'IP' | 'C' (งบประมาณที่เลือกจากการคลิกแท่งกราฟโดยตรง)
    wbsStatsExpanded: false,  // ซ่อนสรุปงาน WBS เริ่มต้นตามคำสั่งผู้ใช้งาน (มีปุ่มลูกศรสีเหลืองกดเพื่อแสดง/ซ่อน)
    lastCrit: null,           // ติดตามเกณฑ์วัดล่าสุดเพื่อซิงก์สถานะล็อคงบประมาณตามเกณฑ์วัด
    pendingMode: 'ALL', // 'ALL' | 'DIFF' | 'POS' | 'DONE'
    mvtFilter: '281',   // ดึงข้อมูลเฉพาะ Mvt 281 เท่านั้น
    hasMatFilter: 'HAS_MAT', // 'HAS_MAT' (default มีพัสดุ) | 'NO_MAT' (ไม่มีพัสดุ) | 'ALL' (ทั้งหมด)
    scopeStats: null,
    sapStatuses: new Set(),
    colViewMode: 'order', // 'order' | 'group'
    colSearchQuery: '',
    visibleColumns: {},
    columnOrder: [],
    dragColId: null,
    domBuilt: false,
    cachedFilterKey: '',
    cachedFilteredRows: []
  };

  // Load persisted column visibility & order
  function initColumnPrefs() {
    let savedVis = null;
    let savedOrd = null;
    try {
      const vRaw = localStorage.getItem(STORAGE_VIS_KEY);
      if (vRaw) savedVis = JSON.parse(vRaw);
      const oRaw = localStorage.getItem(STORAGE_ORD_KEY);
      if (oRaw) savedOrd = JSON.parse(oRaw);
    } catch (e) { }

    MAT_COL_DEFS.forEach(c => {
      matState.visibleColumns[c.id] = (savedVis && typeof savedVis[c.id] === 'boolean')
        ? savedVis[c.id]
        : !!c.defaultVisible;
    });

    if (Array.isArray(savedOrd) && savedOrd.length > 0) {
      const validIds = savedOrd.filter(id => !!MAT_COL_MAP[id]);
      MAT_COL_DEFS.forEach(c => {
        if (!validIds.includes(c.id)) {
          const defIdx = MAT_COL_DEFS.findIndex(x => x.id === c.id);
          const prevDef = defIdx > 0 ? MAT_COL_DEFS[defIdx - 1] : null;
          const prevPos = prevDef ? validIds.indexOf(prevDef.id) : -1;
          if (prevPos >= 0) {
            validIds.splice(prevPos + 1, 0, c.id);
          } else {
            validIds.push(c.id);
          }
        }
      });
      matState.columnOrder = validIds;
    } else {
      matState.columnOrder = MAT_COL_DEFS.map(c => c.id);
    }
  }

  function saveColumnPrefs() {
    try {
      localStorage.setItem(STORAGE_VIS_KEY, JSON.stringify(matState.visibleColumns));
      localStorage.setItem(STORAGE_ORD_KEY, JSON.stringify(matState.columnOrder));
    } catch (e) { }
  }

  function getOrderedMatColDefs() {
    return matState.columnOrder.map(id => MAT_COL_MAP[id]).filter(Boolean);
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatMoney(val) {
    if (val === null || val === undefined || val === '') return '-';
    const num = Number(val);
    if (isNaN(num)) return escapeHtml(val);
    return num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatQty(val) {
    if (val === null || val === undefined || val === '') return '0';
    const num = Number(val);
    if (isNaN(num)) return escapeHtml(val);
    return Math.round(num).toLocaleString('th-TH');
  }

  function formatSapStatusShort(status) {
    if (!status || typeof status !== 'string') return '';
    const s = status.trim();
    if (!s) return '';
    let first = '';
    const m1 = s.match(/^([A-Za-z]{3,4})\b/);
    if (m1) first = m1[1].toUpperCase();
    let last = '';
    const m2 = s.match(/\/\/\s*([A-Za-z0-9]{2})\s*$/) || s.match(/([A-Za-z0-9]{2})\s*$/);
    if (m2) last = m2[1].toUpperCase();
    return (first && last) ? `${first} ${last}` : (first || s);
  }

  function getSapBadgeClass(val) {
    if (!val) return '';
    const u = String(val).toUpperCase().trim();
    if (u.includes('CLSD')) return 'badge-sap-clsd';
    if (u.includes('TECO')) return 'badge-sap-teco';
    if (u.includes('REL')) return 'badge-sap-rel';
    if (u.includes('CRTD')) return 'badge-sap-crtd';
    return 'badge-sap-other';
  }

  function matchesCriteria(itemCrit, filterCrit) {
    if (!filterCrit || filterCrit === 'ALL' || filterCrit === 'เลือกทั้งหมด' || filterCrit === 'ทุกเกณฑ์วัด' || filterCrit === 'ทั้งหมด') return true;
    if (!itemCrit) return false;
    if (itemCrit === filterCrit) return true;
    const getPrefix = (s) => (s.match(/^(ข้อ\s*[\d\.]+)/) || [])[1] || s;
    const p1 = getPrefix(itemCrit).replace(/\s+/g, '');
    const p2 = getPrefix(filterCrit).replace(/\s+/g, '');
    if (p1 && p2 && p1 === p2) return true;
    return itemCrit.includes(p2) || filterCrit.includes(p1);
  }

  /**
   * ตรวจสอบว่าเกณฑ์วัดที่เลือก ล็อคเฉพาะงบประมาณใดหรือไม่
   * - งบ C: ข้อ 1.1, ข้อ 2.1, ข้อ 4, C02.2 หรือมีคำว่า "งบ C" -> คืนค่า 'C'
   * - งบ I, P: ข้อ 1.2, ข้อ 1.3, ข้อ 2.2 หรือมีคำว่า "งบ I" หรือ "งบ P" -> คืนค่า 'IP'
   * - อื่นๆ (เลือกทั้งหมด, ข้อ 3.1, 3.2, 3.3, ข้อ 5): คืนค่า null (ไม่ล็อคงบ)
   */
  function getCriteriaBudgetLock(crit) {
    if (!crit || crit === 'ALL' || crit === 'เลือกทั้งหมด' || crit === 'ทุกเกณฑ์วัด' || crit === 'ทั้งหมด') {
      return null;
    }
    const c = String(crit).trim();
    if (/(?:ข้อ\s*|crit\s*|^)(?:1\.1|2\.1|4\b)|C02\.2|งบ\s*C\b/i.test(c)) {
      return 'C';
    }
    if (/(?:ข้อ\s*|crit\s*|^)(?:1\.2|1\.3|2\.2)|งบ\s*(?:I|P|[IP]\s*,\s*[IP])/i.test(c)) {
      return 'IP';
    }
    return null;
  }

  function parseDateSortNum(ddmmyyyy) {
    if (!ddmmyyyy || ddmmyyyy.length < 8) return 0;
    const parts = ddmmyyyy.split('/');
    if (parts.length !== 3) return 0;
    return (parseInt(parts[2], 10) || 0) * 10000 + (parseInt(parts[1], 10) || 0) * 100 + (parseInt(parts[0], 10) || 0);
  }

  /**
   * Hydrate & Join:
   * - Master Table: File 03 WBS (window.AUC_WBS_REMAINING_DATA, which also carries File 04 ZBUDR064 via ข้อกำหนดโครงการ /WBS)
   * - Detail Table: File 07 CN52N (window.AUC_MAT07_COMPACT, joined via องค์ประกอบ WBS === File 03 WBS)
   */
  function ensureMaterialsHydrated() {
    if (matState.hydrated && matState.allRows.length > 0) return true;
    const baseWbsData = window.AUC_WBS_REMAINING_DATA;
    const compact07 = window.AUC_MAT07_COMPACT;
    if (!Array.isArray(baseWbsData) || !compact07 || !compact07.d || !Array.isArray(compact07.r)) {
      return false;
    }

    matState.totalBase03Wbs = baseWbsData.length;
    matState.meta = compact07.meta || {};

    // Index File 03 (+ File 04) by WBS
    const wbsMasterMap = new Map();
    for (let i = 0; i < baseWbsData.length; i++) {
      const rec = baseWbsData[i];
      const w = (rec.wbs || '').trim();
      if (!w) continue;
      if (!wbsMasterMap.has(w)) {
        wbsMasterMap.set(w, {
          ref: rec,
          criteriaList: rec.criteria ? [rec.criteria] : [],
          sapShort: rec.statusSap || formatSapStatusShort(rec.status)
        });
      } else {
        const entry = wbsMasterMap.get(w);
        if (rec.criteria && !entry.criteriaList.includes(rec.criteria)) {
          entry.criteriaList.push(rec.criteria);
        }
      }
    }

    const d = compact07.d;
    const tuples = compact07.r;
    const joined = [];
    const matchedWbsSet = new Set();
    const mergedMap = new Map();

    // Cache date sort integers per dictionary index
    const dtSortCache = new Array(d.dt.length);
    for (let i = 0; i < d.dt.length; i++) {
      dtSortCache[i] = parseDateSortNum(d.dt[i]);
    }

    for (let i = 0; i < tuples.length; i++) {
      const t = tuples[i];
      const mvtVal = String(d.mv[t[6]] || '').trim();
      // ดึงข้อมูลจากไฟล์ 07 เฉพาะ Mvt.type = 281 เท่านั้น
      if (mvtVal !== '281') continue;

      // แสดงเฉพาะรหัสพัสดุที่ขึ้นต้นด้วย 1 เท่านั้น
      if (String(d.m[t[1]] || '').trim().charAt(0) !== '1') continue;

      const wbs = d.w[t[0]];
      const master = wbsMasterMap.get(wbs);
      // ใช้ไฟล์ 03 คอลัมน์ WBS เป็นตัวอ้างอิงหลักเท่านั้น
      if (!master) continue;

      matchedWbsSet.add(wbs);
      const reqQty = Number(t[10]) || 0;
      const wdrQty = Number(t[11]) || 0;
      // ปริมาณค้างเบิก = ปริมาณที่ต้องการ − ปริมาณการเบิกจ่าย − จุดขนส/คลง
      const slocQty = parseFloat(String(d.sl[t[5]] || '').replace(/,/g, '')) || 0;
      // หากติดลบให้เท่ากับ 0
      const remainQty = Math.max(0, Math.round((reqQty - wdrQty - slocQty) * 1000) / 1000);

      // รวมรายการที่ WBS + รหัสพัสดุ เดียวกัน (หลายใบจอง/Network) เป็นบรรทัดเดียว
      const mergeKey = wbs + '§' + d.m[t[1]];
      const exist = mergedMap.get(mergeKey);
      if (exist) {
        exist.reqQty = Math.round((exist.reqQty + reqQty) * 1000) / 1000;
        exist.wdrQty = Math.round((exist.wdrQty + wdrQty) * 1000) / 1000;
        exist.remainQty = Math.round((exist.remainQty + remainQty) * 1000) / 1000;
        const addUniq = (field, val) => {
          const v = String(val || '').trim();
          if (!v) return;
          const parts = String(exist[field] || '').split(', ').filter(Boolean);
          if (!parts.includes(v)) { parts.push(v); exist[field] = parts.join(', '); }
        };
        addUniq('network', d.nw[t[3]]);
        addUniq('reservation', d.rs[t[7]]);
        exist.mergedCount = (exist.mergedCount || 1) + 1;
        if (dtSortCache[t[12]] && (!exist.reqDateSort || dtSortCache[t[12]] < exist.reqDateSort)) {
          exist.reqDate = d.dt[t[12]];
          exist.reqDateSort = dtSortCache[t[12]];
        }
        continue;
      }

      const newRow = {
        id: joined.length + 1,
        wbs: wbs,
        wbs07: wbs,
        m: master.ref,
        critList: master.criteriaList,
        sapShort: master.sapShort,
        matCode: d.m[t[1]],
        matDesc: d.md[t[2]],
        network: d.nw[t[3]],
        plant: d.pl[t[4]],
        warehouse: getWarehouseFromPlant(d.pl[t[4]]),
        sloc: d.sl[t[5]],
        mvtType: mvtVal,
        reservation: d.rs[t[7]],
        matStatus: d.st[t[8]],
        unit: d.un[t[9]],
        reqQty: reqQty,
        wdrQty: wdrQty,
        remainQty: remainQty,
        reqDate: d.dt[t[12]],
        reqDateSort: dtSortCache[t[12]],
        priceLocal: Number(t[13]) || 0,
        mergedCount: 1
      };
      mergedMap.set(mergeKey, newRow);
      joined.push(newRow);
    }

    // แสดงครบทุกงาน WBS ของไฟล์ 03 : งานที่ไม่มีรายการพัสดุ (Mvt 281) ให้เพิ่มแถวว่างและแจ้งว่าไม่มีรายการพัสดุ
    wbsMasterMap.forEach((master, wbs) => {
      if (matchedWbsSet.has(wbs)) return;
      joined.push({
        id: 0,
        wbs: wbs,
        wbs07: '',
        m: master.ref,
        critList: master.criteriaList,
        sapShort: master.sapShort,
        noMat: true,
        matCode: '',
        matDesc: 'ไม่มีรายการพัสดุค้างเบิก',
        network: '', plant: '', warehouse: '', sloc: '', mvtType: '', reservation: '', matStatus: '', unit: '',
        reqQty: 0, wdrQty: 0, remainQty: 0,
        reqDate: '', reqDateSort: 0, priceLocal: 0
      });
    });

    // เรียงตามลำดับ WBS ของไฟล์ 03 (คงลำดับรายการพัสดุเดิมภายในแต่ละ WBS)
    const wbsOrder = new Map();
    let oi = 0;
    wbsMasterMap.forEach((v, k) => { wbsOrder.set(k, oi++); });
    joined.sort((a, b) => (wbsOrder.get(a.wbs) - wbsOrder.get(b.wbs)));
    for (let i = 0; i < joined.length; i++) joined[i].id = i + 1;

    matState.allRows = joined;
    matState.matched03WbsCount = matchedWbsSet.size;
    matState.hydrated = true;
    matState.cachedFilterKey = '';
    return true;
  }

  function getGlobalFilters() {
    const gs = window.state || {};
    const gf = gs.filters || {};
    const crit = gf.criteria || (document.getElementById('filterCriteria') ? document.getElementById('filterCriteria').value : 'ALL');
    const prov = gf.province || (document.getElementById('filterProvince') ? document.getElementById('filterProvince').value : 'ALL');
    const off = gf.office || (document.getElementById('filterOffice') ? document.getElementById('filterOffice').value : 'ALL');
    const search = (gf.search !== undefined ? gf.search : (document.getElementById('searchInput') ? document.getElementById('searchInput').value : '')).trim().toLowerCase();
    return { crit, prov, off, search };
  }

  /**
   * เปรียบเทียบข้อความพัสดุ โดยนำรายการภาษาอังกฤษ/ตัวเลขอารบิกขึ้นก่อนเสมอ (A-Z) แล้วตามด้วยภาษาไทย (ก-ฮ)
   */
  function compareMatDescEnglishFirst(a, b) {
    const sa = String(a || '').trim();
    const sb = String(b || '').trim();
    const aThai = /^[\u0E00-\u0E7F]/.test(sa.replace(/^[^a-zA-Z\u0E00-\u0E7F0-9]+/, ''));
    const bThai = /^[\u0E00-\u0E7F]/.test(sb.replace(/^[^a-zA-Z\u0E00-\u0E7F0-9]+/, ''));
    if (aThai !== bThai) return aThai ? 1 : -1; // ภาษาอังกฤษอยู่บนสุดเสมอ
    return sa.localeCompare(sb, aThai ? 'th' : 'en', { numeric: true, sensitivity: 'base' });
  }

  function getFieldVal(row, key, activeCrit) {
    switch (key) {
      case 'id':
      case 'wbs':
      case 'wbs07':
      case 'matCode':
      case 'matDesc':
      case 'network':
      case 'plant':
      case 'warehouse':
      case 'sloc':
      case 'mvtType':
      case 'reservation':
      case 'matStatus':
      case 'unit':
      case 'reqQty':
      case 'wdrQty':
      case 'remainQty':
      case 'reqDate':
      case 'reqDateSort':
      case 'priceLocal':
        return row[key];
      case 'statusSap':
        return row.sapShort;
      case 'criteria':
        if (activeCrit && activeCrit !== 'ALL' && activeCrit !== 'เลือกทั้งหมด') {
          const matched = row.critList.find(c => matchesCriteria(c, activeCrit));
          if (matched) return matched;
        }
        return row.critList.join(', ') || row.m.criteria || '';
      default:
        return row.m ? row.m[key] : '';
    }
  }

  /**
   * @param {boolean} skipTableSap  ข้ามตัวกรองสถานะ SAP แบบหลายค่า (ใช้สร้างรายการตัวเลือก)
   * @param {boolean} ignoreChartSel ข้ามตัวกรองที่เลือกจากกราฟแนวนอน (ใช้สร้างกราฟเอง เพื่อให้กราฟทำงานทางเดียว)
   * @param {boolean} skipPlantFilter ข้ามตัวกรองคลังพัสดุ (ใช้คำนวณยอดค้างเบิกทั้ง 6 คลังในการ์ดคลังพัสดุที่ผูกกับ WBS คงเหลือ)
   */
  function getFilteredMaterialRows(skipTableSap = false, ignoreChartSel = false, skipPlantFilter = false) {
    if (!ensureMaterialsHydrated()) return [];

    const gf = getGlobalFilters();
    const sapKey = skipTableSap ? 'SKIP_SAP' : Array.from(matState.sapStatuses).sort().join('|');
    const activeBudgetFilter = (matState.chartSelBudget && matState.chartSelBudget !== 'ALL')
      ? matState.chartSelBudget
      : (matState.chartBudgetFilter || 'ALL');
    const chartDescKey = ignoreChartSel ? '' : (matState.chartSelDesc || '');
    const chartBudgetKey = ignoreChartSel ? '' : activeBudgetFilter;
    const cacheKey = [
      gf.crit, gf.prov, gf.off, gf.search,
      matState.localSearch, matState.pendingMode, matState.mvtFilter, matState.hasMatFilter,
      matState.filterWbs, matState.filterMatDesc, matState.filterSapStatus, (skipPlantFilter ? '' : (matState.filterPlant || '')),
      chartDescKey, chartBudgetKey,
      sapKey, matState.sortCol, matState.sortAsc ? '1' : '0'
    ].join('§');

    if (!skipTableSap && !ignoreChartSel && !skipPlantFilter && matState.cachedFilterKey === cacheKey) {
      return matState.cachedFilteredRows;
    }

    const filterCrit = gf.crit;
    const hasCritFilter = filterCrit && filterCrit !== 'ALL' && filterCrit !== 'เลือกทั้งหมด';
    const hasProvFilter = gf.prov && gf.prov !== 'ALL' && gf.prov !== 'กฟก.3 (ทั้งหมด)';
    const hasOffFilter = gf.off && gf.off !== 'ALL';
    const topQ = gf.search;
    const locQ = (matState.localSearch || '').trim().toLowerCase();
    const subWbsQ = (matState.filterWbs || '').trim().toLowerCase();
    const subDescQ = (matState.filterMatDesc || '').trim().toLowerCase();
    const subSap = String(matState.filterSapStatus || 'ALL').toUpperCase() === 'ALL' ? 'ALL' : String(matState.filterSapStatus).toUpperCase();
    const pMode = matState.pendingMode;
    const mvtF = matState.mvtFilter;
    const hasSapF = !skipTableSap && matState.sapStatuses.size > 0;

    const src = matState.allRows;
    const out = [];
    const scopeWbsSet = new Set();
    const scopeWithMatSet = new Set();
    const scopeNoMatSet = new Set();

    for (let i = 0; i < src.length; i++) {
      const r = src[i];
      const m = r.m;

      if (hasCritFilter) {
        let ok = false;
        for (let c = 0; c < r.critList.length; c++) {
          if (matchesCriteria(r.critList[c], filterCrit)) { ok = true; break; }
        }
        if (!ok) continue;
      }

      if (hasProvFilter && m.province !== gf.prov) continue;
      if (hasOffFilter && m.office !== gf.off) continue;

      if (pMode === 'DIFF' && Math.abs(r.remainQty) < 0.0005) continue;
      if (pMode === 'POS' && r.remainQty <= 0.0005) continue;
      if (pMode === 'DONE' && Math.abs(r.remainQty) >= 0.0005) continue;

      if (!r.noMat && r.mvtType !== '281') continue;

      if (topQ) {
        const hitTop =
          (r.wbs && r.wbs.toLowerCase().includes(topQ)) ||
          (r.matCode && r.matCode.toLowerCase().includes(topQ)) ||
          (r.matDesc && r.matDesc.toLowerCase().includes(topQ)) ||
          (m.office && m.office.toLowerCase().includes(topQ)) ||
          (m.province && m.province.toLowerCase().includes(topQ)) ||
          (m.description && m.description.toLowerCase().includes(topQ)) ||
          (r.sapShort && r.sapShort.toLowerCase().includes(topQ)) ||
          (m.engineer && m.engineer.toLowerCase().includes(topQ)) ||
          (r.network && r.network.toLowerCase().includes(topQ)) ||
          (r.plant && r.plant.toLowerCase().includes(topQ)) ||
          (r.warehouse && r.warehouse.toLowerCase().includes(topQ)) ||
          (r.reservation && r.reservation.toLowerCase().includes(topQ));
        if (!hitTop) continue;
      }

      // บันทึกสถิติงานทั้งหมดที่ผ่านตัวกรองหลักด้านบน (ก่อนกรองย่อยในวงแดงและก่อนแยกมี/ไม่มีพัสดุ)
      scopeWbsSet.add(r.wbs);
      if (r.noMat) scopeNoMatSet.add(r.wbs);
      else scopeWithMatSet.add(r.wbs);

      // กรองตามปุ่มเลือกในวงเหลือง มี/ไม่มีพัสดุ (Default: พบพัสดุ 'HAS_MAT')
      if (matState.hasMatFilter === 'HAS_MAT' && r.noMat) continue;
      if (matState.hasMatFilter === 'NO_MAT' && !r.noMat) continue;

      if (hasSapF && !matState.sapStatuses.has(r.sapShort || '(ไม่ระบุ)')) continue;

      // ตัวกรองย่อยเฉพาะหน้าเมนูรายการพัสดุ (WBS / ข้อความวัสดุ / สถานะ SAP)
      if (subWbsQ && subWbsQ !== 'all' && (r.wbs || '').toLowerCase() !== subWbsQ) continue;
      if (subDescQ && subDescQ !== 'all' && (r.matDesc || '').toLowerCase() !== subDescQ) continue;
      if (!skipPlantFilter && matState.filterPlant && String(r.plant || '').trim().toUpperCase() !== matState.filterPlant) continue;

      // กรองเชื่อมโยงตามรายการพัสดุและงบประมาณที่เลือกจากกราฟแนวนอน (รวมถึงการกดปุ่มเลือกงบ I,P สีแดงเข้ม หรือ งบ C สีส้มอ่อน)
      if (!ignoreChartSel) {
        if (matState.chartSelDesc) {
          const rowDesc = String(r.matDesc || r.matCode || '').trim();
          if (rowDesc !== matState.chartSelDesc.trim()) continue;
        }

        if (activeBudgetFilter === 'IP') {
          const isC = String(r.wbs || '').trim().toUpperCase().startsWith('C');
          if (isC) continue;
        } else if (activeBudgetFilter === 'C') {
          const isC = String(r.wbs || '').trim().toUpperCase().startsWith('C');
          if (!isC) continue;
        }
      }
      if (subSap !== 'ALL') {
        const sShort = String(r.sapShort || '').toUpperCase();
        if (subSap === '(ไม่ระบุ)') { if (sShort) continue; }
        else if (sShort !== subSap && !sShort.startsWith(subSap + ' ')) continue;
      }

      if (locQ) {
        const hitLoc =
          (r.matCode && r.matCode.toLowerCase().includes(locQ)) ||
          (r.matDesc && r.matDesc.toLowerCase().includes(locQ)) ||
          (r.wbs && r.wbs.toLowerCase().includes(locQ)) ||
          (r.network && r.network.toLowerCase().includes(locQ)) ||
          (r.reservation && r.reservation.toLowerCase().includes(locQ)) ||
          (r.plant && r.plant.toLowerCase().includes(locQ)) ||
          (r.warehouse && r.warehouse.toLowerCase().includes(locQ)) ||
          (m.description && m.description.toLowerCase().includes(locQ)) ||
          (m.office && m.office.toLowerCase().includes(locQ)) ||
          (r.sapShort && r.sapShort.toLowerCase().includes(locQ));
        if (!hitLoc) continue;
      }

      out.push(r);
    }

    if (!skipTableSap && !ignoreChartSel && !skipPlantFilter) {
      let scope03RowCount = 0;
      const baseWbsData = window.AUC_WBS_REMAINING_DATA || [];
      for (let i = 0; i < baseWbsData.length; i++) {
        const b = baseWbsData[i];
        if (hasCritFilter && !matchesCriteria(b.criteria, filterCrit)) continue;
        if (hasProvFilter && b.province !== gf.prov) continue;
        if (hasOffFilter && b.office !== gf.off) continue;
        if (topQ) {
          const hit =
            (b.wbs && b.wbs.toLowerCase().includes(topQ)) ||
            (b.office && b.office.toLowerCase().includes(topQ)) ||
            (b.province && b.province.toLowerCase().includes(topQ)) ||
            (b.description && b.description.toLowerCase().includes(topQ)) ||
            (b.engineer && b.engineer.toLowerCase().includes(topQ));
          if (!hit) continue;
        }
        scope03RowCount++;
      }

      matState.scopeStats = {
        uniqueWbs: scopeWbsSet.size,
        withMatWbs: scopeWithMatSet.size,
        noMatWbs: scopeNoMatSet.size,
        total03Rows: scope03RowCount
      };
    }

    // Sort table rows (default: ปริมาณค้างเบิกสูงสุดอยู่บนสุดเสมอ)
    if (!skipTableSap && !ignoreChartSel && !skipPlantFilter) {
      const sKey = matState.sortCol || 'remainQty';
      const asc = matState.sortAsc;
      const colDef = MAT_COL_DEFS.find(c => c.sortKey === sKey) || {};
      const isNum = !!colDef.isNumeric || sKey === 'id' || sKey === 'reqDateSort' || sKey === 'remainQty';
      out.sort((a, b) => {
        const va = getFieldVal(a, sKey, filterCrit);
        const vb = getFieldVal(b, sKey, filterCrit);
        let cmp = 0;
        if (isNum) {
          cmp = (Number(va) || 0) - (Number(vb) || 0);
        } else if (sKey === 'matDesc') {
          cmp = compareMatDescEnglishFirst(va, vb);
        } else if (sKey === 'statusSap') {
          const rk = (s) => {
            const up = String(s || '').toUpperCase().trim();
            if (up.startsWith('CLSD')) return 0;
            if (up.startsWith('TECO')) return 1;
            if (up.startsWith('REL')) return 2;
            return 3;
          };
          cmp = rk(va) - rk(vb);
          if (cmp === 0) {
            const so = (s) => {
              const m = String(s || '').toUpperCase().match(/([A-Z])\s*(\d+)\s*$/);
              return m ? { l: m[1], n: parseInt(m[2], 10) } : { l: '', n: -1 };
            };
            const x = so(va), y = so(vb);
            if (x.l !== y.l) cmp = x.l < y.l ? 1 : -1;
            else if (x.n !== y.n) cmp = y.n - x.n;
          }
        } else {
          cmp = String(va || '').localeCompare(String(vb || ''), 'th');
        }
        if (cmp !== 0) return asc ? cmp : -cmp;
        return a.id - b.id;
      });

      matState.cachedFilterKey = cacheKey;
      matState.cachedFilteredRows = out;
    }

    return out;
  }

  /**
   * Build the #tab-materials DOM structure once (styled identically to WBS Table Card in Screenshot 8+)
   */
  function ensureMaterialsDomBuilt() {
    const pane = document.getElementById('tab-materials');
    if (!pane) return false;
    if (matState.domBuilt && document.getElementById('matTableCard')) return true;

    const m07 = (window.AUC_MAT07_COMPACT && window.AUC_MAT07_COMPACT.meta) || {};
    const m08 = (window.AUC_MAT08_STOCK && window.AUC_MAT08_STOCK.meta) || {};
    const date07Short = m07.lastModifiedShortTh || '5 พ.ย. 69';
    const date07Full = m07.lastModifiedTh || '5 พ.ย. 2569, 14:31 น.';
    const date08Short = m08.lastModifiedShortTh || '5 พ.ย. 69';
    const date08Full = m08.lastModifiedTh || '5 พ.ย. 2569, 14:51 น.';
    const date04Short = '12 พ.ย. 69';

    pane.innerHTML = `
      <!-- แถบสรุปภาพรวมรายการพัสดุค้างเบิก (ไฟล์ 07 เชื่อมไฟล์ 03 WBS และไฟล์ 04 ZBUDR064) -->
      <!-- ตัวกรองย่อยเฉพาะเมนูรายการพัสดุ: WBS / ข้อความวัสดุ / สถานะ SAP -->
      <div class="mat-sub-filter-bar" id="matSubFilterBar">
        <!-- วันที่แก้ไขล่าสุดของไฟล์ 07 พัสดุค้างเบิก, ไฟล์ 08 พัสดุคงเหลือ และไฟล์ 04 สถานะ SAP แสดงบรรทัดบนสุดในกรอบการ์ดตัวกรอง (แสดงอย่างเดียว กดไม่ได้) -->
        <div class="mat-top-file-dates-bar" id="matHChartFileDates">
          <span class="mat-hchart-fdate-item fdate-07">ไฟล์ 07 พัสดุค้างเบิก แก้ไขล่าสุด: <strong id="matChartFile07Date">${date07Short}</strong></span>
          <span class="mat-hchart-fdate-sep">|</span>
          <span class="mat-hchart-fdate-item fdate-08">ไฟล์ 08 พัสดุคงเหลือ แก้ไขล่าสุด: <strong id="matChartFile08Date">${date08Short}</strong></span>
          <span class="mat-hchart-fdate-sep">|</span>
          <span class="mat-hchart-fdate-item fdate-04">ไฟล์ 04 สถานะ SAP แก้ไขล่าสุด: <strong id="matChartFile04Date">${date04Short}</strong></span>
        </div>
        <div class="mat-sf-title" id="matSfTitle">🔎 ตัวกรองรายการที่พบพัสดุ</div>
        <div class="mat-sf-group mat-sf-desc-wrap" onclick="event.stopPropagation()">
          <span class="mat-sf-label">WBS</span>
          <select id="matFilterWbs" class="mat-sf-select" style="display:none;" onchange="window.handleMatFilterWbsChange(this.value)">
            <option value="ALL">-- แสดง WBS ทั้งหมด --</option>
          </select>
          <button type="button" class="mat-sf-select mat-sf-desc-btn" id="matFilterWbsBtn" onclick="window.toggleMatWbsDropdown(event)">
            <span id="matFilterWbsBtnText">-- แสดง WBS ทั้งหมด --</span>
            <span class="mat-sf-desc-chev">▼</span>
          </button>
          <div class="mat-desc-dd-panel" id="matWbsDropdownPanel" style="display:none;" onclick="event.stopPropagation()">
            <div class="mat-desc-dd-search-row">
              <span>🔍</span>
              <input type="text" id="matWbsDropdownSearch" class="mat-desc-dd-search-input" placeholder="พิมพ์ค้นหา WBS..." autocomplete="off"
                     oninput="window.filterMatWbsDropdownList(this.value)" onkeydown="window.handleMatWbsSearchKey(event)" />
              <span class="mat-desc-dd-count" id="matWbsDropdownCount"></span>
            </div>
            <div class="mat-desc-dd-list" id="matWbsDropdownList"></div>
          </div>
          <button type="button" class="mat-sf-clear-btn" id="matClearWbsBtn" onclick="window.clearMatFilterWbs()" title="ล้างตัวกรอง WBS นี้" style="display:none;">✕</button>
        </div>
        <div class="mat-sf-group mat-sf-desc-wrap" onclick="event.stopPropagation()">
          <span class="mat-sf-label">ข้อความวัสดุ</span>
          <select id="matFilterMatDesc" class="mat-sf-select" style="display:none;" onchange="window.handleMatFilterDescChange(this.value)">
            <option value="ALL">-- แสดงข้อความวัสดุทั้งหมด --</option>
          </select>
          <button type="button" class="mat-sf-select mat-sf-desc-btn" id="matFilterMatDescBtn" onclick="window.toggleMatDescDropdown(event)">
            <span id="matFilterMatDescBtnText">-- แสดงข้อความวัสดุทั้งหมด --</span>
            <span class="mat-sf-desc-chev">▼</span>
          </button>
          <div class="mat-desc-dd-panel" id="matDescDropdownPanel" style="display:none;" onclick="event.stopPropagation()">
            <div class="mat-desc-dd-search-row">
              <span>🔍</span>
              <input type="text" id="matDescDropdownSearch" class="mat-desc-dd-search-input" placeholder="พิมพ์ค้นหาข้อความวัสดุ..." autocomplete="off"
                     oninput="window.filterMatDescDropdownList(this.value)" onkeydown="window.handleMatDescSearchKey(event)" />
              <span class="mat-desc-dd-count" id="matDescDropdownCount"></span>
            </div>
            <div class="mat-desc-dd-list" id="matDescDropdownList"></div>
          </div>
          <button type="button" class="mat-sf-clear-btn" id="matClearDescBtn" onclick="window.clearMatFilterDesc()" title="ล้างตัวกรองข้อความวัสดุนี้" style="display:none;">✕</button>
        </div>
        <!-- ตัวกรองสถานะ SAP (ย้ายจากหัวตาราง มาไว้ที่แถบตัวกรองด้านบน) -->
        <div class="mat-sf-group mat-sf-sap-wrap" onclick="event.stopPropagation()">
          <span class="mat-sf-label">สถานะ SAP</span>
          <button type="button" class="mat-sf-sap-btn" id="matSfSapBtn" onclick="window.toggleMatSapDropdown(event, this)">
            <span id="matSfSapBtnText">ทั้งหมด</span> <span style="font-size:0.65rem;">▼</span>
          </button>
          <div class="wbs-sap-dropdown-panel mat-sf-sap-panel" id="matSapThDropdownPanel" style="display:none;" onclick="event.stopPropagation()">
            <div class="sap-dropdown-panel-header">
              <div class="sap-dropdown-panel-title"><span>ตัวกรองสถานะ SAP (ไฟล์ 04)</span></div>
            </div>
            <div class="sap-dropdown-list" id="matSapThDropdownList"></div>
            <div class="sap-dropdown-footer" onclick="window.clearMatSapFilter(event)" style="cursor:pointer;" title="คลิกเพื่อแสดงทั้งหมด">
              <span class="sap-dropdown-summary" id="matSapDropdownSummaryText">แสดงทั้งหมด</span>
            </div>
          </div>
        </div>
        <button type="button" class="mat-sf-reset" onclick="window.resetMatSubFilters()" title="คลิกเพื่อล้างตัวกรองรายการที่พบพัสดุทั้งหมด">
          <span class="mat-sf-reset-icon">🔄</span> ล้างตัวกรอง
        </button>
        <span class="mat-sf-count" id="matSubFilterCount"></span>
        <!-- สรุปจำนวนงาน WBS และสถานะพัสดุ (ซ่อนเริ่มต้น และมีปุ่มลูกศรสีเหลืองกดเพื่อแสดง/ซ่อน) -->
        <div class="mat-sf-wbs-stats-wrapper" id="matToolbarWbsStatsWrapper">
          <div class="mat-sf-wbs-stats mat-sf-wbs-stats-3rows is-collapsed" id="matToolbarWbsStats"></div>
          <button type="button" class="btn-mat-stats-toggle" id="btnMatStatsToggle" onclick="window.toggleMatToolbarWbsStats()" title="คลิกเพื่อแสดงสรุปงาน WBS (รวม / พบพัสดุ / ไม่พบพัสดุ)">
            <svg class="mat-toggle-arrow-svg" width="16" height="16" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFB81C" stroke-width="1.5">
              <polygon points="18,4 6,12 18,20"></polygon>
            </svg>
          </button>
        </div>
      </div>

      <!-- แถวการ์ดคู่: การ์ดกราฟค้างเบิก (ซ้าย) + การ์ดสรุปคลังพัสดุ 6 คลัง (ขวาสุด) -->
      <div class="mat-charts-split-row" id="matChartsSplitRow">
      <div class="mat-hchart-card" id="matHChartCard">
        <div class="mat-hchart-head">
          <div class="mat-hchart-top-row">
            <div class="mat-hchart-title">
              <span class="mat-hchart-ico">📊</span>
              <span>ปริมาณค้างเบิก > 0 แยกตามรายการพัสดุ</span>
              <span class="mat-hchart-sub" id="matHChartSub"></span>
            </div>
          </div>
          <div class="mat-hchart-legend" id="matHChartLegendContainer">
            <div class="mat-budget-pill-group" role="group" aria-label="เลือกแสดงตามงบ">
              <button type="button" class="mat-budget-pill pill-red in-both" onclick="window.setMatChartBudgetFilter('IP')" title="คลิกเพื่อเลือกแสดงเฉพาะ งบ I, P (สีแดงเข้ม)"><i class="lg-dot lg-red"></i> ค้างเบิก งบ I, P (สีแดงเข้ม)</button>
              <button type="button" class="mat-budget-pill pill-orange in-both" onclick="window.setMatChartBudgetFilter('C')" title="คลิกเพื่อเลือกแสดงเฉพาะ งบ C (สีส้มอ่อน)"><i class="lg-dot lg-orange"></i> ค้างเบิก งบ C (สีส้มอ่อน)</button>
            </div>
            <span class="mat-hchart-lg" title="ไฟล์ 08 คลัง SLoc 0022 ปริมาณคงเหลือคงคลังงบ I,P (สีกราฟเขียวเข้ม)"><i class="lg-dot" style="background:#15803D; box-shadow:0 0 6px rgba(21,128,61,0.8);"></i> <span style="color:#86EFAC;">คงเหลือ SLoc 0022 งบ I,P (เขียวเข้ม)</span></span>
            <span class="mat-hchart-lg" title="ไฟล์ 08 คลัง SLoc 0021 ปริมาณคงเหลือคงคลังงบ C (สีกราฟเขียวอ่อน)"><i class="lg-dot" style="background:#4ADE80; box-shadow:0 0 6px rgba(74,222,128,0.8);"></i> <span style="color:#BBF7D0;">คงเหลือ SLoc 0021 งบ C (เขียวอ่อน)</span></span>
          </div>
        </div>
          <div class="mat-hchart-scroll" id="matHChartScroll">
            <div class="mat-hchart-body" id="matHChartBody"></div>
          </div>
      </div>

      <!-- 2. การ์ดสรุปคลังพัสดุ (แยกการ์ดออกมา ไว้ด้านขวาสุด) -->
      <div class="mat-wh-standalone-card" id="matWhStandaloneCard">
        <div class="mat-wh-card-head">
          <div class="mat-wh-card-title">
            <span class="mat-wh-card-ico">🏢</span>
            <span>รายละเอียดแต่ละคลังพัสดุ</span>
            <span class="mat-wh-card-badge">6 คลัง</span>
          </div>
          <div class="mat-wh-card-actions"></div>
        </div>
        <div id="matWhWidgetCol"></div>
      </div>
        </div>
      </div>

      <div class="mat-kpi-summary-grid" id="matKpiSummaryGrid" style="display:none !important; grid-template-columns:repeat(auto-fit, minmax(225px, 1fr)); gap:0.75rem; margin-bottom:0.85rem;">
        <div class="content-card" style="padding:0.85rem 1.05rem; margin-bottom:0; border-left:3px solid #38BDF8;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem; gap:0.35rem; flex-wrap:wrap;">
            <span style="font-size:0.78rem; color:var(--text-muted); font-weight:600;">📦 รายการพัสดุ Mvt 281 (เชื่อม WBS ไฟล์ 03)</span>
            <span class="wbs-pill pill-file" style="font-size:0.68rem; padding:1px 7px; background:rgba(14,165,233,0.18); color:#7DD3FC; border:1px solid rgba(56,189,248,0.35);">07 CN52N: ${date07Short}</span>
          </div>
          <div style="display:flex; align-items:baseline; gap:0.45rem; flex-wrap:wrap;">
            <strong id="matSummaryTotalRows" style="font-size:1.45rem; color:#38BDF8; font-weight:800; line-height:1.15;">0</strong>
            <span style="font-size:0.82rem; color:var(--text-main);">รายการ</span>
            <span id="matSummaryWbsSub" style="font-size:0.76rem; color:var(--pea-gold-400); margin-left:auto;">(0 งาน WBS • 0 กฟฟ.)</span>
          </div>
        </div>

        <div class="content-card" style="padding:0.85rem 1.05rem; margin-bottom:0; border-left:3px solid #F59E0B;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
            <span style="font-size:0.78rem; color:var(--text-muted); font-weight:600;">⚠️ รายการค้างเบิก (ต้องการ ≠ เบิกจ่าย)</span>
            <span style="font-size:0.68rem; color:#FCD34D;">ผลต่างต้องการ≠เบิก</span>
          </div>
          <div style="display:flex; align-items:baseline; gap:0.45rem; flex-wrap:wrap;">
            <strong id="matSummaryDiffRows" style="font-size:1.45rem; color:#FBBF24; font-weight:800; line-height:1.15;">0</strong>
            <span style="font-size:0.82rem; color:var(--text-main);">รายการ</span>
            <span id="matSummaryDoneSub" style="font-size:0.76rem; color:#6EE7B7; margin-left:auto;">เบิกครบ: 0 รายการ</span>
          </div>
        </div>

        <div class="content-card" style="padding:0.85rem 1.05rem; margin-bottom:0; border-left:3px solid #10B981;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
            <span style="font-size:0.78rem; color:var(--text-muted); font-weight:600;">📊 ปริมาณต้องการ / เบิกจ่าย / ค้างเบิก</span>
            <span style="font-size:0.68rem; color:#A7F3D0;">รวมทุกหน่วย (UnE)</span>
          </div>
          <div style="display:flex; align-items:baseline; justify-content:space-between; gap:0.4rem; flex-wrap:wrap; font-size:0.78rem;">
            <span>ต้องการ: <strong id="matSummaryReqQty" style="color:#E2E8F0;">0</strong></span>
            <span>เบิก: <strong id="matSummaryWdrQty" style="color:#34D399;">0</strong></span>
            <span>ค้างเบิก: <strong id="matSummaryRemQty" style="color:#FBBF24; font-size:0.95rem;">0</strong></span>
          </div>
        </div>

        <div class="content-card" style="padding:0.85rem 1.05rem; margin-bottom:0; border-left:3px solid #A855F7;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
            <span style="font-size:0.78rem; color:var(--text-muted); font-weight:600;">💰 รวมราคา/สกุลเงินในปท. (ไฟล์ 07)</span>
            <span style="font-size:0.68rem; color:#D8B4FE;">SAP 04: 12 พ.ย. 69</span>
          </div>
          <div style="display:flex; align-items:baseline; gap:0.45rem; flex-wrap:wrap;">
            <strong id="matSummaryTotalPrice" style="font-size:1.32rem; color:var(--pea-gold-400); font-weight:800; line-height:1.15;">0.00</strong>
            <span style="font-size:0.78rem; color:var(--text-muted);">บาท</span>
            <span id="matSummaryTotalPriceMb" style="font-size:0.75rem; color:#C084FC; margin-left:auto;">(0.00 ลบ.)</span>
          </div>
        </div>
      </div>

      <!-- MASTER MATERIALS DATA TABLE CARD (รูปแบบตามรูป 8+ พร้อมเมนูเลือกคอลัมน์ 03 / 04 / 07) -->
      <div class="table-card" id="matTableCard" style="position:relative;">
        <div class="wbs-table-top-meta-bar table-header-bar" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.65rem; padding:0.55rem 0.95rem; border-bottom:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02); border-radius:var(--radius-md, 10px) var(--radius-md, 10px) 0 0;">
          <!-- ฝั่งซ้าย: ประเภทเกณฑ์วัด & ปุ่มเลือก มี/ไม่มีพัสดุ & ค้นหาด่วนในตารางพัสดุ -->
          <div style="display:flex; align-items:center; gap:0.65rem; flex-wrap:wrap;">
            <span class="mat-table-title-text" style="color:#FFFFFF; font-weight:700; font-size:1.0rem; letter-spacing:0.01em; white-space:nowrap; margin-right:0.35rem;">ปริมาณค้างเบิก รายการพัสดุตามประมาณการ</span>
            <div class="wbs-table-active-criteria" id="matTableActiveCriteria" title="ประเภทเกณฑ์วัดที่กำลังแสดงผล (อ้างอิงจากไฟล์ 03 WBS)">
              <span class="criteria-tag-icon">📌</span>
              <span class="criteria-tag-label">เกณฑ์วัด:</span>
              <strong class="criteria-tag-val" id="matTableActiveCriteriaVal">เลือกทั้งหมด</strong>
              <button type="button" class="btn-clear-chart-sel" id="matClearChartSelBtn" onclick="window.clearMatChartSelection()" title="คลิกเพื่อยกเลิกการกรองตามกราฟ" style="display:none;">✕ ล้างตัวเลือกกราฟ</button>
            </div>
          </div>

          <!-- ฝั่งขวา: แถบเครื่องมือ (ส่งออก CSV, เลือกคอลัมน์ 03/04/07, แถวต่อหน้า, ล้างตัวเลือก, ขยายเต็มจอ) -->
          <div class="wbs-table-toolbar-actions" style="display:flex; align-items:center; gap:0.55rem; flex-wrap:wrap; justify-content:flex-end;">
            <!-- ปุ่มส่งออก CSV -->
            <button type="button" class="btn btn-gold btn-sm" id="btnExportMatCsv" onclick="window.exportMaterialsToCsv()"
              title="ส่งออกรายการพัสดุที่กรองอยู่เป็นไฟล์ CSV สำหรับเปิดใน Excel"
              style="padding:0.35rem 0.65rem; font-size:0.8rem; display:inline-flex; align-items:center; gap:5px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>ส่งออกพัสดุ (CSV)</span>
            </button>

            <!-- ปุ่มเลือกคอลัมน์ (จากไฟล์ 03 / 04 / 07) ตามรูป 8+ -->
            <div class="wbs-col-dropdown-wrap" id="matColDropdownWrap">
              <button type="button" class="btn-wbs-col-toggle" id="btnMatColToggle"
                onclick="window.toggleMatColDropdown(event)" title="เลือกคอลัมน์ที่ต้องการแสดงจากไฟล์ 03 / 04 / 07">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18" />
                </svg>
                <span>เลือกคอลัมน์</span>
                <span class="wbs-col-count-badge" id="matColCountBadge">15/${MAT_COL_DEFS.length}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6 9 12 15 18 9" />
                </svg>
              </button>

              <!-- Popover Dropdown Panel (เหมือนรูป 8+ ทุกประการ) -->
              <div class="wbs-col-dropdown-panel" id="matColDropdownPanel" style="display:none;" onclick="event.stopPropagation()">
                <div class="col-panel-header">
                  <div class="col-panel-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="9" y1="3" x2="9" y2="21" />
                    </svg>
                    <span>เลือกคอลัมน์ที่ต้องการแสดง</span>
                  </div>
                  <div class="col-panel-links">
                    <button type="button" class="btn-col-link btn-col-link-default"
                      onclick="window.setMatColsDefaultPreset()"
                      title="คืนค่าคอลัมน์และลำดับเริ่มต้น">Default</button>
                    <span class="col-link-divider">•</span>
                    <button type="button" class="btn-col-link"
                      onclick="window.setAllMatCols(true)">เปิดทั้งหมด</button>
                  </div>
                </div>

                <!-- Column View Mode Bar -->
                <div class="col-view-mode-bar">
                  <button type="button" class="btn-col-mode active" id="btnMatModeOrder"
                    onclick="window.setMatColViewMode('order')"
                    title="แสดงคอลัมน์เรียงตามลำดับจริงในตาราง สามารถลากหรือกดเลื่อนได้">↕️ ลำดับการแสดง (1-${MAT_COL_DEFS.length})</button>
                  <button type="button" class="btn-col-mode" id="btnMatModeGroup"
                    onclick="window.setMatColViewMode('group')"
                    title="จัดกลุ่มคอลัมน์ตามไฟล์ต้นทาง (ไฟล์ 03 / 04 / 07)">📁 แยกตามกลุ่มไฟล์</button>
                </div>

                <!-- Real-time Column Search Input -->
                <div class="col-search-box">
                  <span class="col-search-icon">🔍</span>
                  <input type="text" class="col-search-input" id="matColSearchInput"
                    placeholder="ค้นหาชื่อคอลัมน์ (03 / 04 / 07)..." oninput="window.filterMatColCheckboxes(this.value)">
                </div>

                <div class="col-panel-list" id="matColCheckboxList"></div>
              </div>
            </div>

            <!-- แถวต่อหน้า -->
            <div style="display:flex; align-items:center; gap:0.4rem;">
              <label style="font-size:0.8rem; color:var(--text-muted); white-space:nowrap;">แถวต่อหน้า:</label>
              <select class="form-select" id="matPageSizeSelect" onchange="window.setMatPageSize(this.value)"
                style="width:82px; padding:0.30rem 0.5rem; font-size:0.8rem;">
                <option value="15">15</option>
                <option value="25" selected>25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="250">250</option>
                <option value="500">500</option>
              </select>
            </div>

            <!-- ปุ่มขยายเต็มจอ -->
            <button type="button" class="btn-wbs-fullscreen" id="btnMatTableFullscreen"
              onclick="window.toggleTableFullscreen(this)" title="ขยายตารางเต็มหน้าจอ">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
              </svg>
              <span>ขยายเต็มจอ</span>
            </button>

            <button type="button" class="btn btn-sm btn-return-normal-top" id="btnMatReturnNormalScreen"
              onclick="if(window.returnToNormalScreen)window.returnToNormalScreen();else window.toggleTableFullscreen(this);" title="กดเพื่อคืนหน้าจอปกติ (ออกจากหน้าจอขยายเต็มจอ)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6l7 7M4 10h6m0 0V4m0 6L3 3m17 7h-6m0 0V4m0 6l7-7"></path>
              </svg>
              <span>คืนหน้าจอปกติ</span>
            </button>
          </div>
        </div>

        <!-- Table Container -->
        <div class="wbs-table-scroll-wrapper" id="matTableScrollWrapper">
          <div class="table-responsive" id="matTableResponsive" style="max-height: 68vh; overflow: auto;">
            <table class="data-table" id="matDataTable">
              <thead id="matTableHead"></thead>
              <tbody id="matTableBody"></tbody>
            </table>
          </div>
        </div>

        <!-- Pagination Footer -->
        <div class="table-pagination-bar" id="matPaginationBar"
          style="padding: 0.85rem 1.25rem; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-subtle); flex-wrap: wrap; gap: 0.75rem;">
          <div style="font-size: 0.85rem; color: var(--text-dim);" id="matPaginationInfoText">
            หน้า 1 จาก 1
          </div>
          <div class="pagination-controls" id="matPaginationControls"
            style="display: flex; gap: 0.35rem; align-items: center;"></div>
        </div>
      </div>
    `;

    matState.domBuilt = true;
    return true;
  }

  /**
   * Render Column Picker List (Order mode & Grouped by File 03 / 04 / 07 mode)
   */
  function renderMatColDropdownList(searchQuery) {
    const listEl = document.getElementById('matColCheckboxList');
    const badgeEl = document.getElementById('matColCountBadge');
    const orderedDefs = getOrderedMatColDefs();

    let totalActive = 0;
    orderedDefs.forEach(c => { if (matState.visibleColumns[c.id]) totalActive++; });
    if (badgeEl) badgeEl.textContent = `${totalActive}/${MAT_COL_DEFS.length}`;
    if (!listEl) return;

    const q = (searchQuery !== undefined ? searchQuery : (matState.colSearchQuery || '')).trim().toLowerCase();
    const getGroupMeta = (grpId) => MAT_COL_GROUPS.find(g => g.id === grpId) || MAT_COL_GROUPS[2];
    const isCustomCol = (c) => (
      c.source === 'custom' ||
      c.id === 'statusSap' ||
      c.id === 'pctMatWithdraw' ||
      c.id === 'pctExpenseWithdraw' ||
      c.id === 'remainQty' ||
      c.id === 'warehouse'
    );

    const matchCol = (c) => {
      if (!q) return true;
      const isCustom = isCustomCol(c);
      const gm = isCustom
        ? { tagText: 'CUSTOM', tagClass: 'col-tag-custom', label: 'CUSTOM' }
        : getGroupMeta(c.group);
      return c.label.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        gm.tagText.toLowerCase().includes(q) ||
        gm.label.toLowerCase().includes(q);
    };

    const renderItemHtml = (col) => {
      const isChecked = !!matState.visibleColumns[col.id];
      const isCustom = isCustomCol(col);
      const gm = isCustom
        ? { tagText: 'CUSTOM', tagClass: 'col-tag-custom' }
        : getGroupMeta(col.group);
      const realIdx = orderedDefs.findIndex(x => x.id === col.id);
      const isFirst = realIdx === 0;
      const isLast = realIdx === orderedDefs.length - 1;

      return `
        <div class="col-check-item"
             draggable="true"
             ondragstart="window.handleMatColDragStart(event, '${col.id}')"
             ondragover="window.handleMatColDragOver(event, '${col.id}')"
             ondragleave="window.handleMatColDragLeave(event)"
             ondrop="window.handleMatColDrop(event, '${col.id}')"
             ondragend="window.handleMatColDragEnd(event)"
             title="${escapeHtml(col.label)} (${gm.tagText}) - ลากหรือกดปุ่มเพื่อเลื่อนลำดับ">
          <div class="col-check-item-left">
            <span class="th-drag-handle" style="font-size:0.75rem;" title="คลิกค้างแล้วลากเพื่อสลับตำแหน่ง">⠿</span>
            <span class="col-order-num-badge">${realIdx + 1}</span>
            <input type="checkbox" data-col-id="${col.id}" ${isChecked ? 'checked' : ''}
              onchange="window.toggleSingleMatCol('${col.id}', this.checked)">
            <span style="${isChecked ? 'color:var(--text-main); font-weight:600;' : 'color:var(--text-dim);'}">
              ${escapeHtml(col.label)}
            </span>
          </div>
          <div class="col-check-item-right">
            <span class="col-source-tag ${gm.tagClass}">${gm.tagText}</span>
            <div class="col-reorder-btns" onclick="event.stopPropagation();">
              <button type="button" class="btn-col-shift-item" title="เลื่อนขึ้น (ไปทางซ้าย)" onclick="window.moveMatColumnOrder('${col.id}', -1, event)" ${isFirst ? 'disabled' : ''}>▲</button>
              <button type="button" class="btn-col-shift-item" title="เลื่อนลง (ไปทางขวา)" onclick="window.moveMatColumnOrder('${col.id}', 1, event)" ${isLast ? 'disabled' : ''}>▼</button>
            </div>
          </div>
        </div>
      `;
    };

    let html = '';
    if (matState.colViewMode === 'order') {
      const filteredCols = orderedDefs.filter(matchCol);
      html += `
        <div style="padding:0.25rem 0.5rem; font-size:0.75rem; color:var(--text-dim); display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.08); margin-bottom:0.35rem;">
          <span>ลำดับคอลัมน์ในตาราง (ซ้าย ➔ ขวา)</span>
          <span style="font-size:0.7rem; color:var(--sweet-pink, #FF79B8);">ลาก ⠿ หรือกด ▲ ▼ เพื่อเลื่อน</span>
        </div>
      `;
      filteredCols.forEach(c => { html += renderItemHtml(c); });
    } else {
      MAT_COL_GROUPS.forEach(grp => {
        const groupCols = orderedDefs.filter(c => c.group === grp.id);
        const filteredCols = groupCols.filter(matchCol);
        if (!filteredCols.length) return;

        const activeInGrp = groupCols.filter(c => matState.visibleColumns[c.id]).length;
        const allChecked = activeInGrp === groupCols.length;

        html += `
          <div class="col-group-header">
            <span>${grp.icon} ${grp.label} <span style="font-size:0.7rem; opacity:0.85; font-weight:normal;">(${activeInGrp}/${groupCols.length})</span></span>
            <button type="button" class="btn-group-toggle" onclick="window.toggleMatColGroup('${grp.id}', ${!allChecked})">
              ${allChecked ? 'ซ่อนกลุ่มนี้' : 'เลือกทั้งกลุ่ม'}
            </button>
          </div>
        `;
        filteredCols.forEach(c => { html += renderItemHtml(c); });
      });
    }

    listEl.innerHTML = html || '<div style="text-align:center; padding:1.5rem; color:var(--text-dim); font-size:0.8rem;">ไม่พบคอลัมน์ที่ตรงกับคำค้นหา</div>';
  }

  /**
   * Render SAP Status Multi-select Dropdown for Materials Table
   * อัปเดตรายการสถานะ SAP และจำนวนงาน WBS ตามโหมดที่เลือกในวงเหลือง (HAS_MAT / ALL / NO_MAT)
   */
  function renderMatSapThDropdownList() {
    const listEl = document.getElementById('matSapThDropdownList');
    const summaryEl = document.getElementById('matSapDropdownSummaryText');
    if (!listEl) return;

    const baseRows = getFilteredMaterialRows(true);
    const wbsBySap = new Map();
    const allSapWbs = new Set();
    for (let i = 0; i < baseRows.length; i++) {
      const r = baseRows[i];
      const st = r.sapShort || '(ไม่ระบุ)';
      if (!wbsBySap.has(st)) wbsBySap.set(st, new Set());
      if (r.wbs) {
        wbsBySap.get(st).add(r.wbs);
        allSapWbs.add(r.wbs);
      }
    }

    const keys = Array.from(wbsBySap.keys()).sort((a, b) => {
      if (a === '(ไม่ระบุ)' || a === 'ไม่ระบุ') return 1;
      if (b === '(ไม่ระบุ)' || b === 'ไม่ระบุ') return -1;
      const grp = (s) => {
        const up = String(s || '').toUpperCase().trim();
        if (up.startsWith('CLSD')) return 0;
        if (up.startsWith('TECO')) return 1;
        if (up.startsWith('REL')) return 2;
        return 3;
      };
      const ga = grp(a), gb = grp(b);
      if (ga !== gb) return ga - gb;
      const so = (s) => {
        const m = String(s || '').toUpperCase().match(/([A-Z])\s*(\d+)\s*$/);
        return m ? { l: m[1], n: parseInt(m[2], 10) } : { l: '', n: -1 };
      };
      const x = so(a), y = so(b);
      if (x.l !== y.l) return x.l < y.l ? 1 : -1;
      if (x.n !== y.n) return y.n - x.n;
      return a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' });
    });
    const hasFilter = matState.sapStatuses.size > 0;
    const isAllSelected = !hasFilter;

    let html = `
      <div class="sap-dropdown-actions-row" style="padding:0.25rem 0.35rem 0.35rem; border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:0.35rem;">
        <label class="sap-dropdown-item sap-dropdown-item-all ${isAllSelected ? 'is-selected' : ''}"
               onclick="window.clearMatSapFilter(event)"
               style="display:flex; align-items:center; justify-content:space-between; padding:0.35rem 0.55rem; cursor:pointer; border-radius:6px; gap:0.5rem; background:${isAllSelected ? 'rgba(255,184,28,0.18)' : 'rgba(255,255,255,0.04)'}; border:1px solid ${isAllSelected ? 'rgba(255,184,28,0.45)' : 'transparent'};">
          <span style="display:inline-flex; align-items:center; gap:0.5rem;">
            <input type="checkbox" ${isAllSelected ? 'checked' : ''} onclick="event.stopPropagation(); window.clearMatSapFilter(event);" style="cursor:pointer; accent-color:#FFB81C;">
            <span style="font-weight:700; color:${isAllSelected ? '#FFE58F' : 'var(--text-main)'}; font-size:0.82rem;">แสดงทั้งหมด (${keys.length} สถานะ)</span>
          </span>
          <span style="font-size:0.74rem; color:#FDE68A; font-weight:600;">${allSapWbs.size.toLocaleString('th-TH')} งาน</span>
        </label>
      </div>
    `;
    keys.forEach(st => {
      const isSelectedExplicit = matState.sapStatuses.has(st);
      const jobCnt = wbsBySap.get(st) ? wbsBySap.get(st).size : 0;
      html += `
        <label class="sap-dropdown-item ${isSelectedExplicit ? 'is-selected' : ''}" style="display:flex; align-items:center; justify-content:space-between; padding:0.32rem 0.55rem; cursor:pointer; border-radius:6px; gap:0.5rem;">
          <span style="display:inline-flex; align-items:center; gap:0.5rem;">
            <input type="checkbox" ${isSelectedExplicit ? 'checked' : ''} onchange="window.toggleMatSapStatusItem('${escapeHtml(st)}', this.checked)" style="cursor:pointer;">
            <span class="badge-sap ${getSapBadgeClass(st)}" style="font-size:0.72rem; padding:1px 7px;">${escapeHtml(st)}</span>
          </span>
          <span style="font-size:0.74rem; color:var(--text-muted); font-weight:600;">${jobCnt.toLocaleString('th-TH')} งาน</span>
        </label>
      `;
    });

    listEl.innerHTML = html;
    if (summaryEl) {
      if (hasFilter) {
        summaryEl.innerHTML = `<button type="button" class="btn-col-link" onclick="window.clearMatSapFilter(event)" style="cursor:pointer; color:#FBBF24; font-weight:700;">🔄 แสดงทั้งหมด (${keys.length} สถานะ)</button>`;
      } else {
        summaryEl.innerHTML = `<span style="color:var(--pea-gold-400); font-weight:700;">✔ แสดงทั้งหมด (${keys.length} สถานะ • ${allSapWbs.size.toLocaleString('th-TH')} งาน)</span>`;
      }
    }
  }

  /**
   * Compute aggregates across filtered rows in a single O(N) pass
   */
  function computeAggregates(rows) {
    const wbsSet = new Set();
    const offSet = new Set();
    const whSet = new Set();
    const matSet = new Set();
    let diffCount = 0;
    let doneCount = 0;
    let sumReq = 0;
    let sumWdr = 0;
    let sumRem = 0;
    let sumPrice = 0;
    let sumPctMat = 0;
    let cntPctMat = 0;
    const seenWbsForPct = new Set();
    let noMatWbs = 0;
    const withMatSet = new Set();
    let realRows = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      wbsSet.add(r.wbs);
      if (r.m && r.m.office) offSet.add(r.m.office);
      if (r.warehouse && r.warehouse !== '-') whSet.add(r.warehouse);
      if (r.noMat) noMatWbs++; else { realRows++; withMatSet.add(r.wbs); }
      if (r.matCode) matSet.add(r.matCode);

      if (!r.noMat) {
        if (Math.abs(r.remainQty) >= 0.0005) diffCount++;
        else doneCount++;
      }

      sumReq += r.reqQty;
      sumWdr += r.wdrQty;
      sumRem += r.remainQty;
      sumPrice += r.priceLocal;

      if (!seenWbsForPct.has(r.wbs) && r.m && r.m.pctMatWithdraw !== undefined && r.m.pctMatWithdraw !== null) {
        seenWbsForPct.add(r.wbs);
        const rawP = Number(r.m.pctMatWithdraw);
        if (!isNaN(rawP)) {
          sumPctMat += (Math.abs(rawP) <= 1.0 && rawP !== 0) ? (rawP * 100) : rawP;
          cntPctMat++;
        }
      }
    }

    return {
      totalRows: realRows,
      noMatWbs,
      withMatWbs: withMatSet.size,
      uniqueWbs: wbsSet.size,
      uniqueOffices: offSet.size,
      uniqueWarehouses: whSet.size,
      uniqueMaterials: matSet.size,
      diffCount,
      doneCount,
      sumReq,
      sumWdr,
      sumRem,
      sumPrice,
      avgPctMat: cntPctMat > 0 ? (sumPctMat / cntPctMat) : 0
    };
  }

  /**
   * Update Top Navbar Badge (#materialsTabTotalBadge) even when user is on another tab
   */
  function updateMaterialsNavBadge() {
    const badge = document.getElementById('materialsTabTotalBadge');
    if (!badge) return;
    if (!ensureMaterialsHydrated()) return;
    const rows = getFilteredMaterialRows(false, true);
    badge.textContent = rows.filter(r => !r.noMat).length.toLocaleString('th-TH');
  }

  /**
   * Main Render Function for #tab-materials
   */
  function renderMaterialsTab() {
    updateMaterialsNavBadge();

    const pane = document.getElementById('tab-materials');
    if (!pane || !pane.classList.contains('active')) {
      return;
    }

    if (!ensureMaterialsHydrated()) {
      pane.innerHTML = '<div class="content-card" style="padding:2rem; text-align:center; color:var(--text-muted);">กำลังโหลดฐานข้อมูลรายการพัสดุค้างเบิก (ไฟล์ 07 CN52N)...</div>';
      return;
    }

    ensureMaterialsDomBuilt();
    refreshMatSubFilterOptions();
    renderMatRemainChart();

    const rows = getFilteredMaterialRows(false);
    const agg = computeAggregates(rows);
    const gf = getGlobalFilters();

    // 1. Update Summary KPI Cards
    const elTotal = document.getElementById('matSummaryTotalRows');
    const elWbsSub = document.getElementById('matSummaryWbsSub');
    const elDiff = document.getElementById('matSummaryDiffRows');
    const elDone = document.getElementById('matSummaryDoneSub');
    const elReq = document.getElementById('matSummaryReqQty');
    const elWdr = document.getElementById('matSummaryWdrQty');
    const elRem = document.getElementById('matSummaryRemQty');
    const elPrice = document.getElementById('matSummaryTotalPrice');
    const elPriceMb = document.getElementById('matSummaryTotalPriceMb');

    if (elTotal) elTotal.textContent = agg.totalRows.toLocaleString('th-TH');
    if (elWbsSub) {
      const total03Num = matState.scopeStats ? matState.scopeStats.total03Rows : matState.totalBase03Wbs;
      const rowsExtra = (total03Num && total03Num > agg.uniqueWbs) ? ` / ${total03Num.toLocaleString('th-TH')} งาน` : '';
      elWbsSub.textContent = `(${agg.uniqueWbs.toLocaleString('th-TH')} งาน${rowsExtra} • ${agg.uniqueOffices.toLocaleString('th-TH')} กฟฟ.${agg.noMatWbs ? ' • ไม่พบพัสดุ ' + agg.noMatWbs.toLocaleString('th-TH') + ' งาน' : ''})`;
    }
    if (elDiff) elDiff.textContent = agg.diffCount.toLocaleString('th-TH');
    if (elDone) elDone.textContent = `เบิกครบ: ${agg.doneCount.toLocaleString('th-TH')} รายการ`;
    if (elReq) elReq.textContent = formatQty(agg.sumReq);
    if (elWdr) elWdr.textContent = formatQty(agg.sumWdr);
    if (elRem) elRem.textContent = formatQty(agg.sumRem);
    if (elPrice) elPrice.textContent = formatMoney(agg.sumPrice);
    if (elPriceMb) elPriceMb.textContent = `(${(agg.sumPrice / 1e6).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ลบ.)`;

    // 2. Update Active Criteria Pill & Quick Filter States
    const critValEl = document.getElementById('matTableActiveCriteriaVal');
    const clearChartBtn = document.getElementById('matClearChartSelBtn');
    if (critValEl) {
      const critLabel = (!gf.crit || gf.crit === 'ALL') ? 'เลือกทั้งหมด' : gf.crit;
      const totalWbsNum = matState.scopeStats ? matState.scopeStats.uniqueWbs : agg.uniqueWbs;
      const total03Num = matState.scopeStats ? matState.scopeStats.total03Rows : matState.totalBase03Wbs;
      const rowsExtra = (total03Num && total03Num > totalWbsNum) ? ` / ${total03Num.toLocaleString('th-TH')} งาน` : '';

      const activeBudgetTag = (matState.chartSelBudget && matState.chartSelBudget !== 'ALL')
        ? matState.chartSelBudget
        : (matState.chartBudgetFilter || 'ALL');
      const budgetLabel = activeBudgetTag === 'IP'
        ? ' • <span style="color:#FCA5A5;">🔴 เฉพาะ งบ I, P</span>'
        : (activeBudgetTag === 'C' ? ' • <span style="color:#FED7AA;">🟠 เฉพาะ งบ C</span>' : '');
      const critLocked = !!getCriteriaBudgetLock(gf.crit);

      if (matState.chartSelDesc) {
        critValEl.innerHTML = `${critLabel} • <span style="color:#FDE047;">🔍 พัสดุ: ${escapeHtml(matState.chartSelDesc)}</span>${budgetLabel} (${agg.uniqueWbs.toLocaleString('th-TH')} งาน • ${agg.totalRows.toLocaleString('th-TH')} รายการ)`;
      } else if (activeBudgetTag !== 'ALL' && !critLocked) {
        critValEl.innerHTML = `${critLabel}${budgetLabel} (${agg.uniqueWbs.toLocaleString('th-TH')} งาน${rowsExtra} • ${agg.totalRows.toLocaleString('th-TH')} รายการพัสดุ)`;
      } else {
        critValEl.textContent = `${critLabel} (${totalWbsNum.toLocaleString('th-TH')} งาน${rowsExtra} • ${agg.totalRows.toLocaleString('th-TH')} รายการพัสดุ)`;
      }

      if (clearChartBtn) {
        if (matState.chartSelDesc) {
          const shortName = matState.chartSelDesc.length > 22 ? matState.chartSelDesc.substring(0, 22) + '...' : matState.chartSelDesc;
          clearChartBtn.innerHTML = `✕ ล้างตัวกรองกราฟ (${escapeHtml(shortName)})`;
          clearChartBtn.style.display = 'inline-flex';
        } else if (activeBudgetTag !== 'ALL' && !critLocked) {
          const bShort = activeBudgetTag === 'IP' ? 'งบ I, P' : 'งบ C';
          clearChartBtn.innerHTML = `✕ ล้างตัวกรองงบ (${bShort})`;
          clearChartBtn.style.display = 'inline-flex';
        } else {
          clearChartBtn.style.display = 'none';
        }
      }
    }

    // 2.1 Update WBS Summary Stats Pills in Table Toolbar (แสดงด้านหลังปุ่มล้างตัวกรอง เป็น 3 บรรทัด แคบๆ พอดี)
    const tbStatsEl = document.getElementById('matToolbarWbsStats');
    if (tbStatsEl) {
      const sc = matState.scopeStats || {
        uniqueWbs: agg.uniqueWbs,
        withMatWbs: agg.withMatWbs,
        noMatWbs: agg.noMatWbs,
        total03Rows: matState.totalBase03Wbs || agg.uniqueWbs
      };
      const curMode = matState.hasMatFilter;
      const total03 = sc.total03Rows || sc.uniqueWbs;
      const dupWbs = Math.max(0, total03 - sc.uniqueWbs);
      tbStatsEl.innerHTML = `
        <button type="button" class="mat-scope-btn btn-scope-all ${curMode === 'ALL' ? 'active' : ''}"
          onclick="window.setMatHasMatFilter('ALL')" title="คลิกเพื่อแสดงทุกงาน: รวม ${sc.uniqueWbs.toLocaleString('th-TH')} งาน (${total03.toLocaleString('th-TH')} งาน) (ซ้ำเกณฑ์วัด ${dupWbs.toLocaleString('th-TH')} งาน)">
          <span class="scope-btn-label"><span class="scope-btn-icon">📁</span> รวม</span>
          <span class="scope-btn-val"><strong>${sc.uniqueWbs.toLocaleString('th-TH')}</strong> งาน <span class="scope-btn-extra">(${total03.toLocaleString('th-TH')} งาน)</span><span class="scope-btn-dup">(ซ้ำเกณฑ์วัด ${dupWbs.toLocaleString('th-TH')} งาน)</span></span>
          ${curMode === 'ALL' ? '<span class="scope-btn-check">✓</span>' : ''}
        </button>
        <button type="button" class="mat-scope-btn btn-scope-hasmat ${curMode === 'HAS_MAT' ? 'active' : ''}"
          onclick="window.setMatHasMatFilter('HAS_MAT')" title="คลิกเพื่อแสดงเฉพาะงานที่พบพัสดุ (อยู่ระหว่างก่อสร้าง)">
          <span class="scope-btn-label"><span class="scope-btn-icon">✓</span> พบพัสดุ (อยู่ระหว่างก่อสร้าง)</span>
          <span class="scope-btn-val"><strong>${sc.withMatWbs.toLocaleString('th-TH')}</strong> งาน</span>
          ${curMode === 'HAS_MAT' ? '<span class="scope-btn-check">✓</span>' : ''}
        </button>
        <button type="button" class="mat-scope-btn btn-scope-nomat ${curMode === 'NO_MAT' ? 'active' : ''}"
          onclick="window.setMatHasMatFilter('NO_MAT')" title="คลิกเพื่อแสดงเฉพาะงานที่ไม่พบพัสดุ (ปิดงานก่อสร้าง)">
          <span class="scope-btn-label"><span class="scope-btn-icon">⚠️</span> ไม่พบพัสดุ (ปิดงานก่อสร้าง)</span>
          <span class="scope-btn-val"><strong>${sc.noMatWbs.toLocaleString('th-TH')}</strong> งาน</span>
          ${curMode === 'NO_MAT' ? '<span class="scope-btn-check">✓</span>' : ''}
        </button>`;

      if (typeof updateMatToolbarWbsStatsVisibility === 'function') {
        updateMatToolbarWbsStatsVisibility();
      }

      const sfTitleEl = document.getElementById('matSfTitle');
      if (sfTitleEl) {
        if (curMode === 'NO_MAT') {
          sfTitleEl.innerHTML = '🔎 ตัวกรองรายการที่ไม่พบพัสดุ';
        } else if (curMode === 'ALL') {
          sfTitleEl.innerHTML = '🔎 ตัวกรองรายการพัสดุทั้งหมด';
        } else {
          sfTitleEl.innerHTML = '🔎 ตัวกรองรายการที่พบพัสดุ';
        }
      }
    }

    document.querySelectorAll('#matTableCard .mat-hasmat-filter-pills .mat-qpill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-hasmat') === matState.hasMatFilter);
    });

    // 3. Render Column Picker Badge & List
    renderMatColDropdownList();

    // 4. Render THEAD
    const orderedDefs = getOrderedMatColDefs();
    let visibleCols = orderedDefs.filter(c => matState.visibleColumns[c.id]);
    if (visibleCols.length === 0) {
      matState.visibleColumns['wbs'] = true;
      matState.visibleColumns['matCode'] = true;
      matState.visibleColumns['matDesc'] = true;
      visibleCols = orderedDefs.filter(c => matState.visibleColumns[c.id]);
    }

    const thead = document.getElementById('matTableHead');
    if (thead) {
      let thHtml = '<tr class="wbs-header-row">';
      visibleCols.forEach(col => {
        const isSorted = matState.sortCol === col.sortKey;
        const sortClass = isSorted ? (matState.sortAsc ? 'sort-active asc' : 'sort-active desc') : '';
        const sortArrow = isSorted ? (matState.sortAsc ? ' ▲' : ' ▼') : '';

        let styleStr = 'vertical-align: top; ';
        if (col.width) styleStr += `width:${col.width}; `;
        if (col.minWidth) styleStr += `min-width:${col.minWidth}; `;
        if (col.align) styleStr += `text-align:${col.align}; `;

        let justifyStyle = 'align-items:flex-start; text-align:left; justify-content:flex-start;';
        let rowJustify = 'justify-content:flex-start;';
        if (col.align === 'center') {
          justifyStyle = 'align-items:center; text-align:center; justify-content:flex-start;';
          rowJustify = 'justify-content:center;';
        } else if (col.align === 'right') {
          justifyStyle = 'align-items:flex-end; text-align:right; justify-content:flex-start;';
          rowJustify = 'justify-content:flex-end;';
        }

        let subDateHtml = '';
        if (col.id === 'statusSap') {
          subDateHtml = `<div class="th-sub-date-text" style="font-size:0.69rem; color:#CBD5E1; font-weight:500; line-height:1.2; margin:1px 0 3px 0; text-align:center; white-space:nowrap;" title="ข้อมูลสถานะ SAP จากไฟล์ 04 ZBUDR064 แก้ไขล่าสุด: 12 พ.ย. 2569 เวลา 09:33 น.">แก้ไขล่าสุด: 12 พ.ย. 69</div>`;
        } else if (col.id === 'matCode') {
          const m07Meta = (window.AUC_MAT07_COMPACT && window.AUC_MAT07_COMPACT.meta) ? window.AUC_MAT07_COMPACT.meta : {};
          const f07Sub = m07Meta.lastModifiedShortTh ? `${m07Meta.lastModifiedShortTh} 14:31 น.` : '5 พ.ย. 69 14:31 น.';
          subDateHtml = `<div class="th-sub-date-text" style="font-size:0.69rem; color:#7DD3FC; font-weight:500; line-height:1.2; margin:1px 0 3px 0; white-space:nowrap;" title="ข้อมูลพัสดุค้างเบิกจากไฟล์ 07 CN52N แก้ไขล่าสุด: 5 พ.ย. 2569 เวลา 14:31 น.">ไฟล์ 07: ${f07Sub}</div>`;
        }

        let metricHtml = '';
        if (agg.uniqueWbs > 0 || (matState.scopeStats && matState.scopeStats.uniqueWbs > 0)) {
          if (col.id === 'wbs') {
            // ย้ายสรุปจำนวนงาน WBS ไปไว้ที่แถบ Toolbar ด้านบนแทนช่องค้นหาเดิมแล้ว
            metricHtml = '';
          } else if (col.id === 'office') {
            metricHtml = `<div class="th-header-metric-badge"><span class="th-header-gold-pill">🏢 <strong>${agg.uniqueOffices.toLocaleString('th-TH')}</strong> กฟฟ.</span></div>`;
          } else if (col.id === 'warehouse') {
            metricHtml = `<div class="th-header-metric-badge"><span class="th-header-gold-pill">🏬 <strong>${(agg.uniqueWarehouses || 0).toLocaleString('th-TH')}</strong> คลัง</span></div>`;
          } else if (col.id === 'matCode') {
            metricHtml = `<div class="th-header-metric-badge"><span class="th-header-gold-pill">📦 <strong>${agg.uniqueMaterials.toLocaleString('th-TH')}</strong> รหัส</span></div>`;
          } else if (col.id === 'pctMatWithdraw') {
            metricHtml = `<div class="th-header-metric-badge th-header-stacked"><span class="th-header-type-badge">เฉลี่ย</span><span class="th-header-gold-pct">${agg.avgPctMat.toFixed(2)}%</span></div>`;
          } else if (col.id === 'reqQty') {
            metricHtml = `<div class="th-header-metric-badge th-header-stacked"><span class="th-header-type-badge">รวม</span><span class="th-header-gold-val">${formatQty(agg.sumReq)}</span></div>`;
          } else if (col.id === 'wdrQty') {
            metricHtml = `<div class="th-header-metric-badge th-header-stacked"><span class="th-header-type-badge">รวมเบิก</span><span class="th-header-gold-val" style="color:#34D399;">${formatQty(agg.sumWdr)}</span></div>`;
          } else if (col.id === 'remainQty') {
            metricHtml = `<div class="th-header-metric-badge th-header-stacked"><span class="th-header-type-badge">รวมค้างเบิก</span><span class="th-header-gold-val" style="color:#FBBF24;">${formatQty(agg.sumRem)}</span></div>`;
          } else if (col.id === 'priceLocal') {
            metricHtml = `<div class="th-header-metric-badge th-header-stacked"><span class="th-header-type-badge">รวม</span><span class="th-header-gold-val">${formatMoney(agg.sumPrice)}</span></div>`;
          } else if (col.id === 'statusSap') {
            // ตัวกรองสถานะ SAP ย้ายไปอยู่แถบตัวกรองด้านบนแล้ว (ไม่แสดงปุ่มในหัวตาราง)
            metricHtml = '';
          }
        }

        thHtml += `
          <th style="${styleStr}" class="${sortClass} th-draggable"
              data-col-id="${col.id}"
              draggable="true"
              ondragstart="window.handleMatColDragStart(event, '${col.id}')"
              ondragover="window.handleMatColDragOver(event, '${col.id}')"
              ondragleave="window.handleMatColDragLeave(event)"
              ondrop="window.handleMatColDrop(event, '${col.id}')"
              ondragend="window.handleMatColDragEnd(event)"
              title="ลากเพื่อย้ายคอลัมน์ หรือคลิกเพื่อเรียงลำดับ (${escapeHtml(col.label)})">
            <div class="th-content-wrapper" style="${justifyStyle}">
              <div class="th-top-row" style="${rowJustify}">
                <div class="th-label-group" onclick="window.sortMaterialsTable('${col.sortKey}')" style="cursor:pointer;">
                  <span class="th-drag-handle" title="ลากเพื่อสลับคอลัมน์">⠿</span>
                  <span class="th-label-text">${escapeHtml(col.label)}</span>
                  <span class="sort-indicator" style="font-size:0.75rem; margin-left:2px; color:var(--pea-gold-400);">${sortArrow}</span>
                </div>
              </div>
              ${subDateHtml}
              ${metricHtml}
            </div>
          </th>
        `;
      });
      thHtml += '</tr>';
      thead.innerHTML = thHtml;
    }

    // 5. Pagination & TBODY
    const totalPages = Math.max(1, Math.ceil(rows.length / matState.pageSize));
    if (matState.page > totalPages) matState.page = totalPages;
    if (matState.page < 1) matState.page = 1;

    const startIdx = (matState.page - 1) * matState.pageSize;
    const endIdx = Math.min(rows.length, startIdx + matState.pageSize);
    const pageRows = rows.slice(startIdx, endIdx);

    const tbody = document.getElementById('matTableBody');
    if (tbody) {
      if (pageRows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${visibleCols.length}" style="text-align:center; padding:2.5rem; color:var(--text-dim);">ไม่พบรายการพัสดุที่ตรงกับเงื่อนไขตัวกรอง</td></tr>`;
      } else {
        let bodyHtml = '';
        for (let i = 0; i < pageRows.length; i++) {
          const r = pageRows[i];
          const displayNo = startIdx + i + 1;
          const isPending = Math.abs(r.remainQty) >= 0.0005;

          bodyHtml += `<tr class="${isPending ? 'mat-row-pending' : ''}">`;
          for (let c = 0; c < visibleCols.length; c++) {
            const col = visibleCols[c];
            const alignStyle = col.align ? `text-align:${col.align};` : '';

            if (r.noMat && (col.group === '07' || col.id === 'remainQty' || col.id === 'warehouse')) {
              if (col.id === 'matDesc') {
                bodyHtml += `<td style="color:#FCA5A5; font-weight:600; font-style:italic; white-space:nowrap;">⚠️ ไม่มีรายการพัสดุค้างเบิก</td>`;
              } else {
                bodyHtml += `<td style="${alignStyle} color:var(--text-dim);">-</td>`;
              }
              continue;
            }

            if (col.id === 'rowNo') {
              bodyHtml += `<td style="text-align:center; color:var(--text-dim); font-size:0.8rem;">${displayNo.toLocaleString('th-TH')}</td>`;
            } else if (col.id === 'wbs' || col.id === 'wbs07') {
              const v = col.id === 'wbs' ? r.wbs : r.wbs07;
              bodyHtml += `<td style="font-family:monospace; font-weight:700; color:var(--pea-gold-400); white-space:nowrap;">${escapeHtml(v)}</td>`;
            } else if (col.id === 'office') {
              bodyHtml += `<td><span class="wbs-office-pill" style="display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:6px; background:rgba(255,184,28,0.12); border:1px solid rgba(255,184,28,0.28); color:#FDE68A; font-size:0.78rem; font-weight:600; white-space:nowrap;">🏢 ${escapeHtml(r.m.office || '-')}</span></td>`;
            } else if (col.id === 'statusSap') {
              const st = r.sapShort || '-';
              bodyHtml += `<td style="text-align:center;"><span class="badge-sap ${getSapBadgeClass(st)}">${escapeHtml(st)}</span></td>`;
            } else if (col.id === 'warehouse') {
              const wh = r.warehouse || '-';
              if (!wh || wh === '-') {
                bodyHtml += `<td style="text-align:center; color:var(--text-dim);">-</td>`;
              } else {
                bodyHtml += `<td style="white-space:nowrap;"><span class="wbs-warehouse-pill" style="display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:6px; background:rgba(14,165,233,0.12); border:1px solid rgba(14,165,233,0.30); color:#7DD3FC; font-size:0.78rem; font-weight:600;">🏬 ${escapeHtml(wh)}</span></td>`;
              }
            } else if (col.id === 'matCode') {
              bodyHtml += `<td style="font-family:monospace; font-weight:700; color:#7DD3FC; white-space:nowrap;">${escapeHtml(r.matCode || '-')}</td>`;
            } else if (col.id === 'matDesc') {
              bodyHtml += `<td style="color:var(--text-main); font-weight:500;">${escapeHtml(r.matDesc || '-')}</td>`;
            } else if (col.id === 'mvtType') {
              const mvCol = r.mvtType === '581' ? 'background:rgba(244,114,182,0.16); color:#F472B6; border:1px solid rgba(244,114,182,0.35);' : 'background:rgba(56,189,248,0.15); color:#7DD3FC; border:1px solid rgba(56,189,248,0.32);';
              bodyHtml += `<td style="text-align:center;"><span style="padding:1px 7px; border-radius:5px; font-size:0.75rem; font-weight:700; ${mvCol}">${escapeHtml(r.mvtType || '-')}</span></td>`;
            } else if (col.id === 'matStatus') {
              bodyHtml += `<td style="text-align:center;"><span class="badge-sap ${getSapBadgeClass(r.matStatus)}" style="font-size:0.73rem;">${escapeHtml(r.matStatus || '-')}</span></td>`;
            } else if (col.id === 'remainQty') {
              const rem = r.remainQty;
              const remColor = rem > 0.0005 ? '#FBBF24' : (rem < -0.0005 ? '#FB7185' : '#34D399');
              const remBg = rem > 0.0005 ? 'rgba(245,158,11,0.15)' : (rem < -0.0005 ? 'rgba(251,113,133,0.15)' : 'rgba(16,185,129,0.13)');
              bodyHtml += `<td style="text-align:right;"><span style="display:inline-block; min-width:54px; padding:2px 8px; border-radius:6px; background:${remBg}; color:${remColor}; font-weight:700;">${formatQty(rem)}</span></td>`;
            } else if (col.isQty) {
              const qv = getFieldVal(r, col.id, gf.crit);
              const qCol = col.id === 'wdrQty' ? '#6EE7B7' : '#E2E8F0';
              bodyHtml += `<td style="text-align:right; font-weight:600; color:${qCol};">${formatQty(qv)}</td>`;
            } else if (col.isPercent) {
              const rawP = Number(getFieldVal(r, col.id, gf.crit)) || 0;
              const pctVal = (Math.abs(rawP) <= 1.0 && rawP !== 0) ? (rawP * 100) : rawP;
              const pGood = pctVal >= 80;
              const pBg = pGood ? 'rgba(16,185,129,0.16)' : (pctVal >= 50 ? 'rgba(245,158,11,0.16)' : 'rgba(239,68,68,0.16)');
              const pFg = pGood ? '#34D399' : (pctVal >= 50 ? '#FBBF24' : '#F87171');
              bodyHtml += `<td style="text-align:right;"><span style="padding:2px 7px; border-radius:6px; background:${pBg}; color:${pFg}; font-weight:700; font-size:0.78rem;">${pctVal.toFixed(2)}%</span></td>`;
            } else if (col.isMoney) {
              const mv = getFieldVal(r, col.id, gf.crit);
              const mCol = col.id === 'priceLocal' ? '#7DD3FC' : 'var(--text-main)';
              bodyHtml += `<td style="text-align:right; font-variant-numeric:tabular-nums; color:${mCol}; font-weight:${col.id === 'priceLocal' ? '600' : '400'};">${formatMoney(mv)}</td>`;
            } else {
              const v = getFieldVal(r, col.id, gf.crit);
              bodyHtml += `<td style="${alignStyle}">${escapeHtml(v || '-')}</td>`;
            }
          }
          bodyHtml += '</tr>';
        }
        tbody.innerHTML = bodyHtml;
      }
    }

    // 6. Render Pagination Controls
    const infoEl = document.getElementById('matPaginationInfoText');
    if (infoEl) {
      infoEl.innerHTML = rows.length === 0
        ? 'ไม่พบรายการ (0 รายการ)'
        : `แสดง <strong style="color:#FFFFFF;">${(startIdx + 1).toLocaleString('th-TH')} - ${endIdx.toLocaleString('th-TH')}</strong> จากทั้งหมด <strong style="color:#FFE58F;">${rows.length.toLocaleString('th-TH')}</strong> รายการ (หน้า <strong style="color:#FDE047;">${matState.page.toLocaleString('th-TH')}</strong>/${totalPages.toLocaleString('th-TH')})`;
    }

    const ctrlEl = document.getElementById('matPaginationControls');
    if (ctrlEl) {
      let pHtml = '';
      const mkBtn = (lbl, targetPage, disabled, active, isNav = false) =>
        `<button type="button" class="btn-page page-btn ${active ? 'active' : ''} ${isNav ? 'btn-nav-page' : ''}" ${disabled ? 'disabled' : ''} onclick="window.goToMatPage(${targetPage})" title="${isNav ? lbl.replace(/[^ก-๙a-zA-Z]/g, '').trim() : 'หน้า ' + targetPage}">${lbl}</button>`;

      pHtml += mkBtn('« ก่อนหน้า', matState.page - 1, matState.page <= 1, false, true);

      const pagesToShow = [];
      pagesToShow.push(1);
      for (let p = Math.max(2, matState.page - 2); p <= Math.min(totalPages - 1, matState.page + 2); p++) {
        pagesToShow.push(p);
      }
      if (totalPages > 1) pagesToShow.push(totalPages);

      let prevP = 0;
      pagesToShow.forEach(p => {
        if (prevP && p - prevP > 1) {
          pHtml += `<span class="pagination-dots">...</span>`;
        }
        pHtml += mkBtn(p.toLocaleString('th-TH'), p, false, p === matState.page, false);
        prevP = p;
      });

      pHtml += mkBtn('ถัดไป »', matState.page + 1, matState.page >= totalPages, false, true);
      ctrlEl.innerHTML = pHtml;
    }
  }

  // ==========================================
  // Interactive Handlers Exposed on window
  // ==========================================
  window.renderMaterialsTab = renderMaterialsTab;
  window.updateMaterialsNavBadge = updateMaterialsNavBadge;

  window.goToMatPage = function (p) {
    matState.page = Number(p) || 1;
    renderMaterialsTab();
    const wrap = document.getElementById('matTableResponsive');
    if (wrap) wrap.scrollTop = 0;
  };

  window.setMatPageSize = function (val) {
    matState.pageSize = Math.max(10, Math.min(1000, Number(val) || 25));
    matState.page = 1;
    renderMaterialsTab();
  };

  window.sortMaterialsTable = function (sortKey) {
    if (!sortKey) return;
    if (matState.sortCol === sortKey) {
      matState.sortAsc = !matState.sortAsc;
    } else {
      matState.sortCol = sortKey;
      const colDef = MAT_COL_DEFS.find(c => c.sortKey === sortKey) || {};
      matState.sortAsc = !colDef.isNumeric;
    }
    matState.cachedFilterKey = '';
    matState.page = 1;
    renderMaterialsTab();
  };

  let searchTimer = null;
  window.handleMatLocalSearch = function (val) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      matState.localSearch = val || '';
      matState.cachedFilterKey = '';
      matState.page = 1;
      renderMaterialsTab();
    }, 160);
  };

  window.setMatPendingMode = function (mode) {
    matState.pendingMode = mode || 'ALL';
    matState.cachedFilterKey = '';
    matState.page = 1;
    renderMaterialsTab();
  };

  window.setMatMvtFilter = function () {
    matState.mvtFilter = '281';
    matState.cachedFilterKey = '';
    matState.page = 1;
    renderMaterialsTab();
  };

  window.setMatHasMatFilter = function (val) {
    matState.hasMatFilter = val || 'HAS_MAT';
    matState.cachedFilterKey = '';
    matState._subOptKey = '';
    matState.page = 1;
    renderMaterialsTab();
    if (typeof updateMatSubFilterCount === 'function') updateMatSubFilterCount();
  };

  // ตัวกรองย่อยเฉพาะหน้ารายการพัสดุ (ไม่กระทบหน้าภาพรวม / WBS)
  // สร้างรายการ Dropdown ของตัวกรองย่อยในวงแดง (WBS / ข้อความวัสดุ / สถานะ SAP) ให้สอดคล้องกับตัวเลือกในวงเหลือง (HAS_MAT / ALL / NO_MAT)
  function refreshMatSubFilterOptions() {
    const wbsSel = document.getElementById('matFilterWbs');
    const descSel = document.getElementById('matFilterMatDesc');
    if (!wbsSel || !descSel || !matState.allRows) return;

    const curMode = matState.hasMatFilter || 'HAS_MAT';
    const gf = getGlobalFilters();
    const filterCrit = gf.crit;
    const hasCrit = filterCrit && filterCrit !== 'ALL' && filterCrit !== 'เลือกทั้งหมด';
    const hasProv = gf.prov && gf.prov !== 'ALL' && gf.prov !== 'กฟก.3 (ทั้งหมด)';
    const hasOff = gf.off && gf.off !== 'ALL';
    const topQ = gf.search;

    const src = matState.allRows;
    const modeRows = [];
    const validModeWbs = new Set();
    const validModeDesc = new Set();
    const validModeSap = new Set();

    for (let i = 0; i < src.length; i++) {
      const r = src[i];
      const m = r.m;
      if (curMode === 'HAS_MAT' && r.noMat) continue;
      if (curMode === 'NO_MAT' && !r.noMat) continue;
      if (!r.noMat && r.mvtType !== '281') continue;

      if (hasCrit) {
        let ok = false;
        for (let c = 0; c < r.critList.length; c++) {
          if (matchesCriteria(r.critList[c], filterCrit)) { ok = true; break; }
        }
        if (!ok) continue;
      }
      if (hasProv && m.province !== gf.prov) continue;
      if (hasOff && m.office !== gf.off) continue;
      if (topQ) {
        const hitTop =
          (r.wbs && r.wbs.toLowerCase().includes(topQ)) ||
          (r.matCode && r.matCode.toLowerCase().includes(topQ)) ||
          (r.matDesc && r.matDesc.toLowerCase().includes(topQ)) ||
          (m.office && m.office.toLowerCase().includes(topQ)) ||
          (m.province && m.province.toLowerCase().includes(topQ)) ||
          (m.description && m.description.toLowerCase().includes(topQ)) ||
          (r.sapShort && r.sapShort.toLowerCase().includes(topQ)) ||
          (m.engineer && m.engineer.toLowerCase().includes(topQ)) ||
          (r.network && r.network.toLowerCase().includes(topQ)) ||
          (r.plant && r.plant.toLowerCase().includes(topQ)) ||
          (r.warehouse && r.warehouse.toLowerCase().includes(topQ)) ||
          (r.reservation && r.reservation.toLowerCase().includes(topQ));
        if (!hitTop) continue;
      }

      modeRows.push(r);
      const w = String(r.wbs || '').trim();
      const d = String(r.matDesc || '').trim();
      const st = String(r.sapShort || '(ไม่ระบุ)');
      if (w) validModeWbs.add(w);
      if (!r.noMat && d) validModeDesc.add(d);
      if (curMode === 'ALL' && r.noMat && d) validModeDesc.add(d);
      validModeSap.add(st);
    }

    // ตรวจสอบว่าค่าตัวกรองย่อยที่เลือกไว้เดิมยังมีอยู่ในโหมดวงเหลืองปัจจุบันหรือไม่ หากไม่มีให้รีเซ็ตอัตโนมัติ
    if (matState.filterWbs && matState.filterWbs !== 'ALL' && !validModeWbs.has(matState.filterWbs.trim())) {
      matState.filterWbs = '';
      matState.cachedFilterKey = '';
    }
    if (curMode === 'NO_MAT') {
      if (matState.filterMatDesc) {
        matState.filterMatDesc = '';
        matState.cachedFilterKey = '';
      }
    } else if (matState.filterMatDesc && matState.filterMatDesc !== 'ALL' && !validModeDesc.has(matState.filterMatDesc.trim())) {
      matState.filterMatDesc = '';
      matState.cachedFilterKey = '';
    }
    if (matState.sapStatuses.size > 0) {
      let sapRemoved = false;
      Array.from(matState.sapStatuses).forEach(st => {
        if (!validModeSap.has(st)) {
          matState.sapStatuses.delete(st);
          sapRemoved = true;
        }
      });
      if (sapRemoved) matState.cachedFilterKey = '';
    }

    const curW = (matState.filterWbs || '').trim();
    const curD = (matState.filterMatDesc || '').trim();
    const effectiveDesc = curD || '';
    const hasDescFilter = !!effectiveDesc && effectiveDesc !== 'ALL';
    const hasWbsFilter = !!curW && curW !== 'ALL';
    const hasSapFilter = matState.sapStatuses.size > 0;

    const wbsSet = new Set();
    const descSet = new Set();
    const sapSet = new Set();
    let hasNoMatInDescScope = false;

    for (let i = 0; i < modeRows.length; i++) {
      const r = modeRows[i];
      const w = String(r.wbs || '').trim();
      const d = String(r.matDesc || '').trim();
      const st = String(r.sapShort || '(ไม่ระบุ)');

      const matchSap = !hasSapFilter || matState.sapStatuses.has(st);
      const matchWbs = !hasWbsFilter || (w && w.toLowerCase() === curW.toLowerCase());
      const matchDesc = !hasDescFilter || (d && d.toLowerCase() === effectiveDesc.toLowerCase());

      // 1) ตัวเลือก WBS: กรองตามโหมดวงเหลือง + สถานะ SAP + ข้อความวัสดุที่เลือก
      if (w && matchSap && matchDesc) {
        wbsSet.add(w);
      }

      // 2) ตัวเลือกข้อความวัสดุ: กรองตามโหมดวงเหลือง + สถานะ SAP + WBS ที่เลือก
      if (matchSap && matchWbs) {
        if (r.noMat) {
          hasNoMatInDescScope = true;
        } else if (d) {
          descSet.add(d);
        }
      }

      // 3) ตัวเลือกสถานะ SAP: กรองตามโหมดวงเหลือง + WBS + ข้อความวัสดุที่เลือก
      if (matchWbs && matchDesc) {
        sapSet.add(st);
      }
    }

    matState._availableSapCount = sapSet.size;
    updateMatSfSapBtn();

    const sapPanel = document.getElementById('matSapThDropdownPanel');
    if (sapPanel && sapPanel.style.display === 'block') {
      renderMatSapThDropdownList();
    }

    const key = [curMode, wbsSet.size, descSet.size, sapSet.size, hasNoMatInDescScope ? '1' : '0', gf.crit, gf.prov, gf.off, topQ, curW, curD, Array.from(matState.sapStatuses).sort().join('|')].join('§');
    if (matState._subOptKey === key) return;
    matState._subOptKey = key;

    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const sortedW = Array.from(wbsSet).sort();
    const sortedD = Array.from(descSet).sort(compareMatDescEnglishFirst);

    // 1. Populate WBS dropdown ตามโหมดที่เลือกในวงเหลือง
    let wbsCountLabel = '';
    if (curMode === 'NO_MAT') {
      wbsCountLabel = `แสดง WBS ที่ไม่พบพัสดุ (${sortedW.length.toLocaleString('th-TH')} งาน)`;
    } else if (curMode === 'ALL') {
      if (hasDescFilter) {
        wbsCountLabel = effectiveDesc === 'ไม่มีรายการพัสดุค้างเบิก'
          ? `งานที่ไม่พบพัสดุ (${sortedW.length.toLocaleString('th-TH')} งาน)`
          : `งานที่มีพัสดุนี้ (${sortedW.length.toLocaleString('th-TH')} งาน)`;
      } else {
        wbsCountLabel = `แสดง WBS ทั้งหมด (${sortedW.length.toLocaleString('th-TH')} งาน)`;
      }
    } else {
      // Default: HAS_MAT (พบพัสดุ)
      wbsCountLabel = hasDescFilter
        ? `งานที่มีพัสดุนี้ (${sortedW.length.toLocaleString('th-TH')} งาน)`
        : `แสดง WBS ที่พบพัสดุ (${sortedW.length.toLocaleString('th-TH')} งาน)`;
    }

    let wHtml = `<option value="ALL">-- ${wbsCountLabel} --</option>`;
    sortedW.forEach(w => {
      wHtml += `<option value="${esc(w)}"${w === curW ? ' selected' : ''}>${esc(w)}</option>`;
    });
    wbsSel.innerHTML = wHtml;
    wbsSel.value = (curW && wbsSet.has(curW)) ? curW : 'ALL';

    // 2. Populate Material Description dropdown ตามโหมดที่เลือกในวงเหลือง
    if (curMode === 'NO_MAT') {
      descSel.innerHTML = `<option value="ALL">-- ไม่มีรายการพัสดุค้างเบิก (0 รายการ) --</option>`;
      descSel.value = 'ALL';
      descSel.disabled = true;
    } else {
      descSel.disabled = false;
      let descCountLabel = '';
      if (hasWbsFilter && sortedD.length === 0 && hasNoMatInDescScope) {
        descCountLabel = `ไม่มีรายการพัสดุค้างเบิก (0 รายการ)`;
      } else if (hasWbsFilter) {
        descCountLabel = `พัสดุในงานนี้ (${sortedD.length.toLocaleString('th-TH')} รายการ)`;
      } else {
        descCountLabel = `แสดงข้อความวัสดุทั้งหมด (${sortedD.length.toLocaleString('th-TH')} รายการ)`;
      }

      let dHtml = `<option value="ALL">-- ${descCountLabel} --</option>`;
      if (curMode === 'ALL' && hasNoMatInDescScope) {
        const noMatVal = 'ไม่มีรายการพัสดุค้างเบิก';
        dHtml += `<option value="${esc(noMatVal)}"${curD === noMatVal ? ' selected' : ''}>⚠️ ไม่มีรายการพัสดุค้างเบิก (งานไม่พบพัสดุ)</option>`;
      }
      sortedD.forEach(d => {
        dHtml += `<option value="${esc(d)}"${d === curD ? ' selected' : ''}>${esc(d)}</option>`;
      });
      descSel.innerHTML = dHtml;
      const isCurDValid = curD && (descSet.has(curD) || (curMode === 'ALL' && hasNoMatInDescScope && curD === 'ไม่มีรายการพัสดุค้างเบิก'));
      descSel.value = isCurDValid ? curD : 'ALL';
    }

    // 3. ปุ่มเคลียร์ด่วน ✕
    const clearWBtn = document.getElementById('matClearWbsBtn');
    if (clearWBtn) clearWBtn.style.display = (curW && curW !== 'ALL') ? 'inline-flex' : 'none';

    const clearDBtn = document.getElementById('matClearDescBtn');
    if (clearDBtn) clearDBtn.style.display = (curD && curD !== 'ALL' && curMode !== 'NO_MAT') ? 'inline-flex' : 'none';
    if (window.syncMatDescDropdown) window.syncMatDescDropdown();
    if (window.syncMatWbsDropdown) window.syncMatWbsDropdown();
  }

  /**
   * กราฟแนวนอน: ปริมาณค้างเบิก (แดง) แยกตามข้อความวัสดุ + ช่องสำรองปริมาณคงเหลือในคลัง (เขียว, ไฟล์ 08 ในอนาคต)
   * - ใช้ข้อมูลจากตารางพัสดุเท่านั้น (แถวที่มีพัสดุและปริมาณค้างเบิก > 0)
   * - ลิงก์กับตัวกรองทั้งหมด ยกเว้นการเลือกจากกราฟเอง (ทางเดียว: คลิกกราฟ → กรองตาราง ตารางไม่ส่งผลกลับมาที่กราฟ)
   */
  const MAT_CHART_MAX_ROWS = 500;



  // Fast Stock lookup cache from File 08 (MB52)
  function getMat08StockMap() {
    if (window._mat08StockMap) return window._mat08StockMap;
    const stock = window.AUC_MAT08_STOCK;
    if (!stock || !Array.isArray(stock.entries)) return null;

    const byCodePlant = new Map();
    const byDescPlant = new Map();

    for (let i = 0; i < stock.entries.length; i++) {
      const e = stock.entries[i];
      const code = String(e[0] || '').trim();
      const desc = String(e[1] || '').trim();
      const plnt = String(e[2] || '').trim().toUpperCase();
      const unit = String(e[3] || '').trim();
      const stockC = Number(e[4]) || 0;
      const stockIp = Number(e[5]) || 0;

      const obj = { code, desc, plant: plnt, unit, stockC, stockIp };
      if (code && plnt) byCodePlant.set(code + '|' + plnt, obj);
      if (desc && plnt) byDescPlant.set(desc + '|' + plnt, obj);
    }

    window._mat08StockMap = { byCodePlant, byDescPlant };
    return window._mat08StockMap;
  }

  function renderMatRemainChart() {
    const body = document.getElementById('matHChartBody');
    const scroll = document.getElementById('matHChartScroll');
    const subEl = document.getElementById('matHChartSub');
    const legendEl = document.getElementById('matHChartLegendContainer');
    if (!body) return;

    const prevTop = scroll ? scroll.scrollTop : 0;

    const rows = getFilteredMaterialRows(false, true);
    const agg = new Map();
    let hasAnyIp = false;
    let hasAnyC = false;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (r.noMat) continue;
      const rem = Number(r.remainQty) || 0;
      if (rem <= 0.0005) continue;
      const key = r.matDesc || r.matCode || '';
      if (!key) continue;

      let item = agg.get(key);
      if (!item) {
        item = {
          name: key,
          remIp: 0,
          remC: 0,
          remTotal: 0,
          matCodes: new Set(),
          plants: new Set(),
          stockIp: 0,
          stockC: 0,
          stockTotal: 0,
          byPlant: {
            'I010': { remIp: 0, remC: 0, stockIp: 0, stockC: 0 },
            'I020': { remIp: 0, remC: 0, stockIp: 0, stockC: 0 },
            'I030': { remIp: 0, remC: 0, stockIp: 0, stockC: 0 },
            'I040': { remIp: 0, remC: 0, stockIp: 0, stockC: 0 },
            'I050': { remIp: 0, remC: 0, stockIp: 0, stockC: 0 },
            'I070': { remIp: 0, remC: 0, stockIp: 0, stockC: 0 }
          }
        };
        agg.set(key, item);
      }

      // แยกงบตาม WBS: C = งบ C (ส้มสะท้อนแสง), I, P = งบ I, P (แดง)
      const w = String(r.wbs || '').trim().toUpperCase();
      const isC = w.startsWith('C');
      if (isC) {
        item.remC += rem;
        hasAnyC = true;
      } else {
        item.remIp += rem;
        hasAnyIp = true;
      }
      item.remTotal += rem;

      const pl = String(r.plant || '').trim().toUpperCase();
      if (item.byPlant && item.byPlant[pl]) {
        if (isC) item.byPlant[pl].remC += rem;
        else item.byPlant[pl].remIp += rem;
      }

      if (r.matCode) item.matCodes.add(String(r.matCode).trim());
      if (r.plant) item.plants.add(String(r.plant).trim().toUpperCase());
    }

    // คำนวณปริมาณคงคลังจากไฟล์ 08 (MB52) ตามรหัสพัสดุและโรงงาน/Plant
    // ให้คำนวณครบทั้ง 6 คลังพัสดุ (I010, I020, I030, I040, I050, I070) เพื่อให้ข้อมูลคงคลังตรงกับไฟล์ 08 100%
    // และไม่ให้คลังที่ไม่มีงานค้างเบิกถูกตัดยอดคงคลังทิ้งเป็น 0
    const stockMaps = getMat08StockMap();
    if (stockMaps) {
      const allWarehouseCodes = ['I010', 'I020', 'I030', 'I040', 'I050', 'I070'];
      for (const item of agg.values()) {
        let sIp = 0;
        let sC = 0;

        for (let pIdx = 0; pIdx < allWarehouseCodes.length; pIdx++) {
          const pl = allWarehouseCodes[pIdx];
          let plIp = 0;
          let plC = 0;

          if (item.matCodes && item.matCodes.size > 0) {
            item.matCodes.forEach(code => {
              const s = stockMaps.byCodePlant.get(code + '|' + pl);
              if (s) {
                plIp += s.stockIp;
                plC += s.stockC;
              }
            });
          }
          if (plIp === 0 && plC === 0) {
            const sD = stockMaps.byDescPlant.get(item.name + '|' + pl);
            if (sD) {
              plIp += sD.stockIp;
              plC += sD.stockC;
            }
          }

          if (item.byPlant && item.byPlant[pl]) {
            item.byPlant[pl].stockIp = plIp;
            item.byPlant[pl].stockC = plC;
          }

          // รวมยอดตามตัวกรองคลัง (หากไม่มีตัวกรองคลัง filterPlant ให้รวมครบทั้ง 6 คลัง)
          if (!matState.filterPlant || matState.filterPlant === pl) {
            sIp += plIp;
            sC += plC;
          }
        }

        item.stockIp = sIp;
        item.stockC = sC;
        item.stockTotal = sIp + sC;
      }
    }

    window._matLastChartAgg = agg;

    const gf = getGlobalFilters();
    const critBudgetLock = getCriteriaBudgetLock(gf.crit);

    // ซิงก์สถานะล็อคงบประมาณเมื่อเปลี่ยนเกณฑ์วัด
    if (matState.lastCrit !== gf.crit) {
      matState.lastCrit = gf.crit;
      if (critBudgetLock === 'C') {
        matState.chartBudgetFilter = 'C';
        matState.chartSelBudget = 'C';
      } else if (critBudgetLock === 'IP') {
        matState.chartBudgetFilter = 'IP';
        matState.chartSelBudget = 'IP';
      } else {
        // เมื่อไม่ได้เลือกเกณฑ์วัดที่ล็อคงบ ให้คืนค่าแสดงทั้ง 2 งบ
        matState.chartBudgetFilter = 'ALL';
        matState.chartSelBudget = 'ALL';
      }
    }

    // ตรวจสอบ effectiveBudget
    let effectiveBudget = matState.chartBudgetFilter || 'ALL';
    let lockedBudget = null;

    if (critBudgetLock === 'C') {
      effectiveBudget = 'C';
      matState.chartBudgetFilter = 'C';
      if (matState.chartSelBudget !== 'C') matState.chartSelBudget = 'C';
      lockedBudget = 'C';
    } else if (critBudgetLock === 'IP') {
      effectiveBudget = 'IP';
      matState.chartBudgetFilter = 'IP';
      if (matState.chartSelBudget !== 'IP') matState.chartSelBudget = 'IP';
      lockedBudget = 'IP';
    } else if (hasAnyC && !hasAnyIp) {
      effectiveBudget = 'C';
    } else if (hasAnyIp && !hasAnyC) {
      effectiveBudget = 'IP';
    }

    // อัปเดต Legend และปุ่มเลือกงบ (คำสั่งผู้ใช้: หากล็อคเกณฑ์งบ ให้แสดงปุ่มแต่กดอะไรไม่ได้เลย)
    if (legendEl) {
      let isAll = false;
      let isIp = false;
      let isC = false;
      let disableIp = false;
      let disableC = false;
      let tagIp = '';
      let tagC = '';
      let titleIp = '';
      let titleC = '';
      let styleIp = '';
      let styleC = '';
      let attrIp = '';
      let attrC = '';

      if (lockedBudget === 'C') {
        // ล็อคที่งบ C: แสดงทั้งสองปุ่ม แต่กดอะไรไม่ได้เลย
        isC = true;
        disableIp = true;
        tagC = '<span class="mat-budget-check">✓ ตามเกณฑ์วัด</span>';
        tagIp = '<span class="mat-budget-subtag">(ล็อคตามเกณฑ์วัด)</span>';
        titleC = `ล็อคแสดงเฉพาะ งบ C ตามเกณฑ์วัดที่เลือก (${escapeHtml(gf.crit || '')}) — ไม่สามารถเปลี่ยนได้`;
        titleIp = `ล็อคตามเกณฑ์วัด งบ C (ไม่สามารถเลือก งบ I, P ได้)`;
        styleC = 'cursor: default; pointer-events: none;';
        styleIp = 'opacity: 0.35; cursor: not-allowed; pointer-events: none;';
        attrIp = 'disabled="disabled" tabindex="-1"';
        attrC = 'tabindex="-1"';
      } else if (lockedBudget === 'IP') {
        // ล็อคที่งบ I, P: แสดงทั้งสองปุ่ม แต่กดอะไรไม่ได้เลย
        isIp = true;
        disableC = true;
        tagIp = '<span class="mat-budget-check">✓ ตามเกณฑ์วัด</span>';
        tagC = '<span class="mat-budget-subtag">(ล็อคตามเกณฑ์วัด)</span>';
        titleIp = `ล็อคแสดงเฉพาะ งบ I, P ตามเกณฑ์วัดที่เลือก (${escapeHtml(gf.crit || '')}) — ไม่สามารถเปลี่ยนได้`;
        titleC = `ล็อคตามเกณฑ์วัด งบ I, P (ไม่สามารถเลือก งบ C ได้)`;
        styleIp = 'cursor: default; pointer-events: none;';
        styleC = 'opacity: 0.35; cursor: not-allowed; pointer-events: none;';
        attrC = 'disabled="disabled" tabindex="-1"';
        attrIp = 'tabindex="-1"';
      } else {
        // โหมดปกติ (ALL หรือเกณฑ์ที่ไม่มีการล็อคงบ): ผู้ใช้สามารถกดเลือกงบได้อย่างอิสระ
        const activeBudget = (matState.chartSelBudget && matState.chartSelBudget !== 'ALL')
          ? matState.chartSelBudget
          : effectiveBudget;
        isAll = (activeBudget === 'ALL');
        isIp = (activeBudget === 'IP');
        isC = (activeBudget === 'C');

        disableIp = !hasAnyIp;
        disableC = !hasAnyC;

        tagIp = isIp
          ? '<span class="mat-budget-check">✓ เลือกอยู่</span>'
          : (!hasAnyIp ? '<span class="mat-budget-subtag">(ไม่มีข้อมูล)</span>' : '');
        tagC = isC
          ? '<span class="mat-budget-check">✓ เลือกอยู่</span>'
          : (!hasAnyC ? '<span class="mat-budget-subtag">(ไม่มีข้อมูล)</span>' : '');

        titleIp = isIp ? 'คลิกอีกครั้งเพื่อแสดงทั้ง 2 งบ' : 'คลิกเพื่อเลือกแสดงเฉพาะ งบ I, P (สีแดงเข้ม)';
        titleC = isC ? 'คลิกอีกครั้งเพื่อแสดงทั้ง 2 งบ' : 'คลิกเพื่อเลือกแสดงเฉพาะ งบ C (สีส้มอ่อน)';
      }

      const clsIp = `mat-budget-pill pill-red${isIp ? ' active' : (isAll ? ' in-both' : ' dimmed')}${disableIp ? ' disabled locked-disabled' : ''}${lockedBudget === 'IP' ? ' locked-active' : ''}`;
      const clsC = `mat-budget-pill pill-orange${isC ? ' active' : (isAll ? ' in-both' : ' dimmed')}${disableC ? ' disabled locked-disabled' : ''}${lockedBudget === 'C' ? ' locked-active' : ''}`;
      const clickIp = lockedBudget ? 'onclick="return false;"' : 'onclick="window.setMatChartBudgetFilter(\'IP\')"';
      const clickC = lockedBudget ? 'onclick="return false;"' : 'onclick="window.setMatChartBudgetFilter(\'C\')"';

      legendEl.innerHTML =
        '<div class="mat-budget-pill-group" role="group" aria-label="เลือกแสดงตามงบ">' +
        `<button type="button" class="${clsIp}" ${clickIp} ${attrIp} style="${styleIp}" title="${titleIp}">` +
        `<i class="lg-dot lg-red"></i> ค้างเบิก งบ I, P (สีแดงเข้ม) ${tagIp}` +
        '</button>' +
        `<button type="button" class="${clsC}" ${clickC} ${attrC} style="${styleC}" title="${titleC}">` +
        `<i class="lg-dot lg-orange"></i> ค้างเบิก งบ C (สีส้มอ่อน) ${tagC}` +
        '</button>' +
        '</div>' +
        `<span class="mat-hchart-lg${isIp ? ' active-stock-lg' : (isC ? ' dimmed-stock-lg' : '')}" title="ไฟล์ 08 คลัง SLoc 0022 ปริมาณคงเหลือคงคลังงบ I,P (สีกราฟเขียวเข้ม — แสดงอย่างเดียว)"><i class="lg-dot" style="background:#15803D; box-shadow:0 0 6px rgba(21,128,61,0.8);"></i> <span style="color:#86EFAC;">คงเหลือ SLoc 0022 งบ I,P (เขียวเข้ม)</span></span>` +
        `<span class="mat-hchart-lg${isC ? ' active-stock-lg' : (isIp ? ' dimmed-stock-lg' : '')}" title="ไฟล์ 08 คลัง SLoc 0021 ปริมาณคงเหลือคงคลังงบ C (สีกราฟเขียวอ่อน — แสดงอย่างเดียว)"><i class="lg-dot" style="background:#4ADE80; box-shadow:0 0 6px rgba(74,222,128,0.8);"></i> <span style="color:#BBF7D0;">คงเหลือ SLoc 0021 งบ C (เขียวอ่อน)</span></span>`;
    }

    // กรองและเรียงลำดับรายการตาม effectiveBudget
    let list = [];
    if (effectiveBudget === 'IP') {
      list = Array.from(agg.values())
        .filter(x => x.remIp > 0.0005)
        .sort((a, b) => (b.remIp - a.remIp) || compareMatDescEnglishFirst(a.name, b.name));
    } else if (effectiveBudget === 'C') {
      list = Array.from(agg.values())
        .filter(x => x.remC > 0.0005)
        .sort((a, b) => (b.remC - a.remC) || compareMatDescEnglishFirst(a.name, b.name));
    } else {
      list = Array.from(agg.values())
        .filter(x => x.remTotal > 0.0005)
        .sort((a, b) => (b.remTotal - a.remTotal) || compareMatDescEnglishFirst(a.name, b.name));
    }

    const total = list.length;
    const shown = list.length > MAT_CHART_MAX_ROWS ? list.slice(0, MAT_CHART_MAX_ROWS) : list;

    // คำนวณความยาวสเกลบาร์: กำหนดให้แต่ละแถวแสดงค่าไม่เกิน ROW_CAP = 100,000 หากเกินให้ขึ้นแถวใหม่ทันที
    const ROW_CAP = 100000;
    let maxRowValInView = 0;
    for (let i = 0; i < shown.length; i++) {
      const it = shown[i];
      if (effectiveBudget === 'IP') {
        maxRowValInView = Math.max(maxRowValInView, Math.min(ROW_CAP, it.remIp), Math.min(ROW_CAP, it.stockIp));
      } else if (effectiveBudget === 'C') {
        maxRowValInView = Math.max(maxRowValInView, Math.min(ROW_CAP, it.remC), Math.min(ROW_CAP, it.stockC));
      } else {
        maxRowValInView = Math.max(maxRowValInView, Math.min(ROW_CAP, it.remTotal), Math.min(ROW_CAP, it.stockTotal));
      }
    }
    // สเกลบาร์ต่อแถว (ความจุสูงสุด 100,000 ต่อแถว) โดยเผื่อพื้นที่ 32% ด้านหลังสำหรับตัวเลข
    const scaleMax = maxRowValInView > 0 ? (maxRowValInView * 1.32) : (ROW_CAP * 1.32);

    const sumRemTotal = list.reduce((s, x) => s + x.remTotal, 0);
    const sumRemIp = list.reduce((s, x) => s + x.remIp, 0);
    const sumRemC = list.reduce((s, x) => s + x.remC, 0);

    if (subEl) {
      let subText = '';
      if (total) {
        if (effectiveBudget === 'IP') {
          subText = `${total.toLocaleString('th-TH')} รายการพัสดุ - รวมค้างเบิก งบ I, P จำนวน ${formatQty(sumRemIp)}`;
        } else if (effectiveBudget === 'C') {
          subText = `${total.toLocaleString('th-TH')} รายการพัสดุ - รวมค้างเบิก งบ C จำนวน ${formatQty(sumRemC)}`;
        } else {
          subText = `${total.toLocaleString('th-TH')} รายการพัสดุ - รวมค้างเบิก จำนวน ${formatQty(sumRemTotal)}`;
          if (sumRemIp > 0 || sumRemC > 0) {
            subText += ` (งบ I,P: จำนวน ${formatQty(sumRemIp)} - งบ C: จำนวน ${formatQty(sumRemC)})`;
          }
        }
        if (total > shown.length) {
          subText += ` • แสดง ${shown.length.toLocaleString('th-TH')} อันดับแรก`;
        }
      }
      subEl.textContent = subText;
    }



    const sel = matState.chartSelDesc || '';
    const selBudget = matState.chartSelBudget || 'ALL';

    if (!shown.length) {
      const budgetName = effectiveBudget === 'IP' ? 'งบ I, P' : (effectiveBudget === 'C' ? 'งบ C' : '');
      body.innerHTML = `<div class="mat-hchart-empty">ไม่มีรายการพัสดุที่มีปริมาณค้างเบิก > 0${budgetName ? ' ใน' + budgetName : ''} ตามตัวกรองที่เลือก</div>`;
      return;
    }

    /**
     * สร้าง HTML แท่งกราฟแนวนอนแบบรองรับการตัดขึ้นแถวใหม่เมื่อเกิน 100,000 (ROW_CAP)
     * แต่ละแถวแสดงค่าไม่เกิน 100,000 หากเกินจะขึ้นแถวใหม่ทันที
     */
    function renderWrappedTracks(cfg) {
      const {
        type, // 'pending' or 'stock'
        budgetMode, // 'ALL', 'IP', 'C'
        valA, // amount for IP (remIp or stockIp)
        valB, // amount for C (remC or stockC)
        scaleMax,
        isRowSel,
        selBudget,
        safeAttr,
        plantListStr
      } = cfg;

      const ROW_CAP = 100000;
      const isPending = (type === 'pending');
      const trackCls = isPending ? 'mat-hchart-track track-pending' : 'mat-hchart-track track-green track-stock';
      const totalVal = (valA || 0) + (valB || 0);

      // กรณีไม่มีข้อมูล (0)
      if (totalVal <= 0.0005) {
        if (isPending) {
          return `<div class="${trackCls}" title="ปริมาณค้างเบิก: 0"><div class="mat-hchart-bar bar-zero" style="width:0%;"></div><div class="mat-hchart-val"><span style="color:rgba(255,255,255,0.35); font-size:0.68rem;">0</span></div></div>`;
        } else {
          return `<div class="${trackCls}" data-stock-slot="${safeAttr}" onclick="event.stopPropagation()" title="ปริมาณคงเหลือในคลัง = 0 (โรงงาน: ${plantListStr || '-'})"><div class="mat-hchart-bar bar-zero" style="width:0%;"></div><div class="mat-hchart-val"><span class="val-stock-zero">0</span></div></div>`;
        }
      }

      const numRows = Math.ceil(totalVal / ROW_CAP);
      let tracksHtml = '';

      const isIpActive = isRowSel && (selBudget === 'IP' || selBudget === 'ALL');
      const isCActive = isRowSel && (selBudget === 'C' || selBudget === 'ALL');
      const isIpDimmed = isRowSel && selBudget === 'C';
      const isCDimmed = isRowSel && selBudget === 'IP';

      const barAClass = isPending ? 'bar-red' : 'bar-darkgreen';
      const barBClass = isPending ? 'bar-orange' : 'bar-lightgreen';
      const valAClass = isPending ? 'val-red' : 'val-darkgreen';
      const valBClass = isPending ? 'val-orange' : 'val-lightgreen';
      const valTotalClass = isPending ? 'val-total' : 'val-stock-total';

      for (let rIdx = 0; rIdx < numRows; rIdx++) {
        const start = rIdx * ROW_CAP;
        const rowVal = Math.min(ROW_CAP, totalVal - start);
        const end = start + rowVal;

        // คำนวณส่วนของงบ A (I, P) และงบ B (C) ในแถวย่อยนี้
        const rowA = Math.max(0, Math.min(valA, end) - Math.min(valA, start));
        const rowB = Math.max(0, Math.min(totalVal, end) - Math.max(valA, start));

        const hasA = rowA > 0.0005;
        const hasB = rowB > 0.0005;

        let segsHtml = '';
        if (hasA && hasB) {
          const wA = (rowA / scaleMax) * 100;
          const wB = (rowB / scaleMax) * 100;
          const clsA = `${barAClass} bar-seg-first${isIpActive ? ' active-target' : ''}${isIpDimmed ? ' bar-dimmed' : ''}`;
          const clsB = `${barBClass} bar-seg-last${isCActive ? ' active-target' : ''}${isCDimmed ? ' bar-dimmed' : ''}`;
          const tipA = isPending ? `ค้างเบิก งบ I, P: ${formatQty(valA)} (แถวนี้: ${formatQty(rowA)})` : `คงเหลือ SLoc 0022 งบ I, P: ${formatQty(valA)} (แถวนี้: ${formatQty(rowA)}) — คลิกดู 6 คลัง`;
          const tipB = isPending ? `ค้างเบิก งบ C: ${formatQty(valB)} (แถวนี้: ${formatQty(rowB)})` : `คงเหลือ SLoc 0021 งบ C: ${formatQty(valB)} (แถวนี้: ${formatQty(rowB)}) — คลิกดู 6 คลัง`;
          segsHtml = `<div class="mat-hchart-bar ${clsA}" style="width:${wA.toFixed(2)}%;" onclick="window.selectMatChartItemWithBudget('${safeAttr}', 'IP', event)" title="${tipA}"></div>` +
            `<div class="mat-hchart-bar ${clsB}" style="width:${wB.toFixed(2)}%;" onclick="window.selectMatChartItemWithBudget('${safeAttr}', 'C', event)" title="${tipB}"></div>`;
        } else if (hasA) {
          const wA = Math.min(100, Math.max(0.6, (rowA / scaleMax) * 100));
          const clsA = `${barAClass}${isIpActive ? ' active-target' : ''}${isIpDimmed ? ' bar-dimmed' : ''}`;
          const tipA = isPending ? `ค้างเบิก งบ I, P: ${formatQty(valA)} (แถวนี้: ${formatQty(rowA)})` : `คงเหลือ SLoc 0022 งบ I, P: ${formatQty(valA)} (แถวนี้: ${formatQty(rowA)}) — คลิกดู 6 คลัง`;
          segsHtml = `<div class="mat-hchart-bar ${clsA}" style="width:${wA.toFixed(2)}%;" onclick="window.selectMatChartItemWithBudget('${safeAttr}', 'IP', event)" title="${tipA}"></div>`;
        } else if (hasB) {
          const wB = Math.min(100, Math.max(0.6, (rowB / scaleMax) * 100));
          const clsB = `${barBClass}${isCActive ? ' active-target' : ''}${isCDimmed ? ' bar-dimmed' : ''}`;
          const tipB = isPending ? `ค้างเบิก งบ C: ${formatQty(valB)} (แถวนี้: ${formatQty(rowB)})` : `คงเหลือ SLoc 0021 งบ C: ${formatQty(valB)} (แถวนี้: ${formatQty(rowB)}) — คลิกดู 6 คลัง`;
          segsHtml = `<div class="mat-hchart-bar ${clsB}" style="width:${wB.toFixed(2)}%;" onclick="window.selectMatChartItemWithBudget('${safeAttr}', 'C', event)" title="${tipB}"></div>`;
        }

        let valTextHtml = '';
        const isLastRow = (rIdx === numRows - 1);

        if (numRows === 1) {
          if (hasA && hasB) {
            valTextHtml = `<span class="${valAClass}" onclick="window.selectMatChartItemWithBudget('${safeAttr}', 'IP', event)" style="cursor:pointer;" title="งบ I, P">${formatQty(valA)}</span>` +
              `<span class="val-plus">+</span>` +
              `<span class="${valBClass}" onclick="window.selectMatChartItemWithBudget('${safeAttr}', 'C', event)" style="cursor:pointer;" title="งบ C">${formatQty(valB)}</span>` +
              `<span class="${valTotalClass}">(รวม ${formatQty(totalVal)})</span>`;
          } else if (hasA) {
            valTextHtml = `<span class="${valAClass}" onclick="window.selectMatChartItemWithBudget('${safeAttr}', 'IP', event)" style="cursor:pointer;" title="งบ I, P">${formatQty(valA)}</span>`;
          } else if (hasB) {
            valTextHtml = `<span class="${valBClass}" onclick="window.selectMatChartItemWithBudget('${safeAttr}', 'C', event)" style="cursor:pointer;" title="งบ C">${formatQty(valB)}</span>`;
          }
        } else {
          // หากเกิน 100,000 ขึ้นแถวใหม่
          if (!isLastRow) {
            if (hasA && hasB) {
              valTextHtml = `<span class="${valAClass}">${formatQty(rowA)}</span><span class="val-plus">+</span><span class="${valBClass}">${formatQty(rowB)}</span> <span style="color:rgba(255,255,255,0.45); font-size:0.65rem;">(แถว ${rIdx + 1}: ${formatQty(rowVal)})</span>`;
            } else if (hasA) {
              valTextHtml = `<span class="${valAClass}">${formatQty(rowA)}</span> <span style="color:rgba(255,255,255,0.45); font-size:0.65rem;">(แถว ${rIdx + 1}: ${formatQty(rowVal)})</span>`;
            } else if (hasB) {
              valTextHtml = `<span class="${valBClass}">${formatQty(rowB)}</span> <span style="color:rgba(255,255,255,0.45); font-size:0.65rem;">(แถว ${rIdx + 1}: ${formatQty(rowVal)})</span>`;
            }
          } else {
            // แถวสุดท้าย
            if (hasA && hasB) {
              valTextHtml = `<span class="${valAClass}">${formatQty(rowA)}</span><span class="val-plus">+</span><span class="${valBClass}">${formatQty(rowB)}</span> <span class="${valTotalClass}">(รวม ${formatQty(valA)} + ${formatQty(valB)} = ${formatQty(totalVal)})</span>`;
            } else if (hasA) {
              valTextHtml = `<span class="${valAClass}">${formatQty(rowA)}</span> <span class="${valTotalClass}">(รวมทั้งหมด ${formatQty(totalVal)})</span>`;
            } else if (hasB) {
              valTextHtml = `<span class="${valBClass}">${formatQty(rowB)}</span> <span class="${valTotalClass}">(รวมทั้งหมด ${formatQty(totalVal)})</span>`;
            }
          }
        }

        const rowTitle = isPending
          ? `ปริมาณค้างเบิก (แถวที่ ${rIdx + 1}/${numRows})`
          : `ปริมาณคงเหลือในคลัง (ไฟล์ 08: โรงงาน ${plantListStr || '-'}, แถวที่ ${rIdx + 1}/${numRows})`;
        const dataStockAttr = isPending ? '' : ` data-stock-slot="${safeAttr}" onclick="event.stopPropagation()"`;
        tracksHtml += `<div class="${trackCls}"${dataStockAttr} title="${rowTitle}">${segsHtml}<div class="mat-hchart-val">${valTextHtml}</div></div>`;
      }

      return tracksHtml;
    }

    const html = [];
    for (let i = 0; i < shown.length; i++) {
      const it = shown[i];
      const isRowSel = (sel === it.name || sel === it.code);
      const safeAttr = escapeHtml(it.name);
      const plantListStr = it.plants.size > 0 ? Array.from(it.plants).join(', ') : '-';

      let titleTip = `${safeAttr}`;
      if (effectiveBudget === 'IP') {
        titleTip += ` — ค้างเบิก งบ I, P: ${formatQty(it.remIp)} [คงคลัง SLoc 0022: ${formatQty(it.stockIp)}]`;
      } else if (effectiveBudget === 'C') {
        titleTip += ` — ค้างเบิก งบ C: ${formatQty(it.remC)} [คงคลัง SLoc 0021: ${formatQty(it.stockC)}]`;
      } else {
        titleTip += ` — รวมค้างเบิก จำนวน ${formatQty(it.remTotal)} [งบ I,P: จำนวน ${formatQty(it.remIp)} | งบ C: จำนวน ${formatQty(it.remC)}] [คงคลัง: รวม ${formatQty(it.stockTotal)} (งบ I,P: ${formatQty(it.stockIp)}, งบ C: ${formatQty(it.stockC)}) — โรงงาน: ${plantListStr}]`;
      }
      titleTip += ' (คลิกชื่อพัสดุเพื่อเลือกทุกงบ หรือคลิกแท่งสีเพื่อเลือกเฉพาะงบนั้น • แถบสีเขียวแสดงยอดคงคลัง • แต่ละแถวไม่เกิน 100,000 เกินขึ้นแถวใหม่)';

      const pendingTracksHtml = renderWrappedTracks({
        type: 'pending',
        budgetMode: effectiveBudget,
        valA: (effectiveBudget === 'C') ? 0 : it.remIp,
        valB: (effectiveBudget === 'IP') ? 0 : it.remC,
        scaleMax,
        isRowSel,
        selBudget,
        safeAttr,
        plantListStr
      });

      const stockTracksHtml = renderWrappedTracks({
        type: 'stock',
        budgetMode: effectiveBudget,
        valA: (effectiveBudget === 'C') ? 0 : it.stockIp,
        valB: (effectiveBudget === 'IP') ? 0 : it.stockC,
        scaleMax,
        isRowSel,
        selBudget,
        safeAttr,
        plantListStr
      });

      const nameCheck = isRowSel ? ' <span class="mat-hchart-check">✓</span>' : '';
      const nameCls = `mat-hchart-name${isRowSel ? ' selected-name active-target' : ''}`;

      html.push(
        `<div class="mat-hchart-row${isRowSel ? ' selected' : ''}${sel && !isRowSel ? ' dimmed' : ''}" data-mat="${safeAttr}" onclick="window.selectMatChartItemWithBudget(this.getAttribute('data-mat'), 'ALL', event)" title="${titleTip}">` +
        `<div class="mat-hchart-rank">${i + 1}</div>` +
        `<div class="${nameCls}" onclick="window.selectMatChartItemWithBudget('${safeAttr}', 'ALL', event)" title="คลิกเพื่อเลือกพัสดุนี้: ${safeAttr} (แสดงทุกงบ)">${escapeHtml(it.name)}${nameCheck}</div>` +
        `<div class="mat-hchart-bars">` +
        pendingTracksHtml +
        stockTracksHtml +
        `</div>` +
        `</div>`
      );
    }
    body.innerHTML = html.join('');
    if (scroll) scroll.scrollTop = prevTop;
    renderMatWarehouseSummary();
  }
  window.renderMatRemainChart = renderMatRemainChart;

  const MAT_WH_PLANTS = [
    { code: 'I010', name: 'คลังนครชัยศรี', basePending: 76943, baseStock: 611976 },
    { code: 'I020', name: 'คลังสุพรรณบุรี', basePending: 69993, baseStock: 354697 },
    { code: 'I030', name: 'คลังกาญจนบุรี', basePending: 47400, baseStock: 449791 },
    { code: 'I040', name: 'คลังสมุทรสาคร', basePending: 37650, baseStock: 380980 },
    { code: 'I050', name: 'คลังสามพราน', basePending: 9105, baseStock: 277977 },
    { code: 'I070', name: 'คลังท่ามะกา', basePending: 1544, baseStock: 223098 }
  ];

  window.setWhRowHover = function (code, isHover) {
    if (!code) return;
    const rows = document.querySelectorAll('.mat-wh-table tbody tr[data-wh="' + code + '"]');
    rows.forEach(r => {
      if (isHover) r.classList.add('hovered');
      else r.classList.remove('hovered');
    });
  };

  window.toggleMatPlantFilter = function (code) {
    if (!code) return;
    if (matState.filterPlant === code) {
      matState.filterPlant = '';
    } else {
      matState.filterPlant = code;
    }
    matState.cachedFilterKey = '';
    matState.page = 1;
    renderMaterialsTab();
    if (window.updateMatSubFilterCount) window.updateMatSubFilterCount();
  };

  function updateChartHighlightDom() {
    const selName = matState.chartSelDesc || '';
    const selBudget = matState.chartSelBudget || 'ALL';
    const rows = document.querySelectorAll('.mat-hchart-row');

    rows.forEach(r => {
      const matName = r.getAttribute('data-mat');
      const isMatch = (matName === selName);

      r.classList.toggle('selected', isMatch);
      r.classList.toggle('dimmed', !!selName && !isMatch);

      const nameEl = r.querySelector('.mat-hchart-name');
      if (nameEl) {
        nameEl.classList.toggle('selected-name', isMatch);
        nameEl.classList.toggle('active-target', isMatch);
        let chk = nameEl.querySelector('.mat-hchart-check');
        if (isMatch) {
          if (!chk) {
            chk = document.createElement('span');
            chk.className = 'mat-hchart-check';
            chk.textContent = ' ✓';
            nameEl.appendChild(chk);
          }
        } else {
          if (chk) chk.remove();
        }
      }

      const barRed = r.querySelector('.bar-red');
      const barOrange = r.querySelector('.bar-orange');
      const barDarkGreen = r.querySelector('.bar-darkgreen');
      const barLightGreen = r.querySelector('.bar-lightgreen');
      const valRed = r.querySelector('.val-red');
      const valOrange = r.querySelector('.val-orange');
      const valDarkGreen = r.querySelector('.val-darkgreen');
      const valLightGreen = r.querySelector('.val-lightgreen');

      if (barRed) {
        barRed.classList.toggle('active-target', isMatch && (selBudget === 'IP' || selBudget === 'ALL'));
        barRed.classList.toggle('bar-dimmed', isMatch && selBudget === 'C');
      }
      if (valRed) {
        valRed.classList.toggle('active-target', isMatch && (selBudget === 'IP' || selBudget === 'ALL'));
        valRed.classList.toggle('val-dimmed', isMatch && selBudget === 'C');
      }
      if (barOrange) {
        barOrange.classList.toggle('active-target', isMatch && (selBudget === 'C' || selBudget === 'ALL'));
        barOrange.classList.toggle('bar-dimmed', isMatch && selBudget === 'IP');
      }
      if (valOrange) {
        valOrange.classList.toggle('active-target', isMatch && (selBudget === 'C' || selBudget === 'ALL'));
        valOrange.classList.toggle('val-dimmed', isMatch && selBudget === 'IP');
      }
      if (barDarkGreen) {
        barDarkGreen.classList.toggle('active-target', isMatch && (selBudget === 'IP' || selBudget === 'ALL'));
        barDarkGreen.classList.toggle('bar-dimmed', isMatch && selBudget === 'C');
      }
      if (valDarkGreen) {
        valDarkGreen.classList.toggle('active-target', isMatch && (selBudget === 'IP' || selBudget === 'ALL'));
        valDarkGreen.classList.toggle('val-dimmed', isMatch && selBudget === 'C');
      }
      if (barLightGreen) {
        barLightGreen.classList.toggle('active-target', isMatch && (selBudget === 'C' || selBudget === 'ALL'));
        barLightGreen.classList.toggle('bar-dimmed', isMatch && selBudget === 'IP');
      }
      if (valLightGreen) {
        valLightGreen.classList.toggle('active-target', isMatch && (selBudget === 'C' || selBudget === 'ALL'));
        valLightGreen.classList.toggle('val-dimmed', isMatch && selBudget === 'IP');
      }
    });
  }

  function renderMatWarehouseSummary() {
    const colEl = document.getElementById('matWhWidgetCol');
    if (!colEl) return;

    const selPlant = matState.filterPlant || '';
    const selDesc = matState.chartSelDesc || '';
    const selBudget = matState.chartSelBudget || 'ALL';
    const agg = window._matLastChartAgg;
    const it = (selDesc && agg) ? agg.get(selDesc) : null;

    let pendingRowsHtml = '';
    let stockRowsHtml = '';
    let pendingSum = 0;
    let stockSum = 0;
    let pendingColTitle = 'ค้างเบิก';
    let stockColTitle = 'เหลือคลัง';
    let leftIndicatorHtml = '';
    let rightIndicatorHtml = '';
    let tfootPendingStyle = '';
    let tfootStockStyle = '';
    let barPendingFillStyle = '';
    let barStockFillStyle = '';
    let subBannerHtml = '';
    let headerBadgeHtml = '<span class="mat-wh-card-badge">6 คลัง</span>';
    let headerActionHtml = '';

    function renderWhCell(p) {
      return `<div class="mat-wh-cell-2rows">
        <span class="mat-wh-cell-code">${p.code}</span>
        <span class="mat-wh-cell-name">${escapeHtml(p.name)}</span>
      </div>`;
    }

    if (!it) {
      // โหมดปกติ: ภาพรวม 6 คลัง ผูกกับไฟล์ 03 WBS งานคงเหลือ และตัวกรองที่เลือกอยู่ทั้งหมด
      const wbsLinkedRows = getFilteredMaterialRows(false, true, true);
      const whPendingByPlant = {
        'I010': { remIp: 0, remC: 0, remTotal: 0 },
        'I020': { remIp: 0, remC: 0, remTotal: 0 },
        'I030': { remIp: 0, remC: 0, remTotal: 0 },
        'I040': { remIp: 0, remC: 0, remTotal: 0 },
        'I050': { remIp: 0, remC: 0, remTotal: 0 },
        'I070': { remIp: 0, remC: 0, remTotal: 0 }
      };

      for (let rIdx = 0; rIdx < wbsLinkedRows.length; rIdx++) {
        const r = wbsLinkedRows[rIdx];
        if (r.noMat) continue;
        const rem = Number(r.remainQty) || 0;
        if (rem <= 0.0005) continue;
        const pl = String(r.plant || '').trim().toUpperCase();
        const slot = whPendingByPlant[pl];
        if (!slot) continue;
        const isC = String(r.wbs || '').trim().toUpperCase().startsWith('C');
        if (isC) slot.remC += rem;
        else slot.remIp += rem;
        slot.remTotal += rem;
      }

      const activeBudget = (matState.chartSelBudget && matState.chartSelBudget !== 'ALL')
        ? matState.chartSelBudget
        : (matState.chartBudgetFilter || 'ALL');

      // คำนวณยอดคงเหลือคลัง (เหลือคลัง) แยกตามงบประมาณจากรายการพัสดุในกราฟ (SLoc 0022 สำหรับ งบ I,P และ SLoc 0021 สำหรับ งบ C)
      const whStockByPlant = {
        'I010': { stockIp: 0, stockC: 0, stockTotal: 0 },
        'I020': { stockIp: 0, stockC: 0, stockTotal: 0 },
        'I030': { stockIp: 0, stockC: 0, stockTotal: 0 },
        'I040': { stockIp: 0, stockC: 0, stockTotal: 0 },
        'I050': { stockIp: 0, stockC: 0, stockTotal: 0 },
        'I070': { stockIp: 0, stockC: 0, stockTotal: 0 }
      };
      if (agg) {
        for (const mItem of agg.values()) {
          const bp = mItem.byPlant || {};
          const hasIp = (mItem.remIp || 0) > 0.0005;
          const hasC = (mItem.remC || 0) > 0.0005;
          for (let i = 0; i < MAT_WH_PLANTS.length; i++) {
            const code = MAT_WH_PLANTS[i].code;
            const pData = bp[code];
            if (!pData) continue;
            if (hasIp) whStockByPlant[code].stockIp += (pData.stockIp || 0);
            if (hasC) whStockByPlant[code].stockC += (pData.stockC || 0);
            whStockByPlant[code].stockTotal += ((pData.stockIp || 0) + (pData.stockC || 0));
          }
        }
      }

      if (activeBudget === 'IP') {
        leftIndicatorHtml = '<span class="wh-ind-dot">🔴</span> <span class="wh-ind-text text-red">ค้างเบิก งบ I, P</span>';
        rightIndicatorHtml = '<span class="wh-ind-dot">🟢</span> <span class="wh-ind-text text-green">คงคลัง SLoc 0022</span>';
        tfootPendingStyle = 'background: linear-gradient(90deg, #991B1B 0%, #B91C1C 100%); color: #FFFFFF;';
        tfootStockStyle = 'background: linear-gradient(90deg, #10B981 0%, #059669 100%); color: #FFFFFF;';
      } else if (activeBudget === 'C') {
        leftIndicatorHtml = '<span class="wh-ind-dot">🟠</span> <span class="wh-ind-text text-orange">ค้างเบิก งบ C</span>';
        rightIndicatorHtml = '<span class="wh-ind-dot">🟢</span> <span class="wh-ind-text text-lightgreen">คงคลัง SLoc 0021</span>';
        tfootPendingStyle = 'background: linear-gradient(90deg, #EA580C 0%, #FB923C 100%); color: #FFFFFF; box-shadow: 0 0 8px rgba(251, 146, 60, 0.45);';
        tfootStockStyle = 'background: linear-gradient(90deg, #4ADE80 0%, #22C55E 100%); color: #064E3B;';
      } else {
        leftIndicatorHtml = '<span class="wh-ind-dot">🔴</span> <span class="wh-ind-text text-red">ค้างเบิกคลัง</span>';
        rightIndicatorHtml = '<span class="wh-ind-dot">🟢</span> <span class="wh-ind-text text-green">เหลือคลัง</span>';
      }

      // หากไม่ได้เลือกให้แสดง ไม่มีรายการที่เลือก (วงเหลือง)
      subBannerHtml = `
        <div class="mat-wh-selected-mat-box not-selected">
          <div class="mat-wh-selected-mat-title" title="ไม่มีรายการที่เลือก (แสดงยอดค้างเบิกและคงเหลือตามตัวกรองและงบประมาณที่เลือก)">
            <span class="mat-wh-mat-icon">🔍</span>
            <span class="mat-wh-mat-name">ไม่มีรายการที่เลือก</span>
          </div>
        </div>
      `;

      pendingSum = 0;
      stockSum = 0;
      for (let i = 0; i < MAT_WH_PLANTS.length; i++) {
        const p = MAT_WH_PLANTS[i];
        const pSlot = whPendingByPlant[p.code] || { remIp: 0, remC: 0, remTotal: 0 };
        const sSlot = whStockByPlant[p.code] || { stockIp: 0, stockC: 0, stockTotal: 0 };
        const pVal = activeBudget === 'IP' ? pSlot.remIp : (activeBudget === 'C' ? pSlot.remC : pSlot.remTotal);
        const sVal = activeBudget === 'IP' ? sSlot.stockIp : (activeBudget === 'C' ? sSlot.stockC : p.baseStock);
        pendingSum += pVal;
        stockSum += sVal;

        const isSel = (selPlant === p.code);
        const rowCls = isSel ? 'selected' : '';
        const tip = isSel ? `คลิกเพื่อยกเลิกการกรองคลัง ${p.code}` : `คลิกเพื่อกรองตารางเฉพาะ ${p.code} (${p.name}) — ค้างเบิก: ${formatQty(pVal)} | เหลือคลัง: ${formatQty(sVal)}`;
        const pValStyle = activeBudget === 'C' ? 'color:#FED7AA;' : (activeBudget === 'IP' ? 'color:#FCA5A5;' : '');
        const sValStyle = activeBudget === 'C' ? 'color:#86EFAC;' : (activeBudget === 'IP' ? 'color:#34D399;' : '');

        pendingRowsHtml += `
          <tr class="${rowCls}" data-wh="${p.code}" onclick="window.toggleMatPlantFilter('${p.code}')" onmouseenter="window.setWhRowHover('${p.code}', true)" onmouseleave="window.setWhRowHover('${p.code}', false)" title="${tip}">
            <td class="td-wh-code">${renderWhCell(p)}</td>
            <td class="td-wh-val" style="${pValStyle}">${formatQty(pVal)}</td>
          </tr>`;

        stockRowsHtml += `
          <tr class="${rowCls}" data-wh="${p.code}" onclick="window.toggleMatPlantFilter('${p.code}')" onmouseenter="window.setWhRowHover('${p.code}', true)" onmouseleave="window.setWhRowHover('${p.code}', false)" title="${tip}">
            <td class="td-wh-code">${renderWhCell(p)}</td>
            <td class="td-wh-val" style="${sValStyle}">${formatQty(sVal)}</td>
          </tr>`;
      }
    } else {
      // โหมดเลือกพัสดุจากกราฟแนวนอน / ตัวอักษร
      const bp = it.byPlant || {};
      headerBadgeHtml = `<span class="mat-wh-card-badge" style="color:#FDE047; font-size:0.70rem;">เฉพาะพัสดุ</span>`;
      headerActionHtml = '';

      // ข้อความชื่อพัสดุที่เลือกไว้ด้านบนแบบเต็ม แสดงครบถ้วนไม่ตัดคำ (วงเหลือง)
      subBannerHtml = `
        <div class="mat-wh-selected-mat-box">
          <div class="mat-wh-selected-mat-title" title="${escapeHtml(it.name)}">
            <span class="mat-wh-mat-icon">🔍</span>
            <span class="mat-wh-mat-name">${escapeHtml(it.name)}</span>
          </div>
        </div>
      `;

      if (selBudget === 'IP') {
        leftIndicatorHtml = '<span class="wh-ind-dot">🔴</span> <span class="wh-ind-text text-red">ค้างเบิก งบ I, P</span>';
        rightIndicatorHtml = '<span class="wh-ind-dot">🟢</span> <span class="wh-ind-text text-green">คงคลัง SLoc 0022</span>';
        pendingSum = it.remIp;
        stockSum = it.stockIp;
        tfootPendingStyle = 'background: linear-gradient(90deg, #991B1B 0%, #B91C1C 100%); color: #FFFFFF;';
        tfootStockStyle = 'background: linear-gradient(90deg, #10B981 0%, #059669 100%); color: #FFFFFF;';
        barPendingFillStyle = 'background: linear-gradient(90deg, #991B1B 0%, #B91C1C 100%);';
        barStockFillStyle = 'background: linear-gradient(90deg, #15803D 0%, #10B981 100%);';

        for (let i = 0; i < MAT_WH_PLANTS.length; i++) {
          const p = MAT_WH_PLANTS[i];
          const plantData = bp[p.code] || { remIp: 0, stockIp: 0 };
          const pVal = plantData.remIp || 0;
          const sVal = plantData.stockIp || 0;
          const isSel = (selPlant === p.code);
          const rowCls = isSel ? 'selected' : '';
          const tipP = `${p.code} ${p.name}: ค้างเบิก งบ I, P = ${formatQty(pVal)}`;
          const tipS = `${p.code} ${p.name}: คงเหลือ SLoc 0022 = ${formatQty(sVal)}`;

          pendingRowsHtml += `
            <tr class="${rowCls}" data-wh="${p.code}" onclick="window.toggleMatPlantFilter('${p.code}')" onmouseenter="window.setWhRowHover('${p.code}', true)" onmouseleave="window.setWhRowHover('${p.code}', false)" title="${tipP}">
              <td class="td-wh-code">${renderWhCell(p)}</td>
              <td class="td-wh-val" style="color:${pVal > 0 ? '#FCA5A5' : 'rgba(255,255,255,0.30)'}; font-weight:${pVal > 0 ? '800' : '500'};">${formatQty(pVal)}</td>
            </tr>`;

          stockRowsHtml += `
            <tr class="${rowCls}" data-wh="${p.code}" onclick="window.toggleMatPlantFilter('${p.code}')" onmouseenter="window.setWhRowHover('${p.code}', true)" onmouseleave="window.setWhRowHover('${p.code}', false)" title="${tipS}">
              <td class="td-wh-code">${renderWhCell(p)}</td>
              <td class="td-wh-val" style="color:${sVal > 0 ? '#34D399' : 'rgba(255,255,255,0.30)'}; font-weight:${sVal > 0 ? '800' : '500'};">${formatQty(sVal)}</td>
            </tr>`;
        }
      } else if (selBudget === 'C') {
        leftIndicatorHtml = '<span class="wh-ind-dot">🟠</span> <span class="wh-ind-text text-orange">ค้างเบิก งบ C</span>';
        rightIndicatorHtml = '<span class="wh-ind-dot">🟢</span> <span class="wh-ind-text text-lightgreen">คงคลัง SLoc 0021</span>';
        pendingSum = it.remC;
        stockSum = it.stockC;
        tfootPendingStyle = 'background: linear-gradient(90deg, #EA580C 0%, #FB923C 100%); color: #FFFFFF; box-shadow: 0 0 8px rgba(251, 146, 60, 0.45);';
        tfootStockStyle = 'background: linear-gradient(90deg, #4ADE80 0%, #22C55E 100%); color: #064E3B;';
        barPendingFillStyle = 'background: linear-gradient(90deg, #F97316 0%, #FDBA74 100%);';
        barStockFillStyle = 'background: linear-gradient(90deg, #4ADE80 0%, #86EFAC 100%);';

        for (let i = 0; i < MAT_WH_PLANTS.length; i++) {
          const p = MAT_WH_PLANTS[i];
          const plantData = bp[p.code] || { remC: 0, stockC: 0 };
          const pVal = plantData.remC || 0;
          const sVal = plantData.stockC || 0;
          const isSel = (selPlant === p.code);
          const rowCls = isSel ? 'selected' : '';
          const tipP = `${p.code} ${p.name}: ค้างเบิก งบ C = ${formatQty(pVal)}`;
          const tipS = `${p.code} ${p.name}: คงเหลือ SLoc 0021 = ${formatQty(sVal)}`;

          pendingRowsHtml += `
            <tr class="${rowCls}" data-wh="${p.code}" onclick="window.toggleMatPlantFilter('${p.code}')" onmouseenter="window.setWhRowHover('${p.code}', true)" onmouseleave="window.setWhRowHover('${p.code}', false)" title="${tipP}">
              <td class="td-wh-code">${renderWhCell(p)}</td>
              <td class="td-wh-val" style="color:${pVal > 0 ? '#FED7AA' : 'rgba(255,255,255,0.30)'}; text-shadow:${pVal > 0 ? '0 0 6px rgba(251, 146, 60, 0.45)' : 'none'}; font-weight:${pVal > 0 ? '800' : '500'};">${formatQty(pVal)}</td>
            </tr>`;

          stockRowsHtml += `
            <tr class="${rowCls}" data-wh="${p.code}" onclick="window.toggleMatPlantFilter('${p.code}')" onmouseenter="window.setWhRowHover('${p.code}', true)" onmouseleave="window.setWhRowHover('${p.code}', false)" title="${tipS}">
              <td class="td-wh-code">${renderWhCell(p)}</td>
              <td class="td-wh-val" style="color:${sVal > 0 ? '#86EFAC' : 'rgba(255,255,255,0.30)'}; font-weight:${sVal > 0 ? '800' : '500'};">${formatQty(sVal)}</td>
            </tr>`;
        }
      } else {
        // ข้อ 1: กดเลือก ตัวอักษร (แสดงทุกงบรวมกัน)
        leftIndicatorHtml = '<span class="wh-ind-dot">🟡</span> <span class="wh-ind-text text-yellow">ค้างเบิก (ทุกงบ)</span>';
        rightIndicatorHtml = '<span class="wh-ind-dot">🟢</span> <span class="wh-ind-text text-green">คงคลังรวม</span>';
        pendingSum = it.remTotal;
        stockSum = it.stockTotal;
        tfootPendingStyle = 'background: linear-gradient(90deg, #F59E0B 0%, #D97706 100%); color: #FFFFFF;';
        tfootStockStyle = 'background: linear-gradient(90deg, #10B981 0%, #059669 100%); color: #FFFFFF;';
        barPendingFillStyle = 'background: linear-gradient(90deg, #F59E0B 0%, #D97706 100%);';
        barStockFillStyle = 'background: linear-gradient(90deg, #10B981 0%, #059669 100%);';

        for (let i = 0; i < MAT_WH_PLANTS.length; i++) {
          const p = MAT_WH_PLANTS[i];
          const plantData = bp[p.code] || { remIp: 0, remC: 0, stockIp: 0, stockC: 0 };
          const pVal = (plantData.remIp || 0) + (plantData.remC || 0);
          const sVal = (plantData.stockIp || 0) + (plantData.stockC || 0);
          const isSel = (selPlant === p.code);
          const rowCls = isSel ? 'selected' : '';
          const tipP = `${p.code} ${p.name}: ค้างเบิกรวม = ${formatQty(pVal)}`;
          const tipS = `${p.code} ${p.name}: คงเหลือรวม = ${formatQty(sVal)}`;

          pendingRowsHtml += `
            <tr class="${rowCls}" data-wh="${p.code}" onclick="window.toggleMatPlantFilter('${p.code}')" onmouseenter="window.setWhRowHover('${p.code}', true)" onmouseleave="window.setWhRowHover('${p.code}', false)" title="${tipP}">
              <td class="td-wh-code">${renderWhCell(p)}</td>
              <td class="td-wh-val" style="color:${pVal > 0 ? '#FDE047' : 'rgba(255,255,255,0.30)'}; font-weight:${pVal > 0 ? '800' : '500'};">${formatQty(pVal)}</td>
            </tr>`;

          stockRowsHtml += `
            <tr class="${rowCls}" data-wh="${p.code}" onclick="window.toggleMatPlantFilter('${p.code}')" onmouseenter="window.setWhRowHover('${p.code}', true)" onmouseleave="window.setWhRowHover('${p.code}', false)" title="${tipS}">
              <td class="td-wh-code">${renderWhCell(p)}</td>
              <td class="td-wh-val" style="color:${sVal > 0 ? '#34D399' : 'rgba(255,255,255,0.30)'}; font-weight:${sVal > 0 ? '800' : '500'};">${formatQty(sVal)}</td>
            </tr>`;
        }
      }
    }

    const html = `
      <div class="mat-wh-widget-card" id="matWhWidgetCard">
        ${subBannerHtml}

        <!-- 2. ตารางคู่ซ้าย-ขวา (ค้างเบิกคลัง & เหลือคลัง) แถวตรงกัน 100% ตามรูป 72 -->
        <div class="mat-wh-tables-row">
          <!-- ตารางที่ 1: ค้างเบิกคลัง -->
          <div class="mat-wh-subbox box-pending">
            <div class="mat-wh-box-indicator ind-pending">
              ${leftIndicatorHtml}
            </div>
            <table class="mat-wh-table">
              <thead>
                <tr>
                  <th class="th-wh">คลัง <span class="wh-sort-arrow">▲</span></th>
                  <th class="th-val">${pendingColTitle}</th>
                </tr>
              </thead>
              <tbody id="matWhPendingTbody">
                ${pendingRowsHtml}
              </tbody>
              <tfoot>
                <tr class="tfoot-sum-pending" style="${tfootPendingStyle}" title="ผลรวม: ${formatQty(pendingSum)}">
                  <td class="td-sum-lbl">ผลรวม</td>
                  <td class="td-sum-val" id="matWhPendingTotal">${formatQty(pendingSum)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- ตารางที่ 2: เหลือคลัง -->
          <div class="mat-wh-subbox box-stock">
            <div class="mat-wh-box-indicator ind-stock">
              ${rightIndicatorHtml}
            </div>
            <table class="mat-wh-table">
              <thead>
                <tr>
                  <th class="th-wh">คลัง</th>
                  <th class="th-val">${stockColTitle}</th>
                </tr>
              </thead>
              <tbody id="matWhStockTbody">
                ${stockRowsHtml}
              </tbody>
              <tfoot>
                <tr class="tfoot-sum-stock" style="${tfootStockStyle}" title="ผลรวม: ${formatQty(stockSum)}">
                  <td class="td-sum-lbl">ผลรวม</td>
                  <td class="td-sum-val" id="matWhStockTotal">${formatQty(stockSum)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    `;

    colEl.innerHTML = html;

    // Update Head element if present
    const cardHeadEl = document.querySelector('#matWhStandaloneCard .mat-wh-card-head');
    if (cardHeadEl) {
      const badgeEl = cardHeadEl.querySelector('.mat-wh-card-badge');
      if (badgeEl) badgeEl.outerHTML = headerBadgeHtml;
      const actionsEl = cardHeadEl.querySelector('.mat-wh-card-actions');
      if (actionsEl) actionsEl.innerHTML = headerActionHtml;
    }
  }
  window.renderMatWarehouseSummary = renderMatWarehouseSummary;

  window.setMatChartBudgetFilter = function (mode) {
    const gf = getGlobalFilters();
    const critBudgetLock = getCriteriaBudgetLock(gf.crit);
    if (critBudgetLock) {
      // เมื่อเกณฑ์วัดล็อคงบไว้ ห้ามเปลี่ยนงบอื่นเด็ดขาด ("กดอะไรไม่ได้เลย")
      return;
    }
    mode = mode || 'ALL';
    if (matState.chartBudgetFilter === mode && mode !== 'ALL') {
      matState.chartBudgetFilter = 'ALL';
      matState.chartSelBudget = 'ALL';
    } else {
      matState.chartBudgetFilter = mode;
      matState.chartSelBudget = mode;
    }
    matState.cachedFilterKey = '';
    matState.page = 1;
    renderMaterialsTab();
  };

  /**
   * Unified selection for Material chart item and specific budget bar
   * One-way driver: updates horizontal chart highlight and warehouse card ONLY
   * Does NOT alter other cards or menus (Requirement 2 & 5)
   * @param {string} name - Material description or code
   * @param {string} budget - 'ALL' | 'IP' | 'C'
   * @param {Event} [e] - Mouse event to stop propagation
   */
  window.selectMatChartItemWithBudget = function (name, budget, e) {
    if (e) {
      if (e.stopPropagation) e.stopPropagation();
      if (e.preventDefault) e.preventDefault();
    }
    name = name || '';
    budget = budget || 'ALL';

    const gf = getGlobalFilters();
    const critBudgetLock = getCriteriaBudgetLock(gf.crit);
    if (critBudgetLock) {
      // เมื่อถูกล็อคตามเกณฑ์วัด บังคับใช้งบประมาณตามเกณฑ์วัดเสมอ ห้ามเปลี่ยนงบ
      budget = critBudgetLock;
    }

    // Toggle behavior:
    // If clicking exact same material AND exact same budget -> toggle off (clear selection)
    if (matState.chartSelDesc === name && (matState.chartSelBudget || 'ALL') === budget) {
      matState.chartSelDesc = '';
      matState.chartSelBudget = critBudgetLock || 'ALL';
    } else {
      matState.chartSelDesc = name;
      matState.chartSelBudget = budget;
    }

    matState.cachedFilterKey = '';
    matState.page = 1;
    renderMaterialsTab();
    updateMatSubFilterCount();
  };

  window.selectMatChartItem = function (name, e) {
    const gf = getGlobalFilters();
    const critBudgetLock = getCriteriaBudgetLock(gf.crit);
    window.selectMatChartItemWithBudget(name, critBudgetLock || 'ALL', e);
  };

  window.clearMatChartSelection = function () {
    const gf = getGlobalFilters();
    const critBudgetLock = getCriteriaBudgetLock(gf.crit);
    matState.chartSelDesc = '';
    matState.chartSelBudget = critBudgetLock || 'ALL';
    matState.chartBudgetFilter = critBudgetLock || 'ALL';
    matState.cachedFilterKey = '';
    matState.page = 1;
    const scrollEl = document.getElementById('matHChartScroll');
    if (scrollEl) scrollEl.scrollTop = 0;
    renderMaterialsTab();
    updateMatSubFilterCount();
  };

  function updateMatSubFilterCount() {
    const el = document.getElementById('matSubFilterCount');
    if (!el) return;
    const active = !!((matState.filterWbs || '').trim() || (matState.filterMatDesc || '').trim() || matState.sapStatuses.size > 0 || (matState.filterPlant || '').trim());
    if (!active) { el.textContent = ''; el.classList.remove('active'); return; }
    el.textContent = 'พบ ' + getFilteredMaterialRows().length.toLocaleString('th-TH') + ' รายการ';
    el.classList.add('active');
  }
  window.updateMatSubFilterCount = updateMatSubFilterCount;

  window.handleMatFilterWbsChange = function (val) {
    matState.filterWbs = (!val || val === 'ALL') ? '' : String(val).trim();
    // หากข้อความวัสดุที่เลือกไว้เดิมไม่อยู่ในงาน WBS นี้ (ตามโหมดวงเหลืองปัจจุบัน) ให้เคลียร์ข้อความวัสดุออก
    if (matState.filterWbs && matState.filterMatDesc) {
      const curMode = matState.hasMatFilter || 'HAS_MAT';
      const src = matState.allRows || [];
      const hasMatInWbs = src.some(r =>
        (curMode === 'HAS_MAT' ? !r.noMat : (curMode === 'NO_MAT' ? !!r.noMat : true)) &&
        (r.wbs || '').toLowerCase() === matState.filterWbs.toLowerCase() &&
        (r.matDesc || '').toLowerCase() === matState.filterMatDesc.toLowerCase()
      );
      if (!hasMatInWbs) matState.filterMatDesc = '';
    }
    matState.cachedFilterKey = '';
    matState._subOptKey = '';
    matState.page = 1;
    renderMaterialsTab();
    updateMatSubFilterCount();
  };

  window.clearMatFilterWbs = function () {
    matState.filterWbs = '';
    const sel = document.getElementById('matFilterWbs');
    if (sel) sel.value = 'ALL';
    if (window.syncMatWbsDropdown) window.syncMatWbsDropdown();
    matState.cachedFilterKey = '';
    matState._subOptKey = '';
    matState.page = 1;
    renderMaterialsTab();
    updateMatSubFilterCount();
  };

  window.handleMatFilterDescChange = function (val) {
    matState.filterMatDesc = (!val || val === 'ALL') ? '' : String(val).trim();
    // หากงาน WBS ที่เลือกไว้เดิมไม่มีข้อความวัสดุนี้ (ตามโหมดวงเหลืองปัจจุบัน) ให้เคลียร์งาน WBS ออก
    if (matState.filterWbs && matState.filterMatDesc) {
      const curMode = matState.hasMatFilter || 'HAS_MAT';
      const src = matState.allRows || [];
      const hasWbsWithMat = src.some(r =>
        (curMode === 'HAS_MAT' ? !r.noMat : (curMode === 'NO_MAT' ? !!r.noMat : true)) &&
        (r.wbs || '').toLowerCase() === matState.filterWbs.toLowerCase() &&
        (r.matDesc || '').toLowerCase() === matState.filterMatDesc.toLowerCase()
      );
      if (!hasWbsWithMat) matState.filterWbs = '';
    }
    matState.cachedFilterKey = '';
    matState._subOptKey = '';
    matState.page = 1;
    renderMaterialsTab();
    updateMatSubFilterCount();
  };

  // ===== ตัวกรองข้อความวัสดุแบบ Dropdown ที่มีช่องพิมพ์ค้นหาแถวบนสุด =====
  window.syncMatDescDropdown = function () {
    const sel = document.getElementById('matFilterMatDesc');
    const btn = document.getElementById('matFilterMatDescBtn');
    const txt = document.getElementById('matFilterMatDescBtnText');
    if (!sel || !btn || !txt) return;
    const opt = sel.options[sel.selectedIndex];
    txt.textContent = opt ? opt.textContent : '';
    btn.disabled = !!sel.disabled;
    btn.title = txt.textContent;
  };

  function closeMatDescDropdown() {
    const p = document.getElementById('matDescDropdownPanel');
    if (p) p.style.display = 'none';
    const w = document.getElementById('matWbsDropdownPanel');
    if (w) w.style.display = 'none';
  }
  window.closeMatDescDropdown = closeMatDescDropdown;

  // ===== ตัวกรอง WBS แบบ Dropdown มีช่องพิมพ์ค้นหา (สไตล์เดียวกับตัวกรองข้อความวัสดุ) =====
  window.syncMatWbsDropdown = function () {
    const sel = document.getElementById('matFilterWbs');
    const btn = document.getElementById('matFilterWbsBtn');
    const txt = document.getElementById('matFilterWbsBtnText');
    if (!sel || !btn || !txt) return;
    const opt = sel.options[sel.selectedIndex];
    txt.textContent = opt ? opt.textContent : '';
    btn.disabled = !!sel.disabled;
    btn.title = txt.textContent;
  };

  window.filterMatWbsDropdownList = function (q) {
    const sel = document.getElementById('matFilterWbs');
    const list = document.getElementById('matWbsDropdownList');
    const cnt = document.getElementById('matWbsDropdownCount');
    if (!sel || !list) return;
    const query = String(q || '').trim().toLowerCase();
    list.innerHTML = '';
    let shown = 0;
    for (let i = 0; i < sel.options.length; i++) {
      const o = sel.options[i];
      const isAll = o.value === 'ALL';
      if (query && (isAll || !o.textContent.toLowerCase().includes(query))) continue;
      const div = document.createElement('div');
      div.className = 'mat-desc-dd-item' + (o.value === sel.value ? ' is-selected' : '') + (isAll ? ' is-all' : '');
      div.textContent = o.textContent;
      div.dataset.val = o.value;
      div.onclick = function () {
        sel.value = this.dataset.val;
        closeMatDescDropdown();
        window.syncMatWbsDropdown();
        window.handleMatFilterWbsChange(sel.value);
      };
      list.appendChild(div);
      if (!isAll) shown++;
    }
    if (cnt) cnt.textContent = query ? `พบ ${shown.toLocaleString('th-TH')}` : '';
    if (!shown && query) {
      const e = document.createElement('div');
      e.className = 'mat-desc-dd-empty';
      e.textContent = 'ไม่พบ WBS ที่ค้นหา';
      list.appendChild(e);
    }
  };

  window.handleMatWbsSearchKey = function (e) {
    if (e.key === 'Escape') { closeMatDescDropdown(); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      const first = document.querySelector('#matWbsDropdownList .mat-desc-dd-item:not(.is-all)') ||
        document.querySelector('#matWbsDropdownList .mat-desc-dd-item');
      if (first) first.click();
    }
  };

  window.toggleMatWbsDropdown = function (e) {
    if (e) e.stopPropagation();
    const panel = document.getElementById('matWbsDropdownPanel');
    const sel = document.getElementById('matFilterWbs');
    if (!panel || !sel || sel.disabled) return;
    const wasOpen = panel.style.display === 'block';
    closeMatDescDropdown();
    const sap = document.getElementById('matSapThDropdownPanel');
    if (sap) sap.style.display = 'none';
    if (wasOpen) return;
    const inp = document.getElementById('matWbsDropdownSearch');
    if (inp) inp.value = '';
    window.filterMatWbsDropdownList('');
    panel.style.display = 'block';
    if (inp) inp.focus();
    const selEl = panel.querySelector('.mat-desc-dd-item.is-selected');
    if (selEl && selEl.scrollIntoView) selEl.scrollIntoView({ block: 'nearest' });
  };

  window.filterMatDescDropdownList = function (q) {
    const sel = document.getElementById('matFilterMatDesc');
    const list = document.getElementById('matDescDropdownList');
    const cnt = document.getElementById('matDescDropdownCount');
    if (!sel || !list) return;
    const query = String(q || '').trim().toLowerCase();
    list.innerHTML = '';
    let shown = 0;
    for (let i = 0; i < sel.options.length; i++) {
      const o = sel.options[i];
      const isAll = o.value === 'ALL';
      if (query && !isAll && !o.textContent.toLowerCase().includes(query)) continue;
      if (query && isAll) continue;
      const div = document.createElement('div');
      div.className = 'mat-desc-dd-item' + (o.value === sel.value ? ' is-selected' : '') + (isAll ? ' is-all' : '');
      div.textContent = o.textContent;
      div.dataset.val = o.value;
      div.onclick = function () {
        sel.value = this.dataset.val;
        closeMatDescDropdown();
        window.syncMatDescDropdown();
        window.handleMatFilterDescChange(sel.value);
      };
      list.appendChild(div);
      if (!isAll) shown++;
    }
    if (cnt) cnt.textContent = query ? `พบ ${shown.toLocaleString('th-TH')}` : '';
    if (!shown && query) {
      const e = document.createElement('div');
      e.className = 'mat-desc-dd-empty';
      e.textContent = 'ไม่พบข้อความวัสดุที่ค้นหา';
      list.appendChild(e);
    }
  };

  window.handleMatDescSearchKey = function (e) {
    if (e.key === 'Escape') { closeMatDescDropdown(); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      const first = document.querySelector('#matDescDropdownList .mat-desc-dd-item:not(.is-all)') ||
        document.querySelector('#matDescDropdownList .mat-desc-dd-item');
      if (first) first.click();
    }
  };

  window.toggleMatDescDropdown = function (e) {
    if (e) e.stopPropagation();
    const panel = document.getElementById('matDescDropdownPanel');
    const sel = document.getElementById('matFilterMatDesc');
    if (!panel || !sel || sel.disabled) return;
    if (panel.style.display === 'block') { panel.style.display = 'none'; return; }
    closeMatDescDropdown();
    const sap = document.getElementById('matSapThDropdownPanel');
    if (sap) sap.style.display = 'none';
    const inp = document.getElementById('matDescDropdownSearch');
    if (inp) inp.value = '';
    window.filterMatDescDropdownList('');
    panel.style.display = 'block';
    if (inp) inp.focus();
    const selEl = panel.querySelector('.mat-desc-dd-item.is-selected');
    if (selEl && selEl.scrollIntoView) selEl.scrollIntoView({ block: 'nearest' });
  };

  document.addEventListener('click', closeMatDescDropdown);

  window.clearMatFilterDesc = function () {
    matState.filterMatDesc = '';
    const sel = document.getElementById('matFilterMatDesc');
    if (sel) sel.value = 'ALL';
    window.syncMatDescDropdown();
    matState.cachedFilterKey = '';
    matState._subOptKey = '';
    matState.page = 1;
    renderMaterialsTab();
    updateMatSubFilterCount();
  };

  window.resetMatSubFilters = function () {
    matState.hasMatFilter = 'HAS_MAT';
    matState.filterWbs = '';
    matState.filterMatDesc = '';
    matState.filterSapStatus = 'ALL';
    matState.filterPlant = '';
    matState.sapStatuses.clear();
    matState.chartSelDesc = '';
    const gf = getGlobalFilters();
    const critBudgetLock = getCriteriaBudgetLock(gf.crit);
    matState.chartBudgetFilter = critBudgetLock || 'ALL';
    matState.chartSelBudget = critBudgetLock || 'ALL';
    const w = document.getElementById('matFilterWbs');
    if (w) w.value = 'ALL';
    const d = document.getElementById('matFilterMatDesc');
    if (d) { d.value = 'ALL'; d.disabled = false; }
    const s = document.getElementById('matFilterSapStatus');
    if (s) s.value = 'ALL';
    matState.cachedFilterKey = '';
    matState._subOptKey = '';
    matState.page = 1;
    renderMaterialsTab();
    updateMatSubFilterCount();
  };

  window.clearAllMatTableSelections = function () {
    matState.chartSelDesc = '';
    const gf = getGlobalFilters();
    const critBudgetLock = getCriteriaBudgetLock(gf.crit);
    matState.chartBudgetFilter = critBudgetLock || 'ALL';
    matState.chartSelBudget = critBudgetLock || 'ALL';
    matState.localSearch = '';
    matState.pendingMode = 'ALL';
    matState.mvtFilter = '281';
    matState.hasMatFilter = 'HAS_MAT';
    matState.filterPlant = '';
    matState.sapStatuses.clear();
    matState.sortCol = 'remainQty';
    matState.sortAsc = false;
    matState.page = 1;
    matState.cachedFilterKey = '';
    const inp = document.getElementById('matLocalSearchInput');
    if (inp) inp.value = '';
    renderMaterialsTab();
    if (window.showToast) window.showToast('ล้างตัวกรองย่อยในตารางรายการพัสดุเรียบร้อยแล้ว', 'info');
  };

  window.resetMatAllFilters = function () {
    if (typeof window.clearAllMatTableSelections === 'function') {
      window.clearAllMatTableSelections();
    }
    if (typeof window.resetMatSubFilters === 'function') {
      window.resetMatSubFilters();
    }
    if (typeof window.clearMatChartSelection === 'function') {
      window.clearMatChartSelection();
    }
  };

  const btnResetTopMat = document.getElementById('btnResetFilters');
  if (btnResetTopMat) {
    btnResetTopMat.addEventListener('click', () => {
      if (typeof window.resetMatAllFilters === 'function') {
        window.resetMatAllFilters();
      }
    });
  }

  // แสดง / ซ่อน สรุปจำนวนงาน WBS (การ์ด 3 บรรทัด วงแดง) ด้วยปุ่มลูกศรสีเหลือง
  window.toggleMatToolbarWbsStats = function () {
    matState.wbsStatsExpanded = !matState.wbsStatsExpanded;
    updateMatToolbarWbsStatsVisibility();
  };

  function updateMatToolbarWbsStatsVisibility() {
    const el = document.getElementById('matToolbarWbsStats');
    const btn = document.getElementById('btnMatStatsToggle');
    if (!el || !btn) return;
    const isExpanded = !!matState.wbsStatsExpanded;
    if (isExpanded) {
      el.classList.remove('is-collapsed');
      btn.classList.add('is-expanded');
      btn.setAttribute('title', 'คลิกเพื่อซ่อนสรุปงาน WBS (3 บรรทัด)');
      btn.innerHTML = `
        <svg class="mat-toggle-arrow-svg" width="16" height="16" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFB81C" stroke-width="1.5">
          <polygon points="6,4 18,12 6,20"></polygon>
        </svg>
      `;
    } else {
      el.classList.add('is-collapsed');
      btn.classList.remove('is-expanded');
      btn.setAttribute('title', 'คลิกเพื่อแสดงสรุปงาน WBS (รวม / พบพัสดุ / ไม่พบพัสดุ)');
      btn.innerHTML = `
        <svg class="mat-toggle-arrow-svg" width="16" height="16" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFB81C" stroke-width="1.5">
          <polygon points="18,4 6,12 18,20"></polygon>
        </svg>
      `;
    }
  }
  window.updateMatToolbarWbsStatsVisibility = updateMatToolbarWbsStatsVisibility;

  // Column Picker Dropdown Handlers
  window.toggleMatColDropdown = function (e) {
    if (e) e.stopPropagation();
    const panel = document.getElementById('matColDropdownPanel');
    if (!panel) return;
    const isOpening = panel.style.display === 'none' || !panel.style.display;
    panel.style.display = isOpening ? 'block' : 'none';
    if (isOpening) renderMatColDropdownList();
  };

  window.setMatColViewMode = function (mode) {
    matState.colViewMode = mode === 'group' ? 'group' : 'order';
    const bOrd = document.getElementById('btnMatModeOrder');
    const bGrp = document.getElementById('btnMatModeGroup');
    if (bOrd) bOrd.classList.toggle('active', matState.colViewMode === 'order');
    if (bGrp) bGrp.classList.toggle('active', matState.colViewMode === 'group');
    renderMatColDropdownList();
  };

  window.filterMatColCheckboxes = function (q) {
    matState.colSearchQuery = q || '';
    renderMatColDropdownList(matState.colSearchQuery);
  };

  window.toggleSingleMatCol = function (colId, checked) {
    matState.visibleColumns[colId] = !!checked;
    const anyVis = Object.values(matState.visibleColumns).some(Boolean);
    if (!anyVis) matState.visibleColumns[colId] = true;
    saveColumnPrefs();
    renderMaterialsTab();
  };

  window.toggleMatColGroup = function (grpId, checkAll) {
    MAT_COL_DEFS.forEach(c => {
      if (c.group === grpId) matState.visibleColumns[c.id] = !!checkAll;
    });
    if (!Object.values(matState.visibleColumns).some(Boolean)) {
      matState.visibleColumns['wbs'] = true;
      matState.visibleColumns['matCode'] = true;
    }
    saveColumnPrefs();
    renderMaterialsTab();
  };

  window.setAllMatCols = function (checked) {
    MAT_COL_DEFS.forEach(c => { matState.visibleColumns[c.id] = !!checked; });
    if (!checked) {
      matState.visibleColumns['rowNo'] = true;
      matState.visibleColumns['wbs'] = true;
      matState.visibleColumns['matCode'] = true;
      matState.visibleColumns['matDesc'] = true;
    }
    saveColumnPrefs();
    renderMaterialsTab();
  };

  window.setMatColsDefaultPreset = function () {
    MAT_COL_DEFS.forEach(c => { matState.visibleColumns[c.id] = !!c.defaultVisible; });
    matState.columnOrder = MAT_COL_DEFS.map(c => c.id);
    saveColumnPrefs();
    renderMaterialsTab();
    if (window.showToast) window.showToast('คืนค่าคอลัมน์เริ่มต้น (ไฟล์ 03 / 04 / 07) เรียบร้อยแล้ว', 'success');
  };

  window.moveMatColumnOrder = function (colId, dir, e) {
    if (e) e.stopPropagation();
    const idx = matState.columnOrder.indexOf(colId);
    if (idx < 0) return;
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= matState.columnOrder.length) return;
    const tmp = matState.columnOrder[idx];
    matState.columnOrder[idx] = matState.columnOrder[targetIdx];
    matState.columnOrder[targetIdx] = tmp;
    saveColumnPrefs();
    renderMaterialsTab();
  };

  // Drag & Drop Column Reordering (both in Column Picker and Table Header)
  window.handleMatColDragStart = function (e, colId) {
    matState.dragColId = colId;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', colId); } catch (err) { }
    }
  };

  window.handleMatColDragOver = function (e) {
    if (e) {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    }
  };

  window.handleMatColDragLeave = function () { };

  window.handleMatColDrop = function (e, targetColId) {
    if (e) e.preventDefault();
    const srcId = matState.dragColId;
    matState.dragColId = null;
    if (!srcId || !targetColId || srcId === targetColId) return;
    const fromIdx = matState.columnOrder.indexOf(srcId);
    const toIdx = matState.columnOrder.indexOf(targetColId);
    if (fromIdx < 0 || toIdx < 0) return;
    matState.columnOrder.splice(fromIdx, 1);
    matState.columnOrder.splice(toIdx, 0, srcId);
    saveColumnPrefs();
    renderMaterialsTab();
  };

  window.handleMatColDragEnd = function () {
    matState.dragColId = null;
  };

  // SAP Status Header Dropdown Handlers
  window.toggleMatSapDropdown = function (e, btnEl) {
    if (e) e.stopPropagation();
    const panel = document.getElementById('matSapThDropdownPanel');
    if (!panel) return;
    if (window.closeMatDescDropdown) window.closeMatDescDropdown();
    const isOpening = panel.style.display === 'none' || !panel.style.display;
    if (!isOpening) {
      panel.style.display = 'none';
      return;
    }
    renderMatSapThDropdownList();
    panel.style.display = 'block';
  };

  document.addEventListener('click', function () {
    const panel = document.getElementById('matSapThDropdownPanel');
    if (panel && panel.style.display === 'block') panel.style.display = 'none';
  });

  function updateMatSfSapBtn() {
    const t = document.getElementById('matSfSapBtnText');
    const b = document.getElementById('matSfSapBtn');
    if (!t) return;
    const cnt = matState.sapStatuses.size;
    const avail = matState._availableSapCount || 0;
    const allLabel = avail > 0 ? `ทั้งหมด (${avail} สถานะ)` : 'ทั้งหมด';
    t.textContent = cnt === 0 ? allLabel : (cnt === 1 ? Array.from(matState.sapStatuses)[0] : `เลือก ${cnt}${avail > 0 ? '/' + avail : ''} สถานะ`);
    if (b) b.classList.toggle('active', cnt > 0);
  }
  window.updateMatSfSapBtn = updateMatSfSapBtn;

  window.toggleMatSapStatusItem = function (st, checked) {
    if (checked) {
      matState.sapStatuses.add(st);
    } else {
      matState.sapStatuses.delete(st);
    }

    // หากเลือกครบทุกสถานะ ให้รีเซ็ตเป็นแสดงทั้งหมดอัตโนมัติ
    const baseRows = getFilteredMaterialRows(true);
    const allStSet = new Set();
    for (let i = 0; i < baseRows.length; i++) {
      allStSet.add(baseRows[i].sapShort || '(ไม่ระบุ)');
    }
    if (allStSet.size > 0 && matState.sapStatuses.size >= allStSet.size) {
      matState.sapStatuses.clear();
    }

    matState.cachedFilterKey = '';
    matState.page = 1;
    updateMatSfSapBtn();
    renderMatSapThDropdownList();
    renderMaterialsTab();
    updateMatSubFilterCount();
  };

  window.clearMatSapFilter = function (e) {
    if (e) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }
    matState.sapStatuses.clear();
    matState.cachedFilterKey = '';
    matState.page = 1;
    updateMatSfSapBtn();
    renderMatSapThDropdownList();
    renderMaterialsTab();
    updateMatSubFilterCount();
  };

  // Export CSV (exports currently filtered rows & visible columns with UTF-8 BOM)
  window.exportMaterialsToCsv = function () {
    const rows = getFilteredMaterialRows(false);
    if (!rows.length) {
      if (window.showToast) window.showToast('ไม่มีข้อมูลสำหรับส่งออกตามตัวกรองปัจจุบัน', 'warning');
      return;
    }
    const gf = getGlobalFilters();
    const visibleCols = getOrderedMatColDefs().filter(c => matState.visibleColumns[c.id]);
    const csvEscape = (v) => {
      const s = v === null || v === undefined ? '' : String(v);
      return (s.includes(',') || s.includes('"') || s.includes('\n'))
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const lines = [];
    lines.push(visibleCols.map(c => csvEscape(c.label)).join(','));

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const cells = visibleCols.map(col => {
        if (col.id === 'rowNo') return i + 1;
        if (col.isPercent) {
          const rawP = Number(getFieldVal(r, col.id, gf.crit)) || 0;
          const pct = (Math.abs(rawP) <= 1.0 && rawP !== 0) ? (rawP * 100) : rawP;
          return pct.toFixed(2) + '%';
        }
        return csvEscape(getFieldVal(r, col.id, gf.crit));
      });
      lines.push(cells.join(','));
    }

    const bom = '\uFEFF';
    const blob = new Blob([bom + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    a.href = url;
    a.download = `PEA_AUC_รายการพัสดุ_07CN52N_${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (window.showToast) window.showToast(`ส่งออกไฟล์ CSV เรียบร้อยแล้ว (${rows.length.toLocaleString('th-TH')} รายการ)`, 'success');
  };

  // Close popovers when clicking outside
  document.addEventListener('click', (e) => {
    const colWrap = document.getElementById('matColDropdownWrap');
    const colPanel = document.getElementById('matColDropdownPanel');
    if (colPanel && colPanel.style.display === 'block' && colWrap && !colWrap.contains(e.target)) {
      colPanel.style.display = 'none';
    }
    const sapPanel = document.getElementById('matSapThDropdownPanel');
    if (sapPanel && sapPanel.style.display === 'block' && !sapPanel.contains(e.target) && !e.target.closest('.th-sap-dropdown-btn')) {
      sapPanel.style.display = 'none';
    }
  });

  // Initialize preferences & badge during browser idle time so startup paint is not blocked by 75k-row hydration
  initColumnPrefs();
  const scheduleMatBadgeInit = () => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => updateMaterialsNavBadge(), { timeout: 900 });
    } else {
      setTimeout(updateMaterialsNavBadge, 450);
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleMatBadgeInit);
  } else {
    scheduleMatBadgeInit();
  }
})();
