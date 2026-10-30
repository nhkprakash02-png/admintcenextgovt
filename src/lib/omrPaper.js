// Printable / PDF question booklet for one set (A–D) of an Offline / OMR Full Mock.
// Opens the booklet in a new tab and starts the browser's print dialog — choose "Save as PDF"
// there to get the PDF file (this is the only way to get correct Bengali text in the PDF
// without bundling a font file).
//
// Layout: a big header and an instructions box, then the questions in the classic vertical format
// — English question, the Bengali translation right under it, then options (A)–(D) — flowing
// continuously in two newspaper-style columns (down the left column first, then the right, then
// onto the next page) so the booklet stays short for photocopying. A question is never split
// between two columns or two pages, and the page footer is printed by the browser in the page
// margin, so nothing can overlap the questions.
import { buildOmrSet, bookletNumber } from './omr';
import { WATERMARK_CSS, watermarkImgHtml, whenWatermarkReady } from './offlinePaper';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const has = (s) => typeof s === 'string' && s.trim().length > 0;

export function omrBookletHtml(test, letter) {
  const set = buildOmrSet(test, letter);
  const mc = test.marksCorrect;
  const mw = test.marksWrong;
  const total = +(set.questions.length * mc).toFixed(2);
  const exam = `${esc(test.examCategory || 'All Exams')} — ${esc(test.title)}`;

  // English question first, then the Bengali translation underneath, then the four options.
  // If one language is missing, the other is shown so nothing is left blank.
  const questions = set.questions.map((q, i) => {
    const en = has(q.textEn) ? q.textEn : q.textBn;
    const bn = has(q.textBn) && has(q.textEn) ? q.textBn : '';
    const opts = q.options.map((o) => {
      const oe = has(o.textEn) ? o.textEn : o.textBn;
      const ob = has(o.textBn) && has(o.textEn) ? o.textBn : '';
      return `<div class="o"><b>(${esc(o.key)})</b> ${esc(oe)}${ob ? ` <span class="ob">/ ${esc(ob)}</span>` : ''}</div>`;
    }).join('');
    return `<div class="q">
      <div class="qt"><b>${i + 1}.</b> ${esc(en)}</div>
      ${bn ? `<div class="qb">${esc(bn)}</div>` : ''}
      <div class="opts">${opts}</div>
    </div>`;
  }).join('');

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
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  /* The footer on every page is drawn by the browser inside the bottom margin (so it can never
     overlap a question). Browsers that don't support page-margin boxes simply leave it out. */
  @page {
    size: A4;
    margin: 14mm 12mm 20mm 12mm;
    @bottom-center { content: "The Competitive Edge  •  SET ${letter}  •  Booklet No. ${bookletNumber(test.id, letter)}  •  Page " counter(page) " of " counter(pages); font-size: 9px; color: #222; }
  }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Noto Sans Bengali', Arial, Helvetica, sans-serif; color: #000; font-size: 11.5px; line-height: 1.4; margin: 0; overflow-wrap: anywhere; }
  .noprint { background: #fff7e0; border: 1px solid #e0b040; padding: 8px 12px; font-size: 12px; margin-bottom: 10px; }
  .brand { text-align: center; padding: 4px 0 6px; border-bottom: 3px double #000; margin-bottom: 8px; }
  .brand h1 { margin: 0; font-size: 40px; font-weight: 800; letter-spacing: 4px; line-height: 1.15; text-transform: uppercase; }
  .brand .tag { font-size: 12px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin-top: 2px; }
  .brand .addr { font-size: 10.5px; margin-top: 3px; }
  table.meta { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  table.meta td { border: 1px solid #000; padding: 4px 7px; font-size: 11.5px; vertical-align: middle; }
  table.meta td.big { font-size: 20px; font-weight: bold; text-align: center; letter-spacing: 2px; }
  .cand { margin: 8px 0 6px; font-size: 11.5px; }
  .instr { border: 1px solid #000; padding: 6px 10px 6px 4px; margin-bottom: 12px; }
  .instr h3 { margin: 0 0 3px 8px; font-size: 12px; text-transform: uppercase; }
  .instr ol { margin: 0; padding-left: 26px; font-size: 10.5px; }
  .instr li { margin-bottom: 1.5px; }

  /* Questions flow continuously in two columns: down the left, then the right, then the next page. */
  .cols { -webkit-column-count: 2; column-count: 2; -webkit-column-gap: 9mm; column-gap: 9mm; -webkit-column-rule: 1px solid #999; column-rule: 1px solid #999; }
  .q { -webkit-column-break-inside: avoid; break-inside: avoid; page-break-inside: avoid; margin-bottom: 9px; }
  .qt { font-weight: 600; }
  .qb { font-size: 10.5px; margin-top: 1px; }
  .opts { margin-top: 3px; padding-left: 6px; }
  .o { margin: 1px 0; }
  .ob { font-size: 10px; }
  @media print { .noprint { display: none; } }
  ${WATERMARK_CSS}
</style></head>
<body>
  ${watermarkImgHtml()}
  <div class="noprint">To save this booklet as a PDF: in the print window choose <b>Destination → Save as PDF</b> and set <b>Paper size → A4</b> (on a phone: <b>Print → Save as PDF</b>, paper size A4).</div>
  <div class="brand">
    <h1>The Competitive Edge</h1>
    <div class="tag">Offline Mock Test • OMR Based Examination</div>
    <div class="addr">Near Nahata Anchal, Nahata, P.S. Gopalnagar, North 24 Parganas, West Bengal - 743290</div>
  </div>
  <table class="meta">
    <tr><td><b>Exam</b></td><td>${exam}</td><td><b>Booklet Series</b></td><td class="big">SET ${letter}</td></tr>
    <tr><td><b>Subject</b></td><td>Full Mock (Combined Paper)</td><td><b>Booklet No.</b></td><td class="big">${set.bookletNo}</td></tr>
    <tr><td><b>Duration</b></td><td>${esc(test.durationMin)} Minutes</td><td><b>Total Questions</b></td><td>${set.questions.length}</td></tr>
    <tr><td><b>Negative Marking</b></td><td>+${esc(mc)} correct &nbsp;|&nbsp; −${esc(mw)} wrong</td><td><b>Maximum Marks</b></td><td>${total}</td></tr>
  </table>
  <div class="cand">Candidate Name: ______________________________ &nbsp; Roll No.: ______________ &nbsp; Date: ____________</div>
  <div class="instr"><h3>Instructions to Candidates</h3><ol>${instructions}</ol></div>
  <div class="cols">${questions}</div>
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
  Promise.race([ready, new Promise((r) => setTimeout(r, 2500))]).then(() => whenWatermarkReady(w)).then(() => setTimeout(go, 300));
}
