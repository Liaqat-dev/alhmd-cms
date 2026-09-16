const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const {
  NAVY, SLATE, GRAY, GRAY_LIGHT, GRAY_BG, WHITE,
  RED, GREEN, AMBER_BG, AMBER_BD, AMBER_TXT, EMERALD_BG, ROSE_BG,
  INSTITUTE_NAME, INSTITUTE_TAG, ACCENT,
} = require('../config/constants');

const LOGO_PATH = path.join(__dirname, '../../public/assets/LOGO.png');

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

function monthName(month) {
  return MONTHS[month - 1] || '';
}

function fmtDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  const short = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(d.getDate()).padStart(2,'0')}-${short[d.getMonth()]}-${d.getFullYear()}`;
}

// ── Main PDF Generator ─────────────────────────────────────────────────────────

function generateReportPDF(report, subjects, outputStream) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 30, bottom: 30, left: 40, right: 40 }
  });

  doc.pipe(outputStream);

  const pageWidth = 595 - 80; // usable width
  let cy = 30;

  // ────── Header band ──────
  doc.save();
  doc.rect(0, 0, 595, 82).fill(NAVY);
  doc.restore();

  const logoExists = fs.existsSync(LOGO_PATH);
  const logoSize = 46;

  if (logoExists) {
    doc.save();
    doc.circle(40 + logoSize / 2, 41, logoSize / 2 + 3).fill(WHITE);
    doc.restore();
    doc.image(LOGO_PATH, 40, 41 - logoSize / 2, { width: logoSize, height: logoSize });
  }

  const htx = logoExists ? 40 + logoSize + 16 : 40;
  doc.font('Helvetica-Bold').fontSize(17).fillColor(WHITE);
  doc.text(INSTITUTE_NAME, htx, 24, { width: 350 });
  doc.font('Helvetica').fontSize(9).fillColor(ACCENT);
  doc.text('Student Monthly Progress Report', htx, 44, { width: 350 });
  doc.font('Helvetica').fontSize(8).fillColor(WHITE);
  doc.text(INSTITUTE_TAG, htx, 58, { width: 350 });

  doc.font('Helvetica').fontSize(8).fillColor('#cbd5e1');
  doc.text('REPORT PERIOD', 595 - 40 - 160, 26, { width: 160, align: 'right' });
  doc.font('Helvetica-Bold').fontSize(13).fillColor(WHITE);
  doc.text(`${monthName(report.month)} ${report.year}`, 595 - 40 - 160, 40, { width: 160, align: 'right' });

  cy = 100;

  // ────── Student info card ──────
  doc.save();
  doc.roundedRect(40, cy, pageWidth, 78, 8).lineWidth(0.75).strokeColor(GRAY_LIGHT).stroke();
  doc.restore();
  doc.save();
  doc.rect(40, cy, pageWidth, 20).fill(GRAY_BG);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(SLATE);
  doc.text('STUDENT INFORMATION', 48, cy + 6);
  doc.restore();

  const infoY = cy + 30;
  const colW = pageWidth / 3;
  const field = (label, value, col, row) => {
    const x = 48 + col * colW;
    const y = infoY + row * 24;
    doc.font('Helvetica').fontSize(7.5).fillColor(GRAY);
    doc.text(label.toUpperCase(), x, y);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY);
    doc.text(value || '—', x, y + 10, { width: colW - 12 });
  };

  field('Full Name', report.student?.name, 0, 0);
  field('Roll Number', report.student?.rollNumber, 1, 0);
  field('Class', report.student?.class?.name, 2, 0);
  field("Father's Name", report.student?.fatherName, 0, 1);
  field('Academic Year', report.student?.academicYear, 1, 1);
  field('Status', report.student?.status || 'ENROLLED', 2, 1);

  cy += 78 + 16;

  // ────── Summary stats ──────
  const attPct = Number(report.attendancePercentage);
  const marksPct = report.averageMarks !== null && report.averageMarks !== undefined ? Number(report.averageMarks) : null;
  const statW = (pageWidth - 12) / 2;

  const drawStat = (x, label, value, sub, barPct, barColor) => {
    doc.save();
    doc.roundedRect(x, cy, statW, 62, 8).lineWidth(0.75).strokeColor(GRAY_LIGHT).stroke();
    doc.restore();
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(GRAY);
    doc.text(label.toUpperCase(), x + 12, cy + 10);
    doc.font('Helvetica-Bold').fontSize(20).fillColor(NAVY);
    doc.text(value, x + 12, cy + 20);
    doc.font('Helvetica').fontSize(8).fillColor(GRAY);
    doc.text(sub, x + 12, cy + 44);
    if (barPct !== null) {
      doc.save();
      doc.rect(x + 12, cy + 56, statW - 24, 3).fill(GRAY_LIGHT);
      doc.rect(x + 12, cy + 56, (statW - 24) * Math.min(barPct, 100) / 100, 3).fill(barColor);
      doc.restore();
    }
  };

  drawStat(40, 'Attendance', `${attPct.toFixed(1)}%`,
    `${report.totalPresent}P • ${report.totalAbsent}A • ${report.totalLeave}L`,
    attPct, attPct >= 75 ? GREEN : RED);

  drawStat(40 + statW + 12, 'Academic Score', marksPct !== null ? `${marksPct.toFixed(1)}%` : 'N/A',
    `${report.totalExams} exams • ${report.examsPassed} passed`,
    marksPct, marksPct !== null && marksPct >= 50 ? GREEN : RED);

  cy += 62 + 20;

  // ────── Subject-wise performance ──────
  if (subjects.length > 0) {
    doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY);
    doc.text('Subject-wise Performance', 40, cy);
    cy += 18;

    for (const subj of subjects) {
      if (cy > 700) { doc.addPage(); cy = 40; }

      const sp = subj.percentage ? Number(subj.percentage) : null;
      const headerH = 22;

      doc.save();
      doc.rect(40, cy, pageWidth, headerH).fill(NAVY);
      doc.restore();
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(WHITE);
      doc.text(subj.subjectName, 48, cy + 6);
      if (sp !== null) {
        const badge = `${sp}%`;
        const bw = doc.widthOfString(badge) + 16;
        doc.save();
        doc.roundedRect(40 + pageWidth - bw - 8, cy + 4, bw, 14, 7).fill(sp >= 50 ? GREEN : RED);
        doc.font('Helvetica-Bold').fontSize(8).fillColor(WHITE);
        doc.text(badge, 40 + pageWidth - bw - 8, cy + 7.5, { width: bw, align: 'center' });
        doc.restore();
      }
      cy += headerH;

      if (subj.exams.length > 0) {
        // Table header
        const rowH = 18;
        doc.save();
        doc.rect(40, cy, pageWidth, rowH).fill(GRAY_BG);
        doc.restore();
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(SLATE);
        doc.text('EXAM', 48, cy + 5, { width: pageWidth * 0.3 });
        doc.text('TYPE', 40 + pageWidth * 0.3, cy + 5, { width: pageWidth * 0.2 });
        doc.text('SCORE', 40 + pageWidth * 0.5, cy + 5, { width: pageWidth * 0.15, align: 'center' });
        doc.text('GRADE', 40 + pageWidth * 0.65, cy + 5, { width: pageWidth * 0.1, align: 'center' });
        doc.text('REMARKS', 40 + pageWidth * 0.75, cy + 5, { width: pageWidth * 0.25 });
        cy += rowH;

        subj.exams.forEach((exam, i) => {
          if (cy > 740) { doc.addPage(); cy = 40; }
          const rh = 18;
          if (i % 2 === 0) {
            doc.save();
            doc.rect(40, cy, pageWidth, rh).fill('#fbfcfe');
            doc.restore();
          }
          doc.font('Helvetica').fontSize(8).fillColor(SLATE);
          doc.text(exam.title, 48, cy + 4, { width: pageWidth * 0.3 - 8 });
          doc.fillColor(GRAY);
          doc.text((exam.examType || '').replace(/_/g, ' '), 40 + pageWidth * 0.3, cy + 4, { width: pageWidth * 0.2 });

          if (exam.notTaken) {
            doc.font('Helvetica-Oblique').fontSize(7.5).fillColor(GRAY);
            doc.text('Not taken', 40 + pageWidth * 0.5, cy + 4, { width: pageWidth * 0.15, align: 'center' });
            doc.text('—', 40 + pageWidth * 0.65, cy + 4, { width: pageWidth * 0.1, align: 'center' });
          } else {
            const passed = Number(exam.obtainedMarks) >= exam.passingMarks;
            doc.font('Helvetica-Bold').fontSize(8).fillColor(passed ? GREEN : RED);
            doc.text(`${Number(exam.obtainedMarks)}/${exam.totalMarks}`, 40 + pageWidth * 0.5, cy + 4, { width: pageWidth * 0.15, align: 'center' });
            doc.fillColor(passed ? GREEN : RED);
            doc.text(exam.grade || '—', 40 + pageWidth * 0.65, cy + 4, { width: pageWidth * 0.1, align: 'center' });
          }
          doc.font('Helvetica-Oblique').fontSize(7.5).fillColor(GRAY);
          doc.text(exam.remarks || '—', 40 + pageWidth * 0.75, cy + 4, { width: pageWidth * 0.25 - 8 });

          cy += rh;
        });
      } else {
        doc.font('Helvetica').fontSize(8).fillColor(GRAY);
        doc.text('No exams recorded this month', 48, cy + 5);
        cy += 20;
      }

      cy += 12;
    }
  }

  // ────── Teacher remarks ──────
  if (report.teacherRemarks) {
    if (cy > 700) { doc.addPage(); cy = 40; }
    const remH = 50;
    doc.save();
    doc.roundedRect(40, cy, pageWidth, remH, 6).fill(AMBER_BG);
    doc.roundedRect(40, cy, pageWidth, remH, 6).lineWidth(0.5).strokeColor(AMBER_BD).stroke();
    doc.restore();
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(AMBER_TXT);
    doc.text("TEACHER'S OVERALL REMARKS", 48, cy + 8);
    doc.font('Helvetica').fontSize(9).fillColor(AMBER_TXT);
    doc.text(report.teacherRemarks, 48, cy + 22, { width: pageWidth - 16 });
    cy += remH + 16;
  }

  // ────── Footer ──────
  const footY = 780;
  doc.font('Helvetica').fontSize(7.5).fillColor(GRAY);
  doc.text(`Generated: ${fmtDate(new Date())}`, 40, footY);
  doc.text(`${INSTITUTE_NAME} • Official Student Report`, 40, footY + 11);
  doc.fillColor('#cbd5e1');
  doc.text('This is a computer-generated document', 40, footY + 22);

  doc.save();
  doc.moveTo(595 - 40 - 140, footY + 20).lineTo(595 - 40, footY + 20).lineWidth(0.5).strokeColor(GRAY_LIGHT).stroke();
  doc.restore();
  doc.font('Helvetica').fontSize(7.5).fillColor(GRAY);
  doc.text('Authorized Signature', 595 - 40 - 140, footY + 24, { width: 140, align: 'center' });

  doc.end();
}

module.exports = { generateReportPDF };
