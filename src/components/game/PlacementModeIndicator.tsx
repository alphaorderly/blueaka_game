import React from 'react';
import { Button } from '../ui/button';
import { GameObject } from '../../types/calculator';
import { RotateCcw, X } from 'lucide-react';

interface PlacementModeIndicatorProps {
    selectedObjectIndex: number;
    currentObjects: GameObject[];
    placementOrientation: 'horizontal' | 'vertical';
    onToggleOrientation: () => void;
    onCancelPlacement: () => void;
}

export const PlacementModeIndicator: React.FC<PlacementModeIndicatorProps> = ({
    selectedObjectIndex,
    currentObjects,
    placementOrientation,
    onToggleOrientation,
    onCancelPlacement,
}) => {
    if (selectedObjectIndex < 0 || !currentObjects[selectedObjectIndex]) {
        return null;
    }

    const currentObject = currentObjects[selectedObjectIndex];

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded text-xs font-semibold">
                        {selectedObjectIndex + 1}
                    </div>
                    <div>
                        <div className="text-foreground text-xs font-medium">
                            배치 모드
                        </div>
                        <div className="text-muted-foreground text-xs">
                            {placementOrientation === 'horizontal'
                                ? `${currentObject.w}×${currentObject.h}`
                                : `${currentObject.h}×${currentObject.w}`}
                        </div>
                    </div>
                </div>

                {/* Compact Orientation Preview */}
                <div className="border-primary/20 bg-primary/10 rounded border p-1">
                    {placementOrientation === 'horizontal' ? (
                        <div className="flex flex-col gap-0.5">
                            {Array.from(
                                { length: currentObject.h },
                                (_, rowIndex) => (
                                    <div
                                        key={rowIndex}
                                        className="flex gap-0.5"
                                    >
                                        {Array.from(
                                            { length: currentObject.w },
                                            (_, colIndex) => (
                                                <div
                                                    key={colIndex}
                                                    className="bg-primary h-1.5 w-1.5 rounded-sm"
                                                />
                                            )
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-0.5">
                            {Array.from(
                                { length: currentObject.w },
                                (_, rowIndex) => (
                                    <div
                                        key={rowIndex}
                                        className="flex gap-0.5"
                                    >
                                        {Array.from(
                                            { length: currentObject.h },
                                            (_, colIndex) => (
                                                <div
                                                    key={colIndex}
                                                    className="bg-primary h-1.5 w-1.5 rounded-sm"
                                                />
                                            )
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Compact Action Buttons */}
            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={onToggleOrientation}
                    className="h-8 flex-1 gap-1 text-xs"
                >
                    <RotateCcw className="h-3 w-3" />
                    회전
                </Button>
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={onCancelPlacement}
                    className="h-8 flex-1 gap-1 text-xs"
                >
                    <X className="h-3 w-3" />
                    취소
                </Button>
            </div>
        </div>
    );
};
