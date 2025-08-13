import React, { useState, useEffect, useMemo } from 'react';
import {
    GameObject,
    GridPosition,
    PlacedObject,
    PlacementMode,
} from '../types/calculator';
import { useCalculatorState } from '../hooks/useCalculatorState';
import { useObjectTypeColors } from '../hooks/calculator/useObjectTypeColors';
import { useProbabilityRankings } from '../hooks/calculator/useProbabilityRankings';
import { useProbabilityCalculation } from '../hooks/calculator/useProbabilityCalculation';
import {
    generatePreviewCells,
    isValidPlacement,
} from '../utils/calculator/gridUtils';
import { Card, CardContent } from '../components/ui/card';
import { EventSelection } from '../components/forms/EventSelection';
import { GameGrid } from '../components/game/GameGrid';
import { ProbabilityResultsGrid } from '../components/visualization/ProbabilityResultsGrid';

const CalculatorPage: React.FC = () => {
    // Use the custom hook for all persistent state
    const {
        selectedEvent,
        selectedCase,
        caseOptions,
        openedCells,
        placedObjects,
        availableEvents,
        setSelectedEvent,
        setSelectedCase,
        setOpenedCells,
        setPlacedObjects,
    } = useCalculatorState();

    // Local state for UI interactions (not persisted)
    const [currentObjects, setCurrentObjects] = useState<GameObject[]>([]);
    const [placementMode, setPlacementMode] = useState<PlacementMode>('opened');
    const [selectedObjectIndex, setSelectedObjectIndex] = useState<number>(-1);
    const [placementOrientation, setPlacementOrientation] = useState<
        'horizontal' | 'vertical'
    >('horizontal');
    const [previewCells, setPreviewCells] = useState<GridPosition[]>([]);
    const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);

    // Object colors by object type (objectIndex), not by individual placed object
    const { objectTypeColors } = useObjectTypeColors(currentObjects);

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

    // Calculate remaining object counts based on placed objects (memoized)
    const remainingCounts = useMemo(() => {
        return currentObjects.map((obj, index) => {
            const placedCount = placedObjects.filter(
                (placed) => placed.objectIndex === index
            ).length;
            return Math.max(0, obj.totalCount - placedCount);
        });
    }, [currentObjects, placedObjects]);

    // Prepare objects for probability calculation
    const adjustedObjects = useMemo(() => {
        return currentObjects.map((obj, index) => ({
            ...obj,
            count: remainingCounts[index],
        }));
    }, [currentObjects, remainingCounts]);

    // Combine opened cells and placed object cells
    const allBlockedCells = useMemo(() => {
        return [...openedCells, ...placedObjects.flatMap((obj) => obj.cells)];
    }, [openedCells, placedObjects]);

    // Use the probability calculation hook
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
            // Don't allow opening/closing cells that have placed objects on them
            const placedObjects_temp = placedObjects.some((obj) =>
                obj.cells.some((cell) => cell.x === x && cell.y === y)
            );
            if (placedObjects_temp) {
                return;
            }

            // Toggle opened cells
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
            // Place object
            const previewCells = generatePreviewCells(
                x,
                y,
                selectedObjectIndex,
                currentObjects,
                placementOrientation
            );
            if (
                isValidPlacement(previewCells, placedObjects) &&
                previewCells.length > 0
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
                    cells: previewCells,
                };
                const newPlacedObjects = [...placedObjects, newPlacedObject];
                setPlacedObjects(newPlacedObjects);

                // Always return to opened mode after placing an object
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
        // For mobile devices, show preview on touch
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

    return (
        <div>
            {/* Main Content */}
            <div className="w-full px-2 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8">
                {/* Event Selection Section */}
                <Card className="bg-background/80 dark:bg-background/90 mb-4 border-0 py-0 shadow-xl backdrop-blur-sm sm:mb-6">
                    <CardContent className="p-4 sm:p-6">
                        <div className="mb-4">
                            <h2 className="text-foreground text-lg font-semibold">
                                이벤트 설정
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                계산할 이벤트와 케이스를 선택하세요
                            </p>
                        </div>
                        <EventSelection
                            selectedEvent={selectedEvent}
                            selectedCase={selectedCase}
                            availableEvents={availableEvents}
                            caseOptions={caseOptions}
                            currentObjects={currentObjects}
                            onEventChange={setSelectedEvent}
                            onCaseChange={setSelectedCase}
                        />
                    </CardContent>
                </Card>

                {/* Main Game Area */}
                <div className="grid gap-4 sm:gap-6">
                    {/* Interactive Game Grid with Object Placement */}
                    <Card className="bg-background/80 dark:bg-background/90 border-0 py-0 shadow-xl backdrop-blur-sm">
                        <CardContent className="flex flex-col items-center p-4 sm:p-6">
                            <div className="w-full max-w-5xl">
                                <GameGrid
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
                            </div>
                        </CardContent>
                    </Card>

                    {/* Probability Results Section */}
                    <Card className="bg-background/80 dark:bg-background/90 border-0 py-0 shadow-xl backdrop-blur-sm">
                        <CardContent className="flex flex-col items-center p-4 sm:p-6">
                            <div className="w-full max-w-3xl">
                                {isCalculating ? (
                                    <div className="flex flex-col items-center justify-center space-y-4 py-12">
                                        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
                                        <div className="text-center">
                                            <p className="text-foreground text-lg font-medium">
                                                확률 계산 중...
                                            </p>
                                            <p className="text-muted-foreground mt-1 text-sm">
                                                복잡한 계산이 진행 중입니다.
                                                잠시만 기다려주세요.
                                            </p>
                                        </div>
                                    </div>
                                ) : calculationError ? (
                                    <div className="flex flex-col items-center justify-center space-y-4 py-12">
                                        <div className="text-red-500">
                                            <svg
                                                className="h-8 w-8"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-medium text-red-600">
                                                계산 오류
                                            </p>
                                            <p className="text-muted-foreground mt-1 text-sm">
                                                {calculationError}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <ProbabilityResultsGrid
                                            probabilities={probabilities}
                                            openedCells={openedCells}
                                            placedObjects={placedObjects}
                                            highestCells={highestCells}
                                            secondHighestCells={
                                                secondHighestCells
                                            }
                                            objectTypeColors={objectTypeColors}
                                        />
                                        {lastCalculationTime !== null && (
                                            <div className="mt-4 text-center">
                                                <p className="text-muted-foreground text-xs">
                                                    계산 시간:{' '}
                                                    {lastCalculationTime.toFixed(
                                                        1
                                                    )}
                                                    ms
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CalculatorPage;
