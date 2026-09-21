import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useProbabilityRankings } from '../hooks/inventory/useProbabilityRankings';

describe('probability rankings', () => {
    it('groups round-off ties while preserving distinct lower probabilities', () => {
        const { result } = renderHook(() =>
            useProbabilityRankings(
                [
                    [
                        0.7778500257251932,
                        0.7778500257251927,
                        0.6,
                        0.6 - 2e-16,
                        0.5,
                    ],
                ],
                [],
                []
            )
        );
        expect(result.current.highestCells.map(({ x }) => x)).toEqual([0, 1]);
        expect(result.current.secondHighestCells.map(({ x }) => x)).toEqual([
            2, 3,
        ]);
    });

    it('does not put a cell in both rank groups near the tolerance boundary', () => {
        const { result } = renderHook(() =>
            useProbabilityRankings([[0.8, 0.8 - 8e-13, 0.8 - 16e-13]], [], [])
        );
        expect(result.current.highestCells.map(({ x }) => x)).toEqual([0, 1]);
        expect(result.current.secondHighestCells.map(({ x }) => x)).toEqual([
            2,
        ]);
    });

    it.each([{ values: [] }, { values: [0, 0] }, { values: [1e-15, 2e-15] }])(
        'has no second rank for a single group $values',
        ({ values }) => {
            const { result } = renderHook(() =>
                useProbabilityRankings([values], [], [])
            );
            expect(result.current.highestCells).toHaveLength(
                values.filter((value) => value > 0).length
            );
            expect(result.current.secondHighestCells).toEqual([]);
        }
    );

    it('excludes opened and placed cells and keeps at most two second-rank cells', () => {
        const { result } = renderHook(() =>
            useProbabilityRankings(
                [[1, 0.9, 0.8, 0.7, 0.7, 0.7]],
                [{ x: 0, y: 0 }],
                [
                    {
                        id: 'fixed',
                        objectIndex: 0,
                        startX: 1,
                        startY: 0,
                        width: 1,
                        height: 1,
                        cells: [{ x: 1, y: 0 }],
                    },
                ]
            )
        );
        expect(result.current.highestCells.map(({ x }) => x)).toEqual([2]);
        expect(result.current.secondHighestCells.map(({ x }) => x)).toEqual([
            3, 4,
        ]);
    });
});
