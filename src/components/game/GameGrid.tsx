import React from 'react';
import {
    GridPosition,
    PlacedObject,
    PlacementMode,
    GameObject,
} from '../../types/calculator';
import { GRID_WIDTH, GRID_HEIGHT } from '../../consts/gameData';
import { ObjectTypeColor } from '../../utils/calculator/colorUtils';
import {
    isCellOpened,
    isCellOccupied,
    getPlacedObjectAt,
} from '../../utils/calculator/gridUtils';
import { Button } from '../ui/button';
import { PlacementModeIndicator } from './PlacementModeIndicator';

interface GameGridProps {
    openedCells: GridPosition[];
    placedObjects: PlacedObject[];
    previewCells: GridPosition[];
    placementMode: PlacementMode;
    objectTypeColors: { [objectIndex: number]: ObjectTypeColor };
    hoveredObjectId: string | null;
    onCellClick: (x: number, y: number) => void;
    onCellHover: (x: number, y: number) => void;
    onCellTouch: (x: number, y: number) => void;
    onCellLeave: () => void;
    onPreviewClear: () => void;
    // ObjectPlacement props
    currentObjects: GameObject[];
    remainingCounts: number[];
    selectedObjectIndex: number;
    placementOrientation: 'horizontal' | 'vertical';
    onStartPlacing: (objectIndex: number) => void;
    onToggleOrientation: () => void;
    onCancelPlacement: () => void;
    onRemoveObject: (objectId: string) => void;
    onSetHoveredObjectId: (objectId: string | null) => void;
}

export const GameGrid: React.FC<GameGridProps> = ({
    openedCells,
    placedObjects,
    previewCells,
    placementMode,
    objectTypeColors,
    hoveredObjectId,
    onCellClick,
    onCellHover,
    onCellTouch,
    onCellLeave,
    onPreviewClear,
    // ObjectPlacement props
    currentObjects,
    remainingCounts,
    selectedObjectIndex,
    placementOrientation,
    onStartPlacing,
    onToggleOrientation,
    onCancelPlacement,
    onRemoveObject,
    onSetHoveredObjectId,
}) => {
    const isCellPreview = (x: number, y: number) => {
        return previewCells.some((cell) => cell.x === x && cell.y === y);
    };

    const isValidPlacement = (cells: GridPosition[]): boolean => {
        return cells.every((cell) => {
            if (
                cell.x >= GRID_WIDTH ||
                cell.y >= GRID_HEIGHT ||
                cell.x < 0 ||
                cell.y < 0
            )
                return false;

            const isOccupied = placedObjects.some((obj) =>
                obj.cells.some(
                    (occupiedCell) =>
                        occupiedCell.x === cell.x && occupiedCell.y === cell.y
                )
            );

            return !isOccupied;
        });
    };

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
            'border border-border flex items-center justify-center relative mobile-focus cursor-pointer hover:bg-accent hover:text-accent-foreground touch-target transition-all duration-200 rounded-md';

        // Check if cell has a placed object first (highest priority)
        if (isCellOccupied(x, y, placedObjects)) {
            const placedObj = getPlacedObjectAt(x, y, placedObjects);
            const isHovered = placedObj && hoveredObjectId === placedObj.id;
            const hoverColorClass = isHovered ? `ring-2 ring-blue-500` : '';
            return `${baseClass} ${hoverColorClass} dark:[background-color:var(--dark-bg)] dark:[color:var(--dark-text)]`;
        }

        // Preview cells (second priority)
        if (isCellPreview(x, y)) {
            const isValid = isValidPlacement(previewCells);
            const previewClass = isValid
                ? 'bg-blue-300 text-blue-900 ring-2 ring-blue-400'
                : 'bg-red-300 text-red-900 ring-2 ring-red-400';
            return `${baseClass} ${previewClass}`;
        }

        // Opened cells (lower priority, only if no object placed)
        if (isCellOpened(x, y, openedCells)) {
            return `${baseClass} bg-gray-400/50 text-muted-foreground`;
        }

        return `${baseClass} bg-card text-card-foreground hover:bg-accent/50 hover:scale-105`;
    };

    const renderCellContent = (x: number, y: number) => {
        if (isCellOccupied(x, y, placedObjects)) {
            const placedObj = getPlacedObjectAt(x, y, placedObjects);
            if (placedObj && placedObj.startX === x && placedObj.startY === y) {
                return `${placedObj.objectIndex + 1}`;
            }
            return '';
        }

        return '';
    };

    return (
        <div className="space-y-6">
            {/* Object Placement Controls - Split Layout */}
            <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                    {/* Left Column - Object Buttons */}
                    <div className="space-y-3">
                        <h4 className="text-foreground text-sm font-medium">
                            오브젝트 선택
                        </h4>
                        <div className="grid gap-2">
                            {currentObjects.map((obj, index) => {
                                const remaining = remainingCounts[index];
                                const colorData = objectTypeColors[index];
                                const isSelected =
                                    placementMode === 'placing' &&
                                    selectedObjectIndex === index;

                                return (
                                    <div
                                        key={index}
                                        className={`group relative overflow-hidden rounded-lg border transition-all duration-200 ${
                                            isSelected
                                                ? 'border-primary bg-primary/5 ring-primary/20 ring-2'
                                                : 'border-border/40 bg-card/50 hover:bg-card/80'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 p-3">
                                            <div
                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold"
                                                style={{
                                                    backgroundColor:
                                                        colorData?.lightBg ||
                                                        '#f3f4f6',
                                                    color:
                                                        colorData?.lightText ||
                                                        '#1f2937',
                                                }}
                                            >
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-foreground text-xs font-medium">
                                                        오브젝트 {index + 1}
                                                    </span>
                                                    <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-xs">
                                                        {obj.w}×{obj.h}
                                                    </span>
                                                </div>
                                                <div className="text-muted-foreground text-xs">
                                                    {remaining}개 남음
                                                </div>
                                            </div>
                                            {remaining > 0 && (
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        onStartPlacing(index)
                                                    }
                                                    disabled={isSelected}
                                                    variant={
                                                        isSelected
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    className="min-w-[60px] text-xs transition-all"
                                                >
                                                    {isSelected
                                                        ? '배치중'
                                                        : '배치'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column - Placement Mode Indicator */}
                    <div className="space-y-3">
                        <h4 className="text-foreground text-sm font-medium">
                            배치 모드
                        </h4>
                        <div className="flex min-h-[120px] items-center justify-center">
                            {placementMode === 'placing' &&
                            selectedObjectIndex >= 0 ? (
                                <div className="border-primary/20 bg-primary/5 w-full rounded-lg border p-3">
                                    <PlacementModeIndicator
                                        selectedObjectIndex={
                                            selectedObjectIndex
                                        }
                                        currentObjects={currentObjects}
                                        placementOrientation={
                                            placementOrientation
                                        }
                                        onToggleOrientation={
                                            onToggleOrientation
                                        }
                                        onCancelPlacement={onCancelPlacement}
                                    />
                                </div>
                            ) : (
                                <div className="text-muted-foreground text-center text-sm">
                                    오브젝트를 선택하여 배치를 시작하세요
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Placed Objects - Bottom */}
                {placedObjects.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-foreground text-sm font-medium">
                                배치된 오브젝트
                            </h4>
                            <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium">
                                {placedObjects.length}개
                            </span>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {placedObjects.map((placedObj) => {
                                const colorData =
                                    objectTypeColors[placedObj.objectIndex];
                                const isHovered =
                                    hoveredObjectId === placedObj.id;

                                return (
                                    <div
                                        key={placedObj.id}
                                        className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-all duration-200 ${
                                            isHovered
                                                ? 'border-destructive bg-destructive/5 ring-destructive/20 ring-2'
                                                : 'border-border/40 bg-card/30 hover:bg-card/60'
                                        }`}
                                        onMouseEnter={() =>
                                            onSetHoveredObjectId(placedObj.id)
                                        }
                                        onMouseLeave={() =>
                                            onSetHoveredObjectId(null)
                                        }
                                        onClick={() =>
                                            onRemoveObject(placedObj.id)
                                        }
                                    >
                                        <div
                                            className="flex h-6 w-6 items-center justify-center rounded text-xs font-semibold"
                                            style={{
                                                backgroundColor:
                                                    colorData?.lightBg ||
                                                    '#f3f4f6',
                                                color:
                                                    colorData?.lightText ||
                                                    '#1f2937',
                                            }}
                                        >
                                            {placedObj.objectIndex + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-foreground text-xs font-medium">
                                                ({placedObj.startX},{' '}
                                                {placedObj.startY})
                                            </div>
                                        </div>
                                        <div
                                            className={`text-xs transition-colors ${
                                                isHovered
                                                    ? 'text-destructive'
                                                    : 'text-muted-foreground'
                                            }`}
                                        >
                                            제거
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Game Grid */}
            <div className="mb-4 sm:mb-6">
                <div className="custom-scrollbar prevent-horizontal-scroll overflow-x-auto">
                    <div
                        className="mx-auto grid w-fit grid-cols-9 gap-1 p-1 sm:gap-1.5 md:gap-2"
                        style={{
                            minWidth: 'fit-content',
                            gridTemplateColumns:
                                'repeat(9, minmax(32px, 48px))',
                            gridTemplateRows: 'repeat(5, minmax(32px, 48px))',
                        }}
                        onMouseLeave={() => onPreviewClear()}
                        onTouchEnd={() => {
                            // Clear preview on touch end if not placing
                            if (placementMode !== 'placing') {
                                onPreviewClear();
                            }
                        }}
                    >
                        {Array.from({ length: GRID_HEIGHT }, (_, y) =>
                            Array.from({ length: GRID_WIDTH }, (_, x) => (
                                <div
                                    key={`${x}-${y}`}
                                    onClick={() => onCellClick(x, y)}
                                    onMouseEnter={() => onCellHover(x, y)}
                                    onMouseLeave={onCellLeave}
                                    onTouchStart={() => onCellTouch(x, y)}
                                    className={getCellClassName(x, y)}
                                    style={{
                                        cursor:
                                            placementMode === 'opened' &&
                                            isCellOccupied(x, y, placedObjects)
                                                ? 'not-allowed'
                                                : undefined,
                                        minHeight: '32px',
                                        minWidth: '32px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        ...getCellStyles(x, y),
                                    }}
                                >
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
