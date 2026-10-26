/**
 * PEA AUC Dashboard - Data Import & Modification History Module (Audit Log & Model View)
 * ระบบแสดงประวัติวันที่การนำเข้าข้อมูล บันทึกการแก้ไขข้อมูล และผัง Model View การจัดเก็บข้อมูล
 */

(function () {
  'use strict';

  // Storage key for persistent user-added or dynamic logs
  const STORAGE_CUSTOM_LOGS_KEY = 'AUC_DATA_HISTORY_CUSTOM_LOGS_V1';

  /**
   * Helper: Escape HTML
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Helper: Copy text to clipboard
   */
  window.copyTextToClipboard = window.copyTextToClipboard || function (text, msg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (window.showToast) window.showToast(msg || 'คัดลอกเรียบร้อยแล้ว', 'success');
      }).catch(() => fallbackCopy(text, msg));
    } else {
      fallbackCopy(text, msg);
    }
  };

  function copyTextToClipboard(text, msg) {
    if (window.copyTextToClipboard) window.copyTextToClipboard(text, msg);
  }

  function fallbackCopy(text, msg) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      if (window.showToast) window.showToast(msg || 'คัดลอกเรียบร้อยแล้ว', 'success');
    } catch (e) {
      if (window.showToast) window.showToast('ไม่สามารถคัดลอกได้: ' + e.message, 'error');
    }
    document.body.removeChild(ta);
  }

  /**
   * Catalog of all Data Source Files and their mapped System Storage Files
   */
  const DATA_SOURCE_CATALOG = [
    {
      id: 'src_03',
      groupNo: '03',
      name: '03 WBSงานคงเหลือเดือนล่าสุด.xlsx',
      category: 'WBS Base Database',
      importDate: '2026-10-23 08:04:27',
      importDateTh: '23 ต.ค. 2569, 08:04 น.',
      lastModifiedTh: '23 ต.ค. 2569, 08:04 น.',
      sizeText: '5.43 MB',
      recordCount: 2083,
      status: 'active',
      statusText: 'ใช้งานอยู่ (หลัก)',
      storageFile: 'js/data_wbs.js',
      storageVar: 'window.AUC_WBS_REMAINING_DATA',
      icon: '📋',
      badgeColor: '#EC4899',
      description: 'ฐานข้อมูลงานก่อสร้าง WBS คงเหลือทั้งหมดของ กฟก.3 ผสานร่วมกับ ZBUDR064 และ CN41 เพื่อใช้ติดตามงาน AUC คงเหลือรายโครงการ',
      columns: [
        'id (ลำดับ)', 'wbs (เลขที่งาน WBS)', 'criteria (ประเภทเกณฑ์วัด)', 'province (พื้นที่/จังหวัด)',
        'office (กอง / กฟฟ.)', 'budget (ประเภทงบ)', 'engineer (ช่างคุมงาน)', 'department (สังกัด)', 'type (ประเภทงาน)'
      ],
      sampleProvider: () => (window.AUC_WBS_REMAINING_DATA || []).slice(0, 5).map(r => ({
        'WBS': r.wbs || '-',
        'กฟฟ.': r.office || '-',
        'ชื่องาน': r.description || '-',
        'สถานะ SAP': r.statusSap || '-',
        'มูลค่า AUC': (Number(r.cn41ActualCost) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }),
        'ช่างคุมงาน': r.engineer || '-'
      }))
    },
    {
      id: 'src_04',
      groupNo: '04',
      name: '04 WBS ZBUDR064 %พัสดุและค่าแรงและสถานะsap.xlsx',
      category: 'SAP ZBUDR064 & Costs',
      importDate: '2026-10-23 08:28:31',
      importDateTh: '23 ต.ค. 2569, 08:28 น.',
      lastModifiedTh: '23 ต.ค. 2569, 08:28 น.',
      sizeText: '731.7 KB',
      recordCount: 2083,
      status: 'active',
      statusText: 'ผสานข้อมูลสำเร็จ',
      storageFile: 'js/data_wbs.js',
      storageVar: 'window.AUC_WBS_REMAINING_DATA (Joined)',
      icon: '⚡',
      badgeColor: '#8B5CF6',
      description: 'ข้อมูลรายงาน SAP ZBUDR064 ประกอบด้วย งบประมาณต้นแบบ/ปัจจุบัน, ค่าใช้จ่ายจริง Actual (ค่าพัสดุ 121, ค่าจ้างเหมา, ค่าประสานงาน), แผนงาน Plan และสถานะ SAP เต็ม (REL, TECO, CLSD)',
      columns: [
        'description (ชื่องาน)', 'statusSap (สถานะ SAP ย่อ)', 'status (สถานะเต็ม SAP)', 'level (ระดับ)',
        'budgetOrigin', 'budgetCurrent', 'budgetAlloc', 'actTotalCtrl', 'actMat121', 'pctMatWithdraw', 'pctExpenseWithdraw'
      ],
      sampleProvider: () => (window.AUC_WBS_REMAINING_DATA || []).slice(0, 5).map(r => ({
        'WBS': r.wbs,
        'สถานะเต็ม': r.status || '-',
        'สถานะย่อ': r.statusSap || '-',
        '% เบิกพัสดุ': (r.pctMatWithdraw || 0).toFixed(2) + '%',
        '% เบิก คชจ.': (r.pctExpenseWithdraw || 0).toFixed(2) + '%',
        'งบปัจจุบัน': (r.budgetCurrent || 0).toLocaleString('th-TH')
      }))
    },
    {
      id: 'src_05',
      groupNo: '05',
      name: '05 WBS CN41 มูลค่า AUC วันเริ่มบัญชี 14 ตค 69.xlsx',
      category: 'SAP CN41 AUC Values (Baseline)',
      importDate: '2026-10-24 20:45:00',
      importDateTh: '24 ต.ค. 2569, 20:45 น.',
      lastModifiedTh: '14 ต.ค. 2569 (วันเริ่มบัญชี)',
      sizeText: '339.0 KB',
      recordCount: 2083,
      status: 'active',
      statusText: 'ผสานข้อมูลสำเร็จ (ผูก WBS 03)',
      storageFile: 'js/data_wbs.js',
      storageVar: 'window.AUC_WBS_REMAINING_DATA.cn41Cost05',
      icon: '📁',
      badgeColor: '#06B6D4',
      description: 'รายงาน SAP CN41 มูลค่าต้นทุนจริง AUC ณ วันเริ่มบัญชี 14 ต.ค. 2569 ยอดรวม 643,241,099.93 บาท ผูกกับ WBS ไฟล์ 03 สำหรับคำนวณมูลค่า AUC ที่เพิ่มขึ้น',
      columns: [
        'cn41Cost05 (ต้นทุนจริง วันเริ่มบัญชี 14 ต.ค. 69)',
        'cn41CostInc (มูลค่าAUCที่เพิ่มขึ้น = ไฟล์ 06 - ไฟล์ 05)',
        'cn41ActualCost (ต้นทุนจริง ไฟล์ 06 ล่าสุด 22 ต.ค. 69)'
      ],
      sampleProvider: () => (window.AUC_WBS_REMAINING_DATA || []).slice(0, 5).map(r => ({
        'WBS': r.wbs,
        'AUC ไฟล์ 06 ล่าสุด (บาท)': (Number(r.cn41ActualCost) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }),
        'AUC ไฟล์ 05 เริ่มต้น (บาท)': (Number(r.cn41Cost05) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }),
        'มูลค่าAUCที่เพิ่มขึ้น (บาท)': (Number(r.cn41CostInc) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }),
        'กฟฟ.': r.office || '-'
      }))
    },
    {
      id: 'src_06',
      groupNo: '06',
      name: '06 WBS CN41 มูลค่า AUC ล่าสุด วันที่ 22 ตค 69.xlsx',
      category: 'SAP CN41 AUC Values (Latest)',
      importDate: '2026-10-24 18:42:42',
      importDateTh: '24 ต.ค. 2569, 18:42 น.',
      lastModifiedTh: '22 ต.ค. 2569 (ไฟล์ล่าสุด)',
      sizeText: '336.2 KB',
      recordCount: 2083,
      status: 'active',
      statusText: 'ผสานข้อมูลสำเร็จ',
      storageFile: 'js/data_wbs.js',
      storageVar: 'window.AUC_WBS_REMAINING_DATA.cn41ActualCost',
      icon: '📑',
      badgeColor: '#F59E0B',
      description: 'รายงาน SAP CN41 ระบุต้นทุนจริงและมูลค่า AUC สะสม (บาท) ของแต่ละโครงการ สำหรับวิเคราะห์มูลค่าสินทรัพย์ระหว่างก่อสร้าง ล่าสุด 22 ต.ค. 69',
      columns: [
        'cn41ActualCost (มูลค่า AUC บาท)', 'cn41ObjDesc (ออบเจคโครงการ)', 'cn41Level (ระดับ)',
        'cn41Currency (สกุลเงิน THB)', 'cn41Row (ลำดับแถว)'
      ],
      sampleProvider: () => (window.AUC_WBS_REMAINING_DATA || []).slice(0, 5).map(r => ({
        'WBS': r.wbs,
        'มูลค่า AUC (บาท)': (r.cn41ActualCost || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }),
        'ออบเจค CN41': r.cn41ObjDesc || '-',
        'สกุลเงิน': r.cn41Currency || 'THB'
      }))
    },
    {
      id: 'src_sheet',
      groupNo: 'G-Sheet',
      name: 'Google Sheet แผนงานแล้วเสร็จ (Online Live API)',
      category: 'Google Sheet Field Plans',
      importDate: '2026-10-22 17:23:00',
      importDateTh: '22 ต.ค. 2569, 17:23 น.',
      lastModifiedTh: '22 ต.ค. 2569, 17:23 น.',
      sizeText: 'Live Online Sync',
      recordCount: 1143,
      status: 'active',
      statusText: 'ซิงค์จาก Google Sheet สำเร็จ',
      storageFile: 'js/data_wbs.js',
      storageVar: 'window.AUC_WBS_REMAINING_DATA (planClose & note)',
      icon: '📅',
      badgeColor: '#10B981',
      description: 'ข้อมูลแผนปิดงานและหมายเหตุความคืบหน้าหน้างานจาก Google Sheet แผนงานแล้วเสร็จของช่างคุมงานแต่ละ กฟฟ.',
      columns: [
        'planClose (แผนปิดงาน เช่น งวดบัญชี สค, กย, ตค)',
        'note (หมายเหตุข้อเท็จจริงหน้างาน/การส่งมอบพื้นที่/เบิกพัสดุ)'
      ],
      sampleProvider: () => (window.AUC_WBS_REMAINING_DATA || []).filter(r => r.planClose || r.note).slice(0, 5).map(r => ({
        'WBS': r.wbs,
        'แผนปิดงาน': r.planClose || 'ไม่ระบุ',
        'หมายเหตุหน้างาน': r.note || '-'
      }))
    },
    {
      id: 'src_02',
      groupNo: '02',
      name: '02 KPI.xlsx',
      category: 'KPI Targets & Matrix',
      importDate: '2026-10-03 09:30:00',
      importDateTh: '3 ต.ค. 2569, 09:30 น.',
      lastModifiedTh: '15 ต.ค. 2569, 17:52 น.',
      sizeText: '17.4 KB',
      recordCount: 8,
      status: 'active',
      statusText: 'เกณฑ์วัด 2569',
      storageFile: 'js/kpi_matrix.js',
      storageVar: 'window.KPI_MATRIX & localStorage (AUC_SAVED_KPI_MATRIX)',
      icon: '🎯',
      badgeColor: '#3B82F6',
      description: 'ตารางเกณฑ์วัด KPI ประจำปี 2569 ทั้ง 3 หมวด (ข้อ 1.1 - 1.3 งานก่อนปี 69, ข้อ 2.1 งานปี 69, ข้อ 3.1 - 3.3 งานปิด TECO)',
      columns: [
        'id', 'criteria (ชื่อเกณฑ์วัด)', 'targetPercentage (เป้าหมาย %)', 'weight (น้ำหนักคะแนน)',
        'monthlyTargets (เป้าสะสมรายเดือน ม.ค. - ธ.ค.)'
      ],
      sampleProvider: () => (window.KPI_MATRIX || []).slice(0, 5).map(k => ({
        'รหัส': k.id || '-',
        'เกณฑ์วัด': k.criteria || k.name || '-',
        'เป้าหมาย': (k.target || k.targetPercentage || 100) + '%',
        'น้ำหนัก': (k.weight || '-') + '%'
      }))
    },
    {
      id: 'src_01_sep',
      groupNo: '01',
      name: '01 รายงาน AUC เดือน 9ก.ย.  (3.3teco).xlsx',
      category: 'Monthly AUC Executive Report',
      importDate: '2026-10-22 23:18:00',
      importDateTh: '22 ต.ค. 2569, 23:18 น.',
      lastModifiedTh: '22 ต.ค. 2569, 21:03 น.',
      sizeText: '46.0 KB',
      recordCount: 368,
      status: 'active',
      statusText: 'ข้อมูลเดือนล่าสุด (ก.ย.)',
      storageFile: 'js/data_sep.js',
      storageVar: 'window.AUC_DATA_SEP (Active Month: ก.ย. 2569)',
      icon: '📊',
      badgeColor: '#EC4899',
      description: 'รายงานผลการติดตามงานก่อสร้างและขึ้นทะเบียนทรัพย์สิน AUC ประจำเดือน ก.ย. 2569 สรุปราย กฟฟ. ทั้ง 20 แห่ง',
      columns: [
        'criteria (เกณฑ์วัด)', 'province (พื้นที่)', 'office (กฟฟ.)', 'totalValue (ยอดรวม)',
        'closedValue (ปิดงานแล้ว)', 'remainingValue (คงเหลือ)', 'latestPercent (% ปิดงาน)', 'score (คะแนน KPI)'
      ],
      sampleProvider: () => (window.AUC_DATA_SEP || []).slice(0, 5).map(r => ({
        'กฟฟ.': r.office,
        'เกณฑ์วัด': r.criteria,
        'คงเหลือ (บาท)': (r.remainingValue || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }),
        '% ปิดงาน': ((r.latestPercent || 0) * 100).toFixed(2) + '%',
        'คะแนน KPI': (r.score || 0).toFixed(2)
      }))
    },
    {
      id: 'src_01_aug',
      groupNo: '01',
      name: '01 รายงาน AUC เดือน 8ส.ค.  (3.2&3.3teco).xlsx',
      category: 'Monthly AUC Executive Report',
      importDate: '2026-09-29 16:55:00',
      importDateTh: '29 ก.ย. 2569, 16:55 น.',
      lastModifiedTh: '29 ก.ย. 2569, 16:55 น.',
      sizeText: '50.2 KB',
      recordCount: 368,
      status: 'ready',
      statusText: 'ประวัติเดือน ส.ค.',
      storageFile: 'js/data_aug.js',
      storageVar: 'window.AUC_DATA_AUG (เดือน ส.ค. 2569)',
      icon: '📊',
      badgeColor: '#6366F1',
      description: 'รายงานผลการติดตามงานก่อสร้างและขึ้นทะเบียนทรัพย์สิน AUC ประจำเดือน ส.ค. 2569 สรุปราย กฟฟ. ทั้ง 20 แห่ง',
      columns: [
        'criteria (เกณฑ์วัด)', 'province (พื้นที่)', 'office (กฟฟ.)', 'totalValue (ยอดรวม)',
        'closedValue (ปิดงานแล้ว)', 'remainingValue (คงเหลือ)', 'latestPercent (% ปิดงาน)', 'score (คะแนน KPI)'
      ],
      sampleProvider: () => (window.AUC_DATA_AUG || window.AUC_INITIAL_DATA || []).slice(0, 5).map(r => ({
        'กฟฟ.': r.office,
        'เกณฑ์วัด': r.criteria,
        'คงเหลือ (บาท)': (r.remainingValue || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }),
        '% ปิดงาน': ((r.latestPercent || 0) * 100).toFixed(2) + '%',
        'คะแนน KPI': (r.score || 0).toFixed(2)
      }))
    },
    {
      id: 'src_01_jul',
      groupNo: '01',
      name: '01 รายงาน AUC เดือน 7ก.ค.  (3.2teco).xlsx',
      category: 'Monthly AUC Executive Report',
      importDate: '2026-09-25 17:32:00',
      importDateTh: '25 ก.ย. 2569, 17:32 น.',
      lastModifiedTh: '25 ก.ย. 2569, 17:32 น.',
      sizeText: '632.5 KB',
      recordCount: 368,
      status: 'ready',
      statusText: 'ประวัติเดือน ก.ค.',
      storageFile: 'js/data.js',
      storageVar: 'window.AUC_INITIAL_DATA (เดือน ก.ค.)',
      icon: '📈',
      badgeColor: '#06B6D4',
      description: 'รายงานสรุปผลงาน AUC ประจำเดือน ก.ค. 2569 สำหรับเปรียบเทียบแนวโน้มผลงานกับเดือน ส.ค.',
      columns: ['criteria', 'province', 'office', 'totalValue', 'closedValue', 'remainingValue', 'latestPercent'],
      sampleProvider: () => (window.AUC_INITIAL_DATA || []).slice(0, 5).map(r => ({
        'กฟฟ.': r.office,
        'เกณฑ์วัด': r.criteria,
        'คงเหลือ (บาท)': (r.remainingValue || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }),
        '% ปิดงาน': ((r.latestPercent || 0) * 100).toFixed(2) + '%'
      }))
    },
    {
      id: 'src_01_prev',
      groupNo: '01',
      name: '01 รายงาน AUC เดือน 1ม.ค. - 6มิ.ย. 2569 (รวม 6 ไฟล์)',
      category: 'Monthly Historical Reports',
      importDate: '2026-09-25 17:32:00',
      importDateTh: '25 ก.ย. 2569, 17:32 น.',
      lastModifiedTh: '25 ก.ย. 2569, 17:32 น.',
      sizeText: '~270 KB รวม',
      recordCount: 2208,
      status: 'ready',
      statusText: 'ประวัติ ม.ค. - มิ.ย.',
      storageFile: 'js/data_jan.js ถึง js/data_jun.js',
      storageVar: 'window.AUC_DATA_JAN .. JUN',
      icon: '📁',
      badgeColor: '#14B8A6',
      description: 'ชุดไฟล์รายงานผลงาน AUC ย้อนหลังตั้งแต่เดือน ม.ค. - มิ.ย. 2569 ใช้ในการวิเคราะห์ Timeline และ Scenario Comparison',
      columns: ['criteria', 'province', 'office', 'totalValue', 'closedValue', 'remainingValue', 'latestPercent'],
      sampleProvider: () => (window.AUC_DATA_JAN || []).slice(0, 5).map(r => ({
        'กฟฟ.': r.office,
        'เกณฑ์วัด': r.criteria,
        'คงเหลือ (บาท)': (r.remainingValue || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })
      }))
    }
  ];

  /**
   * System Storage File Definitions (Physical JS Files & LocalStorage)
   */
  const SYSTEM_STORAGE_FILES = [
    {
      path: 'js/data_wbs.js',
      title: 'ฐานข้อมูลรวมงาน WBS คงเหลือ (Merged WBS Database)',
      role: 'จัดเก็บข้อมูลหลักงาน WBS (ไฟล์ 03 + 04 + 05 + Google Sheet)',
      recordsCount: '2,083 รายการ (41 คอลัมน์)',
      fileSize: '2.32 MB',
      updatedAt: '23 ต.ค. 2569, 09:58 น.',
      status: '100% ฐานข้อมูลอัปเดตล่าสุด',
      variable: 'window.AUC_WBS_REMAINING_DATA'
    },
    {
      path: 'js/wbs.js',
      title: 'โมดูลจัดการหน้าตาราง WBS & ตัวกรอง',
      role: 'ตรรกะคำนวณตัวกรอง, ค้นหาสถานะ SAP, จัดกลุ่มสรุปผล',
      recordsCount: '4,055 บรรทัดคำสั่ง',
      fileSize: '184 KB',
      updatedAt: '17 ต.ค. 2569, 08:15 น.',
      status: 'อัปเดตล่าสุดวันนี้',
      variable: 'window.renderWbsTab, getFilteredWbsData'
    },
    {
      path: 'js/data_sep.js',
      title: 'ข้อมูลผลงาน AUC เดือน ก.ย. 2569 (ล่าสุด)',
      role: 'ฐานข้อมูลสรุปผลงานระดับผู้บริหารเดือน ก.ย. 2569',
      recordsCount: '368 รายการ',
      fileSize: '198 KB',
      updatedAt: '22 ต.ค. 2569, 23:18 น.',
      status: 'Active Month',
      variable: 'window.AUC_DATA_SEP'
    },
    {
      path: 'js/data_aug.js',
      title: 'ข้อมูลผลงาน AUC เดือน ส.ค. 2569',
      role: 'ฐานข้อมูลสรุปผลงานสะสมเดือน ส.ค. 2569',
      recordsCount: '368 รายการ',
      fileSize: '224 KB',
      updatedAt: '29 ก.ย. 2569, 16:55 น.',
      status: 'Historical Baseline',
      variable: 'window.AUC_DATA_AUG'
    },
    {
      path: 'js/data.js',
      title: 'ข้อมูลผลงาน AUC เดือน ก.ค. 2569',
      role: 'ฐานข้อมูลสรุปผลงานสะสมเดือน ก.ค. 2569',
      recordsCount: '368 รายการ',
      fileSize: '370 KB',
      updatedAt: '25 ก.ย. 2569, 17:32 น.',
      status: 'Historical Baseline',
      variable: 'window.AUC_INITIAL_DATA'
    },
    {
      path: 'js/kpi_matrix.js',
      title: 'เกณฑ์ชี้วัด KPI และสูตรการคำนวณคะแนน',
      role: 'เกณฑ์ชี้วัดปี 2569 และเป้าหมายสะสมรายเดือน',
      recordsCount: '8 เกณฑ์วัด',
      fileSize: '12.5 KB',
      updatedAt: '15 ต.ค. 2569, 17:52 น.',
      status: 'KPI 2569 Active',
      variable: 'window.KPI_MATRIX'
    },
    {
      path: 'js/data_jan.js - data_jun.js',
      title: 'ข้อมูลผลงาน AUC ย้อนหลัง ม.ค. - มิ.ย. 2569',
      role: 'ฐานข้อมูลสะสม 6 เดือนแรกของปี 2569',
      recordsCount: '2,208 รายการรวม',
      fileSize: '~2.2 MB รวม',
      updatedAt: '25 ก.ย. 2569, 17:32 น.',
      status: 'Historical Baseline',
      variable: 'window.AUC_DATA_JAN ... JUN'
    },
    {
      path: 'localStorage (Browser Cache)',
      title: 'หน่วยความจำเบราว์เซอร์เครื่องผู้ใช้งาน',
      role: 'บันทึกการปรับแต่งสี, รายการคอลัมน์ที่เลือก, แผนจำลอง Scenario',
      recordsCount: '5 ตัวแปรคอนฟิก',
      fileSize: '~150 KB',
      updatedAt: 'เรียลไทม์ (บันทึกอัตโนมัติ)',
      status: 'Local Storage Ready',
      variable: 'auc_wbs_visible_cols, AUC_SIMULATION_SCENARIO'
    }
  ];

  /**
   * System Pre-defined Audit & Modification Log Entries
   */
  const BASE_AUDIT_LOGS = [
    {
      id: 'log_000_criteria_bar_golden_crown_achievement',
      timestamp: '2026-10-26 11:00:00',
      timestampTh: '26 ต.ค. 2569, 11:00 น.',
      type: 'EDIT',
      typeBadge: 'เปลี่ยนไอคอนเป็นมงกุฎทองคำ',
      badgeClass: 'badge-type-edit',
      title: 'เปลี่ยนไอคอนบนป้ายบรรลุเป้าหมายเป็นมงกุฎสีเหลืองทอง 3D แสดงความสำเร็จ (Royal Golden Crown 👑)',
      targetSubject: 'ไอคอนเฉลิมฉลองเหนือป้าย "✓ บรรลุเป้าหมาย" ในกราฟร้อยละความสำเร็จตาม 8 เกณฑ์วัด (CriteriaFireworks, drawGoldenCrown ใน js/app.js, customLegend)',
      storageFile: 'js/app.js, js/chart.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ที่วงไว้ แก้ไขเป็นมงกุฎสวยๆ สีเหลือง แสดงความสำเร็จ" (รูปภาพวงกลมสีแดงรอบไอคอนพลุเหนือป้ายบรรลุเป้าหมายของแท่งเกณฑ์วัดที่ 5): เปลี่ยนไอคอนเหนือป้าย "✓ บรรลุเป้าหมาย" จากเดิมพลุกระดาษ ให้เป็นมงกุฎทองคำราชวงศ์ (Royal Golden Crown 👑) โทนสีเหลืองทอง 3D เงาวาว พร้อมอัญมณีมรกต ทับทิม ไพลิน และไข่มุก 5 ยอด มีประกายดาววิบวับและแอนิเมชันลอยนุ่มนวลสง่างาม ไม่บดบังป้ายหรือแถบ Legend ด้านบน และอัปเดตสัญลักษณ์ในแถบ Legend ให้เป็นมงกุฎทองคำสี #FFD700 อย่างกลมกลืน',
      details: '1) ใน js/app.js: สร้างฟังก์ชัน drawGoldenCrown(ctx, cx, cy, size, tNow) วาดมงกุฎทองคำ 5 ยอด สไตล์ 3D Luxury Metallic Gold ด้วย Linear Gradient 5 โทน (#F59E0B, #FDE047, #FFFBEB, #FBBF24, #D97706) ประดับฐานด้วยแถบทองคำและอัญมณี 3 เม็ด (มรกตเขียวตรงกลางแทนความสำเร็จ, ทับทิมแดง, ไพลินฟ้า) บนยอดทั้ง 5 ประดับด้วยไข่มุกทองคำและไข่มุกขาว พร้อมประกายดาววิบวับ (Sparkle Stars) และแสงออร่าทองคำนุ่มนวล จัดวางตำแหน่งฐานมงกุฎเหนือป้าย "✓ บรรลุเป้าหมาย" ตรงกลางพอดี มีแอนิเมชันลอยนุ่มนวล (Gentle Floating) และคง Safe Ceiling ล็อคไม่ให้ล้นไปทับ Legend ด้านบน 2) ปรับแต่ง customLegend ใน js/app.js ให้แสดงเป็น "👑 บรรลุเป้าหมาย ธ.ค. (สิ้นปี 69)" ด้วยสีทอง #FFD700 และเปิด shadowBlur สีทองเรืองแสงใน js/chart.js 3) ใน index.html: อัปเดต Cache Buster เป็น ?v=20261026_1100 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ',
      sourceFile: 'คำสั่งผู้ใช้งาน (ที่วงไว้ แก้ไขเป็นมงกุฎสวยๆ สีเหลือง แสดงความสำเร็จ พร้อมรูปภาพวงกลมสีแดงครอบไอคอนพลุ)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ยกระดับความสวยงามพรีเมียม แสดงสัญลักษณ์แห่งความสำเร็จสูงสุดอย่างสง่างาม ชัดเจน ไม่ทับซ้อน)',
    },
    {
      id: 'log_000_criteria_bar_target_label_kpi_first',
      timestamp: '2026-10-26 10:50:00',
      timestampTh: '26 ต.ค. 2569, 10:50 น.',
      type: 'EDIT',
      typeBadge: 'ปรับลำดับข้อความเป้าหมาย KPI',
      badgeClass: 'badge-type-edit',
      title: 'ปรับลำดับข้อความในป้ายเป้าหมายบนแท่งกราฟเกณฑ์วัดเป็น "KPI [เดือน] [%]" (เช่น KPI ธ.ค. 100.00%)',
      targetSubject: 'ป้ายบอกระดับเป้าหมายบนแท่งกราฟเกณฑ์วัด (#criteriaComparisonChart barTargetLines ใน js/app.js)',
      storageFile: 'js/app.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "แก้ไข อักษร KPI /เดือน / % ทุกเกนวัด": ปรับเปลี่ยนรูปแบบการจัดวางลำดับข้อความในป้ายบอกระดับเป้าหมายบนแท่งกราฟทั้ง 8 ประเภทเกณฑ์วัด จากเดิม "[เดือน] KPI [%]" (เช่น "ธ.ค. KPI 100.00%") ให้เป็น "KPI [เดือน] [%]" (เช่น "KPI ธ.ค. 100.00%", "KPI พ.ย. 95.00%", "KPI ต.ค. 90.00%", "KPI ก.ย. 80.00%", และกรณีรวบช่วงเวลาเช่น "KPI ต.ค.-ธ.ค. 100.00%") เพื่อให้อ่านเข้าใจง่ายและเป็นมาตรฐานเดียวกันทุกแท่งเกณฑ์วัด',
      details: '1) ใน js/app.js: ในฟังก์ชัน renderCriteriaComparisonBar() ปรับรูปแบบการสร้าง label ของ barTargetLines ให้คำว่า "KPI" ขึ้นต้นก่อนชื่อเดือนและเปอร์เซ็นต์ เช่น `KPI ${bt.monthName} ${valStr}` (เช่น "KPI ธ.ค. 100.00%") รวมถึงกรณีรวมช่วงเดือน เช่น `KPI ต.ค.-ธ.ค. ${valStr}` 2) ใน index.html: อัปเดต Cache Buster เป็น ?v=20261026_1050 3) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ',
      sourceFile: 'คำสั่งผู้ใช้งาน (แก้ไข อักษร KPI /เดือน / % ทุกเกนวัด)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'เล็กน้อย (ปรับปรุงความถูกต้องและความเข้าใจในการอ่านป้ายระดับเป้าหมาย KPI)',
    },
    {
      id: 'log_000_criteria_bar_disable_hover_tooltip',
      timestamp: '2026-10-26 10:45:00',
      timestampTh: '26 ต.ค. 2569, 10:45 น.',
      type: 'EDIT',
      typeBadge: 'ปิดกล่อง Tooltip กราฟเกณฑ์วัด',
      badgeClass: 'badge-type-edit',
      title: 'ปิดการแสดงผลกล่อง Tooltip ข้อมูลบนกราฟแท่งเกณฑ์วัด (#criteriaComparisonChart)',
      targetSubject: 'กล่องข้อมูล Hover Tooltip บนกราฟแท่งเปรียบเทียบ 8 เกณฑ์วัด',
      storageFile: 'js/app.js, js/chart.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "เอาที่วงกลมออก ไม่ต้องแสดง" (รูปภาพวงกลมสีแดงรอบกล่อง Tooltip ที่เด้งขึ้นมาบังแท่งกราฟ): ปิดการแสดงผลกล่อง Tooltip ข้อมูลแบบ Hover บนกราฟร้อยละความสำเร็จการปิดงานแยกตาม 8 เกณฑ์วัด (#criteriaComparisonChart) อย่างสมบูรณ์ เนื่องจากข้อมูลสรุปทั้ง % ความสำเร็จ, ป้ายระดับ KPI, ป้ายเป้าหมายรายเดือน และป้ายบรรลุเป้าหมาย ถูกแสดงไว้อย่างครบถ้วนบนตัวแท่งกราฟแล้ว การปิด Tooltip ช่วยให้หน้าจอดูสะอาดตา ไม่เกิดการบดบังแท่งกราฟข้างเคียงหรือตัวอักษรใดๆ',
      details: '1) ใน js/app.js: เพิ่ม showTooltip: false ใน chartOptions ของฟังก์ชัน renderCriteriaComparisonBar() 2) ใน js/chart.js: เพิ่มเงื่อนไขตรวจสอบ options.showTooltip !== false ใน renderBarChart() และใน drawTooltip() เพื่อป้องกันไม่ให้วาดกล่อง Tooltip ใดๆ เมื่อปิดการทำงาน 3) ใน index.html: อัปเดต Cache Buster เป็น ?v=20261026_1045 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ',
      sourceFile: 'คำสั่งผู้ใช้งาน (เอาที่วงกลมออก ไม่ต้องแสดง พร้อมแนบรูปวงกลมสีแดงครอบกล่อง Tooltip)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'เล็กน้อย (เพิ่มความชัดเจนในการดูแท่งกราฟ ไม่ถูกกล่อง Tooltip บดบังรายละเอียด)',
    },
    {
      id: 'log_000_criteria_bar_compact_party_popper_no_overlap',
      timestamp: '2026-10-26 10:35:00',
      timestampTh: '26 ต.ค. 2569, 10:35 น.',
      type: 'EDIT',
      typeBadge: 'ปรับลดพลุไม่บังตัวอักษร',
      badgeClass: 'badge-type-edit',
      title: 'ปรับพลุกระดาษไม่ให้บดบังตัวอักษร และปรับลดความหนาแน่นไม่ให้พลุออกมาเยอะเกินไป',
      targetSubject: 'พลุเฉลิมฉลองบนกราฟแท่งเกณฑ์วัด (CriteriaFireworks, achieveBadgeY, padding.top)',
      storageFile: 'js/app.js, js/chart.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "แก้ไขให้พลุ ไม่บังอักษร และปรับลดไม่ให้พลุออกมาเยอะไป": ปรับปรุงระบบพลุเฉลิมฉลอง Party Popper 🎉 บนป้าย "✓ บรรลุเป้าหมาย" ในกราฟร้อยละความสำเร็จตาม 8 เกณฑ์วัด โดย 1) เพิ่ม headroom ด้านบน (chart padding.top จาก 56px เป็น 62px) 2) ปรับขนาดกรวยพลุให้กะทัดรัดสมส่วน (coneSize 9.5-11.5px) และวางฐานกรวยบนขอบบนของป้ายพอดี ไม่ทับตัวอักษรในป้าย 3) ล็อค safeCeilingY และ ctx.clip() ที่ Y=23px เพื่อการันตีไม่ให้ริบบิ้นหรือประกายใดๆ เลยขึ้นไปทับแถบกำกับ (Legend) ด้านบน 4) ปรับลดเส้นสีริบบิ้นสะบัดเหลือ 3 เส้นจิ๋วละมุนตา (ฟ้าครามม้วนลูป, ชมพู, ทอง) พร้อมประกายดาว 1 ดวง และตัดระบบยิงเศษละอองกระดาษโปรย (confetti projectile bursts) ออก เพื่อไม่ให้พลุล้นและฟุ้งกระจายเยอะเกินไป',
      details: '1) ใน js/app.js: เพิ่ม padding.top เป็น 62px ใน chartOptions ของ renderCriteriaComparisonBar() เพื่อเพิ่มระยะ Headroom ที่ปลอดภัยระหว่างแถบ Legend และแท่งกราฟ 2) ใน CriteriaFireworks: ปรับลด coneSize เหลือ 9.5-11.5px, ตั้งฐานกรวยที่ (centerX - 10, badgeY - 0.5) เพื่อไม่ให้ทับตัวอักษร "✓ บรรลุเป้าหมาย" ในป้าย, ปรับ drawAnimatedStreamers() ให้มีเส้นสีขนาดกะทัดรัดสูงไม่เกิน 6.5px จากปากกรวย, นำระบบ confetti burst ออกทั้งหมดเพื่อลดความหนาแน่นตามสั่ง และใช้ ctx.clip() ที่ safeCeilingY = 23px เพื่อป้องกันไม่ให้ทับข้อความ Legend ด้านบนอย่างเด็ดขาด 3) ใน js/chart.js: ปรับ achieveBadgeY ให้มีระยะ offset 5px 4) ใน index.html: อัปเดต Cache Buster เป็น ?v=20261026_1035 5) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ',
      sourceFile: 'คำสั่งผู้ใช้งาน (แก้ไขให้พลุ ไม่บังอักษร และปรับลดไม่ให้พลุออกมาเยอะไป)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงการแสดงผลให้ตัวอักษร Legend และป้ายบรรลุเป้าหมายคมชัด 100% ไม่ถูกบดบัง และพลุมีความสวยงามประณีตพอดี)',
    },
    {
      id: 'log_000_wbs_target_marker_line_running_light_ascend',
      timestamp: '2026-10-26 10:20:00',
      timestampTh: '26 ต.ค. 2569, 10:20 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มไฟวิ่งล่างขึ้นบนเส้นเป้าหมาย',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มเอฟเฟกต์ไฟวิ่งล่างขึ้นบนเส้นเป้าหมาย WBS (.target-marker-line) สวยงามโดดเด่น',
      targetSubject: 'เส้นบอกระดับเป้าหมาย WBS (.target-marker-line ใน css/styles.css, js/wbs.js)',
      storageFile: 'css/styles.css, js/wbs.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "เส้นเป้าหมายแสดง ไฟวิ่ง ล่างขึ้นบนเส้น สวยๆ เด่นๆ": เพิ่มเอฟเฟกต์ลำแสงเลเซอร์ไฟวิ่ง (Running Light Beam & Leading Spark Flare) วิ่งจากล่างขึ้นบนตลอดแนวเส้นเป้าหมายสีทอง พร้อมออร่าเรืองแสงเปล่งประกาย สอดรับกับหัวลูกศร ▲ ด้านล่างที่ชี้ขึ้นสู่เส้นอย่างสวยงามโดดเด่น',
      details: '1) ใน js/wbs.js: เพิ่มอิลิเมนต์ <div class="target-marker-beam"></div> ภายใน .target-marker-line เพื่อเป็นแกนควบคุมการวิ่งของลำแสง 2) ใน css/styles.css: ออกแบบอนิเมชัน @keyframes targetLineBeamAscend และ targetLineSparkAscend วิ่งจากล่าง (bottom: -24px ตรงหัวลูกศร ▲) ขึ้นไปสู่ด้านบน (bottom: calc(100% + 4px)) ความเร็ว 1.35s ลูปต่อเนื่อง พร้อมเอฟเฟกต์ targetLineAuraGlow เรืองแสงสลับนุ่มนวล 3) ใน index.html: อัปเดต Cache Buster ของ css/styles.css เป็น ?v=20261026_1020, wbs.js เป็น ?v=20261026_1020 และ data_history.js เป็น ?v=20261026_1020 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ',
      sourceFile: 'คำสั่งผู้ใช้งาน (เส้นเป้าหมายแสดง ไฟวิ่ง ล่างขึ้นบนเส้น สวยๆ เด่นๆ)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'เล็กน้อย (เพิ่มความสวยงาม ทันสมัย และความโดดเด่นสะดุดตาของเส้นเป้าหมาย)',
    },
    {
      id: 'log_000_criteria_bar_achieve_party_popper_streamers',
      timestamp: '2026-10-26 10:15:00',
      timestampTh: '26 ต.ค. 2569, 10:15 น.',
      type: 'EDIT',
      typeBadge: 'เปลี่ยนพลุเป็นพลุกระดาษพร้อมเส้นสีเคลื่อนไหว',
      badgeClass: 'badge-type-edit',
      title: 'เปลี่ยนพลุบนป้ายบรรลุเป้าหมายเป็นรูปที่ 5 (Party Popper 🎉) พร้อมอนิเมชันเส้นสีริบบิ้นสะบัดพุ่งออกมา',
      targetSubject: 'พลุเฉลิมฉลองบนป้าย ✓ บรรลุเป้าหมาย (CriteriaFireworks ใน js/app.js, js/chart.js)',
      storageFile: 'js/app.js, js/chart.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "เปลี่ยนพลุ บนบรรลุเป้าหมาย เป็นรูปที่ 5 พร้อมให้มีการเคลื่อนไหวของ เส้นสีแสดงออกมา และปรับสัดส่วนให้พอดี": ปรับเปลี่ยนเอฟเฟกต์พลุเฉลิมฉลองบนป้าย "✓ บรรลุเป้าหมาย" (สำหรับเกณฑ์วัดที่บรรลุเป้าหมาย KPI สิ้นปี ธ.ค.) ให้เป็นรูปทรงกรวยพลุกระดาษ (Party Popper 🎉 ตามรูปที่ 5) โทนสีม่วง-ส้มทอง พร้อมระบบอนิเมชันเส้นสีริบบิ้นสะบัดพุ่งออกมา (ฟ้าครามม้วนเกลียวลูป, ชมพู, ม่วง, เขียว, เหลืองทอง) และประกายดาว 4 แฉกระยิบระยับ ปรับสัดส่วนขนาดกรวยและระยะ Headroom ด้านบนแท่งกราฟให้อยู่ในตำแหน่งพอดีสมส่วนสวยงาม',
      details: '1) ใน js/app.js: ยกเครื่องระบบ window.CriteriaFireworks โดยสร้างฟังก์ชัน drawPopperCone() วาดกรวยพลุกระดาษตามรูปที่ 5 ปรับองศาเอียง 35 องศา พร้อมจังหวะเด้งสปริง (recoil) เมื่อยิง และสร้างฟังก์ชัน drawAnimatedStreamers() วาดเส้นสีริบบิ้นสะบัด 5 เส้นพร้อมลูปม้วนเกลียวแบบ Organic Parametric Waves รวมถึงดาวประกายและจุด Confetti ลอยในอากาศ 2) ปรับขนาดกรวย coneSize อัตโนมัติตามความกว้างของแท่งกราฟ และปรับ padding.top ของ chartOptions เป็น 56px เพิ่ม Headroom ให้รับกับเส้นสีริบบิ้นได้อย่างสวยงาม 3) ใน js/chart.js: บันทึกพิกัด achieveBadgeX, achieveBadgeY, achieveBadgeW, achieveBadgeH ลงใน renderedBars เพื่อให้ CriteriaFireworks วางตำแหน่งกรวยบนป้ายได้อย่างแม่นยำเป๊ะ 4) ใน index.html: อัปเดต Cache Buster เป็น ?v=20261026_1015 5) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ',
      sourceFile: 'คำสั่งผู้ใช้งาน (เปลี่ยนพลุ บนบรรลุเป้าหมาย เป็นรูปที่ 5 พร้อมให้มีการเคลื่อนไหวของ เส้นสีแสดงออกมา และปรับสัดส่วนให้พอดี)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับเปลี่ยนรูปแบบเอฟเฟกต์เฉลิมฉลองของกราฟเกณฑ์วัดให้ตรงตามภาพต้นแบบและเพิ่มความเคลื่อนไหวที่น่าดึงดูด)',
    },
    {
      id: 'log_000_criteria_bar_target_badges_show_kpi',
      timestamp: '2026-10-26 10:05:00',
      timestampTh: '26 ต.ค. 2569, 10:05 น.',
      type: 'EDIT',
      typeBadge: 'แสดงคำว่า KPI ในป้ายเป้าหมาย',
      badgeClass: 'badge-type-edit',
      title: 'แสดงคำว่า KPI ในป้ายเป้าหมายบนแท่งกราฟเกณฑ์วัดทั้ง 8 ประเภท (เช่น ก.ย. KPI 80.00%)',
      targetSubject: 'ป้ายเป้าหมายบนแท่งกราฟเกณฑ์วัด (#criteriaComparisonChart barTargetLines ใน js/app.js, js/chart.js)',
      storageFile: 'js/app.js, js/chart.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ด้านใน ให้แสดงคำว่า KPI เพิ่ม ในกรอบที่วงไว้ และกรอบทุกอันๆ": ปรับปรุงข้อความในป้ายบอกระดับเป้าหมายบนแท่งกราฟเกณฑ์วัดทั้ง 8 ประเภท (barTargetLines) ให้มีคำว่า "KPI" กำกับ เช่น "ก.ย. KPI 80.00%", "ต.ค. KPI 90.00%", "พ.ย. KPI 95.00%", "ธ.ค. KPI 100.00%" เพื่อให้ระบุอย่างชัดเจนว่าเป็นเป้าหมาย KPI ระดับ 5 ของแต่ละช่วงเวลา และปรับปรุงฟังก์ชันการย่อขยายขนาดตัวอักษรอัตโนมัติ (auto-scaling) ให้รองรับข้อความยาวได้อย่างพอดีสวยงาม',
      details: '1) ใน js/app.js: ในฟังก์ชัน renderCriteriaComparisonBar() ปรับการสร้าง label ของ barTargetLines ทั้งเดือนเดี่ยวและเดือนที่รวมช่วงเวลา ให้แสดงคำว่า KPI เพิ่ม เช่น "${bt.monthName} KPI ${valStr}" (เช่น ก.ย. KPI 80.00%) และปรับคำอธิบายใน Legend เป็น "เป้า KPI ก.ย. (ล่าสุด)" 2) ใน js/chart.js: ปรับขอบเขตต่ำสุดของการย่อขนาดตัวอักษรอัตโนมัติของป้ายเป้าหมาย (target badge) เป็น 5.5px ป้องกันข้อความล้นกรอบเมื่อแสดงผลบนจอขนาดเล็ก 3) ใน index.html: อัปเดต Cache Buster เป็น ?v=20261026_1005 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ',
      sourceFile: 'คำสั่งผู้ใช้งาน (ด้านใน ให้แสดงคำว่า KPI เพิ่ม ในกรอบที่วงไว้ และกรอบทุกอันๆ)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'เล็กน้อย (เพิ่มความชัดเจนในการระบุเป้าหมาย KPI บนแท่งกราฟเกณฑ์วัด)',
    },
    {
      id: 'log_000_wbs_target_marker_arrow_to_tail',
      timestamp: '2026-10-26 09:58:00',
      timestampTh: '26 ต.ค. 2569, 09:58 น.',
      type: 'EDIT',
      typeBadge: 'ย้ายลูกศรป้ายเส้นเป้าหมายไปท้ายข้อความ',
      badgeClass: 'badge-type-edit',
      title: 'ย้ายตำแหน่งลูกศร ▲ ของป้ายเส้นเป้าหมายไปไว้ด้านท้ายข้อความ (เส้นเป้าหมาย (...) ▲)',
      targetSubject: 'ป้ายเส้นเป้าหมายใต้แถบดำเนินการ WBS (.target-marker-label ใน js/wbs.js)',
      storageFile: 'js/wbs.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ย้ายตำแหน่งลูกศร ที่วงไว้ ไปด้านท้ายข้อความ": ปรับแก้ตำแหน่งไอคอนลูกศรชี้ขึ้น ▲ ในป้ายบอกระดับเส้นเป้าหมาย (.target-marker-label) จากเดิมที่อยู่ด้านหน้าข้อความ ย้ายไปอยู่ด้านท้ายของข้อความ เป็น "เส้นเป้าหมาย (XX.XX ลบ.) ▲" ทำให้หัวลูกศรชี้ตรงกับแนวเส้นเป้าหมายสีทองด้านบนอย่างสวยงามแม่นยำ',
      details: '1) ใน js/wbs.js: แก้ไขมาร์กอัปของ .target-marker-label ใน renderWbsKpiComparisonCard() จาก "▲ เส้นเป้าหมาย (${formatShort(targetAmount)})" เป็น "เส้นเป้าหมาย (${formatShort(targetAmount)}) ▲" 2) ใน index.html: อัปเดต Cache Buster เป็น ?v=20261026_0958 3) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ',
      sourceFile: 'คำสั่งผู้ใช้งาน (ย้ายตำแหน่งลูกศร ที่วงไว้ ไปด้านท้ายข้อความ)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'เล็กน้อย (ปรับปรุงความสวยงามและการชี้ตำแหน่งของลูกศรให้ตรงกับเส้นเป้าหมาย)',
    },
    {
      id: 'log_000_criteria_bar_show_latest_month_in_badge',
      timestamp: '2026-10-26 09:55:00',
      timestampTh: '26 ต.ค. 2569, 09:55 น.',
      type: 'EDIT',
      typeBadge: 'แสดงเดือนล่าสุดในป้ายผลงานเกณฑ์วัด',
      badgeClass: 'badge-type-edit',
      title: 'แสดงชื่อเดือนล่าสุด (เช่น ก.ย.) ในกรอบสีทองพื้นดำของผลงานปิดงานทุกประเภทเกณฑ์วัด',
      targetSubject: 'กราฟร้อยละความสำเร็จการปิดงานแยกตาม 8 เกณฑ์วัด (#criteriaComparisonChart)',
      storageFile: 'js/app.js, js/chart.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ให้แสดง เดือนล่าสุด ในกรอบสีทอง พื้นดำ ทุกเกณวัด": ปรับปรุงป้ายผลงานจริงด้านล่างแท่งกราฟเกณฑ์วัดทั้ง 8 ประเภท (กรอบสีทอง พื้นหลังสีดำ) ให้แสดงชื่อเดือนล่าสุดกำกับคู่กับตัวเลขร้อยละความสำเร็จ (เช่น "ก.ย. 91.38%") พร้อมระบบคำนวณย่อขนาดตัวอักษรอัตโนมัติ (Auto-scaling font) ไม่ให้ข้อความล้นกรอบ',
      details: '1) ใน js/app.js: ในฟังก์ชัน renderCriteriaComparison() กำหนด latestMonthName ตามเดือนที่เลือกหรือเดือนล่าสุด (ค่าเริ่มต้น ก.ย.) และปรับ formatBarValue ให้ส่งค่าชื่อเดือนกำกับคู่กับเปอร์เซ็นต์ เช่น "ก.ย. 91.38%" 2) ใน js/chart.js: ปรับปรุงการวาดป้าย barValuePosition === "bottom" ให้คำนวณความกว้างข้อความและปรับขนาดตัวอักษร kpiFontSize อัตโนมัติ เพื่อให้ข้อความชื่อเดือนและเปอร์เซ็นต์จัดวางกึ่งกลางอย่างพอดีสมส่วน ไม่ล้นกรอบ 3) ใน index.html: อัปเดต Cache Buster เป็น ?v=20261026_0955 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ',
      sourceFile: 'คำสั่งผู้ใช้งาน (ให้แสดง เดือนล่าสุด ในกรอบสีทอง พื้นดำ ทุกเกณวัด)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'เล็กน้อย (ปรับปรุงการแสดงผลข้อมูลบนกราฟเกณฑ์วัดให้ชัดเจนและเข้าใจง่ายยิ่งขึ้น)',
    },
    {
      id: 'log_000_separate_locks_wbs_and_target_cards',
      timestamp: '2026-10-26 08:48:00',
      timestampTh: '26 ต.ค. 2569, 08:48 น.',
      type: 'CONFIG',
      typeBadge: 'แยกสิทธิ์ล็อกอิสระต่อกัน',
      badgeClass: 'badge-type-config',
      title: 'แยกระบบล็อก/ปลดล็อกให้อิสระต่อกันระหว่างแผนปิดงาน (WBS) และการ์ดเป้าหมาย โดยใช้รหัสผ่าน 225588 เดียวกัน',
      targetSubject: 'ระบบตรวจสอบสิทธิ์ Admin (การ์ดเป้าหมาย #btnToggleNext3mCards และ แผนปิดงาน WBS #btnWbsHeaderLock_planClose, #btnWbsHeaderLock_note)',
      storageFile: 'js/app.js, js/wbs.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "แก้ไข ล็อค ให้อิสระต่อกัน ระหว่างแผนปิดงาน และการ์ดเป้าหมาย แต่ใช้รหัสผ่านเดียวกัน": แยกสถานะการปลดล็อก (Authentication State) ใน sessionStorage ออกเป็น 2 ชุดอิสระ (auc_target_cards_authenticated และ auc_wbs_edit_authenticated) โดยทั้งสองส่วนยังคงใช้รหัสผ่าน Admin PIN "225588" เดียวกัน เมื่อปลดล็อกแผนปิดงานจะไม่ปลดล็อกการ์ดเป้าหมาย และเมื่อปลดล็อกหรือล็อกกลับการ์ดเป้าหมายก็จะไม่กระทบต่อการแก้ไขตาราง WBS',
      details: '1) ใน js/app.js: แยกฟังก์ชันตรวจสอบสิทธิ์เป็น isTargetCardsAuthenticated() และ isWbsEditAuthenticated() พร้อมแยกฟังก์ชันล็อกกลับเป็น logoutTargetCards() และ logoutWbsEdit() 2) ปรับปรุง openAdminPinModal(targetContext) ให้รับพารามิเตอร์ "cards" หรือ "wbs" เพื่อปรับหัวข้อคำอธิบายใน Modal ให้ตรงกับฟังก์ชันที่กำลังปลดล็อก 3) ใน verifyAdminPin(): ตรวจสอบรหัสผ่าน 225588 เดียวกัน แต่ปลดล็อกเฉพาะเป้าหมายที่เรียกใช้งาน (context) อย่างแม่นยำ 4) ใน js/wbs.js: อัปเดต renderWbsTableHead(), renderWbsTable(), openWbsEditNoteModal(), handleWbsEditLockToggle(), และ updateWbsEditLockUI() ให้ตรวจสอบและจัดการสิทธิ์ผ่าน isWbsEditAuthenticated() และ logoutWbsEdit() 5) ใน index.html: เพิ่ม id="adminPinSubtitle" และ id="adminPinDesc" และอัปเดต Cache Buster เป็น ?v=20261026_0848 6) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ',
      sourceFile: 'คำสั่งผู้ใช้งาน (แก้ไข ล็อค ให้อิสระต่อกัน ระหว่างแผนปิดงาน และการ์ดเป้าหมาย แต่ใช้รหัสผ่านเดียวกัน)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (เพิ่มความยืดหยุ่นและความปลอดภัยในการแยกสิทธิ์การแก้ไขข้อมูลและการแสดงผลอย่างอิสระ)',
    },
    {
      id: 'log_000_move_wbs_lock_btn_to_col_headers',
      timestamp: '2026-10-26 08:40:00',
      timestampTh: '26 ต.ค. 2569, 08:40 น.',
      type: 'CONFIG',
      typeBadge: 'ย้ายปุ่มปลดล็อก WBS ไปใต้หัวตาราง',
      badgeClass: 'badge-type-config',
      title: 'ย้ายปุ่มปลดล็อกแก้ไข WBS มาไว้ใต้หัวตารางคอลัมน์แผนปิดงานและหมายเหตุ พร้อมปรับขนาดให้พอดีสมส่วน',
      targetSubject: 'หัวตาราง WBS (คอลัมน์ #btnWbsHeaderLock_planClose และ #btnWbsHeaderLock_note)',
      storageFile: 'js/wbs.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ย้ายปุ่มปลดล็อค มาใต้แถวที่ชี้ ปรับขนาดให้พอดี": นำปุ่มปลดล็อกออกจากแถบเครื่องมือด้านบน แล้วย้ายมาจัดวางไว้ใต้ชื่อคอลัมน์ "แผนปิดงาน (G-Sheet)" และ "หมายเหตุ (G-Sheet)" โดยปรับขนาดให้เป็นปุ่ม Badge กะทัดรัด (font-size 0.70rem, padding 2px 8px) กึ่งกลางช่องหัวตาราง พอดีสมส่วนกับแถวป้ายข้อมูลย่อยอื่นๆ',
      details: '1) ใน index.html: ลบปุ่ม #btnToggleWbsEditLock ออกจากแถบเครื่องมือด้านบน และอัปเดต Cache Buster เป็น ?v=20261026_0840 2) ใน js/wbs.js: เพิ่ม headerMetricHtml ใน renderWbsTableHead() สำหรับคอลัมน์ planClose และ note โดยสร้างปุ่ม .btn-th-wbs-lock ใต้หัวคอลัมน์ 3) ใน js/wbs.js: ปรับปรุง handleWbsEditLockToggle() ให้ stopPropagation และอัปเดต updateWbsEditLockUI() ให้ซิงค์สถานะปุ่มใต้หัวตารางทุกตัวพร้อมกัน 4) ใน css/styles.css: เพิ่มสไตล์ .th-header-lock-badge, .btn-th-wbs-lock, .btn-th-wbs-lock.admin-unlocked รองรับ Dark/Light theme สมส่วนสวยงาม 5) บันทึกประวัติลงใน BASE_AUDIT_LOGS',
      sourceFile: 'คำสั่งผู้ใช้งาน (ย้ายปุ่มปลดล็อค มาใต้แถวที่ชี้ ปรับขนาดให้พอดี)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงตำแหน่งและขนาดปุ่มปลดล็อกให้ตรงจุดที่เกี่ยวข้องกับการแก้ไขโดยตรง)',
    },
    {
      id: 'log_000_wbs_lock_plan_note_admin_pin',
      timestamp: '2026-10-26 08:25:00',
      timestampTh: '26 ต.ค. 2569, 08:25 น.',
      type: 'CONFIG',
      typeBadge: 'ระบบล็อกแก้ไข WBS (Admin PIN)',
      badgeClass: 'badge-type-config',
      title: 'เพิ่มระบบล็อกการแก้ไขแผนปิดงานและหมายเหตุในตาราง WBS ปลดล็อกครั้งเดียวแก้ไขได้ทุกแถว',
      targetSubject: 'ตาราง WBS (#wbsMasterTable, #btnToggleWbsEditLock, คอลัมน์ planClose และ note)',
      storageFile: 'js/wbs.js, index.html, css/styles.css, js/app.js, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "และแผนปิดงาน และหมายเหตุ จะล็อคการแก้ไข ทำอย่างไร โดยปลดล็อคครั้งเดียว แก้ไขได้ทุกแถว": ล็อกการแก้ไขคอลัมน์แผนปิดงานและหมายเหตุเป็นค่าเริ่มต้น โดยแสดงไอคอน 🔒 หากคลิกแถวใดแถวหนึ่งจะเปิดหน้าต่าง Admin PIN (225588) เมื่อปลดล็อกครั้งเดียวจะสามารถแก้ไขได้ทุกแถวตลอดเซสชัน พร้อมปุ่มสลับสถานะ 🔒/🔓 บนแถบเครื่องมือตาราง WBS',
      details: '1) ใน js/wbs.js: เพิ่มการตรวจสอบสิทธิ์ isWbsAuth ใน renderWbsTable โดยแสดงปุ่ม 🔒 เมื่อล็อก และ ✏️ เมื่อปลดล็อก 2) ใน openWbsEditNoteModal: หากยังไม่ปลดล็อกจะจำรหัส WBS ไว้และเปิดโมดัล Admin PIN 3) ใน js/app.js: เมื่อยืนยันรหัส 225588 สำเร็จจะปลดล็อกทุกแถวและเปิดหน้าต่างแก้ไขแถวที่เลือกให้อัตโนมัติ 4) ใน index.html: เพิ่มปุ่ม #btnToggleWbsEditLock บนแถบเครื่องมือตาราง WBS 5) ใน css/styles.css: เพิ่มสไตล์ .btn-wbs-lock และ .btn-wbs-inline-edit.is-locked 6) บันทึกประวัติลงใน BASE_AUDIT_LOGS',
      sourceFile: 'คำสั่งผู้ใช้งาน (และแผนปิดงาน และหมายเหตุ จะล็อคการแก้ไข ทำอย่างไร โดยปลดล็อคครั้งเดียว แก้ไขได้ทุกแถว)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ป้องกันการแก้ไขข้อมูลแผนงานและหมายเหตุโดยไม่ได้รับอนุญาต)',
    },
    {
      id: 'log_000_admin_pin_toggle_visibility_btn',
      timestamp: '2026-10-26 08:07:00',
      timestampTh: '26 ต.ค. 2569, 08:07 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มปุ่มเปิด/ปิดตาดูรหัสผ่าน',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มปุ่มเปิด/ปิดตา 👁️ / 🙈 เพื่อสลับดูและซ่อนรหัสผ่าน Admin PIN ใน Modal',
      targetSubject: 'หน้าต่างกรอกรหัสผ่าน Admin (#adminPinModal, #adminPinInput, #btnTogglePinVisibility)',
      storageFile: 'index.html, js/app.js, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "เพิ่มปุ่มเปิด/ปิดตา 👁️ เพื่อดูรหัสผ่าน": เพิ่มปุ่มไอคอนตา 👁️ ทางขวาของช่องกรอกรหัสผ่าน Admin PIN เพื่อให้ผู้ใช้งานสามารถคลิกดูรหัสผ่านตัวเลข (Plain text) หรือคลิกซ้ำเพื่อปิดตา 🙈 บังรหัสผ่านเป็นจุดทึบ (••••••) ได้อย่างสะดวก',
      details: '1) ใน index.html: เพิ่มปุ่ม #btnTogglePinVisibility ภายในกล่องกรอกรหัสผ่าน พร้อมไอคอน 👁️ และตั้งค่า padding ขวาของช่อง input เป็น 2.6rem 2) ใน js/app.js: อัปเดตฟังก์ชัน toggleAdminPinVisibility() ให้สลับชนิด input.type ระหว่าง "password" และ "text" พร้อมเปลี่ยนไอคอนปุ่มสลับระหว่าง 👁️ และ 🙈 อย่างแม่นยำ รวมถึงรีเซ็ตเป็น 👁️ และ password เสมอเมื่อเปิด Modal ใหม่ 3) อัปเดต Cache Buster เป็น ?v=20261026_0807 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ',
      sourceFile: 'คำสั่งผู้ใช้งาน (เพิ่มปุ่มเปิด/ปิดตา 👁️ เพื่อดูรหัสผ่าน)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'เล็กน้อย (เพิ่มความสะดวกในการตรวจสอบความถูกต้องของรหัสผ่านขณะพิมพ์)',
    },
    {
      id: 'log_000_admin_pin_update_225588_hide_plain',
      timestamp: '2026-10-26 08:05:00',
      timestampTh: '26 ต.ค. 2569, 08:05 น.',
      type: 'CONFIG',
      typeBadge: 'เปลี่ยนรหัสผ่าน Admin PIN',
      badgeClass: 'badge-type-config',
      title: 'เปลี่ยนรหัสผ่าน Admin PIN เป็น 225588 และซ่อนการแสดงรหัสผ่านทุกจุด',
      targetSubject: 'ระบบสิทธิ์ Admin PIN (#adminPinModal, #adminPinInput ใน index.html และ js/app.js)',
      storageFile: 'js/app.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "แก้รหัสผ่าน 225588 และไม่ให้แสดงรหัสผ่าน": ปรับเปลี่ยนรหัสผ่าน Admin PIN เป็น 225588 พร้อมลบป้ายคำใบ้รหัสผ่าน (Hint) และปุ่มแสดงรหัสผ่านตา 👁️ ออกจากหน้าต่าง Modal ทั้งหมด เพื่อป้องกันการแสดงรหัสผ่านบนหน้าจอ ให้แสดงเฉพาะจุดบังรหัสผ่าน (••••••) ตลอดเวลาอย่างปลอดภัย',
      details: '1) ใน js/app.js: แก้ไข DEFAULT_ADMIN_PIN เป็น "225588" และปรับปรุงฟังก์ชัน verifyAdminPin() รองรับรหัสผ่านใหม่ พร้อมกำหนดให้ input.type เป็น password ตลอดเวลา 2) ใน index.html: ลบคำใบ้แสดงรหัสผ่าน "💡 รหัสผ่านเริ่มต้นคือ 2569", ปรับ placeholder เป็น "กรอกรหัสผ่าน Admin PIN" โดยไม่เปิดเผยรหัสผ่าน และนำปุ่มตาดูรหัสผ่าน 👁️ ออก 3) อัปเดต Cache Buster เป็น ?v=20261026_0805 4) บันทึกประวัติการแก้ไขลงใน BASE_AUDIT_LOGS ตามกฎข้อบังคับ',
      sourceFile: 'คำสั่งผู้ใช้งาน (แก้รหัสผ่าน 225588 และไม่ให้แสดงรหัสผ่าน)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ยกระดับความปลอดภัยของรหัสผ่านผู้ดูแลระบบและป้องกันการมองเห็นรหัสผ่านบนหน้าจอ)',
    },
    {
      id: 'log_000_admin_pin_modal_target_cards',
      timestamp: '2026-10-26 07:45:00',
      timestampTh: '26 ต.ค. 2569, 07:45 น.',
      type: 'CONFIG',
      typeBadge: 'ระบบสิทธิ์ Admin PIN',
      badgeClass: 'badge-type-config',
      title: 'เพิ่มไอคอนแม่กุญแจ 🔒 และระบบ Modal ยืนยันสิทธิ์ Admin PIN (2569) ก่อนเปิดการ์ดเป้าหมาย',
      targetSubject: 'ปุ่มแสดงการ์ดเป้าหมาย (#btnToggleNext3mCards) และโมดัลยืนยันสิทธิ์ Admin (#adminPinModal)',
      storageFile: 'js/app.js, index.html, css/styles.css, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "แสดงปุ่มปกติ แต่มีไอคอนแม่กุญแจ 🔒 กำกับ เมื่อคลิกจะมีหน้าต่างป๊อปอัป (Modal) ให้กรอกรหัสผ่าน Admin PIN": กำหนดให้ปุ่มแสดงการ์ดเป้าหมายแสดงไอคอน 🔒 เป็นค่าเริ่มต้น เมื่อคลิกจะเปิดหน้าต่าง Modal เพื่อให้กรอกรหัสผ่าน Admin PIN (ค่าเริ่มต้น: 2569) เมื่อยืนยันถูกต้องจะปลดล็อก เปลี่ยนไอคอนเป็น 🔓 และเปิดแสดงการ์ดเป้าหมายรายเดือนทันที พร้อมระบบจดจำสถานะสิทธิ์ผ่าน sessionStorage ตลอดเซสชัน และสามารถดับเบิลคลิกเพื่อออกจากระบบล็อกสิทธิ์ได้',
      details: 'ดำเนินการครบถ้วนตามข้อกำหนด: 1) ใน js/app.js: เพิ่มระบบตรวจสอบสิทธิ์ Admin PIN (ฟังก์ชัน isAdminAuthenticated, setAdminAuthenticated, logoutAdmin, openAdminPinModal, closeAdminPinModal, verifyAdminPin, toggleAdminPinVisibility, updateNext3mCardsButtonUI, handleNext3mCardsToggle) โดยใช้ค่ารหัสผ่านเริ่มต้น "2569" (ปีงบประมาณ 2569) และบันทึกสถานะใน sessionStorage 2) ปรับปรุงปุ่ม #btnToggleNext3mCards ให้แสดงไอคอน 🔒/🔓 กำกับคู่กับข้อความ "แสดงการ์ดเป้าหมาย" และรองรับการดับเบิลคลิกเพื่อล็อกกลับ 3) ใน index.html: เพิ่มโครงสร้างโมดัล #adminPinModal แบบ Glassmorphism หรูหรา พร้อมช่องกรอกรหัสผ่าน (Enter เพื่อยืนยัน), ปุ่มเปิด/ปิดตาดูรหัสผ่าน 👁️, ข้อความแจ้งเตือนข้อผิดพลาด และคำใบ้ค่าเริ่มต้น 4) ใน css/styles.css: เพิ่มสไตล์ .admin-pin-dialog, เอฟเฟกต์การสั่นเตือนเมื่อกรอกรหัสผิด (.pin-input-shake / @keyframes pinShakeAnim), และสถานะปลดล็อก .admin-unlocked 5) รองรับปุ่ม ESC เพื่อปิดโมดัล 6) อัปเดต Cache Buster เป็น ?v=20261026_0745 7) บันทึกประวัติการแก้ไขลงใน BASE_AUDIT_LOGS ตามข้อบังคับ',
      sourceFile: 'คำสั่งผู้ใช้งาน (แสดงปุ่มปกติ แต่มีไอคอนแม่กุญแจ 🔒 กำกับ เมื่อคลิกจะมีหน้าต่างป๊อปอัป (Modal) ให้กรอกรหัสผ่าน Admin PIN)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (จำกัดสิทธิ์เฉพาะผู้ดูแลระบบในการเปิดดูและตรวจสอบการ์ดเป้าหมายปิดงานรายเดือน)',
    },
    {
      id: 'log_000_wbs_col_selector_default_10_columns',
      timestamp: '2026-10-25 19:55:00',
      timestampTh: '25 ต.ค. 2569, 19:55 น.',
      type: 'CONFIG',
      typeBadge: 'ตั้งค่า Default 10 คอลัมน์',
      badgeClass: 'badge-type-config',
      title: 'ปรับปรุงปุ่มเลือกคอลัมน์และค่าเริ่มต้น (Default) ให้แสดง 10 คอลัมน์หลักตามภาพ',
      targetSubject: 'เมนูเลือกคอลัมน์ตาราง WBS (Column Selector Dropdown) และลำดับคอลัมน์เริ่มต้น (#btnWbsColToggle, #wbsColDropdownPanel, #wbsMasterTable)',
      storageFile: 'js/wbs.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "แก้ไข ปุ่มเลือกคอมลัม ให้ default 10 คอลัมนี้" พร้อมภาพวงกลมสีแดงที่ปุ่มเลือกคอลัมน์ 10/43: ปรับปรุงค่าเริ่มต้นของการแสดงคอลัมน์ (defaultVisible) และลำดับคอลัมน์เริ่มต้น (DEFAULT_WBS_COL_ORDER) รวมถึงปุ่ม Default ในดรอปดาวน์ให้เปิดแสดงเฉพาะ 10 คอลัมน์หลัก ได้แก่ 1. ลำดับ 2. WBS (เลขที่งาน) 3. กอง / กฟฟ. 4. คำอธิบายภาษาไทย (ชื่องาน) 5. สถานะ SAP 6. มูลค่า AUC(บาท) 7. % เบิกพัสดุ 8. % เบิก คชจ. 9. แผนปิดงาน (G-SHEET) 10. หมายเหตุ (G-SHEET) โดยซ่อนคอลัมน์ช่างคุมงาน, มูลค่าAUCที่เพิ่มขึ้น และต้นทุนจริง (ไฟล์ 05) ออกจากค่าเริ่มต้น พร้อมอัปเดต Storage Key เป็น v11 เพื่อให้มีผลกับผู้ใช้งานทันที',
      details: 'ดำเนินการครบถ้วนตามคำสั่งผู้ใช้งาน: 1) ใน js/wbs.js: กำหนด defaultVisible: false ให้กับคอลัมน์ engineer, cn41CostInc, cn41Cost05 คงเหลือคอลัมน์ defaultVisible: true จำนวน 10 คอลัมน์ตรงตามภาพ 2) ปรับ DEFAULT_WBS_COL_ORDER ให้เรียงลำดับ 10 คอลัมน์ ได้แก่ id, wbs, office, description, statusSap, cn41ActualCost, pctMatWithdraw, pctExpenseWithdraw, planClose, note 3) อัปเดต WBS_COL_STORAGE_KEY เป็น auc_wbs_visible_cols_v11 และ WBS_COL_ORDER_KEY เป็น auc_wbs_col_order_v7 เพื่อรีเซ็ตค่าแคชเบราว์เซอร์ให้แสดง 10 คอลัมน์อัตโนมัติ 4) ปรับปรุงฟังก์ชัน setWbsColsDefaultPreset() และข้อความแจ้งเตือน Toast ให้ระบุ 10 คอลัมน์ 5) ใน index.html อัปเดตป้ายตัวนับเริ่มต้นเป็น 10/43 และปรับ Tooltip ปุ่ม Default 6) อัปเดต Version Cache Buster เป็น ?v=20261025_1955 7) บันทึกประวัติการแก้ไขลงใน BASE_AUDIT_LOGS ตามข้อบังคับ',
      sourceFile: 'คำสั่งผู้ใช้งาน (แก้ไข ปุ่มเลือกคอมลัม ให้ default 10 คอลัมนี้ พร้อมภาพประกอบ)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'เล็กน้อย (ปรับปรุงมุมมองตาราง WBS ให้กระชับ สบายตา และมี 10 คอลัมน์หลักตามความต้องการ)',
    },
    {
      id: 'log_000_wbs_target_marker_label_to_bottom',
      timestamp: '2026-10-25 10:40:00',
      timestampTh: '25 ต.ค. 2569, 10:40 น.',
      type: 'EDIT',
      typeBadge: 'ย้ายป้ายเป้าหมายมาด้านล่าง',
      badgeClass: 'badge-type-edit',
      title: 'ย้ายป้ายบอกเส้นเป้าหมาย (▲ เส้นเป้าหมาย) มาอยู่ด้านล่างแถบความคืบหน้ากราฟล่าง (ยอดดำเนินการ)',
      targetSubject: 'ส่วนเปรียบเทียบเป้าหมายการปิดงานเพิ่ม WBS กราฟล่าง (ยอดดำเนินการ) .target-marker-label',
      storageFile: 'css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ย้ายมาด้านล่าง" พร้อมภาพประกอบระบุกรอบสี่เหลี่ยมสีแดงรอบป้าย "▲ เส้นเป้าหมาย (2.75 ลบ.)" และลูกศรสีแดงชี้ลงมาใต้แถบกราฟ: ปรับตำแหน่งของป้ายบอกเส้นเป้าหมาย .target-marker-label จากเดิมที่ลอยทับอยู่บนแถบความคืบหน้าสีฟ้า ให้ย้ายลงมาอยู่ใต้แถบความคืบหน้าอย่างสวยงามชัดเจน ไม่บดบังเนื้อหาหรือข้อความภายในแถบกราฟ พร้อมเพิ่มระยะ margin-bottom 2rem รองรับพื้นที่ด้านล่างอย่างลงตัว',
      details: 'ดำเนินการแก้ไขตามคำสั่งผู้ใช้งาน: 1) ใน css/styles.css ปรับตำแหน่งของ .target-marker-label ให้ใช้ top: calc(100% + 5px) และ bottom: auto เพื่อย้ายลงมาอยู่ด้านล่างแถบความคืบหน้า 2) ปรับการจัดวางแนวนอน label-left (right: -3px) และ label-right (left: -3px) ให้ตรงกับแนวเส้นเป้าหมายสีทองในแนวตั้งอย่างแม่นยำ 3) เพิ่ม margin-bottom: 2rem ให้กับ .track-progress เพื่อเว้นพื้นที่ด้านล่างอย่างโปร่งสบายตา 4) ใน index.html อัปเดต Cache Buster ของ css/styles.css เป็น ?v=20261025_1040 5) บันทึกประวัติ Audit Log 6) ทดสอบและจับภาพหน้าจอยืนยันผลลัพธ์',
      sourceFile: 'คำสั่งผู้ใช้งาน (ย้ายมาด้านล่าง พร้อมภาพประกอบ)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'เล็กน้อย (เพิ่มความชัดเจนในการอ่านข้อมูลแถบความคืบหน้ายอดดำเนินการ และแสดงป้ายบอกเส้นเป้าหมายใต้แถบกราฟอย่างเป็นระเบียบ)',
    },
    {
      id: 'log_000_wbs_always_show_original_pct_pair',
      timestamp: '2026-10-25 10:30:00',
      timestampTh: '25 ต.ค. 2569, 10:30 น.',
      type: 'EDIT',
      typeBadge: 'แสดงเปอร์เซ็นต์เดิมคู่เสมอ',
      badgeClass: 'badge-type-edit',
      title: 'แสดงค่า % เดิม (ฝั่งซ้าย) ควบคู่กับ % สุทธิ (ฝั่งขวา) เสมอ แม้ค่าไม่เปลี่ยน (+SAP เป็น 0)',
      targetSubject: 'การ์ดภาพรวม WBS (#wbsExecutiveDonutKpiCard) แถบ % ปิดงานมูลค่า AUC และ % ปิดจำนวนงาน',
      storageFile: 'js/wbs.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "หากค่าไม่เปลี่ยน ให้แสดงค่า%เดิมด้วย ไม่ให้หายไป ให้แสดงคู่เลย" พร้อมภาพประกอบระบุกากบาทสีแดง 2 จุดในแถบ % ปิดงานมูลค่า AUC และ % ปิดจำนวนงาน: ปรับเงื่อนไขการแสดงผลข้อความ % เดิม (#wbsKpiPctValSubText และ #wbsKpiJobPctSubText) ให้แสดงผลเป็นคู่เสมอ ไม่ซ่อนหายไปแม้ไม่มีการเปลี่ยนแปลง (+SAP เป็น 0) โดยแสดงข้อความ "เดิม ...%" สีขาวล้วนเด่นชัดฝั่งซ้าย และตัวเลข % สุทธิสีเหลืองทองฝั่งขวาอย่างสมบูรณ์แบบ',
      details: 'ดำเนินการแก้ไขตามคำสั่งผู้ใช้งาน: 1) ใน js/wbs.js ปรับแก้เงื่อนไขในฟังก์ชันซิงก์ข้อมูลการ์ด WBS: ยกเลิกการซ่อนเมื่อ Math.abs(netPct - basePct) <= 0.001 ให้แสดงผลค่า `เดิม ${basePctVal.toFixed(2)}%` และ `เดิม ${basePctJobs.toFixed(2)}%` เป็นคู่เคียงข้าง % สุทธิเสมอทุกกรณี 2) ปรับข้อความตัวอักษรเป็นสีขาวล้วน (#FFFFFF) ตัวหนา font-weight: 700 คมชัด 3) ใน index.html อัปเดต Cache Buster สำหรับ js/wbs.js และ js/data_history.js เป็น ?v=20261025_1030 4) บันทึกประวัติ Audit Log 5) ทดสอบและจับภาพหน้าจอยืนยันผลลัพธ์',
      sourceFile: 'คำสั่งผู้ใช้งาน (หากค่าไม่เปลี่ยน ให้แสดงค่า%เดิมด้วย ไม่ให้หายไป ให้แสดงคู่เลย พร้อมภาพประกอบ)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'เล็กน้อย (ปรับปรุงความต่อเนื่องและสม่ำเสมอในการแสดงผล % เดิมคู่กับ % สุทธิในทุกหน่วยงานแม้ไม่มีรายการปิดงานใน SAP เพิ่มเติม)',
    },
    {
      id: 'log_000_criteria_horizontal_labels_and_unit_badges',
      timestamp: '2026-10-25 10:05:00',
      timestampTh: '25 ต.ค. 2569, 10:05 น.',
      type: 'EDIT',
      typeBadge: 'ปรับป้ายเกณฑ์แนวนอน&หน่วย',
      badgeClass: 'badge-type-edit',
      title: 'ปรับป้ายชื่อเกณฑ์วัดใต้กราฟ 8 เกณฑ์วัดเป็นแนวนอนปกติ และเพิ่มป้ายหน่วยวัด (มูลค่า / งาน) ใต้แต่ละข้อ',
      targetSubject: 'กราฟเปรียบเทียบร้อยละความสำเร็จแยกตามเกณฑ์วัด (#criteriaComparisonChart) บนหน้าแดชบอร์ดหลัก',
      storageFile: 'js/chart.js, js/app.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "เกณวัดแสดงด้านล่างกราฟ ให้ปรับแนวนอนปกติ และด้านล่างเพิ่ม มูลค่า/งาน ตามเกณวัดแตละข้อด้วย" พร้อมภาพประกอบระบุลูกศรชี้จากป้ายหน่วยในเมนูตัวเลือกเกณฑ์วัดลงมายังแกน X: 1) ปรับการแสดงผลชื่อเกณฑ์วัดบนแกน X จากแนวเอียงทะแยงมุม (-55°) เป็นแนวนอนปกติ (0°) 2) วาดป้ายแคปซูลหน่วยวัดใต้ชื่อเกณฑ์วัดแต่ละข้ออย่างสวยงาม โดยข้อที่เป็นหน่วยมูลค่า (ข้อ 1.1, 1.2, 1.3, 2.1, 2.2, ข้อ 5) แสดงป้ายสีทอง "มูลค่า" และข้อที่เป็นหน่วยงาน (ข้อ 3.3 TECO D2, ข้อ 4 C02.2) แสดงป้ายสีฟ้าครามไซแอน "งาน" ตรงตามรูปแบบป้ายในเมนูดรอปดาวน์',
      details: 'ดำเนินการครบถ้วนตามคำสั่งผู้ใช้งาน: 1) ใน js/chart.js ปรับปรุง PeaChart เมื่อ options.rotateXLabels เป็น false หรือ options.showCriteriaUnitBadge เป็น true: (ก) วาดข้อความชื่อเกณฑ์วัดแนวนอนปกติกึ่งกลางแท่งกราฟ (ข) วาดป้ายแคปซูลมน (Pill Badge) กว้าง 40-54px สูง 17px พร้อม Linear Gradient และเรืองแสงเงา 5px ตามประเภทหน่วย: ป้าย "งาน" ใช้ Gradient ไซแอน (#A5F3FC -> #22D3EE -> #0EA5E9) ตัวอักษรสีเข้ม #032B3A ป้าย "มูลค่า" ใช้ Gradient เหลืองทอง PEA (#FFE08A -> #FFB81C -> #F59E0B) ตัวอักษรสีน้ำตาลเข้ม #3B1700 (ค) ขยายขอบเขต Hit-testing ของการคลิกแกน X ให้ครอบคลุมทั้งชื่อเกณฑ์วัดและป้ายหน่วยวัด เพื่อให้สามารถคลิกเลือกเกณฑ์วัดได้แม่นยำ 2) ใน js/app.js ปรับแต่งฟังก์ชัน renderCriteriaComparisonBar: ส่ง extraList พร้อมระบุ unitKind และ unitText, กำหนด rotateXLabels: false, showCriteriaUnitBadge: true และปรับ padding ด้านล่างเป็น 58px เพื่อรองรับความสูงของป้ายหน่วยอย่างสมดุล 3) ใน index.html อัปเดต Cache Buster เป็น ?v=20261025_1005 4) บันทึกประวัติการแก้ไขลงใน BASE_AUDIT_LOGS อย่างสมบูรณ์',
      sourceFile: 'คำสั่งผู้ใช้งาน (เกณวัดแสดงด้านล่างกราฟ ให้ปรับแนวนอนปกติ และด้านล่างเพิ่ม มูลค่า/งาน ตามเกณวัดแตละข้อด้วย พร้อมภาพประกอบ)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'เล็กน้อย (เพิ่มความสะดวกในการอ่านชื่อเกณฑ์วัดในแนวนอนปกติ และระบุประเภทหน่วยวัดมูลค่า/งานชัดเจนตรงตามมาตรฐานระบบ)',
    },
    {
      id: 'log_000_wbs_swap_pct_val_positions',
      timestamp: '2026-10-25 09:55:00',
      timestampTh: '25 ต.ค. 2569, 09:55 น.',
      type: 'EDIT',
      typeBadge: 'สลับตำแหน่งเปอร์เซ็นต์',
      badgeClass: 'badge-type-edit',
      title: 'สลับตำแหน่งเปอร์เซ็นต์ % เดิม (ฝั่งซ้าย) และ % สุทธิ (ฝั่งขวา) ในแถบความคืบหน้าการ์ดภาพรวม WBS',
      targetSubject: 'การ์ดภาพรวม WBS (#wbsExecutiveDonutKpiCard) ส่วนแถบความคืบหน้า % ปิดงานมูลค่า AUC และ % ปิดจำนวนงาน',
      storageFile: 'js/wbs.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "สลับตำแหน่ง กัน" พร้อมภาพประกอบระบุลูกศรสีแดงหมุนสลับตำแหน่งระหว่างตัวเลข % หลัก กับ ตัวอักษร "เดิม ...%": ย้ายข้อความ "เดิม ...%" มาอยู่ฝั่งซ้าย และย้ายตัวเลขเปอร์เซ็นต์สุทธิสีทอง (71.63% / 80.23%) ไปอยู่ฝั่งขวา เพื่อให้สอดคล้องกับทิศทางการวิ่งของแถบความคืบหน้าจากซ้ายไปขวาอย่างสมบูรณ์แบบ',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "สลับตำแหน่ง กัน" พร้อมภาพประกอบ: 1) ใน js/wbs.js สลับลำดับแท็กใน .exec-progress-val-row ทั้ง 2 แถว: (ก) แถบ % ปิดงานมูลค่า AUC สลับเอา #wbsKpiPctValSubText (เดิม 71.22%) มาไว้ฝั่งซ้าย และ #wbsKpiPctVal (71.63%) ไปไว้ฝั่งขวา (ข) แถบ % ปิดจำนวนงาน สลับเอา #wbsKpiJobPctSubText (เดิม 79.54%) มาไว้ฝั่งซ้าย และ #wbsKpiJobPctClosed (80.23%) ไปไว้ฝั่งขวา 2) อัปเดต Version Cache Buster ใน index.html เป็น ?v=20261025_0955 3) บันทึกประวัติ Audit Log 4) ทดสอบและจับภาพหน้าจอยืนยันผลลัพธ์ ถูกต้องตรงตามคำสั่งผู้ใช้งาน 100%',
      sourceFile: 'คำสั่งผู้ใช้งาน (สลับตำแหน่ง กัน พร้อมภาพประกอบ)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'เล็กน้อย (ปรับปรุงการจัดวางตำแหน่งตัวเลขเปอร์เซ็นต์ให้อ่านลำดับจากค่าเดิมไปสู่ค่าปัจจุบันได้อย่างถูกต้องและเป็นธรรมชาติ)',
    },
    {
      id: 'log_000_wbs_font_size_row_swap_and_white_color',
      timestamp: '2026-10-25 09:45:00',
      timestampTh: '25 ต.ค. 2569, 09:45 น.',
      type: 'EDIT',
      typeBadge: 'ปรับขนาดฟอนต์&ย้ายบรรทัด&สีขาว',
      badgeClass: 'badge-type-edit',
      title: 'ปรับขนาดอักษรวันที่ SAP ในกรอบสี่เหลี่ยม, ย้ายแถวเดิม (1 และ 2) ลงล่างสุด, และปรับจำนวนงาน/มูลค่า/% เดิมเป็นสีขาวทั้งหมด',
      targetSubject: 'การ์ดภาพรวม WBS (#wbsExecutiveDonutKpiCard) ทั้งส่วนหัวการ์ด, กล่องภาพรวมมูลค่า, กล่องมูลค่าปิดงานแล้ว และแถบ % ความคืบหน้า',
      storageFile: 'css/styles.css, js/wbs.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน 3 ข้อพร้อมภาพประกอบ: 1) ในวงสี่เหลี่ยมสีแดง เพิ่มขนาดตัวอักษร "สถานะ SAP แก้ไขล่าสุดวันที่ 23 ต.ค. 69" ให้ใหญ่เด่นชัด (0.88rem bold) 2) ตามหมายเลข 1 และ 2 ย้ายแถวข้อมูลเดิม (เดิม: 1,589.20 ลบ. และ (8,100 งาน)) ลงมาอยู่บรรทัดล่างสุดของกล่องปิดงานแล้ว 3) ข้อมูลเดิมทั้งหมด ได้แก่ จำนวนงานเดิม, มูลค่าเดิม และ % เดิม ให้แสดงเป็นสีขาวล้วน (#FFFFFF bold) ทั้งหมด',
      details: 'ดำเนินการครบถ้วน 3 ประการตามคำสั่งผู้ใช้งานและภาพประกอบ: 1) ใน css/styles.css ปรับขนาดฟอนต์ของ .wbs-sap-date-plain-text (ข้อความในกรอบสี่เหลี่ยมสีแดง) จากเดิม 0.72rem เป็น 0.88rem พร้อมตัวหนา font-weight: 700 และ text-shadow คมชัดเด่นชัด 2) ใน js/wbs.js สลับแถวข้อมูลใน .wbs-box-sub.sub-stacked ของกล่องปิดงานแล้ว โดยย้ายแถว 1 (มูลค่าเดิม: 1,589.20 ลบ.) และแถว 2 (จำนวนงานเดิม: (8,100 งาน)) ลงมาไว้บรรทัดล่างสุด และให้แถว + SAP (${sapTargetStatus}) ขึ้นไปอยู่บรรทัดบน 3) ปรับสีข้อมูลเดิมทุกจุด (จำนวนงานเดิม / มูลค่าเดิม / % เดิม) ให้เป็นสีขาว (#FFFFFF bold) ทั้งหมด: (ก) มูลค่าเดิมในกล่องภาพรวม (#wbsKpiTotalBaseSubText) (ข) มูลค่าเดิมในกล่องปิดงาน (#wbsKpiBaseClosedDetail) (ค) จำนวนงานเดิมในกล่องปิดงาน (#wbsKpiBaseClosedJobs) (ง) % ปิดมูลค่าเดิม และ % ปิดจำนวนงานเดิม (.wbs-pct-breakdown-tag) พร้อมรองรับทั้ง Dark และ Light Theme 4) อัปเดต Version Cache Buster ใน index.html เป็น ?v=20261025_0945 5) ทดสอบและจับภาพหน้าจอผลลัพธ์ ยืนยันความสวยงาม ถูกต้องตรงตามคำสั่งผู้ใช้งาน 100%',
      sourceFile: 'คำสั่งผู้ใช้งาน (1.วงสี่เหลี่ยม เพิ่มขนาดอักษร 2. หมายเลข 1 และ 2 ย้ายบรรทัดมาล่างสุด 3. จำนวนงาน /มูลค่า / % เดิม ให้ใช้สีขาวทั้งหมด พร้อมภาพประกอบ)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'เล็กน้อย (ปรับปรุงความคมชัดของวันที่ SAP, จัดลำดับแถวข้อมูลตามความต้องการ และปรับสีข้อความเดิมเป็นสีขาวสะอาดตาอ่านง่าย)',
    },
    {
      id: 'log_000_dashboard_lengthen_card_proportions',
      timestamp: '2026-10-25 09:15:00',
      timestampTh: '25 ต.ค. 2569, 09:15 น.',
      type: 'EDIT',
      typeBadge: 'ปรับความยาวการ์ด&สัดส่วน',
      badgeClass: 'badge-type-edit',
      title: 'ปรับความยาวการ์ดภาพรวมผู้บริหาร (#executiveDonutKpiCard) ลงมาถึงเส้นระดับล่างสุดของการ์ดกราฟ 8 เกณฑ์วัด พร้อมจัดสัดส่วนภายในให้สวยงามลงตัว',
      targetSubject: 'การ์ดภาพรวมผู้บริหาร (#tab-dashboard #executiveDonutKpiCard) และการจัดวางในโครงสร้าง top-executive-grid',
      storageFile: 'css/styles.css, js/app.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ปรับความยาวการ์ด ลงมา ถึงเส้นที่ขีด และปรับให้ได้สัดส่วน" พร้อมภาพประกอบระบุลูกศรสีแดงชี้ลงมายังเส้นขีดสีแดงระดับล่างสุดของการ์ดกราฟ 8 เกณฑ์วัด (#topCriteriaChartCard): 1) ขยายความยาว (ความสูง) ของการ์ดภาพรวมผู้บริหาร #executiveDonutKpiCard ฝั่งซ้าย ให้ขอบล่างตรงกับเส้นระดับล่างสุดของการ์ดกราฟ 8 เกณฑ์วัดพอดี ไม่เหลือช่องว่างด้านล่าง 2) ปรับสัดส่วนองค์ประกอบภายในให้สมดุลและสง่างาม เพิ่มขนาดวงกลมโดนัท KPI กลับสู่ขนาดมาตรฐาน 104px คมชัดสวยงาม ปรับระยะ padding/gap ของกล่องปิดงานแล้วและคงเหลือให้โปร่งสบายตา และแถบ % ปิดงานทั้งสองแถบมีพื้นที่หายใจกว้างขวาง แสดงผลชัดเจน 100%',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ปรับความยาวการ์ด ลงมา ถึงเส้นที่ขีด และปรับให้ได้สัดส่วน": 1) ใน css/styles.css: ปรับ #tab-dashboard #executiveDonutKpiCard ให้มี min-height 520px พร้อม padding 0.65rem 0.75rem 0.65rem และ justify-content: space-between, ปรับ .exec-donut-main-row ให้ flex: 1 1 auto จัดวางกึ่งกลางอย่างสมดุล, ปรับขนาดแคนวาสโดนัทเป็น 104px x 104px และวงกลม KPI ตรงกลางเป็น 68px x 68px, ปรับระยะห่างและขนาดตัวอักษรของกล่องสรุปมูลค่า, ปิดงานแล้ว, คงเหลือ และแถบความคืบหน้า % ทั้ง 2 ให้สมส่วนลงตัว 2) ใน js/app.js: เพิ่มฟังก์ชัน syncExecutiveDonutCardHeight() ตรวจวัดและปรับความสูงของ #executiveDonutKpiCard ให้เท่ากับขอบล่างของ #topCriteriaChartCard อัตโนมัติในทุกขนาดหน้าจอ และเชื่อมโยงผ่าน ResizeObserver 3) ใน index.html: อัปเดต Version Cache Buster เป็น ?v=20261025_0915 4) ใน js/data_history.js: บันทึกประวัติ Audit Log ตามกฎข้อบังคับ 5) ทดสอบและจับภาพหน้าจอยืนยันว่าการ์ดฝั่งซ้ายยาวลงมาถึงเส้นระดับล่างสุดของการ์ดกราฟ 8 เกณฑ์วัดอย่างแม่นยำ สวยงาม สัดส่วนลงตัวสมบูรณ์แบบ 100%',
      sourceFile: 'คำสั่งผู้ใช้งาน (ปรับความยาวการ์ด ลงมา ถึงเส้นที่ขีด และปรับให้ได้สัดส่วน พร้อมภาพประกอบ)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'เล็กน้อย (ปรับปรุงความยาวและสัดส่วนภายในการ์ดภาพรวมผู้บริหารให้สวยงามลงตัวและตรงตามแนวเส้นที่ผู้ใช้งานกำหนด)',
    },
    {
      id: 'log_000_wbs_clean_x_and_add_circle_sap_date',
      timestamp: '2026-10-25 08:50:00',
      timestampTh: '25 ต.ค. 2569, 08:50 น.',
      type: 'EDIT',
      typeBadge: 'ปรับแต่งป้ายและเพิ่มวันที่ SAP',
      badgeClass: 'badge-type-edit',
      title: 'ปรับแต่งการ์ด WBS: นำ (รวม SAP) และป้ายเพิ่ม % ออกตามกากบาท พร้อมเพิ่มตัวอักษรวันที่แก้ไข SAP ล่าสุดในกราฟเปรียบเทียบ KPI ตามวงกลม',
      targetSubject: 'การ์ดภาพรวม WBS (#wbsExecutiveDonutKpiCard) และส่วนหัวกราฟล่างเปรียบเทียบ KPI ระดับ 5 (.bar-bottom-progress .bar-header-left)',
      storageFile: 'js/wbs.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "กากบามให้เอาออก ที่วงกลมเพิ่ม อักษรวันที่แก้ไข sap ล่าสุด" พร้อมภาพประกอบระบุกากบาทสีแดง 3 จุด และวงกลมสีแดง 1 จุด: 1) เอาข้อความ "(รวม SAP)" ออกจากหัวข้อ "มูลค่าปิดงานแล้ว" 2) เอาป้าย "+0.41% ปรับปรุง" ออกจากใต้ % ปิดงานมูลค่า AUC 3) เอาป้าย "+0.69% SAP" ออกจากใต้ % ปิดจำนวนงาน คงเหลือเฉพาะตัวอักษร "เดิม ...%" 4) เพิ่มข้อความตัวอักษร "สถานะ SAP แก้ไขล่าสุด: 23 ต.ค. 69" ถัดจากป้ายเดือน ต.ค. 69 ในส่วนหัวกราฟล่าง (ยอดดำเนินการ) เป็นตัวอักษรเรียบๆ ไม่มีการ์ดตกแต่ง',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "กากบามให้เอาออก ที่วงกลมเพิ่ม อักษรวันที่แก้ไข sap ล่าสุด" พร้อมภาพประกอบ: 1) ใน js/wbs.js: นำ "(รวม SAP)" ออกจากข้อความ "• มูลค่าปิดงานแล้ว" ใน .wbs-metric-card-box.box-closed, นำป้าย <span class="badge-inc-neon"> ทั้ง 2 จุดออกจากฟังก์ชัน syncWbsSideKpiCard คงเหลือเฉพาะตัวอักษร "(เดิม xx.xx%)", และในส่วนหัว .bar-header-left ของกราฟล่าง (ยอดดำเนินการ) เพิ่ม <span class="bar-sap-date-plain">สถานะ SAP แก้ไขล่าสุด: 23 ต.ค. 69</span> ถัดจาก <span class="bar-month-pill">${selectedMonth.shortName} 69</span> พร้อมคลิกเพื่อเปิดผัง Model View ไฟล์ 04 ได้ 2) ใน css/styles.css: เพิ่มสไตล์ .bar-sap-date-plain กำหนดสี #CBD5E1 ฟอนต์ 0.74rem แบบเรียบหรูไม่มีพื้นหลังการ์ดหรือกรอบ พร้อมรองรับโหมดกลางวัน/กลางคืน (Light/Dark theme) 3) ใน index.html: อัปเดต Version Cache Buster เป็น ?v=20261025_0850 4) ใน js/data_history.js: บันทึกประวัติ Audit Log ตามกฎข้อบังคับ 5) ทดสอบและจับภาพหน้าจอผลลัพธ์ ยืนยันการแสดงผลตรงตามคำสั่งผู้ใช้งาน 100%',
      sourceFile: 'คำสั่งผู้ใช้งาน (กากบามให้เอาออก ที่วงกลมเพิ่ม อักษรวันที่แก้ไข sap ล่าสุด พร้อมภาพประกอบ)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'เล็กน้อย (ปรับปรุงความสะอาด สบายตา และความถูกต้องของข้อความตามความต้องการของผู้ใช้งาน)',
    },
    {
      id: 'log_000_wbs_header_sap_and_auc_dates_plain_text',
      timestamp: '2026-10-25 08:35:00',
      timestampTh: '25 ต.ค. 2569, 08:35 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มวันที่แก้ไขสถานะ&มูลค่า',
      badgeClass: 'badge-type-edit',
      title: 'แสดงข้อความวันที่แก้ไขล่าสุดของ สถานะ SAP (23 ต.ค. 69) และ มูลค่า AUC (22 ต.ค. 69) ในหัวการ์ด WBS คงเหลือ (ตำแหน่งหมายเลข 1)',
      targetSubject: 'ส่วนหัวการ์ดกราฟและสรุปสถานะ WBS คงเหลือ (#wbsOfficesChartTitle -> .card-header #wbsHeaderDatesPlain)',
      storageFile: 'index.html, css/styles.css, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "หมายเลข 1 ให้แสดง สถานะsap/มูลค่า วันที่แก้ไขล่าสุด เหมือนกับสี่เหลี่ยมที่วงไว้ แสดงเป็นอักษร ไม่ต้องเป็นการ์ด" พร้อมภาพลูกศรสีแดงชี้จากหัวตาราง WBS ขึ้นไปยังหัวการ์ด WBS คงเหลือ: แสดงข้อความตัวอักษรสีขาวเรียบหรู 2 บรรทัดคู่กัน (สถานะ SAP แก้ไขล่าสุด: 23 ต.ค. 69 | มูลค่า AUC(บาท) แก้ไขล่าสุด: 22 ต.ค. 69) แบบไม่มีการ์ดตกแต่ง ไม่มีพื้นหลัง และไม่มีเส้นขอบ ตามตำแหน่งหมายเลข 1 อย่างลงตัว',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "หมายเลข 1 ให้แสดง สถานะsap/มูลค่า วันที่แก้ไขล่าสุด เหมือนกับสี่เหลี่ยมที่วงไว้ แสดงเป็นอักษร ไม่ต้องเป็นการ์ด": 1) ใน index.html: เพิ่มคอมโพเนนต์ .wbs-header-dates-plain ในแถว .card-header ระหว่างป้ายมูลค่ารวมและปุ่มเลือกทุกสถานะ (ตำแหน่งหมายเลข 1) จัดวาง 2 คอลัมน์ย่อยคู่กัน (สถานะ SAP แก้ไขล่าสุด: 23 ต.ค. 69 | มูลค่า AUC(บาท) แก้ไขล่าสุด: 22 ต.ค. 69) พร้อมเชื่อมโยงการคลิกเพื่อดูผัง Model View ไฟล์ 04 และ 06 2) ใน css/styles.css: เพิ่มสไตล์ .wbs-header-dates-plain, .wbs-hdr-date-col, .wbs-hdr-date-title, .wbs-hdr-date-sub, .wbs-hdr-date-divider กำหนดเป็นตัวอักษรเรียบๆ ไม่มีการ์ดตกแต่ง และรองรับ Light Theme 3) อัปเดต Version Cache Buster ใน index.html เป็น ?v=20261025_0825 4) ใน js/data_history.js บันทึกประวัติ Audit Log 5) ทดสอบจับภาพหน้าจอ ยืนยันการแสดงผลตำแหน่งหมายเลข 1 ตรงตามแบบสี่เหลี่ยมหัวตาราง สมบูรณ์แบบ 100%',
      sourceFile: 'คำสั่งผู้ใช้งาน (หมายเลข 1 ให้แสดง สถานะsap/มูลค่า วันที่แก้ไขล่าสุด เหมือนกับสี่เหลี่ยมที่วงไว้ แสดงเป็นอักษร ไม่ต้องเป็นการ์ด)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'เล็กน้อย (เพิ่มการแสดงผลวันที่แก้ไขล่าสุดของสถานะ SAP และมูลค่า AUC ในส่วนหัวการ์ด WBS เพื่อความสะดวกและชัดเจนของผู้ใช้งาน)',
    },
    {
      id: 'log_000_overview_kpi_card_compact_pct_visible',
      timestamp: '2026-10-25 08:15:00',
      timestampTh: '25 ต.ค. 2569, 08:15 น.',
      type: 'EDIT',
      typeBadge: 'ปรับสัดส่วนการ์ดภาพรวม',
      badgeClass: 'badge-type-edit',
      title: 'ปรับสัดส่วนภายในการ์ดภาพรวมผู้บริหาร (#executiveDonutKpiCard) ให้เห็นแถบ % ปิดงาน ครบถ้วนโดยขนาดการ์ดเท่าเดิม',
      targetSubject: 'การ์ดภาพรวมมูลค่า & งาน AUC หน้าภาพรวมผู้บริหาร (#tab-dashboard #executiveDonutKpiCard)',
      storageFile: 'css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "แก้ไขให้เห็น %ปิดงาน โดยใช้ขนาการ์ดเท่าเดิม เฉพาะหน้านี้" พร้อมภาพการ์ดภาพรวม: ปรับขนาดระยะห่าง (margins/paddings), ขนาดกราฟโดนัท (90px) และขนาดฟอนต์ภายในการ์ด #executiveDonutKpiCard ในหน้าภาพรวม (Overview) ให้กระชับสมส่วน ทำให้แถบ % ปิดงานมูลค่า AUC (71.22%) และแถบ % ปิดจำนวนงาน (79.54%) พร้อมรถบริการ PEA EV วิ่งบนแถบทอง แสดงผลได้ครบถ้วนสมบูรณ์ 100% ไม่หลุดขอบล่าง โดยขนาดการ์ดภายนอกคงเดิม และไม่กระทบหน้า WBS',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "แก้ไขให้เห็น %ปิดงาน โดยใช้ขนาการ์ดเท่าเดิม เฉพาะหน้านี้": 1) ใน css/styles.css: เพิ่มสไตล์กระชับเฉพาะเจาะจง #tab-dashboard #executiveDonutKpiCard ปรับ padding เป็น 0.50rem 0.60rem 0.55rem, gap: 0.22rem 2) ปรับขนาดกล่องกราฟโดนัท .exec-donut-canvas-box และแคนวาสเป็น 90px x 90px, วงกลมคะแนน KPI ตรงกลาง .exec-donut-center-content เป็น 58px x 58px 3) ปรับกล่องปิดงานแล้วและคงเหลือให้มี padding 0.22rem 0.48rem 4) ปรับ .exec-dual-progress-section ให้มี margin-top/padding-top 0.35rem, gap 0.38rem และปรับขนาดฟอนต์ .exec-progress-big-val เป็น 1.28rem 5) อัปเดต Version Cache Buster ใน index.html เป็น ?v=20261025_0815 6) ใน js/data_history.js บันทึกประวัติ Audit Log 7) ตรวจสอบและจับภาพหน้าจอยืนยันว่าแถบ % ปิดจำนวนงานแสดงผลครบถ้วน สวยงาม สัดส่วนลงตัว โดยขนาดการ์ดภายนอกเท่าเดิม 100%',
      sourceFile: 'คำสั่งผู้ใช้งาน (แก้ไขให้เห็น %ปิดงาน โดยใช้ขนาการ์ดเท่าเดิม เฉพาะหน้านี้)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'เล็กน้อย (ปรับปรุงความสวยงามและการมองเห็นแถบ % ปิดงานในหน้าภาพรวมผู้บริหารโดยไม่กระทบขนาดการ์ดภายนอกหรือหน้าอื่นๆ)',
    },
    {
      id: 'log_000_wbs_kpi_card_white_text_no_badge',
      timestamp: '2026-10-25 07:55:00',
      timestampTh: '25 ต.ค. 2569, 07:55 น.',
      type: 'EDIT',
      typeBadge: 'ปรับสไตล์ข้อความสีขาว',
      badgeClass: 'badge-type-edit',
      title: 'ปรับข้อความ "สถานะ SAP แก้ไขล่าสุดวันที่ 23 ต.ค. 69" ให้เป็นตัวอักษรสีขาวเรียบๆ ไม่มีการ์ดตกแต่ง',
      targetSubject: 'ข้อความวันที่แก้ไขล่าสุดของสถานะ SAP ในหัวการ์ดภาพรวม WBS (#wbsExecutiveDonutKpiCard #wbsKpiSapDateText)',
      storageFile: 'js/wbs.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "คำสังล่าสุดให้แสดงอักษร สีขาว ไม่ต้องมรการ์ด": ปรับการแสดงผลข้อความ "สถานะ SAP แก้ไขล่าสุดวันที่ 23 ต.ค. 69" ในส่วนหัวการ์ดภาพรวม WBS จากเดิมที่เป็นป้ายการ์ดทรงแคปซูลเรืองแสง ให้เป็นตัวอักษรสีขาวล้วนเรียบๆ (#FFFFFF) ไม่มีพื้นหลังการ์ด ไม่มีเส้นขอบ และไม่มีเอฟเฟกต์เรืองแสง พร้อมจัดวางชิดขวาอย่างสวยงาม สบายตา',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "คำสังล่าสุดให้แสดงอักษร สีขาว ไม่ต้องมรการ์ด": 1) ใน js/wbs.js: นำคลาส .badge-new-card-pill ออก และใช้คลาส .wbs-sap-date-plain-text แสดงผลข้อความ "สถานะ SAP แก้ไขล่าสุดวันที่ 23 ต.ค. 69" ด้วยฟอนต์ขนาด 0.72rem สีขาวล้วน (#FFFFFF) 2) ใน css/styles.css: เพิ่มสไตล์ .wbs-sap-date-plain-text กำหนด background: none, border: none, box-shadow: none, padding: 0 เพื่อไม่ให้มีการ์ดตกแต่งใดๆ และรองรับ Light theme ด้วยสี #334155 3) อัปเดต Version Cache Buster ใน index.html เป็น ?v=20261025_0755 4) ทดสอบจับภาพหน้าจอ ยืนยันการแสดงผลตัวอักษรสีขาวเรียบหรู คมชัด สบายตา สมบูรณ์แบบ 100%',
      sourceFile: 'คำสั่งผู้ใช้งาน (คำสังล่าสุดให้แสดงอักษร สีขาว ไม่ต้องมรการ์ด)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'เล็กน้อย (ปรับปรุงความสบายตาและรูปแบบตัวอักษรสีขาวเรียบหรูตามความต้องการของผู้ใช้งาน)',
    },
    {
      id: 'log_000_wbs_kpi_card_badge_sap_date',
      timestamp: '2026-10-25 07:50:00',
      timestampTh: '25 ต.ค. 2569, 07:50 น.',
      type: 'EDIT',
      typeBadge: 'ปรับปรุงป้ายวันที่แก้ไข SAP',
      badgeClass: 'badge-type-edit',
      title: 'แก้ไขป้ายหัวการ์ดภาพรวม WBS เป็น "สถานะ SAP แก้ไขล่าสุดวันที่ 23 ต.ค. 69"',
      targetSubject: 'ป้ายกำกับส่วนหัวการ์ดภาพรวม WBS (#wbsExecutiveDonutKpiCard #wbsKpiNewCardBadge)',
      storageFile: 'js/wbs.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "แก้ไข ให้แสดง \"สถานะ SAP แก้ไขล่าสุดวันที่..." พร้อมภาพกรอบสี่เหลี่ยมสีแดงครอบป้าย "การ์ดใหม่ (รวมปรับปรุง)": เปลี่ยนข้อความในป้ายเป็น "สถานะ SAP แก้ไขล่าสุดวันที่ 23 ต.ค. 69" (อ้างอิงวันเวลาแก้ไขล่าสุดของไฟล์ 04 ZBUDR064) พร้อมจัดวางเลย์เอาต์หัวการ์ดให้อ่านง่าย ชัดเจน ไม่เบียด ไม่ล้นขอบ และสามารถคลิกเปิดดูผัง Model View ข้อมูลไฟล์ได้ทันที',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "แก้ไข ให้แสดง \"สถานะ SAP แก้ไขล่าสุดวันที่...": 1) ใน js/wbs.js: ปรับปรุงโครงสร้างส่วนหัวการ์ด .exec-donut-top-summary แยกแถวป้ายชื่อภาพรวม (กฟก.3 ภาพรวมมูลค่า & งาน AUC) และแถวแสดงป้ายสถานะ SAP ล่าสุด (#wbsKpiNewCardBadge) จัดชิดขวาอย่างสวยงาม พร้อมข้อความ "สถานะ SAP แก้ไขล่าสุดวันที่ 23 ต.ค. 69" 2) เพิ่มการเชื่อมโยงคลิกเปิดโมดัล Model View (openDhModelModal(\'src_04\')) เพื่อให้ผู้ใช้สามารถตรวจสอบรายละเอียดไฟล์ 04 ZBUDR064 ได้โดยตรง 3) ใน css/styles.css: เพิ่มสไตล์ Hover Effect ให้กับ .badge-new-card-pill ทั้งใน Dark และ Light theme 4) อัปเดต Version Cache Buster ใน index.html เป็น ?v=20261025_0750 5) ทดสอบเรนเดอร์และจับภาพหน้าจอผลลัพธ์ ยืนยันความสวยงามลงตัวระดับพรีเมียม',
      sourceFile: 'คำสั่งผู้ใช้งาน (แก้ไข ให้แสดง "สถานะ SAP แก้ไขล่าสุดวันที่ พร้อมภาพประกอบ)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'เล็กน้อย (ปรับปรุงความถูกต้องของป้ายข้อมูลและแสดงวันที่อัปเดตไฟล์ SAP ให้ผู้ใช้งานทราบอย่างชัดเจน)',
    },
    {
      id: 'log_000_wbs_disable_autosync_keep_manual_btn',
      timestamp: '2026-10-25 07:45:00',
      timestampTh: '25 ต.ค. 2569, 07:45 น.',
      type: 'CONFIG',
      typeBadge: 'ยกเลิก Auto-Sync Google Sheet',
      badgeClass: 'badge-type-config',
      title: 'ยกเลิกการซิงค์ Google Sheet อัตโนมัติเมื่อเปลี่ยนหน้า/สลับแท็บ โดยให้คงเหลือการซิงค์เฉพาะเมื่อกดปุ่มโดยตรงเท่านั้น',
      targetSubject: 'ระบบซิงค์ Google Sheet ข้าม 9 แท็บ (window.syncLiveNotesFromGoogleSheet ใน js/app.js, js/wbs.js, index.html)',
      storageFile: 'js/app.js, js/wbs.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ยกเลิก sync gogle sheet เมื่อเปลี่ยนหน้า ให้คงเหลือ sync เฉพาะกดปุ่มเท่านั้น" พร้อมภาพกรอบสี่เหลี่ยมสีแดงครอบปุ่ม "ซิงค์ Google Sheet": 1) ตัดคำสั่ง Auto-Sync ใน js/app.js (ฟังก์ชัน switchTab เมื่อสลับมาที่ tab-wbs) ออก 2) ตัด Event Listener ดักคลิกปุ่มนำทาง [data-tab="tab-wbs"] ใน js/wbs.js ออก 3) ตัดคำสั่ง Auto-Sync และการล้างค่าแผน/หมายเหตุใน initWbsApp() ออก เพื่อให้ระบบโหลดข้อมูลฐานหลักแสดงผลได้ทันทีรวดเร็วแบบออฟไลน์ 4) กำหนดให้การเรียก API ดึงข้อมูลสดจาก Google Sheet (getAll) ทำงานเฉพาะเมื่อผู้ใช้งานคลิกปุ่ม #btnSyncGoogleSheet เท่านั้น',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ยกเลิก sync gogle sheet เมื่อเปลี่ยนหน้า ให้คงเหลือ sync เฉพาะกดปุ่มเท่านั้น": 1) ใน js/app.js: ปรับปรุงฟังก์ชัน switchTab นำการเรียก window.syncLiveNotesFromGoogleSheet(false) ขณะสลับมาแท็บ tab-wbs ออก ทำให้การสลับแท็บไปมามีความรวดเร็ว ลื่นไหล ไม่มีการหน่วงรอหรือส่งคำขอเครือข่ายที่ไม่จำเป็น 2) ใน js/wbs.js: นำการดักจับคลิกปุ่ม [data-tab="tab-wbs"] ออกทั้งหมด 3) ใน js/wbs.js (ฟังก์ชัน initWbsApp): นำคำสั่ง Auto-Sync และการล้างค่าแผน/หมายเหตุออก เพื่อคงข้อมูลเริ่มต้นจาก js/data_wbs.js ไว้ใช้งานได้ทันที 4) คงฟังก์ชัน window.syncLiveNotesFromGoogleSheet(true) ไว้สำหรับปุ่ม #btnSyncGoogleSheet ใน index.html ให้ทำงานสมบูรณ์ 100% เมื่อผู้ใช้กดปุ่มเท่านั้น 5) อัปเดต Version Cache Buster ใน index.html เป็น ?v=20261025_0745',
      sourceFile: 'คำสั่งผู้ใช้งาน (ยกเลิก sync gogle sheet เมื่อเปลี่ยนหน้า ให้คงเหลือ sync เฉพาะกดปุ่มเท่านั้น พร้อมภาพปุ่ม)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (เพิ่มความเร็วและความราบรื่นในการสลับหน้าเว็บ ป้องกันการยิง API ซ้ำซ้อน และให้ผู้ใช้ควบคุมการซิงค์ได้อย่างแม่นยำ)',
    },
    {
      id: 'log_000_wbs_pale_green_base_bar',
      timestamp: '2026-10-25 07:40:00',
      timestampTh: '25 ต.ค. 2569, 07:40 น.',
      type: 'EDIT',
      typeBadge: 'ปรับปรุงสีแท่งกราฟเดิม',
      badgeClass: 'badge-type-edit',
      title: 'ปรับสีแท่งกราฟปิดงานเดิมให้เป็นสีเขียวจางลง เพื่อสร้างความแตกต่างชัดเจนกับสีเขียวนีออนของส่วนปรับปรุง SAP ที่เพิ่มขึ้นมา',
      targetSubject: 'แท่งกราฟมูลค่าปิดงานแล้วในการ์ดภาพรวม WBS (#wbsExecutiveDonutKpiCard .wbs-seg-base-closed)',
      storageFile: 'css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "เปลี่ยนสีแท่งเขียวเดิม ให้จางหน่อย เพราะต่างจากสีที่ปรับปรุงเพิ่มขึ้นมา" พร้อมภาพกรอบสี่เหลี่ยมสีแดงครอบแท่งเขียวเดิม: ปรับสีพื้นหลังแท่งผลงานเดิม (.wbs-seg-base-closed) จากสีเขียวมรกตเข้มสด (linear-gradient(90deg, #059669, #10B981)) ให้เป็นสีเขียวจางลงโปร่งแสงนุ่มนวล (linear-gradient(90deg, rgba(5, 150, 105, 0.38), rgba(16, 185, 129, 0.48))) พร้อมเพิ่มเส้นแบ่งขอบขาวละเอียด (border-right: 1.5px solid rgba(255, 255, 255, 0.85)) ทำให้ตัดกับสีเขียวนีออนเรืองแสง (#00FF88) ของส่วน SAP ที่เพิ่มขึ้นมาได้อย่างโดดเด่น ชัดเจน สวยงามลงตัว',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "เปลี่ยนสีแท่งเขียวเดิม ให้จางหน่อย เพราะต่างจากสีที่ปรับปรุงเพิ่มขึ้นมา": 1) ใน css/styles.css ปรับสไตล์คลาส .wbs-seg-base-closed จากเดิมที่เป็นสีเขียวสดทึบ (#059669 -> #10B981) ให้เป็นสีเขียวจางโปร่งแสงแบบนุ่มนวล linear-gradient(90deg, rgba(5, 150, 105, 0.38) 0%, rgba(16, 185, 129, 0.48) 100%) พร้อมเส้นแบ่งฝั่งขวา border-right: 1.5px solid rgba(255, 255, 255, 0.85) และ box-sizing: border-box เพื่อให้แท่งผลงานเดิมดูเป็นฐานข้อมูลตั้งต้นที่สงบนิ่ง ละมุนตา ไม่แย่งสายตา 2) ทำให้ส่วนปรับปรุงที่เพิ่มขึ้นมาจาก SAP (.wbs-seg-inc-closed) ซึ่งใช้สีเขียวนีออนสว่างสะท้อนแสง (#00FF88 พร้อม box-shadow) โดดเด่นขึ้นมาอย่างชัดเจน มองเห็นสัดส่วนการเติบโตได้ทันที 3) อัปเดต Version Cache Buster ใน index.html เป็น ?v=20261025_0740 4) ทดสอบเรนเดอร์และจับภาพหน้าจอผลลัพธ์ ยืนยันความสวยงามลงตัวระดับพรีเมียม',
      sourceFile: 'คำสั่งผู้ใช้งาน (เปลี่ยนสีแท่งเขียวเดิม ให้จางหน่อย เพราะต่างจากสีที่ปรับปรุงเพิ่มขึ้นมา พร้อมภาพประกอบ)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงระดับความคมชัดและมิติสีของแท่งกราฟปิดงาน WBS ให้จำแนกส่วนเดิมและส่วนที่ปรับปรุงเพิ่มขึ้นมาได้อย่างชัดเจน)',
    },
    {
      id: 'log_000_wbs_merge_toolbar_to_top_row_right',
      timestamp: '2026-10-25 07:25:00',
      timestampTh: '25 ต.ค. 2569, 07:25 น.',
      type: 'EDIT',
      typeBadge: 'ปรับเลย์เอาต์แถบเครื่องมือ WBS',
      badgeClass: 'badge-type-edit',
      title: 'ย้ายแถบเครื่องมือจัดการตาราง WBS (ส่งออก CSV, ซิงค์ Sheet, เลือกคอลัมน์, ข้อมูลแบ่งหน้า, ขยายเต็มจอ) ขึ้นไปไว้ที่แถวบนสุดชิดขวาในแถวเดียวกับเกณฑ์วัด',
      targetSubject: 'แถบเครื่องมือเหนือตาราง WBS (#wbsTableCard .wbs-table-top-meta-bar)',
      storageFile: 'index.html, css/styles.css, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ย้ายที่ วงกลม แถวบนชิดขวา" พร้อมภาพลูกศรชี้ขึ้นขวา: รวมแถบเครื่องมือ (ปุ่มส่งออก CSV, ปุ่มซิงค์ Google Sheet, เมนูเลือกคอลัมน์, ข้อความสถิติการแบ่งหน้า, ตัวเลือกแถวต่อหน้า และปุ่มขยายเต็มจอ) ขึ้นไปจัดวางในแถวบนสุด (.wbs-table-top-meta-bar) โดยจัดตำแหน่งชิดขวา (justify-content: flex-end) อยู่แถวเดียวกับป้ายเกณฑ์วัด (ฝั่งซ้าย) ยุบรวมแถวเครื่องมือเดิมลงได้ 1 แถว เพิ่มพื้นที่แสดงแถวตารางข้อมูล WBS ให้กว้างขวาง สบายตา และมีประสิทธิภาพสูงสุด',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ย้ายที่ วงกลม แถวบนชิดขวา": 1) ใน index.html รวม .table-header-bar เข้ากับ .wbs-table-top-meta-bar ให้เป็นแถวบนสุดแถวเดียว โดยฝั่งซ้ายคงป้าย .wbs-table-active-criteria (📌 เกณฑ์วัด) และฝั่งขวารวมปุ่มควบคุมทั้งหมดใน .wbs-table-toolbar-actions 2) ใน css/styles.css เพิ่มสไตล์ .wbs-table-toolbar-actions ให้มี display: flex; align-items: center; gap: 0.55rem; flex-wrap: wrap; justify-content: flex-end; margin-left: auto; 3) คง ID และฟังก์ชันของปุ่ม/ตัวเลือกเดิมครบถ้วน 100% 4) อัปเดต Version Cache Buster ใน index.html เป็น ?v=20261025_0725',
      sourceFile: 'คำสั่งผู้ใช้งาน (ย้ายที่ วงกลม แถวบนชิดขวา พร้อมภาพระบุ)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงเลย์เอาต์ตาราง WBS ให้กระชับ ประหยัดพื้นที่แนวตั้ง และแสดงแถวข้อมูลได้มากขึ้น)',
    },
    {
      id: 'log_000_wbs_kpi_card_adjust_font_fit',
      timestamp: '2026-10-25 07:20:00',
      timestampTh: '25 ต.ค. 2569, 07:20 น.',
      type: 'EDIT',
      typeBadge: 'ปรับขนาดอักษรไม่ให้ล้นการ์ด',
      badgeClass: 'badge-type-edit',
      title: 'ปรับขนาดตัวอักษรและตัวเลขในการ์ดภาพรวมมูลค่า & งาน AUC หน้า WBS ไม่ให้เกินขอบการ์ด',
      targetSubject: 'การ์ดภาพรวมมูลค่า & งาน AUC หน้า WBS (#wbsExecutiveDonutKpiCard)',
      storageFile: 'css/styles.css, js/data_history.js, index.html',
      changeSummary: 'ปรับขนาดตัวเลขมูลค่า (.wbs-val-number) เป็น 0.88rem, ป้ายหน่วยล้านบาท (.wbs-val-mb-pill) เป็น 0.65rem, คำนำหน้า (.wbs-val-prefix) เป็น 0.70rem และปรับขนาดความกว้างการ์ดเป็น 335px พร้อมขยายพื้นที่ภายในกล่องตัวเลข เพื่อให้ตัวเลขยอดเต็มหลักพันล้านและป้ายล้านบาทแสดงผลอยู่ภายในขอบการ์ดอย่างสวยงาม ไม่ล้นขอบ 100%',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ปรับขนาดอักษร ตัวเลข ไม่ให้เกินการ์ด" พร้อมภาพระบุวงกลมสีแดงที่บรรทัดมูลค่า 2 จุด: 1) ใน css/styles.css ปรับขนาด .wbs-val-number จาก 1.10rem เป็น 0.88rem พร้อม letter-spacing: -0.025em 2) ปรับขนาด .wbs-val-mb-pill จาก 0.72rem เป็น 0.65rem พร้อม padding 1px 4px 3) ปรับขนาด .wbs-val-prefix เป็น 0.70rem 4) ปรับ .wbs-val-line ให้มี width: 100%, box-sizing: border-box และ gap: 3px 5) ปรับ .wbs-box-title-wrap และ .wbs-card-metric-job-badge ให้มีระยะห่างพอดีไม่ชนกัน 6) ปรับขนาดความกว้างคอลัมน์การ์ด .wbs-side-summary-col เป็น width: 335px และปรับ padding การ์ดเป็น 0.85rem 0.80rem 7) อัปเดต Version Cache Buster ใน index.html เป็น ?v=20261025_0720 8) ทดสอบเรนเดอร์และจับภาพหน้าจอ ยืนยันว่าตัวเลขหลักพันล้านและป้าย ลบ. อยู่ในกรอบเรียบร้อยสวยงามสมบูรณ์แบบ',
      sourceFile: 'คำสั่งผู้ใช้งาน (ปรับขนาดอักษร ตัวเลข ไม่ให้เกินการ์ด)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงเลย์เอาต์และขนาดตัวอักษรให้พอดีกับการ์ด อ่านง่าย คมชัด สวยงามระดับพรีเมียม)',
    },
    {
      id: 'log_000_revert_kpi_month_bar_orange_amber_bg',
      timestamp: '2026-10-25 07:16:00',
      timestampTh: '25 ต.ค. 2569, 07:16 น.',
      type: 'EDIT',
      typeBadge: 'คืนค่าสีเดิมแถบเป้าหมาย',
      badgeClass: 'badge-type-edit',
      title: 'ยกเลิกการเปลี่ยนสีพื้นหลังและคืนค่าเดิมเป็นสีเขียวมรกตในแถบเป้าหมายเดือน พ.ย. ทั้ง 2 หน้าตามคำสั่งผู้ใช้งาน',
      targetSubject: 'แถบเป้าหมายที่ต้องปิดงานเพิ่ม (#next3mProjectionSection ในหน้าภาพรวม) และแถบเลือกลูกศรเป้าหมายเดือน (#wbsKpiMonthSelector ในหน้า WBS คงเหลือ)',
      storageFile: 'css/styles.css, js/data_history.js, index.html',
      changeSummary: 'ยกเลิกการปรับสีเหลืองแสด และคืนค่าสีพื้นหลังเดิมของแถบเป้าหมายเดือน พ.ย. (เซกเมนต์ที่ 2) ให้กลับเป็นสีเขียวมรกต (linear-gradient #047857 -> #10B981 -> #34D399) ทั้งในหน้า Overview และหน้า WBS คงเหลือ ครบถ้วน 100%',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ยกเลิกพื้นสีเขียวเหลืองแสด ให้คืนค่าเดิม": 1) ใน css/styles.css คืนค่า .single-bar-segment.seg-2 ในหน้า Overview กลับเป็น linear-gradient(135deg, #047857 0%, #10B981 45%, #34D399 100%) พร้อม box-shadow เดิม 2) คืนค่า .btn-wbs-kpi-month.m-seg-2 และ .active.m-seg-2 ในหน้า WBS คงเหลือ กลับเป็นโทนสีเขียวมรกตเดิม 3) อัปเดต Version Cache Buster ใน index.html เป็น ?v=20261025_0716',
      sourceFile: 'คำสั่งผู้ใช้งาน (ยกเลิกพื้นสีเขียวเหลืองแสด ให้คืนค่าเดิม)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (คืนค่าธีมสีดั้งเดิมตามคำสั่งผู้ใช้งานอย่างปลอดภัย)',
    },
    {
      id: 'log_000_kpi_month_bar_orange_amber_bg',
      timestamp: '2026-10-25 07:15:00',
      timestampTh: '25 ต.ค. 2569, 07:15 น.',
      type: 'EDIT',
      typeBadge: 'ปรับปรุงธีมสีแถบเป้าหมาย',
      badgeClass: 'badge-type-edit',
      title: 'เปลี่ยนสีพื้นหลังแถบเป้าหมายเดือน พ.ย. (จากเดิมสีเขียว) เป็นสีเหลืองแสด (Amber / Golden-Orange) สวยงาม เปล่งประกาย ทั้งหน้า Overview และ WBS คงเหลือ',
      targetSubject: 'แถบเป้าหมายที่ต้องปิดงานเพิ่ม (#next3mProjectionSection ในหน้าภาพรวม) และแถบเลือกลูกศรเป้าหมายเดือน (#wbsKpiMonthSelector ในหน้า WBS คงเหลือ)',
      storageFile: 'css/styles.css, js/data_history.js, index.html',
      changeSummary: 'เปลี่ยนสีพื้นหลังของกล่องเป้าหมายเดือน พ.ย. (เซกเมนต์ที่ 2) จากเดิมที่เป็นสีเขียว ให้เป็นโทนสีเหลืองแสด (Luminous Warm Golden Amber / Marigold) สวยงาม โดดเด่น เปล่งประกาย ทั้งในหน้าภาพรวมผู้บริหาร (Overview) และหน้าติดตามงาน WBS คงเหลือ (WBS Remaining) พร้อมคงสีชมพูหวานในเดือน ต.ค. และสีฟ้าครามในเดือน ธ.ค. ไว้อย่างกลมกลืนลงตัว',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "เปลี่ยนพื้นสีเขียวเหลืองแสด สวยๆ ทั้ง 2 หน้า" พร้อมรูปภาพระบุวงกลมสีแดงที่กล่อง พ.ย. (เซกเมนต์ที่ 2): 1) ใน css/styles.css ปรับแต่ง .single-bar-segment.seg-2 ในหน้า Overview ให้ใช้พื้นหลัง linear-gradient(135deg, #EA580C 0%, #F59E0B 40%, #FBBF24 75%, #FDE68A 100%) โทนสีเหลืองแสดเรืองแสง พร้อม text-shadow คมชัดลึก และกล่องป้ายเป้าหมาย kpi-badge โทนน้ำตาลอำพันเข้ม 2) ปรับแต่ง .btn-wbs-kpi-month.m-seg-2 และสถานะเลือก .active.m-seg-2 ในหน้า WBS คงเหลือ ให้ใช้เฉดสีเหลืองแสดอำพันเปล่งประกายเข้าชุดกันอย่างสมบูรณ์แบบ 3) ปรับปรุง Version Cache Buster ใน index.html เป็น ?v=20261025_0715',
      sourceFile: 'คำสั่งผู้ใช้งาน (เปลี่ยนพื้นสีเขียวเหลืองแสด สวยๆ ทั้ง 2 หน้า)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงโทนสีแถบเป้าหมายเดือน พ.ย. ให้อ่านง่าย คมชัด โดดเด่น สวยงามตามความต้องการของผู้ใช้งาน)',
    },
    {
      id: 'log_000_wbs_add_million_baht_display_and_comma',
      timestamp: '2026-10-24 23:40:00',
      timestampTh: '24 ต.ค. 2569, 23:40 น.',
      type: 'EDIT',
      typeBadge: 'ปรับปรุงการแสดงผลตัวเลข',
      badgeClass: 'badge-type-edit',
      title: 'ปรับข้อความ "เกณฑ์:" เป็น "เดิม:" และเพิ่มการแสดงมูลค่าเป็นหน่วย ล้านบาท (ลบ.) พร้อมใส่เครื่องหมายจุลภาค (,) ครบทุกจุดในการ์ด WBS',
      targetSubject: 'การ์ดภาพรวมมูลค่า & งาน AUC หน้า WBS (#wbsExecutiveDonutKpiCard)',
      storageFile: 'js/wbs.js, css/styles.css, js/data_history.js, index.html',
      changeSummary: 'ดำเนินการตามคำขอ: 1) ปรับข้อความ "เกณฑ์:" ในกล่องมูลค่าปิดงานแล้ว เป็น "เดิม:" ให้สอดคล้องกับกล่องด้านบน 2) เพิ่มการแสดงผลหน่วยล้านบาท (ลบ.) ต่อท้ายตัวเลขมูลค่าหลักทั้ง 2 ส่วน: (2,231.24 ลบ.) และ (1,598.25 ลบ.) 3) ใส่เครื่องหมายจุลภาค (,) ให้กับตัวเลขทุกจำนวนในการ์ดอย่างถูกต้องและสวยงาม พร้อมปรับเลย์เอาต์รายละเอียดใต้แท่งกราฟเป็น sub-stacked 2 แถวสมบูรณ์แบบ',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "แก้เป็น เดิม และในการ์ดนี้ ตัวเลขใช้ , เพิ่มการแสดง เป็น ลบ.ด้วย และมี ,": 1) ใน js/wbs.js ปรับ wbsBaseDetail จาก "เกณฑ์:" เป็น "เดิม: 1,589.20 ลบ." และ "(8,100 งาน)" พร้อมใส่เครื่องหมายจุลภาค 2) เพิ่มคอมโพเนนต์ .wbs-val-mb-pill (#wbsKpiTotalValMb, #wbsKpiClosedValMb) แสดงยอดเป็นหน่วยล้านบาท เช่น (2,231.24 ลบ.) และ (1,598.25 ลบ.) 3) ใน css/styles.css เพิ่มสไตล์ .wbs-val-mb-pill, .pill-green, และโครงสร้าง .wbs-box-sub.sub-stacked เพื่อให้ข้อมูลเดิมและ SAP แสดงเป็น 2 แถวเรียบร้อยสวยงามไม่ตัดบรรทัด 4) อัปเดต Version Cache Buster ใน index.html เป็น ?v=20261024_2340',
      sourceFile: 'คำสั่งผู้ใช้งาน (แก้เป็น เดิม และในการ์ดนี้ ตัวเลขใช้ , เพิ่มการแสดง เป็น ลบ.ด้วย และมี ,)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงการแสดงผลหน่วย ลบ. และเครื่องหมายจุลภาคให้อ่านง่าย ชัดเจน ตรงตามมาตรฐาน)',
    },
    {
      id: 'log_000_wbs_redesign_kpi_card_bar_graphs',
      timestamp: '2026-10-24 23:15:00',
      timestampTh: '24 ต.ค. 2569, 23:15 น.',
      type: 'EDIT',
      typeBadge: 'ปรับปรุงการ์ดภาพรวม WBS',
      badgeClass: 'badge-type-edit',
      title: 'ปรับปรุงการ์ด WBS: นำงานคงเหลือออก, ทำภาพรวมมูลค่าและมูลค่าปิดงานเป็นแท่งกราฟแสดงมูลค่า/งาน และทำแท่งกราฟส่วนเพิ่มเป็นสีต่างออกไป',
      targetSubject: 'การ์ดภาพรวมมูลค่า & งาน AUC หน้า WBS (#wbsExecutiveDonutKpiCard)',
      storageFile: 'js/wbs.js, css/styles.css, js/data_history.js, index.html',
      changeSummary: 'ดำเนินการตามคำขอ 4 ข้อ: 1) นำกล่องงานคงเหลือ (คงเหลือดำเนินการ) ออกจากการ์ด 2) ปรับภาพรวมมูลค่าเป็นแบบแท่งกราฟ มีอักษร มูลค่า / งาน และส่วนเพิ่ม/ลดแสดงเป็นแท่งกราฟสีต่างออกไป (ส้มอำพัน/นีออน) 3) ปรับมูลค่าปิดงานเป็นแบบแท่งกราฟ มีอักษร มูลค่า / งาน และส่วน SAP CLSD แสดงแท่งกราฟสีเขียวนีออนสว่างต่างออกไป 4) แถบ % ปิดงานมูลค่า และ % ปิดจำนวนงาน แสดงส่วนที่เพิ่มขึ้นด้วยแท่งกราฟสีเขียวนีออนเรืองแสงต่างออกไปจากสีเดิม',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน 4 ข้อ: 1) ลบกล่องคงเหลือดำเนินการ (#wbsKpiRemainVal, #wbsKpiRemainJobs) ออก 2) ปรับภาพรวมมูลค่าทั้งหมดเป็น .wbs-metric-card-box.box-total มีแท่งกราฟ .wbs-segment-track แบ่งยอดเดิม (สีม่วงคราม) และส่วนต่างเพิ่ม/ลด (สีส้มทองอำพัน) พร้อมแสดงอักษร มูลค่า และ งาน 3) ปรับมูลค่าปิดงานแล้ว (รวม SAP) เป็น .wbs-metric-card-box.box-closed มีแท่งกราฟแบ่งยอดเกณฑ์เดิม (สีเขียวมรกต) และส่วน SAP CLSD (สีเขียวนีออนสว่างสะท้อนแสง) พร้อมแสดงอักษร มูลค่า และ งาน 4) แถบ % ปิดงานมูลค่า AUC และ % ปิดจำนวนงาน ปรับเป็น .progress-fill-composite โดยช่วงเดิม (71.22% / 79.54%) เป็นลายทางทองเดิม และช่วงที่เพิ่มขึ้น (+0.41% / +0.69%) เป็นสีเขียวนีออนเรืองแสง (.fill-inc-part) ต่างออกไปอย่างชัดเจน พร้อมรถ PEA EV วิ่งที่ปลายทางรวม 5) อัปเดต Version Cache Buster ใน index.html เป็น ?v=20261024_2315',
      sourceFile: 'คำสั่งผู้ใช้งาน (แก้ไขการ์ด 1.งานคงเหลือเอาออก 2.ภาพรวมมูลค่าแท่งกราฟ 3.มูลค่าปิดงานแท่งกราฟ 4.%ปิดงานส่วนเพิ่มสีต่างออกไป)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง (ปรับปรุงโครงสร้างการ์ด WBS ให้ตอบโจทย์การมองเห็นส่วนปรับปรุงและส่วน SAP ชัดเจนเป็นเลิศ)',
    },
    {
      id: 'log_000_wbs_fix_syntax_error_badge_src',
      timestamp: '2026-10-24 22:45:00',
      timestampTh: '24 ต.ค. 2569, 22:45 น.',
      type: 'EDIT',
      typeBadge: 'แก้ไขข้อผิดพลาดสคริปต์',
      badgeClass: 'badge-type-edit',
      title: 'แก้ไขข้อผิดพลาด SyntaxError (Identifier badgeSrc declared twice) ในฟังก์ชัน syncWbsSideKpiCard คืนการแสดงผลหน้า WBS ให้สมบูรณ์ 100%',
      targetSubject: 'โมดูลติดตามงาน WBS คงเหลือ (js/wbs.js)',
      storageFile: 'js/wbs.js, js/data_history.js, index.html',
      changeSummary: 'แก้ไขข้อผิดพลาดตัวแปร badgeSrc ซ้ำในฟังก์ชัน syncWbsSideKpiCard ซึ่งทำให้ไฟล์ js/wbs.js หยุดการประมวลผล ส่งผลให้ตารางและการ์ด WBS ไม่แสดงผล หลังแก้ไข หน้า WBS คงเหลือ ทั้งการ์ดใหม่ ตาราง 25 รายการต่อหน้า และตัวกรองทั้งหมดกลับมาแสดงผลได้อย่างสมบูรณ์แบบ',
      details: 'ดำเนินการตรวจสอบและแก้ไขปัญหา "ข้อมูลหาย หน้า wbs คงเหลือ": 1) ตรวจพบ SyntaxError: Identifier badgeSrc has already been declared ที่บรรทัด 2201 ใน js/wbs.js จากการประกาศ const ซ้ำ 2 จุด 2) เปลี่ยนชื่อตัวแปรที่บรรทัด 2201 เป็น targetBadgeSrc และ targetBadgeTgt ให้ถูกต้องเฉพาะตัว 3) ทดสอบโหลดสคริปต์ wbs.js ใน Headless Browser ยืนยันว่าโหลดสำเร็จไม่มี Error 4) ทดสอบเปิดแท็บ WBS ยืนยันว่า CARD_EXISTS = true, TBODY_ROWS = 25 แถว, ตัวเลขการ์ดใหม่แสดงครบถ้วนสมบูรณ์ 5) อัปเดต Version Cache Buster ใน index.html เป็น ?v=20261024_2245',
      sourceFile: 'คำสั่งผู้ใช้งาน (ข้อมูลหาย หน้า wbs คงเหลือ)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'วิกฤต (แก้ไขข้อผิดพลาดสคริปต์ คืนการแสดงผลข้อมูลหน้า WBS คงเหลือ ทั้งระบบให้กลับมาทำงานได้อย่างถูกต้อง)',
    },
    {
      id: 'log_000_wbs_create_new_combined_kpi_card',
      timestamp: '2026-10-24 22:35:00',
      timestampTh: '24 ต.ค. 2569, 22:35 น.',
      type: 'EDIT',
      typeBadge: 'สร้างการ์ดใหม่รวมปรับปรุง',
      badgeClass: 'badge-type-edit',
      title: 'สร้างการ์ดใหม่: รวมภาพรวมมูลค่าที่เพิ่มขึ้น/ลดลง (วงกลม 1) และ รวมมูลค่า/งานปิดงานกับ SAP CLSD (วงกลม 2)',
      targetSubject: 'การ์ดภาพรวมมูลค่า & งาน AUC หน้า WBS (#wbsExecutiveDonutKpiCard -> .wbs-new-combined-kpi-card)',
      storageFile: 'js/wbs.js, css/styles.css, js/data_history.js, index.html',
      changeSummary: 'สร้างการ์ดใหม่ตามภาพที่ผู้ใช้วงกลมเลข 1 และ 2: 1) วงกลม 1: นำภาพรวมมูลค่ารวมกับมูลค่าที่เพิ่มขึ้น/ลดลง (2,231,338,464.73 + (-94,278.85) = 2,231,244,185.88 ฿) 2) วงกลม 2: นำปิดงานแล้วรวมกับ CLSD F4/F2 ทั้งมูลค่าและงาน (1,589,201,672.17 + 9,047,546.49 = 1,598,249,218.66 ฿, 8,100 + 70 = 8,170 งาน) 3) คำนวณคงเหลือสุทธิและเปอร์เซ็นต์ปิดงานใหม่เรียลไทม์ (71.63% มูลค่า และ 80.23% งาน)',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "นำมารวมกัน ภาพรวมมูลค่า ที่เพิ่มขึ้น/ลดลง แล้ว แสดงการืดใหม่, นำมารวมกัน มูลค่า/งาน ที่เพิ่มขึ้น ที่วงกลม แล้วสร้างการ์ดใหม่" พร้อมภาพวงกลมสีแดงหมายเลข 1 และ 2: 1) ใน js/wbs.js: ปรับปรุงการ์ด #wbsExecutiveDonutKpiCard เป็นการ์ดใหม่ (.wbs-new-combined-kpi-card) พร้อมป้ายกำกับ "การ์ดใหม่ (รวมปรับปรุง)" 2) ใน syncWbsSideKpiCard คำนวณยอดสุทธิ: วงกลม 1 (netTotalVal = baseTotalVal + totalCostInc), วงกลม 2 (netClosedVal = baseClosedVal + clsdSapAuc, netClosedJobs = baseClosedJobs + clsdSapCount), ยอดคงเหลือสุทธิ (netRemainVal = netTotalVal - netClosedVal), เปอร์เซ็นต์ปิดงานใหม่ (netPctVal = 71.63%, netPctJobs = 80.23%) พร้อมแถบแสดงรายละเอียดย่อยอย่างโปร่งใส 3) ใน css/styles.css: เพิ่มสไตล์ .badge-new-card-pill และ .donut-stat-breakdown-sub 4) อัปเดต Version Cache Buster ใน index.html เป็น ?v=20261024_2235',
      sourceFile: 'คำสั่งผู้ใช้งาน (นำมารวมกัน ภาพรวมมูลค่า ที่เพิ่มขึ้น/ลดลง แล้ว แสดงการืดใหม่, นำมารวมกัน มูลค่า/งาน ที่เพิ่มขึ้น ที่วงกลม แล้วสร้างการ์ดใหม่ พร้อมภาพวงกลม 1 และ 2)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง (ยกระดับการ์ดภาพรวม WBS เป็นการ์ดใหม่ที่ผสานตัวเลขทุกส่วนเข้าด้วยกันอย่างสมบูรณ์แบบ 100%)'
    },
    {
      id: 'log_000_wbs_revert_edit_status_to_rectangle',
      timestamp: '2026-10-24 22:30:00',
      timestampTh: '24 ต.ค. 2569, 22:30 น.',
      type: 'EDIT',
      typeBadge: 'ยกเลิกการย้ายตำแหน่ง',
      badgeClass: 'badge-type-edit',
      title: 'ยกเลิกการย้ายสถานะแก้ไขไปแสดงที่ตำแหน่งกากบาท และคืนค่าแสดงที่กรอบสี่เหลี่ยมด้านบนตามเดิม',
      targetSubject: 'การ์ดภาพรวมมูลค่า & งาน AUC หน้า WBS (#wbsExecutiveDonutKpiCard)',
      storageFile: 'js/wbs.js, js/data_history.js, index.html',
      changeSummary: 'ยกเลิกการย้ายสถานะแก้ไข (มูลค่า AUC ที่เพิ่มขึ้น/ลดลง) ไปไว้ที่บล็อกด้านล่าง (ตำแหน่งกากบาท) โดยคืนค่าการแสดงผลไว้ที่กรอบสี่เหลี่ยมถัดจาก ฿ ใต้ยอดรวมด้านบนตามเดิม และคืนบล็อกด้านล่างเป็นการแสดงสถานะปิดงาน SAP (CLSD F4 / CLSD F2) สีเขียวเรืองแสงตามเดิม',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ยกเลิก นำสถานะแก้ไข ที่สีเหลี่ยม ไปแสดง กากบาท ให้สวยงาม": 1) ใน js/wbs.js: คืนคอมโพเนนต์ .exec-total-inc-row (wbsKpiTotalIncBadge) ไว้ถัดจาก ฿ ใต้ยอดรวมด้านบน 2) คืนบล็อกล่าง (.stat-box-bottom) เป็น .stat-clsd-sap แสดงสถานะปิดงานใน SAP (CLSD F4 หรือ CLSD F2) ด้วยสีเขียวเรืองแสง 3) คืนฟังก์ชัน syncWbsSideKpiCard ให้ซิงก์อัปเดต wbsKpiTotalIncBadge 4) อัปเดต Version Cache Buster ใน index.html เป็น ?v=20261024_2230',
      sourceFile: 'คำสั่งผู้ใช้งาน (ยกเลิก นำสถานะแก้ไข ที่สีเหลี่ยม ไปแสดง กากบาท ให้สวยงาม)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (คืนค่าการแสดงผลสถานะแก้ไขที่ตำแหน่งกรอบสี่เหลี่ยมเดิมตามความต้องการของผู้ใช้งาน)'
    },
    {
      id: 'log_000_wbs_move_edit_status_to_cross_block',
      timestamp: '2026-10-24 22:25:00',
      timestampTh: '24 ต.ค. 2569, 22:25 น.',
      type: 'EDIT',
      typeBadge: 'ปรับปรุงตำแหน่งสถานะแก้ไข',
      badgeClass: 'badge-type-edit',
      title: 'ย้ายการแสดงผลสถานะแก้ไข (มูลค่า AUC เพิ่มขึ้น/ลดลง) จากกรอบสี่เหลี่ยมด้านบน ไปแสดงที่บล็อกล่าง (ตำแหน่งกากบาท) ให้สวยงาม',
      targetSubject: 'การ์ดภาพรวมมูลค่า & งาน AUC หน้า WBS (#wbsExecutiveDonutKpiCard)',
      storageFile: 'js/wbs.js, css/styles.css, js/data_history.js, index.html',
      changeSummary: 'ย้ายข้อมูลสถานะแก้ไข (มูลค่า AUC ที่เพิ่มขึ้น/ลดลง จากคอลัมน์ cn41CostInc ไฟล์ 06 - 05) จากกรอบสี่เหลี่ยมถัดจาก ฿ ใต้ยอดรวมด้านบน ไปแสดงที่บล็อกด้านล่างของการ์ด (ตำแหน่งกากบาทเดิมของคงเหลือ) พร้อมออกแบบการจัดวางให้สวยงามเด่นชัด แสดงยอดรวมงานคงเดิม และคงข้อมูล CLSD F4/F2 ไว้อย่างกลมกลืน',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "นำสถานะแก้ไข ที่สีเหลี่ยม ไปแสดง กากบาท ให้สวยงาม": 1) ใน js/wbs.js: นำคอมโพเนนต์ .exec-total-inc-row ออกจาก .exec-summary-val-row ด้านบน คืนความสวยงามสะอาดตาให้ยอดรวมหลักและจำนวนงาน 2) ในบล็อกด้านล่างของการ์ด (.stat-box-bottom ตำแหน่งกากบาท): ปรับเป็น .stat-edit-status แสดงหัวข้อ "สถานะแก้ไข (มูลค่า AUC)", แสดงป้าย "จำนวนงานคงเดิม X งาน" ตามคำสั่งผู้ใช้, แสดงตัวเลขมูลค่าเพิ่ม/ลดขนาดใหญ่เรืองแสง (.text-edit-inc-glow) สีเขียว/ส้มทองตามผลบวก/ลบ และมีแถบย่อยแสดงผลต่างไฟล์ 06-05 พร้อมสถานะ CLSD F4/F2 อย่างสวยงาม 3) ใน css/styles.css: เพิ่มสไตล์เรืองแสง แอนิเมชันชีพจร (pulseEditGlow) และรองรับทั้ง Dark/Light Theme 4) ใน syncWbsSideKpiCard: ซิงก์ค่าตัวเลขและสีสถานะแก้ไขตามตัวกรองแบบเรียลไทม์ 5) อัปเดต Version Cache Buster ใน index.html เป็น ?v=20261024_2225',
      sourceFile: 'คำสั่งผู้ใช้งาน (นำสถานะแก้ไข ที่สีเหลี่ยม ไปแสดง กากบาท ให้สวยงาม)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (จัดระเบียบ UI การ์ดภาพรวม WBS ให้สวยงาม ชัดเจน และสอดคล้องกับความต้องการของผู้ใช้งาน)'
    },
    {
      id: 'log_000_wbs_remove_table_top_source_chips',
      timestamp: '2026-10-24 22:20:00',
      timestampTh: '24 ต.ค. 2569, 22:20 น.',
      type: 'EDIT',
      typeBadge: 'เอาการ์ดออก 3 อัน',
      badgeClass: 'badge-type-edit',
      title: 'นำแถบการ์ดชิปที่มาไฟล์ 3 อันเหนือตาราง WBS (.wbs-table-source-chips) ออกตามคำสั่ง',
      targetSubject: 'แถบแถวบนสุดของตาราง WBS (.wbs-table-top-meta-bar -> .wbs-table-source-chips ใน index.html)',
      storageFile: 'index.html, js/data_history.js',
      changeSummary: 'นำแถบการ์ดชิปแสดงที่มาและวันที่แก้ไขไฟล์ 3 อัน (สถานะ SAP, AUC เริ่มต้น, มูลค่า AUC) ที่อยู่เหนือหัวตาราง WBS ออกทั้งหมดตามภาพที่ผู้ใช้วงกลมสีแดง',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "เอาการ์ด ออกทั้ง 3 อัน" พร้อมภาพวงกลมสีแดงที่แถบ .wbs-table-source-chips เหนือหัวตาราง WBS: 1) ใน index.html: นำคอนเทนเนอร์ .wbs-table-source-chips ที่มีการ์ดทั้ง 3 อัน (ไฟล์ 04 ZBUDR064, ไฟล์ 05 CN41, ไฟล์ 06 CN41) ออกจาก .wbs-table-top-meta-bar อย่างสมบูรณ์ 2) อัปเดต Version Cache Buster ใน index.html เป็น ?v=20261024_2220',
      sourceFile: 'คำสั่งผู้ใช้งาน (เอาการ์ด ออกทั้ง 3 อัน พร้อมภาพวงกลมสีแดงที่แถบการ์ดทั้ง 3 อันเหนือหัวตาราง WBS)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (เคลียร์พื้นที่แถบข้อมูลเหนือหัวตาราง WBS ให้สะอาดตาและกระชับ)'
    },
    {
      id: 'log_000_wbs_add_th_date_and_remove_banner_cards',
      timestamp: '2026-10-24 22:15:00',
      timestampTh: '24 ต.ค. 2569, 22:15 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มวันที่หัวตาราง & นำการ์ดออก',
      badgeClass: 'badge-type-edit',
      title: 'นำวันที่แก้ไขมาแสดงในหัวคอลัมน์ต้นทุนจริงและมูลค่า AUC และนำแถบการ์ดชิปที่มาไฟล์ 3 อันด้านบนออก',
      targetSubject: 'หัวคอลัมน์ตาราง WBS (ต้นทุนจริง cn41Cost05 & มูลค่า AUC cn41ActualCost) และแถบชิปที่มาไฟล์ด้านบน (#wbsChartHeaderSourceStrip)',
      storageFile: 'js/wbs.js, index.html & js/data_history.js',
      changeSummary: '1) นำวันที่แก้ไขล่าสุดมาแสดงต่อจากบรรทัดชื่อคอลัมน์ "ต้นทุนจริง (ไฟล์ 05)" (แก้ไขล่าสุด: 14 ต.ค. 69) และ "มูลค่า AUC(บาท)" (แก้ไขล่าสุด: 22 ต.ค. 69) เป็นตัวอักษรขนาดพอดี เรียบๆ ไม่มีการ์ดตกแต่ง 2) นำการ์ดชิปแสดงที่มาไฟล์ 3 อันด้านบน (#wbsChartHeaderSourceStrip) ออกทั้งหมดตามคำสั่ง',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน 2 ข้อ: 1. "นำ วันที่แก้ไข มาแสดงในคอลัม และปรับขนาดพอดี ต่อจากบรรทัด ต้นทุนจริง และมูลค่า เป็นแค่อักษรไม่ต้องมีการ์ดตกแต่ง" 2. "และเอาการ์ด ตามรูป 35 ออกทั้ง 3 อัน": 1) ใน js/wbs.js: ที่ฟังก์ชัน renderWbsTableHead ในหัวคอลัมน์ cn41Cost05 แทรก <div class="th-sub-date-text">แก้ไขล่าสุด: 14 ต.ค. 69</div> และใน cn41ActualCost แทรก <div class="th-sub-date-text">แก้ไขล่าสุด: 22 ต.ค. 69</div> ขนาด 0.70rem ตัวอักษรเรียบๆ ไม่มีการ์ดตกแต่ง 2) ใน index.html: นำคอมโพเนนต์ #wbsChartHeaderSourceStrip (การ์ดชิป 3 อัน ได้แก่ สถานะ SAP, AUC เริ่มต้น, มูลค่า AUC) ออกจากส่วนหัวการ์ดกราฟแท่ง WBS 3) อัปเดต Version Cache Buster ใน index.html เป็น ?v=20261024_2215',
      sourceFile: 'คำสั่งผู้ใช้งาน (นำวันที่แก้ไขมาแสดงในคอลัมน์ต้นทุนจริงและมูลค่า, เอาการ์ดออกทั้ง 3 อัน พร้อมภาพชี้ลูกศรและภาพการ์ด 3 อัน)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับปรุง UI ให้กระชับ สวยงาม และวางข้อมูลวันที่แก้ไขตรงกับคอลัมน์ที่เกี่ยวข้อง)'
    },
    {
      id: 'log_000_wbs_total_cost_inc_badge',
      timestamp: '2026-10-24 22:10:00',
      timestampTh: '24 ต.ค. 2569, 22:10 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มมูลค่าAUCเพิ่ม/ลด',
      badgeClass: 'badge-type-edit',
      title: 'แสดงมูลค่า AUC ที่เพิ่มขึ้น/ลดลงใต้ตัวเลขมูลค่ารวมในการ์ดภาพรวม WBS (โดยจำนวนงานเท่าเดิม)',
      targetSubject: 'การ์ดภาพรวมมูลค่า & งาน AUC หน้า WBS (#wbsExecutiveDonutKpiCard -> .exec-summary-val-row)',
      storageFile: 'js/wbs.js, js/data_history.js & index.html',
      changeSummary: 'แสดงผลรวมมูลค่าที่เพิ่มขึ้น/ลดลง จากคอลัมน์ตาราง "มูลค่าAUCที่เพิ่มขึ้น" (cn41CostInc: ผลต่างไฟล์ 06 - 05) อยู่ในตำแหน่งกรอบสีแดงถัดจากสัญลักษณ์ ฿ (เช่น เพิ่ม/ลด: -94,278.85 ฿) ในการ์ดภาพรวม WBS โดยจำนวนงาน 3,229 งาน ทางขวามือคงอยู่เท่าเดิม',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "แสดงมูลค่าที่เพิ่มขึ้น/ลดลง โดยใช้ข้อมูลคอลัมตาราง มูลค่าAUCที่เพิ่มขึ้น (โดยจำนวนงานเท่าเดิม)" พร้อมภาพกรอบสี่เหลี่ยมสีแดงถัดจาก ฿ ใต้ยอด 292,486,085.05 ฿: 1) ใน js/wbs.js คำนวณผลรวม totalCn41CostInc จากข้อมูล WBS ที่กรองได้ (filtered) 2) ใน #wbsExecutiveDonutKpiCard เพิ่มคอมโพเนนต์ .exec-total-val-group จัดวางยอดรวม wbsKpiTotalVal และแถบ wbsKpiTotalIncBadge แสดงมูลค่าที่เพิ่มขึ้น/ลดลงอย่างเด่นชัด 3) ใน syncWbsSideKpiCard เพิ่มฟังก์ชันซิงก์อัปเดตยอดผลรวมเพิ่ม/ลดแบบเรียลไทม์ตามตัวกรอง 4) อัปเดต Version Cache Buster ใน index.html เป็น 20261024_2210',
      sourceFile: 'คำสั่งผู้ใช้งาน (แสดงมูลค่าที่เพิ่มขึ้น/ลดลง โดยใช้ข้อมูลคอลัมตาราง มูลค่าAUCที่เพิ่มขึ้น (โดยจำนวนงานเท่าเดิม))',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (เพิ่มความชัดเจนของข้อมูลผลต่างมูลค่าเพิ่ม/ลดในระดับภาพรวม WBS)'
    },
    {
      id: 'log_000_wbs_clsd_sap_neon_and_th_date',
      timestamp: '2026-10-24 22:05:00',
      timestampTh: '24 ต.ค. 2569, 22:05 น.',
      type: 'EDIT',
      typeBadge: 'ปรับปรุงเฉพาะหน้า WBS',
      badgeClass: 'badge-type-edit',
      title: 'แทนที่บล็อกคงเหลือด้วย CLSD F4 / CLSD F2 สีเขียวเรืองแสง และแสดงวันที่แก้ไขใต้หัวคอลัมน์สถานะ SAP (เฉพาะหน้า WBS)',
      targetSubject: 'การ์ดภาพรวม WBS (#wbsExecutiveDonutKpiCard) และหัวคอลัมน์สถานะ SAP ในตาราง WBS (#wbsMasterTable thead)',
      storageFile: 'js/wbs.js, css/styles.css, js/data_history.js & index.html',
      changeSummary: '1) เฉพาะหน้า WBS คงเหลือ: นำบล็อกคงเหลือสีแดงออก และแทนที่ด้วยบล็อกแสดงมูลค่าและจำนวนงาน CLSD F4 (สำหรับเกณฑ์วัดข้อ 1, 2, 3, 5 หรือ ALL) หรือ CLSD F2 (สำหรับเกณฑ์วัดข้อ 4) ด้วยสไตล์สีเขียวเรืองแสง (Luminous Neon Green Glow) เด่นชัดสวยงาม 2) ใต้บรรทัดสถานะ SAP ในหัวคอลัมน์ตาราง WBS แสดงข้อความวันที่แก้ไขล่าสุดของไฟล์ 04 ZBUDR064 ("แก้ไขล่าสุด: 23 ต.ค. 69") ปรับขนาดพอดีตัวอักษรเรียบๆ ไม่มีการ์ดตกแต่ง 3) คืนค่าหน้า Overview เป็นค่าเดิมทั้งหมด 100%',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน 3 คำสั่ง: 1. "เอาคงเหลือออก และให้เพิ่ม ...แทน ดังนี้: 1.เพิ่มมูลค่า และ จำนวนงานที่ CLSD F4 (เงื่อนไขเกนวัดข้อ 1 2 3 5) หรือ CLSD F2 (เลือกเกณข้อ 4) 2.ใช้สีเขียวเรืองแสงให้ สวยงามเด่นชัด" 2. "นำ วันที่แก้ไข มาแสดงในคอลัม และปรับขนาดพอดี ต่อจากบรรทัด สถานะsap เป็นแค่อักษรไม่ต้องมีการ์ดตกแต่ง" 3. "ให้แก้ไขเฉพาะหน้า WBS คงเหลือเท่านั้น" และ "หน้า overview ย้อนกลับค่าเดิมทั้งหมด": 1) ใน js/wbs.js: ปรับปรุง renderWbsTargetComparisonSection ใน #wbsExecutiveDonutKpiCard นำบล็อก .stat-remain ออก และใส่บล็อก .stat-clsd-sap แสดงผลป้ายสถานะตามเกณฑ์วัด (ข้อ 4 ➔ CLSD F2, อื่นๆ ➔ CLSD F4), จำนวนงาน และยอดมูลค่ารวม พร้อมสไตล์สีเขียวเรืองแสง 2) ใน syncWbsSideKpiCard นำการคัดลอกค่า remainJobs และ remainVal ออก เพื่อรักษาค่า CLSD SAP ของหน้า WBS ไว้ไม่ให้โดนทับ 3) ใน renderWbsTableHead ใต้บรรทัดสถานะ SAP แทรก <div class="th-sub-date-text">แก้ไขล่าสุด: 23 ต.ค. 69</div> ขนาดพอดี เป็นตัวอักษรเรียบๆ ไม่มีการ์ดตกแต่ง 4) ใน css/styles.css: เพิ่มสไตล์สีเขียวเรืองแสง .donut-stat-col.stat-clsd-sap, .dot-clsd-sap, .badge-jobs-clsd-sap, .text-clsd-sap-glow พร้อม pulse animation และ light theme styles และสไตล์ .th-sub-date-text 5) ใน index.html: ย้อนกลับบล็อกคงเหลือของหน้า Overview กลับเป็นค่าเดิมทั้งหมด 100% และอัปเดต Version Cache Buster เป็น ?v=20261024_2205',
      sourceFile: 'คำสั่งผู้ใช้งาน (เอาคงเหลือออก เพิ่ม CLSD F4/F2 สีเขียวเรืองแสง, นำวันที่แก้ไขมาแสดงในคอลัมน์ต่อจากสถานะsap, แก้ไขเฉพาะหน้า WBS และ Overview ย้อนกลับค่าเดิมทั้งหมด)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุง UX/UI หน้า WBS คงเหลือให้ตรงตามเกณฑ์วัด SAP ปิดงานสมบูรณ์ และเพิ่มข้อมูลวันที่แก้ไขในหัวตาราง)'
    },
    {
      id: 'log_000_add_thousand_separators_to_numbers',
      timestamp: '2026-10-24 21:35:00',
      timestampTh: '24 ต.ค. 2569, 21:35 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มคอมม่าคั่นหลักพัน',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มเครื่องหมายจุลภาค (,) คั่นหลักพันตัวเลขบนกราฟเส้นและตาราง % เพิ่ม/ลด รายเดือน',
      targetSubject: 'กราฟเส้นแสดงแนวโน้มมูลค่า AUC (#timelineAmountChart), ป้ายตัวเลขบนจุดกราฟ (Data Point Badges), ตาราง % เพิ่ม/ลด รายเดือน (#timelineAmountGrowthTableWrap) และข้อความสรุปมูลค่าล้านบาท',
      storageFile: 'js/app.js, js/wbs.js, js/data_history.js & index.html',
      changeSummary: 'ปรับปรุงการแสดงผลตัวเลขมูลค่าระดับหลักพันขึ้นไป ให้มีเครื่องหมายจุลภาค (,) คั่นหลักพันเสมอ เช่น 1,931.31 ลบ., 2,074.26 ลบ., +1,563.80 ในป้ายกราฟเส้น ตารางผลต่างรายเดือน และ Tooltip',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "เพิ่ม , ตัวเลขด้วย" พร้อมภาพประกอบกราฟเส้นและตาราง % เพิ่ม/ลด รายเดือน: 1) ใน js/app.js แก้ไข formatValue ของกราฟเส้น timelineAmountChart ให้จัดรูปแบบด้วย toLocaleString(\'th-TH\', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) แสดงผล เช่น 1,931.31 ลบ., 2,074.26 ลบ. 2) ใน computeMonthlyGrowthData() ปรับปรุงตัวเลขผลต่างรายเดือน (totalValText, closedValText, avgTotalValText, avgClosedValText) ให้มีเครื่องหมายคอมม่าคั่นหลักพัน เช่น +1,563.80 3) ปรับปรุง formatCurrencyShort และจุดแสดงผลล้านบาท (valMillions, amtStr, fsTotMbStr ฯลฯ) ให้มีคอมม่าคั่นหลักพัน 4) ใน js/wbs.js ปรับปรุง formatFull, formatShort และ title ของ badge ให้มีคอมม่า 5) อัปเดต Version Cache Buster ใน index.html เป็น ?v=20261024_2135',
      sourceFile: 'คำสั่งผู้ใช้งาน (เพิ่ม , ตัวเลขด้วย พร้อมภาพกราฟเส้นและตาราง % เพิ่ม/ลด รายเดือน)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับปรุงความถูกต้องและสวยงามของการแสดงผลตัวเลขให้อ่านง่ายตามหลักสากล)'
    },
    {
      id: 'log_000_remove_old_labels_and_customize_file_05_cyan_color',
      timestamp: '2026-10-24 21:25:00',
      timestampTh: '24 ต.ค. 2569, 21:25 น.',
      type: 'EDIT',
      typeBadge: 'ลบชื่อเดิม & ปรับสีแท็กไฟล์ 05',
      badgeClass: 'badge-type-edit',
      title: 'ลบชื่อเดิม (เดิม: ...) ในกล่องเลือกคอลัมน์ และปรับแต่งสีไฟล์ 05 เป็นสีฟ้า Cyan เด่นชัด ไม่ซ้ำกับไฟล์อื่นและไม่เหมือนไฟล์ 06',
      targetSubject: 'กล่องเลือกคอลัมน์ WBS (Column Selector Dropdown), แท็กกลุ่มไฟล์ (05 CN41 vs 06 CN41), ชิปที่มาไฟล์ด้านบน และสีตัวเลขต้นทุนจริงไฟล์ 05',
      storageFile: 'js/wbs.js, css/styles.css, js/data_history.js & index.html',
      changeSummary: '1) ลบข้อความชื่อเดิม "(เดิม: ...)" และ property oldLabel ออกจากกล่องเลือกคอลัมน์ทั้งหมดตามชื่อจริงใน Excel 2) ปรับแต่งสีของไฟล์ 05 (05 CN41) ให้เป็นสีฟ้าไซแอน/เทอร์ควอยซ์สดใส (#22D3EE / #06B6D4) ทั้งป้ายแท็กคอลัมน์ .col-tag-05, ชิปที่มาไฟล์ .chip-auc-init, เมทริกซ์ผลรวม th/footer และตัวเลขในตาราง เพื่อให้แตกต่างจากไฟล์อื่นๆ และไม่ซ้ำกับสีส้มทองของไฟล์ 06',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "1.ชื่อเดิม ไม่ต้องมี เพราะใช้ตามชื่อคอลัมใน excel อยุ่แล้ว 2.แก้ไขสี ให้ต่างไฟล์อื่นๆ ไม่ต้องเหมือนสีไฟล์ 06": 1) ใน js/wbs.js: ลบ property oldLabel ออกจาก WBS_COL_DEFS สำหรับคอลัมน์ cn41ActualCost และ cn41Cost05, ใน renderWbsColDropdownList นำการแสดงผล "(เดิม: ...)" ออกจาก title และ span ทั้งในโหมดลำดับการแสดงและโหมดแยกตามกลุ่มไฟล์ 2) แก้ไข CSS Class ของแท็กคอลัมน์ใน renderWbsColDropdownList ให้แยกขาดระหว่าง is05 -> col-tag-05 (สีฟ้า Cyan #22D3EE) และ is06 -> col-tag-06-cn41 (สีส้มทอง Amber #FBBF24) พร้อมทั้ง col-tag-sheet (สีม่วง) 3) ใน css/styles.css: ปรับปรุง .col-tag-05 และ .wbs-src-chip.chip-auc-init ให้เป็นโทนสีฟ้าไซแอน/เทอร์ควอยซ์ ทั้งในธีมมืดและธีมสว่าง 4) ใน js/wbs.js ปรับสีตัวเลขคอลัมน์ cn41Cost05 ใน Header Badge, Summary Footer และเซลล์ข้อมูลตารางเป็นสีฟ้า #22D3EE 5) ใน js/data_history.js อัปเดต badgeColor ของ src_05 เป็น #06B6D4 6) อัปเดต Version Cache Buster ใน index.html เป็น ?v=20261024_2125',
      sourceFile: 'คำสั่งผู้ใช้งาน (1.ชื่อเดิม ไม่ต้องมี เพราะใช้ตามชื่อคอลัมใน excel อยุ่แล้ว 2.แก้ไขสี ให้ต่างไฟล์อื่นๆ ไม่ต้องเหมือนสีไฟล์ 06 พร้อมภาพวงกลมสีแดงที่ (เดิม: ต้นทุน และแท็ก 06 CN41)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุง UX/UI ความชัดเจนของชื่อคอลัมน์และแยกระบบสีของไฟล์ 05 กับ 06 อย่างเด็ดขาด)'
    },
    {
      id: 'log_000_revert_chevron_colors',
      timestamp: '2026-10-24 21:15:00',
      timestampTh: '24 ต.ค. 2569, 21:15 น.',
      type: 'EDIT',
      typeBadge: 'ย้อนคืนค่าสีเดิมแถบเดือน',
      badgeClass: 'badge-type-config',
      title: 'ยกเลิกคำสั่งแก้สี ย้อนคืนค่าสีแถบเดือน (พ.ย. สีเขียว และ ธ.ค. สีฟ้า) ทั้งหน้า Overview และ WBS คงเหลือ',
      targetSubject: 'แถบเป้าหมายที่ต้องปิดงานเพิ่มรายเดือน (#next3mProjectionSection ในหน้าภาพรวม) และแถบเลือกลูกศรเป้าหมายเดือน (#wbsKpiMonthSelector ในหน้า WBS คงเหลือ)',
      storageFile: 'css/styles.css, index.html & js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ยกเลิกคำสั่งแก้สี" และ "ย้อนคืน": ย้อนคืนค่าสีของแถบเดือนที่ 2 และ 3 กลับสู่สีเดิม (เดือนที่ 2 พ.ย. เป็นสีเขียว #10B981 และเดือนที่ 3 ธ.ค. เป็นสีฟ้า #0284C7 / #38BDF8) ทั้งแบบปกติและขณะ Active',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ยกเลิกคำสั่งแก้สี" และ "ย้อนคืน": 1) ใน css/styles.css คืนค่า .single-bar-segment.seg-2 กลับเป็น linear-gradient(#047857 -> #10B981 -> #34D399) และ .seg-3 กลับเป็น linear-gradient(#0284C7 -> #06B6D4 -> #38BDF8) 2) คืนค่า .btn-wbs-kpi-month.m-seg-2 และ .m-seg-3 ทั้งสถานะปกติและ .active กลับเป็นโทนสีเขียวและฟ้าตามเดิม 3) อัปเดต Cache Buster ของ styles.css เป็น ?v=20261024_2120',
      sourceFile: 'คำสั่งผู้ใช้งาน (ยกเลิกคำสั่งแก้สี / ย้อนคืน)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ย้อนคืนค่าสไตล์สีเดิมของแถบเดือน UI)'
    },
    {
      id: 'log_000_chevron_colors_pastel_orange_and_grey',
      timestamp: '2026-10-24 21:10:00',
      timestampTh: '24 ต.ค. 2569, 21:10 น.',
      type: 'EDIT',
      typeBadge: 'ปรับแต่งสีแถบเดือนพาสเทล',
      badgeClass: 'badge-type-edit',
      title: 'เปลี่ยนสีแถบเดือนเป้าหมายที่วงกลมเป็นสีส้มพาสเทลหวานๆ และสีเทากัลหวานๆ ทั้งหน้า Overview และ WBS คงเหลือ',
      targetSubject: 'แถบเป้าหมายที่ต้องปิดงานเพิ่มรายเดือน (Single Bar Track ในหน้า Overview) และแถบปุ่มเลือกลูกศรเป้าหมายเดือน (Chevron Buttons ในหน้า WBS คงเหลือ)',
      storageFile: 'css/styles.css, index.html & js/data_history.js',
      changeSummary: 'เปลี่ยนสีแถบเดือนที่วงกลมสีแดง (เดือนที่ 2 และ 3: พ.ย. และ ธ.ค.) ให้เป็นสีส้มพาสเทลหวานๆ (Sweet Pastel Peach-Orange) และสีเทากัลหวานๆ (Sweet Pastel Galvanized Grey / Soft Silver Slate) ทั้งแบบปกติและตอน Active ทั้งในหน้าภาพรวมผู้บริหาร (Overview) และหน้า WBS คงเหลือ',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ที่วงกลมเปลี่ยนสีส้ม พาสเทลหวานๆ และสีเทากัล หวานๆ ทั้ง หน้า over view และ wbs คงเหลือ": 1) หน้า Overview (.single-bar-segment): ปรับ .seg-2 เป็นสีส้มพาสเทลหวานๆ (linear-gradient #EA580C -> #F97316 -> #FB923C -> #FFEDD5) พร้อม text-shadow และ badge เข้าชุด, ปรับ .seg-3 เป็นสีเทากัลหวานๆ (linear-gradient #475569 -> #64748B -> #94A3B8 -> #F1F5F9) 2) หน้า WBS คงเหลือ (.btn-wbs-kpi-month): ปรับ .m-seg-2 และ .active.m-seg-2 เป็นสีส้มพาสเทลหวานๆ เปล่งประกาย, ปรับ .m-seg-3 และ .active.m-seg-3 เป็นสีเทากัลหวานๆ ซิลเวอร์พาสเทลหรูหรา 3) อัปเดต Cache Buster ของ styles.css เป็น ?v=20261024_2110',
      sourceFile: 'คำสั่งผู้ใช้งาน (ที่วงกลมเปลี่ยนสีส้ม พาสเทลหวานๆ และสีเทากัล หวานๆ ทั้ง หน้า over view และ wbs คงเหลือ พร้อมภาพประกอบวงกลมสีแดง)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับแต่งธีมสีและสไตล์ความสวยงามของแถบเดือน UI)'
    },
    {
      id: 'log_000_add_file_05_and_auc_increase_col',
      timestamp: '2026-10-24 20:55:00',
      timestampTh: '24 ต.ค. 2569, 20:55 น.',
      type: 'MERGE',
      typeBadge: 'นำเข้าไฟล์ 05 & คำนวณมูลค่าAUCที่เพิ่มขึ้น',
      badgeClass: 'badge-type-merge',
      title: 'นำเข้าไฟล์ 05 WBS CN41 ผูกกับ WBS ไฟล์ 03 เท่านั้น (2,083 งาน) และสร้างคอลัมน์ใหม่ "มูลค่าAUCที่เพิ่มขึ้น" (ไฟล์ 06 - ไฟล์ 05)',
      targetSubject: 'ฐานข้อมูล WBS (js/data_wbs.js), ชิปที่มาไฟล์ด้านบน (index.html), ตาราง WBS ตามรูปที่ 26 และกล่องเลือกคอลัมน์ (js/wbs.js)',
      storageFile: 'js/data_wbs.js, index.html, css/styles.css, js/wbs.js & js/data_history.js',
      changeSummary: '1) นำเข้าไฟล์ 05 WBS CN41 วันเริ่มบัญชี 14 ตค 69.xlsx ผูกรหัส WBS เฉพาะไฟล์ 03 (2,083 งาน) ยอดรวม 643,241,099.93 บาท โดยไม่แตะต้องไฟล์ 06 2) สร้างคอลัมน์ "มูลค่าAUCที่เพิ่มขึ้น" ในตาราง WBS ต่อจากมูลค่า AUC(บาท) ตามรูปที่ 26 คำนวณจาก [ไฟล์ 06 ต้นทุนจริง] - [ไฟล์ 05 ต้นทุนจริง] ผลต่างรวม -94,278.85 บาท 3) แสดงชิปที่มาไฟล์ 05 และวันแก้ไข (14 ต.ค. 69) ด้านบน 4) รองรับทุกเมนูและกล่องเลือกคอลัมน์',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน 4 ข้อ: 1) นำเข้าข้อมูลจากไฟล์ "05 WBS CN41 มูลค่า AUC วันเริ่มบัญชี 14 ตค 69.xlsx" (339.0 KB) โดยผูกเฉพาะกับรหัส WBS ของไฟล์ 03 เท่านั้น (2,083 รายการ) โดยรักษาข้อมูลไฟล์ 06 และไฟล์อื่นๆ ไว้ 100% 2) บันทึกฟิลด์ cn41Cost05 (ยอดรวม 643,241,099.93 บาท) และ cn41CostInc (ผลต่าง = cn41ActualCost 06 - cn41Cost05 05 ผลต่างรวม -94,278.85 บาท ต่างกัน 35 งาน) ลงใน js/data_wbs.js 3) เพิ่มชิปแสดงที่มาไฟล์ 05 CN41 และวันที่แก้ไขล่าสุด "14 ต.ค. 69" ใน index.html และ css/styles.css ทั้งบนหัวการ์ดกราฟและหัวตาราง WBS 4) ใน js/wbs.js เพิ่มคอลัมน์ "มูลค่าAUCที่เพิ่มขึ้น" (cn41CostInc) และ "ต้นทุนจริง (ไฟล์ 05)" (cn41Cost05) วางต่อจาก "มูลค่า AUC(บาท)" ตามรูปที่ 26 พร้อมแสดงผลรวมใน Header Metric Badge, Footer Summary Row, Presets (core, budget, cn41), Dropdown คอลัมน์ และ Export CSV',
      sourceFile: 'คำสั่งผู้ใช้งาน (นำไฟล์ใหม่ เข้าระบบ ห้ามไปยุ่งกับไฟล์อื่นๆ เด็ดขาด โดยเฉพาะไฟล์ 06 1.นำไฟล์ 05 WBS เข้าระบบ และให้ผูกกับ WBS ไฟล์ 03 เท่านั้น 2. ให้แสดงใน ตารางรูปที่ 26 และในระบบที่เกี่ยวข้องทุกเมนู 3.ให้แสดงชื่อไฟล์ และวันแก้ไขด้วย ด้านบน 4.หลังจากนั้น ให้สร้างคอลัม ในตารางใหม่ โดยนำไฟล์ 06 ชื่อคอลัม ต้นทุนจริง ลบด้วย ไฟล์ 05 ชื่อคอลัม ต้นทุนจริง เป็นคอลัมใหม่ชื่อ มูลค่าAUCที่เพิ่มขึ้น)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง (เพิ่มมิติข้อมูลเปรียบเทียบมูลค่า AUC เริ่มต้นกับล่าสุด พร้อมคอลัมน์คำนวณผลต่าง)'
    },
    {
      id: 'log_000_rename_file_05_2_to_06',
      timestamp: '2026-10-24 20:25:00',
      timestampTh: '24 ต.ค. 2569, 20:25 น.',
      type: 'CONFIG',
      typeBadge: 'เปลี่ยนชื่อไฟล์ 05-2 เป็น 06',
      badgeClass: 'badge-type-config',
      title: 'อัปเดตระบบตามการเปลี่ยนชื่อไฟล์ 05-2 เป็นไฟล์ 06 WBS CN41 มูลค่า AUC ล่าสุด วันที่ 22 ตค 69.xlsx',
      targetSubject: 'ชิปที่มาไฟล์การ์ดกราฟและตาราง WBS, กล่องเลือกคอลัมน์ (06 CN41), Model View (Data Flow Diagram) และ DATA_SOURCE_CATALOG',
      storageFile: 'index.html, js/wbs.js, js/data_history.js & scratch/merge_wbs_latest.ps1',
      changeSummary: 'อัปเดตชื่อไฟล์จาก 05-2 เป็น "06 WBS CN41 มูลค่า AUC ล่าสุด วันที่ 22 ตค 69.xlsx" ทั้งในป้ายชิปหัวตาราง WBS, กล่องเลือกคอลัมน์ (06 CN41), Model View และสคริปต์นำเข้า',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ได้เปลี่ยนชื่อไฟล 05-2 เป็น 06 ให้แก้ไขทุกอย่างตามด้วย": 1) ใน index.html อัปเดตป้ายที่มาไฟล์มูลค่า AUC ทั้งบนหัวการ์ดกราฟและหัวตาราง WBS เป็น "ไฟล์ 06 CN41" พร้อมชี้ไปยังชื่อไฟล์ 06 WBS CN41 มูลค่า AUC ล่าสุด วันที่ 22 ตค 69.xlsx 2) ใน js/wbs.js ปรับกลุ่มคอลัมน์และป้ายแท็กคอลัมน์เป็น "06 CN41" และอัปเดตข้อความ Tooltip ชี้แจงมูลค่า AUC จากไฟล์ 06 3) ใน js/data_history.js อัปเดตรายการ src_06 ให้เป็นไฟล์ 06 WBS CN41 (336.2 KB) และเพิ่ม src_05 เป็นไฟล์ 05 WBS CN41 วันเริ่มบัญชี 14 ตค 69 พร้อมอัปเดตผัง Data Flow Diagram 4) ใน scratch/merge_wbs_latest.ps1 อัปเดตชื่อไฟล์ $f5Path / $f6Path ให้เป็นไฟล์ 06 5) ปรับปรุง Version Cache Buster เป็น ?v=20261024_2025',
      sourceFile: 'คำสั่งผู้ใช้งาน (ได้เปลี่ยนชื่อไฟล 05-2 เป็น 06 ให้แก้ไขทุกอย่างตามด้วย)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (เปลี่ยนรหัสเรียกและชื่อไฟล์ 05-2 เป็น 06 ทั้งระบบ)'
    },
    {
      id: 'log_000_cancel_05_1_revert_to_05_2',
      timestamp: '2026-10-24 20:15:00',
      timestampTh: '24 ต.ค. 2569, 20:15 น.',
      type: 'CONFIG',
      typeBadge: 'ยกเลิกคำสั่งนำเข้า 05-1 คืนค่าไฟล์ 05-2',
      badgeClass: 'badge-type-config',
      title: 'ยกเลิกคำสั่งนำเข้าไฟล์ 05-1 และคืนค่าระบบกลับมาใช้ไฟล์ 05-2 WBS CN41 ล่าสุด ทั้งระบบและ Model View',
      targetSubject: 'การ์ดกราฟ WBS, ตาราง WBS, กล่องเลือกคอลัมน์, Model View (Data Flow Diagram) และแคตตาล็อกแหล่งข้อมูล',
      storageFile: 'index.html, js/wbs.js & js/data_history.js',
      changeSummary: 'ดำเนินการยกเลิกคำสั่งนำเข้าไฟล์ 05-1 ตามคำขอของผู้ใช้ โดยคืนค่าป้ายที่มาไฟล์, รายการคอลัมน์ และ Model View กลับมาใช้ข้อมูลไฟล์ 05-2 WBS CN41 ล่าสุด (22 ตค 69)',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ยกเลิกคำสั่ง ให้ นำไฟล์ 05-1 WBS เข้าระบบ 1. ให้ผูกกับ WBS ไฟล์ 03 เท่านั้น 2. ให้แก้ ใน model view ด้วย" และ "ยกเลิก": 1) ใน index.html คืนค่าป้ายชิปที่มาไฟล์มูลค่า AUC ทั้งบนหัวการ์ดกราฟและหัวตาราง WBS เป็นไฟล์ 05-2 CN41 (แก้ไขล่าสุด 22 ต.ค. 69) 2) ใน js/wbs.js คืนค่ากลุ่มคอลัมน์ ป้ายแท็ก 05-2 CN41 และข้อความ Tooltip ให้ระบุไฟล์ 05-2 3) ใน js/data_history.js คืนค่ารายการ src_05 และกล่องไฟล์ในแผนผัง Data Flow Diagram ของ Model View กลับมาเป็นไฟล์ 05-2 (336.2 KB) 4) อัปเดต Version Cache Buster เป็น ?v=20261024_2020',
      sourceFile: 'คำสั่งผู้ใช้งาน (ยกเลิกคำสั่ง ให้ นำไฟล์ 05-1 WBS เข้าระบบ... / ยกเลิก)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (คืนค่าไฟล์ 05-2 ในระบบ WBS และ Model View)'
    },
    {
      id: 'log_000_wbs_col_selector_update_file_05_2',
      timestamp: '2026-10-24 19:35:00',
      timestampTh: '24 ต.ค. 2569, 19:35 น.',
      type: 'EDIT',
      typeBadge: 'อัปเดตไฟล์ 05-2 ในเลือกคอลัมน์ & จัดวางปุ่มขวาสุด',
      badgeClass: 'badge-type-edit',
      title: 'อัปเดตไฟล์ 05 เป็น 05-2 ในกล่องเลือกคอลัมน์ที่ต้องการแสดง และจัดวางป้ายที่มาไฟล์บนขวาพร้อมย้ายปุ่มไปขวาสุด',
      targetSubject: 'กล่องเลือกคอลัมน์ที่ต้องการแสดง (Column Selector Dropdown), ส่วนหัวการ์ดกราฟ WBS และแถบหัวตาราง WBS (#wbsTableCard)',
      storageFile: 'js/wbs.js, index.html, css/styles.css & js/data_history.js',
      changeSummary: '1) อัปเดตกลุ่มไฟล์และป้ายคอลัมน์ในกล่องเลือกคอลัมน์ที่ต้องการแสดง จากไฟล์ 05 เป็นไฟล์ 05-2 WBS CN41 2) แสดงป้ายที่มาไฟล์และวันที่แก้ไขล่าสุดของสถานะ SAP และมูลค่า AUC บนขวาของตาราง WBS 3) ย้ายปุ่มเลือกทุกสถานะและล้างข้อมูลไปชิดขวาสุด',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ย้ายไปทางขวาสุด", "บนขวา ให้แสดงที่มาไฟล์ และวันที่แก้ไขล่าสุด ของ 1. สถานะ sap 2. มูลค่า AUC" และ "เลือกคอมลัมที่ต้องการแสดง ไฟล์ 05 ให้ update ไฟล์ใหม่ด้วย": 1) ใน js/wbs.js อัปเดต WBS_COL_GROUPS ให้แสดงชื่อกลุ่มเป็น "ข้อมูล CN41 มูลค่า AUC (ไฟล์ 05-2)" และอัปเดตป้ายคอลัมน์แท็กเป็น "05-2 CN41" พร้อมเพิ่มคีย์เวิร์ดค้นหา 05, 05-2, cn41 ให้ค้นหาคอลัมน์ได้แม่นยำ 2) ใน index.html เพิ่ม .wbs-table-top-meta-bar บนหัวการ์ดตาราง WBS (#wbsTableCard) โดยแสดงป้ายเกณฑ์วัดฝั่งซ้าย และป้ายที่มาไฟล์ 1. สถานะ SAP (ไฟล์ 04 ZBUDR064) และ 2. มูลค่า AUC (ไฟล์ 05-2 CN41) ไว้บนขวาสุด 3) ในหัวการ์ดกราฟ WBS ปรับคอนเทนเนอร์ .wbs-chart-header-actions-area และ .wbs-chart-btn-group ให้ปุ่ม "เลือกทุกสถานะ" และ "ล้างข้อมูลทุกสถานะ" ชิดขวาสุดเสมอ ไม่ตกแถวหรือเบียดซ้าย 4) ใน index.html เพิ่มปุ่มสลับโหมดมุมมองคอลัมน์ "แยกตามกลุ่มไฟล์" (btnModeGroup) ร่วมกับ "ลำดับการแสดง" 5) ปรับปรุง Version Cache Buster เป็น ?v=20261024_1935',
      sourceFile: 'คำสั่งผู้ใช้งาน (ย้ายไปทางขวาสุด / บนขวา ให้แสดงที่มาไฟล์ และวันที่แก้ไขล่าสุด ของ 1. สถานะ sap 2. มูลค่า AUC / เลือกคอมลัมที่ต้องการแสดง ไฟล์ 05 ให้ update ไฟล์ใหม่ด้วย)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงกล่องเลือกคอลัมน์ และการจัดวางหัวตาราง/หัวการ์ด WBS)'
    },
    {
      id: 'log_000_wbs_chart_add_source_badges',
      timestamp: '2026-10-24 19:02:00',
      timestampTh: '24 ต.ค. 2569, 19:02 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มป้ายที่มาไฟล์บนหัวการ์ด WBS',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มป้ายแสดงที่มาไฟล์และวันที่แก้ไขล่าสุดของ 1. สถานะ SAP และ 2. มูลค่า AUC บนหัวการ์ดกราฟ WBS',
      targetSubject: 'ส่วนหัวการ์ดกราฟแท่ง WBS (#wbsChartHeaderSourceStrip ใน .card-header ของการ์ดกราฟ WBS)',
      storageFile: 'index.html, css/styles.css & js/data_history.js',
      changeSummary: 'เพิ่มป้ายแท็กแสดงที่มาไฟล์และวันที่แก้ไขล่าสุด 2 รายการ ในตำแหน่งกรอบสี่เหลี่ยมสีแดงบนหัวการ์ดกราฟ WBS: 1) สถานะ SAP: ไฟล์ 04 ZBUDR064 (แก้ไขล่าสุด: 23 ต.ค. 69) 2) มูลค่า AUC: ไฟล์ 05-2 CN41 (แก้ไขล่าสุด: 22 ต.ค. 69) พร้อมคลิกเปิดดู Model View',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "สีเหลี่ยมสีแดง ให้แสดงที่มาไฟล์ และวันที่แก้ไขล่าสุด ของ 1. สถานะ sap 2. มูลค่า AUC" พร้อมภาพกรอบสีแดง: 1) ใน index.html เพิ่มคอมโพเนนต์ #wbsChartHeaderSourceStrip คั่นกลางระหว่างป้ายมูลค่ารวมและปุ่มเลือกทุกสถานะ 2) แสดงป้ายที่ 1 (สถานะ SAP) ชี้ไปยังไฟล์ 04 ZBUDR064 พร้อมวันที่แก้ไขล่าสุด 23 ต.ค. 2569 3) แสดงป้ายที่ 2 (มูลค่า AUC) ชี้ไปยังไฟล์ 05-2 CN41 พร้อมวันที่แก้ไขล่าสุด 22 ต.ค. 2569 4) ออกแบบสไตล์ CSS โทน Cyber-Gold / PEA Dark พร้อม Hover Effect และเชื่อมโยงฟังก์ชัน openDhModelModal เปิดดู Model View ได้ทันที 5) อัปเดต Version Cache Buster ใน index.html เป็น 20261024_1902',
      sourceFile: 'คำสั่งผู้ใช้งาน พร้อมภาพกรอบสี่เหลี่ยมสีแดงระบุตำแหน่งบนหัวการ์ดกราฟ WBS',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (เพิ่มป้ายข้อมูลที่มาไฟล์บนหัวการ์ดกราฟ WBS)'
    },
    {
      id: 'log_000_update_filename_05_1_to_05_2',
      timestamp: '2026-10-24 18:48:00',
      timestampTh: '24 ต.ค. 2569, 18:48 น.',
      type: 'EDIT',
      typeBadge: 'ปรับปรุงชื่อไฟล์ 05-2',
      badgeClass: 'badge-type-edit',
      title: 'แก้ไขชื่อไฟล์ 05-1 เป็น 05-2 ทั้งในหน้า WBS คงเหลือ และหน้าประวัตินำเข้าข้อมูล',
      targetSubject: 'แถบป้ายแหล่งข้อมูลหน้า WBS (#wbsActiveFilterPills) และแคตตาล็อกหน้าประวัตินำเข้าข้อมูล (src_05 ใน DATA_SOURCE_CATALOG)',
      storageFile: 'js/wbs.js, js/data_history.js & index.html',
      changeSummary: 'แก้ไขชื่อไฟล์จาก "05-1 WBS CN41 มูลค่า AUC วันเริ่มบัญชี 14 ตค69 (1เดือนเปลี่ยนครั้ง).xlsx" เป็น "05-2 WBS CN41 มูลค่า AUC ล่าสุด วันที่ 22 ตค 69.xlsx" ทั้งในป้ายหัวตาราง WBS และหน้ารายละเอียดประวัตินำเข้าข้อมูล',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "แก้ไขชื่อไฟล์ 05-1 เป็น 05-2" และ "ให้แก้ไขชื่อไฟล์ หน้าประวัตินำเข้าด้วย": 1) ใน js/wbs.js ปรับปรุงแถบป้าย pill-file-05 ให้แสดงชื่อไฟล์ 05-2 WBS CN41 มูลค่า AUC ล่าสุด วันที่ 22 ตค 69.xlsx 2) ใน js/data_history.js อัปเดตข้อมูลไฟล์ src_05 ใน DATA_SOURCE_CATALOG ให้ชื่อไฟล์ตรงกับ 05-2 ขนาด 336.2 KB 3) อัปเดตผัง Data Flow Architecture ไฟล์ 05-2 ในหน้าประวัตินำเข้า 4) อัปเดต Version Cache Buster ใน index.html เป็น 20261024_1848',
      sourceFile: 'คำสั่งผู้ใช้งาน (แก้ไขชื่อไฟล์ 05-1 เป็น 05-2 / ให้แก้ไขชื่อไฟล์ หน้าประวัตินำเข้าด้วย)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับปรุงชื่อไฟล์แสดงผลในหน้า WBS และหน้าประวัตินำเข้า)'
    },
    {
      id: 'log_000_wbs_remove_kpi_circle',
      timestamp: '2026-10-24 18:35:00',
      timestampTh: '24 ต.ค. 2569, 18:35 น.',
      type: 'EDIT',
      typeBadge: 'ปรับแต่งการ์ด WBS',
      badgeClass: 'badge-type-edit',
      title: 'นำวงกลมกราฟ KPI ออกจากการ์ดภาพรวมมูลค่า & งาน AUC เฉพาะในหน้า WBS คงเหลือ',
      targetSubject: 'การ์ดสรุปภาพรวมมูลค่า & งาน AUC (#wbsExecutiveDonutKpiCard) ในแท็บ WBS คงเหลือ (#tab-wbs)',
      storageFile: 'js/wbs.js, css/styles.css, index.html & js/data_history.js',
      changeSummary: 'นำวงกลมกราฟโดนัทและคะแนน KPI ตรงกลางออกจากการ์ดภาพรวมมูลค่า & งาน AUC เฉพาะในหน้า WBS คงเหลือ ตามคำสั่งผู้ใช้งาน พร้อมจัดวางกล่องปิดงานแล้วและคงเหลือให้สมดุลสวยงาม',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: "เฉพาะ หน้าWBS คงเหลือ ให้เอาวงกลมออก" พร้อมภาพวงกลมสีแดง: 1) ใน js/wbs.js (ฟังก์ชัน renderWbsTargetComparisonSection) นำคอมโพเนนต์ .exec-donut-chart-wrapper (#wbsExecutiveDonutChart และ #wbsExecDonutCenterContent) ออกจากการ์ด #wbsExecutiveDonutKpiCard ในแท็บ WBS 2) ใน js/wbs.js ปรับฟังก์ชัน syncWbsSideKpiCard ให้ตัดฟิลด์ kpiAvgKpi ออก 3) ใน css/styles.css ปรับแต่งระยะห่าง gap (0.55rem) และ padding ของกล่องปิดงานแล้วและคงเหลือให้ได้สัดส่วนสวยงาม รับกับความสูงของการ์ดเปรียบเทียบ KPI ฝั่งขวา 4) คงวงกลมกราฟ KPI ในหน้าภาพรวมผู้บริหาร (Overview) ไว้ตามเดิม 5) อัปเดต Version Cache Buster ใน index.html เป็น 20261024_1835',
      sourceFile: 'คำสั่งผู้ใช้งาน (เฉพาะ หน้าWBS คงเหลือ ให้เอาวงกลมออก) พร้อมภาพวงกลมสีแดง',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับปรุง UI การ์ดภาพรวมในหน้า WBS คงเหลือ)'
    },
    {
      id: 'log_000_update_dept_name_to_koryor',
      timestamp: '2026-10-23 21:45:00',
      timestampTh: '23 ต.ค. 2569, 21:45 น.',
      type: 'CONFIG',
      typeBadge: 'ปรับปรุงชื่อหน่วยงาน',
      badgeClass: 'badge-type-config',
      title: 'แก้ไขชื่อหน่วยงานในส่วนหัวระบบเป็น "กองก่อสร้างระบบไฟฟ้าและงานโยธา (กรย.)"',
      targetSubject: 'ส่วนหัวระบบ (Header) ของแดชบอร์ด (#app-header / .brand-subtitle)',
      storageFile: 'index.html & js/data_history.js',
      changeSummary: 'ปรับปรุงข้อความชื่อสังกัดหน่วยงานในส่วนหัวหน้าเว็บ จากเดิม "กองวิศวกรรมและบริการ (กรย.)" เป็น "กองก่อสร้างระบบไฟฟ้าและงานโยธา (กรย.)" ตามโครงสร้างการจัดตั้งและคำสั่งการใช้งาน',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: "กองวิศวกรรมและบริการ (กรย.) แก้ไข กองก่อสร้างระบบไฟฟ้าและงานโยธา (กรย.)" โดยแก้ไขข้อความในแท็ก .brand-subtitle ของ index.html ให้แสดงเป็น "การไฟฟ้าส่วนภูมิภาค เขต 3 (ภาคกลาง) • กองก่อสร้างระบบไฟฟ้าและงานโยธา (กรย.)" พร้อมอัปเดต cache buster และบันทึกประวัติการแก้ไขระบบใน BASE_AUDIT_LOGS',
      sourceFile: 'คำสั่งผู้ใช้งาน',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับปรุงข้อความชื่อหน่วยงานในส่วนหัวระบบ)'
    },
    {
      id: 'log_000_wbs_add_kpi_summary_card_and_relocate_selected_jobs',
      timestamp: '2026-10-23 21:38:00',
      timestampTh: '23 ต.ค. 2569, 21:38 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มการ์ดภาพรวม & ย้ายตำแหน่งเลือกงาน',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มการ์ดภาพรวมมูลค่า & งาน AUC (ตามรูปที่ 15) ฝั่งซ้ายของการ์ดเปรียบเทียบ KPI พร้อมย้ายตำแหน่งที่เลือกงานและปรับขนาดตัวอักษรเท่ากับจำนวนเงิน',
      targetSubject: 'การ์ดเปรียบเทียบเป้าหมาย KPI ระดับ 5 (#wbsTargetComparisonSection) และการ์ดภาพรวมมูลค่า & งาน AUC (#wbsExecutiveDonutKpiCard) ในแท็บ WBS',
      storageFile: 'js/wbs.js, js/app.js, css/styles.css & js/data_history.js',
      changeSummary: '1) เพิ่มการ์ดสรุปภาพรวมมูลค่า & งาน AUC (ตามรูปที่ 15) ไว้ทางฝั่งซ้ายของการ์ดเปรียบเทียบในแท็บ WBS โดยคงความกว้างเดิมและปรับความสูงให้เท่ากับการ์ดเปรียบเทียบแบบ edge-to-edge 2) ย้ายตำแหน่งแสดงจำนวนงานที่เลือกจากหัวกราฟซ้ายมือมาไว้ถัดจากตัวเลขมูลค่า "ส่วนที่เลือก: ... (X งาน)" 3) ปรับขนาดตัวอักษรของป้ายสถานะ "CLSD F4:" และจำนวนงาน "(X งาน)" ให้มีขนาดใหญ่เท่ากับตัวเลขจำนวนเงินอย่างสมส่วนและชัดเจน 4) ซิงก์ข้อมูลภาพรวมและกราฟโดนัท KPI ระหว่างหน้า Overview และ WBS แบบเรียลไทม์',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งานทั้ง 2 ส่วน: 1) "กรอบสีแดง ให้เพิ่มการ์ด ตามรูปที่ 15 1.ให้กว้างเท่าเดิมแต่ปรับขนาดความสูงให้เท่ากับการ์ด เปรียบเทียบมูลค่า/งาน": สร้างเลย์เอาต์ .wbs-comparison-unified-grid และ .wbs-side-summary-col จัดวางการ์ด #wbsExecutiveDonutKpiCard ไว้ฝั่งซ้ายของ #wbsTargetComparisonCard ด้วย flex align-items: stretch ทำให้การ์ดทั้งสองมีความสูงเท่ากันพอดี 100% พร้อมฟังก์ชัน syncWbsSideKpiCard และอัปเดต renderExecutiveDonutChart ให้วาดกราฟโดนัททั้ง 2 จุดพร้อมกัน 2) "1.ย้ายตำแหน่ง ที่เลือกงาน 2.และเพิ่มขนาดอักษรที่วงกลม ให้เท่ากับจำนวนเงิน": นำป้ายเลือกแล้วออกจาก .bar-header-left แล้วย้ายมาแสดงต่อท้ายตัวเลขมูลค่าใน .stat-selected เป็น "ส่วนที่เลือก: +฿... (X งาน)" พร้อมปรับขนาดฟอนต์ของ .lbl-sap ("CLSD F4:"), .sap-jobs-count ("(X งาน)"), .lbl-selected, และ .selected-jobs-count เป็น 0.88rem font-weight: 800 เท่ากับ .bar-amount-main จัดวางในแถวเดียวแบบ no-wrap คมชัด สวยงาม สมส่วน',
      sourceFile: 'คำสั่งผู้ใช้งาน พร้อมภาพวงกลมสีแดงและลูกศรชี้ตำแหน่ง',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (เพิ่มการ์ดภาพรวม WBS และปรับเลย์เอาต์การแสดงผลจำนวนงานและฟอนต์)'
    },
    {
      id: 'log_000_kpi_comp_refine_and_badges_redesign',
      timestamp: '2026-10-23 21:12:00',
      timestampTh: '23 ต.ค. 2569, 21:12 น.',
      type: 'EDIT',
      typeBadge: 'ปรับแต่ง UI การ์ดเปรียบเทียบ & ป้ายมูลค่า',
      badgeClass: 'badge-type-edit',
      title: 'ปรับแต่งสีชมพูพาสเทลช่วงเดือน, ขอบไฟวิ่งปุ่มกำลังเลือก, ป้ายบรรลุเป้าเขียวเรืองแสง, ป้ายกำลังเลือกทองคำขาว, ป้ายมูลค่าที่ต้องปิดเพิ่มสีแดงเรืองแสง, และป้ายมูลค่ารวมสีเหลืองทอง',
      targetSubject: 'การ์ดเปรียบเทียบเป้าหมาย KPI (.single-bar-segment, .btn-wbs-kpi-month, .m-achieved-pill, .m-active-dot, .m-amt, .outcome-col-val) และป้ายหัวตาราง WBS (#wbsOfficesChartAucBadge)',
      storageFile: 'css/styles.css, index.html & js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน 6 รายการ: 1) เปลี่ยนสีพื้นที่ช่วงเดือนแรก (ต.ค.) ในแถบคาดการณ์เป็นสีชมพูพาสเทลหวานๆ (#EC4899 - #F472B6 - #FBCFE8) ทั้งในหน้า Overview และ WBS พร้อมอักษรและเงาเข้มคมชัด 2) ขอบปุ่มกำลังเลือก ปรับเป็นไฟวิ่งแสงเลเซอร์สีขาวทองประกายเพชรวิ่งวนรอบรูปทรงลูกศรแบบ 360 องศา (Running Light Border) 3) ป้าย "บรรลุเป้า" ปรับเป็นพื้นเขียวเรืองแสงนีออนมรกต (#00FF88) พร้อมอักษรสีเขียวป่าเข้มลึก (#022C22) คอนทราสต์ชัดเจน 100% 4) ป้าย "กำลังเลือก" ปรับพื้นหลังเป็นสีทองคำขาวเรืองแสง (White-Gold Halo) พร้อมอักษรม่วงเข้มคมชัดและไฟกะพริบสีส้มทอง 5) มูลค่า/งานที่ต้องปิดเพิ่ม ปรับเป็นป้ายพื้นหลังสีแดงเรืองแสง (#EF4444) ตัวเลขสีขาวหนาเด่นชัด ทั้งบนปุ่มเดือนและกล่องผลลัพธ์ 6) ป้าย [มูลค่ารวม: ฿...] หัวตาราง WBS เปลี่ยนเป็นพื้นหลังสีเหลืองทองและตัวหนังสือสีทองเหมือนป้ายข้างๆ',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งานและภาพระบุ: 1) ใน css/styles.css ปรับแต่ง .single-bar-segment.seg-1, .btn-wbs-kpi-month.m-seg-1, และ .active.m-seg-1 ให้ใช้โทนสีชมพูพาสเทลหวานๆ พร้อม text-shadow ลึกคมชัด 2) เพิ่ม @keyframes kpiRunningBorderLight สำหรับ .btn-wbs-kpi-month.active สร้างเอฟเฟกต์ไฟวิ่งนีออนสีขาวทองประกายเพชร 2.2s linear infinite 3) ปรับปรุง .seg-status และ .m-achieved-pill ใช้ gradient นีออนมรกต #00FF88 - #10B981 ขอบขาว อักษร #022C22 4) ปรับปรุง .m-active-dot ใช้ gradient สีทองคำขาวเรืองแสง อักษร #1E0A3C พร้อม .pulse-beacon-gold 5) ปรับปรุง .m-amt และ .seg-amt เมื่อยังไม่บรรลุเป้า ให้แสดงเป็นป้ายสีแดงเรืองแสง #EF4444 ขอบขาว พร้อมปรับปรุงกล่องผลลัพธ์ .val-pending และ .outcome-col-sub 6) ใน index.html ปรับสไตล์ #wbsOfficesChartAucBadge ให้มี background: rgba(255,210,90,0.18), color: #FFD25A และ border สีทองเข้าชุดกับ #wbsOfficesChartCountBadge 7) อัปเดต cache buster เป็น ?v=20261023_2112',
      sourceFile: 'คำสั่งผู้ใช้งาน พร้อมภาพวงกลมสีแดงระบุตำแหน่ง',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงดีไซน์ความสวยงาม คมชัด และสไตล์ไฟวิ่งของระบบ)'
    },
    {
      id: 'log_000_wbs_banner_card_remove_and_export_btn_relocated',
      timestamp: '2026-10-23 20:30:00',
      timestampTh: '23 ต.ค. 2569, 20:30 น.',
      type: 'EDIT',
      typeBadge: 'นำแบนเนอร์ WBS ออก',
      badgeClass: 'badge-type-edit',
      title: 'นำกล่องแบนเนอร์ "รายงานติดตามงาน WBS คงเหลือ" ออกตามภาพคำสั่งผู้ใช้งาน',
      targetSubject: 'แบนเนอร์หัวแท็บ WBS คงเหลือ (.wbs-banner-card) ในแท็บ WBS',
      storageFile: 'index.html & js/data_history.js',
      changeSummary: 'นำกล่องแบนเนอร์ .wbs-banner-card (ประกอบด้วย หัวข้อรายงาน, คำอธิบาย, แถบป้ายวันที่/เวลานำเข้าไฟล์ 03-06) ออกจากแท็บ WBS คงเหลือตามภาพที่ผู้ใช้แคปเจอร์ระบุ พร้อมย้ายปุ่มส่งออก WBS (CSV) ขึ้นไปไว้ที่แถบเครื่องมือเหนือตาราง WBS (.table-header-bar) ข้างปุ่มซิงค์ Google Sheet เพื่อให้ผู้ใช้ยังคงส่งออกข้อมูลได้สะดวก',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (เอาออก - พร้อมภาพกล่องแบนเนอร์รายงานติดตามงาน WBS คงเหลือ): 1) ใน index.html กำหนด style="display: none !important;" ให้กับ .wbs-banner-card ทำให้พื้นที่ด้านบนแท็บ WBS กระชับ คลีน และสวยงาม 2) ย้ายปุ่ม "ส่งออก WBS (CSV)" ไปจัดวางใน .table-header-bar ร่วมกับปุ่มซิงค์ Google Sheet และปุ่มเลือกคอลัมน์ 3) ปรับปรุง Version Cache Buster เป็น ?v=20261023_2030',
      sourceFile: 'คำสั่งผู้ใช้งาน (เอาออก - พร้อมภาพแคปเจอร์กล่องแบนเนอร์ .wbs-banner-card)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับปรุง UI นำกล่องแบนเนอร์ด้านบนออกและย้ายปุ่มส่งออก CSV)'
    },
    {
      id: 'log_000_crit_bar_widen_and_fix_overlaps',
      timestamp: '2026-10-23 20:28:00',
      timestampTh: '23 ต.ค. 2569, 20:28 น.',
      type: 'EDIT',
      typeBadge: 'ขยายกราฟ & แก้ป้ายทับกัน',
      badgeClass: 'badge-type-edit',
      title: 'ขยายความกว้างกราฟแท่งและป้าย %ปิดงาน/KPI ไม่ให้เกินกราฟ และแก้ไขปัญหาตัวอักษรซ้อนทับกันอย่างสมส่วนสวยงาม',
      targetSubject: 'กราฟแท่งร้อยละความสำเร็จการปิดงานแยกตามเกณฑ์วัด (#criteriaBarChart) ในเมนูภาพรวมผู้บริหาร',
      storageFile: 'js/app.js, js/chart.js & js/data_history.js',
      changeSummary: '1) ขยายความกว้างแท่งกราฟ (barRatio จาก 0.82 เป็น 0.88, maxBarWidth จาก 80px เป็น 120px) ให้แท่งกว้างขึ้น เต็มตา สมส่วนสวยงาม 2) ขยายความกว้างของป้ายเป้าหมาย KPI และป้าย %ปิดงานล่างสุดตามความกว้างแท่ง โดยเว้นระยะขอบข้างละ 3px พอดีเป๊ะ ไม่เกินขอบแท่งกราฟ 3) แก้ไขปัญหาตัวอักษรและป้ายซ้อนทับกัน โดยล็อคไม่ให้ป้ายเป้าหมายดันขึ้นไปทับป้าย "✓ บรรลุเป้าหมาย" เหนือแท่งกราฟ พร้อมเว้นระยะห่าง minGap 4px และป้องกันไม่ให้ป้ายเป้าหมายลงมาชนดาว ⭐ และป้าย % ด้านล่าง',
      details: 'ดำเนินการตามข้อกำหนด 3 ข้อของผู้ใช้งาน: 1) "ขยายความกว้างกราฟ และ%ปิดงาน/KPI แต่ไม่ให้เกินกราฟออกมา": ใน js/app.js ปรับ barRatio: 0.88 และ maxBarWidth: 120px ใน js/chart.js กำหนด badgeW และ pillW เป็น currentBarW - badgeInset (เว้นระยะขอบซ้าย-ขวาข้างละ 3px พอดี) ป้ายและตัวเลขจึงขยายเต็มความกว้างแท่งอย่างสมส่วน 100% โดยไม่เกินกราฟออกมา 2) "ไม่ให้อักษร ซ้อนทับกัน": ใน js/chart.js ปรับปรุง relaxation loop: ตรวจสอบ hasAchieveBadge (เมื่อแท่งมีป้าย ✓ บรรลุเป้าหมาย) กำหนด minAllowedY = pad.top + 3 ล็อคไม่ให้เป้าหมายในแท่งดันขึ้นไปชนป้ายบรรลุเป้าหมายด้านบน, ปรับระยะ achieveBadgeY ให้อยู่เหนือแท่ง 6px, เพิ่ม minGap ระหว่างป้ายเป้าหมายเป็น 4.0px, และจำกัด maxAllowedY ป้องกันไม่ให้ป้ายบนลงมาทับดาว ⭐ และป้าย % ล่างสุด 3) "สวยงาม สมส่วน": จัดวาง Typography ขนาดฟอนต์ 8.8px คมชัด และตัวเลข % ล่างสุด 11px สีเหลืองทอง PEA Gold สวยงามลงตัวระดับพรีเมียม',
      sourceFile: 'คำสั่งผู้ใช้งาน (1.ขยายความกว้างกราฟ และ%ปิดงาน/KPI แต่ไม่ให้เกินกราฟออกมา 2.ไม่ให้อักษร ซ้อนทับกัน 3..สวยงาม สมส่วน)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงเลย์เอาต์กราฟแท่ง ความกว้าง และระบบป้องกันป้ายซ้อนทับ)'
    },
    {
      id: 'log_000_remove_metric_toggle_for_all_criteria',
      timestamp: '2026-10-23 20:25:00',
      timestampTh: '23 ต.ค. 2569, 20:25 น.',
      type: 'EDIT',
      typeBadge: 'เอาปุ่มสลับมูลค่า/งานออก (เลือกทั้งหมด)',
      badgeClass: 'badge-type-edit',
      title: 'นำปุ่มสลับหน่วย [💰 มูลค่า / ⚡ งาน] ทั้ง 2 จุด ออกเมื่อเลือกเกณฑ์วัด "เลือกทั้งหมด"',
      targetSubject: 'แถบเป้าหมายที่ต้องปิดงานเพิ่ม (#next3mProjectionSection) ในเมนูภาพรวมผู้บริหาร',
      storageFile: 'js/app.js, index.html & js/data_history.js',
      changeSummary: 'นำปุ่มสลับหน่วย [💰 มูลค่า / ⚡ งาน] ทั้ง 2 ตำแหน่งตามที่วงกลมสีแดง (ปุ่มด้านบนนอกการ์ด และปุ่มเล็กในแถบหัวข้อการ์ด) ออกเมื่อตัวกรองเกณฑ์วัดเป็น "เลือกทั้งหมด" โดยกำหนดให้แสดงเป้าหมายเป็นหน่วยมูลค่า (ล้านบาท) เป็นค่าเริ่มต้นโดยอัตโนมัติ',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (เอาออก - พร้อมภาพระบุวงกลมสีแดง 2 จุด และคำสั่ง "เฉพาะเกณวัด เลือกทั้งหมด"): 1) ใน js/app.js ปรับปรุงฟังก์ชัน renderNext3mHorizontalBarChart ให้ตรวจจับเงื่อนไข isAllCriteria (!state.filters.criteria || state.filters.criteria === "ALL") โดยล็อก activeMode และ state.next3mHBarMode เป็น "val" และกำหนด showControls เป็น false ทำให้ปุ่ม toggle ยูนิต (.next3m-metric-toggle-wrap) ในแถบหัวข้อการ์ดไม่ถูกเรนเดอร์ 2) ซ่อนคอนเทนเนอร์ปุ่มบน (#next3mChartHeader / #next3mHBarControls) ถาวร ป้องกันการแสดงปุ่มลอยซ้ำซ้อน 3) ใน index.html กำหนด style="display:none !important;" ให้กับ #next3mChartHeader 4) อัปเดต Version Cache Buster เป็น ?v=20261023_2025',
      sourceFile: 'คำสั่งผู้ใช้งาน (เอาออก - วงกลมสีแดง 2 จุด / เฉพาะเกณวัด เลือกทั้งหมด)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับปรุง UI นำปุ่มสลับหน่วยออกเมื่อเลือกเกณฑ์วัดทั้งหมด)'
    },
    {
      id: 'log_000_growth_tables_value_and_pct',
      timestamp: '2026-10-23 11:27:00',
      timestampTh: '23 ต.ค. 2569, 11:27 น.',
      type: 'EDIT',
      typeBadge: 'ปรับตารางเพิ่ม/ลดรายเดือน',
      badgeClass: 'badge-type-edit',
      title: 'ปรับตารางด้านขวากราฟ Timeline: แสดงมูลค่าปิดงานที่เพิ่ม/ลด [เลข 1] & % [เลข 2] และมูลค่าภาพรวมที่เพิ่ม/ลด [เลข 3] & % [เลข 4] พร้อมระบุอักษร "ภาพรวมมูลค่า"',
      targetSubject: 'ตารางเพิ่ม/ลดรายเดือนด้านขวากราฟ Timeline (timelinePctGrowthTableWrap & timelineAmountGrowthTableWrap), ฟังก์ชันคำนวณและแสดงผล (calculateTimelineComprehensiveGrowth & renderTimelineGrowthTable)',
      storageFile: 'js/app.js, css/styles.css, index.html & js/data_history.js',
      changeSummary: 'ปรับปรุงตารางสถิติเพิ่ม/ลดรายเดือนด้านขวาของกราฟทั้ง 2 ส่วน: 1) กราฟบน (ร้อยละปิดงาน): แสดงหัวตาราง "มูลค่าปิดงาน" ที่เพิ่มขึ้น/ลดลงแต่ละเดือน [เลข 1] ควบคู่กับ % ปิดงาน [เลข 2] 2) กราฟล่าง (ภาพรวมวงเงิน): แสดงหัวตารางอักษร "ภาพรวมมูลค่า" ที่เพิ่มขึ้น/ลดลงแต่ละเดือน [เลข 3] ควบคู่กับ % ภาพรวม MoM [เลข 4] 3) ปรับความกว้างตารางทั้งสองให้มีขนาด 255px สอดรับกันอย่างสวยงาม 4) แสดงค่าเฉลี่ยทั้งมูลค่าและร้อยละในแถว Footer',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "เลข 1 ให้แสดง มูลค่าปิดงาน ที่เพิ่มขึ้น/ลดลง แต่ละเดือน และเป็น % ที่เพิ่มขึ้น/ลดลง แต่ละเดือน ตรงเลข 2 และด้านล่าง ให้แสดงมูลค่า ภาพรวมมูลค่า ที่เพิ่มขึ้น/ลดลง แต่ละเดือน ที่เลข 3 และ % ที่เพิ่มขึ้น/ลดลง แต่ละเดือน เลข 4 / แสดงอักษร ภาพรวมมูลค่า": 1) ปรับปรุงฟังก์ชัน calculateTimelineComprehensiveGrowth ใน js/app.js ให้คำนวณส่วนต่างมูลค่ารายเดือน (Value Delta) และร้อยละรายเดือน (% Delta) สำหรับทั้งงานปิดงานและภาพรวม AUC ครบ 12 เดือน 2) ปรับฟังก์ชัน renderTimelineGrowthTable ให้แสดงชื่อหัวตาราง "● ภาพรวมมูลค่า (ลบ.)" สำหรับกราฟล่าง และ "● มูลค่าปิดงาน (ลบ.)" สำหรับกราฟบน อย่างชัดเจน 3) ปรับแต่ง CSS ให้ตารางทั้งสองการ์ดมีความกว้าง 255px จัดวางสมดุลและสวยงาม 4) อัปเดต Version Cache Buster ใน index.html เป็น 20261023_1127',
      sourceFile: 'คำสั่งผู้ใช้งาน (เลข 1 ให้แสดง มูลค่าปิดงาน ที่เพิ่มขึ้น/ลดลง แต่ละเดือน และเป็น % ที่เพิ่มขึ้น/ลดลง แต่ละเดือน ตรงเลข 2 / และด้านล่าง ให้แสดงมูลค่า ภาพรวมมูลค่า ที่เพิ่มขึ้น/ลดลง แต่ละเดือน ที่เลข 3 และ % ที่เพิ่มขึ้น/ลดลง แต่ละเดือน เลข 4 / แสดงอักษร ภาพรวมมูลค่า)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_default_criteria_set_to_all',
      timestamp: '2026-10-23 10:55:00',
      timestampTh: '23 ต.ค. 2569, 10:55 น.',
      type: 'CONFIG',
      typeBadge: 'เปลี่ยน Default เกณฑ์วัดเป็นเลือกทั้งหมด',
      badgeClass: 'badge-type-config',
      title: 'ปรับค่าเริ่มต้น (Default) ของตัวกรองเกณฑ์วัดเป็น "เลือกทั้งหมด" (ALL)',
      targetSubject: 'ตัวกรองประเภทเกณฑ์วัด (#filterCriteria, select-chart-crit), สถานะเริ่มต้นของระบบ (state.filters.criteria), ปุ่มยางลบรีเซ็ต',
      storageFile: 'js/app.js, index.html & js/data_history.js',
      changeSummary: 'เปลี่ยนค่าเริ่มต้นของประเภทเกณฑ์วัดจากเดิมที่ล็อกไว้ที่ข้อ 1.1 เป็น "เลือกทั้งหมด" (ALL): 1) กำหนด state.filters.criteria เริ่มต้นเป็น "ALL" 2) กำหนด <option value="ALL" selected> ใน index.html 3) ปรับปุ่มยางลบและปุ่มรีเซ็ตตัวกรองให้คืนค่าเป็น "ALL" 4) ซิงค์ dropdown บนกราฟและภาพรวมให้เริ่มต้นที่ภาพรวมทุกเกณฑ์วัดทันทีที่เปิดระบบ',
      details: 'ดำเนินการตามคำสั่ง "เกณวัด ให้เปลี่ยน default เป็น เลือกทั้งหมด": 1) ปรับปรุง state.filters.criteria และ selectedCriteria ใน js/app.js ให้มีค่าเริ่มต้นเป็น ALL และ [] 2) แก้ไขฟังก์ชัน populateFilterDropdowns ให้ fallback เป็น ALL 3) ปรับปรุงฟังก์ชันรีเซ็ต resetCriteriaFilter, btnChartFilterReset, btnResetFilters ให้คืนค่าเป็น ALL 4) อัปเดต index.html ให้ option ALL มี attribute selected และปรับ tooltip ของปุ่มยางลบ 5) บันทึกประวัติการปรับปรุงระบบลงใน BASE_AUDIT_LOGS ตามข้อกำหนด',
      sourceFile: 'คำสั่งผู้ใช้งาน (เกณวัด ให้เปลี่ยน default เป็น เลือกทั้งหมด)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_fix_wbs_count_2083_and_cache_bust',
      timestamp: '2026-10-23 10:20:00',
      timestampTh: '23 ต.ค. 2569, 10:20 น.',
      type: 'EDIT',
      typeBadge: 'ปรับยอด WBS 2,083 & แก้ Cache',
      badgeClass: 'badge-type-edit',
      title: 'แก้ไขการแสดงผลยอดงาน WBS คงเหลือให้ตรงกับไฟล์ 03 (2,083 งาน) และอัปเดต Version Cache Buster',
      targetSubject: 'ป้ายเมนูนำทาง (index.html), การ์ดสถิติ (index.html), โมเดลจัดเก็บข้อมูล (js/data_history.js) และแท็กเวอร์ชันสคริปต์ล้างแคชเบราว์เซอร์',
      storageFile: 'index.html, js/data_history.js',
      changeSummary: 'แก้ไขยอดรวมงาน WBS ที่ตกค้างเป็น 2,968 ให้แสดง 2,083 งานตามไฟล์ 03 WBS ล่าสุด: 1) ปรับปรุง index.html ที่แท็บ wbsTabTotalBadge จาก 2,968 เป็น 2,083 2) ปรับปรุงการ์ดสรุป wbsStatTotalJobsSub เป็น 2,083 3) อัปเดต Cache Buster Query String (?v=20261023_1020) บนไฟล์ data_wbs.js, wbs.js, data_history.js, app.js เพื่อบังคับให้เบราว์เซอร์และ GitHub Pages ดึงไฟล์ 2,083 รายการใหม่ทันที ไม่ติดแคชเดิม 4) อัปเดตข้อมูลผัง Model View ใน js/data_history.js ครบทุกจุด',
      details: 'ดำเนินการตามคำสั่ง "งานรวมทั้งหมด 2083 งาน ทำไมภาพรวมยังขึ้น 2968 / จำนวนงานที่แสดง wbs คงเหลือ ให้อ้างอิงจากไฟล 03 WBS คงเหลือเม่านั้น / WBS ใน github ไม่ตรงกับ index": 1) วิเคราะห์พบว่าเบราว์เซอร์ของผู้ใช้และ GitHub Pages ยังคงจำไฟล์แคช js/data_wbs.js?v=20261019_0848 จากวันที่ 19 ต.ค. ซึ่งมียอดเดิม 2,968 รายการ และใน index.html มีค่าเริ่มต้นเป็น 2,968 ทำให้เมื่อเปิดเว็บยังแสดงผลตัวเลขเดิม 2) ปรับค่าเริ่มต้นใน index.html เป็น 2,083 รายการ 3) อัปเดตพารามิเตอร์เวอร์ชันสคริปต์เป็น ?v=20261023_1020 เพื่อตัดปัญหา Browser Disk Cache 4) ปรับผัง Model View และตัวแปรสถิติใน js/data_history.js เป็น 2,083 รายการ (2.32 MB) 5) ซิงค์ไฟล์ index.html และไฟล์ทั้งหมดไปยัง D:\\กรย+++\\C3-auc-dashboard',
      sourceFile: 'คำสั่งผู้ใช้งาน (งานรวมทั้งหมด 2083 งาน ทำไมภาพรวมยังขึ้น 2968 / WBS ใน github ไม่ตรงกับ index)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_update_wbs_03_04_05_1',
      timestamp: '2026-10-23 09:58:00',
      timestampTh: '23 ต.ค. 2569, 09:58 น.',
      type: 'IMPORT',
      typeBadge: 'อัปเดตไฟล์ WBS 03/04/05-1',
      badgeClass: 'badge-type-import',
      title: 'อัปเดตฐานข้อมูล WBS คงเหลือล่าสุดจากไฟล์ 03 WBS, 04 WBS และ 05-1 WBS พร้อมคงข้อมูลหมายเหตุและแผนปิดงานเดิม',
      targetSubject: 'ฐานข้อมูลงานก่อสร้าง WBS คงเหลือ (js/data_wbs.js, js/wbs.js, js/data_history.js)',
      storageFile: 'js/data_wbs.js, js/wbs.js & js/data_history.js',
      changeSummary: 'อัปเดตข้อมูล WBS เดือนล่าสุด: 1) นำเข้า 03 WBSงานคงเหลือเดือนล่าสุด.xlsx (2,083 รายการ) 2) ผสานข้อมูลจาก 04 WBS ZBUDR064 %พัสดุและค่าแรงและสถานะsap.xlsx (4,589 รายการ ใน SAP แมตช์ตรง 100%) 3) ผสานมูลค่า AUC จาก 05-1 WBS CN41 มูลค่า AUC วันเริ่มบัญชี 14 ตค69 (1เดือนเปลี่ยนครั้ง).xlsx (แมตช์ตรง 100%) 4) ดึงและรักษาข้อมูลหมายเหตุ (Note) 1,398 รายการ และแผนปิดงาน (PlanClose) 1,655 รายการ จากฐานข้อมูลเดิมและ Google Sheet ครบถ้วน 5) อัปเดตแถบป้ายข้อมูลวันที่ไฟล์บนหัวตารางหน้า WBS',
      details: 'ดำเนินการตามคำสั่ง "updateไฟล์ 03 WBS // 04 WBS // 05-1 WBS": 1) สำรองข้อมูลเดิมไว้ที่ js/data_wbs.bak.js 2) ดึงข้อมูลแผนปิดงานและหมายเหตุที่มีอยู่เดิมในระบบเก็บไว้ 3) นำเข้าแถวข้อมูล WBS 2,083 รายการจากไฟล์ 03 ล่าสุด 4) ผสานข้อมูลค่าใช้จ่าย SAP, สถานะ, % เบิกพัสดุ และ % ค่าใช้จ่าย จากไฟล์ 04 (แมตช์ 2,083/2,083 รายการ คิดเป็น 100%) 5) ผสานมูลค่าต้นทุนจริง/AUC จากไฟล์ 05-1 CN41 (แมตช์ 2,083/2,083 รายการ คิดเป็น 100%) 6) คงค่าหมายเหตุและแผนปิดงานเดิมเข้าสู่โครงสร้างข้อมูลใหม่ 7) บันทึกและตรวจสอบความสมบูรณ์ของ js/data_wbs.js 8) อัปเดตแถบป้ายวันที่แหล่งข้อมูลบนแท็บ WBS ใน js/wbs.js เป็นวันที่ 23 ต.ค. 2569 ครบถ้วน',
      sourceFile: '03 WBSงานคงเหลือเดือนล่าสุด.xlsx, 04 WBS ZBUDR064 %พัสดุและค่าแรงและสถานะsap.xlsx, 05-1 WBS CN41 มูลค่า AUC วันเริ่มบัญชี 14 ตค69 (1เดือนเปลี่ยนครั้ง).xlsx',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง'
    },
    {
      id: 'log_000_fix_github_desktop_not_opening_after_update_btn',
      timestamp: '2026-10-23 09:38:00',
      timestampTh: '23 ต.ค. 2569, 09:38 น.',
      type: 'EDIT',
      typeBadge: 'แก้ GitHub Desktop ไม่ขึ้น',
      badgeClass: 'badge-type-edit',
      title: 'แก้ไขปัญหาโปรแกรม GitHub Desktop ไม่เปิดขึ้นมาหลังกดปุ่ม Update 00AI to GitHub Desktop',
      targetSubject: 'ระบบปุ่ม Update 00AI (js/app.js, index.html), ตัวเรียกโปรแกรม OS (scratch/sync_to_github.ps1), เซิร์ฟเวอร์ API (scratch/serve.ps1) และ Windows Startup / Protocol',
      storageFile: 'js/app.js, index.html, scratch/sync_to_github.ps1, scratch/serve.ps1 & js/data_history.js',
      changeSummary: 'แก้ไขสาเหตุหลักที่ทำให้ GitHub Desktop ไม่เปิดขึ้นมา: 1) ปิด process ค้างในหน่วยความจำที่ขวางการเปิดโปรแกรมใหม่ (Zombie Cleanup) 2) ปรับปรุงสคริปต์ sync_to_github.ps1 ไม่ให้บล็อกหรือค้างที่ ReadKey และเปิดผ่านพาธหลักของ GitHub Desktop 3) ปรับปรุง js/app.js ให้มี Timeout ป้องกันกรณีเซิร์ฟเวอร์ออฟไลน์ พร้อมส่งคำสั่งเรียก x-github-client protocol และ update00ai protocol ตรงสู่ Windows Shell 4) เพิ่มปุ่มเปิด GitHub Desktop ทันที และข้อแนะนำในหน้าต่าง Modal 5) ติดตั้งตัวรันเซิร์ฟเวอร์แบ็กกราวนด์อัตโนมัติใน Windows Startup',
      details: 'แก้ไขตามคำแจ้ง "รันโปรแกรม github destop ไม่ขึ้น หลังกดปุ่ม update 00AI": 1) ตรวจสอบพบกระบวนการ GitHubDesktop.exe ตกค้างในหน่วยความจำโดยไม่มีหน้าต่างแสดงผล ทำให้เมื่อมีการสั่งเปิดโปรแกรม ตัว Electron ตรวจพบ single-instance lock และปิดตัวเองทันที จึงทำการเพิ่มระบบตรวจจับและปิดกระบวนการค้างอัตโนมัติก่อนเปิดใหม่ 2) แก้ไขสคริปต์ scratch/sync_to_github.ps1 ให้นับถอยหลังปิดตัวเองอัตโนมัติ ไม่ค้างคำสั่งรอปุ่มกด 3) ปรับปรุง js/app.js ใน triggerUpdateToGithubDesktop ให้มี AbortController timeout 3.5 วินาที พร้อมเรียกเปิดผ่าน iframe protocol update00ai://sync และ x-github-client://openRepo/ เพื่อให้ระบบ Windows นำหน้าต่าง GitHub Desktop ขึ้นมาบนหน้าจอจริงของผู้ใช้เสมอ 4) ปรับปรุง updateGithubModal ใน index.html เพิ่มปุ่มลัด "เปิด GitHub Desktop ทันที" และกล่องข้อความแนะนำ 5) ซิงค์ไฟล์ล่าสุดทั้งหมดไปยัง D:\\กรย+++\\C3-auc-dashboard ครบถ้วน 100%',
      sourceFile: 'คำสั่งผู้ใช้งาน (รันโปรแกรม github destop ไม่ขึ้น หลังกดปุ่ม update 00AI)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_fix_github_desktop_shortcut_and_beacon_fallback',
      timestamp: '2026-10-23 09:17:00',
      timestampTh: '23 ต.ค. 2569, 09:17 น.',
      type: 'EDIT',
      typeBadge: 'เปิดโปรแกรมผ่าน Shortcut',
      badgeClass: 'badge-type-edit',
      title: 'แก้ไขการเปิด GitHub Desktop ให้เปิดผ่าน Windows Start Menu Shortcut พร้อมระบบ Image Beacon Fallback',
      targetSubject: 'ระบบเปิด GitHub Desktop (scratch/serve.ps1, scratch/sync_to_github.ps1, js/app.js)',
      storageFile: 'scratch/serve.ps1, scratch/sync_to_github.ps1, js/app.js & js/data_history.js',
      changeSummary: 'แก้ไขปัญหาโปรแกรมไม่เด้งขึ้นมา: 1) เปลี่ยนจากการใช้ protocol launcher มาเป็นการเปิดผ่าน Start Menu Shortcut (.lnk) โดยตรง ซึ่งรับประกันว่าจะเปิดหน้าต่างโปรแกรมจริงขึ้นมาบนจอเสมอ 2) เพิ่ม Access-Control-Allow-Private-Network และระบบสำรอง Image Beacon ใน js/app.js เพื่อให้สามารถสั่งงานจากเบราว์เซอร์ได้แม้เปิดไฟล์ผ่าน file:///',
      details: 'แก้ไขตามคำแจ้ง "ไม่ขึ้น": 1) วิเคราะห์พบว่าการเรียกผ่าน x-github-client:// มีพารามิเตอร์ --protocol-launcher ซึ่งตัว Electron จะทำงานในโหมด Background Listener เท่านั้น หากไม่มีหน้าต่างเดิมเปิดอยู่จะทำให้ไม่มีหน้าต่าง GUI ปรากฏขึ้นมา 2) แก้ไขให้เปิดผ่าน Start Menu Shortcut C:\\Users\\495353\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\GitHub, Inc\\GitHub Desktop.lnk ผ่าน explorer.exe ซึ่งทำให้ Windows Shell เปิดหน้าต่าง GUI จริงขึ้นมาเสมอ 3) เพิ่ม Header Access-Control-Allow-Private-Network: true ใน scratch/serve.ps1 และระบบ Image Beacon fallback ใน js/app.js 4) ซิงค์ไฟล์ล่าสุดไปยัง C3-auc-dashboard ครบถ้วน',
      sourceFile: 'คำสั่งผู้ใช้งาน (ไม่ขึ้น)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_fix_github_desktop_launch_and_zombie_cleanup',
      timestamp: '2026-10-23 09:08:00',
      timestampTh: '23 ต.ค. 2569, 09:08 น.',
      type: 'EDIT',
      typeBadge: 'แก้ไขการเปิด GitHub Desktop',
      badgeClass: 'badge-type-edit',
      title: 'แก้ไขปัญหาโปรแกรม GitHub Desktop ไม่ยอมเปิดขึ้นมา ด้วยระบบ Explorer Protocol Launcher และ Zombie Process Cleanup',
      targetSubject: 'ระบบเปิด GitHub Desktop อัตโนมัติ (scratch/serve.ps1, scratch/sync_to_github.ps1, js/app.js)',
      storageFile: 'scratch/serve.ps1, scratch/sync_to_github.ps1, js/app.js & js/data_history.js',
      changeSummary: 'แก้ไขสาเหตุที่ทำให้ GitHub Desktop ไม่เปิดขึ้นมาหลังกดปุ่ม: 1) เคลียร์ Zombie Electron Process ที่ตกค้างในระบบโดยไม่มีหน้าต่างก่อนเปิดใหม่ 2) สั่งเปิดผ่าน explorer.exe ด้วย URI scheme (x-github-client://openRepo/...) เพื่อให้ทำงานใน Interactive Desktop Session ของผู้ใช้โดยตรง 3) ปรับปรุงให้ดึงหน้าต่างโปรแกรมและสลับไปยัง repository C3-auc-dashboard อัตโนมัติ',
      details: 'แก้ไขตามคำแจ้ง "ปิดโปรแกรม GitHub Desktop ไม่ขึ้น / เปิด / ไม่ได้": 1) วิเคราะห์พบว่าเวลาผู้ใช้ปิด GitHub Desktop ผ่านปุ่ม X ตัวโปรแกรม Electron มักทิ้ง process ตกค้างในหน่วยความจำโดยไม่มี MainWindowHandle (zombie) เมื่อมีการสั่งเปิดใหม่ ตัวโปรแกรมจะส่ง signal เข้า process เดิมที่ไม่มีหน้าต่าง ทำให้ไม่มีอะไรแสดงผลบนหน้าจอ 2) แก้ไข scratch/serve.ps1 และ scratch/sync_to_github.ps1 ให้ตรวจสอบและเคลียร์ zombie process ดังกล่าวก่อน 3) แก้ไขการเปิดโปรแกรมให้ใช้ Start-Process explorer.exe x-github-client://openRepo/https://github.com/suphasekC3-OPS/C3-auc-dashboard เพื่อให้ Windows Shell เปิดโปรแกรมขึ้นมาบนหน้าจอเดสก์ท็อปของผู้ใช้โดยตรงและไปยังหน้าแท็บ Changes ทันที 4) อัปเดตและรีสตาร์ตเซิร์ฟเวอร์ช่วยเหลือการซิงค์ localhost:8089 5) ซิงค์ไฟล์ล่าสุดไปยัง C3-auc-dashboard เรียบร้อย',
      sourceFile: 'คำสั่งผู้ใช้งาน (ปิดโปรแกรม GitHub Desktop ไม่ขึ้น / เปิด / ไม่ได้)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_open_github_desktop_delay_2s',
      timestamp: '2026-10-23 08:35:00',
      timestampTh: '23 ต.ค. 2569, 08:35 น.',
      type: 'CONFIG',
      typeBadge: 'เปิด GitHub Desktop หลัง 2 วินาที',
      badgeClass: 'badge-type-config',
      title: 'เพิ่มระบบหน่วงเวลา 2 วินาที ก่อนเปิดโปรแกรม GitHub Desktop หลังกดปุ่ม Update 00AI to GitHub Desktop',
      targetSubject: 'การทำงานของปุ่ม Update 00AI to GitHub Desktop (js/app.js), เซิร์ฟเวอร์ API (scratch/serve.ps1) และสคริปต์ซิงค์ (scratch/sync_to_github.ps1)',
      storageFile: 'js/app.js, scratch/serve.ps1, scratch/sync_to_github.ps1 & js/data_history.js',
      changeSummary: 'ปรับปรุงกระบวนการหลังกดปุ่ม "Update 00AI to GitHub Desktop": ให้ทำการคัดลอกไฟล์ทั้งหมดให้เสร็จสิ้นก่อน จากนั้นหน่วงเวลา 2 วินาที แล้วจึงเปิดหรือดึงโปรแกรม GitHub Desktop ขึ้นมาบนหน้าจออัตโนมัติ เพื่อให้ระบบ Git ตรวจจับไฟล์ที่เปลี่ยนแปลงได้อย่างสมบูรณ์ 100%',
      details: 'ดำเนินการตามคำขอผู้ใช้งาน: 1) ปรับปรุง scratch/serve.ps1 ใน endpoint /api/sync-github ให้ใส่ Start-Sleep -Seconds 2 หลังจากคัดลอกไฟล์เสร็จ ก่อนเรียก Start-Process เปิด GitHubDesktop.exe 2) ปรับปรุง scratch/sync_to_github.ps1 ให้มีหน่วงเวลา 2 วินาทีก่อนเปิด GitHub Desktop เช่นเดียวกัน 3) ปรับปรุง js/app.js แสดงข้อความแจ้งสถานะและดึงหน้าต่างโปรแกรมผ่าน x-github-client protocol 4) ซิงค์ไฟล์ล่าสุดไปยัง D:\\กรย+++\\C3-auc-dashboard เรียบร้อย',
      sourceFile: 'คำสั่งผู้ใช้งาน (ถ้า กดปุ่ม update 00AI .... แล้ว ให้เปิดโปรแกรม github destop ขึ้นมาหลังจากนั้น 2 วินาที ได้ไหม)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_note_left_align_sheet_and_dashboard',
      timestamp: '2026-10-23 08:28:00',
      timestampTh: '23 ต.ค. 2569, 08:28 น.',
      type: 'EDIT',
      typeBadge: 'จัดชิดซ้ายคอลัมน์หมายเหตุ',
      badgeClass: 'badge-type-edit',
      title: 'แก้ไขการแสดงผลคอลัมน์ "หมายเหตุ" ให้แสดงชิดซ้าย (Left Align) ทั้งใน Google Sheet และบนหน้าเว็บ Dashboard',
      targetSubject: 'การบันทึกค่าลง Google Sheet (scratch/Code.gs), การเรนเดอร์ตาราง WBS (js/wbs.js) และ CSS เซลล์หมายเหตุ (css/styles.css)',
      storageFile: 'scratch/Code.gs, js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: 'ปรับปรุงการจัดตำแหน่งข้อความในคอลัมน์ "หมายเหตุ" (Note) ให้ชิดซ้าย (Left Align) 100%: 1) ใน Google Apps Script เพิ่มคำสั่ง setHorizontalAlignment("left") และ setNumberFormat("@") เพื่อป้องกันกรณีที่ผู้ใช้กรอกข้อความที่เป็นตัวเลข (เช่น 111) แล้ว Google Sheet แปลงเป็นตัวเลขและแสดงชิดขวา 2) ใน js/wbs.js และ css/styles.css เพิ่ม text-align: left !important บนเซลล์และข้อความหมายเหตุในตารางหน้าเว็บ',
      details: 'ดำเนินการตามภาพถ่ายและคำสั่งผู้ใช้งาน: 1) วิเคราะห์พบว่าเมื่อผู้ใช้แก้ไขหมายเหตุผ่านหน้าเว็บ Dashboard โดยพิมพ์ตัวเลข เช่น 111 เมื่อบันทึกเข้า Google Sheet ระบบเดิมไม่ได้ระบุรูปแบบ Plain Text ทำให้ชีตตีความเป็น Number ส่งผลให้เลขชิดขวาของเซลล์ 2) ปรับปรุง scratch/Code.gs ใน updateWbsRecord ให้ใช้ .setNumberFormat("@") และ .setHorizontalAlignment("left") กับทั้งคอลัมน์หมายเหตุ, แผนปิดงาน และ WBS 3) ปรับปรุง js/wbs.js ในเรนเดอร์ตาราง WBS ให้เซลล์หมายเหตุมีสไตล์ text-align: left !important 4) ปรับปรุง css/styles.css ในคลาส .wbs-note-cell ให้มี text-align: left !important 5) ซิงค์ไฟล์ล่าสุดไปยัง D:\\กรย+++\\C3-auc-dashboard ครบถ้วน',
      sourceFile: 'คำสั่งผู้ใช้งาน (แก้ไขใน หมายเหตุ ใน dasboard แล้วให้แสดงชิดทางซ้ายในคอล้ม พร้อมรูปประกอบตัวเลข 111 ที่ชิดขวาใน Google Sheet)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_rename_btn_update_00ai_to_github_desktop',
      timestamp: '2026-10-23 08:12:00',
      timestampTh: '23 ต.ค. 2569, 08:12 น.',
      type: 'CONFIG',
      typeBadge: 'ปรับปรุงปุ่ม Update 00AI to GitHub Desktop',
      badgeClass: 'badge-type-config',
      title: 'ปรับปรุงชื่อปุ่มเป็น "Update 00AI to GitHub Desktop" และยกเลิกปุ่มลัดบนหน้าจอ Desktop ตามคำสั่งผู้ใช้งาน',
      targetSubject: 'ปุ่มบนแถบ Header (index.html), กล่องข้อความ Modal, สคริปต์ควบคุม (js/app.js) และการลบปุ่มลัดหน้าจอ Desktop',
      storageFile: 'index.html, js/app.js & js/data_history.js',
      changeSummary: 'ดำเนินการตามคำขอ 2 ข้อ: 1) ยกเลิกและลบปุ่มลัดบนหน้าจอ Desktop ออกทั้งหมด คงเหลือเฉพาะปุ่มบนหน้าเว็บ Dashboard เพียงอย่างเดียว 2) เปลี่ยนชื่อปุ่มและข้อความแสดงผลทั้งหมดเป็น "Update 00AI to GitHub Desktop" เพื่อความชัดเจนในการทำงาน',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: 1) ลบไฟล์ Shortcut "update to GitHub Desktop.lnk" ออกจากหน้าจอ Desktop เรียบร้อย 2) แก้ไขข้อความปุ่มใน Header ของ index.html เป็น "Update 00AI to GitHub Desktop" 3) ปรับปรุงหัวข้อและเนื้อหาใน updateGithubModal ให้ตรงกัน 4) ปรับปรุงข้อความ fallback ใน js/app.js 5) คัดลอกและซิงค์ไฟล์ล่าสุดทั้งหมดไปยัง D:\\กรย+++\\C3-auc-dashboard ครบถ้วน',
      sourceFile: 'คำสั่งผู้ใช้งาน (1.ยกเลิก ปุ่มลัด 1 คลิกบนหน้าจอ Desktop คงมีแค่ปุ่ม ปุ่มบนหน้าเว็บ Dashboard อย่างเดียว 2.และแก้ชื่อปุ่ม เป็น Update 00AI to GitHub Desktop)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_btn_update_to_github_desktop',
      timestamp: '2026-10-23 08:00:00',
      timestampTh: '23 ต.ค. 2569, 08:00 น.',
      type: 'CONFIG',
      typeBadge: 'ปุ่ม update to GitHub Desktop',
      badgeClass: 'badge-type-config',
      title: 'เพิ่มปุ่มและระบบคัดลอกไฟล์อัตโนมัติ "update to GitHub Desktop" จาก 00AI ไปยัง C3-auc-dashboard',
      targetSubject: 'แถบเมนู Header (index.html), โมดูลควบคุม (js/app.js), สคริปต์ 1 คลิก (Update_to_GitHub_Desktop.bat) และทางลัดหน้าจอ Desktop',
      storageFile: 'index.html, js/app.js, Update_to_GitHub_Desktop.bat, scratch/serve.ps1 & js/data_history.js',
      changeSummary: 'สร้างปุ่มและระบบทางลัด 1 คลิก "update to GitHub Desktop" ช่วยคัดลอกไฟล์หน้าเว็บที่อัปเดตล่าสุดทั้งหมด (index.html, js, css, assets) จากโฟลเดอร์ทำงาน 00AI ไปยังโฟลเดอร์ C3-auc-dashboard ทันที พร้อมโฟกัสหน้าต่าง GitHub Desktop เพื่อให้รายการ Changes เด้งขึ้นมาพร้อมกด Commit & Push ได้ทันที',
      details: 'ดำเนินการตามคำขอผู้ใช้งาน: 1) สร้างไฟล์แบตช์ Update_to_GitHub_Desktop.bat ในโฟลเดอร์ 00AI สำหรับคัดลอกไฟล์และเปิด GitHub Desktop 2) สร้าง Desktop Shortcut "update to GitHub Desktop" ไว้ที่หน้าจอ Desktop ของผู้ใช้ 3) เพิ่มปุ่ม "update to GitHub Desktop" ใน Header ของ index.html พร้อมไอคอน GitHub 4) เพิ่มฟังก์ชัน window.triggerUpdateToGithubDesktop() ใน js/app.js และ endpoint /api/sync-github ใน scratch/serve.ps1 รองรับการคลิกจากเบราว์เซอร์ 5) ซิงค์ไฟล์ล่าสุดทั้งหมดไปยัง D:\\กรย+++\\C3-auc-dashboard เรียบร้อย',
      sourceFile: 'คำสั่งผู้ใช้งาน (1.เพิ่มปุ่มคัดลอกไฟล์ ล่าสุดจาก 00AI ไปยัง C3-auc-dashboard 2.หลังจากกดแล้วให้แสดงใน change GitHub Desktop ทันที ทำได้ไหม 3.ถ้าได้ ชื่อปุ่ม update to GitHub Desktop)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_wbs_dual_matching_job_description_gas',
      timestamp: '2026-10-23 01:45:00',
      timestampTh: '23 ต.ค. 2569, 01:45 น.',
      type: 'FIX',
      typeBadge: 'แก้ไขการค้นหาชื่องาน Google Sheet',
      badgeClass: 'badge-type-edit',
      title: 'แก้ไขระบบเชื่อมโยง Google Sheet: ตรวจจับชื่องาน (Job Description) อัจฉริยะ ป้องกันการแจ้งเตือนไม่พบข้อมูลผิดพลาด',
      targetSubject: 'ระบบซิงค์ Google Sheet (js/wbs.js), โค้ด Apps Script หลังบ้าน (scratch/Code.gs) และการแสดงผลสถานะเซลล์',
      storageFile: 'js/wbs.js, scratch/Code.gs & js/data_history.js',
      changeSummary: 'ตรวจสอบพบสาเหตุที่แถว WBS แสดง "ไม่พบใน Google Sheet" ทั้งที่มีข้อมูลในชีต: เนื่องจากใน Google Sheet มีการกรอกเฉพาะคอลัมน์ "ชื่องาน" (Job Description) แต่ยังไม่ได้ระบุ WBS/แผนปิดงาน หรือหัวตารางถูกจัดวางหลายชั้น จึงได้ปรับปรุงให้: 1) Code.gs สแกนหัวตาราง 5 แถวแรกและตรวจจับหัวตารางซ้ำกลางชีต (Stacked Tables) พร้อมดึงทั้ง WBS และ ชื่องาน ส่งกลับมา 2) js/wbs.js เพิ่มการจับคู่ 2 ชั้น (WBS Code + ชื่องาน แบบ Normalized & Substring) 3) หากพบชื่องานใน Sheet แม้ยังไม่ได้กรอกข้อมูล จะแสดงสถานะปกติ (-) ไม่ขึ้นสีแดง 4) ระบบบันทึก ✏️ ส่งทั้ง WBS และชื่องานไปช่วยเติมใน Google Sheet ให้อัตโนมัติ',
      details: 'ดำเนินการตรวจสอบด่วนตามคำร้องเรียนผู้ใช้งาน: 1) วินิจฉัยข้อเท็จจริงพบว่ารายการ WBS ที่วงใน กฟจ.สมุทรสาคร (เช่น P-TDD01.2-I-SMNS0.SMC3, P-TDD01.1-I-SMNT0.0004) และอีกหลาย WBS มีชื่องานใน Google Sheet แต่ยังไม่ได้กรอกข้อมูลแผน/หมายเหตุ หรือช่อง WBS ในชีตเว้นว่างไว้ ทำให้สคริปต์เดิมที่ดึงเฉพาะ WBS มองข้ามแถวไป 2) ปรับปรุง scratch/Code.gs เพิ่มการสแกนหา descCol (ชื่องาน, รายละเอียดงาน, โครงการ) และรองรับตารางซ้ำซ้อนในชีต ส่งคืนทั้ง data และ dataByDesc 3) ปรับปรุง js/wbs.js ใน syncLiveNotesFromGoogleSheet ให้เทียบรหัส WBS และชื่องานคู่ขนานกัน 4) แก้ไขให้แถวที่พบใน Google Sheet แต่ยังไม่ระบุแผนปิดงาน แสดงผลเป็นปกติ ไม่แสดงพื้นหลังสีแดงหรือข้อความไม่พบ 5) ปรับปรุง initWbsApp ให้ตั้งสถานะเริ่มต้นเป็นปกติ ไม่ให้เกิดอาการกะพริบสีแดงขณะกำลังโหลดข้อมูล 6) ไม่มีการส่งไฟล์ไปยัง 00AI V2 ตามคำสั่งยกเลิก',
      sourceFile: 'คำสั่งผู้ใช้งาน (วงกลมที่วง มีชื่องาน ใน google sheet แต่ยังไม่ได้กรอกข้อมูล และทำไหมถึงแสดง ไม่พบใน google sheet ให้ตรวจสอบด่วน และเป็นหลาย WBS ด้วย)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง'
    },
    {
      id: 'log_000_cancel_sync_to_00ai_v2',
      timestamp: '2026-10-23 01:10:00',
      timestampTh: '23 ต.ค. 2569, 01:10 น.',
      type: 'CONFIG',
      typeBadge: 'ยกเลิก Sync 00AI V2',
      badgeClass: 'badge-type-config',
      title: 'ยกเลิกกระบวนการซิงค์ไฟล์ไปยังโฟลเดอร์ 00AI V2 ทั้งหมดตามคำสั่งผู้ใช้งาน',
      targetSubject: 'ขั้นตอนการทำงานและการซิงค์ไฟล์สำรอง (D:\\กรย+++\\00AI V2)',
      storageFile: 'js/data_history.js',
      changeSummary: 'ยกเลิกกระบวนการซิงค์ไฟล์ไปยังโฟลเดอร์ 00AI V2 ทั้งหมดตามคำสั่งผู้ใช้งาน โดยจะดำเนินการพัฒนา แก้ไข และบันทึกข้อมูลเฉพาะที่โฟลเดอร์หลัก D:\\กรย+++\\00AI เท่านั้น',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (ยกเลิก Sync 00AI V2 ทั้งหมด): 1) ยุติการทำงานของสคริปต์ซิงค์และไม่ทำการคัดลอกไฟล์ไปยัง D:\\กรย+++\\00AI V2 อีกต่อไป 2) มุ่งเน้นการพัฒนาและบันทึกประวัติการเปลี่ยนแปลงทั้งหมดลงบนระบบหลัก D:\\กรย+++\\00AI โดยตรง',
      sourceFile: 'คำสั่งผู้ใช้งาน (ยกเลิก Sync 00AI V2 ทั้งหมด)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_wbs_sync_strict_sheet_red_not_found',
      timestamp: '2026-10-23 01:05:00',
      timestampTh: '23 ต.ค. 2569, 01:05 น.',
      type: 'CONFIG',
      typeBadge: 'ยึด Google Sheet & พื้นสีแดง',
      badgeClass: 'badge-type-config',
      title: 'ปรับปรุงระบบ Auto-Sync WBS ดึงเฉพาะแผนปิดงานและหมายเหตุ และหากไม่พบใน Google Sheet ให้แสดงพื้นสีแดง',
      targetSubject: 'ระบบแสดงผลตาราง WBS (renderWbsTable, syncLiveNotesFromGoogleSheet) ใน js/wbs.js, scratch/Code.gs และ css/styles.css',
      storageFile: 'js/wbs.js, scratch/Code.gs, css/styles.css, index.html & js/data_history.js',
      changeSummary: 'ปรับปรุงตามข้อกำหนด 2 ข้อ: 1) Auto-Sync ดึงข้อมูลจาก Google Sheet เฉพาะคอลัมน์ "แผนปิดงาน" (planClose) และ "หมายเหตุ" (note) เท่านั้น ไม่ดึงหรือแตะต้องสถานะหรือข้อมูลอื่น 2) หากหา WBS ใดใน Google Sheet ไม่เจอ ให้แสดงทั้งช่องแผนปิดงานและหมายเหตุเป็นพื้นสีแดง (background red) พร้อมป้ายเตือน "❌ ไม่พบใน Google Sheet" โดยห้ามนำข้อมูลเก่ามาแสดงเด็ดขาด ยึดข้อมูลจาก Google Sheet 100%',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: 1) ใน syncLiveNotesFromGoogleSheet ทำการดึงเฉพาะ planClose และ note โดยเทียบรหัส WBS แบบ Trim & Case-Insensitive 2) สำหรับ WBS ที่ไม่พบใน Google Sheet กำหนด item.planClose = "", item.note = "", item.notFoundInSheet = true 3) ใน renderWbsTable เพิ่มเงื่อนไขให้แสดงเซลล์แผนปิดงานและหมายเหตุเป็นพื้นสีแดง (background: rgba(220, 38, 38, 0.28) !important; border-left/right: 2px solid #EF4444) พร้อมป้าย badge-plan-not-found และคงปุ่ม ✏️ ให้สามารถคลิกระบุข้อมูลส่งเข้า Google Sheet ได้ 4) ใน updateWbsPlanCloseDropdown เพิ่มตัวเลือกตัวกรอง "❌ ไม่พบใน Google Sheet" ให้กดกรองเฉพาะงานที่ไม่พบได้ทันที 5) ใน initWbsApp ทำการล้างข้อมูลเก่าของแผนปิดงานและหมายเหตุทั้งหมดทันทีเมื่อเริ่มต้นระบบ เพื่อรับประกันว่าไม่มีข้อมูลเก่าหลงเหลือมาแสดงผล 6) อัปเดต scratch/Code.gs และซิงค์ไฟล์ไปยัง 00AI V2 ครบถ้วน',
      sourceFile: 'คำสั่งผู้ใช้งาน (1.ให้แก้คำสั่ง เป็น Auto-Sync เมื่อเปิดแท็บ WBS และดึงข้อมูล google sheet เฉพาะ แผนปิดงาน และหมายเหตุเท่านั้น 2.หากหา WBS ใน google sheet ไม่เจอ ให้แสดง แผนปิดงาน และหมายเหตุ เป็นพื้นสีแดง ห้ามนำข้อมูลเก่ามาแสดง ให้ยึดจาก google sheet เท่านั้น)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง'
    },
    {
      id: 'log_000_auto_sync_google_sheet_on_wbs_tab_open',
      timestamp: '2026-10-23 00:50:00',
      timestampTh: '23 ต.ค. 2569, 00:50 น.',
      type: 'CONFIG',
      typeBadge: 'Auto-Sync เมื่อเปิดแท็บ WBS',
      badgeClass: 'badge-type-config',
      title: 'เปิดใช้งานระบบ Auto-Sync ข้อมูลจาก Google Sheet อัตโนมัติทันทีเมื่อเปิดแท็บ WBS',
      targetSubject: 'ระบบซิงค์ Google Sheet ข้าม 9 แท็บ (window.syncLiveNotesFromGoogleSheet) ใน js/wbs.js และ js/app.js',
      storageFile: 'js/wbs.js, js/app.js, scratch/Code.gs, index.html & js/data_history.js',
      changeSummary: 'เชื่อมโยงระบบ Auto-Sync ดึงข้อมูลแผนปิดงาน (planClose), หมายเหตุ (note) และสถานะ SAP จาก Google Sheet ทั้ง 9 แท็บเกณฑ์วัดโดยอัตโนมัติทันทีที่ผู้ใช้งานคลิกเปิดแท็บ WBS หรือโหลดหน้าเว็บที่แท็บ WBS พร้อมเพิ่มระบบป้องกันการส่ง Request ซ้ำซ้อน (Concurrency Guard & 5-Second Throttle) และแสดงแจ้งเตือนความคืบหน้าการซิงค์',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (Auto-Sync เมื่อเปิดแท็บ WBS): 1) แก้ไขฟังก์ชัน switchTab ใน js/app.js ให้เรียก window.syncLiveNotesFromGoogleSheet(false) ทันทีเมื่อสลับมาที่ tab-wbs 2) เพิ่ม Event Listener ใน setupWbsListeners ของ js/wbs.js บนปุ่มนำทาง [data-tab="tab-wbs"] ทั้งหมด 3) เพิ่มการตรวจสอบใน initWbsApp() หากหน้าเว็บเริ่มต้นเปิดอยู่ที่แท็บ WBS ให้สั่ง Auto-Sync ทันที 4) ปรับปรุงฟังก์ชัน syncLiveNotesFromGoogleSheet ให้มีตัวแปร isGoogleSheetSyncInProgress และ lastSyncTimestamp ป้องกันการยิงคำขอซ้ำซ้อน 5) เพิ่มการแมปข้อมูลฟิลด์ statusSap และ status รองรับหาก Google Sheet มีคอลัมน์สถานะ 6) อัปเดต scratch/Code.gs ให้สแกนคอลัมน์สถานะ SAP และซิงค์ไฟล์ไปยัง 00AI V2 ครบถ้วน',
      sourceFile: 'คำสั่งผู้ใช้งาน (Auto-Sync เมื่อเปิดแท็บ WBS)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_reset_filter_align_latest_month',
      timestamp: '2026-10-23 00:30:00',
      timestampTh: '23 ต.ค. 2569, 00:30 น.',
      type: 'CONFIG',
      typeBadge: 'ปรับปุ่มรีเซ็ตเป็นเดือนล่าสุด',
      badgeClass: 'badge-type-config',
      title: 'ปรับปรุงปุ่มรีเซ็ตตัวกรองหน้าแรกให้เชื่อมโยงและคืนค่าเป็นเดือนล่าสุด (ก.ย. 2569)',
      targetSubject: 'ปุ่มรีเซ็ตตัวกรองหลัก (#btnResetFilters) และฟังก์ชันคำนวณเดือนล่าสุดใน js/app.js',
      storageFile: 'js/app.js, index.html & js/data_history.js',
      changeSummary: 'แก้ไขตรรกะการทำงานของปุ่มรีเซ็ตตัวกรอง (#btnResetFilters) บนหน้าแรก จากเดิมที่เคยล็อคค่าคงที่ไว้ที่เดือน ส.ค. (index 7) ให้เปลี่ยนมาใช้ฟังก์ชัน getLatestAvailableMonthIndex() ดึงข้อมูลเดือนล่าสุดที่มีในระบบโดยอัตโนมัติ (ปัจจุบันคือเดือน ก.ย. 2569 / index 8) พร้อมโหลดข้อมูลของเดือนล่าสุดใหม่ (loadDataForMonth) และปรับปรุงตัวสำรองเดือนเริ่มต้นของทั้งระบบให้เป็นเดือนล่าสุดอย่างสมบูรณ์',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (ปุ่มรีเซท หน้าแรกให้ไปอิงกับเดือนล่าสุด): 1) เพิ่มฟังก์ชัน getLatestAvailableMonthIndex() ใน js/app.js เพื่อตรวจสอบย้อนหลังจากเดือน ธ.ค. หาเดือนล่าสุดที่มีรายงานข้อมูลจริง 2) แก้ไขปุ่ม #btnResetFilters ให้คืนค่า state.filters.month เป็นเดือนล่าสุด พร้อมสั่ง loadDataForMonth(latestM) และอัปเดต Dropdown #filterMonth ทันที 3) ปรับปรุงตัวแปรสำรองเดือนเริ่มต้นในระบบ (selectedMonthBadge, syncChartFilterUI, selectionStrip, criteriaComparisonChart) ให้ใช้ getLatestAvailableMonthIndex() แทนค่าคงที่ 7 4) ซิงค์ไฟล์ไปยัง 00AI V2 ครบถ้วน',
      sourceFile: 'คำสั่งผู้ใช้งาน (ปุ่มรีเซท หน้าแรกให้ไปอิงกับเดือนล่าสุด)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_swap_red_yellow_charts_sticky_blue_left',
      timestamp: '2026-10-23 00:05:00',
      timestampTh: '23 ต.ค. 2569, 00:05 น.',
      type: 'EDIT',
      typeBadge: 'ปรับเลย์เอาต์กราฟ',
      badgeClass: 'badge-type-edit',
      title: 'สลับตำแหน่งกราฟเกณฑ์วัดขึ้นบน กราฟแท่งลงล่าง กว้างเท่ากัน และล็อคแถบสรุปสีน้ำเงินติดหน้าจอด้านซ้าย',
      targetSubject: 'เลย์เอาต์กราฟหลักภาพรวมผู้บริหาร (topCriteriaChartCard, unifiedProjectionOfficeCard, topExecutiveLeftDeck)',
      storageFile: 'index.html, css/styles.css, js/app.js & js/data_history.js',
      changeSummary: 'สลับตำแหน่งกราฟ: ย้ายกราฟเกณฑ์วัด 8 ประเภท (กรอบสีแดง) ขึ้นไว้ด้านบน และย้ายกราฟประมาณการ 3 เดือน + ผลการดำเนินงานราย กฟฟ. (กรอบสีเหลือง) ลงไว้ด้านล่าง โดยปรับขนาดความกว้างของกราฟสีแดงให้เท่ากับกราฟสีเหลืองพอดีเป๊ะ พร้อมปรับให้แถบสรุปโดนัท KPI (กรอบสีน้ำเงิน) ค้างติดหน้าจอตลอด (Sticky) อยู่ด้านซ้ายมือขนาดเดิม และเชื่อมโยงการคลิกเลือกเกณฑ์วัดให้ซิงค์ข้อมูลกับแถบสีน้ำเงินทันที',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: 1) ปรับโครงสร้างใน index.html โดยสร้าง container .top-executive-right-stack ครอบทั้งกราฟเกณฑ์วัด (topCriteriaChartCard) ไว้ด้านบน และกราฟประมาณการ + แท่งราย กฟฟ. (unifiedProjectionOfficeCard) ไว้ด้านล่าง 2) ปรับ CSS ใน css/styles.css ให้ทั้งสองกราฟมีความกว้างเท่ากัน 100% ของคอลัมน์ขวา 3) ปรับ .top-executive-left-deck ให้เป็น position: sticky; top: calc(var(--sticky-header-height, 134px) + 0.35rem) และ align-self: start; เพื่อให้แถบสีน้ำเงินค้างตรึงอยู่ด้านซ้ายตลอดเวลาที่เลื่อนดูหรือเลือกใช้งานกราฟแดงหรือเหลือง 4) เพิ่ม onClick ใน chartOptions ของกราฟเกณฑ์วัด และปรับปรุง selectSidebarCriteria ให้สามารถคลิกเลือกเพื่อกรองข้อมูลและคลิกซ้ำเพื่อคืนค่า ALL ได้ทันที พร้อมซิงค์ข้อมูลแสดงผลบนการ์ดสีน้ำเงิน',
      sourceFile: 'คำสั่งผู้ใช้งาน (1. ย้ายกราฟ สีเเดงไว้ด้านบน และเหลือง ด้านล่าง ให้สลับตำแหน่งกัน 2. และปรับขนาดกราฟ สีแดง ให้กว้างเท่ากับสีเหลือง 2.ให้กราฟ สีน้ำเงิน ค้างไว้ หากเลือกกราฟ แดง หรือเหลือง ก็สามารถเห็นกราฟสีน้ำเงิน ตลอดด้านซ้ายมือเหมือนเดิม ขนาดเดิม)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_update_sep_01_auc_report_33teco',
      timestamp: '2026-10-22 23:18:00',
      timestampTh: '22 ต.ค. 2569, 23:18 น.',
      type: 'IMPORT',
      typeBadge: 'อัปเดตไฟล์ข้อมูล 01',
      badgeClass: 'badge-type-import',
      title: 'อัปเดตฐานข้อมูลรายงาน AUC เดือน 9 ก.ย. (3.3teco) ตามไฟล์ 01 ล่าสุด',
      targetSubject: 'รายงาน AUC ประจำเดือน ก.ย. 2569 (window.AUC_DATA_SEP) หมวดเกณฑ์วัด ข้อ 3.3 TECO D2',
      storageFile: 'js/data_sep.js, index.html & js/data_history.js',
      changeSummary: 'ประมวลผลและอัปเดตข้อมูลจากไฟล์ "01 รายงาน AUC เดือน 9ก.ย.  (3.3teco).xlsx" ที่มีการแก้ไขล่าสุด (22 ต.ค. 2569 เวลา 21:03 น.): อัปเดตหมวดเกณฑ์วัดข้อ 3 ในเดือน ก.ย. จากเดิม "ข้อ 3.2 TECO D2" เป็น "ข้อ 3.3 TECO D2" ครบทั้ง 46 รายการ รวมทั้งสิ้น 368 รายการ และซิงค์ไฟล์ไปยัง 00AI V2 เรียบร้อย',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (update ไฟล์ 01 เดือน 9ก.ย.): 1) ตรวจสอบไฟล์ 01 รายงาน AUC เดือน 9ก.ย.  (3.3teco).xlsx พบว่ามีการแก้ไขแถว 232-277 ในหมวดเกณฑ์วัดข้อ 3 จากเดิม "ข้อ 3.2 TECO D2" เป็น "ข้อ 3.3 TECO D2" ให้ตรงตามรอบเวลาและชื่อไฟล์ 2) สกัดข้อมูลใหม่ทั้ง 368 รายการ บันทึกลง js/data_sep.js (window.AUC_DATA_SEP) 3) ซิงค์ไฟล์ js/data_sep.js และไฟล์ Excel ไปยังโฟลเดอร์ 00AI V2 เพื่อความสมบูรณ์ 4) อัปเดต cache version ใน index.html เป็น ?v=20261022_2315 เพื่อให้เบราว์เซอร์โหลดข้อมูลสดใหม่ทันที',
      sourceFile: '01 รายงาน AUC เดือน 9ก.ย.  (3.3teco).xlsx (อัปเดต 22 ต.ค. 2569 21:03 น.)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_wbs_sync_on_button_click_only',
      timestamp: '2026-10-22 22:28:00',
      timestampTh: '22 ต.ค. 2569, 22:28 น.',
      type: 'CONFIG',
      typeBadge: 'ซิงค์เฉพาะกดปุ่ม',
      badgeClass: 'badge-type-config',
      title: 'ปรับปรุงระบบซิงค์ Google Sheet ให้ทำงานเฉพาะเมื่อผู้ใช้กดปุ่มเท่านั้น',
      targetSubject: 'ระบบซิงค์ข้อมูล Google Sheet (#btnSyncGoogleSheet) และฟังก์ชัน initWbsApp ใน js/wbs.js',
      storageFile: 'index.html, js/wbs.js & js/data_history.js',
      changeSummary: 'ยกเลิกการดึงข้อมูลอัตโนมัติในพื้นหลังทั้งหมด (Auto-Sync on Load, Visibility Change และ Interval Polling) โดยเปลี่ยนให้ระบบซิงค์ข้อมูลจาก Google Sheet เฉพาะเมื่อผู้ใช้กดปุ่ม "ซิงค์ Google Sheet" เท่านั้น เพื่อความเสถียรและให้ผู้ใช้ควบคุมการโหลดข้อมูลเอง 100%',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (แก้ไข ซิง google sheet เฉพาะกดปุ่มเท่านั้น): 1) ใน js/wbs.js ตัดคำสั่ง auto-sync ใน background ออกทั้งหมด (setTimeout โหลดหน้าเว็บ, visibilitychange สลับแท็บ, และ setInterval ทุก 60 วินาที) 2) การดึงข้อมูลสดจาก Google Sheet จะทำงานเฉพาะเมื่อมีการคลิกปุ่ม #btnSyncGoogleSheet โดยตรงเท่านั้น 3) ปรับปรุง tooltip และป้ายสถานะใน index.html ให้สอดคล้องกัน',
      sourceFile: 'คำสั่งผู้ใช้งาน (แก้ไข ซิง google sheet เฉพาะกดปุ่มเท่านั้น)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_wbs_modal_clean_strict_3_choices_fix',
      timestamp: '2026-10-22 22:25:00',
      timestampTh: '22 ต.ค. 2569, 22:25 น.',
      type: 'EDIT',
      typeBadge: 'ตัดตัวเลือกส่วนเกินออก',
      badgeClass: 'badge-type-edit',
      title: 'แก้ไขและล็อค Dropdown แผนปิดงานให้แสดงเฉพาะ 3 ตัวเลือกตรงชีต ตัดค่าขยะ ไตรมาส 4 และ งวด สค ออกถาวร',
      targetSubject: 'หน้าต่างโมดัลแก้ไขงาน WBS (#wbsEditModalPlan) ใน js/wbs.js',
      storageFile: 'js/wbs.js & js/data_history.js',
      changeSummary: 'แก้ไขฟังก์ชัน refreshWbsPlanCloseDropdownOptions โดยตัดคำสั่งสแกนข้อมูลเก่า allData ออกอย่างเด็ดขาด เพื่อป้องกันไม่ให้ค่าเก่าที่เคยติด ไตรมาส 4 หรือ งวดบัญชี สค หลุดเข้ามาใน Dropdown ทำให้ปัจจุบันแสดงเฉพาะ 3 ตัวเลือกตาม Google Sheet เป๊ะ 100%',
      details: 'ดำเนินการตามคำถาม/ปัญหาของผู้ใช้งาน (ทำไม แผนปิดงาน dropdown list ไม่ตรงตาม google sheet - มีตัวเลือกอื่นปนมาเกิน 3 ตัวเลือก): 1) สาเหตุเกิดจากระบบเดิมมีการสแกนหาตัวเลือกจากฐานข้อมูลเริ่มต้น ซึ่งมีข้อมูลเก่าติดคำว่า "ไตรมาส 4" และ "งวดบัญชี สค" 2) แก้ไขใน js/wbs.js โดยกำหนด exactOptions ให้มีเฉพาะ "งวดบัญชี ต.ค. 69", "งวดบัญชี พ.ย. 69", "งวดบัญชี ธ.ค. 69" และตัวเลือกเว้นว่าง 3) ตัดการสแกน dynamicOptionsSet จาก allData ทิ้งทั้งหมด ทำให้ตัวเลือกสะอาดและตรงกับ Google Sheet 100%',
      sourceFile: 'คำสั่งผู้ใช้งาน (ทำไม แผนปิดงาน dropdown list ไม่ตรงตาม google sheet)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_wbs_realtime_auto_sync_google_sheet_plan_dropdown',
      timestamp: '2026-10-22 21:37:00',
      timestampTh: '22 ต.ค. 2569, 21:37 น.',
      type: 'CONFIG',
      typeBadge: 'ซิงค์ Dropdown อัตโนมัติ',
      badgeClass: 'badge-type-config',
      title: 'เพิ่มระบบตรวจจับและซิงค์ตัวเลือกแผนปิดงานจาก Google Sheet แบบอัตโนมัติเรียลไทม์',
      targetSubject: 'ระบบซิงค์ Google Sheet ข้าม 9 แท็บ (window.syncLiveNotesFromGoogleSheet) และ Dropdown โมดัลแก้ไข WBS',
      storageFile: 'index.html, js/wbs.js & js/data_history.js',
      changeSummary: 'เพิ่มคำสั่งอัตโนมัติให้ Dashboard ตรวจจับการแก้ไข/เปลี่ยนแปลง/เพิ่ม แผนปิดงานใน Google Sheet ทันที: 1) ซิงค์อัตโนมัติเมื่อเปิดหน้าเว็บ 2) ซิงค์ทันทีเมื่อสลับแท็บกลับมาที่ Dashboard (Tab Focus/Visibility Change) 3) แบ็กกราวด์ออโต้ซิงค์ทุก 60 วินาที 4) ฟังก์ชัน refreshWbsPlanCloseDropdownOptions กวาดตัวเลือกใหม่ใน Google Sheet มาเพิ่มใน Dropdown ทันที',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (เพิ่มคำสังอัตโนมัติ หาก google sheet มีการแก้ไข/เปลี่ยนแปลง/เพิ่ม แผนปิดงาน dropdown ให้มาแก้ไขใน dasboard Index ทันที): 1) ใน js/wbs.js พัฒนาระบบ Background Polling และ Event-driven Auto Sync ด้วย visibilitychange และ focus ดักจับเมื่อผู้ใช้สลับหน้าต่างกลับมาจาก Google Sheet แล้วดึงข้อมูลทันที 2) ฟังก์ชัน refreshWbsPlanCloseDropdownOptions ทำการสแกนหาตัวเลือกใหม่ที่เพิ่มเข้ามาในชีต แล้วอัปเดตลง <select id="wbsEditModalPlan"> ทันที 3) ปรับปรุง index.html แสดงสถานะการซิงค์สดแบบเรียลไทม์',
      sourceFile: 'คำสั่งผู้ใช้งาน (เพิ่มคำสังอัตโนมัติ หาก google sheet มีการแก้ไข/เปลี่ยนแปลง/เพิ่ม แผนปิดงาน dropdown ให้มาแก้ไขใน dasboard Index ทันที)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง'
    },
    {
      id: 'log_000_wbs_modal_plan_close_strictly_3_choices',
      timestamp: '2026-10-22 21:20:00',
      timestampTh: '22 ต.ค. 2569, 21:20 น.',
      type: 'EDIT',
      typeBadge: 'จำกัด 3 ตัวเลือกตรงชีต',
      badgeClass: 'badge-type-edit',
      title: 'ปรับปรุง Dropdown แผนปิดงานให้มีเฉพาะ 3 ตัวเลือกตรงตาม Google Sheet เท่านั้น',
      targetSubject: 'หน้าต่างโมดัลแก้ไขงาน WBS (#wbsEditModalPlan) และการซิงค์ข้อมูลกับ Google Sheet',
      storageFile: 'index.html, js/wbs.js & js/data_history.js',
      changeSummary: 'ตัดตัวเลือกส่วนเกินทั้งหมดออก ให้ Dropdown แผนปิดงานมีเฉพาะ 3 ตัวเลือกที่ใช้จริงใน Google Sheet: 1) งวดบัญชี ต.ค. 69 2) งวดบัญชี พ.ย. 69 3) งวดบัญชี ธ.ค. 69 (และตัวเลือกเว้นว่าง) ตัดตัวเลือกพิมพ์เองออก เพื่อให้ตรงตามกติกาของ Google Sheet เป๊ะ 100%',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (Dropdown ใน Dashboard แก้ไขตรงกับ google sheet เท่านั้น 3 ตัวเลือก): 1) ใน index.html กำหนด <option> ใน #wbsEditModalPlan เหลือเฉพาะ "-- ไม่ระบุแผนปิดงาน (เว้นว่าง) --", "งวดบัญชี ต.ค. 69", "งวดบัญชี พ.ย. 69" และ "งวดบัญชี ธ.ค. 69" 2) นำตัวเลือกพิมพ์เองและกลุ่มงวดอื่นๆ ออกทั้งหมด 3) ใน js/wbs.js ทำความสะอาดฟังก์ชัน openWbsEditNoteModal และ submitWbsEditNoteModal ให้ทำงานกระชับและส่งเฉพาะ 3 ตัวเลือกนี้ไปยัง Google Apps Script',
      sourceFile: 'คำสั่งผู้ใช้งาน (Dropdown ใน Dashboard แก้ไขตรงกับ google sheet เท่านั้น 3 ตัวเลือก)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_wbs_modal_plan_close_dropdown',
      timestamp: '2026-10-22 21:12:00',
      timestampTh: '22 ต.ค. 2569, 21:12 น.',
      type: 'EDIT',
      typeBadge: 'ตัวเลือกแผนปิดงานตรงชีต',
      badgeClass: 'badge-type-edit',
      title: 'เปลี่ยนช่อง "แผนปิดงาน" ในหน้าต่างแก้ไขให้เป็น Dropdown ตัวเลือกตรงตาม Google Sheet',
      targetSubject: 'หน้าต่างโมดัลแก้ไขงาน WBS (#wbsEditNoteModal, #wbsEditModalPlan) และระบบบันทึกลง Google Sheet',
      storageFile: 'index.html, js/wbs.js & js/data_history.js',
      changeSummary: 'เปลี่ยนช่องกรอกแผนปิดงานจากข้อความอิสระ (Text Input) ให้เป็น Dropdown (<select>) พร้อมชุดตัวเลือกงวดบัญชีปี 2569 - 2570 และไตรมาส ตรงตาม Data Validation ของ Google Sheet 100% ป้องกันการพิมพ์ผิดและการปฏิเสธข้อมูลในชีต',
      details: 'ดำเนินการตามคำถาม/คำขอผู้ใช้งาน (ใน goosheet แผนปิดงาน เป็นแบบมีตัวเลือก พิมไม่ได้ แต่ใน dasboard เป็นแบบไม่มีตัวเลือกจะทำอย่างไรให้เหมือนกัน): 1) ใน index.html เปลี่ยน #wbsEditModalPlan เป็น <select class="form-select"> จัดกลุ่มตัวเลือกงวดบัญชี ต.ค. 69, พ.ย. 69, ธ.ค. 69, ไตรมาส 4, งวดปี 2570, งวดย้อนหลัง และตัวเลือกเว้นว่าง 2) ใน js/wbs.js ปรับปรุง openWbsEditNoteModal ให้ตรวจจับค่าเดิมจากชีต หากมีค่านอกรายการจะคงค่าไว้ในหมวดพิเศษไม่ให้สูญหาย 3) รองรับตัวเลือกพิมพ์ระบุเองกรณี Google Sheet มีงวดใหม่ในอนาคต 4) ค่าที่เลือกจะถูกส่งไปบันทึกลง Google Sheet อย่างถูกต้องตรงเงื่อนไข Data Validation เสมอ',
      sourceFile: 'คำสั่งผู้ใช้งาน (ใน goosheet แผนปิดงาน เป็นแบบมีตัวเลือก พิมไม่ได้ แตใน dasboard เป็นแบบไม่มีตัวเลือกจะทำอย่างไรให้เหมือนกัน)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_fix_gas_target_note_column',
      timestamp: '2026-10-22 20:50:00',
      timestampTh: '22 ต.ค. 2569, 20:50 น.',
      type: 'CONFIG',
      typeBadge: 'แก้ไขคอลัมน์บันทึก G-Sheet',
      badgeClass: 'badge-type-config',
      title: 'แก้ไขตรรกะระบุคอลัมน์ Google Apps Script ให้บันทึกลง "หมายเหตุ" แทน "หมายเหตุเพิ่มเติม"',
      targetSubject: 'Google Apps Script Web App (action=update) และการแมปคอลัมน์ตาราง WBS',
      storageFile: 'Google Apps Script (Code.gs) & js/data_history.js',
      changeSummary: 'แก้ปัญหาการบันทึกหมายเหตุจาก Dashboard แล้วข้อมูลไปลงช่อง "หมายเหตุเพิ่มเติม" โดยปรับปรุงเงื่อนไขใน Apps Script ให้เป็น Strict Match (!includes("เพิ่มเติม")) เพื่อระบุคอลัมน์ "หมายเหตุ" แท้จริง 100%',
      details: 'วิเคราะห์พบว่า Google Sheet มี 2 คอลัมน์คือ "หมายเหตุ" และ "หมายเหตุเพิ่มเติม" เดิมสคริปต์ค้นหาด้วย indexOf("หมายเหตุ") ทำให้ลูปไปทับตำแหน่งคอลัมน์ "หมายเหตุเพิ่มเติม" แก้ไขโดย: 1) ปรับปรุงตรรกะใน Code.gs ให้ค้นหาแบบตรงตัว colName === "หมายเหตุ" หรือ colName.includes("หมายเหตุ") && !colName.includes("เพิ่มเติม") 2) รองรับคอลัมน์ "แผนปิดงาน" ไม่ให้สับสน 3) จัดเตรียมสคริปต์ Code.gs ฉบับสมบูรณ์พร้อมขั้นตอน Deploy New Version',
      sourceFile: 'คำสั่งผู้ใช้งาน (เป็นเฉพาะ แก้ไขใน dasboard แล้วไปแสดง google ผิดคอล้ม)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_update_data_history_badge_to_dynamic_date',
      timestamp: '2026-10-22 20:00:00',
      timestampTh: '22 ต.ค. 2569, 20:00 น.',
      type: 'EDIT',
      typeBadge: 'ปรับป้ายวันที่แท็บประวัติ',
      badgeClass: 'badge-type-edit',
      title: 'ปรับป้ายวันที่แท็บ "ประวัติการนำเข้า & แก้ไขข้อมูล" ให้เป็นวันที่ล่าสุด (22 ต.ค.) แบบไดนามิก',
      targetSubject: 'ป้ายแท็บบนแถบเมนูหลัก (#dataHistoryBadge) และฟังก์ชันเรนเดอร์ประวัติ',
      storageFile: 'index.html, js/data_history.js',
      changeSummary: 'ปรับปรุงป้ายวันที่บนปุ่มแท็บ "ประวัติการนำเข้า & แก้ไขข้อมูล" จากเดิม 17 ต.ค. เป็น 22 ต.ค. (วันนี้) พร้อมเพิ่มตรรกะตรวจจับและอัปเดตป้ายวันที่ตาม Log ประวัติล่าสุดโดยอัตโนมัติ',
      details: 'ดำเนินการตามคำถาม/คำสั่งผู้ใช้งาน (วันที่อะไร): 1) ชี้แจงว่าวันที่ 17 ต.ค. เดิมเป็นวันที่นำเข้าไฟล์ 03 WBS ครั้งแรก 2) ปรับแก้ค่าเริ่มต้นใน index.html ให้เป็น 22 ต.ค. (วันที่อัปเดตล่าสุด) 3) ใน js/data_history.js เพิ่มตรรกะอัปเดตข้อความใน #dataHistoryBadge ให้ดึงวันที่จาก newestLog.timestampTh มาแสดงผลเสมอ',
      sourceFile: 'คำสั่งผู้ใช้งาน (วันที่อะไร)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_setup_gitignore_for_github',
      timestamp: '2026-10-22 19:58:00',
      timestampTh: '22 ต.ค. 2569, 19:58 น.',
      type: 'CONFIG',
      typeBadge: 'ตั้งค่า Git/GitHub',
      badgeClass: 'badge-type-config',
      title: 'สร้างไฟล์ .gitignore เพื่อเตรียมความพร้อมในการขึ้น GitHub',
      targetSubject: 'การจัดการ Source Control (.gitignore)',
      storageFile: '.gitignore & js/data_history.js',
      changeSummary: 'สร้างไฟล์ .gitignore สำหรับละเว้นไฟล์ขยะ ไฟล์ล็อกชั่วคราวของ Excel (~$*) และไฟล์ดัมพ์ทดสอบใน scratch/ เพื่อความสะอาดและปลอดภัยก่อนอัปเดตขึ้น GitHub',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (แนะนำขึ้น update github): 1) สร้างไฟล์ .gitignore ที่ root ของโปรเจกต์ 2) กำหนด rule ละเว้นไฟล์ ~$* (Excel Lock), *.tmp, *.temp และไฟล์ภาพ/html ชั่วคราวในโฟลเดอร์ scratch 3) จัดเตรียมขั้นตอนและคำสั่ง Git Push อย่างละเอียดให้ผู้ใช้งาน',
      sourceFile: 'คำสั่งผู้ใช้งาน (แนะนำขึ้น update github)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_rename_file06_to_google_sheet',
      timestamp: '2026-10-22 19:53:00',
      timestampTh: '22 ต.ค. 2569, 19:53 น.',
      type: 'EDIT',
      typeBadge: 'เปลี่ยนชื่อคอลัมน์',
      badgeClass: 'badge-type-edit',
      title: 'เปลี่ยนชื่อหัวคอลัมน์เป็น (G-Sheet) กระชับและชัดเจน',
      targetSubject: 'หัวตาราง WBS และกล่องเลือกคอลัมน์ (คอลัมน์ planClose & note)',
      storageFile: 'js/wbs.js, index.html & js/data_history.js',
      changeSummary: 'ปรับข้อความหัวคอลัมน์ให้กระชับเป็น "แผนปิดงาน (G-Sheet)" และ "หมายเหตุ (G-Sheet)" พร้อมป้ายกลุ่ม "แผนงานแล้วเสร็จ (G-Sheet)" และป้าย Tag "G-SHEET"',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (แก้ไขหัว เป็น G-Sheet แทน): 1) ใน js/wbs.js ปรับ label ของ planClose เป็น "แผนปิดงาน (G-Sheet)" 2) ปรับ label ของ note เป็น "หมายเหตุ (G-Sheet)" 3) ปรับ label กลุ่ม 06_sheet เป็น "แผนงานแล้วเสร็จ (G-Sheet)" 4) แสดงป้าย Tag แหล่งข้อมูลเป็น "G-SHEET" สวยงามและไม่กินเนื้อที่ตาราง',
      sourceFile: 'คำสั่งผู้ใช้งาน (แก้ไขหัว เป็น G-Sheet แทน)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_wbs_inline_edit_button_google_sheet',
      timestamp: '2026-10-22 19:42:00',
      timestampTh: '22 ต.ค. 2569, 19:42 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มปุ่มแก้ไขสด WBS',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มปุ่มแก้ไข ✏️ และระบบซิงค์ 2 ทาง (Two-Way Sync) เชื่อมต่อ Google Sheet สด',
      targetSubject: 'ตาราง WBS คงเหลือ (js/wbs.js) คอลัมน์ planClose & note, โมดัลแก้ไขสด และปุ่มซิงค์ข้อมูล',
      storageFile: 'js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: 'รองรับการซิงค์ข้อมูลแบบ 2 ทาง (Two-Way Sync) ระหว่าง Web Dashboard และ Google Sheet: 1) Web ➡️ Google Sheet (กดปุ่ม ✏️ แก้ไขแล้วบันทึกลง Sheet) 2) Google Sheet ➡️ Web (กดปุ่ม "ซิงค์ Google Sheet" เพื่อดึงข้อมูลล่าสุดข้าม 9 แท็บมาอัปเดตลงตาราง WBS ทันที)',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (เป็น 2 ทางใช่หรือไม่): 1) ฝั่งเขียน (Web ➡️ Google Sheet): เพิ่มปุ่ม ✏️ ในตาราง WBS และโมดัลบันทึก ส่งคำขอ action=update ไปยัง Google Apps Script Web App API เพื่ออัปเดตแถวใน Sheet 2) ฝั่งอ่าน (Google Sheet ➡️ Web): เชื่อมต่อปุ่ม window.syncLiveNotesFromGoogleSheet เรียก action=getAll ดึงข้อมูลสดจากทุกแท็บใน Google Sheet กลับมาอัปเดต window.AUC_WBS_REMAINING_DATA บนหน้าเว็บได้ตลอดเวลา 3) อัปเดต CSS สไตล์ปุ่มและสถานะการซิงค์',
      sourceFile: 'คำสั่งผู้ใช้งาน (รันต่อเลย เพิ่มปุ่มแก้ไข)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง'
    },
    {
      id: 'log_000_sync_google_sheet_field_plans',
      timestamp: '2026-10-22 17:23:00',
      timestampTh: '22 ต.ค. 2569, 17:23 น.',
      type: 'MERGE',
      typeBadge: 'ซิงค์ Google Sheet',
      badgeClass: 'badge-type-merge',
      title: 'ซิงค์ข้อมูลแผนปิดงานและหมายเหตุจาก Google Sheet (ออนไลน์) แทนไฟล์ 06',
      targetSubject: 'ฐานข้อมูล WBS คงเหลือ (js/data_wbs.js) คอลัมน์ planClose & note',
      storageFile: 'js/data_wbs.js & js/data_history.js',
      changeSummary: 'ดึงข้อมูลสดจาก Google Apps Script Web App API (1,143 รายการข้าม 9 แท็บ) แทนการอ่านไฟล์ 06 ในเครื่อง: อัปเดตแผนปิดงานและหมายเหตุสำเร็จ 1,165 รายการใน js/data_wbs.js โดยปรับปรุงแผนปิดงาน (planClose) เป็นงวดบัญชี ต.ค., พ.ย., ธ.ค. 69 รวม 1,156 รายการ และปรับปรุงหมายเหตุหน้างาน 844 รายการ',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (ใช้ google sheet แทนไฟล์ 06 เหมือนเดิม รันต่อได้เลยก่อนเกิด Cortex XDR): 1) เชื่อมต่อ API ดึงข้อมูล Google Apps Script Web App ครบ 1,143 รายการจาก 9 แท็บเกณฑ์วัด 2) ดำเนินการจับคู่รหัสงาน WBS และอัปเดต planClose กับ note ลงในฐานข้อมูล js/data_wbs.js รวม 1,165 แถว 3) เปลี่ยนแปลงแผนปิดงาน 1,156 รายการ ให้เป็นข้อมูลจริงล่าสุดของไตรมาส 4 (งวด ต.ค. - ธ.ค. 2569) และปรับปรุงข้อความหมายเหตุ 844 รายการ 4) ใช้วิธีประมวลผลตรงโดยไม่มีการเรียกใช้ Office Automation เพื่อหลีกเลี่ยงการแจ้งเตือนจาก Cortex XDR 100%',
      sourceFile: 'Google Apps Script Web App (action=getAll)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง'
    },
    {
      id: 'log_000_import_sep_auc_report',
      timestamp: '2026-10-21 09:00:00',
      timestampTh: '21 ต.ค. 2569, 09:00 น.',
      type: 'IMPORT',
      typeBadge: 'นำเข้าข้อมูลเดือน ก.ย.',
      badgeClass: 'badge-type-import',
      title: 'นำเข้าและผูกฐานข้อมูลรายงาน AUC เดือน 9 ก.ย. (3.3teco) เข้าสู่ระบบถาวร',
      targetSubject: 'รายงาน AUC ประจำเดือน ก.ย. 2569 (window.AUC_DATA_SEP)',
      storageFile: 'js/data_sep.js, index.html, js/app.js & js/data_history.js',
      changeSummary: 'แปลงไฟล์ "01 รายงาน AUC เดือน 9ก.ย.  (3.3teco).xlsx" เป็นฐานข้อมูล static JavaScript (js/data_sep.js) จำนวน 368 แถว ผูกสคริปต์ใน index.html และเปิดตัวเลือกเดือน ก.ย. 2569 (ล่าสุด) ในระบบอย่างถาวร ไม่สูญหายเมื่อรีเฟรชหน้าเว็บ',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (เลือกแนวทางที่ 1 นำเข้าข้อมูลถาวรโดยไม่ต้องทำ Supabase): 1) สกัดและแปลงข้อมูลจากไฟล์ 01 รายงาน AUC เดือน 9ก.ย.  (3.3teco).xlsx ครบทุกหมวดเกณฑ์วัด 8 หมวด รวม 368 รายการ บันทึกเป็น window.AUC_DATA_SEP ใน js/data_sep.js 2) เพิ่มแท็ก script โหลด js/data_sep.js ใน index.html 3) ปลดล็อกตัวเลือกเดือน ก.ย. 2569 ใน dropdown และตั้งเป็นเดือนล่าสุด (Active Month) 4) อัปเดต app.js ให้ hasReportForMonth รองรับเดือน ก.ย. (Index 8) และอัปเดต fallback data chain ให้เป็นข้อมูลปัจจุบัน 5) ซิงค์ไฟล์ไปยังโฟลเดอร์ 00AI V2 เพื่อความสอดคล้อง',
      sourceFile: '01 รายงาน AUC เดือน 9ก.ย.  (3.3teco).xlsx',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง'
    },
    {
      id: 'log_000_wbs_kpi_month_active_button_enhancement',
      timestamp: '2026-10-19 11:38:00',
      timestampTh: '19 ต.ค. 2569, 11:38 น.',
      type: 'EDIT',
      typeBadge: 'ปรับปุ่มเลือกเดือนเป้าหมาย',
      badgeClass: 'badge-type-edit',
      title: 'ปรับแต่งปุ่มเลือกเดือนเป้าหมาย KPI ที่ถูกเลือก (Active) ให้ลอยเด่น 3D ขอบทองเรืองแสงประกายขาวและสวยงาม',
      targetSubject: 'แถบปุ่มเลือกเดือนเป้าหมาย KPI ในการ์ด WBS Comparison (.btn-wbs-kpi-month)',
      storageFile: 'css/styles.css, js/wbs.js & js/data_history.js',
      changeSummary: '1) ยกระดับปุ่มเดือนที่เลือกให้ลอยเด่นแบบ 3D (Elevation: translateY(-3.5px) scale(1.02)) 2) เพิ่มเส้นขอบสีทองเรืองแสงประกายขาวคอนทราสต์สูง (White-Gold Halo Border 3.5px) ไม่กลืนไปกับพื้นหลังสีส้มของเดือน ก.ย. 3) ปรับปุ่มเดือนอื่นที่ยังไม่ได้เลือกให้ซอฟต์ลง (Opacity 0.68) เพื่อสร้างจุดโฟกัสให้ปุ่มที่เลือกเด่นชัดทันที 4) ปรับปรุงป้าย "กำลังเลือก" เป็นสีขาวลักชัวรีพร้อมไฟสัญญาณสีเขียวมรกตเรืองแสงกะพริบสดใส',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (ลองปรับปุ่มที่เลือก ให้แตกต่างขึ้นมา สวยงาม): 1) ใน css/styles.css ปรับสไตล์ .btn-wbs-kpi-month.active ให้มี z-index: 30, transform: translateY(-3.5px) scale(1.02), padding: 3.5px และกรอบพื้นหลัง linear-gradient(135deg, #FFFFFF 0%, #FFF59D 25%, #FFD700 50%, #FFFFFF 75%, #FFA000 100%) พร้อมเงา 3 ชั้น (drop-shadow สีขาวคมกริบ + ออร่าสีทองเรืองแสง 16px + เงาลึก 3D 16px) 2) เพิ่มมิติผิวกระจกเงา (Specular Inset Reflection) ภายใน .btn-wbs-kpi-inner และอัปเกรดการไล่เฉดสีเฉพาะของแต่ละเซกเมนต์เมื่อ active 3) ลดความเข้มของปุ่มที่ไม่ได้เลือก (:not(.active)) เหลือ opacity: 0.68 และ saturate(0.85) พร้อมเอฟเฟกต์ hover สว่างขึ้นอย่างนุ่มนวล 4) พัฒนาคอมโพเนนต์ไฟสัญญาณ .m-active-pulse-beacon สีเขียวมรกตกะพริบแบบมีจังหวะ (1.6s ease-in-out) บ่งบอกสถานะการเลือกปัจจุบันอย่างหรูหรา ชัดเจน',
      sourceFile: 'คำสั่งผู้ใช้งาน (ลองปรับปุ่มที่เลือก ให้แตกต่างขึ้นมา สวยงาม)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_wbs_bar_chart_single_line_sap_label',
      timestamp: '2026-10-19 11:22:00',
      timestampTh: '19 ต.ค. 2569, 11:22 น.',
      type: 'EDIT',
      typeBadge: 'จัดข้อความบรรทัดเดียว',
      badgeClass: 'badge-type-edit',
      title: 'ปรับการแสดงรหัสสถานะ SAP และจำนวนงานในกราฟแท่งให้อยู่ในบรรทัดเดียวกัน (เช่น F4 : 4)',
      targetSubject: 'การแสดงผลข้อความในกราฟแท่ง WBS (#wbsOfficesBarChart)',
      storageFile: 'js/wbs.js & js/data_history.js',
      changeSummary: 'ปรับรูปแบบการแสดงข้อความในทุกเซกเมนต์ของกราฟแท่งให้อยู่ในบรรทัดเดียวกัน เช่น "F4 : 4", "C1 : 35", "D1 : 6" พร้อมเว้นวรรครอบเครื่องหมายโคลอนอย่างสวยงาม และปรับขนาดตัวอักษรแบบ Responsive อัตโนมัติ',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (ปรับแก้ให้อยู่บรรทัดเดียวกัน เช่น F4 : 4): ปรับแก้ใน drawTopOfficesCanvas() ให้ทุกเซกเมนต์แสดงผลแบบบรรทัดเดียวในรูปแบบ "${suffix} : ${countStr}" โดยไม่ตัดขึ้นบรรทัดใหม่ พร้อมระบบตรวจวัดความกว้างแบบยืดหยุ่น (Responsive text measurement) และปรับขนาดฟอนต์ให้พอดีกับความกว้างของแท่งกราฟอย่างสวยงาม สะอาดตา และอ่านง่าย',
      sourceFile: 'คำสั่งผู้ใช้งาน (ปรับแก้ให้อยู่บรรทัดเดียวกัน เช่น F4 : 4)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_wbs_bar_chart_sap_suffix_and_proportions',
      timestamp: '2026-10-19 11:15:00',
      timestampTh: '19 ต.ค. 2569, 11:15 น.',
      type: 'EDIT',
      typeBadge: 'รหัสสถานะ SAP บนกราฟแท่ง',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มการแสดงรหัสสถานะ SAP ประโยคท้าย (F4, F2, C1 ฯลฯ) ในกราฟแท่ง และปรับสัดส่วนแท่งให้เห็นชัดเจน สวยงาม',
      targetSubject: 'กราฟแท่งหน่วยงานที่มีงาน WBS คงเหลือ (#wbsOfficesBarChart)',
      storageFile: 'js/wbs.js & js/data_history.js',
      changeSummary: '1) เพิ่มการแสดงรหัสสถานะ SAP เฉพาะประโยคท้าย (เช่น F4, F2, C1, D1, D2, D3, B1) ในทุกเซกเมนต์ของกราฟแท่ง พร้อมตัวเลขจำนวนงาน 2) ปรับสัดส่วนความสูงของแต่ละเซกเมนต์ด้วยอัลกอริทึม Water-filling ให้สะท้อนสัดส่วนจริงอย่างแม่นยำและไม่ถูกบีบอัด 3) เพิ่มความกว้างแท่ง (24-42px) และความสูงกราฟ (~296px) รองรับการแสดงผล 2 บรรทัดในเซกเมนต์ขนาดใหญ่',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (ให้เพิ่ม สถานะ sap เฉพาะประโยคท้าย เช่น F4 F2 C1 เป็นต้น ในกราฟแท่ง และดูสัดส่วนให้เห็นชัด สวยงาน): 1) สร้างฟังก์ชัน getSapSuffix(sap) สำหรับสกัดรหัสประโยคท้าย 2 ตัว เช่น "CLSD F4" -> "F4", "LLSU F2" / "REL F2" -> "F2", "REL C1" -> "C1", "TECO D2" -> "D2" 2) พัฒนาฟังก์ชัน allocateSegmentHeights() จัดสรรความสูงของเซกเมนต์สถานะ SAP ด้วยอัลกอริทึม Water-filling เพื่อรักษาสัดส่วนแท่งกราฟจริง (Proportional Stacking) ไม่ให้เซกเมนต์ที่มีงานจำนวนมากถูกลดทอนความสูง ขณะเดียวกันยังรับประกันความสูงขั้นต่ำ (13.5px) ให้เซกเมนต์ขนาดเล็กแสดงข้อความได้ครบถ้วน 3) ปรับการจัดวางข้อความแบบ Responsive ในแต่ละเซกเมนต์: หากมีความสูง >= 26px จัดเป็น 2 บรรทัด (บรรทัดบนแสดงรหัสสถานะ SAP ประโยคท้ายขนาด 10px ตัวหนา, บรรทัดล่างแสดงจำนวนงานขนาด 9.5px ตัวหนา) หากความสูงปานกลางจัดเป็น 1 บรรทัด เช่น "F2: 3", "F4: 9", "C1: 5" พร้อม Text Shadow คอนทราสต์สูงทั้งธีมมืดและสว่าง 4) ปรับความกว้างแท่งกราฟ (barW) ให้มีความหนาแน่นสมส่วน (24-42px) และปรับพื้นที่วาด (plotHBase: 196px, height0: 296px) เพิ่มพื้นที่แนวตั้งให้อ่านง่าย สบายตา คมชัดทุกสถานะ',
      sourceFile: 'คำสั่งผู้ใช้งาน (ให้เพิ่ม สถานะ sap เฉพาะประโยคท้าย เช่น F4 F2 C1 เป็นต้น ในกราฟแท่ง และดูสัดส่วนให้เห็นชัด สวยงาน)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_wbs_update_file_04_zbudr064',
      timestamp: '2026-10-19 08:48:00',
      timestampTh: '19 ต.ค. 2569, 08:48 น.',
      type: 'IMPORT',
      typeBadge: 'อัปเดตไฟล์ 04 WBS',
      badgeClass: 'badge-type-import',
      title: 'อัปเดตข้อมูลไฟล์ 04 WBS ZBUDR064 (%พัสดุ ค่าแรง และสถานะ SAP)',
      targetSubject: 'ฐานข้อมูล WBS คงเหลือ (js/data_wbs.js) และการแสดงผลสถานะ SAP',
      storageFile: 'js/data_wbs.js, js/wbs.js & js/data_history.js',
      changeSummary: 'อัปเดตฐานข้อมูล WBS จากไฟล์ 04 ZBUDR064 ฉบับล่าสุด (19 ต.ค. 2569, 08:34 น.): ปรับปรุงสถานะ SAP รวม 382 รายการ (CLSD F4 เพิ่มขึ้น +200 โครงการ, CLSD F2 +14 โครงการ, TECO D2 เปลี่ยนเป็น CLSD ลดลง -121 โครงการ, REL C1 -84 โครงการ) พร้อมปรับปรุงยอด Act ควบคุมและ % เบิกพัสดุ 101 รายการ',
      details: 'ดำเนินการรันสคริปต์ผสานข้อมูล WBS (merge_wbs_all.ps1) ผสานไฟล์ 03 (ฐานคงเหลือ 2,968 รายการ), ไฟล์ 04 (ZBUDR064 ฉบับแก้ไข 19 ต.ค. 2569), ไฟล์ 05 (CN41) และไฟล์ 06 (Google Sheet): 1) ผลการจับคู่ WBS สำเร็จ 100% (2,968/2,968 รายการ) 2) มีการปรับเปลี่ยนสถานะ SAP รวม 382 รายการ โดยสถานะปิดงานสมบูรณ์ (CLSD) เพิ่มขึ้นรวม +215 รายการ 3) มีการเปลี่ยนแปลงยอดค่าใช้จ่ายควบคุมจริงและ % การเบิกพัสดุ 101 รายการ 4) บันทึกลงใน js/data_wbs.js ขนาด 3.31 MB และอัปเดตป้ายเวลาไฟล์ 04 ที่หัวตาราง WBS เป็น 19 ต.ค. 2569, 08:34 น.',
      sourceFile: '04 WBS ZBUDR064 %พัสดุและค่าแรงและสถานะsap.xlsx (19 ต.ค. 2569, 08:34:34)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง (อัปเดตสถานะโครงการก่อสร้างและมูลค่าเบิกจ่ายล่าสุด)'
    },
    {
      id: 'log_000_wbs_add_sap_eraser_btn_and_wbs_counts',
      timestamp: '2026-10-18 21:36:00',
      timestampTh: '18 ต.ค. 2569, 21:36 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มปุ่มยางลบ & จำนวน WBS',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มปุ่มยางลบล้างตัวกรองสถานะ SAP ที่หัวตาราง และแสดงจำนวนงาน WBS ในตัวเลือกสถานะ SAP',
      targetSubject: 'หัวคอลัมน์สถานะ SAP และรายการตัวกรองดรอปดาวน์ (#wbsSapThDropdownList)',
      storageFile: 'js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: '1) เพิ่มปุ่มยางลบ (#btnWbsSapThEraser) ติดข้างปุ่มเลือกสถานะ SAP เพื่อให้ผู้ใช้คลิกล้างตัวกรองกลับสู่ "ทุกสถานะ" ได้ทันทีในคลิกเดียว 2) เพิ่มการแสดงผลจำนวนงาน WBS กำกับข้างแต่ละสถานะ SAP ในดรอปดาวน์ เช่น "118 งาน", "11 งาน" พร้อมสรุปจำนวนงานรวมที่ส่วนท้าย',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: 1) ใน js/wbs.js ปรับปรุง renderWbsTableHead() เพิ่มปุ่มไอคอนยางลบ .btn-th-sap-eraser พร้อมฟังก์ชัน clearWbsTableSapFilter() สำหรับล้าง tableSapStatuses 2) ใน renderWbsSapThDropdownList() คำนวณจำนวนงาน WBS ใน sapMap และแสดงผล <span class="sap-dropdown-item-count">${statInfo.count} งาน</span> 3) ใน css/styles.css ตกแต่งปุ่มยางลบและปรับขนาด Panel เป็น 205px พร้อมจัดวางสถานะและจำนวนงานอย่างลงตัว',
      sourceFile: 'คำสั่งผู้ใช้งาน (เพิ่มปุ่มยางลบ เพื่อเคลียร์ตัวกรอง / เพิ่ม จำนวน WBS ในตัวกรอง สถานะsap)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_wbs_force_sap_dropdown_below_button_only',
      timestamp: '2026-10-18 21:32:00',
      timestampTh: '18 ต.ค. 2569, 21:32 น.',
      type: 'EDIT',
      typeBadge: 'ตำแหน่งตัวกรองสถานะ SAP',
      badgeClass: 'badge-type-edit',
      title: 'ปรับตำแหน่งดรอปดาวน์สถานะ SAP ให้อยู่ด้านล่างปุ่มเสมอ ไม่พลิกไปเปิดด้านบน',
      targetSubject: 'การแสดงผลและคำนวณตำแหน่งป๊อปอัปตัวกรองสถานะ SAP (#wbsSapThDropdownPanel)',
      storageFile: 'js/wbs.js & js/data_history.js',
      changeSummary: 'ยกเลิกการพลิกป๊อปอัปตัวกรองสถานะ SAP ขึ้นไปเปิดด้านบนปุ่ม โดยกำหนดให้อยู่ชิดติดด้านล่างปุ่มตัวกรองเสมอ (top = rect.bottom + 4px) พร้อมปรับขนาดความสูงรายการให้พอดีกับจอภาพอัตโนมัติ',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (ให้ตัวกรอง อยู่ด้านล่างอย่างเดียว ไม่ให้ไปข้างบนแบบในรุป): ปรับปรุงฟังก์ชัน repositionWbsSapDropdown() ใน js/wbs.js โดยนำเงื่อนไขพลิกกลับขึ้นด้านบน (top = rect.top - panelHeight) ออก และกำหนดให้แสดงอยู่ด้านล่างปุ่ม [เลือก ... สถานะ] ตลอดเวลา พร้อมปรับ max-height ของ #wbsSapThDropdownList ให้พอดีกับความสูงจอภาพที่เหลืออยู่ด้านล่างอย่างแม่นยำ',
      sourceFile: 'คำสั่งผู้ใช้งาน (ให้ตัวกรอง อยู่ด้านล่างอย่างเดียว ไม่ให้ไปข้างบนแบบในรุป)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_wbs_remove_checkbox_from_sap_dropdown_items',
      timestamp: '2026-10-18 21:29:00',
      timestampTh: '18 ต.ค. 2569, 21:29 น.',
      type: 'EDIT',
      typeBadge: 'นำ Checkbox ดรอปดาวน์ออก',
      badgeClass: 'badge-type-edit',
      title: 'นำช่อง Checkbox ออกจากรายการตัวกรองสถานะ SAP คงเหลือเฉพาะป้ายสถานะแบบเลือก/ปลดอิสระ',
      targetSubject: 'รายการตัวเลือกในดรอปดาวน์สถานะ SAP (#wbsSapThDropdownList)',
      storageFile: 'js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: 'นำช่องสี่เหลี่ยม Checkbox ด้านหน้าสถานะ SAP ออกตามที่ผู้ใช้งานขีดกากบาทสีเหลืองระบุ คงเหลือเฉพาะป้ายสถานะ SAP ตรงกลางแถว โดยคลิกที่ตัวป้ายสถานะเพื่อเลือกหรือปลดการกรองได้ทันที',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: 1) ใน js/wbs.js ฟังก์ชัน renderWbsSapThDropdownList() นำแท็ก <input type="checkbox"> ออกจาก itemsHtml คงเหลือเฉพาะป้าย <span class="badge-sap-short"> 2) ใน css/styles.css ปรับแต่ง .sap-dropdown-item ให้จัดป้ายสถานะไว้กึ่งกลางพอดี (justify-content: center) และตกแต่งสถานะที่ถูกเลือก (.is-selected) ด้วยกรอบแสงสีฟ้า (#38BDF8) สวยงามชัดเจน 3) ปรับความกว้างของ Panel เป็น 180px พอดีกับเนื้อหา',
      sourceFile: 'คำสั่งผู้ใช้งาน (กากาบาท เอา checkbox ออก)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_wbs_fix_sap_dropdown_position_and_remove_buttons',
      timestamp: '2026-10-18 21:24:00',
      timestampTh: '18 ต.ค. 2569, 21:24 น.',
      type: 'EDIT',
      typeBadge: 'ปรับปรุงดรอปดาวน์สถานะ SAP',
      badgeClass: 'badge-type-edit',
      title: 'นำปุ่มกากบาท (✕), ข้อความสรุปหัวข้อ และปุ่มตกลงออก พร้อมแก้ไขตำแหน่งดรอปดาวน์ให้ชิดติดใต้ปุ่มตัวกรองเสมอ',
      targetSubject: 'ป๊อปอัปตัวกรองสถานะ SAP (#wbsSapThDropdownPanel) และปุ่มหัวตาราง (#btnWbsSapThDropdown)',
      storageFile: 'index.html, js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: '1) นำปุ่มกากบาท (✕) และปุ่ม "ตกลง" รวมถึงข้อความสรุปในแถบหัวข้อออก เพื่อความเรียบง่ายและคลีน 2) แก้ไขตำแหน่งป๊อปอัปตัวกรองที่ลอยหลุดไปอยู่ข้างล่าง ให้กลับมาแสดงชิดติดใต้ปุ่มตัวกรองหัวตารางอย่างแม่นยำทุกการเลื่อนและการคลิก',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: 1) ใน index.html และ css/styles.css นำ .btn-close-sap-dropdown (✕) และ .btn-sap-done (ตกลง) รวมถึง .sap-dropdown-count-badge ออกจาก #wbsSapThDropdownPanel 2) ใน js/wbs.js เพิ่มฟังก์ชัน repositionWbsSapDropdown() โดยย้าย panel ไปไว้ที่ document.body เพื่อป้องกันไม่ให้สไตล์ transform/filter ของตารางกระทบการคำนวณพิกัด และยึดตำแหน่งให้อยู่ใต้ปุ่ม #btnWbsSapThDropdown พอดี (rect.bottom + 4px) พร้อมดักจับ scroll/resize ให้เกาะติดตลอดเวลา',
      sourceFile: 'คำสั่งผู้ใช้งาน (1.เอา กากบาทออก 2.แก้ไขตัวกรอง ลอยออกปุ่มตัวหรอง มาข้างล่างเลย / เอาปุ่ม ตกลง ออกด้วย)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_wbs_refine_sap_dropdown_clean_and_table_only_filter',
      timestamp: '2026-10-18 21:16:00',
      timestampTh: '18 ต.ค. 2569, 21:16 น.',
      type: 'EDIT',
      typeBadge: 'ปรับปรุงตัวกรองสถานะ SAP',
      badgeClass: 'badge-type-edit',
      title: 'ปรับแต่งดรอปดาวน์สถานะ SAP คงเหลือเฉพาะ Checkbox และป้ายสถานะ พร้อมจำกัดการกรองเฉพาะในตาราง WBS เท่านั้น',
      targetSubject: 'ป๊อปอัปดรอปดาวน์หัวตารางสถานะ SAP (#wbsSapThDropdownPanel) และการกรองตาราง WBS',
      storageFile: 'index.html, js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: '1) นำปุ่ม "เลือกทั้งหมด" และ "ล้างค่า (ทุกสถานะ)" รวมถึงจำนวนงานและมูลค่าเงินออกจากแต่ละรายการตามที่ผู้ใช้กากบาทออก คงเหลือเฉพาะ Checkbox และป้ายสถานะ SAP แบบเรียบง่าย 2) ปรับปรุงให้การเลือกสถานะ SAP จากดรอปดาวน์หัวตารางกรองเฉพาะแถวในตาราง WBS เท่านั้น โดยไม่กระทบกราฟแท่งและการ์ดเป้าหมาย KPI ด้านบน',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: 1) ใน index.html ลบ .sap-dropdown-actions ออกจาก #wbsSapThDropdownPanel 2) ใน js/wbs.js แยก state ตัวกรองเป็น wbsState.tableSapStatuses สำหรับการกรองเฉพาะตาราง WBS ไม่ให้กระทบ filtered data ของส่วนบน (กราฟแท่ง, KPI Cards, Target Comparison Section) 3) ใน renderWbsSapThDropdownList ปรับ HTML แต่ละแถวให้เหลือเพียง Checkbox และ Badge สถานะ SAP โดยนำจำนวนงานและจำนวนเงินออก 4) ใน css/styles.css ปรับขนาด panel ให้กะทัดรัดพอดี (width: 210px)',
      sourceFile: 'คำสั่งผู้ใช้งาน (กากบาทเอาออก คงเหลือสถานะ sap อย่างเดียว และเลือกแล้วให้กรองเฉพาะหน้านั้น เท่านั้น)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_wbs_add_th_sap_multi_dropdown_and_remove_kpi_clear_btn',
      timestamp: '2026-10-18 21:04:00',
      timestampTh: '18 ต.ค. 2569, 21:04 น.',
      type: 'EDIT',
      typeBadge: 'ดรอปดาวน์สถานะ SAP & ลบปุ่ม',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มตัวกรอง Dropdown list สถานะ SAP เลือกได้หลายสถานะในหัวตาราง พร้อมนำปุ่มล้างข้อมูลในการ์ดเป้าหมายออก',
      targetSubject: 'คอลัมน์สถานะ SAP ในหัวตาราง WBS และการ์ดเป้าหมาย KPI (#wbsTargetComparisonSection)',
      storageFile: 'index.html, js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: '1) เพิ่มตัวกรอง Dropdown list ใต้หัวคอลัมน์ "สถานะ SAP" ให้สามารถเลือกติ๊กพร้อมกันได้หลายสถานะอย่างอิสระ พร้อมปุ่มเลือกทั้งหมดและล้างค่า 2) นำปุ่มสีแดง "ล้างข้อมูล" ออกจากการ์ดเป้าหมาย KPI ระดับ 5 ตามที่ผู้ใช้งานวงกลมระบุ',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน 2 ส่วน: 1) ใน js/wbs.js ปรับปรุง renderWbsTableHead เพิ่มปุ่ม Dropdown #btnWbsSapThDropdown ในคอลัมน์ statusSap แสดงป้ายสถานะที่เลือก และใน index.html เพิ่ม #wbsSapThDropdownPanel พร้อมฟังก์ชัน renderWbsSapThDropdownList, toggleWbsSapDropdownStatus, selectAllWbsSapDropdownStatuses รองรับการเลือกพร้อมกันหลายสถานะ 2) ใน js/wbs.js นำปุ่ม .btn-wbs-card-clear (ล้างข้อมูล) ออกจาก .wbs-kpi-comp-meta-info ในการ์ดเป้าหมาย KPI 3) เพิ่ม CSS ตกแต่ง Dropdown Panel และปุ่มหัวตารางให้สวยงามทั้ง Dark และ Light Theme',
      sourceFile: 'คำสั่งผู้ใช้งาน (เพิ่มตัวกรอง Dropdown list สถานะsap และสามารถเลือกพร้อมกันได้หลายสถานะsap / วงกลมเอาออก)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (เพิ่มตัวกรองหลายสถานะ SAP ในหัวตาราง WBS และลบปุ่มล้างข้อมูลซ้ำซ้อนออก)'
    },
    {
      id: 'log_000_wbs_remove_engineer_circle_avatar_icon',
      timestamp: '2026-10-18 20:47:00',
      timestampTh: '18 ต.ค. 2569, 20:47 น.',
      type: 'EDIT',
      typeBadge: 'นำไอคอนวงกลมช่างคุมงานออก',
      badgeClass: 'badge-type-edit',
      title: 'นำไอคอนวงกลมตัวอักษรย่อหน้าชื่อช่างคุมงานออกจากตาราง WBS',
      targetSubject: 'คอลัมน์ช่างคุมงาน ในตารางรายงาน WBS (#wbsMasterDataTable)',
      storageFile: 'js/wbs.js & js/data_history.js',
      changeSummary: 'นำไอคอนวงกลมสีฟ้าพร้อมอักษรย่อ (.wbs-engineer-icon) ที่อยู่หน้าชื่อช่างคุมงานออกตามที่ผู้ใช้งานวงกลมระบุ โดยคงเหลือการแสดงผลชื่อช่างคุมงานชัดเจน',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (วงกลม เอาออก - ภาพชี้ไอคอนวงกลมสีฟ้าหน้าชื่อช่างคุมงาน): ปรับปรุงในไฟล์ js/wbs.js ฟังก์ชันเรนเดอร์ตาราง WBS โดยนำ <span class="wbs-engineer-icon"> ออกจากการแสดงผลเซลล์คอลัมน์ engineer คงเหลือเฉพาะชื่อช่างคุมงานแบบคลีน สบายตา',
      sourceFile: 'คำสั่งผู้ใช้งาน (วงกลม เอาออก)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงการแสดงผลคอลัมน์ช่างคุมงานให้กระชับและตรงตามความต้องการ)'
    },
    {
      id: 'log_000_wbs_remove_plan_close_and_reset_subfilters_btn',
      timestamp: '2026-10-18 20:45:00',
      timestampTh: '18 ต.ค. 2569, 20:45 น.',
      type: 'EDIT',
      typeBadge: 'นำแผนปิดงาน & ปุ่มล้างออก',
      badgeClass: 'badge-type-edit',
      title: 'นำตัวกรองแผนปิดงานและปุ่มล้างตัวกรองในตารางออกจากหัวตาราง WBS',
      targetSubject: 'แถบเครื่องมือเหนือตารางรายงาน WBS (.table-header-bar)',
      storageFile: 'index.html & js/data_history.js',
      changeSummary: 'นำตัวเลือกแผนปิดงาน (#wbsPlanCloseFilterSelect) และปุ่ม "ล้างตัวกรองในตาราง" (#btnResetWbsSubFilters) ออกจากแถบเหนือตาราง WBS ตามภาพคำสั่งผู้ใช้งาน',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (เอาออก - ภาพแสดงแผนปิดงานและปุ่มล้างตัวกรองในตาราง): ลบองค์ประกอบตัวกรองแผนปิดงานและปุ่มรีเซ็ตตัวกรองในตารางออกจาก index.html ในส่วน .table-header-bar โดยคงเหลือป้ายเกณฑ์วัด (📌 เกณฑ์วัด) ด้านซ้าย และปุ่มเลือกคอลัมน์/ข้อมูลแบ่งหน้าด้านขวาไว้อย่างเรียบง่าย สวยงาม ไม่เกะกะ',
      sourceFile: 'คำสั่งผู้ใช้งาน (เอาออก - แผนปิดงานและล้างตัวกรองในตาราง)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ลบตัวกรองแผนปิดงานและปุ่มล้างตัวกรองในตารางเพื่อความเรียบง่ายของ UI)'
    },
    {
      id: 'log_000_wbs_remove_table_search_budget_office_filters',
      timestamp: '2026-10-18 20:43:00',
      timestampTh: '18 ต.ค. 2569, 20:43 น.',
      type: 'EDIT',
      typeBadge: 'นำตัวกรองตาราง 3 ช่องออก',
      badgeClass: 'badge-type-edit',
      title: 'นำตัวกรองเหนือตาราง WBS ออก 3 รายการ (ค้นหาเลข WBS, ตัวกรองงบ, ตัวกรองกอง/กฟฟ.)',
      targetSubject: 'แถบเครื่องมือตัวกรองเหนือตารางรายงาน WBS (.table-header-bar)',
      storageFile: 'index.html & js/data_history.js',
      changeSummary: 'นำช่องค้นหาข้อความ WBS (#wbsTableSearchInput), กล่องเลือกตัวกรองงบ (#wbsBudgetFilterSelect) และกล่องเลือกกอง/กฟฟ. (#wbsOfficeFilterSelect) ออกจากแถบตัวกรองเหนือตาราง WBS ตามที่ผู้ใช้งานวงกลมระบุ',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (ที่วงกลมเอาออก): ทำการลบ 3 ส่วนออกจาก index.html ในส่วน .table-header-bar ได้แก่ 1) ช่องค้นหาเลข WBS / ช่างคุมงาน 2) ตัวกรองงบ (ALL, C.1, I, P, C02.2) 3) ตัวกรองกอง/กฟฟ. โดยคงเหลือส่วนตัวกรองแผนปิดงาน, ปุ่มล้างตัวกรองในตาราง และป้ายเกณฑ์วัดไว้ ทำให้แถบเครื่องมือกระชับและไม่ซ้ำซ้อนกับการกรองผ่านกราฟแท่งหน่วยงานด้านบน',
      sourceFile: 'คำสั่งผู้ใช้งาน (ที่วงกลมเอาออก)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงเลย์เอาต์แถบตัวกรองตาราง WBS ให้กระชับขึ้น)'
    },
    {
      id: 'log_000_wbs_file_timestamps_and_checkbox_clear_btn_red_blue_text',
      timestamp: '2026-10-18 20:31:00',
      timestampTh: '18 ต.ค. 2569, 20:31 น.',
      type: 'EDIT',
      typeBadge: 'เวลาไฟล์ 03-06 & ปุ่มแดงฟ้า',
      badgeClass: 'badge-type-edit',
      title: 'นำป้ายเดิมที่กากบาทออกและแสดงวันที่เวลาแก้ไขไฟล์ 03-06 พร้อมปรับปุ่มล้าง Check Box เป็นพื้นหลังสีแดง อักษรสีฟ้า',
      targetSubject: 'แถบสรุปหัวตาราง WBS (#wbsActiveFilterPills) และปุ่มล้างข้อมูลที่เลือกจาก Check Box (#wbsCheckboxClearBtn)',
      storageFile: 'js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: '1) นำป้ายสถานะเดิม 4 รายการ (รอบข้อมูล, เกณฑ์วัด, มูลค่า AUC รวม, คงเหลือ) ออกจากหัวตาราง WBS ตามกากบาทสีเหลืองของผู้ใช้งาน 2) แสดงป้ายระบุวันที่และเวลาแก้ไขจริงของไฟล์ 03 (17 ต.ค. 2569, 13:20 น.), 04 (14 ต.ค. 2569, 20:27 น.), 05 (22 ก.ย. 2569, 10:20 น.), 06 (22 ก.ย. 2569, 10:17 น.) สวยงามแยกสีเฉพาะ 3) แก้ไขข้อความปุ่มใต้การ์ดสถานะ SAP เป็น "ล้างข้อมูลที่เลือกจาก Check Box" พร้อมปรับพื้นหลังเป็นสีแดงเข้ม อักษรสีฟ้า (#38BDF8) ตามคำสั่งผู้ใช้งาน',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: 1) ใน js/wbs.js ปรับปรุง renderActiveFilterPills นำ 4 ป้ายเดิมออกและแทนที่ด้วยป้ายแสดงวันเวลาแก้ไขล่าสุดของไฟล์ 03, 04, 05, 06 คลิกแล้วเปิด Modal ผังข้อมูลได้ พร้อมเพิ่มคลาส .pill-file-03 ถึง 06 ใน css/styles.css รองรับ Dark และ Light theme 2) ใน js/wbs.js ปรับปรุง footerHtml เปลี่ยนข้อความเป็น "ล้างข้อมูลที่เลือกจาก Check Box" และใน css/styles.css ปรับ .btn-clear-wbs-checkbox เป็น background: linear-gradient โทนสีแดงสด และ color / svg stroke เป็นสีฟ้า (#38BDF8) 3) ปรับปรุง DATA_SOURCE_CATALOG ใน js/data_history.js ให้ตรงกับเวลาไฟล์จริง',
      sourceFile: 'คำสั่งผู้ใช้งาน (เอาที่กากาบาทออก / แสดงวันที่ และเวลา ที่แก้ไขไฟล์ 03 04 05 06 / แก้ไขข้อความ ล้างข้อมูลที่เลือกจาก Check Box และเปลี่ยนสีพื้นหลังเป็นสีแดง อักษรสีฟ้า)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงเลย์เอาต์หัวตาราง WBS แสดงเวลาแก้ไขไฟล์จริง และตกแต่งปุ่ม Check Box ใหม่)'
    },
    {
      id: 'log_000_wbs_clear_buttons_blue_and_no_numbers',
      timestamp: '2026-10-18 20:25:00',
      timestampTh: '18 ต.ค. 2569, 20:25 น.',
      type: 'EDIT',
      typeBadge: 'ปุ่มสีฟ้า & ไม่มีตัวเลข',
      badgeClass: 'badge-type-edit',
      title: 'ปรับปุ่มล้างข้อมูลทุกสถานะ (ไม่มีตัวเลข) และเปลี่ยนปุ่มล้างข้อมูลที่เลือกเป็นสีฟ้าพร้อมนำตัวเลขนับออก',
      targetSubject: 'ปุ่มล้างข้อมูลหัวการ์ดกราฟ WBS (#wbsOfficeChartClearBtn) และปุ่มล้างข้อมูลที่เลือก Checkbox (#wbsCheckboxClearBtn)',
      storageFile: 'index.html, js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: '1) แก้ไขปุ่มล้างข้อมูลหัวการ์ดกราฟ WBS เป็น "ล้างข้อมูลทุกสถานะ" และนำการแสดงตัวเลขนับออกทั้งหมด 2) ปรับปุ่ม "ล้างข้อมูลที่เลือก" ใต้การ์ดสรุปสถานะ SAP ให้เป็นสีฟ้า Gradient (#2563EB - #1D4ED8) พร้อมเรืองแสงสีฟ้าแทนสีแดงเดิม และนำตัวเลขนับจำนวนงาน (1) ออกตามภาพคำสั่งผู้ใช้งาน',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน 2 คำสั่งต่อเนื่อง (วงกลม แก้เป็น ล้างข้อมูลทุกสถานะ และไม่ต้องมีตัวเลข / เอาตัวเลขออก และเปลี่ยนปุ่มสีฟ้า): 1) ใน index.html และ js/wbs.js ปรับข้อความปุ่มล้างข้อมูลมุมบนขวาเป็น "ล้างข้อมูลทุกสถานะ" และปิดการแสดงผลตัวเลขนับ (#wbsOfficeChartClearCount) 2) ใน js/wbs.js ปรับปรุง footerHtml ของ renderWbsSapSummary โดยนำสแปนตัวเลขนับจำนวนงาน (#wbsCheckboxClearCount) ออกจากปุ่ม #wbsCheckboxClearBtn 3) ใน css/styles.css ปรับแต่งคลาส .btn-clear-wbs-checkbox จากเดิมที่เป็นโทนสีแดง ให้เป็นโทนสีฟ้าน้ำเงินสดใส (Gradient Blue) ทั้งสถานะปกติ, Hover, Active และ Light Theme อย่างสมบูรณ์แบบ',
      sourceFile: 'คำสั่งผู้ใช้งาน (วงกลม แก้เป็น ล้างข้อมูลทุกสถานะ และไม่ต้องมีตัวเลข / เอาตัวเลขออก และเปลี่ยนปุ่มสีฟ้า)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงข้อความปุ่ม เลิกแสดงตัวเลขนับ และเปลี่ยนชุดสีปุ่มล้างข้อมูล Checkbox เป็นสีฟ้า)'
    },
    {
      id: 'log_000_wbs_remove_budget_summary_pill',
      timestamp: '2026-10-18 20:16:00',
      timestampTh: '18 ต.ค. 2569, 20:16 น.',
      type: 'EDIT',
      typeBadge: 'นำป้ายงบปัจจุบันออก',
      badgeClass: 'badge-type-edit',
      title: 'นำป้ายสรุปงบปัจจุบันรวมออกจากแถบสถานะหัวตาราง WBS ตามคำสั่งผู้ใช้งาน',
      targetSubject: 'แถบแสดงตัวกรองและสรุปผลหัวตาราง WBS (#wbsActiveFilterPills)',
      storageFile: 'js/wbs.js & js/data_history.js',
      changeSummary: 'นำป้าย "💰 งบปัจจุบันรวม: ฿..." ออกจากส่วนหัวตารางรายงานติดตามงาน WBS คงเหลือ (#wbsActiveFilterPills) โดยคงเหลือเฉพาะป้ายรอบข้อมูล, เกณฑ์วัด, มูลค่า AUC รวม, จำนวนงานคงเหลือ และสถานะ SAP ตามที่ผู้ใช้งานกาเครื่องหมายระบุในภาพ',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (เอาที่วงกลม/กากบาทออก): ใน js/wbs.js ปรับปรุงฟังก์ชัน renderActiveFilterPills โดยนำบล็อกการแสดงผลป้าย Budget Summary Pill (งบปัจจุบันรวมจากไฟล์ 04) ออก เพื่อให้แถบสรุปข้อมูลกระชับและมุ่งเน้นที่มูลค่า AUC รวมจริงของงาน WBS คงเหลือ',
      sourceFile: 'คำสั่งผู้ใช้งาน (เอาที่วงกลม ออก)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'เล็กน้อย (ปรับปรุงหน้าตา UI แถบสรุปสถานะ WBS โดยนำป้ายงบปัจจุบันรวมออก)'
    },
    {
      id: 'log_000_wbs_clear_all_btn_show_sap_status_count_only',
      timestamp: '2026-10-18 16:22:00',
      timestampTh: '18 ต.ค. 2569, 16:22 น.',
      type: 'EDIT',
      typeBadge: 'นับเฉพาะสถานะ SAP',
      badgeClass: 'badge-type-edit',
      title: 'แก้ไขปุ่มล้างข้อมูลทั้งหมดด้านบน ให้แสดงเฉพาะจำนวนประเภทสถานะ SAP ที่ถูกเลือกเท่านั้น',
      targetSubject: 'ป้ายนับจำนวนบนปุ่มล้างข้อมูลทั้งหมด (#wbsOfficeChartClearBtn & #wbsOfficeChartClearCount)',
      storageFile: 'js/wbs.js & js/data_history.js',
      changeSummary: 'แก้ไขการแสดงผลตัวเลขนับบนปุ่ม "ล้างข้อมูลทั้งหมด" (#wbsOfficeChartClearBtn) ที่มุมบนขวา ให้แสดงเฉพาะจำนวนประเภทสถานะ SAP ที่ถูกเลือกเท่านั้น (เช่น (1), (3)) โดยไม่นำจำนวนงานที่เลือกจาก Checkbox (65 งาน) มาแสดงปนกันอีกต่อไป เพื่อแยกแยะความแตกต่างจากปุ่ม "ล้างข้อมูลที่เลือก" ด้านล่างได้อย่างชัดเจน',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (แก้ไขให้ แสดงจำนวนประเภท สถานะ sap ที่เลือก เท่านั้น): 1) ใน js/wbs.js ปรับปรุงฟังก์ชัน renderWbsSapSummary ในส่วนการอัปเดต #wbsOfficeChartClearCount โดยตัดเงื่อนไขการนำ selWbsCount มาแสดงผลออก 2) กำหนดให้แสดงตัวเลข (selSapCount) เฉพาะเมื่อมีการเลือกสถานะการ์ด SAP (selSapCount > 0) เช่น กรอง 1 สถานะแสดง (1) หรือเลือกทุกสถานะแสดง (9) 3) หากไม่มีการเลือกการ์ด SAP ให้ซ่อนป้ายนับ (display: none) ปล่อยให้ปุ่มแสดงเฉพาะข้อความ "ล้างข้อมูลทั้งหมด" 4) คงการแสดงตัวเลขนับจำนวนงาน Checkbox ไว้ที่ปุ่ม "ล้างข้อมูลที่เลือก" (#wbsCheckboxClearBtn) ด้านล่างเท่านั้น',
      sourceFile: 'คำสั่งผู้ใช้งาน (แก้ไขให้ แสดงจำนวนประเภท สถานะ sap ที่เลือก เท่านั้น)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'เล็กน้อย (แก้ไขตัวเลขนับบนปุ่มล้างข้อมูลด้านบนให้สะท้อนเฉพาะจำนวนประเภทสถานะ SAP ที่เลือก)'
    },
    {
      id: 'log_000_wbs_add_clear_checkbox_only_button',
      timestamp: '2026-10-18 16:15:00',
      timestampTh: '18 ต.ค. 2569, 16:15 น.',
      type: 'EDIT',
      typeBadge: 'ปุ่มล้างเฉพาะ Checkbox',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มปุ่มล้างข้อมูล เฉพาะที่เลือกจาก Checkbox เท่านั้น ใต้การ์ดสรุปสถานะ SAP ตามกรอบตำแหน่งที่ระบุ',
      targetSubject: 'ส่วนสรุปสถานะ SAP (#wbsSapSummarySection) และปุ่มล้างข้อมูลเฉพาะ Checkbox (#wbsCheckboxClearBtn)',
      storageFile: 'index.html, js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: '1) เพิ่มปุ่ม "ล้างข้อมูลที่เลือก" (#wbsCheckboxClearBtn) ไว้ใต้การ์ดสรุปสถานะ SAP ชิดขวาตรงตามกรอบสีแดงที่ผู้ใช้งานกำหนด 2) ฟังก์ชัน window.clearWbsCheckboxSelection จะล้างเฉพาะรายการที่เลือกจาก Checkbox ในตาราง (wbsState.selectedWbs) โดยไม่ล้างการเลือกสถานะการ์ด SAP และไม่ล้างการเลือกหน่วยงานบนกราฟ 3) ปรับปุ่มบนขวาหัวการ์ดกราฟ (#wbsOfficeChartClearBtn) เป็น "ล้างข้อมูลทั้งหมด" เพื่อให้ผู้ใช้งานแยกแยะการล้างทั้งหมดกับการล้างเฉพาะ Checkbox ได้อย่างชัดเจน',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (เพิ่มปุ่มล้างข้อมูล เฉพาะที่เลือกจาก checkbox เทานั้น): 1) ใน js/wbs.js เพิ่มฟังก์ชัน window.clearWbsCheckboxSelection สำหรับปลด wbsState.selectedWbs และปลด Checkbox ในตารางทั้งหมดโดยคงค่า wbsState.selectedSapStatuses และ wbsState.office ไว้ตามเดิม 2) ใน renderWbsSapSummary เพิ่ม footerHtml (.wbs-sap-summary-footer-bar) จัดวางปุ่ม #wbsCheckboxClearBtn ชิดขวาใต้การ์ด SAP ตามกรอบสีแดงในภาพ แสดงตัวเลขนับ (X) และเปลี่ยนเป็นปุ่มสีแดง Gradient เรืองแสงเมื่อมีรายการ Checkbox ถูกเลือก พร้อมสถานะ disabled เมื่อไม่มีรายการเลือก 3) ใน css/styles.css กำหนดคลาส .btn-clear-wbs-checkbox และ .wbs-sap-summary-footer-bar รองรับทั้ง Dark และ Light Theme 4) ใน index.html กำหนดป้ายปุ่มมุมขวาบนเป็น "ล้างข้อมูลทั้งหมด" เพื่อความชัดเจน',
      sourceFile: 'คำสั่งผู้ใช้งาน (เพิ่มปุ่มล้างข้อมูล เฉพาะที่เลือกจาก checkbox เทานั้น)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (เพิ่มปุ่มล้างเฉพาะรายการ Checkbox ใต้การ์ดสถานะ SAP ตามตำแหน่งที่กำหนด)'
    },
    {
      id: 'log_000_wbs_remove_bottom_summary_move_clear_btn_no_decimals',
      timestamp: '2026-10-18 16:05:00',
      timestampTh: '18 ต.ค. 2569, 16:05 น.',
      type: 'EDIT',
      typeBadge: 'ย้ายปุ่มล้าง & มูลค่าไม่มีทศนิยม',
      badgeClass: 'badge-type-edit',
      title: 'นำกล่องสรุปรายการที่เลือกด้านล่างออก, ย้ายปุ่มล้างข้อมูลที่เลือกขึ้นมุมบนขวา และปรับมูลค่าในการ์ดไม่มีจุดทศนิยม',
      targetSubject: 'กล่องสรุปรายการที่เลือก (#wbsSelectedSummaryCard), ปุ่มล้างข้อมูลบนหัวการ์ด (#wbsOfficeChartClearBtn) และมูลค่าในการ์ดสรุปสถานะ SAP (#wbsSapSummarySection)',
      storageFile: 'index.html, js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: '1) นำกล่องสรุปรายการที่เลือกด้านล่าง (#wbsSelectedSummaryCard) ออกตามรูปคำสั่งผู้ใช้งาน 2) ย้ายและปรับแต่งปุ่ม "ล้างข้อมูลที่เลือก" ขึ้นไปไว้ที่มุมขวาบนของหัวการ์ดกราฟ WBS แสดงจำนวนงานที่เลือกสีแดงเด่นชัด 3) ปรับปรุงการแสดงผลมูลค่า (AUC) ภายในการ์ดสรุปสถานะ SAP ทุกใบ ไม่ให้มีจุดทศนิยม (ปัดเป็นจำนวนเต็มและคั่นหลักพัน)',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน 2 ข้อ: 1) "เอาออก และย้ายตำแหน่งล้างข้อมูลที่เลือกตามรูป": ปรับปรุง index.html และ renderWbsSelectedSummaryCard ใน js/wbs.js ให้ปิดการแสดงผลของกล่องล่างอย่างสมบูรณ์ และย้ายปุ่มล้างข้อมูลที่เลือกขึ้นไปไว้ที่มุมบนขวา (#wbsOfficeChartClearBtn) พร้อมแสดงชื่อ "ล้างข้อมูลที่เลือก" และนับจำนวนรายการที่เลือก (เช่น ล้างข้อมูลที่เลือก (65)) 2) "มูลค่า ในการ์ด ไม่ต้องมีจุดทศนิยม": สร้างฟังก์ชัน formatMoneyNoDecimals ใน js/wbs.js และนำมาใช้จัดรูปแบบมูลค่า AUC ทั้งหมดในการ์ดสถานะ SAP (ทั้งการ์ด "ทั้งหมด" และการ์ดแต่ละสถานะ) รวมถึงมูลค่าของงานที่เลือก Checkbox ให้เป็นตัวเลขจำนวนเต็ม ไม่มีจุดทศนิยม (.00) อ่านง่ายและกะทัดรัดยิ่งขึ้น 3) ใน css/styles.css เพิ่มสถานะ :disabled สำหรับปุ่มล้างข้อมูลเมื่อไม่มีรายการเลือก',
      sourceFile: 'คำสั่งผู้ใช้งาน (เอาออก และย้ายตำแหน่งล้างข้อมูลที่เลือกตามรูป / มูลค่า ในการ์ด ไม่ต้องมีจุดทศนิยม)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงเลย์เอาต์การนำกล่องล่างออก ย้ายปุ่มล้างข้อมูล และจัดรูปแบบตัวเลขจำนวนเต็มในการ์ด)'
    },
    {
      id: 'log_000_wbs_sap_card_cb_remove_pct_lock_2_rows_bright_bg',
      timestamp: '2026-10-18 15:55:00',
      timestampTh: '18 ต.ค. 2569, 15:55 น.',
      type: 'EDIT',
      typeBadge: 'ล็อค 2 บรรทัด & สีใสสว่าง',
      badgeClass: 'badge-type-edit',
      title: 'นำ % ออกจากการ์ดส่วนที่เลือก, ล็อคการแสดงผลตายตัว 2 บรรทัด (จำนวนงาน/มูลค่า) ตัวเลขไม่โดนบัง และปรับสีพื้นหลังที่เลือกให้สีใสสว่างไม่ทึบ',
      targetSubject: 'กล่องสรุปผล Checkbox ด้านล่างการ์ดสรุปสถานะ SAP (#wbsSapSummarySection .wbs-sap-card-cb-box)',
      storageFile: 'css/styles.css, js/wbs.js & js/data_history.js',
      changeSummary: '1) นำ % สัดส่วนออกจากการ์ดส่วนที่เลือกทั้งหมด 2) ล็อคโครงสร้างการแสดงผลให้อยู่ 2 บรรทัดพอดี: บรรทัดที่ 1 แสดงไอคอนพร้อมจำนวนงาน (เช่น "✓ เลือก 11 งาน") บรรทัดที่ 2 แสดงป้ายมูลค่าพร้อมตัวเลขอักษรสีฟ้าเต็มจำนวนไม่โดนบัง 3) ปรับขนาดการ์ด min-width 165px และปรับ white-space: nowrap ป้องกันตัวเลขตกบรรทัด 4) ปรับสีพื้นหลังที่เลือกให้เป็นสีใสๆ สว่างๆ กระจกเรืองแสง (Translucent Glow) ไม่มืดทึบ',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน 2 คำสั่งต่อเนื่อง (เอา % ออก และเลือกแล้วตัวเลขต้องไม่โดนบัง ให้ล็อคอยู่ 2 บรรทัด บรรทัดจำนวนงาน บรรทัดมูลค่า / ปรับสีพื้นหลังที่เลือกให้ สีใสๆ สว่างง ไม่ทึบ แบบนี้): 1) ใน js/wbs.js ตัดสัดส่วน % ออกจากการ์ด "ทั้งหมด" และการ์ดทุกสถานะ SAP 2) ปรับโครงสร้าง HTML เป็น 2 แถวตายตัว: .wbs-sap-cb-row-jobs สำหรับบรรทัดจำนวนงาน และ .wbs-sap-cb-row-auc สำหรับบรรทัดมูลค่า 3) ใน css/styles.css ปรับความกว้าง .wbs-sap-card เป็น min-width: 165px พร้อมจัดวางตัวเลขมูลค่าให้แสดงผลได้เต็มจำนวน 100% ไม่โดนขอบตัด 4) ปรับสีพื้นหลังเมื่อมีรายการเลือก (.has-selection) ให้เป็น Gradient โปร่งแสงสว่างใส ไม่เข้มทึบดำ พร้อม Inner/Outer Glow นุ่มนวลสวยงามทั้ง Dark และ Light Theme',
      sourceFile: 'คำสั่งผู้ใช้งาน (เอา % ออก และเลือกแล้วตัวเลขต้องไม่โดนบัง ให้ล็อคอยู่ 2 บรรทัด บรรทัดจำนวนงาน บรรทัดมูลค่า / ปรับสีพื้นหลังที่เลือกให้ สีใสๆ สว่างง ไม่ทึบ แบบนี้)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุง Typography และความสว่างใสของพื้นหลังกล่อง Checkbox ภายในการ์ด SAP)'
    },
    {
      id: 'log_000_wbs_full_bleed_sap_card_checkbox_status_bg',
      timestamp: '2026-10-18 15:45:00',
      timestampTh: '18 ต.ค. 2569, 15:45 น.',
      type: 'EDIT',
      typeBadge: 'ปรับสีพื้นหลังภาวะปกติตามสถานะ',
      badgeClass: 'badge-type-edit',
      title: 'เปลี่ยนสีพื้นหลังภาวะปกติในส่วนที่เลือกของการ์ดสรุปสถานะ SAP ตามสี CLSD, TECO, REL และแผ่เต็มพื้นที่การ์ดส่วนล่าง',
      targetSubject: 'การ์ดสรุปสถานะ SAP (#wbsSapSummarySection) ในส่วนแสดงผล Checkbox ด้านล่างการ์ด',
      storageFile: 'css/styles.css & js/data_history.js',
      changeSummary: '1) ปรับสีพื้นหลังในภาวะปกติ (Idle State / ยังไม่มีการเลือก) ของส่วน Checkbox ด้านล่างการ์ดให้แสดงสีตามกลุ่มสถานะ SAP ทันที (CLSD โทนเขียวมิ้นท์, TECO โทนเหลืองอำพัน, REL โทนแดงคอรัล และ ALL โทนฟ้า) 2) ปรับแต่งเลย์เอาต์ให้กล่องส่วนที่เลือกแผ่ขยายเต็มความกว้างและชนขอบล่างของการ์ด (Full-bleed Bottom Flush) แนบสนิทสวยงามไร้รอยต่อ พร้อมเส้นคั่นด้านบนตามสีสถานะ',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (เปลี่ยนสีพื้นหลัง ภาวะปกติ ตามสี CLSD TECO REL ให้เต็มการ์ดส่วนที่เลือก): 1) ใน css/styles.css ปรับ .wbs-sap-card เป็น padding: 0 และ overflow: hidden เพื่อให้ส่วนล่างสามารถแผ่กว้างชนขอบซ้าย ขวา และล่างได้ 100% 2) กำหนด padding ของ .wbs-sap-card-main-info เป็น 0.65rem 0.75rem 0.45rem 0.75rem รักษาระยะตัวอักษรและ Badge ด้านบนให้เท่าเดิม 3) ปรับ .wbs-sap-card-cb-box ให้ margin: 0, width: 100%, border-radius: 0 0 9px 9px พร้อมเส้นขอบบน border-top 1px solid คั่นระหว่างส่วนบนกับส่วนล่างอย่างชัดเจน 4) กำหนดสีพื้นหลังภาวะปกติ (.cat-all, .cat-clsd, .cat-teco, .cat-rel) ให้เป็น Gradient สีโปร่งแสงตามเฉดสีของแต่ละสถานะ SAP ทันทีตั้งแต่เริ่มต้น และเรืองแสงสว่างเข้มข้นยิ่งขึ้นเมื่อมีรายการถูกเลือก (.has-selection) 5) รองรับ Light Theme อย่างสมบูรณ์แบบ',
      sourceFile: 'คำสั่งผู้ใช้งาน (เปลี่ยนสีพื้นหลัง ภาวะปกติ ตามสี CLSD TECO REL ให้เต็มการ์ดส่วนที่เลือก)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุง UI ส่วน Checkbox ของการ์ดสรุปสถานะ SAP ให้เต็มพื้นที่และมีสีสันตามสถานะในภาวะปกติ)'
    },
    {
      id: 'log_000_wbs_integrate_checkbox_into_sap_summary_cards',
      timestamp: '2026-10-18 15:35:00',
      timestampTh: '18 ต.ค. 2569, 15:35 น.',
      type: 'EDIT',
      typeBadge: 'รวมการ์ด Checkbox ในการ์ด SAP',
      badgeClass: 'badge-type-edit',
      title: 'ย้ายข้อมูลรายการที่เลือก Checkbox มารวมอยู่ในการ์ดสรุปสถานะ SAP แต่ละสถานะและทั้งหมด พร้อมแสดงอักษรสีฟ้าและพื้นหลังสีพิเศษตามสีสถานะ SAP',
      targetSubject: 'การ์ดสรุปสถานะ SAP (#wbsSapSummarySection) และการ์ดสรุปรายการที่เลือก (#wbsSelectedSummaryCard)',
      storageFile: 'css/styles.css, js/wbs.js & js/data_history.js',
      changeSummary: '1) ย้ายข้อมูลการเลือก Checkbox จากการ์ดด้านล่างขึ้นมารวมไว้ในการ์ดสรุปสถานะ SAP ด้านบน ทั้งการ์ด "ทั้งหมด" และการ์ดแยกแต่ละสถานะตรงตามสี 2) เพิ่มกล่องแสดงผลด้านล่างของการ์ดแต่ละใบ ด้วยอักษรสีฟ้า (#38BDF8) แสดงจำนวนงานและมูลค่า AUC ที่เลือก และมีพื้นหลังสีพิเศษสว่างเด่นขึ้นมาตามสีสถานะ SAP เมื่อมีรายการเลือก (ALL สีฟ้า, CLSD สีเขียวมิ้นท์, TECO สีเหลืองอำพัน, REL สีแดง) 3) ปรับปรุงให้การ์ดสรุป Checkbox ด้านล่างซ่อนการ์ดย่อยที่ซ้ำซ้อน คงไว้เฉพาะแถบ Progress Bar สรุปภาพรวมแบบกะทัดรัดเมื่อมีงานที่เลือก และซ่อนอัตโนมัติเมื่อไม่มีการเลือก',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน 3 ข้ออย่างสมบูรณ์แบบ: 1) ใน js/wbs.js ปรับปรุงฟังก์ชัน renderWbsSapSummary ให้ตรวจนับรายการที่ถูกเลือก Checkbox (wbsState.selectedWbs) ทั้งยอดรวมทั้งหมดและแยกตามแต่ละสถานะ SAP 2) เพิ่มกล่องย่อย .wbs-sap-card-cb-box ภายในการ์ดแต่ละใบ โดยใช้ตัวอักษรสีฟ้า (#38BDF8 / #67E8F9) แสดงจำนวนงานและมูลค่าที่เลือก พร้อมป้ายแท็กไอคอนเลือกกะทัดรัด 3) ใน css/styles.css กำหนดคลาส .has-selection และ .no-selection โดยเมื่อมีงานถูกเลือกจะแสดงพื้นหลัง Gradient สีพิเศษ ขอบเรืองแสง และเงา Box-shadow ตามสีของแต่ละสถานะ SAP (cat-all, cat-clsd, cat-teco, cat-rel) พร้อมรองรับทั้ง Dark และ Light Theme 4) ปรับปรุง toggleWbsRowCheckbox ให้เรียก renderWbsSapSummary แบบ Reactive อัปเดตการ์ด SAP ทันทีที่คลิก Checkbox ในตาราง 5) ปรับปรุง renderWbsSelectedSummaryCard ให้นำ cardsHtml ซ้ำซ้อนออก คงไว้เฉพาะแถบสรุป Progress Bar ที่เพรียวบางสวยงาม และซ่อนเมื่อไม่มีการเลือก (selectedCount === 0)',
      sourceFile: 'คำสั่งผู้ใช้งาน (1..ให้ย้ายข้อมูลในการ์ด ที่เลือก check box ไปไว้ในการ์ด สรุปสถานะ sap ให้ตรงตามการ์ดสถานะ sap และสถานะทั้งหมดด้วย 2.เมื่อรวมในการ์ดเดียวกันแล้ว ให้ข้างล่างการ์ดแสดงข้อมูลที่เลือก check box ด้วยอักษรสีฟ้า มีจำนวนงาน/มูลค่า และมีพื้นหลังสีพิเศษขึ้นมาตามสีสถานะ sap 3.จัดรูปแบบสีสวยงาม สมส่วน)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงโครงสร้างการ์ดสรุปสถานะ SAP ให้แสดงผลรวมรายการ Checkbox แบบ All-in-one)'
    },
    {
      id: 'log_000_wbs_show_selected_auc_total_and_move_status_to_title',
      timestamp: '2026-10-18 14:10:00',
      timestampTh: '18 ต.ค. 2569, 14:10 น.',
      type: 'EDIT',
      typeBadge: 'แสดงมูลค่ารวมที่เลือก',
      badgeClass: 'badge-type-edit',
      title: 'แสดงป้ายมูลค่ารวม (AUC) ที่เลือกบนหัวการ์ดกราฟแท่ง WBS และแสดงชื่อสถานะที่เลือกครบถ้วนด้านบน',
      targetSubject: 'หัวการ์ดกราฟแท่ง WBS (#wbsOfficesChartTitle & #wbsOfficesChartAucBadge)',
      storageFile: 'index.html, js/wbs.js & js/data_history.js',
      changeSummary: '1) เพิ่มป้ายแท็กสีฟ้าสดใส (#wbsOfficesChartAucBadge) แสดง "มูลค่ารวม: ฿..." ต่อท้ายป้ายจำนวนหน่วยงานและงานคงเหลือบนหัวการ์ดกราฟแท่ง WBS แบบ Real-time ตามสถานะที่ถูกเลือก 2) ปรับปรุงชื่อหัวเรื่องการ์ดกราฟ (#wbsOfficesChartTitle) ให้แสดงรายชื่อสถานะ SAP ที่ถูกเลือกทั้งหมดอย่างครบถ้วนตามคำสั่งผู้ใช้งาน (ย้ายด้านบน) โดยไม่ตัดทอนด้วยเครื่องหมาย ... 3) นำป้ายสถานะซ้ำซ้อนออกจากแถวคำแนะนำด้านล่างการ์ด เพื่อรักษาความสะอาดตาและเป็นระเบียบของหน้าจอ',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน 2 ส่วน: 1) ใน index.html เพิ่มแท็ก <span id="wbsOfficesChartAucBadge" class="tab-badge"> สไตล์สีฟ้าเรืองแสง (rgba(56,189,248,0.18)) ไว้ข้างขวาของป้ายจำนวนงานคงเหลือ 2) ใน js/wbs.js ปรับฟังก์ชัน renderTopOfficesChart ให้อ่านและรวมยอด cn41ActualCost แยกตามหน่วยงานและยอดรวมทั้งหมดของรายการที่กำลังกรอง จากนั้นอัปเดต aucBadgeEl แสดงผล เช่น "มูลค่ารวม: ฿1,554,614.97" ทันที 3) ปรับปรุงการกำหนด titleEl.textContent ให้นำ activeSapList มาเชื่อมด้วยเครื่องหมายจุลภาคแบบครบถ้วน ("กอง/กฟฟ. ที่มีงานสถานะ: TECO D3, TECO D2") 4) ปรับปรุง renderWbsSapSummary ให้แถบ actions แสดงข้อความแนะนำอย่างคงที่ คลีน สวยงาม',
      sourceFile: 'คำสั่งผู้ใช้งาน (ย้ายด้านบน, แสดงมูลค่ารวม ที่เลือกด้วย)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (เพิ่มการแสดงผลมูลค่าเงินรวมที่เลือกบนหัวการ์ดกราฟแท่งแบบไดนามิก)'
    },
    {
      id: 'log_000_wbs_add_select_all_sap_cards_btn_and_reorder_sections',
      timestamp: '2026-10-18 14:00:00',
      timestampTh: '18 ต.ค. 2569, 14:00 น.',
      type: 'EDIT',
      typeBadge: 'ปุ่มเลือกทุกสถานะ & จัดลำดับการ์ด',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มปุ่มเลือกการ์ดทุกสถานะ, ปรับปุ่มล้างข้อมูลล้างทั้งการ์ดและกราฟ, ย้ายแถบเปรียบเทียบ KPI 5 ไว้บนสุด และย้ายหัวข้อสรุปสถานะ SAP กลับไว้บนการ์ด',
      targetSubject: 'แถบเครื่องมือหัวการ์ดกราฟ (#wbsOfficeChartSelectAllBtn), การ์ดสรุปเป้าหมาย KPI 5 (#wbsTargetComparisonSection) และส่วนสรุปสถานะ SAP (#wbsSapSummarySection)',
      storageFile: 'index.html, css/styles.css, js/wbs.js & js/data_history.js',
      changeSummary: '1) เพิ่มปุ่ม "เลือกทุกสถานะ" สีฟ้าสดใส (.btn-wbs-card-select-all) ไว้ด้านบนขวาข้างปุ่มล้างข้อมูล เมื่อคลิกจะเลือกการ์ดสถานะ SAP ทุกใบให้ Active ทันที 2) ปรับปรุงฟังก์ชัน clearAllWbsSelection ให้ปุ่มล้างข้อมูลทำการล้างทั้งการเลือกสถานะการ์ด, กรองหน่วยงานบนกราฟ และรายการ Checkbox พร้อมกันในคลิกเดียว 3) ย้ายการ์ดเปรียบเทียบการปิดมูลค่าตามเป้าหมายระดับ KPI 5 ขึ้นไปไว้ด้านบนสุดเหนือการ์ดกราฟแท่ง WBS 4) ย้ายแถบหัวข้อและคำแนะนำสรุปสถานะ SAP กลับขึ้นไปไว้ด้านบนการ์ดสถานะเหมือนเดิม',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน 4 ส่วน: 1) ใน index.html และ css/styles.css เพิ่มปุ่ม .btn-wbs-card-select-all สีฟ้า Gradient (#2563EB - #1D4ED8) ขอบเรืองแสงพร้อมไอคอน Check-check สั่งฟังก์ชัน selectAllWbsSapStatuses เลือกสถานะ SAP ทุกประเภทที่พบในระบบ 2) ปรับปรุง clearAllWbsSelection ใน js/wbs.js ให้ล้าง wbsState.selectedSapStatuses, wbsState.sapStatus = "ALL", wbsState.office = "ALL", wbsOfficeFilterSelect.value = "ALL" และ wbsState.selectedWbs.clear() ทำให้ทั้งการ์ดและกราฟคืนค่ากลับสู่ค่าเริ่มต้นทั้งหมด 3) ย้าย #wbsTargetComparisonSection ขึ้นไปอยู่ด้านบนสุดใต้แถบตัวกรองหลัก 4) ปรับปรุง renderWbsSapSummary ให้ headerHtml แสดงผลก่อน cardsHtml ทำให้หัวเรื่องและคำแนะนำอยู่ด้านบนการ์ดสถานะตามเดิม',
      sourceFile: 'คำสั่งผู้ใช้งาน (เพืมปุ่มเลือกการ์ด ทุกสถานะทั้งหมด ไว้ด่านบน, ปุ่มล้างข้อมูล ให้ล้างทั้งสถานะการ์ด และกราฟ, ย้าย เปรียบเทียบการปิดมูลค่าตามเป้าหมายระดับ KPI 5 ไว้ด้านบน, ย้ายไว้ด้านบนเหมือนเดิม)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงฟังก์ชันการเลือก/ล้างสถานะ และการจัดวางโครงสร้าง Layout บนหน้าจอ WBS คงเหลือ)'
    },
    {
      id: 'log_000_wbs_chart_filter_by_selected_sap_status_card',
      timestamp: '2026-10-18 13:45:00',
      timestampTh: '18 ต.ค. 2569, 13:45 น.',
      type: 'EDIT',
      typeBadge: 'กรองกราฟตามการ์ด SAP',
      badgeClass: 'badge-type-edit',
      title: 'ปรับปรุงให้กราฟแท่ง WBS แสดงเฉพาะสถานะ SAP ที่ถูกเลือกจากการ์ดสรุปสถานะทุกๆ สถานะ',
      targetSubject: 'กราฟแท่ง กอง/กฟฟ. ที่มีงาน WBS คงเหลือ (#wbsOfficesBarChart)',
      storageFile: 'js/wbs.js & js/data_history.js',
      changeSummary: 'เมื่อผู้ใช้งานคลิกเลือกการ์ดสถานะ SAP ใดๆ (เช่น TECO D3, CLSD F4, หรือหลายสถานะพร้อมกัน) กราฟแท่ง WBS จะกรองและแสดงผลเฉพาะข้อมูลงานและหน่วยงานที่มีสถานะ SAP ตามที่เลือกในการ์ดเท่านั้น พร้อมอัปเดตหัวเรื่องและป้ายสรุปจำนวนหน่วยงาน/งานคงเหลือให้สอดคล้องกันแบบ Real-time',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (หากเลือกสถานะsapที่การ์ด ให้กราฟแสดงเฉพาะที่เลือกในการ์ด ทุกๆ สถานะ): 1) ในฟังก์ชัน renderWbsTab ปรับการส่งข้อมูลให้ renderWbsCharts โดยตรวจสอบเงื่อนไข hasSapFilter หากมีการเลือกสถานะ SAP ให้ใช้ getFilteredWbsData(true, false) เพื่อส่งเฉพาะชุดข้อมูลที่ผ่านการกรองสถานะ SAP เข้าสู่กราฟแท่ง 2) ปรับปรุงฟังก์ชัน renderTopOfficesChart ให้หัวเรื่องการ์ด (#wbsOfficesChartTitle) แสดงชื่อสถานะ SAP ที่กำลังกรองอย่างชัดเจน (เช่น "กอง/กฟฟ. ที่มีงานสถานะ TECO D3") และอัปเดตป้ายตัวเลขจำนวนหน่วยงานและงานคงเหลือให้ตรงกับข้อมูลที่แสดง 3) รองรับการเลือกพร้อมกันหลายสถานะ (Multi-selection) และเมื่อคลิกการ์ด "ทั้งหมด" หรือปุ่ม "ล้างข้อมูล" กราฟจะกลับมาแสดงผลครบทุกหน่วยงานและทุกสถานะทันที',
      sourceFile: 'คำสั่งผู้ใช้งาน (หากเลือกสถานะsapที่การ์ด ให้กราฟแสดงเฉพาะที่เลือกในการ์ด ทุกๆ สถานะ)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงฟังก์ชันการเชื่อมโยงการกรองข้อมูลระหว่างการ์ดสรุปสถานะ SAP และกราฟแท่ง WBS)'
    },
    {
      id: 'log_000_wbs_remove_btn_clear_sap_all',
      timestamp: '2026-10-18 13:38:00',
      timestampTh: '18 ต.ค. 2569, 13:38 น.',
      type: 'EDIT',
      typeBadge: 'นำปุ่มแสดงทั้งหมดออก',
      badgeClass: 'badge-type-edit',
      title: 'นำปุ่ม "✕ แสดงทั้งหมด" ในแถบสรุปสถานะ SAP ออกตามคำสั่งผู้ใช้งาน',
      targetSubject: 'แถบสรุปสถานะ SAP (#wbsSapSummarySection) ในแท็บ WBS คงเหลือ',
      storageFile: 'js/wbs.js & js/data_history.js',
      changeSummary: 'นำปุ่ม "✕ แสดงทั้งหมด" (.btn-wbs-sap-clear) ออกจากแถบคำแนะนำใต้การ์ดสรุปสถานะ SAP เพื่อลดความซ้ำซ้อน เนื่องจากระบบมีปุ่ม "ล้างข้อมูล" สีแดงหลักบนหัวการ์ด และการ์ด "ทั้งหมด" ให้คลิกใช้งานได้อย่างสะดวกอยู่แล้ว',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (เอาออก - พร้อมรูปปุ่ม "✕ แสดงทั้งหมด"): ลบปุ่ม .btn-wbs-sap-clear ใน headerHtml ของฟังก์ชัน renderWbsSapSummary คงเหลือเฉพาะป้ายแจ้งสถานะการกรอง (.wbs-sap-active-pill) ทำให้แถบคำแนะนำด้านล่างการ์ดกระชับ คลีน และสวยงามลงตัว',
      sourceFile: 'คำสั่งผู้ใช้งาน (เอาออก - ภาพปุ่ม ✕ แสดงทั้งหมด)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับแต่ง UI นำปุ่มซ้ำซ้อนออก)'
    },
    {
      id: 'log_000_wbs_stripes_teco_d2_rel_c3_and_move_sap_title_below_cards',
      timestamp: '2026-10-18 13:35:00',
      timestampTh: '18 ต.ค. 2569, 13:35 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มลายเส้น TECO D2/REL C3 & ย้ายข้อความใต้การ์ด',
      badgeClass: 'badge-type-edit',
      title: 'ย้ายแถบหัวข้อ/คำแนะนำสถานะ SAP ไว้ด้านล่างการ์ด และเพิ่มลายเส้นทางเฉียงให้ TECO D2 และ REL C3 เหมือน CLSD F4 โดยคงสีเดิม',
      targetSubject: 'การ์ดสรุปสถานะ SAP (#wbsSapSummarySection) และกราฟแท่ง WBS (#wbsOfficesBarChart)',
      storageFile: 'js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: '1) ย้ายแถวข้อความหัวข้อและคำแนะนำการคลิกกรองไปไว้ด้านล่างแถวการ์ดสรุปสถานะ SAP ตามแนวลูกศรสีแดง 2) เพิ่มลวดลายทางเฉียง 45 องศา (Stripe Pattern) ให้กับสถานะ TECO D2 (สีเหลืองอำพันคงเดิม) และ REL C3 (สีแดงคอรัลคงเดิม) ทั้งในแท่งกราฟ Canvas และบนป้าย Badge ของการ์ด ให้เหมือนกับสถานะ CLSD F4',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน 2 ส่วน: 1) ปรับปรุงลำดับการแสดงผลใน renderWbsSapSummary ให้ cardsHtml แสดงผลก่อน headerHtml พร้อมปรับแต่งเส้นคั่นประและระยะห่าง CSS ทำให้การ์ดทั้ง 10 ใบอยู่ติดกับหัวการ์ดหลัก และมีคำอธิบายพร้อมคำแนะนำกรองกำกับอยู่ด้านล่างอย่างเป็นระเบียบ 2) ปรับปรุงฟังก์ชัน getSapSegmentStyle ให้สถานะ TECO D2 และ REL C3 มีคุณสมบัติ hasPattern: true และเส้นขอบหนา 1.5px (เหมือน CLSD F4) 3) ในกราฟแท่ง Canvas (drawCanvasBarSegment) นำ CanvasPattern ลายทางเฉียงมาระบายทับบน Base Gradient ของ TECO D2 และ REL C3 โดยไม่เปลี่ยนแปลงสีเดิม 4) ในการ์ดสรุปสถานะ SAP ปรับ badgeStyleAttr ของ TECO D2 ให้เป็น repeating-linear-gradient สีเหลืองทอง และ REL C3 เป็น repeating-linear-gradient สีแดงสด สวยงาม คมชัด และสอดคล้องกันทั้งระบบ',
      sourceFile: 'คำสั่งผู้ใช้งาน (ย้ายไว้ด้านล่างการ์ด / เพิ่มกราฟ teco d2 และ rel c3 ให้มีลายเส้นเหมือน clsd f4 แต่มีสีคงเดิม)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุง UI สรุปสถานะ SAP และลวดลายกราฟิกในกราฟแท่ง WBS)'
    },
    {
      id: 'log_000_wbs_integrate_sap_cards_match_colors_red_clear_btn_remove_share',
      timestamp: '2026-10-18 13:25:00',
      timestampTh: '18 ต.ค. 2569, 13:25 น.',
      type: 'EDIT',
      typeBadge: 'รวมการ์ด SAP และปุ่มล้างข้อมูล',
      badgeClass: 'badge-type-edit',
      title: 'ย้ายการ์ดสรุปสถานะ SAP รวมในการ์ดกราฟแท่ง, ปรับสีการ์ดให้ตรงกับกราฟ, เพิ่มปุ่มล้างข้อมูลสีแดงบนขวา, นำ % สัดส่วนออก และปรับขนาดการ์ดแคบลงสมสัดส่วน',
      targetSubject: 'การ์ดกราฟแท่ง กอง/กฟฟ. ที่มีงาน WBS คงเหลือ (#wbsSapSummarySection & #wbsOfficesBarChart)',
      storageFile: 'index.html, js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: '1) ย้ายแถวการ์ดสรุปสถานะ SAP ขึ้นไปรวมอยู่ในการ์ดกราฟแท่งด้านบน (ตำแหน่งกรอบสีน้ำเงิน) 2) ปรับสี ป้ายกำกับ และเส้นขอบของการ์ดแต่ละสถานะให้ตรงกับสีกราฟแท่ง (CLSD F4 เขียวมิ้นท์ลายทางเฉียง, TECO เหลืองทอง, REL แดงลดหลั่น) 3) เพิ่มปุ่มล้างข้อมูลสีแดงเด่นชัด (.btn-wbs-card-clear) บนมุมขวาของการ์ด 4) นำ % สัดส่วนมูลค่าออกจากการ์ดทั้งหมด 5) ปรับขนาดการ์ดให้แคบลงและสมส่วน (flex 102px) จัดวางเรียงแถวเดียวอย่างสวยงามพอดีหน้าจอ',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: 1) ย้ายโครงสร้าง DOM ของ #wbsSapSummarySection เข้าไปอยู่ใน .content-card ระหว่างหัวการ์ดกับ Canvas กราฟแท่ง รวมการ์ดเป็นหนึ่งเดียวประหยัดพื้นที่แนวตั้ง 2) เชื่อมโยงฟังก์ชัน getSapSegmentStyle เข้ากับ renderWbsSapSummary เพื่อให้สีพื้นหลัง ป้ายกำกับ เส้นขอบ และลายทางเฉียง 45 องศาของ CLSD F4 ตรงกับเซกเมนต์ของกราฟแท่ง 100% 3) เพิ่มปุ่ม "ล้างข้อมูล" สีแดงสด (.btn-wbs-card-clear) พร้อมไอคอนถังขยะที่มุมบนขวาของ Header การ์ด สั่งล้างทั้งการเลือก Checkbox และตัวกรองสถานะ SAP (clearAllWbsSelection) 4) นำแท็ก <span class="wbs-sap-card-share"> ออกจากการ์ดทุกใบ 5) ปรับ CSS .wbs-sap-summary-integrated ให้การ์ดมีขนาดแคบลงและยืดหยุ่น (min-width: 102px, max-width: 155px, flex: 1 1 0) ทำให้การ์ดทั้ง 10 ใบเรียงตัวสวยงามในแถวเดียวพอดีกับจอภาพ',
      sourceFile: 'คำสั่งผู้ใช้งาน (1.ให้ย้าย การ์ดสรุปสถานะ sap ไปไว้กรอบสีน้ำเงิน อยู่รวมกับกราฟด้านบน ให้สมส่วนในหน้าเดียว 2.ปรับสี สถานะกราฟในการ์ด ให้ตรงกับสีกราฟแท่ง / เพิ่มปุ่มล้างข้อมูล บนขวาสีแดง / % สัดส่วนมูลค่าเอาออก และปรับขนาดการ์ดให้แคบลง สมสัดส่วน)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงโครงสร้าง Layout, UI สรุปสถานะ SAP, พาเลตต์สี และเพิ่มปุ่มล้างข้อมูล)'
    },
    {
      id: 'log_000_wbs_cancel_donut_chart_addition',
      timestamp: '2026-10-18 13:06:00',
      timestampTh: '18 ต.ค. 2569, 13:06 น.',
      type: 'CONFIG',
      typeBadge: 'ยกเลิกเพิ่มกราฟวงกลม',
      badgeClass: 'badge-type-config',
      title: 'ยกเลิกคำสั่งเพิ่มกราฟวงกลม และคงการแสดงผลสรุปสถานะ SAP ตามรูปแบบการ์ดแนวนอนเดิม',
      targetSubject: 'ส่วนสรุปสถานะ SAP (#wbsSapSummarySection) ในแท็บ WBS คงเหลือ',
      storageFile: 'js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: 'ยกเลิกการเพิ่มกราฟวงกลมตามคำสั่งผู้ใช้งาน โดยคงรูปแบบการ์ดสรุปสถานะ SAP และเปอร์เซ็นต์สัดส่วนมูลค่าทั้งหมดไว้ตามโครงสร้างเดิม',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (ยกเลิกคำสั่ง เพิ่มกราฟวงกลม ให้ชัดเจนทุกตัวเลข โดยใช้ข้อมูลตามรูป 7): 1) คืนค่าฟังก์ชัน renderWbsSapSummary ใน js/wbs.js สู่รูปแบบเดิม 2) คงการแสดงผลการ์ดสถานะ SAP แนวนอนพร้อมตัวเลขและสัดส่วน % ไว้อย่างครบถ้วน 3) นำสไตล์ CSS ส่วนเกินออกจาก css/styles.css เพื่อรักษาความกระชับของระบบ',
      sourceFile: 'คำสั่งผู้ใช้งาน (ยกเลิกคำสั่ง เพิ่มกราฟวงกลม ให้ชัดเจนทุกตัวเลข โดยใช้ข้อมูลตามรูป 7)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_wbs_chart_remove_header_legend_and_action_buttons',
      timestamp: '2026-10-18 12:45:00',
      timestampTh: '18 ต.ค. 2569, 12:45 น.',
      type: 'EDIT',
      typeBadge: 'นำ Legend & ปุ่มหัวการ์ดออก',
      badgeClass: 'badge-type-edit',
      title: 'นำแถบ Legend สรุปสถานะ และปุ่มเลือกมุมมองกราฟ ออกจากหัวการ์ดกราฟ WBS',
      targetSubject: 'หัวการ์ดกราฟแท่ง กอง/กฟฟ. ที่มีงาน WBS คงเหลือ (แท็บ WBS คงเหลือ)',
      storageFile: 'index.html, js/wbs.js & js/data_history.js',
      changeSummary: 'นำส่วนแสดงผลที่อยู่ในกรอบสีแดงทั้งหมดตามรูปภาพ ได้แก่ แถบ Legend สรุปยอดคงเหลือสถานะ CLSD/TECO/REL, สัญลักษณ์คำอธิบายสีและลวดลาย, และปุ่มสลับมุมมอง (ทั้งหมด/10 อันดับแรก, แบบซ้อน/แบบแยก) ออกจากหัวการ์ดกราฟ เพื่อความเรียบง่าย คลีน และสวยงาม',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน (เอาออก) พร้อมรูปภาพระบุกรอบสีแดง: 1) นำองค์ประกอบ <div id="wbsChartLegend"> ทั้งหมดออกจาก index.html 2) นำกลุ่มปุ่ม <div class="card-actions"> (wbsChartScopeBtnAll, wbsChartScopeBtnTop10, wbsChartModeBtnStacked, wbsChartModeBtnGrouped) ออกจาก index.html 3) คงเหลือเฉพาะหัวข้อการ์ดและป้ายสรุปจำนวนหน่วยงานและงานคงเหลือ (20 หน่วยงาน คงเหลือ 287 งาน) เพื่อให้หัวการ์ดดูโปร่ง สะอาดตา และไม่เกะกะสายตา',
      sourceFile: 'คำสั่งผู้ใช้งาน (เอาออก - พร้อมภาพระบุกรอบสีแดงบริเวณหัวการ์ด)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับปรุงความเรียบง่ายของ UI หัวการ์ดกราฟแท่ง WBS)'
    },
    {
      id: 'log_000_wbs_chart_striped_green_containment_fix',
      timestamp: '2026-10-18 12:25:00',
      timestampTh: '18 ต.ค. 2569, 12:25 น.',
      type: 'EDIT',
      typeBadge: 'แก้ไขลวดลายให้อยู่ในกราฟ',
      badgeClass: 'badge-type-edit',
      title: 'แก้ไขลวดลายทางเฉียงสีเขียวให้อยู่เฉพาะในแท่งกราฟ ไม่ให้ล้นเกินออกมานอกกราฟ',
      targetSubject: 'กราฟแท่ง กอง/กฟฟ. ที่มีงาน WBS คงเหลือ (แท็บ WBS คงเหลือ)',
      storageFile: 'js/wbs.js & js/data_history.js',
      changeSummary: 'เปลี่ยนการวาดลายทางเฉียงจากเดิมที่ใช้การขีดเส้นข้ามพิกัดแล้ว clip ซึ่งเกิดการรั่วไหลของเส้น ออกมานอกกรอบแท่ง เป็นการใช้ Path2D ร่วมกับ CanvasPattern (createPattern) ระบายลวดลายลงบน Path ของแท่งโดยตรง ทำให้ลวดลายถูกจำกัดอยู่ภายในแท่ง 100% ไม่ล้นเกินออกมานอกแท่งกราฟอีกต่อไป',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: 1) สร้างฟังก์ชัน getWbsStripePattern เพื่อสร้าง CanvasPattern ลายทางเฉียง 45 องศาแบบแคช 2) ปรับปรุงฟังก์ชัน drawCanvasBarSegment ให้ใช้ Path2D.roundRect และระบายสีพื้นหลักด้วย ctx.fill(p) จากนั้นระบายลวดลายด้วย ctx.fillStyle = pat; ctx.fill(p) ทำให้ลวดลายถูกกักอยู่เฉพาะในรูปทรงของแท่งกราฟอย่างแม่นยำ 100% แก้ไขปัญหาเส้นลายทางเฉียงแลบออกมาระหว่างแท่งกราฟได้อย่างถาวร',
      sourceFile: 'คำสั่งผู้ใช้งาน (แก้ไขลวดลายสีเขียว ให้อยู่ในกราฟ ไม่ให้เกินกราฟออกมาแบบนี้)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (แก้ไขข้อบกพร่องการเรนเดอร์ลวดลายกราฟิกใน Canvas)'
    },
    {
      id: 'log_000_wbs_chart_striped_green_match_user_img4',
      timestamp: '2026-10-18 12:15:00',
      timestampTh: '18 ต.ค. 2569, 12:15 น.',
      type: 'EDIT',
      typeBadge: 'ปรับสีเขียวมีลายรูป 4',
      badgeClass: 'badge-type-edit',
      title: 'ปรับเฉดสีและเส้นขอบสถานะ CLSD F4/F2 ให้เป็นสีเขียวมิ้นท์มีลายทางเฉียงตามรูป 4',
      targetSubject: 'กราฟแท่ง กอง/กฟฟ. ที่มีงาน WBS คงเหลือ (แท็บ WBS คงเหลือ)',
      storageFile: 'js/wbs.js, index.html & js/data_history.js',
      changeSummary: 'ปรับเฉดสี CLSD F4/F2 ตามเกณฑ์วัดให้ตรงตามรูป 4: ไล่ระดับสีเขียวมิ้นท์พาสเทลด้านบน (#CBFCE6) ผ่านสีเขียวมิ้นท์สดใส (#48D0A2) สู่สีเขียวมรกต (#10B981) พร้อมเส้นขอบสีมิ้นท์สว่างมนสวย (#A1FCDB ขนาด 1.5px) และตัวเลขสีเข้ม #022C22 คมชัดเด่นชัด 100%',
      details: 'วิเคราะห์ค่าสีจากรูป 4 ของผู้ใช้งาน (media_1792300221405.jpg) พบว่า: 1) สีด้านบนสุดเป็นสีเขียวมิ้นท์พาสเทลสว่าง #CBFCE6 ไล่ลงมายัง #48D0A2 และ #10B981 2) ขอบมนเป็นสีมิ้นท์สว่าง #A1FCDB ความหนา 1.5px 3) ลายทางเฉียง 45 องศา สีขาวโปร่งใสความกว้าง 2px ระยะห่าง step 7px 4) ตัวเลขแสดงจำนวนงานเป็นสีเข้ม #022C22 พร้อม drop shadow สีขาว ทำให้อ่านง่าย คอนทราสต์สูงและสวยงามตรงตามรูป 4 ทุกประการ',
      sourceFile: 'คำสั่งผู้ใช้งาน (แก้ไขสี CLSD F4/F2 ตามเกณวัด ให้เป็นสีเขียวตามรูป 4)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับแต่งพาเลตต์สีและสไตล์ภาพกราฟิกสถานะ CLSD F4/F2 ตามที่ผู้ใช้ระบุ)'
    },
    {
      id: 'log_000_wbs_chart_striped_green_all_numbers_and_remove_hover_tooltip',
      timestamp: '2026-10-18 12:05:00',
      timestampTh: '18 ต.ค. 2569, 12:05 น.',
      type: 'EDIT',
      typeBadge: 'ปรับแต่งกราฟ WBS',
      badgeClass: 'badge-type-edit',
      title: 'เปลี่ยน CLSD F4/F2 เป็นสีเขียวมีลาย (ไม่เรืองแสงนีออน), แสดงตัวเลขจำนวนงานครบถ้วนทุกสถานะในแท่งกราฟ, และนำ Popup เมาส์เลื่อนออก',
      targetSubject: 'กราฟแท่ง กอง/กฟฟ. ที่มีงาน WBS คงเหลือ (แท็บ WBS คงเหลือ)',
      storageFile: 'js/wbs.js, index.html, css/styles.css & js/data_history.js',
      changeSummary: '1) เปลี่ยนสีสถานะ CLSD F4/F2 เป้าหมายปิดงาน จากสีเขียวนีออนเรืองแสง เป็นสีเขียวมีลายทางเฉียง 45 องศา (Striped Green Pattern) คมชัด สวยงาม กลมกลืนกับกราฟ 2) แก้ไขความสูงเซกเมนต์และการแสดงผลตัวเลข ให้แสดงจำนวนงานครบถ้วนทุกสถานะย่อยในแท่งกราฟ (รวมยอดภายในแท่งตรงกับยอดรวมด้านบน 100%) 3) นำกล่อง Popup ที่แสดงเมื่อเลื่อนเมาส์ (Hover Tooltip) ออกตามคำสั่งผู้ใช้งาน',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน 3 ข้อ: 1) ปรับปรุงฟังก์ชัน drawCanvasBarSegment ให้รองรับการตัดระนาบ (Clip Path) และวาดลายทางเฉียง 45 องศา พร้อมเส้นขอบสีเขียวมรกตคมชัด สำหรับสถานะ CLSD F4 และ CLSD F2 และยกเลิกเอฟเฟกต์เรืองแสงนีออน ทำให้ดูสวยงาม เรียบหรู กลมกลืน ไม่แปลกตา 2) คำนวณความสูงขั้นต่ำฐาน (Base Height 8.5-12.5px) ให้ทุกเซกเมนต์ที่มีงานคงเหลือ และเกลี่ยความสูงส่วนเกินตามสัดส่วนจำนวนงาน ทำให้สถานะย่อยทุกรายการมีพื้นที่เพียงพอ พร้อมยกเลิกเงื่อนไขการตัดทิ้ง ทำให้ตัวเลขจำนวนงานแสดงครบทุกสถานะในแท่งกราฟ 3) ปิดการแสดงผลกล่อง Popup (Tooltip) เมื่อเลื่อนเมาส์ผ่านแท่งกราฟ โดยยังคงฟังก์ชันการคลิกที่แท่งกราฟเพื่อกรองตารางตามหน่วยงานไว้อย่างสมบูรณ์ 4) ปรับปรุง Legend ป้ายกำกับบนหัวการ์ดให้แสดงสัญลักษณ์ "F4/F2 ลายเขียว"',
      sourceFile: 'คำสั่งผู้ใช้งาน (1.แก้ไขสีเขียวนีออนเรืองแสงCLSD F4/F2 ให้เป็นสีเขียวมีลาย ดูแล้วแปลกจากอันอื่นๆ 2.แก้ไข กราฟยังแสดงจำนวนงาน ไม่ครบ ตามรูป 2 3.เอาตัวเมาเลื่อนแล้วแสดงออกไป)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงการแสดงผลกราฟแท่ง WBS ความครบถ้วนของข้อมูล และประสบการณ์ผู้ใช้งาน)'
    },
    {
      id: 'log_000_wbs_chart_sap_color_gradients',
      timestamp: '2026-10-18 11:35:00',
      timestampTh: '18 ต.ค. 2569, 11:35 น.',
      type: 'EDIT',
      typeBadge: 'ปรับสีกราฟตามสถานะ SAP',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มรายละเอียดกราฟแท่ง WBS แยกและไล่ระดับสีตามสถานะ SAP (CLSD F4 เรืองแสง, TECO เหลืองเข้ม-อ่อน, REL แดงเข้ม-อ่อน) และไล่ระดับความสูงกราฟตามจำนวนงานคงเหลือมากสุดไปน้อยสุด',
      targetSubject: 'กราฟ กอง/กฟฟ. ที่มีงาน WBS คงเหลือ (แท็บ WBS คงเหลือ)',
      storageFile: 'js/wbs.js, index.html, css/styles.css & js/data_history.js',
      changeSummary: 'แสดงจำนวนงานและสีแยกตามสถานะ SAP ทุกรายการ: CLSD F4 เขียวเรืองแสง, TECO ไล่เหลืองเข้ม F ถึงอ่อน B, REL ไล่แดงเข้ม F ถึงอ่อน B, ไล่ระดับความสูงแท่งกราฟให้งานเยอะสุดมีความสูงมากสุดเสมอ และลดหลั่นลงตามจำนวนงานอย่างแม่นยำ 100%',
      details: 'ดำเนินการตามข้อกำหนด 6 ข้อของผู้ใช้งาน: 1) ปรับปรุงกราฟแท่งแบบซ้อนให้แบ่งเซกเมนต์ตามรหัสสถานะ SAP ย่อยจริง (CLSD F4, CLSD F2, TECO D2, REL C1, REL D1 ฯลฯ) 2) กำหนดสี CLSD เป็นสีเขียว โดย CLSD F4 มีเอฟเฟกต์สีเขียวนีออนเรืองแสง (ในเกณฑ์วัด 1, 2, 3, 5 และข้อ 4) และไล่ระดับความเข้มตามลำดับตัวอักษรและตัวเลข 3) TECO ใช้สีเหลืองเข้มโทนอำพันตามอักษร F ไปจนถึงสีเหลืองอ่อนโทน B 4) REL ใช้สีแดงเข้มจัด F/D ไปจนถึงสีแดงสว่าง C และแดงอ่อน B 5) ปรับสัดส่วนกราฟ (ความสูง 268px, plotH 168px) ให้กะทัดรัด ไม่สูงเกินไป แสดงตัวเลขจำนวนงานครบถ้วนชัดเจนในทุกเซกเมนต์ และอัปเกรด Tooltip แสดงรายละเอียดแยกสถานะ SAP อย่างละเอียด 6) คำนวณความสูงแท่งกราฟแบบ Strict Monotonic Cascading ให้หน่วยงานที่งานคงเหลือเยอะสุดกราฟสูงที่สุด และลดหลั่นลงมาตามจำนวนงานอย่างแม่นยำ ไม่ถูกดันด้วยจำนวนเซกเมนต์ย่อย',
      sourceFile: 'คำสั่งผู้ใช้งาน (1.เพิ่มรายละเอียดกราฟแสดงจำนวนงานไล่ระดับสีตามสถานะ sap 2.CLSD เขียว F4 เรืองแสง 3.TECO เหลืองเข้ม F ถึงอ่อน B 4.REL แดงไล่ตามอักษรตัวเลข 5.จัดรูปแบบสมส่วนตัวเลขชัดเจน ความสูงกราฟไม่มาก 6.ให้ไล่ความสูงกราฟ ให้งานเยอะสุดความสูงกราฟมากสุด)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงระบบการแสดงผลกราฟแท่งและการวิเคราะห์สถานะ SAP)'
    },
    {
      id: 'log_000_wbs_checkbox_rules_clsd_f2_and_clsd_e2',
      timestamp: '2026-10-18 00:15:00',
      timestampTh: '18 ต.ค. 2569, 00:15 น.',
      type: 'CONFIG',
      typeBadge: 'ปรับเงื่อนไข Checkbox WBS',
      badgeClass: 'badge-type-config',
      title: 'ปรับเงื่อนไข Checkbox: เกณฑ์วัดข้อ 1, 2, 3, 5 เพิ่ม Checkbox หากเป็น CLSD F2 และยกเว้น CLSD E2 ไม่แสดง Checkbox ทั้งหมด',
      targetSubject: 'เมนู WBS คงเหลือ (#tab-wbs) - เงื่อนไขการแสดงผล Checkbox และการเลือกจำลองเป้าหมาย',
      storageFile: 'js/wbs.js, js/data_history.js, index.html',
      changeSummary: '1) ในเกณฑ์วัดข้อ 1, 2, 3, 5 ปรับให้สถานะ CLSD F2 มี Checkbox ให้ผู้ใช้สามารถเลือกเพื่อคำนวณจำลองยอดปิดงานได้ (ยกเว้นเฉพาะ CLSD F4 ที่ปิดงานตามเป้าหมายแล้ว) 2) สถานะ CLSD E2 ให้เอา Checkbox ออกทั้งหมดทุกเกณฑ์วัด 3) เกณฑ์วัดข้อ 4 (งบ C02.2) ยังคงยกเว้น CLSD F2 ตามเป้าหมายปิดงานของข้อ 4',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: 1) สร้างฟังก์ชัน isWbsItemExcludedFromCheckbox(sapVal, currentCrit) รวมศูนย์การตรวจสอบการยกเว้น Checkbox 2) สำหรับสถานะ CLSD E2 กำหนดให้ถูกยกเว้นทั้งหมด ไม่แสดง Checkbox ในทุกเกณฑ์วัด 3) สำหรับเกณฑ์วัดข้อ 1, 2, 3, 5 (เป้าหมายปิดงานคือ CLSD F4) กำหนดให้ยกเว้นเฉพาะ CLSD F4 เท่านั้น ดังนั้นงานที่มีสถานะ CLSD F2 จะมี Checkbox ปรากฏในตารางและสามารถเลือก Checkbox ได้อย่างถูกต้อง 4) สำหรับเกณฑ์วัดข้อ 4 กำหนดให้ยกเว้น CLSD F2 (ไม่มี Checkbox) 5) ซิงค์ฟังก์ชันการเลือกทั้งตาราง (Master Checkbox), การเลือกตามประเภทสถานะ SAP, และการสรุปผลการเลือกให้ทำงานสอดคล้องกัน 100%',
      sourceFile: 'คำสั่งผู้ใช้งาน (ให้ตรวจสอบ เลือกเกณวัดข้อ 1 2 3 5 เพิ่ม check box ถ้า CLSD F2 / หาก CLSD E2 ให้เอา check box ออกทั้งหมด)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงตรรกะเงื่อนไข Checkbox ตาราง WBS และระบบจำลองยอดปิดงาน)'
    },
    {
      id: 'log_000_wbs_remove_outcome_footer_and_enlarge_top_row_font',
      timestamp: '2026-10-17 23:55:00',
      timestampTh: '17 ต.ค. 2569, 23:55 น.',
      type: 'EDIT',
      typeBadge: 'ปรับแต่งการ์ดผลลัพธ์ขวา',
      badgeClass: 'badge-type-edit',
      title: 'นำแถบเปอร์เซ็นต์ผลดำเนินการด้านล่างออกตามที่วงกลม และเพิ่มขนาดตัวอักษรแถวบนให้ชัดเจนโดดเด่น',
      targetSubject: 'เมนู WBS คงเหลือ (#tab-wbs) - การ์ดผลลัพธ์สถานะขวามือ (.wbs-kpi-outcome-col)',
      storageFile: 'js/wbs.js, css/styles.css, js/data_history.js, index.html',
      changeSummary: '1) นำบล็อกแสดง "ผลดำเนินการ XXX%" และหลอด Mini Progress Bar ล่างสุดออกตามภาพที่ผู้ใช้วงกลมสีแดง 2) เพิ่มขนาดตัวอักษรของแถวบน (ไอคอน, สถานะเป้าหมาย, และป้ายเดือน) ให้ใหญ่และอ่านง่ายเด่นชัดยิ่งขึ้น พร้อมจัดกึ่งกลางแนวตั้งของการ์ดให้สมดุลสวยงาม',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: 1) ลบ .outcome-col-footer ใน js/wbs.js ซึ่งแสดง "ผลดำเนินการ XXX%" และหลอดความคืบหน้าออกตามที่วงกลมสีแดง 2) ปรับขนาดฟอนต์แถวบน (.outcome-status-title) จาก 0.88rem เป็น 1.05rem (font-weight: 900) ปรับไอคอน (.outcome-icon) จาก 1.15rem เป็น 1.35rem และปรับป้ายเดือน (.outcome-month-badge) จาก 0.72rem เป็น 0.82rem 3) ปรับขนาดป้ายกำกับ (.outcome-col-lbl) เป็น 0.92rem และตัวเลขหลัก (.outcome-col-val) เป็น 1.55rem 4) กำหนด flex: 1 ใน .outcome-col-body ทำให้เนื้อหาตรงกลางถูกจัดวางกึ่งกลางแนวตั้งอย่างสมส่วน สวยงามลงตัวระดับพรีเมียม',
      sourceFile: 'คำสั่งผู้ใช้งาน (เอาออก ที่วงกลม / และเพิ่มขนาดตัวอักษรแถวบน)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับแต่ง UI การ์ดแสดงผลลัพธ์ KPI)'
    },
    {
      id: 'log_000_wbs_fix_progress_pct_reference_error',
      timestamp: '2026-10-17 23:48:00',
      timestampTh: '17 ต.ค. 2569, 23:48 น.',
      type: 'EDIT',
      typeBadge: 'แก้ไขตัวแปรแสดงผล WBS',
      badgeClass: 'badge-type-edit',
      title: 'แก้ไขข้อผิดพลาดตัวแปร progressPct ในการ์ดคอลัมน์ขวา ทำให้ข้อมูล WBS กลับมาแสดงผลอย่างถูกต้องสมบูรณ์',
      targetSubject: 'เมนู WBS คงเหลือ (#tab-wbs) - ฟังก์ชัน renderWbsTargetComparisonSection',
      storageFile: 'js/wbs.js, js/data_history.js, index.html',
      changeSummary: 'แก้ไข ReferenceError ของตัวแปร progressPct ภายในหลอด Mini Progress Bar ของคอลัมน์ผลลัพธ์ขวามือ โดยกำหนดตัวแปรให้ตรงกับ pctAchievedNum พร้อมใส่ค่าป้องกัน fallback ทำให้กราฟ ตาราง และตัวเลข WBS ทั้งหมดกลับมาแสดงผลทันที',
      details: 'ตรวจสอบพบว่าหลังจากจัดวางเลย์เอาต์คอลัมน์ขวามือ ในส่วนของ outcome-col-footer มีการเรียกใช้ตัวแปร progressPct โดยที่สโคปเดิมใช้ชื่อ pctAchievedNum ส่งผลให้เกิด ReferenceError ระหว่างการประมวลผลฟังก์ชัน renderWbsTargetComparisonSection จึงได้ทำการ: 1) ประกาศ const progressPct = pctAchievedNum 2) ใส่การป้องกัน null/NaN ด้วย (progressPct || 0).toFixed(1) และ Math.min(100, Math.max(0, progressPct || 0)) 3) ทดสอบเรนเดอร์ข้อมูลจริงผ่าน Headless Browser ยืนยันว่าประมวลผลผ่าน 100% ข้อมูล WBS ทั้งหมดกลับมาแสดงผลครบถ้วน',
      sourceFile: 'คำสั่งผู้ใช้งาน (ข้อมูลหาย / แก้ไข)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง (แก้ไขบั๊กการแสดงผลข้อมูล WBS ทั้งระบบ)'
    },
    {
      id: 'log_000_wbs_kpi_move_banner_to_right_column_layout',
      timestamp: '2026-10-17 23:42:00',
      timestampTh: '17 ต.ค. 2569, 23:42 น.',
      type: 'EDIT',
      typeBadge: 'จัดเลย์เอาต์คอลัมน์ขวา',
      badgeClass: 'badge-type-edit',
      title: 'เปลี่ยนแถวสถานะล่างสุดเป็นคอลัมน์ชิดขวา (.wbs-kpi-outcome-col) วางประกบกราฟแท่ง 2 ชั้นอย่างสมส่วนและสวยงาม',
      targetSubject: 'เมนู WBS คงเหลือ (#tab-wbs) - การ์ดเปรียบเทียบเป้าหมาย KPI ระดับ 5 (.wbs-kpi-main-grid)',
      storageFile: 'js/wbs.js, css/styles.css, js/data_history.js, index.html',
      changeSummary: 'ยกเลิกแบนเนอร์แนวนอนล่างสุด (ที่ตีกรอบสีแดง) และปรับโครงสร้างเป็น Grid 2 คอลัมน์ โดยย้ายการ์ดผลลัพธ์และสรุปสถานะไปเป็นคอลัมน์แนวตั้งชิดขวา (ในกรอบสีน้ำเงิน) ประกบข้างกับกราฟแท่ง 2 ชั้นอย่างลงตัว ได้สัดส่วน และสวยงามระดับพรีเมียม',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: 1) สร้างคอนเทนเนอร์ .wbs-kpi-main-grid ใช้ flexbox จัดวางกราฟ 2 ชั้น (.wbs-kpi-bars-box) ทางซ้าย (flex: 1) ประกบคู่กับการ์ดสรุปผลลัพธ์ (.wbs-kpi-outcome-col) ทางขวามือ (ความกว้าง 260px) 2) ตกแต่งคอลัมน์ผลลัพธ์ด้วยดีไซน์พรีเมียม ประกอบด้วย: หัวการ์ดแสดงไอคอนสถานะ (⚠️ ยังต้องปิดเพิ่มอีก หรือ 🎉 บรรลุเป้าหมายแล้ว!) พร้อมป้ายเดือนเป้าหมาย, ส่วนกลางแสดงตัวเลขคงเหลือ/เกินเป้าหมายขนาดใหญ่เด่นชัด (สีแดงเรืองแสง #FF6B6B หรือสีเขียวเรืองแสง #00FF88) พร้อมตัวเลขล้านบาทกำกับ, และส่วนล่างแสดงหลอด Mini Progress Bar และเปอร์เซ็นต์ผลดำเนินการ 3) ปรับย่อข้อความตัวเลขบนหัวกราฟล่างให้กระชับโดยตัดคำว่า "บาท" ออก (฿XX,XXX,XXX.XX (XX.XX ลบ.)) เพื่อให้อยู่ในบรรทัดเดียวอย่างสวยงาม ไม่ตกบรรทัด 4) รองรับ Responsive Design ปรับเป็นแนวตั้งอัตโนมัติบนหน้าจอขนาดเล็กกว่า 992px',
      sourceFile: 'คำสั่งผู้ใช้งาน (เปลี่ยนแถวล่าง เส้นสีแดง ไปคอลัม ชิดขวา (สีสีนำ่เงิน)แทน อออกแบบให้ได้สัดส่วน สวยงาน)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงโครงสร้าง Layout และ UI กราฟเปรียบเทียบเป้าหมาย KPI)'
    },
    {
      id: 'log_000_wbs_kpi_remove_redundant_target_progress_cards_from_banner',
      timestamp: '2026-10-17 23:30:00',
      timestampTh: '17 ต.ค. 2569, 23:30 น.',
      type: 'EDIT',
      typeBadge: 'เอาการ์ดสรุปซ้ำซ้อนออก',
      badgeClass: 'badge-type-edit',
      title: 'นำการ์ดเป้าหมาย และการ์ดรวมดำเนินการ ออกจากแบนเนอร์สรุปผลตามที่วงกลม',
      targetSubject: 'เมนู WBS คงเหลือ (#tab-wbs) - แบนเนอร์สรุปผลลัพธ์การเปรียบเทียบ KPI 5 (.wbs-kpi-status-banner)',
      storageFile: 'js/wbs.js, js/data_history.js, index.html',
      changeSummary: 'นำการ์ด "เป้าหมาย (เดือน)" และการ์ด "รวมดำเนินการ (SAP + เลือก)" ออกจากแบนเนอร์สรุปผลลัพธ์ล่างสุดตามตำแหน่งที่ผู้ใช้วงกลมสีแดง เนื่องจากตัวเลขทั้งสองชุดมีแสดงชัดเจนอยู่บนหัวกราฟแท่งทั้งสองชั้นแล้ว ทำให้แบนเนอร์กระชับและคงเหลือเฉพาะการ์ดผลลัพธ์สำคัญ (เกินเป้าหมาย หรือ คงเหลือต้องปิดเพิ่ม)',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: ตัดการ์ดสรุปสองใบใน .status-banner-metrics ออก ได้แก่ 1) การ์ดเป้าหมาย (${selectedMonth.shortName}) 2) การ์ดรวมดำเนินการ (SAP + เลือก) คงเหลือเฉพาะการ์ดสถานะผลลัพธ์สุทธิ (.status-metric-card.card-success / card-warn) ซึ่งระบุยอดเกินเป้าหมาย (+) หรือยอดคงเหลือต้องปิดเพิ่ม ทำให้แถบแบนเนอร์สรุปดูโปร่งตา สวยงาม และไม่ซ้ำซ้อนกับตัวเลขที่แสดงบนหัวกราฟด้านบน',
      sourceFile: 'คำสั่งผู้ใช้งาน (วงกลมเอาออก)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับแต่ง UI แบนเนอร์สรุปผล KPI)',
    },
    {
      id: 'log_000_wbs_kpi_add_clsd_f4_f2_green_and_remove_small_clear_btn',
      timestamp: '2026-10-17 23:25:00',
      timestampTh: '17 ต.ค. 2569, 23:25 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มยอด CLSD F4/F2 และลบปุ่มกากบาท',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มการแสดงมูลค่า/งาน CLSD F4/F2 สีเขียว และลบปุ่มล้างข้อมูลเล็กที่กากบาทออกตามคำสั่ง',
      targetSubject: 'เมนู WBS คงเหลือ (#tab-wbs) - หัวกราฟล่างแสดงยอดดำเนินการ (#wbsTargetComparisonCard)',
      storageFile: 'js/wbs.js, css/styles.css, js/data_history.js, index.html',
      changeSummary: '1) ลบปุ่มล้างข้อมูลขนาดเล็กในส่วนหัวกราฟล่าง (ตำแหน่งที่กากบาท) ออก โดยคงปุ่มล้างข้อมูลสีแดงหลักไว้บนสุดขวามือของการ์ด 2) เพิ่มการแสดงตัวเลขมูลค่า/จำนวนงานของสถานะปิดงานใน SAP (CLSD F4 หรือ CLSD F2) ด้วยตัวเลขสีเขียวสดใส เพื่อให้เห็นตัวเลขครบทุกองค์ประกอบก่อนรวมเป็นยอดรวมทำได้',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: 1) นำปุ่มล้างข้อมูลขนาดเล็ก (.btn-wbs-kpi-clear) ที่อยู่ข้างตัวเลขส่วนที่เลือกออกตามตำแหน่งที่ผู้ใช้กากบาทสีแดงในภาพ 2) เพิ่มบล็อกแสดงข้อมูล CLSD F4: หรือ CLSD F2: (.stat-sap) ในตำแหน่งที่ผู้ใช้วงกลมสีแดง แสดงตัวเลขมูลค่าหรือจำนวนงาน (.sap-text) ด้วยสีเขียว #34D399 พร้อมเงาเรืองแสง text-shadow ให้สอดคล้องกับธีม ทำให้โครงสร้างตัวเลขบนแถบหัวกราฟล่างแสดงครบ 3 ส่วนสมบูรณ์แบบ ได้แก่ [CLSD F4/F2 (สีเขียว)] | [ส่วนที่เลือก (สีฟ้า)] | [รวมทำได้ (สีเขียวอร่ามเรืองแสง)]',
      sourceFile: 'คำสั่งผู้ใช้งาน (กากบาท เอาออก และวงกลมให้เพิ่ม มูลค่า/งาน CLSD F4 /F2 สีเขียว)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับแต่งการแสดงผลตัวเลขบนหัวกราฟ WBS)'
    },
    {
      id: 'log_000_wbs_kpi_golden_border_cyan_selected_green_total_red_clear_btn',
      timestamp: '2026-10-17 23:15:00',
      timestampTh: '17 ต.ค. 2569, 23:15 น.',
      type: 'EDIT',
      typeBadge: 'ปรับแต่งปุ่มเลือกเดือนและตัวเลข KPI',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มเส้นขอบสีเหลืองอร่ามของปุ่มเลือกเดือน, แสดงตัวเลขส่วนที่เลือกเป็นสีฟ้าและตัวเลขรวมเป็นสีเขียวอร่ามเรืองแสง, พร้อมเพิ่มปุ่มล้างข้อมูลสีแดงบนสุดขวามือของการ์ด',
      targetSubject: 'เมนู WBS คงเหลือ (#tab-wbs) - การ์ดเปรียบเทียบเป้าหมาย KPI ระดับ 5 (#wbsTargetComparisonCard)',
      storageFile: 'js/wbs.js, css/styles.css, js/data_history.js, index.html',
      changeSummary: '1) แสดงเส้นขอบสีเหลืองอร่ามเรืองแสงรอบปุ่มเลือกเดือนทรงลูกศร (Chevron) ทั้งขณะชี้เมาส์ (:hover) และขณะเลือก (.active) 2) แสดงตัวเลขส่วนที่เลือก (ส่วนที่เลือกจาก Checkbox) ในรูปแบบสีฟ้าครามสดใสเรืองแสง (.selected-text) 3) ปรับตัวเลขรวม (รวมทำได้) ให้แสดงเป็นสีเขียวอร่ามเรืองแสงโดดเด่น (.progress-text) 4) เพิ่มปุ่มล้างข้อมูลสีแดงเด่นชัด (.btn-wbs-card-clear) ไว้บนการ์ดด้านบนสุดขวามือ เพื่อให้ผู้ใช้สามารถกดล้างการเลือก Checkbox ได้สะดวกรวดเร็วในคลิกเดียว',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: 1) ปรับโครงสร้าง CSS ซ้อนเลเยอร์ (Double Chevron Architecture) ให้ปุ่มนอก (.btn-wbs-kpi-month) มี clip-path polygon พร้อม padding 2.5px และพื้นหลังเป็น gradient สีเหลืองทองอร่าม (#FFF700, #FFD700, #FFA000) ร่วมกับ drop-shadow สีเหลืองทองเรืองแสง (filter: drop-shadow 10px-14px) เมื่อนำเมาส์ไปชี้ (:hover) และเมื่อถูกเลือก (.active) ทำให้เส้นขอบสีเหลืองทองวิ่งตามแนวขอบทรงลูกศรอย่างคมกริบ 2) ในส่วนหัวกราฟล่าง ปรับให้แสดงตัวเลข "ส่วนที่เลือก:" ใช้สีฟ้าสดใสเรืองแสง (#00E5FF พร้อม text-shadow สีฟ้า) และตัวเลข "รวมทำได้:" ใช้สีเขียวอร่ามเรืองแสง (#00FF88 พร้อม text-shadow เขียวนีออน) พร้อมปุ่มล้างข้อมูลกะทัดรัด 3) เพิ่มปุ่ม "ล้างข้อมูล" สีแดงสด (.btn-wbs-card-clear) ที่มุมบนสุดขวามือของการ์ด (ใน .wbs-kpi-comp-meta-info) แสดงไอคอนถังขยะและจำนวนรายการที่เลือกสีแดงเด่นชัด สั่งล้างข้อมูลรายการที่เลือกทั้งหมด (wbsState.selectedWbs.clear()) และอัปเดตกราฟแบบ Real-time ทันที',
      sourceFile: 'คำสั่งผู้ใช้งาน (ขณะลากเมาส์ไปชี้ และตอนเลือก ให้แสดงเส้นขอบสีเหลืองอร่ามของปุ่มด้วย / ตัวเลขให้แสดง ส่วนที่เลือกด้วย ใช้สีฟ้า และตัวเลขรวมใช้สีเขียวอร่ามเรืองแสง / เพิ่มปุ่มล้างข้อมูล / เพิ่มปุ่มล้างข้อมูล ไว้บนการ์ด บนสุดขวามือ สีแดง)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุง UI กราฟ KPI จำลองเป้าหมาย และเพิ่มปุ่มคำสั่งล้างข้อมูลบนการ์ด)'
    },
    {
      id: 'log_000_wbs_chevron_buttons_and_golden_marker_style_and_remove_pct',
      timestamp: '2026-10-17 22:48:00',
      timestampTh: '17 ต.ค. 2569, 22:48 น.',
      type: 'EDIT',
      typeBadge: 'ปรับปุ่มเลือกเดือนลูกศรและเส้นเป้าหมาย',
      badgeClass: 'badge-type-edit',
      title: 'ปรับปุ่มเลือกเดือนเป็นแถบลูกศรตามรูป 31, ปรับเส้นเป้าหมายตามรูป 32 ทุกอัน, และเอาป้าย % ออก',
      targetSubject: 'เมนู WBS คงเหลือ (#tab-wbs) - ปุ่มเลือกเดือนเป้าหมาย, เส้นบอกระดับเป้าหมาย, และหัวแถบดำเนินการ',
      storageFile: 'js/wbs.js, css/styles.css, index.html',
      changeSummary: '1) เปลี่ยนปุ่มเลือกเดือนจากแบบเดิม (รูป 30) เป็นแถบลูกศรต่อเนื่อง (Chevron Segmented Arrow Track ตามรูป 31) โทนสีสดใสเฉพาะแต่ละเดือน พร้อมเอฟเฟกต์สีเด่นชัดเมื่อชี้เมาส์และเมื่อเลือก 2) ปรับเส้นเป้าหมายเป็นเสาสีทองนีออนเปล่งประกายปลายมนสีขาวเรืองแสงและป้าย ▲ เส้นเป้าหมาย ตามรูป 32 ให้เหมือนกันทุกอัน 3) เอาป้ายเปอร์เซ็นต์ (117.2%) ออกตามคำสั่ง',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: 1) ปรับปรุงปุ่มเลือกเดือนเป้าหมาย (.btn-wbs-kpi-month) ให้เป็นรูปทรงลูกศรต่อเนื่อง (clip-path polygon chevron) 4 ช่วงเดือนตามสไตล์รูป 31 (ก.ย. สีส้มทอง seg-1, ต.ค. สีเขียวมรกต seg-2, พ.ย. สีฟ้าคราม seg-3, ธ.ค. สีม่วง seg-4) เพิ่มเอฟเฟกต์ขณะชี้เมาส์ (:hover) ให้สีสว่างสดใสเด่นชัดขึ้นมา และขณะเลือก (.active) มีกรอบขาวสว่างเรืองแสงรอบปุ่ม 2) ปรับปรุงเส้นเป้าหมาย (.target-marker-line) ให้แสดงเป็นเสาสีทองเรืองแสงหัวมนสีขาว (linear-gradient #FFFFFF, #FFF566, #FFB81C, #F59E0B) หนา 6px พร้อมเอฟเฟกต์เรืองแสง 22px และป้าย ▲ เส้นเป้าหมาย ตามรูป 32 ครบทุกเดือน (ทั้งบรรลุแล้วและยังไม่บรรลุ) 3) ลบป้ายเปอร์เซ็นต์ (.bar-pct-badge) 117.2% ที่ส่วนหัวกราฟล่างออกตามรูปที่ส่งมา',
      sourceFile: 'คำสั่งผู้ใช้งาน (1.เปลี่ยนปุ่มรูป 30 เป็นแบบรูปที่ 31 และขณะลากเม้าไปสีเด่นชัดชึ้นมา และตอนเลือกด้วย / 2.เส้นชัย ให้เปลี่ยนเป็นตามรูป 32 ทุกอัน / เอาออก [ป้าย 117.2%])',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงโครงสร้าง UI ปุ่มเลือกเดือน แถบลูกศร และเส้นเป้าหมายตามแบบอ้างอิง)'
    },
    {
      id: 'log_000_wbs_passed_target_as_finish_line_checkered',
      timestamp: '2026-10-17 22:38:00',
      timestampTh: '17 ต.ค. 2569, 22:38 น.',
      type: 'EDIT',
      typeBadge: 'เปลี่ยนเฉพาะเส้นเขียวเป็นลายเส้นชัย',
      badgeClass: 'badge-type-edit',
      title: 'เปลี่ยนเฉพาะเส้นเป้าหมายกรณีบรรลุเป้า (ที่เคยเป็นสีเขียว) ให้แสดงเป็นลายเสาเส้นชัยแทน',
      targetSubject: 'เมนู WBS คงเหลือ (#tab-wbs) - กราฟเปรียบเทียบการปิดงานตามเป้าหมายระดับ KPI 5',
      storageFile: 'js/wbs.js, css/styles.css, index.html',
      changeSummary: 'คงเส้นเป้าหมายสีทองนีออนเดิมไว้สำหรับเดือนที่ยังไม่บรรลุเป้าหมาย แต่เปลี่ยนเฉพาะเส้นเป้าหมายกรณีบรรลุเป้าหมายแล้ว (ที่เคยเป็นสีเขียว) ให้แสดงเป็นลายเสาตารางหมากรุกเส้นชัย (Finish Line 🏁) ขอบทองเรืองแสง และป้าย 🏁 เส้นชัย อย่างลงตัว',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: 1) ปรับปรุงสไตล์ของเส้นเป้าหมายเมื่อบรรลุเป้า (target-marker-line.is-passed) จากเดิมที่เป็นสีเขียว ให้เปลี่ยนเป็นลายเสาตารางหมากรุกขาว-ดำของเส้นชัย (repeating-linear-gradient) ความหนา 7px พร้อมขอบสีทองเรืองแสง 2) ปรับข้อความป้ายกำกับของเส้นเป็น "🏁 เส้นชัย (XX.XX ลบ.)" พร้อมกรอบสีทองนีออน 3) ส่วนเดือนที่ยังไม่ถึงเป้าหมายยังคงแสดงเป็นเส้นทองหนา 6px ▲ เส้นเป้าหมาย ตามดีไซน์เดิม',
      sourceFile: 'คำสั่งผู้ใช้งาน (เปลี่ยนเฉพาะสีเขียวเป็นสีเส้นชัยแทน)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับปรุง UI กราฟเปรียบเทียบเป้าหมาย KPI)'
    },
    {
      id: 'log_000_wbs_revert_finish_line_prominent_target_marker',
      timestamp: '2026-10-17 22:33:00',
      timestampTh: '17 ต.ค. 2569, 22:33 น.',
      type: 'EDIT',
      typeBadge: 'ปรับขนาดเส้นเป้าหมายเดิมให้เด่นชัด',
      badgeClass: 'badge-type-edit',
      title: 'ยกเลิกเส้นชัย หันกลับมาใช้เส้นเป้าหมายแบบเดิม พร้อมเพิ่มขนาดเส้นให้หนาใหญ่ขึ้นและส่องสว่างเด่นชัด',
      targetSubject: 'เมนู WBS คงเหลือ (#tab-wbs) - กราฟเปรียบเทียบการปิดงานตามเป้าหมายระดับ KPI 5',
      storageFile: 'js/wbs.js, css/styles.css, index.html',
      changeSummary: 'ยกเลิกดีไซน์เส้นชัย (ธงและเสาหมากรุก) กลับมาใช้เส้นเป้าหมายแบบเดิม พร้อมขยายความหนาของเส้นเป็น 5px สีทองนีออนเปล่งประกายเรืองแสงโดดเด่นสะดุดตา และคงป้ายกำกับเดิม ▲ เส้นเป้าหมาย',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: 1) ยกเลิกองค์ประกอบเส้นชัย (Finish Line 🏁) ทั้งเสาหมากรุกและธงลอย 2) นำเส้นเป้าหมาย (target-marker-line) และป้ายเดิม (target-marker-label: ▲ เส้นเป้าหมาย (XX.XX ลบ.)) กลับมาใช้งาน 3) ขยายความหนาของเส้นเป้าหมายจากเดิม ~2px เพิ่มเป็น 5px พร้อมไล่เฉดสีทองสว่าง (gradient #FFFFFF ถึง #FFD700 และ #F59E0B) ขอบสีขาวสะท้อนแสง และใส่เอฟเฟกต์เรืองแสง (box-shadow neon glow) สูงถึง 20px ให้มองเห็นชัดเจนสะดุดตา 4) ป้ายกำกับวางชิดด้านข้างเส้นอย่างเป็นระเบียบตามตำแหน่งเปอร์เซ็นต์ของเป้าหมาย',
      sourceFile: 'คำสั่งผู้ใช้งาน (undo เส้นชัย ใช้แบบเดิม เพิ่มขนาดเส้นให้ใหญ่ขึ้น เด่นชัด)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับปรุง UI/UX ความชัดเจนของเส้นเป้าหมายตามความต้องการ)'
    },
    {
      id: 'log_000_wbs_finish_line_and_month_style',
      timestamp: '2026-10-17 22:25:00',
      timestampTh: '17 ต.ค. 2569, 22:25 น.',
      type: 'EDIT',
      typeBadge: 'ปรับเส้นชัยและปุ่มเลือกเดือน',
      badgeClass: 'badge-type-edit',
      title: 'ปรับเส้นเป้าหมายเป็นเส้นชัย (Finish Line 🏁) โดดเด่นชัดเจน และปรับพื้นหลังปุ่มเลือกเดือนตามป้ายหน่วยวัด',
      targetSubject: 'เมนู WBS คงเหลือ (#tab-wbs) - การ์ดเปรียบเทียบเป้าหมาย KPI ระดับ 5',
      storageFile: 'js/wbs.js, css/styles.css, index.html',
      changeSummary: 'ลบข้อความอธิบายใต้หัวข้อออกตามที่กากบาท, ปรับสีพื้นหลังปุ่มเลือกเดือนเป้าหมายเป็นโทนสีม่วงเหมือนป้ายหน่วยวัดมูลค่า, และเปลี่ยนเส้นเป้าหมายบนหลอดกราฟเป็นเสาเส้นชัยลายธงหมากรุกขาว-ดำขอบทองเรืองแสงพร้อมธงลอยเด่น 🏁 เส้นชัยเป้าหมาย',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: 1) เอาข้อความอธิบาย (wbs-kpi-comp-subtitle) ออกตามตำแหน่งที่กากบาท 2) ปรับสีพื้นหลังและขอบของปุ่มเลือกเดือน (.btn-wbs-kpi-month) ให้เป็นสีม่วง rgba(168, 85, 247, 0.2) ขอบ rgba(168, 85, 247, 0.45) ตรงตามสไตล์ป้ายหน่วยวัด [💰 มูลค่า (บาท)] ที่ชี้ลูกศร 3) ปรับปรุงเส้นเป้าหมายบนกราฟแท่งล่างให้โดดเด่น โดยเปลี่ยนเป็นเส้นชัยเป้าหมาย (target-finish-line): เสาหมากรุกขาว-ดำขอบทองเรืองแสง (finish-line-pole) พร้อมธงเส้นชัยลอยตัว (finish-line-flag) แสดงป้าย "🏁 เส้นชัย (XX.XX ลบ.)" อย่างเด่นชัด พร้อมแอนิเมชันลอยตัวเบาๆ และเปลี่ยนเป็นสีเขียวมรกตเมื่อผ่านเส้นชัยแล้ว',
      sourceFile: 'คำสั่งผู้ใช้งาน (เอาออกที่กากบาท และวงกลมปุ่มเลือกเดือนให้เปลี่ยนสีพื้นหลังเหมือนกับที่ชี้ลูกศร / แก้ไขให้โดดเด่น หรือใช้เส้นชัยแทนก้ได้)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับปรุง UI/UX ความโดดเด่นและความสวยงาม)'
    },
    {
      id: 'log_000_target_projection_add_december',
      timestamp: '2026-10-17 22:10:00',
      timestampTh: '17 ต.ค. 2569, 22:10 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มเป้าหมายเดือน ธ.ค. รวม 4 เดือน',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มการแสดงเป้าหมายที่ต้องปิดงานเพิ่มเดือน ธ.ค. รวม 4 เดือน ทั้งเมนูภาพรวมและ WBS คงเหลือ',
      targetSubject: 'เมนูภาพรวมผู้บริหาร (แผนเป้าหมายปิดงานเพิ่ม) และ เมนู WBS คงเหลือ (กราฟเปรียบเทียบ KPI 5)',
      storageFile: 'js/app.js, css/styles.css, index.html',
      changeSummary: 'ขยายช่วงการคำนวณและแสดงผลเป้าหมายที่ต้องปิดงานเพิ่มระดับ KPI 5 ให้ครอบคลุมถึงเดือน ธ.ค. 2569 รวมทั้งสิ้น 4 เดือน (ก.ย., ต.ค., พ.ย., ธ.ค.) ทั้งในเมนูภาพรวมผู้บริหารและเมนู WBS คงเหลือ',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: 1) ปรับ maxOffsets ใน renderNext3MonthsProjection เป็น 4 เพื่อให้คำนวณเป้าหมายระดับ 5 ครอบคลุมถึงสิ้นปี 2569 (ธ.ค. 69 เป้า KPI 100%) 2) เมนูภาพรวม: แสดงการ์ดเป้าหมาย 4 เดือนในกริด 4 คอลัมน์, แสดงตารางเป้าหมายและแถบรวมสัดส่วน 4 ช่วงเดือน 3) เมนู WBS คงเหลือ: แถบเลือกเดือนเป้าหมายแสดงครบ 4 เดือน (ก.ย. บรรลุเป้า, ต.ค., พ.ย., ธ.ค.) สามารถคลิกเลือกเดือน ธ.ค. เพื่อเปรียบเทียบกับยอด SAP + รายการที่เลือกแบบ Real-time',
      sourceFile: 'คำสั่งผู้ใช้งาน (เป้าหมายที่ต้องปิดเพิ่ม ให้เพิ่มเดือน ธ.ค. ด้วย รวม 4 เดือน ทั้งเมนูภาพรวม และเมนู WBS คงเหลือ)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ขยายขอบเขตช่วงเวลาการจำลองเป้าหมาย KPI)'
    },
    {
      id: 'log_000_wbs_kpi5_target_comparison_bars',
      timestamp: '2026-10-17 21:40:00',
      timestampTh: '17 ต.ค. 2569, 21:40 น.',
      type: 'EDIT',
      typeBadge: 'กราฟเปรียบเทียบเป้าหมาย KPI 5',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มการแสดงกราฟแนวนอน 2 ชั้น เปรียบเทียบเป้าหมาย KPI ระดับ 5 ในเมนู WBS คงเหลือ',
      targetSubject: 'เมนู WBS คงเหลือ (#tab-wbs) - ส่วนเปรียบเทียบเป้าหมาย KPI 5 และการปิดงาน',
      storageFile: 'js/wbs.js, js/app.js, css/styles.css, index.html',
      changeSummary: 'เพิ่มกราฟแนวนอน 2 ชั้นเปรียบเทียบเป้าหมาย KPI ระดับ 5 (กราฟบน: ยอดต้องปิดเพิ่มตามเดือนที่เลือก) กับยอดดำเนินการ (กราฟล่าง: CLSD F4/F2 + รายการที่เลือกจาก Checkbox) พร้อมปุ่มเลือกเดือนเป้าหมาย (หากบรรลุเป้าหมายแสดง ✓ บรรลุเป้า แต่เลือกไม่ได้) และแบนเนอร์แสดงยอดที่ต้องปิดเพิ่มหรือเกินเป้าหมาย',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: 1) กราฟบนแสดงเป้าหมายมูลค่า/งานที่ต้องปิดเพิ่มระดับ KPI 5 ตามเกณฑ์วัดที่เลือกและเดือนที่เลือก (ดึงข้อมูลจำลอง 3 เดือนถัดไปผ่าน window.getKpiSimulationTargetMonths) 2) กราฟล่างแสดงยอดสะสมปิดงาน CLSD F4 สำหรับเกณฑ์ข้อ 1, 2, 5 (มูลค่า AUC) หรือ เกณฑ์ข้อ 3 (จำนวนงาน) หรือ CLSD F2 สำหรับเกณฑ์ข้อ 4 (จำนวนงาน) รวมกับยอดจาก Checkbox ตาราง WBS แบบ Real-time 3) คำนวณส่วนต่าง แสดงป้ายสถานะบรรลุเป้าหมาย/ยังต้องปิดเพิ่ม พร้อมยอดคงเหลือหรือยอดเกินเป้าหมาย 4) แถบปุ่มเลือกเดือนเป้าหมาย (ก.ย., ต.ค., พ.ย.) หากเดือนไหนบรรลุเป้าหมายแล้วจะแสดงป้าย ✓ บรรลุเป้า และปิดการคลิกเลือก (disabled) 5) ออกแบบสไตล์ Luxury Dark/Light Theme มีเอฟเฟกต์แอนิเมชัน และรองรับ Responsive',
      sourceFile: 'คำสั่งผู้ใช้งาน (ในเมนู WBS คงเหลือ ให้เพิ่มการแสดง การปิดมูลค่า/งาน ที่ต้องทำเพิ่ม ให้ได้ตามเป้าหมายระดับ KPI 5)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง (เพิ่มฟีเจอร์การวิเคราะห์เป้าหมายเชิงเปรียบเทียบใน WBS)'
    },
    {
      id: 'log_000_criteria_font_color_match',
      timestamp: '2026-10-17 21:10:00',
      timestampTh: '17 ต.ค. 2569, 21:10 น.',
      type: 'EDIT',
      typeBadge: 'ปรับฟอนต์และสีตัวกรองเกณฑ์วัด',
      badgeClass: 'badge-type-edit',
      title: 'ปรับตัวอักษรและสีของตัวกรองเกณฑ์วัดให้เหมือนกับตัวกรองอื่นๆ',
      targetSubject: 'รายการตัวเลือกเกณฑ์วัด (dropdown แถบตัวกรองด้านบน)',
      storageFile: 'css/styles.css, index.html',
      changeSummary: 'ปรับขนาดตัวอักษร (0.94rem) น้ำหนักตัวอักษร (500) และโทนสี (#FFB81C ใน Dark Mode, #111827 ใน Light Mode) ของรายการตัวเลือกเกณฑ์วัดให้เท่ากันและตรงตามรายการตัวเลือกของตัวกรองอื่นๆ ทุกประการ',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: กำหนด .crit-dd-option และ .crit-dd-name ให้ใช้ font-family: inherit, font-size: 0.94rem, font-weight: 500, color: #FFB81C ในธีมมืด และ color: #111827 ในธีมสว่าง สำหรับทั้งสถานะปกติและสถานะที่ถูกเลือก (.selected) โดยยังคงป้ายหน่วยวัด (มูลค่า/งาน) ชิดขวาและไฮไลต์เมื่อ hover/focus ตามเดิม พร้อม bump เวอร์ชันแคช',
      sourceFile: 'คำสั่งผู้ใช้งาน (ใช้ตัวอักษร และสี เหมือนกับตัวกรองอื่นๆ)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับแต่ง UI/Typography)'
    },
    {
      id: 'log_000_criteria_option_hover_highlight',
      timestamp: '2026-10-17 21:05:00',
      timestampTh: '17 ต.ค. 2569, 21:05 น.',
      type: 'EDIT',
      typeBadge: 'สีไฮไลต์ตัวเลือกเกณฑ์วัด',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มสีไฮไลต์ตอนเลื่อนชี้ตัวเลือกเกณฑ์วัดให้เหมือนตัวกรองอื่นๆ',
      targetSubject: 'รายการตัวเลือกเกณฑ์วัด (dropdown แถบตัวกรองด้านบน)',
      storageFile: 'css/styles.css, index.html',
      changeSummary: 'ตอนเลื่อนเมาส์ชี้หรือใช้คีย์บอร์ดเลือกแถวข้อ 1.1 - 5 จะมีพื้นหลังสีไฮไลต์ (Highlight system color / #1E90FF) และตัวอักษรเปลี่ยนเป็นสีขาว เหมือนรายการตัวเลือก native ของตัวกรองอื่นๆ',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: ปรับ .crit-dd-option:hover และ .crit-dd-option.focused ให้มี background-color: Highlight (#1E90FF) พร้อม color: HighlightText (#FFFFFF) ทั้งใน Dark Mode และ Light Mode เมื่อไม่ได้ชี้หรือเลือกคงสีทอง #FFB81C โดยไม่มีเงาพื้นหลัง และ bump เวอร์ชันแคช css',
      sourceFile: 'คำสั่งผู้ใช้งาน (อยากให้แก้ตัวกรองเกฯวัด ให้ตอนชี้มีสีไฮไลต์เหมือนตัวกรองอื่น)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับแต่ง UI/UX การชี้เลือกตัวกรอง)'
    },
    {
      id: 'log_000_chart_xlabel_click',
      timestamp: '2026-10-17 21:00:00',
      timestampTh: '17 ต.ค. 2569, 21:00 น.',
      type: 'EDIT',
      typeBadge: 'คลิกชื่อหน่วยงานบนกราฟ',
      badgeClass: 'badge-type-edit',
      title: 'คลิกชื่อหน่วยงานบนแกน X ของกราฟแท่งเพื่อเลือกหน่วยงานได้ เหมือนคลิกที่แท่งกราฟ',
      targetSubject: 'กราฟผลการดำเนินงาน % ปิดงานราย กฟฟ. (PeaChart แบบ bar)',
      storageFile: 'js/chart.js, index.html',
      changeSummary: 'ชื่อหน่วยงานที่หมุนเอียงใต้กราฟคลิกได้ เมาส์เปลี่ยนเป็นรูปมือเมื่อชี้ที่ชื่อ และเรียก onClick เดียวกับการคลิกแท่ง (เลือก/ยกเลิกหน่วยงาน, คลิกกฟก.3 ทั้งหมด = ALL)',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: ใน renderBarChart เก็บพิกัด/มุม/ความกว้างข้อความของป้ายแกน X ลง this.renderedXLabels แล้ว hit-test ตำแหน่งเมาส์ด้วยการหมุนพิกัดย้อนตามมุมป้าย (เลือกป้ายที่ใกล้สุดเมื่อซ้อนกัน) ได้ this.lastHoveredLabelItem ที่มีรูปแบบเดียวกับ item ของแท่ง (label, gIdx, extra) ตัวจัดการ click ใช้ lastHoveredItem || lastHoveredLabelItem และปรับ cursor เป็น pointer บนป้ายชื่อ ไม่กระทบการแสดงผล/เส้นเป้าหมาย และ bump เวอร์ชันแคช chart.js',
      sourceFile: 'คำสั่งผู้ใช้งาน (คลิกตัวอักษรหน่วยงาน สามารถเปลี่ยนตามที่เลือกได้ เหมือนกับคลิกที่กราฟ)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (เพิ่มการโต้ตอบบนกราฟ)'
    },
    {
      id: 'log_000_criteria_panel_bg_match',
      timestamp: '2026-10-17 20:55:00',
      timestampTh: '17 ต.ค. 2569, 20:55 น.',
      type: 'EDIT',
      typeBadge: 'ปรับพื้นหลังรายการเกณฑ์วัด',
      badgeClass: 'badge-type-edit',
      title: 'ให้รายการตัวเลือกเกณฑ์วัดมีพื้นหลังเหมือนรายการของตัวกรองอื่นๆ',
      targetSubject: 'รายการตัวเลือกเกณฑ์วัด (dropdown แถบตัวกรองด้านบน)',
      storageFile: 'css/styles.css, index.html',
      changeSummary: 'เปลี่ยนพื้นหลังรายการจากไล่สีม่วงเข้ม+กรอบทอง+เงาเรืองแสง เป็นสีทึบ #2D0A45 เท่ากับ option ของตัวกรองเดือน/พื้นที่/กอง (ธีมสว่างเป็นสีขาว)',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: แก้ .crit-dd-panel ใช้ background ทึบ #2D0A45 กรอบบางโปร่งแสง มุมโค้งน้อย เงาเบา ไม่มีแอนิเมชันเปิด และปรับ padding ของแถวเป็น 6px 12px ให้เท่ากับ .top-filter-select option พร้อมปรับธีมสว่าง และ bump เวอร์ชันแคช css',
      sourceFile: 'คำสั่งผู้ใช้งาน (แก้ไขตอนเลื่อนเพื่อเลือก ให้พื้นหลังเหมือนกับตัวกรองอื่นๆ)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับสี UI)'
    },
    {
      id: 'log_000_criteria_option_gold_no_highlight',
      timestamp: '2026-10-17 20:50:00',
      timestampTh: '17 ต.ค. 2569, 20:50 น.',
      type: 'EDIT',
      typeBadge: 'ปรับสีตัวเลือกเกณฑ์วัด',
      badgeClass: 'badge-type-edit',
      title: 'ตัวเลือกเกณฑ์วัดข้อ 1.1 - 5 กลับเป็นสีทอง และเอาพื้นหลัง/เงาตอนชี้-เลือกออก',
      targetSubject: 'รายการตัวเลือกเกณฑ์วัด (dropdown แถบตัวกรองด้านบน)',
      storageFile: 'css/styles.css, index.html',
      changeSummary: 'ข้อความตัวเลือกทุกข้อเป็นสีทอง #FFB81C เหมือนเดิม ตอนชี้/เลือกไม่มีพื้นหลังหรือเงา (inset shadow) เหลือเพียงทองสว่างขึ้นและตัวหนา',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: แก้ .crit-dd-option เป็นสีทอง ปรับ .focused/.selected เป็น background:none, box-shadow:none พร้อมปรับธีมสว่างให้สอดคล้อง และ bump เวอร์ชันแคช css',
      sourceFile: 'คำสั่งผู้ใช้งาน (ตัวเลือกเปลี่ยนสีทองเหมือนเดิม ข้อ 1.1 - 5 และตอนเลือกไม่ต้องมีเงาพื้นหลัง)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับสี UI)'
    },
    {
      id: 'log_000_criteria_dropdown_unit_right',
      timestamp: '2026-10-17 20:45:00',
      timestampTh: '17 ต.ค. 2569, 20:45 น.',
      type: 'EDIT',
      typeBadge: 'ปรับตัวเลือกเกณฑ์วัด',
      badgeClass: 'badge-type-edit',
      title: 'เอาป้ายหน่วยวัดแคปซูลออก และแสดงหน่วย มูลค่า/งาน ชิดขวาในทุกตัวเลือกเกณฑ์วัด พร้อมสีพื้นหลังโดดเด่น',
      targetSubject: 'ตัวกรองเกณฑ์วัด ข้อ 1.1 - 5 (แถบตัวกรองด้านบน)',
      storageFile: 'index.html, css/styles.css, js/app.js, js/criteria_dropdown.js',
      changeSummary: 'ลบป้าย "หน่วยวัด [มูลค่า]/[งาน]" ด้านขวาของช่องเลือก และเปลี่ยนรายการตัวเลือกเป็น dropdown แบบกำหนดเองที่วางหน่วยชิดขวาสุดทุกแถว: มูลค่า = ทอง, งาน = ฟ้าคราม, มูลค่า/งาน (เลือกทั้งหมด) = ชมพู-ม่วง',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: (1) ลบ #criteriaUnitBadge ใน index.html, CSS .criteria-unit-badge และฟังก์ชัน updateCriteriaUnitBadge ใน app.js (2) populateFilterDropdowns ใส่ data-unit (value|job|all) ให้ option และใช้ชื่อเกณฑ์เดิมไม่ต่อท้ายหน่วย (3) เพิ่ม js/criteria_dropdown.js สร้าง UI dropdown (ปุ่ม + panel แบบ fixed ไม่ถูกตัดโดยแถบตัวกรอง) ซ่อน select#filterCriteria ไว้เป็นแหล่งข้อมูลหลัก ซิงก์ value/options ด้วย MutationObserver และ setter ของ value และยิง change event เมื่อเลือก จึงไม่กระทบการกรอง รองรับคีย์บอร์ด ธีมสว่าง (4) เพิ่มสไตล์ .crit-dd-* และ .crit-unit-pill ใน styles.css (5) bump เวอร์ชันแคช css/app.js',
      sourceFile: 'คำสั่งผู้ใช้งาน (1.ให้เอาออก 2.หน่วยวัดที่แสดงในตัวเลือกให้ชิดด้านหลังสุดทุกอัน(ชิดขวา) และเปลี่ยนสีโดดเด่น เปลี่ยนเฉพาะพื้นหลัง มูลค่า/งาน)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (เปลี่ยนรูปแบบ UI ตัวกรองเกณฑ์วัด)'
    },
    {
      id: 'log_000_criteria_option_unit_suffix',
      timestamp: '2026-10-17 20:40:00',
      timestampTh: '17 ต.ค. 2569, 20:40 น.',
      type: 'EDIT',
      typeBadge: 'แสดงหน่วยวัดในตัวเลือกเกณฑ์',
      badgeClass: 'badge-type-edit',
      title: 'แสดงหน่วยการวัด (มูลค่า/งาน) ต่อท้ายตัวเลือกเกณฑ์วัดข้อ 1.1 - 5 โดยตรง',
      targetSubject: 'รายการตัวเลือกเกณฑ์วัด (select#filterCriteria และตัวเลือกบนกราฟที่ซิงก์กัน)',
      storageFile: 'js/app.js',
      changeSummary: 'ทุกตัวเลือกแสดงหน่วยต่อท้าย เช่น "ข้อ 1.1 งบ C.1 ก่อน 69 · มูลค่า", "ข้อ 3.1 TECO D2 · งาน", "เลือกทั้งหมด · มูลค่า/งาน"',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: เพิ่มฟังก์ชัน getCriteriaUnitKind (อ่านหน่วยจากข้อมูลเดือนที่เลือก มี fallback ตามชื่อเกณฑ์) ใช้สร้างข้อความตัวเลือกใน populateFilterDropdowns โดย value ของ option ยังเป็นชื่อเกณฑ์เดิม จึงไม่กระทบการกรอง และปรับ updateCriteriaUnitBadge ให้ใช้ฟังก์ชันเดียวกัน',
      sourceFile: 'คำสั่งผู้ใช้งาน (แก้ไขให้แสดงที่หน้าจอ ตัวเลือกข้อ 1.1 - 5 เลย)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับการแสดงผล)'
    },
    {
      id: 'log_000_criteria_unit_badge',
      timestamp: '2026-10-17 20:30:00',
      timestampTh: '17 ต.ค. 2569, 20:30 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มป้ายหน่วยการวัด',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มป้ายหน่วยการวัด มูลค่า / งาน ด้านขวาของตัวกรองเกณฑ์วัด (ข้อ 1.1 - 5)',
      targetSubject: 'แถบตัวกรองด้านบน (ตัวกรองเกณฑ์วัด)',
      storageFile: 'index.html, css/styles.css, js/app.js',
      changeSummary: 'เพิ่มป้าย "หน่วยวัด [มูลค่า / งาน]" แบบ segmented pill เรืองแสง ไฮไลต์หน่วยตามเกณฑ์ที่เลือก (มูลค่า = ทอง, งาน = ฟ้าคราม) ถ้าเลือกทั้งหมดจะไฮไลต์ทั้งสองหน่วย',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: (1) index.html เพิ่ม #criteriaUnitBadge ต่อท้าย select#filterCriteria (2) styles.css เพิ่มสไตล์ .criteria-unit-badge/.unit-seg พร้อม animation เรืองแสงและรองรับธีมสว่าง/prefers-reduced-motion (3) app.js เพิ่มฟังก์ชัน updateCriteriaUnitBadge เรียกจาก updateTopSelectionDisplay โดยอ่านหน่วย (unit) จากข้อมูลของเกณฑ์ที่เลือก (ข้อ 3.x = งาน, ข้ออื่น = มูลค่า(บาท)) และมี fallback ตามชื่อเกณฑ์ ไม่กระทบการกรองข้อมูล',
      sourceFile: 'คำสั่งผู้ใช้งาน (ตัวกรองเกณฑ์วัด ข้อ 1.1 - 5 ด้านขวา ให้เพิ่มหน่วยการวัด มูลค่า/งาน ให้สวยงามโดดเด่น)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับหน้าตา UI)'
    },
    {
      id: 'log_000_filter_bar_glow_single_row',
      timestamp: '2026-10-17 20:20:00',
      timestampTh: '17 ต.ค. 2569, 20:20 น.',
      type: 'EDIT',
      typeBadge: 'ปรับแถบตัวกรองบนสุด',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มพื้นหลังเรืองแสงให้แถบตัวกรอง และจัดตัวกรองทั้งหมดให้อยู่บรรทัดเดียวกัน',
      targetSubject: 'แถบตัวกรองด้านบน (Top Sticky Filter Bar)',
      storageFile: 'css/styles.css',
      changeSummary: 'เพิ่มลูกแสงม่วง/ทองเคลื่อนไหวช้าๆ และเส้นเรืองแสงขอบล่าง พร้อมเปลี่ยนจาก flex-wrap เป็น nowrap ให้ตัวกรองทุกตัวอยู่บรรทัดเดียว',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: ใน .top-sticky-filter-bar เพิ่ม ::before (radial-gradient หลายชั้น + blur + animation topFilterGlowDrift) และ ::after (เส้นทองเรืองแสง animation topFilterEdgePulse) รองรับ prefers-reduced-motion และธีมสว่าง ส่วน .top-filter-inner ปรับเป็น flex-wrap: nowrap ให้กลุ่มตัวกรอง/ช่องค้นหาย่อขนาดได้ (min-width: 0, text-overflow: ellipsis) และลดขนาดฟอนต์/ระยะห่างเล็กน้อยเพื่อให้พอดีบรรทัดเดียว ปุ่มรีเซ็ตและหัวข้อ "ตัวกรอง:" ไม่ถูกบีบ',
      sourceFile: 'คำสั่งผู้ใช้งาน (เพิ่มพื้นหลังเรืองแสง และตัวกรองอยู่บรรทัดเดียวกันทั้งหมด)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับหน้าตา UI)'
    },
    {
      id: 'log_000_wbs_sap_order_by_code',
      timestamp: '2026-10-17 15:30:00',
      timestampTh: '17 ต.ค. 2569, 15:30 น.',
      type: 'EDIT',
      typeBadge: 'เรียงสถานะ SAP ตามรหัสท้าย',
      badgeClass: 'badge-type-edit',
      title: 'เรียงสถานะ SAP ในกลุ่ม CLSD / TECO / REL ตามรหัสท้าย (F4 แรกสุด, B1 ท้ายสุด)',
      targetSubject: 'การ์ดสรุปสถานะ SAP (แท็บ WBS คงเหลือ)',
      storageFile: 'js/wbs.js',
      changeSummary: 'ภายในกลุ่มเดียวกัน เรียงตามตัวอักษรอังกฤษท้ายสถานะจาก F ไป B และตัวเลขจากมากไปน้อย แทนการเรียงตามมูลค่า AUC',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: เพิ่มฟังก์ชัน parseSapCode ดึงรหัสท้ายสถานะ (ตัวอักษร+ตัวเลข) ใน renderWbsSapSummary แล้วเรียงกลุ่ม CLSD → TECO → REL จากนั้นเรียงตัวอักษร Z→A และตัวเลขมาก→น้อย ทำให้ F4 อยู่แรกสุด และ B1 อยู่ท้ายสุดของกลุ่ม สถานะที่ไม่มีรหัสท้ายอยู่ท้ายกลุ่ม',
      sourceFile: 'คำสั่งผู้ใช้งาน (ให้แก้ไขลำดับ หากกลุ่มเดียวกันให้ดูภาษาอังกฤษและตัวเลขด้านหลัง F4 แรกสุด และ B1 ท้ายสุด)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับลำดับการแสดงผล)'
    },
    {
      id: 'log_000_wbs_sap_order',
      timestamp: '2026-10-17 15:25:00',
      timestampTh: '17 ต.ค. 2569, 15:25 น.',
      type: 'EDIT',
      typeBadge: 'ปรับลำดับสถานะ SAP',
      badgeClass: 'badge-type-edit',
      title: 'ปรับลำดับการ์ดสรุปสถานะ SAP เป็น CLSD F4 → CLSD อื่น → TECO → REL',
      targetSubject: 'การ์ดสรุปสถานะ SAP (แท็บ WBS คงเหลือ)',
      storageFile: 'js/wbs.js',
      changeSummary: 'จากเดิมเรียงตามมูลค่า AUC เปลี่ยนเป็นแสดงต่อจากการ์ดทั้งหมด: CLSD F4 ก่อน ตามด้วย CLSD อื่น, TECO และ REL ท้ายสุด',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: แก้ renderWbsSapSummary ให้จัดกลุ่มลำดับ CLSD (F4 มาก่อน) → TECO → REL/อื่นๆ โดยภายในแต่ละกลุ่มยังเรียงตามมูลค่า AUC มากไปน้อย ไม่กระทบการกรองและตัวเลขสรุป',
      sourceFile: 'คำสั่งผู้ใช้งาน (แก้ไขลำดับสถานะ sap ให้ CLSD F4 ก่อน ต่อด้วย TECO และ REL ท้ายสุด)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับลำดับการแสดงผล)'
    },
    {
      id: 'log_000_wbs_chart_fit_all_offices',
      timestamp: '2026-10-17 15:20:00',
      timestampTh: '17 ต.ค. 2569, 15:20 น.',
      type: 'EDIT',
      typeBadge: 'แสดงครบทุกหน่วยงานในหน้าเดียว',
      badgeClass: 'badge-type-edit',
      title: 'กราฟ กอง/กฟฟ. ที่มีงาน WBS คงเหลือ: เลือก "ทั้งหมด" แสดงครบทุกหน่วยงานในหน้าเดียว',
      targetSubject: 'กราฟแท่ง กอง/กฟฟ. ที่มีงาน WBS คงเหลือ (แท็บ WBS คงเหลือ)',
      storageFile: 'js/wbs.js, css/styles.css & index.html',
      changeSummary: 'โหมดแบบซ้อนบีบกราฟให้พอดีความกว้างการ์ด ไม่ต้องเลื่อนแนวนอน เมื่อหน่วยงานมาก ปรับชื่อเป็นเอียง 62° และเพิ่มพื้นที่ด้านล่างอัตโนมัติ',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: (1) drawTopOfficesCanvas ในโหมดแบบซ้อน ใช้ความกว้างเท่า container แทนความกว้างขั้นต่ำต่อหน่วยงาน (2) เมื่อช่องต่อหน่วยงานแคบกว่า 44px ลดฟอนต์ชื่อเป็น 10px เอียง -62° และคำนวณ padding ล่างจากความยาวชื่อที่ยาวที่สุด (3) ปรับความกว้างแท่งให้ลดได้ตามช่อง (4) ปรับพื้นที่ hover/คลิกให้อิงขอบล่างของกราฟจริง (5) ปรับ CSS/HTML ของ #wbsOfficesChartContainer จากความสูงคงที่เป็น min-height เพื่อรองรับกราฟที่สูงขึ้น (6) โหมดแบบแยกยังเลื่อนแนวนอนได้เหมือนเดิม เพราะ 3 แท่งต่อหน่วยงานบีบแล้วอ่านไม่ออก',
      sourceFile: 'คำสั่งผู้ใช้งาน (เลือกทั้งหมด ให้แสดงครบทุกหน่วยงาน ในหน้าเดียว)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับการวาดกราฟและเลย์เอาต์)'
    },
    {
      id: 'log_000_move_wbs_legend',
      timestamp: '2026-10-17 15:12:00',
      timestampTh: '17 ต.ค. 2569, 15:12 น.',
      type: 'EDIT',
      typeBadge: 'ย้ายตำแหน่งป้าย CLSD/TECO/REL',
      badgeClass: 'badge-type-edit',
      title: 'ย้ายป้ายสถานะ CLSD / TECO / REL ไปชิดป้าย "หน่วยงาน (คงเหลือ งาน)"',
      targetSubject: 'การ์ดกราฟ กอง/กฟฟ. ที่มีงาน WBS คงเหลือ (แท็บ WBS คงเหลือ)',
      storageFile: 'index.html',
      changeSummary: 'ย้ายกลุ่มป้าย CLSD, TECO, REL จากฝั่งขวาของหัวการ์ด มาอยู่ติดกับป้ายสรุปจำนวนหน่วยงานและงานคงเหลือด้านซ้าย',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: ย้าย div#wbsChartLegend เข้าไปใน .card-title ต่อจาก span#wbsOfficesChartCountBadge โดยคง id เดิมทั้งหมด (wbsLegendClsdCount / wbsLegendTecoCount / wbsLegendRelCount) จึงไม่กระทบการอัปเดตตัวเลขใน wbs.js ปุ่มสลับ ทั้งหมด/10 อันดับแรก และแบบซ้อน/แบบแยก ยังอยู่ฝั่งขวาตามเดิม',
      sourceFile: 'คำสั่งผู้ใช้งาน (ย้ายที่วงกลม ไปชิด คงเหลืองาน)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับตำแหน่ง UI)'
    },
    {
      id: 'log_000_remove_wbs_kpi_cards',
      timestamp: '2026-10-17 15:05:00',
      timestampTh: '17 ต.ค. 2569, 15:05 น.',
      type: 'EDIT',
      typeBadge: 'นำการ์ดสรุป WBS ออก',
      badgeClass: 'badge-type-edit',
      title: 'นำการ์ดสรุป KPI 4 ใบ ออกจากหน้า WBS คงเหลือ',
      targetSubject: 'แท็บ WBS คงเหลือ (การ์ดสรุป 4 ใบ)',
      storageFile: 'index.html',
      changeSummary: 'นำการ์ด งาน WBS คงเหลือรวม, หน่วยงานที่เกี่ยวข้อง, ช่างคุมงานผู้รับผิดชอบ และสัดส่วนหมวดงบประมาณ ออกจากหน้าจอ (คอมเมนต์ปิดไว้)',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "เอาออก": คอมเมนต์ปิดบล็อก .wbs-stats-grid ทั้ง 4 การ์ดใน index.html โดยไม่ลบโค้ดเดิม ฟังก์ชัน renderWbsStatCards ใน js/wbs.js ตรวจสอบ null ก่อนเขียนค่า จึงไม่เกิด error',
      sourceFile: 'คำสั่งผู้ใช้งาน (เอาออก)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับการแสดงผล UI)'
    },
    {
      id: 'log_000_separate_growth_tables_pct_and_amount',
      timestamp: '2026-10-17 14:52:00',
      timestampTh: '17 ต.ค. 2569, 14:52 น.',
      type: 'EDIT',
      typeBadge: 'ปรับตารางกราฟ % ให้มีเฉพาะปิดงาน',
      badgeClass: 'badge-type-edit',
      title: 'ปรับตารางด้านขวากราฟร้อยละ % ปิดงานสะสม ไม่ให้มีคอลัมน์ %ภาพรวม (คงตาราง 2 คอลัมน์: เดือน และ %)',
      targetSubject: 'ตารางวิเคราะห์อัตราการเติบโตรายเดือนของกราฟร้อยละ % (แท็บ Timeline)',
      storageFile: 'js/app.js, css/styles.css & js/data_history.js',
      changeSummary: 'ถอดคอลัมน์ %ภาพรวม ออกจากตารางด้านขวาของกราฟ % ปิดงานมูลค่า AUC สะสม (คงไว้ 2 คอลัมน์: เดือน และ %) และคง 3 คอลัมน์ (เดือน, ภาพรวม, ปิดงาน) เฉพาะในกราฟจำนวนเงิน',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "อันนี้ไม่ต้องเพิ่ม %ภาพรวม": (1) ปรับฟังก์ชัน renderTimelineGrowthTable ให้รองรับตัวเลือก showTotal เพื่อแยกตาราง 2 คอลัมน์ และ 3 คอลัมน์ได้อย่างอิสระ (2) กำหนดให้ตารางของกราฟร้อยละ % ปิดงานสะสม (timelinePctGrowthTableWrap) แสดง 2 คอลัมน์ คือ "เดือน" และ "%" (ปิดงาน) พร้อมแถวค่าเฉลี่ยในแถวสุดท้าย โดยไม่มีคอลัมน์ภาพรวม (3) กำหนดให้ตารางของกราฟจำนวนเงิน/จำนวนงาน (timelineAmountGrowthTableWrap) แสดง 3 คอลัมน์ คือ "เดือน", "● ภาพรวม" (MoM Growth %) และ "● ปิดงาน" (%) ตามคำสั่งข้อก่อนหน้า (4) ปรับความกว้างตารางให้เหมาะสม 195px สำหรับ 2 คอลัมน์ และ 255px สำหรับ 3 คอลัมน์',
      sourceFile: 'คำสั่งผู้ใช้งาน (อันนี้ไม่ต้องเพิ่ม %ภาพรวม)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับปรุงการแสดงผลคอลัมน์ตารางให้ตรงตามความต้องการผู้ใช้งานเฉพาะจุด)'
    },
    {
      id: 'log_000_growth_pct_and_total_column',
      timestamp: '2026-10-17 14:48:00',
      timestampTh: '17 ต.ค. 2569, 14:48 น.',
      type: 'EDIT',
      typeBadge: 'ปรับตารางเป็น % & เพิ่มคอลัมน์ภาพรวม',
      badgeClass: 'badge-type-edit',
      title: 'ปรับการแสดงผลค่าเพิ่ม/ลดลงเป็น % แทนงาน/ลบ. และเพิ่มคอลัมน์ภาพรวมมูลค่า/งาน',
      targetSubject: 'ตารางวิเคราะห์อัตราการเติบโตรายเดือน ด้านขวากราฟ Timeline',
      storageFile: 'js/app.js, css/styles.css & js/data_history.js',
      changeSummary: 'เปลี่ยนค่าเพิ่ม/ลดลงในตารางจากจำนวนงาน/ล้านบาท เป็น % แทน พร้อมเพิ่มคอลัมน์ภาพรวมมูลค่า/งาน (เพิ่ม/ลดลง เป็น %) คู่กับคอลัมน์ปิดงาน',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: (1) ปรับการคำนวณและแสดงผลในตารางด้านขวาของกราฟ Timeline จากหน่วยงาน/ลบ. ให้แสดงเป็นสัดส่วนร้อยละ (%) ทั้งหมด (2) เพิ่มคอลัมน์ "● ภาพรวม" แสดงอัตราการเปลี่ยนแปลงภาพรวมมูลค่า/งาน AUC รายเดือน (MoM Growth %) เทียบกับเดือนก่อนหน้า (3) คงคอลัมน์ "● ปิดงาน" แสดงอัตราการปิดงานที่เพิ่มขึ้นหรือลดลงในแต่ละเดือน (%) (4) ปรับความกว้างตารางเป็น 255px ให้รองรับ 3 คอลัมน์ (เดือน, ภาพรวม, ปิดงาน) พร้อมสีสัญลักษณ์ที่ตรงกับเส้นกราฟ (เหลือง = ภาพรวม, เขียว = ปิดงาน) (5) คำนวณค่าเฉลี่ยในแถวสุดท้าย (Footer) ของทั้งคอลัมน์ภาพรวมและปิดงานอย่างถูกต้องแม่นยำ',
      sourceFile: 'คำสั่งผู้ใช้งาน (1.ให้แก้ไข เพิ่ม/ลดลง จากงาน/ลบ. เป็น % แทน 2.ให้เพิ่มคอลัม ภาพรวมมูล่า/งาน เพิ่ม/ลดลง เป็น % ด้วย 3.ให้เพิ่มประวัติในเมนูแก้ไขด้วย ทุกครั้ง)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงรูปแบบการวิเคราะห์อัตราการเติบโตรายเดือนและการแสดงผลตารางเปรียบเทียบ)'
    },
    {
      id: 'log_000_timeline_growth_table',
      timestamp: '2026-10-17 14:27:00',
      timestampTh: '17 ต.ค. 2569, 14:27 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มตาราง % เพิ่ม/ลด รายเดือน',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มตารางแสดงค่า % และจำนวนเงินที่เพิ่มขึ้น/ลดลงรายเดือน (ม.ค. - ธ.ค.) และค่าเฉลี่ย ด้านขวากราฟ Timeline',
      targetSubject: 'กราฟวิเคราะห์เปรียบเทียบ & Timeline (แท็บ Timeline)',
      storageFile: 'index.html, js/app.js & css/styles.css',
      changeSummary: 'แสดงตาราง 2 คอลัมน์ (เดือน และ %) ด้านขวาของกราฟ แสดงค่าการปิดงานที่เพิ่มขึ้นหรือลดลงแต่ละเดือน พร้อมค่าเฉลี่ยในแถวสุดท้าย',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: (1) ออกแบบตาราง 2 คอลัมน์ (คอลัมน์เดือน และคอลัมน์ %) จัดวางด้านขวาของกราฟ Timeline ใน Section ร้อยละ % ปิดงานสะสม และ Section จำนวนเงิน (2) คำนวณส่วนต่างที่เพิ่มขึ้น/ลดลง (MoM Growth) ของแต่ละเดือนตั้งแต่ ม.ค. - ธ.ค. พร้อมแสดงสัญลักษณ์สีเขียว/แดง (3) คำนวณค่าเฉลี่ยในแถวสุดท้าย (Footer Row) ของตารางอย่างแม่นยำ (4) รองรับการอัปเดตแบบเรียลไทม์เมื่อเปลี่ยนตัวกรองเกณฑ์วัด พื้นที่ หรือหน่วยงาน',
      sourceFile: 'คำสั่งผู้ใช้งาน (แสดงค่าที่เพิ่มขึ้นหรือลดลงเป็น % แต่ละเดือน และค่าเฉลี่ยในตารางด้านขวา 2 คอลัมน์)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (เพิ่มฟังก์ชันวิเคราะห์อัตราการเติบโตรายเดือนและการแสดงผลข้อมูล)'
    },
    {
      id: 'log_000_fix_model_view',
      timestamp: '2026-10-17 13:45:00',
      timestampTh: '17 ต.ค. 2569, 13:45 น.',
      type: 'EDIT',
      typeBadge: 'แก้ไขการแสดงผล Model View',
      badgeClass: 'badge-type-edit',
      title: 'แก้ไขหน้าต่าง Model View & ตัวอย่างข้อมูล ไม่แสดงผลเมื่อคลิก',
      targetSubject: 'หน้าต่างป๊อปอัป Model View & การ์ดไฟล์ต้นทาง',
      storageFile: 'js/data_history.js, index.html & css/styles.css',
      changeSummary: 'แก้ไขให้หน้าต่าง Model View แสดงผลสมบูรณ์ 100% ทันทีที่คลิกดูตัวอย่างข้อมูลไฟล์และประวัติ พร้อมปรับ z-index และย้าย DOM สู่ Root',
      details: 'แก้ไข 5 จุดสำคัญ: (1) ปรับ openModelViewModal ให้ใส่คลาส .show และ display:flex แบบ Synchronous ไม่ดีเลย์ requestAnimationFrame (2) ย้าย DOM ของ dhModelViewModal และ dhAddLogModal ไปไว้ระดับ Root ใน index.html ข้าง drilldownModal เพื่อป้องกันปัญหา Stacking context/Transform (3) ปรับ .modal-backdrop ให้มี z-index: 10050 และ .show มี display: flex !important; opacity: 1 !important; (4) ปรับปุ่มคลิกดู Model View บนการ์ดไฟล์ให้เป็น Button ที่รองรับการคลิกแยกโดยตรง (5) เพิ่ม try-catch และความปลอดภัยในการแปลงตัวเลขของ sampleProvider ทุกไฟล์',
      sourceFile: 'js/data_history.js (openModelViewModal, closeDhModelModal & sampleProvider)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง (แก้ไขฟังก์ชันการตรวจสอบข้อมูล Model View ของระบบ)'
    },
    {
      id: 'log_000_workflow',
      timestamp: '2026-10-17 13:08:00',
      timestampTh: '17 ต.ค. 2569, 13:08 น.',
      type: 'EDIT',
      typeBadge: 'ปรับปรุงเมนูนำทาง',
      badgeClass: 'badge-type-edit',
      title: 'นำเมนู "ขั้นตอนงานก่อสร้าง & ขึ้นทะเบียน" ออกจากแถบเมนูหลัก',
      targetSubject: 'แถบเมนูนำทาง (Navigation Bar) & แท็บขั้นตอนงานก่อสร้าง',
      storageFile: 'index.html',
      changeSummary: 'นำปุ่มเมนูแท็บ ขั้นตอนงานก่อสร้าง & ขึ้นทะเบียน ออกจากแถบเมนูหลักด้านบน และคอมเมนต์ปิดส่วน Tab Pane (tab-workflow)',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: นำแท็บบน Navigation bar (<button class="nav-tab-btn" data-tab="tab-workflow">) ออก และคอมเมนต์ปิดแท็บเนื้อหา <div id="tab-workflow" class="tab-pane"> เพื่อลดความซ้ำซ้อนและกระชับแถบเมนูนำทาง โดยยังคงโครงสร้างโค้ดไว้หากต้องการนำกลับมาใช้งานในอนาคต',
      sourceFile: 'index.html (Navigation Tabs Bar & Tab Pane Workflow)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงหน้าจอเมนูนำทางให้ตรงตามความต้องการผู้ใช้งาน)'
    },
    {
      id: 'log_000',
      timestamp: '2026-10-17 12:57:00',
      timestampTh: '17 ต.ค. 2569, 12:57 น.',
      type: 'EDIT',
      typeBadge: 'ปรับปรุงเมนูนำทาง',
      badgeClass: 'badge-type-edit',
      title: 'นำเมนู "ตารางสืบค้นข้อมูล & แผนรายเดือน" ออกจากแถบเมนูหลัก',
      targetSubject: 'แถบเมนูนำทาง (Navigation Bar) & แท็บตารางสืบค้นข้อมูล',
      storageFile: 'index.html',
      changeSummary: 'นำปุ่มเมนูแท็บ ตารางสืบค้นข้อมูล & แผนรายเดือน ออกจากแถบเมนูหลักด้านบน และคอมเมนต์ปิดส่วน Tab Pane (tab-table) เพื่อความกระชับในการใช้งาน',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน: นำแท็บบน Navigation bar (<button class="nav-tab-btn" data-tab="tab-table">) ออก และคอมเมนต์ปิดแท็บเนื้อหา <div id="tab-table" class="tab-pane"> เพื่อไม่ให้แสดงผลในหน้าจอหลัก แต่ยังคงโครงสร้างไว้ในโค้ดหากต้องการนำกลับมาใช้งานในอนาคต',
      sourceFile: 'index.html (Navigation Tabs Bar & Tab Pane Matrix)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงหน้าจอเมนูนำทางให้ตรงตามความต้องการผู้ใช้งาน)'
    },
    {
      id: 'log_001',
      timestamp: '2026-10-17 08:15:00',
      timestampTh: '17 ต.ค. 2569, 08:15 น.',
      type: 'EDIT',
      typeBadge: 'แก้ไขตัวกรองค้นหา',
      badgeClass: 'badge-type-edit',
      title: 'แก้ไขระบบตัวกรองค้นหาในตาราง WBS ให้ตรงตามสถานะ SAP จริง 100%',
      targetSubject: 'ตาราง WBS (ตัวกรองค้นหาข้อความ)',
      storageFile: 'js/wbs.js & index.html',
      changeSummary: 'แยกการค้นหาสถานะ SAP (TECO, REL, CLSD, CRTD) ไม่ให้คำว่า TECO ในช่องหมายเหตุ (note) ของงานที่สถานะ SAP ยังเป็น REL ปะปนขึ้นมา',
      details: 'เพิ่มฟังก์ชัน isStatusKeyword ตรวจจับคีย์เวิร์ดสถานะ SAP และกำหนดไม่ให้ช่อง note มาร่วมจับคู่เมื่อค้นหาสถานะ SAP งาน C-68-I-NPMSR.0215.02.1 (REL D1) จึงไม่แสดงปะปนเมื่อค้นหา "teco" พร้อมทั้งเพิ่มการล้างค่าสถานะ SAP เมื่อกดล้างตัวกรองในตาราง',
      sourceFile: '06 google sheet แผนงานแล้วเสร็จ.xlsx (คอลัมน์ note)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูงมาก (แก้ไขความถูกต้องของการนับจำนวนงานและยอดเงิน)'
    },
    {
      id: 'log_002',
      timestamp: '2026-10-17 07:45:00',
      timestampTh: '17 ต.ค. 2569, 07:45 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มฟังก์ชันปุ่มล้างข้อมูล',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มปุ่มล้างข้อมูลที่เลือก Checkbox และคงสถานะ Checkbox ข้ามการคลิกการ์ดสถานะ SAP',
      targetSubject: 'การ์ดสรุปผลรวมรายการที่เลือก & Checkbox',
      storageFile: 'js/wbs.js',
      changeSummary: 'เพิ่มปุ่ม 🗑️ ล้างข้อมูลที่เลือก ใน Header ของการ์ด และแก้ไขให้ระบบคงสถานะที่ติ๊ก Checkbox ไว้แม้จะคลิกสลับดูสถานะ SAP ใดๆ',
      details: 'ปรับปรุงตัวแปร selectedWbsCodes ให้คำนวณสรุปผลตามรายการที่เลือกจริงทั้งหมด (wbsSelectedItems) โดยไม่ถูกตัดทอนจากการกรองด้วยการ์ดสถานะ SAP ย่อย',
      sourceFile: 'ระบบส่วนหน้า (UI Interaction)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (เพิ่มความสะดวกในการใช้งาน)'
    },
    {
      id: 'log_003',
      timestamp: '2026-10-16 23:30:00',
      timestampTh: '16 ต.ค. 2569, 23:30 น.',
      type: 'EDIT',
      typeBadge: 'ปรับปรุงการ์ดสรุปผล',
      badgeClass: 'badge-type-edit',
      title: 'ปรับปรุงการ์ดสรุปผลรวมรายการที่เลือกให้แสดงเฉพาะสถานะ SAP ที่ติ๊ก Checkbox',
      targetSubject: 'WBS Selected Summary Cards',
      storageFile: 'js/wbs.js & css/styles.css',
      changeSummary: 'ปรับขนาดการ์ดให้เท่ากับการ์ดสรุปสถานะ SAP ซ่อนการ์ด CLSD ซ่อนการ์ดสถานะที่ไม่ได้ติ๊ก และเอาปุ่มเลือกทั้งหมด/ปลดทั้งหมดออก',
      details: 'แสดงการ์ดสรุปประเภทสถานะ SAP เฉพาะที่มีรายการ Checkbox ถูกเลือกอยู่จริงเท่านั้น หากไม่มีการเลือกจะแสดงการ์ด "ทั้งหมด" เพียงใบเดียว',
      sourceFile: 'ระบบแสดงผลสรุปตาราง WBS',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ความสวยงามและใช้งานง่าย)'
    },
    {
      id: 'log_004',
      timestamp: '2026-10-15 17:52:00',
      timestampTh: '15 ต.ค. 2569, 17:52 น.',
      type: 'EDIT',
      typeBadge: 'จำลองแผน Scenario & ธีม',
      badgeClass: 'badge-type-config',
      title: 'เพิ่มเครื่องมือจำลองแผนปิดงาน Scenario Calculator และพาเลทปรับแต่งสี & ธีม',
      targetSubject: 'Scenario Calculator & Color Palette Widget',
      storageFile: 'js/app.js & localStorage',
      changeSummary: 'เพิ่ม Modal Scenario จำลองผลลัพธ์การปรับยอดแผนปิดงานรายเดือน พร้อมคำนวณ Gap เทียบเป้าหมายสะสม',
      details: 'บันทึกค่าที่ผู้ใช้ทดลองแก้ไขลง localStorage (AUC_SIMULATION_SCENARIO) เพื่อให้สามารถจำลองเป้าหมาย KPI ได้แบบเรียลไทม์',
      sourceFile: '02 KPI.xlsx & แผนปิดงาน',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง (ฟีเจอร์ช่วยวางแผนปิดงานผู้บริหาร)'
    },
    {
      id: 'log_005',
      timestamp: '2026-10-13 19:05:00',
      timestampTh: '13 ต.ค. 2569, 19:05 น.',
      type: 'MERGE',
      typeBadge: 'ผสานข้อมูล 4 ไฟล์หลัก',
      badgeClass: 'badge-type-merge',
      title: 'นำเข้าและผสานรวมไฟล์งานคงเหลือ WBS: ไฟล์ 03 + 04 + 05 + 06',
      targetSubject: 'ฐานข้อมูล WBS คงเหลือ (Full Database)',
      storageFile: 'js/data_wbs.js',
      changeSummary: 'ผสานรวมไฟล์ Excel 03, 04, 05, 06 ด้วยรหัส WBS เดียวกัน ได้ฐานข้อมูลครบ 41 คอลัมน์ 2,968 รายการ',
      details: 'รันสคริปต์ merge_wbs_all.ps1 อ่านไฟล์ 03 WBSงานคงเหลือ (2,968 รายการ), ผสานไฟล์ 04 ZBUDR064 (%เบิกพัสดุ/คชจ.), ผสานไฟล์ 05 CN41 (มูลค่า AUC บาท), และไฟล์ 06 Google Sheet (แผนปิดงาน/หมายเหตุ) จัดเก็บเป็นตัวแปร window.AUC_WBS_REMAINING_DATA',
      sourceFile: '03 WBSงานคงเหลือ, 04 ZBUDR064, 05 CN41, 06 Google Sheet',
      author: 'Script Data Merge Engine',
      impactLevel: 'วิกฤต (ฐานข้อมูลหลักของทั้งระบบ)'
    },
    {
      id: 'log_006',
      timestamp: '2026-10-03 09:30:00',
      timestampTh: '3 ต.ค. 2569, 09:30 น.',
      type: 'IMPORT',
      typeBadge: 'นำเข้าเกณฑ์วัด KPI',
      badgeClass: 'badge-type-import',
      title: 'นำเข้าตารางเกณฑ์วัด KPI ประจำปี 2569 จากไฟล์ 02 KPI.xlsx',
      targetSubject: 'เกณฑ์วัด KPI ปี 2569 (ข้อ 1.1 - 3.3)',
      storageFile: 'js/kpi_matrix.js & localStorage',
      changeSummary: 'นำเข้าเป้าหมายสะสมรายเดือนและค่าน้ำหนักคะแนน KPI ประจำปี 2569 ทั้ง 8 เกณฑ์วัด',
      details: 'แปลงข้อมูลจากไฟล์ 02 KPI.xlsx เป็นโครงสร้าง JSON จัดเก็บในตัวแปร window.KPI_MATRIX รองรับการคำนวณผลงานสะสมอัตโนมัติ',
      sourceFile: '02 KPI.xlsx',
      author: 'ผู้นำเข้าข้อมูล (Data Officer)',
      impactLevel: 'สูง (กำหนดสูตรและเป้าหมาย KPI)'
    },
    {
      id: 'log_007',
      timestamp: '2026-09-29 16:55:00',
      timestampTh: '29 ก.ย. 2569, 16:55 น.',
      type: 'IMPORT',
      typeBadge: 'นำเข้าผลงานเดือน ส.ค.',
      badgeClass: 'badge-type-import',
      title: 'นำเข้าข้อมูลรายงานผลงาน AUC ประจำเดือน ส.ค. 2569',
      targetSubject: 'รายงาน AUC รายเดือน (ส.ค. 2569)',
      storageFile: 'js/data_aug.js',
      changeSummary: 'นำเข้าผลงานราย กฟฟ. 20 แห่ง เดือน ส.ค. 2569 จำนวน 368 แถวข้อมูล',
      details: 'บันทึกยอดรวม AUC, ปิดงานแล้ว, คงเหลือ, % ปิดงาน และคะแนน KPI ประจำเดือน ส.ค. เป็น Active Month ของแดชบอร์ดผู้บริหาร',
      sourceFile: '01 รายงาน AUC เดือน 8ส.ค.  (3.2&3.3teco).xlsx',
      author: 'ผู้นำเข้าข้อมูล (Data Officer)',
      impactLevel: 'สูง (ข้อมูลรอบประเมินล่าสุด)'
    },
    {
      id: 'log_008',
      timestamp: '2026-09-25 17:32:00',
      timestampTh: '25 ก.ย. 2569, 17:32 น.',
      type: 'IMPORT',
      typeBadge: 'นำเข้าประวัติ ม.ค. - ก.ค.',
      badgeClass: 'badge-type-import',
      title: 'นำเข้าข้อมูลผลงานย้อนหลังเดือน ม.ค. - ก.ค. 2569 (รวม 7 เดือน)',
      targetSubject: 'รายงาน AUC ย้อนหลัง ม.ค. - ก.ค.',
      storageFile: 'js/data.js และ js/data_jan.js ถึง data_jun.js',
      changeSummary: 'นำเข้าฐานข้อมูลผลงานรายเดือนย้อนหลังรวม 2,576 รายการ',
      details: 'จัดเก็บสถิติผลงานสะสมเพื่อใช้ในการพล็อตกราฟเปรียบเทียบแนวโน้ม (Timeline Analysis) และการประเมินผลการดำเนินงาน',
      sourceFile: '01 รายงาน AUC เดือน 1ม.ค. ถึง 7ก.ค. 2569',
      author: 'ผู้นำเข้าข้อมูล (Data Officer)',
      impactLevel: 'ปานกลาง (ข้อมูลสถิติย้อนหลัง)'
    }
  ];

  /**
   * Helper: Get all custom logs from localStorage
   */
  function getCustomLogs() {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOM_LOGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading custom logs from localStorage:', e);
    }
    return [];
  }

  /**
   * Helper: Save custom logs
   */
  function saveCustomLog(entry) {
    try {
      const current = getCustomLogs();
      current.unshift(entry);
      localStorage.setItem(STORAGE_CUSTOM_LOGS_KEY, JSON.stringify(current));
      return true;
    } catch (e) {
      console.error('Error saving custom log:', e);
      return false;
    }
  }

  /**
   * Helper: Combine base logs + custom logs
   */
  function getAllAuditLogs() {
    const custom = getCustomLogs();
    const combined = [...custom, ...BASE_AUDIT_LOGS];
    // Sort descending by timestamp
    return combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Main Render Function for Tab: ประวัติการนำเข้า & แก้ไขข้อมูล
   */
  window.renderDataHistoryTab = function () {
    const container = document.getElementById('tab-data-history');
    if (!container) return;

    try {
      const allLogs = getAllAuditLogs();
      const totalFiles = DATA_SOURCE_CATALOG.length;
      const totalStorageFiles = SYSTEM_STORAGE_FILES.length;
      const lastImportTh = DATA_SOURCE_CATALOG[0].importDateTh;
      const lastEditTh = allLogs[0] ? allLogs[0].timestampTh : '17 ต.ค. 2569, 08:15 น.';

    container.innerHTML = `
      <div class="data-history-wrapper">
        
        <!-- Header Banner & Top Stats -->
        <div class="dh-header-card">
          <div class="dh-header-info">
            <div class="dh-badge-pill">
              <span class="dh-pulse-dot"></span>
              <span>ศูนย์บันทึกประวัติข้อมูล & แหล่งจัดเก็บ (Data Audit & Model View)</span>
            </div>
            <h2 class="dh-main-title">
              ประวัติการนำเข้าข้อมูล แหล่งจัดเก็บ และบันทึกการแก้ไขข้อมูล
            </h2>
            <p class="dh-subtitle">
              ตรวจสอบวัน-เวลาที่นำเข้าไฟล์ต้นฉบับ Excel 01 - 06, แหล่งที่ตั้งไฟล์จัดเก็บข้อมูลในระบบ, บันทึกการเปลี่ยนแปลง (Change Log), และผัง Model View การเชื่อมโยงข้อมูล
            </p>
          </div>
          <div class="dh-header-actions">
            <button class="btn btn-outline" id="btnDhAddManualLog" title="บันทึกโน้ตประวัติการแก้ไขข้อมูลเพิ่มเติม">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>+ บันทึกประวัติการแก้ไข</span>
            </button>
            <button class="btn btn-gold" onclick="document.getElementById('excelFileInput').click()" title="นำเข้าไฟล์ Excel อัปเดตเข้าระบบ">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>นำเข้าไฟล์ใหม่</span>
            </button>
          </div>
        </div>

        <!-- 4 Top KPI Stat Cards -->
        <div class="dh-stats-grid">
          <div class="dh-stat-card">
            <div class="dh-stat-icon" style="background:rgba(236,72,153,0.15); color:#F472B6;">📁</div>
            <div class="dh-stat-body">
              <div class="dh-stat-val">${totalFiles} ไฟล์หลัก</div>
              <div class="dh-stat-label">ไฟล์ Excel ต้นทางทั้งหมด (01 - 06)</div>
              <div class="dh-stat-sub">รายงาน AUC, KPI, WBS, SAP, CN41, แผนงาน</div>
            </div>
          </div>

          <div class="dh-stat-card">
            <div class="dh-stat-icon" style="background:rgba(139,92,246,0.15); color:#A78BFA;">📅</div>
            <div class="dh-stat-body">
              <div class="dh-stat-val">23 ต.ค. 2569</div>
              <div class="dh-stat-label">นำเข้าข้อมูล WBS คงเหลือล่าสุด</div>
              <div class="dh-stat-sub">2,083 รายการ WBS (ผสานไฟล์ 03, 04, 05, 06)</div>
            </div>
          </div>

          <div class="dh-stat-card">
            <div class="dh-stat-icon" style="background:rgba(245,158,11,0.15); color:#FBBF24;">✏️</div>
            <div class="dh-stat-body">
              <div class="dh-stat-val">17 ต.ค. 2569</div>
              <div class="dh-stat-label">แก้ไขข้อมูล / ตัวกรองล่าสุด</div>
              <div class="dh-stat-sub">แยก TECO กับ REL D1 & บันทึก Checkbox</div>
            </div>
          </div>

          <div class="dh-stat-card">
            <div class="dh-stat-icon" style="background:rgba(16,185,129,0.15); color:#34D399;">💾</div>
            <div class="dh-stat-body">
              <div class="dh-stat-val">${totalStorageFiles} แหล่งจัดเก็บ</div>
              <div class="dh-stat-label">ไฟล์จัดเก็บในระบบ (System Storage)</div>
              <div class="dh-stat-sub">js/data_wbs.js, js/data_aug.js, kpi_matrix.js</div>
            </div>
          </div>
        </div>

        <!-- View Mode Navigation Tabs -->
        <div class="dh-view-selector">
          <button class="dh-view-tab-btn active" data-dh-view="model-flow" id="dhBtnViewModelFlow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
              <line x1="6" y1="6" x2="6.01" y2="6"></line>
              <line x1="6" y1="18" x2="6.01" y2="18"></line>
            </svg>
            <span>ผังการไหลของข้อมูล & แหล่งจัดเก็บ (Model View & Storage Map)</span>
          </button>

          <button class="dh-view-tab-btn" data-dh-view="timeline-log" id="dhBtnViewTimelineLog">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>ประวัติการนำเข้าและแก้ไขข้อมูล (Timeline & Change Log)</span>
            <span class="dh-counter-badge">${allLogs.length} รายการ</span>
          </button>

          <button class="dh-view-tab-btn" data-dh-view="storage-files" id="dhBtnViewStorageFiles">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
            </svg>
            <span>ไฟล์ที่จัดเก็บข้อมูลในระบบ (System Storage Inspector)</span>
          </button>
        </div>

        <!-- VIEW 1: DATA FLOW ARCHITECTURE & MODEL VIEW -->
        <div class="dh-view-content active" id="dhContentModelFlow">
          
          <!-- Interactive Architecture Diagram Flow -->
          <div class="dh-diagram-card">
            <div class="dh-diagram-header">
              <div class="dh-diagram-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                <span>ผังจำลองสถาปัตยกรรม Model View การนำเข้า ผสาน และจัดเก็บข้อมูล</span>
              </div>
              <div class="dh-diagram-desc">คลิกที่การ์ดไฟล์หรือกล่องประมวลผลเพื่อเปิดดูรายละเอียดเชิงลึก (Model View Modal)</div>
            </div>

            <div class="dh-flow-container">
              
              <!-- Stage 1: Source Files -->
              <div class="dh-flow-stage">
                <div class="dh-stage-header">
                  <span class="dh-stage-num">1</span>
                  <span>ไฟล์ Excel ต้นฉบับ (Source Files)</span>
                </div>
                <div class="dh-stage-cards">
                  <div class="dh-flow-node" onclick="window.openModelViewModal('src_03', 'source')">
                    <div class="dh-node-badge" style="background:#EC4899;">ไฟล์ 03</div>
                    <div class="dh-node-title">WBS คงเหลือ (2,083 รายการ)</div>
                    <div class="dh-node-meta">นำเข้า: 23 ต.ค. 69 • 5.43 MB</div>
                  </div>
                  <div class="dh-flow-node" onclick="window.openModelViewModal('src_04', 'source')">
                    <div class="dh-node-badge" style="background:#8B5CF6;">ไฟล์ 04</div>
                    <div class="dh-node-title">ZBUDR064 (%พัสดุ/สถานะ SAP)</div>
                    <div class="dh-node-meta">นำเข้า: 23 ต.ค. 69 • 731.7 KB</div>
                  </div>
                  <div class="dh-flow-node" onclick="window.openModelViewModal('src_06', 'source')">
                    <div class="dh-node-badge" style="background:#F59E0B;">ไฟล์ 06</div>
                    <div class="dh-node-title">CN41 (มูลค่า AUC บาท)</div>
                    <div class="dh-node-meta">นำเข้า: 24 ต.ค. 69 • 336.2 KB</div>
                  </div>
                  <div class="dh-flow-node" onclick="window.openModelViewModal('src_sheet', 'source')">
                    <div class="dh-node-badge" style="background:#10B981;">G-Sheet</div>
                    <div class="dh-node-title">Google Sheet (แผนปิดงาน/หมายเหตุ)</div>
                    <div class="dh-node-meta">ซิงค์: 22 ต.ค. 69 • Live API</div>
                  </div>
                  <div class="dh-flow-node" onclick="window.openModelViewModal('src_02', 'source')">
                    <div class="dh-node-badge" style="background:#3B82F6;">ไฟล์ 02</div>
                    <div class="dh-node-title">KPI Matrix (เกณฑ์วัด 8 ข้อ)</div>
                    <div class="dh-node-meta">นำเข้า: 3 ต.ค. 69 • 17.4 KB</div>
                  </div>
                  <div class="dh-flow-node" onclick="window.openModelViewModal('src_01_aug', 'source')">
                    <div class="dh-node-badge" style="background:#6366F1;">ไฟล์ 01</div>
                    <div class="dh-node-title">รายงาน AUC เดือน ส.ค. (ล่าสุด)</div>
                    <div class="dh-node-meta">นำเข้า: 29 ก.ย. 69 • 50.2 KB</div>
                  </div>
                </div>
              </div>

              <!-- Arrow Connector 1 -->
              <div class="dh-flow-arrow">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
                <span>ผสาน & Normalize</span>
              </div>

              <!-- Stage 2: Processing Engine -->
              <div class="dh-flow-stage">
                <div class="dh-stage-header">
                  <span class="dh-stage-num">2</span>
                  <span>ระบบประมวลผล (Data Engine)</span>
                </div>
                <div class="dh-stage-cards">
                  <div class="dh-flow-node highlight">
                    <div class="dh-node-badge" style="background:var(--pea-gold-400); color:#000;">Merge Engine</div>
                    <div class="dh-node-title">Left Join ด้วยเลขที่ WBS</div>
                    <div class="dh-node-meta">ผสานไฟล์ 03+04+05+06 เป็น 41 คอลัมน์</div>
                  </div>
                  <div class="dh-flow-node highlight">
                    <div class="dh-node-badge" style="background:#10B981; color:#fff;">Status Parser</div>
                    <div class="dh-node-title">จัดกลุ่มสถานะ SAP อัจฉริยะ</div>
                    <div class="dh-node-meta">แยก REL, TECO, CLSD ย่อเหลือ 2 อักษร</div>
                  </div>
                  <div class="dh-flow-node highlight">
                    <div class="dh-node-badge" style="background:#3B82F6; color:#fff;">KPI Calculator</div>
                    <div class="dh-node-title">คำนวณคะแนน KPI & Gap</div>
                    <div class="dh-node-meta">ประเมินคะแนนสะสม 20 กฟฟ. รายเดือน</div>
                  </div>
                </div>
              </div>

              <!-- Arrow Connector 2 -->
              <div class="dh-flow-arrow">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
                <span>จัดเก็บข้อมูล</span>
              </div>

              <!-- Stage 3: System Storage Files -->
              <div class="dh-flow-stage">
                <div class="dh-stage-header">
                  <span class="dh-stage-num">3</span>
                  <span>ไฟล์ที่จัดเก็บข้อมูลในระบบ (Storage)</span>
                </div>
                <div class="dh-stage-cards">
                  <div class="dh-flow-node storage-node" onclick="window.openModelViewModal('src_03', 'source')">
                    <div class="dh-node-badge" style="background:#10B981;">js/data_wbs.js</div>
                    <div class="dh-node-title">window.AUC_WBS_REMAINING_DATA</div>
                    <div class="dh-node-meta">2,083 รายการ WBS • 2.32 MB</div>
                  </div>
                  <div class="dh-flow-node storage-node" onclick="window.openModelViewModal('src_01_aug', 'source')">
                    <div class="dh-node-badge" style="background:#6366F1;">js/data_aug.js</div>
                    <div class="dh-node-title">window.AUC_DATA_AUG (ส.ค.)</div>
                    <div class="dh-node-meta">368 รายการ • 372 KB</div>
                  </div>
                  <div class="dh-flow-node storage-node" onclick="window.openModelViewModal('src_02', 'source')">
                    <div class="dh-node-badge" style="background:#3B82F6;">js/kpi_matrix.js</div>
                    <div class="dh-node-title">window.KPI_MATRIX</div>
                    <div class="dh-node-meta">8 เกณฑ์วัด • 12.5 KB</div>
                  </div>
                  <div class="dh-flow-node storage-node">
                    <div class="dh-node-badge" style="background:#EC4899;">localStorage</div>
                    <div class="dh-node-title">AUC_SAVED_KPI, Scenario, Cols</div>
                    <div class="dh-node-meta">บันทึกเครื่องผู้ใช้ • Real-time</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- File Cards Grid (Model View Trigger Cards) -->
          <div class="dh-section-header">
            <h3 class="dh-section-title">
              <span>รายละเอียดไฟล์ต้นทางและไฟล์จัดเก็บข้อมูล (คลิกดู Model View)</span>
            </h3>
            <span class="dh-section-count">ทั้งหมด ${DATA_SOURCE_CATALOG.length} ไฟล์หลัก</span>
          </div>

          <div class="dh-cards-grid">
            ${DATA_SOURCE_CATALOG.map(file => `
              <div class="dh-file-card" onclick="window.openModelViewModal('${file.id}', 'source')">
                <div class="dh-file-card-top">
                  <div class="dh-file-badge" style="background:${file.badgeColor}22; color:${file.badgeColor}; border:1px solid ${file.badgeColor}44;">
                    <span>ไฟล์ ${file.groupNo}</span>
                  </div>
                  <div class="dh-file-status ${file.status === 'active' ? 'status-active' : 'status-ready'}">
                    <span>${file.statusText}</span>
                  </div>
                </div>

                <div class="dh-file-title-group">
                  <div class="dh-file-icon">${file.icon}</div>
                  <div>
                    <h4 class="dh-file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</h4>
                    <div class="dh-file-cat">${file.category}</div>
                  </div>
                </div>

                <p class="dh-file-desc">${escapeHtml(file.description)}</p>

                <div class="dh-file-meta-list">
                  <div class="dh-meta-row">
                    <span class="dh-meta-label">📅 วันที่นำเข้าข้อมูล:</span>
                    <span class="dh-meta-val">${file.importDateTh}</span>
                  </div>
                  <div class="dh-meta-row">
                    <span class="dh-meta-label">✏️ แก้ไขล่าสุด:</span>
                    <span class="dh-meta-val highlight-gold">${file.lastModifiedTh}</span>
                  </div>
                  <div class="dh-meta-row">
                    <span class="dh-meta-label">💾 ไฟล์จัดเก็บในระบบ:</span>
                    <span class="dh-meta-val file-tag"><code>${file.storageFile}</code></span>
                  </div>
                  <div class="dh-meta-row">
                    <span class="dh-meta-label">📊 จำนวนแถว / ขนาด:</span>
                    <span class="dh-meta-val">${file.recordCount.toLocaleString('th-TH')} แถว (${file.sizeText})</span>
                  </div>
                </div>

                <div class="dh-file-card-footer">
                  <button type="button" class="btn btn-sm btn-outline dh-btn-view-model" onclick="event.stopPropagation(); window.openModelViewModal('${file.id}', 'source')" style="cursor:pointer; width:100%; justify-content:center; padding:0.5rem 0.85rem; border-color:rgba(245,158,11,0.45); color:var(--pea-gold-400); font-weight:700;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <span>คลิกดู Model View &amp; ตัวอย่างข้อมูล</span>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>

        </div>

        <!-- VIEW 2: TIMELINE & CHANGE AUDIT LOG -->
        <div class="dh-view-content" id="dhContentTimelineLog">
          
          <!-- Filters & Search Toolbar for Logs -->
          <div class="dh-toolbar-card">
            <div class="dh-search-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" id="dhLogSearchInput" placeholder="ค้นหาประวัติการนำเข้า / แก้ไข / ชื่อไฟล์ / สิ่งที่แก้ไข..." />
            </div>

            <div class="dh-filter-group">
              <label>ประเภทประวัติ:</label>
              <select id="dhLogTypeFilter" class="form-select">
                <option value="ALL">ทั้งหมดทุกประเภท</option>
                <option value="EDIT">✏️ การแก้ไขข้อมูล (Data Modification)</option>
                <option value="IMPORT">📥 การนำเข้าข้อมูล (Data Import)</option>
                <option value="MERGE">🔄 การผสานรวมไฟล์ (Data Merge)</option>
                <option value="CONFIG">⚙️ การตั้งค่าระบบ (Configuration)</option>
              </select>
            </div>

            <div class="dh-toolbar-stats">
              แสดง <strong id="dhVisibleLogCount">${allLogs.length}</strong> จาก ${allLogs.length} รายการ
            </div>
          </div>

          <!-- Timeline Container -->
          <div class="dh-timeline-container" id="dhTimelineList">
            ${renderTimelineItemsHtml(allLogs)}
          </div>

        </div>

        <!-- VIEW 3: SYSTEM STORAGE FILES INSPECTOR -->
        <div class="dh-view-content" id="dhContentStorageFiles">
          <div class="content-card" style="margin-top:0;">
            <div class="card-header">
              <div class="card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                </svg>
                <span>ตารางไฟล์ที่จัดเก็บข้อมูลในระบบ (System Storage Files Location)</span>
              </div>
              <div style="font-size:0.8rem; color:var(--text-muted);">
                โครงสร้างไฟล์ JavaScript ภายในโฟลเดอร์ <code style="color:var(--pea-gold-400);">js/</code> และหน่วยความจำ LocalStorage
              </div>
            </div>

            <div class="table-responsive">
              <table class="data-table dh-storage-table">
                <thead>
                  <tr>
                    <th style="width:50px; text-align:center;">ลำดับ</th>
                    <th style="min-width:220px;">ไฟล์ที่จัดเก็บข้อมูล (File Path)</th>
                    <th style="min-width:240px;">หน้าที่ & ข้อมูลที่จัดเก็บ</th>
                    <th style="min-width:180px;">ตัวแปรในระบบ (Variable)</th>
                    <th style="min-width:140px; text-align:center;">จำนวนข้อมูล</th>
                    <th style="min-width:100px; text-align:center;">ขนาด</th>
                    <th style="min-width:150px; text-align:center;">แก้ไขล่าสุด</th>
                    <th style="min-width:130px; text-align:center;">สถานะ</th>
                    <th style="min-width:100px; text-align:center;">การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  ${SYSTEM_STORAGE_FILES.map((f, idx) => `
                    <tr>
                      <td style="text-align:center; font-weight:700; color:var(--text-muted);">${idx + 1}</td>
                      <td>
                        <div style="display:flex; align-items:center; gap:0.4rem;">
                          <span style="font-size:1.1rem;">📄</span>
                          <strong style="color:var(--text-main); font-family:monospace; font-size:0.88rem;">${escapeHtml(f.path)}</strong>
                        </div>
                        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${escapeHtml(f.title)}</div>
                      </td>
                      <td style="font-size:0.82rem; color:var(--text-muted);">${escapeHtml(f.role)}</td>
                      <td><code style="font-size:0.78rem; background:rgba(0,0,0,0.35); padding:2px 6px; border-radius:4px; color:#A78BFA;">${escapeHtml(f.variable)}</code></td>
                      <td style="text-align:center; font-weight:700; color:var(--pea-gold-400); font-size:0.85rem;">${escapeHtml(f.recordsCount)}</td>
                      <td style="text-align:center; font-size:0.8rem; color:var(--text-muted);">${escapeHtml(f.fileSize)}</td>
                      <td style="text-align:center; font-size:0.8rem; color:var(--text-main);">${escapeHtml(f.updatedAt)}</td>
                      <td style="text-align:center;">
                        <span class="dh-status-badge ${f.status.includes('Active') || f.status.includes('100%') ? 'status-ok' : 'status-info'}">${escapeHtml(f.status)}</span>
                      </td>
                      <td style="text-align:center;">
                        <button class="btn btn-sm btn-outline" onclick="window.copyTextToClipboard('${f.path}', 'คัดลอกพาธไฟล์ ${f.path} สำเร็จ')" title="คัดลอก Path ไฟล์">
                          📋 คัดลอก
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    `;

    setupDhEventListeners();

    // Update badge on navigation tab dynamically to newest audit log date
    const newestLog = allLogs && allLogs.length > 0 ? allLogs[0] : null;
    const badgeEl = document.getElementById('dataHistoryBadge');
    if (badgeEl && newestLog && newestLog.timestampTh) {
      const match = newestLog.timestampTh.match(/^(\d{1,2}\s+[^\s,]+)/);
      if (match) {
        badgeEl.textContent = match[1];
      }
    }
    } catch (err) {
      console.error('Error rendering Data History Tab:', err);
      if (container) {
        container.innerHTML = `
          <div style="background:rgba(239,68,68,0.1); border:1px solid #EF4444; border-radius:12px; padding:2rem; text-align:center; color:#fff; margin:2rem;">
            <div style="font-size:2rem; margin-bottom:0.5rem;">⚠️</div>
            <h3 style="color:#F87171;">เกิดข้อผิดพลาดในการโหลดหน้าประวัติ</h3>
            <p style="color:#CBD5E1; font-family:monospace; margin-top:0.5rem;">${escapeHtml(err.message)}</p>
            <button class="btn btn-primary" onclick="window.renderDataHistoryTab()" style="margin-top:1rem;">ลองใหม่อีกครั้ง</button>
          </div>
        `;
      }
    }
  };

  /**
   * Helper: Render Timeline Items HTML
   */
  function renderTimelineItemsHtml(logs) {
    if (!logs || logs.length === 0) {
      return `
        <div style="text-align:center; padding:3rem 1rem; color:var(--text-muted);">
          <div style="font-size:2.5rem; margin-bottom:0.5rem;">🔍</div>
          <div>ไม่พบรายการประวัติที่ตรงกับเงื่อนไขค้นหา</div>
        </div>
      `;
    }

    return logs.map((log, index) => {
      const typeIcons = {
        EDIT: '✏️',
        IMPORT: '📥',
        MERGE: '🔄',
        CONFIG: '⚙️'
      };
      const icon = typeIcons[log.type] || '📑';
      const badgeClass = log.badgeClass || (log.type === 'IMPORT' ? 'badge-type-import' : 'badge-type-edit');

      return `
        <div class="dh-timeline-item" id="dhLogItem_${log.id}">
          <div class="dh-tl-marker">
            <span class="dh-tl-dot"></span>
            <span class="dh-tl-line"></span>
          </div>

          <div class="dh-tl-card">
            <div class="dh-tl-header">
              <div class="dh-tl-meta-left">
                <span class="dh-tl-icon">${icon}</span>
                <span class="dh-type-badge ${badgeClass}">${escapeHtml(log.typeBadge || log.type)}</span>
                <span class="dh-tl-time">🕒 ${escapeHtml(log.timestampTh)}</span>
              </div>
              <div class="dh-tl-meta-right">
                <span class="dh-author-badge">👤 ${escapeHtml(log.author || 'ระบบ')}</span>
              </div>
            </div>

            <h4 class="dh-tl-title">${escapeHtml(log.title)}</h4>

            <div class="dh-tl-summary-box">
              <div class="dh-summary-row">
                <span class="dh-summary-label">🎯 สิ่งที่แก้ไข / นำเข้า:</span>
                <span class="dh-summary-content">${escapeHtml(log.changeSummary)}</span>
              </div>
              <div class="dh-summary-row">
                <span class="dh-summary-label">💾 ไฟล์ที่จัดเก็บข้อมูล:</span>
                <span class="dh-summary-file"><code>${escapeHtml(log.storageFile)}</code></span>
              </div>
              ${log.sourceFile ? `
                <div class="dh-summary-row">
                  <span class="dh-summary-label">📁 ไฟล์ต้นฉบับ:</span>
                  <span class="dh-summary-src">${escapeHtml(log.sourceFile)}</span>
                </div>
              ` : ''}
            </div>

            ${log.details ? `
              <div class="dh-tl-details-text">
                <strong>รายละเอียดเชิงลึก:</strong> ${escapeHtml(log.details)}
              </div>
            ` : ''}

            <div class="dh-tl-footer">
              <span class="dh-impact-pill">ผลกระทบ: ${escapeHtml(log.impactLevel || 'ข้อมูลได้รับการอัปเดต')}</span>
              <button class="btn btn-sm btn-outline dh-btn-model-trigger" onclick="window.openModelViewModal('${log.id}', 'log')">
                🔍 ดู Model View รายการนี้
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Open Model View Modal (for both Source File and Audit Log entry)
   */
  window.openModelViewModal = function (itemId, itemType) {
    const modalEl = document.getElementById('dhModelViewModal');
    const bodyEl = document.getElementById('dhModelModalBody');
    if (!modalEl || !bodyEl) return;

    if (itemType === 'source') {
      const file = DATA_SOURCE_CATALOG.find(f => f.id === itemId);
      if (!file) return;

      let sampleRows = [];
      try {
        if (typeof file.sampleProvider === 'function') {
          sampleRows = file.sampleProvider() || [];
        }
      } catch (err) {
        console.warn('Error in sampleProvider for', file.id, err);
        sampleRows = [];
      }
      const sampleHeaders = sampleRows.length > 0 ? Object.keys(sampleRows[0]) : [];

      bodyEl.innerHTML = `
        <div class="modal-header dh-model-header">
          <div class="dh-model-title-group">
            <div class="dh-model-avatar" style="background:${file.badgeColor}22; color:${file.badgeColor};">
              ${file.icon}
            </div>
            <div>
              <div class="dh-model-badge-top">MODEL VIEW • แหล่งข้อมูลกลุ่ม ${file.groupNo}</div>
              <h3 class="dh-model-title">${escapeHtml(file.name)}</h3>
              <div class="dh-model-cat">${file.category}</div>
            </div>
          </div>
          <button class="modal-btn-close" onclick="window.closeDhModelModal()">✕</button>
        </div>

        <div class="modal-body dh-model-body">
          
          <!-- Key Meta Properties -->
          <div class="dh-model-meta-grid">
            <div class="dh-meta-box">
              <div class="dh-mb-label">📅 วันที่นำเข้าข้อมูล</div>
              <div class="dh-mb-val">${file.importDateTh}</div>
            </div>
            <div class="dh-meta-box">
              <div class="dh-mb-label">✏️ แก้ไขข้อมูลล่าสุด</div>
              <div class="dh-mb-val highlight-gold">${file.lastModifiedTh}</div>
            </div>
            <div class="dh-meta-box">
              <div class="dh-mb-label">💾 ไฟล์ที่จัดเก็บข้อมูลในระบบ</div>
              <div class="dh-mb-val"><code>${file.storageFile}</code></div>
            </div>
            <div class="dh-meta-box">
              <div class="dh-mb-label">📊 จำนวนข้อมูล / ขนาด</div>
              <div class="dh-mb-val">${file.recordCount.toLocaleString('th-TH')} รายการ (${file.sizeText})</div>
            </div>
          </div>

          <!-- Description Box -->
          <div class="dh-model-desc-box">
            <div class="dh-box-title">📝 คำอธิบายบทบาทและข้อมูลในไฟล์:</div>
            <p>${escapeHtml(file.description)}</p>
            <div class="dh-var-mapping">
              <strong>ตัวแปรจัดเก็บในระบบ:</strong> <code>${escapeHtml(file.storageVar)}</code>
            </div>
          </div>

          <!-- Mapped Columns Structure -->
          <div style="margin-top:1rem;">
            <div class="dh-box-title">🏷️ โครงสร้างคอลัมน์สำคัญที่ผสานเข้าระบบ (${file.columns.length} ฟิลด์):</div>
            <div class="dh-columns-pill-container">
              ${file.columns.map(col => `<span class="dh-col-pill">${escapeHtml(col)}</span>`).join('')}
            </div>
          </div>

          <!-- Live Sample Data Preview Table -->
          <div style="margin-top:1.25rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
              <div class="dh-box-title" style="margin:0;">
                👀 ตัวอย่างข้อมูลจริงที่โหลดอยู่ในระบบ (Live Data Preview 5 รายการแรก):
              </div>
              <span style="font-size:0.75rem; color:var(--text-muted);">อ่านตรงจากตัวแปรหน่วยความจำ</span>
            </div>

            <div class="table-responsive dh-sample-table-wrap">
              ${sampleRows.length > 0 ? `
                <table class="data-table dh-preview-table">
                  <thead>
                    <tr>
                      <th style="width:40px; text-align:center;">#</th>
                      ${sampleHeaders.map(h => `<th>${escapeHtml(h)}</th>`).join('')}
                    </tr>
                  </thead>
                  <tbody>
                    ${sampleRows.map((row, idx) => `
                      <tr>
                        <td style="text-align:center; color:var(--text-muted); font-size:0.8rem;">${idx + 1}</td>
                        ${sampleHeaders.map(h => `<td>${escapeHtml(row[h] || '-')}</td>`).join('')}
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : `
                <div style="text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.85rem;">
                  ไม่มีตัวอย่างข้อมูลแสดงผล
                </div>
              `}
            </div>
          </div>

        </div>

        <div class="modal-footer dh-model-footer">
          <button class="btn btn-outline" onclick="window.copyTextToClipboard('${file.storageFile}', 'คัดลอกตำแหน่งจัดเก็บสำเร็จ')">
            📋 คัดลอกตำแหน่งไฟล์จัดเก็บ
          </button>
          <button class="btn btn-primary" onclick="window.closeDhModelModal()">ปิดหน้าต่าง Model View</button>
        </div>
      `;
    } else if (itemType === 'log') {
      const allLogs = getAllAuditLogs();
      const log = allLogs.find(l => l.id === itemId);
      if (!log) return;

      bodyEl.innerHTML = `
        <div class="modal-header dh-model-header">
          <div class="dh-model-title-group">
            <div class="dh-model-avatar" style="background:rgba(245,158,11,0.2); color:#FBBF24;">
              ✏️
            </div>
            <div>
              <div class="dh-model-badge-top">AUDIT LOG MODEL VIEW • รหัสประวัติ ${log.id}</div>
              <h3 class="dh-model-title">${escapeHtml(log.title)}</h3>
              <div class="dh-model-cat">${escapeHtml(log.typeBadge || log.type)}</div>
            </div>
          </div>
          <button class="modal-btn-close" onclick="window.closeDhModelModal()">✕</button>
        </div>

        <div class="modal-body dh-model-body">
          <div class="dh-model-meta-grid">
            <div class="dh-meta-box">
              <div class="dh-mb-label">🕒 วัน-เวลาที่มีการดำเนินการ</div>
              <div class="dh-mb-val highlight-gold">${log.timestampTh}</div>
            </div>
            <div class="dh-meta-box">
              <div class="dh-mb-label">👤 ผู้ดำเนินการ / ระบบ</div>
              <div class="dh-mb-val">${escapeHtml(log.author || 'ระบบ')}</div>
            </div>
            <div class="dh-meta-box">
              <div class="dh-mb-label">💾 ไฟล์ที่จัดเก็บข้อมูล</div>
              <div class="dh-mb-val"><code>${escapeHtml(log.storageFile)}</code></div>
            </div>
            <div class="dh-meta-box">
              <div class="dh-mb-label">📁 ไฟล์ต้นฉบับที่เกี่ยวข้อง</div>
              <div class="dh-mb-val">${escapeHtml(log.sourceFile || '-')}</div>
            </div>
          </div>

          <div class="dh-model-desc-box" style="margin-top:1rem;">
            <div class="dh-box-title">🎯 สรุปรายการสิ่งที่แก้ไข / นำเข้า:</div>
            <p style="font-size:0.95rem; font-weight:600; color:var(--text-main); margin-bottom:0.75rem;">
              ${escapeHtml(log.changeSummary)}
            </p>

            <div class="dh-box-title" style="margin-top:0.75rem;">🔍 รายละเอียดเชิงลึก:</div>
            <p style="color:var(--text-muted); line-height:1.6;">${escapeHtml(log.details)}</p>
          </div>

          <div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); border-radius:8px; padding:0.85rem; margin-top:1rem;">
            <div style="font-size:0.8rem; font-weight:700; color:#34D399; margin-bottom:0.25rem;">
              🛡️ ผลกระทบและการตรวจสอบความสมบูรณ์:
            </div>
            <div style="font-size:0.85rem; color:var(--text-main);">
              ${escapeHtml(log.impactLevel || 'ข้อมูลได้รับการบันทึกและตรวจสอบเรียบร้อยแล้ว')}
            </div>
          </div>
        </div>

        <div class="modal-footer dh-model-footer">
          <button class="btn btn-outline" onclick="window.copyTextToClipboard('${log.storageFile}', 'คัดลอกตำแหน่งจัดเก็บสำเร็จ')">
            📋 คัดลอกตำแหน่งไฟล์จัดเก็บ
          </button>
          <button class="btn btn-primary" onclick="window.closeDhModelModal()">ปิดหน้าต่าง Model View</button>
        </div>
      `;
    }

    modalEl.classList.add('show');
    modalEl.style.display = 'flex';
  };

  window.closeDhModelModal = function () {
    const modalEl = document.getElementById('dhModelViewModal');
    if (modalEl) {
      modalEl.classList.remove('show');
      modalEl.style.display = 'none';
    }
  };

  window.openDhModelModal = function (itemId) {
    window.openModelViewModal(itemId, 'source');
  };

  window.openDhAddLogModal = function () {
    const modalEl = document.getElementById('dhAddLogModal');
    if (modalEl) {
      modalEl.classList.add('show');
      modalEl.style.display = 'flex';
    }
  };

  window.closeDhAddLogModal = function () {
    const modalEl = document.getElementById('dhAddLogModal');
    if (modalEl) {
      modalEl.classList.remove('show');
      modalEl.style.display = 'none';
    }
  };

  /**
   * Submit Custom Log from Modal
   */
  window.submitCustomLog = function () {
    const type = document.getElementById('dhInputLogType').value;
    const title = (document.getElementById('dhInputTitle').value || '').trim();
    const storageFile = (document.getElementById('dhInputStorageFile').value || '').trim();
    const changeSummary = (document.getElementById('dhInputSummary').value || '').trim();
    const details = (document.getElementById('dhInputDetails').value || '').trim();
    const author = (document.getElementById('dhInputAuthor').value || '').trim();

    if (!title || !changeSummary) {
      if (window.showToast) window.showToast('กรุณากรอกหัวข้อและสรุปสิ่งที่แก้ไข', 'warning');
      return;
    }

    const now = new Date();
    const monthsTh = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} น.`;
    const dateStr = `${now.getDate()} ${monthsTh[now.getMonth()]} ${now.getFullYear() + 543}, ${timeStr}`;

    const typeBadges = {
      EDIT: 'แก้ไขข้อมูล',
      IMPORT: 'นำเข้าข้อมูล',
      MERGE: 'ผสานรวมไฟล์',
      CONFIG: 'ตั้งค่าระบบ'
    };

    const newLog = {
      id: 'log_custom_' + Date.now(),
      timestamp: now.toISOString(),
      timestampTh: dateStr,
      type: type,
      typeBadge: typeBadges[type] || type,
      badgeClass: type === 'IMPORT' ? 'badge-type-import' : 'badge-type-edit',
      title: title,
      targetSubject: title,
      storageFile: storageFile || 'js/data_wbs.js',
      changeSummary: changeSummary,
      details: details || changeSummary,
      sourceFile: 'บันทึกด้วยตนเองผ่านแดชบอร์ด',
      author: author || 'ผู้ใช้งาน',
      impactLevel: 'บันทึกประวัติการแก้ไขข้อมูลเรียบร้อย'
    };

    if (saveCustomLog(newLog)) {
      window.closeDhAddLogModal();
      if (window.showToast) window.showToast('บันทึกประวัติการแก้ไขข้อมูลสำเร็จ', 'success');
      window.renderDataHistoryTab();
      // Switch to timeline view to see newly added log
      setTimeout(() => {
        const btn = document.getElementById('dhBtnViewTimelineLog');
        if (btn) btn.click();
      }, 50);
    }
  };

  /**
   * Setup Event Listeners for Tab
   */
  function setupDhEventListeners() {
    // 1. Sub-view Switcher (Model Flow vs Timeline vs Storage Files)
    const viewBtns = document.querySelectorAll('.dh-view-tab-btn');
    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.getAttribute('data-dh-view');
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.dh-view-content').forEach(c => c.classList.remove('active'));
        if (targetView === 'model-flow') {
          const el = document.getElementById('dhContentModelFlow');
          if (el) el.classList.add('active');
        } else if (targetView === 'timeline-log') {
          const el = document.getElementById('dhContentTimelineLog');
          if (el) el.classList.add('active');
        } else if (targetView === 'storage-files') {
          const el = document.getElementById('dhContentStorageFiles');
          if (el) el.classList.add('active');
        }
      });
    });

    // 2. Search & Filter in Timeline Log
    const searchInput = document.getElementById('dhLogSearchInput');
    const typeSelect = document.getElementById('dhLogTypeFilter');

    function applyLogFilters() {
      const q = (searchInput ? searchInput.value : '').trim().toLowerCase();
      const type = typeSelect ? typeSelect.value : 'ALL';
      const allLogs = getAllAuditLogs();

      const filtered = allLogs.filter(log => {
        if (type !== 'ALL' && log.type !== type) return false;
        if (q) {
          const str = `${log.title} ${log.changeSummary} ${log.details} ${log.storageFile} ${log.sourceFile} ${log.author} ${log.timestampTh}`.toLowerCase();
          if (!str.includes(q)) return false;
        }
        return true;
      });

      const listContainer = document.getElementById('dhTimelineList');
      const countEl = document.getElementById('dhVisibleLogCount');
      if (listContainer) listContainer.innerHTML = renderTimelineItemsHtml(filtered);
      if (countEl) countEl.innerText = filtered.length;
    }

    if (searchInput) searchInput.addEventListener('input', applyLogFilters);
    if (typeSelect) typeSelect.addEventListener('change', applyLogFilters);

    // 3. Add Manual Log Button
    const btnAddLog = document.getElementById('btnDhAddManualLog');
    if (btnAddLog) {
      btnAddLog.addEventListener('click', window.openDhAddLogModal);
    }

    // 4. Modal Backdrop Clicks
    const modelBackdrop = document.getElementById('dhModelViewModal');
    if (modelBackdrop) {
      modelBackdrop.addEventListener('click', (e) => {
        if (e.target === modelBackdrop) window.closeDhModelModal();
      });
    }

    const addLogBackdrop = document.getElementById('dhAddLogModal');
    if (addLogBackdrop) {
      addLogBackdrop.addEventListener('click', (e) => {
        if (e.target === addLogBackdrop) window.closeDhAddLogModal();
      });
    }
  }

  /**
   * Hook into Live File Import to automatically register new logs
   */
  window.recordLiveImportAuditLog = function (fileName, recordCount, storageFile) {
    const now = new Date();
    const monthsTh = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} น.`;
    const dateStr = `${now.getDate()} ${monthsTh[now.getMonth()]} ${now.getFullYear() + 543}, ${timeStr}`;

    const newLog = {
      id: 'log_live_' + Date.now(),
      timestamp: now.toISOString(),
      timestampTh: dateStr,
      type: 'IMPORT',
      typeBadge: 'นำเข้าไฟล์ใหม่',
      badgeClass: 'badge-type-import',
      title: `นำเข้าไฟล์ ${fileName} สู่ระบบเรียบร้อย`,
      targetSubject: fileName,
      storageFile: storageFile || 'js/data_wbs.js',
      changeSummary: `อ่านข้อมูลจากไฟล์ ${fileName} สำเร็จ ${recordCount ? recordCount.toLocaleString('th-TH') + ' รายการ' : ''}`,
      details: `ไฟล์ ${fileName} ถูกอัปโหลดผ่านหน้าเว็บและบันทึกประวัติการนำเข้าในระบบอัตโนมัติ`,
      sourceFile: fileName,
      author: 'ผู้นำเข้าข้อมูลผ่านหน้าเว็บ',
      impactLevel: 'ข้อมูลในระบบได้รับการอัปเดตเป็นชุดข้อมูลล่าสุด'
    };

    saveCustomLog(newLog);
  };

  // Auto-render on page load so tab content is already in the DOM
  function initDataHistoryOnLoad() {
    if (window.renderDataHistoryTab) {
      try {
        window.renderDataHistoryTab();
      } catch (err) {
        console.error('Error auto-rendering data history tab:', err);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initDataHistoryOnLoad, 80);
    });
  } else {
    setTimeout(initDataHistoryOnLoad, 80);
  }

})();
