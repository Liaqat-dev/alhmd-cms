const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const {
  NAVY, NAVY_MID, NAVY_LIGHT, SLATE, GRAY, GRAY_LIGHT, GRAY_BG, WHITE,
  RED, GREEN, ORANGE, AMBER_BG, AMBER_BD, AMBER_TXT, EMERALD_BG, ROSE_BG, ACCENT,
  INSTITUTE_NAME, INSTITUTE_TAG,
} = require('../config/constants');

const LOGO_PATH = path.join(__dirname, '../../public/assets/LOGO.png');

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(amount) {
  const num = Number(amount) || 0;
  return 'Rs. ' + num.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDate(date) {
  if (!date) return '\u2014';
  const d = new Date(date);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(d.getDate()).padStart(2,'0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

function monthName(month) {
  const months = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];
  return months[month - 1] || '';
}

function statusColor(status) {
  switch (status) {
    case 'PAID':    return GREEN;
    case 'UNPAID':  return RED;
    case 'OVERDUE': return RED;
    case 'PARTIAL': return ORANGE;
    default:        return GRAY;
  }
}

function statusBg(status) {
  switch (status) {
    case 'PAID':    return EMERALD_BG;
    case 'UNPAID':  return ROSE_BG;
    case 'OVERDUE': return ROSE_BG;
    case 'PARTIAL': return AMBER_BG;
    default:        return GRAY_BG;
  }
}

// ── Draw rounded rect helper ───────────────────────────────────────────────────
function roundedRect(doc, x, y, w, h, r) {
  doc.moveTo(x + r, y)
    .lineTo(x + w - r, y)
    .quadraticCurveTo(x + w, y, x + w, y + r)
    .lineTo(x + w, y + h - r)
    .quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    .lineTo(x + r, y + h)
    .quadraticCurveTo(x, y + h, x, y + h - r)
    .lineTo(x, y + r)
    .quadraticCurveTo(x, y, x + r, y);
}

// ── Single Challan Copy ────────────────────────────────────────────────────────

function drawChallanCopy(doc, challan, x, y, colWidth, copyLabel, paymentInfo) {
  const pad = 18;
  const ix  = x + pad;          // inner x
  const iw  = colWidth - pad * 2; // inner width
  let cy    = y + 12;            // current y cursor

  // ────── Outer card border (subtle rounded rect) ──────
  doc.save();
  doc.lineWidth(0.75).strokeColor(GRAY_LIGHT);
  doc.roundedRect(x + 6, y + 4, colWidth - 12, 540, 8).stroke();
  doc.restore();

  // ────── Header band ──────
  doc.save();
  doc.rect(ix - 2, cy, iw + 4, 56).fill(NAVY);
  doc.restore();

  const logoExists = fs.existsSync(LOGO_PATH);
  const logoSize = 38;

  if (logoExists) {
    // White circle behind logo
    doc.save();
    doc.circle(ix + 12 + logoSize / 2, cy + 28, logoSize / 2 + 3).fill(WHITE);
    doc.restore();
    doc.image(LOGO_PATH, ix + 12, cy + 9, { width: logoSize, height: logoSize });
  }

  const htx = logoExists ? ix + logoSize + 24 : ix + 12;
  doc.font('Helvetica-Bold').fontSize(13).fillColor(WHITE);
  doc.text(INSTITUTE_NAME, htx, cy + 12, { width: iw - (htx - ix) - 8 });
  doc.font('Helvetica').fontSize(7.5).fillColor(ACCENT);
  doc.text(INSTITUTE_TAG, htx, cy + 28, { width: iw - (htx - ix) - 8 });

  cy += 62;

  // ────── "FEE CHALLAN" title pill ──────
  const pillW = 110;
  const pillH = 20;
  const pillX = ix + (iw - pillW) / 2;
  doc.save();
  doc.roundedRect(pillX, cy, pillW, pillH, 10).fill(NAVY);
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(WHITE);
  doc.text('FEE CHALLAN', pillX, cy + 5, { width: pillW, align: 'center' });
  doc.restore();

  cy += 28;

  // ────── Challan meta row ──────
  // Challan # left, status badge right
  doc.font('Helvetica').fontSize(7.5).fillColor(SLATE);
  doc.text('Challan No.', ix, cy);
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(NAVY);
  doc.text(challan.challanNumber, ix + 55, cy);

  // Status badge
  const st = challan.status;
  const stW = doc.widthOfString(st) + 18;
  const stX = ix + iw - stW;
  doc.save();
  doc.roundedRect(stX, cy - 2, stW, 15, 7.5).fill(statusBg(st));
  doc.roundedRect(stX, cy - 2, stW, 15, 7.5).lineWidth(0.5).strokeColor(statusColor(st)).stroke();
  doc.font('Helvetica-Bold').fontSize(7).fillColor(statusColor(st));
  doc.text(st, stX, cy + 1.5, { width: stW, align: 'center' });
  doc.restore();

  cy += 18;

  // Date row
  doc.font('Helvetica').fontSize(7.5).fillColor(GRAY);
  doc.text(`Month: ${monthName(challan.month)} ${challan.year}`, ix, cy);
  doc.text(`Due: ${fmtDate(challan.dueDate)}`, ix + iw / 2, cy);
  cy += 12;
  doc.text(`Issued: ${fmtDate(challan.issueDate)}`, ix, cy);
  if (challan.paidDate) {
    doc.text(`Paid: ${fmtDate(challan.paidDate)}`, ix + iw / 2, cy);
  }
  cy += 18;

  // ────── Student info section ──────
  // Section header
  doc.save();
  doc.rect(ix, cy, iw, 16).fill(GRAY_BG);
  doc.font('Helvetica-Bold').fontSize(7).fillColor(SLATE);
  doc.text('STUDENT INFORMATION', ix + 8, cy + 4);
  doc.restore();
  cy += 20;

  const studentName = challan.student?.name || '\u2014';
  const fatherName  = challan.student?.fatherName || '\u2014';
  const rollNumber  = challan.student?.rollNumber || '\u2014';
  const className   = challan.student?.class?.name || '\u2014';

  const lw = 75;
  const vx = ix + lw;

  const infoRow = (label, value) => {
    doc.font('Helvetica').fontSize(7.5).fillColor(GRAY);
    doc.text(label, ix + 4, cy);
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(NAVY);
    doc.text(value, vx, cy, { width: iw - lw });
    cy += 13;
  };

  infoRow('Student Name', studentName);
  infoRow('Father Name', fatherName);
  infoRow('Roll Number', rollNumber);
  infoRow('Class', className);

  cy += 4;

  // ────── Fee breakdown table ──────
  // Section header
  doc.save();
  doc.rect(ix, cy, iw, 16).fill(GRAY_BG);
  doc.font('Helvetica-Bold').fontSize(7).fillColor(SLATE);
  doc.text('FEE BREAKDOWN', ix + 8, cy + 4);
  doc.restore();
  cy += 20;

  // Table header
  doc.save();
  doc.rect(ix, cy, iw, 15).fill(NAVY);
  doc.font('Helvetica-Bold').fontSize(7).fillColor(WHITE);
  doc.text('Description', ix + 8, cy + 4, { width: iw * 0.6 });
  doc.text('Amount', ix + iw * 0.6, cy + 4, { width: iw * 0.4 - 8, align: 'right' });
  doc.restore();
  cy += 15;

  // Fee rows
  const feeRow = (label, amount, highlight) => {
    if (highlight) {
      doc.rect(ix, cy, iw, 16).fill(GRAY_BG);
    }
    doc.font('Helvetica').fontSize(7.5).fillColor(SLATE);
    doc.text(label, ix + 8, cy + 4, { width: iw * 0.6 });
    doc.font('Helvetica').fontSize(7.5).fillColor(NAVY);
    doc.text(fmt(amount), ix + iw * 0.6, cy + 4, { width: iw * 0.4 - 8, align: 'right' });
    cy += 16;
  };

  feeRow('Monthly Tuition Fee', challan.monthlyFee, false);

  // Admission Fee line (own line item)
  const admissionFeeTotal = (challan.expenses || [])
    .filter(e => e.type === 'ADMISSION_FEE')
    .reduce((s, e) => s + Number(e.amount), 0);
  if (admissionFeeTotal > 0) feeRow('Admission Fee', admissionFeeTotal, true);

  // Misc. Fee — BAG, UNIFORM, BOOKS, MISC_FEE, OTHER all merged
  const miscFeeTotal = (challan.expenses || [])
    .filter(e => e.type !== 'ADMISSION_FEE')
    .reduce((s, e) => s + Number(e.amount), 0);
  if (miscFeeTotal > 0) feeRow('Misc. Fee', miscFeeTotal, false);

  feeRow('Previous Arrears', challan.arrears, true);
  feeRow('Late Fee', challan.lateFee, false);
  feeRow('Discount', challan.discount, true);

  // Total row
  cy += 2;
  doc.save();
  doc.roundedRect(ix, cy, iw, 20, 4).fill(NAVY);
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(WHITE);
  doc.text('TOTAL PAYABLE', ix + 8, cy + 5, { width: iw * 0.55 });
  doc.font('Helvetica-Bold').fontSize(9).fillColor(ACCENT);
  doc.text(fmt(challan.totalAmount), ix + iw * 0.55, cy + 5, { width: iw * 0.45 - 8, align: 'right' });
  doc.restore();
  cy += 26;

  // Paid & Balance
  const balance = Number(challan.totalAmount) - Number(challan.paidAmount);

  doc.font('Helvetica').fontSize(7.5).fillColor(SLATE);
  doc.text('Amount Paid', ix + 8, cy);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(GREEN);
  doc.text(fmt(challan.paidAmount), ix + iw * 0.55, cy, { width: iw * 0.45 - 8, align: 'right' });
  cy += 14;

  doc.font('Helvetica').fontSize(7.5).fillColor(SLATE);
  doc.text('Balance Due', ix + 8, cy);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(balance > 0 ? RED : GREEN);
  doc.text(fmt(balance), ix + iw * 0.55, cy, { width: iw * 0.45 - 8, align: 'right' });
  cy += 18;

  // ────── Bank details box ──────
  const bh = 54;
  doc.save();
  doc.roundedRect(ix, cy, iw, bh, 6).fill(AMBER_BG);
  doc.roundedRect(ix, cy, iw, bh, 6).lineWidth(0.5).strokeColor(AMBER_BD).stroke();
  doc.restore();

  doc.font('Helvetica-Bold').fontSize(7).fillColor(AMBER_TXT);
  doc.text('BANK PAYMENT DETAILS', ix + 8, cy + 6);

  let by = cy + 18;
  const blx = ix + 8;
  const bvx = ix + 80;

  const bankRow = (label, value) => {
    doc.font('Helvetica').fontSize(7).fillColor(GRAY);
    doc.text(label, blx, by);
    doc.font('Helvetica-Bold').fontSize(7).fillColor(NAVY);
    doc.text(value, bvx, by, { width: iw - 88 });
    by += 11;
  };

  if (paymentInfo) {
    bankRow('Account Title', paymentInfo.accountTitle);
    bankRow('Account No.', paymentInfo.accountNumber);
    bankRow('Bank', paymentInfo.bankName);
  } else {
    doc.font('Helvetica').fontSize(7).fillColor(GRAY);
    doc.text('Contact the administration for payment details.', blx, by, { width: iw - 16 });
  }

  cy += bh + 8;

  // ────── Remarks ──────
  doc.font('Helvetica').fontSize(6.5).fillColor(GRAY);
  doc.text('Remarks: ' + (challan.remarks || '\u2014'), ix + 4, cy, { width: iw - 8 });
  cy += 14;

  // ────── Signature ──────
  doc.save();
  doc.moveTo(ix + iw * 0.5, cy).lineTo(ix + iw - 4, cy).lineWidth(0.5).strokeColor(GRAY_LIGHT).stroke();
  doc.restore();
  cy += 5;
  doc.font('Helvetica').fontSize(6.5).fillColor(GRAY);
  doc.text('Authorized Signature', ix + iw * 0.5, cy, { width: iw * 0.5 - 4, align: 'center' });
  cy += 14;

  // ────── Copy label ──────
  doc.save();
  const lblW = 90;
  const lblX = ix + (iw - lblW) / 2;
  doc.roundedRect(lblX, cy, lblW, 16, 8).fill(GRAY_BG);
  doc.font('Helvetica-Bold').fontSize(7).fillColor(SLATE);
  doc.text(copyLabel, lblX, cy + 4, { width: lblW, align: 'center' });
  doc.restore();
}

// ── Main PDF Generator ─────────────────────────────────────────────────────────

function generateChallanPDF(challanData, outputStream, paymentInfo) {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { top: 20, bottom: 20, left: 20, right: 20 }
  });

  doc.pipe(outputStream);

  const pageWidth  = 842;
  const pageHeight = 595;
  const colWidth   = (pageWidth - 40) / 2;

  // ── Outer page border ──
  doc.save();
  doc.roundedRect(10, 10, pageWidth - 20, pageHeight - 20, 6)
    .lineWidth(1).strokeColor(NAVY);
  doc.stroke();
  doc.restore();

  // ── Thin accent line at very top ──
  doc.save();
  doc.rect(10, 10, pageWidth - 20, 3).fill(ACCENT);
  doc.restore();

  // ── Dashed center divider ──
  const centerX = pageWidth / 2;
  doc.save();
  doc.strokeColor(GRAY_LIGHT).lineWidth(0.75).dash(4, { space: 3 });
  doc.moveTo(centerX, 22).lineTo(centerX, pageHeight - 18).stroke();
  doc.restore();

  // Scissor icon hint at top of divider
  doc.font('Helvetica').fontSize(7).fillColor(GRAY);
  doc.text('\u2702', centerX - 4, 14);

  // ── Draw both copies ──
  drawChallanCopy(doc, challanData, 10, 18, colWidth, 'Student Copy', paymentInfo);
  drawChallanCopy(doc, challanData, centerX + 5, 18, colWidth, 'Campus Copy', paymentInfo);

  // ── Footer text ──
  doc.font('Helvetica').fontSize(5.5).fillColor(GRAY);
  doc.text(
    'This is a computer-generated document. Late fee of Rs. 500 applies after due date.',
    20, pageHeight - 18,
    { width: pageWidth - 40, align: 'center' }
  );

  doc.end();
}

module.exports = { generateChallanPDF };
