import { createContext, useContext, useReducer, ReactNode } from 'react';
import type { Employee, Shift, DayOfWeek, UnavailableSlot } from '../types';
import { getWeekStartDate, getDateFromDay, getMatchingDatesInRange } from '../logic/rosterUtils';
import { saveTeam } from '../data/teamApi';
import { sampleEmployees, sampleShifts } from '../data/sampleData';

const TEAMS_LIST_KEY = 'roster_teams_list';

function loadTeamList(): string[] {
  try { const raw = localStorage.getItem(TEAMS_LIST_KEY); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
}

function saveTeamList(list: string[]) {
  try { localStorage.setItem(TEAMS_LIST_KEY, JSON.stringify(list)); } catch {}
}

interface RosterState {
  employees: Employee[];
  shifts: Shift[];
  weekStartDate: string;
  teamName: string;
  teamList: string[];
  highlightedShiftIds: string[];
}

type RosterAction =
  | { type: 'ADD_EMPLOYEE'; payload: { name: string; roles: string[]; unavailableSlots?: UnavailableSlot[] } }
  | { type: 'UPDATE_EMPLOYEE'; payload: { id: string; name: string; roles: string[]; unavailableSlots?: UnavailableSlot[] } }
  | { type: 'REMOVE_EMPLOYEE'; payload: { id: string } }
  | { type: 'ADD_SHIFT'; payload: { employeeId: string; day: DayOfWeek; date: string; startTime: string; endTime: string } }
  | { type: 'UPDATE_SHIFT'; payload: { id: string; employeeId?: string; day?: DayOfWeek; date?: string; startTime?: string; endTime?: string } }
  | { type: 'REMOVE_SHIFT'; payload: { id: string } }
  | { type: 'COPY_TO_RANGE'; payload: { fromDate: string; toDate: string; days?: DayOfWeek[] } }
  | { type: 'CLEAR_RANGE'; payload: { fromDate: string; toDate: string } }
  | { type: 'SET_WEEK'; payload: { weekStartDate: string } }
  | { type: 'LOAD_TEAM'; payload: { teamName: string; employees: Employee[]; shifts: Shift[]; teamList: string[] } }
  | { type: 'LOAD_DEMO' }
  | { type: 'LOAD_SAMPLE'; payload: { employees: Employee[]; shifts: Shift[] } }
  | { type: 'DELETE_TEAM_DONE'; payload: { teamName: string } }
  | { type: 'SET_TEAMLIST'; payload: { teamList: string[] } }
  | { type: 'HIGHLIGHT_SHIFTS'; payload: { shiftIds: string[] } }
  | { type: 'CLEAR_HIGHLIGHTS' };

function autoSave(state: RosterState) {
  if (state.teamName) {
    saveTeam(state.teamName, state.employees, state.shifts).catch(() => {});
  }
}

function rosterReducer(state: RosterState, action: RosterAction): RosterState {
  let newState: RosterState;

  switch (action.type) {
    case 'ADD_EMPLOYEE':
      newState = {
        ...state,
        employees: [...state.employees, {
          id: crypto.randomUUID(),
          name: action.payload.name,
          roles: action.payload.roles,
          unavailableSlots: action.payload.unavailableSlots || [],
        }],
      };
      break;

    case 'UPDATE_EMPLOYEE':
      newState = {
        ...state,
        employees: state.employees.map(e =>
          e.id === action.payload.id
            ? { ...e, name: action.payload.name, roles: action.payload.roles, ...(action.payload.unavailableSlots !== undefined && { unavailableSlots: action.payload.unavailableSlots }) }
            : e
        ),
      };
      break;

    case 'REMOVE_EMPLOYEE':
      newState = {
        ...state,
        employees: state.employees.filter(e => e.id !== action.payload.id),
        shifts: state.shifts.filter(s => s.employeeId !== action.payload.id),
      };
      break;

    case 'ADD_SHIFT':
      newState = {
        ...state,
        shifts: [...state.shifts, {
          id: crypto.randomUUID(),
          employeeId: action.payload.employeeId,
          date: action.payload.date,
          day: action.payload.day,
          startTime: action.payload.startTime,
          endTime: action.payload.endTime,
        }],
      };
      break;

    case 'UPDATE_SHIFT':
      newState = {
        ...state,
        shifts: state.shifts.map(s =>
          s.id === action.payload.id
            ? { ...s, ...(action.payload.employeeId !== undefined && { employeeId: action.payload.employeeId }), ...(action.payload.day !== undefined && { day: action.payload.day }), ...(action.payload.date !== undefined && { date: action.payload.date }), ...(action.payload.startTime !== undefined && { startTime: action.payload.startTime }), ...(action.payload.endTime !== undefined && { endTime: action.payload.endTime }) }
            : s
        ),
      };
      break;

    case 'COPY_TO_RANGE': {
      const [y, m, d] = state.weekStartDate.split('-').map(Number);
      const ws = new Date(y, m - 1, d);
      const we = new Date(ws);
      we.setDate(ws.getDate() + 6);
      const weStr = `${we.getFullYear()}-${String(we.getMonth() + 1).padStart(2, '0')}-${String(we.getDate()).padStart(2, '0')}`;
      const weekShifts = state.shifts.filter(s => s.date >= state.weekStartDate && s.date <= weStr);
      const { fromDate, toDate, days: filterDays } = action.payload;
      const newShifts: Shift[] = [];
      for (const s of weekShifts) {
        if (filterDays && !filterDays.includes(s.day)) continue;
        const dates = getMatchingDatesInRange(fromDate, toDate, s.day);
        for (const date of dates) {
          if (date >= state.weekStartDate && date <= weStr) continue;
          newShifts.push({ ...s, id: crypto.randomUUID(), date });
        }
      }
      newState = { ...state, shifts: [...state.shifts, ...newShifts] };
      break;
    }

    case 'REMOVE_SHIFT':
      newState = { ...state, shifts: state.shifts.filter(s => s.id !== action.payload.id) };
      break;

    case 'SET_WEEK':
      newState = { ...state, weekStartDate: action.payload.weekStartDate, highlightedShiftIds: [] };
      break;

    case 'CLEAR_RANGE':
      newState = {
        ...state,
        shifts: state.shifts.filter(s => s.date < action.payload.fromDate || s.date > action.payload.toDate),
      };
      break;

    case 'LOAD_TEAM':
      // Save current team before switching away
      if (state.teamName) {
        saveTeam(state.teamName, state.employees, state.shifts).catch(() => {});
      }
      newState = {
        ...state,
        teamName: action.payload.teamName,
        employees: [...action.payload.employees],
        shifts: [...action.payload.shifts],
        teamList: action.payload.teamList,
      };
      break;

    case 'LOAD_DEMO': {
      const tl = state.teamList.includes('Demo') ? state.teamList : [...state.teamList, 'Demo'];
      saveTeamList(tl);
      newState = { ...state, teamName: 'Demo', employees: [...sampleEmployees], shifts: [...sampleShifts], teamList: tl };
      break;
    }

    case 'LOAD_SAMPLE': {
      const tl = state.teamList.includes('Demo') ? state.teamList : [...state.teamList, 'Demo'];
      saveTeamList(tl);
      newState = { ...state, teamName: 'Demo', employees: action.payload.employees, shifts: action.payload.shifts, teamList: tl };
      break;
    }

    case 'DELETE_TEAM_DONE':
      newState = {
        employees: [],
        shifts: [],
        weekStartDate: getWeekStartDate(new Date()),
        teamName: '',
        teamList: state.teamList.filter(t => t !== action.payload.teamName),
      };
      break;

    case 'SET_TEAMLIST':
      newState = { ...state, teamList: action.payload.teamList };
      break;

    case 'HIGHLIGHT_SHIFTS':
      newState = { ...state, highlightedShiftIds: action.payload.shiftIds };
      break;

    case 'CLEAR_HIGHLIGHTS':
      newState = { ...state, highlightedShiftIds: [] };
      break;

    default:
      return state;
  }

  // Auto-save to file after every mutation
  if (newState.teamName) {
    const didMutate = newState.employees !== state.employees || newState.shifts !== state.shifts;
    if (didMutate) autoSave(newState);
  }
  return newState;
}

interface RosterContextValue {
  state: RosterState;
  dispatch: React.Dispatch<RosterAction>;
}

const RosterContext = createContext<RosterContextValue | null>(null);

export function RosterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(rosterReducer, {
    employees: [],
    shifts: [],
    weekStartDate: getWeekStartDate(new Date()),
    teamName: '',
    teamList: loadTeamList(),
    highlightedShiftIds: [],
  });

  return (
    <RosterContext.Provider value={{ state, dispatch }}>
      {children}
    </RosterContext.Provider>
  );
}

export function useRoster(): RosterContextValue {
  const ctx = useContext(RosterContext);
  if (!ctx) throw new Error('useRoster must be used within RosterProvider');
  return ctx;
}
