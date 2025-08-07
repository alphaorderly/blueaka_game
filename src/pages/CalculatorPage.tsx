import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    GameObject,
    GridPosition,
    PlacedObject,
    PlacementMode,
} from '../types/calculator';
import { calculateProbabilities } from '../utils/probabilityCalculator';
import { useCalculatorState } from '../hooks/useCalculatorState';
import { useObjectTypeColors } from '../hooks/calculator/useObjectTypeColors';
import { useProbabilityRankings } from '../hooks/calculator/useProbabilityRankings';
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
    const [probabilities, setProbabilities] = useState<number[][]>([]);
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

    // Calculate probabilities whenever inputs change
    const calculateAndDisplayResult = useCallback(() => {
        if (currentObjects.length === 0) return;

        // Update objects with remaining counts
        const adjustedObjects = currentObjects.map((obj, index) => ({
            ...obj,
            count: remainingCounts[index],
        }));

        // Combine opened cells and placed object cells
        const allBlockedCells = [
            ...openedCells,
            ...placedObjects.flatMap((obj) => obj.cells),
        ];

        const newProbabilities = calculateProbabilities(
            adjustedObjects,
            allBlockedCells
        );
        setProbabilities(newProbabilities);
    }, [currentObjects, openedCells, placedObjects, remainingCounts]);

    useEffect(() => {
        calculateAndDisplayResult();
    }, [calculateAndDisplayResult]);

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
                                <ProbabilityResultsGrid
                                    probabilities={probabilities}
                                    openedCells={openedCells}
                                    placedObjects={placedObjects}
                                    highestCells={highestCells}
                                    secondHighestCells={secondHighestCells}
                                    objectTypeColors={objectTypeColors}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CalculatorPage;
