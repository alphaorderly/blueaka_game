import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    GameObject,
    GridPosition,
    ProbabilityCell,
    PlacedObject,
    PlacementMode,
} from '../types/calculator';
import { GRID_WIDTH, GRID_HEIGHT } from '../consts/gameData';
import { calculateProbabilities } from '../utils/probabilityCalculator';
import { useCalculatorState } from '../hooks/useCalculatorState';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Button } from './ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import SettingsModal from './SettingsModal';

const Calculator: React.FC = () => {
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
    } = useCalculatorState(); // Local state for UI interactions (not persisted)
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
    const [objectTypeColors, setObjectTypeColors] = useState<{
        [objectIndex: number]: {
            hue: number;
            lightBg: string;
            lightText: string;
            darkBg: string;
            darkText: string;
            className: string;
        };
    }>({});

    // Generate color for object type
    const generateColorForObjectType = useCallback(() => {
        // Get existing hues to avoid duplicates
        const existingHues = Object.values(objectTypeColors)
            .map((color) => {
                if (color && color.hue) return color.hue;
                return -1;
            })
            .filter((hue) => hue >= 0);

        let hue: number;
        let attempts = 0;

        // Try to find a hue that's at least 30 degrees away from existing ones
        do {
            hue = Math.floor(Math.random() * 360);
            attempts++;
        } while (
            attempts < 50 &&
            existingHues.some(
                (existingHue) =>
                    Math.abs(hue - existingHue) < 30 ||
                    Math.abs(hue - existingHue) > 330
            )
        );

        // Use consistent saturation and lightness for good readability
        const saturation = 65 + Math.floor(Math.random() * 25); // 65-90%
        const lightness = 75 + Math.floor(Math.random() * 15); // 75-90%

        // Generate random dark mode colors
        const darkSaturation = 45 + Math.floor(Math.random() * 25); // 45-70%
        const darkLightness = 25 + Math.floor(Math.random() * 20); // 25-45%

        // Create CSS custom properties for the colors
        const lightBg = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        const lightText = `hsl(${hue}, 70%, 20%)`; // Dark text for light background
        const darkBg = `hsl(${hue}, ${darkSaturation}%, ${darkLightness}%)`;
        const darkText = `hsl(${hue}, 60%, 85%)`; // Light text for dark background

        return {
            hue,
            lightBg,
            lightText,
            darkBg,
            darkText,
            className: `border border-current`,
        };
    }, [objectTypeColors]);

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

    // Effect to ensure colors exist for all current object types
    useEffect(() => {
        const objectTypesNeedingColors = currentObjects
            .map((_, index) => index)
            .filter((objectIndex) => !objectTypeColors[objectIndex]);

        if (objectTypesNeedingColors.length > 0) {
            const newColors: {
                [objectIndex: number]: {
                    hue: number;
                    lightBg: string;
                    lightText: string;
                    darkBg: string;
                    darkText: string;
                    className: string;
                };
            } = {};

            objectTypesNeedingColors.forEach((objectIndex) => {
                newColors[objectIndex] = generateColorForObjectType();
            });

            setObjectTypeColors((prev) => ({ ...prev, ...newColors }));
        }

        // Clean up colors for object types that no longer exist
        const currentObjectIndices = new Set(
            currentObjects.map((_, index) => index)
        );
        const obsoleteColorIndices = Object.keys(objectTypeColors)
            .map(Number)
            .filter((index) => !currentObjectIndices.has(index));

        if (obsoleteColorIndices.length > 0) {
            setObjectTypeColors((prev) => {
                const newColors = { ...prev };
                obsoleteColorIndices.forEach(
                    (index) => delete newColors[index]
                );
                return newColors;
            });
        }
    }, [currentObjects, objectTypeColors, generateColorForObjectType]);

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
    // Generate preview cells for object placement
    const generatePreviewCells = (
        x: number,
        y: number,
        objIndex: number,
        orientation: 'horizontal' | 'vertical'
    ): GridPosition[] => {
        if (objIndex < 0 || objIndex >= currentObjects.length) return [];

        const obj = currentObjects[objIndex];
        const width = orientation === 'horizontal' ? obj.w : obj.h;
        const height = orientation === 'horizontal' ? obj.h : obj.w;

        // Check if the entire object would fit within bounds
        if (
            x + width > GRID_WIDTH ||
            y + height > GRID_HEIGHT ||
            x < 0 ||
            y < 0
        ) {
            return []; // Return empty array if object doesn't fit
        }

        const cells: GridPosition[] = [];
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const cellX = x + dx;
                const cellY = y + dy;
                cells.push({ x: cellX, y: cellY });
            }
        }
        return cells;
    };
    // Check if placement is valid
    const isValidPlacement = (cells: GridPosition[]): boolean => {
        return cells.every((cell) => {
            // Check bounds
            if (
                cell.x >= GRID_WIDTH ||
                cell.y >= GRID_HEIGHT ||
                cell.x < 0 ||
                cell.y < 0
            )
                return false;

            // Only check if cell is already occupied by other placed objects
            // Allow placement on opened cells (since those are found items we want to visualize)
            const isOccupied = placedObjects.some((obj) =>
                obj.cells.some(
                    (occupiedCell) =>
                        occupiedCell.x === cell.x && occupiedCell.y === cell.y
                )
            );

            return !isOccupied;
        });
    };
    const handleCellClick = (x: number, y: number) => {
        if (placementMode === 'opened') {
            // Don't allow opening/closing cells that have placed objects on them
            if (isCellOccupied(x, y)) {
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
                placementOrientation
            );
            if (isValidPlacement(previewCells) && previewCells.length > 0) {
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

                // No need to assign color here - color is determined by objectIndex

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

        // No need to remove color - colors are managed by object type, not individual objects
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
        // Keep object type colors - they should persist for the same event/case
    };

    const handleResetToDefaults = () => {
        resetToDefaults();
        setPlacementMode('opened');
        setSelectedObjectIndex(-1);
        setPreviewCells([]);
        setObjectTypeColors({});
    };

    const isCellOpened = (x: number, y: number) => {
        return openedCells.some((cell) => cell.x === x && cell.y === y);
    };

    const isCellOccupied = (x: number, y: number) => {
        return placedObjects.some((obj) =>
            obj.cells.some((cell) => cell.x === x && cell.y === y)
        );
    };

    const isCellPreview = (x: number, y: number) => {
        return previewCells.some((cell) => cell.x === x && cell.y === y);
    };

    const getPlacedObjectAt = (x: number, y: number) => {
        return placedObjects.find((obj) =>
            obj.cells.some((cell) => cell.x === x && cell.y === y)
        );
    };

    // Get probability rankings
    const getProbabilityRankings = () => {
        const probabilityList: ProbabilityCell[] = [];

        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (
                    !isCellOpened(x, y) &&
                    !isCellOccupied(x, y) &&
                    probabilities[y] &&
                    probabilities[y][x] > 0
                ) {
                    probabilityList.push({ x, y, prob: probabilities[y][x] });
                }
            }
        }

        probabilityList.sort((a, b) => b.prob - a.prob);

        const highest =
            probabilityList.length > 0 ? probabilityList[0].prob : 0;
        const highestCells = probabilityList.filter(
            (cell) => cell.prob === highest
        );

        const secondHighest =
            probabilityList.find((cell) => cell.prob < highest)?.prob || 0;
        const secondHighestCells = probabilityList
            .filter((cell) => cell.prob === secondHighest)
            .slice(0, 2);

        return { highestCells, secondHighestCells };
    };
    const { highestCells, secondHighestCells } = getProbabilityRankings();

    // Helper function to get cell styles for placed objects
    const getCellStyles = (x: number, y: number) => {
        if (isCellOccupied(x, y)) {
            const placedObj = getPlacedObjectAt(x, y);
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

    const getCellClassName = (x: number, y: number, isResult = false) => {
        const cellSizeClass = isResult
            ? 'grid-cell-result'
            : 'grid-cell-mobile';
        const baseClass = `${cellSizeClass} border border-border flex items-center justify-center relative mobile-focus ${isResult ? 'cursor-default' : 'cursor-pointer hover:bg-accent hover:text-accent-foreground touch-target'}`;

        // Check if cell has a placed object first (highest priority)
        if (isCellOccupied(x, y)) {
            const placedObj = getPlacedObjectAt(x, y);
            const isHovered = placedObj && hoveredObjectId === placedObj.id;
            const hoverColorClass = isHovered ? `ring-2 ring-blue-500` : '';
            return `${baseClass} ${hoverColorClass} dark:[background-color:var(--dark-bg)] dark:[color:var(--dark-text)]`;
        }

        // Preview cells (second priority)
        if (isCellPreview(x, y)) {
            const isValid = isValidPlacement(previewCells);
            const previewClass = isValid
                ? 'bg-blue-300 text-blue-900'
                : 'bg-red-300 text-red-900';
            return `${baseClass} ${previewClass}`;
        }

        // Opened cells (lower priority, only if no object placed)
        if (isCellOpened(x, y)) {
            return `${baseClass} ${isResult ? 'bg-muted' : 'bg-muted-foreground'} text-muted-foreground`;
        }

        // Result highlighting for probability display
        if (isResult) {
            if (highestCells.some((cell) => cell.x === x && cell.y === y)) {
                return `${baseClass} bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100`;
            }
            if (
                secondHighestCells.some((cell) => cell.x === x && cell.y === y)
            ) {
                return `${baseClass} bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100`;
            }
        }

        return `${baseClass} bg-card text-card-foreground`;
    };
    const renderCornerTriangle = (x: number, y: number) => {
        if (highestCells.some((cell) => cell.x === x && cell.y === y)) {
            return (
                <div className="absolute top-0 right-0 h-0 w-0 border-t-[8px] border-l-[8px] border-t-blue-600 border-l-transparent sm:border-t-[10px] sm:border-l-[10px]" />
            );
        }
        if (secondHighestCells.some((cell) => cell.x === x && cell.y === y)) {
            return (
                <div className="absolute top-0 right-0 h-0 w-0 border-t-[8px] border-l-[8px] border-t-red-600 border-l-transparent sm:border-t-[10px] sm:border-l-[10px]" />
            );
        }
        return null;
    };

    const renderCellContent = (x: number, y: number, isResult = false) => {
        if (isCellOccupied(x, y)) {
            const placedObj = getPlacedObjectAt(x, y);
            if (placedObj && placedObj.startX === x && placedObj.startY === y) {
                return `${placedObj.objectIndex + 1}`;
            }
            return '';
        }

        if (
            isResult &&
            probabilities[y] &&
            !isCellOpened(x, y) &&
            !isCellOccupied(x, y)
        ) {
            return `${(probabilities[y][x] * 100).toFixed(1)}%`;
        }

        return '';
    };
    return (
        <div className="xs:p-2 bg-background prevent-horizontal-scroll dark-mobile-optimized mx-auto min-h-screen max-w-6xl px-1 py-1 sm:p-4 lg:p-6">
            <Card className="mb-4 sm:mb-6">
                {' '}
                <CardHeader className="pb-4 sm:pb-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="text-center text-xl sm:text-left sm:text-2xl">
                            계산기
                        </CardTitle>{' '}
                        <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
                            {' '}
                            <Button
                                variant="outline"
                                onClick={() => setIsSettingsOpen(true)}
                                size="sm"
                                className="text-xs sm:text-sm"
                            >
                                ⚙️ <span>설정</span>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleClearState}
                                size="sm"
                                className="text-xs sm:text-sm"
                            >
                                🗑️ <span>상태 초기화</span>
                            </Button>
                            <Button
                                variant={autoSave ? 'default' : 'outline'}
                                onClick={() => setAutoSave(!autoSave)}
                                size="sm"
                                className="text-xs sm:text-sm"
                            >
                                💾{' '}
                                <span>자동저장 {autoSave ? 'ON' : 'OFF'}</span>
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleResetToDefaults}
                                size="sm"
                                className="text-xs sm:text-sm"
                            >
                                🔄 <span>완전 초기화</span>
                            </Button>
                        </div>
                    </div>
                </CardHeader>{' '}
                <CardContent className="xs:p-3 px-1 py-2 sm:p-6">
                    <div className="mb-4 sm:mb-6">
                        <Label
                            htmlFor="event-select"
                            className="mb-2 block text-base font-semibold sm:text-lg"
                        >
                            이벤트 선택
                        </Label>
                        <Select
                            value={selectedEvent}
                            onValueChange={setSelectedEvent}
                        >
                            <SelectTrigger className="mb-4 w-full sm:w-[350px]">
                                <SelectValue placeholder="이벤트를 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableEvents.map((event) => (
                                    <SelectItem key={event.id} value={event.id}>
                                        {event.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Label
                            htmlFor="case-select"
                            className="mb-2 block text-base font-semibold sm:text-lg"
                        >
                            회차 선택
                        </Label>
                        <Select
                            value={selectedCase}
                            onValueChange={setSelectedCase}
                        >
                            <SelectTrigger className="mb-4 w-full sm:w-[250px]">
                                <SelectValue placeholder="회차를 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                                {caseOptions.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="text-muted-foreground mb-4 text-xs sm:text-sm">
                            <div className="mb-2">
                                <strong>현재 이벤트:</strong>{' '}
                                {availableEvents.find(
                                    (e) => e.id === selectedEvent
                                )?.name || '알 수 없는 이벤트'}
                            </div>
                            <div>
                                <strong>물건 목록:</strong>{' '}
                                {currentObjects
                                    .map(
                                        (obj, index) =>
                                            `물건 ${index + 1}: ${obj.w}x${obj.h} ${obj.totalCount}개`
                                    )
                                    .join(', ')}
                            </div>
                        </div>
                    </div>{' '}
                    <div className="flex flex-col gap-4 sm:gap-6">
                        {/* Main content - object placement and game grid */}
                        <div>
                            <div className="mb-4 sm:mb-6">
                                <Label className="mb-2 block text-base font-semibold sm:text-lg">
                                    찾은 물건 배치
                                </Label>
                                <div className="mb-4 space-y-2">
                                    {currentObjects.map((obj, index) => {
                                        const remaining =
                                            remainingCounts[index];
                                        const placed =
                                            obj.totalCount - remaining;
                                        return (
                                            <div
                                                key={index}
                                                className="flex max-w-100 flex-col gap-2 rounded border p-2 sm:flex-row sm:items-center"
                                            >
                                                <span className="flex-1 text-xs sm:text-sm">
                                                    물건 {index + 1} ({obj.w}x
                                                    {obj.h}): {placed}/
                                                    {obj.totalCount}개 배치됨
                                                </span>
                                                {remaining > 0 && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            startPlacing(index)
                                                        }
                                                        disabled={
                                                            placementMode ===
                                                                'placing' &&
                                                            selectedObjectIndex ===
                                                                index
                                                        }
                                                        className="w-full text-xs sm:w-auto"
                                                    >
                                                        {placementMode ===
                                                            'placing' &&
                                                        selectedObjectIndex ===
                                                            index
                                                            ? '배치 중...'
                                                            : '배치'}
                                                    </Button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {placementMode === 'placing' &&
                                    selectedObjectIndex >= 0 && (
                                        <div className="rounded border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
                                            <p className="mb-2 text-xs sm:text-sm">
                                                물건 {selectedObjectIndex + 1}{' '}
                                                배치 중... (
                                                {placementOrientation ===
                                                'horizontal'
                                                    ? `${currentObjects[selectedObjectIndex].w}x${currentObjects[selectedObjectIndex].h}`
                                                    : `${currentObjects[selectedObjectIndex].h}x${currentObjects[selectedObjectIndex].w}`}
                                                )
                                            </p>{' '}
                                            {/* Visual orientation indicator for mobile */}
                                            <div className="mb-3 flex items-start gap-2">
                                                <span className="text-muted-foreground text-xs">
                                                    배치 방향:
                                                </span>
                                                <div className="flex items-start gap-2">
                                                    <div className="flex">
                                                        {placementOrientation ===
                                                        'horizontal' ? (
                                                            // Show horizontal layout: w columns, h rows
                                                            <div className="flex flex-col gap-px">
                                                                {Array.from(
                                                                    {
                                                                        length: currentObjects[
                                                                            selectedObjectIndex
                                                                        ].h,
                                                                    },
                                                                    (
                                                                        _,
                                                                        rowIndex
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                rowIndex
                                                                            }
                                                                            className="flex gap-px"
                                                                        >
                                                                            {Array.from(
                                                                                {
                                                                                    length: currentObjects[
                                                                                        selectedObjectIndex
                                                                                    ]
                                                                                        .w,
                                                                                },
                                                                                (
                                                                                    _,
                                                                                    colIndex
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            colIndex
                                                                                        }
                                                                                        className="h-2.5 w-2.5 border border-blue-500 bg-blue-300"
                                                                                    ></div>
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>
                                                        ) : (
                                                            // Show vertical layout: h columns, w rows
                                                            <div className="flex flex-col gap-px">
                                                                {Array.from(
                                                                    {
                                                                        length: currentObjects[
                                                                            selectedObjectIndex
                                                                        ].w,
                                                                    },
                                                                    (
                                                                        _,
                                                                        rowIndex
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                rowIndex
                                                                            }
                                                                            className="flex gap-px"
                                                                        >
                                                                            {Array.from(
                                                                                {
                                                                                    length: currentObjects[
                                                                                        selectedObjectIndex
                                                                                    ]
                                                                                        .h,
                                                                                },
                                                                                (
                                                                                    _,
                                                                                    colIndex
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            colIndex
                                                                                        }
                                                                                        className="h-2.5 w-2.5 border border-blue-500 bg-blue-300"
                                                                                    ></div>
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-xs">
                                                        (
                                                        {placementOrientation ===
                                                        'horizontal'
                                                            ? '가로'
                                                            : '세로'}{' '}
                                                        -{' '}
                                                        {placementOrientation ===
                                                        'horizontal'
                                                            ? `${currentObjects[selectedObjectIndex].w}×${currentObjects[selectedObjectIndex].h}`
                                                            : `${currentObjects[selectedObjectIndex].h}×${currentObjects[selectedObjectIndex].w}`}
                                                        )
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 sm:flex-row">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={toggleOrientation}
                                                    className="text-xs"
                                                >
                                                    회전 (
                                                    {placementOrientation ===
                                                    'horizontal'
                                                        ? '세로로'
                                                        : '가로로'}
                                                    )
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={cancelPlacement}
                                                    className="text-xs"
                                                >
                                                    취소
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                {placedObjects.length > 0 && (
                                    <div className="mt-4">
                                        <Label className="mb-2 block text-sm font-semibold">
                                            배치된 물건 ({placedObjects.length}
                                            개)
                                        </Label>
                                        <div className="flex flex-wrap gap-1">
                                            {' '}
                                            {placedObjects.map((placedObj) => {
                                                const colorData =
                                                    objectTypeColors[
                                                        placedObj.objectIndex
                                                    ];
                                                const isHovered =
                                                    hoveredObjectId ===
                                                    placedObj.id;

                                                const listItemStyle = colorData
                                                    ? ({
                                                          backgroundColor:
                                                              colorData.lightBg,
                                                          color: colorData.lightText,
                                                          '--dark-bg':
                                                              colorData.darkBg,
                                                          '--dark-text':
                                                              colorData.darkText,
                                                      } as React.CSSProperties)
                                                    : {};

                                                return (
                                                    <div
                                                        key={placedObj.id}
                                                        className={`flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
                                                            colorData
                                                                ? 'dark:[background-color:var(--dark-bg)] dark:[color:var(--dark-text)]'
                                                                : 'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                                                        } ${
                                                            isHovered
                                                                ? 'ring-2 ring-blue-500'
                                                                : 'hover:opacity-80'
                                                        }`}
                                                        style={listItemStyle}
                                                        onMouseEnter={() =>
                                                            setHoveredObjectId(
                                                                placedObj.id
                                                            )
                                                        }
                                                        onMouseLeave={() =>
                                                            setHoveredObjectId(
                                                                null
                                                            )
                                                        }
                                                        onClick={() =>
                                                            removeObject(
                                                                placedObj.id
                                                            )
                                                        }
                                                    >
                                                        <span>
                                                            {placedObj.objectIndex +
                                                                1}
                                                            @({placedObj.startX}
                                                            ,{placedObj.startY})
                                                        </span>
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
                                    {' '}
                                    <div
                                        className="xs:gap-px xs:min-w-[160px] mx-auto grid w-fit min-w-[144px] grid-cols-9 gap-0 sm:mx-0 sm:min-w-[240px] sm:gap-0.5 md:min-w-[300px]"
                                        onMouseLeave={() => setPreviewCells([])}
                                        onTouchEnd={() => {
                                            // Clear preview on touch end if not placing
                                            if (placementMode !== 'placing') {
                                                setPreviewCells([]);
                                            }
                                        }}
                                    >
                                        {Array.from(
                                            { length: GRID_HEIGHT },
                                            (_, y) =>
                                                Array.from(
                                                    { length: GRID_WIDTH },
                                                    (_, x) => (
                                                        <div
                                                            key={`${x}-${y}`}
                                                            onClick={() =>
                                                                handleCellClick(
                                                                    x,
                                                                    y
                                                                )
                                                            }
                                                            onMouseEnter={() =>
                                                                handleCellHover(
                                                                    x,
                                                                    y
                                                                )
                                                            }
                                                            onMouseLeave={
                                                                handleCellLeave
                                                            }
                                                            onTouchStart={() =>
                                                                handleCellTouch(
                                                                    x,
                                                                    y
                                                                )
                                                            }
                                                            className={getCellClassName(
                                                                x,
                                                                y
                                                            )}
                                                            style={{
                                                                cursor:
                                                                    placementMode ===
                                                                        'opened' &&
                                                                    isCellOccupied(
                                                                        x,
                                                                        y
                                                                    )
                                                                        ? 'not-allowed'
                                                                        : undefined,
                                                                ...getCellStyles(
                                                                    x,
                                                                    y
                                                                ),
                                                            }}
                                                        >
                                                            {renderCellContent(
                                                                x,
                                                                y
                                                            )}
                                                        </div>
                                                    )
                                                )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>{' '}
                        {/* Probability Results - moved below the game grid, title removed */}
                        <div>
                            <div className="custom-scrollbar prevent-horizontal-scroll overflow-x-auto">
                                <div className="xs:min-w-[240px] mx-auto grid w-fit min-w-[270px] grid-cols-9 gap-0.5 sm:mx-0">
                                    {Array.from(
                                        { length: GRID_HEIGHT },
                                        (_, y) =>
                                            Array.from(
                                                { length: GRID_WIDTH },
                                                (_, x) => (
                                                    <div
                                                        key={`result-${x}-${y}`}
                                                        className={getCellClassName(
                                                            x,
                                                            y,
                                                            true
                                                        )}
                                                        style={getCellStyles(
                                                            x,
                                                            y
                                                        )}
                                                    >
                                                        {renderCellContent(
                                                            x,
                                                            y,
                                                            true
                                                        )}
                                                        {renderCornerTriangle(
                                                            x,
                                                            y
                                                        )}
                                                    </div>
                                                )
                                            )
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>{' '}
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

export default Calculator;
