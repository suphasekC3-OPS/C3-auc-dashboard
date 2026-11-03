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
      id: 'log_000_top_return_normal_screen_button',
      timestamp: '2026-11-03 16:32:00',
      timestampTh: '3 เธ.เธข. 2569, 16:32 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธธเนเธกเธเธทเธเธซเธเนเธฒเธเธญเธเธเธ•เธดเธชเธตเธชเธงเธข',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธดเนเธกเธเธธเนเธก \"เธเธทเธเธซเธเนเธฒเธเธญเธเธเธ•เธด\" เธ”เธตเนเธเธเนเธซเธฃเธนเธซเธฃเธฒเธชเธตเธชเธงเธขเธเธฒเธกเนเธเนเธ–เธเธ•เธฑเธงเธเธฃเธญเธเธเธเธชเธธเธ” (เนเธชเธ”เธเน€เธเธเธฒเธฐเธซเธเนเธฒเธเธญเธเธขเธฒเธขเน€เธ•เนเธกเธเธญ)',
      targetSubject: 'เนเธ–เธเธ•เธฑเธงเธเธฃเธญเธเธเธเธชเธธเธ” (#topStickyFilterBar / .top-unified-filters-inner) เธ•เธดเธ”เธเธฑเธเธเธธเนเธกเธฃเธตเน€เธเนเธ• เนเธฅเธฐเธชเนเธ•เธฅเนเธเธธเนเธก #btnTopReturnNormalScreen',
      storageFile: 'index.html, css/styles.css, js/data_history.js',
      changeSummary: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ \"เน€เธเธดเนเธกเธเธธเนเธก เธเธทเธเธซเธเนเธฒเธเธญเธเธเธ•เธด เธชเธตเธชเธงเธขเน\" เธเธฃเนเธญเธกเธ เธฒเธเธเธฃเธฐเธเธญเธเธฃเธฐเธเธธเธเธฃเธญเธเธชเธตเน€เธซเธฅเธทเธญเธเธ•เธดเธ”เธเธฑเธเธเธธเนเธกเธฃเธตเน€เธเนเธ•เนเธเนเธ–เธเธ•เธฑเธงเธเธฃเธญเธเธเธเธชเธธเธ”เธเธ“เธฐเธเธขเธฒเธขเธ•เธฒเธฃเธฒเธเน€เธ•เนเธกเธเธญ: 1) เน€เธเธดเนเธกเธเธธเนเธก #btnTopReturnNormalScreen เธฅเธเนเธ .top-unified-filters-inner เธ•เนเธญเธ—เนเธฒเธขเธเธธเนเธกเธฃเธตเน€เธเนเธ• 2) เธญเธญเธเนเธเธเธชเธตเธชเธฑเธเธชเธงเธขเธเธฒเธกเธซเธฃเธนเธซเธฃเธฒเธ”เนเธงเธขเน€เธเธ”เธชเธตเธกเนเธงเธเธญเน€เธกเธ—เธดเธชเธ•เนเธเธฃเธฐเธเธฒเธขเธเธนเน€เธเธตเธข (Royal Purple-Fuchsia #7C3AED - #9333EA - #C026D3) เธเธฃเนเธญเธกเธเธญเธเธ—เธญเธเธเธฃเธตเน€เธกเธตเธขเธก (#FFD700) เนเธฅเธฐเนเธชเธเน€เธเธฒเน€เธเธฅเนเธเธเธฃเธฐเธเธฒเธขเธชเธตเธ—เธญเธ/เธกเนเธงเธ (Golden Amethyst Glow) 3) เธเธณเธซเธเธ”เนเธซเนเนเธชเธ”เธเธเธฅเน€เธเธเธฒเธฐเน€เธกเธทเนเธญเธเธขเธฒเธขเน€เธ•เนเธกเธเธญ (body.has-fullscreen-table / body.has-fullscreen-chart) เน€เธ—เนเธฒเธเธฑเนเธ เนเธฅเธฐเธเนเธญเธเธญเธขเนเธฒเธเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธเธซเธเนเธฒเธเธญเธซเธฅเธฑเธเธ•เธฒเธกเธกเธฒเธ•เธฃเธเธฒเธ 4) เน€เธกเธทเนเธญเธเธฅเธดเธเธเธฐเธขเนเธญเธเธเธฒเธ”เธเธฅเธฑเธเธชเธนเนเธซเธเนเธฒเธเธญเธเธเธ•เธดเธ—เธฑเธเธ—เธต',
      details: '1) เนเธ index.html: เน€เธเธดเนเธกเธเธธเนเธก <button type=\"button\" class=\"btn btn-sm btn-return-normal-top\" id=\"btnTopReturnNormalScreen\" onclick=\"window.returnToNormalScreen()\"> เธเธฃเนเธญเธก SVG เธขเนเธญเธซเธเนเธฒเธเธญเนเธฅเธฐเธเนเธญเธเธงเธฒเธก \"เธเธทเธเธซเธเนเธฒเธเธญเธเธเธ•เธด\" เนเธ .top-unified-filters-inner เธ•เนเธญเธ—เนเธฒเธข #btnResetFilters 2) เนเธ css/styles.css: เธเธณเธซเธเธ”เธชเนเธ•เธฅเนเธเธธเนเธกเนเธเธเธเธนเธฅเธเธเธฒเธ”เน€เธ—เนเธฒเธเธธเนเธกเธฃเธตเน€เธเนเธ• เธฃเธฑเธจเธกเธต 12px เธเธทเนเธเธซเธฅเธฑเธ linear-gradient(135deg, #7C3AED 0%, #9333EA 45%, #C026D3 100%), เธเธญเธเธ—เธญเธ 1.5px solid #FFD700, เนเธชเธเน€เธฃเธทเธญเธ pulseReturnNormalGlow, เนเธฅเธฐเน€เธญเธเน€เธเธเธ•เน hover เธขเธเธ•เธฑเธงเธเธถเนเธเธเธฃเนเธญเธกเนเธชเธเน€เธเธฒเธชเธตเธกเนเธงเธ-เธ—เธญเธ 3) เธเนเธญเธเธเธธเนเธกเธฅเธญเธขเน€เธ”เธดเธกเธ—เธตเนเน€เธเธขเธ•เธฃเธถเธ fixed เธเธเธซเธฑเธงเธ•เธฒเธฃเธฒเธเน€เธเธทเนเธญเธเธงเธฒเธกเธชเธฐเธญเธฒเธ”เน€เธฃเธตเธขเธเธฃเนเธญเธข 4) เธญเธฑเธเน€เธ”เธ• Version Cache Busters เนเธ index.html เน€เธเนเธ 20261103_1632 5) เธเธฑเธเธ—เธถเธเธเธฃเธฐเธงเธฑเธ•เธดเธฅเธเนเธ BASE_AUDIT_LOGS เธ•เธฒเธกเธเนเธญเธเธฑเธเธเธฑเธ AGENTS.md',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: เน€เธเธดเนเธกเธเธธเนเธก เธเธทเธเธซเธเนเธฒเธเธญเธเธเธ•เธด เธชเธตเธชเธงเธขเน (เธ เธฒเธ media_1793695048302_fdb22f5f.jpg)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_dark_red_and_soft_orange',
      timestamp: '2026-11-03 16:07:00',
      timestampTh: '3 เธ.เธข. 2569, 16:07 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธชเธตเนเธ”เธเน€เธเนเธก & เธชเนเธกเธญเนเธญเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธฃเธฑเธเธเธฃเธธเธเธเธธเธ”เธชเธตเธเนเธฒเธเน€เธเธดเธ: เน€เธเธฅเธตเนเธขเธเธชเธตเนเธ”เธเน€เธเนเธเธชเธตเนเธ”เธเน€เธเนเธก (เธเธ I, P) เนเธฅเธฐเน€เธเธฅเธตเนเธขเธเธชเธตเธชเนเธกเธชเธฐเธ—เนเธญเธเนเธชเธเน€เธเนเธเธชเธตเธชเนเธกเธญเนเธญเธ (เธเธ C)',
      targetSubject: 'เนเธ–เธเธชเธตเนเธ—เนเธเธเธฃเธฒเธ เธเนเธฒเธขเธเธณเธเธฑเธเธเธณเธญเธเธดเธเธฒเธข เนเธฅเธฐเธ•เธฑเธงเน€เธฅเธเธเนเธฒเธเน€เธเธดเธเนเธเธเธฃเธฒเธเนเธเธงเธเธญเธ (#matHChartCard) เนเธฅเธฐเธเธฒเธฃเนเธ”เธเธฅเธฑเธ (#matWhStandaloneCard)',
      storageFile: 'css/styles.css, js/materials.js, js/data_history.js, index.html',
      changeSummary: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: \"เนเธเนเนเธเธชเธตเธชเนเธกเธชเธฐเธ—เนเธญเธเนเธชเธ เน€เธเนเธเธชเธตเธชเนเธกเธญเนเธญเธ\" เนเธฅเธฐ \"เนเธเนเนเธเธชเธตเนเธ”เธ เน€เธเนเธเธชเธตเนเธ”เธเน€เธเนเธก\" เนเธ”เธขเธเธฃเธฑเธเนเธ—เธเธชเธตเนเธ”เธเธเธญเธเธเธ I, P เนเธซเนเน€เธเนเธเธชเธตเนเธ”เธเน€เธเนเธก (Deep Crimson #991B1B - #B91C1C) เนเธฅเธฐเธเธฃเธฑเธเนเธ—เธเธชเธตเธชเนเธกเธเธญเธเธเธ C เธเธฒเธเธชเธตเธชเนเธกเธชเธฐเธ—เนเธญเธเนเธชเธเธเธตเธญเธญเธเน€เธ”เธดเธก เนเธซเนเน€เธเนเธเธชเธตเธชเนเธกเธญเนเธญเธเธเธธเนเธกเธเธงเธฅ (Soft Warm Peach/Apricot #EA580C - #FB923C - #FED7AA) เธเธฃเนเธญเธกเธเธฃเธฑเธเธเนเธฒเธขเธชเธฑเธเธฅเธฑเธเธฉเธ“เน Legend เนเธฅเธฐเน€เธญเธเน€เธเธเธ•เน Glow เธ—เธฑเนเธเธซเธกเธ”เนเธซเนเธชเธญเธ”เธเธฅเนเธญเธเธเธฑเธ',
      details: '1) เนเธ css/styles.css: เธเธฃเธฑเธ .mat-hchart-bar.bar-red เน€เธเนเธ linear-gradient(90deg, #991B1B 0%, #B91C1C 60%, #C5221F 100%), เธเธฃเธฑเธ .lg-red เนเธฅเธฐ .mat-budget-pill.pill-red เน€เธเนเธเนเธ—เธเนเธ”เธเน€เธเนเธก #B91C1C เธเธฃเนเธญเธก glow เนเธ”เธเน€เธเนเธก, เธเธฃเธฑเธ .mat-hchart-bar.bar-orange เน€เธเนเธ linear-gradient(90deg, #F97316 0%, #FB923C 45%, #FDBA74 100%) (เธชเธตเธชเนเธกเธญเนเธญเธ), เธเธฃเธฑเธ .lg-orange เนเธฅเธฐ .mat-budget-pill.pill-orange เน€เธเนเธเนเธ—เธเธชเนเธกเธญเนเธญเธ #FB923C, เธเธฃเธฑเธเธชเธตเธ•เธฑเธงเน€เธฅเธ .val-orange เน€เธเนเธ #FED7AA 2) เนเธ js/materials.js: เธเธฃเธฑเธเธเนเธญเธเธงเธฒเธกเธเนเธฒเธข Legend เนเธเธชเนเธงเธเธซเธฑเธงเธเธฃเธฒเธเน€เธเนเธ \"เธเนเธฒเธเน€เธเธดเธ เธเธ I, P (เธชเธตเนเธ”เธเน€เธเนเธก)\" เนเธฅเธฐ \"เธเนเธฒเธเน€เธเธดเธ เธเธ C (เธชเธตเธชเนเธกเธญเนเธญเธ)\" เธ—เธฑเนเธเนเธ static HTML เนเธฅเธฐ dynamic render, เธเธฃเธฑเธเธชเธตเนเธ–เธงเนเธฅเธฐเธขเธญเธ”เธฃเธงเธกเธ•เธฒเธฃเธฒเธเธเธฅเธฑเธเนเธซเนเธ•เธฃเธเธเธฑเธเธชเธตเนเธ”เธเน€เธเนเธกเนเธฅเธฐเธชเนเธกเธญเนเธญเธ 3) เธญเธฑเธเน€เธ”เธ• Version Cache Busters เนเธ index.html เน€เธเนเธ 20261103_1607',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: เนเธเนเนเธเธชเธตเธชเนเธกเธชเธฐเธ—เนเธญเธเนเธชเธ เน€เธเนเธเธชเธตเธชเนเธกเธญเนเธญเธ / เนเธเนเนเธเธชเธตเนเธ”เธ เน€เธเนเธเธชเธตเนเธ”เธเน€เธเนเธก',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_increase_warehouse_numbers_size',
      timestamp: '2026-11-03 15:47:00',
      timestampTh: '3 เธ.เธข. 2569, 15:47 เธ.',
      type: 'EDIT',
      typeBadge: 'เน€เธเธดเนเธกเธเธเธฒเธ”เธ•เธฑเธงเน€เธฅเธเธ•เธฒเธฃเธฒเธเธเธฅเธฑเธ',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธดเนเธกเธเธเธฒเธ”เธ•เธฑเธงเน€เธฅเธเธเธฃเธดเธกเธฒเธ“เธเนเธฒเธเน€เธเธดเธเนเธฅเธฐเน€เธซเธฅเธทเธญเธเธฅเธฑเธเนเธเธ•เธฒเธฃเธฒเธเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เนเธ•เนเธฅเธฐเธเธฅเธฑเธเธเธฑเธชเธ”เธธ',
      targetSubject: 'เธ•เธฑเธงเน€เธฅเธเนเธเธเธญเธฅเธฑเธกเธเนเธเนเธฒเธเน€เธเธดเธเนเธฅเธฐเน€เธซเธฅเธทเธญเธเธฅเธฑเธเธเธญเธเธเธฒเธฃเนเธ”เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เนเธ•เนเธฅเธฐเธเธฅเธฑเธเธเธฑเธชเธ”เธธ (#matWhStandaloneCard) เนเธเนเธ—เนเธ "เธฃเธฒเธขเธเธฒเธฃเธเธฑเธชเธ”เธธ"',
      storageFile: 'css/styles.css, js/materials.js, js/data_history.js, index.html',
      changeSummary: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "เน€เธเธดเนเธกเธเธเธฒเธ”เธ•เธฑเธงเน€เธฅเธ" เธเธฃเนเธญเธกเธ เธฒเธเธเธฃเธญเธเธชเธตเน€เธซเธฅเธทเธญเธเธเธฃเธญเธเธเธญเธฅเธฑเธกเธเนเธ•เธฑเธงเน€เธฅเธเธ—เธฑเนเธเธชเธญเธเธเธฑเนเธ: เธเธฃเธฑเธเน€เธเธดเนเธกเธเธเธฒเธ”เธ•เธฑเธงเน€เธฅเธเนเธเธ•เธฒเธฃเธฒเธเธเธฅเธฑเธเธเธฒเธ 0.75rem เน€เธเนเธ 0.88rem เนเธฅเธฐเธขเธญเธ”เธเธฅเธฃเธงเธกเธเธฒเธ 0.76rem เน€เธเนเธ 0.92rem (เธเนเธณเธซเธเธฑเธเธ•เธฑเธงเธซเธเธฒ 800-900) เธเธฃเนเธญเธกเธเธฃเธฑเธเธชเธฑเธ”เธชเนเธงเธเธเธงเธฒเธกเธเธงเนเธฒเธเธเธญเธฅเธฑเธกเธเนเธ•เธฑเธงเน€เธฅเธเน€เธเนเธ 52% เน€เธเธทเนเธญเธเธงเธฒเธกเธเธฑเธ”เน€เธเธ เธญเนเธฒเธเธเนเธฒเธข เนเธฅเธฐเนเธกเนเธฅเนเธเธเธฃเธญเธ',
      details: '1) เนเธ css/styles.css: เธเธฃเธฑเธ .mat-wh-table td.td-wh-val เนเธซเนเธกเธต font-size: 0.88rem (เน€เธเธดเนเธกเธเธถเนเธเธเธฒเธ 0.75rem), font-weight: 800, letter-spacing: -0.01em เธเธฃเธฑเธเธขเธญเธ”เธฃเธงเธก tfoot td.td-sum-val เนเธซเนเธกเธต font-size: 0.92rem, font-weight: 900 เธเธฃเธฑเธเธชเธฑเธ”เธชเนเธงเธเธเธญเธฅเธฑเธกเธเน th.th-wh เน€เธเนเธ 48% เนเธฅเธฐ th.th-val เน€เธเนเธ 52% เน€เธเธทเนเธญเนเธซเนเธ•เธฑเธงเน€เธฅเธเธซเธฅเธฑเธเธฅเนเธฒเธ (เน€เธเนเธ 2,298,519) เธกเธตเธเธทเนเธเธ—เธตเนเนเธเธฃเนเธเธ•เธฒ เนเธกเนเน€เธเธตเธขเธ”เธเธดเธ”เธเธญเธ 2) เนเธ js/materials.js: เธเธฃเธฑเธเธเนเธฒเธเนเธณเธซเธเธฑเธเธ•เธฑเธงเธซเธเธฒเธเธญเธเธ•เธฑเธงเน€เธฅเธเธเธ“เธฐเธเธฃเธญเธเน€เธเธฒเธฐเธเธเธเธฑเธชเธ”เธธเธเธฒเธ 700 เน€เธเนเธ 800 เนเธซเนเนเธ”เธ”เน€เธ”เนเธเธเธกเธเธฑเธ” 3) เธญเธฑเธเน€เธ”เธ• Version Cache Busters เนเธ index.html เน€เธเนเธ 20261103_1547',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: เน€เธเธดเนเธกเธเธเธฒเธ”เธ•เธฑเธงเน€เธฅเธ (เธฃเธนเธ media_1793694835646_3f0655c9.jpg)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_revert_chart_clear_button',
      timestamp: '2026-11-03 15:36:00',
      timestampTh: '3 เธ.เธข. 2569, 15:36 เธ.',
      type: 'EDIT',
      typeBadge: 'เธขเธเน€เธฅเธดเธเธเธธเนเธกเธฅเนเธฒเธเธเธฃเธฒเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธขเธเน€เธฅเธดเธเธเธณเธชเธฑเนเธเธเธธเนเธกเธฅเนเธฒเธเธ•เธฑเธงเธเธฃเธญเธเธเธฃเธฒเธ เธเธเนเธเธฃเธเธชเธฃเนเธฒเธเน€เธ”เธดเธกเธ—เธตเนเน€เธฃเธตเธขเธเธเนเธฒเธข',
      targetSubject: 'เธชเนเธงเธเธซเธฑเธงเธเธฃเธฒเธเนเธ—เนเธเนเธเธงเธเธญเธ (#matHChartCard) เนเธเนเธ—เนเธ "เธฃเธฒเธขเธเธฒเธฃเธเธฑเธชเธ”เธธ"',
      storageFile: 'js/materials.js, css/styles.css, js/data_history.js, index.html',
      changeSummary: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: "เธขเธเน€เธฅเธดเธเธเธณเธชเธฑเนเธ เธฅเนเธฒเธเธ•เธฑเธงเธเธฃเธญเธเธเธฃเธฒเธ" เนเธ”เธขเธเธณเธเธธเนเธกเธฅเนเธฒเธเธ•เธฑเธงเธเธฃเธญเธเธเธฃเธฒเธ (#matClearHChartBtn) เนเธฅเธฐเธชเนเธ•เธฅเนเธ—เธตเนเน€เธเธตเนเธขเธงเธเนเธญเธเธญเธญเธเธเธฒเธเธชเนเธงเธเธซเธฑเธงเธเธฃเธฒเธเนเธ—เนเธเนเธเธงเธเธญเธ เนเธ”เธขเธขเธฑเธเธเธเธเธฒเธฃเนเธเนเนเธเนเธเธฃเธเธชเธฃเนเธฒเธเน€เธฅเธขเนเน€เธญเธฒเธ•เนเธ•เธฒเธฃเธฒเธเธเธฅเธฑเธเธเธนเนเธเธเธฒเธเธ—เธตเนเธชเธกเธเธนเธฃเธ“เนเนเธงเน',
      details: '1) เนเธ js/materials.js: เธเธณเธเธธเนเธก #matClearHChartBtn เนเธฅเธฐเนเธเธฃเธเธชเธฃเนเธฒเธ .mat-hchart-head-top เธญเธญเธเธเธฒเธเธชเนเธงเธเธซเธฑเธงเธเธฃเธฒเธเนเธ—เนเธเนเธเธงเธเธญเธ เนเธฅเธฐเธ•เธฑเธ”เนเธเนเธ”เธเธฒเธฃเธญเธฑเธเน€เธ”เธ•เธชเธ–เธฒเธเธฐเธเธธเนเธกเนเธ renderMatRemainChart() เธญเธญเธ เธเธทเธเธเนเธฒเนเธเธฃเธเธชเธฃเนเธฒเธเธซเธฑเธงเธเธฃเธฒเธเน€เธ”เธดเธก (.mat-hchart-title) 2) เนเธ css/styles.css: เธเธณเธเธฅเธฒเธช CSS .btn-clear-chart-only, .mat-hchart-actions, .mat-hchart-head-top เนเธฅเธฐเนเธญเธเธดเน€เธกเธเธฑเธ pulseClearBtn เธญเธญเธเธ—เธฑเนเธเธซเธกเธ” เนเธ”เธขเธขเธฑเธเธเธเธเธฒเธฃเธเธฑเธ”เธงเธฒเธ flexbox เธเธญเธเธ•เธฒเธฃเธฒเธเธเธฅเธฑเธ (.mat-wh-tables-row) เนเธฅเธฐเธเธฒเธฃเนเธชเธ”เธเธเธฅเธเธนเนเธเธเธฒเธเธเนเธฒเธข-เธเธงเธฒเนเธงเนเธญเธขเนเธฒเธเธชเธกเธเธนเธฃเธ“เน 3) เธญเธฑเธเน€เธ”เธ• Cache Busters เนเธ index.html เน€เธเนเธ 20261103_1536',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: เธขเธเน€เธฅเธดเธเธเธณเธชเธฑเนเธ เธฅเนเธฒเธเธ•เธฑเธงเธเธฃเธญเธเธเธฃเธฒเธ',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ'
    },
    {
      id: 'log_000_fix_layout_and_add_chart_clear_button',
      timestamp: '2026-11-03 15:26:00',
      timestampTh: '3 เธ.เธข. 2569, 15:26 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธนเนเธเธทเธเน€เธฅเธขเนเน€เธญเธฒเธ•เน & เน€เธเธดเนเธกเธเธธเนเธกเธฅเนเธฒเธเธเธฃเธฒเธ',
      badgeClass: 'badge-type-edit',
      title: 'เนเธเนเนเธเธชเธฒเน€เธซเธ•เธธเน€เธฅเธขเนเน€เธญเธฒเธ•เนเธ•เธฒเธฃเธฒเธเธเธฅเธฑเธเธเนเธญเธเธ•เธเนเธ–เธง เนเธฅเธฐเน€เธเธดเนเธกเธเธธเนเธกเธฅเนเธฒเธเธ•เธฑเธงเธเธฃเธญเธเธเธฃเธฒเธเน€เธเธเธฒเธฐเธเธฃเธฒเธเนเธเธงเธเธญเธ',
      targetSubject: 'เธเธฒเธฃเนเธ”เธชเธฃเธธเธเธเธฅเธฑเธเธเธฑเธชเธ”เธธ (#matWhStandaloneCard), เนเธ–เธเธ•เธฑเธงเธเธฃเธญเธเธขเนเธญเธข เนเธฅเธฐเธชเนเธงเธเธซเธฑเธงเธเธฃเธฒเธเนเธ—เนเธเนเธเธงเธเธญเธ (#matHChartCard) เนเธเนเธ—เนเธ "เธฃเธฒเธขเธเธฒเธฃเธเธฑเธชเธ”เธธ"',
      storageFile: 'css/styles.css, js/materials.js, js/data_history.js, index.html',
      changeSummary: '1) เธเธตเนเนเธเธเนเธฅเธฐเนเธเนเนเธเธชเธฒเน€เธซเธ•เธธเน€เธฅเธขเนเน€เธญเธฒเธ•เนเธ•เธฒเธฃเธฒเธเธเธฅเธฑเธเธ—เธตเนเธ•เธเธเนเธญเธเธฅเธเธกเธฒเธเนเธฒเธเธฅเนเธฒเธเนเธ—เธเธ—เธตเนเธเธฐเธญเธขเธนเนเธเธนเนเธเธฑเธ เน€เธเธดเธ”เธเธฒเธเธเธฒเธฃเธ•เธฑเธ”เธ—เธญเธ CSS เธเธฃเธฃเธ—เธฑเธ”เธ—เนเธฒเธขเนเธ styles.css เนเธ”เนเธ—เธณเธเธฒเธฃเธเธนเนเธเธทเธเธเธ CSS เธเธญเธ .mat-wh-tables-row (display: flex) เนเธฅเธฐเนเธเธฃเธเธชเธฃเนเธฒเธเธ•เธฒเธฃเธฒเธเธเธฅเธฑเธเธฃเธงเธกเธ–เธถเธเธเนเธฒเธข WBS 3 เนเธ–เธงเธเธฃเธเธ–เนเธงเธ 2) เน€เธเธดเนเธกเธเธธเนเธก "โ• เธฅเนเธฒเธเธ•เธฑเธงเธเธฃเธญเธเธเธฃเธฒเธ" เนเธเธกเธธเธกเธเธเธเธงเธฒเธเธญเธเธเธฒเธฃเนเธ”เธเธฃเธฒเธเนเธเธงเธเธญเธเธ•เธฒเธกเธ—เธตเนเธฃเธฐเธเธธเนเธเธเธฃเธญเธเธชเธตเน€เธซเธฅเธทเธญเธ',
      details: '1) เนเธเนเนเธเธชเธฒเน€เธซเธ•เธธเธ•เธฒเธฃเธฒเธเธเธฅเธฑเธเธเนเธญเธเธเธฑเธ: เธเธนเนเธเธทเธเนเธเธฅเน css/styles.css เธเธฒเธเธเธฃเธฃเธ—เธฑเธ” 21,202 เธ–เธถเธเธ—เนเธฒเธขเนเธเธฅเน (เธฃเธงเธก 21,811 เธเธฃเธฃเธ—เธฑเธ”) เธเธนเนเธเธทเธ .mat-wh-tables-row { display: flex; }, .mat-wh-subbox { flex: 1 1 50%; }, .mat-wh-table, .mat-wh-box-indicator เนเธฅเธฐ .mat-sf-wbs-stats-3rows เธ—เธณเนเธซเนเธ•เธฒเธฃเธฒเธเธ—เธฑเนเธ 2 เธเธฑเนเธเธเธฅเธฑเธเธกเธฒเธงเธฒเธเธเธฃเธฐเธเธเธเธนเนเธเธเธฒเธเธเนเธฒเธข-เธเธงเธฒเธญเธขเนเธฒเธเธชเธกเธเธนเธฃเธ“เน 2) เน€เธเธดเนเธกเธเธธเนเธกเธฅเนเธฒเธเธ•เธฑเธงเธเธฃเธญเธเน€เธเธเธฒเธฐเธเธฃเธฒเธเธเธตเน: เน€เธเธดเนเธกเนเธเธฃเธเธชเธฃเนเธฒเธ .mat-hchart-head-top เธเธฃเนเธญเธกเธเธธเนเธก #matClearHChartBtn เนเธเธชเนเธงเธเธซเธฑเธงเธเธฃเธฒเธเนเธ—เนเธเนเธเธงเธเธญเธเธ•เธฃเธเธ•เธณเนเธซเธเนเธเธกเธธเธกเธเธเธเธงเธฒเธ•เธฒเธกเธฃเธนเธ เน€เธกเธทเนเธญเธเธฅเธดเธเธเธฐเธฅเนเธฒเธเธเธฒเธฃเน€เธฅเธทเธญเธเธเธฑเธชเธ”เธธ matState.chartSelDesc เนเธฅเธฐเธเธทเธเธเนเธฒเธเธฒเธฃเนเธชเธ”เธเธเธฅเธ—เธฑเนเธเธเธฃเธฒเธ เธเธฒเธฃเนเธ”เธเธฅเธฑเธ เนเธฅเธฐเธ•เธฒเธฃเธฒเธเธ”เนเธฒเธเธฅเนเธฒเธเนเธซเนเธเธฅเธฑเธเธกเธฒเนเธชเธ”เธเธเนเธญเธกเธนเธฅเธ เธฒเธเธฃเธงเธกเธ—เธฑเนเธเธซเธกเธ” เธเธฃเนเธญเธกเน€เธฅเธทเนเธญเธเธชเธเธฃเธญเธฅเธฅเนเธเธฅเธฑเธเนเธเธเธเธชเธธเธ” 3) เธญเธฑเธเน€เธ”เธ• Cache Busters เนเธ index.html เน€เธเนเธ 20261103_1526',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: 9. เนเธเนเนเธเธเธทเธเธเนเธฒ เน€เธเนเธเน€เธเธทเนเธญเธเธเธฒเธเธญเธฐเนเธฃ (เธฃเธนเธ media_1793693428922_ef419c0a.jpg) เนเธฅเธฐ 10. เน€เธเธดเนเธกเธเธธเนเธกเธฅเนเธฒเธเธ•เธฑเธงเธเธฅเธฒเธ เน€เธเธเธฒเธฐเธเธฃเธฒเธเธเธตเน (เธฃเธนเธ media_1793693535526_b4cb822e.jpg)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธชเธนเธ'
    },
    {
      id: 'log_000_wh_card_remove_red_keep_yellow_banner',
      timestamp: '2026-11-03 14:58:00',
      timestampTh: '3 เธ.เธข. 2569, 14:58 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธเธฅเนเธญเธเธเธทเนเธญเธเธฑเธชเธ”เธธเธเธฒเธฃเนเธ”เธเธฅเธฑเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธณเธเธธเนเธกเธเธทเธเธเนเธฒเธ เธฒเธเธฃเธงเธกเธญเธญเธ เธเธเธเธฅเนเธญเธเธเธทเนเธญเธเธฑเธชเธ”เธธเนเธงเน เนเธฅเธฐเนเธชเธ”เธ "เนเธกเนเธกเธตเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเน€เธฅเธทเธญเธ" เน€เธกเธทเนเธญเธขเธฑเธเนเธกเนเนเธ”เนเน€เธฅเธทเธญเธเธเธฑเธชเธ”เธธ',
      targetSubject: 'เธชเนเธงเธเธซเธฑเธงเนเธฅเธฐเธเธฒเธฃเนเธ”เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เนเธ•เนเธฅเธฐเธเธฅเธฑเธเธเธฑเธชเธ”เธธ (#matWhStandaloneCard) เนเธเน€เธกเธเธน "เธฃเธฒเธขเธเธฒเธฃเธเธฑเธชเธ”เธธ"',
      storageFile: 'js/materials.js, css/styles.css, js/data_history.js, index.html',
      changeSummary: 'เธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: "เธงเธเนเธ”เธเน€เธญเธฒเธญเธญเธ เธงเธเน€เธซเธฅเธทเธญเธเนเธซเนเธเธเนเธงเน เธซเธฒเธเนเธกเนเนเธ”เนเน€เธฅเธทเธญเธเนเธซเนเนเธชเธ”เธ เนเธกเนเธกเธตเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเน€เธฅเธทเธญเธ" เธเธณเธเธธเนเธก "โ• เธเธทเธเธเนเธฒเธ เธฒเธเธฃเธงเธก" (เธงเธเนเธ”เธ) เธญเธญเธเธเธฒเธเธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฅเธฑเธ เธเธเธเธฅเนเธญเธเธเนเธญเธเธงเธฒเธกเธเธทเนเธญเธเธฑเธชเธ”เธธ (เธงเธเน€เธซเธฅเธทเธญเธ) เนเธงเนเธ”เนเธฒเธเธเธเธชเธธเธ”เน€เธชเธกเธญ เนเธฅเธฐเน€เธกเธทเนเธญเธขเธฑเธเนเธกเนเนเธ”เนเน€เธฅเธทเธญเธเธเธฑเธชเธ”เธธเธเธฐเนเธชเธ”เธเธเนเธญเธเธงเธฒเธก "เนเธกเนเธกเธตเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเน€เธฅเธทเธญเธ"',
      details: '1) เนเธ js/materials.js: เธเธณเธเธธเนเธก <button class="mat-wh-reset-btn">โ• เธเธทเธเธเนเธฒเธ เธฒเธเธฃเธงเธก</button> เธญเธญเธเธเธฒเธ headerActionHtml เธ—เธฑเนเธเธซเธกเธ” 2) เธเธฃเธฑเธ subBannerHtml เนเธซเนเธญเธขเธนเนเธ”เนเธฒเธเธเธเธชเธธเธ”เธเธญเธเธเธฒเธฃเนเธ”เธเธฅเธฑเธเน€เธชเธกเธญ เนเธ”เธขเธซเธฒเธ it เน€เธเนเธ null (เธขเธฑเธเนเธกเนเนเธ”เนเน€เธฅเธทเธญเธเธเธฑเธชเธ”เธธ) เนเธซเนเนเธชเธ”เธ <div class="mat-wh-selected-mat-box not-selected">๐” เนเธกเนเธกเธตเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเน€เธฅเธทเธญเธ</div> เนเธฅเธฐเน€เธกเธทเนเธญเน€เธฅเธทเธญเธเธเธฑเธชเธ”เธธเธเธฐเนเธชเธ”เธเธเธทเนเธญเธเธฑเธชเธ”เธธเน€เธ•เนเธก 3) เนเธ css/styles.css: เน€เธเธดเนเธกเธชเนเธ•เธฅเน .mat-wh-selected-mat-box.not-selected เนเธซเนเธเนเธญเธเธงเธฒเธกเธชเธตเธเธงเธฅเธชเธเธฒเธขเธ•เธฒ เธ—เธฑเนเธ Dark Theme เนเธฅเธฐ Light Theme 4) เธญเธฑเธเน€เธ”เธ• Cache Busters เนเธ index.html เน€เธเนเธ 20261103_1458',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: เธงเธเนเธ”เธเน€เธญเธฒเธญเธญเธ เธงเธเน€เธซเธฅเธทเธญเธเนเธซเนเธเธเนเธงเน เธซเธฒเธเนเธกเนเนเธ”เนเน€เธฅเธทเธญเธเนเธซเนเนเธชเธ”เธ เนเธกเนเธกเธตเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเน€เธฅเธทเธญเธ (media_1793691796218_6d733c39.jpg)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_link_chart_mat_selection_to_table',
      timestamp: '2026-11-03 14:50:00',
      timestampTh: '3 เธ.เธข. 2569, 14:50 เธ.',
      type: 'EDIT',
      typeBadge: 'เน€เธเธทเนเธญเธกเนเธขเธเธเธฃเธฒเธเธเธฑเธเธ•เธฒเธฃเธฒเธเธเธฑเธชเธ”เธธ',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธทเนเธญเธกเนเธขเธเธเธฒเธฃเน€เธฅเธทเธญเธเธฃเธฒเธขเธเธฒเธฃเธเธฑเธชเธ”เธธเธเธฒเธเนเธ—เนเธเธเธฃเธฒเธเนเธเธขเธฑเธเธ•เธฒเธฃเธฒเธเธเธฃเธดเธกเธฒเธ“เธเนเธฒเธเน€เธเธดเธ (Bi-directional Drilldown)',
      targetSubject: 'เธเธฒเธฃเธเธฅเธดเธเน€เธฅเธทเธญเธเธฃเธฒเธขเธเธฒเธฃเธเธฑเธชเธ”เธธ/เนเธ—เนเธเธเธเนเธเธเธฃเธฒเธเนเธเธงเธเธญเธ เนเธฅเธฐเธ•เธฒเธฃเธฒเธเธเนเธญเธกเธนเธฅเธเธฃเธดเธกเธฒเธ“เธเนเธฒเธเน€เธเธดเธ (#matTableCard) เนเธเน€เธกเธเธน "เธฃเธฒเธขเธเธฒเธฃเธเธฑเธชเธ”เธธ"',
      storageFile: 'js/materials.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'เธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: "เน€เธฅเธทเธญเธเธฃเธฒเธขเธเธฑเธชเธ”เธธเนเธเธเธฃเธฒเธ เนเธฅเนเธง เนเธซเนเธฅเธดเนเธเนเธชเธ”เธเนเธเธ•เธฒเธฃเธฒเธเธเธฃเธดเธกเธฒเธ“เธเนเธฒเธเน€เธเธดเธเธ”เนเธงเธข" เธเธฃเธฑเธเธเธฃเธธเธเนเธซเนเธเธฒเธฃเธเธฅเธดเธเธ—เธตเนเนเธ–เธงเธซเธฃเธทเธญเนเธ—เนเธเธเธฃเธฒเธเธเธญเธเธฃเธฒเธขเธเธฒเธฃเธเธฑเธชเธ”เธธเนเธ” เธ—เธณเธเธฒเธฃเธเธฃเธญเธเธ•เธฒเธฃเธฒเธเธฃเธฒเธขเธเธฒเธฃเธเธฑเธชเธ”เธธเธซเธฅเธฑเธเธ”เนเธฒเธเธฅเนเธฒเธเนเธซเนเนเธชเธ”เธเน€เธเธเธฒเธฐเธเธฑเธชเธ”เธธเธฃเธฒเธขเธเธฒเธฃเธเธฑเนเธเธ—เธฑเธเธ—เธต เธเธฃเนเธญเธกเธญเธฑเธเน€เธ”เธ•เธเธฒเธฃเนเธ”เธชเธฃเธธเธ KPI เธขเนเธญเธขเนเธฅเธฐเธเธณเธเธงเธ“เธชเธ–เธดเธ•เธด WBS เธญเธขเนเธฒเธเธชเธญเธ”เธเธฅเนเธญเธเธเธฑเธเนเธเธเน€เธฃเธตเธขเธฅเนเธ—เธกเน',
      details: '1) เนเธ js/materials.js: เธเธฃเธฑเธเธเธฃเธธเธ window.selectMatChartItemWithBudget เนเธฅเธฐ window.selectMatChartItem เนเธซเนเธฅเนเธฒเธ cachedFilterKey เธฃเธตเน€เธเนเธ•เธซเธเนเธฒเธ•เธฒเธฃเธฒเธเนเธเธ—เธตเนเธซเธเนเธฒเธ—เธตเน 1 (matState.page = 1) เนเธฅเธฐเน€เธฃเธตเธขเธ renderMaterialsTab() เน€เธเธทเนเธญเธชเธฑเนเธเนเธซเนเธ—เธฑเนเธเธเธฃเธฒเธ เธเธฒเธฃเนเธ”เธเธฅเธฑเธ เนเธฅเธฐเธ•เธฒเธฃเธฒเธเธ”เนเธฒเธเธฅเนเธฒเธเธเธฃเธฐเธกเธงเธฅเธเธฅเธเนเธญเธกเธนเธฅเธ—เธตเนเธ•เธฃเธเธเธฑเธเธญเธขเนเธฒเธเธชเธกเธเธนเธฃเธ“เน 2) เธญเธฑเธเน€เธ”เธ•เธซเธฑเธงเธ•เธฒเธฃเธฒเธ matTableActiveCriteriaVal เนเธซเนเนเธชเธ”เธเธเนเธฒเธขเธเธทเนเธญเธเธฑเธชเธ”เธธเธ—เธตเนเธเธณเธฅเธฑเธเธเธฃเธญเธ 3) เน€เธเธดเนเธกเธเธธเนเธก "โ• เธฅเนเธฒเธเธ•เธฑเธงเน€เธฅเธทเธญเธเธเธฃเธฒเธ" เนเธเนเธ–เธเธซเธฑเธงเธ•เธฒเธฃเธฒเธ (#matClearChartSelBtn) เนเธฅเธฐเธเธฑเธเธเนเธเธฑเธ window.clearMatChartSelection() เธชเธณเธซเธฃเธฑเธเธเธฅเธดเธเธเธทเธเธเนเธฒเธเธฅเธฑเธเธชเธนเนเธฃเธฒเธขเธเธฒเธฃเธ—เธฑเนเธเธซเธกเธ” 4) เนเธ css/styles.css: เน€เธเธดเนเธกเธชเนเธ•เธฅเน .btn-clear-chart-sel เธฃเธญเธเธฃเธฑเธเธ—เธฑเนเธเธเธตเธกเธกเธทเธ”เนเธฅเธฐเธชเธงเนเธฒเธ 5) เธญเธฑเธเน€เธ”เธ• Cache Busters เนเธ index.html เน€เธเนเธ 20261103_1450',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: เน€เธฅเธทเธญเธเธฃเธฒเธขเธเธฑเธชเธ”เธธเนเธเธเธฃเธฒเธ เนเธฅเนเธง เนเธซเนเธฅเธดเนเธเนเธชเธ”เธเนเธเธ•เธฒเธฃเธฒเธเธเธฃเธดเธกเธฒเธ“เธเนเธฒเธเน€เธเธดเธเธ”เนเธงเธข',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธชเธนเธ'
    },
    {
      id: 'log_000_chart_bar_budget_divider_line',
      timestamp: '2026-11-03 14:35:00',
      timestampTh: '3 เธ.เธข. 2569, 14:35 เธ.',
      type: 'EDIT',
      typeBadge: 'เน€เธชเนเธเนเธเนเธเธชเธตเนเธ—เนเธเธเธฃเธฒเธ',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธดเนเธกเน€เธชเนเธเนเธเนเธเธชเธตเธเธฒเธงเธชเธงเนเธฒเธเธเธกเธเธฑเธ” (Precision Divider Line) เธเธฑเนเธเธฃเธฐเธซเธงเนเธฒเธเธ—เนเธญเธเธเธเนเธเนเธ—เนเธเธเธฃเธฒเธ',
      targetSubject: 'เนเธ—เนเธเธเธฃเธฒเธเนเธเธงเธเธญเธ (.mat-hchart-bar) เนเธเน€เธกเธเธน "เธฃเธฒเธขเธเธฒเธฃเธเธฑเธชเธ”เธธ"',
      storageFile: 'css/styles.css, js/materials.js, index.html, js/data_history.js',
      changeSummary: 'เธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: "เธญเธญเธเนเธเธ เน€เธเธดเนเธกเน€เธชเนเธเนเธเนเธเธชเธตเนเธเนเธ—เนเธเธเธฃเธฒเธ เน€เธเธทเนเธญเนเธขเธเธเธงเธฒเธกเนเธ•เธเธ•เนเธฒเธเธฃเธฐเธซเธงเนเธฒเธเธเธเธซเธเนเธญเธข" เน€เธเธดเนเธกเน€เธชเนเธเธเธฑเนเธเธชเธตเธเธฒเธงเธชเธงเนเธฒเธเธเธกเธเธฑเธ” 2px (Pure White with Glow) เธเธฑเนเธเธฃเธฐเธซเธงเนเธฒเธเธ—เนเธญเธเธเธ I, P (เธชเธตเนเธ”เธ) เธเธฑเธ เธเธ C (เธชเธตเธชเนเธกเธชเธฐเธ—เนเธญเธเนเธชเธ) เนเธเนเธ—เนเธเธเนเธฒเธเน€เธเธดเธ เนเธฅเธฐเธเธฑเนเธเธฃเธฐเธซเธงเนเธฒเธ SLoc 0022 เธเธฑเธ SLoc 0021 เนเธเนเธ—เนเธเธเธเน€เธซเธฅเธทเธญ',
      details: '1) เนเธ js/materials.js: เน€เธเธดเนเธกเธเธฅเธฒเธช bar-seg-first เธเธเน€เธเธเน€เธกเธเธ•เนเนเธฃเธ เนเธฅเธฐ bar-seg-last เธเธเน€เธเธเน€เธกเธเธ•เนเธ—เธตเนเธชเธญเธเธเธญเธเนเธ—เนเธเธเธฃเธฒเธ 2) เนเธ css/styles.css: เธเธณเธซเธเธ”เธชเนเธ•เธฅเน .mat-hchart-bar.bar-seg-first เนเธซเนเธกเธต border-right: 2px solid #FFFFFF !important เนเธฅเธฐ box-shadow: 0 0 4px rgba(255, 255, 255, 0.7) เธชเธฃเนเธฒเธเน€เธชเนเธเธเธฑเนเธเธชเธตเธเธฒเธงเน€เธฅเน€เธเธญเธฃเนเธ—เธตเนเธเธกเธเธฑเธ”เธฃเธฐเธ”เธฑเธเธเธดเธเน€เธเธฅ เนเธขเธเน€เธเธ”เธชเธตเนเธ”เธเนเธฅเธฐเธชเนเธกเธชเธฐเธ—เนเธญเธเนเธชเธเธญเธญเธเธเธฒเธเธเธฑเธเธเธฑเธ”เน€เธเธ 3) เธญเธฑเธเน€เธ”เธ• Version Cache Busters เนเธ index.html เน€เธเนเธ 20261103_1435',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: เธญเธญเธเนเธเธ เน€เธเธดเนเธกเน€เธชเนเธเนเธเนเธเธชเธตเนเธเนเธ—เนเธเธเธฃเธฒเธ เน€เธเธทเนเธญเนเธขเธเธเธงเธฒเธกเนเธ•เธเธ•เนเธฒเธเธฃเธฐเธซเธงเนเธฒเธเธเธเธซเธเนเธญเธข',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_neon_orange_budget_c',
      timestamp: '2026-11-03 14:15:00',
      timestampTh: '3 เธ.เธข. 2569, 14:15 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธชเธตเธชเนเธกเธชเธฐเธ—เนเธญเธเนเธชเธ เธเธ C',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธฅเธตเนเธขเธเธชเธตเธเนเธฒเธเน€เธเธดเธเธเธ C เน€เธเนเธเธชเธตเธชเนเธกเธชเธฐเธ—เนเธญเธเนเธชเธเธชเธงเนเธฒเธเธชเธ”เนเธช (Fluorescent Neon Orange)',
      targetSubject: 'เธเธฃเธฒเธเนเธ—เนเธเนเธเธงเธเธญเธ (#matHChartCard) เนเธฅเธฐเธเธณเธญเธเธดเธเธฒเธขเธชเธฑเธเธฅเธฑเธเธฉเธ“เน (Legend) เนเธเน€เธกเธเธน "เธฃเธฒเธขเธเธฒเธฃเธเธฑเธชเธ”เธธ"',
      storageFile: 'css/styles.css, js/materials.js, index.html, js/data_history.js',
      changeSummary: 'เธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: "เธเนเธฒเธเน€เธเธดเธเธเธ C เนเธเนเธชเธตเธชเนเธกเธชเธฐเธ—เนเธญเธเนเธชเธ เธชเธงเนเธฒเธเน" เธเธฃเธฑเธเน€เธเธฅเธตเนเธขเธเธเธธเธ”เธชเธตเธเนเธฒเธเน€เธเธดเธเธเธ C เธเธฒเธเธชเธตเธชเนเธกเธเธฒเธชเน€เธ—เธฅเน€เธ”เธดเธก เน€เธเนเธเธชเธตเธชเนเธกเธชเธฐเธ—เนเธญเธเนเธชเธเน€เธเธฃเธ”เธเธฃเธตเน€เธกเธตเธขเธก (Fluorescent Neon Orange #FF6600, #FF7700, #FFAA00) เธเธฃเนเธญเธกเน€เธญเธเน€เธเธเธ•เนเน€เธฃเธทเธญเธเนเธชเธ (Luminous Glow) เธ—เธฑเนเธเนเธ—เนเธเธเธฃเธฒเธ เธเธธเธ”เธชเธฑเธเธฅเธฑเธเธฉเธ“เน เธเนเธญเธเธงเธฒเธก เนเธฅเธฐเธเธธเนเธกเน€เธฅเธทเธญเธเธเธ',
      details: '1) เนเธ css/styles.css: เธเธฃเธฑเธ .mat-hchart-bar.bar-orange เน€เธเนเธ linear-gradient(90deg, #FF5500 0%, #FF7700 50%, #FFAA00 100%) เธเธฃเนเธญเธก box-shadow เน€เธฃเธทเธญเธเนเธชเธเธชเธตเธชเนเธกเธเธตเธญเธญเธ, เธเธฃเธฑเธ .lg-orange เน€เธเนเธ #FF6600 เน€เธฃเธทเธญเธเนเธชเธ 14px, เธเธฃเธฑเธ .mat-budget-pill.pill-orange.active, เธเธฃเธฑเธ .val-orange เนเธฅเธฐ .val-orange.active-target เน€เธเนเธเธชเธตเธชเธงเนเธฒเธเธเธกเธเธฑเธ” 2) เนเธ js/materials.js: เธเธฃเธฑเธเธเนเธญเธเธงเธฒเธกเธเนเธฒเธข Legend เน€เธเนเธ "เธเนเธฒเธเน€เธเธดเธ เธเธ C (เธชเธตเธชเนเธกเธชเธฐเธ—เนเธญเธเนเธชเธ)" เนเธฅเธฐเธเธฃเธฑเธเธเธฒเธฃเธเธณเธเธงเธ“ tfoot / fillstyle เธเธญเธเธเธฒเธฃเนเธ”เธเธฅเธฑเธเนเธซเนเธชเธญเธ”เธเธฅเนเธญเธเธเธฑเธ 3) เธญเธฑเธเน€เธ”เธ• Version Cache Busters เนเธ index.html เน€เธเนเธ 20261103_1415',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: เธเนเธฒเธเน€เธเธดเธเธเธ C เนเธเนเธชเธตเธชเนเธกเธชเธฐเธ—เนเธญเธเนเธชเธ เธชเธงเนเธฒเธเน',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
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
    {
      id: 'log_000_fix_diff_truncation_restore_system',
      timestamp: '2026-10-30 11:50:00',
      timestampTh: '30 ต.ค. 2569, 11:50 น.',
      type: 'EDIT',
      typeBadge: 'กู้คืนไฟล์ระบบที่ถูกตัดท้าย (SyntaxError Fix)',
      badgeClass: 'badge-type-edit',
      title: 'กู้คืนส่วนท้ายของไฟล์ js/app.js และ js/data_history.js ที่ถูกตัดด้วยข้อความ [truncated for diff preview] ทำให้ข้อมูลไม่โหลดและกดปุ่มไม่ได้',
      targetSubject: 'ระบบหลักทั้งหมด (js/app.js, js/data_history.js, index.html)',
      storageFile: 'js/app.js, js/data_history.js, index.html',
      changeSummary: 'แก้ไขปัญหาด่วน "ข้อมูลหายหมด กดอะไรไม่ได้เลย": ตรวจสอบพบว่าเมื่อไฟล์ js/app.js และ js/data_history.js มีขนาดเกิน 512 KB ระบบ Diff Preview ได้ตัดท้ายไฟล์แล้วแทรกข้อความ "... [truncated for diff preview]" ทำให้เกิด Uncaught SyntaxError สคริปต์หลักจึงหยุดทำงานทันที ได้ดำเนินการกู้คืนโค้ดส่วนท้ายทั้ง 2 ไฟล์กลับคืนครบ 100% พร้อมคงการอัปเดตทั้งหมดของวันนี้ไว้ครบถ้วน และลบฟังก์ชันเก่าที่ไม่ได้ใช้งานออกเพื่อลดขนาดไฟล์ app.js ให้ต่ำกว่า 505 KB',
      details: '1) กู้คืนโค้ดส่วนท้ายของ js/app.js (ตั้งแต่ฟังก์ชัน initColorPaletteManager จนถึงปิด IIFE ท้ายไฟล์) และลบเมธอดเก่าที่ไม่ได้เรียกใช้งานแล้ว (_legacyAchieveDiamondSparkles, drawGoldenCrown, drawSparkleStar) เพื่อให้ขนาดไฟล์ลดลงเหลือ ~504 KB ปลอดภัยจากการถูกตัด 512 KB 2) กู้คืนโค้ดส่วนท้ายของ js/data_history.js (ตั้งแต่ log_000_remove_metric_toggle_for_all_criteria จนถึงฟังก์ชันเรนเดอร์หน้าประวัติข้อมูลและผัง Model View ท้ายไฟล์) พร้อมคงวันที่ไฟล์ 04 WBS (30 ต.ค. 69 • 937.7 KB และ 2.37 MB) ครบทุกจุด 3) เขียนไฟล์แบบ Direct UTF-8 (No BOM) และตรวจสอบไวยากรณ์ JavaScript (Syntax Validation) ทั้งระบบไม่พบข้อผิดพลาด 4) อัปเดต Version Cache Busters เป็น ?v=20261030_1150',
      sourceFile: 'คำสั่งผู้ใช้งาน: "ข้อมูลหายหมด กดอะไรไม่ได้เลย"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'วิกฤต (กู้คืนการทำงานของระบบ Dashboard ทั้งหมด 100% โดยไม่สูญเสียฟีเจอร์และข้อมูลที่อัปเดตในวันนี้)'
    },
    {
      id: 'log_000_remove_crown_enlarge_achieve_goal_no_overlap',
      timestamp: '2026-10-30 11:36:00',
      timestampTh: '30 ต.ค. 2569, 11:36 น.',
      type: 'EDIT',
      typeBadge: 'เอามงกุฎออก & ขยายขนาดบรรลุเป้าหมายไม่ให้ซ้อนทับ',
      badgeClass: 'badge-type-edit',
      title: 'นำสัญลักษณ์มงกุฎออกจากแท่งที่บรรลุเป้าหมาย ขยายขนาดตัวอักษร "บรรลุเป้าหมาย" ให้ใหญ่เด่นชัด และจัดระบบป้องกันการซ้อนทับทั้งแนวนอนและแนวตั้ง',
      targetSubject: 'กราฟแท่งเปรียบเทียบเกณฑ์วัด (#criteriaComparisonChart, #criteriaFireworksCanvas, PeaChart, window.CriteriaFireworks)',
      storageFile: 'js/chart.js, js/app.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน: "เอามงกุฎออก และเพิ่มขนาดบรรลุเป้าหมาย และไม่ให้ซ้อนทับกัน" 1) นำรูปมงกุฎสีทองเหนือคำว่า "บรรลุเป้าหมาย" และไอคอน 👑 ในแถบคำอธิบาย (Legend) ออกทั้งหมด คงไว้เฉพาะประกายเพชรสีต่างๆ ขนาดเล็กวิบวับ 2) ขยายขนาดฟอนต์คำว่า "บรรลุเป้าหมาย" จากเดิมสูงสุด 13.8px เป็นสูงสุด 18.5px ให้ใหญ่คมชัดสมดุลกับตัวเลข % ด้านล่าง 3) จัดระบบป้องกันการซ้อนทับครบทุกทิศทาง: เว้นระยะห่างแนวนอนระหว่างแท่งข้างเคียงอย่างน้อย 20px (เช่น แท่ง 1.2 และ 1.3 ที่บรรลุเป้าหมายติดกัน), ล็อคป้าย KPI ในแท่งไม่ให้ลอยขึ้นไปซ้อนทับข้อความด้านบน, คำนวณขอบล่าง Legend อัตโนมัติไม่ให้ชนกันเมื่อจอแคบ และจัดวางประกายเพชรให้อยู่เฉพาะกรอบนอกโดยไม่ทับตัวอักษร',
      details: '1) ใน js/app.js (window.CriteriaFireworks): ยกเลิกการวาด drawGoldenCrown() ใน render() และเอาไอคอน 👑 ออกจาก customLegend พร้อมปรับพิกัด drawAchieveDiamondSparkles() ให้ล้อมกรอบนอกของข้อความขนาดใหม่และจำกัด wingOuterX ตาม groupW ไม่ให้ชนแท่งข้างเคียง 2) ใน js/chart.js (PeaChart): ขยายขนาดฟอนต์ achieveText เป็น 13.0px-18.5px พร้อมคำนวณ safeHorizontalLimit = groupW - 20 ป้องกันข้อความชนกันแนวนอน คำนวณ legendBottomY ป้องกันชน Legend ด้านบน และล็อค minAllowedY ของป้าย KPI ในแท่งให้อยู่ใต้ขอบบนแท่งกราฟ (y + 4) เสมอ 3) อัปเดต Cache Busters เป็น ?v=20261030_1136 และบันทึก Audit Log ตามข้อกำหนด AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน: "เอามงกุฎออก และเพิ่มขนาดบรรลุเป้าหมาย และไม่ให้ซ้อนทับกัน"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ทำให้ข้อความ "บรรลุเป้าหมาย" ใหญ่เด่นชัด อ่านง่าย สะอาดตา ไร้การซ้อนทับในทุกขนาดหน้าจอและทุกหน่วยงาน)'
    },
    {
      id: 'log_000_pastel_thai_tea_seg3_all_menus',
      timestamp: '2026-10-30 11:25:00',
      timestampTh: '30 ต.ค. 2569, 11:25 น.',
      type: 'EDIT',
      typeBadge: 'เปลี่ยนสีพื้นหลังเป้าหมาย ธ.ค. เป็นสีชาไทยพาสเทลทุกเมนู',
      badgeClass: 'badge-type-edit',
      title: 'เปลี่ยนสีพื้นหลังช่องเป้าหมายเดือนที่ 3 (ธ.ค.) จากสีฟ้าไซยาน เป็นโทนสีชาไทยพาสเทล (Pastel Thai Milk Tea) ครบทุกเมนูที่เกี่ยวข้อง',
      targetSubject: 'แถบเป้าหมายเดือน ธ.ค. หน้า Overview (.single-bar-segment.seg-3, .bar-row-fill.m-3, .next3m-month-card.month-3) และหน้า WBS คงเหลือ (.btn-wbs-kpi-month.m-seg-3, .fill-target.target-seg-3 / .target-m-12, .wbs-floating-target-month.target-seg-3)',
      storageFile: 'css/styles.css, js/app.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน: "พื้นหลังเปลี่ยนสีชาไทย พาสเทล สวยๆ และเปลี่ยนทุกเมฯูที่เกี่ยวข้องด้วย" 1) ปรับสีพื้นหลังช่องเป้าหมายเดือนที่ 3 (ธ.ค.) ในหน้าภาพรวมผู้บริหาร (Overview) เป็นโทนสีชาไทยพาสเทลไล่เฉดนุ่มนวล (#D97742 -> #EE965B -> #F7B787 -> #FDE2C8) พร้อมกล่องป้าย เป้า KPI โทนชาเข้มโปร่งแสงและเงาตัวอักษรคมชัด 2) อัปเดตทุกเมนูและองค์ประกอบที่เกี่ยวข้องให้เป็นชุดสีชาไทยพาสเทลเดียวกันทั้งหมด ได้แก่ แถบลูกศรเลือกเดือนเป้าหมายในหน้า WBS คงเหลือ (ทั้งสถานะปกติและสถานะกำลังเลือก), กราฟแท่งบนเป้าหมายปิดเพิ่มเมื่อเลือกเดือน ธ.ค., ป้ายเดือนในการ์ดลอยสีฟ้า Checkbox (#wbsFloatingTargetMonth) เมื่อเลือกเดือน ธ.ค. ตลอดจนการ์ดเป้าหมายและตารางเป้าหมายเชิงลึก',
      details: '1) ใน css/styles.css: ปรับ .single-bar-segment.seg-3 (+ .seg-mname, .seg-kpi-badge), .bar-row-fill.m-3, .next3m-month-card.month-3 (Dark/Light), .btn-wbs-kpi-month.m-seg-3 และ .active.m-seg-3, .fill-target.target-seg-3 / .target-m-12 และ .wbs-floating-target-month.target-seg-3 เป็นโทนสีชาไทยพาสเทล (#D97742, #EE965B, #F7B787, #FDE2C8) 2) ใน js/app.js และ index.html: ปรับสีจุดสัญลักษณ์และหัวตาราง #thNext3mMonth3 ให้เข้าชุดสีชาไทยพาสเทล และอัปเดต Version Cache Busters เป็น ?v=20261030_1125 3) บันทึก Audit Log ตามข้อกำหนด AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน: "พื้นหลังเปลี่ยนสีชาไทย พาสเทล สวยๆ และเปลี่ยนทุกเมฯูที่เกี่ยวข้องด้วย"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับโทนสีเป้าหมายเดือน ธ.ค. เป็นสีชาไทยพาสเทลสวยงามสอดคล้องกันทั้งหน้า Overview และหน้า WBS คงเหลือทุกจุด)'
    },
    {
      id: 'log_000_achieve_goal_colorful_diamond_sparkles',
      timestamp: '2026-10-30 11:17:00',
      timestampTh: '30 ต.ค. 2569, 11:17 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มประกายเพชรหลากสีวิบวับที่ป้ายบรรลุเป้าหมาย',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มเอฟเฟกต์ประกายเพชรสีต่างๆ ขนาดเล็ก วิบวับ ล้อมรอบข้อความ "บรรลุเป้าหมาย" เฉพาะเกณฑ์วัดที่บรรลุเป้าหมายสิ้นปี',
      targetSubject: 'กราฟแท่งเปรียบเทียบ 10 ประเภทเกณฑ์วัด (#criteriaComparisonChart, #criteriaFireworksCanvas, window.CriteriaFireworks)',
      storageFile: 'js/chart.js, js/app.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน: "เฉพาะบรรลุเป้าหมาย ให้เพิ่มประกายเพชรสีต่างๆเล็ก วิบวับ สวยๆ" 1) เพิ่มการวาดประกายเพชรเจียระไนขนาดเล็กหลากสี (ฟ้าไอซ์ไซยาน, ชมพูโรส, เขียวมรกต, ม่วงอเมทิสต์, ทองคำแชมเปญ, น้ำเงินไพลิน และเพชรขาวบริสุทธิ์) จำนวน 15 จุด ล้อมรอบข้อความ "บรรลุเป้าหมาย" เฉพาะแท่งกราฟที่บรรลุเป้าหมาย KPI สิ้นปี (ext.isExceedDecKpi === true) 2) ออกแบบจังหวะกะพริบวิบวับ (Non-linear Diamond Twinkle Curve) สลับเฟสกันอย่างเป็นธรรมชาติ พร้อมเหลี่ยมเพชร 8 แฉกเรียวคมและจุดสะท้อนแสงสีขาวตรงกลาง โดยไม่บดบังความคมชัดของตัวอักษรสีทองและมงกุฎด้านบน',
      details: '1) ใน js/chart.js: บันทึกค่าความกว้างข้อความจริง (curBarObj.achieveTextW) และขนาดฟอนต์ (curBarObj.achieveFontSize) ของคำว่า "บรรลุเป้าหมาย" เพื่อส่งต่อพิกัดที่แม่นยำไปยังเลเยอร์แอนิเมชัน 2) ใน js/app.js (window.CriteriaFireworks): ยกระดับความละเอียด DPR สูงสุดเป็น 2x เพื่อความคมชัดของเหลี่ยมเพชร เพิ่มฟังก์ชัน drawDiamondGemSparkle() และ drawAchieveDiamondSparkles() วาดประกายเพชรหลากสีขนาดเล็กกะพริบวิบวับบน #criteriaFireworksCanvas เฉพาะรายการที่บรรลุเป้าหมาย 3) อัปเดต Cache Busters เป็น ?v=20261030_1117 และบันทึก Audit Log ตามข้อกำหนด AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน: "เฉพาะบรรลุเป้าหมาย ให้เพิ่มประกายเพชรสีต่างๆเล็ก วิบวับ สวยๆ"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ยกระดับความโดดเด่นสวยงามให้ป้าย "บรรลุเป้าหมาย" ด้วยประกายเพชรหลากสีวิบวับแบบเรียลไทม์โดยไม่กระทบประสิทธิภาพหรือความชัดเจนของตัวอักษร)'
    },
    {
      id: 'log_000_update_file_04_wbs_oct30_morning',
      timestamp: '2026-10-30 08:28:00',
      timestampTh: '30 ต.ค. 2569, 08:28 น.',
      type: 'MERGE',
      typeBadge: 'อัปเดตไฟล์ 04 WBS & สถานะ SAP 30 ต.ค. 69',
      badgeClass: 'badge-type-merge',
      title: 'อัปเดตข้อมูลไฟล์ 04 WBS ZBUDR064 (รอบ 30 ต.ค. 2569, 08:16 น.) คำนวณ % เบิกพัสดุและ % เบิก คชจ. ผสานเข้า data_wbs.js และอัปเดตวันที่สถานะ SAP ครบทุกจุด',
      targetSubject: 'ฐานข้อมูล WBS คงเหลือ (js/data_wbs.js), สถานะ SAP, % เบิกพัสดุ, % เบิก คชจ. และป้ายวันที่แก้ไขล่าสุดทุกจุดบนหน้าเว็บ',
      storageFile: '04 WBS ZBUDR064 %พัสดุและค่าแรงและสถานะsap.xlsx, js/data_wbs.js, index.html, js/wbs.js, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "update ไฟล์ 04WBS": 1) นำเข้าและประมวลผลไฟล์ Excel ต้นทาง "04 WBS ZBUDR064 %พัสดุและค่าแรงและสถานะsap.xlsx" (ต้นฉบับ 731.7 KB / 749,279 ไบต์, 4,590 แถวดิบ บันทึกเมื่อ 30 ต.ค. 2569 เวลา 08:16:07 น.) 2) เติมสูตรและจัดรูปแบบเปอร์เซ็นต์ในคอลัมน์ 24 (% เบิกพัสดุ: =IFERROR((M/T),0)) และคอลัมน์ 25 (% เบิก คชจ.: =IF(V=0,0,IFERROR(R/V,0))) ครบทุกแถว (ขนาดหลังบันทึกสูตร 937.7 KB เวลา 08:26 น.) 3) ผสานข้อมูล (Merge) เข้ากับฐานข้อมูลงานคงเหลือหลัก 2,083 โครงการ (ไฟล์ 03 + 04 + 05 + 06) ครบถ้วน 100% 4) ซิงค์ข้อมูลสดจาก Google Sheet Live API คงไว้ครบถ้วน (แผนปิดงาน planClose 1,095 รายการ, หมายเหตุ note 1,021 รายการ) 5) ตรวจพบการเปลี่ยนแปลงสถานะ SAP จำนวน 114 โครงการ (เช่น TECO D2 และ REL D1 ปิดงานเป็น CLSD F4), การเปลี่ยนแปลง % เบิกพัสดุ 81 โครงการ และการเปลี่ยนแปลง % เบิก คชจ. 32 โครงการ 6) อัปเดตวันที่สถานะ SAP แก้ไขล่าสุดเป็น "30 ต.ค. 69" ครบถ้วนทุกจุดตามข้อกำหนด AGENTS.md',
      details: '1) สำรองไฟล์ Excel ดิบไว้ที่ scratch/04_backup_before_update.xlsx และสำรองฐานข้อมูลเดิมไว้ที่ js/data_wbs.bak_before_update_f4_oct30_morning.js 2) เติมสูตรคอลัมน์ X (% เบิกพัสดุ) และคอลัมน์ Y (% เบิก คชจ.) ในไฟล์ 04 WBS แล้วรันสคริปต์ผสานข้อมูลสร้าง js/data_wbs.js ใหม่ขนาด 2.37 MB (2,480,438 ไบต์) 3) อัปเดตวันที่สถานะ SAP ล่าสุดเป็น 30 ต.ค. 69 ครบทุกจุด: #wbsHeaderDatesPlain, #dataHistoryBadge, .pill-file-04, #wbsKpiSapDateText, .bar-sap-date-plain, หัวคอลัมน์ statusSap (.th-sub-date-text), DATA_SOURCE_CATALOG (src_04), SYSTEM_STORAGE_FILES และผัง Model View 4) อัปเดต Cache Busters เป็น ?v=20261030_0828',
      sourceFile: '04 WBS ZBUDR064 %พัสดุและค่าแรงและสถานะsap.xlsx (แก้ไขล่าสุด 30 ต.ค. 2569, 08:16:07 น. / บันทึกสูตร 08:26:01 น., ขนาด 937.7 KB)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง (อัปเดตสถานะโครงการจริงในระบบ SAP จำนวน 114 โครงการที่เปลี่ยนสถานะ/ปิดงาน CLSD F4 พร้อมอัปเดต % เบิกพัสดุ 81 โครงการ และ % เบิก คชจ. 32 โครงการ)'
    },
    {
      id: 'log_000_floating_target_month_badge_dynamic_bg',
      timestamp: '2026-10-30 08:23:00',
      timestampTh: '30 ต.ค. 2569, 08:23 น.',
      type: 'EDIT',
      typeBadge: 'เปลี่ยนสีพื้นหลังป้ายเดือนในการ์ดลอยตามเดือนที่เลือก',
      badgeClass: 'badge-type-edit',
      title: 'เปลี่ยนสีพื้นหลังป้ายเดือนเป้าหมาย (#wbsFloatingTargetMonth) ในการ์ดลอยสีฟ้า ให้เปลี่ยนสีตรงกับเป้าหมายเดือนที่เลือกปิดงานในแถบลูกศร (รูปที่ 4)',
      targetSubject: 'ป้ายชื่อเดือนเป้าหมายในการ์ดลอย Checkbox (#wbsFloatingTargetMonth, .wbs-floating-target-month, getWbsSelectedTargetMonthInfo, updateWbsFloatingSelection)',
      storageFile: 'css/styles.css, js/wbs.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน: "เปลี่ยนสีพื้นหลัง กรอบสีแดงที่วงไว้ ให้เหมือนกับเป้าหมายเดือนที่เลือกกปิดงานไว้ ตามรููปที่ 4" 1) ปรับปรุงป้ายเดือนเป้าหมาย (#wbsFloatingTargetMonth) ในแถวบนของการ์ดลอยสีฟ้า ให้เปลี่ยนสีพื้นหลังแบบไล่เฉดสีพร้อมขอบสีทอง (#FFD700) และตัวอักษรสีขาวคมชัดตามเดือนเป้าหมายที่กดเลือกในแถบลูกศรโดยอัตโนมัติ (ต.ค. = สีชมพูสดใส, พ.ย. = สีน้ำเงินเข้ม Royal Blue, ธ.ค. = สีฟ้าสว่างไซยาน Cyan/Sky Blue ขอบทองตรงตามรูปที่ 4)',
      details: '1) ใน js/wbs.js: ปรับ getWbsSelectedTargetMonthInfo() ให้คืนค่า segIndex (1, 2, 3, 4) ตรงกับตำแหน่งปุ่มในแถบเลือกเดือนเป้าหมาย และปรับ updateWbsFloatingSelection() ให้อัปเดตคลาส .target-seg-{N} และ .target-m-{M} บน #wbsFloatingTargetMonth ทุกครั้งที่สลับเดือน 2) ใน css/styles.css: กำหนดสีพื้นหลังไล่เฉดของ .wbs-floating-target-month.target-seg-1..4 ให้ตรงกับ .btn-wbs-kpi-month.active.m-seg-1..4 พร้อมขอบทอง #FFD700 และตัวอักษรสีขาวหนา 3) อัปเดต Cache Busters เป็น ?v=20261030_0823 และบันทึก Audit Log ตามข้อกำหนด AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน: "เปลี่ยนสีพื้นหลัง กรอบสีแดงที่วงไว้ ให้เหมือนกับเป้าหมายเดือนที่เลือกกปิดงานไว้ ตามรููปที่ 4"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ช่วยให้สีป้ายเดือนเป้าหมายในการ์ดลอยเชื่อมโยงเป็นสีเดียวกับปุ่มเดือนเป้าหมายที่กำลังเลือกในแถบลูกศรอย่างชัดเจน)'
    },
    {
      id: 'log_000_fix_browser_autofill_search_wbs_zero',
      timestamp: '2026-10-30 08:15:00',
      timestampTh: '30 ต.ค. 2569, 08:15 น.',
      type: 'EDIT',
      typeBadge: 'แก้ไขป้องกัน Browser Autofill ช่องค้นหา',
      badgeClass: 'badge-type-edit',
      title: 'แก้ไขปัญหา Google Chrome Password Manager กรอกคำว่า "ผู้ใช้งานระบบ (User)" อัตโนมัติ (Autofill) ลงในช่องค้นหาจนทำให้งานคงเหลือ WBS = 0',
      targetSubject: 'ช่องค้นหาด่วน (#searchInput), ช่องรหัสผ่าน Admin PIN (#adminPinInput), ช่องผู้ดำเนินการ (#dhInputAuthor)',
      storageFile: 'index.html, css/styles.css, js/app.js, js/wbs.js, js/data_history.js',
      changeSummary: 'ตรวจสอบสาเหตุและแก้ไขถาวรตามแจ้งจากผู้ใช้งาน: "หน้า web งานคงเหลือ WBS = 0 และขึ้นผู้ใช้งาน ต้อง refresh ถึงจะปกติ เกิดอะไรขึ้น" 1) สาเหตุ: Google Chrome Password Manager จดจำค่าเริ่มต้น value="ผู้ใช้งานระบบ (User)" ของช่อง #dhInputAuthor เป็น Username คู่กับรหัสผ่านของ #adminPinInput (type="password") เมื่อเปิดเว็บแล้วคลิกบนหน้าจอ Chrome จึง Autofill คำว่า "ผู้ใช้งานระบบ (User)" ลงในช่องค้นหา #searchInput ที่มองเห็นอยู่ ทำให้ระบบกรองคำค้นดังกล่าวจนเหลืองาน WBS = 0 2) การแก้ไขถาวร 4 ชั้น: เปลี่ยน #searchInput เป็น type="search" พร้อม readonly-until-focus และ autocomplete="off", เปลี่ยน #adminPinInput เป็น type="text" ใช้ CSS text-security: disc เพื่อไม่ให้เบราว์เซอร์ตรวจจับเป็นฟอร์มรหัสผ่าน, นำ static value ออกจาก #dhInputAuthor และเพิ่มระบบดักล้างค่า Autofill แปลกปลอมใน js/app.js และ js/wbs.js',
      details: '1) ใน index.html: เปลี่ยน #searchInput เป็น type="search" พร้อม readonly (ปลดอัตโนมัติเมื่อ focus/mousedown/touchstart) และ autocomplete="off"; เปลี่ยน #adminPinInput เป็น type="text" คลาส .pin-masked เพื่อไม่ให้มี input[type="password"] ใน DOM ตอนโหลดหน้า; นำ static value="ผู้ใช้งานระบบ (User)" ออกจาก #dhInputAuthor 2) ใน css/styles.css: เพิ่ม #adminPinInput.pin-masked { -webkit-text-security: disc !important; } 3) ใน js/app.js และ js/wbs.js: ปรับระบบสลับแสดง/ซ่อนรหัสผ่านรองรับ .pin-masked และเพิ่มตัวกรองล้างค่า Autofill "ผู้ใช้งานระบบ (User)" ออกจากช่องค้นหาทันที 4) อัปเดต Cache Busters เป็น ?v=20261030_0815',
      sourceFile: 'คำสั่งผู้ใช้งาน: "หน้า web งานคงเหลือ WBS = 0 และขึ้นผู้ใช้งาน ต้อง refresh ถึงจะปกติ เกิดอะไรขึ้น"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง (ป้องกันเบราว์เซอร์กรอกชื่อผู้ใช้อัตโนมัติลงในช่องค้นหาจนข้อมูลถูกกรองเหลือ 0 รายการอย่างถาวร)'
    },
    {
      id: 'log_000_remove_admin_pin_display_all',
      timestamp: '2026-10-29 07:52:00',
      timestampTh: '29 ต.ค. 2569, 07:52 น.',
      type: 'CONFIG',
      typeBadge: 'ซ่อนรหัสผ่านไม่ให้แสดงบนหน้าจอทั้งหมด',
      badgeClass: 'badge-type-config',
      title: 'นำตัวเลขรหัสผ่าน Admin PIN ที่แสดงในหน้าต่างยืนยันสิทธิ์และป้าย Tooltip ออกทั้งหมด เพื่อไม่ให้แสดงรหัสผ่านบนหน้าจอ',
      targetSubject: 'หน้าต่างยืนยันสิทธิ์ผู้ดูแลระบบ (#adminPinModal, #adminPinDesc), ปุ่มและป้ายล็อค 3 เมนู (#btnToggleNavTabsLock, .nav-tab-lock-badge)',
      storageFile: 'js/app.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน: "รหัสผ่านเอาออกทั้งหมด ไม่ต้องแสดง" พร้อมภาพหน้าต่างยืนยันสิทธิ์ผู้ดูแลระบบ (Admin): 1) นำตัวเลขรหัสผ่านในวงเล็บออกจากข้อความคำอธิบายในหน้าต่าง #adminPinModal คงเหลือเฉพาะข้อความ "กรุณากรอกรหัสผ่าน Admin PIN เพื่อปลดล็อกการเข้าถึง..." 2) นำตัวเลขรหัสผ่านออกจาก Tooltip (title) ของปุ่มล็อค 3 เมนู (#btnToggleNavTabsLock) และป้ายล็อคแท็บเมนูทั้ง 3 แท็บใน index.html และ js/app.js รวมถึงข้อความในประวัติข้อมูลทั้งหมด',
      details: '1) ใน js/app.js: แก้ไขข้อความใน openAdminPinModal() บริบท nav_tabs / nav_lock จาก "Admin PIN (...)" เป็น "Admin PIN" โดยไม่แสดงตัวเลขรหัสผ่าน และแก้ไข btn.title ใน updateNavTabsLockUI() ไม่ให้แสดงรหัสผ่าน 2) ใน index.html: แก้ไข title ของ #navTabBtnAnalytics, #navTabBtnWarning, #navTabBtnDataHistory, .nav-tab-lock-badge และ #btnToggleNavTabsLock ให้แสดงเฉพาะ "(ต้องใช้รหัส Admin PIN)" โดยไม่มีตัวเลขรหัสผ่าน 3) ใน js/data_history.js: นำตัวเลขรหัสผ่านออกจากข้อความแสดงผลทั้งหมดและบันทึก Audit Log พร้อมอัปเดต Cache Busters เป็น ?v=20261029_0752',
      sourceFile: 'คำสั่งผู้ใช้งาน: "รหัสผ่านเอาออกทั้งหมด ไม่ต้องแสดง"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ยกระดับความปลอดภัยสูงสุดโดยไม่แสดงตัวเลขรหัสผ่าน Admin PIN บนหน้าจอหรือ Tooltip ใดๆ)'
    },
    {
      id: 'log_000_target_card_criteria_1_1_to_5_full_filter_and_kpi_badge_clean',
      timestamp: '2026-10-27 16:05:00',
      timestampTh: '27 ต.ค. 2569, 16:05 น.',
      type: 'FEAT',
      typeBadge: 'เกณฑ์ 1.1 - 5 ครบตามตัวกรอง',
      badgeClass: 'badge-type-config',
      title: 'ปรับปรุงแผงตั้งค่า +5% คงเหลือ ให้แสดงเกณฑ์วัดครบ 10 ข้อ (ข้อ 1.1 - 5) ตามตัวกรอง และปรับป้ายให้แสดง "KPI ระดับ 5" เดี่ยวๆ เอาวงเล็บ (....) ออก',
      targetSubject: 'แผงตั้งค่า +5% คงเหลือ (.next3m-config-panel-card, .next3m-config-body) และป้ายหัวข้อเป้าหมาย (#next3mSingleBarKpiBadge)',
      storageFile: 'js/app.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน 2 ข้อ: 1) "ให้แก้ไข แสดงเกณวัด ข้อ 1.1 - 5 ตามตัวกรองให้ครบ": ขยายรายการในแผง "⚙️ ตั้งค่า +5% คงเหลือ" จากเดิม 5 กลุ่ม เป็น 10 เกณฑ์วัดครบถ้วนตามตัวกรอง (ข้อ 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 4, 5) พร้อมปรับป้ายหัวข้อเป็นการ์ด "เกณฑ์ 1.1 - 5" และรองรับ Custom Scrollbar ในแผง 2) "ถ้าไม่ +5% หรือ +5% ไม่ต้องแสดง // ให้แสดง KPI ระดับ 5 อย่างเดียว ไม่ต้องแสดง (....) เฉพาะหน้านี้เท่านั้น" และ "เอาออก" (ขีดฆ่า (กำหนดเอง)): ปรับป้าย #next3mSingleBarKpiBadge ให้แสดงข้อความคงที่ "KPI ระดับ 5" เสมอ ไม่ต่อท้าย (+5%), (ไม่บวก 5%), หรือ (กำหนดเอง)',
      details: '1) ใน js/app.js: กำหนดอาเรย์ TARGET_FIVE_PCT_ITEMS ครบ 10 เกณฑ์วัด (ข้อ 1.1 ถึง ข้อ 5) พร้อมคีย์, ชื่อสั้น, ชนิดหน่วยวัด (มูลค่า/งาน); ปรับปรุง getDefaultTargetFivePctConfig(), loadTargetFivePctConfig(), isTargetFivePctEnabled(), renderTargetFivePctConfigCard(), handleTargetFivePctCheckboxChange() และ setAllTargetFivePct() ให้รองรับทั้ง 10 คีย์และคงความเข้ากันได้กับข้อมูลบันทึกเดิม; เชื่อมโยง isCritFivePctActive() เข้ากับการคำนวณเป้าหมายรายเดือนใน renderNext3MonthsProjection(); แก้ไข singleBarKpiBadgeText ให้แสดงคงที่เป็น "KPI ระดับ 5" โดยตัดส่วนต่อท้ายในวงเล็บ (....) ออกทั้งหมด 2) ใน css/styles.css: เพิ่ม max-height: 275px; overflow-y: auto; พร้อมแต่งแถบเลื่อน scrollbar สไตล์ทองนีออน และปรับขนาด padding แถวให้กระชับพอดีกับการแสดง 10 เกณฑ์ 3) ใน index.html: อัปเดต Cache Busters เป็น ?v=20261027_1605 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน: "ให้แก้ไข แสดงเกณวัด ข้อ 1.1 - 5 ตามตัวกรองให้ครบ", "ถ้าไม่ +5% หรือ +5% ไม่ต้องแสดง // ให้แสดง KPI ระดับ 5 อย่างเดียว ไม่ต้องแสดง (....) เฉพาะหน้านี้เท่านั้น", และภาพขีดฆ่า "KPI ระดับ 5 (กำหนดเอง)" พร้อมระบุ "เอาออก"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง (ขยายความสามารถในการเลือกเปิด/ปิดบัฟเฟอร์ 5% คงเหลือได้ละเอียดระดับ 10 เกณฑ์วัด พร้อมปรับแต่งความเรียบร้อยของป้ายหัวข้อเป้าหมายตามความต้องการ)'
    },
    {
      id: 'log_000_wbs_target_marker_pea_driver_gold_flag_hoist',
      timestamp: '2026-10-27 15:45:00',
      timestampTh: '27 ต.ค. 2569, 15:45 น.',
      type: 'FEAT',
      typeBadge: 'เปลี่ยนหลอดไฟเป็นคนขับรถชักธงสีทอง',
      badgeClass: 'badge-type-config',
      title: 'เปลี่ยนหลอดไฟที่เส้นเป้าหมาย เป็นคนขับรถวิ่งของ % มูลค่าปิดงาน (น้องสว่าง กฟภ.) ชักธงสีทอง บ่งบอกประสบความสำเร็จ',
      targetSubject: 'เส้นเป้าหมาย KPI ระดับ 5 ในการ์ดเปรียบเทียบ WBS (.target-marker-line, .pea-victory-hoist-wrapper, .pea-gold-flagpole, .pea-gold-flag-banner, .pea-flag-driver-mascot)',
      storageFile: 'css/styles.css, js/wbs.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน: "ให้เปลี่ยนหลอดไฟ คนที่ขับรถวิ่งของ%มูลค่าปิดงาน และ ชักธง สีทอง บ่งบอก ประสบความสำเร็จ" พร้อมภาพวงกลมสีแดงที่หลอดไฟบนเส้นเป้าหมาย: 1) ซ่อนหลอดไฟเดิม (.target-marker-beam::after) 2) เพิ่มเสาธงสีทอง (.pea-gold-flagpole) พร้อมลูกแก้วยอดเสาและประกายวิ้ง 3) เพิ่มผืนธงสีทองริ้วไหม (.pea-gold-flag-banner) โบกสะบัด wave animation ชักธงขึ้นสู่ยอดเสา มีตราดาว 5 แฉก KPI 5 4) เพิ่มตัวการ์ตูนน้องสว่าง กฟภ. (คนขับรถที่วิ่งบนแถบ % มูลค่าปิดงาน) สวมหมวกนิรภัย กฟภ. ยืนสาวเชือกชักธงและชูมือ OK ฉลองชัย 5) ป้ายริบบิ้นสีทอง "ประสบความสำเร็จ!" (หรือ "เป้าหมายความสำเร็จ") 6) รองรับการพลิกธงสะบัดเข้าด้านในอัตโนมัติ (.align-inward) เมื่อเป้าหมายอยู่ชิดขอบขวา',
      details: '1) ใน css/styles.css: ซ่อน .target-marker-beam::after (หลอดไฟเดิม); สร้างคลาส .pea-victory-hoist-wrapper, .pea-gold-flagpole, .pea-flagpole-finial, .pea-gold-flag-banner, .pea-gold-flag-svg, .pea-flag-rope, .pea-flag-driver-mascot, .pea-victory-badge พร้อมคีย์เฟรมแอนิเมชัน goldFlagFlutter, goldFlagFlutterFast, goldFlagFlutterInward, driverMascotBob, driverMascotCheer, flagSparkleTwinkle, victoryBadgePulse 2) ใน js/wbs.js: ในฟังก์ชัน renderComparisonCard() เพิ่มการคำนวณ flagAlignClass (targetBarPct > 82 ? align-inward : align-standard) และแทรกโครงสร้าง SVG Vector น้องสว่าง กฟภ. ชักธงสีทองลงใน .target-marker-line แทนหลอดไฟเดิม 3) ใน index.html: อัปเดต Cache Buster เป็น ?v=20261027_1545 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน: "ให้เปลี่ยนหลอดไฟ คนที่ขับรถวิ่งของ%มูลค่าปิดงาน และ ชักธง สีทอง บ่งบอก ประสบความสำเร็จ" พร้อมภาพวงกลมสีแดงที่หลอดไฟบนเส้นเป้าหมาย',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงกราฟิกและแอนิเมชันเส้นเป้าหมาย WBS ให้สื่อความหมายความสำเร็จด้วยมาสคอต กฟภ. และธงทองโบกสะบัดอย่างสวยงามทรงพลัง)'
    },
    {
      id: 'log_000_target_card_five_pct_buffer_config_yellow_panel',
      timestamp: '2026-10-27 15:15:00',
      timestampTh: '27 ต.ค. 2569, 15:15 น.',
      type: 'FEAT',
      typeBadge: 'ตั้งค่า +5% คงเหลือ การ์ดเป้าหมาย',
      badgeClass: 'badge-type-config',
      title: 'เพิ่มการตั้งค่า +5% คงเหลือ ในการ์ดเป้าหมาย: แสดงแผงเลือกเกณฑ์ 1 - 5 ในตำแหน่งกรอบเหลือง พร้อมปุ่ม Save จำค่าถาวร และปรับปรุงการแสดงผลให้เปลี่ยนตามที่เลือก',
      targetSubject: 'การ์ดเป้าหมายที่ต้องปิดงานเพิ่ม (#next3mCardsContainer, .next3m-config-panel-card, #next3mSingleBarKpiBadge)',
      storageFile: 'css/styles.css, js/app.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน 4 ข้อ: 1) "+5% คงเหลือ ให้เปลี่ยน แบบเลือก หรือไม่เลือก +5%": รองรับการเปิด/ปิดคำนวณบวก 5% ของคงเหลือเพิ่ม หรือคิดตามเป้าหมายระดับ 5 ปกติ 2) "ให้แสดงการเลือกทุกเกณวัด ข้อ 1 - 5 บริเวณตำแหน่งกรอบเหลือง": เพิ่มแผงตั้งค่าการ์ดที่ 4 ในกริดถัดจาก 3 เดือน พร้อม Checkbox และป้ายสถานะแยกเกณฑ์ข้อ 1 - 5 3) "มีปุ่ม save จำค่าไว้ตลอด": มีปุ่มบันทึกการตั้งค่า (Save) บันทึกลงใน localStorage (PEA_AUC_TARGET_FIVE_PERCENT_CONFIG_V1) จำค่าถาวรข้ามเซสชัน 4) "การแสดง +5% ให้เปลี่ยนตามที่เลือกไว้ด้วย": ป้าย KPI ระดับ 5, ป้ายกำกับบนการ์ด, แถบที่มาของค่า (+5% ของคงเหลือ vs 0 ไม่บวก 5%), สูตรแทนค่าสมการ และยอดปิดเพิ่มของทั้ง 3 เดือน ปรับเปลี่ยนตามที่เลือกทันที',
      details: '1) ใน css/styles.css: ออกแบบสไตล์ .next3m-config-panel-card ในตำแหน่งกรอบเหลือง ขอบสีทองนีออน (#FDE047), หัวข้อ, รายการเกณฑ์ 1 - 5 พร้อม checkbox, ป้าย +5%/+0% (.badge-five-pct), ปุ่มเลือกทั้งหมด/ไม่เลือก, ปุ่ม Save สีทอง PEA ไล่เฉด (#FFB81C -> #F59E0B) พร้อมสถานะบันทึกสำเร็จสีเขียว 2) ใน js/app.js: สร้างฟังก์ชัน getDefaultTargetFivePctConfig, loadTargetFivePctConfig, saveTargetFivePctConfig, getTargetFivePctConfig, และ renderTargetFivePctConfigCard; ปรับปรุงสูตรคำนวณใน renderNext3MonthsProjection() ให้คูณอัตรา buffer (0.05 หรือ 0) ตามเกณฑ์ที่เปิด/ปิด; อัปเดตการแสดงผลใน targetChipHtml, valCalcBoxHtml, jobCalcBoxHtml, สูตรแทนค่าสมการ (ตัดพจน์บวก 5% ออกเมื่อไม่ได้เลือก); ปรับปรุงป้าย #next3mSingleBarKpiBadge และ tooltip ของกราฟแนวนอนให้สะท้อนสถานะ +5% แบบไดนามิก; เพิ่มฟังก์ชัน handleTargetFivePctCheckboxChange, setAllTargetFivePct, saveTargetFivePctConfigFromUI 3) ใน index.html: อัปเดต Cache Buster เป็น ?v=20261027_1515 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน: "ในเมนู การ์ดเป้าหมาย ให้เพิ่มดังนี้ 1. +5% คงเหลือ ให้เปลี่ยน แบบเลือก หรือไม่เลือก +5% 2..ให้แสดงการเลือกทุกเกณวัด ข้อ 1 - 5 บริเวณตำแหน่งกรอบเหลือง 3.มีปุ่ม save จำค่าไว้ตลอด 4.การแสดง +5% ให้เปลี่ยนตามที่เลือกไว้ด้วย" พร้อมภาพประกอบตีกรอบเหลืองตำแหน่งการ์ดที่ 4 และกรอบขาวที่ +5%',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง (เพิ่มฟีเจอร์การปรับแต่งค่าเป้าหมายและบัฟเฟอร์ 5% คงเหลืออย่างยืดหยุ่น จำค่าถาวร และสะท้อนผลการคำนวณแบบเรียลไทม์)'
    },
    {
      id: 'log_000_wbs_pea_ev_runner_criteria_based',
      timestamp: '2026-10-27 14:55:00',
      timestampTh: '27 ต.ค. 2569, 14:55 น.',
      type: 'FEAT',
      typeBadge: 'รถวิ่งตามเกณฑ์ที่เลือก',
      badgeClass: 'badge-type-config',
      title: 'ปรับปรุงรถบริการเคลื่อนที่ กฟภ. (PEA EV Runner) ให้เคลื่อนไหววิ่งตามเกณฑ์วัดที่เลือกอย่างถูกต้อง (ข้อ 1,2,5 วิ่งบนแถบมูลค่า / ข้อ 3,4 วิ่งบนแถบจำนวนงาน)',
      targetSubject: 'รถวิ่งบนแถบความก้าวหน้า WBS (.pea-ev-runner, #wbsBarMainComposite, #wbsBarJobComposite)',
      storageFile: 'css/styles.css, js/wbs.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "รถวิ่งตามเกณที่เลือก" พร้อมภาพวงกลมสีแดงที่ตัวรถทั้งสองแถบ: 1) แก้ไขปัญหาตัวรถค้างนิ่งอยู่ที่ 0% โดยนำสไตล์ inline display: block ออก 2) ปรับปรุง CSS ให้รองรับ .progress-fill-composite.running สำหรับแอนิเมชันรถวิ่ง peaCarDriveAcross 3) เพิ่มฟังก์ชันตรวจสอบเกณฑ์วัด isJobBasedCriteria() ใน syncWbsSideKpiCard: เกณฑ์วัดข้อ 1, 2, 5 หรือเลือกทั้งหมด (ALL) ให้รถวิ่งบนแถบ "% ปิดงานมูลค่า AUC" ส่วนเกณฑ์วัดข้อ 3 (3.1, 3.2, 3.3 TECO) หรือข้อ 4 (C02.2) ให้รถวิ่งบนแถบ "% ปิดจำนวนงาน" 4) ซ่อนตัวรถบนแถบที่ไม่ได้ใช้งานอย่างเรียบร้อย',
      details: '1) ใน css/styles.css: เพิ่มกฎ .progress-fill-composite.running .pea-ev-runner { display: block !important; animation: peaCarDriveAcross 3s ...; } และกำหนดให้ซ่อนเมื่อไม่มีคลาส .running หรือ width: 0% 2) ใน js/wbs.js: นำ style="display: block;" ออกจากแท็ก .pea-ev-runner ในเทมเพลต และในฟังก์ชัน syncWbsSideKpiCard() เพิ่มการคำนวณ isJobBasedCriteria() เพื่อสลับคลาส .running ให้ wbsBarMainComposite และ wbsBarJobComposite ตามเกณฑ์วัดที่เลือก 3) ใน index.html: อัปเดต Cache Buster เป็น ?v=20261027_1455 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน: "รถวิ่งตามเกณที่เลือก" พร้อมภาพวงกลมสีแดงเน้นรถทั้งสองแถบ',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (แก้ไขแอนิเมชันให้รถเคลื่อนไหวสอดคล้องกับเกณฑ์วัดที่กำลังประเมินผลอย่างถูกต้องและมีชีวิตชีวา)'
    },
    {
      id: 'log_000_remove_header_import_button',
      timestamp: '2026-10-27 14:45:00',
      timestampTh: '27 ต.ค. 2569, 14:45 น.',
      type: 'EDIT',
      typeBadge: 'นำปุ่มนำเข้าข้อมูลออก',
      badgeClass: 'badge-type-edit',
      title: 'นำปุ่ม "นำเข้าข้อมูล" ออกจากแถบ Header Action Bar ด้านบน ตามคำสั่งผู้ใช้งาน',
      targetSubject: 'ปุ่มนำเข้าข้อมูลใน Header (.header-actions > .btn-outline)',
      storageFile: 'index.html, js/data_history.js',
      changeSummary: 'ดำเนินการนำปุ่ม "นำเข้าข้อมูล" ออกจากแถบเมนูด้านบน Header ตามภาพคำสั่งผู้ใช้งาน โดยยังคงอินพุตซ่อนไว้เพื่อป้องกันข้อผิดพลาดในการอ้างอิงของสคริปต์พื้นหลัง',
      details: '1) ใน index.html: นำแท็ก <button class="btn btn-outline" onclick="document.getElementById(\'excelFileInput\').click()">...<span>นำเข้าข้อมูล</span></button> ออกจาก .header-actions 2) อัปเดต Cache Buster เป็น ?v=20261027_1445 3) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน: "เอาออก" พร้อมภาพปุ่มนำเข้าข้อมูล',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'น้อย (ปรับแต่งความกระชับของปุ่มบน Header ตามความต้องการใช้งาน)'
    },
    {
      id: 'log_000_adjust_wbs_metric_card_font_sizes',
      timestamp: '2026-10-27 14:42:00',
      timestampTh: '27 ต.ค. 2569, 14:42 น.',
      type: 'EDIT',
      typeBadge: 'ปรับขนาดฟอนต์การ์ดสรุป',
      badgeClass: 'badge-type-edit',
      title: 'ปรับขนาดตัวอักษรในการ์ดสรุป WBS (ลดขนาดตัวเลขมูลค่าเต็มในกรอบแดง และเพิ่มขนาดตัวเลขสรุปงาน/ล้านบาทในกรอบเหลือง)',
      targetSubject: 'การ์ดสรุปมูลค่า WBS (.wbs-metric-card-box, .wbs-val-number, .wbs-card-metric-job-badge, .wbs-val-mb-pill)',
      storageFile: 'css/styles.css, js/wbs.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "กรอบแดง ลดขนาดอักษร และเพิ่มขนาดในกรอบเหลืองแทน": 1) ลดขนาดฟอนต์ตัวเลขมูลค่าเต็มบาท (.wbs-val-number) จาก 0.74rem เหลือ 0.63rem (กรอบแดง) 2) เพิ่มขนาดฟอนต์ป้ายจำนวนงาน (.wbs-card-metric-job-badge) จาก 0.63rem เป็น 0.78rem และตัวเลขหนา 0.82rem (กรอบเหลืองบน) 3) เพิ่มขนาดฟอนต์ป้ายมูลค่าล้านบาท (.wbs-val-mb-pill) จาก 0.58rem เป็น 0.76rem (กรอบเหลืองล่าง) 4) ห่อหุ้ม .wbs-val-main-group เพื่อจัดตำแหน่งซ้าย-ขวาอย่างสวยงาม',
      details: '1) ใน css/styles.css: ปรับ .wbs-val-number font-size: 0.63rem;, .wbs-val-prefix font-size: 0.60rem;, .wbs-card-metric-job-badge font-size: 0.78rem; padding: 2px 7px;, .wbs-card-metric-job-badge strong font-size: 0.82rem;, .wbs-val-mb-pill font-size: 0.76rem; padding: 2px 6px; 2) ใน js/wbs.js: เพิ่มโครงสร้างครอบ <div class="wbs-val-main-group"> ในเทมเพลต และปรับขนาด font-size ของ .val-selected-pill และ .badge-selected-pill เป็น 0.72rem 3) ใน index.html: อัปเดต Cache Buster เป็น ?v=20261027_1445 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน: "กรอบแดง ลดขนาดอักษร และเพิ่มขนาดในกรอบเหลืองแทน" พร้อมภาพเน้นกรอบแดง/เหลือง',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงลำดับชั้นสายตา Visual Hierarchy ให้อ่านตัวเลขสรุปผู้บริหารได้ชัดเจนและสบายตาขึ้น)'
    },
    {
      id: 'log_000_fix_pointer_menu_zindex_overlap',
      timestamp: '2026-10-27 14:35:00',
      timestampTh: '27 ต.ค. 2569, 14:35 น.',
      type: 'EDIT',
      typeBadge: 'แก้ไขเมนูพอยน์เตอร์โดนบัง',
      badgeClass: 'badge-type-edit',
      title: 'แก้ไขลำดับเลเยอร์ (z-index & Stacking Context) เมนูพอยน์เตอร์นำเสนอ ให้ลอยเด่นอยู่เหนือแถบตัวกรองและแท็บทั้งหมด ไม่โดนบัง',
      targetSubject: 'เมนูตัวเลือกพอยน์เตอร์นำเสนอ (#presenterPointerMenu, #presenterPointerWidget, .app-header)',
      storageFile: 'css/styles.css, js/presentation_pointer.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการแก้ไขตามคำสั่งผู้ใช้งาน "เมนู pointer โดนตัวกรอง บัง ให้แก้ไข": 1) ปรับ .app-header เป็น position: relative; z-index: 1000 เพื่อยกระดับ Stacking Context ให้อยู่เหนือ .top-sticky-filter-bar (z-index: 95) และ .nav-tabs-bar 2) ปรับ .header-actions เป็น z-index: 1005 3) ปรับ .presenter-pointer-widget เป็น z-index: 10020 (เมื่อเปิดเมนูเป็น 10050) 4) กำหนด .presenter-pointer-menu ให้มี z-index: 10060 พร้อม max-width และกล่องเลเยอร์ลอยสมบูรณ์แบบ 5) ปรับปรุงโค้ดเปิด/ปิดเมนูให้สลับคลาส menu-active อัตโนมัติ',
      details: '1) ใน css/styles.css: แก้ไข .app-header จาก position: static เป็น position: relative; z-index: 1000; ทำให้ลูกๆ ใน Header ที่เปิด Dropdown ไม่ถูกกลืนลงใต้ .top-sticky-filter-bar และ .nav-tabs-bar ที่มี backdrop-filter / z-index: 95 2) เพิ่ม position: relative; z-index: 1005; ให้ .header-actions 3) กำหนด z-index: 10020 ให้ .presenter-pointer-widget และเพิ่มสถานะ .menu-active { z-index: 10050; } 4) กำหนด .presenter-pointer-menu เป็น z-index: 10060 และ max-width: calc(100vw - 24px) 5) ใน js/presentation_pointer.js: ใน openPointerMenu() และ closePointerMenu() เพิ่มการสลับคลาส .menu-active บน #presenterPointerWidget 6) ใน index.html: อัปเดต Cache Buster เป็น ?v=20261027_1435',
      sourceFile: 'คำสั่งผู้ใช้งาน: "เมนู pointer โดนตัวกรอง บัง ให้แก้ไข" พร้อมภาพหน้าจอที่เมนูถูกแถบตัวกรองทับ',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (แก้ไขการแสดงผล UI เมนูพอยน์เตอร์ให้ใช้งานได้สะดวก ไม่ถูกแถบตัวกรองบังตัวเลือก)'
    },
    {
      id: 'log_000_draggable_wbs_floating_selection_card',
      timestamp: '2026-10-27 14:20:00',
      timestampTh: '27 ต.ค. 2569, 14:20 น.',
      type: 'FEAT',
      typeBadge: 'การ์ดสีฟ้าลากย้ายตำแหน่งได้',
      badgeClass: 'badge-type-config',
      title: 'เพิ่มฟังก์ชันให้การ์ดสรุปรายการที่เลือกสีฟ้าบนตาราง WBS สามารถคลิกลากแล้วย้ายตำแหน่งได้อย่างอิสระ (Draggable Floating Card)',
      targetSubject: 'การ์ดสรุปรายการเลือกสีฟ้า (#wbsTableFloatingSelection, .wbs-floating-sel-card) บนตาราง WBS',
      storageFile: 'js/wbs.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "การ์ดสีฟ้า เพิ่มฟังกชันการ ลากแล้วย้ายตำแหน่งตามที่ต้องการเองได้": 1) เพิ่มระบบ Pointer Events Drag & Drop ให้ผู้ใช้งานสามารถคลิกลากการ์ดสีฟ้าไปวางตำแหน่งใดก็ได้บนหน้าตาราง 2) มีขอบเขตจำกัดความปลอดภัยไม่ให้หลุดออกนอกกรอบตาราง 3) จดจำตำแหน่งที่ย้ายไว้ใน localStorage (AUC_WBS_FLOATING_CARD_POS_V1) 4) รองรับการดับเบิลคลิกเพื่อรีเซ็ตตำแหน่งกลับมุมขวาล่าง 5) เพิ่มไอคอน Grip "⋮⋮" และสถานะเคอร์เซอร์ grab / grabbing',
      details: '1) ใน js/wbs.js: สร้างฟังก์ชัน initDraggableFloatingCard() ดักจับ pointerdown, pointermove, pointerup, pointercancel, ดึงค่าตำแหน่งจาก localStorage เมื่อเริ่มต้น, บันทึกพิกัดใหม่เมื่อปล่อยเมาส์, ป้องกันไม่ให้การคลิกปุ่ม "ล้าง" ไปกระตุ้นการลาก, และสร้างฟังก์ชัน resetFloatingCardPosition() 2) ใน css/styles.css: กำหนด cursor: grab, touch-action: none, สไตล์ .is-dragging (cursor: grabbing, scale(1.02), เพิ่มเงาความลึก), และสไตล์ .wbs-floating-drag-grip 3) ใน index.html: เพิ่มไอคอน Grip "⋮⋮" ในส่วนหัวการ์ด พร้อมคำอธิบาย Tooltip 4) ใน js/data_history.js: บันทึกประวัติการแก้ไขลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน: "การ์ดสีฟ้า เพิ่มฟังกชันการ ลากแล้วย้ายตำแหน่งตามที่ต้องการเองได้" พร้อมภาพแคปเจอร์การ์ดสีฟ้า',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (เพิ่มความยืดหยุ่นในการดูข้อมูลตาราง ผู้ใช้สามารถย้ายการ์ดหลบแถวหรือคอลัมน์ที่ต้องการอ่านได้ตามใจชอบ)'
    },
    {
      id: 'log_000_remove_green_wash_box_closed',
      timestamp: '2026-10-27 14:15:00',
      timestampTh: '27 ต.ค. 2569, 14:15 น.',
      type: 'EDIT',
      typeBadge: 'เอาสีเขียวที่คลุมการ์ดออก',
      badgeClass: 'badge-type-edit',
      title: 'นำสีเขียวที่คลุมการ์ดมูลค่าปิดงานแล้ว (Green Background & Shadow) ออกเพื่อเพิ่มความคมชัดในการอ่าน',
      targetSubject: 'การ์ดสรุปผู้บริหาร WBS ฝั่งซ้าย (.wbs-metric-card-box.box-closed)',
      storageFile: 'css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "เอาสีเขียวที่คลุม การ์ดออก เนื่องจากมองไม่ชัดเจน": 1) นำพื้นหลังสีเขียวเข้ม (green gradient) และเงาเรืองแสงสีเขียว (box-shadow neon green) ออกจากการ์ด .wbs-metric-card-box.box-closed ทั้งหมด 2) ปรับพื้นหลังเป็นการ์ดมืดโปร่งใสเรียบหรู (linear-gradient dark) สอดคล้องกับการ์ดด้านบน 3) ปรับสีตัวเลขให้คมชัดไม่ฟุ้ง และปรับป้ายจำนวนงาน/ล้านบาทเป็นพื้นหลังเข้มสบายตา ช่วยให้อ่านตัวเลขมูลค่าและส่วนที่เลือกสีฟ้าได้อย่างชัดเจน 100%',
      details: '1) ใน css/styles.css: แก้ไข .wbs-metric-card-box.box-closed โดยเปลี่ยน background เป็น linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(30, 9, 50, 0.65) 100%), เปลี่ยน border เป็น 1px solid rgba(255, 255, 255, 0.12) พร้อมแถบซ้าย border-left: 3.5px solid #10B981, ปรับ box-shadow เป็น none, ปรับ .wbs-val-number.text-success ให้มี text-shadow คมชัดไม่ฟุ้งเบลอ, และปรับพื้นหลัง .wbs-card-metric-job-badge.badge-green กับ .wbs-val-mb-pill.pill-green ให้เป็นสีเข้มโปร่งใส 2) ใน index.html: อัปเดต Version Cache Buster เป็น ?v=20261027_1415 3) บันทึกประวัติการแก้ไขลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน: "เอาสีเขียวที่คลุม การ์ดออก เนื่องจากมองไม่ชัดเจน" พร้อมภาพ media_1793082920815.jpg',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงคอนทราสต์และความคมชัดของการ์ดสรุปมูลค่าปิดงานแล้ว ให้อ่านง่าย ชัดเจน สบายตา ไม่กลืนกับพื้นหลัง)'
    },
    {
      id: 'log_000_solid_red_point_and_remove_theme_toggle',
      timestamp: '2026-10-27 14:08:00',
      timestampTh: '27 ต.ค. 2569, 14:08 น.',
      type: 'EDIT',
      typeBadge: 'เพิ่มพอยน์เตอร์จุดแดงทึบและนำปุ่มสลับธีมออก',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มรูปแบบพอยน์เตอร์วงกลมสีแดงทึบ (Solid Red Point) และนำปุ่มสลับโหมดมืด/สว่างออกจาก Header ตามคำสั่งผู้ใช้งาน',
      targetSubject: 'โมดูลพอยน์เตอร์นำเสนอ (#presenterPointerWidget) และแถบ Action Bar บน Header',
      storageFile: 'js/presentation_pointer.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: '1) เพิ่มตัวเลือกพอยน์เตอร์รูปแบบ "จุดแดงทึบ (Solid Red Point)" วงกลมสีแดงสดทึบ 100% พร้อมขอบขาวคมชัดและเงาตกกระทบ เพื่อใช้ชี้เน้นตำแหน่งในการนำเสนอได้อย่างชัดเจนบนทุกพื้นหลัง 2) นำปุ่มสลับโหมดมืด/สว่าง (#btnThemeToggle) ออกจาก Header Action Bar ตามความต้องการของผู้ใช้',
      details: '1) ใน js/presentation_pointer.js: เพิ่มโหมด red-solid ใน MODES, เพิ่ม <div class="pointer-solid-red"></div> ใน #presenterPointerDot, และรองรับ body class pointer-mode-red-solid 2) ใน css/styles.css: กำหนดสไตล์ .presenter-pointer-dot.mode-red-solid .pointer-solid-red ขนาด 18px สีแดงสดทึบ (#EF4444) ขอบขาว 2px, คลื่นแสงคลิก ripple-red-solid, และซ่อนเคอร์เซอร์เมาส์ปกติ 3) ใน index.html: เพิ่มตัวเลือก "จุดแดงทึบ (Solid Red Point)" ไว้บนสุดในเมนูดรอปดาวน์ และลบปุ่ม #btnThemeToggle ออกจาก Header 4) บันทึกประวัติการแก้ไขลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน: "เพิ่ม point สีแดง วงกลมทึบแดง" และ "ปุ่ม สลับมืด/สว่าง เอาออก"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงรูปแบบตัวชี้ตามคำขอ และลดความซ้ำซ้อนของปุ่มบนแถบ Header)'
    },
    {
      id: 'log_000_presentation_pointer_widget',
      timestamp: '2026-10-27 13:55:00',
      timestampTh: '27 ต.ค. 2569, 13:55 น.',
      type: 'FEAT',
      typeBadge: 'ฟีเจอร์พอยน์เตอร์นำเสนอ',
      badgeClass: 'badge-type-config',
      title: 'สร้างปุ่มกดเลือกรูปแบบ Pointer แทนเมาส์เดิม เพื่อใช้ประกอบการบรรยายและนำเสนอผลงาน (Presentation Pointer)',
      targetSubject: 'แถบส่วนหัว Header (#presenterPointerWidget) และการแสดงผลเคอร์เซอร์พอยน์เตอร์ทั่วทั้งหน้าจอแดชบอร์ด',
      storageFile: 'js/presentation_pointer.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'สร้างปุ่มเลือกรูปแบบพอยน์เตอร์บน Header Action Bar สำหรับการพรีเซนต์งาน โดยมีรูปแบบให้เลือก 6 โหมด: 1) เลเซอร์แดงนีออน (Red Laser) 2) สปอตไลท์ส่องเน้น (Spotlight Focus) 3) วงแหวนนีออนฟ้า (Cyan Halo) 4) เลเซอร์เขียวนีออน (Neon Green) 5) ลูกศรทอง 3D (Executive Gold) 6) เมาส์ปกติ (Default Mouse) พร้อมระบบตรวจจับเมาส์ 60fps และคลื่นแสงวงน้ำ (Click Ripple) เมื่อคลิก',
      details: '1) สร้างโมดูล js/presentation_pointer.js: จัดการเลเยอร์ #presenterPointerDot, #presenterSpotlightOverlay, #presenterActiveFloatingBar, ระบบ throttle ด้วย requestAnimationFrame, ฟังปุ่มคีย์ลัดกด "P" สลับเปิด/ปิดด่วน และ "Esc" คืนเมาส์ปกติ 2) เพิ่มสไตล์ใน css/styles.css: ดีไซน์ปุ่มกดหรูหรา Glassmorphism บน Header, เมนูดรอปดาวน์สวยงาม, แสงนีออน Glow พัลส์, Spotlight ฉากมืดแบบโรงละคร, และคลาสซ่อนเมาส์ระบบ body.pointer-mode-* { cursor: none !important; } 3) ปรับปรุง index.html: เพิ่มโครงสร้าง #presenterPointerWidget ใน .header-actions ก่อนปุ่มสลับธีม และเชื่อมโยงสคริปต์ js/presentation_pointer.js?v=20261027_1355 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อกำหนด AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน: "สร้างปุ่มกดเลือก รูปแบบ pointer แทนเมาส์เดิม เพื่อนำเสนอ"',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง (เพิ่มฟีเจอร์ใหม่สำหรับนำเสนอผลงานและการประชุมผู้บริหาร รองรับการคลิกทุกฟังก์ชันโดยไม่ขัดขวางการทำงานปกติ)'
    },
    {
      id: 'log_000_wbs_closed_card_fit_frame',
      timestamp: '2026-10-27 13:50:00',
      timestampTh: '27 ต.ค. 2569, 13:50 น.',
      type: 'EDIT',
      typeBadge: 'ปรับขนาดข้อความในการ์ดให้พอดี',
      badgeClass: 'badge-type-edit',
      title: 'ปรับขนาดตัวเลขมูลค่า ป้ายจำนวนงาน และความกว้างการ์ดสรุปผู้บริหาร WBS ฝั่งซ้าย ไม่ให้เกินกรอบการ์ดใหญ่',
      targetSubject: 'การ์ดสรุปผู้บริหาร WBS ฝั่งซ้าย (#wbsExecutiveDonutKpiCard, .wbs-side-summary-col, .wbs-metric-card-box.box-closed)',
      storageFile: 'css/styles.css, js/wbs.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ปรับขนาด ไม่ให้เกินกรอบการ์ดใหญ่": 1) ปรับขนาดความกว้างของการ์ดฝั่งซ้าย (.wbs-side-summary-col) เป็น 355px (จากเดิม 335px) เพิ่มพื้นที่รองรับตัวเลขขนาดใหญ่ 2) ปรับขนาดฟอนต์ .wbs-val-number เป็น 0.74rem พร้อม letter-spacing กระชับ 3) ปรับการจัดรูปแบบตัวเลขปิดงานและส่วนที่เลือกให้กะทัดรัด ไม่ทับซ้อนและไม่ล้นกรอบการ์ด 4) ปรับป้ายงาน wbsKpiClosedJobsSubBadge ให้สั้นกระชับเป็น "งาน: X (+Y)" พอดีสวยงาม',
      details: '1) ใน css/styles.css: ปรับ .wbs-side-summary-col ให้มี width: 355px, min-width: 330px, max-width: 370px, ปรับ .wbs-val-line ให้มี gap: 3px และ overflow: hidden, ปรับ .wbs-val-number ให้ font-size: 0.74rem, ปรับ .wbs-val-mb-pill ให้ font-size: 0.58rem, ปรับ .wbs-card-metric-job-badge ให้ font-size: 0.63rem และ padding: 1px 4px 2) ใน js/wbs.js: ปรับปรุง syncWbsSideKpiCard ให้ wbsClosedValMb แสดงตัวเลขส่วนที่เลือกเป็น (+XX.XX) กะทัดรัดด้วยฟอนต์ 0.56rem ไม่พิมพ์ซ้ำหน่วย ลบ. สองครั้ง และปรับ jobBadgeEl ให้แสดงผลแบบกระชับ 3) ใน index.html: อัปเดต Version Cache Buster เป็น ?v=20261027_1350 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน: "ปรับขนาด ไม่ให้เกินกรอบการ์ดใหญ่" (ภาพ media_1793078494921.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (แก้ไขข้อความและตัวเลขในกล่องมูลค่าปิดงานแล้วให้พอดีสมส่วนกับกรอบการ์ด ไม่ล้นกรอบหรือทับซ้อน)'
    },
    {
      id: 'log_000_wbs_floating_selection_blue_cb',
      timestamp: '2026-10-27 13:45:00',
      timestampTh: '27 ต.ค. 2569, 13:45 น.',
      type: 'EDIT',
      typeBadge: 'การ์ดสรุปเลือกบนตารางและเปลี่ยน Checkbox สีฟ้า',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มการ์ดสรุปจำนวนงานและมูลค่า AUC ตามไฟล์ 06 ลอยมุมขวาล่างบนตารางตลอดเวลา พร้อมเปลี่ยนพื้นหลัง Checkbox จากสีม่วงเป็นสีฟ้า',
      targetSubject: 'ตารางข้อมูล WBS (#wbsDataTable, .wbs-table-scroll-wrapper) และ Checkbox เลือกงาน (.wbs-sap-row-cb, #wbsMasterHeaderCb)',
      storageFile: 'css/styles.css, js/wbs.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน 2 ข้ออย่างสมบูรณ์แบบ: 1) เพิ่มการ์ดสรุป #wbsTableFloatingSelection ที่มุมขวาล่าง บนตารางตลอดเวลา (Sticky / Absolute over table) ขนาดกะทัดรัด สวยงาม ใช้พื้นหลัง Gradient สีฟ้า (#0284C7 -> #0EA5E9 -> #0369A1) แสดงจำนวนงานที่เลือก และมูลค่า AUC รวมตามไฟล์ 06 (cn41ActualCost) พร้อมปุ่มล้างรายการที่เลือก 2) เปลี่ยนพื้นหลัง Checkbox ขณะถูกเลือกจากสีม่วง (#A855F7 / #9333EA) เป็นสีฟ้าสดใส (#0284C7) ทั้งในหัวตารางและทุกแถวข้อมูล พร้อมเพิ่มไฮไลท์แถวตารางที่เลือกเป็นสีฟ้าอ่อนสบายตา',
      details: '1) ใน css/styles.css: กำหนด accent-color: #0284C7 !important สำหรับ .wbs-sap-row-cb และ #wbsMasterHeaderCb ทั้งธีมมืดและสว่าง เปลี่ยนพื้นหลัง Checkbox เมื่อเลือกจากสีม่วงเป็นสีฟ้าสดใส, เพิ่มสไตล์แถวตาราง tr.wbs-row-checked ให้มีพื้นหลังสีฟ้าอ่อน rgba(2, 132, 199, 0.09), ออกแบบการ์ดลอย .wbs-table-floating-selection และ .wbs-floating-sel-card พื้นสีฟ้า Gradient หรูหรา ขอบเรืองแสงสีฟ้าและตัวเลขมูลค่าสีทองสว่าง (#FEF08A) 2) ใน index.html: เพิ่มโครงสร้าง DOM #wbsTableFloatingSelection ภายใน .wbs-table-scroll-wrapper มุมขวาล่าง แสดงผลบนตารางตลอดเวลา 3) ใน js/wbs.js: สร้างฟังก์ชัน getWbsSelectedSummary() และ updateWbsFloatingSelection() คำนวณจำนวนงานและผลรวม cn41ActualCost ตามไฟล์ 06 ล่าสุด, ผูกการอัปเดตแบบ Reactive ทันทีที่คลิก Checkbox (toggleWbsRowCheckbox), สลับหน้าตาราง (renderWbsTable), หรือล้างการเลือก (clearWbsCheckboxSelection) 4) ใน index.html: อัปเดต Version Cache Buster เป็น ?v=20261027_1345 5) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน: "1.ที่ เลือกใน checkbox ให้แสดงจำนวนงาน และมูลค่า ตามไฟล์ 06 ในกรอบสีเหลืองมุมขวาด้านล่าง บนตารางตลอด และให้ขนาดพอดีสวยงาม ใช้พื้นสีฟ้า 2.เลือก check box เปลี่ยนพื้นม่วง เป็นพื้นฟ้า" (ภาพ media_1793077797746.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง (เพิ่มการ์ดสรุปรายการเลือก Checkbox แบบลอยบนตารางมุมขวาล่างตลอดเวลา และเปลี่ยนสไตล์ Checkbox เป็นสีฟ้าตามข้อกำหนด)'
    },
    {
      id: 'log_000_wbs_checkbox_selected_cyan_display',
      timestamp: '2026-10-27 11:55:00',
      timestampTh: '27 ต.ค. 2569, 11:55 น.',
      type: 'EDIT',
      typeBadge: 'แสดงส่วนที่เลือกเป็นสีฟ้า',
      badgeClass: 'badge-type-edit',
      title: 'แสดงส่วนที่เลือกจาก Checkbox เป็นสีฟ้าเรืองแสงในส่วนมูลค่าปิดงานแล้ว จำนวนงาน และ % ต่างๆ บนการ์ดผู้บริหาร WBS',
      targetSubject: 'การ์ดผลการดำเนินงานผู้บริหาร WBS ฝั่งซ้าย (#wbsExecutiveDonutKpiCard) และแท่งกราฟปิดงาน/เปอร์เซ็นต์ความก้าวหน้า',
      storageFile: 'css/styles.css, js/wbs.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน: "แสดง ส่วนที่เลือกเป็นสีฟ้า ดังนี้ มูลค่า/จำนวนงาน/%ต่างๆ": 1) มูลค่าปิดงาน: รวมมูลค่าที่เลือก (selectedCheckboxAuc) เข้ากับยอดปิดงานสุทธิ แสดงยอดบวกสีฟ้า (+xx.xx ลบ. ที่เลือก) และแทรกแถว "+ ที่เลือก: xx.xx ลบ." สีฟ้าสดใส พร้อมแท่งเซกเมนต์สีฟ้า (.wbs-seg-selected-closed) 2) จำนวนงาน: รวมจำนวนงานที่เลือก (selectedCheckboxCount) แสดงป้าย (+xx ที่เลือก) ใน badge สีฟ้า และ (xx งาน) ในแถวส่วนที่เลือก 3) % ต่างๆ: คำนวณส่วน % ที่เลือก (+ที่เลือก xx.xx%) ในแท็ก breakdown สีฟ้า และแทรกแท่งเซกเมนต์สีฟ้าเรืองแสงลายทาง (.fill-selected-part) ใน progress-fill-composite ทั้ง % ปิดงานมูลค่า AUC และ % ปิดจำนวนงาน',
      details: '1) ใน css/styles.css: เพิ่มสไตล์ .wbs-seg-selected-closed, .wbs-box-sub-row.row-selected, .val-selected-pill, .badge-selected-pill, .fill-selected-part พร้อมเอฟเฟกต์ pulseCyanGlow เรืองแสงสีฟ้าสดใส (#00E5FF / #0284C7) 2) ใน js/wbs.js: ปรับปรุง renderWbsTargetComparisonSection() เพิ่ม DOM placeholder elements (#wbsClosedSegSelected, #wbsKpiSelectedClosedRow, #wbsBarMainSelectedSeg, #wbsBarJobSelectedSeg) และใน syncWbsSideKpiCard() คำนวณ selectedCheckboxCount, selectedCheckboxAuc, selectedIncPctVal, selectedIncPctJobs แล้วอัปเดตการแสดงผลมูลค่า, จำนวนงาน, แถบกราฟ และ % สุทธิแบบเรียลไทม์เมื่อมีการติ๊ก Checkbox ในตาราง WBS 3) ใน index.html: อัปเดต Version Cache Buster เป็น ?v=20261027_1155 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน: "แสดง ส่วนที่เลือกเป็นสีฟ้า ดังนี้ มูลค่า/จำนวนงาน/%ต่างๆ" (ภาพ media_1793074667061.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง (ยกระดับการ์ด KPI ผู้บริหารฝั่งซ้ายให้ตอบสนองต่อการเลือก Checkbox แสดงมูลค่า จำนวนงาน และ % เพิ่มเติมสีฟ้าแบบไดนามิก)'
    },
    {
      id: 'log_000_dynamic_target_bar_color_and_royal_blue_seg2',
      timestamp: '2026-10-27 11:30:00',
      timestampTh: '27 ต.ค. 2569, 11:30 น.',
      type: 'EDIT',
      typeBadge: 'สีกราฟเป้าหมาย & เปลี่ยนเป็นสีน้ำเงิน',
      badgeClass: 'badge-type-edit',
      title: 'ปรับสีกราฟบนเป้าหมาย WBS ให้เปลี่ยนสีตามเดือนเป้าหมายที่เลือก และเปลี่ยนเซกเมนต์เดือน พ.ย. เป็นสีน้ำเงิน',
      targetSubject: 'การ์ดเปรียบเทียบเป้าหมาย KPI ระดับ 5 (#wbsTargetComparisonCard .fill-target) และเซกเมนต์เดือน พ.ย. (.seg-2, .m-seg-2)',
      storageFile: 'css/styles.css, js/wbs.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน 2 ข้อ: 1) "ยกเลือกสีเขี้นมิ้น ให้ใช้สีนำเงินแทน": ยกเลิกสีเขียวมิ้นต์ในเซกเมนต์เดือน พ.ย. แล้วเปลี่ยนเป็นสีน้ำเงิน (Royal / Deep Blue) ทั้งแท็บ Overview และแท็บ WBS 2) "กรอบแดง ให้แสดงสีกราฟ ตามเป้าหมายที่เลือก": ในการ์ดเปรียบเทียบเป้าหมาย KPI ระดับ 5 เมนู WBS คงเหลือ ปรับแถบแท่งกราฟบน (เป้าหมายปิดเพิ่ม: .wbs-kpi-fill.fill-target) ให้เปลี่ยนสีแบบไดนามิกตามเดือนเป้าหมายที่เลือก โดยเดือน ต.ค. เป็นสีชมพูพาสเทล, เดือน พ.ย. เป็นสีน้ำเงิน, และเดือน ธ.ค. เป็นสีฟ้าสว่าง พร้อมตัวอักษรสีขาวเงาคมชัด',
      details: '1) ใน css/styles.css: ปรับ .single-bar-segment.seg-2, .bar-row-fill.m-2, และ .btn-wbs-kpi-month.m-seg-2 (รวมทั้ง .active) ให้ใช้สีน้ำเงิน Royal Blue (#1E40AF -> #2563EB -> #3B82F6 -> #93C5FD) พร้อม text-shadow มิดไนท์บลูคมชัด, เพิ่มคลาสสีกราฟบนเป้าหมาย .fill-target.target-seg-1 / .target-m-10 (สีชมพูพาสเทล), .fill-target.target-seg-2 / .target-m-11 (สีน้ำเงิน Royal Blue), และ .fill-target.target-seg-3 / .target-m-12 (สีฟ้า Sky Blue) พร้อมจัดสไตล์ตัวหนังสือสีขาวเรืองแสงคมชัด 2) ใน js/wbs.js: กำหนด targetMonthClass จากเดือนที่เลือกและใส่ในคลาสของ .wbs-kpi-fill.fill-target 3) ใน index.html: อัปเดต Version Cache Buster เป็น ?v=20261027_1130 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน: "ยกเลือกสีเขี้นมิ้น ให้ใช้สีนำเงินแทน" และ "กรอบแดง ให้แสดงสีกราฟ ตามเป้าหมายที่เลือก" (ภาพ media_1793074667061.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงการแสดงผลสีกราฟเป้าหมายแบบไดนามิกตรงตามเดือนที่เลือก และปรับโทนสีน้ำเงินตามความต้องการผู้ใช้งาน)'
    },
    {
      id: 'log_000_mint_green_and_fix_overlap_donut_card',
      timestamp: '2026-10-27 11:18:00',
      timestampTh: '27 ต.ค. 2569, 11:18 น.',
      type: 'EDIT',
      typeBadge: 'แก้สีมิ้นต์ & แก้ที่บังกัน',
      badgeClass: 'badge-type-edit',
      title: 'ปรับเซกเมนต์เดือน พ.ย. เป็นสีมิ้นต์สดใส และแก้ไขเลย์เอาต์การ์ดภาพรวมไม่ให้ข้อความทับซ้อนกัน',
      targetSubject: 'การ์ดภาพรวมผู้บริหาร (#executiveDonutKpiCard) และแถบเซกเมนต์เป้าหมาย 3 เดือน (#next3mProjectionSection)',
      storageFile: 'css/styles.css, js/app.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน 2 ข้อ: 1) "แก้ไขที่บังกัน": ปรับแก้ปัญหาข้อความ % ปิดงานมูลค่า AUC ทับซ้อนบนตัวเลขยอดคงเหลือในการ์ด #executiveDonutKpiCard โดยปรับ exec-donut-main-row ให้ flex: 0 0 auto และ min-height: fit-content ป้องกันการบีบอัดตัวกล่องคงเหลือ, ปรับขนาดแคนวาสโดนัทเป็น 76px และจัดระยะบรรทัดให้กระชับสมดุล, ปรับปรุงฟังก์ชัน syncExecutiveDonutCardHeight() ให้คำนวณ natural height รองรับความสูงจริงเสมอไม่บีบอัดจนทับซ้อน 2) "แก้สีมิ้น สดใส": ปรับสีเซกเมนต์เป้าหมายเดือน พ.ย. เป็นสีมิ้นต์สดใส (Vibrant Fresh Mint Green: #059669-#10B981-#2DD4BF-#A7F3D0) คมชัด สดชื่น สบายตา',
      details: '1) ใน css/styles.css: ปรับ #tab-dashboard #executiveDonutKpiCard .exec-donut-main-row.vertical-layout ให้มี flex: 0 0 auto; min-height: fit-content; จัด spacing ช่องว่างอย่างลงตัว, ปรับขนาด .exec-donut-canvas-box เป็น 76px x 76px, ปรับ font-size .exec-progress-big-val เป็น 1.20rem, ปรับ .single-bar-segment.seg-2, .bar-row-fill.m-2, และ .btn-wbs-kpi-month.m-seg-2 ให้ใช้โทนสีมิ้นต์สดใส (Vibrant Fresh Mint Green) ไล่เฉดสี #059669, #10B981, #2DD4BF ถึง #A7F3D0 2) ใน js/app.js: ใน syncExecutiveDonutCardHeight() วัด scrollHeight ของการ์ดซ้ายก่อนคำนวณ เพื่อให้ Math.max(targetH, naturalH) ป้องกันไม่ให้การ์ดถูกบังคับความสูงน้อยกว่าเนื้อหาภายใน 3) ใน index.html: อัปเดต Version Cache Buster เป็น ?v=20261027_1120 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน: "แก้ไขที่บังกัน" (ภาพวงแดงครอบกล่องคงเหลือ) และ "แก้สีมิ้น สดใส" (ภาพวงแดงครอบ พ.ย.)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (แก้ไขการทับซ้อนขององค์ประกอบ UI และปรับแต่งชุดสีมิ้นต์สดใสตามคำสั่งผู้ใช้งาน)'
    },
    {
      id: 'log_000_update_seg2_to_pastel_blue',
      timestamp: '2026-10-27 11:05:00',
      timestampTh: '27 ต.ค. 2569, 11:05 น.',
      type: 'EDIT',
      typeBadge: 'ปรับแต่งสีน้ำเงินพาสเทล',
      badgeClass: 'badge-type-edit',
      title: 'ปรับแต่งสีเซกเมนต์เป้าหมายเดือน พ.ย. เป็นสีน้ำเงินพาสเทลตามวงกลมสีแดง',
      targetSubject: 'แถบเซกเมนต์เป้าหมาย 3 เดือน (#next3mProjectionSection) และปุ่มเลือกเดือนเป้าหมาย WBS',
      storageFile: 'css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "แก้ไขสีน้ำเงิน พาสเทล" พร้อมภาพวงสีแดงครอบเซกเมนต์เป้าหมายเดือน พ.ย. (~71.7%): ปรับเปลี่ยนโทนสีจากเดิมที่เป็นสีเขียว (#047857-#34D399) ให้เป็นสีน้ำเงินพาสเทล (Soft Pastel Royal Blue: #2563EB-#BFDBFE) พร้อมจัดเฉดเงาตัวอักษรและป้ายเป้า KPI ให้อ่านง่าย คมชัด โดดเด่น สบายตา สอดรับกับเดือน ต.ค. (ชมพูพาสเทล) อย่างลงตัว',
      details: '1) ใน css/styles.css: ปรับ .single-bar-segment.seg-2 ให้ใช้พื้นหลัง linear-gradient(135deg, #2563EB 0%, #60A5FA 45%, #BFDBFE 100%) พร้อมเงาใน inset และจัดสไตล์ตัวอักษรให้อ่านง่าย คมชัด ด้วย text-shadow สีมิดไนท์บลู, ปรับ .bar-row-fill.m-2 ให้เป็น linear-gradient(90deg, #2563EB, #93C5FD), ปรับ .btn-wbs-kpi-month.m-seg-2 และสถานะ active ให้เป็นเฉดสีน้ำเงินพาสเทลสอดคล้องกันทุกแท็บ 2) ใน index.html: อัปเดต Cache Buster ของ css/styles.css เป็น ?v=20261027_1105 3) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน: "แก้ไขสีน้ำเงิน พาสเทล" พร้อมภาพ media_1793072574666.jpg',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (ปรับแต่งชุดสี UI ให้สวยงาม สบายตา ตรงตามความต้องการของผู้ใช้งาน)'
    },
    {
      id: 'log_000_fix_wbs_sap_date_to_actual_27oct',
      timestamp: '2026-10-27 10:55:00',
      timestampTh: '27 ต.ค. 2569, 10:55 น.',
      type: 'EDIT',
      typeBadge: 'แก้ไขวันที่แสดงผล SAP',
      badgeClass: 'badge-type-edit',
      title: 'แก้ไขข้อความวันที่แก้ไขล่าสุดของสถานะ SAP ให้ตรงกับไฟล์ 04 จริง (27 ต.ค. 69)',
      targetSubject: 'หัวการ์ดภาพรวม WBS (#wbsExecutiveDonutKpiCard) และหัวกราฟล่างยอดดำเนินการ',
      storageFile: 'js/wbs.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "แสดงไม่ตรงวันที่แก้ไขจริง" พร้อมภาพวงสีแดง: ปรับแก้ข้อความวันที่แก้ไขล่าสุดของสถานะ SAP ในหัวการ์ดภาพรวม WBS (wbsExecutiveDonutKpiCard) จากเดิม "สถานะ SAP แก้ไขล่าสุดวันที่ 23 ต.ค. 69" เป็น "สถานะ SAP แก้ไขล่าสุดวันที่ 27 ต.ค. 69" และในหัวกราฟล่างยอดดำเนินการเป็น "สถานะ SAP แก้ไขล่าสุด: 27 ต.ค. 69" พร้อมอัปเดต Tooltip และข้อมูลนำเข้าในแท็บประวัติให้ตรงตามไฟล์ 04 ZBUDR064 ฉบับจริง',
      details: '1) ใน js/wbs.js: แก้ไขข้อความใน #wbsKpiSapDateText จาก "สถานะ SAP แก้ไขล่าสุดวันที่ 23 ต.ค. 69" เป็น "สถานะ SAP แก้ไขล่าสุดวันที่ 27 ต.ค. 69" (พร้อม title วันที่ 27 ต.ค. 2569) และแก้ไขใน .bar-sap-date-plain เป็น "สถานะ SAP แก้ไขล่าสุด: 27 ต.ค. 69" 2) ใน index.html: อัปเดตแท็ก #dataHistoryBadge เป็น 27 ต.ค. และอัปเดต Cache Buster เป็น ?v=20261027_1058 3) ใน js/data_history.js: ปรับข้อมูลวันนำเข้าล่าสุด WBS ในการ์ดสถิติและผัง Model View เป็น 27 ต.ค. 69 พร้อมบันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน: "แสดงไม่ตรงวันที่แก้ไขจริง" พร้อมภาพวงสีแดง',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ'
    },
    {
      id: 'log_000_update_wbs_04_06_files_27oct',
      timestamp: '2026-10-27 10:45:00',
      timestampTh: '27 ต.ค. 2569, 10:45 น.',
      type: 'IMPORT',
      typeBadge: 'นำเข้าข้อมูล 04 & 06',
      badgeClass: 'badge-type-import',
      title: 'อัปเดตไฟล์ข้อมูล 04 WBS ZBUDR064 และ 06 WBS CN41 ล่าสุด (วันที่ 27 ต.ค. 69) เข้าสู่ฐานข้อมูลหลัก',
      targetSubject: 'ฐานข้อมูล WBS (js/data_wbs.js) และป้ายแสดงวันที่ไฟล์ 04 และ 06',
      storageFile: 'js/data_wbs.js, js/wbs.js, index.html, js/data_history.js',
      changeSummary: 'ประมวลผลอัปเดตไฟล์ 04 WBS ZBUDR064 และ 06 WBS CN41 ล่าสุด วันที่ 27 ตค 69 เข้าสู่ js/data_wbs.js ครบ 2,083 โครงการ: พบการเปลี่ยนแปลงสถานะ SAP 47 งาน (ปรับเปลี่ยนเป็น CLSD F4), มูลค่า AUC ปรับเปลี่ยน 3 งาน (มูลค่ารวมสะสม 643,058,079.45 บาท), % เบิกพัสดุ ปรับเปลี่ยน 50 งาน พร้อมคงข้อมูลหมายเหตุและแผนปิดงานจาก Google Sheet และอัปเดตป้ายวันที่เป็น 27 ต.ค. 69 ทุกจุด',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "update ไฟล์ 04 WBS และ 06 WBS": 1) สำรองข้อมูล js/data_wbs.js ไปยัง js/data_wbs.bak_before_27oct.js 2) ดึงข้อมูลหมายเหตุและแผนปิดงานจาก Google Sheet Live API รวม 2,131 รายการ 3) ประมวลผลรวมข้อมูลจาก 03 WBSงานคงเหลือเดือนล่าสุด.xlsx (2,083 โครงการ), 04 WBS ZBUDR064 %พัสดุและค่าแรงและสถานะsap.xlsx (แก้ไขล่าสุด 27 ต.ค. 69, 08:06 น.), 05 WBS CN41 วันเริ่มบัญชี 14 ตค 69 และ 06 WBS CN41 มูลค่า AUC ล่าสุด วันที่ 27 ตค 69.xlsx (แก้ไขล่าสุด 27 ต.ค. 69, 08:09 น.) 4) คำนวณ cn41CostInc (มูลค่า AUC ที่เพิ่มขึ้น = ไฟล์ 06 ล่าสุด - ไฟล์ 05 เริ่มต้น) ยอดรวมผลต่าง -183,020.48 บาท 5) อัปเดตการแสดงผลวันที่แก้ไขล่าสุดใน js/wbs.js และ index.html เป็น "27 ต.ค. 69" 6) อัปเดตข้อมูล DATA_SOURCE_CATALOG และ SYSTEM_STORAGE_FILES ใน js/data_history.js 7) บันทึกประวัติใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: '04 WBS ZBUDR064 %พัสดุและค่าแรงและสถานะsap.xlsx (27 ต.ค. 69, 08:06 น.) และ 06 WBS CN41 มูลค่า AUC ล่าสุด วันที่ 27 ตค 69.xlsx (27 ต.ค. 69, 08:09 น.)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง (อัปเดตข้อมูลสถานะโครงการ SAP, เปอร์เซ็นต์เบิกจ่าย และมูลค่า AUC ล่าสุดเป็นวันที่ 27 ต.ค. 2569 อย่างสมบูรณ์แบบ)'
    },
    {
      id: 'log_000_add_plan_close_th_dropdown_filter',
      timestamp: '2026-10-27 10:15:00',
      timestampTh: '27 ต.ค. 2569, 10:15 น.',
      type: 'EDIT',
      typeBadge: 'ตัวกรองงวดบัญชีหัวตาราง',
      badgeClass: 'badge-type-edit',
      title: 'เพิ่มตัวกรองงวดบัญชี (แผนปิดงาน) ในหัวตาราง WBS เหมือนกับสถานะ SAP ตามคำสั่งผู้ใช้งาน',
      targetSubject: 'หัวตารางคอลัมน์ แผนปิดงาน (G-SHEET) (#btnWbsPlanCloseThDropdown) และป๊อปอัปตัวกรอง (#wbsPlanCloseThDropdownPanel)',
      storageFile: 'index.html, css/styles.css, js/wbs.js, js/data_history.js',
      changeSummary: 'เพิ่มตัวกรองงวดบัญชี (แผนปิดงาน) ที่แถวที่ 3 ใต้เวลาซิงค์ Google Sheet ในคอลัมน์ แผนปิดงาน (G-SHEET) มีปุ่ม Dropdown [ทุกงวดบัญชี v] และปุ่มยางลบ [⌫] สำหรับเลือกกรองงวดบัญชีเฉพาะในตาราง WBS รองรับการเลือกหลายงวดบัญชีพร้อมกันแบบเดียวกับสถานะ SAP',
      details: 'ดำเนินการตามคำสั่งผู้ใช้งาน "เพิ่มตัวกรอง งวดบัญชี เหมือนกับสถานะ sap": 1) ใน index.html: เพิ่มป๊อปอัปตัวกรอง #wbsPlanCloseThDropdownPanel แสดงรายการงวดบัญชีพร้อม Checkbox/Badge และสรุปจำนวนงาน 2) ใน css/styles.css: เพิ่มสไตล์ความกว้าง #wbsPlanCloseThDropdownPanel (235px) และเอฟเฟกต์เรืองแสงเมื่อเลือก .badge-plan-close 3) ใน js/wbs.js: เพิ่ม tablePlanCloseStatuses ใน wbsState, ปรับปรุง getFilteredWbsData รองรับพารามิเตอร์ skipTablePlanClose, ใน renderWbsTableHead เพิ่มปุ่ม Dropdown #btnWbsPlanCloseThDropdown และยางลบ #btnWbsPlanCloseThEraser ในคอลัมน์ planClose แถวเดียวกับสถานะ SAP, เพิ่มฟังก์ชัน renderWbsPlanCloseThDropdownList, repositionWbsPlanCloseDropdown, toggleWbsPlanCloseThDropdown, closeWbsPlanCloseThDropdown, toggleWbsPlanCloseDropdownStatus, clearWbsTablePlanCloseFilter, selectAllWbsPlanCloseDropdownStatuses, พร้อมดักจับคลิกนอกกรอบและปุ่ม ESC เพื่อปิดป๊อปอัปอัตโนมัติ 4) อัปเดต Cache Buster เป็น ?v=20261027_1015',
      sourceFile: 'คำสั่งผู้ใช้งาน ("เพิ่มตัวกรอง งวดบัญชี เหมือนกับสถานะ sap") พร้อมรูปภาพแนบ',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง (เพิ่มความสะดวกในการคัดกรองงานตามงวดบัญชีแผนปิดงานในตาราง WBS ได้อย่างแม่นยำและรวดเร็ว)'
    },
    {
      id: 'log_000_btn_return_to_normal_screen_fullscreen_only',
      timestamp: '2026-10-27 09:53:00',
      timestampTh: '27 ต.ค. 2569, 09:53 น.',
      type: 'EDIT',
      typeBadge: 'ปุ่มคืนหน้าจอปกติเฉพาะจอขยาย',
      badgeClass: 'badge-type-edit',
      title: 'ปรับแต่งปุ่มเป็น "คืนหน้าจอปกติ" และกำหนดให้แสดงผลเฉพาะในหน้าจอขยายเต็มจอเท่านั้น ไม่แสดงในหน้าจอหลัก',
      targetSubject: 'ปุ่มคืนหน้าจอปกติ (#btnReturnNormalScreen) ใน index.html, css/styles.css, js/app.js',
      storageFile: 'index.html, css/styles.css, js/app.js, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "คืนหน้าจอปกติ ให้เพิ่มเฉพาะหน้าจอขยายเท่านั้น" และ "ไม่ใช่เพิ่มในหน้าจอหลัก": 1) ปรับข้อความบนปุ่มเป็น "คืนหน้าจอปกติ" พร้อมไอคอนย่อขนาด 2) กำหนดสไตล์ในหน้าจอปกติ/หน้าจอหลักให้ซ่อนปุ่มโดยเด็ดขาด (display: none !important;) ไม่รบกวนหน้าจอหลัก 3) ให้ปุ่มแสดงผลเฉพาะตอนที่ผู้ใช้กดขยายเต็มจอเท่านั้น (body.has-fullscreen-table / body.has-fullscreen-chart) โดยตรึงตำแหน่ง Fixed มุมบนขวา (top: 58px; right: 20px; z-index: 100010) ตรงจุดกรอบสีแดงของผู้ใช้งาน 4) เมื่อคลิกจะย่อขนาดออกจากโหมดเต็มจอ คืนสู่หน้าจอปกติทันที โดยคงอยู่ในหน้าเดิมอย่างราบรื่น',
      details: '1) ใน index.html: ปรับ id เป็น #btnReturnNormalScreen, ข้อความปุ่มเป็น "คืนหน้าจอปกติ", ฟังก์ชันเรียกใช้ window.returnToNormalScreen(), อัปเดต Cache Buster เป็น ?v=20261027_0953 2) ใน css/styles.css: กำหนด .btn-return-main-screen, #btnReturnNormalScreen ให้เป็น display: none !important; เป็นค่าเริ่มต้น เพื่อไม่ให้แสดงในหน้าจอหลัก และกำหนดให้ display: inline-flex !important; เฉพาะเมื่อ body มีคลาส has-fullscreen-table หรือ has-fullscreen-chart เท่านั้น 3) ใน js/app.js: เพิ่มฟังก์ชัน window.returnToNormalScreen() ปลดคลาส is-fullscreen และ has-fullscreen-table/chart รีเซ็ตปุ่มขยาย และ dispatch resize event 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน ("คืนหน้าจอปกติ ให้เพิ่มเฉพาะหน้าจอขยายเท่านั้น" และ "ไม่ใช่เพิ่มในหน้าจอหลัก")',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงปุ่มคืนหน้าจอปกติให้แสดงผลเฉพาะในหน้าจอขยายเต็มจอตามความต้องการของผู้ใช้งานอย่างสมบูรณ์แบบ)'
    },
    {
      id: 'log_000_remove_fullscreen_btn_timeline_analytics_chart',
      timestamp: '2026-10-27 09:28:00',
      timestampTh: '27 ต.ค. 2569, 09:28 น.',
      type: 'EDIT',
      typeBadge: 'นำปุ่มขยายเต็มจอออกตามวงแดง',
      badgeClass: 'badge-type-edit',
      title: 'นำปุ่มขยายเต็มจอออกจากหัวการ์ดกราฟ Timeline วิเคราะห์เปรียบเทียบตามวงแดง',
      targetSubject: 'หัวการ์ดกราฟเปรียบเทียบผลงานและ Timeline (% ปิดงานมูลค่า AUC) ใน index.html',
      storageFile: 'index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "เอาออก" (ภาพวงกรอบสีแดงครอบปุ่มขยายเต็มจอด้านขวาของป้าย % ปิดงานมูลค่า AUC (ล้านบาท) บนหัวการ์ดกราฟวิเคราะห์เปรียบเทียบ & Timeline): ตัดปุ่ม <button class="btn-fullscreen"> ออกจากคอนเทนเนอร์ .card-actions ของการ์ดกราฟ Timeline ในหน้าแท็บวิเคราะห์เปรียบเทียบทั้งหมด คงเหลือเฉพาะป้ายหน่วยวัด % ปิดงานมูลค่า AUC เท่านั้น ทำให้ส่วนหัวการ์ดสะอาดตา ตรงตามคำสั่งของผู้ใช้งาน',
      details: '1) ใน index.html: ตัดปุ่ม <button class="btn-fullscreen" onclick="toggleCardFullscreen(this)" title="ขยายกราฟเต็มหน้าจอ">...</button> ออกจาก .card-actions ของการ์ดกราฟ Timeline (#tab-analytics) 2) อัปเดต Version Cache Buster ใน index.html เป็น ?v=20261027_0928 3) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน (เอาออก พร้อมภาพกรอบสีแดง media_1793066542617.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (นำปุ่มขยายเต็มจอออกตามคำสั่งผู้ใช้งาน โดยคงฟังก์ชันการแสดงผลและโหมดกราฟ Timeline ไว้อย่างครบถ้วน)'
    },
    {
      id: 'log_000_remove_fullscreen_btn_office_ranking_chart',
      timestamp: '2026-10-27 09:25:00',
      timestampTh: '27 ต.ค. 2569, 09:25 น.',
      type: 'EDIT',
      typeBadge: 'นำปุ่มขยายเต็มจอออกตามวงแดง',
      badgeClass: 'badge-type-edit',
      title: 'นำปุ่มขยายเต็มจอออกจากหัวการ์ดผลงานล่าสุดราย กฟฟ. ข้างปุ่มสูตรคำนวณตามวงแดง',
      targetSubject: 'หัวการ์ดผลงานล่าสุด ราย กฟฟ. (#unifiedProjectionOfficeCard) ใน index.html',
      storageFile: 'index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "เอาออก วงแดง" (ภาพวงกรอบสีแดงรอบปุ่มขยายเต็มจอด้านขวาของปุ่มสูตรคำนวณบนหัวการ์ดผลงานล่าสุด ราย กฟฟ.): ตัดปุ่ม <button class="btn-fullscreen"> ออกจากคอนเทนเนอร์ .card-actions ของการ์ดผลงานราย กฟฟ. (#unifiedProjectionOfficeCard) ทั้งหมด คงเหลือเฉพาะปุ่มสูตรคำนวณ (📐 สูตรคำนวณ) เท่านั้น ทำให้ส่วนหัวการ์ดสะอาดตา ตรงตามความต้องการ',
      details: '1) ใน index.html: ตัดปุ่ม <button class="btn-fullscreen" onclick="toggleCardFullscreen(this)" title="ขยายกราฟเต็มหน้าจอ">...</button> ออกจาก .card-actions ของ #unifiedProjectionOfficeCard (ข้างปุ่ม #btnToggleCalcFormula) 2) อัปเดต Version Cache Buster ใน index.html เป็น ?v=20261027_0925 3) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน (เอาออก วงแดง พร้อมภาพกรอบสีแดง media_1793066367852.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ต่ำ (นำปุ่มขยายเต็มจอออกตามความต้องการของผู้ใช้งาน โดยไม่กระทบต่อฟังก์ชันการแสดงผลกราฟและการคำนวณ)'
    },
    {
      id: 'log_000_remove_fullscreen_btn_criteria_chart_and_elevate_fullscreen_filters',
      timestamp: '2026-10-27 09:20:00',
      timestampTh: '27 ต.ค. 2569, 09:20 น.',
      type: 'EDIT',
      typeBadge: 'นำปุ่มขยายเต็มจอออกตามกรอบแดง',
      badgeClass: 'badge-type-edit',
      title: 'นำปุ่มขยายเต็มจอออกจากหัวการ์ดร้อยละความสำเร็จการปิดงาน 8 เกณฑ์วัดตามกรอบสีแดง พร้อมปลดล็อกแถบตัวกรองเต็มจอ',
      targetSubject: 'หัวการ์ดร้อยละความสำเร็จการปิดงาน (% Closed) แยกตาม 8 ประเภทเกณฑ์วัด (#topCriteriaChartCard) และระบบตัวกรองโหมดเต็มจอ',
      storageFile: 'index.html, css/styles.css, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "เอาออก" (พร้อมภาพกรอบสีแดงครอบปุ่มขยายเต็มจอบนหัวการ์ดเกณฑ์วัด 8 หมวด): 1) ตัดปุ่มขยายเต็มจอ (.btn-fullscreen) และคอนเทนเนอร์ .card-actions ออกจากส่วนหัวการ์ดร้อยละความสำเร็จการปิดงาน (% Closed) แยกตาม 8 ประเภทเกณฑ์วัด (#topCriteriaChartCard) ทั้งหมดตามกรอบสีแดงที่ระบุ ทำให้ส่วนหัวการ์ดแสดงเฉพาะชื่อหัวข้ออย่างเป็นระเบียบเรียบหรู 2) สำหรับโหมดขยายเต็มจอในหน้าอื่นๆ ปรับแก้ Stacking Context ของ .sticky-top-section ให้เป็น static เพื่อให้แถบตัวกรองหลัก (#topStickyFilterBar ถอดแบบรูปที่ 5) ลอยเด่นเหนือหน้าจอเต็มจอ (z-index: 100005) พร้อมซ่อน Header และ Tab Bar ไม่ให้บดบัง',
      details: '1) ใน index.html: นำ <div class="card-actions"><button class="btn-fullscreen">...</button></div> ออกจาก #topCriteriaChartCard 2) ใน css/styles.css: เพิ่มกฎ body.has-fullscreen-chart และ body.has-fullscreen-table ให้ .sticky-top-section เป็น position: static; z-index: auto; พร้อมซ่อน .app-header และ .nav-tabs-bar เมื่อขยายเต็มจอ และปรับ .crit-dd-panel เป็น z-index: 100010 3) ปรับ Cache Buster ใน index.html เป็น ?v=20261027_0920 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน (เอาออก พร้อมภาพกรอบสีแดง media_1793066221809.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (นำปุ่มขยายเต็มจอออกตามคำสั่งผู้ใช้งาน และปรับปรุงระบบตัวกรองเต็มจอให้ทำงานสมบูรณ์)'
    },
    {
      id: 'log_000_remove_wbs_header_unlock_buttons_keep_row_trailing_edit_btn',
      timestamp: '2026-10-27 09:05:00',
      timestampTh: '27 ต.ค. 2569, 09:05 น.',
      type: 'EDIT',
      typeBadge: 'ตัดปุ่มปลดล็อกหัวตาราง WBS',
      badgeClass: 'badge-type-edit',
      title: 'นำปุ่มปลดล็อกที่หัวตาราง WBS ออกทั้ง 2 จุดตามที่วงกลม และคงเหลือเฉพาะปุ่มแก้ไขด้านท้ายของแต่ละแถวในตาราง',
      targetSubject: 'หัวตาราง WBS คอลัมน์ แผนปิดงาน (G-SHEET) และ หมายเหตุ (G-SHEET) ใน js/wbs.js',
      storageFile: 'js/wbs.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "เอาที่วงกลมออก คงเหลือด้านท้ายไว้อย่างเดียว": 1) นำปุ่มปลดล็อก [🔓 ปลดล็อกแล้ว] ออกจากหัวตาราง WBS ทั้ง 2 จุดที่วงกลมสีแดง (ใต้หัวคอลัมน์ "แผนปิดงาน (G-SHEET)" และ "หมายเหตุ (G-SHEET)") ทำให้หัวตารางโปร่งโล่ง สะอาดตา แสดงเฉพาะข้อความเวลาซิงค์ล่าสุด 2) คงเหลือเฉพาะปุ่มแก้ไข (✏️ / 🔒) ที่อยู่ด้านท้ายสุดของคอลัมน์หมายเหตุในแต่ละแถวข้อมูล เพื่อให้ผู้ใช้สามารถคลิกเปิดหน้าต่างแก้ไขข้อมูลหรือยืนยัน Admin PIN ได้ตามปกติ',
      details: '1) ใน js/wbs.js (renderWbsTableHead): นำ case \'planClose\': และ case \'note\': ออกจาก switch-case สำหรับ headerMetricHtml ทำให้ทั้งสองคอลัมน์ไม่เรนเดอร์ปุ่ม .btn-th-wbs-lock อีกต่อไป คงเหลือเฉพาะป้ายเวลาซิงค์ล่าสุด (wbs-th-sync-time) ในแถวที่ 2 ตามปกติ 2) ในแต่ละแถวข้อมูลของตาราง WBS: คงปุ่ม .btn-wbs-inline-edit พร้อมไอคอน ✏️ (เมื่อปลดล็อกแล้ว) หรือ 🔒 (เมื่อล็อกอยู่) ด้านท้ายสุดของคอลัมน์หมายเหตุไว้ครบถ้วนทุกแถวตามเดิม 3) ฟังก์ชัน updateWbsEditLockUI() ยังคงทำงานได้อย่างราบรื่นและควบคุมปุ่มแก้ไขรายแถวได้ 100% 4) ใน index.html: อัปเดต Version Cache Buster ของ js/wbs.js และ js/data_history.js เป็น ?v=20261027_0905 5) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน (เอาที่วงกลมออก คงเหลือด้านท้ายไว้อย่างเดียว พร้อมภาพ media_1793064554938.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับแต่งส่วนหัวตาราง WBS ให้เรียบหรู สะอาดตา และคงปุ่มแก้ไขรายแถวด้านท้ายไว้อย่างสมบูรณ์)'
    },
    {
      id: 'log_000_match_yellow_frame_and_unified_fullscreen_filters',
      timestamp: '2026-10-27 08:50:00',
      timestampTh: '27 ต.ค. 2569, 08:50 น.',
      type: 'EDIT',
      typeBadge: 'จัดเลย์เอาต์กรอบเหลือง & ตัวกรองเต็มจอ',
      badgeClass: 'badge-type-edit',
      title: 'จัดเลย์เอาต์ส่วนหัวการ์ดเป้าหมายแบบแถวเดียวตามกรอบเหลือง พร้อมยกระดับตัวกรองโหมดขยายเต็มจอทุกอันเป็นแถบหลักตามรูป 5',
      targetSubject: 'ส่วนหัวการ์ดเป้าหมายที่ต้องปิดงานเพิ่ม (#next3mProjectionSection) และระบบตัวกรองในโหมดขยายเต็มจอทั้งหมด (#topStickyFilterBar)',
      storageFile: 'js/app.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "จัดให้ได้แบบกรอบเหลือง" และ "หน้าขยายเต็มจอทุกอัน ให้เพิ่มตัวกรองตามรูป 5 หรือหากมีตัวกรองอยุ่แล้วให้ยกเลิกและปลี่ยนเป็นรูป 5 เหมือนกันทั้งหมด": 1) ปรับเลย์เอาต์ส่วนหัวการ์ดเป้าหมาย (#next3mProjectionSection) ให้อยู่ในแถวเดียว (Single Row) 100% ตามกรอบสีเหลือง โดยย้ายแถบตัวกรองที่เลือก (.next3m-active-filter-strip) ขึ้นไปต่อท้ายป้าย KPI, เอาปุ่มขยายเต็มจอออกจากหัวการ์ดนี้ (คงเหลือเฉพาะที่หัวกราฟด้านล่าง), และตัดแถวที่ 2 (.next3m-substrip-row) ออก ให้แท่งกราฟ 3 เดือนแนบติดกับหัวข้ออย่างกระชับพอดี 2) สำหรับโหมดขยายเต็มจอทุกหน้า (.is-fullscreen) ปรับให้แสดงแถบตัวกรองหลัก (#topStickyFilterBar) ล็อคติดขอบบนสุด (z-index: 100005) ถอดแบบรูป 5 ครบถ้วน (เดือน, เกณฑ์วัด+ยางลบ, พื้นที่+ยางลบ, กฟฟ.+ยางลบ, ค้นหา, รีเซ็ต) พร้อมยกเลิก/ซ่อนตัวกรองเดิม (.card-header-filters และสถิติย่อย) เพื่อให้เป็นมาตรฐานเดียวกันทั้งหมด',
      details: '1) ใน js/app.js (renderNext3mHorizontalBarChart): ย้าย .next3m-active-filter-strip ไปไว้ใน .single-bar-left-tags ต่อจาก #next3mSingleBarKpiBadge, นำปุ่ม .btn-fullscreen ออกจาก .single-bar-actions ของส่วนหัวนี้ตามภาพกรอบเหลือง, ลบ .next3m-substrip-row และ #next3mFullscreenStatsStrip ออกทั้งหมด 2) ใน css/styles.css: เพิ่มสไตล์ให้ body.has-fullscreen-chart และ body.has-fullscreen-table กำหนด #topStickyFilterBar เป็น position: fixed; top: 0; z-index: 100005; พร้อม padding-top ให้การ์ดที่ขยายเต็มจอไม่บังแถบตัวกรอง, ซ่อน .card-header-filters และ .next3m-fullscreen-stats-strip เมื่อขยายเต็มจอ 3) ใน index.html: อัปเดต Version Cache Buster เป็น ?v=20261027_0850 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน (จัดให้ได้แบบกรอบเหลือง พร้อมภาพ media_1793064734255.jpg และคำสั่งตัวกรองรูป 5)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง (ปรับเปลี่ยนการแสดงผลส่วนหัวเป้าหมายให้ตรงกับภาพต้นฉบับ 100% และรวมศูนย์ตัวกรองหน้าขยายเต็มจอทั้งหมดเป็นแถบเดียวกัน)'
    },
    {
      id: 'log_000_revert_remove_red_box_and_move_yellow_filter_strip',
      timestamp: '2026-10-27 08:30:00',
      timestampTh: '27 ต.ค. 2569, 08:30 น.',
      type: 'EDIT',
      typeBadge: 'ยกเลิกคำสั่งปรับเลย์เอาต์การ์ด',
      badgeClass: 'badge-type-edit',
      title: 'ยกเลิกคำสั่งก่อนหน้า: คืนค่าปุ่มขยายเต็มจอ (กรอบสีแดง) และคืนค่าแถบตัวกรองที่เลือก (กรอบสีเหลือง) ไว้ในแถวที่ 2 ตามเดิม',
      targetSubject: 'ส่วนหัวการ์ดเป้าหมายที่ต้องปิดงานเพิ่ม (#next3mProjectionSection / #next3mHBarChartCard ใน js/app.js, css/styles.css, index.html)',
      storageFile: 'js/app.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ยกเลิกคำสั่งก่อนหน้า --- เอากรอบสีแดงออก และเลื่อนกรอบเหลืองไว้บนสุด": 1) คืนค่าปุ่มขยายเต็มจอ (<button class="btn-fullscreen">) กลับมาไว้ที่แถบเครื่องมือมุมบนขวาของการ์ดเป้าหมายที่ต้องปิดงานเพิ่มตามเดิม 2) คืนค่าแถบตัวกรองที่เลือก (.next3m-active-filter-strip) และแถบสถิติโหมดเต็มจอ (#next3mFullscreenStatsStrip) ลงมาไว้ในแถวที่สอง (.next3m-substrip-row) ใต้แถบหัวข้อตามโครงสร้างเดิม 3) คืนค่าระยะห่าง margin-bottom ของ .single-bar-meta กลับเป็น 0.35rem เพื่อเว้นระยะระหว่างแถวอย่างเหมาะสมสวยงาม',
      details: '1) ใน js/app.js (renderNext3mHorizontalBarChart): คืนค่า <button class="btn-fullscreen"> กลับมาใน .single-bar-actions, นำ .next3m-active-filter-strip ออกจาก .single-bar-left-tags และนำกลับมาไว้ในคอนเทนเนอร์ .next3m-substrip-row ร่วมกับ #next3mFullscreenStatsStrip ตามเดิม 2) ใน css/styles.css: คืนค่า .single-bar-meta ให้มี margin-bottom: 0.35rem 3) ใน index.html: อัปเดต Version Cache Buster เป็น ?v=20261027_0830 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน (ยกเลิกคำสั่งก่อนหน้า --- เอากรอบสีแดงออก และเลื่อนกรอบเหลืองไว้บนสุด)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (คืนค่าเลย์เอาต์ส่วนหัวการ์ดเป้าหมายและปุ่มขยายเต็มจอกลับสู่สถานะเดิมตามคำสั่งผู้ใช้งาน 100%)'
    },
    {
      id: 'log_000_wbs_table_header_display_latest_sync_time',
      timestamp: '2026-10-27 08:25:00',
      timestampTh: '27 ต.ค. 2569, 08:25 น.',
      type: 'CONFIG',
      typeBadge: 'แสดงเวลาซิงค์ล่าสุด',
      badgeClass: 'badge-type-config',
      title: 'แสดงข้อความเวลาซิงค์ Google Sheet ล่าสุด เป็นตัวอักษรแบบเดียวกับสถานะ SAP และอยู่ในแถวเดียวกัน',
      targetSubject: 'หัวคอลัมน์ตาราง WBS (แผนปิดงาน และ หมายเหตุ) และแถบวันที่หัวการ์ด WBS (js/wbs.js, index.html)',
      storageFile: 'js/wbs.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "แสดงเวลาซิงค์ล่าสุด เป็นอักษร แบบเดียวกับ สถานะ sap และแถวเดียวกัน": 1) ในหัวคอลัมน์ตาราง WBS สำหรับ "แผนปิดงาน (G-Sheet)" และ "หมายเหตุ (G-Sheet)" เพิ่มข้อความเวลาซิงค์ล่าสุด (th-sub-date-text) แสดงเป็นตัวอักษรเรียบหรูสี #CBD5E1 ขนาด 0.70rem ในแถวที่ 2 ตรงกับข้อความ "แก้ไขล่าสุด: 26 ต.ค. 69" ของคอลัมน์ สถานะ SAP และ มูลค่า AUC 2) ย้ายปุ่มปลดล็อก [🔓 ปลดล็อกแล้ว] ลงมาอยู่แถวที่ 3 ระดับเดียวกับปุ่มตัวกรองสถานะ SAP และป้ายผลรวมมูลค่า AUC ทำให้หัวตารางทุกคอลัมน์มีความสูงและเลย์เอาต์เสมอกันทุกแถว 3) ในแถบข้อความหัวการ์ด WBS (#wbsHeaderDatesPlain) เพิ่มคอลัมน์ "Google Sheet" แสดงเวลาซิงค์ล่าสุดในแถวเดียวกันกับ สถานะ SAP และ มูลค่า AUC 4) ฟังก์ชัน updateSyncButtonStatusUI อัปเดตเวลาซิงค์ล่าสุดแบบเรียลไทม์ทันทีที่กดซิงค์สำเร็จ',
      details: '1) ใน js/wbs.js: เพิ่มฟังก์ชัน getGoogleSheetSyncTimeText() และ getGoogleSheetFullSyncTimeText() เพื่อดึงเวลาซิงค์ล่าสุดจาก LocalStorage (AUC_WBS_SYNCED_SHEET_TIME_V1) มาฟอร์แมตภาษาไทย, ใน renderWbsTableHead() แทรก <div class="th-sub-date-text wbs-th-sync-time"> ใต้หัวคอลัมน์ planClose และ note, ปรับขนาด minWidth ของ planClose เป็น 125px ให้รองรับตัวอักษรได้อย่างสวยงาม, ใน updateSyncButtonStatusUI() อัปเดตข้อความเวลาซิงค์ในตารางและบนหัวการ์ดทันที 2) ใน index.html: เพิ่มคอลัมน์ Google Sheet พร้อมเวลาซิงค์ล่าสุดใน #wbsHeaderDatesPlain บนแถวเดียวกับ สถานะ SAP และ มูลค่า AUC, อัปเดต Version Cache Buster เป็น ?v=20261027_0825 3) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ AGENTS.md',
      sourceFile: 'คำสั่งผู้ใช้งาน (แสดงเวลาซิงค์ล่าสุด เป็นอักษร แบบเดียวกับ สถานะ sap และแถวเดียวกัน)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (จัดระเบียบหัวตาราง WBS ทุกคอลัมน์ให้อยู่ในระดับแถวเดียวกันอย่างสมบูรณ์แบบ พร้อมแสดงเวลาซิงค์ Google Sheet ล่าสุดแบบเรียลไทม์)'
    },
    {
      id: 'log_000_wbs_sync_google_sheet_localstorage_persistence',
      timestamp: '2026-10-27 08:15:00',
      timestampTh: '27 ต.ค. 2569, 08:15 น.',
      type: 'CONFIG',
      typeBadge: 'บันทึกจำค่าซิงค์ Google Sheet',
      badgeClass: 'badge-type-config',
      title: 'แก้ไขระบบให้จำค่าการซิงค์ Google Sheet ล่าสุดลง LocalStorage ถาวร ไม่เด้งกลับไปเป็นไฟล์เดิมเมื่อรีเฟรชหน้าจอ',
      targetSubject: 'ระบบซิงค์ Google Sheet และตารางข้อมูล WBS คงเหลือ (js/wbs.js, js/data_wbs.js, index.html)',
      storageFile: 'js/wbs.js, js/data_wbs.js, localStorage (AUC_WBS_SYNCED_SHEET_DATA_V1), index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำถามและคำสั่งผู้ใช้งาน "แผนปิดงาน / หมายเหตุ ทำไมไม่จำค่าหลังจากกด ซิ้ง google sheet แต่ไปจำค่าไฟล์เดิม - แก้ไขอย่างไรให้จำค่ากด ซิ้ง google sheet ล่าสุด": 1) วิเคราะห์สาเหตุ: เดิมการกดซิงค์ Google Sheet หรือแก้ไขผ่านหน้าเว็บเป็นการอัปเดตเฉพาะ RAM ชั่วคราว เมื่อผู้ใช้กดรีเฟรช F5 หรือเปิดหน้าเว็บใหม่ ระบบจะโหลดไฟล์สถิติเดิม (js/data_wbs.js) ทำให้ค่าเด้งกลับไปเป็นไฟล์เดิม 2) พัฒนาระบบบันทึกแคชถาวรลงใน LocalStorage (AUC_WBS_SYNCED_SHEET_DATA_V1) ทุกครั้งที่มีการกดซิงค์ Google Sheet หรือแก้ไขผ่านโมดัล 3) ให้ระบบอ่านและสวมทับค่าจาก LocalStorage โดยอัตโนมัติตอนเปิดหน้าจอ (initWbsApp) ทำให้จำค่าซิงค์ล่าสุดได้ 100% แม้ปิดเบราว์เซอร์หรือรีเฟรช 4) รันสคริปต์อัปเดตข้อมูลไฟล์ฐาน js/data_wbs.js ตรงจาก Google Sheet ล่าสุดรวม 758 รายการ',
      details: '1) ใน js/wbs.js: เพิ่มฟังก์ชัน saveGoogleSheetDataToCache, updateSingleWbsInCache, applyCachedGoogleSheetData และ updateSyncButtonStatusUI เพื่อจัดการ LocalStorage แคช 2) ใน initWbsApp() และ handleWbsExcelUpload(): สวมทับข้อมูลจากแคชอัตโนมัติก่อนเรนเดอร์ตาราง 3) ใน submitWbsEditNoteModal(): บันทึกค่าแก้ไขเดี่ยวลงแคช 4) ใน syncLiveNotesFromGoogleSheet(): บันทึกข้อมูลที่ดึงได้ลงแคชพร้อมบันทึก Timestamp ล่าสุดและอัปเดต Tooltip ของปุ่ม #btnSyncGoogleSheet 5) ซิงค์ข้อมูลล่าสุดจาก Google Apps Script API ลงใน js/data_wbs.js บนระบบ 6) ใน index.html: อัปเดต Cache Buster เป็น ?v=20261027_0815 7) บันทึกประวัติลงใน BASE_AUDIT_LOGS',
      sourceFile: 'คำถามและคำสั่งผู้ใช้งาน (แผนปิดงาน / หมายเหตุ ทำไมไม่จำค่าหลังจากกด ซิ้ง google sheet แต่ไปจำค่าไฟล์เดิม - แก้ไขอย่างไรให้จำค่ากด ซิ้ง google sheet ล่าสุด)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง (แก้ไขปัญหาข้อมูลย้อนกลับเป็นไฟล์เดิมเมื่อรีเฟรชหน้าจอ และทำให้ระบบจำค่าการซิงค์ Google Sheet ล่าสุดได้อย่างถาวร)'
    },
    {
      id: 'log_000_remove_red_box_fullscreen_and_move_yellow_filter_strip_to_top',
      timestamp: '2026-10-27 08:05:00',
      timestampTh: '27 ต.ค. 2569, 08:05 น.',
      type: 'EDIT',
      typeBadge: 'ปรับเลย์เอาต์การ์ดเป้าหมาย',
      badgeClass: 'badge-type-edit',
      title: 'นำปุ่มขยายเต็มจอ (กรอบสีแดง) ออก และย้ายแถบตัวกรองที่เลือก (กรอบสีเหลือง) ขึ้นไปไว้บนสุดในแถวเดียวกับหัวข้อ',
      targetSubject: 'แถบหัวการ์ดเป้าหมายที่ต้องปิดงานเพิ่ม (#next3mProjectionSection / #next3mHBarChartCard ใน js/app.js และ css/styles.css)',
      storageFile: 'js/app.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "เอากรอบสีแดงออก และเลื่อนกรอบเหลืองไว้บนสุด" พร้อมภาพประกอบ: 1) นำปุ่มขยายเต็มจอ (ปุ่มในกรอบสีแดง) ออกจากแถบเครื่องมือมุมบนขวาของการ์ดเป้าหมายที่ต้องปิดงานเพิ่ม 2) ย้ายแถบแสดงตัวกรองที่เลือก (กล่องในกรอบสีเหลือง) จากแถวด้านล่าง ขึ้นไปจัดวางบนสุดในแถวเดียวกับชื่อหัวข้อและป้าย KPI ระดับ 5 (+5%) อย่างลงตัว 3) ย้ายแถบสถิติภาพรวมโหมดเต็มจอ (Fullscreen Stats Strip) เข้าไปอยู่ในกลุ่มเครื่องมือฝั่งขวา 4) ยกเลิกแถวที่สอง (.next3m-substrip-row) ทำให้ลดพื้นที่ว่างในแนวตั้ง แถบแท่งเป้าหมายขยับชิดขึ้นบนอย่างกระชับ สวยงาม และเป็นระเบียบ',
      details: '1) ใน js/app.js (renderNext3mHorizontalBarChart): นำปุ่ม <button class="btn-fullscreen"> ออกจาก .single-bar-actions ตามตำแหน่งกรอบสีแดง, ย้าย .next3m-active-filter-strip ขึ้นไปต่อท้ายป้าย KPI ใน .single-bar-left-tags ตามตำแหน่งลูกศรชี้ขึ้นบน, ย้าย #next3mFullscreenStatsStrip เข้าไปใน .single-bar-actions เพื่อให้แสดงผลในโหมดเต็มจอได้ต่อเนื่อง, ตัด .next3m-substrip-row ออก 2) ใน css/styles.css: ปรับปรุง .single-bar-meta ให้ margin-bottom: 0, เพิ่มสไตล์ .next3m-active-filter-strip และรองรับธีมสว่าง [data-theme="light"] 3) ใน index.html: ปรับ Version Cache Buster เป็น ?v=20261027_0805 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS',
      sourceFile: 'คำสั่งผู้ใช้งาน (เอากรอบสีแดงออก และเลื่อนกรอบเหลืองไว้บนสุด พร้อมภาพประกอบลูกศรและกรอบสี)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (จัดระเบียบเลย์เอาต์การ์ดเป้าหมายให้กระชับ ประหยัดพื้นที่แนวตั้ง และลดความซ้ำซ้อนของปุ่มขยายเต็มจอ)'
    },
    {
      id: 'log_000_revert_wbs_lock_button_to_col_headers',
      timestamp: '2026-10-26 16:35:00',
      timestampTh: '26 ต.ค. 2569, 16:35 น.',
      type: 'EDIT',
      typeBadge: 'ยกเลิกคำสั่งย้ายปุ่มล็อก & คืนค่าปุ่มใต้หัวตาราง',
      badgeClass: 'badge-type-edit',
      title: 'ยกเลิกคำสั่งก่อนหน้า: นำปุ่มล็อกออกจากมุมบนขวา และคืนค่าปุ่มปลดล็อกแก้ไขไว้ใต้หัวตารางคอลัมน์แผนปิดงานและหมายเหตุตามเดิม',
      targetSubject: 'ปุ่มล็อกการแก้ไขเอกสารปิดงาน WBS (#btnToggleWbsEditLock และปุ่ม .btn-th-wbs-lock ใต้หัวคอลัมน์ planClose, note)',
      storageFile: 'index.html, js/wbs.js, css/styles.css, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ยกเลิกคำสังก่อน": 1) นำปุ่ม #btnToggleWbsEditLock ออกจากแถบเครื่องมือมุมบนขวาของตาราง WBS 2) คืนค่าปุ่มปลดล็อกแก้ไข (.btn-th-wbs-lock) กลับมาไว้ใต้ชื่อหัวคอลัมน์ "แผนปิดงาน (G-SHEET)" และ "หมายเหตุ (G-SHEET)" ทั้ง 2 จุดตามเดิม 3) ซิงค์สถานะการแสดงผลและระบบปลดล็อก Admin PIN ของทั้ง 2 ปุ่มใต้หัวตารางให้ทำงานได้อย่างถูกต้องแม่นยำ',
      details: '1) ใน index.html: นำปุ่ม #btnToggleWbsEditLock ออกจาก .wbs-table-toolbar-actions และอัปเดต Cache Buster เป็น ?v=20261026_1635 2) ใน js/wbs.js: เพิ่ม case "planClose" และ case "note" ใน renderWbsTableHead() คืนค่าปุ่ม .btn-th-wbs-lock กลับมาทั้งสองคอลัมน์ 3) ใน css/styles.css: คงสไตล์ของ .btn-th-wbs-lock และ .btn-th-wbs-lock.admin-unlocked รองรับ Dark/Light theme สมบูรณ์แบบ 4) ซิงค์ไฟล์ไปยังโฟลเดอร์ปลายทางและบันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ',
      sourceFile: 'คำสั่งผู้ใช้งาน (ยกเลิกคำสังก่อน)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (คืนค่าตำแหน่งปุ่มปลดล็อกแก้ไขเอกสารปิดงานไว้ใต้หัวตารางตามการตั้งค่าเดิมของผู้ใช้งาน)'
    },
    {
      id: 'log_000_wbs_lock_button_moved_to_top_right_single',
      timestamp: '2026-10-26 16:30:00',
      timestampTh: '26 ต.ค. 2569, 16:30 น.',
      type: 'EDIT',
      typeBadge: 'ย้ายปุ่มล็อคเอกสารปิดงานไว้บนขวา',
      badgeClass: 'badge-type-edit',
      title: 'ย้ายปุ่มล็อคเอกสารปิดงานไปไว้มุมบนขวา และปรับให้เหลือเพียงปุ่มเดียวในตาราง WBS',
      targetSubject: 'ปุ่มล็อค/ปลดล็อคการแก้ไขเอกสารปิดงาน (#btnToggleWbsEditLock บนแถบเครื่องมือบนขวา และนำปุ่มใต้หัวตารางออก)',
      storageFile: 'index.html, js/wbs.js, css/styles.css, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ล็อคเอกสารปิดงาน ไว้บนขวา และเหลืออันเดียว" (ภาพวาดกากบาทสีแดงบนหัวคอลัมน์แผนปิดงาน และวงกลมสีแดงพร้อมลูกศรชี้ขึ้นมุมบนขวา): 1) ตัดปุ่มปลดล็อกแก้ไขใต้ชื่อหัวคอลัมน์ "แผนปิดงาน (G-SHEET)" และ "หมายเหตุ (G-SHEET)" ออกทั้งหมด ทำให้หัวตารางโปร่งโล่ง สะอาดตา 2) รวมศูนย์ปุ่มล็อกการแก้ไขเอกสารปิดงานไว้เพียงจุดเดียวบนมุมบนขวาของแถบเครื่องมือตาราง WBS (#btnToggleWbsEditLock) ข้างปุ่มขยายเต็มจออย่างสวยงาม 3) ตั้งชื่อปุ่มเป็น "🔒 ล็อคเอกสารปิดงาน" (และ "🔓 ปลดล็อคแล้ว (Admin)" เมื่อยืนยัน PIN ผ่าน) สไตล์พรีเมียมขอบทอง 4) ซิงค์สถานะการล็อกและการปลดล็อกให้ควบคุมการแก้ไขทุกแถวในตารางได้อย่างสมบูรณ์แบบ',
      details: '1) ใน index.html: เพิ่มปุ่ม #btnToggleWbsEditLock ลงใน .wbs-table-toolbar-actions มุมบนขวาถัดจากปุ่มขยายเต็มหน้าจอ 2) ใน js/wbs.js: นำ case "planClose" และ case "note" ออกจากการสร้าง headerMetricHtml ใน renderWbsTableHead() 3) ใน js/wbs.js: ปรับปรุง updateWbsEditLockUI() ให้อัปเดตข้อความปุ่มบนขวาเป็น "🔒 ล็อคเอกสารปิดงาน" และ "🔓 ปลดล็อคแล้ว (Admin)" 4) ใน css/styles.css: ปรับปรุงสไตล์ .btn-wbs-lock ให้มี padding 0.35rem 0.75rem, border-radius 8px, font-size 0.80rem พอดีสมส่วนกับปุ่มแถบเครื่องมือด้านบน 5) ใน index.html: อัปเดต Cache Buster เป็น ?v=20261026_1630 6) บันทึกประวัติลงใน BASE_AUDIT_LOGS',
      sourceFile: 'คำสั่งผู้ใช้งาน (ล็อคเอกสารปิดงาน ไว้บนขวา และเหลืออันเดียว พร้อมรูปภาพกากบาทและลูกศรชี้ขึ้นบนขวา)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (จัดระเบียบหัวตาราง WBS ให้สะอาดตา และวางปุ่มควบคุมการล็อกในตำแหน่งบนขวาที่เข้าถึงง่ายและชัดเจน)'
    },
    {
      id: 'log_000_achieve_target_text_styled_matching_title_image',
      timestamp: '2026-10-26 16:20:00',
      timestampTh: '26 ต.ค. 2569, 16:20 น.',
      type: 'EDIT',
      typeBadge: 'ปรับลักษณะสี/แบบอักษรบรรลุเป้าหมายตามรูป',
      badgeClass: 'badge-type-edit',
      title: 'ปรับข้อความ "บรรลุเป้าหมาย" ให้มีลักษณะ สี และแบบอักษรตรงตามรูปภาพหัวข้อเกณฑ์วัด 100%',
      targetSubject: 'ข้อความ "บรรลุเป้าหมาย" เหนือแท่งกราฟที่ผ่านเกณฑ์ ธ.ค. 69 (#criteriaComparisonChart ใน js/chart.js)',
      storageFile: 'js/chart.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "บรรลุเป้าหมาย ลักษณะ สี/แบบอักษร/ ตามรูป" (ภาพข้อความหัวข้อเกณฑ์วัด): 1) กำหนดแบบอักษรเป็นฟอนต์ "Prompt" น้ำหนัก 800 (ExtraBold) เหมือนกับหัวข้อเกณฑ์วัด 2) ปรับสีตัวอักษรเป็นโทนสีทอง PEA Luxury Gold แบบ Linear Gradient 135 องศา ตามหัวข้อเป๊ะ (#FFF3B3 0% -> #FFD25A 38% -> #FFB81C 72% -> #F59E0B 100%) 3) นำเส้นขอบดำเข้มแบบหนาออกทั้งหมด และใช้เงาเรืองแสงสีทองนุ่มนวลแบบ drop-shadow(0 2px 8px rgba(255, 184, 28, 0.45)) ตามสไตล์ของรูปภาพ 4) นำเครื่องหมายถูก (✓) ด้านหน้าออก ให้แสดงเฉพาะข้อความ "บรรลุเป้าหมาย" จัดกึ่งกลางตรงใต้ฐานมงกุฎทองคำ 👑 อย่างสง่างามลงตัว',
      details: '1) ใน js/chart.js: เปลี่ยน achieveText เป็น "บรรลุเป้าหมาย", กำหนด ctx.font = "800 ${fSize}px \'Prompt\', \'Sarabun\', sans-serif", คำนวณ Linear Gradient 135 องศาด้วย 4 สีตรงตาม CSS ของ #criteriaComparisonTitle (.criteria-title-full), วาดเงา drop-shadow สีทองนุ่มนวล rgba(255, 184, 28, 0.45) blur 8px offsetY 2px ตามด้วยการวาดแกนตัวหนังสือคมชัดระดับพิกเซล 2) ใน index.html: อัปเดต Cache Buster เป็น ?v=20261026_1620 3) บันทึกประวัติลงใน BASE_AUDIT_LOGS',
      sourceFile: 'คำสั่งผู้ใช้งาน (บรรลุเป้าหมาย ลักษณะ สี/แบบอักษร/ ตามรูป พร้อมรูปภาพหัวข้อเกณฑ์วัด)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงข้อความบรรลุเป้าหมายให้มีสไตล์ สี และแบบอักษรกลมกลืนเป็นเอกภาพระดับพรีเมียมตรงตามรูป)'
    },
    {
      id: 'log_000_wbs_pencil_compact_single_button_per_row',
      timestamp: '2026-10-26 16:15:00',
      timestampTh: '26 ต.ค. 2569, 16:15 น.',
      type: 'EDIT',
      typeBadge: 'ปรับแต่งปุ่มดินสอแก้ไขแถว WBS',
      badgeClass: 'badge-type-edit',
      title: 'ลดขนาดรูปดินสอ และปรับให้เหลือปุ่มแก้ไขเพียงอันเดียวต่อแถวในตาราง WBS',
      targetSubject: 'ปุ่มดินสอแก้ไขแผนปิดงาน/หมายเหตุในตาราง WBS (#wbsDataTable: คอลัมน์ แผนปิดงาน planClose และ หมายเหตุ note ใน js/wbs.js และ css/styles.css)',
      storageFile: 'js/wbs.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ลดขนาดรูปดินสอ ให้เหลือคงเดียว" (รูปภาพวงกลมสีแดงรอบรูปดินสอ 2 อันในคอลัมน์แผนปิดงานและหมายเหตุ): 1) ตัดปุ่มดินสอในคอลัมน์ "แผนปิดงาน (G-SHEET)" ออกทั้งหมด เพื่อไม่ให้มีปุ่มซ้ำซ้อน 2) คงเหลือปุ่มดินสอแก้ไขไว้เพียงจุดเดียวต่อแถว คือที่คอลัมน์ "หมายเหตุ (G-SHEET)" ท้ายแถวอย่างสมบูรณ์แบบ 3) ปรับลดขนาดกล่องปุ่มดินสอลงจากเดิม 26x24px เหลือขนาดกะทัดรัด 17x17px มน 4px 4) ปรับย่อขนาดรูปไอคอนดินสอ ✏️ ลงเหลือ 0.58rem (scale 0.82) ให้แลดูประณีต มินิมอล สบายตา และประหยัดพื้นที่คอลัมน์ได้อย่างลงตัว 5) เพิ่มความสะดวกโดยสามารถคลิกที่ป้ายวันที่แผนปิดงาน 📅 ได้โดยตรงเพื่อเปิดหน้าต่างแก้ไขเช่นเดียวกัน',
      details: '1) ใน js/wbs.js: ใน renderWbsTable case "planClose" นำปุ่ม <button class="${editBtnClass}"> ออกทั้งหมด โดยคงเหลือเฉพาะป้ายวันที่แผนปิดงาน พร้อมเพิ่ม cursor: pointer สำหรับเปิดหน้าต่างแก้ไขได้โดยตรง, ใน case "note" คงปุ่มแก้ไขไว้เพียงอันเดียว 2) ใน js/wbs.js: ครอบไอคอน ✏️ และ 🔒 ใน <span class="pencil-icon"> และ <span class="lock-icon"> เพื่อควบคุมขนาดได้อย่างแม่นยำ 3) ใน css/styles.css: ปรับปรุง .btn-wbs-inline-edit ให้มีขนาด 17x17px (เดิมไม่ล็อคขนาด มี padding หนา), border-radius 4px, และเพิ่มคลาส .pencil-icon กำหนด font-size: 0.58rem และ transform: scale(0.82) 4) ใน index.html: อัปเดต Cache Buster เป็น ?v=20261026_1615 5) บันทึกประวัติลงใน BASE_AUDIT_LOGS',
      sourceFile: 'คำสั่งผู้ใช้งาน (ลดขนาดรูปดินสอ ให้เหลือคงเดียว พร้อมรูปภาพวงกลมสีแดง)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (จัดระเบียบตาราง WBS ให้สะอาดตา ลดความซ้ำซ้อนของปุ่มแก้ไข และทำให้คอลัมน์แผนปิดงานกะทัดรัดขึ้น)'
    },
    {
      id: 'log_000_achieve_target_text_bright_radiant_gold_crystal_sharp',
      timestamp: '2026-10-26 16:05:00',
      timestampTh: '26 ต.ค. 2569, 16:05 น.',
      type: 'EDIT',
      typeBadge: 'ปรับแต่งข้อความบรรลุเป้าหมาย',
      badgeClass: 'badge-type-edit',
      title: 'ปรับข้อความบรรลุเป้าหมายบนกราฟเกณฑ์วัด: เพิ่มขนาดอักษร คมชัดระดับพิกเซล อ่านง่ายไม่มั่ว และเปลี่ยนเป็นสีเหลืองทองอร่ามแจ่มๆ',
      targetSubject: 'ข้อความและป้าย "✓ บรรลุเป้าหมาย" เหนือแท่งกราฟ 8 เกณฑ์วัด (criteriaComparisonChart ใน js/chart.js)',
      storageFile: 'js/chart.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "บรรบลุเป้าหมาย เพิ่มขนาดอักษร และให้อ่านง่ายไม่มั่วแบบนี้ และเปลี่ยนเป็นสีเหลืองทองอร่ามแจ่มๆ": 1) ขยายขนาดตัวอักษร "✓ บรรลุเป้าหมาย" ขึ้นเป็น 12.5px (ตัวหนา 800) เด่นชัดเต็มตา 2) แก้ไขปัญหาตัวอักษรเบลอมัวจากการใช้ shadowBlur ขนาดใหญ่ โดยเปลี่ยนมาใช้เทคนิค Crisp Dark Outline (เส้นขอบสีดำเข้มคมกริบ 3.2px) ล้อมรอบทุกตัวอักษรและสระภาษาไทย ทำให้อ่านง่าย คมชัด 100% ไม่มัว 3) ปรับเปลี่ยนสีตัวอักษรเป็นสีเหลืองทองอร่ามแจ่มๆ ด้วย Luxury Radiant Gold 4-stop Linear Gradient (#FFFFFF -> #FFF77A -> #FFD700 -> #FF9E0D) พร้อมออร่าสีทองเปล่งประกายนุ่มนวลรอบนอก และไฮไลต์แกนอักษรชั้นบนสุด เข้าชุดกับมงกุฎทองคำ 👑 อย่างลงตัวสง่างาม',
      details: '1) ใน js/chart.js: ขยาย fSize เริ่มต้นเป็น 12.5px (เดิม 8.8-9.8px) และรองรับ maxTextW กว้างขึ้น, ปรับ achieveBadgeH เป็น 18px 2) ใช้ ctx.strokeText() ด้วยสีดำเข้ม rgba(8, 12, 22, 0.95) ความหนา 3.2px เพื่อตัดขอบตัวหนังสือให้คมชัดสูง 3) ใช้ ctx.createLinearGradient() 4 โทนสีทองหรูหรา (#FFFFFF, #FFF77A, #FFD700, #FF9E0D) พร้อมออร่าทอง shadowBlur 3.5px 4) วาดซ้ำด้วยแกนอักษรทองสว่างปิด shadowBlur เพื่อความคมชัดระดับพิกเซล 5) ใน index.html: อัปเดต Cache Buster ของ chart.js และ data_history.js เป็น ?v=20261026_1605 6) บันทึกประวัติลงใน BASE_AUDIT_LOGS',
      sourceFile: 'คำสั่งผู้ใช้งาน (บรรบลุเป้าหมาย เพิ่มขนาดอักษร และให้อ่านง่ายไม่มั่วแบบนี้ และเปลี่ยนเป็นสีเหลืองทองอร่ามแจ่มๆ)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ยกระดับความคมชัดของข้อความบรรลุเป้าหมายให้อ่านง่าย 100% ตัวใหญ่ชัดเจน และสีเหลืองทองอร่ามงดงาม)'
    },
    {
      id: 'log_000_wbs_col_id_rename_to_thi_and_compact_10cols_fitting',
      timestamp: '2026-10-26 15:50:00',
      timestampTh: '26 ต.ค. 2569, 15:50 น.',
      type: 'EDIT',
      typeBadge: 'เปลี่ยนชื่อคอลัมน์เป็น ที่ & ปรับเต็มจอ 10 คอลัมน์',
      badgeClass: 'badge-type-edit',
      title: 'เปลี่ยนชื่อคอลัมน์ ลำดับ เป็น "ที่" และปรับลดขนาดความกว้างให้แสดงผลเต็มจอครบทั้ง 10 คอลัมน์โดยไม่ถูกตัดขอบ',
      targetSubject: 'ตารางข้อมูล WBS (#wbsDataTable ใน js/wbs.js และ css/styles.css)',
      storageFile: 'js/wbs.js, css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ลดขนาดคอลัม ลำดับ และปรับให้เห็นเต็มจอทั้ง 10 คอลัม" และ "เปลี่ยน ลำดับ เป็น ที่": 1) เปลี่ยนชื่อหัวคอลัมน์จาก "ลำดับ" เป็น "ที่" เพื่อความกระชับ สวยงาม และตรงเป้าหมาย 2) ลดความกว้างคอลัมน์ "ที่" ลงเหลือ 38px (เดิม 55px-120px) พร้อม padding กะทัดรัด 2px พอดีกับตัวเลขลำดับ 3) ปรับปรุงความกว้างขั้นต่ำ (minWidth) ของทั้ง 10 คอลัมน์เริ่มต้นให้สมส่วนลงตัว ไม่เบียด ไม่ดันล้นจอ 4) ปรับ padding ของเซลล์ในตาราง WBS ให้กระชับ (0.52rem 0.45rem) 5) ปิด pseudo-element ::after ของ th.sort-active ที่แสดงผลลูกศรซ้ำซ้อนใต้ชื่อคอลัมน์ 6) ตรวจสอบและปรับปรุงให้สามารถมองเห็นครบทั้ง 10 คอลัมน์บนหน้าจอมาตรฐานได้อย่างสมบูรณ์แบบโดยไม่ต้องเลื่อนสไลด์แนวนอน',
      details: '1) ใน js/wbs.js: แก้ไข WBS_COL_DEFS ให้คอลัมน์ id มี label: "ที่", width: "38px", minWidth: "35px", maxWidth: "42px", ปรับ minWidth ของคอลัมน์ wbs (160px), office (120px), description (155px), statusSap (100px), cn41ActualCost (122px), pctMatWithdraw (78px), pctExpenseWithdraw (78px), planClose (115px), note (135px), ปรับ header styleStr และ data row cells ให้ล็อคความกว้างคอลัมน์ "ที่" 38px 2) ใน css/styles.css: ปรับปรุง .wbs-note-cell ให้ min-width: 120px, เพิ่ม CSS Rules สำหรับ #wbsDataTable ปรับ padding เซลล์ th/td ให้กระชับ, ซ่อน ::after ของ sort-active, และกำหนดความกว้างคอลัมน์ที่อย่างแม่นยำ 3) ใน index.html: อัปเดต Version Cache Buster เป็น ?v=20261026_1550 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS',
      sourceFile: 'คำสั่งผู้ใช้งาน (ลดขนาดคอลัม ลำดับ และปรับให้เห็นเต็มจอทั้ง 10 คอลัม / เปลี่ยน ลำดับ เป็น ที่)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (เพิ่มพื้นที่การแสดงผลข้อมูล ทำให้ผู้ใช้งานมองเห็นตาราง WBS ครบทั้ง 10 คอลัมน์สำคัญได้ในมุมมองเดียว)'
    },
    {
      id: 'log_000_achieve_target_text_glowing_green_noborder',
      timestamp: '2026-10-26 15:40:00',
      timestampTh: '26 ต.ค. 2569, 15:40 น.',
      type: 'EDIT',
      typeBadge: 'ปรับแต่งข้อความบรรลุเป้าหมาย',
      badgeClass: 'badge-type-edit',
      title: 'ปรับข้อความบรรลุเป้าหมายบนกราฟเกณฑ์วัด: แสดงอักษรสีเขียวเรืองแสง คมชัด โดยไม่มีเส้นขอบและไม่มีพื้นหลัง',
      targetSubject: 'ข้อความและป้ายบรรลุเป้าหมายบนแท่งกราฟ 8 เกณฑ์วัด (criteriaComparisonChart ใน js/chart.js)',
      storageFile: 'js/chart.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "บรรลุเป้าหมาย ให้แสดงอักษรสีเขียวเรืองเเสง ไม่ต้องมีเส้นขอบ และพื้นหลัง": 1) นำกล่องพื้นหลังสี่เหลี่ยมมน (gradient emerald background) และเส้นขอบสีเขียวนีออน (border stroke) ออกทั้งหมด 2) แสดงเฉพาะข้อความ "✓ บรรลุเป้าหมาย" ด้วยตัวอักษรสีเขียวนีออนเรืองแสง (#00FF88) พร้อมแสงออร่าเรืองแสง (shadowBlur 9) และแกนตัวอักษรสีเขียวมรกตสว่าง (#66FFAA) อ่านง่าย คมชัด โดดเด่น สบายตา เข้ากับมงกุฎทองคำ 👑 ที่ลอยอยู่ด้านบนอย่างลงตัว',
      details: '1) ใน js/chart.js: ในส่วนวาดป้าย Goal Achieved สำหรับแท่งที่ผ่านเป้าหมาย ธ.ค. 69 (ext.isExceedDecKpi): ตัดโค้ดการวาด achieveGrad, this.roundRect(), ctx.fill() และ ctx.stroke() ออก 2) ปรับการวาดข้อความ achieveText เป็น 2-pass Neon Green Rendering (Pass 1: สี #00FF88 พร้อม shadowBlur 9 เรืองแสงรอบตัวอักษร / Pass 2: สี #66FFAA เพื่อให้ตัวหนังสือคมชัดสูงอ่านง่าย) 3) ใน index.html: อัปเดต Version Cache Buster ของ chart.js และ data_history.js เป็น ?v=20261026_1540 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS ตามข้อบังคับ',
      sourceFile: 'คำสั่งผู้ใช้งาน (บรรลุเป้าหมาย ให้แสดงอักษรสีเขียวเรืองเเสง ไม่ต้องมีเส้นขอบ และพื้นหลัง)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงการแสดงผลข้อความบรรลุเป้าหมายให้โปร่งโล่ง สวยงาม สบายตา ไม่ทึบตัน และคมชัด)'
    },
    {
      id: 'log_000_overview_cards_border_styled_like_img13',
      timestamp: '2026-10-26 15:20:00',
      timestampTh: '26 ต.ค. 2569, 15:20 น.',
      type: 'EDIT',
      typeBadge: 'ปรับสีขอบการ์ดตามรูป 13',
      badgeClass: 'badge-type-edit',
      title: 'ปรับแต่งสีขอบการ์ดในเมนูภาพรวมผู้บริหาร (Overview) ให้มีขอบทองเรืองแสงและเส้นแสงนีออนหลากสีตามรูป 13',
      targetSubject: 'การ์ดทั้งหมดในเมนูภาพรวมผู้บริหาร (#tab-dashboard: #topSelectionStrip, #executiveDonutKpiCard, #topCriteriaChartCard, #unifiedProjectionOfficeCard, .content-card)',
      storageFile: 'css/styles.css, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "เปลี่ยนสีขอบการ์ดตามรูป 13 ในการ์ด เมนูภาพรวมผู้บริหาร": 1) ปรับสีขอบการ์ดทุกใบในหน้าภาพรวมผู้บริหารเป็นเส้นขอบสีทองเรืองแสง (border: 1.5px solid rgba(255, 184, 28, 0.42)) โค้งมน 16px พร้อมแสงเงาพรีเมียม (box-shadow 0 10px 30px) 2) เพิ่มเส้นแถบแสงนีออน Gradient 3px ที่ขอบบนของการ์ดตามรูป 13 โดยการ์ดฝั่งซ้ายใช้โทนทอง-เขียว-ชมพู (Gold-Green-Pink) และการ์ดฝั่งขวาใช้โทนทอง-เขียว-ฟ้า (Gold-Green-Cyan) 3) ปรับแถบเลือกด้านบน (#topSelectionStrip) ให้มีขอบทองและแถบแสงด้านบนเข้าชุดกันอย่างหรูหรา 4) เพิ่ม Fullscreen Override ปิดขอบอัตโนมัติเมื่อเปิดโหมดเต็มจอ',
      details: '1) ใน css/styles.css: เพิ่มสไตล์กลุ่ม #tab-dashboard ให้ครอบคลุม .executive-donut-kpi-card, .top-criteria-chart-card, .unified-projection-office-card และ .content-card โดยกำหนด border: 1.5px solid rgba(255, 184, 28, 0.42) !important, border-radius: 16px, box-shadow: 0 10px 30px rgba(0,0,0,0.45), 0 0 20px rgba(104,44,145,0.25) และใส่ ::before เป็นเส้นแถบแสงนีออนไล่เฉด 3px ตามสไตล์ของรูป 13 (01 รูป/13.jpg) 2) กำหนดขอบทอง 1.5px และแถบเส้นแสงบน #topSelectionStrip 3) ใน index.html: ปรับ Cache Buster ของ styles.css เป็น ?v=20261026_1520 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS',
      sourceFile: 'คำสั่งผู้ใช้งาน (เปลี่ยนสีขอบการ์ดตามรูป 13 ในการ์ด เมนูภาพรวมผู้บริหาร และไฟล์ 01 รูป/13.jpg)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ยกระดับความสวยงาม หรูหรา พรีเมียม และสร้างเอกลักษณ์ภาพรวมแดชบอร์ดให้เป็นธีมเดียวกันทั้งระบบ)'
    },
    {
      id: 'log_000_criteria_bar_pct_enlarge_18px',
      timestamp: '2026-10-26 15:10:00',
      timestampTh: '26 ต.ค. 2569, 15:10 น.',
      type: 'EDIT',
      typeBadge: 'ขยายขนาดตัวเลข % เป็น 18.5px',
      badgeClass: 'badge-type-edit',
      title: 'ขยายขนาดตัวเลขเปอร์เซ็นต์ (%) ด้านล่างแท่งกราฟเกณฑ์วัดเป็น 18.5px เด่นชัด ชัดเจนเต็มตา',
      targetSubject: 'ขนาดตัวอักษรเปอร์เซ็นต์ % ที่ด้านล่างแท่งกราฟ 8 เกณฑ์วัด (criteriaComparisonChart ใน js/chart.js และ js/app.js)',
      storageFile: 'js/chart.js, js/app.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ปรับขนาดอักษร %" (เลือกขยายให้ใหญ่ขึ้นอีก 18px - 19px): ขยายขนาดตัวเลขเปอร์เซ็นต์ (%) จาก 15.5px เป็น 18.5px (Bold 800) ปรับความสูงพื้นที่เป็น 22px และขยายระยะปลอดภัยด้านล่างของเป้าหมาย KPI ด้านบนเป็น 50px เพื่อเว้นช่องว่างอย่างสมดุล ไม่ทับซ้อนกับดาวและตัวเลข ทำให้ตัวเลขอ่านง่าย โดดเด่น ชัดเจนเต็มตา',
      details: '1) ใน js/app.js: ปรับ barValueFontSize เป็น 18.5px และ barValueHeight เป็น 22px ใน chartOptions ของ renderCriteriaComparisonBar() 2) ใน js/chart.js: ปรับ responsive font size เริ่มต้นเป็น 18.5px (สูงสุด) พร้อมระบบ Auto-scale ป้องกันการล้นขอบ, ปรับ maxAllowedBottom และ maxAllowedY ของ target badges จาก 46 เป็น 50 เพื่อเว้นระยะห่างกับดาวและตัวเลขใหม่อย่างสมบูรณ์ 3) ใน index.html: ปรับ Cache Buster เป็น ?v=20261026_1510 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS',
      sourceFile: 'คำสั่งผู้ใช้งาน (ปรับขนาดอักษร % - เลือกขยายขนาด 18px - 19px)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ยกระดับการมองเห็นตัวเลขเปอร์เซ็นต์ความสำเร็จให้อ่านได้ชัดเจนเต็มตา สวยงามสมส่วน)'
    },
    {
      id: 'log_000_criteria_bar_pct_only_bright_gold',
      timestamp: '2026-10-26 15:00:00',
      timestampTh: '26 ต.ค. 2569, 15:00 น.',
      type: 'EDIT',
      typeBadge: 'ปรับสีอักษรทองสว่าง & ตัดชื่อเดือนคงเหลือเฉพาะ %',
      badgeClass: 'badge-type-edit',
      title: 'ปรับแต่งตัวเลข % บนแท่งกราฟเกณฑ์วัด: ตัดชื่อเดือนออกแสดงเฉพาะ % และปรับสีอักษรเป็นสีทองสว่างจ้า คมชัดสูง ไม่ทึบ ไม่มึนตา',
      targetSubject: 'ตัวเลข % ความสำเร็จที่ด้านล่างแท่งกราฟ 8 เกณฑ์วัด (criteriaComparisonChart ใน js/chart.js และ js/app.js)',
      storageFile: 'js/chart.js, js/app.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "ปรับสีอักษร สว่างๆไม่ดูทึบๆ มึนๆ" และ "เอาเดือน ออก คงเหลือ %อย่างเดียว": 1) ปรับ formatBarValue ให้ตัดชื่อเดือนออก แสดงเฉพาะตัวเลขเปอร์เซ็นต์ล้วน เช่น "91.38%", "76.49%" 2) ปรับสีตัวอักษรเป็นสีเหลืองทองสว่างสดใส (#FFF67A) ความสว่างสูง ปราศจากความทึบตัน 3) ปรับเงา Drop Shadow เป็นแบบคมชัด 1px (shadowBlur 1.5, shadowOffsetY 1) ตัดเงาฟุ้งมัวรอบตัวหนังสือออก ทำให้อ่านง่าย สบายตา คมกริบ ไม่มึนตา 4) ขยายขนาดตัวอักษรเป็น 15.5px เด่นชัด ชัดเจนสมบูรณ์แบบ',
      details: '1) ใน js/app.js: ปรับ formatBarValue ให้ส่งคืนเฉพาะ ${Number(val).toFixed(2)}% หรือ "ไม่มีงาน" โดยตัดชื่อเดือน (ก.ย.) ออกตามคำสั่ง, ปรับ barValueColor เป็น #FFF67A และ barValueFontSize เป็น 15.5px 2) ใน js/chart.js: ปรับการวาดตัวเลข % และดาว KPI ให้ใช้สีสว่างสดใส ปรับความคมชัดของเงา Drop Shadow ให้คมกริบ (blur 1.5) เพื่อกำจัดอาการเงาฟุ้งมัวเบลอ 3) ใน index.html: อัปเดต Cache Buster เป็น ?v=20261026_1500 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS',
      sourceFile: 'คำสั่งผู้ใช้งาน (ปรับสีอักษร สว่างๆไม่ดูทึบๆ มึนๆ / เอาเดือน ออก คงเหลือ %อย่างเดียว)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (เพิ่มความคมชัดและทัศนวิสัยสูงสุด ตัวเลขอ่านง่าย สบายตา ชัดเจนทุกมุมมอง)'
    },
    {
      id: 'log_000_criteria_bar_gold_text_no_card_larger_font',
      timestamp: '2026-10-26 14:48:00',
      timestampTh: '26 ต.ค. 2569, 14:48 น.',
      type: 'EDIT',
      typeBadge: 'ปรับป้าย % เดือนล่าสุดเป็นอักษรทองล้วน',
      badgeClass: 'badge-type-edit',
      title: 'ปรับแต่ง % เดือนล่าสุดบนแท่งกราฟเกณฑ์วัด: ยกเลิกการ์ดขอบทองพื้นดำ แสดงตัวอักษรสีทองล้วน ขยายขนาดตัวอักษรใหญ่ชัดเจน',
      targetSubject: 'ป้ายร้อยละความสำเร็จเดือนล่าสุดที่ด้านล่างแท่งกราฟ 8 เกณฑ์วัด (criteriaComparisonChart ใน js/chart.js และ js/app.js)',
      storageFile: 'js/chart.js, js/app.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "%เดือนล่าสุด ไม่ต้องมีการ์ดขอบทองพื้นดำ ให้แสดงอักษร สีทองอย่างเดียว และแรับขนาดอักษรให้ใหญ่ขึ้นมองชัดเจน": 1) ยกเลิกการวาดการ์ดขอบทองพื้นดำ (No card background & border) 2) แสดงเฉพาะตัวอักษรสีทองล้วน (#FFD25A) พร้อมซอฟต์โกลว์เรืองแสงและเงา Drop-shadow คมชัดเพื่อให้อ่านง่ายบนแท่งกราฟทุกสี 3) ขยายขนาดตัวอักษรให้ใหญ่ขึ้นชัดเจน (จาก 10.5px เป็น 13.8px) 4) จัดวางดาว KPI สีทองประกายระยิบระยับไว้เหนือตัวเลข % อย่างลงตัว',
      details: '1) ใน js/chart.js: เพิ่มการรองรับอ็อปชัน options.barValueNoCard ในการวาด Bar Value ล่างสุดทั้งในจุดเป้าหมายแบบรวม (Place 1) และจุดสำรอง (Place 2) โดยเมื่อเปิดใช้งานจะไม่วาดสี่เหลี่ยมขอบทองพื้นดำ (roundRect stroke/fill) แต่วาดตัวอักษรสีเหลืองทอง (#FFD25A) ล้วนด้วยขนาดใหญ่ขึ้น ปรับระบบขยายตามความกว้างแท่งกราฟ (สูงสุด 13.8px) พร้อมดับเบิลพาสด้วย Drop Shadow เงาดำลึก (rgba(0,0,0,0.98), blur 4, offsetY 1.2) และ Golden Luminous Glow เพื่อความคมชัดสูงสุดบนแท่งสีเขียว/แดง และจัดตำแหน่งดาวทองไว้เหนือข้อความ 2) ใน js/app.js: ปรับ chartOptions ของ renderCriteriaComparisonBar() เพิ่ม barValueNoCard: true, barValueFontSize: 13.8, barValueHeight: 18 3) ใน index.html: ปรับ Cache Buster เป็น ?v=20261026_1450 4) บันทึกประวัติลงใน BASE_AUDIT_LOGS',
      sourceFile: 'คำสั่งผู้ใช้งาน (%เดือนล่าสุด ไม่ต้องมีการ์ดขอบทองพื้นดำ ให้แสดงอักษร สีทองอย่างเดียว และแรับขนาดอักษรให้ใหญ่ขึ้นมองชัดเจน)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'ปานกลาง (ปรับปรุงทัศนวิสัยและความสวยงามของกราฟสรุป 8 เกณฑ์วัด ให้อ่านตัวเลขได้ชัดเจน สบายตา และดูพรีเมียม)'
    },
    {
      id: 'log_000_update_wbs_data_04_06_26oct',
      timestamp: '2026-10-26 14:15:00',
      timestampTh: '26 ต.ค. 2569, 14:15 น.',
      type: 'IMPORT',
      typeBadge: 'อัปเดตไฟล์ข้อมูล 04 & 06 WBS',
      badgeClass: 'badge-type-import',
      title: 'อัปเดตข้อมูล WBS จากไฟล์ 04 ZBUDR064 และไฟล์ 06 CN41 ล่าสุด (วันที่ 26 ต.ค. 2569)',
      targetSubject: 'ฐานข้อมูลงาน WBS คงเหลือ (js/data_wbs.js), สถานะ SAP ล่าสุด, มูลค่า AUC ล่าสุด และการคำนวณส่วนเพิ่ม/ลด AUC',
      storageFile: 'js/data_wbs.js, 04 WBS ZBUDR064 %พัสดุและค่าแรงและสถานะsap.xlsx, js/wbs.js, index.html, js/data_history.js',
      changeSummary: 'ดำเนินการตามคำสั่งผู้ใช้งาน "update ไฟล์ข้อมูล 04 WBS และ 06 WBS": 1) ในไฟล์ 04 ZBUDR064 คำนวณเพิ่มคอลัมน์ % เบิกพัสดุ (X) และ % เบิก คชจ. (Y) พร้อมบันทึกไฟล์ Excel ให้สมบูรณ์ 2) ผสานข้อมูลจากไฟล์ 04 ZBUDR064 และไฟล์ 06 CN41 มูลค่า AUC ล่าสุด วันที่ 26 ตค 69 เข้าสู่ js/data_wbs.js ครบ 2,083 รายการ (100% Match) 3) ตรวจพบสถานะ SAP เปลี่ยนแปลง 116 รายการ, มูลค่า AUC เปลี่ยนแปลง 22 รายการ และ % เบิกจ่ายพัสดุเปลี่ยนแปลง 51 รายการ 4) ยอดรวมมูลค่า AUC ล่าสุด (ไฟล์ 06) เท่ากับ 643,051,304.11 บาท (ลดลงสุทธิ -189,795.82 บาท จากยอดเริ่มต้น 14 ต.ค. 69) 5) ซิงค์หมายเหตุและแผนงานจาก Google Sheet Live API คงอยู่ครบถ้วน 6) ปรับปรุงป้ายวันที่แก้ไขล่าสุดใน index.html และ js/wbs.js เป็น 26 ต.ค. 69 ทุกจุด',
      details: '1) ใน 04 WBS ZBUDR064 %พัสดุและค่าแรงและสถานะsap.xlsx: เติมคอลัมน์ 24 (% เบิกพัสดุ) สูตร =IFERROR((M2/T2),0) และคอลัมน์ 25 (% เบิก คชจ.) สูตร =IF(V2=0,0,IFERROR(R2/V2,0)) ฟอร์แมต 0.00% 2) ใน js/data_wbs.js: รันการผสาน 4 ไฟล์ (03 Base + 04 ZBUDR064 + 05 Baseline + 06 Latest 26 ต.ค. 69) ด้วย scratch/merge_wbs_latest.ps1 สำเร็จครบ 2,083 รายการ (100% Match) โดยมีสถานะ SAP เปลี่ยนแปลง 116 งาน, มูลค่า AUC เปลี่ยนแปลง 22 งาน, % เบิกพัสดุเปลี่ยนแปลง 51 งาน 3) ยอดสะสม AUC: ไฟล์ 05 เริ่มต้น (14 ต.ค.) = 643,241,099.93 บาท, ไฟล์ 06 ล่าสุด (26 ต.ค.) = 643,051,304.11 บาท, ผลต่าง cn41CostInc รวม = -189,795.82 บาท 4) ใน index.html: อัปเดตข้อความวันที่แก้ไขล่าสุดบนหัวการ์ด WBS (wbsHeaderDatesPlain) เป็น สถานะ SAP แก้ไขล่าสุด: 26 ต.ค. 69 และ มูลค่า AUC(บาท) แก้ไขล่าสุด: 26 ต.ค. 69 5) ใน js/wbs.js: ปรับป้าย pill-file-04 และ pill-file-05 เป็นวันที่ 26 ต.ค. 2569 และอัปเดตป้ายวันที่ใต้หัวคอลัมน์ statusSap และ cn41ActualCost เป็น 26 ต.ค. 69 6) ใน js/data_history.js: อัปเดต DATA_SOURCE_CATALOG (src_04 และ src_06) และบันทึกประวัติการอัปเดตลงใน BASE_AUDIT_LOGS',
      sourceFile: '04 WBS ZBUDR064 %พัสดุและค่าแรงและสถานะsap.xlsx (อัปเดต 26 ต.ค. 2569 13:48 น.), 06 WBS CN41 มูลค่า AUC ล่าสุด วันที่ 26 ตค 69.xlsx (อัปเดต 26 ต.ค. 2569 14:05 น.)',
      author: 'ผู้ดูแลระบบ (System Admin)',
      impactLevel: 'สูง (อัปเดตฐานข้อมูลสถานะงานและมูลค่าทรัพย์สิน AUC ครบทั้งระบบ 2,083 งาน)',
    },
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
      timestampTh: '25 เธ•.เธ. 2569, 07:25 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเน€เธฅเธขเนเน€เธญเธฒเธ•เนเนเธ–เธเน€เธเธฃเธทเนเธญเธเธกเธทเธญ WBS',
      badgeClass: 'badge-type-edit',
      title: 'เธขเนเธฒเธขเนเธ–เธเน€เธเธฃเธทเนเธญเธเธกเธทเธญเธเธฑเธ”เธเธฒเธฃเธ•เธฒเธฃเธฒเธ WBS (เธชเนเธเธญเธญเธ CSV, เธเธดเธเธเน Sheet, เน€เธฅเธทเธญเธเธเธญเธฅเธฑเธกเธเน, เธเนเธญเธกเธนเธฅเนเธเนเธเธซเธเนเธฒ, เธเธขเธฒเธขเน€เธ•เนเธกเธเธญ) เธเธถเนเธเนเธเนเธงเนเธ—เธตเนเนเธ–เธงเธเธเธชเธธเธ”เธเธดเธ”เธเธงเธฒเนเธเนเธ–เธงเน€เธ”เธตเธขเธงเธเธฑเธเน€เธเธ“เธ‘เนเธงเธฑเธ”',
      targetSubject: 'เนเธ–เธเน€เธเธฃเธทเนเธญเธเธกเธทเธญเน€เธซเธเธทเธญเธ•เธฒเธฃเธฒเธ WBS (#wbsTableCard .wbs-table-top-meta-bar)',
      storageFile: 'index.html, css/styles.css, js/data_history.js',
      changeSummary: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "เธขเนเธฒเธขเธ—เธตเน เธงเธเธเธฅเธก เนเธ–เธงเธเธเธเธดเธ”เธเธงเธฒ" เธเธฃเนเธญเธกเธ เธฒเธเธฅเธนเธเธจเธฃเธเธตเนเธเธถเนเธเธเธงเธฒ: เธฃเธงเธกเนเธ–เธเน€เธเธฃเธทเนเธญเธเธกเธทเธญ (เธเธธเนเธกเธชเนเธเธญเธญเธ CSV, เธเธธเนเธกเธเธดเธเธเน Google Sheet, เน€เธกเธเธนเน€เธฅเธทเธญเธเธเธญเธฅเธฑเธกเธเน, เธเนเธญเธเธงเธฒเธกเธชเธ–เธดเธ•เธดเธเธฒเธฃเนเธเนเธเธซเธเนเธฒ, เธ•เธฑเธงเน€เธฅเธทเธญเธเนเธ–เธงเธ•เนเธญเธซเธเนเธฒ เนเธฅเธฐเธเธธเนเธกเธเธขเธฒเธขเน€เธ•เนเธกเธเธญ) เธเธถเนเธเนเธเธเธฑเธ”เธงเธฒเธเนเธเนเธ–เธงเธเธเธชเธธเธ” (.wbs-table-top-meta-bar) เนเธ”เธขเธเธฑเธ”เธ•เธณเนเธซเธเนเธเธเธดเธ”เธเธงเธฒ (justify-content: flex-end) เธญเธขเธนเนเนเธ–เธงเน€เธ”เธตเธขเธงเธเธฑเธเธเนเธฒเธขเน€เธเธ“เธ‘เนเธงเธฑเธ” (เธเธฑเนเธเธเนเธฒเธข) เธขเธธเธเธฃเธงเธกเนเธ–เธงเน€เธเธฃเธทเนเธญเธเธกเธทเธญเน€เธ”เธดเธกเธฅเธเนเธ”เน 1 เนเธ–เธง เน€เธเธดเนเธกเธเธทเนเธเธ—เธตเนเนเธชเธ”เธเนเธ–เธงเธ•เธฒเธฃเธฒเธเธเนเธญเธกเธนเธฅ WBS เนเธซเนเธเธงเนเธฒเธเธเธงเธฒเธ เธชเธเธฒเธขเธ•เธฒ เนเธฅเธฐเธกเธตเธเธฃเธฐเธชเธดเธ—เธเธดเธ เธฒเธเธชเธนเธเธชเธธเธ”',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "เธขเนเธฒเธขเธ—เธตเน เธงเธเธเธฅเธก เนเธ–เธงเธเธเธเธดเธ”เธเธงเธฒ": 1) เนเธ index.html เธฃเธงเธก .table-header-bar เน€เธเนเธฒเธเธฑเธ .wbs-table-top-meta-bar เนเธซเนเน€เธเนเธเนเธ–เธงเธเธเธชเธธเธ”เนเธ–เธงเน€เธ”เธตเธขเธง เนเธ”เธขเธเธฑเนเธเธเนเธฒเธขเธเธเธเนเธฒเธข .wbs-table-active-criteria (๐“ เน€เธเธ“เธ‘เนเธงเธฑเธ”) เนเธฅเธฐเธเธฑเนเธเธเธงเธฒเธฃเธงเธกเธเธธเนเธกเธเธงเธเธเธธเธกเธ—เธฑเนเธเธซเธกเธ”เนเธ .wbs-table-toolbar-actions 2) เนเธ css/styles.css เน€เธเธดเนเธกเธชเนเธ•เธฅเน .wbs-table-toolbar-actions เนเธซเนเธกเธต display: flex; align-items: center; gap: 0.55rem; flex-wrap: wrap; justify-content: flex-end; margin-left: auto; 3) เธเธ ID เนเธฅเธฐเธเธฑเธเธเนเธเธฑเธเธเธญเธเธเธธเนเธก/เธ•เธฑเธงเน€เธฅเธทเธญเธเน€เธ”เธดเธกเธเธฃเธเธ–เนเธงเธ 100% 4) เธญเธฑเธเน€เธ”เธ• Version Cache Buster เนเธ index.html เน€เธเนเธ ?v=20261025_0725',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธขเนเธฒเธขเธ—เธตเน เธงเธเธเธฅเธก เนเธ–เธงเธเธเธเธดเธ”เธเธงเธฒ เธเธฃเนเธญเธกเธ เธฒเธเธฃเธฐเธเธธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธเน€เธฅเธขเนเน€เธญเธฒเธ•เนเธ•เธฒเธฃเธฒเธ WBS เนเธซเนเธเธฃเธฐเธเธฑเธ เธเธฃเธฐเธซเธขเธฑเธ”เธเธทเนเธเธ—เธตเนเนเธเธงเธ•เธฑเนเธ เนเธฅเธฐเนเธชเธ”เธเนเธ–เธงเธเนเธญเธกเธนเธฅเนเธ”เนเธกเธฒเธเธเธถเนเธ)',
    },
    {
      id: 'log_000_wbs_kpi_card_adjust_font_fit',
      timestamp: '2026-10-25 07:20:00',
      timestampTh: '25 เธ•.เธ. 2569, 07:20 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธเธเธฒเธ”เธญเธฑเธเธฉเธฃเนเธกเนเนเธซเนเธฅเนเธเธเธฒเธฃเนเธ”',
      badgeClass: 'badge-type-edit',
      title: 'เธเธฃเธฑเธเธเธเธฒเธ”เธ•เธฑเธงเธญเธฑเธเธฉเธฃเนเธฅเธฐเธ•เธฑเธงเน€เธฅเธเนเธเธเธฒเธฃเนเธ”เธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ & เธเธฒเธ AUC เธซเธเนเธฒ WBS เนเธกเนเนเธซเนเน€เธเธดเธเธเธญเธเธเธฒเธฃเนเธ”',
      targetSubject: 'เธเธฒเธฃเนเธ”เธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ & เธเธฒเธ AUC เธซเธเนเธฒ WBS (#wbsExecutiveDonutKpiCard)',
      storageFile: 'css/styles.css, js/data_history.js, index.html',
      changeSummary: 'เธเธฃเธฑเธเธเธเธฒเธ”เธ•เธฑเธงเน€เธฅเธเธกเธนเธฅเธเนเธฒ (.wbs-val-number) เน€เธเนเธ 0.88rem, เธเนเธฒเธขเธซเธเนเธงเธขเธฅเนเธฒเธเธเธฒเธ— (.wbs-val-mb-pill) เน€เธเนเธ 0.65rem, เธเธณเธเธณเธซเธเนเธฒ (.wbs-val-prefix) เน€เธเนเธ 0.70rem เนเธฅเธฐเธเธฃเธฑเธเธเธเธฒเธ”เธเธงเธฒเธกเธเธงเนเธฒเธเธเธฒเธฃเนเธ”เน€เธเนเธ 335px เธเธฃเนเธญเธกเธเธขเธฒเธขเธเธทเนเธเธ—เธตเนเธ เธฒเธขเนเธเธเธฅเนเธญเธเธ•เธฑเธงเน€เธฅเธ เน€เธเธทเนเธญเนเธซเนเธ•เธฑเธงเน€เธฅเธเธขเธญเธ”เน€เธ•เนเธกเธซเธฅเธฑเธเธเธฑเธเธฅเนเธฒเธเนเธฅเธฐเธเนเธฒเธขเธฅเนเธฒเธเธเธฒเธ—เนเธชเธ”เธเธเธฅเธญเธขเธนเนเธ เธฒเธขเนเธเธเธญเธเธเธฒเธฃเนเธ”เธญเธขเนเธฒเธเธชเธงเธขเธเธฒเธก เนเธกเนเธฅเนเธเธเธญเธ 100%',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "เธเธฃเธฑเธเธเธเธฒเธ”เธญเธฑเธเธฉเธฃ เธ•เธฑเธงเน€เธฅเธ เนเธกเนเนเธซเนเน€เธเธดเธเธเธฒเธฃเนเธ”" เธเธฃเนเธญเธกเธ เธฒเธเธฃเธฐเธเธธเธงเธเธเธฅเธกเธชเธตเนเธ”เธเธ—เธตเนเธเธฃเธฃเธ—เธฑเธ”เธกเธนเธฅเธเนเธฒ 2 เธเธธเธ”: 1) เนเธ css/styles.css เธเธฃเธฑเธเธเธเธฒเธ” .wbs-val-number เธเธฒเธ 1.10rem เน€เธเนเธ 0.88rem เธเธฃเนเธญเธก letter-spacing: -0.025em 2) เธเธฃเธฑเธเธเธเธฒเธ” .wbs-val-mb-pill เธเธฒเธ 0.72rem เน€เธเนเธ 0.65rem เธเธฃเนเธญเธก padding 1px 4px 3) เธเธฃเธฑเธเธเธเธฒเธ” .wbs-val-prefix เน€เธเนเธ 0.70rem 4) เธเธฃเธฑเธ .wbs-val-line เนเธซเนเธกเธต width: 100%, box-sizing: border-box เนเธฅเธฐ gap: 3px 5) เธเธฃเธฑเธ .wbs-box-title-wrap เนเธฅเธฐ .wbs-card-metric-job-badge เนเธซเนเธกเธตเธฃเธฐเธขเธฐเธซเนเธฒเธเธเธญเธ”เธตเนเธกเนเธเธเธเธฑเธ 6) เธเธฃเธฑเธเธเธเธฒเธ”เธเธงเธฒเธกเธเธงเนเธฒเธเธเธญเธฅเธฑเธกเธเนเธเธฒเธฃเนเธ” .wbs-side-summary-col เน€เธเนเธ width: 335px เนเธฅเธฐเธเธฃเธฑเธ padding เธเธฒเธฃเนเธ”เน€เธเนเธ 0.85rem 0.80rem 7) เธญเธฑเธเน€เธ”เธ• Version Cache Buster เนเธ index.html เน€เธเนเธ ?v=20261025_0720 8) เธ—เธ”เธชเธญเธเน€เธฃเธเน€เธ”เธญเธฃเนเนเธฅเธฐเธเธฑเธเธ เธฒเธเธซเธเนเธฒเธเธญ เธขเธทเธเธขเธฑเธเธงเนเธฒเธ•เธฑเธงเน€เธฅเธเธซเธฅเธฑเธเธเธฑเธเธฅเนเธฒเธเนเธฅเธฐเธเนเธฒเธข เธฅเธ. เธญเธขเธนเนเนเธเธเธฃเธญเธเน€เธฃเธตเธขเธเธฃเนเธญเธขเธชเธงเธขเธเธฒเธกเธชเธกเธเธนเธฃเธ“เนเนเธเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธเธฃเธฑเธเธเธเธฒเธ”เธญเธฑเธเธฉเธฃ เธ•เธฑเธงเน€เธฅเธ เนเธกเนเนเธซเนเน€เธเธดเธเธเธฒเธฃเนเธ”)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธเน€เธฅเธขเนเน€เธญเธฒเธ•เนเนเธฅเธฐเธเธเธฒเธ”เธ•เธฑเธงเธญเธฑเธเธฉเธฃเนเธซเนเธเธญเธ”เธตเธเธฑเธเธเธฒเธฃเนเธ” เธญเนเธฒเธเธเนเธฒเธข เธเธกเธเธฑเธ” เธชเธงเธขเธเธฒเธกเธฃเธฐเธ”เธฑเธเธเธฃเธตเน€เธกเธตเธขเธก)',
    },
    {
      id: 'log_000_revert_kpi_month_bar_orange_amber_bg',
      timestamp: '2026-10-25 07:16:00',
      timestampTh: '25 เธ•.เธ. 2569, 07:16 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธทเธเธเนเธฒเธชเธตเน€เธ”เธดเธกเนเธ–เธเน€เธเนเธฒเธซเธกเธฒเธข',
      badgeClass: 'badge-type-edit',
      title: 'เธขเธเน€เธฅเธดเธเธเธฒเธฃเน€เธเธฅเธตเนเธขเธเธชเธตเธเธทเนเธเธซเธฅเธฑเธเนเธฅเธฐเธเธทเธเธเนเธฒเน€เธ”เธดเธกเน€เธเนเธเธชเธตเน€เธเธตเธขเธงเธกเธฃเธเธ•เนเธเนเธ–เธเน€เธเนเธฒเธซเธกเธฒเธขเน€เธ”เธทเธญเธ เธ.เธข. เธ—เธฑเนเธ 2 เธซเธเนเธฒเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ',
      targetSubject: 'เนเธ–เธเน€เธเนเธฒเธซเธกเธฒเธขเธ—เธตเนเธ•เนเธญเธเธเธดเธ”เธเธฒเธเน€เธเธดเนเธก (#next3mProjectionSection เนเธเธซเธเนเธฒเธ เธฒเธเธฃเธงเธก) เนเธฅเธฐเนเธ–เธเน€เธฅเธทเธญเธเธฅเธนเธเธจเธฃเน€เธเนเธฒเธซเธกเธฒเธขเน€เธ”เธทเธญเธ (#wbsKpiMonthSelector เนเธเธซเธเนเธฒ WBS เธเธเน€เธซเธฅเธทเธญ)',
      storageFile: 'css/styles.css, js/data_history.js, index.html',
      changeSummary: 'เธขเธเน€เธฅเธดเธเธเธฒเธฃเธเธฃเธฑเธเธชเธตเน€เธซเธฅเธทเธญเธเนเธชเธ” เนเธฅเธฐเธเธทเธเธเนเธฒเธชเธตเธเธทเนเธเธซเธฅเธฑเธเน€เธ”เธดเธกเธเธญเธเนเธ–เธเน€เธเนเธฒเธซเธกเธฒเธขเน€เธ”เธทเธญเธ เธ.เธข. (เน€เธเธเน€เธกเธเธ•เนเธ—เธตเน 2) เนเธซเนเธเธฅเธฑเธเน€เธเนเธเธชเธตเน€เธเธตเธขเธงเธกเธฃเธเธ• (linear-gradient #047857 -> #10B981 -> #34D399) เธ—เธฑเนเธเนเธเธซเธเนเธฒ Overview เนเธฅเธฐเธซเธเนเธฒ WBS เธเธเน€เธซเธฅเธทเธญ เธเธฃเธเธ–เนเธงเธ 100%',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "เธขเธเน€เธฅเธดเธเธเธทเนเธเธชเธตเน€เธเธตเธขเธงเน€เธซเธฅเธทเธญเธเนเธชเธ” เนเธซเนเธเธทเธเธเนเธฒเน€เธ”เธดเธก": 1) เนเธ css/styles.css เธเธทเธเธเนเธฒ .single-bar-segment.seg-2 เนเธเธซเธเนเธฒ Overview เธเธฅเธฑเธเน€เธเนเธ linear-gradient(135deg, #047857 0%, #10B981 45%, #34D399 100%) เธเธฃเนเธญเธก box-shadow เน€เธ”เธดเธก 2) เธเธทเธเธเนเธฒ .btn-wbs-kpi-month.m-seg-2 เนเธฅเธฐ .active.m-seg-2 เนเธเธซเธเนเธฒ WBS เธเธเน€เธซเธฅเธทเธญ เธเธฅเธฑเธเน€เธเนเธเนเธ—เธเธชเธตเน€เธเธตเธขเธงเธกเธฃเธเธ•เน€เธ”เธดเธก 3) เธญเธฑเธเน€เธ”เธ• Version Cache Buster เนเธ index.html เน€เธเนเธ ?v=20261025_0716',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธขเธเน€เธฅเธดเธเธเธทเนเธเธชเธตเน€เธเธตเธขเธงเน€เธซเธฅเธทเธญเธเนเธชเธ” เนเธซเนเธเธทเธเธเนเธฒเน€เธ”เธดเธก)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธทเธเธเนเธฒเธเธตเธกเธชเธตเธ”เธฑเนเธเน€เธ”เธดเธกเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธเธญเธขเนเธฒเธเธเธฅเธญเธ”เธ เธฑเธข)',
    },
    {
      id: 'log_000_kpi_month_bar_orange_amber_bg',
      timestamp: '2026-10-25 07:15:00',
      timestampTh: '25 เธ•.เธ. 2569, 07:15 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธเธฃเธธเธเธเธตเธกเธชเธตเนเธ–เธเน€เธเนเธฒเธซเธกเธฒเธข',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธฅเธตเนเธขเธเธชเธตเธเธทเนเธเธซเธฅเธฑเธเนเธ–เธเน€เธเนเธฒเธซเธกเธฒเธขเน€เธ”เธทเธญเธ เธ.เธข. (เธเธฒเธเน€เธ”เธดเธกเธชเธตเน€เธเธตเธขเธง) เน€เธเนเธเธชเธตเน€เธซเธฅเธทเธญเธเนเธชเธ” (Amber / Golden-Orange) เธชเธงเธขเธเธฒเธก เน€เธเธฅเนเธเธเธฃเธฐเธเธฒเธข เธ—เธฑเนเธเธซเธเนเธฒ Overview เนเธฅเธฐ WBS เธเธเน€เธซเธฅเธทเธญ',
      targetSubject: 'เนเธ–เธเน€เธเนเธฒเธซเธกเธฒเธขเธ—เธตเนเธ•เนเธญเธเธเธดเธ”เธเธฒเธเน€เธเธดเนเธก (#next3mProjectionSection เนเธเธซเธเนเธฒเธ เธฒเธเธฃเธงเธก) เนเธฅเธฐเนเธ–เธเน€เธฅเธทเธญเธเธฅเธนเธเธจเธฃเน€เธเนเธฒเธซเธกเธฒเธขเน€เธ”เธทเธญเธ (#wbsKpiMonthSelector เนเธเธซเธเนเธฒ WBS เธเธเน€เธซเธฅเธทเธญ)',
      storageFile: 'css/styles.css, js/data_history.js, index.html',
      changeSummary: 'เน€เธเธฅเธตเนเธขเธเธชเธตเธเธทเนเธเธซเธฅเธฑเธเธเธญเธเธเธฅเนเธญเธเน€เธเนเธฒเธซเธกเธฒเธขเน€เธ”เธทเธญเธ เธ.เธข. (เน€เธเธเน€เธกเธเธ•เนเธ—เธตเน 2) เธเธฒเธเน€เธ”เธดเธกเธ—เธตเนเน€เธเนเธเธชเธตเน€เธเธตเธขเธง เนเธซเนเน€เธเนเธเนเธ—เธเธชเธตเน€เธซเธฅเธทเธญเธเนเธชเธ” (Luminous Warm Golden Amber / Marigold) เธชเธงเธขเธเธฒเธก เนเธ”เธ”เน€เธ”เนเธ เน€เธเธฅเนเธเธเธฃเธฐเธเธฒเธข เธ—เธฑเนเธเนเธเธซเธเนเธฒเธ เธฒเธเธฃเธงเธกเธเธนเนเธเธฃเธดเธซเธฒเธฃ (Overview) เนเธฅเธฐเธซเธเนเธฒเธ•เธดเธ”เธ•เธฒเธกเธเธฒเธ WBS เธเธเน€เธซเธฅเธทเธญ (WBS Remaining) เธเธฃเนเธญเธกเธเธเธชเธตเธเธกเธเธนเธซเธงเธฒเธเนเธเน€เธ”เธทเธญเธ เธ•.เธ. เนเธฅเธฐเธชเธตเธเนเธฒเธเธฃเธฒเธกเนเธเน€เธ”เธทเธญเธ เธ.เธ. เนเธงเนเธญเธขเนเธฒเธเธเธฅเธกเธเธฅเธทเธเธฅเธเธ•เธฑเธง',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "เน€เธเธฅเธตเนเธขเธเธเธทเนเธเธชเธตเน€เธเธตเธขเธงเน€เธซเธฅเธทเธญเธเนเธชเธ” เธชเธงเธขเน เธ—เธฑเนเธ 2 เธซเธเนเธฒ" เธเธฃเนเธญเธกเธฃเธนเธเธ เธฒเธเธฃเธฐเธเธธเธงเธเธเธฅเธกเธชเธตเนเธ”เธเธ—เธตเนเธเธฅเนเธญเธ เธ.เธข. (เน€เธเธเน€เธกเธเธ•เนเธ—เธตเน 2): 1) เนเธ css/styles.css เธเธฃเธฑเธเนเธ•เนเธ .single-bar-segment.seg-2 เนเธเธซเธเนเธฒ Overview เนเธซเนเนเธเนเธเธทเนเธเธซเธฅเธฑเธ linear-gradient(135deg, #EA580C 0%, #F59E0B 40%, #FBBF24 75%, #FDE68A 100%) เนเธ—เธเธชเธตเน€เธซเธฅเธทเธญเธเนเธชเธ”เน€เธฃเธทเธญเธเนเธชเธ เธเธฃเนเธญเธก text-shadow เธเธกเธเธฑเธ”เธฅเธถเธ เนเธฅเธฐเธเธฅเนเธญเธเธเนเธฒเธขเน€เธเนเธฒเธซเธกเธฒเธข kpi-badge เนเธ—เธเธเนเธณเธ•เธฒเธฅเธญเธณเธเธฑเธเน€เธเนเธก 2) เธเธฃเธฑเธเนเธ•เนเธ .btn-wbs-kpi-month.m-seg-2 เนเธฅเธฐเธชเธ–เธฒเธเธฐเน€เธฅเธทเธญเธ .active.m-seg-2 เนเธเธซเธเนเธฒ WBS เธเธเน€เธซเธฅเธทเธญ เนเธซเนเนเธเนเน€เธเธ”เธชเธตเน€เธซเธฅเธทเธญเธเนเธชเธ”เธญเธณเธเธฑเธเน€เธเธฅเนเธเธเธฃเธฐเธเธฒเธขเน€เธเนเธฒเธเธธเธ”เธเธฑเธเธญเธขเนเธฒเธเธชเธกเธเธนเธฃเธ“เนเนเธเธ 3) เธเธฃเธฑเธเธเธฃเธธเธ Version Cache Buster เนเธ index.html เน€เธเนเธ ?v=20261025_0715',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธเธฅเธตเนเธขเธเธเธทเนเธเธชเธตเน€เธเธตเธขเธงเน€เธซเธฅเธทเธญเธเนเธชเธ” เธชเธงเธขเน เธ—เธฑเนเธ 2 เธซเธเนเธฒ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธเนเธ—เธเธชเธตเนเธ–เธเน€เธเนเธฒเธซเธกเธฒเธขเน€เธ”เธทเธญเธ เธ.เธข. เนเธซเนเธญเนเธฒเธเธเนเธฒเธข เธเธกเธเธฑเธ” เนเธ”เธ”เน€เธ”เนเธ เธชเธงเธขเธเธฒเธกเธ•เธฒเธกเธเธงเธฒเธกเธ•เนเธญเธเธเธฒเธฃเธเธญเธเธเธนเนเนเธเนเธเธฒเธ)',
    },
    {
      id: 'log_000_wbs_add_million_baht_display_and_comma',
      timestamp: '2026-10-24 23:40:00',
      timestampTh: '24 เธ•.เธ. 2569, 23:40 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธเธฃเธธเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเธ•เธฑเธงเน€เธฅเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธฃเธฑเธเธเนเธญเธเธงเธฒเธก "เน€เธเธ“เธ‘เน:" เน€เธเนเธ "เน€เธ”เธดเธก:" เนเธฅเธฐเน€เธเธดเนเธกเธเธฒเธฃเนเธชเธ”เธเธกเธนเธฅเธเนเธฒเน€เธเนเธเธซเธเนเธงเธข เธฅเนเธฒเธเธเธฒเธ— (เธฅเธ.) เธเธฃเนเธญเธกเนเธชเนเน€เธเธฃเธทเนเธญเธเธซเธกเธฒเธขเธเธธเธฅเธ เธฒเธ (,) เธเธฃเธเธ—เธธเธเธเธธเธ”เนเธเธเธฒเธฃเนเธ” WBS',
      targetSubject: 'เธเธฒเธฃเนเธ”เธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ & เธเธฒเธ AUC เธซเธเนเธฒ WBS (#wbsExecutiveDonutKpiCard)',
      storageFile: 'js/wbs.js, css/styles.css, js/data_history.js, index.html',
      changeSummary: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธเธญ: 1) เธเธฃเธฑเธเธเนเธญเธเธงเธฒเธก "เน€เธเธ“เธ‘เน:" เนเธเธเธฅเนเธญเธเธกเธนเธฅเธเนเธฒเธเธดเธ”เธเธฒเธเนเธฅเนเธง เน€เธเนเธ "เน€เธ”เธดเธก:" เนเธซเนเธชเธญเธ”เธเธฅเนเธญเธเธเธฑเธเธเธฅเนเธญเธเธ”เนเธฒเธเธเธ 2) เน€เธเธดเนเธกเธเธฒเธฃเนเธชเธ”เธเธเธฅเธซเธเนเธงเธขเธฅเนเธฒเธเธเธฒเธ— (เธฅเธ.) เธ•เนเธญเธ—เนเธฒเธขเธ•เธฑเธงเน€เธฅเธเธกเธนเธฅเธเนเธฒเธซเธฅเธฑเธเธ—เธฑเนเธ 2 เธชเนเธงเธ: (2,231.24 เธฅเธ.) เนเธฅเธฐ (1,598.25 เธฅเธ.) 3) เนเธชเนเน€เธเธฃเธทเนเธญเธเธซเธกเธฒเธขเธเธธเธฅเธ เธฒเธ (,) เนเธซเนเธเธฑเธเธ•เธฑเธงเน€เธฅเธเธ—เธธเธเธเธณเธเธงเธเนเธเธเธฒเธฃเนเธ”เธญเธขเนเธฒเธเธ–เธนเธเธ•เนเธญเธเนเธฅเธฐเธชเธงเธขเธเธฒเธก เธเธฃเนเธญเธกเธเธฃเธฑเธเน€เธฅเธขเนเน€เธญเธฒเธ•เนเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เนเธ•เนเนเธ—เนเธเธเธฃเธฒเธเน€เธเนเธ sub-stacked 2 เนเธ–เธงเธชเธกเธเธนเธฃเธ“เนเนเธเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "เนเธเนเน€เธเนเธ เน€เธ”เธดเธก เนเธฅเธฐเนเธเธเธฒเธฃเนเธ”เธเธตเน เธ•เธฑเธงเน€เธฅเธเนเธเน , เน€เธเธดเนเธกเธเธฒเธฃเนเธชเธ”เธ เน€เธเนเธ เธฅเธ.เธ”เนเธงเธข เนเธฅเธฐเธกเธต ,": 1) เนเธ js/wbs.js เธเธฃเธฑเธ wbsBaseDetail เธเธฒเธ "เน€เธเธ“เธ‘เน:" เน€เธเนเธ "เน€เธ”เธดเธก: 1,589.20 เธฅเธ." เนเธฅเธฐ "(8,100 เธเธฒเธ)" เธเธฃเนเธญเธกเนเธชเนเน€เธเธฃเธทเนเธญเธเธซเธกเธฒเธขเธเธธเธฅเธ เธฒเธ 2) เน€เธเธดเนเธกเธเธญเธกเนเธเน€เธเธเธ•เน .wbs-val-mb-pill (#wbsKpiTotalValMb, #wbsKpiClosedValMb) เนเธชเธ”เธเธขเธญเธ”เน€เธเนเธเธซเธเนเธงเธขเธฅเนเธฒเธเธเธฒเธ— เน€เธเนเธ (2,231.24 เธฅเธ.) เนเธฅเธฐ (1,598.25 เธฅเธ.) 3) เนเธ css/styles.css เน€เธเธดเนเธกเธชเนเธ•เธฅเน .wbs-val-mb-pill, .pill-green, เนเธฅเธฐเนเธเธฃเธเธชเธฃเนเธฒเธ .wbs-box-sub.sub-stacked เน€เธเธทเนเธญเนเธซเนเธเนเธญเธกเธนเธฅเน€เธ”เธดเธกเนเธฅเธฐ SAP เนเธชเธ”เธเน€เธเนเธ 2 เนเธ–เธงเน€เธฃเธตเธขเธเธฃเนเธญเธขเธชเธงเธขเธเธฒเธกเนเธกเนเธ•เธฑเธ”เธเธฃเธฃเธ—เธฑเธ” 4) เธญเธฑเธเน€เธ”เธ• Version Cache Buster เนเธ index.html เน€เธเนเธ ?v=20261024_2340',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธเนเน€เธเนเธ เน€เธ”เธดเธก เนเธฅเธฐเนเธเธเธฒเธฃเนเธ”เธเธตเน เธ•เธฑเธงเน€เธฅเธเนเธเน , เน€เธเธดเนเธกเธเธฒเธฃเนเธชเธ”เธ เน€เธเนเธ เธฅเธ.เธ”เนเธงเธข เนเธฅเธฐเธกเธต ,)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเธซเธเนเธงเธข เธฅเธ. เนเธฅเธฐเน€เธเธฃเธทเนเธญเธเธซเธกเธฒเธขเธเธธเธฅเธ เธฒเธเนเธซเนเธญเนเธฒเธเธเนเธฒเธข เธเธฑเธ”เน€เธเธ เธ•เธฃเธเธ•เธฒเธกเธกเธฒเธ•เธฃเธเธฒเธ)',
    },
    {
      id: 'log_000_wbs_redesign_kpi_card_bar_graphs',
      timestamp: '2026-10-24 23:15:00',
      timestampTh: '24 เธ•.เธ. 2569, 23:15 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธเธฃเธธเธเธเธฒเธฃเนเธ”เธ เธฒเธเธฃเธงเธก WBS',
      badgeClass: 'badge-type-edit',
      title: 'เธเธฃเธฑเธเธเธฃเธธเธเธเธฒเธฃเนเธ” WBS: เธเธณเธเธฒเธเธเธเน€เธซเธฅเธทเธญเธญเธญเธ, เธ—เธณเธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒเนเธฅเธฐเธกเธนเธฅเธเนเธฒเธเธดเธ”เธเธฒเธเน€เธเนเธเนเธ—เนเธเธเธฃเธฒเธเนเธชเธ”เธเธกเธนเธฅเธเนเธฒ/เธเธฒเธ เนเธฅเธฐเธ—เธณเนเธ—เนเธเธเธฃเธฒเธเธชเนเธงเธเน€เธเธดเนเธกเน€เธเนเธเธชเธตเธ•เนเธฒเธเธญเธญเธเนเธ',
      targetSubject: 'เธเธฒเธฃเนเธ”เธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ & เธเธฒเธ AUC เธซเธเนเธฒ WBS (#wbsExecutiveDonutKpiCard)',
      storageFile: 'js/wbs.js, css/styles.css, js/data_history.js, index.html',
      changeSummary: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธเธญ 4 เธเนเธญ: 1) เธเธณเธเธฅเนเธญเธเธเธฒเธเธเธเน€เธซเธฅเธทเธญ (เธเธเน€เธซเธฅเธทเธญเธ”เธณเน€เธเธดเธเธเธฒเธฃ) เธญเธญเธเธเธฒเธเธเธฒเธฃเนเธ” 2) เธเธฃเธฑเธเธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒเน€เธเนเธเนเธเธเนเธ—เนเธเธเธฃเธฒเธ เธกเธตเธญเธฑเธเธฉเธฃ เธกเธนเธฅเธเนเธฒ / เธเธฒเธ เนเธฅเธฐเธชเนเธงเธเน€เธเธดเนเธก/เธฅเธ”เนเธชเธ”เธเน€เธเนเธเนเธ—เนเธเธเธฃเธฒเธเธชเธตเธ•เนเธฒเธเธญเธญเธเนเธ (เธชเนเธกเธญเธณเธเธฑเธ/เธเธตเธญเธญเธ) 3) เธเธฃเธฑเธเธกเธนเธฅเธเนเธฒเธเธดเธ”เธเธฒเธเน€เธเนเธเนเธเธเนเธ—เนเธเธเธฃเธฒเธ เธกเธตเธญเธฑเธเธฉเธฃ เธกเธนเธฅเธเนเธฒ / เธเธฒเธ เนเธฅเธฐเธชเนเธงเธ SAP CLSD เนเธชเธ”เธเนเธ—เนเธเธเธฃเธฒเธเธชเธตเน€เธเธตเธขเธงเธเธตเธญเธญเธเธชเธงเนเธฒเธเธ•เนเธฒเธเธญเธญเธเนเธ 4) เนเธ–เธ % เธเธดเธ”เธเธฒเธเธกเธนเธฅเธเนเธฒ เนเธฅเธฐ % เธเธดเธ”เธเธณเธเธงเธเธเธฒเธ เนเธชเธ”เธเธชเนเธงเธเธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธเธ”เนเธงเธขเนเธ—เนเธเธเธฃเธฒเธเธชเธตเน€เธเธตเธขเธงเธเธตเธญเธญเธเน€เธฃเธทเธญเธเนเธชเธเธ•เนเธฒเธเธญเธญเธเนเธเธเธฒเธเธชเธตเน€เธ”เธดเธก',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ 4 เธเนเธญ: 1) เธฅเธเธเธฅเนเธญเธเธเธเน€เธซเธฅเธทเธญเธ”เธณเน€เธเธดเธเธเธฒเธฃ (#wbsKpiRemainVal, #wbsKpiRemainJobs) เธญเธญเธ 2) เธเธฃเธฑเธเธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒเธ—เธฑเนเธเธซเธกเธ”เน€เธเนเธ .wbs-metric-card-box.box-total เธกเธตเนเธ—เนเธเธเธฃเธฒเธ .wbs-segment-track เนเธเนเธเธขเธญเธ”เน€เธ”เธดเธก (เธชเธตเธกเนเธงเธเธเธฃเธฒเธก) เนเธฅเธฐเธชเนเธงเธเธ•เนเธฒเธเน€เธเธดเนเธก/เธฅเธ” (เธชเธตเธชเนเธกเธ—เธญเธเธญเธณเธเธฑเธ) เธเธฃเนเธญเธกเนเธชเธ”เธเธญเธฑเธเธฉเธฃ เธกเธนเธฅเธเนเธฒ เนเธฅเธฐ เธเธฒเธ 3) เธเธฃเธฑเธเธกเธนเธฅเธเนเธฒเธเธดเธ”เธเธฒเธเนเธฅเนเธง (เธฃเธงเธก SAP) เน€เธเนเธ .wbs-metric-card-box.box-closed เธกเธตเนเธ—เนเธเธเธฃเธฒเธเนเธเนเธเธขเธญเธ”เน€เธเธ“เธ‘เนเน€เธ”เธดเธก (เธชเธตเน€เธเธตเธขเธงเธกเธฃเธเธ•) เนเธฅเธฐเธชเนเธงเธ SAP CLSD (เธชเธตเน€เธเธตเธขเธงเธเธตเธญเธญเธเธชเธงเนเธฒเธเธชเธฐเธ—เนเธญเธเนเธชเธ) เธเธฃเนเธญเธกเนเธชเธ”เธเธญเธฑเธเธฉเธฃ เธกเธนเธฅเธเนเธฒ เนเธฅเธฐ เธเธฒเธ 4) เนเธ–เธ % เธเธดเธ”เธเธฒเธเธกเธนเธฅเธเนเธฒ AUC เนเธฅเธฐ % เธเธดเธ”เธเธณเธเธงเธเธเธฒเธ เธเธฃเธฑเธเน€เธเนเธ .progress-fill-composite เนเธ”เธขเธเนเธงเธเน€เธ”เธดเธก (71.22% / 79.54%) เน€เธเนเธเธฅเธฒเธขเธ—เธฒเธเธ—เธญเธเน€เธ”เธดเธก เนเธฅเธฐเธเนเธงเธเธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ (+0.41% / +0.69%) เน€เธเนเธเธชเธตเน€เธเธตเธขเธงเธเธตเธญเธญเธเน€เธฃเธทเธญเธเนเธชเธ (.fill-inc-part) เธ•เนเธฒเธเธญเธญเธเนเธเธญเธขเนเธฒเธเธเธฑเธ”เน€เธเธ เธเธฃเนเธญเธกเธฃเธ– PEA EV เธงเธดเนเธเธ—เธตเนเธเธฅเธฒเธขเธ—เธฒเธเธฃเธงเธก 5) เธญเธฑเธเน€เธ”เธ• Version Cache Buster เนเธ index.html เน€เธเนเธ ?v=20261024_2315',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธเนเนเธเธเธฒเธฃเนเธ” 1.เธเธฒเธเธเธเน€เธซเธฅเธทเธญเน€เธญเธฒเธญเธญเธ 2.เธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒเนเธ—เนเธเธเธฃเธฒเธ 3.เธกเธนเธฅเธเนเธฒเธเธดเธ”เธเธฒเธเนเธ—เนเธเธเธฃเธฒเธ 4.%เธเธดเธ”เธเธฒเธเธชเนเธงเธเน€เธเธดเนเธกเธชเธตเธ•เนเธฒเธเธญเธญเธเนเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธชเธนเธ (เธเธฃเธฑเธเธเธฃเธธเธเนเธเธฃเธเธชเธฃเนเธฒเธเธเธฒเธฃเนเธ” WBS เนเธซเนเธ•เธญเธเนเธเธ—เธขเนเธเธฒเธฃเธกเธญเธเน€เธซเนเธเธชเนเธงเธเธเธฃเธฑเธเธเธฃเธธเธเนเธฅเธฐเธชเนเธงเธ SAP เธเธฑเธ”เน€เธเธเน€เธเนเธเน€เธฅเธดเธจ)',
    },
    {
      id: 'log_000_wbs_fix_syntax_error_badge_src',
      timestamp: '2026-10-24 22:45:00',
      timestampTh: '24 เธ•.เธ. 2569, 22:45 เธ.',
      type: 'EDIT',
      typeBadge: 'เนเธเนเนเธเธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เธชเธเธฃเธดเธเธ•เน',
      badgeClass: 'badge-type-edit',
      title: 'เนเธเนเนเธเธเนเธญเธเธดเธ”เธเธฅเธฒเธ” SyntaxError (Identifier badgeSrc declared twice) เนเธเธเธฑเธเธเนเธเธฑเธ syncWbsSideKpiCard เธเธทเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเธซเธเนเธฒ WBS เนเธซเนเธชเธกเธเธนเธฃเธ“เน 100%',
      targetSubject: 'เนเธกเธ”เธนเธฅเธ•เธดเธ”เธ•เธฒเธกเธเธฒเธ WBS เธเธเน€เธซเธฅเธทเธญ (js/wbs.js)',
      storageFile: 'js/wbs.js, js/data_history.js, index.html',
      changeSummary: 'เนเธเนเนเธเธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เธ•เธฑเธงเนเธเธฃ badgeSrc เธเนเธณเนเธเธเธฑเธเธเนเธเธฑเธ syncWbsSideKpiCard เธเธถเนเธเธ—เธณเนเธซเนเนเธเธฅเน js/wbs.js เธซเธขเธธเธ”เธเธฒเธฃเธเธฃเธฐเธกเธงเธฅเธเธฅ เธชเนเธเธเธฅเนเธซเนเธ•เธฒเธฃเธฒเธเนเธฅเธฐเธเธฒเธฃเนเธ” WBS เนเธกเนเนเธชเธ”เธเธเธฅ เธซเธฅเธฑเธเนเธเนเนเธ เธซเธเนเธฒ WBS เธเธเน€เธซเธฅเธทเธญ เธ—เธฑเนเธเธเธฒเธฃเนเธ”เนเธซเธกเน เธ•เธฒเธฃเธฒเธ 25 เธฃเธฒเธขเธเธฒเธฃเธ•เนเธญเธซเธเนเธฒ เนเธฅเธฐเธ•เธฑเธงเธเธฃเธญเธเธ—เธฑเนเธเธซเธกเธ”เธเธฅเธฑเธเธกเธฒเนเธชเธ”เธเธเธฅเนเธ”เนเธญเธขเนเธฒเธเธชเธกเธเธนเธฃเธ“เนเนเธเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฃเธงเธเธชเธญเธเนเธฅเธฐเนเธเนเนเธเธเธฑเธเธซเธฒ "เธเนเธญเธกเธนเธฅเธซเธฒเธข เธซเธเนเธฒ wbs เธเธเน€เธซเธฅเธทเธญ": 1) เธ•เธฃเธงเธเธเธ SyntaxError: Identifier badgeSrc has already been declared เธ—เธตเนเธเธฃเธฃเธ—เธฑเธ” 2201 เนเธ js/wbs.js เธเธฒเธเธเธฒเธฃเธเธฃเธฐเธเธฒเธจ const เธเนเธณ 2 เธเธธเธ” 2) เน€เธเธฅเธตเนเธขเธเธเธทเนเธญเธ•เธฑเธงเนเธเธฃเธ—เธตเนเธเธฃเธฃเธ—เธฑเธ” 2201 เน€เธเนเธ targetBadgeSrc เนเธฅเธฐ targetBadgeTgt เนเธซเนเธ–เธนเธเธ•เนเธญเธเน€เธเธเธฒเธฐเธ•เธฑเธง 3) เธ—เธ”เธชเธญเธเนเธซเธฅเธ”เธชเธเธฃเธดเธเธ•เน wbs.js เนเธ Headless Browser เธขเธทเธเธขเธฑเธเธงเนเธฒเนเธซเธฅเธ”เธชเธณเน€เธฃเนเธเนเธกเนเธกเธต Error 4) เธ—เธ”เธชเธญเธเน€เธเธดเธ”เนเธ—เนเธ WBS เธขเธทเธเธขเธฑเธเธงเนเธฒ CARD_EXISTS = true, TBODY_ROWS = 25 เนเธ–เธง, เธ•เธฑเธงเน€เธฅเธเธเธฒเธฃเนเธ”เนเธซเธกเนเนเธชเธ”เธเธเธฃเธเธ–เนเธงเธเธชเธกเธเธนเธฃเธ“เน 5) เธญเธฑเธเน€เธ”เธ• Version Cache Buster เนเธ index.html เน€เธเนเธ ?v=20261024_2245',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธเนเธญเธกเธนเธฅเธซเธฒเธข เธซเธเนเธฒ wbs เธเธเน€เธซเธฅเธทเธญ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธงเธดเธเธคเธ• (เนเธเนเนเธเธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เธชเธเธฃเธดเธเธ•เน เธเธทเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเธเนเธญเธกเธนเธฅเธซเธเนเธฒ WBS เธเธเน€เธซเธฅเธทเธญ เธ—เธฑเนเธเธฃเธฐเธเธเนเธซเนเธเธฅเธฑเธเธกเธฒเธ—เธณเธเธฒเธเนเธ”เนเธญเธขเนเธฒเธเธ–เธนเธเธ•เนเธญเธ)',
    },
    {
      id: 'log_000_wbs_create_new_combined_kpi_card',
      timestamp: '2026-10-24 22:35:00',
      timestampTh: '24 เธ•.เธ. 2569, 22:35 เธ.',
      type: 'EDIT',
      typeBadge: 'เธชเธฃเนเธฒเธเธเธฒเธฃเนเธ”เนเธซเธกเนเธฃเธงเธกเธเธฃเธฑเธเธเธฃเธธเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธชเธฃเนเธฒเธเธเธฒเธฃเนเธ”เนเธซเธกเน: เธฃเธงเธกเธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒเธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ/เธฅเธ”เธฅเธ (เธงเธเธเธฅเธก 1) เนเธฅเธฐ เธฃเธงเธกเธกเธนเธฅเธเนเธฒ/เธเธฒเธเธเธดเธ”เธเธฒเธเธเธฑเธ SAP CLSD (เธงเธเธเธฅเธก 2)',
      targetSubject: 'เธเธฒเธฃเนเธ”เธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ & เธเธฒเธ AUC เธซเธเนเธฒ WBS (#wbsExecutiveDonutKpiCard -> .wbs-new-combined-kpi-card)',
      storageFile: 'js/wbs.js, css/styles.css, js/data_history.js, index.html',
      changeSummary: 'เธชเธฃเนเธฒเธเธเธฒเธฃเนเธ”เนเธซเธกเนเธ•เธฒเธกเธ เธฒเธเธ—เธตเนเธเธนเนเนเธเนเธงเธเธเธฅเธกเน€เธฅเธ 1 เนเธฅเธฐ 2: 1) เธงเธเธเธฅเธก 1: เธเธณเธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒเธฃเธงเธกเธเธฑเธเธกเธนเธฅเธเนเธฒเธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ/เธฅเธ”เธฅเธ (2,231,338,464.73 + (-94,278.85) = 2,231,244,185.88 เธฟ) 2) เธงเธเธเธฅเธก 2: เธเธณเธเธดเธ”เธเธฒเธเนเธฅเนเธงเธฃเธงเธกเธเธฑเธ CLSD F4/F2 เธ—เธฑเนเธเธกเธนเธฅเธเนเธฒเนเธฅเธฐเธเธฒเธ (1,589,201,672.17 + 9,047,546.49 = 1,598,249,218.66 เธฟ, 8,100 + 70 = 8,170 เธเธฒเธ) 3) เธเธณเธเธงเธ“เธเธเน€เธซเธฅเธทเธญเธชเธธเธ—เธเธดเนเธฅเธฐเน€เธเธญเธฃเนเน€เธเนเธเธ•เนเธเธดเธ”เธเธฒเธเนเธซเธกเนเน€เธฃเธตเธขเธฅเนเธ—เธกเน (71.63% เธกเธนเธฅเธเนเธฒ เนเธฅเธฐ 80.23% เธเธฒเธ)',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "เธเธณเธกเธฒเธฃเธงเธกเธเธฑเธ เธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ เธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ/เธฅเธ”เธฅเธ เนเธฅเนเธง เนเธชเธ”เธเธเธฒเธฃเธทเธ”เนเธซเธกเน, เธเธณเธกเธฒเธฃเธงเธกเธเธฑเธ เธกเธนเธฅเธเนเธฒ/เธเธฒเธ เธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ เธ—เธตเนเธงเธเธเธฅเธก เนเธฅเนเธงเธชเธฃเนเธฒเธเธเธฒเธฃเนเธ”เนเธซเธกเน" เธเธฃเนเธญเธกเธ เธฒเธเธงเธเธเธฅเธกเธชเธตเนเธ”เธเธซเธกเธฒเธขเน€เธฅเธ 1 เนเธฅเธฐ 2: 1) เนเธ js/wbs.js: เธเธฃเธฑเธเธเธฃเธธเธเธเธฒเธฃเนเธ” #wbsExecutiveDonutKpiCard เน€เธเนเธเธเธฒเธฃเนเธ”เนเธซเธกเน (.wbs-new-combined-kpi-card) เธเธฃเนเธญเธกเธเนเธฒเธขเธเธณเธเธฑเธ "เธเธฒเธฃเนเธ”เนเธซเธกเน (เธฃเธงเธกเธเธฃเธฑเธเธเธฃเธธเธ)" 2) เนเธ syncWbsSideKpiCard เธเธณเธเธงเธ“เธขเธญเธ”เธชเธธเธ—เธเธด: เธงเธเธเธฅเธก 1 (netTotalVal = baseTotalVal + totalCostInc), เธงเธเธเธฅเธก 2 (netClosedVal = baseClosedVal + clsdSapAuc, netClosedJobs = baseClosedJobs + clsdSapCount), เธขเธญเธ”เธเธเน€เธซเธฅเธทเธญเธชเธธเธ—เธเธด (netRemainVal = netTotalVal - netClosedVal), เน€เธเธญเธฃเนเน€เธเนเธเธ•เนเธเธดเธ”เธเธฒเธเนเธซเธกเน (netPctVal = 71.63%, netPctJobs = 80.23%) เธเธฃเนเธญเธกเนเธ–เธเนเธชเธ”เธเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เธขเนเธญเธขเธญเธขเนเธฒเธเนเธเธฃเนเธเนเธช 3) เนเธ css/styles.css: เน€เธเธดเนเธกเธชเนเธ•เธฅเน .badge-new-card-pill เนเธฅเธฐ .donut-stat-breakdown-sub 4) เธญเธฑเธเน€เธ”เธ• Version Cache Buster เนเธ index.html เน€เธเนเธ ?v=20261024_2235',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธเธณเธกเธฒเธฃเธงเธกเธเธฑเธ เธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ เธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ/เธฅเธ”เธฅเธ เนเธฅเนเธง เนเธชเธ”เธเธเธฒเธฃเธทเธ”เนเธซเธกเน, เธเธณเธกเธฒเธฃเธงเธกเธเธฑเธ เธกเธนเธฅเธเนเธฒ/เธเธฒเธ เธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ เธ—เธตเนเธงเธเธเธฅเธก เนเธฅเนเธงเธชเธฃเนเธฒเธเธเธฒเธฃเนเธ”เนเธซเธกเน เธเธฃเนเธญเธกเธ เธฒเธเธงเธเธเธฅเธก 1 เนเธฅเธฐ 2)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธชเธนเธ (เธขเธเธฃเธฐเธ”เธฑเธเธเธฒเธฃเนเธ”เธ เธฒเธเธฃเธงเธก WBS เน€เธเนเธเธเธฒเธฃเนเธ”เนเธซเธกเนเธ—เธตเนเธเธชเธฒเธเธ•เธฑเธงเน€เธฅเธเธ—เธธเธเธชเนเธงเธเน€เธเนเธฒเธ”เนเธงเธขเธเธฑเธเธญเธขเนเธฒเธเธชเธกเธเธนเธฃเธ“เนเนเธเธ 100%)'
    },
    {
      id: 'log_000_wbs_revert_edit_status_to_rectangle',
      timestamp: '2026-10-24 22:30:00',
      timestampTh: '24 เธ•.เธ. 2569, 22:30 เธ.',
      type: 'EDIT',
      typeBadge: 'เธขเธเน€เธฅเธดเธเธเธฒเธฃเธขเนเธฒเธขเธ•เธณเนเธซเธเนเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธขเธเน€เธฅเธดเธเธเธฒเธฃเธขเนเธฒเธขเธชเธ–เธฒเธเธฐเนเธเนเนเธเนเธเนเธชเธ”เธเธ—เธตเนเธ•เธณเนเธซเธเนเธเธเธฒเธเธเธฒเธ— เนเธฅเธฐเธเธทเธเธเนเธฒเนเธชเธ”เธเธ—เธตเนเธเธฃเธญเธเธชเธตเนเน€เธซเธฅเธตเนเธขเธกเธ”เนเธฒเธเธเธเธ•เธฒเธกเน€เธ”เธดเธก',
      targetSubject: 'เธเธฒเธฃเนเธ”เธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ & เธเธฒเธ AUC เธซเธเนเธฒ WBS (#wbsExecutiveDonutKpiCard)',
      storageFile: 'js/wbs.js, js/data_history.js, index.html',
      changeSummary: 'เธขเธเน€เธฅเธดเธเธเธฒเธฃเธขเนเธฒเธขเธชเธ–เธฒเธเธฐเนเธเนเนเธ (เธกเธนเธฅเธเนเธฒ AUC เธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ/เธฅเธ”เธฅเธ) เนเธเนเธงเนเธ—เธตเนเธเธฅเนเธญเธเธ”เนเธฒเธเธฅเนเธฒเธ (เธ•เธณเนเธซเธเนเธเธเธฒเธเธเธฒเธ—) เนเธ”เธขเธเธทเธเธเนเธฒเธเธฒเธฃเนเธชเธ”เธเธเธฅเนเธงเนเธ—เธตเนเธเธฃเธญเธเธชเธตเนเน€เธซเธฅเธตเนเธขเธกเธ–เธฑเธ”เธเธฒเธ เธฟ เนเธ•เนเธขเธญเธ”เธฃเธงเธกเธ”เนเธฒเธเธเธเธ•เธฒเธกเน€เธ”เธดเธก เนเธฅเธฐเธเธทเธเธเธฅเนเธญเธเธ”เนเธฒเธเธฅเนเธฒเธเน€เธเนเธเธเธฒเธฃเนเธชเธ”เธเธชเธ–เธฒเธเธฐเธเธดเธ”เธเธฒเธ SAP (CLSD F4 / CLSD F2) เธชเธตเน€เธเธตเธขเธงเน€เธฃเธทเธญเธเนเธชเธเธ•เธฒเธกเน€เธ”เธดเธก',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "เธขเธเน€เธฅเธดเธ เธเธณเธชเธ–เธฒเธเธฐเนเธเนเนเธ เธ—เธตเนเธชเธตเน€เธซเธฅเธตเนเธขเธก เนเธเนเธชเธ”เธ เธเธฒเธเธเธฒเธ— เนเธซเนเธชเธงเธขเธเธฒเธก": 1) เนเธ js/wbs.js: เธเธทเธเธเธญเธกเนเธเน€เธเธเธ•เน .exec-total-inc-row (wbsKpiTotalIncBadge) เนเธงเนเธ–เธฑเธ”เธเธฒเธ เธฟ เนเธ•เนเธขเธญเธ”เธฃเธงเธกเธ”เนเธฒเธเธเธ 2) เธเธทเธเธเธฅเนเธญเธเธฅเนเธฒเธ (.stat-box-bottom) เน€เธเนเธ .stat-clsd-sap เนเธชเธ”เธเธชเธ–เธฒเธเธฐเธเธดเธ”เธเธฒเธเนเธ SAP (CLSD F4 เธซเธฃเธทเธญ CLSD F2) เธ”เนเธงเธขเธชเธตเน€เธเธตเธขเธงเน€เธฃเธทเธญเธเนเธชเธ 3) เธเธทเธเธเธฑเธเธเนเธเธฑเธ syncWbsSideKpiCard เนเธซเนเธเธดเธเธเนเธญเธฑเธเน€เธ”เธ• wbsKpiTotalIncBadge 4) เธญเธฑเธเน€เธ”เธ• Version Cache Buster เนเธ index.html เน€เธเนเธ ?v=20261024_2230',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธขเธเน€เธฅเธดเธ เธเธณเธชเธ–เธฒเธเธฐเนเธเนเนเธ เธ—เธตเนเธชเธตเน€เธซเธฅเธตเนเธขเธก เนเธเนเธชเธ”เธ เธเธฒเธเธเธฒเธ— เนเธซเนเธชเธงเธขเธเธฒเธก)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธทเธเธเนเธฒเธเธฒเธฃเนเธชเธ”เธเธเธฅเธชเธ–เธฒเธเธฐเนเธเนเนเธเธ—เธตเนเธ•เธณเนเธซเธเนเธเธเธฃเธญเธเธชเธตเนเน€เธซเธฅเธตเนเธขเธกเน€เธ”เธดเธกเธ•เธฒเธกเธเธงเธฒเธกเธ•เนเธญเธเธเธฒเธฃเธเธญเธเธเธนเนเนเธเนเธเธฒเธ)'
    },
    {
      id: 'log_000_wbs_move_edit_status_to_cross_block',
      timestamp: '2026-10-24 22:25:00',
      timestampTh: '24 เธ•.เธ. 2569, 22:25 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธเธฃเธธเธเธ•เธณเนเธซเธเนเธเธชเธ–เธฒเธเธฐเนเธเนเนเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธขเนเธฒเธขเธเธฒเธฃเนเธชเธ”เธเธเธฅเธชเธ–เธฒเธเธฐเนเธเนเนเธ (เธกเธนเธฅเธเนเธฒ AUC เน€เธเธดเนเธกเธเธถเนเธ/เธฅเธ”เธฅเธ) เธเธฒเธเธเธฃเธญเธเธชเธตเนเน€เธซเธฅเธตเนเธขเธกเธ”เนเธฒเธเธเธ เนเธเนเธชเธ”เธเธ—เธตเนเธเธฅเนเธญเธเธฅเนเธฒเธ (เธ•เธณเนเธซเธเนเธเธเธฒเธเธเธฒเธ—) เนเธซเนเธชเธงเธขเธเธฒเธก',
      targetSubject: 'เธเธฒเธฃเนเธ”เธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ & เธเธฒเธ AUC เธซเธเนเธฒ WBS (#wbsExecutiveDonutKpiCard)',
      storageFile: 'js/wbs.js, css/styles.css, js/data_history.js, index.html',
      changeSummary: 'เธขเนเธฒเธขเธเนเธญเธกเธนเธฅเธชเธ–เธฒเธเธฐเนเธเนเนเธ (เธกเธนเธฅเธเนเธฒ AUC เธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ/เธฅเธ”เธฅเธ เธเธฒเธเธเธญเธฅเธฑเธกเธเน cn41CostInc เนเธเธฅเน 06 - 05) เธเธฒเธเธเธฃเธญเธเธชเธตเนเน€เธซเธฅเธตเนเธขเธกเธ–เธฑเธ”เธเธฒเธ เธฟ เนเธ•เนเธขเธญเธ”เธฃเธงเธกเธ”เนเธฒเธเธเธ เนเธเนเธชเธ”เธเธ—เธตเนเธเธฅเนเธญเธเธ”เนเธฒเธเธฅเนเธฒเธเธเธญเธเธเธฒเธฃเนเธ” (เธ•เธณเนเธซเธเนเธเธเธฒเธเธเธฒเธ—เน€เธ”เธดเธกเธเธญเธเธเธเน€เธซเธฅเธทเธญ) เธเธฃเนเธญเธกเธญเธญเธเนเธเธเธเธฒเธฃเธเธฑเธ”เธงเธฒเธเนเธซเนเธชเธงเธขเธเธฒเธกเน€เธ”เนเธเธเธฑเธ” เนเธชเธ”เธเธขเธญเธ”เธฃเธงเธกเธเธฒเธเธเธเน€เธ”เธดเธก เนเธฅเธฐเธเธเธเนเธญเธกเธนเธฅ CLSD F4/F2 เนเธงเนเธญเธขเนเธฒเธเธเธฅเธกเธเธฅเธทเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "เธเธณเธชเธ–เธฒเธเธฐเนเธเนเนเธ เธ—เธตเนเธชเธตเน€เธซเธฅเธตเนเธขเธก เนเธเนเธชเธ”เธ เธเธฒเธเธเธฒเธ— เนเธซเนเธชเธงเธขเธเธฒเธก": 1) เนเธ js/wbs.js: เธเธณเธเธญเธกเนเธเน€เธเธเธ•เน .exec-total-inc-row เธญเธญเธเธเธฒเธ .exec-summary-val-row เธ”เนเธฒเธเธเธ เธเธทเธเธเธงเธฒเธกเธชเธงเธขเธเธฒเธกเธชเธฐเธญเธฒเธ”เธ•เธฒเนเธซเนเธขเธญเธ”เธฃเธงเธกเธซเธฅเธฑเธเนเธฅเธฐเธเธณเธเธงเธเธเธฒเธ 2) เนเธเธเธฅเนเธญเธเธ”เนเธฒเธเธฅเนเธฒเธเธเธญเธเธเธฒเธฃเนเธ” (.stat-box-bottom เธ•เธณเนเธซเธเนเธเธเธฒเธเธเธฒเธ—): เธเธฃเธฑเธเน€เธเนเธ .stat-edit-status เนเธชเธ”เธเธซเธฑเธงเธเนเธญ "เธชเธ–เธฒเธเธฐเนเธเนเนเธ (เธกเธนเธฅเธเนเธฒ AUC)", เนเธชเธ”เธเธเนเธฒเธข "เธเธณเธเธงเธเธเธฒเธเธเธเน€เธ”เธดเธก X เธเธฒเธ" เธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเน, เนเธชเธ”เธเธ•เธฑเธงเน€เธฅเธเธกเธนเธฅเธเนเธฒเน€เธเธดเนเธก/เธฅเธ”เธเธเธฒเธ”เนเธซเธเนเน€เธฃเธทเธญเธเนเธชเธ (.text-edit-inc-glow) เธชเธตเน€เธเธตเธขเธง/เธชเนเธกเธ—เธญเธเธ•เธฒเธกเธเธฅเธเธงเธ/เธฅเธ เนเธฅเธฐเธกเธตเนเธ–เธเธขเนเธญเธขเนเธชเธ”เธเธเธฅเธ•เนเธฒเธเนเธเธฅเน 06-05 เธเธฃเนเธญเธกเธชเธ–เธฒเธเธฐ CLSD F4/F2 เธญเธขเนเธฒเธเธชเธงเธขเธเธฒเธก 3) เนเธ css/styles.css: เน€เธเธดเนเธกเธชเนเธ•เธฅเนเน€เธฃเธทเธญเธเนเธชเธ เนเธญเธเธดเน€เธกเธเธฑเธเธเธตเธเธเธฃ (pulseEditGlow) เนเธฅเธฐเธฃเธญเธเธฃเธฑเธเธ—เธฑเนเธ Dark/Light Theme 4) เนเธ syncWbsSideKpiCard: เธเธดเธเธเนเธเนเธฒเธ•เธฑเธงเน€เธฅเธเนเธฅเธฐเธชเธตเธชเธ–เธฒเธเธฐเนเธเนเนเธเธ•เธฒเธกเธ•เธฑเธงเธเธฃเธญเธเนเธเธเน€เธฃเธตเธขเธฅเนเธ—เธกเน 5) เธญเธฑเธเน€เธ”เธ• Version Cache Buster เนเธ index.html เน€เธเนเธ ?v=20261024_2225',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธเธณเธชเธ–เธฒเธเธฐเนเธเนเนเธ เธ—เธตเนเธชเธตเน€เธซเธฅเธตเนเธขเธก เนเธเนเธชเธ”เธ เธเธฒเธเธเธฒเธ— เนเธซเนเธชเธงเธขเธเธฒเธก)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฑเธ”เธฃเธฐเน€เธเธตเธขเธ UI เธเธฒเธฃเนเธ”เธ เธฒเธเธฃเธงเธก WBS เนเธซเนเธชเธงเธขเธเธฒเธก เธเธฑเธ”เน€เธเธ เนเธฅเธฐเธชเธญเธ”เธเธฅเนเธญเธเธเธฑเธเธเธงเธฒเธกเธ•เนเธญเธเธเธฒเธฃเธเธญเธเธเธนเนเนเธเนเธเธฒเธ)'
    },
    {
      id: 'log_000_wbs_remove_table_top_source_chips',
      timestamp: '2026-10-24 22:20:00',
      timestampTh: '24 เธ•.เธ. 2569, 22:20 เธ.',
      type: 'EDIT',
      typeBadge: 'เน€เธญเธฒเธเธฒเธฃเนเธ”เธญเธญเธ 3 เธญเธฑเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธณเนเธ–เธเธเธฒเธฃเนเธ”เธเธดเธเธ—เธตเนเธกเธฒเนเธเธฅเน 3 เธญเธฑเธเน€เธซเธเธทเธญเธ•เธฒเธฃเธฒเธ WBS (.wbs-table-source-chips) เธญเธญเธเธ•เธฒเธกเธเธณเธชเธฑเนเธ',
      targetSubject: 'เนเธ–เธเนเธ–เธงเธเธเธชเธธเธ”เธเธญเธเธ•เธฒเธฃเธฒเธ WBS (.wbs-table-top-meta-bar -> .wbs-table-source-chips เนเธ index.html)',
      storageFile: 'index.html, js/data_history.js',
      changeSummary: 'เธเธณเนเธ–เธเธเธฒเธฃเนเธ”เธเธดเธเนเธชเธ”เธเธ—เธตเนเธกเธฒเนเธฅเธฐเธงเธฑเธเธ—เธตเนเนเธเนเนเธเนเธเธฅเน 3 เธญเธฑเธ (เธชเธ–เธฒเธเธฐ SAP, AUC เน€เธฃเธดเนเธกเธ•เนเธ, เธกเธนเธฅเธเนเธฒ AUC) เธ—เธตเนเธญเธขเธนเนเน€เธซเธเธทเธญเธซเธฑเธงเธ•เธฒเธฃเธฒเธ WBS เธญเธญเธเธ—เธฑเนเธเธซเธกเธ”เธ•เธฒเธกเธ เธฒเธเธ—เธตเนเธเธนเนเนเธเนเธงเธเธเธฅเธกเธชเธตเนเธ”เธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "เน€เธญเธฒเธเธฒเธฃเนเธ” เธญเธญเธเธ—เธฑเนเธ 3 เธญเธฑเธ" เธเธฃเนเธญเธกเธ เธฒเธเธงเธเธเธฅเธกเธชเธตเนเธ”เธเธ—เธตเนเนเธ–เธ .wbs-table-source-chips เน€เธซเธเธทเธญเธซเธฑเธงเธ•เธฒเธฃเธฒเธ WBS: 1) เนเธ index.html: เธเธณเธเธญเธเน€เธ—เธเน€เธเธญเธฃเน .wbs-table-source-chips เธ—เธตเนเธกเธตเธเธฒเธฃเนเธ”เธ—เธฑเนเธ 3 เธญเธฑเธ (เนเธเธฅเน 04 ZBUDR064, เนเธเธฅเน 05 CN41, เนเธเธฅเน 06 CN41) เธญเธญเธเธเธฒเธ .wbs-table-top-meta-bar เธญเธขเนเธฒเธเธชเธกเธเธนเธฃเธ“เน 2) เธญเธฑเธเน€เธ”เธ• Version Cache Buster เนเธ index.html เน€เธเนเธ ?v=20261024_2220',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธญเธฒเธเธฒเธฃเนเธ” เธญเธญเธเธ—เธฑเนเธ 3 เธญเธฑเธ เธเธฃเนเธญเธกเธ เธฒเธเธงเธเธเธฅเธกเธชเธตเนเธ”เธเธ—เธตเนเนเธ–เธเธเธฒเธฃเนเธ”เธ—เธฑเนเธ 3 เธญเธฑเธเน€เธซเธเธทเธญเธซเธฑเธงเธ•เธฒเธฃเธฒเธ WBS)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เน€เธเธฅเธตเธขเธฃเนเธเธทเนเธเธ—เธตเนเนเธ–เธเธเนเธญเธกเธนเธฅเน€เธซเธเธทเธญเธซเธฑเธงเธ•เธฒเธฃเธฒเธ WBS เนเธซเนเธชเธฐเธญเธฒเธ”เธ•เธฒเนเธฅเธฐเธเธฃเธฐเธเธฑเธ)'
    },
    {
      id: 'log_000_wbs_add_th_date_and_remove_banner_cards',
      timestamp: '2026-10-24 22:15:00',
      timestampTh: '24 เธ•.เธ. 2569, 22:15 เธ.',
      type: 'EDIT',
      typeBadge: 'เน€เธเธดเนเธกเธงเธฑเธเธ—เธตเนเธซเธฑเธงเธ•เธฒเธฃเธฒเธ & เธเธณเธเธฒเธฃเนเธ”เธญเธญเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธณเธงเธฑเธเธ—เธตเนเนเธเนเนเธเธกเธฒเนเธชเธ”เธเนเธเธซเธฑเธงเธเธญเธฅเธฑเธกเธเนเธ•เนเธเธ—เธธเธเธเธฃเธดเธเนเธฅเธฐเธกเธนเธฅเธเนเธฒ AUC เนเธฅเธฐเธเธณเนเธ–เธเธเธฒเธฃเนเธ”เธเธดเธเธ—เธตเนเธกเธฒเนเธเธฅเน 3 เธญเธฑเธเธ”เนเธฒเธเธเธเธญเธญเธ',
      targetSubject: 'เธซเธฑเธงเธเธญเธฅเธฑเธกเธเนเธ•เธฒเธฃเธฒเธ WBS (เธ•เนเธเธ—เธธเธเธเธฃเธดเธ cn41Cost05 & เธกเธนเธฅเธเนเธฒ AUC cn41ActualCost) เนเธฅเธฐเนเธ–เธเธเธดเธเธ—เธตเนเธกเธฒเนเธเธฅเนเธ”เนเธฒเธเธเธ (#wbsChartHeaderSourceStrip)',
      storageFile: 'js/wbs.js, index.html & js/data_history.js',
      changeSummary: '1) เธเธณเธงเธฑเธเธ—เธตเนเนเธเนเนเธเธฅเนเธฒเธชเธธเธ”เธกเธฒเนเธชเธ”เธเธ•เนเธญเธเธฒเธเธเธฃเธฃเธ—เธฑเธ”เธเธทเนเธญเธเธญเธฅเธฑเธกเธเน "เธ•เนเธเธ—เธธเธเธเธฃเธดเธ (เนเธเธฅเน 05)" (เนเธเนเนเธเธฅเนเธฒเธชเธธเธ”: 14 เธ•.เธ. 69) เนเธฅเธฐ "เธกเธนเธฅเธเนเธฒ AUC(เธเธฒเธ—)" (เนเธเนเนเธเธฅเนเธฒเธชเธธเธ”: 22 เธ•.เธ. 69) เน€เธเนเธเธ•เธฑเธงเธญเธฑเธเธฉเธฃเธเธเธฒเธ”เธเธญเธ”เธต เน€เธฃเธตเธขเธเน เนเธกเนเธกเธตเธเธฒเธฃเนเธ”เธ•เธเนเธ•เนเธ 2) เธเธณเธเธฒเธฃเนเธ”เธเธดเธเนเธชเธ”เธเธ—เธตเนเธกเธฒเนเธเธฅเน 3 เธญเธฑเธเธ”เนเธฒเธเธเธ (#wbsChartHeaderSourceStrip) เธญเธญเธเธ—เธฑเนเธเธซเธกเธ”เธ•เธฒเธกเธเธณเธชเธฑเนเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ 2 เธเนเธญ: 1. "เธเธณ เธงเธฑเธเธ—เธตเนเนเธเนเนเธ เธกเธฒเนเธชเธ”เธเนเธเธเธญเธฅเธฑเธก เนเธฅเธฐเธเธฃเธฑเธเธเธเธฒเธ”เธเธญเธ”เธต เธ•เนเธญเธเธฒเธเธเธฃเธฃเธ—เธฑเธ” เธ•เนเธเธ—เธธเธเธเธฃเธดเธ เนเธฅเธฐเธกเธนเธฅเธเนเธฒ เน€เธเนเธเนเธเนเธญเธฑเธเธฉเธฃเนเธกเนเธ•เนเธญเธเธกเธตเธเธฒเธฃเนเธ”เธ•เธเนเธ•เนเธ" 2. "เนเธฅเธฐเน€เธญเธฒเธเธฒเธฃเนเธ” เธ•เธฒเธกเธฃเธนเธ 35 เธญเธญเธเธ—เธฑเนเธ 3 เธญเธฑเธ": 1) เนเธ js/wbs.js: เธ—เธตเนเธเธฑเธเธเนเธเธฑเธ renderWbsTableHead เนเธเธซเธฑเธงเธเธญเธฅเธฑเธกเธเน cn41Cost05 เนเธ—เธฃเธ <div class="th-sub-date-text">เนเธเนเนเธเธฅเนเธฒเธชเธธเธ”: 14 เธ•.เธ. 69</div> เนเธฅเธฐเนเธ cn41ActualCost เนเธ—เธฃเธ <div class="th-sub-date-text">เนเธเนเนเธเธฅเนเธฒเธชเธธเธ”: 22 เธ•.เธ. 69</div> เธเธเธฒเธ” 0.70rem เธ•เธฑเธงเธญเธฑเธเธฉเธฃเน€เธฃเธตเธขเธเน เนเธกเนเธกเธตเธเธฒเธฃเนเธ”เธ•เธเนเธ•เนเธ 2) เนเธ index.html: เธเธณเธเธญเธกเนเธเน€เธเธเธ•เน #wbsChartHeaderSourceStrip (เธเธฒเธฃเนเธ”เธเธดเธ 3 เธญเธฑเธ เนเธ”เนเนเธเน เธชเธ–เธฒเธเธฐ SAP, AUC เน€เธฃเธดเนเธกเธ•เนเธ, เธกเธนเธฅเธเนเธฒ AUC) เธญเธญเธเธเธฒเธเธชเนเธงเธเธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฃเธฒเธเนเธ—เนเธ WBS 3) เธญเธฑเธเน€เธ”เธ• Version Cache Buster เนเธ index.html เน€เธเนเธ ?v=20261024_2215',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธเธณเธงเธฑเธเธ—เธตเนเนเธเนเนเธเธกเธฒเนเธชเธ”เธเนเธเธเธญเธฅเธฑเธกเธเนเธ•เนเธเธ—เธธเธเธเธฃเธดเธเนเธฅเธฐเธกเธนเธฅเธเนเธฒ, เน€เธญเธฒเธเธฒเธฃเนเธ”เธญเธญเธเธ—เธฑเนเธ 3 เธญเธฑเธ เธเธฃเนเธญเธกเธ เธฒเธเธเธตเนเธฅเธนเธเธจเธฃเนเธฅเธฐเธ เธฒเธเธเธฒเธฃเนเธ” 3 เธญเธฑเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเธเธฃเธธเธ UI เนเธซเนเธเธฃเธฐเธเธฑเธ เธชเธงเธขเธเธฒเธก เนเธฅเธฐเธงเธฒเธเธเนเธญเธกเธนเธฅเธงเธฑเธเธ—เธตเนเนเธเนเนเธเธ•เธฃเธเธเธฑเธเธเธญเธฅเธฑเธกเธเนเธ—เธตเนเน€เธเธตเนเธขเธงเธเนเธญเธ)'
    },
    {
      id: 'log_000_wbs_total_cost_inc_badge',
      timestamp: '2026-10-24 22:10:00',
      timestampTh: '24 เธ•.เธ. 2569, 22:10 เธ.',
      type: 'EDIT',
      typeBadge: 'เน€เธเธดเนเธกเธกเธนเธฅเธเนเธฒAUCเน€เธเธดเนเธก/เธฅเธ”',
      badgeClass: 'badge-type-edit',
      title: 'เนเธชเธ”เธเธกเธนเธฅเธเนเธฒ AUC เธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ/เธฅเธ”เธฅเธเนเธ•เนเธ•เธฑเธงเน€เธฅเธเธกเธนเธฅเธเนเธฒเธฃเธงเธกเนเธเธเธฒเธฃเนเธ”เธ เธฒเธเธฃเธงเธก WBS (เนเธ”เธขเธเธณเธเธงเธเธเธฒเธเน€เธ—เนเธฒเน€เธ”เธดเธก)',
      targetSubject: 'เธเธฒเธฃเนเธ”เธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ & เธเธฒเธ AUC เธซเธเนเธฒ WBS (#wbsExecutiveDonutKpiCard -> .exec-summary-val-row)',
      storageFile: 'js/wbs.js, js/data_history.js & index.html',
      changeSummary: 'เนเธชเธ”เธเธเธฅเธฃเธงเธกเธกเธนเธฅเธเนเธฒเธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ/เธฅเธ”เธฅเธ เธเธฒเธเธเธญเธฅเธฑเธกเธเนเธ•เธฒเธฃเธฒเธ "เธกเธนเธฅเธเนเธฒAUCเธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ" (cn41CostInc: เธเธฅเธ•เนเธฒเธเนเธเธฅเน 06 - 05) เธญเธขเธนเนเนเธเธ•เธณเนเธซเธเนเธเธเธฃเธญเธเธชเธตเนเธ”เธเธ–เธฑเธ”เธเธฒเธเธชเธฑเธเธฅเธฑเธเธฉเธ“เน เธฟ (เน€เธเนเธ เน€เธเธดเนเธก/เธฅเธ”: -94,278.85 เธฟ) เนเธเธเธฒเธฃเนเธ”เธ เธฒเธเธฃเธงเธก WBS เนเธ”เธขเธเธณเธเธงเธเธเธฒเธ 3,229 เธเธฒเธ เธ—เธฒเธเธเธงเธฒเธกเธทเธญเธเธเธญเธขเธนเนเน€เธ—เนเธฒเน€เธ”เธดเธก',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "เนเธชเธ”เธเธกเธนเธฅเธเนเธฒเธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ/เธฅเธ”เธฅเธ เนเธ”เธขเนเธเนเธเนเธญเธกเธนเธฅเธเธญเธฅเธฑเธกเธ•เธฒเธฃเธฒเธ เธกเธนเธฅเธเนเธฒAUCเธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ (เนเธ”เธขเธเธณเธเธงเธเธเธฒเธเน€เธ—เนเธฒเน€เธ”เธดเธก)" เธเธฃเนเธญเธกเธ เธฒเธเธเธฃเธญเธเธชเธตเนเน€เธซเธฅเธตเนเธขเธกเธชเธตเนเธ”เธเธ–เธฑเธ”เธเธฒเธ เธฟ เนเธ•เนเธขเธญเธ” 292,486,085.05 เธฟ: 1) เนเธ js/wbs.js เธเธณเธเธงเธ“เธเธฅเธฃเธงเธก totalCn41CostInc เธเธฒเธเธเนเธญเธกเธนเธฅ WBS เธ—เธตเนเธเธฃเธญเธเนเธ”เน (filtered) 2) เนเธ #wbsExecutiveDonutKpiCard เน€เธเธดเนเธกเธเธญเธกเนเธเน€เธเธเธ•เน .exec-total-val-group เธเธฑเธ”เธงเธฒเธเธขเธญเธ”เธฃเธงเธก wbsKpiTotalVal เนเธฅเธฐเนเธ–เธ wbsKpiTotalIncBadge เนเธชเธ”เธเธกเธนเธฅเธเนเธฒเธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ/เธฅเธ”เธฅเธเธญเธขเนเธฒเธเน€เธ”เนเธเธเธฑเธ” 3) เนเธ syncWbsSideKpiCard เน€เธเธดเนเธกเธเธฑเธเธเนเธเธฑเธเธเธดเธเธเนเธญเธฑเธเน€เธ”เธ•เธขเธญเธ”เธเธฅเธฃเธงเธกเน€เธเธดเนเธก/เธฅเธ”เนเธเธเน€เธฃเธตเธขเธฅเนเธ—เธกเนเธ•เธฒเธกเธ•เธฑเธงเธเธฃเธญเธ 4) เธญเธฑเธเน€เธ”เธ• Version Cache Buster เนเธ index.html เน€เธเนเธ 20261024_2210',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธชเธ”เธเธกเธนเธฅเธเนเธฒเธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ/เธฅเธ”เธฅเธ เนเธ”เธขเนเธเนเธเนเธญเธกเธนเธฅเธเธญเธฅเธฑเธกเธ•เธฒเธฃเธฒเธ เธกเธนเธฅเธเนเธฒAUCเธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ (เนเธ”เธขเธเธณเธเธงเธเธเธฒเธเน€เธ—เนเธฒเน€เธ”เธดเธก))',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เน€เธเธดเนเธกเธเธงเธฒเธกเธเธฑเธ”เน€เธเธเธเธญเธเธเนเธญเธกเธนเธฅเธเธฅเธ•เนเธฒเธเธกเธนเธฅเธเนเธฒเน€เธเธดเนเธก/เธฅเธ”เนเธเธฃเธฐเธ”เธฑเธเธ เธฒเธเธฃเธงเธก WBS)'
    },
    {
      id: 'log_000_wbs_clsd_sap_neon_and_th_date',
      timestamp: '2026-10-24 22:05:00',
      timestampTh: '24 เธ•.เธ. 2569, 22:05 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธเธฃเธธเธเน€เธเธเธฒเธฐเธซเธเนเธฒ WBS',
      badgeClass: 'badge-type-edit',
      title: 'เนเธ—เธเธ—เธตเนเธเธฅเนเธญเธเธเธเน€เธซเธฅเธทเธญเธ”เนเธงเธข CLSD F4 / CLSD F2 เธชเธตเน€เธเธตเธขเธงเน€เธฃเธทเธญเธเนเธชเธ เนเธฅเธฐเนเธชเธ”เธเธงเธฑเธเธ—เธตเนเนเธเนเนเธเนเธ•เนเธซเธฑเธงเธเธญเธฅเธฑเธกเธเนเธชเธ–เธฒเธเธฐ SAP (เน€เธเธเธฒเธฐเธซเธเนเธฒ WBS)',
      targetSubject: 'เธเธฒเธฃเนเธ”เธ เธฒเธเธฃเธงเธก WBS (#wbsExecutiveDonutKpiCard) เนเธฅเธฐเธซเธฑเธงเธเธญเธฅเธฑเธกเธเนเธชเธ–เธฒเธเธฐ SAP เนเธเธ•เธฒเธฃเธฒเธ WBS (#wbsMasterTable thead)',
      storageFile: 'js/wbs.js, css/styles.css, js/data_history.js & index.html',
      changeSummary: '1) เน€เธเธเธฒเธฐเธซเธเนเธฒ WBS เธเธเน€เธซเธฅเธทเธญ: เธเธณเธเธฅเนเธญเธเธเธเน€เธซเธฅเธทเธญเธชเธตเนเธ”เธเธญเธญเธ เนเธฅเธฐเนเธ—เธเธ—เธตเนเธ”เนเธงเธขเธเธฅเนเธญเธเนเธชเธ”เธเธกเธนเธฅเธเนเธฒเนเธฅเธฐเธเธณเธเธงเธเธเธฒเธ CLSD F4 (เธชเธณเธซเธฃเธฑเธเน€เธเธ“เธ‘เนเธงเธฑเธ”เธเนเธญ 1, 2, 3, 5 เธซเธฃเธทเธญ ALL) เธซเธฃเธทเธญ CLSD F2 (เธชเธณเธซเธฃเธฑเธเน€เธเธ“เธ‘เนเธงเธฑเธ”เธเนเธญ 4) เธ”เนเธงเธขเธชเนเธ•เธฅเนเธชเธตเน€เธเธตเธขเธงเน€เธฃเธทเธญเธเนเธชเธ (Luminous Neon Green Glow) เน€เธ”เนเธเธเธฑเธ”เธชเธงเธขเธเธฒเธก 2) เนเธ•เนเธเธฃเธฃเธ—เธฑเธ”เธชเธ–เธฒเธเธฐ SAP เนเธเธซเธฑเธงเธเธญเธฅเธฑเธกเธเนเธ•เธฒเธฃเธฒเธ WBS เนเธชเธ”เธเธเนเธญเธเธงเธฒเธกเธงเธฑเธเธ—เธตเนเนเธเนเนเธเธฅเนเธฒเธชเธธเธ”เธเธญเธเนเธเธฅเน 04 ZBUDR064 ("เนเธเนเนเธเธฅเนเธฒเธชเธธเธ”: 23 เธ•.เธ. 69") เธเธฃเธฑเธเธเธเธฒเธ”เธเธญเธ”เธตเธ•เธฑเธงเธญเธฑเธเธฉเธฃเน€เธฃเธตเธขเธเน เนเธกเนเธกเธตเธเธฒเธฃเนเธ”เธ•เธเนเธ•เนเธ 3) เธเธทเธเธเนเธฒเธซเธเนเธฒ Overview เน€เธเนเธเธเนเธฒเน€เธ”เธดเธกเธ—เธฑเนเธเธซเธกเธ” 100%',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ 3 เธเธณเธชเธฑเนเธ: 1. "เน€เธญเธฒเธเธเน€เธซเธฅเธทเธญเธญเธญเธ เนเธฅเธฐเนเธซเนเน€เธเธดเนเธก ...เนเธ—เธ เธ”เธฑเธเธเธตเน: 1.เน€เธเธดเนเธกเธกเธนเธฅเธเนเธฒ เนเธฅเธฐ เธเธณเธเธงเธเธเธฒเธเธ—เธตเน CLSD F4 (เน€เธเธทเนเธญเธเนเธเน€เธเธเธงเธฑเธ”เธเนเธญ 1 2 3 5) เธซเธฃเธทเธญ CLSD F2 (เน€เธฅเธทเธญเธเน€เธเธ“เธเนเธญ 4) 2.เนเธเนเธชเธตเน€เธเธตเธขเธงเน€เธฃเธทเธญเธเนเธชเธเนเธซเน เธชเธงเธขเธเธฒเธกเน€เธ”เนเธเธเธฑเธ”" 2. "เธเธณ เธงเธฑเธเธ—เธตเนเนเธเนเนเธ เธกเธฒเนเธชเธ”เธเนเธเธเธญเธฅเธฑเธก เนเธฅเธฐเธเธฃเธฑเธเธเธเธฒเธ”เธเธญเธ”เธต เธ•เนเธญเธเธฒเธเธเธฃเธฃเธ—เธฑเธ” เธชเธ–เธฒเธเธฐsap เน€เธเนเธเนเธเนเธญเธฑเธเธฉเธฃเนเธกเนเธ•เนเธญเธเธกเธตเธเธฒเธฃเนเธ”เธ•เธเนเธ•เนเธ" 3. "เนเธซเนเนเธเนเนเธเน€เธเธเธฒเธฐเธซเธเนเธฒ WBS เธเธเน€เธซเธฅเธทเธญเน€เธ—เนเธฒเธเธฑเนเธ" เนเธฅเธฐ "เธซเธเนเธฒ overview เธขเนเธญเธเธเธฅเธฑเธเธเนเธฒเน€เธ”เธดเธกเธ—เธฑเนเธเธซเธกเธ”": 1) เนเธ js/wbs.js: เธเธฃเธฑเธเธเธฃเธธเธ renderWbsTargetComparisonSection เนเธ #wbsExecutiveDonutKpiCard เธเธณเธเธฅเนเธญเธ .stat-remain เธญเธญเธ เนเธฅเธฐเนเธชเนเธเธฅเนเธญเธ .stat-clsd-sap เนเธชเธ”เธเธเธฅเธเนเธฒเธขเธชเธ–เธฒเธเธฐเธ•เธฒเธกเน€เธเธ“เธ‘เนเธงเธฑเธ” (เธเนเธญ 4 โ” CLSD F2, เธญเธทเนเธเน โ” CLSD F4), เธเธณเธเธงเธเธเธฒเธ เนเธฅเธฐเธขเธญเธ”เธกเธนเธฅเธเนเธฒเธฃเธงเธก เธเธฃเนเธญเธกเธชเนเธ•เธฅเนเธชเธตเน€เธเธตเธขเธงเน€เธฃเธทเธญเธเนเธชเธ 2) เนเธ syncWbsSideKpiCard เธเธณเธเธฒเธฃเธเธฑเธ”เธฅเธญเธเธเนเธฒ remainJobs เนเธฅเธฐ remainVal เธญเธญเธ เน€เธเธทเนเธญเธฃเธฑเธเธฉเธฒเธเนเธฒ CLSD SAP เธเธญเธเธซเธเนเธฒ WBS เนเธงเนเนเธกเนเนเธซเนเนเธ”เธเธ—เธฑเธ 3) เนเธ renderWbsTableHead เนเธ•เนเธเธฃเธฃเธ—เธฑเธ”เธชเธ–เธฒเธเธฐ SAP เนเธ—เธฃเธ <div class="th-sub-date-text">เนเธเนเนเธเธฅเนเธฒเธชเธธเธ”: 23 เธ•.เธ. 69</div> เธเธเธฒเธ”เธเธญเธ”เธต เน€เธเนเธเธ•เธฑเธงเธญเธฑเธเธฉเธฃเน€เธฃเธตเธขเธเน เนเธกเนเธกเธตเธเธฒเธฃเนเธ”เธ•เธเนเธ•เนเธ 4) เนเธ css/styles.css: เน€เธเธดเนเธกเธชเนเธ•เธฅเนเธชเธตเน€เธเธตเธขเธงเน€เธฃเธทเธญเธเนเธชเธ .donut-stat-col.stat-clsd-sap, .dot-clsd-sap, .badge-jobs-clsd-sap, .text-clsd-sap-glow เธเธฃเนเธญเธก pulse animation เนเธฅเธฐ light theme styles เนเธฅเธฐเธชเนเธ•เธฅเน .th-sub-date-text 5) เนเธ index.html: เธขเนเธญเธเธเธฅเธฑเธเธเธฅเนเธญเธเธเธเน€เธซเธฅเธทเธญเธเธญเธเธซเธเนเธฒ Overview เธเธฅเธฑเธเน€เธเนเธเธเนเธฒเน€เธ”เธดเธกเธ—เธฑเนเธเธซเธกเธ” 100% เนเธฅเธฐเธญเธฑเธเน€เธ”เธ• Version Cache Buster เน€เธเนเธ ?v=20261024_2205',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธญเธฒเธเธเน€เธซเธฅเธทเธญเธญเธญเธ เน€เธเธดเนเธก CLSD F4/F2 เธชเธตเน€เธเธตเธขเธงเน€เธฃเธทเธญเธเนเธชเธ, เธเธณเธงเธฑเธเธ—เธตเนเนเธเนเนเธเธกเธฒเนเธชเธ”เธเนเธเธเธญเธฅเธฑเธกเธเนเธ•เนเธญเธเธฒเธเธชเธ–เธฒเธเธฐsap, เนเธเนเนเธเน€เธเธเธฒเธฐเธซเธเนเธฒ WBS เนเธฅเธฐ Overview เธขเนเธญเธเธเธฅเธฑเธเธเนเธฒเน€เธ”เธดเธกเธ—เธฑเนเธเธซเธกเธ”)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธ UX/UI เธซเธเนเธฒ WBS เธเธเน€เธซเธฅเธทเธญเนเธซเนเธ•เธฃเธเธ•เธฒเธกเน€เธเธ“เธ‘เนเธงเธฑเธ” SAP เธเธดเธ”เธเธฒเธเธชเธกเธเธนเธฃเธ“เน เนเธฅเธฐเน€เธเธดเนเธกเธเนเธญเธกเธนเธฅเธงเธฑเธเธ—เธตเนเนเธเนเนเธเนเธเธซเธฑเธงเธ•เธฒเธฃเธฒเธ)'
    },
    {
      id: 'log_000_add_thousand_separators_to_numbers',
      timestamp: '2026-10-24 21:35:00',
      timestampTh: '24 เธ•.เธ. 2569, 21:35 เธ.',
      type: 'EDIT',
      typeBadge: 'เน€เธเธดเนเธกเธเธญเธกเธกเนเธฒเธเธฑเนเธเธซเธฅเธฑเธเธเธฑเธ',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธดเนเธกเน€เธเธฃเธทเนเธญเธเธซเธกเธฒเธขเธเธธเธฅเธ เธฒเธ (,) เธเธฑเนเธเธซเธฅเธฑเธเธเธฑเธเธ•เธฑเธงเน€เธฅเธเธเธเธเธฃเธฒเธเน€เธชเนเธเนเธฅเธฐเธ•เธฒเธฃเธฒเธ % เน€เธเธดเนเธก/เธฅเธ” เธฃเธฒเธขเน€เธ”เธทเธญเธ',
      targetSubject: 'เธเธฃเธฒเธเน€เธชเนเธเนเธชเธ”เธเนเธเธงเนเธเนเธกเธกเธนเธฅเธเนเธฒ AUC (#timelineAmountChart), เธเนเธฒเธขเธ•เธฑเธงเน€เธฅเธเธเธเธเธธเธ”เธเธฃเธฒเธ (Data Point Badges), เธ•เธฒเธฃเธฒเธ % เน€เธเธดเนเธก/เธฅเธ” เธฃเธฒเธขเน€เธ”เธทเธญเธ (#timelineAmountGrowthTableWrap) เนเธฅเธฐเธเนเธญเธเธงเธฒเธกเธชเธฃเธธเธเธกเธนเธฅเธเนเธฒเธฅเนเธฒเธเธเธฒเธ—',
      storageFile: 'js/app.js, js/wbs.js, js/data_history.js & index.html',
      changeSummary: 'เธเธฃเธฑเธเธเธฃเธธเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเธ•เธฑเธงเน€เธฅเธเธกเธนเธฅเธเนเธฒเธฃเธฐเธ”เธฑเธเธซเธฅเธฑเธเธเธฑเธเธเธถเนเธเนเธ เนเธซเนเธกเธตเน€เธเธฃเธทเนเธญเธเธซเธกเธฒเธขเธเธธเธฅเธ เธฒเธ (,) เธเธฑเนเธเธซเธฅเธฑเธเธเธฑเธเน€เธชเธกเธญ เน€เธเนเธ 1,931.31 เธฅเธ., 2,074.26 เธฅเธ., +1,563.80 เนเธเธเนเธฒเธขเธเธฃเธฒเธเน€เธชเนเธ เธ•เธฒเธฃเธฒเธเธเธฅเธ•เนเธฒเธเธฃเธฒเธขเน€เธ”เธทเธญเธ เนเธฅเธฐ Tooltip',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "เน€เธเธดเนเธก , เธ•เธฑเธงเน€เธฅเธเธ”เนเธงเธข" เธเธฃเนเธญเธกเธ เธฒเธเธเธฃเธฐเธเธญเธเธเธฃเธฒเธเน€เธชเนเธเนเธฅเธฐเธ•เธฒเธฃเธฒเธ % เน€เธเธดเนเธก/เธฅเธ” เธฃเธฒเธขเน€เธ”เธทเธญเธ: 1) เนเธ js/app.js เนเธเนเนเธ formatValue เธเธญเธเธเธฃเธฒเธเน€เธชเนเธ timelineAmountChart เนเธซเนเธเธฑเธ”เธฃเธนเธเนเธเธเธ”เนเธงเธข toLocaleString(\'th-TH\', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) เนเธชเธ”เธเธเธฅ เน€เธเนเธ 1,931.31 เธฅเธ., 2,074.26 เธฅเธ. 2) เนเธ computeMonthlyGrowthData() เธเธฃเธฑเธเธเธฃเธธเธเธ•เธฑเธงเน€เธฅเธเธเธฅเธ•เนเธฒเธเธฃเธฒเธขเน€เธ”เธทเธญเธ (totalValText, closedValText, avgTotalValText, avgClosedValText) เนเธซเนเธกเธตเน€เธเธฃเธทเนเธญเธเธซเธกเธฒเธขเธเธญเธกเธกเนเธฒเธเธฑเนเธเธซเธฅเธฑเธเธเธฑเธ เน€เธเนเธ +1,563.80 3) เธเธฃเธฑเธเธเธฃเธธเธ formatCurrencyShort เนเธฅเธฐเธเธธเธ”เนเธชเธ”เธเธเธฅเธฅเนเธฒเธเธเธฒเธ— (valMillions, amtStr, fsTotMbStr เธฏเธฅเธฏ) เนเธซเนเธกเธตเธเธญเธกเธกเนเธฒเธเธฑเนเธเธซเธฅเธฑเธเธเธฑเธ 4) เนเธ js/wbs.js เธเธฃเธฑเธเธเธฃเธธเธ formatFull, formatShort เนเธฅเธฐ title เธเธญเธ badge เนเธซเนเธกเธตเธเธญเธกเธกเนเธฒ 5) เธญเธฑเธเน€เธ”เธ• Version Cache Buster เนเธ index.html เน€เธเนเธ ?v=20261024_2135',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธเธดเนเธก , เธ•เธฑเธงเน€เธฅเธเธ”เนเธงเธข เธเธฃเนเธญเธกเธ เธฒเธเธเธฃเธฒเธเน€เธชเนเธเนเธฅเธฐเธ•เธฒเธฃเธฒเธ % เน€เธเธดเนเธก/เธฅเธ” เธฃเธฒเธขเน€เธ”เธทเธญเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเธเธฃเธธเธเธเธงเธฒเธกเธ–เธนเธเธ•เนเธญเธเนเธฅเธฐเธชเธงเธขเธเธฒเธกเธเธญเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเธ•เธฑเธงเน€เธฅเธเนเธซเนเธญเนเธฒเธเธเนเธฒเธขเธ•เธฒเธกเธซเธฅเธฑเธเธชเธฒเธเธฅ)'
    },
    {
      id: 'log_000_remove_old_labels_and_customize_file_05_cyan_color',
      timestamp: '2026-10-24 21:25:00',
      timestampTh: '24 เธ•.เธ. 2569, 21:25 เธ.',
      type: 'EDIT',
      typeBadge: 'เธฅเธเธเธทเนเธญเน€เธ”เธดเธก & เธเธฃเธฑเธเธชเธตเนเธ—เนเธเนเธเธฅเน 05',
      badgeClass: 'badge-type-edit',
      title: 'เธฅเธเธเธทเนเธญเน€เธ”เธดเธก (เน€เธ”เธดเธก: ...) เนเธเธเธฅเนเธญเธเน€เธฅเธทเธญเธเธเธญเธฅเธฑเธกเธเน เนเธฅเธฐเธเธฃเธฑเธเนเธ•เนเธเธชเธตเนเธเธฅเน 05 เน€เธเนเธเธชเธตเธเนเธฒ Cyan เน€เธ”เนเธเธเธฑเธ” เนเธกเนเธเนเธณเธเธฑเธเนเธเธฅเนเธญเธทเนเธเนเธฅเธฐเนเธกเนเน€เธซเธกเธทเธญเธเนเธเธฅเน 06',
      targetSubject: 'เธเธฅเนเธญเธเน€เธฅเธทเธญเธเธเธญเธฅเธฑเธกเธเน WBS (Column Selector Dropdown), เนเธ—เนเธเธเธฅเธธเนเธกเนเธเธฅเน (05 CN41 vs 06 CN41), เธเธดเธเธ—เธตเนเธกเธฒเนเธเธฅเนเธ”เนเธฒเธเธเธ เนเธฅเธฐเธชเธตเธ•เธฑเธงเน€เธฅเธเธ•เนเธเธ—เธธเธเธเธฃเธดเธเนเธเธฅเน 05',
      storageFile: 'js/wbs.js, css/styles.css, js/data_history.js & index.html',
      changeSummary: '1) เธฅเธเธเนเธญเธเธงเธฒเธกเธเธทเนเธญเน€เธ”เธดเธก "(เน€เธ”เธดเธก: ...)" เนเธฅเธฐ property oldLabel เธญเธญเธเธเธฒเธเธเธฅเนเธญเธเน€เธฅเธทเธญเธเธเธญเธฅเธฑเธกเธเนเธ—เธฑเนเธเธซเธกเธ”เธ•เธฒเธกเธเธทเนเธญเธเธฃเธดเธเนเธ Excel 2) เธเธฃเธฑเธเนเธ•เนเธเธชเธตเธเธญเธเนเธเธฅเน 05 (05 CN41) เนเธซเนเน€เธเนเธเธชเธตเธเนเธฒเนเธเนเธญเธ/เน€เธ—เธญเธฃเนเธเธงเธญเธขเธเนเธชเธ”เนเธช (#22D3EE / #06B6D4) เธ—เธฑเนเธเธเนเธฒเธขเนเธ—เนเธเธเธญเธฅเธฑเธกเธเน .col-tag-05, เธเธดเธเธ—เธตเนเธกเธฒเนเธเธฅเน .chip-auc-init, เน€เธกเธ—เธฃเธดเธเธเนเธเธฅเธฃเธงเธก th/footer เนเธฅเธฐเธ•เธฑเธงเน€เธฅเธเนเธเธ•เธฒเธฃเธฒเธ เน€เธเธทเนเธญเนเธซเนเนเธ•เธเธ•เนเธฒเธเธเธฒเธเนเธเธฅเนเธญเธทเนเธเน เนเธฅเธฐเนเธกเนเธเนเธณเธเธฑเธเธชเธตเธชเนเธกเธ—เธญเธเธเธญเธเนเธเธฅเน 06',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "1.เธเธทเนเธญเน€เธ”เธดเธก เนเธกเนเธ•เนเธญเธเธกเธต เน€เธเธฃเธฒเธฐเนเธเนเธ•เธฒเธกเธเธทเนเธญเธเธญเธฅเธฑเธกเนเธ excel เธญเธขเธธเนเนเธฅเนเธง 2.เนเธเนเนเธเธชเธต เนเธซเนเธ•เนเธฒเธเนเธเธฅเนเธญเธทเนเธเน เนเธกเนเธ•เนเธญเธเน€เธซเธกเธทเธญเธเธชเธตเนเธเธฅเน 06": 1) เนเธ js/wbs.js: เธฅเธ property oldLabel เธญเธญเธเธเธฒเธ WBS_COL_DEFS เธชเธณเธซเธฃเธฑเธเธเธญเธฅเธฑเธกเธเน cn41ActualCost เนเธฅเธฐ cn41Cost05, เนเธ renderWbsColDropdownList เธเธณเธเธฒเธฃเนเธชเธ”เธเธเธฅ "(เน€เธ”เธดเธก: ...)" เธญเธญเธเธเธฒเธ title เนเธฅเธฐ span เธ—เธฑเนเธเนเธเนเธซเธกเธ”เธฅเธณเธ”เธฑเธเธเธฒเธฃเนเธชเธ”เธเนเธฅเธฐเนเธซเธกเธ”เนเธขเธเธ•เธฒเธกเธเธฅเธธเนเธกเนเธเธฅเน 2) เนเธเนเนเธ CSS Class เธเธญเธเนเธ—เนเธเธเธญเธฅเธฑเธกเธเนเนเธ renderWbsColDropdownList เนเธซเนเนเธขเธเธเธฒเธ”เธฃเธฐเธซเธงเนเธฒเธ is05 -> col-tag-05 (เธชเธตเธเนเธฒ Cyan #22D3EE) เนเธฅเธฐ is06 -> col-tag-06-cn41 (เธชเธตเธชเนเธกเธ—เธญเธ Amber #FBBF24) เธเธฃเนเธญเธกเธ—เธฑเนเธ col-tag-sheet (เธชเธตเธกเนเธงเธ) 3) เนเธ css/styles.css: เธเธฃเธฑเธเธเธฃเธธเธ .col-tag-05 เนเธฅเธฐ .wbs-src-chip.chip-auc-init เนเธซเนเน€เธเนเธเนเธ—เธเธชเธตเธเนเธฒเนเธเนเธญเธ/เน€เธ—เธญเธฃเนเธเธงเธญเธขเธเน เธ—เธฑเนเธเนเธเธเธตเธกเธกเธทเธ”เนเธฅเธฐเธเธตเธกเธชเธงเนเธฒเธ 4) เนเธ js/wbs.js เธเธฃเธฑเธเธชเธตเธ•เธฑเธงเน€เธฅเธเธเธญเธฅเธฑเธกเธเน cn41Cost05 เนเธ Header Badge, Summary Footer เนเธฅเธฐเน€เธเธฅเธฅเนเธเนเธญเธกเธนเธฅเธ•เธฒเธฃเธฒเธเน€เธเนเธเธชเธตเธเนเธฒ #22D3EE 5) เนเธ js/data_history.js เธญเธฑเธเน€เธ”เธ• badgeColor เธเธญเธ src_05 เน€เธเนเธ #06B6D4 6) เธญเธฑเธเน€เธ”เธ• Version Cache Buster เนเธ index.html เน€เธเนเธ ?v=20261024_2125',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (1.เธเธทเนเธญเน€เธ”เธดเธก เนเธกเนเธ•เนเธญเธเธกเธต เน€เธเธฃเธฒเธฐเนเธเนเธ•เธฒเธกเธเธทเนเธญเธเธญเธฅเธฑเธกเนเธ excel เธญเธขเธธเนเนเธฅเนเธง 2.เนเธเนเนเธเธชเธต เนเธซเนเธ•เนเธฒเธเนเธเธฅเนเธญเธทเนเธเน เนเธกเนเธ•เนเธญเธเน€เธซเธกเธทเธญเธเธชเธตเนเธเธฅเน 06 เธเธฃเนเธญเธกเธ เธฒเธเธงเธเธเธฅเธกเธชเธตเนเธ”เธเธ—เธตเน (เน€เธ”เธดเธก: เธ•เนเธเธ—เธธเธ เนเธฅเธฐเนเธ—เนเธ 06 CN41)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธ UX/UI เธเธงเธฒเธกเธเธฑเธ”เน€เธเธเธเธญเธเธเธทเนเธญเธเธญเธฅเธฑเธกเธเนเนเธฅเธฐเนเธขเธเธฃเธฐเธเธเธชเธตเธเธญเธเนเธเธฅเน 05 เธเธฑเธ 06 เธญเธขเนเธฒเธเน€เธ”เนเธ”เธเธฒเธ”)'
    },
    {
      id: 'log_000_revert_chevron_colors',
      timestamp: '2026-10-24 21:15:00',
      timestampTh: '24 เธ•.เธ. 2569, 21:15 เธ.',
      type: 'EDIT',
      typeBadge: 'เธขเนเธญเธเธเธทเธเธเนเธฒเธชเธตเน€เธ”เธดเธกเนเธ–เธเน€เธ”เธทเธญเธ',
      badgeClass: 'badge-type-config',
      title: 'เธขเธเน€เธฅเธดเธเธเธณเธชเธฑเนเธเนเธเนเธชเธต เธขเนเธญเธเธเธทเธเธเนเธฒเธชเธตเนเธ–เธเน€เธ”เธทเธญเธ (เธ.เธข. เธชเธตเน€เธเธตเธขเธง เนเธฅเธฐ เธ.เธ. เธชเธตเธเนเธฒ) เธ—เธฑเนเธเธซเธเนเธฒ Overview เนเธฅเธฐ WBS เธเธเน€เธซเธฅเธทเธญ',
      targetSubject: 'เนเธ–เธเน€เธเนเธฒเธซเธกเธฒเธขเธ—เธตเนเธ•เนเธญเธเธเธดเธ”เธเธฒเธเน€เธเธดเนเธกเธฃเธฒเธขเน€เธ”เธทเธญเธ (#next3mProjectionSection เนเธเธซเธเนเธฒเธ เธฒเธเธฃเธงเธก) เนเธฅเธฐเนเธ–เธเน€เธฅเธทเธญเธเธฅเธนเธเธจเธฃเน€เธเนเธฒเธซเธกเธฒเธขเน€เธ”เธทเธญเธ (#wbsKpiMonthSelector เนเธเธซเธเนเธฒ WBS เธเธเน€เธซเธฅเธทเธญ)',
      storageFile: 'css/styles.css, index.html & js/data_history.js',
      changeSummary: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "เธขเธเน€เธฅเธดเธเธเธณเธชเธฑเนเธเนเธเนเธชเธต" เนเธฅเธฐ "เธขเนเธญเธเธเธทเธ": เธขเนเธญเธเธเธทเธเธเนเธฒเธชเธตเธเธญเธเนเธ–เธเน€เธ”เธทเธญเธเธ—เธตเน 2 เนเธฅเธฐ 3 เธเธฅเธฑเธเธชเธนเนเธชเธตเน€เธ”เธดเธก (เน€เธ”เธทเธญเธเธ—เธตเน 2 เธ.เธข. เน€เธเนเธเธชเธตเน€เธเธตเธขเธง #10B981 เนเธฅเธฐเน€เธ”เธทเธญเธเธ—เธตเน 3 เธ.เธ. เน€เธเนเธเธชเธตเธเนเธฒ #0284C7 / #38BDF8) เธ—เธฑเนเธเนเธเธเธเธเธ•เธดเนเธฅเธฐเธเธ“เธฐ Active',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "เธขเธเน€เธฅเธดเธเธเธณเธชเธฑเนเธเนเธเนเธชเธต" เนเธฅเธฐ "เธขเนเธญเธเธเธทเธ": 1) เนเธ css/styles.css เธเธทเธเธเนเธฒ .single-bar-segment.seg-2 เธเธฅเธฑเธเน€เธเนเธ linear-gradient(#047857 -> #10B981 -> #34D399) เนเธฅเธฐ .seg-3 เธเธฅเธฑเธเน€เธเนเธ linear-gradient(#0284C7 -> #06B6D4 -> #38BDF8) 2) เธเธทเธเธเนเธฒ .btn-wbs-kpi-month.m-seg-2 เนเธฅเธฐ .m-seg-3 เธ—เธฑเนเธเธชเธ–เธฒเธเธฐเธเธเธ•เธดเนเธฅเธฐ .active เธเธฅเธฑเธเน€เธเนเธเนเธ—เธเธชเธตเน€เธเธตเธขเธงเนเธฅเธฐเธเนเธฒเธ•เธฒเธกเน€เธ”เธดเธก 3) เธญเธฑเธเน€เธ”เธ• Cache Buster เธเธญเธ styles.css เน€เธเนเธ ?v=20261024_2120',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธขเธเน€เธฅเธดเธเธเธณเธชเธฑเนเธเนเธเนเธชเธต / เธขเนเธญเธเธเธทเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธขเนเธญเธเธเธทเธเธเนเธฒเธชเนเธ•เธฅเนเธชเธตเน€เธ”เธดเธกเธเธญเธเนเธ–เธเน€เธ”เธทเธญเธ UI)'
    },
    {
      id: 'log_000_chevron_colors_pastel_orange_and_grey',
      timestamp: '2026-10-24 21:10:00',
      timestampTh: '24 เธ•.เธ. 2569, 21:10 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเนเธ•เนเธเธชเธตเนเธ–เธเน€เธ”เธทเธญเธเธเธฒเธชเน€เธ—เธฅ',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธฅเธตเนเธขเธเธชเธตเนเธ–เธเน€เธ”เธทเธญเธเน€เธเนเธฒเธซเธกเธฒเธขเธ—เธตเนเธงเธเธเธฅเธกเน€เธเนเธเธชเธตเธชเนเธกเธเธฒเธชเน€เธ—เธฅเธซเธงเธฒเธเน เนเธฅเธฐเธชเธตเน€เธ—เธฒเธเธฑเธฅเธซเธงเธฒเธเน เธ—เธฑเนเธเธซเธเนเธฒ Overview เนเธฅเธฐ WBS เธเธเน€เธซเธฅเธทเธญ',
      targetSubject: 'เนเธ–เธเน€เธเนเธฒเธซเธกเธฒเธขเธ—เธตเนเธ•เนเธญเธเธเธดเธ”เธเธฒเธเน€เธเธดเนเธกเธฃเธฒเธขเน€เธ”เธทเธญเธ (Single Bar Track เนเธเธซเธเนเธฒ Overview) เนเธฅเธฐเนเธ–เธเธเธธเนเธกเน€เธฅเธทเธญเธเธฅเธนเธเธจเธฃเน€เธเนเธฒเธซเธกเธฒเธขเน€เธ”เธทเธญเธ (Chevron Buttons เนเธเธซเธเนเธฒ WBS เธเธเน€เธซเธฅเธทเธญ)',
      storageFile: 'css/styles.css, index.html & js/data_history.js',
      changeSummary: 'เน€เธเธฅเธตเนเธขเธเธชเธตเนเธ–เธเน€เธ”เธทเธญเธเธ—เธตเนเธงเธเธเธฅเธกเธชเธตเนเธ”เธ (เน€เธ”เธทเธญเธเธ—เธตเน 2 เนเธฅเธฐ 3: เธ.เธข. เนเธฅเธฐ เธ.เธ.) เนเธซเนเน€เธเนเธเธชเธตเธชเนเธกเธเธฒเธชเน€เธ—เธฅเธซเธงเธฒเธเน (Sweet Pastel Peach-Orange) เนเธฅเธฐเธชเธตเน€เธ—เธฒเธเธฑเธฅเธซเธงเธฒเธเน (Sweet Pastel Galvanized Grey / Soft Silver Slate) เธ—เธฑเนเธเนเธเธเธเธเธ•เธดเนเธฅเธฐเธ•เธญเธ Active เธ—เธฑเนเธเนเธเธซเธเนเธฒเธ เธฒเธเธฃเธงเธกเธเธนเนเธเธฃเธดเธซเธฒเธฃ (Overview) เนเธฅเธฐเธซเธเนเธฒ WBS เธเธเน€เธซเธฅเธทเธญ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "เธ—เธตเนเธงเธเธเธฅเธกเน€เธเธฅเธตเนเธขเธเธชเธตเธชเนเธก เธเธฒเธชเน€เธ—เธฅเธซเธงเธฒเธเน เนเธฅเธฐเธชเธตเน€เธ—เธฒเธเธฑเธฅ เธซเธงเธฒเธเน เธ—เธฑเนเธ เธซเธเนเธฒ over view เนเธฅเธฐ wbs เธเธเน€เธซเธฅเธทเธญ": 1) เธซเธเนเธฒ Overview (.single-bar-segment): เธเธฃเธฑเธ .seg-2 เน€เธเนเธเธชเธตเธชเนเธกเธเธฒเธชเน€เธ—เธฅเธซเธงเธฒเธเน (linear-gradient #EA580C -> #F97316 -> #FB923C -> #FFEDD5) เธเธฃเนเธญเธก text-shadow เนเธฅเธฐ badge เน€เธเนเธฒเธเธธเธ”, เธเธฃเธฑเธ .seg-3 เน€เธเนเธเธชเธตเน€เธ—เธฒเธเธฑเธฅเธซเธงเธฒเธเน (linear-gradient #475569 -> #64748B -> #94A3B8 -> #F1F5F9) 2) เธซเธเนเธฒ WBS เธเธเน€เธซเธฅเธทเธญ (.btn-wbs-kpi-month): เธเธฃเธฑเธ .m-seg-2 เนเธฅเธฐ .active.m-seg-2 เน€เธเนเธเธชเธตเธชเนเธกเธเธฒเธชเน€เธ—เธฅเธซเธงเธฒเธเน เน€เธเธฅเนเธเธเธฃเธฐเธเธฒเธข, เธเธฃเธฑเธ .m-seg-3 เนเธฅเธฐ .active.m-seg-3 เน€เธเนเธเธชเธตเน€เธ—เธฒเธเธฑเธฅเธซเธงเธฒเธเน เธเธดเธฅเน€เธงเธญเธฃเนเธเธฒเธชเน€เธ—เธฅเธซเธฃเธนเธซเธฃเธฒ 3) เธญเธฑเธเน€เธ”เธ• Cache Buster เธเธญเธ styles.css เน€เธเนเธ ?v=20261024_2110',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธ—เธตเนเธงเธเธเธฅเธกเน€เธเธฅเธตเนเธขเธเธชเธตเธชเนเธก เธเธฒเธชเน€เธ—เธฅเธซเธงเธฒเธเน เนเธฅเธฐเธชเธตเน€เธ—เธฒเธเธฑเธฅ เธซเธงเธฒเธเน เธ—เธฑเนเธ เธซเธเนเธฒ over view เนเธฅเธฐ wbs เธเธเน€เธซเธฅเธทเธญ เธเธฃเนเธญเธกเธ เธฒเธเธเธฃเธฐเธเธญเธเธงเธเธเธฅเธกเธชเธตเนเธ”เธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเนเธ•เนเธเธเธตเธกเธชเธตเนเธฅเธฐเธชเนเธ•เธฅเนเธเธงเธฒเธกเธชเธงเธขเธเธฒเธกเธเธญเธเนเธ–เธเน€เธ”เธทเธญเธ UI)'
    },
    {
      id: 'log_000_add_file_05_and_auc_increase_col',
      timestamp: '2026-10-24 20:55:00',
      timestampTh: '24 เธ•.เธ. 2569, 20:55 เธ.',
      type: 'MERGE',
      typeBadge: 'เธเธณเน€เธเนเธฒเนเธเธฅเน 05 & เธเธณเธเธงเธ“เธกเธนเธฅเธเนเธฒAUCเธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ',
      badgeClass: 'badge-type-merge',
      title: 'เธเธณเน€เธเนเธฒเนเธเธฅเน 05 WBS CN41 เธเธนเธเธเธฑเธ WBS เนเธเธฅเน 03 เน€เธ—เนเธฒเธเธฑเนเธ (2,083 เธเธฒเธ) เนเธฅเธฐเธชเธฃเนเธฒเธเธเธญเธฅเธฑเธกเธเนเนเธซเธกเน "เธกเธนเธฅเธเนเธฒAUCเธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ" (เนเธเธฅเน 06 - เนเธเธฅเน 05)',
      targetSubject: 'เธเธฒเธเธเนเธญเธกเธนเธฅ WBS (js/data_wbs.js), เธเธดเธเธ—เธตเนเธกเธฒเนเธเธฅเนเธ”เนเธฒเธเธเธ (index.html), เธ•เธฒเธฃเธฒเธ WBS เธ•เธฒเธกเธฃเธนเธเธ—เธตเน 26 เนเธฅเธฐเธเธฅเนเธญเธเน€เธฅเธทเธญเธเธเธญเธฅเธฑเธกเธเน (js/wbs.js)',
      storageFile: 'js/data_wbs.js, index.html, css/styles.css, js/wbs.js & js/data_history.js',
      changeSummary: '1) เธเธณเน€เธเนเธฒเนเธเธฅเน 05 WBS CN41 เธงเธฑเธเน€เธฃเธดเนเธกเธเธฑเธเธเธต 14 เธ•เธ 69.xlsx เธเธนเธเธฃเธซเธฑเธช WBS เน€เธเธเธฒเธฐเนเธเธฅเน 03 (2,083 เธเธฒเธ) เธขเธญเธ”เธฃเธงเธก 643,241,099.93 เธเธฒเธ— เนเธ”เธขเนเธกเนเนเธ•เธฐเธ•เนเธญเธเนเธเธฅเน 06 2) เธชเธฃเนเธฒเธเธเธญเธฅเธฑเธกเธเน "เธกเธนเธฅเธเนเธฒAUCเธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ" เนเธเธ•เธฒเธฃเธฒเธ WBS เธ•เนเธญเธเธฒเธเธกเธนเธฅเธเนเธฒ AUC(เธเธฒเธ—) เธ•เธฒเธกเธฃเธนเธเธ—เธตเน 26 เธเธณเธเธงเธ“เธเธฒเธ [เนเธเธฅเน 06 เธ•เนเธเธ—เธธเธเธเธฃเธดเธ] - [เนเธเธฅเน 05 เธ•เนเธเธ—เธธเธเธเธฃเธดเธ] เธเธฅเธ•เนเธฒเธเธฃเธงเธก -94,278.85 เธเธฒเธ— 3) เนเธชเธ”เธเธเธดเธเธ—เธตเนเธกเธฒเนเธเธฅเน 05 เนเธฅเธฐเธงเธฑเธเนเธเนเนเธ (14 เธ•.เธ. 69) เธ”เนเธฒเธเธเธ 4) เธฃเธญเธเธฃเธฑเธเธ—เธธเธเน€เธกเธเธนเนเธฅเธฐเธเธฅเนเธญเธเน€เธฅเธทเธญเธเธเธญเธฅเธฑเธกเธเน',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ 4 เธเนเธญ: 1) เธเธณเน€เธเนเธฒเธเนเธญเธกเธนเธฅเธเธฒเธเนเธเธฅเน "05 WBS CN41 เธกเธนเธฅเธเนเธฒ AUC เธงเธฑเธเน€เธฃเธดเนเธกเธเธฑเธเธเธต 14 เธ•เธ 69.xlsx" (339.0 KB) เนเธ”เธขเธเธนเธเน€เธเธเธฒเธฐเธเธฑเธเธฃเธซเธฑเธช WBS เธเธญเธเนเธเธฅเน 03 เน€เธ—เนเธฒเธเธฑเนเธ (2,083 เธฃเธฒเธขเธเธฒเธฃ) เนเธ”เธขเธฃเธฑเธเธฉเธฒเธเนเธญเธกเธนเธฅเนเธเธฅเน 06 เนเธฅเธฐเนเธเธฅเนเธญเธทเนเธเน เนเธงเน 100% 2) เธเธฑเธเธ—เธถเธเธเธดเธฅเธ”เน cn41Cost05 (เธขเธญเธ”เธฃเธงเธก 643,241,099.93 เธเธฒเธ—) เนเธฅเธฐ cn41CostInc (เธเธฅเธ•เนเธฒเธ = cn41ActualCost 06 - cn41Cost05 05 เธเธฅเธ•เนเธฒเธเธฃเธงเธก -94,278.85 เธเธฒเธ— เธ•เนเธฒเธเธเธฑเธ 35 เธเธฒเธ) เธฅเธเนเธ js/data_wbs.js 3) เน€เธเธดเนเธกเธเธดเธเนเธชเธ”เธเธ—เธตเนเธกเธฒเนเธเธฅเน 05 CN41 เนเธฅเธฐเธงเธฑเธเธ—เธตเนเนเธเนเนเธเธฅเนเธฒเธชเธธเธ” "14 เธ•.เธ. 69" เนเธ index.html เนเธฅเธฐ css/styles.css เธ—เธฑเนเธเธเธเธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฃเธฒเธเนเธฅเธฐเธซเธฑเธงเธ•เธฒเธฃเธฒเธ WBS 4) เนเธ js/wbs.js เน€เธเธดเนเธกเธเธญเธฅเธฑเธกเธเน "เธกเธนเธฅเธเนเธฒAUCเธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ" (cn41CostInc) เนเธฅเธฐ "เธ•เนเธเธ—เธธเธเธเธฃเธดเธ (เนเธเธฅเน 05)" (cn41Cost05) เธงเธฒเธเธ•เนเธญเธเธฒเธ "เธกเธนเธฅเธเนเธฒ AUC(เธเธฒเธ—)" เธ•เธฒเธกเธฃเธนเธเธ—เธตเน 26 เธเธฃเนเธญเธกเนเธชเธ”เธเธเธฅเธฃเธงเธกเนเธ Header Metric Badge, Footer Summary Row, Presets (core, budget, cn41), Dropdown เธเธญเธฅเธฑเธกเธเน เนเธฅเธฐ Export CSV',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธเธณเนเธเธฅเนเนเธซเธกเน เน€เธเนเธฒเธฃเธฐเธเธ เธซเนเธฒเธกเนเธเธขเธธเนเธเธเธฑเธเนเธเธฅเนเธญเธทเนเธเน เน€เธ”เนเธ”เธเธฒเธ” เนเธ”เธขเน€เธเธเธฒเธฐเนเธเธฅเน 06 1.เธเธณเนเธเธฅเน 05 WBS เน€เธเนเธฒเธฃเธฐเธเธ เนเธฅเธฐเนเธซเนเธเธนเธเธเธฑเธ WBS เนเธเธฅเน 03 เน€เธ—เนเธฒเธเธฑเนเธ 2. เนเธซเนเนเธชเธ”เธเนเธ เธ•เธฒเธฃเธฒเธเธฃเธนเธเธ—เธตเน 26 เนเธฅเธฐเนเธเธฃเธฐเธเธเธ—เธตเนเน€เธเธตเนเธขเธงเธเนเธญเธเธ—เธธเธเน€เธกเธเธน 3.เนเธซเนเนเธชเธ”เธเธเธทเนเธญเนเธเธฅเน เนเธฅเธฐเธงเธฑเธเนเธเนเนเธเธ”เนเธงเธข เธ”เนเธฒเธเธเธ 4.เธซเธฅเธฑเธเธเธฒเธเธเธฑเนเธ เนเธซเนเธชเธฃเนเธฒเธเธเธญเธฅเธฑเธก เนเธเธ•เธฒเธฃเธฒเธเนเธซเธกเน เนเธ”เธขเธเธณเนเธเธฅเน 06 เธเธทเนเธญเธเธญเธฅเธฑเธก เธ•เนเธเธ—เธธเธเธเธฃเธดเธ เธฅเธเธ”เนเธงเธข เนเธเธฅเน 05 เธเธทเนเธญเธเธญเธฅเธฑเธก เธ•เนเธเธ—เธธเธเธเธฃเธดเธ เน€เธเนเธเธเธญเธฅเธฑเธกเนเธซเธกเนเธเธทเนเธญ เธกเธนเธฅเธเนเธฒAUCเธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธชเธนเธ (เน€เธเธดเนเธกเธกเธดเธ•เธดเธเนเธญเธกเธนเธฅเน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธเธกเธนเธฅเธเนเธฒ AUC เน€เธฃเธดเนเธกเธ•เนเธเธเธฑเธเธฅเนเธฒเธชเธธเธ” เธเธฃเนเธญเธกเธเธญเธฅเธฑเธกเธเนเธเธณเธเธงเธ“เธเธฅเธ•เนเธฒเธ)'
    },
    {
      id: 'log_000_rename_file_05_2_to_06',
      timestamp: '2026-10-24 20:25:00',
      timestampTh: '24 เธ•.เธ. 2569, 20:25 เธ.',
      type: 'CONFIG',
      typeBadge: 'เน€เธเธฅเธตเนเธขเธเธเธทเนเธญเนเธเธฅเน 05-2 เน€เธเนเธ 06',
      badgeClass: 'badge-type-config',
      title: 'เธญเธฑเธเน€เธ”เธ•เธฃเธฐเธเธเธ•เธฒเธกเธเธฒเธฃเน€เธเธฅเธตเนเธขเธเธเธทเนเธญเนเธเธฅเน 05-2 เน€เธเนเธเนเธเธฅเน 06 WBS CN41 เธกเธนเธฅเธเนเธฒ AUC เธฅเนเธฒเธชเธธเธ” เธงเธฑเธเธ—เธตเน 22 เธ•เธ 69.xlsx',
      targetSubject: 'เธเธดเธเธ—เธตเนเธกเธฒเนเธเธฅเนเธเธฒเธฃเนเธ”เธเธฃเธฒเธเนเธฅเธฐเธ•เธฒเธฃเธฒเธ WBS, เธเธฅเนเธญเธเน€เธฅเธทเธญเธเธเธญเธฅเธฑเธกเธเน (06 CN41), Model View (Data Flow Diagram) เนเธฅเธฐ DATA_SOURCE_CATALOG',
      storageFile: 'index.html, js/wbs.js, js/data_history.js & scratch/merge_wbs_latest.ps1',
      changeSummary: 'เธญเธฑเธเน€เธ”เธ•เธเธทเนเธญเนเธเธฅเนเธเธฒเธ 05-2 เน€เธเนเธ "06 WBS CN41 เธกเธนเธฅเธเนเธฒ AUC เธฅเนเธฒเธชเธธเธ” เธงเธฑเธเธ—เธตเน 22 เธ•เธ 69.xlsx" เธ—เธฑเนเธเนเธเธเนเธฒเธขเธเธดเธเธซเธฑเธงเธ•เธฒเธฃเธฒเธ WBS, เธเธฅเนเธญเธเน€เธฅเธทเธญเธเธเธญเธฅเธฑเธกเธเน (06 CN41), Model View เนเธฅเธฐเธชเธเธฃเธดเธเธ•เนเธเธณเน€เธเนเธฒ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "เนเธ”เนเน€เธเธฅเธตเนเธขเธเธเธทเนเธญเนเธเธฅ 05-2 เน€เธเนเธ 06 เนเธซเนเนเธเนเนเธเธ—เธธเธเธญเธขเนเธฒเธเธ•เธฒเธกเธ”เนเธงเธข": 1) เนเธ index.html เธญเธฑเธเน€เธ”เธ•เธเนเธฒเธขเธ—เธตเนเธกเธฒเนเธเธฅเนเธกเธนเธฅเธเนเธฒ AUC เธ—เธฑเนเธเธเธเธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฃเธฒเธเนเธฅเธฐเธซเธฑเธงเธ•เธฒเธฃเธฒเธ WBS เน€เธเนเธ "เนเธเธฅเน 06 CN41" เธเธฃเนเธญเธกเธเธตเนเนเธเธขเธฑเธเธเธทเนเธญเนเธเธฅเน 06 WBS CN41 เธกเธนเธฅเธเนเธฒ AUC เธฅเนเธฒเธชเธธเธ” เธงเธฑเธเธ—เธตเน 22 เธ•เธ 69.xlsx 2) เนเธ js/wbs.js เธเธฃเธฑเธเธเธฅเธธเนเธกเธเธญเธฅเธฑเธกเธเนเนเธฅเธฐเธเนเธฒเธขเนเธ—เนเธเธเธญเธฅเธฑเธกเธเนเน€เธเนเธ "06 CN41" เนเธฅเธฐเธญเธฑเธเน€เธ”เธ•เธเนเธญเธเธงเธฒเธก Tooltip เธเธตเนเนเธเธเธกเธนเธฅเธเนเธฒ AUC เธเธฒเธเนเธเธฅเน 06 3) เนเธ js/data_history.js เธญเธฑเธเน€เธ”เธ•เธฃเธฒเธขเธเธฒเธฃ src_06 เนเธซเนเน€เธเนเธเนเธเธฅเน 06 WBS CN41 (336.2 KB) เนเธฅเธฐเน€เธเธดเนเธก src_05 เน€เธเนเธเนเธเธฅเน 05 WBS CN41 เธงเธฑเธเน€เธฃเธดเนเธกเธเธฑเธเธเธต 14 เธ•เธ 69 เธเธฃเนเธญเธกเธญเธฑเธเน€เธ”เธ•เธเธฑเธ Data Flow Diagram 4) เนเธ scratch/merge_wbs_latest.ps1 เธญเธฑเธเน€เธ”เธ•เธเธทเนเธญเนเธเธฅเน $f5Path / $f6Path เนเธซเนเน€เธเนเธเนเธเธฅเน 06 5) เธเธฃเธฑเธเธเธฃเธธเธ Version Cache Buster เน€เธเนเธ ?v=20261024_2025',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธ”เนเน€เธเธฅเธตเนเธขเธเธเธทเนเธญเนเธเธฅ 05-2 เน€เธเนเธ 06 เนเธซเนเนเธเนเนเธเธ—เธธเธเธญเธขเนเธฒเธเธ•เธฒเธกเธ”เนเธงเธข)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เน€เธเธฅเธตเนเธขเธเธฃเธซเธฑเธชเน€เธฃเธตเธขเธเนเธฅเธฐเธเธทเนเธญเนเธเธฅเน 05-2 เน€เธเนเธ 06 เธ—เธฑเนเธเธฃเธฐเธเธ)'
    },
    {
      id: 'log_000_cancel_05_1_revert_to_05_2',
      timestamp: '2026-10-24 20:15:00',
      timestampTh: '24 เธ•.เธ. 2569, 20:15 เธ.',
      type: 'CONFIG',
      typeBadge: 'เธขเธเน€เธฅเธดเธเธเธณเธชเธฑเนเธเธเธณเน€เธเนเธฒ 05-1 เธเธทเธเธเนเธฒเนเธเธฅเน 05-2',
      badgeClass: 'badge-type-config',
      title: 'เธขเธเน€เธฅเธดเธเธเธณเธชเธฑเนเธเธเธณเน€เธเนเธฒเนเธเธฅเน 05-1 เนเธฅเธฐเธเธทเธเธเนเธฒเธฃเธฐเธเธเธเธฅเธฑเธเธกเธฒเนเธเนเนเธเธฅเน 05-2 WBS CN41 เธฅเนเธฒเธชเธธเธ” เธ—เธฑเนเธเธฃเธฐเธเธเนเธฅเธฐ Model View',
      targetSubject: 'เธเธฒเธฃเนเธ”เธเธฃเธฒเธ WBS, เธ•เธฒเธฃเธฒเธ WBS, เธเธฅเนเธญเธเน€เธฅเธทเธญเธเธเธญเธฅเธฑเธกเธเน, Model View (Data Flow Diagram) เนเธฅเธฐเนเธเธ•เธ•เธฒเธฅเนเธญเธเนเธซเธฅเนเธเธเนเธญเธกเธนเธฅ',
      storageFile: 'index.html, js/wbs.js & js/data_history.js',
      changeSummary: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธขเธเน€เธฅเธดเธเธเธณเธชเธฑเนเธเธเธณเน€เธเนเธฒเนเธเธฅเน 05-1 เธ•เธฒเธกเธเธณเธเธญเธเธญเธเธเธนเนเนเธเน เนเธ”เธขเธเธทเธเธเนเธฒเธเนเธฒเธขเธ—เธตเนเธกเธฒเนเธเธฅเน, เธฃเธฒเธขเธเธฒเธฃเธเธญเธฅเธฑเธกเธเน เนเธฅเธฐ Model View เธเธฅเธฑเธเธกเธฒเนเธเนเธเนเธญเธกเธนเธฅเนเธเธฅเน 05-2 WBS CN41 เธฅเนเธฒเธชเธธเธ” (22 เธ•เธ 69)',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "เธขเธเน€เธฅเธดเธเธเธณเธชเธฑเนเธ เนเธซเน เธเธณเนเธเธฅเน 05-1 WBS เน€เธเนเธฒเธฃเธฐเธเธ 1. เนเธซเนเธเธนเธเธเธฑเธ WBS เนเธเธฅเน 03 เน€เธ—เนเธฒเธเธฑเนเธ 2. เนเธซเนเนเธเน เนเธ model view เธ”เนเธงเธข" เนเธฅเธฐ "เธขเธเน€เธฅเธดเธ": 1) เนเธ index.html เธเธทเธเธเนเธฒเธเนเธฒเธขเธเธดเธเธ—เธตเนเธกเธฒเนเธเธฅเนเธกเธนเธฅเธเนเธฒ AUC เธ—เธฑเนเธเธเธเธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฃเธฒเธเนเธฅเธฐเธซเธฑเธงเธ•เธฒเธฃเธฒเธ WBS เน€เธเนเธเนเธเธฅเน 05-2 CN41 (เนเธเนเนเธเธฅเนเธฒเธชเธธเธ” 22 เธ•.เธ. 69) 2) เนเธ js/wbs.js เธเธทเธเธเนเธฒเธเธฅเธธเนเธกเธเธญเธฅเธฑเธกเธเน เธเนเธฒเธขเนเธ—เนเธ 05-2 CN41 เนเธฅเธฐเธเนเธญเธเธงเธฒเธก Tooltip เนเธซเนเธฃเธฐเธเธธเนเธเธฅเน 05-2 3) เนเธ js/data_history.js เธเธทเธเธเนเธฒเธฃเธฒเธขเธเธฒเธฃ src_05 เนเธฅเธฐเธเธฅเนเธญเธเนเธเธฅเนเนเธเนเธเธเธเธฑเธ Data Flow Diagram เธเธญเธ Model View เธเธฅเธฑเธเธกเธฒเน€เธเนเธเนเธเธฅเน 05-2 (336.2 KB) 4) เธญเธฑเธเน€เธ”เธ• Version Cache Buster เน€เธเนเธ ?v=20261024_2020',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธขเธเน€เธฅเธดเธเธเธณเธชเธฑเนเธ เนเธซเน เธเธณเนเธเธฅเน 05-1 WBS เน€เธเนเธฒเธฃเธฐเธเธ... / เธขเธเน€เธฅเธดเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธทเธเธเนเธฒเนเธเธฅเน 05-2 เนเธเธฃเธฐเธเธ WBS เนเธฅเธฐ Model View)'
    },
    {
      id: 'log_000_wbs_col_selector_update_file_05_2',
      timestamp: '2026-10-24 19:35:00',
      timestampTh: '24 เธ•.เธ. 2569, 19:35 เธ.',
      type: 'EDIT',
      typeBadge: 'เธญเธฑเธเน€เธ”เธ•เนเธเธฅเน 05-2 เนเธเน€เธฅเธทเธญเธเธเธญเธฅเธฑเธกเธเน & เธเธฑเธ”เธงเธฒเธเธเธธเนเธกเธเธงเธฒเธชเธธเธ”',
      badgeClass: 'badge-type-edit',
      title: 'เธญเธฑเธเน€เธ”เธ•เนเธเธฅเน 05 เน€เธเนเธ 05-2 เนเธเธเธฅเนเธญเธเน€เธฅเธทเธญเธเธเธญเธฅเธฑเธกเธเนเธ—เธตเนเธ•เนเธญเธเธเธฒเธฃเนเธชเธ”เธ เนเธฅเธฐเธเธฑเธ”เธงเธฒเธเธเนเธฒเธขเธ—เธตเนเธกเธฒเนเธเธฅเนเธเธเธเธงเธฒเธเธฃเนเธญเธกเธขเนเธฒเธขเธเธธเนเธกเนเธเธเธงเธฒเธชเธธเธ”',
      targetSubject: 'เธเธฅเนเธญเธเน€เธฅเธทเธญเธเธเธญเธฅเธฑเธกเธเนเธ—เธตเนเธ•เนเธญเธเธเธฒเธฃเนเธชเธ”เธ (Column Selector Dropdown), เธชเนเธงเธเธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฃเธฒเธ WBS เนเธฅเธฐเนเธ–เธเธซเธฑเธงเธ•เธฒเธฃเธฒเธ WBS (#wbsTableCard)',
      storageFile: 'js/wbs.js, index.html, css/styles.css & js/data_history.js',
      changeSummary: '1) เธญเธฑเธเน€เธ”เธ•เธเธฅเธธเนเธกเนเธเธฅเนเนเธฅเธฐเธเนเธฒเธขเธเธญเธฅเธฑเธกเธเนเนเธเธเธฅเนเธญเธเน€เธฅเธทเธญเธเธเธญเธฅเธฑเธกเธเนเธ—เธตเนเธ•เนเธญเธเธเธฒเธฃเนเธชเธ”เธ เธเธฒเธเนเธเธฅเน 05 เน€เธเนเธเนเธเธฅเน 05-2 WBS CN41 2) เนเธชเธ”เธเธเนเธฒเธขเธ—เธตเนเธกเธฒเนเธเธฅเนเนเธฅเธฐเธงเธฑเธเธ—เธตเนเนเธเนเนเธเธฅเนเธฒเธชเธธเธ”เธเธญเธเธชเธ–เธฒเธเธฐ SAP เนเธฅเธฐเธกเธนเธฅเธเนเธฒ AUC เธเธเธเธงเธฒเธเธญเธเธ•เธฒเธฃเธฒเธ WBS 3) เธขเนเธฒเธขเธเธธเนเธกเน€เธฅเธทเธญเธเธ—เธธเธเธชเธ–เธฒเธเธฐเนเธฅเธฐเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเนเธเธเธดเธ”เธเธงเธฒเธชเธธเธ”',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "เธขเนเธฒเธขเนเธเธ—เธฒเธเธเธงเธฒเธชเธธเธ”", "เธเธเธเธงเธฒ เนเธซเนเนเธชเธ”เธเธ—เธตเนเธกเธฒเนเธเธฅเน เนเธฅเธฐเธงเธฑเธเธ—เธตเนเนเธเนเนเธเธฅเนเธฒเธชเธธเธ” เธเธญเธ 1. เธชเธ–เธฒเธเธฐ sap 2. เธกเธนเธฅเธเนเธฒ AUC" เนเธฅเธฐ "เน€เธฅเธทเธญเธเธเธญเธกเธฅเธฑเธกเธ—เธตเนเธ•เนเธญเธเธเธฒเธฃเนเธชเธ”เธ เนเธเธฅเน 05 เนเธซเน update เนเธเธฅเนเนเธซเธกเนเธ”เนเธงเธข": 1) เนเธ js/wbs.js เธญเธฑเธเน€เธ”เธ• WBS_COL_GROUPS เนเธซเนเนเธชเธ”เธเธเธทเนเธญเธเธฅเธธเนเธกเน€เธเนเธ "เธเนเธญเธกเธนเธฅ CN41 เธกเธนเธฅเธเนเธฒ AUC (เนเธเธฅเน 05-2)" เนเธฅเธฐเธญเธฑเธเน€เธ”เธ•เธเนเธฒเธขเธเธญเธฅเธฑเธกเธเนเนเธ—เนเธเน€เธเนเธ "05-2 CN41" เธเธฃเนเธญเธกเน€เธเธดเนเธกเธเธตเธขเนเน€เธงเธดเธฃเนเธ”เธเนเธเธซเธฒ 05, 05-2, cn41 เนเธซเนเธเนเธเธซเธฒเธเธญเธฅเธฑเธกเธเนเนเธ”เนเนเธกเนเธเธขเธณ 2) เนเธ index.html เน€เธเธดเนเธก .wbs-table-top-meta-bar เธเธเธซเธฑเธงเธเธฒเธฃเนเธ”เธ•เธฒเธฃเธฒเธ WBS (#wbsTableCard) เนเธ”เธขเนเธชเธ”เธเธเนเธฒเธขเน€เธเธ“เธ‘เนเธงเธฑเธ”เธเธฑเนเธเธเนเธฒเธข เนเธฅเธฐเธเนเธฒเธขเธ—เธตเนเธกเธฒเนเธเธฅเน 1. เธชเธ–เธฒเธเธฐ SAP (เนเธเธฅเน 04 ZBUDR064) เนเธฅเธฐ 2. เธกเธนเธฅเธเนเธฒ AUC (เนเธเธฅเน 05-2 CN41) เนเธงเนเธเธเธเธงเธฒเธชเธธเธ” 3) เนเธเธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฃเธฒเธ WBS เธเธฃเธฑเธเธเธญเธเน€เธ—เธเน€เธเธญเธฃเน .wbs-chart-header-actions-area เนเธฅเธฐ .wbs-chart-btn-group เนเธซเนเธเธธเนเธก "เน€เธฅเธทเธญเธเธ—เธธเธเธชเธ–เธฒเธเธฐ" เนเธฅเธฐ "เธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธธเธเธชเธ–เธฒเธเธฐ" เธเธดเธ”เธเธงเธฒเธชเธธเธ”เน€เธชเธกเธญ เนเธกเนเธ•เธเนเธ–เธงเธซเธฃเธทเธญเน€เธเธตเธขเธ”เธเนเธฒเธข 4) เนเธ index.html เน€เธเธดเนเธกเธเธธเนเธกเธชเธฅเธฑเธเนเธซเธกเธ”เธกเธธเธกเธกเธญเธเธเธญเธฅเธฑเธกเธเน "เนเธขเธเธ•เธฒเธกเธเธฅเธธเนเธกเนเธเธฅเน" (btnModeGroup) เธฃเนเธงเธกเธเธฑเธ "เธฅเธณเธ”เธฑเธเธเธฒเธฃเนเธชเธ”เธ" 5) เธเธฃเธฑเธเธเธฃเธธเธ Version Cache Buster เน€เธเนเธ ?v=20261024_1935',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธขเนเธฒเธขเนเธเธ—เธฒเธเธเธงเธฒเธชเธธเธ” / เธเธเธเธงเธฒ เนเธซเนเนเธชเธ”เธเธ—เธตเนเธกเธฒเนเธเธฅเน เนเธฅเธฐเธงเธฑเธเธ—เธตเนเนเธเนเนเธเธฅเนเธฒเธชเธธเธ” เธเธญเธ 1. เธชเธ–เธฒเธเธฐ sap 2. เธกเธนเธฅเธเนเธฒ AUC / เน€เธฅเธทเธญเธเธเธญเธกเธฅเธฑเธกเธ—เธตเนเธ•เนเธญเธเธเธฒเธฃเนเธชเธ”เธ เนเธเธฅเน 05 เนเธซเน update เนเธเธฅเนเนเธซเธกเนเธ”เนเธงเธข)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธเธเธฅเนเธญเธเน€เธฅเธทเธญเธเธเธญเธฅเธฑเธกเธเน เนเธฅเธฐเธเธฒเธฃเธเธฑเธ”เธงเธฒเธเธซเธฑเธงเธ•เธฒเธฃเธฒเธ/เธซเธฑเธงเธเธฒเธฃเนเธ” WBS)'
    },
    {
      id: 'log_000_wbs_chart_add_source_badges',
      timestamp: '2026-10-24 19:02:00',
      timestampTh: '24 เธ•.เธ. 2569, 19:02 เธ.',
      type: 'EDIT',
      typeBadge: 'เน€เธเธดเนเธกเธเนเธฒเธขเธ—เธตเนเธกเธฒเนเธเธฅเนเธเธเธซเธฑเธงเธเธฒเธฃเนเธ” WBS',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธดเนเธกเธเนเธฒเธขเนเธชเธ”เธเธ—เธตเนเธกเธฒเนเธเธฅเนเนเธฅเธฐเธงเธฑเธเธ—เธตเนเนเธเนเนเธเธฅเนเธฒเธชเธธเธ”เธเธญเธ 1. เธชเธ–เธฒเธเธฐ SAP เนเธฅเธฐ 2. เธกเธนเธฅเธเนเธฒ AUC เธเธเธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฃเธฒเธ WBS',
      targetSubject: 'เธชเนเธงเธเธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฃเธฒเธเนเธ—เนเธ WBS (#wbsChartHeaderSourceStrip เนเธ .card-header เธเธญเธเธเธฒเธฃเนเธ”เธเธฃเธฒเธ WBS)',
      storageFile: 'index.html, css/styles.css & js/data_history.js',
      changeSummary: 'เน€เธเธดเนเธกเธเนเธฒเธขเนเธ—เนเธเนเธชเธ”เธเธ—เธตเนเธกเธฒเนเธเธฅเนเนเธฅเธฐเธงเธฑเธเธ—เธตเนเนเธเนเนเธเธฅเนเธฒเธชเธธเธ” 2 เธฃเธฒเธขเธเธฒเธฃ เนเธเธ•เธณเนเธซเธเนเธเธเธฃเธญเธเธชเธตเนเน€เธซเธฅเธตเนเธขเธกเธชเธตเนเธ”เธเธเธเธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฃเธฒเธ WBS: 1) เธชเธ–เธฒเธเธฐ SAP: เนเธเธฅเน 04 ZBUDR064 (เนเธเนเนเธเธฅเนเธฒเธชเธธเธ”: 23 เธ•.เธ. 69) 2) เธกเธนเธฅเธเนเธฒ AUC: เนเธเธฅเน 05-2 CN41 (เนเธเนเนเธเธฅเนเธฒเธชเธธเธ”: 22 เธ•.เธ. 69) เธเธฃเนเธญเธกเธเธฅเธดเธเน€เธเธดเธ”เธ”เธน Model View',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "เธชเธตเน€เธซเธฅเธตเนเธขเธกเธชเธตเนเธ”เธ เนเธซเนเนเธชเธ”เธเธ—เธตเนเธกเธฒเนเธเธฅเน เนเธฅเธฐเธงเธฑเธเธ—เธตเนเนเธเนเนเธเธฅเนเธฒเธชเธธเธ” เธเธญเธ 1. เธชเธ–เธฒเธเธฐ sap 2. เธกเธนเธฅเธเนเธฒ AUC" เธเธฃเนเธญเธกเธ เธฒเธเธเธฃเธญเธเธชเธตเนเธ”เธ: 1) เนเธ index.html เน€เธเธดเนเธกเธเธญเธกเนเธเน€เธเธเธ•เน #wbsChartHeaderSourceStrip เธเธฑเนเธเธเธฅเธฒเธเธฃเธฐเธซเธงเนเธฒเธเธเนเธฒเธขเธกเธนเธฅเธเนเธฒเธฃเธงเธกเนเธฅเธฐเธเธธเนเธกเน€เธฅเธทเธญเธเธ—เธธเธเธชเธ–เธฒเธเธฐ 2) เนเธชเธ”เธเธเนเธฒเธขเธ—เธตเน 1 (เธชเธ–เธฒเธเธฐ SAP) เธเธตเนเนเธเธขเธฑเธเนเธเธฅเน 04 ZBUDR064 เธเธฃเนเธญเธกเธงเธฑเธเธ—เธตเนเนเธเนเนเธเธฅเนเธฒเธชเธธเธ” 23 เธ•.เธ. 2569 3) เนเธชเธ”เธเธเนเธฒเธขเธ—เธตเน 2 (เธกเธนเธฅเธเนเธฒ AUC) เธเธตเนเนเธเธขเธฑเธเนเธเธฅเน 05-2 CN41 เธเธฃเนเธญเธกเธงเธฑเธเธ—เธตเนเนเธเนเนเธเธฅเนเธฒเธชเธธเธ” 22 เธ•.เธ. 2569 4) เธญเธญเธเนเธเธเธชเนเธ•เธฅเน CSS เนเธ—เธ Cyber-Gold / PEA Dark เธเธฃเนเธญเธก Hover Effect เนเธฅเธฐเน€เธเธทเนเธญเธกเนเธขเธเธเธฑเธเธเนเธเธฑเธ openDhModelModal เน€เธเธดเธ”เธ”เธน Model View เนเธ”เนเธ—เธฑเธเธ—เธต 5) เธญเธฑเธเน€เธ”เธ• Version Cache Buster เนเธ index.html เน€เธเนเธ 20261024_1902',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ เธเธฃเนเธญเธกเธ เธฒเธเธเธฃเธญเธเธชเธตเนเน€เธซเธฅเธตเนเธขเธกเธชเธตเนเธ”เธเธฃเธฐเธเธธเธ•เธณเนเธซเธเนเธเธเธเธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฃเธฒเธ WBS',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เน€เธเธดเนเธกเธเนเธฒเธขเธเนเธญเธกเธนเธฅเธ—เธตเนเธกเธฒเนเธเธฅเนเธเธเธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฃเธฒเธ WBS)'
    },
    {
      id: 'log_000_update_filename_05_1_to_05_2',
      timestamp: '2026-10-24 18:48:00',
      timestampTh: '24 เธ•.เธ. 2569, 18:48 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธเธฃเธธเธเธเธทเนเธญเนเธเธฅเน 05-2',
      badgeClass: 'badge-type-edit',
      title: 'เนเธเนเนเธเธเธทเนเธญเนเธเธฅเน 05-1 เน€เธเนเธ 05-2 เธ—เธฑเนเธเนเธเธซเธเนเธฒ WBS เธเธเน€เธซเธฅเธทเธญ เนเธฅเธฐเธซเธเนเธฒเธเธฃเธฐเธงเธฑเธ•เธดเธเธณเน€เธเนเธฒเธเนเธญเธกเธนเธฅ',
      targetSubject: 'เนเธ–เธเธเนเธฒเธขเนเธซเธฅเนเธเธเนเธญเธกเธนเธฅเธซเธเนเธฒ WBS (#wbsActiveFilterPills) เนเธฅเธฐเนเธเธ•เธ•เธฒเธฅเนเธญเธเธซเธเนเธฒเธเธฃเธฐเธงเธฑเธ•เธดเธเธณเน€เธเนเธฒเธเนเธญเธกเธนเธฅ (src_05 เนเธ DATA_SOURCE_CATALOG)',
      storageFile: 'js/wbs.js, js/data_history.js & index.html',
      changeSummary: 'เนเธเนเนเธเธเธทเนเธญเนเธเธฅเนเธเธฒเธ "05-1 WBS CN41 เธกเธนเธฅเธเนเธฒ AUC เธงเธฑเธเน€เธฃเธดเนเธกเธเธฑเธเธเธต 14 เธ•เธ69 (1เน€เธ”เธทเธญเธเน€เธเธฅเธตเนเธขเธเธเธฃเธฑเนเธ).xlsx" เน€เธเนเธ "05-2 WBS CN41 เธกเธนเธฅเธเนเธฒ AUC เธฅเนเธฒเธชเธธเธ” เธงเธฑเธเธ—เธตเน 22 เธ•เธ 69.xlsx" เธ—เธฑเนเธเนเธเธเนเธฒเธขเธซเธฑเธงเธ•เธฒเธฃเธฒเธ WBS เนเธฅเธฐเธซเธเนเธฒเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เธเธฃเธฐเธงเธฑเธ•เธดเธเธณเน€เธเนเธฒเธเนเธญเธกเธนเธฅ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "เนเธเนเนเธเธเธทเนเธญเนเธเธฅเน 05-1 เน€เธเนเธ 05-2" เนเธฅเธฐ "เนเธซเนเนเธเนเนเธเธเธทเนเธญเนเธเธฅเน เธซเธเนเธฒเธเธฃเธฐเธงเธฑเธ•เธดเธเธณเน€เธเนเธฒเธ”เนเธงเธข": 1) เนเธ js/wbs.js เธเธฃเธฑเธเธเธฃเธธเธเนเธ–เธเธเนเธฒเธข pill-file-05 เนเธซเนเนเธชเธ”เธเธเธทเนเธญเนเธเธฅเน 05-2 WBS CN41 เธกเธนเธฅเธเนเธฒ AUC เธฅเนเธฒเธชเธธเธ” เธงเธฑเธเธ—เธตเน 22 เธ•เธ 69.xlsx 2) เนเธ js/data_history.js เธญเธฑเธเน€เธ”เธ•เธเนเธญเธกเธนเธฅเนเธเธฅเน src_05 เนเธ DATA_SOURCE_CATALOG เนเธซเนเธเธทเนเธญเนเธเธฅเนเธ•เธฃเธเธเธฑเธ 05-2 เธเธเธฒเธ” 336.2 KB 3) เธญเธฑเธเน€เธ”เธ•เธเธฑเธ Data Flow Architecture เนเธเธฅเน 05-2 เนเธเธซเธเนเธฒเธเธฃเธฐเธงเธฑเธ•เธดเธเธณเน€เธเนเธฒ 4) เธญเธฑเธเน€เธ”เธ• Version Cache Buster เนเธ index.html เน€เธเนเธ 20261024_1848',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธเนเนเธเธเธทเนเธญเนเธเธฅเน 05-1 เน€เธเนเธ 05-2 / เนเธซเนเนเธเนเนเธเธเธทเนเธญเนเธเธฅเน เธซเธเนเธฒเธเธฃเธฐเธงเธฑเธ•เธดเธเธณเน€เธเนเธฒเธ”เนเธงเธข)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเธเธฃเธธเธเธเธทเนเธญเนเธเธฅเนเนเธชเธ”เธเธเธฅเนเธเธซเธเนเธฒ WBS เนเธฅเธฐเธซเธเนเธฒเธเธฃเธฐเธงเธฑเธ•เธดเธเธณเน€เธเนเธฒ)'
    },
    {
      id: 'log_000_wbs_remove_kpi_circle',
      timestamp: '2026-10-24 18:35:00',
      timestampTh: '24 เธ•.เธ. 2569, 18:35 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเนเธ•เนเธเธเธฒเธฃเนเธ” WBS',
      badgeClass: 'badge-type-edit',
      title: 'เธเธณเธงเธเธเธฅเธกเธเธฃเธฒเธ KPI เธญเธญเธเธเธฒเธเธเธฒเธฃเนเธ”เธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ & เธเธฒเธ AUC เน€เธเธเธฒเธฐเนเธเธซเธเนเธฒ WBS เธเธเน€เธซเธฅเธทเธญ',
      targetSubject: 'เธเธฒเธฃเนเธ”เธชเธฃเธธเธเธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ & เธเธฒเธ AUC (#wbsExecutiveDonutKpiCard) เนเธเนเธ—เนเธ WBS เธเธเน€เธซเธฅเธทเธญ (#tab-wbs)',
      storageFile: 'js/wbs.js, css/styles.css, index.html & js/data_history.js',
      changeSummary: 'เธเธณเธงเธเธเธฅเธกเธเธฃเธฒเธเนเธ”เธเธฑเธ—เนเธฅเธฐเธเธฐเนเธเธ KPI เธ•เธฃเธเธเธฅเธฒเธเธญเธญเธเธเธฒเธเธเธฒเธฃเนเธ”เธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ & เธเธฒเธ AUC เน€เธเธเธฒเธฐเนเธเธซเธเนเธฒ WBS เธเธเน€เธซเธฅเธทเธญ เธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ เธเธฃเนเธญเธกเธเธฑเธ”เธงเธฒเธเธเธฅเนเธญเธเธเธดเธ”เธเธฒเธเนเธฅเนเธงเนเธฅเธฐเธเธเน€เธซเธฅเธทเธญเนเธซเนเธชเธกเธ”เธธเธฅเธชเธงเธขเธเธฒเธก',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: "เน€เธเธเธฒเธฐ เธซเธเนเธฒWBS เธเธเน€เธซเธฅเธทเธญ เนเธซเนเน€เธญเธฒเธงเธเธเธฅเธกเธญเธญเธ" เธเธฃเนเธญเธกเธ เธฒเธเธงเธเธเธฅเธกเธชเธตเนเธ”เธ: 1) เนเธ js/wbs.js (เธเธฑเธเธเนเธเธฑเธ renderWbsTargetComparisonSection) เธเธณเธเธญเธกเนเธเน€เธเธเธ•เน .exec-donut-chart-wrapper (#wbsExecutiveDonutChart เนเธฅเธฐ #wbsExecDonutCenterContent) เธญเธญเธเธเธฒเธเธเธฒเธฃเนเธ” #wbsExecutiveDonutKpiCard เนเธเนเธ—เนเธ WBS 2) เนเธ js/wbs.js เธเธฃเธฑเธเธเธฑเธเธเนเธเธฑเธ syncWbsSideKpiCard เนเธซเนเธ•เธฑเธ”เธเธดเธฅเธ”เน kpiAvgKpi เธญเธญเธ 3) เนเธ css/styles.css เธเธฃเธฑเธเนเธ•เนเธเธฃเธฐเธขเธฐเธซเนเธฒเธ gap (0.55rem) เนเธฅเธฐ padding เธเธญเธเธเธฅเนเธญเธเธเธดเธ”เธเธฒเธเนเธฅเนเธงเนเธฅเธฐเธเธเน€เธซเธฅเธทเธญเนเธซเนเนเธ”เนเธชเธฑเธ”เธชเนเธงเธเธชเธงเธขเธเธฒเธก เธฃเธฑเธเธเธฑเธเธเธงเธฒเธกเธชเธนเธเธเธญเธเธเธฒเธฃเนเธ”เน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธ KPI เธเธฑเนเธเธเธงเธฒ 4) เธเธเธงเธเธเธฅเธกเธเธฃเธฒเธ KPI เนเธเธซเธเนเธฒเธ เธฒเธเธฃเธงเธกเธเธนเนเธเธฃเธดเธซเธฒเธฃ (Overview) เนเธงเนเธ•เธฒเธกเน€เธ”เธดเธก 5) เธญเธฑเธเน€เธ”เธ• Version Cache Buster เนเธ index.html เน€เธเนเธ 20261024_1835',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธเธเธฒเธฐ เธซเธเนเธฒWBS เธเธเน€เธซเธฅเธทเธญ เนเธซเนเน€เธญเธฒเธงเธเธเธฅเธกเธญเธญเธ) เธเธฃเนเธญเธกเธ เธฒเธเธงเธเธเธฅเธกเธชเธตเนเธ”เธ',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเธเธฃเธธเธ UI เธเธฒเธฃเนเธ”เธ เธฒเธเธฃเธงเธกเนเธเธซเธเนเธฒ WBS เธเธเน€เธซเธฅเธทเธญ)'
    },
    {
      id: 'log_000_update_dept_name_to_koryor',
      timestamp: '2026-10-23 21:45:00',
      timestampTh: '23 เธ•.เธ. 2569, 21:45 เธ.',
      type: 'CONFIG',
      typeBadge: 'เธเธฃเธฑเธเธเธฃเธธเธเธเธทเนเธญเธซเธเนเธงเธขเธเธฒเธ',
      badgeClass: 'badge-type-config',
      title: 'เนเธเนเนเธเธเธทเนเธญเธซเธเนเธงเธขเธเธฒเธเนเธเธชเนเธงเธเธซเธฑเธงเธฃเธฐเธเธเน€เธเนเธ "เธเธญเธเธเนเธญเธชเธฃเนเธฒเธเธฃเธฐเธเธเนเธเธเนเธฒเนเธฅเธฐเธเธฒเธเนเธขเธเธฒ (เธเธฃเธข.)"',
      targetSubject: 'เธชเนเธงเธเธซเธฑเธงเธฃเธฐเธเธ (Header) เธเธญเธเนเธ”เธเธเธญเธฃเนเธ” (#app-header / .brand-subtitle)',
      storageFile: 'index.html & js/data_history.js',
      changeSummary: 'เธเธฃเธฑเธเธเธฃเธธเธเธเนเธญเธเธงเธฒเธกเธเธทเนเธญเธชเธฑเธเธเธฑเธ”เธซเธเนเธงเธขเธเธฒเธเนเธเธชเนเธงเธเธซเธฑเธงเธซเธเนเธฒเน€เธงเนเธ เธเธฒเธเน€เธ”เธดเธก "เธเธญเธเธงเธดเธจเธงเธเธฃเธฃเธกเนเธฅเธฐเธเธฃเธดเธเธฒเธฃ (เธเธฃเธข.)" เน€เธเนเธ "เธเธญเธเธเนเธญเธชเธฃเนเธฒเธเธฃเธฐเธเธเนเธเธเนเธฒเนเธฅเธฐเธเธฒเธเนเธขเธเธฒ (เธเธฃเธข.)" เธ•เธฒเธกเนเธเธฃเธเธชเธฃเนเธฒเธเธเธฒเธฃเธเธฑเธ”เธ•เธฑเนเธเนเธฅเธฐเธเธณเธชเธฑเนเธเธเธฒเธฃเนเธเนเธเธฒเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: "เธเธญเธเธงเธดเธจเธงเธเธฃเธฃเธกเนเธฅเธฐเธเธฃเธดเธเธฒเธฃ (เธเธฃเธข.) เนเธเนเนเธ เธเธญเธเธเนเธญเธชเธฃเนเธฒเธเธฃเธฐเธเธเนเธเธเนเธฒเนเธฅเธฐเธเธฒเธเนเธขเธเธฒ (เธเธฃเธข.)" เนเธ”เธขเนเธเนเนเธเธเนเธญเธเธงเธฒเธกเนเธเนเธ—เนเธ .brand-subtitle เธเธญเธ index.html เนเธซเนเนเธชเธ”เธเน€เธเนเธ "เธเธฒเธฃเนเธเธเนเธฒเธชเนเธงเธเธ เธนเธกเธดเธ เธฒเธ เน€เธเธ• 3 (เธ เธฒเธเธเธฅเธฒเธ) โ€ข เธเธญเธเธเนเธญเธชเธฃเนเธฒเธเธฃเธฐเธเธเนเธเธเนเธฒเนเธฅเธฐเธเธฒเธเนเธขเธเธฒ (เธเธฃเธข.)" เธเธฃเนเธญเธกเธญเธฑเธเน€เธ”เธ• cache buster เนเธฅเธฐเธเธฑเธเธ—เธถเธเธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเนเธเนเนเธเธฃเธฐเธเธเนเธ BASE_AUDIT_LOGS',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเธเธฃเธธเธเธเนเธญเธเธงเธฒเธกเธเธทเนเธญเธซเธเนเธงเธขเธเธฒเธเนเธเธชเนเธงเธเธซเธฑเธงเธฃเธฐเธเธ)'
    },
    {
      id: 'log_000_wbs_add_kpi_summary_card_and_relocate_selected_jobs',
      timestamp: '2026-10-23 21:38:00',
      timestampTh: '23 เธ•.เธ. 2569, 21:38 เธ.',
      type: 'EDIT',
      typeBadge: 'เน€เธเธดเนเธกเธเธฒเธฃเนเธ”เธ เธฒเธเธฃเธงเธก & เธขเนเธฒเธขเธ•เธณเนเธซเธเนเธเน€เธฅเธทเธญเธเธเธฒเธ',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธดเนเธกเธเธฒเธฃเนเธ”เธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ & เธเธฒเธ AUC (เธ•เธฒเธกเธฃเธนเธเธ—เธตเน 15) เธเธฑเนเธเธเนเธฒเธขเธเธญเธเธเธฒเธฃเนเธ”เน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธ KPI เธเธฃเนเธญเธกเธขเนเธฒเธขเธ•เธณเนเธซเธเนเธเธ—เธตเนเน€เธฅเธทเธญเธเธเธฒเธเนเธฅเธฐเธเธฃเธฑเธเธเธเธฒเธ”เธ•เธฑเธงเธญเธฑเธเธฉเธฃเน€เธ—เนเธฒเธเธฑเธเธเธณเธเธงเธเน€เธเธดเธ',
      targetSubject: 'เธเธฒเธฃเนเธ”เน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธเน€เธเนเธฒเธซเธกเธฒเธข KPI เธฃเธฐเธ”เธฑเธ 5 (#wbsTargetComparisonSection) เนเธฅเธฐเธเธฒเธฃเนเธ”เธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ & เธเธฒเธ AUC (#wbsExecutiveDonutKpiCard) เนเธเนเธ—เนเธ WBS',
      storageFile: 'js/wbs.js, js/app.js, css/styles.css & js/data_history.js',
      changeSummary: '1) เน€เธเธดเนเธกเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ & เธเธฒเธ AUC (เธ•เธฒเธกเธฃเธนเธเธ—เธตเน 15) เนเธงเนเธ—เธฒเธเธเธฑเนเธเธเนเธฒเธขเธเธญเธเธเธฒเธฃเนเธ”เน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธเนเธเนเธ—เนเธ WBS เนเธ”เธขเธเธเธเธงเธฒเธกเธเธงเนเธฒเธเน€เธ”เธดเธกเนเธฅเธฐเธเธฃเธฑเธเธเธงเธฒเธกเธชเธนเธเนเธซเนเน€เธ—เนเธฒเธเธฑเธเธเธฒเธฃเนเธ”เน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธเนเธเธ edge-to-edge 2) เธขเนเธฒเธขเธ•เธณเนเธซเธเนเธเนเธชเธ”เธเธเธณเธเธงเธเธเธฒเธเธ—เธตเนเน€เธฅเธทเธญเธเธเธฒเธเธซเธฑเธงเธเธฃเธฒเธเธเนเธฒเธขเธกเธทเธญเธกเธฒเนเธงเนเธ–เธฑเธ”เธเธฒเธเธ•เธฑเธงเน€เธฅเธเธกเธนเธฅเธเนเธฒ "เธชเนเธงเธเธ—เธตเนเน€เธฅเธทเธญเธ: ... (X เธเธฒเธ)" 3) เธเธฃเธฑเธเธเธเธฒเธ”เธ•เธฑเธงเธญเธฑเธเธฉเธฃเธเธญเธเธเนเธฒเธขเธชเธ–เธฒเธเธฐ "CLSD F4:" เนเธฅเธฐเธเธณเธเธงเธเธเธฒเธ "(X เธเธฒเธ)" เนเธซเนเธกเธตเธเธเธฒเธ”เนเธซเธเนเน€เธ—เนเธฒเธเธฑเธเธ•เธฑเธงเน€เธฅเธเธเธณเธเธงเธเน€เธเธดเธเธญเธขเนเธฒเธเธชเธกเธชเนเธงเธเนเธฅเธฐเธเธฑเธ”เน€เธเธ 4) เธเธดเธเธเนเธเนเธญเธกเธนเธฅเธ เธฒเธเธฃเธงเธกเนเธฅเธฐเธเธฃเธฒเธเนเธ”เธเธฑเธ— KPI เธฃเธฐเธซเธงเนเธฒเธเธซเธเนเธฒ Overview เนเธฅเธฐ WBS เนเธเธเน€เธฃเธตเธขเธฅเนเธ—เธกเน',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธเธ—เธฑเนเธ 2 เธชเนเธงเธ: 1) "เธเธฃเธญเธเธชเธตเนเธ”เธ เนเธซเนเน€เธเธดเนเธกเธเธฒเธฃเนเธ” เธ•เธฒเธกเธฃเธนเธเธ—เธตเน 15 1.เนเธซเนเธเธงเนเธฒเธเน€เธ—เนเธฒเน€เธ”เธดเธกเนเธ•เนเธเธฃเธฑเธเธเธเธฒเธ”เธเธงเธฒเธกเธชเธนเธเนเธซเนเน€เธ—เนเธฒเธเธฑเธเธเธฒเธฃเนเธ” เน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธเธกเธนเธฅเธเนเธฒ/เธเธฒเธ": เธชเธฃเนเธฒเธเน€เธฅเธขเนเน€เธญเธฒเธ•เน .wbs-comparison-unified-grid เนเธฅเธฐ .wbs-side-summary-col เธเธฑเธ”เธงเธฒเธเธเธฒเธฃเนเธ” #wbsExecutiveDonutKpiCard เนเธงเนเธเธฑเนเธเธเนเธฒเธขเธเธญเธ #wbsTargetComparisonCard เธ”เนเธงเธข flex align-items: stretch เธ—เธณเนเธซเนเธเธฒเธฃเนเธ”เธ—เธฑเนเธเธชเธญเธเธกเธตเธเธงเธฒเธกเธชเธนเธเน€เธ—เนเธฒเธเธฑเธเธเธญเธ”เธต 100% เธเธฃเนเธญเธกเธเธฑเธเธเนเธเธฑเธ syncWbsSideKpiCard เนเธฅเธฐเธญเธฑเธเน€เธ”เธ• renderExecutiveDonutChart เนเธซเนเธงเธฒเธ”เธเธฃเธฒเธเนเธ”เธเธฑเธ—เธ—เธฑเนเธ 2 เธเธธเธ”เธเธฃเนเธญเธกเธเธฑเธ 2) "1.เธขเนเธฒเธขเธ•เธณเนเธซเธเนเธ เธ—เธตเนเน€เธฅเธทเธญเธเธเธฒเธ 2.เนเธฅเธฐเน€เธเธดเนเธกเธเธเธฒเธ”เธญเธฑเธเธฉเธฃเธ—เธตเนเธงเธเธเธฅเธก เนเธซเนเน€เธ—เนเธฒเธเธฑเธเธเธณเธเธงเธเน€เธเธดเธ": เธเธณเธเนเธฒเธขเน€เธฅเธทเธญเธเนเธฅเนเธงเธญเธญเธเธเธฒเธ .bar-header-left เนเธฅเนเธงเธขเนเธฒเธขเธกเธฒเนเธชเธ”เธเธ•เนเธญเธ—เนเธฒเธขเธ•เธฑเธงเน€เธฅเธเธกเธนเธฅเธเนเธฒเนเธ .stat-selected เน€เธเนเธ "เธชเนเธงเธเธ—เธตเนเน€เธฅเธทเธญเธ: +เธฟ... (X เธเธฒเธ)" เธเธฃเนเธญเธกเธเธฃเธฑเธเธเธเธฒเธ”เธเธญเธเธ•เนเธเธญเธ .lbl-sap ("CLSD F4:"), .sap-jobs-count ("(X เธเธฒเธ)"), .lbl-selected, เนเธฅเธฐ .selected-jobs-count เน€เธเนเธ 0.88rem font-weight: 800 เน€เธ—เนเธฒเธเธฑเธ .bar-amount-main เธเธฑเธ”เธงเธฒเธเนเธเนเธ–เธงเน€เธ”เธตเธขเธงเนเธเธ no-wrap เธเธกเธเธฑเธ” เธชเธงเธขเธเธฒเธก เธชเธกเธชเนเธงเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ เธเธฃเนเธญเธกเธ เธฒเธเธงเธเธเธฅเธกเธชเธตเนเธ”เธเนเธฅเธฐเธฅเธนเธเธจเธฃเธเธตเนเธ•เธณเนเธซเธเนเธ',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เน€เธเธดเนเธกเธเธฒเธฃเนเธ”เธ เธฒเธเธฃเธงเธก WBS เนเธฅเธฐเธเธฃเธฑเธเน€เธฅเธขเนเน€เธญเธฒเธ•เนเธเธฒเธฃเนเธชเธ”เธเธเธฅเธเธณเธเธงเธเธเธฒเธเนเธฅเธฐเธเธญเธเธ•เน)'
    },
    {
      id: 'log_000_kpi_comp_refine_and_badges_redesign',
      timestamp: '2026-10-23 21:12:00',
      timestampTh: '23 เธ•.เธ. 2569, 21:12 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเนเธ•เนเธ UI เธเธฒเธฃเนเธ”เน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธ & เธเนเธฒเธขเธกเธนเธฅเธเนเธฒ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธฃเธฑเธเนเธ•เนเธเธชเธตเธเธกเธเธนเธเธฒเธชเน€เธ—เธฅเธเนเธงเธเน€เธ”เธทเธญเธ, เธเธญเธเนเธเธงเธดเนเธเธเธธเนเธกเธเธณเธฅเธฑเธเน€เธฅเธทเธญเธ, เธเนเธฒเธขเธเธฃเธฃเธฅเธธเน€เธเนเธฒเน€เธเธตเธขเธงเน€เธฃเธทเธญเธเนเธชเธ, เธเนเธฒเธขเธเธณเธฅเธฑเธเน€เธฅเธทเธญเธเธ—เธญเธเธเธณเธเธฒเธง, เธเนเธฒเธขเธกเธนเธฅเธเนเธฒเธ—เธตเนเธ•เนเธญเธเธเธดเธ”เน€เธเธดเนเธกเธชเธตเนเธ”เธเน€เธฃเธทเธญเธเนเธชเธ, เนเธฅเธฐเธเนเธฒเธขเธกเธนเธฅเธเนเธฒเธฃเธงเธกเธชเธตเน€เธซเธฅเธทเธญเธเธ—เธญเธ',
      targetSubject: 'เธเธฒเธฃเนเธ”เน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธเน€เธเนเธฒเธซเธกเธฒเธข KPI (.single-bar-segment, .btn-wbs-kpi-month, .m-achieved-pill, .m-active-dot, .m-amt, .outcome-col-val) เนเธฅเธฐเธเนเธฒเธขเธซเธฑเธงเธ•เธฒเธฃเธฒเธ WBS (#wbsOfficesChartAucBadge)',
      storageFile: 'css/styles.css, index.html & js/data_history.js',
      changeSummary: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ 6 เธฃเธฒเธขเธเธฒเธฃ: 1) เน€เธเธฅเธตเนเธขเธเธชเธตเธเธทเนเธเธ—เธตเนเธเนเธงเธเน€เธ”เธทเธญเธเนเธฃเธ (เธ•.เธ.) เนเธเนเธ–เธเธเธฒเธ”เธเธฒเธฃเธ“เนเน€เธเนเธเธชเธตเธเธกเธเธนเธเธฒเธชเน€เธ—เธฅเธซเธงเธฒเธเน (#EC4899 - #F472B6 - #FBCFE8) เธ—เธฑเนเธเนเธเธซเธเนเธฒ Overview เนเธฅเธฐ WBS เธเธฃเนเธญเธกเธญเธฑเธเธฉเธฃเนเธฅเธฐเน€เธเธฒเน€เธเนเธกเธเธกเธเธฑเธ” 2) เธเธญเธเธเธธเนเธกเธเธณเธฅเธฑเธเน€เธฅเธทเธญเธ เธเธฃเธฑเธเน€เธเนเธเนเธเธงเธดเนเธเนเธชเธเน€เธฅเน€เธเธญเธฃเนเธชเธตเธเธฒเธงเธ—เธญเธเธเธฃเธฐเธเธฒเธขเน€เธเธเธฃเธงเธดเนเธเธงเธเธฃเธญเธเธฃเธนเธเธ—เธฃเธเธฅเธนเธเธจเธฃเนเธเธ 360 เธญเธเธจเธฒ (Running Light Border) 3) เธเนเธฒเธข "เธเธฃเธฃเธฅเธธเน€เธเนเธฒ" เธเธฃเธฑเธเน€เธเนเธเธเธทเนเธเน€เธเธตเธขเธงเน€เธฃเธทเธญเธเนเธชเธเธเธตเธญเธญเธเธกเธฃเธเธ• (#00FF88) เธเธฃเนเธญเธกเธญเธฑเธเธฉเธฃเธชเธตเน€เธเธตเธขเธงเธเนเธฒเน€เธเนเธกเธฅเธถเธ (#022C22) เธเธญเธเธ—เธฃเธฒเธชเธ•เนเธเธฑเธ”เน€เธเธ 100% 4) เธเนเธฒเธข "เธเธณเธฅเธฑเธเน€เธฅเธทเธญเธ" เธเธฃเธฑเธเธเธทเนเธเธซเธฅเธฑเธเน€เธเนเธเธชเธตเธ—เธญเธเธเธณเธเธฒเธงเน€เธฃเธทเธญเธเนเธชเธ (White-Gold Halo) เธเธฃเนเธญเธกเธญเธฑเธเธฉเธฃเธกเนเธงเธเน€เธเนเธกเธเธกเธเธฑเธ”เนเธฅเธฐเนเธเธเธฐเธเธฃเธดเธเธชเธตเธชเนเธกเธ—เธญเธ 5) เธกเธนเธฅเธเนเธฒ/เธเธฒเธเธ—เธตเนเธ•เนเธญเธเธเธดเธ”เน€เธเธดเนเธก เธเธฃเธฑเธเน€เธเนเธเธเนเธฒเธขเธเธทเนเธเธซเธฅเธฑเธเธชเธตเนเธ”เธเน€เธฃเธทเธญเธเนเธชเธ (#EF4444) เธ•เธฑเธงเน€เธฅเธเธชเธตเธเธฒเธงเธซเธเธฒเน€เธ”เนเธเธเธฑเธ” เธ—เธฑเนเธเธเธเธเธธเนเธกเน€เธ”เธทเธญเธเนเธฅเธฐเธเธฅเนเธญเธเธเธฅเธฅเธฑเธเธเน 6) เธเนเธฒเธข [เธกเธนเธฅเธเนเธฒเธฃเธงเธก: เธฟ...] เธซเธฑเธงเธ•เธฒเธฃเธฒเธ WBS เน€เธเธฅเธตเนเธขเธเน€เธเนเธเธเธทเนเธเธซเธฅเธฑเธเธชเธตเน€เธซเธฅเธทเธญเธเธ—เธญเธเนเธฅเธฐเธ•เธฑเธงเธซเธเธฑเธเธชเธทเธญเธชเธตเธ—เธญเธเน€เธซเธกเธทเธญเธเธเนเธฒเธขเธเนเธฒเธเน',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธเนเธฅเธฐเธ เธฒเธเธฃเธฐเธเธธ: 1) เนเธ css/styles.css เธเธฃเธฑเธเนเธ•เนเธ .single-bar-segment.seg-1, .btn-wbs-kpi-month.m-seg-1, เนเธฅเธฐ .active.m-seg-1 เนเธซเนเนเธเนเนเธ—เธเธชเธตเธเธกเธเธนเธเธฒเธชเน€เธ—เธฅเธซเธงเธฒเธเน เธเธฃเนเธญเธก text-shadow เธฅเธถเธเธเธกเธเธฑเธ” 2) เน€เธเธดเนเธก @keyframes kpiRunningBorderLight เธชเธณเธซเธฃเธฑเธ .btn-wbs-kpi-month.active เธชเธฃเนเธฒเธเน€เธญเธเน€เธเธเธ•เนเนเธเธงเธดเนเธเธเธตเธญเธญเธเธชเธตเธเธฒเธงเธ—เธญเธเธเธฃเธฐเธเธฒเธขเน€เธเธเธฃ 2.2s linear infinite 3) เธเธฃเธฑเธเธเธฃเธธเธ .seg-status เนเธฅเธฐ .m-achieved-pill เนเธเน gradient เธเธตเธญเธญเธเธกเธฃเธเธ• #00FF88 - #10B981 เธเธญเธเธเธฒเธง เธญเธฑเธเธฉเธฃ #022C22 4) เธเธฃเธฑเธเธเธฃเธธเธ .m-active-dot เนเธเน gradient เธชเธตเธ—เธญเธเธเธณเธเธฒเธงเน€เธฃเธทเธญเธเนเธชเธ เธญเธฑเธเธฉเธฃ #1E0A3C เธเธฃเนเธญเธก .pulse-beacon-gold 5) เธเธฃเธฑเธเธเธฃเธธเธ .m-amt เนเธฅเธฐ .seg-amt เน€เธกเธทเนเธญเธขเธฑเธเนเธกเนเธเธฃเธฃเธฅเธธเน€เธเนเธฒ เนเธซเนเนเธชเธ”เธเน€เธเนเธเธเนเธฒเธขเธชเธตเนเธ”เธเน€เธฃเธทเธญเธเนเธชเธ #EF4444 เธเธญเธเธเธฒเธง เธเธฃเนเธญเธกเธเธฃเธฑเธเธเธฃเธธเธเธเธฅเนเธญเธเธเธฅเธฅเธฑเธเธเน .val-pending เนเธฅเธฐ .outcome-col-sub 6) เนเธ index.html เธเธฃเธฑเธเธชเนเธ•เธฅเน #wbsOfficesChartAucBadge เนเธซเนเธกเธต background: rgba(255,210,90,0.18), color: #FFD25A เนเธฅเธฐ border เธชเธตเธ—เธญเธเน€เธเนเธฒเธเธธเธ”เธเธฑเธ #wbsOfficesChartCountBadge 7) เธญเธฑเธเน€เธ”เธ• cache buster เน€เธเนเธ ?v=20261023_2112',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ เธเธฃเนเธญเธกเธ เธฒเธเธงเธเธเธฅเธกเธชเธตเนเธ”เธเธฃเธฐเธเธธเธ•เธณเนเธซเธเนเธ',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธเธ”เธตเนเธเธเนเธเธงเธฒเธกเธชเธงเธขเธเธฒเธก เธเธกเธเธฑเธ” เนเธฅเธฐเธชเนเธ•เธฅเนเนเธเธงเธดเนเธเธเธญเธเธฃเธฐเธเธ)'
    },
    {
      id: 'log_000_wbs_banner_card_remove_and_export_btn_relocated',
      timestamp: '2026-10-23 20:30:00',
      timestampTh: '23 เธ•.เธ. 2569, 20:30 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธณเนเธเธเน€เธเธญเธฃเน WBS เธญเธญเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธณเธเธฅเนเธญเธเนเธเธเน€เธเธญเธฃเน "เธฃเธฒเธขเธเธฒเธเธ•เธดเธ”เธ•เธฒเธกเธเธฒเธ WBS เธเธเน€เธซเธฅเธทเธญ" เธญเธญเธเธ•เธฒเธกเธ เธฒเธเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ',
      targetSubject: 'เนเธเธเน€เธเธญเธฃเนเธซเธฑเธงเนเธ—เนเธ WBS เธเธเน€เธซเธฅเธทเธญ (.wbs-banner-card) เนเธเนเธ—เนเธ WBS',
      storageFile: 'index.html & js/data_history.js',
      changeSummary: 'เธเธณเธเธฅเนเธญเธเนเธเธเน€เธเธญเธฃเน .wbs-banner-card (เธเธฃเธฐเธเธญเธเธ”เนเธงเธข เธซเธฑเธงเธเนเธญเธฃเธฒเธขเธเธฒเธ, เธเธณเธญเธเธดเธเธฒเธข, เนเธ–เธเธเนเธฒเธขเธงเธฑเธเธ—เธตเน/เน€เธงเธฅเธฒเธเธณเน€เธเนเธฒเนเธเธฅเน 03-06) เธญเธญเธเธเธฒเธเนเธ—เนเธ WBS เธเธเน€เธซเธฅเธทเธญเธ•เธฒเธกเธ เธฒเธเธ—เธตเนเธเธนเนเนเธเนเนเธเธเน€เธเธญเธฃเนเธฃเธฐเธเธธ เธเธฃเนเธญเธกเธขเนเธฒเธขเธเธธเนเธกเธชเนเธเธญเธญเธ WBS (CSV) เธเธถเนเธเนเธเนเธงเนเธ—เธตเนเนเธ–เธเน€เธเธฃเธทเนเธญเธเธกเธทเธญเน€เธซเธเธทเธญเธ•เธฒเธฃเธฒเธ WBS (.table-header-bar) เธเนเธฒเธเธเธธเนเธกเธเธดเธเธเน Google Sheet เน€เธเธทเนเธญเนเธซเนเธเธนเนเนเธเนเธขเธฑเธเธเธเธชเนเธเธญเธญเธเธเนเธญเธกเธนเธฅเนเธ”เนเธชเธฐเธ”เธงเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธญเธฒเธญเธญเธ - เธเธฃเนเธญเธกเธ เธฒเธเธเธฅเนเธญเธเนเธเธเน€เธเธญเธฃเนเธฃเธฒเธขเธเธฒเธเธ•เธดเธ”เธ•เธฒเธกเธเธฒเธ WBS เธเธเน€เธซเธฅเธทเธญ): 1) เนเธ index.html เธเธณเธซเธเธ” style="display: none !important;" เนเธซเนเธเธฑเธ .wbs-banner-card เธ—เธณเนเธซเนเธเธทเนเธเธ—เธตเนเธ”เนเธฒเธเธเธเนเธ—เนเธ WBS เธเธฃเธฐเธเธฑเธ เธเธฅเธตเธ เนเธฅเธฐเธชเธงเธขเธเธฒเธก 2) เธขเนเธฒเธขเธเธธเนเธก "เธชเนเธเธญเธญเธ WBS (CSV)" เนเธเธเธฑเธ”เธงเธฒเธเนเธ .table-header-bar เธฃเนเธงเธกเธเธฑเธเธเธธเนเธกเธเธดเธเธเน Google Sheet เนเธฅเธฐเธเธธเนเธกเน€เธฅเธทเธญเธเธเธญเธฅเธฑเธกเธเน 3) เธเธฃเธฑเธเธเธฃเธธเธ Version Cache Buster เน€เธเนเธ ?v=20261023_2030',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธญเธฒเธญเธญเธ - เธเธฃเนเธญเธกเธ เธฒเธเนเธเธเน€เธเธญเธฃเนเธเธฅเนเธญเธเนเธเธเน€เธเธญเธฃเน .wbs-banner-card)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเธเธฃเธธเธ UI เธเธณเธเธฅเนเธญเธเนเธเธเน€เธเธญเธฃเนเธ”เนเธฒเธเธเธเธญเธญเธเนเธฅเธฐเธขเนเธฒเธขเธเธธเนเธกเธชเนเธเธญเธญเธ CSV)'
    },
    {
      id: 'log_000_crit_bar_widen_and_fix_overlaps',
      timestamp: '2026-10-23 20:28:00',
      timestampTh: '23 เธ•.เธ. 2569, 20:28 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธขเธฒเธขเธเธฃเธฒเธ & เนเธเนเธเนเธฒเธขเธ—เธฑเธเธเธฑเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธขเธฒเธขเธเธงเธฒเธกเธเธงเนเธฒเธเธเธฃเธฒเธเนเธ—เนเธเนเธฅเธฐเธเนเธฒเธข %เธเธดเธ”เธเธฒเธ/KPI เนเธกเนเนเธซเนเน€เธเธดเธเธเธฃเธฒเธ เนเธฅเธฐเนเธเนเนเธเธเธฑเธเธซเธฒเธ•เธฑเธงเธญเธฑเธเธฉเธฃเธเนเธญเธเธ—เธฑเธเธเธฑเธเธญเธขเนเธฒเธเธชเธกเธชเนเธงเธเธชเธงเธขเธเธฒเธก',
      targetSubject: 'เธเธฃเธฒเธเนเธ—เนเธเธฃเนเธญเธขเธฅเธฐเธเธงเธฒเธกเธชเธณเน€เธฃเนเธเธเธฒเธฃเธเธดเธ”เธเธฒเธเนเธขเธเธ•เธฒเธกเน€เธเธ“เธ‘เนเธงเธฑเธ” (#criteriaBarChart) เนเธเน€เธกเธเธนเธ เธฒเธเธฃเธงเธกเธเธนเนเธเธฃเธดเธซเธฒเธฃ',
      storageFile: 'js/app.js, js/chart.js & js/data_history.js',
      changeSummary: '1) เธเธขเธฒเธขเธเธงเธฒเธกเธเธงเนเธฒเธเนเธ—เนเธเธเธฃเธฒเธ (barRatio เธเธฒเธ 0.82 เน€เธเนเธ 0.88, maxBarWidth เธเธฒเธ 80px เน€เธเนเธ 120px) เนเธซเนเนเธ—เนเธเธเธงเนเธฒเธเธเธถเนเธ เน€เธ•เนเธกเธ•เธฒ เธชเธกเธชเนเธงเธเธชเธงเธขเธเธฒเธก 2) เธเธขเธฒเธขเธเธงเธฒเธกเธเธงเนเธฒเธเธเธญเธเธเนเธฒเธขเน€เธเนเธฒเธซเธกเธฒเธข KPI เนเธฅเธฐเธเนเธฒเธข %เธเธดเธ”เธเธฒเธเธฅเนเธฒเธเธชเธธเธ”เธ•เธฒเธกเธเธงเธฒเธกเธเธงเนเธฒเธเนเธ—เนเธ เนเธ”เธขเน€เธงเนเธเธฃเธฐเธขเธฐเธเธญเธเธเนเธฒเธเธฅเธฐ 3px เธเธญเธ”เธตเน€เธเนเธฐ เนเธกเนเน€เธเธดเธเธเธญเธเนเธ—เนเธเธเธฃเธฒเธ 3) เนเธเนเนเธเธเธฑเธเธซเธฒเธ•เธฑเธงเธญเธฑเธเธฉเธฃเนเธฅเธฐเธเนเธฒเธขเธเนเธญเธเธ—เธฑเธเธเธฑเธ เนเธ”เธขเธฅเนเธญเธเนเธกเนเนเธซเนเธเนเธฒเธขเน€เธเนเธฒเธซเธกเธฒเธขเธ”เธฑเธเธเธถเนเธเนเธเธ—เธฑเธเธเนเธฒเธข "โ“ เธเธฃเธฃเธฅเธธเน€เธเนเธฒเธซเธกเธฒเธข" เน€เธซเธเธทเธญเนเธ—เนเธเธเธฃเธฒเธ เธเธฃเนเธญเธกเน€เธงเนเธเธฃเธฐเธขเธฐเธซเนเธฒเธ minGap 4px เนเธฅเธฐเธเนเธญเธเธเธฑเธเนเธกเนเนเธซเนเธเนเธฒเธขเน€เธเนเธฒเธซเธกเธฒเธขเธฅเธเธกเธฒเธเธเธ”เธฒเธง โญ เนเธฅเธฐเธเนเธฒเธข % เธ”เนเธฒเธเธฅเนเธฒเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเนเธญเธเธณเธซเธเธ” 3 เธเนเธญเธเธญเธเธเธนเนเนเธเนเธเธฒเธ: 1) "เธเธขเธฒเธขเธเธงเธฒเธกเธเธงเนเธฒเธเธเธฃเธฒเธ เนเธฅเธฐ%เธเธดเธ”เธเธฒเธ/KPI เนเธ•เนเนเธกเนเนเธซเนเน€เธเธดเธเธเธฃเธฒเธเธญเธญเธเธกเธฒ": เนเธ js/app.js เธเธฃเธฑเธ barRatio: 0.88 เนเธฅเธฐ maxBarWidth: 120px เนเธ js/chart.js เธเธณเธซเธเธ” badgeW เนเธฅเธฐ pillW เน€เธเนเธ currentBarW - badgeInset (เน€เธงเนเธเธฃเธฐเธขเธฐเธเธญเธเธเนเธฒเธข-เธเธงเธฒเธเนเธฒเธเธฅเธฐ 3px เธเธญเธ”เธต) เธเนเธฒเธขเนเธฅเธฐเธ•เธฑเธงเน€เธฅเธเธเธถเธเธเธขเธฒเธขเน€เธ•เนเธกเธเธงเธฒเธกเธเธงเนเธฒเธเนเธ—เนเธเธญเธขเนเธฒเธเธชเธกเธชเนเธงเธ 100% เนเธ”เธขเนเธกเนเน€เธเธดเธเธเธฃเธฒเธเธญเธญเธเธกเธฒ 2) "เนเธกเนเนเธซเนเธญเธฑเธเธฉเธฃ เธเนเธญเธเธ—เธฑเธเธเธฑเธ": เนเธ js/chart.js เธเธฃเธฑเธเธเธฃเธธเธ relaxation loop: เธ•เธฃเธงเธเธชเธญเธ hasAchieveBadge (เน€เธกเธทเนเธญเนเธ—เนเธเธกเธตเธเนเธฒเธข โ“ เธเธฃเธฃเธฅเธธเน€เธเนเธฒเธซเธกเธฒเธข) เธเธณเธซเธเธ” minAllowedY = pad.top + 3 เธฅเนเธญเธเนเธกเนเนเธซเนเน€เธเนเธฒเธซเธกเธฒเธขเนเธเนเธ—เนเธเธ”เธฑเธเธเธถเนเธเนเธเธเธเธเนเธฒเธขเธเธฃเธฃเธฅเธธเน€เธเนเธฒเธซเธกเธฒเธขเธ”เนเธฒเธเธเธ, เธเธฃเธฑเธเธฃเธฐเธขเธฐ achieveBadgeY เนเธซเนเธญเธขเธนเนเน€เธซเธเธทเธญเนเธ—เนเธ 6px, เน€เธเธดเนเธก minGap เธฃเธฐเธซเธงเนเธฒเธเธเนเธฒเธขเน€เธเนเธฒเธซเธกเธฒเธขเน€เธเนเธ 4.0px, เนเธฅเธฐเธเธณเธเธฑเธ” maxAllowedY เธเนเธญเธเธเธฑเธเนเธกเนเนเธซเนเธเนเธฒเธขเธเธเธฅเธเธกเธฒเธ—เธฑเธเธ”เธฒเธง โญ เนเธฅเธฐเธเนเธฒเธข % เธฅเนเธฒเธเธชเธธเธ” 3) "เธชเธงเธขเธเธฒเธก เธชเธกเธชเนเธงเธ": เธเธฑเธ”เธงเธฒเธ Typography เธเธเธฒเธ”เธเธญเธเธ•เน 8.8px เธเธกเธเธฑเธ” เนเธฅเธฐเธ•เธฑเธงเน€เธฅเธ % เธฅเนเธฒเธเธชเธธเธ” 11px เธชเธตเน€เธซเธฅเธทเธญเธเธ—เธญเธ PEA Gold เธชเธงเธขเธเธฒเธกเธฅเธเธ•เธฑเธงเธฃเธฐเธ”เธฑเธเธเธฃเธตเน€เธกเธตเธขเธก',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (1.เธเธขเธฒเธขเธเธงเธฒเธกเธเธงเนเธฒเธเธเธฃเธฒเธ เนเธฅเธฐ%เธเธดเธ”เธเธฒเธ/KPI เนเธ•เนเนเธกเนเนเธซเนเน€เธเธดเธเธเธฃเธฒเธเธญเธญเธเธกเธฒ 2.เนเธกเนเนเธซเนเธญเธฑเธเธฉเธฃ เธเนเธญเธเธ—เธฑเธเธเธฑเธ 3..เธชเธงเธขเธเธฒเธก เธชเธกเธชเนเธงเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธเน€เธฅเธขเนเน€เธญเธฒเธ•เนเธเธฃเธฒเธเนเธ—เนเธ เธเธงเธฒเธกเธเธงเนเธฒเธ เนเธฅเธฐเธฃเธฐเธเธเธเนเธญเธเธเธฑเธเธเนเธฒเธขเธเนเธญเธเธ—เธฑเธ)'
    },
    {
      id: 'log_000_remove_metric_toggle_for_all_criteria',
      timestamp: '2026-10-23 20:25:00',
      timestampTh: '23 เธ•.เธ. 2569, 20:25 เธ.',
      type: 'EDIT',
      typeBadge: 'เน€เธญเธฒเธเธธเนเธกเธชเธฅเธฑเธเธกเธนเธฅเธเนเธฒ/เธเธฒเธเธญเธญเธ (เน€เธฅเธทเธญเธเธ—เธฑเนเธเธซเธกเธ”)',
      badgeClass: 'badge-type-edit',
      title: 'เธเธณเธเธธเนเธกเธชเธฅเธฑเธเธซเธเนเธงเธข [๐’ฐ เธกเธนเธฅเธเนเธฒ / โก เธเธฒเธ] เธ—เธฑเนเธ 2 เธเธธเธ” เธญเธญเธเน€เธกเธทเนเธญเน€เธฅเธทเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ” "เน€เธฅเธทเธญเธเธ—เธฑเนเธเธซเธกเธ”"',
      targetSubject: 'เนเธ–เธเน€เธเนเธฒเธซเธกเธฒเธขเธ—เธตเนเธ•เนเธญเธเธเธดเธ”เธเธฒเธเน€เธเธดเนเธก (#next3mProjectionSection) เนเธเน€เธกเธเธนเธ เธฒเธเธฃเธงเธกเธเธนเนเธเธฃเธดเธซเธฒเธฃ',
      storageFile: 'js/app.js, index.html & js/data_history.js',
      changeSummary: 'เธเธณเธเธธเนเธกเธชเธฅเธฑเธเธซเธเนเธงเธข [๐’ฐ เธกเธนเธฅเธเนเธฒ / โก เธเธฒเธ] เธ—เธฑเนเธ 2 เธ•เธณเนเธซเธเนเธเธ•เธฒเธกเธ—เธตเนเธงเธเธเธฅเธกเธชเธตเนเธ”เธ (เธเธธเนเธกเธ”เนเธฒเธเธเธเธเธญเธเธเธฒเธฃเนเธ” เนเธฅเธฐเธเธธเนเธกเน€เธฅเนเธเนเธเนเธ–เธเธซเธฑเธงเธเนเธญเธเธฒเธฃเนเธ”) เธญเธญเธเน€เธกเธทเนเธญเธ•เธฑเธงเธเธฃเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ”เน€เธเนเธ "เน€เธฅเธทเธญเธเธ—เธฑเนเธเธซเธกเธ”" เนเธ”เธขเธเธณเธซเธเธ”เนเธซเนเนเธชเธ”เธเน€เธเนเธฒเธซเธกเธฒเธขเน€เธเนเธเธซเธเนเธงเธขเธกเธนเธฅเธเนเธฒ (เธฅเนเธฒเธเธเธฒเธ—) เน€เธเนเธเธเนเธฒเน€เธฃเธดเนเธกเธ•เนเธเนเธ”เธขเธญเธฑเธ•เนเธเธกเธฑเธ•เธด',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธญเธฒเธญเธญเธ - เธเธฃเนเธญเธกเธ เธฒเธเธฃเธฐเธเธธเธงเธเธเธฅเธกเธชเธตเนเธ”เธ 2 เธเธธเธ” เนเธฅเธฐเธเธณเธชเธฑเนเธ "เน€เธเธเธฒเธฐเน€เธเธ“เธงเธฑเธ” เน€เธฅเธทเธญเธเธ—เธฑเนเธเธซเธกเธ”"): 1) เนเธ js/app.js เธเธฃเธฑเธเธเธฃเธธเธเธเธฑเธเธเนเธเธฑเธ renderNext3mHorizontalBarChart เนเธซเนเธ•เธฃเธงเธเธเธฑเธเน€เธเธทเนเธญเธเนเธ isAllCriteria (!state.filters.criteria || state.filters.criteria === "ALL") เนเธ”เธขเธฅเนเธญเธ activeMode เนเธฅเธฐ state.next3mHBarMode เน€เธเนเธ "val" เนเธฅเธฐเธเธณเธซเธเธ” showControls เน€เธเนเธ false เธ—เธณเนเธซเนเธเธธเนเธก toggle เธขเธนเธเธดเธ• (.next3m-metric-toggle-wrap) เนเธเนเธ–เธเธซเธฑเธงเธเนเธญเธเธฒเธฃเนเธ”เนเธกเนเธ–เธนเธเน€เธฃเธเน€เธ”เธญเธฃเน 2) เธเนเธญเธเธเธญเธเน€เธ—เธเน€เธเธญเธฃเนเธเธธเนเธกเธเธ (#next3mChartHeader / #next3mHBarControls) เธ–เธฒเธงเธฃ เธเนเธญเธเธเธฑเธเธเธฒเธฃเนเธชเธ”เธเธเธธเนเธกเธฅเธญเธขเธเนเธณเธเนเธญเธ 3) เนเธ index.html เธเธณเธซเธเธ” style="display:none !important;" เนเธซเนเธเธฑเธ #next3mChartHeader 4) เธญเธฑเธเน€เธ”เธ• Version Cache Buster เน€เธเนเธ ?v=20261023_2025',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธญเธฒเธญเธญเธ - เธงเธเธเธฅเธกเธชเธตเนเธ”เธ 2 เธเธธเธ” / เน€เธเธเธฒเธฐเน€เธเธ“เธงเธฑเธ” เน€เธฅเธทเธญเธเธ—เธฑเนเธเธซเธกเธ”)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเธเธฃเธธเธ UI เธเธณเธเธธเนเธกเธชเธฅเธฑเธเธซเธเนเธงเธขเธญเธญเธเน€เธกเธทเนเธญเน€เธฅเธทเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ”เธ—เธฑเนเธเธซเธกเธ”)'
    },
    {
      id: 'log_000_growth_tables_value_and_pct',
      timestamp: '2026-10-23 11:27:00',
      timestampTh: '23 เธ•.เธ. 2569, 11:27 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธ•เธฒเธฃเธฒเธเน€เธเธดเนเธก/เธฅเธ”เธฃเธฒเธขเน€เธ”เธทเธญเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธฃเธฑเธเธ•เธฒเธฃเธฒเธเธ”เนเธฒเธเธเธงเธฒเธเธฃเธฒเธ Timeline: เนเธชเธ”เธเธกเธนเธฅเธเนเธฒเธเธดเธ”เธเธฒเธเธ—เธตเนเน€เธเธดเนเธก/เธฅเธ” [เน€เธฅเธ 1] & % [เน€เธฅเธ 2] เนเธฅเธฐเธกเธนเธฅเธเนเธฒเธ เธฒเธเธฃเธงเธกเธ—เธตเนเน€เธเธดเนเธก/เธฅเธ” [เน€เธฅเธ 3] & % [เน€เธฅเธ 4] เธเธฃเนเธญเธกเธฃเธฐเธเธธเธญเธฑเธเธฉเธฃ "เธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ"',
      targetSubject: 'เธ•เธฒเธฃเธฒเธเน€เธเธดเนเธก/เธฅเธ”เธฃเธฒเธขเน€เธ”เธทเธญเธเธ”เนเธฒเธเธเธงเธฒเธเธฃเธฒเธ Timeline (timelinePctGrowthTableWrap & timelineAmountGrowthTableWrap), เธเธฑเธเธเนเธเธฑเธเธเธณเธเธงเธ“เนเธฅเธฐเนเธชเธ”เธเธเธฅ (calculateTimelineComprehensiveGrowth & renderTimelineGrowthTable)',
      storageFile: 'js/app.js, css/styles.css, index.html & js/data_history.js',
      changeSummary: 'เธเธฃเธฑเธเธเธฃเธธเธเธ•เธฒเธฃเธฒเธเธชเธ–เธดเธ•เธดเน€เธเธดเนเธก/เธฅเธ”เธฃเธฒเธขเน€เธ”เธทเธญเธเธ”เนเธฒเธเธเธงเธฒเธเธญเธเธเธฃเธฒเธเธ—เธฑเนเธ 2 เธชเนเธงเธ: 1) เธเธฃเธฒเธเธเธ (เธฃเนเธญเธขเธฅเธฐเธเธดเธ”เธเธฒเธ): เนเธชเธ”เธเธซเธฑเธงเธ•เธฒเธฃเธฒเธ "เธกเธนเธฅเธเนเธฒเธเธดเธ”เธเธฒเธ" เธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ/เธฅเธ”เธฅเธเนเธ•เนเธฅเธฐเน€เธ”เธทเธญเธ [เน€เธฅเธ 1] เธเธงเธเธเธนเนเธเธฑเธ % เธเธดเธ”เธเธฒเธ [เน€เธฅเธ 2] 2) เธเธฃเธฒเธเธฅเนเธฒเธ (เธ เธฒเธเธฃเธงเธกเธงเธเน€เธเธดเธ): เนเธชเธ”เธเธซเธฑเธงเธ•เธฒเธฃเธฒเธเธญเธฑเธเธฉเธฃ "เธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ" เธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ/เธฅเธ”เธฅเธเนเธ•เนเธฅเธฐเน€เธ”เธทเธญเธ [เน€เธฅเธ 3] เธเธงเธเธเธนเนเธเธฑเธ % เธ เธฒเธเธฃเธงเธก MoM [เน€เธฅเธ 4] 3) เธเธฃเธฑเธเธเธงเธฒเธกเธเธงเนเธฒเธเธ•เธฒเธฃเธฒเธเธ—เธฑเนเธเธชเธญเธเนเธซเนเธกเธตเธเธเธฒเธ” 255px เธชเธญเธ”เธฃเธฑเธเธเธฑเธเธญเธขเนเธฒเธเธชเธงเธขเธเธฒเธก 4) เนเธชเธ”เธเธเนเธฒเน€เธเธฅเธตเนเธขเธ—เธฑเนเธเธกเธนเธฅเธเนเธฒเนเธฅเธฐเธฃเนเธญเธขเธฅเธฐเนเธเนเธ–เธง Footer',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "เน€เธฅเธ 1 เนเธซเนเนเธชเธ”เธ เธกเธนเธฅเธเนเธฒเธเธดเธ”เธเธฒเธ เธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ/เธฅเธ”เธฅเธ เนเธ•เนเธฅเธฐเน€เธ”เธทเธญเธ เนเธฅเธฐเน€เธเนเธ % เธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ/เธฅเธ”เธฅเธ เนเธ•เนเธฅเธฐเน€เธ”เธทเธญเธ เธ•เธฃเธเน€เธฅเธ 2 เนเธฅเธฐเธ”เนเธฒเธเธฅเนเธฒเธ เนเธซเนเนเธชเธ”เธเธกเธนเธฅเธเนเธฒ เธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ เธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ/เธฅเธ”เธฅเธ เนเธ•เนเธฅเธฐเน€เธ”เธทเธญเธ เธ—เธตเนเน€เธฅเธ 3 เนเธฅเธฐ % เธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ/เธฅเธ”เธฅเธ เนเธ•เนเธฅเธฐเน€เธ”เธทเธญเธ เน€เธฅเธ 4 / เนเธชเธ”เธเธญเธฑเธเธฉเธฃ เธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ": 1) เธเธฃเธฑเธเธเธฃเธธเธเธเธฑเธเธเนเธเธฑเธ calculateTimelineComprehensiveGrowth เนเธ js/app.js เนเธซเนเธเธณเธเธงเธ“เธชเนเธงเธเธ•เนเธฒเธเธกเธนเธฅเธเนเธฒเธฃเธฒเธขเน€เธ”เธทเธญเธ (Value Delta) เนเธฅเธฐเธฃเนเธญเธขเธฅเธฐเธฃเธฒเธขเน€เธ”เธทเธญเธ (% Delta) เธชเธณเธซเธฃเธฑเธเธ—เธฑเนเธเธเธฒเธเธเธดเธ”เธเธฒเธเนเธฅเธฐเธ เธฒเธเธฃเธงเธก AUC เธเธฃเธ 12 เน€เธ”เธทเธญเธ 2) เธเธฃเธฑเธเธเธฑเธเธเนเธเธฑเธ renderTimelineGrowthTable เนเธซเนเนเธชเธ”เธเธเธทเนเธญเธซเธฑเธงเธ•เธฒเธฃเธฒเธ "โ— เธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ (เธฅเธ.)" เธชเธณเธซเธฃเธฑเธเธเธฃเธฒเธเธฅเนเธฒเธ เนเธฅเธฐ "โ— เธกเธนเธฅเธเนเธฒเธเธดเธ”เธเธฒเธ (เธฅเธ.)" เธชเธณเธซเธฃเธฑเธเธเธฃเธฒเธเธเธ เธญเธขเนเธฒเธเธเธฑเธ”เน€เธเธ 3) เธเธฃเธฑเธเนเธ•เนเธ CSS เนเธซเนเธ•เธฒเธฃเธฒเธเธ—เธฑเนเธเธชเธญเธเธเธฒเธฃเนเธ”เธกเธตเธเธงเธฒเธกเธเธงเนเธฒเธ 255px เธเธฑเธ”เธงเธฒเธเธชเธกเธ”เธธเธฅเนเธฅเธฐเธชเธงเธขเธเธฒเธก 4) เธญเธฑเธเน€เธ”เธ• Version Cache Buster เนเธ index.html เน€เธเนเธ 20261023_1127',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธฅเธ 1 เนเธซเนเนเธชเธ”เธ เธกเธนเธฅเธเนเธฒเธเธดเธ”เธเธฒเธ เธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ/เธฅเธ”เธฅเธ เนเธ•เนเธฅเธฐเน€เธ”เธทเธญเธ เนเธฅเธฐเน€เธเนเธ % เธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ/เธฅเธ”เธฅเธ เนเธ•เนเธฅเธฐเน€เธ”เธทเธญเธ เธ•เธฃเธเน€เธฅเธ 2 / เนเธฅเธฐเธ”เนเธฒเธเธฅเนเธฒเธ เนเธซเนเนเธชเธ”เธเธกเธนเธฅเธเนเธฒ เธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ เธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ/เธฅเธ”เธฅเธ เนเธ•เนเธฅเธฐเน€เธ”เธทเธญเธ เธ—เธตเนเน€เธฅเธ 3 เนเธฅเธฐ % เธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ/เธฅเธ”เธฅเธ เนเธ•เนเธฅเธฐเน€เธ”เธทเธญเธ เน€เธฅเธ 4 / เนเธชเธ”เธเธญเธฑเธเธฉเธฃ เธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_default_criteria_set_to_all',
      timestamp: '2026-10-23 10:55:00',
      timestampTh: '23 เธ•.เธ. 2569, 10:55 เธ.',
      type: 'CONFIG',
      typeBadge: 'เน€เธเธฅเธตเนเธขเธ Default เน€เธเธ“เธ‘เนเธงเธฑเธ”เน€เธเนเธเน€เธฅเธทเธญเธเธ—เธฑเนเธเธซเธกเธ”',
      badgeClass: 'badge-type-config',
      title: 'เธเธฃเธฑเธเธเนเธฒเน€เธฃเธดเนเธกเธ•เนเธ (Default) เธเธญเธเธ•เธฑเธงเธเธฃเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ”เน€เธเนเธ "เน€เธฅเธทเธญเธเธ—เธฑเนเธเธซเธกเธ”" (ALL)',
      targetSubject: 'เธ•เธฑเธงเธเธฃเธญเธเธเธฃเธฐเน€เธ เธ—เน€เธเธ“เธ‘เนเธงเธฑเธ” (#filterCriteria, select-chart-crit), เธชเธ–เธฒเธเธฐเน€เธฃเธดเนเธกเธ•เนเธเธเธญเธเธฃเธฐเธเธ (state.filters.criteria), เธเธธเนเธกเธขเธฒเธเธฅเธเธฃเธตเน€เธเนเธ•',
      storageFile: 'js/app.js, index.html & js/data_history.js',
      changeSummary: 'เน€เธเธฅเธตเนเธขเธเธเนเธฒเน€เธฃเธดเนเธกเธ•เนเธเธเธญเธเธเธฃเธฐเน€เธ เธ—เน€เธเธ“เธ‘เนเธงเธฑเธ”เธเธฒเธเน€เธ”เธดเธกเธ—เธตเนเธฅเนเธญเธเนเธงเนเธ—เธตเนเธเนเธญ 1.1 เน€เธเนเธ "เน€เธฅเธทเธญเธเธ—เธฑเนเธเธซเธกเธ”" (ALL): 1) เธเธณเธซเธเธ” state.filters.criteria เน€เธฃเธดเนเธกเธ•เนเธเน€เธเนเธ "ALL" 2) เธเธณเธซเธเธ” <option value="ALL" selected> เนเธ index.html 3) เธเธฃเธฑเธเธเธธเนเธกเธขเธฒเธเธฅเธเนเธฅเธฐเธเธธเนเธกเธฃเธตเน€เธเนเธ•เธ•เธฑเธงเธเธฃเธญเธเนเธซเนเธเธทเธเธเนเธฒเน€เธเนเธ "ALL" 4) เธเธดเธเธเน dropdown เธเธเธเธฃเธฒเธเนเธฅเธฐเธ เธฒเธเธฃเธงเธกเนเธซเนเน€เธฃเธดเนเธกเธ•เนเธเธ—เธตเนเธ เธฒเธเธฃเธงเธกเธ—เธธเธเน€เธเธ“เธ‘เนเธงเธฑเธ”เธ—เธฑเธเธ—เธตเธ—เธตเนเน€เธเธดเธ”เธฃเธฐเธเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธ "เน€เธเธ“เธงเธฑเธ” เนเธซเนเน€เธเธฅเธตเนเธขเธ default เน€เธเนเธ เน€เธฅเธทเธญเธเธ—เธฑเนเธเธซเธกเธ”": 1) เธเธฃเธฑเธเธเธฃเธธเธ state.filters.criteria เนเธฅเธฐ selectedCriteria เนเธ js/app.js เนเธซเนเธกเธตเธเนเธฒเน€เธฃเธดเนเธกเธ•เนเธเน€เธเนเธ ALL เนเธฅเธฐ [] 2) เนเธเนเนเธเธเธฑเธเธเนเธเธฑเธ populateFilterDropdowns เนเธซเน fallback เน€เธเนเธ ALL 3) เธเธฃเธฑเธเธเธฃเธธเธเธเธฑเธเธเนเธเธฑเธเธฃเธตเน€เธเนเธ• resetCriteriaFilter, btnChartFilterReset, btnResetFilters เนเธซเนเธเธทเธเธเนเธฒเน€เธเนเธ ALL 4) เธญเธฑเธเน€เธ”เธ• index.html เนเธซเน option ALL เธกเธต attribute selected เนเธฅเธฐเธเธฃเธฑเธ tooltip เธเธญเธเธเธธเนเธกเธขเธฒเธเธฅเธ 5) เธเธฑเธเธ—เธถเธเธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเธเธฃเธฑเธเธเธฃเธธเธเธฃเธฐเธเธเธฅเธเนเธ BASE_AUDIT_LOGS เธ•เธฒเธกเธเนเธญเธเธณเธซเธเธ”',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธเธ“เธงเธฑเธ” เนเธซเนเน€เธเธฅเธตเนเธขเธ default เน€เธเนเธ เน€เธฅเธทเธญเธเธ—เธฑเนเธเธซเธกเธ”)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_fix_wbs_count_2083_and_cache_bust',
      timestamp: '2026-10-23 10:20:00',
      timestampTh: '23 เธ•.เธ. 2569, 10:20 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธขเธญเธ” WBS 2,083 & เนเธเน Cache',
      badgeClass: 'badge-type-edit',
      title: 'เนเธเนเนเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเธขเธญเธ”เธเธฒเธ WBS เธเธเน€เธซเธฅเธทเธญเนเธซเนเธ•เธฃเธเธเธฑเธเนเธเธฅเน 03 (2,083 เธเธฒเธ) เนเธฅเธฐเธญเธฑเธเน€เธ”เธ• Version Cache Buster',
      targetSubject: 'เธเนเธฒเธขเน€เธกเธเธนเธเธณเธ—เธฒเธ (index.html), เธเธฒเธฃเนเธ”เธชเธ–เธดเธ•เธด (index.html), เนเธกเน€เธ”เธฅเธเธฑเธ”เน€เธเนเธเธเนเธญเธกเธนเธฅ (js/data_history.js) เนเธฅเธฐเนเธ—เนเธเน€เธงเธญเธฃเนเธเธฑเธเธชเธเธฃเธดเธเธ•เนเธฅเนเธฒเธเนเธเธเน€เธเธฃเธฒเธงเนเน€เธเธญเธฃเน',
      storageFile: 'index.html, js/data_history.js',
      changeSummary: 'เนเธเนเนเธเธขเธญเธ”เธฃเธงเธกเธเธฒเธ WBS เธ—เธตเนเธ•เธเธเนเธฒเธเน€เธเนเธ 2,968 เนเธซเนเนเธชเธ”เธ 2,083 เธเธฒเธเธ•เธฒเธกเนเธเธฅเน 03 WBS เธฅเนเธฒเธชเธธเธ”: 1) เธเธฃเธฑเธเธเธฃเธธเธ index.html เธ—เธตเนเนเธ—เนเธ wbsTabTotalBadge เธเธฒเธ 2,968 เน€เธเนเธ 2,083 2) เธเธฃเธฑเธเธเธฃเธธเธเธเธฒเธฃเนเธ”เธชเธฃเธธเธ wbsStatTotalJobsSub เน€เธเนเธ 2,083 3) เธญเธฑเธเน€เธ”เธ• Cache Buster Query String (?v=20261023_1020) เธเธเนเธเธฅเน data_wbs.js, wbs.js, data_history.js, app.js เน€เธเธทเนเธญเธเธฑเธเธเธฑเธเนเธซเนเน€เธเธฃเธฒเธงเนเน€เธเธญเธฃเนเนเธฅเธฐ GitHub Pages เธ”เธถเธเนเธเธฅเน 2,083 เธฃเธฒเธขเธเธฒเธฃเนเธซเธกเนเธ—เธฑเธเธ—เธต เนเธกเนเธ•เธดเธ”เนเธเธเน€เธ”เธดเธก 4) เธญเธฑเธเน€เธ”เธ•เธเนเธญเธกเธนเธฅเธเธฑเธ Model View เนเธ js/data_history.js เธเธฃเธเธ—เธธเธเธเธธเธ”',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธ "เธเธฒเธเธฃเธงเธกเธ—เธฑเนเธเธซเธกเธ” 2083 เธเธฒเธ เธ—เธณเนเธกเธ เธฒเธเธฃเธงเธกเธขเธฑเธเธเธถเนเธ 2968 / เธเธณเธเธงเธเธเธฒเธเธ—เธตเนเนเธชเธ”เธ wbs เธเธเน€เธซเธฅเธทเธญ เนเธซเนเธญเนเธฒเธเธญเธดเธเธเธฒเธเนเธเธฅ 03 WBS เธเธเน€เธซเธฅเธทเธญเน€เธกเนเธฒเธเธฑเนเธ / WBS เนเธ github เนเธกเนเธ•เธฃเธเธเธฑเธ index": 1) เธงเธดเน€เธเธฃเธฒเธฐเธซเนเธเธเธงเนเธฒเน€เธเธฃเธฒเธงเนเน€เธเธญเธฃเนเธเธญเธเธเธนเนเนเธเนเนเธฅเธฐ GitHub Pages เธขเธฑเธเธเธเธเธณเนเธเธฅเนเนเธเธ js/data_wbs.js?v=20261019_0848 เธเธฒเธเธงเธฑเธเธ—เธตเน 19 เธ•.เธ. เธเธถเนเธเธกเธตเธขเธญเธ”เน€เธ”เธดเธก 2,968 เธฃเธฒเธขเธเธฒเธฃ เนเธฅเธฐเนเธ index.html เธกเธตเธเนเธฒเน€เธฃเธดเนเธกเธ•เนเธเน€เธเนเธ 2,968 เธ—เธณเนเธซเนเน€เธกเธทเนเธญเน€เธเธดเธ”เน€เธงเนเธเธขเธฑเธเนเธชเธ”เธเธเธฅเธ•เธฑเธงเน€เธฅเธเน€เธ”เธดเธก 2) เธเธฃเธฑเธเธเนเธฒเน€เธฃเธดเนเธกเธ•เนเธเนเธ index.html เน€เธเนเธ 2,083 เธฃเธฒเธขเธเธฒเธฃ 3) เธญเธฑเธเน€เธ”เธ•เธเธฒเธฃเธฒเธกเธดเน€เธ•เธญเธฃเนเน€เธงเธญเธฃเนเธเธฑเธเธชเธเธฃเธดเธเธ•เนเน€เธเนเธ ?v=20261023_1020 เน€เธเธทเนเธญเธ•เธฑเธ”เธเธฑเธเธซเธฒ Browser Disk Cache 4) เธเธฃเธฑเธเธเธฑเธ Model View เนเธฅเธฐเธ•เธฑเธงเนเธเธฃเธชเธ–เธดเธ•เธดเนเธ js/data_history.js เน€เธเนเธ 2,083 เธฃเธฒเธขเธเธฒเธฃ (2.32 MB) 5) เธเธดเธเธเนเนเธเธฅเน index.html เนเธฅเธฐเนเธเธฅเนเธ—เธฑเนเธเธซเธกเธ”เนเธเธขเธฑเธ D:\\เธเธฃเธข+++\\C3-auc-dashboard',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธเธฒเธเธฃเธงเธกเธ—เธฑเนเธเธซเธกเธ” 2083 เธเธฒเธ เธ—เธณเนเธกเธ เธฒเธเธฃเธงเธกเธขเธฑเธเธเธถเนเธ 2968 / WBS เนเธ github เนเธกเนเธ•เธฃเธเธเธฑเธ index)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_update_wbs_03_04_05_1',
      timestamp: '2026-10-23 09:58:00',
      timestampTh: '23 เธ•.เธ. 2569, 09:58 เธ.',
      type: 'IMPORT',
      typeBadge: 'เธญเธฑเธเน€เธ”เธ•เนเธเธฅเน WBS 03/04/05-1',
      badgeClass: 'badge-type-import',
      title: 'เธญเธฑเธเน€เธ”เธ•เธเธฒเธเธเนเธญเธกเธนเธฅ WBS เธเธเน€เธซเธฅเธทเธญเธฅเนเธฒเธชเธธเธ”เธเธฒเธเนเธเธฅเน 03 WBS, 04 WBS เนเธฅเธฐ 05-1 WBS เธเธฃเนเธญเธกเธเธเธเนเธญเธกเธนเธฅเธซเธกเธฒเธขเน€เธซเธ•เธธเนเธฅเธฐเนเธเธเธเธดเธ”เธเธฒเธเน€เธ”เธดเธก',
      targetSubject: 'เธเธฒเธเธเนเธญเธกเธนเธฅเธเธฒเธเธเนเธญเธชเธฃเนเธฒเธ WBS เธเธเน€เธซเธฅเธทเธญ (js/data_wbs.js, js/wbs.js, js/data_history.js)',
      storageFile: 'js/data_wbs.js, js/wbs.js & js/data_history.js',
      changeSummary: 'เธญเธฑเธเน€เธ”เธ•เธเนเธญเธกเธนเธฅ WBS เน€เธ”เธทเธญเธเธฅเนเธฒเธชเธธเธ”: 1) เธเธณเน€เธเนเธฒ 03 WBSเธเธฒเธเธเธเน€เธซเธฅเธทเธญเน€เธ”เธทเธญเธเธฅเนเธฒเธชเธธเธ”.xlsx (2,083 เธฃเธฒเธขเธเธฒเธฃ) 2) เธเธชเธฒเธเธเนเธญเธกเธนเธฅเธเธฒเธ 04 WBS ZBUDR064 %เธเธฑเธชเธ”เธธเนเธฅเธฐเธเนเธฒเนเธฃเธเนเธฅเธฐเธชเธ–เธฒเธเธฐsap.xlsx (4,589 เธฃเธฒเธขเธเธฒเธฃ เนเธ SAP เนเธกเธ•เธเนเธ•เธฃเธ 100%) 3) เธเธชเธฒเธเธกเธนเธฅเธเนเธฒ AUC เธเธฒเธ 05-1 WBS CN41 เธกเธนเธฅเธเนเธฒ AUC เธงเธฑเธเน€เธฃเธดเนเธกเธเธฑเธเธเธต 14 เธ•เธ69 (1เน€เธ”เธทเธญเธเน€เธเธฅเธตเนเธขเธเธเธฃเธฑเนเธ).xlsx (เนเธกเธ•เธเนเธ•เธฃเธ 100%) 4) เธ”เธถเธเนเธฅเธฐเธฃเธฑเธเธฉเธฒเธเนเธญเธกเธนเธฅเธซเธกเธฒเธขเน€เธซเธ•เธธ (Note) 1,398 เธฃเธฒเธขเธเธฒเธฃ เนเธฅเธฐเนเธเธเธเธดเธ”เธเธฒเธ (PlanClose) 1,655 เธฃเธฒเธขเธเธฒเธฃ เธเธฒเธเธเธฒเธเธเนเธญเธกเธนเธฅเน€เธ”เธดเธกเนเธฅเธฐ Google Sheet เธเธฃเธเธ–เนเธงเธ 5) เธญเธฑเธเน€เธ”เธ•เนเธ–เธเธเนเธฒเธขเธเนเธญเธกเธนเธฅเธงเธฑเธเธ—เธตเนเนเธเธฅเนเธเธเธซเธฑเธงเธ•เธฒเธฃเธฒเธเธซเธเนเธฒ WBS',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธ "updateเนเธเธฅเน 03 WBS // 04 WBS // 05-1 WBS": 1) เธชเธณเธฃเธญเธเธเนเธญเธกเธนเธฅเน€เธ”เธดเธกเนเธงเนเธ—เธตเน js/data_wbs.bak.js 2) เธ”เธถเธเธเนเธญเธกเธนเธฅเนเธเธเธเธดเธ”เธเธฒเธเนเธฅเธฐเธซเธกเธฒเธขเน€เธซเธ•เธธเธ—เธตเนเธกเธตเธญเธขเธนเนเน€เธ”เธดเธกเนเธเธฃเธฐเธเธเน€เธเนเธเนเธงเน 3) เธเธณเน€เธเนเธฒเนเธ–เธงเธเนเธญเธกเธนเธฅ WBS 2,083 เธฃเธฒเธขเธเธฒเธฃเธเธฒเธเนเธเธฅเน 03 เธฅเนเธฒเธชเธธเธ” 4) เธเธชเธฒเธเธเนเธญเธกเธนเธฅเธเนเธฒเนเธเนเธเนเธฒเธข SAP, เธชเธ–เธฒเธเธฐ, % เน€เธเธดเธเธเธฑเธชเธ”เธธ เนเธฅเธฐ % เธเนเธฒเนเธเนเธเนเธฒเธข เธเธฒเธเนเธเธฅเน 04 (เนเธกเธ•เธเน 2,083/2,083 เธฃเธฒเธขเธเธฒเธฃ เธเธดเธ”เน€เธเนเธ 100%) 5) เธเธชเธฒเธเธกเธนเธฅเธเนเธฒเธ•เนเธเธ—เธธเธเธเธฃเธดเธ/AUC เธเธฒเธเนเธเธฅเน 05-1 CN41 (เนเธกเธ•เธเน 2,083/2,083 เธฃเธฒเธขเธเธฒเธฃ เธเธดเธ”เน€เธเนเธ 100%) 6) เธเธเธเนเธฒเธซเธกเธฒเธขเน€เธซเธ•เธธเนเธฅเธฐเนเธเธเธเธดเธ”เธเธฒเธเน€เธ”เธดเธกเน€เธเนเธฒเธชเธนเนเนเธเธฃเธเธชเธฃเนเธฒเธเธเนเธญเธกเธนเธฅเนเธซเธกเน 7) เธเธฑเธเธ—เธถเธเนเธฅเธฐเธ•เธฃเธงเธเธชเธญเธเธเธงเธฒเธกเธชเธกเธเธนเธฃเธ“เนเธเธญเธ js/data_wbs.js 8) เธญเธฑเธเน€เธ”เธ•เนเธ–เธเธเนเธฒเธขเธงเธฑเธเธ—เธตเนเนเธซเธฅเนเธเธเนเธญเธกเธนเธฅเธเธเนเธ—เนเธ WBS เนเธ js/wbs.js เน€เธเนเธเธงเธฑเธเธ—เธตเน 23 เธ•.เธ. 2569 เธเธฃเธเธ–เนเธงเธ',
      sourceFile: '03 WBSเธเธฒเธเธเธเน€เธซเธฅเธทเธญเน€เธ”เธทเธญเธเธฅเนเธฒเธชเธธเธ”.xlsx, 04 WBS ZBUDR064 %เธเธฑเธชเธ”เธธเนเธฅเธฐเธเนเธฒเนเธฃเธเนเธฅเธฐเธชเธ–เธฒเธเธฐsap.xlsx, 05-1 WBS CN41 เธกเธนเธฅเธเนเธฒ AUC เธงเธฑเธเน€เธฃเธดเนเธกเธเธฑเธเธเธต 14 เธ•เธ69 (1เน€เธ”เธทเธญเธเน€เธเธฅเธตเนเธขเธเธเธฃเธฑเนเธ).xlsx',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธชเธนเธ'
    },
    {
      id: 'log_000_fix_github_desktop_not_opening_after_update_btn',
      timestamp: '2026-10-23 09:38:00',
      timestampTh: '23 เธ•.เธ. 2569, 09:38 เธ.',
      type: 'EDIT',
      typeBadge: 'เนเธเน GitHub Desktop เนเธกเนเธเธถเนเธ',
      badgeClass: 'badge-type-edit',
      title: 'เนเธเนเนเธเธเธฑเธเธซเธฒเนเธเธฃเนเธเธฃเธก GitHub Desktop เนเธกเนเน€เธเธดเธ”เธเธถเนเธเธกเธฒเธซเธฅเธฑเธเธเธ”เธเธธเนเธก Update 00AI to GitHub Desktop',
      targetSubject: 'เธฃเธฐเธเธเธเธธเนเธก Update 00AI (js/app.js, index.html), เธ•เธฑเธงเน€เธฃเธตเธขเธเนเธเธฃเนเธเธฃเธก OS (scratch/sync_to_github.ps1), เน€เธเธดเธฃเนเธเน€เธงเธญเธฃเน API (scratch/serve.ps1) เนเธฅเธฐ Windows Startup / Protocol',
      storageFile: 'js/app.js, index.html, scratch/sync_to_github.ps1, scratch/serve.ps1 & js/data_history.js',
      changeSummary: 'เนเธเนเนเธเธชเธฒเน€เธซเธ•เธธเธซเธฅเธฑเธเธ—เธตเนเธ—เธณเนเธซเน GitHub Desktop เนเธกเนเน€เธเธดเธ”เธเธถเนเธเธกเธฒ: 1) เธเธดเธ” process เธเนเธฒเธเนเธเธซเธเนเธงเธขเธเธงเธฒเธกเธเธณเธ—เธตเนเธเธงเธฒเธเธเธฒเธฃเน€เธเธดเธ”เนเธเธฃเนเธเธฃเธกเนเธซเธกเน (Zombie Cleanup) 2) เธเธฃเธฑเธเธเธฃเธธเธเธชเธเธฃเธดเธเธ•เน sync_to_github.ps1 เนเธกเนเนเธซเนเธเธฅเนเธญเธเธซเธฃเธทเธญเธเนเธฒเธเธ—เธตเน ReadKey เนเธฅเธฐเน€เธเธดเธ”เธเนเธฒเธเธเธฒเธเธซเธฅเธฑเธเธเธญเธ GitHub Desktop 3) เธเธฃเธฑเธเธเธฃเธธเธ js/app.js เนเธซเนเธกเธต Timeout เธเนเธญเธเธเธฑเธเธเธฃเธ“เธตเน€เธเธดเธฃเนเธเน€เธงเธญเธฃเนเธญเธญเธเนเธฅเธเน เธเธฃเนเธญเธกเธชเนเธเธเธณเธชเธฑเนเธเน€เธฃเธตเธขเธ x-github-client protocol เนเธฅเธฐ update00ai protocol เธ•เธฃเธเธชเธนเน Windows Shell 4) เน€เธเธดเนเธกเธเธธเนเธกเน€เธเธดเธ” GitHub Desktop เธ—เธฑเธเธ—เธต เนเธฅเธฐเธเนเธญเนเธเธฐเธเธณเนเธเธซเธเนเธฒเธ•เนเธฒเธ Modal 5) เธ•เธดเธ”เธ•เธฑเนเธเธ•เธฑเธงเธฃเธฑเธเน€เธเธดเธฃเนเธเน€เธงเธญเธฃเนเนเธเนเธเธเธฃเธฒเธงเธเธ”เนเธญเธฑเธ•เนเธเธกเธฑเธ•เธดเนเธ Windows Startup',
      details: 'เนเธเนเนเธเธ•เธฒเธกเธเธณเนเธเนเธ "เธฃเธฑเธเนเธเธฃเนเธเธฃเธก github destop เนเธกเนเธเธถเนเธ เธซเธฅเธฑเธเธเธ”เธเธธเนเธก update 00AI": 1) เธ•เธฃเธงเธเธชเธญเธเธเธเธเธฃเธฐเธเธงเธเธเธฒเธฃ GitHubDesktop.exe เธ•เธเธเนเธฒเธเนเธเธซเธเนเธงเธขเธเธงเธฒเธกเธเธณเนเธ”เธขเนเธกเนเธกเธตเธซเธเนเธฒเธ•เนเธฒเธเนเธชเธ”เธเธเธฅ เธ—เธณเนเธซเนเน€เธกเธทเนเธญเธกเธตเธเธฒเธฃเธชเธฑเนเธเน€เธเธดเธ”เนเธเธฃเนเธเธฃเธก เธ•เธฑเธง Electron เธ•เธฃเธงเธเธเธ single-instance lock เนเธฅเธฐเธเธดเธ”เธ•เธฑเธงเน€เธญเธเธ—เธฑเธเธ—เธต เธเธถเธเธ—เธณเธเธฒเธฃเน€เธเธดเนเธกเธฃเธฐเธเธเธ•เธฃเธงเธเธเธฑเธเนเธฅเธฐเธเธดเธ”เธเธฃเธฐเธเธงเธเธเธฒเธฃเธเนเธฒเธเธญเธฑเธ•เนเธเธกเธฑเธ•เธดเธเนเธญเธเน€เธเธดเธ”เนเธซเธกเน 2) เนเธเนเนเธเธชเธเธฃเธดเธเธ•เน scratch/sync_to_github.ps1 เนเธซเนเธเธฑเธเธ–เธญเธขเธซเธฅเธฑเธเธเธดเธ”เธ•เธฑเธงเน€เธญเธเธญเธฑเธ•เนเธเธกเธฑเธ•เธด เนเธกเนเธเนเธฒเธเธเธณเธชเธฑเนเธเธฃเธญเธเธธเนเธกเธเธ” 3) เธเธฃเธฑเธเธเธฃเธธเธ js/app.js เนเธ triggerUpdateToGithubDesktop เนเธซเนเธกเธต AbortController timeout 3.5 เธงเธดเธเธฒเธ—เธต เธเธฃเนเธญเธกเน€เธฃเธตเธขเธเน€เธเธดเธ”เธเนเธฒเธ iframe protocol update00ai://sync เนเธฅเธฐ x-github-client://openRepo/ เน€เธเธทเนเธญเนเธซเนเธฃเธฐเธเธ Windows เธเธณเธซเธเนเธฒเธ•เนเธฒเธ GitHub Desktop เธเธถเนเธเธกเธฒเธเธเธซเธเนเธฒเธเธญเธเธฃเธดเธเธเธญเธเธเธนเนเนเธเนเน€เธชเธกเธญ 4) เธเธฃเธฑเธเธเธฃเธธเธ updateGithubModal เนเธ index.html เน€เธเธดเนเธกเธเธธเนเธกเธฅเธฑเธ” "เน€เธเธดเธ” GitHub Desktop เธ—เธฑเธเธ—เธต" เนเธฅเธฐเธเธฅเนเธญเธเธเนเธญเธเธงเธฒเธกเนเธเธฐเธเธณ 5) เธเธดเธเธเนเนเธเธฅเนเธฅเนเธฒเธชเธธเธ”เธ—เธฑเนเธเธซเธกเธ”เนเธเธขเธฑเธ D:\\เธเธฃเธข+++\\C3-auc-dashboard เธเธฃเธเธ–เนเธงเธ 100%',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธฃเธฑเธเนเธเธฃเนเธเธฃเธก github destop เนเธกเนเธเธถเนเธ เธซเธฅเธฑเธเธเธ”เธเธธเนเธก update 00AI)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_fix_github_desktop_shortcut_and_beacon_fallback',
      timestamp: '2026-10-23 09:17:00',
      timestampTh: '23 เธ•.เธ. 2569, 09:17 เธ.',
      type: 'EDIT',
      typeBadge: 'เน€เธเธดเธ”เนเธเธฃเนเธเธฃเธกเธเนเธฒเธ Shortcut',
      badgeClass: 'badge-type-edit',
      title: 'เนเธเนเนเธเธเธฒเธฃเน€เธเธดเธ” GitHub Desktop เนเธซเนเน€เธเธดเธ”เธเนเธฒเธ Windows Start Menu Shortcut เธเธฃเนเธญเธกเธฃเธฐเธเธ Image Beacon Fallback',
      targetSubject: 'เธฃเธฐเธเธเน€เธเธดเธ” GitHub Desktop (scratch/serve.ps1, scratch/sync_to_github.ps1, js/app.js)',
      storageFile: 'scratch/serve.ps1, scratch/sync_to_github.ps1, js/app.js & js/data_history.js',
      changeSummary: 'เนเธเนเนเธเธเธฑเธเธซเธฒเนเธเธฃเนเธเธฃเธกเนเธกเนเน€เธ”เนเธเธเธถเนเธเธกเธฒ: 1) เน€เธเธฅเธตเนเธขเธเธเธฒเธเธเธฒเธฃเนเธเน protocol launcher เธกเธฒเน€เธเนเธเธเธฒเธฃเน€เธเธดเธ”เธเนเธฒเธ Start Menu Shortcut (.lnk) เนเธ”เธขเธ•เธฃเธ เธเธถเนเธเธฃเธฑเธเธเธฃเธฐเธเธฑเธเธงเนเธฒเธเธฐเน€เธเธดเธ”เธซเธเนเธฒเธ•เนเธฒเธเนเธเธฃเนเธเธฃเธกเธเธฃเธดเธเธเธถเนเธเธกเธฒเธเธเธเธญเน€เธชเธกเธญ 2) เน€เธเธดเนเธก Access-Control-Allow-Private-Network เนเธฅเธฐเธฃเธฐเธเธเธชเธณเธฃเธญเธ Image Beacon เนเธ js/app.js เน€เธเธทเนเธญเนเธซเนเธชเธฒเธกเธฒเธฃเธ–เธชเธฑเนเธเธเธฒเธเธเธฒเธเน€เธเธฃเธฒเธงเนเน€เธเธญเธฃเนเนเธ”เนเนเธกเนเน€เธเธดเธ”เนเธเธฅเนเธเนเธฒเธ file:///',
      details: 'เนเธเนเนเธเธ•เธฒเธกเธเธณเนเธเนเธ "เนเธกเนเธเธถเนเธ": 1) เธงเธดเน€เธเธฃเธฒเธฐเธซเนเธเธเธงเนเธฒเธเธฒเธฃเน€เธฃเธตเธขเธเธเนเธฒเธ x-github-client:// เธกเธตเธเธฒเธฃเธฒเธกเธดเน€เธ•เธญเธฃเน --protocol-launcher เธเธถเนเธเธ•เธฑเธง Electron เธเธฐเธ—เธณเธเธฒเธเนเธเนเธซเธกเธ” Background Listener เน€เธ—เนเธฒเธเธฑเนเธ เธซเธฒเธเนเธกเนเธกเธตเธซเธเนเธฒเธ•เนเธฒเธเน€เธ”เธดเธกเน€เธเธดเธ”เธญเธขเธนเนเธเธฐเธ—เธณเนเธซเนเนเธกเนเธกเธตเธซเธเนเธฒเธ•เนเธฒเธ GUI เธเธฃเธฒเธเธเธเธถเนเธเธกเธฒ 2) เนเธเนเนเธเนเธซเนเน€เธเธดเธ”เธเนเธฒเธ Start Menu Shortcut C:\\Users\\495353\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\GitHub, Inc\\GitHub Desktop.lnk เธเนเธฒเธ explorer.exe เธเธถเนเธเธ—เธณเนเธซเน Windows Shell เน€เธเธดเธ”เธซเธเนเธฒเธ•เนเธฒเธ GUI เธเธฃเธดเธเธเธถเนเธเธกเธฒเน€เธชเธกเธญ 3) เน€เธเธดเนเธก Header Access-Control-Allow-Private-Network: true เนเธ scratch/serve.ps1 เนเธฅเธฐเธฃเธฐเธเธ Image Beacon fallback เนเธ js/app.js 4) เธเธดเธเธเนเนเธเธฅเนเธฅเนเธฒเธชเธธเธ”เนเธเธขเธฑเธ C3-auc-dashboard เธเธฃเธเธ–เนเธงเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธกเนเธเธถเนเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_fix_github_desktop_launch_and_zombie_cleanup',
      timestamp: '2026-10-23 09:08:00',
      timestampTh: '23 เธ•.เธ. 2569, 09:08 เธ.',
      type: 'EDIT',
      typeBadge: 'เนเธเนเนเธเธเธฒเธฃเน€เธเธดเธ” GitHub Desktop',
      badgeClass: 'badge-type-edit',
      title: 'เนเธเนเนเธเธเธฑเธเธซเธฒเนเธเธฃเนเธเธฃเธก GitHub Desktop เนเธกเนเธขเธญเธกเน€เธเธดเธ”เธเธถเนเธเธกเธฒ เธ”เนเธงเธขเธฃเธฐเธเธ Explorer Protocol Launcher เนเธฅเธฐ Zombie Process Cleanup',
      targetSubject: 'เธฃเธฐเธเธเน€เธเธดเธ” GitHub Desktop เธญเธฑเธ•เนเธเธกเธฑเธ•เธด (scratch/serve.ps1, scratch/sync_to_github.ps1, js/app.js)',
      storageFile: 'scratch/serve.ps1, scratch/sync_to_github.ps1, js/app.js & js/data_history.js',
      changeSummary: 'เนเธเนเนเธเธชเธฒเน€เธซเธ•เธธเธ—เธตเนเธ—เธณเนเธซเน GitHub Desktop เนเธกเนเน€เธเธดเธ”เธเธถเนเธเธกเธฒเธซเธฅเธฑเธเธเธ”เธเธธเนเธก: 1) เน€เธเธฅเธตเธขเธฃเน Zombie Electron Process เธ—เธตเนเธ•เธเธเนเธฒเธเนเธเธฃเธฐเธเธเนเธ”เธขเนเธกเนเธกเธตเธซเธเนเธฒเธ•เนเธฒเธเธเนเธญเธเน€เธเธดเธ”เนเธซเธกเน 2) เธชเธฑเนเธเน€เธเธดเธ”เธเนเธฒเธ explorer.exe เธ”เนเธงเธข URI scheme (x-github-client://openRepo/...) เน€เธเธทเนเธญเนเธซเนเธ—เธณเธเธฒเธเนเธ Interactive Desktop Session เธเธญเธเธเธนเนเนเธเนเนเธ”เธขเธ•เธฃเธ 3) เธเธฃเธฑเธเธเธฃเธธเธเนเธซเนเธ”เธถเธเธซเธเนเธฒเธ•เนเธฒเธเนเธเธฃเนเธเธฃเธกเนเธฅเธฐเธชเธฅเธฑเธเนเธเธขเธฑเธ repository C3-auc-dashboard เธญเธฑเธ•เนเธเธกเธฑเธ•เธด',
      details: 'เนเธเนเนเธเธ•เธฒเธกเธเธณเนเธเนเธ "เธเธดเธ”เนเธเธฃเนเธเธฃเธก GitHub Desktop เนเธกเนเธเธถเนเธ / เน€เธเธดเธ” / เนเธกเนเนเธ”เน": 1) เธงเธดเน€เธเธฃเธฒเธฐเธซเนเธเธเธงเนเธฒเน€เธงเธฅเธฒเธเธนเนเนเธเนเธเธดเธ” GitHub Desktop เธเนเธฒเธเธเธธเนเธก X เธ•เธฑเธงเนเธเธฃเนเธเธฃเธก Electron เธกเธฑเธเธ—เธดเนเธ process เธ•เธเธเนเธฒเธเนเธเธซเธเนเธงเธขเธเธงเธฒเธกเธเธณเนเธ”เธขเนเธกเนเธกเธต MainWindowHandle (zombie) เน€เธกเธทเนเธญเธกเธตเธเธฒเธฃเธชเธฑเนเธเน€เธเธดเธ”เนเธซเธกเน เธ•เธฑเธงเนเธเธฃเนเธเธฃเธกเธเธฐเธชเนเธ signal เน€เธเนเธฒ process เน€เธ”เธดเธกเธ—เธตเนเนเธกเนเธกเธตเธซเธเนเธฒเธ•เนเธฒเธ เธ—เธณเนเธซเนเนเธกเนเธกเธตเธญเธฐเนเธฃเนเธชเธ”เธเธเธฅเธเธเธซเธเนเธฒเธเธญ 2) เนเธเนเนเธ scratch/serve.ps1 เนเธฅเธฐ scratch/sync_to_github.ps1 เนเธซเนเธ•เธฃเธงเธเธชเธญเธเนเธฅเธฐเน€เธเธฅเธตเธขเธฃเน zombie process เธ”เธฑเธเธเธฅเนเธฒเธงเธเนเธญเธ 3) เนเธเนเนเธเธเธฒเธฃเน€เธเธดเธ”เนเธเธฃเนเธเธฃเธกเนเธซเนเนเธเน Start-Process explorer.exe x-github-client://openRepo/https://github.com/suphasekC3-OPS/C3-auc-dashboard เน€เธเธทเนเธญเนเธซเน Windows Shell เน€เธเธดเธ”เนเธเธฃเนเธเธฃเธกเธเธถเนเธเธกเธฒเธเธเธซเธเนเธฒเธเธญเน€เธ”เธชเธเนเธ—เนเธญเธเธเธญเธเธเธนเนเนเธเนเนเธ”เธขเธ•เธฃเธเนเธฅเธฐเนเธเธขเธฑเธเธซเธเนเธฒเนเธ—เนเธ Changes เธ—เธฑเธเธ—เธต 4) เธญเธฑเธเน€เธ”เธ•เนเธฅเธฐเธฃเธตเธชเธ•เธฒเธฃเนเธ•เน€เธเธดเธฃเนเธเน€เธงเธญเธฃเนเธเนเธงเธขเน€เธซเธฅเธทเธญเธเธฒเธฃเธเธดเธเธเน localhost:8089 5) เธเธดเธเธเนเนเธเธฅเนเธฅเนเธฒเธชเธธเธ”เนเธเธขเธฑเธ C3-auc-dashboard เน€เธฃเธตเธขเธเธฃเนเธญเธข',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธเธดเธ”เนเธเธฃเนเธเธฃเธก GitHub Desktop เนเธกเนเธเธถเนเธ / เน€เธเธดเธ” / เนเธกเนเนเธ”เน)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_open_github_desktop_delay_2s',
      timestamp: '2026-10-23 08:35:00',
      timestampTh: '23 เธ•.เธ. 2569, 08:35 เธ.',
      type: 'CONFIG',
      typeBadge: 'เน€เธเธดเธ” GitHub Desktop เธซเธฅเธฑเธ 2 เธงเธดเธเธฒเธ—เธต',
      badgeClass: 'badge-type-config',
      title: 'เน€เธเธดเนเธกเธฃเธฐเธเธเธซเธเนเธงเธเน€เธงเธฅเธฒ 2 เธงเธดเธเธฒเธ—เธต เธเนเธญเธเน€เธเธดเธ”เนเธเธฃเนเธเธฃเธก GitHub Desktop เธซเธฅเธฑเธเธเธ”เธเธธเนเธก Update 00AI to GitHub Desktop',
      targetSubject: 'เธเธฒเธฃเธ—เธณเธเธฒเธเธเธญเธเธเธธเนเธก Update 00AI to GitHub Desktop (js/app.js), เน€เธเธดเธฃเนเธเน€เธงเธญเธฃเน API (scratch/serve.ps1) เนเธฅเธฐเธชเธเธฃเธดเธเธ•เนเธเธดเธเธเน (scratch/sync_to_github.ps1)',
      storageFile: 'js/app.js, scratch/serve.ps1, scratch/sync_to_github.ps1 & js/data_history.js',
      changeSummary: 'เธเธฃเธฑเธเธเธฃเธธเธเธเธฃเธฐเธเธงเธเธเธฒเธฃเธซเธฅเธฑเธเธเธ”เธเธธเนเธก "Update 00AI to GitHub Desktop": เนเธซเนเธ—เธณเธเธฒเธฃเธเธฑเธ”เธฅเธญเธเนเธเธฅเนเธ—เธฑเนเธเธซเธกเธ”เนเธซเนเน€เธชเธฃเนเธเธชเธดเนเธเธเนเธญเธ เธเธฒเธเธเธฑเนเธเธซเธเนเธงเธเน€เธงเธฅเธฒ 2 เธงเธดเธเธฒเธ—เธต เนเธฅเนเธงเธเธถเธเน€เธเธดเธ”เธซเธฃเธทเธญเธ”เธถเธเนเธเธฃเนเธเธฃเธก GitHub Desktop เธเธถเนเธเธกเธฒเธเธเธซเธเนเธฒเธเธญเธญเธฑเธ•เนเธเธกเธฑเธ•เธด เน€เธเธทเนเธญเนเธซเนเธฃเธฐเธเธ Git เธ•เธฃเธงเธเธเธฑเธเนเธเธฅเนเธ—เธตเนเน€เธเธฅเธตเนเธขเธเนเธเธฅเธเนเธ”เนเธญเธขเนเธฒเธเธชเธกเธเธนเธฃเธ“เน 100%',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธเธญเธเธนเนเนเธเนเธเธฒเธ: 1) เธเธฃเธฑเธเธเธฃเธธเธ scratch/serve.ps1 เนเธ endpoint /api/sync-github เนเธซเนเนเธชเน Start-Sleep -Seconds 2 เธซเธฅเธฑเธเธเธฒเธเธเธฑเธ”เธฅเธญเธเนเธเธฅเนเน€เธชเธฃเนเธ เธเนเธญเธเน€เธฃเธตเธขเธ Start-Process เน€เธเธดเธ” GitHubDesktop.exe 2) เธเธฃเธฑเธเธเธฃเธธเธ scratch/sync_to_github.ps1 เนเธซเนเธกเธตเธซเธเนเธงเธเน€เธงเธฅเธฒ 2 เธงเธดเธเธฒเธ—เธตเธเนเธญเธเน€เธเธดเธ” GitHub Desktop เน€เธเนเธเน€เธ”เธตเธขเธงเธเธฑเธ 3) เธเธฃเธฑเธเธเธฃเธธเธ js/app.js เนเธชเธ”เธเธเนเธญเธเธงเธฒเธกเนเธเนเธเธชเธ–เธฒเธเธฐเนเธฅเธฐเธ”เธถเธเธซเธเนเธฒเธ•เนเธฒเธเนเธเธฃเนเธเธฃเธกเธเนเธฒเธ x-github-client protocol 4) เธเธดเธเธเนเนเธเธฅเนเธฅเนเธฒเธชเธธเธ”เนเธเธขเธฑเธ D:\\เธเธฃเธข+++\\C3-auc-dashboard เน€เธฃเธตเธขเธเธฃเนเธญเธข',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธ–เนเธฒ เธเธ”เธเธธเนเธก update 00AI .... เนเธฅเนเธง เนเธซเนเน€เธเธดเธ”เนเธเธฃเนเธเธฃเธก github destop เธเธถเนเธเธกเธฒเธซเธฅเธฑเธเธเธฒเธเธเธฑเนเธ 2 เธงเธดเธเธฒเธ—เธต เนเธ”เนเนเธซเธก)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ'
    },
    {
      id: 'log_000_note_left_align_sheet_and_dashboard',
      timestamp: '2026-10-23 08:28:00',
      timestampTh: '23 เธ•.เธ. 2569, 08:28 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฑเธ”เธเธดเธ”เธเนเธฒเธขเธเธญเธฅเธฑเธกเธเนเธซเธกเธฒเธขเน€เธซเธ•เธธ',
      badgeClass: 'badge-type-edit',
      title: 'เนเธเนเนเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเธเธญเธฅเธฑเธกเธเน "เธซเธกเธฒเธขเน€เธซเธ•เธธ" เนเธซเนเนเธชเธ”เธเธเธดเธ”เธเนเธฒเธข (Left Align) เธ—เธฑเนเธเนเธ Google Sheet เนเธฅเธฐเธเธเธซเธเนเธฒเน€เธงเนเธ Dashboard',
      targetSubject: 'เธเธฒเธฃเธเธฑเธเธ—เธถเธเธเนเธฒเธฅเธ Google Sheet (scratch/Code.gs), เธเธฒเธฃเน€เธฃเธเน€เธ”เธญเธฃเนเธ•เธฒเธฃเธฒเธ WBS (js/wbs.js) เนเธฅเธฐ CSS เน€เธเธฅเธฅเนเธซเธกเธฒเธขเน€เธซเธ•เธธ (css/styles.css)',
      storageFile: 'scratch/Code.gs, js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: 'เธเธฃเธฑเธเธเธฃเธธเธเธเธฒเธฃเธเธฑเธ”เธ•เธณเนเธซเธเนเธเธเนเธญเธเธงเธฒเธกเนเธเธเธญเธฅเธฑเธกเธเน "เธซเธกเธฒเธขเน€เธซเธ•เธธ" (Note) เนเธซเนเธเธดเธ”เธเนเธฒเธข (Left Align) 100%: 1) เนเธ Google Apps Script เน€เธเธดเนเธกเธเธณเธชเธฑเนเธ setHorizontalAlignment("left") เนเธฅเธฐ setNumberFormat("@") เน€เธเธทเนเธญเธเนเธญเธเธเธฑเธเธเธฃเธ“เธตเธ—เธตเนเธเธนเนเนเธเนเธเธฃเธญเธเธเนเธญเธเธงเธฒเธกเธ—เธตเนเน€เธเนเธเธ•เธฑเธงเน€เธฅเธ (เน€เธเนเธ 111) เนเธฅเนเธง Google Sheet เนเธเธฅเธเน€เธเนเธเธ•เธฑเธงเน€เธฅเธเนเธฅเธฐเนเธชเธ”เธเธเธดเธ”เธเธงเธฒ 2) เนเธ js/wbs.js เนเธฅเธฐ css/styles.css เน€เธเธดเนเธก text-align: left !important เธเธเน€เธเธฅเธฅเนเนเธฅเธฐเธเนเธญเธเธงเธฒเธกเธซเธกเธฒเธขเน€เธซเธ•เธธเนเธเธ•เธฒเธฃเธฒเธเธซเธเนเธฒเน€เธงเนเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธ เธฒเธเธ–เนเธฒเธขเนเธฅเธฐเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: 1) เธงเธดเน€เธเธฃเธฒเธฐเธซเนเธเธเธงเนเธฒเน€เธกเธทเนเธญเธเธนเนเนเธเนเนเธเนเนเธเธซเธกเธฒเธขเน€เธซเธ•เธธเธเนเธฒเธเธซเธเนเธฒเน€เธงเนเธ Dashboard เนเธ”เธขเธเธดเธกเธเนเธ•เธฑเธงเน€เธฅเธ เน€เธเนเธ 111 เน€เธกเธทเนเธญเธเธฑเธเธ—เธถเธเน€เธเนเธฒ Google Sheet เธฃเธฐเธเธเน€เธ”เธดเธกเนเธกเนเนเธ”เนเธฃเธฐเธเธธเธฃเธนเธเนเธเธ Plain Text เธ—เธณเนเธซเนเธเธตเธ•เธ•เธตเธเธงเธฒเธกเน€เธเนเธ Number เธชเนเธเธเธฅเนเธซเนเน€เธฅเธเธเธดเธ”เธเธงเธฒเธเธญเธเน€เธเธฅเธฅเน 2) เธเธฃเธฑเธเธเธฃเธธเธ scratch/Code.gs เนเธ updateWbsRecord เนเธซเนเนเธเน .setNumberFormat("@") เนเธฅเธฐ .setHorizontalAlignment("left") เธเธฑเธเธ—เธฑเนเธเธเธญเธฅเธฑเธกเธเนเธซเธกเธฒเธขเน€เธซเธ•เธธ, เนเธเธเธเธดเธ”เธเธฒเธ เนเธฅเธฐ WBS 3) เธเธฃเธฑเธเธเธฃเธธเธ js/wbs.js เนเธเน€เธฃเธเน€เธ”เธญเธฃเนเธ•เธฒเธฃเธฒเธ WBS เนเธซเนเน€เธเธฅเธฅเนเธซเธกเธฒเธขเน€เธซเธ•เธธเธกเธตเธชเนเธ•เธฅเน text-align: left !important 4) เธเธฃเธฑเธเธเธฃเธธเธ css/styles.css เนเธเธเธฅเธฒเธช .wbs-note-cell เนเธซเนเธกเธต text-align: left !important 5) เธเธดเธเธเนเนเธเธฅเนเธฅเนเธฒเธชเธธเธ”เนเธเธขเธฑเธ D:\\เธเธฃเธข+++\\C3-auc-dashboard เธเธฃเธเธ–เนเธงเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธเนเนเธเนเธ เธซเธกเธฒเธขเน€เธซเธ•เธธ เนเธ dasboard เนเธฅเนเธงเนเธซเนเนเธชเธ”เธเธเธดเธ”เธ—เธฒเธเธเนเธฒเธขเนเธเธเธญเธฅเนเธก เธเธฃเนเธญเธกเธฃเธนเธเธเธฃเธฐเธเธญเธเธ•เธฑเธงเน€เธฅเธ 111 เธ—เธตเนเธเธดเธ”เธเธงเธฒเนเธ Google Sheet)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_rename_btn_update_00ai_to_github_desktop',
      timestamp: '2026-10-23 08:12:00',
      timestampTh: '23 เธ•.เธ. 2569, 08:12 เธ.',
      type: 'CONFIG',
      typeBadge: 'เธเธฃเธฑเธเธเธฃเธธเธเธเธธเนเธก Update 00AI to GitHub Desktop',
      badgeClass: 'badge-type-config',
      title: 'เธเธฃเธฑเธเธเธฃเธธเธเธเธทเนเธญเธเธธเนเธกเน€เธเนเธ "Update 00AI to GitHub Desktop" เนเธฅเธฐเธขเธเน€เธฅเธดเธเธเธธเนเธกเธฅเธฑเธ”เธเธเธซเธเนเธฒเธเธญ Desktop เธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ',
      targetSubject: 'เธเธธเนเธกเธเธเนเธ–เธ Header (index.html), เธเธฅเนเธญเธเธเนเธญเธเธงเธฒเธก Modal, เธชเธเธฃเธดเธเธ•เนเธเธงเธเธเธธเธก (js/app.js) เนเธฅเธฐเธเธฒเธฃเธฅเธเธเธธเนเธกเธฅเธฑเธ”เธซเธเนเธฒเธเธญ Desktop',
      storageFile: 'index.html, js/app.js & js/data_history.js',
      changeSummary: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธเธญ 2 เธเนเธญ: 1) เธขเธเน€เธฅเธดเธเนเธฅเธฐเธฅเธเธเธธเนเธกเธฅเธฑเธ”เธเธเธซเธเนเธฒเธเธญ Desktop เธญเธญเธเธ—เธฑเนเธเธซเธกเธ” เธเธเน€เธซเธฅเธทเธญเน€เธเธเธฒเธฐเธเธธเนเธกเธเธเธซเธเนเธฒเน€เธงเนเธ Dashboard เน€เธเธตเธขเธเธญเธขเนเธฒเธเน€เธ”เธตเธขเธง 2) เน€เธเธฅเธตเนเธขเธเธเธทเนเธญเธเธธเนเธกเนเธฅเธฐเธเนเธญเธเธงเธฒเธกเนเธชเธ”เธเธเธฅเธ—เธฑเนเธเธซเธกเธ”เน€เธเนเธ "Update 00AI to GitHub Desktop" เน€เธเธทเนเธญเธเธงเธฒเธกเธเธฑเธ”เน€เธเธเนเธเธเธฒเธฃเธ—เธณเธเธฒเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: 1) เธฅเธเนเธเธฅเน Shortcut "update to GitHub Desktop.lnk" เธญเธญเธเธเธฒเธเธซเธเนเธฒเธเธญ Desktop เน€เธฃเธตเธขเธเธฃเนเธญเธข 2) เนเธเนเนเธเธเนเธญเธเธงเธฒเธกเธเธธเนเธกเนเธ Header เธเธญเธ index.html เน€เธเนเธ "Update 00AI to GitHub Desktop" 3) เธเธฃเธฑเธเธเธฃเธธเธเธซเธฑเธงเธเนเธญเนเธฅเธฐเน€เธเธทเนเธญเธซเธฒเนเธ updateGithubModal เนเธซเนเธ•เธฃเธเธเธฑเธ 4) เธเธฃเธฑเธเธเธฃเธธเธเธเนเธญเธเธงเธฒเธก fallback เนเธ js/app.js 5) เธเธฑเธ”เธฅเธญเธเนเธฅเธฐเธเธดเธเธเนเนเธเธฅเนเธฅเนเธฒเธชเธธเธ”เธ—เธฑเนเธเธซเธกเธ”เนเธเธขเธฑเธ D:\\เธเธฃเธข+++\\C3-auc-dashboard เธเธฃเธเธ–เนเธงเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (1.เธขเธเน€เธฅเธดเธ เธเธธเนเธกเธฅเธฑเธ” 1 เธเธฅเธดเธเธเธเธซเธเนเธฒเธเธญ Desktop เธเธเธกเธตเนเธเนเธเธธเนเธก เธเธธเนเธกเธเธเธซเธเนเธฒเน€เธงเนเธ Dashboard เธญเธขเนเธฒเธเน€เธ”เธตเธขเธง 2.เนเธฅเธฐเนเธเนเธเธทเนเธญเธเธธเนเธก เน€เธเนเธ Update 00AI to GitHub Desktop)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ'
    },
    {
      id: 'log_000_btn_update_to_github_desktop',
      timestamp: '2026-10-23 08:00:00',
      timestampTh: '23 เธ•.เธ. 2569, 08:00 เธ.',
      type: 'CONFIG',
      typeBadge: 'เธเธธเนเธก update to GitHub Desktop',
      badgeClass: 'badge-type-config',
      title: 'เน€เธเธดเนเธกเธเธธเนเธกเนเธฅเธฐเธฃเธฐเธเธเธเธฑเธ”เธฅเธญเธเนเธเธฅเนเธญเธฑเธ•เนเธเธกเธฑเธ•เธด "update to GitHub Desktop" เธเธฒเธ 00AI เนเธเธขเธฑเธ C3-auc-dashboard',
      targetSubject: 'เนเธ–เธเน€เธกเธเธน Header (index.html), เนเธกเธ”เธนเธฅเธเธงเธเธเธธเธก (js/app.js), เธชเธเธฃเธดเธเธ•เน 1 เธเธฅเธดเธ (Update_to_GitHub_Desktop.bat) เนเธฅเธฐเธ—เธฒเธเธฅเธฑเธ”เธซเธเนเธฒเธเธญ Desktop',
      storageFile: 'index.html, js/app.js, Update_to_GitHub_Desktop.bat, scratch/serve.ps1 & js/data_history.js',
      changeSummary: 'เธชเธฃเนเธฒเธเธเธธเนเธกเนเธฅเธฐเธฃเธฐเธเธเธ—เธฒเธเธฅเธฑเธ” 1 เธเธฅเธดเธ "update to GitHub Desktop" เธเนเธงเธขเธเธฑเธ”เธฅเธญเธเนเธเธฅเนเธซเธเนเธฒเน€เธงเนเธเธ—เธตเนเธญเธฑเธเน€เธ”เธ•เธฅเนเธฒเธชเธธเธ”เธ—เธฑเนเธเธซเธกเธ” (index.html, js, css, assets) เธเธฒเธเนเธเธฅเน€เธ”เธญเธฃเนเธ—เธณเธเธฒเธ 00AI เนเธเธขเธฑเธเนเธเธฅเน€เธ”เธญเธฃเน C3-auc-dashboard เธ—เธฑเธเธ—เธต เธเธฃเนเธญเธกเนเธเธเธฑเธชเธซเธเนเธฒเธ•เนเธฒเธ GitHub Desktop เน€เธเธทเนเธญเนเธซเนเธฃเธฒเธขเธเธฒเธฃ Changes เน€เธ”เนเธเธเธถเนเธเธกเธฒเธเธฃเนเธญเธกเธเธ” Commit & Push เนเธ”เนเธ—เธฑเธเธ—เธต',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธเธญเธเธนเนเนเธเนเธเธฒเธ: 1) เธชเธฃเนเธฒเธเนเธเธฅเนเนเธเธ•เธเน Update_to_GitHub_Desktop.bat เนเธเนเธเธฅเน€เธ”เธญเธฃเน 00AI เธชเธณเธซเธฃเธฑเธเธเธฑเธ”เธฅเธญเธเนเธเธฅเนเนเธฅเธฐเน€เธเธดเธ” GitHub Desktop 2) เธชเธฃเนเธฒเธ Desktop Shortcut "update to GitHub Desktop" เนเธงเนเธ—เธตเนเธซเธเนเธฒเธเธญ Desktop เธเธญเธเธเธนเนเนเธเน 3) เน€เธเธดเนเธกเธเธธเนเธก "update to GitHub Desktop" เนเธ Header เธเธญเธ index.html เธเธฃเนเธญเธกเนเธญเธเธญเธ GitHub 4) เน€เธเธดเนเธกเธเธฑเธเธเนเธเธฑเธ window.triggerUpdateToGithubDesktop() เนเธ js/app.js เนเธฅเธฐ endpoint /api/sync-github เนเธ scratch/serve.ps1 เธฃเธญเธเธฃเธฑเธเธเธฒเธฃเธเธฅเธดเธเธเธฒเธเน€เธเธฃเธฒเธงเนเน€เธเธญเธฃเน 5) เธเธดเธเธเนเนเธเธฅเนเธฅเนเธฒเธชเธธเธ”เธ—เธฑเนเธเธซเธกเธ”เนเธเธขเธฑเธ D:\\เธเธฃเธข+++\\C3-auc-dashboard เน€เธฃเธตเธขเธเธฃเนเธญเธข',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (1.เน€เธเธดเนเธกเธเธธเนเธกเธเธฑเธ”เธฅเธญเธเนเธเธฅเน เธฅเนเธฒเธชเธธเธ”เธเธฒเธ 00AI เนเธเธขเธฑเธ C3-auc-dashboard 2.เธซเธฅเธฑเธเธเธฒเธเธเธ”เนเธฅเนเธงเนเธซเนเนเธชเธ”เธเนเธ change GitHub Desktop เธ—เธฑเธเธ—เธต เธ—เธณเนเธ”เนเนเธซเธก 3.เธ–เนเธฒเนเธ”เน เธเธทเนเธญเธเธธเนเธก update to GitHub Desktop)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_wbs_dual_matching_job_description_gas',
      timestamp: '2026-10-23 01:45:00',
      timestampTh: '23 เธ•.เธ. 2569, 01:45 เธ.',
      type: 'FIX',
      typeBadge: 'เนเธเนเนเธเธเธฒเธฃเธเนเธเธซเธฒเธเธทเนเธญเธเธฒเธ Google Sheet',
      badgeClass: 'badge-type-edit',
      title: 'เนเธเนเนเธเธฃเธฐเธเธเน€เธเธทเนเธญเธกเนเธขเธ Google Sheet: เธ•เธฃเธงเธเธเธฑเธเธเธทเนเธญเธเธฒเธ (Job Description) เธญเธฑเธเธเธฃเธดเธขเธฐ เธเนเธญเธเธเธฑเธเธเธฒเธฃเนเธเนเธเน€เธ•เธทเธญเธเนเธกเนเธเธเธเนเธญเธกเธนเธฅเธเธดเธ”เธเธฅเธฒเธ”',
      targetSubject: 'เธฃเธฐเธเธเธเธดเธเธเน Google Sheet (js/wbs.js), เนเธเนเธ” Apps Script เธซเธฅเธฑเธเธเนเธฒเธ (scratch/Code.gs) เนเธฅเธฐเธเธฒเธฃเนเธชเธ”เธเธเธฅเธชเธ–เธฒเธเธฐเน€เธเธฅเธฅเน',
      storageFile: 'js/wbs.js, scratch/Code.gs & js/data_history.js',
      changeSummary: 'เธ•เธฃเธงเธเธชเธญเธเธเธเธชเธฒเน€เธซเธ•เธธเธ—เธตเนเนเธ–เธง WBS เนเธชเธ”เธ "เนเธกเนเธเธเนเธ Google Sheet" เธ—เธฑเนเธเธ—เธตเนเธกเธตเธเนเธญเธกเธนเธฅเนเธเธเธตเธ•: เน€เธเธทเนเธญเธเธเธฒเธเนเธ Google Sheet เธกเธตเธเธฒเธฃเธเธฃเธญเธเน€เธเธเธฒเธฐเธเธญเธฅเธฑเธกเธเน "เธเธทเนเธญเธเธฒเธ" (Job Description) เนเธ•เนเธขเธฑเธเนเธกเนเนเธ”เนเธฃเธฐเธเธธ WBS/เนเธเธเธเธดเธ”เธเธฒเธ เธซเธฃเธทเธญเธซเธฑเธงเธ•เธฒเธฃเธฒเธเธ–เธนเธเธเธฑเธ”เธงเธฒเธเธซเธฅเธฒเธขเธเธฑเนเธ เธเธถเธเนเธ”เนเธเธฃเธฑเธเธเธฃเธธเธเนเธซเน: 1) Code.gs เธชเนเธเธเธซเธฑเธงเธ•เธฒเธฃเธฒเธ 5 เนเธ–เธงเนเธฃเธเนเธฅเธฐเธ•เธฃเธงเธเธเธฑเธเธซเธฑเธงเธ•เธฒเธฃเธฒเธเธเนเธณเธเธฅเธฒเธเธเธตเธ• (Stacked Tables) เธเธฃเนเธญเธกเธ”เธถเธเธ—เธฑเนเธ WBS เนเธฅเธฐ เธเธทเนเธญเธเธฒเธ เธชเนเธเธเธฅเธฑเธเธกเธฒ 2) js/wbs.js เน€เธเธดเนเธกเธเธฒเธฃเธเธฑเธเธเธนเน 2 เธเธฑเนเธ (WBS Code + เธเธทเนเธญเธเธฒเธ เนเธเธ Normalized & Substring) 3) เธซเธฒเธเธเธเธเธทเนเธญเธเธฒเธเนเธ Sheet เนเธกเนเธขเธฑเธเนเธกเนเนเธ”เนเธเธฃเธญเธเธเนเธญเธกเธนเธฅ เธเธฐเนเธชเธ”เธเธชเธ–เธฒเธเธฐเธเธเธ•เธด (-) เนเธกเนเธเธถเนเธเธชเธตเนเธ”เธ 4) เธฃเธฐเธเธเธเธฑเธเธ—เธถเธ โ๏ธ เธชเนเธเธ—เธฑเนเธ WBS เนเธฅเธฐเธเธทเนเธญเธเธฒเธเนเธเธเนเธงเธขเน€เธ•เธดเธกเนเธ Google Sheet เนเธซเนเธญเธฑเธ•เนเธเธกเธฑเธ•เธด',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฃเธงเธเธชเธญเธเธ”เนเธงเธเธ•เธฒเธกเธเธณเธฃเนเธญเธเน€เธฃเธตเธขเธเธเธนเนเนเธเนเธเธฒเธ: 1) เธงเธดเธเธดเธเธเธฑเธขเธเนเธญเน€เธ—เนเธเธเธฃเธดเธเธเธเธงเนเธฒเธฃเธฒเธขเธเธฒเธฃ WBS เธ—เธตเนเธงเธเนเธ เธเธเธ.เธชเธกเธธเธ—เธฃเธชเธฒเธเธฃ (เน€เธเนเธ P-TDD01.2-I-SMNS0.SMC3, P-TDD01.1-I-SMNT0.0004) เนเธฅเธฐเธญเธตเธเธซเธฅเธฒเธข WBS เธกเธตเธเธทเนเธญเธเธฒเธเนเธ Google Sheet เนเธ•เนเธขเธฑเธเนเธกเนเนเธ”เนเธเธฃเธญเธเธเนเธญเธกเธนเธฅเนเธเธ/เธซเธกเธฒเธขเน€เธซเธ•เธธ เธซเธฃเธทเธญเธเนเธญเธ WBS เนเธเธเธตเธ•เน€เธงเนเธเธงเนเธฒเธเนเธงเน เธ—เธณเนเธซเนเธชเธเธฃเธดเธเธ•เนเน€เธ”เธดเธกเธ—เธตเนเธ”เธถเธเน€เธเธเธฒเธฐ WBS เธกเธญเธเธเนเธฒเธกเนเธ–เธงเนเธ 2) เธเธฃเธฑเธเธเธฃเธธเธ scratch/Code.gs เน€เธเธดเนเธกเธเธฒเธฃเธชเนเธเธเธซเธฒ descCol (เธเธทเนเธญเธเธฒเธ, เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เธเธฒเธ, เนเธเธฃเธเธเธฒเธฃ) เนเธฅเธฐเธฃเธญเธเธฃเธฑเธเธ•เธฒเธฃเธฒเธเธเนเธณเธเนเธญเธเนเธเธเธตเธ• เธชเนเธเธเธทเธเธ—เธฑเนเธ data เนเธฅเธฐ dataByDesc 3) เธเธฃเธฑเธเธเธฃเธธเธ js/wbs.js เนเธ syncLiveNotesFromGoogleSheet เนเธซเนเน€เธ—เธตเธขเธเธฃเธซเธฑเธช WBS เนเธฅเธฐเธเธทเนเธญเธเธฒเธเธเธนเนเธเธเธฒเธเธเธฑเธ 4) เนเธเนเนเธเนเธซเนเนเธ–เธงเธ—เธตเนเธเธเนเธ Google Sheet เนเธ•เนเธขเธฑเธเนเธกเนเธฃเธฐเธเธธเนเธเธเธเธดเธ”เธเธฒเธ เนเธชเธ”เธเธเธฅเน€เธเนเธเธเธเธ•เธด เนเธกเนเนเธชเธ”เธเธเธทเนเธเธซเธฅเธฑเธเธชเธตเนเธ”เธเธซเธฃเธทเธญเธเนเธญเธเธงเธฒเธกเนเธกเนเธเธ 5) เธเธฃเธฑเธเธเธฃเธธเธ initWbsApp เนเธซเนเธ•เธฑเนเธเธชเธ–เธฒเธเธฐเน€เธฃเธดเนเธกเธ•เนเธเน€เธเนเธเธเธเธ•เธด เนเธกเนเนเธซเนเน€เธเธดเธ”เธญเธฒเธเธฒเธฃเธเธฐเธเธฃเธดเธเธชเธตเนเธ”เธเธเธ“เธฐเธเธณเธฅเธฑเธเนเธซเธฅเธ”เธเนเธญเธกเธนเธฅ 6) เนเธกเนเธกเธตเธเธฒเธฃเธชเนเธเนเธเธฅเนเนเธเธขเธฑเธ 00AI V2 เธ•เธฒเธกเธเธณเธชเธฑเนเธเธขเธเน€เธฅเธดเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธงเธเธเธฅเธกเธ—เธตเนเธงเธ เธกเธตเธเธทเนเธญเธเธฒเธ เนเธ google sheet เนเธ•เนเธขเธฑเธเนเธกเนเนเธ”เนเธเธฃเธญเธเธเนเธญเธกเธนเธฅ เนเธฅเธฐเธ—เธณเนเธซเธกเธ–เธถเธเนเธชเธ”เธ เนเธกเนเธเธเนเธ google sheet เนเธซเนเธ•เธฃเธงเธเธชเธญเธเธ”เนเธงเธ เนเธฅเธฐเน€เธเนเธเธซเธฅเธฒเธข WBS เธ”เนเธงเธข)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธชเธนเธ'
    },
    {
      id: 'log_000_cancel_sync_to_00ai_v2',
      timestamp: '2026-10-23 01:10:00',
      timestampTh: '23 เธ•.เธ. 2569, 01:10 เธ.',
      type: 'CONFIG',
      typeBadge: 'เธขเธเน€เธฅเธดเธ Sync 00AI V2',
      badgeClass: 'badge-type-config',
      title: 'เธขเธเน€เธฅเธดเธเธเธฃเธฐเธเธงเธเธเธฒเธฃเธเธดเธเธเนเนเธเธฅเนเนเธเธขเธฑเธเนเธเธฅเน€เธ”เธญเธฃเน 00AI V2 เธ—เธฑเนเธเธซเธกเธ”เธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ',
      targetSubject: 'เธเธฑเนเธเธ•เธญเธเธเธฒเธฃเธ—เธณเธเธฒเธเนเธฅเธฐเธเธฒเธฃเธเธดเธเธเนเนเธเธฅเนเธชเธณเธฃเธญเธ (D:\\เธเธฃเธข+++\\00AI V2)',
      storageFile: 'js/data_history.js',
      changeSummary: 'เธขเธเน€เธฅเธดเธเธเธฃเธฐเธเธงเธเธเธฒเธฃเธเธดเธเธเนเนเธเธฅเนเนเธเธขเธฑเธเนเธเธฅเน€เธ”เธญเธฃเน 00AI V2 เธ—เธฑเนเธเธซเธกเธ”เธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ เนเธ”เธขเธเธฐเธ”เธณเน€เธเธดเธเธเธฒเธฃเธเธฑเธ’เธเธฒ เนเธเนเนเธ เนเธฅเธฐเธเธฑเธเธ—เธถเธเธเนเธญเธกเธนเธฅเน€เธเธเธฒเธฐเธ—เธตเนเนเธเธฅเน€เธ”เธญเธฃเนเธซเธฅเธฑเธ D:\\เธเธฃเธข+++\\00AI เน€เธ—เนเธฒเธเธฑเนเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธขเธเน€เธฅเธดเธ Sync 00AI V2 เธ—เธฑเนเธเธซเธกเธ”): 1) เธขเธธเธ•เธดเธเธฒเธฃเธ—เธณเธเธฒเธเธเธญเธเธชเธเธฃเธดเธเธ•เนเธเธดเธเธเนเนเธฅเธฐเนเธกเนเธ—เธณเธเธฒเธฃเธเธฑเธ”เธฅเธญเธเนเธเธฅเนเนเธเธขเธฑเธ D:\\เธเธฃเธข+++\\00AI V2 เธญเธตเธเธ•เนเธญเนเธ 2) เธกเธธเนเธเน€เธเนเธเธเธฒเธฃเธเธฑเธ’เธเธฒเนเธฅเธฐเธเธฑเธเธ—เธถเธเธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเน€เธเธฅเธตเนเธขเธเนเธเธฅเธเธ—เธฑเนเธเธซเธกเธ”เธฅเธเธเธเธฃเธฐเธเธเธซเธฅเธฑเธ D:\\เธเธฃเธข+++\\00AI เนเธ”เธขเธ•เธฃเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธขเธเน€เธฅเธดเธ Sync 00AI V2 เธ—เธฑเนเธเธซเธกเธ”)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ'
    },
    {
      id: 'log_000_wbs_sync_strict_sheet_red_not_found',
      timestamp: '2026-10-23 01:05:00',
      timestampTh: '23 เธ•.เธ. 2569, 01:05 เธ.',
      type: 'CONFIG',
      typeBadge: 'เธขเธถเธ” Google Sheet & เธเธทเนเธเธชเธตเนเธ”เธ',
      badgeClass: 'badge-type-config',
      title: 'เธเธฃเธฑเธเธเธฃเธธเธเธฃเธฐเธเธ Auto-Sync WBS เธ”เธถเธเน€เธเธเธฒเธฐเนเธเธเธเธดเธ”เธเธฒเธเนเธฅเธฐเธซเธกเธฒเธขเน€เธซเธ•เธธ เนเธฅเธฐเธซเธฒเธเนเธกเนเธเธเนเธ Google Sheet เนเธซเนเนเธชเธ”เธเธเธทเนเธเธชเธตเนเธ”เธ',
      targetSubject: 'เธฃเธฐเธเธเนเธชเธ”เธเธเธฅเธ•เธฒเธฃเธฒเธ WBS (renderWbsTable, syncLiveNotesFromGoogleSheet) เนเธ js/wbs.js, scratch/Code.gs เนเธฅเธฐ css/styles.css',
      storageFile: 'js/wbs.js, scratch/Code.gs, css/styles.css, index.html & js/data_history.js',
      changeSummary: 'เธเธฃเธฑเธเธเธฃเธธเธเธ•เธฒเธกเธเนเธญเธเธณเธซเธเธ” 2 เธเนเธญ: 1) Auto-Sync เธ”เธถเธเธเนเธญเธกเธนเธฅเธเธฒเธ Google Sheet เน€เธเธเธฒเธฐเธเธญเธฅเธฑเธกเธเน "เนเธเธเธเธดเธ”เธเธฒเธ" (planClose) เนเธฅเธฐ "เธซเธกเธฒเธขเน€เธซเธ•เธธ" (note) เน€เธ—เนเธฒเธเธฑเนเธ เนเธกเนเธ”เธถเธเธซเธฃเธทเธญเนเธ•เธฐเธ•เนเธญเธเธชเธ–เธฒเธเธฐเธซเธฃเธทเธญเธเนเธญเธกเธนเธฅเธญเธทเนเธ 2) เธซเธฒเธเธซเธฒ WBS เนเธ”เนเธ Google Sheet เนเธกเนเน€เธเธญ เนเธซเนเนเธชเธ”เธเธ—เธฑเนเธเธเนเธญเธเนเธเธเธเธดเธ”เธเธฒเธเนเธฅเธฐเธซเธกเธฒเธขเน€เธซเธ•เธธเน€เธเนเธเธเธทเนเธเธชเธตเนเธ”เธ (background red) เธเธฃเนเธญเธกเธเนเธฒเธขเน€เธ•เธทเธญเธ "โ เนเธกเนเธเธเนเธ Google Sheet" เนเธ”เธขเธซเนเธฒเธกเธเธณเธเนเธญเธกเธนเธฅเน€เธเนเธฒเธกเธฒเนเธชเธ”เธเน€เธ”เนเธ”เธเธฒเธ” เธขเธถเธ”เธเนเธญเธกเธนเธฅเธเธฒเธ Google Sheet 100%',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: 1) เนเธ syncLiveNotesFromGoogleSheet เธ—เธณเธเธฒเธฃเธ”เธถเธเน€เธเธเธฒเธฐ planClose เนเธฅเธฐ note เนเธ”เธขเน€เธ—เธตเธขเธเธฃเธซเธฑเธช WBS เนเธเธ Trim & Case-Insensitive 2) เธชเธณเธซเธฃเธฑเธ WBS เธ—เธตเนเนเธกเนเธเธเนเธ Google Sheet เธเธณเธซเธเธ” item.planClose = "", item.note = "", item.notFoundInSheet = true 3) เนเธ renderWbsTable เน€เธเธดเนเธกเน€เธเธทเนเธญเธเนเธเนเธซเนเนเธชเธ”เธเน€เธเธฅเธฅเนเนเธเธเธเธดเธ”เธเธฒเธเนเธฅเธฐเธซเธกเธฒเธขเน€เธซเธ•เธธเน€เธเนเธเธเธทเนเธเธชเธตเนเธ”เธ (background: rgba(220, 38, 38, 0.28) !important; border-left/right: 2px solid #EF4444) เธเธฃเนเธญเธกเธเนเธฒเธข badge-plan-not-found เนเธฅเธฐเธเธเธเธธเนเธก โ๏ธ เนเธซเนเธชเธฒเธกเธฒเธฃเธ–เธเธฅเธดเธเธฃเธฐเธเธธเธเนเธญเธกเธนเธฅเธชเนเธเน€เธเนเธฒ Google Sheet เนเธ”เน 4) เนเธ updateWbsPlanCloseDropdown เน€เธเธดเนเธกเธ•เธฑเธงเน€เธฅเธทเธญเธเธ•เธฑเธงเธเธฃเธญเธ "โ เนเธกเนเธเธเนเธ Google Sheet" เนเธซเนเธเธ”เธเธฃเธญเธเน€เธเธเธฒเธฐเธเธฒเธเธ—เธตเนเนเธกเนเธเธเนเธ”เนเธ—เธฑเธเธ—เธต 5) เนเธ initWbsApp เธ—เธณเธเธฒเธฃเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเน€เธเนเธฒเธเธญเธเนเธเธเธเธดเธ”เธเธฒเธเนเธฅเธฐเธซเธกเธฒเธขเน€เธซเธ•เธธเธ—เธฑเนเธเธซเธกเธ”เธ—เธฑเธเธ—เธตเน€เธกเธทเนเธญเน€เธฃเธดเนเธกเธ•เนเธเธฃเธฐเธเธ เน€เธเธทเนเธญเธฃเธฑเธเธเธฃเธฐเธเธฑเธเธงเนเธฒเนเธกเนเธกเธตเธเนเธญเธกเธนเธฅเน€เธเนเธฒเธซเธฅเธเน€เธซเธฅเธทเธญเธกเธฒเนเธชเธ”เธเธเธฅ 6) เธญเธฑเธเน€เธ”เธ• scratch/Code.gs เนเธฅเธฐเธเธดเธเธเนเนเธเธฅเนเนเธเธขเธฑเธ 00AI V2 เธเธฃเธเธ–เนเธงเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (1.เนเธซเนเนเธเนเธเธณเธชเธฑเนเธ เน€เธเนเธ Auto-Sync เน€เธกเธทเนเธญเน€เธเธดเธ”เนเธ—เนเธ WBS เนเธฅเธฐเธ”เธถเธเธเนเธญเธกเธนเธฅ google sheet เน€เธเธเธฒเธฐ เนเธเธเธเธดเธ”เธเธฒเธ เนเธฅเธฐเธซเธกเธฒเธขเน€เธซเธ•เธธเน€เธ—เนเธฒเธเธฑเนเธ 2.เธซเธฒเธเธซเธฒ WBS เนเธ google sheet เนเธกเนเน€เธเธญ เนเธซเนเนเธชเธ”เธ เนเธเธเธเธดเธ”เธเธฒเธ เนเธฅเธฐเธซเธกเธฒเธขเน€เธซเธ•เธธ เน€เธเนเธเธเธทเนเธเธชเธตเนเธ”เธ เธซเนเธฒเธกเธเธณเธเนเธญเธกเธนเธฅเน€เธเนเธฒเธกเธฒเนเธชเธ”เธ เนเธซเนเธขเธถเธ”เธเธฒเธ google sheet เน€เธ—เนเธฒเธเธฑเนเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธชเธนเธ'
    },
    {
      id: 'log_000_auto_sync_google_sheet_on_wbs_tab_open',
      timestamp: '2026-10-23 00:50:00',
      timestampTh: '23 เธ•.เธ. 2569, 00:50 เธ.',
      type: 'CONFIG',
      typeBadge: 'Auto-Sync เน€เธกเธทเนเธญเน€เธเธดเธ”เนเธ—เนเธ WBS',
      badgeClass: 'badge-type-config',
      title: 'เน€เธเธดเธ”เนเธเนเธเธฒเธเธฃเธฐเธเธ Auto-Sync เธเนเธญเธกเธนเธฅเธเธฒเธ Google Sheet เธญเธฑเธ•เนเธเธกเธฑเธ•เธดเธ—เธฑเธเธ—เธตเน€เธกเธทเนเธญเน€เธเธดเธ”เนเธ—เนเธ WBS',
      targetSubject: 'เธฃเธฐเธเธเธเธดเธเธเน Google Sheet เธเนเธฒเธก 9 เนเธ—เนเธ (window.syncLiveNotesFromGoogleSheet) เนเธ js/wbs.js เนเธฅเธฐ js/app.js',
      storageFile: 'js/wbs.js, js/app.js, scratch/Code.gs, index.html & js/data_history.js',
      changeSummary: 'เน€เธเธทเนเธญเธกเนเธขเธเธฃเธฐเธเธ Auto-Sync เธ”เธถเธเธเนเธญเธกเธนเธฅเนเธเธเธเธดเธ”เธเธฒเธ (planClose), เธซเธกเธฒเธขเน€เธซเธ•เธธ (note) เนเธฅเธฐเธชเธ–เธฒเธเธฐ SAP เธเธฒเธ Google Sheet เธ—เธฑเนเธ 9 เนเธ—เนเธเน€เธเธ“เธ‘เนเธงเธฑเธ”เนเธ”เธขเธญเธฑเธ•เนเธเธกเธฑเธ•เธดเธ—เธฑเธเธ—เธตเธ—เธตเนเธเธนเนเนเธเนเธเธฒเธเธเธฅเธดเธเน€เธเธดเธ”เนเธ—เนเธ WBS เธซเธฃเธทเธญเนเธซเธฅเธ”เธซเธเนเธฒเน€เธงเนเธเธ—เธตเนเนเธ—เนเธ WBS เธเธฃเนเธญเธกเน€เธเธดเนเธกเธฃเธฐเธเธเธเนเธญเธเธเธฑเธเธเธฒเธฃเธชเนเธ Request เธเนเธณเธเนเธญเธ (Concurrency Guard & 5-Second Throttle) เนเธฅเธฐเนเธชเธ”เธเนเธเนเธเน€เธ•เธทเธญเธเธเธงเธฒเธกเธเธทเธเธซเธเนเธฒเธเธฒเธฃเธเธดเธเธเน',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (Auto-Sync เน€เธกเธทเนเธญเน€เธเธดเธ”เนเธ—เนเธ WBS): 1) เนเธเนเนเธเธเธฑเธเธเนเธเธฑเธ switchTab เนเธ js/app.js เนเธซเนเน€เธฃเธตเธขเธ window.syncLiveNotesFromGoogleSheet(false) เธ—เธฑเธเธ—เธตเน€เธกเธทเนเธญเธชเธฅเธฑเธเธกเธฒเธ—เธตเน tab-wbs 2) เน€เธเธดเนเธก Event Listener เนเธ setupWbsListeners เธเธญเธ js/wbs.js เธเธเธเธธเนเธกเธเธณเธ—เธฒเธ [data-tab="tab-wbs"] เธ—เธฑเนเธเธซเธกเธ” 3) เน€เธเธดเนเธกเธเธฒเธฃเธ•เธฃเธงเธเธชเธญเธเนเธ initWbsApp() เธซเธฒเธเธซเธเนเธฒเน€เธงเนเธเน€เธฃเธดเนเธกเธ•เนเธเน€เธเธดเธ”เธญเธขเธนเนเธ—เธตเนเนเธ—เนเธ WBS เนเธซเนเธชเธฑเนเธ Auto-Sync เธ—เธฑเธเธ—เธต 4) เธเธฃเธฑเธเธเธฃเธธเธเธเธฑเธเธเนเธเธฑเธ syncLiveNotesFromGoogleSheet เนเธซเนเธกเธตเธ•เธฑเธงเนเธเธฃ isGoogleSheetSyncInProgress เนเธฅเธฐ lastSyncTimestamp เธเนเธญเธเธเธฑเธเธเธฒเธฃเธขเธดเธเธเธณเธเธญเธเนเธณเธเนเธญเธ 5) เน€เธเธดเนเธกเธเธฒเธฃเนเธกเธเธเนเธญเธกเธนเธฅเธเธดเธฅเธ”เน statusSap เนเธฅเธฐ status เธฃเธญเธเธฃเธฑเธเธซเธฒเธ Google Sheet เธกเธตเธเธญเธฅเธฑเธกเธเนเธชเธ–เธฒเธเธฐ 6) เธญเธฑเธเน€เธ”เธ• scratch/Code.gs เนเธซเนเธชเนเธเธเธเธญเธฅเธฑเธกเธเนเธชเธ–เธฒเธเธฐ SAP เนเธฅเธฐเธเธดเธเธเนเนเธเธฅเนเนเธเธขเธฑเธ 00AI V2 เธเธฃเธเธ–เนเธงเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (Auto-Sync เน€เธกเธทเนเธญเน€เธเธดเธ”เนเธ—เนเธ WBS)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_reset_filter_align_latest_month',
      timestamp: '2026-10-23 00:30:00',
      timestampTh: '23 เธ•.เธ. 2569, 00:30 เธ.',
      type: 'CONFIG',
      typeBadge: 'เธเธฃเธฑเธเธเธธเนเธกเธฃเธตเน€เธเนเธ•เน€เธเนเธเน€เธ”เธทเธญเธเธฅเนเธฒเธชเธธเธ”',
      badgeClass: 'badge-type-config',
      title: 'เธเธฃเธฑเธเธเธฃเธธเธเธเธธเนเธกเธฃเธตเน€เธเนเธ•เธ•เธฑเธงเธเธฃเธญเธเธซเธเนเธฒเนเธฃเธเนเธซเนเน€เธเธทเนเธญเธกเนเธขเธเนเธฅเธฐเธเธทเธเธเนเธฒเน€เธเนเธเน€เธ”เธทเธญเธเธฅเนเธฒเธชเธธเธ” (เธ.เธข. 2569)',
      targetSubject: 'เธเธธเนเธกเธฃเธตเน€เธเนเธ•เธ•เธฑเธงเธเธฃเธญเธเธซเธฅเธฑเธ (#btnResetFilters) เนเธฅเธฐเธเธฑเธเธเนเธเธฑเธเธเธณเธเธงเธ“เน€เธ”เธทเธญเธเธฅเนเธฒเธชเธธเธ”เนเธ js/app.js',
      storageFile: 'js/app.js, index.html & js/data_history.js',
      changeSummary: 'เนเธเนเนเธเธ•เธฃเธฃเธเธฐเธเธฒเธฃเธ—เธณเธเธฒเธเธเธญเธเธเธธเนเธกเธฃเธตเน€เธเนเธ•เธ•เธฑเธงเธเธฃเธญเธ (#btnResetFilters) เธเธเธซเธเนเธฒเนเธฃเธ เธเธฒเธเน€เธ”เธดเธกเธ—เธตเนเน€เธเธขเธฅเนเธญเธเธเนเธฒเธเธเธ—เธตเนเนเธงเนเธ—เธตเนเน€เธ”เธทเธญเธ เธช.เธ. (index 7) เนเธซเนเน€เธเธฅเธตเนเธขเธเธกเธฒเนเธเนเธเธฑเธเธเนเธเธฑเธ getLatestAvailableMonthIndex() เธ”เธถเธเธเนเธญเธกเธนเธฅเน€เธ”เธทเธญเธเธฅเนเธฒเธชเธธเธ”เธ—เธตเนเธกเธตเนเธเธฃเธฐเธเธเนเธ”เธขเธญเธฑเธ•เนเธเธกเธฑเธ•เธด (เธเธฑเธเธเธธเธเธฑเธเธเธทเธญเน€เธ”เธทเธญเธ เธ.เธข. 2569 / index 8) เธเธฃเนเธญเธกเนเธซเธฅเธ”เธเนเธญเธกเธนเธฅเธเธญเธเน€เธ”เธทเธญเธเธฅเนเธฒเธชเธธเธ”เนเธซเธกเน (loadDataForMonth) เนเธฅเธฐเธเธฃเธฑเธเธเธฃเธธเธเธ•เธฑเธงเธชเธณเธฃเธญเธเน€เธ”เธทเธญเธเน€เธฃเธดเนเธกเธ•เนเธเธเธญเธเธ—เธฑเนเธเธฃเธฐเธเธเนเธซเนเน€เธเนเธเน€เธ”เธทเธญเธเธฅเนเธฒเธชเธธเธ”เธญเธขเนเธฒเธเธชเธกเธเธนเธฃเธ“เน',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธเธธเนเธกเธฃเธตเน€เธเธ— เธซเธเนเธฒเนเธฃเธเนเธซเนเนเธเธญเธดเธเธเธฑเธเน€เธ”เธทเธญเธเธฅเนเธฒเธชเธธเธ”): 1) เน€เธเธดเนเธกเธเธฑเธเธเนเธเธฑเธ getLatestAvailableMonthIndex() เนเธ js/app.js เน€เธเธทเนเธญเธ•เธฃเธงเธเธชเธญเธเธขเนเธญเธเธซเธฅเธฑเธเธเธฒเธเน€เธ”เธทเธญเธ เธ.เธ. เธซเธฒเน€เธ”เธทเธญเธเธฅเนเธฒเธชเธธเธ”เธ—เธตเนเธกเธตเธฃเธฒเธขเธเธฒเธเธเนเธญเธกเธนเธฅเธเธฃเธดเธ 2) เนเธเนเนเธเธเธธเนเธก #btnResetFilters เนเธซเนเธเธทเธเธเนเธฒ state.filters.month เน€เธเนเธเน€เธ”เธทเธญเธเธฅเนเธฒเธชเธธเธ” เธเธฃเนเธญเธกเธชเธฑเนเธ loadDataForMonth(latestM) เนเธฅเธฐเธญเธฑเธเน€เธ”เธ• Dropdown #filterMonth เธ—เธฑเธเธ—เธต 3) เธเธฃเธฑเธเธเธฃเธธเธเธ•เธฑเธงเนเธเธฃเธชเธณเธฃเธญเธเน€เธ”เธทเธญเธเน€เธฃเธดเนเธกเธ•เนเธเนเธเธฃเธฐเธเธ (selectedMonthBadge, syncChartFilterUI, selectionStrip, criteriaComparisonChart) เนเธซเนเนเธเน getLatestAvailableMonthIndex() เนเธ—เธเธเนเธฒเธเธเธ—เธตเน 7 4) เธเธดเธเธเนเนเธเธฅเนเนเธเธขเธฑเธ 00AI V2 เธเธฃเธเธ–เนเธงเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธเธธเนเธกเธฃเธตเน€เธเธ— เธซเธเนเธฒเนเธฃเธเนเธซเนเนเธเธญเธดเธเธเธฑเธเน€เธ”เธทเธญเธเธฅเนเธฒเธชเธธเธ”)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_swap_red_yellow_charts_sticky_blue_left',
      timestamp: '2026-10-23 00:05:00',
      timestampTh: '23 เธ•.เธ. 2569, 00:05 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเน€เธฅเธขเนเน€เธญเธฒเธ•เนเธเธฃเธฒเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธชเธฅเธฑเธเธ•เธณเนเธซเธเนเธเธเธฃเธฒเธเน€เธเธ“เธ‘เนเธงเธฑเธ”เธเธถเนเธเธเธ เธเธฃเธฒเธเนเธ—เนเธเธฅเธเธฅเนเธฒเธ เธเธงเนเธฒเธเน€เธ—เนเธฒเธเธฑเธ เนเธฅเธฐเธฅเนเธญเธเนเธ–เธเธชเธฃเธธเธเธชเธตเธเนเธณเน€เธเธดเธเธ•เธดเธ”เธซเธเนเธฒเธเธญเธ”เนเธฒเธเธเนเธฒเธข',
      targetSubject: 'เน€เธฅเธขเนเน€เธญเธฒเธ•เนเธเธฃเธฒเธเธซเธฅเธฑเธเธ เธฒเธเธฃเธงเธกเธเธนเนเธเธฃเธดเธซเธฒเธฃ (topCriteriaChartCard, unifiedProjectionOfficeCard, topExecutiveLeftDeck)',
      storageFile: 'index.html, css/styles.css, js/app.js & js/data_history.js',
      changeSummary: 'เธชเธฅเธฑเธเธ•เธณเนเธซเธเนเธเธเธฃเธฒเธ: เธขเนเธฒเธขเธเธฃเธฒเธเน€เธเธ“เธ‘เนเธงเธฑเธ” 8 เธเธฃเธฐเน€เธ เธ— (เธเธฃเธญเธเธชเธตเนเธ”เธ) เธเธถเนเธเนเธงเนเธ”เนเธฒเธเธเธ เนเธฅเธฐเธขเนเธฒเธขเธเธฃเธฒเธเธเธฃเธฐเธกเธฒเธ“เธเธฒเธฃ 3 เน€เธ”เธทเธญเธ + เธเธฅเธเธฒเธฃเธ”เธณเน€เธเธดเธเธเธฒเธเธฃเธฒเธข เธเธเธ. (เธเธฃเธญเธเธชเธตเน€เธซเธฅเธทเธญเธ) เธฅเธเนเธงเนเธ”เนเธฒเธเธฅเนเธฒเธ เนเธ”เธขเธเธฃเธฑเธเธเธเธฒเธ”เธเธงเธฒเธกเธเธงเนเธฒเธเธเธญเธเธเธฃเธฒเธเธชเธตเนเธ”เธเนเธซเนเน€เธ—เนเธฒเธเธฑเธเธเธฃเธฒเธเธชเธตเน€เธซเธฅเธทเธญเธเธเธญเธ”เธตเน€เธเนเธฐ เธเธฃเนเธญเธกเธเธฃเธฑเธเนเธซเนเนเธ–เธเธชเธฃเธธเธเนเธ”เธเธฑเธ— KPI (เธเธฃเธญเธเธชเธตเธเนเธณเน€เธเธดเธ) เธเนเธฒเธเธ•เธดเธ”เธซเธเนเธฒเธเธญเธ•เธฅเธญเธ” (Sticky) เธญเธขเธนเนเธ”เนเธฒเธเธเนเธฒเธขเธกเธทเธญเธเธเธฒเธ”เน€เธ”เธดเธก เนเธฅเธฐเน€เธเธทเนเธญเธกเนเธขเธเธเธฒเธฃเธเธฅเธดเธเน€เธฅเธทเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ”เนเธซเนเธเธดเธเธเนเธเนเธญเธกเธนเธฅเธเธฑเธเนเธ–เธเธชเธตเธเนเธณเน€เธเธดเธเธ—เธฑเธเธ—เธต',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: 1) เธเธฃเธฑเธเนเธเธฃเธเธชเธฃเนเธฒเธเนเธ index.html เนเธ”เธขเธชเธฃเนเธฒเธ container .top-executive-right-stack เธเธฃเธญเธเธ—เธฑเนเธเธเธฃเธฒเธเน€เธเธ“เธ‘เนเธงเธฑเธ” (topCriteriaChartCard) เนเธงเนเธ”เนเธฒเธเธเธ เนเธฅเธฐเธเธฃเธฒเธเธเธฃเธฐเธกเธฒเธ“เธเธฒเธฃ + เนเธ—เนเธเธฃเธฒเธข เธเธเธ. (unifiedProjectionOfficeCard) เนเธงเนเธ”เนเธฒเธเธฅเนเธฒเธ 2) เธเธฃเธฑเธ CSS เนเธ css/styles.css เนเธซเนเธ—เธฑเนเธเธชเธญเธเธเธฃเธฒเธเธกเธตเธเธงเธฒเธกเธเธงเนเธฒเธเน€เธ—เนเธฒเธเธฑเธ 100% เธเธญเธเธเธญเธฅเธฑเธกเธเนเธเธงเธฒ 3) เธเธฃเธฑเธ .top-executive-left-deck เนเธซเนเน€เธเนเธ position: sticky; top: calc(var(--sticky-header-height, 134px) + 0.35rem) เนเธฅเธฐ align-self: start; เน€เธเธทเนเธญเนเธซเนเนเธ–เธเธชเธตเธเนเธณเน€เธเธดเธเธเนเธฒเธเธ•เธฃเธถเธเธญเธขเธนเนเธ”เนเธฒเธเธเนเธฒเธขเธ•เธฅเธญเธ”เน€เธงเธฅเธฒเธ—เธตเนเน€เธฅเธทเนเธญเธเธ”เธนเธซเธฃเธทเธญเน€เธฅเธทเธญเธเนเธเนเธเธฒเธเธเธฃเธฒเธเนเธ”เธเธซเธฃเธทเธญเน€เธซเธฅเธทเธญเธ 4) เน€เธเธดเนเธก onClick เนเธ chartOptions เธเธญเธเธเธฃเธฒเธเน€เธเธ“เธ‘เนเธงเธฑเธ” เนเธฅเธฐเธเธฃเธฑเธเธเธฃเธธเธ selectSidebarCriteria เนเธซเนเธชเธฒเธกเธฒเธฃเธ–เธเธฅเธดเธเน€เธฅเธทเธญเธเน€เธเธทเนเธญเธเธฃเธญเธเธเนเธญเธกเธนเธฅเนเธฅเธฐเธเธฅเธดเธเธเนเธณเน€เธเธทเนเธญเธเธทเธเธเนเธฒ ALL เนเธ”เนเธ—เธฑเธเธ—เธต เธเธฃเนเธญเธกเธเธดเธเธเนเธเนเธญเธกเธนเธฅเนเธชเธ”เธเธเธฅเธเธเธเธฒเธฃเนเธ”เธชเธตเธเนเธณเน€เธเธดเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (1. เธขเนเธฒเธขเธเธฃเธฒเธ เธชเธตเน€เน€เธ”เธเนเธงเนเธ”เนเธฒเธเธเธ เนเธฅเธฐเน€เธซเธฅเธทเธญเธ เธ”เนเธฒเธเธฅเนเธฒเธ เนเธซเนเธชเธฅเธฑเธเธ•เธณเนเธซเธเนเธเธเธฑเธ 2. เนเธฅเธฐเธเธฃเธฑเธเธเธเธฒเธ”เธเธฃเธฒเธ เธชเธตเนเธ”เธ เนเธซเนเธเธงเนเธฒเธเน€เธ—เนเธฒเธเธฑเธเธชเธตเน€เธซเธฅเธทเธญเธ 2.เนเธซเนเธเธฃเธฒเธ เธชเธตเธเนเธณเน€เธเธดเธ เธเนเธฒเธเนเธงเน เธซเธฒเธเน€เธฅเธทเธญเธเธเธฃเธฒเธ เนเธ”เธ เธซเธฃเธทเธญเน€เธซเธฅเธทเธญเธ เธเนเธชเธฒเธกเธฒเธฃเธ–เน€เธซเนเธเธเธฃเธฒเธเธชเธตเธเนเธณเน€เธเธดเธ เธ•เธฅเธญเธ”เธ”เนเธฒเธเธเนเธฒเธขเธกเธทเธญเน€เธซเธกเธทเธญเธเน€เธ”เธดเธก เธเธเธฒเธ”เน€เธ”เธดเธก)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_update_sep_01_auc_report_33teco',
      timestamp: '2026-10-22 23:18:00',
      timestampTh: '22 เธ•.เธ. 2569, 23:18 เธ.',
      type: 'IMPORT',
      typeBadge: 'เธญเธฑเธเน€เธ”เธ•เนเธเธฅเนเธเนเธญเธกเธนเธฅ 01',
      badgeClass: 'badge-type-import',
      title: 'เธญเธฑเธเน€เธ”เธ•เธเธฒเธเธเนเธญเธกเธนเธฅเธฃเธฒเธขเธเธฒเธ AUC เน€เธ”เธทเธญเธ 9 เธ.เธข. (3.3teco) เธ•เธฒเธกเนเธเธฅเน 01 เธฅเนเธฒเธชเธธเธ”',
      targetSubject: 'เธฃเธฒเธขเธเธฒเธ AUC เธเธฃเธฐเธเธณเน€เธ”เธทเธญเธ เธ.เธข. 2569 (window.AUC_DATA_SEP) เธซเธกเธงเธ”เน€เธเธ“เธ‘เนเธงเธฑเธ” เธเนเธญ 3.3 TECO D2',
      storageFile: 'js/data_sep.js, index.html & js/data_history.js',
      changeSummary: 'เธเธฃเธฐเธกเธงเธฅเธเธฅเนเธฅเธฐเธญเธฑเธเน€เธ”เธ•เธเนเธญเธกเธนเธฅเธเธฒเธเนเธเธฅเน "01 เธฃเธฒเธขเธเธฒเธ AUC เน€เธ”เธทเธญเธ 9เธ.เธข.  (3.3teco).xlsx" เธ—เธตเนเธกเธตเธเธฒเธฃเนเธเนเนเธเธฅเนเธฒเธชเธธเธ” (22 เธ•.เธ. 2569 เน€เธงเธฅเธฒ 21:03 เธ.): เธญเธฑเธเน€เธ”เธ•เธซเธกเธงเธ”เน€เธเธ“เธ‘เนเธงเธฑเธ”เธเนเธญ 3 เนเธเน€เธ”เธทเธญเธ เธ.เธข. เธเธฒเธเน€เธ”เธดเธก "เธเนเธญ 3.2 TECO D2" เน€เธเนเธ "เธเนเธญ 3.3 TECO D2" เธเธฃเธเธ—เธฑเนเธ 46 เธฃเธฒเธขเธเธฒเธฃ เธฃเธงเธกเธ—เธฑเนเธเธชเธดเนเธ 368 เธฃเธฒเธขเธเธฒเธฃ เนเธฅเธฐเธเธดเธเธเนเนเธเธฅเนเนเธเธขเธฑเธ 00AI V2 เน€เธฃเธตเธขเธเธฃเนเธญเธข',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (update เนเธเธฅเน 01 เน€เธ”เธทเธญเธ 9เธ.เธข.): 1) เธ•เธฃเธงเธเธชเธญเธเนเธเธฅเน 01 เธฃเธฒเธขเธเธฒเธ AUC เน€เธ”เธทเธญเธ 9เธ.เธข.  (3.3teco).xlsx เธเธเธงเนเธฒเธกเธตเธเธฒเธฃเนเธเนเนเธเนเธ–เธง 232-277 เนเธเธซเธกเธงเธ”เน€เธเธ“เธ‘เนเธงเธฑเธ”เธเนเธญ 3 เธเธฒเธเน€เธ”เธดเธก "เธเนเธญ 3.2 TECO D2" เน€เธเนเธ "เธเนเธญ 3.3 TECO D2" เนเธซเนเธ•เธฃเธเธ•เธฒเธกเธฃเธญเธเน€เธงเธฅเธฒเนเธฅเธฐเธเธทเนเธญเนเธเธฅเน 2) เธชเธเธฑเธ”เธเนเธญเธกเธนเธฅเนเธซเธกเนเธ—เธฑเนเธ 368 เธฃเธฒเธขเธเธฒเธฃ เธเธฑเธเธ—เธถเธเธฅเธ js/data_sep.js (window.AUC_DATA_SEP) 3) เธเธดเธเธเนเนเธเธฅเน js/data_sep.js เนเธฅเธฐเนเธเธฅเน Excel เนเธเธขเธฑเธเนเธเธฅเน€เธ”เธญเธฃเน 00AI V2 เน€เธเธทเนเธญเธเธงเธฒเธกเธชเธกเธเธนเธฃเธ“เน 4) เธญเธฑเธเน€เธ”เธ• cache version เนเธ index.html เน€เธเนเธ ?v=20261022_2315 เน€เธเธทเนเธญเนเธซเนเน€เธเธฃเธฒเธงเนเน€เธเธญเธฃเนเนเธซเธฅเธ”เธเนเธญเธกเธนเธฅเธชเธ”เนเธซเธกเนเธ—เธฑเธเธ—เธต',
      sourceFile: '01 เธฃเธฒเธขเธเธฒเธ AUC เน€เธ”เธทเธญเธ 9เธ.เธข.  (3.3teco).xlsx (เธญเธฑเธเน€เธ”เธ• 22 เธ•.เธ. 2569 21:03 เธ.)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_wbs_sync_on_button_click_only',
      timestamp: '2026-10-22 22:28:00',
      timestampTh: '22 เธ•.เธ. 2569, 22:28 เธ.',
      type: 'CONFIG',
      typeBadge: 'เธเธดเธเธเนเน€เธเธเธฒเธฐเธเธ”เธเธธเนเธก',
      badgeClass: 'badge-type-config',
      title: 'เธเธฃเธฑเธเธเธฃเธธเธเธฃเธฐเธเธเธเธดเธเธเน Google Sheet เนเธซเนเธ—เธณเธเธฒเธเน€เธเธเธฒเธฐเน€เธกเธทเนเธญเธเธนเนเนเธเนเธเธ”เธเธธเนเธกเน€เธ—เนเธฒเธเธฑเนเธ',
      targetSubject: 'เธฃเธฐเธเธเธเธดเธเธเนเธเนเธญเธกเธนเธฅ Google Sheet (#btnSyncGoogleSheet) เนเธฅเธฐเธเธฑเธเธเนเธเธฑเธ initWbsApp เนเธ js/wbs.js',
      storageFile: 'index.html, js/wbs.js & js/data_history.js',
      changeSummary: 'เธขเธเน€เธฅเธดเธเธเธฒเธฃเธ”เธถเธเธเนเธญเธกเธนเธฅเธญเธฑเธ•เนเธเธกเธฑเธ•เธดเนเธเธเธทเนเธเธซเธฅเธฑเธเธ—เธฑเนเธเธซเธกเธ” (Auto-Sync on Load, Visibility Change เนเธฅเธฐ Interval Polling) เนเธ”เธขเน€เธเธฅเธตเนเธขเธเนเธซเนเธฃเธฐเธเธเธเธดเธเธเนเธเนเธญเธกเธนเธฅเธเธฒเธ Google Sheet เน€เธเธเธฒเธฐเน€เธกเธทเนเธญเธเธนเนเนเธเนเธเธ”เธเธธเนเธก "เธเธดเธเธเน Google Sheet" เน€เธ—เนเธฒเธเธฑเนเธ เน€เธเธทเนเธญเธเธงเธฒเธกเน€เธชเธ–เธตเธขเธฃเนเธฅเธฐเนเธซเนเธเธนเนเนเธเนเธเธงเธเธเธธเธกเธเธฒเธฃเนเธซเธฅเธ”เธเนเธญเธกเธนเธฅเน€เธญเธ 100%',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธเนเนเธ เธเธดเธ google sheet เน€เธเธเธฒเธฐเธเธ”เธเธธเนเธกเน€เธ—เนเธฒเธเธฑเนเธ): 1) เนเธ js/wbs.js เธ•เธฑเธ”เธเธณเธชเธฑเนเธ auto-sync เนเธ background เธญเธญเธเธ—เธฑเนเธเธซเธกเธ” (setTimeout เนเธซเธฅเธ”เธซเธเนเธฒเน€เธงเนเธ, visibilitychange เธชเธฅเธฑเธเนเธ—เนเธ, เนเธฅเธฐ setInterval เธ—เธธเธ 60 เธงเธดเธเธฒเธ—เธต) 2) เธเธฒเธฃเธ”เธถเธเธเนเธญเธกเธนเธฅเธชเธ”เธเธฒเธ Google Sheet เธเธฐเธ—เธณเธเธฒเธเน€เธเธเธฒเธฐเน€เธกเธทเนเธญเธกเธตเธเธฒเธฃเธเธฅเธดเธเธเธธเนเธก #btnSyncGoogleSheet เนเธ”เธขเธ•เธฃเธเน€เธ—เนเธฒเธเธฑเนเธ 3) เธเธฃเธฑเธเธเธฃเธธเธ tooltip เนเธฅเธฐเธเนเธฒเธขเธชเธ–เธฒเธเธฐเนเธ index.html เนเธซเนเธชเธญเธ”เธเธฅเนเธญเธเธเธฑเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธเนเนเธ เธเธดเธ google sheet เน€เธเธเธฒเธฐเธเธ”เธเธธเนเธกเน€เธ—เนเธฒเธเธฑเนเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_wbs_modal_clean_strict_3_choices_fix',
      timestamp: '2026-10-22 22:25:00',
      timestampTh: '22 เธ•.เธ. 2569, 22:25 เธ.',
      type: 'EDIT',
      typeBadge: 'เธ•เธฑเธ”เธ•เธฑเธงเน€เธฅเธทเธญเธเธชเนเธงเธเน€เธเธดเธเธญเธญเธ',
      badgeClass: 'badge-type-edit',
      title: 'เนเธเนเนเธเนเธฅเธฐเธฅเนเธญเธ Dropdown เนเธเธเธเธดเธ”เธเธฒเธเนเธซเนเนเธชเธ”เธเน€เธเธเธฒเธฐ 3 เธ•เธฑเธงเน€เธฅเธทเธญเธเธ•เธฃเธเธเธตเธ• เธ•เธฑเธ”เธเนเธฒเธเธขเธฐ เนเธ•เธฃเธกเธฒเธช 4 เนเธฅเธฐ เธเธงเธ” เธชเธ เธญเธญเธเธ–เธฒเธงเธฃ',
      targetSubject: 'เธซเธเนเธฒเธ•เนเธฒเธเนเธกเธ”เธฑเธฅเนเธเนเนเธเธเธฒเธ WBS (#wbsEditModalPlan) เนเธ js/wbs.js',
      storageFile: 'js/wbs.js & js/data_history.js',
      changeSummary: 'เนเธเนเนเธเธเธฑเธเธเนเธเธฑเธ refreshWbsPlanCloseDropdownOptions เนเธ”เธขเธ•เธฑเธ”เธเธณเธชเธฑเนเธเธชเนเธเธเธเนเธญเธกเธนเธฅเน€เธเนเธฒ allData เธญเธญเธเธญเธขเนเธฒเธเน€เธ”เนเธ”เธเธฒเธ” เน€เธเธทเนเธญเธเนเธญเธเธเธฑเธเนเธกเนเนเธซเนเธเนเธฒเน€เธเนเธฒเธ—เธตเนเน€เธเธขเธ•เธดเธ” เนเธ•เธฃเธกเธฒเธช 4 เธซเธฃเธทเธญ เธเธงเธ”เธเธฑเธเธเธต เธชเธ เธซเธฅเธธเธ”เน€เธเนเธฒเธกเธฒเนเธ Dropdown เธ—เธณเนเธซเนเธเธฑเธเธเธธเธเธฑเธเนเธชเธ”เธเน€เธเธเธฒเธฐ 3 เธ•เธฑเธงเน€เธฅเธทเธญเธเธ•เธฒเธก Google Sheet เน€เธเนเธฐ 100%',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธ–เธฒเธก/เธเธฑเธเธซเธฒเธเธญเธเธเธนเนเนเธเนเธเธฒเธ (เธ—เธณเนเธก เนเธเธเธเธดเธ”เธเธฒเธ dropdown list เนเธกเนเธ•เธฃเธเธ•เธฒเธก google sheet - เธกเธตเธ•เธฑเธงเน€เธฅเธทเธญเธเธญเธทเนเธเธเธเธกเธฒเน€เธเธดเธ 3 เธ•เธฑเธงเน€เธฅเธทเธญเธ): 1) เธชเธฒเน€เธซเธ•เธธเน€เธเธดเธ”เธเธฒเธเธฃเธฐเธเธเน€เธ”เธดเธกเธกเธตเธเธฒเธฃเธชเนเธเธเธซเธฒเธ•เธฑเธงเน€เธฅเธทเธญเธเธเธฒเธเธเธฒเธเธเนเธญเธกเธนเธฅเน€เธฃเธดเนเธกเธ•เนเธ เธเธถเนเธเธกเธตเธเนเธญเธกเธนเธฅเน€เธเนเธฒเธ•เธดเธ”เธเธณเธงเนเธฒ "เนเธ•เธฃเธกเธฒเธช 4" เนเธฅเธฐ "เธเธงเธ”เธเธฑเธเธเธต เธชเธ" 2) เนเธเนเนเธเนเธ js/wbs.js เนเธ”เธขเธเธณเธซเธเธ” exactOptions เนเธซเนเธกเธตเน€เธเธเธฒเธฐ "เธเธงเธ”เธเธฑเธเธเธต เธ•.เธ. 69", "เธเธงเธ”เธเธฑเธเธเธต เธ.เธข. 69", "เธเธงเธ”เธเธฑเธเธเธต เธ.เธ. 69" เนเธฅเธฐเธ•เธฑเธงเน€เธฅเธทเธญเธเน€เธงเนเธเธงเนเธฒเธ 3) เธ•เธฑเธ”เธเธฒเธฃเธชเนเธเธ dynamicOptionsSet เธเธฒเธ allData เธ—เธดเนเธเธ—เธฑเนเธเธซเธกเธ” เธ—เธณเนเธซเนเธ•เธฑเธงเน€เธฅเธทเธญเธเธชเธฐเธญเธฒเธ”เนเธฅเธฐเธ•เธฃเธเธเธฑเธ Google Sheet 100%',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธ—เธณเนเธก เนเธเธเธเธดเธ”เธเธฒเธ dropdown list เนเธกเนเธ•เธฃเธเธ•เธฒเธก google sheet)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_wbs_realtime_auto_sync_google_sheet_plan_dropdown',
      timestamp: '2026-10-22 21:37:00',
      timestampTh: '22 เธ•.เธ. 2569, 21:37 เธ.',
      type: 'CONFIG',
      typeBadge: 'เธเธดเธเธเน Dropdown เธญเธฑเธ•เนเธเธกเธฑเธ•เธด',
      badgeClass: 'badge-type-config',
      title: 'เน€เธเธดเนเธกเธฃเธฐเธเธเธ•เธฃเธงเธเธเธฑเธเนเธฅเธฐเธเธดเธเธเนเธ•เธฑเธงเน€เธฅเธทเธญเธเนเธเธเธเธดเธ”เธเธฒเธเธเธฒเธ Google Sheet เนเธเธเธญเธฑเธ•เนเธเธกเธฑเธ•เธดเน€เธฃเธตเธขเธฅเนเธ—เธกเน',
      targetSubject: 'เธฃเธฐเธเธเธเธดเธเธเน Google Sheet เธเนเธฒเธก 9 เนเธ—เนเธ (window.syncLiveNotesFromGoogleSheet) เนเธฅเธฐ Dropdown เนเธกเธ”เธฑเธฅเนเธเนเนเธ WBS',
      storageFile: 'index.html, js/wbs.js & js/data_history.js',
      changeSummary: 'เน€เธเธดเนเธกเธเธณเธชเธฑเนเธเธญเธฑเธ•เนเธเธกเธฑเธ•เธดเนเธซเน Dashboard เธ•เธฃเธงเธเธเธฑเธเธเธฒเธฃเนเธเนเนเธ/เน€เธเธฅเธตเนเธขเธเนเธเธฅเธ/เน€เธเธดเนเธก เนเธเธเธเธดเธ”เธเธฒเธเนเธ Google Sheet เธ—เธฑเธเธ—เธต: 1) เธเธดเธเธเนเธญเธฑเธ•เนเธเธกเธฑเธ•เธดเน€เธกเธทเนเธญเน€เธเธดเธ”เธซเธเนเธฒเน€เธงเนเธ 2) เธเธดเธเธเนเธ—เธฑเธเธ—เธตเน€เธกเธทเนเธญเธชเธฅเธฑเธเนเธ—เนเธเธเธฅเธฑเธเธกเธฒเธ—เธตเน Dashboard (Tab Focus/Visibility Change) 3) เนเธเนเธเธเธฃเธฒเธงเธ”เนเธญเธญเนเธ•เนเธเธดเธเธเนเธ—เธธเธ 60 เธงเธดเธเธฒเธ—เธต 4) เธเธฑเธเธเนเธเธฑเธ refreshWbsPlanCloseDropdownOptions เธเธงเธฒเธ”เธ•เธฑเธงเน€เธฅเธทเธญเธเนเธซเธกเนเนเธ Google Sheet เธกเธฒเน€เธเธดเนเธกเนเธ Dropdown เธ—เธฑเธเธ—เธต',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธเธดเนเธกเธเธณเธชเธฑเธเธญเธฑเธ•เนเธเธกเธฑเธ•เธด เธซเธฒเธ google sheet เธกเธตเธเธฒเธฃเนเธเนเนเธ/เน€เธเธฅเธตเนเธขเธเนเธเธฅเธ/เน€เธเธดเนเธก เนเธเธเธเธดเธ”เธเธฒเธ dropdown เนเธซเนเธกเธฒเนเธเนเนเธเนเธ dasboard Index เธ—เธฑเธเธ—เธต): 1) เนเธ js/wbs.js เธเธฑเธ’เธเธฒเธฃเธฐเธเธ Background Polling เนเธฅเธฐ Event-driven Auto Sync เธ”เนเธงเธข visibilitychange เนเธฅเธฐ focus เธ”เธฑเธเธเธฑเธเน€เธกเธทเนเธญเธเธนเนเนเธเนเธชเธฅเธฑเธเธซเธเนเธฒเธ•เนเธฒเธเธเธฅเธฑเธเธกเธฒเธเธฒเธ Google Sheet เนเธฅเนเธงเธ”เธถเธเธเนเธญเธกเธนเธฅเธ—เธฑเธเธ—เธต 2) เธเธฑเธเธเนเธเธฑเธ refreshWbsPlanCloseDropdownOptions เธ—เธณเธเธฒเธฃเธชเนเธเธเธซเธฒเธ•เธฑเธงเน€เธฅเธทเธญเธเนเธซเธกเนเธ—เธตเนเน€เธเธดเนเธกเน€เธเนเธฒเธกเธฒเนเธเธเธตเธ• เนเธฅเนเธงเธญเธฑเธเน€เธ”เธ•เธฅเธ <select id="wbsEditModalPlan"> เธ—เธฑเธเธ—เธต 3) เธเธฃเธฑเธเธเธฃเธธเธ index.html เนเธชเธ”เธเธชเธ–เธฒเธเธฐเธเธฒเธฃเธเธดเธเธเนเธชเธ”เนเธเธเน€เธฃเธตเธขเธฅเนเธ—เธกเน',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธเธดเนเธกเธเธณเธชเธฑเธเธญเธฑเธ•เนเธเธกเธฑเธ•เธด เธซเธฒเธ google sheet เธกเธตเธเธฒเธฃเนเธเนเนเธ/เน€เธเธฅเธตเนเธขเธเนเธเธฅเธ/เน€เธเธดเนเธก เนเธเธเธเธดเธ”เธเธฒเธ dropdown เนเธซเนเธกเธฒเนเธเนเนเธเนเธ dasboard Index เธ—เธฑเธเธ—เธต)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธชเธนเธ'
    },
    {
      id: 'log_000_wbs_modal_plan_close_strictly_3_choices',
      timestamp: '2026-10-22 21:20:00',
      timestampTh: '22 เธ•.เธ. 2569, 21:20 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธณเธเธฑเธ” 3 เธ•เธฑเธงเน€เธฅเธทเธญเธเธ•เธฃเธเธเธตเธ•',
      badgeClass: 'badge-type-edit',
      title: 'เธเธฃเธฑเธเธเธฃเธธเธ Dropdown เนเธเธเธเธดเธ”เธเธฒเธเนเธซเนเธกเธตเน€เธเธเธฒเธฐ 3 เธ•เธฑเธงเน€เธฅเธทเธญเธเธ•เธฃเธเธ•เธฒเธก Google Sheet เน€เธ—เนเธฒเธเธฑเนเธ',
      targetSubject: 'เธซเธเนเธฒเธ•เนเธฒเธเนเธกเธ”เธฑเธฅเนเธเนเนเธเธเธฒเธ WBS (#wbsEditModalPlan) เนเธฅเธฐเธเธฒเธฃเธเธดเธเธเนเธเนเธญเธกเธนเธฅเธเธฑเธ Google Sheet',
      storageFile: 'index.html, js/wbs.js & js/data_history.js',
      changeSummary: 'เธ•เธฑเธ”เธ•เธฑเธงเน€เธฅเธทเธญเธเธชเนเธงเธเน€เธเธดเธเธ—เธฑเนเธเธซเธกเธ”เธญเธญเธ เนเธซเน Dropdown เนเธเธเธเธดเธ”เธเธฒเธเธกเธตเน€เธเธเธฒเธฐ 3 เธ•เธฑเธงเน€เธฅเธทเธญเธเธ—เธตเนเนเธเนเธเธฃเธดเธเนเธ Google Sheet: 1) เธเธงเธ”เธเธฑเธเธเธต เธ•.เธ. 69 2) เธเธงเธ”เธเธฑเธเธเธต เธ.เธข. 69 3) เธเธงเธ”เธเธฑเธเธเธต เธ.เธ. 69 (เนเธฅเธฐเธ•เธฑเธงเน€เธฅเธทเธญเธเน€เธงเนเธเธงเนเธฒเธ) เธ•เธฑเธ”เธ•เธฑเธงเน€เธฅเธทเธญเธเธเธดเธกเธเนเน€เธญเธเธญเธญเธ เน€เธเธทเนเธญเนเธซเนเธ•เธฃเธเธ•เธฒเธกเธเธ•เธดเธเธฒเธเธญเธ Google Sheet เน€เธเนเธฐ 100%',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (Dropdown เนเธ Dashboard เนเธเนเนเธเธ•เธฃเธเธเธฑเธ google sheet เน€เธ—เนเธฒเธเธฑเนเธ 3 เธ•เธฑเธงเน€เธฅเธทเธญเธ): 1) เนเธ index.html เธเธณเธซเธเธ” <option> เนเธ #wbsEditModalPlan เน€เธซเธฅเธทเธญเน€เธเธเธฒเธฐ "-- เนเธกเนเธฃเธฐเธเธธเนเธเธเธเธดเธ”เธเธฒเธ (เน€เธงเนเธเธงเนเธฒเธ) --", "เธเธงเธ”เธเธฑเธเธเธต เธ•.เธ. 69", "เธเธงเธ”เธเธฑเธเธเธต เธ.เธข. 69" เนเธฅเธฐ "เธเธงเธ”เธเธฑเธเธเธต เธ.เธ. 69" 2) เธเธณเธ•เธฑเธงเน€เธฅเธทเธญเธเธเธดเธกเธเนเน€เธญเธเนเธฅเธฐเธเธฅเธธเนเธกเธเธงเธ”เธญเธทเนเธเน เธญเธญเธเธ—เธฑเนเธเธซเธกเธ” 3) เนเธ js/wbs.js เธ—เธณเธเธงเธฒเธกเธชเธฐเธญเธฒเธ”เธเธฑเธเธเนเธเธฑเธ openWbsEditNoteModal เนเธฅเธฐ submitWbsEditNoteModal เนเธซเนเธ—เธณเธเธฒเธเธเธฃเธฐเธเธฑเธเนเธฅเธฐเธชเนเธเน€เธเธเธฒเธฐ 3 เธ•เธฑเธงเน€เธฅเธทเธญเธเธเธตเนเนเธเธขเธฑเธ Google Apps Script',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (Dropdown เนเธ Dashboard เนเธเนเนเธเธ•เธฃเธเธเธฑเธ google sheet เน€เธ—เนเธฒเธเธฑเนเธ 3 เธ•เธฑเธงเน€เธฅเธทเธญเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ'
    },
    {
      id: 'log_000_wbs_modal_plan_close_dropdown',
      timestamp: '2026-10-22 21:12:00',
      timestampTh: '22 เธ•.เธ. 2569, 21:12 เธ.',
      type: 'EDIT',
      typeBadge: 'เธ•เธฑเธงเน€เธฅเธทเธญเธเนเธเธเธเธดเธ”เธเธฒเธเธ•เธฃเธเธเธตเธ•',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธฅเธตเนเธขเธเธเนเธญเธ "เนเธเธเธเธดเธ”เธเธฒเธ" เนเธเธซเธเนเธฒเธ•เนเธฒเธเนเธเนเนเธเนเธซเนเน€เธเนเธ Dropdown เธ•เธฑเธงเน€เธฅเธทเธญเธเธ•เธฃเธเธ•เธฒเธก Google Sheet',
      targetSubject: 'เธซเธเนเธฒเธ•เนเธฒเธเนเธกเธ”เธฑเธฅเนเธเนเนเธเธเธฒเธ WBS (#wbsEditNoteModal, #wbsEditModalPlan) เนเธฅเธฐเธฃเธฐเธเธเธเธฑเธเธ—เธถเธเธฅเธ Google Sheet',
      storageFile: 'index.html, js/wbs.js & js/data_history.js',
      changeSummary: 'เน€เธเธฅเธตเนเธขเธเธเนเธญเธเธเธฃเธญเธเนเธเธเธเธดเธ”เธเธฒเธเธเธฒเธเธเนเธญเธเธงเธฒเธกเธญเธดเธชเธฃเธฐ (Text Input) เนเธซเนเน€เธเนเธ Dropdown (<select>) เธเธฃเนเธญเธกเธเธธเธ”เธ•เธฑเธงเน€เธฅเธทเธญเธเธเธงเธ”เธเธฑเธเธเธตเธเธต 2569 - 2570 เนเธฅเธฐเนเธ•เธฃเธกเธฒเธช เธ•เธฃเธเธ•เธฒเธก Data Validation เธเธญเธ Google Sheet 100% เธเนเธญเธเธเธฑเธเธเธฒเธฃเธเธดเธกเธเนเธเธดเธ”เนเธฅเธฐเธเธฒเธฃเธเธเธดเน€เธชเธเธเนเธญเธกเธนเธฅเนเธเธเธตเธ•',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธ–เธฒเธก/เธเธณเธเธญเธเธนเนเนเธเนเธเธฒเธ (เนเธ goosheet เนเธเธเธเธดเธ”เธเธฒเธ เน€เธเนเธเนเธเธเธกเธตเธ•เธฑเธงเน€เธฅเธทเธญเธ เธเธดเธกเนเธกเนเนเธ”เน เนเธ•เนเนเธ dasboard เน€เธเนเธเนเธเธเนเธกเนเธกเธตเธ•เธฑเธงเน€เธฅเธทเธญเธเธเธฐเธ—เธณเธญเธขเนเธฒเธเนเธฃเนเธซเนเน€เธซเธกเธทเธญเธเธเธฑเธ): 1) เนเธ index.html เน€เธเธฅเธตเนเธขเธ #wbsEditModalPlan เน€เธเนเธ <select class="form-select"> เธเธฑเธ”เธเธฅเธธเนเธกเธ•เธฑเธงเน€เธฅเธทเธญเธเธเธงเธ”เธเธฑเธเธเธต เธ•.เธ. 69, เธ.เธข. 69, เธ.เธ. 69, เนเธ•เธฃเธกเธฒเธช 4, เธเธงเธ”เธเธต 2570, เธเธงเธ”เธขเนเธญเธเธซเธฅเธฑเธ เนเธฅเธฐเธ•เธฑเธงเน€เธฅเธทเธญเธเน€เธงเนเธเธงเนเธฒเธ 2) เนเธ js/wbs.js เธเธฃเธฑเธเธเธฃเธธเธ openWbsEditNoteModal เนเธซเนเธ•เธฃเธงเธเธเธฑเธเธเนเธฒเน€เธ”เธดเธกเธเธฒเธเธเธตเธ• เธซเธฒเธเธกเธตเธเนเธฒเธเธญเธเธฃเธฒเธขเธเธฒเธฃเธเธฐเธเธเธเนเธฒเนเธงเนเนเธเธซเธกเธงเธ”เธเธดเน€เธจเธฉเนเธกเนเนเธซเนเธชเธนเธเธซเธฒเธข 3) เธฃเธญเธเธฃเธฑเธเธ•เธฑเธงเน€เธฅเธทเธญเธเธเธดเธกเธเนเธฃเธฐเธเธธเน€เธญเธเธเธฃเธ“เธต Google Sheet เธกเธตเธเธงเธ”เนเธซเธกเนเนเธเธญเธเธฒเธเธ• 4) เธเนเธฒเธ—เธตเนเน€เธฅเธทเธญเธเธเธฐเธ–เธนเธเธชเนเธเนเธเธเธฑเธเธ—เธถเธเธฅเธ Google Sheet เธญเธขเนเธฒเธเธ–เธนเธเธ•เนเธญเธเธ•เธฃเธเน€เธเธทเนเธญเธเนเธ Data Validation เน€เธชเธกเธญ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธ goosheet เนเธเธเธเธดเธ”เธเธฒเธ เน€เธเนเธเนเธเธเธกเธตเธ•เธฑเธงเน€เธฅเธทเธญเธ เธเธดเธกเนเธกเนเนเธ”เน เนเธ•เนเธ dasboard เน€เธเนเธเนเธเธเนเธกเนเธกเธตเธ•เธฑเธงเน€เธฅเธทเธญเธเธเธฐเธ—เธณเธญเธขเนเธฒเธเนเธฃเนเธซเนเน€เธซเธกเธทเธญเธเธเธฑเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_fix_gas_target_note_column',
      timestamp: '2026-10-22 20:50:00',
      timestampTh: '22 เธ•.เธ. 2569, 20:50 เธ.',
      type: 'CONFIG',
      typeBadge: 'เนเธเนเนเธเธเธญเธฅเธฑเธกเธเนเธเธฑเธเธ—เธถเธ G-Sheet',
      badgeClass: 'badge-type-config',
      title: 'เนเธเนเนเธเธ•เธฃเธฃเธเธฐเธฃเธฐเธเธธเธเธญเธฅเธฑเธกเธเน Google Apps Script เนเธซเนเธเธฑเธเธ—เธถเธเธฅเธ "เธซเธกเธฒเธขเน€เธซเธ•เธธ" เนเธ—เธ "เธซเธกเธฒเธขเน€เธซเธ•เธธเน€เธเธดเนเธกเน€เธ•เธดเธก"',
      targetSubject: 'Google Apps Script Web App (action=update) เนเธฅเธฐเธเธฒเธฃเนเธกเธเธเธญเธฅเธฑเธกเธเนเธ•เธฒเธฃเธฒเธ WBS',
      storageFile: 'Google Apps Script (Code.gs) & js/data_history.js',
      changeSummary: 'เนเธเนเธเธฑเธเธซเธฒเธเธฒเธฃเธเธฑเธเธ—เธถเธเธซเธกเธฒเธขเน€เธซเธ•เธธเธเธฒเธ Dashboard เนเธฅเนเธงเธเนเธญเธกเธนเธฅเนเธเธฅเธเธเนเธญเธ "เธซเธกเธฒเธขเน€เธซเธ•เธธเน€เธเธดเนเธกเน€เธ•เธดเธก" เนเธ”เธขเธเธฃเธฑเธเธเธฃเธธเธเน€เธเธทเนเธญเธเนเธเนเธ Apps Script เนเธซเนเน€เธเนเธ Strict Match (!includes("เน€เธเธดเนเธกเน€เธ•เธดเธก")) เน€เธเธทเนเธญเธฃเธฐเธเธธเธเธญเธฅเธฑเธกเธเน "เธซเธกเธฒเธขเน€เธซเธ•เธธ" เนเธ—เนเธเธฃเธดเธ 100%',
      details: 'เธงเธดเน€เธเธฃเธฒเธฐเธซเนเธเธเธงเนเธฒ Google Sheet เธกเธต 2 เธเธญเธฅเธฑเธกเธเนเธเธทเธญ "เธซเธกเธฒเธขเน€เธซเธ•เธธ" เนเธฅเธฐ "เธซเธกเธฒเธขเน€เธซเธ•เธธเน€เธเธดเนเธกเน€เธ•เธดเธก" เน€เธ”เธดเธกเธชเธเธฃเธดเธเธ•เนเธเนเธเธซเธฒเธ”เนเธงเธข indexOf("เธซเธกเธฒเธขเน€เธซเธ•เธธ") เธ—เธณเนเธซเนเธฅเธนเธเนเธเธ—เธฑเธเธ•เธณเนเธซเธเนเธเธเธญเธฅเธฑเธกเธเน "เธซเธกเธฒเธขเน€เธซเธ•เธธเน€เธเธดเนเธกเน€เธ•เธดเธก" เนเธเนเนเธเนเธ”เธข: 1) เธเธฃเธฑเธเธเธฃเธธเธเธ•เธฃเธฃเธเธฐเนเธ Code.gs เนเธซเนเธเนเธเธซเธฒเนเธเธเธ•เธฃเธเธ•เธฑเธง colName === "เธซเธกเธฒเธขเน€เธซเธ•เธธ" เธซเธฃเธทเธญ colName.includes("เธซเธกเธฒเธขเน€เธซเธ•เธธ") && !colName.includes("เน€เธเธดเนเธกเน€เธ•เธดเธก") 2) เธฃเธญเธเธฃเธฑเธเธเธญเธฅเธฑเธกเธเน "เนเธเธเธเธดเธ”เธเธฒเธ" เนเธกเนเนเธซเนเธชเธฑเธเธชเธ 3) เธเธฑเธ”เน€เธ•เธฃเธตเธขเธกเธชเธเธฃเธดเธเธ•เน Code.gs เธเธเธฑเธเธชเธกเธเธนเธฃเธ“เนเธเธฃเนเธญเธกเธเธฑเนเธเธ•เธญเธ Deploy New Version',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธเนเธเน€เธเธเธฒเธฐ เนเธเนเนเธเนเธ dasboard เนเธฅเนเธงเนเธเนเธชเธ”เธ google เธเธดเธ”เธเธญเธฅเนเธก)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_update_data_history_badge_to_dynamic_date',
      timestamp: '2026-10-22 20:00:00',
      timestampTh: '22 เธ•.เธ. 2569, 20:00 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธเนเธฒเธขเธงเธฑเธเธ—เธตเนเนเธ—เนเธเธเธฃเธฐเธงเธฑเธ•เธด',
      badgeClass: 'badge-type-edit',
      title: 'เธเธฃเธฑเธเธเนเธฒเธขเธงเธฑเธเธ—เธตเนเนเธ—เนเธ "เธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเธเธณเน€เธเนเธฒ & เนเธเนเนเธเธเนเธญเธกเธนเธฅ" เนเธซเนเน€เธเนเธเธงเธฑเธเธ—เธตเนเธฅเนเธฒเธชเธธเธ” (22 เธ•.เธ.) เนเธเธเนเธ”เธเธฒเธกเธดเธ',
      targetSubject: 'เธเนเธฒเธขเนเธ—เนเธเธเธเนเธ–เธเน€เธกเธเธนเธซเธฅเธฑเธ (#dataHistoryBadge) เนเธฅเธฐเธเธฑเธเธเนเธเธฑเธเน€เธฃเธเน€เธ”เธญเธฃเนเธเธฃเธฐเธงเธฑเธ•เธด',
      storageFile: 'index.html, js/data_history.js',
      changeSummary: 'เธเธฃเธฑเธเธเธฃเธธเธเธเนเธฒเธขเธงเธฑเธเธ—เธตเนเธเธเธเธธเนเธกเนเธ—เนเธ "เธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเธเธณเน€เธเนเธฒ & เนเธเนเนเธเธเนเธญเธกเธนเธฅ" เธเธฒเธเน€เธ”เธดเธก 17 เธ•.เธ. เน€เธเนเธ 22 เธ•.เธ. (เธงเธฑเธเธเธตเน) เธเธฃเนเธญเธกเน€เธเธดเนเธกเธ•เธฃเธฃเธเธฐเธ•เธฃเธงเธเธเธฑเธเนเธฅเธฐเธญเธฑเธเน€เธ”เธ•เธเนเธฒเธขเธงเธฑเธเธ—เธตเนเธ•เธฒเธก Log เธเธฃเธฐเธงเธฑเธ•เธดเธฅเนเธฒเธชเธธเธ”เนเธ”เธขเธญเธฑเธ•เนเธเธกเธฑเธ•เธด',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธ–เธฒเธก/เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธงเธฑเธเธ—เธตเนเธญเธฐเนเธฃ): 1) เธเธตเนเนเธเธเธงเนเธฒเธงเธฑเธเธ—เธตเน 17 เธ•.เธ. เน€เธ”เธดเธกเน€เธเนเธเธงเธฑเธเธ—เธตเนเธเธณเน€เธเนเธฒเนเธเธฅเน 03 WBS เธเธฃเธฑเนเธเนเธฃเธ 2) เธเธฃเธฑเธเนเธเนเธเนเธฒเน€เธฃเธดเนเธกเธ•เนเธเนเธ index.html เนเธซเนเน€เธเนเธ 22 เธ•.เธ. (เธงเธฑเธเธ—เธตเนเธญเธฑเธเน€เธ”เธ•เธฅเนเธฒเธชเธธเธ”) 3) เนเธ js/data_history.js เน€เธเธดเนเธกเธ•เธฃเธฃเธเธฐเธญเธฑเธเน€เธ”เธ•เธเนเธญเธเธงเธฒเธกเนเธ #dataHistoryBadge เนเธซเนเธ”เธถเธเธงเธฑเธเธ—เธตเนเธเธฒเธ newestLog.timestampTh เธกเธฒเนเธชเธ”เธเธเธฅเน€เธชเธกเธญ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธงเธฑเธเธ—เธตเนเธญเธฐเนเธฃ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ'
    },
    {
      id: 'log_000_setup_gitignore_for_github',
      timestamp: '2026-10-22 19:58:00',
      timestampTh: '22 เธ•.เธ. 2569, 19:58 เธ.',
      type: 'CONFIG',
      typeBadge: 'เธ•เธฑเนเธเธเนเธฒ Git/GitHub',
      badgeClass: 'badge-type-config',
      title: 'เธชเธฃเนเธฒเธเนเธเธฅเน .gitignore เน€เธเธทเนเธญเน€เธ•เธฃเธตเธขเธกเธเธงเธฒเธกเธเธฃเนเธญเธกเนเธเธเธฒเธฃเธเธถเนเธ GitHub',
      targetSubject: 'เธเธฒเธฃเธเธฑเธ”เธเธฒเธฃ Source Control (.gitignore)',
      storageFile: '.gitignore & js/data_history.js',
      changeSummary: 'เธชเธฃเนเธฒเธเนเธเธฅเน .gitignore เธชเธณเธซเธฃเธฑเธเธฅเธฐเน€เธงเนเธเนเธเธฅเนเธเธขเธฐ เนเธเธฅเนเธฅเนเธญเธเธเธฑเนเธงเธเธฃเธฒเธงเธเธญเธ Excel (~$*) เนเธฅเธฐเนเธเธฅเนเธ”เธฑเธกเธเนเธ—เธ”เธชเธญเธเนเธ scratch/ เน€เธเธทเนเธญเธเธงเธฒเธกเธชเธฐเธญเธฒเธ”เนเธฅเธฐเธเธฅเธญเธ”เธ เธฑเธขเธเนเธญเธเธญเธฑเธเน€เธ”เธ•เธเธถเนเธ GitHub',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธเธฐเธเธณเธเธถเนเธ update github): 1) เธชเธฃเนเธฒเธเนเธเธฅเน .gitignore เธ—เธตเน root เธเธญเธเนเธเธฃเน€เธเธเธ•เน 2) เธเธณเธซเธเธ” rule เธฅเธฐเน€เธงเนเธเนเธเธฅเน ~$* (Excel Lock), *.tmp, *.temp เนเธฅเธฐเนเธเธฅเนเธ เธฒเธ/html เธเธฑเนเธงเธเธฃเธฒเธงเนเธเนเธเธฅเน€เธ”เธญเธฃเน scratch 3) เธเธฑเธ”เน€เธ•เธฃเธตเธขเธกเธเธฑเนเธเธ•เธญเธเนเธฅเธฐเธเธณเธชเธฑเนเธ Git Push เธญเธขเนเธฒเธเธฅเธฐเน€เธญเธตเธขเธ”เนเธซเนเธเธนเนเนเธเนเธเธฒเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธเธฐเธเธณเธเธถเนเธ update github)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ'
    },
    {
      id: 'log_000_rename_file06_to_google_sheet',
      timestamp: '2026-10-22 19:53:00',
      timestampTh: '22 เธ•.เธ. 2569, 19:53 เธ.',
      type: 'EDIT',
      typeBadge: 'เน€เธเธฅเธตเนเธขเธเธเธทเนเธญเธเธญเธฅเธฑเธกเธเน',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธฅเธตเนเธขเธเธเธทเนเธญเธซเธฑเธงเธเธญเธฅเธฑเธกเธเนเน€เธเนเธ (G-Sheet) เธเธฃเธฐเธเธฑเธเนเธฅเธฐเธเธฑเธ”เน€เธเธ',
      targetSubject: 'เธซเธฑเธงเธ•เธฒเธฃเธฒเธ WBS เนเธฅเธฐเธเธฅเนเธญเธเน€เธฅเธทเธญเธเธเธญเธฅเธฑเธกเธเน (เธเธญเธฅเธฑเธกเธเน planClose & note)',
      storageFile: 'js/wbs.js, index.html & js/data_history.js',
      changeSummary: 'เธเธฃเธฑเธเธเนเธญเธเธงเธฒเธกเธซเธฑเธงเธเธญเธฅเธฑเธกเธเนเนเธซเนเธเธฃเธฐเธเธฑเธเน€เธเนเธ "เนเธเธเธเธดเธ”เธเธฒเธ (G-Sheet)" เนเธฅเธฐ "เธซเธกเธฒเธขเน€เธซเธ•เธธ (G-Sheet)" เธเธฃเนเธญเธกเธเนเธฒเธขเธเธฅเธธเนเธก "เนเธเธเธเธฒเธเนเธฅเนเธงเน€เธชเธฃเนเธ (G-Sheet)" เนเธฅเธฐเธเนเธฒเธข Tag "G-SHEET"',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธเนเนเธเธซเธฑเธง เน€เธเนเธ G-Sheet เนเธ—เธ): 1) เนเธ js/wbs.js เธเธฃเธฑเธ label เธเธญเธ planClose เน€เธเนเธ "เนเธเธเธเธดเธ”เธเธฒเธ (G-Sheet)" 2) เธเธฃเธฑเธ label เธเธญเธ note เน€เธเนเธ "เธซเธกเธฒเธขเน€เธซเธ•เธธ (G-Sheet)" 3) เธเธฃเธฑเธ label เธเธฅเธธเนเธก 06_sheet เน€เธเนเธ "เนเธเธเธเธฒเธเนเธฅเนเธงเน€เธชเธฃเนเธ (G-Sheet)" 4) เนเธชเธ”เธเธเนเธฒเธข Tag เนเธซเธฅเนเธเธเนเธญเธกเธนเธฅเน€เธเนเธ "G-SHEET" เธชเธงเธขเธเธฒเธกเนเธฅเธฐเนเธกเนเธเธดเธเน€เธเธทเนเธญเธ—เธตเนเธ•เธฒเธฃเธฒเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธเนเนเธเธซเธฑเธง เน€เธเนเธ G-Sheet เนเธ—เธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ'
    },
    {
      id: 'log_000_wbs_inline_edit_button_google_sheet',
      timestamp: '2026-10-22 19:42:00',
      timestampTh: '22 เธ•.เธ. 2569, 19:42 เธ.',
      type: 'EDIT',
      typeBadge: 'เน€เธเธดเนเธกเธเธธเนเธกเนเธเนเนเธเธชเธ” WBS',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธดเนเธกเธเธธเนเธกเนเธเนเนเธ โ๏ธ เนเธฅเธฐเธฃเธฐเธเธเธเธดเธเธเน 2 เธ—เธฒเธ (Two-Way Sync) เน€เธเธทเนเธญเธกเธ•เนเธญ Google Sheet เธชเธ”',
      targetSubject: 'เธ•เธฒเธฃเธฒเธ WBS เธเธเน€เธซเธฅเธทเธญ (js/wbs.js) เธเธญเธฅเธฑเธกเธเน planClose & note, เนเธกเธ”เธฑเธฅเนเธเนเนเธเธชเธ” เนเธฅเธฐเธเธธเนเธกเธเธดเธเธเนเธเนเธญเธกเธนเธฅ',
      storageFile: 'js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: 'เธฃเธญเธเธฃเธฑเธเธเธฒเธฃเธเธดเธเธเนเธเนเธญเธกเธนเธฅเนเธเธ 2 เธ—เธฒเธ (Two-Way Sync) เธฃเธฐเธซเธงเนเธฒเธ Web Dashboard เนเธฅเธฐ Google Sheet: 1) Web โก๏ธ Google Sheet (เธเธ”เธเธธเนเธก โ๏ธ เนเธเนเนเธเนเธฅเนเธงเธเธฑเธเธ—เธถเธเธฅเธ Sheet) 2) Google Sheet โก๏ธ Web (เธเธ”เธเธธเนเธก "เธเธดเธเธเน Google Sheet" เน€เธเธทเนเธญเธ”เธถเธเธเนเธญเธกเธนเธฅเธฅเนเธฒเธชเธธเธ”เธเนเธฒเธก 9 เนเธ—เนเธเธกเธฒเธญเธฑเธเน€เธ”เธ•เธฅเธเธ•เธฒเธฃเธฒเธ WBS เธ—เธฑเธเธ—เธต)',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธเนเธ 2 เธ—เธฒเธเนเธเนเธซเธฃเธทเธญเนเธกเน): 1) เธเธฑเนเธเน€เธเธตเธขเธ (Web โก๏ธ Google Sheet): เน€เธเธดเนเธกเธเธธเนเธก โ๏ธ เนเธเธ•เธฒเธฃเธฒเธ WBS เนเธฅเธฐเนเธกเธ”เธฑเธฅเธเธฑเธเธ—เธถเธ เธชเนเธเธเธณเธเธญ action=update เนเธเธขเธฑเธ Google Apps Script Web App API เน€เธเธทเนเธญเธญเธฑเธเน€เธ”เธ•เนเธ–เธงเนเธ Sheet 2) เธเธฑเนเธเธญเนเธฒเธ (Google Sheet โก๏ธ Web): เน€เธเธทเนเธญเธกเธ•เนเธญเธเธธเนเธก window.syncLiveNotesFromGoogleSheet เน€เธฃเธตเธขเธ action=getAll เธ”เธถเธเธเนเธญเธกเธนเธฅเธชเธ”เธเธฒเธเธ—เธธเธเนเธ—เนเธเนเธ Google Sheet เธเธฅเธฑเธเธกเธฒเธญเธฑเธเน€เธ”เธ• window.AUC_WBS_REMAINING_DATA เธเธเธซเธเนเธฒเน€เธงเนเธเนเธ”เนเธ•เธฅเธญเธ”เน€เธงเธฅเธฒ 3) เธญเธฑเธเน€เธ”เธ• CSS เธชเนเธ•เธฅเนเธเธธเนเธกเนเธฅเธฐเธชเธ–เธฒเธเธฐเธเธฒเธฃเธเธดเธเธเน',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธฃเธฑเธเธ•เนเธญเน€เธฅเธข เน€เธเธดเนเธกเธเธธเนเธกเนเธเนเนเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธชเธนเธ'
    },
    {
      id: 'log_000_sync_google_sheet_field_plans',
      timestamp: '2026-10-22 17:23:00',
      timestampTh: '22 เธ•.เธ. 2569, 17:23 เธ.',
      type: 'MERGE',
      typeBadge: 'เธเธดเธเธเน Google Sheet',
      badgeClass: 'badge-type-merge',
      title: 'เธเธดเธเธเนเธเนเธญเธกเธนเธฅเนเธเธเธเธดเธ”เธเธฒเธเนเธฅเธฐเธซเธกเธฒเธขเน€เธซเธ•เธธเธเธฒเธ Google Sheet (เธญเธญเธเนเธฅเธเน) เนเธ—เธเนเธเธฅเน 06',
      targetSubject: 'เธเธฒเธเธเนเธญเธกเธนเธฅ WBS เธเธเน€เธซเธฅเธทเธญ (js/data_wbs.js) เธเธญเธฅเธฑเธกเธเน planClose & note',
      storageFile: 'js/data_wbs.js & js/data_history.js',
      changeSummary: 'เธ”เธถเธเธเนเธญเธกเธนเธฅเธชเธ”เธเธฒเธ Google Apps Script Web App API (1,143 เธฃเธฒเธขเธเธฒเธฃเธเนเธฒเธก 9 เนเธ—เนเธ) เนเธ—เธเธเธฒเธฃเธญเนเธฒเธเนเธเธฅเน 06 เนเธเน€เธเธฃเธทเนเธญเธ: เธญเธฑเธเน€เธ”เธ•เนเธเธเธเธดเธ”เธเธฒเธเนเธฅเธฐเธซเธกเธฒเธขเน€เธซเธ•เธธเธชเธณเน€เธฃเนเธ 1,165 เธฃเธฒเธขเธเธฒเธฃเนเธ js/data_wbs.js เนเธ”เธขเธเธฃเธฑเธเธเธฃเธธเธเนเธเธเธเธดเธ”เธเธฒเธ (planClose) เน€เธเนเธเธเธงเธ”เธเธฑเธเธเธต เธ•.เธ., เธ.เธข., เธ.เธ. 69 เธฃเธงเธก 1,156 เธฃเธฒเธขเธเธฒเธฃ เนเธฅเธฐเธเธฃเธฑเธเธเธฃเธธเธเธซเธกเธฒเธขเน€เธซเธ•เธธเธซเธเนเธฒเธเธฒเธ 844 เธฃเธฒเธขเธเธฒเธฃ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธเน google sheet เนเธ—เธเนเธเธฅเน 06 เน€เธซเธกเธทเธญเธเน€เธ”เธดเธก เธฃเธฑเธเธ•เนเธญเนเธ”เนเน€เธฅเธขเธเนเธญเธเน€เธเธดเธ” Cortex XDR): 1) เน€เธเธทเนเธญเธกเธ•เนเธญ API เธ”เธถเธเธเนเธญเธกเธนเธฅ Google Apps Script Web App เธเธฃเธ 1,143 เธฃเธฒเธขเธเธฒเธฃเธเธฒเธ 9 เนเธ—เนเธเน€เธเธ“เธ‘เนเธงเธฑเธ” 2) เธ”เธณเน€เธเธดเธเธเธฒเธฃเธเธฑเธเธเธนเนเธฃเธซเธฑเธชเธเธฒเธ WBS เนเธฅเธฐเธญเธฑเธเน€เธ”เธ• planClose เธเธฑเธ note เธฅเธเนเธเธเธฒเธเธเนเธญเธกเธนเธฅ js/data_wbs.js เธฃเธงเธก 1,165 เนเธ–เธง 3) เน€เธเธฅเธตเนเธขเธเนเธเธฅเธเนเธเธเธเธดเธ”เธเธฒเธ 1,156 เธฃเธฒเธขเธเธฒเธฃ เนเธซเนเน€เธเนเธเธเนเธญเธกเธนเธฅเธเธฃเธดเธเธฅเนเธฒเธชเธธเธ”เธเธญเธเนเธ•เธฃเธกเธฒเธช 4 (เธเธงเธ” เธ•.เธ. - เธ.เธ. 2569) เนเธฅเธฐเธเธฃเธฑเธเธเธฃเธธเธเธเนเธญเธเธงเธฒเธกเธซเธกเธฒเธขเน€เธซเธ•เธธ 844 เธฃเธฒเธขเธเธฒเธฃ 4) เนเธเนเธงเธดเธเธตเธเธฃเธฐเธกเธงเธฅเธเธฅเธ•เธฃเธเนเธ”เธขเนเธกเนเธกเธตเธเธฒเธฃเน€เธฃเธตเธขเธเนเธเน Office Automation เน€เธเธทเนเธญเธซเธฅเธตเธเน€เธฅเธตเนเธขเธเธเธฒเธฃเนเธเนเธเน€เธ•เธทเธญเธเธเธฒเธ Cortex XDR 100%',
      sourceFile: 'Google Apps Script Web App (action=getAll)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธชเธนเธ'
    },
    {
      id: 'log_000_import_sep_auc_report',
      timestamp: '2026-10-21 09:00:00',
      timestampTh: '21 เธ•.เธ. 2569, 09:00 เธ.',
      type: 'IMPORT',
      typeBadge: 'เธเธณเน€เธเนเธฒเธเนเธญเธกเธนเธฅเน€เธ”เธทเธญเธ เธ.เธข.',
      badgeClass: 'badge-type-import',
      title: 'เธเธณเน€เธเนเธฒเนเธฅเธฐเธเธนเธเธเธฒเธเธเนเธญเธกเธนเธฅเธฃเธฒเธขเธเธฒเธ AUC เน€เธ”เธทเธญเธ 9 เธ.เธข. (3.3teco) เน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธเธ–เธฒเธงเธฃ',
      targetSubject: 'เธฃเธฒเธขเธเธฒเธ AUC เธเธฃเธฐเธเธณเน€เธ”เธทเธญเธ เธ.เธข. 2569 (window.AUC_DATA_SEP)',
      storageFile: 'js/data_sep.js, index.html, js/app.js & js/data_history.js',
      changeSummary: 'เนเธเธฅเธเนเธเธฅเน "01 เธฃเธฒเธขเธเธฒเธ AUC เน€เธ”เธทเธญเธ 9เธ.เธข.  (3.3teco).xlsx" เน€เธเนเธเธเธฒเธเธเนเธญเธกเธนเธฅ static JavaScript (js/data_sep.js) เธเธณเธเธงเธ 368 เนเธ–เธง เธเธนเธเธชเธเธฃเธดเธเธ•เนเนเธ index.html เนเธฅเธฐเน€เธเธดเธ”เธ•เธฑเธงเน€เธฅเธทเธญเธเน€เธ”เธทเธญเธ เธ.เธข. 2569 (เธฅเนเธฒเธชเธธเธ”) เนเธเธฃเธฐเธเธเธญเธขเนเธฒเธเธ–เธฒเธงเธฃ เนเธกเนเธชเธนเธเธซเธฒเธขเน€เธกเธทเนเธญเธฃเธตเน€เธเธฃเธเธซเธเนเธฒเน€เธงเนเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธฅเธทเธญเธเนเธเธงเธ—เธฒเธเธ—เธตเน 1 เธเธณเน€เธเนเธฒเธเนเธญเธกเธนเธฅเธ–เธฒเธงเธฃเนเธ”เธขเนเธกเนเธ•เนเธญเธเธ—เธณ Supabase): 1) เธชเธเธฑเธ”เนเธฅเธฐเนเธเธฅเธเธเนเธญเธกเธนเธฅเธเธฒเธเนเธเธฅเน 01 เธฃเธฒเธขเธเธฒเธ AUC เน€เธ”เธทเธญเธ 9เธ.เธข.  (3.3teco).xlsx เธเธฃเธเธ—เธธเธเธซเธกเธงเธ”เน€เธเธ“เธ‘เนเธงเธฑเธ” 8 เธซเธกเธงเธ” เธฃเธงเธก 368 เธฃเธฒเธขเธเธฒเธฃ เธเธฑเธเธ—เธถเธเน€เธเนเธ window.AUC_DATA_SEP เนเธ js/data_sep.js 2) เน€เธเธดเนเธกเนเธ—เนเธ script เนเธซเธฅเธ” js/data_sep.js เนเธ index.html 3) เธเธฅเธ”เธฅเนเธญเธเธ•เธฑเธงเน€เธฅเธทเธญเธเน€เธ”เธทเธญเธ เธ.เธข. 2569 เนเธ dropdown เนเธฅเธฐเธ•เธฑเนเธเน€เธเนเธเน€เธ”เธทเธญเธเธฅเนเธฒเธชเธธเธ” (Active Month) 4) เธญเธฑเธเน€เธ”เธ• app.js เนเธซเน hasReportForMonth เธฃเธญเธเธฃเธฑเธเน€เธ”เธทเธญเธ เธ.เธข. (Index 8) เนเธฅเธฐเธญเธฑเธเน€เธ”เธ• fallback data chain เนเธซเนเน€เธเนเธเธเนเธญเธกเธนเธฅเธเธฑเธเธเธธเธเธฑเธ 5) เธเธดเธเธเนเนเธเธฅเนเนเธเธขเธฑเธเนเธเธฅเน€เธ”เธญเธฃเน 00AI V2 เน€เธเธทเนเธญเธเธงเธฒเธกเธชเธญเธ”เธเธฅเนเธญเธ',
      sourceFile: '01 เธฃเธฒเธขเธเธฒเธ AUC เน€เธ”เธทเธญเธ 9เธ.เธข.  (3.3teco).xlsx',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธชเธนเธ'
    },
    {
      id: 'log_000_wbs_kpi_month_active_button_enhancement',
      timestamp: '2026-10-19 11:38:00',
      timestampTh: '19 เธ•.เธ. 2569, 11:38 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธเธธเนเธกเน€เธฅเธทเธญเธเน€เธ”เธทเธญเธเน€เธเนเธฒเธซเธกเธฒเธข',
      badgeClass: 'badge-type-edit',
      title: 'เธเธฃเธฑเธเนเธ•เนเธเธเธธเนเธกเน€เธฅเธทเธญเธเน€เธ”เธทเธญเธเน€เธเนเธฒเธซเธกเธฒเธข KPI เธ—เธตเนเธ–เธนเธเน€เธฅเธทเธญเธ (Active) เนเธซเนเธฅเธญเธขเน€เธ”เนเธ 3D เธเธญเธเธ—เธญเธเน€เธฃเธทเธญเธเนเธชเธเธเธฃเธฐเธเธฒเธขเธเธฒเธงเนเธฅเธฐเธชเธงเธขเธเธฒเธก',
      targetSubject: 'เนเธ–เธเธเธธเนเธกเน€เธฅเธทเธญเธเน€เธ”เธทเธญเธเน€เธเนเธฒเธซเธกเธฒเธข KPI เนเธเธเธฒเธฃเนเธ” WBS Comparison (.btn-wbs-kpi-month)',
      storageFile: 'css/styles.css, js/wbs.js & js/data_history.js',
      changeSummary: '1) เธขเธเธฃเธฐเธ”เธฑเธเธเธธเนเธกเน€เธ”เธทเธญเธเธ—เธตเนเน€เธฅเธทเธญเธเนเธซเนเธฅเธญเธขเน€เธ”เนเธเนเธเธ 3D (Elevation: translateY(-3.5px) scale(1.02)) 2) เน€เธเธดเนเธกเน€เธชเนเธเธเธญเธเธชเธตเธ—เธญเธเน€เธฃเธทเธญเธเนเธชเธเธเธฃเธฐเธเธฒเธขเธเธฒเธงเธเธญเธเธ—เธฃเธฒเธชเธ•เนเธชเธนเธ (White-Gold Halo Border 3.5px) เนเธกเนเธเธฅเธทเธเนเธเธเธฑเธเธเธทเนเธเธซเธฅเธฑเธเธชเธตเธชเนเธกเธเธญเธเน€เธ”เธทเธญเธ เธ.เธข. 3) เธเธฃเธฑเธเธเธธเนเธกเน€เธ”เธทเธญเธเธญเธทเนเธเธ—เธตเนเธขเธฑเธเนเธกเนเนเธ”เนเน€เธฅเธทเธญเธเนเธซเนเธเธญเธเธ•เนเธฅเธ (Opacity 0.68) เน€เธเธทเนเธญเธชเธฃเนเธฒเธเธเธธเธ”เนเธเธเธฑเธชเนเธซเนเธเธธเนเธกเธ—เธตเนเน€เธฅเธทเธญเธเน€เธ”เนเธเธเธฑเธ”เธ—เธฑเธเธ—เธต 4) เธเธฃเธฑเธเธเธฃเธธเธเธเนเธฒเธข "เธเธณเธฅเธฑเธเน€เธฅเธทเธญเธ" เน€เธเนเธเธชเธตเธเธฒเธงเธฅเธฑเธเธเธฑเธงเธฃเธตเธเธฃเนเธญเธกเนเธเธชเธฑเธเธเธฒเธ“เธชเธตเน€เธเธตเธขเธงเธกเธฃเธเธ•เน€เธฃเธทเธญเธเนเธชเธเธเธฐเธเธฃเธดเธเธชเธ”เนเธช',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธฅเธญเธเธเธฃเธฑเธเธเธธเนเธกเธ—เธตเนเน€เธฅเธทเธญเธ เนเธซเนเนเธ•เธเธ•เนเธฒเธเธเธถเนเธเธกเธฒ เธชเธงเธขเธเธฒเธก): 1) เนเธ css/styles.css เธเธฃเธฑเธเธชเนเธ•เธฅเน .btn-wbs-kpi-month.active เนเธซเนเธกเธต z-index: 30, transform: translateY(-3.5px) scale(1.02), padding: 3.5px เนเธฅเธฐเธเธฃเธญเธเธเธทเนเธเธซเธฅเธฑเธ linear-gradient(135deg, #FFFFFF 0%, #FFF59D 25%, #FFD700 50%, #FFFFFF 75%, #FFA000 100%) เธเธฃเนเธญเธกเน€เธเธฒ 3 เธเธฑเนเธ (drop-shadow เธชเธตเธเธฒเธงเธเธกเธเธฃเธดเธ + เธญเธญเธฃเนเธฒเธชเธตเธ—เธญเธเน€เธฃเธทเธญเธเนเธชเธ 16px + เน€เธเธฒเธฅเธถเธ 3D 16px) 2) เน€เธเธดเนเธกเธกเธดเธ•เธดเธเธดเธงเธเธฃเธฐเธเธเน€เธเธฒ (Specular Inset Reflection) เธ เธฒเธขเนเธ .btn-wbs-kpi-inner เนเธฅเธฐเธญเธฑเธเน€เธเธฃเธ”เธเธฒเธฃเนเธฅเนเน€เธเธ”เธชเธตเน€เธเธเธฒเธฐเธเธญเธเนเธ•เนเธฅเธฐเน€เธเธเน€เธกเธเธ•เนเน€เธกเธทเนเธญ active 3) เธฅเธ”เธเธงเธฒเธกเน€เธเนเธกเธเธญเธเธเธธเนเธกเธ—เธตเนเนเธกเนเนเธ”เนเน€เธฅเธทเธญเธ (:not(.active)) เน€เธซเธฅเธทเธญ opacity: 0.68 เนเธฅเธฐ saturate(0.85) เธเธฃเนเธญเธกเน€เธญเธเน€เธเธเธ•เน hover เธชเธงเนเธฒเธเธเธถเนเธเธญเธขเนเธฒเธเธเธธเนเธกเธเธงเธฅ 4) เธเธฑเธ’เธเธฒเธเธญเธกเนเธเน€เธเธเธ•เนเนเธเธชเธฑเธเธเธฒเธ“ .m-active-pulse-beacon เธชเธตเน€เธเธตเธขเธงเธกเธฃเธเธ•เธเธฐเธเธฃเธดเธเนเธเธเธกเธตเธเธฑเธเธซเธงเธฐ (1.6s ease-in-out) เธเนเธเธเธญเธเธชเธ–เธฒเธเธฐเธเธฒเธฃเน€เธฅเธทเธญเธเธเธฑเธเธเธธเธเธฑเธเธญเธขเนเธฒเธเธซเธฃเธนเธซเธฃเธฒ เธเธฑเธ”เน€เธเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธฅเธญเธเธเธฃเธฑเธเธเธธเนเธกเธ—เธตเนเน€เธฅเธทเธญเธ เนเธซเนเนเธ•เธเธ•เนเธฒเธเธเธถเนเธเธกเธฒ เธชเธงเธขเธเธฒเธก)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ'
    },
    {
      id: 'log_000_wbs_bar_chart_single_line_sap_label',
      timestamp: '2026-10-19 11:22:00',
      timestampTh: '19 เธ•.เธ. 2569, 11:22 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฑเธ”เธเนเธญเธเธงเธฒเธกเธเธฃเธฃเธ—เธฑเธ”เน€เธ”เธตเธขเธง',
      badgeClass: 'badge-type-edit',
      title: 'เธเธฃเธฑเธเธเธฒเธฃเนเธชเธ”เธเธฃเธซเธฑเธชเธชเธ–เธฒเธเธฐ SAP เนเธฅเธฐเธเธณเธเธงเธเธเธฒเธเนเธเธเธฃเธฒเธเนเธ—เนเธเนเธซเนเธญเธขเธนเนเนเธเธเธฃเธฃเธ—เธฑเธ”เน€เธ”เธตเธขเธงเธเธฑเธ (เน€เธเนเธ F4 : 4)',
      targetSubject: 'เธเธฒเธฃเนเธชเธ”เธเธเธฅเธเนเธญเธเธงเธฒเธกเนเธเธเธฃเธฒเธเนเธ—เนเธ WBS (#wbsOfficesBarChart)',
      storageFile: 'js/wbs.js & js/data_history.js',
      changeSummary: 'เธเธฃเธฑเธเธฃเธนเธเนเธเธเธเธฒเธฃเนเธชเธ”เธเธเนเธญเธเธงเธฒเธกเนเธเธ—เธธเธเน€เธเธเน€เธกเธเธ•เนเธเธญเธเธเธฃเธฒเธเนเธ—เนเธเนเธซเนเธญเธขเธนเนเนเธเธเธฃเธฃเธ—เธฑเธ”เน€เธ”เธตเธขเธงเธเธฑเธ เน€เธเนเธ "F4 : 4", "C1 : 35", "D1 : 6" เธเธฃเนเธญเธกเน€เธงเนเธเธงเธฃเธฃเธเธฃเธญเธเน€เธเธฃเธทเนเธญเธเธซเธกเธฒเธขเนเธเธฅเธญเธเธญเธขเนเธฒเธเธชเธงเธขเธเธฒเธก เนเธฅเธฐเธเธฃเธฑเธเธเธเธฒเธ”เธ•เธฑเธงเธญเธฑเธเธฉเธฃเนเธเธ Responsive เธญเธฑเธ•เนเธเธกเธฑเธ•เธด',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธเธฃเธฑเธเนเธเนเนเธซเนเธญเธขเธนเนเธเธฃเธฃเธ—เธฑเธ”เน€เธ”เธตเธขเธงเธเธฑเธ เน€เธเนเธ F4 : 4): เธเธฃเธฑเธเนเธเนเนเธ drawTopOfficesCanvas() เนเธซเนเธ—เธธเธเน€เธเธเน€เธกเธเธ•เนเนเธชเธ”เธเธเธฅเนเธเธเธเธฃเธฃเธ—เธฑเธ”เน€เธ”เธตเธขเธงเนเธเธฃเธนเธเนเธเธ "${suffix} : ${countStr}" เนเธ”เธขเนเธกเนเธ•เธฑเธ”เธเธถเนเธเธเธฃเธฃเธ—เธฑเธ”เนเธซเธกเน เธเธฃเนเธญเธกเธฃเธฐเธเธเธ•เธฃเธงเธเธงเธฑเธ”เธเธงเธฒเธกเธเธงเนเธฒเธเนเธเธเธขเธทเธ”เธซเธขเธธเนเธ (Responsive text measurement) เนเธฅเธฐเธเธฃเธฑเธเธเธเธฒเธ”เธเธญเธเธ•เนเนเธซเนเธเธญเธ”เธตเธเธฑเธเธเธงเธฒเธกเธเธงเนเธฒเธเธเธญเธเนเธ—เนเธเธเธฃเธฒเธเธญเธขเนเธฒเธเธชเธงเธขเธเธฒเธก เธชเธฐเธญเธฒเธ”เธ•เธฒ เนเธฅเธฐเธญเนเธฒเธเธเนเธฒเธข',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธเธฃเธฑเธเนเธเนเนเธซเนเธญเธขเธนเนเธเธฃเธฃเธ—เธฑเธ”เน€เธ”เธตเธขเธงเธเธฑเธ เน€เธเนเธ F4 : 4)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ'
    },
    {
      id: 'log_000_wbs_bar_chart_sap_suffix_and_proportions',
      timestamp: '2026-10-19 11:15:00',
      timestampTh: '19 เธ•.เธ. 2569, 11:15 เธ.',
      type: 'EDIT',
      typeBadge: 'เธฃเธซเธฑเธชเธชเธ–เธฒเธเธฐ SAP เธเธเธเธฃเธฒเธเนเธ—เนเธ',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธดเนเธกเธเธฒเธฃเนเธชเธ”เธเธฃเธซเธฑเธชเธชเธ–เธฒเธเธฐ SAP เธเธฃเธฐเนเธขเธเธ—เนเธฒเธข (F4, F2, C1 เธฏเธฅเธฏ) เนเธเธเธฃเธฒเธเนเธ—เนเธ เนเธฅเธฐเธเธฃเธฑเธเธชเธฑเธ”เธชเนเธงเธเนเธ—เนเธเนเธซเนเน€เธซเนเธเธเธฑเธ”เน€เธเธ เธชเธงเธขเธเธฒเธก',
      targetSubject: 'เธเธฃเธฒเธเนเธ—เนเธเธซเธเนเธงเธขเธเธฒเธเธ—เธตเนเธกเธตเธเธฒเธ WBS เธเธเน€เธซเธฅเธทเธญ (#wbsOfficesBarChart)',
      storageFile: 'js/wbs.js & js/data_history.js',
      changeSummary: '1) เน€เธเธดเนเธกเธเธฒเธฃเนเธชเธ”เธเธฃเธซเธฑเธชเธชเธ–เธฒเธเธฐ SAP เน€เธเธเธฒเธฐเธเธฃเธฐเนเธขเธเธ—เนเธฒเธข (เน€เธเนเธ F4, F2, C1, D1, D2, D3, B1) เนเธเธ—เธธเธเน€เธเธเน€เธกเธเธ•เนเธเธญเธเธเธฃเธฒเธเนเธ—เนเธ เธเธฃเนเธญเธกเธ•เธฑเธงเน€เธฅเธเธเธณเธเธงเธเธเธฒเธ 2) เธเธฃเธฑเธเธชเธฑเธ”เธชเนเธงเธเธเธงเธฒเธกเธชเธนเธเธเธญเธเนเธ•เนเธฅเธฐเน€เธเธเน€เธกเธเธ•เนเธ”เนเธงเธขเธญเธฑเธฅเธเธญเธฃเธดเธ—เธถเธก Water-filling เนเธซเนเธชเธฐเธ—เนเธญเธเธชเธฑเธ”เธชเนเธงเธเธเธฃเธดเธเธญเธขเนเธฒเธเนเธกเนเธเธขเธณเนเธฅเธฐเนเธกเนเธ–เธนเธเธเธตเธเธญเธฑเธ” 3) เน€เธเธดเนเธกเธเธงเธฒเธกเธเธงเนเธฒเธเนเธ—เนเธ (24-42px) เนเธฅเธฐเธเธงเธฒเธกเธชเธนเธเธเธฃเธฒเธ (~296px) เธฃเธญเธเธฃเธฑเธเธเธฒเธฃเนเธชเธ”เธเธเธฅ 2 เธเธฃเธฃเธ—เธฑเธ”เนเธเน€เธเธเน€เธกเธเธ•เนเธเธเธฒเธ”เนเธซเธเน',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธซเนเน€เธเธดเนเธก เธชเธ–เธฒเธเธฐ sap เน€เธเธเธฒเธฐเธเธฃเธฐเนเธขเธเธ—เนเธฒเธข เน€เธเนเธ F4 F2 C1 เน€เธเนเธเธ•เนเธ เนเธเธเธฃเธฒเธเนเธ—เนเธ เนเธฅเธฐเธ”เธนเธชเธฑเธ”เธชเนเธงเธเนเธซเนเน€เธซเนเธเธเธฑเธ” เธชเธงเธขเธเธฒเธ): 1) เธชเธฃเนเธฒเธเธเธฑเธเธเนเธเธฑเธ getSapSuffix(sap) เธชเธณเธซเธฃเธฑเธเธชเธเธฑเธ”เธฃเธซเธฑเธชเธเธฃเธฐเนเธขเธเธ—เนเธฒเธข 2 เธ•เธฑเธง เน€เธเนเธ "CLSD F4" -> "F4", "LLSU F2" / "REL F2" -> "F2", "REL C1" -> "C1", "TECO D2" -> "D2" 2) เธเธฑเธ’เธเธฒเธเธฑเธเธเนเธเธฑเธ allocateSegmentHeights() เธเธฑเธ”เธชเธฃเธฃเธเธงเธฒเธกเธชเธนเธเธเธญเธเน€เธเธเน€เธกเธเธ•เนเธชเธ–เธฒเธเธฐ SAP เธ”เนเธงเธขเธญเธฑเธฅเธเธญเธฃเธดเธ—เธถเธก Water-filling เน€เธเธทเนเธญเธฃเธฑเธเธฉเธฒเธชเธฑเธ”เธชเนเธงเธเนเธ—เนเธเธเธฃเธฒเธเธเธฃเธดเธ (Proportional Stacking) เนเธกเนเนเธซเนเน€เธเธเน€เธกเธเธ•เนเธ—เธตเนเธกเธตเธเธฒเธเธเธณเธเธงเธเธกเธฒเธเธ–เธนเธเธฅเธ”เธ—เธญเธเธเธงเธฒเธกเธชเธนเธ เธเธ“เธฐเน€เธ”เธตเธขเธงเธเธฑเธเธขเธฑเธเธฃเธฑเธเธเธฃเธฐเธเธฑเธเธเธงเธฒเธกเธชเธนเธเธเธฑเนเธเธ•เนเธณ (13.5px) เนเธซเนเน€เธเธเน€เธกเธเธ•เนเธเธเธฒเธ”เน€เธฅเนเธเนเธชเธ”เธเธเนเธญเธเธงเธฒเธกเนเธ”เนเธเธฃเธเธ–เนเธงเธ 3) เธเธฃเธฑเธเธเธฒเธฃเธเธฑเธ”เธงเธฒเธเธเนเธญเธเธงเธฒเธกเนเธเธ Responsive เนเธเนเธ•เนเธฅเธฐเน€เธเธเน€เธกเธเธ•เน: เธซเธฒเธเธกเธตเธเธงเธฒเธกเธชเธนเธ >= 26px เธเธฑเธ”เน€เธเนเธ 2 เธเธฃเธฃเธ—เธฑเธ” (เธเธฃเธฃเธ—เธฑเธ”เธเธเนเธชเธ”เธเธฃเธซเธฑเธชเธชเธ–เธฒเธเธฐ SAP เธเธฃเธฐเนเธขเธเธ—เนเธฒเธขเธเธเธฒเธ” 10px เธ•เธฑเธงเธซเธเธฒ, เธเธฃเธฃเธ—เธฑเธ”เธฅเนเธฒเธเนเธชเธ”เธเธเธณเธเธงเธเธเธฒเธเธเธเธฒเธ” 9.5px เธ•เธฑเธงเธซเธเธฒ) เธซเธฒเธเธเธงเธฒเธกเธชเธนเธเธเธฒเธเธเธฅเธฒเธเธเธฑเธ”เน€เธเนเธ 1 เธเธฃเธฃเธ—เธฑเธ” เน€เธเนเธ "F2: 3", "F4: 9", "C1: 5" เธเธฃเนเธญเธก Text Shadow เธเธญเธเธ—เธฃเธฒเธชเธ•เนเธชเธนเธเธ—เธฑเนเธเธเธตเธกเธกเธทเธ”เนเธฅเธฐเธชเธงเนเธฒเธ 4) เธเธฃเธฑเธเธเธงเธฒเธกเธเธงเนเธฒเธเนเธ—เนเธเธเธฃเธฒเธ (barW) เนเธซเนเธกเธตเธเธงเธฒเธกเธซเธเธฒเนเธเนเธเธชเธกเธชเนเธงเธ (24-42px) เนเธฅเธฐเธเธฃเธฑเธเธเธทเนเธเธ—เธตเนเธงเธฒเธ” (plotHBase: 196px, height0: 296px) เน€เธเธดเนเธกเธเธทเนเธเธ—เธตเนเนเธเธงเธ•เธฑเนเธเนเธซเนเธญเนเธฒเธเธเนเธฒเธข เธชเธเธฒเธขเธ•เธฒ เธเธกเธเธฑเธ”เธ—เธธเธเธชเธ–เธฒเธเธฐ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธซเนเน€เธเธดเนเธก เธชเธ–เธฒเธเธฐ sap เน€เธเธเธฒเธฐเธเธฃเธฐเนเธขเธเธ—เนเธฒเธข เน€เธเนเธ F4 F2 C1 เน€เธเนเธเธ•เนเธ เนเธเธเธฃเธฒเธเนเธ—เนเธ เนเธฅเธฐเธ”เธนเธชเธฑเธ”เธชเนเธงเธเนเธซเนเน€เธซเนเธเธเธฑเธ” เธชเธงเธขเธเธฒเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_wbs_update_file_04_zbudr064',
      timestamp: '2026-10-19 08:48:00',
      timestampTh: '19 เธ•.เธ. 2569, 08:48 เธ.',
      type: 'IMPORT',
      typeBadge: 'เธญเธฑเธเน€เธ”เธ•เนเธเธฅเน 04 WBS',
      badgeClass: 'badge-type-import',
      title: 'เธญเธฑเธเน€เธ”เธ•เธเนเธญเธกเธนเธฅเนเธเธฅเน 04 WBS ZBUDR064 (%เธเธฑเธชเธ”เธธ เธเนเธฒเนเธฃเธ เนเธฅเธฐเธชเธ–เธฒเธเธฐ SAP)',
      targetSubject: 'เธเธฒเธเธเนเธญเธกเธนเธฅ WBS เธเธเน€เธซเธฅเธทเธญ (js/data_wbs.js) เนเธฅเธฐเธเธฒเธฃเนเธชเธ”เธเธเธฅเธชเธ–เธฒเธเธฐ SAP',
      storageFile: 'js/data_wbs.js, js/wbs.js & js/data_history.js',
      changeSummary: 'เธญเธฑเธเน€เธ”เธ•เธเธฒเธเธเนเธญเธกเธนเธฅ WBS เธเธฒเธเนเธเธฅเน 04 ZBUDR064 เธเธเธฑเธเธฅเนเธฒเธชเธธเธ” (19 เธ•.เธ. 2569, 08:34 เธ.): เธเธฃเธฑเธเธเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP เธฃเธงเธก 382 เธฃเธฒเธขเธเธฒเธฃ (CLSD F4 เน€เธเธดเนเธกเธเธถเนเธ +200 เนเธเธฃเธเธเธฒเธฃ, CLSD F2 +14 เนเธเธฃเธเธเธฒเธฃ, TECO D2 เน€เธเธฅเธตเนเธขเธเน€เธเนเธ CLSD เธฅเธ”เธฅเธ -121 เนเธเธฃเธเธเธฒเธฃ, REL C1 -84 เนเธเธฃเธเธเธฒเธฃ) เธเธฃเนเธญเธกเธเธฃเธฑเธเธเธฃเธธเธเธขเธญเธ” Act เธเธงเธเธเธธเธกเนเธฅเธฐ % เน€เธเธดเธเธเธฑเธชเธ”เธธ 101 เธฃเธฒเธขเธเธฒเธฃ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธฃเธฑเธเธชเธเธฃเธดเธเธ•เนเธเธชเธฒเธเธเนเธญเธกเธนเธฅ WBS (merge_wbs_all.ps1) เธเธชเธฒเธเนเธเธฅเน 03 (เธเธฒเธเธเธเน€เธซเธฅเธทเธญ 2,968 เธฃเธฒเธขเธเธฒเธฃ), เนเธเธฅเน 04 (ZBUDR064 เธเธเธฑเธเนเธเนเนเธ 19 เธ•.เธ. 2569), เนเธเธฅเน 05 (CN41) เนเธฅเธฐเนเธเธฅเน 06 (Google Sheet): 1) เธเธฅเธเธฒเธฃเธเธฑเธเธเธนเน WBS เธชเธณเน€เธฃเนเธ 100% (2,968/2,968 เธฃเธฒเธขเธเธฒเธฃ) 2) เธกเธตเธเธฒเธฃเธเธฃเธฑเธเน€เธเธฅเธตเนเธขเธเธชเธ–เธฒเธเธฐ SAP เธฃเธงเธก 382 เธฃเธฒเธขเธเธฒเธฃ เนเธ”เธขเธชเธ–เธฒเธเธฐเธเธดเธ”เธเธฒเธเธชเธกเธเธนเธฃเธ“เน (CLSD) เน€เธเธดเนเธกเธเธถเนเธเธฃเธงเธก +215 เธฃเธฒเธขเธเธฒเธฃ 3) เธกเธตเธเธฒเธฃเน€เธเธฅเธตเนเธขเธเนเธเธฅเธเธขเธญเธ”เธเนเธฒเนเธเนเธเนเธฒเธขเธเธงเธเธเธธเธกเธเธฃเธดเธเนเธฅเธฐ % เธเธฒเธฃเน€เธเธดเธเธเธฑเธชเธ”เธธ 101 เธฃเธฒเธขเธเธฒเธฃ 4) เธเธฑเธเธ—เธถเธเธฅเธเนเธ js/data_wbs.js เธเธเธฒเธ” 3.31 MB เนเธฅเธฐเธญเธฑเธเน€เธ”เธ•เธเนเธฒเธขเน€เธงเธฅเธฒเนเธเธฅเน 04 เธ—เธตเนเธซเธฑเธงเธ•เธฒเธฃเธฒเธ WBS เน€เธเนเธ 19 เธ•.เธ. 2569, 08:34 เธ.',
      sourceFile: '04 WBS ZBUDR064 %เธเธฑเธชเธ”เธธเนเธฅเธฐเธเนเธฒเนเธฃเธเนเธฅเธฐเธชเธ–เธฒเธเธฐsap.xlsx (19 เธ•.เธ. 2569, 08:34:34)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธชเธนเธ (เธญเธฑเธเน€เธ”เธ•เธชเธ–เธฒเธเธฐเนเธเธฃเธเธเธฒเธฃเธเนเธญเธชเธฃเนเธฒเธเนเธฅเธฐเธกเธนเธฅเธเนเธฒเน€เธเธดเธเธเนเธฒเธขเธฅเนเธฒเธชเธธเธ”)'
    },
    {
      id: 'log_000_wbs_add_sap_eraser_btn_and_wbs_counts',
      timestamp: '2026-10-18 21:36:00',
      timestampTh: '18 เธ•.เธ. 2569, 21:36 เธ.',
      type: 'EDIT',
      typeBadge: 'เน€เธเธดเนเธกเธเธธเนเธกเธขเธฒเธเธฅเธ & เธเธณเธเธงเธ WBS',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธดเนเธกเธเธธเนเธกเธขเธฒเธเธฅเธเธฅเนเธฒเธเธ•เธฑเธงเธเธฃเธญเธเธชเธ–เธฒเธเธฐ SAP เธ—เธตเนเธซเธฑเธงเธ•เธฒเธฃเธฒเธ เนเธฅเธฐเนเธชเธ”เธเธเธณเธเธงเธเธเธฒเธ WBS เนเธเธ•เธฑเธงเน€เธฅเธทเธญเธเธชเธ–เธฒเธเธฐ SAP',
      targetSubject: 'เธซเธฑเธงเธเธญเธฅเธฑเธกเธเนเธชเธ–เธฒเธเธฐ SAP เนเธฅเธฐเธฃเธฒเธขเธเธฒเธฃเธ•เธฑเธงเธเธฃเธญเธเธ”เธฃเธญเธเธ”เธฒเธงเธเน (#wbsSapThDropdownList)',
      storageFile: 'js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: '1) เน€เธเธดเนเธกเธเธธเนเธกเธขเธฒเธเธฅเธ (#btnWbsSapThEraser) เธ•เธดเธ”เธเนเธฒเธเธเธธเนเธกเน€เธฅเธทเธญเธเธชเธ–เธฒเธเธฐ SAP เน€เธเธทเนเธญเนเธซเนเธเธนเนเนเธเนเธเธฅเธดเธเธฅเนเธฒเธเธ•เธฑเธงเธเธฃเธญเธเธเธฅเธฑเธเธชเธนเน "เธ—เธธเธเธชเธ–เธฒเธเธฐ" เนเธ”เนเธ—เธฑเธเธ—เธตเนเธเธเธฅเธดเธเน€เธ”เธตเธขเธง 2) เน€เธเธดเนเธกเธเธฒเธฃเนเธชเธ”เธเธเธฅเธเธณเธเธงเธเธเธฒเธ WBS เธเธณเธเธฑเธเธเนเธฒเธเนเธ•เนเธฅเธฐเธชเธ–เธฒเธเธฐ SAP เนเธเธ”เธฃเธญเธเธ”เธฒเธงเธเน เน€เธเนเธ "118 เธเธฒเธ", "11 เธเธฒเธ" เธเธฃเนเธญเธกเธชเธฃเธธเธเธเธณเธเธงเธเธเธฒเธเธฃเธงเธกเธ—เธตเนเธชเนเธงเธเธ—เนเธฒเธข',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: 1) เนเธ js/wbs.js เธเธฃเธฑเธเธเธฃเธธเธ renderWbsTableHead() เน€เธเธดเนเธกเธเธธเนเธกเนเธญเธเธญเธเธขเธฒเธเธฅเธ .btn-th-sap-eraser เธเธฃเนเธญเธกเธเธฑเธเธเนเธเธฑเธ clearWbsTableSapFilter() เธชเธณเธซเธฃเธฑเธเธฅเนเธฒเธ tableSapStatuses 2) เนเธ renderWbsSapThDropdownList() เธเธณเธเธงเธ“เธเธณเธเธงเธเธเธฒเธ WBS เนเธ sapMap เนเธฅเธฐเนเธชเธ”เธเธเธฅ <span class="sap-dropdown-item-count">${statInfo.count} เธเธฒเธ</span> 3) เนเธ css/styles.css เธ•เธเนเธ•เนเธเธเธธเนเธกเธขเธฒเธเธฅเธเนเธฅเธฐเธเธฃเธฑเธเธเธเธฒเธ” Panel เน€เธเนเธ 205px เธเธฃเนเธญเธกเธเธฑเธ”เธงเธฒเธเธชเธ–เธฒเธเธฐเนเธฅเธฐเธเธณเธเธงเธเธเธฒเธเธญเธขเนเธฒเธเธฅเธเธ•เธฑเธง',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธเธดเนเธกเธเธธเนเธกเธขเธฒเธเธฅเธ เน€เธเธทเนเธญเน€เธเธฅเธตเธขเธฃเนเธ•เธฑเธงเธเธฃเธญเธ / เน€เธเธดเนเธก เธเธณเธเธงเธ WBS เนเธเธ•เธฑเธงเธเธฃเธญเธ เธชเธ–เธฒเธเธฐsap)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_wbs_force_sap_dropdown_below_button_only',
      timestamp: '2026-10-18 21:32:00',
      timestampTh: '18 เธ•.เธ. 2569, 21:32 เธ.',
      type: 'EDIT',
      typeBadge: 'เธ•เธณเนเธซเธเนเธเธ•เธฑเธงเธเธฃเธญเธเธชเธ–เธฒเธเธฐ SAP',
      badgeClass: 'badge-type-edit',
      title: 'เธเธฃเธฑเธเธ•เธณเนเธซเธเนเธเธ”เธฃเธญเธเธ”เธฒเธงเธเนเธชเธ–เธฒเธเธฐ SAP เนเธซเนเธญเธขเธนเนเธ”เนเธฒเธเธฅเนเธฒเธเธเธธเนเธกเน€เธชเธกเธญ เนเธกเนเธเธฅเธดเธเนเธเน€เธเธดเธ”เธ”เนเธฒเธเธเธ',
      targetSubject: 'เธเธฒเธฃเนเธชเธ”เธเธเธฅเนเธฅเธฐเธเธณเธเธงเธ“เธ•เธณเนเธซเธเนเธเธเนเธญเธเธญเธฑเธเธ•เธฑเธงเธเธฃเธญเธเธชเธ–เธฒเธเธฐ SAP (#wbsSapThDropdownPanel)',
      storageFile: 'js/wbs.js & js/data_history.js',
      changeSummary: 'เธขเธเน€เธฅเธดเธเธเธฒเธฃเธเธฅเธดเธเธเนเธญเธเธญเธฑเธเธ•เธฑเธงเธเธฃเธญเธเธชเธ–เธฒเธเธฐ SAP เธเธถเนเธเนเธเน€เธเธดเธ”เธ”เนเธฒเธเธเธเธเธธเนเธก เนเธ”เธขเธเธณเธซเธเธ”เนเธซเนเธญเธขเธนเนเธเธดเธ”เธ•เธดเธ”เธ”เนเธฒเธเธฅเนเธฒเธเธเธธเนเธกเธ•เธฑเธงเธเธฃเธญเธเน€เธชเธกเธญ (top = rect.bottom + 4px) เธเธฃเนเธญเธกเธเธฃเธฑเธเธเธเธฒเธ”เธเธงเธฒเธกเธชเธนเธเธฃเธฒเธขเธเธฒเธฃเนเธซเนเธเธญเธ”เธตเธเธฑเธเธเธญเธ เธฒเธเธญเธฑเธ•เนเธเธกเธฑเธ•เธด',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธซเนเธ•เธฑเธงเธเธฃเธญเธ เธญเธขเธนเนเธ”เนเธฒเธเธฅเนเธฒเธเธญเธขเนเธฒเธเน€เธ”เธตเธขเธง เนเธกเนเนเธซเนเนเธเธเนเธฒเธเธเธเนเธเธเนเธเธฃเธธเธ): เธเธฃเธฑเธเธเธฃเธธเธเธเธฑเธเธเนเธเธฑเธ repositionWbsSapDropdown() เนเธ js/wbs.js เนเธ”เธขเธเธณเน€เธเธทเนเธญเธเนเธเธเธฅเธดเธเธเธฅเธฑเธเธเธถเนเธเธ”เนเธฒเธเธเธ (top = rect.top - panelHeight) เธญเธญเธ เนเธฅเธฐเธเธณเธซเธเธ”เนเธซเนเนเธชเธ”เธเธญเธขเธนเนเธ”เนเธฒเธเธฅเนเธฒเธเธเธธเนเธก [เน€เธฅเธทเธญเธ ... เธชเธ–เธฒเธเธฐ] เธ•เธฅเธญเธ”เน€เธงเธฅเธฒ เธเธฃเนเธญเธกเธเธฃเธฑเธ max-height เธเธญเธ #wbsSapThDropdownList เนเธซเนเธเธญเธ”เธตเธเธฑเธเธเธงเธฒเธกเธชเธนเธเธเธญเธ เธฒเธเธ—เธตเนเน€เธซเธฅเธทเธญเธญเธขเธนเนเธ”เนเธฒเธเธฅเนเธฒเธเธญเธขเนเธฒเธเนเธกเนเธเธขเธณ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธซเนเธ•เธฑเธงเธเธฃเธญเธ เธญเธขเธนเนเธ”เนเธฒเธเธฅเนเธฒเธเธญเธขเนเธฒเธเน€เธ”เธตเธขเธง เนเธกเนเนเธซเนเนเธเธเนเธฒเธเธเธเนเธเธเนเธเธฃเธธเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_wbs_remove_checkbox_from_sap_dropdown_items',
      timestamp: '2026-10-18 21:29:00',
      timestampTh: '18 เธ•.เธ. 2569, 21:29 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธณ Checkbox เธ”เธฃเธญเธเธ”เธฒเธงเธเนเธญเธญเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธณเธเนเธญเธ Checkbox เธญเธญเธเธเธฒเธเธฃเธฒเธขเธเธฒเธฃเธ•เธฑเธงเธเธฃเธญเธเธชเธ–เธฒเธเธฐ SAP เธเธเน€เธซเธฅเธทเธญเน€เธเธเธฒเธฐเธเนเธฒเธขเธชเธ–เธฒเธเธฐเนเธเธเน€เธฅเธทเธญเธ/เธเธฅเธ”เธญเธดเธชเธฃเธฐ',
      targetSubject: 'เธฃเธฒเธขเธเธฒเธฃเธ•เธฑเธงเน€เธฅเธทเธญเธเนเธเธ”เธฃเธญเธเธ”เธฒเธงเธเนเธชเธ–เธฒเธเธฐ SAP (#wbsSapThDropdownList)',
      storageFile: 'js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: 'เธเธณเธเนเธญเธเธชเธตเนเน€เธซเธฅเธตเนเธขเธก Checkbox เธ”เนเธฒเธเธซเธเนเธฒเธชเธ–เธฒเธเธฐ SAP เธญเธญเธเธ•เธฒเธกเธ—เธตเนเธเธนเนเนเธเนเธเธฒเธเธเธตเธ”เธเธฒเธเธเธฒเธ—เธชเธตเน€เธซเธฅเธทเธญเธเธฃเธฐเธเธธ เธเธเน€เธซเธฅเธทเธญเน€เธเธเธฒเธฐเธเนเธฒเธขเธชเธ–เธฒเธเธฐ SAP เธ•เธฃเธเธเธฅเธฒเธเนเธ–เธง เนเธ”เธขเธเธฅเธดเธเธ—เธตเนเธ•เธฑเธงเธเนเธฒเธขเธชเธ–เธฒเธเธฐเน€เธเธทเนเธญเน€เธฅเธทเธญเธเธซเธฃเธทเธญเธเธฅเธ”เธเธฒเธฃเธเธฃเธญเธเนเธ”เนเธ—เธฑเธเธ—เธต',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: 1) เนเธ js/wbs.js เธเธฑเธเธเนเธเธฑเธ renderWbsSapThDropdownList() เธเธณเนเธ—เนเธ <input type="checkbox"> เธญเธญเธเธเธฒเธ itemsHtml เธเธเน€เธซเธฅเธทเธญเน€เธเธเธฒเธฐเธเนเธฒเธข <span class="badge-sap-short"> 2) เนเธ css/styles.css เธเธฃเธฑเธเนเธ•เนเธ .sap-dropdown-item เนเธซเนเธเธฑเธ”เธเนเธฒเธขเธชเธ–เธฒเธเธฐเนเธงเนเธเธถเนเธเธเธฅเธฒเธเธเธญเธ”เธต (justify-content: center) เนเธฅเธฐเธ•เธเนเธ•เนเธเธชเธ–เธฒเธเธฐเธ—เธตเนเธ–เธนเธเน€เธฅเธทเธญเธ (.is-selected) เธ”เนเธงเธขเธเธฃเธญเธเนเธชเธเธชเธตเธเนเธฒ (#38BDF8) เธชเธงเธขเธเธฒเธกเธเธฑเธ”เน€เธเธ 3) เธเธฃเธฑเธเธเธงเธฒเธกเธเธงเนเธฒเธเธเธญเธ Panel เน€เธเนเธ 180px เธเธญเธ”เธตเธเธฑเธเน€เธเธทเนเธญเธซเธฒ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธเธฒเธเธฒเธเธฒเธ— เน€เธญเธฒ checkbox เธญเธญเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_wbs_fix_sap_dropdown_position_and_remove_buttons',
      timestamp: '2026-10-18 21:24:00',
      timestampTh: '18 เธ•.เธ. 2569, 21:24 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธเธฃเธธเธเธ”เธฃเธญเธเธ”เธฒเธงเธเนเธชเธ–เธฒเธเธฐ SAP',
      badgeClass: 'badge-type-edit',
      title: 'เธเธณเธเธธเนเธกเธเธฒเธเธเธฒเธ— (โ•), เธเนเธญเธเธงเธฒเธกเธชเธฃเธธเธเธซเธฑเธงเธเนเธญ เนเธฅเธฐเธเธธเนเธกเธ•เธเธฅเธเธญเธญเธ เธเธฃเนเธญเธกเนเธเนเนเธเธ•เธณเนเธซเธเนเธเธ”เธฃเธญเธเธ”เธฒเธงเธเนเนเธซเนเธเธดเธ”เธ•เธดเธ”เนเธ•เนเธเธธเนเธกเธ•เธฑเธงเธเธฃเธญเธเน€เธชเธกเธญ',
      targetSubject: 'เธเนเธญเธเธญเธฑเธเธ•เธฑเธงเธเธฃเธญเธเธชเธ–เธฒเธเธฐ SAP (#wbsSapThDropdownPanel) เนเธฅเธฐเธเธธเนเธกเธซเธฑเธงเธ•เธฒเธฃเธฒเธ (#btnWbsSapThDropdown)',
      storageFile: 'index.html, js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: '1) เธเธณเธเธธเนเธกเธเธฒเธเธเธฒเธ— (โ•) เนเธฅเธฐเธเธธเนเธก "เธ•เธเธฅเธ" เธฃเธงเธกเธ–เธถเธเธเนเธญเธเธงเธฒเธกเธชเธฃเธธเธเนเธเนเธ–เธเธซเธฑเธงเธเนเธญเธญเธญเธ เน€เธเธทเนเธญเธเธงเธฒเธกเน€เธฃเธตเธขเธเธเนเธฒเธขเนเธฅเธฐเธเธฅเธตเธ 2) เนเธเนเนเธเธ•เธณเนเธซเธเนเธเธเนเธญเธเธญเธฑเธเธ•เธฑเธงเธเธฃเธญเธเธ—เธตเนเธฅเธญเธขเธซเธฅเธธเธ”เนเธเธญเธขเธนเนเธเนเธฒเธเธฅเนเธฒเธ เนเธซเนเธเธฅเธฑเธเธกเธฒเนเธชเธ”เธเธเธดเธ”เธ•เธดเธ”เนเธ•เนเธเธธเนเธกเธ•เธฑเธงเธเธฃเธญเธเธซเธฑเธงเธ•เธฒเธฃเธฒเธเธญเธขเนเธฒเธเนเธกเนเธเธขเธณเธ—เธธเธเธเธฒเธฃเน€เธฅเธทเนเธญเธเนเธฅเธฐเธเธฒเธฃเธเธฅเธดเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: 1) เนเธ index.html เนเธฅเธฐ css/styles.css เธเธณ .btn-close-sap-dropdown (โ•) เนเธฅเธฐ .btn-sap-done (เธ•เธเธฅเธ) เธฃเธงเธกเธ–เธถเธ .sap-dropdown-count-badge เธญเธญเธเธเธฒเธ #wbsSapThDropdownPanel 2) เนเธ js/wbs.js เน€เธเธดเนเธกเธเธฑเธเธเนเธเธฑเธ repositionWbsSapDropdown() เนเธ”เธขเธขเนเธฒเธข panel เนเธเนเธงเนเธ—เธตเน document.body เน€เธเธทเนเธญเธเนเธญเธเธเธฑเธเนเธกเนเนเธซเนเธชเนเธ•เธฅเน transform/filter เธเธญเธเธ•เธฒเธฃเธฒเธเธเธฃเธฐเธ—เธเธเธฒเธฃเธเธณเธเธงเธ“เธเธดเธเธฑเธ” เนเธฅเธฐเธขเธถเธ”เธ•เธณเนเธซเธเนเธเนเธซเนเธญเธขเธนเนเนเธ•เนเธเธธเนเธก #btnWbsSapThDropdown เธเธญเธ”เธต (rect.bottom + 4px) เธเธฃเนเธญเธกเธ”เธฑเธเธเธฑเธ scroll/resize เนเธซเนเน€เธเธฒเธฐเธ•เธดเธ”เธ•เธฅเธญเธ”เน€เธงเธฅเธฒ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (1.เน€เธญเธฒ เธเธฒเธเธเธฒเธ—เธญเธญเธ 2.เนเธเนเนเธเธ•เธฑเธงเธเธฃเธญเธ เธฅเธญเธขเธญเธญเธเธเธธเนเธกเธ•เธฑเธงเธซเธฃเธญเธ เธกเธฒเธเนเธฒเธเธฅเนเธฒเธเน€เธฅเธข / เน€เธญเธฒเธเธธเนเธก เธ•เธเธฅเธ เธญเธญเธเธ”เนเธงเธข)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_wbs_refine_sap_dropdown_clean_and_table_only_filter',
      timestamp: '2026-10-18 21:16:00',
      timestampTh: '18 เธ•.เธ. 2569, 21:16 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธเธฃเธธเธเธ•เธฑเธงเธเธฃเธญเธเธชเธ–เธฒเธเธฐ SAP',
      badgeClass: 'badge-type-edit',
      title: 'เธเธฃเธฑเธเนเธ•เนเธเธ”เธฃเธญเธเธ”เธฒเธงเธเนเธชเธ–เธฒเธเธฐ SAP เธเธเน€เธซเธฅเธทเธญเน€เธเธเธฒเธฐ Checkbox เนเธฅเธฐเธเนเธฒเธขเธชเธ–เธฒเธเธฐ เธเธฃเนเธญเธกเธเธณเธเธฑเธ”เธเธฒเธฃเธเธฃเธญเธเน€เธเธเธฒเธฐเนเธเธ•เธฒเธฃเธฒเธ WBS เน€เธ—เนเธฒเธเธฑเนเธ',
      targetSubject: 'เธเนเธญเธเธญเธฑเธเธ”เธฃเธญเธเธ”เธฒเธงเธเนเธซเธฑเธงเธ•เธฒเธฃเธฒเธเธชเธ–เธฒเธเธฐ SAP (#wbsSapThDropdownPanel) เนเธฅเธฐเธเธฒเธฃเธเธฃเธญเธเธ•เธฒเธฃเธฒเธ WBS',
      storageFile: 'index.html, js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: '1) เธเธณเธเธธเนเธก "เน€เธฅเธทเธญเธเธ—เธฑเนเธเธซเธกเธ”" เนเธฅเธฐ "เธฅเนเธฒเธเธเนเธฒ (เธ—เธธเธเธชเธ–เธฒเธเธฐ)" เธฃเธงเธกเธ–เธถเธเธเธณเธเธงเธเธเธฒเธเนเธฅเธฐเธกเธนเธฅเธเนเธฒเน€เธเธดเธเธญเธญเธเธเธฒเธเนเธ•เนเธฅเธฐเธฃเธฒเธขเธเธฒเธฃเธ•เธฒเธกเธ—เธตเนเธเธนเนเนเธเนเธเธฒเธเธเธฒเธ—เธญเธญเธ เธเธเน€เธซเธฅเธทเธญเน€เธเธเธฒเธฐ Checkbox เนเธฅเธฐเธเนเธฒเธขเธชเธ–เธฒเธเธฐ SAP เนเธเธเน€เธฃเธตเธขเธเธเนเธฒเธข 2) เธเธฃเธฑเธเธเธฃเธธเธเนเธซเนเธเธฒเธฃเน€เธฅเธทเธญเธเธชเธ–เธฒเธเธฐ SAP เธเธฒเธเธ”เธฃเธญเธเธ”เธฒเธงเธเนเธซเธฑเธงเธ•เธฒเธฃเธฒเธเธเธฃเธญเธเน€เธเธเธฒเธฐเนเธ–เธงเนเธเธ•เธฒเธฃเธฒเธ WBS เน€เธ—เนเธฒเธเธฑเนเธ เนเธ”เธขเนเธกเนเธเธฃเธฐเธ—เธเธเธฃเธฒเธเนเธ—เนเธเนเธฅเธฐเธเธฒเธฃเนเธ”เน€เธเนเธฒเธซเธกเธฒเธข KPI เธ”เนเธฒเธเธเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: 1) เนเธ index.html เธฅเธ .sap-dropdown-actions เธญเธญเธเธเธฒเธ #wbsSapThDropdownPanel 2) เนเธ js/wbs.js เนเธขเธ state เธ•เธฑเธงเธเธฃเธญเธเน€เธเนเธ wbsState.tableSapStatuses เธชเธณเธซเธฃเธฑเธเธเธฒเธฃเธเธฃเธญเธเน€เธเธเธฒเธฐเธ•เธฒเธฃเธฒเธ WBS เนเธกเนเนเธซเนเธเธฃเธฐเธ—เธ filtered data เธเธญเธเธชเนเธงเธเธเธ (เธเธฃเธฒเธเนเธ—เนเธ, KPI Cards, Target Comparison Section) 3) เนเธ renderWbsSapThDropdownList เธเธฃเธฑเธ HTML เนเธ•เนเธฅเธฐเนเธ–เธงเนเธซเนเน€เธซเธฅเธทเธญเน€เธเธตเธขเธ Checkbox เนเธฅเธฐ Badge เธชเธ–เธฒเธเธฐ SAP เนเธ”เธขเธเธณเธเธณเธเธงเธเธเธฒเธเนเธฅเธฐเธเธณเธเธงเธเน€เธเธดเธเธญเธญเธ 4) เนเธ css/styles.css เธเธฃเธฑเธเธเธเธฒเธ” panel เนเธซเนเธเธฐเธ—เธฑเธ”เธฃเธฑเธ”เธเธญเธ”เธต (width: 210px)',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธเธฒเธเธเธฒเธ—เน€เธญเธฒเธญเธญเธ เธเธเน€เธซเธฅเธทเธญเธชเธ–เธฒเธเธฐ sap เธญเธขเนเธฒเธเน€เธ”เธตเธขเธง เนเธฅเธฐเน€เธฅเธทเธญเธเนเธฅเนเธงเนเธซเนเธเธฃเธญเธเน€เธเธเธฒเธฐเธซเธเนเธฒเธเธฑเนเธ เน€เธ—เนเธฒเธเธฑเนเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ'
    },
    {
      id: 'log_000_wbs_add_th_sap_multi_dropdown_and_remove_kpi_clear_btn',
      timestamp: '2026-10-18 21:04:00',
      timestampTh: '18 เธ•.เธ. 2569, 21:04 เธ.',
      type: 'EDIT',
      typeBadge: 'เธ”เธฃเธญเธเธ”เธฒเธงเธเนเธชเธ–เธฒเธเธฐ SAP & เธฅเธเธเธธเนเธก',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธดเนเธกเธ•เธฑเธงเธเธฃเธญเธ Dropdown list เธชเธ–เธฒเธเธฐ SAP เน€เธฅเธทเธญเธเนเธ”เนเธซเธฅเธฒเธขเธชเธ–เธฒเธเธฐเนเธเธซเธฑเธงเธ•เธฒเธฃเธฒเธ เธเธฃเนเธญเธกเธเธณเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเนเธเธเธฒเธฃเนเธ”เน€เธเนเธฒเธซเธกเธฒเธขเธญเธญเธ',
      targetSubject: 'เธเธญเธฅเธฑเธกเธเนเธชเธ–เธฒเธเธฐ SAP เนเธเธซเธฑเธงเธ•เธฒเธฃเธฒเธ WBS เนเธฅเธฐเธเธฒเธฃเนเธ”เน€เธเนเธฒเธซเธกเธฒเธข KPI (#wbsTargetComparisonSection)',
      storageFile: 'index.html, js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: '1) เน€เธเธดเนเธกเธ•เธฑเธงเธเธฃเธญเธ Dropdown list เนเธ•เนเธซเธฑเธงเธเธญเธฅเธฑเธกเธเน "เธชเธ–เธฒเธเธฐ SAP" เนเธซเนเธชเธฒเธกเธฒเธฃเธ–เน€เธฅเธทเธญเธเธ•เธดเนเธเธเธฃเนเธญเธกเธเธฑเธเนเธ”เนเธซเธฅเธฒเธขเธชเธ–เธฒเธเธฐเธญเธขเนเธฒเธเธญเธดเธชเธฃเธฐ เธเธฃเนเธญเธกเธเธธเนเธกเน€เธฅเธทเธญเธเธ—เธฑเนเธเธซเธกเธ”เนเธฅเธฐเธฅเนเธฒเธเธเนเธฒ 2) เธเธณเธเธธเนเธกเธชเธตเนเธ”เธ "เธฅเนเธฒเธเธเนเธญเธกเธนเธฅ" เธญเธญเธเธเธฒเธเธเธฒเธฃเนเธ”เน€เธเนเธฒเธซเธกเธฒเธข KPI เธฃเธฐเธ”เธฑเธ 5 เธ•เธฒเธกเธ—เธตเนเธเธนเนเนเธเนเธเธฒเธเธงเธเธเธฅเธกเธฃเธฐเธเธธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ 2 เธชเนเธงเธ: 1) เนเธ js/wbs.js เธเธฃเธฑเธเธเธฃเธธเธ renderWbsTableHead เน€เธเธดเนเธกเธเธธเนเธก Dropdown #btnWbsSapThDropdown เนเธเธเธญเธฅเธฑเธกเธเน statusSap เนเธชเธ”เธเธเนเธฒเธขเธชเธ–เธฒเธเธฐเธ—เธตเนเน€เธฅเธทเธญเธ เนเธฅเธฐเนเธ index.html เน€เธเธดเนเธก #wbsSapThDropdownPanel เธเธฃเนเธญเธกเธเธฑเธเธเนเธเธฑเธ renderWbsSapThDropdownList, toggleWbsSapDropdownStatus, selectAllWbsSapDropdownStatuses เธฃเธญเธเธฃเธฑเธเธเธฒเธฃเน€เธฅเธทเธญเธเธเธฃเนเธญเธกเธเธฑเธเธซเธฅเธฒเธขเธชเธ–เธฒเธเธฐ 2) เนเธ js/wbs.js เธเธณเธเธธเนเธก .btn-wbs-card-clear (เธฅเนเธฒเธเธเนเธญเธกเธนเธฅ) เธญเธญเธเธเธฒเธ .wbs-kpi-comp-meta-info เนเธเธเธฒเธฃเนเธ”เน€เธเนเธฒเธซเธกเธฒเธข KPI 3) เน€เธเธดเนเธก CSS เธ•เธเนเธ•เนเธ Dropdown Panel เนเธฅเธฐเธเธธเนเธกเธซเธฑเธงเธ•เธฒเธฃเธฒเธเนเธซเนเธชเธงเธขเธเธฒเธกเธ—เธฑเนเธ Dark เนเธฅเธฐ Light Theme',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธเธดเนเธกเธ•เธฑเธงเธเธฃเธญเธ Dropdown list เธชเธ–เธฒเธเธฐsap เนเธฅเธฐเธชเธฒเธกเธฒเธฃเธ–เน€เธฅเธทเธญเธเธเธฃเนเธญเธกเธเธฑเธเนเธ”เนเธซเธฅเธฒเธขเธชเธ–เธฒเธเธฐsap / เธงเธเธเธฅเธกเน€เธญเธฒเธญเธญเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เน€เธเธดเนเธกเธ•เธฑเธงเธเธฃเธญเธเธซเธฅเธฒเธขเธชเธ–เธฒเธเธฐ SAP เนเธเธซเธฑเธงเธ•เธฒเธฃเธฒเธ WBS เนเธฅเธฐเธฅเธเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธเนเธณเธเนเธญเธเธญเธญเธ)'
    },
    {
      id: 'log_000_wbs_remove_engineer_circle_avatar_icon',
      timestamp: '2026-10-18 20:47:00',
      timestampTh: '18 เธ•.เธ. 2569, 20:47 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธณเนเธญเธเธญเธเธงเธเธเธฅเธกเธเนเธฒเธเธเธธเธกเธเธฒเธเธญเธญเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธณเนเธญเธเธญเธเธงเธเธเธฅเธกเธ•เธฑเธงเธญเธฑเธเธฉเธฃเธขเนเธญเธซเธเนเธฒเธเธทเนเธญเธเนเธฒเธเธเธธเธกเธเธฒเธเธญเธญเธเธเธฒเธเธ•เธฒเธฃเธฒเธ WBS',
      targetSubject: 'เธเธญเธฅเธฑเธกเธเนเธเนเธฒเธเธเธธเธกเธเธฒเธ เนเธเธ•เธฒเธฃเธฒเธเธฃเธฒเธขเธเธฒเธ WBS (#wbsMasterDataTable)',
      storageFile: 'js/wbs.js & js/data_history.js',
      changeSummary: 'เธเธณเนเธญเธเธญเธเธงเธเธเธฅเธกเธชเธตเธเนเธฒเธเธฃเนเธญเธกเธญเธฑเธเธฉเธฃเธขเนเธญ (.wbs-engineer-icon) เธ—เธตเนเธญเธขเธนเนเธซเธเนเธฒเธเธทเนเธญเธเนเธฒเธเธเธธเธกเธเธฒเธเธญเธญเธเธ•เธฒเธกเธ—เธตเนเธเธนเนเนเธเนเธเธฒเธเธงเธเธเธฅเธกเธฃเธฐเธเธธ เนเธ”เธขเธเธเน€เธซเธฅเธทเธญเธเธฒเธฃเนเธชเธ”เธเธเธฅเธเธทเนเธญเธเนเธฒเธเธเธธเธกเธเธฒเธเธเธฑเธ”เน€เธเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธงเธเธเธฅเธก เน€เธญเธฒเธญเธญเธ - เธ เธฒเธเธเธตเนเนเธญเธเธญเธเธงเธเธเธฅเธกเธชเธตเธเนเธฒเธซเธเนเธฒเธเธทเนเธญเธเนเธฒเธเธเธธเธกเธเธฒเธ): เธเธฃเธฑเธเธเธฃเธธเธเนเธเนเธเธฅเน js/wbs.js เธเธฑเธเธเนเธเธฑเธเน€เธฃเธเน€เธ”เธญเธฃเนเธ•เธฒเธฃเธฒเธ WBS เนเธ”เธขเธเธณ <span class="wbs-engineer-icon"> เธญเธญเธเธเธฒเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเน€เธเธฅเธฅเนเธเธญเธฅเธฑเธกเธเน engineer เธเธเน€เธซเธฅเธทเธญเน€เธเธเธฒเธฐเธเธทเนเธญเธเนเธฒเธเธเธธเธกเธเธฒเธเนเธเธเธเธฅเธตเธ เธชเธเธฒเธขเธ•เธฒ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธงเธเธเธฅเธก เน€เธญเธฒเธญเธญเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเธเธญเธฅเธฑเธกเธเนเธเนเธฒเธเธเธธเธกเธเธฒเธเนเธซเนเธเธฃเธฐเธเธฑเธเนเธฅเธฐเธ•เธฃเธเธ•เธฒเธกเธเธงเธฒเธกเธ•เนเธญเธเธเธฒเธฃ)'
    },
    {
      id: 'log_000_wbs_remove_plan_close_and_reset_subfilters_btn',
      timestamp: '2026-10-18 20:45:00',
      timestampTh: '18 เธ•.เธ. 2569, 20:45 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธณเนเธเธเธเธดเธ”เธเธฒเธ & เธเธธเนเธกเธฅเนเธฒเธเธญเธญเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธณเธ•เธฑเธงเธเธฃเธญเธเนเธเธเธเธดเธ”เธเธฒเธเนเธฅเธฐเธเธธเนเธกเธฅเนเธฒเธเธ•เธฑเธงเธเธฃเธญเธเนเธเธ•เธฒเธฃเธฒเธเธญเธญเธเธเธฒเธเธซเธฑเธงเธ•เธฒเธฃเธฒเธ WBS',
      targetSubject: 'เนเธ–เธเน€เธเธฃเธทเนเธญเธเธกเธทเธญเน€เธซเธเธทเธญเธ•เธฒเธฃเธฒเธเธฃเธฒเธขเธเธฒเธ WBS (.table-header-bar)',
      storageFile: 'index.html & js/data_history.js',
      changeSummary: 'เธเธณเธ•เธฑเธงเน€เธฅเธทเธญเธเนเธเธเธเธดเธ”เธเธฒเธ (#wbsPlanCloseFilterSelect) เนเธฅเธฐเธเธธเนเธก "เธฅเนเธฒเธเธ•เธฑเธงเธเธฃเธญเธเนเธเธ•เธฒเธฃเธฒเธ" (#btnResetWbsSubFilters) เธญเธญเธเธเธฒเธเนเธ–เธเน€เธซเธเธทเธญเธ•เธฒเธฃเธฒเธ WBS เธ•เธฒเธกเธ เธฒเธเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธญเธฒเธญเธญเธ - เธ เธฒเธเนเธชเธ”เธเนเธเธเธเธดเธ”เธเธฒเธเนเธฅเธฐเธเธธเนเธกเธฅเนเธฒเธเธ•เธฑเธงเธเธฃเธญเธเนเธเธ•เธฒเธฃเธฒเธ): เธฅเธเธญเธเธเนเธเธฃเธฐเธเธญเธเธ•เธฑเธงเธเธฃเธญเธเนเธเธเธเธดเธ”เธเธฒเธเนเธฅเธฐเธเธธเนเธกเธฃเธตเน€เธเนเธ•เธ•เธฑเธงเธเธฃเธญเธเนเธเธ•เธฒเธฃเธฒเธเธญเธญเธเธเธฒเธ index.html เนเธเธชเนเธงเธ .table-header-bar เนเธ”เธขเธเธเน€เธซเธฅเธทเธญเธเนเธฒเธขเน€เธเธ“เธ‘เนเธงเธฑเธ” (๐“ เน€เธเธ“เธ‘เนเธงเธฑเธ”) เธ”เนเธฒเธเธเนเธฒเธข เนเธฅเธฐเธเธธเนเธกเน€เธฅเธทเธญเธเธเธญเธฅเธฑเธกเธเน/เธเนเธญเธกเธนเธฅเนเธเนเธเธซเธเนเธฒเธ”เนเธฒเธเธเธงเธฒเนเธงเนเธญเธขเนเธฒเธเน€เธฃเธตเธขเธเธเนเธฒเธข เธชเธงเธขเธเธฒเธก เนเธกเนเน€เธเธฐเธเธฐ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธญเธฒเธญเธญเธ - เนเธเธเธเธดเธ”เธเธฒเธเนเธฅเธฐเธฅเนเธฒเธเธ•เธฑเธงเธเธฃเธญเธเนเธเธ•เธฒเธฃเธฒเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธฅเธเธ•เธฑเธงเธเธฃเธญเธเนเธเธเธเธดเธ”เธเธฒเธเนเธฅเธฐเธเธธเนเธกเธฅเนเธฒเธเธ•เธฑเธงเธเธฃเธญเธเนเธเธ•เธฒเธฃเธฒเธเน€เธเธทเนเธญเธเธงเธฒเธกเน€เธฃเธตเธขเธเธเนเธฒเธขเธเธญเธ UI)'
    },
    {
      id: 'log_000_wbs_remove_table_search_budget_office_filters',
      timestamp: '2026-10-18 20:43:00',
      timestampTh: '18 เธ•.เธ. 2569, 20:43 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธณเธ•เธฑเธงเธเธฃเธญเธเธ•เธฒเธฃเธฒเธ 3 เธเนเธญเธเธญเธญเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธณเธ•เธฑเธงเธเธฃเธญเธเน€เธซเธเธทเธญเธ•เธฒเธฃเธฒเธ WBS เธญเธญเธ 3 เธฃเธฒเธขเธเธฒเธฃ (เธเนเธเธซเธฒเน€เธฅเธ WBS, เธ•เธฑเธงเธเธฃเธญเธเธเธ, เธ•เธฑเธงเธเธฃเธญเธเธเธญเธ/เธเธเธ.)',
      targetSubject: 'เนเธ–เธเน€เธเธฃเธทเนเธญเธเธกเธทเธญเธ•เธฑเธงเธเธฃเธญเธเน€เธซเธเธทเธญเธ•เธฒเธฃเธฒเธเธฃเธฒเธขเธเธฒเธ WBS (.table-header-bar)',
      storageFile: 'index.html & js/data_history.js',
      changeSummary: 'เธเธณเธเนเธญเธเธเนเธเธซเธฒเธเนเธญเธเธงเธฒเธก WBS (#wbsTableSearchInput), เธเธฅเนเธญเธเน€เธฅเธทเธญเธเธ•เธฑเธงเธเธฃเธญเธเธเธ (#wbsBudgetFilterSelect) เนเธฅเธฐเธเธฅเนเธญเธเน€เธฅเธทเธญเธเธเธญเธ/เธเธเธ. (#wbsOfficeFilterSelect) เธญเธญเธเธเธฒเธเนเธ–เธเธ•เธฑเธงเธเธฃเธญเธเน€เธซเธเธทเธญเธ•เธฒเธฃเธฒเธ WBS เธ•เธฒเธกเธ—เธตเนเธเธนเนเนเธเนเธเธฒเธเธงเธเธเธฅเธกเธฃเธฐเธเธธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธ—เธตเนเธงเธเธเธฅเธกเน€เธญเธฒเธญเธญเธ): เธ—เธณเธเธฒเธฃเธฅเธ 3 เธชเนเธงเธเธญเธญเธเธเธฒเธ index.html เนเธเธชเนเธงเธ .table-header-bar เนเธ”เนเนเธเน 1) เธเนเธญเธเธเนเธเธซเธฒเน€เธฅเธ WBS / เธเนเธฒเธเธเธธเธกเธเธฒเธ 2) เธ•เธฑเธงเธเธฃเธญเธเธเธ (ALL, C.1, I, P, C02.2) 3) เธ•เธฑเธงเธเธฃเธญเธเธเธญเธ/เธเธเธ. เนเธ”เธขเธเธเน€เธซเธฅเธทเธญเธชเนเธงเธเธ•เธฑเธงเธเธฃเธญเธเนเธเธเธเธดเธ”เธเธฒเธ, เธเธธเนเธกเธฅเนเธฒเธเธ•เธฑเธงเธเธฃเธญเธเนเธเธ•เธฒเธฃเธฒเธ เนเธฅเธฐเธเนเธฒเธขเน€เธเธ“เธ‘เนเธงเธฑเธ”เนเธงเน เธ—เธณเนเธซเนเนเธ–เธเน€เธเธฃเธทเนเธญเธเธกเธทเธญเธเธฃเธฐเธเธฑเธเนเธฅเธฐเนเธกเนเธเนเธณเธเนเธญเธเธเธฑเธเธเธฒเธฃเธเธฃเธญเธเธเนเธฒเธเธเธฃเธฒเธเนเธ—เนเธเธซเธเนเธงเธขเธเธฒเธเธ”เนเธฒเธเธเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธ—เธตเนเธงเธเธเธฅเธกเน€เธญเธฒเธญเธญเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธเน€เธฅเธขเนเน€เธญเธฒเธ•เนเนเธ–เธเธ•เธฑเธงเธเธฃเธญเธเธ•เธฒเธฃเธฒเธ WBS เนเธซเนเธเธฃเธฐเธเธฑเธเธเธถเนเธ)'
    },
    {
      id: 'log_000_wbs_file_timestamps_and_checkbox_clear_btn_red_blue_text',
      timestamp: '2026-10-18 20:31:00',
      timestampTh: '18 เธ•.เธ. 2569, 20:31 เธ.',
      type: 'EDIT',
      typeBadge: 'เน€เธงเธฅเธฒเนเธเธฅเน 03-06 & เธเธธเนเธกเนเธ”เธเธเนเธฒ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธณเธเนเธฒเธขเน€เธ”เธดเธกเธ—เธตเนเธเธฒเธเธเธฒเธ—เธญเธญเธเนเธฅเธฐเนเธชเธ”เธเธงเธฑเธเธ—เธตเนเน€เธงเธฅเธฒเนเธเนเนเธเนเธเธฅเน 03-06 เธเธฃเนเธญเธกเธเธฃเธฑเธเธเธธเนเธกเธฅเนเธฒเธ Check Box เน€เธเนเธเธเธทเนเธเธซเธฅเธฑเธเธชเธตเนเธ”เธ เธญเธฑเธเธฉเธฃเธชเธตเธเนเธฒ',
      targetSubject: 'เนเธ–เธเธชเธฃเธธเธเธซเธฑเธงเธ•เธฒเธฃเธฒเธ WBS (#wbsActiveFilterPills) เนเธฅเธฐเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธตเนเน€เธฅเธทเธญเธเธเธฒเธ Check Box (#wbsCheckboxClearBtn)',
      storageFile: 'js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: '1) เธเธณเธเนเธฒเธขเธชเธ–เธฒเธเธฐเน€เธ”เธดเธก 4 เธฃเธฒเธขเธเธฒเธฃ (เธฃเธญเธเธเนเธญเธกเธนเธฅ, เน€เธเธ“เธ‘เนเธงเธฑเธ”, เธกเธนเธฅเธเนเธฒ AUC เธฃเธงเธก, เธเธเน€เธซเธฅเธทเธญ) เธญเธญเธเธเธฒเธเธซเธฑเธงเธ•เธฒเธฃเธฒเธ WBS เธ•เธฒเธกเธเธฒเธเธเธฒเธ—เธชเธตเน€เธซเธฅเธทเธญเธเธเธญเธเธเธนเนเนเธเนเธเธฒเธ 2) เนเธชเธ”เธเธเนเธฒเธขเธฃเธฐเธเธธเธงเธฑเธเธ—เธตเนเนเธฅเธฐเน€เธงเธฅเธฒเนเธเนเนเธเธเธฃเธดเธเธเธญเธเนเธเธฅเน 03 (17 เธ•.เธ. 2569, 13:20 เธ.), 04 (14 เธ•.เธ. 2569, 20:27 เธ.), 05 (22 เธ.เธข. 2569, 10:20 เธ.), 06 (22 เธ.เธข. 2569, 10:17 เธ.) เธชเธงเธขเธเธฒเธกเนเธขเธเธชเธตเน€เธเธเธฒเธฐ 3) เนเธเนเนเธเธเนเธญเธเธงเธฒเธกเธเธธเนเธกเนเธ•เนเธเธฒเธฃเนเธ”เธชเธ–เธฒเธเธฐ SAP เน€เธเนเธ "เธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธตเนเน€เธฅเธทเธญเธเธเธฒเธ Check Box" เธเธฃเนเธญเธกเธเธฃเธฑเธเธเธทเนเธเธซเธฅเธฑเธเน€เธเนเธเธชเธตเนเธ”เธเน€เธเนเธก เธญเธฑเธเธฉเธฃเธชเธตเธเนเธฒ (#38BDF8) เธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: 1) เนเธ js/wbs.js เธเธฃเธฑเธเธเธฃเธธเธ renderActiveFilterPills เธเธณ 4 เธเนเธฒเธขเน€เธ”เธดเธกเธญเธญเธเนเธฅเธฐเนเธ—เธเธ—เธตเนเธ”เนเธงเธขเธเนเธฒเธขเนเธชเธ”เธเธงเธฑเธเน€เธงเธฅเธฒเนเธเนเนเธเธฅเนเธฒเธชเธธเธ”เธเธญเธเนเธเธฅเน 03, 04, 05, 06 เธเธฅเธดเธเนเธฅเนเธงเน€เธเธดเธ” Modal เธเธฑเธเธเนเธญเธกเธนเธฅเนเธ”เน เธเธฃเนเธญเธกเน€เธเธดเนเธกเธเธฅเธฒเธช .pill-file-03 เธ–เธถเธ 06 เนเธ css/styles.css เธฃเธญเธเธฃเธฑเธ Dark เนเธฅเธฐ Light theme 2) เนเธ js/wbs.js เธเธฃเธฑเธเธเธฃเธธเธ footerHtml เน€เธเธฅเธตเนเธขเธเธเนเธญเธเธงเธฒเธกเน€เธเนเธ "เธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธตเนเน€เธฅเธทเธญเธเธเธฒเธ Check Box" เนเธฅเธฐเนเธ css/styles.css เธเธฃเธฑเธ .btn-clear-wbs-checkbox เน€เธเนเธ background: linear-gradient เนเธ—เธเธชเธตเนเธ”เธเธชเธ” เนเธฅเธฐ color / svg stroke เน€เธเนเธเธชเธตเธเนเธฒ (#38BDF8) 3) เธเธฃเธฑเธเธเธฃเธธเธ DATA_SOURCE_CATALOG เนเธ js/data_history.js เนเธซเนเธ•เธฃเธเธเธฑเธเน€เธงเธฅเธฒเนเธเธฅเนเธเธฃเธดเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธญเธฒเธ—เธตเนเธเธฒเธเธฒเธเธฒเธ—เธญเธญเธ / เนเธชเธ”เธเธงเธฑเธเธ—เธตเน เนเธฅเธฐเน€เธงเธฅเธฒ เธ—เธตเนเนเธเนเนเธเนเธเธฅเน 03 04 05 06 / เนเธเนเนเธเธเนเธญเธเธงเธฒเธก เธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธตเนเน€เธฅเธทเธญเธเธเธฒเธ Check Box เนเธฅเธฐเน€เธเธฅเธตเนเธขเธเธชเธตเธเธทเนเธเธซเธฅเธฑเธเน€เธเนเธเธชเธตเนเธ”เธ เธญเธฑเธเธฉเธฃเธชเธตเธเนเธฒ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธเน€เธฅเธขเนเน€เธญเธฒเธ•เนเธซเธฑเธงเธ•เธฒเธฃเธฒเธ WBS เนเธชเธ”เธเน€เธงเธฅเธฒเนเธเนเนเธเนเธเธฅเนเธเธฃเธดเธ เนเธฅเธฐเธ•เธเนเธ•เนเธเธเธธเนเธก Check Box เนเธซเธกเน)'
    },
    {
      id: 'log_000_wbs_clear_buttons_blue_and_no_numbers',
      timestamp: '2026-10-18 20:25:00',
      timestampTh: '18 เธ•.เธ. 2569, 20:25 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธธเนเธกเธชเธตเธเนเธฒ & เนเธกเนเธกเธตเธ•เธฑเธงเน€เธฅเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธฃเธฑเธเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธธเธเธชเธ–เธฒเธเธฐ (เนเธกเนเธกเธตเธ•เธฑเธงเน€เธฅเธ) เนเธฅเธฐเน€เธเธฅเธตเนเธขเธเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธตเนเน€เธฅเธทเธญเธเน€เธเนเธเธชเธตเธเนเธฒเธเธฃเนเธญเธกเธเธณเธ•เธฑเธงเน€เธฅเธเธเธฑเธเธญเธญเธ',
      targetSubject: 'เธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฃเธฒเธ WBS (#wbsOfficeChartClearBtn) เนเธฅเธฐเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธตเนเน€เธฅเธทเธญเธ Checkbox (#wbsCheckboxClearBtn)',
      storageFile: 'index.html, js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: '1) เนเธเนเนเธเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฃเธฒเธ WBS เน€เธเนเธ "เธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธธเธเธชเธ–เธฒเธเธฐ" เนเธฅเธฐเธเธณเธเธฒเธฃเนเธชเธ”เธเธ•เธฑเธงเน€เธฅเธเธเธฑเธเธญเธญเธเธ—เธฑเนเธเธซเธกเธ” 2) เธเธฃเธฑเธเธเธธเนเธก "เธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธตเนเน€เธฅเธทเธญเธ" เนเธ•เนเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP เนเธซเนเน€เธเนเธเธชเธตเธเนเธฒ Gradient (#2563EB - #1D4ED8) เธเธฃเนเธญเธกเน€เธฃเธทเธญเธเนเธชเธเธชเธตเธเนเธฒเนเธ—เธเธชเธตเนเธ”เธเน€เธ”เธดเธก เนเธฅเธฐเธเธณเธ•เธฑเธงเน€เธฅเธเธเธฑเธเธเธณเธเธงเธเธเธฒเธ (1) เธญเธญเธเธ•เธฒเธกเธ เธฒเธเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ 2 เธเธณเธชเธฑเนเธเธ•เนเธญเน€เธเธทเนเธญเธ (เธงเธเธเธฅเธก เนเธเนเน€เธเนเธ เธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธธเธเธชเธ–เธฒเธเธฐ เนเธฅเธฐเนเธกเนเธ•เนเธญเธเธกเธตเธ•เธฑเธงเน€เธฅเธ / เน€เธญเธฒเธ•เธฑเธงเน€เธฅเธเธญเธญเธ เนเธฅเธฐเน€เธเธฅเธตเนเธขเธเธเนเธธเธกเธชเธตเธเนเธฒ): 1) เนเธ index.html เนเธฅเธฐ js/wbs.js เธเธฃเธฑเธเธเนเธญเธเธงเธฒเธกเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธกเธธเธกเธเธเธเธงเธฒเน€เธเนเธ "เธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธธเธเธชเธ–เธฒเธเธฐ" เนเธฅเธฐเธเธดเธ”เธเธฒเธฃเนเธชเธ”เธเธเธฅเธ•เธฑเธงเน€เธฅเธเธเธฑเธ (#wbsOfficeChartClearCount) 2) เนเธ js/wbs.js เธเธฃเธฑเธเธเธฃเธธเธ footerHtml เธเธญเธ renderWbsSapSummary เนเธ”เธขเธเธณเธชเนเธเธเธ•เธฑเธงเน€เธฅเธเธเธฑเธเธเธณเธเธงเธเธเธฒเธ (#wbsCheckboxClearCount) เธญเธญเธเธเธฒเธเธเธธเนเธก #wbsCheckboxClearBtn 3) เนเธ css/styles.css เธเธฃเธฑเธเนเธ•เนเธเธเธฅเธฒเธช .btn-clear-wbs-checkbox เธเธฒเธเน€เธ”เธดเธกเธ—เธตเนเน€เธเนเธเนเธ—เธเธชเธตเนเธ”เธ เนเธซเนเน€เธเนเธเนเธ—เธเธชเธตเธเนเธฒเธเนเธณเน€เธเธดเธเธชเธ”เนเธช (Gradient Blue) เธ—เธฑเนเธเธชเธ–เธฒเธเธฐเธเธเธ•เธด, Hover, Active เนเธฅเธฐ Light Theme เธญเธขเนเธฒเธเธชเธกเธเธนเธฃเธ“เนเนเธเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธงเธเธเธฅเธก เนเธเนเน€เธเนเธ เธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธธเธเธชเธ–เธฒเธเธฐ เนเธฅเธฐเนเธกเนเธ•เนเธญเธเธกเธตเธ•เธฑเธงเน€เธฅเธ / เน€เธญเธฒเธ•เธฑเธงเน€เธฅเธเธญเธญเธ เนเธฅเธฐเน€เธเธฅเธตเนเธขเธเธเนเธธเธกเธชเธตเธเนเธฒ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธเธเนเธญเธเธงเธฒเธกเธเธธเนเธก เน€เธฅเธดเธเนเธชเธ”เธเธ•เธฑเธงเน€เธฅเธเธเธฑเธ เนเธฅเธฐเน€เธเธฅเธตเนเธขเธเธเธธเธ”เธชเธตเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅ Checkbox เน€เธเนเธเธชเธตเธเนเธฒ)'
    },
    {
      id: 'log_000_wbs_remove_budget_summary_pill',
      timestamp: '2026-10-18 20:16:00',
      timestampTh: '18 เธ•.เธ. 2569, 20:16 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธณเธเนเธฒเธขเธเธเธเธฑเธเธเธธเธเธฑเธเธญเธญเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธณเธเนเธฒเธขเธชเธฃเธธเธเธเธเธเธฑเธเธเธธเธเธฑเธเธฃเธงเธกเธญเธญเธเธเธฒเธเนเธ–เธเธชเธ–เธฒเธเธฐเธซเธฑเธงเธ•เธฒเธฃเธฒเธ WBS เธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ',
      targetSubject: 'เนเธ–เธเนเธชเธ”เธเธ•เธฑเธงเธเธฃเธญเธเนเธฅเธฐเธชเธฃเธธเธเธเธฅเธซเธฑเธงเธ•เธฒเธฃเธฒเธ WBS (#wbsActiveFilterPills)',
      storageFile: 'js/wbs.js & js/data_history.js',
      changeSummary: 'เธเธณเธเนเธฒเธข "๐’ฐ เธเธเธเธฑเธเธเธธเธเธฑเธเธฃเธงเธก: เธฟ..." เธญเธญเธเธเธฒเธเธชเนเธงเธเธซเธฑเธงเธ•เธฒเธฃเธฒเธเธฃเธฒเธขเธเธฒเธเธ•เธดเธ”เธ•เธฒเธกเธเธฒเธ WBS เธเธเน€เธซเธฅเธทเธญ (#wbsActiveFilterPills) เนเธ”เธขเธเธเน€เธซเธฅเธทเธญเน€เธเธเธฒเธฐเธเนเธฒเธขเธฃเธญเธเธเนเธญเธกเธนเธฅ, เน€เธเธ“เธ‘เนเธงเธฑเธ”, เธกเธนเธฅเธเนเธฒ AUC เธฃเธงเธก, เธเธณเธเธงเธเธเธฒเธเธเธเน€เธซเธฅเธทเธญ เนเธฅเธฐเธชเธ–เธฒเธเธฐ SAP เธ•เธฒเธกเธ—เธตเนเธเธนเนเนเธเนเธเธฒเธเธเธฒเน€เธเธฃเธทเนเธญเธเธซเธกเธฒเธขเธฃเธฐเธเธธเนเธเธ เธฒเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธญเธฒเธ—เธตเนเธงเธเธเธฅเธก/เธเธฒเธเธเธฒเธ—เธญเธญเธ): เนเธ js/wbs.js เธเธฃเธฑเธเธเธฃเธธเธเธเธฑเธเธเนเธเธฑเธ renderActiveFilterPills เนเธ”เธขเธเธณเธเธฅเนเธญเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเธเนเธฒเธข Budget Summary Pill (เธเธเธเธฑเธเธเธธเธเธฑเธเธฃเธงเธกเธเธฒเธเนเธเธฅเน 04) เธญเธญเธ เน€เธเธทเนเธญเนเธซเนเนเธ–เธเธชเธฃเธธเธเธเนเธญเธกเธนเธฅเธเธฃเธฐเธเธฑเธเนเธฅเธฐเธกเธธเนเธเน€เธเนเธเธ—เธตเนเธกเธนเธฅเธเนเธฒ AUC เธฃเธงเธกเธเธฃเธดเธเธเธญเธเธเธฒเธ WBS เธเธเน€เธซเธฅเธทเธญ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธญเธฒเธ—เธตเนเธงเธเธเธฅเธก เธญเธญเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เน€เธฅเนเธเธเนเธญเธข (เธเธฃเธฑเธเธเธฃเธธเธเธซเธเนเธฒเธ•เธฒ UI เนเธ–เธเธชเธฃเธธเธเธชเธ–เธฒเธเธฐ WBS เนเธ”เธขเธเธณเธเนเธฒเธขเธเธเธเธฑเธเธเธธเธเธฑเธเธฃเธงเธกเธญเธญเธ)'
    },
    {
      id: 'log_000_wbs_clear_all_btn_show_sap_status_count_only',
      timestamp: '2026-10-18 16:22:00',
      timestampTh: '18 เธ•.เธ. 2569, 16:22 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฑเธเน€เธเธเธฒเธฐเธชเธ–เธฒเธเธฐ SAP',
      badgeClass: 'badge-type-edit',
      title: 'เนเธเนเนเธเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธฑเนเธเธซเธกเธ”เธ”เนเธฒเธเธเธ เนเธซเนเนเธชเธ”เธเน€เธเธเธฒเธฐเธเธณเธเธงเธเธเธฃเธฐเน€เธ เธ—เธชเธ–เธฒเธเธฐ SAP เธ—เธตเนเธ–เธนเธเน€เธฅเธทเธญเธเน€เธ—เนเธฒเธเธฑเนเธ',
      targetSubject: 'เธเนเธฒเธขเธเธฑเธเธเธณเธเธงเธเธเธเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธฑเนเธเธซเธกเธ” (#wbsOfficeChartClearBtn & #wbsOfficeChartClearCount)',
      storageFile: 'js/wbs.js & js/data_history.js',
      changeSummary: 'เนเธเนเนเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเธ•เธฑเธงเน€เธฅเธเธเธฑเธเธเธเธเธธเนเธก "เธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธฑเนเธเธซเธกเธ”" (#wbsOfficeChartClearBtn) เธ—เธตเนเธกเธธเธกเธเธเธเธงเธฒ เนเธซเนเนเธชเธ”เธเน€เธเธเธฒเธฐเธเธณเธเธงเธเธเธฃเธฐเน€เธ เธ—เธชเธ–เธฒเธเธฐ SAP เธ—เธตเนเธ–เธนเธเน€เธฅเธทเธญเธเน€เธ—เนเธฒเธเธฑเนเธ (เน€เธเนเธ (1), (3)) เนเธ”เธขเนเธกเนเธเธณเธเธณเธเธงเธเธเธฒเธเธ—เธตเนเน€เธฅเธทเธญเธเธเธฒเธ Checkbox (65 เธเธฒเธ) เธกเธฒเนเธชเธ”เธเธเธเธเธฑเธเธญเธตเธเธ•เนเธญเนเธ เน€เธเธทเนเธญเนเธขเธเนเธขเธฐเธเธงเธฒเธกเนเธ•เธเธ•เนเธฒเธเธเธฒเธเธเธธเนเธก "เธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธตเนเน€เธฅเธทเธญเธ" เธ”เนเธฒเธเธฅเนเธฒเธเนเธ”เนเธญเธขเนเธฒเธเธเธฑเธ”เน€เธเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธเนเนเธเนเธซเน เนเธชเธ”เธเธเธณเธเธงเธเธเธฃเธฐเน€เธ เธ— เธชเธ–เธฒเธเธฐ sap เธ—เธตเนเน€เธฅเธทเธญเธ เน€เธ—เนเธฒเธเธฑเนเธ): 1) เนเธ js/wbs.js เธเธฃเธฑเธเธเธฃเธธเธเธเธฑเธเธเนเธเธฑเธ renderWbsSapSummary เนเธเธชเนเธงเธเธเธฒเธฃเธญเธฑเธเน€เธ”เธ• #wbsOfficeChartClearCount เนเธ”เธขเธ•เธฑเธ”เน€เธเธทเนเธญเธเนเธเธเธฒเธฃเธเธณ selWbsCount เธกเธฒเนเธชเธ”เธเธเธฅเธญเธญเธ 2) เธเธณเธซเธเธ”เนเธซเนเนเธชเธ”เธเธ•เธฑเธงเน€เธฅเธ (selSapCount) เน€เธเธเธฒเธฐเน€เธกเธทเนเธญเธกเธตเธเธฒเธฃเน€เธฅเธทเธญเธเธชเธ–เธฒเธเธฐเธเธฒเธฃเนเธ” SAP (selSapCount > 0) เน€เธเนเธ เธเธฃเธญเธ 1 เธชเธ–เธฒเธเธฐเนเธชเธ”เธ (1) เธซเธฃเธทเธญเน€เธฅเธทเธญเธเธ—เธธเธเธชเธ–เธฒเธเธฐเนเธชเธ”เธ (9) 3) เธซเธฒเธเนเธกเนเธกเธตเธเธฒเธฃเน€เธฅเธทเธญเธเธเธฒเธฃเนเธ” SAP เนเธซเนเธเนเธญเธเธเนเธฒเธขเธเธฑเธ (display: none) เธเธฅเนเธญเธขเนเธซเนเธเธธเนเธกเนเธชเธ”เธเน€เธเธเธฒเธฐเธเนเธญเธเธงเธฒเธก "เธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธฑเนเธเธซเธกเธ”" 4) เธเธเธเธฒเธฃเนเธชเธ”เธเธ•เธฑเธงเน€เธฅเธเธเธฑเธเธเธณเธเธงเธเธเธฒเธ Checkbox เนเธงเนเธ—เธตเนเธเธธเนเธก "เธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธตเนเน€เธฅเธทเธญเธ" (#wbsCheckboxClearBtn) เธ”เนเธฒเธเธฅเนเธฒเธเน€เธ—เนเธฒเธเธฑเนเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธเนเนเธเนเธซเน เนเธชเธ”เธเธเธณเธเธงเธเธเธฃเธฐเน€เธ เธ— เธชเธ–เธฒเธเธฐ sap เธ—เธตเนเน€เธฅเธทเธญเธ เน€เธ—เนเธฒเธเธฑเนเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เน€เธฅเนเธเธเนเธญเธข (เนเธเนเนเธเธ•เธฑเธงเน€เธฅเธเธเธฑเธเธเธเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ”เนเธฒเธเธเธเนเธซเนเธชเธฐเธ—เนเธญเธเน€เธเธเธฒเธฐเธเธณเธเธงเธเธเธฃเธฐเน€เธ เธ—เธชเธ–เธฒเธเธฐ SAP เธ—เธตเนเน€เธฅเธทเธญเธ)'
    },
    {
      id: 'log_000_wbs_add_clear_checkbox_only_button',
      timestamp: '2026-10-18 16:15:00',
      timestampTh: '18 เธ•.เธ. 2569, 16:15 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธธเนเธกเธฅเนเธฒเธเน€เธเธเธฒเธฐ Checkbox',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธดเนเธกเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅ เน€เธเธเธฒเธฐเธ—เธตเนเน€เธฅเธทเธญเธเธเธฒเธ Checkbox เน€เธ—เนเธฒเธเธฑเนเธ เนเธ•เนเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP เธ•เธฒเธกเธเธฃเธญเธเธ•เธณเนเธซเธเนเธเธ—เธตเนเธฃเธฐเธเธธ',
      targetSubject: 'เธชเนเธงเธเธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP (#wbsSapSummarySection) เนเธฅเธฐเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเน€เธเธเธฒเธฐ Checkbox (#wbsCheckboxClearBtn)',
      storageFile: 'index.html, js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: '1) เน€เธเธดเนเธกเธเธธเนเธก "เธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธตเนเน€เธฅเธทเธญเธ" (#wbsCheckboxClearBtn) เนเธงเนเนเธ•เนเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP เธเธดเธ”เธเธงเธฒเธ•เธฃเธเธ•เธฒเธกเธเธฃเธญเธเธชเธตเนเธ”เธเธ—เธตเนเธเธนเนเนเธเนเธเธฒเธเธเธณเธซเธเธ” 2) เธเธฑเธเธเนเธเธฑเธ window.clearWbsCheckboxSelection เธเธฐเธฅเนเธฒเธเน€เธเธเธฒเธฐเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเน€เธฅเธทเธญเธเธเธฒเธ Checkbox เนเธเธ•เธฒเธฃเธฒเธ (wbsState.selectedWbs) เนเธ”เธขเนเธกเนเธฅเนเธฒเธเธเธฒเธฃเน€เธฅเธทเธญเธเธชเธ–เธฒเธเธฐเธเธฒเธฃเนเธ” SAP เนเธฅเธฐเนเธกเนเธฅเนเธฒเธเธเธฒเธฃเน€เธฅเธทเธญเธเธซเธเนเธงเธขเธเธฒเธเธเธเธเธฃเธฒเธ 3) เธเธฃเธฑเธเธเธธเนเธกเธเธเธเธงเธฒเธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฃเธฒเธ (#wbsOfficeChartClearBtn) เน€เธเนเธ "เธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธฑเนเธเธซเธกเธ”" เน€เธเธทเนเธญเนเธซเนเธเธนเนเนเธเนเธเธฒเธเนเธขเธเนเธขเธฐเธเธฒเธฃเธฅเนเธฒเธเธ—เธฑเนเธเธซเธกเธ”เธเธฑเธเธเธฒเธฃเธฅเนเธฒเธเน€เธเธเธฒเธฐ Checkbox เนเธ”เนเธญเธขเนเธฒเธเธเธฑเธ”เน€เธเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธเธดเนเธกเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅ เน€เธเธเธฒเธฐเธ—เธตเนเน€เธฅเธทเธญเธเธเธฒเธ checkbox เน€เธ—เธฒเธเธฑเนเธ): 1) เนเธ js/wbs.js เน€เธเธดเนเธกเธเธฑเธเธเนเธเธฑเธ window.clearWbsCheckboxSelection เธชเธณเธซเธฃเธฑเธเธเธฅเธ” wbsState.selectedWbs เนเธฅเธฐเธเธฅเธ” Checkbox เนเธเธ•เธฒเธฃเธฒเธเธ—เธฑเนเธเธซเธกเธ”เนเธ”เธขเธเธเธเนเธฒ wbsState.selectedSapStatuses เนเธฅเธฐ wbsState.office เนเธงเนเธ•เธฒเธกเน€เธ”เธดเธก 2) เนเธ renderWbsSapSummary เน€เธเธดเนเธก footerHtml (.wbs-sap-summary-footer-bar) เธเธฑเธ”เธงเธฒเธเธเธธเนเธก #wbsCheckboxClearBtn เธเธดเธ”เธเธงเธฒเนเธ•เนเธเธฒเธฃเนเธ” SAP เธ•เธฒเธกเธเธฃเธญเธเธชเธตเนเธ”เธเนเธเธ เธฒเธ เนเธชเธ”เธเธ•เธฑเธงเน€เธฅเธเธเธฑเธ (X) เนเธฅเธฐเน€เธเธฅเธตเนเธขเธเน€เธเนเธเธเธธเนเธกเธชเธตเนเธ”เธ Gradient เน€เธฃเธทเธญเธเนเธชเธเน€เธกเธทเนเธญเธกเธตเธฃเธฒเธขเธเธฒเธฃ Checkbox เธ–เธนเธเน€เธฅเธทเธญเธ เธเธฃเนเธญเธกเธชเธ–เธฒเธเธฐ disabled เน€เธกเธทเนเธญเนเธกเนเธกเธตเธฃเธฒเธขเธเธฒเธฃเน€เธฅเธทเธญเธ 3) เนเธ css/styles.css เธเธณเธซเธเธ”เธเธฅเธฒเธช .btn-clear-wbs-checkbox เนเธฅเธฐ .wbs-sap-summary-footer-bar เธฃเธญเธเธฃเธฑเธเธ—เธฑเนเธ Dark เนเธฅเธฐ Light Theme 4) เนเธ index.html เธเธณเธซเธเธ”เธเนเธฒเธขเธเธธเนเธกเธกเธธเธกเธเธงเธฒเธเธเน€เธเนเธ "เธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธฑเนเธเธซเธกเธ”" เน€เธเธทเนเธญเธเธงเธฒเธกเธเธฑเธ”เน€เธเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธเธดเนเธกเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅ เน€เธเธเธฒเธฐเธ—เธตเนเน€เธฅเธทเธญเธเธเธฒเธ checkbox เน€เธ—เธฒเธเธฑเนเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เน€เธเธดเนเธกเธเธธเนเธกเธฅเนเธฒเธเน€เธเธเธฒเธฐเธฃเธฒเธขเธเธฒเธฃ Checkbox เนเธ•เนเธเธฒเธฃเนเธ”เธชเธ–เธฒเธเธฐ SAP เธ•เธฒเธกเธ•เธณเนเธซเธเนเธเธ—เธตเนเธเธณเธซเธเธ”)'
    },
    {
      id: 'log_000_wbs_remove_bottom_summary_move_clear_btn_no_decimals',
      timestamp: '2026-10-18 16:05:00',
      timestampTh: '18 เธ•.เธ. 2569, 16:05 เธ.',
      type: 'EDIT',
      typeBadge: 'เธขเนเธฒเธขเธเธธเนเธกเธฅเนเธฒเธ & เธกเธนเธฅเธเนเธฒเนเธกเนเธกเธตเธ—เธจเธเธดเธขเธก',
      badgeClass: 'badge-type-edit',
      title: 'เธเธณเธเธฅเนเธญเธเธชเธฃเธธเธเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเน€เธฅเธทเธญเธเธ”เนเธฒเธเธฅเนเธฒเธเธญเธญเธ, เธขเนเธฒเธขเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธตเนเน€เธฅเธทเธญเธเธเธถเนเธเธกเธธเธกเธเธเธเธงเธฒ เนเธฅเธฐเธเธฃเธฑเธเธกเธนเธฅเธเนเธฒเนเธเธเธฒเธฃเนเธ”เนเธกเนเธกเธตเธเธธเธ”เธ—เธจเธเธดเธขเธก',
      targetSubject: 'เธเธฅเนเธญเธเธชเธฃเธธเธเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเน€เธฅเธทเธญเธ (#wbsSelectedSummaryCard), เธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธเธเธซเธฑเธงเธเธฒเธฃเนเธ” (#wbsOfficeChartClearBtn) เนเธฅเธฐเธกเธนเธฅเธเนเธฒเนเธเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP (#wbsSapSummarySection)',
      storageFile: 'index.html, js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: '1) เธเธณเธเธฅเนเธญเธเธชเธฃเธธเธเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเน€เธฅเธทเธญเธเธ”เนเธฒเธเธฅเนเธฒเธ (#wbsSelectedSummaryCard) เธญเธญเธเธ•เธฒเธกเธฃเธนเธเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ 2) เธขเนเธฒเธขเนเธฅเธฐเธเธฃเธฑเธเนเธ•เนเธเธเธธเนเธก "เธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธตเนเน€เธฅเธทเธญเธ" เธเธถเนเธเนเธเนเธงเนเธ—เธตเนเธกเธธเธกเธเธงเธฒเธเธเธเธญเธเธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฃเธฒเธ WBS เนเธชเธ”เธเธเธณเธเธงเธเธเธฒเธเธ—เธตเนเน€เธฅเธทเธญเธเธชเธตเนเธ”เธเน€เธ”เนเธเธเธฑเธ” 3) เธเธฃเธฑเธเธเธฃเธธเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเธกเธนเธฅเธเนเธฒ (AUC) เธ เธฒเธขเนเธเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP เธ—เธธเธเนเธ เนเธกเนเนเธซเนเธกเธตเธเธธเธ”เธ—เธจเธเธดเธขเธก (เธเธฑเธ”เน€เธเนเธเธเธณเธเธงเธเน€เธ•เนเธกเนเธฅเธฐเธเธฑเนเธเธซเธฅเธฑเธเธเธฑเธ)',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ 2 เธเนเธญ: 1) "เน€เธญเธฒเธญเธญเธ เนเธฅเธฐเธขเนเธฒเธขเธ•เธณเนเธซเธเนเธเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธตเนเน€เธฅเธทเธญเธเธ•เธฒเธกเธฃเธนเธ": เธเธฃเธฑเธเธเธฃเธธเธ index.html เนเธฅเธฐ renderWbsSelectedSummaryCard เนเธ js/wbs.js เนเธซเนเธเธดเธ”เธเธฒเธฃเนเธชเธ”เธเธเธฅเธเธญเธเธเธฅเนเธญเธเธฅเนเธฒเธเธญเธขเนเธฒเธเธชเธกเธเธนเธฃเธ“เน เนเธฅเธฐเธขเนเธฒเธขเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธตเนเน€เธฅเธทเธญเธเธเธถเนเธเนเธเนเธงเนเธ—เธตเนเธกเธธเธกเธเธเธเธงเธฒ (#wbsOfficeChartClearBtn) เธเธฃเนเธญเธกเนเธชเธ”เธเธเธทเนเธญ "เธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธตเนเน€เธฅเธทเธญเธ" เนเธฅเธฐเธเธฑเธเธเธณเธเธงเธเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเน€เธฅเธทเธญเธ (เน€เธเนเธ เธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธตเนเน€เธฅเธทเธญเธ (65)) 2) "เธกเธนเธฅเธเนเธฒ เนเธเธเธฒเธฃเนเธ” เนเธกเนเธ•เนเธญเธเธกเธตเธเธธเธ”เธ—เธจเธเธดเธขเธก": เธชเธฃเนเธฒเธเธเธฑเธเธเนเธเธฑเธ formatMoneyNoDecimals เนเธ js/wbs.js เนเธฅเธฐเธเธณเธกเธฒเนเธเนเธเธฑเธ”เธฃเธนเธเนเธเธเธกเธนเธฅเธเนเธฒ AUC เธ—เธฑเนเธเธซเธกเธ”เนเธเธเธฒเธฃเนเธ”เธชเธ–เธฒเธเธฐ SAP (เธ—เธฑเนเธเธเธฒเธฃเนเธ” "เธ—เธฑเนเธเธซเธกเธ”" เนเธฅเธฐเธเธฒเธฃเนเธ”เนเธ•เนเธฅเธฐเธชเธ–เธฒเธเธฐ) เธฃเธงเธกเธ–เธถเธเธกเธนเธฅเธเนเธฒเธเธญเธเธเธฒเธเธ—เธตเนเน€เธฅเธทเธญเธ Checkbox เนเธซเนเน€เธเนเธเธ•เธฑเธงเน€เธฅเธเธเธณเธเธงเธเน€เธ•เนเธก เนเธกเนเธกเธตเธเธธเธ”เธ—เธจเธเธดเธขเธก (.00) เธญเนเธฒเธเธเนเธฒเธขเนเธฅเธฐเธเธฐเธ—เธฑเธ”เธฃเธฑเธ”เธขเธดเนเธเธเธถเนเธ 3) เนเธ css/styles.css เน€เธเธดเนเธกเธชเธ–เธฒเธเธฐ :disabled เธชเธณเธซเธฃเธฑเธเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเน€เธกเธทเนเธญเนเธกเนเธกเธตเธฃเธฒเธขเธเธฒเธฃเน€เธฅเธทเธญเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธญเธฒเธญเธญเธ เนเธฅเธฐเธขเนเธฒเธขเธ•เธณเนเธซเธเนเธเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธตเนเน€เธฅเธทเธญเธเธ•เธฒเธกเธฃเธนเธ / เธกเธนเธฅเธเนเธฒ เนเธเธเธฒเธฃเนเธ” เนเธกเนเธ•เนเธญเธเธกเธตเธเธธเธ”เธ—เธจเธเธดเธขเธก)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธเน€เธฅเธขเนเน€เธญเธฒเธ•เนเธเธฒเธฃเธเธณเธเธฅเนเธญเธเธฅเนเธฒเธเธญเธญเธ เธขเนเธฒเธขเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅ เนเธฅเธฐเธเธฑเธ”เธฃเธนเธเนเธเธเธ•เธฑเธงเน€เธฅเธเธเธณเธเธงเธเน€เธ•เนเธกเนเธเธเธฒเธฃเนเธ”)'
    },
    {
      id: 'log_000_wbs_sap_card_cb_remove_pct_lock_2_rows_bright_bg',
      timestamp: '2026-10-18 15:55:00',
      timestampTh: '18 เธ•.เธ. 2569, 15:55 เธ.',
      type: 'EDIT',
      typeBadge: 'เธฅเนเธญเธ 2 เธเธฃเธฃเธ—เธฑเธ” & เธชเธตเนเธชเธชเธงเนเธฒเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธณ % เธญเธญเธเธเธฒเธเธเธฒเธฃเนเธ”เธชเนเธงเธเธ—เธตเนเน€เธฅเธทเธญเธ, เธฅเนเธญเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเธ•เธฒเธขเธ•เธฑเธง 2 เธเธฃเธฃเธ—เธฑเธ” (เธเธณเธเธงเธเธเธฒเธ/เธกเธนเธฅเธเนเธฒ) เธ•เธฑเธงเน€เธฅเธเนเธกเนเนเธ”เธเธเธฑเธ เนเธฅเธฐเธเธฃเธฑเธเธชเธตเธเธทเนเธเธซเธฅเธฑเธเธ—เธตเนเน€เธฅเธทเธญเธเนเธซเนเธชเธตเนเธชเธชเธงเนเธฒเธเนเธกเนเธ—เธถเธ',
      targetSubject: 'เธเธฅเนเธญเธเธชเธฃเธธเธเธเธฅ Checkbox เธ”เนเธฒเธเธฅเนเธฒเธเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP (#wbsSapSummarySection .wbs-sap-card-cb-box)',
      storageFile: 'css/styles.css, js/wbs.js & js/data_history.js',
      changeSummary: '1) เธเธณ % เธชเธฑเธ”เธชเนเธงเธเธญเธญเธเธเธฒเธเธเธฒเธฃเนเธ”เธชเนเธงเธเธ—เธตเนเน€เธฅเธทเธญเธเธ—เธฑเนเธเธซเธกเธ” 2) เธฅเนเธญเธเนเธเธฃเธเธชเธฃเนเธฒเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเนเธซเนเธญเธขเธนเน 2 เธเธฃเธฃเธ—เธฑเธ”เธเธญเธ”เธต: เธเธฃเธฃเธ—เธฑเธ”เธ—เธตเน 1 เนเธชเธ”เธเนเธญเธเธญเธเธเธฃเนเธญเธกเธเธณเธเธงเธเธเธฒเธ (เน€เธเนเธ "โ“ เน€เธฅเธทเธญเธ 11 เธเธฒเธ") เธเธฃเธฃเธ—เธฑเธ”เธ—เธตเน 2 เนเธชเธ”เธเธเนเธฒเธขเธกเธนเธฅเธเนเธฒเธเธฃเนเธญเธกเธ•เธฑเธงเน€เธฅเธเธญเธฑเธเธฉเธฃเธชเธตเธเนเธฒเน€เธ•เนเธกเธเธณเธเธงเธเนเธกเนเนเธ”เธเธเธฑเธ 3) เธเธฃเธฑเธเธเธเธฒเธ”เธเธฒเธฃเนเธ” min-width 165px เนเธฅเธฐเธเธฃเธฑเธ white-space: nowrap เธเนเธญเธเธเธฑเธเธ•เธฑเธงเน€เธฅเธเธ•เธเธเธฃเธฃเธ—เธฑเธ” 4) เธเธฃเธฑเธเธชเธตเธเธทเนเธเธซเธฅเธฑเธเธ—เธตเนเน€เธฅเธทเธญเธเนเธซเนเน€เธเนเธเธชเธตเนเธชเน เธชเธงเนเธฒเธเน เธเธฃเธฐเธเธเน€เธฃเธทเธญเธเนเธชเธ (Translucent Glow) เนเธกเนเธกเธทเธ”เธ—เธถเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ 2 เธเธณเธชเธฑเนเธเธ•เนเธญเน€เธเธทเนเธญเธ (เน€เธญเธฒ % เธญเธญเธ เนเธฅเธฐเน€เธฅเธทเธญเธเนเธฅเนเธงเธ•เธฑเธงเน€เธฅเธเธ•เนเธญเธเนเธกเนเนเธ”เธเธเธฑเธ เนเธซเนเธฅเนเธญเธเธญเธขเธนเน 2 เธเธฃเธฃเธ—เธฑเธ” เธเธฃเธฃเธ—เธฑเธ”เธเธณเธเธงเธเธเธฒเธ เธเธฃเธฃเธ—เธฑเธ”เธกเธนเธฅเธเนเธฒ / เธเธฃเธฑเธเธชเธตเธเธทเนเธเธซเธฅเธฑเธเธ—เธตเนเน€เธฅเธทเธญเธเนเธซเน เธชเธตเนเธชเน เธชเธงเนเธฒเธเธ เนเธกเนเธ—เธถเธ เนเธเธเธเธตเน): 1) เนเธ js/wbs.js เธ•เธฑเธ”เธชเธฑเธ”เธชเนเธงเธ % เธญเธญเธเธเธฒเธเธเธฒเธฃเนเธ” "เธ—เธฑเนเธเธซเธกเธ”" เนเธฅเธฐเธเธฒเธฃเนเธ”เธ—เธธเธเธชเธ–เธฒเธเธฐ SAP 2) เธเธฃเธฑเธเนเธเธฃเธเธชเธฃเนเธฒเธ HTML เน€เธเนเธ 2 เนเธ–เธงเธ•เธฒเธขเธ•เธฑเธง: .wbs-sap-cb-row-jobs เธชเธณเธซเธฃเธฑเธเธเธฃเธฃเธ—เธฑเธ”เธเธณเธเธงเธเธเธฒเธ เนเธฅเธฐ .wbs-sap-cb-row-auc เธชเธณเธซเธฃเธฑเธเธเธฃเธฃเธ—เธฑเธ”เธกเธนเธฅเธเนเธฒ 3) เนเธ css/styles.css เธเธฃเธฑเธเธเธงเธฒเธกเธเธงเนเธฒเธ .wbs-sap-card เน€เธเนเธ min-width: 165px เธเธฃเนเธญเธกเธเธฑเธ”เธงเธฒเธเธ•เธฑเธงเน€เธฅเธเธกเธนเธฅเธเนเธฒเนเธซเนเนเธชเธ”เธเธเธฅเนเธ”เนเน€เธ•เนเธกเธเธณเธเธงเธ 100% เนเธกเนเนเธ”เธเธเธญเธเธ•เธฑเธ” 4) เธเธฃเธฑเธเธชเธตเธเธทเนเธเธซเธฅเธฑเธเน€เธกเธทเนเธญเธกเธตเธฃเธฒเธขเธเธฒเธฃเน€เธฅเธทเธญเธ (.has-selection) เนเธซเนเน€เธเนเธ Gradient เนเธเธฃเนเธเนเธชเธเธชเธงเนเธฒเธเนเธช เนเธกเนเน€เธเนเธกเธ—เธถเธเธ”เธณ เธเธฃเนเธญเธก Inner/Outer Glow เธเธธเนเธกเธเธงเธฅเธชเธงเธขเธเธฒเธกเธ—เธฑเนเธ Dark เนเธฅเธฐ Light Theme',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธญเธฒ % เธญเธญเธ เนเธฅเธฐเน€เธฅเธทเธญเธเนเธฅเนเธงเธ•เธฑเธงเน€เธฅเธเธ•เนเธญเธเนเธกเนเนเธ”เธเธเธฑเธ เนเธซเนเธฅเนเธญเธเธญเธขเธนเน 2 เธเธฃเธฃเธ—เธฑเธ” เธเธฃเธฃเธ—เธฑเธ”เธเธณเธเธงเธเธเธฒเธ เธเธฃเธฃเธ—เธฑเธ”เธกเธนเธฅเธเนเธฒ / เธเธฃเธฑเธเธชเธตเธเธทเนเธเธซเธฅเธฑเธเธ—เธตเนเน€เธฅเธทเธญเธเนเธซเน เธชเธตเนเธชเน เธชเธงเนเธฒเธเธ เนเธกเนเธ—เธถเธ เนเธเธเธเธตเน)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธ Typography เนเธฅเธฐเธเธงเธฒเธกเธชเธงเนเธฒเธเนเธชเธเธญเธเธเธทเนเธเธซเธฅเธฑเธเธเธฅเนเธญเธ Checkbox เธ เธฒเธขเนเธเธเธฒเธฃเนเธ” SAP)'
    },
    {
      id: 'log_000_wbs_full_bleed_sap_card_checkbox_status_bg',
      timestamp: '2026-10-18 15:45:00',
      timestampTh: '18 เธ•.เธ. 2569, 15:45 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธชเธตเธเธทเนเธเธซเธฅเธฑเธเธ เธฒเธงเธฐเธเธเธ•เธดเธ•เธฒเธกเธชเธ–เธฒเธเธฐ',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธฅเธตเนเธขเธเธชเธตเธเธทเนเธเธซเธฅเธฑเธเธ เธฒเธงเธฐเธเธเธ•เธดเนเธเธชเนเธงเธเธ—เธตเนเน€เธฅเธทเธญเธเธเธญเธเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP เธ•เธฒเธกเธชเธต CLSD, TECO, REL เนเธฅเธฐเนเธเนเน€เธ•เนเธกเธเธทเนเธเธ—เธตเนเธเธฒเธฃเนเธ”เธชเนเธงเธเธฅเนเธฒเธ',
      targetSubject: 'เธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP (#wbsSapSummarySection) เนเธเธชเนเธงเธเนเธชเธ”เธเธเธฅ Checkbox เธ”เนเธฒเธเธฅเนเธฒเธเธเธฒเธฃเนเธ”',
      storageFile: 'css/styles.css & js/data_history.js',
      changeSummary: '1) เธเธฃเธฑเธเธชเธตเธเธทเนเธเธซเธฅเธฑเธเนเธเธ เธฒเธงเธฐเธเธเธ•เธด (Idle State / เธขเธฑเธเนเธกเนเธกเธตเธเธฒเธฃเน€เธฅเธทเธญเธ) เธเธญเธเธชเนเธงเธ Checkbox เธ”เนเธฒเธเธฅเนเธฒเธเธเธฒเธฃเนเธ”เนเธซเนเนเธชเธ”เธเธชเธตเธ•เธฒเธกเธเธฅเธธเนเธกเธชเธ–เธฒเธเธฐ SAP เธ—เธฑเธเธ—เธต (CLSD เนเธ—เธเน€เธเธตเธขเธงเธกเธดเนเธเธ—เน, TECO เนเธ—เธเน€เธซเธฅเธทเธญเธเธญเธณเธเธฑเธ, REL เนเธ—เธเนเธ”เธเธเธญเธฃเธฑเธฅ เนเธฅเธฐ ALL เนเธ—เธเธเนเธฒ) 2) เธเธฃเธฑเธเนเธ•เนเธเน€เธฅเธขเนเน€เธญเธฒเธ•เนเนเธซเนเธเธฅเนเธญเธเธชเนเธงเธเธ—เธตเนเน€เธฅเธทเธญเธเนเธเนเธเธขเธฒเธขเน€เธ•เนเธกเธเธงเธฒเธกเธเธงเนเธฒเธเนเธฅเธฐเธเธเธเธญเธเธฅเนเธฒเธเธเธญเธเธเธฒเธฃเนเธ” (Full-bleed Bottom Flush) เนเธเธเธชเธเธดเธ—เธชเธงเธขเธเธฒเธกเนเธฃเนเธฃเธญเธขเธ•เนเธญ เธเธฃเนเธญเธกเน€เธชเนเธเธเธฑเนเธเธ”เนเธฒเธเธเธเธ•เธฒเธกเธชเธตเธชเธ–เธฒเธเธฐ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธเธฅเธตเนเธขเธเธชเธตเธเธทเนเธเธซเธฅเธฑเธ เธ เธฒเธงเธฐเธเธเธ•เธด เธ•เธฒเธกเธชเธต CLSD TECO REL เนเธซเนเน€เธ•เนเธกเธเธฒเธฃเนเธ”เธชเนเธงเธเธ—เธตเนเน€เธฅเธทเธญเธ): 1) เนเธ css/styles.css เธเธฃเธฑเธ .wbs-sap-card เน€เธเนเธ padding: 0 เนเธฅเธฐ overflow: hidden เน€เธเธทเนเธญเนเธซเนเธชเนเธงเธเธฅเนเธฒเธเธชเธฒเธกเธฒเธฃเธ–เนเธเนเธเธงเนเธฒเธเธเธเธเธญเธเธเนเธฒเธข เธเธงเธฒ เนเธฅเธฐเธฅเนเธฒเธเนเธ”เน 100% 2) เธเธณเธซเธเธ” padding เธเธญเธ .wbs-sap-card-main-info เน€เธเนเธ 0.65rem 0.75rem 0.45rem 0.75rem เธฃเธฑเธเธฉเธฒเธฃเธฐเธขเธฐเธ•เธฑเธงเธญเธฑเธเธฉเธฃเนเธฅเธฐ Badge เธ”เนเธฒเธเธเธเนเธซเนเน€เธ—เนเธฒเน€เธ”เธดเธก 3) เธเธฃเธฑเธ .wbs-sap-card-cb-box เนเธซเน margin: 0, width: 100%, border-radius: 0 0 9px 9px เธเธฃเนเธญเธกเน€เธชเนเธเธเธญเธเธเธ border-top 1px solid เธเธฑเนเธเธฃเธฐเธซเธงเนเธฒเธเธชเนเธงเธเธเธเธเธฑเธเธชเนเธงเธเธฅเนเธฒเธเธญเธขเนเธฒเธเธเธฑเธ”เน€เธเธ 4) เธเธณเธซเธเธ”เธชเธตเธเธทเนเธเธซเธฅเธฑเธเธ เธฒเธงเธฐเธเธเธ•เธด (.cat-all, .cat-clsd, .cat-teco, .cat-rel) เนเธซเนเน€เธเนเธ Gradient เธชเธตเนเธเธฃเนเธเนเธชเธเธ•เธฒเธกเน€เธเธ”เธชเธตเธเธญเธเนเธ•เนเธฅเธฐเธชเธ–เธฒเธเธฐ SAP เธ—เธฑเธเธ—เธตเธ•เธฑเนเธเนเธ•เนเน€เธฃเธดเนเธกเธ•เนเธ เนเธฅเธฐเน€เธฃเธทเธญเธเนเธชเธเธชเธงเนเธฒเธเน€เธเนเธกเธเนเธเธขเธดเนเธเธเธถเนเธเน€เธกเธทเนเธญเธกเธตเธฃเธฒเธขเธเธฒเธฃเธ–เธนเธเน€เธฅเธทเธญเธ (.has-selection) 5) เธฃเธญเธเธฃเธฑเธ Light Theme เธญเธขเนเธฒเธเธชเธกเธเธนเธฃเธ“เนเนเธเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธเธฅเธตเนเธขเธเธชเธตเธเธทเนเธเธซเธฅเธฑเธ เธ เธฒเธงเธฐเธเธเธ•เธด เธ•เธฒเธกเธชเธต CLSD TECO REL เนเธซเนเน€เธ•เนเธกเธเธฒเธฃเนเธ”เธชเนเธงเธเธ—เธตเนเน€เธฅเธทเธญเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธ UI เธชเนเธงเธ Checkbox เธเธญเธเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP เนเธซเนเน€เธ•เนเธกเธเธทเนเธเธ—เธตเนเนเธฅเธฐเธกเธตเธชเธตเธชเธฑเธเธ•เธฒเธกเธชเธ–เธฒเธเธฐเนเธเธ เธฒเธงเธฐเธเธเธ•เธด)'
    },
    {
      id: 'log_000_wbs_integrate_checkbox_into_sap_summary_cards',
      timestamp: '2026-10-18 15:35:00',
      timestampTh: '18 เธ•.เธ. 2569, 15:35 เธ.',
      type: 'EDIT',
      typeBadge: 'เธฃเธงเธกเธเธฒเธฃเนเธ” Checkbox เนเธเธเธฒเธฃเนเธ” SAP',
      badgeClass: 'badge-type-edit',
      title: 'เธขเนเธฒเธขเธเนเธญเธกเธนเธฅเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเน€เธฅเธทเธญเธ Checkbox เธกเธฒเธฃเธงเธกเธญเธขเธนเนเนเธเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP เนเธ•เนเธฅเธฐเธชเธ–เธฒเธเธฐเนเธฅเธฐเธ—เธฑเนเธเธซเธกเธ” เธเธฃเนเธญเธกเนเธชเธ”เธเธญเธฑเธเธฉเธฃเธชเธตเธเนเธฒเนเธฅเธฐเธเธทเนเธเธซเธฅเธฑเธเธชเธตเธเธดเน€เธจเธฉเธ•เธฒเธกเธชเธตเธชเธ–เธฒเธเธฐ SAP',
      targetSubject: 'เธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP (#wbsSapSummarySection) เนเธฅเธฐเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเน€เธฅเธทเธญเธ (#wbsSelectedSummaryCard)',
      storageFile: 'css/styles.css, js/wbs.js & js/data_history.js',
      changeSummary: '1) เธขเนเธฒเธขเธเนเธญเธกเธนเธฅเธเธฒเธฃเน€เธฅเธทเธญเธ Checkbox เธเธฒเธเธเธฒเธฃเนเธ”เธ”เนเธฒเธเธฅเนเธฒเธเธเธถเนเธเธกเธฒเธฃเธงเธกเนเธงเนเนเธเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP เธ”เนเธฒเธเธเธ เธ—เธฑเนเธเธเธฒเธฃเนเธ” "เธ—เธฑเนเธเธซเธกเธ”" เนเธฅเธฐเธเธฒเธฃเนเธ”เนเธขเธเนเธ•เนเธฅเธฐเธชเธ–เธฒเธเธฐเธ•เธฃเธเธ•เธฒเธกเธชเธต 2) เน€เธเธดเนเธกเธเธฅเนเธญเธเนเธชเธ”เธเธเธฅเธ”เนเธฒเธเธฅเนเธฒเธเธเธญเธเธเธฒเธฃเนเธ”เนเธ•เนเธฅเธฐเนเธ เธ”เนเธงเธขเธญเธฑเธเธฉเธฃเธชเธตเธเนเธฒ (#38BDF8) เนเธชเธ”เธเธเธณเธเธงเธเธเธฒเธเนเธฅเธฐเธกเธนเธฅเธเนเธฒ AUC เธ—เธตเนเน€เธฅเธทเธญเธ เนเธฅเธฐเธกเธตเธเธทเนเธเธซเธฅเธฑเธเธชเธตเธเธดเน€เธจเธฉเธชเธงเนเธฒเธเน€เธ”เนเธเธเธถเนเธเธกเธฒเธ•เธฒเธกเธชเธตเธชเธ–เธฒเธเธฐ SAP เน€เธกเธทเนเธญเธกเธตเธฃเธฒเธขเธเธฒเธฃเน€เธฅเธทเธญเธ (ALL เธชเธตเธเนเธฒ, CLSD เธชเธตเน€เธเธตเธขเธงเธกเธดเนเธเธ—เน, TECO เธชเธตเน€เธซเธฅเธทเธญเธเธญเธณเธเธฑเธ, REL เธชเธตเนเธ”เธ) 3) เธเธฃเธฑเธเธเธฃเธธเธเนเธซเนเธเธฒเธฃเนเธ”เธชเธฃเธธเธ Checkbox เธ”เนเธฒเธเธฅเนเธฒเธเธเนเธญเธเธเธฒเธฃเนเธ”เธขเนเธญเธขเธ—เธตเนเธเนเธณเธเนเธญเธ เธเธเนเธงเนเน€เธเธเธฒเธฐเนเธ–เธ Progress Bar เธชเธฃเธธเธเธ เธฒเธเธฃเธงเธกเนเธเธเธเธฐเธ—เธฑเธ”เธฃเธฑเธ”เน€เธกเธทเนเธญเธกเธตเธเธฒเธเธ—เธตเนเน€เธฅเธทเธญเธ เนเธฅเธฐเธเนเธญเธเธญเธฑเธ•เนเธเธกเธฑเธ•เธดเน€เธกเธทเนเธญเนเธกเนเธกเธตเธเธฒเธฃเน€เธฅเธทเธญเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ 3 เธเนเธญเธญเธขเนเธฒเธเธชเธกเธเธนเธฃเธ“เนเนเธเธ: 1) เนเธ js/wbs.js เธเธฃเธฑเธเธเธฃเธธเธเธเธฑเธเธเนเธเธฑเธ renderWbsSapSummary เนเธซเนเธ•เธฃเธงเธเธเธฑเธเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเธ–เธนเธเน€เธฅเธทเธญเธ Checkbox (wbsState.selectedWbs) เธ—เธฑเนเธเธขเธญเธ”เธฃเธงเธกเธ—เธฑเนเธเธซเธกเธ”เนเธฅเธฐเนเธขเธเธ•เธฒเธกเนเธ•เนเธฅเธฐเธชเธ–เธฒเธเธฐ SAP 2) เน€เธเธดเนเธกเธเธฅเนเธญเธเธขเนเธญเธข .wbs-sap-card-cb-box เธ เธฒเธขเนเธเธเธฒเธฃเนเธ”เนเธ•เนเธฅเธฐเนเธ เนเธ”เธขเนเธเนเธ•เธฑเธงเธญเธฑเธเธฉเธฃเธชเธตเธเนเธฒ (#38BDF8 / #67E8F9) เนเธชเธ”เธเธเธณเธเธงเธเธเธฒเธเนเธฅเธฐเธกเธนเธฅเธเนเธฒเธ—เธตเนเน€เธฅเธทเธญเธ เธเธฃเนเธญเธกเธเนเธฒเธขเนเธ—เนเธเนเธญเธเธญเธเน€เธฅเธทเธญเธเธเธฐเธ—เธฑเธ”เธฃเธฑเธ” 3) เนเธ css/styles.css เธเธณเธซเธเธ”เธเธฅเธฒเธช .has-selection เนเธฅเธฐ .no-selection เนเธ”เธขเน€เธกเธทเนเธญเธกเธตเธเธฒเธเธ–เธนเธเน€เธฅเธทเธญเธเธเธฐเนเธชเธ”เธเธเธทเนเธเธซเธฅเธฑเธ Gradient เธชเธตเธเธดเน€เธจเธฉ เธเธญเธเน€เธฃเธทเธญเธเนเธชเธ เนเธฅเธฐเน€เธเธฒ Box-shadow เธ•เธฒเธกเธชเธตเธเธญเธเนเธ•เนเธฅเธฐเธชเธ–เธฒเธเธฐ SAP (cat-all, cat-clsd, cat-teco, cat-rel) เธเธฃเนเธญเธกเธฃเธญเธเธฃเธฑเธเธ—เธฑเนเธ Dark เนเธฅเธฐ Light Theme 4) เธเธฃเธฑเธเธเธฃเธธเธ toggleWbsRowCheckbox เนเธซเนเน€เธฃเธตเธขเธ renderWbsSapSummary เนเธเธ Reactive เธญเธฑเธเน€เธ”เธ•เธเธฒเธฃเนเธ” SAP เธ—เธฑเธเธ—เธตเธ—เธตเนเธเธฅเธดเธ Checkbox เนเธเธ•เธฒเธฃเธฒเธ 5) เธเธฃเธฑเธเธเธฃเธธเธ renderWbsSelectedSummaryCard เนเธซเนเธเธณ cardsHtml เธเนเธณเธเนเธญเธเธญเธญเธ เธเธเนเธงเนเน€เธเธเธฒเธฐเนเธ–เธเธชเธฃเธธเธ Progress Bar เธ—เธตเนเน€เธเธฃเธตเธขเธงเธเธฒเธเธชเธงเธขเธเธฒเธก เนเธฅเธฐเธเนเธญเธเน€เธกเธทเนเธญเนเธกเนเธกเธตเธเธฒเธฃเน€เธฅเธทเธญเธ (selectedCount === 0)',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (1..เนเธซเนเธขเนเธฒเธขเธเนเธญเธกเธนเธฅเนเธเธเธฒเธฃเนเธ” เธ—เธตเนเน€เธฅเธทเธญเธ check box เนเธเนเธงเนเนเธเธเธฒเธฃเนเธ” เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ sap เนเธซเนเธ•เธฃเธเธ•เธฒเธกเธเธฒเธฃเนเธ”เธชเธ–เธฒเธเธฐ sap เนเธฅเธฐเธชเธ–เธฒเธเธฐเธ—เธฑเนเธเธซเธกเธ”เธ”เนเธงเธข 2.เน€เธกเธทเนเธญเธฃเธงเธกเนเธเธเธฒเธฃเนเธ”เน€เธ”เธตเธขเธงเธเธฑเธเนเธฅเนเธง เนเธซเนเธเนเธฒเธเธฅเนเธฒเธเธเธฒเธฃเนเธ”เนเธชเธ”เธเธเนเธญเธกเธนเธฅเธ—เธตเนเน€เธฅเธทเธญเธ check box เธ”เนเธงเธขเธญเธฑเธเธฉเธฃเธชเธตเธเนเธฒ เธกเธตเธเธณเธเธงเธเธเธฒเธ/เธกเธนเธฅเธเนเธฒ เนเธฅเธฐเธกเธตเธเธทเนเธเธซเธฅเธฑเธเธชเธตเธเธดเน€เธจเธฉเธเธถเนเธเธกเธฒเธ•เธฒเธกเธชเธตเธชเธ–เธฒเธเธฐ sap 3.เธเธฑเธ”เธฃเธนเธเนเธเธเธชเธตเธชเธงเธขเธเธฒเธก เธชเธกเธชเนเธงเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธเนเธเธฃเธเธชเธฃเนเธฒเธเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP เนเธซเนเนเธชเธ”เธเธเธฅเธฃเธงเธกเธฃเธฒเธขเธเธฒเธฃ Checkbox เนเธเธ All-in-one)'
    },
    {
      id: 'log_000_wbs_show_selected_auc_total_and_move_status_to_title',
      timestamp: '2026-10-18 14:10:00',
      timestampTh: '18 เธ•.เธ. 2569, 14:10 เธ.',
      type: 'EDIT',
      typeBadge: 'เนเธชเธ”เธเธกเธนเธฅเธเนเธฒเธฃเธงเธกเธ—เธตเนเน€เธฅเธทเธญเธ',
      badgeClass: 'badge-type-edit',
      title: 'เนเธชเธ”เธเธเนเธฒเธขเธกเธนเธฅเธเนเธฒเธฃเธงเธก (AUC) เธ—เธตเนเน€เธฅเธทเธญเธเธเธเธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฃเธฒเธเนเธ—เนเธ WBS เนเธฅเธฐเนเธชเธ”เธเธเธทเนเธญเธชเธ–เธฒเธเธฐเธ—เธตเนเน€เธฅเธทเธญเธเธเธฃเธเธ–เนเธงเธเธ”เนเธฒเธเธเธ',
      targetSubject: 'เธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฃเธฒเธเนเธ—เนเธ WBS (#wbsOfficesChartTitle & #wbsOfficesChartAucBadge)',
      storageFile: 'index.html, js/wbs.js & js/data_history.js',
      changeSummary: '1) เน€เธเธดเนเธกเธเนเธฒเธขเนเธ—เนเธเธชเธตเธเนเธฒเธชเธ”เนเธช (#wbsOfficesChartAucBadge) เนเธชเธ”เธ "เธกเธนเธฅเธเนเธฒเธฃเธงเธก: เธฟ..." เธ•เนเธญเธ—เนเธฒเธขเธเนเธฒเธขเธเธณเธเธงเธเธซเธเนเธงเธขเธเธฒเธเนเธฅเธฐเธเธฒเธเธเธเน€เธซเธฅเธทเธญเธเธเธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฃเธฒเธเนเธ—เนเธ WBS เนเธเธ Real-time เธ•เธฒเธกเธชเธ–เธฒเธเธฐเธ—เธตเนเธ–เธนเธเน€เธฅเธทเธญเธ 2) เธเธฃเธฑเธเธเธฃเธธเธเธเธทเนเธญเธซเธฑเธงเน€เธฃเธทเนเธญเธเธเธฒเธฃเนเธ”เธเธฃเธฒเธ (#wbsOfficesChartTitle) เนเธซเนเนเธชเธ”เธเธฃเธฒเธขเธเธทเนเธญเธชเธ–เธฒเธเธฐ SAP เธ—เธตเนเธ–เธนเธเน€เธฅเธทเธญเธเธ—เธฑเนเธเธซเธกเธ”เธญเธขเนเธฒเธเธเธฃเธเธ–เนเธงเธเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธขเนเธฒเธขเธ”เนเธฒเธเธเธ) เนเธ”เธขเนเธกเนเธ•เธฑเธ”เธ—เธญเธเธ”เนเธงเธขเน€เธเธฃเธทเนเธญเธเธซเธกเธฒเธข ... 3) เธเธณเธเนเธฒเธขเธชเธ–เธฒเธเธฐเธเนเธณเธเนเธญเธเธญเธญเธเธเธฒเธเนเธ–เธงเธเธณเนเธเธฐเธเธณเธ”เนเธฒเธเธฅเนเธฒเธเธเธฒเธฃเนเธ” เน€เธเธทเนเธญเธฃเธฑเธเธฉเธฒเธเธงเธฒเธกเธชเธฐเธญเธฒเธ”เธ•เธฒเนเธฅเธฐเน€เธเนเธเธฃเธฐเน€เธเธตเธขเธเธเธญเธเธซเธเนเธฒเธเธญ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ 2 เธชเนเธงเธ: 1) เนเธ index.html เน€เธเธดเนเธกเนเธ—เนเธ <span id="wbsOfficesChartAucBadge" class="tab-badge"> เธชเนเธ•เธฅเนเธชเธตเธเนเธฒเน€เธฃเธทเธญเธเนเธชเธ (rgba(56,189,248,0.18)) เนเธงเนเธเนเธฒเธเธเธงเธฒเธเธญเธเธเนเธฒเธขเธเธณเธเธงเธเธเธฒเธเธเธเน€เธซเธฅเธทเธญ 2) เนเธ js/wbs.js เธเธฃเธฑเธเธเธฑเธเธเนเธเธฑเธ renderTopOfficesChart เนเธซเนเธญเนเธฒเธเนเธฅเธฐเธฃเธงเธกเธขเธญเธ” cn41ActualCost เนเธขเธเธ•เธฒเธกเธซเธเนเธงเธขเธเธฒเธเนเธฅเธฐเธขเธญเธ”เธฃเธงเธกเธ—เธฑเนเธเธซเธกเธ”เธเธญเธเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเธเธณเธฅเธฑเธเธเธฃเธญเธ เธเธฒเธเธเธฑเนเธเธญเธฑเธเน€เธ”เธ• aucBadgeEl เนเธชเธ”เธเธเธฅ เน€เธเนเธ "เธกเธนเธฅเธเนเธฒเธฃเธงเธก: เธฟ1,554,614.97" เธ—เธฑเธเธ—เธต 3) เธเธฃเธฑเธเธเธฃเธธเธเธเธฒเธฃเธเธณเธซเธเธ” titleEl.textContent เนเธซเนเธเธณ activeSapList เธกเธฒเน€เธเธทเนเธญเธกเธ”เนเธงเธขเน€เธเธฃเธทเนเธญเธเธซเธกเธฒเธขเธเธธเธฅเธ เธฒเธเนเธเธเธเธฃเธเธ–เนเธงเธ ("เธเธญเธ/เธเธเธ. เธ—เธตเนเธกเธตเธเธฒเธเธชเธ–เธฒเธเธฐ: TECO D3, TECO D2") 4) เธเธฃเธฑเธเธเธฃเธธเธ renderWbsSapSummary เนเธซเนเนเธ–เธ actions เนเธชเธ”เธเธเนเธญเธเธงเธฒเธกเนเธเธฐเธเธณเธญเธขเนเธฒเธเธเธเธ—เธตเน เธเธฅเธตเธ เธชเธงเธขเธเธฒเธก',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธขเนเธฒเธขเธ”เนเธฒเธเธเธ, เนเธชเธ”เธเธกเธนเธฅเธเนเธฒเธฃเธงเธก เธ—เธตเนเน€เธฅเธทเธญเธเธ”เนเธงเธข)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เน€เธเธดเนเธกเธเธฒเธฃเนเธชเธ”เธเธเธฅเธกเธนเธฅเธเนเธฒเน€เธเธดเธเธฃเธงเธกเธ—เธตเนเน€เธฅเธทเธญเธเธเธเธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฃเธฒเธเนเธ—เนเธเนเธเธเนเธ”เธเธฒเธกเธดเธ)'
    },
    {
      id: 'log_000_wbs_add_select_all_sap_cards_btn_and_reorder_sections',
      timestamp: '2026-10-18 14:00:00',
      timestampTh: '18 เธ•.เธ. 2569, 14:00 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธธเนเธกเน€เธฅเธทเธญเธเธ—เธธเธเธชเธ–เธฒเธเธฐ & เธเธฑเธ”เธฅเธณเธ”เธฑเธเธเธฒเธฃเนเธ”',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธดเนเธกเธเธธเนเธกเน€เธฅเธทเธญเธเธเธฒเธฃเนเธ”เธ—เธธเธเธชเธ–เธฒเธเธฐ, เธเธฃเธฑเธเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธฅเนเธฒเธเธ—เธฑเนเธเธเธฒเธฃเนเธ”เนเธฅเธฐเธเธฃเธฒเธ, เธขเนเธฒเธขเนเธ–เธเน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธ KPI 5 เนเธงเนเธเธเธชเธธเธ” เนเธฅเธฐเธขเนเธฒเธขเธซเธฑเธงเธเนเธญเธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP เธเธฅเธฑเธเนเธงเนเธเธเธเธฒเธฃเนเธ”',
      targetSubject: 'เนเธ–เธเน€เธเธฃเธทเนเธญเธเธกเธทเธญเธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฃเธฒเธ (#wbsOfficeChartSelectAllBtn), เธเธฒเธฃเนเธ”เธชเธฃเธธเธเน€เธเนเธฒเธซเธกเธฒเธข KPI 5 (#wbsTargetComparisonSection) เนเธฅเธฐเธชเนเธงเธเธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP (#wbsSapSummarySection)',
      storageFile: 'index.html, css/styles.css, js/wbs.js & js/data_history.js',
      changeSummary: '1) เน€เธเธดเนเธกเธเธธเนเธก "เน€เธฅเธทเธญเธเธ—เธธเธเธชเธ–เธฒเธเธฐ" เธชเธตเธเนเธฒเธชเธ”เนเธช (.btn-wbs-card-select-all) เนเธงเนเธ”เนเธฒเธเธเธเธเธงเธฒเธเนเธฒเธเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅ เน€เธกเธทเนเธญเธเธฅเธดเธเธเธฐเน€เธฅเธทเธญเธเธเธฒเธฃเนเธ”เธชเธ–เธฒเธเธฐ SAP เธ—เธธเธเนเธเนเธซเน Active เธ—เธฑเธเธ—เธต 2) เธเธฃเธฑเธเธเธฃเธธเธเธเธฑเธเธเนเธเธฑเธ clearAllWbsSelection เนเธซเนเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธณเธเธฒเธฃเธฅเนเธฒเธเธ—เธฑเนเธเธเธฒเธฃเน€เธฅเธทเธญเธเธชเธ–เธฒเธเธฐเธเธฒเธฃเนเธ”, เธเธฃเธญเธเธซเธเนเธงเธขเธเธฒเธเธเธเธเธฃเธฒเธ เนเธฅเธฐเธฃเธฒเธขเธเธฒเธฃ Checkbox เธเธฃเนเธญเธกเธเธฑเธเนเธเธเธฅเธดเธเน€เธ”เธตเธขเธง 3) เธขเนเธฒเธขเธเธฒเธฃเนเธ”เน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธเธเธฒเธฃเธเธดเธ”เธกเธนเธฅเธเนเธฒเธ•เธฒเธกเน€เธเนเธฒเธซเธกเธฒเธขเธฃเธฐเธ”เธฑเธ KPI 5 เธเธถเนเธเนเธเนเธงเนเธ”เนเธฒเธเธเธเธชเธธเธ”เน€เธซเธเธทเธญเธเธฒเธฃเนเธ”เธเธฃเธฒเธเนเธ—เนเธ WBS 4) เธขเนเธฒเธขเนเธ–เธเธซเธฑเธงเธเนเธญเนเธฅเธฐเธเธณเนเธเธฐเธเธณเธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP เธเธฅเธฑเธเธเธถเนเธเนเธเนเธงเนเธ”เนเธฒเธเธเธเธเธฒเธฃเนเธ”เธชเธ–เธฒเธเธฐเน€เธซเธกเธทเธญเธเน€เธ”เธดเธก',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ 4 เธชเนเธงเธ: 1) เนเธ index.html เนเธฅเธฐ css/styles.css เน€เธเธดเนเธกเธเธธเนเธก .btn-wbs-card-select-all เธชเธตเธเนเธฒ Gradient (#2563EB - #1D4ED8) เธเธญเธเน€เธฃเธทเธญเธเนเธชเธเธเธฃเนเธญเธกเนเธญเธเธญเธ Check-check เธชเธฑเนเธเธเธฑเธเธเนเธเธฑเธ selectAllWbsSapStatuses เน€เธฅเธทเธญเธเธชเธ–เธฒเธเธฐ SAP เธ—เธธเธเธเธฃเธฐเน€เธ เธ—เธ—เธตเนเธเธเนเธเธฃเธฐเธเธ 2) เธเธฃเธฑเธเธเธฃเธธเธ clearAllWbsSelection เนเธ js/wbs.js เนเธซเนเธฅเนเธฒเธ wbsState.selectedSapStatuses, wbsState.sapStatus = "ALL", wbsState.office = "ALL", wbsOfficeFilterSelect.value = "ALL" เนเธฅเธฐ wbsState.selectedWbs.clear() เธ—เธณเนเธซเนเธ—เธฑเนเธเธเธฒเธฃเนเธ”เนเธฅเธฐเธเธฃเธฒเธเธเธทเธเธเนเธฒเธเธฅเธฑเธเธชเธนเนเธเนเธฒเน€เธฃเธดเนเธกเธ•เนเธเธ—เธฑเนเธเธซเธกเธ” 3) เธขเนเธฒเธข #wbsTargetComparisonSection เธเธถเนเธเนเธเธญเธขเธนเนเธ”เนเธฒเธเธเธเธชเธธเธ”เนเธ•เนเนเธ–เธเธ•เธฑเธงเธเธฃเธญเธเธซเธฅเธฑเธ 4) เธเธฃเธฑเธเธเธฃเธธเธ renderWbsSapSummary เนเธซเน headerHtml เนเธชเธ”เธเธเธฅเธเนเธญเธ cardsHtml เธ—เธณเนเธซเนเธซเธฑเธงเน€เธฃเธทเนเธญเธเนเธฅเธฐเธเธณเนเธเธฐเธเธณเธญเธขเธนเนเธ”เนเธฒเธเธเธเธเธฒเธฃเนเธ”เธชเธ–เธฒเธเธฐเธ•เธฒเธกเน€เธ”เธดเธก',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธเธทเธกเธเธธเนเธกเน€เธฅเธทเธญเธเธเธฒเธฃเนเธ” เธ—เธธเธเธชเธ–เธฒเธเธฐเธ—เธฑเนเธเธซเธกเธ” เนเธงเนเธ”เนเธฒเธเธเธ, เธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅ เนเธซเนเธฅเนเธฒเธเธ—เธฑเนเธเธชเธ–เธฒเธเธฐเธเธฒเธฃเนเธ” เนเธฅเธฐเธเธฃเธฒเธ, เธขเนเธฒเธข เน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธเธเธฒเธฃเธเธดเธ”เธกเธนเธฅเธเนเธฒเธ•เธฒเธกเน€เธเนเธฒเธซเธกเธฒเธขเธฃเธฐเธ”เธฑเธ KPI 5 เนเธงเนเธ”เนเธฒเธเธเธ, เธขเนเธฒเธขเนเธงเนเธ”เนเธฒเธเธเธเน€เธซเธกเธทเธญเธเน€เธ”เธดเธก)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธเธเธฑเธเธเนเธเธฑเธเธเธฒเธฃเน€เธฅเธทเธญเธ/เธฅเนเธฒเธเธชเธ–เธฒเธเธฐ เนเธฅเธฐเธเธฒเธฃเธเธฑเธ”เธงเธฒเธเนเธเธฃเธเธชเธฃเนเธฒเธ Layout เธเธเธซเธเนเธฒเธเธญ WBS เธเธเน€เธซเธฅเธทเธญ)'
    },
    {
      id: 'log_000_wbs_chart_filter_by_selected_sap_status_card',
      timestamp: '2026-10-18 13:45:00',
      timestampTh: '18 เธ•.เธ. 2569, 13:45 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธญเธเธเธฃเธฒเธเธ•เธฒเธกเธเธฒเธฃเนเธ” SAP',
      badgeClass: 'badge-type-edit',
      title: 'เธเธฃเธฑเธเธเธฃเธธเธเนเธซเนเธเธฃเธฒเธเนเธ—เนเธ WBS เนเธชเธ”เธเน€เธเธเธฒเธฐเธชเธ–เธฒเธเธฐ SAP เธ—เธตเนเธ–เธนเธเน€เธฅเธทเธญเธเธเธฒเธเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐเธ—เธธเธเน เธชเธ–เธฒเธเธฐ',
      targetSubject: 'เธเธฃเธฒเธเนเธ—เนเธ เธเธญเธ/เธเธเธ. เธ—เธตเนเธกเธตเธเธฒเธ WBS เธเธเน€เธซเธฅเธทเธญ (#wbsOfficesBarChart)',
      storageFile: 'js/wbs.js & js/data_history.js',
      changeSummary: 'เน€เธกเธทเนเธญเธเธนเนเนเธเนเธเธฒเธเธเธฅเธดเธเน€เธฅเธทเธญเธเธเธฒเธฃเนเธ”เธชเธ–เธฒเธเธฐ SAP เนเธ”เน (เน€เธเนเธ TECO D3, CLSD F4, เธซเธฃเธทเธญเธซเธฅเธฒเธขเธชเธ–เธฒเธเธฐเธเธฃเนเธญเธกเธเธฑเธ) เธเธฃเธฒเธเนเธ—เนเธ WBS เธเธฐเธเธฃเธญเธเนเธฅเธฐเนเธชเธ”เธเธเธฅเน€เธเธเธฒเธฐเธเนเธญเธกเธนเธฅเธเธฒเธเนเธฅเธฐเธซเธเนเธงเธขเธเธฒเธเธ—เธตเนเธกเธตเธชเธ–เธฒเธเธฐ SAP เธ•เธฒเธกเธ—เธตเนเน€เธฅเธทเธญเธเนเธเธเธฒเธฃเนเธ”เน€เธ—เนเธฒเธเธฑเนเธ เธเธฃเนเธญเธกเธญเธฑเธเน€เธ”เธ•เธซเธฑเธงเน€เธฃเธทเนเธญเธเนเธฅเธฐเธเนเธฒเธขเธชเธฃเธธเธเธเธณเธเธงเธเธซเธเนเธงเธขเธเธฒเธ/เธเธฒเธเธเธเน€เธซเธฅเธทเธญเนเธซเนเธชเธญเธ”เธเธฅเนเธญเธเธเธฑเธเนเธเธ Real-time',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธซเธฒเธเน€เธฅเธทเธญเธเธชเธ–เธฒเธเธฐsapเธ—เธตเนเธเธฒเธฃเนเธ” เนเธซเนเธเธฃเธฒเธเนเธชเธ”เธเน€เธเธเธฒเธฐเธ—เธตเนเน€เธฅเธทเธญเธเนเธเธเธฒเธฃเนเธ” เธ—เธธเธเน เธชเธ–เธฒเธเธฐ): 1) เนเธเธเธฑเธเธเนเธเธฑเธ renderWbsTab เธเธฃเธฑเธเธเธฒเธฃเธชเนเธเธเนเธญเธกเธนเธฅเนเธซเน renderWbsCharts เนเธ”เธขเธ•เธฃเธงเธเธชเธญเธเน€เธเธทเนเธญเธเนเธ hasSapFilter เธซเธฒเธเธกเธตเธเธฒเธฃเน€เธฅเธทเธญเธเธชเธ–เธฒเธเธฐ SAP เนเธซเนเนเธเน getFilteredWbsData(true, false) เน€เธเธทเนเธญเธชเนเธเน€เธเธเธฒเธฐเธเธธเธ”เธเนเธญเธกเธนเธฅเธ—เธตเนเธเนเธฒเธเธเธฒเธฃเธเธฃเธญเธเธชเธ–เธฒเธเธฐ SAP เน€เธเนเธฒเธชเธนเนเธเธฃเธฒเธเนเธ—เนเธ 2) เธเธฃเธฑเธเธเธฃเธธเธเธเธฑเธเธเนเธเธฑเธ renderTopOfficesChart เนเธซเนเธซเธฑเธงเน€เธฃเธทเนเธญเธเธเธฒเธฃเนเธ” (#wbsOfficesChartTitle) เนเธชเธ”เธเธเธทเนเธญเธชเธ–เธฒเธเธฐ SAP เธ—เธตเนเธเธณเธฅเธฑเธเธเธฃเธญเธเธญเธขเนเธฒเธเธเธฑเธ”เน€เธเธ (เน€เธเนเธ "เธเธญเธ/เธเธเธ. เธ—เธตเนเธกเธตเธเธฒเธเธชเธ–เธฒเธเธฐ TECO D3") เนเธฅเธฐเธญเธฑเธเน€เธ”เธ•เธเนเธฒเธขเธ•เธฑเธงเน€เธฅเธเธเธณเธเธงเธเธซเธเนเธงเธขเธเธฒเธเนเธฅเธฐเธเธฒเธเธเธเน€เธซเธฅเธทเธญเนเธซเนเธ•เธฃเธเธเธฑเธเธเนเธญเธกเธนเธฅเธ—เธตเนเนเธชเธ”เธ 3) เธฃเธญเธเธฃเธฑเธเธเธฒเธฃเน€เธฅเธทเธญเธเธเธฃเนเธญเธกเธเธฑเธเธซเธฅเธฒเธขเธชเธ–เธฒเธเธฐ (Multi-selection) เนเธฅเธฐเน€เธกเธทเนเธญเธเธฅเธดเธเธเธฒเธฃเนเธ” "เธ—เธฑเนเธเธซเธกเธ”" เธซเธฃเธทเธญเธเธธเนเธก "เธฅเนเธฒเธเธเนเธญเธกเธนเธฅ" เธเธฃเธฒเธเธเธฐเธเธฅเธฑเธเธกเธฒเนเธชเธ”เธเธเธฅเธเธฃเธเธ—เธธเธเธซเธเนเธงเธขเธเธฒเธเนเธฅเธฐเธ—เธธเธเธชเธ–เธฒเธเธฐเธ—เธฑเธเธ—เธต',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธซเธฒเธเน€เธฅเธทเธญเธเธชเธ–เธฒเธเธฐsapเธ—เธตเนเธเธฒเธฃเนเธ” เนเธซเนเธเธฃเธฒเธเนเธชเธ”เธเน€เธเธเธฒเธฐเธ—เธตเนเน€เธฅเธทเธญเธเนเธเธเธฒเธฃเนเธ” เธ—เธธเธเน เธชเธ–เธฒเธเธฐ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธเธเธฑเธเธเนเธเธฑเธเธเธฒเธฃเน€เธเธทเนเธญเธกเนเธขเธเธเธฒเธฃเธเธฃเธญเธเธเนเธญเธกเธนเธฅเธฃเธฐเธซเธงเนเธฒเธเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP เนเธฅเธฐเธเธฃเธฒเธเนเธ—เนเธ WBS)'
    },
    {
      id: 'log_000_wbs_remove_btn_clear_sap_all',
      timestamp: '2026-10-18 13:38:00',
      timestampTh: '18 เธ•.เธ. 2569, 13:38 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธณเธเธธเนเธกเนเธชเธ”เธเธ—เธฑเนเธเธซเธกเธ”เธญเธญเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธณเธเธธเนเธก "โ• เนเธชเธ”เธเธ—เธฑเนเธเธซเธกเธ”" เนเธเนเธ–เธเธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP เธญเธญเธเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ',
      targetSubject: 'เนเธ–เธเธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP (#wbsSapSummarySection) เนเธเนเธ—เนเธ WBS เธเธเน€เธซเธฅเธทเธญ',
      storageFile: 'js/wbs.js & js/data_history.js',
      changeSummary: 'เธเธณเธเธธเนเธก "โ• เนเธชเธ”เธเธ—เธฑเนเธเธซเธกเธ”" (.btn-wbs-sap-clear) เธญเธญเธเธเธฒเธเนเธ–เธเธเธณเนเธเธฐเธเธณเนเธ•เนเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP เน€เธเธทเนเธญเธฅเธ”เธเธงเธฒเธกเธเนเธณเธเนเธญเธ เน€เธเธทเนเธญเธเธเธฒเธเธฃเธฐเธเธเธกเธตเธเธธเนเธก "เธฅเนเธฒเธเธเนเธญเธกเธนเธฅ" เธชเธตเนเธ”เธเธซเธฅเธฑเธเธเธเธซเธฑเธงเธเธฒเธฃเนเธ” เนเธฅเธฐเธเธฒเธฃเนเธ” "เธ—เธฑเนเธเธซเธกเธ”" เนเธซเนเธเธฅเธดเธเนเธเนเธเธฒเธเนเธ”เนเธญเธขเนเธฒเธเธชเธฐเธ”เธงเธเธญเธขเธนเนเนเธฅเนเธง',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธญเธฒเธญเธญเธ - เธเธฃเนเธญเธกเธฃเธนเธเธเธธเนเธก "โ• เนเธชเธ”เธเธ—เธฑเนเธเธซเธกเธ”"): เธฅเธเธเธธเนเธก .btn-wbs-sap-clear เนเธ headerHtml เธเธญเธเธเธฑเธเธเนเธเธฑเธ renderWbsSapSummary เธเธเน€เธซเธฅเธทเธญเน€เธเธเธฒเธฐเธเนเธฒเธขเนเธเนเธเธชเธ–เธฒเธเธฐเธเธฒเธฃเธเธฃเธญเธ (.wbs-sap-active-pill) เธ—เธณเนเธซเนเนเธ–เธเธเธณเนเธเธฐเธเธณเธ”เนเธฒเธเธฅเนเธฒเธเธเธฒเธฃเนเธ”เธเธฃเธฐเธเธฑเธ เธเธฅเธตเธ เนเธฅเธฐเธชเธงเธขเธเธฒเธกเธฅเธเธ•เธฑเธง',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธญเธฒเธญเธญเธ - เธ เธฒเธเธเธธเนเธก โ• เนเธชเธ”เธเธ—เธฑเนเธเธซเธกเธ”)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเนเธ•เนเธ UI เธเธณเธเธธเนเธกเธเนเธณเธเนเธญเธเธญเธญเธ)'
    },
    {
      id: 'log_000_wbs_stripes_teco_d2_rel_c3_and_move_sap_title_below_cards',
      timestamp: '2026-10-18 13:35:00',
      timestampTh: '18 เธ•.เธ. 2569, 13:35 เธ.',
      type: 'EDIT',
      typeBadge: 'เน€เธเธดเนเธกเธฅเธฒเธขเน€เธชเนเธ TECO D2/REL C3 & เธขเนเธฒเธขเธเนเธญเธเธงเธฒเธกเนเธ•เนเธเธฒเธฃเนเธ”',
      badgeClass: 'badge-type-edit',
      title: 'เธขเนเธฒเธขเนเธ–เธเธซเธฑเธงเธเนเธญ/เธเธณเนเธเธฐเธเธณเธชเธ–เธฒเธเธฐ SAP เนเธงเนเธ”เนเธฒเธเธฅเนเธฒเธเธเธฒเธฃเนเธ” เนเธฅเธฐเน€เธเธดเนเธกเธฅเธฒเธขเน€เธชเนเธเธ—เธฒเธเน€เธเธตเธขเธเนเธซเน TECO D2 เนเธฅเธฐ REL C3 เน€เธซเธกเธทเธญเธ CLSD F4 เนเธ”เธขเธเธเธชเธตเน€เธ”เธดเธก',
      targetSubject: 'เธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP (#wbsSapSummarySection) เนเธฅเธฐเธเธฃเธฒเธเนเธ—เนเธ WBS (#wbsOfficesBarChart)',
      storageFile: 'js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: '1) เธขเนเธฒเธขเนเธ–เธงเธเนเธญเธเธงเธฒเธกเธซเธฑเธงเธเนเธญเนเธฅเธฐเธเธณเนเธเธฐเธเธณเธเธฒเธฃเธเธฅเธดเธเธเธฃเธญเธเนเธเนเธงเนเธ”เนเธฒเธเธฅเนเธฒเธเนเธ–เธงเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP เธ•เธฒเธกเนเธเธงเธฅเธนเธเธจเธฃเธชเธตเนเธ”เธ 2) เน€เธเธดเนเธกเธฅเธงเธ”เธฅเธฒเธขเธ—เธฒเธเน€เธเธตเธขเธ 45 เธญเธเธจเธฒ (Stripe Pattern) เนเธซเนเธเธฑเธเธชเธ–เธฒเธเธฐ TECO D2 (เธชเธตเน€เธซเธฅเธทเธญเธเธญเธณเธเธฑเธเธเธเน€เธ”เธดเธก) เนเธฅเธฐ REL C3 (เธชเธตเนเธ”เธเธเธญเธฃเธฑเธฅเธเธเน€เธ”เธดเธก) เธ—เธฑเนเธเนเธเนเธ—เนเธเธเธฃเธฒเธ Canvas เนเธฅเธฐเธเธเธเนเธฒเธข Badge เธเธญเธเธเธฒเธฃเนเธ” เนเธซเนเน€เธซเธกเธทเธญเธเธเธฑเธเธชเธ–เธฒเธเธฐ CLSD F4',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ 2 เธชเนเธงเธ: 1) เธเธฃเธฑเธเธเธฃเธธเธเธฅเธณเธ”เธฑเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเนเธ renderWbsSapSummary เนเธซเน cardsHtml เนเธชเธ”เธเธเธฅเธเนเธญเธ headerHtml เธเธฃเนเธญเธกเธเธฃเธฑเธเนเธ•เนเธเน€เธชเนเธเธเธฑเนเธเธเธฃเธฐเนเธฅเธฐเธฃเธฐเธขเธฐเธซเนเธฒเธ CSS เธ—เธณเนเธซเนเธเธฒเธฃเนเธ”เธ—เธฑเนเธ 10 เนเธเธญเธขเธนเนเธ•เธดเธ”เธเธฑเธเธซเธฑเธงเธเธฒเธฃเนเธ”เธซเธฅเธฑเธ เนเธฅเธฐเธกเธตเธเธณเธญเธเธดเธเธฒเธขเธเธฃเนเธญเธกเธเธณเนเธเธฐเธเธณเธเธฃเธญเธเธเธณเธเธฑเธเธญเธขเธนเนเธ”เนเธฒเธเธฅเนเธฒเธเธญเธขเนเธฒเธเน€เธเนเธเธฃเธฐเน€เธเธตเธขเธ 2) เธเธฃเธฑเธเธเธฃเธธเธเธเธฑเธเธเนเธเธฑเธ getSapSegmentStyle เนเธซเนเธชเธ–เธฒเธเธฐ TECO D2 เนเธฅเธฐ REL C3 เธกเธตเธเธธเธ“เธชเธกเธเธฑเธ•เธด hasPattern: true เนเธฅเธฐเน€เธชเนเธเธเธญเธเธซเธเธฒ 1.5px (เน€เธซเธกเธทเธญเธ CLSD F4) 3) เนเธเธเธฃเธฒเธเนเธ—เนเธ Canvas (drawCanvasBarSegment) เธเธณ CanvasPattern เธฅเธฒเธขเธ—เธฒเธเน€เธเธตเธขเธเธกเธฒเธฃเธฐเธเธฒเธขเธ—เธฑเธเธเธ Base Gradient เธเธญเธ TECO D2 เนเธฅเธฐ REL C3 เนเธ”เธขเนเธกเนเน€เธเธฅเธตเนเธขเธเนเธเธฅเธเธชเธตเน€เธ”เธดเธก 4) เนเธเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP เธเธฃเธฑเธ badgeStyleAttr เธเธญเธ TECO D2 เนเธซเนเน€เธเนเธ repeating-linear-gradient เธชเธตเน€เธซเธฅเธทเธญเธเธ—เธญเธ เนเธฅเธฐ REL C3 เน€เธเนเธ repeating-linear-gradient เธชเธตเนเธ”เธเธชเธ” เธชเธงเธขเธเธฒเธก เธเธกเธเธฑเธ” เนเธฅเธฐเธชเธญเธ”เธเธฅเนเธญเธเธเธฑเธเธ—เธฑเนเธเธฃเธฐเธเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธขเนเธฒเธขเนเธงเนเธ”เนเธฒเธเธฅเนเธฒเธเธเธฒเธฃเนเธ” / เน€เธเธดเนเธกเธเธฃเธฒเธ teco d2 เนเธฅเธฐ rel c3 เนเธซเนเธกเธตเธฅเธฒเธขเน€เธชเนเธเน€เธซเธกเธทเธญเธ clsd f4 เนเธ•เนเธกเธตเธชเธตเธเธเน€เธ”เธดเธก)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธ UI เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP เนเธฅเธฐเธฅเธงเธ”เธฅเธฒเธขเธเธฃเธฒเธเธดเธเนเธเธเธฃเธฒเธเนเธ—เนเธ WBS)'
    },
    {
      id: 'log_000_wbs_integrate_sap_cards_match_colors_red_clear_btn_remove_share',
      timestamp: '2026-10-18 13:25:00',
      timestampTh: '18 เธ•.เธ. 2569, 13:25 เธ.',
      type: 'EDIT',
      typeBadge: 'เธฃเธงเธกเธเธฒเธฃเนเธ” SAP เนเธฅเธฐเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅ',
      badgeClass: 'badge-type-edit',
      title: 'เธขเนเธฒเธขเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP เธฃเธงเธกเนเธเธเธฒเธฃเนเธ”เธเธฃเธฒเธเนเธ—เนเธ, เธเธฃเธฑเธเธชเธตเธเธฒเธฃเนเธ”เนเธซเนเธ•เธฃเธเธเธฑเธเธเธฃเธฒเธ, เน€เธเธดเนเธกเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธชเธตเนเธ”เธเธเธเธเธงเธฒ, เธเธณ % เธชเธฑเธ”เธชเนเธงเธเธญเธญเธ เนเธฅเธฐเธเธฃเธฑเธเธเธเธฒเธ”เธเธฒเธฃเนเธ”เนเธเธเธฅเธเธชเธกเธชเธฑเธ”เธชเนเธงเธ',
      targetSubject: 'เธเธฒเธฃเนเธ”เธเธฃเธฒเธเนเธ—เนเธ เธเธญเธ/เธเธเธ. เธ—เธตเนเธกเธตเธเธฒเธ WBS เธเธเน€เธซเธฅเธทเธญ (#wbsSapSummarySection & #wbsOfficesBarChart)',
      storageFile: 'index.html, js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: '1) เธขเนเธฒเธขเนเธ–เธงเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP เธเธถเนเธเนเธเธฃเธงเธกเธญเธขเธนเนเนเธเธเธฒเธฃเนเธ”เธเธฃเธฒเธเนเธ—เนเธเธ”เนเธฒเธเธเธ (เธ•เธณเนเธซเธเนเธเธเธฃเธญเธเธชเธตเธเนเธณเน€เธเธดเธ) 2) เธเธฃเธฑเธเธชเธต เธเนเธฒเธขเธเธณเธเธฑเธ เนเธฅเธฐเน€เธชเนเธเธเธญเธเธเธญเธเธเธฒเธฃเนเธ”เนเธ•เนเธฅเธฐเธชเธ–เธฒเธเธฐเนเธซเนเธ•เธฃเธเธเธฑเธเธชเธตเธเธฃเธฒเธเนเธ—เนเธ (CLSD F4 เน€เธเธตเธขเธงเธกเธดเนเธเธ—เนเธฅเธฒเธขเธ—เธฒเธเน€เธเธตเธขเธ, TECO เน€เธซเธฅเธทเธญเธเธ—เธญเธ, REL เนเธ”เธเธฅเธ”เธซเธฅเธฑเนเธ) 3) เน€เธเธดเนเธกเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธชเธตเนเธ”เธเน€เธ”เนเธเธเธฑเธ” (.btn-wbs-card-clear) เธเธเธกเธธเธกเธเธงเธฒเธเธญเธเธเธฒเธฃเนเธ” 4) เธเธณ % เธชเธฑเธ”เธชเนเธงเธเธกเธนเธฅเธเนเธฒเธญเธญเธเธเธฒเธเธเธฒเธฃเนเธ”เธ—เธฑเนเธเธซเธกเธ” 5) เธเธฃเธฑเธเธเธเธฒเธ”เธเธฒเธฃเนเธ”เนเธซเนเนเธเธเธฅเธเนเธฅเธฐเธชเธกเธชเนเธงเธ (flex 102px) เธเธฑเธ”เธงเธฒเธเน€เธฃเธตเธขเธเนเธ–เธงเน€เธ”เธตเธขเธงเธญเธขเนเธฒเธเธชเธงเธขเธเธฒเธกเธเธญเธ”เธตเธซเธเนเธฒเธเธญ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: 1) เธขเนเธฒเธขเนเธเธฃเธเธชเธฃเนเธฒเธ DOM เธเธญเธ #wbsSapSummarySection เน€เธเนเธฒเนเธเธญเธขเธนเนเนเธ .content-card เธฃเธฐเธซเธงเนเธฒเธเธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฑเธ Canvas เธเธฃเธฒเธเนเธ—เนเธ เธฃเธงเธกเธเธฒเธฃเนเธ”เน€เธเนเธเธซเธเธถเนเธเน€เธ”เธตเธขเธงเธเธฃเธฐเธซเธขเธฑเธ”เธเธทเนเธเธ—เธตเนเนเธเธงเธ•เธฑเนเธ 2) เน€เธเธทเนเธญเธกเนเธขเธเธเธฑเธเธเนเธเธฑเธ getSapSegmentStyle เน€เธเนเธฒเธเธฑเธ renderWbsSapSummary เน€เธเธทเนเธญเนเธซเนเธชเธตเธเธทเนเธเธซเธฅเธฑเธ เธเนเธฒเธขเธเธณเธเธฑเธ เน€เธชเนเธเธเธญเธ เนเธฅเธฐเธฅเธฒเธขเธ—เธฒเธเน€เธเธตเธขเธ 45 เธญเธเธจเธฒเธเธญเธ CLSD F4 เธ•เธฃเธเธเธฑเธเน€เธเธเน€เธกเธเธ•เนเธเธญเธเธเธฃเธฒเธเนเธ—เนเธ 100% 3) เน€เธเธดเนเธกเธเธธเนเธก "เธฅเนเธฒเธเธเนเธญเธกเธนเธฅ" เธชเธตเนเธ”เธเธชเธ” (.btn-wbs-card-clear) เธเธฃเนเธญเธกเนเธญเธเธญเธเธ–เธฑเธเธเธขเธฐเธ—เธตเนเธกเธธเธกเธเธเธเธงเธฒเธเธญเธ Header เธเธฒเธฃเนเธ” เธชเธฑเนเธเธฅเนเธฒเธเธ—เธฑเนเธเธเธฒเธฃเน€เธฅเธทเธญเธ Checkbox เนเธฅเธฐเธ•เธฑเธงเธเธฃเธญเธเธชเธ–เธฒเธเธฐ SAP (clearAllWbsSelection) 4) เธเธณเนเธ—เนเธ <span class="wbs-sap-card-share"> เธญเธญเธเธเธฒเธเธเธฒเธฃเนเธ”เธ—เธธเธเนเธ 5) เธเธฃเธฑเธ CSS .wbs-sap-summary-integrated เนเธซเนเธเธฒเธฃเนเธ”เธกเธตเธเธเธฒเธ”เนเธเธเธฅเธเนเธฅเธฐเธขเธทเธ”เธซเธขเธธเนเธ (min-width: 102px, max-width: 155px, flex: 1 1 0) เธ—เธณเนเธซเนเธเธฒเธฃเนเธ”เธ—เธฑเนเธ 10 เนเธเน€เธฃเธตเธขเธเธ•เธฑเธงเธชเธงเธขเธเธฒเธกเนเธเนเธ–เธงเน€เธ”เธตเธขเธงเธเธญเธ”เธตเธเธฑเธเธเธญเธ เธฒเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (1.เนเธซเนเธขเนเธฒเธข เธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ sap เนเธเนเธงเนเธเธฃเธญเธเธชเธตเธเนเธณเน€เธเธดเธ เธญเธขเธนเนเธฃเธงเธกเธเธฑเธเธเธฃเธฒเธเธ”เนเธฒเธเธเธ เนเธซเนเธชเธกเธชเนเธงเธเนเธเธซเธเนเธฒเน€เธ”เธตเธขเธง 2.เธเธฃเธฑเธเธชเธต เธชเธ–เธฒเธเธฐเธเธฃเธฒเธเนเธเธเธฒเธฃเนเธ” เนเธซเนเธ•เธฃเธเธเธฑเธเธชเธตเธเธฃเธฒเธเนเธ—เนเธ / เน€เธเธดเนเธกเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅ เธเธเธเธงเธฒเธชเธตเนเธ”เธ / % เธชเธฑเธ”เธชเนเธงเธเธกเธนเธฅเธเนเธฒเน€เธญเธฒเธญเธญเธ เนเธฅเธฐเธเธฃเธฑเธเธเธเธฒเธ”เธเธฒเธฃเนเธ”เนเธซเนเนเธเธเธฅเธ เธชเธกเธชเธฑเธ”เธชเนเธงเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธเนเธเธฃเธเธชเธฃเนเธฒเธ Layout, UI เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP, เธเธฒเน€เธฅเธ•เธ•เนเธชเธต เนเธฅเธฐเน€เธเธดเนเธกเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅ)'
    },
    {
      id: 'log_000_wbs_cancel_donut_chart_addition',
      timestamp: '2026-10-18 13:06:00',
      timestampTh: '18 เธ•.เธ. 2569, 13:06 เธ.',
      type: 'CONFIG',
      typeBadge: 'เธขเธเน€เธฅเธดเธเน€เธเธดเนเธกเธเธฃเธฒเธเธงเธเธเธฅเธก',
      badgeClass: 'badge-type-config',
      title: 'เธขเธเน€เธฅเธดเธเธเธณเธชเธฑเนเธเน€เธเธดเนเธกเธเธฃเธฒเธเธงเธเธเธฅเธก เนเธฅเธฐเธเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP เธ•เธฒเธกเธฃเธนเธเนเธเธเธเธฒเธฃเนเธ”เนเธเธงเธเธญเธเน€เธ”เธดเธก',
      targetSubject: 'เธชเนเธงเธเธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP (#wbsSapSummarySection) เนเธเนเธ—เนเธ WBS เธเธเน€เธซเธฅเธทเธญ',
      storageFile: 'js/wbs.js, css/styles.css & js/data_history.js',
      changeSummary: 'เธขเธเน€เธฅเธดเธเธเธฒเธฃเน€เธเธดเนเธกเธเธฃเธฒเธเธงเธเธเธฅเธกเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ เนเธ”เธขเธเธเธฃเธนเธเนเธเธเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP เนเธฅเธฐเน€เธเธญเธฃเนเน€เธเนเธเธ•เนเธชเธฑเธ”เธชเนเธงเธเธกเธนเธฅเธเนเธฒเธ—เธฑเนเธเธซเธกเธ”เนเธงเนเธ•เธฒเธกเนเธเธฃเธเธชเธฃเนเธฒเธเน€เธ”เธดเธก',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธขเธเน€เธฅเธดเธเธเธณเธชเธฑเนเธ เน€เธเธดเนเธกเธเธฃเธฒเธเธงเธเธเธฅเธก เนเธซเนเธเธฑเธ”เน€เธเธเธ—เธธเธเธ•เธฑเธงเน€เธฅเธ เนเธ”เธขเนเธเนเธเนเธญเธกเธนเธฅเธ•เธฒเธกเธฃเธนเธ 7): 1) เธเธทเธเธเนเธฒเธเธฑเธเธเนเธเธฑเธ renderWbsSapSummary เนเธ js/wbs.js เธชเธนเนเธฃเธนเธเนเธเธเน€เธ”เธดเธก 2) เธเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเธเธฒเธฃเนเธ”เธชเธ–เธฒเธเธฐ SAP เนเธเธงเธเธญเธเธเธฃเนเธญเธกเธ•เธฑเธงเน€เธฅเธเนเธฅเธฐเธชเธฑเธ”เธชเนเธงเธ % เนเธงเนเธญเธขเนเธฒเธเธเธฃเธเธ–เนเธงเธ 3) เธเธณเธชเนเธ•เธฅเน CSS เธชเนเธงเธเน€เธเธดเธเธญเธญเธเธเธฒเธ css/styles.css เน€เธเธทเนเธญเธฃเธฑเธเธฉเธฒเธเธงเธฒเธกเธเธฃเธฐเธเธฑเธเธเธญเธเธฃเธฐเธเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธขเธเน€เธฅเธดเธเธเธณเธชเธฑเนเธ เน€เธเธดเนเธกเธเธฃเธฒเธเธงเธเธเธฅเธก เนเธซเนเธเธฑเธ”เน€เธเธเธ—เธธเธเธ•เธฑเธงเน€เธฅเธ เนเธ”เธขเนเธเนเธเนเธญเธกเธนเธฅเธ•เธฒเธกเธฃเธนเธ 7)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ'
    },
    {
      id: 'log_000_wbs_chart_remove_header_legend_and_action_buttons',
      timestamp: '2026-10-18 12:45:00',
      timestampTh: '18 เธ•.เธ. 2569, 12:45 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธณ Legend & เธเธธเนเธกเธซเธฑเธงเธเธฒเธฃเนเธ”เธญเธญเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธณเนเธ–เธ Legend เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ เนเธฅเธฐเธเธธเนเธกเน€เธฅเธทเธญเธเธกเธธเธกเธกเธญเธเธเธฃเธฒเธ เธญเธญเธเธเธฒเธเธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฃเธฒเธ WBS',
      targetSubject: 'เธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฃเธฒเธเนเธ—เนเธ เธเธญเธ/เธเธเธ. เธ—เธตเนเธกเธตเธเธฒเธ WBS เธเธเน€เธซเธฅเธทเธญ (เนเธ—เนเธ WBS เธเธเน€เธซเธฅเธทเธญ)',
      storageFile: 'index.html, js/wbs.js & js/data_history.js',
      changeSummary: 'เธเธณเธชเนเธงเธเนเธชเธ”เธเธเธฅเธ—เธตเนเธญเธขเธนเนเนเธเธเธฃเธญเธเธชเธตเนเธ”เธเธ—เธฑเนเธเธซเธกเธ”เธ•เธฒเธกเธฃเธนเธเธ เธฒเธ เนเธ”เนเนเธเน เนเธ–เธ Legend เธชเธฃเธธเธเธขเธญเธ”เธเธเน€เธซเธฅเธทเธญเธชเธ–เธฒเธเธฐ CLSD/TECO/REL, เธชเธฑเธเธฅเธฑเธเธฉเธ“เนเธเธณเธญเธเธดเธเธฒเธขเธชเธตเนเธฅเธฐเธฅเธงเธ”เธฅเธฒเธข, เนเธฅเธฐเธเธธเนเธกเธชเธฅเธฑเธเธกเธธเธกเธกเธญเธ (เธ—เธฑเนเธเธซเธกเธ”/10 เธญเธฑเธเธ”เธฑเธเนเธฃเธ, เนเธเธเธเนเธญเธ/เนเธเธเนเธขเธ) เธญเธญเธเธเธฒเธเธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฃเธฒเธ เน€เธเธทเนเธญเธเธงเธฒเธกเน€เธฃเธตเธขเธเธเนเธฒเธข เธเธฅเธตเธ เนเธฅเธฐเธชเธงเธขเธเธฒเธก',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธญเธฒเธญเธญเธ) เธเธฃเนเธญเธกเธฃเธนเธเธ เธฒเธเธฃเธฐเธเธธเธเธฃเธญเธเธชเธตเนเธ”เธ: 1) เธเธณเธญเธเธเนเธเธฃเธฐเธเธญเธ <div id="wbsChartLegend"> เธ—เธฑเนเธเธซเธกเธ”เธญเธญเธเธเธฒเธ index.html 2) เธเธณเธเธฅเธธเนเธกเธเธธเนเธก <div class="card-actions"> (wbsChartScopeBtnAll, wbsChartScopeBtnTop10, wbsChartModeBtnStacked, wbsChartModeBtnGrouped) เธญเธญเธเธเธฒเธ index.html 3) เธเธเน€เธซเธฅเธทเธญเน€เธเธเธฒเธฐเธซเธฑเธงเธเนเธญเธเธฒเธฃเนเธ”เนเธฅเธฐเธเนเธฒเธขเธชเธฃเธธเธเธเธณเธเธงเธเธซเธเนเธงเธขเธเธฒเธเนเธฅเธฐเธเธฒเธเธเธเน€เธซเธฅเธทเธญ (20 เธซเธเนเธงเธขเธเธฒเธ เธเธเน€เธซเธฅเธทเธญ 287 เธเธฒเธ) เน€เธเธทเนเธญเนเธซเนเธซเธฑเธงเธเธฒเธฃเนเธ”เธ”เธนเนเธเธฃเนเธ เธชเธฐเธญเธฒเธ”เธ•เธฒ เนเธฅเธฐเนเธกเนเน€เธเธฐเธเธฐเธชเธฒเธขเธ•เธฒ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธญเธฒเธญเธญเธ - เธเธฃเนเธญเธกเธ เธฒเธเธฃเธฐเธเธธเธเธฃเธญเธเธชเธตเนเธ”เธเธเธฃเธดเน€เธงเธ“เธซเธฑเธงเธเธฒเธฃเนเธ”)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเธเธฃเธธเธเธเธงเธฒเธกเน€เธฃเธตเธขเธเธเนเธฒเธขเธเธญเธ UI เธซเธฑเธงเธเธฒเธฃเนเธ”เธเธฃเธฒเธเนเธ—เนเธ WBS)'
    },
    {
      id: 'log_000_wbs_chart_striped_green_containment_fix',
      timestamp: '2026-10-18 12:25:00',
      timestampTh: '18 เธ•.เธ. 2569, 12:25 เธ.',
      type: 'EDIT',
      typeBadge: 'เนเธเนเนเธเธฅเธงเธ”เธฅเธฒเธขเนเธซเนเธญเธขเธนเนเนเธเธเธฃเธฒเธ',
      badgeClass: 'badge-type-edit',
      title: 'เนเธเนเนเธเธฅเธงเธ”เธฅเธฒเธขเธ—เธฒเธเน€เธเธตเธขเธเธชเธตเน€เธเธตเธขเธงเนเธซเนเธญเธขเธนเนเน€เธเธเธฒเธฐเนเธเนเธ—เนเธเธเธฃเธฒเธ เนเธกเนเนเธซเนเธฅเนเธเน€เธเธดเธเธญเธญเธเธกเธฒเธเธญเธเธเธฃเธฒเธ',
      targetSubject: 'เธเธฃเธฒเธเนเธ—เนเธ เธเธญเธ/เธเธเธ. เธ—เธตเนเธกเธตเธเธฒเธ WBS เธเธเน€เธซเธฅเธทเธญ (เนเธ—เนเธ WBS เธเธเน€เธซเธฅเธทเธญ)',
      storageFile: 'js/wbs.js & js/data_history.js',
      changeSummary: 'เน€เธเธฅเธตเนเธขเธเธเธฒเธฃเธงเธฒเธ”เธฅเธฒเธขเธ—เธฒเธเน€เธเธตเธขเธเธเธฒเธเน€เธ”เธดเธกเธ—เธตเนเนเธเนเธเธฒเธฃเธเธตเธ”เน€เธชเนเธเธเนเธฒเธกเธเธดเธเธฑเธ”เนเธฅเนเธง clip เธเธถเนเธเน€เธเธดเธ”เธเธฒเธฃเธฃเธฑเนเธงเนเธซเธฅเธเธญเธเน€เธชเนเธ เธญเธญเธเธกเธฒเธเธญเธเธเธฃเธญเธเนเธ—เนเธ เน€เธเนเธเธเธฒเธฃเนเธเน Path2D เธฃเนเธงเธกเธเธฑเธ CanvasPattern (createPattern) เธฃเธฐเธเธฒเธขเธฅเธงเธ”เธฅเธฒเธขเธฅเธเธเธ Path เธเธญเธเนเธ—เนเธเนเธ”เธขเธ•เธฃเธ เธ—เธณเนเธซเนเธฅเธงเธ”เธฅเธฒเธขเธ–เธนเธเธเธณเธเธฑเธ”เธญเธขเธนเนเธ เธฒเธขเนเธเนเธ—เนเธ 100% เนเธกเนเธฅเนเธเน€เธเธดเธเธญเธญเธเธกเธฒเธเธญเธเนเธ—เนเธเธเธฃเธฒเธเธญเธตเธเธ•เนเธญเนเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: 1) เธชเธฃเนเธฒเธเธเธฑเธเธเนเธเธฑเธ getWbsStripePattern เน€เธเธทเนเธญเธชเธฃเนเธฒเธ CanvasPattern เธฅเธฒเธขเธ—เธฒเธเน€เธเธตเธขเธ 45 เธญเธเธจเธฒเนเธเธเนเธเธ 2) เธเธฃเธฑเธเธเธฃเธธเธเธเธฑเธเธเนเธเธฑเธ drawCanvasBarSegment เนเธซเนเนเธเน Path2D.roundRect เนเธฅเธฐเธฃเธฐเธเธฒเธขเธชเธตเธเธทเนเธเธซเธฅเธฑเธเธ”เนเธงเธข ctx.fill(p) เธเธฒเธเธเธฑเนเธเธฃเธฐเธเธฒเธขเธฅเธงเธ”เธฅเธฒเธขเธ”เนเธงเธข ctx.fillStyle = pat; ctx.fill(p) เธ—เธณเนเธซเนเธฅเธงเธ”เธฅเธฒเธขเธ–เธนเธเธเธฑเธเธญเธขเธนเนเน€เธเธเธฒเธฐเนเธเธฃเธนเธเธ—เธฃเธเธเธญเธเนเธ—เนเธเธเธฃเธฒเธเธญเธขเนเธฒเธเนเธกเนเธเธขเธณ 100% เนเธเนเนเธเธเธฑเธเธซเธฒเน€เธชเนเธเธฅเธฒเธขเธ—เธฒเธเน€เธเธตเธขเธเนเธฅเธเธญเธญเธเธกเธฒเธฃเธฐเธซเธงเนเธฒเธเนเธ—เนเธเธเธฃเธฒเธเนเธ”เนเธญเธขเนเธฒเธเธ–เธฒเธงเธฃ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธเนเนเธเธฅเธงเธ”เธฅเธฒเธขเธชเธตเน€เธเธตเธขเธง เนเธซเนเธญเธขเธนเนเนเธเธเธฃเธฒเธ เนเธกเนเนเธซเนเน€เธเธดเธเธเธฃเธฒเธเธญเธญเธเธกเธฒเนเธเธเธเธตเน)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เนเธเนเนเธเธเนเธญเธเธเธเธฃเนเธญเธเธเธฒเธฃเน€เธฃเธเน€เธ”เธญเธฃเนเธฅเธงเธ”เธฅเธฒเธขเธเธฃเธฒเธเธดเธเนเธ Canvas)'
    },
    {
      id: 'log_000_wbs_chart_striped_green_match_user_img4',
      timestamp: '2026-10-18 12:15:00',
      timestampTh: '18 เธ•.เธ. 2569, 12:15 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธชเธตเน€เธเธตเธขเธงเธกเธตเธฅเธฒเธขเธฃเธนเธ 4',
      badgeClass: 'badge-type-edit',
      title: 'เธเธฃเธฑเธเน€เธเธ”เธชเธตเนเธฅเธฐเน€เธชเนเธเธเธญเธเธชเธ–เธฒเธเธฐ CLSD F4/F2 เนเธซเนเน€เธเนเธเธชเธตเน€เธเธตเธขเธงเธกเธดเนเธเธ—เนเธกเธตเธฅเธฒเธขเธ—เธฒเธเน€เธเธตเธขเธเธ•เธฒเธกเธฃเธนเธ 4',
      targetSubject: 'เธเธฃเธฒเธเนเธ—เนเธ เธเธญเธ/เธเธเธ. เธ—เธตเนเธกเธตเธเธฒเธ WBS เธเธเน€เธซเธฅเธทเธญ (เนเธ—เนเธ WBS เธเธเน€เธซเธฅเธทเธญ)',
      storageFile: 'js/wbs.js, index.html & js/data_history.js',
      changeSummary: 'เธเธฃเธฑเธเน€เธเธ”เธชเธต CLSD F4/F2 เธ•เธฒเธกเน€เธเธ“เธ‘เนเธงเธฑเธ”เนเธซเนเธ•เธฃเธเธ•เธฒเธกเธฃเธนเธ 4: เนเธฅเนเธฃเธฐเธ”เธฑเธเธชเธตเน€เธเธตเธขเธงเธกเธดเนเธเธ—เนเธเธฒเธชเน€เธ—เธฅเธ”เนเธฒเธเธเธ (#CBFCE6) เธเนเธฒเธเธชเธตเน€เธเธตเธขเธงเธกเธดเนเธเธ—เนเธชเธ”เนเธช (#48D0A2) เธชเธนเนเธชเธตเน€เธเธตเธขเธงเธกเธฃเธเธ• (#10B981) เธเธฃเนเธญเธกเน€เธชเนเธเธเธญเธเธชเธตเธกเธดเนเธเธ—เนเธชเธงเนเธฒเธเธกเธเธชเธงเธข (#A1FCDB เธเธเธฒเธ” 1.5px) เนเธฅเธฐเธ•เธฑเธงเน€เธฅเธเธชเธตเน€เธเนเธก #022C22 เธเธกเธเธฑเธ”เน€เธ”เนเธเธเธฑเธ” 100%',
      details: 'เธงเธดเน€เธเธฃเธฒเธฐเธซเนเธเนเธฒเธชเธตเธเธฒเธเธฃเธนเธ 4 เธเธญเธเธเธนเนเนเธเนเธเธฒเธ (media_1792300221405.jpg) เธเธเธงเนเธฒ: 1) เธชเธตเธ”เนเธฒเธเธเธเธชเธธเธ”เน€เธเนเธเธชเธตเน€เธเธตเธขเธงเธกเธดเนเธเธ—เนเธเธฒเธชเน€เธ—เธฅเธชเธงเนเธฒเธ #CBFCE6 เนเธฅเนเธฅเธเธกเธฒเธขเธฑเธ #48D0A2 เนเธฅเธฐ #10B981 2) เธเธญเธเธกเธเน€เธเนเธเธชเธตเธกเธดเนเธเธ—เนเธชเธงเนเธฒเธ #A1FCDB เธเธงเธฒเธกเธซเธเธฒ 1.5px 3) เธฅเธฒเธขเธ—เธฒเธเน€เธเธตเธขเธ 45 เธญเธเธจเธฒ เธชเธตเธเธฒเธงเนเธเธฃเนเธเนเธชเธเธงเธฒเธกเธเธงเนเธฒเธ 2px เธฃเธฐเธขเธฐเธซเนเธฒเธ step 7px 4) เธ•เธฑเธงเน€เธฅเธเนเธชเธ”เธเธเธณเธเธงเธเธเธฒเธเน€เธเนเธเธชเธตเน€เธเนเธก #022C22 เธเธฃเนเธญเธก drop shadow เธชเธตเธเธฒเธง เธ—เธณเนเธซเนเธญเนเธฒเธเธเนเธฒเธข เธเธญเธเธ—เธฃเธฒเธชเธ•เนเธชเธนเธเนเธฅเธฐเธชเธงเธขเธเธฒเธกเธ•เธฃเธเธ•เธฒเธกเธฃเธนเธ 4 เธ—เธธเธเธเธฃเธฐเธเธฒเธฃ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธเนเนเธเธชเธต CLSD F4/F2 เธ•เธฒเธกเน€เธเธ“เธงเธฑเธ” เนเธซเนเน€เธเนเธเธชเธตเน€เธเธตเธขเธงเธ•เธฒเธกเธฃเธนเธ 4)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเนเธ•เนเธเธเธฒเน€เธฅเธ•เธ•เนเธชเธตเนเธฅเธฐเธชเนเธ•เธฅเนเธ เธฒเธเธเธฃเธฒเธเธดเธเธชเธ–เธฒเธเธฐ CLSD F4/F2 เธ•เธฒเธกเธ—เธตเนเธเธนเนเนเธเนเธฃเธฐเธเธธ)'
    },
    {
      id: 'log_000_wbs_chart_striped_green_all_numbers_and_remove_hover_tooltip',
      timestamp: '2026-10-18 12:05:00',
      timestampTh: '18 เธ•.เธ. 2569, 12:05 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเนเธ•เนเธเธเธฃเธฒเธ WBS',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธฅเธตเนเธขเธ CLSD F4/F2 เน€เธเนเธเธชเธตเน€เธเธตเธขเธงเธกเธตเธฅเธฒเธข (เนเธกเนเน€เธฃเธทเธญเธเนเธชเธเธเธตเธญเธญเธ), เนเธชเธ”เธเธ•เธฑเธงเน€เธฅเธเธเธณเธเธงเธเธเธฒเธเธเธฃเธเธ–เนเธงเธเธ—เธธเธเธชเธ–เธฒเธเธฐเนเธเนเธ—เนเธเธเธฃเธฒเธ, เนเธฅเธฐเธเธณ Popup เน€เธกเธฒเธชเนเน€เธฅเธทเนเธญเธเธญเธญเธ',
      targetSubject: 'เธเธฃเธฒเธเนเธ—เนเธ เธเธญเธ/เธเธเธ. เธ—เธตเนเธกเธตเธเธฒเธ WBS เธเธเน€เธซเธฅเธทเธญ (เนเธ—เนเธ WBS เธเธเน€เธซเธฅเธทเธญ)',
      storageFile: 'js/wbs.js, index.html, css/styles.css & js/data_history.js',
      changeSummary: '1) เน€เธเธฅเธตเนเธขเธเธชเธตเธชเธ–เธฒเธเธฐ CLSD F4/F2 เน€เธเนเธฒเธซเธกเธฒเธขเธเธดเธ”เธเธฒเธ เธเธฒเธเธชเธตเน€เธเธตเธขเธงเธเธตเธญเธญเธเน€เธฃเธทเธญเธเนเธชเธ เน€เธเนเธเธชเธตเน€เธเธตเธขเธงเธกเธตเธฅเธฒเธขเธ—เธฒเธเน€เธเธตเธขเธ 45 เธญเธเธจเธฒ (Striped Green Pattern) เธเธกเธเธฑเธ” เธชเธงเธขเธเธฒเธก เธเธฅเธกเธเธฅเธทเธเธเธฑเธเธเธฃเธฒเธ 2) เนเธเนเนเธเธเธงเธฒเธกเธชเธนเธเน€เธเธเน€เธกเธเธ•เนเนเธฅเธฐเธเธฒเธฃเนเธชเธ”เธเธเธฅเธ•เธฑเธงเน€เธฅเธ เนเธซเนเนเธชเธ”เธเธเธณเธเธงเธเธเธฒเธเธเธฃเธเธ–เนเธงเธเธ—เธธเธเธชเธ–เธฒเธเธฐเธขเนเธญเธขเนเธเนเธ—เนเธเธเธฃเธฒเธ (เธฃเธงเธกเธขเธญเธ”เธ เธฒเธขเนเธเนเธ—เนเธเธ•เธฃเธเธเธฑเธเธขเธญเธ”เธฃเธงเธกเธ”เนเธฒเธเธเธ 100%) 3) เธเธณเธเธฅเนเธญเธ Popup เธ—เธตเนเนเธชเธ”เธเน€เธกเธทเนเธญเน€เธฅเธทเนเธญเธเน€เธกเธฒเธชเน (Hover Tooltip) เธญเธญเธเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ 3 เธเนเธญ: 1) เธเธฃเธฑเธเธเธฃเธธเธเธเธฑเธเธเนเธเธฑเธ drawCanvasBarSegment เนเธซเนเธฃเธญเธเธฃเธฑเธเธเธฒเธฃเธ•เธฑเธ”เธฃเธฐเธเธฒเธ (Clip Path) เนเธฅเธฐเธงเธฒเธ”เธฅเธฒเธขเธ—เธฒเธเน€เธเธตเธขเธ 45 เธญเธเธจเธฒ เธเธฃเนเธญเธกเน€เธชเนเธเธเธญเธเธชเธตเน€เธเธตเธขเธงเธกเธฃเธเธ•เธเธกเธเธฑเธ” เธชเธณเธซเธฃเธฑเธเธชเธ–เธฒเธเธฐ CLSD F4 เนเธฅเธฐ CLSD F2 เนเธฅเธฐเธขเธเน€เธฅเธดเธเน€เธญเธเน€เธเธเธ•เนเน€เธฃเธทเธญเธเนเธชเธเธเธตเธญเธญเธ เธ—เธณเนเธซเนเธ”เธนเธชเธงเธขเธเธฒเธก เน€เธฃเธตเธขเธเธซเธฃเธน เธเธฅเธกเธเธฅเธทเธ เนเธกเนเนเธเธฅเธเธ•เธฒ 2) เธเธณเธเธงเธ“เธเธงเธฒเธกเธชเธนเธเธเธฑเนเธเธ•เนเธณเธเธฒเธ (Base Height 8.5-12.5px) เนเธซเนเธ—เธธเธเน€เธเธเน€เธกเธเธ•เนเธ—เธตเนเธกเธตเธเธฒเธเธเธเน€เธซเธฅเธทเธญ เนเธฅเธฐเน€เธเธฅเธตเนเธขเธเธงเธฒเธกเธชเธนเธเธชเนเธงเธเน€เธเธดเธเธ•เธฒเธกเธชเธฑเธ”เธชเนเธงเธเธเธณเธเธงเธเธเธฒเธ เธ—เธณเนเธซเนเธชเธ–เธฒเธเธฐเธขเนเธญเธขเธ—เธธเธเธฃเธฒเธขเธเธฒเธฃเธกเธตเธเธทเนเธเธ—เธตเนเน€เธเธตเธขเธเธเธญ เธเธฃเนเธญเธกเธขเธเน€เธฅเธดเธเน€เธเธทเนเธญเธเนเธเธเธฒเธฃเธ•เธฑเธ”เธ—เธดเนเธ เธ—เธณเนเธซเนเธ•เธฑเธงเน€เธฅเธเธเธณเธเธงเธเธเธฒเธเนเธชเธ”เธเธเธฃเธเธ—เธธเธเธชเธ–เธฒเธเธฐเนเธเนเธ—เนเธเธเธฃเธฒเธ 3) เธเธดเธ”เธเธฒเธฃเนเธชเธ”เธเธเธฅเธเธฅเนเธญเธ Popup (Tooltip) เน€เธกเธทเนเธญเน€เธฅเธทเนเธญเธเน€เธกเธฒเธชเนเธเนเธฒเธเนเธ—เนเธเธเธฃเธฒเธ เนเธ”เธขเธขเธฑเธเธเธเธเธฑเธเธเนเธเธฑเธเธเธฒเธฃเธเธฅเธดเธเธ—เธตเนเนเธ—เนเธเธเธฃเธฒเธเน€เธเธทเนเธญเธเธฃเธญเธเธ•เธฒเธฃเธฒเธเธ•เธฒเธกเธซเธเนเธงเธขเธเธฒเธเนเธงเนเธญเธขเนเธฒเธเธชเธกเธเธนเธฃเธ“เน 4) เธเธฃเธฑเธเธเธฃเธธเธ Legend เธเนเธฒเธขเธเธณเธเธฑเธเธเธเธซเธฑเธงเธเธฒเธฃเนเธ”เนเธซเนเนเธชเธ”เธเธชเธฑเธเธฅเธฑเธเธฉเธ“เน "F4/F2 เธฅเธฒเธขเน€เธเธตเธขเธง"',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (1.เนเธเนเนเธเธชเธตเน€เธเธตเธขเธงเธเธตเธญเธญเธเน€เธฃเธทเธญเธเนเธชเธCLSD F4/F2 เนเธซเนเน€เธเนเธเธชเธตเน€เธเธตเธขเธงเธกเธตเธฅเธฒเธข เธ”เธนเนเธฅเนเธงเนเธเธฅเธเธเธฒเธเธญเธฑเธเธญเธทเนเธเน 2.เนเธเนเนเธ เธเธฃเธฒเธเธขเธฑเธเนเธชเธ”เธเธเธณเธเธงเธเธเธฒเธ เนเธกเนเธเธฃเธ เธ•เธฒเธกเธฃเธนเธ 2 3.เน€เธญเธฒเธ•เธฑเธงเน€เธกเธฒเน€เธฅเธทเนเธญเธเนเธฅเนเธงเนเธชเธ”เธเธญเธญเธเนเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเธเธฃเธฒเธเนเธ—เนเธ WBS เธเธงเธฒเธกเธเธฃเธเธ–เนเธงเธเธเธญเธเธเนเธญเธกเธนเธฅ เนเธฅเธฐเธเธฃเธฐเธชเธเธเธฒเธฃเธ“เนเธเธนเนเนเธเนเธเธฒเธ)'
    },
    {
      id: 'log_000_wbs_chart_sap_color_gradients',
      timestamp: '2026-10-18 11:35:00',
      timestampTh: '18 เธ•.เธ. 2569, 11:35 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธชเธตเธเธฃเธฒเธเธ•เธฒเธกเธชเธ–เธฒเธเธฐ SAP',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธดเนเธกเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เธเธฃเธฒเธเนเธ—เนเธ WBS เนเธขเธเนเธฅเธฐเนเธฅเนเธฃเธฐเธ”เธฑเธเธชเธตเธ•เธฒเธกเธชเธ–เธฒเธเธฐ SAP (CLSD F4 เน€เธฃเธทเธญเธเนเธชเธ, TECO เน€เธซเธฅเธทเธญเธเน€เธเนเธก-เธญเนเธญเธ, REL เนเธ”เธเน€เธเนเธก-เธญเนเธญเธ) เนเธฅเธฐเนเธฅเนเธฃเธฐเธ”เธฑเธเธเธงเธฒเธกเธชเธนเธเธเธฃเธฒเธเธ•เธฒเธกเธเธณเธเธงเธเธเธฒเธเธเธเน€เธซเธฅเธทเธญเธกเธฒเธเธชเธธเธ”เนเธเธเนเธญเธขเธชเธธเธ”',
      targetSubject: 'เธเธฃเธฒเธ เธเธญเธ/เธเธเธ. เธ—เธตเนเธกเธตเธเธฒเธ WBS เธเธเน€เธซเธฅเธทเธญ (เนเธ—เนเธ WBS เธเธเน€เธซเธฅเธทเธญ)',
      storageFile: 'js/wbs.js, index.html, css/styles.css & js/data_history.js',
      changeSummary: 'เนเธชเธ”เธเธเธณเธเธงเธเธเธฒเธเนเธฅเธฐเธชเธตเนเธขเธเธ•เธฒเธกเธชเธ–เธฒเธเธฐ SAP เธ—เธธเธเธฃเธฒเธขเธเธฒเธฃ: CLSD F4 เน€เธเธตเธขเธงเน€เธฃเธทเธญเธเนเธชเธ, TECO เนเธฅเนเน€เธซเธฅเธทเธญเธเน€เธเนเธก F เธ–เธถเธเธญเนเธญเธ B, REL เนเธฅเนเนเธ”เธเน€เธเนเธก F เธ–เธถเธเธญเนเธญเธ B, เนเธฅเนเธฃเธฐเธ”เธฑเธเธเธงเธฒเธกเธชเธนเธเนเธ—เนเธเธเธฃเธฒเธเนเธซเนเธเธฒเธเน€เธขเธญเธฐเธชเธธเธ”เธกเธตเธเธงเธฒเธกเธชเธนเธเธกเธฒเธเธชเธธเธ”เน€เธชเธกเธญ เนเธฅเธฐเธฅเธ”เธซเธฅเธฑเนเธเธฅเธเธ•เธฒเธกเธเธณเธเธงเธเธเธฒเธเธญเธขเนเธฒเธเนเธกเนเธเธขเธณ 100%',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเนเธญเธเธณเธซเธเธ” 6 เธเนเธญเธเธญเธเธเธนเนเนเธเนเธเธฒเธ: 1) เธเธฃเธฑเธเธเธฃเธธเธเธเธฃเธฒเธเนเธ—เนเธเนเธเธเธเนเธญเธเนเธซเนเนเธเนเธเน€เธเธเน€เธกเธเธ•เนเธ•เธฒเธกเธฃเธซเธฑเธชเธชเธ–เธฒเธเธฐ SAP เธขเนเธญเธขเธเธฃเธดเธ (CLSD F4, CLSD F2, TECO D2, REL C1, REL D1 เธฏเธฅเธฏ) 2) เธเธณเธซเธเธ”เธชเธต CLSD เน€เธเนเธเธชเธตเน€เธเธตเธขเธง เนเธ”เธข CLSD F4 เธกเธตเน€เธญเธเน€เธเธเธ•เนเธชเธตเน€เธเธตเธขเธงเธเธตเธญเธญเธเน€เธฃเธทเธญเธเนเธชเธ (เนเธเน€เธเธ“เธ‘เนเธงเธฑเธ” 1, 2, 3, 5 เนเธฅเธฐเธเนเธญ 4) เนเธฅเธฐเนเธฅเนเธฃเธฐเธ”เธฑเธเธเธงเธฒเธกเน€เธเนเธกเธ•เธฒเธกเธฅเธณเธ”เธฑเธเธ•เธฑเธงเธญเธฑเธเธฉเธฃเนเธฅเธฐเธ•เธฑเธงเน€เธฅเธ 3) TECO เนเธเนเธชเธตเน€เธซเธฅเธทเธญเธเน€เธเนเธกเนเธ—เธเธญเธณเธเธฑเธเธ•เธฒเธกเธญเธฑเธเธฉเธฃ F เนเธเธเธเธ–เธถเธเธชเธตเน€เธซเธฅเธทเธญเธเธญเนเธญเธเนเธ—เธ B 4) REL เนเธเนเธชเธตเนเธ”เธเน€เธเนเธกเธเธฑเธ” F/D เนเธเธเธเธ–เธถเธเธชเธตเนเธ”เธเธชเธงเนเธฒเธ C เนเธฅเธฐเนเธ”เธเธญเนเธญเธ B 5) เธเธฃเธฑเธเธชเธฑเธ”เธชเนเธงเธเธเธฃเธฒเธ (เธเธงเธฒเธกเธชเธนเธ 268px, plotH 168px) เนเธซเนเธเธฐเธ—เธฑเธ”เธฃเธฑเธ” เนเธกเนเธชเธนเธเน€เธเธดเธเนเธ เนเธชเธ”เธเธ•เธฑเธงเน€เธฅเธเธเธณเธเธงเธเธเธฒเธเธเธฃเธเธ–เนเธงเธเธเธฑเธ”เน€เธเธเนเธเธ—เธธเธเน€เธเธเน€เธกเธเธ•เน เนเธฅเธฐเธญเธฑเธเน€เธเธฃเธ” Tooltip เนเธชเธ”เธเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เนเธขเธเธชเธ–เธฒเธเธฐ SAP เธญเธขเนเธฒเธเธฅเธฐเน€เธญเธตเธขเธ” 6) เธเธณเธเธงเธ“เธเธงเธฒเธกเธชเธนเธเนเธ—เนเธเธเธฃเธฒเธเนเธเธ Strict Monotonic Cascading เนเธซเนเธซเธเนเธงเธขเธเธฒเธเธ—เธตเนเธเธฒเธเธเธเน€เธซเธฅเธทเธญเน€เธขเธญเธฐเธชเธธเธ”เธเธฃเธฒเธเธชเธนเธเธ—เธตเนเธชเธธเธ” เนเธฅเธฐเธฅเธ”เธซเธฅเธฑเนเธเธฅเธเธกเธฒเธ•เธฒเธกเธเธณเธเธงเธเธเธฒเธเธญเธขเนเธฒเธเนเธกเนเธเธขเธณ เนเธกเนเธ–เธนเธเธ”เธฑเธเธ”เนเธงเธขเธเธณเธเธงเธเน€เธเธเน€เธกเธเธ•เนเธขเนเธญเธข',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (1.เน€เธเธดเนเธกเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เธเธฃเธฒเธเนเธชเธ”เธเธเธณเธเธงเธเธเธฒเธเนเธฅเนเธฃเธฐเธ”เธฑเธเธชเธตเธ•เธฒเธกเธชเธ–เธฒเธเธฐ sap 2.CLSD เน€เธเธตเธขเธง F4 เน€เธฃเธทเธญเธเนเธชเธ 3.TECO เน€เธซเธฅเธทเธญเธเน€เธเนเธก F เธ–เธถเธเธญเนเธญเธ B 4.REL เนเธ”เธเนเธฅเนเธ•เธฒเธกเธญเธฑเธเธฉเธฃเธ•เธฑเธงเน€เธฅเธ 5.เธเธฑเธ”เธฃเธนเธเนเธเธเธชเธกเธชเนเธงเธเธ•เธฑเธงเน€เธฅเธเธเธฑเธ”เน€เธเธ เธเธงเธฒเธกเธชเธนเธเธเธฃเธฒเธเนเธกเนเธกเธฒเธ 6.เนเธซเนเนเธฅเนเธเธงเธฒเธกเธชเธนเธเธเธฃเธฒเธ เนเธซเนเธเธฒเธเน€เธขเธญเธฐเธชเธธเธ”เธเธงเธฒเธกเธชเธนเธเธเธฃเธฒเธเธกเธฒเธเธชเธธเธ”)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธเธฃเธฐเธเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเธเธฃเธฒเธเนเธ—เนเธเนเธฅเธฐเธเธฒเธฃเธงเธดเน€เธเธฃเธฒเธฐเธซเนเธชเธ–เธฒเธเธฐ SAP)'
    },
    {
      id: 'log_000_wbs_checkbox_rules_clsd_f2_and_clsd_e2',
      timestamp: '2026-10-18 00:15:00',
      timestampTh: '18 เธ•.เธ. 2569, 00:15 เธ.',
      type: 'CONFIG',
      typeBadge: 'เธเธฃเธฑเธเน€เธเธทเนเธญเธเนเธ Checkbox WBS',
      badgeClass: 'badge-type-config',
      title: 'เธเธฃเธฑเธเน€เธเธทเนเธญเธเนเธ Checkbox: เน€เธเธ“เธ‘เนเธงเธฑเธ”เธเนเธญ 1, 2, 3, 5 เน€เธเธดเนเธก Checkbox เธซเธฒเธเน€เธเนเธ CLSD F2 เนเธฅเธฐเธขเธเน€เธงเนเธ CLSD E2 เนเธกเนเนเธชเธ”เธ Checkbox เธ—เธฑเนเธเธซเธกเธ”',
      targetSubject: 'เน€เธกเธเธน WBS เธเธเน€เธซเธฅเธทเธญ (#tab-wbs) - เน€เธเธทเนเธญเธเนเธเธเธฒเธฃเนเธชเธ”เธเธเธฅ Checkbox เนเธฅเธฐเธเธฒเธฃเน€เธฅเธทเธญเธเธเธณเธฅเธญเธเน€เธเนเธฒเธซเธกเธฒเธข',
      storageFile: 'js/wbs.js, js/data_history.js, index.html',
      changeSummary: '1) เนเธเน€เธเธ“เธ‘เนเธงเธฑเธ”เธเนเธญ 1, 2, 3, 5 เธเธฃเธฑเธเนเธซเนเธชเธ–เธฒเธเธฐ CLSD F2 เธกเธต Checkbox เนเธซเนเธเธนเนเนเธเนเธชเธฒเธกเธฒเธฃเธ–เน€เธฅเธทเธญเธเน€เธเธทเนเธญเธเธณเธเธงเธ“เธเธณเธฅเธญเธเธขเธญเธ”เธเธดเธ”เธเธฒเธเนเธ”เน (เธขเธเน€เธงเนเธเน€เธเธเธฒเธฐ CLSD F4 เธ—เธตเนเธเธดเธ”เธเธฒเธเธ•เธฒเธกเน€เธเนเธฒเธซเธกเธฒเธขเนเธฅเนเธง) 2) เธชเธ–เธฒเธเธฐ CLSD E2 เนเธซเนเน€เธญเธฒ Checkbox เธญเธญเธเธ—เธฑเนเธเธซเธกเธ”เธ—เธธเธเน€เธเธ“เธ‘เนเธงเธฑเธ” 3) เน€เธเธ“เธ‘เนเธงเธฑเธ”เธเนเธญ 4 (เธเธ C02.2) เธขเธฑเธเธเธเธขเธเน€เธงเนเธ CLSD F2 เธ•เธฒเธกเน€เธเนเธฒเธซเธกเธฒเธขเธเธดเธ”เธเธฒเธเธเธญเธเธเนเธญ 4',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: 1) เธชเธฃเนเธฒเธเธเธฑเธเธเนเธเธฑเธ isWbsItemExcludedFromCheckbox(sapVal, currentCrit) เธฃเธงเธกเธจเธนเธเธขเนเธเธฒเธฃเธ•เธฃเธงเธเธชเธญเธเธเธฒเธฃเธขเธเน€เธงเนเธ Checkbox 2) เธชเธณเธซเธฃเธฑเธเธชเธ–เธฒเธเธฐ CLSD E2 เธเธณเธซเธเธ”เนเธซเนเธ–เธนเธเธขเธเน€เธงเนเธเธ—เธฑเนเธเธซเธกเธ” เนเธกเนเนเธชเธ”เธ Checkbox เนเธเธ—เธธเธเน€เธเธ“เธ‘เนเธงเธฑเธ” 3) เธชเธณเธซเธฃเธฑเธเน€เธเธ“เธ‘เนเธงเธฑเธ”เธเนเธญ 1, 2, 3, 5 (เน€เธเนเธฒเธซเธกเธฒเธขเธเธดเธ”เธเธฒเธเธเธทเธญ CLSD F4) เธเธณเธซเธเธ”เนเธซเนเธขเธเน€เธงเนเธเน€เธเธเธฒเธฐ CLSD F4 เน€เธ—เนเธฒเธเธฑเนเธ เธ”เธฑเธเธเธฑเนเธเธเธฒเธเธ—เธตเนเธกเธตเธชเธ–เธฒเธเธฐ CLSD F2 เธเธฐเธกเธต Checkbox เธเธฃเธฒเธเธเนเธเธ•เธฒเธฃเธฒเธเนเธฅเธฐเธชเธฒเธกเธฒเธฃเธ–เน€เธฅเธทเธญเธ Checkbox เนเธ”เนเธญเธขเนเธฒเธเธ–เธนเธเธ•เนเธญเธ 4) เธชเธณเธซเธฃเธฑเธเน€เธเธ“เธ‘เนเธงเธฑเธ”เธเนเธญ 4 เธเธณเธซเธเธ”เนเธซเนเธขเธเน€เธงเนเธ CLSD F2 (เนเธกเนเธกเธต Checkbox) 5) เธเธดเธเธเนเธเธฑเธเธเนเธเธฑเธเธเธฒเธฃเน€เธฅเธทเธญเธเธ—เธฑเนเธเธ•เธฒเธฃเธฒเธ (Master Checkbox), เธเธฒเธฃเน€เธฅเธทเธญเธเธ•เธฒเธกเธเธฃเธฐเน€เธ เธ—เธชเธ–เธฒเธเธฐ SAP, เนเธฅเธฐเธเธฒเธฃเธชเธฃเธธเธเธเธฅเธเธฒเธฃเน€เธฅเธทเธญเธเนเธซเนเธ—เธณเธเธฒเธเธชเธญเธ”เธเธฅเนเธญเธเธเธฑเธ 100%',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธซเนเธ•เธฃเธงเธเธชเธญเธ เน€เธฅเธทเธญเธเน€เธเธ“เธงเธฑเธ”เธเนเธญ 1 2 3 5 เน€เธเธดเนเธก check box เธ–เนเธฒ CLSD F2 / เธซเธฒเธ CLSD E2 เนเธซเนเน€เธญเธฒ check box เธญเธญเธเธ—เธฑเนเธเธซเธกเธ”)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธเธ•เธฃเธฃเธเธฐเน€เธเธทเนเธญเธเนเธ Checkbox เธ•เธฒเธฃเธฒเธ WBS เนเธฅเธฐเธฃเธฐเธเธเธเธณเธฅเธญเธเธขเธญเธ”เธเธดเธ”เธเธฒเธ)'
    },
    {
      id: 'log_000_wbs_remove_outcome_footer_and_enlarge_top_row_font',
      timestamp: '2026-10-17 23:55:00',
      timestampTh: '17 เธ•.เธ. 2569, 23:55 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเนเธ•เนเธเธเธฒเธฃเนเธ”เธเธฅเธฅเธฑเธเธเนเธเธงเธฒ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธณเนเธ–เธเน€เธเธญเธฃเนเน€เธเนเธเธ•เนเธเธฅเธ”เธณเน€เธเธดเธเธเธฒเธฃเธ”เนเธฒเธเธฅเนเธฒเธเธญเธญเธเธ•เธฒเธกเธ—เธตเนเธงเธเธเธฅเธก เนเธฅเธฐเน€เธเธดเนเธกเธเธเธฒเธ”เธ•เธฑเธงเธญเธฑเธเธฉเธฃเนเธ–เธงเธเธเนเธซเนเธเธฑเธ”เน€เธเธเนเธ”เธ”เน€เธ”เนเธ',
      targetSubject: 'เน€เธกเธเธน WBS เธเธเน€เธซเธฅเธทเธญ (#tab-wbs) - เธเธฒเธฃเนเธ”เธเธฅเธฅเธฑเธเธเนเธชเธ–เธฒเธเธฐเธเธงเธฒเธกเธทเธญ (.wbs-kpi-outcome-col)',
      storageFile: 'js/wbs.js, css/styles.css, js/data_history.js, index.html',
      changeSummary: '1) เธเธณเธเธฅเนเธญเธเนเธชเธ”เธ "เธเธฅเธ”เธณเน€เธเธดเธเธเธฒเธฃ XXX%" เนเธฅเธฐเธซเธฅเธญเธ” Mini Progress Bar เธฅเนเธฒเธเธชเธธเธ”เธญเธญเธเธ•เธฒเธกเธ เธฒเธเธ—เธตเนเธเธนเนเนเธเนเธงเธเธเธฅเธกเธชเธตเนเธ”เธ 2) เน€เธเธดเนเธกเธเธเธฒเธ”เธ•เธฑเธงเธญเธฑเธเธฉเธฃเธเธญเธเนเธ–เธงเธเธ (เนเธญเธเธญเธ, เธชเธ–เธฒเธเธฐเน€เธเนเธฒเธซเธกเธฒเธข, เนเธฅเธฐเธเนเธฒเธขเน€เธ”เธทเธญเธ) เนเธซเนเนเธซเธเนเนเธฅเธฐเธญเนเธฒเธเธเนเธฒเธขเน€เธ”เนเธเธเธฑเธ”เธขเธดเนเธเธเธถเนเธ เธเธฃเนเธญเธกเธเธฑเธ”เธเธถเนเธเธเธฅเธฒเธเนเธเธงเธ•เธฑเนเธเธเธญเธเธเธฒเธฃเนเธ”เนเธซเนเธชเธกเธ”เธธเธฅเธชเธงเธขเธเธฒเธก',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: 1) เธฅเธ .outcome-col-footer เนเธ js/wbs.js เธเธถเนเธเนเธชเธ”เธ "เธเธฅเธ”เธณเน€เธเธดเธเธเธฒเธฃ XXX%" เนเธฅเธฐเธซเธฅเธญเธ”เธเธงเธฒเธกเธเธทเธเธซเธเนเธฒเธญเธญเธเธ•เธฒเธกเธ—เธตเนเธงเธเธเธฅเธกเธชเธตเนเธ”เธ 2) เธเธฃเธฑเธเธเธเธฒเธ”เธเธญเธเธ•เนเนเธ–เธงเธเธ (.outcome-status-title) เธเธฒเธ 0.88rem เน€เธเนเธ 1.05rem (font-weight: 900) เธเธฃเธฑเธเนเธญเธเธญเธ (.outcome-icon) เธเธฒเธ 1.15rem เน€เธเนเธ 1.35rem เนเธฅเธฐเธเธฃเธฑเธเธเนเธฒเธขเน€เธ”เธทเธญเธ (.outcome-month-badge) เธเธฒเธ 0.72rem เน€เธเนเธ 0.82rem 3) เธเธฃเธฑเธเธเธเธฒเธ”เธเนเธฒเธขเธเธณเธเธฑเธ (.outcome-col-lbl) เน€เธเนเธ 0.92rem เนเธฅเธฐเธ•เธฑเธงเน€เธฅเธเธซเธฅเธฑเธ (.outcome-col-val) เน€เธเนเธ 1.55rem 4) เธเธณเธซเธเธ” flex: 1 เนเธ .outcome-col-body เธ—เธณเนเธซเนเน€เธเธทเนเธญเธซเธฒเธ•เธฃเธเธเธฅเธฒเธเธ–เธนเธเธเธฑเธ”เธงเธฒเธเธเธถเนเธเธเธฅเธฒเธเนเธเธงเธ•เธฑเนเธเธญเธขเนเธฒเธเธชเธกเธชเนเธงเธ เธชเธงเธขเธเธฒเธกเธฅเธเธ•เธฑเธงเธฃเธฐเธ”เธฑเธเธเธฃเธตเน€เธกเธตเธขเธก',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธญเธฒเธญเธญเธ เธ—เธตเนเธงเธเธเธฅเธก / เนเธฅเธฐเน€เธเธดเนเธกเธเธเธฒเธ”เธ•เธฑเธงเธญเธฑเธเธฉเธฃเนเธ–เธงเธเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเนเธ•เนเธ UI เธเธฒเธฃเนเธ”เนเธชเธ”เธเธเธฅเธฅเธฑเธเธเน KPI)'
    },
    {
      id: 'log_000_wbs_fix_progress_pct_reference_error',
      timestamp: '2026-10-17 23:48:00',
      timestampTh: '17 เธ•.เธ. 2569, 23:48 เธ.',
      type: 'EDIT',
      typeBadge: 'เนเธเนเนเธเธ•เธฑเธงเนเธเธฃเนเธชเธ”เธเธเธฅ WBS',
      badgeClass: 'badge-type-edit',
      title: 'เนเธเนเนเธเธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เธ•เธฑเธงเนเธเธฃ progressPct เนเธเธเธฒเธฃเนเธ”เธเธญเธฅเธฑเธกเธเนเธเธงเธฒ เธ—เธณเนเธซเนเธเนเธญเธกเธนเธฅ WBS เธเธฅเธฑเธเธกเธฒเนเธชเธ”เธเธเธฅเธญเธขเนเธฒเธเธ–เธนเธเธ•เนเธญเธเธชเธกเธเธนเธฃเธ“เน',
      targetSubject: 'เน€เธกเธเธน WBS เธเธเน€เธซเธฅเธทเธญ (#tab-wbs) - เธเธฑเธเธเนเธเธฑเธ renderWbsTargetComparisonSection',
      storageFile: 'js/wbs.js, js/data_history.js, index.html',
      changeSummary: 'เนเธเนเนเธ ReferenceError เธเธญเธเธ•เธฑเธงเนเธเธฃ progressPct เธ เธฒเธขเนเธเธซเธฅเธญเธ” Mini Progress Bar เธเธญเธเธเธญเธฅเธฑเธกเธเนเธเธฅเธฅเธฑเธเธเนเธเธงเธฒเธกเธทเธญ เนเธ”เธขเธเธณเธซเธเธ”เธ•เธฑเธงเนเธเธฃเนเธซเนเธ•เธฃเธเธเธฑเธ pctAchievedNum เธเธฃเนเธญเธกเนเธชเนเธเนเธฒเธเนเธญเธเธเธฑเธ fallback เธ—เธณเนเธซเนเธเธฃเธฒเธ เธ•เธฒเธฃเธฒเธ เนเธฅเธฐเธ•เธฑเธงเน€เธฅเธ WBS เธ—เธฑเนเธเธซเธกเธ”เธเธฅเธฑเธเธกเธฒเนเธชเธ”เธเธเธฅเธ—เธฑเธเธ—เธต',
      details: 'เธ•เธฃเธงเธเธชเธญเธเธเธเธงเนเธฒเธซเธฅเธฑเธเธเธฒเธเธเธฑเธ”เธงเธฒเธเน€เธฅเธขเนเน€เธญเธฒเธ•เนเธเธญเธฅเธฑเธกเธเนเธเธงเธฒเธกเธทเธญ เนเธเธชเนเธงเธเธเธญเธ outcome-col-footer เธกเธตเธเธฒเธฃเน€เธฃเธตเธขเธเนเธเนเธ•เธฑเธงเนเธเธฃ progressPct เนเธ”เธขเธ—เธตเนเธชเนเธเธเน€เธ”เธดเธกเนเธเนเธเธทเนเธญ pctAchievedNum เธชเนเธเธเธฅเนเธซเนเน€เธเธดเธ” ReferenceError เธฃเธฐเธซเธงเนเธฒเธเธเธฒเธฃเธเธฃเธฐเธกเธงเธฅเธเธฅเธเธฑเธเธเนเธเธฑเธ renderWbsTargetComparisonSection เธเธถเธเนเธ”เนเธ—เธณเธเธฒเธฃ: 1) เธเธฃเธฐเธเธฒเธจ const progressPct = pctAchievedNum 2) เนเธชเนเธเธฒเธฃเธเนเธญเธเธเธฑเธ null/NaN เธ”เนเธงเธข (progressPct || 0).toFixed(1) เนเธฅเธฐ Math.min(100, Math.max(0, progressPct || 0)) 3) เธ—เธ”เธชเธญเธเน€เธฃเธเน€เธ”เธญเธฃเนเธเนเธญเธกเธนเธฅเธเธฃเธดเธเธเนเธฒเธ Headless Browser เธขเธทเธเธขเธฑเธเธงเนเธฒเธเธฃเธฐเธกเธงเธฅเธเธฅเธเนเธฒเธ 100% เธเนเธญเธกเธนเธฅ WBS เธ—เธฑเนเธเธซเธกเธ”เธเธฅเธฑเธเธกเธฒเนเธชเธ”เธเธเธฅเธเธฃเธเธ–เนเธงเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธเนเธญเธกเธนเธฅเธซเธฒเธข / เนเธเนเนเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธชเธนเธ (เนเธเนเนเธเธเธฑเนเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเธเนเธญเธกเธนเธฅ WBS เธ—เธฑเนเธเธฃเธฐเธเธ)'
    },
    {
      id: 'log_000_wbs_kpi_move_banner_to_right_column_layout',
      timestamp: '2026-10-17 23:42:00',
      timestampTh: '17 เธ•.เธ. 2569, 23:42 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฑเธ”เน€เธฅเธขเนเน€เธญเธฒเธ•เนเธเธญเธฅเธฑเธกเธเนเธเธงเธฒ',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธฅเธตเนเธขเธเนเธ–เธงเธชเธ–เธฒเธเธฐเธฅเนเธฒเธเธชเธธเธ”เน€เธเนเธเธเธญเธฅเธฑเธกเธเนเธเธดเธ”เธเธงเธฒ (.wbs-kpi-outcome-col) เธงเธฒเธเธเธฃเธฐเธเธเธเธฃเธฒเธเนเธ—เนเธ 2 เธเธฑเนเธเธญเธขเนเธฒเธเธชเธกเธชเนเธงเธเนเธฅเธฐเธชเธงเธขเธเธฒเธก',
      targetSubject: 'เน€เธกเธเธน WBS เธเธเน€เธซเธฅเธทเธญ (#tab-wbs) - เธเธฒเธฃเนเธ”เน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธเน€เธเนเธฒเธซเธกเธฒเธข KPI เธฃเธฐเธ”เธฑเธ 5 (.wbs-kpi-main-grid)',
      storageFile: 'js/wbs.js, css/styles.css, js/data_history.js, index.html',
      changeSummary: 'เธขเธเน€เธฅเธดเธเนเธเธเน€เธเธญเธฃเนเนเธเธงเธเธญเธเธฅเนเธฒเธเธชเธธเธ” (เธ—เธตเนเธ•เธตเธเธฃเธญเธเธชเธตเนเธ”เธ) เนเธฅเธฐเธเธฃเธฑเธเนเธเธฃเธเธชเธฃเนเธฒเธเน€เธเนเธ Grid 2 เธเธญเธฅเธฑเธกเธเน เนเธ”เธขเธขเนเธฒเธขเธเธฒเธฃเนเธ”เธเธฅเธฅเธฑเธเธเนเนเธฅเธฐเธชเธฃเธธเธเธชเธ–เธฒเธเธฐเนเธเน€เธเนเธเธเธญเธฅเธฑเธกเธเนเนเธเธงเธ•เธฑเนเธเธเธดเธ”เธเธงเธฒ (เนเธเธเธฃเธญเธเธชเธตเธเนเธณเน€เธเธดเธ) เธเธฃเธฐเธเธเธเนเธฒเธเธเธฑเธเธเธฃเธฒเธเนเธ—เนเธ 2 เธเธฑเนเธเธญเธขเนเธฒเธเธฅเธเธ•เธฑเธง เนเธ”เนเธชเธฑเธ”เธชเนเธงเธ เนเธฅเธฐเธชเธงเธขเธเธฒเธกเธฃเธฐเธ”เธฑเธเธเธฃเธตเน€เธกเธตเธขเธก',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: 1) เธชเธฃเนเธฒเธเธเธญเธเน€เธ—เธเน€เธเธญเธฃเน .wbs-kpi-main-grid เนเธเน flexbox เธเธฑเธ”เธงเธฒเธเธเธฃเธฒเธ 2 เธเธฑเนเธ (.wbs-kpi-bars-box) เธ—เธฒเธเธเนเธฒเธข (flex: 1) เธเธฃเธฐเธเธเธเธนเนเธเธฑเธเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธเธฅเธฅเธฑเธเธเน (.wbs-kpi-outcome-col) เธ—เธฒเธเธเธงเธฒเธกเธทเธญ (เธเธงเธฒเธกเธเธงเนเธฒเธ 260px) 2) เธ•เธเนเธ•เนเธเธเธญเธฅเธฑเธกเธเนเธเธฅเธฅเธฑเธเธเนเธ”เนเธงเธขเธ”เธตเนเธเธเนเธเธฃเธตเน€เธกเธตเธขเธก เธเธฃเธฐเธเธญเธเธ”เนเธงเธข: เธซเธฑเธงเธเธฒเธฃเนเธ”เนเธชเธ”เธเนเธญเธเธญเธเธชเธ–เธฒเธเธฐ (โ ๏ธ เธขเธฑเธเธ•เนเธญเธเธเธดเธ”เน€เธเธดเนเธกเธญเธตเธ เธซเธฃเธทเธญ ๐ เธเธฃเธฃเธฅเธธเน€เธเนเธฒเธซเธกเธฒเธขเนเธฅเนเธง!) เธเธฃเนเธญเธกเธเนเธฒเธขเน€เธ”เธทเธญเธเน€เธเนเธฒเธซเธกเธฒเธข, เธชเนเธงเธเธเธฅเธฒเธเนเธชเธ”เธเธ•เธฑเธงเน€เธฅเธเธเธเน€เธซเธฅเธทเธญ/เน€เธเธดเธเน€เธเนเธฒเธซเธกเธฒเธขเธเธเธฒเธ”เนเธซเธเนเน€เธ”เนเธเธเธฑเธ” (เธชเธตเนเธ”เธเน€เธฃเธทเธญเธเนเธชเธ #FF6B6B เธซเธฃเธทเธญเธชเธตเน€เธเธตเธขเธงเน€เธฃเธทเธญเธเนเธชเธ #00FF88) เธเธฃเนเธญเธกเธ•เธฑเธงเน€เธฅเธเธฅเนเธฒเธเธเธฒเธ—เธเธณเธเธฑเธ, เนเธฅเธฐเธชเนเธงเธเธฅเนเธฒเธเนเธชเธ”เธเธซเธฅเธญเธ” Mini Progress Bar เนเธฅเธฐเน€เธเธญเธฃเนเน€เธเนเธเธ•เนเธเธฅเธ”เธณเน€เธเธดเธเธเธฒเธฃ 3) เธเธฃเธฑเธเธขเนเธญเธเนเธญเธเธงเธฒเธกเธ•เธฑเธงเน€เธฅเธเธเธเธซเธฑเธงเธเธฃเธฒเธเธฅเนเธฒเธเนเธซเนเธเธฃเธฐเธเธฑเธเนเธ”เธขเธ•เธฑเธ”เธเธณเธงเนเธฒ "เธเธฒเธ—" เธญเธญเธ (เธฟXX,XXX,XXX.XX (XX.XX เธฅเธ.)) เน€เธเธทเนเธญเนเธซเนเธญเธขเธนเนเนเธเธเธฃเธฃเธ—เธฑเธ”เน€เธ”เธตเธขเธงเธญเธขเนเธฒเธเธชเธงเธขเธเธฒเธก เนเธกเนเธ•เธเธเธฃเธฃเธ—เธฑเธ” 4) เธฃเธญเธเธฃเธฑเธ Responsive Design เธเธฃเธฑเธเน€เธเนเธเนเธเธงเธ•เธฑเนเธเธญเธฑเธ•เนเธเธกเธฑเธ•เธดเธเธเธซเธเนเธฒเธเธญเธเธเธฒเธ”เน€เธฅเนเธเธเธงเนเธฒ 992px',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธเธฅเธตเนเธขเธเนเธ–เธงเธฅเนเธฒเธ เน€เธชเนเธเธชเธตเนเธ”เธ เนเธเธเธญเธฅเธฑเธก เธเธดเธ”เธเธงเธฒ (เธชเธตเธชเธตเธเธณเนเน€เธเธดเธ)เนเธ—เธ เธญเธญเธญเธเนเธเธเนเธซเนเนเธ”เนเธชเธฑเธ”เธชเนเธงเธ เธชเธงเธขเธเธฒเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธเนเธเธฃเธเธชเธฃเนเธฒเธ Layout เนเธฅเธฐ UI เธเธฃเธฒเธเน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธเน€เธเนเธฒเธซเธกเธฒเธข KPI)'
    },
    {
      id: 'log_000_wbs_kpi_remove_redundant_target_progress_cards_from_banner',
      timestamp: '2026-10-17 23:30:00',
      timestampTh: '17 เธ•.เธ. 2569, 23:30 เธ.',
      type: 'EDIT',
      typeBadge: 'เน€เธญเธฒเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธเนเธณเธเนเธญเธเธญเธญเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธณเธเธฒเธฃเนเธ”เน€เธเนเธฒเธซเธกเธฒเธข เนเธฅเธฐเธเธฒเธฃเนเธ”เธฃเธงเธกเธ”เธณเน€เธเธดเธเธเธฒเธฃ เธญเธญเธเธเธฒเธเนเธเธเน€เธเธญเธฃเนเธชเธฃเธธเธเธเธฅเธ•เธฒเธกเธ—เธตเนเธงเธเธเธฅเธก',
      targetSubject: 'เน€เธกเธเธน WBS เธเธเน€เธซเธฅเธทเธญ (#tab-wbs) - เนเธเธเน€เธเธญเธฃเนเธชเธฃเธธเธเธเธฅเธฅเธฑเธเธเนเธเธฒเธฃเน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธ KPI 5 (.wbs-kpi-status-banner)',
      storageFile: 'js/wbs.js, js/data_history.js, index.html',
      changeSummary: 'เธเธณเธเธฒเธฃเนเธ” "เน€เธเนเธฒเธซเธกเธฒเธข (เน€เธ”เธทเธญเธ)" เนเธฅเธฐเธเธฒเธฃเนเธ” "เธฃเธงเธกเธ”เธณเน€เธเธดเธเธเธฒเธฃ (SAP + เน€เธฅเธทเธญเธ)" เธญเธญเธเธเธฒเธเนเธเธเน€เธเธญเธฃเนเธชเธฃเธธเธเธเธฅเธฅเธฑเธเธเนเธฅเนเธฒเธเธชเธธเธ”เธ•เธฒเธกเธ•เธณเนเธซเธเนเธเธ—เธตเนเธเธนเนเนเธเนเธงเธเธเธฅเธกเธชเธตเนเธ”เธ เน€เธเธทเนเธญเธเธเธฒเธเธ•เธฑเธงเน€เธฅเธเธ—เธฑเนเธเธชเธญเธเธเธธเธ”เธกเธตเนเธชเธ”เธเธเธฑเธ”เน€เธเธเธญเธขเธนเนเธเธเธซเธฑเธงเธเธฃเธฒเธเนเธ—เนเธเธ—เธฑเนเธเธชเธญเธเธเธฑเนเธเนเธฅเนเธง เธ—เธณเนเธซเนเนเธเธเน€เธเธญเธฃเนเธเธฃเธฐเธเธฑเธเนเธฅเธฐเธเธเน€เธซเธฅเธทเธญเน€เธเธเธฒเธฐเธเธฒเธฃเนเธ”เธเธฅเธฅเธฑเธเธเนเธชเธณเธเธฑเธ (เน€เธเธดเธเน€เธเนเธฒเธซเธกเธฒเธข เธซเธฃเธทเธญ เธเธเน€เธซเธฅเธทเธญเธ•เนเธญเธเธเธดเธ”เน€เธเธดเนเธก)',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: เธ•เธฑเธ”เธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธญเธเนเธเนเธ .status-banner-metrics เธญเธญเธ เนเธ”เนเนเธเน 1) เธเธฒเธฃเนเธ”เน€เธเนเธฒเธซเธกเธฒเธข (${selectedMonth.shortName}) 2) เธเธฒเธฃเนเธ”เธฃเธงเธกเธ”เธณเน€เธเธดเธเธเธฒเธฃ (SAP + เน€เธฅเธทเธญเธ) เธเธเน€เธซเธฅเธทเธญเน€เธเธเธฒเธฐเธเธฒเธฃเนเธ”เธชเธ–เธฒเธเธฐเธเธฅเธฅเธฑเธเธเนเธชเธธเธ—เธเธด (.status-metric-card.card-success / card-warn) เธเธถเนเธเธฃเธฐเธเธธเธขเธญเธ”เน€เธเธดเธเน€เธเนเธฒเธซเธกเธฒเธข (+) เธซเธฃเธทเธญเธขเธญเธ”เธเธเน€เธซเธฅเธทเธญเธ•เนเธญเธเธเธดเธ”เน€เธเธดเนเธก เธ—เธณเนเธซเนเนเธ–เธเนเธเธเน€เธเธญเธฃเนเธชเธฃเธธเธเธ”เธนเนเธเธฃเนเธเธ•เธฒ เธชเธงเธขเธเธฒเธก เนเธฅเธฐเนเธกเนเธเนเธณเธเนเธญเธเธเธฑเธเธ•เธฑเธงเน€เธฅเธเธ—เธตเนเนเธชเธ”เธเธเธเธซเธฑเธงเธเธฃเธฒเธเธ”เนเธฒเธเธเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธงเธเธเธฅเธกเน€เธญเธฒเธญเธญเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเนเธ•เนเธ UI เนเธเธเน€เธเธญเธฃเนเธชเธฃเธธเธเธเธฅ KPI)',
    },
    {
      id: 'log_000_wbs_kpi_add_clsd_f4_f2_green_and_remove_small_clear_btn',
      timestamp: '2026-10-17 23:25:00',
      timestampTh: '17 เธ•.เธ. 2569, 23:25 เธ.',
      type: 'EDIT',
      typeBadge: 'เน€เธเธดเนเธกเธขเธญเธ” CLSD F4/F2 เนเธฅเธฐเธฅเธเธเธธเนเธกเธเธฒเธเธเธฒเธ—',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธดเนเธกเธเธฒเธฃเนเธชเธ”เธเธกเธนเธฅเธเนเธฒ/เธเธฒเธ CLSD F4/F2 เธชเธตเน€เธเธตเธขเธง เนเธฅเธฐเธฅเธเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเน€เธฅเนเธเธ—เธตเนเธเธฒเธเธเธฒเธ—เธญเธญเธเธ•เธฒเธกเธเธณเธชเธฑเนเธ',
      targetSubject: 'เน€เธกเธเธน WBS เธเธเน€เธซเธฅเธทเธญ (#tab-wbs) - เธซเธฑเธงเธเธฃเธฒเธเธฅเนเธฒเธเนเธชเธ”เธเธขเธญเธ”เธ”เธณเน€เธเธดเธเธเธฒเธฃ (#wbsTargetComparisonCard)',
      storageFile: 'js/wbs.js, css/styles.css, js/data_history.js, index.html',
      changeSummary: '1) เธฅเธเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธเธเธฒเธ”เน€เธฅเนเธเนเธเธชเนเธงเธเธซเธฑเธงเธเธฃเธฒเธเธฅเนเธฒเธ (เธ•เธณเนเธซเธเนเธเธ—เธตเนเธเธฒเธเธเธฒเธ—) เธญเธญเธ เนเธ”เธขเธเธเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธชเธตเนเธ”เธเธซเธฅเธฑเธเนเธงเนเธเธเธชเธธเธ”เธเธงเธฒเธกเธทเธญเธเธญเธเธเธฒเธฃเนเธ” 2) เน€เธเธดเนเธกเธเธฒเธฃเนเธชเธ”เธเธ•เธฑเธงเน€เธฅเธเธกเธนเธฅเธเนเธฒ/เธเธณเธเธงเธเธเธฒเธเธเธญเธเธชเธ–เธฒเธเธฐเธเธดเธ”เธเธฒเธเนเธ SAP (CLSD F4 เธซเธฃเธทเธญ CLSD F2) เธ”เนเธงเธขเธ•เธฑเธงเน€เธฅเธเธชเธตเน€เธเธตเธขเธงเธชเธ”เนเธช เน€เธเธทเนเธญเนเธซเนเน€เธซเนเธเธ•เธฑเธงเน€เธฅเธเธเธฃเธเธ—เธธเธเธญเธเธเนเธเธฃเธฐเธเธญเธเธเนเธญเธเธฃเธงเธกเน€เธเนเธเธขเธญเธ”เธฃเธงเธกเธ—เธณเนเธ”เน',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: 1) เธเธณเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธเธเธฒเธ”เน€เธฅเนเธ (.btn-wbs-kpi-clear) เธ—เธตเนเธญเธขเธนเนเธเนเธฒเธเธ•เธฑเธงเน€เธฅเธเธชเนเธงเธเธ—เธตเนเน€เธฅเธทเธญเธเธญเธญเธเธ•เธฒเธกเธ•เธณเนเธซเธเนเธเธ—เธตเนเธเธนเนเนเธเนเธเธฒเธเธเธฒเธ—เธชเธตเนเธ”เธเนเธเธ เธฒเธ 2) เน€เธเธดเนเธกเธเธฅเนเธญเธเนเธชเธ”เธเธเนเธญเธกเธนเธฅ CLSD F4: เธซเธฃเธทเธญ CLSD F2: (.stat-sap) เนเธเธ•เธณเนเธซเธเนเธเธ—เธตเนเธเธนเนเนเธเนเธงเธเธเธฅเธกเธชเธตเนเธ”เธ เนเธชเธ”เธเธ•เธฑเธงเน€เธฅเธเธกเธนเธฅเธเนเธฒเธซเธฃเธทเธญเธเธณเธเธงเธเธเธฒเธ (.sap-text) เธ”เนเธงเธขเธชเธตเน€เธเธตเธขเธง #34D399 เธเธฃเนเธญเธกเน€เธเธฒเน€เธฃเธทเธญเธเนเธชเธ text-shadow เนเธซเนเธชเธญเธ”เธเธฅเนเธญเธเธเธฑเธเธเธตเธก เธ—เธณเนเธซเนเนเธเธฃเธเธชเธฃเนเธฒเธเธ•เธฑเธงเน€เธฅเธเธเธเนเธ–เธเธซเธฑเธงเธเธฃเธฒเธเธฅเนเธฒเธเนเธชเธ”เธเธเธฃเธ 3 เธชเนเธงเธเธชเธกเธเธนเธฃเธ“เนเนเธเธ เนเธ”เนเนเธเน [CLSD F4/F2 (เธชเธตเน€เธเธตเธขเธง)] | [เธชเนเธงเธเธ—เธตเนเน€เธฅเธทเธญเธ (เธชเธตเธเนเธฒ)] | [เธฃเธงเธกเธ—เธณเนเธ”เน (เธชเธตเน€เธเธตเธขเธงเธญเธฃเนเธฒเธกเน€เธฃเธทเธญเธเนเธชเธ)]',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธเธฒเธเธเธฒเธ— เน€เธญเธฒเธญเธญเธ เนเธฅเธฐเธงเธเธเธฅเธกเนเธซเนเน€เธเธดเนเธก เธกเธนเธฅเธเนเธฒ/เธเธฒเธ CLSD F4 /F2 เธชเธตเน€เธเธตเธขเธง)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเนเธ•เนเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเธ•เธฑเธงเน€เธฅเธเธเธเธซเธฑเธงเธเธฃเธฒเธ WBS)'
    },
    {
      id: 'log_000_wbs_kpi_golden_border_cyan_selected_green_total_red_clear_btn',
      timestamp: '2026-10-17 23:15:00',
      timestampTh: '17 เธ•.เธ. 2569, 23:15 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเนเธ•เนเธเธเธธเนเธกเน€เธฅเธทเธญเธเน€เธ”เธทเธญเธเนเธฅเธฐเธ•เธฑเธงเน€เธฅเธ KPI',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธดเนเธกเน€เธชเนเธเธเธญเธเธชเธตเน€เธซเธฅเธทเธญเธเธญเธฃเนเธฒเธกเธเธญเธเธเธธเนเธกเน€เธฅเธทเธญเธเน€เธ”เธทเธญเธ, เนเธชเธ”เธเธ•เธฑเธงเน€เธฅเธเธชเนเธงเธเธ—เธตเนเน€เธฅเธทเธญเธเน€เธเนเธเธชเธตเธเนเธฒเนเธฅเธฐเธ•เธฑเธงเน€เธฅเธเธฃเธงเธกเน€เธเนเธเธชเธตเน€เธเธตเธขเธงเธญเธฃเนเธฒเธกเน€เธฃเธทเธญเธเนเธชเธ, เธเธฃเนเธญเธกเน€เธเธดเนเธกเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธชเธตเนเธ”เธเธเธเธชเธธเธ”เธเธงเธฒเธกเธทเธญเธเธญเธเธเธฒเธฃเนเธ”',
      targetSubject: 'เน€เธกเธเธน WBS เธเธเน€เธซเธฅเธทเธญ (#tab-wbs) - เธเธฒเธฃเนเธ”เน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธเน€เธเนเธฒเธซเธกเธฒเธข KPI เธฃเธฐเธ”เธฑเธ 5 (#wbsTargetComparisonCard)',
      storageFile: 'js/wbs.js, css/styles.css, js/data_history.js, index.html',
      changeSummary: '1) เนเธชเธ”เธเน€เธชเนเธเธเธญเธเธชเธตเน€เธซเธฅเธทเธญเธเธญเธฃเนเธฒเธกเน€เธฃเธทเธญเธเนเธชเธเธฃเธญเธเธเธธเนเธกเน€เธฅเธทเธญเธเน€เธ”เธทเธญเธเธ—เธฃเธเธฅเธนเธเธจเธฃ (Chevron) เธ—เธฑเนเธเธเธ“เธฐเธเธตเนเน€เธกเธฒเธชเน (:hover) เนเธฅเธฐเธเธ“เธฐเน€เธฅเธทเธญเธ (.active) 2) เนเธชเธ”เธเธ•เธฑเธงเน€เธฅเธเธชเนเธงเธเธ—เธตเนเน€เธฅเธทเธญเธ (เธชเนเธงเธเธ—เธตเนเน€เธฅเธทเธญเธเธเธฒเธ Checkbox) เนเธเธฃเธนเธเนเธเธเธชเธตเธเนเธฒเธเธฃเธฒเธกเธชเธ”เนเธชเน€เธฃเธทเธญเธเนเธชเธ (.selected-text) 3) เธเธฃเธฑเธเธ•เธฑเธงเน€เธฅเธเธฃเธงเธก (เธฃเธงเธกเธ—เธณเนเธ”เน) เนเธซเนเนเธชเธ”เธเน€เธเนเธเธชเธตเน€เธเธตเธขเธงเธญเธฃเนเธฒเธกเน€เธฃเธทเธญเธเนเธชเธเนเธ”เธ”เน€เธ”เนเธ (.progress-text) 4) เน€เธเธดเนเธกเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธชเธตเนเธ”เธเน€เธ”เนเธเธเธฑเธ” (.btn-wbs-card-clear) เนเธงเนเธเธเธเธฒเธฃเนเธ”เธ”เนเธฒเธเธเธเธชเธธเธ”เธเธงเธฒเธกเธทเธญ เน€เธเธทเนเธญเนเธซเนเธเธนเนเนเธเนเธชเธฒเธกเธฒเธฃเธ–เธเธ”เธฅเนเธฒเธเธเธฒเธฃเน€เธฅเธทเธญเธ Checkbox เนเธ”เนเธชเธฐเธ”เธงเธเธฃเธงเธ”เน€เธฃเนเธงเนเธเธเธฅเธดเธเน€เธ”เธตเธขเธง',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: 1) เธเธฃเธฑเธเนเธเธฃเธเธชเธฃเนเธฒเธ CSS เธเนเธญเธเน€เธฅเน€เธขเธญเธฃเน (Double Chevron Architecture) เนเธซเนเธเธธเนเธกเธเธญเธ (.btn-wbs-kpi-month) เธกเธต clip-path polygon เธเธฃเนเธญเธก padding 2.5px เนเธฅเธฐเธเธทเนเธเธซเธฅเธฑเธเน€เธเนเธ gradient เธชเธตเน€เธซเธฅเธทเธญเธเธ—เธญเธเธญเธฃเนเธฒเธก (#FFF700, #FFD700, #FFA000) เธฃเนเธงเธกเธเธฑเธ drop-shadow เธชเธตเน€เธซเธฅเธทเธญเธเธ—เธญเธเน€เธฃเธทเธญเธเนเธชเธ (filter: drop-shadow 10px-14px) เน€เธกเธทเนเธญเธเธณเน€เธกเธฒเธชเนเนเธเธเธตเน (:hover) เนเธฅเธฐเน€เธกเธทเนเธญเธ–เธนเธเน€เธฅเธทเธญเธ (.active) เธ—เธณเนเธซเนเน€เธชเนเธเธเธญเธเธชเธตเน€เธซเธฅเธทเธญเธเธ—เธญเธเธงเธดเนเธเธ•เธฒเธกเนเธเธงเธเธญเธเธ—เธฃเธเธฅเธนเธเธจเธฃเธญเธขเนเธฒเธเธเธกเธเธฃเธดเธ 2) เนเธเธชเนเธงเธเธซเธฑเธงเธเธฃเธฒเธเธฅเนเธฒเธ เธเธฃเธฑเธเนเธซเนเนเธชเธ”เธเธ•เธฑเธงเน€เธฅเธ "เธชเนเธงเธเธ—เธตเนเน€เธฅเธทเธญเธ:" เนเธเนเธชเธตเธเนเธฒเธชเธ”เนเธชเน€เธฃเธทเธญเธเนเธชเธ (#00E5FF เธเธฃเนเธญเธก text-shadow เธชเธตเธเนเธฒ) เนเธฅเธฐเธ•เธฑเธงเน€เธฅเธ "เธฃเธงเธกเธ—เธณเนเธ”เน:" เนเธเนเธชเธตเน€เธเธตเธขเธงเธญเธฃเนเธฒเธกเน€เธฃเธทเธญเธเนเธชเธ (#00FF88 เธเธฃเนเธญเธก text-shadow เน€เธเธตเธขเธงเธเธตเธญเธญเธ) เธเธฃเนเธญเธกเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธเธฐเธ—เธฑเธ”เธฃเธฑเธ” 3) เน€เธเธดเนเธกเธเธธเนเธก "เธฅเนเธฒเธเธเนเธญเธกเธนเธฅ" เธชเธตเนเธ”เธเธชเธ” (.btn-wbs-card-clear) เธ—เธตเนเธกเธธเธกเธเธเธชเธธเธ”เธเธงเธฒเธกเธทเธญเธเธญเธเธเธฒเธฃเนเธ” (เนเธ .wbs-kpi-comp-meta-info) เนเธชเธ”เธเนเธญเธเธญเธเธ–เธฑเธเธเธขเธฐเนเธฅเธฐเธเธณเธเธงเธเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเน€เธฅเธทเธญเธเธชเธตเนเธ”เธเน€เธ”เนเธเธเธฑเธ” เธชเธฑเนเธเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเน€เธฅเธทเธญเธเธ—เธฑเนเธเธซเธกเธ” (wbsState.selectedWbs.clear()) เนเธฅเธฐเธญเธฑเธเน€เธ”เธ•เธเธฃเธฒเธเนเธเธ Real-time เธ—เธฑเธเธ—เธต',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธเธ“เธฐเธฅเธฒเธเน€เธกเธฒเธชเนเนเธเธเธตเน เนเธฅเธฐเธ•เธญเธเน€เธฅเธทเธญเธ เนเธซเนเนเธชเธ”เธเน€เธชเนเธเธเธญเธเธชเธตเน€เธซเธฅเธทเธญเธเธญเธฃเนเธฒเธกเธเธญเธเธเธธเนเธกเธ”เนเธงเธข / เธ•เธฑเธงเน€เธฅเธเนเธซเนเนเธชเธ”เธ เธชเนเธงเธเธ—เธตเนเน€เธฅเธทเธญเธเธ”เนเธงเธข เนเธเนเธชเธตเธเนเธฒ เนเธฅเธฐเธ•เธฑเธงเน€เธฅเธเธฃเธงเธกเนเธเนเธชเธตเน€เธเธตเธขเธงเธญเธฃเนเธฒเธกเน€เธฃเธทเธญเธเนเธชเธ / เน€เธเธดเนเธกเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅ / เน€เธเธดเนเธกเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅ เนเธงเนเธเธเธเธฒเธฃเนเธ” เธเธเธชเธธเธ”เธเธงเธฒเธกเธทเธญ เธชเธตเนเธ”เธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธ UI เธเธฃเธฒเธ KPI เธเธณเธฅเธญเธเน€เธเนเธฒเธซเธกเธฒเธข เนเธฅเธฐเน€เธเธดเนเธกเธเธธเนเธกเธเธณเธชเธฑเนเธเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธเธเธเธฒเธฃเนเธ”)'
    },
    {
      id: 'log_000_wbs_chevron_buttons_and_golden_marker_style_and_remove_pct',
      timestamp: '2026-10-17 22:48:00',
      timestampTh: '17 เธ•.เธ. 2569, 22:48 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธเธธเนเธกเน€เธฅเธทเธญเธเน€เธ”เธทเธญเธเธฅเธนเธเธจเธฃเนเธฅเธฐเน€เธชเนเธเน€เธเนเธฒเธซเธกเธฒเธข',
      badgeClass: 'badge-type-edit',
      title: 'เธเธฃเธฑเธเธเธธเนเธกเน€เธฅเธทเธญเธเน€เธ”เธทเธญเธเน€เธเนเธเนเธ–เธเธฅเธนเธเธจเธฃเธ•เธฒเธกเธฃเธนเธ 31, เธเธฃเธฑเธเน€เธชเนเธเน€เธเนเธฒเธซเธกเธฒเธขเธ•เธฒเธกเธฃเธนเธ 32 เธ—เธธเธเธญเธฑเธ, เนเธฅเธฐเน€เธญเธฒเธเนเธฒเธข % เธญเธญเธ',
      targetSubject: 'เน€เธกเธเธน WBS เธเธเน€เธซเธฅเธทเธญ (#tab-wbs) - เธเธธเนเธกเน€เธฅเธทเธญเธเน€เธ”เธทเธญเธเน€เธเนเธฒเธซเธกเธฒเธข, เน€เธชเนเธเธเธญเธเธฃเธฐเธ”เธฑเธเน€เธเนเธฒเธซเธกเธฒเธข, เนเธฅเธฐเธซเธฑเธงเนเธ–เธเธ”เธณเน€เธเธดเธเธเธฒเธฃ',
      storageFile: 'js/wbs.js, css/styles.css, index.html',
      changeSummary: '1) เน€เธเธฅเธตเนเธขเธเธเธธเนเธกเน€เธฅเธทเธญเธเน€เธ”เธทเธญเธเธเธฒเธเนเธเธเน€เธ”เธดเธก (เธฃเธนเธ 30) เน€เธเนเธเนเธ–เธเธฅเธนเธเธจเธฃเธ•เนเธญเน€เธเธทเนเธญเธ (Chevron Segmented Arrow Track เธ•เธฒเธกเธฃเธนเธ 31) เนเธ—เธเธชเธตเธชเธ”เนเธชเน€เธเธเธฒเธฐเนเธ•เนเธฅเธฐเน€เธ”เธทเธญเธ เธเธฃเนเธญเธกเน€เธญเธเน€เธเธเธ•เนเธชเธตเน€เธ”เนเธเธเธฑเธ”เน€เธกเธทเนเธญเธเธตเนเน€เธกเธฒเธชเนเนเธฅเธฐเน€เธกเธทเนเธญเน€เธฅเธทเธญเธ 2) เธเธฃเธฑเธเน€เธชเนเธเน€เธเนเธฒเธซเธกเธฒเธขเน€เธเนเธเน€เธชเธฒเธชเธตเธ—เธญเธเธเธตเธญเธญเธเน€เธเธฅเนเธเธเธฃเธฐเธเธฒเธขเธเธฅเธฒเธขเธกเธเธชเธตเธเธฒเธงเน€เธฃเธทเธญเธเนเธชเธเนเธฅเธฐเธเนเธฒเธข โ–ฒ เน€เธชเนเธเน€เธเนเธฒเธซเธกเธฒเธข เธ•เธฒเธกเธฃเธนเธ 32 เนเธซเนเน€เธซเธกเธทเธญเธเธเธฑเธเธ—เธธเธเธญเธฑเธ 3) เน€เธญเธฒเธเนเธฒเธขเน€เธเธญเธฃเนเน€เธเนเธเธ•เน (117.2%) เธญเธญเธเธ•เธฒเธกเธเธณเธชเธฑเนเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: 1) เธเธฃเธฑเธเธเธฃเธธเธเธเธธเนเธกเน€เธฅเธทเธญเธเน€เธ”เธทเธญเธเน€เธเนเธฒเธซเธกเธฒเธข (.btn-wbs-kpi-month) เนเธซเนเน€เธเนเธเธฃเธนเธเธ—เธฃเธเธฅเธนเธเธจเธฃเธ•เนเธญเน€เธเธทเนเธญเธ (clip-path polygon chevron) 4 เธเนเธงเธเน€เธ”เธทเธญเธเธ•เธฒเธกเธชเนเธ•เธฅเนเธฃเธนเธ 31 (เธ.เธข. เธชเธตเธชเนเธกเธ—เธญเธ seg-1, เธ•.เธ. เธชเธตเน€เธเธตเธขเธงเธกเธฃเธเธ• seg-2, เธ.เธข. เธชเธตเธเนเธฒเธเธฃเธฒเธก seg-3, เธ.เธ. เธชเธตเธกเนเธงเธ seg-4) เน€เธเธดเนเธกเน€เธญเธเน€เธเธเธ•เนเธเธ“เธฐเธเธตเนเน€เธกเธฒเธชเน (:hover) เนเธซเนเธชเธตเธชเธงเนเธฒเธเธชเธ”เนเธชเน€เธ”เนเธเธเธฑเธ”เธเธถเนเธเธกเธฒ เนเธฅเธฐเธเธ“เธฐเน€เธฅเธทเธญเธ (.active) เธกเธตเธเธฃเธญเธเธเธฒเธงเธชเธงเนเธฒเธเน€เธฃเธทเธญเธเนเธชเธเธฃเธญเธเธเธธเนเธก 2) เธเธฃเธฑเธเธเธฃเธธเธเน€เธชเนเธเน€เธเนเธฒเธซเธกเธฒเธข (.target-marker-line) เนเธซเนเนเธชเธ”เธเน€เธเนเธเน€เธชเธฒเธชเธตเธ—เธญเธเน€เธฃเธทเธญเธเนเธชเธเธซเธฑเธงเธกเธเธชเธตเธเธฒเธง (linear-gradient #FFFFFF, #FFF566, #FFB81C, #F59E0B) เธซเธเธฒ 6px เธเธฃเนเธญเธกเน€เธญเธเน€เธเธเธ•เนเน€เธฃเธทเธญเธเนเธชเธ 22px เนเธฅเธฐเธเนเธฒเธข โ–ฒ เน€เธชเนเธเน€เธเนเธฒเธซเธกเธฒเธข เธ•เธฒเธกเธฃเธนเธ 32 เธเธฃเธเธ—เธธเธเน€เธ”เธทเธญเธ (เธ—เธฑเนเธเธเธฃเธฃเธฅเธธเนเธฅเนเธงเนเธฅเธฐเธขเธฑเธเนเธกเนเธเธฃเธฃเธฅเธธ) 3) เธฅเธเธเนเธฒเธขเน€เธเธญเธฃเนเน€เธเนเธเธ•เน (.bar-pct-badge) 117.2% เธ—เธตเนเธชเนเธงเธเธซเธฑเธงเธเธฃเธฒเธเธฅเนเธฒเธเธญเธญเธเธ•เธฒเธกเธฃเธนเธเธ—เธตเนเธชเนเธเธกเธฒ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (1.เน€เธเธฅเธตเนเธขเธเธเธธเนเธกเธฃเธนเธ 30 เน€เธเนเธเนเธเธเธฃเธนเธเธ—เธตเน 31 เนเธฅเธฐเธเธ“เธฐเธฅเธฒเธเน€เธกเนเธฒเนเธเธชเธตเน€เธ”เนเธเธเธฑเธ”เธเธถเนเธเธกเธฒ เนเธฅเธฐเธ•เธญเธเน€เธฅเธทเธญเธเธ”เนเธงเธข / 2.เน€เธชเนเธเธเธฑเธข เนเธซเนเน€เธเธฅเธตเนเธขเธเน€เธเนเธเธ•เธฒเธกเธฃเธนเธ 32 เธ—เธธเธเธญเธฑเธ / เน€เธญเธฒเธญเธญเธ [เธเนเธฒเธข 117.2%])',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธเนเธเธฃเธเธชเธฃเนเธฒเธ UI เธเธธเนเธกเน€เธฅเธทเธญเธเน€เธ”เธทเธญเธ เนเธ–เธเธฅเธนเธเธจเธฃ เนเธฅเธฐเน€เธชเนเธเน€เธเนเธฒเธซเธกเธฒเธขเธ•เธฒเธกเนเธเธเธญเนเธฒเธเธญเธดเธ)'
    },
    {
      id: 'log_000_wbs_passed_target_as_finish_line_checkered',
      timestamp: '2026-10-17 22:38:00',
      timestampTh: '17 เธ•.เธ. 2569, 22:38 เธ.',
      type: 'EDIT',
      typeBadge: 'เน€เธเธฅเธตเนเธขเธเน€เธเธเธฒเธฐเน€เธชเนเธเน€เธเธตเธขเธงเน€เธเนเธเธฅเธฒเธขเน€เธชเนเธเธเธฑเธข',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธฅเธตเนเธขเธเน€เธเธเธฒเธฐเน€เธชเนเธเน€เธเนเธฒเธซเธกเธฒเธขเธเธฃเธ“เธตเธเธฃเธฃเธฅเธธเน€เธเนเธฒ (เธ—เธตเนเน€เธเธขเน€เธเนเธเธชเธตเน€เธเธตเธขเธง) เนเธซเนเนเธชเธ”เธเน€เธเนเธเธฅเธฒเธขเน€เธชเธฒเน€เธชเนเธเธเธฑเธขเนเธ—เธ',
      targetSubject: 'เน€เธกเธเธน WBS เธเธเน€เธซเธฅเธทเธญ (#tab-wbs) - เธเธฃเธฒเธเน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธเธเธฒเธฃเธเธดเธ”เธเธฒเธเธ•เธฒเธกเน€เธเนเธฒเธซเธกเธฒเธขเธฃเธฐเธ”เธฑเธ KPI 5',
      storageFile: 'js/wbs.js, css/styles.css, index.html',
      changeSummary: 'เธเธเน€เธชเนเธเน€เธเนเธฒเธซเธกเธฒเธขเธชเธตเธ—เธญเธเธเธตเธญเธญเธเน€เธ”เธดเธกเนเธงเนเธชเธณเธซเธฃเธฑเธเน€เธ”เธทเธญเธเธ—เธตเนเธขเธฑเธเนเธกเนเธเธฃเธฃเธฅเธธเน€เธเนเธฒเธซเธกเธฒเธข เนเธ•เนเน€เธเธฅเธตเนเธขเธเน€เธเธเธฒเธฐเน€เธชเนเธเน€เธเนเธฒเธซเธกเธฒเธขเธเธฃเธ“เธตเธเธฃเธฃเธฅเธธเน€เธเนเธฒเธซเธกเธฒเธขเนเธฅเนเธง (เธ—เธตเนเน€เธเธขเน€เธเนเธเธชเธตเน€เธเธตเธขเธง) เนเธซเนเนเธชเธ”เธเน€เธเนเธเธฅเธฒเธขเน€เธชเธฒเธ•เธฒเธฃเธฒเธเธซเธกเธฒเธเธฃเธธเธเน€เธชเนเธเธเธฑเธข (Finish Line ๐) เธเธญเธเธ—เธญเธเน€เธฃเธทเธญเธเนเธชเธ เนเธฅเธฐเธเนเธฒเธข ๐ เน€เธชเนเธเธเธฑเธข เธญเธขเนเธฒเธเธฅเธเธ•เธฑเธง',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: 1) เธเธฃเธฑเธเธเธฃเธธเธเธชเนเธ•เธฅเนเธเธญเธเน€เธชเนเธเน€เธเนเธฒเธซเธกเธฒเธขเน€เธกเธทเนเธญเธเธฃเธฃเธฅเธธเน€เธเนเธฒ (target-marker-line.is-passed) เธเธฒเธเน€เธ”เธดเธกเธ—เธตเนเน€เธเนเธเธชเธตเน€เธเธตเธขเธง เนเธซเนเน€เธเธฅเธตเนเธขเธเน€เธเนเธเธฅเธฒเธขเน€เธชเธฒเธ•เธฒเธฃเธฒเธเธซเธกเธฒเธเธฃเธธเธเธเธฒเธง-เธ”เธณเธเธญเธเน€เธชเนเธเธเธฑเธข (repeating-linear-gradient) เธเธงเธฒเธกเธซเธเธฒ 7px เธเธฃเนเธญเธกเธเธญเธเธชเธตเธ—เธญเธเน€เธฃเธทเธญเธเนเธชเธ 2) เธเธฃเธฑเธเธเนเธญเธเธงเธฒเธกเธเนเธฒเธขเธเธณเธเธฑเธเธเธญเธเน€เธชเนเธเน€เธเนเธ "๐ เน€เธชเนเธเธเธฑเธข (XX.XX เธฅเธ.)" เธเธฃเนเธญเธกเธเธฃเธญเธเธชเธตเธ—เธญเธเธเธตเธญเธญเธ 3) เธชเนเธงเธเน€เธ”เธทเธญเธเธ—เธตเนเธขเธฑเธเนเธกเนเธ–เธถเธเน€เธเนเธฒเธซเธกเธฒเธขเธขเธฑเธเธเธเนเธชเธ”เธเน€เธเนเธเน€เธชเนเธเธ—เธญเธเธซเธเธฒ 6px โ–ฒ เน€เธชเนเธเน€เธเนเธฒเธซเธกเธฒเธข เธ•เธฒเธกเธ”เธตเนเธเธเนเน€เธ”เธดเธก',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธเธฅเธตเนเธขเธเน€เธเธเธฒเธฐเธชเธตเน€เธเธตเธขเธงเน€เธเนเธเธชเธตเน€เธชเนเธเธเธฑเธขเนเธ—เธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเธเธฃเธธเธ UI เธเธฃเธฒเธเน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธเน€เธเนเธฒเธซเธกเธฒเธข KPI)'
    },
    {
      id: 'log_000_wbs_revert_finish_line_prominent_target_marker',
      timestamp: '2026-10-17 22:33:00',
      timestampTh: '17 เธ•.เธ. 2569, 22:33 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธเธเธฒเธ”เน€เธชเนเธเน€เธเนเธฒเธซเธกเธฒเธขเน€เธ”เธดเธกเนเธซเนเน€เธ”เนเธเธเธฑเธ”',
      badgeClass: 'badge-type-edit',
      title: 'เธขเธเน€เธฅเธดเธเน€เธชเนเธเธเธฑเธข เธซเธฑเธเธเธฅเธฑเธเธกเธฒเนเธเนเน€เธชเนเธเน€เธเนเธฒเธซเธกเธฒเธขเนเธเธเน€เธ”เธดเธก เธเธฃเนเธญเธกเน€เธเธดเนเธกเธเธเธฒเธ”เน€เธชเนเธเนเธซเนเธซเธเธฒเนเธซเธเนเธเธถเนเธเนเธฅเธฐเธชเนเธญเธเธชเธงเนเธฒเธเน€เธ”เนเธเธเธฑเธ”',
      targetSubject: 'เน€เธกเธเธน WBS เธเธเน€เธซเธฅเธทเธญ (#tab-wbs) - เธเธฃเธฒเธเน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธเธเธฒเธฃเธเธดเธ”เธเธฒเธเธ•เธฒเธกเน€เธเนเธฒเธซเธกเธฒเธขเธฃเธฐเธ”เธฑเธ KPI 5',
      storageFile: 'js/wbs.js, css/styles.css, index.html',
      changeSummary: 'เธขเธเน€เธฅเธดเธเธ”เธตเนเธเธเนเน€เธชเนเธเธเธฑเธข (เธเธเนเธฅเธฐเน€เธชเธฒเธซเธกเธฒเธเธฃเธธเธ) เธเธฅเธฑเธเธกเธฒเนเธเนเน€เธชเนเธเน€เธเนเธฒเธซเธกเธฒเธขเนเธเธเน€เธ”เธดเธก เธเธฃเนเธญเธกเธเธขเธฒเธขเธเธงเธฒเธกเธซเธเธฒเธเธญเธเน€เธชเนเธเน€เธเนเธ 5px เธชเธตเธ—เธญเธเธเธตเธญเธญเธเน€เธเธฅเนเธเธเธฃเธฐเธเธฒเธขเน€เธฃเธทเธญเธเนเธชเธเนเธ”เธ”เน€เธ”เนเธเธชเธฐเธ”เธธเธ”เธ•เธฒ เนเธฅเธฐเธเธเธเนเธฒเธขเธเธณเธเธฑเธเน€เธ”เธดเธก โ–ฒ เน€เธชเนเธเน€เธเนเธฒเธซเธกเธฒเธข',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: 1) เธขเธเน€เธฅเธดเธเธญเธเธเนเธเธฃเธฐเธเธญเธเน€เธชเนเธเธเธฑเธข (Finish Line ๐) เธ—เธฑเนเธเน€เธชเธฒเธซเธกเธฒเธเธฃเธธเธเนเธฅเธฐเธเธเธฅเธญเธข 2) เธเธณเน€เธชเนเธเน€เธเนเธฒเธซเธกเธฒเธข (target-marker-line) เนเธฅเธฐเธเนเธฒเธขเน€เธ”เธดเธก (target-marker-label: โ–ฒ เน€เธชเนเธเน€เธเนเธฒเธซเธกเธฒเธข (XX.XX เธฅเธ.)) เธเธฅเธฑเธเธกเธฒเนเธเนเธเธฒเธ 3) เธเธขเธฒเธขเธเธงเธฒเธกเธซเธเธฒเธเธญเธเน€เธชเนเธเน€เธเนเธฒเธซเธกเธฒเธขเธเธฒเธเน€เธ”เธดเธก ~2px เน€เธเธดเนเธกเน€เธเนเธ 5px เธเธฃเนเธญเธกเนเธฅเนเน€เธเธ”เธชเธตเธ—เธญเธเธชเธงเนเธฒเธ (gradient #FFFFFF เธ–เธถเธ #FFD700 เนเธฅเธฐ #F59E0B) เธเธญเธเธชเธตเธเธฒเธงเธชเธฐเธ—เนเธญเธเนเธชเธ เนเธฅเธฐเนเธชเนเน€เธญเธเน€เธเธเธ•เนเน€เธฃเธทเธญเธเนเธชเธ (box-shadow neon glow) เธชเธนเธเธ–เธถเธ 20px เนเธซเนเธกเธญเธเน€เธซเนเธเธเธฑเธ”เน€เธเธเธชเธฐเธ”เธธเธ”เธ•เธฒ 4) เธเนเธฒเธขเธเธณเธเธฑเธเธงเธฒเธเธเธดเธ”เธ”เนเธฒเธเธเนเธฒเธเน€เธชเนเธเธญเธขเนเธฒเธเน€เธเนเธเธฃเธฐเน€เธเธตเธขเธเธ•เธฒเธกเธ•เธณเนเธซเธเนเธเน€เธเธญเธฃเนเน€เธเนเธเธ•เนเธเธญเธเน€เธเนเธฒเธซเธกเธฒเธข',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (undo เน€เธชเนเธเธเธฑเธข เนเธเนเนเธเธเน€เธ”เธดเธก เน€เธเธดเนเธกเธเธเธฒเธ”เน€เธชเนเธเนเธซเนเนเธซเธเนเธเธถเนเธ เน€เธ”เนเธเธเธฑเธ”)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเธเธฃเธธเธ UI/UX เธเธงเธฒเธกเธเธฑเธ”เน€เธเธเธเธญเธเน€เธชเนเธเน€เธเนเธฒเธซเธกเธฒเธขเธ•เธฒเธกเธเธงเธฒเธกเธ•เนเธญเธเธเธฒเธฃ)'
    },
    {
      id: 'log_000_wbs_finish_line_and_month_style',
      timestamp: '2026-10-17 22:25:00',
      timestampTh: '17 เธ•.เธ. 2569, 22:25 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเน€เธชเนเธเธเธฑเธขเนเธฅเธฐเธเธธเนเธกเน€เธฅเธทเธญเธเน€เธ”เธทเธญเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธฃเธฑเธเน€เธชเนเธเน€เธเนเธฒเธซเธกเธฒเธขเน€เธเนเธเน€เธชเนเธเธเธฑเธข (Finish Line ๐) เนเธ”เธ”เน€เธ”เนเธเธเธฑเธ”เน€เธเธ เนเธฅเธฐเธเธฃเธฑเธเธเธทเนเธเธซเธฅเธฑเธเธเธธเนเธกเน€เธฅเธทเธญเธเน€เธ”เธทเธญเธเธ•เธฒเธกเธเนเธฒเธขเธซเธเนเธงเธขเธงเธฑเธ”',
      targetSubject: 'เน€เธกเธเธน WBS เธเธเน€เธซเธฅเธทเธญ (#tab-wbs) - เธเธฒเธฃเนเธ”เน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธเน€เธเนเธฒเธซเธกเธฒเธข KPI เธฃเธฐเธ”เธฑเธ 5',
      storageFile: 'js/wbs.js, css/styles.css, index.html',
      changeSummary: 'เธฅเธเธเนเธญเธเธงเธฒเธกเธญเธเธดเธเธฒเธขเนเธ•เนเธซเธฑเธงเธเนเธญเธญเธญเธเธ•เธฒเธกเธ—เธตเนเธเธฒเธเธเธฒเธ—, เธเธฃเธฑเธเธชเธตเธเธทเนเธเธซเธฅเธฑเธเธเธธเนเธกเน€เธฅเธทเธญเธเน€เธ”เธทเธญเธเน€เธเนเธฒเธซเธกเธฒเธขเน€เธเนเธเนเธ—เธเธชเธตเธกเนเธงเธเน€เธซเธกเธทเธญเธเธเนเธฒเธขเธซเธเนเธงเธขเธงเธฑเธ”เธกเธนเธฅเธเนเธฒ, เนเธฅเธฐเน€เธเธฅเธตเนเธขเธเน€เธชเนเธเน€เธเนเธฒเธซเธกเธฒเธขเธเธเธซเธฅเธญเธ”เธเธฃเธฒเธเน€เธเนเธเน€เธชเธฒเน€เธชเนเธเธเธฑเธขเธฅเธฒเธขเธเธเธซเธกเธฒเธเธฃเธธเธเธเธฒเธง-เธ”เธณเธเธญเธเธ—เธญเธเน€เธฃเธทเธญเธเนเธชเธเธเธฃเนเธญเธกเธเธเธฅเธญเธขเน€เธ”เนเธ ๐ เน€เธชเนเธเธเธฑเธขเน€เธเนเธฒเธซเธกเธฒเธข',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: 1) เน€เธญเธฒเธเนเธญเธเธงเธฒเธกเธญเธเธดเธเธฒเธข (wbs-kpi-comp-subtitle) เธญเธญเธเธ•เธฒเธกเธ•เธณเนเธซเธเนเธเธ—เธตเนเธเธฒเธเธเธฒเธ— 2) เธเธฃเธฑเธเธชเธตเธเธทเนเธเธซเธฅเธฑเธเนเธฅเธฐเธเธญเธเธเธญเธเธเธธเนเธกเน€เธฅเธทเธญเธเน€เธ”เธทเธญเธ (.btn-wbs-kpi-month) เนเธซเนเน€เธเนเธเธชเธตเธกเนเธงเธ rgba(168, 85, 247, 0.2) เธเธญเธ rgba(168, 85, 247, 0.45) เธ•เธฃเธเธ•เธฒเธกเธชเนเธ•เธฅเนเธเนเธฒเธขเธซเธเนเธงเธขเธงเธฑเธ” [๐’ฐ เธกเธนเธฅเธเนเธฒ (เธเธฒเธ—)] เธ—เธตเนเธเธตเนเธฅเธนเธเธจเธฃ 3) เธเธฃเธฑเธเธเธฃเธธเธเน€เธชเนเธเน€เธเนเธฒเธซเธกเธฒเธขเธเธเธเธฃเธฒเธเนเธ—เนเธเธฅเนเธฒเธเนเธซเนเนเธ”เธ”เน€เธ”เนเธ เนเธ”เธขเน€เธเธฅเธตเนเธขเธเน€เธเนเธเน€เธชเนเธเธเธฑเธขเน€เธเนเธฒเธซเธกเธฒเธข (target-finish-line): เน€เธชเธฒเธซเธกเธฒเธเธฃเธธเธเธเธฒเธง-เธ”เธณเธเธญเธเธ—เธญเธเน€เธฃเธทเธญเธเนเธชเธ (finish-line-pole) เธเธฃเนเธญเธกเธเธเน€เธชเนเธเธเธฑเธขเธฅเธญเธขเธ•เธฑเธง (finish-line-flag) เนเธชเธ”เธเธเนเธฒเธข "๐ เน€เธชเนเธเธเธฑเธข (XX.XX เธฅเธ.)" เธญเธขเนเธฒเธเน€เธ”เนเธเธเธฑเธ” เธเธฃเนเธญเธกเนเธญเธเธดเน€เธกเธเธฑเธเธฅเธญเธขเธ•เธฑเธงเน€เธเธฒเน เนเธฅเธฐเน€เธเธฅเธตเนเธขเธเน€เธเนเธเธชเธตเน€เธเธตเธขเธงเธกเธฃเธเธ•เน€เธกเธทเนเธญเธเนเธฒเธเน€เธชเนเธเธเธฑเธขเนเธฅเนเธง',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธญเธฒเธญเธญเธเธ—เธตเนเธเธฒเธเธเธฒเธ— เนเธฅเธฐเธงเธเธเธฅเธกเธเธธเนเธกเน€เธฅเธทเธญเธเน€เธ”เธทเธญเธเนเธซเนเน€เธเธฅเธตเนเธขเธเธชเธตเธเธทเนเธเธซเธฅเธฑเธเน€เธซเธกเธทเธญเธเธเธฑเธเธ—เธตเนเธเธตเนเธฅเธนเธเธจเธฃ / เนเธเนเนเธเนเธซเนเนเธ”เธ”เน€เธ”เนเธ เธซเธฃเธทเธญเนเธเนเน€เธชเนเธเธเธฑเธขเนเธ—เธเธเนเนเธ”เน)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเธเธฃเธธเธ UI/UX เธเธงเธฒเธกเนเธ”เธ”เน€เธ”เนเธเนเธฅเธฐเธเธงเธฒเธกเธชเธงเธขเธเธฒเธก)'
    },
    {
      id: 'log_000_target_projection_add_december',
      timestamp: '2026-10-17 22:10:00',
      timestampTh: '17 เธ•.เธ. 2569, 22:10 เธ.',
      type: 'EDIT',
      typeBadge: 'เน€เธเธดเนเธกเน€เธเนเธฒเธซเธกเธฒเธขเน€เธ”เธทเธญเธ เธ.เธ. เธฃเธงเธก 4 เน€เธ”เธทเธญเธ',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธดเนเธกเธเธฒเธฃเนเธชเธ”เธเน€เธเนเธฒเธซเธกเธฒเธขเธ—เธตเนเธ•เนเธญเธเธเธดเธ”เธเธฒเธเน€เธเธดเนเธกเน€เธ”เธทเธญเธ เธ.เธ. เธฃเธงเธก 4 เน€เธ”เธทเธญเธ เธ—เธฑเนเธเน€เธกเธเธนเธ เธฒเธเธฃเธงเธกเนเธฅเธฐ WBS เธเธเน€เธซเธฅเธทเธญ',
      targetSubject: 'เน€เธกเธเธนเธ เธฒเธเธฃเธงเธกเธเธนเนเธเธฃเธดเธซเธฒเธฃ (เนเธเธเน€เธเนเธฒเธซเธกเธฒเธขเธเธดเธ”เธเธฒเธเน€เธเธดเนเธก) เนเธฅเธฐ เน€เธกเธเธน WBS เธเธเน€เธซเธฅเธทเธญ (เธเธฃเธฒเธเน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธ KPI 5)',
      storageFile: 'js/app.js, css/styles.css, index.html',
      changeSummary: 'เธเธขเธฒเธขเธเนเธงเธเธเธฒเธฃเธเธณเธเธงเธ“เนเธฅเธฐเนเธชเธ”เธเธเธฅเน€เธเนเธฒเธซเธกเธฒเธขเธ—เธตเนเธ•เนเธญเธเธเธดเธ”เธเธฒเธเน€เธเธดเนเธกเธฃเธฐเธ”เธฑเธ KPI 5 เนเธซเนเธเธฃเธญเธเธเธฅเธธเธกเธ–เธถเธเน€เธ”เธทเธญเธ เธ.เธ. 2569 เธฃเธงเธกเธ—เธฑเนเธเธชเธดเนเธ 4 เน€เธ”เธทเธญเธ (เธ.เธข., เธ•.เธ., เธ.เธข., เธ.เธ.) เธ—เธฑเนเธเนเธเน€เธกเธเธนเธ เธฒเธเธฃเธงเธกเธเธนเนเธเธฃเธดเธซเธฒเธฃเนเธฅเธฐเน€เธกเธเธน WBS เธเธเน€เธซเธฅเธทเธญ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: 1) เธเธฃเธฑเธ maxOffsets เนเธ renderNext3MonthsProjection เน€เธเนเธ 4 เน€เธเธทเนเธญเนเธซเนเธเธณเธเธงเธ“เน€เธเนเธฒเธซเธกเธฒเธขเธฃเธฐเธ”เธฑเธ 5 เธเธฃเธญเธเธเธฅเธธเธกเธ–เธถเธเธชเธดเนเธเธเธต 2569 (เธ.เธ. 69 เน€เธเนเธฒ KPI 100%) 2) เน€เธกเธเธนเธ เธฒเธเธฃเธงเธก: เนเธชเธ”เธเธเธฒเธฃเนเธ”เน€เธเนเธฒเธซเธกเธฒเธข 4 เน€เธ”เธทเธญเธเนเธเธเธฃเธดเธ” 4 เธเธญเธฅเธฑเธกเธเน, เนเธชเธ”เธเธ•เธฒเธฃเธฒเธเน€เธเนเธฒเธซเธกเธฒเธขเนเธฅเธฐเนเธ–เธเธฃเธงเธกเธชเธฑเธ”เธชเนเธงเธ 4 เธเนเธงเธเน€เธ”เธทเธญเธ 3) เน€เธกเธเธน WBS เธเธเน€เธซเธฅเธทเธญ: เนเธ–เธเน€เธฅเธทเธญเธเน€เธ”เธทเธญเธเน€เธเนเธฒเธซเธกเธฒเธขเนเธชเธ”เธเธเธฃเธ 4 เน€เธ”เธทเธญเธ (เธ.เธข. เธเธฃเธฃเธฅเธธเน€เธเนเธฒ, เธ•.เธ., เธ.เธข., เธ.เธ.) เธชเธฒเธกเธฒเธฃเธ–เธเธฅเธดเธเน€เธฅเธทเธญเธเน€เธ”เธทเธญเธ เธ.เธ. เน€เธเธทเนเธญเน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธเธเธฑเธเธขเธญเธ” SAP + เธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเน€เธฅเธทเธญเธเนเธเธ Real-time',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธเนเธฒเธซเธกเธฒเธขเธ—เธตเนเธ•เนเธญเธเธเธดเธ”เน€เธเธดเนเธก เนเธซเนเน€เธเธดเนเธกเน€เธ”เธทเธญเธ เธ.เธ. เธ”เนเธงเธข เธฃเธงเธก 4 เน€เธ”เธทเธญเธ เธ—เธฑเนเธเน€เธกเธเธนเธ เธฒเธเธฃเธงเธก เนเธฅเธฐเน€เธกเธเธน WBS เธเธเน€เธซเธฅเธทเธญ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธขเธฒเธขเธเธญเธเน€เธเธ•เธเนเธงเธเน€เธงเธฅเธฒเธเธฒเธฃเธเธณเธฅเธญเธเน€เธเนเธฒเธซเธกเธฒเธข KPI)'
    },
    {
      id: 'log_000_wbs_kpi5_target_comparison_bars',
      timestamp: '2026-10-17 21:40:00',
      timestampTh: '17 เธ•.เธ. 2569, 21:40 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฒเธเน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธเน€เธเนเธฒเธซเธกเธฒเธข KPI 5',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธดเนเธกเธเธฒเธฃเนเธชเธ”เธเธเธฃเธฒเธเนเธเธงเธเธญเธ 2 เธเธฑเนเธ เน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธเน€เธเนเธฒเธซเธกเธฒเธข KPI เธฃเธฐเธ”เธฑเธ 5 เนเธเน€เธกเธเธน WBS เธเธเน€เธซเธฅเธทเธญ',
      targetSubject: 'เน€เธกเธเธน WBS เธเธเน€เธซเธฅเธทเธญ (#tab-wbs) - เธชเนเธงเธเน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธเน€เธเนเธฒเธซเธกเธฒเธข KPI 5 เนเธฅเธฐเธเธฒเธฃเธเธดเธ”เธเธฒเธ',
      storageFile: 'js/wbs.js, js/app.js, css/styles.css, index.html',
      changeSummary: 'เน€เธเธดเนเธกเธเธฃเธฒเธเนเธเธงเธเธญเธ 2 เธเธฑเนเธเน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธเน€เธเนเธฒเธซเธกเธฒเธข KPI เธฃเธฐเธ”เธฑเธ 5 (เธเธฃเธฒเธเธเธ: เธขเธญเธ”เธ•เนเธญเธเธเธดเธ”เน€เธเธดเนเธกเธ•เธฒเธกเน€เธ”เธทเธญเธเธ—เธตเนเน€เธฅเธทเธญเธ) เธเธฑเธเธขเธญเธ”เธ”เธณเน€เธเธดเธเธเธฒเธฃ (เธเธฃเธฒเธเธฅเนเธฒเธ: CLSD F4/F2 + เธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเน€เธฅเธทเธญเธเธเธฒเธ Checkbox) เธเธฃเนเธญเธกเธเธธเนเธกเน€เธฅเธทเธญเธเน€เธ”เธทเธญเธเน€เธเนเธฒเธซเธกเธฒเธข (เธซเธฒเธเธเธฃเธฃเธฅเธธเน€เธเนเธฒเธซเธกเธฒเธขเนเธชเธ”เธ โ“ เธเธฃเธฃเธฅเธธเน€เธเนเธฒ เนเธ•เนเน€เธฅเธทเธญเธเนเธกเนเนเธ”เน) เนเธฅเธฐเนเธเธเน€เธเธญเธฃเนเนเธชเธ”เธเธขเธญเธ”เธ—เธตเนเธ•เนเธญเธเธเธดเธ”เน€เธเธดเนเธกเธซเธฃเธทเธญเน€เธเธดเธเน€เธเนเธฒเธซเธกเธฒเธข',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: 1) เธเธฃเธฒเธเธเธเนเธชเธ”เธเน€เธเนเธฒเธซเธกเธฒเธขเธกเธนเธฅเธเนเธฒ/เธเธฒเธเธ—เธตเนเธ•เนเธญเธเธเธดเธ”เน€เธเธดเนเธกเธฃเธฐเธ”เธฑเธ KPI 5 เธ•เธฒเธกเน€เธเธ“เธ‘เนเธงเธฑเธ”เธ—เธตเนเน€เธฅเธทเธญเธเนเธฅเธฐเน€เธ”เธทเธญเธเธ—เธตเนเน€เธฅเธทเธญเธ (เธ”เธถเธเธเนเธญเธกเธนเธฅเธเธณเธฅเธญเธ 3 เน€เธ”เธทเธญเธเธ–เธฑเธ”เนเธเธเนเธฒเธ window.getKpiSimulationTargetMonths) 2) เธเธฃเธฒเธเธฅเนเธฒเธเนเธชเธ”เธเธขเธญเธ”เธชเธฐเธชเธกเธเธดเธ”เธเธฒเธ CLSD F4 เธชเธณเธซเธฃเธฑเธเน€เธเธ“เธ‘เนเธเนเธญ 1, 2, 5 (เธกเธนเธฅเธเนเธฒ AUC) เธซเธฃเธทเธญ เน€เธเธ“เธ‘เนเธเนเธญ 3 (เธเธณเธเธงเธเธเธฒเธ) เธซเธฃเธทเธญ CLSD F2 เธชเธณเธซเธฃเธฑเธเน€เธเธ“เธ‘เนเธเนเธญ 4 (เธเธณเธเธงเธเธเธฒเธ) เธฃเธงเธกเธเธฑเธเธขเธญเธ”เธเธฒเธ Checkbox เธ•เธฒเธฃเธฒเธ WBS เนเธเธ Real-time 3) เธเธณเธเธงเธ“เธชเนเธงเธเธ•เนเธฒเธ เนเธชเธ”เธเธเนเธฒเธขเธชเธ–เธฒเธเธฐเธเธฃเธฃเธฅเธธเน€เธเนเธฒเธซเธกเธฒเธข/เธขเธฑเธเธ•เนเธญเธเธเธดเธ”เน€เธเธดเนเธก เธเธฃเนเธญเธกเธขเธญเธ”เธเธเน€เธซเธฅเธทเธญเธซเธฃเธทเธญเธขเธญเธ”เน€เธเธดเธเน€เธเนเธฒเธซเธกเธฒเธข 4) เนเธ–เธเธเธธเนเธกเน€เธฅเธทเธญเธเน€เธ”เธทเธญเธเน€เธเนเธฒเธซเธกเธฒเธข (เธ.เธข., เธ•.เธ., เธ.เธข.) เธซเธฒเธเน€เธ”เธทเธญเธเนเธซเธเธเธฃเธฃเธฅเธธเน€เธเนเธฒเธซเธกเธฒเธขเนเธฅเนเธงเธเธฐเนเธชเธ”เธเธเนเธฒเธข โ“ เธเธฃเธฃเธฅเธธเน€เธเนเธฒ เนเธฅเธฐเธเธดเธ”เธเธฒเธฃเธเธฅเธดเธเน€เธฅเธทเธญเธ (disabled) 5) เธญเธญเธเนเธเธเธชเนเธ•เธฅเน Luxury Dark/Light Theme เธกเธตเน€เธญเธเน€เธเธเธ•เนเนเธญเธเธดเน€เธกเธเธฑเธ เนเธฅเธฐเธฃเธญเธเธฃเธฑเธ Responsive',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธเน€เธกเธเธน WBS เธเธเน€เธซเธฅเธทเธญ เนเธซเนเน€เธเธดเนเธกเธเธฒเธฃเนเธชเธ”เธ เธเธฒเธฃเธเธดเธ”เธกเธนเธฅเธเนเธฒ/เธเธฒเธ เธ—เธตเนเธ•เนเธญเธเธ—เธณเน€เธเธดเนเธก เนเธซเนเนเธ”เนเธ•เธฒเธกเน€เธเนเธฒเธซเธกเธฒเธขเธฃเธฐเธ”เธฑเธ KPI 5)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธชเธนเธ (เน€เธเธดเนเธกเธเธตเน€เธเธญเธฃเนเธเธฒเธฃเธงเธดเน€เธเธฃเธฒเธฐเธซเนเน€เธเนเธฒเธซเธกเธฒเธขเน€เธเธดเธเน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธเนเธ WBS)'
    },
    {
      id: 'log_000_criteria_font_color_match',
      timestamp: '2026-10-17 21:10:00',
      timestampTh: '17 เธ•.เธ. 2569, 21:10 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธเธญเธเธ•เนเนเธฅเธฐเธชเธตเธ•เธฑเธงเธเธฃเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ”',
      badgeClass: 'badge-type-edit',
      title: 'เธเธฃเธฑเธเธ•เธฑเธงเธญเธฑเธเธฉเธฃเนเธฅเธฐเธชเธตเธเธญเธเธ•เธฑเธงเธเธฃเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ”เนเธซเนเน€เธซเธกเธทเธญเธเธเธฑเธเธ•เธฑเธงเธเธฃเธญเธเธญเธทเนเธเน',
      targetSubject: 'เธฃเธฒเธขเธเธฒเธฃเธ•เธฑเธงเน€เธฅเธทเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ” (dropdown เนเธ–เธเธ•เธฑเธงเธเธฃเธญเธเธ”เนเธฒเธเธเธ)',
      storageFile: 'css/styles.css, index.html',
      changeSummary: 'เธเธฃเธฑเธเธเธเธฒเธ”เธ•เธฑเธงเธญเธฑเธเธฉเธฃ (0.94rem) เธเนเธณเธซเธเธฑเธเธ•เธฑเธงเธญเธฑเธเธฉเธฃ (500) เนเธฅเธฐเนเธ—เธเธชเธต (#FFB81C เนเธ Dark Mode, #111827 เนเธ Light Mode) เธเธญเธเธฃเธฒเธขเธเธฒเธฃเธ•เธฑเธงเน€เธฅเธทเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ”เนเธซเนเน€เธ—เนเธฒเธเธฑเธเนเธฅเธฐเธ•เธฃเธเธ•เธฒเธกเธฃเธฒเธขเธเธฒเธฃเธ•เธฑเธงเน€เธฅเธทเธญเธเธเธญเธเธ•เธฑเธงเธเธฃเธญเธเธญเธทเนเธเน เธ—เธธเธเธเธฃเธฐเธเธฒเธฃ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: เธเธณเธซเธเธ” .crit-dd-option เนเธฅเธฐ .crit-dd-name เนเธซเนเนเธเน font-family: inherit, font-size: 0.94rem, font-weight: 500, color: #FFB81C เนเธเธเธตเธกเธกเธทเธ” เนเธฅเธฐ color: #111827 เนเธเธเธตเธกเธชเธงเนเธฒเธ เธชเธณเธซเธฃเธฑเธเธ—เธฑเนเธเธชเธ–เธฒเธเธฐเธเธเธ•เธดเนเธฅเธฐเธชเธ–เธฒเธเธฐเธ—เธตเนเธ–เธนเธเน€เธฅเธทเธญเธ (.selected) เนเธ”เธขเธขเธฑเธเธเธเธเนเธฒเธขเธซเธเนเธงเธขเธงเธฑเธ” (เธกเธนเธฅเธเนเธฒ/เธเธฒเธ) เธเธดเธ”เธเธงเธฒเนเธฅเธฐเนเธฎเนเธฅเธ•เนเน€เธกเธทเนเธญ hover/focus เธ•เธฒเธกเน€เธ”เธดเธก เธเธฃเนเธญเธก bump เน€เธงเธญเธฃเนเธเธฑเธเนเธเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธเนเธ•เธฑเธงเธญเธฑเธเธฉเธฃ เนเธฅเธฐเธชเธต เน€เธซเธกเธทเธญเธเธเธฑเธเธ•เธฑเธงเธเธฃเธญเธเธญเธทเนเธเน)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเนเธ•เนเธ UI/Typography)'
    },
    {
      id: 'log_000_criteria_option_hover_highlight',
      timestamp: '2026-10-17 21:05:00',
      timestampTh: '17 เธ•.เธ. 2569, 21:05 เธ.',
      type: 'EDIT',
      typeBadge: 'เธชเธตเนเธฎเนเธฅเธ•เนเธ•เธฑเธงเน€เธฅเธทเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ”',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธดเนเธกเธชเธตเนเธฎเนเธฅเธ•เนเธ•เธญเธเน€เธฅเธทเนเธญเธเธเธตเนเธ•เธฑเธงเน€เธฅเธทเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ”เนเธซเนเน€เธซเธกเธทเธญเธเธ•เธฑเธงเธเธฃเธญเธเธญเธทเนเธเน',
      targetSubject: 'เธฃเธฒเธขเธเธฒเธฃเธ•เธฑเธงเน€เธฅเธทเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ” (dropdown เนเธ–เธเธ•เธฑเธงเธเธฃเธญเธเธ”เนเธฒเธเธเธ)',
      storageFile: 'css/styles.css, index.html',
      changeSummary: 'เธ•เธญเธเน€เธฅเธทเนเธญเธเน€เธกเธฒเธชเนเธเธตเนเธซเธฃเธทเธญเนเธเนเธเธตเธขเนเธเธญเธฃเนเธ”เน€เธฅเธทเธญเธเนเธ–เธงเธเนเธญ 1.1 - 5 เธเธฐเธกเธตเธเธทเนเธเธซเธฅเธฑเธเธชเธตเนเธฎเนเธฅเธ•เน (Highlight system color / #1E90FF) เนเธฅเธฐเธ•เธฑเธงเธญเธฑเธเธฉเธฃเน€เธเธฅเธตเนเธขเธเน€เธเนเธเธชเธตเธเธฒเธง เน€เธซเธกเธทเธญเธเธฃเธฒเธขเธเธฒเธฃเธ•เธฑเธงเน€เธฅเธทเธญเธ native เธเธญเธเธ•เธฑเธงเธเธฃเธญเธเธญเธทเนเธเน',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: เธเธฃเธฑเธ .crit-dd-option:hover เนเธฅเธฐ .crit-dd-option.focused เนเธซเนเธกเธต background-color: Highlight (#1E90FF) เธเธฃเนเธญเธก color: HighlightText (#FFFFFF) เธ—เธฑเนเธเนเธ Dark Mode เนเธฅเธฐ Light Mode เน€เธกเธทเนเธญเนเธกเนเนเธ”เนเธเธตเนเธซเธฃเธทเธญเน€เธฅเธทเธญเธเธเธเธชเธตเธ—เธญเธ #FFB81C เนเธ”เธขเนเธกเนเธกเธตเน€เธเธฒเธเธทเนเธเธซเธฅเธฑเธ เนเธฅเธฐ bump เน€เธงเธญเธฃเนเธเธฑเธเนเธเธ css',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธญเธขเธฒเธเนเธซเนเนเธเนเธ•เธฑเธงเธเธฃเธญเธเน€เธเธฏเธงเธฑเธ” เนเธซเนเธ•เธญเธเธเธตเนเธกเธตเธชเธตเนเธฎเนเธฅเธ•เนเน€เธซเธกเธทเธญเธเธ•เธฑเธงเธเธฃเธญเธเธญเธทเนเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเนเธ•เนเธ UI/UX เธเธฒเธฃเธเธตเนเน€เธฅเธทเธญเธเธ•เธฑเธงเธเธฃเธญเธ)'
    },
    {
      id: 'log_000_chart_xlabel_click',
      timestamp: '2026-10-17 21:00:00',
      timestampTh: '17 เธ•.เธ. 2569, 21:00 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฅเธดเธเธเธทเนเธญเธซเธเนเธงเธขเธเธฒเธเธเธเธเธฃเธฒเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธฅเธดเธเธเธทเนเธญเธซเธเนเธงเธขเธเธฒเธเธเธเนเธเธ X เธเธญเธเธเธฃเธฒเธเนเธ—เนเธเน€เธเธทเนเธญเน€เธฅเธทเธญเธเธซเธเนเธงเธขเธเธฒเธเนเธ”เน เน€เธซเธกเธทเธญเธเธเธฅเธดเธเธ—เธตเนเนเธ—เนเธเธเธฃเธฒเธ',
      targetSubject: 'เธเธฃเธฒเธเธเธฅเธเธฒเธฃเธ”เธณเน€เธเธดเธเธเธฒเธ % เธเธดเธ”เธเธฒเธเธฃเธฒเธข เธเธเธ. (PeaChart เนเธเธ bar)',
      storageFile: 'js/chart.js, index.html',
      changeSummary: 'เธเธทเนเธญเธซเธเนเธงเธขเธเธฒเธเธ—เธตเนเธซเธกเธธเธเน€เธญเธตเธขเธเนเธ•เนเธเธฃเธฒเธเธเธฅเธดเธเนเธ”เน เน€เธกเธฒเธชเนเน€เธเธฅเธตเนเธขเธเน€เธเนเธเธฃเธนเธเธกเธทเธญเน€เธกเธทเนเธญเธเธตเนเธ—เธตเนเธเธทเนเธญ เนเธฅเธฐเน€เธฃเธตเธขเธ onClick เน€เธ”เธตเธขเธงเธเธฑเธเธเธฒเธฃเธเธฅเธดเธเนเธ—เนเธ (เน€เธฅเธทเธญเธ/เธขเธเน€เธฅเธดเธเธซเธเนเธงเธขเธเธฒเธ, เธเธฅเธดเธเธเธเธ.3 เธ—เธฑเนเธเธซเธกเธ” = ALL)',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: เนเธ renderBarChart เน€เธเนเธเธเธดเธเธฑเธ”/เธกเธธเธก/เธเธงเธฒเธกเธเธงเนเธฒเธเธเนเธญเธเธงเธฒเธกเธเธญเธเธเนเธฒเธขเนเธเธ X เธฅเธ this.renderedXLabels เนเธฅเนเธง hit-test เธ•เธณเนเธซเธเนเธเน€เธกเธฒเธชเนเธ”เนเธงเธขเธเธฒเธฃเธซเธกเธธเธเธเธดเธเธฑเธ”เธขเนเธญเธเธ•เธฒเธกเธกเธธเธกเธเนเธฒเธข (เน€เธฅเธทเธญเธเธเนเธฒเธขเธ—เธตเนเนเธเธฅเนเธชเธธเธ”เน€เธกเธทเนเธญเธเนเธญเธเธเธฑเธ) เนเธ”เน this.lastHoveredLabelItem เธ—เธตเนเธกเธตเธฃเธนเธเนเธเธเน€เธ”เธตเธขเธงเธเธฑเธ item เธเธญเธเนเธ—เนเธ (label, gIdx, extra) เธ•เธฑเธงเธเธฑเธ”เธเธฒเธฃ click เนเธเน lastHoveredItem || lastHoveredLabelItem เนเธฅเธฐเธเธฃเธฑเธ cursor เน€เธเนเธ pointer เธเธเธเนเธฒเธขเธเธทเนเธญ เนเธกเนเธเธฃเธฐเธ—เธเธเธฒเธฃเนเธชเธ”เธเธเธฅ/เน€เธชเนเธเน€เธเนเธฒเธซเธกเธฒเธข เนเธฅเธฐ bump เน€เธงเธญเธฃเนเธเธฑเธเนเธเธ chart.js',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธเธฅเธดเธเธ•เธฑเธงเธญเธฑเธเธฉเธฃเธซเธเนเธงเธขเธเธฒเธ เธชเธฒเธกเธฒเธฃเธ–เน€เธเธฅเธตเนเธขเธเธ•เธฒเธกเธ—เธตเนเน€เธฅเธทเธญเธเนเธ”เน เน€เธซเธกเธทเธญเธเธเธฑเธเธเธฅเธดเธเธ—เธตเนเธเธฃเธฒเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เน€เธเธดเนเธกเธเธฒเธฃเนเธ•เนเธ•เธญเธเธเธเธเธฃเธฒเธ)'
    },
    {
      id: 'log_000_criteria_panel_bg_match',
      timestamp: '2026-10-17 20:55:00',
      timestampTh: '17 เธ•.เธ. 2569, 20:55 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธเธทเนเธเธซเธฅเธฑเธเธฃเธฒเธขเธเธฒเธฃเน€เธเธ“เธ‘เนเธงเธฑเธ”',
      badgeClass: 'badge-type-edit',
      title: 'เนเธซเนเธฃเธฒเธขเธเธฒเธฃเธ•เธฑเธงเน€เธฅเธทเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ”เธกเธตเธเธทเนเธเธซเธฅเธฑเธเน€เธซเธกเธทเธญเธเธฃเธฒเธขเธเธฒเธฃเธเธญเธเธ•เธฑเธงเธเธฃเธญเธเธญเธทเนเธเน',
      targetSubject: 'เธฃเธฒเธขเธเธฒเธฃเธ•เธฑเธงเน€เธฅเธทเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ” (dropdown เนเธ–เธเธ•เธฑเธงเธเธฃเธญเธเธ”เนเธฒเธเธเธ)',
      storageFile: 'css/styles.css, index.html',
      changeSummary: 'เน€เธเธฅเธตเนเธขเธเธเธทเนเธเธซเธฅเธฑเธเธฃเธฒเธขเธเธฒเธฃเธเธฒเธเนเธฅเนเธชเธตเธกเนเธงเธเน€เธเนเธก+เธเธฃเธญเธเธ—เธญเธ+เน€เธเธฒเน€เธฃเธทเธญเธเนเธชเธ เน€เธเนเธเธชเธตเธ—เธถเธ #2D0A45 เน€เธ—เนเธฒเธเธฑเธ option เธเธญเธเธ•เธฑเธงเธเธฃเธญเธเน€เธ”เธทเธญเธ/เธเธทเนเธเธ—เธตเน/เธเธญเธ (เธเธตเธกเธชเธงเนเธฒเธเน€เธเนเธเธชเธตเธเธฒเธง)',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: เนเธเน .crit-dd-panel เนเธเน background เธ—เธถเธ #2D0A45 เธเธฃเธญเธเธเธฒเธเนเธเธฃเนเธเนเธชเธ เธกเธธเธกเนเธเนเธเธเนเธญเธข เน€เธเธฒเน€เธเธฒ เนเธกเนเธกเธตเนเธญเธเธดเน€เธกเธเธฑเธเน€เธเธดเธ” เนเธฅเธฐเธเธฃเธฑเธ padding เธเธญเธเนเธ–เธงเน€เธเนเธ 6px 12px เนเธซเนเน€เธ—เนเธฒเธเธฑเธ .top-filter-select option เธเธฃเนเธญเธกเธเธฃเธฑเธเธเธตเธกเธชเธงเนเธฒเธ เนเธฅเธฐ bump เน€เธงเธญเธฃเนเธเธฑเธเนเธเธ css',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธเนเนเธเธ•เธญเธเน€เธฅเธทเนเธญเธเน€เธเธทเนเธญเน€เธฅเธทเธญเธ เนเธซเนเธเธทเนเธเธซเธฅเธฑเธเน€เธซเธกเธทเธญเธเธเธฑเธเธ•เธฑเธงเธเธฃเธญเธเธญเธทเนเธเน)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเธชเธต UI)'
    },
    {
      id: 'log_000_criteria_option_gold_no_highlight',
      timestamp: '2026-10-17 20:50:00',
      timestampTh: '17 เธ•.เธ. 2569, 20:50 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธชเธตเธ•เธฑเธงเน€เธฅเธทเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ”',
      badgeClass: 'badge-type-edit',
      title: 'เธ•เธฑเธงเน€เธฅเธทเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ”เธเนเธญ 1.1 - 5 เธเธฅเธฑเธเน€เธเนเธเธชเธตเธ—เธญเธ เนเธฅเธฐเน€เธญเธฒเธเธทเนเธเธซเธฅเธฑเธ/เน€เธเธฒเธ•เธญเธเธเธตเน-เน€เธฅเธทเธญเธเธญเธญเธ',
      targetSubject: 'เธฃเธฒเธขเธเธฒเธฃเธ•เธฑเธงเน€เธฅเธทเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ” (dropdown เนเธ–เธเธ•เธฑเธงเธเธฃเธญเธเธ”เนเธฒเธเธเธ)',
      storageFile: 'css/styles.css, index.html',
      changeSummary: 'เธเนเธญเธเธงเธฒเธกเธ•เธฑเธงเน€เธฅเธทเธญเธเธ—เธธเธเธเนเธญเน€เธเนเธเธชเธตเธ—เธญเธ #FFB81C เน€เธซเธกเธทเธญเธเน€เธ”เธดเธก เธ•เธญเธเธเธตเน/เน€เธฅเธทเธญเธเนเธกเนเธกเธตเธเธทเนเธเธซเธฅเธฑเธเธซเธฃเธทเธญเน€เธเธฒ (inset shadow) เน€เธซเธฅเธทเธญเน€เธเธตเธขเธเธ—เธญเธเธชเธงเนเธฒเธเธเธถเนเธเนเธฅเธฐเธ•เธฑเธงเธซเธเธฒ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: เนเธเน .crit-dd-option เน€เธเนเธเธชเธตเธ—เธญเธ เธเธฃเธฑเธ .focused/.selected เน€เธเนเธ background:none, box-shadow:none เธเธฃเนเธญเธกเธเธฃเธฑเธเธเธตเธกเธชเธงเนเธฒเธเนเธซเนเธชเธญเธ”เธเธฅเนเธญเธ เนเธฅเธฐ bump เน€เธงเธญเธฃเนเธเธฑเธเนเธเธ css',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธ•เธฑเธงเน€เธฅเธทเธญเธเน€เธเธฅเธตเนเธขเธเธชเธตเธ—เธญเธเน€เธซเธกเธทเธญเธเน€เธ”เธดเธก เธเนเธญ 1.1 - 5 เนเธฅเธฐเธ•เธญเธเน€เธฅเธทเธญเธเนเธกเนเธ•เนเธญเธเธกเธตเน€เธเธฒเธเธทเนเธเธซเธฅเธฑเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเธชเธต UI)'
    },
    {
      id: 'log_000_criteria_dropdown_unit_right',
      timestamp: '2026-10-17 20:45:00',
      timestampTh: '17 เธ•.เธ. 2569, 20:45 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธ•เธฑเธงเน€เธฅเธทเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ”',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธญเธฒเธเนเธฒเธขเธซเธเนเธงเธขเธงเธฑเธ”เนเธเธเธเธนเธฅเธญเธญเธ เนเธฅเธฐเนเธชเธ”เธเธซเธเนเธงเธข เธกเธนเธฅเธเนเธฒ/เธเธฒเธ เธเธดเธ”เธเธงเธฒเนเธเธ—เธธเธเธ•เธฑเธงเน€เธฅเธทเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ” เธเธฃเนเธญเธกเธชเธตเธเธทเนเธเธซเธฅเธฑเธเนเธ”เธ”เน€เธ”เนเธ',
      targetSubject: 'เธ•เธฑเธงเธเธฃเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ” เธเนเธญ 1.1 - 5 (เนเธ–เธเธ•เธฑเธงเธเธฃเธญเธเธ”เนเธฒเธเธเธ)',
      storageFile: 'index.html, css/styles.css, js/app.js, js/criteria_dropdown.js',
      changeSummary: 'เธฅเธเธเนเธฒเธข "เธซเธเนเธงเธขเธงเธฑเธ” [เธกเธนเธฅเธเนเธฒ]/[เธเธฒเธ]" เธ”เนเธฒเธเธเธงเธฒเธเธญเธเธเนเธญเธเน€เธฅเธทเธญเธ เนเธฅเธฐเน€เธเธฅเธตเนเธขเธเธฃเธฒเธขเธเธฒเธฃเธ•เธฑเธงเน€เธฅเธทเธญเธเน€เธเนเธ dropdown เนเธเธเธเธณเธซเธเธ”เน€เธญเธเธ—เธตเนเธงเธฒเธเธซเธเนเธงเธขเธเธดเธ”เธเธงเธฒเธชเธธเธ”เธ—เธธเธเนเธ–เธง: เธกเธนเธฅเธเนเธฒ = เธ—เธญเธ, เธเธฒเธ = เธเนเธฒเธเธฃเธฒเธก, เธกเธนเธฅเธเนเธฒ/เธเธฒเธ (เน€เธฅเธทเธญเธเธ—เธฑเนเธเธซเธกเธ”) = เธเธกเธเธน-เธกเนเธงเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: (1) เธฅเธ #criteriaUnitBadge เนเธ index.html, CSS .criteria-unit-badge เนเธฅเธฐเธเธฑเธเธเนเธเธฑเธ updateCriteriaUnitBadge เนเธ app.js (2) populateFilterDropdowns เนเธชเน data-unit (value|job|all) เนเธซเน option เนเธฅเธฐเนเธเนเธเธทเนเธญเน€เธเธ“เธ‘เนเน€เธ”เธดเธกเนเธกเนเธ•เนเธญเธ—เนเธฒเธขเธซเธเนเธงเธข (3) เน€เธเธดเนเธก js/criteria_dropdown.js เธชเธฃเนเธฒเธ UI dropdown (เธเธธเนเธก + panel เนเธเธ fixed เนเธกเนเธ–เธนเธเธ•เธฑเธ”เนเธ”เธขเนเธ–เธเธ•เธฑเธงเธเธฃเธญเธ) เธเนเธญเธ select#filterCriteria เนเธงเนเน€เธเนเธเนเธซเธฅเนเธเธเนเธญเธกเธนเธฅเธซเธฅเธฑเธ เธเธดเธเธเน value/options เธ”เนเธงเธข MutationObserver เนเธฅเธฐ setter เธเธญเธ value เนเธฅเธฐเธขเธดเธ change event เน€เธกเธทเนเธญเน€เธฅเธทเธญเธ เธเธถเธเนเธกเนเธเธฃเธฐเธ—เธเธเธฒเธฃเธเธฃเธญเธ เธฃเธญเธเธฃเธฑเธเธเธตเธขเนเธเธญเธฃเนเธ” เธเธตเธกเธชเธงเนเธฒเธ (4) เน€เธเธดเนเธกเธชเนเธ•เธฅเน .crit-dd-* เนเธฅเธฐ .crit-unit-pill เนเธ styles.css (5) bump เน€เธงเธญเธฃเนเธเธฑเธเนเธเธ css/app.js',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (1.เนเธซเนเน€เธญเธฒเธญเธญเธ 2.เธซเธเนเธงเธขเธงเธฑเธ”เธ—เธตเนเนเธชเธ”เธเนเธเธ•เธฑเธงเน€เธฅเธทเธญเธเนเธซเนเธเธดเธ”เธ”เนเธฒเธเธซเธฅเธฑเธเธชเธธเธ”เธ—เธธเธเธญเธฑเธ(เธเธดเธ”เธเธงเธฒ) เนเธฅเธฐเน€เธเธฅเธตเนเธขเธเธชเธตเนเธ”เธ”เน€เธ”เนเธ เน€เธเธฅเธตเนเธขเธเน€เธเธเธฒเธฐเธเธทเนเธเธซเธฅเธฑเธ เธกเธนเธฅเธเนเธฒ/เธเธฒเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เน€เธเธฅเธตเนเธขเธเธฃเธนเธเนเธเธ UI เธ•เธฑเธงเธเธฃเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ”)'
    },
    {
      id: 'log_000_criteria_option_unit_suffix',
      timestamp: '2026-10-17 20:40:00',
      timestampTh: '17 เธ•.เธ. 2569, 20:40 เธ.',
      type: 'EDIT',
      typeBadge: 'เนเธชเธ”เธเธซเธเนเธงเธขเธงเธฑเธ”เนเธเธ•เธฑเธงเน€เธฅเธทเธญเธเน€เธเธ“เธ‘เน',
      badgeClass: 'badge-type-edit',
      title: 'เนเธชเธ”เธเธซเธเนเธงเธขเธเธฒเธฃเธงเธฑเธ” (เธกเธนเธฅเธเนเธฒ/เธเธฒเธ) เธ•เนเธญเธ—เนเธฒเธขเธ•เธฑเธงเน€เธฅเธทเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ”เธเนเธญ 1.1 - 5 เนเธ”เธขเธ•เธฃเธ',
      targetSubject: 'เธฃเธฒเธขเธเธฒเธฃเธ•เธฑเธงเน€เธฅเธทเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ” (select#filterCriteria เนเธฅเธฐเธ•เธฑเธงเน€เธฅเธทเธญเธเธเธเธเธฃเธฒเธเธ—เธตเนเธเธดเธเธเนเธเธฑเธ)',
      storageFile: 'js/app.js',
      changeSummary: 'เธ—เธธเธเธ•เธฑเธงเน€เธฅเธทเธญเธเนเธชเธ”เธเธซเธเนเธงเธขเธ•เนเธญเธ—เนเธฒเธข เน€เธเนเธ "เธเนเธญ 1.1 เธเธ C.1 เธเนเธญเธ 69 ยท เธกเธนเธฅเธเนเธฒ", "เธเนเธญ 3.1 TECO D2 ยท เธเธฒเธ", "เน€เธฅเธทเธญเธเธ—เธฑเนเธเธซเธกเธ” ยท เธกเธนเธฅเธเนเธฒ/เธเธฒเธ"',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: เน€เธเธดเนเธกเธเธฑเธเธเนเธเธฑเธ getCriteriaUnitKind (เธญเนเธฒเธเธซเธเนเธงเธขเธเธฒเธเธเนเธญเธกเธนเธฅเน€เธ”เธทเธญเธเธ—เธตเนเน€เธฅเธทเธญเธ เธกเธต fallback เธ•เธฒเธกเธเธทเนเธญเน€เธเธ“เธ‘เน) เนเธเนเธชเธฃเนเธฒเธเธเนเธญเธเธงเธฒเธกเธ•เธฑเธงเน€เธฅเธทเธญเธเนเธ populateFilterDropdowns เนเธ”เธข value เธเธญเธ option เธขเธฑเธเน€เธเนเธเธเธทเนเธญเน€เธเธ“เธ‘เนเน€เธ”เธดเธก เธเธถเธเนเธกเนเธเธฃเธฐเธ—เธเธเธฒเธฃเธเธฃเธญเธ เนเธฅเธฐเธเธฃเธฑเธ updateCriteriaUnitBadge เนเธซเนเนเธเนเธเธฑเธเธเนเธเธฑเธเน€เธ”เธตเธขเธงเธเธฑเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธเนเนเธเนเธซเนเนเธชเธ”เธเธ—เธตเนเธซเธเนเธฒเธเธญ เธ•เธฑเธงเน€เธฅเธทเธญเธเธเนเธญ 1.1 - 5 เน€เธฅเธข)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเธเธฒเธฃเนเธชเธ”เธเธเธฅ)'
    },
    {
      id: 'log_000_criteria_unit_badge',
      timestamp: '2026-10-17 20:30:00',
      timestampTh: '17 เธ•.เธ. 2569, 20:30 เธ.',
      type: 'EDIT',
      typeBadge: 'เน€เธเธดเนเธกเธเนเธฒเธขเธซเธเนเธงเธขเธเธฒเธฃเธงเธฑเธ”',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธดเนเธกเธเนเธฒเธขเธซเธเนเธงเธขเธเธฒเธฃเธงเธฑเธ” เธกเธนเธฅเธเนเธฒ / เธเธฒเธ เธ”เนเธฒเธเธเธงเธฒเธเธญเธเธ•เธฑเธงเธเธฃเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ” (เธเนเธญ 1.1 - 5)',
      targetSubject: 'เนเธ–เธเธ•เธฑเธงเธเธฃเธญเธเธ”เนเธฒเธเธเธ (เธ•เธฑเธงเธเธฃเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ”)',
      storageFile: 'index.html, css/styles.css, js/app.js',
      changeSummary: 'เน€เธเธดเนเธกเธเนเธฒเธข "เธซเธเนเธงเธขเธงเธฑเธ” [เธกเธนเธฅเธเนเธฒ / เธเธฒเธ]" เนเธเธ segmented pill เน€เธฃเธทเธญเธเนเธชเธ เนเธฎเนเธฅเธ•เนเธซเธเนเธงเธขเธ•เธฒเธกเน€เธเธ“เธ‘เนเธ—เธตเนเน€เธฅเธทเธญเธ (เธกเธนเธฅเธเนเธฒ = เธ—เธญเธ, เธเธฒเธ = เธเนเธฒเธเธฃเธฒเธก) เธ–เนเธฒเน€เธฅเธทเธญเธเธ—เธฑเนเธเธซเธกเธ”เธเธฐเนเธฎเนเธฅเธ•เนเธ—เธฑเนเธเธชเธญเธเธซเธเนเธงเธข',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: (1) index.html เน€เธเธดเนเธก #criteriaUnitBadge เธ•เนเธญเธ—เนเธฒเธข select#filterCriteria (2) styles.css เน€เธเธดเนเธกเธชเนเธ•เธฅเน .criteria-unit-badge/.unit-seg เธเธฃเนเธญเธก animation เน€เธฃเธทเธญเธเนเธชเธเนเธฅเธฐเธฃเธญเธเธฃเธฑเธเธเธตเธกเธชเธงเนเธฒเธ/prefers-reduced-motion (3) app.js เน€เธเธดเนเธกเธเธฑเธเธเนเธเธฑเธ updateCriteriaUnitBadge เน€เธฃเธตเธขเธเธเธฒเธ updateTopSelectionDisplay เนเธ”เธขเธญเนเธฒเธเธซเธเนเธงเธข (unit) เธเธฒเธเธเนเธญเธกเธนเธฅเธเธญเธเน€เธเธ“เธ‘เนเธ—เธตเนเน€เธฅเธทเธญเธ (เธเนเธญ 3.x = เธเธฒเธ, เธเนเธญเธญเธทเนเธ = เธกเธนเธฅเธเนเธฒ(เธเธฒเธ—)) เนเธฅเธฐเธกเธต fallback เธ•เธฒเธกเธเธทเนเธญเน€เธเธ“เธ‘เน เนเธกเนเธเธฃเธฐเธ—เธเธเธฒเธฃเธเธฃเธญเธเธเนเธญเธกเธนเธฅ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธ•เธฑเธงเธเธฃเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ” เธเนเธญ 1.1 - 5 เธ”เนเธฒเธเธเธงเธฒ เนเธซเนเน€เธเธดเนเธกเธซเธเนเธงเธขเธเธฒเธฃเธงเธฑเธ” เธกเธนเธฅเธเนเธฒ/เธเธฒเธ เนเธซเนเธชเธงเธขเธเธฒเธกเนเธ”เธ”เน€เธ”เนเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเธซเธเนเธฒเธ•เธฒ UI)'
    },
    {
      id: 'log_000_filter_bar_glow_single_row',
      timestamp: '2026-10-17 20:20:00',
      timestampTh: '17 เธ•.เธ. 2569, 20:20 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเนเธ–เธเธ•เธฑเธงเธเธฃเธญเธเธเธเธชเธธเธ”',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธดเนเธกเธเธทเนเธเธซเธฅเธฑเธเน€เธฃเธทเธญเธเนเธชเธเนเธซเนเนเธ–เธเธ•เธฑเธงเธเธฃเธญเธ เนเธฅเธฐเธเธฑเธ”เธ•เธฑเธงเธเธฃเธญเธเธ—เธฑเนเธเธซเธกเธ”เนเธซเนเธญเธขเธนเนเธเธฃเธฃเธ—เธฑเธ”เน€เธ”เธตเธขเธงเธเธฑเธ',
      targetSubject: 'เนเธ–เธเธ•เธฑเธงเธเธฃเธญเธเธ”เนเธฒเธเธเธ (Top Sticky Filter Bar)',
      storageFile: 'css/styles.css',
      changeSummary: 'เน€เธเธดเนเธกเธฅเธนเธเนเธชเธเธกเนเธงเธ/เธ—เธญเธเน€เธเธฅเธทเนเธญเธเนเธซเธงเธเนเธฒเน เนเธฅเธฐเน€เธชเนเธเน€เธฃเธทเธญเธเนเธชเธเธเธญเธเธฅเนเธฒเธ เธเธฃเนเธญเธกเน€เธเธฅเธตเนเธขเธเธเธฒเธ flex-wrap เน€เธเนเธ nowrap เนเธซเนเธ•เธฑเธงเธเธฃเธญเธเธ—เธธเธเธ•เธฑเธงเธญเธขเธนเนเธเธฃเธฃเธ—เธฑเธ”เน€เธ”เธตเธขเธง',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: เนเธ .top-sticky-filter-bar เน€เธเธดเนเธก ::before (radial-gradient เธซเธฅเธฒเธขเธเธฑเนเธ + blur + animation topFilterGlowDrift) เนเธฅเธฐ ::after (เน€เธชเนเธเธ—เธญเธเน€เธฃเธทเธญเธเนเธชเธ animation topFilterEdgePulse) เธฃเธญเธเธฃเธฑเธ prefers-reduced-motion เนเธฅเธฐเธเธตเธกเธชเธงเนเธฒเธ เธชเนเธงเธ .top-filter-inner เธเธฃเธฑเธเน€เธเนเธ flex-wrap: nowrap เนเธซเนเธเธฅเธธเนเธกเธ•เธฑเธงเธเธฃเธญเธ/เธเนเธญเธเธเนเธเธซเธฒเธขเนเธญเธเธเธฒเธ”เนเธ”เน (min-width: 0, text-overflow: ellipsis) เนเธฅเธฐเธฅเธ”เธเธเธฒเธ”เธเธญเธเธ•เน/เธฃเธฐเธขเธฐเธซเนเธฒเธเน€เธฅเนเธเธเนเธญเธขเน€เธเธทเนเธญเนเธซเนเธเธญเธ”เธตเธเธฃเธฃเธ—เธฑเธ”เน€เธ”เธตเธขเธง เธเธธเนเธกเธฃเธตเน€เธเนเธ•เนเธฅเธฐเธซเธฑเธงเธเนเธญ "เธ•เธฑเธงเธเธฃเธญเธ:" เนเธกเนเธ–เธนเธเธเธตเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธเธดเนเธกเธเธทเนเธเธซเธฅเธฑเธเน€เธฃเธทเธญเธเนเธชเธ เนเธฅเธฐเธ•เธฑเธงเธเธฃเธญเธเธญเธขเธนเนเธเธฃเธฃเธ—เธฑเธ”เน€เธ”เธตเธขเธงเธเธฑเธเธ—เธฑเนเธเธซเธกเธ”)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเธซเธเนเธฒเธ•เธฒ UI)'
    },
    {
      id: 'log_000_wbs_sap_order_by_code',
      timestamp: '2026-10-17 15:30:00',
      timestampTh: '17 เธ•.เธ. 2569, 15:30 เธ.',
      type: 'EDIT',
      typeBadge: 'เน€เธฃเธตเธขเธเธชเธ–เธฒเธเธฐ SAP เธ•เธฒเธกเธฃเธซเธฑเธชเธ—เนเธฒเธข',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธฃเธตเธขเธเธชเธ–เธฒเธเธฐ SAP เนเธเธเธฅเธธเนเธก CLSD / TECO / REL เธ•เธฒเธกเธฃเธซเธฑเธชเธ—เนเธฒเธข (F4 เนเธฃเธเธชเธธเธ”, B1 เธ—เนเธฒเธขเธชเธธเธ”)',
      targetSubject: 'เธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP (เนเธ—เนเธ WBS เธเธเน€เธซเธฅเธทเธญ)',
      storageFile: 'js/wbs.js',
      changeSummary: 'เธ เธฒเธขเนเธเธเธฅเธธเนเธกเน€เธ”เธตเธขเธงเธเธฑเธ เน€เธฃเธตเธขเธเธ•เธฒเธกเธ•เธฑเธงเธญเธฑเธเธฉเธฃเธญเธฑเธเธเธคเธฉเธ—เนเธฒเธขเธชเธ–เธฒเธเธฐเธเธฒเธ F เนเธ B เนเธฅเธฐเธ•เธฑเธงเน€เธฅเธเธเธฒเธเธกเธฒเธเนเธเธเนเธญเธข เนเธ—เธเธเธฒเธฃเน€เธฃเธตเธขเธเธ•เธฒเธกเธกเธนเธฅเธเนเธฒ AUC',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: เน€เธเธดเนเธกเธเธฑเธเธเนเธเธฑเธ parseSapCode เธ”เธถเธเธฃเธซเธฑเธชเธ—เนเธฒเธขเธชเธ–เธฒเธเธฐ (เธ•เธฑเธงเธญเธฑเธเธฉเธฃ+เธ•เธฑเธงเน€เธฅเธ) เนเธ renderWbsSapSummary เนเธฅเนเธงเน€เธฃเธตเธขเธเธเธฅเธธเนเธก CLSD โ’ TECO โ’ REL เธเธฒเธเธเธฑเนเธเน€เธฃเธตเธขเธเธ•เธฑเธงเธญเธฑเธเธฉเธฃ Zโ’A เนเธฅเธฐเธ•เธฑเธงเน€เธฅเธเธกเธฒเธโ’เธเนเธญเธข เธ—เธณเนเธซเน F4 เธญเธขเธนเนเนเธฃเธเธชเธธเธ” เนเธฅเธฐ B1 เธญเธขเธนเนเธ—เนเธฒเธขเธชเธธเธ”เธเธญเธเธเธฅเธธเนเธก เธชเธ–เธฒเธเธฐเธ—เธตเนเนเธกเนเธกเธตเธฃเธซเธฑเธชเธ—เนเธฒเธขเธญเธขเธนเนเธ—เนเธฒเธขเธเธฅเธธเนเธก',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธซเนเนเธเนเนเธเธฅเธณเธ”เธฑเธ เธซเธฒเธเธเธฅเธธเนเธกเน€เธ”เธตเธขเธงเธเธฑเธเนเธซเนเธ”เธนเธ เธฒเธฉเธฒเธญเธฑเธเธเธคเธฉเนเธฅเธฐเธ•เธฑเธงเน€เธฅเธเธ”เนเธฒเธเธซเธฅเธฑเธ F4 เนเธฃเธเธชเธธเธ” เนเธฅเธฐ B1 เธ—เนเธฒเธขเธชเธธเธ”)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเธฅเธณเธ”เธฑเธเธเธฒเธฃเนเธชเธ”เธเธเธฅ)'
    },
    {
      id: 'log_000_wbs_sap_order',
      timestamp: '2026-10-17 15:25:00',
      timestampTh: '17 เธ•.เธ. 2569, 15:25 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธฅเธณเธ”เธฑเธเธชเธ–เธฒเธเธฐ SAP',
      badgeClass: 'badge-type-edit',
      title: 'เธเธฃเธฑเธเธฅเธณเธ”เธฑเธเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP เน€เธเนเธ CLSD F4 โ’ CLSD เธญเธทเนเธ โ’ TECO โ’ REL',
      targetSubject: 'เธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP (เนเธ—เนเธ WBS เธเธเน€เธซเธฅเธทเธญ)',
      storageFile: 'js/wbs.js',
      changeSummary: 'เธเธฒเธเน€เธ”เธดเธกเน€เธฃเธตเธขเธเธ•เธฒเธกเธกเธนเธฅเธเนเธฒ AUC เน€เธเธฅเธตเนเธขเธเน€เธเนเธเนเธชเธ”เธเธ•เนเธญเธเธฒเธเธเธฒเธฃเนเธ”เธ—เธฑเนเธเธซเธกเธ”: CLSD F4 เธเนเธญเธ เธ•เธฒเธกเธ”เนเธงเธข CLSD เธญเธทเนเธ, TECO เนเธฅเธฐ REL เธ—เนเธฒเธขเธชเธธเธ”',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: เนเธเน renderWbsSapSummary เนเธซเนเธเธฑเธ”เธเธฅเธธเนเธกเธฅเธณเธ”เธฑเธ CLSD (F4 เธกเธฒเธเนเธญเธ) โ’ TECO โ’ REL/เธญเธทเนเธเน เนเธ”เธขเธ เธฒเธขเนเธเนเธ•เนเธฅเธฐเธเธฅเธธเนเธกเธขเธฑเธเน€เธฃเธตเธขเธเธ•เธฒเธกเธกเธนเธฅเธเนเธฒ AUC เธกเธฒเธเนเธเธเนเธญเธข เนเธกเนเธเธฃเธฐเธ—เธเธเธฒเธฃเธเธฃเธญเธเนเธฅเธฐเธ•เธฑเธงเน€เธฅเธเธชเธฃเธธเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธเนเนเธเธฅเธณเธ”เธฑเธเธชเธ–เธฒเธเธฐ sap เนเธซเน CLSD F4 เธเนเธญเธ เธ•เนเธญเธ”เนเธงเธข TECO เนเธฅเธฐ REL เธ—เนเธฒเธขเธชเธธเธ”)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเธฅเธณเธ”เธฑเธเธเธฒเธฃเนเธชเธ”เธเธเธฅ)'
    },
    {
      id: 'log_000_wbs_chart_fit_all_offices',
      timestamp: '2026-10-17 15:20:00',
      timestampTh: '17 เธ•.เธ. 2569, 15:20 เธ.',
      type: 'EDIT',
      typeBadge: 'เนเธชเธ”เธเธเธฃเธเธ—เธธเธเธซเธเนเธงเธขเธเธฒเธเนเธเธซเธเนเธฒเน€เธ”เธตเธขเธง',
      badgeClass: 'badge-type-edit',
      title: 'เธเธฃเธฒเธ เธเธญเธ/เธเธเธ. เธ—เธตเนเธกเธตเธเธฒเธ WBS เธเธเน€เธซเธฅเธทเธญ: เน€เธฅเธทเธญเธ "เธ—เธฑเนเธเธซเธกเธ”" เนเธชเธ”เธเธเธฃเธเธ—เธธเธเธซเธเนเธงเธขเธเธฒเธเนเธเธซเธเนเธฒเน€เธ”เธตเธขเธง',
      targetSubject: 'เธเธฃเธฒเธเนเธ—เนเธ เธเธญเธ/เธเธเธ. เธ—เธตเนเธกเธตเธเธฒเธ WBS เธเธเน€เธซเธฅเธทเธญ (เนเธ—เนเธ WBS เธเธเน€เธซเธฅเธทเธญ)',
      storageFile: 'js/wbs.js, css/styles.css & index.html',
      changeSummary: 'เนเธซเธกเธ”เนเธเธเธเนเธญเธเธเธตเธเธเธฃเธฒเธเนเธซเนเธเธญเธ”เธตเธเธงเธฒเธกเธเธงเนเธฒเธเธเธฒเธฃเนเธ” เนเธกเนเธ•เนเธญเธเน€เธฅเธทเนเธญเธเนเธเธงเธเธญเธ เน€เธกเธทเนเธญเธซเธเนเธงเธขเธเธฒเธเธกเธฒเธ เธเธฃเธฑเธเธเธทเนเธญเน€เธเนเธเน€เธญเธตเธขเธ 62ยฐ เนเธฅเธฐเน€เธเธดเนเธกเธเธทเนเธเธ—เธตเนเธ”เนเธฒเธเธฅเนเธฒเธเธญเธฑเธ•เนเธเธกเธฑเธ•เธด',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: (1) drawTopOfficesCanvas เนเธเนเธซเธกเธ”เนเธเธเธเนเธญเธ เนเธเนเธเธงเธฒเธกเธเธงเนเธฒเธเน€เธ—เนเธฒ container เนเธ—เธเธเธงเธฒเธกเธเธงเนเธฒเธเธเธฑเนเธเธ•เนเธณเธ•เนเธญเธซเธเนเธงเธขเธเธฒเธ (2) เน€เธกเธทเนเธญเธเนเธญเธเธ•เนเธญเธซเธเนเธงเธขเธเธฒเธเนเธเธเธเธงเนเธฒ 44px เธฅเธ”เธเธญเธเธ•เนเธเธทเนเธญเน€เธเนเธ 10px เน€เธญเธตเธขเธ -62ยฐ เนเธฅเธฐเธเธณเธเธงเธ“ padding เธฅเนเธฒเธเธเธฒเธเธเธงเธฒเธกเธขเธฒเธงเธเธทเนเธญเธ—เธตเนเธขเธฒเธงเธ—เธตเนเธชเธธเธ” (3) เธเธฃเธฑเธเธเธงเธฒเธกเธเธงเนเธฒเธเนเธ—เนเธเนเธซเนเธฅเธ”เนเธ”เนเธ•เธฒเธกเธเนเธญเธ (4) เธเธฃเธฑเธเธเธทเนเธเธ—เธตเน hover/เธเธฅเธดเธเนเธซเนเธญเธดเธเธเธญเธเธฅเนเธฒเธเธเธญเธเธเธฃเธฒเธเธเธฃเธดเธ (5) เธเธฃเธฑเธ CSS/HTML เธเธญเธ #wbsOfficesChartContainer เธเธฒเธเธเธงเธฒเธกเธชเธนเธเธเธเธ—เธตเนเน€เธเนเธ min-height เน€เธเธทเนเธญเธฃเธญเธเธฃเธฑเธเธเธฃเธฒเธเธ—เธตเนเธชเธนเธเธเธถเนเธ (6) เนเธซเธกเธ”เนเธเธเนเธขเธเธขเธฑเธเน€เธฅเธทเนเธญเธเนเธเธงเธเธญเธเนเธ”เนเน€เธซเธกเธทเธญเธเน€เธ”เธดเธก เน€เธเธฃเธฒเธฐ 3 เนเธ—เนเธเธ•เนเธญเธซเธเนเธงเธขเธเธฒเธเธเธตเธเนเธฅเนเธงเธญเนเธฒเธเนเธกเนเธญเธญเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธฅเธทเธญเธเธ—เธฑเนเธเธซเธกเธ” เนเธซเนเนเธชเธ”เธเธเธฃเธเธ—เธธเธเธซเธเนเธงเธขเธเธฒเธ เนเธเธซเธเนเธฒเน€เธ”เธตเธขเธง)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฒเธฃเธงเธฒเธ”เธเธฃเธฒเธเนเธฅเธฐเน€เธฅเธขเนเน€เธญเธฒเธ•เน)'
    },
    {
      id: 'log_000_move_wbs_legend',
      timestamp: '2026-10-17 15:12:00',
      timestampTh: '17 เธ•.เธ. 2569, 15:12 เธ.',
      type: 'EDIT',
      typeBadge: 'เธขเนเธฒเธขเธ•เธณเนเธซเธเนเธเธเนเธฒเธข CLSD/TECO/REL',
      badgeClass: 'badge-type-edit',
      title: 'เธขเนเธฒเธขเธเนเธฒเธขเธชเธ–เธฒเธเธฐ CLSD / TECO / REL เนเธเธเธดเธ”เธเนเธฒเธข "เธซเธเนเธงเธขเธเธฒเธ (เธเธเน€เธซเธฅเธทเธญ เธเธฒเธ)"',
      targetSubject: 'เธเธฒเธฃเนเธ”เธเธฃเธฒเธ เธเธญเธ/เธเธเธ. เธ—เธตเนเธกเธตเธเธฒเธ WBS เธเธเน€เธซเธฅเธทเธญ (เนเธ—เนเธ WBS เธเธเน€เธซเธฅเธทเธญ)',
      storageFile: 'index.html',
      changeSummary: 'เธขเนเธฒเธขเธเธฅเธธเนเธกเธเนเธฒเธข CLSD, TECO, REL เธเธฒเธเธเธฑเนเธเธเธงเธฒเธเธญเธเธซเธฑเธงเธเธฒเธฃเนเธ” เธกเธฒเธญเธขเธนเนเธ•เธดเธ”เธเธฑเธเธเนเธฒเธขเธชเธฃเธธเธเธเธณเธเธงเธเธซเธเนเธงเธขเธเธฒเธเนเธฅเธฐเธเธฒเธเธเธเน€เธซเธฅเธทเธญเธ”เนเธฒเธเธเนเธฒเธข',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: เธขเนเธฒเธข div#wbsChartLegend เน€เธเนเธฒเนเธเนเธ .card-title เธ•เนเธญเธเธฒเธ span#wbsOfficesChartCountBadge เนเธ”เธขเธเธ id เน€เธ”เธดเธกเธ—เธฑเนเธเธซเธกเธ” (wbsLegendClsdCount / wbsLegendTecoCount / wbsLegendRelCount) เธเธถเธเนเธกเนเธเธฃเธฐเธ—เธเธเธฒเธฃเธญเธฑเธเน€เธ”เธ•เธ•เธฑเธงเน€เธฅเธเนเธ wbs.js เธเธธเนเธกเธชเธฅเธฑเธ เธ—เธฑเนเธเธซเธกเธ”/10 เธญเธฑเธเธ”เธฑเธเนเธฃเธ เนเธฅเธฐเนเธเธเธเนเธญเธ/เนเธเธเนเธขเธ เธขเธฑเธเธญเธขเธนเนเธเธฑเนเธเธเธงเธฒเธ•เธฒเธกเน€เธ”เธดเธก',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธขเนเธฒเธขเธ—เธตเนเธงเธเธเธฅเธก เนเธเธเธดเธ” เธเธเน€เธซเธฅเธทเธญเธเธฒเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเธ•เธณเนเธซเธเนเธ UI)'
    },
    {
      id: 'log_000_remove_wbs_kpi_cards',
      timestamp: '2026-10-17 15:05:00',
      timestampTh: '17 เธ•.เธ. 2569, 15:05 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธณเธเธฒเธฃเนเธ”เธชเธฃเธธเธ WBS เธญเธญเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธณเธเธฒเธฃเนเธ”เธชเธฃเธธเธ KPI 4 เนเธ เธญเธญเธเธเธฒเธเธซเธเนเธฒ WBS เธเธเน€เธซเธฅเธทเธญ',
      targetSubject: 'เนเธ—เนเธ WBS เธเธเน€เธซเธฅเธทเธญ (เธเธฒเธฃเนเธ”เธชเธฃเธธเธ 4 เนเธ)',
      storageFile: 'index.html',
      changeSummary: 'เธเธณเธเธฒเธฃเนเธ” เธเธฒเธ WBS เธเธเน€เธซเธฅเธทเธญเธฃเธงเธก, เธซเธเนเธงเธขเธเธฒเธเธ—เธตเนเน€เธเธตเนเธขเธงเธเนเธญเธ, เธเนเธฒเธเธเธธเธกเธเธฒเธเธเธนเนเธฃเธฑเธเธเธดเธ”เธเธญเธ เนเธฅเธฐเธชเธฑเธ”เธชเนเธงเธเธซเธกเธงเธ”เธเธเธเธฃเธฐเธกเธฒเธ“ เธญเธญเธเธเธฒเธเธซเธเนเธฒเธเธญ (เธเธญเธกเน€เธกเธเธ•เนเธเธดเธ”เนเธงเน)',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "เน€เธญเธฒเธญเธญเธ": เธเธญเธกเน€เธกเธเธ•เนเธเธดเธ”เธเธฅเนเธญเธ .wbs-stats-grid เธ—เธฑเนเธ 4 เธเธฒเธฃเนเธ”เนเธ index.html เนเธ”เธขเนเธกเนเธฅเธเนเธเนเธ”เน€เธ”เธดเธก เธเธฑเธเธเนเธเธฑเธ renderWbsStatCards เนเธ js/wbs.js เธ•เธฃเธงเธเธชเธญเธ null เธเนเธญเธเน€เธเธตเธขเธเธเนเธฒ เธเธถเธเนเธกเนเน€เธเธดเธ” error',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เน€เธญเธฒเธญเธญเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเธเธฒเธฃเนเธชเธ”เธเธเธฅ UI)'
    },
    {
      id: 'log_000_separate_growth_tables_pct_and_amount',
      timestamp: '2026-10-17 14:52:00',
      timestampTh: '17 เธ•.เธ. 2569, 14:52 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธ•เธฒเธฃเธฒเธเธเธฃเธฒเธ % เนเธซเนเธกเธตเน€เธเธเธฒเธฐเธเธดเธ”เธเธฒเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธฃเธฑเธเธ•เธฒเธฃเธฒเธเธ”เนเธฒเธเธเธงเธฒเธเธฃเธฒเธเธฃเนเธญเธขเธฅเธฐ % เธเธดเธ”เธเธฒเธเธชเธฐเธชเธก เนเธกเนเนเธซเนเธกเธตเธเธญเธฅเธฑเธกเธเน %เธ เธฒเธเธฃเธงเธก (เธเธเธ•เธฒเธฃเธฒเธ 2 เธเธญเธฅเธฑเธกเธเน: เน€เธ”เธทเธญเธ เนเธฅเธฐ %)',
      targetSubject: 'เธ•เธฒเธฃเธฒเธเธงเธดเน€เธเธฃเธฒเธฐเธซเนเธญเธฑเธ•เธฃเธฒเธเธฒเธฃเน€เธ•เธดเธเนเธ•เธฃเธฒเธขเน€เธ”เธทเธญเธเธเธญเธเธเธฃเธฒเธเธฃเนเธญเธขเธฅเธฐ % (เนเธ—เนเธ Timeline)',
      storageFile: 'js/app.js, css/styles.css & js/data_history.js',
      changeSummary: 'เธ–เธญเธ”เธเธญเธฅเธฑเธกเธเน %เธ เธฒเธเธฃเธงเธก เธญเธญเธเธเธฒเธเธ•เธฒเธฃเธฒเธเธ”เนเธฒเธเธเธงเธฒเธเธญเธเธเธฃเธฒเธ % เธเธดเธ”เธเธฒเธเธกเธนเธฅเธเนเธฒ AUC เธชเธฐเธชเธก (เธเธเนเธงเน 2 เธเธญเธฅเธฑเธกเธเน: เน€เธ”เธทเธญเธ เนเธฅเธฐ %) เนเธฅเธฐเธเธ 3 เธเธญเธฅเธฑเธกเธเน (เน€เธ”เธทเธญเธ, เธ เธฒเธเธฃเธงเธก, เธเธดเธ”เธเธฒเธ) เน€เธเธเธฒเธฐเนเธเธเธฃเธฒเธเธเธณเธเธงเธเน€เธเธดเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ "เธญเธฑเธเธเธตเนเนเธกเนเธ•เนเธญเธเน€เธเธดเนเธก %เธ เธฒเธเธฃเธงเธก": (1) เธเธฃเธฑเธเธเธฑเธเธเนเธเธฑเธ renderTimelineGrowthTable เนเธซเนเธฃเธญเธเธฃเธฑเธเธ•เธฑเธงเน€เธฅเธทเธญเธ showTotal เน€เธเธทเนเธญเนเธขเธเธ•เธฒเธฃเธฒเธ 2 เธเธญเธฅเธฑเธกเธเน เนเธฅเธฐ 3 เธเธญเธฅเธฑเธกเธเนเนเธ”เนเธญเธขเนเธฒเธเธญเธดเธชเธฃเธฐ (2) เธเธณเธซเธเธ”เนเธซเนเธ•เธฒเธฃเธฒเธเธเธญเธเธเธฃเธฒเธเธฃเนเธญเธขเธฅเธฐ % เธเธดเธ”เธเธฒเธเธชเธฐเธชเธก (timelinePctGrowthTableWrap) เนเธชเธ”เธ 2 เธเธญเธฅเธฑเธกเธเน เธเธทเธญ "เน€เธ”เธทเธญเธ" เนเธฅเธฐ "%" (เธเธดเธ”เธเธฒเธ) เธเธฃเนเธญเธกเนเธ–เธงเธเนเธฒเน€เธเธฅเธตเนเธขเนเธเนเธ–เธงเธชเธธเธ”เธ—เนเธฒเธข เนเธ”เธขเนเธกเนเธกเธตเธเธญเธฅเธฑเธกเธเนเธ เธฒเธเธฃเธงเธก (3) เธเธณเธซเธเธ”เนเธซเนเธ•เธฒเธฃเธฒเธเธเธญเธเธเธฃเธฒเธเธเธณเธเธงเธเน€เธเธดเธ/เธเธณเธเธงเธเธเธฒเธ (timelineAmountGrowthTableWrap) เนเธชเธ”เธ 3 เธเธญเธฅเธฑเธกเธเน เธเธทเธญ "เน€เธ”เธทเธญเธ", "โ— เธ เธฒเธเธฃเธงเธก" (MoM Growth %) เนเธฅเธฐ "โ— เธเธดเธ”เธเธฒเธ" (%) เธ•เธฒเธกเธเธณเธชเธฑเนเธเธเนเธญเธเนเธญเธเธซเธเนเธฒ (4) เธเธฃเธฑเธเธเธงเธฒเธกเธเธงเนเธฒเธเธ•เธฒเธฃเธฒเธเนเธซเนเน€เธซเธกเธฒเธฐเธชเธก 195px เธชเธณเธซเธฃเธฑเธ 2 เธเธญเธฅเธฑเธกเธเน เนเธฅเธฐ 255px เธชเธณเธซเธฃเธฑเธ 3 เธเธญเธฅเธฑเธกเธเน',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เธญเธฑเธเธเธตเนเนเธกเนเธ•เนเธญเธเน€เธเธดเนเธก %เธ เธฒเธเธฃเธงเธก)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธ•เนเธณ (เธเธฃเธฑเธเธเธฃเธธเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเธเธญเธฅเธฑเธกเธเนเธ•เธฒเธฃเธฒเธเนเธซเนเธ•เธฃเธเธ•เธฒเธกเธเธงเธฒเธกเธ•เนเธญเธเธเธฒเธฃเธเธนเนเนเธเนเธเธฒเธเน€เธเธเธฒเธฐเธเธธเธ”)'
    },
    {
      id: 'log_000_growth_pct_and_total_column',
      timestamp: '2026-10-17 14:48:00',
      timestampTh: '17 เธ•.เธ. 2569, 14:48 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธ•เธฒเธฃเธฒเธเน€เธเนเธ % & เน€เธเธดเนเธกเธเธญเธฅเธฑเธกเธเนเธ เธฒเธเธฃเธงเธก',
      badgeClass: 'badge-type-edit',
      title: 'เธเธฃเธฑเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเธเนเธฒเน€เธเธดเนเธก/เธฅเธ”เธฅเธเน€เธเนเธ % เนเธ—เธเธเธฒเธ/เธฅเธ. เนเธฅเธฐเน€เธเธดเนเธกเธเธญเธฅเธฑเธกเธเนเธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ/เธเธฒเธ',
      targetSubject: 'เธ•เธฒเธฃเธฒเธเธงเธดเน€เธเธฃเธฒเธฐเธซเนเธญเธฑเธ•เธฃเธฒเธเธฒเธฃเน€เธ•เธดเธเนเธ•เธฃเธฒเธขเน€เธ”เธทเธญเธ เธ”เนเธฒเธเธเธงเธฒเธเธฃเธฒเธ Timeline',
      storageFile: 'js/app.js, css/styles.css & js/data_history.js',
      changeSummary: 'เน€เธเธฅเธตเนเธขเธเธเนเธฒเน€เธเธดเนเธก/เธฅเธ”เธฅเธเนเธเธ•เธฒเธฃเธฒเธเธเธฒเธเธเธณเธเธงเธเธเธฒเธ/เธฅเนเธฒเธเธเธฒเธ— เน€เธเนเธ % เนเธ—เธ เธเธฃเนเธญเธกเน€เธเธดเนเธกเธเธญเธฅเธฑเธกเธเนเธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ/เธเธฒเธ (เน€เธเธดเนเธก/เธฅเธ”เธฅเธ เน€เธเนเธ %) เธเธนเนเธเธฑเธเธเธญเธฅเธฑเธกเธเนเธเธดเธ”เธเธฒเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: (1) เธเธฃเธฑเธเธเธฒเธฃเธเธณเธเธงเธ“เนเธฅเธฐเนเธชเธ”เธเธเธฅเนเธเธ•เธฒเธฃเธฒเธเธ”เนเธฒเธเธเธงเธฒเธเธญเธเธเธฃเธฒเธ Timeline เธเธฒเธเธซเธเนเธงเธขเธเธฒเธ/เธฅเธ. เนเธซเนเนเธชเธ”เธเน€เธเนเธเธชเธฑเธ”เธชเนเธงเธเธฃเนเธญเธขเธฅเธฐ (%) เธ—เธฑเนเธเธซเธกเธ” (2) เน€เธเธดเนเธกเธเธญเธฅเธฑเธกเธเน "โ— เธ เธฒเธเธฃเธงเธก" เนเธชเธ”เธเธญเธฑเธ•เธฃเธฒเธเธฒเธฃเน€เธเธฅเธตเนเธขเธเนเธเธฅเธเธ เธฒเธเธฃเธงเธกเธกเธนเธฅเธเนเธฒ/เธเธฒเธ AUC เธฃเธฒเธขเน€เธ”เธทเธญเธ (MoM Growth %) เน€เธ—เธตเธขเธเธเธฑเธเน€เธ”เธทเธญเธเธเนเธญเธเธซเธเนเธฒ (3) เธเธเธเธญเธฅเธฑเธกเธเน "โ— เธเธดเธ”เธเธฒเธ" เนเธชเธ”เธเธญเธฑเธ•เธฃเธฒเธเธฒเธฃเธเธดเธ”เธเธฒเธเธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธเธซเธฃเธทเธญเธฅเธ”เธฅเธเนเธเนเธ•เนเธฅเธฐเน€เธ”เธทเธญเธ (%) (4) เธเธฃเธฑเธเธเธงเธฒเธกเธเธงเนเธฒเธเธ•เธฒเธฃเธฒเธเน€เธเนเธ 255px เนเธซเนเธฃเธญเธเธฃเธฑเธ 3 เธเธญเธฅเธฑเธกเธเน (เน€เธ”เธทเธญเธ, เธ เธฒเธเธฃเธงเธก, เธเธดเธ”เธเธฒเธ) เธเธฃเนเธญเธกเธชเธตเธชเธฑเธเธฅเธฑเธเธฉเธ“เนเธ—เธตเนเธ•เธฃเธเธเธฑเธเน€เธชเนเธเธเธฃเธฒเธ (เน€เธซเธฅเธทเธญเธ = เธ เธฒเธเธฃเธงเธก, เน€เธเธตเธขเธง = เธเธดเธ”เธเธฒเธ) (5) เธเธณเธเธงเธ“เธเนเธฒเน€เธเธฅเธตเนเธขเนเธเนเธ–เธงเธชเธธเธ”เธ—เนเธฒเธข (Footer) เธเธญเธเธ—เธฑเนเธเธเธญเธฅเธฑเธกเธเนเธ เธฒเธเธฃเธงเธกเนเธฅเธฐเธเธดเธ”เธเธฒเธเธญเธขเนเธฒเธเธ–เธนเธเธ•เนเธญเธเนเธกเนเธเธขเธณ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (1.เนเธซเนเนเธเนเนเธ เน€เธเธดเนเธก/เธฅเธ”เธฅเธ เธเธฒเธเธเธฒเธ/เธฅเธ. เน€เธเนเธ % เนเธ—เธ 2.เนเธซเนเน€เธเธดเนเธกเธเธญเธฅเธฑเธก เธ เธฒเธเธฃเธงเธกเธกเธนเธฅเนเธฒ/เธเธฒเธ เน€เธเธดเนเธก/เธฅเธ”เธฅเธ เน€เธเนเธ % เธ”เนเธงเธข 3.เนเธซเนเน€เธเธดเนเธกเธเธฃเธฐเธงเธฑเธ•เธดเนเธเน€เธกเธเธนเนเธเนเนเธเธ”เนเธงเธข เธ—เธธเธเธเธฃเธฑเนเธ)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธเธฃเธนเธเนเธเธเธเธฒเธฃเธงเธดเน€เธเธฃเธฒเธฐเธซเนเธญเธฑเธ•เธฃเธฒเธเธฒเธฃเน€เธ•เธดเธเนเธ•เธฃเธฒเธขเน€เธ”เธทเธญเธเนเธฅเธฐเธเธฒเธฃเนเธชเธ”เธเธเธฅเธ•เธฒเธฃเธฒเธเน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธ)'
    },
    {
      id: 'log_000_timeline_growth_table',
      timestamp: '2026-10-17 14:27:00',
      timestampTh: '17 เธ•.เธ. 2569, 14:27 เธ.',
      type: 'EDIT',
      typeBadge: 'เน€เธเธดเนเธกเธ•เธฒเธฃเธฒเธ % เน€เธเธดเนเธก/เธฅเธ” เธฃเธฒเธขเน€เธ”เธทเธญเธ',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธดเนเธกเธ•เธฒเธฃเธฒเธเนเธชเธ”เธเธเนเธฒ % เนเธฅเธฐเธเธณเธเธงเธเน€เธเธดเธเธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ/เธฅเธ”เธฅเธเธฃเธฒเธขเน€เธ”เธทเธญเธ (เธก.เธ. - เธ.เธ.) เนเธฅเธฐเธเนเธฒเน€เธเธฅเธตเนเธข เธ”เนเธฒเธเธเธงเธฒเธเธฃเธฒเธ Timeline',
      targetSubject: 'เธเธฃเธฒเธเธงเธดเน€เธเธฃเธฒเธฐเธซเนเน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธ & Timeline (เนเธ—เนเธ Timeline)',
      storageFile: 'index.html, js/app.js & css/styles.css',
      changeSummary: 'เนเธชเธ”เธเธ•เธฒเธฃเธฒเธ 2 เธเธญเธฅเธฑเธกเธเน (เน€เธ”เธทเธญเธ เนเธฅเธฐ %) เธ”เนเธฒเธเธเธงเธฒเธเธญเธเธเธฃเธฒเธ เนเธชเธ”เธเธเนเธฒเธเธฒเธฃเธเธดเธ”เธเธฒเธเธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธเธซเธฃเธทเธญเธฅเธ”เธฅเธเนเธ•เนเธฅเธฐเน€เธ”เธทเธญเธ เธเธฃเนเธญเธกเธเนเธฒเน€เธเธฅเธตเนเธขเนเธเนเธ–เธงเธชเธธเธ”เธ—เนเธฒเธข',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: (1) เธญเธญเธเนเธเธเธ•เธฒเธฃเธฒเธ 2 เธเธญเธฅเธฑเธกเธเน (เธเธญเธฅเธฑเธกเธเนเน€เธ”เธทเธญเธ เนเธฅเธฐเธเธญเธฅเธฑเธกเธเน %) เธเธฑเธ”เธงเธฒเธเธ”เนเธฒเธเธเธงเธฒเธเธญเธเธเธฃเธฒเธ Timeline เนเธ Section เธฃเนเธญเธขเธฅเธฐ % เธเธดเธ”เธเธฒเธเธชเธฐเธชเธก เนเธฅเธฐ Section เธเธณเธเธงเธเน€เธเธดเธ (2) เธเธณเธเธงเธ“เธชเนเธงเธเธ•เนเธฒเธเธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธ/เธฅเธ”เธฅเธ (MoM Growth) เธเธญเธเนเธ•เนเธฅเธฐเน€เธ”เธทเธญเธเธ•เธฑเนเธเนเธ•เน เธก.เธ. - เธ.เธ. เธเธฃเนเธญเธกเนเธชเธ”เธเธชเธฑเธเธฅเธฑเธเธฉเธ“เนเธชเธตเน€เธเธตเธขเธง/เนเธ”เธ (3) เธเธณเธเธงเธ“เธเนเธฒเน€เธเธฅเธตเนเธขเนเธเนเธ–เธงเธชเธธเธ”เธ—เนเธฒเธข (Footer Row) เธเธญเธเธ•เธฒเธฃเธฒเธเธญเธขเนเธฒเธเนเธกเนเธเธขเธณ (4) เธฃเธญเธเธฃเธฑเธเธเธฒเธฃเธญเธฑเธเน€เธ”เธ•เนเธเธเน€เธฃเธตเธขเธฅเนเธ—เธกเนเน€เธกเธทเนเธญเน€เธเธฅเธตเนเธขเธเธ•เธฑเธงเธเธฃเธญเธเน€เธเธ“เธ‘เนเธงเธฑเธ” เธเธทเนเธเธ—เธตเน เธซเธฃเธทเธญเธซเธเนเธงเธขเธเธฒเธ',
      sourceFile: 'เธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ (เนเธชเธ”เธเธเนเธฒเธ—เธตเนเน€เธเธดเนเธกเธเธถเนเธเธซเธฃเธทเธญเธฅเธ”เธฅเธเน€เธเนเธ % เนเธ•เนเธฅเธฐเน€เธ”เธทเธญเธ เนเธฅเธฐเธเนเธฒเน€เธเธฅเธตเนเธขเนเธเธ•เธฒเธฃเธฒเธเธ”เนเธฒเธเธเธงเธฒ 2 เธเธญเธฅเธฑเธกเธเน)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เน€เธเธดเนเธกเธเธฑเธเธเนเธเธฑเธเธงเธดเน€เธเธฃเธฒเธฐเธซเนเธญเธฑเธ•เธฃเธฒเธเธฒเธฃเน€เธ•เธดเธเนเธ•เธฃเธฒเธขเน€เธ”เธทเธญเธเนเธฅเธฐเธเธฒเธฃเนเธชเธ”เธเธเธฅเธเนเธญเธกเธนเธฅ)'
    },
    {
      id: 'log_000_fix_model_view',
      timestamp: '2026-10-17 13:45:00',
      timestampTh: '17 เธ•.เธ. 2569, 13:45 เธ.',
      type: 'EDIT',
      typeBadge: 'เนเธเนเนเธเธเธฒเธฃเนเธชเธ”เธเธเธฅ Model View',
      badgeClass: 'badge-type-edit',
      title: 'เนเธเนเนเธเธซเธเนเธฒเธ•เนเธฒเธ Model View & เธ•เธฑเธงเธญเธขเนเธฒเธเธเนเธญเธกเธนเธฅ เนเธกเนเนเธชเธ”เธเธเธฅเน€เธกเธทเนเธญเธเธฅเธดเธ',
      targetSubject: 'เธซเธเนเธฒเธ•เนเธฒเธเธเนเธญเธเธญเธฑเธ Model View & เธเธฒเธฃเนเธ”เนเธเธฅเนเธ•เนเธเธ—เธฒเธ',
      storageFile: 'js/data_history.js, index.html & css/styles.css',
      changeSummary: 'เนเธเนเนเธเนเธซเนเธซเธเนเธฒเธ•เนเธฒเธ Model View เนเธชเธ”เธเธเธฅเธชเธกเธเธนเธฃเธ“เน 100% เธ—เธฑเธเธ—เธตเธ—เธตเนเธเธฅเธดเธเธ”เธนเธ•เธฑเธงเธญเธขเนเธฒเธเธเนเธญเธกเธนเธฅเนเธเธฅเนเนเธฅเธฐเธเธฃเธฐเธงเธฑเธ•เธด เธเธฃเนเธญเธกเธเธฃเธฑเธ z-index เนเธฅเธฐเธขเนเธฒเธข DOM เธชเธนเน Root',
      details: 'เนเธเนเนเธ 5 เธเธธเธ”เธชเธณเธเธฑเธ: (1) เธเธฃเธฑเธ openModelViewModal เนเธซเนเนเธชเนเธเธฅเธฒเธช .show เนเธฅเธฐ display:flex เนเธเธ Synchronous เนเธกเนเธ”เธตเน€เธฅเธขเน requestAnimationFrame (2) เธขเนเธฒเธข DOM เธเธญเธ dhModelViewModal เนเธฅเธฐ dhAddLogModal เนเธเนเธงเนเธฃเธฐเธ”เธฑเธ Root เนเธ index.html เธเนเธฒเธ drilldownModal เน€เธเธทเนเธญเธเนเธญเธเธเธฑเธเธเธฑเธเธซเธฒ Stacking context/Transform (3) เธเธฃเธฑเธ .modal-backdrop เนเธซเนเธกเธต z-index: 10050 เนเธฅเธฐ .show เธกเธต display: flex !important; opacity: 1 !important; (4) เธเธฃเธฑเธเธเธธเนเธกเธเธฅเธดเธเธ”เธน Model View เธเธเธเธฒเธฃเนเธ”เนเธเธฅเนเนเธซเนเน€เธเนเธ Button เธ—เธตเนเธฃเธญเธเธฃเธฑเธเธเธฒเธฃเธเธฅเธดเธเนเธขเธเนเธ”เธขเธ•เธฃเธ (5) เน€เธเธดเนเธก try-catch เนเธฅเธฐเธเธงเธฒเธกเธเธฅเธญเธ”เธ เธฑเธขเนเธเธเธฒเธฃเนเธเธฅเธเธ•เธฑเธงเน€เธฅเธเธเธญเธ sampleProvider เธ—เธธเธเนเธเธฅเน',
      sourceFile: 'js/data_history.js (openModelViewModal, closeDhModelModal & sampleProvider)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธชเธนเธ (เนเธเนเนเธเธเธฑเธเธเนเธเธฑเธเธเธฒเธฃเธ•เธฃเธงเธเธชเธญเธเธเนเธญเธกเธนเธฅ Model View เธเธญเธเธฃเธฐเธเธ)'
    },
    {
      id: 'log_000_workflow',
      timestamp: '2026-10-17 13:08:00',
      timestampTh: '17 เธ•.เธ. 2569, 13:08 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธเธฃเธธเธเน€เธกเธเธนเธเธณเธ—เธฒเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธณเน€เธกเธเธน "เธเธฑเนเธเธ•เธญเธเธเธฒเธเธเนเธญเธชเธฃเนเธฒเธ & เธเธถเนเธเธ—เธฐเน€เธเธตเธขเธ" เธญเธญเธเธเธฒเธเนเธ–เธเน€เธกเธเธนเธซเธฅเธฑเธ',
      targetSubject: 'เนเธ–เธเน€เธกเธเธนเธเธณเธ—เธฒเธ (Navigation Bar) & เนเธ—เนเธเธเธฑเนเธเธ•เธญเธเธเธฒเธเธเนเธญเธชเธฃเนเธฒเธ',
      storageFile: 'index.html',
      changeSummary: 'เธเธณเธเธธเนเธกเน€เธกเธเธนเนเธ—เนเธ เธเธฑเนเธเธ•เธญเธเธเธฒเธเธเนเธญเธชเธฃเนเธฒเธ & เธเธถเนเธเธ—เธฐเน€เธเธตเธขเธ เธญเธญเธเธเธฒเธเนเธ–เธเน€เธกเธเธนเธซเธฅเธฑเธเธ”เนเธฒเธเธเธ เนเธฅเธฐเธเธญเธกเน€เธกเธเธ•เนเธเธดเธ”เธชเนเธงเธ Tab Pane (tab-workflow)',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: เธเธณเนเธ—เนเธเธเธ Navigation bar (<button class="nav-tab-btn" data-tab="tab-workflow">) เธญเธญเธ เนเธฅเธฐเธเธญเธกเน€เธกเธเธ•เนเธเธดเธ”เนเธ—เนเธเน€เธเธทเนเธญเธซเธฒ <div id="tab-workflow" class="tab-pane"> เน€เธเธทเนเธญเธฅเธ”เธเธงเธฒเธกเธเนเธณเธเนเธญเธเนเธฅเธฐเธเธฃเธฐเธเธฑเธเนเธ–เธเน€เธกเธเธนเธเธณเธ—เธฒเธ เนเธ”เธขเธขเธฑเธเธเธเนเธเธฃเธเธชเธฃเนเธฒเธเนเธเนเธ”เนเธงเนเธซเธฒเธเธ•เนเธญเธเธเธฒเธฃเธเธณเธเธฅเธฑเธเธกเธฒเนเธเนเธเธฒเธเนเธเธญเธเธฒเธเธ•',
      sourceFile: 'index.html (Navigation Tabs Bar & Tab Pane Workflow)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธเธซเธเนเธฒเธเธญเน€เธกเธเธนเธเธณเธ—เธฒเธเนเธซเนเธ•เธฃเธเธ•เธฒเธกเธเธงเธฒเธกเธ•เนเธญเธเธเธฒเธฃเธเธนเนเนเธเนเธเธฒเธ)'
    },
    {
      id: 'log_000',
      timestamp: '2026-10-17 12:57:00',
      timestampTh: '17 เธ•.เธ. 2569, 12:57 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธเธฃเธธเธเน€เธกเธเธนเธเธณเธ—เธฒเธ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธณเน€เธกเธเธน "เธ•เธฒเธฃเธฒเธเธชเธทเธเธเนเธเธเนเธญเธกเธนเธฅ & เนเธเธเธฃเธฒเธขเน€เธ”เธทเธญเธ" เธญเธญเธเธเธฒเธเนเธ–เธเน€เธกเธเธนเธซเธฅเธฑเธ',
      targetSubject: 'เนเธ–เธเน€เธกเธเธนเธเธณเธ—เธฒเธ (Navigation Bar) & เนเธ—เนเธเธ•เธฒเธฃเธฒเธเธชเธทเธเธเนเธเธเนเธญเธกเธนเธฅ',
      storageFile: 'index.html',
      changeSummary: 'เธเธณเธเธธเนเธกเน€เธกเธเธนเนเธ—เนเธ เธ•เธฒเธฃเธฒเธเธชเธทเธเธเนเธเธเนเธญเธกเธนเธฅ & เนเธเธเธฃเธฒเธขเน€เธ”เธทเธญเธ เธญเธญเธเธเธฒเธเนเธ–เธเน€เธกเธเธนเธซเธฅเธฑเธเธ”เนเธฒเธเธเธ เนเธฅเธฐเธเธญเธกเน€เธกเธเธ•เนเธเธดเธ”เธชเนเธงเธ Tab Pane (tab-table) เน€เธเธทเนเธญเธเธงเธฒเธกเธเธฃเธฐเธเธฑเธเนเธเธเธฒเธฃเนเธเนเธเธฒเธ',
      details: 'เธ”เธณเน€เธเธดเธเธเธฒเธฃเธ•เธฒเธกเธเธณเธชเธฑเนเธเธเธนเนเนเธเนเธเธฒเธ: เธเธณเนเธ—เนเธเธเธ Navigation bar (<button class="nav-tab-btn" data-tab="tab-table">) เธญเธญเธ เนเธฅเธฐเธเธญเธกเน€เธกเธเธ•เนเธเธดเธ”เนเธ—เนเธเน€เธเธทเนเธญเธซเธฒ <div id="tab-table" class="tab-pane"> เน€เธเธทเนเธญเนเธกเนเนเธซเนเนเธชเธ”เธเธเธฅเนเธเธซเธเนเธฒเธเธญเธซเธฅเธฑเธ เนเธ•เนเธขเธฑเธเธเธเนเธเธฃเธเธชเธฃเนเธฒเธเนเธงเนเนเธเนเธเนเธ”เธซเธฒเธเธ•เนเธญเธเธเธฒเธฃเธเธณเธเธฅเธฑเธเธกเธฒเนเธเนเธเธฒเธเนเธเธญเธเธฒเธเธ•',
      sourceFile: 'index.html (Navigation Tabs Bar & Tab Pane Matrix)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธฃเธฑเธเธเธฃเธธเธเธซเธเนเธฒเธเธญเน€เธกเธเธนเธเธณเธ—เธฒเธเนเธซเนเธ•เธฃเธเธ•เธฒเธกเธเธงเธฒเธกเธ•เนเธญเธเธเธฒเธฃเธเธนเนเนเธเนเธเธฒเธ)'
    },
    {
      id: 'log_001',
      timestamp: '2026-10-17 08:15:00',
      timestampTh: '17 เธ•.เธ. 2569, 08:15 เธ.',
      type: 'EDIT',
      typeBadge: 'เนเธเนเนเธเธ•เธฑเธงเธเธฃเธญเธเธเนเธเธซเธฒ',
      badgeClass: 'badge-type-edit',
      title: 'เนเธเนเนเธเธฃเธฐเธเธเธ•เธฑเธงเธเธฃเธญเธเธเนเธเธซเธฒเนเธเธ•เธฒเธฃเธฒเธ WBS เนเธซเนเธ•เธฃเธเธ•เธฒเธกเธชเธ–เธฒเธเธฐ SAP เธเธฃเธดเธ 100%',
      targetSubject: 'เธ•เธฒเธฃเธฒเธ WBS (เธ•เธฑเธงเธเธฃเธญเธเธเนเธเธซเธฒเธเนเธญเธเธงเธฒเธก)',
      storageFile: 'js/wbs.js & index.html',
      changeSummary: 'เนเธขเธเธเธฒเธฃเธเนเธเธซเธฒเธชเธ–เธฒเธเธฐ SAP (TECO, REL, CLSD, CRTD) เนเธกเนเนเธซเนเธเธณเธงเนเธฒ TECO เนเธเธเนเธญเธเธซเธกเธฒเธขเน€เธซเธ•เธธ (note) เธเธญเธเธเธฒเธเธ—เธตเนเธชเธ–เธฒเธเธฐ SAP เธขเธฑเธเน€เธเนเธ REL เธเธฐเธเธเธเธถเนเธเธกเธฒ',
      details: 'เน€เธเธดเนเธกเธเธฑเธเธเนเธเธฑเธ isStatusKeyword เธ•เธฃเธงเธเธเธฑเธเธเธตเธขเนเน€เธงเธดเธฃเนเธ”เธชเธ–เธฒเธเธฐ SAP เนเธฅเธฐเธเธณเธซเธเธ”เนเธกเนเนเธซเนเธเนเธญเธ note เธกเธฒเธฃเนเธงเธกเธเธฑเธเธเธนเนเน€เธกเธทเนเธญเธเนเธเธซเธฒเธชเธ–เธฒเธเธฐ SAP เธเธฒเธ C-68-I-NPMSR.0215.02.1 (REL D1) เธเธถเธเนเธกเนเนเธชเธ”เธเธเธฐเธเธเน€เธกเธทเนเธญเธเนเธเธซเธฒ "teco" เธเธฃเนเธญเธกเธ—เธฑเนเธเน€เธเธดเนเธกเธเธฒเธฃเธฅเนเธฒเธเธเนเธฒเธชเธ–เธฒเธเธฐ SAP เน€เธกเธทเนเธญเธเธ”เธฅเนเธฒเธเธ•เธฑเธงเธเธฃเธญเธเนเธเธ•เธฒเธฃเธฒเธ',
      sourceFile: '06 google sheet เนเธเธเธเธฒเธเนเธฅเนเธงเน€เธชเธฃเนเธ.xlsx (เธเธญเธฅเธฑเธกเธเน note)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธชเธนเธเธกเธฒเธ (เนเธเนเนเธเธเธงเธฒเธกเธ–เธนเธเธ•เนเธญเธเธเธญเธเธเธฒเธฃเธเธฑเธเธเธณเธเธงเธเธเธฒเธเนเธฅเธฐเธขเธญเธ”เน€เธเธดเธ)'
    },
    {
      id: 'log_002',
      timestamp: '2026-10-17 07:45:00',
      timestampTh: '17 เธ•.เธ. 2569, 07:45 เธ.',
      type: 'EDIT',
      typeBadge: 'เน€เธเธดเนเธกเธเธฑเธเธเนเธเธฑเธเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅ',
      badgeClass: 'badge-type-edit',
      title: 'เน€เธเธดเนเธกเธเธธเนเธกเธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธตเนเน€เธฅเธทเธญเธ Checkbox เนเธฅเธฐเธเธเธชเธ–เธฒเธเธฐ Checkbox เธเนเธฒเธกเธเธฒเธฃเธเธฅเธดเธเธเธฒเธฃเนเธ”เธชเธ–เธฒเธเธฐ SAP',
      targetSubject: 'เธเธฒเธฃเนเธ”เธชเธฃเธธเธเธเธฅเธฃเธงเธกเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเน€เธฅเธทเธญเธ & Checkbox',
      storageFile: 'js/wbs.js',
      changeSummary: 'เน€เธเธดเนเธกเธเธธเนเธก ๐—‘๏ธ เธฅเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธตเนเน€เธฅเธทเธญเธ เนเธ Header เธเธญเธเธเธฒเธฃเนเธ” เนเธฅเธฐเนเธเนเนเธเนเธซเนเธฃเธฐเธเธเธเธเธชเธ–เธฒเธเธฐเธ—เธตเนเธ•เธดเนเธ Checkbox เนเธงเนเนเธกเนเธเธฐเธเธฅเธดเธเธชเธฅเธฑเธเธ”เธนเธชเธ–เธฒเธเธฐ SAP เนเธ”เน',
      details: 'เธเธฃเธฑเธเธเธฃเธธเธเธ•เธฑเธงเนเธเธฃ selectedWbsCodes เนเธซเนเธเธณเธเธงเธ“เธชเธฃเธธเธเธเธฅเธ•เธฒเธกเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเน€เธฅเธทเธญเธเธเธฃเธดเธเธ—เธฑเนเธเธซเธกเธ” (wbsSelectedItems) เนเธ”เธขเนเธกเนเธ–เธนเธเธ•เธฑเธ”เธ—เธญเธเธเธฒเธเธเธฒเธฃเธเธฃเธญเธเธ”เนเธงเธขเธเธฒเธฃเนเธ”เธชเธ–เธฒเธเธฐ SAP เธขเนเธญเธข',
      sourceFile: 'เธฃเธฐเธเธเธชเนเธงเธเธซเธเนเธฒ (UI Interaction)',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เน€เธเธดเนเธกเธเธงเธฒเธกเธชเธฐเธ”เธงเธเนเธเธเธฒเธฃเนเธเนเธเธฒเธ)'
    },
    {
      id: 'log_003',
      timestamp: '2026-10-16 23:30:00',
      timestampTh: '16 เธ•.เธ. 2569, 23:30 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธฃเธฑเธเธเธฃเธธเธเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธเธฅ',
      badgeClass: 'badge-type-edit',
      title: 'เธเธฃเธฑเธเธเธฃเธธเธเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธเธฅเธฃเธงเธกเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเน€เธฅเธทเธญเธเนเธซเนเนเธชเธ”เธเน€เธเธเธฒเธฐเธชเธ–เธฒเธเธฐ SAP เธ—เธตเนเธ•เธดเนเธ Checkbox',
      targetSubject: 'WBS Selected Summary Cards',
      storageFile: 'js/wbs.js & css/styles.css',
      changeSummary: 'เธเธฃเธฑเธเธเธเธฒเธ”เธเธฒเธฃเนเธ”เนเธซเนเน€เธ—เนเธฒเธเธฑเธเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธชเธ–เธฒเธเธฐ SAP เธเนเธญเธเธเธฒเธฃเนเธ” CLSD เธเนเธญเธเธเธฒเธฃเนเธ”เธชเธ–เธฒเธเธฐเธ—เธตเนเนเธกเนเนเธ”เนเธ•เธดเนเธ เนเธฅเธฐเน€เธญเธฒเธเธธเนเธกเน€เธฅเธทเธญเธเธ—เธฑเนเธเธซเธกเธ”/เธเธฅเธ”เธ—เธฑเนเธเธซเธกเธ”เธญเธญเธ',
      details: 'เนเธชเธ”เธเธเธฒเธฃเนเธ”เธชเธฃเธธเธเธเธฃเธฐเน€เธ เธ—เธชเธ–เธฒเธเธฐ SAP เน€เธเธเธฒเธฐเธ—เธตเนเธกเธตเธฃเธฒเธขเธเธฒเธฃ Checkbox เธ–เธนเธเน€เธฅเธทเธญเธเธญเธขเธนเนเธเธฃเธดเธเน€เธ—เนเธฒเธเธฑเนเธ เธซเธฒเธเนเธกเนเธกเธตเธเธฒเธฃเน€เธฅเธทเธญเธเธเธฐเนเธชเธ”เธเธเธฒเธฃเนเธ” "เธ—เธฑเนเธเธซเธกเธ”" เน€เธเธตเธขเธเนเธเน€เธ”เธตเธขเธง',
      sourceFile: 'เธฃเธฐเธเธเนเธชเธ”เธเธเธฅเธชเธฃเธธเธเธ•เธฒเธฃเธฒเธ WBS',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเธงเธฒเธกเธชเธงเธขเธเธฒเธกเนเธฅเธฐเนเธเนเธเธฒเธเธเนเธฒเธข)'
    },
    {
      id: 'log_004',
      timestamp: '2026-10-15 17:52:00',
      timestampTh: '15 เธ•.เธ. 2569, 17:52 เธ.',
      type: 'EDIT',
      typeBadge: 'เธเธณเธฅเธญเธเนเธเธ Scenario & เธเธตเธก',
      badgeClass: 'badge-type-config',
      title: 'เน€เธเธดเนเธกเน€เธเธฃเธทเนเธญเธเธกเธทเธญเธเธณเธฅเธญเธเนเธเธเธเธดเธ”เธเธฒเธ Scenario Calculator เนเธฅเธฐเธเธฒเน€เธฅเธ—เธเธฃเธฑเธเนเธ•เนเธเธชเธต & เธเธตเธก',
      targetSubject: 'Scenario Calculator & Color Palette Widget',
      storageFile: 'js/app.js & localStorage',
      changeSummary: 'เน€เธเธดเนเธก Modal Scenario เธเธณเธฅเธญเธเธเธฅเธฅเธฑเธเธเนเธเธฒเธฃเธเธฃเธฑเธเธขเธญเธ”เนเธเธเธเธดเธ”เธเธฒเธเธฃเธฒเธขเน€เธ”เธทเธญเธ เธเธฃเนเธญเธกเธเธณเธเธงเธ“ Gap เน€เธ—เธตเธขเธเน€เธเนเธฒเธซเธกเธฒเธขเธชเธฐเธชเธก',
      details: 'เธเธฑเธเธ—เธถเธเธเนเธฒเธ—เธตเนเธเธนเนเนเธเนเธ—เธ”เธฅเธญเธเนเธเนเนเธเธฅเธ localStorage (AUC_SIMULATION_SCENARIO) เน€เธเธทเนเธญเนเธซเนเธชเธฒเธกเธฒเธฃเธ–เธเธณเธฅเธญเธเน€เธเนเธฒเธซเธกเธฒเธข KPI เนเธ”เนเนเธเธเน€เธฃเธตเธขเธฅเนเธ—เธกเน',
      sourceFile: '02 KPI.xlsx & เนเธเธเธเธดเธ”เธเธฒเธ',
      author: 'เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ (System Admin)',
      impactLevel: 'เธชเธนเธ (เธเธตเน€เธเธญเธฃเนเธเนเธงเธขเธงเธฒเธเนเธเธเธเธดเธ”เธเธฒเธเธเธนเนเธเธฃเธดเธซเธฒเธฃ)'
    },
    {
      id: 'log_005',
      timestamp: '2026-10-13 19:05:00',
      timestampTh: '13 เธ•.เธ. 2569, 19:05 เธ.',
      type: 'MERGE',
      typeBadge: 'เธเธชเธฒเธเธเนเธญเธกเธนเธฅ 4 เนเธเธฅเนเธซเธฅเธฑเธ',
      badgeClass: 'badge-type-merge',
      title: 'เธเธณเน€เธเนเธฒเนเธฅเธฐเธเธชเธฒเธเธฃเธงเธกเนเธเธฅเนเธเธฒเธเธเธเน€เธซเธฅเธทเธญ WBS: เนเธเธฅเน 03 + 04 + 05 + 06',
      targetSubject: 'เธเธฒเธเธเนเธญเธกเธนเธฅ WBS เธเธเน€เธซเธฅเธทเธญ (Full Database)',
      storageFile: 'js/data_wbs.js',
      changeSummary: 'เธเธชเธฒเธเธฃเธงเธกเนเธเธฅเน Excel 03, 04, 05, 06 เธ”เนเธงเธขเธฃเธซเธฑเธช WBS เน€เธ”เธตเธขเธงเธเธฑเธ เนเธ”เนเธเธฒเธเธเนเธญเธกเธนเธฅเธเธฃเธ 41 เธเธญเธฅเธฑเธกเธเน 2,968 เธฃเธฒเธขเธเธฒเธฃ',
      details: 'เธฃเธฑเธเธชเธเธฃเธดเธเธ•เน merge_wbs_all.ps1 เธญเนเธฒเธเนเธเธฅเน 03 WBSเธเธฒเธเธเธเน€เธซเธฅเธทเธญ (2,968 เธฃเธฒเธขเธเธฒเธฃ), เธเธชเธฒเธเนเธเธฅเน 04 ZBUDR064 (%เน€เธเธดเธเธเธฑเธชเธ”เธธ/เธเธเธ.), เธเธชเธฒเธเนเธเธฅเน 05 CN41 (เธกเธนเธฅเธเนเธฒ AUC เธเธฒเธ—), เนเธฅเธฐเนเธเธฅเน 06 Google Sheet (เนเธเธเธเธดเธ”เธเธฒเธ/เธซเธกเธฒเธขเน€เธซเธ•เธธ) เธเธฑเธ”เน€เธเนเธเน€เธเนเธเธ•เธฑเธงเนเธเธฃ window.AUC_WBS_REMAINING_DATA',
      sourceFile: '03 WBSเธเธฒเธเธเธเน€เธซเธฅเธทเธญ, 04 ZBUDR064, 05 CN41, 06 Google Sheet',
      author: 'Script Data Merge Engine',
      impactLevel: 'เธงเธดเธเธคเธ• (เธเธฒเธเธเนเธญเธกเธนเธฅเธซเธฅเธฑเธเธเธญเธเธ—เธฑเนเธเธฃเธฐเธเธ)'
    },
    {
      id: 'log_006',
      timestamp: '2026-10-03 09:30:00',
      timestampTh: '3 เธ•.เธ. 2569, 09:30 เธ.',
      type: 'IMPORT',
      typeBadge: 'เธเธณเน€เธเนเธฒเน€เธเธ“เธ‘เนเธงเธฑเธ” KPI',
      badgeClass: 'badge-type-import',
      title: 'เธเธณเน€เธเนเธฒเธ•เธฒเธฃเธฒเธเน€เธเธ“เธ‘เนเธงเธฑเธ” KPI เธเธฃเธฐเธเธณเธเธต 2569 เธเธฒเธเนเธเธฅเน 02 KPI.xlsx',
      targetSubject: 'เน€เธเธ“เธ‘เนเธงเธฑเธ” KPI เธเธต 2569 (เธเนเธญ 1.1 - 3.3)',
      storageFile: 'js/kpi_matrix.js & localStorage',
      changeSummary: 'เธเธณเน€เธเนเธฒเน€เธเนเธฒเธซเธกเธฒเธขเธชเธฐเธชเธกเธฃเธฒเธขเน€เธ”เธทเธญเธเนเธฅเธฐเธเนเธฒเธเนเธณเธซเธเธฑเธเธเธฐเนเธเธ KPI เธเธฃเธฐเธเธณเธเธต 2569 เธ—เธฑเนเธ 8 เน€เธเธ“เธ‘เนเธงเธฑเธ”',
      details: 'เนเธเธฅเธเธเนเธญเธกเธนเธฅเธเธฒเธเนเธเธฅเน 02 KPI.xlsx เน€เธเนเธเนเธเธฃเธเธชเธฃเนเธฒเธ JSON เธเธฑเธ”เน€เธเนเธเนเธเธ•เธฑเธงเนเธเธฃ window.KPI_MATRIX เธฃเธญเธเธฃเธฑเธเธเธฒเธฃเธเธณเธเธงเธ“เธเธฅเธเธฒเธเธชเธฐเธชเธกเธญเธฑเธ•เนเธเธกเธฑเธ•เธด',
      sourceFile: '02 KPI.xlsx',
      author: 'เธเธนเนเธเธณเน€เธเนเธฒเธเนเธญเธกเธนเธฅ (Data Officer)',
      impactLevel: 'เธชเธนเธ (เธเธณเธซเธเธ”เธชเธนเธ•เธฃเนเธฅเธฐเน€เธเนเธฒเธซเธกเธฒเธข KPI)'
    },
    {
      id: 'log_007',
      timestamp: '2026-09-29 16:55:00',
      timestampTh: '29 เธ.เธข. 2569, 16:55 เธ.',
      type: 'IMPORT',
      typeBadge: 'เธเธณเน€เธเนเธฒเธเธฅเธเธฒเธเน€เธ”เธทเธญเธ เธช.เธ.',
      badgeClass: 'badge-type-import',
      title: 'เธเธณเน€เธเนเธฒเธเนเธญเธกเธนเธฅเธฃเธฒเธขเธเธฒเธเธเธฅเธเธฒเธ AUC เธเธฃเธฐเธเธณเน€เธ”เธทเธญเธ เธช.เธ. 2569',
      targetSubject: 'เธฃเธฒเธขเธเธฒเธ AUC เธฃเธฒเธขเน€เธ”เธทเธญเธ (เธช.เธ. 2569)',
      storageFile: 'js/data_aug.js',
      changeSummary: 'เธเธณเน€เธเนเธฒเธเธฅเธเธฒเธเธฃเธฒเธข เธเธเธ. 20 เนเธซเนเธ เน€เธ”เธทเธญเธ เธช.เธ. 2569 เธเธณเธเธงเธ 368 เนเธ–เธงเธเนเธญเธกเธนเธฅ',
      details: 'เธเธฑเธเธ—เธถเธเธขเธญเธ”เธฃเธงเธก AUC, เธเธดเธ”เธเธฒเธเนเธฅเนเธง, เธเธเน€เธซเธฅเธทเธญ, % เธเธดเธ”เธเธฒเธ เนเธฅเธฐเธเธฐเนเธเธ KPI เธเธฃเธฐเธเธณเน€เธ”เธทเธญเธ เธช.เธ. เน€เธเนเธ Active Month เธเธญเธเนเธ”เธเธเธญเธฃเนเธ”เธเธนเนเธเธฃเธดเธซเธฒเธฃ',
      sourceFile: '01 เธฃเธฒเธขเธเธฒเธ AUC เน€เธ”เธทเธญเธ 8เธช.เธ.  (3.2&3.3teco).xlsx',
      author: 'เธเธนเนเธเธณเน€เธเนเธฒเธเนเธญเธกเธนเธฅ (Data Officer)',
      impactLevel: 'เธชเธนเธ (เธเนเธญเธกเธนเธฅเธฃเธญเธเธเธฃเธฐเน€เธกเธดเธเธฅเนเธฒเธชเธธเธ”)'
    },
    {
      id: 'log_008',
      timestamp: '2026-09-25 17:32:00',
      timestampTh: '25 เธ.เธข. 2569, 17:32 เธ.',
      type: 'IMPORT',
      typeBadge: 'เธเธณเน€เธเนเธฒเธเธฃเธฐเธงเธฑเธ•เธด เธก.เธ. - เธ.เธ.',
      badgeClass: 'badge-type-import',
      title: 'เธเธณเน€เธเนเธฒเธเนเธญเธกเธนเธฅเธเธฅเธเธฒเธเธขเนเธญเธเธซเธฅเธฑเธเน€เธ”เธทเธญเธ เธก.เธ. - เธ.เธ. 2569 (เธฃเธงเธก 7 เน€เธ”เธทเธญเธ)',
      targetSubject: 'เธฃเธฒเธขเธเธฒเธ AUC เธขเนเธญเธเธซเธฅเธฑเธ เธก.เธ. - เธ.เธ.',
      storageFile: 'js/data.js เนเธฅเธฐ js/data_jan.js เธ–เธถเธ data_jun.js',
      changeSummary: 'เธเธณเน€เธเนเธฒเธเธฒเธเธเนเธญเธกเธนเธฅเธเธฅเธเธฒเธเธฃเธฒเธขเน€เธ”เธทเธญเธเธขเนเธญเธเธซเธฅเธฑเธเธฃเธงเธก 2,576 เธฃเธฒเธขเธเธฒเธฃ',
      details: 'เธเธฑเธ”เน€เธเนเธเธชเธ–เธดเธ•เธดเธเธฅเธเธฒเธเธชเธฐเธชเธกเน€เธเธทเนเธญเนเธเนเนเธเธเธฒเธฃเธเธฅเนเธญเธ•เธเธฃเธฒเธเน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธเนเธเธงเนเธเนเธก (Timeline Analysis) เนเธฅเธฐเธเธฒเธฃเธเธฃเธฐเน€เธกเธดเธเธเธฅเธเธฒเธฃเธ”เธณเน€เธเธดเธเธเธฒเธ',
      sourceFile: '01 เธฃเธฒเธขเธเธฒเธ AUC เน€เธ”เธทเธญเธ 1เธก.เธ. เธ–เธถเธ 7เธ.เธ. 2569',
      author: 'เธเธนเนเธเธณเน€เธเนเธฒเธเนเธญเธกเธนเธฅ (Data Officer)',
      impactLevel: 'เธเธฒเธเธเธฅเธฒเธ (เธเนเธญเธกเธนเธฅเธชเธ–เธดเธ•เธดเธขเนเธญเธเธซเธฅเธฑเธ)'
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
   * Main Render Function for Tab: เธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเธเธณเน€เธเนเธฒ & เนเธเนเนเธเธเนเธญเธกเธนเธฅ
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
      if (textSpan) textSpan.textContent = 'เธเนเธญเธเน€เธเธทเนเธญเธเนเธเธชเธฃเธธเธเธเธฒเธฃเนเธชเธ”เธเธเธฅ (เธเธฅเธดเธเน€เธเธทเนเธญเธเธดเธ”)';
      if (icon) icon.innerHTML = '&#9650;';
      if (btn) {
        btn.style.background = 'rgba(14,165,233,0.24)';
        btn.style.borderColor = '#38BDF8';
        btn.style.boxShadow = '0 0 10px rgba(14,165,233,0.3)';
      }
    } else {
      box.style.display = 'none';
      if (textSpan) textSpan.textContent = 'เน€เธเธทเนเธญเธเนเธเธชเธฃเธธเธเธเธฒเธฃเนเธชเธ”เธ / เนเธกเนเนเธชเธ”เธเธเนเธญเธกเธนเธฅ (เธเธฅเธดเธเธ”เธน)';
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
      const lastEditTh = allLogs[0] ? allLogs[0].timestampTh : '17 เธ•.เธ. 2569, 08:15 เธ.';

    container.innerHTML = `
      <div class="data-history-wrapper">
        
        <!-- Header Banner & Top Stats -->
        <div class="dh-header-card">
          <div class="dh-header-info">
            <div class="dh-badge-pill">
              <span class="dh-pulse-dot"></span>
              <span>เธจเธนเธเธขเนเธเธฑเธเธ—เธถเธเธเธฃเธฐเธงเธฑเธ•เธดเธเนเธญเธกเธนเธฅ & เนเธซเธฅเนเธเธเธฑเธ”เน€เธเนเธ (Data Audit & Model View)</span>
            </div>
            <h2 class="dh-main-title">
              เธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเธเธณเน€เธเนเธฒเธเนเธญเธกเธนเธฅ เนเธซเธฅเนเธเธเธฑเธ”เน€เธเนเธ เนเธฅเธฐเธเธฑเธเธ—เธถเธเธเธฒเธฃเนเธเนเนเธเธเนเธญเธกเธนเธฅ
            </h2>
            <p class="dh-subtitle">
              เธ•เธฃเธงเธเธชเธญเธเธงเธฑเธ-เน€เธงเธฅเธฒเธ—เธตเนเธเธณเน€เธเนเธฒเนเธเธฅเนเธ•เนเธเธเธเธฑเธ Excel 01 - 06, เนเธซเธฅเนเธเธ—เธตเนเธ•เธฑเนเธเนเธเธฅเนเธเธฑเธ”เน€เธเนเธเธเนเธญเธกเธนเธฅเนเธเธฃเธฐเธเธ, เธเธฑเธเธ—เธถเธเธเธฒเธฃเน€เธเธฅเธตเนเธขเธเนเธเธฅเธ (Change Log), เนเธฅเธฐเธเธฑเธ Model View เธเธฒเธฃเน€เธเธทเนเธญเธกเนเธขเธเธเนเธญเธกเธนเธฅ
            </p>
          </div>
          <div class="dh-header-actions">
            <button class="btn btn-outline" id="btnDhAddManualLog" title="เธเธฑเธเธ—เธถเธเนเธเนเธ•เธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเนเธเนเนเธเธเนเธญเธกเธนเธฅเน€เธเธดเนเธกเน€เธ•เธดเธก">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>+ เธเธฑเธเธ—เธถเธเธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเนเธเนเนเธ</span>
            </button>
            <button class="btn btn-gold" onclick="document.getElementById('excelFileInput').click()" title="เธเธณเน€เธเนเธฒเนเธเธฅเน Excel เธญเธฑเธเน€เธ”เธ•เน€เธเนเธฒเธฃเธฐเธเธ">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>เธเธณเน€เธเนเธฒเนเธเธฅเนเนเธซเธกเน</span>
            </button>
          </div>
        </div>

        <!-- 4 Top KPI Stat Cards -->
        <div class="dh-stats-grid">
          <div class="dh-stat-card">
            <div class="dh-stat-icon" style="background:rgba(236,72,153,0.15); color:#F472B6;">๐“</div>
            <div class="dh-stat-body">
              <div class="dh-stat-val">${totalFiles} เนเธเธฅเนเธซเธฅเธฑเธ</div>
              <div class="dh-stat-label">เนเธเธฅเน Excel เธ•เนเธเธ—เธฒเธเธ—เธฑเนเธเธซเธกเธ” (01 - 06)</div>
              <div class="dh-stat-sub">เธฃเธฒเธขเธเธฒเธ AUC, KPI, WBS, SAP, CN41, เนเธเธเธเธฒเธ</div>
            </div>
          </div>

          <div class="dh-stat-card">
            <div class="dh-stat-icon" style="background:rgba(139,92,246,0.15); color:#A78BFA;">๐“…</div>
            <div class="dh-stat-body">
              <div class="dh-stat-val">27 เธ•.เธ. 2569</div>
              <div class="dh-stat-label">เธเธณเน€เธเนเธฒเธเนเธญเธกเธนเธฅ WBS เธเธเน€เธซเธฅเธทเธญเธฅเนเธฒเธชเธธเธ”</div>
              <div class="dh-stat-sub">2,083 เธฃเธฒเธขเธเธฒเธฃ WBS (เธเธชเธฒเธเนเธเธฅเน 03, 04, 05, 06)</div>
            </div>
          </div>

          <div class="dh-stat-card">
            <div class="dh-stat-icon" style="background:rgba(245,158,11,0.15); color:#FBBF24;">โ๏ธ</div>
            <div class="dh-stat-body">
              <div class="dh-stat-val">17 เธ•.เธ. 2569</div>
              <div class="dh-stat-label">เนเธเนเนเธเธเนเธญเธกเธนเธฅ / เธ•เธฑเธงเธเธฃเธญเธเธฅเนเธฒเธชเธธเธ”</div>
              <div class="dh-stat-sub">เนเธขเธ TECO เธเธฑเธ REL D1 & เธเธฑเธเธ—เธถเธ Checkbox</div>
            </div>
          </div>

          <div class="dh-stat-card">
            <div class="dh-stat-icon" style="background:rgba(16,185,129,0.15); color:#34D399;">๐’พ</div>
            <div class="dh-stat-body">
              <div class="dh-stat-val">${totalStorageFiles} เนเธซเธฅเนเธเธเธฑเธ”เน€เธเนเธ</div>
              <div class="dh-stat-label">เนเธเธฅเนเธเธฑเธ”เน€เธเนเธเนเธเธฃเธฐเธเธ (System Storage)</div>
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
            <span>เธเธฑเธเธเธฒเธฃเนเธซเธฅเธเธญเธเธเนเธญเธกเธนเธฅ & เนเธซเธฅเนเธเธเธฑเธ”เน€เธเนเธ (Model View & Storage Map)</span>
          </button>

          <button class="dh-view-tab-btn" data-dh-view="timeline-log" id="dhBtnViewTimelineLog">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>เธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเธเธณเน€เธเนเธฒเนเธฅเธฐเนเธเนเนเธเธเนเธญเธกเธนเธฅ (Timeline & Change Log)</span>
            <span class="dh-counter-badge">${allLogs.length} เธฃเธฒเธขเธเธฒเธฃ</span>
          </button>

          <button class="dh-view-tab-btn" data-dh-view="storage-files" id="dhBtnViewStorageFiles">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
            </svg>
            <span>เนเธเธฅเนเธ—เธตเนเธเธฑเธ”เน€เธเนเธเธเนเธญเธกเธนเธฅเนเธเธฃเธฐเธเธ (System Storage Inspector)</span>
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
                <span>เธเธฑเธเธเธณเธฅเธญเธเธชเธ–เธฒเธเธฑเธ•เธขเธเธฃเธฃเธก Model View เธเธฒเธฃเธเธณเน€เธเนเธฒ เธเธชเธฒเธ เนเธฅเธฐเธเธฑเธ”เน€เธเนเธเธเนเธญเธกเธนเธฅ</span>
              </div>
              <div class="dh-diagram-desc">เธเธฅเธดเธเธ—เธตเนเธเธฒเธฃเนเธ”เนเธเธฅเนเธซเธฃเธทเธญเธเธฅเนเธญเธเธเธฃเธฐเธกเธงเธฅเธเธฅเน€เธเธทเนเธญเน€เธเธดเธ”เธ”เธนเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เน€เธเธดเธเธฅเธถเธ (Model View Modal)</div>
            </div>

            <div class="dh-flow-container">
              
              <!-- Stage 1: Source Files -->
              <div class="dh-flow-stage">
                <div class="dh-stage-header">
                  <span class="dh-stage-num">1</span>
                  <span>เนเธเธฅเน Excel เธ•เนเธเธเธเธฑเธ (Source Files)</span>
                </div>
                <div class="dh-stage-cards">
                  <div class="dh-flow-node" onclick="window.openModelViewModal('src_03', 'source')">
                    <div class="dh-node-badge" style="background:#EC4899;">เนเธเธฅเน 03</div>
                    <div class="dh-node-title">WBS เธเธเน€เธซเธฅเธทเธญ (2,083 เธฃเธฒเธขเธเธฒเธฃ)</div>
                    <div class="dh-node-meta">เธเธณเน€เธเนเธฒ: 23 เธ•.เธ. 69 โ€ข 5.43 MB</div>
                  </div>
                  <div class="dh-flow-node" onclick="window.openModelViewModal('src_04', 'source')">
                    <div class="dh-node-badge" style="background:#8B5CF6;">เนเธเธฅเน 04</div>
                    <div class="dh-node-title">ZBUDR064 (%เธเธฑเธชเธ”เธธ/เธชเธ–เธฒเธเธฐ SAP)</div>
                    <div class="dh-node-meta">เธเธณเน€เธเนเธฒ: 27 เธ•.เธ. 69 โ€ข 732.0 KB</div>
                  </div>
                  <div class="dh-flow-node" onclick="window.openModelViewModal('src_06', 'source')">
                    <div class="dh-node-badge" style="background:#F59E0B;">เนเธเธฅเน 06</div>
                    <div class="dh-node-title">CN41 (เธกเธนเธฅเธเนเธฒ AUC เธเธฒเธ—)</div>
                    <div class="dh-node-meta">เธเธณเน€เธเนเธฒ: 27 เธ•.เธ. 69 โ€ข 337.8 KB</div>
                  </div>
                  <div class="dh-flow-node" onclick="window.openModelViewModal('src_07', 'source')">
                    <div class="dh-node-badge" style="background:#0EA5E9;">เนเธเธฅเน 07</div>
                    <div class="dh-node-title">CN52N เธเธฑเธชเธ”เธธ (Mvt 281 / เธฃเธซเธฑเธช 1*)</div>
                    <div class="dh-node-meta">เธเธณเน€เธเนเธฒ: 30 เธ•.เธ. 69 โ€ข 5.67 MB</div>
                  </div>
                  <div class="dh-flow-node" onclick="window.openModelViewModal('src_sheet', 'source')">
                    <div class="dh-node-badge" style="background:#10B981;">G-Sheet</div>
                    <div class="dh-node-title">Google Sheet (เนเธเธเธเธดเธ”เธเธฒเธ/เธซเธกเธฒเธขเน€เธซเธ•เธธ)</div>
                    <div class="dh-node-meta">เธเธดเธเธเน: 22 เธ•.เธ. 69 โ€ข Live API</div>
                  </div>
                  <div class="dh-flow-node" onclick="window.openModelViewModal('src_02', 'source')">
                    <div class="dh-node-badge" style="background:#3B82F6;">เนเธเธฅเน 02</div>
                    <div class="dh-node-title">KPI Matrix (เน€เธเธ“เธ‘เนเธงเธฑเธ” 8 เธเนเธญ)</div>
                    <div class="dh-node-meta">เธเธณเน€เธเนเธฒ: 3 เธ•.เธ. 69 โ€ข 17.4 KB</div>
                  </div>
                  <div class="dh-flow-node" onclick="window.openModelViewModal('src_01_aug', 'source')">
                    <div class="dh-node-badge" style="background:#6366F1;">เนเธเธฅเน 01</div>
                    <div class="dh-node-title">เธฃเธฒเธขเธเธฒเธ AUC เน€เธ”เธทเธญเธ เธช.เธ. (เธฅเนเธฒเธชเธธเธ”)</div>
                    <div class="dh-node-meta">เธเธณเน€เธเนเธฒ: 29 เธ.เธข. 69 โ€ข 50.2 KB</div>
                  </div>
                </div>
              </div>

              <!-- Arrow Connector 1 -->
              <div class="dh-flow-arrow">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
                <span>เธเธชเธฒเธ & Normalize</span>
              </div>

              <!-- Stage 2: Processing Engine -->
              <div class="dh-flow-stage">
                <div class="dh-stage-header">
                  <span class="dh-stage-num">2</span>
                  <span>เธฃเธฐเธเธเธเธฃเธฐเธกเธงเธฅเธเธฅ (Data Engine)</span>
                </div>
                <div class="dh-stage-cards">
                  <div class="dh-flow-node highlight">
                    <div class="dh-node-badge" style="background:var(--pea-gold-400); color:#000;">Merge Engine</div>
                    <div class="dh-node-title">Left Join เธ”เนเธงเธขเน€เธฅเธเธ—เธตเน WBS</div>
                    <div class="dh-node-meta">เธเธชเธฒเธเนเธเธฅเน 03+04+05+06 เน€เธเนเธ 41 เธเธญเธฅเธฑเธกเธเน</div>
                  </div>
                  <div class="dh-flow-node highlight">
                    <div class="dh-node-badge" style="background:#10B981; color:#fff;">Status Parser</div>
                    <div class="dh-node-title">เธเธฑเธ”เธเธฅเธธเนเธกเธชเธ–เธฒเธเธฐ SAP เธญเธฑเธเธเธฃเธดเธขเธฐ</div>
                    <div class="dh-node-meta">เนเธขเธ REL, TECO, CLSD เธขเนเธญเน€เธซเธฅเธทเธญ 2 เธญเธฑเธเธฉเธฃ</div>
                  </div>
                  <div class="dh-flow-node highlight">
                    <div class="dh-node-badge" style="background:#0EA5E9; color:#fff;">Material Filter</div>
                    <div class="dh-node-title">เธเธฃเธญเธ Mvt 281 / เธฃเธซเธฑเธชเธเธฑเธชเธ”เธธ 1*</div>
                    <div class="dh-node-meta">เธเธณเธเธงเธ“เธเนเธฒเธเน€เธเธดเธ &amp; เธเธนเธ WBS เนเธเธฅเน 03/04</div>
                  </div>
                  <div class="dh-flow-node highlight">
                    <div class="dh-node-badge" style="background:#3B82F6; color:#fff;">KPI Calculator</div>
                    <div class="dh-node-title">เธเธณเธเธงเธ“เธเธฐเนเธเธ KPI & Gap</div>
                    <div class="dh-node-meta">เธเธฃเธฐเน€เธกเธดเธเธเธฐเนเธเธเธชเธฐเธชเธก 20 เธเธเธ. เธฃเธฒเธขเน€เธ”เธทเธญเธ</div>
                  </div>
                </div>
              </div>

              <!-- Arrow Connector 2 -->
              <div class="dh-flow-arrow">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
                <span>เธเธฑเธ”เน€เธเนเธเธเนเธญเธกเธนเธฅ</span>
              </div>

              <!-- Stage 3: System Storage Files -->
              <div class="dh-flow-stage">
                <div class="dh-stage-header">
                  <span class="dh-stage-num">3</span>
                  <span>เนเธเธฅเนเธ—เธตเนเธเธฑเธ”เน€เธเนเธเธเนเธญเธกเธนเธฅเนเธเธฃเธฐเธเธ (Storage)</span>
                </div>
                <div class="dh-stage-cards">
                  <div class="dh-flow-node storage-node" onclick="window.openModelViewModal('src_03', 'source')">
                    <div class="dh-node-badge" style="background:#10B981;">js/data_wbs.js</div>
                    <div class="dh-node-title">window.AUC_WBS_REMAINING_DATA</div>
                    <div class="dh-node-meta">2,083 เธฃเธฒเธขเธเธฒเธฃ WBS โ€ข 2.32 MB</div>
                  </div>
                  <div class="dh-flow-node storage-node" onclick="window.openModelViewModal('src_01_aug', 'source')">
                    <div class="dh-node-badge" style="background:#6366F1;">js/data_aug.js</div>
                    <div class="dh-node-title">window.AUC_DATA_AUG (เธช.เธ.)</div>
                    <div class="dh-node-meta">368 เธฃเธฒเธขเธเธฒเธฃ โ€ข 372 KB</div>
                  </div>
                  <div class="dh-flow-node storage-node" onclick="window.openModelViewModal('src_02', 'source')">
                    <div class="dh-node-badge" style="background:#3B82F6;">js/kpi_matrix.js</div>
                    <div class="dh-node-title">window.KPI_MATRIX</div>
                    <div class="dh-node-meta">8 เน€เธเธ“เธ‘เนเธงเธฑเธ” โ€ข 12.5 KB</div>
                  </div>
                  <div class="dh-flow-node storage-node">
                    <div class="dh-node-badge" style="background:#EC4899;">localStorage</div>
                    <div class="dh-node-title">AUC_SAVED_KPI, Scenario, Cols</div>
                    <div class="dh-node-meta">เธเธฑเธเธ—เธถเธเน€เธเธฃเธทเนเธญเธเธเธนเนเนเธเน โ€ข Real-time</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- File Cards Grid (Model View Trigger Cards) -->
          <div class="dh-section-header">
            <h3 class="dh-section-title">
              <span>เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เนเธเธฅเนเธ•เนเธเธ—เธฒเธเนเธฅเธฐเนเธเธฅเนเธเธฑเธ”เน€เธเนเธเธเนเธญเธกเธนเธฅ (เธเธฅเธดเธเธ”เธน Model View)</span>
            </h3>
            <span class="dh-section-count">เธ—เธฑเนเธเธซเธกเธ” ${DATA_SOURCE_CATALOG.length} เนเธเธฅเนเธซเธฅเธฑเธ</span>
          </div>

          <div class="dh-cards-grid">
            ${DATA_SOURCE_CATALOG.map(file => `
              <div class="dh-file-card" onclick="window.openModelViewModal('${file.id}', 'source')">
                <div class="dh-file-card-top">
                  <div class="dh-file-badge" style="background:${file.badgeColor}22; color:${file.badgeColor}; border:1px solid ${file.badgeColor}44;">
                    <span>เนเธเธฅเน ${file.groupNo}</span>
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
                        <span>๐“</span>
                        <span id="btnToggleRulesText_${file.id}">เน€เธเธทเนเธญเธเนเธเธชเธฃเธธเธเธเธฒเธฃเนเธชเธ”เธ / เนเธกเนเนเธชเธ”เธเธเนเธญเธกเธนเธฅ (เธเธฅเธดเธเธ”เธน)</span>
                      </span>
                      <span id="iconToggleRules_${file.id}" style="font-size:0.75rem; transition:transform 0.2s ease;">โ–ผ</span>
                    </button>
                    <div id="rulesBox_${file.id}" class="dh-rules-hidden-box" style="display:none; margin-top:0.5rem;">
                      ${file.rulesHtml}
                    </div>
                  </div>
                ` : ''}

                <div class="dh-file-meta-list">
                  <div class="dh-meta-row">
                    <span class="dh-meta-label">๐“… เธงเธฑเธเธ—เธตเนเธเธณเน€เธเนเธฒเธเนเธญเธกเธนเธฅ:</span>
                    <span class="dh-meta-val">${file.importDateTh}</span>
                  </div>
                  <div class="dh-meta-row">
                    <span class="dh-meta-label">โ๏ธ เนเธเนเนเธเธฅเนเธฒเธชเธธเธ”:</span>
                    <span class="dh-meta-val highlight-gold">${file.lastModifiedTh}</span>
                  </div>
                  <div class="dh-meta-row">
                    <span class="dh-meta-label">๐’พ เนเธเธฅเนเธเธฑเธ”เน€เธเนเธเนเธเธฃเธฐเธเธ:</span>
                    <span class="dh-meta-val file-tag"><code>${file.storageFile}</code></span>
                  </div>
                  <div class="dh-meta-row">
                    <span class="dh-meta-label">๐“ เธเธณเธเธงเธเนเธ–เธง / เธเธเธฒเธ”:</span>
                    <span class="dh-meta-val">${file.recordCount.toLocaleString('th-TH')} เนเธ–เธง (${file.sizeText})</span>
                  </div>
                </div>

                <div class="dh-file-card-footer">
                  <button type="button" class="btn btn-sm btn-outline dh-btn-view-model" onclick="event.stopPropagation(); window.openModelViewModal('${file.id}', 'source')" style="cursor:pointer; width:100%; justify-content:center; padding:0.5rem 0.85rem; border-color:rgba(245,158,11,0.45); color:var(--pea-gold-400); font-weight:700;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <span>เธเธฅเธดเธเธ”เธน Model View &amp; เธ•เธฑเธงเธญเธขเนเธฒเธเธเนเธญเธกเธนเธฅ</span>
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
              <input type="text" id="dhLogSearchInput" placeholder="เธเนเธเธซเธฒเธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเธเธณเน€เธเนเธฒ / เนเธเนเนเธ / เธเธทเนเธญเนเธเธฅเน / เธชเธดเนเธเธ—เธตเนเนเธเนเนเธ..." />
            </div>

            <div class="dh-filter-group">
              <label>เธเธฃเธฐเน€เธ เธ—เธเธฃเธฐเธงเธฑเธ•เธด:</label>
              <select id="dhLogTypeFilter" class="form-select">
                <option value="ALL">เธ—เธฑเนเธเธซเธกเธ”เธ—เธธเธเธเธฃเธฐเน€เธ เธ—</option>
                <option value="EDIT">โ๏ธ เธเธฒเธฃเนเธเนเนเธเธเนเธญเธกเธนเธฅ (Data Modification)</option>
                <option value="IMPORT">๐“ฅ เธเธฒเธฃเธเธณเน€เธเนเธฒเธเนเธญเธกเธนเธฅ (Data Import)</option>
                <option value="MERGE">๐” เธเธฒเธฃเธเธชเธฒเธเธฃเธงเธกเนเธเธฅเน (Data Merge)</option>
                <option value="CONFIG">โ๏ธ เธเธฒเธฃเธ•เธฑเนเธเธเนเธฒเธฃเธฐเธเธ (Configuration)</option>
              </select>
            </div>

            <div class="dh-toolbar-stats">
              เนเธชเธ”เธ <strong id="dhVisibleLogCount">${allLogs.length}</strong> เธเธฒเธ ${allLogs.length} เธฃเธฒเธขเธเธฒเธฃ
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
                <span>เธ•เธฒเธฃเธฒเธเนเธเธฅเนเธ—เธตเนเธเธฑเธ”เน€เธเนเธเธเนเธญเธกเธนเธฅเนเธเธฃเธฐเธเธ (System Storage Files Location)</span>
              </div>
              <div style="font-size:0.8rem; color:var(--text-muted);">
                เนเธเธฃเธเธชเธฃเนเธฒเธเนเธเธฅเน JavaScript เธ เธฒเธขเนเธเนเธเธฅเน€เธ”เธญเธฃเน <code style="color:var(--pea-gold-400);">js/</code> เนเธฅเธฐเธซเธเนเธงเธขเธเธงเธฒเธกเธเธณ LocalStorage
              </div>
            </div>

            <div class="table-responsive">
              <table class="data-table dh-storage-table">
                <thead>
                  <tr>
                    <th style="width:50px; text-align:center;">เธฅเธณเธ”เธฑเธ</th>
                    <th style="min-width:220px;">เนเธเธฅเนเธ—เธตเนเธเธฑเธ”เน€เธเนเธเธเนเธญเธกเธนเธฅ (File Path)</th>
                    <th style="min-width:240px;">เธซเธเนเธฒเธ—เธตเน & เธเนเธญเธกเธนเธฅเธ—เธตเนเธเธฑเธ”เน€เธเนเธ</th>
                    <th style="min-width:180px;">เธ•เธฑเธงเนเธเธฃเนเธเธฃเธฐเธเธ (Variable)</th>
                    <th style="min-width:140px; text-align:center;">เธเธณเธเธงเธเธเนเธญเธกเธนเธฅ</th>
                    <th style="min-width:100px; text-align:center;">เธเธเธฒเธ”</th>
                    <th style="min-width:150px; text-align:center;">เนเธเนเนเธเธฅเนเธฒเธชเธธเธ”</th>
                    <th style="min-width:130px; text-align:center;">เธชเธ–เธฒเธเธฐ</th>
                    <th style="min-width:100px; text-align:center;">เธเธฒเธฃเธเธฑเธ”เธเธฒเธฃ</th>
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
                        <button class="btn btn-sm btn-outline" onclick="window.copyTextToClipboard('${f.path}', 'เธเธฑเธ”เธฅเธญเธเธเธฒเธเนเธเธฅเน ${f.path} เธชเธณเน€เธฃเนเธ')" title="เธเธฑเธ”เธฅเธญเธ Path เนเธเธฅเน">
                          ๐“ เธเธฑเธ”เธฅเธญเธ
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
            <h3 style="color:#F87171;">เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เนเธเธเธฒเธฃเนเธซเธฅเธ”เธซเธเนเธฒเธเธฃเธฐเธงเธฑเธ•เธด</h3>
            <p style="color:#CBD5E1; font-family:monospace; margin-top:0.5rem;">${escapeHtml(err.message)}</p>
            <button class="btn btn-primary" onclick="window.renderDataHistoryTab()" style="margin-top:1rem;">เธฅเธญเธเนเธซเธกเนเธญเธตเธเธเธฃเธฑเนเธ</button>
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
          <div>เนเธกเนเธเธเธฃเธฒเธขเธเธฒเธฃเธเธฃเธฐเธงเธฑเธ•เธดเธ—เธตเนเธ•เธฃเธเธเธฑเธเน€เธเธทเนเธญเธเนเธเธเนเธเธซเธฒ</div>
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
                <span class="dh-author-badge">๐‘ค ${escapeHtml(log.author || 'เธฃเธฐเธเธ')}</span>
              </div>
            </div>

            <h4 class="dh-tl-title">${escapeHtml(log.title)}</h4>

            <div class="dh-tl-summary-box">
              <div class="dh-summary-row">
                <span class="dh-summary-label">๐ฏ เธชเธดเนเธเธ—เธตเนเนเธเนเนเธ / เธเธณเน€เธเนเธฒ:</span>
                <span class="dh-summary-content">${escapeHtml(log.changeSummary)}</span>
              </div>
              <div class="dh-summary-row">
                <span class="dh-summary-label">๐’พ เนเธเธฅเนเธ—เธตเนเธเธฑเธ”เน€เธเนเธเธเนเธญเธกเธนเธฅ:</span>
                <span class="dh-summary-file"><code>${escapeHtml(log.storageFile)}</code></span>
              </div>
              ${log.sourceFile ? `
                <div class="dh-summary-row">
                  <span class="dh-summary-label">๐“ เนเธเธฅเนเธ•เนเธเธเธเธฑเธ:</span>
                  <span class="dh-summary-src">${escapeHtml(log.sourceFile)}</span>
                </div>
              ` : ''}
            </div>

            ${log.details ? `
              <div class="dh-tl-details-text">
                <strong>เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เน€เธเธดเธเธฅเธถเธ:</strong> ${escapeHtml(log.details)}
              </div>
            ` : ''}

            <div class="dh-tl-footer">
              <span class="dh-impact-pill">เธเธฅเธเธฃเธฐเธ—เธ: ${escapeHtml(log.impactLevel || 'เธเนเธญเธกเธนเธฅเนเธ”เนเธฃเธฑเธเธเธฒเธฃเธญเธฑเธเน€เธ”เธ•')}</span>
              <button class="btn btn-sm btn-outline dh-btn-model-trigger" onclick="window.openModelViewModal('${log.id}', 'log')">
                ๐” เธ”เธน Model View เธฃเธฒเธขเธเธฒเธฃเธเธตเน
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
              <div class="dh-model-badge-top">MODEL VIEW โ€ข เนเธซเธฅเนเธเธเนเธญเธกเธนเธฅเธเธฅเธธเนเธก ${file.groupNo}</div>
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
              <div class="dh-mb-label">๐“… เธงเธฑเธเธ—เธตเนเธเธณเน€เธเนเธฒเธเนเธญเธกเธนเธฅ</div>
              <div class="dh-mb-val">${file.importDateTh}</div>
            </div>
            <div class="dh-meta-box">
              <div class="dh-mb-label">โ๏ธ เนเธเนเนเธเธเนเธญเธกเธนเธฅเธฅเนเธฒเธชเธธเธ”</div>
              <div class="dh-mb-val highlight-gold">${file.lastModifiedTh}</div>
            </div>
            <div class="dh-meta-box">
              <div class="dh-mb-label">๐’พ เนเธเธฅเนเธ—เธตเนเธเธฑเธ”เน€เธเนเธเธเนเธญเธกเธนเธฅเนเธเธฃเธฐเธเธ</div>
              <div class="dh-mb-val"><code>${file.storageFile}</code></div>
            </div>
            <div class="dh-meta-box">
              <div class="dh-mb-label">๐“ เธเธณเธเธงเธเธเนเธญเธกเธนเธฅ / เธเธเธฒเธ”</div>
              <div class="dh-mb-val">${file.recordCount.toLocaleString('th-TH')} เธฃเธฒเธขเธเธฒเธฃ (${file.sizeText})</div>
            </div>
          </div>

          <!-- Description Box -->
          <div class="dh-model-desc-box">
            <div class="dh-box-title">๐“ เธเธณเธญเธเธดเธเธฒเธขเธเธ—เธเธฒเธ—เนเธฅเธฐเธเนเธญเธกเธนเธฅเนเธเนเธเธฅเน:</div>
            <p>${escapeHtml(file.description)}</p>
            <div class="dh-var-mapping">
              <strong>เธ•เธฑเธงเนเธเธฃเธเธฑเธ”เน€เธเนเธเนเธเธฃเธฐเธเธ:</strong> <code>${escapeHtml(file.storageVar)}</code>
            </div>

          ${file.rulesHtml ? `
            <div class="dh-model-rules-box" style="margin-top:1rem; padding:0.85rem 1rem; background:rgba(14,165,233,0.08); border:1px solid rgba(14,165,233,0.3); border-radius:10px;">
              <div class="dh-box-title" style="color:#38BDF8; font-weight:700; margin-bottom:0.5rem; display:flex; align-items:center; gap:0.4rem;">
                <span>๐“ เธชเธฃเธธเธเน€เธเธทเนเธญเธเนเธเธเธฒเธฃเธเธฃเธฐเธกเธงเธฅเธเธฅ (เนเธชเธ”เธ / เนเธกเนเนเธชเธ”เธ เธเนเธญเธกเธนเธฅ):</span>
              </div>
              ${file.rulesHtml}
            </div>
          ` : ''}
          </div>

          <!-- Mapped Columns Structure -->
          <div style="margin-top:1rem;">
            <div class="dh-box-title">๐ท๏ธ เนเธเธฃเธเธชเธฃเนเธฒเธเธเธญเธฅเธฑเธกเธเนเธชเธณเธเธฑเธเธ—เธตเนเธเธชเธฒเธเน€เธเนเธฒเธฃเธฐเธเธ (${file.columns.length} เธเธดเธฅเธ”เน):</div>
            <div class="dh-columns-pill-container">
              ${file.columns.map(col => `<span class="dh-col-pill">${escapeHtml(col)}</span>`).join('')}
            </div>
          </div>

          <!-- Live Sample Data Preview Table -->
          <div style="margin-top:1.25rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
              <div class="dh-box-title" style="margin:0;">
                ๐‘€ เธ•เธฑเธงเธญเธขเนเธฒเธเธเนเธญเธกเธนเธฅเธเธฃเธดเธเธ—เธตเนเนเธซเธฅเธ”เธญเธขเธนเนเนเธเธฃเธฐเธเธ (Live Data Preview 5 เธฃเธฒเธขเธเธฒเธฃเนเธฃเธ):
              </div>
              <span style="font-size:0.75rem; color:var(--text-muted);">เธญเนเธฒเธเธ•เธฃเธเธเธฒเธเธ•เธฑเธงเนเธเธฃเธซเธเนเธงเธขเธเธงเธฒเธกเธเธณ</span>
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
                  เนเธกเนเธกเธตเธ•เธฑเธงเธญเธขเนเธฒเธเธเนเธญเธกเธนเธฅเนเธชเธ”เธเธเธฅ
                </div>
              `}
            </div>
          </div>

        </div>

        <div class="modal-footer dh-model-footer">
          <button class="btn btn-outline" onclick="window.copyTextToClipboard('${file.storageFile}', 'เธเธฑเธ”เธฅเธญเธเธ•เธณเนเธซเธเนเธเธเธฑเธ”เน€เธเนเธเธชเธณเน€เธฃเนเธ')">
            ๐“ เธเธฑเธ”เธฅเธญเธเธ•เธณเนเธซเธเนเธเนเธเธฅเนเธเธฑเธ”เน€เธเนเธ
          </button>
          <button class="btn btn-primary" onclick="window.closeDhModelModal()">เธเธดเธ”เธซเธเนเธฒเธ•เนเธฒเธ Model View</button>
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
              <div class="dh-model-badge-top">AUDIT LOG MODEL VIEW โ€ข เธฃเธซเธฑเธชเธเธฃเธฐเธงเธฑเธ•เธด ${log.id}</div>
              <h3 class="dh-model-title">${escapeHtml(log.title)}</h3>
              <div class="dh-model-cat">${escapeHtml(log.typeBadge || log.type)}</div>
            </div>
          </div>
          <button class="modal-btn-close" onclick="window.closeDhModelModal()">โ•</button>
        </div>

        <div class="modal-body dh-model-body">
          <div class="dh-model-meta-grid">
            <div class="dh-meta-box">
              <div class="dh-mb-label">๐•’ เธงเธฑเธ-เน€เธงเธฅเธฒเธ—เธตเนเธกเธตเธเธฒเธฃเธ”เธณเน€เธเธดเธเธเธฒเธฃ</div>
              <div class="dh-mb-val highlight-gold">${log.timestampTh}</div>
            </div>
            <div class="dh-meta-box">
              <div class="dh-mb-label">๐‘ค เธเธนเนเธ”เธณเน€เธเธดเธเธเธฒเธฃ / เธฃเธฐเธเธ</div>
              <div class="dh-mb-val">${escapeHtml(log.author || 'เธฃเธฐเธเธ')}</div>
            </div>
            <div class="dh-meta-box">
              <div class="dh-mb-label">๐’พ เนเธเธฅเนเธ—เธตเนเธเธฑเธ”เน€เธเนเธเธเนเธญเธกเธนเธฅ</div>
              <div class="dh-mb-val"><code>${escapeHtml(log.storageFile)}</code></div>
            </div>
            <div class="dh-meta-box">
              <div class="dh-mb-label">๐“ เนเธเธฅเนเธ•เนเธเธเธเธฑเธเธ—เธตเนเน€เธเธตเนเธขเธงเธเนเธญเธ</div>
              <div class="dh-mb-val">${escapeHtml(log.sourceFile || '-')}</div>
            </div>
          </div>

          <div class="dh-model-desc-box" style="margin-top:1rem;">
            <div class="dh-box-title">๐ฏ เธชเธฃเธธเธเธฃเธฒเธขเธเธฒเธฃเธชเธดเนเธเธ—เธตเนเนเธเนเนเธ / เธเธณเน€เธเนเธฒ:</div>
            <p style="font-size:0.95rem; font-weight:600; color:var(--text-main); margin-bottom:0.75rem;">
              ${escapeHtml(log.changeSummary)}
            </p>

            <div class="dh-box-title" style="margin-top:0.75rem;">๐” เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เน€เธเธดเธเธฅเธถเธ:</div>
            <p style="color:var(--text-muted); line-height:1.6;">${escapeHtml(log.details)}</p>
          </div>

          <div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); border-radius:8px; padding:0.85rem; margin-top:1rem;">
            <div style="font-size:0.8rem; font-weight:700; color:#34D399; margin-bottom:0.25rem;">
              ๐ก๏ธ เธเธฅเธเธฃเธฐเธ—เธเนเธฅเธฐเธเธฒเธฃเธ•เธฃเธงเธเธชเธญเธเธเธงเธฒเธกเธชเธกเธเธนเธฃเธ“เน:
            </div>
            <div style="font-size:0.85rem; color:var(--text-main);">
              ${escapeHtml(log.impactLevel || 'เธเนเธญเธกเธนเธฅเนเธ”เนเธฃเธฑเธเธเธฒเธฃเธเธฑเธเธ—เธถเธเนเธฅเธฐเธ•เธฃเธงเธเธชเธญเธเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง')}
            </div>
          </div>
        </div>

        <div class="modal-footer dh-model-footer">
          <button class="btn btn-outline" onclick="window.copyTextToClipboard('${log.storageFile}', 'เธเธฑเธ”เธฅเธญเธเธ•เธณเนเธซเธเนเธเธเธฑเธ”เน€เธเนเธเธชเธณเน€เธฃเนเธ')">
            ๐“ เธเธฑเธ”เธฅเธญเธเธ•เธณเนเธซเธเนเธเนเธเธฅเนเธเธฑเธ”เน€เธเนเธ
          </button>
          <button class="btn btn-primary" onclick="window.closeDhModelModal()">เธเธดเธ”เธซเธเนเธฒเธ•เนเธฒเธ Model View</button>
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
      if (window.showToast) window.showToast('เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธซเธฑเธงเธเนเธญเนเธฅเธฐเธชเธฃเธธเธเธชเธดเนเธเธ—เธตเนเนเธเนเนเธ', 'warning');
      return;
    }

    const now = new Date();
    const monthsTh = ['เธก.เธ.', 'เธ.เธ.', 'เธกเธต.เธ.', 'เน€เธก.เธข.', 'เธ.เธ.', 'เธกเธด.เธข.', 'เธ.เธ.', 'เธช.เธ.', 'เธ.เธข.', 'เธ•.เธ.', 'เธ.เธข.', 'เธ.เธ.'];
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} เธ.`;
    const dateStr = `${now.getDate()} ${monthsTh[now.getMonth()]} ${now.getFullYear() + 543}, ${timeStr}`;

    const typeBadges = {
      EDIT: 'เนเธเนเนเธเธเนเธญเธกเธนเธฅ',
      IMPORT: 'เธเธณเน€เธเนเธฒเธเนเธญเธกเธนเธฅ',
      MERGE: 'เธเธชเธฒเธเธฃเธงเธกเนเธเธฅเน',
      CONFIG: 'เธ•เธฑเนเธเธเนเธฒเธฃเธฐเธเธ'
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
      sourceFile: 'เธเธฑเธเธ—เธถเธเธ”เนเธงเธขเธ•เธเน€เธญเธเธเนเธฒเธเนเธ”เธเธเธญเธฃเนเธ”',
      author: author || 'เธเธนเนเนเธเนเธเธฒเธ',
      impactLevel: 'เธเธฑเธเธ—เธถเธเธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเนเธเนเนเธเธเนเธญเธกเธนเธฅเน€เธฃเธตเธขเธเธฃเนเธญเธข'
    };

    if (saveCustomLog(newLog)) {
      window.closeDhAddLogModal();
      if (window.showToast) window.showToast('เธเธฑเธเธ—เธถเธเธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเนเธเนเนเธเธเนเธญเธกเธนเธฅเธชเธณเน€เธฃเนเธ', 'success');
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
    const monthsTh = ['เธก.เธ.', 'เธ.เธ.', 'เธกเธต.เธ.', 'เน€เธก.เธข.', 'เธ.เธ.', 'เธกเธด.เธข.', 'เธ.เธ.', 'เธช.เธ.', 'เธ.เธข.', 'เธ•.เธ.', 'เธ.เธข.', 'เธ.เธ.'];
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} เธ.`;
    const dateStr = `${now.getDate()} ${monthsTh[now.getMonth()]} ${now.getFullYear() + 543}, ${timeStr}`;

    const newLog = {
      id: 'log_live_' + Date.now(),
      timestamp: now.toISOString(),
      timestampTh: dateStr,
      type: 'IMPORT',
      typeBadge: 'เธเธณเน€เธเนเธฒเนเธเธฅเนเนเธซเธกเน',
      badgeClass: 'badge-type-import',
      title: `เธเธณเน€เธเนเธฒเนเธเธฅเน ${fileName} เธชเธนเนเธฃเธฐเธเธเน€เธฃเธตเธขเธเธฃเนเธญเธข`,
      targetSubject: fileName,
      storageFile: storageFile || 'js/data_wbs.js',
      changeSummary: `เธญเนเธฒเธเธเนเธญเธกเธนเธฅเธเธฒเธเนเธเธฅเน ${fileName} เธชเธณเน€เธฃเนเธ ${recordCount ? recordCount.toLocaleString('th-TH') + ' เธฃเธฒเธขเธเธฒเธฃ' : ''}`,
      details: `เนเธเธฅเน ${fileName} เธ–เธนเธเธญเธฑเธเนเธซเธฅเธ”เธเนเธฒเธเธซเธเนเธฒเน€เธงเนเธเนเธฅเธฐเธเธฑเธเธ—เธถเธเธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเธเธณเน€เธเนเธฒเนเธเธฃเธฐเธเธเธญเธฑเธ•เนเธเธกเธฑเธ•เธด`,
      sourceFile: fileName,
      author: 'เธเธนเนเธเธณเน€เธเนเธฒเธเนเธญเธกเธนเธฅเธเนเธฒเธเธซเธเนเธฒเน€เธงเนเธ',
      impactLevel: 'เธเนเธญเธกเธนเธฅเนเธเธฃเธฐเธเธเนเธ”เนเธฃเธฑเธเธเธฒเธฃเธญเธฑเธเน€เธ”เธ•เน€เธเนเธเธเธธเธ”เธเนเธญเธกเธนเธฅเธฅเนเธฒเธชเธธเธ”'
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
