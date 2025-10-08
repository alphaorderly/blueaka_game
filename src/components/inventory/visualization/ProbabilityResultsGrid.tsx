import React from 'react';
import {
    GridPosition,
    PlacedObject,
    ProbabilityCell,
} from '@/types/inventory-management/inventory';
import {
    getPlacedObjectAt,
    isCellOccupied,
    isCellOpened,
} from '@/utils/inventory/gridUtils';
import { ObjectTypeColor } from '@/utils/inventory/colorUtils';
import { GRID_HEIGHT, GRID_WIDTH } from '@/consts/inventory-management/events';
import { Check, Crown, Star } from 'lucide-react';

interface ProbabilityResultsGridProps {
    probabilities: number[][];
    openedCells: GridPosition[];
    placedObjects: PlacedObject[];
    highestCells: ProbabilityCell[];
    secondHighestCells: ProbabilityCell[];
    objectTypeColors: { [objectIndex: number]: ObjectTypeColor };
}

export const ProbabilityResultsGrid: React.FC<ProbabilityResultsGridProps> = ({
    probabilities,
    openedCells,
    placedObjects,
    highestCells,
    secondHighestCells,
    objectTypeColors,
}) => {
    const getCellStyles = (x: number, y: number) => {
        if (isCellOccupied(x, y, placedObjects)) {
            const placedObj = getPlacedObjectAt(x, y, placedObjects);
            if (placedObj && objectTypeColors[placedObj.objectIndex]) {
                const colorData = objectTypeColors[placedObj.objectIndex];
                return {
                    backgroundColor: colorData.lightBg,
                    color: colorData.lightText,
                    '--dark-bg': colorData.darkBg,
                    '--dark-text': colorData.darkText,
                } as React.CSSProperties;
            }
        }
        return {};
    };

    const getCellClassName = (x: number, y: number) => {
        const baseClass =
            'border border-border/30 flex items-center justify-center relative mobile-focus cursor-default transition-all duration-200 hover:scale-105 rounded-md';

        // Opened cells
        if (isCellOpened(x, y, openedCells)) {
            return `${baseClass} bg-muted/50 text-muted-foreground border-border/20`;
        }

        // Placed objects
        if (isCellOccupied(x, y, placedObjects)) {
            return `${baseClass} border-border/20 dark:[background-color:var(--dark-bg)] dark:[color:var(--dark-text)]`;
        }

        // Result highlighting for probability display
        if (highestCells.some((cell) => cell.x === x && cell.y === y)) {
            return `${baseClass} bg-gradient-to-br from-amber-50 to-amber-100 text-amber-900 dark:from-amber-950 dark:to-amber-900 dark:text-amber-100 border-amber-200 dark:border-amber-800 shadow-sm`;
        }
        if (secondHighestCells.some((cell) => cell.x === x && cell.y === y)) {
            return `${baseClass} bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-900 dark:from-zinc-900 dark:to-zinc-800 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 shadow-sm`;
        }

        return `${baseClass} bg-card/80 text-card-foreground hover:bg-card`;
    };

    const renderRankingIndicator = (x: number, y: number) => {
        const isHighest = highestCells.some(
            (cell) => cell.x === x && cell.y === y
        );
        const isSecondHighest = secondHighestCells.some(
            (cell) => cell.x === x && cell.y === y
        );

        if (isHighest) {
            return (
                <div className="absolute -top-1 -right-1 z-10">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-white shadow-lg ring-2 ring-amber-200 dark:bg-amber-500 dark:ring-amber-800">
                        <Crown className="h-2.5 w-2.5" />
                    </div>
                </div>
            );
        }

        if (isSecondHighest) {
            return (
                <div className="absolute -top-1 -right-1 z-10">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-400 text-white shadow-lg ring-2 ring-zinc-200 dark:bg-zinc-500 dark:ring-zinc-700">
                        <Star className="h-2.5 w-2.5" />
                    </div>
                </div>
            );
        }

        return null;
    };

    const renderCellContent = (x: number, y: number) => {
        if (
            probabilities[y] &&
            !isCellOpened(x, y, openedCells) &&
            !isCellOccupied(x, y, placedObjects)
        ) {
            const percentage = (probabilities[y][x] * 100).toFixed(1);
            return <span className="text-xs font-medium">{percentage}%</span>;
        }

        if (isCellOccupied(x, y, placedObjects)) {
            const placedObj = getPlacedObjectAt(x, y, placedObjects);
            if (placedObj && placedObj.startX === x && placedObj.startY === y) {
                return (
                    <span className="text-xs font-semibold">
                        {placedObj.objectIndex + 1}
                    </span>
                );
            }
            return '';
        }

        if (isCellOpened(x, y, openedCells)) {
            return <Check className="h-3 w-3 opacity-60" />;
        }

        return '';
    };

    return (
        <div className="space-y-4">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <div className="h-4 w-4 rounded border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100"></div>
                        <div className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-600 text-white">
                            <Crown className="h-1.5 w-1.5" />
                        </div>
                    </div>
                    <span className="text-muted-foreground">최고 확률</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <div className="h-4 w-4 rounded border border-zinc-200 bg-gradient-to-br from-zinc-50 to-zinc-100"></div>
                        <div className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-zinc-400 text-white">
                            <Star className="h-1.5 w-1.5" />
                        </div>
                    </div>
                    <span className="text-muted-foreground">두번째 확률</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-muted/50 border-border/20 h-4 w-4 rounded border"></div>
                    <span className="text-muted-foreground">열린 셀</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-secondary/30 border-border/20 h-4 w-4 rounded border"></div>
                    <span className="text-muted-foreground">
                        배치된 오브젝트
                    </span>
                </div>
            </div>

            {/* Grid */}
            <div className="from-card/50 to-card/30 rounded-lg border bg-gradient-to-br p-4">
                <div className="custom-scrollbar prevent-horizontal-scroll overflow-x-auto">
                    <div
                        className="mx-auto grid w-fit grid-cols-9 gap-1 p-1 sm:gap-1.5 md:gap-2"
                        style={{
                            minWidth: 'fit-content',
                            gridTemplateColumns:
                                'repeat(9, minmax(32px, 48px))',
                            gridTemplateRows: 'repeat(5, minmax(32px, 48px))',
                        }}
                    >
                        {Array.from({ length: GRID_HEIGHT }, (_, y) =>
                            Array.from({ length: GRID_WIDTH }, (_, x) => (
                                <div
                                    key={`result-${x}-${y}`}
                                    className={getCellClassName(x, y)}
                                    style={{
                                        minHeight: '32px',
                                        minWidth: '32px',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        ...getCellStyles(x, y),
                                    }}
                                >
                                    {renderRankingIndicator(x, y)}
                                    {renderCellContent(x, y)}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
