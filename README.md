# Shift Roster Builder

A web application for managers to create and manage weekly staff schedules for small teams. Built as a take-home coding challenge.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser. Click **"Load Sample Data"** to see the app populated with demo employees and shifts (including intentional conflicts).

## Design Decisions

### Data Model

Two core entities with a 1:N relationship:

- **Employee** — `id`, `name`, `roles[]`. Roles are free-form strings (e.g. "Cashier", "Cook") displayed as colored badges.
- **Shift** — `id`, `employeeId`, `day` (enum), `startTime`, `endTime`. Time stored as `HH:MM` strings since all data lives in-memory with no timezone concerns.

The model is intentionally flat. No teams, departments, or shift templates — the assignment brief describes a "small team" scenario, and adding hierarchy before it's needed would violate YAGNI.

### Why Context + useReducer Instead of Redux or Zustand

The state shape is shallow (employees + shifts + week date), there are exactly 7 actions, and only a handful of components consume the state. Context + useReducer is zero-dependency, TypeScript-native, and sufficient for this scale. If the app grew to need middleware or devtools, migrating to Zustand would be trivial since the reducer pattern maps directly.

### Why CSS Grid (Not a Calendar Library)

The requirement explicitly bans scheduling libraries. A custom CSS Grid with 8 columns (1 for employee names, 7 for days) gives full control over cell rendering. Libraries like React Big Calendar or FullCalendar are optimized for date-range views and would fight the "employees-as-rows" layout that a roster demands.

### Conflict Detection as Pure Functions

Conflicts are derived state, not stored state. `detectAllConflicts(shifts)` is a synchronous pure function returning `Conflict[]`. Components call it on every render — for a small team (<50 employees), the O(n^2) pairwise comparison is imperceptible.

Two conflict types implemented:

1. **Time overlap** — same employee, same day, two shifts where `a.start < b.end && b.start < a.end`. Handles partial overlap, complete containment, and back-to-back (boundary-touching is NOT a conflict).
2. **Consecutive days > 5** — sliding window over Monday→Sunday order. If an employee works 6 or 7 consecutive days, all shifts in that streak are flagged.

### Architecture: Layered Without a Backend

```
types/   → Shared interfaces (zero runtime code)
logic/   → Pure functions (testable without React)
context/ → State management (single source of truth)
components/ → UI layer (reads state, dispatches actions)
```

Components never mutate state directly. All changes go through `dispatch(action)`, making the data flow predictable and debuggable.

### UI/UX Choices

- **Tailwind CSS** for consistent design tokens and zero-runtime styles.
- **Portal-based modals** render to `document.body` to avoid z-index issues.
- **Color-coded conflict cells** (red border + pink background) make violations scannable at a glance.
- **Hover reveal** for empty cell "+" buttons keeps the grid clean when not in use.
- **Sticky header** on the week navigator so controls are always accessible during scroll.
- **Empty states** with clear calls-to-action instead of blank screens.

## Project Structure

```
src/
├── types/index.ts                # Employee, Shift, Conflict, DayOfWeek
├── data/sampleData.ts            # 4 employees + ~20 shifts with demo conflicts
├── logic/
│   ├── conflictDetector.ts       # Overlap + consecutive day detection
│   ├── hourCalculator.ts         # Time parsing and hours aggregation
│   └── rosterUtils.ts            # Date helpers, groupBy, grid utilities
├── context/RosterContext.tsx      # Context + useReducer + all actions
└── components/
    ├── Header.tsx                # App title + week navigation
    ├── ConflictBanner.tsx        # Yellow warning bar when conflicts exist
    ├── EmployeeManager/           # Employee CRUD (list, card, form modal)
    ├── RosterGrid/               # Weekly grid, cells, badges, shift form
    ├── SummaryPanel/              # Total hours table per employee
    └── ui/                       # Primitive components (Button, Dialog, etc.)
```

## Known Limitations & Future Improvements

- **Cross-week consecutive days** — currently only checks within a single Mon-Sun window. An employee working Friday-Wednesday would not be caught.
- **Overnight shifts** — shifts ending after midnight are not explicitly handled. Would need a `nextDay` flag or endTime comparison.
- **Undo/redo** — the reducer pattern makes this straightforward to add with an action history stack.
- **Persistence** — all data is in-memory. `localStorage` would be the natural first step.
- **Mobile layout** — the 8-column grid does not collapse gracefully on narrow screens.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v4 |
| State | Context + useReducer |
| Dependencies | Zero runtime dependencies beyond React |
