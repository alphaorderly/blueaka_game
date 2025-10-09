import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import type {
    InventoryObject,
    GridPosition,
    PlacedObject,
    PlacementMode,
} from '@/types/inventory-management/inventory';
import { useInventory } from '@/hooks/inventory';
import {
    useObjectTypeColors,
    useProbabilityCalculation,
    useProbabilityRankings,
} from '@/hooks/inventory';
import {
    generatePreviewCells,
    isValidPlacement,
} from '@/utils/inventory/gridUtils';
import { cn } from '@/lib/utils';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EventSelection } from '@/components/inventory/forms/EventSelection';
import { InventoryGrid } from '@/components/inventory';
import { ProbabilityResultsGrid } from '@/components/inventory/visualization/ProbabilityResultsGrid';
import { Button } from '@/components/ui/button';
import { SettingsModal } from '@/components/inventory/settings/SettingsModal';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.tz.setDefault('Asia/Seoul');

const EVENT_TIME_FORMAT = 'YYYY-MM-DD HH:mm';

type EventStatus = {
    eventName: string;
    statusText: string;
    detailText: string;
    highlight: boolean;
};

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

    const { objectTypeColors } = useObjectTypeColors(currentObjects);

    const handleBoardReset = () => {
        clearGridState();
        setPlacementMode('opened');
        setSelectedObjectIndex(-1);
        setPreviewCells([]);
        setHoveredObjectId(null);
    };

    const handleResetInventoryDefaults = () => {
        resetToDefaults();
        setPlacementMode('opened');
        setSelectedObjectIndex(-1);
        setPreviewCells([]);
        setHoveredObjectId(null);
    };

    useEffect(() => {
        const caseData = caseOptions.find(
            (option) => option.value === selectedCase
        );
        if (caseData) {
            const objects = caseData.objects.map((obj) => ({ ...obj }));
            setCurrentObjects(objects);
            setPlacementMode('opened');
            setSelectedObjectIndex(-1);
            setPreviewCells([]);
            setPlacementOrientation('horizontal');
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
        isCalculating,
        error: calculationError,
        lastCalculationTime,
    } = useProbabilityCalculation({
        objects: adjustedObjects,
        blockedCells: allBlockedCells,
        enabled: currentObjects.length > 0,
    });

    const { highestCells, secondHighestCells } = useProbabilityRankings(
        probabilities,
        openedCells,
        placedObjects
    );

    const handleCellClick = (x: number, y: number) => {
        if (placementMode === 'opened') {
            const hasPlacedObject = placedObjects.some((obj) =>
                obj.cells.some((cell) => cell.x === x && cell.y === y)
            );
            if (hasPlacedObject) {
                return;
            }

            const cellIndex = openedCells.findIndex(
                (cell) => cell.x === x && cell.y === y
            );
            if (cellIndex >= 0) {
                const newOpenedCells = openedCells.filter(
                    (_, index) => index !== cellIndex
                );
                setOpenedCells(newOpenedCells);
            } else {
                const newOpenedCells = [...openedCells, { x, y }];
                setOpenedCells(newOpenedCells);
            }
        } else if (placementMode === 'placing' && selectedObjectIndex >= 0) {
            const previewCellsResult = generatePreviewCells(
                x,
                y,
                selectedObjectIndex,
                currentObjects,
                placementOrientation
            );
            if (
                isValidPlacement(previewCellsResult, placedObjects) &&
                previewCellsResult.length > 0
            ) {
                const obj = currentObjects[selectedObjectIndex];
                const width =
                    placementOrientation === 'horizontal' ? obj.w : obj.h;
                const height =
                    placementOrientation === 'horizontal' ? obj.h : obj.w;
                const newPlacedObject: PlacedObject = {
                    id: `obj-${selectedObjectIndex}-${Date.now()}`,
                    objectIndex: selectedObjectIndex,
                    startX: x,
                    startY: y,
                    width,
                    height,
                    cells: previewCellsResult,
                };
                const newPlacedObjects = [...placedObjects, newPlacedObject];
                setPlacedObjects(newPlacedObjects);
                setPlacementMode('opened');
                setSelectedObjectIndex(-1);
                setPreviewCells([]);
            }
        }
    };

    const handleCellHover = (x: number, y: number) => {
        if (placementMode === 'placing' && selectedObjectIndex >= 0) {
            const cells = generatePreviewCells(
                x,
                y,
                selectedObjectIndex,
                currentObjects,
                placementOrientation
            );
            setPreviewCells(cells);
        }
    };

    const handleCellTouch = (x: number, y: number) => {
        if (placementMode === 'placing' && selectedObjectIndex >= 0) {
            const cells = generatePreviewCells(
                x,
                y,
                selectedObjectIndex,
                currentObjects,
                placementOrientation
            );
            setPreviewCells(cells);
        }
    };

    const handleCellLeave = () => {
        if (placementMode === 'placing') {
            setPreviewCells([]);
        }
    };

    const startPlacing = (objectIndex: number) => {
        setPlacementMode('placing');
        setSelectedObjectIndex(objectIndex);
        setPreviewCells([]);
    };

    const cancelPlacement = () => {
        setPlacementMode('opened');
        setSelectedObjectIndex(-1);
        setPreviewCells([]);
    };

    const removeObject = (objectId: string) => {
        const newPlacedObjects = placedObjects.filter(
            (obj) => obj.id !== objectId
        );
        setPlacedObjects(newPlacedObjects);
        setPreviewCells([]);
    };

    const toggleOrientation = () => {
        setPlacementOrientation((prev) =>
            prev === 'horizontal' ? 'vertical' : 'horizontal'
        );
    };

    const eventStatuses: EventStatus[] = useMemo(() => {
        const now = dayjs.tz();

        const parseDate = (value?: string | null) => {
            if (!value) return null;
            const parsed = dayjs.tz(value, EVENT_TIME_FORMAT, 'Asia/Seoul');
            return parsed.isValid() ? parsed : null;
        };

        return availableEvents
            .map((event) => {
                const start = parseDate(event.startDate);
                const end = parseDate(event.endDate);

                if (!start && !end) {
                    return null;
                }

                if (start && now.isBefore(start)) {
                    const hoursDiff = start.diff(now, 'hour');
                    const daysRemaining = Math.max(
                        1,
                        Math.ceil(hoursDiff / 24)
                    );

                    return {
                        eventName: event.name,
                        statusText: `${daysRemaining}일 남음`,
                        detailText: `${start.format(EVENT_TIME_FORMAT)} 시작`,
                        highlight: false,
                    } satisfies EventStatus;
                }

                if (start && (!end || now.isBefore(end))) {
                    const rangeLabel = [start, end]
                        .filter((date): date is dayjs.Dayjs => Boolean(date))
                        .map((date) => date.format(EVENT_TIME_FORMAT))
                        .join(' ~ ');

                    return {
                        eventName: event.name,
                        statusText: '진행중',
                        detailText: rangeLabel || '진행중',
                        highlight: true,
                    } satisfies EventStatus;
                }

                if (!start && end && now.isBefore(end)) {
                    return {
                        eventName: event.name,
                        statusText: '진행중',
                        detailText: `~ ${end.format(EVENT_TIME_FORMAT)}`,
                        highlight: true,
                    } satisfies EventStatus;
                }

                if (end && now.isAfter(end)) {
                    const rangeLabel = [start, end]
                        .filter((date): date is dayjs.Dayjs => Boolean(date))
                        .map((date) => date.format(EVENT_TIME_FORMAT))
                        .join(' ~ ');

                    return {
                        eventName: event.name,
                        statusText: '종료',
                        detailText:
                            rangeLabel ||
                            `${end.format(EVENT_TIME_FORMAT)} 종료`,
                        highlight: false,
                    } satisfies EventStatus;
                }

                return {
                    eventName: event.name,
                    statusText: '일정 확인 필요',
                    detailText: '추가 정보 필요',
                    highlight: false,
                } satisfies EventStatus;
            })
            .filter((status): status is EventStatus => Boolean(status));
    }, [availableEvents]);

    return (
        <div className="space-y-8">
            <section className="space-y-6">
                <Card className="border-border/60 bg-card/95 supports-[backdrop-filter]:bg-card/80 border shadow-sm backdrop-blur-sm">
                    <CardHeader className="space-y-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="text-lg font-semibold">
                                    이벤트 설정
                                </CardTitle>
                                <CardDescription>
                                    이벤트와 케이스를 선택하세요.
                                </CardDescription>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setIsResetDialogOpen(true)}
                                >
                                    커스텀 이벤트 초기화
                                </Button>
                                <SettingsModal
                                    trigger={
                                        <Button variant="outline" size="sm">
                                            커스텀 이벤트 관리
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
                                    updateCaseInCustomEvent={
                                        updateCaseInCustomEvent
                                    }
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
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <EventSelection
                            selectedEvent={selectedEvent}
                            selectedCase={selectedCase}
                            availableEvents={availableEvents}
                            caseOptions={caseOptions}
                            currentObjects={currentObjects}
                            onEventChange={setSelectedEvent}
                            onCaseChange={setSelectedCase}
                        />

                        {eventStatuses.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
                                    이벤트 일정
                                </p>
                                <div className="space-y-2">
                                    {eventStatuses.map(
                                        ({
                                            eventName,
                                            statusText,
                                            detailText,
                                            highlight,
                                        }) => (
                                            <div
                                                key={eventName}
                                                className="border-border/60 bg-muted/50 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-sm"
                                            >
                                                <div className="min-w-0 space-y-1">
                                                    <p className="text-foreground text-sm font-semibold">
                                                        {eventName}
                                                    </p>
                                                    <p className="text-muted-foreground text-xs">
                                                        {detailText}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant={
                                                        highlight
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                    className={cn(
                                                        'rounded-full px-4 py-1 text-xs font-medium tracking-wide uppercase',
                                                        highlight
                                                            ? 'bg-primary/90 text-primary-foreground shadow'
                                                            : 'border-border/60 bg-background/60'
                                                    )}
                                                >
                                                    {statusText}
                                                </Badge>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/95 supports-[backdrop-filter]:bg-card/80 border shadow-sm backdrop-blur-sm">
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-lg font-semibold">
                                배치 시뮬레이션 보드
                            </CardTitle>
                            <CardDescription>
                                배치 상태를 한눈에 살펴보세요.
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBoardReset}
                        >
                            보드 초기화
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <InventoryGrid
                            openedCells={openedCells}
                            placedObjects={placedObjects}
                            previewCells={previewCells}
                            placementMode={placementMode}
                            objectTypeColors={objectTypeColors}
                            hoveredObjectId={hoveredObjectId}
                            onCellClick={handleCellClick}
                            onCellHover={handleCellHover}
                            onCellTouch={handleCellTouch}
                            onCellLeave={handleCellLeave}
                            onPreviewClear={() => setPreviewCells([])}
                            currentObjects={currentObjects}
                            remainingCounts={remainingCounts}
                            selectedObjectIndex={selectedObjectIndex}
                            placementOrientation={placementOrientation}
                            onStartPlacing={startPlacing}
                            onToggleOrientation={toggleOrientation}
                            onCancelPlacement={cancelPlacement}
                            onRemoveObject={removeObject}
                            onSetHoveredObjectId={setHoveredObjectId}
                        />
                    </CardContent>
                </Card>
            </section>

            <Card className="border-border/60 bg-card/95 supports-[backdrop-filter]:bg-card/80 border shadow-sm backdrop-blur-sm">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-lg font-semibold">
                            배치 확률
                        </CardTitle>
                    </div>
                    {lastCalculationTime !== null &&
                        !isCalculating &&
                        !calculationError && (
                            <Badge
                                variant="outline"
                                className="border-border/60 bg-background/60 text-muted-foreground"
                                style={{
                                    fontFamily: 'unifont',
                                }}
                            >
                                {lastCalculationTime.toFixed(1)}ms
                            </Badge>
                        )}
                </CardHeader>
                <CardContent>
                    {isCalculating ? (
                        <div className="border-border/60 bg-muted/30 flex h-[458px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-12 text-center">
                            <div className="border-border/60 h-10 w-10 animate-spin rounded-full border-2 border-t-transparent" />
                            <div>
                                <p className="text-foreground font-semibold">
                                    확률 계산 중...
                                </p>
                                <p className="text-muted-foreground text-sm">
                                    복잡한 계산이 진행 중입니다. 잠시만
                                    기다려주세요.
                                </p>
                            </div>
                        </div>
                    ) : calculationError ? (
                        <div className="bg-destructive/10 text-destructive border-destructive/30 flex flex-col gap-3 rounded-xl border p-6 text-center shadow-sm">
                            <p className="text-base font-semibold">계산 오류</p>
                            <p className="text-destructive/80 text-sm">
                                {calculationError}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <ProbabilityResultsGrid
                                probabilities={probabilities}
                                openedCells={openedCells}
                                placedObjects={placedObjects}
                                highestCells={highestCells}
                                secondHighestCells={secondHighestCells}
                                objectTypeColors={objectTypeColors}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog
                open={isResetDialogOpen}
                onOpenChange={setIsResetDialogOpen}
            >
                <DialogContent className="border-border/60 bg-card/95">
                    <DialogHeader>
                        <DialogTitle>커스텀 이벤트 초기화</DialogTitle>
                        <DialogDescription>
                            저장된 커스텀 이벤트와 자동 저장된 상태를 모두
                            초기화합니다. 정말 진행할까요?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
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
                            초기화 진행
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default InventoryDashboard;
