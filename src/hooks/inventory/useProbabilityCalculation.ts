import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    InventoryObject,
    GridPosition,
} from '@/types/inventory-management/inventory';

interface UseProbabilityCalculationProps {
    objects: InventoryObject[];
    blockedCells: GridPosition[];
    enabled?: boolean;
}

interface UseProbabilityCalculationResult {
    probabilities: number[][];
    isCalculating: boolean;
    error: string | null;
    lastCalculationTime: number | null;
}

interface WorkerMessage {
    id: string;
    objects: InventoryObject[];
    blockedCells: GridPosition[];
}

interface WorkerResponse {
    id: string;
    probabilities: number[][];
    error?: string;
    calculationTime: number;
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

    const workerRef = useRef<Worker | null>(null);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
    const currentRequestId = useRef<string | null>(null);

    const resultCache = useRef<
        Map<
            string,
            {
                probabilities: number[][];
                calculationTime: number;
            }
        >
    >(new Map());

    const inputKey = useMemo(() => {
        const objectsKey = [...objects]
            .sort((a, b) => {
                if (a.w !== b.w) return a.w - b.w;
                if (a.h !== b.h) return a.h - b.h;
                return a.count - b.count;
            })
            .map((obj) => `${obj.w}x${obj.h}:${obj.count}`)
            .join(',');
        const blockedKey = [...blockedCells]
            .map((cell) => `${cell.x},${cell.y}`)
            .sort()
            .join('|');
        return `${objectsKey}#${blockedKey}`;
    }, [objects, blockedCells]);

    useEffect(() => {
        workerRef.current = new Worker('/probabilityWorker.js');

        workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
            const {
                id,
                probabilities: workerProbabilities,
                error,
                calculationTime,
            } = e.data;

            if (id === currentRequestId.current) {
                setIsCalculating(false);

                if (error) {
                    setError(error);
                    setProbabilities([]);
                    setLastCalculationTime(null);
                } else {
                    resultCache.current.set(inputKey, {
                        probabilities: workerProbabilities,
                        calculationTime,
                    });

                    if (resultCache.current.size > 50) {
                        const firstKey = resultCache.current
                            .keys()
                            .next().value;
                        if (firstKey) {
                            resultCache.current.delete(firstKey);
                        }
                    }

                    setProbabilities(workerProbabilities);
                    setLastCalculationTime(calculationTime);
                    setError(null);
                }

                currentRequestId.current = null;
            }
        };

        workerRef.current.onerror = () => {
            setError('Worker execution failed');
            setIsCalculating(false);
            currentRequestId.current = null;
        };

        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
            }
        };
    }, [inputKey]);

    const calculateAsync = useCallback(() => {
        if (!enabled || objects.length === 0 || !workerRef.current) {
            setProbabilities([]);
            setIsCalculating(false);
            setError(null);
            setLastCalculationTime(null);
            return;
        }

        const cached = resultCache.current.get(inputKey);
        if (cached) {
            setProbabilities(cached.probabilities);
            setLastCalculationTime(cached.calculationTime);
            setIsCalculating(false);
            setError(null);
            return;
        }

        if (currentRequestId.current) {
            currentRequestId.current = null;
        }

        const requestId = `calc-${Date.now()}-${Math.random()}`;
        currentRequestId.current = requestId;

        setIsCalculating(true);
        setError(null);

        const message: WorkerMessage = {
            id: requestId,
            objects,
            blockedCells,
        };

        workerRef.current.postMessage(message);
    }, [objects, blockedCells, enabled, inputKey]);

    useEffect(() => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(() => {
            calculateAsync();
        }, 150);

        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, [inputKey, calculateAsync]);

    return {
        probabilities,
        isCalculating,
        error,
        lastCalculationTime,
    };
}
