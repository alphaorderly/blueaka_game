// Scan columns, keeping five base-10 digits of remaining occupied width.
// Equal instances are indistinguishable: their factorial multiplicity cancels
// in every marginal. Separate input types keep separate probability grids.
const calculateFrontierProbabilities = (
    objects,
    blockedCells,
    hitCells = [],
    placedObjects = []
) => {
    const grid = () => Array.from({ length: 5 }, () => Array(9).fill(0));
    const probabilities = grid();
    const objectProbabilities = objects.map(grid);
    const empty = { probabilities, objectProbabilities };
    const blocked = new Set(blockedCells.map(({ x, y }) => x * 5 + y));
    const fixed = new Set(
        placedObjects.flatMap(({ cells }) => cells.map(({ x, y }) => x * 5 + y))
    );
    const hits = new Set(hitCells.map(({ x, y }) => x * 5 + y));
    if ([...hits].some((p) => blocked.has(p) && !fixed.has(p))) return empty;
    const unavailable = new Set([...blocked, ...fixed]);
    const powers = [1, 10, 100, 1000, 10000];
    let radix = 1;
    let initialCounts = 0;
    let area = 0;
    const types = objects.map(({ w, h, count }, type) => {
        if (
            ![w, h, count].every(Number.isInteger) ||
            w < 1 ||
            h < 1 ||
            count < 0
        ) {
            throw new Error('Invalid rectangle dimensions or count');
        }
        const unit = radix;
        radix *= count + 1;
        initialCounts += count * unit;
        area += w * h * count;
        return { w, h, count, unit, type };
    });
    if (area > 45 - unavailable.size) return empty;
    // Fall back to the existing bounded sampler for unusually complex custom events.
    if (!Number.isSafeInteger(radix * 100000)) return null;
    const candidates = Array.from({ length: 45 }, (_, p) => {
        const x = Math.floor(p / 5);
        const y = p % 5;
        return types.flatMap(({ w, h, count, unit, type }) => {
            if (!count) return [];
            const orientations =
                w === h
                    ? [[w, h]]
                    : [
                          [w, h],
                          [h, w],
                      ];
            return orientations.flatMap(([width, height]) => {
                if (x + width > 9 || y + height > 5) return [];
                const cells = [];
                for (let dx = 0; dx < width; dx++) {
                    for (let dy = 0; dy < height; dy++)
                        cells.push(p + dx * 5 + dy);
                }
                if (cells.some((cell) => unavailable.has(cell))) return [];
                const rows = powers.slice(y, y + height);
                return [
                    {
                        cells,
                        rows,
                        add: width * rows.reduce((a, b) => a + b, 0),
                        unit,
                        count,
                        type,
                    },
                ];
            });
        });
    });
    const remainingArea = new Map();
    const freeSuffix = Array(46).fill(0);
    for (let p = 44; p >= 0; p--)
        freeSuffix[p] = freeSuffix[p + 1] + (unavailable.has(p) ? 0 : 1);
    const memo = Array.from({ length: 46 }, () => new Map());
    let states = 0;
    const start = performance.now();
    const budgetExceeded = {};
    // Transitions are regenerated in the forward pass rather than retained as a graph.
    const edges = (p, profile, counts, visit) => {
        const digit = powers[p % 5];
        if (Math.floor(profile / digit) % 10 > 0) {
            visit(profile - digit, counts, null);
            return;
        }
        if (!hits.has(p) || fixed.has(p)) visit(profile, counts, null);
        for (const candidate of candidates[p]) {
            if (
                Math.floor(counts / candidate.unit) % (candidate.count + 1) ===
                0
            )
                continue;
            if (
                candidate.rows.some((row) => Math.floor(profile / row) % 10 > 0)
            )
                continue;
            visit(
                profile + candidate.add - digit,
                counts - candidate.unit,
                candidate
            );
        }
    };
    const suffix = (p, profile, counts) => {
        if (p === 45) return counts === 0 && profile === 0 ? 1 : 0;
        const key = profile * radix + counts;
        const cached = memo[p].get(key);
        if (cached !== undefined) return cached;
        let needed = remainingArea.get(counts);
        if (needed === undefined) {
            needed = types.reduce(
                (sum, type) =>
                    sum +
                    (Math.floor(counts / type.unit) % (type.count + 1)) *
                        type.w *
                        type.h,
                0
            );
            remainingArea.set(counts, needed);
        }
        const occupied = powers.reduce(
            (sum, digit) => sum + (Math.floor(profile / digit) % 10),
            0
        );
        if (needed + occupied > freeSuffix[p]) return 0;
        states++;
        if (
            states > 750000 ||
            (states % 4096 === 0 && performance.now() - start > 5000)
        )
            throw budgetExceeded;
        let total = 0;
        edges(p, profile, counts, (nextProfile, nextCounts) => {
            total += suffix(p + 1, nextProfile, nextCounts);
        });
        memo[p].set(key, total);
        return total;
    };
    let total;
    try {
        total = suffix(0, 0, initialCounts);
    } catch (error) {
        if (error === budgetExceeded) return null;
        throw error;
    }
    if (!total) return empty;
    // Prefix probability times suffix count gives each placement's marginal.
    let prefixes = new Map([[initialCounts, 1 / total]]);
    for (let p = 0; p < 45; p++) {
        const next = new Map();
        for (const [key, prefix] of prefixes) {
            const profile = Math.floor(key / radix);
            const counts = key % radix;
            edges(p, profile, counts, (nextProfile, nextCounts, placement) => {
                const completions = suffix(p + 1, nextProfile, nextCounts);
                if (!completions) return;
                const nextKey = nextProfile * radix + nextCounts;
                next.set(nextKey, (next.get(nextKey) || 0) + prefix);
                if (placement) {
                    const weight = prefix * completions;
                    for (const cell of placement.cells) {
                        const x = Math.floor(cell / 5);
                        const y = cell % 5;
                        probabilities[y][x] += weight;
                        objectProbabilities[placement.type][y][x] += weight;
                    }
                }
            });
        }
        prefixes = next;
    }
    return { probabilities, objectProbabilities };
};
self.calculateFrontierProbabilities = calculateFrontierProbabilities;
