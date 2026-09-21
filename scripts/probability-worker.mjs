import { readFileSync } from 'node:fs';
import { compileFunction } from 'node:vm';

const readPublicScript = (name) =>
    readFileSync(new URL(`../public/${name}`, import.meta.url), 'utf8');

// Execute the actual classic-worker scripts, with only browser messaging shimmed.
// compileFunction avoids VM sandbox global-lookup overhead in the timed loop.
export const loadWorker = (
    source = readPublicScript('probabilityWorker.js'),
    readScript = readPublicScript
) => {
    let response;
    const self = {
        postMessage: (message) => {
            response = message;
        },
    };
    const importScripts = (...names) => {
        for (const name of names)
            compileFunction(readScript(name), ['self', 'performance'])(
                self,
                performance
            );
    };
    compileFunction(source, [
        'self',
        'performance',
        'console',
        'importScripts',
    ])(self, performance, { log: () => {}, error: () => {} }, importScripts);
    return (input) => {
        response = undefined;
        self.onmessage({ data: { id: 'test', blockedCells: [], ...input } });
        if (!response) throw new Error('Worker did not respond synchronously');
        if (response.error) throw new Error(response.error);
        return response;
    };
};
