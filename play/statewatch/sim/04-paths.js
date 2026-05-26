// Path enumeration over the checkout state machine's flow region.
// Counts distinct simple paths (no repeated states) from CartEmpty to
// Confirmation. Run with: node 04-paths.js

const graph = {
  CartEmpty:              ['CartHasItems'],
  CartHasItems:           ['CartHasItems', 'CartEmpty', 'Review', 'CartInventoryWarning'],
  CartInventoryWarning:   ['CartHasItems'],
  Review:                 ['CartHasItems', 'PaymentMethodSelection', 'CartInventoryWarning'],
  PaymentMethodSelection: ['PaymentEntering'],
  PaymentEntering:        ['PaymentValidating'],
  PaymentValidating:      ['PaymentEntering', 'PaymentProcessing'],
  PaymentProcessing:      ['PaymentThreeDS', 'PaymentDeclined', 'Confirmation', 'PaymentTimeout'],
  PaymentThreeDS:         ['PaymentProcessing', 'PaymentDeclined', 'PaymentEntering'],
  PaymentDeclined:        ['PaymentEntering'],
  PaymentTimeout:         ['PaymentEntering'],
  Confirmation:           [],
};

const START = 'CartEmpty';
const END   = 'Confirmation';

// We allow revisits (retry loops are real user journeys) but cap depth
// so the search terminates.
const MAX_LEN = 12;

const paths = [];
function dfs(node, path) {
  if (path.length > MAX_LEN) return;
  if (node === END) {
    paths.push([...path, node]);
    return;
  }
  for (const next of graph[node]) {
    dfs(next, [...path, node]);
  }
}
dfs(START, []);

console.log(`Distinct paths from ${START} to ${END}, length <= ${MAX_LEN}: ${paths.length}`);

// Shortest & longest
const sorted = paths.slice().sort((a, b) => a.length - b.length);
console.log(`Shortest: ${sorted[0].length - 1} transitions`);
console.log(`  ${sorted[0].join(' -> ')}`);
console.log(`Longest:  ${sorted[sorted.length - 1].length - 1} transitions`);
console.log(`  ${sorted[sorted.length - 1].join(' -> ')}`);

// Path length distribution
const dist = {};
for (const p of paths) {
  const len = p.length - 1;
  dist[len] = (dist[len] || 0) + 1;
}
console.log(`\nPath-length distribution:`);
for (const [len, count] of Object.entries(dist).sort((a, b) => +a[0] - +b[0])) {
  console.log(`  ${len} transitions: ${count} path${count === 1 ? '' : 's'}`);
}

// How many of these paths go through PaymentDeclined at least once?
const viaDeclined = paths.filter(p => p.includes('PaymentDeclined')).length;
console.log(`\nPaths that route through PaymentDeclined: ${viaDeclined}`);
const via3DS = paths.filter(p => p.includes('PaymentThreeDS')).length;
console.log(`Paths that route through PaymentThreeDS:  ${via3DS}`);
const viaTimeout = paths.filter(p => p.includes('PaymentTimeout')).length;
console.log(`Paths that route through PaymentTimeout:  ${viaTimeout}`);
