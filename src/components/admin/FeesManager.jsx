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
  const years = [thisYear - 2, thisYear - 1, thisYear, thisYear + 1];

  // Same list as the Students List page: registered students only (pending reviews and the
  // exempt mentor/admin accounts are left out).
  const listed = (DB.students || []).filter((s) => !s.pendingReview && !isExemptEmail(s.email));
  const q = query.trim().toLowerCase();
  const shown = q
    ? listed.filter((s) => (s.name || '').toLowerCase().includes(q) || String(s.phone || '').includes(q))
    : listed;

  const isPaid = (s, i) => Boolean(s.feePaid && s.feePaid[monthKey(year, i)]);

  // After a month is marked PAID, send the same "Payment Confirmed" thank-you email that a
  // successful Razorpay payment sends (the server route does the sending).
  const sendFeeEmail = async (student, monthLabel) => {
    if (!student.email) {
      setMailStatus({ ok: false, text: `Fee marked as paid, but no email was sent: ${student.name} has no email address on file.` });
      return;
    }
    const batch = (DB.batches || []).find((b) => b.name === student.batch);
    const amount = batch && batch.price != null ? batch.price : student.paidAmount;
    if (!(Number(amount) > 0)) {
      setMailStatus({ ok: false, text: `Fee marked as paid, but no email was sent: no batch fee amount is on file for ${student.name}.` });
      return;
    }
    setMailStatus({ ok: true, text: `Fee saved. Sending thank-you email to ${student.name}…` });
    try {
      const res = await fetch('/api/email/fee-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name: student.name, email: student.email, batchName: student.batch, amount, monthLabel }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setMailStatus({ ok: true, text: `Fee marked as paid and thank-you email sent to ${student.name}.` });
      else setMailStatus({ ok: false, text: `Fee marked as paid, but the email to ${student.name} was not sent: ${data.error || 'unknown error'}` });
    } catch (e) {
      setMailStatus({ ok: false, text: `Fee marked as paid, but the email to ${student.name} was not sent (no connection to the server).` });
    }
  };

  const toggleMonth = (student, i) => {
    const key = monthKey(year, i);
    const paid = isPaid(student, i);
    const msg = paid
      ? `Mark ${MONTHS[i]} ${year} as UNPAID for ${student.name}?`
      : `Are you sure you want to mark ${MONTHS[i]} ${year} as paid for ${student.name}?`;
    if (!confirm(msg)) return;
    const today = new Date().toISOString().slice(0, 10);
    saveDB((prev) => ({
      ...prev,
      students: prev.students.map((s) => {
        if (s.id !== student.id) return s;
        const feePaid = { ...(s.feePaid || {}) };
        if (paid) delete feePaid[key]; else feePaid[key] = today;
        return { ...s, feePaid };
      }),
    }));
    if (!paid) sendFeeEmail(student, `${MONTHS[i]} ${year}`); // only when marking as paid, never when undoing
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
    </div>
  );
}
