const assert = require('assert');
const { Trie, buildUserTrie } = require('../services/trieService');

console.log('🧪 Running Trie DSA Unit Tests...');

// 1. Basic Trie Operations
const trie = new Trie();
trie.insert('resume.pdf', { fileId: '1' }, 'filename');
trie.insert('research.docx', { fileId: '2' }, 'filename');
trie.insert('report.pdf', { fileId: '3' }, 'filename');
trie.insert('AWS_Guide.txt', { fileId: '4' }, 'filename');

// Exact Search
assert.strictEqual(trie.search('resume.pdf'), true, 'Exact match for resume.pdf should be true');
assert.strictEqual(trie.search('RESUME.PDF'), true, 'Case insensitive exact match should be true');
assert.strictEqual(trie.search('resume'), false, 'Partial prefix search via search() should be false');
assert.strictEqual(trie.search('nonexistent.txt'), false, 'Non-existent term should be false');

// Prefix Suggestions (TRD Section 13 Example)
const suggestionsRe = trie.getSuggestions('re');
console.log('Suggestions for "re":', suggestionsRe.map((s) => s.displayText));

assert.strictEqual(suggestionsRe.length >= 3, true, 'Should find at least 3 suggestions for "re"');
const reNames = suggestionsRe.map((s) => s.displayText.toLowerCase());
assert.ok(reNames.includes('resume.pdf'), 'Should include resume.pdf');
assert.ok(reNames.includes('research.docx'), 'Should include research.docx');
assert.ok(reNames.includes('report.pdf'), 'Should include report.pdf');

// Non-matching prefix
const suggestionsXyz = trie.getSuggestions('xyz');
assert.strictEqual(suggestionsXyz.length, 0, 'Non-existent prefix should return empty list');

// 2. buildUserTrie Testing
const mockFiles = [
  {
    _id: '101',
    fileName: 'FullStack_MERN_Guide.pdf',
    category: 'Projects',
    subcategory: 'MERN',
    tags: ['react', 'express', 'mongodb']
  },
  {
    _id: '102',
    fileName: 'AWS_Cloud_Security.txt',
    category: 'Study Material',
    subcategory: 'AWS',
    tags: ['cloud', 'security', 'iam']
  }
];

const userTrie = buildUserTrie(mockFiles);

// Test sub-word match: 'mern'
const mernSuggestions = userTrie.getSuggestions('mern');
assert.ok(mernSuggestions.length > 0, 'Should find suggestions for sub-word "mern"');

// Test tag match: 'rea'
const tagSuggestions = userTrie.getSuggestions('rea');
assert.ok(tagSuggestions.some((s) => s.text === 'react'), 'Should suggest tag "react" for prefix "rea"');

// Test category match: 'pro'
const catSuggestions = userTrie.getSuggestions('pro');
assert.ok(catSuggestions.some((s) => s.text === 'projects'), 'Should suggest category "projects" for prefix "pro"');

console.log('✅ ALL TRIE DSA UNIT TESTS PASSED 100%!');
