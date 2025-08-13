// Web Worker for probability calculation with advanced optimizations
const GRID_WIDTH = 9;
const GRID_HEIGHT = 5;
const TOTAL_CELLS = GRID_WIDTH * GRID_HEIGHT;

// Enhanced performance optimization constants
const OPTIMIZATION_CONFIG = {
    MAX_CALCULATION_TIME: 30000,
    PROGRESS_REPORT_INTERVAL: 2000,
    MEMOIZATION_CLEANUP_THRESHOLD: 500000,
    MAX_VALID_CONFIGURATIONS: 1000000,
    MONTE_CARLO_THRESHOLD: 0, // Always use Monte Carlo (set to 0)
    MONTE_CARLO_SAMPLES: 1000000, // 더 많은 샘플로 정확도 향상
    MONTE_CARLO_CONVERGENCE_CHECK: 25000, // 더 자주 수렴 체크
    MONTE_CARLO_TOLERANCE: 0.0005, // 더 엄격한 수렴 기준
    SYMMETRY_BREAKING_AGGRESSIVE: false,
    USE_DANCING_LINKS: false,
    USE_CONSTRAINT_PROPAGATION: false,
    USE_ADVANCED_PRUNING: false,
    USE_GRID_DECOMPOSITION: false,
    DECOMPOSITION_THRESHOLD: 10, // Split if more than 10 objects
};

// Arc Consistency Constraint Propagation (AC-3 Algorithm)
class ConstraintPropagator {
    constructor(gridWidth, gridHeight, blockedCells) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.blockedCells = new Set(blockedCells.map((c) => `${c.x},${c.y}`));
        this.domains = new Map(); // Variable -> Set of possible values
        this.constraints = new Map(); // Variable -> Set of constraints
    }

    // Initialize domains for all placement variables
    initializeDomains(objects) {
        objects.forEach((obj, objIndex) => {
            const { w, h, count } = obj;
            for (let instance = 0; instance < count; instance++) {
                const varName = `obj_${objIndex}_${instance}`;
                const domain = new Set();

                // Generate all possible placements for this object instance
                const orientations = this.getOrientations(w, h);
                for (const { w: ow, h: oh } of orientations) {
                    for (let x = 0; x <= this.gridWidth - ow; x++) {
                        for (let y = 0; y <= this.gridHeight - oh; y++) {
                            if (this.isValidPosition(x, y, ow, oh)) {
                                domain.add(`${x},${y},${ow},${oh}`);
                            }
                        }
                    }
                }
                this.domains.set(varName, domain);
            }
        });
    }

    getOrientations(w, h) {
        if (w === h) return [{ w, h }];
        return [
            { w, h },
            { w: h, h: w },
        ];
    }

    isValidPosition(x, y, w, h) {
        for (let dx = 0; dx < w; dx++) {
            for (let dy = 0; dy < h; dy++) {
                if (this.blockedCells.has(`${x + dx},${y + dy}`)) {
                    return false;
                }
            }
        }
        return true;
    }

    // Add constraint between two variables (they cannot overlap)
    addNonOverlapConstraint(var1, var2) {
        if (!this.constraints.has(var1)) {
            this.constraints.set(var1, new Set());
        }
        if (!this.constraints.has(var2)) {
            this.constraints.set(var2, new Set());
        }
        this.constraints.get(var1).add(var2);
        this.constraints.get(var2).add(var1);
    }

    // Check if two placements overlap
    placementsOverlap(placement1, placement2) {
        const [x1, y1, w1, h1] = placement1.split(',').map(Number);
        const [x2, y2, w2, h2] = placement2.split(',').map(Number);

        return !(
            x1 + w1 <= x2 ||
            x2 + w2 <= x1 ||
            y1 + h1 <= y2 ||
            y2 + h2 <= y1
        );
    }

    // AC-3 Algorithm for constraint propagation
    ac3() {
        const queue = [];

        // Initialize queue with all arcs
        for (const [var1, neighbors] of this.constraints) {
            for (const var2 of neighbors) {
                queue.push([var1, var2]);
            }
        }

        while (queue.length > 0) {
            const [xi, xj] = queue.shift();

            if (this.revise(xi, xj)) {
                if (this.domains.get(xi).size === 0) {
                    return false; // Inconsistent
                }

                // Add all arcs (xk, xi) where xk is neighbor of xi
                for (const xk of this.constraints.get(xi) || []) {
                    if (xk !== xj) {
                        queue.push([xk, xi]);
                    }
                }
            }
        }
        return true; // Consistent
    }

    // Revise domain of xi with respect to xj
    revise(xi, xj) {
        let revised = false;
        const domainXi = this.domains.get(xi);
        const domainXj = this.domains.get(xj);

        for (const valueXi of domainXi) {
            let hasSupport = false;

            for (const valueXj of domainXj) {
                if (!this.placementsOverlap(valueXi, valueXj)) {
                    hasSupport = true;
                    break;
                }
            }

            if (!hasSupport) {
                domainXi.delete(valueXi);
                revised = true;
            }
        }

        return revised;
    }
}

// Dancing Links Node structure for DLX algorithm
class DancingNode {
    constructor(column = null) {
        this.left = this;
        this.right = this;
        this.up = this;
        this.down = this;
        this.column = column;
        this.size = 0;
        this.name = '';
    }
}

// Grid Decomposer for mathematical decomposition
class GridDecomposer {
    constructor(gridWidth, gridHeight, blockedCells) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.blockedCells = new Set(blockedCells.map((c) => `${c.x},${c.y}`));
        this.subgrids = [];
    }

    // Decompose grid into independent subregions
    decompose(objects) {
        // Simple horizontal decomposition for now
        // More sophisticated algorithms can be implemented
        const subgridHeight = Math.ceil(this.gridHeight / 2);

        for (let i = 0; i < 2; i++) {
            const startY = i * subgridHeight;
            const endY = Math.min((i + 1) * subgridHeight, this.gridHeight);

            if (startY < endY) {
                const subgrid = {
                    x: 0,
                    y: startY,
                    width: this.gridWidth,
                    height: endY - startY,
                    blockedCells: [],
                    canFitObjects: [],
                };

                // Filter blocked cells for this subgrid
                for (const cell of this.blockedCells) {
                    const [x, y] = cell.split(',').map(Number);
                    if (y >= startY && y < endY) {
                        subgrid.blockedCells.push({ x, y: y - startY });
                    }
                }

                // Determine which objects can fit in this subgrid
                objects.forEach((obj, objIndex) => {
                    if (obj.h <= subgrid.height) {
                        subgrid.canFitObjects.push(objIndex);
                    }
                });

                this.subgrids.push(subgrid);
            }
        }

        return this.subgrids;
    }

    // Check if decomposition is beneficial
    shouldDecompose(objects) {
        return objects.length >= OPTIMIZATION_CONFIG.DECOMPOSITION_THRESHOLD;
    }
}

// Enhanced Branch and Bound solver
class BranchAndBoundSolver {
    constructor(gridWidth, gridHeight, blockedCells) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.blockedCells = blockedCells;
        this.bestBound = Infinity;
        this.solutions = [];
    }

    // Calculate lower bound for remaining objects
    calculateLowerBound(placementIndex, occupiedCells, remainingObjects) {
        const freeCells =
            this.gridWidth * this.gridHeight -
            occupiedCells -
            this.blockedCells.length;
        const requiredCells = remainingObjects.reduce(
            (sum, obj) => sum + obj.w * obj.h * obj.count,
            0
        );

        if (requiredCells > freeCells) {
            return Infinity; // Impossible to fit
        }

        // More sophisticated bounds can be calculated here
        return requiredCells;
    }

    // Calculate upper bound estimate
    calculateUpperBound(placementIndex, occupiedCells, remainingObjects) {
        // Optimistic estimate assuming perfect packing
        const freeCells =
            this.gridWidth * this.gridHeight -
            occupiedCells -
            this.blockedCells.length;
        return freeCells;
    }

    // Prune based on bounds
    shouldPrune(placementIndex, occupiedCells, remainingObjects) {
        const lowerBound = this.calculateLowerBound(
            placementIndex,
            occupiedCells,
            remainingObjects
        );
        const upperBound = this.calculateUpperBound(
            placementIndex,
            occupiedCells,
            remainingObjects
        );

        return lowerBound === Infinity || upperBound < this.bestBound;
    }
}

// Efficient BitMask operations utility
class BitMaskUtils {
    static createMask(cells, gridWidth) {
        let mask = 0n;
        for (const cell of cells) {
            const bitIndex = cell.y * gridWidth + cell.x;
            mask |= 1n << BigInt(bitIndex);
        }
        return mask;
    }

    static checkOverlap(mask1, mask2) {
        return (mask1 & mask2) !== 0n;
    }

    static countBits(mask) {
        let count = 0;
        while (mask > 0n) {
            count += Number(mask & 1n);
            mask >>= 1n;
        }
        return count;
    }

    static getFreeCells(totalCells, occupiedMask, blockedMask) {
        const allCellsMask = (1n << BigInt(totalCells)) - 1n;
        const freeMask = allCellsMask & ~occupiedMask & ~blockedMask;
        return BitMaskUtils.countBits(freeMask);
    }
}

// Enhanced constraint solver using Dancing Links
class ConstraintSolver {
    constructor(gridWidth, gridHeight) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.totalCells = gridWidth * gridHeight;
        this.header = new DancingNode();
        this.solutions = [];
        this.columns = [];
        this.solutionStack = [];
    }

    // Initialize Dancing Links matrix for exact cover
    initializeMatrix(placements, blockedCells) {
        // Create column headers for each grid cell
        const cellColumns = new Map();
        const blockedSet = new Set(blockedCells.map((c) => `${c.x},${c.y}`));

        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (!blockedSet.has(`${x},${y}`)) {
                    const col = new DancingNode();
                    col.name = `cell_${x}_${y}`;
                    col.size = 0;
                    this.columns.push(col);
                    cellColumns.set(`${x},${y}`, col);

                    // Link column to header
                    col.left = this.header.left;
                    col.right = this.header;
                    this.header.left.right = col;
                    this.header.left = col;
                }
            }
        }

        // Create rows for each placement option
        placements.forEach((placementOptions, objectIndex) => {
            placementOptions.forEach((placement, placementIndex) => {
                const rowNodes = [];

                // Create nodes for each cell this placement covers
                placement.cells.forEach((cell) => {
                    const cellKey = `${cell.x},${cell.y}`;
                    const column = cellColumns.get(cellKey);
                    if (column) {
                        const node = new DancingNode(column);
                        node.objectIndex = objectIndex;
                        node.placementIndex = placementIndex;
                        node.placement = placement;

                        // Link vertically
                        node.up = column.up;
                        node.down = column;
                        column.up.down = node;
                        column.up = node;
                        column.size++;

                        rowNodes.push(node);
                    }
                });

                // Link row nodes horizontally
                if (rowNodes.length > 1) {
                    for (let i = 0; i < rowNodes.length; i++) {
                        rowNodes[i].left =
                            rowNodes[
                                (i - 1 + rowNodes.length) % rowNodes.length
                            ];
                        rowNodes[i].right = rowNodes[(i + 1) % rowNodes.length];
                    }
                }
            });
        });
    }

    // Cover column in Dancing Links
    cover(column) {
        column.right.left = column.left;
        column.left.right = column.right;

        for (let i = column.down; i !== column; i = i.down) {
            for (let j = i.right; j !== i; j = j.right) {
                j.down.up = j.up;
                j.up.down = j.down;
                j.column.size--;
            }
        }
    }

    // Uncover column in Dancing Links
    uncover(column) {
        for (let i = column.up; i !== column; i = i.up) {
            for (let j = i.left; j !== i; j = j.left) {
                j.column.size++;
                j.down.up = j;
                j.up.down = j;
            }
        }
        column.right.left = column;
        column.left.right = column;
    }

    // Main DLX search algorithm
    search() {
        if (this.header.right === this.header) {
            // Found a solution
            this.solutions.push([...this.solutionStack]);
            return (
                this.solutions.length <
                OPTIMIZATION_CONFIG.MAX_VALID_CONFIGURATIONS
            );
        }

        // Choose column with minimum size (MRV heuristic)
        let column = null;
        let minSize = Infinity;
        for (let c = this.header.right; c !== this.header; c = c.right) {
            if (c.size < minSize) {
                minSize = c.size;
                column = c;
            }
        }

        if (!column || column.size === 0) {
            return true; // No solution possible
        }

        this.cover(column);

        for (let r = column.down; r !== column; r = r.down) {
            this.solutionStack.push(r);

            // Cover all other columns in this row
            for (let j = r.right; j !== r; j = j.right) {
                this.cover(j.column);
            }

            if (!this.search()) {
                // Stop if we've found enough solutions
                for (let j = r.left; j !== r; j = j.left) {
                    this.uncover(j.column);
                }
                this.solutionStack.pop();
                this.uncover(column);
                return false;
            }

            // Uncover all columns in this row
            for (let j = r.left; j !== r; j = j.left) {
                this.uncover(j.column);
            }
            this.solutionStack.pop();
        }

        this.uncover(column);
        return true;
    }
}

function calculateProbabilities(objects, blockedCells) {
    console.log('[ProbabilityWorker] Starting calculation with:', {
        objects: objects.map((obj) => `${obj.w}x${obj.h}(${obj.count})`),
        blockedCellsCount: blockedCells.length,
        gridSize: `${GRID_WIDTH}x${GRID_HEIGHT}`,
    });

    const calculationStartTime = performance.now();
    let lastProgressReport = calculationStartTime;

    // Initialize probability grid
    const probabilities = Array.from({ length: GRID_HEIGHT }, () =>
        Array(GRID_WIDTH).fill(0.0)
    );

    // Helper function to convert grid position to bit index
    const getBitIndex = (x, y) => {
        return y * GRID_WIDTH + x;
    };

    // Create blocked cells bitmask
    let blockedMask = 0n;
    for (const cell of blockedCells) {
        const bitIndex = getBitIndex(cell.x, cell.y);
        blockedMask |= 1n << BigInt(bitIndex);
    }

    // Helper function to get all valid orientations
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

    // Check if decomposition would be beneficial
    const decomposer = new GridDecomposer(
        GRID_WIDTH,
        GRID_HEIGHT,
        blockedCells
    );
    const shouldDecompose = decomposer.shouldDecompose(objects);

    if (shouldDecompose && OPTIMIZATION_CONFIG.USE_GRID_DECOMPOSITION) {
        console.log(
            '[ProbabilityWorker] Using grid decomposition for',
            objects.length,
            'objects'
        );
        return calculateProbabilitiesWithDecomposition(
            objects,
            blockedCells,
            decomposer
        );
    }

    // Use constraint propagation if enabled
    if (OPTIMIZATION_CONFIG.USE_CONSTRAINT_PROPAGATION) {
        const propagator = new ConstraintPropagator(
            GRID_WIDTH,
            GRID_HEIGHT,
            blockedCells
        );
        propagator.initializeDomains(objects);

        // Add non-overlap constraints between all object instances
        const variables = Array.from(propagator.domains.keys());
        for (let i = 0; i < variables.length; i++) {
            for (let j = i + 1; j < variables.length; j++) {
                propagator.addNonOverlapConstraint(variables[i], variables[j]);
            }
        }

        // Apply constraint propagation
        if (!propagator.ac3()) {
            console.log(
                '[ProbabilityWorker] Constraint propagation detected inconsistency'
            );
            return probabilities; // No solution possible
        }

        console.log(
            '[ProbabilityWorker] Constraint propagation reduced search space'
        );
    }

    // Use Dancing Links if enabled
    if (OPTIMIZATION_CONFIG.USE_DANCING_LINKS) {
        console.log('[ProbabilityWorker] Using Dancing Links algorithm');
        return calculateProbabilitiesWithDancingLinks(objects, blockedCells);
    }

    // Generate all possible placements for each object type
    const allPossiblePlacements = [];
    const objectTypeInfo = [];

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

        objectTypeInfo.push({
            type: objectTypeIndex,
            size: originalW * originalH,
            count,
        });

        // Add multiple instances for each object type based on count
        for (let i = 0; i < count; i++) {
            allPossiblePlacements.push([...placements]);
        }
    });

    if (allPossiblePlacements.length === 0) {
        console.log(
            '[ProbabilityWorker] No possible placements found, returning empty probabilities'
        );
        return probabilities;
    }

    // Always use Monte Carlo for consistent and reliable results
    console.log(
        '[ProbabilityWorker] Using Monte Carlo sampling for reliable probability calculation'
    );
    return calculateProbabilitiesWithMonteCarlo(
        objects,
        blockedCells,
        allPossiblePlacements
    );
}

// Calculate probabilities using Dancing Links algorithm
function calculateProbabilitiesWithDancingLinks(objects, blockedCells) {
    const probabilities = Array.from({ length: GRID_HEIGHT }, () =>
        Array(GRID_WIDTH).fill(0.0)
    );

    const solver = new ConstraintSolver(GRID_WIDTH, GRID_HEIGHT);

    // Generate all possible placements
    const allPlacements = [];
    objects.forEach((obj, objIndex) => {
        const { w, h, count } = obj;
        const placements = [];

        const orientations = [{ w, h }];
        if (w !== h) orientations.push({ w: h, h: w });

        for (const { w: ow, h: oh } of orientations) {
            for (let y = 0; y <= GRID_HEIGHT - oh; y++) {
                for (let x = 0; x <= GRID_WIDTH - ow; x++) {
                    const cells = [];
                    let isValid = true;

                    for (let dy = 0; dy < oh && isValid; dy++) {
                        for (let dx = 0; dx < ow && isValid; dx++) {
                            const cellX = x + dx;
                            const cellY = y + dy;

                            // Check if blocked
                            for (const blocked of blockedCells) {
                                if (
                                    blocked.x === cellX &&
                                    blocked.y === cellY
                                ) {
                                    isValid = false;
                                    break;
                                }
                            }

                            if (isValid) {
                                cells.push({ x: cellX, y: cellY });
                            }
                        }
                    }

                    if (isValid) {
                        for (let instance = 0; instance < count; instance++) {
                            placements.push({
                                objectIndex: objIndex,
                                instance,
                                x,
                                y,
                                w: ow,
                                h: oh,
                                cells,
                            });
                        }
                    }
                }
            }
        }
        allPlacements.push(placements);
    });

    solver.initializeMatrix(allPlacements, blockedCells);
    solver.search();

    // Calculate probabilities from solutions
    if (solver.solutions.length === 0) {
        console.log(
            '[ProbabilityWorker] No solutions found with Dancing Links'
        );
        return probabilities;
    }

    const totalSolutions = solver.solutions.length;
    const cellCoverage = new Map();

    for (const solution of solver.solutions) {
        const coveredCells = new Set();

        for (const node of solution) {
            if (node.placement) {
                for (const cell of node.placement.cells) {
                    coveredCells.add(`${cell.x},${cell.y}`);
                }
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
            probabilities[y][x] = coverage / totalSolutions;
        }
    }

    console.log(
        `[ProbabilityWorker] Dancing Links found ${totalSolutions} solutions`
    );
    return probabilities;
}

// Calculate probabilities with decomposition
function calculateProbabilitiesWithDecomposition(
    objects,
    blockedCells,
    decomposer
) {
    const probabilities = Array.from({ length: GRID_HEIGHT }, () =>
        Array(GRID_WIDTH).fill(0.0)
    );

    const subgrids = decomposer.decompose(objects);

    // For simple implementation, calculate each subgrid independently
    // More sophisticated approaches would consider dependencies
    for (const subgrid of subgrids) {
        const subObjects = objects.filter((_, index) =>
            subgrid.canFitObjects.includes(index)
        );

        if (subObjects.length > 0) {
            const subProbabilities = calculateProbabilities(
                subObjects,
                subgrid.blockedCells
            );

            // Merge back to main grid
            for (let y = 0; y < subgrid.height; y++) {
                for (let x = 0; x < subgrid.width; x++) {
                    const mainY = subgrid.y + y;
                    const mainX = subgrid.x + x;
                    if (mainY < GRID_HEIGHT && mainX < GRID_WIDTH) {
                        probabilities[mainY][mainX] = subProbabilities[y][x];
                    }
                }
            }
        }
    }

    return probabilities;
}

// Calculate probabilities using Branch and Bound
function calculateProbabilitiesWithBnB(
    objects,
    blockedCells,
    allPossiblePlacements,
    bnbSolver
) {
    const probabilities = Array.from({ length: GRID_HEIGHT }, () =>
        Array(GRID_WIDTH).fill(0.0)
    );

    // Enhanced backtracking with Branch and Bound
    const validConfigurations = [];
    const getBitIndex = (x, y) => y * GRID_WIDTH + x;

    // Estimate total possible configurations
    const estimatedConfigurations = estimateTotalConfigurations(
        allPossiblePlacements
    );
    console.log(
        `[ProbabilityWorker] Estimated total configurations: ${estimatedConfigurations}`
    );

    // Use Monte Carlo if estimated configurations exceed threshold
    if (estimatedConfigurations > OPTIMIZATION_CONFIG.MONTE_CARLO_THRESHOLD) {
        console.log(
            '[ProbabilityWorker] Using Monte Carlo sampling due to large search space'
        );
        return calculateProbabilitiesWithMonteCarlo(
            objects,
            blockedCells,
            allPossiblePlacements
        );
    }

    function backtrackBnB(placementIndex, currentConfig, occupiedMask) {
        // Progress reporting
        const currentTime = performance.now();
        if (
            validConfigurations.length % 10000 === 0 &&
            validConfigurations.length > 0
        ) {
            console.log(
                `[ProbabilityWorker] Found ${validConfigurations.length} configurations so far...`
            );
        }

        if (placementIndex >= allPossiblePlacements.length) {
            validConfigurations.push({ placements: [...currentConfig] });
            return;
        }

        // Check if we've found enough configurations for exact calculation
        if (
            validConfigurations.length >=
            OPTIMIZATION_CONFIG.MAX_VALID_CONFIGURATIONS
        ) {
            console.log(
                '[ProbabilityWorker] Switching to Monte Carlo due to too many configurations found'
            );
            return;
        }

        const possiblePlacements = allPossiblePlacements[placementIndex];

        for (const placement of possiblePlacements) {
            if (BitMaskUtils.checkOverlap(occupiedMask, placement.mask)) {
                continue;
            }

            const newOccupiedMask = occupiedMask | placement.mask;
            currentConfig.push(placement);

            backtrackBnB(placementIndex + 1, currentConfig, newOccupiedMask);

            currentConfig.pop();
        }
    }

    console.log('[ProbabilityWorker] Starting exact backtracking...');
    console.log(
        `[ProbabilityWorker] Total placement instances: ${allPossiblePlacements.length}`
    );

    backtrackBnB(0, [], 0n);

    // If we hit the limit, switch to Monte Carlo
    if (
        validConfigurations.length >=
        OPTIMIZATION_CONFIG.MAX_VALID_CONFIGURATIONS
    ) {
        console.log(
            '[ProbabilityWorker] Exact search hit limit, switching to Monte Carlo'
        );
        return calculateProbabilitiesWithMonteCarlo(
            objects,
            blockedCells,
            allPossiblePlacements
        );
    }

    // Calculate final probabilities
    if (validConfigurations.length === 0) {
        console.log('[ProbabilityWorker] No valid configurations found');
        return probabilities;
    }

    console.log(
        `[ProbabilityWorker] Found ${validConfigurations.length} total configurations (exact)`
    );

    const totalConfigurations = validConfigurations.length;
    const cellCoverage = new Map();

    // Count how many times each cell is covered
    for (const config of validConfigurations) {
        const coveredCells = new Set();
        for (const placement of config.placements) {
            for (const cell of placement.cells) {
                coveredCells.add(`${cell.x},${cell.y}`);
            }
        }
        for (const cellKey of coveredCells) {
            cellCoverage.set(cellKey, (cellCoverage.get(cellKey) || 0) + 1);
        }
    }

    // Calculate probabilities as coverage / total configurations
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

    // Debug output
    console.log('[ProbabilityWorker] Sample probabilities:', {
        topLeft: probabilities[0][0],
        center: probabilities[Math.floor(GRID_HEIGHT / 2)][
            Math.floor(GRID_WIDTH / 2)
        ],
        totalConfigurations,
        uniqueCellsCovered: cellCoverage.size,
    });

    return probabilities;
}

// Estimate total number of configurations
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

// Calculate probabilities using Monte Carlo sampling
function calculateProbabilitiesWithMonteCarlo(
    objects,
    blockedCells,
    allPossiblePlacements
) {
    const probabilities = Array.from({ length: GRID_HEIGHT }, () =>
        Array(GRID_WIDTH).fill(0.0)
    );

    console.log('[ProbabilityWorker] Starting Monte Carlo sampling...');

    const cellCoverage = new Map();
    let validSamples = 0;
    let totalSamples = 0;
    const maxSamples = OPTIMIZATION_CONFIG.MONTE_CARLO_SAMPLES;

    // For convergence checking
    let lastCheckpoint = 0;
    let previousProbabilities = new Map();

    const startTime = performance.now();

    while (totalSamples < maxSamples) {
        totalSamples++;

        // Generate a random configuration
        const randomConfig = generateRandomConfiguration(allPossiblePlacements);

        if (randomConfig && isValidConfiguration(randomConfig)) {
            validSamples++;

            // Count cell coverage for this sample
            const coveredCells = new Set();
            for (const placement of randomConfig) {
                for (const cell of placement.cells) {
                    coveredCells.add(`${cell.x},${cell.y}`);
                }
            }

            for (const cellKey of coveredCells) {
                cellCoverage.set(cellKey, (cellCoverage.get(cellKey) || 0) + 1);
            }
        }

        // Progress reporting and convergence check
        if (
            totalSamples % OPTIMIZATION_CONFIG.MONTE_CARLO_CONVERGENCE_CHECK ===
            0
        ) {
            const currentTime = performance.now();
            const validRate = ((validSamples / totalSamples) * 100).toFixed(2);

            console.log(
                `[ProbabilityWorker] Monte Carlo progress: ${totalSamples}/${maxSamples} samples, ${validRate}% valid`
            );

            // Check for convergence
            if (
                validSamples > 0 &&
                totalSamples > OPTIMIZATION_CONFIG.MONTE_CARLO_CONVERGENCE_CHECK
            ) {
                const currentProbs = new Map();
                for (const [cellKey, coverage] of cellCoverage.entries()) {
                    currentProbs.set(cellKey, coverage / validSamples);
                }

                if (hasConverged(previousProbabilities, currentProbs)) {
                    console.log(
                        `[ProbabilityWorker] Monte Carlo converged at ${totalSamples} samples`
                    );
                    break;
                }

                previousProbabilities = new Map(currentProbs);
            }

            // Time limit check
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
        return probabilities;
    }

    // Calculate final probabilities
    for (const [cellKey, coverage] of cellCoverage.entries()) {
        const [x, y] = cellKey.split(',').map(Number);
        if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
            probabilities[y][x] = coverage / validSamples;
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

    console.log(
        `[ProbabilityWorker] Monte Carlo completed: ${validSamples} valid samples out of ${totalSamples} total`
    );

    return probabilities;
}

// Generate a random valid configuration
function generateRandomConfiguration(allPossiblePlacements) {
    const configuration = [];
    let occupiedMask = 0n;

    for (const possiblePlacements of allPossiblePlacements) {
        // Randomly select a placement for this object
        const validPlacements = possiblePlacements.filter(
            (placement) =>
                !BitMaskUtils.checkOverlap(occupiedMask, placement.mask)
        );

        if (validPlacements.length === 0) {
            return null; // No valid placement available
        }

        const randomIndex = Math.floor(Math.random() * validPlacements.length);
        const selectedPlacement = validPlacements[randomIndex];

        configuration.push(selectedPlacement);
        occupiedMask |= selectedPlacement.mask;
    }

    return configuration;
}

// Check if a configuration is valid (no overlaps)
function isValidConfiguration(configuration) {
    let occupiedMask = 0n;

    for (const placement of configuration) {
        if (BitMaskUtils.checkOverlap(occupiedMask, placement.mask)) {
            return false;
        }
        occupiedMask |= placement.mask;
    }

    return true;
}

// Check if Monte Carlo has converged
function hasConverged(previousProbs, currentProbs) {
    if (previousProbs.size === 0) {
        return false;
    }

    let maxDifference = 0;
    const allKeys = new Set([...previousProbs.keys(), ...currentProbs.keys()]);

    for (const key of allKeys) {
        const prevProb = previousProbs.get(key) || 0;
        const currProb = currentProbs.get(key) || 0;
        const difference = Math.abs(prevProb - currProb);
        maxDifference = Math.max(maxDifference, difference);
    }

    return maxDifference < OPTIMIZATION_CONFIG.MONTE_CARLO_TOLERANCE;
}

// Worker message handler
self.onmessage = function (e) {
    const { id, objects, blockedCells } = e.data;
    console.log('[ProbabilityWorker] Received message:', {
        id,
        objectsCount: objects?.length || 0,
        blockedCellsCount: blockedCells?.length || 0,
    });

    const startTime = performance.now();

    try {
        const probabilities = calculateProbabilities(objects, blockedCells);
        const endTime = performance.now();
        const calculationTime = endTime - startTime;

        console.log('[ProbabilityWorker] Sending response:', {
            id,
            calculationTime: `${calculationTime.toFixed(2)}ms`,
            probabilitiesSize: `${probabilities[0]?.length || 0}x${probabilities.length || 0}`,
        });

        const response = {
            id,
            probabilities,
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
            error:
                error instanceof Error ? error.message : 'Calculation failed',
            calculationTime,
        };

        self.postMessage(response);
    }
};
