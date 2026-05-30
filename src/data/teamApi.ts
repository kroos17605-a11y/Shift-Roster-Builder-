import type { Employee, Shift } from '../types';

export interface TeamFile {
  teamName: string;
  employees: Employee[];
  shifts: Shift[];
}

export async function listTeams(): Promise<string[]> {
  const res = await fetch('/api/teams');
  if (!res.ok) throw new Error('Failed to list teams');
  return res.json();
}

export async function loadTeam(name: string): Promise<TeamFile> {
  const res = await fetch(`/api/teams/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error(`Failed to load team: ${name}`);
  const data = await res.json();
  const employees = (data.employees || []).map((e: any) => ({
    ...e,
    id: e.id || crypto.randomUUID(), // Ensure IDs exist for built-in templates
    unavailableSlots: e.unavailableSlots || [],
    roles: e.roles || [],
  }));
  return {
    teamName: data.name || name,
    employees,
    shifts: data.shifts || [],
  };
}

export async function saveTeam(name: string, employees: Employee[], shifts: Shift[]): Promise<void> {
  const res = await fetch('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, employees, shifts }),
  });
  if (!res.ok) throw new Error('Failed to save team');
}

export async function deleteTeamFile(name: string): Promise<void> {
  const res = await fetch(`/api/teams/${encodeURIComponent(name)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete team');
}
