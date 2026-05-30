import { useDraggable } from '@dnd-kit/core';

interface Props {
  id: string;
  startTime: string;
  endTime: string;
  hasConflict: boolean;
  isHighlighted: boolean;
  onClick: () => void;
}

export function ShiftBadge({ id, startTime, endTime, hasConflict, isHighlighted, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

  const style = transform ? {
    transform: `translate(${transform.x}px, ${transform.y}px)`,
    zIndex: 50,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={style}
      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-grab active:cursor-grabbing touch-none ${
        hasConflict
          ? 'bg-red-50 text-red-700 border-2 border-red-400 ring-1 ring-red-200'
          : 'bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 hover:border-cyan-300'
      } ${isDragging ? 'shadow-lg' : ''} ${isHighlighted ? 'animate-pulse ring-2 ring-cyan-400 ring-offset-1' : ''}`}
    >
      <span className="block leading-tight pointer-events-none">{startTime} - {endTime}</span>
      {hasConflict && (
        <span className="text-red-500 text-xs leading-none pointer-events-none" title="Conflict">&#9888;</span>
      )}
    </button>
  );
}
