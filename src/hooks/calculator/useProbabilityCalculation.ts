import { useState, useEffect, useCallback, useMemo } from 'react';
import { GameObject, GridPosition } from '../../types/calculator';
import { calculateProbabilities } from '../../utils/probabilityCalculator';

interface UseProbabilityCalculationProps {
    objects: GameObject[];
    blockedCells: GridPosition[];
    enabled?: boolean;
}

interface UseProbabilityCalculationResult {
    probabilities: number[][];
    isCalculating: boolean;
    error: string | null;
    lastCalculationTime: number | null;
}

export function useProbabilityCalculation({
    objects,
    blockedCells,
    enabled = true,
}: UseProbabilityCalculationProps): UseProbabilityCalculationResult {
    const [probabilities, setProbabilities] = useState<number[][]>([]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastCalculationTime, setLastCalculationTime] = useState<
        number | null
    >(null);

    // Create a stable key for memoization based on inputs
    const inputKey = useMemo(() => {
        const objectsKey = objects
            .map((obj) => `${obj.w}x${obj.h}:${obj.count}`)
            .join(',');
        const blockedKey = blockedCells
            .map((cell) => `${cell.x},${cell.y}`)
            .sort()
            .join('|');
        return `${objectsKey}#${blockedKey}`;
    }, [objects, blockedCells]);

    const calculateAsync = useCallback(async () => {
        if (!enabled || objects.length === 0) {
            setProbabilities([]);
            setIsCalculating(false);
            setError(null);
            setLastCalculationTime(null);
            return;
        }

        setIsCalculating(true);
        setError(null);
        const startTime = performance.now();

        try {
            // Use requestIdleCallback or setTimeout to yield control
            await new Promise((resolve) => {
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(resolve);
                } else {
                    setTimeout(resolve, 0);
                }
            });

            const result = calculateProbabilities(objects, blockedCells);

            const endTime = performance.now();
            const calculationTime = endTime - startTime;

            setProbabilities(result);
            setLastCalculationTime(calculationTime);
            setError(null);
        } catch (err) {
            console.error('Probability calculation failed:', err);
            setError(err instanceof Error ? err.message : 'Calculation failed');
            setProbabilities([]);
            setLastCalculationTime(null);
        } finally {
            setIsCalculating(false);
        }
    }, [objects, blockedCells, enabled]);

    // Trigger calculation when inputs change
    useEffect(() => {
        calculateAsync();
    }, [inputKey, calculateAsync]);

    return {
        probabilities,
        isCalculating,
        error,
        lastCalculationTime,
    };
}
