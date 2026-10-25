// Printable / PDF question booklet for one set (A–E) of an Offline / OMR Full Mock.
// Opens the booklet in a new tab and starts the browser's print dialog — choose "Save as PDF"
// there to get the PDF file (this is the only way to get correct Bengali text in the PDF
// without bundling a font file).
import { buildOmrSet, bookletNumber } from './omr';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function omrBookletHtml(test, letter) {
  const set = buildOmrSet(test, letter);
  const mc = test.marksCorrect;
  const mw = test.marksWrong;
  const total = +(set.questions.length * mc).toFixed(2);
  const exam = `${esc(test.examCategory || 'All Exams')} — ${esc(test.title)}`;

  const questions = set.questions.map((q, i) => `
    <div class="q">
      <div class="qt"><b>${i + 1}.</b> ${esc(q.textEn)}</div>
      ${q.textBn ? `<div class="qb">${esc(q.textBn)}</div>` : ''}
      <div class="opts">
        ${q.options.map((o) => `<div class="o"><b>(${esc(o.key)})</b> ${esc(o.textEn)}${o.textBn ? ` <span class="ob">/ ${esc(o.textBn)}</span>` : ''}</div>`).join('')}
      </div>
    </div>`).join('');

  const instructions = [
    `Check that the <b>Series (Set ${letter})</b> and <b>Booklet No. ${set.bookletNo}</b> of this booklet match the ones you have written on your OMR sheet.`,
    'Write your Name, Roll Number, Series and Booklet Number on the OMR sheet with a blue or black ball-point pen only.',
    'Do not open this booklet until the invigilator announces the start of the exam.',
    'Each question has four options (A, B, C, D) and only ONE is correct. Darken the circle of the correct option completely on the OMR sheet.',
    `Marking scheme: <b>+${esc(mc)}</b> for every correct answer, <b>−${esc(mw)}</b> for every wrong answer (negative marking). No marks are given or deducted for unattempted questions.`,
    'An answer once darkened cannot be changed. Use of whitener, eraser or overwriting is not allowed. Marking more than one option makes the answer wrong.',
    'Do rough work only in the blank space of this booklet. Mobile phones, calculators, smart watches and any study material are strictly prohibited.',
    'Do not fold, tear, stain or write anything extra on the OMR sheet.',
    'If your faculty instructs, also tick the same answers on the TCE website within the exam time.',
    'At the end of the exam, hand over your OMR sheet to the invigilator. Report any misprint or missing page immediately.',
  ].map((t) => `<li>${t}</li>`).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>TCE_${esc(test.title).replace(/[^A-Za-z0-9]+/g, '_')}_Set_${letter}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 12mm 11mm 16mm 11mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Noto Sans Bengali', Arial, Helvetica, sans-serif; color: #000; font-size: 11.5px; line-height: 1.38; margin: 0; }
  .noprint { background: #fff7e0; border: 1px solid #e0b040; padding: 8px 12px; font-size: 12px; margin-bottom: 10px; }
  h1 { text-align: center; margin: 0; font-size: 22px; letter-spacing: 1.5px; }
  .addr { text-align: center; margin: 2px 0 8px; font-size: 10.5px; }
  table.meta { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  table.meta td { border: 1px solid #000; padding: 4px 7px; font-size: 11.5px; vertical-align: middle; }
  table.meta td.big { font-size: 20px; font-weight: bold; text-align: center; letter-spacing: 2px; }
  .cand { margin: 8px 0 6px; font-size: 11.5px; }
  .instr { border: 1px solid #000; padding: 6px 10px 6px 4px; margin-bottom: 10px; }
  .instr h3 { margin: 0 0 3px 8px; font-size: 12px; text-transform: uppercase; }
  .instr ol { margin: 0; padding-left: 26px; font-size: 10.5px; }
  .instr li { margin-bottom: 1.5px; }
  .cols { column-count: 2; column-gap: 9mm; column-rule: 1px solid #999; }
  .q { break-inside: avoid; page-break-inside: avoid; margin-bottom: 9px; }
  .qt { font-weight: 600; }
  .qb { font-size: 10.5px; margin-top: 1px; }
  .opts { margin-top: 2px; padding-left: 6px; }
  .o { margin: 1px 0; }
  .ob { font-size: 10px; }
  .foot { position: fixed; bottom: -11mm; left: 0; right: 0; text-align: center; font-size: 10px; border-top: 1px solid #666; padding-top: 2px; }
  @media print { .noprint { display: none; } }
</style></head>
<body>
  <div class="noprint">To save this booklet as a PDF: in the print window choose <b>Destination → Save as PDF</b> (on a phone: <b>Print → Save as PDF</b>).</div>
  <h1>THE COMPETITIVE EDGE</h1>
  <div class="addr">Near Nahata Anchal, Nahata, P.S. Gopalnagar, North 24 Parganas, West Bengal - 743290</div>
  <table class="meta">
    <tr><td><b>Exam</b></td><td>${exam}</td><td><b>Booklet Series</b></td><td class="big">SET ${letter}</td></tr>
    <tr><td><b>Subject</b></td><td>Full Mock (Combined Paper)</td><td><b>Booklet No.</b></td><td class="big">${set.bookletNo}</td></tr>
    <tr><td><b>Duration</b></td><td>${esc(test.durationMin)} Minutes</td><td><b>Total Questions</b></td><td>${set.questions.length}</td></tr>
    <tr><td><b>Negative Marking</b></td><td>+${esc(mc)} correct &nbsp;|&nbsp; −${esc(mw)} wrong</td><td><b>Maximum Marks</b></td><td>${total}</td></tr>
  </table>
  <div class="cand">Candidate Name: ______________________________ &nbsp; Roll No.: ______________ &nbsp; Date: ____________</div>
  <div class="instr"><h3>Instructions to Candidates</h3><ol>${instructions}</ol></div>
  <div class="cols">${questions}</div>
  <div class="foot">The Competitive Edge &nbsp;•&nbsp; SET ${letter} &nbsp;•&nbsp; Booklet No. ${bookletNumber(test.id, letter)}</div>
</body></html>`;
}

export function printOmrBooklet(test, letter) {
  if (!test || !test.questions || !test.questions.length) { alert('Add questions to this test first.'); return; }
  const w = window.open('', '_blank');
  if (!w) { alert('Please allow pop-ups for this site, then tap the button again.'); return; }
  w.document.write(omrBookletHtml(test, letter));
  w.document.close();
  const go = () => { try { w.focus(); w.print(); } catch (e) { /* the admin can still print manually */ } };
  const ready = w.document.fonts && w.document.fonts.ready ? w.document.fonts.ready : Promise.resolve();
  Promise.race([ready, new Promise((r) => setTimeout(r, 2500))]).then(() => setTimeout(go, 300));
}
