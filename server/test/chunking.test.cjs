const assert = require('assert');
const { chunkText, rankAndSelectChunks, extractKeywords } = require('../services/chunkingService');
const { generateGroundedFallbackAnswer } = require('../services/qaService');

console.log('🧪 RUNNING PHASE 7 CHUNKING & GROUNDED Q&A TESTS...\n');

// 1. Test Keywords Extraction
const keywords = extractKeywords('What is AWS Cloud Security Architecture and IAM policy?');
console.log('1. Extracted Keywords:', keywords);
assert(keywords.includes('aws'), 'Should include aws');
assert(keywords.includes('cloud'), 'Should include cloud');
assert(keywords.includes('security'), 'Should include security');
assert(keywords.includes('architecture'), 'Should include architecture');
assert(keywords.includes('iam'), 'Should include iam');
assert(!keywords.includes('what'), 'Should filter out stop word "what"');
assert(!keywords.includes('is'), 'Should filter out stop word "is"');
console.log('   ✅ Keyword extraction passed');

// 2. Test Chunking
const sampleDoc = `
Cloud Computing Overview:
Cloud computing provides on-demand availability of computer system resources, especially data storage and computing power.
AWS IAM (Identity and Access Management) enables you to manage access to AWS services and resources securely.
Using IAM, you can create and manage AWS users and groups, and use permissions to allow and deny their access to AWS resources.
S3 (Simple Storage Service) is an object storage service offering industry-leading scalability, data availability, and security.
Amazon Virtual Private Cloud (VPC) lets you provision a logically isolated section of the AWS Cloud where you can launch AWS resources.
Virtual Private Networks (VPN) establish a protected network connection when using public networks.
Encryption at rest and encryption in transit are mandatory security controls for enterprise compliance.
`;

const chunks = chunkText(sampleDoc, { chunkSize: 250, overlap: 60 });
console.log(`\n2. Document Chunking (${chunks.length} chunks generated):`);
chunks.forEach((c) => console.log(`   Chunk #${c.index} [chars ${c.startChar}-${c.endChar} | words ${c.wordCount}]: "${c.text.substring(0, 50)}..."`));
assert(chunks.length >= 2, 'Should create multiple chunks for long document');
console.log('   ✅ Chunking with overlapping sliding window passed');

// 3. Test Relevance Ranking
const relevantChunks = rankAndSelectChunks(chunks, 'How does IAM manage user permissions?', 2);
console.log('\n3. Top Ranked Chunks for "How does IAM manage user permissions?":');
relevantChunks.forEach((c) => console.log(`   Score: ${c.score}% | Matches: [${c.matchedTerms.join(', ')}] | Snippet: "${c.text.substring(0, 60)}..."`));
assert(relevantChunks.length > 0, 'Should return top chunks');
assert(relevantChunks[0].text.toLowerCase().includes('iam'), 'Top chunk must contain IAM');
assert(relevantChunks[0].score > 40, 'Relevance score should be significant');
console.log('   ✅ Chunk relevance ranking passed');

// 4. Test Strict Grounding (Relevant Question vs Irrelevant Question)
console.log('\n4. Strict Grounding Verification:');

// 4a. Relevant question
const answerRelevant = generateGroundedFallbackAnswer(
  'What is IAM?',
  relevantChunks,
  'AWS_Cloud_Security_Guide.txt'
);
console.log('   [Relevant Question Answer]:', answerRelevant);
assert(answerRelevant.includes('AWS IAM') || answerRelevant.includes('Identity and Access Management'), 'Answer should cite document details');

// 4b. Irrelevant question (Out of context)
const irrelevantChunks = rankAndSelectChunks(chunks, 'Who won the 2022 FIFA World Cup in Qatar?', 2);
const answerIrrelevant = generateGroundedFallbackAnswer(
  'Who won the 2022 FIFA World Cup in Qatar?',
  irrelevantChunks,
  'AWS_Cloud_Security_Guide.txt'
);
console.log('   [Irrelevant Question Answer]:', answerIrrelevant);
assert(
  answerIrrelevant.includes('I cannot find the answer to this question in the provided document'),
  'System must refuse to answer out-of-context questions (Strict Grounding rule)'
);
console.log('   ✅ Strict Grounding constraint (FR-37) passed!');

console.log('\n🎉 ALL PHASE 7 UNIT TESTS PASSED SUCCESSFULLY!\n');
