import { useMemo } from 'react';
import {
    ProbabilityCell,
    GridPosition,
    PlacedObject,
} from '@/types/inventory-management/inventory';
import { isCellOpened, isCellOccupied } from '@/utils/inventory/gridUtils';
import { GRID_HEIGHT, GRID_WIDTH } from '@/consts/inventory-management/events';

// Exact counts still accumulate floating-point round-off in their marginals.
const TIE_TOLERANCE = 1e-12;

export const useProbabilityRankings = (
    probabilities: number[][],
    openedCells: GridPosition[],
    placedObjects: PlacedObject[]
) => {
    return useMemo(() => {
        const probabilityList: ProbabilityCell[] = [];

        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (
                    !isCellOpened(x, y, openedCells) &&
                    !isCellOccupied(x, y, placedObjects) &&
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
            (cell) => highest - cell.prob <= TIE_TOLERANCE
        );

        const lowerCells = probabilityList.slice(highestCells.length);
        const secondHighest = lowerCells[0]?.prob || 0;
        const secondHighestCells = lowerCells
            .filter((cell) => secondHighest - cell.prob <= TIE_TOLERANCE)
            .slice(0, 2);

        return { highestCells, secondHighestCells };
    }, [probabilities, openedCells, placedObjects]);
};
