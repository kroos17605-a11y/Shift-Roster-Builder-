# Shift Roster Builder

A web application for managers to create and manage weekly staff schedules for small teams.

Built for the internship coding challenge — **Option A: Shift Roster Builder**.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173. The app loads with demo data on first launch.

---

## Core Requirements

### 1. Add, edit, and remove employees (each has a name and one or more roles)

Roles are comma-separated free-text input (e.g. `Supervisor, Cashier`). Employees appear as cards in the left sidebar with role badges.

![Employee management](screenshots/04-add-employee.png)

**Design**: Each employee is a `{ id, name, roles: string[] }` object. Role matching for shift swaps uses exact set comparison (sorted array equality). The sidebar always displays an empty state guiding the user to add their first employee.

### 2. Assign an employee to a specific day and time slot

Click any cell in the weekly grid (or the "+" icon on hover) to open the shift assignment form. Select employee, day, start/end time.

![Assign shift](screenshots/01-main-roster.png)

**Design**: Shifts store a concrete calendar date (`YYYY-MM-DD`) computed from `weekStartDate + day offset`, enabling week-independent filtering. Time is stored as `HH:MM` strings — no timezone concerns since data lives in-memory.

### 3. Display all assignments in a weekly grid (days as columns, employees as rows)

An 8-column CSS Grid: fixed employee name column + 7 equal day columns. The grid renders shift badges showing time ranges. Empty cells show a hover-activated "+" button.

![Weekly grid](screenshots/01-main-roster.png)

**Design**: CSS Grid (`grid-template-columns: 180px repeat(7, 1fr)`) rather than `<table>` — matches the "employees as rows" layout that a roster demands. No third-party calendar library used (requirement §3).

### 4. Detect and visually flag conflicts

Three conflict types detected globally across all weeks:

| Type | Detection | Visual |
|------|-----------|--------|
| **Overlap** | Same employee, same date, `a.start < b.end && b.start < a.end` | Red border + pink background on cell |
| **Consecutive days (>5)** | Calendar-date-based sliding window, works across week boundaries | Red border + pink background |
| **Unavailable** | Shift falls within an employee's unavailability rule | Red border + pink background |

The amber conflict banner shows collapsed counts by type. Expand to see details, navigate to affected weeks, or run the solver.

![Conflicts](screenshots/02-conflicts-expanded.png)

**Design**: Conflicts are **derived state** — `detectAllConflicts(shifts, employees)` is a pure function called on render. No stored redundancy. Consecutive-day detection uses calendar dates (not day-of-week) so Fri-Sun + Mon-Wed = 6 days is correctly caught.

### 5. Show a summary panel (total hours per employee for the week)

Dark footer table with per-employee hours, shift counts, and role info. Color-coded: <20h gray, 20-40h green, 40-48h yellow, 48h+ red.

![Summary](screenshots/06-summary-panel.png)

---

## Bonus Features

### Drag-and-drop reassignment

Grab any shift badge and drag it to a different cell. Uses `@dnd-kit` with a 5px activation distance (prevents accidental drag on click). Collision detection uses `pointerWithin` for cross-day dragging. Only same-role employees can receive dragged shifts.

### Employee availability preferences

Edit any employee to set **Unavailability Rules** — each rule has:
- **Date range** (from/to, blank = forever)
- **Days of week** (toggle Mon-Sun, blank = every day)
- **Time ranges** (multiple, blank = all day)

Click an employee card to expand and see their rules inline without opening edit mode.

![Unavailability](screenshots/05-employee-detail.png)

**Design**: `UnavailableSlot[]` on Employee. `isAvailable()` checks date range → day-of-week → time overlap. Unavailability violations are flagged as a third conflict type.

### CSV export of the weekly roster

Click **Export** in the toolbar, customize the filename, and download a CSV.

![Export](screenshots/08-export-csv.png)

**Design**: Pure string generation — no library needed. Handles multi-shift cells with semicolon separators.

### Mobile-responsive layout

On narrow screens (<1024px), the sidebar stacks above the grid, and the grid scrolls horizontally. All modals remain full-width.

---

## Extra: AI-Powered Conflict Resolution

The most significant extension beyond requirements is a constraint-satisfaction solver for automatic shift reassignment.

### Problem Modeling

```
State: complete shift-to-employee assignments
Cost: overlap×100 + consecutive_days×50 + unavailable×50
Goal: find the minimum-step sequence to cost=0
```

### Algorithm: Hill-Climbing with Random Restarts

1. **Neighbor generation**: for each conflicted shift, generate all valid same-day moves and swaps to same-role employees
2. **Cost evaluation**: each candidate is scored by the global conflict count after the move
3. **Acceptance**: accept if cost decreases; accept with 50% probability if cost stays same (plateau escape)
4. **Multi-trial**: run 8 independent trials with random seeds, pick the shortest solution

### Two Modes

- **Recommend All** — solves all conflicts globally, outputs a complete step-by-step plan. Apply All executes the entire plan.
- **Find Fix** — targeted single-conflict resolution, returns minimal steps without introducing new conflicts.

![Recommend All](screenshots/03-recommend-all.png)

### Constraints

- Same-day only (no time modification)
- Exact role-set match (sorted role arrays must be identical)
- Availability check for both sides of every swap
- No new conflicts introduced

---

## Project Structure

```
src/
├── types/index.ts              # Employee, Shift, Conflict, DayOfWeek, etc.
├── data/
│   ├── sampleData.ts           # Demo data with 6 employees, cross-week conflicts
│   ├── teamApi.ts              # HTTP client for team file API
│   ├── teamLoader.ts           # Built-in team templates (Kitchen, Front Desk)
│   └── teams/                  # JSON templates
├── logic/
│   ├── conflictDetector.ts     # Overlap, consecutive-days, unavailable detection
│   ├── hourCalculator.ts       # Time math and weekly summaries
│   ├── rosterUtils.ts          # Date helpers, availability check, CSV generation
│   └── recommendFix.ts         # Hill-climbing solver with random restarts
├── context/RosterContext.tsx    # State management (Context + useReducer, 12 actions)
├── components/
│   ├── Header.tsx              # Week navigation, team selector, toolbar
│   ├── ConflictBanner.tsx      # Expandable conflict panel with solver UI
│   ├── EmployeeManager/        # Employee CRUD (list, card, form modal)
│   ├── RosterGrid/             # WeeklyGrid, ShiftCell, ShiftBadge, ShiftFormModal
│   ├── SummaryPanel/           # Per-employee hours table
│   ├── CopyWeekModal.tsx       # Date-range schedule copy with day filter
│   ├── ClearRangeModal.tsx     # Bulk shift deletion
│   ├── ExportModal.tsx         # CSV export with filename input
│   ├── MiniCalendar.tsx        # Reusable calendar date range picker
│   ├── HelpModal.tsx           # User manual
│   ├── ErrorBoundary.tsx       # React crash recovery
│   └── ui/                     # Primitives (Button, Dialog, Badge, Input, Select)
└── App.tsx                     # Root layout
```

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v4 |
| State | Context + useReducer |
| Drag & Drop | @dnd-kit/core |
| Persistence | Vite plugin → JSON files in `data/teams/` |
| Screenshots | Puppeteer |

---

## Data Flow

```
User Action → dispatch(action) → reducer → newState
                                    ↓
                              autoSave (POST /api/teams)
                                    ↓
                            data/teams/<name>.json
```

All mutations go through the reducer. Auto-save fires on every state change. Manual **Save** button in toolbar for explicit saves. Team switching saves the current team before loading the next.
