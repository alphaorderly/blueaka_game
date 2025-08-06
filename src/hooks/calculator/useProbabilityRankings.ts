import { useMemo } from 'react';
import {
    ProbabilityCell,
    GridPosition,
    PlacedObject,
} from '../../types/calculator';
import { GRID_WIDTH, GRID_HEIGHT } from '../../consts/gameData';
import { isCellOpened, isCellOccupied } from '../../utils/calculator/gridUtils';

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
            (cell) => cell.prob === highest
        );

        const secondHighest =
            probabilityList.find((cell) => cell.prob < highest)?.prob || 0;
        const secondHighestCells = probabilityList
            .filter((cell) => cell.prob === secondHighest)
            .slice(0, 2);

        return { highestCells, secondHighestCells };
    }, [probabilities, openedCells, placedObjects]);
};
