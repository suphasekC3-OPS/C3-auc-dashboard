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
      importDate: '2026-10-27 08:06:27',
      importDateTh: '27 ต.ค. 2569, 08:06 น.',
      lastModifiedTh: '27 ต.ค. 2569, 08:06 น. (ไฟล์ล่าสุด)',
      sizeText: '732.0 KB',
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
        'cn41ActualCost (ต้นทุนจริง ไฟล์ 06 ล่าสุด 27 ต.ค. 69)'
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
      name: '06 WBS CN41 มูลค่า AUC ล่าสุด วันที่ 27 ตค 69.xlsx',
      category: 'SAP CN41 AUC Values (Latest)',
      importDate: '2026-10-27 08:09:49',
      importDateTh: '27 ต.ค. 2569, 08:09 น.',
      lastModifiedTh: '27 ต.ค. 2569, 08:09 น. (ไฟล์ล่าสุด)',
      sizeText: '338.1 KB',
      recordCount: 2083,
      status: 'active',
      statusText: 'ผสานข้อมูลสำเร็จ',
      storageFile: 'js/data_wbs.js',
      storageVar: 'window.AUC_WBS_REMAINING_DATA.cn41ActualCost',
      icon: '📑',
      badgeColor: '#F59E0B',
      description: 'รายงาน SAP CN41 ระบุต้นทุนจริงและมูลค่า AUC สะสม (บาท) ของแต่ละโครงการ สำหรับวิเคราะห์มูลค่าสินทรัพย์ระหว่างก่อสร้าง ล่าสุด 27 ต.ค. 69',
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
      id: 'src_07',
      groupNo: '07',
      name: '07 พัสดุค้างเบิก CN52N.xlsx',
      category: 'SAP CN52N Pending Materials',
      importDate: '2026-10-30 07:57:27',
      importDateTh: '30 ต.ค. 2569, 07:57 น.',
      lastModifiedTh: '30 ต.ค. 2569, 07:57 น. (ไฟล์ล่าสุด)',
      sizeText: '5.67 MB',
      recordCount: 68211,
      status: 'active',
      statusText: 'เชื่อม WBS ไฟล์ 03 & 04 สำเร็จ 100%',
      storageFile: 'js/data_materials_07.js',
      storageVar: 'window.AUC_MAT07_COMPACT',
      icon: '📦',
      badgeColor: '#0EA5E9',
      description: 'รายงานพัสดุค้างเบิก SAP CN52N ทั้งหมด เฉพาะ Mvt 281 ทั้งหมด 68,211 รายการ (1,577 งาน WBS, 566 รหัสวัสดุ) เชื่อมกับไฟล์ 03 ผ่านคอลัมน์ องค์ประกอบ WBS และเชื่อมไฟล์ 04 ผ่านคอลัมน์ ข้อกำหนดโครงการ /WBS แสดงในเมนู รายการพัสดุ',
      rulesHtml: `<div style="background:rgba(15,23,42,0.85); border:1px solid rgba(14,165,233,0.35); border-radius:8px; padding:0.65rem 0.85rem; font-size:0.8rem; line-height:1.5;">
  <div style="font-weight:700; color:#38BDF8; margin-bottom:0.45rem; display:flex; align-items:center; gap:0.35rem;">
    <span>📋 เงื่อนไขสรุปการประมวลผล (แสดง / ไม่แสดง ข้อมูลในระบบ):</span>
  </div>
  <div style="display:flex; flex-direction:column; gap:0.45rem;">
    <div style="display:flex; align-items:flex-start; gap:0.45rem; background:rgba(16,185,129,0.12); padding:0.45rem 0.65rem; border-radius:6px; border-left:3px solid #10B981;">
      <span style="color:#10B981; font-weight:800; font-size:0.85rem; flex-shrink:0;">✅ แสดง:</span>
      <div style="color:#E2E8F0;">
        <span style="color:#6EE7B7; font-weight:700;">• รหัสพัสดุเฉพาะหมวด 1*</span> (อุปกรณ์หลักระบบจำหน่าย/สายส่ง/หม้อแปลง 530 รหัส)<br>
        <span style="color:#6EE7B7; font-weight:700;">• เฉพาะ Movement Type 281</span> (เบิกจ่ายพัสดุเข้าโครงการ WBS ก่อสร้าง)<br>
        <span style="color:#6EE7B7; font-weight:700;">• เชื่อมโยง WBS คงเหลือไฟล์ 03</span> (และผูกงบประมาณโครงการไฟล์ 04 ZBUDR064)<br>
        <span style="color:#6EE7B7; font-weight:700;">• ปริมาณค้างเบิก:</span> คำนวณจาก (ต้องการ − เบิกจ่าย − คลัง) หากติดลบคิดเป็น 0
      </div>
    </div>
    <div style="display:flex; align-items:flex-start; gap:0.45rem; background:rgba(239,68,68,0.12); padding:0.45rem 0.65rem; border-radius:6px; border-left:3px solid #EF4444;">
      <span style="color:#EF4444; font-weight:800; font-size:0.85rem; flex-shrink:0;">❌ ไม่แสดง:</span>
      <div style="color:#E2E8F0;">
        <span style="color:#FCA5A5; font-weight:700;">• ไม่แสดงรหัสหมวดอื่นที่ไม่ใช่ 1*</span> (ตัดรหัสหมวด 2*, 9* ออก)<br>
        <span style="color:#FCA5A5; font-weight:700;">• ไม่แสดง Movement Type อื่น</span> (เช่น Mvt 581 คืนพัสดุเข้าโครงการ หรือ Mvt อื่น)<br>
        <span style="color:#FCA5A5; font-weight:700;">• ไม่แสดงพัสดุของงาน WBS ที่ปิดงานแล้ว</span> หรือไม่อยู่ใน 2,083 โครงการคงเหลือของไฟล์ 03
      </div>
    </div>
  </div>
</div>`,
      columns: [
        'วัสดุ (รหัสพัสดุ)', 'องค์ประกอบ WBS', 'โครงข่าย', 'ข้อความวัสดุ', 'โรงงาน', 'จุดขนส/คลง',
        'Mvt.type', 'การสำรอง', 'สถานะ', 'UnE', 'ปริมาณที่ต้องการ', 'ปริมาณการเบิกจ่าย', 'วันต้องการ', 'ราคา/สกุลเงินในปท.'
      ],
      sampleProvider: () => {
        const c = window.AUC_MAT07_COMPACT;
        if (!c || !c.d || !c.r) return [];
        return c.r.slice(0, 5).map(t => ({
          'องค์ประกอบ WBS': c.d.w[t[0]],
          'วัสดุ': c.d.m[t[1]],
          'ข้อความวัสดุ': c.d.md[t[2]],
          'ต้องการ': t[10],
          'เบิกจ่าย': t[11],
          'ราคา (บาท)': Number(t[13] || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })
        }));
      }
    },
{
      id: 'src_08',
      groupNo: '08',
      name: '08 พัสดุคงเหลือ MB52.xlsx',
      category: 'SAP MB52 Warehouse Stock',
      importDate: '2026-10-30 08:02:02',
      importDateTh: '30 ต.ค. 2569, 08:02 น.',
      lastModifiedTh: '30 ต.ค. 2569, 08:02 น. (ไฟล์ล่าสุด)',
      sizeText: '218 KB',
      recordCount: 4038,
      status: 'active',
      statusText: 'เชื่อมพัสดุไฟล์ 07 (รหัสพัสดุ & โรงงาน) สำเร็จ 100%',
      storageFile: 'js/data_materials_08.js',
      storageVar: 'window.AUC_MAT08_STOCK',
      icon: '🏬',
      badgeColor: '#10B981',
      description: 'รายงานปริมาณพัสดุคงเหลือในคลังจาก SAP MB52 รวม 4,038 รายการ (427 รหัสพัสดุ, 7 โรงงาน/Plant) แยกคลัง SLoc 0021 (งบ C) และ SLoc 0022 (งบ I,P) นำมาเชื่อมโยงกับไฟล์ 07 ด้วยรหัสพัสดุและโรงงาน เพื่อแสดงเปรียบเทียบในกราฟแท่งแนวนอนของเมนูรายการพัสดุ',
      rulesHtml: `<div style="background:rgba(15,23,42,0.85); border:1px solid rgba(16,185,129,0.35); border-radius:8px; padding:0.65rem 0.85rem; font-size:0.8rem; line-height:1.5;">
  <div style="font-weight:700; color:#34D399; margin-bottom:0.45rem; display:flex; align-items:center; gap:0.35rem;">
    <span>📋 กฎการเชื่อมโยงและการแสดงผลไฟล์ 08 ในกราฟ:</span>
  </div>
  <div style="display:flex; flex-direction:column; gap:0.45rem;">
    <div style="display:flex; align-items:flex-start; gap:0.45rem; background:rgba(21,128,61,0.15); padding:0.45rem 0.65rem; border-radius:6px; border-left:3px solid #15803D;">
      <span style="color:#4ADE80; font-weight:800; font-size:0.85rem; flex-shrink:0;">🌲 SLoc 0022:</span>
      <div style="color:#E2E8F0;">
        <span style="color:#86EFAC; font-weight:700;">• ปริมาณคงเหลือคงคลัง งบ I, P</span> แทนด้วย <strong>สีกราฟเขียวเข้ม</strong> ในกราฟแนวนอน
      </div>
    </div>
    <div style="display:flex; align-items:flex-start; gap:0.45rem; background:rgba(74,222,128,0.12); padding:0.45rem 0.65rem; border-radius:6px; border-left:3px solid #4ADE80;">
      <span style="color:#86EFAC; font-weight:800; font-size:0.85rem; flex-shrink:0;">🌱 SLoc 0021:</span>
      <div style="color:#E2E8F0;">
        <span style="color:#BBF7D0; font-weight:700;">• ปริมาณคงเหลือคงคลัง งบ C</span> แทนด้วย <strong>สีกราฟเขียวอ่อน</strong> ในกราฟแนวนอน
      </div>
    </div>
    <div style="display:flex; align-items:flex-start; gap:0.45rem; background:rgba(14,165,233,0.12); padding:0.45rem 0.65rem; border-radius:6px; border-left:3px solid #0EA5E9;">
      <span style="color:#38BDF8; font-weight:800; font-size:0.85rem; flex-shrink:0;">🔗 การผูกข้อมูล & ตัวกรอง:</span>
      <div style="color:#E2E8F0;">
        • ผูกกับไฟล์ 07 ด้วย <strong>รหัสพัสดุ (Material)</strong> และ <strong>โรงงาน (Plant)</strong><br>
        • เมื่อมีการเลือกตัวกรอง ปริมาณคงเหลือคงคลังจะแสดงเฉพาะโรงงาน/Plant เดียวกันกับปริมาณคงค้างที่ถูกกรอง ไม่แสดงทุกโรงงาน
      </div>
    </div>
  </div>
</div>`,
      columns: [
        'วัสดุ (รหัสพัสดุ)', 'คำอธิบายวัสดุ', 'Plnt (โรงงาน)', 'SLoc (คลัง)', 'SL', 'แบทช์', 'BUn (หน่วย)', 'ที่ใช้ได้ (ปริมาณ)', 'การส่ง/การโอน', 'ในการตรวจสอบคุณภาพ', 'การใช้ที่จำกัด', 'ระงับ', 'ส่งคืน'
      ],
      sampleProvider: () => {
        const s = window.AUC_MAT08_STOCK;
        if (!s || !Array.isArray(s.entries)) return [];
        return s.entries.slice(0, 6).map(e => ({
          'วัสดุ': e[0],
          'คำอธิบายวัสดุ': e[1],
          'โรงงาน': e[2],
          'หน่วย': e[3],
          'คงคลัง งบ C (0021)': Number(e[4] || 0).toLocaleString('th-TH'),
          'คงคลัง งบ I,P (0022)': Number(e[5] || 0).toLocaleString('th-TH')
        }));
      }
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
      fileSize: '2.36 MB',
      updatedAt: '27 ต.ค. 2569, 08:09 น.',
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
      path: 'js/data_materials_07.js',
      title: 'ฐานข้อมูลรายการพัสดุค้างเบิก CN52N (ไฟล์ 07)',
      role: 'จัดเก็บข้อมูลพัสดุค้างเบิกแบบบีบอัด Dictionary (เฉพาะ Mvt 281, รหัสพัสดุ 1*, เชื่อม WBS ไฟล์ 03 และ 04)',
      recordsCount: '68,211 รายการ (เฉพาะ Mvt 281, 14 คอลัมน์)',
      fileSize: '3.15 MB',
      updatedAt: '30 ต.ค. 2569, 13:57 น.',
      status: '100% ฐานข้อมูลอัปเดตล่าสุด',
      variable: 'window.AUC_MAT07_COMPACT'
    },
{
      path: 'js/data_materials_08.js',
      title: 'ฐานข้อมูลพัสดุคงเหลือในคลัง MB52 (ไฟล์ 08)',
      role: 'จัดเก็บข้อมูลสต็อกคงเหลือในคลัง แยกตามรหัสพัสดุและโรงงาน (SLoc 0021 งบ C, SLoc 0022 งบ I,P)',
      recordsCount: '2,466 รายการจับคู่พัสดุ-โรงงาน (4,038 แถวต้นฉบับ MB52)',
      fileSize: '154 KB',
      updatedAt: '30 ต.ค. 2569, 08:02 น.',
      status: '100% ฐานข้อมูลอัปเดตล่าสุด',
      variable: 'window.AUC_MAT08_STOCK'
    },
    {
      path: 'js/materials.js',
      title: 'โมดูลจัดการเมนู "รายการพัสดุ" & เมนูเลือกคอลัมน์ (03 / 04 / 07)',
      role: 'เชื่อม WBS ไฟล์ 03 -> 07 (องค์ประกอบ WBS) & 04 (ข้อกำหนดโครงการ /WBS), ตัวกรอง, เลือกคอลัมน์ 49 คอลัมน์, ส่งออก CSV',
      recordsCount: '49 คอลัมน์เลือกแสดงได้',
      fileSize: '38 KB',
      updatedAt: '30 ต.ค. 2569, 14:05 น.',
      status: 'อัปเดตล่าสุดวันนี้',
      variable: 'window.renderMaterialsTab'
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
      id: 'log_000_wbs_floating_card_enlarge_target_row_font',
      timestamp: '2026-11-05 12:01:00',
      timestampTh: '5 พ.ย. 2569, 12:01 น.',
      type: 'EDIT',
      typeBadge: 'ขยายขนาดตัวอักษรเป้าหมายเดือน',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มขนาดตัวอักษรคำว่า "เป้าหมายเดือน", ป้ายเดือน และยอดเงินเป้าหมาย ในกล่องลอยสรุป Checkbox สีฟ้า (#wbsTableFloatingSelection)',
      targetSubject: 'แถวเป้าหมายเดือนในกล่องลอยสรุป Checkbox (#wbsFloatingTargetRow)',
      storageFile: 'css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ขยายขนาดฟอนต์ของ .wbs-floating-target-label ("เป้าหมายเดือน"), .wbs-floating-target-month (เดือน) และ .wbs-floating-target-mb (ยอดเงินในการ์ดสีแดง) เป็น 0.88rem ให้อ่านชัดเจนยิ่งขึ้น',
      details: 'css/styles.css: ปรับ .wbs-floating-target-icon เป็น 0.90rem, .wbs-floating-target-label เป็น 0.88rem (font-weight: 700), .wbs-floating-target-month เป็น 0.88rem (padding: 2px 8px) และ .wbs-floating-target-mb เป็น 0.88rem (padding: 2px 8px); อัปเดต Cache Buster ?v=20261105_1201',
      sourceFile: 'คำสั่งผู้ใช้งาน: "เพิ่มขนาดอักษร เป้าหมายเดือน และ เดือน และ เงิน"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (เพิ่มความชัดเจนของตัวอักษรแถวเป้าหมายเดือนในกล่องลอย Checkbox)'
    },
    {
      id: 'log_000_wbs_floating_card_restore_target_red_card',
      timestamp: '2026-11-05 11:56:00',
      timestampTh: '5 พ.ย. 2569, 11:56 น.',
      type: 'EDIT',
      typeBadge: 'คืนค่าการ์ดสีแดงเป้าหมายเดือน',
      badgeClass: 'badge-type-edit',
      title: 'คืนค่ารูปแบบการ์ดสีแดงของยอดเป้าหมายเดือน (#wbsFloatingTargetMb) ในกล่องลอยสรุป Checkbox โดยคงการ์ดสีแดงของปุ่ม "ล้าง" ไว้ตามเดิม',
      targetSubject: 'กล่องลอยสรุปรายการที่เลือกใน Checkbox (#wbsTableFloatingSelection / #wbsFloatingTargetMb)',
      storageFile: 'css/styles.css, index.html, js/data_history.js',
      changeSummary: 'คืนค่า .wbs-floating-target-mb ให้แสดงเป็นการ์ดสีแดงตัวอักษรสีขาว (background: rgba(220, 38, 38, 0.92), border: 1px solid rgba(254, 202, 202, 0.85), color: #FFFFFF) และคงปุ่ม "ล้าง" (.wbs-floating-sel-clear) เป็นการ์ดสีแดงไว้ตามเดิม',
      details: 'css/styles.css: คืนค่า .wbs-floating-target-mb เป็นการ์ดสีแดงขอบสว่างเหมือนเดิม ยกเว้นปุ่มล้างค่า (.wbs-floating-sel-clear) ที่คงการ์ดสีแดงไว้; อัปเดต Cache Buster ?v=20261105_1156',
      sourceFile: 'คำสั่งผู้ใช้งาน: "คืนค่าเดิการ์ดลอย ก่อน ยกเว้นปุ่มล้างค่า / ใช้การ์ดแดง เป้าหมาเยเดือน"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (คืนค่ารูปแบบการ์ดสีแดงของยอดเป้าหมายเดือนในกล่องลอย Checkbox)'
    },
    {
      id: 'log_000_wbs_floating_card_soft_red_target_text',
      timestamp: '2026-11-05 11:51:00',
      timestampTh: '5 พ.ย. 2569, 11:51 น.',
      type: 'EDIT',
      typeBadge: 'ปรับโทนสีแดงสบายตา',
      badgeClass: 'badge-type-edit',
      title: 'ปรับปรุงโทนสีแดงของตัวเลขเป้าหมายเดือน (#wbsFloatingTargetMb) ในกล่องลอยสรุป Checkbox สีฟ้า ให้อ่านชัดเจนและไม่แสบตา',
      targetSubject: 'กล่องลอยสรุปรายการที่เลือกใน Checkbox (#wbsTableFloatingSelection / #wbsFloatingTargetMb)',
      storageFile: 'css/styles.css, index.html, js/data_history.js',
      changeSummary: 'เปลี่ยนสีตัวอักษร #wbsFloatingTargetMb จากสีแดงสด (#FF3B3B) ที่ตัดกับพื้นสีฟ้าแล้วพร่าตา เป็นสีแดงคอรัลสว่างสบายตา (#FCA5A5) ขนาด 0.86rem พร้อมเงาหลังคมชัด (0 1px 2px rgba(0, 0, 0, 0.65))',
      details: 'css/styles.css: ปรับ .wbs-floating-target-mb เป็น color: #FCA5A5; font-size: 0.86rem; font-weight: 800; letter-spacing: 0.2px; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.65); อัปเดต Cache Buster ?v=20261105_1151',
      sourceFile: 'คำสั่งผู้ใช้งาน: "แก้ไขสีแดง มองให้ชัดเจนไม่แสบตา" (ภาพ media_1793853467071_f6ba4bb5.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับโทนสีตัวอักษรเป้าหมายเดือนในกล่องลอย Checkbox ให้อ่านง่ายและสบายตา)'
    },
    {
      id: 'log_000_hide_kpi_target_badges_when_no_work',
      timestamp: '2026-11-05 11:39:00',
      timestampTh: '5 พ.ย. 2569, 11:39 น.',
      type: 'EDIT',
      typeBadge: 'ซ่อนเกณฑ์วัด KPI เมื่อไม่มีงาน',
      badgeClass: 'badge-type-edit',
      title: 'ซ่อนป้ายเกณฑ์วัดเป้าหมาย KPI บนแท่งกราฟ 8 ประเภทเกณฑ์วัด ในกรณีที่เกณฑ์วัดนั้น "ไม่มีงาน" (isNoWork)',
      targetSubject: 'กราฟร้อยละความสำเร็จการปิดงาน (% Closed) แยกตาม 8 ประเภทเกณฑ์วัด (#topCriteriaBarChart)',
      storageFile: 'js/chart.js, js/app.js, index.html, js/data_history.js',
      changeSummary: 'เมื่อแท่งกราฟเกณฑ์วัดใดมีสถานะ "ไม่มีงาน" (isNoWork === true) ระบบจะไม่แสดงป้ายเกณฑ์วัดเป้าหมาย KPI (เช่น KPI ธ.ค. 100.00%, KPI ก.ย. 80.00%) เหนือแท่งกราฟนั้น',
      details: 'js/chart.js (renderBarChart): เพิ่มเงื่อนไข !isNoWork ก่อนวาด barTargetLines และ targetBenchmark; js/app.js: กำหนด barTargetLines: isNoWork ? [] : barTargetLines และ kpiTargets: isNoWork ? [] : kpiTargets; อัปเดต Cache Buster ?v=20261105_1139',
      sourceFile: 'คำสั่งผู้ใช้งาน: "หากไม่มีงาน ไม่ต้องแสดงเกณวัด วงแดง" (ภาพ media_1793852703877_1e208124.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับการแสดงผลกราฟ 8 ประเภทเกณฑ์วัดเมื่อหน่วยงานไม่มีงานในเกณฑ์นั้น)'
    },
    {
      id: 'log_000_wbs_floating_card_target_red_text_and_clear_red_card',
      timestamp: '2026-11-05 11:33:00',
      timestampTh: '5 พ.ย. 2569, 11:33 น.',
      type: 'EDIT',
      typeBadge: 'ปรับแต่งกล่องลอย Checkbox สีฟ้า',
      badgeClass: 'badge-type-edit',
      title: 'ปรับแต่งกล่องลอยสรุป Checkbox (#wbsTableFloatingSelection): นำพื้นหลังการ์ดยอดเป้าหมายเดือนออกและแสดงเป็นตัวอักษรสีแดง พร้อมเพิ่มการ์ดพื้นหลังสีแดงให้ปุ่ม "ล้าง"',
      targetSubject: 'กล่องลอยสรุปการเลือก Checkbox บนตาราง WBS (#wbsTableFloatingSelection / #wbsFloatingTargetMb / #wbsFloatingSelClearBtn)',
      storageFile: 'css/styles.css, index.html, js/data_history.js',
      changeSummary: '1) วงเหลือง (#wbsFloatingTargetMb): นำกรอบการ์ดพื้นหลังออก แสดงเป็นตัวอักษรสีแดง (#FF3B3B) 2) วงแดง (#wbsFloatingSelClearBtn ปุ่ม "ล้าง"): เพิ่มพื้นหลังการ์ดสีแดงและขอบสว่างให้เด่นชัด',
      details: 'css/styles.css: ปรับ .wbs-floating-target-mb เป็น background: transparent !important; border: none !important; color: #FF3B3B; และปรับ .wbs-floating-sel-clear ให้มีพื้นหลังการ์ดสีแดง linear-gradient(135deg, #EF4444 0%, #DC2626 100%) และขอบสีอ่อน; อัปเดต Cache Buster ?v=20261105_1133',
      sourceFile: 'คำสั่งผู้ใช้งาน: "วงเหลือง แก้ไขไม่มีการ์ด และแสดงอักษรสีแดง / วงแดงเพิ่มการ์ดสีแดง" (ภาพ media_1793852499714_797dcd24.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับแต่ง UI กล่องลอยสรุป Checkbox ในแท็บ WBS)'
    },
    {
      id: 'log_000_remove_wbs_checkbox_clear_btn_under_sap_cards',
      timestamp: '2026-11-05 11:31:00',
      timestampTh: '5 พ.ย. 2569, 11:31 น.',
      type: 'EDIT',
      typeBadge: 'นำปุ่มล้าง Checkbox ใต้การ์ด SAP ออก',
      badgeClass: 'badge-type-edit',
      title: 'นำปุ่ม "ล้างข้อมูลที่เลือกจาก Check Box" (#wbsCheckboxClearBtn) ด้านล่างขวาใต้แถบการ์ดสรุปสถานะ SAP ออกตามคำสั่งผู้ใช้งาน',
      targetSubject: 'ส่วนสรุปสถานะ SAP ในหน้าติดตามงาน WBS คงเหลือ (#wbsSapSummarySection)',
      storageFile: 'js/wbs.js, index.html, js/data_history.js',
      changeSummary: 'ลบแถบ .wbs-sap-summary-footer-bar และปุ่ม "ล้างข้อมูลที่เลือกจาก Check Box" ที่อยู่ด้านล่างขวาใต้การ์ดสรุปสถานะ SAP ออก',
      details: 'js/wbs.js (renderWbsSapSummary): นำ footerHtml (.wbs-sap-summary-footer-bar / #wbsCheckboxClearBtn) ออก โดยใช้ container.innerHTML = headerHtml + cardsHtml; อัปเดต Cache Buster ?v=20261105_1131',
      sourceFile: 'คำสั่งผู้ใช้งาน: "เอาออก วงเหลือง" (ภาพ media_1793852437992_81c3c788.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับหน้าตา UI ส่วนการ์ดสรุปสถานะ SAP ในแท็บ WBS)'
    },
    {
      id: 'log_000_wbs_fullscreen_table_header_toolbar_visible',
      timestamp: '2026-11-05 11:29:00',
      timestampTh: '5 พ.ย. 2569, 11:29 น.',
      type: 'EDIT',
      typeBadge: 'เปิดใช้แถบเมนูตารางในโหมดเต็มจอ',
      badgeClass: 'badge-type-edit',
      title: 'แก้ไขโหมดขยายตารางเต็มจอ (.table-card.is-fullscreen) ให้แสดงและใช้งานแถบเมนูหัวตาราง (เกณฑ์วัด, ส่งออก CSV, ซิงค์ Google Sheet, เลือกคอลัมน์, แถวต่อหน้า, ล้างตัวเลือก) ได้ครบทุกปุ่ม',
      targetSubject: 'ตาราง WBS และตารางรายการพัสดุในโหมดขยายเต็มจอ (#wbsTableCard.is-fullscreen / .table-header-bar)',
      storageFile: 'css/styles.css, index.html, js/data_history.js',
      changeSummary: 'แก้ไขระยะขอบบน (padding-top) ของ .table-card.is-fullscreen ไม่ให้ถูกแถบตัวกรองบนสุด (#topStickyFilterBar) บังแถบเมนูหัวตาราง พร้อมเปิดแสดงป้ายเกณฑ์วัด (.wbs-table-active-criteria) และกำหนด z-index ให้เมนูเลือกคอลัมน์แสดงทับหัวตารางได้อย่างสมบูรณ์ในโหมดเต็มจอ',
      details: 'css/styles.css: (1) แก้ไข .table-card.is-fullscreen กำหนด padding: calc(54px + 0.65rem) 1.25rem 0.65rem 1.25rem !important; เพื่อไม่ให้ #topStickyFilterBar บังแถบ .table-header-bar (2) เปลี่ยน .table-card.is-fullscreen .wbs-table-active-criteria เป็น display: inline-flex !important; (3) กำหนด position: relative !important; z-index: 500 !important; บน .table-card.is-fullscreen .table-header-bar เพื่อให้ป๊อปอัปเลือกคอลัมน์ลอยอยู่เหนือหัวตาราง; อัปเดต Cache Buster ?v=20261105_1129',
      sourceFile: 'คำสั่งผู้ใช้งาน: "ใช้เมนูวงเหลือง ในหน้า จอขยายเต็มจอด้วย" (ภาพ media_1793852356242_faae5556.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ทำให้แถบเมนูหัวตารางและตัวกรองคอลัมน์ทั้งหมดใช้งานได้ในหน้าจอขยายเต็มจอ)'
    },
    {
      id: 'log_000_mat_file07_08_dates_readonly_nonclickable',
      timestamp: '2026-11-05 11:09:00',
      timestampTh: '5 พ.ย. 2569, 11:09 น.',
      type: 'EDIT',
      typeBadge: 'ตั้งค่าวันที่ไฟล์แสดงอย่างเดียว',
      badgeClass: 'badge-type-edit',
      title: 'ปรับข้อความวันที่แก้ไขล่าสุดของไฟล์ค้างเบิกพัสดุและไฟล์คงเหลือพัสดุ (#matHChartFileDates) ให้แสดงอย่างเดียว กดคลิกอะไรไม่ได้',
      targetSubject: 'การ์ดตัวกรองรายการที่พบพัสดุ (#matSubFilterBar / #matHChartFileDates)',
      storageFile: 'js/materials.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'นำ onclick และเอฟเฟกต์ปุ่มกดออกจากข้อความ "ไฟล์ค้างเบิกพัสดุ แก้ไขล่าสุด: 30 ต.ค. 69 | ไฟล์คงเหลือพัสดุ แก้ไขล่าสุด: 30 ต.ค. 69" พร้อมกำหนด pointer-events: none; cursor: default; ให้แสดงเป็นข้อความเพียงอย่างเดียว ไม่สามารถกดคลิกได้',
      details: 'js/materials.js (ensureMaterialsDomBuilt): ลบ onclick="if(window.openDhModelModal)..." และ title ออกจาก .mat-hchart-fdate-item; css/styles.css: กำหนด pointer-events: none; cursor: default; ใน .mat-top-file-dates-bar และ .mat-hchart-fdate-item และลบเอฟเฟกต์ hover; อัปเดต Cache Buster ?v=20261105_1109',
      sourceFile: 'คำสั่งผู้ใช้งาน: "แสดงอย่างเดียว กดอะไรไมาได้" (ภาพ media_1793851020936_3120250d.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับสถานะข้อความวันที่แก้ไขไฟล์ให้แสดงอย่างเดียว ไม่สามารถคลิกได้)'
    },
    {
      id: 'log_000_mat_budget_filter_sync_wh_stock_and_table',
      timestamp: '2026-11-05 11:02:00',
      timestampTh: '5 พ.ย. 2569, 11:02 น.',
      type: 'EDIT',
      typeBadge: 'ซิงค์ตัวกรองงบกับเหลือคลัง & ตารางล่าง',
      badgeClass: 'badge-type-edit',
      title: 'อัปเดตตัวกรองปุ่มค้างเบิก งบ I, P (สีแดงเข้ม) / งบ C (สีส้มอ่อน) ให้เปลี่ยนยอด "เหลือคลัง" ในตารางแต่ละคลังพัสดุ และกรองตารางด้านล่างตามงบที่เลือก',
      targetSubject: 'หน้ารายการพัสดุ (#matHChartCard / #matWhStandaloneCard / #matTableCard)',
      storageFile: 'js/materials.js, index.html, js/data_history.js',
      changeSummary: 'เมื่อคลิกเลือกปุ่ม "ค้างเบิก งบ I, P (สีแดงเข้ม)" หรือ "ค้างเบิก งบ C (สีส้มอ่อน)" นอกจากจะกรองกราฟและยอดค้างเบิกคลังแล้ว จะอัปเดตคอลัมน์ "เหลือคลัง" ของทั้ง 6 คลัง (แยกตาม SLoc 0022 งบ I,P หรือ SLoc 0021 งบ C) และกรองรายการในตารางด้านล่างให้แสดงเฉพาะงบที่เลือกทันที',
      details: 'js/materials.js: (1) getFilteredMaterialRows() กรองด้วย activeBudgetFilter (IP หรือ C) แม้ยังไม่ได้คลิกเลือกรายการวัสดุเดี่ยว เพื่อให้ตารางด้านล่างเปลี่ยนตามปุ่มงบที่เลือกทันที (2) renderMatWarehouseSummary() คำนวณยอดคงคลังรวมรายคลังแยกตาม SLoc 0022 (stockIp) และ SLoc 0021 (stockC) เมื่อเลือกปุ่มงบ IP หรือ C โดยไม่ต้องเลือกรายการพัสดุเดี่ยว พร้อมเปลี่ยนป้ายหัวคอลัมน์เป็น "คงคลัง SLoc 0022" หรือ "คงคลัง SLoc 0021" (3) renderMaterialsTab() แสดงป้ายสถานะงบที่เลือกและปุ่มล้างตัวกรองงบในหัวตารางด้านล่าง; อัปเดต Cache Buster ?v=20261105_1102',
      sourceFile: 'คำสั่งผู้ใช้งาน: "เลือก ค้างเบิก สีส้ม / สีแดง ให้ ตารางแต่ละคลังคงเหลือเปลร่ยนด้วย และตารางด้านล่าง" (ภาพ media_1793850901304_89f665aa.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ซิงค์ตัวกรองงบ I,P / งบ C ครบทั้งกราฟ ตารางคลังพัสดุฝั่งเหลือคลัง และตารางรายการพัสดุด้านล่าง)'
    },
    {
      id: 'log_000_move_mat_file07_08_dates_inside_filter_card',
      timestamp: '2026-11-05 10:54:00',
      timestampTh: '5 พ.ย. 2569, 10:54 น.',
      type: 'EDIT',
      typeBadge: 'ย้ายวันที่ไฟล์เข้าการ์ดตัวกรอง',
      badgeClass: 'badge-type-edit',
      title: 'ย้ายข้อความวันที่แก้ไขล่าสุดของไฟล์ค้างเบิกพัสดุและไฟล์คงเหลือพัสดุ เข้าไปแสดงด้านบนสุดภายในกรอบการ์ดตัวกรองรายการที่พบพัสดุ (#matSubFilterBar)',
      targetSubject: 'การ์ดตัวกรองรายการที่พบพัสดุ (#matSubFilterBar / #matHChartFileDates)',
      storageFile: 'js/materials.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'นำข้อความ "ไฟล์ค้างเบิกพัสดุ แก้ไขล่าสุด: 30 ต.ค. 69 | ไฟล์คงเหลือพัสดุ แก้ไขล่าสุด: 30 ต.ค. 69" เข้าไปแสดงเป็นบรรทัดบนสุดภายในการ์ดตัวกรองรายการที่พบพัสดุ (#matSubFilterBar)',
      details: 'js/materials.js (ensureMaterialsDomBuilt): ย้าย #matHChartFileDates เข้าเป็นลูกตัวแรกภายใน #matSubFilterBar; css/styles.css: กำหนด .mat-top-file-dates-bar (flex: 0 0 100%; width: 100%) แสดงแถวบนสุดในการ์ดตัวกรอง; อัปเดต Cache Buster ?v=20261105_1054',
      sourceFile: 'คำสั่งผู้ใช้งาน: "แสดงในการ์ด"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (จัดวางข้อความวันที่แก้ไขไฟล์ไว้บรรทัดบนสุดภายในการ์ดตัวกรอง)'
    },
    {
      id: 'log_000_move_mat_file07_08_dates_above_filter',
      timestamp: '2026-11-05 10:51:00',
      timestampTh: '5 พ.ย. 2569, 10:51 น.',
      type: 'EDIT',
      typeBadge: 'ย้ายวันที่ไฟล์ไว้บนตัวกรอง',
      badgeClass: 'badge-type-edit',
      title: 'ย้ายตำแหน่งข้อความวันที่แก้ไขล่าสุดของไฟล์ค้างเบิกพัสดุและไฟล์คงเหลือพัสดุ ไปไว้ด้านบนแถบตัวกรองรายการที่พบพัสดุ (#matSubFilterBar)',
      targetSubject: 'หน้ารายการพัสดุ (#tab-materials / #matHChartFileDates / #matSubFilterBar)',
      storageFile: 'js/materials.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ย้ายข้อความ "ไฟล์ค้างเบิกพัสดุ แก้ไขล่าสุด: 30 ต.ค. 69 | ไฟล์คงเหลือพัสดุ แก้ไขล่าสุด: 30 ต.ค. 69" จากหัวการ์ดกราฟขึ้นไปแสดงที่บรรทัดด้านบนของแถบตัวกรองรายการที่พบพัสดุ ตามลูกศรชี้ในภาพผู้ใช้งาน',
      details: 'js/materials.js (ensureMaterialsDomBuilt): ย้าย #matHChartFileDates (.mat-top-file-dates-bar) ไปวางเหนือ #matSubFilterBar; css/styles.css: เพิ่ม .mat-top-file-dates-bar จัดวางเป็นตัวอักษรล้วนเหนือกล่องตัวกรอง; อัปเดต Cache Buster ?v=20261105_1051',
      sourceFile: 'คำสั่งผู้ใช้งาน: "ย้ายตำแหน่งไว้ บนตัวกรอง" (ภาพ media_1793850557729_8ebf880e.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับตำแหน่งการแสดงวันที่แก้ไขไฟล์ต้นทางในหน้ารายการพัสดุ)'
    },
    {
      id: 'log_000_mat_hchart_rename_file07_08_labels',
      timestamp: '2026-11-05 10:44:00',
      timestampTh: '5 พ.ย. 2569, 10:44 น.',
      type: 'EDIT',
      typeBadge: 'เปลี่ยนชื่อไฟล์ค้างเบิก & คงเหลือพัสดุ',
      badgeClass: 'badge-type-edit',
      title: 'เปลี่ยนข้อความแสดงชื่อไฟล์บนหัวกราฟรายการพัสดุจาก "ไฟล์ 07 / ไฟล์ 08" เป็น "ไฟล์ค้างเบิกพัสดุ / ไฟล์คงเหลือพัสดุ"',
      targetSubject: 'ส่วนหัวการ์ดกราฟรายการพัสดุ (#matHChartFileDates)',
      storageFile: 'js/materials.js, index.html, js/data_history.js',
      changeSummary: 'เปลี่ยนข้อความจาก "ไฟล์ 07 แก้ไขล่าสุด: 30 ต.ค. 69 | ไฟล์ 08 แก้ไขล่าสุด: 30 ต.ค. 69" เป็น "ไฟล์ค้างเบิกพัสดุ แก้ไขล่าสุด: 30 ต.ค. 69 | ไฟล์คงเหลือพัสดุ แก้ไขล่าสุด: 30 ต.ค. 69"',
      details: 'js/materials.js (ensureMaterialsDomBuilt): ปรับข้อความใน #matHChartFileDates เป็น "ไฟล์ค้างเบิกพัสดุ แก้ไขล่าสุด: ..." และ "ไฟล์คงเหลือพัสดุ แก้ไขล่าสุด: ..."; อัปเดต Cache Buster ?v=20261105_1044',
      sourceFile: 'คำสั่งผู้ใช้งาน: "แก้ไขชื่อ ไฟล์07 เป็น ไฟล์ค้างเบิกพัสดุ / ไฟล์ 08 เป็น ไฟล์คงเหลือพัสดุ"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับชื่อเรียกไฟล์บนหัวกราฟพัสดุให้เข้าใจง่ายขึ้น)'
    },
    {
      id: 'log_000_mat_hchart_file07_08_plain_text_fixed_top',
      timestamp: '2026-11-05 10:40:00',
      timestampTh: '5 พ.ย. 2569, 10:40 น.',
      type: 'EDIT',
      typeBadge: 'ปรับวันที่ไฟล์ 07 & 08 เป็นตัวอักษร',
      badgeClass: 'badge-type-edit',
      title: 'ปรับการแสดงวันที่แก้ไขล่าสุดของไฟล์ 07 และไฟล์ 08 เป็นตัวอักษรล้วน (ไม่มีกรอบการ์ด) และล็อคไว้ที่บรรทัดบนสุดเสมอ',
      targetSubject: 'ส่วนหัวการ์ดกราฟรายการพัสดุ (#matHChartCard / #matHChartFileDates)',
      storageFile: 'js/materials.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'นำกรอบและพื้นหลังการ์ดออกจากวันที่แก้ไขไฟล์ 07 และ 08 ให้แสดงเป็นตัวอักษรล้วน "ไฟล์ 07 แก้ไขล่าสุด: 30 ต.ค. 69 | ไฟล์ 08 แก้ไขล่าสุด: 30 ต.ค. 69" พร้อมล็อค (flex-wrap: nowrap) ให้อยู่บรรทัดบนสุดเสมอ',
      details: 'js/materials.js: แสดงข้อความล้วนใน #matHChartFileDates; css/styles.css: กำหนด .mat-hchart-top-row (flex-wrap: nowrap) และ .mat-hchart-file-dates (background: transparent; border: none; flex: 0 0 auto; white-space: nowrap); อัปเดต Cache Buster ?v=20261105_1040',
      sourceFile: 'คำสั่งผู้ใช้งาน: "แสดงเป็นตัวอักษร ไม่ต้องมีการ์ด fixไว้บรรทัดบนสุด"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับรูปแบบการแสดงผลวันที่แก้ไขไฟล์ 07 & 08 บนหัวกราฟ)'
    },
    {
      id: 'log_000_mat_hchart_file07_08_dates_top_row',
      timestamp: '2026-11-05 10:35:00',
      timestampTh: '5 พ.ย. 2569, 10:35 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มวันที่แก้ไขไฟล์ 07 & 08',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มการแสดงวันที่แก้ไขล่าสุดของไฟล์ 07 และไฟล์ 08 บนบรรทัดบนสุด (ฝั่งขวา) ของการ์ดกราฟปริมาณค้างเบิกรายการพัสดุ',
      targetSubject: 'ส่วนหัวการ์ดกราฟรายการพัสดุ (#matHChartCard / #matHChartFileDates)',
      storageFile: 'js/materials.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'เพิ่มป้ายแสดงวันที่แก้ไขล่าสุดของไฟล์ 07 (30 ต.ค. 69) และไฟล์ 08 (30 ต.ค. 69) ไว้ที่มุมขวาบนของบรรทัดแรกในการ์ดกราฟปริมาณค้างเบิก > 0 แยกตามรายการพัสดุ พร้อมคลิกเปิดดูผัง Model View ได้ทันที',
      details: 'js/materials.js: เพิ่ม .mat-hchart-top-row และ #matHChartFileDates ดึงค่าจาก window.AUC_MAT07_COMPACT.meta และ window.AUC_MAT08_STOCK.meta; css/styles.css: เพิ่มสไตล์ .mat-hchart-top-row, .mat-hchart-file-dates, .mat-hchart-fdate-item (.badge-07 / .badge-08) รองรับทั้งโหมดมืดและสว่าง; อัปเดต Cache Buster ?v=20261105_1035',
      sourceFile: 'คำสั่งผู้ใช้งาน: "เพิ่มการแสดงวันที่แก้ไข ไฟล์ 07 และ 08 วงเหลือง บรรทัดบน" (ภาพ media_1793849369291_90c048c5.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (เพิ่มการแสดงผลวันที่แก้ไขไฟล์ข้อมูลต้นทางบนหัวกราฟพัสดุ)'
    },
    {
      id: 'log_000_restore_materials_css_and_fix',
      timestamp: '2026-11-05 09:55:00',
      timestampTh: '5 พ.ย. 2569, 09:55 น.',
      type: 'EDIT',
      typeBadge: 'คืนค่าเมนูรายการพัสดุ',
      badgeClass: 'badge-type-edit',
      title: 'กู้คืนและคืนค่าการแสดงผลเมนูรายการพัสดุ (#tab-materials) และชุดสไตล์ CSS ที่ถูกตัดท้ายไฟล์ให้กลับมาใช้งานได้ครบถ้วน 100%',
      targetSubject: 'เมนูรายการพัสดุ (#tab-materials) และไฟล์ css/styles.css',
      storageFile: 'css/styles.css, index.html, js/data_history.js',
      changeSummary: 'กู้คืนกฎ CSS ช่วงท้ายไฟล์ css/styles.css (.mat-hchart-scroll, .mat-hchart-row, .mat-hchart-bar, .mat-wh-standalone-card, .mat-wh-table, .mat-sf-wbs-stats-wrapper และโหมด Light Theme) ที่ถูกตัดทอนจากขีดจำกัด 512 KB พร้อมบีบอัดขนาดไฟล์ให้อยู่ที่ ~486 KB เพื่อป้องกันการถูกตัดซ้ำ',
      details: 'css/styles.css: กู้คืนคลาสสไตล์ทั้งหมดของกราฟแท่งแนวนอนรายการพัสดุ ตารางสรุป 6 คลังพัสดุ แผงตัวกรองย่อย 3 แถว และโหมดธีมสว่าง พร้อมลดขนาดไฟล์จาก 512 KB เหลือ 486.6 KB; ตรวจสอบการทำงานของเมนูรายการพัสดุและเมนูแก้ไขข้อมูลครบทุกส่วน; อัปเดต Cache Buster ?v=20261105_0955',
      sourceFile: 'คำสั่งผู้ใช้งาน: "แก้ไขข้อมูลใช้ไม่ได้  เมนูรายการพัสดุ ให้คืนค่า"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง (คืนค่าการแสดงผลและการใช้งานเมนูรายการพัสดุทั้งหมด)'
    },
    {
      id: 'log_000_wbs_total_diff_unit_mb',
      timestamp: '2026-11-05 09:03:00',
      timestampTh: '5 พ.ย. 2569, 09:03 น.',
      type: 'EDIT',
      typeBadge: 'ปรับหน่วยแสดงผล ลบ.',
      badgeClass: 'badge-type-edit',
      title: 'แก้ไขหน่วยแสดงผล "ส่วนต่าง" ในการ์ดภาพรวมมูลค่าทั้งหมด (หน้า WBS) จาก บาท (฿) เป็น ล้านบาท (ลบ.)',
      targetSubject: 'การ์ด #wbsExecutiveDonutKpiCard (#wbsKpiTotalIncSubText)',
      storageFile: 'js/wbs.js, index.html, js/data_history.js',
      changeSummary: 'เปลี่ยนการแสดงผลส่วนต่างในกล่องภาพรวมมูลค่าทั้งหมด จากหน่วยบาท (฿) เป็นหน่วยล้านบาท (ลบ.) ทศนิยม 2 ตำแหน่ง ให้สอดคล้องกับ "เดิม ... ลบ."',
      details: 'js/wbs.js (syncWbsSideKpiCard): คำนวณ (totalCostInc / 1e6).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) พร้อมแสดงหน่วย "ลบ." ใน #wbsKpiTotalIncSubText และแสดงยอดเต็มเป็นบาทใน tooltip; อัปเดต Cache Buster ?v=20261105_0903',
      sourceFile: 'คำสั่งผู้ใช้งาน: "แก้ไขเป็บหน่วย ลบ." (ภาพ media_1793843347259_8a5dd5d2.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับหน่วยการแสดงผลตัวเลข)'
    },
    {
      id: 'log_000_swap_kpi_btn_strip_and_pin_225588',
      timestamp: '2026-11-05 08:50:00',
      timestampTh: '5 พ.ย. 2569, 08:50 น.',
      type: 'EDIT',
      typeBadge: 'สลับตำแหน่ง & เปลี่ยนรหัสผ่าน',
      badgeClass: 'badge-type-edit',
      title: 'สลับตำแหน่งแถบเกณฑ์/เดือน/พื้นที่ กับปุ่ม "เกณฑ์ KPI ที่แสดง" และเปลี่ยนรหัสผ่านแผงเกณฑ์ KPI เป็น 225588',
      targetSubject: 'ส่วนหัวการ์ดกราฟ % Closed (#topCriteriaChartCard) และแผงตั้งค่าเดือนเกณฑ์ KPI',
      storageFile: 'index.html, css/styles.css, js/app.js, js/data_history.js',
      changeSummary: '1) ปุ่ม "เกณฑ์ KPI ที่แสดง" ย้ายไปบรรทัดบนสุดฝั่งขวา และแถบ เกณฑ์ที่เลือก/ประจำเดือน/พื้นที่ ย้ายลงบรรทัดที่สองฝั่งซ้าย 2) เปลี่ยนรหัสผ่านเปิดแผงเกณฑ์ KPI จาก 229955 เป็น 225588',
      details: 'index.html: จัดลำดับ title → ปุ่ม → .criteria-hdr-row-break → แถบ #criteriaChartTopSelectionStrip; css/styles.css: .btn-kpi-badge-cfg margin-left:auto, .criteria-chart-top-sel-strip margin-right:auto, เพิ่ม .criteria-hdr-row-break (flex-basis:100%); js/app.js: KPI_BADGE_CFG_PIN = "225588"; อัปเดต Cache Buster ?v=20261105_0850',
      sourceFile: 'คำสั่งผู้ใช้งาน: "สลับตำแหน่ง วงแดง วงเหลือง / แก้ไขรหัสผ่าน เกณ KPI ที่แสดง เป็น 225588" (ภาพ media_1793843068287_c6fb171d.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (จัดเลย์เอาต์และเปลี่ยนรหัสผ่านแผงตั้งค่า)'
    },
    {
      id: 'log_000_remove_wbs_header_gsheet_date',
      timestamp: '2026-11-05 08:48:00',
      timestampTh: '5 พ.ย. 2569, 08:48 น.',
      type: 'EDIT',
      typeBadge: 'ปรับส่วนหัวการ์ด WBS',
      badgeClass: 'badge-type-edit',
      title: 'เอาข้อความ Google Sheet (ซิงค์ล่าสุด) ออกจากส่วนหัวการ์ด WBS (กรอบแดง)',
      targetSubject: 'ส่วนหัวการ์ด "กอง/กฟฟ. ที่มีงาน WBS คงเหลือ" (#wbsHeaderDatesPlain)',
      storageFile: 'index.html, js/data_history.js',
      changeSummary: 'ลบคอลัมน์ Google Sheet พร้อมเส้นคั่น ออกจากส่วนหัว เหลือเฉพาะ สถานะ SAP และ มูลค่า AUC(บาท)',
      details: 'index.html: ลบ .wbs-hdr-date-col#wbsHdrSheetSyncCol และ .wbs-hdr-date-divider ที่เกี่ยวข้อง; js/wbs.js (updateSyncButtonStatusUI) มีการตรวจ null ของ #wbsHdrSheetSyncTime อยู่แล้ว จึงไม่เกิดข้อผิดพลาด; ปุ่มซิงค์ Google Sheet อื่นยังใช้งานได้ตามเดิม; อัปเดต Cache Buster ?v=20261105_0848',
      sourceFile: 'คำสั่งผู้ใช้งาน: "วงแดงเอาออก" (ภาพ media_1793842766920_f414cae9.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ซ่อนข้อความแสดงผลเท่านั้น)'
    },
    {
      id: 'log_000_wbs_side_kpi_card_font_increase',
      timestamp: '2026-11-05 08:45:00',
      timestampTh: '5 พ.ย. 2569, 08:45 น.',
      type: 'EDIT',
      typeBadge: 'ปรับขนาดอักษร UI',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มขนาดอักษรการ์ดภาพรวมมูลค่า & งาน AUC (กรอบแดง) หน้า WBS',
      targetSubject: 'การ์ด #wbsExecutiveDonutKpiCard: หัวข้อ "ภาพรวมมูลค่าทั้งหมด" / "มูลค่าปิดงานแล้ว", ตัวเลขมูลค่า, บรรทัด เดิม / +SAP, และ "เดิม ... | +SAP ..." ใต้ % ปิดงาน',
      storageFile: 'css/styles.css, index.html, js/data_history.js',
      changeSummary: 'เพิ่มขนาดอักษรในกรอบแดง 4 จุด เพื่อให้อ่านง่ายขึ้น',
      details: 'css/styles.css: .wbs-box-title-wrap 0.74→0.88rem (ไอคอน 0.85→1rem), .wbs-val-prefix 0.60→0.74rem, .wbs-val-number 0.63→0.82rem, .wbs-box-sub 0.67→0.80rem, .wbs-pct-breakdown-tag 0.66→0.82rem; อัปเดต Cache Buster ?v=20261105_0845',
      sourceFile: 'คำสั่งผู้ใช้งาน: "เพิ่มขนาดอักษร วงแดง" (ภาพ media_1793842712485_89fc0160.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับขนาดอักษรเท่านั้น)'
    },
    {
      id: 'log_000_kpi_badge_month_picker_12m',
      timestamp: '2026-11-05 08:42:00',
      timestampTh: '5 พ.ย. 2569, 08:42 น.',
      type: 'EDIT',
      typeBadge: 'เลือกเดือนเกณฑ์ KPI บนกราฟ',
      badgeClass: 'badge-type-edit',
      title: 'กราฟ 8 เกณฑ์วัด: เพิ่มปุ่มเลือกเดือนเกณฑ์ KPI ที่แสดง (Checkbox 12 เดือน / ปุ่มซ่อน-รหัสผ่าน / Save แสดงเวลาล่าสุด) และเอาดาวออกจากกราฟ',
      targetSubject: 'กราฟ "ร้อยละความสำเร็จการปิดงาน (% Closed) แยกตาม 8 ประเภทเกณฑ์วัด" (#criteriaComparisonChart / #topCriteriaChartCard)',
      storageFile: 'js/app.js, js/chart.js, index.html, css/styles.css, js/data_history.js',
      changeSummary: 'ดำเนินการ 3 ส่วน: 1) เอาดาว (★) ออกจากกราฟแท่ง และยกเลิกการแสดงเดือน ก.ย.69 เหนือ % ปิดงาน 2) แสดงเกณฑ์/เดือน/พื้นที่ที่เลือกบนบรรทัดบนสุดของการ์ดกราฟ 3) เพิ่มปุ่ม "เกณฑ์ KPI ที่แสดง" ให้ติ๊กเลือกเดือนที่ต้องการแสดงป้าย KPI ได้ทั้ง 12 เดือน',
      details: '1) js/chart.js (drawBarChart): ลบการวาดดาว/ข้อความเดือนเหนือป้าย % ปิดงาน ทั้ง 2 ตำแหน่ง; js/app.js: ลบรายการ legend ดาว 2) index.html/css/styles.css: เพิ่ม #criteriaChartTopSelectionStrip ในบรรทัดบนสุดของ #topCriteriaChartCard และ updateTopSelectionDisplay() อัปเดตค่าพร้อมกัน 3) js/app.js: เพิ่ม getKpiBadgeMonths() / window.renderKpiBadgeCfgPanel() / handleKpiBadgeMonthChange() / setAllKpiBadgeMonths() / saveKpiBadgeMonthsFromUI() / hideKpiBadgeCfg() — แผงตั้งค่า Checkbox 12 เดือน (กราฟเปลี่ยนทันที), ปุ่ม Save จำค่าใน localStorage (PEA_AUC_KPI_BADGE_MONTHS_V1) พร้อมแสดงเวลาบันทึกล่าสุด, ปุ่มซ่อนล็อกแผง ต้องใส่รหัสผ่านเพื่อเปิด (context kpi_badge ใน Admin PIN modal); renderCriteriaComparisonBar() สร้างป้าย KPI ตามเดือนที่เลือก (ค่าเริ่มต้นอัตโนมัติ = เดือนที่เลือก + 2 เดือนถัดไป + ธ.ค.) และรวมป้ายที่ค่าเท่ากัน; อัปเดต Cache Busters ?v=20261105_0842',
      sourceFile: 'คำสั่งผู้ใช้งาน: "ให้เอาดาวที่กราฟออก" และ "แก้ไขเกณฑ์ KPI ที่แสดง ให้มีปุ่มเลือกเดือนได้ ... Checkbox 12 เดือน / ปุ่มซ่อน / Save แสดงเวลาล่าสุด" (ภาพ media_1793842184784_177c99db.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับการแสดงผลกราฟและเพิ่มฟังก์ชันตั้งค่า)'
    },
    {
      id: 'log_000_top_return_normal_screen_button',
      timestamp: '2026-11-03 16:32:00',
      timestampTh: '3 พ.ย. 2569, 16:32 น.',
      type: 'EDIT',
      typeBadge: 'ปุ่มคืนหน้าจอปกติสีสวย',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มปุ่ม \"คืนหน้าจอปกติ\" ดีไซน์หรูหราสีสวยงามในแถบตัวกรองบนสุด (แสดงเฉพาะหน้าจอขยายเต็มจอ)',
      targetSubject: 'แถบตัวกรองบนสุด (#topStickyFilterBar / .top-unified-filters-inner) ติดกับปุ่มรีเซ็ต และสไตล์ปุ่ม #btnTopReturnNormalScreen',
      storageFile: 'index.html, css/styles.css, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน \"เพิ่มปุ่ม คืนหน้าจอปกติ สีสวยๆ\" พร้อมภาพประกอบระบุกรอบสีเหลืองติดกับปุ่มรีเซ็ตในแถบตัวกรองบนสุดขณะขยายตารางเต็มจอ: 1) เพิ่มปุ่ม #btnTopReturnNormalScreen ลงใน .top-unified-filters-inner ต่อท้ายปุ่มรีเซ็ต 2) ออกแบบสีสันสวยงามหรูหราด้วยเฉดสีม่วงอเมทิสต์ประกายฟูเชีย (Royal Purple-Fuchsia #7C3AED - #9333EA - #C026D3) พร้อมขอบทองพรีเมียม (#FFD700) และแสงเงาเปล่งประกายสีทอง/ม่วง (Golden Amethyst Glow) 3) กำหนดให้แสดงผลเฉพาะเมื่อขยายเต็มจอ (body.has-fullscreen-table / body.has-fullscreen-chart) เท่านั้น และซ่อนอย่างเรียบร้อยในหน้าจอหลักตามมาตรฐาน 4) เมื่อคลิกจะย่อขนาดกลับสู่หน้าจอปกติทันที',
      details: '1) ใน index.html: เพิ่มปุ่ม <button type=\"button\" class=\"btn btn-sm btn-return-normal-top\" id=\"btnTopReturnNormalScreen\" onclick=\"window.returnToNormalScreen()\"> พร้อม SVG ย่อหน้าจอและข้อความ \"คืนหน้าจอปกติ\" ใน .top-unified-filters-inner ต่อท้าย #btnResetFilters 2) ใน css/styles.css: กำหนดสไตล์ปุ่มแคปซูลขนาดเท่าปุ่มรีเซ็ต รัศมี 12px พื้นหลัง linear-gradient(135deg, #7C3AED 0%, #9333EA 45%, #C026D3 100%), ขอบทอง 1.5px solid #FFD700, แสงเรือง pulseReturnNormalGlow, และเอฟเฟกต์ hover ยกตัวขึ้นพร้อมแสงเงาสีม่วง-ทอง 3) ซ่อนปุ่มลอยเดิมที่เคยตรึง fixed บนหัวตารางเพื่อความสะอาดเรียบร้อย 4) อัปเดต Version Cache Busters ใน index.html เป็น 20261103_1632 5) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน: เพิ่มปุ่ม คืนหน้าจอปกติ สีสวยๆ (ภาพ media_1793695048302_fdb22f5f.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_dark_red_and_soft_orange',
      timestamp: '2026-11-03 16:07:00',
      timestampTh: '3 พ.ย. 2569, 16:07 น.',
      type: 'EDIT',
      typeBadge: 'ปรับสีแดงเข้ม & ส้มอ่อน',
      badgeClass: 'badge-type-edit',
      title: 'ปรับปรุงชุดสีค้างเบิก: เปลี่ยนสีแดงเป็นสีแดงเข้ม (งบ I, P) และเปลี่ยนสีส้มสะท้อนแสงเป็นสีส้มอ่อน (งบ C)',
      targetSubject: 'แถบสีแท่งกราฟ ป้ายกำกับคำอธิบาย และตัวเลขค้างเบิกในกราฟแนวนอน (#matHChartCard) และการ์ดคลัง (#matWhStandaloneCard)',
      storageFile: 'css/styles.css, js/materials.js, js/data_history.js, index.html',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน: \"แก้ไขสีส้มสะท้อนแสง เป็นสีส้มอ่อน\" และ \"แก้ไขสีแดง เป็นสีแดงเข็ม\" โดยปรับโทนสีแดงของงบ I, P ให้เป็นสีแดงเข้ม (Deep Crimson #991B1B - #B91C1C) และปรับโทนสีส้มของงบ C จากสีส้มสะท้อนแสงนีออนเดิม ให้เป็นสีส้มอ่อนนุ่มนวล (Soft Warm Peach/Apricot #EA580C - #FB923C - #FED7AA) พร้อมปรับป้ายสัญลักษณ์ Legend และเอฟเฟกต์ Glow ทั้งหมดให้สอดคล้องกัน',
      details: '1) ใน css/styles.css: ปรับ .mat-hchart-bar.bar-red เป็น linear-gradient(90deg, #991B1B 0%, #B91C1C 60%, #C5221F 100%), ปรับ .lg-red และ .mat-budget-pill.pill-red เป็นโทนแดงเข้ม #B91C1C พร้อม glow แดงเข้ม, ปรับ .mat-hchart-bar.bar-orange เป็น linear-gradient(90deg, #F97316 0%, #FB923C 45%, #FDBA74 100%) (สีส้มอ่อน), ปรับ .lg-orange และ .mat-budget-pill.pill-orange เป็นโทนส้มอ่อน #FB923C, ปรับสีตัวเลข .val-orange เป็น #FED7AA 2) ใน js/materials.js: ปรับข้อความป้าย Legend ในส่วนหัวกราฟเป็น \"ค้างเบิก งบ I, P (สีแดงเข้ม)\" และ \"ค้างเบิก งบ C (สีส้มอ่อน)\" ทั้งใน static HTML และ dynamic render, ปรับสีแถวและยอดรวมตารางคลังให้ตรงกับสีแดงเข้มและส้มอ่อน 3) อัปเดต Version Cache Busters ใน index.html เป็น 20261103_1607',
      sourceFile: 'คำสั่งผู้ใช้งาน: แก้ไขสีส้มสะท้อนแสง เป็นสีส้มอ่อน / แก้ไขสีแดง เป็นสีแดงเข็ม',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_increase_warehouse_numbers_size',
      timestamp: '2026-11-03 15:47:00',
      timestampTh: '3 พ.ย. 2569, 15:47 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มขนาดตัวเลขตารางคลัง',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มขนาดตัวเลขปริมาณค้างเบิกและเหลือคลังในตารางรายละเอียดแต่ละคลังพัสดุ',
      targetSubject: 'ตัวเลขในคอลัมน์ค้างเบิกและเหลือคลังของการ์ดรายละเอียดแต่ละคลังพัสดุ (#matWhStandaloneCard) ในแท็บ "รายการพัสดุ"',
      storageFile: 'css/styles.css, js/materials.js, js/data_history.js, index.html',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "เพิ่มขนาดตัวเลข" พร้อมภาพกรอบสีเหลืองครอบคอลัมน์ตัวเลขทั้งสองฝั่ง: ปรับเพิ่มขนาดตัวเลขในตารางคลังจาก 0.75rem เป็น 0.88rem และยอดผลรวมจาก 0.76rem เป็น 0.92rem (น้ำหนักตัวหนา 800-900) พร้อมปรับสัดส่วนความกว้างคอลัมน์ตัวเลขเป็น 52% เพื่อความชัดเจน อ่านง่าย และไม่ล้นกรอบ',
      details: '1) ใน css/styles.css: ปรับ .mat-wh-table td.td-wh-val ให้มี font-size: 0.88rem (เพิ่มขึ้นจาก 0.75rem), font-weight: 800, letter-spacing: -0.01em ปรับยอดรวม tfoot td.td-sum-val ให้มี font-size: 0.92rem, font-weight: 900 ปรับสัดส่วนคอลัมน์ th.th-wh เป็น 48% และ th.th-val เป็น 52% เพื่อให้ตัวเลขหลักล้าน (เช่น 2,298,519) มีพื้นที่โปร่งตา ไม่เบียดชิดขอบ 2) ใน js/materials.js: ปรับค่าน้ำหนักตัวหนาของตัวเลขขณะกรองเจาะจงพัสดุจาก 700 เป็น 800 ให้โดดเด่นคมชัด 3) อัปเดต Version Cache Busters ใน index.html เป็น 20261103_1547',
      sourceFile: 'คำสั่งผู้ใช้งาน: เพิ่มขนาดตัวเลข (รูป media_1793694835646_3f0655c9.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_revert_chart_clear_button',
      timestamp: '2026-11-03 15:36:00',
      timestampTh: '3 พ.ย. 2569, 15:36 น.',
      type: 'EDIT',
      typeBadge: 'ยกเลิกปุ่มล้างกราฟ',
      badgeClass: 'badge-type-edit',
      title: 'ยกเลิกคำสั่งปุ่มล้างตัวกรองกราฟ คงโครงสร้างเดิมที่เรียบง่าย',
      targetSubject: 'ส่วนหัวกราฟแท่งแนวนอน (#matHChartCard) ในแท็บ "รายการพัสดุ"',
      storageFile: 'js/materials.js, css/styles.css, js/data_history.js, index.html',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน: "ยกเลิกคำสั่ง ล้างตัวกรองกราฟ" โดยนำปุ่มล้างตัวกรองกราฟ (#matClearHChartBtn) และสไตล์ที่เกี่ยวข้องออกจากส่วนหัวกราฟแท่งแนวนอน โดยยังคงการแก้ไขโครงสร้างเลย์เอาต์ตารางคลังคู่ขนานที่สมบูรณ์ไว้',
      details: '1) ใน js/materials.js: นำปุ่ม #matClearHChartBtn และโครงสร้าง .mat-hchart-head-top ออกจากส่วนหัวกราฟแท่งแนวนอน และตัดโค้ดการอัปเดตสถานะปุ่มใน renderMatRemainChart() ออก คืนค่าโครงสร้างหัวกราฟเดิม (.mat-hchart-title) 2) ใน css/styles.css: นำคลาส CSS .btn-clear-chart-only, .mat-hchart-actions, .mat-hchart-head-top และแอนิเมชัน pulseClearBtn ออกทั้งหมด โดยยังคงการจัดวาง flexbox ของตารางคลัง (.mat-wh-tables-row) และการแสดงผลคู่ขนานซ้าย-ขวาไว้อย่างสมบูรณ์ 3) อัปเดต Cache Busters ใน index.html เป็น 20261103_1536',
      sourceFile: 'คำสั่งผู้ใช้งาน: ยกเลิกคำสั่ง ล้างตัวกรองกราฟ',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_fix_layout_and_add_chart_clear_button',
      timestamp: '2026-11-03 15:26:00',
      timestampTh: '3 พ.ย. 2569, 15:26 น.',
      type: 'EDIT',
      typeBadge: 'กู้คืนเลย์เอาต์ & เพิ่มปุ่มล้างกราฟ',
      badgeClass: 'badge-type-edit',
      title: 'แก้ไขสาเหตุเลย์เอาต์ตารางคลังซ้อนตกแถว และเพิ่มปุ่มล้างตัวกรองกราฟเฉพาะกราฟแนวนอน',
      targetSubject: 'การ์ดสรุปคลังพัสดุ (#matWhStandaloneCard), แถบตัวกรองย่อย และส่วนหัวกราฟแท่งแนวนอน (#matHChartCard) ในแท็บ "รายการพัสดุ"',
      storageFile: 'css/styles.css, js/materials.js, js/data_history.js, index.html',
      changeSummary: '1) ชี้แจงและแก้ไขสาเหตุเลย์เอาต์ตารางคลังที่ตกซ้อนลงมาข้างล่างแทนที่จะอยู่คู่กัน เกิดจากการตัดทอน CSS บรรทัดท้ายใน styles.css ได้ทำการกู้คืนกฎ CSS ของ .mat-wh-tables-row (display: flex) และโครงสร้างตารางคลังรวมถึงป้าย WBS 3 แถวครบถ้วน 2) เพิ่มปุ่ม "✕ ล้างตัวกรองกราฟ" ในมุมบนขวาของการ์ดกราฟแนวนอนตามที่ระบุในกรอบสีเหลือง',
      details: '1) แก้ไขสาเหตุตารางคลังซ้อนกัน: กู้คืนไฟล์ css/styles.css จากบรรทัด 21,202 ถึงท้ายไฟล์ (รวม 21,811 บรรทัด) กู้คืน .mat-wh-tables-row { display: flex; }, .mat-wh-subbox { flex: 1 1 50%; }, .mat-wh-table, .mat-wh-box-indicator และ .mat-sf-wbs-stats-3rows ทำให้ตารางทั้ง 2 ฝั่งกลับมาวางประกบคู่ขนานซ้าย-ขวาอย่างสมบูรณ์ 2) เพิ่มปุ่มล้างตัวกรองเฉพาะกราฟนี้: เพิ่มโครงสร้าง .mat-hchart-head-top พร้อมปุ่ม #matClearHChartBtn ในส่วนหัวกราฟแท่งแนวนอนตรงตำแหน่งมุมบนขวาตามรูป เมื่อคลิกจะล้างการเลือกพัสดุ matState.chartSelDesc และคืนค่าการแสดงผลทั้งกราฟ การ์ดคลัง และตารางด้านล่างให้กลับมาแสดงข้อมูลภาพรวมทั้งหมด พร้อมเลื่อนสกรอลล์กลับไปบนสุด 3) อัปเดต Cache Busters ใน index.html เป็น 20261103_1526',
      sourceFile: 'คำสั่งผู้ใช้งาน: 9. แก้ไขคืนค่า เป็นเนื่องจากอะไร (รูป media_1793693428922_ef419c0a.jpg) และ 10. เพิ่มปุ่มล้างตัวกลาง เฉพาะกราฟนี้ (รูป media_1793693535526_b4cb822e.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง'
    },
    {
      id: 'log_000_wh_card_remove_red_keep_yellow_banner',
      timestamp: '2026-11-03 14:58:00',
      timestampTh: '3 พ.ย. 2569, 14:58 น.',
      type: 'EDIT',
      typeBadge: 'ปรับกล่องชื่อพัสดุการ์ดคลัง',
      badgeClass: 'badge-type-edit',
      title: 'นำปุ่มคืนค่าภาพรวมออก คงกล่องชื่อพัสดุไว้ และแสดง "ไม่มีรายการที่เลือก" เมื่อยังไม่ได้เลือกพัสดุ',
      targetSubject: 'ส่วนหัวและการ์ดรายละเอียดแต่ละคลังพัสดุ (#matWhStandaloneCard) ในเมนู "รายการพัสดุ"',
      storageFile: 'js/materials.js, css/styles.css, js/data_history.js, index.html',
      changeSummary: 'ตามคำสั่งผู้ใช้งาน: "วงแดงเอาออก วงเหลืองให้คงไว้ หากไม่ได้เลือกให้แสดง ไม่มีรายการที่เลือก" นำปุ่ม "✕ คืนค่าภาพรวม" (วงแดง) ออกจากหัวการ์ดคลัง คงกล่องข้อความชื่อพัสดุ (วงเหลือง) ไว้ด้านบนสุดเสมอ และเมื่อยังไม่ได้เลือกพัสดุจะแสดงข้อความ "ไม่มีรายการที่เลือก"',
      details: '1) ใน js/materials.js: นำปุ่ม <button class="mat-wh-reset-btn">✕ คืนค่าภาพรวม</button> ออกจาก headerActionHtml ทั้งหมด 2) ปรับ subBannerHtml ให้อยู่ด้านบนสุดของการ์ดคลังเสมอ โดยหาก it เป็น null (ยังไม่ได้เลือกพัสดุ) ให้แสดง <div class="mat-wh-selected-mat-box not-selected">🔍 ไม่มีรายการที่เลือก</div> และเมื่อเลือกพัสดุจะแสดงชื่อพัสดุเต็ม 3) ใน css/styles.css: เพิ่มสไตล์ .mat-wh-selected-mat-box.not-selected ให้ข้อความสีนวลสบายตา ทั้ง Dark Theme และ Light Theme 4) อัปเดต Cache Busters ใน index.html เป็น 20261103_1458',
      sourceFile: 'คำสั่งผู้ใช้งาน: วงแดงเอาออก วงเหลืองให้คงไว้ หากไม่ได้เลือกให้แสดง ไม่มีรายการที่เลือก (media_1793691796218_6d733c39.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_link_chart_mat_selection_to_table',
      timestamp: '2026-11-03 14:50:00',
      timestampTh: '3 พ.ย. 2569, 14:50 น.',
      type: 'EDIT',
      typeBadge: 'เชื่อมโยงกราฟกับตารางพัสดุ',
      badgeClass: 'badge-type-edit',
      title: 'เชื่อมโยงการเลือกรายการพัสดุจากแท่งกราฟไปยังตารางปริมาณค้างเบิก (Bi-directional Drilldown)',
      targetSubject: 'การคลิกเลือกรายการพัสดุ/แท่งงบในกราฟแนวนอน และตารางข้อมูลปริมาณค้างเบิก (#matTableCard) ในเมนู "รายการพัสดุ"',
      storageFile: 'js/materials.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ตามคำสั่งผู้ใช้งาน: "เลือกรายพัสดุในกราฟ แล้ว ให้ลิ้งแสดงในตารางปริมาณค้างเบิกด้วย" ปรับปรุงให้การคลิกที่แถวหรือแท่งกราฟของรายการพัสดุใด ทำการกรองตารางรายการพัสดุหลักด้านล่างให้แสดงเฉพาะพัสดุรายการนั้นทันที พร้อมอัปเดตการ์ดสรุป KPI ย่อยและคำนวณสถิติ WBS อย่างสอดคล้องกันแบบเรียลไทม์',
      details: '1) ใน js/materials.js: ปรับปรุง window.selectMatChartItemWithBudget และ window.selectMatChartItem ให้ล้าง cachedFilterKey รีเซ็ตหน้าตารางไปที่หน้าที่ 1 (matState.page = 1) และเรียก renderMaterialsTab() เพื่อสั่งให้ทั้งกราฟ การ์ดคลัง และตารางด้านล่างประมวลผลข้อมูลที่ตรงกันอย่างสมบูรณ์ 2) อัปเดตหัวตาราง matTableActiveCriteriaVal ให้แสดงป้ายชื่อพัสดุที่กำลังกรอง 3) เพิ่มปุ่ม "✕ ล้างตัวเลือกกราฟ" ในแถบหัวตาราง (#matClearChartSelBtn) และฟังก์ชัน window.clearMatChartSelection() สำหรับคลิกคืนค่ากลับสู่รายการทั้งหมด 4) ใน css/styles.css: เพิ่มสไตล์ .btn-clear-chart-sel รองรับทั้งธีมมืดและสว่าง 5) อัปเดต Cache Busters ใน index.html เป็น 20261103_1450',
      sourceFile: 'คำสั่งผู้ใช้งาน: เลือกรายพัสดุในกราฟ แล้ว ให้ลิ้งแสดงในตารางปริมาณค้างเบิกด้วย',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง'
    },
    {
      id: 'log_000_chart_bar_budget_divider_line',
      timestamp: '2026-11-03 14:35:00',
      timestampTh: '3 พ.ย. 2569, 14:35 น.',
      type: 'EDIT',
      typeBadge: 'เส้นแบ่งสีแท่งกราฟ',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มเส้นแบ่งสีขาวสว่างคมชัด (Precision Divider Line) คั่นระหว่างท่อนงบในแท่งกราฟ',
      targetSubject: 'แท่งกราฟแนวนอน (.mat-hchart-bar) ในเมนู "รายการพัสดุ"',
      storageFile: 'css/styles.css, js/materials.js, index.html, js/data_history.js',
      changeSummary: 'ตามคำสั่งผู้ใช้งาน: "ออกแบบ เพิ่มเส้นแบ่งสีในแท่งกราฟ เพื่อแยกความแตกต่างระหว่างงบหน่อย" เพิ่มเส้นคั่นสีขาวสว่างคมชัด 2px (Pure White with Glow) คั่นระหว่างท่อนงบ I, P (สีแดง) กับ งบ C (สีส้มสะท้อนแสง) ในแท่งค้างเบิก และคั่นระหว่าง SLoc 0022 กับ SLoc 0021 ในแท่งคงเหลือ',
      details: '1) ใน js/materials.js: เพิ่มคลาส bar-seg-first บนเซกเมนต์แรก และ bar-seg-last บนเซกเมนต์ที่สองของแท่งกราฟ 2) ใน css/styles.css: กำหนดสไตล์ .mat-hchart-bar.bar-seg-first ให้มี border-right: 2px solid #FFFFFF !important และ box-shadow: 0 0 4px rgba(255, 255, 255, 0.7) สร้างเส้นคั่นสีขาวเลเซอร์ที่คมชัดระดับพิกเซล แยกเฉดสีแดงและส้มสะท้อนแสงออกจากกันชัดเจน 3) อัปเดต Version Cache Busters ใน index.html เป็น 20261103_1435',
      sourceFile: 'คำสั่งผู้ใช้งาน: ออกแบบ เพิ่มเส้นแบ่งสีในแท่งกราฟ เพื่อแยกความแตกต่างระหว่างงบหน่อย',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_neon_orange_budget_c',
      timestamp: '2026-11-03 14:15:00',
      timestampTh: '3 พ.ย. 2569, 14:15 น.',
      type: 'EDIT',
      typeBadge: 'ปรับสีส้มสะท้อนแสง งบ C',
      badgeClass: 'badge-type-edit',
      title: 'เปลี่ยนสีค้างเบิกงบ C เป็นสีส้มสะท้อนแสงสว่างสดใส (Fluorescent Neon Orange)',
      targetSubject: 'กราฟแท่งแนวนอน (#matHChartCard) และคำอธิบายสัญลักษณ์ (Legend) ในเมนู "รายการพัสดุ"',
      storageFile: 'css/styles.css, js/materials.js, index.html, js/data_history.js',
      changeSummary: 'ตามคำสั่งผู้ใช้งาน: "ค้ากเบิกงบ C ใช้สีส้มสะท้อนแสง สว่างๆ" ปรับเปลี่ยนชุดสีค้างเบิกงบ C จากสีส้มพาสเทลเดิม เป็นสีส้มสะท้อนแสงเกรดพรีเมียม (Fluorescent Neon Orange #FF6600, #FF7700, #FFAA00) พร้อมเอฟเฟกต์เรืองแสง (Luminous Glow) ทั้งแท่งกราฟ จุดสัญลักษณ์ ข้อความ และปุ่มเลือกงบ',
      details: '1) ใน css/styles.css: ปรับ .mat-hchart-bar.bar-orange เป็น linear-gradient(90deg, #FF5500 0%, #FF7700 50%, #FFAA00 100%) พร้อม box-shadow เรืองแสงสีส้มนีออน, ปรับ .lg-orange เป็น #FF6600 เรืองแสง 14px, ปรับ .mat-budget-pill.pill-orange.active, ปรับ .val-orange และ .val-orange.active-target เป็นสีสว่างคมชัด 2) ใน js/materials.js: ปรับข้อความป้าย Legend เป็น "ค้างเบิก งบ C (สีส้มสะท้อนแสง)" และปรับการคำนวณ tfoot / fillstyle ของการ์ดคลังให้สอดคล้องกัน 3) อัปเดต Version Cache Busters ใน index.html เป็น 20261103_1415',
      sourceFile: 'คำสั่งผู้ใช้งาน: ค้ากเบิกงบ C ใช้สีส้มสะท้อนแสง สว่างๆ',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },

    {
      id: 'log_000_separate_warehouse_card_to_far_right',
      timestamp: '2026-11-01 08:30:00',
      timestampTh: '1 พ.ย. 2569, 08:30 น.',
      type: 'EDIT',
      typeBadge: 'แยกการ์ดคลังพัสดุไว้ขวาสุด',
      badgeClass: 'badge-type-edit',
      title: 'แยกการ์ดรายละเอียดแต่ละคลังพัสดุออกมาเป็นการ์ดเดี่ยว ไว้ด้านขวาสุด',
      targetSubject: 'เมนูรายการพัสดุ (แยกการ์ด matWhStandaloneCard ออกจากการ์ดกราฟ matHChartCard)',
      storageFile: 'js/materials.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ตามคำสั่งผู้ใช้งาน: "ไม่ต้องไว้ในการ์ดปริมาณค้างเบิก แยกการ์ดออกมา ไว้ด้านขวาสุด" 1) นำตารางสรุปคลังพัสดุ 6 คลัง (รูป 30) ออกจากการ์ดกราฟแนวนอน matHChartCard 2) สร้างการ์ดอิสระ matWhStandaloneCard วางไว้ด้านขวาสุดในแถว mat-charts-split-row 3) ปรับการจัดวางเคียงข้างกันอย่างสวยงามสมมาตรและรองรับ Responsive',
      details: '1) ใน js/materials.js ปรับโครงสร้าง DOM: หุ้มการ์ดกราฟ matHChartCard และการ์ดคลัง matWhStandaloneCard ภายใต้คอนเทนเนอร์ mat-charts-split-row เพื่อให้การ์ดทั้งสองอยู่เคียงข้างกันในระดับเดียวกันอย่างอิสระ 2) การ์ดกราฟด้านซ้ายแสดงเฉพาะเนื้อหากราฟค้างเบิกตามรายการพัสดุ 3) การ์ดคลังด้านขวาสุดแสดงหัวการ์ด 🏢 รายละเอียดแต่ละคลังพัสดุ พร้อมตาราง 6 คลัง (I010..I070) ตามรูป 30 4) ใน css/styles.css ปรับแต่งความกว้าง 395px ขอบสีชมพูมาเจนต้าเงางาม และจัดวางแบบ Flexbox ยืดหยุ่น 5) อัปเดต Cache Busters v=20261101_0830 ใน index.html',
      sourceFile: 'คำสั่งผู้ใช้งาน: ไม่ต้องไว้ในการ์ดปริมาณค้างเบิก แยกการ์ดออกมา ไว้ด้านขวาสุด',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_add_warehouse_summary_widget',
      timestamp: '2026-11-01 08:20:00',
      timestampTh: '1 พ.ย. 2569, 08:20 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มตารางสรุปคลังพัสดุ',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มตารางรายละเอียดแต่ละคลังพัสดุ (ปริมาณค้างเบิก/คงเหลือ) เคียงข้างกราฟแนวนอน',
      targetSubject: 'เมนูรายการพัสดุ (การ์ดกราฟแนวนอน matHChartCard ด้านขวา)',
      storageFile: 'js/materials.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: '1) สร้างตารางเลียนแบบรายละเอียด 6 คลังพัสดุ (I010, I020, I030, I040, I050, I070) ตามรูป 30 พร้อมส่วนหัวสีชมพู 2 คอลัมน์ 2) วางเคียงข้างกราฟแนวนอนทางขวามือตามรูป 29 3) ตารางค้างเบิกคลัง (ขอบแดงคอรัล ผลรวม 544,753) และเหลือคลัง (ขอบเขียวมรกต ผลรวม 2,298,519) 4) เพิ่มลูกเล่น Hover ไฮไลต์พร้อมกันทั้งสองตารางและคลิกเลือกคลังเพื่อกรองตารางหลักได้ทันที',
      details: '1) ใน js/materials.js ปรับปรุงโครงสร้าง matHChartCard ให้มี mat-hchart-main-row รองรับการแสดงกราฟแท่งแนวนอนทางซ้าย และ matWhWidgetCol ทางขวา 2) เขียนฟังก์ชัน renderMatWarehouseSummary() แสดงผลส่วนหัวสีชมพู mat-wh-header-pink พร้อมตารางคู่ mat-wh-subbox (box-pending ยอดค้างเบิก 544,753 และ box-stock ยอดคงเหลือ 2,298,519 ตรงตามรูป 30 ครบถ้วน) 3) เพิ่ม window.toggleMatPlantFilter() รองรับการคลิกเลือกคลังพัสดุเพื่อกรองตารางล่างแบบโต้ตอบ 4) ใน css/styles.css เพิ่มสไตล์การ์ด ตาราง zebra striping, แถบสีด้านล่าง bar-pending / bar-stock และรองรับ responsive 5) อัปเดต Cache Busters v=20261101_0820 ใน index.html และบันทึก Audit Log',
      sourceFile: 'คำสั่งผู้ใช้งาน: ให้สร้างตารางเลียนแบบ แสดงรายละเอียดแต่ละคลังพัสดุ ปริมาณค้างเบิก/คงเหลือ ตามรูป 30 วางตำแหน่งรูป 29 ตกแต่งสวยงามมากๆ เข้าใจง่าย',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง'
    },
    {
      id: 'log_000_mat_scope_labels_and_title_scale',
      timestamp: '2026-11-01 07:50:00',
      timestampTh: '1 พ.ย. 2569, 07:50 น.',
      type: 'EDIT',
      typeBadge: 'ปรับข้อความปุ่มและลดขนาดฟอนต์',
      badgeClass: 'badge-type-edit',
      title: 'ปรับข้อความปุ่มตัวกรองพัสดุ "(อยู่ระหว่างก่อสร้าง) / (ปิดงานก่อสร้าง)" และปรับลดขนาดชื่อตาราง',
      targetSubject: 'เมนูรายการพัสดุ (ปุ่มตัวกรองงาน matToolbarWbsStats และชื่อตาราง mat-table-title-text)',
      storageFile: 'js/materials.js, index.html, js/data_history.js',
      changeSummary: '1) ปรับข้อความปุ่มตัวกรองพัสดุเป็น "พัสดุ (อยู่ระหว่างก่อสร้าง)" และ "ไม่พบพัสดุ (ปิดงานก่อสร้าง)" ตามภาพ 2) ปรับลดขนาดฟอนต์ชื่อตาราง "ปริมาณค้างเบิก รายการพัสดุตามประมาณการ" ลงมาที่ 1.0rem (หนา 700) ให้สวยงาม พอดีกับแถบตาราง',
      details: '1) ใน js/materials.js: แก้ไขฟังก์ชัน renderMaterialsTab() ส่วนสร้างปุ่ม mat-scope-btn ในกล่อง matToolbarWbsStats เปลี่ยนป้ายข้อความเป็น "พัสดุ (อยู่ระหว่างก่อสร้าง)" และ "ไม่พบพัสดุ (ปิดงานก่อสร้าง)" พร้อมปรับข้อความ tooltip ให้สอดคล้องกัน 2) ปรับขนาดฟอนต์ .mat-table-title-text จาก 1.15rem ลงเป็น 1.0rem (ความหนา 700) เพื่อความกะทัดรัด สวยงาม สบายตา 3) อัปเดต Version Cache Buster ใน index.html เป็น 20261101_0750 4) บันทึกและตรวจสอบภาพหน้าจอผ่าน Edge Headless แสดงผลถูกต้อง 100%',
      sourceFile: 'คำสั่งผู้ใช้งาน: แก้ไข พัสดุ (อยู่ระหว่างก่อสร้าง) / ไม่พบพัสดุ (ปิดงานก่อสร้าง) และ ปริมาณค้างเบิก รายการพัสดุตามประมาณการ ปรับลดขนาด',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_resize_and_trim_mat_table_title',
      timestamp: '2026-11-01 07:45:00',
      timestampTh: '1 พ.ย. 2569, 07:45 น.',
      type: 'EDIT',
      typeBadge: 'ปรับชื่อตารางและขยายขนาด',
      badgeClass: 'badge-type-edit',
      title: 'ปรับขนาดตัวอักษรและแก้ไขข้อความชื่อตารางเป็น "ปริมาณค้างเบิก รายการพัสดุตามประมาณการ"',
      targetSubject: 'เมนูรายการพัสดุ (ชื่อตาราง mat-table-title-text เหนือตารางหลัก)',
      storageFile: 'js/materials.js, index.html, js/data_history.js',
      changeSummary: 'แก้ไขข้อความชื่อตารางด้านหน้าสุดเป็น "ปริมาณค้างเบิก รายการพัสดุตามประมาณการ" และเพิ่มขนาดตัวอักษรให้ใหญ่ขึ้นชัดเจน (1.15rem, ตัวหนา 800) สีขาวสว่าง เด่นชัด ตามคำสั่งผู้ใช้งาน',
      details: '1) ใน js/materials.js: แก้ไข .mat-table-title-text เป็น "ปริมาณค้างเบิก รายการพัสดุตามประมาณการ" 2) เพิ่มขนาดตัวอักษรจาก 0.92rem (หนา 700) เป็น 1.15rem (หนา 800, letter-spacing: 0.02em) สีขาวสว่าง (#FFFFFF) โดดเด่น สวยงาม 3) อัปเดต Version Cache Buster ใน index.html เป็น 20261101_0745 4) ตรวจสอบและบันทึกภาพหน้าจอผ่าน Edge Headless ยืนยันผลลัพธ์ถูกต้องตรงตามคำสั่งผู้ใช้งาน 100%',
      sourceFile: 'คำสั่งผู้ใช้งาน: แก้ไข ปริมาณค้างเบิก รายการพัสดุตามประมาณการ (พร้อมคำสั่งเพิ่มขนาดอักษร)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_move_mat_table_title_front_white_text',
      timestamp: '2026-11-01 07:40:00',
      timestampTh: '1 พ.ย. 2569, 07:40 น.',
      type: 'EDIT',
      typeBadge: 'ปรับตำแหน่งและรูปแบบชื่อตาราง',
      badgeClass: 'badge-type-edit',
      title: 'ย้ายข้อความชื่อตารางมาไว้ตำแหน่งหน้าสุด เอาออกจากการ์ดเกณฑ์วัด เป็นตัวอักษรสีขาว "ตารางรายการพัสดุ ปริมาณค้างเบิก >= 0 ตามประมาณการ"',
      targetSubject: 'เมนูรายการพัสดุ (ส่วนหัวตารางข้อมูล mat-table-title-text เหนือตารางหลัก)',
      storageFile: 'js/materials.js, index.html, js/data_history.js',
      changeSummary: 'ย้ายข้อความ "ปริมาณค้างเบิก >= 0 ตามประมาณการ" ออกจากการ์ดเกณฑ์วัด (wbs-table-active-criteria) มาวางไว้ด้านหน้าสุดเป็นชื่อตารางแบบตัวอักษรสีขาว (White Text) โดยปรับข้อความเต็มเป็น "ตารางรายการพัสดุ ปริมาณค้างเบิก >= 0 ตามประมาณการ" ตามคำสั่งผู้ใช้งาน',
      details: '1) ใน js/materials.js: นำข้อความออกจาก critValEl ในฟังก์ชัน renderMaterialsTab() คืนค่าป้ายเกณฑ์วัดให้แสดงเฉพาะสถิติงานและรายการพัสดุ 2) เพิ่มองค์ประกอบ .mat-table-title-text ไว้ด้านหน้าสุดของแถบหัวตาราง กำหนดสไตล์ตัวอักษรสีขาว (#FFFFFF) หนา 700 3) ปรับข้อความระบุชัดเจน "ตารางรายการพัสดุ ปริมาณค้างเบิก >= 0 ตามประมาณการ" 4) ทดสอบตรวจสอบผ่าน Edge Headless แสดงผลถูกต้องสวยงาม 100%',
      sourceFile: 'คำสั่งผู้ใช้งาน: ย้ายตำแหน่งหน้าสุด และเอาออกจากการ์ด เป็นตัวอักษรสีขาว แก้ไขข้อความเป็น ตารางรายการพัสดุ ปริมาณค้างเบิก >=0 ตามประมาณการ (พร้อมภาพประกอบลากลูกศรชี้จุด)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_sort_materials_sap_filter_alphabetical',
      timestamp: '2026-11-01 07:35:00',
      timestampTh: '1 พ.ย. 2569, 07:35 น.',
      type: 'EDIT',
      typeBadge: 'เรียงสถานะ SAP ตามตัวอักษร',
      badgeClass: 'badge-type-edit',
      title: 'ปรับการเรียงลำดับตัวเลือกในตัวกรองสถานะ SAP (ไฟล์ 04) เป็นเรียงตามตัวอักษรภาษา (A-Z)',
      targetSubject: 'เมนูรายการพัสดุ (Dropdown ตัวกรองสถานะ SAP #matSapThDropdownList)',
      storageFile: 'js/materials.js, index.html, js/data_history.js',
      changeSummary: 'แก้ไขฟังก์ชัน renderMatSapThDropdownList() ให้จัดเรียงลำดับรายการสถานะ SAP ตามตัวอักษรภาษาอังกฤษ (A-Z) เช่น REL C1, REL C2, REL C3, REL C4, REL C9, REL D1, REL D2, ... แทนการเรียงตามจำนวนรายการ (Count Descending) ตามคำสั่งผู้ใช้งาน เพื่อให้ค้นหาและเลือกสถานะได้ง่ายและเป็นระเบียบ',
      details: '1) ใน js/materials.js: แก้ไขฟังก์ชัน renderMatSapThDropdownList() โดยเปลี่ยนการเรียงลำดับ keys จาก Object.keys(counts).sort((a,b) => counts[b] - counts[a]) เป็นการเรียงตามตัวอักษรภาษา (localeCompare แบบ numeric natural sort) 2) กำหนดให้สถานะ "(ไม่ระบุ)" อยู่ท้ายสุดของรายการ 3) ทดสอบตรวจสอบผ่าน Edge Headless ยืนยันลำดับตัวเลือกเรียงตาม C1 -> C3 -> C9 -> D1 -> D2 อย่างถูกต้อง 100%',
      sourceFile: 'คำสั่งผู้ใช้งาน: แก้ไข เรียงตามอักษรภาษา (พร้อมภาพประกอบ Dropdown สถานะ SAP)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_fix_history_encoding_utf8',
      timestamp: '2026-11-01 07:28:00',
      timestampTh: '1 พ.ย. 2569, 07:28 น.',
      type: 'EDIT',
      typeBadge: 'แก้ไขภาษาอ่านไม่ออก',
      badgeClass: 'badge-type-edit',
      title: 'แก้ไขและฟื้นฟูข้อความภาษาไทยในหน้าประวัติการนำเข้าและแก้ไขข้อมูล (Data History) ให้เป็น UTF-8 อ่านออกได้ถูกต้อง 100%',
      targetSubject: 'เมนูประวัติการนำเข้าและแก้ไขข้อมูล (BASE_AUDIT_LOGS ใน js/data_history.js)',
      storageFile: 'js/data_history.js, index.html',
      changeSummary: 'แก้ไขข้อความภาษาไทยที่เป็นตัวอักษรอ่านไม่ออก (Mojibake) ในบันทึกประวัติการแก้ไขช่วงล่าสุด ให้กลับมาเป็นภาษาไทย UTF-8 ที่ถูกต้อง สวยงาม อ่านออกได้ชัดเจนครบถ้วนทุกรายการ',
      details: '1) ตรวจสอบไฟล์ js/data_history.js พบรายการ log ที่มีตัวอักษร Mojibake จำนวน 3 รายการ 2) ทำการเขียนทับด้วยข้อความภาษาไทย UTF-8 ที่สมบูรณ์และถูกต้อง 3) สแกนตรวจสอบซ้ำทั้งไฟล์พบ Mojibake = 0 รายการ 4) ทดสอบเปิดแท็บประวัติ (#tab-history) บนเบราว์เซอร์ Edge แสดงผลภาษาไทยคมชัด ถูกต้อง 100%',
      sourceFile: 'คำสั่งผู้ใช้งาน: แก้ไขประวัติ ภาษาอ่านไม่ออก',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_add_mat_table_remain_qty_gte_zero_text',
      timestamp: '2026-11-01 07:20:00',
      timestampTh: '1 พ.ย. 2569, 07:20 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มข้อความเกณฑ์วัดพัสดุ',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มข้อความ "ปริมาณค้างเบิก >= 0 ตามประมาณการ" ในแถบเกณฑ์วัดตารางรายการพัสดุ',
      targetSubject: 'เมนูรายการพัสดุ (แถบระบุประเภทเกณฑ์วัดตารางพัสดุ matTableActiveCriteriaVal)',
      storageFile: 'js/materials.js, index.html, js/data_history.js',
      changeSummary: 'เพิ่มข้อความ "ปริมาณค้างเบิก >= 0 ตามประมาณการ" ต่อท้ายจำนวนรายการพัสดุในแถบเกณฑ์วัดเหนือตารางข้อมูลหลัก ตามคำสั่งผู้ใช้งาน (ชี้เป้าด้วยลูกศรสีแดงจากหัวกราฟ) เพื่อระบุอย่างชัดเจนว่าตารางด้านล่างแสดงรายการพัสดุทั้งหมดที่มีปริมาณค้างเบิกตามประมาณการ >= 0',
      details: '1) ใน js/materials.js: แก้ไขฟังก์ชัน renderMaterialsTab() ในส่วนอัปเดต critValEl.textContent โดยเพิ่ม " • ปริมาณค้างเบิก >= 0 ตามประมาณการ" 2) อัปเดตค่าเริ่มต้นในแท็ก HTML ให้สอดคล้องกัน 3) ทดสอบตรวจสอบผ่าน Edge Headless แสดงผลถูกต้องและสวยงามครบถ้วน',
      sourceFile: 'คำสั่งผู้ใช้งาน: เพิ่มข้อความ ปริมาณค้างเบิก (ใช้สัญลัก > =) 0 ตามประมาณการ (พร้อมภาพประกอบลากลูกศรชี้จุด)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_update_mat_remain_chart_title_gt_zero',
      timestamp: '2026-11-01 07:15:00',
      timestampTh: '1 พ.ย. 2569, 07:15 น.',
      type: 'EDIT',
      typeBadge: 'ปรับชื่อหัวกราฟพัสดุ',
      badgeClass: 'badge-type-edit',
      title: 'ปรับปรุงข้อความหัวกราฟแนวนอนเป็น "ปริมาณค้างเบิก > 0 แยกตามรายการพัสดุ" และข้อความสรุปเป็น "รายการพัสดุ"',
      targetSubject: 'เมนูรายการพัสดุ (ส่วนหัวกราฟแนวนอน mat-hchart-title และข้อความสรุป matHChartSub)',
      storageFile: 'js/materials.js, index.html, js/data_history.js',
      changeSummary: 'แก้ไขข้อความหัวกราฟแท่งแนวนอนจาก "ปริมาณค้างเบิก แยกตามข้อความวัสดุ" เป็น "ปริมาณค้างเบิก > 0 แยกตามรายการพัสดุ" ตามคำสั่งผู้ใช้งาน พร้อมปรับข้อความสรุปจำนวนรายการในป้ายหัวกราฟและสถานะว่างเปล่าให้ใช้คำว่า "รายการพัสดุ" สอดคล้องเป็นมาตรฐานเดียวกัน',
      details: '1) ใน js/materials.js: เปลี่ยนข้อความในแท็ก .mat-hchart-title เป็น "ปริมาณค้างเบิก > 0 แยกตามรายการพัสดุ" 2) ใน matHChartSub: ปรับข้อความสรุปจาก "รายการวัสดุ" เป็น "รายการพัสดุ" (เช่น 340 รายการพัสดุ • รวมค้างเบิก...) 3) ปรับข้อความ Empty State เป็น "ไม่มีรายการพัสดุที่มีปริมาณค้างเบิก > 0" 4) ตรวจสอบการทำงานของกราฟและตารางผ่าน Edge Headless แสดงผลถูกต้องสวยงาม 100%',
      sourceFile: 'คำสั่งผู้ใช้งาน: แก้ไข ปริมาณค้างเบิก > 0 แยกตามรายการพัสดุ (พร้อมรูปภาพระบุตำแหน่งหัวกราฟ)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_cancel_warehouse_table_and_restore_mat_table',
      timestamp: '2026-10-31 23:20:00',
      timestampTh: '31 ต.ค. 2569, 23:20 น.',
      type: 'EDIT',
      typeBadge: 'กู้คืนตารางพัสดุ & ยกเลิกตารางคลัง',
      badgeClass: 'badge-type-edit',
      title: 'ยกเลิกคำสั่งเพิ่มตารางแยกคลังพัสดุ (รูป 30/29) และแก้ไขกู้คืนตารางข้อมูลพัสดุด้านล่างและป้ายสถิติกรอบแดงกลับคืนมา 100%',
      targetSubject: 'เมนูรายการพัสดุ (ตารางข้อมูลหลักด้านล่าง, ป้ายสถิติจำนวนงาน WBS กรอบแดงบนแถบเครื่องมือ)',
      storageFile: 'js/materials.js, index.html, js/data_history.js',
      changeSummary: 'ยกเลิกคำสั่งเพิ่มตารางรายละเอียดแต่ละคลังพัสดุตามรูป 30 ที่ตำแหน่งรูป 29 ตามคำสั่งผู้ใช้งาน พร้อมแก้ไขข้อผิดพลาด ReferenceError: prevTop is not defined ในฟังก์ชัน renderMatRemainChart() ซึ่งส่งผลให้การเรนเดอร์ตารางข้อมูลพัสดุด้านล่างและป้ายสถิติจำนวนงาน WBS กรอบแดงกลับมาแสดงผลได้อย่างสมบูรณ์ 100%',
      details: '1) ใน js/materials.js: แก้ไขเพิ่มตัวแปร const prevTop = scroll ? scroll.scrollTop : 0; ในฟังก์ชัน renderMatRemainChart() แก้ปัญหา JavaScript ReferenceError ที่หยุดการทำงานก่อนถึง renderMaterialsTable() 2) กู้คืนการแสดงผลตารางพัสดุหลักด้านล่าง (matDataTable), แถบแบ่งหน้า (Pagination), และป้ายสถิติจำนวนงาน WBS 3 บรรทัด (matToolbarWbsStats กรอบแดง) กลับมาครบถ้วนสมบูรณ์ 3) ยกเลิกคำสั่งเพิ่มตารางแยกแต่ละคลังพัสดุตามรูป 30 ในตำแหน่งรูป 29 ตามคำสั่งผู้ใช้ 4) ทดสอบตรวจสอบผ่าน Edge Headless ไม่พบ Error ใดๆ บนคอนโซล',
      sourceFile: 'คำสั่งผู้ใช้งาน: ยกเลิกคำสั่ง 1.เพิ่มตารางแสดงรายละเอียดแต่ละคลังพัสดุ ปริมาณค้างเบิก/คงเหลือ ตามรูป 30 2.วางตำแหน่ง รูปที่ 29 3.ตกแต่งสวยงามมากๆ เข้าใจง่าย ให้แก้ไข ตารางกลับคืนมาก่อน / กรอบแดง ก็หาย',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง'
    },
    {
      id: 'log_000_chart_scale_stretch_and_stock_overflow_multiline',
      timestamp: '2026-10-31 22:50:00',
      timestampTh: '31 ต.ค. 2569, 22:50 น.',
      type: 'EDIT',
      typeBadge: 'ปรับสเกลกราฟ & คืนค่าตามสัดส่วน',
      badgeClass: 'badge-type-edit',
      title: 'ปรับสเกลกราฟแนวนอนเปรียบเทียบยอดค้างเบิกและยอดคงคลังให้แสดงผลสอดคล้องกัน',
      targetSubject: 'เมนูรายการพัสดุ (กราฟแนวนอนเปรียบเทียบปริมาณค้างเบิก vs ปริมาณคงคลัง)',
      storageFile: 'js/materials.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ปรับปรุงการคำนวณสเกลกราฟแนวนอนให้แท่งกราฟค้างเบิกและแท่งกราฟคงคลังใช้สเกลเดียวกันตามสัดส่วนจริง พร้อมแสดงตัวเลขจำนวนเต็มชัดเจน เข้าใจง่าย และสวยงามเป็นระเบียบ',
      details: '1) ใน js/materials.js: ปรับปรุงการคำนวณ maxVal สเกลกราฟแนวนอนให้สะท้อนสัดส่วนที่ถูกต้อง 2) แสดงแท่งกราฟค้างเบิก (แดง/ส้ม) และแท่งกราฟคงคลัง (เขียวเข้ม/เขียวอ่อน) อย่างสวยงาม 3) ปรับปรุง CSS คลาสการแสดงผล 4) อัปเดต Cache Busters ใน index.html',
      sourceFile: 'คำสั่งผู้ใช้งาน: ปริมาณค้างเบิกสูงสุด ให้ยืดเต็มกราฟ ส่วนปริมาณคงเหลือกราฟเขียว ให้เพิ่มบรรทัดได้ หรือใช้วิธีอื่น ให้เข้าใจง่าย สวยงาม',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_fix_materials_tab_restore_and_decimals',
      timestamp: '2026-10-31 22:25:00',
      timestampTh: '31 ต.ค. 2569, 22:25 น.',
      type: 'EDIT',
      typeBadge: 'กู้คืนหน้าพัสดุ & ตัวเลขจำนวนเต็ม',
      badgeClass: 'badge-type-edit',
      title: 'กู้คืนระบบแสดงผลเมนูรายการพัสดุ, กำหนดกราฟคงคลังสีเขียวแสดงอย่างเดียว และปรับตัวเลขปริมาณเป็นจำนวนเต็มไม่มีทศนิยม',
      targetSubject: 'เมนูรายการพัสดุ (กราฟแนวนอน & ตารางข้อมูล)',
      storageFile: 'js/materials.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'แก้ไขข้อผิดพลาดใน js/materials.js ทำให้เมนูรายการพัสดุกลับมาแสดงผลสมบูรณ์ 100%, ปรับตัวเลขปริมาณพัสดุทั้งหมดเป็นจำนวนเต็มไม่มีจุดทศนิยม (ปัดเศษด้วย Math.round), และกำหนดให้แท่งกราฟสีเขียวแสดงผลอย่างเดียวไม่สามารถคลิกเลือกได้',
      details: '1) แก้ไข js/materials.js ทำให้ระบบสามารถโหลดและ Initialize เมนูรายการพัสดุได้ตามปกติ 2) ปรับปรุงฟังก์ชัน formatQty() และตัวเลขในกราฟแนวนอนให้แสดงผลเป็นจำนวนเต็มแบบไม่มีทศนิยม (Math.round(val).toLocaleString()) ตามคำสั่ง 3) กำหนดแท่งกราฟสีเขียวเข้ม (SLoc 0022 งบ I,P) และสีเขียวอ่อน (SLoc 0021 งบ C) ให้มี cursor: default !important และ event.stopPropagation() เพื่อแสดงผลตัวเลขคงคลังอย่างเดียวไม่ trigger การเลือก 4) อัปเดต Cache Busters ใน index.html',
      sourceFile: 'คำสั่งผู้ใช้งาน: เมนูรายการพัสดุ หน้าหายหมดเลย / แก้ไขตัวเลขไม่มีจุดทศนิยม / กราฟสีเขียวแสดงอย่างเดียว กดเลือกไม่ได้',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง'
    },
{
      id: 'log_000_import_file_08_materials_stock_mb52',
      timestamp: '2026-10-31 22:10:00',
      timestampTh: '31 ต.ค. 2569, 22:10 น.',
      type: 'IMPORT',
      typeBadge: 'นำเข้าไฟล์ 08 พัสดุคงคลัง MB52',
      badgeClass: 'badge-type-import',
      title: 'นำเข้าไฟล์ 08 พัสดุคงเหลือ MB52 เข้าระบบ ผูกกับไฟล์ 07 ด้วยรหัสพัสดุและโรงงาน/Plant พร้อมแสดงกราฟคงเหลือแยกเขียวเข้ม (งบ I,P) และเขียวอ่อน (งบ C)',
      targetSubject: 'เมนูรายการพัสดุ (กราฟแนวนอนเปรียบเทียบค้างเบิก vs คงคลัง) & ประวัติข้อมูล',
      storageFile: 'js/data_materials_08.js, js/materials.js, css/styles.css, js/data_history.js, index.html',
      changeSummary: 'นำเข้าไฟล์ 08 พัสดุคงเหลือ MB52.xlsx (4,038 แถว) สร้างไฟล์ js/data_materials_08.js ผูกกับไฟล์ 07 ด้วยรหัสพัสดุและโรงงาน/Plant แสดงในแท่งกราฟแนวนอนแถวล่าง: คลัง SLoc 0022 งบ I,P ด้วยสีกราฟเขียวเข้ม และ SLoc 0021 งบ C ด้วยสีกราฟเขียวอ่อน พร้อมระบบตัวกรองแสดงเฉพาะโรงงาน/Plant เดียวกันกับปริมาณคงค้าง และเพิ่มการ์ดไฟล์ 08 ในเมนูประวัติ',
      details: '1) สร้างไฟล์ js/data_materials_08.js รวมยอด 2,466 รายการคู่รหัสพัสดุ-โรงงาน จากไฟล์ 08 MB52 2) ใน js/materials.js: เชื่อมโยงรหัสพัสดุและโรงงาน/Plant คำนวณปริมาณคงเหลือ SLoc 0022 (งบ I,P) และ SLoc 0021 (งบ C) แสดงผลเฉพาะโรงงานเดียวกับแถวที่ถูกกรอง 3) ในกราฟแนวนอน แสดงแท่งกราฟสีเขียวเข้ม (#15803D) สำหรับงบ I,P และสีเขียวอ่อน (#4ADE80) สำหรับงบ C บนสเกลเดียวกับยอดค้างเบิก 4) ปรับปรุง Legend แสดงสัญลักษณ์สีเขียวทั้ง 2 งบ 5) ใน js/data_history.js: เพิ่มการ์ดไฟล์ 08 ใน DATA_SOURCE_CATALOG, SYSTEM_STORAGE_FILES และ Model View Diagram 6) อัปเดต Cache Busters ใน index.html เป็น ?v=20261031_2210',
      sourceFile: '08 พัสดุคงเหลือ MB52.xlsx (223,624 bytes, แก้ไข 30 ต.ค. 2569 08:02:02 น.)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง'
    },
    {
      id: 'log_000_history_encoding_utf8_restoration',
      timestamp: '2026-10-31 21:55:00',
      timestampTh: '31 ต.ค. 2569, 21:55 น.',
      type: 'EDIT',
      typeBadge: 'แก้ไขฟื้นฟูภาษาไทยในประวัติ',
      badgeClass: 'badge-type-edit',
      title: 'แก้ไขและฟื้นฟูการเข้ารหัสตัวอักษรภาษาไทย (UTF-8 Restoration) ในระบบประวัติการแก้ไขข้อมูล แก้ปัญหาภาษาต่างดาว (Mojibake) ให้อ่านออกถูกต้องสมบูรณ์',
      targetSubject: 'เมนูประวัติการนำเข้าและแก้ไขข้อมูล (BASE_AUDIT_LOGS ใน js/data_history.js)',
      storageFile: 'js/data_history.js, index.html',
      changeSummary: 'แก้ไขข้อความประวัติการแก้ไขข้อมูลรายการล่าสุดที่ตัวอักษรภาษาไทยกลายเป็นอักขระผิดเพี้ยน (Mojibake) ให้กลับมาเป็นภาษาไทยที่คมชัดและถูกต้อง 100% พร้อมตรวจสอบระบบเข้ารหัส UTF-8 ทั้งไฟล์ไม่ให้มีภาษาต่างดาวหลงเหลือ',
      details: '1) ฟื้นฟูข้อความภาษาไทยในประวัติการแก้ไขข้อมูล 3 รายการล่าสุด (log_000_materials_chart_remove_full_row_border, log_000_materials_chart_interactive_hover_and_budget_select, log_000_materials_scope_buttons_3rows_behind_reset) กลับเป็นภาษาไทยแท้ที่ถูกต้อง 2) ตรวจสอบการเข้ารหัส UTF-8 ทั้งไฟล์ data_history.js พบค่าภาษาต่างดาวเป็น 0 จุด 3) ปรับปรุง Cache Busters ของ js/data_history.js ใน index.html เป็น ?v=20261031_2155 เพื่อให้เบราว์เซอร์โหลดไฟล์ที่ถูกต้องทันที',
      sourceFile: 'คำสั่งผู้ใช้งาน: แก้ไข ประวัติภาษาอ่านไม่ออก อีกแล้ว / แก้ไขให้หาย',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_materials_chart_remove_full_row_border',
      timestamp: '2026-10-31 21:42:00',
      timestampTh: '31 ต.ค. 2569, 21:42 น.',
      type: 'EDIT',
      typeBadge: 'เอากรอบทั้งบรรทัดกราฟออก',
      badgeClass: 'badge-type-edit',
      title: 'นำกรอบและเส้นขอบสีทองที่ล้อมรอบทั้งบรรทัดของแถวกราฟที่ถูกเลือกออก ให้คงเหลือเฉพาะการเน้นแท่งกราฟหรือชื่อพัสดุที่เลือก',
      targetSubject: 'เมนูรายการพัสดุ (กราฟแนวนอน .mat-hchart-row.selected)',
      storageFile: 'css/styles.css, js/materials.js, index.html, js/data_history.js',
      changeSummary: 'ยกเลิกกรอบเส้นขอบสีทอง (border) และเงาเรืองแสง (box-shadow) ที่ครอบคลุมทั้งแถวกราฟ เพื่อให้หน้าตากราฟแนวนอนสะอาดตา โดยแท่งกราฟหรือชื่อพัสดุที่ถูกเลือกยังคงแสดงความโดดเด่นอย่างชัดเจน',
      details: '1) ใน css/styles.css: ปรับ .mat-hchart-row.selected ให้ border: none !important; box-shadow: none !important; background: transparent !important; ทั้ง Dark และ Light Theme 2) ใน js/materials.js: ปรับการแสดงผลชื่อพัสดุ เมื่อเลือกแท่งงบประมาณสีแดงหรือส้ม ให้ชื่อพัสดุแสดงเป็นตัวหนังสือสีขาวสว่าง (.row-active-text) โดยไม่ต้องมีกรอบกล่องทองล้อมรอบชื่อ เว้นแต่คลิกที่ชื่อพัสดุโดยตรง 3) อัปเดต Cache Busters ใน index.html เป็น ?v=20261031_2142',
      sourceFile: 'คำสั่งผู้ใช้งาน: ให้เอากรอบทั้งบรรทัด ออก (ภาพ media_1793457428465_633080dc.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_materials_chart_interactive_hover_and_budget_select',
      timestamp: '2026-10-31 21:30:00',
      timestampTh: '31 ต.ค. 2569, 21:30 น.',
      type: 'EDIT',
      typeBadge: 'เลือกกราฟแยกตามงบและโฮเวอร์เด่น',
      badgeClass: 'badge-type-edit',
      title: 'ปรับปรุงการเลือกกราฟแนวนอนพัสดุ: โฮเวอร์ชื่อ/แท่งแดง/ส้มให้แสดงตัวเด่นขึ้นมา และคลิกเลือกแท่งสีแดงหรือส้มเพื่อกรองตารางตามงบนั้นทันที',
      targetSubject: 'เมนูรายการพัสดุ (กราฟแนวนอน #matHChartBody และการกรองตารางตามแท่งกราฟ)',
      storageFile: 'js/materials.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'เพิ่มเอฟเฟกต์โฮเวอร์เรืองแสงให้ชื่อพัสดุ แท่งกราฟสีแดง (งบ I, P) และแท่งกราฟสีส้ม (งบ C) แสดงตัวเด่นขึ้นมา พร้อมรองรับการคลิกเลือกแท่งสีแดงเพื่อกรองตารางเฉพาะงบ I, P หรือคลิกแท่งสีส้มเพื่อกรองตารางเฉพาะงบ C หรือคลิกชื่อพัสดุเพื่อกรองทุกงบ',
      details: '1) ใน js/materials.js: เพิ่มฟังก์ชัน window.selectMatChartItemWithBudget(name, budget, e) รองรับการเลือกพัสดุคู่กับประเภทงบประมาณ (\'IP\', \'C\', \'ALL\') พร้อมระบบ Toggle ซ้ำเพื่อยกเลิก 2) เพิ่มสถานะ matState.chartSelBudget ในการกรองแถวตารางพัสดุ getFilteredMaterialRows() ให้กรองรหัส WBS ขึ้นต้นด้วย I/P หรือ C ตรงตามแท่งกราฟที่คลิก 100% 3) แสดงสถานะแท่งกราฟที่ถูกเลือกด้วยคลาส .active-target (กรอบนีออนเรืองแสง) และหรี่แท่งที่ไม่ถูกเลือกด้วย .bar-dimmed พร้อมเครื่องหมาย ✓ ที่ชื่อพัสดุ 4) ใน css/styles.css: เพิ่มเอฟเฟกต์ :hover ขยายแท่งกราฟ scaleY(1.38) และเรืองแสงเงาแสงสดใสทั้งสีแดงและส้มพาสเทล และชื่อพัสดุสีทองสว่าง 5) เพิ่มปุ่ม #matClearChartSelBtn บนหัวตารางเพื่อความสะดวกในการปลดตัวกรองกราฟ 6) อัปเดต Cache Busters ใน index.html เป็น ?v=20261031_2130',
      sourceFile: 'คำสั่งผู้ใช้งาน: แก้ไขการเลือกกราฟ หากนำเม้าไปชี้ ชื่อพัสดุ/กราฟสีแดงหรือส้ม ให้แสดงตัวเด่นขึ้นมา และเลือกแล้ว ทั้งชื่อพัสดุ/ กราฟสีแดงหหรือเหลือง ตารางจะเปลี่ยนตามที่เลือก (ภาพ media_1793455956856_13477f29.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง'
    },
    {
      id: 'log_000_materials_scope_buttons_3rows_behind_reset',
      timestamp: '2026-10-31 21:18:00',
      timestampTh: '31 ต.ค. 2569, 21:18 น.',
      type: 'EDIT',
      typeBadge: 'ปรับเลย์เอาต์ปุ่มสถิติ 3 บรรทัด',
      badgeClass: 'badge-type-edit',
      title: 'ย้ายปุ่มสรุปจำนวนงาน WBS/พัสดุ ไปไว้ด้านหลังปุ่มล้างตัวกรอง จัดวางเป็น 3 บรรทัดแคบกะทัดรัดพอดี',
      targetSubject: 'เมนูรายการพัสดุ (แถบตัวกรองด้านบน #matSubFilterBar และปุ่ม #matToolbarWbsStats)',
      storageFile: 'js/materials.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ย้ายกลุ่มปุ่มสรุปสถิติจำนวนงาน WBS (รวม...งาน, พัสดุ...งาน, ไม่พบพัสดุ...งาน) จากด้านหน้าไปไว้ด้านหลังปุ่มล้างตัวกรอง จัดเรียงแนวตั้งเป็น 3 บรรทัดแคบพอดี เพิ่มพื้นที่แนวนอนให้ Dropdown ตัวกรอง WBS, วัสดุ และ SAP',
      details: '1) ใน js/materials.js: ย้ายองค์ประกอบ #matToolbarWbsStats จากด้านหน้าตัวกรอง WBS ไปไว้ด้านหลังปุ่มล้างตัวกรอง (ต่อจาก #matSubFilterCount) 2) ปรับแต่งโครงสร้างปุ่มภายใน #matToolbarWbsStats ให้มีคลาส .scope-btn-label, .scope-btn-val, .scope-btn-extra และ .scope-btn-check 3) ใน css/styles.css: เพิ่มคลาส .mat-sf-wbs-stats-3rows จัดเลย์เอาต์แบบ flex-direction: column จำนวน 3 บรรทัด ขนาดกะทัดรัด (ความกว้าง min 154px, ความสูงบรรทัดละ ~19px) 4) รักษาฟังก์ชันคลิกกรองงานตามสถานะมี/ไม่มีพัสดุและเอฟเฟกต์สีเน้นตามเดิม 5) อัปเดต Cache Busters ใน index.html เป็น ?v=20261031_2118',
      sourceFile: 'คำสั่งผู้ใช้งาน: แสดงไว้ด้านหลัง ล้างตัวกรองแสดงเป็น 3 บรรทัด แคบๆพอดี (ภาพ media_1793455670252_c103eaf9.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_materials_sync_chart_budget_to_table',
      timestamp: '2026-10-31 21:08:00',
      timestampTh: '31 ต.ค. 2569, 21:08 น.',
      type: 'EDIT',
      typeBadge: 'เชื่อมโยงงบกราฟกับตาราง',
      badgeClass: 'badge-type-edit',
      title: 'เชื่อมโยงตัวกรองงบประมาณจากกราฟแนวนอนสู่ตารางรายการพัสดุและตัวเลขสรุปทั้งหมด',
      targetSubject: 'เมนูรายการพัสดุ (ฟังก์ชัน getFilteredMaterialRows และตาราง #matTableBody)',
      storageFile: 'js/materials.js, js/data_history.js, index.html',
      changeSummary: 'แก้ไขให้ตารางพัสดุกรองข้อมูลตามงบที่เลือกในกราฟ (งบ C หรือ งบ I, P) โดยตรง แก้ปัญหา WBS งบ I หลุดเข้ามาในตารางเมื่อเลือกงบ C และทำให้ยอดรวมค้างเบิกตรงกัน 100%',
      details: '1) ใน js/materials.js (ฟังก์ชัน getFilteredMaterialRows): เพิ่มเงื่อนไขกรองรหัส WBS ตาม matState.chartBudgetFilter (\'C\' กรองเฉพาะ WBS ขึ้นต้นด้วย C, \'IP\' กรองเฉพาะ I และ P) และเพิ่ม chartBudgetFilter ลงใน cacheKey 2) ใน setMatChartBudgetFilter: เพิ่มการล้าง cacheKey รีเซ็ตหน้าเป็น 1 และเรียก renderMaterialsTab() เพื่อให้ตาราง ยอดรวมคอลัมน์ และการ์ด KPI สรุป อัปเดตยอดตรงกับกราฟทันที 3) เพิ่มป้ายแสดงงบที่เลือกใน matTableActiveCriteriaVal 4) อัปเดต Cache Busters ใน index.html เป็น ?v=20261031_2108',
      sourceFile: 'คำสั่งผู้ใช้งาน: ตรวจสอบทำไม ในกราฟ กับตาราง ไม่ตรงกัน เลือกงบ C ในกราฟ แต่ตาราง มี I มาด้วย ให้แก้ไขตารางอ้างอิง ที่เลือกตามกราฟ (ภาพ media_1793455293232_241440be.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง'
    },
    {
      id: 'log_000_materials_move_scope_buttons_to_top_filter_bar',
      timestamp: '2026-10-31 20:58:00',
      timestampTh: '31 ต.ค. 2569, 20:58 น.',
      type: 'EDIT',
      typeBadge: 'ย้ายปุ่มสถิติขึ้นบนตัวกรอง',
      badgeClass: 'badge-type-edit',
      title: 'ย้ายกลุ่มปุ่มสรุปจำนวนงาน WBS/พัสดุ ขึ้นไปไว้บนแถบตัวกรองด้านบน พร้อมปรับดีไซน์สีปุ่มใหม่ให้สวยงามหรูหรา',
      targetSubject: 'เมนูรายการพัสดุ (แถบตัวกรองด้านบน #matSubFilterBar และหัวตารางพัสดุ #matTableCard)',
      storageFile: 'js/materials.js, css/styles.css, js/data_history.js, index.html',
      changeSummary: 'ย้ายปุ่ม \'รวม X งาน\', \'พัสดุ X งาน\', \'ไม่พบพัสดุ Y งาน\' จากหัวตารางด้านล่างขึ้นไปไว้บนแถบตัวกรองด้านบน (#matSubFilterBar) และปรับแต่งสีปุ่มเป็นไล่เฉดทองหรูหรา, เขียวมรกต และส้มแดงเด่นชัด',
      details: '1) ใน js/materials.js: ย้ายองค์ประกอบ #matToolbarWbsStats จาก wbs-table-toolbar-left ในหัวตารางขึ้นไปวางต่อจากหัวข้อ \'🔎 ตัวกรองรายการพัสดุ\' ใน #matSubFilterBar 2) ปรับโครงสร้าง HTML และคลาสของปุ่มเป็น .mat-scope-btn (.btn-scope-all, .btn-scope-hasmat, .btn-scope-nomat) พร้อมป้ายเช็คถูก ✓ 3) ใน css/styles.css: ดีไซน์สีปุ่มใหม่แบบไล่เฉดสีนูนมิติระดับพรีเมียม (ทอง Royal PEA Gold, เขียว Radiant Emerald, ส้มแดง Sunset Coral Alert) พร้อมแสงเงาและโหมดสว่าง 4) อัปเดต Cache Busters ใน index.html เป็น ?v=20261031_2058',
      sourceFile: 'คำสั่งผู้ใช้งาน: ย้ายไปด้านบนตัวกรอง แก้ไขสีปุ่มให้สวยงามกว่านี้ (ภาพ media_1793453624655_e4eeed16.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_materials_chart_flat_colors_and_clean_budget_legend',
      timestamp: '2026-10-31 20:49:00',
      timestampTh: '31 ต.ค. 2569, 20:49 น.',
      type: 'EDIT',
      typeBadge: 'ปรับกราฟสีเดี่ยวและปุ่มเลือกงบ',
      badgeClass: 'badge-type-edit',
      title: 'ปรับกราฟแท่งค้างเบิกเป็นสีเดี่ยวไม่ไล่เฉด และปรับปุ่มแสดงสถานะงบที่เลือกให้กระชับตามคำสั่ง',
      targetSubject: 'เมนูรายการพัสดุ (กราฟแนวนอนปริมาณค้างเบิก #matHChartCard)',
      storageFile: 'css/styles.css, js/materials.js, js/data_history.js, index.html',
      changeSummary: 'ปรับแท่งกราฟทั้ง 2 งบเป็นสีเดี่ยว (Solid Flat Color) ไม่ไล่เฉดสี, เพิ่มป้ายแสดงสถานะงบที่กำลังเลือก (✓ เลือกอยู่) และนำปุ่ม \'ทั้ง 2 งบ\' ออกตามสั่ง',
      details: '1) ใน css/styles.css: ปรับ .mat-hchart-bar.bar-red เป็นสีแดงทึบ #EF4444 และ .mat-hchart-bar.bar-orange เป็นสีส้มพาสเทล #FFAF75 ไม่ใช้ linear-gradient ตามคำสั่ง 2) ใน js/materials.js: นำปุ่ม \'🌐 ทั้ง 2 งบ\' ออก เหลือปุ่ม งบ I, P และ งบ C ซึ่งแสดงป้ายไฮไลท์ ✓ เลือกอยู่ อย่างชัดเจน และสามารถคลิกซ้ำที่ปุ่มเพื่อกลับสู่การแสดงผลทั้ง 2 งบได้ 3) อัปเดต Cache Busters ใน index.html เป็น ?v=20261031_2049',
      sourceFile: 'คำสั่งผู้ใช้งาน: กราฟสีทั้ง 2 แัน ไม่ต้องไล่เฉดสี / วงเหลืองให้ แสดงว่าเลือกอันไหนอยู่ / เอาออก (ภาพ media_1793454489278_c11204d8.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_materials_chart_pastel_orange',
      timestamp: '2026-10-31 20:41:00',
      timestampTh: '31 ต.ค. 2569, 20:41 น.',
      type: 'EDIT',
      typeBadge: 'ปรับโทนสีส้มพาสเทล',
      badgeClass: 'badge-type-edit',
      title: 'ปรับแต่งสีกราฟแท่งงบ C เป็นสีส้มพาสเทลอ่อน (Soft Pastel Orange)',
      targetSubject: 'เมนูรายการพัสดุ (กราฟแนวนอนปริมาณค้างเบิก #matHChartCard)',
      storageFile: 'css/styles.css, js/materials.js, js/data_history.js, index.html',
      changeSummary: 'ปรับโทนสีแท่งกราฟงบ C, จุดกำกับสีกราฟ (Legend) และตัวเลขปริมาณค้างเบิก เป็นสีส้มพาสเทลละมุนตา (#FA9E5C -> #FFB885 -> #FFD6B3)',
      details: '1) ใน css/styles.css: ปรับ .mat-hchart-bar.bar-orange เป็นไล่เฉดส้มพาสเทลอ่อนละมุนตา linear-gradient(90deg, #FA9E5C 0%, #FFB885 60%, #FFD6B3 100%) พร้อมปรับแสงเงา box-shadow 2) ปรับจุดกำกับสีกราฟ .lg-orange เป็น #FFAF75 และปรับตัวเลขค้างเบิก .val-orange เป็น #FFCCA3 (Dark) / #D96B27 (Light) 3) ใน js/materials.js: ปรับข้อความ Legend เป็น \'ค้างเบิก งบ C (สีส้มพาสเทล)\' และ Tooltip 4) อัปเดต Cache Busters ใน index.html เป็น ?v=20261031_2041',
      sourceFile: 'คำสั่งผู้ใช้งาน: แก้ไขสีส้มแบบพาสเทล อ่อนๆ',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_materials_chart_dual_budget_colors',
      timestamp: '2026-10-31 20:40:00',
      timestampTh: '31 ต.ค. 2569, 20:40 น.',
      type: 'EDIT',
      typeBadge: 'แยกสีกราฟค้างเบิกตามงบ',
      badgeClass: 'badge-type-edit',
      title: 'ปรับสีกราฟปริมาณค้างเบิกแยกตามงบ C (ส้ม) และงบ I, P (แดง) พร้อมแสดงแท่งรวมแบบแยกสี',
      targetSubject: 'เมนูรายการพัสดุ (กราฟแนวนอนปริมาณค้างเบิก #matHChartCard)',
      storageFile: 'js/materials.js, css/styles.css, js/data_history.js, index.html',
      changeSummary: 'กำหนดให้ WBS ขึ้นต้นด้วย C ใช้แท่งกราฟสีส้ม, ขึ้นต้นด้วย I, P ใช้แท่งกราฟสีแดง และหากเลือกแสดงทั้งหมดให้รวมแท่งกราฟโดยแสดงสีแดงขึ้นก่อนตามด้วยสีส้มในแท่งเดียวกัน',
      details: '1) ใน js/materials.js (ฟังก์ชัน renderMatRemainChart): จัดกลุ่มปริมาณค้างเบิกแยกตามรหัส WBS ขึ้นต้นด้วย C (remC) และ I, P (remIp) โดยหากพัสดุมีทั้งสองงบ จะแสดงแท่งแดงก่อนแล้วต่อด้วยแท่งส้มในแท่งเดียวกัน พร้อมแสดงตัวเลขแยกสี <span class="val-red">X</span> + <span class="val-orange">Y</span> (รวม Z) 2) ปรับคำอธิบายสีกราฟ (Legend) เพิ่มจุดสีส้มสำหรับค้างเบิก งบ C 3) ใน css/styles.css: เพิ่มสไตล์ .mat-hchart-bar.bar-orange, .bar-seg-first, .bar-seg-last, .lg-orange, .val-orange และรองรับ Dark/Light theme 4) อัปเดต Cache Busters ใน index.html เป็น ?v=20261031_2041',
      sourceFile: 'คำสั่งผู้ใช้งาน: แก้ไขเฉพาะกราฟนี้เท่านั้น ให้สีกราฟปริมาณค้างเบิกแสดงแตกต่างกันระหว่าง 2 งบ (C = ส้ม, I,P = แดง, แสดงทั้งหมดรวมกันแดงขึ้นก่อนตามด้วยส้ม) (ภาพ media_1793451470677_9a9bc9de.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_materials_remove_03_from_scope_pill',
      timestamp: '2026-10-31 20:28:00',
      timestampTh: '31 ต.ค. 2569, 20:28 น.',
      type: 'EDIT',
      typeBadge: 'ตัดข้อความ 03 ออก',
      badgeClass: 'badge-type-edit',
      title: 'นำข้อความ "03" ออกจากป้ายแสดงสถานะเกณฑ์วัดตารางพัสดุ',
      targetSubject: 'เมนูรายการพัสดุ (ป้ายเกณฑ์วัด #matTableActiveCriteriaVal)',
      storageFile: 'js/materials.js, js/data_history.js, index.html',
      changeSummary: 'แก้ไขข้อความในป้ายเกณฑ์วัดจาก "X งาน / Y งาน 03 • Z รายการพัสดุ" เป็น "X งาน / Y งาน • Z รายการพัสดุ" ตามคำสั่งผู้ใช้งาน',
      details: '1) ใน js/materials.js (ฟังก์ชัน renderMaterialsTab): ปรับ rowsExtra ใน critValEl โดยตัดคำว่า "03" ออก เหลือเพียง "/ Y งาน" 2) อัปเดต Cache Busters ใน index.html เป็น ?v=20261031_2028',
      sourceFile: 'คำสั่งผู้ใช้งาน: 03 เอาออก (ภาพ media_1793451264351_58b5522a.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_materials_rename_no_mat_pill',
      timestamp: '2026-10-31 20:25:00',
      timestampTh: '31 ต.ค. 2569, 20:25 น.',
      type: 'EDIT',
      typeBadge: 'ปรับข้อความปุ่มสถานะพัสดุ',
      badgeClass: 'badge-type-edit',
      title: 'เปลี่ยนข้อความปุ่มตัวกรองและสรุปสถานะพัสดุจาก "ไม่มีพัสดุ" เป็น "ไม่พบพัสดุ"',
      targetSubject: 'เมนูรายการพัสดุ (ปุ่มตัวกรองสถานะพัสดุในแถบเครื่องมือ #matTableCard และสรุปใต้ WBS)',
      storageFile: 'js/materials.js, js/data_history.js, index.html',
      changeSummary: 'แก้ไขข้อความแสดงผลบนปุ่มตัวกรองสถานะพัสดุจาก "⚠️ ไม่มีพัสดุ" เป็น "⚠️ ไม่พบพัสดุ" ตามคำสั่งผู้ใช้งาน พร้อมปรับปรุง Tooltip และข้อความสรุปใต้หัวคอลัมน์ WBS ให้สอดคล้องกัน',
      details: '1) ใน js/materials.js (ฟังก์ชัน renderMaterialsTab): แก้ไขข้อความปุ่มตัวกรองย่อยจาก "⚠️ ไม่มีพัสดุ" เป็น "⚠️ ไม่พบพัสดุ" 2) แก้ไขข้อความสรุปใน elWbsSub จาก "ไม่มีพัสดุ" เป็น "ไม่พบพัสดุ" 3) อัปเดต Cache Busters ใน index.html เป็น ?v=20261031_2028',
      sourceFile: 'คำสั่งผู้ใช้งาน: แก้ไข เป็น ไม่พบพัสดุ (ภาพ media_1793451222480_89eed271.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_restore_data_history_and_fix_mojibake',
      timestamp: '2026-10-31 20:22:00',
      timestampTh: '31 ต.ค. 2569, 20:22 น.',
      type: 'EDIT',
      typeBadge: 'กู้คืนหน้าประวัติข้อมูล & แก้ภาษา',
      badgeClass: 'badge-type-edit',
      title: 'กู้คืนโค้ดส่วนแสดงผลหน้าประวัติข้อมูลและแก้ไขข้อความภาษาไทยให้อ่านออกสมบูรณ์ 100%',
      targetSubject: 'หน้าประวัติข้อมูล & แหล่งจัดเก็บ (#tab-data-history, js/data_history.js)',
      storageFile: 'js/data_history.js, index.html',
      changeSummary: 'กู้คืนโครงสร้างฟังก์ชันการเรนเดอร์ทั้งหมดของหน้าประวัติข้อมูล (5,615 บรรทัด) ที่เคยถูกตัดขาดตอน พร้อมแปลงข้อความไทยที่เคยเป็นต่างดาว (Double-encoded) กลับเป็นภาษาไทย UTF-8 ที่ถูกต้องอ่านออกสมบูรณ์ครบทุกจุด',
      details: '1) กู้คืนฟังก์ชันการทำงานทั้งหมดของโมดูล data_history.js (window.renderDataHistoryTab, ผัง Model View, ไทม์ไลน์บันทึกประวัติ, และการจัดการข้อมูล LocalStorage) 2) แก้ไขข้อความภาษาไทยที่อ่านไม่ออกด้วยการแปลงรหัส CP874 -> UTF-8 ทั้งหมด 2,232 บรรทัด 3) รวมประวัติการแก้ไขระบบล่าสุดทั้งหมด 268 รายการเข้าด้วยกันอย่างสมบูรณ์ 4) อัปเดต Version Cache Buster ใน index.html เป็น ?v=20261031_2028',
      sourceFile: 'คำสั่งผู้ใช้งาน: หน้าประวัติข้อมูลหายหมดเลย แก้ไขด่วน และ แก้ไขภาษาด้วย อ่านไม่ออก',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'วิกฤต (กู้คืนหน้าประวัติข้อมูลและระบบ Model View ให้กลับมาใช้งานได้สมบูรณ์)'
    },
    {
      id: 'log_000_materials_sort_english_desc_first',
      timestamp: '2026-10-31 15:30:00',
      timestampTh: '31 ต.ค. 2569, 15:30 น.',
      type: 'EDIT',
      typeBadge: 'ปรับเรียงลำดับตัวกรองพัสดุ',
      badgeClass: 'badge-type-edit',
      title: 'ปรับลำดับตัวกรองข้อความพัสดุให้รายการภาษาอังกฤษแสดงบนสุดเสมอ',
      targetSubject: 'เมนูรายการพัสดุ (ตัวกรองข้อความพัสดุ #matFilterMatDesc, ตารางพัสดุ และกราฟแท่ง)',
      storageFile: 'js/materials.js, js/data_history.js, index.html',
      changeSummary: 'ปรับปรุงฟังก์ชันเปรียบเทียบข้อความพัสดุ compareMatDescEnglishFirst() ให้เรียงรายการที่เป็นภาษาอังกฤษ/ตัวเลขอารบิก (A-Z) อยู่ด้านบนสุดเสมอ แล้วตามด้วยรายการภาษาไทย (ก-ฮ) ที่ด้านล่าง',
      details: '1) สร้างฟังก์ชัน compareMatDescEnglishFirst(a, b) ตรวจสอบอักษรเริ่มต้น โดยให้ภาษาอังกฤษ/สัญลักษณ์ภาษาอังกฤษอยู่ก่อนภาษาไทย 2) นำมาใช้ใน refreshMatSubFilterOptions() สำหรับดรอปดาวน์ #matFilterMatDesc 3) นำมาใช้ในการเรียงลำดับคอลัมน์ \"ข้อความพัสดุ\" ในตาราง และการเรียงชื่อพัสดุในกราฟแท่งแนวนอน',
      sourceFile: 'คำสั่งผู้ใช้งาน: ตัวกรองข้อความพัสดุ ให้แก้ไขเป็น รายการภาษาอังกฤษ บนสุด',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_materials_update_wbs_label_units',
      timestamp: '2026-10-31 15:20:00',
      timestampTh: '31 ต.ค. 2569, 15:20 น.',
      type: 'EDIT',
      typeBadge: 'ปรับข้อความสรุปงาน',
      badgeClass: 'badge-type-edit',
      title: 'นำข้อความซ้ำออก และเปลี่ยนหน่วยนับ "รายการ" และ "WBS" เป็น "งาน"',
      targetSubject: 'เมนูรายการพัสดุ (ป้ายเกณฑ์วัด #matTableActiveCriteriaVal และปุ่มสรุป Toolbar #matToolbarWbsStats)',
      storageFile: 'js/materials.js, js/data_history.js, index.html',
      changeSummary: 'นำข้อความ "• ซ้ำ N รายการ" ออกทั้งหมด พร้อมเปลี่ยนคำว่า "WBS" และ "รายการ" เป็นคำว่า "งาน" ตามคำสั่งผู้ใช้งาน',
      details: '1) นำข้อความ "• ซ้ำ..." ออกจากป้ายเกณฑ์วัดและปุ่มสรุป Toolbar ตารางพัสดุ 2) เปลี่ยนข้อความระบุจำนวนในป้ายเกณฑ์วัดจาก "WBS" และ "รายการ 03" เป็น "งาน" เช่น "(1 งาน / 2,083 งาน 03 • 86 รายการพัสดุ)" 3) เปลี่ยนข้อความในปุ่มสรุป Toolbar จาก "(2,083 รายการ)" เป็น "(2,083 งาน)"',
      sourceFile: 'คำสั่งผู้ใช้งาน: เอาซ้ำออก และเปลี่ยน รายการ เป็นงาน และ WBS เปลี่ยนเป็น งาน (ภาพ media_1793434542712_bd428678.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_materials_update_no_mat_text',
      timestamp: '2026-10-31 15:18:00',
      timestampTh: '31 ต.ค. 2569, 15:18 น.',
      type: 'EDIT',
      typeBadge: 'ปรับข้อความตารางพัสดุ',
      badgeClass: 'badge-type-edit',
      title: 'ปรับข้อความสถานะไม่มีพัสดุในตารางเป็น "ไม่มีรายการพัสดุค้างเบิก"',
      targetSubject: 'เมนูรายการพัสดุ (เซลล์คอลัมน์ข้อความวัสดุของงานที่ไม่มีพัสดุ)',
      storageFile: 'js/materials.js, js/data_history.js, index.html',
      changeSummary: 'แก้ไขข้อความในคอลัมน์ข้อความวัสดุจาก "ไม่มีรายการพัสดุ" เป็น "ไม่มีรายการพัสดุค้างเบิก" ตามคำสั่งผู้ใช้งาน',
      details: '1) แก้ไขข้อความในเซลล์คอลัมน์ข้อความวัสดุ (matDesc) สำหรับงาน WBS ที่ไม่มีรายการในไฟล์ 07 จาก "⚠️ ไม่มีรายการพัสดุ" เป็น "⚠️ ไม่มีรายการพัสดุค้างเบิก" 2) อัปเดตค่าฟิลด์ matDesc ของแถว placeholder (noMat: true) ใน ensureMaterialsHydrated() ให้ตรงกัน',
      sourceFile: 'คำสั่งผู้ใช้งาน: ให้แก้ไข ไม่มีรายการพัสดุค้างเบิก (ภาพ media_1793434360262_d9d0c6f2.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_materials_cascading_subfilters',
      timestamp: '2026-10-31 15:10:00',
      timestampTh: '31 ต.ค. 2569, 15:10 น.',
      type: 'EDIT',
      typeBadge: 'ตัวกรองพัสดุเชื่อมโยงกัน',
      badgeClass: 'badge-type-edit',
      title: 'ปรับตัวกรองรายการพัสดุ (WBS และข้อความวัสดุ) ให้แสดงเฉพาะตัวเลือกที่ตรงกับเงื่อนไขที่เลือก (Cascading Sub-filters)',
      targetSubject: 'เมนูรายการพัสดุ (Dropdown #matFilterWbs และ #matFilterMatDesc บนแถบเรืองแสง)',
      storageFile: 'js/materials.js, js/data_history.js, index.html',
      changeSummary: 'เมื่อเลือกงาน WBS จะกรองแสดงเฉพาะข้อความวัสดุที่อยู่ในงานนั้น และเมื่อเลือกข้อความวัสดุจะกรองแสดงเฉพาะงาน WBS ที่มีวัสดุนั้น ไม่แสดงทุกรายการตลอดเวลา',
      details: '1) ใน refreshMatSubFilterOptions() ปรับการสร้างตัวเลือกของ Dropdown ข้อความวัสดุ (#matFilterMatDesc) ให้แสดงเฉพาะพัสดุในงาน WBS ที่เลือก (เช่น เมื่อเลือก WBS C-67-I-BLNSR.0160.02.2 จะแสดงเฉพาะ 4 รายการพัสดุของงานนั้น ไม่แสดง 530 รายการทั้งหมด) 2) ปรับการสร้างตัวเลือกของ Dropdown WBS (#matFilterWbs) ให้แสดงเฉพาะงาน WBS ที่มีวัสดุที่เลือก 3) ปรับป้ายหัวตัวเลือกเป็น "พัสดุในงานนี้ (N รายการ)" หรือ "งานที่มีพัสดุนี้ (N งาน)" ให้ชัดเจน 4) เพิ่มระบบป้องกันความขัดแย้งของตัวเลือก เมื่อสลับงาน WBS ที่ไม่มีวัสดุเดิม ระบบจะรีเซ็ตค่าพัสดุอัตโนมัติ',
      sourceFile: 'คำสั่งผู้ใช้งาน: ตัวกรองรายการพัสดุ ให้แสดงเฉพาะรายการ ที่ขึ้นกับตัวกรองที่เลือก ไม่ต้องแสดงทุกรายการตลอดเวลา (ภาพ media_1793433111895_1b956200.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_materials_default_sort_remain_qty_desc',
      timestamp: '2026-10-31 15:05:00',
      timestampTh: '31 ต.ค. 2569, 15:05 น.',
      type: 'CONFIG',
      typeBadge: 'ตั้งค่าเรียงลำดับตาราง',
      badgeClass: 'badge-type-config',
      title: 'กำหนด Default เรียงลำดับตารางรายการพัสดุตามปริมาณค้างเบิกสูงสุดอยู่ด้านบนสุดเสมอ',
      targetSubject: 'เมนูรายการพัสดุ (การเรียงลำดับตาราง #matDataTable คอลัมน์ remainQty)',
      storageFile: 'js/materials.js, js/data_history.js, index.html',
      changeSummary: 'ตั้งค่าเริ่มต้น (Default) ให้ตารางรายการพัสดุเรียงลำดับตามปริมาณค้างเบิกจากมากไปน้อย (descending) เสมอ',
      details: '1) ปรับค่าเริ่มต้น matState.sortCol เป็น "remainQty" และ matState.sortAsc เป็น false เพื่อให้รายการพัสดุที่มีปริมาณค้างเบิกสูงสุดแสดงอยู่ด้านบนสุดเสมอ 2) อัปเดตส่วนหัวคอลัมน์ "ปริมาณค้างเบิก" ให้แสดงลูกศรชี้ลง (▼) แสดงสถานะเรียงลำดับจากมากไปน้อย 3) ปรับให้ฟังก์ชันรีเซ็ตและสลับคอลัมน์ตัวเลขเริ่มต้นเรียงจากมากไปน้อย',
      sourceFile: 'คำสั่งผู้ใช้งาน: default ให้แสดงปริมาณค้างเบิกสูงสุด ด้านบนสุดเสมอ (ภาพ media_1793432765632_96a5d732.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_materials_remove_subfilter_opt_count',
      timestamp: '2026-10-31 15:00:00',
      timestampTh: '31 ต.ค. 2569, 15:00 น.',
      type: 'EDIT',
      typeBadge: 'นำป้ายสถิติตัวกรองออก',
      badgeClass: 'badge-type-edit',
      title: 'นำข้อความสรุปจำนวนตัวเลือก WBS และพัสดุออกจากแถบตัวกรองเรืองแสงสีม่วง',
      targetSubject: 'เมนูรายการพัสดุ (แถบตัวกรองเรืองแสง #matSubFilterBar ส่วน #matSubFilterOptCount)',
      storageFile: 'js/materials.js, js/data_history.js, index.html',
      changeSummary: 'นำข้อความแสดงสถิติจำนวน "WBS N • วัสดุ N" ทางขวาสุดของแถบตัวกรองเรืองแสงสีม่วงออกตามคำสั่งผู้ใช้งาน',
      details: '1) นำองค์ประกอบ <span id="matSubFilterOptCount"> ออกจากแถบตัวกรองเรืองแสงสีม่วง (#matSubFilterBar) เพื่อให้ส่วนท้ายของแถบมีความสะอาด เรียบร้อย และไม่แสดงข้อความสถิติที่ซ้ำซ้อน 2) ลบฟังก์ชันการอัปเดตข้อความสถิติตัวเลือกดังกล่าวใน refreshMatSubFilterOptions()',
      sourceFile: 'คำสั่งผู้ใช้งาน: วงแดงเอาออก (ภาพ media_1793432356330_72074cbb.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_materials_sap_filter_remove_counts_and_fix_show_all',
      timestamp: '2026-10-31 14:55:00',
      timestampTh: '31 ต.ค. 2569, 14:55 น.',
      type: 'EDIT',
      typeBadge: 'ปรับปรุงตัวกรองสถานะ SAP',
      badgeClass: 'badge-type-edit',
      title: 'นำจำนวนตัวเลขออกจากตัวกรองสถานะ SAP และปรับให้ปุ่มแสดงทั้งหมดทำงานได้สมบูรณ์',
      targetSubject: 'เมนูรายการพัสดุ (Dropdown ตัวกรองสถานะ SAP #matSapThDropdownPanel)',
      storageFile: 'js/materials.js, js/data_history.js, index.html',
      changeSummary: 'นำตัวเลขจำนวนรายการทั้งหมดและจำนวนของแต่ละสถานะ SAP ออก พร้อมปรับให้ตัวเลือก "แสดงทั้งหมด" มี Checkbox แสดงสถานะการเลือกและคลิกใช้งานได้จริง',
      details: '1) นำตัวเลขจำนวนรวมด้านบน (เช่น 65,275) และตัวเลขจำนวนรายการด้านขวาของแต่ละสถานะ SAP (เช่น 37,944, 16,984 ฯลฯ) ออกตามคำสั่งผู้ใช้งาน 2) ปรับตัวเลือก "แสดงทั้งหมด" เป็นรายการแรกพร้อม Checkbox และไฮไลต์สีทอง เมื่ออยู่ในสถานะไม่กรองจะติ๊กถูกอัตโนมัติ 3) ปรับปรุงให้คลิกเลือก "แสดงทั้งหมด" เพื่อรีเซ็ตสถานะและแสดงผลรายการพัสดุทั้งหมดได้ทันที ทั้งจากรายการแรกและปุ่มด้านล่าง 4) เชื่อมโยงการอัปเดตป้ายปุ่มด้านบนเป็น "ทั้งหมด" หรือชื่อสถานะที่เลือกแบบ Real-time',
      sourceFile: 'คำสั่งผู้ใช้งาน: เอาจำนวนออก และแสดงทั้งหมดให้ใช้ได้จริง (ภาพ media_1793432289560_6545a59d.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_materials_remove_clear_table_selections_btn',
      timestamp: '2026-10-31 14:50:00',
      timestampTh: '31 ต.ค. 2569, 14:50 น.',
      type: 'EDIT',
      typeBadge: 'นำปุ่มล้างตัวเลือกออก',
      badgeClass: 'badge-type-edit',
      title: 'นำปุ่มล้างตัวเลือกทั้งหมดในตารางนี้ออกจาก Toolbar ตารางรายการพัสดุ',
      targetSubject: 'เมนูรายการพัสดุ (ปุ่ม #btnClearMatTableSelections บน Toolbar ตารางพัสดุ)',
      storageFile: 'js/materials.js, js/data_history.js, index.html',
      changeSummary: 'นำปุ่มล้างตัวเลือกทั้งหมดในตารางนี้ (#btnClearMatTableSelections) ออกจากแถบเครื่องมือของตารางรายการพัสดุตามคำสั่งผู้ใช้งาน',
      details: '1) นำปุ่ม "ล้างตัวเลือกทั้งหมดในตารางนี้" (#btnClearMatTableSelections) ออกจากแถบเครื่องมือของตารางรายการพัสดุ เพื่อลดความซ้ำซ้อน เนื่องจากมีปุ่ม "ล้างตัวกรอง" บนแถบตัวกรองเรืองแสงสีม่วงด้านบน (#matSubFilterBar) อยู่แล้ว 2) จัดระยะห่างปุ่มแถวต่อหน้าและปุ่มขยายเต็มจอให้กระชับและสบายตายิ่งขึ้น',
      sourceFile: 'คำสั่งผู้ใช้งาน: วงเหลืองเอาออก (ภาพ media_1793432024264_81ca6251.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_materials_show_duplicate_wbs_count',
      timestamp: '2026-10-31 14:45:00',
      timestampTh: '31 ต.ค. 2569, 14:45 น.',
      type: 'EDIT',
      typeBadge: 'แสดงจำนวนรวม WBS ซ้ำ',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มการแสดงผลจำนวนรวม WBS ที่ซ้ำกันในปุ่มสรุปงาน WBS ของตารางรายการพัสดุ',
      targetSubject: 'เมนูรายการพัสดุ (ปุ่มสถิติ WBS ใน Toolbar ตารางพัสดุ #matToolbarWbsStats)',
      storageFile: 'js/materials.js, css/styles.css, js/data_history.js, index.html',
      changeSummary: 'แสดงจำนวนรายการ WBS ที่ซ้ำกัน (เช่น ซ้ำ 14 รายการ) เพิ่มเติมในปุ่มสรุปขอบเขตงาน WBS และป้ายเกณฑ์วัดของตารางพัสดุ',
      details: '1) ในปุ่มสรุปขอบเขตงาน WBS (.btn-tb-scope-pill) เพิ่มการคำนวณและแสดงจำนวนรายการ WBS ที่ซ้ำกันอย่างชัดเจน เช่น "รวม 2,069 งาน (2,083 รายการ • ซ้ำ 14 รายการ)" พร้อมไฮไลต์ข้อความสีทองเรืองแสง (.pill-dup-tag) 2) เพิ่มการแสดงจำนวนรายการซ้ำในป้ายเกณฑ์วัดด้านซ้ายของตาราง (#matTableActiveCriteriaVal) เช่น "(2,069 WBS / 2,083 รายการ 03 • ซ้ำ 14 รายการ • ...)" 3) แสดงผลแบบไดนามิกตามเงื่อนไขตัวกรอง และไม่แสดงส่วนซ้ำหากไม่มี WBS ที่ซ้ำกัน 4) อัปเดต Tooltip อธิบายรายละเอียดขอบเขตงาน WBS ครบถ้วน',
      sourceFile: 'คำสั่งผู้ใช้งาน: ให้แสดงเพิ่ม จำนวนรวม WBS ซ้ำกันด้วย',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_materials_remove_chart_selbar',
      timestamp: '2026-10-31 14:35:00',
      timestampTh: '31 ต.ค. 2569, 14:35 น.',
      type: 'EDIT',
      typeBadge: 'นำแถบกรองในกราฟออก',
      badgeClass: 'badge-type-edit',
      title: 'นำแถบแจ้งเตือนการเลือกวัสดุในกราฟแนวนอนออก และให้แสดงเฉพาะในตารางรายการพัสดุ',
      targetSubject: 'เมนูรายการพัสดุ (แถบ #matHChartSelBar)',
      storageFile: 'js/materials.js, css/styles.css, index.html',
      changeSummary: 'นำแถบกรองสีแดงวงเหลือง (#matHChartSelBar) ออกจากการ์ดกราฟแนวนอน ให้การกรองตามวัสดุที่คลิกแสดงผลตรงที่ตารางรายการพัสดุอย่างเดียว',
      details: '1) นำองค์ประกอบ #matHChartSelBar ออกจากการ์ดกราฟแนวนอน ไม่แสดงแถบแจ้งเตือนเกะกะสายตา 2) เมื่อคลิกแท่งกราฟแนวนอน ระบบจะไฮไลต์แท่งที่เลือกบนกราฟ และกรองตารางรายการพัสดุด้านล่างให้แสดงเฉพาะพัสดุนั้นทันที 3) เพิ่มข้อความระบุชื่อพัสดุที่เลือกในป้ายเกณฑ์วัดของตารางพัสดุ (#matTableActiveCriteriaVal) เพื่อให้ผู้ใช้ทราบเงื่อนไขการกรองบนตัวตารางโดยตรง 4) คลิกซ้ำที่แท่งเดิมเพื่อยกเลิกการเลือกได้ตามปกติ',
      sourceFile: 'คำสั่งผู้ใช้งาน: วงเหลืองเอาออก แสดงเฉพาะที่รายการพัสดุอย่างเดียว',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_materials_move_wbs_stats_replace_search',
      timestamp: '2026-10-31 14:30:00',
      timestampTh: '31 ต.ค. 2569, 14:30 น.',
      type: 'EDIT',
      typeBadge: 'ปรับตำแหน่งสรุปงาน WBS',
      badgeClass: 'badge-type-edit',
      title: 'ย้ายปุ่มสรุปจำนวนงาน WBS จากหัวตารางมาแทนที่ช่องค้นหาเดิมในแถบเครื่องมือ',
      targetSubject: 'เมนูรายการพัสดุ (แถบเครื่องมือตาราง #matToolbarWbsStats)',
      storageFile: 'js/materials.js, css/styles.css, index.html',
      changeSummary: 'นำช่องค้นหาเดิม (วงแดง) ออก และนำกล่องสรุปจำนวนงาน WBS รวม/มีพัสดุ/ไม่มีพัสดุ (วงเหลือง) จากหัวคอลัมน์ WBS มาแทนที่',
      details: '1) นำช่องค้นหา #matLocalSearchInput ออกจากแถบเครื่องมือตารางพัสดุ 2) นำป้ายสรุปจำนวนงาน WBS (รวม...งาน, พัสดุ...งาน, ไม่มีพัสดุ...งาน) จากหัวคอลัมน์ WBS ขึ้นมาวางแทนที่ช่องค้นหาใน Toolbar (#matToolbarWbsStats) พร้อมรักษาการทำงานคลิกกรองงานมี/ไม่มีพัสดุ 3) ล้างส่วนแสดงผล metricHtml ในหัวคอลัมน์ WBS ให้เหลือเฉพาะชื่อคอลัมน์สะอาดตา 4) เพิ่มสไตล์ .btn-tb-scope-pill และ .tb-hasmat-group รองรับทั้ง Dark และ Light Theme',
      sourceFile: 'คำสั่งผู้ใช้งาน: วงแดงเอาออก แล้วเอาวงเหลืองมาแทนที่',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_materials_sticky_purple_filter_and_reselect_fix',
      timestamp: '2026-10-31 14:25:00',
      timestampTh: '31 ต.ค. 2569, 14:25 น.',
      type: 'EDIT',
      typeBadge: 'ตัวกรองพัสดุ Sticky เรืองแสง & แก้เลือกซ้ำ',
      badgeClass: 'badge-type-edit',
      title: 'ปรับแถบตัวกรองรายการพัสดุให้ติดตรึงบนสุด (Sticky) ตลอดเวลา พื้นหลังม่วงเรืองแสง และแก้ปัญหาเลือกข้อมูลใหม่ไม่ขึ้น',
      targetSubject: 'เมนูรายการพัสดุ (#matSubFilterBar)',
      storageFile: 'js/materials.js, css/styles.css, index.html',
      changeSummary: 'แถบตัวกรองหน้ารายการพัสดุติดบนสุดตลอดการเลื่อนหน้าจอ พื้นหลังม่วงไล่เฉดเรืองแสง และเปลี่ยน WBS / ข้อความวัสดุเป็น Select Dropdown พร้อมปุ่มเคลียร์ด่วน ✕ เลือกเปลี่ยนรายการใหม่ได้ตลอดเวลา',
      details: '1) ปรับ .mat-sub-filter-bar เป็น position: sticky; top: var(--sticky-header-height, 134px); z-index: 92; ค้างตรึงใต้แถบ Sticky Header ตลอดเวลาแม้เลื่อนถึงล่างสุด 2) ปรับพื้นหลังเป็น Gradient สีม่วงเข้มเรืองแสงสไตล์ PEA พร้อมเงา Box-shadow สีม่วงทองและเส้นขอบทอง 3) แก้ปัญหาเลือกค่าแล้วเลือกใหม่ไม่ขึ้น โดยเปลี่ยนจาก input datalist เป็น select dropdown ที่คงรายการตัวเลือกทั้งหมดไว้ตลอด ทำให้ผู้ใช้คลิกเลือกเปลี่ยน WBS หรือข้อความวัสดุใหม่ได้ทันที 4) เพิ่มปุ่มกากบาทสีแดง ✕ ด้านข้างเพื่อล้างค่าตัวกรองรายช่องได้ด้วยคลิกเดียว',
      sourceFile: 'คำสั่งผู้ใช้งาน: ตัวกรองให้คงแสดงไว้ด้าบบน และให้เห็นตลอดเวลา แม้เลื่อนมาล่างสุด และปรับพื้นหลังม่วงไล่เฉดสีสวยงามเรืองแสง / เลือกข้อมูลในตัวกรองแล้ว จะเลือกใหม่ทำไม่ขึ้นข้อมูล ให้แก้ไข',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_materials_hbar_chart',
      timestamp: '2026-10-31 14:08:00',
      timestampTh: '31 ต.ค. 2569, 14:08 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มกราฟแนวนอนหน้าพัสดุ',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มกราฟแนวนอนปริมาณค้างเบิกแยกตามข้อความวัสดุ ในเมนูรายการพัสดุ',
      targetSubject: 'เมนูรายการพัสดุ (กราฟแนวนอน #matHChartCard)',
      storageFile: 'js/materials.js, css/styles.css, index.html',
      changeSummary: 'กราฟแท่งแดงแนวนอน เรียงมากสุดอยู่บน น้อยสุดอยู่ล่าง ลิงก์ตัวกรองทั้งหมด คลิกรายการเพื่อกรองตารางทางเดียว และเผื่อช่องกราฟเขียวสำหรับไฟล์ 08',
      details: 'เพิ่ม renderMatRemainChart รวมปริมาณค้างเบิก (remainQty) ตาม matDesc จากแถวที่มีพัสดุและค้างเบิก > 0 เท่านั้น เรียกผ่าน getFilteredMaterialRows(false, true) เพื่อใช้ตัวกรองทั้งหมดยกเว้นตัวเลือกจากกราฟเอง เพิ่ม matState.chartSelDesc, selectMatChartItem / clearMatChartSelection (คลิกซ้ำเพื่อยกเลิก) การเลือกจากตารางไม่ส่งผลกลับมาที่กราฟ เพิ่มช่อง .track-green ใต้แท่งแดงทุกรายการ (data-stock-slot) สำหรับปริมาณคงเหลือในคลังจากไฟล์ 08 ในอนาคต จำกัดแสดง 500 อันดับแรกและเลื่อนดูได้',
      sourceFile: 'คำสั่งผู้ใช้งาน: สร้างกราฟแนวนอนปริมาณค้างเบิก ตามภาพตัวอย่าง',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_materials_sap_panel_zindex',
      timestamp: '2026-10-30 22:05:00',
      timestampTh: '30 ต.ค. 2569, 22:05 น.',
      type: 'EDIT',
      typeBadge: 'แก้ป๊อปอัปสถานะ SAP โดนบัง',
      badgeClass: 'badge-type-edit',
      title: 'แก้รายการตัวกรองสถานะ SAP ถูกตารางบัง',
      targetSubject: 'แถบตัวกรองหน้ารายการพัสดุ (.mat-sub-filter-bar)',
      storageFile: 'css/styles.css, index.html',
      changeSummary: 'เพิ่ม position:relative และ z-index ให้แถบตัวกรอง เพื่อให้ป๊อปอัปสถานะ SAP แสดงทับตาราง',
      details: 'แถบใช้ backdrop-filter จึงสร้าง stacking context ทำให้ป๊อปอัปถูกการ์ดตารางที่อยู่ถัดมาทับ จึงกำหนด .mat-sub-filter-bar z-index 600 และ .mat-sf-sap-panel z-index 700',
      sourceFile: 'คำสั่งผู้ใช้งาน: สถานะSAP โดนตารางบัง',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_materials_sap_filter_to_top',
      timestamp: '2026-10-30 22:00:00',
      timestampTh: '30 ต.ค. 2569, 22:00 น.',
      type: 'EDIT',
      typeBadge: 'ย้ายตัวกรองสถานะ SAP',
      badgeClass: 'badge-type-edit',
      title: 'ย้ายตัวกรองสถานะ SAP จากหัวตารางไปไว้แถบตัวกรองด้านบน (แทนตัวเดิม)',
      targetSubject: 'เมนูรายการพัสดุ (ตัวกรองสถานะ SAP)',
      storageFile: 'js/materials.js, css/styles.css, index.html',
      changeSummary: 'เอาปุ่มกรองสถานะ SAP ออกจากหัวตาราง และแทนที่ Dropdown สถานะ SAP ด้านบนด้วยตัวเลือกหลายสถานะ (Multi-select) ชุดเดียวกัน',
      details: 'ย้าย panel #matSapThDropdownPanel เข้าแถบ .mat-sub-filter-bar เพิ่มปุ่ม #matSfSapBtn ใช้ matState.sapStatuses ร่วมกับตาราง ตัวเลือก WBS/ข้อความวัสดุ เชื่อมโยงกับสถานะ SAP ที่เลือก และปุ่มล้างตัวกรองล้างสถานะ SAP ด้วย',
      sourceFile: 'คำสั่งผู้ใช้งาน: สถานะ SAP ในตารางให้เอาออก ไปไว้ด้านบนแทนตัวด้านบนเดิม',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_materials_hide_kpi_cards',
      timestamp: '2026-10-30 21:50:00',
      timestampTh: '30 ต.ค. 2569, 21:50 น.',
      type: 'EDIT',
      typeBadge: 'ซ่อนการ์ด KPI หน้าพัสดุ',
      badgeClass: 'badge-type-edit',
      title: 'เอาการ์ดสรุป KPI 4 ใบออกจากเมนูรายการพัสดุ',
      targetSubject: 'เมนูรายการพัสดุ (#matKpiSummaryGrid)',
      storageFile: 'js/materials.js, index.html',
      changeSummary: 'ซ่อนการ์ดสรุป 4 ใบ (รายการพัสดุ, ค้างเบิก, ปริมาณ, รวมราคา) ตามคำสั่งผู้ใช้งาน',
      details: 'เปลี่ยน style ของ #matKpiSummaryGrid เป็น display:none !important คง element และ id เดิมไว้เพื่อไม่ให้ฟังก์ชันอัปเดตตัวเลขใน renderMaterialsTab เกิดข้อผิดพลาด สามารถเปิดกลับได้โดยแก้ style กลับเป็น display:grid',
      sourceFile: 'คำสั่งผู้ใช้งาน: เอาทั้ง 4 อันออก',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_materials_sub_filters_dropdown',
      timestamp: '2026-10-30 21:45:00',
      timestampTh: '30 ต.ค. 2569, 21:45 น.',
      type: 'EDIT',
      typeBadge: 'ตัวกรองหน้าพัสดุแบบ Dropdown',
      badgeClass: 'badge-type-edit',
      title: 'เปลี่ยนตัวกรอง WBS / ข้อความวัสดุ / สถานะ SAP เป็น Dropdown ลิงก์กับตารางรายการพัสดุ',
      targetSubject: 'เมนูรายการพัสดุ (#tab-materials)',
      storageFile: 'js/materials.js, css/styles.css, index.html',
      changeSummary: 'ตัวเลือก WBS และข้อความวัสดุแสดงตามเกณฑ์วัด/พื้นที่/กฟฟ. ที่เลือก และเชื่อมโยงกันเอง (Cascading) เมื่อเลือกแล้วตารางและการ์ด KPI กรองตามทันที',
      details: 'เพิ่ม refreshMatSubFilterOptions สร้าง datalist (WBS, ข้อความวัสดุ) และ select สถานะ SAP (REL/TECO/CLSD + รหัสจริง) จากแถว Mvt 281 ที่ผ่านตัวกรองด้านบน เพิ่มโหมดตรงตัว (filterWbsExact / filterMatDescExact) เมื่อเลือกจากรายการ และรีเฟรชตัวเลือกทุกครั้งที่ตัวกรองเปลี่ยน',
      sourceFile: 'คำสั่งผู้ใช้งาน: แก้ไขตัวกรองเป็น Dropdown list ลิงก์กับตารางรายการพัสดุ',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_materials_sub_filters',
      timestamp: '2026-10-30 21:35:00',
      timestampTh: '30 ต.ค. 2569, 21:35 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มตัวกรองหน้ารายการพัสดุ',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มแถบตัวกรองย่อย WBS / ข้อความวัสดุ / สถานะ SAP ในเมนูรายการพัสดุ',
      targetSubject: 'เมนูรายการพัสดุ (#tab-materials)',
      storageFile: 'js/materials.js, css/styles.css, index.html',
      changeSummary: 'เพิ่มแถบกรองบรรทัดใหม่เหนือการ์ด KPI กรองได้เฉพาะหน้ารายการพัสดุ พร้อมปุ่มล้างตัวกรองและจำนวนที่พบ',
      details: 'เพิ่ม matState.filterWbs / filterMatDesc / filterSapStatus, รวมเข้า cacheKey และเงื่อนไขใน getFilteredMaterialRows (การ์ด KPI และตารางอัปเดตตาม) เพิ่ม handleMatSubFilter / resetMatSubFilters และสไตล์ .mat-sub-filter-bar ไม่กระทบหน้าภาพรวมและ WBS',
      sourceFile: 'คำสั่งผู้ใช้งาน: เพิ่มตัวกรอง WBS, ข้อความวัสดุ, สถานะ SAP หน้ารายการพัสดุ',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_fix_history_mojibake',
      timestamp: '2026-10-30 21:25:00',
      timestampTh: '30 ต.ค. 2569, 21:25 น.',
      type: 'EDIT',
      typeBadge: 'แก้ไขภาษาไทยหน้าประวัติ',
      badgeClass: 'badge-type-edit',
      title: 'แก้ข้อความภาษาไทยอ่านไม่ออกในหน้าประวัติการนำเข้า & แก้ไขข้อมูล',
      targetSubject: 'หน้าประวัติ (Model View / Timeline / Storage)',
      storageFile: 'js/data_history.js, index.html',
      changeSummary: 'กู้คืนข้อความไทยที่ถูกเข้ารหัสซ้ำสองชั้น (UTF-8 ถูกอ่านเป็น CP874) กลับเป็นข้อความปกติทั้งไฟล์',
      details: 'ตรวจพบว่าไฟล์ data_history.js มีข้อความไทยเสีย (double-encoded) ประมาณ 2,200 บรรทัด จึงแปลงกลับรายบรรทัด (CP874 bytes → UTF-8) บันทึกเป็น UTF-8 BOM และสำรองไฟล์เดิมไว้ที่ scratch/data_history.backup_before_fix.js พร้อมอัปเดต Cache Buster ใน index.html',
      sourceFile: 'คำสั่งผู้ใช้งาน: แก้ไขหน้าประวัติ ภาษาอ่านไม่ออก',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง'
    },

    {
      id: 'log_000_temp_unlock_all_locks',
      timestamp: '2026-10-30 21:05:00',
      timestampTh: '30 ต.ค. 2569, 21:05 น.',
      type: 'CONFIG',
      typeBadge: 'ปลดล็อคระบบชั่วคราว',
      badgeClass: 'badge-type-config',
      title: 'ปลดล็อคปุ่มล็อคการแก้ไข WBS และปุ่มล็อคเมนูนำทางชั่วคราวตามคำสั่งผู้ใช้งาน',
      targetSubject: 'ปุ่มล็อคตาราง WBS (#btnToggleWbsEditLock, #btnThWbsNoteLock, .btn-wbs-inline-edit) และปุ่มล็อค 3 เมนู (#btnToggleNavTabsLock)',
      storageFile: 'js/app.js, js/wbs.js, index.html, js/data_history.js',
      changeSummary: 'ตามคำสั่งผู้ใช้งาน: "ปุ่มล็อค ให้ปลดล็อคชั่วคราวก่อน" ดำเนินการตั้งค่าเริ่มต้นของระบบล็อคให้ปลดล็อคชั่วคราว (Default Unlocked): 1) ปลดล็อคการแก้ไขตาราง WBS (_wbsEditUnlockedInMemory = true) ปุ่มแก้ไขทุกแถวเปลี่ยนเป็นไอคอนดินสอ ✏️ สามารถคลิกแก้ไขแผนงานและหมายเหตุ Google Sheet ได้ทันทีโดยไม่ต้องผ่าน Admin PIN 2) ปลดล็อคแถบเมนูนำทาง 3 เมนู (_navTabsUnlockedInMemory = true) สามารถคลิกเข้าแท็บ วิเคราะห์เปรียบเทียบ, ศูนย์แจ้งเตือน และประวัติข้อมูล ได้ทันที 3) ผู้ดูแลระบบยังสามารถกดปุ่มล็อคเพื่อล็อคระบบกลับได้ตลอดเวลาตามต้องการ',
      details: 'อัปเดต _wbsEditUnlockedInMemory และ _navTabsUnlockedInMemory ใน js/app.js ให้เป็น true โดยปริยาย, ปรับ initWbsApp() ใน js/wbs.js ให้เรียก setWbsEditAuthenticated(true), และอัปเดต Cache Busters ?v=20261030_2105 ใน index.html',
      sourceFile: 'คำสั่งผู้ใช้งาน: "ปุ่มล็อค ให้ปลดล็อคชั่วคราวก่อน"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (อำนวยความสะดวกในการใช้งานและแก้ไขข้อมูลได้ทันที)'
    },
    {
      id: 'log_000_dh_file_07_card_hidden_rules_toggle_btn',
      timestamp: '2026-10-30 20:55:00',
      timestampTh: '30 ต.ค. 2569, 20:55 น.',
      type: 'EDIT',
      typeBadge: 'ซ่อนข้อความสรุปและเพิ่มปุ่มเปิดดู',
      badgeClass: 'badge-type-edit',
      title: 'ปรับปรุงการ์ดไฟล์ 07: ซ่อนข้อความสรุปเงื่อนไขการแสดงผลไว้ในการ์ด และเพิ่มปุ่มกดเปิด/ปิดดูรายละเอียดได้ตามต้องการ',
      targetSubject: 'การ์ดไฟล์ 07 ในหน้าประวัติการนำเข้าและแก้ไขข้อมูล (#tab-data-history, js/data_history.js)',
      storageFile: 'js/data_history.js, index.html',
      changeSummary: 'ตามคำสั่งผู้ใช้งาน: "ข้อความให้ซ่อน อยู่ในการ์ด กดปุ่มถึงจะดูได้" ดำเนินการปรับปรุงการ์ดไฟล์ 07 บนหน้าประวัติ 1) ซ่อนข้อความสรุปประวัติเงื่อนไขการประมวลผล (แสดง/ไม่แสดง เช่น เฉพาะรหัส 1*, เฉพาะ Mvt 281) เริ่มต้นให้ซ่อนไว้ ไม่รกการ์ด 2) เพิ่มปุ่มกด "📋 เงื่อนไขสรุปการแสดง / ไม่แสดงข้อมูล (คลิกดู) ▼" บนการ์ดไฟล์ 07 เมื่อคลิกปุ่มจะคลี่แสดงรายละเอียดเงื่อนไขออกมาอย่างสวยงาม และเปลี่ยนปุ่มเป็น "▲ ซ่อนเงื่อนไข" 3) ป้องกัน Event Bubble ไม่ให้คลิกปุ่มแล้วเด้งเปิด Model View Modal 4) คงการแสดงผลเงื่อนไขแบบเต็มใน Model View Modal ครบถ้วนสมบูรณ์',
      details: 'เพิ่มโครงสร้าง dh-btn-toggle-rules และ dh-rules-hidden-box (display: none) ใน dh-file-card, สร้างฟังก์ชัน window.toggleDhCardRules(fileId) จัดการการเปิด/ปิดพร้อมเปลี่ยนไอคอนลูกศรและสีปุ่ม, อัปเดต Cache Busters ?v=20261030_2055 ใน index.html',
      sourceFile: 'คำสั่งผู้ใช้งาน: "ข้อความให้ซ่อน อยู่ในการ์ด กดปุ่มถึงจะดูได้"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำถึงปานกลาง (ปรับปรุง UX/UI การ์ดให้กระชับ สะอาดตา และกดเปิดดูได้สะดวก)'
    },
    {
      id: 'log_000_remove_toolbar_filter_restore_gold_pill_and_col_tags',
      timestamp: '2026-10-30 20:05:00',
      timestampTh: '30 ต.ค. 2569, 20:05 น.',
      type: 'EDIT',
      typeBadge: 'ปรับปรุง UI ตามวงแดง/เหลือง',
      badgeClass: 'badge-type-edit',
      title: 'นำปุ่มตัวกรองซ้ำซ้อนออกจากแถบเครื่องมือ (วงแดง) และคืนพื้นหลังสีทอง/สีอำพันสวยงาม (วงเหลือง)',
      targetSubject: 'แถบเครื่องมือพัสดุ, สรุปหัวคอลัมน์ WBS และป้ายแท็กไฟล์ 07 ในเมนูเลือกคอลัมน์',
      storageFile: 'js/materials.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ตามคำสั่งผู้ใช้งาน: 1) เอาปุ่มเลือก มี/ไม่มีพัสดุ ในแถบเครื่องมือด้านบนออก (วงแดง) เพื่อให้แถบเครื่องมือสะอาดเรียบร้อย 2) ปรับแต่งป้ายสรุปสถานะพัสดุใต้หัวคอลัมน์ WBS (วงเหลือง) ให้ใช้พื้นหลังสีทอง .th-header-gold-pill สวยงามเหมือนเดิม พร้อมคลิกเลือกได้โดยไม่มีพื้นหลังสีขาว 3) เพิ่มคลาส .col-tag-07 ใน css/styles.css เพื่อให้ป้าย 07 พัสดุ ในหน้าต่างเลือกคอลัมน์ (วงเหลือง) มีพื้นหลังสีส้มทองอำพันสวยงามครบถ้วน',
      details: '1) นำ div.mat-hasmat-filter-pills ออกจาก js/materials.js, 2) ปรับโครงสร้าง HTML ใต้คอลัมน์ WBS ให้บรรทัดล่างอยู่ใน th-header-gold-subpill และปุ่มภายในเป็นโปร่งแสงไร้พื้นขาว (btn-th-hasmat-sub), 3) เพิ่มสไตล์ .col-tag-07 ใน css/styles.css สำหรับแท็ก 07 พัสดุ, 4) อัปเดต Cache Busters ?v=20261030_2005 ใน index.html',
      sourceFile: 'คำสั่งผู้ใช้งาน & ภาพระบุจุด: "วงแดง เอาออก วงเหลือง ให้แก้ไขมีพื้นหลังเหมือนเดิมสวยงาม"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับแต่ง UI และ CSS ให้สวยงามตามเดิม)'
    },
    {
      id: 'log_000_add_warehouse_column_from_plant',
      timestamp: '2026-10-30 19:50:00',
      timestampTh: '30 ต.ค. 2569, 19:50 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มคอลัมน์คลังพัสดุ',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มคอลัมน์ "คลังพัสดุ" โดยแปลงค่าจากคอลัมน์โรงงาน (Plant) ตามตารางแมปคลังพัสดุของ กฟน.3',
      targetSubject: 'ตารางรายการพัสดุและเมนูเลือกคอลัมน์ (#tab-materials, js/materials.js)',
      storageFile: 'js/materials.js, index.html, js/data_history.js',
      changeSummary: 'ตามคำสั่งผู้ใช้งาน: เพิ่มคอลัมน์ใหม่ "คลังพัสดุ" ถัดจากคอลัมน์โรงงาน (Plant) ในตารางรายการพัสดุ โดยแปลงค่ารหัสโรงงานเป็นชื่อคลังพัสดุ ได้แก่ I010/1010 ➔ คลังพัสดุนครชัยศรี, I020/1020 ➔ คลังสุพรรณบุรี, I030/1030 ➔ คลังกาญจนบุรี, I040/1040 ➔ คลังสมุทรสาคร, I050/1050 ➔ คลังสามพราน, I070/1070 ➔ คลังท่ามะกา พร้อมแสดงป้ายสีคลังพัสดุ สรุปจำนวนคลังที่หัวตาราง (🏬 N คลัง) รองรับการจัดเรียง การค้นหา และส่งออก CSV',
      details: '1) ใน js/materials.js สร้าง MAT_WAREHOUSE_MAP และฟังก์ชัน getWarehouseFromPlant(), 2) เพิ่มคอลัมน์ warehouse (group: custom, source: custom) ใน MAT_COL_DEFS (รวมเป็น 50 คอลัมน์) โดยตั้งค่าเริ่มต้นให้แสดงผลถัดจากโรงงาน, 3) ผูกข้อมูล warehouse ใน ensureMaterialsHydrated, คำนวณ uniqueWarehouses ใน computeAggregates, 4) แสดงป้าย 🏬 คลังพัสดุ... ในเซลล์ตาราง และป้ายสรุปคลังในหัวคอลัมน์, 5) รองรับการค้นหา topQ/locQ และส่งออก CSV, 6) อัปเดต Cache Busters ?v=20261030_1950 ใน index.html',
      sourceFile: 'คำสั่งผู้ใช้งาน: "เพิ่มคอลัม คลังพัสดุ โดยใช้ข้อมูลจาก คอมลัมโรงงาน ดังนี้ คลังพัสุดนครชัยศรี = I010..."',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_wbs_materials_summary_dual_count',
      timestamp: '2026-10-30 19:30:00',
      timestampTh: '30 ต.ค. 2569, 19:30 น.',
      type: 'CONFIG',
      typeBadge: 'สรุปยอดงาน WBS และรายการไฟล์ 03',
      badgeClass: 'badge-type-config',
      title: 'ปรับการแสดงผลสรุปยอดงาน WBS ในตารางพัสดุให้แสดงทั้งยอดงานไม่ซ้ำและจำนวนรายการไฟล์ 03 (แนวทางที่ 1)',
      targetSubject: 'ส่วนสรุปหัวคอลัมน์ WBS และป้ายสถิติภาพรวมในแท็บรายการพัสดุ (js/materials.js)',
      storageFile: 'js/materials.js, index.html, js/data_history.js',
      changeSummary: 'ตามคำสั่งผู้ใช้งานเลือกแนวทางที่ 1: ปรับปรุงการแสดงผลหัวคอลัมน์ WBS ในตารางรายการพัสดุให้ระบุทั้งจำนวนโครงการจริงและจำนวนรายการในไฟล์ 03 เป็น \"รวม 2,069 งาน (2,083 รายการ)\" เพื่อไขข้อข้องใจเรื่องตัวเลขไม่เท่ากันระหว่างป้ายแท็บ WBS (2,083 รายการ) กับยอดงาน WBS ไม่ซ้ำ (2,069 งาน) พร้อมแก้ไขการเข้ารหัสข้อความภาษาไทยในประวัติการแก้ไขข้อมูลให้แสดงผลคมชัด 100%',
      details: 'อัปเดต js/materials.js ให้คำนวณ scope03RowCount จากไฟล์ 03 เทียบกับ uniqueWbs หากมีรายการซ้ำข้ามเกณฑ์วัดจะแสดงส่วนต่อท้าย (N รายการ) อัตโนมัติ, ปรับแก้การเข้ารหัส Windows-874 ใน js/data_history.js ให้ถูกต้องสมบูรณ์ และอัปเดต Cache Busters ?v=20261030_1930 ใน index.html',
      sourceFile: 'คำสั่งผู้ใช้งาน: \"แนวทางที่ 1\"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },
    {
      id: 'log_000_col_groups_custom_category_added',
      timestamp: '2026-10-30 16:40:00',
      timestampTh: '30 ต.ค. 2569, 16:40 น.',
      type: 'CONFIG',
      typeBadge: 'เพิ่มหมวดหมู่กลุ่ม CUSTOM',
      badgeClass: 'badge-type-config',
      title: 'เพิ่มกลุ่ม CUSTOM ในโครงสร้าง MAT_COL_GROUPS และผูกกลุ่มคอลัมน์คำนวณแยกตามกลุ่มไฟล์ให้สมบูรณ์',
      targetSubject: 'โครงสร้างกลุ่มคอลัมน์ MAT_COL_GROUPS และการแสดงผลแยกตามกลุ่มไฟล์ (js/materials.js)',
      storageFile: 'js/materials.js, index.html, js/data_history.js',
      changeSummary: 'เพิ่มหมวดหมู่ ✨ CUSTOM (ค่าที่ระบบคำนวณและแปลงค่า) ใน MAT_COL_GROUPS และกำหนด group: custom ให้กับ สถานะ SAP, % เบิกพัสดุ, % เบิก คชจ. และ ปริมาณค้างเบิก เพื่อให้การแสดงผลทั้งแบบเรียงลำดับ (1-49) และแบบแยกตามกลุ่มไฟล์จัดกลุ่มคอลัมน์ CUSTOM ได้อย่างถูกต้อง พร้อมปรับปรุงการแสดงผลแถวไม่มีพัสดุให้รองรับคอลัมน์ CUSTOM ได้ครบถ้วน',
      details: 'อัปเดต js/materials.js ให้ MAT_COL_GROUPS มี 4 กลุ่ม (03 WBS, 04 ZBUDR, 07 พัสดุ, และ custom), ปรับ MAT_COL_DEFS ให้ statusSap, pctMatWithdraw, pctExpenseWithdraw, remainQty มี group: custom, อัปเดตเงื่อนไข r.noMat ใน renderMaterialsTab, และอัปเดต Cache Busters ?v=20261030_1640 ใน index.html',
      sourceFile: 'คำสั่งผู้ใช้งาน & ภาพสรุปความต้องการ (Image Review 1-6)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง'
    },    {
      id: 'log_000_col_picker_custom_tags_sap_pct',
      timestamp: '2026-10-30 16:30:00',
      timestampTh: '30 ต.ค. 2569, 16:30 น.',
      type: 'EDIT',
      typeBadge: 'แก้ป้ายคอลัมน์เป็น CUSTOM ตามจริง',
      badgeClass: 'badge-type-edit',
      title: 'ปรับป้ายแหล่งที่มาในเมนูเลือกคอลัมน์ของ สถานะ SAP, % เบิกพัสดุ และ % เบิก คชจ. จาก 04 ZBUDR เป็น CUSTOM',
      targetSubject: 'เมนูเลือกคอลัมน์ (#matColDropdownPanel, js/materials.js)',
      storageFile: 'js/materials.js, index.html, js/data_history.js',
      changeSummary: 'ตามคำสั่งผู้ใช้งาน: "ให้แก้ตามจริง เป็น CUSTOM" โดยปรับป้ายแหล่งที่มาของคอลัมน์ สถานะ SAP, % เบิกพัสดุ และ % เบิก คชจ. ในเมนูเลือกคอลัมน์จากเดิม 04 ZBUDR ให้แสดงเป็น CUSTOM (สีม่วง col-tag-custom) ตรงตามที่เป็นคอลัมน์คำนวณและประมวลผลโดยระบบ',
      details: 'ใน js/materials.js: ตั้งค่า source: custom สำหรับ statusSap, pctMatWithdraw, pctExpenseWithdraw, remainQty และใน renderMatColDropdownList กำหนดให้แสดงแท็ก CUSTOM (col-tag-custom) พร้อมอัปเดต Cache Busters ?v=20261030_1630',
      sourceFile: 'คำสั่งผู้ใช้งาน: "ให้แก้ตามจริง เป็น CUSTOM"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับข้อความและสีป้ายแท็กในเมนูเลือกคอลัมน์)'
    },
    {
      id: 'log_000_has_mat_filter_buttons_default',
      timestamp: '2026-10-30 16:25:00',
      timestampTh: '30 ต.ค. 2569, 16:25 น.',
      type: 'EDIT',
      typeBadge: 'ปุ่มเลือก มี/ไม่มีพัสดุ (Default มีพัสดุ)',
      badgeClass: 'badge-type-edit',
      title: 'สร้างปุ่มตัวกรองเลือกรายการ มี/ไม่มีพัสดุ (มีพัสดุ / ไม่มีพัสดุ / ทั้งหมด) และตั้งค่าเริ่มต้นเป็น มีพัสดุ',
      targetSubject: 'แถบเครื่องมือและหัวตารางรายการพัสดุ (js/materials.js, css/styles.css)',
      storageFile: 'js/materials.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ตามคำสั่งผู้ใช้งาน: สร้างปุ่มเลือก มี/ไม่มีพัสดุ ทั้งในแถบเครื่องมือด้านบนและทำให้ป้ายสรุปใต้หัวคอลัมน์ WBS (รวม N งาน, พัสดุ X งาน, ไม่มีพัสดุ Y งาน) สามารถคลิกเพื่อสลับตัวกรองได้ทันที โดยตั้งค่าเริ่มต้น (Default) ให้แสดงเฉพาะงานที่มีพัสดุ',
      details: '1) ใน js/materials.js เพิ่มสถานะ hasMatFilter (ค่าเริ่มต้น HAS_MAT) พร้อมฟังก์ชัน setMatHasMatFilter() และเพิ่มปุ่มเลือก 3 สถานะ (.mat-hasmat-filter-pills) ในแถบเครื่องมือ 2) ปรับแต่งป้ายสถิติใต้หัวคอลัมน์ WBS (.btn-th-hasmat-pill) ให้คลิกสลับโหมด มีพัสดุ / ไม่มีพัสดุ / รวมทั้งหมด ได้โดยตรง 3) เพิ่ม CSS สำหรับ .btn-th-hasmat-pill ใน css/styles.css และอัปเดต Cache Busters ?v=20261030_1625',
      sourceFile: 'คำสั่งผู้ใช้งาน: "สร้างปุ่มเลือกรายการ มี/ไม่มีพัสดุ และให้ default มีพัสดุไว้"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (เพิ่มตัวเลือกกรองงานมี/ไม่มีพัสดุ และปรับค่าเริ่มต้นให้แสดงเฉพาะงานที่มีพัสดุ)'
    },
    {
      id: 'log_000_filter_material_code_prefix_1',
      timestamp: '2026-10-30 16:20:00',
      timestampTh: '30 ต.ค. 2569, 16:20 น.',
      type: 'EDIT',
      typeBadge: 'แสดงเฉพาะรหัสพัสดุขึ้นต้น 1',
      badgeClass: 'badge-type-edit',
      title: 'ตารางรายการพัสดุแสดงเฉพาะรหัสพัสดุ (วัสดุ) ที่ขึ้นต้นด้วย 1',
      targetSubject: 'ตารางรายการพัสดุ (js/materials.js)',
      storageFile: 'js/materials.js, index.html, js/data_history.js',
      changeSummary: 'ตามคำสั่งผู้ใช้งาน: คัดกรองรายการไฟล์ 07 (Mvt 281) ให้เหลือเฉพาะรหัสวัสดุที่ขึ้นต้นด้วย 1 งานที่ไม่มีรายการเข้าเงื่อนไขแสดงเป็นแถว ไม่มีรายการพัสดุ',
      details: 'เพิ่มเงื่อนไข matCode ขึ้นต้นด้วย 1 ใน ensureMaterialsHydrated ของ js/materials.js อัปเดต Cache Busters ?v=20261030_1620',
      sourceFile: 'คำสั่งผู้ใช้งาน: "แสดงรายการเฉพาะ รหัสพัสดุ ขึ้นต้นด้วย 1 เท่านั้น"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ลดจำนวนรายการพัสดุที่แสดง)'
    },
    {
      id: 'log_000_wbs_header_summary_total_with_without',
      timestamp: '2026-10-30 16:15:00',
      timestampTh: '30 ต.ค. 2569, 16:15 น.',
      type: 'EDIT',
      typeBadge: 'สรุปจำนวนงาน รวม/พัสดุ/ไม่มีพัสดุ',
      badgeClass: 'badge-type-edit',
      title: 'สรุปใต้หัวคอลัมน์ WBS: รวม N งาน และ พัสดุ X งาน ไม่มีพัสดุ Y งาน',
      targetSubject: 'หัวตารางรายการพัสดุ (คอลัมน์ WBS)',
      storageFile: 'js/materials.js, index.html, js/data_history.js',
      changeSummary: 'ตามคำสั่งผู้ใช้งาน: แสดง 2 บรรทัด รวม N งาน / พัสดุ X งาน ไม่มีพัสดุ Y งาน ตามเกณฑ์วัดและตัวกรองที่เลือก',
      details: 'ปรับ metricHtml ของคอลัมน์ wbs ใน js/materials.js ใช้ withMatWbs และ noMatWbs จาก computeAggregates อัปเดต Cache Busters ?v=20261030_1615',
      sourceFile: 'คำสั่งผู้ใช้งาน: "ให้สรุป รวม งาน / พัสดุ งาน ไม่มีพัสดุ งาน"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (เพิ่มข้อมูลสรุปที่หัวตาราง)'
    },
    {
      id: 'log_000_revert_wbs_header_summary',
      timestamp: '2026-10-30 16:12:00',
      timestampTh: '30 ต.ค. 2569, 16:12 น.',
      type: 'EDIT',
      typeBadge: 'ยกเลิกสรุปมี/ไม่มีพัสดุ ใต้ รวม งาน',
      badgeClass: 'badge-type-edit',
      title: 'ยกเลิกการแสดงสรุปจำนวนงานมีพัสดุ/ไม่มีพัสดุใต้หัวคอลัมน์ WBS',
      targetSubject: 'หัวตารางรายการพัสดุ (คอลัมน์ WBS)',
      storageFile: 'js/materials.js, index.html, js/data_history.js',
      changeSummary: 'ตามคำสั่งผู้ใช้งาน: ยกเลิก คืนหัวคอลัมน์ WBS เป็นแสดงเฉพาะ รวม N งาน',
      details: 'ย้อน metricHtml ของคอลัมน์ wbs ใน js/materials.js กลับเป็นเดิม อัปเดต Cache Busters ?v=20261030_1612',
      sourceFile: 'คำสั่งผู้ใช้งาน: "ยกเลิก"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (คืนค่าการแสดงผลเดิม)'
    },
    {
      id: 'log_000_wbs_header_summary_with_without_material',
      timestamp: '2026-10-30 16:10:00',
      timestampTh: '30 ต.ค. 2569, 16:10 น.',
      type: 'EDIT',
      typeBadge: 'สรุปจำนวนงาน มี/ไม่มีพัสดุ',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มสรุปใต้หัวคอลัมน์ WBS: รวมงาน / มีพัสดุ / ไม่มีพัสดุ',
      targetSubject: 'หัวตารางรายการพัสดุ (คอลัมน์ WBS)',
      storageFile: 'js/materials.js, index.html, js/data_history.js',
      changeSummary: 'ตามคำสั่งผู้ใช้งาน: ใต้ รวม N งาน แสดงสรุปจำนวนงานที่มีพัสดุและไม่มีพัสดุตามเกณฑ์วัดที่เลือก',
      details: 'เพิ่ม withMatWbs ใน computeAggregates และแสดงผลใน metricHtml ของคอลัมน์ wbs อัปเดต Cache Busters ?v=20261030_1610',
      sourceFile: 'คำสั่งผู้ใช้งาน: "ให้สรุป รวม งาน"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (เพิ่มข้อมูลสรุปที่หัวตาราง)'
    },
    {
      id: 'log_000_show_all_wbs_empty_material_rows',
      timestamp: '2026-10-30 16:05:00',
      timestampTh: '30 ต.ค. 2569, 16:05 น.',
      type: 'EDIT',
      typeBadge: 'แสดงครบทุกงาน WBS (แถวไม่มีพัสดุ)',
      badgeClass: 'badge-type-edit',
      title: 'ตารางรายการพัสดุแสดงครบทุกงาน WBS ของแต่ละเกณฑ์วัด งานที่ไม่มีพัสดุ Mvt 281 แสดงเป็นแถวว่างพร้อมข้อความ ไม่มีรายการพัสดุ',
      targetSubject: 'ตารางรายการพัสดุ (js/materials.js)',
      storageFile: 'js/materials.js, index.html, js/data_history.js',
      changeSummary: 'ตามคำสั่งผู้ใช้งาน: เพิ่มแถวว่างสำหรับ WBS ในไฟล์ 03 ที่ไม่มีรายการพัสดุ (492 งานจาก 2,069 งาน) แสดงข้อความ ไม่มีรายการพัสดุ ทำให้จำนวนงานตรงกับหน้า WBS คงเหลือ ส่วนยอดรายการพัสดุ (68,211) และป้าย Navbar ไม่นับแถวว่าง',
      details: 'ใน hydrate เพิ่ม placeholder row (noMat) ต่อ WBS ที่ไม่ match ไฟล์ 07 เรียงตามลำดับ WBS ไฟล์ 03 ปรับ computeAggregates / การ์ดสรุป / ป้าย Navbar / การ render เซลล์กลุ่มไฟล์ 07 อัปเดต Cache Busters ?v=20261030_1605',
      sourceFile: 'คำสั่งผู้ใช้งาน: "แสดงครบงานแต่ละเกณฑ์วัด โดยงานที่ไม่มีพัสดุแสดงเป็นแถวว่างไว้ และแจ้งว่าไม่มีรายการพัสดุ"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (เปลี่ยนจำนวนงานและแถวที่แสดงในตารางพัสดุ)'
    },
    {
      id: 'log_000_remain_qty_label_shorten',
      timestamp: '2026-10-30 15:50:00',
      timestampTh: '30 ต.ค. 2569, 15:50 น.',
      type: 'EDIT',
      typeBadge: 'ลบข้อความสูตรหัวคอลัมน์',
      badgeClass: 'badge-type-edit',
      title: 'นำข้อความสูตรในวงเล็บออกจากหัวคอลัมน์ ปริมาณค้างเบิก',
      targetSubject: 'หัวตารางรายการพัสดุ (คอลัมน์ remainQty)',
      storageFile: 'js/materials.js, index.html, js/data_history.js',
      changeSummary: 'ตามคำสั่งผู้ใช้งาน: เอาข้อความ (ต้องการ - เบิก - จุดขนส/คลง) ที่วงแดงออก เหลือชื่อ ปริมาณค้างเบิก',
      details: 'ปรับ label ของ remainQty ใน MAT_COL_DEFS อัปเดต Cache Busters ?v=20261030_1550',
      sourceFile: 'คำสั่งผู้ใช้งาน: "วงแดง เอาออก"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับข้อความหัวคอลัมน์)'
    },
    {
      id: 'log_000_remain_qty_min_zero',
      timestamp: '2026-10-30 15:48:00',
      timestampTh: '30 ต.ค. 2569, 15:48 น.',
      type: 'EDIT',
      typeBadge: 'ปริมาณค้างเบิกติดลบ = 0',
      badgeClass: 'badge-type-edit',
      title: 'ปริมาณค้างเบิก หากคำนวณได้ติดลบให้แสดงเป็น 0',
      targetSubject: 'ตารางรายการพัสดุ (คอลัมน์ remainQty)',
      storageFile: 'js/materials.js, index.html, js/data_history.js',
      changeSummary: 'ตามคำสั่งผู้ใช้งาน: สูตร ต้องการ − เบิกจ่าย − จุดขนส/คลง หากได้ค่าติดลบให้เท่ากับ 0',
      details: 'ใน js/materials.js ใช้ Math.max(0, ...) กับ remainQty อัปเดต Cache Busters ?v=20261030_1548',
      sourceFile: 'คำสั่งผู้ใช้งาน: "ปริมาณค้างเบิก หากติดลบให้ =0"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับการแสดงผลค่าติดลบ)'
    },
    {
      id: 'log_000_remain_qty_formula_custom_tag',
      timestamp: '2026-10-30 15:46:00',
      timestampTh: '30 ต.ค. 2569, 15:46 น.',
      type: 'EDIT',
      typeBadge: 'แก้สูตรปริมาณค้างเบิก & ป้าย CUSTOM',
      badgeClass: 'badge-type-edit',
      title: 'แก้วิธีคำนวณ ปริมาณค้างเบิก = ปริมาณที่ต้องการ − ปริมาณการเบิกจ่าย − จุดขนส/คลง และเปลี่ยนป้ายในเมนูเลือกคอลัมน์เป็น CUSTOM',
      targetSubject: 'ตารางรายการพัสดุ (คอลัมน์ remainQty), เมนูเลือกคอลัมน์',
      storageFile: 'js/materials.js, index.html, js/data_history.js',
      changeSummary: 'ตามคำสั่งผู้ใช้งาน: 1) สูตรคอลัมน์ ปริมาณค้างเบิก (คอลัมน์คำนวณ ไม่มีในไฟล์ 07) เปลี่ยนเป็น ต้องการ − เบิกจ่าย − จุดขนส/คลง 2) ป้ายแหล่งที่มาของคอลัมน์นี้ในเมนูเลือกคอลัมน์เปลี่ยนจาก 07 พัสดุ เป็น CUSTOM',
      details: 'ใน js/materials.js: ปรับการคำนวณ remainQty ให้หักค่า จุดขนส/คลง (แปลงเป็นตัวเลข) และใช้ col-tag-custom ใน renderMatColDropdownList พร้อมปรับป้ายชื่อคอลัมน์ อัปเดต Cache Busters ?v=20261030_1546',
      sourceFile: 'คำสั่งผู้ใช้งาน: "แก้วิธีคำนวณ ... - จุดขนส/คลง" และ "เมนูเลือกคอลัมน์ ให้เปลี่ยนเป็น CUSTOM"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (เปลี่ยนตัวเลขค้างเบิกและยอดรายการค้างเบิกทั้งหมด)'
    },
    {
      id: 'log_000_filter_mvt281_and_remove_pending_pills',
      timestamp: '2026-10-30 15:20:00',
      timestampTh: '30 ต.ค. 2569, 15:20 น.',
      type: 'EDIT',
      typeBadge: 'ดึงเฉพาะ Mvt 281 & เอาปุ่มกรองด่วนออก',
      badgeClass: 'badge-type-edit',
      title: 'ปรับปรุงระบบรายการพัสดุ: ดึงเฉพาะข้อมูล Mvt.type 281 (68,211 รายการ) และนำปุ่มตัวกรองด่วน (ทั้งหมด/ค้างเบิก/เบิกครบแล้ว) ออกจากหัวตาราง',
      targetSubject: 'หน้าแท็บรายการพัสดุ (#tab-materials), ฐานข้อมูลพัสดุ (js/data_materials_07.js, js/materials.js)',
      storageFile: 'js/data_materials_07.js, js/materials.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน: 1) "ไฟล์ 07 ให้ดึงข้อมูลมาแสดงเฉพาะ Mvt281 เท่านั้น" โดยนำเข้าข้อมูลเฉพาะ Mvt.type = 281 รวมทั้งสิ้น 68,211 รายการ (จาก 1,577 งาน WBS, 566 รหัสวัสดุ) ขนาดไฟล์ลดลงเหลือ 3.15 MB โหลดรวดเร็วยิ่งขึ้น 2) "เอาออก วงสีแดง" โดยนำกลุ่มปุ่มกรองด่วนสถานะ [ทั้งหมด | ค้างเบิก (ต้องการ≠เบิก) | เบิกครบแล้ว] ออกจากแถบเครื่องมือหัวตารางพัสดุ 3) อัปเดตป้ายแสดงจำนวนรายการบน Navbar และ Version Cache Busters เป็น ?v=20261030_1520',
      details: '1) ปรับปรุงสคริปต์ scratch/import_materials_07.ps1 ให้คัดกรองเฉพาะ Mvt.type = 281 ในไฟล์ 07 CN52N.xlsx แล้วสร้าง js/data_materials_07.js ใหม่ (68,211 แถว, 3.15 MB) 2) ใน js/materials.js: ปรับการรวมข้อมูล (Hydrate) ให้อ่านเฉพาะ Mvt 281 และนำบล็อก .mat-quick-filter-pills ออกจากแถบด้านบนของตาราง matTableCard 3) ปรับค่าตัวเลขเริ่มต้นใน #materialsTabTotalBadge ใน index.html เป็น 68,211 และบันทึกประวัติการแก้ไขข้อมูลตามข้อกำหนด AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน: "ไฟล์ 07 ให้ดึงข้อมูลมาแสดงเฉพาะ Mvt281 เท่านั้น" และ "เอาออก วงสีแดง"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (คัดกรองข้อมูลเฉพาะ Mvt 281 และจัดแถบหัวตารางให้เรียบง่ายตามที่ผู้ใช้งานต้องการ)'
    },    {
      id: 'log_000_add_materials_07_tab_and_table',
      timestamp: '2026-10-30 14:05:00',
      timestampTh: '30 ต.ค. 2569, 14:05 น.',
      type: 'IMPORT',
      typeBadge: 'นำเข้าไฟล์ 07 พัสดุค้างเบิก & สร้างเมนูรายการพัสดุ',
      badgeClass: 'badge-type-import',
      title: 'นำเข้าไฟล์ 07 พัสดุค้างเบิก CN52N (88,959 รายการ) ภายใต้เมนูใหม่ "รายการพัสดุ" ต่อจากเมนู WBS คงเหลือ พร้อมตารางเชื่อม WBS ไฟล์ 03 / 04 / 07 และเมนูเลือกคอลัมน์',
      targetSubject: 'เมนูนำทางด้านบน (#navTabBtnMaterials), หน้าแท็บรายการพัสดุ (#tab-materials), ฐานข้อมูลพัสดุ (js/data_materials_07.js, js/materials.js)',
      storageFile: 'index.html, css/styles.css, js/data_materials_07.js, js/materials.js, js/app.js, js/data_history.js',
      changeSummary: 'ดำเนินการครบทั้ง 3 ข้อตามคำสั่งผู้ใช้งาน: 1) นำไฟล์ 07 พัสดุค้างเบิก CN52N.xlsx (แก้ไขล่าสุด 30 ต.ค. 2569, 07:57 น. จำนวน 88,959 รายการ) เข้าระบบภายใต้เมนูด้านบนใหม่ชื่อ "รายการพัสดุ" ต่อจากเมนู WBS คงเหลือ 2) สร้างตารางใหม่โดยใช้ไฟล์ 03 คอลัมน์ WBS เป็นตัวอ้างอิงหลักและรองรับตัวกรองเกณฑ์วัด/พื้นที่/กฟฟ./ค้นหา เชื่อมกับไฟล์ 07 ผ่านคอลัมน์ "องค์ประกอบ WBS" (แมตช์ 100% ครบ 88,959 รายการ ใน 1,583 งาน WBS) และเชื่อมกับไฟล์ 04 ผ่านคอลัมน์ "ข้อกำหนดโครงการ /WBS" 3) ออกแบบตารางและป๊อปอัป "เลือกคอลัมน์" ตามรูป 8+ ทุกประการ รองรับทั้งโหมดลำดับการแสดง (ลาก/เลื่อนขึ้นลงได้) และโหมดแยกตามกลุ่มไฟล์ (03 WBS / 04 ZBUDR064 / 07 พัสดุค้างเบิก รวม 49 คอลัมน์) พร้อมส่งออก CSV และขยายเต็มจอ',
      details: '1) สร้างสคริปต์ scratch/import_materials_07.ps1 แปลงไฟล์ 07 พัสดุค้างเบิก CN52N.xlsx (88,959 แถว, 14 คอลัมน์) เป็นโครงสร้าง Compact Dictionary ใน js/data_materials_07.js (ขนาดเพียง 4.15 MB โหลดไว) 2) พัฒนาโมดูล js/materials.js ทำ Relational Join อ้างอิง WBS จากไฟล์ 03 เป็นหลัก เชื่อมคอลัมน์ไฟล์ 04 และไฟล์ 07 ครบทั้ง 49 คอลัมน์ พร้อมการ์ดสรุปยอดรวม, ตัวกรองด่วน (ทั้งหมด / ค้างเบิก / เบิกครบแล้ว / Mvt.type / สถานะ SAP), การเรียงลำดับทุกคอลัมน์, แบ่งหน้า และส่งออก CSV 3) เพิ่มปุ่มแท็บ "รายการพัสดุ" ต่อจาก "WBS คงเหลือ" ใน index.html และเชื่อม switchTab / renderAll ใน js/app.js 4) อัปเดต DATA_SOURCE_CATALOG (src_07), SYSTEM_STORAGE_FILES และ Cache Busters (?v=20261030_1405) ครบถ้วนตามกฎ AGENTS.md',
      sourceFile: '07 พัสดุค้างเบิก CN52N.xlsx (30 ต.ค. 2569, 07:57 น.), 03 WBSงานคงเหลือเดือนล่าสุด.xlsx, 04 WBS ZBUDR064 %พัสดุและค่าแรงและสถานะsap.xlsx',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง (เพิ่มระบบติดตามรายการพัสดุค้างเบิก CN52N ครบวงจร เชื่อมโยงฐานข้อมูล WBS 03 และ SAP ZBUDR064 04 แบบอัตโนมัติ)'
    },
    {
      id: 'log_000_revert_sparkles_to_original',
      timestamp: '2026-10-30 13:47:00',
      timestampTh: '30 ต.ค. 2569, 13:47 น.',
      type: 'EDIT',
      typeBadge: 'ยกเลิกเพิ่มไฟวิบวับ กลับไปใช้แบบเดิม',
      badgeClass: 'badge-type-edit',
      title: 'ยกเลิกการเพิ่มแสงไฟวิบวับเพิ่มเติม และคืนค่ารูปแบบประกายเพชรวิบวับรอบคำว่า "บรรลุเป้าหมาย" กลับเป็นแบบเดิม',
      targetSubject: 'เอฟเฟกต์แอนิเมชันบนกราฟเปรียบเทียบเกณฑ์วัด (#criteriaFireworksCanvas, window.CriteriaFireworks ใน js/app.js)',
      storageFile: 'js/app.js, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน: "ยกเลิกเพิ่มไฟวิบวับ ให้ใช้แบบเดิม" โดยคืนค่าโค้ดใน window.CriteriaFireworks กลับเป็นชุดประกายเพชรสีต่างๆ ขนาดเล็กวิบวับ 14 จุดแบบเดิม',
      details: 'นำเมธอด drawFairyBokehOrb และลำแสงแฉกเพิ่มเติมออก คืนค่าเมธอด drawDiamondGemSparkle และ drawAchieveDiamondSparkles ใน js/app.js กลับเป็นเวอร์ชันประกายเพชรจิ๋ว 14 จุดแบบเดิมตามความต้องการของผู้ใช้งาน',
      sourceFile: 'คำสั่งผู้ใช้งาน: "ยกเลิกเพิ่มไฟวิบวับ ให้ใช้แบบเดิม"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (คืนค่าการแสดงผลแอนิเมชันประกายเพชรกลับเป็นรูปแบบเดิมที่ผู้ใช้งานต้องการ)'
    },
    {
      id: 'log_000_enhance_achieve_twinkling_lights',
      timestamp: '2026-10-30 13:42:00',
      timestampTh: '30 ต.ค. 2569, 13:42 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มแสงไฟวิบวับรอบคำว่า บรรลุเป้าหมาย',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มความสว่างและจำนวนแสงไฟวิบวับหลากสี (Starburst Light Flares, ซุ้มไฟโค้ง & ละอองโบเก้) รอบคำว่า "บรรลุเป้าหมาย"',
      targetSubject: 'เอฟเฟกต์แอนิเมชันบนกราฟเปรียบเทียบเกณฑ์วัด (#criteriaFireworksCanvas, window.CriteriaFireworks ใน js/app.js)',
      storageFile: 'js/app.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน: "เพิ่มแสงไฟวิบวับอีก" ยกระดับเอฟเฟกต์แสงไฟรอบคำว่า "บรรลุเป้าหมาย" เป็น 3 ชั้นแสงแบบ Additive Light Glow: 1) เพิ่มแสงไฟแฉกเพชร (Starburst & Diamond Light Flares) จาก 14 ดวง เป็น 24 ดวง พร้อมลำแสงแฉกไฟแนวตั้ง-แนวนอน (Lens Flare Streaks) จังหวะสว่างพีค จัดเรียงเป็นซุ้มโค้งด้านบน 9 ดวง ปีกซ้าย-ขวา 8 ดวง และสายไฟขอบล่าง 7 ดวง 2) เพิ่มละอองแสงไฟโบเก้นีออน (Micro-Bokeh Fairy Lights) อีก 16 ดวง รวมเป็น 40 ดวงไฟระยิบระยับ 3) เพิ่มคลื่นไฟวิ่งไล่ระดับ (Chasing Light Wave) และชิมเมอร์แสงทองอ่อนๆ โดยไม่ทับตัวอักษรและไม่ชนแท่งข้างเคียง',
      details: '1) ใน js/app.js (window.CriteriaFireworks): เพิ่มเมธอด drawFairyBokehOrb() ใช้ globalCompositeOperation = "lighter" วาดละอองไฟนีออนเรืองแสง 16 ดวง, อัปเกรด drawDiamondGemSparkle() ให้มีออร่าแสงฟุ้ง (Additive Light Bloom) และลำแสงแฉกไฟยาวคมชัด (Starburst Cross-Flare Beams) พร้อมจุดสะท้อนแสงขาวกึ่งกลาง และขยายจุดไฟเพชรใน drawAchieveDiamondSparkles() เป็น 24 ดวง พร้อมระบบคำนวณระยะเพดานอัตโนมัติ (topHeadroom / safeCeilingY) และขอบเขตแนวนอน (halfGroupLimit) ป้องกันการซ้อนทับ 100% 2) อัปเดต Cache Busters ใน index.html เป็น ?v=20261030_1342 และบันทึก Audit Log ตามกฎ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน: "เพิ่มแสงไฟวิบวับอีก"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (เพิ่มความโดดเด่นสวยงามและชีวิตชีวาให้ป้าย "บรรลุเป้าหมาย" ด้วยแสงไฟวิบวับหลากสีคมชัดโดยไม่บดบังตัวอักษร)'
    },
    ...(Array.isArray(window.ARCHIVED_AUDIT_LOGS) ? window.ARCHIVED_AUDIT_LOGS : [])
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
  /**
   * Toggle visibility of rules summary inside file card
   */
  window.toggleDhCardRules = function(fileId) {
    const box = document.getElementById('rulesBox_' + fileId);
    const btn = document.getElementById('btnToggleRules_' + fileId);
    const textSpan = document.getElementById('btnToggleRulesText_' + fileId);
    const icon = document.getElementById('iconToggleRules_' + fileId);
    if (!box) return;
    const isHidden = box.style.display === 'none' || !box.style.display;
    if (isHidden) {
      box.style.display = 'block';
      if (textSpan) textSpan.textContent = 'ซ่อนเงื่อนไขสรุปการแสดงผล (คลิกเพื่อปิด)';
      if (icon) icon.innerHTML = '&#9650;';
      if (btn) {
        btn.style.background = 'rgba(14,165,233,0.24)';
        btn.style.borderColor = '#38BDF8';
        btn.style.boxShadow = '0 0 10px rgba(14,165,233,0.3)';
      }
    } else {
      box.style.display = 'none';
      if (textSpan) textSpan.textContent = 'เงื่อนไขสรุปการแสดง / ไม่แสดงข้อมูล (คลิกดู)';
      if (icon) icon.innerHTML = '&#9660;';
      if (btn) {
        btn.style.background = 'rgba(14,165,233,0.12)';
        btn.style.borderColor = 'rgba(14,165,233,0.4)';
        btn.style.boxShadow = 'none';
      }
    }
  };

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
            <div class="dh-stat-icon" style="background:rgba(236,72,153,0.15); color:#F472B6;">📂</div>
            <div class="dh-stat-body">
              <div class="dh-stat-val">${totalFiles} ไฟล์หลัก</div>
              <div class="dh-stat-label">ไฟล์ Excel ต้นทางทั้งหมด (01 - 06)</div>
              <div class="dh-stat-sub">รายงาน AUC, KPI, WBS, SAP, CN41, แผนงาน</div>
            </div>
          </div>

          <div class="dh-stat-card">
            <div class="dh-stat-icon" style="background:rgba(139,92,246,0.15); color:#A78BFA;">📅</div>
            <div class="dh-stat-body">
              <div class="dh-stat-val">27 ต.ค. 2569</div>
              <div class="dh-stat-label">นำเข้าข้อมูล WBS คงเหลือล่าสุด</div>
              <div class="dh-stat-sub">2,083 รายการ WBS (ผสานไฟล์ 03, 04, 05, 06)</div>
            </div>
          </div>

          <div class="dh-stat-card">
            <div class="dh-stat-icon" style="background:rgba(245,158,11,0.15); color:#FBBF24;">🛠️</div>
            <div class="dh-stat-body">
              <div class="dh-stat-val">17 ต.ค. 2569</div>
              <div class="dh-stat-label">แก้ไขข้อมูล / ตัวกรองล่าสุด</div>
              <div class="dh-stat-sub">แยก TECO กับ REL D1 & บันทึก Checkbox</div>
            </div>
          </div>

          <div class="dh-stat-card">
            <div class="dh-stat-icon" style="background:rgba(16,185,129,0.15); color:#34D399;">🗄️</div>
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
                    <div class="dh-node-meta">นำเข้า: 27 ต.ค. 69 • 732.0 KB</div>
                  </div>
                  <div class="dh-flow-node" onclick="window.openModelViewModal('src_06', 'source')">
                    <div class="dh-node-badge" style="background:#F59E0B;">ไฟล์ 06</div>
                    <div class="dh-node-title">CN41 (มูลค่า AUC บาท)</div>
                    <div class="dh-node-meta">นำเข้า: 27 ต.ค. 69 • 337.8 KB</div>
                  </div>
                  <div class="dh-flow-node" onclick="window.openModelViewModal('src_07', 'source')">
                    <div class="dh-node-badge" style="background:#0EA5E9;">ไฟล์ 07</div>
                    <div class="dh-node-title">CN52N พัสดุ (Mvt 281 / รหัส 1*)</div>
                    <div class="dh-node-meta">นำเข้า: 30 ต.ค. 69 • 5.67 MB</div>
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
                    <div class="dh-node-badge" style="background:#0EA5E9; color:#fff;">Material Filter</div>
                    <div class="dh-node-title">กรอง Mvt 281 / รหัสพัสดุ 1*</div>
                    <div class="dh-node-meta">คำนวณค้างเบิก &amp; ผูก WBS ไฟล์ 03/04</div>
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
                ${file.rulesHtml ? `
                  <div class="dh-card-rules-wrapper" style="margin:0.65rem 0;">
                    <button type="button" 
                            class="btn btn-sm dh-btn-toggle-rules" 
                            id="btnToggleRules_${file.id}" 
                            onclick="event.stopPropagation(); window.toggleDhCardRules('${file.id}')"
                            style="cursor:pointer; width:100%; display:flex; align-items:center; justify-content:space-between; padding:0.45rem 0.75rem; background:rgba(14,165,233,0.12); border:1px solid rgba(14,165,233,0.4); border-radius:8px; color:#38BDF8; font-size:0.79rem; font-weight:700; transition:all 0.2s ease;">
                      <span style="display:flex; align-items:center; gap:0.4rem;">
                        <span>📋</span>
                        <span id="btnToggleRulesText_${file.id}">เงื่อนไขสรุปการแสดง / ไม่แสดงข้อมูล (คลิกดู)</span>
                      </span>
                      <span id="iconToggleRules_${file.id}" style="font-size:0.75rem; transition:transform 0.2s ease;">▼</span>
                    </button>
                    <div id="rulesBox_${file.id}" class="dh-rules-hidden-box" style="display:none; margin-top:0.5rem;">
                      ${file.rulesHtml}
                    </div>
                  </div>
                ` : ''}

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
                          <span style="font-size:1.1rem;">๐“</span>
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
            <div style="font-size:2rem; margin-bottom:0.5rem;">โ ๏ธ</div>
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
          <div style="font-size:2.5rem; margin-bottom:0.5rem;">๐”</div>
          <div>ไม่พบรายการประวัติที่ตรงกับเงื่อนไขค้นหา</div>
        </div>
      `;
    }

    return logs.map((log, index) => {
      const typeIcons = {
        EDIT: 'โ๏ธ',
        IMPORT: '๐“ฅ',
        MERGE: '๐”',
        CONFIG: 'โ๏ธ'
      };
      const icon = typeIcons[log.type] || '๐“‘';
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
                <span class="dh-tl-time">๐•’ ${escapeHtml(log.timestampTh)}</span>
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
          <button class="modal-btn-close" onclick="window.closeDhModelModal()">โ•</button>
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

          ${file.rulesHtml ? `
            <div class="dh-model-rules-box" style="margin-top:1rem; padding:0.85rem 1rem; background:rgba(14,165,233,0.08); border:1px solid rgba(14,165,233,0.3); border-radius:10px;">
              <div class="dh-box-title" style="color:#38BDF8; font-weight:700; margin-bottom:0.5rem; display:flex; align-items:center; gap:0.4rem;">
                <span>📋 สรุปเงื่อนไขการประมวลผล (แสดง / ไม่แสดง ข้อมูล):</span>
              </div>
              ${file.rulesHtml}
            </div>
          ` : ''}
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
              โ๏ธ
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
        EDIT: '✏️',
        IMPORT: '📥',
        MERGE: '🔄',
        CONFIG: '⚙️'
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
