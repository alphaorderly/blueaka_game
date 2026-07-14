import { GRID_HEIGHT, GRID_WIDTH } from '@/consts/inventory-management/events';
import {
    InventoryObject,
    GridPosition,
    PlacedObject,
} from '@/types/inventory-management/inventory';

export const generatePreviewCells = (
    x: number,
    y: number,
    objIndex: number,
    currentObjects: InventoryObject[],
    orientation: 'horizontal' | 'vertical'
): GridPosition[] => {
    if (objIndex < 0 || objIndex >= currentObjects.length) return [];

    const obj = currentObjects[objIndex];
    const width = orientation === 'horizontal' ? obj.w : obj.h;
    const height = orientation === 'horizontal' ? obj.h : obj.w;

    if (x + width > GRID_WIDTH || y + height > GRID_HEIGHT || x < 0 || y < 0) {
        return [];
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

export const isValidPlacement = (
    cells: GridPosition[],
    placedObjects: PlacedObject[]
): boolean => {
    return cells.every((cell) => {
        if (
            cell.x >= GRID_WIDTH ||
            cell.y >= GRID_HEIGHT ||
            cell.x < 0 ||
            cell.y < 0
        )
            return false;

        const isOccupied = placedObjects.some((obj) =>
            obj.cells.some(
                (occupiedCell) =>
                    occupiedCell.x === cell.x && occupiedCell.y === cell.y
            )
        );

        return !isOccupied;
    });
};

export const isCellOpened = (
    x: number,
    y: number,
    openedCells: GridPosition[]
): boolean => {
    return openedCells.some((cell) => cell.x === x && cell.y === y);
};

export const isCellOccupied = (
    x: number,
    y: number,
    placedObjects: PlacedObject[]
): boolean => {
    return placedObjects.some((obj) =>
        obj.cells.some((cell) => cell.x === x && cell.y === y)
    );
};

export const getPlacedObjectAt = (
    x: number,
    y: number,
    placedObjects: PlacedObject[]
) => {
    return placedObjects.find((obj) =>
        obj.cells.some((cell) => cell.x === x && cell.y === y)
    );
};
