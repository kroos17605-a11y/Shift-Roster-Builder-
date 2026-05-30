import type { Conflict, Employee, Shift } from '../types';
import { getShiftsForWeek, isAvailable } from './rosterUtils';
import { detectAllConflicts } from './conflictDetector';

export interface FixRecommendation {
  conflict: Conflict;
  action: string;
  type: 'move' | 'swap';
  shiftId: string;
  targetEmployeeId: string;
  swapShiftId?: string;
}

interface Candidate {
  type: 'move' | 'swap';
  shiftId: string;
  targetEmpId: string;
  swapShiftId?: string;
  cost: number;
  description: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function costOf(state: Shift[], employees: Employee[]): number {
  const conflicts = detectAllConflicts(state, employees);
  let cost = 0;
  for (const c of conflicts) {
    if (c.type === 'overlap') cost += 100;
    else if (c.type === 'consecutive_days') cost += 50;
    else if (c.type === 'unavailable') cost += 50;
  }
  return cost;
}

function applyMove(shifts: Shift[], shiftId: string, targetEmpId: string): Shift[] {
  return shifts.map(s => s.id === shiftId ? { ...s, employeeId: targetEmpId } : s);
}

function applySwap(shifts: Shift[], shiftA: string, empA: string, shiftB: string, empB: string): Shift[] {
  return shifts.map(s => {
    if (s.id === shiftA) return { ...s, employeeId: empA };
    if (s.id === shiftB) return { ...s, employeeId: empB };
    return s;
  });
}

function generateCandidates(
  currentShifts: Shift[],
  employees: Employee[],
  conflictedShiftIds: Set<string>,
  weekSet: Set<string>
): Candidate[] {
  const candidates: Candidate[] = [];
  const conflictedShifts = currentShifts.filter(s => conflictedShiftIds.has(s.id) && weekSet.has(s.id));

  for (const shift of shuffle(conflictedShifts)) {
    const otherEmps = shuffle(employees.filter(e => e.id !== shift.employeeId));
    for (const other of otherEmps) {
      const moved = applyMove(currentShifts, shift.id, other.id);
      const avail = isAvailable(other, shift.date, shift.day, shift.startTime, shift.endTime);
      if (avail.available) {
        candidates.push({
          type: 'move', shiftId: shift.id, targetEmpId: other.id,
          cost: costOf(moved, employees),
          description: `Move ${shift.startTime}-${shift.endTime} on ${shift.day} to ${other.name}`,
        });
      }

      const sameDayShifts = currentShifts.filter(
        s => s.employeeId === other.id && s.day === shift.day && s.id !== shift.id && weekSet.has(s.id)
      );
      for (const otherShift of shuffle(sameDayShifts).slice(0, 3)) {
        const swapped = applySwap(currentShifts, shift.id, other.id, otherShift.id, shift.employeeId);
        const sourceEmp = employees.find(e => e.id === shift.employeeId);
        const availA = isAvailable(other, shift.date, shift.day, shift.startTime, shift.endTime);
        const availB = sourceEmp ? isAvailable(sourceEmp, otherShift.date, otherShift.day, otherShift.startTime, otherShift.endTime) : { available: true };
        if (availA.available && availB.available) {
          candidates.push({
            type: 'swap', shiftId: shift.id, targetEmpId: other.id, swapShiftId: otherShift.id,
            cost: costOf(swapped, employees),
            description: `Swap ${shift.day} ${shift.startTime}-${shift.endTime} ↔ ${other.name}'s ${otherShift.startTime}-${otherShift.endTime}`,
          });
        }
      }
    }
  }
  return candidates;
}

function isTargetResolved(conflicts: Conflict[], target: Conflict): boolean {
  const key = [...target.involvedShiftIds].sort().join(',');
  return !conflicts.some(c =>
    c.employeeId === target.employeeId && c.type === target.type &&
    [...c.involvedShiftIds].sort().join(',') === key
  );
}

/** Run one trial of the solver, return the sequence of steps and final cost */
function runTrial(
  allShifts: Shift[],
  employees: Employee[],
  weekSet: Set<string>,
  targetConflict?: Conflict,
  MAX_ITERS = 50
): { steps: FixRecommendation[]; finalCost: number } {
  let currentShifts = allShifts.map(s => ({ ...s }));
  let currentCost = costOf(currentShifts, employees);
  const steps: FixRecommendation[] = [];

  for (let iter = 0; iter < MAX_ITERS; iter++) {
    const currentConflicts = detectAllConflicts(currentShifts, employees);
    if (currentConflicts.length === 0) break;
    if (targetConflict && isTargetResolved(currentConflicts, targetConflict)) break;

    const conflictedShiftIds = new Set(currentConflicts.flatMap(c => c.involvedShiftIds));
    if (conflictedShiftIds.size === 0) break;

    const candidates = generateCandidates(currentShifts, employees, conflictedShiftIds, weekSet);
    if (candidates.length === 0) break;

    candidates.sort((a, b) => a.cost - b.cost);
    const best = candidates[0];

    const improves = best.cost < currentCost;
    const plateau = best.cost === currentCost && Math.random() < 0.5;

    if (improves || plateau) {
      if (best.type === 'move') {
        currentShifts = applyMove(currentShifts, best.shiftId, best.targetEmpId);
      } else if (best.type === 'swap' && best.swapShiftId) {
        const otherShift = currentShifts.find(s => s.id === best.swapShiftId)!;
        currentShifts = applySwap(currentShifts, best.shiftId, best.targetEmpId, best.swapShiftId, otherShift.employeeId);
      }
      currentCost = costOf(currentShifts, employees);

      const solved = currentConflicts.find(c => c.involvedShiftIds.includes(best.shiftId));
      steps.push({
        conflict: solved || currentConflicts[0],
        action: best.description,
        type: best.type,
        shiftId: best.shiftId,
        targetEmployeeId: best.targetEmpId,
        swapShiftId: best.swapShiftId,
      });
    } else {
      break;
    }
  }

  return { steps, finalCost: currentCost };
}

/**
 * Unified solver — single and global modes.
 * Runs multiple trials (random restarts) and picks the best result.
 *
 * - Single mode (targetConflict): minimal steps to resolve target, zero new conflicts.
 * - Global mode: minimal steps to resolve ALL conflicts.
 */
export function recommendFixes(
  conflicts: Conflict[],
  employees: Employee[],
  allShifts: Shift[],
  weekStart: string,
  targetConflict?: Conflict
): FixRecommendation[] {
  if (conflicts.length === 0) return [];

  const weekShifts = getShiftsForWeek(allShifts, weekStart);
  const weekSet = new Set(weekShifts.map(s => s.id));
  const TRIALS = 8;

  let bestResult: { steps: FixRecommendation[]; finalCost: number } | null = null;

  for (let t = 0; t < TRIALS; t++) {
    const result = runTrial(allShifts, employees, weekSet, targetConflict);

    if (result.finalCost === 0 && targetConflict) {
      // Single mode: success = target resolved with 0 new conflicts AND global cost didn't increase
      // In single mode, we want the solution with MINIMUM steps
      if (!bestResult || result.steps.length < bestResult.steps.length) {
        bestResult = result;
      }
    } else if (result.finalCost === 0 && !targetConflict) {
      // Global mode: success = all conflicts resolved
      if (!bestResult || result.steps.length < bestResult.steps.length) {
        bestResult = result;
      }
    } else if (!bestResult) {
      // No perfect solution yet — keep the one with lowest cost
      if (!bestResult || result.finalCost < bestResult.finalCost ||
          (result.finalCost === bestResult.finalCost && result.steps.length < bestResult.steps.length)) {
        bestResult = result;
      }
    }
  }

  return bestResult?.steps || [];
}
