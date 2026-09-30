import type {
    GridPosition,
    PlacedObject,
    PlacementMode,
    ProbabilityCell,
} from '@/types/inventory-management/inventory';
import type { ObjectTypeColor } from '@/utils/inventory/colorUtils';
import {
    getPlacedObjectAt,
    isCellOpened,
    isValidPlacement,
} from '@/utils/inventory/gridUtils';
import { GRID_HEIGHT, GRID_WIDTH } from '@/consts/inventory-management/events';
import { cn } from '@/lib/utils';
import { Board, ObjectBlock } from './board/Board';
import { cellName, gridArea } from './board/boardUtils';

interface PredictionBoardProps {
    probabilities: number[][];
    highestCells: ProbabilityCell[];
    secondHighestCells: ProbabilityCell[];
    openedCells: GridPosition[];
    placedObjects: PlacedObject[];
    previewCells: GridPosition[];
    placementMode: PlacementMode;
    objectTypeColors: { [objectIndex: number]: ObjectTypeColor };
    hoveredObjectId: string | null;
    isStale: boolean;
    onCellClick: (x: number, y: number) => void;
    onCellHover: (x: number, y: number) => void;
    onCellTouch: (x: number, y: number) => void;
    onPreviewClear: () => void;
}

const includes = (cells: GridPosition[], x: number, y: number) =>
    cells.some((cell) => cell.x === x && cell.y === y);

const formatPercent = (value: number) => {
    const pct = value * 100;
    if (pct >= 99.95) return '100';
    if (pct > 0 && pct < 0.05) return '<0.1';
    return pct.toFixed(1);
};

export const PredictionBoard = ({
    probabilities,
    highestCells,
    secondHighestCells,
    openedCells,
    placedObjects,
    previewCells,
    placementMode,
    objectTypeColors,
    hoveredObjectId,
    isStale,
    onCellClick,
    onCellHover,
    onCellTouch,
    onPreviewClear,
}: PredictionBoardProps) => {
    const isPlacing = placementMode === 'placing';
    const previewValid =
        previewCells.length > 0 &&
        isValidPlacement(previewCells, placedObjects);

    const renderCell = (x: number, y: number) => {
        const opened = isCellOpened(x, y, openedCells);
        const occupied = Boolean(getPlacedObjectAt(x, y, placedObjects));
        const value = probabilities[y]?.[x];
        const hasValue = !opened && !occupied && value !== undefined;
        const isFirst = hasValue && includes(highestCells, x, y);
        const isSecond =
            hasValue && !isFirst && includes(secondHighestCells, x, y);

        const style = gridArea(x, y);

        const label = hasValue
            ? `${cellName(x, y)} ${formatPercent(value)}%`
            : `${cellName(x, y)}${opened ? ' 열림' : ''}`;

        return (
            <button
                key={`${x}-${y}`}
                type="button"
                aria-label={label}
                aria-pressed={opened}
                onClick={() => onCellClick(x, y)}
                onMouseEnter={() => onCellHover(x, y)}
                onTouchStart={() => onCellTouch(x, y)}
                className={cn(
                    'tabular relative flex aspect-square min-w-0 items-center justify-center rounded-[5px] text-[10px] font-medium outline-none sm:text-xs',
                    'transition-[background-color,box-shadow,color] duration-150',
                    'focus-visible:ring-primary focus-visible:z-30 focus-visible:ring-2',
                    isPlacing ? 'cursor-crosshair' : 'cursor-pointer',
                    occupied && !isPlacing && 'cursor-default',
                    opened
                        ? 'hatched shadow-[inset_0_0_0_1px_var(--border)] hover:shadow-[inset_0_0_0_1px_var(--border-strong)]'
                        : isFirst
                          ? 'rank-platinum font-semibold'
                          : isSecond
                            ? 'rank-gold font-semibold'
                            : 'bg-[var(--cell)] shadow-[inset_0_0_0_1px_var(--border)] hover:shadow-[inset_0_0_0_1px_var(--faint)]',
                    hasValue && value === 0 && 'text-faint'
                )}
                style={style}
            >
                {hasValue && (
                    <span
                        className={cn(
                            'transition-opacity duration-200',
                            isStale && 'opacity-35'
                        )}
                    >
                        {formatPercent(value)}
                    </span>
                )}
            </button>
        );
    };

    const previewBounds =
        previewCells.length > 0
            ? {
                  x: Math.min(...previewCells.map((c) => c.x)),
                  y: Math.min(...previewCells.map((c) => c.y)),
                  w:
                      Math.max(...previewCells.map((c) => c.x)) -
                      Math.min(...previewCells.map((c) => c.x)) +
                      1,
                  h:
                      Math.max(...previewCells.map((c) => c.y)) -
                      Math.min(...previewCells.map((c) => c.y)) +
                      1,
              }
            : null;

    return (
        <Board
            onMouseLeave={onPreviewClear}
            onTouchEnd={() => {
                if (!isPlacing) onPreviewClear();
            }}
        >
            {Array.from({ length: GRID_HEIGHT }, (_, y) =>
                Array.from({ length: GRID_WIDTH }, (_, x) => renderCell(x, y))
            )}

            {placedObjects.map((obj) => (
                <ObjectBlock
                    key={obj.id}
                    x={obj.startX}
                    y={obj.startY}
                    width={obj.width}
                    height={obj.height}
                    color={objectTypeColors[obj.objectIndex]}
                    label={obj.objectIndex + 1}
                    className={cn(
                        'transition-[box-shadow,opacity] duration-150',
                        hoveredObjectId === obj.id &&
                            'shadow-[inset_0_0_0_2px_var(--destructive)]',
                        hoveredObjectId !== null &&
                            hoveredObjectId !== obj.id &&
                            'opacity-60'
                    )}
                />
            ))}

            {previewBounds && (
                <div
                    aria-hidden
                    className={cn(
                        'pointer-events-none z-20 rounded-[5px] border-2 border-dashed',
                        previewValid
                            ? 'border-primary bg-primary/15'
                            : 'border-destructive bg-destructive/15'
                    )}
                    style={gridArea(
                        previewBounds.x,
                        previewBounds.y,
                        previewBounds.w,
                        previewBounds.h
                    )}
                />
            )}
        </Board>
    );
};
