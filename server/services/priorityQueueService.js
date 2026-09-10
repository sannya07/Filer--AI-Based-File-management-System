/**
 * Priority Queue (Max-Heap) Data Structure & Document Ranking Service
 * Complies with doc/PRD.md (AR-4 Priority Queue) & doc/Architecture.md (Section 13)
 */

class MaxHeap {
  constructor() {
    this.heap = [];
  }

  parent(index) {
    return Math.floor((index - 1) / 2);
  }

  leftChild(index) {
    return 2 * index + 1;
  }

  rightChild(index) {
    return 2 * index + 2;
  }

  swap(i, j) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }

  /**
   * Inserts an item with priority into the Max-Heap in O(log N)
   * @param {any} item 
   * @param {number} priority 
   */
  insert(item, priority) {
    const node = { item, priority };
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  bubbleUp(index) {
    while (index > 0) {
      const parentIdx = this.parent(index);
      if (this.heap[index].priority > this.heap[parentIdx].priority) {
        this.swap(index, parentIdx);
        index = parentIdx;
      } else {
        break;
      }
    }
  }

  /**
   * Retrieves and removes the highest priority item in O(log N)
   * @returns {{ item: any, priority: number } | null}
   */
  extractMax() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const max = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.bubbleDown(0);
    return max;
  }

  bubbleDown(index) {
    const length = this.heap.length;
    while (true) {
      let largest = index;
      const left = this.leftChild(index);
      const right = this.rightChild(index);

      if (left < length && this.heap[left].priority > this.heap[largest].priority) {
        largest = left;
      }

      if (right < length && this.heap[right].priority > this.heap[largest].priority) {
        largest = right;
      }

      if (largest !== index) {
        this.swap(index, largest);
        index = largest;
      } else {
        break;
      }
    }
  }

  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }
}

/**
 * Calculates dynamic composite priority score for a document
 * Ranking Factors per Architecture Section 13:
 * 1. User Pin status (High priority weight: +500 pts)
 * 2. Access Frequency (accessCount * 25 pts)
 * 3. Recent Access (Time decay up to +100 pts)
 * @param {Object} file - File metadata document
 * @returns {{ totalScore: number, factors: Object }}
 */
const calculatePriorityScore = (file) => {
  if (!file) return { totalScore: 0, factors: {} };

  // 1. User-Pinned status factor
  const isPinned = Boolean(file.isPinned);
  const pinPoints = isPinned ? 500 : 0;

  // 2. Timestamp delta & Recency calculation (Lazy JIT evaluation without crons)
  const accessTimestamp = file.lastAccessed
    ? new Date(file.lastAccessed).getTime()
    : new Date(file.uploadedAt || Date.now()).getTime();

  const hoursElapsed = Math.max(0, (Date.now() - accessTimestamp) / (1000 * 60 * 60));
  const daysElapsed = hoursElapsed / 24;

  let recencyPoints = 0;
  if (hoursElapsed < 1) {
    recencyPoints = 100; // Accessed in last hour
  } else if (hoursElapsed <= 24) {
    recencyPoints = Math.max(20, Math.round(100 - hoursElapsed * 3.3)); // Accessed today
  } else if (hoursElapsed <= 168) {
    recencyPoints = Math.max(5, Math.round(20 - daysElapsed * 2)); // Accessed this week
  } else {
    recencyPoints = 0;
  }

  // 3. Dynamic Inactivity Cooling on Access Frequency (Vercel/Serverless Native)
  // Evaluates on-demand when user activates without needing background cron daemons
  let coolingMultiplier = 1.0;
  if (daysElapsed > 90) {
    coolingMultiplier = 0.2; // 80% cooling if untouched for 3+ months
  } else if (daysElapsed > 30) {
    coolingMultiplier = 0.5; // 50% cooling if untouched for 1+ month
  } else if (daysElapsed > 7) {
    coolingMultiplier = 0.75; // 25% cooling if untouched for 1+ week
  }

  const rawAccessCount = Number(file.accessCount) || 0;
  const frequencyPoints = Math.round(rawAccessCount * 25 * coolingMultiplier);

  const totalScore = pinPoints + frequencyPoints + recencyPoints;

  return {
    totalScore,
    factors: {
      isPinned,
      pinPoints,
      accessCount: rawAccessCount,
      coolingMultiplier,
      frequencyPoints,
      lastAccessed: file.lastAccessed || file.uploadedAt,
      hoursElapsed: Math.round(hoursElapsed * 10) / 10,
      daysElapsed: Math.round(daysElapsed * 10) / 10,
      recencyPoints
    }
  };
};

/**
 * Ranks all user files using Max-Heap Priority Queue and extracts top K important files
 * Time Complexity: O(N log N) insertion + O(K log N) extraction
 * @param {Array<Object>} files 
 * @param {number} limit 
 * @returns {Array<Object>} Top K ranked files with priority metadata
 */
const getTopImportantFiles = (files = [], limit = 6) => {
  if (!Array.isArray(files) || files.length === 0) return [];

  const maxHeap = new MaxHeap();

  // Insert each file into the Max-Heap with its computed priority score
  files.forEach((file) => {
    const { totalScore, factors } = calculatePriorityScore(file);
    maxHeap.insert({ file, factors, priorityScore: totalScore }, totalScore);
  });

  // Extract the top K elements
  const topImportant = [];
  const countToExtract = Math.min(limit, maxHeap.size());

  for (let i = 0; i < countToExtract; i++) {
    const node = maxHeap.extractMax();
    if (node) {
      topImportant.push({
        ...node.item.file.toObject ? node.item.file.toObject() : node.item.file,
        priorityScore: node.item.priorityScore,
        rankingFactors: node.item.factors
      });
    }
  }

  return topImportant;
};

module.exports = {
  MaxHeap,
  calculatePriorityScore,
  getTopImportantFiles
};
