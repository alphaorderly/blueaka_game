import { GameObject, GridPosition, Orientation } from '../types/calculator';
import { GRID_WIDTH, GRID_HEIGHT } from '../consts/gameData';

interface PlacementInfo {
    x: number;
    y: number;
    w: number;
    h: number;
    objectType: number;
    cells: GridPosition[];
}

interface ValidConfiguration {
    placements: PlacementInfo[];
    weight: number;
}

export function calculateProbabilities(
    objects: GameObject[],
    blockedCells: GridPosition[]
): number[][] {
    // Initialize probability grid
    const probabilities = Array.from({ length: GRID_HEIGHT }, () =>
        Array(GRID_WIDTH).fill(0.0)
    );

    // Helper function to convert grid position to bit index
    const getBitIndex = (x: number, y: number): number => {
        return y * GRID_WIDTH + x;
    };

    // Create blocked cells bitmask
    let blockedMask = 0n;
    for (const cell of blockedCells) {
        const bitIndex = getBitIndex(cell.x, cell.y);
        blockedMask |= 1n << BigInt(bitIndex);
    }

    // Helper function to get all valid orientations
    const getOrientations = (w: number, h: number): Orientation[] => {
        if (w === h) {
            return [{ w, h }];
        }
        return [
            { w, h },
            { w: h, h: w },
        ];
    };

    // Helper function to check if placement is valid
    const isValidPlacement = (
        x: number,
        y: number,
        w: number,
        h: number,
        occupiedMask: bigint
    ): boolean => {
        // Check bounds
        if (x + w > GRID_WIDTH || y + h > GRID_HEIGHT || x < 0 || y < 0) {
            return false;
        }

        // Check if any cell is blocked or already occupied
        for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
                const cellX = x + dx;
                const cellY = y + dy;
                const bitIndex = getBitIndex(cellX, cellY);
                const cellMask = 1n << BigInt(bitIndex);

                if (
                    (blockedMask & cellMask) !== 0n ||
                    (occupiedMask & cellMask) !== 0n
                ) {
                    return false;
                }
            }
        }
        return true;
    };

    // Generate all possible placements for each object type
    const allPossiblePlacements: PlacementInfo[][] = [];
    const objectTypeInfo: { type: number; size: number; count: number }[] = [];

    objects.forEach((obj, objectTypeIndex) => {
        const { w: originalW, h: originalH, count } = obj;
        if (count <= 0) return;

        const orientations = getOrientations(originalW, originalH);
        const placements: PlacementInfo[] = [];

        for (const { w, h } of orientations) {
            for (let y = 0; y <= GRID_HEIGHT - h; y++) {
                for (let x = 0; x <= GRID_WIDTH - w; x++) {
                    if (isValidPlacement(x, y, w, h, 0n)) {
                        const cells: GridPosition[] = [];
                        for (let dy = 0; dy < h; dy++) {
                            for (let dx = 0; dx < w; dx++) {
                                cells.push({ x: x + dx, y: y + dy });
                            }
                        }

                        placements.push({
                            x,
                            y,
                            w,
                            h,
                            objectType: objectTypeIndex,
                            cells,
                        });
                    }
                }
            }
        }

        objectTypeInfo.push({
            type: objectTypeIndex,
            size: originalW * originalH,
            count,
        });

        // Add multiple instances for each object type based on count
        for (let i = 0; i < count; i++) {
            allPossiblePlacements.push(placements);
        }
    });

    if (allPossiblePlacements.length === 0) {
        return probabilities;
    }

    // Sort objects by constraint level (MCV heuristic: Most Constrained Variable first)
    const objectOrder: number[] = [];
    objectTypeInfo.forEach(({ count }) => {
        for (let i = 0; i < count; i++) {
            objectOrder.push(objectOrder.length);
        }
    });

    // Sort by number of possible placements (fewer options = more constrained)
    objectOrder.sort((a, b) => {
        const aOptions = allPossiblePlacements[a].length;
        const bOptions = allPossiblePlacements[b].length;
        return aOptions - bOptions;
    });

    // Find all valid configurations using backtracking with advanced pruning
    const validConfigurations: ValidConfiguration[] = [];

    // Calculate remaining space requirements for pruning
    const remainingObjectSizes = allPossiblePlacements.map((placements) => {
        if (placements.length === 0) return 0;
        return placements[0].cells.length; // All placements for same object have same size
    });

    // Precompute placement conflicts for faster lookup using bitmasks
    const placementConflicts = new Map<string, bigint>();
    for (let i = 0; i < allPossiblePlacements.length; i++) {
        for (const placement of allPossiblePlacements[i]) {
            const key = `${i}-${placement.x}-${placement.y}-${placement.w}-${placement.h}`;
            let conflictMask = 0n;
            for (const cell of placement.cells) {
                const bitIndex = getBitIndex(cell.x, cell.y);
                conflictMask |= 1n << BigInt(bitIndex);
            }
            placementConflicts.set(key, conflictMask);
        }
    }

    // Memoization cache for backtracking results
    const memoCache = new Map<string, number>();

    function getMemoKey(placementIndex: number, occupiedMask: bigint): string {
        return `${placementIndex}-${occupiedMask.toString(16)}`;
    }

    function canFitRemainingObjects(
        placementIndex: number,
        occupiedMask: bigint
    ): boolean {
        const occupiedCount = occupiedMask.toString(2).split('1').length - 1;
        const totalFreeCells =
            GRID_WIDTH * GRID_HEIGHT - occupiedCount - blockedCells.length;
        const requiredCells = remainingObjectSizes
            .slice(placementIndex)
            .reduce((sum, size) => sum + size, 0);
        return totalFreeCells >= requiredCells;
    }

    // Forward checking: check if remaining objects can still be placed
    function forwardCheck(
        placementIndex: number,
        occupiedMask: bigint
    ): boolean {
        for (let i = placementIndex; i < allPossiblePlacements.length; i++) {
            const currentObjectIndex = objectOrder[i];
            const possiblePlacements =
                allPossiblePlacements[currentObjectIndex];
            let hasValidPlacement = false;

            for (const placement of possiblePlacements) {
                const key = `${currentObjectIndex}-${placement.x}-${placement.y}-${placement.w}-${placement.h}`;
                const conflictMask = placementConflicts.get(key);
                if (conflictMask === undefined) continue;

                // Check if this placement conflicts with occupied cells
                if ((occupiedMask & conflictMask) === 0n) {
                    hasValidPlacement = true;
                    break;
                }
            }

            if (!hasValidPlacement) return false;
        }
        return true;
    }

    function backtrackWithMemo(
        placementIndex: number,
        currentConfig: PlacementInfo[],
        occupiedMask: bigint
    ): number {
        // Check memoization cache
        const memoKey = getMemoKey(placementIndex, occupiedMask);
        if (memoCache.has(memoKey)) {
            return memoCache.get(memoKey)!;
        }

        // Pruning 1: Early termination if not enough space for remaining objects
        if (!canFitRemainingObjects(placementIndex, occupiedMask)) {
            memoCache.set(memoKey, 0);
            return 0;
        }

        // Pruning 2: Forward checking - ensure all remaining objects can be placed
        if (!forwardCheck(placementIndex, occupiedMask)) {
            memoCache.set(memoKey, 0);
            return 0;
        }

        // If we've placed all objects, we have a valid configuration
        if (placementIndex >= allPossiblePlacements.length) {
            validConfigurations.push({
                placements: [...currentConfig],
                weight: 1.0,
            });
            memoCache.set(memoKey, 1);
            return 1;
        }

        // Get current object index in sorted order
        const currentObjectIndex = objectOrder[placementIndex];
        const possiblePlacements = allPossiblePlacements[currentObjectIndex];

        // Pruning 3: Symmetry breaking for identical objects
        let startIdx = 0;
        if (placementIndex > 0) {
            const prevObjectIndex = objectOrder[placementIndex - 1];
            const prevObjectType =
                allPossiblePlacements[prevObjectIndex][0]?.objectType;
            const currObjectType = possiblePlacements[0]?.objectType;

            // If same object type, ensure lexicographic ordering to break symmetry
            if (prevObjectType === currObjectType && currentConfig.length > 0) {
                const lastPlacement = currentConfig[currentConfig.length - 1];
                const lastKey = `${lastPlacement.x},${lastPlacement.y}`;

                // Only try placements that come after the last placement lexicographically
                for (let i = 0; i < possiblePlacements.length; i++) {
                    const placement = possiblePlacements[i];
                    const currentKey = `${placement.x},${placement.y}`;
                    if (currentKey > lastKey) {
                        startIdx = i;
                        break;
                    }
                }
            }
        }

        let totalConfigs = 0;

        // Try each possible placement for the current object
        for (let i = startIdx; i < possiblePlacements.length; i++) {
            const placement = possiblePlacements[i];
            const key = `${currentObjectIndex}-${placement.x}-${placement.y}-${placement.w}-${placement.h}`;
            const conflictMask = placementConflicts.get(key);
            if (conflictMask === undefined) continue;

            // Check if this placement conflicts with already placed objects
            if ((occupiedMask & conflictMask) === 0n) {
                // Add this placement
                const newOccupiedMask = occupiedMask | conflictMask;

                currentConfig.push(placement);
                const configs = backtrackWithMemo(
                    placementIndex + 1,
                    currentConfig,
                    newOccupiedMask
                );
                totalConfigs += configs;
                currentConfig.pop();
            }
        }

        memoCache.set(memoKey, totalConfigs);
        return totalConfigs;
    }

    // Start backtracking with memoization
    backtrackWithMemo(0, [], 0n);

    // Calculate probabilities from all valid configurations
    if (validConfigurations.length === 0) {
        return probabilities;
    }

    const totalConfigurations = validConfigurations.length;
    const cellCoverage = new Map<string, number>();

    // Count how many configurations cover each cell
    for (const config of validConfigurations) {
        const coveredCells = new Set<string>();

        for (const placement of config.placements) {
            for (const cell of placement.cells) {
                coveredCells.add(`${cell.x},${cell.y}`);
            }
        }

        for (const cellKey of coveredCells) {
            cellCoverage.set(cellKey, (cellCoverage.get(cellKey) || 0) + 1);
        }
    }

    // Calculate final probabilities
    for (const [cellKey, coverage] of cellCoverage.entries()) {
        const [x, y] = cellKey.split(',').map(Number);
        if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
            probabilities[y][x] = coverage / totalConfigurations;
        }
    }

    // Ensure blocked cells have 0 probability
    for (const cell of blockedCells) {
        if (
            cell.x >= 0 &&
            cell.x < GRID_WIDTH &&
            cell.y >= 0 &&
            cell.y < GRID_HEIGHT
        ) {
            probabilities[cell.y][cell.x] = 0.0;
        }
    }

    return probabilities;
}
