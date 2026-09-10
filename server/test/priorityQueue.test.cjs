const assert = require('assert');
const { MaxHeap, calculatePriorityScore, getTopImportantFiles } = require('../services/priorityQueueService');

console.log('🧪 RUNNING PHASE 8 PRIORITY QUEUE (MAX-HEAP DSA) TESTS...\n');

// 1. Test Max-Heap Invariants & Operations
const heap = new MaxHeap();
console.log('1. Testing Max-Heap insertion and heapification:');
heap.insert('File A', 45);
heap.insert('File B', 120);
heap.insert('File C', 500);
heap.insert('File D', 15);
heap.insert('File E', 250);

assert.strictEqual(heap.size(), 5, 'Heap size should be 5');
assert.strictEqual(heap.peek().priority, 500, 'Max priority element should be at the root');
console.log('   ✅ Peak element correctly points to max priority (500)');

console.log('\n2. Testing extractMax() order:');
const extractedPriorities = [];
while (!heap.isEmpty()) {
  const node = heap.extractMax();
  extractedPriorities.push(node.priority);
}

console.log('   Extracted priorities:', extractedPriorities);
assert.deepStrictEqual(
  extractedPriorities,
  [500, 250, 120, 45, 15],
  'Items must be extracted in strictly non-increasing priority order'
);
console.log('   ✅ extractMax() maintains Max-Heap invariant (O(log N))');

// 3. Test Priority Scoring Factors
console.log('\n3. Testing Composite Priority Score calculation:');
const now = Date.now();

// Case A: Unpinned, low access, 2 hours ago
const fileNormal = {
  fileName: 'Normal.txt',
  isPinned: false,
  accessCount: 2,
  lastAccessed: new Date(now - 2 * 60 * 60 * 1000)
};
const scoreNormal = calculatePriorityScore(fileNormal);
console.log('   Normal File Score:', scoreNormal.totalScore, scoreNormal.factors);
assert(scoreNormal.totalScore > 0, 'Score should be positive');

// Case B: Frequently accessed file (15 accesses)
const fileFrequent = {
  fileName: 'Frequent.txt',
  isPinned: false,
  accessCount: 15,
  lastAccessed: new Date(now - 2 * 60 * 60 * 1000)
};
const scoreFrequent = calculatePriorityScore(fileFrequent);
console.log('   Frequent File Score:', scoreFrequent.totalScore, scoreFrequent.factors);
assert(scoreFrequent.totalScore > scoreNormal.totalScore, 'Frequent file must score higher than normal file');

// Case C: Pinned file (+500 pts)
const filePinned = {
  fileName: 'Pinned.txt',
  isPinned: true,
  accessCount: 1,
  lastAccessed: new Date(now - 5 * 60 * 60 * 1000)
};
const scorePinned = calculatePriorityScore(filePinned);
console.log('   Pinned File Score:', scorePinned.totalScore, scorePinned.factors);
assert(scorePinned.totalScore >= 500, 'Pinned file must get +500 points boost');
assert(scorePinned.totalScore > scoreFrequent.totalScore, 'Pinned file should outrank unpinned frequent file');

// Case D: Inactivity cooling decay (Serverless/Vercel JIT decay)
const fileOldActive = {
  fileName: 'OldActive.txt',
  isPinned: false,
  accessCount: 20, // 20 * 25 = 500 pts raw
  lastAccessed: new Date(now - 35 * 24 * 60 * 60 * 1000) // 35 days ago (coolingMultiplier = 0.5)
};
const scoreOldActive = calculatePriorityScore(fileOldActive);
console.log('   Old Active File Score (35 days inactive):', scoreOldActive.totalScore, scoreOldActive.factors);
assert.strictEqual(scoreOldActive.factors.coolingMultiplier, 0.5, 'Must apply 50% cooling for >30 days inactive');
assert.strictEqual(scoreOldActive.factors.frequencyPoints, 250, 'Frequency points should be cooled to 250');
console.log('   ✅ JIT inactivity cooling decay accurately reduces points without background cron jobs');
console.log('   ✅ Composite priority scoring matches PRD & Architecture specifications');

// 4. Test getTopImportantFiles Ranking
console.log('\n4. Testing getTopImportantFiles ranking with Max-Heap:');
const mockFiles = [
  fileNormal,
  fileFrequent,
  filePinned,
  {
    fileName: 'SuperTrending.txt',
    isPinned: false,
    accessCount: 30, // 30 * 25 = 750 pts
    lastAccessed: new Date(now - 10 * 60 * 1000)
  },
  {
    fileName: 'OldStale.txt',
    isPinned: false,
    accessCount: 0,
    lastAccessed: new Date(now - 30 * 24 * 60 * 60 * 1000) // 30 days ago
  }
];

const top3 = getTopImportantFiles(mockFiles, 3);
console.log('   Top 3 Important Files:');
top3.forEach((f, idx) => {
  console.log(`   #${idx + 1} [Score: ${f.priorityScore}] ${f.fileName} (Pinned: ${f.rankingFactors.isPinned}, Accesses: ${f.rankingFactors.accessCount})`);
});

assert.strictEqual(top3.length, 3, 'Should extract exactly top 3');
assert.strictEqual(top3[0].fileName, 'SuperTrending.txt', 'SuperTrending (750+ pts) must be #1');
assert.strictEqual(top3[1].fileName, 'Pinned.txt', 'Pinned (500+ pts) must be #2');
assert.strictEqual(top3[2].fileName, 'Frequent.txt', 'Frequent must be #3');
console.log('   ✅ getTopImportantFiles correctly sorted by Max-Heap Priority Queue!');

console.log('\n🎉 ALL PHASE 8 PRIORITY QUEUE TESTS PASSED SUCCESSFULLY!\n');
