import { useState, useEffect, useCallback } from 'react';
import { GameObject } from '../../types/calculator';
import {
    ObjectTypeColor,
    generateColorForObjectType,
} from '../../utils/calculator/colorUtils';

export const useObjectTypeColors = (currentObjects: GameObject[]) => {
    const [objectTypeColors, setObjectTypeColors] = useState<{
        [objectIndex: number]: ObjectTypeColor;
    }>({});

    // Effect to ensure colors exist for all current object types
    useEffect(() => {
        const objectTypesNeedingColors = currentObjects
            .map((_, index) => index)
            .filter((objectIndex) => !objectTypeColors[objectIndex]);

        if (objectTypesNeedingColors.length > 0) {
            const newColors: {
                [objectIndex: number]: ObjectTypeColor;
            } = {};

            objectTypesNeedingColors.forEach((objectIndex) => {
                // 오브젝트 인덱스를 전달하여 고정된 색상 사용
                newColors[objectIndex] = generateColorForObjectType(
                    objectTypeColors,
                    objectIndex
                );
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
    }, [currentObjects, objectTypeColors]);

    const resetColors = useCallback(() => {
        setObjectTypeColors({});
    }, []);

    return {
        objectTypeColors,
        resetColors,
    };
};
