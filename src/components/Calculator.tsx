import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameObject, GridPosition, ProbabilityCell, PlacedObject, PlacementMode } from '../types/calculator';
import { GRID_WIDTH, GRID_HEIGHT } from '../consts/gameData';
import { calculateProbabilities } from '../utils/probabilityCalculator';
import { useCalculatorState } from '../hooks/useCalculatorState';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import SettingsModal from './SettingsModal';

const Calculator: React.FC = () => {
  // Use the custom hook for all persistent state
  const {    selectedCase,
    caseOptions,
    openedCells,
    placedObjects,
    autoSave,
    setSelectedCase,
    setOpenedCells,
    setPlacedObjects,
    setAutoSave,    clearGridState,
    resetToDefaults,
    exportCaseOptions,
    importCaseOptions,
    downloadFile,
    addCase,
    removeCase,
    updateCase,    addObjectToCase,
    removeObjectFromCase,
    updateObjectInCase,
    resetCaseOptions,
  } = useCalculatorState();// Local state for UI interactions (not persisted)
  const [currentObjects, setCurrentObjects] = useState<GameObject[]>([]);
  const [probabilities, setProbabilities] = useState<number[][]>([]);
  const [placementMode, setPlacementMode] = useState<PlacementMode>('opened');
  const [selectedObjectIndex, setSelectedObjectIndex] = useState<number>(-1);
  const [placementOrientation, setPlacementOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [previewCells, setPreviewCells] = useState<GridPosition[]>([]);  const [isSettingsOpen, setIsSettingsOpen] = useState(false);  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);
  
  const [objectColors, setObjectColors] = useState<{[key: string]: any}>({});

  // Generate truly random colors for placed objects
  const generateRandomColor = useCallback(() => {
    // Get existing hues to avoid duplicates
    const existingHues = Object.values(objectColors).map(color => {
      if (color && color.hue) return color.hue;
      return -1;
    }).filter(hue => hue >= 0);

    let hue: number;
    let attempts = 0;
    
    // Try to find a hue that's at least 30 degrees away from existing ones
    do {
      hue = Math.floor(Math.random() * 360);
      attempts++;
    } while (
      attempts < 50 && 
      existingHues.some(existingHue => 
        Math.abs(hue - existingHue) < 30 || Math.abs(hue - existingHue) > 330
      )
    );
    
    // Use consistent saturation and lightness for good readability
    const saturation = 65 + Math.floor(Math.random() * 25); // 65-90%
    const lightness = 75 + Math.floor(Math.random() * 15);  // 75-90%
    
    // Generate random dark mode colors
    const darkSaturation = 45 + Math.floor(Math.random() * 25); // 45-70%
    const darkLightness = 25 + Math.floor(Math.random() * 20);  // 25-45%
    
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
      className: `border border-current`
    };  }, [objectColors]);
  
  useEffect(() => {
    const caseData = caseOptions.find(option => option.value === selectedCase);
    if (caseData) {
      const objects = caseData.objects.map(obj => ({ ...obj }));
      setCurrentObjects(objects);
      setPlacementMode('opened');
      setSelectedObjectIndex(-1);
      setPreviewCells([]);
      setPlacementOrientation('horizontal');
    }
  }, [selectedCase, caseOptions]);  // Effect to regenerate colors for existing placed objects (e.g., after page refresh)
  useEffect(() => {
    const objectsNeedingColors = placedObjects.filter(obj => !objectColors[obj.id]);
    
    if (objectsNeedingColors.length > 0) {
      const newColors: {[key: string]: any} = {};
      
      objectsNeedingColors.forEach(obj => {
        const hue = Math.floor(Math.random() * 360);
        const saturation = 65 + Math.floor(Math.random() * 25);
        const lightness = 75 + Math.floor(Math.random() * 15);
        const darkSaturation = 45 + Math.floor(Math.random() * 25);
        const darkLightness = 25 + Math.floor(Math.random() * 20);
        
        newColors[obj.id] = {
          hue,
          lightBg: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
          lightText: `hsl(${hue}, 70%, 20%)`,
          darkBg: `hsl(${hue}, ${darkSaturation}%, ${darkLightness}%)`,
          darkText: `hsl(${hue}, 60%, 85%)`,
          className: `border border-current`
        };
      });
      
      setObjectColors(prev => ({ ...prev, ...newColors }));
    }

    // Clean up colors for objects that no longer exist
    const currentObjectIds = new Set(placedObjects.map(obj => obj.id));
    const obsoleteColorIds = Object.keys(objectColors).filter(id => !currentObjectIds.has(id));
    
    if (obsoleteColorIds.length > 0) {
      setObjectColors(prev => {
        const newColors = { ...prev };
        obsoleteColorIds.forEach(id => delete newColors[id]);
        return newColors;
      });
    }
  }, [placedObjects.map(obj => obj.id).join(',')]); // Depend on the joined IDs to detect when objects change


  // Calculate remaining object counts based on placed objects (memoized)
  const remainingCounts = useMemo(() => {
    return currentObjects.map((obj, index) => {
      const placedCount = placedObjects.filter(placed => placed.objectIndex === index).length;
      return Math.max(0, obj.totalCount - placedCount);
    });
  }, [currentObjects, placedObjects]);
  // Calculate probabilities whenever inputs change
  const calculateAndDisplayResult = useCallback(() => {
    if (currentObjects.length === 0) return;

    // Update objects with remaining counts
    const adjustedObjects = currentObjects.map((obj, index) => ({
      ...obj,
      count: remainingCounts[index]
    }));

    // Combine opened cells and placed object cells
    const allBlockedCells = [
      ...openedCells,
      ...placedObjects.flatMap(obj => obj.cells)
    ];

    const newProbabilities = calculateProbabilities(adjustedObjects, allBlockedCells);
    setProbabilities(newProbabilities);
  }, [currentObjects, openedCells, placedObjects, remainingCounts]);

  useEffect(() => {
    calculateAndDisplayResult();
  }, [calculateAndDisplayResult]);
  // Generate preview cells for object placement
  const generatePreviewCells = (x: number, y: number, objIndex: number, orientation: 'horizontal' | 'vertical'): GridPosition[] => {
    if (objIndex < 0 || objIndex >= currentObjects.length) return [];
    
    const obj = currentObjects[objIndex];
    const width = orientation === 'horizontal' ? obj.w : obj.h;
    const height = orientation === 'horizontal' ? obj.h : obj.w;
    
    // Check if the entire object would fit within bounds
    if (x + width > GRID_WIDTH || y + height > GRID_HEIGHT || x < 0 || y < 0) {
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
    return cells.every(cell => {
      // Check bounds
      if (cell.x >= GRID_WIDTH || cell.y >= GRID_HEIGHT || cell.x < 0 || cell.y < 0) return false;
      
      // Only check if cell is already occupied by other placed objects
      // Allow placement on opened cells (since those are found items we want to visualize)
      const isOccupied = placedObjects.some(obj => 
        obj.cells.some(occupiedCell => occupiedCell.x === cell.x && occupiedCell.y === cell.y)
      );
      
      return !isOccupied;
    });
  };  const handleCellClick = (x: number, y: number) => {
    if (placementMode === 'opened') {
      // Don't allow opening/closing cells that have placed objects on them
      if (isCellOccupied(x, y)) {
        return;
      }
      
      // Toggle opened cells
      const cellIndex = openedCells.findIndex(cell => cell.x === x && cell.y === y);
      if (cellIndex >= 0) {
        const newOpenedCells = openedCells.filter((_, index) => index !== cellIndex);
        setOpenedCells(newOpenedCells);
      } else {
        const newOpenedCells = [...openedCells, { x, y }];
        setOpenedCells(newOpenedCells);
      }
    } else if (placementMode === 'placing' && selectedObjectIndex >= 0) {
      // Place object
      const previewCells = generatePreviewCells(x, y, selectedObjectIndex, placementOrientation);
      if (isValidPlacement(previewCells) && previewCells.length > 0) {
        const obj = currentObjects[selectedObjectIndex];
        const width = placementOrientation === 'horizontal' ? obj.w : obj.h;
        const height = placementOrientation === 'horizontal' ? obj.h : obj.w;
          const newPlacedObject: PlacedObject = {
          id: `obj-${selectedObjectIndex}-${Date.now()}`,
          objectIndex: selectedObjectIndex,
          startX: x,
          startY: y,
          width,
          height,
          cells: previewCells        };
        const newPlacedObjects = [...placedObjects, newPlacedObject];
        setPlacedObjects(newPlacedObjects);
        
        // Assign a random color to this object
        setObjectColors(prev => ({
          ...prev,
          [newPlacedObject.id]: generateRandomColor()
        }));
        
        // Always return to opened mode after placing an object
        setPlacementMode('opened');
        setSelectedObjectIndex(-1);
        setPreviewCells([]);
      }
    }
  };
  const handleCellHover = (x: number, y: number) => {
    if (placementMode === 'placing' && selectedObjectIndex >= 0) {
      const cells = generatePreviewCells(x, y, selectedObjectIndex, placementOrientation);
      setPreviewCells(cells);
    }
  };

  const handleCellTouch = (x: number, y: number) => {
    // For mobile devices, show preview on touch
    if (placementMode === 'placing' && selectedObjectIndex >= 0) {
      const cells = generatePreviewCells(x, y, selectedObjectIndex, placementOrientation);
      setPreviewCells(cells);
    }
  };const handleCellLeave = () => {
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
    const newPlacedObjects = placedObjects.filter(obj => obj.id !== objectId);
    setPlacedObjects(newPlacedObjects);
    setPreviewCells([]);
    
    // Remove the color for this object
    setObjectColors(prev => {
      const newColors = { ...prev };
      delete newColors[objectId];
      return newColors;
    });
  };const toggleOrientation = () => {
    setPlacementOrientation(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
  };
  const handleClearState = () => {
    clearGridState();
    setPlacementMode('opened');
    setSelectedObjectIndex(-1);
    setPreviewCells([]);
    setObjectColors({});
  };

  const handleResetToDefaults = () => {
    resetToDefaults();
    setPlacementMode('opened');
    setSelectedObjectIndex(-1);
    setPreviewCells([]);
    setObjectColors({});
  };

  const isCellOpened = (x: number, y: number) => {
    return openedCells.some(cell => cell.x === x && cell.y === y);
  };

  const isCellOccupied = (x: number, y: number) => {
    return placedObjects.some(obj => 
      obj.cells.some(cell => cell.x === x && cell.y === y)
    );
  };

  const isCellPreview = (x: number, y: number) => {
    return previewCells.some(cell => cell.x === x && cell.y === y);
  };

  const getPlacedObjectAt = (x: number, y: number) => {
    return placedObjects.find(obj => 
      obj.cells.some(cell => cell.x === x && cell.y === y)
    );
  };

  // Get probability rankings
  const getProbabilityRankings = () => {
    const probabilityList: ProbabilityCell[] = [];
    
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (!isCellOpened(x, y) && !isCellOccupied(x, y) && probabilities[y] && probabilities[y][x] > 0) {
          probabilityList.push({ x, y, prob: probabilities[y][x] });
        }
      }
    }

    probabilityList.sort((a, b) => b.prob - a.prob);

    const highest = probabilityList.length > 0 ? probabilityList[0].prob : 0;
    const highestCells = probabilityList.filter(cell => cell.prob === highest);
    
    const secondHighest = probabilityList.find(cell => cell.prob < highest)?.prob || 0;
    const secondHighestCells = probabilityList.filter(cell => cell.prob === secondHighest).slice(0, 2);

    return { highestCells, secondHighestCells };  };
  const { highestCells, secondHighestCells } = getProbabilityRankings();

  // Helper function to get cell styles for placed objects
  const getCellStyles = (x: number, y: number) => {
    if (isCellOccupied(x, y)) {
      const placedObj = getPlacedObjectAt(x, y);
      if (placedObj && objectColors[placedObj.id]) {
        const colorData = objectColors[placedObj.id];
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
    const cellSizeClass = isResult ? 'grid-cell-result' : 'grid-cell-mobile';
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
      const previewClass = isValid ? 'bg-blue-300 text-blue-900' : 'bg-red-300 text-red-900';
      return `${baseClass} ${previewClass}`;
    }
    
    // Opened cells (lower priority, only if no object placed)
    if (isCellOpened(x, y)) {
      return `${baseClass} ${isResult ? 'bg-muted' : 'bg-muted-foreground'} text-muted-foreground`;
    }
    
    // Result highlighting for probability display
    if (isResult) {
      if (highestCells.some(cell => cell.x === x && cell.y === y)) {
        return `${baseClass} bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100`;
      }
      if (secondHighestCells.some(cell => cell.x === x && cell.y === y)) {
        return `${baseClass} bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100`;
      }
    }
    
    return `${baseClass} bg-card text-card-foreground`;
  };
  const renderCornerTriangle = (x: number, y: number) => {
    if (highestCells.some(cell => cell.x === x && cell.y === y)) {
      return <div className="absolute top-0 right-0 w-0 h-0 border-t-[8px] sm:border-t-[10px] border-t-blue-600 border-l-[8px] sm:border-l-[10px] border-l-transparent" />;
    }
    if (secondHighestCells.some(cell => cell.x === x && cell.y === y)) {
      return <div className="absolute top-0 right-0 w-0 h-0 border-t-[8px] sm:border-t-[10px] border-t-red-600 border-l-[8px] sm:border-l-[10px] border-l-transparent" />;
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
    
    if (isResult && probabilities[y] && !isCellOpened(x, y) && !isCellOccupied(x, y)) {
      return `${(probabilities[y][x] * 100).toFixed(1)}%`;
    }
    
    return '';
  };  return (
    <div className="max-w-6xl mx-auto px-1 py-1 xs:p-2 sm:p-4 lg:p-6 bg-background min-h-screen prevent-horizontal-scroll dark-mobile-optimized">
      <Card className="mb-4 sm:mb-6">        <CardHeader className="pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <CardTitle className="text-xl sm:text-2xl text-center sm:text-left">
              계산기
            </CardTitle>            <div className="flex flex-wrap gap-2 justify-center sm:justify-end">              <Button variant="outline" onClick={() => setIsSettingsOpen(true)} size="sm" className="text-xs sm:text-sm">
                ⚙️ <span>설정</span>
              </Button>
              <Button variant="outline" onClick={handleClearState} size="sm" className="text-xs sm:text-sm">
                🗑️ <span>상태 초기화</span>
              </Button>
              <Button 
                variant={autoSave ? "default" : "outline"} 
                onClick={() => setAutoSave(!autoSave)}
                size="sm"
                className="text-xs sm:text-sm"
              >
                💾 <span>자동저장 {autoSave ? 'ON' : 'OFF'}</span>
              </Button>
              <Button variant="destructive" onClick={handleResetToDefaults} size="sm" className="text-xs sm:text-sm">
                🔄 <span>완전 초기화</span>
              </Button>
            </div>
          </div>
        </CardHeader>        <CardContent className="px-1 py-2 xs:p-3 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <Label htmlFor="case-select" className="text-base sm:text-lg font-semibold mb-2 block">
              회차 선택
            </Label>
            <Select value={selectedCase} onValueChange={setSelectedCase}>
              <SelectTrigger className="w-full sm:w-[250px] mb-4">
                <SelectValue placeholder="회차를 선택하세요" />
              </SelectTrigger>              <SelectContent>
                {caseOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="mb-4 text-xs sm:text-sm text-muted-foreground">
              물건 목록: {currentObjects.map((obj, index) => 
                `물건 ${index + 1}: ${obj.w}x${obj.h} ${obj.totalCount}개`
              ).join(', ')}
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            {/* Main content - object placement and game grid */}
            <div className="space-y-6">
              <div className="mb-4 sm:mb-6">
                <Label className="text-base sm:text-lg font-semibold mb-2 block">
                  찾은 물건 배치
                </Label>
                <div className="space-y-2 mb-4">
                  {currentObjects.map((obj, index) => {
                    const remaining = remainingCounts[index];
                    const placed = obj.totalCount - remaining;
                    return (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 border rounded max-w-100">
                        <span className="text-xs sm:text-sm flex-1">
                          물건 {index + 1} ({obj.w}x{obj.h}): {placed}/{obj.totalCount}개 배치됨
                        </span>
                        {remaining > 0 && (
                          <Button
                            size="sm"
                            onClick={() => startPlacing(index)}
                            disabled={placementMode === 'placing' && selectedObjectIndex === index}
                            className="w-full sm:w-auto text-xs"
                          >
                            {placementMode === 'placing' && selectedObjectIndex === index ? '배치 중...' : '배치'}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {placementMode === 'placing' && selectedObjectIndex >= 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
                    <p className="text-xs sm:text-sm mb-2">
                      물건 {selectedObjectIndex + 1} 배치 중... 
                      ({placementOrientation === 'horizontal' ? 
                        `${currentObjects[selectedObjectIndex].w}x${currentObjects[selectedObjectIndex].h}` : 
                        `${currentObjects[selectedObjectIndex].h}x${currentObjects[selectedObjectIndex].w}`})
                    </p>                    {/* Visual orientation indicator for mobile */}
                    <div className="mb-3 flex items-start gap-2">
                      <span className="text-xs text-muted-foreground">배치 방향:</span>
                      <div className="flex items-start gap-2">
                        <div className="flex">
                          {placementOrientation === 'horizontal' ? (
                            // Show horizontal layout: w columns, h rows
                            <div className="flex flex-col gap-px">
                              {Array.from({ length: currentObjects[selectedObjectIndex].h }, (_, rowIndex) => (
                                <div key={rowIndex} className="flex gap-px">
                                  {Array.from({ length: currentObjects[selectedObjectIndex].w }, (_, colIndex) => (
                                    <div key={colIndex} className="w-2.5 h-2.5 bg-blue-300 border border-blue-500"></div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          ) : (
                            // Show vertical layout: h columns, w rows  
                            <div className="flex flex-col gap-px">
                              {Array.from({ length: currentObjects[selectedObjectIndex].w }, (_, rowIndex) => (
                                <div key={rowIndex} className="flex gap-px">
                                  {Array.from({ length: currentObjects[selectedObjectIndex].h }, (_, colIndex) => (
                                    <div key={colIndex} className="w-2.5 h-2.5 bg-blue-300 border border-blue-500"></div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-xs">
                          ({placementOrientation === 'horizontal' ? '가로' : '세로'} - {placementOrientation === 'horizontal' ? `${currentObjects[selectedObjectIndex].w}×${currentObjects[selectedObjectIndex].h}` : `${currentObjects[selectedObjectIndex].h}×${currentObjects[selectedObjectIndex].w}`})
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button size="sm" variant="outline" onClick={toggleOrientation} className="text-xs">
                        회전 ({placementOrientation === 'horizontal' ? '세로로' : '가로로'})
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelPlacement} className="text-xs">
                        취소
                      </Button>
                    </div>
                  </div>
                )}

                {placedObjects.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm font-semibold mb-2 block">배치된 물건 ({placedObjects.length}개)</Label>
                    <div className="flex flex-wrap gap-1">                      {placedObjects.map((placedObj) => {
                        const colorData = objectColors[placedObj.id];
                        const isHovered = hoveredObjectId === placedObj.id;
                        
                        const listItemStyle = colorData ? {
                          backgroundColor: colorData.lightBg,
                          color: colorData.lightText,
                          '--dark-bg': colorData.darkBg,
                          '--dark-text': colorData.darkText,
                        } as React.CSSProperties : {};

                        return (
                          <div 
                            key={placedObj.id} 
                            className={`flex items-center gap-1 text-xs px-2 py-1 border rounded-md cursor-pointer transition-colors ${
                              colorData ? 'dark:[background-color:var(--dark-bg)] dark:[color:var(--dark-text)]' : 'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                            } ${
                              isHovered ? 'ring-2 ring-blue-500' : 'hover:opacity-80'
                            }`}
                            style={listItemStyle}
                            onMouseEnter={() => setHoveredObjectId(placedObj.id)}
                            onMouseLeave={() => setHoveredObjectId(null)}
                            onClick={() => removeObject(placedObj.id)}
                          >
                            <span>
                              {placedObj.objectIndex + 1}@({placedObj.startX},{placedObj.startY})
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
                <div className="overflow-x-auto custom-scrollbar prevent-horizontal-scroll">                  <div 
                    className="grid grid-cols-9 gap-0 xs:gap-px sm:gap-0.5 w-fit min-w-[144px] xs:min-w-[160px] sm:min-w-[240px] md:min-w-[300px] mx-auto sm:mx-0"
                    onMouseLeave={() => setPreviewCells([])}
                    onTouchEnd={() => {
                      // Clear preview on touch end if not placing
                      if (placementMode !== 'placing') {
                        setPreviewCells([]);
                      }
                    }}
                  >
                    {Array.from({ length: GRID_HEIGHT }, (_, y) =>
                      Array.from({ length: GRID_WIDTH }, (_, x) => (                        <div
                            key={`${x}-${y}`}
                          onClick={() => handleCellClick(x, y)}
                          onMouseEnter={() => handleCellHover(x, y)}
                          onMouseLeave={handleCellLeave}
                          onTouchStart={() => handleCellTouch(x, y)}
                          className={getCellClassName(x, y)}
                          style={{ 
                            cursor: (placementMode === 'opened' && isCellOccupied(x, y)) ? 'not-allowed' : undefined,
                            ...getCellStyles(x, y)
                          }}
                        >
                          {renderCellContent(x, y)}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            {/* Probability Results */}
            <div className="space-y-6 lg:sticky lg:top-24">
              <div className="overflow-x-auto custom-scrollbar prevent-horizontal-scroll">
                <div className="grid grid-cols-9 gap-0.5 w-fit min-w-[270px] xs:min-w-[240px] mx-auto">
                  {Array.from({ length: GRID_HEIGHT }, (_, y) =>
                    Array.from({ length: GRID_WIDTH }, (_, x) => (
                      <div
                        key={`result-${x}-${y}`}
                        className={getCellClassName(x, y, true)}
                        style={getCellStyles(x, y)}
                      >
                        {renderCellContent(x, y, true)}
                        {renderCornerTriangle(x, y)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        caseOptions={caseOptions}        exportCaseOptions={exportCaseOptions}
        importCaseOptions={importCaseOptions}
        downloadFile={downloadFile}
        addCase={addCase}
        removeCase={removeCase}
        updateCase={updateCase}        addObjectToCase={addObjectToCase}
        removeObjectFromCase={removeObjectFromCase}
        updateObjectInCase={updateObjectInCase}
        resetCaseOptions={resetCaseOptions}
      />
    </div>
  );
};

export default Calculator;
