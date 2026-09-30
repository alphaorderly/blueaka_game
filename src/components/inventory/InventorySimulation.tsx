import { useState, useEffect, useCallback, useMemo } from 'react';
import { Check, Eye, EyeOff, RefreshCw } from 'lucide-react';
import type {
    EventData,
    GridPosition,
} from '@/types/inventory-management/inventory';
import {
    generateColorForObjectType,
    type ObjectTypeColor,
} from '@/utils/inventory/colorUtils';
import {
    placeObjectsGuaranteed,
    type ObjectToPlace,
} from '@/utils/inventory/objectPlacement';
import { GRID_HEIGHT, GRID_WIDTH } from '@/consts/inventory-management/events';
import { Button } from '@/components/ui/button';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/panel';
import { cn } from '@/lib/utils';
import { Board, ObjectBlock, ShapeGlyph } from './board/Board';
import {
    cellName,
    gridArea,
    objectColorClass,
    objectColorVars,
} from './board/boardUtils';

interface InventorySimulationProps {
    selectedEvent: EventData;
    selectedCase: string;
}

interface HiddenObject {
    id: string;
    objectIndex: number;
    startX: number;
    startY: number;
    width: number;
    height: number;
    cells: GridPosition[];
    found: boolean;
    isRotated: boolean;
}

interface SimulationState {
    hiddenObjects: HiddenObject[];
    revealedCells: GridPosition[];
    moves: number;
    isComplete: boolean;
    showSolution: boolean;
}

const emptyState: SimulationState = {
    hiddenObjects: [],
    revealedCells: [],
    moves: 0,
    isComplete: false,
    showSolution: false,
};

const includes = (cells: GridPosition[], x: number, y: number) =>
    cells.some((cell) => cell.x === x && cell.y === y);

export const InventorySimulation = ({
    selectedEvent,
    selectedCase,
}: InventorySimulationProps) => {
    const [simulationState, setSimulationState] =
        useState<SimulationState>(emptyState);

    const currentCaseOption = selectedEvent.caseOptions.find(
        (option) => option.value === selectedCase
    );

    const objectTypeColors = useMemo(() => {
        const colors: { [objectIndex: number]: ObjectTypeColor } = {};
        currentCaseOption?.objects.forEach((_, objectIndex) => {
            colors[objectIndex] = generateColorForObjectType({}, objectIndex);
        });
        return colors;
    }, [currentCaseOption]);

    const initializeSimulation = useCallback(() => {
        if (!currentCaseOption) return;

        const objectsToPlace: ObjectToPlace[] = currentCaseOption.objects.map(
            (obj, index) => ({
                w: obj.w,
                h: obj.h,
                count: obj.count,
                objectIndex: index,
            })
        );

        try {
            const placedObjects = placeObjectsGuaranteed(objectsToPlace);
            setSimulationState({
                ...emptyState,
                hiddenObjects: placedObjects.map(
                    (obj): HiddenObject => ({
                        id: obj.id,
                        objectIndex: obj.objectIndex,
                        startX: obj.startX,
                        startY: obj.startY,
                        width: obj.width,
                        height: obj.height,
                        cells: obj.cells,
                        found: false,
                        isRotated: obj.isRotated ?? false,
                    })
                ),
            });
        } catch (error) {
            console.error('InventorySimulation placement failed:', error);
            setSimulationState(emptyState);
        }
    }, [currentCaseOption]);

    useEffect(() => {
        initializeSimulation();
    }, [initializeSimulation]);

    const handleCellClick = (x: number, y: number) => {
        if (simulationState.isComplete) return;
        if (includes(simulationState.revealedCells, x, y)) return;

        const newRevealedCells = [...simulationState.revealedCells, { x, y }];
        let newHiddenObjects = simulationState.hiddenObjects;

        const foundObject = simulationState.hiddenObjects.find(
            (obj) => !obj.found && includes(obj.cells, x, y)
        );

        if (foundObject) {
            newHiddenObjects = newHiddenObjects.map((obj) =>
                obj.id === foundObject.id ? { ...obj, found: true } : obj
            );
            foundObject.cells.forEach((cell) => {
                if (!includes(newRevealedCells, cell.x, cell.y)) {
                    newRevealedCells.push(cell);
                }
            });
        }

        setSimulationState({
            ...simulationState,
            hiddenObjects: newHiddenObjects,
            revealedCells: newRevealedCells,
            moves: simulationState.moves + 1,
            isComplete: newHiddenObjects.every((obj) => obj.found),
        });
    };

    const toggleSolution = () => {
        setSimulationState((prev) => ({
            ...prev,
            showSolution: !prev.showSolution,
        }));
    };

    if (!currentCaseOption) return null;

    const { hiddenObjects, revealedCells, moves, isComplete, showSolution } =
        simulationState;

    return (
        <>
            <Panel className="overflow-hidden lg:col-start-2 lg:row-span-2 lg:row-start-1">
                <PanelHeader
                    title={
                        isComplete ? (
                            <span className="text-primary flex items-center gap-1.5">
                                <Check className="size-4" strokeWidth={2.5} />
                                <span className="tabular">
                                    {moves}회 만에 완료
                                </span>
                            </span>
                        ) : (
                            <span className="flex items-baseline gap-1.5">
                                <span className="text-muted-foreground font-medium">
                                    시도
                                </span>
                                <span className="tabular">{moves}</span>
                            </span>
                        )
                    }
                    aside={
                        <>
                            <Button
                                variant="ghost"
                                size="xs"
                                onClick={toggleSolution}
                                aria-pressed={showSolution}
                                className={cn(
                                    showSolution && 'text-foreground bg-accent'
                                )}
                            >
                                {showSolution ? (
                                    <EyeOff className="size-3.5" />
                                ) : (
                                    <Eye className="size-3.5" />
                                )}
                                정답
                            </Button>
                            <Button
                                variant={isComplete ? 'default' : 'ghost'}
                                size="xs"
                                onClick={initializeSimulation}
                            >
                                <RefreshCw className="size-3.5" />새 게임
                            </Button>
                        </>
                    }
                />

                <div className="px-3 pt-4 pb-5 sm:px-6 sm:pt-6 sm:pb-6">
                    <div className="mx-auto max-w-[620px]">
                        <Board>
                            {Array.from({ length: GRID_HEIGHT }, (_, y) =>
                                Array.from({ length: GRID_WIDTH }, (_, x) => {
                                    const revealed = includes(
                                        revealedCells,
                                        x,
                                        y
                                    );
                                    return (
                                        <button
                                            key={`${x}-${y}`}
                                            type="button"
                                            aria-label={cellName(x, y)}
                                            disabled={revealed || isComplete}
                                            onClick={() =>
                                                handleCellClick(x, y)
                                            }
                                            className={cn(
                                                'aspect-square min-w-0 rounded-[5px] outline-none',
                                                'transition-[background-color,box-shadow] duration-150',
                                                'focus-visible:ring-primary focus-visible:z-30 focus-visible:ring-2',
                                                revealed
                                                    ? 'hatched shadow-[inset_0_0_0_1px_var(--border)]'
                                                    : 'enabled:hover:bg-primary-soft cursor-pointer bg-[var(--cell)] shadow-[inset_0_0_0_1px_var(--border)] enabled:hover:shadow-[inset_0_0_0_1px_var(--primary)] disabled:cursor-default'
                                            )}
                                            style={gridArea(x, y)}
                                        />
                                    );
                                })
                            )}

                            {hiddenObjects.map((obj) =>
                                obj.found ? (
                                    <ObjectBlock
                                        key={obj.id}
                                        x={obj.startX}
                                        y={obj.startY}
                                        width={obj.width}
                                        height={obj.height}
                                        color={
                                            objectTypeColors[obj.objectIndex]
                                        }
                                        label={obj.objectIndex + 1}
                                        className="animate-in fade-in-0 zoom-in-[0.97] duration-200"
                                    />
                                ) : showSolution ? (
                                    <div
                                        key={obj.id}
                                        aria-hidden
                                        className="pointer-events-none z-10 rounded-[5px] border-2 border-dashed border-[var(--obj-fg)] p-1.5 text-[11px] leading-none font-semibold text-[var(--obj-fg)] dark:border-[var(--obj-bg-dark)] dark:text-[var(--obj-fg-dark)]"
                                        style={{
                                            ...gridArea(
                                                obj.startX,
                                                obj.startY,
                                                obj.width,
                                                obj.height
                                            ),
                                            ...objectColorVars(
                                                objectTypeColors[
                                                    obj.objectIndex
                                                ]
                                            ),
                                        }}
                                    >
                                        {obj.objectIndex + 1}
                                    </div>
                                ) : null
                            )}
                        </Board>
                    </div>
                </div>
            </Panel>

            <Panel className="lg:col-start-1 lg:row-start-2">
                <PanelHeader title="오브젝트" />
                <PanelBody className="py-2">
                    <ul className="grid">
                        {currentCaseOption.objects.map((obj, index) => {
                            const found = hiddenObjects.filter(
                                (hidden) =>
                                    hidden.objectIndex === index && hidden.found
                            ).length;
                            const total = hiddenObjects.filter(
                                (hidden) => hidden.objectIndex === index
                            ).length;
                            const done = total > 0 && found === total;

                            return (
                                <li
                                    key={index}
                                    className="flex items-center gap-3 py-2"
                                >
                                    <span
                                        className={cn(
                                            objectColorClass,
                                            'tabular flex size-6 shrink-0 items-center justify-center rounded-[5px] text-[11px] font-semibold'
                                        )}
                                        style={objectColorVars(
                                            objectTypeColors[index]
                                        )}
                                    >
                                        {index + 1}
                                    </span>
                                    <span className="text-muted-foreground flex w-9 shrink-0 justify-center">
                                        <ShapeGlyph w={obj.w} h={obj.h} />
                                    </span>
                                    <span className="tabular text-[13px] font-medium">
                                        {obj.w}×{obj.h}
                                    </span>
                                    <span className="ml-auto flex items-center gap-2.5">
                                        <span className="flex gap-[3px]">
                                            {Array.from(
                                                { length: total },
                                                (_, i) => (
                                                    <span
                                                        key={i}
                                                        className={cn(
                                                            'h-3 w-1 rounded-full transition-colors',
                                                            i < found
                                                                ? 'bg-primary'
                                                                : 'bg-border-strong'
                                                        )}
                                                    />
                                                )
                                            )}
                                        </span>
                                        <span
                                            className={cn(
                                                'tabular w-8 text-right text-xs',
                                                done
                                                    ? 'text-primary font-medium'
                                                    : 'text-muted-foreground'
                                            )}
                                        >
                                            {found}/{total}
                                        </span>
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </PanelBody>
            </Panel>
        </>
    );
};
