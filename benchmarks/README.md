# Probability engine benchmark

Baseline: `c047317` (`upstream/master`). Node.js v25.9.0, AMD Ryzen 5 5600G,
one thread. Actual worker scripts run with browser messaging shimmed; worker
startup, React rendering and debounce time are excluded. Each input receives one
warm-up per engine, then three measurements with alternating execution order.
The baseline worker and its imported scripts come from the same Git revision.
The table reports medians, with no result-cache reuse. The original sampler
retains its random source, convergence checks and full sampling budget.

| Board                              | Before (ms) | After (ms) | Speedup | Less time |
| ---------------------------------- | ----------: | ---------: | ------: | --------: |
| Shale 1/4                          |     1,276.9 |       17.8 |   71.7× |     98.6% |
| Shale 3/6                          |     3,608.0 |    1,210.9 |    3.0× |     66.4% |
| Shale 7+                           |       720.8 |        3.3 |  216.9× |     99.5% |
| Midnight 7+                        |     1,980.6 |      202.3 |    9.8× |     89.8% |
| Shale 3/6, leftmost column blocked |     4,663.8 |      640.6 |    7.3× |     86.3% |

[Raw samples and exact inputs](probability.jsonl). These are local engine timings,
not end-to-end browser speedups; three samples do not establish performance on
other devices.

```sh
yarn test-once
yarn benchmark-probability c047317
yarn build
```

## Behavior and limits

The solver scans the 9×5 board along its narrow dimension, memoizing remaining
counts and a five-row occupancy profile. A second traversal accumulates all
per-type and total cell marginals. It supports any positive integer rectangle
that fits the board in either orientation, including dimensions greater than 4.
Blocked cells, required hits, fixed occupied cells, and zero-count types retain
separate handling. Fixed placements are excluded from the returned remaining-object
coverage, as before.

The probability model is uniform over valid configurations, evaluated with
floating-point counts; it does not reproduce the original sampler's
order-dependent bias.
At 750,000 states, five seconds of backward traversal, or an unsafe numeric state
key, calculation returns to the existing enumeration/sampling fallback. That
fallback remains approximate for large custom cases and may take its existing
30-second budget in addition to the frontier attempt.

The hook ignores cell and fixed-placement order in cache keys while preserving
object type order. It cancels stale workers, starts isolated requests immediately,
and serves cache hits without a debounce. Rapid changes are coalesced within a
150 ms scheduling window.
Cell rankings treat differences up to `1e-12` as ties so floating-point round-off
does not split symmetric maxima into different ranks.
