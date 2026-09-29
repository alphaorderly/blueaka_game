import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProbabilityCalculation } from '../hooks/inventory/useProbabilityCalculation';

class MockWorker {
    static instances: MockWorker[] = [];
    onmessage: ((event: { data: unknown }) => void) | null = null;
    onerror: (() => void) | null = null;
    postMessage = vi.fn();
    terminate = vi.fn();
    constructor() {
        MockWorker.instances.push(this);
    }
    respond(probabilities = [[0.5]], error?: string) {
        this.onmessage?.({
            data: {
                id: this.postMessage.mock.calls[0][0].id,
                probabilities,
                objectProbabilities: [probabilities],
                calculationTime: 5,
                error,
            },
        });
    }
}
const objects = [{ w: 1, h: 2, count: 1, totalCount: 1 }];
const props = {
    objects,
    blockedCells: [] as { x: number; y: number }[],
    enabled: true,
};

describe('probability worker scheduling', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        MockWorker.instances = [];
        vi.stubGlobal('Worker', MockWorker);
    });
    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });
    it('starts immediately and does not resend equivalent inputs on rerender', () => {
        const { rerender, result } = renderHook(useProbabilityCalculation, {
            initialProps: props,
        });
        expect(MockWorker.instances).toHaveLength(1);
        rerender({ ...props, objects: [...objects], blockedCells: [] });
        act(() => vi.advanceTimersByTime(500));
        expect(MockWorker.instances).toHaveLength(1);
        expect(MockWorker.instances[0].postMessage).toHaveBeenCalledTimes(1);
        act(() => MockWorker.instances[0].respond());
        expect(result.current.isCalculating).toBe(false);
    });
    it('cancels stale work, coalesces rapid inputs and serves cache immediately', () => {
        const { rerender, result } = renderHook(useProbabilityCalculation, {
            initialProps: props,
        });
        const first = MockWorker.instances[0];
        act(() => first.respond([[0.25]]));
        rerender({ ...props, blockedCells: [{ x: 0, y: 0 }] });
        rerender({ ...props, blockedCells: [{ x: 1, y: 0 }] });
        expect(first.terminate).toHaveBeenCalled();
        act(() => vi.advanceTimersByTime(150));
        expect(MockWorker.instances).toHaveLength(2);
        const second = MockWorker.instances[1];
        expect(second.postMessage.mock.calls[0][0].blockedCells).toEqual([
            { x: 1, y: 0 },
        ]);
        rerender(props);
        expect(result.current.probabilities).toEqual([[0.25]]);
        act(() => second.respond([[0.9]]));
        expect(result.current.probabilities).toEqual([[0.25]]);
        expect(result.current.isCalculating).toBe(false);
    });
    it('clears disabled input and ignores late results', () => {
        const { rerender, result } = renderHook(useProbabilityCalculation, {
            initialProps: props,
        });
        rerender({ ...props, enabled: false });
        act(() => MockWorker.instances[0].respond());
        expect(result.current.probabilities).toEqual([]);
        expect(result.current.isCalculating).toBe(false);
    });
    it('does not reuse per-type cached results for a different type order', () => {
        const pair = [objects[0], { w: 2, h: 2, count: 1, totalCount: 1 }];
        const { rerender } = renderHook(useProbabilityCalculation, {
            initialProps: { ...props, objects: pair },
        });
        act(() => MockWorker.instances[0].respond());
        rerender({ ...props, objects: [...pair].reverse() });
        act(() => vi.advanceTimersByTime(150));
        expect(MockWorker.instances).toHaveLength(2);
    });
    it('reuses reordered cell and fixed placement inputs without mutating them', () => {
        const input = {
            ...props,
            blockedCells: [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
            ],
            hitCells: [
                { x: 2, y: 0 },
                { x: 3, y: 0 },
            ],
            placedObjects: [
                {
                    w: 2,
                    h: 1,
                    cells: [
                        { x: 4, y: 0 },
                        { x: 5, y: 0 },
                    ],
                },
                { w: 1, h: 1, cells: [{ x: 6, y: 0 }] },
            ],
        };
        const { result, rerender } = renderHook(useProbabilityCalculation, {
            initialProps: input,
        });
        act(() => MockWorker.instances[0].respond());
        const reversed = [
            { ...input, blockedCells: [...input.blockedCells].reverse() },
            { ...input, hitCells: [...input.hitCells].reverse() },
            {
                ...input,
                placedObjects: [...input.placedObjects]
                    .reverse()
                    .map((object) => ({
                        ...object,
                        cells: [...object.cells].reverse(),
                    })),
            },
        ];
        for (const next of reversed) {
            Object.freeze(next.blockedCells);
            Object.freeze(next.hitCells);
            Object.freeze(next.placedObjects);
            next.placedObjects.forEach(({ cells }) => Object.freeze(cells));
            rerender(next);
            expect(result.current.isCalculating).toBe(false);
            act(() => vi.advanceTimersByTime(150));
            expect(MockWorker.instances).toHaveLength(1);
            expect(result.current.probabilities).toEqual([[0.5]]);
        }
    });
    it.each(['running', 'queued'])('cancels %s work on unmount', (phase) => {
        const { rerender, unmount } = renderHook(useProbabilityCalculation, {
            initialProps: props,
        });
        const worker = MockWorker.instances[0];
        if (phase === 'queued')
            rerender({ ...props, blockedCells: [{ x: 0, y: 0 }] });
        unmount();
        expect(worker.terminate).toHaveBeenCalled();
        act(() => vi.advanceTimersByTime(500));
        expect(MockWorker.instances).toHaveLength(1);
    });
    it.each(['constructor', 'postMessage', 'response', 'event'])(
        'clears results on %s failure and retries uncached input',
        (failure) => {
            const { rerender, result } = renderHook(useProbabilityCalculation, {
                initialProps: props,
            });
            act(() => MockWorker.instances[0].respond());
            const error = 'Calculation failed';
            vi.stubGlobal(
                'Worker',
                class extends MockWorker {
                    constructor() {
                        super();
                        if (failure === 'constructor') throw new Error(error);
                        if (failure === 'postMessage')
                            this.postMessage.mockImplementation(() => {
                                throw error;
                            });
                    }
                }
            );
            const changed = { ...props, blockedCells: [{ x: 0, y: 0 }] };
            rerender(changed);
            act(() => vi.advanceTimersByTime(150));
            const failed = MockWorker.instances[1];
            if (failure === 'response') act(() => failed.respond([], error));
            if (failure === 'event') act(() => failed.onerror?.());
            expect(result.current).toEqual({
                probabilities: [],
                objectProbabilities: [],
                isCalculating: false,
                error:
                    failure === 'postMessage' || failure === 'event'
                        ? 'Worker execution failed'
                        : error,
                lastCalculationTime: null,
            });
            if (failure !== 'constructor')
                expect(failed.terminate).toHaveBeenCalled();
            vi.stubGlobal('Worker', MockWorker);
            rerender(props);
            rerender(changed);
            act(() => vi.advanceTimersByTime(150));
            expect(MockWorker.instances).toHaveLength(3);
            act(() => MockWorker.instances[2].respond());
            expect(result.current.error).toBeNull();
            expect(result.current.probabilities).toEqual([[0.5]]);
        }
    );
});
