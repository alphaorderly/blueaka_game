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
import { SettingsModal } from '../components/settings/SettingsModal';
import { CalculatorHeader } from '../components/layout/CalculatorHeader';
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
        autoSave,
        availableEvents,
        customEvents,
        setSelectedEvent,
        setSelectedCase,
        setOpenedCells,
        setPlacedObjects,
        setAutoSave,
        clearGridState,
        resetToDefaults,
        downloadFile,
        createCustomEvent,
        updateCustomEvent,
        deleteCustomEvent,
        exportCustomEvent,
        importCustomEvent,
        addCaseToCustomEvent,
        removeCaseFromCustomEvent,
        updateCaseInCustomEvent,
        addObjectToCustomEventCase,
        removeObjectFromCustomEventCase,
        updateObjectInCustomEventCase,
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
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);

    // Object colors by object type (objectIndex), not by individual placed object
    const { objectTypeColors, resetColors } =
        useObjectTypeColors(currentObjects);

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

    const handleClearState = () => {
        clearGridState();
        setPlacementMode('opened');
        setSelectedObjectIndex(-1);
        setPreviewCells([]);
    };

    const handleResetToDefaults = () => {
        resetToDefaults();
        setPlacementMode('opened');
        setSelectedObjectIndex(-1);
        setPreviewCells([]);
        resetColors();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Navigation Header */}
            <div className="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
                <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <CalculatorHeader
                        autoSave={autoSave}
                        onSettingsOpen={() => setIsSettingsOpen(true)}
                        onClearState={handleClearState}
                        onToggleAutoSave={() => setAutoSave(!autoSave)}
                        onResetToDefaults={handleResetToDefaults}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Event Selection Section */}
                <Card className="bg-background/80 dark:bg-background/90 mb-6 border-0 py-0 shadow-xl backdrop-blur-sm">
                    <CardContent className="p-6">
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
                <div className="grid gap-6">
                    {/* Interactive Game Grid with Object Placement */}
                    <Card className="bg-background/80 dark:bg-background/90 border-0 py-0 shadow-xl backdrop-blur-sm">
                        <CardContent className="flex flex-col items-center p-6">
                            <div className="w-full max-w-4xl">
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
                        <CardContent className="flex flex-col items-center p-6">
                            <div className="w-full max-w-2xl">
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

            {/* Settings Modal */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                customEvents={customEvents}
                selectedEvent={selectedEvent}
                createCustomEvent={createCustomEvent}
                updateCustomEvent={updateCustomEvent}
                deleteCustomEvent={deleteCustomEvent}
                setSelectedEvent={setSelectedEvent}
                exportCustomEvent={exportCustomEvent}
                importCustomEvent={importCustomEvent}
                downloadFile={downloadFile}
                addCaseToCustomEvent={addCaseToCustomEvent}
                removeCaseFromCustomEvent={removeCaseFromCustomEvent}
                updateCaseInCustomEvent={updateCaseInCustomEvent}
                addObjectToCustomEventCase={addObjectToCustomEventCase}
                removeObjectFromCustomEventCase={
                    removeObjectFromCustomEventCase
                }
                updateObjectInCustomEventCase={updateObjectInCustomEventCase}
            />
        </div>
    );
};

export default CalculatorPage;
