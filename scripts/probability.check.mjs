import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadWorker } from './probability-worker.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { compileFunction, runInNewContext } from 'node:vm';
import ts from 'typescript';

test('loads worker dependencies from the selected revision', () => {
    const source = readFileSync(
        new URL('../public/probabilityWorker.js', import.meta.url),
        'utf8'
    );
    const expected = { probabilities: [[0.125]], objectProbabilities: [] };
    const requests = [];
    const run = loadWorker(source, (name) => {
        requests.push(name);
        return `self.calculateFrontierProbabilities = () => (${JSON.stringify(expected)});`;
    });
    assert.deepEqual(
        run({ objects: [] }).probabilities,
        expected.probabilities
    );
    assert.deepEqual(requests, ['./exactProbability.js']);
    assert.throws(
        () =>
            loadWorker(source, () => {
                throw new Error('Missing dependency in selected revision');
            }),
        /Missing dependency/
    );
});
test('does not reuse a previous response when a worker stops responding', () => {
    const run = loadWorker(`
        self.onmessage = ({ data }) => {
            if (!data.silent) self.postMessage({ probabilities: [] });
        };
    `);
    assert.deepEqual(run({}).probabilities, []);
    assert.throws(() => run({ silent: true }), /did not respond synchronously/);
});

const exactSource = readFileSync(
    new URL('../public/exactProbability.js', import.meta.url),
    'utf8'
);
const exactWorker = {};
compileFunction(exactSource, ['self'])(exactWorker);
const eventDirectory = new URL(
    '../src/consts/inventory-management/events/',
    import.meta.url
);
for (const file of readdirSync(eventDirectory).filter(
    (file) => file.endsWith('.ts') && file !== 'index.ts'
)) {
    const context = { exports: {} };
    runInNewContext(
        ts.transpileModule(
            readFileSync(new URL(file, eventDirectory), 'utf8'),
            { compilerOptions: { module: ts.ModuleKind.CommonJS } }
        ).outputText,
        context
    );
    for (const event of Object.values(context.exports))
        for (const option of event.caseOptions) {
            test(`exact preset conservation: ${event.id}/${option.value}`, () => {
                const result = exactWorker.calculateFrontierProbabilities(
                    option.objects,
                    []
                );
                assert.ok(result, 'preset must not fall back to sampling');
                result.objectProbabilities.forEach((grid, type) => {
                    const object = option.objects[type];
                    assert.ok(
                        Math.abs(
                            grid.flat().reduce((a, b) => a + b, 0) -
                                object.w * object.h * object.count
                        ) < 1e-9
                    );
                });
                result.probabilities
                    .flat()
                    .forEach((p) => assert.ok(p >= 0 && p <= 1 + 1e-12));
            });
        }
}
test('resource limits return control to the existing fallback', () => {
    let time = 0;
    const limited = {};
    compileFunction(exactSource, ['self', 'performance'])(limited, {
        now: () => (time += 6000),
    });
    assert.equal(
        limited.calculateFrontierProbabilities(
            [
                { w: 2, h: 1, count: 6 },
                { w: 1, h: 3, count: 4 },
                { w: 1, h: 4, count: 2 },
            ],
            []
        ),
        null
    );
    assert.equal(
        exactWorker.calculateFrontierProbabilities(
            Array.from({ length: 37 }, () => ({ w: 1, h: 1, count: 1 })),
            []
        ),
        null
    );
});

const run = loadWorker();
// Independent labelled-instance exhaustive oracle on a small open board.
const enumerate = ({
    objects,
    blockedCells = [],
    hitCells = [],
    placedObjects = [],
}) => {
    const occupied = new Set(
        placedObjects.flatMap(({ cells }) => cells.map(({ x, y }) => y * 9 + x))
    );
    const blocked = new Set(blockedCells.map(({ x, y }) => y * 9 + x));
    const coverage = objects.map(() => Array(45).fill(0));
    const instances = objects.flatMap((o, type) =>
        Array.from({ length: o.count }, () => ({ ...o, type }))
    );
    let total = 0;
    const visit = (i, chosen) => {
        if (i === instances.length) {
            if (!hitCells.every(({ x, y }) => occupied.has(y * 9 + x))) return;
            total++;
            for (const { cells, type } of chosen)
                for (const c of cells) coverage[type][c]++;
            return;
        }
        const { w, h, type } = instances[i];
        for (const [width, height] of w === h
            ? [[w, h]]
            : [
                  [w, h],
                  [h, w],
              ]) {
            for (let y = 0; y + height <= 5; y++)
                for (let x = 0; x + width <= 9; x++) {
                    const cells = [];
                    for (let dy = 0; dy < height; dy++)
                        for (let dx = 0; dx < width; dx++)
                            cells.push((y + dy) * 9 + x + dx);
                    if (cells.some((c) => occupied.has(c) || blocked.has(c)))
                        continue;
                    cells.forEach((c) => occupied.add(c));
                    visit(i + 1, [...chosen, { cells, type }]);
                    cells.forEach((c) => occupied.delete(c));
                }
        }
    };
    visit(0, []);
    return coverage.map((cells) => cells.map((n) => (total ? n / total : 0)));
};
const outside = Array.from({ length: 45 }, (_, i) => ({
    x: i % 9,
    y: Math.floor(i / 9),
})).filter(({ x, y }) => x >= 4 || y >= 3);
const assertMarginals = (actual, expected) => {
    assert.equal(actual.length, expected.length);
    actual.forEach((p, cell) =>
        assert.ok(Math.abs(p - expected[cell]) < 1e-12)
    );
};
for (let seed = 0; seed < 48; seed++) {
    test(`matches exhaustive marginals ${seed}`, () => {
        const input = {
            objects: [
                { w: 1 + (seed % 3), h: 1, count: 1 + (seed % 2) },
                { w: 1, h: 2, count: seed % 3 === 0 ? 0 : 1 },
            ],
            blockedCells: [
                ...outside,
                ...(seed % 4 === 0 ? [{ x: 1, y: 1 }] : []),
            ],
            hitCells: seed % 3 === 0 ? [{ x: 0, y: 0 }] : [],
            placedObjects:
                seed % 5 === 0 ? [{ w: 1, h: 1, cells: [{ x: 0, y: 0 }] }] : [],
        };
        const expected = enumerate(input);
        const result = run(input);
        assert.equal(result.objectProbabilities.length, input.objects.length);
        result.objectProbabilities.forEach((grid, type) =>
            assertMarginals(grid.flat(), expected[type])
        );
        const total = Array.from({ length: 45 }, (_, cell) =>
            expected.reduce((sum, cells) => sum + cells[cell], 0)
        );
        assertMarginals(result.probabilities.flat(), total);
    });
}
test('large custom rectangles, empty and impossible inputs', () => {
    assert.equal(
        run({ objects: [{ w: 9, h: 5, count: 1 }] })
            .probabilities.flat()
            .every((p) => p === 1),
        true
    );
    for (const objects of [
        [],
        [{ w: 10, h: 10, count: 1 }],
        [{ w: 1, h: 1, count: 46 }],
    ]) {
        assert.equal(
            run({ objects })
                .probabilities.flat()
                .every((p) => p === 0),
            true
        );
    }
    assert.throws(
        () => run({ objects: [{ w: 0, h: 1, count: 1 }] }),
        /Invalid/
    );
});
