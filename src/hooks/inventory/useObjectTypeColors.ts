import { useState, useEffect, useCallback } from 'react';
import { InventoryObject } from '@/types/inventory-management/inventory';
import {
    ObjectTypeColor,
    generateColorForObjectType,
} from '@/utils/inventory/colorUtils';

export const useObjectTypeColors = (currentObjects: InventoryObject[]) => {
    const [objectTypeColors, setObjectTypeColors] = useState<{
        [objectIndex: number]: ObjectTypeColor;
    }>({});

    useEffect(() => {
        const objectTypesNeedingColors = currentObjects
            .map((_, index) => index)
            .filter((objectIndex) => !objectTypeColors[objectIndex]);

        if (objectTypesNeedingColors.length > 0) {
            const newColors: {
                [objectIndex: number]: ObjectTypeColor;
            } = {};

            objectTypesNeedingColors.forEach((objectIndex) => {
                newColors[objectIndex] = generateColorForObjectType(
                    objectTypeColors,
                    objectIndex
                );
            });

            setObjectTypeColors((prev) => ({ ...prev, ...newColors }));
        }

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
