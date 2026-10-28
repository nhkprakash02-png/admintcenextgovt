'use client';

import React, { useState } from 'react';
import { Printer, Trash2, FileDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { uid, SUBCATEGORIES } from '../../lib/utils';
import { printOfflinePaper } from '../../lib/examEngine';
import QuestionEditor from './QuestionEditor';
import { OMR_SUBJECT, OMR_SET_LETTERS, DEFAULT_ROLL_DIGITS, bookletNumber } from '../../lib/omr';
import { printOmrBooklet } from '../../lib/omrPaper';

const SUBJECTS = ['math', 'english', 'reasoning', 'gk', 'science', 'full', 'omr'];
// 'full' is the regular online full mock; 'omr' is the Offline / OMR full mock (4 printable sets, A–D).
const SUBJECT_LABELS = { full: 'FULL (ONLINE)', omr: 'OFFLINE / OMR FULL' };

function promptSubCategory(subject, currentValue) {
  const opts = SUBCATEGORIES[subject];
  if (!opts) return undefined;
  const list = opts.map((o, i) => `${i + 1}. ${o}`).join('\n');
  const input = prompt(`Choose a sub-category for ${subject.toUpperCase()}:\n${list}\n\nEnter the number or name:`, currentValue || opts[0]);
  if (input === null) return currentValue;
  const trimmed = input.trim();
  const byNumber = opts[parseInt(trimmed, 10) - 1];
  if (byNumber) return byNumber;
  const byName = opts.find((o) => o.toLowerCase() === trimmed.toLowerCase());
  return byName || opts[0];
}

export default function MockManager() {
  const { DB, saveDB } = useApp();
  const [subject, setSubject] = useState('math');
  const [testId, setTestId] = useState(null);

  const tests = DB.mockTests[subject] || [];
  const activeTestId = testId || tests[0]?.id || null;
  const test = tests.find((t) => t.id === activeTestId);

  const updateTests = (updater) => saveDB((prev) => ({ ...prev, mockTests: { ...prev.mockTests, [subject]: updater(prev.mockTests[subject] || []) } }));
  const updateTestQuestions = (updater) => updateTests((ts) => ts.map((t) => (t.id === activeTestId ? { ...t, questions: updater(t.questions) } : t)));

  const addNewMockTest = () => {
    const title = prompt('Test title:'); if (!title) return;
    const examCategory = prompt('Exam category (e.g. "All Exams", "WBP Constable", "Railway (RRB)", "SSC GD"):', 'All Exams') || 'All Exams';
    const durationInput = prompt('Test duration (in minutes):', '20');
    const durationMin = durationInput !== null && parseFloat(durationInput) > 0 ? parseFloat(durationInput) : 20;
    const subCategory = promptSubCategory(subject);
    // New tests default to Paid (isDemo: false) — give them the next sequential display order
    // among this subject's existing Paid mocks so they naturally land at the end of the list.
    const existingPaidOrders = tests.filter((t) => !t.isDemo).map((t) => (typeof t.order === 'number' ? t.order : 0));
    const nextOrder = existingPaidOrders.length ? Math.max(...existingPaidOrders) + 1 : 1;
    const nt = { id: uid('mt'), subject, title, isDemo: false, adminUnlocked: false, examCategory, durationMin, subCategory, marksCorrect: 2, marksWrong: 0.5, questions: [], order: nextOrder };
    updateTests((ts) => [...ts, nt]);
    setTestId(nt.id);
  };
  const toggleDemoFlag = () => updateTests((ts) => ts.map((t) => (t.id === activeTestId ? { ...t, isDemo: !t.isDemo } : t)));
  const toggleAdminUnlock = () => updateTests((ts) => ts.map((t) => {
    if (t.id !== activeTestId) return t;
    const unlocking = !t.adminUnlocked;
    // Offline / OMR: every unlock starts a brand-new set rotation, so the next student always gets
    // Set A again (the new id makes the student site restart its A → B → C → D counter).
    return { ...t, adminUnlocked: unlocking, ...(subject === OMR_SUBJECT && unlocking ? { omrUnlockSession: uid('us') } : {}) };
  }));
  const editTestMeta = () => {
    if (!test) return;
    const title = prompt('Test title:', test.title); if (title === null) return;
    const examCategory = prompt('Exam category (e.g. "All Exams", "WBP Constable", "Railway (RRB)", "SSC GD"):', test.examCategory || 'All Exams'); if (examCategory === null) return;
    const dur = prompt('Duration (minutes):', test.durationMin); if (dur === null) return;
    const mc = prompt('Marks for correct answer:', test.marksCorrect); if (mc === null) return;
    const mw = prompt('Negative marking for wrong answer (e.g. 0, 0.25, 0.33, 0.5):', test.marksWrong); if (mw === null) return;
    const subCategory = SUBCATEGORIES[subject] ? promptSubCategory(subject, test.subCategory) : test.subCategory;
    updateTests((ts) => ts.map((t) => (t.id === activeTestId ? {
      ...t, title: title.trim() || t.title, examCategory: examCategory.trim() || t.examCategory,
      durationMin: parseFloat(dur) || t.durationMin, marksCorrect: parseFloat(mc) || t.marksCorrect,
      marksWrong: parseFloat(mw) >= 0 ? parseFloat(mw) : t.marksWrong, subCategory,
    } : t)));
  };
  const deleteTest = () => {
    if (!test) return;
    if (!confirm(`Delete "${test.title}" permanently? This cannot be undone.`)) return;
    updateTests((ts) => ts.filter((t) => t.id !== activeTestId));
    setTestId(null);
  };

  // Paid-mocks-only: lets the admin move a test to any position in the student-facing list by
  // giving it a display order number (lower shows first). Free demo tests never get this control.
  const setPaidMockOrder = () => {
    if (!test || test.isDemo) return;
    const current = typeof test.order === 'number' ? String(test.order) : '';
    const input = prompt('Display order for this Paid Mock Test (lower numbers appear first, e.g. 1, 2, 3...):', current);
    if (input === null) return;
    const order = parseFloat(input);
    if (!Number.isFinite(order)) { alert('Please enter a valid number.'); return; }
    updateTests((ts) => ts.map((t) => (t.id === activeTestId ? { ...t, order } : t)));
  };

  // Offline / OMR only: how many digits of the student's phone number make up their roll number.
  const setOmrRollDigits = () => {
    if (!test) return;
    const input = prompt('Roll number digits (taken from the END of the student\'s registered phone number, 4 to 10):', test.omrRollDigits || DEFAULT_ROLL_DIGITS);
    if (input === null) return;
    const n = parseInt(input, 10);
    if (!Number.isFinite(n) || n < 4 || n > 10) { alert('Please enter a number between 4 and 10.'); return; }
    updateTests((ts) => ts.map((t) => (t.id === activeTestId ? { ...t, omrRollDigits: n } : t)));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {SUBJECTS.map((s) => (
          <button key={s} onClick={() => { setSubject(s); setTestId(null); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subject === s ? 'tab-active' : 'card2 muted'}`}>{SUBJECT_LABELS[s] || s.toUpperCase()}</button>
        ))}
      </div>
      {SUBCATEGORIES[subject] && (
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <span className="text-[11px] font-bold muted uppercase">Sub-category:</span>
          {SUBCATEGORIES[subject].map((sc) => <span key={sc} className="badge card2 muted">{sc}</span>)}
          <span className="text-[11px] muted">— set per test below via "+ New Test" or "Edit Test Info"</span>
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <select value={activeTestId || ''} onChange={(e) => setTestId(e.target.value)} className="rounded-lg px-3 py-2 text-xs">
          {tests.map((t) => <option key={t.id} value={t.id}>{t.title}{t.subCategory ? ' — ' + t.subCategory : ''} {t.isDemo ? '(Free Demo)' : ''}{(t.adminUnlocked && !t.isDemo) ? '(Unlocked for Enrolled)' : ''}{(!t.isDemo && typeof t.order === 'number') ? ` [Order: ${t.order}]` : ''}</option>)}
        </select>
        <button onClick={addNewMockTest} className="btn-ghost rounded-lg px-3 py-2 text-xs font-bold">+ New Test</button>
        {test && (
          <>
            <button onClick={toggleDemoFlag} className="btn-ghost rounded-lg px-3 py-2 text-xs font-bold">{test.isDemo ? 'Mark as Premium' : 'Mark as Free Demo'}</button>
            <button onClick={toggleAdminUnlock} className="btn-ghost rounded-lg px-3 py-2 text-xs font-bold">{test.adminUnlocked ? 'Lock This Test' : 'Unlock for Enrolled Students'}</button>
            <button onClick={editTestMeta} className="btn-ghost rounded-lg px-3 py-2 text-xs font-bold">Edit Test Info</button>
            {!test.isDemo && (
              <button onClick={setPaidMockOrder} className="btn-ghost rounded-lg px-3 py-2 text-xs font-bold">
                Set Display Order{typeof test.order === 'number' ? ` (${test.order})` : ''}
              </button>
            )}
            <button onClick={() => printOfflinePaper(test)} className="btn-ghost rounded-lg px-3 py-2 text-xs font-bold flex items-center gap-1"><Printer className="w-3.5 h-3.5" />Print / Export Offline Paper</button>
            <button onClick={deleteTest} className="rounded-lg px-3 py-2 text-xs font-bold bg-red-600 text-white flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" />Delete Test</button>
          </>
        )}
      </div>
      {subject === OMR_SUBJECT && test && (
        <div className="card2 rounded-xl p-4 mb-4">
          <p className="text-xs font-bold muted uppercase mb-1">Offline / OMR Question Sets</p>
          <p className="text-[11px] muted mb-3">
            {test.questions.length
              ? `4 sets (A–D) are generated automatically from the ${test.questions.length} questions below. Every set is jumbled independently — the questions are re-ordered and the options shuffled — so no set follows the order you uploaded. Tap a set to open its printable booklet, then choose "Save as PDF" (paper size A4). Finish adding or editing questions BEFORE printing — adding or deleting a question changes the sets.`
              : 'Add questions to this test (manually or with Bulk Upload) and the 4 sets (A–D) will be generated automatically.'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {OMR_SET_LETTERS.map((L) => (
              <button key={L} disabled={!test.questions.length} onClick={() => printOmrBooklet(test, L)} className="btn-gold rounded-lg px-2 py-2 text-xs font-bold flex flex-col items-center gap-0.5 disabled:opacity-40 disabled:cursor-not-allowed">
                <span className="flex items-center gap-1"><FileDown className="w-3.5 h-3.5" />Set {L} PDF</span>
                <span className="text-[10px] font-normal">Booklet {bookletNumber(test.id, L)}</span>
              </button>
            ))}
          </div>
          <button onClick={setOmrRollDigits} className="btn-ghost rounded-lg px-3 py-2 text-xs font-bold">Roll No. digits: {test.omrRollDigits || DEFAULT_ROLL_DIGITS} (from phone number)</button>
        </div>
      )}
      {test ? <QuestionEditor test={test} onChangeQuestions={updateTestQuestions} /> : <p className="muted text-sm">No tests in this subject yet.</p>}
    </div>
  );
}
