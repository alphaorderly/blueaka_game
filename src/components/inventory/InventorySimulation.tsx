import { useState, useEffect, useCallback } from 'react';
import {
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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeadedCard } from '@/components/ui/HeadedCard';
import { RefreshCw, Eye, EyeOff, PartyPopper } from 'lucide-react';
import { GRID_HEIGHT, GRID_WIDTH } from '@/consts/inventory-management/events';

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

export const InventorySimulation = ({
    selectedEvent,
    selectedCase,
}: InventorySimulationProps) => {
    const [simulationState, setSimulationState] = useState<SimulationState>({
        hiddenObjects: [],
        revealedCells: [],
        moves: 0,
        isComplete: false,
        showSolution: false,
    });

    const [objectTypeColors, setObjectTypeColors] = useState<{
        [objectIndex: number]: ObjectTypeColor;
    }>({});

    const currentCaseOption = selectedEvent.caseOptions.find(
        (option) => option.value === selectedCase
    );

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

            const hiddenObjects: HiddenObject[] = placedObjects.map(
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
            );

            const newObjectTypeColors: {
                [objectIndex: number]: ObjectTypeColor;
            } = {};

            currentCaseOption.objects.forEach((_, objectIndex) => {
                newObjectTypeColors[objectIndex] = generateColorForObjectType(
                    {},
                    objectIndex
                );
            });

            setObjectTypeColors(newObjectTypeColors);
            setSimulationState({
                hiddenObjects,
                revealedCells: [],
                moves: 0,
                isComplete: false,
                showSolution: false,
            });
        } catch (error) {
            console.error('InventorySimulation placement failed:', error);
            setSimulationState({
                hiddenObjects: [],
                revealedCells: [],
                moves: 0,
                isComplete: false,
                showSolution: false,
            });
        }
    }, [currentCaseOption]);

    useEffect(() => {
        initializeSimulation();
    }, [initializeSimulation]);

    const handleCellClick = (x: number, y: number) => {
        if (simulationState.isComplete) return;

        const isAlreadyRevealed = simulationState.revealedCells.some(
            (cell) => cell.x === x && cell.y === y
        );
        if (isAlreadyRevealed) return;

        const newRevealedCells = [...simulationState.revealedCells, { x, y }];
        let newHiddenObjects = [...simulationState.hiddenObjects];

        const foundObject = simulationState.hiddenObjects.find(
            (obj) =>
                !obj.found &&
                obj.cells.some((cell) => cell.x === x && cell.y === y)
        );

        if (foundObject) {
            newHiddenObjects = newHiddenObjects.map((obj) =>
                obj.id === foundObject.id ? { ...obj, found: true } : obj
            );

            foundObject.cells.forEach((cell) => {
                if (
                    !newRevealedCells.some(
                        (c) => c.x === cell.x && c.y === cell.y
                    )
                ) {
                    newRevealedCells.push(cell);
                }
            });
        }

        const isComplete = newHiddenObjects.every((obj) => obj.found);

        setSimulationState({
            ...simulationState,
            hiddenObjects: newHiddenObjects,
            revealedCells: newRevealedCells,
            moves: simulationState.moves + 1,
            isComplete,
        });
    };

    const getCellState = (x: number, y: number) => {
        const isRevealed = simulationState.revealedCells.some(
            (cell) => cell.x === x && cell.y === y
        );
        const hiddenObject = simulationState.hiddenObjects.find((obj) =>
            obj.cells.some((cell) => cell.x === x && cell.y === y)
        );

        return {
            isRevealed,
            hiddenObject,
            isObjectStart:
                hiddenObject?.startX === x && hiddenObject?.startY === y,
        };
    };

    const getCellStyles = (x: number, y: number) => {
        const { isRevealed, hiddenObject } = getCellState(x, y);

        if (isRevealed && hiddenObject) {
            const colorData = objectTypeColors[hiddenObject.objectIndex];
            if (colorData) {
                return {
                    backgroundColor: colorData.lightBg,
                    color: colorData.lightText,
                    borderColor: colorData.lightText,
                    boxShadow: `inset 0 0 0 1px ${colorData.lightText}`,
                    '--dark-bg': colorData.darkBg,
                    '--dark-text': colorData.darkText,
                    '--dark-border': colorData.darkBg,
                } as React.CSSProperties;
            }
        }

        return {};
    };

    const getCellClassName = (x: number, y: number) => {
        const { isRevealed, hiddenObject } = getCellState(x, y);
        const baseClass =
            'relative flex min-h-[32px] min-w-[32px] cursor-pointer items-center justify-center rounded-md border border-border/70 bg-background/90 text-xs font-semibold shadow-sm transition hover:-translate-y-[1px] hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-white/15 dark:bg-background/40 dark:text-muted-foreground';

        if (
            simulationState.showSolution &&
            hiddenObject &&
            !hiddenObject.found
        ) {
            return `${baseClass} bg-rose-200/90 text-rose-900 ring-2 ring-rose-400 dark:bg-rose-500/30 dark:text-rose-100 dark:ring-rose-400`;
        }

        if (isRevealed) {
            if (hiddenObject) {
                const borderStyle = 'border-2 border-solid';

                return `${baseClass} ${borderStyle} dark:bg-[var(--dark-bg)] dark:text-[var(--dark-text)] dark:border-[var(--dark-border)] dark:shadow-[0_0_0_1px_var(--dark-border)_inset]`;
            }

            return `${baseClass} bg-muted text-muted-foreground dark:bg-muted/25 dark:text-muted-foreground dark:border-white/10`;
        }

        return baseClass;
    };

    const renderCellContent = (x: number, y: number) => {
        const { isRevealed, hiddenObject, isObjectStart } = getCellState(x, y);

        if (
            simulationState.showSolution &&
            hiddenObject &&
            !hiddenObject.found &&
            isObjectStart
        ) {
            return `${hiddenObject.objectIndex + 1}`;
        }

        if (isRevealed && hiddenObject && isObjectStart) {
            return `${hiddenObject.objectIndex + 1}`;
        }

        return '';
    };

    const toggleSolution = () => {
        setSimulationState((prev) => ({
            ...prev,
            showSolution: !prev.showSolution,
        }));
    };

    if (!currentCaseOption) {
        return <div>선택된 케이스를 찾을 수 없습니다.</div>;
    }

    return (
        <HeadedCard>
            <HeadedCard.Header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h2 className="text-foreground text-xl font-semibold">
                        {selectedEvent.name}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {currentCaseOption.label}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleSolution}
                        className="gap-2"
                    >
                        {simulationState.showSolution ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                        {simulationState.showSolution ? '숨기기' : '정답 보기'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={initializeSimulation}
                        className="gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />새 게임
                    </Button>
                </div>
            </HeadedCard.Header>

            <HeadedCard.Content className="space-y-6">
                {simulationState.isComplete && (
                    <Card className="border-emerald-200/70 bg-emerald-50/70 p-4 text-center shadow-sm dark:border-emerald-500/40 dark:bg-emerald-900/40">
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                                <PartyPopper className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-100">
                                    완료!
                                </h3>
                            </div>
                            <p className="text-sm text-emerald-700 dark:text-emerald-200">
                                {simulationState.moves}번 클릭으로 모든
                                오브젝트를 찾았습니다
                            </p>
                        </div>
                    </Card>
                )}

                <div className="grid gap-2 sm:grid-cols-3">
                    {currentCaseOption.objects.map((obj, index) => {
                        const foundObjects =
                            simulationState.hiddenObjects.filter(
                                (hiddenObj) =>
                                    hiddenObj.objectIndex === index &&
                                    hiddenObj.found
                            );

                        return (
                            <div
                                key={index}
                                className="border-border/40 bg-background/70 flex items-center gap-2 rounded-lg border p-2 shadow-sm"
                            >
                                <div className="text-primary bg-primary/15 flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium">
                                        {obj.w}×{obj.h} 크기
                                    </p>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className="rounded-full px-3 py-0.5 text-xs"
                                >
                                    {foundObjects.length}/{obj.count}
                                </Badge>
                            </div>
                        );
                    })}
                </div>

                <div className="overflow-x-auto">
                    <div
                        className="border-border/70 bg-background/95 dark:bg-background/25 mx-auto grid w-fit gap-1 rounded-xl border p-3 shadow-md sm:gap-1.5 dark:border-white/12"
                        style={{
                            gridTemplateColumns: `repeat(${GRID_WIDTH}, minmax(32px, 48px))`,
                            gridTemplateRows: `repeat(${GRID_HEIGHT}, minmax(32px, 48px))`,
                        }}
                    >
                        {Array.from({ length: GRID_HEIGHT }, (_, y) =>
                            Array.from({ length: GRID_WIDTH }, (_, x) => (
                                <div
                                    key={`${x}-${y}`}
                                    onClick={() => handleCellClick(x, y)}
                                    className={getCellClassName(x, y)}
                                    style={{
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
            </HeadedCard.Content>
        </HeadedCard>
    );
};
