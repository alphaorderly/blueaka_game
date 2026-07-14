// Probability worker entrypoint. Balances exact enumeration and Monte Carlo sampling
// to return placement probabilities for a 9x5 grid while keeping accuracy intact.
const GRID_WIDTH = 9;
const GRID_HEIGHT = 5;
const TOTAL_CELLS = GRID_WIDTH * GRID_HEIGHT;
const EXACT_CONFIGURATION_THRESHOLD = 200000;

// Runtime knobs used by both enumeration and sampling paths.
const OPTIMIZATION_CONFIG = {
    MAX_CALCULATION_TIME: 30000, // hard stop per worker run (ms)
    MAX_VALID_CONFIGURATIONS: 1000000,
    MONTE_CARLO_SAMPLES: 1000000, // maximum sampling budget per request
    MONTE_CARLO_CONVERGENCE_CHECK: 25000, // check convergence every N samples
    MONTE_CARLO_TOLERANCE: 0.0005, // per-cell delta allowed to declare convergence
};

/**
 * Creates a 2D array suitable for storing per-cell probabilities.
 * @returns {number[][]} Fresh grid sized to GRID_HEIGHT x GRID_WIDTH.
 */
function createProbabilityGrid() {
    return Array.from({ length: GRID_HEIGHT }, () =>
        Array(GRID_WIDTH).fill(0.0)
    );
}

/**
 * Flattens a 2D grid coordinate to a linear index.
 * @param {number} x Zero-based column index.
 * @param {number} y Zero-based row index.
 * @returns {number} Flattened index within TOTAL_CELLS.
 */
function getCellIndex(x, y) {
    return y * GRID_WIDTH + x;
}

/**
 * Converts visit counts into probabilities and applies blocked-cell overrides.
 * @param {number[][]} probabilities Mutable probability grid.
 * @param {Uint32Array|Float64Array} coverage Per-cell visit counts.
 * @param {number} total Total number of valid configurations sampled/enumerated.
 * @param {{x:number,y:number}[]} blockedCells Cells that must remain zeroed.
 * @returns {number[][]} Updated probability grid.
 */
function populateProbabilitiesFromCoverage(
    probabilities,
    coverage,
    total,
    blockedCells
) {
    if (!total) {
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

    const inverseTotal = 1 / total;
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const index = getCellIndex(x, y);
            probabilities[y][x] = coverage[index] * inverseTotal;
        }
    }

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

/**
 * BitMask helpers keep per-cell state compact when walking placements.
 */
class BitMaskUtils {
    /**
     * Builds a placement mask from the provided cell coordinates.
     * @param {{x:number,y:number}[]} cells Cells included in the placement.
     * @param {number} gridWidth Width of the grid in cells.
     * @returns {bigint} Bitmask representing the placement.
     */
    static createMask(cells, gridWidth) {
        let mask = 0n;
        for (const cell of cells) {
            const bitIndex = cell.y * gridWidth + cell.x;
            mask |= 1n << BigInt(bitIndex);
        }
        return mask;
    }

    /**
     * Checks if two placement masks overlap.
     * @param {bigint} mask1 First placement mask.
     * @param {bigint} mask2 Second placement mask.
     * @returns {boolean} True when any overlapping cell is detected.
     */
    static checkOverlap(mask1, mask2) {
        return (mask1 & mask2) !== 0n;
    }

    /**
     * Counts set bits within the given mask.
     * @param {bigint} mask Placement mask under inspection.
     * @returns {number} Number of bits set to 1.
     */
    static countBits(mask) {
        let count = 0;
        while (mask > 0n) {
            count += Number(mask & 1n);
            mask >>= 1n;
        }
        return count;
    }

    /**
     * Counts free cells by subtracting occupied and blocked masks from universe.
     * @param {number} totalCells Number of cells in the grid.
     * @param {bigint} occupiedMask Mask of already occupied cells.
     * @param {bigint} blockedMask Mask of blocked cells.
     * @returns {number} Quantity of cells remaining free.
     */
    static getFreeCells(totalCells, occupiedMask, blockedMask) {
        const allCellsMask = (1n << BigInt(totalCells)) - 1n;
        const freeMask = allCellsMask & ~occupiedMask & ~blockedMask;
        return BitMaskUtils.countBits(freeMask);
    }
}

/**
 * Main entry for probability calculation request.
 * Creates placement candidates and selects exact or Monte Carlo solver.
 * @param {{w:number,h:number,count:number}[]} objects Requested objects.
 * @param {{x:number,y:number}[]} blockedCells Cells that cannot be occupied.
 * @param {{x:number,y:number}[]} hitCells Cells that must be covered by at least one placement.
 * @param {{w:number,h:number,cells:{x:number,y:number}[]}[]} placedObjects Already placed objects (fixed placements).
 * @returns {{probabilities: number[][], objectProbabilities: number[][][]}} Probability grids.
 */
function calculateProbabilities(
    objects,
    blockedCells,
    hitCells,
    placedObjects
) {
    hitCells = hitCells || [];
    placedObjects = placedObjects || [];

    console.log('[ProbabilityWorker] Starting calculation with:', {
        objects: objects.map((obj) => `${obj.w}x${obj.h}(${obj.count})`),
        blockedCellsCount: blockedCells.length,
        hitCellsCount: hitCells.length,
        placedObjectsCount: placedObjects.length,
        gridSize: `${GRID_WIDTH}x${GRID_HEIGHT}`,
    });

    const probabilities = createProbabilityGrid();
    const objectProbabilities = objects.map(() => createProbabilityGrid());

    // Helper function to convert grid position to bit index
    const getBitIndex = getCellIndex;

    // Create blocked cells bitmask
    let blockedMask = 0n;
    for (const cell of blockedCells) {
        const bitIndex = getBitIndex(cell.x, cell.y);
        blockedMask |= 1n << BigInt(bitIndex);
    }

    // Create initial occupied mask from already placed objects
    let initialOccupiedMask = 0n;
    if (Array.isArray(placedObjects)) {
        for (const placed of placedObjects) {
            if (!placed || !Array.isArray(placed.cells)) continue;
            for (const cell of placed.cells) {
                const bitIndex = getBitIndex(cell.x, cell.y);
                initialOccupiedMask |= 1n << BigInt(bitIndex);
            }
        }
    }

    // Helper function to get all valid orientations
    /**
     * Returns all orientations for a rectangular object.
     * @param {number} w Original width.
     * @param {number} h Original height.
     * @returns {{w:number,h:number}[]} Orientation list (rotations included when needed).
     */
    const getOrientations = (w, h) => {
        if (w === h) {
            return [{ w, h }];
        }
        return [
            { w, h },
            { w: h, h: w },
        ];
    };

    // Enhanced placement validation with early termination and conflict mask
    /**
     * Checks whether an object fits the grid without colliding with occupied or blocked cells.
     * @param {number} x Candidate left coordinate.
     * @param {number} y Candidate top coordinate.
     * @param {number} w Object width.
     * @param {number} h Object height.
     * @param {bigint} occupiedMask Current aggregate occupied mask.
     * @param {bigint|null} placementMask Optional precomputed mask.
     * @returns {boolean} True when placement is legal.
     */
    const isValidPlacement = (
        x,
        y,
        w,
        h,
        occupiedMask,
        placementMask = null
    ) => {
        // Check bounds
        if (x + w > GRID_WIDTH || y + h > GRID_HEIGHT || x < 0 || y < 0) {
            return false;
        }

        // Use precomputed placement mask if available
        if (placementMask !== null) {
            return (
                (occupiedMask & placementMask) === 0n &&
                (blockedMask & placementMask) === 0n
            );
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
    const allPossiblePlacements = [];
    // Maps each placement index to its object type index
    const objectTypeMapping = [];

    console.log('[ProbabilityWorker] Generating possible placements...');

    objects.forEach((obj, objectTypeIndex) => {
        const { w: originalW, h: originalH, count } = obj;
        if (count <= 0) return;

        const orientations = getOrientations(originalW, originalH);
        const placements = [];

        for (const { w, h } of orientations) {
            for (let y = 0; y <= GRID_HEIGHT - h; y++) {
                for (let x = 0; x <= GRID_WIDTH - w; x++) {
                    if (isValidPlacement(x, y, w, h, 0n)) {
                        const cells = [];
                        let placementMask = 0n;

                        for (let dy = 0; dy < h; dy++) {
                            for (let dx = 0; dx < w; dx++) {
                                const cellX = x + dx;
                                const cellY = y + dy;
                                cells.push({ x: cellX, y: cellY });

                                const bitIndex = getBitIndex(cellX, cellY);
                                placementMask |= 1n << BigInt(bitIndex);
                            }
                        }

                        placements.push({
                            x,
                            y,
                            w,
                            h,
                            cells,
                            mask: placementMask,
                        });
                    }
                }
            }
        }

        console.log(
            `[ProbabilityWorker] Object ${objectTypeIndex} (${originalW}x${originalH}): ${placements.length} possible placements`
        );

        // Add multiple instances for each object type based on count
        for (let i = 0; i < count; i++) {
            allPossiblePlacements.push([...placements]);
            objectTypeMapping.push(objectTypeIndex);
        }
    });

    if (allPossiblePlacements.length === 0) {
        console.log(
            '[ProbabilityWorker] No possible placements found, returning empty probabilities'
        );
        return { probabilities, objectProbabilities };
    }

    if (allPossiblePlacements.some((placements) => placements.length === 0)) {
        console.log(
            '[ProbabilityWorker] At least one object instance has no valid placements'
        );
        return { probabilities, objectProbabilities };
    }

    const estimatedConfigurations = estimateTotalConfigurations(
        allPossiblePlacements
    );
    console.log(
        `[ProbabilityWorker] Estimated total configurations: ${estimatedConfigurations}`
    );

    if (
        estimatedConfigurations !== Number.MAX_SAFE_INTEGER &&
        estimatedConfigurations <= EXACT_CONFIGURATION_THRESHOLD
    ) {
        console.log(
            `[ProbabilityWorker] Using exact enumeration (<= ${EXACT_CONFIGURATION_THRESHOLD} configurations)`
        );
        return calculateProbabilitiesExact(
            allPossiblePlacements,
            blockedCells,
            hitCells,
            initialOccupiedMask,
            objectTypeMapping
        );
    }

    console.log(
        '[ProbabilityWorker] Using Monte Carlo sampling for reliable probability calculation'
    );
    return calculateProbabilitiesWithMonteCarlo(
        objects,
        blockedCells,
        allPossiblePlacements,
        hitCells,
        initialOccupiedMask,
        objectTypeMapping
    );
}

/**
 * Enumerates every configuration when the search space is small.
 * @param {Array<Array<{x:number,y:number,w:number,h:number,cells:{x:number,y:number}[],mask:bigint}>>} allPossiblePlacements Per-instance placement catalogue.
 * @param {{x:number,y:number}[]} blockedCells Cells that cannot be occupied.
 * @param {{x:number,y:number}[]} hitCells Cells that must be covered by at least one placement.
 * @param {bigint} initialOccupiedMask Mask of already occupied cells from placedObjects.
 * @param {number[]} objectTypeMapping Maps placement index to object type index.
 * @returns {{probabilities: number[][], objectProbabilities: number[][][]}} Probability grids.
 */
function calculateProbabilitiesExact(
    allPossiblePlacements,
    blockedCells,
    hitCells,
    initialOccupiedMask,
    objectTypeMapping
) {
    const probabilities = createProbabilityGrid();
    const numObjectTypes = Math.max(...objectTypeMapping, -1) + 1;
    const objectProbabilities = Array.from({ length: numObjectTypes }, () =>
        createProbabilityGrid()
    );

    if (allPossiblePlacements.some((placements) => placements.length === 0)) {
        console.log(
            '[ProbabilityWorker] Exact enumeration skipped - missing placements'
        );
        return { probabilities, objectProbabilities };
    }

    const coverage = new Uint32Array(TOTAL_CELLS);
    // Per-object-type coverage: objectCoverage[objectTypeIndex][cellIndex]
    const objectCoverage = Array.from(
        { length: numObjectTypes },
        () => new Uint32Array(TOTAL_CELLS)
    );
    const selection = new Array(allPossiblePlacements.length);
    const visitStamp = new Uint32Array(TOTAL_CELLS);
    // Per-object-type visit stamps to avoid double-counting within same configuration
    const objectVisitStamp = Array.from(
        { length: numObjectTypes },
        () => new Uint32Array(TOTAL_CELLS)
    );
    let stampCounter = 1;
    let totalConfigurations = 0;

    const enumerate = (index, occupiedMask) => {
        if (index >= allPossiblePlacements.length) {
            // Validate that all hitCells are covered in this configuration
            if (Array.isArray(hitCells) && hitCells.length > 0) {
                const hitCovered = hitCells.every((hit) => {
                    const bitIndex = getCellIndex(hit.x, hit.y);
                    const cellMask = 1n << BigInt(bitIndex);
                    return (occupiedMask & cellMask) !== 0n;
                });
                if (!hitCovered) {
                    return;
                }
            }

            totalConfigurations++;
            let currentStamp = stampCounter++;
            if (stampCounter === 0xffffffff) {
                visitStamp.fill(0);
                for (let t = 0; t < numObjectTypes; t++) {
                    objectVisitStamp[t].fill(0);
                }
                stampCounter = 1;
                currentStamp = stampCounter++;
            }

            for (let i = 0; i < selection.length; i++) {
                const placement = selection[i];
                const objectTypeIndex = objectTypeMapping[i];
                const cells = placement.cells;
                for (let c = 0; c < cells.length; c++) {
                    const cell = cells[c];
                    const cellIndex = getCellIndex(cell.x, cell.y);
                    // Global coverage (any object)
                    if (visitStamp[cellIndex] !== currentStamp) {
                        visitStamp[cellIndex] = currentStamp;
                        coverage[cellIndex]++;
                    }
                    // Per-object-type coverage
                    if (
                        objectVisitStamp[objectTypeIndex][cellIndex] !==
                        currentStamp
                    ) {
                        objectVisitStamp[objectTypeIndex][cellIndex] =
                            currentStamp;
                        objectCoverage[objectTypeIndex][cellIndex]++;
                    }
                }
            }
            return;
        }

        const options = allPossiblePlacements[index];
        for (let i = 0; i < options.length; i++) {
            const placement = options[i];
            if (BitMaskUtils.checkOverlap(occupiedMask, placement.mask)) {
                continue;
            }

            selection[index] = placement;
            enumerate(index + 1, occupiedMask | placement.mask);
        }
    };

    enumerate(0, initialOccupiedMask || 0n);

    if (totalConfigurations === 0) {
        console.log(
            '[ProbabilityWorker] Exact enumeration found no valid configurations'
        );
        return { probabilities, objectProbabilities };
    }

    populateProbabilitiesFromCoverage(
        probabilities,
        coverage,
        totalConfigurations,
        blockedCells
    );

    // Populate per-object-type probabilities
    for (let t = 0; t < numObjectTypes; t++) {
        populateProbabilitiesFromCoverage(
            objectProbabilities[t],
            objectCoverage[t],
            totalConfigurations,
            blockedCells
        );
    }

    console.log(
        `[ProbabilityWorker] Exact enumeration completed with ${totalConfigurations} configurations`
    );

    return { probabilities, objectProbabilities };
}

/**
 * Provides a fast upper bound on total configuration count for solver selection.
 * @param {Array<Array<{mask:bigint}>>} allPossiblePlacements Placement options per object.
 * @returns {number} Estimated configuration count or Number.MAX_SAFE_INTEGER when capped.
 */
function estimateTotalConfigurations(allPossiblePlacements) {
    // Simple estimation: multiply number of options for each placement
    let estimate = 1;
    for (const placements of allPossiblePlacements) {
        estimate *= placements.length;
        // Cap the estimate to avoid overflow
        if (estimate > Number.MAX_SAFE_INTEGER / 1000) {
            return Number.MAX_SAFE_INTEGER;
        }
    }
    return estimate;
}

/**
 * Approximates probabilities via Monte Carlo sampling when enumeration is infeasible.
 * @param {{w:number,h:number,count:number}[]} objects Requested objects (unused but logged).
 * @param {{x:number,y:number}[]} blockedCells Cells that must never be occupied.
 * @param {Array<Array<{x:number,y:number,cells:{x:number,y:number}[],mask:bigint}>>} allPossiblePlacements Placement catalogue.
 * @param {{x:number,y:number}[]} hitCells Cells that must be covered by at least one placement.
 * @param {bigint} initialOccupiedMask Mask of already occupied cells from placedObjects.
 * @param {number[]} objectTypeMapping Maps placement index to object type index.
 * @returns {{probabilities: number[][], objectProbabilities: number[][][]}} Probability grids.
 */
function calculateProbabilitiesWithMonteCarlo(
    objects,
    blockedCells,
    allPossiblePlacements,
    hitCells,
    initialOccupiedMask,
    objectTypeMapping
) {
    const probabilities = createProbabilityGrid();
    const numObjectTypes = Math.max(...objectTypeMapping, -1) + 1;
    const objectProbabilities = Array.from({ length: numObjectTypes }, () =>
        createProbabilityGrid()
    );

    if (allPossiblePlacements.some((placements) => placements.length === 0)) {
        console.log(
            '[ProbabilityWorker] Monte Carlo skipped - missing placements'
        );
        return { probabilities, objectProbabilities };
    }

    console.log(
        `[ProbabilityWorker] Starting Monte Carlo sampling (max ${OPTIMIZATION_CONFIG.MONTE_CARLO_SAMPLES} samples)`
    );

    const cellCoverage = new Uint32Array(TOTAL_CELLS);
    const objectCoverage = Array.from(
        { length: numObjectTypes },
        () => new Uint32Array(TOTAL_CELLS)
    );
    const visitStamp = new Uint32Array(TOTAL_CELLS);
    const objectVisitStamp = Array.from(
        { length: numObjectTypes },
        () => new Uint32Array(TOTAL_CELLS)
    );
    const configurationBuffer = new Array(allPossiblePlacements.length);

    const previousSnapshot = new Float64Array(TOTAL_CELLS);
    const currentSnapshot = new Float64Array(TOTAL_CELLS);
    let hasPreviousSnapshot = false;

    let stampCounter = 1;
    let validSamples = 0;
    let totalSamples = 0;
    const maxSamples = OPTIMIZATION_CONFIG.MONTE_CARLO_SAMPLES;
    const convergenceInterval = Math.max(
        1,
        OPTIMIZATION_CONFIG.MONTE_CARLO_CONVERGENCE_CHECK
    );

    const startTime = performance.now();

    while (totalSamples < maxSamples) {
        totalSamples++;

        const configurationMask = generateRandomConfiguration(
            allPossiblePlacements,
            configurationBuffer,
            initialOccupiedMask || 0n
        );

        if (configurationMask !== null) {
            // Validate hitCells coverage for this configuration
            if (Array.isArray(hitCells) && hitCells.length > 0) {
                const allHitsCovered = hitCells.every((hit) => {
                    const bitIndex = getCellIndex(hit.x, hit.y);
                    const cellMask = 1n << BigInt(bitIndex);
                    return (configurationMask & cellMask) !== 0n;
                });

                if (!allHitsCovered) {
                    continue;
                }
            }
            validSamples++;
            let currentStamp = stampCounter++;
            if (stampCounter === 0xffffffff) {
                visitStamp.fill(0);
                for (let t = 0; t < numObjectTypes; t++) {
                    objectVisitStamp[t].fill(0);
                }
                stampCounter = 1;
                currentStamp = stampCounter++;
            }

            for (let i = 0; i < configurationBuffer.length; i++) {
                const placement = configurationBuffer[i];
                if (!placement) continue;
                const objectTypeIndex = objectTypeMapping[i];
                const cells = placement.cells;
                for (let c = 0; c < cells.length; c++) {
                    const cell = cells[c];
                    const cellIndex = getCellIndex(cell.x, cell.y);
                    // Global coverage
                    if (visitStamp[cellIndex] !== currentStamp) {
                        visitStamp[cellIndex] = currentStamp;
                        cellCoverage[cellIndex]++;
                    }
                    // Per-object-type coverage
                    if (
                        objectVisitStamp[objectTypeIndex][cellIndex] !==
                        currentStamp
                    ) {
                        objectVisitStamp[objectTypeIndex][cellIndex] =
                            currentStamp;
                        objectCoverage[objectTypeIndex][cellIndex]++;
                    }
                }
            }
        }

        if (totalSamples % convergenceInterval === 0) {
            const currentTime = performance.now();
            const validRate = totalSamples
                ? ((validSamples / totalSamples) * 100).toFixed(2)
                : '0.00';

            console.log(
                `[ProbabilityWorker] Monte Carlo progress: ${totalSamples}/${maxSamples} samples, ${validRate}% valid`
            );

            if (validSamples > 0) {
                const inverseSamples = 1 / validSamples;
                for (let i = 0; i < TOTAL_CELLS; i++) {
                    currentSnapshot[i] = cellCoverage[i] * inverseSamples;
                }

                if (
                    hasPreviousSnapshot &&
                    hasConvergedArrays(previousSnapshot, currentSnapshot)
                ) {
                    console.log(
                        `[ProbabilityWorker] Monte Carlo converged at ${totalSamples} samples`
                    );
                    break;
                }

                previousSnapshot.set(currentSnapshot);
                hasPreviousSnapshot = true;
            }

            if (
                currentTime - startTime >
                OPTIMIZATION_CONFIG.MAX_CALCULATION_TIME
            ) {
                console.log(
                    '[ProbabilityWorker] Monte Carlo time limit reached'
                );
                break;
            }
        }
    }

    if (validSamples === 0) {
        console.log(
            '[ProbabilityWorker] No valid samples found in Monte Carlo'
        );
        return { probabilities, objectProbabilities };
    }

    populateProbabilitiesFromCoverage(
        probabilities,
        cellCoverage,
        validSamples,
        blockedCells
    );

    // Populate per-object-type probabilities
    for (let t = 0; t < numObjectTypes; t++) {
        populateProbabilitiesFromCoverage(
            objectProbabilities[t],
            objectCoverage[t],
            validSamples,
            blockedCells
        );
    }

    console.log(
        `[ProbabilityWorker] Monte Carlo completed: ${validSamples} valid samples out of ${totalSamples} total`
    );

    return { probabilities, objectProbabilities };
}

/**
 * Generates a single random configuration without overlapping placements.
 * @param {Array<Array<{cells:{x:number,y:number}[],mask:bigint}>>} allPossiblePlacements Placement catalogue.
 * @param {Array<{cells:{x:number,y:number}[],mask:bigint}>} configurationBuffer Reusable buffer for placements.
 * @param {bigint} initialOccupiedMask Mask of already occupied cells from placedObjects.
 * @returns {bigint|null} Occupied mask for the configuration or null when infeasible.
 */
function generateRandomConfiguration(
    allPossiblePlacements,
    configurationBuffer,
    initialOccupiedMask
) {
    let occupiedMask = initialOccupiedMask || 0n;

    for (let i = 0; i < allPossiblePlacements.length; i++) {
        const possiblePlacements = allPossiblePlacements[i];
        const optionCount = possiblePlacements.length;

        if (optionCount === 0) {
            return null;
        }

        // Collect only candidates that do not overlap with current occupied mask
        const validCandidates = [];
        for (let k = 0; k < optionCount; k++) {
            const candidate = possiblePlacements[k];
            if (!BitMaskUtils.checkOverlap(occupiedMask, candidate.mask)) {
                validCandidates.push(candidate);
            }
        }

        if (validCandidates.length === 0) {
            // No valid placement for this object instance with current occupied state
            return null;
        }

        const selectedIndex = Math.floor(
            Math.random() * validCandidates.length
        );
        const selectedPlacement = validCandidates[selectedIndex];

        configurationBuffer[i] = selectedPlacement;
        occupiedMask |= selectedPlacement.mask;
    }

    return occupiedMask;
}

/**
 * Determines whether probability snapshots differ less than the convergence tolerance.
 * @param {Float64Array} previous Snapshot from the prior convergence check.
 * @param {Float64Array} current Snapshot from the current convergence check.
 * @returns {boolean} True once all cells meet the tolerance threshold.
 */
function hasConvergedArrays(previous, current) {
    for (let i = 0; i < previous.length; i++) {
        if (
            Math.abs(previous[i] - current[i]) >=
            OPTIMIZATION_CONFIG.MONTE_CARLO_TOLERANCE
        ) {
            return false;
        }
    }
    return true;
}

/**
 * Handles worker messages by running the probability calculation and returning the result.
 * @param {MessageEvent<{id:string|number,objects:{w:number,h:number,count:number}[],blockedCells:{x:number,y:number}[],hitCells?:{x:number,y:number}[],placedObjects?:{w:number,h:number,cells:{x:number,y:number}[]}[]}>} e Incoming message payload.
 */
self.onmessage = function (e) {
    const { id, objects, blockedCells, hitCells, placedObjects } = e.data;
    console.log('[ProbabilityWorker] Received message:', {
        id,
        objectsCount: objects?.length || 0,
        blockedCellsCount: blockedCells?.length || 0,
        hitCellsCount: hitCells?.length || 0,
        placedObjectsCount: placedObjects?.length || 0,
    });

    const startTime = performance.now();

    try {
        const result = calculateProbabilities(
            objects,
            blockedCells,
            hitCells,
            placedObjects
        );
        const endTime = performance.now();
        const calculationTime = endTime - startTime;

        console.log('[ProbabilityWorker] Sending response:', {
            id,
            calculationTime: `${calculationTime.toFixed(2)}ms`,
            probabilitiesSize: `${result.probabilities[0]?.length || 0}x${result.probabilities.length || 0}`,
            objectProbabilitiesCount: result.objectProbabilities?.length || 0,
        });

        const response = {
            id,
            probabilities: result.probabilities,
            objectProbabilities: result.objectProbabilities,
            calculationTime,
        };

        self.postMessage(response);
    } catch (error) {
        const calculationTime = performance.now() - startTime;
        console.error('[ProbabilityWorker] Calculation failed:', {
            id,
            error: error.message,
            calculationTime: `${calculationTime.toFixed(2)}ms`,
        });

        const response = {
            id,
            probabilities: [],
            objectProbabilities: [],
            error:
                error instanceof Error ? error.message : 'Calculation failed',
            calculationTime,
        };

        self.postMessage(response);
    }
};
