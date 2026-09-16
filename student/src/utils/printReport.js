import logo from '@/images/logo.png'
import { INSTITUTE_NAME } from '@shared/config/institute'

const MONTHS = [
    {value: 1, label: 'January'},
    {value: 2, label: 'February'},
    {value: 3, label: 'March'},
    {value: 4, label: 'April'},
    {value: 5, label: 'May'},
    {value: 6, label: 'June'},
    {value: 7, label: 'July'},
    {value: 8, label: 'August'},
    {value: 9, label: 'September'},
    {value: 10, label: 'October'},
    {value: 11, label: 'November'},
    {value: 12, label: 'December'},
]

const getMonthName = (month) => MONTHS.find(m => m.value === month)?.label || month

export function printReport(report, subjects = []) {
    const printWindow = window.open('', '_blank')
    const attPct = Number(report.attendancePercentage)
    const marksPct = report.averageMarks ? Number(report.averageMarks) : null
    const className = report.student?.class?.name || ''

    const content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Report — ${report.student?.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #fff; color: #1e293b; }
    @page { size: A4; margin: 0; }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .no-break { page-break-inside: avoid; }
    }
    .page { max-width: 794px; margin: 0 auto; padding: 0; }

    /* ── Top banner ── */
    .banner {
      background: linear-gradient(135deg, #052e16 0%, #166534 60%, #22c55e 100%);
      padding: 32px 40px 28px;
      position: relative;
      overflow: hidden;
    }
    .banner::after {
      content: '';
      position: absolute;
      right: -40px; top: -40px;
      width: 200px; height: 200px;
      border-radius: 50%;
      background: rgba(255,255,255,0.05);
    }
    .banner-school { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
    .banner-subtitle { font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 2px; letter-spacing: 1px; text-transform: uppercase; }
    .banner-period { position: absolute; right: 40px; top: 50%; transform: translateY(-50%); text-align: right; }
    .banner-period-label { font-size: 10px; color: rgba(255,255,255,0.6); letter-spacing: 1px; text-transform: uppercase; }
    .banner-period-value { font-size: 18px; font-weight: 700; color: #fff; margin-top: 2px; }

    /* ── Student card ── */
    .student-card {
      margin: 24px 40px 0;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    .student-card-header {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 10px 20px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #64748b;
      text-transform: uppercase;
    }
    .student-card-body { padding: 16px 20px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    .student-field label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: .8px; display: block; margin-bottom: 2px; }
    .student-field span { font-size: 13px; font-weight: 600; color: #1e293b; }

    /* ── Summary stats ── */
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 40px 0; }
    .stat {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
      position: relative;
      overflow: hidden;
    }
    .stat::before {
      content: '';
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 3px;
    }
    .stat.blue::before { background: #22c55e; }
    .stat.green::before { background: #22c55e; }
    .stat.violet::before { background: #8b5cf6; }
    .stat-label { font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #94a3b8; }
    .stat-value { font-size: 26px; font-weight: 800; color: #0f172a; margin: 4px 0 2px; line-height: 1; }
    .stat-sub { font-size: 10px; color: #94a3b8; }
    .bar-wrap { background: #e2e8f0; height: 4px; border-radius: 2px; overflow: hidden; margin-top: 6px; }
    .bar-fill { height: 100%; border-radius: 2px; }

    /* ── Section divider ── */
    .section-body { margin: 0 40px; }
    .divider { display: flex; align-items: center; gap: 12px; margin: 28px 0 16px; }
    .divider-line { flex: 1; height: 1px; background: #e2e8f0; }
    .divider-text { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: #94a3b8; text-transform: uppercase; white-space: nowrap; }

    /* ── Subject block ── */
    .subject-block { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 16px; page-break-inside: avoid; }
    .subject-head {
      background: linear-gradient(90deg, #052e16, #16a34a);
      padding: 9px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .subject-name { color: #fff; font-weight: 700; font-size: 13px; }
    .subject-badges { display: flex; gap: 8px; align-items: center; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; }
    .badge-white { background: rgba(255,255,255,0.15); color: #fff; }
    .badge-green { background: #22c55e; color: #fff; }
    .badge-red { background: #ef4444; color: #fff; }
    .att-row {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 5px 16px;
      font-size: 11px;
      color: #64748b;
      display: flex;
      gap: 16px;
    }
    .att-row strong { font-weight: 700; }
    .att-p { color: #15803d; }
    .att-a { color: #b91c1c; }
    .att-l { color: #b45309; }

    /* ── Exam table ── */
    .exam-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .exam-table th {
      padding: 7px 14px;
      text-align: left;
      background: #f1f5f9;
      color: #475569;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .6px;
      text-transform: uppercase;
    }
    .exam-table th.center { text-align: center; }
    .exam-table td { padding: 8px 14px; border-top: 1px solid #f1f5f9; }
    .exam-table tr:nth-child(even) td { background: #f8fafc; }
    .grade-circle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      font-weight: 800;
      font-size: 12px;
    }

    /* ── Teacher remarks ── */
    .remarks-box {
      margin: 20px 40px 0;
      border: 1px solid #fde68a;
      border-radius: 10px;
      overflow: hidden;
    }
    .remarks-header { background: #fef3c7; padding: 8px 16px; font-size: 10px; font-weight: 700; letter-spacing: 1px; color: #92400e; text-transform: uppercase; }
    .remarks-body { padding: 12px 16px; font-size: 13px; color: #78350f; line-height: 1.6; }

    /* ── Footer ── */
    .footer { margin: 32px 40px 40px; display: flex; justify-content: space-between; align-items: flex-end; }
    .footer-left { font-size: 10px; color: #94a3b8; line-height: 1.8; }
    .signature-line { border-top: 1px solid #cbd5e1; width: 160px; margin-top: 32px; padding-top: 4px; font-size: 10px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
<div class="page">

  <!-- Banner -->
  <div class="banner">
    <div style="display:flex;align-items:center;gap:16px;">
      <img src="${logo}" style="height:52px;object-fit:contain;filter:brightness(0) invert(1);" alt="Logo" />
      <div>
        <div class="banner-school">${INSTITUTE_NAME}</div>
        <div class="banner-subtitle">Student Monthly Progress Report</div>
      </div>
    </div>
    <div class="banner-period">
      <div class="banner-period-label">Report Period</div>
      <div class="banner-period-value">${getMonthName(report.month)} ${report.year}</div>
    </div>
  </div>

  <!-- Student Info -->
  <div class="student-card">
    <div class="student-card-header">Student Information</div>
    <div class="student-card-body">
      <div class="student-field"><label>Full Name</label><span>${report.student?.name || '—'}</span></div>
      <div class="student-field"><label>Roll Number</label><span>${report.student?.rollNumber || '—'}</span></div>
      <div class="student-field"><label>Class</label><span>${report.student?.class?.name || '—'}</span></div>
      <div class="student-field"><label>Father's Name</label><span>${report.student?.fatherName || '—'}</span></div>
      <div class="student-field"><label>Academic Year</label><span>${report.student?.academicYear || '—'}</span></div>
      <div class="student-field"><label>Status</label><span>${report.student?.status || 'ENROLLED'}</span></div>
    </div>
  </div>

  <!-- Summary Stats -->
  <div class="summary">
    <div class="stat blue">
      <div class="stat-label">Attendance</div>
      <div class="stat-value">${attPct.toFixed(1)}%</div>
      <div class="stat-sub">${report.totalPresent}P &bull; ${report.totalAbsent}A &bull; ${report.totalLeave}L</div>
      <div class="bar-wrap"><div class="bar-fill" style="width:${Math.min(attPct, 100)}%;background:${attPct >= 75 ? '#22c55e' : '#ef4444'};"></div></div>
    </div>
    <div class="stat green">
      <div class="stat-label">Academic Score</div>
      <div class="stat-value">${marksPct !== null ? marksPct.toFixed(1) + '%' : 'N/A'}</div>
      <div class="stat-sub">${report.totalExams} exams &bull; ${report.examsPassed} passed</div>
      ${marksPct !== null ? `<div class="bar-wrap"><div class="bar-fill" style="width:${Math.min(marksPct, 100)}%;background:${marksPct >= 50 ? '#22c55e' : '#ef4444'};"></div></div>` : ''}
    </div>
  </div>

  <!-- Subject Details -->
  ${subjects.length > 0 ? `
  <div class="section-body">
    <div class="divider">
      <div class="divider-line"></div>
      <div class="divider-text">Subject-wise Performance</div>
      <div class="divider-line"></div>
    </div>
    ${subjects.map(subj => {
        const sp = subj.percentage ? Number(subj.percentage) : null
        return `
    <div class="subject-block">
      <div class="subject-head">
        <span class="subject-name">${className ? className + '-' : ''}${subj.subjectName}</span>
        <div class="subject-badges">
          ${sp !== null ? `<span class="badge ${sp >= 50 ? 'badge-green' : 'badge-red'}">${sp}%</span>` : ''}
        </div>
      </div>
      ${subj.exams.length > 0 ? `
      <table class="exam-table">
        <thead>
          <tr>
            <th>Exam</th>
            <th>Type</th>
            <th class="center">Score</th>
            <th class="center">Grade</th>
            <th>Teacher's Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${subj.exams.map(exam => {
              if (exam.notTaken) return `
          <tr style="opacity:0.55;">
            <td style="font-weight:500;">${exam.title}</td>
            <td style="color:#64748b;">${exam.examType.replace(/_/g, ' ')}</td>
            <td style="text-align:center;color:#94a3b8;font-style:italic;">Not taken</td>
            <td style="text-align:center;"><span class="grade-circle" style="background:#f1f5f9;color:#94a3b8;">—</span></td>
            <td style="color:#94a3b8;">—</td>
          </tr>`
              const passed = Number(exam.obtainedMarks) >= exam.passingMarks
              return `
          <tr>
            <td style="font-weight:500;">${exam.title}</td>
            <td style="color:#64748b;">${exam.examType.replace(/_/g, ' ')}</td>
            <td style="text-align:center;">
              <span style="font-family:monospace;font-weight:700;color:${passed ? '#15803d' : '#b91c1c'};">${Number(exam.obtainedMarks)}</span>
              <span style="color:#94a3b8;">/${exam.totalMarks}</span>
            </td>
            <td style="text-align:center;">
              <span class="grade-circle" style="background:${passed ? '#dcfce7' : '#fee2e2'};color:${passed ? '#15803d' : '#b91c1c'};">${exam.grade || '—'}</span>
            </td>
            <td style="color:#94a3b8;font-style:italic;">${exam.remarks || '—'}</td>
          </tr>`
          }).join('')}
        </tbody>
      </table>` : `<p style="padding:10px 16px;color:#94a3b8;font-size:12px;">No exams recorded this month</p>`}
    </div>`
    }).join('')}
  </div>` : ''}

  <!-- Teacher Remarks -->
  ${report.teacherRemarks ? `
  <div class="remarks-box">
    <div class="remarks-header">Teacher's Overall Remarks</div>
    <div class="remarks-body">${report.teacherRemarks}</div>
  </div>` : ''}

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">
      <div>Generated: ${new Date().toLocaleDateString('en-GB', {day: '2-digit', month: 'long', year: 'numeric'})}</div>
      <div>${INSTITUTE_NAME} &bull; Official Student Report</div>
      <div style="color:#cbd5e1;">This is a computer-generated document</div>
    </div>
    <div class="signature-line">Authorized Signature</div>
  </div>

</div>
<script>window.print();</script>
</body>
</html>`

    printWindow.document.write(content)
    printWindow.document.close()
}
