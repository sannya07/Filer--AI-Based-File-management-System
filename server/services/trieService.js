/**
 * Trie Data Structure for O(L) Prefix Search & Autocomplete
 * TRD Section 13 & PRD AR-2
 */

class TrieNode {
  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
    // Stores associated metadata for autocomplete results
    this.metadataList = [];
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  /**
   * Normalizes string to lowercase alphanumeric tokens
   */
  _normalize(text) {
    if (!text || typeof text !== 'string') return '';
    return text.trim().toLowerCase();
  }

  /**
   * Inserts a word/token into the Trie with associated file metadata in O(L) time
   * @param {string} word - The term to index
   * @param {Object} metadata - File details: { fileId, fileName, category, subcategory }
   * @param {string} type - 'filename' | 'tag' | 'category' | 'word'
   */
  insert(word, metadata = {}, type = 'filename') {
    const cleanWord = this._normalize(word);
    if (!cleanWord) return;

    let current = this.root;

    for (let i = 0; i < cleanWord.length; i++) {
      const char = cleanWord[i];
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char);
    }

    current.isEndOfWord = true;

    // Check if this metadata is already recorded to avoid exact duplicates
    const alreadyExists = current.metadataList.some(
      (item) => item.text === cleanWord && item.fileId?.toString() === metadata.fileId?.toString()
    );

    if (!alreadyExists) {
      current.metadataList.push({
        text: cleanWord,
        displayText: word,
        type,
        fileId: metadata.fileId || null,
        fileName: metadata.fileName || word,
        category: metadata.category || '',
        subcategory: metadata.subcategory || '',
        fileType: metadata.fileType || ''
      });
    }
  }

  /**
   * Checks if an exact word exists in the Trie
   * @param {string} word 
   * @returns {boolean}
   */
  search(word) {
    const cleanWord = this._normalize(word);
    if (!cleanWord) return false;

    let current = this.root;
    for (let i = 0; i < cleanWord.length; i++) {
      const char = cleanWord[i];
      if (!current.children.has(char)) {
        return false;
      }
      current = current.children.get(char);
    }

    return current.isEndOfWord;
  }

  /**
   * Retrieves autocomplete suggestions matching a prefix in O(L + K) time
   * @param {string} prefix - Search prefix
   * @param {number} limit - Maximum number of suggestions to return
   * @returns {Array} List of matching suggestion items
   */
  getSuggestions(prefix, limit = 8) {
    const cleanPrefix = this._normalize(prefix);
    if (!cleanPrefix) return [];

    let current = this.root;

    // 1. Traverse to the node representing the prefix: O(L)
    for (let i = 0; i < cleanPrefix.length; i++) {
      const char = cleanPrefix[i];
      if (!current.children.has(char)) {
        return []; // Prefix not found
      }
      current = current.children.get(char);
    }

    // 2. Perform BFS / DFS traversal from prefix node to gather suggestions: O(K)
    const suggestions = [];
    const queue = [current];
    const seenWords = new Set();

    while (queue.length > 0 && suggestions.length < limit) {
      const node = queue.shift();

      if (node.isEndOfWord && node.metadataList.length > 0) {
        for (const meta of node.metadataList) {
          const uniqueKey = `${meta.type}:${meta.text}:${meta.fileId || ''}`;
          if (!seenWords.has(uniqueKey)) {
            seenWords.add(uniqueKey);
            suggestions.push({
              text: meta.text,
              displayText: meta.displayText,
              type: meta.type,
              fileId: meta.fileId,
              fileName: meta.fileName,
              category: meta.category,
              subcategory: meta.subcategory,
              fileType: meta.fileType,
              matchedPrefix: cleanPrefix
            });
            if (suggestions.length >= limit) break;
          }
        }
      }

      // Add child nodes to queue (sorted for deterministic output)
      const sortedKeys = Array.from(node.children.keys()).sort();
      for (const key of sortedKeys) {
        queue.push(node.children.get(key));
      }
    }

    return suggestions;
  }
}

/**
 * Builds an in-memory Trie populated with a user's files and metadata
 * Indexes:
 * - Full file names (e.g., 'resume.pdf')
 * - Base name without extension (e.g., 'resume')
 * - Sub-words inside file name split by punctuation or space (e.g., 'AWS', 'Security', 'Architecture')
 * - Tags (e.g., 'cloud', 'deeplearning')
 * - Categories & subcategories
 * @param {Array} files - Array of File documents
 * @returns {Trie}
 */
const buildUserTrie = (files = []) => {
  const trie = new Trie();

  files.forEach((file) => {
    const fileId = file._id.toString();
    const baseMeta = {
      fileId,
      fileName: file.fileName,
      category: file.category || '',
      subcategory: file.subcategory || '',
      fileType: file.fileType || ''
    };

    // 1. Index full file name
    trie.insert(file.fileName, baseMeta, 'filename');

    // 2. Index base name without extension
    const lastDotIndex = file.fileName.lastIndexOf('.');
    if (lastDotIndex > 0) {
      const baseName = file.fileName.substring(0, lastDotIndex);
      trie.insert(baseName, baseMeta, 'filename');
    }

    // 3. Index sub-words from file name (split by _, -, ., and spaces)
    const words = file.fileName.split(/[\s_\-.]+/).filter((w) => w.length > 1);
    words.forEach((w) => {
      trie.insert(w, baseMeta, 'word');
    });

    // 4. Index tags
    if (Array.isArray(file.tags)) {
      file.tags.forEach((tag) => {
        if (tag && typeof tag === 'string') {
          trie.insert(tag, baseMeta, 'tag');
        }
      });
    }

    // 5. Index Category & Subcategory
    if (file.category && file.category !== 'Others') {
      trie.insert(file.category, baseMeta, 'category');
    }
    if (file.subcategory) {
      trie.insert(file.subcategory, baseMeta, 'subcategory');
    }
  });

  return trie;
};

module.exports = {
  TrieNode,
  Trie,
  buildUserTrie
};
