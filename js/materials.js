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
    chartSelDesc: '',
    chartBudgetFilter: 'ALL', // 'ALL' | 'IP' | 'C' (เลือกแสดงตามงบ I,P หรือ C หรือ ทั้ง 2 งบ)
    chartSelBudget: 'ALL',    // 'ALL' | 'IP' | 'C' (งบประมาณที่เลือกจากการคลิกแท่งกราฟโดยตรง)
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

      joined.push({
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
        priceLocal: Number(t[13]) || 0
      });
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
   */
  function getFilteredMaterialRows(skipTableSap = false, ignoreChartSel = false) {
    if (!ensureMaterialsHydrated()) return [];

    const gf = getGlobalFilters();
    const sapKey = skipTableSap ? 'SKIP_SAP' : Array.from(matState.sapStatuses).sort().join('|');
    const cacheKey = [
      gf.crit, gf.prov, gf.off, gf.search,
      matState.localSearch, matState.pendingMode, matState.mvtFilter, matState.hasMatFilter,
      matState.filterWbs, matState.filterMatDesc, matState.filterSapStatus, matState.chartSelDesc,
      matState.chartBudgetFilter, (matState.chartSelBudget || 'ALL'),
      sapKey, matState.sortCol, matState.sortAsc ? '1' : '0'
    ].join('§');

    if (!skipTableSap && !ignoreChartSel && matState.cachedFilterKey === cacheKey) {
      return matState.cachedFilteredRows;
    }

    const chartSel = ignoreChartSel ? '' : (matState.chartSelDesc || '');
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
      if (hasSapF && !matState.sapStatuses.has(r.sapShort || '(ไม่ระบุ)')) continue;

      // ตัวกรองจากการคลิกกราฟแนวนอน (ทางเดียว: กราฟ → ตาราง)
      if (chartSel && (r.noMat || (r.matDesc || r.matCode || '') !== chartSel)) continue;

      // ตัวกรองประเภทงบประมาณที่เลือกจากกราฟ (C = งบ C, IP = งบ I, P อ้างอิงตามกราฟ หรือแท่งกราฟที่คลิกเลือก)
      const effectiveBudget = (matState.chartSelBudget && matState.chartSelBudget !== 'ALL')
        ? matState.chartSelBudget
        : matState.chartBudgetFilter;
      if (!ignoreChartSel && effectiveBudget && effectiveBudget !== 'ALL') {
        const w = String(r.wbs || '').trim().toUpperCase();
        if (effectiveBudget === 'C' && !w.startsWith('C')) continue;
        if (effectiveBudget === 'IP' && !w.startsWith('I') && !w.startsWith('P')) continue;
      }
      // ตัวกรองย่อยเฉพาะหน้าเมนูรายการพัสดุ (WBS / ข้อความวัสดุ / สถานะ SAP)
      if (subWbsQ && subWbsQ !== 'all' && (r.wbs || '').toLowerCase() !== subWbsQ) continue;
      if (subDescQ && subDescQ !== 'all' && (r.matDesc || '').toLowerCase() !== subDescQ) continue;
      if (subSap !== 'ALL') {
        const sShort = String(r.sapShort || '').toUpperCase();
        if (subSap === '(ไม่ระบุ)') { if (sShort) continue; }
        else if (sShort !== subSap && !sShort.startsWith(subSap + ' ')) continue;
      }

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

      // บันทึกสถิติงานทั้งหมดที่ผ่านตัวกรอง (ก่อนแยกมี/ไม่มีพัสดุ)
      scopeWbsSet.add(r.wbs);
      if (r.noMat) scopeNoMatSet.add(r.wbs);
      else scopeWithMatSet.add(r.wbs);

      // กรองตามปุ่มเลือก มี/ไม่มีพัสดุ (Default: มีพัสดุ 'HAS_MAT')
      if (matState.hasMatFilter === 'HAS_MAT' && r.noMat) continue;
      if (matState.hasMatFilter === 'NO_MAT' && !r.noMat) continue;

      out.push(r);
    }

    if (!skipTableSap && !ignoreChartSel) {
      let scope03RowCount = 0;
      const baseWbsData = window.AUC_WBS_REMAINING_DATA || [];
      for (let i = 0; i < baseWbsData.length; i++) {
        const b = baseWbsData[i];
        if (hasCritFilter && !matchesCriteria(b.criteria, filterCrit)) continue;
        if (hasProvFilter && b.province !== gf.prov) continue;
        if (hasOffFilter && b.office !== gf.off) continue;
        const effectiveBudget = (matState.chartSelBudget && matState.chartSelBudget !== 'ALL')
          ? matState.chartSelBudget
          : matState.chartBudgetFilter;
        if (effectiveBudget && effectiveBudget !== 'ALL') {
          const bw = String(b.wbs || '').trim().toUpperCase();
          if (effectiveBudget === 'C' && !bw.startsWith('C')) continue;
          if (effectiveBudget === 'IP' && !bw.startsWith('I') && !bw.startsWith('P')) continue;
        }
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
    if (!skipTableSap && !ignoreChartSel) {
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

    pane.innerHTML = `
      <!-- แถบสรุปภาพรวมรายการพัสดุค้างเบิก (ไฟล์ 07 เชื่อมไฟล์ 03 WBS และไฟล์ 04 ZBUDR064) -->
      <!-- ตัวกรองย่อยเฉพาะเมนูรายการพัสดุ: WBS / ข้อความวัสดุ / สถานะ SAP -->
      <div class="mat-sub-filter-bar" id="matSubFilterBar">
        <div class="mat-sf-title">🔎 ตัวกรองรายการพัสดุ</div>
        <div class="mat-sf-group">
          <span class="mat-sf-label">WBS</span>
          <select id="matFilterWbs" class="mat-sf-select" onchange="window.handleMatFilterWbsChange(this.value)">
            <option value="ALL">-- แสดง WBS ทั้งหมด --</option>
          </select>
          <button type="button" class="mat-sf-clear-btn" id="matClearWbsBtn" onclick="window.clearMatFilterWbs()" title="ล้างตัวกรอง WBS นี้" style="display:none;">✕</button>
        </div>
        <div class="mat-sf-group">
          <span class="mat-sf-label">ข้อความวัสดุ</span>
          <select id="matFilterMatDesc" class="mat-sf-select" onchange="window.handleMatFilterDescChange(this.value)">
            <option value="ALL">-- แสดงข้อความวัสดุทั้งหมด --</option>
          </select>
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
        <button type="button" class="mat-sf-reset" onclick="window.resetMatSubFilters()">🔄 ล้างตัวกรอง</button>
        <span class="mat-sf-count" id="matSubFilterCount"></span>
        <!-- สรุปจำนวนงาน WBS และสถานะพัสดุ (แสดงด้านหลังปุ่มล้างตัวกรอง เป็น 3 บรรทัด แคบๆ พอดี ตามคำสั่ง) -->
        <div class="mat-sf-wbs-stats mat-sf-wbs-stats-3rows" id="matToolbarWbsStats"></div>
      </div>

      <!-- กราฟแนวนอน: ปริมาณค้างเบิกตามข้อความวัสดุ (ลิงก์กับตัวกรองทั้งหมด / คลิกเพื่อกรองตารางทางเดียว) -->
      <div class="mat-hchart-card" id="matHChartCard">
        <div class="mat-hchart-head">
          <div class="mat-hchart-title">
            <span class="mat-hchart-ico">📊</span>
            <span>ปริมาณค้างเบิก แยกตามข้อความวัสดุ</span>
            <span class="mat-hchart-sub" id="matHChartSub"></span>
          </div>
          <div class="mat-hchart-legend" id="matHChartLegendContainer">
            <div class="mat-budget-pill-group" role="group" aria-label="เลือกแสดงตามงบ">
              <button type="button" class="mat-budget-pill pill-red in-both" onclick="window.setMatChartBudgetFilter('IP')" title="คลิกเพื่อเลือกแสดงเฉพาะ งบ I, P (สีแดง)"><i class="lg-dot lg-red"></i> ค้างเบิก งบ I, P (สีแดง)</button>
              <button type="button" class="mat-budget-pill pill-orange in-both" onclick="window.setMatChartBudgetFilter('C')" title="คลิกเพื่อเลือกแสดงเฉพาะ งบ C (สีส้มพาสเทล)"><i class="lg-dot lg-orange"></i> ค้างเบิก งบ C (สีส้มพาสเทล)</button>
            </div>
            <span class="mat-hchart-lg" title="เนเธเธฅเน 08 เธเธฅเธฑเธ SLoc 0022 เธเธฃเธดเธกเธฒเธ“เธเธเน€เธซเธฅเธทเธญเธเธเธเธฅเธฑเธเธเธ I,P (เธชเธตเธเธฃเธฒเธเน€เธเธตเธขเธงเน€เธเนเธก)"><i class="lg-dot" style="background:#15803D; box-shadow:0 0 6px rgba(21,128,61,0.8);"></i> <span style="color:#86EFAC;">เธเธเน€เธซเธฅเธทเธญ SLoc 0022 เธเธ I,P (เน€เธเธตเธขเธงเน€เธเนเธก)</span></span>
            <span class="mat-hchart-lg" title="เนเธเธฅเน 08 เธเธฅเธฑเธ SLoc 0021 เธเธฃเธดเธกเธฒเธ“เธเธเน€เธซเธฅเธทเธญเธเธเธเธฅเธฑเธเธเธ C (เธชเธตเธเธฃเธฒเธเน€เธเธตเธขเธงเธญเนเธญเธ)"><i class="lg-dot" style="background:#4ADE80; box-shadow:0 0 6px rgba(74,222,128,0.8);"></i> <span style="color:#BBF7D0;">เธเธเน€เธซเธฅเธทเธญ SLoc 0021 เธเธ C (เน€เธเธตเธขเธงเธญเนเธญเธ)</span></span>
          </div>
        </div>
        <div class="mat-hchart-scroll" id="matHChartScroll">
          <div class="mat-hchart-body" id="matHChartBody"></div>
        </div>
      </div>

      <div class="mat-kpi-summary-grid" id="matKpiSummaryGrid" style="display:none !important; grid-template-columns:repeat(auto-fit, minmax(225px, 1fr)); gap:0.75rem; margin-bottom:0.85rem;">
        <div class="content-card" style="padding:0.85rem 1.05rem; margin-bottom:0; border-left:3px solid #38BDF8;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem; gap:0.35rem; flex-wrap:wrap;">
            <span style="font-size:0.78rem; color:var(--text-muted); font-weight:600;">📦 รายการพัสดุ Mvt 281 (เชื่อม WBS ไฟล์ 03)</span>
            <span class="wbs-pill pill-file" style="font-size:0.68rem; padding:1px 7px; background:rgba(14,165,233,0.18); color:#7DD3FC; border:1px solid rgba(56,189,248,0.35);">07 CN52N: 30 ต.ค. 69</span>
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
            <span style="font-size:0.68rem; color:#D8B4FE;">SAP 04: 30 ต.ค. 69</span>
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
          <div style="display:flex; align-items:center; gap:0.55rem; flex-wrap:wrap;">
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

            <button type="button" class="btn-return-main-screen" id="btnMatReturnNormalScreen"
              onclick="if(window.returnToNormalScreen)window.returnToNormalScreen();else window.toggleTableFullscreen(this);" title="กดเพื่อคืนหน้าจอปกติ">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
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
   */
  function renderMatSapThDropdownList() {
    const listEl = document.getElementById('matSapThDropdownList');
    const summaryEl = document.getElementById('matSapDropdownSummaryText');
    if (!listEl) return;

    const baseRows = getFilteredMaterialRows(true);
    const counts = {};
    for (let i = 0; i < baseRows.length; i++) {
      const st = baseRows[i].sapShort || '(ไม่ระบุ)';
      counts[st] = (counts[st] || 0) + 1;
    }

    const keys = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    const hasFilter = matState.sapStatuses.size > 0;
    const isAllSelected = !hasFilter;

    let html = `
      <div class="sap-dropdown-actions-row" style="padding:0.25rem 0.35rem 0.35rem; border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:0.35rem;">
        <label class="sap-dropdown-item sap-dropdown-item-all ${isAllSelected ? 'is-selected' : ''}"
               onclick="window.clearMatSapFilter(event)"
               style="display:flex; align-items:center; padding:0.35rem 0.55rem; cursor:pointer; border-radius:6px; gap:0.5rem; background:${isAllSelected ? 'rgba(255,184,28,0.18)' : 'rgba(255,255,255,0.04)'}; border:1px solid ${isAllSelected ? 'rgba(255,184,28,0.45)' : 'transparent'};">
          <input type="checkbox" ${isAllSelected ? 'checked' : ''} onclick="event.stopPropagation(); window.clearMatSapFilter(event);" style="cursor:pointer; accent-color:#FFB81C;">
          <span style="font-weight:700; color:${isAllSelected ? '#FFE58F' : 'var(--text-main)'}; font-size:0.82rem;">แสดงทั้งหมด</span>
        </label>
      </div>
    `;
    keys.forEach(st => {
      const isSelectedExplicit = matState.sapStatuses.has(st);
      html += `
        <label class="sap-dropdown-item ${isSelectedExplicit ? 'is-selected' : ''}" style="display:flex; align-items:center; padding:0.32rem 0.55rem; cursor:pointer; border-radius:6px; gap:0.5rem;">
          <input type="checkbox" ${isSelectedExplicit ? 'checked' : ''} onchange="window.toggleMatSapStatusItem('${escapeHtml(st)}', this.checked)" style="cursor:pointer;">
          <span class="badge-sap ${getSapBadgeClass(st)}" style="font-size:0.72rem; padding:1px 7px;">${escapeHtml(st)}</span>
        </label>
      `;
    });

    listEl.innerHTML = html;
    if (summaryEl) {
      if (hasFilter) {
        summaryEl.innerHTML = `<button type="button" class="btn-col-link" onclick="window.clearMatSapFilter(event)" style="cursor:pointer; color:#FBBF24; font-weight:700;">🔄 แสดงทั้งหมด</button>`;
      } else {
        summaryEl.innerHTML = `<span style="color:var(--pea-gold-400); font-weight:700;">✔ แสดงทั้งหมด</span>`;
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
    const rows = getFilteredMaterialRows(false);
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
      const effectiveSelBudget = (matState.chartSelBudget && matState.chartSelBudget !== 'ALL')
        ? matState.chartSelBudget
        : matState.chartBudgetFilter;
      const budgetExtra = (effectiveSelBudget === 'C')
        ? ' • 🟠 งบ C (ส้มพาสเทล)'
        : ((effectiveSelBudget === 'IP') ? ' • 🔴 งบ I, P (สีแดง)' : '');
      const chartSelExtra = matState.chartSelDesc ? ` • 📦 พัสดุ: ${matState.chartSelDesc}` : '';
      critValEl.textContent = `${critLabel} (${totalWbsNum.toLocaleString('th-TH')} งาน${rowsExtra} • ${agg.totalRows.toLocaleString('th-TH')} รายการพัสดุ)${budgetExtra}${chartSelExtra}`;

      if (clearChartBtn) {
        clearChartBtn.style.display = (matState.chartSelDesc || (matState.chartSelBudget && matState.chartSelBudget !== 'ALL'))
          ? 'inline-flex'
          : 'none';
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
      const rowsExtra = (sc.total03Rows && sc.total03Rows > sc.uniqueWbs)
        ? ` <span class="scope-btn-extra">(${sc.total03Rows.toLocaleString('th-TH')})</span>`
        : '';
      tbStatsEl.innerHTML = `
        <button type="button" class="mat-scope-btn btn-scope-all ${curMode === 'ALL' ? 'active' : ''}"
          onclick="window.setMatHasMatFilter('ALL')" title="คลิกเพื่อแสดงทุกงาน: ${sc.uniqueWbs.toLocaleString('th-TH')} งาน (จากทั้งหมด ${sc.total03Rows.toLocaleString('th-TH')} งานในไฟล์ 03)">
          <span class="scope-btn-label"><span class="scope-btn-icon">📁</span> รวม</span>
          <span class="scope-btn-val"><strong>${sc.uniqueWbs.toLocaleString('th-TH')}</strong> งาน${rowsExtra}</span>
          ${curMode === 'ALL' ? '<span class="scope-btn-check">✓</span>' : ''}
        </button>
        <button type="button" class="mat-scope-btn btn-scope-hasmat ${curMode === 'HAS_MAT' ? 'active' : ''}"
          onclick="window.setMatHasMatFilter('HAS_MAT')" title="คลิกเพื่อแสดงเฉพาะงานที่มีพัสดุ (Default)">
          <span class="scope-btn-label"><span class="scope-btn-icon">✓</span> พัสดุ</span>
          <span class="scope-btn-val"><strong>${sc.withMatWbs.toLocaleString('th-TH')}</strong> งาน</span>
          ${curMode === 'HAS_MAT' ? '<span class="scope-btn-check">✓</span>' : ''}
        </button>
        <button type="button" class="mat-scope-btn btn-scope-nomat ${curMode === 'NO_MAT' ? 'active' : ''}"
          onclick="window.setMatHasMatFilter('NO_MAT')" title="คลิกเพื่อแสดงเฉพาะงานที่ไม่พบพัสดุ">
          <span class="scope-btn-label"><span class="scope-btn-icon">⚠️</span> ไม่พบพัสดุ</span>
          <span class="scope-btn-val"><strong>${sc.noMatWbs.toLocaleString('th-TH')}</strong> งาน</span>
          ${curMode === 'NO_MAT' ? '<span class="scope-btn-check">✓</span>' : ''}
        </button>`;
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
          subDateHtml = `<div class="th-sub-date-text" style="font-size:0.69rem; color:#CBD5E1; font-weight:500; line-height:1.2; margin:1px 0 3px 0; text-align:center; white-space:nowrap;">แก้ไขล่าสุด: 30 ต.ค. 69</div>`;
        } else if (col.id === 'matCode') {
          subDateHtml = `<div class="th-sub-date-text" style="font-size:0.69rem; color:#7DD3FC; font-weight:500; line-height:1.2; margin:1px 0 3px 0; white-space:nowrap;">ไฟล์ 07: 30 ต.ค. 69 07:57 น.</div>`;
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
      infoEl.textContent = rows.length === 0
        ? 'ไม่พบรายการ (0 รายการ)'
        : `แสดง ${(startIdx + 1).toLocaleString('th-TH')} - ${endIdx.toLocaleString('th-TH')} จากทั้งหมด ${rows.length.toLocaleString('th-TH')} รายการ (หน้า ${matState.page.toLocaleString('th-TH')}/${totalPages.toLocaleString('th-TH')})`;
    }

    const ctrlEl = document.getElementById('matPaginationControls');
    if (ctrlEl) {
      let pHtml = '';
      const mkBtn = (lbl, targetPage, disabled, active) =>
        `<button type="button" class="btn-page ${active ? 'active' : ''}" ${disabled ? 'disabled' : ''} onclick="window.goToMatPage(${targetPage})">${lbl}</button>`;

      pHtml += mkBtn('« ก่อนหน้า', matState.page - 1, matState.page <= 1, false);

      const pagesToShow = [];
      pagesToShow.push(1);
      for (let p = Math.max(2, matState.page - 2); p <= Math.min(totalPages - 1, matState.page + 2); p++) {
        pagesToShow.push(p);
      }
      if (totalPages > 1) pagesToShow.push(totalPages);

      let prevP = 0;
      pagesToShow.forEach(p => {
        if (prevP && p - prevP > 1) {
          pHtml += `<span style="padding:0 4px; color:var(--text-dim);">...</span>`;
        }
        pHtml += mkBtn(p.toLocaleString('th-TH'), p, false, p === matState.page);
        prevP = p;
      });

      pHtml += mkBtn('ถัดไป »', matState.page + 1, matState.page >= totalPages, false);
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
    matState.page = 1;
    renderMaterialsTab();
  };

  // ตัวกรองย่อยเฉพาะหน้ารายการพัสดุ (ไม่กระทบหน้าภาพรวม / WBS)
  // สร้างรายการ Dropdown ของตัวกรองย่อย: กรองแบบเชื่อมโยงตามเงื่อนไขที่เลือก (WBS / ข้อความวัสดุ / สถานะ SAP)
  function refreshMatSubFilterOptions() {
    const wbsSel = document.getElementById('matFilterWbs');
    const descSel = document.getElementById('matFilterMatDesc');
    if (!wbsSel || !descSel || !matState.allRows) return;
    updateMatSfSapBtn();

    const gf = getGlobalFilters();
    const filterCrit = gf.crit;
    const hasCrit = filterCrit && filterCrit !== 'ALL' && filterCrit !== 'เลือกทั้งหมด';
    const hasProv = gf.prov && gf.prov !== 'ALL' && gf.prov !== 'กฟก.3 (ทั้งหมด)';
    const hasOff = gf.off && gf.off !== 'ALL';

    const curW = (matState.filterWbs || '').trim();
    const curD = (matState.filterMatDesc || '').trim();
    const effectiveDesc = curD || matState.chartSelDesc || '';
    const hasDescFilter = !!effectiveDesc && effectiveDesc !== 'ALL';
    const hasWbsFilter = !!curW && curW !== 'ALL';

    const wbsSet = new Set(), descSet = new Set();
    const src = matState.allRows;
    for (let i = 0; i < src.length; i++) {
      const r = src[i];
      const m = r.m;
      if (r.noMat) continue; // ไม่มีพัสดุ
      if (r.mvtType !== '281') continue;
      if (hasCrit) {
        let ok = false;
        for (let c = 0; c < r.critList.length; c++) {
          if (matchesCriteria(r.critList[c], filterCrit)) { ok = true; break; }
        }
        if (!ok) continue;
      }
      if (hasProv && m.province !== gf.prov) continue;
      if (hasOff && m.office !== gf.off) continue;
      if (matState.sapStatuses.size > 0 && !matState.sapStatuses.has(String(r.sapShort || '(ไม่ระบุ)'))) continue;

      const w = String(r.wbs || '').trim();
      const d = String(r.matDesc || '').trim();

      // ตัวเลือก WBS: กรองตามข้อความวัสดุที่เลือก (ถ้ามี)
      if (w) {
        if (!hasDescFilter || (d && d.toLowerCase() === effectiveDesc.toLowerCase())) {
          wbsSet.add(w);
        }
      }

      // ตัวเลือกข้อความวัสดุ: กรองตาม WBS ที่เลือก (ถ้ามี)
      if (d) {
        if (!hasWbsFilter || (w && w.toLowerCase() === curW.toLowerCase())) {
          descSet.add(d);
        }
      }
    }

    const key = [wbsSet.size, descSet.size, gf.crit, gf.prov, gf.off, curW, curD, matState.chartSelDesc || '', Array.from(matState.sapStatuses).sort().join('|')].join('§');
    if (matState._subOptKey === key) return;
    matState._subOptKey = key;

    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const sortedW = Array.from(wbsSet).sort();
    const sortedD = Array.from(descSet).sort(compareMatDescEnglishFirst);

    // 1. Populate WBS dropdown (ถ้าเลือกวัสดุ จะแสดงเฉพาะ WBS ที่มีวัสดุนั้น)
    const wbsCountLabel = hasDescFilter ? `งานที่มีพัสดุนี้ (${sortedW.length.toLocaleString('th-TH')} งาน)` : `แสดง WBS ทั้งหมด (${sortedW.length.toLocaleString('th-TH')} งาน)`;
    let wHtml = `<option value="ALL">-- ${wbsCountLabel} --</option>`;
    sortedW.forEach(w => {
      wHtml += `<option value="${esc(w)}"${w === curW ? ' selected' : ''}>${esc(w)}</option>`;
    });
    if (curW && curW !== 'ALL' && !wbsSet.has(curW)) {
      wHtml += `<option value="${esc(curW)}" selected>${esc(curW)}</option>`;
    }
    wbsSel.innerHTML = wHtml;
    wbsSel.value = curW || 'ALL';

    // 2. Populate Material Description dropdown (ถ้าเลือก WBS จะแสดงเฉพาะวัสดุในงานนั้น)
    const descCountLabel = hasWbsFilter ? `พัสดุในงานนี้ (${sortedD.length.toLocaleString('th-TH')} รายการ)` : `แสดงข้อความวัสดุทั้งหมด (${sortedD.length.toLocaleString('th-TH')} รายการ)`;
    let dHtml = `<option value="ALL">-- ${descCountLabel} --</option>`;
    sortedD.forEach(d => {
      dHtml += `<option value="${esc(d)}"${d === curD ? ' selected' : ''}>${esc(d)}</option>`;
    });
    if (curD && curD !== 'ALL' && !descSet.has(curD)) {
      dHtml += `<option value="${esc(curD)}" selected>${esc(curD)}</option>`;
    }
    descSel.innerHTML = dHtml;
    descSel.value = curD || 'ALL';

    // 3. ปุ่มเคลียร์ด่วน ✕
    const clearWBtn = document.getElementById('matClearWbsBtn');
    if (clearWBtn) clearWBtn.style.display = (curW && curW !== 'ALL') ? 'inline-flex' : 'none';

    const clearDBtn = document.getElementById('matClearDescBtn');
    if (clearDBtn) clearDBtn.style.display = (curD && curD !== 'ALL') ? 'inline-flex' : 'none';
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
          stockTotal: 0
        };
        agg.set(key, item);
      }

      // แยกงบตาม WBS: C = งบ C (ส้มพาสเทล), I, P = งบ I, P (แดง)
      const w = String(r.wbs || '').trim().toUpperCase();
      if (w.startsWith('C')) {
        item.remC += rem;
        hasAnyC = true;
      } else {
        item.remIp += rem;
        hasAnyIp = true;
      }
      item.remTotal += rem;

      if (r.matCode) item.matCodes.add(String(r.matCode).trim());
      if (r.plant) item.plants.add(String(r.plant).trim().toUpperCase());
    }

    // คำนวณปริมาณคงคลังจากไฟล์ 08 ตามรหัสพัสดุและโรงงาน/Plant ของแถวที่ถูกกรอง
    // (ข้อ 3: หากเลือกตัวกรองแล้ว ปริมาณคงคลังกราฟสีเขียว ต้องแสดงโรงงาน/plant เดียวกับปริมาณคงค้าง ไม่ใช่แสดงทุกโรงงาน)
    const stockMaps = getMat08StockMap();
    if (stockMaps) {
      for (const item of agg.values()) {
        let sIp = 0;
        let sC = 0;
        item.plants.forEach(pl => {
          item.matCodes.forEach(code => {
            const s = stockMaps.byCodePlant.get(code + '|' + pl);
            if (s) {
              sIp += s.stockIp;
              sC += s.stockC;
            }
          });
          if (item.matCodes.size === 0) {
            const sD = stockMaps.byDescPlant.get(item.name + '|' + pl);
            if (sD) {
              sIp += sD.stockIp;
              sC += sD.stockC;
            }
          }
        });
        item.stockIp = sIp;
        item.stockC = sC;
        item.stockTotal = sIp + sC;
      }
    }

    // ตรวจสอบ effectiveBudget
    let effectiveBudget = matState.chartBudgetFilter || 'ALL';
    let lockedByCriteria = false;
    if (hasAnyC && !hasAnyIp) {
      effectiveBudget = 'C';
      lockedByCriteria = true;
    } else if (hasAnyIp && !hasAnyC) {
      effectiveBudget = 'IP';
      lockedByCriteria = true;
    }

    // อัปเดต Legend และปุ่มเลือกงบ
    if (legendEl) {
      const activeBudget = (matState.chartSelBudget && matState.chartSelBudget !== 'ALL')
        ? matState.chartSelBudget
        : effectiveBudget;
      const isAll = activeBudget === 'ALL';
      const isIp = activeBudget === 'IP';
      const isC = activeBudget === 'C';

      const tagAll = isAll ? '<span class="mat-budget-check">✓ เลือกอยู่</span>' : '';
      const tagIp = isIp
        ? `<span class="mat-budget-check">✓ ${lockedByCriteria ? 'ตามเกณฑ์วัด' : 'เลือกอยู่'}</span>`
        : (!hasAnyIp ? '<span class="mat-budget-subtag">(ไม่มีในเกณฑ์วัด)</span>' : '');
      const tagC = isC
        ? `<span class="mat-budget-check">✓ ${lockedByCriteria ? 'ตามเกณฑ์วัด' : 'เลือกอยู่'}</span>`
        : (!hasAnyC ? '<span class="mat-budget-subtag">(ไม่มีในเกณฑ์วัด)</span>' : '');

      const disableIp = !hasAnyIp && !lockedByCriteria;
      const disableC = !hasAnyC && !lockedByCriteria;

      legendEl.innerHTML =
        '<div class="mat-budget-pill-group" role="group" aria-label="เลือกแสดงตามงบ">' +
        `<button type="button" class="mat-budget-pill pill-red${isIp ? ' active' : (isAll ? ' in-both' : ' dimmed')}${disableIp ? ' disabled' : ''}" onclick="window.setMatChartBudgetFilter('IP')" title="${isIp ? 'คลิกอีกครั้งเพื่อแสดงทั้ง 2 งบ' : 'คลิกเพื่อเลือกแสดงเฉพาะ งบ I, P (สีแดง)'}">` +
        `<i class="lg-dot lg-red"></i> ค้างเบิก งบ I, P (สีแดง) ${tagIp}` +
        '</button>' +
        `<button type="button" class="mat-budget-pill pill-orange${isC ? ' active' : (isAll ? ' in-both' : ' dimmed')}${disableC ? ' disabled' : ''}" onclick="window.setMatChartBudgetFilter('C')" title="${isC ? 'คลิกอีกครั้งเพื่อแสดงทั้ง 2 งบ' : 'คลิกเพื่อเลือกแสดงเฉพาะ งบ C (สีส้มพาสเทล)'}">` +
        `<i class="lg-dot lg-orange"></i> ค้างเบิก งบ C (สีส้มพาสเทล) ${tagC}` +
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
    
    // คำนวณ maxVal โดยคิดทั้งยอดค้างเบิกและยอดคงเหลือในคลัง เพื่อให้แท่งกราฟทั้งสองชุดใช้สเกลเดียวกัน
    let maxVal = 0;
    for (let i = 0; i < shown.length; i++) {
      const it = shown[i];
      if (effectiveBudget === 'IP') {
        maxVal = Math.max(maxVal, it.remIp, it.stockIp);
      } else if (effectiveBudget === 'C') {
        maxVal = Math.max(maxVal, it.remC, it.stockC);
      } else {
        maxVal = Math.max(maxVal, it.remTotal, it.stockTotal);
      }
    }

    const sumRemTotal = list.reduce((s, x) => s + x.remTotal, 0);
    const sumRemIp = list.reduce((s, x) => s + x.remIp, 0);
    const sumRemC = list.reduce((s, x) => s + x.remC, 0);

    if (subEl) {
      let subText = '';
      if (total) {
        if (effectiveBudget === 'IP') {
          subText = `${total.toLocaleString('th-TH')} รายการวัสดุ • รวมค้างเบิก งบ I, P ${formatQty(sumRemIp)}`;
        } else if (effectiveBudget === 'C') {
          subText = `${total.toLocaleString('th-TH')} รายการวัสดุ • รวมค้างเบิก งบ C ${formatQty(sumRemC)}`;
        } else {
          subText = `${total.toLocaleString('th-TH')} รายการวัสดุ • รวมค้างเบิก ${formatQty(sumRemTotal)}`;
          if (sumRemIp > 0 || sumRemC > 0) {
            subText += ` (งบ I,P: ${formatQty(sumRemIp)} • งบ C: ${formatQty(sumRemC)})`;
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
      body.innerHTML = `<div class="mat-hchart-empty">ไม่มีรายการพัสดุที่มีปริมาณค้างเบิก${budgetName ? ' ใน' + budgetName : ''} ตามตัวกรองที่เลือก</div>`;
      return;
    }

    const html = [];
    for (let i = 0; i < shown.length; i++) {
      const it = shown[i];
      const isRowSel = (sel === it.name || sel === it.code);
      const safeAttr = escapeHtml(it.name);

      const hasIp = it.remIp > 0.0005;
      const hasC = it.remC > 0.0005;

      const isRedActive = isRowSel && (selBudget === 'IP');
      const isOrangeActive = isRowSel && (selBudget === 'C');

      const isRedDimmed = isRowSel && (selBudget === 'C');
      const isOrangeDimmed = isRowSel && (selBudget === 'IP');

      let barHtml = '';
      let valHtml = '';
      let titleTip = `${safeAttr}`;

      let stockBarHtml = '';
      let stockValHtml = '';
      const plantListStr = it.plants.size > 0 ? Array.from(it.plants).join(', ') : '-';

      if (effectiveBudget === 'IP') {
        const w = (maxVal > 0) ? Math.max(0.6, (it.remIp / maxVal) * 100) : 0;
        const targetCls = isRowSel && (selBudget === 'IP' || selBudget === 'ALL') ? ' active-target' : '';
        barHtml = `<div class="mat-hchart-bar bar-red${targetCls}" style="width:${w.toFixed(2)}%;" onclick="window.selectMatChartItemWithBudget('${safeAttr}', 'IP', event)" title="คลิกเพื่อเลือกเฉพาะ งบ I, P (สีแดง) สำหรับพัสดุนี้: ${formatQty(it.remIp)}"></div>`;
        valHtml = `<span class="val-red">${formatQty(it.remIp)}</span>`;
        titleTip += ` — ค้างเบิก งบ I, P: ${formatQty(it.remIp)}`;

        // สีกราฟเขียวเข้ม สำหรับ SLoc 0022 งบ I,P (แสดงอย่างเดียว กดเลือกไม่ได้)
        if (it.stockIp > 0.0005) {
          const wS = Math.min(100, Math.max(0.6, (it.stockIp / maxVal) * 100));
          stockBarHtml = `<div class="mat-hchart-bar bar-darkgreen" style="width:${wS.toFixed(2)}%;" onclick="event.stopPropagation()" title="คงเหลือในคลัง SLoc 0022 งบ I, P: ${formatQty(it.stockIp)} (โรงงาน: ${plantListStr}) — แสดงอย่างเดียว"></div>`;
          stockValHtml = `<span class="val-darkgreen" title="คงเหลือในคลัง SLoc 0022 งบ I, P (โรงงาน: ${plantListStr})">${formatQty(it.stockIp)}</span>`;
        } else {
          stockBarHtml = `<div class="mat-hchart-bar bar-zero" style="width:0%;" onclick="event.stopPropagation()"></div>`;
          stockValHtml = `<span class="val-stock-zero" title="คงเหลือในคลัง SLoc 0022 งบ I, P = 0 (โรงงาน: ${plantListStr})">0</span>`;
        }
      } else if (effectiveBudget === 'C') {
        const w = (maxVal > 0) ? Math.max(0.6, (it.remC / maxVal) * 100) : 0;
        const targetCls = isRowSel && (selBudget === 'C' || selBudget === 'ALL') ? ' active-target' : '';
        barHtml = `<div class="mat-hchart-bar bar-orange${targetCls}" style="width:${w.toFixed(2)}%;" onclick="window.selectMatChartItemWithBudget('${safeAttr}', 'C', event)" title="คลิกเพื่อเลือกเฉพาะ งบ C (สีส้มพาสเทล) สำหรับพัสดุนี้: ${formatQty(it.remC)}"></div>`;
        valHtml = `<span class="val-orange">${formatQty(it.remC)}</span>`;
        titleTip += ` — ค้างเบิก งบ C: ${formatQty(it.remC)} (ส้มพาสเทล)`;

        // สีกราฟเขียวอ่อน สำหรับ SLoc 0021 งบ C (แสดงอย่างเดียว กดเลือกไม่ได้)
        if (it.stockC > 0.0005) {
          const wS = Math.min(100, Math.max(0.6, (it.stockC / maxVal) * 100));
          stockBarHtml = `<div class="mat-hchart-bar bar-lightgreen" style="width:${wS.toFixed(2)}%;" onclick="event.stopPropagation()" title="คงเหลือในคลัง SLoc 0021 งบ C: ${formatQty(it.stockC)} (โรงงาน: ${plantListStr}) — แสดงอย่างเดียว"></div>`;
          stockValHtml = `<span class="val-lightgreen" title="คงเหลือในคลัง SLoc 0021 งบ C (โรงงาน: ${plantListStr})">${formatQty(it.stockC)}</span>`;
        } else {
          stockBarHtml = `<div class="mat-hchart-bar bar-zero" style="width:0%;" onclick="event.stopPropagation()"></div>`;
          stockValHtml = `<span class="val-stock-zero" title="คงเหลือในคลัง SLoc 0021 งบ C = 0 (โรงงาน: ${plantListStr})">0</span>`;
        }
      } else {
        // ทั้ง 2 งบ: แดงขึ้นก่อน (งบ I, P) แล้วตามด้วยส้มพาสเทล (งบ C)
        const wIp = (maxVal > 0 && hasIp) ? (it.remIp / maxVal) * 100 : 0;
        const wC = (maxVal > 0 && hasC) ? (it.remC / maxVal) * 100 : 0;

        if (hasIp && hasC) {
          const redCls = `${isRedActive ? ' active-target' : ''}${isRedDimmed ? ' bar-dimmed' : ''}`;
          const orangeCls = `${isOrangeActive ? ' active-target' : ''}${isOrangeDimmed ? ' bar-dimmed' : ''}`;
          barHtml = `<div class="mat-hchart-bar bar-red bar-seg-first${redCls}" style="width:${wIp.toFixed(2)}%;" onclick="window.selectMatChartItemWithBudget('${safeAttr}', 'IP', event)" title="คลิกเพื่อเลือกเฉพาะ งบ I, P (สีแดง) สำหรับพัสดุนี้: ${formatQty(it.remIp)}"></div>` +
                    `<div class="mat-hchart-bar bar-orange bar-seg-last${orangeCls}" style="width:${wC.toFixed(2)}%;" onclick="window.selectMatChartItemWithBudget('${safeAttr}', 'C', event)" title="คลิกเพื่อเลือกเฉพาะ งบ C (สีส้มพาสเทล) สำหรับพัสดุนี้: ${formatQty(it.remC)}"></div>`;
          valHtml = `<span class="val-red" title="งบ I, P">${formatQty(it.remIp)}</span>` +
                    `<span style="opacity:0.6; margin:0 3px; font-weight:700;">+</span>` +
                    `<span class="val-orange" title="งบ C">${formatQty(it.remC)}</span>` +
                    `<span style="color:#FFB81C; font-size:0.7rem; font-weight:700; margin-left:4px;">(รวม ${formatQty(it.remTotal)})</span>`;
          titleTip += ` — รวมค้างเบิก ${formatQty(it.remTotal)} [งบ I, P: ${formatQty(it.remIp)} | งบ C: ${formatQty(it.remC)}]`;
        } else if (hasIp) {
          const w = Math.max(0.6, wIp);
          const redCls = `${isRedActive ? ' active-target' : ''}`;
          barHtml = `<div class="mat-hchart-bar bar-red${redCls}" style="width:${w.toFixed(2)}%;" onclick="window.selectMatChartItemWithBudget('${safeAttr}', 'IP', event)" title="คลิกเพื่อเลือกเฉพาะ งบ I, P (สีแดง) สำหรับพัสดุนี้: ${formatQty(it.remIp)}"></div>`;
          valHtml = `<span class="val-red">${formatQty(it.remIp)}</span>`;
          titleTip += ` — ค้างเบิก งบ I, P: ${formatQty(it.remIp)}`;
        } else if (hasC) {
          const w = Math.max(0.6, wC);
          const orangeCls = `${isOrangeActive ? ' active-target' : ''}`;
          barHtml = `<div class="mat-hchart-bar bar-orange${orangeCls}" style="width:${w.toFixed(2)}%;" onclick="window.selectMatChartItemWithBudget('${safeAttr}', 'C', event)" title="คลิกเพื่อเลือกเฉพาะ งบ C (สีส้มพาสเทล) สำหรับพัสดุนี้: ${formatQty(it.remC)}"></div>`;
          valHtml = `<span class="val-orange">${formatQty(it.remC)}</span>`;
          titleTip += ` — ค้างเบิก งบ C: ${formatQty(it.remC)} (ส้มพาสเทล)`;
        }

        // กราฟคงคลัง: เขียวเข้ม SLoc 0022 (งบ I,P) + เขียวอ่อน SLoc 0021 (งบ C) (แสดงอย่างเดียว กดเลือกไม่ได้)
        const hasStockIp = it.stockIp > 0.0005;
        const hasStockC = it.stockC > 0.0005;

        if (hasStockIp && hasStockC) {
          const wSIp = (maxVal > 0) ? Math.max(0.4, (it.stockIp / maxVal) * 100) : 0;
          const wSC = (maxVal > 0) ? Math.max(0.4, (it.stockC / maxVal) * 100) : 0;
          stockBarHtml = `<div class="mat-hchart-bar bar-darkgreen bar-seg-first" style="width:${wSIp.toFixed(2)}%;" onclick="event.stopPropagation()" title="คงเหลือในคลัง SLoc 0022 งบ I, P: ${formatQty(it.stockIp)} (โรงงาน: ${plantListStr}) — แสดงอย่างเดียว"></div>` +
                         `<div class="mat-hchart-bar bar-lightgreen bar-seg-last" style="width:${wSC.toFixed(2)}%;" onclick="event.stopPropagation()" title="คงเหลือในคลัง SLoc 0021 งบ C: ${formatQty(it.stockC)} (โรงงาน: ${plantListStr}) — แสดงอย่างเดียว"></div>`;
          stockValHtml = `<span class="val-darkgreen" title="คงเหลือ SLoc 0022 งบ I, P">${formatQty(it.stockIp)}</span>` +
                         `<span style="opacity:0.6; margin:0 3px; font-weight:700;">+</span>` +
                         `<span class="val-lightgreen" title="คงเหลือ SLoc 0021 งบ C">${formatQty(it.stockC)}</span>` +
                         `<span class="val-stock-total" style="font-size:0.7rem; font-weight:700; margin-left:4px;">(รวม ${formatQty(it.stockTotal)})</span>`;
        } else if (hasStockIp) {
          const wS = Math.min(100, Math.max(0.6, (it.stockIp / maxVal) * 100));
          stockBarHtml = `<div class="mat-hchart-bar bar-darkgreen" style="width:${wS.toFixed(2)}%;" onclick="event.stopPropagation()" title="คงเหลือในคลัง SLoc 0022 งบ I, P: ${formatQty(it.stockIp)} (โรงงาน: ${plantListStr}) — แสดงอย่างเดียว"></div>`;
          stockValHtml = `<span class="val-darkgreen">${formatQty(it.stockIp)}</span>`;
        } else if (hasStockC) {
          const wS = Math.min(100, Math.max(0.6, (it.stockC / maxVal) * 100));
          stockBarHtml = `<div class="mat-hchart-bar bar-lightgreen" style="width:${wS.toFixed(2)}%;" onclick="event.stopPropagation()" title="คงเหลือในคลัง SLoc 0021 งบ C: ${formatQty(it.stockC)} (โรงงาน: ${plantListStr}) — แสดงอย่างเดียว"></div>`;
          stockValHtml = `<span class="val-lightgreen">${formatQty(it.stockC)}</span>`;
        } else {
          stockBarHtml = `<div class="mat-hchart-bar bar-zero" style="width:0%;" onclick="event.stopPropagation()"></div>`;
          stockValHtml = `<span class="val-stock-zero" title="คงเหลือในคลัง = 0 (โรงงาน: ${plantListStr}) — แสดงอย่างเดียว">0</span>`;
        }
      }

      titleTip += ` [คงคลัง: รวม ${formatQty(it.stockTotal)} (งบ I,P: ${formatQty(it.stockIp)}, งบ C: ${formatQty(it.stockC)}) — โรงงาน: ${plantListStr}]`;
      titleTip += ' (คลิกชื่อพัสดุเพื่อเลือกทุกงบ หรือคลิกแท่งสีแดง/ส้ม เพื่อเลือกเฉพาะงบนั้น • แถบสีเขียวแสดงยอดคงคลังเท่านั้น ไม่สามารถกดเลือกได้)';

      const isNameSelected = isRowSel && (selBudget === 'ALL');
      const nameCheck = isNameSelected ? ' <span class="mat-hchart-name-check">✓</span>' : '';
      const nameCls = `mat-hchart-name${isNameSelected ? ' selected-name active-target' : (isRowSel ? ' row-active-text' : '')}`;

      html.push(
        `<div class="mat-hchart-row${isRowSel ? ' selected' : ''}${sel && !isRowSel ? ' dimmed' : ''}" data-mat="${safeAttr}" onclick="window.selectMatChartItemWithBudget(this.getAttribute('data-mat'), 'ALL', event)" title="${titleTip}">` +
        `<div class="mat-hchart-rank">${i + 1}</div>` +
        `<div class="${nameCls}" onclick="window.selectMatChartItemWithBudget('${safeAttr}', 'ALL', event)" title="คลิกเพื่อเลือกพัสดุนี้: ${safeAttr} (แสดงทุกงบ)">${escapeHtml(it.name)}${nameCheck}</div>` +
        `<div class="mat-hchart-bars">` +
        `<div class="mat-hchart-track" title="ปริมาณค้างเบิก">${barHtml}<span class="mat-hchart-val">${valHtml}</span></div>` +
        `<div class="mat-hchart-track track-green" data-stock-slot="${safeAttr}" onclick="event.stopPropagation()" title="ปริมาณคงเหลือในคลัง (ไฟล์ 08: โรงงาน ${plantListStr}) — แสดงอย่างเดียว">${stockBarHtml}<span class="mat-hchart-val">${stockValHtml}</span></div>` +
        `</div>` +
        `</div>`
      );
    }
    body.innerHTML = html.join('');
    if (scroll) scroll.scrollTop = prevTop;
  }
  window.renderMatRemainChart = renderMatRemainChart;

  window.setMatChartBudgetFilter = function (mode) {
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

    // Toggle behavior:
    // If clicking exact same material AND exact same budget -> toggle off (clear selection)
    if (matState.chartSelDesc === name && (matState.chartSelBudget || 'ALL') === budget) {
      matState.chartSelDesc = '';
      matState.chartSelBudget = 'ALL';
    } else {
      matState.chartSelDesc = name;
      matState.chartSelBudget = budget;
    }

    matState.cachedFilterKey = '';
    matState.page = 1;
    renderMaterialsTab();
  };

  window.selectMatChartItem = function (name, e) {
    window.selectMatChartItemWithBudget(name, 'ALL', e);
  };

  window.clearMatChartSelection = function () {
    matState.chartSelDesc = '';
    matState.chartSelBudget = 'ALL';
    matState.cachedFilterKey = '';
    matState.page = 1;
    renderMaterialsTab();
  };

  function updateMatSubFilterCount() {
    const el = document.getElementById('matSubFilterCount');
    if (!el) return;
    const active = !!((matState.filterWbs || '').trim() || (matState.filterMatDesc || '').trim() || matState.sapStatuses.size > 0);
    if (!active) { el.textContent = ''; el.classList.remove('active'); return; }
    el.textContent = 'พบ ' + getFilteredMaterialRows().length.toLocaleString('th-TH') + ' รายการ';
    el.classList.add('active');
  }
  window.updateMatSubFilterCount = updateMatSubFilterCount;

  window.handleMatFilterWbsChange = function (val) {
    matState.filterWbs = (!val || val === 'ALL') ? '' : String(val).trim();
    // หากข้อความวัสดุที่เลือกไว้เดิมไม่อยู่ในงาน WBS นี้ ให้เคลียร์ข้อความวัสดุออก
    if (matState.filterWbs && matState.filterMatDesc) {
      const src = matState.allRows || [];
      const hasMatInWbs = src.some(r =>
        !r.noMat &&
        (r.wbs || '').toLowerCase() === matState.filterWbs.toLowerCase() &&
        (r.matDesc || '').toLowerCase() === matState.filterMatDesc.toLowerCase()
      );
      if (!hasMatInWbs) matState.filterMatDesc = '';
    }
    matState.cachedFilterKey = '';
    matState.page = 1;
    renderMaterialsTab();
    updateMatSubFilterCount();
  };

  window.clearMatFilterWbs = function () {
    matState.filterWbs = '';
    const sel = document.getElementById('matFilterWbs');
    if (sel) sel.value = 'ALL';
    matState.cachedFilterKey = '';
    matState.page = 1;
    renderMaterialsTab();
    updateMatSubFilterCount();
  };

  window.handleMatFilterDescChange = function (val) {
    matState.filterMatDesc = (!val || val === 'ALL') ? '' : String(val).trim();
    // หากงาน WBS ที่เลือกไว้เดิมไม่มีข้อความวัสดุนี้ ให้เคลียร์งาน WBS ออก
    if (matState.filterWbs && matState.filterMatDesc) {
      const src = matState.allRows || [];
      const hasWbsWithMat = src.some(r =>
        !r.noMat &&
        (r.wbs || '').toLowerCase() === matState.filterWbs.toLowerCase() &&
        (r.matDesc || '').toLowerCase() === matState.filterMatDesc.toLowerCase()
      );
      if (!hasWbsWithMat) matState.filterWbs = '';
    }
    matState.cachedFilterKey = '';
    matState.page = 1;
    renderMaterialsTab();
    updateMatSubFilterCount();
  };

  window.clearMatFilterDesc = function () {
    matState.filterMatDesc = '';
    const sel = document.getElementById('matFilterMatDesc');
    if (sel) sel.value = 'ALL';
    matState.cachedFilterKey = '';
    matState.page = 1;
    renderMaterialsTab();
    updateMatSubFilterCount();
  };

  window.resetMatSubFilters = function () {
    matState.filterWbs = '';
    matState.filterMatDesc = '';
    matState.filterSapStatus = 'ALL';
    matState.sapStatuses.clear();
    matState.chartSelDesc = '';
    matState.chartBudgetFilter = 'ALL';
    matState.chartSelBudget = 'ALL';
    const w = document.getElementById('matFilterWbs');
    if (w) w.value = 'ALL';
    const d = document.getElementById('matFilterMatDesc');
    if (d) d.value = 'ALL';
    const s = document.getElementById('matFilterSapStatus');
    if (s) s.value = 'ALL';
    matState.cachedFilterKey = '';
    matState.page = 1;
    renderMaterialsTab();
    updateMatSubFilterCount();
  };

  window.clearAllMatTableSelections = function () {
    matState.chartSelDesc = '';
    matState.chartBudgetFilter = 'ALL';
    matState.chartSelBudget = 'ALL';
    matState.localSearch = '';
    matState.pendingMode = 'ALL';
    matState.mvtFilter = '281';
    matState.hasMatFilter = 'HAS_MAT';
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
    t.textContent = cnt === 0 ? 'ทั้งหมด' : (cnt === 1 ? Array.from(matState.sapStatuses)[0] : 'เลือก ' + cnt + ' สถานะ');
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

  // Initialize preferences & badge on load
  initColumnPrefs();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(updateMaterialsNavBadge, 120));
  } else {
    setTimeout(updateMaterialsNavBadge, 120);
  }
})();
