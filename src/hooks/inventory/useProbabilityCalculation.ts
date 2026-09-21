import { useState, useEffect, useRef } from 'react';
import {
    InventoryObject,
    GridPosition,
} from '@/types/inventory-management/inventory';

interface UseProbabilityCalculationProps {
    objects: InventoryObject[];
    blockedCells: GridPosition[];
    hitCells?: GridPosition[];
    placedObjects?: {
        w: number;
        h: number;
        cells: GridPosition[];
    }[];
    enabled?: boolean;
}

interface UseProbabilityCalculationResult {
    probabilities: number[][];
    objectProbabilities: number[][][];
    isCalculating: boolean;
    error: string | null;
    lastCalculationTime: number | null;
}

interface WorkerResponse {
    id: string;
    probabilities: number[][];
    objectProbabilities?: number[][][];
    error?: string;
    calculationTime: number;
}

const initialResult: UseProbabilityCalculationResult = {
    probabilities: [],
    objectProbabilities: [],
    isCalculating: false,
    error: null,
    lastCalculationTime: null,
};
const sortCells = (cells: GridPosition[]) =>
    [...cells].sort((a, b) => a.x - b.x || a.y - b.y);

export const useProbabilityCalculation = ({
    objects,
    blockedCells,
    hitCells = [],
    placedObjects = [],
    enabled = true,
}: UseProbabilityCalculationProps): UseProbabilityCalculationResult => {
    const [result, setResult] = useState(initialResult);
    const cache = useRef(new Map<string, UseProbabilityCalculationResult>());
    const lastStarted = useRef(-Infinity);
    // Type order is significant: objectProbabilities uses the same indices.
    const inputKey = JSON.stringify({
        objects: objects.map(({ w, h, count }) => ({ w, h, count })),
        blockedCells: sortCells(blockedCells),
        hitCells: sortCells(hitCells),
        placedObjects: placedObjects
            .map(({ w, h, cells }) => ({ w, h, cells: sortCells(cells) }))
            .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    });
    const hasObjects = objects.length > 0;

    useEffect(() => {
        if (!enabled || !hasObjects) return setResult(initialResult);
        const cached = cache.current.get(inputKey);
        if (cached) return setResult(cached);
        let worker: Worker | undefined;
        let active = true;
        const fail = (error = 'Worker execution failed') => {
            if (active) setResult({ ...initialResult, error });
            worker?.terminate();
        };
        setResult((previous) => ({
            ...previous,
            isCalculating: true,
            error: null,
        }));
        const start = () => {
            lastStarted.current = performance.now();
            try {
                worker = new Worker('/probabilityWorker.js');
                worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
                    if (!active || data.id !== inputKey) return;
                    if (data.error) return fail(data.error);
                    const next = {
                        ...initialResult,
                        probabilities: data.probabilities,
                        objectProbabilities: data.objectProbabilities || [],
                        lastCalculationTime: data.calculationTime,
                    };
                    cache.current.set(inputKey, next);
                    if (cache.current.size > 50) {
                        const first = cache.current.keys().next().value;
                        if (first !== undefined) cache.current.delete(first);
                    }
                    setResult(next);
                    worker?.terminate();
                };
                worker.onerror = () => fail();
                worker.postMessage({ id: inputKey, ...JSON.parse(inputKey) });
            } catch (error) {
                fail(error instanceof Error ? error.message : undefined);
            }
        };
        // First/isolated requests and cache hits are immediate. Only rapid input
        // changes wait; cleanup cancels both queued and running stale requests.
        const delay = Math.max(
            0,
            150 - (performance.now() - lastStarted.current)
        );
        const timeout = delay > 0 ? setTimeout(start, delay) : undefined;
        if (delay === 0) start();
        return () => {
            active = false;
            clearTimeout(timeout);
            worker?.terminate();
        };
    }, [inputKey, enabled, hasObjects]);
    return result;
};
