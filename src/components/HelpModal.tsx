import { Dialog } from './ui/dialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-bold text-slate-800 mb-2">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Item({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-2 text-xs text-slate-600">
      <span className="text-slate-400 shrink-0 mt-0.5">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

export function HelpModal({ isOpen, onClose }: Props) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="User Manual">
      <div className="max-h-[60vh] overflow-y-auto pr-1">
        {/* ===== BASIC ===== */}
        <Section title="Basic Features (Assignment Requirements)">
          <Item icon="1." text="Add, edit, and remove employees. Each employee has a name and one or more roles (e.g. Cashier, Supervisor, Cook). Click the + Add button in the left sidebar." />
          <Item icon="2." text="Assign an employee to a specific day and time slot. Click any cell in the weekly grid or click the + icon that appears on hover." />
          <Item icon="3." text="Display all assignments in a weekly grid — days as columns, employees as rows. Use the ◀ ▶ arrows in the top bar to navigate between weeks." />
          <Item icon="4." text="Detect and visually flag conflicts: overlapping shifts on the same day, working more than 5 consecutive calendar days, and shifts assigned during unavailable hours. Conflicting cells turn red in the grid." />
          <Item icon="5." text="Show a summary panel at the bottom — total hours assigned per employee for the week." />
        </Section>

        {/* ===== BONUS ===== */}
        <Section title="Bonus Features (Stretch Goals)">
          <Item icon="✦" text="Drag-and-drop to reassign a shift to a different employee or day. Grab any shift badge and drag it to the target cell. A distance threshold prevents accidental drags on click." />
          <Item icon="✦" text="Employee availability preferences. Edit any employee and set 'Unavailability' rules: date range (empty = always), days of week (empty = every day), and time ranges (empty = all day). Multiple time ranges per rule, multiple rules per employee." />
          <Item icon="✦" text="Print-friendly CSV export. Click Export in the top bar, customize the filename, and download a CSV of the current week's roster." />
          <Item icon="✦" text="Mobile-responsive layout. On narrow screens, the sidebar stacks above the grid, and the grid scrolls horizontally." />
        </Section>

        {/* ===== EXTRA ===== */}
        <Section title="Extra Features (Beyond Requirements)">
          <Item icon="◆" text="AI-powered conflict resolution. Expand the amber conflict banner, click Recommend All to find the optimal fix plan using hill-climbing search with random restarts (8 trials, picks the shortest solution with fewest modifications). Click Apply All to execute the complete plan. Use Find fix on individual conflicts for targeted single-conflict resolution with minimal steps." />
        </Section>
      </div>
    </Dialog>
  );
}
