import React, { useState, useEffect, useCallback } from 'react';
import { EventData, GridPosition } from '../../types/calculator';
import { GRID_WIDTH, GRID_HEIGHT } from '../../consts/gameData';
import {
    generateColorForObjectType,
    ObjectTypeColor,
} from '../../utils/calculator/colorUtils';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { RefreshCw, Eye, EyeOff } from 'lucide-react';

interface GameSimulationProps {
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
}

interface GameState {
    hiddenObjects: HiddenObject[];
    revealedCells: GridPosition[];
    moves: number;
    isComplete: boolean;
    showSolution: boolean;
}

export const GameSimulation: React.FC<GameSimulationProps> = ({
    selectedEvent,
    selectedCase,
}) => {
    const [gameState, setGameState] = useState<GameState>({
        hiddenObjects: [],
        revealedCells: [],
        moves: 0,
        isComplete: false,
        showSolution: false,
    });

    // 오브젝트 타입별 색상 매핑
    const [objectTypeColors, setObjectTypeColors] = useState<{
        [objectIndex: number]: ObjectTypeColor;
    }>({});

    const currentCaseOption = selectedEvent.caseOptions.find(
        (option) => option.value === selectedCase
    );

    // 게임 초기화
    const initializeGame = useCallback(() => {
        if (!currentCaseOption) return;

        const hiddenObjects: HiddenObject[] = [];
        const newObjectTypeColors: { [objectIndex: number]: ObjectTypeColor } =
            {};
        let objectId = 0;

        // 각 오브젝트 타입별로 색상 생성
        currentCaseOption.objects.forEach((_, objectIndex) => {
            newObjectTypeColors[objectIndex] = generateColorForObjectType(
                {},
                objectIndex
            );
        });

        // 각 오브젝트 타입별로 랜덤하게 배치
        currentCaseOption.objects.forEach((obj, objectIndex) => {
            for (let i = 0; i < obj.count; i++) {
                let placed = false;
                let attempts = 0;
                const maxAttempts = 100;

                while (!placed && attempts < maxAttempts) {
                    const startX = Math.floor(
                        Math.random() * (GRID_WIDTH - obj.w + 1)
                    );
                    const startY = Math.floor(
                        Math.random() * (GRID_HEIGHT - obj.h + 1)
                    );

                    // 겹치는지 확인
                    const newCells: GridPosition[] = [];
                    for (let dx = 0; dx < obj.w; dx++) {
                        for (let dy = 0; dy < obj.h; dy++) {
                            newCells.push({ x: startX + dx, y: startY + dy });
                        }
                    }

                    const hasOverlap = hiddenObjects.some((existingObj) =>
                        existingObj.cells.some((cell) =>
                            newCells.some(
                                (newCell) =>
                                    newCell.x === cell.x && newCell.y === cell.y
                            )
                        )
                    );

                    if (!hasOverlap) {
                        hiddenObjects.push({
                            id: `obj-${objectId++}`,
                            objectIndex,
                            startX,
                            startY,
                            width: obj.w,
                            height: obj.h,
                            cells: newCells,
                            found: false,
                        });
                        placed = true;
                    }
                    attempts++;
                }
            }
        });

        setObjectTypeColors(newObjectTypeColors);
        setGameState({
            hiddenObjects,
            revealedCells: [],
            moves: 0,
            isComplete: false,
            showSolution: false,
        });
    }, [currentCaseOption]);

    // 이벤트나 케이스가 변경될 때 게임 초기화
    useEffect(() => {
        initializeGame();
    }, [initializeGame]);

    // 셀 클릭 처리
    const handleCellClick = (x: number, y: number) => {
        if (gameState.isComplete) return;

        // 이미 공개된 셀인지 확인
        const isAlreadyRevealed = gameState.revealedCells.some(
            (cell) => cell.x === x && cell.y === y
        );
        if (isAlreadyRevealed) return;

        const newRevealedCells = [...gameState.revealedCells, { x, y }];
        let newHiddenObjects = [...gameState.hiddenObjects];

        // 숨겨진 오브젝트를 찾았는지 확인
        const foundObject = gameState.hiddenObjects.find(
            (obj) =>
                !obj.found &&
                obj.cells.some((cell) => cell.x === x && cell.y === y)
        );

        if (foundObject) {
            // 오브젝트를 찾았을 때
            newHiddenObjects = newHiddenObjects.map((obj) =>
                obj.id === foundObject.id ? { ...obj, found: true } : obj
            );

            // 해당 오브젝트의 모든 셀을 공개
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

        // 게임 완료 확인
        const isComplete = newHiddenObjects.every((obj) => obj.found);

        setGameState({
            ...gameState,
            hiddenObjects: newHiddenObjects,
            revealedCells: newRevealedCells,
            moves: gameState.moves + 1,
            isComplete,
        });
    };

    // 셀의 상태 확인
    const getCellState = (x: number, y: number) => {
        const isRevealed = gameState.revealedCells.some(
            (cell) => cell.x === x && cell.y === y
        );
        const hiddenObject = gameState.hiddenObjects.find((obj) =>
            obj.cells.some((cell) => cell.x === x && cell.y === y)
        );

        return {
            isRevealed,
            hiddenObject,
            isObjectStart:
                hiddenObject?.startX === x && hiddenObject?.startY === y,
        };
    };

    // 셀의 스타일 결정 (inline 스타일)
    const getCellStyles = (x: number, y: number) => {
        const { isRevealed, hiddenObject } = getCellState(x, y);

        if (isRevealed && hiddenObject) {
            const colorData = objectTypeColors[hiddenObject.objectIndex];
            if (colorData) {
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

    // 셀의 클래스명 결정
    const getCellClassName = (x: number, y: number) => {
        const { isRevealed, hiddenObject } = getCellState(x, y);
        const baseClass =
            'border border-border flex items-center justify-center relative cursor-pointer transition-all duration-200 rounded-md min-h-[32px] min-w-[32px] text-xs font-semibold';

        if (gameState.showSolution && hiddenObject && !hiddenObject.found) {
            // 솔루션 표시 모드에서 찾지 못한 오브젝트 - 빨간색으로 표시
            return `${baseClass} bg-red-300 text-red-900 ring-2 ring-red-400`;
        }

        if (isRevealed) {
            if (hiddenObject) {
                // 찾은 오브젝트 - colorUtils의 색상 사용 (inline 스타일로 적용)
                const borderStyle =
                    hiddenObject.objectIndex === 0
                        ? 'border-2 border-solid'
                        : hiddenObject.objectIndex === 1
                          ? 'border-2 border-dashed'
                          : hiddenObject.objectIndex === 2
                            ? 'border-2 border-dotted'
                            : 'border-2 border-double';
                return `${baseClass} ${borderStyle} dark:[background-color:var(--dark-bg)] dark:[color:var(--dark-text)]`;
            } else {
                // 빈 셀
                return `${baseClass} bg-gray-300 text-gray-700`;
            }
        }

        // 공개되지 않은 셀
        return `${baseClass} bg-card text-card-foreground hover:bg-accent hover:scale-105`;
    };

    // 셀 내용 렌더링
    const renderCellContent = (x: number, y: number) => {
        const { isRevealed, hiddenObject, isObjectStart } = getCellState(x, y);

        if (
            gameState.showSolution &&
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
        setGameState({
            ...gameState,
            showSolution: !gameState.showSolution,
        });
    };

    if (!currentCaseOption) {
        return <div>선택된 케이스를 찾을 수 없습니다.</div>;
    }

    return (
        <div className="space-y-6">
            {/* 게임 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-foreground text-xl font-bold">
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
                        {gameState.showSolution ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                        {gameState.showSolution ? '숨기기' : '정답 보기'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={initializeGame}
                        className="gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />새 게임
                    </Button>
                </div>
            </div>

            {/* 게임 완료 메시지 */}
            {gameState.isComplete && (
                <Card className="border-green-200 bg-green-50 p-4">
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-green-800">
                            🎉 완료!
                        </h3>
                        <p className="text-sm text-green-700">
                            {gameState.moves}번 클릭으로 모든 오브젝트를
                            찾았습니다
                        </p>
                    </div>
                </Card>
            )}

            {/* 오브젝트 정보 */}
            <Card className="p-4">
                <h3 className="mb-3 text-sm font-medium">찾아야 할 오브젝트</h3>
                <div className="grid gap-2 sm:grid-cols-3">
                    {currentCaseOption.objects.map((obj, index) => (
                        <div
                            key={index}
                            className="bg-muted/50 flex items-center gap-2 rounded-lg p-2"
                        >
                            <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded text-xs font-bold">
                                {index + 1}
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-medium">
                                    {obj.w}×{obj.h} 크기
                                </p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                {
                                    gameState.hiddenObjects.filter(
                                        (hiddenObj) =>
                                            hiddenObj.objectIndex === index &&
                                            hiddenObj.found
                                    ).length
                                }
                                /{obj.count}
                            </Badge>
                        </div>
                    ))}
                </div>
            </Card>

            {/* 게임 그리드 */}
            <div className="overflow-x-auto">
                <div
                    className="mx-auto grid w-fit gap-1 p-1"
                    style={{
                        gridTemplateColumns: 'repeat(9, minmax(32px, 48px))',
                        gridTemplateRows: 'repeat(5, minmax(32px, 48px))',
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
        </div>
    );
};
