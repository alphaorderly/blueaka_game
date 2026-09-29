import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import { posix } from 'node:path';
import ts from 'typescript';
import vm from 'node:vm';
import { loadWorker } from './probability-worker.mjs';

const baseline = process.argv[2] || 'c047317';
const readBaseline = (name) =>
    execFileSync('git', ['show', `${baseline}:${posix.join('public', name)}`], {
        encoding: 'utf8',
    });
const before = loadWorker(readBaseline('probabilityWorker.js'), readBaseline);
const after = loadWorker();
const runners = { before, after };
const events = ['shaleFinalReport', 'secretMidnightParty'].map((name) => {
    const source = readFileSync(
        `src/consts/inventory-management/events/${name}.ts`,
        'utf8'
    );
    const compiled = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText;
    const context = { exports: {} };
    vm.runInNewContext(compiled, context);
    return Object.values(context.exports)[0];
});
console.log(
    JSON.stringify({
        baseline,
        node: process.version,
        cpu: os.cpus()[0].model,
        repeats: 3,
        cache: false,
    })
);
const cases = [
    ['shale-1', events[0].caseOptions[0].objects],
    ['shale-3', events[0].caseOptions[2].objects],
    ['shale-7', events[0].caseOptions[3].objects],
    ['midnight-7', events[1].caseOptions[3].objects],
];
for (const [name, objects] of [...cases, ['shale-3-blocked', cases[1][1]]]) {
    const input = {
        objects,
        blockedCells: name.endsWith('blocked')
            ? Array.from({ length: 5 }, (_, y) => ({ x: 0, y }))
            : [],
    };
    before(input);
    after(input);
    const samples = { before: [], after: [] };
    for (let i = 0; i < 3; i++) {
        for (const label of i % 2 ? ['after', 'before'] : ['before', 'after']) {
            const response = runners[label](input);
            samples[label].push(response.calculationTime);
            if (
                response.probabilities.length !== 5 ||
                response.objectProbabilities.length !== objects.length
            )
                throw new Error('Invalid output shape');
        }
    }
    const median = (values) => [...values].sort((a, b) => a - b)[1];
    const beforeMs = median(samples.before);
    const afterMs = median(samples.after);
    console.log(
        JSON.stringify({
            name,
            input,
            samples,
            beforeMs,
            afterMs,
            speedup: beforeMs / afterMs,
            reductionPercent: (1 - afterMs / beforeMs) * 100,
        })
    );
}
