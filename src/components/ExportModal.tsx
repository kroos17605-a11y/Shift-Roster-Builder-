import { useState } from 'react';
import { Dialog } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useRoster } from '../context/RosterContext';
import { generateCsv, downloadFile, getShiftsForWeek } from '../logic/rosterUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: Props) {
  const { state } = useRoster();
  const weekShifts = getShiftsForWeek(state.shifts, state.weekStartDate);
  const defaultName = `roster-${state.weekStartDate}.csv`;
  const [filename, setFilename] = useState(defaultName);

  const handleExport = () => {
    const csv = generateCsv(state.employees, state.shifts, state.weekStartDate);
    downloadFile(csv, filename || defaultName);
    onClose();
  };

  const handleClose = () => {
    setFilename(defaultName);
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Export Roster">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-500">
          Export the current week ({weekShifts.length} shifts, {state.employees.length} employees) as a CSV file.
        </p>

        <Input
          label="Filename"
          value={filename}
          onChange={e => setFilename(e.target.value)}
          placeholder={defaultName}
        />

        {weekShifts.length === 0 && (
          <p className="text-xs text-amber-600">Current week has no shifts. The CSV will have empty cells.</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={handleClose} type="button">Cancel</Button>
          <Button onClick={handleExport}>Export CSV</Button>
        </div>
      </div>
    </Dialog>
  );
}
