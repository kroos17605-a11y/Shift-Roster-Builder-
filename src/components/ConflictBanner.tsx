import { useState, useMemo } from 'react';
import { useRoster } from '../context/RosterContext';
import { detectAllConflicts } from '../logic/conflictDetector';
import { getWeekStartDate } from '../logic/rosterUtils';
import { recommendFixes, type FixRecommendation } from '../logic/recommendFix';
import { Button } from './ui/button';

export function ConflictBanner() {
  const { state, dispatch } = useRoster();
  const [expanded, setExpanded] = useState(false);
  // allFixes = global solution from "Recommend All"
  const [allFixes, setAllFixes] = useState<FixRecommendation[]>([]);
  // singleFixes = per-conflict fixes from individual "Find fix", keyed by conflict signature
  const [singleFixes, setSingleFixes] = useState<Record<string, FixRecommendation[]>>({});
  const [attemptedConflicts, setAttemptedConflicts] = useState<Set<string>>(new Set());

  const allConflicts = useMemo(() => detectAllConflicts(state.shifts, state.employees), [state.shifts, state.employees]);
  if (allConflicts.length === 0) return null;

  const overlapCount = allConflicts.filter(c => c.type === 'overlap').length;
  const consecCount = allConflicts.filter(c => c.type === 'consecutive_days').length;
  const unavailCount = allConflicts.filter(c => c.type === 'unavailable').length;

  const getShiftWeek = (shiftId: string): string => {
    const s = state.shifts.find(sh => sh.id === shiftId);
    return s ? getWeekStartDate(new Date(s.date + 'T00:00:00')) : state.weekStartDate;
  };

  const getConflictWeeks = (conflict: typeof allConflicts[0]): string[] => {
    const weeks = new Set<string>();
    for (const sid of conflict.involvedShiftIds) weeks.add(getShiftWeek(sid));
    return [...weeks].sort();
  };

  const conflictKey = (c: typeof allConflicts[0]) => c.involvedShiftIds.slice().sort().join(',');

  const navigateToConflict = (conflict: typeof allConflicts[0]) => {
    const ws = getShiftWeek(conflict.involvedShiftIds[0]);
    dispatch({ type: 'HIGHLIGHT_SHIFTS', payload: { shiftIds: conflict.involvedShiftIds } });
    dispatch({ type: 'SET_WEEK', payload: { weekStartDate: ws } });
    setTimeout(() => dispatch({ type: 'CLEAR_HIGHLIGHTS' }), 5000);
  };

  const applyFix = (rec: FixRecommendation) => {
    dispatch({ type: 'UPDATE_SHIFT', payload: { id: rec.shiftId, employeeId: rec.targetEmployeeId } });
    if (rec.swapShiftId) {
      const originalEmpId = state.shifts.find(s => s.id === rec.shiftId)?.employeeId;
      if (originalEmpId) {
        dispatch({ type: 'UPDATE_SHIFT', payload: { id: rec.swapShiftId, employeeId: originalEmpId } });
      }
    }
  };

  // ---- Single conflict "Find fix" ----
  const handleFindFix = (conflict: typeof allConflicts[0]) => {
    const shiftWeek = getShiftWeek(conflict.involvedShiftIds[0]);
    const recs = recommendFixes([conflict], state.employees, state.shifts, shiftWeek, conflict);
    const key = conflictKey(conflict);
    setSingleFixes(prev => ({ ...prev, [key]: recs }));
    setAttemptedConflicts(prev => new Set(prev).add(key));
  };

  const handleApplySingle = (rec: FixRecommendation, conflict: typeof allConflicts[0]) => {
    applyFix(rec);
    const key = conflictKey(conflict);
    setSingleFixes(prev => {
      const updated = (prev[key] || []).filter(r => r !== rec);
      const next = { ...prev, [key]: updated };
      if (updated.length === 0) delete next[key];
      return next;
    });
  };

  // ---- Global "Recommend All" ----
  const handleRecommendAll = () => {
    const shiftWeek = getShiftWeek(allConflicts[0].involvedShiftIds[0]);
    // Run solver once on all conflicts in the first conflict's week
    const allRecs = recommendFixes(allConflicts, state.employees, state.shifts, shiftWeek);
    setAllFixes(allRecs);
    // Clear single fixes since we have a global solution
    setSingleFixes({});
  };

  const handleApplyAll = () => {
    for (const rec of allFixes) applyFix(rec);
    setAllFixes([]);
  };

  // ---- Helpers ----
  const conflictEmps = new Map<string, string>();
  allConflicts.forEach(c => {
    const emp = state.employees.find(e => e.id === c.employeeId);
    conflictEmps.set(c.employeeId, emp?.name || 'Unknown');
  });

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      {/* Collapsed header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full max-w-7xl mx-auto px-4 py-2 flex items-center gap-2 text-sm cursor-pointer hover:bg-amber-100/50 transition-colors"
      >
        <span className="text-amber-500">&#9888;</span>
        <span className="font-medium text-amber-800">{allConflicts.length} conflict{allConflicts.length > 1 ? 's' : ''}</span>
        {overlapCount > 0 && <span className="text-xs text-amber-700 bg-amber-200/50 px-1.5 py-0.5 rounded">{overlapCount} overlap</span>}
        {consecCount > 0 && <span className="text-xs text-amber-700 bg-amber-200/50 px-1.5 py-0.5 rounded">{consecCount} consecutive days</span>}
        {unavailCount > 0 && <span className="text-xs text-red-700 bg-red-200/50 px-1.5 py-0.5 rounded">{unavailCount} unavailable</span>}
        <span className="text-xs text-amber-500 ml-auto">{expanded ? '▲ Collapse' : '▼ Expand'}</span>
      </button>

      {expanded && (
        <div className="max-w-7xl mx-auto px-4 pb-3 space-y-3">
          {/* ===== GLOBAL SOLUTION BAR ===== */}
          <div className="bg-white rounded-lg border border-cyan-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Button variant="secondary" size="sm" onClick={handleRecommendAll}>Recommend All</Button>
              {allFixes.length > 0 && (
                <Button variant="primary" size="sm" onClick={handleApplyAll}>Apply All ({allFixes.length})</Button>
              )}
              {allFixes.length > 0 && (
                <span className="text-xs text-emerald-600 font-medium">{allFixes.length} step{allFixes.length > 1 ? 's' : ''} to resolve all conflicts</span>
              )}
            </div>

            {allFixes.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-1">Complete solution plan:</p>
                {allFixes.map((rec, ri) => (
                  <div key={ri} className="flex items-center justify-between gap-2 py-1 pl-2 border-l-2 border-cyan-300">
                    <div className="flex-1">
                      <span className="text-[11px] text-slate-400 font-mono mr-1.5">Step {ri + 1}</span>
                      <span className="text-xs text-slate-700">{rec.action}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===== INDIVIDUAL CONFLICTS ===== */}
          {allConflicts.map((c, ci) => {
            const empName = conflictEmps.get(c.employeeId) || 'Unknown';
            const key = conflictKey(c);
            const fixes = singleFixes[key] || [];
            const wasAttempted = attemptedConflicts.has(key);
            const weeks = getConflictWeeks(c);

            return (
              <div key={ci} className="bg-white rounded-lg border border-amber-200 p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{empName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>
                    {weeks.length > 1 && (
                      <p className="text-xs text-purple-600 bg-purple-50 border border-purple-100 rounded px-2 py-1 mt-1">
                        Cross-week: {weeks.length} weeks involved. Also in: {weeks.slice(1).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => navigateToConflict(c)}>Go to week</Button>
                    <Button variant="secondary" size="sm" onClick={() => handleFindFix(c)}>Find fix</Button>
                  </div>
                </div>

                {fixes.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <p className="text-xs font-medium text-emerald-700 mb-1.5">
                      {fixes.length} step{fixes.length > 1 ? 's' : ''} to fix:
                    </p>
                    {fixes.map((rec, ri) => (
                      <div key={ri} className="flex items-center justify-between gap-2 py-1">
                        <p className="text-xs text-slate-600">{rec.action}</p>
                        <Button variant="primary" size="sm" onClick={() => handleApplySingle(rec, c)}>Apply</Button>
                      </div>
                    ))}
                  </div>
                )}

                {wasAttempted && fixes.length === 0 && (
                  <p className="mt-2 text-xs text-slate-400 italic">No safe fix found. Try Recommend All or manual adjust.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
