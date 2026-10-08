'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { isExemptEmail } from '../../lib/utils';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT = MONTHS.map((m) => m.slice(0, 3));
// Fees are saved on each student's own record as { '2026-03': '2026-03-14', ... } — a month is
// "paid" when its key exists (the value is just the date it was marked paid).
const monthKey = (year, i) => `${year}-${String(i + 1).padStart(2, '0')}`;

export default function FeesManager() {
  const { DB, saveDB } = useApp();
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [query, setQuery] = useState('');
  const [mailStatus, setMailStatus] = useState(null); // { ok, text } — result of the thank-you email
  const [pending, setPending] = useState(null); // { student, i } — month waiting for a batch to be chosen
  const [pickedBatchId, setPickedBatchId] = useState('');
  const years = [thisYear - 2, thisYear - 1, thisYear, thisYear + 1];

  // Same list as the Students List page: registered students only (pending reviews and the
  // exempt mentor/admin accounts are left out).
  const listed = (DB.students || []).filter((s) => !s.pendingReview && !isExemptEmail(s.email));
  const q = query.trim().toLowerCase();
  const shown = q
    ? listed.filter((s) => (s.name || '').toLowerCase().includes(q) || String(s.phone || '').includes(q))
    : listed;

  // Running batches the admin can choose from when marking a month as paid.
  const activeBatches = (DB.batches || []).filter((b) => b.active !== false);

  const isPaid = (s, i) => Boolean(s.feePaid && s.feePaid[monthKey(year, i)]);

  // After a month is marked PAID, send the same "Payment Confirmed" thank-you email that a
  // successful Razorpay payment sends. The amount is the price of the batch the admin picked.
  const sendFeeEmail = async (student, monthLabel, batch) => {
    if (!student.email) {
      setMailStatus({ ok: false, text: `Fee marked as paid, but no email was sent: ${student.name} has no email address on file.` });
      return;
    }
    setMailStatus({ ok: true, text: `Fee saved. Sending thank-you email to ${student.name}…` });
    try {
      const res = await fetch('/api/email/fee-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name: student.name, email: student.email, batchName: batch.name, amount: batch.price, monthLabel }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setMailStatus({ ok: true, text: `Fee marked as paid and thank-you email sent to ${student.name}.` });
      else setMailStatus({ ok: false, text: `Fee marked as paid, but the email to ${student.name} was not sent: ${data.error || 'unknown error'}` });
    } catch (e) {
      setMailStatus({ ok: false, text: `Fee marked as paid, but the email to ${student.name} was not sent (no connection to the server).` });
    }
  };

  // Writes the paid / unpaid state of one month on the student's record (unchanged logic).
  const saveMonth = (student, i, makePaid) => {
    const key = monthKey(year, i);
    const today = new Date().toISOString().slice(0, 10);
    saveDB((prev) => ({
      ...prev,
      students: prev.students.map((s) => {
        if (s.id !== student.id) return s;
        const feePaid = { ...(s.feePaid || {}) };
        if (makePaid) feePaid[key] = today; else delete feePaid[key];
        return { ...s, feePaid };
      }),
    }));
  };

  const toggleMonth = (student, i) => {
    if (isPaid(student, i)) {
      if (!confirm(`Mark ${MONTHS[i]} ${year} as UNPAID for ${student.name}?`)) return;
      saveMonth(student, i, false);
      return;
    }
    // Marking as paid: first ask which batch this payment is for (nothing is saved until OK).
    const current = activeBatches.find((b) => b.name === student.batch);
    setPickedBatchId(current ? current.id : '');
    setPending({ student, i });
  };

  const closePicker = () => setPending(null); // Cancel / close: the month stays unpaid

  const confirmPaid = () => {
    const batch = activeBatches.find((b) => b.id === pickedBatchId);
    if (!pending || !batch) return;
    const { student, i } = pending;
    setPending(null);
    saveMonth(student, i, true);
    sendFeeEmail(student, `${MONTHS[i]} ${year}`, batch);
  };

  const exportFeesExcel = () => {
    const rows = listed.map((s, i) => {
      const row = { SerialNo: i + 1, Name: s.name, Phone: s.phone };
      let total = 0;
      MONTHS.forEach((m, mi) => {
        const paid = isPaid(s, mi);
        if (paid) total += 1;
        row[m] = paid ? 'Paid' : 'Unpaid';
      });
      row['Total Paid'] = total;
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Fees ${year}`);
    XLSX.writeFile(wb, `TCE_Monthly_Fees_${year}.xlsx`);
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <p className="text-sm muted">{listed.length} registered students · Year</p>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-lg px-3 py-2 text-xs">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={exportFeesExcel} className="btn-gold rounded-lg px-3 py-2 text-xs font-bold flex items-center gap-1.5">
          <FileSpreadsheet className="w-3.5 h-3.5" />Export to Excel
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="w-3.5 h-3.5 muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query} onChange={(e) => setQuery(e.target.value)} type="text"
          placeholder="Search by name or phone"
          className="w-full rounded-lg pl-9 pr-3 py-2 text-xs"
        />
      </div>

      {mailStatus && (
        <p className={`text-xs mb-3 ${mailStatus.ok ? 'text-emerald-400' : 'text-red-400'}`}>{mailStatus.text}</p>
      )}

      {shown.length === 0 && <p className="text-xs muted text-center py-8">{listed.length === 0 ? 'No registered students yet.' : 'No student matches your search.'}</p>}

      <div className="space-y-3">
        {shown.map((s) => {
          const paidCount = MONTHS.reduce((n, m, i) => n + (isPaid(s, i) ? 1 : 0), 0);
          return (
            <div key={s.id} className="card rounded-xl p-3">
              <div className="flex justify-between items-start gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{s.name}</p>
                  <p className="text-[11px] muted">{s.phone || '-'}</p>
                </div>
                <span className="badge bg-emerald-500/20 text-emerald-400 shrink-0">{paidCount}/12 paid · {year}</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
                {MONTHS.map((m, i) => {
                  const paid = isPaid(s, i);
                  return (
                    <button
                      key={m}
                      onClick={() => toggleMonth(s, i)}
                      aria-pressed={paid}
                      title={`${m} ${year}: ${paid ? 'Paid' : 'Unpaid'} (tap to change)`}
                      className={`rounded-md border px-1 py-2 text-[11px] font-bold ${paid ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-gray-500/10 muted'}`}
                      style={paid ? undefined : { borderColor: 'var(--border)' }}
                    >
                      {SHORT[i]}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={closePicker}
          role="dialog" aria-modal="true" aria-label="Select batch"
        >
          <div
            className="card rounded-2xl p-5 w-full max-w-sm"
            style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-bold">Mark {MONTHS[pending.i]} {year} as paid</p>
            <p className="text-[11px] muted mb-3">for {pending.student.name}</p>
            <p className="text-xs font-bold muted uppercase mb-2">Select batch</p>
            {activeBatches.length === 0 && <p className="text-xs muted py-3">No active batches found. Add one in the Batches tab first.</p>}
            <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
              {activeBatches.map((b) => {
                const on = pickedBatchId === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => setPickedBatchId(b.id)}
                    aria-pressed={on}
                    className={`w-full flex justify-between items-center gap-3 rounded-lg border px-3 py-2.5 text-xs font-bold text-left ${on ? 'gold-grad text-ink border-transparent' : ''}`}
                    style={on ? undefined : { borderColor: 'var(--border)' }}
                  >
                    <span className="min-w-0 truncate">{b.name}</span>
                    <span className="shrink-0">₹{b.price}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] muted mb-3">
              {pending.student.email ? `A thank-you email will be sent to ${pending.student.email}.` : 'No email on file for this student, so no email will be sent.'}
            </p>
            <div className="flex gap-2">
              <button onClick={closePicker} className="flex-1 btn-ghost rounded-lg py-2 text-xs font-bold">Cancel</button>
              <button onClick={confirmPaid} disabled={!pickedBatchId} className="flex-1 btn-gold rounded-lg py-2 text-xs font-bold disabled:opacity-50">Confirm Paid</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
