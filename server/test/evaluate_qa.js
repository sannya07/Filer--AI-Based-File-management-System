const { chunkText, rankAndSelectChunks, extractKeywords } = require('../services/chunkingService');
const { answerFileQuestion, generateGroundedFallbackAnswer } = require('../services/qaService');

const testDoc = `
AWS Cloud Security Architecture Guide:
1. Identity and Access Management (IAM):
   AWS Identity and Access Management (IAM) is a web service that helps you securely control access to AWS resources.
   With IAM, you can centrally manage permissions that analyze what AWS resources a user or application can access.
   IAM policies are JSON documents that define permissions. You attach policies to IAM users, groups, or roles.
   Multi-Factor Authentication (MFA) must be enabled on all root accounts and privileged administrator accounts.

2. Amazon S3 Bucket Encryption & Security:
   Amazon Simple Storage Service (Amazon S3) provides object storage with 99.999999999% (11 9's) of data durability.
   All S3 buckets must enforce server-side encryption with AWS KMS keys (SSE-KMS) or Amazon S3 managed keys (SSE-S3).
   S3 Block Public Access must be enabled at the account level to prevent accidental public data exposure.
   Object versioning should be enabled to protect against accidental overwrites or malicious deletions.

3. Amazon Virtual Private Cloud (VPC) Subnets:
   Amazon VPC enables you to launch AWS resources into a virtual network that you've defined.
   Subnets must be partitioned into public subnets for internet-facing load balancers and private subnets for application workloads and databases.
   Security groups act as virtual stateful firewalls for your instances to control inbound and outbound traffic.
   Network Access Control Lists (NACLs) provide stateless subnet-level traffic filtering.

4. Audit Logging & Compliance:
   AWS CloudTrail records API calls and account activity across your AWS infrastructure.
   CloudTrail logs must be continuously delivered to an encrypted, write-protected S3 bucket.
   Amazon GuardDuty uses machine learning to detect unauthorized behavior and malicious activity.
`;

const mockFile = {
  fileName: 'AWS_Cloud_Security_Guide.txt',
  category: 'Study Material',
  summary: 'Comprehensive guide to AWS Cloud Security, IAM, S3, VPC, and CloudTrail.'
};

const mockBuffer = Buffer.from(testDoc, 'utf-8');

async function evaluateChunkingAndQA() {
  console.log('================================================================');
  console.log('🔬 DEEP INSPECTION: CHUNK PROCESSING & ANSWER ACCURACY EVALUATION');
  console.log('================================================================\n');

  // STEP 1: Inspect Chunk Generation
  console.log('--- [STEP 1: CHUNK GENERATION & OVERLAP INSPECTION] ---');
  const chunks = chunkText(testDoc, { chunkSize: 500, overlap: 100 });
  console.log(`Document total characters: ${testDoc.length}`);
  console.log(`Chunks produced: ${chunks.length}\n`);

  chunks.forEach((chunk) => {
    console.log(`📌 Chunk #${chunk.index} [Chars ${chunk.startChar} - ${chunk.endChar}] (${chunk.wordCount} words):`);
    console.log(`   "${chunk.text.substring(0, 80).replace(/\n/g, ' ')}..."\n`);
  });

  // STEP 2: Evaluate Accuracy on Diverse Query Types
  const testCases = [
    {
      type: 'FACTUAL LOOKUP',
      question: 'What are IAM policies and how are they formatted?',
      expectedKeywords: ['json', 'policies', 'permissions'],
      shouldAnswer: true
    },
    {
      type: 'SECURITY CONTROL DETAIL',
      question: 'What encryption is required for Amazon S3 buckets?',
      expectedKeywords: ['kms', 'sse', 'encryption'],
      shouldAnswer: true
    },
    {
      type: 'ARCHITECTURE CONCEPT',
      question: 'What is the difference between public and private subnets in a VPC?',
      expectedKeywords: ['public', 'private', 'subnets', 'workloads'],
      shouldAnswer: true
    },
    {
      type: 'COMPLIANCE AUDIT',
      question: 'What service records API calls across the AWS infrastructure?',
      expectedKeywords: ['cloudtrail', 'logs', 'api'],
      shouldAnswer: true
    },
    {
      type: 'IRRELEVANT / OUT OF CONTEXT (GROUNDING TEST)',
      question: 'What is the recipe for baking chocolate brownies?',
      expectedKeywords: ['chocolate', 'brownie', 'recipe'],
      shouldAnswer: false
    },
    {
      type: 'TRICK QUESTION (Security keyword, but irrelevant topic)',
      question: 'What is the 3-digit CVV security code on a Visa credit card?',
      expectedKeywords: ['visa', 'credit', 'cvv'],
      shouldAnswer: false
    },
    {
      type: 'SUMMARY / OVERVIEW QUESTION',
      question: 'Can you summarize this document for me?',
      expectedKeywords: ['aws', 'security', 'iam'],
      shouldAnswer: true
    }
  ];

  console.log('--- [STEP 2: TEST CASES & ANSWER ACCURACY EVALUATION] ---');

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    console.log(`\n----------------------------------------------------------------`);
    console.log(`Test Case #${i + 1} [${tc.type}]`);
    console.log(`❓ Question: "${tc.question}"`);

    // 1. Chunk selection
    const topChunks = rankAndSelectChunks(chunks, tc.question, 2);
    console.log(`   Top Chunk Selected: #${topChunks[0]?.index} (Score: ${topChunks[0]?.score}%, Matched terms: [${topChunks[0]?.matchedTerms.join(', ')}])`);

    // 2. Generate answer
    const result = await answerFileQuestion(mockFile, mockBuffer, tc.question, []);
    console.log(`💬 Generated Answer:`);
    console.log(`   "${result.answer}"`);

    // 3. Evaluate accuracy
    let isCorrect = false;
    if (tc.shouldAnswer) {
      const lowerAns = result.answer.toLowerCase();
      const hasKeyMatch = tc.expectedKeywords.some((kw) => lowerAns.includes(kw));
      const notRefused = !lowerAns.includes('cannot find the answer');
      isCorrect = hasKeyMatch && notRefused;
      console.log(`   🎯 Verification: ${isCorrect ? '✅ ACCURATE (Correctly answered with document facts)' : '❌ INACCURATE'}`);
    } else {
      const lowerAns = result.answer.toLowerCase();
      const correctlyRefused = lowerAns.includes('cannot find the answer') || lowerAns.includes('does not contain');
      isCorrect = correctlyRefused;
      console.log(`   🛡️ Strict Grounding: ${isCorrect ? '✅ PASS (Correctly refused to hallucinate)' : '❌ FAIL (Hallucinated out-of-context info)'}`);
    }

    // 4. Source references check
    console.log(`   📚 Source Chunks Returned: ${result.sources.length} sources (Scores: ${result.sources.map(s => s.score + '%').join(', ')})`);
  }

  console.log('\n================================================================');
  console.log('🏁 CHUNK PROCESSING & ANSWER ACCURACY EVALUATION COMPLETE');
  console.log('================================================================\n');
}

evaluateChunkingAndQA();
