import type { Employee, Shift } from '../types';
import { getWeekStartDate, getDateFromDay } from '../logic/rosterUtils';
import kitchenData from './teams/kitchen.json';
import frontDeskData from './teams/front-desk.json';

export interface TeamData {
  teamName: string;
  employees: Employee[];
  shifts: Shift[];
}

interface RawEmployee {
  name: string;
  roles?: string[];
  unavailableSlots?: {
    days?: string[];
    dateFrom?: string;
    dateTo?: string;
    timeRanges?: { startTime: string; endTime: string }[];
  }[];
}

interface RawTeam {
  teamName: string;
  employees: RawEmployee[];
}

export const TEAM_NAMES = ['Kitchen', 'Front Desk', 'All Teams'];

function loadTeam(raw: RawTeam): TeamData {
  const weekStart = getWeekStartDate(new Date());
  const employees: Employee[] = raw.employees.map(e => ({
    id: crypto.randomUUID(),
    name: e.name,
    roles: e.roles || [],
    unavailableSlots: (e.unavailableSlots || []).map(s => ({
      days: s.days as Employee['unavailableSlots'][0]['days'],
      dateFrom: s.dateFrom,
      dateTo: s.dateTo,
      timeRanges: s.timeRanges,
    })),
  }));

  return { teamName: raw.teamName, employees, shifts: [] };
}

const kitchenTeam = loadTeam(kitchenData as RawTeam);
const frontDeskTeam = loadTeam(frontDeskData as RawTeam);

export function getTeamData(teamName: string): TeamData {
  switch (teamName) {
    case 'Kitchen':
      return { ...kitchenTeam, employees: [...kitchenTeam.employees] };
    case 'Front Desk':
      return { ...frontDeskTeam, employees: [...frontDeskTeam.employees] };
    case 'All Teams':
      return {
        teamName: 'All Teams',
        employees: [...kitchenTeam.employees, ...frontDeskTeam.employees],
        shifts: [],
      };
    default:
      return kitchenTeam;
  }
}
