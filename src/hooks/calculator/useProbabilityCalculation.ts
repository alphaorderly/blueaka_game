import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameObject, GridPosition } from '../../types/calculator';

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

interface WorkerMessage {
    id: string;
    objects: GameObject[];
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

    console.log('[useProbabilityCalculation] Hook initialized with:', {
        objectsCount: objects.length,
        blockedCellsCount: blockedCells.length,
        enabled,
    });

    const workerRef = useRef<Worker | null>(null);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
    const currentRequestId = useRef<string | null>(null);

    // Initialize worker
    useEffect(() => {
        console.log('[useProbabilityCalculation] Initializing worker');
        workerRef.current = new Worker('/probabilityWorker.js');

        workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
            const { id, probabilities, error, calculationTime } = e.data;

            console.log(
                '[useProbabilityCalculation] Worker response received:',
                {
                    id,
                    hasError: !!error,
                    probabilitiesSize: probabilities?.length || 0,
                    calculationTime,
                }
            );

            // Only process if this is the current request
            if (id === currentRequestId.current) {
                console.log(
                    '[useProbabilityCalculation] Processing response for current request'
                );
                setIsCalculating(false);

                if (error) {
                    console.error(
                        '[useProbabilityCalculation] Worker error:',
                        error
                    );
                    setError(error);
                    setProbabilities([]);
                    setLastCalculationTime(null);
                } else {
                    console.log(
                        '[useProbabilityCalculation] Calculation successful:',
                        {
                            gridSize: `${probabilities[0]?.length || 0}x${probabilities.length || 0}`,
                            calculationTime: `${calculationTime.toFixed(2)}ms`,
                        }
                    );
                    setProbabilities(probabilities);
                    setLastCalculationTime(calculationTime);
                    setError(null);
                }

                currentRequestId.current = null;
            } else {
                console.log(
                    '[useProbabilityCalculation] Ignoring outdated response:',
                    {
                        receivedId: id,
                        currentId: currentRequestId.current,
                    }
                );
            }
        };

        workerRef.current.onerror = (error) => {
            console.error('[useProbabilityCalculation] Worker error:', error);
            setError('Worker execution failed');
            setIsCalculating(false);
            currentRequestId.current = null;
        };

        return () => {
            console.log('[useProbabilityCalculation] Cleaning up worker');
            if (workerRef.current) {
                workerRef.current.terminate();
            }
        };
    }, []);

    // Create a stable key for memoization based on inputs
    const inputKey = useMemo(() => {
        const objectsKey = objects
            .map((obj) => `${obj.w}x${obj.h}:${obj.count}`)
            .join(',');
        const blockedKey = blockedCells
            .map((cell) => `${cell.x},${cell.y}`)
            .sort()
            .join('|');
        const key = `${objectsKey}#${blockedKey}`;

        console.log('[useProbabilityCalculation] Input key generated:', {
            key,
            objectsKey,
            blockedKey,
        });

        return key;
    }, [objects, blockedCells]);

    const calculateAsync = useCallback(() => {
        console.log('[useProbabilityCalculation] Calculate async called:', {
            enabled,
            objectsLength: objects.length,
            hasWorker: !!workerRef.current,
        });

        if (!enabled || objects.length === 0 || !workerRef.current) {
            console.log(
                '[useProbabilityCalculation] Calculation skipped - conditions not met'
            );
            setProbabilities([]);
            setIsCalculating(false);
            setError(null);
            setLastCalculationTime(null);
            return;
        }

        // Cancel any ongoing calculation
        if (currentRequestId.current) {
            console.log(
                '[useProbabilityCalculation] Cancelling ongoing calculation:',
                currentRequestId.current
            );
            currentRequestId.current = null;
        }

        const requestId = `calc-${Date.now()}-${Math.random()}`;
        currentRequestId.current = requestId;

        console.log('[useProbabilityCalculation] Starting calculation:', {
            requestId,
            objects: objects.map((obj) => `${obj.w}x${obj.h}(${obj.count})`),
            blockedCells: blockedCells.length,
        });

        setIsCalculating(true);
        setError(null);

        const message: WorkerMessage = {
            id: requestId,
            objects,
            blockedCells,
        };

        workerRef.current.postMessage(message);
    }, [objects, blockedCells, enabled]);

    // Debounced trigger calculation when inputs change
    useEffect(() => {
        console.log(
            '[useProbabilityCalculation] Input changed, debouncing calculation'
        );

        // Clear any pending timeout
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
            console.log(
                '[useProbabilityCalculation] Cleared previous debounce timeout'
            );
        }

        // Set a new timeout for debouncing
        debounceTimeout.current = setTimeout(() => {
            console.log(
                '[useProbabilityCalculation] Debounce timeout completed, triggering calculation'
            );
            calculateAsync();
        }, 300); // 300ms debounce

        // Cleanup function
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
