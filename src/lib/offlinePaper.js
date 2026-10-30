// Printable question paper for "Print / Export Offline Paper" (Math, English, Reasoning, GK,
// Science, Full Mock, Offline/OMR Full Mock and PYQ sets), plus the background-watermark helpers
// that the Offline/OMR set booklets (omrPaper.js) use too.
//
// WATERMARK: put your logo in the admin project at  public/watermark.png  (it is then served at
// /watermark.png). To use a different file name or folder, change WATERMARK_PATH below — that is the
// only place it is referenced. If the file is missing, the papers simply print without a watermark.
export const WATERMARK_PATH = '/watermark.png';
const WATERMARK_OPACITY = 0.1; // 0.10 = very faint. Raise to 0.15 for a stronger mark, lower for fainter.

// The watermark is a picture fixed to the middle of every printed page, BEHIND the text. Only the
// picture itself is made transparent — the questions, options and headings are never faded or
// blurred, so they stay 100% sharp and fully readable.
export const WATERMARK_CSS = `
  .tce-watermark {
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 120mm; max-width: 75%; height: auto;
    opacity: ${WATERMARK_OPACITY};
    z-index: -1;
    pointer-events: none;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }`;

// <img> tag for the watermark. The full address is used because the print window is a blank page.
// If the picture can't be loaded it is removed, so no broken-image icon ever prints.
export function watermarkImgHtml() {
  const src = (typeof window !== 'undefined' ? window.location.origin : '') + WATERMARK_PATH;
  return `<img class="tce-watermark" src="${src}" alt="" onerror="this.remove()">`;
}

// Resolves once the watermark picture has loaded (or failed / timed out), so printing never starts
// before it is ready.
export function whenWatermarkReady(win) {
  return new Promise((resolve) => {
    try {
      const img = win.document.querySelector('.tce-watermark');
      if (!img || img.complete) { resolve(); return; }
      img.addEventListener('load', resolve);
      img.addEventListener('error', resolve);
      setTimeout(resolve, 3000);
    } catch (e) { resolve(); }
  });
}

/* Offline printable question paper — same content as before, now with the background watermark. */
export function printOfflinePaper(test) {
  if (!test) return;
  const html = `
  <div style="font-family:Arial, sans-serif; color:#000; padding:20px; max-width:800px; margin:0 auto;">
    <h2 style="text-align:center;margin-bottom:4px;">TCE - The Competitive Edge</h2>
    <p style="text-align:center;margin-top:0;font-size:12px;">Near Nahata Anchal, Nahata, P.S. Gopalnagar, North 24 Parganas, West Bengal - 743290</p>
    <hr>
    <h3>${test.title}</h3>
    <p style="font-size:13px;">Duration: ${test.durationMin} min &nbsp; | &nbsp; Marks: +${test.marksCorrect} / -${test.marksWrong} &nbsp; | &nbsp; Total Questions: ${test.questions.length}</p>
    <p style="font-size:12px;">Name: ______________________ &nbsp; Roll No: ____________ &nbsp; Date: ____________</p>
    <hr>
    ${test.questions.map((q, i) => `
      <div style="margin-bottom:14px; page-break-inside:avoid;">
        <p style="font-weight:bold; margin-bottom:4px;">${i + 1}. ${q.textEn} ${q.textBn ? ('&nbsp; / ' + q.textBn) : ''}</p>
        <div style="display:flex; flex-wrap:wrap; gap:16px; font-size:13px;">
          ${q.options.map((o) => `<span>(${o.key}) ${o.textEn}</span>`).join('')}
        </div>
      </div>`).join('')}
    <hr>
    <p style="font-size:11px; text-align:center;">© TCE - The Competitive Edge | tcenahata@gmail.com | +91 73846 44030</p>
  </div>`;
  const w = window.open('', '_blank');
  if (!w) { alert('Please allow pop-ups for this site, then tap the button again.'); return; }
  w.document.write(`<html><head><meta charset="utf-8"><title>${test.title} - Print</title><style>${WATERMARK_CSS}</style></head><body>${watermarkImgHtml()}${html}</body></html>`);
  w.document.close();
  whenWatermarkReady(w).then(() => setTimeout(() => { try { w.focus(); w.print(); } catch (e) { /* the admin can still print manually */ } }, 400));
}
