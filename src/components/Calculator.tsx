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
  const [previewCells, setPreviewCells] = useState<GridPosition[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);
  
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
  }, [selectedCase, caseOptions]);


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
  };  const handleCellLeave = () => {
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
  };  const toggleOrientation = () => {
    setPlacementOrientation(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
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

    return { highestCells, secondHighestCells };
  };
  const { highestCells, secondHighestCells } = getProbabilityRankings();  const getCellClassName = (x: number, y: number, isResult = false) => {
    const baseClass = `w-10 h-10 border border-border text-xs flex items-center justify-center relative ${isResult ? 'cursor-default' : 'cursor-pointer hover:bg-accent hover:text-accent-foreground'}`;
    
    // Check if cell has a placed object first (highest priority)
    if (isCellOccupied(x, y)) {
      const placedObj = getPlacedObjectAt(x, y);
      const isHovered = placedObj && hoveredObjectId === placedObj.id;
      const baseColorClass = placedObj ? `bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100` : '';
      const hoverColorClass = isHovered ? `bg-green-300 text-green-900 dark:bg-green-700 dark:text-green-100 ring-2 ring-green-500` : '';
      return `${baseClass} ${baseColorClass} ${hoverColorClass}`;
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
      return <div className="absolute top-0 right-0 w-0 h-0 border-t-[10px] border-t-blue-600 border-l-[10px] border-l-transparent" />;
    }
    if (secondHighestCells.some(cell => cell.x === x && cell.y === y)) {
      return <div className="absolute top-0 right-0 w-0 h-0 border-t-[10px] border-t-red-600 border-l-[10px] border-l-transparent" />;
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
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-background min-h-screen">
      <Card className="mb-6">        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">
              계산기
            </CardTitle>            <div className="flex gap-2">              <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
                ⚙️ 설정
              </Button>
              <Button variant="outline" onClick={handleClearState}>
                🗑️ 상태 초기화
              </Button>
              <Button 
                variant={autoSave ? "default" : "outline"} 
                onClick={() => setAutoSave(!autoSave)}
              >
                💾 자동저장 {autoSave ? 'ON' : 'OFF'}
              </Button>
              <Button variant="destructive" onClick={handleResetToDefaults}>
                🔄 완전 초기화
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label htmlFor="case-select" className="text-lg font-semibold mb-2 block">
              회차 선택
            </Label>
            <Select value={selectedCase} onValueChange={setSelectedCase}>
              <SelectTrigger className="w-[250px] mb-4">
                <SelectValue placeholder="회차를 선택하세요" />
              </SelectTrigger>              <SelectContent>
                {caseOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="mb-4 text-sm text-muted-foreground">
              물건 목록: {currentObjects.map((obj, index) => 
                `물건 ${index + 1}: ${obj.w}x${obj.h} ${obj.totalCount}개`
              ).join(', ')}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>

              <div className="mb-6">
                <Label className="text-lg font-semibold mb-2 block">
                  찾은 물건 배치
                </Label>
                <div className="space-y-2 mb-4">
                  {currentObjects.map((obj, index) => {
                    const remaining = remainingCounts[index];
                    const placed = obj.totalCount - remaining;
                    return (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <span className="text-sm flex-1">
                          물건 {index + 1} ({obj.w}x{obj.h}): {placed}/{obj.totalCount}개 배치됨
                        </span>
                        {remaining > 0 && (
                          <Button
                            size="sm"
                            onClick={() => startPlacing(index)}
                            disabled={placementMode === 'placing' && selectedObjectIndex === index}
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
                    <p className="text-sm mb-2">
                      물건 {selectedObjectIndex + 1} 배치 중... 
                      ({placementOrientation === 'horizontal' ? 
                        `${currentObjects[selectedObjectIndex].w}x${currentObjects[selectedObjectIndex].h}` : 
                        `${currentObjects[selectedObjectIndex].h}x${currentObjects[selectedObjectIndex].w}`})
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={toggleOrientation}>
                        회전 ({placementOrientation === 'horizontal' ? '세로로' : '가로로'})
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelPlacement}>
                        취소
                      </Button>
                    </div>
                  </div>
                )}                {placedObjects.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm font-semibold mb-2 block">배치된 물건 ({placedObjects.length}개)</Label>
                    <div className="flex flex-wrap gap-1">
                      {placedObjects.map((placedObj) => (
                        <div 
                          key={placedObj.id} 
                          className={`flex items-center gap-1 text-xs px-2 py-1 border rounded-md cursor-pointer transition-colors ${
                            hoveredObjectId === placedObj.id 
                              ? 'bg-green-200 dark:bg-green-800 ring-2 ring-green-500' 
                              : 'bg-green-100 dark:bg-green-900 hover:bg-green-150 dark:hover:bg-green-850'
                          }`}
                          onMouseEnter={() => setHoveredObjectId(placedObj.id)}
                          onMouseLeave={() => setHoveredObjectId(null)}
                        >
                          <span className="text-green-800 dark:text-green-200">
                            {placedObj.objectIndex + 1}@({placedObj.startX},{placedObj.startY})
                          </span>
                          <button
                            onClick={() => removeObject(placedObj.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 ml-1"
                            title="제거"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mb-6">
                <div 
                  className="grid grid-cols-9 gap-0.5 w-fit"
                  onMouseLeave={() => setPreviewCells([])}
                >
                  {Array.from({ length: GRID_HEIGHT }, (_, y) =>
                    Array.from({ length: GRID_WIDTH }, (_, x) => (
                      <div
                          key={`${x}-${y}`}
                        onClick={() => handleCellClick(x, y)}
                        onMouseEnter={() => handleCellHover(x, y)}
                        onMouseLeave={handleCellLeave}
                        className={getCellClassName(x, y)}
                        style={{ 
                          cursor: (placementMode === 'opened' && isCellOccupied(x, y)) ? 'not-allowed' : undefined 
                        }}
                      >
                        {renderCellContent(x, y)}
                      </div>
                    ))
                  )}
                </div>
              </div>

                <div>
                  <div className="grid grid-cols-9 gap-0.5 w-fit">
                    {Array.from({ length: GRID_HEIGHT }, (_, y) =>
                      Array.from({ length: GRID_WIDTH }, (_, x) => (
                        <div
                          key={`result-${x}-${y}`}
                          className={getCellClassName(x, y, true)}
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
