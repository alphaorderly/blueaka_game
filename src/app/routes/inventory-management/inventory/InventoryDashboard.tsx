import { useEffect, useMemo, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import type {
    InventoryObject,
    GridPosition,
    PlacedObject,
    PlacementMode,
} from '@/types/inventory-management/inventory';
import {
    useInventory,
    useObjectTypeColors,
    useProbabilityCalculation,
    useProbabilityRankings,
} from '@/hooks/inventory';
import {
    generatePreviewCells,
    isValidPlacement,
} from '@/utils/inventory/gridUtils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/panel';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { EventPicker } from '@/components/inventory/forms/EventPicker';
import { EventSchedule } from '@/components/inventory/forms/EventSchedule';
import { ObjectList } from '@/components/inventory/ObjectList';
import { PredictionBoard } from '@/components/inventory/PredictionBoard';
import { InventoryPlacementIndicator } from '@/components/inventory/PlacementModeIndicator';
import { SettingsModal } from '@/components/inventory/settings/SettingsModal';
import {
    cellName,
    objectColorClass,
    objectColorVars,
} from '@/components/inventory/board/boardUtils';

const LegendSwatch = ({ className }: { className: string }) => (
    <span aria-hidden className={cn('size-3 rounded-[3px]', className)} />
);

const InventoryDashboard = () => {
    const {
        selectedEvent,
        selectedCase,
        caseOptions,
        customEvents,
        openedCells,
        placedObjects,
        availableEvents,
        setSelectedEvent,
        setSelectedCase,
        setOpenedCells,
        setPlacedObjects,
        createCustomEvent,
        updateCustomEvent,
        deleteCustomEvent,
        exportCustomEvent,
        importCustomEvent,
        downloadFile,
        addCaseToCustomEvent,
        removeCaseFromCustomEvent,
        updateCaseInCustomEvent,
        addObjectToCustomEventCase,
        removeObjectFromCustomEventCase,
        updateObjectInCustomEventCase,
        clearGridState,
        resetToDefaults,
    } = useInventory();

    const [currentObjects, setCurrentObjects] = useState<InventoryObject[]>([]);
    const [placementMode, setPlacementMode] = useState<PlacementMode>('opened');
    const [selectedObjectIndex, setSelectedObjectIndex] = useState<number>(-1);
    const [placementOrientation, setPlacementOrientation] = useState<
        'horizontal' | 'vertical'
    >('horizontal');
    const [previewCells, setPreviewCells] = useState<GridPosition[]>([]);
    const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const [probabilityFilter, setProbabilityFilter] = useState<number | null>(
        null
    );

    const { objectTypeColors } = useObjectTypeColors(currentObjects);

    const resetInteraction = () => {
        setPlacementMode('opened');
        setSelectedObjectIndex(-1);
        setPreviewCells([]);
        setHoveredObjectId(null);
        setProbabilityFilter(null);
    };

    const handleBoardReset = () => {
        clearGridState();
        resetInteraction();
    };

    const handleResetInventoryDefaults = () => {
        resetToDefaults();
        resetInteraction();
    };

    useEffect(() => {
        const caseData = caseOptions.find(
            (option) => option.value === selectedCase
        );
        if (caseData) {
            setCurrentObjects(caseData.objects.map((obj) => ({ ...obj })));
            setPlacementMode('opened');
            setSelectedObjectIndex(-1);
            setPreviewCells([]);
            setPlacementOrientation('horizontal');
            setProbabilityFilter(null);
        }
    }, [selectedCase, caseOptions]);

    const remainingCounts = useMemo(() => {
        return currentObjects.map((obj, index) => {
            const placedCount = placedObjects.filter(
                (placed) => placed.objectIndex === index
            ).length;
            return Math.max(0, obj.totalCount - placedCount);
        });
    }, [currentObjects, placedObjects]);

    const adjustedObjects = useMemo(() => {
        return currentObjects.map((obj, index) => ({
            ...obj,
            count: remainingCounts[index],
        }));
    }, [currentObjects, remainingCounts]);

    const allBlockedCells = useMemo(() => {
        return [...openedCells, ...placedObjects.flatMap((obj) => obj.cells)];
    }, [openedCells, placedObjects]);

    const {
        probabilities,
        objectProbabilities,
        isCalculating,
        error: calculationError,
        lastCalculationTime,
    } = useProbabilityCalculation({
        objects: adjustedObjects,
        blockedCells: allBlockedCells,
        enabled: currentObjects.length > 0,
    });

    const displayProbabilities = useMemo(() => {
        if (probabilityFilter === null) return probabilities;
        return objectProbabilities?.[probabilityFilter] ?? probabilities;
    }, [probabilities, objectProbabilities, probabilityFilter]);

    const { highestCells, secondHighestCells } = useProbabilityRankings(
        displayProbabilities,
        openedCells,
        placedObjects
    );

    const cancelPlacement = () => {
        setPlacementMode('opened');
        setSelectedObjectIndex(-1);
        setPreviewCells([]);
    };

    const toggleOrientation = () => {
        setPlacementOrientation((prev) =>
            prev === 'horizontal' ? 'vertical' : 'horizontal'
        );
        setPreviewCells([]);
    };

    const isPlacing = placementMode === 'placing' && selectedObjectIndex >= 0;

    useEffect(() => {
        if (!isPlacing) return;
        const onKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest('input, textarea, [role="dialog"]')) return;
            if (event.key === 'Escape') {
                setPlacementMode('opened');
                setSelectedObjectIndex(-1);
                setPreviewCells([]);
            }
            if (event.key === 'r' || event.key === 'R') {
                setPlacementOrientation((prev) =>
                    prev === 'horizontal' ? 'vertical' : 'horizontal'
                );
                setPreviewCells([]);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isPlacing]);

    const handleCellClick = (x: number, y: number) => {
        if (placementMode === 'opened') {
            const hasPlacedObject = placedObjects.some((obj) =>
                obj.cells.some((cell) => cell.x === x && cell.y === y)
            );
            if (hasPlacedObject) return;

            const cellIndex = openedCells.findIndex(
                (cell) => cell.x === x && cell.y === y
            );
            setOpenedCells(
                cellIndex >= 0
                    ? openedCells.filter((_, index) => index !== cellIndex)
                    : [...openedCells, { x, y }]
            );
        } else if (isPlacing) {
            const cells = generatePreviewCells(
                x,
                y,
                selectedObjectIndex,
                currentObjects,
                placementOrientation
            );
            if (cells.length > 0 && isValidPlacement(cells, placedObjects)) {
                const obj = currentObjects[selectedObjectIndex];
                const horizontal = placementOrientation === 'horizontal';
                const newPlacedObject: PlacedObject = {
                    id: `obj-${selectedObjectIndex}-${Date.now()}`,
                    objectIndex: selectedObjectIndex,
                    startX: x,
                    startY: y,
                    width: horizontal ? obj.w : obj.h,
                    height: horizontal ? obj.h : obj.w,
                    cells,
                };
                setPlacedObjects([...placedObjects, newPlacedObject]);
                cancelPlacement();
            }
        }
    };

    const handleCellHover = (x: number, y: number) => {
        if (!isPlacing) return;
        setPreviewCells(
            generatePreviewCells(
                x,
                y,
                selectedObjectIndex,
                currentObjects,
                placementOrientation
            )
        );
    };

    const startPlacing = (objectIndex: number) => {
        if (isPlacing && selectedObjectIndex === objectIndex) {
            cancelPlacement();
            return;
        }
        setPlacementMode('placing');
        setSelectedObjectIndex(objectIndex);
        setPreviewCells([]);
    };

    const removeObject = (objectId: string) => {
        setPlacedObjects(placedObjects.filter((obj) => obj.id !== objectId));
        setHoveredObjectId(null);
        setPreviewCells([]);
    };

    const filteredObject =
        probabilityFilter !== null ? currentObjects[probabilityFilter] : null;
    const hasBoardState = openedCells.length > 0 || placedObjects.length > 0;

    return (
        <div className="grid items-start gap-4 lg:grid-cols-[296px_minmax(0,1fr)] lg:grid-rows-[auto_auto_1fr] lg:gap-x-8 lg:gap-y-5">
            <Panel className="lg:col-start-1 lg:row-start-1">
                <PanelBody className="space-y-4">
                    <EventPicker
                        events={availableEvents}
                        cases={caseOptions}
                        selectedEvent={selectedEvent}
                        selectedCase={selectedCase}
                        onEventChange={setSelectedEvent}
                        onCaseChange={setSelectedCase}
                    />
                    <div className="flex items-center gap-1 border-t pt-3">
                        <span className="text-muted-foreground mr-auto text-xs">
                            커스텀 이벤트
                        </span>
                        <SettingsModal
                            trigger={
                                <Button variant="ghost" size="xs">
                                    관리
                                </Button>
                            }
                            customEvents={customEvents}
                            selectedEvent={selectedEvent}
                            createCustomEvent={createCustomEvent}
                            updateCustomEvent={updateCustomEvent}
                            deleteCustomEvent={deleteCustomEvent}
                            exportCustomEvent={exportCustomEvent}
                            importCustomEvent={importCustomEvent}
                            downloadFile={downloadFile}
                            addCaseToCustomEvent={addCaseToCustomEvent}
                            removeCaseFromCustomEvent={
                                removeCaseFromCustomEvent
                            }
                            updateCaseInCustomEvent={updateCaseInCustomEvent}
                            addObjectToCustomEventCase={
                                addObjectToCustomEventCase
                            }
                            removeObjectFromCustomEventCase={
                                removeObjectFromCustomEventCase
                            }
                            updateObjectInCustomEventCase={
                                updateObjectInCustomEventCase
                            }
                        />
                        <Button
                            variant="ghost-danger"
                            size="xs"
                            onClick={() => setIsResetDialogOpen(true)}
                        >
                            초기화
                        </Button>
                    </div>
                </PanelBody>
            </Panel>

            <Panel className="overflow-hidden lg:col-start-2 lg:row-span-3 lg:row-start-1">
                {isPlacing ? (
                    <InventoryPlacementIndicator
                        selectedObjectIndex={selectedObjectIndex}
                        currentObjects={currentObjects}
                        color={objectTypeColors[selectedObjectIndex]}
                        placementOrientation={placementOrientation}
                        onToggleOrientation={toggleOrientation}
                        onCancelPlacement={cancelPlacement}
                    />
                ) : (
                    <PanelHeader
                        title={
                            filteredObject ? (
                                <span className="flex items-center gap-2">
                                    <span
                                        className={cn(
                                            objectColorClass,
                                            'tabular flex size-5 items-center justify-center rounded-[4px] text-[10px]'
                                        )}
                                        style={objectColorVars(
                                            objectTypeColors[probabilityFilter!]
                                        )}
                                    >
                                        {probabilityFilter! + 1}
                                    </span>
                                    <span className="tabular">
                                        {filteredObject.w}×{filteredObject.h}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setProbabilityFilter(null)
                                        }
                                        aria-label="전체 확률 보기"
                                        className="text-faint hover:text-foreground -ml-1 cursor-pointer rounded-sm p-0.5"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                </span>
                            ) : (
                                '전체 확률'
                            )
                        }
                        aside={
                            <>
                                <span
                                    className={cn(
                                        'tabular mr-2 flex items-center gap-1.5 text-xs',
                                        calculationError
                                            ? 'text-destructive'
                                            : 'text-faint'
                                    )}
                                    aria-live="polite"
                                >
                                    {calculationError ? (
                                        '계산 실패'
                                    ) : isCalculating ? (
                                        <>
                                            <span className="bg-primary size-1.5 animate-pulse rounded-full" />
                                            계산 중
                                        </>
                                    ) : lastCalculationTime !== null ? (
                                        `${lastCalculationTime.toFixed(1)} ms`
                                    ) : null}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={handleBoardReset}
                                    disabled={!hasBoardState}
                                >
                                    <RotateCcw className="size-3.5" />
                                    비우기
                                </Button>
                            </>
                        }
                    />
                )}

                <div className="px-3 pt-4 pb-3 sm:px-6 sm:pt-6">
                    <div className="mx-auto max-w-[620px]">
                        <PredictionBoard
                            probabilities={
                                calculationError ? [] : displayProbabilities
                            }
                            highestCells={highestCells}
                            secondHighestCells={secondHighestCells}
                            openedCells={openedCells}
                            placedObjects={placedObjects}
                            previewCells={previewCells}
                            placementMode={placementMode}
                            objectTypeColors={objectTypeColors}
                            hoveredObjectId={hoveredObjectId}
                            isStale={isCalculating}
                            onCellClick={handleCellClick}
                            onCellHover={handleCellHover}
                            onCellTouch={handleCellHover}
                            onPreviewClear={() => setPreviewCells([])}
                        />
                    </div>
                </div>

                <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 px-4 pb-4 text-xs sm:px-6">
                    <span className="flex items-center gap-1.5">
                        <LegendSwatch className="rank-platinum" />
                        1순위
                    </span>
                    <span className="flex items-center gap-1.5">
                        <LegendSwatch className="rank-gold" />
                        2순위
                    </span>
                    <span className="flex items-center gap-1.5">
                        <LegendSwatch className="hatched shadow-[inset_0_0_0_1px_var(--border-strong)]" />
                        빈 칸
                    </span>
                    <span className="text-faint ml-auto">단위 %</span>
                </div>

                {placedObjects.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 border-t px-4 py-3 sm:px-6">
                        {placedObjects.map((placed) => (
                            <button
                                key={placed.id}
                                type="button"
                                onClick={() => removeObject(placed.id)}
                                onMouseEnter={() =>
                                    setHoveredObjectId(placed.id)
                                }
                                onMouseLeave={() => setHoveredObjectId(null)}
                                onFocus={() => setHoveredObjectId(placed.id)}
                                onBlur={() => setHoveredObjectId(null)}
                                aria-label={`${placed.objectIndex + 1}번 ${cellName(placed.startX, placed.startY)} 제거`}
                                className="group hover:border-destructive/50 hover:bg-destructive/5 flex h-7 cursor-pointer items-center gap-1.5 rounded-md border pr-1.5 pl-1 text-xs transition-colors"
                            >
                                <span
                                    className={cn(
                                        objectColorClass,
                                        'tabular flex size-5 items-center justify-center rounded-[4px] text-[10px] font-semibold'
                                    )}
                                    style={objectColorVars(
                                        objectTypeColors[placed.objectIndex]
                                    )}
                                >
                                    {placed.objectIndex + 1}
                                </span>
                                <span className="tabular font-medium">
                                    {cellName(placed.startX, placed.startY)}
                                </span>
                                <X className="text-faint group-hover:text-destructive size-3" />
                            </button>
                        ))}
                    </div>
                )}
            </Panel>

            <Panel className="lg:col-start-1 lg:row-start-2">
                <PanelHeader
                    title="오브젝트"
                    aside={
                        <span className="text-faint tabular text-xs">
                            남음 / 전체
                        </span>
                    }
                />
                <PanelBody className="py-2">
                    <ObjectList
                        objects={currentObjects}
                        colors={objectTypeColors}
                        remainingCounts={remainingCounts}
                        filter={probabilityFilter}
                        placingIndex={isPlacing ? selectedObjectIndex : -1}
                        onFilterChange={setProbabilityFilter}
                        onStartPlacing={startPlacing}
                    />
                </PanelBody>
            </Panel>

            <div className="px-1 pt-2 lg:col-start-1 lg:row-start-3">
                <EventSchedule events={availableEvents} />
            </div>

            <Dialog
                open={isResetDialogOpen}
                onOpenChange={setIsResetDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>커스텀 이벤트 초기화</DialogTitle>
                        <DialogDescription>
                            커스텀 이벤트와 저장된 보드 상태가 모두 삭제됩니다.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsResetDialogOpen(false)}
                        >
                            취소
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                handleResetInventoryDefaults();
                                setIsResetDialogOpen(false);
                            }}
                        >
                            초기화
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default InventoryDashboard;
